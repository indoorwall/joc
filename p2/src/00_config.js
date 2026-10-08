/* =====================================================================
   00 · CONFIGURACIÓN Y DATOS
   Todo lo que es «balance» o «contenido» vive aquí: clubes, ligas, acciones,
   patrocinadores, negocios, oportunidades e hitos. Añadir un club, un negocio
   o una marca nueva es añadir datos, no programar funciones nuevas.
   Importes de juego, provisionales.
   ===================================================================== */
(function (P2) {
  'use strict';

  const CFG = {
    saveVersion: 2,
    claveGuardado: 'del_barrio_al_negocio_p2',
    claveP1: 'del_barrio_al_negocio_p1_v5',
    deporte: 'futbol',

    inicio: { edad: 17, nivel: 40, energia: 80, rep: 4, dinero: 150, ciudad: 'Villamar' },

    energia: {
      max: 100,
      recuperacionBarrio: 10,     // lo que recuperas cada semana sin hacer nada especial
      recuperacionClub: 18,       // con fisios y descanso del club
      minTitular: 30,             // por debajo no aguantas 90 minutos
      minConvocado: 15,
    },

    // ---- Captación: 8 semanas para conseguir una prueba ----
    captacion: {
      semanas: 8,
      jornadasAbiertas: [4, 7],   // semanas con jornada abierta de un club
      torneo: [5],                // semana del torneo local
      repOjeador: 18,             // reputación con la que un ojeador te invita a las pruebas
      semanasPreparacion: 2,      // semanas entre la invitación y el día de las pruebas
    },

    // ---- Día de las pruebas (rangos de puntuación configurables) ----
    pruebas: {
      suerte: 4,                  // la suerte suma o resta hasta 4 puntos: no anula la preparación
      energia: [[70, 4], [50, 1], [30, -2], [0, -6]],
      repFactor: 0.2, repMax: 6,
      preparador: 3,              // sesión con preparador (cuesta dinero)
      viaBonus: { ojeador: 0, jornada: 1, torneo: 2, campus: 2, repesca: 0 },
      // Qué puertas se abren según la puntuación (de mayor a menor umbral)
      rangos: [
        { min: 62, ofertas: ['puerto', 'atleticoFilial'] },
        { min: 55, ofertas: ['puerto', 'atleticoFormacion'] },
        { min: 48, ofertas: ['puerto'] },
        { min: -99, ofertas: [] },  // sin contrato profesional: ruta amateur y repesca
      ],
      // Preparado en datos, apagado: oportunidad excepcional para puntuaciones muy altas
      excepcional: { activo: false, min: 70, oferta: 'academiaElite' },
    },

    amateur: { repescaCada: 6, sueldo: 40, trabajoMedio: 70 },

    club: {
      gastosVida: 55,             // gastos personales semanales siendo profesional
      impuesto: 0.12,             // retención sobre sueldo y primas
      confianzaInicial: 50,
      confianzaMinBanquillo: 35,  // en el banquillo la confianza baja, pero no por debajo de esto
      lesion: { base: 0.03, cansado: 0.12, umbralCansado: 30, semanas: [1, 3] },
      titularidadesHito: 3,
    },

    liga: { equipos: 8, ascenso: 2, descenso: 2, ptsV: 3, ptsE: 1, localia: 2.5 },

    patrocinio: { maxContratos: 2, faltasMax: 2 },

    empresa: {
      semanasRentable: 6,         // semanas seguidas con beneficio para el hito 7
      crisisSemanasNegativas: 3,
      valoracion: { semanasMedia: 6, multiplo: 26, porFama: 15, minimo: 1500 },
      prestamo: { importe: 3000, interesSemanal: 0.012, plazo: 40 },
      ventaUrgente: 0.7,
    },

    sucesos: { probSemana: 0.45, probEmpresa: 0.35 },
  };

  // ---- Ligas y equipos (ficticios). fuerza ≈ nivel medio del once ----
  const LIGAS = {
    tercera: {
      n: 'Tercera Federación · Grupo Costa', corto: 'Tercera Fed.', jornadas: 14,
      equipos: [
        { id: 'puerto', n: 'UD Puerto', fuerza: 52 },
        { id: 'atleticoB', n: 'Atlético Ciudad B', fuerza: 55 },
        { id: 'faro', n: 'CD Faro', fuerza: 53 },
        { id: 'salinas', n: 'Salinas CF', fuerza: 50 },
        { id: 'olivar', n: 'Olivar Deportivo', fuerza: 49 },
        { id: 'ribera', n: 'SD Ribera', fuerza: 51 },
        { id: 'montes', n: 'Montes United', fuerza: 47 },
        { id: 'arenal', n: 'Arenal CF', fuerza: 48 },
      ],
    },
    segunda: {
      n: 'Segunda Federación · Grupo Sur', corto: 'Segunda Fed.', jornadas: 14,
      equipos: [
        { id: 'atletico', n: 'Atlético Ciudad', fuerza: 63 },
        { id: 'costa', n: 'Real Costa', fuerza: 61 },
        { id: 'bahia', n: 'CF Bahía', fuerza: 60 },
        { id: 'sierra', n: 'UD Sierra', fuerza: 58 },
        { id: 'valle', n: 'Valle CF', fuerza: 59 },
        { id: 'murallas', n: 'SD Murallas', fuerza: 57 },
        { id: 'delta', n: 'Delta Atlético', fuerza: 56 },
        { id: 'cumbre', n: 'Cumbre FC', fuerza: 57 },
      ],
    },
    regional: {
      n: 'Regional Preferente', corto: 'Regional', jornadas: 14,
      equipos: [
        { id: 'sanroque', n: 'CD San Roque', fuerza: 42 },
        { id: 'pinar', n: 'Pinar CF', fuerza: 43 },
        { id: 'molino', n: 'UD Molino', fuerza: 41 },
        { id: 'lagos', n: 'Lagos Atlético', fuerza: 44 },
        { id: 'cerro', n: 'CF Cerro', fuerza: 40 },
        { id: 'vega', n: 'Vega Unida', fuerza: 42 },
        { id: 'torre', n: 'Torre CF', fuerza: 39 },
        { id: 'brisas', n: 'Brisas SD', fuerza: 43 },
      ],
    },
  };

  // ---- Ofertas de club: cada una es un camino distinto, no solo otro sueldo ----
  // minutos: ventaja para entrar en el once · entreno: multiplica lo que mejoras
  // exposicion: multiplica fama e interés de otros clubes · patroTier: marcas a las que llegas
  const OFERTAS = {
    puerto: {
      club: 'puerto', primaObjetivo: 800, liga: 'tercera', n: 'UD Puerto', ic: '⚓', lema: 'Dinero más rápido',
      sueldo: 250, prima: 1800, primaVictoria: 60, temporadas: 1,
      minutos: 6, entreno: 0.6, exposicion: 0.6, patroTier: 'local', objetivo: 'top4', techoNivel: 60,
      pros: ['Sueldo y prima de firma altos', 'Juegas casi seguro'], contras: ['Entrenas peor', 'Poca visibilidad: solo marcas locales', 'Techo bajo: pocas ofertas mejores'],
    },
    atleticoFormacion: {
      club: 'atleticoB', liga: 'tercera', n: 'Atlético Ciudad B', ic: '🔴', lema: 'Contrato de formación',
      sueldo: 90, prima: 0, primaVictoria: 40, temporadas: 2,
      minutos: -6, entreno: 1.4, exposicion: 1.4, patroTier: 'deportiva', objetivo: 'campeon', techoNivel: 80,
      pros: ['Entrenas mucho mejor', 'Te ven ojeadores y marcas deportivas', 'Puerta al primer equipo'], contras: ['Cobras poco', 'Cuesta ser titular'],
    },
    atleticoFilial: {
      club: 'atleticoB', liga: 'tercera', n: 'Atlético Ciudad B', ic: '🔴', lema: 'Ficha del filial',
      sueldo: 150, prima: 500, primaVictoria: 40, temporadas: 2,
      minutos: -2, entreno: 1.4, exposicion: 1.5, patroTier: 'deportiva', objetivo: 'campeon', techoNivel: 80,
      pros: ['Entrenas mucho mejor', 'Te ven ojeadores y marcas deportivas', 'Puerta al primer equipo'], contras: ['Cobras menos que en Puerto', 'Hay competencia por el puesto'],
    },
    sanroque: {
      club: 'sanroque', liga: 'regional', n: 'CD San Roque', ic: '🟢', lema: 'Equipo amateur',
      sueldo: 40, prima: 0, primaVictoria: 0, temporadas: 1, amateur: true,
      minutos: 10, entreno: 0.8, exposicion: 0.5, patroTier: null, objetivo: 'top4', techoNivel: 58,
      pros: ['Juegas siempre', 'Puedes trabajar a media jornada', 'Repesca cada 6 semanas'], contras: ['No es profesional', 'Casi no cobras'],
    },
    // Ofertas de fin de temporada (según rendimiento e interés)
    atleticoPrimero: {
      club: 'atletico', liga: 'segunda', n: 'Atlético Ciudad (primer equipo)', ic: '🔴', lema: 'Subes al primer equipo',
      sueldo: 520, prima: 3000, primaVictoria: 120, temporadas: 2, sube: true,
      minutos: -4, entreno: 1.5, exposicion: 2.2, patroTier: 'deportiva', objetivo: 'campeon', techoNivel: 85,
      pros: ['Gran salto de sueldo y prima', 'Máxima visibilidad'], contras: ['Competencia dura por el puesto'],
    },
    costaReal: {
      club: 'costa', liga: 'segunda', n: 'Real Costa', ic: '🌊', lema: 'Club de categoría superior',
      sueldo: 380, prima: 2000, primaVictoria: 80, temporadas: 2,
      minutos: 0, entreno: 1.0, exposicion: 1.1, patroTier: 'deportiva', objetivo: 'top4', techoNivel: 70,
      pros: ['Buen sueldo', 'Llegan marcas deportivas'], contras: ['Pierdes la cantera del Atlético'],
    },
    academiaElite: { club: 'atletico', liga: 'segunda', n: 'Academia de élite', ic: '⭐', lema: 'Oportunidad excepcional', sueldo: 300, prima: 4000, primaVictoria: 80, temporadas: 3, minutos: 0, entreno: 1.6, exposicion: 2, patroTier: 'deportiva', objetivo: 'campeon', techoNivel: 90, pros: [], contras: [] },
  };

  const OBJETIVOS = {
    descenso: { n: 'Evitar el descenso', corto: 'No bajar', cumple: pos => pos <= 6 },
    top4: { n: 'Quedar entre los 4 primeros', corto: 'Top 4', cumple: pos => pos <= 4 },
    campeon: { n: 'Luchar por el campeonato (top 2)', corto: 'Campeonato', cumple: pos => pos <= 2 },
  };

  // ---- Acciones de la semana (una por semana). efecto en 04_carrera ----
  // fase: en qué momento se pueden hacer · energiaMin: sin energía no se puede
  const ACCIONES = {
    plaza: { ic: '⚽', n: 'Partido en la plaza', fases: ['barrio', 'pruebas'], energiaMin: 25, energia: -20,
      ventaja: 'Fama en el barrio (cada vez menos)', coste: '−20 energía', riesgo: 'Repetirlo rinde menos' },
    entrenar: { ic: '🏃', n: 'Entrenar duro', fases: ['barrio', 'pruebas'], energiaMin: 30, energia: -25,
      ventaja: 'Sube tu nivel', coste: '−25 energía', riesgo: 'Nadie te ve entrenar' },
    trabajar: { ic: '🛵', n: 'Trabajar de repartidor', fases: ['barrio', 'pruebas'], energiaMin: 25, energia: -25, dinero: 130,
      ventaja: '+130 €', coste: '−25 energía', riesgo: 'Una semana menos para tu carrera' },
    descansar: { ic: '😴', n: 'Descansar', fases: ['barrio', 'pruebas', 'amateur', 'club'], energiaMin: 0, energia: 40,
      ventaja: '+40 energía', coste: 'No avanzas', riesgo: 'Ninguno' },
    jornada: { ic: '📋', n: 'Jornada abierta del Atlético', fases: ['barrio'], energiaMin: 40, energia: -25, soloSemanas: 'jornadasAbiertas',
      ventaja: 'Si tu nivel convence (≈50), te invitan a las pruebas', coste: '−25 energía', riesgo: 'Si no llegas, solo te llevas la experiencia' },
    torneo: { ic: '🏆', n: 'Torneo local', fases: ['barrio'], energiaMin: 50, energia: -35, gasto: 30, soloSemanas: 'torneo',
      ventaja: 'Si ganas: mucha fama e invitación directa', coste: '30 € y −35 energía', riesgo: 'Puedes caer pronto o lesionarte' },
    campus: { ic: '🎓', n: 'Campus de tecnificación', fases: ['barrio'], energiaMin: 30, energia: -20, gasto: 400, hastaSemana: 7,
      ventaja: 'Nivel +3 y el coordinador te propone para las pruebas', coste: '400 € y −20 energía', riesgo: 'Gastas tus ahorros' },
    preparador: { ic: '🧑‍🏫', n: 'Sesión con preparador', fases: ['pruebas'], energiaMin: 20, energia: -10, gasto: 150, unaVez: true, hito: 'prueba',
      ventaja: '+3 en las pruebas: conoces los ejercicios', coste: '150 €', riesgo: 'Ninguno' },
    // Siendo jugador (amateur o profesional): la semana tiene partido; esto es lo que haces además
    entrenoExtra: { ic: '🏋️', n: 'Entreno extra', fases: ['amateur', 'club'], energiaMin: 35, energia: -15,
      ventaja: 'Nivel y confianza del míster', coste: '−15 energía antes del partido', riesgo: 'Más riesgo de lesión' },
    mediaJornada: { ic: '🛵', n: 'Trabajo a media jornada', fases: ['amateur'], energiaMin: 30, energia: -15, dinero: 70,
      ventaja: '+70 €', coste: '−15 energía', riesgo: 'No mejoras' },
    prensa: { ic: '🎙️', n: 'Prensa y redes', fases: ['club'], energiaMin: 10, energia: -5,
      ventaja: 'Fama e interés de marcas', coste: 'No entrenas extra', riesgo: 'Al míster no le encanta (−1 confianza)' },
    gestionar: { ic: '💼', n: 'Pasar la semana en la empresa', fases: ['club', 'amateur'], energiaMin: 10, energia: -8, hito: 'empresa',
      ventaja: 'Tu negocio rinde más y resuelves problemas', coste: 'No entrenas extra (−2 confianza)', riesgo: 'Si el equipo va mal, se nota' },
  };

  // ---- Patrocinadores: contratos con requisitos, pago y obligaciones ----
  const MARCAS = [
    { id: 'panaderia', n: 'Panadería Ríos', ic: '🥖', tier: 'local', repMin: 10, prima: 150, semanal: 30, semanas: 14, actoCada: 4,
      obligacion: 'Una foto en la tienda cada 4 semanas' },
    { id: 'talleres', n: 'Talleres Costa', ic: '🔧', tier: 'local', repMin: 22, prima: 400, semanal: 60, semanas: 14, actoCada: 3,
      obligacion: 'Un acto comercial cada 3 semanas' },
    { id: 'kinetic', n: 'Kinetic Sport', ic: '👟', tier: 'deportiva', repMin: 28, titularidades: 3, prima: 1200, semanal: 120, semanas: 28, actoCada: 5,
      obligacion: 'Un evento cada 5 semanas y llevar sus botas', objetivo: { notaMedia: 6.3, bonus: 1000 } },
    { id: 'vertice', n: 'Vértice Energy', ic: '⚡', tier: 'deportiva', repMin: 45, titularidades: 6, prima: 2500, semanal: 200, semanas: 28, actoCada: 4,
      obligacion: 'Un evento cada 4 semanas', objetivo: { notaMedia: 6.6, bonus: 2000 } },
  ];
  const TIERS = { local: ['local'], deportiva: ['local', 'deportiva'] };

  // ---- Negocios (tipo de datos genérico; en P2 solo la peluquería) ----
  const NEGOCIOS = {
    peluqueria: {
      n: 'Peluquería', ic: '💈', traspaso: 4500, cajas: [600, 2000, 4500],
      demandaBase: 110, capacidadEmpleado: 55, empleadosMax: 4, alquiler: 450, fijos: 120, consumoCliente: 1.5,
      famaInicial: 40, historialVendedor: [60, 20, -30, 40, -10, 10],
      // Cómo la deja el antiguo dueño: mucha plantilla mal pagada y precios bajos. Hay que tomar decisiones desde el primer día
      configInicial: { precio: 'barato', sueldo: 'bajo', empleados: 3, marketing: 'nada' },
      precios: {
        barato: { n: 'Barato', valor: 12, demanda: 1.3, justo: 1.1, competidor: 0.88 },
        normal: { n: 'Normal', valor: 15, demanda: 1.0, justo: 1.0, competidor: 0.75 },
        caro: { n: 'Premium', valor: 21, demanda: 0.55, justo: 0.8, competidor: 0.92 },
      },
      sueldos: {
        bajo: { n: 'Bajo', coste: 250, calidad: 0.8, fuga: 0.06, capacidad: 0.9 },
        normal: { n: 'Normal', coste: 300, calidad: 1.0, fuga: 0.02 },
        alto: { n: 'Alto', coste: 370, calidad: 1.18, fuga: 0 },
      },
      marketing: {
        nada: { n: 'Nada', coste: 0, demanda: 1, fama: 0 },
        redes: { n: 'Redes', coste: 60, demanda: 1.05, fama: 2 },
        fuerte: { n: 'Campaña', coste: 220, demanda: 1.12, fama: 5 },
      },
    },
  };

  // ---- Oportunidades de inversión (la segunda puerta que abre el capítulo) ----
  const OPORTUNIDADES = [
    { id: 'local', ic: '🏢', n: 'Comprar el local de tu peluquería', coste: 14000, d: 'Dejas de pagar alquiler para siempre. Mucho dinero de golpe, pero tu negocio gana más y vale más.' },
    { id: 'segunda', ic: '💈', n: 'Abrir una segunda peluquería', coste: 7000, d: 'Duplicas ingresos… y problemas. Tendrás que repartir tu tiempo entre dos negocios.' },
    { id: 'socio', ic: '🤝', n: 'Entrar como socio en la cafetería de un compañero', coste: 4000, d: 'Inviertes sin gestionar: cobras parte de los beneficios, pero no decides tú.' },
  ];

  // ---- Hitos: cada uno abre algo concreto ----
  const HITOS = [
    { id: 'prueba', n: 'Consigue una prueba', abre: 'Sesión con preparador para las pruebas' },
    { id: 'contrato', n: 'Firma tu primer contrato profesional', abre: 'La liga, patrocinadores locales y tu sueldo' },
    { id: 'titular', n: `Sé titular en 3 partidos`, abre: 'Un agente: negociar renovaciones y escuchar a otros clubes' },
    { id: 'patro', n: 'Firma tu primer patrocinador', abre: 'Tu asesor te enseña negocios en traspaso' },
    { id: 'capital', n: 'Reúne el capital para el traspaso', abre: 'Negociar la compra de la peluquería' },
    { id: 'empresa', n: 'Compra tu primera empresa', abre: 'La gestión: precios, personal, caja y la acción «Pasar la semana en la empresa»' },
    { id: 'rentable', n: 'Mantén la empresa rentable 6 semanas seguidas', abre: 'Financiación del banco y vender el negocio' },
    { id: 'inversion2', n: 'Elige tu segunda inversión', abre: 'Capítulo 2: tu imperio' },
  ];

  Object.assign(P2, { CFG, LIGAS, OFERTAS, OBJETIVOS, ACCIONES, MARCAS, TIERS, NEGOCIOS, OPORTUNIDADES, HITOS });
})(globalThis.P2 = globalThis.P2 || {});
