/* =====================================================================
   19 · EXPERIENCIA (P2.6): que el jugador entienda, se ilusione y sepa siempre qué hace
   - Situación de la semana: alguien de tu vida te pone en contexto antes de decidir.
   - Objetivos: inmediato (el siguiente hito), personal (lo que tú quieres) y gran sueño.
   - Calendario: los próximos 2–3 acontecimientos que importan para decidir.
   - Consecuencias contadas como historia (los números siguen ahí, debajo).
   - Clubes con identidad y memoria (quién te descartó, a quién rechazaste).
   Todo es presentación o datos ligeros sobre los sistemas que ya existen: no toca el azar de la partida.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, clamp, eur, nf } = P2;
  const h32 = str => { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const elige = (s, k, l) => l[h32(`${s.seed}|${k}|${s.semana}`) % l.length];
  const nombre = (s, id) => { const R = P2.persona && P2.persona(id); return R ? (P2.nombreRel ? P2.nombreRel(s, R) : R.n) : id; };

  // ---------- Gran sueño (se elige al crear la carrera; se puede cambiar en Mi historia) ----------
  const SUENOS = [
    { id: 'primera', ic: '🏟️', n: 'Jugar en la máxima categoría', d: 'Llegar a lo más alto en tu deporte.', prog: s => clamp(((s.temporada ? P2.LIGAS[s.temporada.liga].nivel : 0) || 0) / 4, 0, 1), txt: s => (s.temporada ? `Ahora: ${P2.LIGAS[s.temporada.liga].n}` : 'Aún sin club') },
    { id: 'leyenda', ic: '🏆', n: 'Ser una leyenda: 5 títulos', d: 'Ganar copas, ligas y finales.', prog: s => clamp((s.trofeos || []).length / 5, 0, 1), txt: s => `${(s.trofeos || []).length} de 5 títulos` },
    { id: 'imperio', ic: '🏢', n: 'Tener mi propio imperio: 3 empresas', d: 'Que tus negocios trabajen por ti.', prog: s => clamp(s.negocios.length / 3, 0, 1), txt: s => `${s.negocios.length} de 3 empresas` },
    { id: 'millon', ic: '💰', n: 'Ser millonario/a', d: 'Un millón de patrimonio.', prog: s => clamp(P2.patrimonio(s) / 1e6, 0, 1), txt: s => `${eur(P2.patrimonio(s))} de 1.000.000 €` },
  ];
  const sueno = s => SUENOS.find(x => x.id === s.sueno) || null;

  // ---------- Objetivo personal: lo que TÚ quieres (aprovecha hitos, patrimonio y la lista de deseos) ----------
  const tiene = (s, id) => !!(P2.posee && P2.posee(s, id));
  const METAS = [
    { id: 'contrato', ic: '✍️', n: 'Firmar mi primer contrato', hecho: s => !!s.hitos.contrato, prog: s => (s.hitos.contrato ? 1 : s.hitos.prueba ? 0.6 : clamp(s.p.rep / CFG.captacion.repOjeador, 0, 1) * 0.5) },
    { id: 'titular', ic: '👕', n: 'Ser titular', hecho: s => !!s.hitos.titular, prog: s => clamp((s.stats.titular || 0) / CFG.club.titularidadesHito, 0, 1), req: s => !!s.hitos.contrato },
    { id: 'patro', ic: '🤝', n: 'Conseguir mi primer patrocinador', hecho: s => !!s.hitos.patro, prog: s => (s.hitos.patro ? 1 : clamp((s.p.marca || 0) / 15, 0, 0.9)), req: s => !!s.hitos.contrato },
    { id: 'titulo', ic: '🏆', n: 'Ganar una competición', hecho: s => (s.trofeos || []).length > 0, prog: s => ((s.trofeos || []).length ? 1 : 0), req: s => !!s.hitos.contrato },
    { id: 'moto', ic: '🛵', n: 'Comprarme una moto', hecho: s => tiene(s, 'moto'), prog: s => clamp(s.p.dinero / 1900, 0, 1), producto: 'moto' },
    { id: 'coche', ic: '🚗', n: 'Comprarme un coche', hecho: s => ['cocheUsado', 'deportivo', 'superdeportivo'].some(id => tiene(s, id)), prog: s => clamp(s.p.dinero / 5200, 0, 1), producto: 'cocheUsado' },
    { id: 'negocio', ic: '💈', n: 'Ahorrar para abrir un negocio', hecho: s => s.negocios.length > 0, prog: s => clamp(s.p.dinero / Math.max(1, P2.capitalNecesario ? P2.capitalNecesario('peluqueria', 0) : 12000), 0, 1) },
    { id: 'rentable', ic: '📈', n: 'Tener una empresa rentable', hecho: s => !!s.hitos.rentable, prog: s => (s.hitos.rentable ? 1 : s.negocios.length ? clamp((s.negocios[0].rachaPos || 0) / 6, 0, 0.95) : 0), req: s => s.negocios.length > 0 },
    { id: 'p100k', ic: '🏦', n: 'Llegar a 100.000 € de patrimonio', hecho: s => P2.patrimonio(s) >= 1e5, prog: s => clamp(P2.patrimonio(s) / 1e5, 0, 1) },
    { id: 'p1m', ic: '💎', n: 'Llegar al millón de patrimonio', hecho: s => P2.patrimonio(s) >= 1e6, prog: s => clamp(P2.patrimonio(s) / 1e6, 0, 1), req: s => P2.patrimonio(s) >= 1e5 },
  ];
  const metasDisponibles = s => METAS.filter(m => !m.hecho(s) && (!m.req || m.req(s)));
  // El objetivo personal visible: la lista de deseos manda (es un producto concreto); si no, la meta elegida
  function objetivoPersonal(s) {
    const P = s.deseoActual && P2.producto && P2.producto(s.deseoActual);
    if (P) return { tipo: 'deseo', ic: P.ic, n: P.n, prog: clamp(Math.max(0, s.p.dinero) / P.precio, 0, 1), txt: `${eur(Math.max(0, Math.min(s.p.dinero, P.precio)))} / ${eur(P.precio)}`, listo: s.p.dinero >= P.precio };
    const M = METAS.find(m => m.id === s.metaPersonal);
    if (M && !M.hecho(s)) return { tipo: 'meta', id: M.id, ic: M.ic, n: M.n, prog: M.prog(s), txt: `${Math.round(M.prog(s) * 100)} %` };
    return null;
  }
  function fijarMeta(s, id) { if (id && !METAS.some(m => m.id === id)) return false; s.metaPersonal = id || null; if (id) P2.tele(s, 'meta_personal', { id }); return true; }
  // Si cumples tu objetivo personal: se celebra y se propone el siguiente
  function revisarMeta(s, R) {
    const M = METAS.find(m => m.id === s.metaPersonal);
    if (M && M.hecho(s)) { s.metaPersonal = null; R && R.lineas.push(['🎯', `¡Objetivo personal cumplido: ${M.n}! Elige el siguiente en Inicio.`, 'bien']); P2.anotar(s, '🎯', `Objetivo cumplido: ${M.n}.`); P2.recordar && P2.recordar(s, '🎯', `Objetivo personal cumplido: ${M.n}`); }
  }

  // ---------- Calendario: los próximos acontecimientos que ayudan a decidir ----------
  function calendario(s, max = 3) {
    const l = [], add = (sem, ic, t, imp = 2) => { if (sem >= 0 && sem < 30) l.push({ sem, ic, t, imp }); };
    if (s.fase === 'barrio') add(P2.semanasCaptacion(s) - 1, '⏰', 'Fin de la captación: o te ve un ojeador o toca el amateur', 3);
    if (s.fase === 'pruebas' && s.invitacion) add(s.invitacion.dia - s.semana, '📋', 'Día de pruebas: nivel y energía cuentan', 5);
    if (s.fase === 'amateur') { const k = CFG.amateur.repescaCada - ((s.amateurSemanas || 0) % CFG.amateur.repescaCada); add(k - 1, '🔁', 'Repesca: otra oportunidad de ser profesional', 4); }
    const ev = s.eventoImportante; if (ev && ev.semana >= s.semana) add(ev.semana - s.semana, ev.ic, `${ev.n} (preparación ${Math.round(P2.prepEfectiva(ev, s))} %)`, 5);
    const T = s.temporada;
    if (T && !T.cerrada && (s.fase === 'club' || s.fase === 'amateur')) {
      const q = T.calendario.length - T.jornada;
      if (!ev || ev.tipo !== 'promocion') add(q, '🏁', s.contrato && s.contrato.temporadasRestantes <= 1 && !P2.OFERTAS[s.contrato.oferta].amateur ? 'Fin de temporada y de tu contrato: toca negociar' : 'Fin de temporada', s.contrato && s.contrato.temporadasRestantes <= 1 ? 4 : 2);
      for (const c of (T.copas || [])) if (c.estado === 'viva') { const C = P2.COMPETICIONES[c.id]; if (!ev || ev.tipo !== 'final' || ev.jornada !== C.final) add(C.final - T.jornada, C.ic, `Final de la ${C.n} (si llegáis)`, 3); }
    }
    for (const p of s.patros || []) { const M = P2.MARCAS && P2.MARCAS[p.id]; const fin = p.desde + p.semanas - s.semana; if (M) add(fin, '🤝', `Acaba el patrocinio de ${M.n}`, 2); if (p.proxActo != null) add(p.proxActo - s.semana, '📣', `Acto de ${M ? M.n : 'tu patrocinador'} (ocupa la semana)`, 2); }
    for (const n of s.negocios) if (n.deuda > 0) add(0, '🏦', `Cuota del préstamo: ${eur(n.cuota)}/semana (te quedan ${eur(n.deuda)})`, 1);
    if (s.oportunidadAbierta && !s.oportunidad) add(0, '🔑', 'Segunda inversión disponible en Empresa', 2);
    const v = P2.vidas(s); if (v.n < P2.VIDAS.max) add(P2.semanasParaVida(s), '❤️', 'Recuperas una vida', 1);
    l.sort((a, b) => a.sem - b.sem || b.imp - a.imp);
    const vistos = new Set();
    return l.filter(x => { if (vistos.has(x.t)) return false; vistos.add(x.t); return true; }).slice(0, max);
  }
  const cuandoTxt = k => (k <= 0 ? 'Esta semana' : k === 1 ? 'La semana que viene' : `En ${k} semanas`);

  // ---------- Situación de la semana: alguien de tu vida te pone en contexto ----------
  function situacionSemana(s) {
    const K = CFG.captacion, e = s.p.energia, din = s.p.dinero;
    const marc = { ic: '🧑', n: nombre(s, 'marc') }, madre = { ic: '👩', n: nombre(s, 'madre') }, padre = { ic: '👨', n: nombre(s, 'padre') }, dani = { ic: '🧑‍🦱', n: nombre(s, 'dani') };
    const mister = { ic: '👔', n: s.temporada ? nombre(s, 'mister') : 'El míster' }, paco = { ic: '👔', n: 'Míster Paco' };
    if (s.fase === 'barrio') {
      const falta = Math.max(0, Math.ceil(K.repOjeador - s.p.rep)), q = P2.semanasCaptacion(s);
      if (s.semana === 1) return { quien: marc, texto: '«Dicen que los ojeadores se pasan por la plaza cuando hay buenos partidos… aunque en el almacén buscan gente y pagan bien.»', pista: 'Plaza → reputación · Entrenar → nivel · Trabajar → dinero' };
      if (e < 35) return { quien: madre, texto: '«Te veo agotado/a. Si sigues así, cualquier ojeador te pillará en un mal día.»', pista: 'Descansar recupera energía; con poca energía todo rinde menos.' };
      if (din < 60) return { quien: padre, texto: '«Este mes vamos justos en casa. Algo de dinero no vendría mal… aunque tú sabrás qué es lo importante.»', pista: 'Sin dinero no puedes pagar extras como el campus o el preparador.' };
      if (falta <= 4 && falta > 0) return { quien: dani, texto: `«¡Estás a nada! Un buen partido más en la plaza y seguro que alguien pregunta por ti.» (te faltan ${falta} de reputación)`, pista: 'La reputación atrae a los ojeadores.' };
      return elige(s, 'barrio', [
        { quien: marc, texto: `«Te faltan ${falta} de reputación para que venga un ojeador. Quedan ${q} semanas: o lo intentas fuerte o te buscas un plan B.»` },
        { quien: dani, texto: '«En la plaza hay pique este finde. Si juegas, que se note.»' },
        { quien: padre, texto: '«Lo del fútbol está bien, pero ¿y si no sale? Piensa también en ganar algo.»' },
      ]);
    }
    if (s.fase === 'pruebas' && s.invitacion) {
      const k = s.invitacion.dia - s.semana;
      return { quien: marc, texto: k <= 0 ? '«¡Hoy es el día! Respira, céntrate y demuestra lo que vales.»' : `«¡Te han invitado a una prueba! Es ${k === 1 ? 'la semana que viene' : `dentro de ${k} semanas`}. Llega con nivel y con energía.»`, pista: 'Entrenar sube el nivel; el preparador te enseña qué te van a pedir.' };
    }
    if (s.fase === 'amateur') {
      const k = CFG.amateur.repescaCada - ((s.amateurSemanas || 0) % CFG.amateur.repescaCada);
      return { quien: paco, texto: `«Aquí juegas cada domingo, chaval/a. En ${k} ${k === 1 ? 'semana' : 'semanas'} vuelven los ojeadores a la repesca: que te vean en forma.»`, pista: 'Puedes compaginar el amateur con media jornada de trabajo.' };
    }
    if (s.fase === 'retirado') return null;
    const ev = s.eventoImportante;
    if (ev && ev.semana >= s.semana) { const k = ev.semana - s.semana; return { quien: mister, texto: `«${ev.n} ${k <= 0 ? 'es esta semana' : k === 1 ? 'es la semana que viene' : `es en ${k} semanas`}. Quiero verte preparado/a: lo que hagas estos días cuenta.»`, pista: `Preparación ${Math.round(P2.prepEfectiva(ev, s))} %: entrenar suma; empresa, trabajo y actos restan.` }; }
    const n = s.negocios.find(x => x.crisis || x.rachaNeg >= 2);
    if (n) return { quien: { ic: '💼', n: 'Tu encargada' }, texto: `«El negocio lleva ${n.rachaNeg} semanas perdiendo dinero. Habría que tomar decisiones…»`, pista: 'En Empresa puedes cambiar precios, sueldos, personal y publicidad.' };
    if (e < 35) return { quien: madre, texto: '«Estás reventado/a. Así no vas a rendir el domingo.»', pista: 'Con poca energía juegas peor y te lesionas más.' };
    const T = s.temporada;
    if (T && !T.cerrada) {
      const pj = P2.partidoDeLaJornada(T), riv = pj ? P2.nombreEquipo(T, pj.rival) : null, ctx = P2.contexto(T)[0] || '';
      const pt = P2.probTitular ? P2.probTitular(s) : null;
      if (pt && pt.p < 0.5) return { quien: mister, texto: `«Ahora mismo no eres titular fijo. Demuéstrame en los entrenos que mereces jugar${riv ? ` contra ${riv}` : ''}.»`, pista: `Opciones de jugar: ${Math.round(pt.p * 100)} %. El entreno extra le gusta al míster.` };
      return elige(s, 'club', [
        { quien: mister, texto: `«${riv ? `Esta semana, ${riv}. ` : ''}${ctx}»` },
        { quien: { ic: '⚽', n: nombre(s, 'iker') }, texto: `«${riv ? `¿Has visto cómo juega ${riv}? ` : ''}Esta semana nos la jugamos, eh.»` },
        { quien: dani, texto: '«Todo el barrio va a verte jugar. No nos falles.»' },
      ]);
    }
    return null;
  }

  // ---------- Consecuencias contadas como historia ----------
  const FRASES = {
    entrenar: [['Horas de técnica y toques: notas el balón más pegado al pie.', 'nivel'], ['Entrenas a tope. Cansa, pero se nota.', 'nivel']],
    plaza: [['Medio barrio se queda mirando tus regates. Se empieza a hablar de ti.', 'rep'], ['Partidazo en la plaza. Alguien ha grabado tu golazo.', 'rep']],
    trabajar: [['Cargas cajas toda la semana. Acabas reventado/a, pero cobras.', 'dinero']],
    mediaJornada: [['Media jornada: algo de dinero sin dejar el balón.', 'dinero']],
    descansar: [['Duermes, comes bien y vuelves con ganas.', 'energia'], ['Una semana tranquila. El cuerpo lo agradece.', 'energia']],
    jornada: [['Jornada abierta: te miden con otros chavales de tu edad.', 'rep']],
    torneo: [['Torneo del barrio: pierdes el aliento, ganas cartel.', 'rep']],
    campus: [['Campus de tecnificación: entrenadores de verdad te corrigen cada gesto.', 'nivel']],
    preparador: [['El preparador te enseña lo que piden en las pruebas.', 'nivel']],
    entrenoExtra: [['Te quedas cuando todos se van. El míster lo ve.', 'nivel']],
    prensa: [['Entrevistas y redes: tu nombre suena más.', 'marca']],
    gestionar: [['Una semana en la empresa: números, clientes y equipo.', 'dinero']],
  };
  function narrarSemana(s, id, a, b, R) {
    const l = FRASES[id]; if (!l) return null;
    const f = elige(s, 'fr|' + id, l);
    let extra = '';
    if (b.energia < 25) extra = ' Ojo: vas muy justo/a de energía.';
    else if (id === 'trabajar' && b.dinero - a.dinero >= 150) extra = ' Ese dinero te da margen para lo que venga.';
    else if (id === 'plaza' && s.fase === 'barrio') { const falta = Math.max(0, Math.ceil(CFG.captacion.repOjeador - b.rep)); extra = falta ? ` Te faltan ${falta} de reputación para atraer a un ojeador.` : ' ¡Ya has llamado la atención de los ojeadores!'; }
    else if (R && R.partido && R.partido.nota != null && R.partido.nota >= 8) extra = ' Y el domingo, partidazo.';
    return f[0] + extra;
  }

  // ---------- Clubes con identidad y memoria ----------
  const IDENTIDAD = {
    puerto: { ic: '⏱️', n: 'Juegas seguro', d: 'Paga bien y te da minutos, pero el club va justo de dinero.' },
    atleticoFormacion: { ic: '🌱', n: 'Apuesta por jóvenes', d: 'La mejor cantera: entrenas mejor, cobras poco.' },
    atleticoFilial: { ic: '🏟️', n: 'Mejores instalaciones', d: 'Filial de un grande: mucha competencia por el puesto.' },
    sanroque: { ic: '🏘️', n: 'Club de barrio', d: 'Juegas siempre; nadie te paga, pero te ven en la repesca.' },
    atleticoPrimero: { ic: '🔥', n: 'Mucha presión', d: 'El primer equipo: visibilidad máxima y cero paciencia.' },
    costaReal: { ic: '📺', n: 'Visibilidad', d: 'Club de categoría: llegan marcas deportivas.' },
    academiaElite: { ic: '⭐', n: 'Oportunidad única', d: 'Pocas veces se abre esta puerta.' },
  };
  const memClubes = s => (s.memClubes && typeof s.memClubes === 'object' ? s.memClubes : (s.memClubes = {}));
  function recordarClub(s, club, tipo) { if (!club) return; const m = memClubes(s); m[club] = m[club] || {}; if (m[club][tipo] == null) m[club][tipo] = s.semana; }
  function notaClub(s, ofertaId) {
    const O = P2.OFERTAS[ofertaId]; if (!O) return null; const m = memClubes(s)[O.club]; if (!m) return null;
    if (m.rechazado != null) return `Hace ${s.semana - m.rechazado} semanas les dijiste que no. Han vuelto a llamar.`;
    if (m.descarto != null) return `En las pruebas no te quisieron. Ahora son ellos los que te buscan.`;
    if (m.jugaste != null) return 'Ya jugaste aquí: te conocen bien.';
    return null;
  }

  // ---------- La familia opina sobre las grandes compras ----------
  function opinionCompra(s, P) {
    if (!P || P.precio < 1500) return null;
    const vm = P2.valorRel(s, 'madre'), vp = P2.valorRel(s, 'padre');
    const ahorro = s.p.dinero < P.precio * 0.3;
    if (P.patrimonial >= 1) return vp >= 55 ? { ic: '👨', t: `Tu padre: «Una casa es una inversión. Bien hecho.»` } : { ic: '👨', t: 'Tu padre: «¿Tanto dinero de golpe? Espero que sepas lo que haces.»' };
    if (ahorro) return { ic: '👩', t: `Tu madre: «¡Qué ilusión! Pero te has quedado sin colchón… ojo con los imprevistos.»` };
    return vm >= 60 ? { ic: '👩', t: `Tu madre: «¡Te lo has ganado! Disfrútalo.»` } : { ic: '👨', t: `Tu padre: «Bonito. Aunque yo lo habría invertido.»` };
  }

  // El club con problemas económicos se nota: a veces paga tarde (identidad de UD Puerto)
  P2.SUCESOS.push({ id: 'pagoRetrasado', ambito: 'carrera', fases: ['club'], enfria: 16, cond: s => !!s.contrato && s.contrato.oferta === 'puerto' && s.semana >= (s.contrato.desde || 0) + 4, peso: () => 1.2,
    ic: '💸', titulo: 'UD Puerto se retrasa en pagar', texto: () => 'El club va justo de dinero: esta semana las nóminas llegan tarde.',
    ops: [
      { id: 'esperar', n: 'Esperar sin quejarte', ventaja: '+5 confianza del míster (le gusta la gente leal)', coste: 'Te quitan medio sueldo ahora; lo cobras dentro de 3 semanas', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { const x = Math.round(s.contrato.sueldo * 0.5); s.p.dinero -= x; s.confianza = clamp(s.confianza + 5, 0, 100); P2.programar(s, 3, 'pagoAtrasado', { x }); return 'Aguantas. El vestuario lo valora.'; } },
      { id: 'reclamar', n: 'Reclamar lo tuyo', ventaja: 'Cobras completo', coste: '−4 confianza del míster', riesgo: 'Te ganas fama de conflictivo/a', tags: ['dinero'], fx: s => { s.confianza = clamp(s.confianza - 4, 0, 100); return 'Te pagan… y te miran raro.'; } },
    ] });
  P2.EFECTOS.pagoAtrasado = (s, d) => { s.p.dinero += d.x; return ['💸', `UD Puerto por fin te paga lo que te debía (+${eur(d.x)}).`, 'bien']; };

  // Primera semana: una pequeña victoria segura en el barrio (la lanza la agenda, sin azar)
  P2.SUCESOS.push({ id: 'primeraPachanga', ambito: 'relacion', rel: 'dani', fases: ['barrio'], soloAgenda: true, cond: () => true, peso: () => 0,
    ic: '🧑‍🦱', titulo: 'Reto 3 contra 3 en la plaza', texto: s => `${nombre(s, 'dani')} te escribe: «Esta tarde hay reto en la plaza. 30 € para el equipo que gane… y siempre hay alguien mirando.»`,
    ops: [
      { id: 'jugar', n: 'Jugar el reto', ventaja: '+3 reputación y 30 € si ganáis', coste: '−10 energía', riesgo: 'Ninguno: es una pachanga', tags: ['deporte'],
        fx: s => { s.p.rep += 3; s.p.dinero += 30; s.p.energia = clamp(s.p.energia - 10, 0, 100); P2.anotar(s, '🏆', 'Ganas tu primer reto en la plaza.'); return '¡Ganáis! 30 € de premio y en el barrio ya se habla de ti.'; } },
      { id: 'mirar', n: 'Ir solo a mirar', ventaja: '+1 reputación: te dejas ver', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'], fx: s => { s.p.rep += 1; return 'Te dejas ver. La próxima vez, a jugar.'; } },
    ] });
  P2.EFECTOS.primeraPachanga = s => { if (s.fase !== 'barrio' || s.sucesosVistos.primeraPachanga != null) return null; s.sucesosVistos.primeraPachanga = s.semana; P2.encolar(s, { tipo: 'suceso', id: 'primeraPachanga' }); return null; };

  Object.assign(P2, { SUENOS, sueno, METAS, metasDisponibles, objetivoPersonal, fijarMeta, revisarMeta, calendario, cuandoTxt, situacionSemana, narrarSemana, IDENTIDAD, recordarClub, notaClub, opinionCompra });
})(globalThis.P2 = globalThis.P2 || {});
