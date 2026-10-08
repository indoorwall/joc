// E2E del vertical slice sobre HTTP con las Edge Functions REALES (Deno) + PostgreSQL real.
// Auth de Supabase y la API de Stripe se sustituyen por un servidor local (Stripe falso con la forma de la API real).
// Requiere: DATABASE_URL (con la migración aplicada por commerce.test.mjs) y DENO_BIN.
import http from 'node:http';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { createFakeStripe } from '../../commerce/core/fakeStripe.js';

const U = '11111111-1111-4111-8111-111111111111', TOKEN = 'tok-usuario-1', SECRET = 'whsec_e2e';
// Decodifica form-urlencoded con corchetes (a[b][0][c]=x) como Stripe
function parseForm(s) {
  const out = {};
  for (const kv of s.split('&').filter(Boolean)) {
    const [k, v] = kv.split('=').map(decodeURIComponent);
    const path = k.replace(/\]/g, '').split('[');
    let o = out;
    path.forEach((p, i) => { const last = i === path.length - 1, nextNum = /^\d+$/.test(path[i + 1] || ''); if (last) o[p] = /^\d+$/.test(v) && !/(_id|url|reference)$/.test(p) ? Number(v) : v; else o = o[p] = o[p] || (nextNum ? [] : {}); });
  }
  return out;
}

