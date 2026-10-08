/* =====================================================================
   00b · DEPORTES: el mismo juego (vida, negocios, marcas, packs, cuenta) con otro deporte.
   El fútbol es la base (gratis). Escalada, tenis, basket, skate y surf son expansiones: cada una trae
   sus categorías, rivales, clubes u equipos, ofertas, acciones, competiciones, minijuegos, material y
   vocabulario, y su formato de resultado:
     goles (fútbol) · puntos (basket) · sets (tenis) · circuito (escalada, skate, surf: competiciones con
     muchos participantes; puntúa tu puesto).
   activarDeporte(id) cambia los datos del juego EN SITIO (mismos objetos que usan todos los módulos).
   Cada partida guarda su deporte (s.deporte); jugarSemana, cargar y pintar lo activan antes de nada.
   Nada de esto da ventaja: un deporte de pago es otro juego, con su propio equilibrio.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG } = P2;

  // ---------- Nombres ficticios ----------
  const NOMBRES = ['Nora', 'Leo', 'Iris', 'Dani', 'Mara', 'Hugo', 'Alba', 'Teo', 'Vega', 'Unai', 'Lía', 'Bruno', 'Sara', 'Marco', 'Ainhoa', 'Pau', 'Noa', 'Gael', 'Irene', 'Rubén',
    'Carla', 'Íker', 'Julia', 'Saúl', 'Elsa', 'Adrián', 'Lucía', 'Oier', 'Martina', 'Álex', 'Paula', 'Nil'];
  const APELLIDOS = ['Vidal', 'Marín', 'Ortega', 'Soler', 'Navas', 'Prieto', 'Campos', 'Rey', 'Lozano', 'Ibarra', 'Fuentes', 'Cano', 'Roldán', 'Pons', 'Varela', 'Montes',
    'Esteve', 'Aranda', 'Blasco', 'Quintana', 'Robles', 'Salas', 'Gil', 'Mora', 'Peña', 'Duarte', 'Llorente', 'Bravo', 'Cortés', 'Lara', 'Ferrer', 'Iglesias'];
  const persona = (k, i) => `${NOMBRES[(i * 7 + k * 3) % NOMBRES.length]} ${APELLIDOS[(i * 5 + k * 11) % APELLIDOS.length]}`;

  // Estructura común de categorías (mismos ids y fuerzas que el fútbol: el equilibrio ya está probado)
  const BASE_LIGAS = {
    primera: ['leones', 'altamar', 'realVega', 'fortaleza', 'nautico', 'pinares', 'olimpia', 'marisma'],
    segunda: ['atletico', 'costa', 'bahia', 'sierra', 'valle', 'murallas', 'delta', 'cumbre'],
    tercera: ['puerto', 'atleticoB', 'faro', 'salinas', 'olivar', 'ribera', 'montes', 'arenal'],
    regional: ['sanroque', 'pinar', 'molino', 'lagos', 'cerro', 'vega', 'torre', 'brisas'],
  };
  const NUCLEO = { leones: 'Leones', altamar: 'Altamar', realVega: 'Real Vega', fortaleza: 'Fortaleza', nautico: 'Náutico', pinares: 'Pinares', olimpia: 'Olimpia', marisma: 'Marisma',
    atletico: 'Atlético Ciudad', costa: 'Real Costa', bahia: 'Bahía', sierra: 'Sierra', valle: 'Valle', murallas: 'Murallas', delta: 'Delta', cumbre: 'Cumbre',
    puerto: 'Puerto', atleticoB: 'Atlético Ciudad B', faro: 'Faro', salinas: 'Salinas', olivar: 'Olivar', ribera: 'Ribera', montes: 'Montes', arenal: 'Arenal',
    sanroque: 'San Roque', pinar: 'Pinar', molino: 'Molino', lagos: 'Lagos', cerro: 'Cerro', vega: 'Vega', torre: 'Torre', brisas: 'Brisas' };
  // Club de cada deportista (circuito): el equipo con el que compite
  const EQUIPO_DE = { puerto: 'Puerto', atleticoB: 'Atlético Ciudad', atletico: 'Atlético Ciudad', costa: 'Costa', sanroque: 'San Roque' };

  // Categorías de un deporte: nombres de categoría + cómo se llama cada participante
  function ligasDe(cats, nombre) {
    const out = {};
    let k = 0;
    for (const [id, ids] of Object.entries(BASE_LIGAS)) {
      const C = cats[id];
      out[id] = { n: C[0], corto: C[1], equipos: ids.map((e, i) => ({ id: e, n: nombre(e, i, k) })) };
      k++;
    }
    return out;
  }
  const deportistas = k0 => (e, i, k) => (EQUIPO_DE[e] ? `${persona(k0 + k, i)} (${EQUIPO_DE[e]})` : persona(k0 + k, i));

  // ---------- Los deportes ----------
  // V: vocabulario · re: cómo se dice en este deporte lo que el juego base dice en fútbol (se aplica al pintar)
  const DEPORTES = {
    futbol: { id: 'futbol', n: 'Fútbol', ic: '⚽', color: '#22a35a', entitlement: null, formato: 'goles', individual: false,
      d: 'De la plaza del barrio a Primera Federación. Gratis.',
      V: { stat: 'gol', stats: 'goles', statIc: '⚽', competicion: 'partido', competiciones: 'partidos', lugar: 'la plaza', entrenador: 'el míster' } },

    escalada: { penTxt: ['¡Perfecto! Subes dos puestos en la final, +12 de confianza y más fama', 'Subes un puesto en la final, +8 de confianza y más fama', 'Desastre: te caes y bajas dos puestos, −18 de confianza', 'Te caes en el último movimiento: bajas un puesto, −12 de confianza'], emojis: { '🥅': '🪨', '🧤': '✋', '👟': '🩰' },
      id: 'escalada', n: 'Escalada', ic: '🧗', color: '#0ea5e9', entitlement: 'sport.climbing', formato: 'circuito', individual: true,
      d: 'Del rocódromo del barrio al circuito internacional: bloque, dificultad y velocidad, y proyectos en roca.',
      V: { stat: 'podio', stats: 'podios', statIc: '🥇', competicion: 'competición', competiciones: 'competiciones', lugar: 'el rocódromo', entrenador: 'tu entrenadora' },
      especialidades: [['bloque', 'Bloque', '🪨', 'Movimientos cortos y explosivos: tops y zonas.'], ['dificultad', 'Dificultad', '🧗', 'Vías largas: llegar lo más alto posible.'], ['velocidad', 'Velocidad', '⏱️', 'Quince metros contra el reloj.']],
      condiciones: ['bloque', 'dificultad', 'velocidad'],
      ligas: ligasDe({ regional: ['Liga de rocódromos', 'Rocódromos'], tercera: ['Circuito autonómico', 'Autonómico'], segunda: ['Circuito nacional', 'Nacional'], primera: ['Circuito internacional', 'Internacional'] }, deportistas(1)),
      ofertas: {
        puerto: ['Club Escalada Puerto', '⚓', 'Beca y competición rápida'], atleticoFormacion: ['Centro de Tecnificación · formación', '🔴', 'Plan de formación'],
        atleticoFilial: ['Centro de Tecnificación · competición', '🔴', 'Grupo de competición'], sanroque: ['Rocódromo San Roque', '🟢', 'Club del barrio'],
        atleticoPrimero: ['Centro de Alto Rendimiento', '🔴', 'Subes al alto rendimiento'], costaReal: ['Costa Climbing Team', '🌊', 'Team de marca'], academiaElite: ['Academia de élite', '⭐', 'Oportunidad excepcional'] },
      acciones: {
        plaza: ['🧗', 'Bloque con los amigos en el rocódromo', 'Reputación en el rocódromo (cada vez menos)'],
        entrenar: ['💪', 'Entrenar fuerza de dedos', 'Sube tu nivel'],
        trabajar: ['🧽', 'Trabajar en el rocódromo (limpiar presas)', '+130 €'],
        jornada: ['📋', 'Jornada de tecnificación', 'Si tu nivel convence (≈50), te invitan a las pruebas'],
        torneo: ['🏆', 'Open del rocódromo', 'Si ganas: mucha reputación e invitación directa'],
        campus: ['🎓', 'Campus de escalada', 'Nivel +3 y la coordinadora te propone para las pruebas'],
        prensa: ['📸', 'Fotos y vídeos para redes', 'Marca personal (atractivo para patrocinadores y clientes)'],
      },
      extraAcciones: {
        roca: { ic: '🪨', n: 'Proyecto en roca', fases: ['barrio', 'pruebas', 'amateur', 'club'], energiaMin: 30, energia: -25, gasto: 60,
          ventaja: 'Encadenar un grado nuevo: reputación y marca', coste: '60 € de viaje y −25 energía', riesgo: 'Puede no salir (y piel rota)' },
      },
      competiciones: { copa: ['🏆', 'Campeonato de España'], europa: ['⭐', 'Copa de Europa'], mundial: ['🌍', 'Campeonato del Mundo'], liga: 'Circuito internacional' },
      momentos: { penalti: ['🧗', 'Último bloque', 'Final: te queda el último bloque y el podio está en juego.'], promocion: ['⬆️', 'Superfinal', 'Te juegas la categoría en una superfinal.'], prueba: ['📋', 'Pruebas de tecnificación', 'La seleccionadora te mira escalar.'], torneo: ['🏆', 'Final del open', 'La final del open del rocódromo.'] },
      juegos: { toques: ['🧗', 'Chapar', 'Chapa la cuerda cada vez que la cinta pase por tu mano.'], pase: ['✋', 'Lanzamiento', 'La presa buena aparece un instante: lánzate antes de que se esconda.'], barra: ['🎯', 'Dinámico', 'Para la barra en la zona verde para coger el canto.'],
        memoria: ['🧠', 'Leer la vía', 'Mira la secuencia de movimientos y repítela.'], portero: ['🪨', 'Aguantar el péndulo', 'Te balanceas: compensa hacia el lado correcto antes de caer.'], penalti: ['🧗', 'El último movimiento', 'Elige la presa y lánzate en el momento justo.'] },
      material: { botas: ['🩰', 'Pies de gato buenos', 'Gomas que agarran: entrenas un poco mejor.'], botasPro: ['🧗', 'Pies de gato de competición', 'Precisión en cada pie.'] },
      re: [['el míster', 'tu entrenadora'], ['del míster', 'de tu entrenadora'], ['al míster', 'a tu entrenadora'], ['míster', 'entrenadora'], ['el once', 'la final'], ['del once', 'de la final'],
        ['Partido en la plaza', 'Bloque en el rocódromo'], ['la plaza', 'el rocódromo'], ['futbolista', 'escalador/a'], ['el fútbol', 'la escalada'], ['del fútbol', 'de la escalada'], ['al fútbol', 'a la escalada'], ['fútbol', 'escalada'], ['estadio', 'rocódromo'], ['penalti', 'último bloque']],
    },

    tenis: { penTxt: ['¡Perfecto! Te llevas el set decisivo, +12 de confianza y más fama', 'Ganas el punto: si ibas perdiendo el set decisivo, le das la vuelta. +8 de confianza', 'Desastre: se te escapa el partido, −18 de confianza', 'Pierdes el punto: si ibas ganando el set decisivo, se te escapa. −12 de confianza'], emojis: { '🥅': '🎾', '🧤': '🎾', '👟': '🎾' },
      id: 'tenis', n: 'Tenis', ic: '🎾', color: '#d4a017', entitlement: 'sport.tennis', formato: 'sets', individual: true,
      d: 'Ranking, superficies y viajes: de la pista municipal al circuito internacional.',
      V: { stat: 'ace', stats: 'aces', statIc: '🎾', competicion: 'partido', competiciones: 'partidos', lugar: 'la pista municipal', entrenador: 'tu entrenador' },
      especialidades: [['tierra', 'Tierra batida', '🟫', 'Peloteo largo y paciencia.'], ['dura', 'Pista dura', '🟦', 'El tenis más completo.'], ['hierba', 'Hierba', '🟩', 'Saque y volea.']],
      condiciones: ['tierra', 'dura', 'hierba', 'dura'],
      ligas: ligasDe({ regional: ['Torneos de club', 'Club'], tercera: ['Circuito autonómico', 'Autonómico'], segunda: ['Circuito nacional', 'Nacional'], primera: ['Circuito internacional', 'Internacional'] }, deportistas(2)),
      ofertas: {
        puerto: ['Club de Tenis Puerto', '⚓', 'Beca y partidos'], atleticoFormacion: ['Academia Atlético · formación', '🔴', 'Plan de formación'],
        atleticoFilial: ['Academia Atlético · competición', '🔴', 'Grupo de competición'], sanroque: ['Club de Tenis San Roque', '🟢', 'Club del barrio'],
        atleticoPrimero: ['Academia de Alto Rendimiento', '🔴', 'Subes al alto rendimiento'], costaReal: ['Costa Tennis Team', '🌊', 'Team de marca'], academiaElite: ['Academia de élite', '⭐', 'Oportunidad excepcional'] },
      acciones: {
        plaza: ['🎾', 'Peloteo en la pista municipal', 'Reputación en el club (cada vez menos)'],
        entrenar: ['🎾', 'Máquina de bolas y físico', 'Sube tu nivel'],
        trabajar: ['🧽', 'Recoger bolas y dar clases a niños', '+130 €'],
        jornada: ['📋', 'Jornada de captación de la academia', 'Si tu nivel convence (≈50), te invitan a las pruebas'],
        torneo: ['🏆', 'Torneo del club', 'Si ganas: mucha reputación e invitación directa'],
        campus: ['🎓', 'Campus de tenis', 'Nivel +3 y el director te propone para las pruebas'],
      },
      extraAcciones: {
        superficie: { ic: '🟫', n: 'Entrenar la superficie', fases: ['barrio', 'pruebas', 'amateur', 'club'], energiaMin: 30, energia: -20,
          ventaja: 'Mejoras en la superficie de la próxima semana', coste: '−20 energía', riesgo: 'No subes el nivel general' },
      },
      competiciones: { copa: ['🏆', 'Campeonato de España'], europa: ['⭐', 'Masters europeo'], mundial: ['🌍', 'Copa del Mundo por países'], liga: 'Circuito internacional' },
      momentos: { penalti: ['🎾', 'Punto de break', 'Tie-break del set decisivo: un punto lo cambia todo.'], promocion: ['⬆️', 'Fase previa', 'Te juegas la categoría en la previa.'], prueba: ['📋', 'Pruebas de la academia', 'El director te mira jugar.'], torneo: ['🏆', 'Final del torneo', 'La final del torneo del club.'] },
      juegos: { toques: ['🎾', 'Peloteo', 'Devuelve cuando la bola llegue a tu raqueta. Cinco golpes sin fallar.'], pase: ['👟', 'Dejada', 'El rival se aleja un instante: toca la dejada antes de que vuelva.'], barra: ['🎯', 'Saque', 'Para la barra en la zona verde. Tres saques.'],
        memoria: ['🧠', 'Plan de juego', 'Mira la táctica que te marca tu entrenador y repítela.'], portero: ['🧱', 'Resto imposible', 'Te sacan fuerte: muévete al lado de la bola.'], penalti: ['🎾', 'Ace', 'Elige dónde y saca en el momento justo.'] },
      material: { botas: ['🎾', 'Raqueta buena', 'Encordado nuevo: entrenas un poco mejor.'], botasPro: ['🎾', 'Raqueta de competición', 'Hecha a tu medida.'] },
      re: [['el míster', 'tu entrenador'], ['del míster', 'de tu entrenador'], ['al míster', 'a tu entrenador'], ['míster', 'entrenador'], ['el once', 'el cuadro final'], ['del once', 'del cuadro final'],
        ['Partido en la plaza', 'Peloteo en la pista'], ['la plaza', 'la pista municipal'], ['futbolista', 'tenista'], ['fútbol', 'tenis'], ['estadio', 'pista central'], ['penalti', 'punto de break'],
        ['goles', 'aces'], ['gol', 'ace'], ['TITULAR', 'EN EL CUADRO PRINCIPAL'], ['Titular', 'Cuadro principal'], ['titular', 'en el cuadro principal'], ['banquillo', 'fuera del cuadro'], ['suplente', 'desde la previa'], ['empate', 'partido igualado']],
    },

    basket: { penTxt: ['¡Perfecto! +3 puntos para tu equipo, +12 de confianza y más fama', '+2 puntos para tu equipo, +8 de confianza y más fama', 'Desastre: los fallas y el rival anota un triple, −18 de confianza', 'Los fallas y el rival anota en la contra: −12 de confianza'], emojis: { '🥅': '🗑️', '🧤': '🖐️', '👟': '👟' },
      id: 'basket', n: 'Basket', ic: '🏀', color: '#f97316', entitlement: 'sport.basketball', formato: 'puntos', individual: false,
      d: 'Minutos, rol, playoffs y estadísticas: de la cancha del barrio a la primera nacional.',
      V: { stat: 'punto', stats: 'puntos', statIc: '🏀', competicion: 'partido', competiciones: 'partidos', lugar: 'la cancha', entrenador: 'el entrenador' },
      especialidades: [['base', 'Base', '🧠', 'Diriges: asistencias.'], ['alero', 'Alero', '🎯', 'Anotas: puntos.'], ['pivot', 'Pívot', '💪', 'Bajo el aro: rebotes.']],
      ligas: ligasDe({ regional: ['Liga autonómica', 'Autonómica'], tercera: ['Liga Nacional Plata', 'Nac. Plata'], segunda: ['Liga Nacional Oro', 'Nac. Oro'], primera: ['Primera Nacional', 'Primera Nac.'] },
        e => (e === 'atleticoB' ? 'Atlético Ciudad Basket B' : e === 'atletico' ? 'Atlético Ciudad Basket' : e === 'costa' ? 'Real Costa Basket' : `CB ${NUCLEO[e]}`)),
      ofertas: {
        puerto: ['CB Puerto', '⚓', 'Dinero más rápido'], atleticoFormacion: ['Atlético Ciudad Basket B', '🔴', 'Contrato de formación'], atleticoFilial: ['Atlético Ciudad Basket B', '🔴', 'Ficha del filial'],
        sanroque: ['CB San Roque', '🟢', 'Equipo amateur'], atleticoPrimero: ['Atlético Ciudad Basket (primer equipo)', '🔴', 'Subes al primer equipo'], costaReal: ['Real Costa Basket', '🌊', 'Club de categoría superior'], academiaElite: ['Academia de élite', '⭐', 'Oportunidad excepcional'] },
      acciones: {
        plaza: ['🏀', 'Pachanga 3x3 en la cancha', 'Reputación en la cancha (cada vez menos)'],
        entrenar: ['🏋️', 'Tiro y físico', 'Sube tu nivel'],
        jornada: ['📋', 'Jornada abierta del Atlético Basket', 'Si tu nivel convence (≈50), te invitan a las pruebas'],
        torneo: ['🏆', 'Torneo 3x3', 'Si ganas: mucha reputación e invitación directa'],
        campus: ['🎓', 'Campus de baloncesto', 'Nivel +3 y el coordinador te propone para las pruebas'],
      },
      extraAcciones: {
        tiro: { ic: '🎯', n: 'Sesión de tiro', fases: ['amateur', 'club'], energiaMin: 25, energia: -12,
          ventaja: 'Tu acierto sube: más puntos en los partidos', coste: '−12 energía antes del partido', riesgo: 'No subes el nivel general' },
      },
      competiciones: { copa: ['🏆', 'Copa'], europa: ['⭐', 'Copa de Europa'], mundial: ['🌍', 'Mundial con la selección'], liga: 'Primera Nacional' },
      momentos: { penalti: ['🏀', 'Tiros libres decisivos', 'Último segundo, dos tiros libres. Todo el pabellón en silencio.'], promocion: ['⬆️', 'Playoff', 'Te juegas la categoría en el playoff.'], prueba: ['📋', 'Pruebas', 'Los ojeadores te miran.'], torneo: ['🏆', 'Final del 3x3', 'La final del torneo 3x3.'] },
      juegos: { toques: ['🏀', 'Bote', 'Bota cuando el balón suba a tu mano. Cinco botes sin perderlo.'], pase: ['🤾', 'Pase al hueco', 'Un compañero se libera un instante: pásale antes de que lo tapen.'], barra: ['🎯', 'Triple', 'Para la barra en la zona verde. Tres tiros.'],
        memoria: ['🧠', 'Jugada de pizarra', 'Mira la jugada que dibuja el entrenador y repítela.'], portero: ['🖐️', 'Tapón', 'Te atacan el aro: salta al lado correcto.'], penalti: ['🏀', 'Tiro libre', 'Apunta y lanza en el momento justo.'] },
      material: { botas: ['👟', 'Zapatillas de basket', 'Agarre y amortiguación: entrenas un poco mejor.'], botasPro: ['👟', 'Zapatillas de competición', 'Las de los profesionales.'] },
      re: [['el míster', 'el entrenador'], ['del míster', 'del entrenador'], ['al míster', 'al entrenador'], ['míster', 'entrenador'], ['el once', 'el quinteto inicial'], ['del once', 'del quinteto inicial'],
        ['Partido en la plaza', 'Pachanga en la cancha'], ['la plaza', 'la cancha'], ['futbolista', 'jugador/a de basket'], ['fútbol', 'basket'], ['estadio', 'pabellón'], ['penalti', 'tiro libre'], ['Penalti', 'Tiro libre'],
        ['goles', 'puntos'], ['un gol', 'una canasta'], ['gol', 'canasta'], ['promoción', 'playoff'], ['Promoción', 'Playoff']],
    },

    skate: { penTxt: ['¡Perfecto! Subes dos puestos en la final, +12 de confianza y más fama', 'Clavas el truco: subes un puesto, +8 de confianza', 'Desastre: caída fea y bajas dos puestos, −18 de confianza', 'No lo clavas: bajas un puesto, −12 de confianza'], emojis: { '🥅': '🛹', '🧤': '🛹', '👟': '🛹' },
      id: 'skate', n: 'Skate', ic: '🛹', color: '#a855f7', entitlement: 'sport.skate', formato: 'circuito', individual: true,
      d: 'Reputación callejera, partes de vídeo y contests: del skatepark al circuito internacional.',
      V: { stat: 'podio', stats: 'podios', statIc: '🥇', competicion: 'contest', competiciones: 'contests', lugar: 'el skatepark', entrenador: 'tu team manager' },
      especialidades: [['street', 'Street', '🏙️', 'Escaleras, barandillas y bordillos.'], ['park', 'Park', '🌀', 'Bowls y rampas: velocidad y aire.']],
      condiciones: ['street', 'park'],
      ligas: ligasDe({ regional: ['Contests del barrio', 'Barrio'], tercera: ['Liga autonómica', 'Autonómica'], segunda: ['Circuito nacional', 'Nacional'], primera: ['Pro Tour internacional', 'Pro Tour'] }, deportistas(3)),
      ofertas: {
        puerto: ['Puerto Skate Shop (team)', '⚓', 'Material y algo de dinero'], atleticoFormacion: ['Atlético Skate · formación', '🔴', 'Programa de formación'], atleticoFilial: ['Atlético Skate · team', '🔴', 'Team de competición'],
        sanroque: ['Skatepark San Roque', '🟢', 'La crew del barrio'], atleticoPrimero: ['Atlético Pro Team', '🔴', 'Subes al pro team'], costaReal: ['Costa Skateboards', '🌊', 'Team de marca'], academiaElite: ['Academia de élite', '⭐', 'Oportunidad excepcional'] },
      acciones: {
        plaza: ['🛹', 'Sesión en el skatepark', 'Reputación callejera (cada vez menos)'],
        entrenar: ['🛹', 'Practicar trucos nuevos', 'Sube tu nivel'],
        trabajar: ['🛵', 'Trabajar en la skateshop', '+130 €'],
        jornada: ['📋', 'Demo abierta del team', 'Si tu nivel convence (≈50), te invitan a las pruebas'],
        torneo: ['🏆', 'Contest local', 'Si ganas: mucha reputación e invitación directa'],
        campus: ['🎓', 'Campamento de skate', 'Nivel +3 y el team manager te propone para las pruebas'],
        prensa: ['🎥', 'Grabar una parte de vídeo', 'Marca personal y estilo'],
      },
      extraAcciones: {
        calle: { ic: '🏙️', n: 'Patinar la calle', fases: ['barrio', 'pruebas', 'amateur', 'club'], energiaMin: 25, energia: -20,
          ventaja: 'Reputación callejera y estilo', coste: '−20 energía', riesgo: 'Caídas y algún vigilante' },
      },
      competiciones: { copa: ['🏆', 'Campeonato de España'], europa: ['⭐', 'Euro Contest'], mundial: ['🌍', 'Mundial'], liga: 'Pro Tour' },
      momentos: { penalti: ['🛹', 'Último truco', 'Final: un truco más y el podio es tuyo.'], promocion: ['⬆️', 'Superfinal', 'Te juegas la categoría en la superfinal.'], prueba: ['📋', 'Pruebas del team', 'El team manager te mira patinar.'], torneo: ['🏆', 'Final del contest', 'La final del contest local.'] },
      juegos: { toques: ['🛹', 'Ollies', 'Salta cuando el bordillo llegue a tus pies. Cinco seguidos.'], pase: ['🌀', 'Línea', 'Se abre un hueco en el park: entra antes de que se cierre.'], barra: ['🎯', 'Flip', 'Para la barra en la zona verde para clavar el truco.'],
        memoria: ['🧠', 'Combo', 'Mira la línea de trucos y repítela.'], portero: ['⚖️', 'Equilibrio', 'Corrige hacia el lado correcto antes de caer.'], penalti: ['🛹', 'El truco final', 'Elige el obstáculo y lánzate en el momento justo.'] },
      material: { botas: ['🛹', 'Tabla buena', 'Ejes y ruedas nuevas: entrenas un poco mejor.'], botasPro: ['🛹', 'Tabla de competición', 'Montada a tu gusto.'] },
      re: [['el míster', 'tu team manager'], ['del míster', 'de tu team manager'], ['al míster', 'a tu team manager'], ['míster', 'team manager'], ['el once', 'la final'], ['del once', 'de la final'],
        ['Partido en la plaza', 'Sesión en el skatepark'], ['la plaza', 'el skatepark'], ['futbolista', 'skater'], ['fútbol', 'skate'], ['estadio', 'skatepark'], ['penalti', 'último truco']],
    },

    surf: { penTxt: ['¡Perfecto! Subes dos puestos en la final, +12 de confianza y más fama', 'Buena ola: subes un puesto, +8 de confianza', 'Desastre: te come la ola y bajas dos puestos, −18 de confianza', 'Te caes en la ola: bajas un puesto, −12 de confianza'], emojis: { '🥅': '🌊', '🧤': '🌊', '👟': '🏄' },
      id: 'surf', n: 'Surf', ic: '🏄', color: '#06b6d4', entitlement: 'sport.surf', formato: 'circuito', individual: true,
      d: 'Olas, condiciones, viajes y tablas: de la playa del barrio al circuito mundial.',
      V: { stat: 'podio', stats: 'podios', statIc: '🥇', competicion: 'campeonato', competiciones: 'campeonatos', lugar: 'la playa', entrenador: 'tu entrenador' },
      especialidades: [['longboard', 'Longboard', '🌊', 'Olas pequeñas y estilo.'], ['shortboard', 'Shortboard', '🏄', 'Maniobras en olas buenas.'], ['grandes', 'Olas grandes', '🌋', 'Cuando el mar se pone serio.']],
      condiciones: ['pequenas', 'buenas', 'grandes'],
      ligas: ligasDe({ regional: ['Campeonatos locales', 'Locales'], tercera: ['Circuito autonómico', 'Autonómico'], segunda: ['Circuito nacional', 'Nacional'], primera: ['Circuito mundial', 'Mundial'] }, deportistas(4)),
      ofertas: {
        puerto: ['Club de Surf Puerto', '⚓', 'Beca y campeonatos'], atleticoFormacion: ['Escuela Atlético · formación', '🔴', 'Plan de formación'], atleticoFilial: ['Escuela Atlético · competición', '🔴', 'Grupo de competición'],
        sanroque: ['Surf Club San Roque', '🟢', 'Club de la playa'], atleticoPrimero: ['Equipo de Alto Rendimiento', '🔴', 'Subes al alto rendimiento'], costaReal: ['Costa Surfboards Team', '🌊', 'Team de marca'], academiaElite: ['Academia de élite', '⭐', 'Oportunidad excepcional'] },
      acciones: {
        plaza: ['🏄', 'Surfear en la playa del barrio', 'Reputación en la playa (cada vez menos)'],
        entrenar: ['🏊', 'Remar y entrenar en seco', 'Sube tu nivel'],
        trabajar: ['🏖️', 'Trabajar en la escuela de surf', '+130 €'],
        jornada: ['📋', 'Día de selección de la escuela', 'Si tu nivel convence (≈50), te invitan a las pruebas'],
        torneo: ['🏆', 'Campeonato de la playa', 'Si ganas: mucha reputación e invitación directa'],
        campus: ['🎓', 'Surf camp', 'Nivel +3 y el entrenador te propone para las pruebas'],
        prensa: ['🎥', 'Subir clips de tus olas', 'Marca personal (atractivo para patrocinadores y clientes)'],
      },
      extraAcciones: {
        viajeSurf: { ic: '✈️', n: 'Viaje de surf', fases: ['barrio', 'pruebas', 'amateur', 'club'], energiaMin: 30, energia: -20, gasto: 250,
          ventaja: 'Olas de calidad: nivel, reputación y marca', coste: '250 € y −20 energía', riesgo: 'Si no entra el swell, poco premio' },
      },
      competiciones: { copa: ['🏆', 'Campeonato de España'], europa: ['⭐', 'Campeonato de Europa'], mundial: ['🌍', 'Mundial'], liga: 'Circuito mundial' },
      momentos: { penalti: ['🌊', 'Última ola', 'Final: te falta una ola para el podio y queda un minuto.'], promocion: ['⬆️', 'Repesca', 'Te juegas la categoría en la repesca.'], prueba: ['📋', 'Selección de la escuela', 'El entrenador te mira surfear.'], torneo: ['🏆', 'Final del campeonato', 'La final del campeonato de la playa.'] },
      juegos: { toques: ['🌊', 'Remada', 'Rema cuando llegue la ola. Cinco remadas a tiempo.'], pase: ['🏄', 'Coger la ola', 'La ola rompe un instante: entra antes de que se cierre.'], barra: ['🎯', 'Maniobra', 'Para la barra en la zona verde para clavar el giro.'],
        memoria: ['🧠', 'Leer el mar', 'Mira la serie de olas y repite cuál coger.'], portero: ['🌀', 'Equilibrio en el tubo', 'Corrige hacia el lado correcto antes de que cierre.'], penalti: ['🌊', 'La última ola', 'Elige la ola y ponte de pie en el momento justo.'] },
      material: { botas: ['🏄', 'Tabla buena', 'Una tabla a tu medida: entrenas un poco mejor.'], botasPro: ['🏄', 'Tabla de competición', 'Shapeada para ti.'] },
      re: [['el míster', 'tu entrenador'], ['del míster', 'de tu entrenador'], ['al míster', 'a tu entrenador'], ['míster', 'entrenador'], ['el once', 'la final'], ['del once', 'de la final'],
        ['Partido en la plaza', 'Olas en la playa'], ['la plaza', 'la playa'], ['futbolista', 'surfista'], ['fútbol', 'surf'], ['estadio', 'playa'], ['penalti', 'última ola']],
    },
  };
  // Lo que cambia en los deportes de circuito y en los individuales (además de su lista propia)
  const RE_CIRCUITO = [['TITULAR', 'FINALISTA'], ['el partido', 'la competición'], ['del partido', 'de la competición'], ['al partido', 'a la competición'], ['un partido', 'una competición'], ['los partidos', 'las competiciones'],
    ['partidos', 'competiciones'], ['partido', 'competición'], ['Titular', 'Finalista'], ['titulares', 'finalistas'], ['de titular', 'en la final'], ['titular', 'finalista'], ['suplente', 'semifinalista'],
    ['banquillo', 'fuera de la final'], ['marcas un gol', 'logras un podio'], ['un gol', 'un podio'], ['goles', 'podios'], ['gol', 'podio'], ['empate', 'resultado discreto'], ['jornada', 'prueba'], ['Jornada', 'Prueba'],
    ['la liga', 'el circuito'], ['liga', 'circuito'], ['vestuario', 'equipo']];
  const RE_INDIVIDUAL = [['Vais', 'Vas'], ['vais', 'vas'], ['Estáis', 'Estás'], ['estáis', 'estás'], ['ganáis', 'ganas'], ['perdéis', 'pierdes'], ['os saca', 'te saca'], ['os mete', 'te mete'], ['os acerca', 'te acerca'],
    ['Acabáis', 'Acabas'], ['acabáis', 'acabas'], ['en casa del', 'contra'], ['superáis', 'superas'], ['Ganáis', 'Ganas'], ['Perdéis', 'Pierdes'], ['la ganáis', 'la ganas'], ['la perdéis', 'la pierdes'], ['Campeones', 'Campeón/a'], ['Subcampeones', 'Subcampeón/a'], ['CAMPEONES', 'CAMPEÓN/A'], ['eliminados', 'eliminado/a'], ['Clasificados', 'Clasificado/a'], ['jugáis', 'juegas'], ['os salváis', 'te salvas'], ['os quedáis', 'te quedas'], ['Subís', 'Subes'], ['Bajáis', 'Bajas'], ['seguís', 'sigues'], ['llegáis', 'llegas'], ['Os', 'Te'], ['vuestra', 'tu'], ['Subimos', 'Subes'], ['Bajamos', 'Bajas'], ['Tu equipo', 'Tú'], ['tu equipo', 'tu club']];
  for (const D of Object.values(DEPORTES)) {
    if (D.id === 'futbol') continue;
    const l = (D.re || []).concat(D.formato === 'circuito' ? RE_CIRCUITO : [], D.individual ? RE_INDIVIDUAL : []);
    const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Una sola pasada (lo ya cambiado no se vuelve a cambiar); mayúscula inicial respetada
    const pares = []; for (const [a, b] of l) { pares.push([a, b]); const A = a[0].toUpperCase() + a.slice(1), B = b[0].toUpperCase() + b.slice(1); if (A !== a && !l.some(([x]) => x === A)) pares.push([A, B]); }
    pares.sort((x, y) => y[0].length - x[0].length);
    const mapa = new Map(pares);
    D.reAll = new RegExp(`(?<![\\wáéíóúñü])(${pares.map(([a]) => esc(a)).join('|')})(?![\\wáéíóúñü])`, 'g');
    D.reMapa = mapa;
  }

  // ---------- Activar un deporte (cambia los datos EN SITIO) ----------
  const copia = x => JSON.parse(JSON.stringify(x));
  let BASE = null;
  function base() {
    if (BASE) return BASE;
    BASE = { LIGAS: copia(P2.LIGAS), OFERTAS: copia(P2.OFERTAS), ACCIONES: copia(P2.ACCIONES), liga: copia(CFG.liga) };
    return BASE;
  }
  // Los módulos que cargan después (copas, minijuegos, tienda) guardan su versión de fútbol la primera vez
  function baseTardia(k, obj) { const B = base(); if (!B[k] && obj) B[k] = copia(obj); return B[k]; }
  const reemplazar = (dst, src) => { for (const k of Object.keys(dst)) delete dst[k]; Object.assign(dst, copia(src)); };

  function activarDeporte(id) {
    const D = DEPORTES[id] || DEPORTES.futbol;
    if (P2.deporteActivo === D.id && !activarDeporte.forzar) return D;
    const B = base();
    reemplazar(P2.LIGAS, B.LIGAS); reemplazar(P2.OFERTAS, B.OFERTAS); reemplazar(P2.ACCIONES, B.ACCIONES); reemplazar(CFG.liga, B.liga);
    const BC = baseTardia('COMPETICIONES', P2.COMPETICIONES), BJ = baseTardia('JUEGOS', P2.JUEGOS), BM = baseTardia('MINIJUEGOS', P2.MINIJUEGOS);
    if (BC) reemplazar(P2.COMPETICIONES, BC); if (BJ) reemplazar(P2.JUEGOS, BJ); if (BM) reemplazar(P2.MINIJUEGOS, BM);
    const BP = P2.PRODUCTOS ? baseTardia('PRODUCTOS', P2.PRODUCTOS.filter(p => p.cat === 'equipamiento')) : null;
    if (BP) for (const p of BP) { const x = P2.PRODUCTOS.find(q => q.id === p.id); if (x) Object.assign(x, copia(p)); }
    if (D.id !== 'futbol') {
      for (const [lid, L] of Object.entries(D.ligas)) Object.assign(P2.LIGAS[lid], { n: L.n, corto: L.corto, equipos: P2.LIGAS[lid].equipos.map(e => Object.assign({}, e, { n: (L.equipos.find(x => x.id === e.id) || e).n }, D.individual ? { filialDe: undefined } : {})) });
      for (const [oid, [n, ic, lema]] of Object.entries(D.ofertas)) if (P2.OFERTAS[oid]) Object.assign(P2.OFERTAS[oid], { n, ic, lema });
      for (const [aid, [ic, n, ventaja]] of Object.entries(D.acciones || {})) if (P2.ACCIONES[aid]) Object.assign(P2.ACCIONES[aid], { ic, n }, ventaja ? { ventaja } : {});
      for (const [aid, A] of Object.entries(D.extraAcciones || {})) P2.ACCIONES[aid] = copia(A);
      if (D.formato === 'puntos') Object.assign(CFG.liga, { ptsV: 2, ptsE: 1 });   // en basket no hay empates
      if (D.formato === 'sets') Object.assign(CFG.liga, { ptsV: 2, ptsE: 1 });
      if (D.formato === 'circuito') Object.assign(CFG.liga, { localia: 0 });
      if (P2.COMPETICIONES) for (const [cid, [ic, n]] of Object.entries(D.competiciones)) if (P2.COMPETICIONES[cid] && Array.isArray(D.competiciones[cid])) Object.assign(P2.COMPETICIONES[cid], { ic, n });
      if (P2.MINIJUEGOS) for (const [mid, [ic, n, d]] of Object.entries(D.momentos || {})) if (P2.MINIJUEGOS[mid]) Object.assign(P2.MINIJUEGOS[mid], { ic, n, d });
      if (P2.JUEGOS) for (const [jid, [ic, n, d]] of Object.entries(D.juegos || {})) if (P2.JUEGOS[jid]) Object.assign(P2.JUEGOS[jid], { ic, n, d });
      if (P2.PRODUCTOS) for (const [pid, [ic, n, d]] of Object.entries(D.material || {})) { const x = P2.PRODUCTOS.find(q => q.id === pid); if (x) Object.assign(x, { ic, n, d }); }
    }
    P2.deporteActivo = D.id;
    return D;
  }
  const deporteDe = s => DEPORTES[(s && s.deporte) || 'futbol'] || DEPORTES.futbol;
  const V = s => Object.assign({}, DEPORTES.futbol.V, deporteDe(s).V);
  // Cómo se dice en este deporte un texto escrito para el fútbol (solo texto visible)
  function tx(s, t) {
    const D = deporteDe(s); if (!D.reAll || typeof t !== 'string') return t;
    let x = t.replace(D.reAll, m => D.reMapa.get(m) || m).replace(/⚽/g, D.ic);
    for (const [a, b] of Object.entries(D.emojis || {})) if (x.includes(a)) x = x.split(a).join(b);
    return x;
  }
  // ¿Puede esta cuenta jugar este deporte? (el fútbol siempre)
  const deporteDisponible = id => { const D = DEPORTES[id]; return !!D && (!D.entitlement || P2.tieneEnt(D.entitlement)); };
  // Condición de la prueba de esta semana (disciplina, superficie, modalidad, olas): determinista por partida y semana
  function condicion(s, T, j) {
    const D = deporteDe(s); if (!D.condiciones) return null;
    const l = D.condiciones;
    if (D.id === 'surf') { let h = 2166136261; for (const ch of `${s.seed}|${T.num}|${j}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return l[(h >>> 0) % l.length]; }
    return l[j % l.length];
  }
  const NOMBRE_COND = { bloque: '🪨 Bloque', dificultad: '🧗 Dificultad', velocidad: '⏱️ Velocidad', tierra: '🟫 Tierra batida', dura: '🟦 Pista dura', hierba: '🟩 Hierba', street: '🏙️ Street', park: '🌀 Park',
    pequenas: '🌊 Olas pequeñas', buenas: '🏄 Olas buenas', grandes: '🌋 Olas grandes' };
  // Ventaja por especialidad: +3 si la prueba es la tuya; en surf, cada tabla tiene su ola
  function bonusEspecialidad(s, cond) {
    const D = deporteDe(s); if (!cond || !s.especialidad) return 0;
    if (D.id === 'surf') return ({ longboard: 'pequenas', shortboard: 'buenas', grandes: 'grandes' }[s.especialidad] === cond ? 3 : 0) + (s.superficies && s.superficies[cond] ? Math.min(2, s.superficies[cond]) : 0);
    return (s.especialidad === cond ? 3 : 0) + (s.superficies && s.superficies[cond] ? Math.min(2, s.superficies[cond]) : 0);
  }

  Object.assign(P2, { DEPORTES, activarDeporte, deporteDe, V, tx, deporteDisponible, condicion, NOMBRE_COND, bonusEspecialidad });
})(globalThis.P2 = globalThis.P2 || {});
