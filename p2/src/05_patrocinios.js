/* =====================================================================
   05 · PATROCINIOS: contratos con requisitos, prima, pago semanal y
   obligaciones con fecha. Los actos salen del contrato; no se repiten a voluntad.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, MARCAS, TIERS, clamp, r1, eur } = P2;

  function bloqueoMarca(s, M) {
    const O = P2.oferta(s);
    if (!O || O.amateur || s.fase !== 'club') return 'Necesitas un contrato profesional.';
    if (s.patros.some(c => c.id === M.id)) return 'Ya trabajas con esta marca.';
    if (s.patroHist.some(h => h.id === M.id && h.roto)) return 'Rompiste con esta marca.';
    const tiers = TIERS[O.patroTier] || [];
    if (!tiers.includes(M.tier)) return 'Tu club no tiene visibilidad para marcas deportivas.';
    if (s.p.rep < M.repMin) return `Necesitas ${M.repMin} de fama (tienes ${Math.floor(s.p.rep)}).`;
    if (M.titularidades && s.stats.titular < M.titularidades) return `Necesitas ${M.titularidades} partidos de titular (llevas ${s.stats.titular}).`;
    if (s.patros.length >= CFG.patrocinio.maxContratos) return `Máximo ${CFG.patrocinio.maxContratos} contratos a la vez.`;
    return null;
  }
  const marcasVisibles = s => MARCAS.map(M => ({ M, bloqueo: bloqueoMarca(s, M) }));

  function firmarMarca(s, id, R) {
    const M = MARCAS.find(m => m.id === id);
    if (!M || bloqueoMarca(s, M)) return false;
    const neto = Math.round(M.prima * (1 - CFG.club.impuesto));
    s.p.dinero += neto; s.acum.patrocinio += neto; s.acum.impuestos += M.prima - neto;
    s.patros.push({ id, desde: s.semana, hasta: s.semana + M.semanas, proxActo: s.semana + M.actoCada, faltas: 0, actos: 0, aplazado: false, bonusTemp: {} });
    P2.anotar(s, M.ic, `Firmo con ${M.n}: prima de ${eur(neto)} y ${eur(M.semanal)}/semana. ${M.obligacion}.`);
    P2.conseguirHito(s, 'patro', R);
    return true;
  }

  // Cada semana: cobro y, si toca, el acto (una decisión que ocupa la semana)
  function semanaPatros(s, R) {
    for (const c of s.patros.slice()) {
      const M = MARCAS.find(m => m.id === c.id);
      const neto = Math.round(M.semanal * (1 - CFG.club.impuesto));
      s.p.dinero += neto; s.acum.patrocinio += neto; s.acum.impuestos += M.semanal - neto;
      R.ingresos.push([`${M.ic} ${M.n}`, neto]);
      if (s.semana >= c.hasta) {
        s.patros = s.patros.filter(x => x !== c); s.patroHist.push({ id: c.id, fin: s.semana, roto: false });
        R.lineas.push([M.ic, `Termina tu contrato con ${M.n}. Si sigues cumpliendo los requisitos, puedes volver a firmar.`]);
      }
    }
  }
  // ¿Hay acto esta semana? Se pregunta antes de elegir la acción
  function actoPendiente(s) {
    const c = s.patros.find(x => x.proxActo <= s.semana);
    return c ? { tipo: 'acto', marca: c.id } : null;
  }
  function resolverActo(s, marcaId, op, R) {
    const c = s.patros.find(x => x.id === marcaId), M = MARCAS.find(m => m.id === marcaId);
    if (!c) return '';
    if (op === 'ir') {
      c.actos++; c.proxActo = s.semana + M.actoCada;
      s.p.rep = r1(clamp(s.p.rep + 1.5, 0, 100));
      return `Cumples con ${M.n}: +1,5 de fama. La semana se va en el acto.`;
    }
    if (op === 'aplazar' && !c.aplazado) {
      c.aplazado = true; c.proxActo = s.semana + 1;
      return `${M.n} acepta moverlo a la semana que viene. No volverán a aceptarlo.`;
    }
    c.faltas++; c.proxActo = s.semana + M.actoCada;
    if (c.faltas >= CFG.patrocinio.faltasMax) {
      s.patros = s.patros.filter(x => x !== c); s.patroHist.push({ id: c.id, fin: s.semana, roto: true });
      s.p.rep = r1(clamp(s.p.rep - 4, 0, 100));
      return `${M.n} rompe el contrato por incumplir (−4 de fama). No volverá a contar contigo.`;
    }
    return `Faltas al acto de ${M.n} (${c.faltas}/${CFG.patrocinio.faltasMax}). A la siguiente, rompen el contrato.`;
  }
  // Objetivo deportivo de la marca al final de la temporada
  function finTemporadaPatros(s, R, media) {
    for (const c of s.patros) {
      const M = MARCAS.find(m => m.id === c.id), O = M.objetivo;
      if (!O) continue;
      const k = `${s.temporada.liga}-${s.temporada.num}`;
      if (c.bonusTemp[k] != null) continue;
      if (media >= O.notaMedia && s.stats.titularTemp >= 5) {
        const neto = Math.round(O.bonus * (1 - CFG.club.impuesto));
        c.bonusTemp[k] = neto; s.p.dinero += neto; s.acum.patrocinio += neto;
        R.lineas.push([M.ic, `${M.n}: objetivo cumplido (nota media ${P2.nf(media)}): +${eur(neto)}.`, 'bien']);
      } else {
        c.bonusTemp[k] = 0;
        R.lineas.push([M.ic, `${M.n}: no llegas a su objetivo (nota ${P2.nf(O.notaMedia)} y 5 titularidades). Sin bonus.`, 'mal']);
      }
    }
  }
  Object.assign(P2, { bloqueoMarca, marcasVisibles, firmarMarca, semanaPatros, actoPendiente, resolverActo, finTemporadaPatros });
})(globalThis.P2 = globalThis.P2 || {});
