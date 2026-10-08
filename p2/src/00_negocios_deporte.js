/* =====================================================================
   00c · NEGOCIOS DE CADA DEPORTE (los que promete la ficha de cada expansión)
   Misma economía que la peluquería (caja separada, demanda con fama, personal, precio, marketing,
   crisis, préstamos, venta), con sus números: ticket, demanda, capacidad, alquiler y coste por cliente.
   Solo se ven en las carreras de ese deporte. Importes de juego.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { NEGOCIOS } = P2;

  // id, nombre, icono, qué es, unidad del precio, { traspaso, ticket, demanda, capEmp, alquiler, fijos, coste (por cliente, en % del ticket), sueldo, empMax, req }
  const L = {
    escalada: [
      ['clases', 'Escuela de escalada', '🧗', 'Cursos de iniciación y grupos de tecnificación en el rocódromo.', 'por clase', { traspaso: 3600, ticket: 14, demanda: 112, capEmp: 45, alquiler: 330, fijos: 90, coste: 0.06 }],
      ['routesetting', 'Equipadora de bloques y vías', '🔩', 'Equipas y cambias los bloques de los rocódromos de la zona.', 'por encargo', { traspaso: 4200, ticket: 140, demanda: 12.6, capEmp: 5, alquiler: 160, fijos: 110, coste: 0.18, sueldo: 380 }],
      ['tienda', 'Tienda de material de escalada', '🛍️', 'Pies de gato, cuerdas, magnesio y arneses.', 'ticket medio', { traspaso: 4800, ticket: 34, demanda: 73, capEmp: 55, alquiler: 520, fijos: 130, coste: 0.45 }],
      ['rocodromo', 'Rocódromo de bloque', '🏟️', 'Tu propio rocódromo: entradas, bonos y cumpleaños.', 'por entrada', { traspaso: 14000, ticket: 11, demanda: 426, capEmp: 170, alquiler: 1900, fijos: 650, coste: 0.05, empMax: 6 }],
      ['eventos', 'Organizadora de opens', '🎪', 'Opens de bloque y festivales de escalada.', 'por inscripción', { traspaso: 3000, ticket: 28, demanda: 37, capEmp: 35, alquiler: 0, fijos: 260, coste: 0.2 }],
      ['cadena', 'Cadena de rocódromos', '🏙️', 'Tres rocódromos con tu marca en la ciudad.', 'por entrada', { traspaso: 42000, ticket: 11, demanda: 1159, capEmp: 210, alquiler: 5600, fijos: 1900, coste: 0.05, empMax: 10, req: 'rocodromo' }],
    ],
    tenis: [
      ['clases', 'Clases de tenis', '🎾', 'Clases particulares y grupos en pistas alquiladas.', 'por clase', { traspaso: 3200, ticket: 22, demanda: 69, capEmp: 28, alquiler: 280, fijos: 80, coste: 0.08 }],
      ['academia', 'Academia de tenis', '🏫', 'Escuela con grupos por niveles y torneos internos.', 'cuota semanal', { traspaso: 6500, ticket: 30, demanda: 77, capEmp: 30, alquiler: 650, fijos: 220, coste: 0.06, empMax: 5 }],
      ['pistas', 'Alquiler de pistas', '🟩', 'Pistas de tenis y pádel por horas.', 'por hora', { traspaso: 9000, ticket: 14, demanda: 201, capEmp: 160, alquiler: 1100, fijos: 380, coste: 0.04 }],
      ['club', 'Club de tenis', '🏛️', 'Socios, cafetería, pistas y escuela.', 'cuota semanal', { traspaso: 16000, ticket: 9, demanda: 631, capEmp: 220, alquiler: 2200, fijos: 900, coste: 0.08, empMax: 7 }],
      ['torneos', 'Organizadora de torneos', '🏆', 'Torneos para aficionados y juveniles.', 'por inscripción', { traspaso: 2800, ticket: 30, demanda: 32, capEmp: 35, alquiler: 0, fijos: 240, coste: 0.22 }],
      ['altoRendimiento', 'Centro de alto rendimiento', '🚀', 'Para los mejores juniors: entrenamiento, físico y viajes.', 'cuota semanal', { traspaso: 38000, ticket: 160, demanda: 99, capEmp: 9, alquiler: 3600, fijos: 1600, coste: 0.12, empMax: 8, sueldo: 520, req: 'academia' }],
    ],
    basket: [
      ['campus', 'Campus de baloncesto', '🏕️', 'Campus de verano y de Navidad.', 'por niño', { traspaso: 3000, ticket: 45, demanda: 30, capEmp: 18, alquiler: 260, fijos: 120, coste: 0.18 }],
      ['academia', 'Academia de baloncesto', '🏫', 'Escuela de fundamentos para todas las edades.', 'cuota semanal', { traspaso: 5800, ticket: 16, demanda: 136, capEmp: 50, alquiler: 600, fijos: 200, coste: 0.05 }],
      ['gimnasio', 'Gimnasio de preparación física', '🏋️', 'Fuerza y salto para deportistas.', 'cuota semanal', { traspaso: 7000, ticket: 12, demanda: 209, capEmp: 110, alquiler: 950, fijos: 320, coste: 0.05 }],
      ['tres', 'Liga 3x3', '🏀', 'Torneos y liga de 3x3 en la calle.', 'por equipo', { traspaso: 2600, ticket: 36, demanda: 24, capEmp: 30, alquiler: 0, fijos: 230, coste: 0.18 }],
      ['pabellon', 'Pabellón', '🏟️', 'Alquilas pista a clubes, colegios y empresas.', 'por hora', { traspaso: 18000, ticket: 38, demanda: 134, capEmp: 70, alquiler: 1900, fijos: 900, coste: 0.06, empMax: 5 }],
      ['club', 'Club de baloncesto', '🔶', 'Equipos de cantera y un sénior en la liga autonómica.', 'cuota semanal', { traspaso: 30000, ticket: 14, demanda: 572, capEmp: 160, alquiler: 2600, fijos: 1500, coste: 0.08, empMax: 8, req: 'academia' }],
    ],
    skate: [
      ['skateshop', 'Skateshop', '🛹', 'La tienda del barrio: tablas, ruedas, zapatillas.', 'ticket medio', { traspaso: 4000, ticket: 32, demanda: 69, capEmp: 55, alquiler: 450, fijos: 110, coste: 0.45 }],
      ['marca', 'Marca de skate', '🏷️', 'Tu propia marca: tablas y camisetas con tu nombre.', 'por pedido', { traspaso: 5200, ticket: 40, demanda: 57, capEmp: 45, alquiler: 300, fijos: 260, coste: 0.42 }],
      ['tablas', 'Fábrica de tablas', '🪵', 'Prensas, madera de arce y gráficos.', 'por tabla', { traspaso: 7500, ticket: 45, demanda: 80, capEmp: 30, alquiler: 650, fijos: 280, coste: 0.38 }],
      ['ropa', 'Marca de ropa urbana', '👕', 'Sudaderas, gorras y colaboraciones.', 'por pedido', { traspaso: 6000, ticket: 38, demanda: 69, capEmp: 60, alquiler: 400, fijos: 300, coste: 0.4 }],
      ['skatepark', 'Skatepark cubierto', '🌀', 'Entradas, clases y cumpleaños bajo techo.', 'por entrada', { traspaso: 13000, ticket: 9, demanda: 466, capEmp: 180, alquiler: 1600, fijos: 600, coste: 0.04, empMax: 5 }],
      ['eventos', 'Organizadora de contests', '🎪', 'Contests, música y sponsors.', 'por entrada', { traspaso: 3200, ticket: 14, demanda: 86, capEmp: 70, alquiler: 0, fijos: 300, coste: 0.18 }],
    ],
    surf: [
      ['escuela', 'Escuela de surf', '🏄', 'Cursos de iniciación en la playa.', 'por clase', { traspaso: 3400, ticket: 25, demanda: 47, capEmp: 30, alquiler: 220, fijos: 90, coste: 0.1 }],
      ['alquiler', 'Alquiler de tablas', '🏖️', 'Tablas y neoprenos por horas.', 'por alquiler', { traspaso: 2600, ticket: 15, demanda: 57, capEmp: 80, alquiler: 200, fijos: 80, coste: 0.12 }],
      ['shop', 'Surf shop', '🛍️', 'Tablas, quillas, neoprenos y ropa.', 'ticket medio', { traspaso: 4500, ticket: 38, demanda: 62, capEmp: 50, alquiler: 480, fijos: 120, coste: 0.45 }],
      ['shaping', 'Taller de shaping', '🪚', 'Tablas a medida hechas a mano.', 'por tabla', { traspaso: 5000, ticket: 320, demanda: 6.1, capEmp: 4, alquiler: 280, fijos: 120, coste: 0.32, sueldo: 380 }],
      ['surfcamp', 'Surf camp', '⛺', 'Semanas de surf con alojamiento y comidas.', 'por semana', { traspaso: 12000, ticket: 260, demanda: 16.6, capEmp: 8, alquiler: 1200, fijos: 450, coste: 0.25, empMax: 5 }],
      ['alojamiento', 'Alojamiento surfero', '🏠', 'Hostal junto a la playa.', 'por noche', { traspaso: 16000, ticket: 32, demanda: 150, capEmp: 80, alquiler: 1800, fijos: 700, coste: 0.1, empMax: 6 }],
      ['eventos', 'Organizadora de campeonatos', '🎪', 'Campeonatos y festivales de surf.', 'por inscripción', { traspaso: 3000, ticket: 30, demanda: 32, capEmp: 35, alquiler: 0, fijos: 260, coste: 0.2 }],
    ],
  };

  function crear(dep, [id, n, ic, d, unidad, o]) {
    const sueldo = o.sueldo || 300, tk = o.ticket;
    const r = x => Math.round(x / 10) * 10;
    NEGOCIOS[`${dep}_${id}`] = {
      n, ic, d, unidad, deporte: dep, req: o.req ? `${dep}_${o.req}` : null, traspaso: o.traspaso, cajas: [r(o.traspaso / 3), r(o.traspaso * 0.67), r(o.traspaso * 1.2)],
      arranque: { fianza: r(o.alquiler * 2), stock: r(o.traspaso * 0.06), reparaciones: r(o.traspaso * 0.04), primeraSemana: 0.6 },
      mejorasIniciales: [
        { id: 'sillon', ic: '🧰', n: 'Material y equipamiento de segunda mano', coste: r(o.traspaso * 0.2), ef: { capacidad: 0.15 }, d: '+15 % de capacidad para siempre' },
        { id: 'reforma', ic: '🎨', n: 'Lavado de cara y nueva imagen', coste: r(o.traspaso * 0.35), ef: { fama: 12, famaObjetivo: 5 }, d: '+12 de fama ya y +5 a la fama a la que tiende' },
        { id: 'reapertura', ic: '🎈', n: 'Jornada de puertas abiertas', coste: r(o.traspaso * 0.1), ef: { fama: 7 }, d: '+7 de fama ya' },
      ],
      demandaBase: o.demanda, capacidadEmpleado: o.capEmp, empleadosMax: o.empMax || 4, alquiler: o.alquiler, fijos: o.fijos, consumoCliente: Math.round(tk * o.coste * 100) / 100,
      famaInicial: 40, historialVendedor: [0.03, 0.01, -0.02, 0.025, -0.005, 0.005].map(f => Math.round(o.traspaso * f)),
      configInicial: { precio: 'barato', sueldo: 'bajo', empleados: Math.max(2, Math.min(o.empMax || 4, Math.round((o.empMax || 4) * 0.6))), marketing: 'nada' },
      precios: {
        barato: { n: 'Barato', valor: Math.round(tk * 0.8), demanda: 1.3, justo: 1.1, competidor: 0.88 },
        normal: { n: 'Normal', valor: tk, demanda: 1.0, justo: 1.0, competidor: 0.75 },
        caro: { n: 'Premium', valor: Math.round(tk * 1.4), demanda: 0.55, justo: 0.8, competidor: 0.92 },
      },
      sueldos: {
        bajo: { n: 'Bajo', coste: Math.round(sueldo * 0.83), calidad: 0.8, fuga: 0.06, capacidad: 0.9 },
        normal: { n: 'Normal', coste: sueldo, calidad: 1.0, fuga: 0.02 },
        alto: { n: 'Alto', coste: Math.round(sueldo * 1.23), calidad: 1.18, fuga: 0 },
      },
      marketing: {
        nada: { n: 'Nada', coste: 0, demanda: 1, fama: 0 },
        redes: { n: 'Redes', coste: r(Math.max(40, o.traspaso * 0.012)), demanda: 1.05, fama: 2 },
        fuerte: { n: 'Campaña', coste: r(Math.max(150, o.traspaso * 0.045)), demanda: 1.12, fama: 5 },
      },
    };
  }
  for (const [dep, l] of Object.entries(L)) for (const x of l) crear(dep, x);
  NEGOCIOS.peluqueria.unidad = 'por corte';
  // Negocios que se pueden comprar en esta carrera: la peluquería (siempre) y los de tu deporte
  P2.negociosDeCarrera = s => Object.keys(NEGOCIOS).filter(k => !NEGOCIOS[k].deporte || NEGOCIOS[k].deporte === ((s && s.deporte) || 'futbol'));
})(globalThis.P2 = globalThis.P2 || {});
