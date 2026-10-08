// COPIA GENERADA de commerce/core/entitlements.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Entitlements: el núcleo. Un pago concede ENTITLEMENTS; el juego pregunta «¿tiene X?», nunca «¿pagó?».
// Un GRANT es un hecho: {userId, entitlementId, source, sourcePurchaseId, orderId, productId, grantedAt, revokedAt, status}.
// Un entitlement está ACTIVO si al menos uno de sus grants está activo.
export const GRANT_SOURCES = ['stripe', 'apple', 'google', 'promo', 'admin', 'legacy'];
export const GRANT_STATUSES = ['active', 'suspended', 'revoked'];

export function activeEntitlements(grants) {
  const out = new Set();
  for (const g of grants || []) if (g.status === 'active' && !g.revokedAt) out.add(g.entitlementId);
  return [...out].sort();
}
export const hasEntitlement = (list, id) => (Array.isArray(list) ? list : activeEntitlements(list)).includes(id);

// Entitlements que concede un producto (los bundles conceden todos los suyos)
export function productEntitlements(product) { return Array.from(new Set((product && product.entitlements) || [])); }

// ¿Ya lo tiene todo? (no se puede volver a comprar). ¿Tiene una parte? (bundle: no se duplica)
export function ownership(product, active) {
  const ents = productEntitlements(product), have = ents.filter(e => active.includes(e));
  return { all: ents.length > 0 && have.length === ents.length, some: have.length > 0, have, missing: ents.filter(e => !active.includes(e)) };
}
// Requisitos: { all: [...], anyCount: { n, of: [...] } }
export function requirementsMet(product, active) {
  const r = product && product.requires; if (!r) return { ok: true, missing: [] };
  const missing = (r.all || []).filter(e => !active.includes(e));
  let anyOk = true;
  if (r.anyCount) anyOk = r.anyCount.of.filter(e => active.includes(e)).length >= r.anyCount.n;
  return { ok: missing.length === 0 && anyOk, missing, anyCount: r.anyCount && !anyOk ? r.anyCount : null };
}
