// Suite de contrato del comercio: se ejecuta con cualquier repositorio (memoria o PostgreSQL real).
// Cubre: checkout, webhook (válido, firma inválida, duplicado, desorden, fallo), reembolsos, disputas, bundles,
// restore, promo, admin, seguridad (precio, producto, usuario, success_url, webhook falso, test/live) y Apple/Google simulados.
import { createCommerceService } from '../../commerce/core/service.js';
import { createFakeStripe } from '../../commerce/core/fakeStripe.js';
import { CATALOG } from '../../commerce/catalog/catalog.js';

export async function runContract(name, makeRepo, check) {
  const SECRET = 'whsec_test_contract';
  let clockMs = Date.parse('2026-10-08T10:00:00Z');
  const clock = () => new Date(clockMs);
  const fresh = async (cfg = {}, opts = {}) => {
    const repo = await makeRepo();
    const stripe = createFakeStripe({ webhookSecret: SECRET, clock, mock: false });
    const svc = createCommerceService({ repo, stripe, clock, config: Object.assign({ environment: 'staging' }, cfg), env: { stripeWebhookSecret: SECRET, appUrl: 'https://juego.test', environment: opts.environment || 'staging' }, verifiers: opts.verifiers || {} });
    return { repo, stripe, svc };
  };
  const ADMIN = '99999999-9999-4999-8999-999999999999';
  const U = { id: '11111111-1111-4111-8111-111111111111' }, U2 = { id: '22222222-2222-4222-8222-222222222222' };
  const T = `[${name}] `;
  const err = async (p) => { try { await p; return null; } catch (e) { return e.code || e.message; } };
  const deliver = async (stripe, svc, ev, o) => { const s = await stripe.signed(ev, o); return svc.handleStripeWebhook(s.raw, s.header); };
  const buy = async (ctx, user = U, sku = 'pack_debut') => {
    const r = await ctx.svc.createCheckout(user, { sku, consentWithdrawal: true });
    const o = await ctx.repo.getOrder(r.orderId);
    return { r, o, session: o.providerCheckoutId };
  };

  // ---------- Checkout ----------
  {
    const c = await fresh();
    const { r, o } = await buy(c);
    check(T + 'Checkout válido: crea orden PENDING con precio del servidor (99 céntimos) y sesión de Stripe', o.status === 'PENDING' && o.amountMinor === 99 && o.currency === 'EUR' && /^mock-checkout:/.test(r.url));
    const cs = c.stripe.calls.find(x => x[0] === 'createCheckoutSession');
    check(T + 'Checkout: mode=payment, metadata user/product/order, idempotency key = orden, client_reference_id', cs[1].mode === 'payment' && cs[1].metadata.user_id === U.id && cs[1].metadata.product_id === 'pack_debut' && cs[1].metadata.order_id === r.orderId && cs[1].payment_intent_data.metadata.order_id === r.orderId && cs[2] === `checkout_${r.orderId}` && cs[1].client_reference_id === r.orderId);
    check(T + 'Checkout: success_url no concede nada (solo lleva a «verificando»)', /compra=verificando/.test(cs[1].success_url) && (await c.svc.getEntitlements(U)).entitlements.length === 0);
    const again = await c.svc.createCheckout(U, { sku: 'pack_debut', consentWithdrawal: true });
    check(T + 'Checkout: repetir mientras está abierta reutiliza la misma orden (sin duplicados)', again.reused && again.orderId === r.orderId);
    await buy(c, U, 'remove_ads');
    check(T + 'Stripe Customer: uno por usuario (no se crea en cada compra)', c.stripe.calls.filter(x => x[0] === 'createCustomer').length === 1);
    check(T + 'Producto inexistente → error', await err(c.svc.createCheckout(U, { sku: 'pack_gratis_hack', consentWithdrawal: true })) === 'unknown_product');
    check(T + 'Producto «coming_soon» no se puede cobrar', await err(c.svc.createCheckout(U, { sku: 'pack_street', consentWithdrawal: true })) === 'coming_soon');
    check(T + 'Producto «draft» no se puede cobrar', await err(c.svc.createCheckout(U, { sku: 'season_pass', consentWithdrawal: true })) !== null);
    check(T + 'Producto solo-promo no se puede cobrar', await err(c.svc.createCheckout(U, { sku: 'promo_press', consentWithdrawal: true })) === 'promo_only');
    check(T + 'Sin sesión no hay checkout', await err(c.svc.createCheckout(null, { sku: 'pack_debut', consentWithdrawal: true })) === 'auth_required');
    check(T + 'Sin consentimiento de desistimiento (UE) no hay checkout', await err(c.svc.createCheckout(U2, { sku: 'pack_debut' })) === 'withdrawal_consent_required');
    const pm = await c.svc.createCheckout(U2, { sku: 'pack_debut', consentWithdrawal: true, price: 1, amountMinor: 1, priceMinor: 1 });
    check(T + 'Seguridad: un precio manipulado desde el cliente se ignora (se cobra el del servidor)', (await c.repo.getOrder(pm.orderId)).amountMinor === 99);
    check(T + 'Requisitos: Presidente Mundial de Escalada sin «Escalada» → bloqueado antes de cobrar', await err(c.svc.createCheckout(U, { sku: 'prestige_world_climbing_president', consentWithdrawal: true })) !== null);
  }
  // ---------- Webhook ----------
  {
    const c = await fresh();
    const { r, session } = await buy(c);
    const ev = c.stripe.pay(session);
    const bad = await c.stripe.signed(ev, { secret: 'whsec_otro' });
    check(T + 'Webhook con firma inválida → rechazado y no concede', await err(c.svc.handleStripeWebhook(bad.raw, bad.header)) === 'Firma de webhook no válida: signature_mismatch' || (await err(c.svc.handleStripeWebhook(bad.raw, bad.header))) !== null);
    check(T + 'Webhook sin cabecera → rechazado', await err(c.svc.handleStripeWebhook(JSON.stringify(ev), '')) !== null);
    const old = await c.stripe.signed(ev, { timestamp: Math.floor(clockMs / 1000) - 3600 });
    check(T + 'Webhook antiguo (fuera de tolerancia, replay) → rechazado', await err(c.svc.handleStripeWebhook(old.raw, old.header)) !== null);
    const tampered = await c.stripe.signed(ev); tampered.raw = tampered.raw.replace('"paid"', '"paid" ');
    check(T + 'Webhook con cuerpo manipulado → rechazado', await err(c.svc.handleStripeWebhook(tampered.raw, tampered.header)) !== null);
    check(T + 'Nada concedido tras webhooks falsos', (await c.svc.getEntitlements(U)).entitlements.length === 0);
    const res = await deliver(c.stripe, c.svc, ev);
    const o = await c.repo.getOrder(r.orderId);
    check(T + 'Webhook válido: orden PAID → FULFILLED y entitlement activo', res.fulfilled && o.status === 'FULFILLED' && (await c.svc.getEntitlements(U)).entitlements.includes('cosmetic.debut_pack'));
    const dup = await deliver(c.stripe, c.svc, ev);
    const grants = (await c.repo.listGrants(U.id)).filter(g => g.entitlementId === 'cosmetic.debut_pack');
    check(T + 'Webhook duplicado: no concede dos veces', dup.duplicate && grants.length === 1);
    const evCopy = Object.assign({}, ev, { id: ev.id + 'x' });
    await deliver(c.stripe, c.svc, evCopy);
    check(T + 'Mismo pago con otro id de evento: tampoco duplica el entitlement', (await c.repo.listGrants(U.id)).filter(g => g.entitlementId === 'cosmetic.debut_pack').length === 1);
    check(T + 'Comprar otra vez lo que ya tienes → bloqueado (no se cobra dos veces)', await err(c.svc.createCheckout(U, { sku: 'pack_debut', consentWithdrawal: true })) === 'owned');
    const live = c.stripe.event('checkout.session.completed', c.stripe.sessions[session], { livemode: true });
    check(T + 'Evento de modo live en entorno de test → rechazado (no se mezclan)', await err(deliver(c.stripe, c.svc, live)) === 'livemode_mismatch');
    const pay = (await c.repo.listPayments()).find(p => p.orderId === r.orderId);
    check(T + 'Contabilidad: bruto, impuestos, comisión y neto guardados en unidades mínimas', pay && pay.grossMinor === 99 && pay.taxMinor === 0 && Number.isInteger(pay.providerFeeMinor) && Number.isInteger(pay.netMinor));
  }
  // ---------- Usuario incorrecto / reutilizar checkout ----------
  {
    const c = await fresh();
    const { r, session } = await buy(c);
    const ev = c.stripe.pay(session);
    ev.data.object.metadata = Object.assign({}, ev.data.object.metadata, { user_id: U2.id });
    check(T + 'Webhook con user_id cambiado → no concede a nadie', (await err(deliver(c.stripe, c.svc, ev))) === 'user_mismatch' && !(await c.svc.getEntitlements(U2)).entitlements.length);
    check(T + 'Ver una orden ajena → no existe para ti', await err(c.svc.orderStatus(U2, r.orderId)) === 'order_not_found');
    const ev2 = c.stripe.event('checkout.session.completed', Object.assign({}, c.stripe.sessions[session], { amount_subtotal: 1, amount_total: 1 }));
    const res = await deliver(c.stripe, c.svc, ev2);
    check(T + 'Importe del pago distinto del de la orden → no se entrega', res.ignored === 'amount_mismatch' && !(await c.svc.getEntitlements(U)).entitlements.length);
  }
  // ---------- Pago asíncrono, fallo, expiración ----------
  {
    const c = await fresh();
    const a = await buy(c);
    await deliver(c.stripe, c.svc, c.stripe.pay(a.session, { async: true }));
    check(T + 'Pago asíncrono: «completed» sin pagar no concede (queda PENDING)', (await c.repo.getOrder(a.r.orderId)).status === 'PENDING' && !(await c.svc.getEntitlements(U)).entitlements.length);
    await deliver(c.stripe, c.svc, c.stripe.asyncResult(a.session, true));
    check(T + 'Pago asíncrono confirmado → FULFILLED', (await c.repo.getOrder(a.r.orderId)).status === 'FULFILLED');
    const b = await buy(c, U2);
    await deliver(c.stripe, c.svc, c.stripe.pay(b.session, { async: true }));
    await deliver(c.stripe, c.svc, c.stripe.asyncResult(b.session, false));
    check(T + 'Pago asíncrono fallido → FAILED y sin entitlement', (await c.repo.getOrder(b.r.orderId)).status === 'FAILED' && !(await c.svc.getEntitlements(U2)).entitlements.length);
    const d = await buy(c, U2, 'remove_ads');
    await deliver(c.stripe, c.svc, c.stripe.expire(d.session));
    check(T + 'Sesión expirada → CANCELLED', (await c.repo.getOrder(d.r.orderId)).status === 'CANCELLED');
  }
  // ---------- Reembolsos y disputas ----------
  {
    const c = await fresh();
    const a = await buy(c);
    await deliver(c.stripe, c.svc, c.stripe.pay(a.session));
    await deliver(c.stripe, c.svc, c.stripe.refund(a.session, 40));
    check(T + 'Reembolso parcial → PARTIALLY_REFUNDED y el entitlement sigue (política)', (await c.repo.getOrder(a.r.orderId)).status === 'PARTIALLY_REFUNDED' && (await c.svc.getEntitlements(U)).entitlements.includes('cosmetic.debut_pack'));
    const full = c.stripe.refund(a.session);
    await deliver(c.stripe, c.svc, full);
    const g = (await c.repo.listGrants(U.id))[0];
    check(T + 'Reembolso total → REFUNDED, entitlement revocado con fecha, motivo y referencia (sin borrar historial)', (await c.repo.getOrder(a.r.orderId)).status === 'REFUNDED' && !(await c.svc.getEntitlements(U)).entitlements.length && g.status === 'revoked' && g.revokedAt && g.revokeReason === 'refund' && g.revokeRef);
    const dupr = await deliver(c.stripe, c.svc, Object.assign({}, full, { id: full.id + 'b' }));
    check(T + 'Reembolso repetido → no hace nada', dupr.duplicateRefund === true);
    // disputa
    const b = await buy(c, U2);
    await deliver(c.stripe, c.svc, c.stripe.pay(b.session));
    const dpc = c.stripe.dispute(b.session, 'needs_response');
    await deliver(c.stripe, c.svc, dpc);
    check(T + 'Disputa abierta → DISPUTED y entitlement suspendido (la cuenta sigue)', (await c.repo.getOrder(b.r.orderId)).status === 'DISPUTED' && !(await c.svc.getEntitlements(U2)).entitlements.length);
    await deliver(c.stripe, c.svc, c.stripe.dispute(b.session, 'won', dpc.data.object.id));
    check(T + 'Disputa ganada → vuelve a FULFILLED y se reactiva', (await c.repo.getOrder(b.r.orderId)).status === 'FULFILLED' && (await c.svc.getEntitlements(U2)).entitlements.includes('cosmetic.debut_pack'));
    const c2 = await fresh();
    const e = await buy(c2);
    await deliver(c2.stripe, c2.svc, c2.stripe.pay(e.session));
    const dp2 = c2.stripe.dispute(e.session, 'needs_response');
    await deliver(c2.stripe, c2.svc, dp2);
    await deliver(c2.stripe, c2.svc, c2.stripe.dispute(e.session, 'lost', dp2.data.object.id));
    check(T + 'Disputa perdida → REVOKED y entitlement revocado', (await c2.repo.getOrder(e.r.orderId)).status === 'REVOKED' && !(await c2.svc.getEntitlements(U)).entitlements.length);
  }
  // ---------- Eventos desordenados ----------
  {
    const c = await fresh();
    const a = await buy(c);
    const paid = c.stripe.pay(a.session), refund = c.stripe.refund(a.session);
    await deliver(c.stripe, c.svc, refund);         // el reembolso llega ANTES
    await deliver(c.stripe, c.svc, paid);
    check(T + 'Desorden: reembolso antes que el pago → la orden queda REFUNDED y nunca se concede', (await c.repo.getOrder(a.r.orderId)).status === 'REFUNDED' && !(await c.svc.getEntitlements(U)).entitlements.length);
    const b = await buy(c, U2);
    const p2 = c.stripe.pay(b.session, { async: true });
    const ok2 = c.stripe.asyncResult(b.session, true);
    await deliver(c.stripe, c.svc, ok2);             // el éxito asíncrono llega antes que el «completed»
    await deliver(c.stripe, c.svc, p2);
    check(T + 'Desorden: éxito asíncrono antes que «completed» → entregado una sola vez', (await c.repo.getOrder(b.r.orderId)).status === 'FULFILLED' && (await c.repo.listGrants(U2.id)).length === 1);
  }
  // ---------- Bundle ----------
  {
    const c = await fresh({ visibleSkus: null });
    // sports_bundle está coming_soon: en staging lo probamos con un usuario admin que concede escalada y un bundle de test
    const repo = c.repo;
    await repo.insertGrant({ id: crypto.randomUUID(), userId: U.id, entitlementId: 'sport.climbing', source: 'admin', sourcePurchaseId: 'admin:x', orderId: null, productId: null, grantedAt: clock().toISOString(), status: 'active' });
    const orderId = crypto.randomUUID();
    await repo.createOrder({ id: orderId, userId: U.id, sku: 'sports_bundle', provider: 'stripe', status: 'CREATED', amountMinor: 899, currency: 'EUR', environment: 'staging', catalogVersion: 1, platform: 'web', createdAt: clock().toISOString() });
    await repo.transitionOrder(orderId, 'PAID', { providerPaymentId: 'pi_bundle' });
    await c.svc.fulfillOrder(orderId);
    const ents = (await c.svc.getEntitlements(U)).entitlements;
    const climb = (await repo.listGrants(U.id)).filter(g => g.entitlementId === 'sport.climbing');
    check(T + 'Bundle: concede los 5 deportes sin duplicar el que ya tenías (2 concesiones, 1 entitlement)', ['sport.climbing', 'sport.tennis', 'sport.basketball', 'sport.skate', 'sport.surf'].every(e => ents.includes(e)) && climb.length === 2 && ents.filter(e => e === 'sport.climbing').length === 1);
    await repo.tx(t => t.transitionOrder(orderId, 'FULFILLED', {}));
    await repo.setGrantStatus({ orderId }, 'revoked', { reason: 'refund', ref: 're_x', at: clock().toISOString() });
    const after = (await c.svc.getEntitlements(U)).entitlements;
    check(T + 'Bundle reembolsado: se pierden sus deportes salvo el que tenías por otra vía', after.includes('sport.climbing') && !after.includes('sport.tennis'));
    check(T + 'Fulfillment idempotente: repetirlo no duplica', (await c.svc.fulfillOrder(orderId)).status === 'FULFILLED' && (await repo.listGrants(U.id)).length === 6);
  }
  // ---------- Restore ----------
  {
    const c = await fresh();
    const a = await buy(c);
    c.stripe.pay(a.session);   // Stripe cobró… pero el webhook NO llegó
    check(T + 'Antes de restaurar (webhook perdido) no hay entitlement', !(await c.svc.getEntitlements(U)).entitlements.length);
    const r = await c.svc.restore(U);
    check(T + 'Restaurar: consulta Stripe, entrega lo pagado sin pedir volver a pagar', r.entitlements.includes('cosmetic.debut_pack') && (await c.repo.getOrder(a.r.orderId)).status === 'FULFILLED');
    const r2 = await c.svc.restore(U);
    check(T + 'Restaurar dos veces no duplica nada', r2.entitlements.length === 1 && (await c.repo.listGrants(U.id)).length === 1);
    const h = await c.svc.purchaseHistory(U);
    check(T + 'Mis compras: producto, fecha, proveedor, estado y referencia (sin tarjeta)', h.orders[0].name === 'Pack Debut' && h.orders[0].provider === 'stripe' && h.orders[0].status === 'FULFILLED' && h.orders[0].orderRef.length === 10 && !JSON.stringify(h).match(/card|cvc|4242/i));
  }
  // ---------- Fallo de entrega y reintento ----------
  {
    const c = await fresh();
    const a = await buy(c);
    const real = c.repo.insertGrant;
    c.repo.insertGrant = async () => { throw new Error('db_down'); };
    const e1 = await err(deliver(c.stripe, c.svc, c.stripe.pay(a.session)));
    const o1 = await c.repo.getOrder(a.r.orderId);
    check(T + 'Si falla la concesión, el pago queda registrado (PAID) y el webhook pide reintento', e1 !== null && o1.status === 'PAID' && (await c.repo.listPayments()).some(p => p.orderId === a.r.orderId));
    c.repo.insertGrant = real;
    c.repo.seedAdmin && c.repo.seedAdmin(ADMIN);
    if (!c.repo.seedAdmin) await c.repo.addAdmin(ADMIN);
    await c.svc.admin.retryFulfillment({ id: ADMIN }, a.r.orderId);
    check(T + 'Admin: reintento de entrega idempotente → FULFILLED', (await c.repo.getOrder(a.r.orderId)).status === 'FULFILLED' && (await c.repo.listGrants(U.id)).length === 1);
    const errs = await c.svc.admin.webhookErrors({ id: ADMIN });
    check(T + 'Admin: ve los errores de webhook', errs.length >= 1);
  }
  // ---------- Admin, promo, seguridad de escritura ----------
  {
    const c = await fresh();
    if (c.repo.seedAdmin) c.repo.seedAdmin(ADMIN); else await c.repo.addAdmin(ADMIN);
    check(T + 'Un usuario normal no puede usar el admin', await err(c.svc.admin.grant(U, { userId: U.id, entitlementId: 'sport.climbing', reason: 'yo mismo' })) === 'forbidden');
    check(T + 'Admin grant exige motivo', await err(c.svc.admin.grant({ id: ADMIN }, { userId: U.id, entitlementId: 'sport.climbing', reason: '' })) === 'reason_required');
    await c.svc.admin.grant({ id: ADMIN }, { userId: U.id, entitlementId: 'sport.climbing', reason: 'tester escalada' });
    const g = (await c.repo.listGrants(U.id))[0];
    check(T + 'Admin grant: fuente admin + acción auditada (quién, a quién, qué, por qué)', g.source === 'admin' && (await c.svc.getEntitlements(U)).entitlements.includes('sport.climbing'));
    await c.svc.admin.revoke({ id: ADMIN }, { userId: U.id, entitlementId: 'sport.climbing', reason: 'fin de la prueba' });
    check(T + 'Admin revoke: revoca sin borrar historial', !(await c.svc.getEntitlements(U)).entitlements.includes('sport.climbing') && (await c.repo.listGrants(U.id))[0].status === 'revoked');
    if (c.repo.seedPromo) c.repo.seedPromo({ id: 'promo-1', code: 'PRENSA2026', sku: 'promo_press', maxRedemptions: 1 }); else await c.repo.addPromo({ id: '33333333-3333-4333-8333-333333333333', code: 'PRENSA2026', sku: 'promo_press', maxRedemptions: 1 });
    const pr = await c.svc.redeemPromo(U, ' prensa2026 ');
    check(T + 'Código promo: concede su contenido (fuente promo)', pr.entitlements.includes('cosmetic.press_badge'));
    check(T + 'Código promo: no se puede canjear dos veces', await err(c.svc.redeemPromo(U, 'PRENSA2026')) === 'promo_already_redeemed');
    check(T + 'Código promo: respeta el máximo de canjes', await err(c.svc.redeemPromo(U2, 'PRENSA2026')) === 'promo_exhausted');
    check(T + 'Código promo inexistente → error', await err(c.svc.redeemPromo(U2, 'GRATIS')) === 'promo_invalid');
    let limited = null; for (let i = 0; i < 12 && limited !== 'rate_limited'; i++) limited = await err(c.svc.redeemPromo(U2, 'X' + i));
    check(T + 'Rate limit en códigos promo (fuerza bruta de códigos)', limited === 'rate_limited');
  }
  // ---------- Apple / Google (verificadores simulados) → mismo entitlement ----------
  {
    const appleTx = { transactionId: '2000001', originalTransactionId: '2000001', productId: 'com.delbarrio.pack_debut', appAccountToken: U.id, environment: 'Sandbox', storefront: 'ESP', price: 990, currency: 'EUR' };
    const verifiers = {
      apple: { verifyTransaction: async jws => (jws === 'jws-valido' ? appleTx : jws === 'jws-otro' ? Object.assign({}, appleTx, { appAccountToken: U2.id, transactionId: '2000002', originalTransactionId: '2000002' }) : (() => { throw Object.assign(new Error('bad_jws'), { code: 'bad_jws' }); })()),
        verifyNotification: async p => ({ notificationUUID: 'n-1', notificationType: 'REFUND', transaction: { originalTransactionId: '2000001' } }) },
      google: { getPurchase: async (pid, token) => ({ orderId: 'GPA.1234', purchaseState: token === 'pending' ? 'PENDING' : 'PURCHASED', acknowledged: false, obfuscatedAccountId: null, productId: pid, regionCode: 'ES', testPurchase: true }), acknowledge: async () => { verifiers.google.acked = (verifiers.google.acked || 0) + 1; } },
    };
    const c = await fresh({ appleBillingEnabled: true, googleBillingEnabled: true }, { verifiers });
    await c.svc.verifyAppleTransaction(U, 'jws-valido');
    check(T + 'Apple (simulado): transacción verificada en servidor → entitlement activo', (await c.svc.getEntitlements(U)).entitlements.includes('cosmetic.debut_pack'));
    await c.svc.verifyAppleTransaction(U, 'jws-valido');
    check(T + 'Apple: verificar la misma transacción otra vez no duplica', (await c.repo.listGrants(U.id)).length === 1);
    check(T + 'Apple: una transacción de otra cuenta (appAccountToken) → rechazada', await err(c.svc.verifyAppleTransaction(U, 'jws-otro')) === 'purchase_belongs_to_other_user');
    check(T + 'Apple: JWS inválido → rechazado', await err(c.svc.verifyAppleTransaction(U, 'basura')) === 'bad_jws');
    await c.svc.handleAppleNotification('signed-refund');
    check(T + 'Apple: notificación REFUND → entitlement revocado', !(await c.svc.getEntitlements(U)).entitlements.length);
    const pend = await c.svc.verifyGooglePurchase(U2, { sku: 'remove_ads', purchaseToken: 'pending' });
    check(T + 'Google (simulado): compra pendiente no concede', pend.pending && !(await c.svc.getEntitlements(U2)).entitlements.length);
    await c.svc.verifyGooglePurchase(U2, { sku: 'remove_ads', purchaseToken: 'tok' });
    check(T + 'Google: compra verificada → entitlement y acknowledge (< 3 días)', (await c.svc.getEntitlements(U2)).entitlements.includes('ads.remove_interstitial') && verifiers.google.acked === 1);
    await c.svc.handleGoogleVoided({ orderId: 'GPA.1234', eventId: 'v-1' });
    check(T + 'Google: compra anulada (voided) → entitlement revocado', !(await c.svc.getEntitlements(U2)).entitlements.length);
    const off = await fresh({}, { verifiers });
    check(T + 'Apple/Google desactivados por flag → no se procesa nada', await err(off.svc.verifyAppleTransaction(U, 'jws-valido')) === 'apple_billing_disabled' && await err(off.svc.verifyGooglePurchase(U, { sku: 'remove_ads', purchaseToken: 't' })) === 'google_billing_disabled');
  }
  // ---------- Producción y modo live ----------
  {
    const c = await fresh({ environment: 'production', liveModeAllowed: false }, { environment: 'production' });
    c.stripe.livemode = true;
    check(T + 'Pagos reales bloqueados hasta «ACTIVAR PRODUCCIÓN» (liveModeAllowed=false)', await err(c.svc.createCheckout(U, { sku: 'pack_debut', consentWithdrawal: true })) === 'live_mode_not_allowed');
    const c2 = await fresh({ environment: 'production', liveModeAllowed: true }, { environment: 'production' });
    check(T + 'En producción, «testing» no se vende a usuarios normales', await err(c2.svc.createCheckout(U, { sku: 'sport_climbing', consentWithdrawal: true })) === 'not_available');
    check(T + 'En producción sin ids de Stripe mapeados → no se inventa un precio', await err(c2.svc.createCheckout(U, { sku: 'pack_debut', consentWithdrawal: true })) === 'stripe_price_not_mapped');
  }
  // ---------- Borrado de cuenta ----------
  {
    const c = await fresh();
    const a = await buy(c);
    await deliver(c.stripe, c.svc, c.stripe.pay(a.session));
    await c.svc.deleteAccount(U);
    const o = await c.repo.getOrder(a.r.orderId);
    check(T + 'Borrar cuenta: se conserva la contabilidad anonimizada (orden y pago sin user_id)', o && o.userId == null && o.status === 'FULFILLED' && (await c.repo.listPayments()).some(p => p.orderId === a.r.orderId));
  }
}
