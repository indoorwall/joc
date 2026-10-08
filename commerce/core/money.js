// Dinero REAL: siempre enteros en unidades mínimas (céntimos) + moneda ISO. Nunca floats.
export const CURRENCIES = { EUR: { decimals: 2, symbol: '€' }, USD: { decimals: 2, symbol: '$' }, GBP: { decimals: 2, symbol: '£' } };

export function assertMinor(amount) {
  if (!Number.isInteger(amount) || amount < 0) throw new Error(`Importe inválido (se esperan unidades mínimas enteras): ${amount}`);
  return amount;
}
// «0,99 €» (es-ES). Solo para mostrar.
export function formatMinor(amount, currency = 'EUR', locale = 'es-ES') {
  assertMinor(amount);
  const c = CURRENCIES[currency] || { decimals: 2 };
  const v = (amount / 10 ** c.decimals).toFixed(c.decimals);
  if (currency === 'EUR') return `${v.replace('.', ',')} €`;
  return `${(c.symbol || currency + ' ')}${v}`;
}
// Precio del catálogo para una moneda (null si no hay precio en esa moneda)
export function priceFor(product, currency = 'EUR') {
  const v = product && product.prices ? product.prices[currency] : null;
  return v == null ? null : { amountMinor: assertMinor(v), currency };
}
