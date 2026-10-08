// Genera docs/commerce/CATALOG.md desde commerce/catalog/catalog.js (un test comprueba que está al día).
import { writeFileSync } from 'node:fs';
import { CATALOG, ENTITLEMENTS } from '../catalog/catalog.js';
import { formatMinor } from '../core/money.js';

export function catalogDoc() {
  const P = CATALOG.products;
  const L = ['# Catálogo comercial (generado)', '',
    `> GENERADO desde \`commerce/catalog/catalog.js\` (versión **${CATALOG.version}**) con \`node commerce/tools/gen-catalog-doc.mjs\`. No editar a mano.`, '',
    'Reglas: un SKU nunca cambia de significado (un producto distinto = SKU nuevo). Solo `active` se vende (y `testing` fuera de producción o a testers).',
    'Precios en unidades mínimas (céntimos de EUR). Apple y Google usan su precio localizado; los ids de Stripe van por entorno en `product_provider_ids`.', '',
    '| SKU | Tipo | Estado | Precio | Entitlements | Requisitos | Visible cuando | Apple | Google |', '|---|---|---|---|---|---|---|---|---|'];
  for (const p of P) {
    const req = p.requires ? [...(p.requires.all || []), p.requires.anyCount ? `${p.requires.anyCount.n} de: ${p.requires.anyCount.of.join(', ')}` : ''].filter(Boolean).join('; ') : '—';
    const vis = p.visibleWhen ? Object.entries(p.visibleWhen).map(([k, v]) => `${k}=${[].concat(v).join('|')}`).join(', ') : 'siempre';
    L.push(`| \`${p.id}\` | ${p.type} | ${p.status} | ${p.prices.EUR ? formatMinor(p.prices.EUR) : (p.promoOnly ? 'solo código' : '—')} | ${p.entitlements.map(e => `\`${e}\``).join('<br>') || '—'} | ${req} | ${vis} | ${(p.platformProducts.apple || {}).productId || '—'} | ${(p.platformProducts.google || {}).productId || '—'} |`);
  }
  L.push('', '## Contenido de cada producto', '');
  for (const p of P) {
    if (!p.includes.length && !p.description) continue;
    L.push(`### ${(p.assets && p.assets.ic) || ''} ${p.name} · \`${p.id}\``, '', p.description, '');
    if (p.disclaimer) L.push(`> **${p.disclaimer}**`, '');
    for (const x of p.includes) L.push(`- ${x}`);
    if (p.bundleContents) L.push('', `Contiene exactamente: ${p.bundleContents.map(s => `\`${s}\``).join(', ')}. No incluye productos futuros.`);
    if (p.cosmeticOnly) L.push('', '_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._');
    L.push('');
  }
  L.push('## Registro de entitlements', '', '| Entitlement | Tipo | Nombre |', '|---|---|---|');
  for (const [id, e] of Object.entries(ENTITLEMENTS)) L.push(`| \`${id}\` | ${e.kind} | ${e.n} |`);
  return L.join('\n') + '\n';
}
if (import.meta.url === `file://${process.argv[1]}`) { writeFileSync(new URL('../../docs/commerce/CATALOG.md', import.meta.url), catalogDoc()); console.log('docs/commerce/CATALOG.md generado'); }
