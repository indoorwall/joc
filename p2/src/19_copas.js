/* =====================================================================
   19 · LO QUE DE VERDAD SE JUEGA EN UN MINIJUEGO: categoría, copas, Europa y el Mundial
   - Promoción de ascenso: acabas justo fuera de los puestos de ascenso → si ganas, SUBES.
   - Promoción de permanencia: último puesto salvado o primero de descenso → si pierdes, BAJAS.
   - Final por el título (categoría más alta): campeón o subcampeón.
   - Copa (cada temporada): las rondas se resuelven solas; la FINAL la juegas tú.
   - Copa de Europa: si acabaste 1º o 2º en la categoría más alta, la temporada siguiente.
   - Mundial: si te convocan (nivel y reputación de élite), la FINAL la juegas tú.
   Sin minijuego (bots, simulación) se decide igual que «Simular»: por nivel, sin tocar el azar de la partida.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, LIGAS, clamp, r1, eur } = P2;

  const COMPETICIONES = {
    copa: { ic: '🏆', n: 'Copa Federación', rondas: [[3, 'Cuartos de final'], [7, 'Semifinal']], final: 10,
      gana: { dinero: 300, rep: 2, marca: 2, confianza: 6 }, pierde: { rep: -1, confianza: -4 } },
    europa: { ic: '⭐', n: 'Copa de Europa', rondas: [[2, 'Fase de grupos'], [5, 'Octavos'], [8, 'Cuartos'], [11, 'Semifinal']], final: 12,
      gana: { dinero: 3000, rep: 5, marca: 4, confianza: 8 }, pierde: { rep: -2, marca: -1, confianza: -6 } },
    mundial: { ic: '🌍', n: 'Mundial con la selección', rondas: [[4, 'Fase de grupos'], [5, 'Octavos'], [6, 'Cuartos'], [7, 'Semifinal']], final: 8,
      gana: { dinero: 5000, rep: 6, marca: 5 }, pierde: { rep: -3, marca: -2 } },
  };
  const CONVOCATORIA = { nivel: 75, rep: 55 };

  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const azar = (s, k) => (hash(`${s.seed}|${k}`) % 10000) / 10000;   // determinista: no toca s.rng
  const prob = s => P2.probSimular(s);
  const mj = s => (s.mjSemana && s.mjSemana.semana === s.semana ? s.mjSemana : null);

  // ---------- Competiciones de la temporada ----------
  function prepararCopas(s) {
    const T = s.temporada; if (!T || T.copas || s.fase !== 'club') return;
    const ids = ['copa'].concat(s.europaProxima ? ['europa'] : [], s.convocado ? ['mundial'] : []);
    s.europaProxima = false; s.convocado = false;
    T.copas = T.jornada > 0 ? [] : ids.map(id => ({ id, estado: 'viva' }));   // una partida guardada a media temporada empieza con la siguiente
  }
  const copaFinalEn = (s, j) => (s.temporada && s.temporada.copas || []).find(c => c.estado === 'viva' && COMPETICIONES[c.id].final === j);
  // Después de cada jornada: rondas que se resuelven solas y la final (con tu minijuego)
  function semanaCopas(s, R) {
    const T = s.temporada; if (!T || !T.copas) return;
    const jp = T.jornada - 1;
    for (const c of T.copas) {
      if (c.estado !== 'viva') continue;
      const C = COMPETICIONES[c.id], ronda = C.rondas.find(([j]) => j === jp);
      if (ronda) {
        const pasa = azar(s, `${c.id}|${T.num}|${T.liga}|${jp}`) < clamp(prob(s), 0.3, 0.8);
        if (pasa) R.lineas.push([C.ic, `${C.n}: ¡superáis ${ronda[1].toLowerCase()}!`, 'bien']);
        else { c.estado = 'eliminado'; R.lineas.push([C.ic, `${C.n}: eliminados en ${ronda[1].toLowerCase()}.`, 'mal']); }
      }
      if (C.final === jp) {
        const m = mj(s), gana = m && m.tipo === 'final' ? m.p >= 0.6 : azar(s, `${c.id}|final|${T.num}`) < prob(s);
        c.estado = gana ? 'campeon' : 'subcampeon';
        aplicar(s, gana ? C.gana : C.pierde);
        if (gana) { (s.trofeos = s.trofeos || []).push({ ic: C.ic, n: C.n, semana: s.semana }); P2.celebrar(s, Object.assign({ tipo: 'titulo', n: C.n, ic: C.ic }, C.gana)); }
        R.grandes = (R.grandes || []).concat({ ic: gana ? C.ic : '😖', titulo: gana ? `¡CAMPEONES DE LA ${C.n.toUpperCase()}!` : `Final perdida: ${C.n}`, bien: gana,
          texto: gana ? `${efectoTxt(C.gana)}.` : `Subcampeones. ${efectoTxt(C.pierde)}. La prensa no habla de otra cosa.` });
        R.lineas.push([gana ? C.ic : '😖', gana ? `¡Ganáis la final de la ${C.n}!` : `Perdéis la final de la ${C.n}.`, gana ? 'bien' : 'mal']);
      }
    }
  }
  function aplicar(s, e) {
    if (e.dinero) { s.p.dinero += e.dinero; s.acum.primas += e.dinero; }
    if (e.rep) s.p.rep = r1(clamp(s.p.rep + e.rep, 0, 100));
    if (e.marca) s.p.marca = r1(clamp((s.p.marca || 0) + e.marca, 0, 100));
    if (e.confianza) s.confianza = clamp(s.confianza + e.confianza, 0, 100);
  }
  function efectoTxt(e) { return [e.dinero ? `+${eur(e.dinero)}` : '', e.rep ? `${e.rep > 0 ? '+' : ''}${e.rep} reputación` : '', e.marca ? `${e.marca > 0 ? '+' : ''}${e.marca} marca` : '', e.confianza ? `${e.confianza > 0 ? '+' : ''}${e.confianza} confianza del míster` : ''].filter(Boolean).join(', '); }

  // ---------- Promociones al acabar la liga ----------
  function clasePromocion(s, T) {
    const L = LIGAS[T.liga], Z = P2.zonas(T.liga), n = P2.clasificacion(T).length, pos = P2.posicion(T);
    const M = P2.mundo(s), tabla = P2.clasificacion(T), filial = id => { const f = M.equipos[id] && M.equipos[id].filialDe; return !!(f && L.sube && M.ligas[L.sube].includes(f)); };
    if (Z.asc && L.sube && pos === Z.asc + 1 && !filial(T.yo) && !tabla.slice(0, Z.asc).some(r => filial(r.id))) return 'ascenso';
    if (Z.desc && (pos === n - Z.desc || pos === n - Z.desc + 1)) return 'permanencia';
    if (!Z.asc && !L.sube && pos <= 2) return 'titulo';
    return null;
  }
  const TXT_PROMO = {
    ascenso: { ic: '⬆️', n: 'Promoción de ascenso', d: 'Te juegas subir de categoría en un solo partido.' },
    permanencia: { ic: '🛟', n: 'Promoción de permanencia', d: 'Si pierdes, tu club baja de categoría.' },
    titulo: { ic: '👑', n: 'Final por el título', d: 'Campeones o subcampeones: todo en un partido.' },
  };
  // Al acabar la liga: si hay promoción, la temporada espera una semana más
  function iniciarPromocion(s, R) {
    const T = s.temporada; if (!T || T.promocion || (s.fase !== 'club' && s.fase !== 'amateur')) return false;
    const clase = clasePromocion(s, T); if (!clase) return false;
    T.promocion = { clase, estado: 'pendiente', pos: P2.posicion(T) };
    const X = TXT_PROMO[clase];
    R.lineas.push([X.ic, `Acabáis ${T.promocion.pos}º: la semana que viene, ${X.n.toLowerCase()}. ${X.d}`, clase === 'permanencia' ? 'mal' : 'bien']);
    return true;
  }
  const promoPendiente = s => !!(s.temporada && s.temporada.promocion && s.temporada.promocion.estado === 'pendiente');
  // Qué te juegas en el minijuego de esta semana (para la interfaz)
  function enJuego(s, tipo) {
    const T = s.temporada, L = T && LIGAS[T.liga];
    if (tipo === 'promocion' && promoPendiente(s)) {
      const c = T.promocion.clase, X = TXT_PROMO[c];
      const gana = c === 'ascenso' ? `¡Subís a ${LIGAS[L.sube].n}!` : c === 'permanencia' ? 'Os salváis: seguís en la categoría.' : '¡Campeones de liga! +1.500 €, +4 reputación, +3 marca.';
      const pierde = c === 'ascenso' ? 'Os quedáis en la misma categoría (−5 confianza).' : c === 'permanencia' ? `Bajáis a ${LIGAS[L.baja].n}.` : 'Subcampeones (−3 confianza).';
      return { ic: X.ic, n: X.n, d: X.d, gana, pierde };
    }
    if (tipo === 'final') {
      const F = finalEstaSemana(s); if (!F) return null;
      return { ic: F.ic, n: `Final · ${F.n}`, d: 'Una final. No hay segunda oportunidad… salvo que te quede una vida.', gana: `Campeones: ${efectoTxt(F.gana)}.`, pierde: `Subcampeones: ${efectoTxt(F.pierde)}.` };
    }
    return null;
  }
  // Semana de la promoción: la liga ya acabó; se decide con tu minijuego (o por nivel si no lo juegas)
  function jugarPromocion(s, R) {
    const T = s.temporada, pr = T.promocion; if (!pr || pr.estado !== 'pendiente') return false;
    const m = mj(s), gana = m && m.tipo === 'promocion' ? m.p >= 0.6 : azar(s, `promo|${T.num}|${T.liga}`) < prob(s);
    pr.estado = gana ? 'ganada' : 'perdida';
    const X = TXT_PROMO[pr.clase];
    R.lineas.push([X.ic, `${X.n}: ${gana ? '¡la ganáis!' : 'la perdéis.'}`, gana ? 'bien' : 'mal']);
    if (pr.clase === 'titulo') {
      aplicar(s, gana ? { dinero: 1500, rep: 4, marca: 3, confianza: 6 } : { rep: 1, confianza: -3 });
      if (gana) { (s.trofeos = s.trofeos || []).push({ ic: '👑', n: `Liga · ${LIGAS[T.liga].corto}`, semana: s.semana }); P2.celebrar(s, { tipo: 'titulo', n: `Liga · ${LIGAS[T.liga].n}`, ic: '👑', dinero: 1500, rep: 4, marca: 3 }); }
      R.grandes = (R.grandes || []).concat({ ic: gana ? '👑' : '🥈', titulo: gana ? '¡CAMPEONES DE LIGA!' : 'Subcampeones de liga', bien: gana, texto: gana ? '+1.500 €, +4 reputación, +3 marca. Y la temporada que viene, Copa de Europa.' : 'Tan cerca… Aun así, la temporada que viene jugáis la Copa de Europa.' });
    } else if (pr.clase === 'ascenso' && !gana) { aplicar(s, { rep: -1, confianza: -5 }); R.grandes = (R.grandes || []).concat({ ic: '😖', titulo: 'Os quedáis a las puertas', bien: false, texto: 'Perdéis la promoción: seguís en la misma categoría. −5 de confianza del míster.' }); }
    else if (pr.clase === 'ascenso' && gana) R.grandes = (R.grandes || []).concat({ ic: '🎉', titulo: '¡ASCENSO!', bien: true, texto: `Ganáis la promoción: la temporada que viene jugáis en ${LIGAS[LIGAS[T.liga].sube].n}.` });
    else if (pr.clase === 'permanencia' && !gana) R.grandes = (R.grandes || []).concat({ ic: '📉', titulo: 'Descenso', bien: false, texto: `Perdéis la permanencia: bajáis a ${LIGAS[LIGAS[T.liga].baja].n}.` });
    else if (pr.clase === 'permanencia' && gana) { aplicar(s, { confianza: 4 }); R.grandes = (R.grandes || []).concat({ ic: '😅', titulo: '¡SALVADOS!', bien: true, texto: 'Ganáis la permanencia en el último partido. +4 de confianza del míster.' }); }
    P2.finTemporada(s, R);
    return true;
  }
  // Ajusta quién sube y quién baja según la promoción (lo llama moverEquipos)
  function ajustarMovimiento(s, T, res, tabla, Z) {
    const pr = T.promocion; if (!pr || pr.estado === 'pendiente') return;
    const n = tabla.length, ultSalvo = tabla[n - Z.desc - 1], primDesc = tabla[n - Z.desc];
    if (pr.clase === 'ascenso' && pr.estado === 'ganada' && !res.sube.includes(T.yo)) res.sube.push(T.yo);
    if (pr.clase === 'permanencia' && Z.desc) {
      // la promoción la juegan el último salvado y el primero en descenso: el que gana se queda
      const yoBaja = res.baja.includes(T.yo), otro = yoBaja ? ultSalvo : primDesc;
      if (pr.estado === 'ganada' && yoBaja) res.baja = res.baja.filter(id => id !== T.yo).concat(otro.id);
      if (pr.estado === 'perdida' && !yoBaja) res.baja = res.baja.filter(id => id !== otro.id).concat(T.yo);
    }
  }
  // Al cerrar la temporada: ¿Europa o Mundial la próxima?
  function trasTemporada(s, R) {
    const T = s.temporada, L = LIGAS[T.liga], pos = P2.posicion(T);
    if (!L.sube && pos <= 2 && !s.europaProxima) { s.europaProxima = true; R.lineas.push(['⭐', '¡Clasificados para la Copa de Europa de la temporada que viene!', 'bien']); }
    if (s.p.nivel >= CONVOCATORIA.nivel && s.p.rep >= CONVOCATORIA.rep && !s.convocado) {
      s.convocado = true;
      P2.celebrar(s, { tipo: 'convocatoria', n: 'Selección', ic: '🌍' });
      R.grandes = (R.grandes || []).concat({ ic: '🌍', titulo: '¡CONVOCADO/A CON LA SELECCIÓN!', bien: true, texto: 'La temporada que viene juegas el Mundial. Si llegáis a la final, la juegas tú.' });
    }
  }
  // Para la interfaz: ¿qué competición se decide esta semana?
  function finalEstaSemana(s) {
    const T = s.temporada; if (!T || T.cerrada || s.fase !== 'club') return null;
    const c = copaFinalEn(s, T.jornada); return c ? Object.assign({ copa: c.id }, COMPETICIONES[c.id]) : null;
  }

  Object.assign(P2, { iniciarPromocion, promoPendiente, enJuego, COMPETICIONES, CONVOCATORIA, TXT_PROMO, prepararCopas, semanaCopas, clasePromocion, jugarPromocion, ajustarMovimiento, trasTemporada, finalEstaSemana });
})(globalThis.P2 = globalThis.P2 || {});
