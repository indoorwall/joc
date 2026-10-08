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
    };
  }
  const tipoDe = n => NEGOCIOS[n.tipo];

  // Lo que pasaría con una configuración (sin azar): sirve para la semana y para el simulador de balance
  function calcularSemana(s, n, opc = {}) {
    const T = tipoDe(n), pr = T.precios[n.precio], su = T.sueldos[n.sueldo], mk = T.marketing[n.marketing], c = n.ctx;
    const calidad = su.calidad * n.moral * (opc.gestion ? 1.08 : 1) * (c.averia > 0 ? 0.9 : 1) * (n.estrella ? 1.08 : 1);
    const capacidad = Math.round(n.empleados * T.capacidadEmpleado * (su.capacidad || 1) * (c.averia > 0 ? 0.75 : 1));   // con sueldo bajo se trabaja con menos ganas
    const comp = c.competidor ? Math.min(1, pr.competidor + (calidad >= 1.15 ? 0.06 : 0)) : 1;
    const famaJugador = 1 + (s ? s.p.rep : 0) / 250;
    const demanda = T.demandaBase * (0.4 + n.fama / 100) * pr.demanda * mk.demanda * comp * (c.temporadaAlta > 0 ? 1.4 : 1) * (c.influencer > 0 ? 1.25 : 1) * famaJugador * (opc.azar || 1) * (opc.gestion ? 1.05 : 1);
    const clientes = Math.round(Math.min(demanda, capacidad));
    const colas = Math.max(0, demanda - capacidad);
    const ingresos = clientes * pr.valor;
    const intereses = Math.round(n.deuda * n.interes);
    const costes = {
      alquiler: n.local ? 0 : n.alquiler, fijos: T.fijos, personal: n.empleados * su.coste, marketing: mk.coste,
      material: Math.round(clientes * T.consumoCliente), intereses,
    };
    const totalCostes = Object.values(costes).reduce((a, b) => a + b, 0);
    const justo = n.precio === 'caro' && calidad >= 1.15 ? 1 : pr.justo;
    const famaObjetivo = clamp(20 + 50 * calidad * justo + mk.fama - (colas / Math.max(1, capacidad) > 0.15 ? 12 : 0), 0, 100);
    return { calidad: r1(calidad), capacidad, demanda: Math.round(demanda), clientes, colas: Math.round(colas), ingresos, costes, totalCostes, beneficio: Math.round(ingresos - totalCostes), famaObjetivo: Math.round(famaObjetivo), comp };
  }

  function semanaNegocio(s, n, R, opc = {}) {
    const T = tipoDe(n), K = CFG.empresa;
    const x = calcularSemana(s, n, { gestion: opc.gestion, azar: entre(s, 0.92, 1.08) });
    n.caja += x.beneficio;
    // Préstamo: la parte de devolución sale de la caja pero no es «coste»
    if (n.deuda > 0) { const dev = Math.min(n.deuda, n.cuota); n.caja -= dev; n.deuda = Math.max(0, Math.round(n.deuda - dev)); if (!n.deuda) n.cuota = 0; }
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
    if (!n.crisis && (n.caja < 0 || (n.rachaNeg >= K.crisisSemanasNegativas && n.caja < 800))) {
      n.crisis = true;
      P2.encolar(s, { tipo: 'crisis', neg: n.id });
    }
    if (n.rachaPos >= K.semanasRentable) P2.conseguirHito(s, 'rentable', R);
  }

  function beneficioMedio(n, k = CFG.empresa.valoracion.semanasMedia) { const l = n.hist.slice(-k); return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0; }
  // Valor = beneficio medio reciente × múltiplo + caja + fama − deuda (+ el local, si es tuyo)
  function valorNegocio(n) {
    const V = CFG.empresa.valoracion;
    const v = beneficioMedio(n) * V.multiplo + Math.max(0, n.caja) + n.fama * V.porFama - n.deuda + (n.local ? P2.OPORTUNIDADES.find(o => o.id === 'local').coste * 0.9 : 0);
    return Math.round(Math.max(V.minimo, v) / 100) * 100;
  }

  // ---- Movimientos explícitos entre tu cuenta y la caja ----
  function aportar(s, id, x) {
    const n = s.negocios.find(z => z.id === id); x = Math.round(x);
    if (!n || !(x > 0) || s.p.dinero < x) return false;
    s.p.dinero -= x; n.caja += x; s.acum.aportado += x; n.invertido += x;
    if (n.crisis && n.caja >= 0) n.crisis = false;
    return true;
  }
  function retirar(s, id, x) {
    const n = s.negocios.find(z => z.id === id); x = Math.round(x);
    if (!n || !(x > 0) || n.caja < x) return false;
    n.caja -= x; s.p.dinero += x; s.acum.retirado += x;
    return true;
  }
  function configurar(s, id, campo, valor) {
    const n = s.negocios.find(z => z.id === id), T = n && tipoDe(n);
    if (!n) return false;
    if (campo === 'empleados') { const v = clamp(Math.round(valor), 1, T.empleadosMax); if (v === n.empleados) return false; if (v > n.empleados) n.moral = r1(clamp(n.moral - 0.02, 0.7, 1.1)); n.empleados = v; return true; }
    const tabla = { precio: T.precios, sueldo: T.sueldos, marketing: T.marketing }[campo];
    if (!tabla || !tabla[valor]) return false;
    if (campo === 'sueldo' && T.sueldos[valor].coste < T.sueldos[n.sueldo].coste) n.moral = r1(clamp(n.moral - 0.1, 0.7, 1.1));
    n[campo] = valor;
    return true;
  }
  function pedirPrestamo(s, id, interes) {
    const n = s.negocios.find(z => z.id === id), K = CFG.empresa.prestamo;
    if (!n || n.deuda > 0) return false;
    n.caja += K.importe; n.deuda = K.importe; n.interes = interes || K.interesSemanal; n.cuota = Math.ceil(K.importe / K.plazo);
    if (n.crisis && n.caja >= 0) n.crisis = false;
    return true;
  }
  function venderNegocio(s, id, factor = 1) {
    const n = s.negocios.find(z => z.id === id);
    if (!n) return 0;
    const v = Math.round(valorNegocio(n) * factor);
    s.p.dinero += v; s.negocios = s.negocios.filter(z => z !== n);
    P2.anotar(s, '🤝', `Vendo la ${tipoDe(n).n.toLowerCase()} por ${eur(v)}.`);
    return v;
  }

  // ---- Comprar (traspaso + caja inicial: más caja = más margen, pero tardas más en reunirla) ----
  function capitalNecesario(tipo, i = 0) { const T = NEGOCIOS[tipo]; return T.traspaso + T.cajas[i]; }
  function bloqueoCompra(s, tipo, i) {
    if (!P2.tieneHito(s, 'contrato')) return 'Primero, un contrato profesional.';
    if (!mercadoAbierto(s)) return 'Tu asesor aún no te ha enseñado ningún traspaso.';
    if (s.negocios.length && !s.oportunidad) return 'Primero, que tu primera empresa funcione.';
    if (s.p.dinero < capitalNecesario(tipo, i)) return `Necesitas ${eur(capitalNecesario(tipo, i))}.`;
    return null;
  }
  // El mercado de traspasos se abre con un patrocinador (tu asesor) o tras 10 partidos como profesional
  const mercadoAbierto = s => P2.tieneHito(s, 'patro') || (P2.tieneHito(s, 'contrato') && s.stats.jugados >= 10) || s.negocios.length > 0;
  function comprarNegocio(s, tipo, i, R) {
    if (bloqueoCompra(s, tipo, i)) return false;
    const T = NEGOCIOS[tipo], caja = T.cajas[i];
    s.p.dinero -= T.traspaso + caja; s.acum.aportado += caja;
    const n = nuevoNegocio(tipo, caja);
    n.comprado = s.semana; n.invertido = T.traspaso + caja;
    s.negocios.push(n);
    P2.anotar(s, T.ic, `Compro una ${T.n.toLowerCase()}: traspaso ${eur(T.traspaso)} y ${eur(caja)} en caja.`);
    P2.conseguirHito(s, 'empresa', R);
    return n;
  }

  Object.assign(P2, { nuevoNegocio, calcularSemana, semanaNegocio, beneficioMedio, valorNegocio, aportar, retirar, configurar, pedirPrestamo, venderNegocio,
    capitalNecesario, bloqueoCompra, comprarNegocio, mercadoAbierto, tipoDe });
})(globalThis.P2 = globalThis.P2 || {});
