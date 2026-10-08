/* =====================================================================
   17 · VARIEDAD SEMANAL: que cada semana se sienta distinta
   Cada acción básica tiene varias versiones que rotan semana a semana (nunca se repite la misma
   dos semanas seguidas). Cada versión cambia un poco lo que da y lo que cuesta, compensado: rinde
   más pero cansa más, o rinde menos pero cansa menos o da un extra. Además, cada semana una
   opción sale «🔥 destacada» y rinde un 20 % más.
   No usa el azar de la partida (s.rng): la rotación sale de la semilla y la semana.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, r1, nf, eur } = P2;

  // m: multiplica lo principal que da la acción · e: energía extra (− cansa más) · x: extras pequeños
  const VARIANTES = {
    entrenar: [
      { ic: '🏃', n: 'Entrenar duro', m: 1 },
      { ic: '🏖️', n: 'Sprints en la playa', m: 1.15, e: -8, d: 'Rinde más, cansa más' },
      { ic: '🎯', n: 'Técnica en el parque', m: 0.85, e: 8, d: 'Rinde menos, cansa menos' },
      { ic: '📹', n: 'Entrenar con vídeos de los pros', m: 0.95, x: { rep: 0.5 }, d: 'Los subes y alguien los ve' },
    ],
    plaza: [
      { ic: '⚽', n: 'Partido en la plaza', m: 1 },
      { ic: '🌙', n: 'Torneo nocturno 3×3', m: 1.2, e: -8, d: 'Más público, más cansancio' },
      { ic: '📱', n: 'Reto de penaltis en redes', m: 0.8, x: { marca: 1 }, d: 'Menos reputación, algo de marca' },
      { ic: '🏟️', n: 'Pachanga contra el barrio vecino', m: 1.05, e: -3 },
    ],
    trabajar: [
      { ic: '🛵', n: 'Repartos en moto', m: 1 },
      { ic: '🍽️', n: 'Camarero en una boda', m: 1.25, e: -10, d: 'Pagan más, acabas reventado' },
      { ic: '👦', n: 'Clases de fútbol a niños', m: 0.75, e: 10, x: { rep: 0.5 }, d: 'Pagan menos, pero te conocen' },
      { ic: '📦', n: 'Mozo de almacén', m: 1.1, e: -5 },
    ],
    descansar: [
      { ic: '😴', n: 'Descansar', m: 1 },
      { ic: '🎮', n: 'Tarde de consola con Marc', m: 0.9, x: { rel: { marc: 1 } }, d: 'Descansas un poco menos, Marc encantado' },
      { ic: '🌳', n: 'Día en el campo con la familia', m: 0.9, x: { rel: { madre: 1, padre: 1 } }, d: 'Tu familia lo agradece' },
      { ic: '🛌', n: 'Dormir todo el fin de semana', m: 1.1 },
    ],
    entrenoExtra: [
      { ic: '🏋️', n: 'Entreno extra', m: 1 },
      { ic: '🥊', n: 'Doble sesión', m: 1.2, e: -6, d: 'Más nivel, llegas más cansado al partido' },
      { ic: '🎥', n: 'Analizar vídeos del rival', m: 0.8, e: 6, x: { confianza: 1 }, d: 'Menos nivel, al míster le encanta' },
      { ic: '🧘', n: 'Yoga y movilidad', m: 0.85, e: 8 },
    ],
    prensa: [
      { ic: '🎙️', n: 'Prensa y redes', m: 1 },
      { ic: '📸', n: 'Sesión de fotos', m: 1.2, e: -5 },
      { ic: '🎮', n: 'Directo en streaming', m: 0.9, x: { rel: { dani: 1 } }, d: 'Dani se apunta' },
      { ic: '🎤', n: 'Podcast deportivo', m: 1.05, x: { rep: 0.3 } },
    ],
    mediaJornada: [
      { ic: '🛵', n: 'Media jornada de repartos', m: 1 },
      { ic: '☕', n: 'Turno en la cafetería', m: 1.2, e: -5 },
      { ic: '⚽', n: 'Monitor del campus infantil', m: 0.8, e: 5, x: { rep: 0.3 } },
    ],
  };
  // Lo principal que da cada acción (lo que multiplica m)
  const PRINCIPAL = { entrenar: 'nivel', entrenoExtra: 'nivel', plaza: 'rep', prensa: 'marca', trabajar: 'dinero', mediaJornada: 'dinero', descansar: 'energia' };
  const BONUS_DESTACADA = 1.2;

  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // Versión de esta semana: rota (no se repite la de la semana anterior)
  function varianteSemana(s, id) {
    const l = VARIANTES[id]; if (!l) return null;
    const i = (s.semana + hash(`${s.seed}|${id}`) % l.length) % l.length;
    return Object.assign({ id, i }, l[i]);
  }
  // La opción destacada de la semana (solo entre las básicas que puedes hacer)
  function destacadaSemana(s) {
    const l = P2.accionesDisponibles(s).filter(x => !x.bloqueo && VARIANTES[x.id]).map(x => x.id);
    return l.length ? l[hash(`${s.seed}|dest|${s.semana}`) % l.length] : null;
  }
  const techoDe = s => (s.fase === 'club' || s.fase === 'amateur' ? P2.techoClub(s) : 62);

  // La acción de la semana: la base de siempre + su versión de esta semana (+ la destacada)
  function aplicarAccionSemana(s, id, R) {
    const v = varianteSemana(s, id), dest = destacadaSemana(s) === id;
    const P = s.p, a = { nivel: P.nivel, rep: P.rep, marca: P.marca || 0, dinero: P.dinero, energia: P.energia }, nl = R.lineas.length;
    P2.aplicarAccion(s, id, R);
    if (!v) return { v: null, dest: false };
    const m = (v.m || 1) * (dest ? BONUS_DESTACADA : 1), k = PRINCIPAL[id];
    const ganado = (k === 'marca' ? (P.marca || 0) - a.marca : P[k] - a[k]);
    if (ganado > 0 && m !== 1) {
      const extra = ganado * (m - 1);
      if (k === 'nivel') P.nivel = r1(clamp(P.nivel + extra, 0, m > 1 ? Math.max(P.nivel, techoDe(s)) : 100));
      else if (k === 'rep') P.rep = r1(clamp(P.rep + extra, 0, 100));
      else if (k === 'marca') P.marca = r1(clamp((P.marca || 0) + extra, 0, 100));
      else if (k === 'dinero') { const d = Math.round(extra); P.dinero += d; s.acum.trabajo += d; }
      else if (k === 'energia') P.energia = clamp(P.energia + extra, 0, P2.CFG.energia.max);
    }
    if (v.e) P.energia = clamp(P.energia + v.e, 0, P2.CFG.energia.max);
    const X = v.x || {};
    if (X.rep) P.rep = r1(clamp(P.rep + X.rep, 0, 100));
    if (X.marca) P.marca = r1(clamp((P.marca || 0) + X.marca, 0, 100));
    if (X.confianza && s.contrato) s.confianza = clamp(s.confianza + X.confianza, 0, 100);
    for (const [rid, d] of Object.entries(X.rel || {})) P2.cambiarRel(s, rid, d, v.n);
    // Una sola línea clara con lo que de verdad ha pasado
    const dif = [['💪', 'nivel', P.nivel - a.nivel], ['⭐', 'reputación', P.rep - a.rep], ['📣', 'marca', (P.marca || 0) - a.marca]].filter(([, , d]) => Math.abs(d) >= 0.05);
    const din = P.dinero - a.dinero;
    const partes = dif.map(([, n, d]) => `${n} ${d > 0 ? '+' : '−'}${nf(Math.abs(r1(d)))}`).concat(din ? [`${din > 0 ? '+' : '−'}${eur(Math.abs(din))}`] : []);
    // conserva los avisos útiles de la acción base (techo, rendimiento decreciente)
    const avisos = R.lineas.slice(nl).flatMap(l => l[1].split(/(?<=\.)\s+/)).filter(f => /techo|cada vez|ya no da|ya te conoce/i.test(f) && !/:\s*[+−-]/.test(f));
    R.lineas.splice(nl, R.lineas.length - nl, [v.ic, `${v.n}${dest ? ' (🔥 destacada)' : ''}${partes.length ? `: ${partes.join(', ')}` : ''}.${avisos.length ? ' ' + avisos.join(' ') : ''}`]);
    return { v, dest };
  }

  Object.assign(P2, { VARIANTES, varianteSemana, destacadaSemana, aplicarAccionSemana, BONUS_DESTACADA });
})(globalThis.P2 = globalThis.P2 || {});
