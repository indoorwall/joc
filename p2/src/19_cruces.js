/* =====================================================================
   19 · CRUCES (P2.5.1): la empresa y las personas se cruzan con la carrera deportiva
   - Empresa → deporte: decisiones donde atender el negocio cuesta preparación (y al revés).
   - Deporte → empresa: un gran momento trae clientes; una polémica los aleja (04_carrera marca ctx).
   - Relaciones → deporte: consecuencias diferidas, nunca mantenimiento semanal.
   Usan el mismo motor de sucesos (07): cond, peso, enfriamiento y efectos programados.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, r1, eur, rnd } = P2;
  const n0 = s => s.negocios[0];
  const enEquipo = s => (s.fase === 'club' || s.fase === 'amateur') && s.temporada && !s.temporada.cerrada;
  const granPartidoCerca = (s, k = 3) => !!(s.eventoImportante && s.eventoImportante.semana >= s.semana && s.eventoImportante.semana - s.semana <= k);
  // Quita preparación si hay gran partido a la vista; si no, cuesta energía (siempre cuesta algo deportivo)
  function costeDeportivo(s, prep, energia, motivo) {
    if (granPartidoCerca(s)) { P2.moverPreparacion(s, -prep, 0, motivo); return `−${prep} de preparación para ${s.eventoImportante.n.toLowerCase()}`; }
    s.p.energia = clamp(s.p.energia - energia, 0, 100); return `−${energia} de energía`;
  }
  const txtCoste = (prep, energia) => `−${prep} de preparación si hay gran partido (si no, −${energia} energía)`;
  const prog = (s, sem, efecto, data) => P2.programar(s, sem, efecto, Object.assign({ desde: s.semana }, data || {}));

  // ---------- Empresa ↔ deporte ----------
  const CRUCES = [
    { id: 'empleadoFalta', ambito: 'carrera', cruce: true, fases: ['club', 'amateur'], enfria: 12, cond: s => enEquipo(s) && s.negocios.length > 0 && n0(s).semanas >= 2, peso: s => (granPartidoCerca(s) ? 4 : 1.2),
      ic: '🤒', titulo: 'Un empleado falta justo esta semana', texto: s => `${granPartidoCerca(s) ? `Se acerca ${s.eventoImportante.n.toLowerCase()} y` : 'Esta semana'} tu negocio se queda sin una persona clave.`,
      ops: [
        { id: 'ir', n: 'Ir tú a cubrirlo', ventaja: 'El negocio no pierde clientes (+3 fama)', coste: txtCoste(10, 12), riesgo: 'Ninguno', tags: ['dinero'], fx: s => { const n = n0(s); n.fama = r1(n.fama + 3); return `Cubres el turno. ${costeDeportivo(s, 10, 12, 'Cubriste a un empleado')}.`; } },
        { id: 'delegar', n: 'Delegar en el equipo', ventaja: 'Te centras en lo deportivo', coste: 'Nada seguro', riesgo: '45 %: clientes enfadados (−5 fama, −250 € de caja)', tags: ['deporte', 'riesgo'], fx: s => { const n = n0(s); if (rnd(s) < 0.45) { n.fama = r1(n.fama - 5); n.caja -= 250; return 'Sale mal: colas, quejas y −250 € de caja.'; } return 'El equipo se apaña sin ti.'; } },
      ] },
    { id: 'averiaPartido', ambito: 'carrera', cruce: true, fases: ['club', 'amateur'], enfria: 14, cond: s => enEquipo(s) && s.negocios.length > 0 && n0(s).semanas >= 3 && !n0(s).ctx.averia, peso: () => 1.5,
      ic: '🔧', titulo: 'Avería en el negocio en plena semana de partido', texto: () => 'Hay que resolverlo ya: o pagas a un técnico o te pones tú.',
      ops: [
        { id: 'pagar', n: 'Pagar la reparación (600 €)', ventaja: 'No pierdes ni un entreno', coste: '600 € de caja', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { n0(s).caja -= 600; return 'Viene el técnico y lo deja como nuevo.'; } },
        { id: 'tu', n: 'Gestionarla tú', ventaja: 'Solo 150 € de piezas', coste: 'Pierdes el entreno: −0,2 nivel y ' + txtCoste(6, 8), riesgo: 'Ninguno', tags: ['dinero'], fx: s => { n0(s).caja -= 150; s.p.nivel = r1(Math.max(P2.CFG.inicio.nivel, s.p.nivel - 0.2)); return `Te manchas las manos. ${costeDeportivo(s, 6, 8, 'Arreglaste la avería')}.`; } },
      ] },
    { id: 'clienteSponsor', ambito: 'carrera', cruce: true, fases: ['club'], enfria: 16, cond: s => enEquipo(s) && s.negocios.length > 0 && (s.patros || []).length > 0, peso: () => 1.5,
      ic: '🤝', titulo: 'Un cliente importante coincide con el acto de tu patrocinador', texto: () => 'Un cliente quiere un evento en tu negocio el mismo día que tu patrocinador te pide una foto.',
      ops: [
        { id: 'aceptar', n: 'Hacer las dos cosas', ventaja: '+4 fama del negocio y +1 marca personal', coste: '−15 energía (sin descanso)', riesgo: 'Llegas justo al partido', tags: ['dinero'], fx: s => { const n = n0(s); n.fama = r1(n.fama + 4); P2.sumarMarca(s, 1); s.p.energia = clamp(s.p.energia - 15, 0, 100); return 'Un día larguísimo, pero sale bien.'; } },
        { id: 'no', n: 'Solo el patrocinador', ventaja: 'Descansas', coste: 'El cliente se va a otro sitio', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { n0(s).fama = r1(n0(s).fama - 2); return 'Cumples con tu patrocinador y descansas.'; } },
      ] },
    { id: 'estrellaPide', ambito: 'carrera', cruce: true, fases: ['club', 'amateur'], enfria: 16, cond: s => enEquipo(s) && s.negocios.length > 0 && n0(s).semanas >= 6 && n0(s).empleados >= 2, peso: s => (granPartidoCerca(s) ? 2.5 : 1),
      ic: '💬', titulo: 'Tu mejor empleada pide una subida… esta semana', texto: () => 'Quiere hablarlo en persona y ya. Tú tenías la cabeza en el partido.',
      ops: [
        { id: 'ahora', n: 'Resolverlo ahora (300 €)', ventaja: 'Mejor ambiente (+moral)', coste: '300 € de caja y ' + txtCoste(6, 6), riesgo: 'Ninguno', tags: ['seguro'], fx: s => { const n = n0(s); n.caja -= 300; n.moral = r1(clamp(n.moral + 0.05, 0.7, 1.1)); return `Lo habláis con calma. ${costeDeportivo(s, 6, 6, 'Negociaste una subida')}.`; } },
        { id: 'luego', n: 'Posponerlo tres semanas', ventaja: 'Te centras en el partido', coste: 'Nada ahora', riesgo: '40 %: se va (un empleado menos y −5 fama)', tags: ['deporte', 'riesgo'], fx: s => { prog(s, 3, 'estrellaPospuesta', { neg: n0(s).id }); return 'Le pides tres semanas. No le hace gracia.'; } },
      ] },
    { id: 'demandaAlta', ambito: 'carrera', cruce: true, fases: ['club', 'amateur'], enfria: 10, cond: s => enEquipo(s) && s.negocios.length > 0 && n0(s).semanas >= 3, peso: () => 1.2,
      ic: '📈', titulo: 'Semana de mucha demanda en el negocio', texto: () => 'Hay cola en la puerta. Si pasas tú, se vende más; pero tienes partido.',
      ops: [
        { id: 'pasar', n: 'Pasar por el negocio', ventaja: 'Más ingresos esta semana', coste: txtCoste(8, 10), riesgo: 'Ninguno', tags: ['dinero'], fx: s => { const n = n0(s), g = Math.round(Math.max(200, Math.min(1500, P2.beneficioMedio(n) * 0.8))); n.caja += g; return `Despachas como nunca: +${eur(g)} en caja. ${costeDeportivo(s, 8, 10, 'Te volcaste en el negocio')}.`; } },
        { id: 'partido', n: 'Preparar el partido', ventaja: '+6 de preparación si hay gran partido (si no, +5 energía)', coste: 'Pierdes la oportunidad', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { if (granPartidoCerca(s)) { P2.moverPreparacion(s, 6, 0, 'Elegiste el partido antes que el negocio'); return 'Te centras: +6 de preparación.'; } s.p.energia = clamp(s.p.energia + 5, 0, 100); return 'Te centras en el partido.'; } },
      ] },
    { id: 'proveedor', ambito: 'carrera', cruce: true, fases: ['club', 'amateur'], enfria: 20, cond: s => enEquipo(s) && s.negocios.length > 0 && n0(s).semanas >= 4 && !(n0(s).ctx.descuento > 0), peso: () => 1,
      ic: '📦', titulo: 'Un proveedor ofrece un gran descuento', texto: () => 'Material un 10 % más barato durante dos meses… si vas tú a firmarlo.',
      ops: [
        { id: 'ir', n: 'Ir en persona', ventaja: 'Material −10 % durante 8 semanas', coste: '−12 energía (y −5 de preparación si hay gran partido)', riesgo: 'Ninguno', tags: ['dinero'], fx: s => { n0(s).ctx.descuento = 8; s.p.energia = clamp(s.p.energia - 12, 0, 100); if (granPartidoCerca(s)) P2.moverPreparacion(s, -5, 0, 'Fuiste al proveedor'); return 'Firmado: 8 semanas de material más barato.'; } },
        { id: 'mandar', n: 'Mandar a alguien', ventaja: 'No pierdes tiempo', coste: 'Nada', riesgo: '50 %: no cierra el trato', tags: ['riesgo'], fx: s => { if (rnd(s) < 0.5) { n0(s).ctx.descuento = 8; return 'Tu encargada lo consigue.'; } return 'Sin ti, el proveedor no se fía. No hay trato.'; } },
        { id: 'no', n: 'Dejarlo pasar', ventaja: 'Nada cambia', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: () => 'Lo dejas pasar.' },
      ] },
    { id: 'colaboraSponsor', ambito: 'carrera', cruce: true, fases: ['club'], unaVez: true, cond: s => enEquipo(s) && s.negocios.length > 0 && (s.patros || []).length > 0 && n0(s).semanas >= 4, peso: () => 1.5,
      ic: '🤳', titulo: 'Tu patrocinador propone una colaboración con tu negocio', texto: () => 'Una campaña conjunta: tu cara, su marca y tu negocio en el cartel.',
      ops: [
        { id: 'si', n: 'Aceptar la colaboración', ventaja: '+400 € de caja y 4 semanas con más clientes', coste: '−5 energía', riesgo: 'Ninguno', tags: ['dinero'], fx: s => { const n = n0(s); n.caja += 400; n.ctx.colabora = 4; s.p.energia = clamp(s.p.energia - 5, 0, 100); return 'Sale el cartel: el barrio entero lo ve.'; } },
        { id: 'no', n: 'Mantenerlo separado', ventaja: 'Tu negocio es tuyo', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: () => 'Prefieres no mezclar.' },
      ] },
    // ---------- Relaciones con consecuencia diferida ----------
    { id: 'ikerInvierte', ambito: 'relacion', rel: 'iker', fases: ['club'], unaVez: true, cond: s => s.negocios.length > 0 && P2.valorRel(s, 'iker') >= 60 && n0(s).semanas >= 3, peso: () => 2,
      ic: '⚽', titulo: 'Iker quiere invertir en tu negocio', texto: () => '«Me fío de ti. Te pongo 1.500 € si me das una parte de lo que gane.»',
      ops: [
        { id: 'si', n: 'Aceptar sus 1.500 €', ventaja: '+1.500 € de caja ahora', coste: 'En 10 semanas, Iker espera su parte', riesgo: 'Si el negocio no gana, la relación sufre', tags: ['dinero', 'riesgo'], fx: s => { n0(s).caja += 1500; P2.cambiarRel(s, 'iker', 5, 'Invirtió en tu negocio'); prog(s, 10, 'ikerDividendo', { neg: n0(s).id }); return 'Os dais la mano en el vestuario.'; } },
        { id: 'no', n: 'Mejor no mezclar amistad y dinero', ventaja: 'Sin compromisos', coste: '−2 con Iker', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { P2.cambiarRel(s, 'iker', -2, 'No aceptaste su inversión'); return 'Iker lo entiende.'; } },
      ] },
    { id: 'soniaContacto', ambito: 'relacion', rel: 'sonia', fases: ['club'], unaVez: true, cond: s => s.negocios.length > 0 && s.agente && (s.agenteId || 'sonia') === 'sonia' && P2.valorRel(s, 'sonia') >= 55, peso: () => 2,
      ic: '🤝', titulo: 'Sonia te presenta un contacto de empresa', texto: () => '«Una empresa busca un sitio para sus empleados. He pensado en tu negocio.»',
      ops: [
        { id: 'si', n: 'Reunirte con ellos', ventaja: 'Contrato corporativo: 6 semanas con más clientes', coste: '−8 energía', riesgo: 'Ninguno', tags: ['dinero'], fx: s => { n0(s).ctx.corporativo = 6; s.p.energia = clamp(s.p.energia - 8, 0, 100); P2.cambiarRel(s, 'sonia', 4, 'Aprovechaste su contacto'); return 'Firmáis un acuerdo de 6 semanas.'; } },
        { id: 'no', n: 'Ahora no', ventaja: 'Sin reuniones', coste: '−2 con Sonia', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'sonia', -2, 'No te reuniste con su contacto'); return 'Sonia lo apunta.'; } },
      ] },
    { id: 'marcExjugador', ambito: 'relacion', rel: 'marc', fases: ['club', 'amateur'], unaVez: true, cond: s => enEquipo(s) && P2.valorRel(s, 'marc') >= 60 && s.semana >= 14, peso: () => 2,
      ic: '🧑', titulo: 'Marc te presenta a un exjugador', texto: () => 'Jugó en Primera hace años. Marc le ha hablado de ti y quiere conocerte.',
      ops: [
        { id: 'cafe', n: 'Quedar a tomar un café', ventaja: 'Te dará un consejo para tu próximo gran partido', coste: '−5 energía', riesgo: 'Ninguno', tags: ['deporte', 'seguro'], fx: s => { s.p.energia = clamp(s.p.energia - 5, 0, 100); P2.cambiarRel(s, 'marc', 4, 'Te presentó a un exjugador'); prog(s, 4, 'consejoExjugador'); return 'Hablas dos horas con él. «Cuando llegue el gran día, llámame.»'; } },
        { id: 'no', n: 'No tienes tiempo', ventaja: 'Sigues con lo tuyo', coste: '−3 con Marc', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'marc', -3, 'No quisiste conocer al exjugador'); return 'Marc se encoge de hombros.'; } },
      ] },
    { id: 'padresCrisis', ambito: 'relacion', rel: 'madre', fases: ['club', 'amateur'], enfria: 40, cond: s => P2.valorRel(s, 'madre') >= 60 && (s.p.dinero < 150 || s.negocios.some(n => n.rachaNeg >= 3)), peso: () => 4,
      ic: '👩', titulo: 'Tus padres se enteran de que vas justo', texto: () => '«No nos lo habías contado. Tenemos algo ahorrado: 1.000 €, sin intereses.»',
      ops: [
        { id: 'si', n: 'Aceptar su ayuda', ventaja: '+1.000 € ahora', coste: 'Se lo devuelves en 12 semanas', riesgo: 'Si no puedes, la relación se resiente', tags: ['dinero'], fx: s => { s.p.dinero += 1000; P2.cambiarRel(s, 'madre', 3, 'Te ayudaron en una crisis'); prog(s, 12, 'devolverPadres'); return 'Tu madre te abraza: «Para eso estamos».'; } },
        { id: 'no', n: 'Decirles que puedes solo/a', ventaja: 'Tu orgullo intacto', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { P2.cambiarRel(s, 'padre', 2, 'Quisiste salir adelante solo/a'); return 'Tu padre asiente, orgulloso.'; } },
      ] },
    { id: 'misterPaco', ambito: 'relacion', fases: ['club'], unaVez: true, cond: s => (s.amateurSemanas || 0) > 0 && enEquipo(s) && s.contrato && s.contrato.temporadasRestantes <= 1 && s.temporada.jornada >= s.temporada.calendario.length - 4, peso: () => 3,
      ic: '👔', titulo: 'Míster Paco (CD San Roque) te llama', texto: () => '«Me han preguntado por ti desde otro club. Les he dicho que eres de fiar.»',
      ops: [
        { id: 'gracias', n: 'Agradecérselo de corazón', ventaja: '+12 interés de otros clubes', coste: 'Nada', riesgo: 'Ninguno', tags: ['deporte', 'seguro'], fx: s => { s.interes = r1(clamp(s.interes + 12, 0, 100)); return 'Tu paso por el amateur vuelve a abrirte puertas.'; } },
      ] },
    { id: 'soniaCampana', ambito: 'relacion', rel: 'sonia', fases: ['club'], enfria: 26, cond: s => s.agente && (s.agenteId || 'sonia') === 'sonia' && P2.valorRel(s, 'sonia') >= 65 && s.hitos.contrato, peso: () => 1.5,
      ic: '📸', titulo: 'Sonia te consigue una campaña puntual', texto: () => 'Una marca de ropa deportiva quiere tu foto para una campaña de una semana.',
      ops: [
        { id: 'si', n: 'Hacer la campaña', ventaja: '+500 € y +2 marca personal', coste: '−10 energía', riesgo: 'Ninguno', tags: ['dinero'], fx: s => { s.p.dinero += 500; s.acum.patrocinio += 500; P2.sumarMarca(s, 2); s.p.energia = clamp(s.p.energia - 10, 0, 100); P2.cambiarRel(s, 'sonia', 3, 'Hiciste la campaña que consiguió'); return 'Sesión de fotos y +500 €.'; } },
        { id: 'no', n: 'Rechazarla', ventaja: 'Te centras', coste: '−3 con Sonia', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'sonia', -3, 'Rechazaste su campaña'); return 'Sonia suspira.'; } },
      ] },
    { id: 'daniBenefico', ambito: 'relacion', rel: 'dani', fases: ['club', 'amateur'], unaVez: true, cond: s => enEquipo(s) && s.semana >= 12, peso: () => 2,
      ic: '🧑‍🦱', titulo: 'Dani organiza un partido benéfico en el barrio', texto: () => 'Quiere que juegues con los de siempre para recaudar para el polideportivo.',
      ops: [
        { id: 'ir', n: 'Jugar con el barrio', ventaja: '+2 reputación, +8 con Dani; el barrio no lo olvidará', coste: '−12 energía', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { s.p.energia = clamp(s.p.energia - 12, 0, 100); s.p.rep = r1(clamp(s.p.rep + 2, 0, 100)); P2.cambiarRel(s, 'dani', 8, 'Jugaste su partido benéfico'); prog(s, 6, 'barrioGrada'); return 'Media ciudad viene a verte jugar en la plaza.'; } },
        { id: 'no', n: 'No puedes', ventaja: 'Descansas', coste: '−5 con Dani', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'dani', -5, 'No fuiste al partido benéfico'); return 'Dani lo entiende… más o menos.'; } },
      ] },
    { id: 'madreFinal', ambito: 'relacion', rel: 'madre', fases: ['club', 'amateur'], enfria: 20, cond: s => granPartidoCerca(s, 3) && s.eventoImportante.semana > s.semana && P2.valorRel(s, 'madre') >= 70, peso: () => 3,
      ic: '👩', titulo: 'Tu madre quiere venir a verte', texto: s => `Se ha enterado de ${s.eventoImportante.n.toLowerCase()} y quiere estar en la grada.`,
      ops: [
        { id: 'si', n: '¡Que venga!', ventaja: '+5 preparación y menos presión', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { P2.moverPreparacion(s, 5, -10, 'Tu madre estará en la grada'); P2.cambiarRel(s, 'madre', 4, 'La invitaste a tu gran partido'); return 'Tu madre ya tiene la bufanda preparada.'; } },
        { id: 'no', n: 'Prefieres concentrarte solo/a', ventaja: 'Nada cambia', coste: '−3 con tu madre', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'madre', -3, 'No quisiste que fuera a tu gran partido'); return 'Lo verá por la tele.'; } },
      ] },
    { id: 'padreConsejo', ambito: 'relacion', rel: 'padre', fases: ['club', 'amateur'], enfria: 20, cond: s => granPartidoCerca(s, 2) && s.eventoImportante.semana > s.semana && P2.valorRel(s, 'padre') >= 65, peso: () => 3,
      ic: '👨', titulo: 'Tu padre quiere darte un consejo', texto: () => '«Yo también jugué de joven. Escúchame un momento antes del gran día.»',
      ops: [
        { id: 'si', n: 'Escucharle', ventaja: '+6 de preparación', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { P2.moverPreparacion(s, 6, -3, 'Escuchaste a tu padre'); P2.cambiarRel(s, 'padre', 3, 'Le escuchaste antes del gran partido'); return '«Respira, mira la pelota y disfruta.»'; } },
        { id: 'no', n: '«Papá, ya lo sé»', ventaja: 'Nada', coste: '−2 con tu padre', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { P2.cambiarRel(s, 'padre', -2, 'No quisiste escucharle'); return 'Tu padre se calla.'; } },
      ] },
  ];
  for (const E of CRUCES) P2.SUCESOS.push(E);
  if (P2.EVENTOS_RELACION) for (const E of CRUCES) if (E.ambito === 'relacion') P2.EVENTOS_RELACION.push(E);

  // ---------- Efectos diferidos ----------
  const neg = (s, d) => s.negocios.find(n => n.id === d.neg) || s.negocios[0];
  Object.assign(P2.EFECTOS, {
    estrellaPospuesta: (s, d) => { const n = neg(s, d); if (!n) return null; if (rnd(s) < 0.4 && n.empleados > 1) { n.empleados--; n.fama = r1(n.fama - 5); return ['💬', `Esto viene de la semana ${d.desde}: tu mejor empleada se va. No esperó.`, 'mal']; } n.moral = r1(clamp(n.moral + 0.02, 0.7, 1.1)); return ['💬', `Esto viene de la semana ${d.desde}: por fin habláis de su subida y se queda.`, 'bien']; },
    ikerDividendo: (s, d) => { const n = neg(s, d); if (!n) return null; if (P2.beneficioMedio(n) > 0) { n.caja -= 600; P2.cambiarRel(s, 'iker', 8, 'Le devolviste su inversión con beneficio'); return ['⚽', `Esto viene de la semana ${d.desde}: Iker cobra 600 € de su parte. Está encantado.`, 'bien']; } P2.cambiarRel(s, 'iker', -6, 'Su inversión no dio beneficio'); return ['⚽', `Esto viene de la semana ${d.desde}: el negocio no da beneficio e Iker no cobra. Se le nota molesto.`, 'mal']; },
    consejoExjugador: (s, d) => { if (s.eventoImportante && s.eventoImportante.semana >= s.semana) { P2.moverPreparacion(s, 10, -5, 'Consejo del exjugador'); return ['🧑', `Esto viene de la semana ${d.desde}: el exjugador te llama antes de ${s.eventoImportante.n.toLowerCase()} (+10 de preparación).`, 'bien']; } prog(s, 3, 'consejoExjugador', { desde: d.desde }); return null; },
    devolverPadres: s => { if (s.p.dinero >= 1000) { s.p.dinero -= 1000; P2.cambiarRel(s, 'madre', 5, 'Les devolviste el préstamo'); P2.cambiarRel(s, 'padre', 5, 'Les devolviste el préstamo'); return ['👩', 'Devuelves a tus padres los 1.000 €. Están orgullosos.', 'bien']; } P2.cambiarRel(s, 'padre', -4, 'No pudiste devolver el préstamo'); return ['👨', 'Aún no puedes devolver el préstamo. Tu padre no dice nada, pero lo nota.', 'mal']; },
    barrioGrada: (s, d) => { if (s.eventoImportante && s.eventoImportante.semana >= s.semana) { P2.moverPreparacion(s, 0, -10, 'El barrio estará en la grada'); return ['🧑‍🦱', `Esto viene de la semana ${d.desde}: el barrio llenará la grada en ${s.eventoImportante.n.toLowerCase()} (menos presión).`, 'bien']; } s.confianza = clamp(s.confianza + 3, 0, 100); return ['🧑‍🦱', `Esto viene de la semana ${d.desde}: la gente del barrio viene a animarte (+3 confianza).`, 'bien']; },
  });

  // ---------- Tienda: el deseo no se olvida ----------
  // Una sola sugerencia si a partir de la semana 10 no tienes objetivo; y una línea suave al cobrar algo grande
  function sugerenciaDeseo(s) {
    if (s.deseoActual || s.semana < 10 || (s.deseoSugerido && s.deseoSugerido !== s.semana)) return null;
    if (!P2.PRODUCTOS) return null;
    const l = P2.PRODUCTOS.filter(P => P2.deseable && P2.deseable(P) && !P.inicial && !P.consumible && !P2.posee(s, P.id) && !P2.bloqueoProducto(s, P) && P.precio > Math.max(50, s.p.dinero * 0.3) && P.precio <= Math.max(300, s.p.dinero * 2.5))
      .sort((a, b) => a.precio - b.precio);
    return l.length ? l.slice(0, 2) : null;
  }
  function recordatorioDeseo(s, R) {
    const gan = (R.dinero0 != null ? s.p.dinero - R.dinero0 : 0);
    if (gan < 800 || (s.ultRecordatorioDeseo && s.semana - s.ultRecordatorioDeseo < 8)) return;
    const P = s.deseoActual && P2.producto(s.deseoActual);
    const puede = P ? s.p.dinero >= P.precio : (P2.PRODUCTOS || []).some(x => P2.deseable && P2.deseable(x) && !x.inicial && !P2.posee(s, x.id) && x.precio <= s.p.dinero && x.precio >= 300 && !P2.bloqueoProducto(s, x));
    if (!puede) return;
    s.ultRecordatorioDeseo = s.semana;
    R.lineas.push(['🛍️', P ? `Ya puedes permitirte tu objetivo: ${P.n}.` : 'Ahora puedes permitirte algunos objetivos que tenías guardados.', 'bien']);
  }

  // ---------- Mi historia: tu camino ----------
  function caminoCarrera(s) {
    const l = [];
    for (const p of s.pruebas || []) l.push({ semana: p.semana, ic: '📋', t: `Pruebas: sacas un ${p.score}${p.score < P2.CFG.pruebas.rangos[2].min ? ' (no llega)' : ''}` });
    if ((s.amateurSemanas || 0) > 0) l.push({ semana: (s.hitos.contrato || s.semana) - s.amateurSemanas, ic: '🟢', t: `Ruta amateur en CD San Roque (${s.amateurSemanas} semanas)` });
    for (const H of P2.HITOS) if (s.hitos[H.id]) l.push({ semana: s.hitos[H.id], ic: '🏅', t: H.n });
    for (const T of s.trofeos || []) l.push({ semana: T.semana || 0, ic: T.ic, t: `Título: ${T.n}` });
    for (const m of s.memorables || []) l.push(m);
    for (const d of (s.diario || [])) if (/repesca|Asciende|ascenso|crisis|Me retiro|Compras|Vendes/i.test(d.t) && l.length < 80) l.push({ semana: d.semana, ic: d.ic, t: d.t });
    const vistos = new Set();
    return l.filter(x => { const k = x.semana + '|' + x.t; if (vistos.has(k)) return false; vistos.add(k); return true; }).sort((a, b) => a.semana - b.semana);
  }

  Object.assign(P2, { CRUCES, granPartidoCerca, sugerenciaDeseo, recordatorioDeseo, caminoCarrera });
})(globalThis.P2 = globalThis.P2 || {});
