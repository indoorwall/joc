// Arnés de pruebas e2e: carga las Edge Functions REALES y las sirve en un solo puerto (/functions/v1/<nombre>),
// como `supabase functions serve`. Solo para tests locales (tests/commerce/edge.e2e.mjs).
const names = ['checkout-session', 'stripe-webhook', 'entitlements', 'restore', 'purchases', 'promo-redeem', 'remote-config', 'storefront', 'admin', 'analytics'];
const handlers: Record<string, (r: Request) => Response | Promise<Response>> = {};
const originalServe = Deno.serve.bind(Deno);
let current = '';
Object.defineProperty(Deno, 'serve', { value: (h: any) => { handlers[current] = h; return {}; }, configurable: true, writable: true });
for (const n of names) { current = n; await import(`../functions/${n}/index.ts`); }
const port = Number(Deno.env.get('PORT') || 54321);
originalServe({ port, hostname: '127.0.0.1', onListen: () => console.log(`e2e listo en ${port}`) }, req => {
  const m = new URL(req.url).pathname.match(/^\/functions\/v1\/([a-z-]+)/);
  const h = m && handlers[m[1]];
  return h ? h(req) : new Response('not found', { status: 404 });
});
