/* =====================================================================
   18 · MOMENTOS CLAVE Y MINIJUEGOS (P2.5.1: ritmo)
   GESTIÓN → PREPARACIÓN → MOMENTO IMPORTANTE → MINIJUEGO → CONSECUENCIA → NUEVA DECISIÓN.
   - 4 motores (timing, secuencia, objetivo, reacción) y muchas instancias con su propio contexto.
   - Importancia 1–5: decide si hay momento jugable, cómo se presenta y cuánto pesa.
   - Cooldowns por tipo (s.minigameHistory): el mismo minijuego no se repite seguido.
   - La gestión cambia la dificultad real (MINIGAME_MODIFIERS) y los grandes partidos se preparan
     (s.eventoImportante: preparación, fatiga, presión).
   - Resultado FAIL / GOOD / PERFECT con consecuencias pequeñas: la gestión pesa más que la mano.
   - Vidas: solo para repetir un minijuego fallado (nunca cambian el resultado solas).
   Todo lo que decide si hay momento y cuál es determinista (hash de la semilla): no toca el azar de la partida.
   Sin minijuego (bots, simulación de balance) los partidos se resuelven sin interacción.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, r1 } = P2;

  // Contextos (lo que te juegas). 'partido' sustituye al antiguo «Penalti decisivo».
  const MINIJUEGOS = {
    prueba: { ic: '📋', n: 'Día de pruebas', d: 'Los ojeadores te miran: demuestra lo que vales.', rondas: 3, neutro: 0.4, imp: 4 },
    torneo: { ic: '🏆', n: 'Final del torneo', d: 'La final del torneo del barrio, con todo el barrio mirando.', rondas: 3, neutro: 0.4, imp: 3 },
    promocion: { ic: '⬆️', n: 'Promoción', d: 'Te juegas la categoría en un partido.', rondas: 3, neutro: 0.4, imp: 4 },
    final: { ic: '🏆', n: 'Final', d: 'Una final: no hay segunda oportunidad.', rondas: 3, neutro: 0.4, imp: 5 },
    partido: { ic: '🔥', n: 'Momento clave', d: 'Una jugada que puede cambiar el partido.', rondas: 1, neutro: 0.4, imp: 2 },
  };
  MINIJUEGOS.penalti = MINIJUEGOS.partido;   // partidas guardadas antes de P2.5.1
  // Skins de la interfaz (cada deporte les cambia el nombre en 00_deportes)
  const JUEGOS = {
    toques: { ic: '⚽', n: 'Toques', dif: 'Fácil', d: 'Toca cuando el balón baje a tu pie. Cinco toques sin que caiga.', rondas: 5 },
    pase: { ic: '👟', n: 'Pase al desmarcado', dif: 'Fácil', d: 'Un compañero se desmarca un instante: tócalo antes de que lo cubran. Tres pases.', rondas: 3 },
    barra: { ic: '🎯', n: 'Disparo preciso', dif: 'Media', d: 'Para la barra en la zona verde. Tres disparos, cada vez más difícil.', rondas: 3 },
    memoria: { ic: '🧠', n: 'Jugada ensayada', dif: 'Media', d: 'Mira la jugada que dibuja el míster y repítela en el mismo orden.', rondas: 1 },
    portero: { ic: '🧤', n: 'Parada imposible', dif: 'Difícil', d: 'Te chutan: tírate al lado del balón antes de que entre. Tres tiros, cada vez más rápidos.', rondas: 3 },
    penalti: { ic: '🥅', n: 'Penalti', dif: 'Media', d: 'Elige esquina y chuta en el momento justo.', rondas: 1 },
  };
  // ---------- Motores (la mecánica) ----------
  const MOTORES = {
    timing: { n: 'Timing', juegos: ['barra', 'penalti', 'toques'], d: 'Para la marca en la zona buena (o toca en el momento justo).' },
    secuencia: { n: 'Secuencia', juegos: ['memoria'], d: 'Mira la secuencia y repítela.' },
    objetivo: { n: 'Objetivo', juegos: ['pase'], d: 'Elige a tiempo la opción libre.' },
    reaccion: { n: 'Reacción', juegos: ['portero'], d: 'Algo aparece en un lado: tócalo rápido.' },
  };
  const MINIGAME_TYPES = MOTORES;
  // ---------- Instancias (el contexto) ----------
  // lado: ataque (acierto = gol), defensa (fallo = gol del rival), prueba (puntos en la prueba)
  // ctx: dónde puede salir · impMin: importancia mínima · peso · cd: momentos que tarda en volver
  const I = (o) => Object.assign({ dep: 'futbol', impMin: 0, peso: 1, cd: 3, cfg: {} }, o);
  const MINIGAME_INSTANCES = [
    I({ id: 'penalti', ic: '🥅', n: 'Penalti', motor: 'timing', juego: 'penalti', lado: 'ataque', ctx: ['partido', 'promocion', 'final'], impMin: 3, peso: 0.45, cd: 5,
      escena: 'Penalti a favor. El estadio en silencio.', d: 'Elige lado y chuta en el momento justo.', cfg: { rondas: 1 } }),
    I({ id: 'paseHueco', ic: '👟', n: 'Pase al hueco', motor: 'objetivo', juego: 'pase', lado: 'ataque', ctx: ['partido', 'torneo', 'prueba'],
      escena: 'Un compañero pica al espacio.', d: 'Pásale al que se desmarca antes de que lo cierren.', cfg: { rondas: 3 } }),
    I({ id: 'control', ic: '🪄', n: 'Control orientado', motor: 'secuencia', juego: 'memoria', lado: 'ataque', ctx: ['partido', 'prueba'],
      escena: 'Te llega un balón largo con un rival encima.', d: 'Repite los movimientos del control: amortiguar, orientar, salir.', cfg: { pasos: 3, ms: 650 } }),
    I({ id: 'tiroColocado', ic: '🎯', n: 'Tiro colocado', motor: 'timing', juego: 'barra', lado: 'ataque', ctx: ['partido', 'final'],
      escena: 'Te quedas sola/o en la frontal.', d: 'Para la barra en el verde: dos tiros, cada vez más difícil.', cfg: { rondas: 2 } }),
    I({ id: 'falta', ic: '🧱', n: 'Falta directa', motor: 'timing', juego: 'penalti', lado: 'ataque', ctx: ['partido', 'promocion', 'final'], impMin: 3, peso: 0.6, cd: 4,
      escena: 'Falta en la frontal. La barrera, a nueve metros.', d: 'Elige por dónde superar la barrera y golpea en el momento justo.', cfg: { rondas: 1, barrera: true } }),
    I({ id: 'unoContraUno', ic: '🏃', n: 'Uno contra uno', motor: 'reaccion', juego: 'portero', lado: 'ataque', ctx: ['partido', 'final'],
      escena: 'Solo/a delante del portero.', d: 'El portero se vence a un lado: dispara al hueco que deja, rápido.', cfg: { rondas: 2, reaccion: 'hueco' } }),
    I({ id: 'regate', ic: '💨', n: 'Regate', motor: 'secuencia', juego: 'memoria', lado: 'ataque', ctx: ['partido', 'torneo'],
      escena: 'Dos defensas te cierran en la banda.', d: 'Repite la finta en el orden justo (es rápida).', cfg: { pasos: 4, ms: 520 } }),
    I({ id: 'corner', ic: '🚩', n: 'Centro / córner', motor: 'objetivo', juego: 'pase', lado: 'ataque', ctx: ['partido', 'promocion'],
      escena: 'Córner a favor. El área llena de gente.', d: 'Centra a la zona donde tu rematador queda libre.', cfg: { rondas: 2, zonas: ['Primer palo', 'Penalti', 'Segundo palo'] } }),
    I({ id: 'ultimoPase', ic: '🎁', n: 'Último pase', motor: 'objetivo', juego: 'pase', lado: 'ataque', ctx: ['partido', 'final'], impMin: 3, peso: 0.8,
      escena: 'Contragolpe con superioridad.', d: 'Un solo pase: elige al compañero libre en el instante justo.', cfg: { rondas: 1, ventana: 0.85 } }),
    I({ id: 'contra', ic: '⚡', n: 'Contraataque', motor: 'secuencia', juego: 'memoria', lado: 'ataque', ctx: ['partido', 'promocion'],
      escena: 'Robáis en el centro del campo y salís a la carrera.', d: 'Repite la jugada a toda velocidad.', cfg: { pasos: 4, ms: 560 } }),
    I({ id: 'tikitaka', ic: '🔁', n: 'Secuencia de pases', motor: 'secuencia', juego: 'memoria', lado: 'ataque', ctx: ['partido', 'torneo', 'prueba', 'promocion'],
      escena: 'Tocáis y tocáis buscando el hueco.', d: 'Memoriza la secuencia de pases y repítela.', cfg: { pasos: 5, ms: 700 } }),
    I({ id: 'entrada', ic: '🛡️', n: 'Defensa / entrada', motor: 'reaccion', juego: 'portero', lado: 'defensa', ctx: ['partido', 'promocion', 'final'],
      escena: 'El delantero rival encara a toda velocidad.', d: 'Tápale el lado por el que sale. Si llegas tarde, es gol.', cfg: { rondas: 3, reaccion: 'delantero' } }),
    I({ id: 'remate', ic: '🤕', n: 'Remate', motor: 'timing', juego: 'barra', lado: 'ataque', ctx: ['partido', 'promocion'], peso: 0.8,
      escena: 'Centro medido al área.', d: 'Un solo remate: la zona buena es estrecha.', cfg: { rondas: 1, zona: 0.75 } }),
    I({ id: 'fisica', ic: '🏃', n: 'Prueba física', motor: 'timing', juego: 'toques', lado: 'prueba', ctx: ['prueba', 'torneo'],
      escena: 'Series de velocidad con el cronómetro delante.', d: 'Toca justo en cada apoyo: cinco series.', cfg: { rondas: 5, vel: 1.12 } }),
    I({ id: 'tecnica', ic: '⚽', n: 'Prueba técnica', motor: 'timing', juego: 'toques', lado: 'prueba', ctx: ['prueba', 'torneo'],
      escena: 'Toques, controles y conducción ante los ojeadores.', d: 'Toca cuando el balón baje a tu pie. Cinco toques sin que caiga.', cfg: { rondas: 5 } }),
    // Resto de deportes: una instancia por motor con el nombre de su skin (preparado para instancias propias más adelante)
    I({ id: 'g_timing', dep: '*', motor: 'timing', juego: 'barra', lado: 'ataque', ctx: ['partido', 'promocion', 'final'], cfg: { rondas: 2 } }),
    I({ id: 'g_lanzamiento', dep: '*', motor: 'timing', juego: 'penalti', lado: 'ataque', ctx: ['partido', 'promocion', 'final'], impMin: 3, peso: 0.5, cd: 5, cfg: { rondas: 1 } }),
    I({ id: 'g_secuencia', dep: '*', motor: 'secuencia', juego: 'memoria', lado: 'ataque', ctx: ['partido', 'torneo', 'prueba', 'promocion', 'final'], cfg: { pasos: 4, ms: 650 } }),
    I({ id: 'g_objetivo', dep: '*', motor: 'objetivo', juego: 'pase', lado: 'ataque', ctx: ['partido', 'torneo', 'prueba'], cfg: { rondas: 3 } }),
    I({ id: 'g_reaccion', dep: '*', motor: 'reaccion', juego: 'portero', lado: 'defensa', ctx: ['partido', 'promocion', 'final'], cfg: { rondas: 3 } }),
    I({ id: 'g_toques', dep: '*', motor: 'timing', juego: 'toques', lado: 'prueba', ctx: ['prueba', 'torneo'], cfg: { rondas: 5 } }),
  ];
  const INST = Object.fromEntries(MINIGAME_INSTANCES.map(x => [x.id, x]));
  // Nombre visible de una instancia (las genéricas toman el de la skin del deporte)
  const instancia = id => INST[id] || null;
  const nombreInst = X => (X.dep === '*' ? Object.assign({}, X, { n: (JUEGOS[X.juego] || {}).n || X.id, ic: (JUEGOS[X.juego] || {}).ic || '🎯', d: (JUEGOS[X.juego] || {}).d || '' }) : X);

  // ---------- Configuración ----------
  const CFG_MJ = {
    prob: { 1: 0.15, 2: 0.30, 3: 0.70, 4: 1, 5: 1 },
    director: { recientes: 2, factorReciente: 0.5, sinMjMax: 5, factorSinMj: 2, techo: 0.6 },
    umbral: { perfect: 0.9, good: 0.6 },
    alertas: { maxTipoPct: 0.4, maxPartidosConMj: 0.7, maxSinMj: 6, maxVidasAnuncioTemporada: 3, minPartidosConMj: 0.15 },
    historial: 12,
  };
  const VIDAS = { max: 3, recargaSemanas: 6, reintentosPorMomento: 1, anuncioPorTemporada: 3 };

  function hashMj(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const u01 = (s, k) => (hashMj(`${s.seed}|${k}`) % 100000) / 100000;
  const hist = s => (Array.isArray(s.minigameHistory) ? s.minigameHistory : (s.minigameHistory = []));
  const semLog = s => (Array.isArray(s.semLog) ? s.semLog : (s.semLog = []));
  const depId = s => (s && s.deporte) || 'futbol';

  // ---------- Importancia del partido de esta semana ----------
  const ENTRENO = ['entrenar', 'entrenoExtra', 'preparador', 'campus', 'roca', 'superficie', 'tiro', 'calle'];
  function importanciaPartido(s) {
    const T = s.temporada; if (!T || T.cerrada) return null;
    const ctx = P2.contexto(T), quedan = T.calendario.length - T.jornada, motivos = [];
    let imp = 2;
    const enJuego = ctx.some(t => /ascenso|descenso|título|líder/i.test(t)), mitad = T.jornada >= Math.floor(T.calendario.length / 2);
    if (quedan <= 3 && enJuego) { imp = 3; motivos.push(quedan === 1 ? 'Última jornada' : `Quedan ${quedan} jornadas`); }
    else if (mitad && ctx.some(t => /Si ganáis, entráis|Si perdéis, podéis salir|Una derrota os mete|ganar os saca/i.test(t))) { imp = 3; motivos.push('Os jugáis la zona'); }
    const pj = P2.partidoDeLaJornada && P2.partidoDeLaJornada(T);
    if (pj && T.formato !== 'circuito' && mitad) {
      // Rival directo: justo en la frontera de ascenso o de descenso, a 3 puntos o menos
      const tb = P2.clasificacion(T), a = tb.findIndex(r => r.id === T.yo) + 1, b = tb.findIndex(r => r.id === pj.rival) + 1, n = tb.length, Z = P2.zonas(T.liga);
      const frontera = x => (Z.asc && (x === Z.asc || x === Z.asc + 1)) || (Z.desc && (x === n - Z.desc || x === n - Z.desc + 1)) || (!Z.asc && x <= 2);
      if (Math.abs(a - b) <= 1 && frontera(a) && frontera(b) && Math.abs(tb[a - 1].pts - tb[b - 1].pts) <= 3) { imp = 3; motivos.push('Rival directo'); }
    }
    const m = s.semanaMods && s.semanaMods.semana === s.semana ? s.semanaMods : {};
    if (m.bonusSel || m.bonusNota) { imp = 3; motivos.push('Partido decisivo para ti'); }
    if (s.eventoImportante && s.eventoImportante.semana === s.semana && s.eventoImportante.tipo === 'decisivo') { imp = Math.max(imp, 3); motivos.push(s.eventoImportante.n); }
    return { imp, motivos };
  }
  // Partidos seguidos sin momento y si hubo momento en los últimos partidos (director)
  function ritmoPartidos(s) {
    const l = semLog(s).filter(x => x.partido); let sin = 0;
    for (let i = l.length - 1; i >= 0 && !l[i].mj; i--) sin++;
    if (s.mjCuenta && typeof s.mjCuenta.sin === 'number') sin = Math.max(sin, s.mjCuenta.sin);   // también entre temporadas
    return { sin, recientes: l.slice(-CFG_MJ.director.recientes).some(x => x.mj) };
  }
  function probMomento(s, imp) {
    let p = CFG_MJ.prob[imp] || 0;
    const D = CFG_MJ.director, r = ritmoPartidos(s);
    if (imp <= 2 && r.recientes) p *= D.factorReciente;
    if (r.sin >= D.sinMjMax) p = Math.min(Math.max(p, D.techo), p * D.factorSinMj);
    if (r.sin >= D.sinMjMax + 1) p = 1;   // nunca más de 6 partidos seguidos sin un momento
    return p;
  }

  // ---------- Elegir la instancia (pool por contexto, cooldowns, sin repetir motor) ----------
  function elegirInstancia(s, ctx, imp) {
    const dep = depId(s), H = hist(s);
    let pool = MINIGAME_INSTANCES.filter(X => (dep === 'futbol' ? X.dep === 'futbol' : X.dep === '*' || X.dep === dep) && X.ctx.includes(ctx) && imp >= X.impMin);
    if (!pool.length) pool = MINIGAME_INSTANCES.filter(X => X.dep === '*' && X.ctx.includes(ctx));
    const ult = H.slice().reverse();
    const enCd = X => { const k = ult.findIndex(h => h.id === X.id); return k >= 0 && k < X.cd; };
    const narrativa = X => (ctx === 'final' || ctx === 'promocion') && X.juego === 'penalti' && !H.slice(-2).some(h => h.id === X.id);   // la tanda
    let ok = pool.filter(X => !enCd(X) || narrativa(X));
    const ultMotor = H.length ? H[H.length - 1].motor : null;
    const sinMotor = ok.filter(X => X.motor !== ultMotor); if (sinMotor.length) ok = sinMotor;
    if (!ok.length) ok = pool.filter(X => !H.length || X.id !== H[H.length - 1].id);
    if (!ok.length) ok = pool;
    const w = X => X.peso * (ctx === 'final' && X.juego === 'penalti' ? 2 : 1);
    const tot = ok.reduce((a, X) => a + w(X), 0); let u = u01(s, `inst|${ctx}|${s.semana}|${H.length}`) * tot;
    for (const X of ok) { u -= w(X); if (u <= 0) return X; }
    return ok[ok.length - 1];
  }

  // ---------- ¿Hay momento jugable esta semana? (puro y determinista: la interfaz lo consulta antes de jugar) ----------
  function momentoSemana(s, accion) {
    let ctx = null, imp = 0, motivos = [];
    if (s.fase === 'pruebas' && s.invitacion && s.semana >= s.invitacion.dia) { ctx = 'prueba'; imp = 4; motivos = ['Te juegas ser profesional']; }
    else if (accion === 'torneo') { ctx = 'torneo'; imp = 3; motivos = ['La final del torneo']; }
    else if (P2.promoPendiente && P2.promoPendiente(s)) { ctx = 'promocion'; imp = s.temporada.promocion.clase === 'titulo' ? 5 : 4; motivos = [P2.TXT_PROMO[s.temporada.promocion.clase].n]; }
    else if (P2.finalEstaSemana && P2.finalEstaSemana(s)) { ctx = 'final'; imp = 5; motivos = [`Final · ${P2.finalEstaSemana(s).n}`]; }
    else if ((s.fase === 'club' || s.fase === 'amateur') && s.temporada && !s.temporada.cerrada && !s.p.lesion) {
      const x = importanciaPartido(s); if (!x) return null;
      if (u01(s, `mom|${s.semana}|${s.temporada.num}`) >= probMomento(s, x.imp)) return null;
      ctx = 'partido'; imp = x.imp; motivos = x.motivos;
    }
    if (!ctx) return null;
    const X = elegirInstancia(s, ctx, imp);
    return { tipo: ctx, ctx, imp, inst: X.id, motor: X.motor, juego: X.juego, lado: X.lado, motivos, minuto: ctx === 'partido' || ctx === 'final' || ctx === 'promocion' ? 60 + (hashMj(`${s.seed}|min|${s.semana}`) % 31) : null };
  }
  // Compatibilidad: el tipo (contexto) y el juego de la interfaz
  function minijuegoSemana(s, accion) { const m = momentoSemana(s, accion); return m ? m.ctx : null; }
  function juegoMinijuego(s, tipo, accion) { const m = momentoSemana(s, accion); return m && m.ctx === tipo ? m.juego : 'barra'; }
  const JUEGOS_DE = { prueba: ['toques', 'pase', 'memoria'], torneo: ['pase', 'toques', 'memoria'], partido: ['barra', 'pase', 'memoria', 'portero', 'penalti'], promocion: ['memoria', 'portero', 'barra', 'penalti'], final: ['portero', 'memoria', 'barra', 'penalti'] };

  // ---------- Modificadores: la gestión cambia la dificultad real ----------
  const MINIGAME_MODIFIERS = {
    entreno: { ic: '🏋️', ventanaPorSesion: 0.06, max: 0.18, semanas: 4 },
    descanso: { ic: '🛌', vel: -0.08, semanas: 2 },
    energiaBaja: { ic: '🪫', umbral: 35, ventana: -0.15, vel: 0.12, umbral2: 20 },
    energiaAlta: { ic: '🔋', umbral: 75, ventana: 0.05 },
    lesionReciente: { ic: '🩹', semanas: 3, ventana: -0.10 },
    confianzaAlta: { ic: '😎', umbral: 70, ventana: 0.08 },
    confianzaBaja: { ic: '😰', umbral: 35, vel: 0.10 },
    botas: { ic: '👟', botas: 0.04, botasPro: 0.06 },
    preparador: { ic: '🧑‍🏫', ventana: 0.05 },
    preparacion: { ic: '📈', escala: 0.30 },   // ±15 % (50 % = neutro)
    importancia: { ic: '😬', 5: 0.10, 1: -0.10 },
  };
  function ultimasAcciones(s, accion) { const l = (Array.isArray(s.ultAcciones) ? s.ultAcciones : []).slice(-8); return accion ? l.concat({ semana: s.semana, a: accion }) : l; }
  function modificadores(s, mom, accion) {
    const M = MINIGAME_MODIFIERS, l = [], X = instancia(mom.inst) || {};
    let ventana = 0, vel = 0;
    const add = (ic, t, dv, dvel) => { ventana += dv || 0; vel += dvel || 0; l.push({ ic, t, ventana: dv || 0, vel: dvel || 0, bien: (dv || 0) > 0 || (dvel || 0) < 0 }); };
    const acc = ultimasAcciones(s, accion);
    const ses = acc.filter(x => s.semana - x.semana < M.entreno.semanas && ENTRENO.includes(x.a)).length;
    if (ses) add(M.entreno.ic, `Entrenaste ${ses} ${ses === 1 ? 'vez' : 'veces'} en las últimas ${M.entreno.semanas} semanas`, Math.min(M.entreno.max, ses * M.entreno.ventanaPorSesion));
    else if (s.fase !== 'barrio' && s.fase !== 'pruebas') add('🥱', 'No has entrenado en las últimas semanas', -0.06);
    if (acc.some(x => s.semana - x.semana < M.descanso.semanas && x.a === 'descansar')) add(M.descanso.ic, 'Llegas descansado/a: más calma', 0, M.descanso.vel);
    const e = s.p.energia;
    if (e < M.energiaBaja.umbral2) add(M.energiaBaja.ic, `Energía ${Math.round(e)}: llegas reventado/a`, M.energiaBaja.ventana * 2, M.energiaBaja.vel * 2);
    else if (e < M.energiaBaja.umbral) add(M.energiaBaja.ic, `Energía ${Math.round(e)}: llegas cansado/a`, M.energiaBaja.ventana, M.energiaBaja.vel);
    else if (e >= M.energiaAlta.umbral) add(M.energiaAlta.ic, `Energía ${Math.round(e)}: llegas fresco/a`, M.energiaAlta.ventana);
    if (s.finLesion && s.semana - s.finLesion <= M.lesionReciente.semanas) add(M.lesionReciente.ic, 'Vienes de una lesión: aún notas molestias', M.lesionReciente.ventana);
    if (s.temporada) {
      if (s.confianza >= M.confianzaAlta.umbral) add(M.confianzaAlta.ic, `El míster confía en ti (${Math.round(s.confianza)})`, M.confianzaAlta.ventana);
      else if (s.confianza <= M.confianzaBaja.umbral) add(M.confianzaBaja.ic, `Poca confianza (${Math.round(s.confianza)}): juegas con presión`, 0, M.confianzaBaja.vel);
    }
    if (X.motor === 'timing' && P2.posee) { const b = P2.posee(s, 'botasPro') ? M.botas.botasPro : P2.posee(s, 'botas') ? M.botas.botas : 0; if (b) add(M.botas.ic, P2.posee(s, 'botasPro') ? 'Botas profesionales' : 'Botas buenas', b); }
    if (s.preparador || acc.some(x => s.semana - x.semana < 4 && x.a === 'preparador')) add(M.preparador.ic, 'Has trabajado con un preparador', M.preparador.ventana);
    const ev = s.eventoImportante;
    if (ev && ev.semana === s.semana && (mom.imp >= 3)) {
      const pe = prepEfectiva(ev, s, accion), dv = r1(((pe - 50) / 100) * M.preparacion.escala * 100) / 100;
      if (dv) add(M.preparacion.ic, `Preparación ${Math.round(pe)} %`, dv);
      const pres = ev.presion || 0; if (pres >= 15) add('😬', 'Mucha presión en la grada', 0, 0.06); else if (pres <= -10) add('🫶', 'Tu gente en la grada: menos presión', 0, -0.05);
    }
    if (M.importancia[mom.imp]) add(mom.imp >= 5 ? M.importancia.ic : '🙂', mom.imp >= 5 ? 'Es una final: nervios' : 'Es un entrenamiento: sin nervios', 0, M.importancia[mom.imp]);
    return { lista: l, ventana: r1(clamp(1 + ventana, 0.6, 1.4) * 100) / 100, vel: r1(clamp(1 + vel, 0.75, 1.35) * 100) / 100 };
  }
  // Dificultad 0 (muy fácil) … 1 (muy difícil), para enseñar y para la telemetría
  const dificultadDe = M => r1(clamp(0.5 - (M.ventana - 1) * 0.9 + (M.vel - 1) * 0.7, 0, 1) * 100) / 100;

  // ---------- Preparación del gran partido ----------
  const EFECTO_PREP = { entrenar: [12, 8], entrenoExtra: [12, 8], preparador: [14, 6], campus: [10, 8], roca: [10, 8], superficie: [10, 8], tiro: [10, 8], calle: [8, 6],
    descansar: [4, -15], plaza: [6, 4], jornada: [6, 4], torneo: [6, 6], trabajar: [-4, 4], gestionar: [-6, 2], prensa: [-3, 0], __acto: [-6, 2], __evento: [-5, 2] };
  const TXT_PREP = { entrenar: 'Entrenar', entrenoExtra: 'Quedarte a entrenar', preparador: 'Preparador', descansar: 'Descansar', gestionar: 'Atender la empresa', trabajar: 'Trabajar', prensa: 'Prensa', __acto: 'Acto de patrocinador', __evento: 'Semana ocupada' };
  const prepEfectiva = (ev, s, accion) => {
    let p = ev.prep, f = ev.fatiga || 0;
    if (accion && ev.semana >= s.semana && !ev.aplicada) { const e = EFECTO_PREP[accion] || [0, 0]; p += e[0]; f += e[1]; }
    return clamp(p - Math.max(0, f - 40) / 2, 0, 100);
  };
  function aplicarPreparacion(s, accion, R) {
    const ev = s.eventoImportante; if (!ev || ev.semana < s.semana) return;
    const e = EFECTO_PREP[accion]; if (!e) return;
    ev.prep = clamp(ev.prep + e[0], 0, 100); ev.fatiga = clamp((ev.fatiga || 0) + e[1] - 3, 0, 100);
    if (e[0]) { ev.log = (ev.log || []).concat({ semana: s.semana, t: TXT_PREP[accion] || accion, d: e[0] }).slice(-6); R && R.lineas.push([ev.ic, `${ev.n}: preparación ${e[0] > 0 ? '+' : ''}${e[0]} (${Math.round(ev.prep)} %).`, e[0] > 0 ? 'bien' : 'mal']); }
    if (ev.semana === s.semana) ev.aplicada = true;
  }
  function moverPreparacion(s, dPrep, dPresion, motivo) {
    const ev = s.eventoImportante; if (!ev || ev.semana < s.semana) return false;
    ev.prep = clamp(ev.prep + (dPrep || 0), 0, 100); ev.presion = clamp((ev.presion || 0) + (dPresion || 0), -30, 30);
    if (motivo) ev.log = (ev.log || []).concat({ semana: s.semana, t: motivo, d: dPrep || 0, presion: dPresion || 0 }).slice(-6);
    return true;
  }
  // ¿Se acerca un gran partido? (se llama al acabar la semana, con la jornada ya avanzada)
  function detectarEvento(s, R) {
    const T = s.temporada, ev = s.eventoImportante;
    if (ev && ev.semana < s.semana + 1) s.eventoImportante = null;   // ya se jugó
    if (ev && ev.tipo === 'final' && !(P2.copaFinalEn && P2.copaFinalEn(s, ev.jornada))) { s.eventoImportante = null; }
    if (ev && ev.tipo === 'promocion' && T && T.cerrada && !(T.promocion && T.promocion.estado === 'pendiente')) { s.eventoImportante = null; R && R.lineas.push(['📉', 'No habrá promoción: se acaba la preparación especial.']); }
    if (s.eventoImportante || !T || T.cerrada || (s.fase !== 'club' && s.fase !== 'amateur')) return;
    const nuevo = (o) => { s.eventoImportante = Object.assign({ prep: 50, fatiga: 0, presion: 0, log: [], anunciada: s.semana + 1 }, o); R && R.lineas.push([o.ic, `${o.n} ${o.semana - s.semana === 1 ? 'la semana que viene' : `en ${o.semana - s.semana} semanas`}. Prepárala bien: lo que decidas cuenta.`, 'bien']); P2.anotar(s, o.ic, `Se acerca: ${o.n}.`); };
    // Final de copa en las próximas 3 jornadas
    for (let k = 0; k < 3 && s.fase === 'club'; k++) {
      const c = P2.copaFinalEn && P2.copaFinalEn(s, T.jornada + k);
      if (c) { const C = P2.COMPETICIONES[c.id]; return nuevo({ id: `final|${c.id}|${T.num}`, tipo: 'final', n: `Final · ${C.n}`, ic: '🏆', semana: s.semana + 1 + k, jornada: T.jornada + k }); }
    }
    const quedan = T.calendario.length - T.jornada;
    if (quedan <= 3 && quedan >= 1) {
      const Z = P2.zonas(T.liga), n = P2.clasificacion(T).length, pos = P2.posicion(T);
      const cercaPromo = (Z.asc && P2.LIGAS[T.liga].sube && Math.abs(pos - (Z.asc + 1)) <= 1) || (Z.desc && pos >= n - Z.desc - 1 && pos <= n - Z.desc + 2);
      if (cercaPromo && T.formato !== 'circuito') return nuevo({ id: `promo|${T.num}|${T.liga}`, tipo: 'promocion', n: 'Posible promoción', ic: '⬆️', semana: s.semana + 1 + quedan });
      const enJuego = P2.contexto(T).some(t => /ascenso|descenso|título|líder/i.test(t));
      if (enJuego) return nuevo({ id: `ult|${T.num}`, tipo: 'decisivo', n: 'Última jornada', ic: '🔥', semana: s.semana + quedan });
    }
  }

  // ---------- Resultado: FAIL / GOOD / PERFECT ----------
  const nivelRes = p => (p >= CFG_MJ.umbral.perfect ? 'PERFECT' : p >= CFG_MJ.umbral.good ? 'GOOD' : 'FAIL');
  const mj = s => (s.mjSemana && s.mjSemana.semana === s.semana ? s.mjSemana : null);
  function bonusPrueba(s) { const m = mj(s); return m && m.tipo === 'prueba' ? Math.round((m.p - MINIJUEGOS.prueba.neutro) * 12) : 0; }   // −5 … +7 (como siempre: la ruta amateur no cambia)
  function bonusTorneo(s) { const m = mj(s); return m && m.tipo === 'torneo' ? r1((m.p - MINIJUEGOS.torneo.neutro) * 12) : 0; }
  // Momento de partido → código para el motor del partido. Ataque: GOOD/PERFECT = gol; FAIL = ocasión fallada.
  // Defensa: GOOD/PERFECT = evitas el gol; FAIL = gol del rival. (Antes: ±2 goles y ±18 de confianza)
  function momentoPartido(s) {
    const m = mj(s); if (!m || (m.tipo !== 'partido' && m.tipo !== 'penalti')) return null;
    const X = instancia(m.inst) || INST.penalti, res = nivelRes(m.p);
    return { res, lado: X.lado === 'defensa' ? 'defensa' : 'ataque', inst: X.id, n: nombreInst(X).n, ic: nombreInst(X).ic };
  }
  // Compatibilidad con el motor del partido (04_carrera): gol / perfecto / fallo / parada
  function penalti(s) {
    const x = momentoPartido(s); if (!x) return null;
    if (x.lado === 'ataque') return x.res === 'PERFECT' ? 'perfecto' : x.res === 'GOOD' ? 'gol' : 'ocasion';
    return x.res === 'FAIL' ? 'fallo' : x.res === 'PERFECT' ? 'paradaPlus' : 'parada';
  }
  // Finales y promociones: la gestión decide la base; el minijuego inclina la balanza (≈25 % del rango)
  const AJUSTE_GRANDE = { PERFECT: 0.18, GOOD: 0.10, FAIL: -0.15 };
  function probGranPartido(s, tipo) {
    let p = P2.probSimular(s);
    const ev = s.eventoImportante;
    if (ev && ev.semana === s.semana && (ev.tipo === tipo || (tipo === 'promocion' && ev.tipo === 'promocion'))) p += (prepEfectiva(ev, s) - 50) / 250;
    const m = mj(s); if (m && m.tipo === tipo) p += AJUSTE_GRANDE[nivelRes(m.p)];
    return clamp(p, 0.05, 0.95);
  }
  // «Simular»: lo decide tu nivel, como mucho un 80 % (nunca perfecto)
  function probSimular(s) { return clamp(0.3 + (s.p.nivel - 50) / 50, 0.15, 0.8); }
  const P_SIM = { acierto: 0.72, fallo: 0.25 };

  // ---------- Jugador simulado (balance y tests): habilidad 0–1 + dificultad real ----------
  function simularJugador(s, mom, hab, accion, k = '') {
    const M = modificadores(s, mom, accion);
    const pE = clamp(hab + (M.ventana - 1) * 0.5 - (M.vel - 1) * 0.4 - (mom.imp >= 5 ? 0.03 : 0), 0.02, 0.98);
    const u = u01(s, `jug|${s.semana}|${mom.inst}|${k}`);
    if (u < pE * hab * 0.55) return 0.95;
    if (u < pE) return 0.72;
    return r1(u * 0.5 * 100) / 100;
  }

  // ---------- Registro: historial, estadísticas, rachas, logros ----------
  const stats = s => (s.mjStats && typeof s.mjStats === 'object' ? s.mjStats : (s.mjStats = { jugados: 0, exitos: 0, perfects: 0, racha: 0, mejorRacha: 0, reintentos: 0, vidasUsadas: 0, vidasAnuncio: 0, vidasAnuncioTemp: {}, porTipo: {}, simulados: 0 }));
  const LOGROS_MJ = [
    { id: 'sangreFria', ic: '🧊', n: 'Sangre fría', d: 'Perfect en una final o promoción sin usar vida' },
    { id: 'racha3', ic: '🔥', n: 'En racha', d: '3 Perfect seguidos' },
    { id: 'diezPerfect', ic: '🎯', n: 'Diez de diez', d: '10 Perfect' },
    { id: 'polivalente', ic: '⭐', n: 'Polivalente', d: 'Perfect en 5 tipos de momento distintos' },
  ];
  function registrarMomento(s, mom, info, R) {
    const H = hist(s), m = info || {};
    const jugado = m.p != null && !m.simulado;
    const res = m.p != null ? nivelRes(m.p) : null;
    H.push({ id: mom.inst, motor: mom.motor, ctx: mom.ctx, imp: mom.imp, semana: s.semana, res: res || 'auto', retry: m.reintentos || 0, vida: m.reintentos ? 1 : 0, jugado });
    while (H.length > CFG_MJ.historial) H.shift();
    const st = stats(s);
    if (m.simulado) st.simulados++;
    if (jugado) {
      st.jugados++; const t = st.porTipo[mom.inst] || (st.porTipo[mom.inst] = { j: 0, e: 0, p: 0 }); t.j++;
      if (res !== 'FAIL') { st.exitos++; t.e++; }
      if (res === 'PERFECT') { st.perfects++; t.p++; st.racha++; st.mejorRacha = Math.max(st.mejorRacha, st.racha); } else st.racha = 0;
      st.reintentos += m.reintentos || 0;
      const L = s.logrosMj = s.logrosMj || {}, nuevos = [];
      const lograr = id => { if (!L[id]) { L[id] = s.semana; nuevos.push(LOGROS_MJ.find(x => x.id === id)); } };
      if (res === 'PERFECT' && mom.imp >= 4 && !m.reintentos) lograr('sangreFria');
      if (st.racha >= 3) lograr('racha3');
      if (st.perfects >= 10) lograr('diezPerfect');
      if (Object.values(st.porTipo).filter(x => x.p > 0).length >= 5) lograr('polivalente');
      for (const x of nuevos) { R && R.lineas.push([x.ic, `Logro: ${x.n} (${x.d}).`, 'bien']); P2.anotar(s, x.ic, `Logro: ${x.n}.`); }
      // Lo memorable queda en Mi historia
      const X = nombreInst(instancia(mom.inst) || INST.penalti);
      if (mom.imp >= 4 || (res === 'PERFECT' && (mom.imp >= 3 || t.p === 1))) recordar(s, res === 'FAIL' ? '😖' : res === 'PERFECT' ? '⭐' : X.ic, `${X.n} · ${MINIJUEGOS[mom.ctx].n.toLowerCase()}: ${res === 'PERFECT' ? 'Perfect' : res === 'GOOD' ? 'conseguido' : 'fallado'}${m.reintentos ? ' (con una vida)' : ''}`);
    }
    P2.tele(s, 'minigame_result', { minigame_type: mom.inst, engine: mom.motor, importance: mom.imp, match_importance: mom.imp, result: res || 'auto', perfect: res === 'PERFECT', retry: m.reintentos || 0, life_used: (m.reintentos || 0) > 0, simulado: !!m.simulado, jugado });
  }
  function recordar(s, ic, t) { const l = s.memorables = Array.isArray(s.memorables) ? s.memorables : []; l.push({ semana: s.semana, ic, t }); if (l.length > 40) l.shift(); }

  // ---------- Director de eventos: variedad de las últimas semanas ----------
  const ETIQUETAS = ['sport', 'minigame', 'event', 'relationship', 'business', 'sponsor'];
  function etiquetarSemana(s, tag) { const l = s.tagsSemana = Array.isArray(s.tagsSemana) ? s.tagsSemana : []; if (!l.includes(tag)) l.push(tag); }
  function cerrarSemanaLog(s, accion, R, mom) {
    const tags = new Set(Array.isArray(s.tagsSemana) ? s.tagsSemana : []);
    if (R.partido || ['entrenar', 'plaza', 'jornada', 'torneo', 'campus', 'preparador', 'entrenoExtra'].includes(accion)) tags.add('sport');
    if (mom) tags.add('minigame');
    if (accion === 'gestionar' || (s.negocios.length && R.lineas.some(l => /^(💈|🏪|🏢|💼)/.test(l[0])))) tags.add('business');
    if (accion === '__acto' || accion === 'prensa') tags.add('sponsor');
    const l = semLog(s); l.push({ semana: s.semana, t: [...tags].filter(x => ETIQUETAS.includes(x)), partido: !!(R.partido && R.partido.nota != null) && !String(accion).startsWith('__'), mj: mom ? mom.inst : null });
    while (l.length > 8) l.shift();
    s.tagsSemana = [];
    // Cuenta de toda la partida (para el informe del tester y las alertas de diseño)
    const C = s.mjCuenta = s.mjCuenta && typeof s.mjCuenta === 'object' ? s.mjCuenta : { total: 0, porTipo: {}, consecutivas: 0, ult: null, partidos: 0, partidosConMj: 0, sin: 0, maxSin: 0 };
    const jugo = !!(R.partido && R.partido.nota != null) && !String(accion).startsWith('__');   // las semanas ocupadas (acto, evento) no tienen momento jugable
    if (jugo) { C.partidos++; if (mom) { C.partidosConMj++; C.sin = 0; } else { C.sin++; C.maxSin = Math.max(C.maxSin, C.sin); } }
    if (mom) { C.total++; C.porTipo[mom.inst] = (C.porTipo[mom.inst] || 0) + 1; if (C.ult === mom.inst) C.consecutivas++; C.ult = mom.inst; }
  }
  // Informe del tester: minijuegos (frecuencia, reparto, éxito, Perfect, reintentos, vidas) y alertas
  function informeMinijuegos(s) {
    const C = s.mjCuenta || { total: 0, porTipo: {}, consecutivas: 0, partidos: 0, partidosConMj: 0, maxSin: 0 }, st = stats(s), L = ['MINIJUEGOS (momentos clave)'];
    const pct = (a, b) => (b ? `${Math.round(100 * a / b)} %` : '—');
    L.push(`  Minijuegos totales: ${C.total} · jugados por ti: ${st.jugados} · simulados: ${st.simulados}`);
    const por = Object.entries(C.porTipo).sort((a, b) => b[1] - a[1]);
    L.push(`  Por tipo: ${por.length ? por.map(([id, n]) => `${nombreInst(instancia(id) || INST.penalti).n} ${n}`).join(' · ') : '—'}`);
    L.push(`  Éxito: ${pct(st.exitos, st.jugados)} · Perfect: ${pct(st.perfects, st.jugados)} · mejor racha de Perfect: ${st.mejorRacha}`);
    L.push(`  Reintentos: ${st.reintentos} · vidas usadas: ${st.vidasUsadas} · vidas por anuncio: ${st.vidasAnuncio}`);
    L.push(`  Frecuencia: ${C.total && C.partidos ? `1 minijuego cada ${(C.partidos / Math.max(1, C.partidosConMj)).toFixed(1)} partidos (${pct(C.partidosConMj, C.partidos)} de los partidos)` : '—'} · repeticiones seguidas: ${C.consecutivas} · máximo de partidos seguidos sin minijuego: ${C.maxSin}`);
    const maxVidasT = Math.max(0, ...Object.values(st.vidasAnuncioTemp || {}));
    const M = { total: C.total, maxTipo: C.total ? Math.max(0, ...Object.values(C.porTipo)) / C.total : 0, consecutivas: C.consecutivas };
    const al = alertasMinijuegos(M, { pctPartidosConMj: C.partidos >= 10 ? C.partidosConMj / C.partidos : null, maxSinMj: C.maxSin, maxVidasAnuncioTemp: maxVidasT });
    L.push(al.length ? `  ⚠️ ALERTAS: ${al.join(' ')}` : '  Sin alertas de diseño.');
    return L;
  }
  // Qué le falta a la semana (para elegir sucesos): factor de probabilidad y categorías a empujar
  function EVENT_DIRECTOR(s) {
    const l = semLog(s), ult = l.slice(-3), con = t => l.slice(-6).some(x => x.t.includes(t));
    const sinEventos = ult.length >= 3 && !ult.some(x => x.t.includes('event') || x.t.includes('relationship') || x.t.includes('business'));
    const seguidos = l.slice(-2).length === 2 && l.slice(-2).every(x => x.t.includes('event') || x.t.includes('relationship'));
    const firma = x => x.t.slice().sort().join(',');
    const iguales = ult.length >= 3 && ult.every(x => firma(x) === firma(ult[0]));
    return {
      factorSuceso: seguidos ? 0.5 : sinEventos || iguales ? 1.7 : 1,
      empujarRelacion: !con('relationship'),
      empujarEmpresa: s.negocios.length > 0 && !con('business'),
      forzar: iguales,
      variedad: new Set(l.slice(-6).flatMap(x => x.t)).size,
    };
  }

  // ---------- Vidas ----------
  const vidas = s => (s.vidas && typeof s.vidas === 'object' ? s.vidas : (s.vidas = { n: VIDAS.max, recarga: s.semana || 1 }));
  function usarVida(s) { const v = vidas(s); if (v.n <= 0) return false; v.n--; if (v.n === VIDAS.max - 1) v.recarga = s.semana; stats(s).vidasUsadas++; P2.teleMon && P2.teleMon(s, 'vida_usada', { quedan: v.n }); return true; }
  function recargarVidas(s) {
    const v = vidas(s);
    if (v.n >= VIDAS.max) { v.recarga = s.semana; return 0; }
    let g = 0;
    while (v.n < VIDAS.max && s.semana - v.recarga >= VIDAS.recargaSemanas) { v.n++; v.recarga += VIDAS.recargaSemanas; g++; }
    return g;
  }
  const semanasParaVida = s => { const v = vidas(s); return v.n >= VIDAS.max ? 0 : Math.max(1, VIDAS.recargaSemanas - (s.semana - v.recarga)); };
  const claveTemp = s => (s.temporada ? `${s.temporada.liga}-${s.temporada.num}` : `b${Math.floor((s.semana || 0) / 26)}`);
  const vidasAnuncioTemporada = s => stats(s).vidasAnuncioTemp[claveTemp(s)] || 0;
  function anotarVidaAnuncio(s) { const st = stats(s), k = claveTemp(s); st.vidasAnuncio++; st.vidasAnuncioTemp[k] = (st.vidasAnuncioTemp[k] || 0) + 1; P2.tele(s, 'rewarded_life', { temporada: k }); }

  // ---------- Informe y alertas de diseño ----------
  function metricasMinijuegos(l, partidos) {
    const tot = l.length, por = {};
    for (const x of l) por[x.id] = (por[x.id] || 0) + 1;
    let consec = 0; for (let i = 1; i < l.length; i++) if (l[i].id === l[i - 1].id) consec++;
    const jug = l.filter(x => x.jugado), ok = jug.filter(x => x.res !== 'FAIL').length, perf = jug.filter(x => x.res === 'PERFECT').length;
    return { total: tot, porTipo: por, exito: jug.length ? ok / jug.length : null, perfect: jug.length ? perf / jug.length : null, reintentos: l.reduce((a, x) => a + (x.retry || 0), 0),
      consecutivas: consec, cadaPartidos: tot ? partidos / tot : null, maxTipo: tot ? Math.max(...Object.values(por)) / tot : 0 };
  }
  function alertasMinijuegos(M, extra = {}) {
    const A = CFG_MJ.alertas, l = [];
    if (M.total >= 10 && M.maxTipo > A.maxTipoPct) l.push(`Un tipo es el ${Math.round(M.maxTipo * 100)} % de los minijuegos (máximo ${Math.round(A.maxTipoPct * 100)} %).`);
    if (M.consecutivas > 0) l.push(`El mismo minijuego salió ${M.consecutivas} ${M.consecutivas === 1 ? 'vez' : 'veces'} dos veces seguidas.`);
    if (extra.pctPartidosConMj != null && extra.pctPartidosConMj > A.maxPartidosConMj) l.push(`El ${Math.round(extra.pctPartidosConMj * 100)} % de los partidos tienen minijuego.`);
    if (extra.maxSinMj != null && extra.maxSinMj > A.maxSinMj) l.push(`Hubo ${extra.maxSinMj} partidos seguidos sin minijuego.`);
    if (extra.maxVidasAnuncioTemp != null && extra.maxVidasAnuncioTemp > A.maxVidasAnuncioTemporada) l.push(`${extra.maxVidasAnuncioTemp} vidas por anuncio en una temporada.`);
    return l;
  }

  Object.assign(P2, { MINIJUEGOS, JUEGOS, JUEGOS_DE, MOTORES, MINIGAME_TYPES, MINIGAME_INSTANCES, MINIGAME_MODIFIERS, CFG_MJ, VIDAS, LOGROS_MJ, EFECTO_PREP,
    instancia, nombreInst, importanciaPartido, probMomento, ritmoPartidos, elegirInstancia, momentoSemana, minijuegoSemana, juegoMinijuego,
    modificadores, dificultadDe, prepEfectiva, aplicarPreparacion, moverPreparacion, detectarEvento,
    nivelRes, bonusPrueba, bonusTorneo, momentoPartido, penalti, probGranPartido, AJUSTE_GRANDE, probSimular, P_SIM, simularJugador,
    mjStats: stats, registrarMomento, recordar, etiquetarSemana, cerrarSemanaLog, EVENT_DIRECTOR, ultimasAcciones,
    vidas, usarVida, recargarVidas, semanasParaVida, vidasAnuncioTemporada, anotarVidaAnuncio, metricasMinijuegos, alertasMinijuegos, informeMinijuegos });
})(globalThis.P2 = globalThis.P2 || {});
