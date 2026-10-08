/* =====================================================================
   01 · UTILIDADES: azar con semilla (la partida es reproducible), formato
   ===================================================================== */
(function (P2) {
  'use strict';
  // mulberry32: el estado del generador se guarda en la partida, así recargar no cambia el futuro
  function rnd(s) {
    let t = (s.rng = (s.rng + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // Segundo generador solo para expansiones y Prestige: lo comprado nunca toca el azar de la partida base
  function rndX(s) {
    if (typeof s.rngX !== 'number') s.rngX = ((s.seed || 1) ^ 0x9E3779B9) >>> 0;
    const o = { rng: s.rngX }, v = rnd(o); s.rngX = o.rng; return v;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = v => Math.round(v * 10) / 10;
  const entre = (s, a, b) => a + rnd(s) * (b - a);
  const entero = (s, a, b) => Math.floor(entre(s, a, b + 1));
  const azar = (s, l) => l[Math.floor(rnd(s) * l.length)];
  const fmt = n => Math.round(n).toLocaleString('es-ES');
  const eur = n => `${n < 0 ? '−' : ''}${fmt(Math.abs(n))} €`;
  const signo = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
  const nf = n => (Math.round(n * 10) / 10).toLocaleString('es-ES');
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const copia = o => JSON.parse(JSON.stringify(o));
  // Poisson sencillo (para goles)
  function poisson(s, l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(s); } while (p > L && k < 12); return k - 1; }
  Object.assign(P2, { rnd, rndX, clamp, r1, entre, entero, azar, fmt, eur, signo, nf, esc, copia, poisson });
})(globalThis.P2 = globalThis.P2 || {});
