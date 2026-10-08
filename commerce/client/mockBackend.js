// Backend SIMULADO en el navegador (sin red): el MISMO CommerceService del servidor con repositorio en memoria
// (guardado en localStorage como si fuera la base de datos) y un Stripe falso que firma los webhooks como el real.
// Representa al servidor: borrar la partida o la caché del juego no borra estas compras.
import { createCommerceService } from '../core/service.js';
import { createMemoryRepo } from '../core/memoryRepo.js';
import { createFakeStripe } from '../core/fakeStripe.js';
import { createAccountService } from '../core/accounts.js';

export function createMockBackend({ storage, key = 'dban_mock_server_v1', webhookDelayMs = 900, clock = () => new Date(), config = {} } = {}) {
  const SECRET = 'whsec_mock_local';
  const load = () => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch (_) { return null; } };
  const saved = load() || {};
  const repo = createMemoryRepo({ state: saved.db || null });
  const users = saved.users || {};
  const stripe = createFakeStripe({ webhookSecret: SECRET, clock, mock: true });
  const svc = createCommerceService({ repo, stripe, clock, config: Object.assign({ environment: 'development' }, config), env: { environment: 'development', stripeWebhookSecret: SECRET, appUrl: 'mock://juego' } });
  const accounts = createAccountService({ repo, clock, commerce: svc });
  const codes = saved.codes || {};   // email → { code, exp, tries, intent } (como el servicio de correo de Supabase)
  const persist = () => { try { storage.setItem(key, JSON.stringify({ db: repo.dump(), users, codes })); } catch (_) { /* almacenamiento lleno o bloqueado: sigue en memoria */ } };
  const fail = code => { throw Object.assign(new Error(code), { code }); };
  const normEmail = e => String(e || '').trim().toLowerCase().slice(0, 80);
  const byEmail = e => Object.keys(users).find(k => users[k].email && users[k].email === normEmail(e));
  const crear = (method, email) => {
    const id = crypto.randomUUID(); users[id] = { method, email: email ? normEmail(email) : null, createdAt: clock().toISOString() };
    repo.seedProfile({ userId: id, displayName: null, isTester: true, createdAt: clock().toISOString() }); persist();
    return { userId: id, token: `mock.${id}`, method, email: users[id].email, isNew: true };
  };
  const userOf = token => { const id = String(token || '').replace(/^mock\./, ''); const u = users[id]; return u ? { id, isTester: true } : null; };
  const call = async (fn) => { try { return await fn(); } finally { persist(); } };
  const deliver = async ev => { const s = await stripe.signed(ev); return svc.handleStripeWebhook(s.raw, s.header); };
  return {
    kind: 'mock',
    // Apple / Google (simulado: la «hoja» del sistema la pinta el juego). Con «Ocultar mi email» llega un alias de reenvío.
    async signUp({ method = 'email', email = null } = {}) {
      if (email && byEmail(email)) fail('account_exists');
      return crear(method, email);
    },
    // Iniciar sesión en «otro dispositivo» con la misma cuenta (simulado: por email)
    async signIn({ email }) {
      const id = byEmail(email);
      if (!id) fail('account_not_found');
      return { userId: id, token: `mock.${id}`, method: users[id].method, email: users[id].email };
    },
    // Código de 6 cifras por email. En la versión de prueba NO se manda ningún correo: el código vuelve en `testCode`
    // y el juego lo enseña en una «bandeja de entrada simulada».
    async requestCode({ email, intent = 'signup' }) {
      const e = normEmail(email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail('invalid_email');
      if (intent === 'signin' && !byEmail(e)) fail('account_not_found');
      if (intent === 'signup' && byEmail(e)) fail('account_exists');
      const prev = codes[e], t = clock().getTime();
      if (prev && t - prev.sentAt < 30000) fail('rate_limited');   // reenviar: como mucho cada 30 s
      const code = String(Math.floor(100000 + Math.random() * 900000));
      codes[e] = { code, exp: t + 10 * 60000, tries: 0, intent, sentAt: t }; persist();
      return { sent: true, testCode: code };
    },
    async verifyCode({ email, code }) {
      const e = normEmail(email), c = codes[e], t = clock().getTime();
      if (!c) fail('invalid_code');
      if (t > c.exp) { delete codes[e]; persist(); fail('code_expired'); }
      if (c.tries >= 5) { delete codes[e]; persist(); fail('too_many_attempts'); }
      if (String(code || '').trim() !== c.code) { c.tries++; persist(); fail('invalid_code'); }
      delete codes[e]; persist();
      const id = byEmail(e);
      if (id) return { userId: id, token: `mock.${id}`, method: users[id].method, email: e, isNew: false };
      if (c.intent === 'signin') fail('account_not_found');
      return crear('email', e);
    },
    profile: (token) => call(() => accounts.getProfile(userOf(token))),
    updateProfile: (token, patch) => call(async () => { const p = await accounts.updateProfile(userOf(token), patch); return p; }),
    getSaves: (token) => call(() => accounts.getSaves(userOf(token))),
    putSaves: (token, blob) => call(() => accounts.putSaves(userOf(token), blob)),
    exportData: (token) => call(async () => { const u = userOf(token); const d = await accounts.exportData(u); return Object.assign(d, { account: { method: users[u.id].method, email: users[u.id].email, createdAt: users[u.id].createdAt } }); }),
    // Lo que en real hace la madre/padre/tutor desde el enlace de SU correo (aquí, un botón de prueba)
    approveParent: (token, ok = true) => call(() => accounts.setParentalStatus(userOf(token).id, ok ? 'approved' : 'rejected')),
    checkout: (token, body) => call(() => svc.createCheckout(userOf(token), body)),
    entitlements: (token) => call(() => svc.getEntitlements(userOf(token))),
    orderStatus: (token, orderId) => call(() => svc.orderStatus(userOf(token), orderId)),
    purchases: (token) => call(() => svc.purchaseHistory(userOf(token))),
    restore: (token, body) => call(() => svc.restore(userOf(token), body)),
    promo: (token, code) => call(() => svc.redeemPromo(userOf(token), code)),
    storefront: (token, game) => call(() => svc.storefront(userOf(token), game)),
    track: (token, name, props) => call(() => svc.track((userOf(token) || {}).id || null, name, props)),
    deleteAccount: (token) => call(async () => { const u = userOf(token); const r = await svc.deleteAccount(u); const em = users[u.id] && users[u.id].email; if (em) delete codes[em]; delete users[u.id]; return r; }),
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
