// Repositorio en memoria con la MISMA semántica que el de PostgreSQL (restricciones únicas, transiciones
// condicionadas, transacciones con rollback). Se usa en los tests y en el backend simulado del juego.
import { CATALOG } from '../catalog/catalog.js';
import { canTransition } from './orders.js';
import { priceFor } from './money.js';

const clone = x => JSON.parse(JSON.stringify(x));
const EMPTY = () => ({ orders: {}, payments: [], events: {}, grants: [], refunds: [], disputes: {}, purchaseEvents: [], accounts: {}, promos: {}, redemptions: [],
  rate: {}, analytics: [], admins: [], adminActions: [], receipts: {}, adRewards: [], profiles: {}, providerIds: [], prices: {}, gameSaves: {} });

export function createMemoryRepo({ catalog = CATALOG, state = null } = {}) {
  let S = state ? Object.assign(EMPTY(), clone(state)) : EMPTY();
  let queue = Promise.resolve(), inTx = false;
  const inRange = (at, { from, to } = {}) => (!from || at >= from) && (!to || at < to);
  if (!state) for (const p of catalog.products) for (const [cur, v] of Object.entries(p.prices || {})) if (v != null) S.prices[`${p.id}|${cur}`] = { amountMinor: v, currency: cur };
  const self = {
    // --- utilidades del repo en memoria ---
    dump: () => clone(S),
    seedProviderIds(rows) { S.providerIds.push(...rows); },
    seedAdmin(userId) { if (!S.admins.includes(userId)) S.admins.push(userId); },
    seedProfile(p) { S.profiles[p.userId] = Object.assign({}, p); },
    seedPromo(p) { S.promos[p.code] = Object.assign({ redemptions: 0, active: true }, p); },
    // Transacciones en serie (como un bloqueo): una no puede deshacer lo que escribe otra a medias
    async tx(fn) {
      if (inTx) return fn(self);   // transacción anidada: forma parte de la exterior
      const run = async () => { const snap = clone(S); inTx = true; try { return await fn(self); } catch (e) { S = snap; throw e; } finally { inTx = false; } };
      const p = queue.then(run, run); queue = p.catch(() => {}); return p;
    },

    // --- catálogo ---
    async getPrice(sku, currency) { return S.prices[`${sku}|${currency}`] || null; },
    async setProviderIds(r) { S.providerIds = S.providerIds.filter(x => !(x.sku === r.sku && x.provider === r.provider && x.environment === r.environment)); S.providerIds.push(r); },
    async getProviderIds(sku, provider, environment) { return S.providerIds.find(r => r.sku === sku && r.provider === provider && r.environment === environment) || null; },

    // --- cuentas ---
    async getCommerceAccount(userId) { return S.accounts[userId] || null; },
    async setStripeCustomer(userId, customerId) {
      if (Object.values(S.accounts).some(a => a.stripeCustomerId === customerId && a.userId !== userId)) throw Object.assign(new Error('unique_violation'), { code: '23505' });
      S.accounts[userId] = Object.assign(S.accounts[userId] || { userId }, { stripeCustomerId: S.accounts[userId] && S.accounts[userId].stripeCustomerId || customerId });
      return S.accounts[userId];
    },

    // --- órdenes ---
    async createOrder(o) {
      if (S.orders[o.id]) throw Object.assign(new Error('unique_violation'), { code: '23505' });
      S.orders[o.id] = Object.assign({ providerCheckoutId: null, providerPaymentId: null, checkoutUrl: null, fulfillmentError: null }, o);
      return clone(S.orders[o.id]);
    },
    async getOrder(id) { return S.orders[id] ? clone(S.orders[id]) : null; },
    async findOrderByCheckout(cs) { const o = Object.values(S.orders).find(x => x.providerCheckoutId === cs); return o ? clone(o) : null; },
    async findOrderByPaymentIntent(pi) { const o = Object.values(S.orders).find(x => x.provider === 'stripe' && x.providerPaymentId === pi); return o ? clone(o) : null; },
    async findOrderByProviderPayment(provider, id) { const o = Object.values(S.orders).find(x => x.provider === provider && x.providerPaymentId === id); return o ? clone(o) : null; },
    async findOpenOrder(userId, sku, nowIso) { const o = Object.values(S.orders).find(x => x.userId === userId && x.sku === sku && x.status === 'PENDING' && x.expiresAt && x.expiresAt > nowIso); return o ? clone(o) : null; },
    async transitionOrder(id, to, patch = {}) {
      const o = S.orders[id]; if (!o) return null;
      if (o.status !== to && !canTransition(o.status, to)) return null;
      if (patch.providerCheckoutId && Object.values(S.orders).some(x => x.id !== id && x.providerCheckoutId === patch.providerCheckoutId)) throw Object.assign(new Error('unique_violation'), { code: '23505' });
      if (patch.providerPaymentId && Object.values(S.orders).some(x => x.id !== id && x.provider === o.provider && x.providerPaymentId === patch.providerPaymentId)) throw Object.assign(new Error('unique_violation'), { code: '23505' });
      Object.assign(o, patch, { status: to, updatedAt: new Date().toISOString() });
      return clone(o);
    },
    async patchOrder(id, patch) { if (S.orders[id]) Object.assign(S.orders[id], patch); },
    async listOrders(userId) { return clone(Object.values(S.orders).filter(o => o.userId === userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))); },
    async listOrdersByStatus(status) { return clone(Object.values(S.orders).filter(o => o.status === status)); },

    // --- pagos ---
    async insertPayment(p) {
      if (!p.providerPaymentId) throw new Error('payments.provider_payment_id NOT NULL');
      if (S.payments.some(x => x.provider === p.provider && x.providerPaymentId === p.providerPaymentId)) return { created: false };
      const o = S.orders[p.orderId]; S.payments.push(Object.assign({ sku: o && o.sku }, p)); return { created: true };
    },
    async updatePaymentFees(orderId, fees) { for (const p of S.payments) if (p.orderId === orderId) Object.assign(p, fees); },
    async listPayments(r = {}) { return clone(S.payments.filter(p => inRange(p.createdAt, r))); },

    // --- eventos de proveedor (idempotencia) ---
    async recordProviderEvent(e) {
      const k = `${e.provider}|${e.eventId}`;
      if (S.events[k]) return { isNew: false, status: S.events[k].status };
      S.events[k] = Object.assign({ status: 'received', error: null }, e); return { isNew: true, status: 'received' };
    },
    async markProviderEvent(provider, eventId, status, error) { const e = S.events[`${provider}|${eventId}`]; if (e) Object.assign(e, { status, error, processedAt: new Date().toISOString() }); },
    async listProviderEvents({ status } = {}) { return clone(Object.values(S.events).filter(e => !status || e.status === status).map(({ payload, ...r }) => r)); },

    // --- concesiones / entitlements ---
    async insertGrant(g) {
      const dup = S.grants.some(x => (g.orderId && x.orderId === g.orderId && x.entitlementId === g.entitlementId) || (x.source === g.source && x.sourcePurchaseId === g.sourcePurchaseId && x.entitlementId === g.entitlementId));
      if (dup) return { created: false };
      S.grants.push(Object.assign({ revokedAt: null, revokeReason: null, revokeRef: null }, g)); return { created: true };
    },
    async listGrants(userId) { return clone(S.grants.filter(g => g.userId === userId)); },
    async listGrantsForOrder(orderId) { return clone(S.grants.filter(g => g.orderId === orderId)); },
    async setGrantStatus(filter, status, { reason = null, ref = null, at = null } = {}) {
      if (!filter.orderId && !filter.userId && !filter.source) throw new Error('setGrantStatus: filtro vacío (afectaría a todos)');
      let n = 0;
      for (const g of S.grants) {
        if (filter.orderId && g.orderId !== filter.orderId) continue;
        if (filter.userId && g.userId !== filter.userId) continue;
        if (filter.entitlementId && g.entitlementId !== filter.entitlementId) continue;
        if (filter.source && (g.source !== filter.source || g.sourcePurchaseId !== filter.sourcePurchaseId)) continue;
        if (filter.status && g.status !== filter.status) continue;
        if (g.status === 'revoked') continue;   // revocado es definitivo (no se borra historial)
        g.status = status; n++;
        if (status === 'revoked') Object.assign(g, { revokedAt: at, revokeReason: reason, revokeRef: ref });
        else if (status === 'suspended') Object.assign(g, { revokeReason: reason, revokeRef: ref });
        else Object.assign(g, { revokeReason: null });
      }
      return n;
    },

    // --- reembolsos y disputas ---
    async insertRefund(r) {
      if (S.refunds.some(x => x.provider === r.provider && x.providerRefundId === r.providerRefundId)) return false;
      S.refunds.push(Object.assign({}, r)); return true;
    },
    async findOrphanRefunds(pi) { return clone(S.refunds.filter(r => !r.orderId && r.providerPaymentId === pi)); },
    async attachRefund(id, orderId) { const r = S.refunds.find(x => x.id === id); if (r) r.orderId = orderId; },
    async listRefunds(r = {}) { return clone(S.refunds.filter(x => inRange(x.createdAt, r))); },
    async getDispute(provider, id) { const d = S.disputes[`${provider}|${id}`]; return d ? clone(d) : null; },
    async upsertDispute(d) { const k = `${d.provider}|${d.providerDisputeId}`; S.disputes[k] = Object.assign(S.disputes[k] || {}, d); },

    // --- auditoría ---
    async insertPurchaseEvent(e) { S.purchaseEvents.push(clone(e)); },
    async listPurchaseEvents() { return clone(S.purchaseEvents); },

    // --- promo ---
    async getPromoByCode(code) { return S.promos[code] ? clone(S.promos[code]) : null; },
    async redeemPromo(promoId, userId) {
      const p = Object.values(S.promos).find(x => x.id === promoId); if (!p) return 'invalid';
      if (S.redemptions.some(r => r.promoId === promoId && r.userId === userId)) return 'already';
      if (p.maxRedemptions != null && p.redemptions >= p.maxRedemptions) return 'exhausted';
      p.redemptions++; S.redemptions.push({ promoId, userId }); return 'ok';
    },

    // --- rate limit ---
    async hitRateLimit(key, windowSec, max, nowMs) {
      const w = Math.floor(nowMs / 1000 / windowSec), k = `${key}|${w}`;
      S.rate[k] = (S.rate[k] || 0) + 1; return S.rate[k] <= max;
    },

    // --- perfil y carreras en la nube ---
    async getProfile(userId) { return S.profiles[userId] ? clone(S.profiles[userId]) : null; },
    async upsertProfile(userId, f) { S.profiles[userId] = Object.assign(S.profiles[userId] || { userId, createdAt: new Date().toISOString() }, clone(f)); },
    async listGameSaves(userId) { return clone(Object.entries(S.gameSaves[userId] || {}).map(([slot, r]) => ({ slot: Number(slot), data: r.data, updatedAt: r.updatedAt }))); },
    async upsertGameSave(userId, slot, data, at) { (S.gameSaves[userId] = S.gameSaves[userId] || {})[slot] = { data: clone(data), updatedAt: at }; },
    async deleteGameSave(userId, slot) { if (S.gameSaves[userId]) delete S.gameSaves[userId][slot]; },

    // --- analítica, admin, recibos, anuncios ---
    async insertAnalytics(e) { S.analytics.push(clone(e)); },
    async listAnalytics(r = {}) { return clone(S.analytics.filter(e => inRange(e.at, r))); },
    async isAdmin(userId) { return S.admins.includes(userId); },
    async insertAdminAction(a) { S.adminActions.push(clone(a)); },
    async listAdminActions() { return clone(S.adminActions); },
    async searchUsers(q) { const s = q.toLowerCase(); return clone(Object.values(S.profiles).filter(p => p.userId.includes(s) || (p.displayName || '').toLowerCase().includes(s)).slice(0, 20)); },
    async insertIapReceipt(r) { const k = `${r.provider}|${r.transactionId}`; if (S.receipts[k]) return false; S.receipts[k] = clone(r); return true; },
    async insertAdReward(r) { S.adRewards.push(clone(r)); },
    async countAdRewards(userId, sinceMs) { return S.adRewards.filter(r => r.userId === userId && Date.parse(r.at) >= sinceMs).length; },
    async deleteAccount(userId, refHash) {
      delete S.profiles[userId]; delete S.accounts[userId]; delete S.gameSaves[userId];
      for (const e of S.purchaseEvents) if (e.userId === userId) e.userId = null;
      for (const a of S.adminActions) if (a.targetUserId === userId) Object.assign(a, { targetUserId: null, data: Object.assign({}, a.data, { userRefHash: refHash }) });
      S.redemptions = S.redemptions.filter(r => r.userId !== userId);
      S.analytics = S.analytics.filter(e => e.userId !== userId);
      for (const o of Object.values(S.orders)) if (o.userId === userId) Object.assign(o, { userId: null, userRefHash: refHash });
      for (const p of S.payments) if (p.userId === userId) Object.assign(p, { userId: null, userRefHash: refHash });
      for (const g of S.grants) if (g.userId === userId) Object.assign(g, { userId: null, userRefHash: refHash });
    },
  };
  return self;
}
export { priceFor };