export async function runEdge(check) {
  const DENO = process.env.DENO_BIN;
  if (!DENO || !process.env.DATABASE_URL) { console.log('(sin DENO_BIN o DATABASE_URL: se salta el e2e de Edge Functions)'); return; }
  const fake = createFakeStripe({ webhookSecret: SECRET, mock: false });
  const srv = http.createServer(async (req, res) => {
    let raw = ''; for await (const c of req) raw += c;
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    try {
      if (req.url.startsWith('/auth/v1/user')) return req.headers.authorization === `Bearer ${TOKEN}` ? send(200, { id: U, email: 'a@test.local' }) : send(401, { msg: 'invalid' });
      if (req.headers.authorization !== 'Bearer sk_test_fake') return send(401, { error: { message: 'bad key' } });
      if (req.method === 'POST' && req.url === '/v1/customers') return send(200, await fake.createCustomer(parseForm(raw), req.headers['idempotency-key']));
      if (req.method === 'POST' && req.url === '/v1/checkout/sessions') return send(200, await fake.createCheckoutSession(parseForm(raw), req.headers['idempotency-key']));
      const m = req.url.match(/^\/v1\/(checkout\/sessions|payment_intents)\/([^?]+)/);
      if (m) return send(200, m[1] === 'payment_intents' ? await fake.retrievePaymentIntent(m[2]) : await fake.retrieveCheckoutSession(m[2]));
      send(404, { error: { message: 'not found' } });
    } catch (e) { send(e.status || 500, { error: { message: e.message } }); }
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const fakePort = srv.address().port, port = 54000 + Math.floor(Math.random() * 900);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("truncate public.orders, public.payments, public.entitlement_grants, public.entitlements, public.provider_events, public.commerce_accounts, public.refunds, public.purchase_events, public.rate_limits cascade");
  await pool.query("insert into auth.users (id, email) values ($1, 'a@test.local') on conflict do nothing", [U]);
  await pool.query("update remote_config set value = jsonb_set(value, '{environment}', '\"staging\"') where environment = 'staging'");
  const proc = spawn(DENO, ['run', '--no-lock', '--allow-net', '--allow-env', '--allow-read', 'backend/supabase/tests/e2e_harness.ts'], {
    env: Object.assign({}, process.env, { PORT: String(port), APP_ENV: 'staging', SUPABASE_DB_URL: process.env.DATABASE_URL, SUPABASE_URL: `http://127.0.0.1:${fakePort}`, SUPABASE_ANON_KEY: 'anon',
      STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_API_BASE: `http://127.0.0.1:${fakePort}/v1`, STRIPE_WEBHOOK_SECRET: SECRET, APP_URL: 'https://juego.test' }), stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('Deno no arrancó: ' + logs)), 60000); proc.stdout.on('data', d => { logs += d; if (/e2e listo/.test(logs)) { clearTimeout(t); res(); } }); proc.stderr.on('data', d => { logs += d; }); proc.on('exit', c => { clearTimeout(t); rej(new Error('Deno salió ' + c + ': ' + logs)); }); });
  const F = (name, opts = {}) => fetch(`http://127.0.0.1:${port}/functions/v1/${name}`, opts).then(async r => ({ status: r.status, body: await r.json().catch(() => null) }));
  const auth = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  try {
    const cfg = await F('remote-config');
    check('[e2e] remote-config público y sin datos internos (sin liveModeAllowed, refunds…)', cfg.status === 200 && cfg.body.environment === 'staging' && !('liveModeAllowed' in cfg.body) && !('refunds' in cfg.body));
    const anon = await F('checkout-session', { method: 'POST', body: JSON.stringify({ sku: 'pack_debut', consentWithdrawal: true }) });
    check('[e2e] Sin cuenta no se compra: «Crea una cuenta para proteger y restaurar tus compras…»', anon.status === 401 && /Crea una cuenta/.test(anon.body.message));
    const soon = await F('checkout-session', { method: 'POST', headers: auth, body: JSON.stringify({ sku: 'pack_street', consentWithdrawal: true }) });
    check('[e2e] «coming_soon» → 403 (no se cobra)', soon.status === 403 && soon.body.error === 'coming_soon');
    const co = await F('checkout-session', { method: 'POST', headers: auth, body: JSON.stringify({ sku: 'pack_debut', consentWithdrawal: true, price: 1, amountMinor: 1, userId: '22222222-2222-4222-8222-222222222222' }) });
    const order = co.body && (await pool.query('select * from orders where id = $1', [co.body.orderId])).rows[0];
    check('[e2e] Checkout real: orden PENDING de 99 céntimos para el usuario del JWT (ignora precio y userId del cuerpo)', co.status === 200 && order && order.status === 'PENDING' && Number(order.amount_minor) === 99 && order.user_id === U && /^mock-checkout:/.test(co.body.url), JSON.stringify(co.body));
    const pre = await F('entitlements', { headers: auth });
    check('[e2e] Antes del webhook no hay nada (la success_url no concede)', pre.status === 200 && pre.body.entitlements.length === 0);
    const ev = fake.pay(order.provider_checkout_id);
    const badSig = await fake.signed(ev, { secret: 'whsec_otro' });
    const bad = await F('stripe-webhook', { method: 'POST', headers: { 'stripe-signature': badSig.header }, body: badSig.raw });
    check('[e2e] Webhook falso (firma) → 400 y nada concedido', bad.status === 400 && (await F('entitlements', { headers: auth })).body.entitlements.length === 0);
    const good = await fake.signed(ev);
    const w1 = await F('stripe-webhook', { method: 'POST', headers: { 'stripe-signature': good.header }, body: good.raw });
    const w2 = await F('stripe-webhook', { method: 'POST', headers: { 'stripe-signature': good.header }, body: good.raw });
    check('[e2e] Webhook válido → 200; el mismo otra vez → 200 duplicado', w1.status === 200 && !w1.body.duplicate && w2.status === 200 && w2.body.duplicate === true);
    const st = await F(`entitlements?order=${order.id}`, { headers: auth });
    check('[e2e] «Estamos verificando…» → la orden pasa a FULFILLED y aparece cosmetic.debut_pack', st.status === 200 && st.body.status === 'FULFILLED' && st.body.entitlements.includes('cosmetic.debut_pack'));
    const fee = (await pool.query('select gross_minor, provider_fee_minor, net_minor from payments where order_id = $1', [order.id])).rows[0];
    check('[e2e] Contabilidad desde Stripe: bruto, comisión y neto (unidades mínimas)', fee && Number(fee.gross_minor) === 99 && Number(fee.provider_fee_minor) > 0 && Number(fee.net_minor) < 99);
    const again = await F('checkout-session', { method: 'POST', headers: auth, body: JSON.stringify({ sku: 'pack_debut', consentWithdrawal: true }) });
    check('[e2e] Volver a comprar lo que ya tienes → 409', again.status === 409 && again.body.error === 'owned');
    const hist = await F('purchases', { headers: auth });
    check('[e2e] Mis compras: producto, proveedor, estado y referencia', hist.status === 200 && hist.body.orders[0].name === 'Pack Debut' && hist.body.orders[0].status === 'FULFILLED' && hist.body.orders[0].orderRef);
    const rf = await fake.signed(fake.refund(order.provider_checkout_id));
    await F('stripe-webhook', { method: 'POST', headers: { 'stripe-signature': rf.header }, body: rf.raw });
    check('[e2e] Reembolso → entitlement revocado', !(await F('entitlements', { headers: auth })).body.entitlements.includes('cosmetic.debut_pack'));
    const sf = await F('storefront', { method: 'POST', body: JSON.stringify({ game: { hitos: { contrato: 1 } } }) });
    check('[e2e] Tienda sin cuenta: catálogo con estados (Debut comprable, Street próximamente)', sf.status === 200 && sf.body.products.find(p => p.sku === 'pack_debut').purchasable && sf.body.products.find(p => p.sku === 'pack_street').blocked === 'coming_soon');
    const adm = await F('admin', { method: 'POST', headers: auth, body: JSON.stringify({ action: 'grant', userId: U, entitlementId: 'sport.climbing', reason: 'hack' }) });
    check('[e2e] Admin: un usuario normal recibe 403', adm.status === 403);
    const err500 = await F('restore', { method: 'POST', headers: auth, body: '{}' });
    check('[e2e] Restaurar responde con la lista de entitlements', err500.status === 200 && Array.isArray(err500.body.entitlements));
  } finally { proc.kill(); srv.close(); await pool.end(); }
}
