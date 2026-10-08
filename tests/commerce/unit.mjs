// Tests unitarios del núcleo: catálogo, dinero, router, visibilidad, configuración, firma, telemetría, órdenes.
import { CATALOG, PRODUCTS, ENTITLEMENTS, PRODUCT_TYPES, PRODUCT_STATUSES, getProduct } from '../../commerce/catalog/catalog.js';
import { formatMinor, assertMinor } from '../../commerce/core/money.js';
import { choosePaymentProvider } from '../../commerce/core/router.js';
import { resolveConfig, DEFAULT_CONFIG, FEATURE_FLAGS } from '../../commerce/core/config.js';
import { visibleProducts, productState, featured } from '../../commerce/core/visibility.js';
import { verifyStripeSignature, signPayload } from '../../commerce/core/stripeSignature.js';
import { sanitizeEvent, PURCHASE_EVENTS } from '../../commerce/core/analytics.js';
import { canTransition, ORDER_STATES } from '../../commerce/core/orders.js';
import { encodeForm, createStripeApi } from '../../commerce/core/stripeApi.js';
import { PRESTIGE_CAREERS, PRESTIGE_STATES, prestigeState, startCandidacy, campaignWeek, election, officeWeek, eligibility } from '../../commerce/core/prestige.js';
import { SPORTS, canPlaySport, registerSportModule, SPORT_MODULE_INTERFACE } from '../../commerce/core/sports.js';
import { readFileSync, existsSync } from 'node:fs';
import { SHARED, sharedContent } from '../../commerce/tools/sync-backend.mjs';
import { catalogDoc } from '../../commerce/tools/gen-catalog-doc.mjs';
import { placementAllowed, interstitialAllowed, createMockAdProvider, REWARDED_PLACEMENTS } from '../../commerce/core/ads.js';

