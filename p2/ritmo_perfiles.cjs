// P2.6 · Ritmo de las primeras 50 semanas por perfil (A Deportista, B Empresario, C Comercial, D Equilibrado, E Novato).
// Uso: node p2/ritmo_perfiles.cjs  — son bots, no personas: miden ritmo y huecos, no diversión.
// Ritmo de las primeras 50 semanas por perfil (A–E). Prefijos deterministas: jugarPartida(B, seed, k) para k = 1..50
const P2 = require('./cargar.cjs')();
const libres = s => P2.accionesDisponibles(s).filter(a => !a.bloqueo).map(a => a.id);
const h = (x) => { let v = 2166136261; for (const c of String(x)) v = Math.imul(v ^ c.charCodeAt(0), 16777619); return (v >>> 0); };
const D = P2.DEPORTIVA;
const novato = Object.assign({}, D.equilibrada, { n: 'Novato', accion: s => { const l = libres(s); if (s.p.energia < 20 && l.includes('descansar')) return 'descansar'; return l[h(s.seed + '|' + s.semana) % l.length]; } });
const PERS = {
  'A Deportista': P2.crearBot('futbol', 'prudente', 'locales'),
  'B Empresario': P2.crearBot('trabajo', 'agresiva', 'locales'),
  'C Comercial': P2.crearBot('imagen', 'inteligente', 'maximos'),
  'D Equilibrado': P2.crearBot('equilibrada', 'inteligente', 'locales'),
  'E Novato': Object.assign(P2.crearBot('equilibrada', 'noOptimiza', 'locales'), { dep: novato }),
};
const SEEDS = [11, 23, 37, 41, 53, 67, 71, 83, 97, 101];
const N = 50;
const snap = s => ({
  dec: Object.values((s.tele || {}).decisiones || {}).reduce((a, o) => a + Object.values(o).reduce((x, y) => x + y, 0), 0),
  hitos: Object.keys(s.hitos || {}).filter(k => s.hitos[k]).length,
  mj: (s.minigameHistory || []).length, win: (s.sucesosVistos || {}).primeraPachanga != null && !s.pendiente,
  dinero: s.p.dinero, fase: s.fase, sec: (s.secciones || []).length, contrato: !!s.contrato, empresa: (s.negocios || []).length > 0,
  acc: Object.keys((s.tele || {}).acciones || {}).length,
});
const out = {};
for (const [nom, B] of Object.entries(PERS)) {
  const agg = { primerLogro: [], primeraDecision: [], decisiones: [], mj: [], seca: [], semSinNada: [], contrato: [], empresa: [], dinero10: [], acciones: [], hitos: [], semanas: [] };
  for (const seed of SEEDS) {
    let prev = snap(P2.nuevaPartida({ seed, nombre: 'Bot' })), seca = 0, maxSeca = 0, sinNada = 0, primerLogro = null, primeraDec = null, contrato = null, empresa = null, d10 = null;
    let last;
    const F = P2.jugarPartida(B, seed, N, { estado: true }).s.semana;
    for (let k = 1; k <= Math.min(N, F); k++) {
      const L = P2.jugarPartida(B, seed, k, { estado: true }); const c = snap(L.s); c.sem = L.s.semana; last = c;
      const nov = c.dec > prev.dec || c.hitos > prev.hitos || c.mj > prev.mj || c.fase !== prev.fase || c.sec > prev.sec;
      if (nov) seca = 0; else { seca++; sinNada++; } maxSeca = Math.max(maxSeca, seca);
      if (primerLogro == null && (c.hitos > 0 || c.fase !== "barrio" || c.win)) primerLogro = k;
      if (primeraDec == null && c.dec > 0) primeraDec = k;
      if (contrato == null && c.contrato) contrato = k; if (empresa == null && c.empresa) empresa = k;
      if (k === 10) d10 = c.dinero;
      prev = c;
    }
    agg.primerLogro.push(primerLogro ?? 99); agg.primeraDecision.push(primeraDec ?? 99); agg.decisiones.push(last.dec); agg.mj.push(last.mj); agg.seca.push(maxSeca); agg.semSinNada.push(sinNada);
    agg.contrato.push(contrato ?? 99); agg.empresa.push(empresa ?? 99); agg.dinero10.push(d10); agg.acciones.push(last.acc); agg.hitos.push(last.hitos); agg.semanas.push(last.sem);
  }
  const med = l => { const x = l.slice().sort((a, b) => a - b); return x[Math.floor(x.length / 2)]; };
  out[nom] = Object.fromEntries(Object.entries(agg).map(([k, l]) => [k, med(l)]));
  console.log(nom, JSON.stringify(out[nom]));
}

