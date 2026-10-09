// CommerceService: la única lógica de comercio. Corre igual en:
//   - Edge Functions (PgRepo + API real de Stripe),
//   - tests (MemoryRepo / PgRepo + Stripe falso),
//   - el juego publicado (MemoryRepo + Stripe simulado, sin red).
// Regla de oro: todo proveedor termina en `fulfillOrder` / `grant` → ENTITLEMENT ACTIVO.
// Nunca se confía en el cliente: usuario desde la sesión, producto desde el catálogo, precio desde el servidor.
import { CATALOG, getProduct } from '../catalog/catalog.js';
import { productState } from './visibility.js';
import { activeEntitlements, productEntitlements } from './entitlements.js';
import { choosePaymentProvider } from './router.js';
import { resolveConfig } from './config.js';
import { verifyStripeSignature } from './stripeSignature.js';
import { sanitizeEvent, funnel } from './analytics.js';

const ZERO_DECIMAL = ['JPY', 'KRW', 'CLP', 'VND', 'ISK', 'HUF', 'TWD'];
export class CommerceError extends Error {
  constructor(code, status = 400, extra = {}) { super(code); this.code = code; this.status = status; Object.assign(this, extra); }
}
const req = (cond, code, status = 400, extra) => { if (!cond) throw new CommerceError(code, status, extra); };
const shortRef = id => String(id).replace(/-/g, '').slice(0, 10).toUpperCase();

