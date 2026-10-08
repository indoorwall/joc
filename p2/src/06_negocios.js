/* =====================================================================
   06 · NEGOCIOS: caja separada del dinero personal, demanda con contexto,
   fama que sigue a la calidad real, crisis de liquidez y valoración por
   beneficio. Genérico por tipo (datos en NEGOCIOS); en P2 solo la peluquería.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, NEGOCIOS, rnd, clamp, r1, entre, eur } = P2;

  let seq = 0;
  function nuevoNegocio(tipo, caja) {
    const T = NEGOCIOS[tipo], C = T.configInicial || {};
    return {
      id: 'n' + Date.now().toString(36) + (seq++), tipo, caja: Math.round(caja || 0), fama: T.famaInicial,
      precio: C.precio || 'normal', sueldo: C.sueldo || 'normal', empleados: C.empleados || 2, marketing: C.marketing || 'nada', alquiler: T.alquiler, local: false,
      deuda: 0, cuota: 0, interes: 0, moral: 1, estrella: false,
      hist: T.historialVendedor.slice(), semanas: 0, rachaPos: 0, rachaNeg: 0, crisis: false,
      ctx: { competidor: 0, temporadaAlta: 0, averia: 0, influencer: 0 },
      ultimo: null, comprado: null, invertido: 0,
      fianza: 0, mejora: { capacidad: 0, famaObjetivo: 0 }, mejoraInicial: null, hipoteca: null, valorLocal: 0,
    };
  }
  const tipoDe = n => NEGOCIOS[n.tipo];

  // Lo que pasaría con una configuración (sin azar): sirve para la semana y para el simulador de balance
  function calcularSemana(s, n, opc = {}) {
    const T = tipoDe(n), pr = T.precios[n.precio], su = T.sueldos[n.sueldo], mk = T.marketing[n.marketing], c = n.ctx;
    const calidad = su.calidad * n.moral * (opc.gestion ? 1.08 : 1) * (c.averia > 0 ? 0.9 : 1) * (n.estrella ? 1.08 : 1);
    const mj = n.mejora || {};
    const capacidad = Math.round(n.empleados * T.capacidadEmpleado * (su.capacidad || 1) * (1 + (mj.capacidad || 0)) * (c.averia > 0 ? 0.75 : 1));   // con sueldo bajo se trabaja con menos ganas
    const comp = c.competidor ? Math.min(1, pr.competidor + (calidad >= 1.15 ? 0.06 : 0)) : 1;
    // Tu marca personal atrae clientes (no tu nivel ni tu reputación deportiva); un patrocinador local manda clientes del barrio
    const famaJugador = (1 + (s && s.p ? s.p.marca || 0 : 0) / 250) * (1 + (s ? P2.efectoPatro(s, 'clientesNegocio') : 0));
    const demanda = T.demandaBase * (0.4 + n.fama / 100) * pr.demanda * mk.demanda * comp * (c.temporadaAlta > 0 ? 1.4 : 1) * (c.influencer > 0 ? 1.25 : 1) * famaJugador * (opc.azar || 1) * (opc.gestion ? 1.05 : 1);
    const clientes = Math.round(Math.min(demanda, capacidad));
    const colas = Math.max(0, demanda - capacidad);
    // La primera semana con el nuevo dueño la clientela desconfía
    const ingresos = Math.round(clientes * pr.valor * (n.semanas === 0 && T.arranque && !opc.sinArranque ? T.arranque.primeraSemana : 1));
    const intereses = Math.round(n.deuda * n.interes) + (n.hipoteca ? Math.round(n.hipoteca.deuda * n.hipoteca.interes) : 0);
    const costes = {
      alquiler: n.local ? 0 : n.alquiler, fijos: Math.max(0, T.fijos - (s ? P2.efectoPatro(s, 'fijosNegocio') : 0)), personal: n.empleados * su.coste, marketing: mk.coste,
      material: Math.round(clientes * T.consumoCliente), intereses,
    };
    const totalCostes = Object.values(costes).reduce((a, b) => a + b, 0);
    const justo = n.precio === 'caro' && calidad >= 1.15 ? 1 : pr.justo;
    const famaObjetivo = clamp(20 + 50 * calidad * justo + mk.fama + (mj.famaObjetivo || 0) - (colas / Math.max(1, capacidad) > 0.15 ? 12 : 0), 0, 100);
    return { calidad: r1(calidad), capacidad, demanda: Math.round(demanda), clientes, colas: Math.round(colas), ingresos, costes, totalCostes, beneficio: Math.round(ingresos - totalCostes), famaObjetivo: Math.round(famaObjetivo), comp };
  }

  function semanaNegocio(s, n, R, opc = {}) {
    const T = tipoDe(n), K = CFG.empresa;
    const x = calcularSemana(s, n, { gestion: opc.gestion, azar: entre(s, 0.92, 1.08) });
    n.caja += x.beneficio;
    // Préstamo: la parte de devolución sale de la caja pero no es «coste»
    if (n.deuda > 0) { const dev = Math.min(n.deuda, n.cuota); n.caja -= dev; n.deuda = Math.max(0, Math.round(n.deuda - dev)); if (!n.deuda) n.cuota = 0; }
    if (n.hipoteca && n.hipoteca.deuda > 0) { const H = n.hipoteca, dev = Math.min(H.deuda, H.cuota); n.caja -= dev; H.deuda = Math.max(0, Math.round(H.deuda - dev)); }
    if (n.local && n.valorLocal) n.valorLocal = Math.round(n.valorLocal * (1 + (P2.OPORTUNIDADES.find(o => o.id === 'local').revaloriza || 0)));
    // Puesta en marcha: pequeñas reparaciones en la segunda semana y la opción de invertir en el local
    if (n.semanas === 1 && T.arranque && T.arranque.reparaciones && !n.sinArranque) { n.caja -= T.arranque.reparaciones; R.lineas.push([T.ic, `Puesta en marcha: pequeñas reparaciones (−${eur(T.arranque.reparaciones)} de caja).`]); }
    if (n.semanas === 0 && T.mejorasIniciales && !n.mejoraInicial && !n.sinArranque) P2.encolar(s, { tipo: 'mejoraInicial', neg: n.id });
    n.fama = r1(clamp(n.fama + (x.famaObjetivo - n.fama) * 0.15, 0, 100));
    n.semanas++;
    n.hist.push(x.beneficio); if (n.hist.length > 12) n.hist.shift();
    if (x.beneficio > 0) { n.rachaPos++; n.rachaNeg = 0; } else { n.rachaNeg++; n.rachaPos = 0; }
    for (const k of Object.keys(n.ctx)) if (n.ctx[k] > 0 && n.ctx[k] < 99) n.ctx[k]--;
    // Con sueldo bajo la gente se va
    let fuga = '';
    if (n.empleados > 1 && rnd(s) < T.sueldos[n.sueldo].fuga) { n.empleados--; n.moral = r1(clamp(n.moral - 0.08, 0.7, 1.1)); fuga = ' Un empleado se va por el sueldo.'; }
    if (opc.gestion) n.moral = r1(clamp(n.moral + 0.03, 0.7, 1.1));
    n.ultimo = Object.assign(x, { semana: s.semana, fuga });
    R.lineas.push([T.ic, `${T.n}: ${x.clientes} clientes · ${x.beneficio >= 0 ? 'beneficio' : 'pérdidas'} ${eur(x.beneficio)} · caja ${eur(n.caja)}.${x.colas > 5 ? ` ${x.colas} clientes se van por las colas.` : ''}${fuga}`, x.beneficio >= 0 ? 'bien' : 'mal']);
    R.porque.push(`${T.n}: demanda ${x.demanda} (fama ${Math.round(n.fama)}, precio ${T.precios[n.precio].n.toLowerCase()}${n.ctx.competidor ? ', competidor' : ''}${n.ctx.temporadaAlta ? ', temporada alta' : ''}${n.ctx.influencer ? ', influencer' : ''}) frente a capacidad ${x.capacidad} (${n.empleados} empleados). Ingresos ${eur(x.ingresos)} − costes ${eur(x.totalCostes)} (${Object.entries(x.costes).filter(([, v]) => v).map(([k, v]) => `${k} ${eur(v)}`).join(', ')}). La fama tiende a ${x.famaObjetivo} (según la calidad real ${P2.nf(x.calidad)} y si el precio es justo).`);
    // Crisis de liquidez
    if (n.rachaPos >= 2) n.crisisSeguidas = 0;
    if (!n.crisis && (n.caja < 0 || (n.rachaNeg >= K.crisisSemanasNegativas && n.caja < 800))) {
      n.crisis = true; n.crisisSeguidas = (n.crisisSeguidas || 0) + 1;
      P2.tele(s, 'crisis', {});
      P2.encolar(s, { tipo: 'crisis', neg: n.id });
    }
    if (n.rachaPos >= K.semanasRentable) P2.conseguirHito(s, 'rentable', R);
  }

  // Lo que sale de la caja nada más comprar: fianza del local (se recupera al vender) y stock
  function ponerEnMarcha(n, R) {
    const A = tipoDe(n).arranque; if (!A) return;
    n.caja -= A.fianza + A.stock; n.fianza = A.fianza;
    if (R && R.lineas) R.lineas.push([tipoDe(n).ic, `Puesta en marcha: fianza del local ${eur(A.fianza)} y stock ${eur(A.stock)} salen de la caja.`]);
  }
  function aplicarMejoraInicial(s, n, id) {
    const T = tipoDe(n), M = (T.mejorasIniciales || []).find(m => m.id === id);
    if (!M || n.mejoraInicial || n.caja < M.coste) return false;
    n.caja -= M.coste; n.mejoraInicial = id; n.invertido += M.coste;
    P2.tele(s, 'mejora', { id });
    if (M.ef.capacidad) n.mejora.capacidad = (n.mejora.capacidad || 0) + M.ef.capacidad;
    if (M.ef.famaObjetivo) n.mejora.famaObjetivo = (n.mejora.famaObjetivo || 0) + M.ef.famaObjetivo;
    if (M.ef.fama) n.fama = r1(clamp(n.fama + M.ef.fama, 0, 100));
    return true;
  }

  // ---- Participación en la cafetería: pasiva, con resultados inciertos ----
  function nuevaParticipacion(s, coste) { return { inversion: coste, valor: coste, estado: 'normal', hist: [], dividendos: 0, aportado: coste, desde: s.semana, proximo: s.semana + P2.SOCIO.trimestre }; }
  function semanaSocio(s, R) {
    const p = s.socio, K = P2.SOCIO;
    if (!p || p.vendida || s.semana < p.proximo) return;
    p.proximo = s.semana + K.trimestre;
    const tr = K.transicion[p.estado] || K.transicion.normal;
    let u = rnd(s), est = 'normal';
    for (const [k, w] of Object.entries(tr)) { u -= w; if (u <= 0) { est = k; break; } }
    const E = K.estados[est];
    p.estado = est;
    const div = Math.round(p.valor * E.dividendo);
    p.valor = Math.max(0, Math.round(p.valor * (1 + E.valor)));
    if (div) { s.p.dinero += div; p.dividendos += div; }
    p.hist.push({ semana: s.semana, estado: est, dividendo: div, valor: p.valor }); if (p.hist.length > 10) p.hist.shift();
    R.lineas.push([E.ic, `Cafetería (tu participación): ${E.n.toLowerCase()}. ${div ? `Dividendo: +${eur(div)}.` : 'Sin dividendo este trimestre.'} Tu parte vale ${eur(p.valor)}.`, div ? 'bien' : E.valor < 0 ? 'mal' : '']);
    if (div) R.ingresos.push(['Dividendo de la cafetería', div]);
    if (E.ampliacion && rnd(s) < E.ampliacion) P2.encolar(s, { tipo: 'socioCapital', importe: Math.round(p.inversion * K.ampliacion) });
    else if (rnd(s) < K.ofertaProb) P2.encolar(s, { tipo: 'socioOferta', precio: Math.round(p.valor * entre(s, K.oferta[0], K.oferta[1]) / 50) * 50 });
  }

  function beneficioMedio(n, k = CFG.empresa.valoracion.semanasMedia) { const l = n.hist.slice(-k); return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0; }
  // Valor = beneficio medio reciente × múltiplo + caja + fama − deuda (+ el local, si es tuyo)
  function valorNegocio(n) {
    const V = CFG.empresa.valoracion;
    const local = n.local ? (n.valorLocal || 0) - (n.hipoteca ? n.hipoteca.deuda : 0) : 0;
    const v = beneficioMedio(n) * V.multiplo + Math.max(0, n.caja) + (n.fianza || 0) + n.fama * V.porFama - n.deuda + local;
    return Math.round(Math.max(V.minimo, v) / 100) * 100;
  }

  // ---- Movimientos explícitos entre tu cuenta y la caja ----
  function aportar(s, id, x) {
    const n = s.negocios.find(z => z.id === id); x = Math.round(x);
    if (!n || !(x > 0) || s.p.dinero < x) return false;
    s.p.dinero -= x; n.caja += x; s.acum.aportado += x; n.invertido += x;
    if (n.crisis && n.caja >= 0) n.crisis = false;
    P2.tele(s, 'aporte', {});
    return true;
  }
  function retirar(s, id, x) {
    const n = s.negocios.find(z => z.id === id); x = Math.round(x);
    if (!n || !(x > 0) || n.caja < x) return false;
    n.caja -= x; s.p.dinero += x; s.acum.retirado += x;
    P2.tele(s, 'retirada', {});
    return true;
  }
  function configurar(s, id, campo, valor) {
    const n = s.negocios.find(z => z.id === id), T = n && tipoDe(n);
    if (!n) return false;
    if (campo === 'empleados') { const v = clamp(Math.round(valor), 1, T.empleadosMax); if (v === n.empleados) return false; if (v > n.empleados) n.moral = r1(clamp(n.moral - 0.02, 0.7, 1.1)); n.empleados = v; P2.tele(s, 'config', { campo }); return true; }
    const tabla = { precio: T.precios, sueldo: T.sueldos, marketing: T.marketing }[campo];
    if (!tabla || !tabla[valor]) return false;
    if (campo === 'sueldo' && T.sueldos[valor].coste < T.sueldos[n.sueldo].coste) n.moral = r1(clamp(n.moral - 0.1, 0.7, 1.1));
    if (n[campo] !== valor) P2.tele(s, 'config', { campo });
    n[campo] = valor;
    return true;
  }
  function pedirPrestamo(s, id, interes) {
    const n = s.negocios.find(z => z.id === id), K = CFG.empresa.prestamo;
    if (!n || n.deuda > 0) return false;
    n.caja += K.importe; n.deuda = K.importe; n.interes = (interes || K.interesSemanal) * (1 - P2.efectoPatro(s, 'interesFinanciacion')); n.cuota = Math.ceil(K.importe / K.plazo);
    P2.tele(s, 'prestamo', {});
    if (n.crisis && n.caja >= 0) n.crisis = false;
    return true;
  }
  function venderNegocio(s, id, factor = 1) {
    const n = s.negocios.find(z => z.id === id);
    if (!n) return 0;
    const v = Math.round(valorNegocio(n) * factor);
    s.p.dinero += v; s.negocios = s.negocios.filter(z => z !== n);
    P2.anotar(s, '🤝', `Vendo la ${tipoDe(n).n.toLowerCase()} por ${eur(v)}.`);
    P2.tele(s, 'venta', {});
    return v;
  }

  // ---- Comprar (traspaso + caja inicial: más caja = más margen, pero tardas más en reunirla) ----
  // descuento: el traspaso más barato que consigues por un contacto (Marc te presenta a Pilar)
  const traspasoPara = (s, tipo) => Math.max(0, NEGOCIOS[tipo].traspaso - ((s && !s.negocios.length && s.descuentoTraspaso) || 0));
  function capitalNecesario(tipo, i = 0, s) { const T = NEGOCIOS[tipo]; return traspasoPara(s, tipo) + T.cajas[i]; }
  function bloqueoCompra(s, tipo, i) {
    if (!P2.tieneHito(s, 'contrato')) return 'Primero, un contrato profesional.';
    if (!mercadoAbierto(s)) return 'Tu asesor aún no te ha enseñado ningún traspaso.';
    if (s.negocios.length && !s.oportunidad) return 'Primero, que tu primera empresa funcione.';
    if (s.p.dinero < capitalNecesario(tipo, i, s)) return `Necesitas ${eur(capitalNecesario(tipo, i, s))}.`;
    return null;
  }
  // El mercado de traspasos se abre con un patrocinador (tu asesor) o tras 10 partidos como profesional
  const mercadoAbierto = s => P2.tieneHito(s, 'patro') || (P2.tieneHito(s, 'contrato') && s.stats.jugados >= 10) || s.negocios.length > 0 || (!!s.contactoNegocio && P2.tieneHito(s, 'contrato'));
  function comprarNegocio(s, tipo, i, R) {
    if (bloqueoCompra(s, tipo, i)) return false;
    const T = NEGOCIOS[tipo], caja = T.cajas[i], traspaso = traspasoPara(s, tipo);
    s.p.dinero -= traspaso + caja; s.acum.aportado += caja; s.descuentoTraspaso = 0;
    const n = nuevoNegocio(tipo, caja);
    n.comprado = s.semana; n.invertido = traspaso + caja;
    ponerEnMarcha(n, R);
    s.negocios.push(n);
    P2.tele(s, 'empresa', { caja });
    P2.anotar(s, T.ic, `Compro una ${T.n.toLowerCase()}: traspaso ${eur(traspaso)} y ${eur(caja)} en caja (fianza y stock: −${eur((T.arranque || {}).fianza + (T.arranque || {}).stock || 0)}).`);
    P2.conseguirHito(s, 'empresa', R);
    return n;
  }

  Object.assign(P2, { ponerEnMarcha, aplicarMejoraInicial, nuevaParticipacion, semanaSocio, nuevoNegocio, calcularSemana, semanaNegocio, beneficioMedio, valorNegocio, aportar, retirar, configurar, pedirPrestamo, venderNegocio,
    capitalNecesario, traspasoPara, bloqueoCompra, comprarNegocio, mercadoAbierto, tipoDe });
})(globalThis.P2 = globalThis.P2 || {});
