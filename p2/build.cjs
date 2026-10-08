// Monta p2/del_barrio_p2.html (un solo archivo) a partir de los módulos de p2/src
// + el comercio (commerce/, módulos ES) empaquetado para el navegador en modo SIMULADO:
// backend simulado y Stripe falso, sin red, sin claves, sin SDK de pago. El build web real (con HTTP) es aparte.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const root = path.join(__dirname, '..');

// Módulos de comercio incluidos en el prototipo (orden de dependencias). NUNCA: stripeApi.js, pgRepo.js, httpBackend.js
const COMMERCE = ['catalog/catalog.js', 'core/money.js', 'core/entitlements.js', 'core/orders.js', 'core/config.js', 'core/visibility.js', 'core/router.js', 'core/stripeSignature.js',
  'core/analytics.js', 'core/service.js', 'core/memoryRepo.js', 'core/fakeStripe.js', 'core/prestige.js', 'core/sports.js', 'core/ads.js', 'client/providers.js', 'client/mockBackend.js', 'client/commerceClient.js'];

// Mini empaquetador ES → IIFE: cada módulo en su función; import/export resueltos con un mapa de módulos.
function bundle(files, base) {
  const out = ['(function () {', "'use strict';", 'const __m = {};'];
  for (const rel of files) {
    const abs = path.join(base, rel), key = rel.replace(/\.js$/, '');
    let src = fs.readFileSync(abs, 'utf8');
    const exportsList = [];
    src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)';?\s*$/gm, (_, names, from) => {
      const dep = path.relative(base, path.resolve(path.dirname(abs), from)).replace(/\\/g, '/').replace(/\.js$/, '');
      if (!files.includes(dep + '.js')) throw new Error(`${rel} importa ${dep}, que no está en el build`);
      return `const {${names.replace(/\s+as\s+/g, ': ')}} = __m['${dep}'];`;
    });
    src = src.replace(/^export\s+(async\s+function|function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm, (_, kw, name) => { exportsList.push(name); return `${kw} ${name}`; });
    src = src.replace(/^export\s*\{([^}]*)\};?\s*$/gm, (_, names) => { exportsList.push(...names.split(',').map(s => s.trim()).filter(Boolean)); return ''; });
    if (/^\s*(import|export)\s/m.test(src)) throw new Error(`${rel}: import/export no soportado por el empaquetador`);
    out.push(`// ----- commerce/${rel} -----`, `__m['${key}'] = (function () {`, src, `return { ${exportsList.join(', ')} };`, '})();');
  }
  out.push('const P2C = {};', ...files.map(f => `Object.assign(P2C, __m['${f.replace(/\.js$/, '')}']);`), "P2C.BUILD = 'mock';", 'globalThis.P2C = P2C;', '})();');
  return out.join('\n');
}

function main() {
  const commerce = bundle(COMMERCE, path.join(root, 'commerce'));
  const js = `// ===== comercio (commerce/, simulado) =====\n${commerce}\n` + fs.readdirSync(dir).filter(f => /^\d\d_.*\.js$/.test(f)).sort().map(f => `// ===== ${f} =====\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const css = fs.readFileSync(path.join(dir, 'estilo.css'), 'utf8');
  const html = fs.readFileSync(path.join(dir, 'plantilla.html'), 'utf8').replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
  const out = path.join(__dirname, 'del_barrio_p2.html');
  fs.writeFileSync(out, html);
  console.log(`${path.relative(process.cwd(), out)}: ${Math.round(html.length / 1024)} KB`);
}
if (require.main === module) main();
module.exports = { bundle, COMMERCE };
