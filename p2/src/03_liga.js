/* =====================================================================
   03 · LIGAS: categorías encadenadas con ascensos y descensos reales
   El «mundo» (qué club juega en qué categoría y con qué fuerza) se guarda en
   la partida. Al acabar la temporada suben los 2 primeros y bajan los 2 últimos.
   La clasificación se calcula siempre a partir de los resultados guardados:
   un resultado no puede contarse dos veces.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, LIGAS, OBJETIVOS, rnd, poisson, clamp, r1 } = P2;

  // ---------- Mundo: categorías y clubes ----------
  function mundo(s) {
    if (s.mundo && s.mundo.ligas && s.mundo.equipos) return s.mundo;
    const m = { ligas: {}, equipos: {} };
    for (const [id, L] of Object.entries(LIGAS)) {
      m.ligas[id] = L.equipos.map(e => e.id);
      for (const e of L.equipos) m.equipos[e.id] = { n: e.n, fuerza: e.fuerza, filialDe: e.filialDe || null };
    }
    s.mundo = m;
    return m;
  }
  const ligaDeClub = (s, club) => Object.keys(mundo(s).ligas).find(l => mundo(s).ligas[l].includes(club)) || null;
  const zonas = ligaId => { const L = LIGAS[ligaId]; return { asc: L.sube ? CFG.liga.ascenso : 0, desc: L.baja ? CFG.liga.descenso : 0 }; };

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

  // Objetivo según cómo es tu club comparado con los de su categoría
  function objetivoClub(s, ligaId, club) {
    const M = mundo(s), l = M.ligas[ligaId].slice().sort((a, b) => M.equipos[b].fuerza - M.equipos[a].fuerza), rank = l.indexOf(club) + 1;
    if (rank <= 2) return LIGAS[ligaId].sube ? 'campeon' : 'titulo';
    if (rank <= 5) return 'top4';
    return 'descenso';
  }

  function crearTemporada(s, ligaId, miEquipo) {
    const M = mundo(s);
    if (!M.ligas[ligaId].includes(miEquipo)) ligaId = ligaDeClub(s, miEquipo) || ligaId;
    const ids = M.ligas[ligaId], fuerzas = {};
    for (const id of ids) fuerzas[id] = r1(M.equipos[id].fuerza + P2.entre(s, -1.5, 1.5));   // cada temporada los rivales cambian un poco
    const num = (s.temporadasJugadas || []).length + 1;
    return { liga: ligaId, num, yo: miEquipo, fuerzas, equipos: ids.map(id => ({ id, n: M.equipos[id].n })), objetivo: objetivoClub(s, ligaId, miEquipo),
      calendario: calendario(ids), resultados: [], jornada: 0, cerrada: false };
  }

  const equiposDe = T => T.equipos || LIGAS[T.liga].equipos;
  const nombreEquipo = (T, id) => (equiposDe(T).find(e => e.id === id) || { n: id }).n;
  const objetivoDe = T => OBJETIVOS[T.objetivo] ? T.objetivo : 'top4';

  function clasificacion(T) {
    const tabla = {};
    for (const e of equiposDe(T)) tabla[e.id] = { id: e.id, n: e.n, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
    for (const j of T.resultados) for (const m of j) {
      const L = tabla[m.l], V = tabla[m.v];
      if (!L || !V) continue;
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

  function golesEsperados(fA, fB) { return clamp(1.25 * Math.exp((fA - fB) / 14), 0.25, 3.6); }

  // Juega la jornada entera. extra: lo que tu actuación suma a la fuerza de tu equipo
  function jugarJornada(s, T, extra = 0) {
    const j = T.jornada;
    if (T.cerrada || j >= T.calendario.length) return null;
    if (T.resultados[j]) return T.resultados[j];
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
    const Z = zonas(T.liga), asc = Z.asc, desc = n - Z.desc;
    const pos2 = extra => { const pts = yo.pts + extra; return 1 + tabla.filter(r => r.id !== T.yo && (r.pts > pts || (r.pts === pts && (r.gf - r.gc) >= (yo.gf - yo.gc)))).length; };
    const l = [], quedan = T.calendario.length - T.jornada;
    if (T.jornada === 0) return ['Primera jornada: todo por empezar.'];
    if (asc) {
      if (pos > asc && pos2(CFG.liga.ptsV) <= asc) l.push('Si ganáis, entráis en puestos de ascenso.');
      else if (pos <= asc && pos2(0) > asc) l.push('Si perdéis, podéis salir de los puestos de ascenso.');
      else if (pos <= asc) l.push('Estáis en puestos de ascenso.');
    } else if (pos === 1) l.push('Vais líderes: el título está en vuestra mano.');
    if (Z.desc) {
      if (pos > desc) l.push(pos2(CFG.liga.ptsV) <= desc ? 'Estáis en descenso: ganar os saca.' : 'Estáis en descenso: hace falta ganar ya.');
      else if (pos2(0) > desc) l.push('Una derrota os mete en descenso.');
    }
    const lider = tabla[0];
    if (lider.id !== T.yo && lider.pts - yo.pts > CFG.liga.ptsV * quedan) l.push('El título ya es imposible.');
    if (!l.length) l.push(`Vais ${pos}º: una victoria os acerca a los de arriba.`);
    return l;
  }

  // ---------- Fin de temporada: ascensos y descensos ----------
  // Mueve clubes entre categorías. En las categorías vecinas (que no se juegan) suben/bajan clubes
  // al azar entre los más fuertes / más débiles. Devuelve qué ha pasado con tu club.
  function moverEquipos(s, T) {
    const M = mundo(s), L = LIGAS[T.liga], Z = zonas(T.liga), tabla = clasificacion(T), n = tabla.length;
    const res = { sube: [], baja: [], miClub: null, bloqueadoFilial: null };
    if (T.movido) return T.movido;
    // Suben: los primeros que puedan (un filial no puede subir a la categoría de su primer equipo)
    if (Z.asc) {
      for (const r of tabla) {
        if (res.sube.length >= Z.asc) break;
        const f = M.equipos[r.id].filialDe;
        if (f && M.ligas[L.sube].includes(f)) { if (tabla.indexOf(r) < Z.asc) res.bloqueadoFilial = r.id; continue; }
        if (tabla.indexOf(r) >= Z.asc + 1) break;   // solo hereda la plaza el siguiente clasificado
        res.sube.push(r.id);
      }
    }
    if (Z.desc) res.baja = tabla.slice(n - Z.desc).map(r => r.id);
    if (P2.ajustarMovimiento) P2.ajustarMovimiento(s, T, res, tabla, Z);   // promociones de ascenso y permanencia
    const intercambio = (destino, salen, elegir) => {
      // De la categoría vecina vienen tantos clubes como se van
      const cand = elegir(M.ligas[destino].slice());
      const vienen = cand.slice(0, salen.length);
      M.ligas[destino] = M.ligas[destino].filter(id => !vienen.includes(id)).concat(salen);
      return vienen;
    };
    const porFuerza = (l, desc) => l.sort((a, b) => (desc ? -1 : 1) * (M.equipos[a].fuerza - M.equipos[b].fuerza) + (rnd(s) - 0.5) * 6);
    let entran = [];
    // Un primer equipo no baja a la categoría donde juega su filial
    const filialEn = (id, liga) => Object.keys(M.equipos).some(k => M.equipos[k].filialDe === id && M.ligas[liga].includes(k) && !res.sube.includes(k));
    if (res.sube.length) entran = entran.concat(intercambio(L.sube, res.sube, l => porFuerza(l, false).filter(id => !filialEn(id, T.liga))));
    if (res.baja.length) entran = entran.concat(intercambio(L.baja, res.baja, l => porFuerza(l, true).filter(id => { const f = M.equipos[id].filialDe; return !(f && M.ligas[T.liga].includes(f)); })));
    M.ligas[T.liga] = M.ligas[T.liga].filter(id => !res.sube.includes(id) && !res.baja.includes(id)).concat(entran);
    for (const id of res.sube) M.equipos[id].fuerza = r1(M.equipos[id].fuerza + CFG.liga.subeFuerza);
    for (const id of res.baja) M.equipos[id].fuerza = r1(M.equipos[id].fuerza + CFG.liga.bajaFuerza);
    if (res.sube.includes(T.yo)) res.miClub = { tipo: 'sube', de: T.liga, a: L.sube };
    else if (res.baja.includes(T.yo)) res.miClub = { tipo: 'baja', de: T.liga, a: L.baja };
    else if (res.bloqueadoFilial === T.yo) res.miClub = { tipo: 'filial', de: T.liga, a: T.liga };
    T.movido = res;
    return res;
  }

  Object.assign(P2, { mundo, ligaDeClub, zonas, calendario, crearTemporada, clasificacion, posicion, partidoDeLaJornada, jugarJornada, contexto, nombreEquipo, golesEsperados, moverEquipos, objetivoClub, objetivoDe });
})(globalThis.P2 = globalThis.P2 || {});
