/* =====================================================================
   10 · SIMULACIÓN Y BALANCE
   Políticas automáticas que juegan sin pulsar nada. runBalance() juega
   cientos de partidas por política y devuelve un informe con comprobaciones.
   Usa exactamente las mismas funciones que la interfaz (jugarSemana y resolverDecision).
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, OFERTAS, MARCAS, NEGOCIOS, OPORTUNIDADES } = P2;

  // ---------- Piezas comunes ----------
  const libres = s => P2.accionesDisponibles(s).filter(a => !a.bloqueo).map(a => a.id);
  function primeraLibre(s, prefs) { const l = libres(s); return prefs.find(p => l.includes(p)) || (l.includes('descansar') ? 'descansar' : l[0]); }
  // Gestor «listo»: prueba todas las configuraciones y se queda con la que más gana (sin bajar sueldos, que hunde el ambiente)
  function gestorListo(s, n) {
    const T = NEGOCIOS[n.tipo];
    let mejor = null;
    for (const precio of Object.keys(T.precios)) for (const sueldo of Object.keys(T.sueldos)) for (let e = 1; e <= T.empleadosMax; e++) for (const marketing of Object.keys(T.marketing)) {
      if (T.sueldos[sueldo].coste < T.sueldos[n.sueldo].coste) continue;
      const c = Object.assign({}, n, { precio, sueldo, empleados: e, marketing, ctx: Object.assign({}, n.ctx) });
      const x = P2.calcularSemana(s, c);
      const v = x.beneficio + (x.famaObjetivo - n.fama) * 4;   // también mira hacia dónde va la fama
      if (!mejor || v > mejor.v) mejor = { v, precio, sueldo, empleados: e, marketing };
    }
    for (const k of ['precio', 'sueldo', 'marketing']) if (n[k] !== mejor[k]) P2.configurar(s, n.id, k, mejor[k]);
    if (n.empleados !== mejor.empleados) P2.configurar(s, n.id, 'empleados', mejor.empleados);
    return mejor;
  }
  const mejorOferta = (orden) => (s, ops) => { for (const o of orden) { const x = ops.find(op => op.id === o && !op.bloqueo); if (x) return x.id; } return null; };

  // ---------- Políticas ----------
  // accion(s): acción de la semana · oferta: preferencia de clubes · tags: qué valora en los sucesos
  // marcas: firma patrocinios · compra: índice de caja inicial (o null si no compra) · gestor: 'listo' | 'fijo'
  const POLITICAS = {
    todoTrabajo: { n: 'Todo trabajo', accion: s => primeraLibre(s, ['trabajar', 'mediaJornada', 'gestionar', 'prensa']), oferta: ['puerto', 'renovar', 'costaReal', 'atleticoFilial', 'atleticoFormacion', 'sanroque'], tags: ['dinero'], marcas: true, compra: 0, gestor: 'fijo', acto: 'no' },
    todoEntreno: { n: 'Todo entrenamiento', accion: s => primeraLibre(s, ['entrenar', 'entrenoExtra']), oferta: ['atleticoFilial', 'atleticoFormacion', 'atleticoPrimero', 'costaReal', 'renovar', 'puerto', 'sanroque'], tags: ['deporte'], marcas: false, compra: null, gestor: 'fijo', acto: 'no' },
    todoDescanso: { n: 'Todo descanso', accion: () => 'descansar', oferta: ['renovar', 'puerto', 'atleticoFormacion', 'atleticoFilial', 'sanroque'], tags: ['seguro'], marcas: false, compra: null, gestor: 'fijo', acto: 'no' },
    todoFutbol: { n: 'Todo fútbol', accion: s => primeraLibre(s, ['plaza', 'torneo', 'jornada', 'entrenoExtra']), oferta: ['atleticoFilial', 'atleticoFormacion', 'atleticoPrimero', 'costaReal', 'renovar', 'puerto', 'sanroque'], tags: ['deporte'], marcas: false, compra: null, gestor: 'fijo', acto: 'no' },
    dineroPrimero: { n: 'Dinero primero',
      accion: s => (s.fase === 'barrio' && s.semana >= 6 && !s.invitacion ? primeraLibre(s, ['plaza', 'trabajar']) : primeraLibre(s, ['trabajar', 'mediaJornada', 'gestionar', 'entrenoExtra'])),
      oferta: ['puerto', 'renovar', 'costaReal', 'atleticoPrimero', 'atleticoFilial', 'atleticoFormacion', 'sanroque'], tags: ['dinero'], marcas: true, compra: 0, gestor: 'listo', acto: 'ir' },
    deportePrimero: { n: 'Deporte primero',
      accion: s => (s.fase === 'pruebas' && !s.cont.preparador && s.p.dinero >= 150 ? 'preparador' : primeraLibre(s, ['jornada', 'torneo', 'entrenar', 'entrenoExtra'])),
      oferta: ['atleticoFilial', 'atleticoFormacion', 'atleticoPrimero', 'costaReal', 'renovar', 'puerto', 'sanroque'], tags: ['deporte'], marcas: 'deportiva', compra: 2, gestor: 'fijo', acto: 'aplazar' },
    patrociniosPrimero: { n: 'Patrocinios primero', accion: s => primeraLibre(s, ['plaza', 'prensa', 'torneo', 'jornada', 'entrenoExtra']), oferta: ['puerto', 'atleticoFilial', 'atleticoFormacion', 'renovar', 'costaReal', 'atleticoPrimero', 'sanroque'], tags: ['dinero'], marcas: true, compra: 1, gestor: 'fijo', acto: 'ir' },
    equilibrada: { n: 'Equilibrada',
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
      },
      oferta: ['atleticoFilial', 'atleticoPrimero', 'atleticoFormacion', 'costaReal', 'renovar', 'puerto', 'sanroque'], tags: ['seguro', 'deporte'], marcas: 1, compra: 1, gestor: 'listo', acto: 'ir' },
  };

  // Decide una decisión pendiente según la política
  function decidir(s, Pol, opc = {}) {
    const v = P2.vistaPendiente(s), ev = s.pendiente;
    if (!v) { P2.siguiente(s); return; }
    const ops = v.ops.filter(o => !o.bloqueo);
    let id = null;
    if (ev.tipo === 'ofertas') id = mejorOferta((opc.club && ev.origen !== 'fin' ? (opc.club === 'puerto' ? ['puerto'] : ['atleticoFilial', 'atleticoFormacion']) : []).concat(Pol.oferta, ['seguir']))(s, ops);
    else if (ev.tipo === 'acto') id = (ops.find(o => o.id === Pol.acto) || ops.find(o => o.id === 'ir')).id;
    else if (ev.tipo === 'repesca') id = 'ir';
    else if (ev.tipo === 'crisis') id = (ops.find(o => o.id === 'aportar') || ops.find(o => o.id === 'prestamo') || ops.find(o => o.id === 'recortar')).id;
    else if (ev.tipo === 'oportunidad') id = (ops.find(o => o.id === 'local') || ops.find(o => o.id === 'socio') || ops.find(o => o.id === 'luego')).id;
    else {
      for (const t of Pol.tags) { const o = ops.find(x => (x.tags || []).includes(t)); if (o) { id = o.id; break; } }
      if (!id) id = ops[0].id;
    }
    if (!P2.resolverDecision(s, id)) { s.pendiente = null; s.cola = []; }
  }
  // Lo que hace la política fuera de la semana: firmar marcas, comprar empresa, gestionarla, segunda inversión
  function gestionar(s, Pol) {
    if (Pol.marcas && s.fase === 'club') {
      for (const M of MARCAS) {
        if (Pol.marcas === 'deportiva' && M.tier !== 'deportiva') continue;
        if (typeof Pol.marcas === 'number' && s.patros.length >= Pol.marcas && !(M.tier === 'deportiva' && s.patros.every(c => MARCAS.find(m => m.id === c.id).tier !== 'deportiva'))) continue;
        if (!P2.bloqueoMarca(s, M)) P2.firmarMarca(s, M.id, null);
      }
    }
    if (Pol.compra != null && !s.negocios.length && !s.oportunidad) {
      const i = Pol.compra; if (!P2.bloqueoCompra(s, 'peluqueria', i)) P2.comprarNegocio(s, 'peluqueria', i, null);
    }
    for (const n of s.negocios) {
      if (Pol.gestor === 'listo') gestorListo(s, n);
      if (n.caja > 3000 && Pol.gestor === 'listo') P2.retirar(s, n.id, n.caja - 2000);
    }
    if (s.oportunidadAbierta && !s.oportunidad) {
      const o = OPORTUNIDADES.find(x => x.id === 'local') && s.p.dinero >= 14000 ? 'local' : s.p.dinero >= 4000 ? 'socio' : null;
      if (o) P2.elegirOportunidad(s, o);
    }
  }

  function jugarPartida(polId, seed, maxSemanas = 90, opc = {}) {
    const Pol = POLITICAS[polId], s = P2.nuevaPartida({ seed, nombre: 'Bot' });
    const log = { pol: polId, seed, invitacion: null, via: null, score: null, ofertas: null, primerClub: null, contrato: null, empresa: null, rentable: null, capitulo: null,
      energiaNeg: false, trabajos: 0, crisis: 0, cierres: 0, amateurSem: 0, maxPatros: 0, actos: 0, buclesDecision: 0 };
    log.dineroEn = {};
    for (let w = 0; w < maxSemanas && (opc.seguir || !s.capitulo.completado); w++) {
      let g = 0;
      while (s.pendiente && g++ < 8) {
        const ev = s.pendiente;
        if (ev.tipo === 'ofertas' && ev.origen !== 'fin' && log.ofertas == null && ev.origen !== 'sinOferta') { log.ofertas = ev.ofertas.slice().sort().join('+'); log.score = ev.score; }
        if (ev.tipo === 'crisis') log.crisis++;
        decidir(s, Pol, opc);
        if (!log.primerClub && s.contrato && !OFERTAS[s.contrato.oferta].amateur) log.primerClub = s.contrato.oferta;
      }
      if (s.pendiente) { log.buclesDecision++; s.pendiente = null; s.cola = []; }
      gestionar(s, Pol);
      g = 0; while (s.pendiente && g++ < 8) decidir(s, Pol, opc);
      if (s.capitulo.completado && !log.capitulo) log.capitulo = s.capitulo.semana;
      if (s.capitulo.completado && !opc.seguir) break;
      if ([25, 40, 60].includes(s.semana)) log.dineroEn[s.semana] = P2.patrimonio(s);
      const a = Pol.accion(s);
      if (a === 'trabajar') log.trabajos++;
      const R = P2.jugarSemana(s, a) || P2.jugarSemana(s, 'descansar');
      if (!R) { log.buclesDecision++; continue; }
      if (s.p.energia < 0) log.energiaNeg = true;
      if (s.fase === 'amateur') log.amateurSem++;
      log.maxPatros = Math.max(log.maxPatros, s.patros.length);
      if (!log.invitacion && s.invitacion) { log.invitacion = s.semana - 1; log.via = s.invitacion.via; }
      for (const k of ['contrato', 'empresa', 'rentable']) if (log[k] == null && s.hitos[k]) log[k] = s.hitos[k];
      if (s.capitulo.completado) log.capitulo = s.capitulo.semana;
    }
    log.dinero = Math.round(s.p.dinero); log.patrimonio = P2.patrimonio(s); log.nivel = s.p.nivel; log.rep = s.p.rep;
    log.negocios = s.negocios.length; log.semanas = s.semana - 1; log.hitos = Object.keys(s.hitos).length;
    log.actos = s.patros.reduce((a, c) => a + c.actos, 0) + s.patroHist.length;
    return log;
  }

  const media = l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
  const pct = (l, f) => Math.round(100 * l.filter(f).length / Math.max(1, l.length));
  const r = v => (v == null ? '—' : Math.round(v * 10) / 10);

  // ---------- Peluquería: ¿hay una única configuración óptima? ----------
  function analisisPeluqueria() {
    const contextos = {
      normal: {}, competidor: { competidor: 99 }, temporadaAlta: { temporadaAlta: 99 }, averia: { averia: 99 }, influencer: { influencer: 99 },
    };
    const T = NEGOCIOS.peluqueria, out = {};
    const s0 = { p: { rep: 20 } };
    for (const [k, ctx] of Object.entries(contextos)) {
      let mejor = null;
      for (const precio of Object.keys(T.precios)) for (const sueldo of Object.keys(T.sueldos)) for (let e = 1; e <= T.empleadosMax; e++) for (const marketing of Object.keys(T.marketing)) {
        const n = P2.nuevoNegocio('peluqueria', 0); Object.assign(n, { precio, sueldo, empleados: e, marketing, fama: 50 }); Object.assign(n.ctx, ctx);
        let tot = 0;
        for (let w = 0; w < 12; w++) { const x = P2.calcularSemana(s0, n); tot += x.beneficio; n.fama = n.fama + (x.famaObjetivo - n.fama) * 0.15; }
        if (!mejor || tot > mejor.tot) mejor = { tot, cfg: `${T.precios[precio].n}/${T.sueldos[sueldo].n}/${e} emp/${T.marketing[marketing].n}` };
      }
      out[k] = { mejor: mejor.cfg, beneficio12sem: Math.round(mejor.tot) };
    }
    out.distintas = new Set(Object.values(out).map(x => x.mejor)).size;
    return out;
  }

  function runBalance(n = 200, maxSemanas = 90) {
    const res = {}, todos = {};
    for (const id of Object.keys(POLITICAS)) {
      const l = []; for (let i = 1; i <= n; i++) l.push(jugarPartida(id, 1000 + i, maxSemanas));
      todos[id] = l;
      const conClub = l.filter(x => x.primerClub);
      res[id] = {
        politica: POLITICAS[id].n,
        pruebasPct: pct(l, x => x.invitacion != null),
        contratoPct: pct(l, x => x.contrato != null), semanaContrato: r(media(l.filter(x => x.contrato).map(x => x.contrato))),
        empresaPct: pct(l, x => x.empresa != null), semanaEmpresa: r(media(l.filter(x => x.empresa).map(x => x.empresa))),
        capituloPct: pct(l, x => x.capitulo != null), semanaCapitulo: r(media(l.filter(x => x.capitulo).map(x => x.capitulo))),
        patrimonio: Math.round(media(l.map(x => x.patrimonio))), nivel: r(media(l.map(x => x.nivel))), fama: r(media(l.map(x => x.rep))),
        crisisMedia: r(media(l.map(x => x.crisis))), trabajosMax: Math.max(...l.map(x => x.trabajos)),
        ofertas: l.reduce((a, x) => { if (x.ofertas) a[x.ofertas] = (a[x.ofertas] || 0) + 1; return a; }, {}),
        primerClub: conClub.reduce((a, x) => { a[x.primerClub] = (a[x.primerClub] || 0) + 1; return a; }, {}),
        energiaNegativa: l.some(x => x.energiaNeg), atascos: l.reduce((a, x) => a + x.buclesDecision, 0),
      };
    }
    // Atlético frente a Puerto (todas las políticas, por primer club)
    const all = Object.values(todos).flat();
    const club = id => { const l = all.filter(x => x.primerClub && x.primerClub.startsWith(id)); return { partidas: l.length, nivel: r(media(l.map(x => x.nivel))), patrimonio: Math.round(media(l.map(x => x.patrimonio)) || 0), semanaEmpresa: r(media(l.filter(x => x.empresa).map(x => x.empresa))), capituloPct: pct(l, x => x.capitulo != null) }; };
    // Comparación justa: misma política (equilibrada) y mismas semillas, solo cambia el club cuando hay elección
    const justa = {};
    for (const club of ['puerto', 'atletico']) {
      const l = []; for (let i = 1; i <= n; i++) { const x = jugarPartida('equilibrada', 1000 + i, 70, { club, seguir: true }); if (x.ofertas && x.ofertas.includes('atletico')) l.push(x); }
      justa[club] = { partidas: l.length, patrimonioSem25: Math.round(media(l.map(x => x.dineroEn[25] || 0))), patrimonioSem40: Math.round(media(l.map(x => x.dineroEn[40] || 0))), patrimonioSem60: Math.round(media(l.map(x => x.dineroEn[60] || 0))),
        semanaEmpresa: r(media(l.filter(x => x.empresa).map(x => x.empresa))), semanaCapitulo: r(media(l.filter(x => x.capitulo).map(x => x.capitulo))), nivelSem70: r(media(l.map(x => x.nivel))), fama: r(media(l.map(x => x.rep))) };
    }
    const pelu = analisisPeluqueria();
    const R = res, legit = ['dineroPrimero', 'deportePrimero', 'patrociniosPrimero', 'equilibrada'];
    const comprobaciones = [
      ['Repetir una sola acción no es lo mejor', Math.max(R.todoTrabajo.capituloPct, R.todoEntreno.capituloPct, R.todoDescanso.capituloPct, R.todoFutbol.capituloPct) < R.equilibrada.capituloPct],
      ['Sin carrera no hay empresa, y trabajar en vez de jugar es más lento (todo trabajo tarda 8+ semanas más que equilibrada)', R.todoTrabajo.semanaContrato > R.equilibrada.semanaContrato && (R.todoTrabajo.capituloPct < R.equilibrada.capituloPct / 2 || R.todoTrabajo.semanaCapitulo >= R.equilibrada.semanaCapitulo + 8)],
      ['No se puede trabajar indefinidamente (máx. semanas de trabajo en el barrio ≤ 8)', Object.values(R).every(x => x.trabajosMax <= CFG.captacion.semanas + 2)],
      ['Las pruebas dan conjuntos de ofertas distintos', new Set(Object.values(R).flatMap(x => Object.keys(x.ofertas))).size >= 3],
      ['Atlético y Puerto: Puerto da más dinero al principio; Atlético más nivel y más patrimonio a medio plazo', justa.puerto.patrimonioSem25 > justa.atletico.patrimonioSem25 && justa.atletico.nivelSem70 > justa.puerto.nivelSem70 && justa.atletico.patrimonioSem60 > justa.puerto.patrimonioSem60],
      ['Patrocinios primero no gana a la vez en dinero y deporte', !(R.patrociniosPrimero.patrimonio >= Math.max(...legit.map(k => R[k].patrimonio)) && R.patrociniosPrimero.nivel >= Math.max(...legit.map(k => R[k].nivel)))],
      ['La peluquería no tiene una única configuración óptima', pelu.distintas >= 3],
      ['Ninguna ruta legítima queda bloqueada (todas firman contrato)', legit.every(k => R[k].contratoPct >= 95)],
      ['Energía nunca negativa', Object.values(R).every(x => !x.energiaNegativa)],
      ['Sin decisiones atascadas', Object.values(R).every(x => x.atascos === 0)],
    ];
    return { partidasPorPolitica: n, politicas: res, atleticoVsPuerto: { atletico: club('atletico'), puerto: club('puerto') }, mismaPartida: justa, peluqueria: pelu, comprobaciones: comprobaciones.map(([t, ok]) => ({ t, ok })) };
  }

  Object.assign(P2, { POLITICAS, jugarPartida, runBalance, analisisPeluqueria, gestorListo });
})(globalThis.P2 = globalThis.P2 || {});
