// Genera backend/supabase/seed.sql desde el catálogo (productos, precios, versión, configuración remota por defecto).
// Uso: node commerce/tools/gen-seed.mjs   (se vuelve a generar al cambiar el catálogo; un test comprueba que está al día)
import { writeFileSync } from 'node:fs';
import { CATALOG } from '../catalog/catalog.js';
import { DEFAULT_CONFIG } from '../core/config.js';

const lit = v => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = a => (a && a.length ? `array[${a.map(lit).join(',')}]::text[]` : `'{}'::text[]`);
export function seedSql(catalog = CATALOG) {
  const out = ['-- GENERADO desde commerce/catalog/catalog.js con commerce/tools/gen-seed.mjs. No editar a mano.', 'begin;',
    `insert into public.catalog_versions (version, notes) values (${catalog.version}, 'Catálogo inicial') on conflict do nothing;`];
  for (const p of catalog.products) {
    out.push(`insert into public.products (id, type, status, name, entitlements, requires, bundle_contents, one_time, catalog_version) values (${lit(p.id)}, ${lit(p.type)}, ${lit(p.status)}, ${lit(p.name)}, ${arr(p.entitlements)}, ${p.requires ? lit(JSON.stringify(p.requires)) + '::jsonb' : 'null'}, ${p.bundleContents ? arr(p.bundleContents) : 'null'}, ${p.oneTime !== false}, ${catalog.version})
  on conflict (id) do update set type = excluded.type, status = excluded.status, name = excluded.name, entitlements = excluded.entitlements, requires = excluded.requires, bundle_contents = excluded.bundle_contents, catalog_version = excluded.catalog_version, updated_at = now();`);
    for (const [cur, v] of Object.entries(p.prices || {})) if (v != null)
      out.push(`insert into public.product_prices (product_id, currency, amount_minor) values (${lit(p.id)}, ${lit(cur)}, ${v}) on conflict (product_id, currency) do update set amount_minor = excluded.amount_minor;`);
  }
  for (const env of ['development', 'staging', 'production']) {
    const cfg = Object.assign({}, DEFAULT_CONFIG, { environment: env, liveModeAllowed: false });
    out.push(`insert into public.remote_config (environment, key, value) values (${lit(env)}, 'commerce', ${lit(JSON.stringify(cfg))}::jsonb) on conflict (environment, key) do nothing;`);
  }
  out.push('commit;');
  return out.join('\n') + '\n';
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = new URL('../../backend/supabase/seed.sql', import.meta.url);
  writeFileSync(path, seedSql());
  console.log('backend/supabase/seed.sql generado');
}
