/* =====================================================================
   07 · EVENTOS CONTEXTUALES (data-driven)
   Cada suceso: cuándo puede salir (cond), cuánto pesa, cada cuánto (enfria),
   y 2–3 opciones con ventaja / coste / riesgo y efecto. Algunas consecuencias
   se programan para semanas después (agenda → EFECTOS).
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, rnd, clamp, r1, eur, nf } = P2;

  const mods = s => (s.semanaMods && s.semanaMods.semana === s.semana ? s.semanaMods : (s.semanaMods = { semana: s.semana }));
  const programar = (s, semanas, efecto, data = {}) => s.agenda.push({ semana: s.semana + semanas, efecto, data });
  const neg = (s, id) => s.negocios.find(n => n.id === id) || s.negocios[0];
  const ultNota = s => { const l = s.stats.notas; return l.length ? l[l.length - 1] : null; };
  const enClub = s => s.fase === 'club' && s.temporada && !s.temporada.cerrada;

  // ---- Efectos diferidos ----
  const EFECTOS = {
    charlaMister: s => { const n = ultNota(s); if (n != null && n < 6) { s.confianza = clamp(s.confianza - 6, 0, 100); return ['🗣️', `El míster te recuerda la charla: prometiste más y sacaste un ${nf(n)} (−6 confianza).`, 'mal']; } return ['🗣️', 'El míster cumple su parte: sabe que respondes.', 'bien']; },
    pedirPuesto: s => { const n = ultNota(s); if (n != null && n >= 6.5) { s.confianza = clamp(s.confianza + 6, 0, 100); return ['💪', `Aprovechaste la oportunidad (${nf(n)}): el puesto empieza a ser tuyo (+6 confianza).`, 'bien']; } s.confianza = clamp(s.confianza - 6, 0, 100); return ['😬', 'Pediste el puesto y no lo aprovechaste (−6 confianza).', 'mal']; },
    entrenoPagado: (s, d) => { s.p.nivel = r1(Math.min(P2.techoClub(s) + 2, s.p.nivel + 1)); return d.ultima ? ['🧑‍🏫', 'Última sesión con tu entrenador personal: nivel +1.'] : ['🧑‍🏫', 'Sesión con tu entrenador personal: nivel +1.']; },
    barAmigo: (s, d) => { const u = rnd(s); const v = u < 0.45 ? Math.round(d.x * 2.2) : u < 0.8 ? Math.round(d.x * 0.6) : 0; s.p.dinero += v; return v > d.x ? ['🍻', `El bar de tu amigo funciona: recuperas ${eur(v)} por tus ${eur(d.x)}.`, 'bien'] : v ? ['🍻', `El bar de tu amigo va regular: recuperas ${eur(v)} de ${eur(d.x)}.`, 'mal'] : ['🍻', `El bar de tu amigo cierra: pierdes los ${eur(d.x)}.`, 'mal']; },
    averiaVuelve: (s, d) => { const n = neg(s, d.neg); if (!n) return null; if (rnd(s) < 0.5) { n.ctx.averia = 3; return ['🔧', 'La reparación barata no aguanta: vuelve la avería (3 semanas a medio gas).', 'mal']; } return ['🔧', 'La reparación barata aguanta. Has tenido suerte.', 'bien']; },
    finTemporal: (s, d) => { const n = neg(s, d.neg); if (!n) return null; n.empleados = Math.max(1, n.empleados - 1); return ['👋', 'Se va el empleado temporal.']; },
    rumoresClub: s => { if (s.interes >= 40) { s.confianza = clamp(s.confianza - 3, 0, 100); return ['📰', 'La prensa habla de tu posible marcha: el vestuario lo nota (−3 confianza).', 'mal']; } return null; },
  };

  // ---- Sucesos ----
  const SUCESOS = [
    // Barrio
    { id: 'masHoras', ambito: 'carrera', fases: ['barrio', 'pruebas'], unaVez: true, cond: s => (s.cont.trabajar || 0) >= 2, peso: () => 3,
      ic: '🛵', titulo: 'Tu jefe te ofrece más horas', texto: () => 'Le has caído bien en el reparto. Te ofrece doblar turnos esta semana.',
      ops: [
        { id: 'si', n: 'Doblar turnos toda la semana', ventaja: '+260 €', coste: '−30 energía y la semana entera', riesgo: 'Una semana menos para tu carrera', tags: ['dinero'], ocupaSemana: true, fx: s => { s.p.dinero += 260; s.acum.trabajo += 260; s.p.energia = clamp(s.p.energia - 30, 0, 100); return 'Doblas turnos: +260 €, pero acabas sin fuerzas.'; } },
        { id: 'finde', n: 'Solo el fin de semana', ventaja: '+120 €', coste: '−10 energía', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { s.p.dinero += 120; s.acum.trabajo += 120; s.p.energia = clamp(s.p.energia - 10, 0, 100); return 'Haces el fin de semana: +120 €.'; } },
        { id: 'no', n: 'Rechazarlo', ventaja: 'Tu tiempo es para el fútbol', coste: 'Nada', riesgo: 'Ninguno', tags: ['deporte'], fx: () => 'Le dices que no: tu prioridad es el fútbol.' },
      ] },
    { id: 'rumorOjeador', ambito: 'carrera', fases: ['barrio'], unaVez: true, cond: s => s.semana >= 3 && s.p.rep >= 8 && !s.invitacion, peso: () => 3,
      ic: '👀', titulo: 'Dicen que viene un ojeador', texto: () => 'En el bar cuentan que esta semana un ojeador del Atlético pasará por la plaza.',
      ops: [
        { id: 'jugar', n: 'Darlo todo en la plaza', ventaja: 'Si juegas en la plaza esta semana, fama ×2', coste: 'Tienes que elegir «Partido en la plaza»', riesgo: 'Puede que no venga nadie (30 %)', tags: ['riesgo', 'deporte'], fx: s => { mods(s).plazaX2 = rnd(s) < 0.7; return 'Te preparas para la plaza.'; } },
        { id: 'pasar', n: 'No hacer caso', ventaja: 'Sigues con tu plan', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: () => 'Sigues con lo tuyo.' },
      ] },
    // Club
    { id: 'partidoDecisivo', ambito: 'carrera', fases: ['club'], enfria: 5, cond: s => enClub(s) && s.temporada.jornada >= 4 && P2.contexto(s.temporada).some(t => /ascenso|descenso/.test(t)), peso: () => 4,
      ic: '📢', titulo: 'El míster avisa: el próximo partido es decisivo', texto: s => P2.contexto(s.temporada).join(' '),
      ops: [
        { id: 'tope', n: 'Entrenar a tope', ventaja: 'Mejor nota esta jornada', coste: '−10 energía', riesgo: 'Más riesgo de lesión', tags: ['deporte', 'riesgo'], fx: s => { const m = mods(s); m.bonusNota = 0.6; m.riesgoLesion = 1.6; s.p.energia = clamp(s.p.energia - 10, 0, 100); return 'Entrenas como nunca.'; } },
        { id: 'fresco', n: 'Llegar fresco/a', ventaja: '+15 energía', coste: 'Sin extra de nota', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { s.p.energia = clamp(s.p.energia + 15, 0, 100); return 'Te cuidas para llegar bien.'; } },
        { id: 'charla', n: 'Pedir una charla al míster', ventaja: '+3 confianza ya', coste: 'Te comprometes', riesgo: 'Si haces menos de un 6, −6 después', tags: ['riesgo'], fx: s => { s.confianza = clamp(s.confianza + 3, 0, 100); programar(s, 1, 'charlaMister'); return 'El míster te escucha.'; } },
      ] },
    { id: 'companeroLesionado', ambito: 'carrera', fases: ['club'], enfria: 6, cond: s => { const p = P2.probTitular(s); return enClub(s) && p && p.p < 0.7 && !s.p.lesion; }, peso: () => 3,
      ic: '🩼', titulo: 'Se lesiona un compañero de tu puesto', texto: () => 'Hay un hueco en el once. Es tu oportunidad… o la de otro.',
      ops: [
        { id: 'pedir', n: 'Pedir el puesto', ventaja: 'Mucha más opción de ser titular', coste: 'Te expones', riesgo: 'Si no rindes (nota < 6,5), −6 confianza', tags: ['riesgo', 'deporte'], fx: s => { mods(s).bonusSel = 7; programar(s, 1, 'pedirPuesto'); return 'Le dices al míster que estás preparado/a.'; } },
        { id: 'apoyar', n: 'Apoyar al compañero', ventaja: '+2 confianza y reputación en el vestuario', coste: 'Menos opción que pidiéndolo', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { mods(s).bonusSel = 3; s.confianza = clamp(s.confianza + 2, 0, 100); s.p.rep = r1(s.p.rep + 0.5); return 'El vestuario valora tu gesto.'; } },
      ] },
    { id: 'interesClub', ambito: 'carrera', fases: ['club'], enfria: 8, cond: s => enClub(s) && s.agente && s.interes >= 30, peso: s => 2 + s.interes / 20,
      ic: '📞', titulo: 'Tu agente: otro club pregunta por ti', texto: s => `Tienes ${Math.round(s.interes)}/100 de interés de otros clubes.`,
      ops: [
        { id: 'escuchar', n: 'Escuchar la oferta', ventaja: 'Más interés: mejores ofertas a final de temporada', coste: '−4 confianza', riesgo: 'Rumores en prensa', tags: ['dinero', 'riesgo'], fx: s => { s.interes = clamp(s.interes + 10, 0, 100); s.confianza = clamp(s.confianza - 4, 0, 100); programar(s, 2, 'rumoresClub'); return 'Escuchas. Tu agente toma nota.'; } },
        { id: 'cerrar', n: 'Cerrar la puerta', ventaja: '+5 confianza', coste: '−10 de interés', riesgo: 'Ninguno', tags: ['deporte', 'seguro'], fx: s => { s.confianza = clamp(s.confianza + 5, 0, 100); s.interes = clamp(s.interes - 10, 0, 100); return 'Dices que estás a gusto. El club lo agradece.'; } },
        { id: 'usar', n: 'Usarlo para pedir mejora', ventaja: 'Sueldo +20 % si el club te valora (confianza 60+)', coste: 'Si no, −8 confianza', riesgo: 'Alto', tags: ['dinero', 'riesgo'], fx: s => { if (s.confianza >= 60) { const d = P2.subirSueldo(s, 1.2); return d ? `El club te sube el sueldo a ${eur(s.contrato.sueldo)}/semana.` : `Ya cobras el máximo de esta categoría (${eur(P2.topeSueldo(s))}/semana): no hay subida.`; } s.confianza = clamp(s.confianza - 8, 0, 100); return 'Al club no le gusta el pulso: −8 confianza.'; } },
      ] },
    { id: 'patroAntesPartido', ambito: 'carrera', fases: ['club'], enfria: 6, cond: s => enClub(s) && s.patros.length > 0 && P2.contexto(s.temporada).some(t => /ascenso|descenso|decisiv/.test(t)), peso: () => 3,
      ic: '📸', titulo: 'Tu patrocinador quiere un evento antes del partido', texto: s => `${P2.MARCAS.find(m => m.id === s.patros[0].id).n} organiza una firma de autógrafos el día antes de un partido importante.`,
      ops: [
        { id: 'ir', n: 'Ir al evento', ventaja: '+150 € y la marca contenta', coste: '−15 energía antes del partido', riesgo: 'Llegas peor', tags: ['dinero'], fx: s => { s.p.dinero += 150; s.acum.patrocinio += 150; s.p.energia = clamp(s.p.energia - 15, 0, 100); return 'Firmas autógrafos: +150 €.'; } },
        { id: 'no', n: 'No ir', ventaja: 'Te centras en el partido', coste: 'Cuenta como falta con la marca', riesgo: 'Dos faltas rompen el contrato', tags: ['deporte'], fx: s => P2.resolverActo(s, s.patros[0].id, 'no') },
        { id: 'mover', n: 'Pedir que lo muevan', ventaja: 'Si aceptan, todo bien', coste: 'Nada', riesgo: '50 %: se molestan (falta)', tags: ['riesgo'], fx: s => (rnd(s) < 0.5 ? 'Lo mueven a después del partido. Perfecto.' : P2.resolverActo(s, s.patros[0].id, 'no')) },
      ] },
    { id: 'entrenoPersonal', ambito: 'carrera', fases: ['club', 'amateur'], enfria: 9, cond: s => (s.fase === 'club' || s.fase === 'amateur') && s.p.dinero >= 300, peso: () => 2,
      ic: '🧑‍🏫', titulo: 'Un preparador te ofrece entrenamiento personal', texto: () => 'Tres sesiones a la semana, a tu medida.',
      ops: [
        { id: 'pagar', n: 'Pagar 300 €', ventaja: 'Nivel +1 cada semana, 3 semanas', coste: '300 €', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { s.p.dinero -= 300; s.acum.gastos += 300; programar(s, 1, 'entrenoPagado'); programar(s, 2, 'entrenoPagado'); programar(s, 3, 'entrenoPagado', { ultima: true }); return 'Contratas al preparador.'; } },
        { id: 'libre', n: 'Hacerlo en tu día libre, gratis', ventaja: 'Nivel +1,5 ya', coste: '−20 energía', riesgo: 'Llegas cansado/a al partido', tags: ['deporte', 'riesgo'], fx: s => { s.p.nivel = r1(Math.min(P2.techoClub(s) + 2, s.p.nivel + 1.5)); s.p.energia = clamp(s.p.energia - 20, 0, 100); return 'Sesión gratis en tu día libre: nivel +1,5.'; } },
        { id: 'no', n: 'No, gracias', ventaja: 'Ahorras', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro', 'dinero'], fx: () => 'Lo dejas pasar.' },
      ] },
    { id: 'renovacion', ambito: 'carrera', fases: ['club'], cond: s => enClub(s) && s.confianza >= 65 && s.temporada.jornada >= 8 && s.contrato.temporadasRestantes <= 1 && s.contrato.renovadoEn !== s.temporada.num + s.temporada.liga, peso: () => 5,
      ic: '✍️', titulo: 'El club quiere renovarte ya', texto: s => `Antes de que acabe la temporada. Ahora cobras ${eur(s.contrato.sueldo)}/semana.`,
      ops: [
        { id: 'firmar', n: 'Firmar ya', ventaja: 'Sueldo +25 % y una temporada más', coste: 'Blindado: otros clubes se enfrían (−15 interés)', riesgo: 'Si sigues creciendo, cobrarás menos de lo que vales', tags: ['seguro', 'dinero'], fx: s => { P2.subirSueldo(s, 1.25); s.contrato.temporadasRestantes += 1; s.contrato.renovadoEn = s.temporada.num + s.temporada.liga; s.interes = clamp(s.interes - 15, 0, 100); return `Renuevas: ${eur(s.contrato.sueldo)}/semana.`; } },
        { id: 'esperar', n: 'Esperar al final', ventaja: 'Si acabas bien, más ofertas', coste: 'Nada ahora', riesgo: 'Si acabas mal, peores condiciones', tags: ['riesgo'], fx: s => { s.contrato.renovadoEn = s.temporada.num + s.temporada.liga; return 'Decides esperar a final de temporada.'; } },
        { id: 'mas', n: 'Pedir más (con tu agente)', ventaja: 'Sueldo +40 % si tu nota media es 6,5+', coste: 'Si no, −6 confianza', riesgo: 'Alto', tags: ['dinero', 'riesgo'], cond: s => s.agente, fx: s => { s.contrato.renovadoEn = s.temporada.num + s.temporada.liga; const l = s.stats.notasTemp, m = l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0; if (m >= 6.5) { P2.subirSueldo(s, 1.4); s.contrato.temporadasRestantes += 1; return `Tu agente lo consigue: ${eur(s.contrato.sueldo)}/semana.`; } s.confianza = clamp(s.confianza - 6, 0, 100); return 'El club no lo ve: −6 confianza y sin renovación.'; } },
      ] },
    { id: 'molestias', ambito: 'carrera', fases: ['club'], enfria: 6, cond: s => enClub(s) && s.p.energia < 40 && !s.p.lesion, peso: () => 3,
      ic: '🩺', titulo: 'El fisio ve molestias en tu gemelo', texto: () => 'Puedes jugar, pero no estás al cien por cien.',
      ops: [
        { id: 'jugar', n: 'Jugar infiltrado/a', ventaja: 'No pierdes el puesto', coste: 'Nada ahora', riesgo: 'Riesgo de lesión ×3', tags: ['riesgo', 'deporte'], fx: s => { mods(s).riesgoLesion = 3; return 'Te infiltras y a jugar.'; } },
        { id: 'parar', n: 'Parar una semana', ventaja: '+20 energía, sin riesgo', coste: 'No juegas (−3 confianza)', riesgo: 'Otro puede quitarte el sitio', tags: ['seguro'], fx: s => { s.p.lesion = Math.max(s.p.lesion, 1); s.p.energia = clamp(s.p.energia + 20, 0, 100); s.confianza = clamp(s.confianza - 3, 0, 100); return 'Paras una semana.'; } },
      ] },
    { id: 'entrevista', ambito: 'carrera', fases: ['club'], enfria: 6, cond: s => enClub(s) && (ultNota(s) || 0) >= 7, peso: () => 2,
      ic: '🎙️', titulo: 'El periódico local quiere entrevistarte', texto: s => `Tu último partido (un ${nf(ultNota(s))}) ha gustado.`,
      ops: [
        { id: 'humilde', n: 'Ser humilde', ventaja: '+2 confianza, +1 marca personal', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro', 'deporte'], fx: s => { s.confianza = clamp(s.confianza + 2, 0, 100); P2.sumarMarca(s, 1); return '«Todo es mérito del equipo.»'; } },
        { id: 'ambicion', n: 'Decir que quieres llegar lejos', ventaja: '+4 marca personal, +8 interés de clubes', coste: '−4 confianza', riesgo: 'Al club no le gusta', tags: ['dinero', 'riesgo'], fx: s => { P2.sumarMarca(s, 4); s.interes = clamp(s.interes + 8, 0, 100); s.confianza = clamp(s.confianza - 4, 0, 100); return '«Quiero jugar en Primera.» Titular de portada.'; } },
      ] },
    { id: 'barAmigo', ambito: 'carrera', fases: ['club'], unaVez: true, cond: s => s.fase === 'club' && s.p.dinero >= 1500 && !s.negocios.length, peso: () => 2,
      ic: '🍻', titulo: 'Un amigo te pide que inviertas en su bar', texto: () => 'Quiere reformar el bar de su familia. Te devolverá «el doble» en dos meses.',
      ops: [
        { id: 'mucho', n: 'Invertir 1.000 €', ventaja: '45 %: recuperas 2.200 €', coste: '1.000 €', riesgo: '20 %: lo pierdes todo', tags: ['riesgo', 'dinero'], fx: s => { s.p.dinero -= 1000; programar(s, 8, 'barAmigo', { x: 1000 }); return 'Inviertes 1.000 € en el bar.'; } },
        { id: 'poco', n: 'Invertir 400 €', ventaja: 'Arriesgas poco', coste: '400 €', riesgo: '20 %: lo pierdes', tags: ['seguro'], fx: s => { s.p.dinero -= 400; programar(s, 8, 'barAmigo', { x: 400 }); return 'Pones 400 € por amistad.'; } },
        { id: 'no', n: 'No invertir', ventaja: 'Guardas para tu negocio', coste: 'Tu amigo se decepciona', riesgo: 'Ninguno', tags: ['dinero'], fx: () => 'Le dices que ahora no puedes.' },
      ] },
    { id: 'empresaTeNecesita', ambito: 'carrera', fases: ['club', 'amateur'], enfria: 5, cond: s => s.negocios.some(n => n.rachaNeg >= 1 || n.ctx.averia || n.ctx.competidor), peso: () => 3,
      ic: '📞', titulo: 'Tu encargada te llama: la peluquería te necesita', texto: () => 'Hay lío en el negocio y quieren que estés esta semana.',
      ops: [
        { id: 'ir', n: 'Dedicar la semana a la peluquería', ventaja: 'Arreglas el problema: +6 fama del negocio, mejor ambiente', coste: 'La semana entera y −4 confianza del míster', riesgo: 'Si el equipo pierde, te lo echarán en cara', tags: ['dinero'], ocupaSemana: true, fx: s => { const n = s.negocios[0]; n.fama = r1(n.fama + 6); n.moral = r1(clamp(n.moral + 0.08, 0.7, 1.1)); mods(s).gestion = true; s.confianza = clamp(s.confianza - 4, 0, 100); return 'Pasas la semana en la peluquería.'; } },
        { id: 'encargado', n: 'Que lo resuelva ella (200 € de caja)', ventaja: 'No pierdes entrenos', coste: '200 € de la caja', riesgo: '40 %: no lo arregla (−4 fama)', tags: ['seguro'], fx: s => { const n = s.negocios[0]; n.caja -= 200; if (rnd(s) < 0.6) return 'Lo arregla con dinero.'; n.fama = r1(n.fama - 4); return 'No lo arregla del todo: −4 fama del negocio.'; } },
        { id: 'ignorar', n: 'Ahora no puedo', ventaja: 'Te centras en el fútbol', coste: '−6 fama del negocio', riesgo: 'El equipo se desanima', tags: ['deporte'], fx: s => { const n = s.negocios[0]; n.fama = r1(n.fama - 6); n.moral = r1(clamp(n.moral - 0.05, 0.7, 1.1)); return 'Lo dejas estar. En la peluquería no sienta bien.'; } },
      ] },
    { id: 'clinic', ambito: 'carrera', fases: ['club'], unaVez: true, cond: s => enClub(s) && s.p.rep >= 25, peso: () => 2,
      ic: '⚽', titulo: 'Te invitan a dar un clínic a niños', texto: () => 'Una escuela de fútbol de la ciudad quiere que pases una semana con sus chavales.',
      ops: [
        { id: 'ir', n: 'Pasar la semana en el clínic', ventaja: '+400 € y +3 de marca personal', coste: 'La semana entera (no entrenas extra)', riesgo: 'Ninguno', tags: ['dinero', 'seguro'], ocupaSemana: true, fx: s => { s.p.dinero += 400; s.acum.trabajo += 400; const g = P2.sumarMarca(s, 3); return `Una semana con los chavales: +400 € y +${P2.nf(g)} de marca personal.`; } },
        { id: 'no', n: 'Decir que no', ventaja: 'Tu semana es tuya', coste: 'Nada', riesgo: 'Ninguno', tags: ['deporte'], fx: () => 'Lo rechazas con educación.' },
      ] },
    // ---- Contexto de la empresa (dependen del estado del negocio) ----
    { id: 'competidor', ambito: 'empresa', unaVez: true, cond: (s, n) => n.semanas >= 4 && !n.ctx.competidor, peso: (s, n) => 1 + n.fama / 30 + Math.max(0, P2.beneficioMedio(n)) / 150,
      ic: '🏪', titulo: 'Abre una barbería low cost enfrente', texto: () => 'Cortes a 9 €. Se llevará a los clientes que solo miran el precio.',
      ops: [
        { id: 'precio', n: 'Bajar precios', ventaja: 'Retienes a los que buscan barato', coste: 'Ingresas menos por cliente', riesgo: 'Necesitarás más gente', tags: ['seguro'], fx: (s, n) => { n.ctx.competidor = 99; n.precio = 'barato'; return 'Pasas a precios bajos.'; } },
        { id: 'calidad', n: 'Apostar por la calidad', ventaja: 'Sueldo alto: tus clientes no se van', coste: 'Más coste de personal', riesgo: 'Si no subes precio, ganas menos', tags: ['riesgo'], fx: (s, n) => { n.ctx.competidor = 99; n.sueldo = 'alto'; n.moral = r1(clamp(n.moral + 0.05, 0.7, 1.1)); return 'Subes sueldos y cuidas cada corte.'; } },
        { id: 'nada', n: 'No cambiar nada', ventaja: 'Sin gastos', coste: 'Pierdes clientes', riesgo: 'Puede hacerte mucho daño', tags: ['dinero'], fx: (s, n) => { n.ctx.competidor = 99; return 'Aguantas como estás.'; } },
      ] },
    { id: 'aumento', ambito: 'empresa', enfria: 10, cond: (s, n) => n.semanas >= 5 && n.empleados >= 2 && n.sueldo !== 'alto', peso: () => 2,
      ic: '💬', titulo: 'Una empleada pide un aumento', texto: () => 'Dice que en otras peluquerías pagan más.',
      ops: [
        { id: 'subir', n: 'Subir sueldos', ventaja: 'Mejor ambiente y calidad', coste: 'Más coste cada semana', riesgo: 'Ninguno', tags: ['seguro'], fx: (s, n) => { n.sueldo = n.sueldo === 'bajo' ? 'normal' : 'alto'; n.moral = r1(clamp(n.moral + 0.06, 0.7, 1.1)); return 'Subes sueldos.'; } },
        { id: 'bonus', n: 'Un bonus único (300 €)', ventaja: 'Contenta por ahora', coste: '300 € de caja', riesgo: 'Volverá a pedirlo', tags: ['dinero'], fx: (s, n) => { n.caja -= 300; n.moral = r1(clamp(n.moral + 0.03, 0.7, 1.1)); return 'Le das un bonus.'; } },
        { id: 'no', n: 'No subir', ventaja: 'Ahorras', coste: 'Peor ambiente', riesgo: '35 %: se va', tags: ['dinero', 'riesgo'], fx: (s, n) => { n.moral = r1(clamp(n.moral - 0.08, 0.7, 1.1)); if (rnd(s) < 0.35 && n.empleados > 1) { n.empleados--; return 'Se va a la competencia.'; } return 'Se queda, pero de mala gana.'; } },
      ] },
    { id: 'averia', ambito: 'empresa', enfria: 10, cond: (s, n) => n.semanas >= 3 && !n.ctx.averia, peso: () => 2,
      ic: '🔧', titulo: 'Se rompen dos secadores y un sillón', texto: () => 'Sin ellos atendéis a menos gente.',
      ops: [
        { id: 'ya', n: 'Arreglarlo todo ya (700 €)', ventaja: 'Sin pérdidas de capacidad', coste: '700 € de caja', riesgo: 'Ninguno', tags: ['seguro'], fx: (s, n) => { n.caja -= 700; return 'Material nuevo.'; } },
        { id: 'barato', n: 'Apaño barato (250 €)', ventaja: 'Ahorras', coste: '250 € de caja', riesgo: '50 %: vuelve a romperse', tags: ['dinero', 'riesgo'], fx: (s, n) => { n.caja -= 250; programar(s, 3, 'averiaVuelve', { neg: n.id }); return 'Un apaño que aguantará… o no.'; } },
        { id: 'esperar', n: 'Esperar', ventaja: 'Sin gastos', coste: '4 semanas a medio gas', riesgo: 'Pierdes clientes y fama', tags: ['dinero'], fx: (s, n) => { n.ctx.averia = 4; return 'Trabajáis con lo que hay.'; } },
      ] },
    { id: 'alquiler', ambito: 'empresa', unaVez: true, cond: (s, n) => n.semanas >= 6 && !n.local && P2.beneficioMedio(n) > 200, peso: () => 3,
      ic: '🏢', titulo: 'El casero quiere subir el alquiler', texto: (s, n) => `Ve que el negocio va bien. Pide pasar de ${eur(n.alquiler)} a ${eur(n.alquiler + 120)}/semana.`,
      ops: [
        { id: 'aceptar', n: 'Aceptar', ventaja: 'Sin conflictos', coste: '+120 €/semana', riesgo: 'Ninguno', tags: ['seguro'], fx: (s, n) => { n.alquiler += 120; return 'Aceptas la subida.'; } },
        { id: 'negociar', n: 'Negociar', ventaja: 'Con fama 55+ del negocio: solo +50', coste: 'Si no, +150', riesgo: 'Medio', tags: ['riesgo'], fx: (s, n) => { const x = n.fama >= 55 ? 50 : 150; n.alquiler += x; return x === 50 ? 'El casero cede: +50 €/semana.' : 'Sale mal: +150 €/semana.'; } },
        { id: 'mudarse', n: 'Mudarse a un local más barato', ventaja: '−80 €/semana de alquiler', coste: '1.500 € de caja, −10 fama y una semana de mudanza', riesgo: 'Pierdes clientela', tags: ['dinero', 'riesgo'], ocupaSemana: true, fx: (s, n) => { n.caja -= 1500; n.fama = r1(n.fama - 10); n.alquiler = Math.max(200, n.alquiler - 80); return 'Os mudáis.'; } },
      ] },
    { id: 'influencer', ambito: 'empresa', unaVez: true, cond: (s, n) => n.fama >= 45 || (s.p.marca || 0) >= 30, peso: () => 2,
      ic: '🤳', titulo: 'Una influencer local quiere cortarse el pelo con vosotros', texto: () => 'Tiene 80.000 seguidores en la ciudad.',
      ops: [
        { id: 'gratis', n: 'Invitarla gratis', ventaja: '4 semanas con más demanda', coste: 'Nada', riesgo: 'Si no das abasto, colas y mala fama', tags: ['seguro'], fx: (s, n) => { n.ctx.influencer = 4; return 'Viene, sube fotos y empiezan a llamar.'; } },
        { id: 'campaña', n: 'Pagarle una campaña (400 €)', ventaja: '6 semanas con más demanda y +5 fama', coste: '400 € de caja', riesgo: 'Mismo riesgo de colas', tags: ['riesgo', 'dinero'], fx: (s, n) => { n.caja -= 400; n.ctx.influencer = 6; n.fama = r1(n.fama + 5); return 'Campaña en marcha.'; } },
        { id: 'no', n: 'No', ventaja: 'Nada cambia', coste: 'Nada', riesgo: 'Ninguno', tags: ['dinero'], fx: () => 'Lo dejas pasar.' },
      ] },
    { id: 'temporadaAlta', ambito: 'empresa', enfria: 12, cond: (s, n) => n.semanas >= 2 && !n.ctx.temporadaAlta, peso: () => 1.5,
      ic: '💍', titulo: 'Llega la temporada de bodas y fiestas', texto: () => 'Tres semanas con mucha más demanda.',
      ops: [
        { id: 'temporal', n: 'Contratar a alguien 3 semanas', ventaja: 'Atiendes a todos', coste: 'Un sueldo más', riesgo: 'Ninguno', tags: ['dinero'], fx: (s, n) => { n.ctx.temporadaAlta = 3; if (n.empleados < P2.tipoDe(n).empleadosMax) { n.empleados++; P2.programarFin(s, n); return 'Contratas a un temporal.'; } return 'Ya estáis al máximo de plantilla.'; } },
        { id: 'tal', n: 'Apañaros con lo que hay', ventaja: 'Sin coste extra', coste: 'Colas', riesgo: 'Clientes que se van y fama', tags: ['seguro'], fx: (s, n) => { n.ctx.temporadaAlta = 3; return 'A apretar.'; } },
      ] },
    { id: 'estrella', ambito: 'empresa', unaVez: true, cond: (s, n) => n.semanas >= 8 && n.sueldo !== 'alto', peso: () => 2,
      ic: '⭐', titulo: 'Tu mejor peluquera recibe una oferta', texto: () => 'Una cadena quiere llevársela. Media clientela viene por ella.',
      ops: [
        { id: 'igualar', n: 'Subir sueldos a «alto»', ventaja: 'Se queda y mejora la calidad', coste: 'Más coste semanal', riesgo: 'Ninguno', tags: ['seguro'], fx: (s, n) => { n.sueldo = 'alto'; n.estrella = true; return 'Se queda.'; } },
        { id: 'socia', n: 'Ofrecerle un pequeño % (600 €)', ventaja: 'Calidad +8 % y mejor ambiente', coste: '600 € de caja', riesgo: 'Ninguno', tags: ['riesgo'], fx: (s, n) => { n.caja -= 600; n.estrella = true; n.moral = r1(clamp(n.moral + 0.08, 0.7, 1.1)); return 'Ahora es un poco socia.'; } },
        { id: 'irse', n: 'Dejarla ir', ventaja: 'Sin coste', coste: 'Un empleado menos y −8 fama', riesgo: 'Se lleva clientes', tags: ['dinero'], fx: (s, n) => { if (n.empleados > 1) n.empleados--; n.fama = r1(n.fama - 8); return 'Se va con parte de la clientela.'; } },
      ] },
  ];
  function programarFin(s, n) { programar(s, 3, 'finTemporal', { neg: n.id }); }

  // ¿Sale un suceso esta semana? Uno de carrera y, con empresa, quizá uno de la empresa
  function elegir(s, l) {
    const tot = l.reduce((a, x) => a + x.w, 0); if (!tot) return null;
    let u = rnd(s) * tot;
    for (const x of l) { u -= x.w; if (u <= 0) return x; }
    return l[l.length - 1];
  }
  function disponible(s, E, n) {
    const k = E.id + (n ? ':' + n.id : '');
    const visto = s.sucesosVistos[k];
    if (E.unaVez && visto != null) return false;
    if (E.enfria && visto != null && s.semana - visto < E.enfria) return false;
    if (E.fases && !E.fases.includes(s.fase)) return false;
    try { return !!E.cond(s, n); } catch (_) { return false; }
  }
  function tirarSucesos(s) {
    if (rnd(s) < CFG.sucesos.probSemana) {
      const l = SUCESOS.filter(E => E.ambito === 'carrera' && disponible(s, E)).map(E => ({ E, w: E.peso(s) }));
      const x = elegir(s, l);
      if (x) { s.sucesosVistos[x.E.id] = s.semana; P2.encolar(s, { tipo: 'suceso', id: x.E.id }); }
    }
    for (const n of s.negocios) {
      if (rnd(s) >= CFG.sucesos.probEmpresa) continue;
      const l = SUCESOS.filter(E => E.ambito === 'empresa' && disponible(s, E, n)).map(E => ({ E, w: E.peso(s, n) }));
      const x = elegir(s, l);
      if (x) { s.sucesosVistos[x.E.id + ':' + n.id] = s.semana; P2.encolar(s, { tipo: 'suceso', id: x.E.id, neg: n.id }); }
    }
  }
  function procesarAgenda(s, R) {
    const hoy = s.agenda.filter(a => a.semana <= s.semana);
    s.agenda = s.agenda.filter(a => a.semana > s.semana);
    for (const a of hoy) { const f = EFECTOS[a.efecto]; if (!f) continue; const l = f(s, a.data || {}); if (l) R.lineas.push(l); }
  }

  Object.assign(P2, { SUCESOS, EFECTOS, tirarSucesos, procesarAgenda, programar, programarFin, mods });
})(globalThis.P2 = globalThis.P2 || {});
