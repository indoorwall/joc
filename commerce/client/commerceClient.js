// Cliente de comercio del juego: cuenta, caché de entitlements (offline), sincronizar, restaurar y comprar.
// La caché es solo eso: la fuente de verdad es el servidor. Se guarda APARTE de la partida (borrar la partida no
// borra compras; borrar la caché tampoco: «Restaurar» las recupera de la cuenta).
import { CATALOG, getProduct } from '../catalog/catalog.js';
import { resolveConfig } from '../core/config.js';
import { choosePaymentProvider } from '../core/router.js';
import { visibleProducts, productState, featured } from '../core/visibility.js';
import { sanitizeEvent } from '../core/analytics.js';
import { accountHash } from '../core/service.js';
import { createMockPaymentProvider, createStripePaymentProvider, createApplePaymentProvider, createGooglePaymentProvider } from './providers.js';

export const PURCHASE_TERMS = {
  accountPrompt: 'Crea una cuenta para proteger y restaurar tus compras en cualquier dispositivo.',
  prestige: 'Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.',
  permanent: 'Compra permanente: se guarda en tu cuenta y la puedes restaurar en cualquier dispositivo.',
  cosmetic: 'Solo aspecto: no da nivel, reputación, marca, dinero ni resultados.',
  withdrawal: 'Quiero recibirlo ya y acepto que, al ser contenido digital entregado al momento, pierdo el derecho de desistimiento de 14 días.',   // requiere revisión legal
  verifying: 'Estamos verificando tu compra…',
  slow: 'Pago realizado. La compra puede tardar unos segundos en sincronizarse.',
};

