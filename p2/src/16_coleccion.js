/* =====================================================================
   16 · DESEO Y COLECCIÓN: lo que quieres, lo que tienes y tu historia
   - Lista de deseos: un objetivo personal destacado (s.deseoActual) y aviso UNA vez al poder pagarlo.
     Nunca compra solo: comprarlo o invertir sigue siendo tu decisión.
   - Colecciones: completar una da un fondo de perfil (sin estadísticas).
   - Mi historia: ligas, ascensos, clubes, marcas, empresas, mayor patrimonio, coches, viviendas.
   - Eventos por posesiones: algunas compras traen situaciones semanas después (dinero del juego, no real).
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, eur } = P2;

  // ---------- Lista de deseos ----------
  const deseable = P => P && !P.inicial && !P.consumible && !P.proximamente && P.precio >= 150;
  function quiero(s, id) {
    const P = P2.producto(id); if (!deseable(P)) return false;
    const m = P2.monEstado(s);
    if (s.deseoActual === id) { s.deseoActual = null; P2.teleMon(s, 'wishlist_remove', { id }); return true; }
    if (s.deseoActual) P2.teleMon(s, 'wishlist_remove', { id: s.deseoActual, cambio: true });
    s.deseoActual = id; m.deseoAvisado = null; m.deseoAviso = null;
    P2.teleMon(s, 'wishlist_add', { id, precio: P.precio });
    const t = s.tele; if (t && t.mon) t.mon.deseados[id] = (t.mon.deseados[id] || 0) + 1;
    return true;
  }
  // Se llama al final de cada semana/decisión. Devuelve true solo la primera vez que llegas al precio
  function revisarDeseo(s) {
    const id = s.deseoActual; if (!id) return false;
    const P = P2.producto(id), m = P2.monEstado(s);
    if (!P || P2.posee(s, id)) { if (P) P2.teleMon(s, 'wishlist_bought', { id }); s.deseoActual = null; m.deseoAviso = null; return false; }
    if (s.p.dinero >= P.precio && m.deseoAvisado !== id) {
      m.deseoAvisado = id; m.deseoAviso = { id, semana: s.semana };
      P2.teleMon(s, 'wishlist_reached', { id, precio: P.precio });
      return true;
    }
    return false;
  }

  // ---------- Colecciones (premio visual, nunca estadísticas) ----------
  const COLECCIONES = [
    { id: 'street', ic: '🛹', n: 'Street', items: ['camiseta', 'chandal', 'gorra', 'botas'], premio: 'fondo:street', premioN: 'Fondo Street' },
    { id: 'pro', ic: '⚡', n: 'Profesional', items: ['botasPro', 'movilBueno', 'outfit', 'relojDep'], premio: 'fondo:vestuario', premioN: 'Fondo Vestuario' },
    { id: 'lujo', ic: '💎', n: 'Lujo', items: ['cadena', 'relojLujo', 'deportivo', 'casaPremium'], premio: 'fondo:lujo', premioN: 'Fondo Lujo' },
    { id: 'temporada', ic: '🏆', n: 'Temporada', items: [], futura: true, n2: 'Cosméticos de temporada gratuitos y premium mezclados (próximamente)' },
  ];
  const tieneObj = (s, id) => (s.historiaCosas || []).includes(id) || P2.posee(s, id);
  function progresoColeccion(s, C) { return { tengo: C.items.filter(id => tieneObj(s, id)).length, total: C.items.length }; }
  function revisarColecciones(s) {
    const hechas = s.coleccionesHechas || (s.coleccionesHechas = []), nuevas = [];
    for (const C of COLECCIONES) {
      if (C.futura || hechas.includes(C.id)) continue;
      const p = progresoColeccion(s, C);
      if (p.tengo === p.total) { hechas.push(C.id); nuevas.push(C); s.lookDesbloqueos = Array.from(new Set((s.lookDesbloqueos || []).concat(C.premio))); P2.anotar(s, C.ic, `¡Colección ${C.n} completa! Premio: ${C.premioN}.`); }
    }
    return nuevas;
  }

  // ---------- Mi historia ----------
  function anotarHistoria(s, k, v) {
    const h = s.historia || (s.historia = { ascensos: 0, patrimonioMax: 0, semanaMax: 1 });
    if (k === 'ascenso') h.ascensos++;
    if (k === 'semana') { const p = P2.patrimonio(s); if (p > h.patrimonioMax) { h.patrimonioMax = p; h.semanaMax = s.semana; } }
    return h;
  }
  function miHistoria(s) {
    const h = s.historia || { ascensos: 0, patrimonioMax: 0 }, T = s.temporadasJugadas || [];
    const cosas = (s.historiaCosas || []).map(P2.producto).filter(Boolean);
    return {
      temporadas: T.length, ligasGanadas: T.filter(t => t.pos === 1).length, objetivos: T.filter(t => t.cumple).length, ascensos: h.ascensos,
      clubes: [...new Set(T.map(t => t.club).concat(s.contrato ? [P2.oferta(s).n] : []))],
      marcas: [...new Set((s.patroHist || []).map(x => x.id).concat((s.patros || []).map(x => x.id)))].map(id => P2.MARCAS.find(m => m.id === id)).filter(Boolean),
      empresas: s.negocios.length + (s.socio ? 1 : 0) + (s.tele && s.tele.empresa && (s.tele.empresa.venta || s.tele.empresa.cierre) ? 1 : 0),
      patrimonioMax: Math.max(h.patrimonioMax || 0, P2.patrimonio(s)),
      vehiculos: cosas.filter(P => P.cat === 'vehiculos'), viviendas: [P2.producto('habitacion')].concat(cosas.filter(P => P.cat === 'vivienda')),
      partidos: s.stats.jugados, goles: s.stats.goles, hitos: P2.HITOS.filter(H => s.hitos[H.id]),
      colecciones: (s.coleccionesHechas || []).map(id => COLECCIONES.find(c => c.id === id)).filter(Boolean),
    };
  }

  // ---------- Eventos por posesiones (demostración: 4) ----------
  const prog = (s, sem, efecto, data) => P2.programar(s, sem, efecto, Object.assign({ desde: s.semana }, data || {}));
  const EVENTOS_POSESION = [
    { id: 'eventoMotor', ambito: 'relacion', rel: 'marc', fases: ['barrio', 'pruebas', 'amateur', 'club'], soloAgenda: true, cond: () => true, peso: () => 0,
      ic: '🏎️', titulo: 'Marc quiere estrenar tu deportivo', texto: s => `Desde que te compraste el deportivo (semana ${(s.agendaInfo || {}).desde || '?'}), Marc no para: hay una concentración de coches el sábado.`,
      ops: [
        { id: 'ir', n: 'Ir con Marc', ventaja: '+8 con Marc y algo de marca personal', coste: '−10 energía', riesgo: 'Ninguno', tags: ['seguro'],
          fx: s => { s.p.energia = clamp(s.p.energia - 10, 0, 100); P2.cambiarRel(s, 'marc', 8, 'Fuisteis a la concentración'); P2.sumarMarca(s, 1); return 'Fotos con el coche, gente que te reconoce y un tipo de una marca de neumáticos que te pide el contacto.'; } },
        { id: 'no', n: 'Mejor no', ventaja: 'Descansas', coste: '−3 con Marc', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'marc', -3, 'No fuiste a la concentración'); return 'Marc va solo. Te manda vídeos.'; } },
      ] },
    { id: 'padreGasto', ambito: 'relacion', rel: 'padre', fases: ['barrio', 'pruebas', 'amateur', 'club'], soloAgenda: true, cond: () => true, peso: () => 0,
      ic: '👨', titulo: 'Tu padre: «Estás gastando mucho»', texto: s => `Ha visto lo que te has comprado (semana ${(s.agendaInfo || {}).desde || '?'}). Le preocupa que no ahorres.`,
      ops: [
        { id: 'tranquilo', n: 'Explicarle tus números', ventaja: '+4 con tu padre', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { P2.cambiarRel(s, 'padre', 4, 'Le explicaste tus números'); return '«Vale, veo que lo tienes controlado.»'; } },
        { id: 'mio', n: '«Es mi dinero»', ventaja: 'Zanjas el tema', coste: '−6 con tu padre', riesgo: 'Ninguno', tags: ['riesgo'], fx: s => { P2.cambiarRel(s, 'padre', -6, 'Le dijiste que era tu dinero'); return 'Silencio en la cena.'; } },
      ] },
    { id: 'inauguracion', ambito: 'relacion', rel: 'madre', fases: ['barrio', 'pruebas', 'amateur', 'club'], soloAgenda: true, cond: () => true, peso: () => 0,
      ic: '🏢', titulo: 'Inauguración de tu piso', texto: s => `Ya tienes casa propia (semana ${(s.agendaInfo || {}).desde || '?'}). Tu madre propone celebrarlo.`,
      ops: [
        { id: 'fiesta', n: 'Cena para la familia y los amigos', ventaja: '+6 con tu madre, +5 con Marc y Dani', coste: '150 €', riesgo: 'Ninguno', tags: ['seguro'], cond: s => s.p.dinero >= 150,
          fx: s => { s.p.dinero -= 150; for (const [id, d] of [['madre', 6], ['marc', 5], ['dani', 5], ['padre', 3]]) P2.cambiarRel(s, id, d, 'Inauguraste tu piso'); return 'Tu madre trae croquetas para un regimiento.'; } },
        { id: 'tranquila', n: 'Algo tranquilo con tus padres', ventaja: '+4 con tu madre', coste: 'Nada', riesgo: 'Ninguno', tags: ['dinero'], fx: s => { P2.cambiarRel(s, 'madre', 4, 'Les enseñaste tu piso'); return 'Tu padre revisa todos los enchufes.'; } },
      ] },
    { id: 'cocheFamilia', ambito: 'relacion', rel: 'madre', fases: ['barrio', 'pruebas', 'amateur', 'club'], soloAgenda: true, cond: () => true, peso: () => 0,
      ic: '🚗', titulo: '¿Nos llevas a ver a la abuela?', texto: s => `Ahora que tienes coche (semana ${(s.agendaInfo || {}).desde || '?'}), tu madre te pide ir el domingo al pueblo.`,
      ops: [
        { id: 'llevar', n: 'Llevarles', ventaja: '+7 con tu madre y +3 con tu padre', coste: '−8 energía y 30 € de gasolina', riesgo: 'Ninguno', tags: ['seguro'], cond: s => s.p.dinero >= 30,
          fx: s => { s.p.dinero -= 30; s.p.energia = clamp(s.p.energia - 8, 0, 100); P2.cambiarRel(s, 'madre', 7, 'Les llevaste a ver a la abuela'); P2.cambiarRel(s, 'padre', 3, 'Les llevaste a ver a la abuela'); return 'La abuela te da un táper y 20 € «para gasolina».'; } },
        { id: 'no', n: 'Este domingo no puedo', ventaja: 'Descansas', coste: '−4 con tu madre', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'madre', -4, 'No les llevaste al pueblo'); return 'Van en autobús.'; } },
      ] },
  ];
  for (const E of EVENTOS_POSESION) P2.SUCESOS.push(E);
  const lanzar = id => (s, d) => { if (s.sucesosVistos[id] != null) return null; s.sucesosVistos[id] = s.semana; s.agendaInfo = { desde: d.desde }; P2.encolar(s, { tipo: 'suceso', id }); return ['⏳', `Esto viene de lo que compraste en la semana ${d.desde}.`]; };
  Object.assign(P2.EFECTOS, { eventoMotor: lanzar('eventoMotor'), padreGasto: lanzar('padreGasto'), inauguracion: lanzar('inauguracion'), cocheFamilia: lanzar('cocheFamilia') });

  // Tras cada compra: colecciones y, a veces, una situación futura
  function alComprar(s, P, precio) {
    revisarColecciones(s);
    if (P.id === 'deportivo') prog(s, 5, 'eventoMotor');
    if (P.id === 'piso' || P.id === 'casaPremium') prog(s, 2, 'inauguracion');
    if (P.id === 'cocheUsado') prog(s, 4, 'cocheFamilia');
    if (precio >= 5000 && !(s.sucesosVistos || {}).padreGasto) prog(s, 3, 'padreGasto');
  }

  // ---------- Inversiones como desbloqueables: se ven desde el principio, se abren jugando ----------
  const INVERSIONES_FUTURAS = [
    { id: 'restaurante', ic: '🍽️', n: 'Restaurante', coste: 60000, d: 'Más clientes, más personal y más riesgo que una peluquería.' },
    { id: 'gimnasio', ic: '🏋️', n: 'Cadena de gimnasios', coste: 120000, d: 'Tu fama de deportista vende abonos.' },
    { id: 'inmuebles', ic: '🏘️', n: 'Pisos en alquiler', coste: 200000, d: 'Ingresos estables cada mes.' },
    { id: 'club', ic: '⚽', n: 'Comprar un club', coste: 2000000, d: 'El sueño: presidir tu propio equipo.' },
  ];
  function inversiones(s) {
    const h = s.hitos, jug = Math.min(s.stats.jugados, 10);
    const pelu = {
      id: 'peluqueria', grupo: 'primera', ic: '💈', n: 'Peluquería en traspaso', coste: P2.capitalNecesario('peluqueria', 0, s), desde: true,
      d: 'Tu primera empresa: precios, personal, caja y crisis. Tu dinero y el de la empresa van por separado.',
      estado: h.empresa || s.negocios.length ? 'tuya' : P2.mercadoAbierto(s) ? 'disponible' : 'bloqueada',
      reqs: [{ t: 'Firma tu primer patrocinador', ok: !!h.patro }, { t: `…o juega 10 partidos como profesional (${h.contrato ? jug : 0}/10)`, ok: !!h.contrato && s.stats.jugados >= 10 }],
    };
    const seg = P2.OPORTUNIDADES.map(o => ({
      id: o.id, grupo: 'segunda', ic: o.ic, n: o.n, coste: o.coste, d: o.d,
      estado: s.oportunidad === o.id ? 'tuya' : s.oportunidad ? 'otra' : h.rentable ? 'disponible' : 'bloqueada',
      reqs: [{ t: 'Compra tu primera empresa', ok: !!h.empresa }, { t: 'Mantenla rentable 6 semanas seguidas', ok: !!h.rentable }],
    }));
    const fut = INVERSIONES_FUTURAS.map(x => Object.assign({ grupo: 'futura', estado: 'proximamente', reqs: [{ t: 'Capítulos futuros', ok: false }] }, x));
    return [pelu].concat(seg, fut);
  }

  Object.assign(P2, { INVERSIONES_FUTURAS, inversiones, quiero, deseable, revisarDeseo, COLECCIONES, progresoColeccion, revisarColecciones, anotarHistoria, miHistoria, EVENTOS_POSESION, alComprar });
})(globalThis.P2 = globalThis.P2 || {});