export function createCommerceService({ repo, catalog = CATALOG, config: cfg = {}, stripe = null, env = {}, clock = () => new Date(), ids = () => crypto.randomUUID(), verifiers = {}, log = () => {} }) {
  const config = resolveConfig(undefined, cfg);
  const environment = env.environment || config.environment || 'development';
  const now = () => clock();
  const productOrThrow = sku => { const p = getProduct(sku, catalog); req(p && typeof sku === 'string', 'unknown_product', 404); return p; };

  async function limit(kind, key) {
    const [max, win] = (config.rateLimits && config.rateLimits[kind]) || [30, 60];
    const ok = await repo.hitRateLimit(`${kind}:${key}`, win, max, now().getTime());
    req(ok, 'rate_limited', 429);
  }
  async function entitlementsOf(userId) { return activeEntitlements(await repo.listGrants(userId)); }
  async function audit(t, e) { await t.insertPurchaseEvent(Object.assign({ id: ids(), at: now().toISOString() }, e)); }
  function userCtx(user, ents, extra = {}) { return Object.assign({ environment, isTester: !!user.isTester, entitlements: ents, currency: 'EUR' }, extra); }

  // ---------------- Catálogo para un usuario ----------------
  async function storefront(user, game = {}) {
    const ents = user ? await entitlementsOf(user.id) : [];
    const ctx = userCtx(user || {}, ents, { game });
    return { catalogVersion: catalog.version, entitlements: ents, products: catalog.products.filter(p => p.status !== 'draft' && p.status !== 'retired').map(p => Object.assign({ sku: p.id, type: p.type, name: p.name, status: p.status }, productState(p, ctx, config))) };
  }

  // ---------------- Checkout (web: Stripe Checkout Session) ----------------
  /** @param {{id: string, isTester?: boolean}|null} user @param {{sku?: string, platform?: string, currency?: string, successUrl?: string, cancelUrl?: string, consentWithdrawal?: boolean}} [opts] */
  async function createCheckout(user, opts = {}) {
    const { sku, platform = 'web', currency = 'EUR', successUrl, cancelUrl, consentWithdrawal } = opts;
    req(user && user.id, 'auth_required', 401);
    await limit('checkout', user.id);
    req(config.commerceEnabled, 'commerce_disabled', 403);
    const product = productOrThrow(sku);
    // UE: contenido digital entregado al momento → consentimiento expreso de perder el desistimiento (requiere revisión legal)
    req(consentWithdrawal === true || !config.requireWithdrawalConsent, 'withdrawal_consent_required', 400);
    // Menores de 13: sin el permiso de su madre, padre o tutor no se abre ningún pago (lo decide el perfil del SERVIDOR)
    const prof = repo.getProfile ? await repo.getProfile(user.id) : null;
    req(!(prof && prof.ageBand === 'u13' && prof.parentalStatus !== 'approved'), 'parental_consent_required', 403);
    const ents = await entitlementsOf(user.id);
    const st = productState(product, userCtx(user, ents, { currency }), config);
    req(st.purchasable, st.blocked || 'not_purchasable', st.blocked === 'owned' ? 409 : 403, { requires: st.requires });
    const route = choosePaymentProvider(product, { platform }, config);
    req(route.provider === 'stripe' || (route.provider === 'mock' && stripe && stripe.mock), 'provider_not_allowed', 403, { reason: route.reason });
    req(stripe, 'stripe_not_configured', 503);
    req(!stripe.livemode || (environment === 'production' && config.liveModeAllowed), 'live_mode_not_allowed', 403);
    // Precio SIEMPRE del servidor (BD); el cliente no manda precio
    const price = await repo.getPrice(sku, currency);
    req(price && Number.isInteger(price.amountMinor) && price.amountMinor > 0, 'no_price', 409);
    // Reutiliza una orden abierta con sesión vigente (evita duplicados)
    const open = await repo.findOpenOrder(user.id, sku, now().toISOString());
    if (open && open.checkoutUrl) return { orderId: open.id, orderRef: shortRef(open.id), url: open.checkoutUrl, reused: true };
    // Stripe Customer: uno por usuario
    let acc = await repo.getCommerceAccount(user.id);
    if (!acc || !acc.stripeCustomerId) {
      const c = await stripe.createCustomer({ metadata: { user_id: user.id } }, `customer_${user.id}`);
      acc = await repo.setStripeCustomer(user.id, c.id);
    }
    const orderId = ids();
    await repo.createOrder({ id: orderId, userId: user.id, sku, provider: 'stripe', status: 'CREATED', amountMinor: price.amountMinor, currency, environment, catalogVersion: catalog.version, platform, withdrawalConsentAt: consentWithdrawal ? now().toISOString() : null, createdAt: now().toISOString() });
    const prov = await repo.getProviderIds(sku, 'stripe', environment);
    const lineItem = prov && prov.priceId ? { price: prov.priceId, quantity: 1 }
      : (environment === 'production' ? null : { quantity: 1, price_data: { currency: currency.toLowerCase(), unit_amount: price.amountMinor, product_data: { name: product.name, metadata: { product_id: sku } } } });
    req(lineItem, 'stripe_price_not_mapped', 503);
    const meta = { user_id: user.id, product_id: sku, order_id: orderId, catalog_version: String(catalog.version) };
    const base = env.appUrl || 'http://localhost:5173';
    const params = {
      mode: 'payment', customer: acc.stripeCustomerId, client_reference_id: orderId, line_items: [lineItem], metadata: meta,
      payment_intent_data: { metadata: meta },
      success_url: successUrl || `${base}/?compra=verificando&order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${base}/?compra=cancelada&order=${orderId}`,
      expires_at: Math.floor(now().getTime() / 1000) + 30 * 60,
    };
    if (config.stripeTaxEnabled) Object.assign(params, { automatic_tax: { enabled: true }, customer_update: { address: 'auto' }, billing_address_collection: 'required' });
    const session = await stripe.createCheckoutSession(params, `checkout_${orderId}`);
    await repo.transitionOrder(orderId, 'PENDING', { providerCheckoutId: session.id, checkoutUrl: session.url, expiresAt: new Date(params.expires_at * 1000).toISOString() });
    await audit(repo, { orderId, userId: user.id, type: 'checkout_started', data: { sku, provider: 'stripe' } });
    return { orderId, orderRef: shortRef(orderId), url: session.url };
  }

  // ---------------- Entrega (idempotente) ----------------
  async function fulfillOrder(orderId) {
    return repo.tx(async t => {
      const o = await t.getOrder(orderId, { forUpdate: true });
      req(o, 'order_not_found', 404);
      if (o.status === 'FULFILLED') return o;
      req(o.status === 'PAID', 'order_not_paid', 409, { status: o.status });
      const product = productOrThrow(o.sku);
      for (const e of productEntitlements(product)) {
        const r = await t.insertGrant({ id: ids(), userId: o.userId, entitlementId: e, source: o.provider, sourcePurchaseId: o.providerPaymentId || o.id, orderId: o.id, productId: o.sku, grantedAt: now().toISOString(), status: 'active' });
        if (r.created) await audit(t, { orderId: o.id, userId: o.userId, type: 'entitlement_granted', data: { entitlementId: e } });
      }
      const done = await t.transitionOrder(o.id, 'FULFILLED', { fulfilledAt: now().toISOString(), fulfillmentError: null });
      return done || o;
    });
  }
  async function safeFulfill(orderId) {
    try { return await fulfillOrder(orderId); }
    catch (e) { await repo.patchOrder(orderId, { fulfillmentError: String(e.code || e.message) }); throw e; }   // el pago queda registrado; reintentable
  }

  // ---------------- Webhook de Stripe ----------------
  async function handleStripeWebhook(rawBody, signatureHeader) {
    const event = await verifyStripeSignature(rawBody, signatureHeader, env.stripeWebhookSecret, { now: Math.floor(now().getTime() / 1000) });
    const expectLive = environment === 'production' && config.liveModeAllowed;
    req(!!event.livemode === expectLive, 'livemode_mismatch', 400);
    const rec = await repo.recordProviderEvent({ provider: 'stripe', eventId: event.id, type: event.type, payload: event, receivedAt: now().toISOString() });
    if (!rec.isNew && rec.status === 'processed') return { ok: true, duplicate: true };
    try {
      const result = await dispatchStripe(event);
      await repo.markProviderEvent('stripe', event.id, 'processed', null);
      return Object.assign({ ok: true }, result);
    } catch (e) {
      await repo.markProviderEvent('stripe', event.id, 'error', String(e.code || e.message));
      throw e;
    }
  }
  async function orderFromSession(s) {
    const id = (s.metadata && s.metadata.order_id) || s.client_reference_id;
    return (id && await repo.getOrder(id)) || await repo.findOrderByCheckout(s.id);
  }
  async function onSessionPaid(s, eventType) {
    const order = await orderFromSession(s);
    if (!order) return { ignored: 'order_not_found' };
    req(!s.metadata || !s.metadata.user_id || s.metadata.user_id === order.userId, 'user_mismatch', 400);
    // Importe y moneda deben coincidir con la orden (antes de impuestos)
    const sub = s.amount_subtotal != null ? s.amount_subtotal : s.amount_total;
    if (sub !== order.amountMinor || String(s.currency || '').toUpperCase() !== order.currency) {
      // El cliente ha pagado pero no cuadra: no se entrega automáticamente; queda PAID con error para el panel admin
      const pi0 = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent && s.payment_intent.id;
      if (s.payment_status === 'paid' && ['CREATED', 'PENDING', 'FAILED', 'CANCELLED'].includes(order.status)) await repo.transitionOrder(order.id, 'PAID', { providerPaymentId: pi0, paidAt: now().toISOString() });
      await repo.patchOrder(order.id, { fulfillmentError: 'amount_mismatch' });
      await audit(repo, { orderId: order.id, userId: order.userId, type: 'amount_mismatch', data: { got: sub, currency: s.currency } });
      return { needsAttention: 'amount_mismatch' };
    }
    if (eventType === 'checkout.session.completed' && s.payment_status === 'unpaid') {
      if (order.status === 'CREATED') await repo.transitionOrder(order.id, 'PENDING', {});
      return { pending: true };
    }
    const pi = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent && s.payment_intent.id;
    if (['CREATED', 'PENDING', 'FAILED', 'CANCELLED'].includes(order.status)) {
      const tax = (s.total_details && s.total_details.amount_tax) || 0;
      await repo.tx(async t => {
        await t.transitionOrder(order.id, 'PAID', { providerPaymentId: pi, paidAt: now().toISOString(), country: s.customer_details && s.customer_details.address && s.customer_details.address.country || null });
        await t.insertPayment({ id: ids(), orderId: order.id, userId: order.userId, provider: 'stripe', providerPaymentId: pi || `cs:${s.id}`, grossMinor: s.amount_total, taxMinor: tax, providerFeeMinor: null, platformFeeMinor: 0, netMinor: null, currency: order.currency, country: s.customer_details && s.customer_details.address && s.customer_details.address.country || null, createdAt: now().toISOString() });
        await audit(t, { orderId: order.id, userId: order.userId, type: 'paid', data: { eventType } });
      });
    }
    // ¿Llegó antes un reembolso (eventos desordenados)? Entonces no se entrega.
    const orphans = pi ? await repo.findOrphanRefunds(pi) : [];
    if (orphans.length) {
      for (const r of orphans) await repo.attachRefund(r.id, order.id);
      const total = orphans.reduce((a, r) => Math.max(a, r.amountMinor), 0);
      if (total >= s.amount_total) {
        await repo.tx(async t => {
          await t.transitionOrder(order.id, 'REFUNDED', { refundedAt: now().toISOString() });
          await t.setGrantStatus({ orderId: order.id }, 'revoked', { reason: 'refund', ref: orphans[0].providerRefundId, at: now().toISOString() });
        });
        return { refundedBeforeFulfillment: true };
      }
    }
    const cur = await repo.getOrder(order.id);
    if (cur.status !== 'PAID') return { status: cur.status };   // ya entregada, reembolsada o en disputa: no se toca
    const done = await safeFulfill(order.id);
    await feeBestEffort(order.id, pi);
    return { fulfilled: done.status === 'FULFILLED', orderId: order.id };
  }
  async function feeBestEffort(orderId, pi) {
    if (!pi || !stripe || !stripe.retrievePaymentIntent) return;
    try {
      const p = await stripe.retrievePaymentIntent(pi);
      const bt = p && p.latest_charge && p.latest_charge.balance_transaction;
      if (bt && typeof bt === 'object') await repo.updatePaymentFees(orderId, { providerFeeMinor: bt.fee, netMinor: bt.net });
    } catch (e) { log('fee_lookup_failed', e.message); }
  }
  async function dispatchStripe(event) {
    const o = event.data && event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        return onSessionPaid(o, event.type);
      case 'checkout.session.async_payment_failed': {
        const order = await orderFromSession(o); if (!order) return { ignored: 'order_not_found' };
        await repo.transitionOrder(order.id, 'FAILED', { failureReason: 'async_payment_failed' });
        return { failed: true };
      }
      case 'checkout.session.expired': {
        const order = await orderFromSession(o); if (!order) return { ignored: 'order_not_found' };
        await repo.transitionOrder(order.id, 'CANCELLED', { failureReason: 'expired' });
        return { cancelled: true };
      }
      case 'charge.refunded': return onRefund(o);
      case 'charge.dispute.created': return onDispute(o, 'created');
      case 'charge.dispute.closed': return onDispute(o, 'closed');
      case 'payment_intent.payment_failed': {
        const order = o.metadata && o.metadata.order_id ? await repo.getOrder(o.metadata.order_id) : null;
        if (order) await audit(repo, { orderId: order.id, userId: order.userId, type: 'payment_attempt_failed', data: { code: o.last_payment_error && o.last_payment_error.code } });
        return { noted: true };
      }
      default: return { ignored: event.type };
    }
  }
  async function onRefund(ch) {
    const pi = typeof ch.payment_intent === 'string' ? ch.payment_intent : ch.payment_intent && ch.payment_intent.id;
    const full = ch.amount_refunded >= ch.amount;
    const last = ch.refunds && ch.refunds.data && ch.refunds.data[0];
    const refundId = last ? last.id : `${ch.id}#${ch.amount_refunded}`;
    const order = pi ? await repo.findOrderByPaymentIntent(pi) : null;
    const refundRow = { id: ids(), orderId: order ? order.id : null, provider: 'stripe', providerRefundId: refundId, providerPaymentId: pi, amountMinor: ch.amount_refunded, currency: String(ch.currency || '').toUpperCase(), full, reason: last && last.reason || null, createdAt: now().toISOString() };
    if (!order) { await repo.insertRefund(refundRow); return { orphanRefund: true }; }
    // Registro + transición + revocación en UNA transacción; si se repite (reintento tras un fallo), todo es idempotente
    let created = false;
    await repo.tx(async t => {
      created = await t.insertRefund(refundRow);
      if (full) {
        await t.transitionOrder(order.id, 'REFUNDED', { refundedAt: now().toISOString() });
        await t.setGrantStatus({ orderId: order.id }, 'revoked', { reason: 'refund', ref: refundId, at: now().toISOString() });
      } else {
        await t.transitionOrder(order.id, 'PARTIALLY_REFUNDED', {});
        if (config.refunds.partialRevokes) await t.setGrantStatus({ orderId: order.id }, 'revoked', { reason: 'partial_refund', ref: refundId, at: now().toISOString() });
      }
      await audit(t, { orderId: order.id, userId: order.userId, type: 'refund', data: { full, amount: ch.amount_refunded } });
    });
    return { refunded: full ? 'full' : 'partial', orderId: order.id, duplicateRefund: !created };
  }
  async function onDispute(d, phase) {
    const pi = typeof d.payment_intent === 'string' ? d.payment_intent : d.payment_intent && d.payment_intent.id;
    const order = pi ? await repo.findOrderByPaymentIntent(pi) : null;
    const prev = await repo.getDispute('stripe', d.id);
    if (phase === 'created' && prev && ['won', 'lost', 'warning_closed'].includes(prev.status)) return { dispute: 'already_closed' };   // «created» reintentado tras el cierre
    await repo.upsertDispute({ id: ids(), orderId: order ? order.id : null, provider: 'stripe', providerDisputeId: d.id, status: d.status, reason: d.reason, amountMinor: d.amount, updatedAt: now().toISOString() });
    if (!order) return { orphanDispute: true };
    await repo.tx(async t => {
      if (phase === 'created') {
        await t.transitionOrder(order.id, 'DISPUTED', {});
        if (config.disputes.suspend) await t.setGrantStatus({ orderId: order.id, status: 'active' }, 'suspended', { reason: 'dispute', ref: d.id, at: now().toISOString() });
      } else if (d.status === 'lost') {
        await t.transitionOrder(order.id, 'REVOKED', {});
        await t.setGrantStatus({ orderId: order.id }, 'revoked', { reason: 'dispute_lost', ref: d.id, at: now().toISOString() });
      } else {
        // Ganada: si ya se había entregado, se reactiva; si no (pagado sin entregar), vuelve a PAID y se entrega abajo
        const grants = (await t.listGrantsForOrder(order.id)).filter(g => g.status !== 'revoked');
        if (grants.length) { await t.transitionOrder(order.id, 'FULFILLED', {}); await t.setGrantStatus({ orderId: order.id, status: 'suspended' }, 'active', { reason: null, ref: d.id, at: null }); }
        else await t.transitionOrder(order.id, 'PAID', {});
      }
      await audit(t, { orderId: order.id, userId: order.userId, type: `dispute_${phase}`, data: { status: d.status } });
    });
    if (phase === 'closed' && d.status !== 'lost' && (await repo.getOrder(order.id)).status === 'PAID') await safeFulfill(order.id);
    return { dispute: phase, status: d.status };
  }

  // ---------------- Apple / Google (verificados en el servidor) → mismo resultado ----------------
  async function grantFromProvider({ userId, sku, source, sourcePurchaseId, amountMinor = null, taxMinor = null, currency = 'EUR', country = null, environment: penv = environment }) {
    req(['apple', 'google'].includes(source), 'bad_source');
    const product = productOrThrow(sku);
    let order = await repo.findOrderByProviderPayment(source, sourcePurchaseId);
    if (!order) {
      const id = ids();
      await repo.createOrder({ id, userId, sku: product.id, provider: source, status: 'CREATED', amountMinor: amountMinor || 0, currency, environment: penv, catalogVersion: catalog.version, platform: source === 'apple' ? 'ios' : 'android', createdAt: now().toISOString() });
      await repo.transitionOrder(id, 'PAID', { providerPaymentId: sourcePurchaseId, paidAt: now().toISOString(), country });
      await repo.insertPayment({ id: ids(), orderId: id, userId, provider: source, providerPaymentId: sourcePurchaseId, grossMinor: amountMinor, taxMinor, providerFeeMinor: null, platformFeeMinor: null, netMinor: null, currency, country, createdAt: now().toISOString() });
      order = await repo.getOrder(id);
    }
    req(order.userId === userId, 'purchase_belongs_to_other_user', 409);
    return safeFulfill(order.id);
  }
  async function revokeBySource(source, sourcePurchaseId, reason) {
    const order = await repo.findOrderByProviderPayment(source, sourcePurchaseId);
    await repo.tx(async t => {
      if (order) await t.transitionOrder(order.id, 'REFUNDED', { refundedAt: now().toISOString() });
      await t.setGrantStatus({ source, sourcePurchaseId }, 'revoked', { reason, ref: sourcePurchaseId, at: now().toISOString() });
    });
    return { revoked: true };
  }
  const skuFromPlatformId = (platform, pid) => (catalog.products.find(p => p.platformProducts && p.platformProducts[platform] && p.platformProducts[platform].productId === pid) || {}).id || null;
  async function verifyAppleTransaction(user, signedTransaction) {
    req(user && user.id, 'auth_required', 401);
    req(config.appleBillingEnabled, 'apple_billing_disabled', 403);
    req(verifiers.apple, 'apple_not_configured', 503);
    const tx = await verifiers.apple.verifyTransaction(signedTransaction);   // verifica la cadena JWS con la librería oficial
    req(tx.appAccountToken, 'missing_app_account_token', 409);   // la app siempre lo pone: sin él, cualquiera podría reclamar la compra
    req(tx.appAccountToken === user.id, 'purchase_belongs_to_other_user', 409);
    const sku = skuFromPlatformId('apple', tx.productId); req(sku, 'unknown_product', 404);
    await repo.insertIapReceipt({ id: ids(), userId: user.id, provider: 'apple', transactionId: tx.transactionId, originalTransactionId: tx.originalTransactionId, productId: sku, environment: tx.environment, storefront: tx.storefront, verifiedAt: now().toISOString() });
    if (tx.revocationDate) return revokeBySource('apple', tx.originalTransactionId, 'apple_revoked');
    return grantFromProvider({ userId: user.id, sku, source: 'apple', sourcePurchaseId: tx.originalTransactionId || tx.transactionId, amountMinor: tx.price != null ? Math.round(tx.price / 1000 * 10 ** (ZERO_DECIMAL.includes(tx.currency) ? 0 : 2)) : null, currency: tx.currency || 'EUR', country: tx.storefront || null });
  }
  async function handleAppleNotification(signedPayload) {
    req(verifiers.apple, 'apple_not_configured', 503);
    const n = await verifiers.apple.verifyNotification(signedPayload);
    const rec = await repo.recordProviderEvent({ provider: 'apple', eventId: n.notificationUUID, type: n.notificationType, payload: n, receivedAt: now().toISOString() });
    if (!rec.isNew && rec.status === 'processed') return { ok: true, duplicate: true };
    const tx = n.transaction || {};
    if (n.notificationType === 'REFUND' || n.notificationType === 'REVOKE') await revokeBySource('apple', tx.originalTransactionId, 'apple_refund');
    else if (n.notificationType === 'ONE_TIME_CHARGE' && tx.appAccountToken) {
      const sku = skuFromPlatformId('apple', tx.productId);
      if (sku) await grantFromProvider({ userId: tx.appAccountToken, sku, source: 'apple', sourcePurchaseId: tx.originalTransactionId });
    }
    await repo.markProviderEvent('apple', n.notificationUUID, 'processed', null);
    return { ok: true };
  }
  async function verifyGooglePurchase(user, { sku, purchaseToken }) {
    req(user && user.id, 'auth_required', 401);
    req(config.googleBillingEnabled, 'google_billing_disabled', 403);
    req(verifiers.google, 'google_not_configured', 503);
    const product = productOrThrow(sku);
    req(product.platformProducts && product.platformProducts.google && product.platformProducts.google.productId, 'unknown_product', 404);
    req(typeof purchaseToken === 'string' && purchaseToken.length > 0, 'bad_token');
    const p = await verifiers.google.getPurchase(product.platformProducts.google.productId, purchaseToken);
    req(p.obfuscatedAccountId, 'missing_account_id', 409);
    req(p.obfuscatedAccountId === await accountHash(user.id), 'purchase_belongs_to_other_user', 409);
    p.orderId = p.orderId || `gtoken:${purchaseToken.slice(0, 120)}`;   // algunas compras de prueba no traen orderId
    await repo.insertIapReceipt({ id: ids(), userId: user.id, provider: 'google', transactionId: p.orderId, originalTransactionId: p.orderId, productId: sku, environment: p.testPurchase ? 'test' : 'production', storefront: p.regionCode || null, verifiedAt: now().toISOString() });
    if (p.purchaseState === 'PENDING') return { pending: true };
    req(p.purchaseState === 'PURCHASED', 'purchase_not_completed', 409);
    const done = await grantFromProvider({ userId: user.id, sku, source: 'google', sourcePurchaseId: p.orderId, country: p.regionCode || null });
    if (!p.acknowledged) await verifiers.google.acknowledge(product.platformProducts.google.productId, purchaseToken);   // < 3 días o Google reembolsa
    return done;
  }
  async function handleGoogleVoided({ orderId, eventId }) {
    const rec = await repo.recordProviderEvent({ provider: 'google', eventId, type: 'voided', payload: { orderId }, receivedAt: now().toISOString() });
    if (!rec.isNew && rec.status === 'processed') return { ok: true, duplicate: true };
    await revokeBySource('google', orderId, 'google_voided');
    await repo.markProviderEvent('google', eventId, 'processed', null);
    return { ok: true };
  }

  // ---------------- Sincronizar, restaurar, historial ----------------
  async function getEntitlements(user) {
    req(user && user.id, 'auth_required', 401);
    await limit('sync', user.id);
    const grants = await repo.listGrants(user.id);
    return { entitlements: activeEntitlements(grants), catalogVersion: catalog.version, syncedAt: now().toISOString() };
  }
  async function restore(user, { apple = [], google = [] } = {}) {
    req(user && user.id, 'auth_required', 401);
    await limit('restore', user.id);
    for (const jws of apple) await verifyAppleTransaction(user, jws).catch(e => log('restore_apple', e.code));
    for (const g of google) await verifyGooglePurchase(user, g).catch(e => log('restore_google', e.code));
    // Stripe: pagos confirmados sin entregar y sesiones cuyo webhook no llegó
    for (const o of await repo.listOrders(user.id)) {
      if (o.status === 'PAID') await safeFulfill(o.id).catch(() => {});
      else if (o.status === 'PENDING' && o.provider === 'stripe' && o.providerCheckoutId && stripe && stripe.retrieveCheckoutSession) {
        const s = await stripe.retrieveCheckoutSession(o.providerCheckoutId).catch(() => null);
        if (s && s.payment_status === 'paid') await onSessionPaid(s, 'checkout.session.async_payment_succeeded');
      }
    }
    const ents = await entitlementsOf(user.id);
    await audit(repo, { orderId: null, userId: user.id, type: 'restore', data: { count: ents.length } });
    return { entitlements: ents, restoredAt: now().toISOString() };
  }
  async function purchaseHistory(user) {
    req(user && user.id, 'auth_required', 401);
    const orders = await repo.listOrders(user.id);
    const grants = (await repo.listGrants(user.id)).filter(g => !g.orderId);
    return {
      orders: orders.map(o => ({ orderRef: shortRef(o.id), orderId: o.id, sku: o.sku, name: (getProduct(o.sku, catalog) || {}).name || o.sku, date: o.paidAt || o.createdAt, provider: o.provider, status: o.status, amountMinor: o.amountMinor, currency: o.currency })),
      other: grants.map(g => ({ entitlementId: g.entitlementId, source: g.source, date: g.grantedAt, status: g.status })),
    };
  }
  async function orderStatus(user, orderId) {
    req(user && user.id, 'auth_required', 401);
    const o = await repo.getOrder(orderId);
    req(o && o.userId === user.id, 'order_not_found', 404);   // nunca se revela una orden ajena
    return { orderRef: shortRef(o.id), status: o.status, sku: o.sku };
  }

  // ---------------- Códigos promocionales ----------------
  async function redeemPromo(user, code) {
    req(user && user.id, 'auth_required', 401);
    await limit('promo', user.id);
    const promo = await repo.getPromoByCode(String(code || '').trim().toUpperCase());
    req(promo && promo.active, 'promo_invalid', 404);
    const t = now().toISOString();
    req(!promo.startsAt || promo.startsAt <= t, 'promo_not_started', 409);
    req(!promo.expiresAt || promo.expiresAt > t, 'promo_expired', 409);
    const r = await repo.redeemPromo(promo.id, user.id, t);
    req(r === 'ok', r === 'already' ? 'promo_already_redeemed' : 'promo_exhausted', 409);
    const ents = promo.sku ? productEntitlements(productOrThrow(promo.sku)) : promo.entitlements || [];
    for (const e of ents) await repo.insertGrant({ id: ids(), userId: user.id, entitlementId: e, source: 'promo', sourcePurchaseId: `promo:${promo.id}:${user.id}`, orderId: null, productId: promo.sku || null, grantedAt: t, status: 'active' });
    await audit(repo, { orderId: null, userId: user.id, type: 'promo_redeemed', data: { promo: promo.id } });
    return { entitlements: await entitlementsOf(user.id), granted: ents };
  }

  // ---------------- Admin (protegido) ----------------
  async function requireAdmin(admin) { req(admin && admin.id && await repo.isAdmin(admin.id), 'forbidden', 403); }
  async function adminAction(admin, action, target, data) { await repo.insertAdminAction({ id: ids(), adminId: admin.id, action, targetUserId: target, data, at: now().toISOString() }); }
  const admin = {
    async searchUsers(a, q) { await requireAdmin(a); return repo.searchUsers(String(q || '').slice(0, 64)); },
    async userDetail(a, userId) { await requireAdmin(a); return { grants: await repo.listGrants(userId), orders: await repo.listOrders(userId), entitlements: await entitlementsOf(userId) }; },
    async grant(a, { userId, entitlementId, reason }) {
      await requireAdmin(a); req(typeof userId === 'string' && userId.length >= 8, 'user_required'); req(catalog.entitlements[entitlementId], 'unknown_entitlement', 404); req(reason && String(reason).trim().length >= 3, 'reason_required');
      const actionId = ids();
      const r = await repo.insertGrant({ id: ids(), userId, entitlementId, source: 'admin', sourcePurchaseId: `admin:${actionId}`, orderId: null, productId: null, grantedAt: now().toISOString(), status: 'active' });
      await adminAction(a, 'grant', userId, { entitlementId, reason, actionId });
      return r;
    },
    async revoke(a, { userId, entitlementId, reason }) {
      await requireAdmin(a); req(reason && String(reason).trim().length >= 3, 'reason_required');
      req(typeof userId === 'string' && userId.length >= 8, 'user_required'); req(catalog.entitlements[entitlementId], 'unknown_entitlement', 404);
      const n = await repo.setGrantStatus({ userId, entitlementId, status: 'active' }, 'revoked', { reason: `admin: ${reason}`, ref: a.id, at: now().toISOString() });
      await adminAction(a, 'revoke', userId, { entitlementId, reason });
      return { revoked: n };
    },
    // Da de alta en Stripe los productos y precios del catálogo (solo los que faltan) y guarda sus ids.
    // La clave secreta nunca sale del servidor. Idempotente: repetirlo no duplica nada.
    async syncStripe(a) {
      await requireAdmin(a); req(stripe, 'stripe_not_configured', 503);
      const env = environment;
      req(!stripe.livemode || (env === 'production' && config.liveModeAllowed), 'live_mode_not_allowed', 409);
      const hechos = [], saltados = [];
      for (const P of catalog.products) {
        const eur = P.prices && P.prices.EUR;
        if (!eur || P.promoOnly || P.status === 'draft' || P.status === 'retired') continue;
        const ya = await repo.getProviderIds(P.id, 'stripe', env);
        if (ya && ya.priceId) { saltados.push(P.id); continue; }
        const k = `dban-${env}-${P.id}-v${P.version || 1}`;
        const prod = await stripe.createProduct({ name: P.name, description: (P.description || P.name).slice(0, 500), 'metadata[sku]': P.id, 'metadata[environment]': env }, `${k}-prod`);
        const price = await stripe.createPrice({ product: prod.id, unit_amount: eur, currency: 'eur', 'metadata[sku]': P.id }, `${k}-price-${eur}`);
        await repo.setProviderIds({ sku: P.id, provider: 'stripe', environment: env, productId: prod.id, priceId: price.id });
        hechos.push({ sku: P.id, product: prod.id, price: price.id });
      }
      await adminAction(a, 'stripe_sync', null, { creados: hechos.length, saltados: saltados.length, environment: env });
      return { environment: env, livemode: stripe.livemode, creados: hechos, yaExistian: saltados };
    },
    async webhookErrors(a) { await requireAdmin(a); return repo.listProviderEvents({ status: 'error' }); },
    async ordersNeedingAttention(a) { await requireAdmin(a); return (await repo.listOrdersByStatus('PAID')).concat(await repo.listOrdersByStatus('DISPUTED')); },
    async retryFulfillment(a, orderId) { await requireAdmin(a); const o = await safeFulfill(orderId); await adminAction(a, 'retry_fulfillment', o.userId, { orderId }); return o; },
    async report(a, { from, to } = {}) {
      await requireAdmin(a);
      const pays = await repo.listPayments({ from, to }), refunds = await repo.listRefunds({ from, to }), events = await repo.listAnalytics({ from, to });
      const by = (k) => pays.reduce((m, p) => { const key = p[k] || '?'; m[key] = m[key] || { gross: 0, tax: 0, fee: 0, net: 0, count: 0 }; m[key].gross += p.grossMinor || 0; m[key].tax += p.taxMinor || 0; m[key].fee += p.providerFeeMinor || 0; m[key].net += p.netMinor || 0; m[key].count++; return m; }, {});
      return { bySku: by('sku'), byProvider: by('provider'), byCountry: by('country'), refundRate: pays.length ? refunds.length / pays.length : 0, funnel: funnel(events) };
    },
  };

  // ---------------- Telemetría, anuncios, cuenta ----------------
  async function track(userId, name, props) {
    const e = sanitizeEvent(name, props); if (!e) return false;
    await repo.insertAnalytics({ id: ids(), userId: userId || null, name: e.name, props: e.props, at: now().toISOString() });
    return true;
  }
  async function recordAdReward(user, placement) {
    req(user && user.id, 'auth_required', 401);
    req(config.rewardedEnabled && config.rewarded.placements.includes(placement), 'placement_not_allowed', 403);
    const since = now().getTime() - 24 * 3600 * 1000;
    req(await repo.countAdRewards(user.id, since) < config.rewarded.dailyCap, 'daily_cap', 429);
    await repo.insertAdReward({ id: ids(), userId: user.id, placement, at: now().toISOString() });
    return { ok: true };
  }
  async function deleteAccount(user) {
    req(user && user.id, 'auth_required', 401);
    await repo.deleteAccount(user.id, await accountHash(user.id));   // borra PII; conserva contabilidad anonimizada
    return { deleted: true };
  }

  return { config, environment, storefront, createCheckout, handleStripeWebhook, fulfillOrder, grantFromProvider, revokeBySource, verifyAppleTransaction, handleAppleNotification,
    verifyGooglePurchase, handleGoogleVoided, getEntitlements, restore, purchaseHistory, orderStatus, redeemPromo, admin, track, recordAdReward, deleteAccount };
}

// Hash estable del id de usuario (para Google obfuscatedAccountId y para anonimizar)
export async function accountHash(userId) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`dban:${userId}`)));
  return Array.from(d.slice(0, 16), b => b.toString(16).padStart(2, '0')).join('');
}
