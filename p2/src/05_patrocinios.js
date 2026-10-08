/* =====================================================================
   05 · PATROCINIOS: contratos con requisitos, prima, pago semanal y
   obligaciones con fecha. Un contrato de N semanas paga exactamente N veces.
   Al acabar bien se puede renovar (prima reducida). Si rompes por incumplir,
   esa marca no vuelve. Los actos salen del contrato; no se repiten a voluntad.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, MARCAS, TIERS, clamp, r1, eur } = P2;

  // Marca personal: la fama vale más si además juegas bien (sin nivel, tu imagen se desinfla)
  function marcaPersonal(s) { return r1(s.p.rep * factorNivel(s)); }
  const factorNivel = s => clamp(0.5 + (s.p.nivel - 45) / 30, 0.5, 1.3);

  const historial = (s, id) => s.patroHist.filter(h => h.id === id);
  const rota = (s, id) => historial(s, id).some(h => h.roto);
  const yaFirmada = (s, id) => (s.marcasFirmadas || {})[id] > 0;

  function bloqueoMarca(s, M, renovando) {
    const O = P2.oferta(s);
    if (!O || O.amateur || s.fase !== 'club') return 'Necesitas un contrato profesional.';
    if (!renovando && s.patros.some(c => c.id === M.id)) return 'Ya trabajas con esta marca.';
    if (rota(s, M.id)) return 'Rompiste con esta marca: no vuelve.';
    const tiers = TIERS[O.patroTier] || [];
    if (!tiers.includes(M.tier)) return 'Tu club no tiene visibilidad para marcas deportivas.';
    const mp = marcaPersonal(s);
    if (mp < M.repMin) return `Necesitas ${M.repMin} de marca personal (tienes ${Math.floor(mp)}: fama ${Math.floor(s.p.rep)} × tu nivel).`;
    if (M.nivelMin && s.p.nivel < M.nivelMin) return `Necesitas nivel ${M.nivelMin} (tienes ${P2.nf(s.p.nivel)}).`;
    if (M.titularidades && s.stats.titular < M.titularidades) return `Necesitas ${M.titularidades} partidos de titular (llevas ${s.stats.titular}).`;
    if (!renovando && s.patros.length >= CFG.patrocinio.maxContratos) return `Máximo ${CFG.patrocinio.maxContratos} contratos a la vez.`;
    return null;
  }
  const marcasVisibles = s => MARCAS.map(M => ({ M, bloqueo: bloqueoMarca(s, M), renovacion: yaFirmada(s, M.id) && !s.patros.some(c => c.id === M.id) }));

  // Primera firma: prima completa. Volver a firmar tras un contrato terminado: solo prima de renovación
  function condiciones(s, M) {
    const renov = yaFirmada(s, M.id), ult = historial(s, M.id).slice(-1)[0];
    const limpio = ult && !ult.faltas;
    return { prima: Math.round(renov ? M.prima * CFG.patrocinio.primaRenovacion : M.prima), semanal: Math.round(M.semanal * (renov && limpio ? 1 + CFG.patrocinio.subidaRenovacion : 1)), renov };
  }
  function firmarMarca(s, id, R) {
    const M = MARCAS.find(m => m.id === id);
    if (!M || bloqueoMarca(s, M)) return false;
    const C = condiciones(s, M);
    const neto = Math.round(C.prima * (1 - CFG.club.impuesto));
    s.p.dinero += neto; s.acum.patrocinio += neto; s.acum.impuestos += C.prima - neto;
    s.patros.push({ id, desde: s.semana, semanas: M.semanas, pagos: 0, semanal: C.semanal, proxActo: s.semana + M.actoCada, faltas: 0, actos: 0, aplazado: false, bonusTemp: {} });
    s.marcasFirmadas = s.marcasFirmadas || {}; s.marcasFirmadas[id] = (s.marcasFirmadas[id] || 0) + 1;
    P2.anotar(s, M.ic, `${C.renov ? 'Renuevo' : 'Firmo'} con ${M.n}: prima de ${eur(neto)} y ${eur(C.semanal)}/semana durante ${M.semanas} semanas. ${M.obligacion}.`);
    P2.conseguirHito(s, 'patro', R);
    return true;
  }
  const semanasRestantes = c => c.semanas - c.pagos;

  // Cada semana: un pago por contrato. Al llegar al último, el contrato termina y se puede renovar
  function semanaPatros(s, R) {
    for (const c of s.patros.slice()) {
      const M = MARCAS.find(m => m.id === c.id);
      if (c.pagos >= c.semanas) continue;
      const bruto = c.semanal || M.semanal, neto = Math.round(bruto * (1 - CFG.club.impuesto));
      s.p.dinero += neto; s.acum.patrocinio += neto; s.acum.impuestos += bruto - neto;
      c.pagos++;
      R.ingresos.push([`${M.ic} ${M.n} (pago ${c.pagos}/${c.semanas})`, neto]);
      if (c.pagos >= c.semanas) {
        s.patros = s.patros.filter(x => x !== c);
        s.patroHist.push({ id: c.id, fin: s.semana, roto: false, faltas: c.faltas, actos: c.actos });
        R.lineas.push([M.ic, `Termina tu contrato con ${M.n} (${c.semanas} pagos cobrados).`]);
        P2.encolar(s, { tipo: 'renovarMarca', marca: c.id });
      }
    }
  }
  // ¿Hay acto esta semana? Nunca después del último pago del contrato
  function actoPendiente(s) {
    const c = s.patros.find(x => x.proxActo <= s.semana && x.pagos < x.semanas);
    return c ? { tipo: 'acto', marca: c.id } : null;
  }
  function resolverActo(s, marcaId, op) {
    const c = s.patros.find(x => x.id === marcaId), M = MARCAS.find(m => m.id === marcaId);
    if (!c) return '';
    if (op === 'ir') {
      c.actos++; c.proxActo = s.semana + M.actoCada;
      s.p.rep = r1(clamp(s.p.rep + 1.5, 0, 100));
      return `Cumples con ${M.n}: +1,5 de fama.`;
    }
    if (op === 'aplazar' && !c.aplazado) {
      c.aplazado = true; c.proxActo = s.semana + 1;
      return `${M.n} acepta moverlo a la semana que viene. No volverán a aceptarlo.`;
    }
    c.faltas++; c.proxActo = s.semana + M.actoCada;
    if (c.faltas >= CFG.patrocinio.faltasMax) {
      s.patros = s.patros.filter(x => x !== c); s.patroHist.push({ id: c.id, fin: s.semana, roto: true, faltas: c.faltas, actos: c.actos });
      s.p.rep = r1(clamp(s.p.rep - 4, 0, 100));
      return `${M.n} rompe el contrato por incumplir (−4 de fama). No volverá a contar contigo.`;
    }
    return `Faltas al acto de ${M.n} (${c.faltas}/${CFG.patrocinio.faltasMax}). A la siguiente, rompen el contrato.`;
  }
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
  Object.assign(P2, { marcaPersonal, bloqueoMarca, marcasVisibles, condicionesMarca: condiciones, firmarMarca, semanaPatros, actoPendiente, resolverActo, finTemporadaPatros, semanasRestantes });
})(globalThis.P2 = globalThis.P2 || {});
