/* =====================================================================
   03 · LIGA: 8 equipos, 14 jornadas (ida y vuelta), clasificación y contexto
   La clasificación se calcula siempre a partir de los resultados guardados:
   un resultado no puede contarse dos veces.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, LIGAS, rnd, poisson, clamp } = P2;

  // Calendario por el método del círculo; la vuelta invierte campos
  function calendario(ids) {
    const n = ids.length, l = ids.slice(), ida = [];
    for (let r = 0; r < n - 1; r++) {
      const j = [];
      for (let i = 0; i < n / 2; i++) {
        const a = l[i], b = l[n - 1 - i];
        j.push(r % 2 === 0 ? [a, b] : [b, a]);
      }
      ida.push(j);
      l.splice(1, 0, l.pop());
    }
    return ida.concat(ida.map(j => j.map(([a, b]) => [b, a])));
  }

  function crearTemporada(s, ligaId, miEquipo) {
    const L = LIGAS[ligaId];
    const fuerzas = {};
    for (const e of L.equipos) fuerzas[e.id] = e.fuerza + P2.entre(s, -1.5, 1.5);   // cada temporada los rivales cambian un poco
    const num = (s.temporadasJugadas || []).length + 1;
    return { liga: ligaId, num, yo: miEquipo, fuerzas, calendario: calendario(L.equipos.map(e => e.id)), resultados: [], jornada: 0, cerrada: false };
  }

  const nombreEquipo = (T, id) => (LIGAS[T.liga].equipos.find(e => e.id === id) || { n: id }).n;

  function clasificacion(T) {
    const tabla = {};
    for (const e of LIGAS[T.liga].equipos) tabla[e.id] = { id: e.id, n: e.n, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
    for (const j of T.resultados) for (const m of j) {
      const L = tabla[m.l], V = tabla[m.v];
      L.pj++; V.pj++; L.gf += m.gl; L.gc += m.gv; V.gf += m.gv; V.gc += m.gl;
      if (m.gl > m.gv) { L.g++; V.p++; L.pts += CFG.liga.ptsV; }
      else if (m.gl < m.gv) { V.g++; L.p++; V.pts += CFG.liga.ptsV; }
      else { L.e++; V.e++; L.pts += CFG.liga.ptsE; V.pts += CFG.liga.ptsE; }
    }
    return Object.values(tabla).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || a.n.localeCompare(b.n));
  }
  const posicion = (T, id = T.yo) => clasificacion(T).findIndex(r => r.id === id) + 1;

  function partidoDeLaJornada(T, j = T.jornada) {
    const m = (T.calendario[j] || []).find(([a, b]) => a === T.yo || b === T.yo);
    if (!m) return null;
    const local = m[0] === T.yo;
    return { local, rival: local ? m[1] : m[0], j };
  }

  // Goles esperados según la diferencia de fuerza (y la ventaja de jugar en casa)
  function golesEsperados(fA, fB) { return clamp(1.25 * Math.exp((fA - fB) / 14), 0.25, 3.6); }

  // Juega la jornada entera. extra: lo que tu actuación suma a la fuerza de tu equipo
  function jugarJornada(s, T, extra = 0) {
    const j = T.jornada;
    if (T.cerrada || j >= T.calendario.length) return null;
    if (T.resultados[j]) return T.resultados[j];   // ya jugada: no se repite
    const out = [];
    for (const [l, v] of T.calendario[j]) {
      const fl = T.fuerzas[l] + CFG.liga.localia + (l === T.yo ? extra : 0), fv = T.fuerzas[v] + (v === T.yo ? extra : 0);
      out.push({ l, v, gl: poisson(s, golesEsperados(fl, fv)), gv: poisson(s, golesEsperados(fv, fl)) });
    }
    T.resultados[j] = out;
    T.jornada = j + 1;
    if (T.jornada >= T.calendario.length) T.cerrada = true;
    return out;
  }

  // ¿Qué te juegas esta jornada? Frases con contexto de la tabla
  function contexto(T) {
    if (T.cerrada) return [];
    const tabla = clasificacion(T), yo = tabla.find(r => r.id === T.yo), pos = tabla.indexOf(yo) + 1, n = tabla.length;
    const asc = CFG.liga.ascenso, desc = n - CFG.liga.descenso;
    const pos2 = extra => {
      const pts = yo.pts + extra;
      return 1 + tabla.filter(r => r.id !== T.yo && (r.pts > pts || (r.pts === pts && (r.gf - r.gc) >= (yo.gf - yo.gc)))).length;
    };
    const l = [], quedan = T.calendario.length - T.jornada;
    if (T.jornada === 0) return ['Primera jornada: todo por empezar.'];
    if (pos > asc && pos2(CFG.liga.ptsV) <= asc) l.push('Si ganáis, entráis en puestos de ascenso.');
    else if (pos <= asc && pos2(0) > asc) l.push('Si perdéis, podéis salir de los puestos de ascenso.');
    else if (pos <= asc) l.push('Estáis en puestos de ascenso.');
    if (pos > desc) l.push(pos2(CFG.liga.ptsV) <= desc ? 'Estáis en descenso: ganar os saca.' : 'Estáis en descenso: hace falta ganar ya.');
    else if (pos2(0) > desc) l.push('Una derrota os mete en descenso.');
    const lider = tabla[0];
    if (lider.id !== T.yo && lider.pts - yo.pts > CFG.liga.ptsV * quedan) l.push('El título ya es imposible.');
    if (!l.length) l.push(`Vais ${pos}º: una victoria os acerca a los de arriba.`);
    return l;
  }

  Object.assign(P2, { calendario, crearTemporada, clasificacion, posicion, partidoDeLaJornada, jugarJornada, contexto, nombreEquipo, golesEsperados });
})(globalThis.P2 = globalThis.P2 || {});
