/* =====================================================================
   19c · PRESTIGE CAREERS: la segunda vida (de pago: se compra poder JUGAR la campaña, nunca el cargo)
   Elegibilidad por méritos de tu carrera → candidatura (te retiras y pasan los años) → campaña (o preparación)
   → votación (o examen / nombramiento / casting) → mandato con decisiones y crisis → reelección o renovación.
   Puedes perder. Un cargo ocupado da experiencia institucional para los más altos.
   Retirarte del deporte también se puede sin Prestige: tu imperio sigue.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { rnd, clamp, r1, eur, nf } = P2;

  // tipo: eleccion (votan) · nombramiento (te eligen entre candidatos) · examen (licencia/título) · casting
  // req: rep, marca, temporadas, trofeos, deporte, deportes (cuántos deportes en tu cuenta), institucional, patrimonio
  const CARRERAS = {
    world_football_president: { n: 'Presidente/a de la Federación Mundial de Fútbol', ic: '🌐', tipo: 'eleccion', votantes: 211, edad: 48, sueldo: 9000, semanasCampana: 8, mandato: 26,
      bloques: ['Europa', 'América', 'África', 'Asia', 'Oceanía'], req: { deporte: 'futbol', rep: 80, marca: 40, temporadas: 5, institucional: true },
      decisiones: [
        ['Sede del próximo Mundial', [['Un país con estadios ya hechos', { aprobacion: 3, presupuesto: 4 }], ['Un país nuevo que lo pide por primera vez', { prestigio: 6, presupuesto: -6, polemica: 4 }], ['Un mundial repartido en tres países', { aprobacion: -2, presupuesto: 8, polemica: 6 }]]],
        ['Formato del Mundial', [['Mantener 32 selecciones', { aprobacion: 2 }], ['Ampliar a 48 (más dinero, más partidos)', { presupuesto: 10, prestigio: -2, polemica: 5 }]]],
        ['Reparto de premios', [['Más dinero a las federaciones pequeñas', { aprobacion: 6, presupuesto: -5 }], ['Premios según resultados', { prestigio: 3, aprobacion: -3 }]]],
        ['Calendario saturado: los jugadores protestan', [['Menos partidos de selección', { aprobacion: 5, presupuesto: -4 }], ['Todo sigue igual', { presupuesto: 3, aprobacion: -4 }]]],
        ['Patrocinador polémico ofrece una fortuna', [['Aceptar', { presupuesto: 12, polemica: 10, aprobacion: -4 }], ['Rechazar', { prestigio: 4 }]]],
        ['Fondo de desarrollo para el fútbol base', [['Aprobarlo', { aprobacion: 5, presupuesto: -6, prestigio: 3 }], ['Aplazarlo', { aprobacion: -3 }]]],
      ] },
    world_climbing_president: { n: 'Presidente/a de la Federación Mundial de Escalada', ic: '🧗', tipo: 'eleccion', votantes: 90, edad: 42, sueldo: 4200, semanasCampana: 7, mandato: 24,
      bloques: ['Europa', 'Asia', 'América', 'África y Oceanía'], req: { deporte: 'escalada', rep: 75, temporadas: 4 },
      decisiones: [
        ['Calendario de Copas del Mundo', [['Más pruebas en Asia (nuevos mercados)', { presupuesto: 6, aprobacion: -2 }], ['Pruebas clásicas en Europa', { aprobacion: 3 }]]],
        ['Formato olímpico', [['Bloque y dificultad por separado', { aprobacion: 5, prestigio: 3 }], ['Mantener la combinada', { presupuesto: 3, aprobacion: -2 }]]],
        ['Paraescalada', [['Más categorías y premios', { prestigio: 6, presupuesto: -4, aprobacion: 3 }], ['Seguir igual', { aprobacion: -2 }]]],
        ['Categorías juveniles', [['Campeonato del Mundo juvenil propio', { aprobacion: 4, presupuesto: -3 }], ['Integrado en el absoluto', { presupuesto: 2 }]]],
        ['Derechos de retransmisión', [['Plataforma gratuita (más audiencia)', { prestigio: 5, presupuesto: -2 }], ['Pago por ver', { presupuesto: 8, aprobacion: -4 }]]],
      ] },
    world_basket_president: { n: 'Presidente/a de la Federación Mundial de Baloncesto', ic: '🏀', tipo: 'eleccion', votantes: 150, edad: 45, sueldo: 6500, semanasCampana: 8, mandato: 24,
      bloques: ['Europa', 'América', 'Asia', 'África', 'Oceanía'], req: { deporte: 'basket', rep: 78, temporadas: 5 },
      decisiones: [
        ['Ventanas de selecciones en plena liga', [['Mantenerlas', { presupuesto: 3, aprobacion: -4 }], ['Pactar fechas con las ligas', { aprobacion: 6 }]]],
        ['3x3 olímpico', [['Invertir en circuito mundial de 3x3', { prestigio: 6, presupuesto: -5 }], ['Dejarlo como está', { aprobacion: -1 }]]],
        ['Mundial cada 4 o cada 2 años', [['Cada 4 (más valor)', { prestigio: 3 }], ['Cada 2 (más ingresos)', { presupuesto: 9, aprobacion: -3, polemica: 3 }]]],
        ['Baloncesto femenino', [['Mismos premios que el masculino', { prestigio: 7, presupuesto: -6, aprobacion: 4 }], ['Subida gradual', { aprobacion: 1 }]]],
      ] },
    world_tennis_president: { n: 'Presidente/a de la Federación Mundial de Tenis', ic: '🎾', tipo: 'eleccion', votantes: 140, edad: 45, sueldo: 6000, semanasCampana: 8, mandato: 24,
      bloques: ['Europa', 'América', 'Asia', 'África y Oceanía'], req: { deporte: 'tenis', rep: 78, temporadas: 5 },
      decisiones: [
        ['Copa del Mundo por países', [['Formato de una semana en una sede', { presupuesto: 6, aprobacion: -3 }], ['Eliminatorias en casa y fuera', { aprobacion: 5, presupuesto: -2 }]]],
        ['Calendario agotador', [['Menos torneos obligatorios', { aprobacion: 6, presupuesto: -3 }], ['Más torneos (más dinero)', { presupuesto: 6, aprobacion: -5 }]]],
        ['Juez electrónico en todas las pistas', [['Sí, en todos los torneos', { prestigio: 4, presupuesto: -4 }], ['Solo en los grandes', { presupuesto: 2 }]]],
        ['Ayudas a jugadores fuera del top 100', [['Fondo de ayudas', { aprobacion: 7, presupuesto: -5 }], ['No', { aprobacion: -3 }]]],
      ] },
    league_president: { n: 'Presidente/a de la Liga', ic: '🏟️', tipo: 'eleccion', votantes: 42, edad: 40, sueldo: 5200, semanasCampana: 6, mandato: 22,
      bloques: ['Clubes grandes', 'Clubes medianos', 'Clubes pequeños'], req: { rep: 65, temporadas: 4, marca: 30 },
      decisiones: [
        ['Reparto del dinero de la televisión', [['Más para los grandes', { presupuesto: 4, aprobacion: -5 }], ['Reparto más igualado', { aprobacion: 6, prestigio: 2 }]]],
        ['Horarios de los partidos', [['Horarios para la tele internacional', { presupuesto: 6, aprobacion: -4 }], ['Horarios para la afición', { aprobacion: 5 }]]],
        ['Control económico de los clubes', [['Límite de gasto estricto', { prestigio: 5, aprobacion: -3 }], ['Manga ancha', { aprobacion: 3, polemica: 5 }]]],
        ['Expansión: partidos en el extranjero', [['Sí', { presupuesto: 8, aprobacion: -6, polemica: 4 }], ['No', { aprobacion: 3 }]]],
        ['Patrocinador principal de la liga', [['Una casa de apuestas (paga más)', { presupuesto: 10, polemica: 8 }], ['Una marca de tecnología', { presupuesto: 5, prestigio: 2 }]]],
      ] },
    national_federation: { n: 'Presidente/a de la Federación Nacional', ic: '🏛️', tipo: 'eleccion', votantes: 120, edad: 42, sueldo: 4500, semanasCampana: 6, mandato: 22,
      bloques: ['Territoriales', 'Clubes', 'Deportistas', 'Árbitros y entrenadores'], req: { rep: 60, temporadas: 3 },
      decisiones: [
        ['Licencias del deporte base', [['Bajarlas (más jugadores)', { aprobacion: 6, presupuesto: -4 }], ['Subirlas (más presupuesto)', { presupuesto: 5, aprobacion: -5 }]]],
        ['Formación de entrenadores', [['Escuela nacional nueva', { prestigio: 5, presupuesto: -5 }], ['Cursos online', { presupuesto: 1, aprobacion: 1 }]]],
        ['Árbitros profesionales', [['Profesionalizarlos', { prestigio: 4, presupuesto: -4, aprobacion: 2 }], ['Seguir semiprofesionales', { aprobacion: -2 }]]],
        ['Sede de la selección', [['Ciudad deportiva nueva', { prestigio: 6, presupuesto: -8 }], ['Alquilar instalaciones', { presupuesto: 2 }]]],
      ] },
    national_coach: { n: 'Seleccionador/a nacional', ic: '📋', tipo: 'nombramiento', votantes: 1, edad: 40, sueldo: 5500, semanasCampana: 5, mandato: 20,
      req: { rep: 65, temporadas: 5, trofeos: 1 }, evento: { cada: 5, n: 'Torneo internacional', ic: '🌍', gana: 'Tu selección gana el torneo', pierde: 'Eliminados antes de tiempo' },
      decisiones: [
        ['Convocatoria', [['Veteranos de confianza', { aprobacion: 3, prestigio: 1 }], ['Jóvenes con hambre', { prestigio: 3, aprobacion: -2 }], ['Los que están en forma, sin nombres', { aprobacion: 1, prestigio: 2, polemica: 3 }]]],
        ['Estilo de juego', [['Defensivo y seguro', { aprobacion: -1, prestigio: 2 }], ['Ofensivo y vistoso', { aprobacion: 4, polemica: 2 }]]],
        ['Un club no quiere ceder a su estrella', [['Convocarla igualmente', { prestigio: 3, polemica: 5 }], ['Ceder y no convocarla', { aprobacion: -3 }]]],
        ['Rueda de prensa caliente', [['Responder con calma', { aprobacion: 2 }], ['Entrar al trapo', { polemica: 6, aprobacion: -2 }]]],
      ] },
    sporting_director: { n: 'Director/a deportivo/a', ic: '🗂️', tipo: 'nombramiento', votantes: 1, edad: 36, sueldo: 3800, semanasCampana: 4, mandato: 20,
      req: { rep: 55, temporadas: 4 }, evento: { cada: 6, n: 'Ventana de fichajes', ic: '🔁', gana: 'Los fichajes rinden: el equipo sube', pierde: 'Los fichajes no funcionan' },
      decisiones: [
        ['Fichaje estrella', [['Fichar caro', { presupuesto: -8, prestigio: 5, aprobacion: 3 }], ['Apostar por la cantera', { presupuesto: 3, prestigio: 2, aprobacion: -1 }]]],
        ['El entrenador no funciona', [['Destituirlo', { presupuesto: -3, aprobacion: 2, polemica: 3 }], ['Darle tiempo', { aprobacion: -2, prestigio: 1 }]]],
        ['Oferta por tu mejor jugador', [['Vender (mucho dinero)', { presupuesto: 10, aprobacion: -6 }], ['No vender', { aprobacion: 4, presupuesto: -2 }]]],
        ['Red de ojeadores', [['Ampliarla a otros países', { presupuesto: -4, prestigio: 4 }], ['Solo nacional', { presupuesto: 2 }]]],
      ] },
    agent: { n: 'Agente internacional', ic: '🤝', tipo: 'examen', votantes: 1, edad: 34, sueldo: 2500, semanasCampana: 5, mandato: 24,
      req: { rep: 50, marca: 35 }, evento: { cada: 4, n: 'Gran traspaso', ic: '💰', gana: 'Cierras un traspaso millonario', pierde: 'El traspaso se cae' },
      decisiones: [
        ['Dos clubes quieren a tu representado', [['El que paga más (más comisión)', { presupuesto: 8, aprobacion: -3 }], ['El que le da minutos', { aprobacion: 5, prestigio: 3 }]]],
        ['Un club ofrece una comisión «por debajo de la mesa»', [['Rechazar', { prestigio: 5 }], ['Aceptar', { presupuesto: 9, polemica: 10 }]]],
        ['Renovar o salir', [['Forzar la salida', { presupuesto: 6, aprobacion: -4, polemica: 4 }], ['Renovar tranquilo', { aprobacion: 3 }]]],
        ['Fichar a un joven prometedor', [['Sí, aunque cueste', { presupuesto: -4, prestigio: 4 }], ['No', { aprobacion: 0 }]]],
      ] },
    referee: { n: 'Árbitro/a internacional', ic: '🟨', tipo: 'examen', votantes: 1, edad: 32, sueldo: 2800, semanasCampana: 6, mandato: 22,
      req: { rep: 45, temporadas: 3 }, evento: { cada: 3, n: 'Partido internacional', ic: '🟨', gana: 'Arbitraje impecable: buena nota del comité', pierde: 'Un error grave en una jugada clave' },
      decisiones: [
        ['Penalti dudoso en el último minuto', [['Pitarlo', { prestigio: 2, polemica: 4 }], ['Revisarlo en el vídeo', { prestigio: 4, aprobacion: 2 }], ['Dejar seguir', { polemica: 2, aprobacion: -1 }]]],
        ['Un capitán te protesta a gritos', [['Tarjeta', { prestigio: 3, polemica: 2 }], ['Hablar y calmarlo', { aprobacion: 3 }]]],
        ['Preparación física', [['Más horas de gimnasio', { prestigio: 3 }], ['Lo justo', { aprobacion: 1, prestigio: -1 }]]],
        ['Un periodista te pide una entrevista', [['Concederla', { polemica: 3, aprobacion: 2 }], ['No hablar', { prestigio: 2 }]]],
      ] },
    media_personality: { n: 'Comentarista / periodista estrella', ic: '🎙️', tipo: 'casting', votantes: 1, edad: 30, sueldo: 3200, semanasCampana: 4, mandato: 24,
      req: { marca: 45, rep: 40 }, evento: { cada: 4, n: 'Audiencia del mes', ic: '📈', gana: 'Récord de audiencia', pierde: 'La audiencia cae' },
      decisiones: [
        ['Exclusiva jugosa sin confirmar', [['Contarla ya', { polemica: 8, aprobacion: 3 }], ['Confirmarla antes', { prestigio: 5 }]]],
        ['Te ofrecen comentar la gran final', [['Sí, a tope', { prestigio: 5, aprobacion: 4 }], ['Que vaya otro', { aprobacion: -2 }]]],
        ['Tono del programa', [['Rigor y análisis', { prestigio: 4, aprobacion: -1 }], ['Espectáculo y humor', { aprobacion: 5, polemica: 3 }]]],
        ['Un antiguo compañero te critica', [['Contestar en directo', { polemica: 6, aprobacion: 2 }], ['Ignorarlo', { prestigio: 2 }]]],
      ] },
    world_sports_committee: { n: 'Presidente/a del Comité Mundial del Deporte', ic: '🌍', tipo: 'eleccion', votantes: 100, edad: 52, sueldo: 12000, semanasCampana: 9, mandato: 26,
      bloques: ['Europa', 'América', 'Asia', 'África', 'Oceanía'], req: { rep: 85, marca: 50, deportes: 2, institucional: true, patrimonio: 250000 },
      decisiones: [
        ['Sede de los próximos Juegos', [['Una gran ciudad con todo hecho', { presupuesto: 6, aprobacion: 2 }], ['Un país que nunca los ha tenido', { prestigio: 8, presupuesto: -6, polemica: 3 }]]],
        ['Nuevos deportes en los Juegos', [['Escalada, skate y surf para siempre', { aprobacion: 5, prestigio: 3 }], ['Volver a los clásicos', { aprobacion: -4 }]]],
        ['Lucha contra el dopaje', [['Controles más duros y caros', { prestigio: 7, presupuesto: -6 }], ['Seguir igual', { polemica: 4 }]]],
        ['Derechos de televisión', [['Una plataforma mundial', { presupuesto: 10, aprobacion: -3 }], ['Cadenas públicas de cada país', { aprobacion: 6, presupuesto: -2 }]]],
        ['Igualdad', [['Mismo número de deportistas hombres y mujeres', { prestigio: 7, aprobacion: 3 }], ['Poco a poco', { aprobacion: -1 }]]],
      ] },
  };
  // Cargos que cuentan como experiencia institucional (para los más altos)
  const INSTITUCIONALES = ['league_president', 'national_federation', 'world_football_president', 'world_climbing_president', 'world_basket_president', 'world_tennis_president', 'national_coach', 'sporting_director'];
  const ACC_TIPO = {
    eleccion: { prReunion: ['🤝', 'Reunirte con un bloque de votantes'], prPrograma: ['📜', 'Trabajar tu programa'], prMedios: ['📣', 'Entrevistas y redes'], prGira: ['✈️', 'Gira de campaña (5.000 €)'], prAlianza: ['🫱🏻‍🫲🏼', 'Pactar con un rival menor'] },
    nombramiento: { prReunion: ['🗣️', 'Entrevista con la directiva'], prPrograma: ['📜', 'Preparar tu proyecto'], prMedios: ['📣', 'Hacerte ver en los medios'], prGira: ['✈️', 'Viajar a ver equipos (2.000 €)'], prAlianza: ['🫱🏻‍🫲🏼', 'Buscar avales'] },
    examen: { prReunion: ['📚', 'Estudiar el reglamento'], prPrograma: ['🏃', 'Preparación física y práctica'], prMedios: ['🧑‍🏫', 'Clases con un mentor'], prGira: ['✈️', 'Curso internacional (2.000 €)'], prAlianza: ['📝', 'Simulacro de examen'] },
    casting: { prReunion: ['🎙️', 'Grabar una maqueta'], prPrograma: ['📜', 'Preparar tu sección'], prMedios: ['📣', 'Hacer ruido en redes'], prGira: ['✈️', 'Ir a castings en la capital (1.500 €)'], prAlianza: ['🫱🏻‍🫲🏼', 'Que te recomiende alguien'] },
  };
  const ACC_CARGO = { prGestion: ['🗂️', 'Gestionar (presupuesto y equipo)'], prComunicacion: ['📣', 'Comunicar y escuchar'], prViaje: ['✈️', 'Viaje institucional'], prReforma: ['⚡', 'Impulsar una gran reforma'] };
  // Las acciones Prestige (en la fase «retirado»): se registran como acciones del juego
  for (const id of new Set(Object.values(ACC_TIPO).flatMap(o => Object.keys(o)).concat(Object.keys(ACC_CARGO)))) {
    P2.ACCIONES[id] = { ic: '🎖️', n: id, fases: ['retirado'], energiaMin: 10, energia: -12, prestige: true, ventaja: '', coste: '−12 energía', riesgo: '' };
  }
  for (const id of ['descansar', 'prensa', 'gestionar']) if (P2.ACCIONES[id] && !P2.ACCIONES[id].fases.includes('retirado')) P2.ACCIONES[id].fases.push('retirado');

  const pr = s => (s.prestige && typeof s.prestige === 'object' ? s.prestige : (s.prestige = { activa: null, c: {}, historial: [] }));
  const estadoDe = (s, id) => (pr(s).c[id] || {}).estado || null;
  const fueInstitucional = s => pr(s).historial.some(h => INSTITUCIONALES.includes(h.id) && h.mandatos > 0) || INSTITUCIONALES.some(id => ['OFFICE', 'REELECTION'].includes(estadoDe(s, id))) || !!s.fuePresidenteClub;
  const deportesCuenta = () => Object.values(P2.DEPORTES || {}).filter(D => D.entitlement && P2.tieneEnt(D.entitlement)).length;
  function requisitos(s, id) {
    const C = CARRERAS[id], q = C.req, l = [];
    const add = (ok, t) => l.push({ ok: !!ok, t });
    if (q.deporte) add((s.deporte || 'futbol') === q.deporte, `Una carrera de ${(P2.DEPORTES[q.deporte] || {}).n || q.deporte}`);
    if (q.rep) add(s.p.rep >= q.rep, `Reputación ${q.rep} (tienes ${Math.round(s.p.rep)})`);
    if (q.marca) add((s.p.marca || 0) >= q.marca, `Marca personal ${q.marca} (tienes ${Math.round(s.p.marca || 0)})`);
    if (q.temporadas) add((s.temporadasJugadas || []).length >= q.temporadas, `${q.temporadas} temporadas (llevas ${(s.temporadasJugadas || []).length})`);
    if (q.trofeos) add((s.trofeos || []).length >= q.trofeos, `${q.trofeos} ${q.trofeos === 1 ? 'título' : 'títulos'} (tienes ${(s.trofeos || []).length})`);
    if (q.deportes) add(deportesCuenta() >= q.deportes, `${q.deportes} deportes en tu cuenta`);
    if (q.patrimonio) add(P2.patrimonio(s) >= q.patrimonio, `Patrimonio de ${eur(q.patrimonio)}`);
    if (q.institucional) add(fueInstitucional(s), 'Experiencia institucional (presidir un club, la liga o la federación, o un cargo deportivo)');
    return l;
  }
  const tieneCarrera = id => P2.tieneEnt(`prestige.${id}`);
  // Estados como en el servidor: LOCKED → PURCHASED/NOT_ELIGIBLE/ELIGIBLE → CANDIDATE → CAMPAIGN → ELECTION → OFFICE → REELECTION → FORMER
  function estado(s, id) {
    if (!tieneCarrera(id)) return 'LOCKED';
    const e = estadoDe(s, id); if (e) return e;
    return requisitos(s, id).every(x => x.ok) ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
  }
  // Retirarte del deporte (también sin Prestige): se acaba el contrato; tu imperio sigue
  function retirarse(s, R, motivo) {
    if (s.fase === 'retirado') return 'Ya estás retirado/a.';
    const O = s.contrato && P2.OFERTAS[s.contrato.oferta];
    s.fase = 'retirado'; s.contrato = null; s.temporada = null; s.invitacion = null; s.patros = []; s.retiradoEn = s.semana;
    P2.anotar(s, '👋', `Me retiro${O ? ` (último club: ${O.n})` : ''}${motivo ? `: ${motivo}` : ''}.`);
    R && R.lineas.push(['👋', `Te retiras del deporte. ${motivo || 'Tu imperio sigue: empresas, inversiones y lo que venga.'}`]);
    return null;
  }
  function candidatura(s, id, R) {
    if (estado(s, id) !== 'ELIGIBLE') return 'Todavía no cumples los requisitos.';
    const P = pr(s); if (P.activa) return 'Ya estás con otra carrera Prestige.';
    const C = CARRERAS[id];
    if (s.fase !== 'retirado') retirarse(s, R, 'para presentarte a un cargo');
    const anos = Math.max(0, C.edad - s.edad); if (anos) { s.edad += anos; P2.anotar(s, '⏳', `Pasan ${anos} años: ya tengo ${s.edad}.`); }
    const rival = Math.round(42 + rnd(s) * 12 + (C.tipo === 'eleccion' ? 4 : 0));
    P.c[id] = { estado: 'CAMPAIGN', apoyo: Math.round(18 + s.p.rep / 6 + (s.p.marca || 0) / 10), rival, credibilidad: 1, semanas: 0, bloques: (C.bloques || []).map(() => 40), aprobacion: 50, presupuesto: 50, prestigio: 50, polemica: 0, mandatos: 0, cargoSemanas: 0, logros: [], promesas: 0 };
    P.activa = id;
    R && R.lineas.push([C.ic, `Presentas tu candidatura: ${C.n}. ${anos ? `Han pasado ${anos} años.` : ''} Empieza la campaña (${C.semanasCampana} semanas).`, 'bien']);
    P2.anotar(s, C.ic, `Me presento: ${C.n}.`);
    return null;
  }
  // ---------- Acciones de la semana ----------
  function accionPrestige(s, id, R) {
    const P = pr(s), cid = P.activa, C = CARRERAS[cid], X = cid && P.c[cid]; const L = R.lineas, W = R.porque;
    if (!X) { L.push(['🎖️', 'No tienes ninguna carrera Prestige en marcha.']); return; }
    const marca = s.p.marca || 0, rep = s.p.rep;
    if (X.estado === 'CAMPAIGN') {
      let g = 0, t = '';
      const base = 1.5 + rep / 40;
      if (id === 'prReunion') { const i = Math.floor(rnd(s) * Math.max(1, X.bloques.length)); g = base * 1.6 * X.credibilidad + rnd(s) * 2; if (X.bloques.length) X.bloques[i] = Math.min(95, X.bloques[i] + g * 2); t = C.tipo === 'eleccion' ? `Te reúnes con ${C.bloques[i] || 'los votantes'}` : (ACC_TIPO[C.tipo][id] || [])[1]; }
      else if (id === 'prPrograma') { X.credibilidad = r1(Math.min(1.8, X.credibilidad + 0.15)); g = base * 0.6; t = 'Tu programa gana solidez (más credibilidad para todo lo demás)'; }
      else if (id === 'prMedios') { g = (marca / 15 + rnd(s) * 3) * X.credibilidad; if (rnd(s) < 0.12) { g = -3; X.polemica += 5; t = 'Una frase sacada de contexto te persigue en redes'; } else t = 'Los medios hablan de ti'; P2.sumarMarca(s, 0.5); }
      else if (id === 'prGira') { const c = C.tipo === 'eleccion' ? 5000 : C.tipo === 'casting' ? 1500 : 2000; if (s.p.dinero < c) { L.push(['✈️', `No llegas al dinero del viaje (${eur(c)}).`, 'mal']); return; } s.p.dinero -= c; s.acum.gastos += c; g = base * 2.2 * X.credibilidad; t = 'Viajas y convences en persona'; }
      else if (id === 'prAlianza') { g = 4 + rnd(s) * 4; X.promesas++; t = C.tipo === 'eleccion' ? 'Pactas apoyos a cambio de promesas (te costarán en el cargo)' : 'Consigues un aval de peso'; }
      g = r1(g); X.apoyo = r1(clamp(X.apoyo + g, 0, 100));
      L.push([C.ic, `${t}: ${C.tipo === 'eleccion' ? 'apoyo' : 'preparación'} ${g >= 0 ? '+' : ''}${nf(g)} (${Math.round(X.apoyo)}).`, g >= 0 ? 'bien' : 'mal']);
      W.push(`El rival está en ${Math.round(X.rival)}. ${C.tipo === 'eleccion' ? 'Ganas la votación si tu apoyo supera al suyo (con algo de azar).' : C.tipo === 'examen' ? 'Para aprobar hace falta 60 (con algo de azar el día del examen).' : 'Te eligen si superas al otro candidato.'}`);
      return;
    }
    if (X.estado === 'OFFICE') {
      if (id === 'prGestion') { X.presupuesto = r1(clamp(X.presupuesto + 3 + rnd(s) * 2, 0, 100)); L.push(['🗂️', `Ordenas las cuentas y el equipo: presupuesto ${Math.round(X.presupuesto)}.`]); }
      else if (id === 'prComunicacion') { X.aprobacion = r1(clamp(X.aprobacion + 2.2 + marca / 50, 0, 100)); X.polemica = Math.max(0, X.polemica - 3); L.push(['📣', `Escuchas y explicas tus decisiones: aprobación ${Math.round(X.aprobacion)}.`]); }
      else if (id === 'prViaje') { X.prestigio = r1(clamp(X.prestigio + 4, 0, 100)); s.p.energia = clamp(s.p.energia - 10, 0, 100); L.push(['✈️', `Viaje institucional: prestigio ${Math.round(X.prestigio)} (te cansa).`]); }
      else if (id === 'prReforma') { const ok = rnd(s) < 0.4 + X.aprobacion / 200; X.prestigio = r1(clamp(X.prestigio + (ok ? 9 : -2), 0, 100)); X.aprobacion = r1(clamp(X.aprobacion + (ok ? 2 : -7), 0, 100)); L.push(['⚡', ok ? 'Tu reforma sale adelante: gran paso.' : 'La reforma encalla: te la tumban.', ok ? 'bien' : 'mal']); }
      else L.push(['🎖️', 'Semana en el cargo.']);
    }
  }
  // ---------- Cada semana ----------
  function semanaPrestige(s, R) {
    const P = pr(s), id = P.activa; if (!id) return;
    const C = CARRERAS[id], X = P.c[id]; if (!X || !tieneCarrera(id)) return;   // sin la compra (reembolso): congelada
    if (X.estado === 'CAMPAIGN') {
      X.semanas++;
      X.rival = r1(clamp(X.rival + 0.6 + rnd(s) * 1.4, 0, 100));   // el rival también hace campaña
      if (X.semanas >= C.semanasCampana) resolverCampana(s, id, R);
      return;
    }
    if (X.estado === 'OFFICE') {
      X.cargoSemanas++;
      s.p.dinero += C.sueldo; s.acum.trabajo += C.sueldo; R.ingresos.push([`Sueldo: ${C.n}`, C.sueldo]);
      X.aprobacion = r1(clamp(X.aprobacion - 0.8 - X.polemica * 0.06 - (X.promesas ? 0.3 * X.promesas : 0) - (X.presupuesto < 25 ? 1.5 : 0), 0, 100)); X.polemica = Math.max(0, X.polemica - 0.5);
      X.presupuesto = r1(clamp(X.presupuesto - 1.2, 0, 100)); X.prestigio = r1(clamp(X.prestigio - 0.4, 0, 100));
      if (X.cargoSemanas % 3 === 0) P2.encolar(s, { tipo: 'prestigeDecision', id, k: Math.floor(X.cargoSemanas / 3) % C.decisiones.length });
      if (rnd(s) < 0.07) P2.encolar(s, { tipo: 'prestigeCrisis', id });
      if (C.evento && X.cargoSemanas % C.evento.cada === 0) eventoCargo(s, id, R);
      if (X.aprobacion < 15) { finCargo(s, id, R, 'dimision'); return; }
      if (X.cargoSemanas >= C.mandato) finMandato(s, id, R);
      return;
    }
    if (X.estado === 'REELECTION') { X.semanas++; X.rival = r1(clamp(X.rival + 1, 0, 100)); if (X.semanas >= 3) resolverCampana(s, id, R, true); }
  }
  function resolverCampana(s, id, R, reeleccion) {
    const C = CARRERAS[id], X = pr(s).c[id];
    const mio = reeleccion ? (X.aprobacion * 0.7 + X.prestigio * 0.3) : X.apoyo;
    let gana;
    if (C.tipo === 'examen') gana = mio + (rnd(s) - 0.5) * 16 >= 60;
    else { const p = clamp(0.5 + (mio - X.rival) / 30, 0.04, 0.96); gana = rnd(s) < p; }
    if (C.tipo === 'eleccion') {
      const votos = Math.round(C.votantes * clamp(0.5 + (mio - X.rival) / 60 + (gana ? 0.02 : -0.02), 0.08, 0.92));
      X.ultimaVotacion = { votos, de: C.votantes, gana: votos > C.votantes / 2 };
      gana = X.ultimaVotacion.gana;
      R.lineas.push([gana ? '🗳️' : '😞', `Votación: ${votos} de ${C.votantes} votos.`, gana ? 'bien' : 'mal']);
    }
    if (gana) {
      X.estado = 'OFFICE'; X.cargoSemanas = 0; X.mandatos++; X.semanas = 0;
      if (!reeleccion) { X.aprobacion = Math.round(48 + X.apoyo / 5); X.presupuesto = 50; X.prestigio = Math.round(45 + s.p.rep / 5); }
      R.grandes = (R.grandes || []).concat({ ic: C.ic, titulo: reeleccion ? `¡REELEGIDO/A! ${C.n}` : `¡LO CONSIGUES! ${C.n}`, bien: true, texto: `Mandato de ${C.mandato} semanas. Sueldo: ${eur(C.sueldo)}/semana. Ahora toca gobernar.` });
      P2.celebrar(s, { tipo: 'titulo', n: C.n, ic: C.ic, dinero: 0 });
      P2.anotar(s, C.ic, `${reeleccion ? 'Reelegido/a' : 'Elegido/a'}: ${C.n}.`);
    } else {
      if (reeleccion) { finCargo(s, id, R, 'derrota'); return; }
      X.estado = 'FORMER'; X.derrotas = (X.derrotas || 0) + 1; pr(s).activa = null;
      pr(s).historial.push({ id, mandatos: 0, resultado: 'derrota', semana: s.semana });
      R.grandes = (R.grandes || []).concat({ ic: '😞', titulo: `No sale: ${C.n}`, bien: false, texto: C.tipo === 'examen' ? 'No apruebas esta vez. Puedes volver a intentarlo.' : 'Otro candidato se lleva el puesto. Puedes volver a presentarte.' });
      P2.anotar(s, '😞', `Pierdo: ${C.n}.`);
    }
  }
  function eventoCargo(s, id, R) {
    const C = CARRERAS[id], X = pr(s).c[id], E = C.evento;
    const ok = rnd(s) < clamp(0.25 + X.prestigio / 160 + X.aprobacion / 300, 0.1, 0.85);
    X.prestigio = r1(clamp(X.prestigio + (ok ? 5 : -4), 0, 100)); X.aprobacion = r1(clamp(X.aprobacion + (ok ? 4 : -5), 0, 100));
    if (ok) { X.logros.push({ n: E.gana, semana: s.semana }); if (id === 'agent') { const c = Math.round(20000 + X.prestigio * 400); s.p.dinero += c; s.acum.primas += c; R.ingresos.push(['Comisión del traspaso', c]); } }
    R.lineas.push([ok ? E.ic : '😖', `${E.n}: ${ok ? E.gana : E.pierde}.`, ok ? 'bien' : 'mal']);
  }
  function finMandato(s, id, R) {
    const C = CARRERAS[id], X = pr(s).c[id];
    R.lineas.push([C.ic, `Termina tu mandato: aprobación ${Math.round(X.aprobacion)}, prestigio ${Math.round(X.prestigio)}.`]);
    if (C.tipo === 'eleccion') { X.estado = 'REELECTION'; X.semanas = 0; X.rival = Math.round(45 + rnd(s) * 15); R.lineas.push(['🗳️', 'Hay elecciones: 3 semanas de campaña para la reelección.']); return; }
    if (X.aprobacion >= 55) { X.mandatos++; X.cargoSemanas = 0; R.grandes = (R.grandes || []).concat({ ic: C.ic, titulo: 'Te renuevan', bien: true, texto: `Otro mandato como ${C.n.toLowerCase()}.` }); return; }
    finCargo(s, id, R, 'fin');
  }
  function finCargo(s, id, R, motivo) {
    const C = CARRERAS[id], X = pr(s).c[id]; X.estado = 'FORMER'; pr(s).activa = null;
    pr(s).historial.push({ id, mandatos: X.mandatos, resultado: motivo, semana: s.semana, logros: X.logros.length });
    const t = { dimision: 'La presión puede contigo: dimites (aprobación por los suelos).', derrota: 'Pierdes la reelección.', fin: 'No te renuevan: se acaba tu etapa.', voluntario: 'Lo dejas por voluntad propia.' }[motivo];
    R && R.lineas.push(['🎖️', `${C.n}: ${t} Queda en tu historia: ${X.mandatos} ${X.mandatos === 1 ? 'mandato' : 'mandatos'}.`, motivo === 'voluntario' || motivo === 'fin' ? '' : 'mal']);
    P2.anotar(s, '🎖️', `Fin de etapa: ${C.n} (${X.mandatos} ${X.mandatos === 1 ? 'mandato' : 'mandatos'}).`);
  }
  function dejarCargo(s, R) { const id = pr(s).activa; if (!id) return 'No tienes cargo.'; const X = pr(s).c[id]; if (X.estado === 'CAMPAIGN') { X.estado = 'FORMER'; pr(s).activa = null; pr(s).historial.push({ id, mandatos: 0, resultado: 'retirada', semana: s.semana }); return null; } finCargo(s, id, R, 'voluntario'); return null; }
  // Volver a presentarse después de perder
  function reintentar(s, id) { const X = pr(s).c[id]; if (!X || X.estado !== 'FORMER' || pr(s).activa) return 'Ahora no.'; delete pr(s).c[id]; return null; }

  // ---------- Decisiones del cargo y crisis ----------
  function aplicarEf(X, e) { for (const k of ['aprobacion', 'presupuesto', 'prestigio']) if (e[k]) X[k] = r1(clamp(X[k] + e[k], 0, 100)); if (e.polemica) X.polemica = Math.max(0, X.polemica + e.polemica); }
  const efTxt = e => Object.entries(e).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${{ aprobacion: 'aprobación', presupuesto: 'presupuesto', prestigio: 'prestigio', polemica: 'polémica' }[k]}`).join(', ');
  P2.DECISIONES.prestigeDecision = {
    vista(s, ev) {
      const C = CARRERAS[ev.id], D = C && C.decisiones[ev.k]; if (!D) return { ic: '🎖️', titulo: 'Decisión', texto: '', ops: [{ id: '0', n: 'Seguir', ventaja: '', coste: '', riesgo: '' }] };
      return { ic: C.ic, titulo: D[0], texto: `${C.n}: te toca decidir.`, ops: D[1].map(([n, e], i) => ({ id: String(i), n, ventaja: efTxt(Object.fromEntries(Object.entries(e).filter(([k, v]) => (k === 'polemica' ? v < 0 : v > 0)))) || '—', coste: efTxt(Object.fromEntries(Object.entries(e).filter(([k, v]) => (k === 'polemica' ? v > 0 : v < 0)))) || 'Nada', riesgo: '' })) };
    },
    resolver(s, ev, op, R) { const C = CARRERAS[ev.id], X = pr(s).c[ev.id], D = C.decisiones[ev.k], o = D && D[1][+op]; if (!o || !X) return { ic: '🎖️', titulo: '', texto: '' }; aplicarEf(X, o[1]); return { ic: C.ic, titulo: D[0], texto: `Decides: ${o[0].toLowerCase()}.` }; },
  };
  const CRISIS = [
    ['Escándalo en tu equipo', 'Un colaborador cercano aparece en un escándalo.', [['Cesarlo de inmediato', { aprobacion: 3, prestigio: 1 }], ['Defenderlo', { polemica: 8, aprobacion: -4 }]]],
    ['Fuga de documentos internos', 'Un medio publica correos internos.', [['Dar la cara y explicarlo todo', { aprobacion: 2, polemica: -2 }], ['Negarlo todo', { polemica: 7, prestigio: -3 }]]],
    ['Recorte del presupuesto', 'Bajan los ingresos de este año.', [['Recortar tu propio sueldo y gastos', { aprobacion: 5, presupuesto: 3 }], ['Recortar ayudas', { presupuesto: 5, aprobacion: -5 }]]],
    ['Boicot de un grupo de votantes', 'Un bloque amenaza con no apoyarte.', [['Negociar', { aprobacion: 3, presupuesto: -3 }], ['Plantarte', { prestigio: 2, aprobacion: -4 }]]],
  ];
  P2.DECISIONES.prestigeCrisis = {
    vista(s, ev) { const k = ev.k == null ? (ev.k = Math.floor(rnd(s) * CRISIS.length)) : ev.k, X = CRISIS[k], C = CARRERAS[ev.id];
      return { ic: '🔥', titulo: `Crisis: ${X[0]}`, texto: `${C ? C.n + ': ' : ''}${X[1]}`, ops: X[2].map(([n, e], i) => ({ id: String(i), n, ventaja: efTxt(Object.fromEntries(Object.entries(e).filter(([kk, v]) => (kk === 'polemica' ? v < 0 : v > 0)))) || '—', coste: efTxt(Object.fromEntries(Object.entries(e).filter(([kk, v]) => (kk === 'polemica' ? v > 0 : v < 0)))) || 'Nada', riesgo: '' })) }; },
    resolver(s, ev, op, R) { const X = pr(s).c[ev.id], Cr = CRISIS[ev.k || 0], o = Cr && Cr[2][+op]; if (X && o) aplicarEf(X, o[1]); return { ic: '🔥', titulo: Cr ? Cr[0] : 'Crisis', texto: o ? `Decides: ${o[0].toLowerCase()}.` : '' }; },
  };
  // Nombres de las acciones según la fase de tu carrera Prestige (la interfaz las enseña así)
  function accionesPrestige(s) {
    const P = pr(s), id = P.activa; if (!id) return [];
    const C = CARRERAS[id], X = P.c[id];
    const M = X.estado === 'CAMPAIGN' ? ACC_TIPO[C.tipo] : X.estado === 'OFFICE' ? ACC_CARGO : {};
    return Object.entries(M).map(([aid, [ic, n]]) => ({ id: aid, ic, n }));
  }
  // Presidir tu propio club cuenta como experiencia institucional
  const _sc = P2.semanaExpansiones;
  if (_sc) P2.semanaExpansiones = (s, R) => { _sc(s, R); if (s.club && s.club.pct >= 51) s.fuePresidenteClub = true; semanaPrestige(s, R); };

  // Sección «Prestige» (grupo Carrera): con alguna carrera Prestige en la cuenta, o retirado/a
  P2.SECCIONES.splice(P2.SECCIONES.findIndex(x => x.id === 'marcas') + 1, 0, { id: 'prestige', ic: '🎖️', n: 'Prestige', grupo: 'carrera', cond: s => s.fase === 'retirado' || Object.keys(CARRERAS).some(tieneCarrera), d: 'Carreras de cargo: presidencias, selección, arbitraje, agencia y medios.' });
  Object.assign(P2, { CARRERAS_PRESTIGE: CARRERAS, INSTITUCIONALES, ACC_TIPO, ACC_CARGO, prestige: pr, requisitosPrestige: requisitos, estadoPrestige: estado, tieneCarrera, retirarse, candidatura, accionPrestige, semanaPrestige, accionesPrestige, dejarCargo, reintentar, fueInstitucional });
})(globalThis.P2 = globalThis.P2 || {});
