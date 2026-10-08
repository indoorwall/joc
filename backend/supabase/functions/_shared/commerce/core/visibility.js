// COPIA GENERADA de commerce/core/visibility.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Qué productos se enseñan y cuáles se pueden comprar. Sin bombardear: según fase, hitos, compras e intereses.
import { activeEntitlements, ownership, requirementsMet } from './entitlements.js';
import { priceFor } from './money.js';

// ctx = { environment, isTester, entitlements: [...], game: { hitos: {}, trophies: [], club, phase, age }, currency }
export function isPurchasableStatus(product, ctx) {
  if (product.status === 'active') return true;
  if (product.status === 'testing') return ctx.environment !== 'production' || !!ctx.isTester;
  return false;
}
function visibleByGame(product, game) {
  const v = product.visibleWhen; if (!v) return true;
  const g = game || {};
  if (v.anyHito && !v.anyHito.some(h => g.hitos && g.hitos[h])) return false;
  if (v.trophy && !(g.trophies || []).includes(v.trophy)) return false;
  if (v.club && g.club !== v.club) return false;
  return true;
}
// Estado de un producto para este usuario: lo que la tienda necesita para pintar la ficha
export function productState(product, ctx, config = {}) {
  const active = ctx.entitlements || [];
  const own = ownership(product, active), req = requirementsMet(product, active);
  const price = priceFor(product, ctx.currency || 'EUR');
  let blocked = null;
  if (product.promoOnly) blocked = 'promo_only';
  else if (!isPurchasableStatus(product, ctx)) blocked = product.status === 'coming_soon' ? 'coming_soon' : 'not_available';
  else if (!price) blocked = 'no_price';
  else if (own.all) blocked = 'owned';
  else if (!req.ok) blocked = 'requires';
  else if (config.commerceEnabled === false) blocked = 'commerce_disabled';
  return { sku: product.id, owned: own.all, partiallyOwned: own.some && !own.all, missing: own.missing, requires: req, price, purchasable: !blocked, blocked };
}
// Lista para la tienda Premium (sin draft/retired; coming_soon solo si se pide; filtrada por juego)
export function visibleProducts(catalog, ctx, config = {}, opts = {}) {
  return catalog.products.filter(p => {
    if (p.status === 'draft' || p.status === 'retired') return false;
    if (p.type === 'PROMO' && !(ctx.entitlements || []).some(e => p.entitlements.includes(e))) return false;
    if ((config.hiddenSkus || []).includes(p.id)) return false;
    if (config.visibleSkus && !config.visibleSkus.includes(p.id)) return false;
    if (p.status === 'coming_soon' && opts.includeComingSoon === false) return false;
    if (!opts.ignoreGame && !visibleByGame(p, ctx.game)) return (ctx.entitlements || []).some(e => p.entitlements.includes(e));   // lo comprado siempre se ve
    if (p.type === 'PRESTIGE_CAREER' && config.prestigeEnabled === false) return false;
    if (p.type === 'SPORT_EXPANSION' && config.sportExpansionEnabled === false) return false;
    return true;
  });
}
// Destacados: pocos, relevantes y nunca algo ya comprado
export function featured(catalog, ctx, config = {}) {
  return visibleProducts(catalog, ctx, config).filter(p => productState(p, ctx, config).purchasable && (p.featured || p.trigger)).slice(0, config.maxFeatured || 3);
}
export { activeEntitlements };
