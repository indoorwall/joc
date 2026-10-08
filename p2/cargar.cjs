// Carga la lógica de P2 (sin interfaz) en Node, para tests y simulaciones de balance
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function cargarP2(opc = {}) {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  if (opc.localStorage) ctx.localStorage = opc.localStorage;
  vm.createContext(ctx);
  const dir = path.join(__dirname, 'src');
  for (const f of fs.readdirSync(dir).filter(f => /^\d\d_.*\.js$/.test(f) && f < '20').sort()) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  return ctx.P2;
};
