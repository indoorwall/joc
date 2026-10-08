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
        L.push(['⚽', `Partido en la plaza: +${nf(g)} de fama.${veces >= 3 ? ' La plaza ya te conoce: cada vez impresiona menos.' : ''}`]);
        W.push(`Fama = (2,5 + nivel/25 + azar 0–2,5) × 0,82^${veces} (veces que ya has jugado aquí).`);
        break;
      }
      case 'entrenar': {
        const g = subirNivel(s, 2.6 * Math.pow(0.9, veces), techoBarrio);
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
        const f = r1(P.nivel + P.rep * 0.2 + entre(s, -8, 8));
        W.push(`Torneo: nivel + fama × 0,2 + azar (±8) = ${nf(f)}. Ganar: 52 · semifinal: 46.`);
        if (f >= 52) { P.rep = r1(P.rep + 10); invitar(s, 'torneo', R); L.push(['🏆', '¡Ganas el torneo local! +10 de fama y un ojeador te invita a las pruebas.', 'bien']); }
        else if (f >= 46) { P.rep = r1(P.rep + 5); L.push(['🥈', 'Llegas a semifinales: +5 de fama.']); }
        else { P.rep = r1(P.rep + 1); L.push(['😓', 'Caes en la primera ronda: +1 de fama.', 'mal']); }
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
        const O = oferta(s), g = subirNivel(s, 0.6 * (O ? O.entreno : 1) * factorTecho(s), techoClub(s));
        s.confianza = clamp(s.confianza + 2, 0, 100); R.entrenoExtra = true;
        L.push(['🏋️', `Entreno extra: nivel +${nf(g)} y el míster lo valora (+2 confianza).`]);
        break;
      }
      case 'prensa': {
        const O = oferta(s), g = r1((1.2 + rnd(s)) * (O ? O.exposicion : 1));
        P.rep = r1(clamp(P.rep + g, 0, 100)); s.confianza = clamp(s.confianza - 1, 0, 100);
        L.push(['🎙️', `Atiendes a la prensa y subes contenido: +${nf(g)} de fama (−1 confianza del míster).`]);
        break;
      }
      case 'gestionar': {
        R.gestion = true; s.confianza = clamp(s.confianza - 2, 0, 100);
        L.push(['💼', 'Pasas la semana pendiente de tu empresa (−2 confianza del míster).']);
        break;
      }
    }
  }

  // ---------- Captación y pruebas ----------
  function invitar(s, via, R) {
    if (s.invitacion) return;
    const dia = s.semana + CFG.captacion.semanasPreparacion;
    s.invitacion = { via, semana: s.semana, dia };
    s.fase = 'pruebas';
    P2.conseguirHito(s, 'prueba', R);
    P2.anotar(s, '📨', `Invitación a las pruebas (${via}). Son en la semana ${dia}.`);
  }
  function revisarOjeador(s, R) {
    if (s.fase === 'barrio' && !s.invitacion && s.p.rep >= CFG.captacion.repOjeador) {
      invitar(s, 'ojeador', R);
      R.lineas.push(['👀', `Un ojeador te ha visto en la plaza (fama ${nf(s.p.rep)}): te invita a las pruebas.`, 'bien']);
    }
  }

  function puntuacionPruebas(s, via) {
    const K = CFG.pruebas, P = s.p, partes = [];
    partes.push(['Nivel', r1(P.nivel)]);
    const eb = K.energia.find(([min]) => P.energia >= min)[1];
    partes.push([`Energía (${Math.round(P.energia)})`, eb]);
    partes.push(['Fama', r1(Math.min(K.repMax, P.rep * K.repFactor))]);
    if (s.preparador) partes.push(['Preparador', K.preparador]);
    if (K.viaBonus[via]) partes.push(['Vienes recomendado/a', K.viaBonus[via]]);
    partes.push(['Suerte del día', r1(entre(s, -K.suerte, K.suerte))]);
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
    if (!O.amateur) P2.conseguirHito(s, 'contrato', R);
    P2.anotar(s, O.ic, `Firmo con ${O.n}: ${eur(O.sueldo)}/semana, ${O.temporadas} ${O.temporadas === 1 ? 'temporada' : 'temporadas'}.`);
    return true;
  }
  const techoClub = s => (oferta(s) ? oferta(s).techoNivel : techoBarrio);
  const factorTecho = s => clamp((techoClub(s) - s.p.nivel) / 15, 0.15, 1);

  // ---------- Convocatoria ----------
  function baseSeleccion(s) {
    const O = oferta(s), P = s.p, partes = [['Nivel', r1(P.nivel)], ['Confianza del míster', r1((s.confianza - 50) * 0.2)], ['Club', O.minutos]];
    const em = P.energia >= 60 ? 2 : P.energia >= 40 ? 0 : -4;
    partes.push(['Energía', em]);
    const m = s.semanaMods && s.semanaMods.semana === s.semana ? s.semanaMods : {};
    if (m.bonusSel) partes.push(['Hueco en el once', m.bonusSel]);
    return { base: partes.reduce((a, [, v]) => a + v, 0), partes, umbral: r1(s.temporada.fuerzas[s.temporada.yo]) };
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
    const r = rnd(s), juega = rol === 'titular' || rol === 'suplente';
    const extra = rol === 'titular' ? (P.nivel - umbral) * 0.35 + (r - 0.5) * 3 : rol === 'suplente' ? (P.nivel - umbral) * 0.12 : 0;
    const res = P2.jugarJornada(s, T, extra);
    const m = res.find(x => x.l === T.yo || x.v === T.yo);
    const gf = m.l === T.yo ? m.gl : m.gv, gc = m.l === T.yo ? m.gv : m.gl;
    const resultado = gf > gc ? 'victoria' : gf < gc ? 'derrota' : 'empate';
    let nota = null, goles = 0;
    if (juega) {
      const ra = resultado === 'victoria' ? 0.4 : resultado === 'derrota' ? -0.4 : 0;
      nota = rol === 'titular' ? 6 + (P.nivel - umbral) / 6 + (r - 0.5) * 2.6 + ra + (R.bonusNota || 0) : 6 + (P.nivel - umbral) / 8 + (r - 0.5) * 2 + ra * 0.5;
      nota = r1(clamp(nota, 3, 10));
      const pg = clamp(0.12 + (nota - 6) * 0.08, 0.02, 0.5) * (rol === 'titular' ? 1 : 0.4);
      if (rnd(s) < pg) goles = 1 + (rnd(s) < pg / 3 ? 1 : 0);
      s.stats.jugados++; s.stats.goles += goles; s.stats.notas.push(nota); s.stats.notasTemp.push(nota);
      if (rol === 'titular') { s.stats.titularTemp++; if (!O.amateur) s.stats.titular++; } else s.stats.suplente++;
    }
    // Consecuencias: confianza, fama, interés, energía, lesión, primas
    const expo = O.exposicion * (LIGAS[T.liga].exposicion || 1);   // en categorías más altas te ve más gente
    let dConf = 0;
    if (rol === 'titular') dConf = (nota - 6) * 3.5 + (resultado === 'victoria' ? 2 : resultado === 'derrota' ? -2 : 0);
    else if (rol === 'suplente') dConf = (nota - 6) * 3;
    else if (rol === 'banquillo') dConf = s.confianza > CFG.club.confianzaMinBanquillo ? -2 : 0;
    dConf += R.bonusConf || 0;
    s.confianza = r1(clamp(s.confianza + dConf, rol === 'banquillo' ? Math.min(s.confianza, CFG.club.confianzaMinBanquillo) : 0, 100));
    const dRep = juega ? r1(expo * (Math.max(0, nota - 6) * 0.6 + (resultado === 'victoria' ? 0.2 : 0) + (rol === 'titular' ? 0.1 : 0) + goles * 0.5)) : 0;
    P.rep = r1(clamp(P.rep + dRep, 0, 100));
    const techoInteres = 40 + expo * 30;
    const dInt = juega ? r1(expo * Math.max(0, nota - 6.2) * 5 + goles * 2 * expo) : 0;
    s.interes = r1(clamp(s.interes + dInt - 1, 0, techoInteres));
    if (rol === 'titular') P.energia = clamp(P.energia - 25, 0, E.max);
    else if (rol === 'suplente') P.energia = clamp(P.energia - 12, 0, E.max);
    else P.energia = clamp(P.energia - 3, 0, E.max);
    let lesion = 0;
    if (juega) {
      const K = CFG.club.lesion;
      const pl = (energiaAntes < K.umbralCansado ? K.cansado : K.base) * (R.entrenoExtra ? 1.5 : 1) * (R.riesgoLesion || 1);
      if (rnd(s) < pl) { lesion = entero(s, K.semanas[0], K.semanas[1]); P.lesion = Math.max(P.lesion, lesion); }
    }
    let prima = 0;
    const clave = `${T.liga}-${T.num}-${pm(T)}`;
    if (juega && resultado === 'victoria' && O.primaVictoria && !s.primasCobradas[clave]) {
      prima = Math.round(O.primaVictoria * (1 - CFG.club.impuesto));
      s.primasCobradas[clave] = prima; P.dinero += prima; s.acum.primas += prima; s.acum.impuestos += O.primaVictoria - prima;
    }
    // Mejora con los entrenamientos del club
    const gN = subirNivel(s, 0.35 * O.entreno * factorTecho(s), techoClub(s));
    if (P.lesion > 0 && rol === 'lesionado') P.nivel = r1(Math.max(CFG.inicio.nivel, P.nivel - 0.2));

    const rival = P2.nombreEquipo(T, pj.rival);
    R.partido = { jornada: pj.j + 1, local: pj.local, rival, gf, gc, resultado, rol, nota, goles, prima, lesion, contexto: ctx, pos: P2.posicion(T) };
    const icR = resultado === 'victoria' ? '✅' : resultado === 'derrota' ? '❌' : '🤝';
    const rolTxt = { titular: 'Titular', suplente: 'Sales desde el banquillo', banquillo: 'No juegas (banquillo)', lesionado: 'Lesionado/a', noConvocado: 'No convocado/a (sin energía)' }[rol];
    R.lineas.push([icR, `Jornada ${pj.j + 1}: ${pj.local ? 'vs' : 'en casa del'} ${rival} ${gf}-${gc}. ${rolTxt}${nota != null ? ` · nota ${nf(nota)}` : ''}${goles ? ` · ${goles === 1 ? 'marcas un gol' : 'marcas 2 goles'}` : ''}.`, resultado === 'victoria' ? 'bien' : resultado === 'derrota' ? 'mal' : '']);
    R.lineas.push(['📊', `Vais ${R.partido.pos}º de ${T.calendario[0].length * 2}. Confianza del míster ${Math.round(s.confianza)} (${dConf >= 0 ? '+' : ''}${nf(dConf)}).`]);
    if (prima) R.lineas.push(['💶', `Prima por victoria: +${eur(prima)}.`, 'bien']);
    if (lesion) R.lineas.push(['🤕', `Te lesionas: ${lesion} ${lesion === 1 ? 'semana' : 'semanas'} de baja.`, 'mal']);
    R.porque.push(`Convocatoria: ${partes.map(([t, v]) => `${t} ${nf(v)}`).join(' + ')} + azar (±6) frente a ${nf(umbral)} (nivel del once). Titular si llegas; suplente si te quedas a menos de 7. Con menos de ${E.minTitular} de energía no eres titular.`);
    if (juega) R.porque.push(`Nota = 6 + (nivel − ${nf(umbral)}) / ${rol === 'titular' ? 6 : 8} + forma del día + resultado. Fama +${nf(dRep)} (× exposición ${nf(expo)} del club). Interés de otros clubes ${Math.round(s.interes)}/100 (techo ${Math.round(techoInteres)} en este club).`);
    R.porque.push(`Entrenamientos del club: nivel +${nf(gN)} (calidad ${nf(O.entreno)}, techo ${techoClub(s)}).`);
    if (T.cerrada) finTemporada(s, R);
  }
  const pm = T => T.jornada - 1;

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
      if (mov.miClub.tipo === 'sube') { R.lineas.push(['🎉', `¡ASCENSO! ${O.n.replace(/ \(.*\)/, '')} sube a ${aL.n}.${prima ? ` Prima de ascenso: +${eur(prima)}.` : ''}`, 'bien']); s.p.rep = r1(clamp(s.p.rep + 3, 0, 100)); s.confianza = clamp(s.confianza + 5, 0, 100); }
      else if (mov.miClub.tipo === 'baja') { R.lineas.push(['📉', `Descenso: ${O.n.replace(/ \(.*\)/, '')} baja a ${aL.n}.`, 'mal']); s.p.rep = r1(clamp(s.p.rep - 2, 0, 100)); }
      else R.lineas.push(['🔒', `Acabáis en puestos de ascenso, pero un filial no puede jugar en la categoría de su primer equipo: sube el siguiente.`]);
      P2.encolar(s, { tipo: 'cambioCategoria', mov: mov.miClub, prima, pos, club: O.n, sube: mov.sube.filter(id => id !== T.yo), baja: mov.baja.filter(id => id !== T.yo) });
      P2.anotar(s, mov.miClub.tipo === 'sube' ? '🎉' : mov.miClub.tipo === 'baja' ? '📉' : '🔒', mov.miClub.tipo === 'sube' ? `¡Subimos a ${aL.n}!` : mov.miClub.tipo === 'baja' ? `Bajamos a ${aL.n}.` : `El filial no puede subir.`);
    }
    P2.finTemporadaPatros(s, R, media);
    s.contrato.temporadasRestantes -= 1;
    const ofertas = ofertasFinTemporada(s, media);
    if (s.contrato.temporadasRestantes <= 0 || ofertas.some(o => o.id !== 'renovar' && OFERTAS[o.id] && OFERTAS[o.id].sube)) {
      P2.encolar(s, { tipo: 'ofertas', origen: 'fin', ofertas: ofertas.map(o => o.id), condiciones: ofertas, score: null, contratoVivo: s.contrato.temporadasRestantes > 0 });
    } else nuevaTemporada(s, R);
  }
  // Ofertas al acabar la temporada: dependen de confianza, interés, nivel y del club donde estás
  function ofertasFinTemporada(s, media) {
    const O = oferta(s), l = [];
    if (s.contrato.temporadasRestantes <= 0 && s.confianza >= 45) {
      const mejora = s.agente && s.confianza >= 65 ? 1.3 : 1.12;
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
    P2.anotar(s, '✍️', `Renuevo con ${O.n}: ${eur(cond.sueldo)}/semana.`);
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
    puntuacionPruebas, ofertasPorPuntuacion, diaDePruebas, firmar, firmarRenovacion, nuevaTemporada, probTitular, jugarPartido, finTemporada, ofertasFinTemporada, valorMercado, techoClub, topeSueldo, subirSueldo });
})(globalThis.P2 = globalThis.P2 || {});
