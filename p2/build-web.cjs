// Build WEB REAL (Stripe Checkout + Supabase). NO es el prototipo publicado.
// Uso:
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_PUBLISHABLE_KEY=sb_publishable_… APP_ENV=staging node p2/build-web.cjs
// Salida: dist/web/index.html (no se sube a git). Solo lleva datos PÚBLICOS: URL y clave publishable.
const fs = require('fs'), path = require('path');
const { bundle } = require('./build.cjs');
const env = k => process.env[k] || '';
const url = env('SUPABASE_URL'), key = env('SUPABASE_PUBLISHABLE_KEY') || env('SUPABASE_ANON_KEY'), appEnv = env('APP_ENV') || 'staging';
if (!/^https:\/\/|^http:\/\/(127\.0\.0\.1|localhost)/.test(url) || !key) { console.error('Faltan SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY'); process.exit(1); }
if (/sb_secret_|service_role|sk_(test|live)_/.test(key)) { console.error('¡Esa clave es SECRETA! El cliente solo lleva la publishable.'); process.exit(1); }
const MODS = ['catalog/catalog.js', 'core/money.js', 'core/entitlements.js', 'core/orders.js', 'core/config.js', 'core/visibility.js', 'core/router.js', 'core/stripeSignature.js',
  'core/analytics.js', 'core/service.js', 'core/prestige.js', 'core/sports.js', 'core/ads.js', 'client/providers.js', 'client/httpBackend.js', 'client/webAuth.js', 'client/commerceClient.js'];
const root = path.join(__dirname, '..'), dir = path.join(__dirname, 'src');
let commerce = bundle(MODS, path.join(root, 'commerce')).replace("P2C.BUILD = 'mock';", "P2C.BUILD = 'web';");
const cfg = `globalThis.P2C_WEB = ${JSON.stringify({ supabaseUrl: url, functionsUrl: `${url}/functions/v1`, publishableKey: key, environment: appEnv })};`;
const js = `${cfg}\n${commerce}\n` + fs.readdirSync(dir).filter(f => /^\d\d_.*\.js$/.test(f)).sort().map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(dir, 'estilo.css'), 'utf8');
const html = fs.readFileSync(path.join(dir, 'plantilla.html'), 'utf8').replace('/*CSS*/', () => css)
  .replace('/*JS*/', () => js).replace('</head>', '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>\n</head>');
const out = path.join(root, 'dist', 'web', 'index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`dist/web/index.html (${appEnv}): ${Math.round(html.length / 1024)} KB`);
