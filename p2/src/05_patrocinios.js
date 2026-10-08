/* =====================================================================
   05 · MARCA PERSONAL Y PATROCINIOS
   Tres cosas distintas: NIVEL (cómo juegas), REPUTACIÓN DEPORTIVA (p.rep: cómo te ve
   el fútbol) y MARCA PERSONAL (p.marca: cómo te ven marcas y medios).
   La marca tiene un techo suave ligado a la reputación: sin prestigio deportivo, los
   actos comerciales rinden poco; con él, puedes ser más comercial que buen jugador.
   Patrocinios: contratos con identidad (efectos creíbles), exclusividades, carga de actos
   y duración. Un contrato de N semanas paga exactamente N veces; renovar no repite la prima.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, MARCAS, TIERS, LIGAS, clamp, r1, eur } = P2;

  // ---------- Marca personal ----------
  const marcaPersonal = s => r1(s.p.marca || 0);
  const techoMarca = s => Math.min(100, CFG.patrocinio.techoMarca + (s.p.rep || 0));
  // Sube la marca respetando el techo suave (por encima, solo rinde un 15 %). Devuelve lo que ha subido
  function sumarMarca(s, x) {
    const antes = s.p.marca || 0;
    if (x <= 0) { s.p.marca = r1(clamp(antes + x, 0, 100)); return r1(s.p.marca - antes); }
    const hueco = Math.max(0, techoMarca(s) - antes), dentro = Math.min(x, hueco), fuera = x - dentro;
    s.p.marca = r1(clamp(antes + dentro + fuera * CFG.patrocinio.sobreTecho, 0, 100));
    return r1(s.p.marca - antes);
  }

  // ---------- Efectos de los contratos activos ----------
  const activas = s => (s.patros || []).map(c => MARCAS.find(m => m.id === c.id)).filter(Boolean);
  function efecto(s, k) { return activas(s).reduce((a, M) => a + ((M.ef && M.ef[k]) || 0), 0); }
  function efectoMult(s, k) { return activas(s).reduce((a, M) => a * ((M.ef && M.ef[k]) || 1), 1); }

  const historial = (s, id) => s.patroHist.filter(h => h.id === id);
  const rota = (s, id) => historial(s, id).some(h => h.roto);
  const yaFirmada = (s, id) => (s.marcasFirmadas || {})[id] > 0;

  // Exclusividades: mismo sector, o tiers incompatibles (una marca grande no quiere marcas locales al lado)
  function conflicto(s, M) {
    for (const N of activas(s)) {
      if (N.id === M.id) continue;
      if (N.cat === M.cat) return `Ya tienes una marca del mismo sector (${N.n}).`;
      if ((M.incompatible || []).includes(N.tier)) return `${M.n} no quiere compartir imagen con marcas ${N.tier === 'local' ? 'locales' : N.tier} (${N.n}).`;
      if ((N.incompatible || []).includes(M.tier)) return `${N.n} exige exclusividad: no admite marcas ${M.tier === 'local' ? 'locales' : M.tier}.`;
    }
    return null;
  }
  function bloqueoMarca(s, M, renovando) {
    const O = P2.oferta(s);
    if (!O || O.amateur || s.fase !== 'club') return 'Necesitas un contrato profesional.';
    if (!renovando && s.patros.some(c => c.id === M.id)) return 'Ya trabajas con esta marca.';
    if (rota(s, M.id)) return 'Rompiste con esta marca: no vuelve.';
    const tiers = TIERS[O.patroTier] || [];
    if (!tiers.includes(M.tier)) return M.tier === 'local' ? 'Tu club no tiene visibilidad.' : 'Tu club no tiene visibilidad para marcas deportivas.';
    if (M.ligaMin && LIGAS[s.temporada.liga].nivel < M.ligaMin) return `Solo patrocina en ${LIGAS[Object.keys(LIGAS).find(k => LIGAS[k].nivel === M.ligaMin)].corto} o más arriba.`;
    if (marcaPersonal(s) < M.marcaMin) return `Necesitas ${M.marcaMin} de marca personal (tienes ${Math.floor(marcaPersonal(s))}).`;
    if (M.repMin && s.p.rep < M.repMin) return `Necesitas ${M.repMin} de reputación deportiva (tienes ${Math.floor(s.p.rep)}).`;
    if (M.nivelMin && s.p.nivel < M.nivelMin) return `Necesitas nivel ${M.nivelMin} (tienes ${P2.nf(s.p.nivel)}).`;
    if (M.titularidades && s.stats.titular < M.titularidades) return `Necesitas ${M.titularidades} partidos de titular (llevas ${s.stats.titular}).`;
    const c = conflicto(s, M); if (c) return c;
    if (!renovando && s.patros.length >= CFG.patrocinio.maxContratos) return `Máximo ${CFG.patrocinio.maxContratos} contratos a la vez.`;
    return null;
  }
  const marcasVisibles = s => MARCAS.map(M => ({ M, bloqueo: bloqueoMarca(s, M), renovacion: yaFirmada(s, M.id) && !s.patros.some(c => c.id === M.id) }));

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
    sumarMarca(s, M.tier === 'grande' ? 4 : M.tier === 'deportiva' ? 2 : 1);
    P2.anotar(s, M.ic, `${C.renov ? 'Renuevo' : 'Firmo'} con ${M.n}: prima de ${eur(neto)} y ${eur(C.semanal)}/semana durante ${M.semanas} semanas. ${M.obligacion}.`);
    P2.celebrar(s, { tipo: 'patrocinio', n: M.n, ic: M.ic, prima: neto, semanal: C.semanal, semanas: M.semanas, renov: C.renov });
    P2.tele(s, 'marcaFirmada', { id, renov: C.renov });
    P2.conseguirHito(s, 'patro', R);
    return true;
  }
  const semanasRestantes = c => c.semanas - c.pagos;

  // Ofertas: cuando cumples por primera vez los requisitos de una marca, te llama (puedes decir que no)
  function revisarOfertasMarca(s) {
    if (s.fase !== 'club' || s.pendiente) return;
    s.marcasOfrecidas = s.marcasOfrecidas || {};
    for (const M of MARCAS) {
      if (s.marcasOfrecidas[M.id] || yaFirmada(s, M.id)) continue;
      const b = bloqueoMarca(s, M);
      // Se ofrece aunque estés al máximo o en conflicto: así decides si te compensa cambiar
      if (b && !/Máximo|mismo sector|exclusividad|compartir imagen/.test(b)) continue;
      s.marcasOfrecidas[M.id] = s.semana;
      P2.tele(s, 'marcaVista', { id: M.id });
      P2.encolar(s, { tipo: 'patroOferta', marca: M.id });
      return;   // una por semana
    }
  }

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
    // Sin actividad comercial, la marca por encima del techo se desinfla poco a poco
    if ((s.p.marca || 0) > techoMarca(s)) s.p.marca = r1(s.p.marca - 0.3);
  }
  function actoPendiente(s) {
    const c = s.patros.find(x => x.proxActo <= s.semana && x.pagos < x.semanas);
    return c ? { tipo: 'acto', marca: c.id } : null;
  }
  function resolverActo(s, marcaId, op) {
    const c = s.patros.find(x => x.id === marcaId), M = MARCAS.find(m => m.id === marcaId);
    if (!c) return '';
    if (op === 'ir') {
      c.actos++; c.proxActo = s.semana + M.actoCada;
      const g = sumarMarca(s, M.marcaActo || 1.5);
      s.p.energia = clamp(s.p.energia - CFG.patrocinio.actoEnergia, 0, CFG.energia.max);
      if (s.fase === 'club') s.confianza = clamp(s.confianza - CFG.patrocinio.actoConfianza, 0, 100);
      P2.tele(s, 'acto', { id: marcaId, op });
      return `Cumples con ${M.n}: +${P2.nf(g)} de marca personal (−${CFG.patrocinio.actoEnergia} energía, −${CFG.patrocinio.actoConfianza} confianza del míster por faltar al entreno).`;
    }
    if (op === 'aplazar' && !c.aplazado) {
      c.aplazado = true; c.proxActo = s.semana + 1;
      P2.tele(s, 'acto', { id: marcaId, op });
      return `${M.n} acepta moverlo a la semana que viene. No volverán a aceptarlo.`;
    }
    c.faltas++; c.proxActo = s.semana + M.actoCada;
    P2.tele(s, 'acto', { id: marcaId, op: 'no' });
    if (c.faltas >= CFG.patrocinio.faltasMax) {
      s.patros = s.patros.filter(x => x !== c); s.patroHist.push({ id: c.id, fin: s.semana, roto: true, faltas: c.faltas, actos: c.actos });
      sumarMarca(s, -4);
      return `${M.n} rompe el contrato por incumplir (−4 de marca personal). No volverá a contar contigo.`;
    }
    return `Faltas al acto de ${M.n} (${c.faltas}/${CFG.patrocinio.faltasMax}). A la siguiente, rompen el contrato.`;
  }
  // Dejar una marca por voluntad propia (para hacer sitio a otra): sin romper, pero sin renovar
  function dejarMarca(s, id) {
    const c = s.patros.find(x => x.id === id); if (!c) return false;
    s.patros = s.patros.filter(x => x !== c); s.patroHist.push({ id, fin: s.semana, roto: false, faltas: c.faltas, actos: c.actos, dejada: true });
    P2.tele(s, 'marcaDejada', { id });
    return true;
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
  Object.assign(P2, { marcaPersonal, techoMarca, sumarMarca, efectoPatro: efecto, efectoPatroMult: efectoMult, conflictoMarca: conflicto, bloqueoMarca, marcasVisibles, condicionesMarca: condiciones,
    firmarMarca, revisarOfertasMarca, dejarMarca, semanaPatros, actoPendiente, resolverActo, finTemporadaPatros, semanasRestantes });
})(globalThis.P2 = globalThis.P2 || {});
