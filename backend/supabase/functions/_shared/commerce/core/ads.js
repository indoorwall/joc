// COPIA GENERADA de commerce/core/ads.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Anuncios: interfaz AdProvider + MockAdProvider (preparado para un SDK de anuncios real o mediación; hoy sin SDK).
// Regla: un anuncio con recompensa NUNCA repite un partido, cambia un resultado, evita un descenso,
// recupera una prueba ni borra una mala decisión.
export const REWARDED_PLACEMENTS = ['store_discount', 'store_special_offer', 'small_energy', 'offline_business_bonus', 'cosmetic_reward'];
export const FORBIDDEN_PLACEMENTS = ['retry_match', 'change_result', 'avoid_relegation', 'retry_trial', 'undo_decision'];
// Experimental (pedido en el prototipo): +1 vida para reintentar un minijuego. Choca con la regla anterior en los
// momentos que deciden categoría o títulos, así que en producción está APAGADO salvo decisión expresa (ver ENTITLEMENTS.md).
export const EXPERIMENTAL_PLACEMENTS = ['minigame_life'];

export function placementAllowed(placement, config) {
  if (FORBIDDEN_PLACEMENTS.includes(placement)) return false;
  if (!config.rewardedEnabled) return false;
  if (EXPERIMENTAL_PLACEMENTS.includes(placement)) return !!(config.rewarded && config.rewarded.minigameLife);
  return (config.rewarded && config.rewarded.placements || REWARDED_PLACEMENTS).includes(placement);
}
// Interstitial (no voluntario): nunca con el entitlement de quitar anuncios
export function interstitialAllowed(entitlements, config) {
  return !!config.interstitialEnabled && !(entitlements || []).includes('ads.remove_interstitial');
}
// Proveedor simulado: «ver» un anuncio es instantáneo y siempre recompensa (sin red, sin SDK)
export function createMockAdProvider({ config }) {
  return {
    id: 'mock',
    isAvailable: placement => placementAllowed(placement, config),
    async showRewarded(placement) { if (!placementAllowed(placement, config)) return { rewarded: false, reason: 'not_allowed' }; return { rewarded: true, placement, simulated: true }; },
    async showInterstitial(entitlements) { return interstitialAllowed(entitlements, config) ? { shown: true, simulated: true } : { shown: false }; },
  };
}
