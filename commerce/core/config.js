// Configuración remota y feature flags. El cliente recibe esto desde el backend (tabla remote_config) y lo cachea.
// Nada de esto es secreto. Los secretos van en variables de entorno del servidor.
export const DEFAULT_CONFIG = {
  environment: 'development',          // development | staging | production
  commerceEnabled: true,
  stripeEnabled: true,
  appleBillingEnabled: false,
  googleBillingEnabled: false,
  rewardedEnabled: true,
  interstitialEnabled: true,
  prestigeEnabled: true,
  sportExpansionEnabled: true,
  stripeTaxEnabled: false,
  requireWithdrawalConsent: true,      // UE: casilla expresa antes de pagar contenido digital (requiere revisión legal)             // activar al configurar Stripe Tax (ver STRIPE.md)
  liveModeAllowed: false,              // «ACTIVAR PRODUCCIÓN»: solo lo cambia el responsable
  visibleSkus: null,                   // null = según catálogo; o lista para limitar
  hiddenSkus: [],
  maxFeatured: 3,
  refunds: { partialRevokes: false },
  disputes: { suspend: true },
  ios: { externalPurchase: { enabled: false, storefronts: [] } },          // UE: solo con entitlement Apple aprobado
  android: { alternativeBilling: { enabled: false, countries: [], mode: null } }, // 'alternative_only' | 'user_choice' | 'external_offers'
  rewarded: { placements: ['store_discount', 'store_special_offer', 'small_energy', 'offline_business_bonus', 'cosmetic_reward'], dailyCap: 6, minigameLife: false },   // minigameLife: experimento del prototipo; apagado en producción (regla: anuncios no cambian resultados)
  rateLimits: { checkout: [10, 600], promo: [5, 3600], restore: [6, 600], sync: [60, 600] },   // [máx, segundos]
  experiments: {},
};
export const FEATURE_FLAGS = ['commerceEnabled', 'stripeEnabled', 'appleBillingEnabled', 'googleBillingEnabled', 'rewardedEnabled', 'interstitialEnabled', 'prestigeEnabled', 'sportExpansionEnabled'];

// Mezcla profunda: lo remoto pisa lo local, sin permitir que un override active producción por error
export function resolveConfig(base = DEFAULT_CONFIG, ...overrides) {
  const out = JSON.parse(JSON.stringify(base));
  for (const o of overrides) if (o && typeof o === 'object') merge(out, o);
  if (out.environment !== 'production') out.liveModeAllowed = false;
  return out;
}
function merge(t, o) {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) merge(t[k], v);
    else t[k] = v;
  }
}
