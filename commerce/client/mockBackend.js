// Backend SIMULADO en el navegador (sin red): el MISMO CommerceService del servidor con repositorio en memoria
// (guardado en localStorage como si fuera la base de datos) y un Stripe falso que firma los webhooks como el real.
// Representa al servidor: borrar la partida o la caché del juego no borra estas compras.
import { createCommerceService } from '../core/service.js';
import { createMemoryRepo } from '../core/memoryRepo.js';
import { createFakeStripe } from '../core/fakeStripe.js';

export function createMockBackend({ storage, key = 'dban_mock_server_v1', webhookDelayMs = 900, clock = () => new Date(), config = {} } = {}) {
  const SECRET = 'whsec_mock_local';
  const load = () => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch (_) { return null; } };
  const saved = load() || {};
  const repo = createMemoryRepo({ state: saved.db || null });
  const users = saved.users || {};
  const stripe = createFakeStripe({ webhookSecret: SECRET, clock, mock: true });
  const svc = createCommerceService({ repo, stripe, clock, config: Object.assign({ environment: 'development' }, config), env: { environment: 'development', stripeWebhookSecret: SECRET, appUrl: 'mock://juego' } });
  const persist = () => { try { storage.setItem(key, JSON.stringify({ db: repo.dump(), users })); } catch (_) { /* almacenamiento lleno o bloqueado: sigue en memoria */ } };
  const userOf = token => { const id = String(token || '').replace(/^mock\./, ''); const u = users[id]; return u ? { id, isTester: true } : null; };
  const call = async (fn) => { try { return await fn(); } finally { persist(); } };
  const deliver = async ev => { const s = await stripe.signed(ev); return svc.handleStripeWebhook(s.raw, s.header); };
  return {
    kind: 'mock',
    async signUp({ method = 'email', email = null } = {}) {
      const id = crypto.randomUUID(); users[id] = { method, email: email ? String(email).slice(0, 80) : null, createdAt: clock().toISOString() };
      repo.seedProfile({ userId: id, displayName: email || `Jugador/a ${id.slice(0, 4)}`, isTester: true }); persist();
      return { userId: id, token: `mock.${id}`, method };
    },
    // Iniciar sesión en «otro dispositivo» con la misma cuenta (simulado: por email)
    async signIn({ email }) {
      const id = Object.keys(users).find(k => users[k].email && users[k].email === String(email || '').slice(0, 80));
      if (!id) throw Object.assign(new Error('account_not_found'), { code: 'account_not_found' });
      return { userId: id, token: `mock.${id}`, method: users[id].method };
    },
    checkout: (token, body) => call(() => svc.createCheckout(userOf(token), body)),
    entitlements: (token) => call(() => svc.getEntitlements(userOf(token))),
    orderStatus: (token, orderId) => call(() => svc.orderStatus(userOf(token), orderId)),
    purchases: (token) => call(() => svc.purchaseHistory(userOf(token))),
    restore: (token, body) => call(() => svc.restore(userOf(token), body)),
    promo: (token, code) => call(() => svc.redeemPromo(userOf(token), code)),
    storefront: (token, game) => call(() => svc.storefront(userOf(token), game)),
    track: (token, name, props) => call(() => svc.track((userOf(token) || {}).id || null, name, props)),
    deleteAccount: (token) => call(async () => { const u = userOf(token); const r = await svc.deleteAccount(u); delete users[u.id]; return r; }),
    // ---- lo que en real hace Stripe: el usuario paga en la página de Stripe y Stripe llama al webhook ----
    async completeCheckout(orderId, outcome = 'paid') {
      const o = await repo.getOrder(orderId); if (!o || !o.providerCheckoutId) throw Object.assign(new Error('order_not_found'), { code: 'order_not_found' });
      const sid = o.providerCheckoutId;
      const ev = outcome === 'paid' ? stripe.pay(sid) : outcome === 'failed' ? (stripe.pay(sid, { async: true }), stripe.asyncResult(sid, false)) : stripe.expire(sid);
      // El webhook llega un poco después (la página de éxito NO concede nada: espera al servidor)
      setTimeout(() => { call(() => deliver(ev)).catch(() => {}); }, webhookDelayMs);
      return { submitted: true };
    },
    async refund(orderId) { const o = await repo.getOrder(orderId); return call(() => deliver(stripe.refund(o.providerCheckoutId))); },
    seedPromo(p) { repo.seedPromo(p); persist(); },
    _svc: svc, _repo: repo,
  };
}
