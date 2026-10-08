/* =====================================================================
   04 · CARRERA: acciones de la semana, captación, pruebas, ofertas,
   contratos, convocatoria, partido y fin de temporada
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, ACCIONES, OFERTAS, OBJETIVOS, LIGAS, rnd, clamp, r1, entre, entero, eur, nf } = P2;

  const oferta = s => (s.contrato ? OFERTAS[s.contrato.oferta] : null);
  const enCaptacion = s => s.fase === 'barrio';
  const semanasCaptacion = s => Math.max(0, CFG.captacion.semanas - s.semana + 1);
  const tieneHito = (s, id) => !!s.hitos[id];

  // ---------- Acciones ----------
  function bloqueoAccion(s, id) {
    const A = ACCIONES[id];
    if (!A) return 'No existe.';
    if (!A.fases.includes(s.fase)) return 'Ahora no.';
    if (A.hito && !tieneHito(s, A.hito)) return 'Aún no.';
    if (A.soloSemanas && !CFG.captacion[A.soloSemanas].includes(s.semana)) {
      const prox = CFG.captacion[A.soloSemanas].find(w => w > s.semana);
      return prox ? `Solo en la semana ${prox}.` : 'Ya ha pasado.';
    }
    if (A.hastaSemana && s.semana > A.hastaSemana) return 'Ya no hay plazas.';
    if (A.unaVez && s.cont[id]) return 'Ya lo has hecho.';
    if (id === 'campus' && s.invitacion) return 'Ya tienes prueba.';
    if ((id === 'jornada' || id === 'torneo') && s.invitacion) return 'Ya tienes prueba.';
    if (s.p.lesion > 0 && A.energiaMin > 0 && id !== 'gestionar' && id !== 'prensa') return `Lesionado/a (${s.p.lesion} sem.).`;
    if (s.p.energia < A.energiaMin) return `Necesitas ${A.energiaMin} de energía.`;
    if (A.gasto && s.p.dinero < A.gasto) return `Necesitas ${eur(A.gasto)}.`;
    if (id === 'gestionar' && !s.negocios.length) return 'No tienes empresa.';
    return null;
  }
  function accionesDisponibles(s) {
    return Object.keys(ACCIONES).filter(id => ACCIONES[id].fases.includes(s.fase) && (!ACCIONES[id].hito || tieneHito(s, ACCIONES[id].hito)))
      .filter(id => !(ACCIONES[id].soloSemanas && !CFG.captacion[ACCIONES[id].soloSemanas].some(w => w >= s.semana)))
      .filter(id => !(ACCIONES[id].hastaSemana && s.semana > ACCIONES[id].hastaSemana))
      .filter(id => !((id === 'campus' || id === 'jornada' || id === 'torneo') && s.invitacion))
      .filter(id => !(ACCIONES[id].unaVez && s.cont[id]))
      .map(id => ({ id, A: ACCIONES[id], bloqueo: bloqueoAccion(s, id) }));
  }

  const subirNivel = (s, v, techo) => { const antes = s.p.nivel; if (antes >= techo) return 0; s.p.nivel = r1(Math.min(techo, s.p.nivel + v)); return r1(s.p.nivel - antes); };
  const techoBarrio = 62;

  // Efecto de la acción elegida. R recoge lo que pasa (y el «por qué»)
  function aplicarAccion(s, id, R) {
    const A = ACCIONES[id], veces = s.cont[id] || 0, P = s.p;
    s.cont[id] = veces + 1;
    if (A.gasto) { P.dinero -= A.gasto; s.acum.gastos += A.gasto; }
    if (A.energia) P.energia = clamp(P.energia + A.energia, 0, CFG.energia.max);
    const L = R.lineas, W = R.porque;
    switch (id) {
      case 'plaza': {
        const g = r1((2.5 + P.nivel / 25 + rnd(s) * 2.5) * Math.pow(0.82, veces));
        P.rep = r1(clamp(P.rep + g, 0, 100)); subirNivel(s, 0.5, techoBarrio);
        L.push(['⚽', `Partido en la plaza: +${nf(g)} de reputación.${veces >= 3 ? ' La plaza ya te conoce: cada vez impresiona menos.' : ''}`]);
        W.push(`Reputación = (2,5 + nivel/25 + azar 0–2,5) × 0,82^${veces} (veces que ya has jugado aquí).`);
        break;
      }
      case 'entrenar': {
        const g = subirNivel(s, 2.6 * Math.pow(0.9, veces) * (1 + P2.efectoTienda(s, 'entreno')), techoBarrio);
        L.push(['🏃', g > 0 ? `Entrenas duro: nivel +${nf(g)}.` : 'Entrenas, pero ya estás en tu techo del barrio.']);
        W.push(`Nivel = 2,6 × 0,9^${veces}. Entrenar solo, sin club, tiene techo (${techoBarrio}).`);
        break;
      }
      case 'trabajar': case 'mediaJornada': {
        P.dinero += A.dinero; s.acum.trabajo += A.dinero;
        L.push(['🛵', `Trabajas: +${eur(A.dinero)}.`]);
        break;
      }
      case 'descansar': L.push(['😴', `Descansas: +${A.energia} de energía.`]); break;
      case 'jornada': {
        const sc = r1(P.nivel + entre(s, -5, 5));
        W.push(`Jornada abierta: nivel ${nf(P.nivel)} + azar (±5) = ${nf(sc)}. Hace falta 50.`);
        if (sc >= 50) { invitar(s, 'jornada', R); L.push(['📋', `¡El Atlético te ve en la jornada abierta (${nf(sc)})! Te invitan a las pruebas.`, 'bien']); }
        else { subirNivel(s, 0.5, techoBarrio); P.rep = r1(P.rep + 1); L.push(['📋', `En la jornada abierta no destacas lo suficiente (${nf(sc)} de 50). Te llevas la experiencia.`, 'mal']); }
        break;
      }
      case 'torneo': {
        const bt = P2.bonusTorneo ? P2.bonusTorneo(s) : 0;
        if (bt) L.push([bt > 0 ? '⭐' : '😖', bt > 0 ? `Tus jugadas en la final suman (+${nf(bt)}).` : `Fallas jugadas clave en la final (${nf(bt)}).`, bt > 0 ? 'bien' : 'mal']);
        const f = r1(P.nivel + P.rep * 0.2 + entre(s, -8, 8) + bt);
        W.push(`Torneo: nivel + reputación × 0,2 + azar (±8) = ${nf(f)}. Ganar: 52 · semifinal: 46.`);
        if (f >= 52) { P.rep = r1(P.rep + 10); invitar(s, 'torneo', R); L.push(['🏆', '¡Ganas el torneo local! +10 de reputación y un ojeador te invita a las pruebas.', 'bien']); }
        else if (f >= 46) { P.rep = r1(P.rep + 5); L.push(['🥈', 'Llegas a semifinales: +5 de reputación.']); }
        else { P.rep = r1(P.rep + 1); L.push(['😓', 'Caes en la primera ronda: +1 de reputación.', 'mal']); }
        if (rnd(s) < 0.12) { P.lesion = 2; L.push(['🤕', 'Te lesionas en el torneo: 2 semanas sin poder hacer esfuerzos.', 'mal']); }
        break;
      }
      case 'campus': {
        const g = subirNivel(s, 3, techoBarrio + 2);
        invitar(s, 'campus', R);
        L.push(['🎓', `Campus de tecnificación: nivel +${nf(g)} y el coordinador te propone para las pruebas.`, 'bien']);
        break;
      }
      case 'preparador': s.preparador = true; L.push(['🧑‍🏫', 'Sesión con preparador: ya sabes qué ejercicios te van a pedir (+3 en las pruebas).']); break;
      case 'entrenoExtra': {
        const O = oferta(s), g = subirNivel(s, 0.6 * (O ? O.entreno : 1) * (1 + P2.efectoPatro(s, 'entreno') + P2.efectoTienda(s, 'entreno')) * factorTecho(s), techoClub(s));
        s.confianza = clamp(s.confianza + 2, 0, 100); R.entrenoExtra = true;
        L.push(['🏋️', `Entreno extra: nivel +${nf(g)} y el míster lo valora (+2 confianza).`]);
        break;
      }
      case 'prensa': {
        const O = oferta(s), expo = (O ? O.exposicion : 1) * (s.temporada ? LIGAS[s.temporada.liga].exposicion || 1 : 1);
        const g = P2.sumarMarca(s, (1.6 + rnd(s)) * expo * (1 + P2.efectoTienda(s, 'prensa'))); s.confianza = clamp(s.confianza - 1, 0, 100);
        L.push(['🎙️', `Atiendes a la prensa y subes contenido: +${nf(g)} de marca personal (−1 confianza del míster).${P.marca >= P2.techoMarca(s) ? ' Sin más prestigio deportivo, tu imagen ya no da para mucho más.' : ''}`]);
        W.push(`Marca personal = (1,6 + azar) × exposición ${nf(expo)}. Tiene un techo suave de ${P2.techoMarca(s)} (30 + tu reputación deportiva): por encima solo rinde un 15 %.`);
        break;
      }
      case 'gestionar': {
        R.gestion = true; s.confianza = clamp(s.confianza - 2, 0, 100);
        L.push(['💼', 'Pasas la semana pendiente de tu empresa (−2 confianza del míster).']);
        break;
      }
      default: accionDeporte(s, id, R, veces);
    }
    // Skate: grabar vídeo también te da estilo
    if (id === 'prensa' && P2.deporteDe(s).id === 'skate') { s.estilo = Math.min(20, (s.estilo || 0) + 1); L.push(['🎥', `Tu parte de vídeo mejora tu estilo (${s.estilo}/20).`]); }
  }

  // ---------- Acciones propias de cada deporte ----------
  const GRADOS = ['6a', '6b', '6c', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b', '8b+', '8c', '8c+', '9a'];
  function accionDeporte(s, id, R, veces) {
    const P = s.p, L = R.lineas, W = R.porque, D = P2.deporteDe(s);
    if (id === 'roca') {
      const g = s.gradoRoca == null ? -1 : s.gradoRoca, sig = Math.min(GRADOS.length - 1, g + 1), dif = 44 + sig * 3;
      const p = clamp(0.35 + (P.nivel - dif) / 20, 0.08, 0.9), ok = rnd(s) < p;
      W.push(`Encadenar ${GRADOS[sig]}: probabilidad ${Math.round(p * 100)} % (tu nivel ${nf(P.nivel)} frente a ${dif}).`);
      if (ok) {
        s.gradoRoca = sig; const gr = r1(1 + sig * 0.35); P.rep = r1(clamp(P.rep + gr, 0, 100)); const gm = P2.sumarMarca(s, 0.5 + sig * 0.25);
        L.push(['🪨', `¡Encadenas tu primer ${GRADOS[sig]} en roca! +${nf(gr)} de reputación y +${nf(gm)} de marca.`, 'bien']);
        if (GRADOS[sig] === '8a' || GRADOS[sig] === '9a') P2.celebrar(s, { tipo: 'grado', grado: GRADOS[sig] });
      } else { subirNivel(s, 0.4, techoClub(s)); L.push(['🪨', `Pruebas tu proyecto de ${GRADOS[sig]}: te quedas a un movimiento. Vuelves con la piel rota y más técnica.`]); }
      return;
    }
    if (id === 'superficie') {
      const T = s.temporada, c = T ? P2.condicion(s, T, T.jornada) : s.especialidad;
      s.superficies = s.superficies || {}; s.superficies[c] = Math.min(3, (s.superficies[c] || 0) + 1);
      L.push(['🎾', `Entrenas en ${(P2.NOMBRE_COND[c] || c).toLowerCase()}: dominio ${s.superficies[c]}/3 (hasta +2 en esa superficie).`]);
      return;
    }
    if (id === 'tiro') { s.tiro = Math.min(10, (s.tiro || 0) + 1); s.confianza = clamp(s.confianza + 1, 0, 100); L.push(['🎯', `Sesión de tiro: acierto ${s.tiro}/10. El entrenador lo nota (+1 confianza).`]); return; }
    if (id === 'calle') {
      const g = r1((2 + P.nivel / 30 + rnd(s) * 2) * Math.pow(0.85, veces)); P.rep = r1(clamp(P.rep + g, 0, 100)); s.estilo = Math.min(20, (s.estilo || 0) + 1);
      L.push(['🏙️', `Patinas la calle: +${nf(g)} de reputación callejera y estilo ${s.estilo}/20.`]);
      const x = rnd(s);
      if (x < 0.1) { P.lesion = Math.max(P.lesion, 1); L.push(['🤕', 'Te comes el bordillo: una semana de baja.', 'mal']); }
      else if (x < 0.2) { P.dinero -= 60; s.acum.gastos += 60; L.push(['👮', 'Un vigilante os echa y te cae una multa de 60 €.', 'mal']); }
      return;
    }
    if (id === 'viajeSurf') {
      const swell = rnd(s) < 0.7;
      if (swell) { const g = subirNivel(s, 1.5, techoClub(s) + 2); P.rep = r1(clamp(P.rep + 2, 0, 100)); const m = P2.sumarMarca(s, 1.5); L.push(['✈️', `Entra el swell: olas de calidad toda la semana. Nivel +${nf(g)}, +2 reputación y +${nf(m)} de marca.`, 'bien']); }
      else { subirNivel(s, 0.4, techoClub(s)); L.push(['✈️', 'El mar no acompaña: olas pequeñas casi todo el viaje. Al menos desconectas.']); }
      return;
    }
    if (D.id !== 'futbol') L.push(['📅', 'Semana hecha.']);
  }

  // ---------- Captación y pruebas ----------
  function invitar(s, via, R) {
    if (s.invitacion) return;
    const dia = s.semana + CFG.captacion.semanasPreparacion;
    s.invitacion = { via, semana: s.semana, dia };
    P2.tele(s, 'invitacion', { via });
    s.fase = 'pruebas';
    P2.conseguirHito(s, 'prueba', R);
    P2.anotar(s, '📨', `Invitación a las pruebas (${via}). Son en la semana ${dia}.`);
  }
  function revisarOjeador(s, R) {
    if (s.fase === 'barrio' && !s.invitacion && s.p.rep >= CFG.captacion.repOjeador) {
      invitar(s, 'ojeador', R);
      R.lineas.push(['👀', `Un ojeador te ha visto en la plaza (reputación ${nf(s.p.rep)}): te invita a las pruebas.`, 'bien']);
    }
  }

  function puntuacionPruebas(s, via) {
    const K = CFG.pruebas, P = s.p, partes = [];
    partes.push(['Nivel', r1(P.nivel)]);
    const eb = K.energia.find(([min]) => P.energia >= min)[1];
    partes.push([`Energía (${Math.round(P.energia)})`, eb]);
    partes.push(['Reputación', r1(Math.min(K.repMax, P.rep * K.repFactor))]);
    if (s.preparador) partes.push(['Preparador', K.preparador]);
    if (K.viaBonus[via]) partes.push(['Vienes recomendado/a', K.viaBonus[via]]);
    partes.push(['Suerte del día', r1(entre(s, -K.suerte, K.suerte))]);
    const bm = P2.bonusPrueba ? P2.bonusPrueba(s) : 0; if (bm) partes.push(['Tus tiros (minijuego)', bm]);
    const score = Math.round(partes.reduce((a, [, v]) => a + v, 0));
    return { score, partes };
  }
  function ofertasPorPuntuacion(score) {
    const K = CFG.pruebas, r = K.rangos.find(x => score >= x.min);
    const l = r.ofertas.slice();
    if (K.excepcional.activo && score >= K.excepcional.min) l.push(K.excepcional.oferta);
    return l;
  }
  function diaDePruebas(s, R, via) {
    P2.conseguirHito(s, 'prueba', R);   // también si llegas por la repesca
    const { score, partes } = puntuacionPruebas(s, via);
    const ofertas = ofertasPorPuntuacion(score);
    s.pruebas.push({ semana: s.semana, score, via, partes });
    P2.tele(s, 'prueba', { score, via, ofertas });
    P2.tele(s, 'ofertas', { origen: via === 'repesca' ? 'repesca' : 'pruebas', ofertas });
    R.lineas.push(['📋', `Día de las pruebas: sacas un ${score}.`, score >= CFG.pruebas.rangos[2].min ? 'bien' : 'mal']);
    R.porque.push(`Pruebas = ${partes.map(([t, v]) => `${t} ${nf(v)}`).join(' + ')} = ${score}. Rangos: ${CFG.pruebas.rangos.filter(r => r.min > -99).map(r => `${r.min}+ → ${r.ofertas.map(o => OFERTAS[o].n + (o === 'atleticoFormacion' ? ' (formación)' : o === 'atleticoFilial' ? ' (filial)' : '')).join(' y ')}`).join(' · ')}.`);
    s.preparador = false;
    if (ofertas.length) P2.encolar(s, { tipo: 'ofertas', origen: via === 'repesca' ? 'repesca' : 'pruebas', ofertas, score });
    else P2.encolar(s, { tipo: 'ofertas', origen: 'sinOferta', ofertas: s.fase === 'amateur' ? [] : ['sanroque'], score });
    return score;
  }

  // ---------- Contratos ----------
  function firmar(s, id, R) {
    const O = OFERTAS[id];
    if (!O) return false;
    const previo = s.contrato;
    const mismoClub = previo && OFERTAS[previo.oferta].club === O.club;
    s.contrato = { oferta: id, desde: s.semana, temporadasRestantes: O.temporadas, sueldo: O.sueldo, prima: O.prima, renovado: 0 };
    if (O.prima) {
      const neto = Math.round(O.prima * (1 - CFG.club.impuesto));
      s.p.dinero += neto; s.acum.primas += neto; s.acum.impuestos += O.prima - neto;
      R && R.lineas.push(['✍️', `Prima de firma: +${eur(neto)} (neto).`, 'bien']);
    }
    s.fase = O.amateur ? 'amateur' : 'club';
    s.invitacion = null;
    if (!mismoClub || !s.temporada || s.temporada.cerrada) {
      s.temporada = P2.crearTemporada(s, P2.ligaDeClub(s, O.club) || O.liga, O.club);
      s.confianza = CFG.club.confianzaInicial;
      s.stats.titularTemp = 0; s.stats.notasTemp = [];
    }
    s.amateurSemanas = 0;
    P2.celebrar(s, { tipo: 'contrato', club: O.n, ic: O.ic, c1: O.c1, c2: O.c2, liga: (LIGAS[P2.ligaDeClub(s, O.club) || O.liga] || {}).n, sueldo: O.sueldo, prima: O.prima ? Math.round(O.prima * (1 - CFG.club.impuesto)) : 0, temporadas: O.temporadas, primaVictoria: O.primaVictoria || 0, amateur: !!O.amateur });
    P2.tele(s, 'club', { id });
    if (!O.amateur) P2.conseguirHito(s, 'contrato', R);
    P2.anotar(s, O.ic, `Firmo con ${O.n}: ${eur(O.sueldo)}/semana, ${O.temporadas} ${O.temporadas === 1 ? 'temporada' : 'temporadas'}.`);
    return true;
  }
  const techoClub = s => (oferta(s) ? oferta(s).techoNivel + P2.efectoPatro(s, 'techoNivel') : techoBarrio);
  const factorTecho = s => clamp((techoClub(s) - s.p.nivel) / 15, 0.15, 1);

  // ---------- Convocatoria ----------
  function baseSeleccion(s) {
    const O = oferta(s), P = s.p, partes = [['Nivel', r1(P.nivel)], ['Confianza del míster', r1((s.confianza - 50) * 0.2)], ['Club', O.minutos]];
    const em = P.energia >= 60 ? 2 : P.energia >= 40 ? 0 : -4;
    partes.push(['Energía', em]);
    const m = s.semanaMods && s.semanaMods.semana === s.semana ? s.semanaMods : {};
    if (m.bonusSel) partes.push(['Hueco en el once', m.bonusSel]);
    if (s.ayudaCompanero) partes.push(['Iker te busca', 3]);
    const T = s.temporada, D = P2.deporteDe(s);
    // Individual: el corte lo marca el nivel medio de tus rivales (no la plantilla de un club)
    const umbral = D.individual ? r1(Object.keys(T.fuerzas).filter(id => id !== T.yo).reduce((a, id, _, l) => a + T.fuerzas[id] / l.length, 0) - 3) : r1(T.fuerzas[T.yo]);
    return { base: partes.reduce((a, [, v]) => a + v, 0), partes, umbral };
  }
  // Probabilidad de ser titular, en palabras (la fórmula queda para «¿Por qué?»)
  function probTitular(s) {
    if (!s.temporada || !s.contrato) return null;
    if (s.p.lesion > 0) return { p: 0, txt: 'Lesionado/a: no juegas', nivel: 'nula' };
    if (s.p.energia < CFG.energia.minConvocado) return { p: 0, txt: 'Sin energía: no te convocan', nivel: 'nula' };
    const { base, partes, umbral } = baseSeleccion(s);
    let p = clamp((base - umbral + 6) / 12, 0, 1);
    if (s.p.energia < CFG.energia.minTitular) return { p: 0, nivel: 'sin energía', txt: `Con menos de ${CFG.energia.minTitular} de energía no puedes ser titular`, partes, umbral, base };
    const nivel = p >= 0.7 ? 'alta' : p >= 0.35 ? 'media' : p > 0.05 ? 'baja' : 'muy baja';
    return { p, nivel, txt: `Probabilidad ${nivel} de ser titular`, partes, umbral, base };
  }

  // ---------- Partido de la semana ----------
  function jugarPartido(s, R) {
    const T = s.temporada, O = oferta(s), P = s.p, E = CFG.energia;
    if (!T || T.cerrada || T.resultados[T.jornada]) return;   // una jornada ya jugada no se vuelve a contar
    const pj = P2.partidoDeLaJornada(T);
    const ctx = P2.contexto(T);
    let rol = 'banquillo';
    const { base, partes, umbral } = baseSeleccion(s);
    if (P.lesion > 0) rol = 'lesionado';
    else if (P.energia < E.minConvocado) rol = 'noConvocado';
    else {
      const x = base + entre(s, -6, 6);
      if (x >= umbral && P.energia >= E.minTitular) rol = 'titular';
      else if (x >= umbral - 7) rol = 'suplente';
    }
    const energiaAntes = P.energia;
    const D = P2.deporteDe(s), F = T.formato || 'goles', circ = F === 'circuito';
    const cond = P2.condicion(s, T, T.jornada), bEsp = P2.bonusEspecialidad(s, cond) + (D.id === 'skate' ? (s.estilo || 0) * 0.15 : 0);
    const r = rnd(s), juega = rol === 'titular' || rol === 'suplente';
    // Individual: compites tú (tu nivel, tu especialidad y la forma del día); en equipo, sumas a tu club
    const extra = D.individual ? (juega ? P.nivel - T.fuerzas[T.yo] + bEsp + (r - 0.5) * 3 - (rol === 'suplente' ? 4 : 0) : 0)
      : rol === 'titular' ? (P.nivel - umbral) * 0.35 + (r - 0.5) * 3 : rol === 'suplente' ? (P.nivel - umbral) * 0.12 : 0;
    const noCompite = D.individual && !juega;
    T.yoNoCompite = noCompite;
    const res = P2.jugarJornada(s, T, extra);
    delete T.yoNoCompite;
    const pen = juega && P2.penalti ? P2.penalti(s) : null;   // momento decisivo (minijuego): cambia de verdad el resultado
    let gf, gc, resultado, puesto = null, m = null;
    if (circ) {
      const o = res[0].orden; let i = o.indexOf(T.yo);
      if (pen) { const mov = pen === 'perfecto' ? -2 : pen === 'gol' ? -1 : pen === 'desastre' ? 2 : 1; const j = clamp(i + mov, 0, o.length - 1); o.splice(i, 1); o.splice(j, 0, T.yo); i = j; }
      puesto = i + 1; gf = puesto; gc = o.length;
      resultado = puesto <= 3 ? 'victoria' : puesto <= 5 ? 'empate' : 'derrota';
    } else {
      m = res.find(x => x.l === T.yo || x.v === T.yo);
      const nosotros = m.l === T.yo ? 'gl' : 'gv', ellos = m.l === T.yo ? 'gv' : 'gl';
      if (T.formato === 'sets' && noCompite) { m[nosotros] = 0; m[ellos] = 2; }
      if (F === 'goles') {
        if (pen === 'gol' || pen === 'perfecto') m[nosotros] += pen === 'perfecto' ? 2 : 1;
        if (pen === 'fallo' || pen === 'desastre') m[ellos] += pen === 'desastre' ? 2 : 1;
      } else if (F === 'puntos' && pen) {
        if (pen === 'gol' || pen === 'perfecto') m[nosotros] += pen === 'perfecto' ? 3 : 2; else m[ellos] += pen === 'desastre' ? 3 : 2;
        if (m.gl === m.gv) m[pen === 'gol' || pen === 'perfecto' ? nosotros : ellos] += 1;
      } else if (F === 'sets' && pen) {
        const bien = pen === 'gol' || pen === 'perfecto';
        if (bien && m[nosotros] < m[ellos] && (m[nosotros] === 1 || pen === 'perfecto')) { m[nosotros] = 2; m[ellos] = 1; }
        if (!bien && m[nosotros] > m[ellos] && (m[ellos] === 1 || pen === 'desastre')) { m[nosotros] = 1; m[ellos] = 2; }
      }
      gf = m.l === T.yo ? m.gl : m.gv; gc = m.l === T.yo ? m.gv : m.gl;
      resultado = gf > gc ? 'victoria' : gf < gc ? 'derrota' : 'empate';
    }
    let nota = null, goles = 0;
    if (juega) {
      const ra = resultado === 'victoria' ? 0.4 : resultado === 'derrota' ? -0.4 : 0;
      nota = rol === 'titular' ? 6 + (P.nivel - umbral) / 6 + (r - 0.5) * 2.6 + ra + (R.bonusNota || 0) + (s.ayudaCompanero ? 0.5 : 0) : 6 + (P.nivel - umbral) / 8 + (r - 0.5) * 2 + ra * 0.5;
      if (pen === 'gol' || pen === 'perfecto') nota += pen === 'perfecto' ? 1 : 0.5; else if (pen) nota -= pen === 'desastre' ? 1 : 0.6;
      nota = r1(clamp(nota, 3, 10));
      if (F === 'goles') {
        const pg = clamp(0.12 + (nota - 6) * 0.08, 0.02, 0.5) * (rol === 'titular' ? 1 : 0.4);
        if (rnd(s) < pg) goles = 1 + (rnd(s) < pg / 3 ? 1 : 0);
        if (pen === 'gol' || pen === 'perfecto') goles += pen === 'perfecto' ? 2 : 1;
      } else if (F === 'puntos') goles = Math.max(0, Math.round((nota - 4) * 2.6 * (rol === 'titular' ? 1 : 0.5) + (s.especialidad === 'alero' ? 4 : s.especialidad === 'pivot' ? 1 : 0) + (s.tiro || 0) * 0.6 + rnd(s) * 4));   // puntos
      else if (F === 'sets') goles = Math.max(0, Math.round((nota - 5) * 1.8 + rnd(s) * 3 + (cond === 'hierba' ? 2 : 0)));   // aces
      else goles = puesto <= 3 ? 1 : 0;   // circuito: podios
      s.stats.jugados++; s.stats.goles += goles; s.stats.notas.push(nota); s.stats.notasTemp.push(nota);
      if (rol === 'titular') { s.stats.titularTemp++; if (!O.amateur) { s.stats.titular++; if (s.stats.titular === 1) P2.celebrar(s, { tipo: 'titular', club: O.n.replace(/ \(.*\)/, ''), ic: O.ic, c1: O.c1, c2: O.c2, dorsal: 2 + [...String(s.seed)].reduce((a, c) => a + c.charCodeAt(0), 0) % 22 }); } } else s.stats.suplente++;
      if (goles && !O.amateur && s.stats.goles === goles) P2.celebrar(s, { tipo: 'gol', club: O.n.replace(/ \(.*\)/, ''), rival: P2.nombreEquipo(T, pj.rival), goles });
      if (nota >= 9 && (s.mvpTemp || '') !== `${T.liga}-${T.num}`) { s.mvpTemp = `${T.liga}-${T.num}`; P2.celebrar(s, { tipo: 'mvp', nota, rival: P2.nombreEquipo(T, pj.rival) }); }
    }
    // Lo que pesa para la fama: en fútbol cada gol; en los demás deportes, solo lo que equivale a un gol
    const gEq = F === 'goles' ? goles : F === 'circuito' ? (puesto === 1 ? 1 : 0) : F === 'puntos' ? (goles >= 20 ? 1 : 0) : (goles >= 8 ? 1 : 0);
    // Consecuencias: confianza, fama, interés, energía, lesión, primas
    const expo = O.exposicion * (LIGAS[T.liga].exposicion || 1);   // en categorías más altas te ve más gente
    let dConf = 0;
    if (rol === 'titular') dConf = (nota - 6) * 3.5 + (resultado === 'victoria' ? 2 : resultado === 'derrota' ? -2 : 0);
    else if (rol === 'suplente') dConf = (nota - 6) * 3;
    else if (rol === 'banquillo') dConf = s.confianza > CFG.club.confianzaMinBanquillo ? -2 : 0;
    dConf += R.bonusConf || 0;
    s.confianza = r1(clamp(s.confianza + dConf, rol === 'banquillo' ? Math.min(s.confianza, CFG.club.confianzaMinBanquillo) : 0, 100));
    const dRep = juega ? r1(expo * (Math.max(0, nota - 6) * 0.6 + (resultado === 'victoria' ? 0.2 : 0) + (rol === 'titular' ? 0.1 : 0) + gEq * 0.5)) : 0;
    P.rep = r1(clamp(P.rep + dRep, 0, 100));
    const techoInteres = 40 + expo * 30;
    const dInt = juega ? r1(expo * Math.max(0, nota - 6.2) * 5 + gEq * 2 * expo) : 0;
    s.interes = r1(clamp(s.interes + dInt * (1 + P2.efectoPatro(s, 'interes')) - 1, 0, techoInteres));
    // Marca personal: solo los partidos muy visibles (buena nota en categorías con público) venden tu imagen
    const expoLiga = LIGAS[T.liga].exposicion || 1;
    const dMarca = juega && nota >= 7.5 ? P2.sumarMarca(s, (0.3 + gEq * 0.3) * expoLiga * (1 + P2.efectoPatro(s, 'marcaVisible'))) : 0;
    if (rol === 'titular') P.energia = clamp(P.energia - 25, 0, E.max);
    else if (rol === 'suplente') P.energia = clamp(P.energia - 12, 0, E.max);
    else P.energia = clamp(P.energia - 3, 0, E.max);
    let lesion = 0;
    if (juega) {
      const K = CFG.club.lesion;
      const pl = (energiaAntes < K.umbralCansado ? K.cansado : K.base) * (R.entrenoExtra ? 1.5 : 1) * (R.riesgoLesion || 1) * P2.efectoPatroMult(s, 'lesion');
      if (rnd(s) < pl) { lesion = entero(s, K.semanas[0], K.semanas[1]); P.lesion = Math.max(P.lesion, lesion); }
    }
    let prima = 0;
    const clave = `${T.liga}-${T.num}-${pm(T)}`;
    if (juega && resultado === 'victoria' && O.primaVictoria && !s.primasCobradas[clave]) {
      prima = Math.round(O.primaVictoria * (1 - CFG.club.impuesto) * (1 - (s.agente ? s.comisionAgente || 0 : 0)));   // tu representante se lleva su parte
      s.primasCobradas[clave] = prima; P.dinero += prima; s.acum.primas += prima; s.acum.impuestos += O.primaVictoria - prima;
    }
    // Mejora con los entrenamientos del club
    s.ayudaCompanero = 0;
    const gN = subirNivel(s, 0.35 * O.entreno * (1 + P2.efectoPatro(s, 'entreno') + P2.efectoTienda(s, 'entreno')) * factorTecho(s), techoClub(s));
    P2.tele(s, 'partido', { rol, amateur: !!O.amateur });
    if (P.lesion > 0 && rol === 'lesionado') P.nivel = r1(Math.max(CFG.inicio.nivel, P.nivel - 0.2));

    if (pen) {
      const bien = pen === 'gol' || pen === 'perfecto', grande = pen === 'perfecto' || pen === 'desastre';
      s.confianza = clamp(s.confianza + (bien ? (grande ? 12 : 8) : (grande ? -18 : -12)), 0, 100);
      P.rep = r1(clamp(P.rep + (bien ? (grande ? 3 : 1.5) : (grande ? -3 : -1.5)), 0, 100));
      if (bien) P2.sumarMarca(s, grande ? 2 : 1);
      R.lineas.push(bien ? ['⭐', `¡Momento decisivo ${grande ? 'perfecto' : 'superado'}! ${grande ? 'Doblete' : 'Gol'} en el último minuto: el míster y la afición te adoran (+${grande ? 12 : 8} confianza).`, 'bien']
        : ['😖', `Fallas en el momento decisivo${pen === 'desastre' ? ' y el rival marca dos en la contra' : ' y el rival marca en la contra'}. La prensa no lo perdona (−${grande ? 18 : 12} confianza, −${grande ? 3 : 1.5} reputación).`, 'mal']);
    } else if (P2.penalti && P2.penalti(s) && !juega) R.lineas.push(['🪑', 'No juegas: el momento decisivo lo vive otro desde el campo.']);
    const rival = P2.nombreEquipo(T, pj.rival);
    const detalle = detallePrueba(s, F, cond, puesto, gc, juega, m && (m.l === T.yo ? [m.gl, m.gv] : m && [m.gv, m.gl]), nota, goles);
    R.partido = { jornada: pj.j + 1, local: pj.local, rival, gf, gc, resultado, rol, nota, goles, prima, lesion, contexto: ctx, pos: P2.posicion(T), formato: F, puesto, cond, detalle };
    const icR = resultado === 'victoria' ? '✅' : resultado === 'derrota' ? '❌' : '🤝';
    const rolTxt = { titular: 'Titular', suplente: 'Sales desde el banquillo', banquillo: 'No juegas (banquillo)', lesionado: 'Lesionado/a', noConvocado: 'No convocado/a (sin energía)' }[rol];
    const condTxt = cond ? ` (${P2.NOMBRE_COND[cond] || cond})` : '';
    if (circ) R.lineas.push([icR, `Jornada ${pj.j + 1}${condTxt}: ${juega ? `${puesto}º de ${gc}${detalle ? ` · ${detalle}` : ''}` : 'no compites'}. ${rolTxt}${nota != null ? ` · nota ${nf(nota)}` : ''}.`, resultado === 'victoria' ? 'bien' : resultado === 'derrota' ? 'mal' : '']);
    else R.lineas.push([icR, `Jornada ${pj.j + 1}${condTxt}: ${pj.local ? 'vs' : 'en casa del'} ${rival} ${gf}-${gc}${F === 'sets' && detalle ? ` (${detalle})` : ''}. ${rolTxt}${nota != null ? ` · nota ${nf(nota)}` : ''}${F === 'goles' ? (goles ? ` · ${goles === 1 ? 'marcas un gol' : 'marcas 2 goles'}` : '') : F === 'puntos' ? (juega ? ` · ${detalle}` : '') : (goles ? ` · ${goles} ${goles === 1 ? 'ace' : 'aces'}` : '')}.`, resultado === 'victoria' ? 'bien' : resultado === 'derrota' ? 'mal' : '']);
    viajes(s, R, F, pj, juega);
    // Deportes individuales: premios en metálico por podio (circuito) o por partido ganado (tenis)
    if (D.individual && juega) {
      const base = { regional: 40, tercera: 90, segunda: 240, primera: 700 }[T.liga] || 0;
      const pr = F === 'circuito' ? (puesto <= 3 ? Math.round(base * [1, 0.6, 0.35][puesto - 1]) : 0) : resultado === 'victoria' ? Math.round(base * 0.3) : 0;
      if (pr) { s.p.dinero += pr; s.acum.primas += pr; R.ingresos.push([F === 'circuito' ? `Premio por el ${puesto}º puesto` : 'Premio por partido ganado', pr]); R.lineas.push(['🏅', `Premio: +${eur(pr)}.`, 'bien']); }
    }
    // Tenis: los partidos largos cansan más
    if (D.id === 'tenis' && juega) P.energia = clamp(P.energia - (gf + gc >= 3 ? 8 : 4), 0, E.max);
    R.lineas.push(['📊', `Vais ${R.partido.pos}º de ${T.calendario[0].length * 2}. Confianza del míster ${Math.round(s.confianza)} (${dConf >= 0 ? '+' : ''}${nf(dConf)}).`]);
    if (prima) R.lineas.push(['💶', `Prima por victoria: +${eur(prima)}.`, 'bien']);
    if (lesion) R.lineas.push(['🤕', `Te lesionas: ${lesion} ${lesion === 1 ? 'semana' : 'semanas'} de baja.`, 'mal']);
    R.porque.push(`Convocatoria: ${partes.map(([t, v]) => `${t} ${nf(v)}`).join(' + ')} + azar (±6) frente a ${nf(umbral)} (nivel del once). Titular si llegas; suplente si te quedas a menos de 7. Con menos de ${E.minTitular} de energía no eres titular.`);
    if (juega) R.porque.push(`Nota = 6 + (nivel − ${nf(umbral)}) / ${rol === 'titular' ? 6 : 8} + forma del día + resultado. Reputación deportiva +${nf(dRep)} (× exposición ${nf(expo)} de club y categoría)${dMarca ? `, marca personal +${nf(dMarca)} por un partido muy visible` : ''}. Interés de otros clubes ${Math.round(s.interes)}/100 (techo ${Math.round(techoInteres)} en este club).`);
    R.porque.push(`Entrenamientos del club: nivel +${nf(gN)} (calidad ${nf(O.entreno)}, techo ${techoClub(s)}).`);
    if (P2.semanaCopas) P2.semanaCopas(s, R);   // rondas y finales de copa, Europa y Mundial
    if (T.cerrada && !(P2.iniciarPromocion && P2.iniciarPromocion(s, R))) finTemporada(s, R);
  }
  const pm = T => T.jornada - 1;
  // Cómo se cuenta la prueba en cada deporte (solo texto: el resultado ya está decidido)
  function detallePrueba(s, F, cond, puesto, n, juega, sets, nota, goles) {
    if (!juega) return '';
    const h = ((s.seed >>> 0) + s.semana * 31) % 97 / 97;
    if (F === 'puntos') { const reb = Math.round((s.especialidad === 'pivot' ? 6 : 2) + h * 5 + Math.max(0, nota - 6)), ast = Math.round((s.especialidad === 'base' ? 5 : 1) + h * 4), min = Math.round(nota >= 6 ? 22 + h * 12 : 12 + h * 10); return `${min} min, ${goles} pts, ${reb} reb, ${ast} ast`; }
    if (F === 'sets') {
      if (!sets) return '';
      const [a, b] = sets, juegos = [];
      const MARC = ['6-1', '6-2', '6-3', '6-4', '7-5', '7-6'];
      const set = (gano, i) => { const x = MARC[Math.floor(h * 97 + i * 37) % MARC.length]; return gano ? x : x.split('-').reverse().join('-'); };
      const ord = a > b ? (b ? [true, false, true] : [true, true]) : (a ? [false, true, false] : [false, false]);
      ord.forEach((g, i) => juegos.push(set(g, i)));
      return juegos.join(' ');
    }
    if (F !== 'circuito') return '';
    const k = Math.max(0, n - puesto) / Math.max(1, n - 1);   // 1 = has ganado
    if (cond === 'bloque') return `${Math.round(1 + k * 3)}T ${Math.round(2 + k * 2)}Z`;
    if (cond === 'dificultad') return `presa ${Math.round(24 + k * 22)}${h > 0.5 ? '+' : ''}`;
    if (cond === 'velocidad') return `${(5.2 + (1 - k) * 2.6 + h * 0.3).toFixed(2).replace('.', ',')} s`;
    if (cond === 'street' || cond === 'park') return `${(62 + k * 30 + h * 4).toFixed(2).replace('.', ',')} pts`;
    if (P2.deporteDe(s).id === 'surf') return `${(8 + k * 9 + h).toFixed(2).replace('.', ',')} (dos mejores olas)`;
    return '';
  }
  // Tenis y surf: viajar a las pruebas fuera cuesta dinero (los equipos de alto nivel lo pagan)
  function viajes(s, R, F, pj, juega) {
    const D = P2.deporteDe(s); if (!juega || !['tenis', 'surf'].includes(D.id)) return;
    const O = oferta(s); if (O && (O.sube || O.patroTier === 'deportiva' && O.exposicion >= 1.5)) { R.porque.push('Los viajes los paga tu equipo.'); return; }
    if (D.id === 'tenis' && pj.local) return;
    if (D.id === 'surf' && (pj.j % 2) === 0) return;
    const c = { regional: 0, tercera: 30, segunda: 60, primera: 110 }[s.temporada.liga] || 0; if (!c) return;
    s.p.dinero -= c; s.acum.gastos += c; R.ingresos.push(['Viaje a la prueba', -c]);
  }

  // ---------- Fin de temporada ----------
  function finTemporada(s, R) {
    const T = s.temporada, O = oferta(s), pos = P2.posicion(T), obj = OBJETIVOS[P2.objetivoDe(T)];
    const cumple = obj.cumple(pos);
    const notas = s.stats.notasTemp, media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    s.temporadasJugadas.push({ liga: T.liga, club: O.n, pos, objetivo: obj.n, cumple, pj: notas.length, titular: s.stats.titularTemp, media: r1(media) });
    s.confianza = clamp(s.confianza + (cumple ? 8 : -8), 0, 100);
    R.lineas.push(['🏁', `Fin de temporada: ${pos}º. Objetivo del club (${obj.n.toLowerCase()}): ${cumple ? 'cumplido' : 'no cumplido'}.`, cumple ? 'bien' : 'mal']);
    if (cumple && O.primaObjetivo && !s.primasCobradas[`obj-${T.liga}-${T.num}`]) {
      const neto = Math.round(O.primaObjetivo * (1 - CFG.club.impuesto));
      s.primasCobradas[`obj-${T.liga}-${T.num}`] = neto; s.p.dinero += neto; s.acum.primas += neto;
      R.lineas.push(['💶', `Prima por objetivo: +${eur(neto)}.`, 'bien']);
    }
    // Ascensos y descensos: el club cambia de categoría (no depende de tu contrato)
    const mov = P2.moverEquipos(s, T);
    if (mov.miClub) {
      const deL = LIGAS[mov.miClub.de], aL = LIGAS[mov.miClub.a];
      let prima = 0;
      if (mov.miClub.tipo === 'sube' && O.primaAscenso && notas.length >= CFG.liga.primaAscensoMinPartidos && !s.primasCobradas[`asc-${T.liga}-${T.num}`]) {
        prima = Math.round(O.primaAscenso * (1 - CFG.club.impuesto));
        s.primasCobradas[`asc-${T.liga}-${T.num}`] = prima; s.p.dinero += prima; s.acum.primas += prima;
      }
      P2.tele(s, 'categoria', { tipo: mov.miClub.tipo, a: mov.miClub.a });
      if (mov.miClub.tipo === 'sube') { P2.celebrar(s, { tipo: 'ascenso', club: O.n.replace(/ \(.*\)/, ''), ic: O.ic, de: mov.miClub.de, a: mov.miClub.a, prima }); P2.anotarHistoria(s, 'ascenso'); P2.momentoMon(s, 'ascenso'); P2.sumarMarca(s, 2); R.lineas.push(['🎉', `¡ASCENSO! ${O.n.replace(/ \(.*\)/, '')} sube a ${aL.n}.${prima ? ` Prima de ascenso: +${eur(prima)}.` : ''}`, 'bien']); s.p.rep = r1(clamp(s.p.rep + 3, 0, 100)); s.confianza = clamp(s.confianza + 5, 0, 100); }
      else if (mov.miClub.tipo === 'baja') { R.lineas.push(['📉', `Descenso: ${O.n.replace(/ \(.*\)/, '')} baja a ${aL.n}.`, 'mal']); s.p.rep = r1(clamp(s.p.rep - 2, 0, 100)); }
      else R.lineas.push(['🔒', `Acabáis en puestos de ascenso, pero un filial no puede jugar en la categoría de su primer equipo: sube el siguiente.`]);
      P2.encolar(s, { tipo: 'cambioCategoria', mov: mov.miClub, prima, pos, club: O.n, sube: mov.sube.filter(id => id !== T.yo), baja: mov.baja.filter(id => id !== T.yo) });
      P2.anotar(s, mov.miClub.tipo === 'sube' ? '🎉' : mov.miClub.tipo === 'baja' ? '📉' : '🔒', mov.miClub.tipo === 'sube' ? `¡Subimos a ${aL.n}!` : mov.miClub.tipo === 'baja' ? `Bajamos a ${aL.n}.` : `El filial no puede subir.`);
    }
    if (P2.trasTemporada) P2.trasTemporada(s, R);   // ¿Copa de Europa o Mundial la temporada que viene?
    P2.finTemporadaPatros(s, R, media);
    P2.momentoMon(s, 'finTemporada');
    s.contrato.temporadasRestantes -= 1;
    const ofertas = ofertasFinTemporada(s, media);
    if (s.contrato.temporadasRestantes <= 0 || ofertas.some(o => o.id !== 'renovar' && OFERTAS[o.id] && OFERTAS[o.id].sube)) {
      P2.encolar(s, { tipo: 'ofertas', origen: 'fin', ofertas: ofertas.map(o => o.id), condiciones: ofertas, score: null, contratoVivo: s.contrato.temporadasRestantes > 0 });
      P2.tele(s, 'ofertas', { origen: 'fin', ofertas: ofertas.map(o => o.id) });
    } else nuevaTemporada(s, R);
  }
  // Ofertas al acabar la temporada: dependen de confianza, interés, nivel y del club donde estás
  function ofertasFinTemporada(s, media) {
    const O = oferta(s), l = [];
    if (s.contrato.temporadasRestantes <= 0 && s.confianza >= 45) {
      // Una representante con la que te llevas bien pelea más tu renovación
      const mejora = (s.agente && s.confianza >= 65 ? 1.3 : 1.12) + (s.agente && P2.valorRel(s, 'sonia') >= 70 ? 0.08 : 0);
      l.push({ id: 'renovar', n: `Renovar con ${O.n}`, sueldo: Math.max(s.contrato.sueldo, Math.min(topeSueldo(s), Math.round(s.contrato.sueldo * mejora))), prima: Math.round(O.prima * 0.5), temporadas: 2 });
    }
    if (O.club === 'atleticoB' && s.confianza >= 60 && s.p.nivel >= 58) l.push({ id: 'atleticoPrimero' });
    if (s.interes >= 45 && O.club !== 'costa' && !O.sube) l.push({ id: 'costaReal' });
    if (!l.length) l.push(s.p.nivel >= 48 && O.club !== 'puerto' ? { id: 'puerto' } : { id: O.amateur ? 'sanroque' : 'puerto' });
    return l;
  }
  function nuevaTemporada(s, R) {
    const O = oferta(s);
    s.temporada = P2.crearTemporada(s, P2.ligaDeClub(s, O.club) || O.liga, O.club);
    s.stats.titularTemp = 0; s.stats.notasTemp = [];
    s.interes = r1(s.interes * 0.6);
    R && R.lineas.push(['📅', `Empieza una nueva temporada en ${LIGAS[s.temporada.liga].n}. Objetivo del club: ${OBJETIVOS[s.temporada.objetivo].n.toLowerCase()}.`]);
  }
  function firmarRenovacion(s, cond, R) {
    const O = oferta(s);
    s.contrato.sueldo = cond.sueldo; s.contrato.temporadasRestantes = cond.temporadas; s.contrato.renovado++;
    if (cond.prima) { const neto = Math.round(cond.prima * (1 - CFG.club.impuesto)); s.p.dinero += neto; s.acum.primas += neto; R && R.lineas.push(['✍️', `Prima de renovación: +${eur(neto)}.`, 'bien']); }
    P2.celebrar(s, { tipo: 'contrato', renov: true, club: O.n, ic: O.ic, c1: O.c1, c2: O.c2, liga: (LIGAS[P2.ligaDeClub(s, O.club) || O.liga] || {}).n, sueldo: cond.sueldo, prima: cond.prima ? Math.round(cond.prima * (1 - CFG.club.impuesto)) : 0, temporadas: cond.temporadas, primaVictoria: O.primaVictoria || 0 });
    P2.anotar(s, '✍️', `Renuevo con ${O.n}: ${eur(cond.sueldo)}/semana.`);
    P2.tele(s, 'renovacion', { sueldo: cond.sueldo });
    nuevaTemporada(s, R);
  }

  // Techo de sueldo según la categoría en la que juega tu club (las subidas no pueden pasar de ahí)
  function topeSueldo(s) { const O = oferta(s); const l = O ? (P2.ligaDeClub(s, O.club) || O.liga) : null; return l ? LIGAS[l].sueldoMax || 99999 : 99999; }
  function subirSueldo(s, factor) { const antes = s.contrato.sueldo; s.contrato.sueldo = Math.max(antes, Math.min(topeSueldo(s), Math.round(antes * factor))); return s.contrato.sueldo - antes; }

  // Valor de mercado (aproximado, para mostrar)
  function valorMercado(s) {
    const O = oferta(s), e = O ? O.exposicion : 0.5;
    return Math.round(Math.max(0, s.p.nivel - 35) ** 2 * 18 * (1 + s.p.rep / 100) * Math.sqrt(e) / 100) * 100;
  }

  Object.assign(P2, { oferta, enCaptacion, semanasCaptacion, tieneHito, bloqueoAccion, accionesDisponibles, aplicarAccion, invitar, revisarOjeador,
    GRADOS, accionDeporte, detallePrueba, puntuacionPruebas, ofertasPorPuntuacion, diaDePruebas, firmar, firmarRenovacion, nuevaTemporada, probTitular, jugarPartido, finTemporada, ofertasFinTemporada, valorMercado, techoClub, topeSueldo, subirSueldo });
})(globalThis.P2 = globalThis.P2 || {});
