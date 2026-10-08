// Arnés de pruebas e2e: carga las Edge Functions REALES y las sirve en un solo puerto (/functions/v1/<nombre>),
// como `supabase functions serve`. Solo para tests locales (tests/commerce/edge.e2e.mjs).
const names = ['checkout-session', 'stripe-webhook', 'entitlements', 'restore', 'purchases', 'promo-redeem', 'remote-config', 'storefront', 'admin', 'analytics', 'profile', 'game-saves', 'account-export'];
const handlers: Record<string, (r: Request) => Response | Promise<Response>> = {};
const originalServe = Deno.serve.bind(Deno);
let current = '';
Object.defineProperty(Deno, 'serve', { value: (h: any) => { handlers[current] = h; return {}; }, configurable: true, writable: true });
// Todo el catálogo está a la venta; para probar «Próximamente» el test pide marcar algún SKU así (solo en este arnés)
const { getProduct } = await import('../functions/_shared/commerce/catalog/catalog.js');
for (const sku of (Deno.env.get('E2E_COMING_SOON') || '').split(',').filter(Boolean)) { const p = getProduct(sku); if (p) p.status = 'coming_soon'; }
for (const n of names) { current = n; await import(`../functions/${n}/index.ts`); }
const port = Number(Deno.env.get('PORT') || 54321);
const webIndex = Deno.env.get('WEB_INDEX');   // build web (dist/web/index.html) servido en «/» (mismo origen)
originalServe({ port, hostname: '127.0.0.1', onListen: () => console.log(`e2e listo en ${port}`) }, async req => {
  if (webIndex && new URL(req.url).pathname === '/') return new Response(await Deno.readTextFile(webIndex), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const m = new URL(req.url).pathname.match(/^\/functions\/v1\/([a-z-]+)/);
  const h = m && handlers[m[1]];
  return h ? h(req) : new Response('not found', { status: 404 });
});
