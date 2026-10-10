/* =====================================================================
   09 · LA SEMANA: una acción por semana y todo lo que pasa después
   jugarSemana(s, acción) y resolverDecision(s, opción) son las dos únicas
   puertas por las que cambia la partida (la interfaz y el simulador usan las mismas).
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, OFERTAS, eur, nf, clamp, r1 } = P2;

  function nuevoR(s) { return { semana: s.semana, lineas: [], porque: [], ingresos: [], hitos: [], desbloqueos: [], partido: null, dinero0: s.p.dinero, energia0: s.p.energia, decision: null }; }

  function jugarSemana(s, accion, opc) {
    P2.activarDeporte(s.deporte);
    if (s.pendiente) return null;
    const especial = accion === '__acto' || accion === '__evento';
    if (!especial && P2.bloqueoAccion(s, accion)) return null;
    // Momento clave de la semana (el mismo que vio la interfaz antes de jugar). Lo que llega del minijuego solo cuenta si coincide
    const mom = !especial && P2.momentoSemana ? P2.momentoSemana(s, accion) : null, mjIn = opc && opc.minijuego;
    const tipoIn = mjIn ? (String(mjIn.tipo) === 'penalti' ? 'partido' : String(mjIn.tipo)) : null;
    s.mjSemana = mjIn && mom && tipoIn === mom.ctx ? { tipo: mom.ctx, inst: mom.inst, imp: mom.imp, minuto: mom.minuto, p: clamp(+mjIn.p || 0, 0, 1), semana: s.semana } : null;
    const R = nuevoR(s);
    const m = s.semanaMods && s.semanaMods.semana === s.semana ? s.semanaMods : {};
    Object.assign(R, { bonusNota: m.bonusNota || 0, riesgoLesion: m.riesgoLesion || 1, gestion: !!m.gestion, plazaX2: !!m.plazaX2 });
    const lesionInicio = s.p.lesion > 0;
    if (P2.aplicarPreparacion) P2.aplicarPreparacion(s, accion, R);   // la semana antes de un gran partido cuenta
    s.ultAcciones = (Array.isArray(s.ultAcciones) ? s.ultAcciones : []).concat({ semana: s.semana, a: accion }).slice(-8);
    const repAntes = s.p.rep;
    const din0 = s.p.dinero, trab0 = s.acum.trabajo;   // para «Tu bolsillo» (P2.8)

    if (!especial) P2.tele(s, 'accion', { id: accion });
    if (accion === '__acto') R.lineas.push(['📣', 'Dedicas la semana al acto de tu patrocinador.']);
    else if (accion === '__evento') R.lineas.push(['⏳', `La semana se va en: ${(opc && opc.motivo) || 'lo que has decidido'}.`]);
    else { const x = P2.aplicarAccionSemana(s, accion, R); R.variante = x.v ? { ic: x.v.ic, n: x.v.n, i: x.v.i } : null; R.destacada = x.dest; }
    if (R.plazaX2 && accion === 'plaza') { const extra = r1(s.p.rep - repAntes); s.p.rep = r1(clamp(s.p.rep + extra, 0, 100)); R.lineas.push(['👀', `El ojeador estaba en la plaza: tu reputación sube el doble (+${nf(extra)} más).`, 'bien']); }
    s.accionesHechas = (s.accionesHechas || 0) + 1;
    if (P2.cobroTrabajo) P2.cobroTrabajo(s, s.acum.trabajo - trab0, R);

    // Según la fase
    if (s.fase === 'barrio') P2.revisarOjeador(s, R);
    if (s.fase === 'pruebas' && s.invitacion && s.semana >= s.invitacion.dia) P2.diaDePruebas(s, R, s.invitacion.via);
    if ((s.fase === 'club' || s.fase === 'amateur') && s.temporada && (!s.temporada.cerrada || P2.promoPendiente(s))) {
      if (P2.promoPendiente(s)) P2.jugarPromocion(s, R);   // la liga ya acabó: esta semana se decide la categoría
      else { P2.prepararCopas(s); P2.jugarPartido(s, R); }
      const O = P2.oferta(s), bruto = s.contrato.sueldo;
      const neto = O.amateur ? bruto : Math.round(bruto * (1 - CFG.club.impuesto));
      s.p.dinero += neto; s.acum.sueldo += neto; s.acum.impuestos += bruto - neto;
      R.ingresos.push([O.amateur ? 'Dietas del club' : 'Sueldo (neto)', neto]);
      const gv = O.amateur ? 20 : Math.max(10, CFG.club.gastosVida - P2.efectoTienda(s, 'gastosVida'));   // tu propia vivienda abarata vivir
      s.p.dinero -= gv; s.acum.gastos += gv; R.ingresos.push(['Gastos personales', -gv]);
    }
    if (s.fase === 'club') P2.semanaPatros(s, R);
    for (const n of s.negocios.slice()) P2.semanaNegocio(s, n, R, { gestion: R.gestion && n === s.negocios[0] });
    P2.semanaSocio(s, R);
    if (P2.semanaExpansiones) P2.semanaExpansiones(s, R);   // club, inmuebles, agencia, eventos, media (si los tienes)
    if (P2.semanaDinero) P2.semanaDinero(s, R);   // vivienda, agente, ahorro, hitos de dinero
    P2.procesarAgenda(s, R);

    // Recuperación, lesiones
    const enEquipo = s.fase === 'club' || s.fase === 'amateur';
    s.p.energia = clamp(s.p.energia + (enEquipo ? CFG.energia.recuperacionClub : CFG.energia.recuperacionBarrio) + P2.efectoPatro(s, 'recuperacion') + P2.efectoTienda(s, 'recuperacion'), 0, CFG.energia.max);
    if (lesionInicio && s.p.lesion > 0) { s.p.lesion--; if (!s.p.lesion) { s.finLesion = s.semana; R.lineas.push(['✅', 'Recuperado/a de la lesión.', 'bien']); } }

    // Fin de la captación sin prueba: ruta amateur (nunca game over)
    if (s.fase === 'barrio' && !s.invitacion && s.semana >= CFG.captacion.semanas) {
      P2.encolar(s, { tipo: 'ofertas', origen: 'sinOferta', ofertas: ['sanroque'], score: null });
      R.lineas.push(['⏰', 'Se acaba el periodo de captación.', 'mal']);
    }
    if (s.fase === 'amateur') {
      s.amateurSemanas = (s.amateurSemanas || 0) + 1;
      if (s.amateurSemanas % CFG.amateur.repescaCada === 0) P2.encolar(s, { tipo: 'repesca' });
      if (s.temporada && s.temporada.cerrada && !P2.promoPendiente(s)) P2.nuevaTemporada(s, R);
    }
    P2.revisarHitos(s, R);
    P2.revisarSecciones(s, R);
    // Momento clave: historial (cooldowns), estadísticas, logros; gran partido que se acerca; variedad de la semana
    if (mom && P2.registrarMomento) P2.registrarMomento(s, mom, s.mjSemana ? { p: s.mjSemana.p, reintentos: (mjIn && +mjIn.reintentos) || 0, simulado: !!(mjIn && mjIn.simulado) } : null, R);
    if (P2.detectarEvento) P2.detectarEvento(s, R);
    if (P2.cerrarSemanaLog) P2.cerrarSemanaLog(s, accion, R, mom);
    if (P2.recordatorioDeseo) P2.recordatorioDeseo(s, R);
    if (P2.revisarMeta) P2.revisarMeta(s, R);
    // Segunda inversión aplazada: se vuelve a proponer cuando ya puedes pagar alguna (como mucho cada 6 semanas)
    if (s.oportunidadAbierta && !s.oportunidad && s.p.dinero >= Math.min(...P2.OPORTUNIDADES.map(o => o.coste)) && s.semana - (s.recordatorioOp || 0) >= 6) {
      s.recordatorioOp = s.semana; P2.encolar(s, { tipo: 'oportunidad' });
    }

    // Avanza el calendario
    s.semana++;
    if ((s.semana - 1) % 52 === 0) s.edad++;
    s.semanaMods = null;
    s.eleccion = null;   // cada semana se elige de nuevo: no se arrastra la acción anterior
    if (!s.pendiente) { const a = P2.actoPendiente(s); if (a) P2.encolar(s, a); }
    if (!s.pendiente && !s.cola.length) P2.revisarOfertasMarca(s);
    if (!s.pendiente && !s.cola.length) P2.tirarSucesos(s);

    if (s.mjSemana) R.minijuego = s.mjSemana;
    s.mjSemana = null;
    if (P2.recargarVidas(s)) R.lineas.push(['❤️', `Recuperas una vida para los minijuegos (${P2.vidas(s).n}/${P2.VIDAS.max}).`, 'bien']);
    P2.anotarHistoria(s, 'semana');
    P2.revisarDeseo(s);
    if (P2.cerrarBolsillo) P2.cerrarBolsillo(s, R, din0);
    R.dinero = s.p.dinero - R.dinero0;
    R.energia = s.p.energia - R.energia0;
    s.ultimo = R;
    for (const [ic, t] of R.lineas.slice(0, 6)) P2.anotar(s, ic, t);
    return R;
  }

  // Resolver la decisión pendiente. Devuelve lo que se mostrará como consecuencia inmediata
  function resolverDecision(s, opId) {
    P2.activarDeporte(s.deporte);
    const ev = s.pendiente; if (!ev) return null;
    const D = P2.DECISIONES[ev.tipo]; if (!D) { P2.siguiente(s); return null; }
    const vista = D.vista(s, ev);
    const o = vista && vista.ops.find(x => x.id === opId);
    if (!o || o.bloqueo) return null;
    const R = nuevoR(s), nx0 = s.nExtracto || 0;
    const r = D.resolver(s, ev, opId, R);
    if (!r) return null;
    if (P2.etiquetarSemana) {   // para el director de eventos: qué tipo de cosas pasan
      const E = ev.tipo === 'suceso' && P2.SUCESOS.find(x => x.id === ev.id);
      P2.etiquetarSemana(s, E ? (E.ambito === 'relacion' ? 'relationship' : E.ambito === 'empresa' ? 'business' : 'event') : ev.tipo === 'acto' || ev.tipo === 'marca' ? 'sponsor' : 'event');
      if (E && E.cruce) P2.etiquetarSemana(s, 'business');
    }
    P2.tele(s, 'decision', { tipo: ev.tipo, id: ev.id || ev.origen || ev.marca || null, op: opId });
    if (r.semana) s.pendiente = null; else P2.siguiente(s);
    P2.revisarSecciones(s, R);
    s.ultimaDecision = { semana: s.semana, ic: r.ic, titulo: r.titulo, texto: r.texto, lineas: R.lineas, hitos: R.hitos, desbloqueos: R.desbloqueos, firma: r.firma || null, ir: r.ir || null, desgloses: (s.extractos || []).filter(x => x.n > nx0) };
    if (r.texto) P2.anotar(s, r.ic, r.texto);
    // Un acto de patrocinio ocupa la semana entera
    if (r.semana) { const W = jugarSemana(s, r.semana, { motivo: o.n.toLowerCase() }); if (W) { s.ultimaDecision.semanaJugada = true; W.lineas.unshift([r.ic, `${r.titulo}: ${r.texto}`]); } if (!s.pendiente) P2.siguiente(s); }
    if (!s.pendiente) { const a = P2.actoPendiente(s); if (a) P2.encolar(s, a); }
    P2.revisarDeseo(s);
    return s.ultimaDecision;
  }

  Object.assign(P2, { jugarSemana, resolverDecision });
})(globalThis.P2 = globalThis.P2 || {});
