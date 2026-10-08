// Cliente del juego + backend simulado (el mismo servicio que el servidor): cuenta, compra, verificación,
// restaurar con caché vacía, otro dispositivo, offline, dependencias y gameplay intacto.
import { createCommerceClient } from '../../commerce/client/commerceClient.js';
import { createMockBackend } from '../../commerce/client/mockBackend.js';
import { TERMS_VERSION } from '../../commerce/core/accounts.js';

const memStorage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m }; };
const err = async p => { try { await p; return null; } catch (e) { return e.code || e.message; } };

export async function runClient(check) {
  const server = memStorage(), device1 = memStorage();
  const backend = createMockBackend({ storage: server, webhookDelayMs: 0 });
  let online = true;
  const c = createCommerceClient({ backend, storage: device1, platform: 'mock', isOnline: () => online });
  check('Cliente: sin cuenta no se puede comprar («crea una cuenta…»)', await err(c.purchase('pack_debut', { consentWithdrawal: true })) === 'account_required' && /Crea una cuenta para proteger y restaurar tus compras/.test(c.terms.accountPrompt));
  check('Cliente: sin cuenta se juega igual (sin entitlements, sin bloqueo)', c.isGuest() && c.entitlements().length === 0);
  await c.createAccount({ method: 'email', email: 'alex@test.local' });
  check('Cliente: sin completar el perfil (edad y términos) no se puede comprar', await err(c.purchase('pack_debut', { consentWithdrawal: true })) === 'profile_required');
  await c.updateProfile({ displayName: 'Alex', country: 'ES', ageBand: '18p', acceptTerms: TERMS_VERSION });
  check('Cliente: en desarrollo el router usa el proveedor simulado (nunca un pago real)', c.route('pack_debut').provider === 'mock');
  check('Cliente: «Próximamente» no se puede comprar (ni llega al servidor)', await err(c.purchase('sport_tennis', { consentWithdrawal: true })) === 'coming_soon');
  check('Cliente: sin la casilla de desistimiento no hay checkout', await err(c.purchase('pack_debut')) === 'withdrawal_consent_required');
  const r = await c.purchase('pack_debut', { consentWithdrawal: true });
  check('Cliente: comprar devuelve una orden con referencia (para soporte), sin conceder nada todavía', r.orderId && r.orderRef && !c.has('cosmetic.debut_pack'));
  await backend.completeCheckout(r.orderId, 'paid');
  const o = await c.waitForOrder(r.orderId, { intervalMs: 5 });
  check('Cliente: «Estamos verificando…» → el servidor confirma → Pack Debut activo', o.status === 'FULFILLED' && c.has('cosmetic.debut_pack'));
  const c2 = createCommerceClient({ backend, storage: device1, platform: 'mock' });
  check('Cliente: al recargar la página sigue comprado (caché)', c2.has('cosmetic.debut_pack'));
  c2.clearCache();
  check('Cliente: con la caché borrada no se ve…', !c2.has('cosmetic.debut_pack'));
  await c2.restore();
  check('Cliente: …y «Restaurar compras» lo recupera de la cuenta (sin pagar)', c2.has('cosmetic.debut_pack'));
  const c3 = createCommerceClient({ backend, storage: memStorage(), platform: 'mock' });
  await c3.signIn({ email: 'alex@test.local' });
  check('Cliente: otro dispositivo (almacenamiento vacío) + misma cuenta → Pack Debut', c3.has('cosmetic.debut_pack'));
  check('Cliente: no se puede comprar dos veces', await err(c3.purchase('pack_debut', { consentWithdrawal: true })) === 'owned');
  const h = await c3.history();
  check('Cliente: «Mis compras» con producto, fecha, proveedor, estado y referencia', h.orders.length === 1 && h.orders[0].name === 'Pack Debut' && h.orders[0].date && h.orders[0].provider === 'stripe' && h.orders[0].status === 'FULFILLED' && h.orders[0].orderRef);
  online = false;
  check('Cliente: offline se juega con los entitlements guardados…', c.has('cosmetic.debut_pack'));
  check('Cliente: …pero no se inician compras offline', await err(c.purchase('remove_ads', { consentWithdrawal: true })) === 'offline');
  online = true;
  const r2 = await c.purchase('remove_ads', { consentWithdrawal: true });
  await backend.completeCheckout(r2.orderId, 'failed');
  const o2 = await c.waitForOrder(r2.orderId, { intervalMs: 5 });
  check('Cliente: pago rechazado → no se concede', o2.status === 'FAILED' && !c.has('ads.remove_interstitial'));
  const r3 = await c.purchase('remove_ads', { consentWithdrawal: true });
  await backend.completeCheckout(r3.orderId, 'cancel');
  check('Cliente: checkout cancelado → no se concede', (await c.waitForOrder(r3.orderId, { intervalMs: 5 })).status === 'CANCELLED' && !c.has('ads.remove_interstitial'));
  const st = c.state('prestige_world_climbing_president');
  check('Cliente: la ficha avisa de la dependencia antes de cobrar («necesitas Escalada»)', !st.purchasable && st.requires.missing.includes('sport.climbing'));
  const store = c.store({ hitos: {} });
  check('Cliente: la tienda no bombardea (sin hitos: pocos productos, sin expansiones de empresa)', !store.products.some(x => x.product.id === 'expansion_club_owner') && store.featured.length <= 3);
  backend.seedPromo({ id: 'p-prensa', code: 'PRENSA2026', sku: 'promo_press', maxRedemptions: 10 });
  await c.redeem('prensa2026');
  check('Cliente: código promo canjeado → insignia de prensa', c.has('cosmetic.press_badge'));
  await backend.refund(r.orderId);
  await c.sync();
  check('Cliente: un reembolso retira el Pack Debut al sincronizar', !c.has('cosmetic.debut_pack'));
  await c.deleteAccount();
  check('Cliente: borrar la cuenta deja al jugador como invitado (la partida sigue)', c.isGuest());
}
