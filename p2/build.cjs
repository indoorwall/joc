// Monta p2/del_barrio_p2.html (un solo archivo) a partir de los módulos de p2/src
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const js = fs.readdirSync(dir).filter(f => /^\d\d_.*\.js$/.test(f)).sort().map(f => `// ===== ${f} =====\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(dir, 'estilo.css'), 'utf8');
const html = fs.readFileSync(path.join(dir, 'plantilla.html'), 'utf8').replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
const out = path.join(__dirname, 'del_barrio_p2.html');
fs.writeFileSync(out, html);
console.log(`${path.relative(process.cwd(), out)}: ${Math.round(html.length / 1024)} KB`);
