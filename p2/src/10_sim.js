/* =====================================================================
   10 · SIMULACIÓN Y BALANCE
   Los bots combinan tres dimensiones independientes:
     · deportiva   (qué hace cada semana): trabajo, entreno, futbol, descanso, equilibrada (+ imagen: prensa y plaza)
     · empresarial (cómo compra y gestiona): noOptimiza, prudente, agresiva, inteligente
     · comercial   (patrocinios): sin, locales, maximos
   Todos pueden comprar la peluquería cuando tengan dinero: nadie lo tiene prohibido.
   Usan las mismas funciones que la interfaz (jugarSemana y resolverDecision).
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, OFERTAS, MARCAS, NEGOCIOS, OPORTUNIDADES } = P2;

  const libres = s => P2.accionesDisponibles(s).filter(a => !a.bloqueo).map(a => a.id);
  function primeraLibre(s, prefs) { const l = libres(s); return prefs.find(p => l.includes(p)) || (l.includes('descansar') ? 'descansar' : l[0]); }
  const cansado = (s, min = 40) => s.p.energia < min;

  // ---------- Dimensión deportiva ----------
  const DEPORTIVA = {
    trabajo: { n: 'Trabajo primero', clubes: ['puerto', 'renovar', 'costaReal', 'atleticoFilial', 'atleticoFormacion', 'atleticoPrimero', 'sanroque'], tags: ['dinero'],
      accion: s => (cansado(s, 25) ? 'descansar' : primeraLibre(s, ['trabajar', 'mediaJornada', 'gestionar'])) },
    entreno: { n: 'Entrenamiento primero', clubes: ['atleticoFilial', 'atleticoFormacion', 'atleticoPrimero', 'costaReal', 'renovar', 'puerto', 'sanroque'], tags: ['deporte'],
      accion: s => (cansado(s) ? 'descansar' : primeraLibre(s, ['entrenar', 'entrenoExtra'])) },
    futbol: { n: 'Fútbol primero', clubes: ['atleticoFilial', 'atleticoFormacion', 'atleticoPrimero', 'costaReal', 'renovar', 'puerto', 'sanroque'], tags: ['deporte'],
      accion: s => (cansado(s) ? 'descansar' : primeraLibre(s, ['torneo', 'jornada', 'plaza', 'entrenoExtra'])) },
    descanso: { n: 'Conservadora (descanso)', clubes: ['renovar', 'puerto', 'atleticoFormacion', 'atleticoFilial', 'atleticoPrimero', 'costaReal', 'sanroque'], tags: ['seguro'],
      accion: () => 'descansar' },
    equilibrada: { n: 'Equilibrada', clubes: ['atleticoFilial', 'atleticoPrimero', 'atleticoFormacion', 'costaReal', 'renovar', 'puerto', 'sanroque'], tags: ['seguro', 'deporte'],
      accion: s => {
        const P = s.p, l = libres(s);
        if (s.fase === 'barrio') {
          if (l.includes('jornada') && P.nivel >= 48) return 'jornada';
          if (l.includes('torneo') && P.nivel >= 46) return 'torneo';
          if (P.energia < 45) return 'descansar';
          if (P.rep < 14 && P.nivel >= 48) return primeraLibre(s, ['plaza', 'entrenar']);
          return primeraLibre(s, ['entrenar', 'plaza']);
        }
        if (s.fase === 'pruebas') { if (l.includes('preparador') && P.dinero >= 150) return 'preparador'; return P.energia < 70 ? 'descansar' : primeraLibre(s, ['entrenar']); }
        if (s.negocios.some(n => n.rachaNeg >= 2) && l.includes('gestionar')) return 'gestionar';
        if (P.energia < 50) return 'descansar';
        return primeraLibre(s, ['entrenoExtra']);
      } },
    // Ruta «imagen»: plaza en el barrio y prensa como profesional (sacrifica nivel por fama)
    imagen: { n: 'Imagen (prensa y plaza)', clubes: ['puerto', 'atleticoFilial', 'atleticoFormacion', 'renovar', 'costaReal', 'atleticoPrimero', 'sanroque'], tags: ['dinero'],
      accion: s => (cansado(s, 25) ? 'descansar' : primeraLibre(s, ['plaza', 'prensa', 'torneo', 'jornada', 'entrenoExtra'])) },
  };

  // ---------- Dimensión empresarial ----------
  // caja: índice de caja inicial · gestor: optimiza cada semana · mejora: hace la mejora inicial · segunda: preferencia de segunda inversión
  const EMPRESARIAL = {
    noOptimiza: { n: 'No optimiza', caja: 1, gestor: false, mejora: false, crisis: ['aportar', 'prestamo', 'recortar'], segunda: ['socio', 'segunda', 'local'] },
    prudente: { n: 'Prudente', caja: 2, gestor: true, mejora: 'barata', crisis: ['aportar', 'recortar', 'prestamo'], segunda: ['socio', 'local', 'segunda'] },
    agresiva: { n: 'Agresiva', caja: 0, gestor: true, mejora: 'mejor', crisis: ['prestamo', 'aportar', 'recortar'], segunda: ['segunda', 'local', 'socio'] },
    inteligente: { n: 'Inteligente', caja: 'auto', gestor: true, mejora: 'mejor', crisis: ['aportar', 'prestamo', 'recortar'], segunda: ['local', 'segunda', 'socio'] },
  };
  // ---------- Dimensión comercial ----------
  const COMERCIAL = {
    sin: { n: 'Sin patrocinadores', max: 0, tiers: [], acto: 'no' },
    locales: { n: 'Patrocinadores locales', max: 1, tiers: ['local'], acto: 'ir' },
    maximos: { n: 'Patrocinadores máximos', max: 2, tiers: ['local', 'deportiva', 'grande'], acto: 'ir' },
  };

  // Gestor «listo»: prueba todas las configuraciones y se queda con la que más gana (sin bajar sueldos, que hunde el ambiente)
  function gestorListo(s, n) {
    const T = NEGOCIOS[n.tipo];
    let mejor = null;
    for (const precio of Object.keys(T.precios)) for (const sueldo of Object.keys(T.sueldos)) for (let e = 1; e <= T.empleadosMax; e++) for (const marketing of Object.keys(T.marketing)) {
      if (T.sueldos[sueldo].coste < T.sueldos[n.sueldo].coste) continue;
      const c = Object.assign({}, n, { precio, sueldo, empleados: e, marketing, ctx: Object.assign({}, n.ctx), semanas: Math.max(1, n.semanas) });
      const x = P2.calcularSemana(s, c);
      const v = x.beneficio + (x.famaObjetivo - n.fama) * 4;
      if (!mejor || v > mejor.v) mejor = { v, precio, sueldo, empleados: e, marketing };
    }
    for (const k of ['precio', 'sueldo', 'marketing']) if (n[k] !== mejor[k]) P2.configurar(s, n.id, k, mejor[k]);
    if (n.empleados !== mejor.empleados) P2.configurar(s, n.id, 'empleados', mejor.empleados);
    return mejor;
  }

  function crearBot(dep, emp, com, extra = {}) {
    return Object.assign({ dep: DEPORTIVA[dep], emp: EMPRESARIAL[emp], com: COMERCIAL[com], ids: { dep, emp, com } }, extra);
  }
  // Índice de caja que usa el bot (inteligente: la media si llega a pagarla; tras muchas semanas, la mínima)
  function cajaBot(s, B) {
    if (B.cajaForzada != null) return B.cajaForzada;
    if (B.emp.caja !== 'auto') return B.emp.caja;
    return s.p.dinero >= P2.capitalNecesario('peluqueria', 1) ? 1 : (s.semana > 40 ? 0 : null);
  }

  function decidir(s, B, opc = {}) {
    const v = P2.vistaPendiente(s), ev = s.pendiente;
    if (!v) { P2.siguiente(s); return true; }
    const ops = v.ops.filter(o => !o.bloqueo), tiene = id => ops.some(o => o.id === id);
    let id = null;
    if (ev.tipo === 'ofertas') {
      const pref = (opc.club && ev.origen !== 'fin' ? (opc.club === 'puerto' ? ['puerto'] : ['atleticoFilial', 'atleticoFormacion']) : []).concat(B.dep.clubes, ['seguir']);
      id = pref.find(tiene);
    } else if (ev.tipo === 'acto') id = tiene(B.com.acto) ? B.com.acto : 'ir';
    else if (ev.tipo === 'renovarMarca') id = B.com.max && tiene('renovar') ? 'renovar' : 'no';
    else if (ev.tipo === 'patroOferta') {
      const M = MARCAS.find(m => m.id === ev.marca);
      const quiere = B.com.tiers.includes(M.tier) && (s.patros.length < B.com.max || B.ids.com === 'maximos');
      id = quiere ? (tiene('firmar') ? 'firmar' : tiene('cambiar') && B.ids.com === 'maximos' && M.semanal > Math.min(...s.patros.map(c => c.semanal || 0)) ? 'cambiar' : 'no') : 'no';
    }
    else if (ev.tipo === 'repesca') id = 'ir';
    else if (ev.tipo === 'crisis') id = B.emp.crisis.find(tiene) || 'recortar';
    else if (ev.tipo === 'mejoraInicial') {
      const n = s.negocios.find(x => x.id === ev.neg), T = n && P2.tipoDe(n);
      id = 'nada';
      if (B.emp.mejora && n) {
        const posibles = T.mejorasIniciales.filter(M => n.caja - M.coste >= 300);
        const M = B.emp.mejora === 'barata' ? posibles.find(m => m.id === 'reapertura') : (posibles.find(m => m.id === 'sillon') || posibles[0]);
        if (M) id = M.id;
      }
    } else if (ev.tipo === 'oportunidad') id = B.emp.segunda.find(tiene) || 'luego';
    else if (ev.tipo === 'socioCapital') id = tiene('poner') && B.ids.emp !== 'prudente' ? 'poner' : 'no';
    else if (ev.tipo === 'socioOferta') id = B.ids.emp === 'prudente' ? 'vender' : 'no';
    else {
      for (const t of B.dep.tags) { const o = ops.find(x => (x.tags || []).includes(t)); if (o) { id = o.id; break; } }
      if (!id && ops.length) id = ops[0].id;
    }
    if (id && P2.resolverDecision(s, id)) return true;
    for (const o of ops.slice().reverse()) if (P2.resolverDecision(s, o.id)) return true;
    return false;
  }
  function gestionar(s, B) {
    if (B.com.max && s.fase === 'club') {
      for (const M of MARCAS) if (B.com.tiers.includes(M.tier) && s.patros.length < B.com.max && !P2.bloqueoMarca(s, M)) P2.firmarMarca(s, M.id, null);
    }
    if (!s.negocios.length && !s.oportunidad) {
      const i = cajaBot(s, B);
      if (i != null && !P2.bloqueoCompra(s, 'peluqueria', i)) P2.comprarNegocio(s, 'peluqueria', i, null);
    }
    for (const n of s.negocios) {
      if (B.emp.gestor) gestorListo(s, n);
      if (B.emp.gestor && n.caja > 3000 + (B.ids.emp === 'prudente' ? 2000 : 0)) P2.retirar(s, n.id, n.caja - 2500);
      if (n.caja < 0 && s.p.dinero > -n.caja + 300 && B.emp.gestor) P2.aportar(s, n.id, -n.caja + 300);
    }
    if (s.oportunidadAbierta && !s.oportunidad) { const o = B.emp.segunda.map(id => OPORTUNIDADES.find(x => x.id === id)).find(o => s.p.dinero >= o.coste); if (o) P2.elegirOportunidad(s, o.id); }
  }

  function jugarPartida(B, seed, maxSemanas = 90, opc = {}) {
    if (typeof B === 'string') B = POLITICAS[B].bot;
    const s = P2.nuevaPartida({ seed, nombre: 'Bot' });
    const log = { seed, invitacion: null, via: null, score: null, ofertas: null, primerClub: null, contrato: null, empresa: null, rentable: null, capitulo: null,
      energiaNeg: false, trabajos: 0, crisis: 0, atascos: 0, dineroEn: {}, nivelEn: {}, ligaMax: 1, ascensos: 0, descensos: 0, segunda: null, dineroOportunidad: null };
    const resolverTodo = () => {
      let g = 0;
      while (s.pendiente && g++ < 60) {
        const ev = s.pendiente;
        if (ev.tipo === 'ofertas' && ev.origen !== 'fin' && log.ofertas == null && ev.origen !== 'sinOferta') { log.ofertas = ev.ofertas.slice().sort().join('+'); log.score = ev.score; }
        if (ev.tipo === 'crisis') log.crisis++;
        if (ev.tipo === 'oportunidad' && log.dineroOportunidad == null) log.dineroOportunidad = Math.round(s.p.dinero);
        if (ev.tipo === 'cambioCategoria') { if (ev.mov.tipo === 'sube') log.ascensos++; if (ev.mov.tipo === 'baja') log.descensos++; }
        if (!decidir(s, B, opc)) { if (opc.debug) console.log("atasco decidir", s.semana, JSON.stringify(s.pendiente)); log.atascos++; s.pendiente = null; s.cola = []; }
        if (!log.primerClub && s.contrato && !OFERTAS[s.contrato.oferta].amateur) log.primerClub = s.contrato.oferta;
      }
      if (s.pendiente) { if (opc.debug) console.log('atasco bucle', s.semana, JSON.stringify(s.pendiente)); log.atascos++; s.pendiente = null; s.cola = []; }
    };
    for (let w = 0; s.semana <= maxSemanas && w < maxSemanas * 2 && (opc.seguir || !s.capitulo.completado); w++) {   // semanas reales (un evento puede ocupar varias)
      resolverTodo();
      gestionar(s, B);
      resolverTodo();
      if (s.capitulo.completado && !log.capitulo) log.capitulo = s.capitulo.semana;
      if (s.capitulo.completado && !opc.seguir) break;
      for (const k of [25, 40, 60, 80]) if (s.semana >= k && log.dineroEn[k] == null) { log.dineroEn[k] = P2.patrimonio(s); log.nivelEn[k] = s.p.nivel; }   // al cruzar la semana (un evento puede saltarla)
      const a = B.dep.accion(s);
      if (a === 'trabajar') log.trabajos++;
      const R = P2.jugarSemana(s, a) || P2.jugarSemana(s, 'descansar');
      if (!R) { if (opc.debug) console.log('atasco semana', s.semana, a, JSON.stringify(s.pendiente)); log.atascos++; s.pendiente = null; s.cola = []; continue; }
      if (s.p.energia < 0) log.energiaNeg = true;
      if (s.temporada) log.ligaMax = Math.max(log.ligaMax, P2.LIGAS[s.temporada.liga].nivel);
      if (!log.invitacion && s.invitacion) { log.invitacion = s.semana - 1; log.via = s.invitacion.via; }
      for (const k of ['contrato', 'empresa', 'rentable']) if (log[k] == null && s.hitos[k]) log[k] = s.hitos[k];
      if (s.capitulo.completado && !log.capitulo) log.capitulo = s.capitulo.semana;
    }
    log.dinero = Math.round(s.p.dinero); log.patrimonio = P2.patrimonio(s); log.nivel = s.p.nivel; log.rep = s.p.rep; log.marca = P2.marcaPersonal(s);
    log.sueldo = s.contrato ? s.contrato.sueldo : 0; log.club = s.contrato ? s.contrato.oferta : null; log.negocios = s.negocios.length; log.segunda = s.oportunidad;
    log.semanas = s.semana - 1; log.hitos = Object.keys(s.hitos).length; log.patros = s.patroHist.length + s.patros.length;
    log.socio = s.socio ? { valor: s.socio.valor, aportado: s.socio.aportado, dividendos: s.socio.dividendos } : null;
    return log;
  }

  const media = l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
  const mediana = l => { if (!l.length) return null; const x = l.slice().sort((a, b) => a - b); return x[Math.floor(x.length / 2)]; };
  const pct = (l, f) => Math.round(100 * l.filter(f).length / Math.max(1, l.length));
  const r = v => (v == null ? null : Math.round(v * 10) / 10);
  function resumen(l) {
    return { partidas: l.length, capituloPct: pct(l, x => x.capitulo != null), semanaCapitulo: r(media(l.filter(x => x.capitulo).map(x => x.capitulo))),
      empresaPct: pct(l, x => x.empresa != null), semanaEmpresa: r(media(l.filter(x => x.empresa).map(x => x.empresa))), contratoPct: pct(l, x => x.contrato != null), semanaContrato: r(media(l.filter(x => x.contrato).map(x => x.contrato))),
      patrimonio60: Math.round(media(l.map(x => x.dineroEn[60] || 0))), patrimonio80: Math.round(media(l.map(x => x.dineroEn[80] || 0))), patrimonioFinal: Math.round(media(l.map(x => x.patrimonio))),
      nivel: r(media(l.map(x => x.nivel))), marca: r(media(l.map(x => x.marca))), sueldoFinal: Math.round(media(l.map(x => x.sueldo))), ligaMax: r(media(l.map(x => x.ligaMax))),
      crisis: r(media(l.map(x => x.crisis))), atascos: l.reduce((a, x) => a + x.atascos, 0), pruebasPct: pct(l, x => x.invitacion != null), trabajosMax: Math.max(0, ...l.map(x => x.trabajos)),
      ascensos: r(media(l.map(x => x.ascensos))), descensos: r(media(l.map(x => x.descensos))),
      dineroOportunidad: mediana(l.filter(x => x.dineroOportunidad != null).map(x => x.dineroOportunidad)),
      segunda: l.reduce((a, x) => { if (x.segunda) a[x.segunda] = (a[x.segunda] || 0) + 1; return a; }, {}),
      ofertas: l.reduce((a, x) => { if (x.ofertas) a[x.ofertas] = (a[x.ofertas] || 0) + 1; return a; }, {}), energiaNegativa: l.some(x => x.energiaNeg) };
  }

  // ---------- Análisis de la peluquería: ¿hay una única configuración óptima? ----------
  function analisisPeluqueria() {
    const contextos = { normal: {}, competidor: { competidor: 99 }, temporadaAlta: { temporadaAlta: 99 }, averia: { averia: 99 }, influencer: { influencer: 99 } };
    const T = NEGOCIOS.peluqueria, out = {}, s0 = { p: { rep: 20 } };
    for (const [k, ctx] of Object.entries(contextos)) {
      let mejor = null;
      for (const precio of Object.keys(T.precios)) for (const sueldo of Object.keys(T.sueldos)) for (let e = 1; e <= T.empleadosMax; e++) for (const marketing of Object.keys(T.marketing)) {
        const n = P2.nuevoNegocio('peluqueria', 0); Object.assign(n, { precio, sueldo, empleados: e, marketing, fama: 50, semanas: 5 }); Object.assign(n.ctx, ctx);
        let tot = 0;
        for (let w = 0; w < 12; w++) { const x = P2.calcularSemana(s0, n); tot += x.beneficio; n.fama = n.fama + (x.famaObjetivo - n.fama) * 0.15; }
        if (!mejor || tot > mejor.tot) mejor = { tot, cfg: `${T.precios[precio].n}/${T.sueldos[sueldo].n}/${e} emp/${T.marketing[marketing].n}` };
      }
      out[k] = { mejor: mejor.cfg, beneficio12sem: Math.round(mejor.tot) };
    }
    out.distintas = new Set(Object.values(out).map(x => x.mejor)).size;
    return out;
  }

  // ---------- Informe ----------
  function runBalance(n = 30, maxSemanas = 90) {
    const seeds = Array.from({ length: n }, (_, i) => 1000 + i + 1);
    const jugar = (B, max = maxSemanas, opc) => seeds.map(sd => jugarPartida(B, sd, max, opc));
    // 1) Rejilla completa: 5 deportivas × 4 empresariales × 3 comerciales
    const rejilla = {};
    for (const d of ['trabajo', 'entreno', 'futbol', 'descanso', 'equilibrada']) for (const e of Object.keys(EMPRESARIAL)) for (const c of Object.keys(COMERCIAL)) {
      rejilla[`${d}/${e}/${c}`] = resumen(jugar(crearBot(d, e, c)));
    }
    const marginal = (pos, ids) => Object.fromEntries(ids.map(id => {
      const filas = Object.entries(rejilla).filter(([k]) => k.split('/')[pos] === id).map(([, v]) => v);
      return [id, { capituloPct: r(media(filas.map(f => f.capituloPct))), semanaCapitulo: r(media(filas.map(f => f.semanaCapitulo).filter(x => x != null))), patrimonioFinal: Math.round(media(filas.map(f => f.patrimonioFinal))), nivel: r(media(filas.map(f => f.nivel))), crisis: r(media(filas.map(f => f.crisis))) }];
    }));
    // 2) Prueba específica: todas pueden comprar (gestión inteligente, patrocinios locales), 100 semanas
    const deportivas = Object.fromEntries(['equilibrada', 'entreno', 'futbol', 'descanso', 'trabajo'].map(d => [d, resumen(jugar(crearBot(d, 'inteligente', 'locales'), 100, { seguir: true }))]));
    // 3) Caja inicial con el MISMO gestor inteligente
    const cajas = Object.fromEntries([0, 1, 2].map(i => [NEGOCIOS.peluqueria.cajas[i], resumen(jugar(crearBot('equilibrada', 'inteligente', 'locales', { cajaForzada: i }), 100, { seguir: true }))]));
    // 4) Ruta «sacrifico la carrera por la empresa»: imagen + caja mínima + gestor inteligente + patrocinios máximos
    // Mismo nivel de patrocinios (máximos) para que solo cambie la carrera deportiva
    const rutas = {
      imagenEmpresa: resumen(jugar(crearBot('imagen', 'agresiva', 'maximos'), 100, { seguir: true })),
      imagenInteligente: resumen(jugar(crearBot('imagen', 'inteligente', 'maximos'), 100, { seguir: true })),
      equilibradaMax: resumen(jugar(crearBot('equilibrada', 'inteligente', 'maximos'), 100, { seguir: true })),
      entrenoMax: resumen(jugar(crearBot('entreno', 'inteligente', 'maximos'), 100, { seguir: true })),
    };
    // 5) Atlético frente a Puerto en la misma partida (solo semillas con las dos ofertas)
    const mismaPartida = {};
    for (const club of ['puerto', 'atletico']) {
      const l = seeds.map(sd => jugarPartida(crearBot('equilibrada', 'inteligente', 'locales'), sd, 81, { club, seguir: true })).filter(x => x.ofertas && x.ofertas.includes('atletico'));
      mismaPartida[club] = Object.assign(resumen(l), { patrimonio25: Math.round(media(l.map(x => x.dineroEn[25] || 0))), patrimonio40: Math.round(media(l.map(x => x.dineroEn[40] || 0))) });
    }
    // 6) Segunda inversión: las tres opciones con las mismas partidas
    const segundas = Object.fromEntries(['local', 'segunda', 'socio'].map(o => [o, resumen(jugar(Object.assign(crearBot('equilibrada', 'inteligente', 'locales'), { emp: Object.assign({}, EMPRESARIAL.inteligente, { segunda: [o] }) }), 110, { seguir: true }))]));
    const pel = analisisPeluqueria();
    const R = rejilla, eq = deportivas.equilibrada;
    const comprobaciones = [
      ['Ninguna estrategia deportiva de una sola acción completa más capítulos que la equilibrada (todas pueden comprar)', ['entreno', 'futbol', 'descanso', 'trabajo'].every(d => deportivas[d].capituloPct <= eq.capituloPct)],
      ['Trabajar en vez de jugar: contrato y capítulo más tarde que la equilibrada', deportivas.trabajo.semanaContrato > eq.semanaContrato && (deportivas.trabajo.semanaCapitulo || 999) > eq.semanaCapitulo],
      ['No se puede trabajar indefinidamente en el barrio (máx. 8 semanas)', Object.values(R).every(x => x.trabajosMax <= CFG.captacion.semanas + 2)],
      ['Las pruebas dan conjuntos de ofertas distintos', new Set(Object.values(R).flatMap(x => Object.keys(x.ofertas))).size >= 3],
      ['Puerto da más al principio; Atlético más nivel y más patrimonio a medio plazo', mismaPartida.puerto.patrimonio25 > mismaPartida.atletico.patrimonio25 && mismaPartida.atletico.nivel > mismaPartida.puerto.nivel && mismaPartida.atletico.patrimonio80 > mismaPartida.puerto.patrimonio80],
      ['Caja mínima: compra antes pero con más crisis que la máxima', cajas[1500].semanaEmpresa < cajas[5500].semanaEmpresa && cajas[1500].crisis > cajas[5500].crisis],
      ['Caja mínima no es la mejor en todo (capítulo, patrimonio y sin riesgo a la vez)', !(cajas[1500].capituloPct >= Math.max(cajas[3000].capituloPct, cajas[5500].capituloPct) && cajas[1500].patrimonio80 >= Math.max(cajas[3000].patrimonio80, cajas[5500].patrimonio80) && cajas[1500].crisis <= Math.min(cajas[3000].crisis, cajas[5500].crisis))],
      ['Ruta «imagen + empresa»: termina antes el capítulo, pero con coste deportivo (nivel, sueldo, marca personal y categoría)', rutas.imagenEmpresa.semanaCapitulo < rutas.equilibradaMax.semanaCapitulo && rutas.imagenEmpresa.nivel < rutas.equilibradaMax.nivel - 5 && rutas.imagenEmpresa.sueldoFinal < rutas.equilibradaMax.sueldoFinal * 0.7 && rutas.imagenEmpresa.marca < rutas.equilibradaMax.marca && rutas.imagenEmpresa.ligaMax < rutas.equilibradaMax.ligaMax],
      ['Ruta «imagen + empresa»: no es la mejor para crecer a largo plazo (patrimonio a 100 semanas, mismos patrocinios)', Math.max(rutas.imagenEmpresa.patrimonioFinal, rutas.imagenInteligente.patrimonioFinal) < Math.max(rutas.equilibradaMax.patrimonioFinal, rutas.entrenoMax.patrimonioFinal)],
      ['Las tres segundas inversiones son viables (todas se eligen y completan el capítulo)', Object.values(segundas).every(x => x.capituloPct >= 50)],
      ['La peluquería no tiene una única configuración óptima', pel.distintas >= 3],
      ['Todas las combinaciones firman contrato', Object.values(R).every(x => x.contratoPct >= 95)],
      ['Energía nunca negativa', Object.values(R).every(x => !x.energiaNegativa)],
      ['Sin decisiones atascadas', Object.values(R).every(x => x.atascos === 0) && Object.values(deportivas).every(x => x.atascos === 0)],
    ];
    return { partidasPorCombinacion: n, marginales: { deportiva: marginal(0, ['trabajo', 'entreno', 'futbol', 'descanso', 'equilibrada']), empresarial: marginal(1, Object.keys(EMPRESARIAL)), comercial: marginal(2, Object.keys(COMERCIAL)) },
      deportivasPuedenComprar: deportivas, cajas, rutas, mismaPartida, segundas, peluqueria: pel, rejilla, comprobaciones: comprobaciones.map(([t, ok]) => ({ t, ok })) };
  }

  // Políticas con nombre (las usan los tests y la interfaz): todas con gestión inteligente y patrocinios locales
  const POLITICAS = {
    equilibrada: { n: 'Equilibrada', bot: crearBot('equilibrada', 'inteligente', 'locales') },
    todoEntreno: { n: 'Solo entrenamiento', bot: crearBot('entreno', 'inteligente', 'locales') },
    todoFutbol: { n: 'Solo fútbol', bot: crearBot('futbol', 'inteligente', 'locales') },
    todoDescanso: { n: 'Solo descanso', bot: crearBot('descanso', 'inteligente', 'locales') },
    todoTrabajo: { n: 'Trabajo primero', bot: crearBot('trabajo', 'inteligente', 'locales') },
    imagen: { n: 'Imagen + empresa', bot: crearBot('imagen', 'agresiva', 'maximos') },
  };
  for (const P of Object.values(POLITICAS)) { P.accion = P.bot.dep.accion; P.oferta = P.bot.dep.clubes; }

  Object.assign(P2, { DEPORTIVA, EMPRESARIAL, COMERCIAL, POLITICAS, crearBot, jugarPartida, runBalance, analisisPeluqueria, gestorListo, resumenPartidas: resumen });
})(globalThis.P2 = globalThis.P2 || {});
