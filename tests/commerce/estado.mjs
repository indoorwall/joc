// Solo para tests: todo el catálogo está «active», así que los estados «coming_soon» y «testing»
// se prueban cambiando un producto un momento y dejándolo como estaba.
import { getProduct } from '../../commerce/catalog/catalog.js';
export async function conEstado(sku, status, fn) {
  const p = getProduct(sku), antes = p.status; p.status = status;
  try { return await fn(); } finally { p.status = antes; }
}
