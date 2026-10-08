// Suite contra PostgreSQL REAL: aplica (shim de Supabase) + migración + seed, corre el contrato completo con PgRepo
// y prueba el RLS como lo vería un cliente (roles anon / authenticated con auth.uid()).
import pg from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import { runAccounts } from './accounts.mjs';
import { runContract } from './contract.mjs';
import { createPgRepo } from '../../commerce/core/pgRepo.js';
import { seedSql } from '../../commerce/tools/gen-seed.mjs';

const U = '11111111-1111-4111-8111-111111111111', U2 = '22222222-2222-4222-8222-222222222222', ADMIN = '99999999-9999-4999-8999-999999999999';
const sql = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const DYNAMIC = ['purchase_events', 'refunds', 'disputes', 'entitlement_grants', 'entitlements', 'payments', 'order_items', 'orders', 'provider_events', 'commerce_accounts', 'promo_redemptions', 'promo_codes',
  'rate_limits', 'analytics_events', 'admin_actions', 'admin_users', 'iap_receipts', 'ad_rewards', 'product_provider_ids', 'profiles', 'game_saves', 'devices'];

export async function runPg(check) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  // Base limpia y migración desde cero (como `supabase db reset`)
  await pool.query('drop schema if exists public cascade; drop schema if exists auth cascade; create schema public; grant all on schema public to public;');
  await pool.query(sql('./supabase_shim.sql'));
  let migErr = null;
  try { for (const f of readdirSync(new URL('../../backend/supabase/migrations/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) await pool.query(sql('../../backend/supabase/migrations/' + f)); await pool.query(seedSql()); } catch (e) { migErr = e.message; }
  check('[postgres] La migración y el seed se aplican sobre una base vacía', !migErr, migErr);
  if (migErr) { await pool.end(); return; }
  const seedFile = readFileSync(new URL('../../backend/supabase/seed.sql', import.meta.url), 'utf8');
  check('[postgres] backend/supabase/seed.sql está al día con el catálogo', seedFile === seedSql());
  const reset = async () => {
    await pool.query(`truncate ${DYNAMIC.map(t => 'public.' + t).join(', ')} cascade`);
    await pool.query("insert into auth.users (id, email) values ($1, 'a@test.local'), ($2, 'b@test.local'), ($3, 'admin@test.local') on conflict do nothing", [U, U2, ADMIN]);
  };
  const makeRepo = async () => { await reset(); return createPgRepo({ pool }); };
  await runContract('postgres', makeRepo, check);
  await runAccounts('postgres', makeRepo, check, [U, U2]);

  // ---------- RLS: lo que puede y no puede hacer un cliente ----------
  await reset();
  const repo = createPgRepo({ pool });
  const oid = '44444444-4444-4444-8444-444444444444';
  await repo.createOrder({ id: oid, userId: U, sku: 'pack_debut', provider: 'stripe', status: 'CREATED', amountMinor: 99, currency: 'EUR', environment: 'staging', catalogVersion: 1, platform: 'web', createdAt: new Date().toISOString() });
  await repo.insertGrant({ id: '55555555-5555-4555-8555-555555555555', userId: U, entitlementId: 'cosmetic.debut_pack', source: 'admin', sourcePurchaseId: 'admin:t', orderId: null, productId: null, grantedAt: new Date().toISOString(), status: 'active' });
  const asUser = async (uid, q, params = []) => {
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query(`set local role ${uid ? 'authenticated' : 'anon'}`);
      if (uid) await c.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
      const r = await c.query(q, params); await c.query('commit'); return { rows: r.rows, rowCount: r.rowCount };
    } catch (e) { await c.query('rollback'); return { error: e.message }; } finally { c.release(); }
  };
  check('[RLS] Un usuario lee sus órdenes', (await asUser(U, 'select id from orders')).rows.length === 1);
  check('[RLS] Un usuario NO ve órdenes ajenas', (await asUser(U2, 'select id from orders')).rows.length === 0);
  check('[RLS] Un usuario lee sus entitlements (y no los de otros)', (await asUser(U, "select * from entitlements where status = 'active'")).rows.length === 1 && (await asUser(U2, 'select * from entitlements')).rows.length === 0);
  check('[RLS] Un cliente NO puede crearse un entitlement', !!(await asUser(U, "insert into entitlement_grants (id, user_id, entitlement_id, source, source_purchase_id, status) values (gen_random_uuid(), $1, 'sport.climbing', 'admin', 'hack', 'active')", [U])).error);
  check('[RLS] Un cliente NO puede escribir directamente en entitlements', !!(await asUser(U, "insert into entitlements (user_id, entitlement_id, status) values ($1, 'sport.tennis', 'active')", [U])).error);
  check('[RLS] Un cliente NO puede marcar su orden como PAID', (r => !!r.error || r.rowCount === 0)(await asUser(U, "update orders set status = 'PAID' where id = $1", [oid])) && (await repo.getOrder(oid)).status === 'CREATED');
  check('[RLS] Un cliente NO puede crear órdenes, pagos ni reembolsos', !!(await asUser(U, "insert into orders (id, user_id, sku, provider, status, amount_minor, currency, environment, catalog_version) values (gen_random_uuid(), $1, 'pack_debut', 'stripe', 'PAID', 0, 'EUR', 'staging', 1)", [U])).error
    && !!(await asUser(U, "insert into refunds (id, provider, provider_refund_id, amount_minor, \"full\") values (gen_random_uuid(), 'stripe', 'x', 1, true)")).error);
  check('[RLS] Un cliente NO puede hacerse admin ni tester', !!(await asUser(U, 'insert into admin_users (user_id) values ($1)', [U])).error && (r => !!r.error || r.rowCount === 0)(await asUser(U, 'update profiles set is_tester = true where user_id = $1', [U])));
  check('[RLS] Un cliente NO lee eventos de webhook, promo ni acciones de admin', (await asUser(U, 'select * from provider_events')).rows.length === 0 && (await asUser(U, 'select * from promo_codes')).rows.length === 0 && (await asUser(U, 'select * from admin_actions')).rows.length === 0);
  check('[RLS] Anónimo ve el catálogo público pero no borradores', (r => r.rows.some(x => x.id === 'pack_debut') && !r.rows.some(x => x.id === 'season_pass'))(await asUser(null, 'select id from products')));
  check('[RLS] Anónimo no ve órdenes ni entitlements', (await asUser(null, 'select * from orders')).rows.length === 0 && (await asUser(null, 'select * from entitlements')).rows.length === 0);
  check('[RLS] Las partidas en la nube son solo del usuario', !(await asUser(U, "insert into game_saves (user_id, slot, data) values ($1, 0, '{}')", [U])).error && !!(await asUser(U2, "insert into game_saves (user_id, slot, data) values ($1, 0, '{}')", [U])).error);
  check('[RLS] Un cliente no puede ejecutar el borrado de cuentas', !!(await asUser(U, 'select delete_account($1, $2)', [U2, 'x'])).error);
  // Integridad en la propia base de datos
  const dup = await pool.query("insert into entitlement_grants (id, user_id, entitlement_id, source, source_purchase_id, status) values (gen_random_uuid(), $1, 'cosmetic.debut_pack', 'admin', 'admin:t', 'active') on conflict do nothing", [U]);
  check('[BD] UNIQUE: la misma concesión no se inserta dos veces', dup.rowCount === 0);
  await pool.query("insert into auth.users (id, email) values ('66666666-6666-4666-8666-666666666666', 'nuevo@test.local')");
  check('[BD] Al registrarse se crea el perfil mínimo (sin tester ni admin)', (r => r && r.is_tester === false)((await pool.query("select * from profiles where user_id = '66666666-6666-4666-8666-666666666666'")).rows[0]));
  let floatErr = null; try { await pool.query("insert into product_prices (product_id, currency, amount_minor) values ('pack_pro', 'USD', 2.99)"); } catch (e) { floatErr = e.message; }
  const pp = (await pool.query("select amount_minor from product_prices where product_id = 'pack_pro' and currency = 'USD'")).rows[0];
  check('[BD] Los precios son enteros (2.99 nunca se guarda como 2.99)', !!floatErr || !pp || Number(pp.amount_minor) === 3);
  await pool.query("update entitlement_grants set status = 'revoked' where user_id = $1", [U]);
  let reErr = null; try { await pool.query("update entitlement_grants set status = 'active' where user_id = $1", [U]); } catch (e) { reErr = e.message; }
  check('[BD] Una concesión revocada no se puede reactivar (historial inmutable)', !!reErr);
  check('[BD] El trigger mantiene «entitlements» al revocar', (await pool.query("select status from entitlements where user_id = $1 and entitlement_id = 'cosmetic.debut_pack'", [U])).rows[0].status === 'inactive');
  let stErr = null; try { await pool.query("update orders set status = 'GRATIS' where id = $1", [oid]); } catch (e) { stErr = e.message; }
  check('[BD] Estado de orden fuera de la máquina de estados → rechazado', !!stErr);
  await pool.end();
}
