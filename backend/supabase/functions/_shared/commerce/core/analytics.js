// COPIA GENERADA de commerce/core/analytics.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Telemetría de compras. Eventos cerrados (lista blanca) y propiedades saneadas: nunca datos de tarjeta ni PII.
export const PURCHASE_EVENTS = ['store_open', 'product_view', 'purchase_click', 'checkout_started', 'checkout_cancelled', 'purchase_success', 'purchase_failed',
  'entitlement_granted', 'entitlement_restored', 'refund', 'bundle_view', 'prestige_view', 'expansion_view', 'account_prompt', 'account_created', 'restore_click', 'promo_redeemed'];
const ALLOWED_PROPS = ['sku', 'priceMinor', 'currency', 'phase', 'sport', 'platform', 'region', 'provider', 'tab', 'orderRef', 'reason', 'source', 'catalogVersion', 'experiment', 'variant', 'week'];
const FORBIDDEN = /card|cvc|cvv|iban|pan|number|email|phone|address|name|token|secret|password/i;

export function sanitizeEvent(name, props = {}) {
  if (!PURCHASE_EVENTS.includes(name)) return null;
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (!ALLOWED_PROPS.includes(k) || FORBIDDEN.test(k)) continue;
    if (v == null || (typeof v === 'object')) continue;
    out[k] = typeof v === 'string' ? v.slice(0, 64) : v;
  }
  return { name, props: out };
}
// Embudo VIEW → CLICK → CHECKOUT → PAID → ENTITLEMENT por SKU
export function funnel(events) {
  const steps = { product_view: 'view', purchase_click: 'click', checkout_started: 'checkout', purchase_success: 'paid', entitlement_granted: 'entitlement' };
  const out = {};
  for (const e of events) {
    const st = steps[e.name]; if (!st) continue;
    const sku = (e.props && e.props.sku) || '?';
    out[sku] = out[sku] || { view: 0, click: 0, checkout: 0, paid: 0, entitlement: 0 };
    out[sku][st]++;
  }
  return out;
}
