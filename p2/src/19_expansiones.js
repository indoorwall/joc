/* =====================================================================
   19b · EXPANSIONES DE SISTEMA (de pago): más juego para la etapa de empresario/a.
   Propietario de club · Imperio inmobiliario · Agencia de deportistas · Organizador de eventos · Media & Sports
   Cada una: estado propio en la partida, una semana de simulación, decisiones y valor en el patrimonio.
   Se abren con su entitlement (la cuenta) y la primera empresa (hito «empresa»). Sin el entitlement se
   congelan: no se borra nada, pero no se juegan. Ninguna toca tu nivel, reputación deportiva ni resultados.
   Importes de juego.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { rnd, clamp, r1, eur, nf } = P2;
  const ent = id => `expansion.${id}`;
  const EXP = {
    club_owner: { ent: ent('club_owner'), ic: '🏟️', n: 'Propietario de club', seccion: 'club', sku: 'expansion_club_owner' },
    real_estate: { ent: ent('real_estate'), ic: '🏢', n: 'Imperio inmobiliario', seccion: 'inmuebles', sku: 'expansion_real_estate' },
    sports_agency: { ent: ent('sports_agency'), ic: '💼', n: 'Agencia de deportistas', seccion: 'agencia', sku: 'expansion_sports_agency' },
    events: { ent: ent('events'), ic: '🎪', n: 'Organizador de eventos', seccion: 'eventos', sku: 'expansion_events' },
    media: { ent: ent('media'), ic: '📺', n: 'Media & Sports', seccion: 'media', sku: 'expansion_media' },
  };
  const tieneExp = (s, id) => !!(EXP[id] && P2.tieneEnt(EXP[id].ent));
  const expAbierta = (s, id) => tieneExp(s, id) && !!(s.hitos && s.hitos.empresa);
  const gasto = (s, x) => { s.p.dinero -= x; s.acum.gastos += x; };
  const ingreso = (s, x) => { s.p.dinero += x; s.acum.trabajo += x; };
  const linea = (R, ic, t, cls) => R && R.lineas.push([ic, t, cls || '']);
  const lineaIngreso = (R, t, v) => R && R.ingresos.push([t, v]);

  // =====================================================================
  // 🏟️ PROPIETARIO DE CLUB
  // =====================================================================
  const CAT = ['regional', 'tercera', 'segunda', 'primera'];
  const CLUB_K = {
    valor: [40000, 150000, 450000, 1500000], fuerzaMedia: [41, 51, 59, 67], aforo: [800, 3000, 8000, 20000], entrada: [4, 9, 16, 26],
    tv: [0, 250, 1500, 7000], plantilla: [900, 8000, 39000, 160000], jornadas: 14,
  };
  // Los clubes que se pueden comprar (los mismos de tu deporte: cada deporte tiene sus nombres)
  function clubesEnVenta(s) {
    const O = P2.OFERTAS, n = id => (O[id] ? O[id].n.replace(/ \(.*\)/, '').replace(/ · .*/, '') : id);
    return [['sanroque', n('sanroque'), 0, 42, '🟢'], ['puerto', n('puerto'), 1, 52, '⚓'], ['costa', n('costaReal'), 2, 61, '🌊'], ['atletico', n('atleticoPrimero'), 3, 66, '🔴']]
      .map(([id, nom, cat, fuerza, ic]) => ({ id, n: nom, cat, fuerza, ic }));
  }
  function valorClub(c) {
    const f = clamp((c.fuerza - CLUB_K.fuerzaMedia[c.cat] + 10) / 10, 0.4, 2.2);
    return Math.round(CLUB_K.valor[c.cat] * f * (0.8 + c.aficion / 250) * (1 + 0.12 * c.estadio) + Math.max(0, c.caja) * 0.5);
  }
  function crearClub(s, id) {
    const X = clubesEnVenta(s).find(c => c.id === id); if (!X) return null;
    return { id, n: X.n, ic: X.ic, cat: X.cat, fuerza: X.fuerza, aficion: 45, caja: Math.round(CLUB_K.valor[X.cat] * 0.1), pct: 0, deuda: 0,
      precio: 'normal', inversion: 0, entrenador: 'normal', director: false, cantera: false, estadio: 0, sponsor: null, obras: 0,
      temp: { j: 0, pts: 0, g: 0, e: 0, p: 0, num: 1 }, hist: [], ultimo: null };
  }
  const controlas = s => !!(s.club && s.club.pct >= 51);
  function precioParticipacion(s, id, pct) {
    const c = s.club && s.club.id === id ? s.club : crearClub(s, id); if (!c) return null;
    return Math.round(valorClub(c) * pct / 100 * 1.1);   // comprar cuesta un 10 % más que lo que vale
  }
  function comprarParticipacion(s, id, pct, R) {
    if (!expAbierta(s, 'club_owner')) return 'Necesitas la expansión y tu primera empresa.';
    if (s.club && s.club.id !== id) return 'Ya tienes participaciones en otro club: véndelas primero.';
    const c = s.club || crearClub(s, id); if (!c) return 'Ese club no existe.';
    const pctMax = 100 - c.pct; pct = Math.min(pct, pctMax); if (pct <= 0) return 'Ya es todo tuyo.';
    const precio = precioParticipacion(s, id, pct);
    if (s.p.dinero < precio) return `Necesitas ${eur(precio)}.`;
    gasto(s, precio); c.pct += pct; c.invertido = (c.invertido || 0) + precio; s.club = c;
    const pres = c.pct >= 51 && c.pct - pct < 51;
    linea(R, '🏟️', `Compras el ${pct} % de ${c.n} por ${eur(precio)}. Tienes el ${c.pct} %.${pres ? ' ¡Tienes la mayoría: eres presidente/a!' : ''}`, 'bien');
    P2.anotar(s, '🏟️', `Compro el ${pct} % de ${c.n} (${eur(precio)}).`);
    if (pres) P2.celebrar(s, { tipo: 'negocio', n: `Presidencia de ${c.n}`, ic: '🏟️', invertido: c.invertido, texto: 'Ahora mandas tú en el club' });
    return null;
  }
  function venderParticipacion(s, pct, R) {
    const c = s.club; if (!c) return 'No tienes club.';
    pct = Math.min(pct, c.pct);
    const v = Math.round(valorClub(c) * pct / 100 * 0.95);   // vender rápido: un 5 % menos
    ingreso(s, v); c.pct -= pct;
    linea(R, '🤝', `Vendes el ${pct} % de ${c.n} por ${eur(v)}.`, 'bien');
    P2.anotar(s, '🤝', `Vendo el ${pct} % de ${c.n} (${eur(v)}).`);
    if (c.pct <= 0) s.club = null;
    return null;
  }
  const OPC_CLUB = {
    precio: { barato: ['Entradas baratas', 0.7, 3], normal: ['Entradas normales', 1, 0], caro: ['Entradas caras', 1.5, -3] },
    inversion: [['Sin fichajes', 0], ['Fichajes moderados', 0.3], ['Fichajes fuertes', 0.8]],
    entrenador: { normal: ['Entrenador de la casa', 0], top: ['Entrenador de prestigio', 0.12] },
  };
  function configurarClub(s, k, v) {
    const c = s.club; if (!controlas(s)) return 'Solo decide quien tiene la mayoría.';
    if (k === 'precio' && OPC_CLUB.precio[v]) c.precio = v;
    else if (k === 'inversion' && OPC_CLUB.inversion[+v]) c.inversion = +v;
    else if (k === 'entrenador' && OPC_CLUB.entrenador[v]) c.entrenador = v;
    else if (k === 'director') c.director = !c.director;
    else if (k === 'cantera') c.cantera = !c.cantera;
    else return 'No existe.';
    return null;
  }
  const costeEstadio = c => Math.round(CLUB_K.valor[c.cat] * 0.12 * (c.estadio + 1));
  function ampliarEstadio(s) {
    const c = s.club; if (!controlas(s)) return 'Solo decide quien tiene la mayoría.';
    if (c.estadio >= 3) return 'Ya no cabe más.'; if (c.obras) return 'Ya hay obras.';
    const x = costeEstadio(c); if (c.caja < x) return `La caja del club necesita ${eur(x)}.`;
    c.caja -= x; c.obras = 8; return null;
  }
  function buscarSponsorClub(s, R) {
    const c = s.club; if (!controlas(s)) return 'Solo decide quien tiene la mayoría.';
    if (c.sponsor) return 'Ya tenéis patrocinador.';
    if ((c.ultSponsor || -99) > s.semana - 4) return 'Hasta dentro de unas semanas nadie te recibe.';
    c.ultSponsor = s.semana;
    const p = clamp(0.25 + c.aficion / 200 + c.cat * 0.08, 0.1, 0.85);
    if (rnd(s) < p) { const sem = Math.round(CLUB_K.tv[c.cat] * 0.5 + 150 + c.aficion * (c.cat + 1) * 3); c.sponsor = { n: ['Talleres Costa', 'Vértice Energy', 'Nova Telecom', 'Kinetic Sport'][Math.min(3, c.cat)], semanal: sem, semanas: 26 }; linea(R, '🤝', `${c.sponsor.n} patrocinará la camiseta: ${eur(sem)}/semana durante 26 semanas.`, 'bien'); }
    else linea(R, '🤝', 'Ninguna marca se compromete esta vez. Más afición o más categoría lo pondrán más fácil.', 'mal');
    return null;
  }
  function aportarClub(s, x) { const c = s.club; if (!c || x <= 0 || s.p.dinero < x) return 'No llega.'; gasto(s, x); c.caja += x; c.invertido = (c.invertido || 0) + x; return null; }
  function retirarClub(s, x) { const c = s.club; if (!controlas(s)) return 'Solo decide quien tiene la mayoría.'; if (x <= 0 || c.caja < x) return 'La caja no llega.'; c.caja -= x; ingreso(s, x); return null; }

  function semanaClub(s, R) {
    const c = s.club; if (!c || !tieneExp(s, 'club_owner')) return;
    const K = CLUB_K, Pr = OPC_CLUB.precio[c.precio], inv = OPC_CLUB.inversion[c.inversion][1];
    const empate = P2.deporteDe(s).formato === 'goles' ? 0.26 : 0;
    // Partido de la semana (un club propio juega su propia liga)
    const pW = clamp(0.42 + (c.fuerza - K.fuerzaMedia[c.cat]) / 22 + (c.temp.j % 2 ? 0 : 0.05), 0.08, 0.86);
    const x = rnd(s), res = x < pW * (1 - empate) ? 'g' : x < pW * (1 - empate) + empate ? 'e' : 'p';
    c.temp.j++; c.temp[res]++; c.temp.pts += res === 'g' ? 3 : res === 'e' ? 1 : 0;
    // Dinero del club
    const ocup = clamp(0.3 + c.aficion / 140 - (Pr[1] - 1) * 0.35 + (res === 'g' ? 0.05 : 0), 0.08, 1);
    const aforo = Math.round(K.aforo[c.cat] * (1 + 0.25 * c.estadio)), publico = Math.round(aforo * ocup);
    const taquilla = Math.round(publico * K.entrada[c.cat] * Pr[1] * 0.5);   // en casa una semana sí y otra no: media semanal
    const tv = K.tv[c.cat], spon = c.sponsor ? c.sponsor.semanal : 0;
    const sueldos = Math.round(K.plantilla[c.cat] * (1 + inv) * (c.entrenador === 'top' ? 1.1 : 1));
    const staff = (c.director ? 600 : 0) + (c.cantera ? 450 : 0) + Math.round(K.valor[c.cat] * 0.0008 * (1 + c.estadio));
    const neto = taquilla + tv + spon - sueldos - staff;
    c.caja += neto;
    if (c.sponsor && --c.sponsor.semanas <= 0) { linea(R, '🤝', `Se acaba el patrocinio de ${c.sponsor.n}.`); c.sponsor = null; }
    if (c.obras > 0 && --c.obras === 0) { c.estadio++; linea(R, '🏗️', `¡Terminan las obras! El estadio de ${c.n} gana aforo (nivel ${c.estadio}).`, 'bien'); }
    // Fuerza y afición
    c.fuerza = r1(c.fuerza + inv * 0.12 + (c.entrenador === 'top' ? OPC_CLUB.entrenador.top[1] * 0.5 : 0) + (c.director ? 0.04 : 0) + (c.cantera ? 0.03 : 0) - 0.03);
    c.aficion = r1(clamp(c.aficion + (res === 'g' ? 1.2 : res === 'p' ? -1 : 0.2) + Pr[2] * 0.15, 0, 100));
    const rl = { g: 'gana', e: 'empata', p: 'pierde' }[res];
    linea(R, c.ic, `${c.n} ${rl} (${c.temp.pts} pts en ${c.temp.j} jornadas). Caja del club ${eur(c.caja)} (${neto >= 0 ? '+' : ''}${eur(neto)}).`, res === 'g' ? 'bien' : res === 'p' ? 'mal' : '');
    if (R) R.porque.push(`${c.n}: taquilla ${eur(taquilla)} (${publico} de ${aforo}), TV ${eur(tv)}, patrocinio ${eur(spon)}, plantilla −${eur(sueldos)}, cuerpo técnico e instalaciones −${eur(staff)}. Fuerza ${nf(c.fuerza)} frente a ${K.fuerzaMedia[c.cat]} de la categoría.`);
    c.ultimo = { res, neto, publico, aforo, taquilla, tv, spon, sueldos, staff };
    // Caja en negativo: sin dinero no se pagan nóminas
    if (c.caja < -CLUB_K.valor[c.cat] * 0.05) { c.fuerza = r1(c.fuerza - 0.2); c.aficion = r1(clamp(c.aficion - 1, 0, 100)); linea(R, '⚠️', `${c.n} no puede pagar las nóminas: la plantilla se resiente. ${controlas(s) ? 'Pon dinero en la caja o baja gastos.' : 'El presidente pide una ampliación de capital.'}`, 'mal'); }
    // Fin de temporada del club
    if (c.temp.j >= K.jornadas) finTemporadaClub(s, c, R);
  }
  function finTemporadaClub(s, c, R) {
    const ppg = c.temp.pts / c.temp.j, vAntes = valorClub(c);
    let mov = 0;
    if (ppg >= 2.05 && c.cat < 3) mov = 1; else if (ppg <= 0.95 && c.cat > 0) mov = -1;
    const pos = ppg >= 2.05 ? 1 : ppg >= 1.8 ? 2 : ppg >= 1.5 ? 3 : ppg >= 1.25 ? 4 : ppg >= 1.05 ? 5 : ppg >= 0.95 ? 6 : 7;
    c.hist.push({ num: c.temp.num, cat: c.cat, pts: c.temp.pts, pos, mov });
    if (mov) { c.cat += mov; c.fuerza = r1(c.fuerza + (mov > 0 ? 1.5 : -1)); }
    if (c.cantera) { const v = Math.round(CLUB_K.valor[c.cat] * 0.05); c.caja += v; linea(R, '🌱', `La cantera vende a una promesa: +${eur(v)} para la caja.`, 'bien'); }
    // Reparto: el 30 % de la caja positiva a los socios (tú, según tu parte)
    if (c.caja > 0 && !controlas(s)) { const d = Math.round(c.caja * 0.3 * c.pct / 100); c.caja -= Math.round(c.caja * 0.3); ingreso(s, d); linea(R, '💶', `Dividendo de ${c.n}: +${eur(d)}.`, 'bien'); }
    const L = P2.LIGAS[CAT[c.cat]];
    linea(R, mov > 0 ? '🎉' : mov < 0 ? '📉' : '🏁', `${c.n} acaba la temporada ${pos}º con ${c.temp.pts} puntos.${mov > 0 ? ` ¡Sube a ${L.n}!` : mov < 0 ? ` Baja a ${L.n}.` : ''} Vale ${eur(valorClub(c))} (antes ${eur(vAntes)}).`, mov > 0 ? 'bien' : mov < 0 ? 'mal' : '');
    if (mov > 0) P2.celebrar(s, { tipo: 'ascenso', club: c.n, ic: c.ic, de: CAT[c.cat - 1], a: CAT[c.cat], prima: 0 });
    P2.anotar(s, c.ic, `${c.n}: ${pos}º${mov > 0 ? ', ascenso' : mov < 0 ? ', descenso' : ''}.`);
    c.temp = { j: 0, pts: 0, g: 0, e: 0, p: 0, num: c.temp.num + 1 };
  }

  // =====================================================================
  // 🏢 IMPERIO INMOBILIARIO
  // =====================================================================
  const INM = {
    parking: { n: 'Plaza de parking', ic: '🅿️', precio: 18000, renta: 75, mant: 4, unidades: 1 },
    local: { n: 'Local comercial', ic: '🏪', precio: 90000, renta: 390, mant: 30, unidades: 1 },
    piso: { n: 'Piso', ic: '🏠', precio: 140000, renta: 540, mant: 45, unidades: 1 },
    edificio: { n: 'Edificio de 8 viviendas', ic: '🏢', precio: 900000, renta: 3700, mant: 320, unidades: 8 },
    terreno: { n: 'Terreno urbanizable', ic: '🌱', precio: 120000, renta: 0, mant: 10, unidades: 0, construir: { coste: 620000, licencia: 8, obras: 26 } },
  };
  const inm = s => (s.inm && typeof s.inm === 'object' ? s.inm : (s.inm = { props: [], mercado: 1, euribor: 0.03, seq: 0 }));
  const cuotaSemanal = (deuda, tipoAnual, anos) => { const i = tipoAnual / 52, n = anos * 52; return Math.round(deuda * i / (1 - Math.pow(1 + i, -n))); };
  function valorInm(s, p) { const T = INM[p.tipo]; return Math.round(T.precio * inm(s).mercado * (1 + 0.1 * p.reforma)); }
  function rentaInm(s, p) { const T = INM[p.tipo]; return Math.round(T.renta * (1 + 0.15 * p.reforma) * Math.sqrt(inm(s).mercado) * (p.rentaAlta ? 1.2 : 1)); }
  function precioCompraInm(s, tipo) { return Math.round(INM[tipo].precio * inm(s).mercado); }
  function comprarInm(s, tipo, financiar, R) {
    if (!expAbierta(s, 'real_estate')) return 'Necesitas la expansión y tu primera empresa.';
    const T = INM[tipo]; if (!T) return 'No existe.';
    const I = inm(s), precio = precioCompraInm(s, tipo), gastosCompra = Math.round(precio * 0.1);
    const entrada = financiar ? Math.round(precio * 0.3) : precio, total = entrada + gastosCompra;
    if (s.p.dinero < total) return `Necesitas ${eur(total)}${financiar ? ' (30 % de entrada y 10 % de gastos)' : ' (precio y 10 % de gastos)'}.`;
    if (financiar) { const ingresos = semanalesRecurrentes(s); const cuota = cuotaSemanal(precio - entrada, I.euribor + 0.01, 20); if (cuota > ingresos * 0.4 + 50) return `El banco no te la da: la cuota (${eur(cuota)}/semana) pasa del 40 % de tus ingresos.`; }
    gasto(s, total);
    const p = { uid: `i${++I.seq}`, tipo, precio, reforma: 0, estado: T.renta ? 'vacio' : 'solar', semanasVacio: 0, obras: 0, impago: 0, rentaAlta: false, hipoteca: null, compradoEn: s.semana };
    if (financiar) { const deuda = precio - entrada; p.hipoteca = { deuda, cuota: cuotaSemanal(deuda, I.euribor + 0.01, 20) }; }
    I.props.push(p);
    linea(R, T.ic, `Compras ${T.n.toLowerCase()} por ${eur(precio)}${financiar ? ` con hipoteca (${eur(p.hipoteca.cuota)}/semana)` : ''}. Gastos de compra: ${eur(gastosCompra)}.`, 'bien');
    P2.anotar(s, T.ic, `Compro ${T.n.toLowerCase()} (${eur(precio)}).`);
    return null;
  }
  // Ingresos semanales que el banco tiene en cuenta (sueldo, rentas, patrocinios)
  function semanalesRecurrentes(s) {
    const sueldo = s.contrato ? s.contrato.sueldo : 0, rentas = inm(s).props.filter(p => p.estado === 'alquilado').reduce((a, p) => a + rentaInm(s, p), 0);
    const patros = (s.patros || []).reduce((a, c) => a + (c.semanal || 0), 0);
    return sueldo + rentas + patros + Math.max(0, s.negocios.reduce((a, n) => a + (P2.beneficioMedio ? P2.beneficioMedio(n) : 0), 0));
  }
  function reformarInm(s, uid) {
    const p = inm(s).props.find(x => x.uid === uid); if (!p) return 'No existe.';
    if (p.estado === 'obras' || p.estado === 'licencia' || p.estado === 'solar') return 'Ahora no se puede reformar.';
    if (p.reforma >= 2) return 'Ya está reformado del todo.';
    const coste = Math.round(INM[p.tipo].precio * (p.reforma ? 0.16 : 0.08)); if (s.p.dinero < coste) return `Necesitas ${eur(coste)}.`;
    gasto(s, coste); p.estadoAntes = p.estado; p.estado = 'obras'; p.obras = 6; p.reforma++; return null;
  }
  function construirInm(s, uid) {
    const p = inm(s).props.find(x => x.uid === uid); if (!p || p.tipo !== 'terreno' || p.estado !== 'solar') return 'No se puede.';
    const C = INM.terreno.construir; if (s.p.dinero < Math.round(C.coste * 0.2)) return `Para empezar necesitas el 20 %: ${eur(Math.round(C.coste * 0.2))} (el resto, préstamo promotor).`;
    gasto(s, Math.round(C.coste * 0.2));
    p.estado = 'licencia'; p.obras = C.licencia; p.promotor = { deuda: Math.round(C.coste * 0.8), cuota: cuotaSemanal(Math.round(C.coste * 0.8), inm(s).euribor + 0.02, 15) };
    return null;
  }
  function venderInm(s, uid, R) {
    const I = inm(s), p = I.props.find(x => x.uid === uid); if (!p) return 'No existe.';
    if (p.estado === 'obras' || p.estado === 'licencia') return 'Con obras no se vende.';
    const v = valorInm(s, p), comision = Math.round(v * 0.04), deuda = (p.hipoteca ? p.hipoteca.deuda : 0) + (p.promotor ? p.promotor.deuda : 0), neto = v - comision - deuda;
    s.p.dinero += neto; s.acum.trabajo += Math.max(0, neto);
    I.props = I.props.filter(x => x !== p);
    const ben = v - p.precio;
    linea(R, '🤝', `Vendes ${INM[p.tipo].n.toLowerCase()} por ${eur(v)} (comisión ${eur(comision)}${deuda ? `, cancelas ${eur(deuda)} de deuda` : ''}). ${ben >= 0 ? 'Ganas' : 'Pierdes'} ${eur(Math.abs(ben))} sobre lo que pagaste.`, ben >= 0 ? 'bien' : 'mal');
    if (ben > 20000) P2.celebrar(s, { tipo: 'venta', n: INM[p.tipo].n, ic: INM[p.tipo].ic, precio: v, beneficio: ben });
    return null;
  }
  function rentaAltaInm(s, uid) { const p = inm(s).props.find(x => x.uid === uid); if (!p) return 'No existe.'; p.rentaAlta = !p.rentaAlta; return null; }
  function semanaInm(s, R) {
    const I = inm(s); if (!I.props.length && !tieneExp(s, 'real_estate')) return;
    // El mercado se mueve un poco cada semana (con tendencia suave al alza) y el euríbor también
    I.mercado = r1(clamp(I.mercado * (1 + (rnd(s) - 0.47) * 0.012), 0.75, 1.6) * 1000) / 1000;
    I.euribor = Math.round(clamp(I.euribor + (rnd(s) - 0.5) * 0.0015, 0.005, 0.06) * 10000) / 10000;
    if (!tieneExp(s, 'real_estate')) return;
    let rentas = 0, gastos = 0, cuotas = 0;
    for (const p of I.props) {
      const T = INM[p.tipo];
      gastos += Math.round(T.mant * (1 + 0.1 * p.reforma));
      if (p.hipoteca && p.hipoteca.deuda > 0) { const H = p.hipoteca, interes = Math.round(H.deuda * (I.euribor + 0.01) / 52), amort = Math.max(0, H.cuota - interes); H.deuda = Math.max(0, H.deuda - amort); cuotas += H.cuota; if (!H.deuda) p.hipoteca = null; }
      if (p.promotor && p.promotor.deuda > 0) { const H = p.promotor, interes = Math.round(H.deuda * (I.euribor + 0.02) / 52), amort = Math.max(0, H.cuota - interes); H.deuda = Math.max(0, H.deuda - amort); cuotas += H.cuota; if (!H.deuda) p.promotor = null; }
      if (p.estado === 'obras' || p.estado === 'licencia') {
        if (--p.obras <= 0) {
          if (p.estado === 'licencia') { p.estado = 'obras'; p.obras = INM.terreno.construir.obras; linea(R, '📄', 'Te dan la licencia: empiezan las obras del edificio.', 'bien'); }
          else if (p.tipo === 'terreno') { p.tipo = 'edificio'; p.estado = 'vacio'; linea(R, '🏢', '¡Terminan las obras! Tu terreno ya es un edificio de 8 viviendas.', 'bien'); P2.celebrar(s, { tipo: 'casa', n: 'Edificio propio', ic: '🏢' }); }
          else { p.estado = 'vacio'; linea(R, '🔨', `Reforma terminada: ${T.n.toLowerCase()} se alquilará más caro.`, 'bien'); }
        }
        continue;
      }
      if (p.estado === 'vacio') {
        const prob = clamp(0.4 - (p.rentaAlta ? 0.18 : 0) + 0.05 * p.reforma, 0.08, 0.7);
        if (rnd(s) < prob) { p.estado = 'alquilado'; p.semanasVacio = 0; linea(R, T.ic, `Alquilas ${T.n.toLowerCase()}: ${eur(rentaInm(s, p))}/semana.`, 'bien'); }
        else p.semanasVacio++;
        continue;
      }
      if (p.estado === 'alquilado') {
        if (p.impago > 0) { p.impago--; if (!p.impago) { p.estado = 'vacio'; linea(R, '⚖️', `Recuperas ${T.n.toLowerCase()} tras el impago. Vuelve a estar en alquiler.`); } continue; }
        if (rnd(s) < 0.012) { p.impago = 4; linea(R, '⚠️', `El inquilino de ${T.n.toLowerCase()} deja de pagar. Abogado y 4 semanas sin cobrar.`, 'mal'); gastos += 300; continue; }
        if (rnd(s) < 0.02) { p.estado = 'vacio'; linea(R, '📦', `El inquilino de ${T.n.toLowerCase()} se va.`); continue; }
        if (rnd(s) < 0.015) { const x = Math.round(T.precio * 0.006); gastos += x; linea(R, '🔧', `Avería en ${T.n.toLowerCase()} (caldera, tuberías…): −${eur(x)}.`, 'mal'); }
        rentas += rentaInm(s, p);
      }
    }
    if (!I.props.length) return;
    const neto = rentas - gastos - cuotas;
    s.p.dinero += neto; if (neto >= 0) s.acum.trabajo += neto; else s.acum.gastos -= neto;
    lineaIngreso(R, 'Rentas de tus inmuebles', rentas); if (gastos) lineaIngreso(R, 'Mantenimiento e IBI', -gastos); if (cuotas) lineaIngreso(R, 'Hipotecas', -cuotas);
    linea(R, '🏢', `Inmuebles: rentas ${eur(rentas)} − gastos ${eur(gastos)} − hipotecas ${eur(cuotas)} = ${eur(neto)}. Mercado ${nf(Math.round(I.mercado * 100))} (base 100).`, neto >= 0 ? 'bien' : 'mal');
  }
  const valorInmuebles = s => inm(s).props.reduce((a, p) => a + valorInm(s, p) - (p.hipoteca ? p.hipoteca.deuda : 0) - (p.promotor ? p.promotor.deuda : 0) + (p.tipo === 'terreno' && p.estado !== 'solar' ? Math.round(INM.terreno.construir.coste * 0.6) : 0), 0);

  // =====================================================================
  // 💼 AGENCIA DE DEPORTISTAS
  // =====================================================================
  const agencia = s => (s.agencia && typeof s.agencia === 'object' ? s.agencia : (s.agencia = { rep: 10, ojeadores: 0, representados: [], prospectos: [], seq: 0, ganado: 0 }));
  const capacidadAgencia = A => 3 + A.ojeadores * 2;
  const NOMBRES_AG = ['Rayan', 'Celia', 'Bruno', 'Vera', 'Iván', 'Nerea', 'Jon', 'Aitana', 'Mateo', 'Lola', 'Enzo', 'Carmen', 'Thiago', 'Abril', 'Leo', 'Olivia'];
  const APE_AG = ['Rojas', 'Serrano', 'Moreno', 'Vega', 'Ruiz', 'Castro', 'Pardo', 'Molina', 'Herrero', 'Nieto', 'Calvo', 'Guerra'];
  function ojear(s, R) {
    if (!expAbierta(s, 'sports_agency')) return 'Necesitas la expansión y tu primera empresa.';
    const A = agencia(s), coste = 150 + 100 * A.ojeadores;
    if (s.p.dinero < coste) return `Necesitas ${eur(coste)}.`;
    gasto(s, coste);
    A.prospectos = [0, 1, 2].map(() => {
      const pot = Math.round(52 + rnd(s) * 30 + A.rep / 10 + A.ojeadores * 2), niv = Math.round(36 + rnd(s) * 14);
      const err = Math.max(3, 14 - A.ojeadores * 3 - A.rep / 15);
      return { uid: `a${++A.seq}`, n: `${NOMBRES_AG[Math.floor(rnd(s) * NOMBRES_AG.length)]} ${APE_AG[Math.floor(rnd(s) * APE_AG.length)]}`, edad: 15 + Math.floor(rnd(s) * 5), nivel: niv, pot: Math.min(95, pot),
        est: [Math.round(pot - err * (0.4 + rnd(s) * 0.6)), Math.round(pot + err * (0.4 + rnd(s) * 0.6))], firma: Math.round(250 + (pot - 50) * 40) };
    });
    linea(R, '🔎', `Tus ojeadores te traen ${A.prospectos.length} promesas (coste ${eur(coste)}).`);
    return null;
  }
  function firmarProspecto(s, uid, R) {
    const A = agencia(s), p = A.prospectos.find(x => x.uid === uid); if (!p) return 'Ya no está.';
    if (A.representados.length >= capacidadAgencia(A)) return `Tu agencia no puede llevar a más de ${capacidadAgencia(A)}: contrata ojeadores/agentes.`;
    if (s.p.dinero < p.firma) return `Necesitas ${eur(p.firma)} para la firma.`;
    gasto(s, p.firma); A.prospectos = A.prospectos.filter(x => x !== p);
    A.representados.push(Object.assign(p, { club: null, sueldo: 0, sponsor: 0, animo: 70, desarrollo: 1, semanas: 0, umbral: 0 }));
    linea(R, '✍️', `Firmas a ${p.n} (${p.edad} años) por ${eur(p.firma)}.`, 'bien');
    return null;
  }
  function contratarOjeador(s) { const A = agencia(s); if (A.ojeadores >= 4) return 'Ya tienes un buen equipo.'; A.ojeadores++; return null; }
  function despedirOjeador(s) { const A = agencia(s); if (!A.ojeadores) return 'No tienes.'; A.ojeadores--; return null; }
  const NIVELES_OFERTA = [50, 58, 66, 74, 82];
  // Cuando un representado mejora, llegan dos ofertas: más dinero o más desarrollo. Decides tú (y te llevas el 10 %).
  function semanaAgencia(s, R) {
    const A = agencia(s); if (!tieneExp(s, 'sports_agency') || (!A.representados.length && !A.ojeadores)) return;
    let com = 0;
    const coste = A.ojeadores * 260;
    for (const r of A.representados.slice()) {
      r.semanas++;
      r.nivel = r1(clamp(r.nivel + Math.max(0, r.pot - r.nivel) * 0.012 * r.desarrollo + (rnd(s) - 0.5) * 0.4, 0, 99));
      com += Math.round(r.sueldo * 0.1 + r.sponsor * 0.15);
      // Ánimo: baja si tienes demasiados o si no se desarrollan
      const carga = A.representados.length / capacidadAgencia(A);
      r.animo = r1(clamp(r.animo + (carga > 1 ? -2 : 0.2) + (r.desarrollo < 1 ? -0.6 : 0.2) + (rnd(s) - 0.5), 0, 100));
      if (r.animo < 25) { A.representados = A.representados.filter(x => x !== r); A.rep = r1(clamp(A.rep - 4, 0, 100)); linea(R, '🚪', `${r.n} se va con otra agencia: no se sentía bien atendido/a (−4 reputación de la agencia).`, 'mal'); continue; }
      const sig = NIVELES_OFERTA[r.umbral];
      if (sig && r.nivel >= sig && !(s.pendiente && s.pendiente.tipo === 'ofertaRepresentado') && !(s.cola || []).some(e => e.tipo === 'ofertaRepresentado' && e.uid === r.uid)) {
        r.umbral++; P2.encolar(s, { tipo: 'ofertaRepresentado', uid: r.uid, nivel: sig });
      }
      if (r.nivel >= 65 && !r.sponsor && rnd(s) < 0.08) { r.sponsor = Math.round(80 + (r.nivel - 60) * 25); A.rep = r1(clamp(A.rep + 2, 0, 100)); linea(R, '🤝', `Consigues un patrocinador para ${r.n}: ${eur(r.sponsor)}/semana (te llevas el 15 %).`, 'bien'); }
    }
    const neto = com - coste;
    if (com || coste) { s.p.dinero += neto; A.ganado += com; lineaIngreso(R, 'Comisiones de la agencia', com); if (coste) lineaIngreso(R, 'Agentes y ojeadores', -coste); }
    if (A.representados.length) linea(R, '💼', `Agencia: ${A.representados.length} ${A.representados.length === 1 ? 'representado' : 'representados'} · comisiones ${eur(com)} · reputación ${Math.round(A.rep)}.`);
  }
  function ofertasRepresentado(s, r) {
    const base = Math.round(40 + (r.nivel - 45) * 22);
    return [{ id: 'dinero', n: 'Club que paga más', sueldo: Math.round(base * 1.5), desarrollo: 0.7, d: 'Sueldo alto; juega menos y mejora más despacio' },
      { id: 'desarrollo', n: 'Club que le da minutos', sueldo: base, desarrollo: 1.35, d: 'Sueldo normal; juega y mejora más rápido' }];
  }
  function resolverOfertaRepresentado(s, uid, op, R) {
    const A = agencia(s), r = A.representados.find(x => x.uid === uid); if (!r) return;
    if (op === 'rechazar') { r.animo = r1(clamp(r.animo - 8, 0, 100)); linea(R, '✖️', `Rechazas las ofertas para ${r.n}. No le gusta esperar (−8 ánimo).`, 'mal'); return; }
    const o = ofertasRepresentado(s, r).find(x => x.id === op); if (!o) return;
    r.sueldo = o.sueldo; r.desarrollo = o.desarrollo; r.club = o.n; r.animo = r1(clamp(r.animo + (op === 'desarrollo' ? 8 : 4), 0, 100));
    A.rep = r1(clamp(A.rep + 2 + r.nivel / 40, 0, 100));
    linea(R, '✍️', `${r.n} firma: ${eur(o.sueldo)}/semana. Tu comisión: ${eur(Math.round(o.sueldo * 0.1))}/semana.`, 'bien');
  }
  function liberarRepresentado(s, uid) { const A = agencia(s); A.representados = A.representados.filter(x => x.uid !== uid); return null; }
  const valorAgencia = s => { const A = agencia(s); return Math.round(A.representados.reduce((a, r) => a + (r.sueldo * 0.1 + r.sponsor * 0.15) * 30, 0) + A.rep * 150); };

  // =====================================================================
  // 🎪 ORGANIZADOR DE EVENTOS
  // =====================================================================
  const EV = {
    tipos: { torneo: ['🏆', 'Torneo', 600, false], exhibicion: ['⭐', 'Exhibición de estrellas', 1200, false], festival: ['🎪', 'Festival al aire libre', 2000, true], gala: ['🥂', 'Gala de premios', 500, false] },
    sedes: { local: ['Polideportivo del barrio', 400, 600], pabellon: ['Pabellón', 3000, 9000], estadio: ['Estadio', 15000, 110000] },
    precios: [6, 12, 25], estrella: 2200, produccion: { basica: ['Básica', 1200, 0.95], premium: ['Premium', 7000, 1.12] },
  };
  const eventos = s => (s.eventos && typeof s.eventos === 'object' ? s.eventos : (s.eventos = { rep: 10, plan: null, hist: [] }));
  function costeEvento(p) { const sede = EV.sedes[p.sede][2], prod = EV.produccion[p.produccion][1]; return sede + prod + p.estrellas * EV.estrella + (p.seguro ? Math.round((sede + prod) * 0.06) : 0); }
  function planificarEvento(s, p, R) {
    if (!expAbierta(s, 'events')) return 'Necesitas la expansión y tu primera empresa.';
    const E = eventos(s); if (E.plan) return 'Ya tienes un evento en marcha.';
    if (!EV.tipos[p.tipo] || !EV.sedes[p.sede] || !EV.produccion[p.produccion] || !(p.precio >= 0 && p.precio < EV.precios.length) || !(p.estrellas >= 0 && p.estrellas <= 3)) return 'Faltan datos.';
    if (p.sede === 'estadio' && E.rep < 35) return 'Un estadio no te lo alquilan hasta que tengas 35 de reputación como organizador/a.';
    if (p.tv && (p.sede === 'local' || E.rep < 25)) return 'La tele solo viene a pabellones o estadios y con 25 de reputación.';
    const total = costeEvento(p), senal = Math.round(total * 0.3);
    if (s.p.dinero < senal) return `Para reservar necesitas la señal: ${eur(senal)} (30 %).`;
    gasto(s, senal);
    E.plan = Object.assign({ semana: s.semana + Math.max(3, Math.min(8, p.semanas || 4)), senal, total, sponsor: 0 }, p);
    // Patrocinadores: más fácil con más reputación y más estrellas
    if (rnd(s) < clamp(0.2 + E.rep / 100 + p.estrellas * 0.1, 0.1, 0.9)) { E.plan.sponsor = Math.round(total * (0.15 + rnd(s) * 0.2)); linea(R, '🤝', `Un patrocinador se suma al evento: +${eur(E.plan.sponsor)}.`, 'bien'); }
    linea(R, EV.tipos[p.tipo][0], `Reservas ${EV.sedes[p.sede][0].toLowerCase()} para tu ${EV.tipos[p.tipo][1].toLowerCase()} en la semana ${E.plan.semana}. Señal: ${eur(senal)}.`);
    return null;
  }
  function cancelarEvento(s, R) { const E = eventos(s); if (!E.plan) return 'No hay evento.'; linea(R, '✖️', `Cancelas el evento. Pierdes la señal (${eur(E.plan.senal)}).`, 'mal'); E.plan = null; return null; }
  function demandaEvento(s, p) {
    const E = eventos(s), T = EV.tipos[p.tipo];
    const precioF = [1.35, 1, 0.6][p.precio], fama = 1 + E.rep / 60 + (s.p.marca || 0) / 120;
    return Math.round(T[2] * fama * (1 + p.estrellas * 0.35) * precioF * EV.produccion[p.produccion][2] * (p.tv ? 1.1 : 1));
  }
  function semanaEventos(s, R) {
    const E = eventos(s); if (!E.plan || !tieneExp(s, 'events') || s.semana < E.plan.semana) return;
    const p = E.plan, T = EV.tipos[p.tipo], Sd = EV.sedes[p.sede];
    let dem = Math.round(demandaEvento(s, p) * (0.85 + rnd(s) * 0.3)), lluvia = false, cancelado = false;
    if (T[3] && rnd(s) < 0.15) { lluvia = true; if (rnd(s) < 0.4) cancelado = true; else dem = Math.round(dem * 0.45); }
    const resto = p.total - p.senal; gasto(s, resto);
    let ingresos = 0, asistentes = 0;
    if (cancelado) { if (p.seguro) { ingresos = Math.round(p.total * 0.85); linea(R, '☔', `Temporal: se cancela el evento. El seguro cubre ${eur(ingresos)}.`, 'mal'); } else linea(R, '☔', 'Temporal: se cancela el evento y sin seguro lo pierdes casi todo.', 'mal'); }
    else {
      asistentes = Math.min(Sd[1], dem); const entradas = asistentes * EV.precios[p.precio];
      const tv = p.tv ? Math.round((p.sede === 'estadio' ? 18000 : 4000) * (1 + E.rep / 100)) : 0;
      ingresos = entradas + p.sponsor + tv + Math.round(asistentes * 1.5);   // + bar y merchandising
      linea(R, T[0], `${T[1]}: ${asistentes} personas (${Math.round(asistentes / Sd[1] * 100)} % del aforo)${lluvia ? ' pese a la lluvia' : ''}. Entradas ${eur(entradas)}${tv ? ` · TV ${eur(tv)}` : ''}${p.sponsor ? ` · patrocinio ${eur(p.sponsor)}` : ''}.`, 'bien');
    }
    s.p.dinero += ingresos; s.acum.trabajo += ingresos;
    const res = ingresos - p.total, lleno = asistentes / Sd[1];
    E.rep = r1(clamp(E.rep + (cancelado ? -4 : lleno > 0.85 ? 6 : lleno > 0.5 ? 3 : -2) + (p.produccion === 'premium' ? 2 : 0), 0, 100));
    E.hist.push({ semana: s.semana, tipo: p.tipo, sede: p.sede, asistentes, resultado: res });
    lineaIngreso(R, 'Evento: resultado', res);
    linea(R, res >= 0 ? '💶' : '📉', `Resultado del evento: ${res >= 0 ? '+' : ''}${eur(res)}. Reputación como organizador/a ${Math.round(E.rep)}.`, res >= 0 ? 'bien' : 'mal');
    if (res > 15000) P2.celebrar(s, { tipo: 'venta', n: T[1], ic: T[0], precio: ingresos, beneficio: res });
    E.plan = null;
  }

  // =====================================================================
  // 📺 MEDIA & SPORTS
  // =====================================================================
  const MED = {
    canales: { video: ['🎬', 'Canal de vídeo', 0, 40], podcast: ['🎙️', 'Podcast', 2500, 25], tv: ['📺', 'Programa de televisión', 15000, 300] },
    presentadores: [['Sin fichaje', 0, 0], ['Periodista de radio local', 250, 0.02], ['Exjugador mediático', 900, 0.05], ['Estrella de la tele', 2600, 0.09]],
    derechos: { n: 'Derechos de la liga de tu deporte (una temporada)', coste: 18000, semanas: 16, extra: 0.5 },
    doc: { coste: 9000, semanas: 10 },
  };
  const media = s => (s.media && typeof s.media === 'object' ? s.media : (s.media = { activo: false, canales: ['video'], audiencia: 2000, frecuencia: 1, calidad: 1, presentador: 0, polemica: false, rep: 50, derechos: 0, doc: null, ganado: 0 }));
  function fundarMedia(s, R) {
    if (!expAbierta(s, 'media')) return 'Necesitas la expansión y tu primera empresa.';
    const M = media(s); if (M.activo) return 'Ya tienes tu productora.';
    if (s.p.dinero < 3000) return 'Necesitas 3.000 € para montar el estudio.';
    gasto(s, 3000); M.activo = true; M.audiencia = Math.round(1500 + (s.p.marca || 0) * 120);
    linea(R, '🎬', `Montas tu productora y tu canal: empiezas con ${M.audiencia.toLocaleString('es-ES')} espectadores gracias a tu marca personal.`, 'bien');
    return null;
  }
  function abrirCanal(s, id) {
    const M = media(s), C = MED.canales[id]; if (!M.activo || !C) return 'No se puede.'; if (M.canales.includes(id)) return 'Ya lo tienes.';
    if (id === 'tv' && M.audiencia < 20000) return 'La tele te recibe con 20.000 de audiencia.';
    if (s.p.dinero < C[2]) return `Necesitas ${eur(C[2])}.`;
    gasto(s, C[2]); M.canales.push(id); return null;
  }
  function configurarMedia(s, k, v) {
    const M = media(s); if (!M.activo) return 'No tienes productora.';
    if (k === 'frecuencia' && [1, 2, 3].includes(+v)) M.frecuencia = +v;
    else if (k === 'calidad' && [1, 2, 3].includes(+v)) M.calidad = +v;
    else if (k === 'presentador' && MED.presentadores[+v]) M.presentador = +v;
    else if (k === 'polemica') M.polemica = !M.polemica;
    else return 'No existe.';
    return null;
  }
  function comprarDerechos(s) {
    const M = media(s); if (!M.activo) return 'No tienes productora.'; if (M.derechos > 0) return 'Ya los tienes.';
    if (M.audiencia < 10000) return 'La liga solo vende a canales con 10.000 de audiencia.';
    if (s.p.dinero < MED.derechos.coste) return `Necesitas ${eur(MED.derechos.coste)}.`;
    gasto(s, MED.derechos.coste); M.derechos = MED.derechos.semanas; return null;
  }
  function documental(s) {
    const M = media(s); if (!M.activo) return 'No tienes productora.'; if (M.doc) return 'Ya estáis rodando uno.';
    if (s.p.dinero < MED.doc.coste) return `Necesitas ${eur(MED.doc.coste)}.`;
    gasto(s, MED.doc.coste); M.doc = { semanas: MED.doc.semanas, calidad: M.calidad }; return null;
  }
  function semanaMedia(s, R) {
    const M = media(s); if (!M.activo || !tieneExp(s, 'media')) return;
    const Pz = MED.presentadores[M.presentador];
    const crece = 0.006 * M.frecuencia + 0.008 * (M.calidad - 1) + Pz[2] + (M.polemica ? 0.03 : 0) + (M.derechos > 0 ? 0.04 : 0) + M.canales.length * 0.004 - 0.012;
    M.audiencia = Math.max(300, Math.round(M.audiencia * (1 + crece + (rnd(s) - 0.5) * 0.02)));
    if (M.polemica && rnd(s) < 0.1) { M.audiencia = Math.round(M.audiencia * 0.7); M.rep = r1(clamp(M.rep - 10, 0, 100)); s.p.marca = r1(clamp((s.p.marca || 0) - 2, 0, 100)); linea(R, '🔥', 'Una polémica se te va de las manos: −30 % de audiencia y tu imagen se resiente (−2 marca).', 'mal'); }
    else if (!M.polemica) M.rep = r1(clamp(M.rep + 0.3, 0, 100));
    if (M.derechos > 0) M.derechos--;
    const cpm = 9 * (0.7 + M.rep / 170);   // € por cada mil de audiencia y semana
    const ads = Math.round(M.audiencia / 1000 * cpm * M.frecuencia * (M.canales.includes('tv') ? 1.6 : 1) * (M.canales.includes('podcast') ? 1.15 : 1));
    const patro = M.audiencia >= 25000 ? Math.round(M.audiencia / 60) : 0;
    const costes = M.canales.reduce((a, c) => a + MED.canales[c][3], 0) * M.frecuencia + (M.calidad - 1) * 260 * M.frecuencia + Pz[1];
    const neto = ads + patro - costes;
    s.p.dinero += neto; M.ganado += neto; if (neto >= 0) s.acum.trabajo += neto; else s.acum.gastos -= neto;
    lineaIngreso(R, 'Media: publicidad y patrocinios', ads + patro); lineaIngreso(R, 'Media: producción y equipo', -costes);
    linea(R, '📺', `Media: ${M.audiencia.toLocaleString('es-ES')} de audiencia · ${neto >= 0 ? '+' : ''}${eur(neto)} esta semana.`, neto >= 0 ? 'bien' : 'mal');
    if (M.doc && --M.doc.semanas <= 0) {
      const v = Math.round(MED.doc.coste * (0.6 + M.doc.calidad * 0.45 + (s.p.marca || 0) / 70 + rnd(s) * 0.6));
      ingreso(s, v); linea(R, '🎞️', `Vendes tu documental a una plataforma por ${eur(v)} (${v >= MED.doc.coste ? 'beneficio' : 'pérdida'} de ${eur(Math.abs(v - MED.doc.coste))}).`, v >= MED.doc.coste ? 'bien' : 'mal');
      M.doc = null;
    }
  }
  const valorMedia = s => { const M = media(s); return M.activo ? Math.round(M.audiencia * 1.2 + M.canales.length * 3000) : 0; };

  // ---------- Integración ----------
  function semanaExpansiones(s, R) { semanaClub(s, R); semanaInm(s, R); semanaAgencia(s, R); semanaEventos(s, R); semanaMedia(s, R); }
  function valorExpansiones(s) {
    let v = 0;
    if (s.club) v += Math.round(valorClub(s.club) * s.club.pct / 100);
    if (s.inm) v += valorInmuebles(s);
    if (s.agencia) v += valorAgencia(s);
    if (s.media) v += valorMedia(s);
    return v;
  }
  // Secciones del juego (en el grupo Imperio): aparecen con la expansión y la primera empresa
  for (const [id, X] of Object.entries(EXP)) P2.SECCIONES.splice(P2.SECCIONES.findIndex(x => x.id === 'patrimonio'), 0, { id: X.seccion, ic: X.ic, n: X.n.replace('Propietario de club', 'Tu club').replace('Imperio inmobiliario', 'Inmuebles').replace('Agencia de deportistas', 'Agencia').replace('Organizador de eventos', 'Eventos').replace('Media & Sports', 'Media'),
    grupo: 'imperio', cond: s => expAbierta(s, id), d: `${X.n}: expansión desbloqueada.` });

  // Decisión: ofertas para un representado
  P2.DECISIONES.ofertaRepresentado = {
    vista(s, ev) {
      const r = agencia(s).representados.find(x => x.uid === ev.uid); if (!r) return { ic: '💼', titulo: 'Oferta', texto: 'Ya no está.', ops: [{ id: 'rechazar', n: 'Cerrar', ventaja: '', coste: '', riesgo: '' }] };
      return { ic: '💼', titulo: `Ofertas para ${r.n}`, texto: `${r.n} (${r.edad} años) ha llegado a nivel ${Math.round(r.nivel)}. Dos clubes lo quieren. Te llevas el 10 % de su sueldo.`,
        ops: ofertasRepresentado(s, r).map(o => ({ id: o.id, n: o.n, ventaja: `${eur(o.sueldo)}/semana (tu comisión ${eur(Math.round(o.sueldo * 0.1))})`, coste: o.d, riesgo: o.id === 'dinero' ? 'Mejora más despacio' : 'Cobra menos' }))
          .concat([{ id: 'rechazar', n: 'Esperar a algo mejor', ventaja: 'Sin compromiso', coste: 'No cobras comisión', riesgo: 'Se impacienta (−8 ánimo)' }]) };
    },
    resolver(s, ev, op, R) { resolverOfertaRepresentado(s, ev.uid, op, R); return { ic: '💼', titulo: 'Agencia', texto: 'Decidido.' }; },
  };

  Object.assign(P2, { EXP, tieneExp, expAbierta, semanaExpansiones, valorExpansiones,
    CLUB_K, clubesEnVenta, valorClub, controlas, precioParticipacion, comprarParticipacion, venderParticipacion, OPC_CLUB, configurarClub, ampliarEstadio, costeEstadio, buscarSponsorClub, aportarClub, retirarClub,
    INM, inm, valorInm, rentaInm, precioCompraInm, comprarInm, reformarInm, construirInm, venderInm, rentaAltaInm, cuotaSemanal, semanalesRecurrentes,
    agencia, capacidadAgencia, ojear, firmarProspecto, contratarOjeador, despedirOjeador, ofertasRepresentado, liberarRepresentado,
    EV, eventos, costeEvento, planificarEvento, cancelarEvento, demandaEvento,
    MED, media, fundarMedia, abrirCanal, configurarMedia, comprarDerechos, documental });
})(globalThis.P2 = globalThis.P2 || {});
