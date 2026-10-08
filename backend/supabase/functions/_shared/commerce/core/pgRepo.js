// COPIA GENERADA de commerce/core/pgRepo.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Repositorio PostgreSQL (servidor). Misma semántica que memoryRepo: la idempotencia la garantizan las
// restricciones UNIQUE de la migración; las transiciones de orden son UPDATE condicionados al estado.
// `pool` es un pg.Pool (Node o Deno con npm:pg). Los métodos usan this.q para que una transacción herede todo.
import { fromStatesFor } from './orders.js';

const camel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const snake = s => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
const row = r => { if (!r) return null; const o = {}; for (const [k, v] of Object.entries(r)) o[camel(k)] = v instanceof Date ? v.toISOString() : (typeof v === 'string' && /^\d+$/.test(v) && /_minor$/.test(k) ? Number(v) : v); return o; };
const rows = rs => rs.map(row);
const ORDER_COLS = ['providerCheckoutId', 'providerPaymentId', 'checkoutUrl', 'expiresAt', 'country', 'failureReason', 'fulfillmentError', 'paidAt', 'fulfilledAt', 'refundedAt'];

export function createPgRepo({ pool }) {
  const base = {
    q: (text, params) => pool.query(text, params),
    async tx(fn) {
      const client = await pool.connect();
      const t = Object.create(this); t.q = (text, params) => client.query(text, params); t.tx = async f => f(t);
      try { await client.query('begin'); const r = await fn(t); await client.query('commit'); return r; }
      catch (e) { await client.query('rollback').catch(() => {}); throw e; }
      finally { client.release(); }
    },
    // --- catálogo ---
    async getPrice(sku, currency) { const r = (await this.q('select amount_minor, currency from product_prices where product_id = $1 and currency = $2', [sku, currency])).rows[0]; return r ? { amountMinor: Number(r.amount_minor), currency: r.currency } : null; },
    async getProviderIds(sku, provider, environment) { const r = (await this.q('select provider_product_id, provider_price_id from product_provider_ids where product_id = $1 and provider = $2 and environment = $3', [sku, provider, environment])).rows[0]; return r ? { productId: r.provider_product_id, priceId: r.provider_price_id } : null; },
    // --- cuentas ---
    async getCommerceAccount(userId) { return row((await this.q('select user_id, stripe_customer_id from commerce_accounts where user_id = $1', [userId])).rows[0]); },
    async setStripeCustomer(userId, customerId) {
      await this.q('insert into commerce_accounts (user_id, stripe_customer_id) values ($1, $2) on conflict (user_id) do update set stripe_customer_id = coalesce(commerce_accounts.stripe_customer_id, excluded.stripe_customer_id)', [userId, customerId]);
      return this.getCommerceAccount(userId);
    },
    // --- órdenes ---
    async createOrder(o) {
      await this.q(`insert into orders (id, user_id, sku, provider, status, amount_minor, currency, environment, catalog_version, platform, withdrawal_consent_at, created_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [o.id, o.userId, o.sku, o.provider, o.status, o.amountMinor, o.currency, o.environment, o.catalogVersion, o.platform || null, o.withdrawalConsentAt || null, o.createdAt]);
      await this.q('insert into order_items (order_id, product_id, amount_minor) values ($1, $2, $3)', [o.id, o.sku, o.amountMinor]);
      return this.getOrder(o.id);
    },
    async getOrder(id, { forUpdate = false } = {}) {
      if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
      return row((await this.q(`select * from orders where id = $1${forUpdate ? ' for update' : ''}`, [id])).rows[0]);
    },
    async findOrderByCheckout(cs) { return row((await this.q('select * from orders where provider_checkout_id = $1', [cs])).rows[0]); },
    async findOrderByPaymentIntent(pi) { return row((await this.q("select * from orders where provider = 'stripe' and provider_payment_id = $1", [pi])).rows[0]); },
    async findOrderByProviderPayment(provider, id) { return row((await this.q('select * from orders where provider = $1 and provider_payment_id = $2', [provider, id])).rows[0]); },
    async findOpenOrder(userId, sku, nowIso) { return row((await this.q("select * from orders where user_id = $1 and sku = $2 and status = 'PENDING' and expires_at > $3 order by created_at desc limit 1", [userId, sku, nowIso])).rows[0]); },
    async transitionOrder(id, to, patch = {}) {
      const from = fromStatesFor(to).concat(to);
      const sets = ['status = $2'], params = [id, to, from];
      for (const k of ORDER_COLS) if (k in patch) { params.push(patch[k]); sets.push(`${snake(k)} = $${params.length}`); }
      const r = await this.q(`update orders set ${sets.join(', ')} where id = $1 and status = any($3::text[]) returning *`, params);
      return row(r.rows[0]);
    },
    async patchOrder(id, patch) {
      const sets = [], params = [id];
      for (const k of ORDER_COLS) if (k in patch) { params.push(patch[k]); sets.push(`${snake(k)} = $${params.length}`); }
      if (sets.length) await this.q(`update orders set ${sets.join(', ')} where id = $1`, params);
    },
    async listOrders(userId) { return rows((await this.q('select * from orders where user_id = $1 order by created_at desc', [userId])).rows); },
    async listOrdersByStatus(status) { return rows((await this.q('select * from orders where status = $1', [status])).rows); },
    // --- pagos ---
    async insertPayment(p) {
      const r = await this.q(`insert into payments (id, order_id, user_id, provider, provider_payment_id, gross_minor, tax_minor, provider_fee_minor, platform_fee_minor, net_minor, currency, country, created_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (provider, provider_payment_id) do nothing`, [p.id, p.orderId, p.userId, p.provider, p.providerPaymentId, p.grossMinor, p.taxMinor, p.providerFeeMinor, p.platformFeeMinor, p.netMinor, p.currency, p.country, p.createdAt]);
      return { created: r.rowCount === 1 };
    },
    async updatePaymentFees(orderId, f) { await this.q('update payments set provider_fee_minor = $2, net_minor = $3 where order_id = $1', [orderId, f.providerFeeMinor, f.netMinor]); },
    async listPayments({ from, to } = {}) { return rows((await this.q('select p.*, o.sku from payments p join orders o on o.id = p.order_id where ($1::timestamptz is null or p.created_at >= $1) and ($2::timestamptz is null or p.created_at < $2)', [from || null, to || null])).rows); },
    // --- eventos de proveedor ---
    async recordProviderEvent(e) {
      const r = await this.q('insert into provider_events (provider, event_id, type, payload, received_at) values ($1,$2,$3,$4,$5) on conflict (provider, event_id) do nothing', [e.provider, e.eventId, e.type, JSON.stringify(e.payload), e.receivedAt]);
      if (r.rowCount === 1) return { isNew: true, status: 'received' };
      const s = (await this.q('select status from provider_events where provider = $1 and event_id = $2', [e.provider, e.eventId])).rows[0];
      return { isNew: false, status: s && s.status };
    },
    async markProviderEvent(provider, eventId, status, error) { await this.q('update provider_events set status = $3, error = $4, processed_at = now() where provider = $1 and event_id = $2', [provider, eventId, status, error]); },
    async listProviderEvents({ status } = {}) { return rows((await this.q('select provider, event_id, type, status, error, received_at, processed_at from provider_events where ($1::text is null or status = $1) order by received_at desc limit 200', [status || null])).rows); },
    // --- concesiones ---
    async insertGrant(g) {
      const r = await this.q(`insert into entitlement_grants (id, user_id, entitlement_id, source, source_purchase_id, order_id, product_id, status, granted_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict do nothing`, [g.id, g.userId, g.entitlementId, g.source, g.sourcePurchaseId, g.orderId, g.productId, g.status || 'active', g.grantedAt]);
      return { created: r.rowCount === 1 };
    },
    async listGrants(userId) { return rows((await this.q('select * from entitlement_grants where user_id = $1 order by granted_at', [userId])).rows); },
    async setGrantStatus(filter, status, { reason = null, ref = null, at = null } = {}) {
      const where = ["status <> 'revoked'"], params = [status];
      const add = (sql, v) => { params.push(v); where.push(sql.replace('?', `$${params.length}`)); };
      if (filter.orderId) add('order_id = ?', filter.orderId);
      if (filter.userId) add('user_id = ?', filter.userId);
      if (filter.entitlementId) add('entitlement_id = ?', filter.entitlementId);
      if (filter.source) { add('source = ?', filter.source); add('source_purchase_id = ?', filter.sourcePurchaseId); }
      if (filter.status) add('status = ?', filter.status);
      const sets = [];
      const set = (sql, v) => { params.push(v); sets.push(sql.replace('?', `$${params.length}`)); };
      if (status === 'revoked') { set('revoked_at = ?', at); set('revoke_reason = ?', reason); set('revoke_ref = ?', ref); }
      else if (status === 'suspended') { set('revoke_reason = ?', reason); set('revoke_ref = ?', ref); }
      else sets.push('revoke_reason = null');
      const extra = sets.length ? ', ' + sets.join(', ') : '';
      const r = await this.q(`update entitlement_grants set status = $1${extra} where ${where.join(' and ')}`, params);
      return r.rowCount;
    },
    // --- reembolsos y disputas ---
    async insertRefund(r) {
      const x = await this.q(`insert into refunds (id, order_id, provider, provider_refund_id, provider_payment_id, amount_minor, currency, "full", reason, created_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (provider, provider_refund_id) do nothing`, [r.id, r.orderId, r.provider, r.providerRefundId, r.providerPaymentId, r.amountMinor, r.currency || null, r.full, r.reason, r.createdAt]);
      return x.rowCount === 1;
    },
    async findOrphanRefunds(pi) { return rows((await this.q('select * from refunds where order_id is null and provider_payment_id = $1', [pi])).rows); },
    async attachRefund(id, orderId) { await this.q('update refunds set order_id = $2 where id = $1', [id, orderId]); },
    async listRefunds({ from, to } = {}) { return rows((await this.q('select * from refunds where ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)', [from || null, to || null])).rows); },
    async upsertDispute(d) {
      await this.q(`insert into disputes (id, order_id, provider, provider_dispute_id, status, reason, amount_minor, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8)
        on conflict (provider, provider_dispute_id) do update set status = excluded.status, order_id = coalesce(disputes.order_id, excluded.order_id), updated_at = excluded.updated_at`, [d.id, d.orderId, d.provider, d.providerDisputeId, d.status, d.reason, d.amountMinor, d.updatedAt]);
    },
    async insertPurchaseEvent(e) { await this.q('insert into purchase_events (id, order_id, user_id, type, data, at) values ($1,$2,$3,$4,$5,$6)', [e.id, e.orderId, e.userId, e.type, JSON.stringify(e.data || {}), e.at]); },
    async listPurchaseEvents() { return rows((await this.q('select * from purchase_events order by at')).rows); },
    // --- promo ---
    async getPromoByCode(code) { return row((await this.q('select * from promo_codes where code = $1', [code])).rows[0]); },
    async redeemPromo(promoId, userId, at) {
      return this.tx(async t => {
        const p = (await t.q('select * from promo_codes where id = $1 for update', [promoId])).rows[0];
        if (!p) return 'invalid';
        const ins = await t.q('insert into promo_redemptions (promo_id, user_id, at) values ($1, $2, $3) on conflict do nothing', [promoId, userId, at]);
        if (ins.rowCount === 0) return 'already';
        if (p.max_redemptions != null && p.redemptions >= p.max_redemptions) { await t.q('delete from promo_redemptions where promo_id = $1 and user_id = $2', [promoId, userId]); return 'exhausted'; }
        await t.q('update promo_codes set redemptions = redemptions + 1 where id = $1', [promoId]);
        return 'ok';
      });
    },
    // --- rate limit ---
    async hitRateLimit(key, windowSec, max, nowMs) {
      const w = Math.floor(nowMs / 1000 / windowSec);
      const r = await this.q('insert into rate_limits (key, window_start, count) values ($1, $2, 1) on conflict (key, window_start) do update set count = rate_limits.count + 1 returning count', [key, w]);
      return r.rows[0].count <= max;
    },
    // --- analítica, admin, recibos, anuncios, cuenta ---
    async insertAnalytics(e) { await this.q('insert into analytics_events (id, user_id, name, props, at) values ($1,$2,$3,$4,$5)', [e.id, e.userId, e.name, JSON.stringify(e.props || {}), e.at]); },
    async listAnalytics({ from, to } = {}) { return rows((await this.q('select name, props, at from analytics_events where ($1::timestamptz is null or at >= $1) and ($2::timestamptz is null or at < $2)', [from || null, to || null])).rows); },
    async isAdmin(userId) { if (!/^[0-9a-f-]{36}$/i.test(String(userId))) return false; return (await this.q('select 1 from admin_users where user_id = $1', [userId])).rowCount === 1; },
    async insertAdminAction(a) { await this.q('insert into admin_actions (id, admin_id, action, target_user_id, data, at) values ($1,$2,$3,$4,$5,$6)', [a.id, a.adminId, a.action, a.targetUserId, JSON.stringify(a.data || {}), a.at]); },
    async listAdminActions() { return rows((await this.q('select * from admin_actions order by at')).rows); },
    async searchUsers(q) {
      return rows((await this.q(`select u.id as user_id, u.email, p.display_name from auth.users u left join profiles p on p.user_id = u.id
        where u.id::text = $1 or u.email ilike '%' || $1 || '%' or p.display_name ilike '%' || $1 || '%' limit 20`, [q])).rows);
    },
    async insertIapReceipt(r) {
      const x = await this.q(`insert into iap_receipts (id, user_id, provider, transaction_id, original_transaction_id, product_id, environment, storefront, verified_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (provider, transaction_id) do nothing`, [r.id, r.userId, r.provider, r.transactionId, r.originalTransactionId, r.productId, r.environment, r.storefront, r.verifiedAt]);
      return x.rowCount === 1;
    },
    async insertAdReward(r) { await this.q('insert into ad_rewards (id, user_id, placement, at) values ($1,$2,$3,$4)', [r.id, r.userId, r.placement, r.at]); },
    async countAdRewards(userId, sinceMs) { return Number((await this.q('select count(*) from ad_rewards where user_id = $1 and at >= $2', [userId, new Date(sinceMs).toISOString()])).rows[0].count); },
    async deleteAccount(userId, refHash) { await this.q('select delete_account($1, $2)', [userId, refHash]); },
    // --- utilidades de pruebas y operación ---
    async addAdmin(userId) { await this.q('insert into admin_users (user_id) values ($1) on conflict do nothing', [userId]); },
    async addPromo(p) { await this.q('insert into promo_codes (id, code, sku, entitlements, max_redemptions, active) values ($1,$2,$3,$4,$5,true)', [p.id, p.code, p.sku || null, p.entitlements || null, p.maxRedemptions == null ? null : p.maxRedemptions]); },
  };
  return base;
}