export function createCommerceClient({ backend, storage, platform = 'mock', config: cfg = {}, bridge = null, navigate = null, key = 'dban_commerce_v1', isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false), onChange = () => {} }) {
  const config = resolveConfig(undefined, cfg);
  const load = () => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch (_) { return null; } };
  let st = load() || { account: null, cache: { userId: null, entitlements: [], syncedAt: null } };
  const save = () => { try { storage.setItem(key, JSON.stringify(st)); } catch (_) { /* sin almacenamiento: sigue en memoria */ } onChange(); };
  const providers = {
    mock: createMockPaymentProvider({ backend }),
    stripe: createStripePaymentProvider({ backend, navigate }),
    apple: createApplePaymentProvider({ backend, bridge }),
    google: createGooglePaymentProvider({ backend, bridge }),
  };
  const token = () => st.account && st.account.token;
  const ents = () => (st.account && st.cache.userId === st.account.id ? st.cache.entitlements : []);
  const err = (code, extra) => Object.assign(new Error(code), { code }, extra || {});

  const api = {
    config, platform, terms: PURCHASE_TERMS, catalog: CATALOG,
    account: () => st.account,
    isGuest: () => !st.account,
    online: isOnline,
    entitlements: ents,
    has: id => ents().includes(id),
    lastSync: () => st.cache.syncedAt,
    async createAccount({ method = 'email', email = null } = {}) {
      if (!isOnline()) throw err('offline');
      const r = await backend.signUp({ method, email });
      st.account = { id: r.userId, token: r.token, method: r.method || method, email: email || null };
      save(); await api.track('account_created', { source: method });
      return api.sync();
    },
    async signIn({ email }) {
      if (!isOnline()) throw err('offline');
      const r = await backend.signIn({ email });
      st.account = { id: r.userId, token: r.token, method: r.method, email };
      save(); return api.sync();
    },
    signOut() { st.account = null; save(); },
    // Sincroniza con el servidor; offline devuelve la caché (se revalida al volver)
    async sync() {
      if (!st.account) return [];
      if (!isOnline()) return ents();
      const r = await backend.entitlements(token());
      st.cache = { userId: st.account.id, entitlements: r.entitlements, syncedAt: r.syncedAt };
      save(); return r.entitlements;
    },
    async restore() {
      if (!st.account) throw err('account_required');
      if (!isOnline()) throw err('offline');
      await api.track('restore_click', {});
      const p = providers[platform === 'ios' ? 'apple' : platform === 'android' ? 'google' : 'mock'];
      const r = p && p.restore && p.available() ? await p.restore({ token: token() }) : await backend.restore(token(), {});
      st.cache = { userId: st.account.id, entitlements: r.entitlements, syncedAt: r.restoredAt || new Date().toISOString() };
      save(); await api.track('entitlement_restored', { source: platform });
      return r.entitlements;
    },
    // Tienda: lo que se ve y el estado de cada ficha (dependencias visibles ANTES de pagar)
    store(game = {}, opts = {}) {
      const ctx = { environment: config.environment, isTester: true, entitlements: ents(), game, currency: 'EUR' };
      return { featured: featured(CATALOG, ctx, config), products: visibleProducts(CATALOG, ctx, config, opts).map(p => ({ product: p, state: productState(p, ctx, config) })) };
    },
    state(sku, game = {}) { const p = getProduct(sku); return p ? productState(p, { environment: config.environment, isTester: true, entitlements: ents(), game, currency: 'EUR' }, config) : null; },
    route(sku) { return choosePaymentProvider(getProduct(sku), { platform, appleExternalEligible: bridge && bridge.appleExternalEligible }, config); },
    // Comprar: cuenta obligatoria, online, proveedor según el router. Devuelve la orden; NUNCA concede aquí.
    async purchase(sku, { consentWithdrawal = false } = {}) {
      if (!isOnline()) throw err('offline');
      if (!st.account) throw err('account_required');
      const product = getProduct(sku); if (!product) throw err('unknown_product');
      const s = api.state(sku); if (!s.purchasable) throw err(s.blocked || 'not_purchasable', { requires: s.requires });
      const route = api.route(sku);
      const prov = route.provider && providers[route.provider];
      if (!prov || !prov.available()) throw err('provider_unavailable', { reason: route.reason });
      await api.track('purchase_click', { sku, priceMinor: product.prices.EUR, provider: route.provider, platform });
      const r = await prov.purchase(sku, { token: token(), consentWithdrawal, userId: st.account.id, accountHash: await accountHash(st.account.id), product, platform });
      await api.track('checkout_started', { sku, provider: route.provider });
      return Object.assign({ provider: route.provider }, r);
    },
    async orderStatus(orderId) { return backend.orderStatus(token(), orderId); },
    // «Estamos verificando tu compra»: espera al servidor (webhook) — nunca al success_url
    async waitForOrder(orderId, { tries = 20, intervalMs = 500, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
      for (let i = 0; i < tries; i++) {
        const o = await backend.orderStatus(token(), orderId);
        if (['FULFILLED', 'FAILED', 'CANCELLED', 'REFUNDED', 'REVOKED'].includes(o.status)) {
          st.cache = { userId: st.account.id, entitlements: o.entitlements || await api.sync(), syncedAt: new Date().toISOString() };
          save(); await api.track(o.status === 'FULFILLED' ? 'purchase_success' : 'purchase_failed', { sku: o.sku, reason: o.status });
          return o;
        }
        await sleep(intervalMs);
      }
      return { status: 'SLOW' };   // «Pago realizado. La compra puede tardar unos segundos en sincronizarse.»
    },
    async history() { if (!st.account) return { orders: [], other: [] }; return backend.purchases(token()); },
    async redeem(code) {
      if (!st.account) throw err('account_required');
      const r = await backend.promo(token(), code);
      st.cache = { userId: st.account.id, entitlements: r.entitlements, syncedAt: new Date().toISOString() }; save();
      await api.track('promo_redeemed', {});
      return r;
    },
    async deleteAccount() { if (!st.account) return; await backend.deleteAccount(token()); st = { account: null, cache: { userId: null, entitlements: [], syncedAt: null } }; save(); },
    async track(name, props) { const e = sanitizeEvent(name, props); if (!e || !backend.track) return; try { await backend.track(token(), e.name, e.props); } catch (_) { /* la telemetría nunca rompe el juego */ } },
    // Solo para pruebas: borra la caché local (no las compras, que están en la cuenta)
    clearCache() { st.cache = { userId: null, entitlements: [], syncedAt: null }; save(); },
  };
  return api;
}
