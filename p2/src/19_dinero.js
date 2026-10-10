/* =====================================================================
   19 · DINERO DE LA VIDA REAL (P2.8)
   Que el dinero importe y se entienda, como en la vida real:
   - Desgloses («extractos»): fichajes, renovaciones, agentes, finiquitos…
     con bruto, retención, comisión, neto y total, en lenguaje claro.
   - Agentes: varios, cada uno con sus cláusulas (comisión, adelanto, exclusividad).
   - Empleo en el barrio: contrato, despido y finiquito (vacaciones, pagas extra, indemnización).
   - Tu bolsillo: lo que entra y sale cada semana y cuántas semanas aguantas (colchón).
   - Imprevistos (con y sin colchón), decisiones con precio en el club, vivienda,
     cuenta de ahorro y fondo indexado, e hitos de dinero discretos.
   Todo es dinero del juego. Sin azar del juego principal (s.rng): lo que es incierto
   usa un hash de la semilla, así la partida no cambia por mirar una pantalla.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, OFERTAS, LIGAS, eur, clamp } = P2;
  const h32 = str => { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const azarFijo = (s, k) => (h32(`${s.seed}|${k}`) % 10000) / 10000;   // 0–1, siempre igual para la misma partida y clave
  const IMP = () => CFG.club.impuesto;
  const prog = (s, sem, efecto, data) => P2.programar(s, sem, efecto, Object.assign({ desde: s.semana }, data || {}));
  const pct = x => `${Math.round(x * 100)} %`;
  const nombre = (s, id) => { const R = P2.persona && P2.persona(id); return R ? (P2.nombreRel ? P2.nombreRel(s, R) : R.n) : id; };
  const rel = (s, id, d, por) => { if (P2.cambiarRel) P2.cambiarRel(s, id, d, por); };

  // ---------- Extractos: el resumen en números de cada movimiento importante ----------
  // filas: [concepto, importe (+ entra / − sale), nota?]; total: lo que cambia tu dinero de verdad
  function extracto(s, d, R) {
    const x = Object.assign({ semana: s.semana, filas: [], clausulas: [] }, d, { n: (s.nExtracto = (s.nExtracto || 0) + 1) });
    if (x.total == null) x.total = x.filas.reduce((a, f) => a + (f[3] === 'info' ? 0 : f[1]), 0);
    s.extractos = (Array.isArray(s.extractos) ? s.extractos : []).concat(x).slice(-15);
    if (R) R.desgloses = (R.desgloses || []).concat(x);
    return x;
  }
  const info = (concepto, importe, nota) => [concepto, importe, nota || '', 'info'];   // fila informativa: no suma al total

  // ---------- Agentes ----------
  // comision: % de tus primas por victoria · comisionFichaje: % de primas de fichaje y renovación
  // adelanto: lo que te paga al firmar · exclusiva: semanas en las que romper cuesta penal
  // interes: interés de otros clubes que suma cada semana · renov: mejora de tus renovaciones
  const AGENTES = {
    sonia: { id: 'sonia', ic: '🤝', n: 'Sonia Vidal', tipo: 'Representante independiente', comision: 0, comisionFichaje: 0.05, adelanto: 0, exclusiva: 0, penal: 0, interes: 0, renov: 0,
      d: 'Lleva a pocos jugadores y te dedica tiempo. Si confías en ella, pelea tus renovaciones.' },
    elite: { id: 'elite', ic: '🏢', n: 'Élite Sports Management', tipo: 'Agencia grande', comision: 0.15, comisionFichaje: 0.10, adelanto: 1500, exclusiva: 40, penal: 3000, interes: 1.2, renov: 0.08,
      d: 'Tiene contactos en todos los clubes: te mueven en el mercado. Cobran caro y te atan.' },
    toni: { id: 'toni', ic: '🧔', n: 'Toni Ruiz', tipo: 'Agente del barrio', comision: 0.05, comisionFichaje: 0.03, adelanto: 0, exclusiva: 0, penal: 0, interes: 0, renov: -0.04,
      d: 'De confianza y barato. Conoce a poca gente fuera de la ciudad.' },
  };
  const agenteDe = s => (s.agente ? AGENTES[s.agenteId] || AGENTES.sonia : null);
  const comisionFichaje = s => { const A = agenteDe(s); return A ? A.comisionFichaje : 0; };
  const mejoraRenov = s => { const A = agenteDe(s); return A ? A.renov : 0; };
  const clausulasAgente = A => [
    A.comision ? `Se queda el ${pct(A.comision)} de tus primas por victoria` : 'No cobra de tus primas por victoria (por ahora)',
    `Se queda el ${pct(A.comisionFichaje)} de las primas de fichaje y renovación`,
    A.adelanto ? `Te adelanta ${eur(A.adelanto)} al firmar` : 'Sin adelanto',
    A.exclusiva ? `Exclusividad: ${A.exclusiva} semanas. Si lo dejas antes, pagas ${eur(A.penal)}` : 'Sin exclusividad: lo dejas cuando quieras',
    A.interes ? 'Más clubes preguntan por ti cada semana' : A.renov < 0 ? 'Negocia algo peor las renovaciones' : 'Negocia tus renovaciones',
  ];
  function desgloseAgente(s, A) {
    const filas = [];
    if (A.adelanto) { const n = Math.round(A.adelanto * (1 - IMP())); filas.push(['Adelanto al firmar (bruto)', A.adelanto], [`Retención (${pct(IMP())})`, -(A.adelanto - n)]); }
    const pv = (P2.oferta(s) || {}).primaVictoria || 0;
    if (pv) filas.push(info('Por cada victoria cobrarías', Math.round(pv * (1 - IMP()) * (1 - A.comision)), `en vez de ${eur(Math.round(pv * (1 - IMP())))}`));
    return { ic: A.ic, titulo: `${A.n} · ${A.tipo}`, filas, clausulas: clausulasAgente(A), totalTxt: 'Te ingresa al firmar' };
  }
  function elegirAgente(s, id, R) {
    const A = AGENTES[id]; if (!A) return false;
    s.agente = true; s.agenteId = id; s.agenteDesde = s.semana; s.comisionAgente = A.comision;
    const d = desgloseAgente(s, A);
    if (A.adelanto) { const n = Math.round(A.adelanto * (1 - IMP())); s.p.dinero += n; s.acum.primas += n; s.acum.impuestos += A.adelanto - n; }
    extracto(s, Object.assign(d, { titulo: `Firmas con ${A.n}` }), R);
    P2.anotar(s, A.ic, `Mi agente: ${A.n}.`);
    return true;
  }
  // Romper con tu agente (si hay exclusividad vigente, pagas la penalización)
  function penalAgente(s) { const A = agenteDe(s); return A && A.exclusiva && s.semana - (s.agenteDesde || 0) < A.exclusiva ? A.penal : 0; }
  function cambiarAgente(s, id, R) {
    const A0 = agenteDe(s), pen = penalAgente(s);
    if (pen && s.p.dinero < pen) return `Romper con ${A0.n} cuesta ${eur(pen)} y tienes ${eur(s.p.dinero)}.`;
    if (pen) { s.p.dinero -= pen; extracto(s, { ic: '📄', titulo: `Rompes con ${A0.n}`, filas: [['Penalización por exclusividad', -pen]], clausulas: [`Te quedaban ${A0.exclusiva - (s.semana - s.agenteDesde)} semanas de exclusividad`] }, R); }
    elegirAgente(s, id, R);
    return null;
  }
  // Al ser titular 3 veces: varias agencias te llaman (Sonia queda por defecto si no eliges)
  P2.DECISIONES.agentes = {
    vista(s) {
      const ops = Object.values(AGENTES).map(A => ({ id: A.id, n: `${A.ic} ${A.n} · ${A.tipo}`, ventaja: A.adelanto ? `Te adelanta ${eur(A.adelanto)} · más clubes te buscan` : A.id === 'toni' ? 'La comisión más baja' : 'Te dedica tiempo y pelea tus renovaciones',
        coste: A.comision ? `${pct(A.comision)} de tus primas por victoria · ${pct(A.comisionFichaje)} de las primas de fichaje` : `${pct(A.comisionFichaje)} de las primas de fichaje`,
        riesgo: A.exclusiva ? `Exclusividad ${A.exclusiva} semanas (romper: ${eur(A.penal)})` : 'Ninguno', tags: A.id === 'sonia' ? ['seguro', 'deporte'] : A.id === 'elite' ? ['dinero'] : ['riesgo'], desglose: desgloseAgente(s, A) }));
      ops.push({ id: 'ninguno', n: 'Ir sin agente', ventaja: 'Te quedas todo', coste: 'Negocias tú solo/a: no puedes pedir más al renovar', riesgo: 'Menos ofertas de otros clubes', tags: [] });
      return { ic: '📞', titulo: 'Te llaman varios agentes', texto: 'Tres titularidades y ya hay quien quiere representarte. Cada uno cobra distinto y te ata de forma distinta.', ops };
    },
    resolver(s, ev, id, R) {
      if (id === 'ninguno') { s.agente = false; s.agenteId = null; s.comisionAgente = 0; return { texto: 'Decides llevar tus cosas tú solo/a.', titulo: 'Sin agente', ic: '🙅' }; }
      if (!AGENTES[id]) return null;
      elegirAgente(s, id, R);
      return { texto: `Firmas con ${AGENTES[id].n}.${AGENTES[id].adelanto ? ` Te ingresa el adelanto: +${eur(Math.round(AGENTES[id].adelanto * (1 - IMP())))} netos.` : ''}`, titulo: 'Tu agente', ic: AGENTES[id].ic };
    },
  };

  // ---------- Contratos de club: lo que cobras de verdad ----------
  const SEMANAS_TEMP = 14;
  function semanasTemporada(s, liga) { const T = s.temporada; return T && T.liga === liga && T.calendario ? T.calendario.length : SEMANAS_TEMP; }
  function desgloseContrato(s, c) {
    // c: { n, ic, sueldo, prima, temporadas, primaVictoria, primaObjetivo, primaAscenso, amateur, liga, renov }
    const sem = semanasTemporada(s, c.liga) * c.temporadas, imp = c.amateur ? 0 : IMP(), com = c.amateur ? 0 : comisionFichaje(s), A = agenteDe(s);
    const sNeto = Math.round(c.sueldo * (1 - imp)), filas = [];
    filas.push(info('Sueldo bruto', c.sueldo, 'por semana'));
    if (imp) filas.push(info(`Retención de Hacienda (${pct(imp)})`, -(c.sueldo - sNeto), 'por semana'));
    filas.push([`Sueldo neto × ${sem} semanas`, sNeto * sem, `${eur(sNeto)}/semana`]);
    if (c.prima) {
      const pn = Math.round(c.prima * (1 - imp));
      filas.push([c.renov ? 'Prima de renovación (bruta)' : 'Prima de fichaje (bruta)', c.prima], [`Retención de la prima (${pct(imp)})`, -(c.prima - pn)]);
      if (com) filas.push([`Comisión de ${A.n} (${pct(com)})`, -Math.round(pn * com)]);
    }
    const gv = c.amateur ? 20 : CFG.club.gastosVida;
    filas.push([`Gastos de vida (${eur(gv)}/semana)`, -gv * sem, 'comida, transporte, móvil…']);
    const vari = [];
    if (c.primaVictoria) vari.push(`Prima por victoria: ${eur(Math.round(c.primaVictoria * (1 - imp) * (1 - (A ? A.comision : 0))))} netos por partido ganado`);
    if (c.primaObjetivo) vari.push(`Prima por objetivo de liga: ${eur(Math.round(c.primaObjetivo * (1 - imp)))} netos si lo cumplís`);
    if (c.primaAscenso) vari.push(`Prima por ascenso: ${eur(Math.round(c.primaAscenso * (1 - imp)))} netos si subís`);
    const clausulas = [`Duración: ${c.temporadas} ${c.temporadas === 1 ? 'temporada' : 'temporadas'} (${sem} semanas)`].concat(vari);
    if (c.amateur) clausulas.push('No es profesional: puedes trabajar a media jornada');
    const total = filas.reduce((a, f) => a + (f[3] === 'info' ? 0 : f[1]), 0);
    return { ic: c.ic || '✍️', titulo: c.n, filas, clausulas, total, totalTxt: 'Te queda limpio (sin primas variables)' };
  }
  const contratoDeOferta = (s, id) => { const O = OFERTAS[id]; return O && { n: O.n, ic: O.ic, sueldo: O.sueldo, prima: O.prima, temporadas: O.temporadas, primaVictoria: O.primaVictoria, primaObjetivo: O.primaObjetivo, primaAscenso: O.primaAscenso, amateur: !!O.amateur, liga: P2.ligaDeClub ? P2.ligaDeClub(s, O.club) || O.liga : O.liga }; };
  const desgloseOferta = (s, id) => { const c = contratoDeOferta(s, id); return c ? desgloseContrato(s, c) : null; };

  // ---------- Empleo en el barrio: contrato, despido y finiquito ----------
  const EMPRESAS = ['Repartos Villamar', 'Supermercados Costa', 'Mensajería Rápida Sur', 'Almacenes del Puerto'];
  function registrarTrabajo(s, pago, R) {
    if (!s.empleo) {
      const k = s.empleosPrevios || 0;
      s.empleo = { empresa: EMPRESAS[k % EMPRESAS.length], desde: s.semana, semanas: 0, cobrado: 0, pago };
      R && R.lineas.push(['📝', `Firmas un contrato temporal con ${s.empleo.empresa}: ${eur(pago)} netos por semana trabajada.`]);
    }
    s.empleo.semanas++; s.empleo.ult = s.semana;   // lo cobrado lo anota la semana (una variante puede pagar distinto)
  }
  function cobroTrabajo(s, x, R) { if (!x) return; if (s.empleo && s.empleo.ult === s.semana) s.empleo.cobrado += x; R.ingresos.push([s.empleo ? `Trabajo en ${s.empleo.empresa}` : 'Trabajo', x]); }
  // Finiquito: vacaciones no disfrutadas + parte de pagas extra + indemnización (si te despiden)
  function finiquito(s, motivo) {
    const E = s.empleo; if (!E) return null;
    const vac = Math.round(E.cobrado * 30 / 365), extra = Math.round(E.cobrado * 2 / 12);
    const indem = motivo === 'despido' ? Math.round(E.cobrado * 20 / 365) : motivo === 'finTemporal' ? Math.round(E.cobrado * 12 / 365) : 0;
    const filas = [[`Vacaciones no disfrutadas`, vac, '30 días al año'], ['Parte proporcional de las 2 pagas extra', extra]];
    if (indem) filas.push([motivo === 'despido' ? 'Indemnización por despido (20 días por año)' : 'Indemnización fin de contrato (12 días por año)', indem]);
    return { ic: '📄', titulo: `Finiquito de ${E.empresa}`, filas, clausulas: [`Trabajaste ${E.semanas} ${E.semanas === 1 ? 'semana' : 'semanas'} y cobraste ${eur(E.cobrado)}`, motivo === 'voluntaria' ? 'Te vas tú: hay finiquito, pero no indemnización' : motivo === 'despido' ? 'Despido por causas objetivas' : 'Fin de contrato'] };
  }
  function dejarEmpleo(s, motivo, R) {
    const F = finiquito(s, motivo); if (!F) return 0;
    const x = extracto(s, F, R); s.p.dinero += x.total; s.acum.trabajo += x.total;
    R && R.lineas.push(['📄', `${motivo === 'voluntaria' ? 'Dejas' : 'Se acaba'} tu trabajo en ${s.empleo.empresa}. Finiquito: +${eur(x.total)}.`, 'bien']);
    P2.anotar(s, '📄', `Finiquito de ${s.empleo.empresa}: ${eur(x.total)}.`);
    s.empleosPrevios = (s.empleosPrevios || 0) + 1; s.empleo = null;
    return x.total;
  }

  // ---------- Vivienda (nivel de vida) ----------
  const VIVIENDAS = {
    padres: { ic: '🏠', n: 'Con tus padres', alquiler: 0, energia: 0, d: 'Sin alquiler. Tus padres contentos… y poca intimidad.' },
    compartido: { ic: '🛋️', n: 'Piso compartido', alquiler: 95, energia: 2, d: 'Tu primera independencia: alquiler bajo y compañeros de piso.' },
    alquiler: { ic: '🏢', n: 'Tu piso de alquiler', alquiler: 190, energia: 4, marca: 0.05, d: 'Tu espacio: descansas mejor y das otra imagen.' },
  };
  const propia = s => { const V = P2.equipado && P2.equipado(s, 'vivienda'); return V && V.patrimonial ? V : null; };
  const vivienda = s => (propia(s) ? { ic: propia(s).ic, n: `${propia(s).n} (en propiedad)`, alquiler: 0, energia: 0, d: 'Es tuya: sin alquiler.' } : VIVIENDAS[s.vivienda] || VIVIENDAS.padres);
  function mudarse(s, id, R) {
    if (!VIVIENDAS[id] || propia(s)) return 'Ya vives en tu casa en propiedad.';
    if (id !== 'padres' && !s.contrato) return 'Primero necesitas un sueldo (contrato).';
    const V = VIVIENDAS[id], fianza = V.alquiler * 4;
    if (id !== 'padres' && s.p.dinero < fianza) return `La fianza y el primer mes son ${eur(fianza)}: tienes ${eur(s.p.dinero)}.`;
    const antes = s.vivienda || 'padres'; s.vivienda = id;
    if (id !== 'padres') {
      s.p.dinero -= fianza; s.acum.gastos += fianza;
      extracto(s, { ic: V.ic, titulo: `Te mudas: ${V.n}`, filas: [['Fianza (2 semanas de alquiler; la recuperas al irte)', -V.alquiler * 2], ['Primeras 2 semanas de alquiler', -V.alquiler * 2]], clausulas: [`Alquiler: ${eur(V.alquiler)}/semana`, `+${V.energia} de energía cada semana (descansas mejor)`].concat(V.marca ? ['Tu imagen mejora poco a poco (marca personal)'] : []) }, R);
      if (antes === 'padres') rel(s, 'madre', -3, 'Te fuiste de casa');
    } else if (antes !== 'padres') { const dev = VIVIENDAS[antes].alquiler * 2; s.p.dinero += dev; extracto(s, { ic: '🏠', titulo: 'Vuelves con tus padres', filas: [['Te devuelven la fianza', dev]] }, R); rel(s, 'madre', 4, 'Volviste a casa'); }
    P2.anotar(s, vivienda(s).ic, `Me mudo: ${vivienda(s).n}.`);
    return null;
  }

  // ---------- Ahorro: cuenta remunerada y fondo indexado ----------
  const AHORRO = { interesCuenta: 0.025, fondoMedia: 0.07, fondoVol: 0.16, comisionFondo: 0.005 };
  const ahorro = s => (s.ahorro && typeof s.ahorro === 'object' ? s.ahorro : (s.ahorro = { cuenta: 0, fondo: 0, aportadoFondo: 0, hist: [] }));
  const valorAhorro = s => (s.ahorro ? Math.round((s.ahorro.cuenta || 0) + (s.ahorro.fondo || 0)) : 0);
  function moverAhorro(s, tipo, importe) {
    const A = ahorro(s), x = Math.round(+importe || 0);
    if (!['cuenta', 'fondo'].includes(tipo) || !x) return 'Escribe un importe.';
    if (x > 0) { if (x > s.p.dinero) return `Solo tienes ${eur(s.p.dinero)}.`; s.p.dinero -= x; A[tipo] += x; if (tipo === 'fondo') A.aportadoFondo += x; }
    else { const y = Math.min(-x, Math.floor(A[tipo])); if (y <= 0) return 'No hay nada que sacar.'; A[tipo] -= y; s.p.dinero += y; if (tipo === 'fondo') A.aportadoFondo = Math.max(0, Math.round(A.aportadoFondo * (A.fondo / (A.fondo + y)))); }
    P2.tele(s, 'ahorro', { tipo, importe: x });
    return null;
  }
  // Rentabilidad semanal del fondo: media del 7 % anual, con altibajos (≈ 16 % de volatilidad), menos la comisión
  function rentaFondo(s, semana) {
    const u = k => azarFijo(s, `fondo|${semana}|${k}`), z = (u(1) + u(2) + u(3) + u(4) - 2) * Math.sqrt(3);
    return (AHORRO.fondoMedia - AHORRO.comisionFondo) / 52 + z * AHORRO.fondoVol / Math.sqrt(52);
  }

  // ---------- La semana del dinero (la llama 09_semana) ----------
  function semanaDinero(s, R) {
    // Vivienda: alquiler y descanso
    const V = vivienda(s);
    if (V.alquiler && (s.fase === 'club' || s.fase === 'amateur' || s.fase === 'retirado')) { s.p.dinero -= V.alquiler; s.acum.gastos += V.alquiler; R.ingresos.push([`Alquiler (${V.n})`, -V.alquiler]); }
    if (V.energia) s.p.energia = clamp(s.p.energia + V.energia, 0, CFG.energia.max);
    if (V.marca && P2.sumarMarca) P2.sumarMarca(s, V.marca);
    // Agente: con una agencia grande, más clubes preguntan por ti
    const A = agenteDe(s);
    if (A && A.interes && s.fase === 'club') s.interes = clamp((s.interes || 0) + A.interes, 0, 100);
    // Ahorro
    if (s.ahorro) {
      const Ah = s.ahorro, int = Ah.cuenta * AHORRO.interesCuenta / 52;
      Ah.cuenta += int;
      const r = rentaFondo(s, s.semana); Ah.fondo = Math.max(0, Ah.fondo * (1 + r));
      Ah.hist = (Ah.hist || []).concat({ semana: s.semana, fondo: Math.round(Ah.fondo), cuenta: Math.round(Ah.cuenta) }).slice(-26);
      if (Ah.cuenta >= 1 || Ah.fondo >= 1) R.porque.push(`Ahorro: la cuenta da ${eur(int)} de intereses; el fondo ${r >= 0 ? 'sube' : 'baja'} un ${(Math.abs(r) * 100).toFixed(1).replace('.', ',')} % esta semana.`);
    }
    // Primer sueldo profesional
    if (s.contrato && !(P2.OFERTAS[s.contrato.oferta] || {}).amateur && !(s.hitosDin || {}).sueldo) marcaDinero(s, 'sueldo', '💶', `Tu primer sueldo como profesional: ${eur(Math.round(s.contrato.sueldo * (1 - IMP())))} netos.`, R);
    for (const [k, v, t] of HITOS_DIN) if (s.p.dinero + valorAhorro(s) >= v) marcaDinero(s, k, '💰', t, R);
  }
  const HITOS_DIN = [['m1', 1000, '¡Tus primeros 1.000 € ahorrados!'], ['m5', 5000, '5.000 € ahorrados: ya tienes un colchón de verdad.'], ['m10', 10000, '10.000 € en el banco. Hace nada tenías 150 €.'], ['m50', 50000, '50.000 € ahorrados. Tu familia no se lo cree.']];
  function marcaDinero(s, k, ic, t, R) {
    const H = s.hitosDin = s.hitosDin && typeof s.hitosDin === 'object' ? s.hitosDin : {};
    if (H[k]) return; H[k] = s.semana;
    R && R.lineas.push([ic, t, 'bien']);
    P2.anotar(s, ic, t);
    if (P2.recordar) P2.recordar(s, ic, t);
  }

  // ---------- Tu bolsillo: entradas y salidas de la semana ----------
  function gastosFijos(s) {
    const l = [];
    if (s.contrato && (s.fase === 'club' || s.fase === 'amateur')) l.push(['Gastos de vida', (P2.oferta(s) || {}).amateur ? 20 : Math.max(10, CFG.club.gastosVida - P2.efectoTienda(s, 'gastosVida'))]);
    const V = vivienda(s); if (V.alquiler && s.contrato) l.push([`Alquiler (${V.n})`, V.alquiler]);
    return l;
  }
  function ingresosFijos(s) {
    const l = [];
    if (s.contrato && (s.fase === 'club' || s.fase === 'amateur')) { const O = P2.oferta(s); l.push([O.amateur ? 'Dietas del club' : 'Sueldo neto', O.amateur ? s.contrato.sueldo : Math.round(s.contrato.sueldo * (1 - IMP()))]); }
    for (const c of s.patros || []) { const M = (P2.MARCAS || []).find(m => m.id === c.id); const b = c.semanal || (M && M.semanal) || 0; if (b) l.push([`Patrocinio ${M ? M.n : ''}`.trim(), Math.round(b * (1 - IMP()))]); }
    return l;
  }
  // Semanas que aguantas sin ingresos con tu dinero (y tu ahorro); null si no tienes gastos fijos
  function colchon(s) { const g = gastosFijos(s).reduce((a, x) => a + x[1], 0); return g > 0 ? Math.max(0, Math.floor((s.p.dinero + valorAhorro(s)) / g)) : null; }
  function cerrarBolsillo(s, R, din0) {
    const d = Math.round(s.p.dinero - din0), l = (R.ingresos || []).filter(x => x[1]);
    const conocido = l.reduce((a, x) => a + x[1], 0), otros = d - conocido;
    const movs = l.concat(Math.abs(otros) >= 1 ? [[otros >= 0 ? 'Otros ingresos (primas, premios…)' : 'Otros gastos', otros]] : []);
    const B = { semana: R.semana || s.semana - 1, entra: movs.filter(x => x[1] > 0).reduce((a, x) => a + x[1], 0), sale: -movs.filter(x => x[1] < 0).reduce((a, x) => a + x[1], 0), saldo: Math.round(s.p.dinero), movs: movs.map(([c, v]) => [c, Math.round(v)]) };
    s.bolsilloHist = (Array.isArray(s.bolsilloHist) ? s.bolsilloHist : []).concat({ semana: B.semana, entra: Math.round(B.entra), sale: Math.round(B.sale), saldo: B.saldo }).slice(-12);
    R.bolsillo = B;
    return B;
  }

  // ---------- Metas de dinero (las usa 19_experiencia) ----------
  P2.METAS_DINERO = [
    { id: 'campus', ic: '🎓', n: 'Ahorrar 400 € para el campus', hecho: s => (s.cont.campus || 0) > 0 || s.p.dinero >= 400, prog: s => clamp(s.p.dinero / 400, 0, 1), req: s => s.fase === 'barrio' && s.semana < 7 },
    { id: 'colchon', ic: '🛟', n: 'Tener un colchón de 8 semanas', hecho: s => (colchon(s) || 0) >= 8, prog: s => clamp((colchon(s) || 0) / 8, 0, 1), req: s => !!s.contrato },
  ];

  // ---------- Imprevistos: con colchón se pagan; sin él, se nota ----------
  const colTxt = s => { const c = colchon(s); return c == null ? `Tienes ${eur(s.p.dinero)}.` : `Tienes ${eur(s.p.dinero)} (aguantas ${c} ${c === 1 ? 'semana' : 'semanas'} sin ingresos).`; };
  const sinDinero = x => s => (s.p.dinero < x ? `Tienes ${eur(s.p.dinero)}` : null);
  const pagar = (s, x, R) => { s.p.dinero -= x; s.acum.gastos += x; };
  const IMPREVISTOS = [
    { id: 'movilRoto', fases: ['barrio', 'pruebas', 'amateur', 'club'], enfria: 30, peso: () => 0.6, ic: '📱', titulo: 'Se te rompe el móvil',
      texto: s => `Pantalla rota y no enciende. Reparación: 120 €. ${colTxt(s)}`,
      ops: [
        { id: 'pagar', n: 'Repararlo (120 €)', ventaja: 'Asunto resuelto', coste: '−120 €', riesgo: 'Ninguno', tags: ['seguro'], bloqueo: sinDinero(120), fx: s => { pagar(s, 120); return 'Móvil como nuevo. El colchón está para esto.'; } },
        { id: 'padres', n: 'Que te lo adelanten tus padres', ventaja: 'No tocas tu dinero ahora', coste: 'Les devuelves 130 € en 4 semanas', riesgo: 'Si no tienes, se enfadan', tags: ['dinero'], fx: s => { prog(s, 4, 'devolverMovil', { x: 130 }); rel(s, 'padre', -1, 'Te adelantó el móvil'); return 'Tu padre paga… y apunta en un papel lo que le debes.'; } },
        { id: 'viejo', n: 'Apañarte con el móvil viejo', ventaja: 'Gratis', coste: '−6 energía: te pierdes planes y mensajes', riesgo: 'Ninguno', tags: ['deporte'], fx: s => { s.p.energia = clamp(s.p.energia - 6, 0, 100); return 'Va lento y se apaga solo. Te enteras tarde de todo.'; } },
      ] },
    { id: 'multa', fases: ['barrio', 'pruebas', 'amateur', 'club'], enfria: 30, peso: () => 0.5, ic: '🛴', titulo: 'Multa del patinete',
      texto: s => `Ibas por la acera y te ponen una multa de 80 €. Si pagas en 20 días, es la mitad. ${colTxt(s)}`,
      ops: [
        { id: 'pronto', n: 'Pagar ya con descuento (40 €)', ventaja: 'Te ahorras 40 €', coste: '−40 €', riesgo: 'Ninguno', tags: ['seguro'], bloqueo: sinDinero(40), fx: s => { pagar(s, 40); return 'Pagada. Lección aprendida.'; } },
        { id: 'recurrir', n: 'Recurrirla', ventaja: 'Puede que la anulen', coste: 'Si no, pagas 80 € más 20 € de recargo', riesgo: 'Pierdes el descuento', tags: ['riesgo'], fx: s => { prog(s, 3, 'multaResuelta', {}); return 'Presentas el recurso. En unas semanas sabrás algo.'; } },
      ] },
    { id: 'facturaCasa', fases: ['barrio', 'pruebas', 'amateur', 'club'], enfria: 26, cond: s => (s.vivienda || 'padres') === 'padres' && !propia(s), peso: () => 0.6, ic: '💡', titulo: 'Factura de la luz en casa',
      texto: s => `Ha llegado una factura de 180 € y en casa van justos. ${nombre(s, 'padre')} no te pide nada, pero lo ves preocupado. ${colTxt(s)}`,
      ops: [
        { id: 'mitad', n: 'Pagar la mitad (90 €)', ventaja: '+6 con tus padres', coste: '−90 €', riesgo: 'Ninguno', tags: ['seguro'], bloqueo: sinDinero(90), fx: s => { pagar(s, 90); rel(s, 'padre', 6, 'Pagaste la mitad de la luz'); rel(s, 'madre', 4, 'Ayudaste en casa'); return 'Tu padre te da un abrazo sin decir nada.'; } },
        { id: 'no', n: 'Ahora no puedo', ventaja: 'Guardas tu dinero', coste: '−3 con tus padres', riesgo: 'Ninguno', tags: ['dinero'], fx: s => { rel(s, 'padre', -3, 'No ayudaste con la luz'); return '«No pasa nada», dice. Pero pasa un poco.'; } },
      ] },
    { id: 'dentista', fases: ['barrio', 'pruebas', 'amateur', 'club'], enfria: 40, peso: () => 0.4, ic: '🦷', titulo: 'Te duele una muela',
      texto: s => `El dentista dice que hay que empastar: 220 €. ${colTxt(s)}`,
      ops: [
        { id: 'pagar', n: 'Ir ya (220 €)', ventaja: 'Sin dolor', coste: '−220 €', riesgo: 'Ninguno', tags: ['seguro'], bloqueo: sinDinero(220), fx: s => { pagar(s, 220); return 'Un mal rato y listo.'; } },
        { id: 'aplazar', n: 'Aguantar y aplazarlo', ventaja: 'No pagas ahora', coste: '−10 energía', riesgo: 'En 3 semanas, peor: endodoncia de 380 €', tags: ['dinero', 'riesgo'], fx: s => { s.p.energia = clamp(s.p.energia - 10, 0, 100); prog(s, 3, 'muelaPeor', {}); return 'Ibuprofeno y a seguir.'; } },
      ] },
  ];

  // ---------- Decisiones con precio en el club ----------
  const enClub = s => s.fase === 'club' && !!s.contrato;
  const CLUB = [
    { id: 'fisioPrivado', fases: ['club'], enfria: 10, cond: s => enClub(s) && s.p.lesion >= 2, peso: () => 2.5, ic: '🩺', titulo: 'Un fisio privado para tu lesión',
      texto: s => `El fisio del club te ve una vez por semana. Uno privado, cada día: 300 €. ${colTxt(s)}`,
      ops: [
        { id: 'pagar', n: 'Pagar el fisio privado (300 €)', ventaja: 'Vuelves una semana antes', coste: '−300 €', riesgo: 'Ninguno', tags: ['deporte'], bloqueo: sinDinero(300), fx: s => { pagar(s, 300); s.p.lesion = Math.max(0, s.p.lesion - 1); return 'Sesiones diarias. Te recuperas antes de lo previsto.'; } },
        { id: 'no', n: 'Seguir con el del club', ventaja: 'Gratis', coste: 'Tardas lo normal', riesgo: 'Ninguno', tags: ['seguro', 'dinero'], fx: () => 'Paciencia.' },
      ] },
    { id: 'nutricionista', fases: ['club'], enfria: 30, unaVez: false, cond: s => enClub(s) && s.semana - (s.contrato.desde || 0) >= 5, peso: () => 0.7, ic: '🥗', titulo: 'Un nutricionista deportivo',
      texto: s => `Un nutricionista te ofrece un plan de 4 semanas: 250 €. Dice que notarás la energía. ${colTxt(s)}`,
      ops: [
        { id: 'pagar', n: 'Contratarlo (250 €)', ventaja: '+12 energía ahora y +8 dentro de 2 semanas', coste: '−250 €', riesgo: 'Ninguno', tags: ['deporte'], bloqueo: sinDinero(250), fx: s => { pagar(s, 250); s.p.energia = clamp(s.p.energia + 12, 0, CFG.energia.max); prog(s, 2, 'nutriPlan', {}); return 'Comes mejor y descansas mejor.'; } },
        { id: 'no', n: 'Comer como siempre', ventaja: 'Gratis', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro', 'dinero'], fx: () => 'Macarrones, como siempre.' },
      ] },
    { id: 'cenaEquipo', fases: ['club'], enfria: 20, cond: s => enClub(s) && (s.temporada || {}).jornada >= 3, peso: () => 0.8, ic: '🍽️', titulo: 'Cena de equipo',
      texto: s => `Hay cena del vestuario. Los veteranos esperan que el nuevo invite a una ronda (180 €). ${colTxt(s)}`,
      ops: [
        { id: 'invitar', n: 'Invitar a la ronda (180 €)', ventaja: '+4 confianza del míster: el vestuario te adopta', coste: '−180 €', riesgo: 'Ninguno', tags: ['deporte'], bloqueo: sinDinero(180), fx: s => { pagar(s, 180); s.confianza = clamp(s.confianza + 4, 0, 100); return 'Brindis por ti. Ya eres uno más.'; } },
        { id: 'loTuyo', n: 'Ir y pagar lo tuyo (30 €)', ventaja: 'Estás sin gastar de más', coste: '−30 €', riesgo: 'Ninguno', tags: ['seguro', 'dinero'], bloqueo: sinDinero(30), fx: s => { pagar(s, 30); return 'Cenas, ríes y a casa.'; } },
        { id: 'no', n: 'No ir', ventaja: 'Gratis', coste: '−2 confianza del míster', riesgo: 'Ninguno', tags: [], fx: s => { s.confianza = clamp(s.confianza - 2, 0, 100); return 'Al día siguiente, chistes que no entiendes.'; } },
      ] },
    { id: 'multaClub', fases: ['club'], enfria: 30, cond: enClub, peso: () => 0.5, ic: '⏰', titulo: 'Multa interna del club',
      texto: () => 'Llegas 10 minutos tarde al entrenamiento. El reglamento del vestuario dice: 150 € de multa.',
      ops: [
        { id: 'pagar', n: 'Pagarla sin rechistar (150 €)', ventaja: 'El míster valora que lo asumas (+1 confianza)', coste: '−150 €', riesgo: 'Ninguno', tags: ['seguro'], bloqueo: sinDinero(150), fx: s => { pagar(s, 150); s.confianza = clamp(s.confianza + 1, 0, 100); return 'Pagas. Va a la bolsa de la cena de fin de temporada.'; } },
        { id: 'discutir', n: 'Discutirla con el capitán', ventaja: 'No pagas', coste: '−4 confianza del míster', riesgo: 'Ninguno', tags: ['dinero'], fx: s => { s.confianza = clamp(s.confianza - 4, 0, 100); return 'Te la perdonan… pero se comenta.'; } },
      ] },
    { id: 'postMarca', fases: ['club'], enfria: 18, cond: s => enClub(s) && (s.p.marca || 0) >= 8, peso: () => 0.7, ic: '🤳', titulo: 'Una marca te paga por un post',
      texto: () => 'Una bebida energética te ofrece 400 € (brutos) por una publicación en redes. Al míster no le gustan estas cosas.',
      ops: [
        { id: 'aceptar', n: 'Aceptar (400 € brutos)', ventaja: `+${eur(Math.round(400 * 0.88))} netos y algo de marca personal`, coste: '−2 confianza del míster', riesgo: 'Ninguno', tags: ['dinero'], fx: (s, n, R) => { const x = Math.round(400 * (1 - IMP())); s.p.dinero += x; s.acum.patrocinio += x; s.acum.impuestos += 400 - x; s.confianza = clamp(s.confianza - 2, 0, 100); if (P2.sumarMarca) P2.sumarMarca(s, 0.5); extracto(s, { ic: '🤳', titulo: 'Publicación patrocinada', filas: [['Pago bruto', 400], [`Retención (${pct(IMP())})`, -(400 - x)]], clausulas: ['Una publicación y una historia', 'No puedes anunciar otra bebida en 3 meses'] }); return `Publicas. +${eur(x)} netos.`; } },
        { id: 'no', n: 'Rechazarlo', ventaja: 'El míster ni se entera', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro', 'deporte'], fx: () => 'Les das las gracias.' },
      ] },
    { id: 'inversionAmigo', fases: ['club'], unaVez: true, cond: s => enClub(s) && s.p.dinero >= 2500, peso: () => 0.6, ic: '🍔', titulo: 'Un compañero monta una hamburguesería',
      texto: s => `Busca socios: 2.000 € por un 5 % del negocio. «En un año lo has recuperado», dice. ${colTxt(s)}`,
      ops: [
        { id: 'invertir', n: 'Entrar de socio (2.000 €)', ventaja: 'Si va bien, recuperas más de lo que pones', coste: '−2.000 € ahora', riesgo: 'Muchos negocios nuevos cierran: puedes perder casi todo', tags: ['riesgo'], bloqueo: sinDinero(2000), fx: s => { pagar(s, 2000); prog(s, 10, 'hamburgueseria', {}); P2.anotar(s, '🍔', 'Invierto 2.000 € en la hamburguesería de un compañero.'); return 'Firmáis en una servilleta… y luego en el notario.'; } },
        { id: 'no', n: 'Desearle suerte', ventaja: 'Tu dinero, seguro', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro', 'dinero', 'deporte'], fx: () => '«Tú te lo pierdes», bromea.' },
      ] },
    { id: 'agenteRival', fases: ['club'], unaVez: true, cond: s => enClub(s) && s.agente && s.semana - (s.agenteDesde || s.hitos.titular || 0) >= 14, peso: () => 1,
      ic: '📞', titulo: 'Otra agencia te quiere',
      texto: s => { const A = agenteDe(s); return A.id === 'elite' ? `${AGENTES.toni.n} te ofrece salir de ${A.n} y llevarte por menos comisión.${penalAgente(s) ? ` Romper ahora cuesta ${eur(penalAgente(s))} (exclusividad).` : ''}` : `${AGENTES.elite.n} te ofrece ${eur(AGENTES.elite.adelanto)} de adelanto si te vas con ellos.${penalAgente(s) ? ` Romper con tu agente cuesta ${eur(penalAgente(s))}.` : ''}`; },
      ops: [
        { id: 'cambiar', n: 'Cambiar de agencia', ventaja: 'Nuevas condiciones (mira el desglose)', coste: 'Si hay exclusividad, pagas la penalización', riesgo: 'Tu agente actual no lo olvidará', tags: ['dinero'],
          bloqueo: s => { const p = penalAgente(s); return p && s.p.dinero < p ? `Romper cuesta ${eur(p)}` : null; },
          fx: s => { const A0 = agenteDe(s), id = A0.id === 'elite' ? 'toni' : 'elite'; const e = cambiarAgente(s, id); if (e) return e; if (A0.id === 'sonia') rel(s, 'sonia', -20, 'La dejaste por otra agencia'); return `Ahora te lleva ${AGENTES[id].n}.`; } },
        { id: 'quedarse', n: 'Quedarte con tu agente', ventaja: 'Fidelidad: tu agente lo agradece', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro', 'deporte'], fx: s => { if (agenteDe(s).id === 'sonia') rel(s, 'sonia', 8, 'Le fuiste fiel'); return 'Cuelgas. Tu agente se entera y te llama para darte las gracias.'; } },
      ] },
  ];
  // Préstamo a un compañero (relación)
  const PRESTAMO = { id: 'prestamoIker', ambito: 'relacion', rel: 'iker', fases: ['club'], unaVez: true, cond: s => enClub(s) && s.p.dinero >= 700, peso: () => 1.2, ic: '🤝', titulo: 'Iker te pide dinero',
    texto: s => `${nombre(s, 'iker')} tiene un problema con el alquiler: te pide 500 € y te los devuelve «en mes y medio». ${colTxt(s)}`,
    ops: [
      { id: 'prestar', n: 'Prestárselos (500 €)', ventaja: '+10 con Iker', coste: '−500 € ahora', riesgo: 'Puede que no te los devuelva todos', tags: ['deporte'], bloqueo: sinDinero(500), fx: s => { pagar(s, 500); rel(s, 'iker', 10, 'Le prestaste 500 €'); prog(s, 6, 'ikerDevuelve', { x: 500 }); return '«Te debo una, de verdad.»'; } },
      { id: 'no', n: 'Decirle que no', ventaja: 'Tu dinero, seguro', coste: '−6 con Iker', riesgo: 'Ninguno', tags: ['seguro', 'dinero'], fx: s => { rel(s, 'iker', -6, 'No le prestaste dinero'); return 'Lo entiende… o eso dice.'; } },
    ] };

  const ultimoImprevisto = s => Math.max(-99, ...IMPREVISTOS.map(x => s.sucesosVistos[x.id] ?? -99));
  for (const E of IMPREVISTOS) { const c = E.cond || (() => true); E.cond = s => s.semana >= 5 && s.semana - ultimoImprevisto(s) >= 8 && c(s); }
  for (const E of IMPREVISTOS.concat(CLUB)) P2.SUCESOS.push(Object.assign({ ambito: 'carrera', cond: () => true }, E, { tags: ['dinero'] }));
  P2.SUCESOS.push(PRESTAMO);
  // Vivienda: al poco de tener sueldo, la gran pregunta
  P2.SUCESOS.push({ id: 'independizarse', ambito: 'carrera', fases: ['club'], unaVez: true, cond: s => enClub(s) && !propia(s) && (s.vivienda || 'padres') === 'padres' && s.semana - (s.contrato.desde || 0) >= 6, peso: () => 2, ic: '🔑', titulo: '¿Te independizas?',
    texto: s => `Con tu sueldo ya podrías vivir solo/a. ${colTxt(s)} Al mudarte pagas fianza y el primer mes.`,
    ops: [
      { id: 'quedarse', n: 'Seguir con tus padres', ventaja: 'Sin alquiler: ahorras más', coste: 'Poca intimidad', riesgo: 'Ninguno', tags: ['seguro', 'dinero'], fx: s => { rel(s, 'madre', 3, 'Te quedaste en casa'); return 'Tu madre, encantada. Tu cuarto, igual de pequeño.'; } },
      { id: 'compartido', n: `Piso compartido (${eur(VIVIENDAS.compartido.alquiler)}/semana)`, ventaja: `+${VIVIENDAS.compartido.energia} energía cada semana`, coste: `Fianza y primer mes: ${eur(VIVIENDAS.compartido.alquiler * 4)}`, riesgo: 'Compañeros de piso…', tags: ['deporte'], bloqueo: sinDinero(VIVIENDAS.compartido.alquiler * 4), fx: s => mudarse(s, 'compartido') || 'Nuevas llaves, nueva vida.' },
      { id: 'alquiler', n: `Tu propio piso (${eur(VIVIENDAS.alquiler.alquiler)}/semana)`, ventaja: `+${VIVIENDAS.alquiler.energia} energía cada semana y mejor imagen`, coste: `Fianza y primer mes: ${eur(VIVIENDAS.alquiler.alquiler * 4)}`, riesgo: 'Un gasto fijo alto', tags: ['riesgo'], bloqueo: sinDinero(VIVIENDAS.alquiler.alquiler * 4), fx: s => mudarse(s, 'alquiler') || 'Tu casa. Tus normas.' },
    ] });
  // Despido en el trabajo del barrio
  P2.SUCESOS.push({ id: 'despido', ambito: 'carrera', fases: ['barrio', 'pruebas', 'amateur'], enfria: 12, cond: s => !!s.empleo && s.empleo.semanas >= 3 && s.semana - (s.empleo.ult || 0) <= 2, peso: () => 1.4, ic: '📉', titulo: 'Te despiden',
    texto: s => `${s.empleo.empresa} recorta personal y tú eres de los últimos en llegar. Te dan la carta de despido y el finiquito para firmar.`,
    ops: [
      { id: 'firmar', n: 'Firmar el finiquito', ventaja: 'Cobras ya', coste: 'Pierdes el trabajo (podrás buscar otro)', riesgo: 'Ninguno', tags: ['seguro', 'dinero'], fx: s => { const x = dejarEmpleo(s, 'despido'); return `Firmas «recibí, no conforme». +${eur(x)}.`; } },
      { id: 'revisar', n: 'Que lo revise un abogado laboralista (40 €)', ventaja: 'Si falta algo, lo reclamas', coste: '−40 €', riesgo: 'Puede que esté todo bien', tags: ['riesgo'], bloqueo: sinDinero(40),
        fx: s => { pagar(s, 40); const extra = azarFijo(s, 'abogado') < 0.6 ? Math.round(s.empleo.cobrado * 0.08) + 40 : 0; const x = dejarEmpleo(s, 'despido'); if (extra) { s.p.dinero += extra; extracto(s, { ic: '⚖️', titulo: 'Reclamación al finiquito', filas: [['Horas extra que no te pagaron', extra], ['Abogado', -40]] }); return `El abogado encuentra horas extra sin pagar: +${eur(extra)} además del finiquito (${eur(x)}).`; } return `Estaba todo bien. Finiquito: +${eur(x)} (menos los 40 € del abogado).`; } },
    ] });

  Object.assign(P2.EFECTOS, {
    devolverMovil: (s, d) => { if (s.p.dinero >= d.x) { s.p.dinero -= d.x; rel(s, 'padre', 2, 'Le devolviste lo del móvil'); return ['👨', `Devuelves a tu padre los ${eur(d.x)} del móvil.`]; } rel(s, 'padre', -4, 'No le devolviste lo del móvil'); return ['👨', `No tienes los ${eur(d.x)} del móvil. Tu padre no dice nada… pero lo apunta.`, 'mal']; },
    multaResuelta: s => { if (azarFijo(s, 'multa|' + s.semana) < 0.4) return ['🛴', 'Te anulan la multa del patinete. ¡Bien recurrido!', 'bien']; s.p.dinero -= 100; s.acum.gastos += 100; return ['🛴', 'Recurso desestimado: pagas 80 € más 20 € de recargo (−100 €).', 'mal']; },
    muelaPeor: s => { s.p.dinero -= 380; s.acum.gastos += 380; return ['🦷', 'La muela ha ido a peor: endodoncia, −380 €. Aplazarlo salió caro.', 'mal']; },
    nutriPlan: s => { s.p.energia = clamp(s.p.energia + 8, 0, CFG.energia.max); return ['🥗', 'El plan del nutricionista se nota: +8 de energía.', 'bien']; },
    hamburgueseria: s => {
      if (azarFijo(s, 'hamburguesa') < 0.55) { s.p.dinero += 2600; return ['🍔', 'La hamburguesería funciona: tu compañero te compra tu parte por 2.600 € (+600 € de beneficio).', 'bien']; }
      s.p.dinero += 500; return ['🍔', 'La hamburguesería cierra. Del material vendido te tocan 500 € (pierdes 1.500 €).', 'mal'];
    },
    ikerDevuelve: (s, d) => { if (P2.valorRel(s, 'iker') >= 50) { s.p.dinero += d.x; return ['🤝', `Iker te devuelve los ${eur(d.x)}. Y te invita a comer.`, 'bien']; } const y = Math.round(d.x * 0.6); s.p.dinero += y; return ['🤝', `Iker te devuelve ${eur(y)} de ${eur(d.x)}. «El resto, más adelante.»`, 'mal']; },
  });

  // Renovación: más sueldo cada semana… o cobrar por adelantado
  function variantePrima(s, r) {
    if (!r || !s.contrato) return null;
    const sem = semanasTemporada(s, (s.temporada || {}).liga) * r.temporadas, dif = Math.max(0, r.sueldo - s.contrato.sueldo);
    const prima = Math.round(r.prima + dif * sem * 0.75);
    return { id: 'renovarPrima', n: `Renovar cobrando por adelantado`, sueldo: s.contrato.sueldo, prima, temporadas: r.temporadas };
  }

  Object.assign(P2, { AGENTES, agenteDe, comisionFichaje, mejoraRenov, elegirAgente, cambiarAgente, penalAgente, extracto, desgloseContrato, desgloseOferta, contratoDeOferta, semanasTemporada,
    registrarTrabajo, cobroTrabajo, finiquito, dejarEmpleo, VIVIENDAS, vivienda, mudarse, AHORRO, ahorro, valorAhorro, moverAhorro, rentaFondo, semanaDinero, gastosFijos, ingresosFijos, colchon, cerrarBolsillo, variantePrima });
})(globalThis.P2 = globalThis.P2 || {});
