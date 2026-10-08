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
    if (s.pendiente) return null;
    const especial = accion === '__acto' || accion === '__evento';
    if (!especial && P2.bloqueoAccion(s, accion)) return null;
    const R = nuevoR(s);
    const m = s.semanaMods && s.semanaMods.semana === s.semana ? s.semanaMods : {};
    Object.assign(R, { bonusNota: m.bonusNota || 0, riesgoLesion: m.riesgoLesion || 1, gestion: !!m.gestion, plazaX2: !!m.plazaX2 });
    const lesionInicio = s.p.lesion > 0;
    const repAntes = s.p.rep;

    if (!especial) P2.tele(s, 'accion', { id: accion });
    if (accion === '__acto') R.lineas.push(['📣', 'Dedicas la semana al acto de tu patrocinador.']);
    else if (accion === '__evento') R.lineas.push(['⏳', `La semana se va en: ${(opc && opc.motivo) || 'lo que has decidido'}.`]);
    else P2.aplicarAccion(s, accion, R);
    if (R.plazaX2 && accion === 'plaza') { const extra = r1(s.p.rep - repAntes); s.p.rep = r1(clamp(s.p.rep + extra, 0, 100)); R.lineas.push(['👀', `El ojeador estaba en la plaza: tu reputación sube el doble (+${nf(extra)} más).`, 'bien']); }
    s.accionesHechas = (s.accionesHechas || 0) + 1;

    // Según la fase
    if (s.fase === 'barrio') P2.revisarOjeador(s, R);
    if (s.fase === 'pruebas' && s.invitacion && s.semana >= s.invitacion.dia) P2.diaDePruebas(s, R, s.invitacion.via);
    if ((s.fase === 'club' || s.fase === 'amateur') && s.temporada && !s.temporada.cerrada) {
      P2.jugarPartido(s, R);
      const O = P2.oferta(s), bruto = s.contrato.sueldo;
      const neto = O.amateur ? bruto : Math.round(bruto * (1 - CFG.club.impuesto));
      s.p.dinero += neto; s.acum.sueldo += neto; s.acum.impuestos += bruto - neto;
      R.ingresos.push([O.amateur ? 'Dietas del club' : 'Sueldo (neto)', neto]);
      const gv = O.amateur ? 20 : CFG.club.gastosVida;
      s.p.dinero -= gv; s.acum.gastos += gv; R.ingresos.push(['Gastos personales', -gv]);
    }
    if (s.fase === 'club') P2.semanaPatros(s, R);
    for (const n of s.negocios.slice()) P2.semanaNegocio(s, n, R, { gestion: R.gestion && n === s.negocios[0] });
    P2.semanaSocio(s, R);
    P2.procesarAgenda(s, R);

    // Recuperación, lesiones
    const enEquipo = s.fase === 'club' || s.fase === 'amateur';
    s.p.energia = clamp(s.p.energia + (enEquipo ? CFG.energia.recuperacionClub : CFG.energia.recuperacionBarrio) + P2.efectoPatro(s, 'recuperacion'), 0, CFG.energia.max);
    if (lesionInicio && s.p.lesion > 0) { s.p.lesion--; if (!s.p.lesion) R.lineas.push(['✅', 'Recuperado/a de la lesión.', 'bien']); }

    // Fin de la captación sin prueba: ruta amateur (nunca game over)
    if (s.fase === 'barrio' && !s.invitacion && s.semana >= CFG.captacion.semanas) {
      P2.encolar(s, { tipo: 'ofertas', origen: 'sinOferta', ofertas: ['sanroque'], score: null });
      R.lineas.push(['⏰', 'Se acaba el periodo de captación.', 'mal']);
    }
    if (s.fase === 'amateur') {
      s.amateurSemanas = (s.amateurSemanas || 0) + 1;
      if (s.amateurSemanas % CFG.amateur.repescaCada === 0) P2.encolar(s, { tipo: 'repesca' });
      if (s.temporada && s.temporada.cerrada) P2.nuevaTemporada(s, R);
    }
    P2.revisarHitos(s, R);
    P2.revisarSecciones(s, R);
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

    R.dinero = s.p.dinero - R.dinero0;
    R.energia = s.p.energia - R.energia0;
    s.ultimo = R;
    for (const [ic, t] of R.lineas.slice(0, 6)) P2.anotar(s, ic, t);
    return R;
  }

  // Resolver la decisión pendiente. Devuelve lo que se mostrará como consecuencia inmediata
  function resolverDecision(s, opId) {
    const ev = s.pendiente; if (!ev) return null;
    const D = P2.DECISIONES[ev.tipo]; if (!D) { P2.siguiente(s); return null; }
    const vista = D.vista(s, ev);
    const o = vista && vista.ops.find(x => x.id === opId);
    if (!o || o.bloqueo) return null;
    const R = nuevoR(s);
    const r = D.resolver(s, ev, opId, R);
    if (!r) return null;
    P2.tele(s, 'decision', { tipo: ev.tipo, id: ev.id || ev.origen || ev.marca || null, op: opId });
    if (r.semana) s.pendiente = null; else P2.siguiente(s);
    P2.revisarSecciones(s, R);
    s.ultimaDecision = { semana: s.semana, ic: r.ic, titulo: r.titulo, texto: r.texto, lineas: R.lineas, hitos: R.hitos, desbloqueos: R.desbloqueos, firma: r.firma || null };
    if (r.texto) P2.anotar(s, r.ic, r.texto);
    // Un acto de patrocinio ocupa la semana entera
    if (r.semana) { const W = jugarSemana(s, r.semana, { motivo: o.n.toLowerCase() }); if (W) { s.ultimaDecision.semanaJugada = true; W.lineas.unshift([r.ic, `${r.titulo}: ${r.texto}`]); } if (!s.pendiente) P2.siguiente(s); }
    if (!s.pendiente) { const a = P2.actoPendiente(s); if (a) P2.encolar(s, a); }
    return s.ultimaDecision;
  }

  Object.assign(P2, { jugarSemana, resolverDecision });
})(globalThis.P2 = globalThis.P2 || {});