export async function runUnit(check) {
  // ---------- Catálogo ----------
  const skus = PRODUCTS.map(p => p.id);
  check('Catálogo: SKUs únicos, tipos y estados válidos, versión', new Set(skus).size === skus.length && PRODUCTS.every(p => PRODUCT_TYPES.includes(p.type) && PRODUCT_STATUSES.includes(p.status)) && CATALOG.version >= 1);
  check('Catálogo: todos los entitlements concedidos existen en el registro', PRODUCTS.every(p => p.entitlements.every(e => ENTITLEMENTS[e])));
  check('Catálogo: precios en unidades mínimas enteras (nunca 0.99)', PRODUCTS.every(p => Object.values(p.prices).every(v => v == null || (Number.isInteger(v) && v > 0))));
  check('Catálogo: precios pedidos (Debut 0,99 · Street 1,99 · Pro 2,99 · Luxury 3,99 · Magnate 4,99 · Founder 4,99 · Sin anuncios 3,99 · +3 carreras 1,99 · deportes 2,99 · Club owner 3,99 · Prestige 0,99)',
    getProduct('pack_debut').prices.EUR === 99 && getProduct('pack_street').prices.EUR === 199 && getProduct('pack_pro').prices.EUR === 299 && getProduct('pack_luxury').prices.EUR === 399 && getProduct('pack_magnate').prices.EUR === 499 && getProduct('founder_pack').prices.EUR === 499
    && getProduct('remove_ads').prices.EUR === 399 && getProduct('extra_save_slots_3').prices.EUR === 199 && ['climbing', 'tennis', 'basketball', 'skate', 'surf'].every(s => getProduct(`sport_${s}`).prices.EUR === 299) && getProduct('expansion_club_owner').prices.EUR === 399 && getProduct('prestige_world_football_president').prices.EUR === 99 && getProduct('prestige_world_sports_committee').prices.EUR === 199);
  check('Catálogo: los bundles listan exactamente su contenido y sus entitlements coinciden', PRODUCTS.filter(p => p.type === 'BUNDLE').every(b => b.bundleContents && b.bundleContents.flatMap(s => getProduct(s).entitlements).sort().join() === b.entitlements.slice().sort().join()));
  check('Catálogo: el Prestige Bundle no incluye carreras futuras (8 con nombre)', getProduct('prestige_bundle').entitlements.length === 8);
  check('Catálogo: vertical slice — Pack Debut active; Escalada y Presidente Mundial en testing', getProduct('pack_debut').status === 'active' && getProduct('sport_climbing').status === 'testing' && getProduct('prestige_world_football_president').status === 'testing');
  check('Catálogo: Presidente Mundial de Escalada requiere sport.climbing; Comité Mundial requiere 2 deportes', getProduct('prestige_world_climbing_president').requires.all.includes('sport.climbing') && getProduct('prestige_world_sports_committee').requires.anyCount.n === 2);
  check('Catálogo: Prestige avisa de que comprar NO garantiza ganar', PRODUCTS.filter(p => p.type === 'PRESTIGE_CAREER').every(p => /NO garantiza ganar/.test(p.disclaimer)));
  check('Catálogo: sin marcas oficiales sin licencia (FIFA, FIBA, IFSC, COI/IOC, UEFA)', !/\b(FIFA|FIBA|IFSC|IOC|COI|UEFA)\b/.test(JSON.stringify(CATALOG)));
  check('Catálogo: ningún entitlement es de tipo poder (solo cosmetic/ads/slots/sport/expansion/prestige)', Object.values(ENTITLEMENTS).every(e => ['cosmetic', 'ads', 'slots', 'sport', 'expansion', 'prestige'].includes(e.kind)));
  check('Catálogo: sin moneda premium (gemas, diamantes, tokens)', !/gema|diamante|token|coins?\b/i.test(PRODUCTS.map(p => p.name + p.description).join(' ')));
  check('Catálogo: ids de Apple/Google por convención y sin ids de Stripe (van por entorno en la BD)', getProduct('pack_debut').platformProducts.apple.productId === 'com.delbarrio.pack_debut' && getProduct('pack_debut').platformProducts.google.productId === 'pack_debut' && !/price_|prod_/.test(JSON.stringify(CATALOG)));
  check('Catálogo: los packs cosméticos se declaran «solo aspecto»', PRODUCTS.filter(p => p.type === 'COSMETIC_PACK').every(p => p.cosmeticOnly));
  // ---------- Dinero ----------
  check('Dinero: 99 → «0,99 €»; 899 → «8,99 €»', formatMinor(99) === '0,99 €' && formatMinor(899) === '8,99 €');
  let floatErr = null; try { assertMinor(0.99); } catch (e) { floatErr = e; }
  check('Dinero: un float (0.99) se rechaza', !!floatErr);
  // ---------- Router ----------
  const p = getProduct('pack_debut');
  const prod = resolveConfig(DEFAULT_CONFIG, { environment: 'production', appleBillingEnabled: true, googleBillingEnabled: true });
  check('Router: prototipo (plataforma mock) → Mock; en producción nunca Mock; la web en desarrollo usa Stripe TEST', choosePaymentProvider(p, { platform: 'mock' }, resolveConfig()).provider === 'mock' && choosePaymentProvider(p, { platform: 'mock' }, prod).provider === null && choosePaymentProvider(p, { platform: 'web' }, resolveConfig()).provider === 'stripe');
  check('Router: web/PWA → Stripe', choosePaymentProvider(p, { platform: 'web' }, prod).provider === 'stripe' && choosePaymentProvider(p, { platform: 'pwa' }, prod).provider === 'stripe');
  check('Router: iOS sin programa aprobado → Apple (StoreKit), nunca Stripe', choosePaymentProvider(p, { platform: 'ios', storefront: 'ESP', appleExternalEligible: true }, prod).provider === 'apple');
  const iosEU = resolveConfig(prod, { ios: { externalPurchase: { enabled: true, storefronts: ['ESP'] } } });
  check('Router: iOS UE con permiso, tienda incluida y dispositivo elegible → Stripe con aviso del sistema', (r => r.provider === 'stripe' && r.requiresSystemDisclosure)(choosePaymentProvider(p, { platform: 'ios', storefront: 'ESP', appleExternalEligible: true }, iosEU)));
  check('Router: iOS UE pero dispositivo NO elegible, otra tienda o menor → Apple', choosePaymentProvider(p, { platform: 'ios', storefront: 'ESP', appleExternalEligible: false }, iosEU).provider === 'apple' && choosePaymentProvider(p, { platform: 'ios', storefront: 'USA', appleExternalEligible: true }, iosEU).provider === 'apple' && choosePaymentProvider(p, { platform: 'ios', storefront: 'ESP', appleExternalEligible: true, age: 15 }, iosEU).provider === 'apple');
  check('Router: Android sin programa → Google Play Billing', choosePaymentProvider(p, { platform: 'android', country: 'ES' }, prod).provider === 'google');
  const andEU = resolveConfig(prod, { android: { alternativeBilling: { enabled: true, countries: ['ES'], mode: 'user_choice' } } });
  check('Router: Android EEE inscrito → Stripe + informe a Google (y Google en paralelo en user choice)', (r => r.provider === 'stripe' && r.reportTo && r.alsoOfferGoogle)(choosePaymentProvider(p, { platform: 'android', country: 'ES' }, andEU)) && choosePaymentProvider(p, { platform: 'android', country: 'US' }, andEU).provider === 'google');
  check('Router: comercio apagado → ningún proveedor', choosePaymentProvider(p, { platform: 'web' }, resolveConfig(prod, { commerceEnabled: false })).provider === null);
  check('Router: Apple desactivado → no cae en Stripe por defecto', choosePaymentProvider(p, { platform: 'ios' }, resolveConfig(prod, { appleBillingEnabled: false })).provider === null);
  // ---------- Configuración ----------
  check('Config: feature flags pedidos existen', FEATURE_FLAGS.every(f => typeof DEFAULT_CONFIG[f] === 'boolean'));
  check('Config: un override fuera de producción no puede activar el modo live', resolveConfig(DEFAULT_CONFIG, { environment: 'staging', liveModeAllowed: true }).liveModeAllowed === false);
  check('Config: live desactivado por defecto incluso en producción', resolveConfig(DEFAULT_CONFIG, { environment: 'production' }).liveModeAllowed === false);
  // ---------- Visibilidad (no bombardear) ----------
  const ctx0 = { environment: 'production', entitlements: [], game: { hitos: {} } };
  const vis0 = visibleProducts(CATALOG, ctx0, prod).map(x => x.id);
  check('Visibilidad: al empezar no se ven ni Debut (sin contrato) ni expansiones de empresa ni packs de campeón', !vis0.includes('pack_debut') && !vis0.includes('expansion_club_owner') && !vis0.some(s => s.startsWith('champion_pack_')));
  const ctx1 = { environment: 'production', entitlements: [], game: { hitos: { contrato: 3 }, trophies: ['copa'], club: 'puerto' } };
  const vis1 = visibleProducts(CATALOG, ctx1, prod).map(x => x.id);
  check('Visibilidad: con contrato aparece Debut; con la Copa ganada, el Pack Campeón de Copa (y no los demás)', vis1.includes('pack_debut') && vis1.includes('champion_pack_copa') && !vis1.includes('champion_pack_mundial') && vis1.includes('club_pack_puerto') && !vis1.includes('club_pack_costa'));
  check('Visibilidad: destacados como mucho 3 y nunca algo comprado', featured(CATALOG, Object.assign({}, ctx1, { entitlements: ['cosmetic.debut_pack'] }), prod).every(x => x.id !== 'pack_debut') && featured(CATALOG, ctx1, prod).length <= 3);
  check('Visibilidad: «draft» y «retired» nunca se ven', !vis1.includes('season_pass'));
  const st = productState(getProduct('prestige_world_climbing_president'), ctx1, prod);
  check('Ficha: dependencia visible antes de pagar («necesitas Escalada»)', !st.purchasable && (st.blocked === 'coming_soon' || st.requires.missing.includes('sport.climbing')) && st.requires.missing.includes('sport.climbing'));
  // ---------- Firma de webhooks ----------
  const raw = JSON.stringify({ id: 'evt_1', type: 'x' }), now = 1_800_000_000;
  const h = await signPayload(raw, 'whsec_a', now);
  check('Firma: una firma correcta verifica', (await verifyStripeSignature(raw, h, 'whsec_a', { now })).id === 'evt_1');
  const fails = [];
  for (const [nm, args] of [['secreto', [raw, h, 'whsec_b', { now }]], ['cuerpo', [raw + ' ', h, 'whsec_a', { now }]], ['tolerancia', [raw, h, 'whsec_a', { now: now + 301 }]], ['sin cabecera', [raw, '', 'whsec_a', { now }]], ['tolerancia 0', [raw, h, 'whsec_a', { now, toleranceSec: 0 }]], ['sin secreto', [raw, h, '', { now }]]])
    try { await verifyStripeSignature(...args); fails.push(nm); } catch (_) { /* ok */ }
  check('Firma: falla con otro secreto, cuerpo alterado, fuera de tolerancia, sin cabecera, tolerancia 0 o sin secreto', fails.length === 0, fails.join());
  check('Firma: acepta varias v1 (rotación de secreto)', !!(await verifyStripeSignature(raw, h + ',v1=deadbeef', 'whsec_a', { now })));
  // ---------- Stripe REST ----------
  check('Stripe REST: codificación de formulario anidada (metadata, line_items)', encodeForm({ a: 1, metadata: { order_id: 'o' }, line_items: [{ price: 'p', quantity: 1 }] }) === 'a=1&metadata%5Border_id%5D=o&line_items%5B0%5D%5Bprice%5D=p&line_items%5B0%5D%5Bquantity%5D=1');
  let seen = null;
  const api = createStripeApi({ secretKey: 'sk_test_x', apiVersion: '2026-09-30.endive', fetchImpl: async (url, init) => { seen = { url, init }; return { ok: true, json: async () => ({ id: 'cs_1' }) }; } });
  await api.createCheckoutSession({ mode: 'payment' }, 'checkout_o1');
  check('Stripe REST: versión de API fijada, Idempotency-Key y clave solo en cabecera de servidor', seen.init.headers['Stripe-Version'] === '2026-09-30.endive' && seen.init.headers['Idempotency-Key'] === 'checkout_o1' && seen.url === 'https://api.stripe.com/v1/checkout/sessions' && !api.livemode);
  // ---------- Telemetría ----------
  check('Telemetría: eventos del embudo definidos', ['store_open', 'product_view', 'purchase_click', 'checkout_started', 'checkout_cancelled', 'purchase_success', 'purchase_failed', 'entitlement_granted', 'entitlement_restored', 'refund', 'bundle_view', 'prestige_view', 'expansion_view'].every(e => PURCHASE_EVENTS.includes(e)));
  const san = sanitizeEvent('purchase_click', { sku: 'pack_debut', cardNumber: '4242424242424242', email: 'a@b.c', priceMinor: 99 });
  check('Telemetría: nunca datos de tarjeta ni email; eventos desconocidos se descartan', san.props.sku === 'pack_debut' && !('cardNumber' in san.props) && !('email' in san.props) && sanitizeEvent('hack', {}) === null);
  // ---------- Órdenes ----------
  check('Órdenes: 10 estados y transiciones cerradas (REFUNDED/REVOKED son finales)', ORDER_STATES.length === 10 && !canTransition('REFUNDED', 'FULFILLED') && !canTransition('CREATED', 'FULFILLED') && canTransition('PAID', 'FULFILLED') && canTransition('DISPUTED', 'REVOKED'));

  // ---------- Prestige ----------
  const W = PRESTIGE_CAREERS.world_football_president;
  check('Prestige: 10 estados (LOCKED…FORMER)', PRESTIGE_STATES.join() === 'LOCKED,PURCHASED,NOT_ELIGIBLE,ELIGIBLE,CANDIDATE,CAMPAIGN,ELECTION,OFFICE,REELECTION,FORMER');
  check('Prestige: sin compra → LOCKED', prestigeState(W, { entitlements: [], game: { age: 60, rep: 100, seasons: 20, marca: 100, institutional: 5 } }) === 'LOCKED');
  const novato = { age: 22, rep: 30, seasons: 2, marca: 5 };
  check('Prestige: comprar NO concede el cargo (sin requisitos → NOT_ELIGIBLE)', prestigeState(W, { entitlements: [W.entitlement], game: novato }) === 'NOT_ELIGIBLE' && !startCandidacy(W, { entitlements: [W.entitlement], game: novato }).ok);
  check('Prestige: dice qué falta (edad, prestigio, temporadas, experiencia institucional)', eligibility(W, novato).missing.length >= 4);
  const veterano = { age: 40, rep: 90, seasons: 12, marca: 60, institutional: 1 };
  const c0 = startCandidacy(W, { entitlements: [W.entitlement], game: veterano });
  let pr = c0.progress; for (let i = 0; i < 6; i++) pr = campaignWeek(pr, { effort: 1, rep: 90 });
  check('Prestige: con requisitos → candidatura → campaña → votación', c0.ok && pr.state === 'ELECTION' && pr.supports > 0);
  check('Prestige: la votación se puede perder (vuelve a ELIGIBLE) y ganar (OFFICE)', election(W, pr, 0.99).state === 'ELIGIBLE' && election(W, pr, 0.0).state === 'OFFICE');
  let of = election(W, pr, 0); for (let i = 0; i < W.termWeeks; i++) of = officeWeek(of);
  check('Prestige: al acabar el mandato → REELECTION; perderla → FORMER', of.state === 'REELECTION' && election(W, Object.assign({}, of, { supports: 0 }), 0.99).state === 'FORMER');
  check('Prestige: Presidente Mundial de Escalada exige la expansión Escalada', eligibility(PRESTIGE_CAREERS.world_climbing_president, Object.assign({ entitlements: [] }, veterano)).missing.some(m => /sport\.climbing/.test(m)));
  // ---------- Deportes ----------
  check('Deportes: fútbol base gratis; los demás con entitlement', canPlaySport('football', []).ok && canPlaySport('climbing', []).reason === 'locked' && SPORTS.length === 6);
  check('Deportes: Escalada comprada pero sin motor jugable todavía → «Próximamente» (no se rompe nada)', canPlaySport('climbing', ['sport.climbing']).reason === 'coming_soon' && canPlaySport('climbing', ['sport.climbing']).owned);
  let modErr = null; try { registerSportModule({ id: 'x', careerEngine: null }); } catch (e) { modErr = e; }
  check('Deportes: un módulo sin la interfaz completa se rechaza', !!modErr && SPORT_MODULE_INTERFACE.length === 9);
  // ---------- Anuncios ----------
  const cfgAds = resolveConfig();
  check('Anuncios: placements recompensados pedidos y permitidos', ['store_discount', 'store_special_offer', 'small_energy', 'offline_business_bonus', 'cosmetic_reward'].every(p => REWARDED_PLACEMENTS.includes(p) && placementAllowed(p, cfgAds)));
  check('Anuncios: nunca repetir partido, cambiar resultado, evitar descenso, recuperar prueba ni borrar decisión', ['retry_match', 'change_result', 'avoid_relegation', 'retry_trial', 'undo_decision'].every(p => !placementAllowed(p, resolveConfig(cfgAds, { rewarded: { placements: ['retry_match', 'change_result', 'avoid_relegation', 'retry_trial', 'undo_decision'] } }))));
  check('Anuncios: la vida extra para minijuegos está apagada por defecto (experimento del prototipo)', !placementAllowed('minigame_life', cfgAds) && placementAllowed('minigame_life', resolveConfig(cfgAds, { rewarded: { minigameLife: true } })));
  check('Anuncios: «Quitar anuncios» quita solo los obligatorios; los recompensados siguen', !interstitialAllowed(['ads.remove_interstitial'], cfgAds) && interstitialAllowed([], cfgAds) && placementAllowed('store_discount', cfgAds));
  const ad = createMockAdProvider({ config: cfgAds });
  check('Anuncios: MockAdProvider recompensa sin red y respeta las reglas', (await ad.showRewarded('small_energy')).rewarded && !(await ad.showRewarded('change_result')).rewarded && !(await ad.showInterstitial(['ads.remove_interstitial'])).shown);

  // ---------- Backend: copias y secretos ----------
  const out = SHARED.filter(rel => { const f = new URL(`../../backend/supabase/functions/_shared/commerce/${rel}`, import.meta.url); return !existsSync(f) || readFileSync(f, 'utf8') !== sharedContent(rel); });
  check('Backend: el núcleo copiado a las Edge Functions está al día (node commerce/tools/sync-backend.mjs)', out.length === 0, out.join());
  const envEx = readFileSync(new URL('../../backend/.env.example', import.meta.url), 'utf8');
  check('Backend: .env.example sin secretos reales (solo marcadores)', !/sk_(test|live)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}|sb_secret_[A-Za-z0-9]{8,}/.test(envEx) && /STRIPE_SECRET_KEY=/.test(envEx) && /STRIPE_WEBHOOK_SECRET=/.test(envEx));
  const cfgToml = readFileSync(new URL('../../backend/supabase/config.toml', import.meta.url), 'utf8');
  check('Backend: el webhook de Stripe no exige JWT (verifica la firma); el resto sí', /\[functions\.stripe-webhook\]\s*\nverify_jwt = false/.test(cfgToml) && !/\[functions\.checkout-session\]/.test(cfgToml));
  check('Backend: .gitignore protege los .env', /\.env/.test(readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8')));
  check('Docs: CATALOG.md está al día con el catálogo (node commerce/tools/gen-catalog-doc.mjs)', readFileSync(new URL('../../docs/commerce/CATALOG.md', import.meta.url), 'utf8') === catalogDoc());
}
