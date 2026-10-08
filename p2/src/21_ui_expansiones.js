/* =====================================================================
   21 · INTERFAZ DE LAS EXPANSIONES (club, inmuebles, agencia, eventos, media)
   Pantallas y acciones; la lógica está en 19_expansiones.js. H = ayudas de la interfaz (20_ui.js).
   ===================================================================== */
(function (P2) {
  'use strict';
  const UIX = P2.UIX = P2.UIX || { vistas: {}, acciones: {}, mundoExtra: [] };
  const btn = (act, txt, attrs = '', cls = 'btn w mini', dis = false) => `<button class="${cls}" data-act="${act}" ${attrs} ${dis ? 'disabled' : ''}>${txt}</button>`;
  const seg = (act, campo, ops, actual) => `<div class="seg">${ops.map(([v, n]) => `<button data-act="${act}" data-c="${campo}" data-v="${v}" class="${String(actual) === String(v) ? 'sel' : ''}">${n}</button>`).join('')}</div>`;
  // Sin la expansión (o reembolsada): se ve qué es y se puede ver la ficha. Lo que tenías se queda congelado.
  function bloqueo(s, id, H) {
    const X = P2.EXP[id];
    if (P2.tieneExp(s, id)) return null;
    return `<div class="card"><h2>${X.ic} ${H.esc(X.n)}</h2><p>Esta expansión no está en tu cuenta.${s.club || (s.inm && s.inm.props && s.inm.props.length) || (s.agencia && s.agencia.representados && s.agencia.representados.length) ? ' Lo que tenías está guardado y congelado: vuelve a estar activo con la expansión.' : ''}</p>
      <button class="btn full" data-act="uxPremium" data-v="${X.sku}">💎 Ver ${H.esc(X.n)}</button></div>`;
  }
  UIX.mundo = s => Object.values(P2.EXP).filter(X => (s.secciones || []).includes(X.seccion)).map(X => [X.seccion, X.ic, (P2.SECCIONES.find(x => x.id === X.seccion) || {}).n || X.n, '#334155']);
  UIX.acciones.uxPremium = (s, b, H) => H.premium(b.dataset.v);
  const hecho = (H, err, ok) => H.hecho(err ? `⚠️ ${err}` : null, err ? null : ok);
  const R0 = () => ({ lineas: [], porque: [], ingresos: [], hitos: [] });
  const conLineas = (H, fn) => { const R = R0(); const e = fn(R); H.hecho(e ? `⚠️ ${e}` : null, e ? null : (R.lineas[0] || [])[1]); };

  // =============== 🏟️ CLUB ===============
  UIX.vistas.club = (s, H) => {
    const b = bloqueo(s, 'club_owner', H); if (b) return b;
    const { esc, eur, kv, nf } = H, c = s.club;
    if (!c) return `<div class="card"><h2>🏟️ Tu club</h2><p>Compra participaciones de un club. Con el 51 % eres presidente/a: decides entradas, fichajes, entrenador, cantera, estadio y patrocinio. El club juega su liga: puede subir… o bajar.</p></div>
      ${P2.clubesEnVenta(s).map(X => { const L = P2.LIGAS[['regional', 'tercera', 'segunda', 'primera'][X.cat]];
        return `<div class="card"><h3>${X.ic} ${esc(X.n)}</h3>${kv('Categoría', esc(L.n))}${kv('Fuerza de la plantilla', X.fuerza)}${kv('Valor', eur(P2.precioParticipacion(s, X.id, 100) / 1.1))}
          <div class="fila2">${[10, 25, 51, 100].map(p => { const pr = P2.precioParticipacion(s, X.id, p); return btn('clubComprar', `${p} % · ${eur(pr)}`, `data-id="${X.id}" data-v="${p}"`, 'btn w', s.p.dinero < pr); }).join('')}</div></div>`; }).join('')}`;
    const L = P2.LIGAS[['regional', 'tercera', 'segunda', 'primera'][c.cat]], pres = P2.controlas(s), u = c.ultimo || {};
    const O = P2.OPC_CLUB;
    return `<div class="card"><h2>${c.ic} ${esc(c.n)}</h2><p class="small">${esc(L.n)} · temporada ${c.temp.num} · jornada ${c.temp.j} de ${P2.CLUB_K.jornadas}</p>
        ${kv('Tu parte', `${c.pct} %${pres ? ' · 👑 presidente/a' : ''}`)}${kv('Valor del club', eur(P2.valorClub(c)))}${kv('Tu parte vale', eur(Math.round(P2.valorClub(c) * c.pct / 100)))}
        ${kv('Puntos', `${c.temp.pts} (${c.temp.g}G ${c.temp.e}E ${c.temp.p}P)`)}${kv('Fuerza', `${nf(c.fuerza)} (la categoría: ${P2.CLUB_K.fuerzaMedia[c.cat]})`)}${kv('Afición', `${Math.round(c.aficion)}/100`)}
        ${kv('Caja del club', `<span class="${c.caja < 0 ? 'mal' : ''}">${eur(c.caja)}</span>`)}${u.neto != null ? kv('Última semana', `${u.neto >= 0 ? '+' : ''}${eur(u.neto)} · ${u.publico}/${u.aforo} de público`) : ''}
        ${c.sponsor ? kv('Patrocinador', `${esc(c.sponsor.n)} · ${eur(c.sponsor.semanal)}/sem · ${c.sponsor.semanas} sem`) : ''}${c.obras ? kv('Obras del estadio', `${c.obras} semanas`) : ''}</div>
      ${pres ? `<div class="card"><h3>👑 Decisiones de presidente/a</h3>
        <div class="sec">Entradas</div>${seg('clubConf', 'precio', Object.entries(O.precio).map(([k, v]) => [k, v[0]]), c.precio)}
        <div class="sec">Fichajes</div>${seg('clubConf', 'inversion', O.inversion.map((v, i) => [i, v[0]]), c.inversion)}
        <div class="sec">Banquillo</div>${seg('clubConf', 'entrenador', Object.entries(O.entrenador).map(([k, v]) => [k, v[0]]), c.entrenador)}
        <div class="fila2">${btn('clubConf', `${c.director ? '✅' : '➕'} Director deportivo (600 €/sem)`, 'data-c="director"', 'btn w')}${btn('clubConf', `${c.cantera ? '✅' : '➕'} Cantera (450 €/sem)`, 'data-c="cantera"', 'btn w')}</div>
        <div class="fila2">${btn('clubEstadio', c.estadio >= 3 ? 'Estadio al máximo' : `🏗️ Ampliar estadio (${eur(P2.costeEstadio(c))})`, '', 'btn w', c.estadio >= 3 || !!c.obras)}${btn('clubSponsor', '🤝 Buscar patrocinador', '', 'btn w', !!c.sponsor)}</div>
        <p class="small">Fichar sube la fuerza poco a poco, pero cuesta: la plantilla cobra cada semana. Sin caja no hay nóminas y el equipo se hunde.</p></div>` : '<div class="card"><p class="small">Con menos del 51 % no decides: cobras dividendos al acabar la temporada si el club tiene caja.</p></div>'}
      <div class="card"><h3>💶 Dinero</h3><div class="fila"><input id="clubImp" class="inp" type="number" min="0" step="1000" placeholder="Importe (€)">${btn('clubAportar', 'Poner', '', 'btn')}${pres ? btn('clubRetirar', 'Sacar', '', 'btn w') : ''}</div>
        <div class="fila2">${c.pct < 100 ? btn('clubComprar', `Comprar +10 % (${eur(P2.precioParticipacion(s, c.id, Math.min(10, 100 - c.pct)))})`, `data-id="${c.id}" data-v="10"`, 'btn w') : ''}${btn('clubVender', `Vender 10 % (${eur(Math.round(P2.valorClub(c) * Math.min(10, c.pct) / 100 * 0.95))})`, 'data-v="10"', 'btn w')}</div>
        ${btn('clubVender', H.ui.venderClub ? '⚠️ Toca otra vez para venderlo todo' : `Venderlo todo (${eur(Math.round(P2.valorClub(c) * c.pct / 100 * 0.95))})`, `data-v="${c.pct}" data-todo="1"`, 'btn r full')}</div>
      ${c.hist.length ? `<div class="card"><h3>📜 Temporadas</h3>${c.hist.map(h => kv(`T${h.num} · ${esc(P2.LIGAS[['regional', 'tercera', 'segunda', 'primera'][h.cat]].corto)}`, `${h.pos}º · ${h.pts} pts${h.mov > 0 ? ' · ⬆️' : h.mov < 0 ? ' · ⬇️' : ''}`)).join('')}</div>` : ''}`;
  };
  UIX.acciones.clubComprar = (s, b, H) => conLineas(H, R => P2.comprarParticipacion(s, b.dataset.id, +b.dataset.v, R));
  UIX.acciones.clubVender = (s, b, H) => { if (b.dataset.todo && !H.ui.venderClub) { H.ui.venderClub = true; H.render(); return; } H.ui.venderClub = false; conLineas(H, R => P2.venderParticipacion(s, +b.dataset.v, R)); };
  UIX.acciones.clubConf = (s, b, H) => hecho(H, P2.configurarClub(s, b.dataset.c, b.dataset.v));
  UIX.acciones.clubEstadio = (s, b, H) => hecho(H, P2.ampliarEstadio(s), '🏗️ Empiezan las obras (8 semanas).');
  UIX.acciones.clubSponsor = (s, b, H) => conLineas(H, R => P2.buscarSponsorClub(s, R));
  UIX.acciones.clubAportar = (s, b, H) => hecho(H, P2.aportarClub(s, Math.round(+(H.$('clubImp') || {}).value || 0)), '💶 Dinero puesto en la caja del club.');
  UIX.acciones.clubRetirar = (s, b, H) => hecho(H, P2.retirarClub(s, Math.round(+(H.$('clubImp') || {}).value || 0)), '💶 Dinero sacado de la caja del club.');

  // =============== 🏢 INMUEBLES ===============
  UIX.vistas.inmuebles = (s, H) => {
    const b = bloqueo(s, 'real_estate', H); if (b) return b;
    const { esc, eur, kv, nf } = H, I = P2.inm(s);
    const EST = { alquilado: '✅ Alquilado', vacio: '🔑 Buscando inquilino', obras: '🔨 En obras', licencia: '📄 Esperando licencia', solar: '🌱 Solar' };
    const mis = I.props.map(p => { const T = P2.INM[p.tipo];
      return `<div class="card inm"><h3>${T.ic} ${esc(T.n)}</h3>${kv('Estado', `${EST[p.estado] || p.estado}${p.obras && (p.estado === 'obras' || p.estado === 'licencia') ? ` · ${p.obras} sem` : ''}${p.impago ? ' · ⚠️ impago' : ''}`)}
        ${kv('Vale', eur(P2.valorInm(s, p)))}${T.renta ? kv('Renta', `${eur(P2.rentaInm(s, p))}/semana${p.rentaAlta ? ' (alta)' : ''}`) : ''}${kv('Reforma', `${p.reforma}/2`)}
        ${p.hipoteca ? kv('Hipoteca', `${eur(p.hipoteca.deuda)} · ${eur(p.hipoteca.cuota)}/sem`) : ''}${p.promotor ? kv('Préstamo promotor', `${eur(p.promotor.deuda)} · ${eur(p.promotor.cuota)}/sem`) : ''}
        <div class="fila2">${p.tipo === 'terreno' && p.estado === 'solar' ? btn('inmConstruir', `🏗️ Construir edificio (entrada ${eur(Math.round(P2.INM.terreno.construir.coste * 0.2))})`, `data-id="${p.uid}"`, 'btn w') : ''}
          ${T.renta && p.reforma < 2 && !['obras', 'licencia'].includes(p.estado) ? btn('inmReformar', `🔨 Reformar (${eur(Math.round(T.precio * (p.reforma ? 0.16 : 0.08)))})`, `data-id="${p.uid}"`, 'btn w') : ''}
          ${T.renta ? btn('inmRenta', p.rentaAlta ? 'Bajar a renta normal' : 'Pedir renta alta (+20 %)', `data-id="${p.uid}"`, 'btn w') : ''}
          ${btn('inmVender', H.ui.venderInm === p.uid ? '⚠️ Toca otra vez' : `Vender (${eur(P2.valorInm(s, p))})`, `data-id="${p.uid}"`, 'btn w', ['obras', 'licencia'].includes(p.estado))}</div></div>`; }).join('');
    const mercado = Object.entries(P2.INM).map(([k, T]) => { const pr = P2.precioCompraInm(s, k);
      return `<div class="kv"><span>${T.ic} <b>${esc(T.n)}</b><br><span class="small">${T.renta ? `renta ≈ ${eur(Math.round(T.renta * Math.sqrt(I.mercado)))}/sem` : `construir: ${eur(T.construir.coste)}, ${T.construir.licencia + T.construir.obras} semanas`}</span></span>
        <span class="col">${btn('inmComprar', `Comprar ${eur(Math.round(pr * 1.1))}`, `data-v="${k}"`, 'btn mini', s.p.dinero < pr * 1.1)}${btn('inmComprar', `Con hipoteca ${eur(Math.round(pr * 0.4))}`, `data-v="${k}" data-f="1"`, 'btn w mini', s.p.dinero < pr * 0.4)}</span></div>`; }).join('');
    const rentas = I.props.filter(p => p.estado === 'alquilado').reduce((a, p) => a + P2.rentaInm(s, p), 0);
    return `<div class="card"><h2>🏢 Inmuebles</h2>${kv('Mercado', `${nf(Math.round(I.mercado * 100))} (base 100)`)}${kv('Euríbor', `${(I.euribor * 100).toFixed(2).replace('.', ',')} %`)}${kv('Rentas por semana', eur(rentas))}${kv('Patrimonio neto inmobiliario', eur(I.props.reduce((a, p) => a + P2.valorInm(s, p) - (p.hipoteca ? p.hipoteca.deuda : 0) - (p.promotor ? p.promotor.deuda : 0), 0)))}
        <p class="small">Comprar cuesta un 10 % en gastos. Con hipoteca pones el 30 % de entrada y el banco solo te la da si la cuota cabe en el 40 % de tus ingresos. Vender cuesta un 4 % de comisión.</p></div>
      ${mis || '<div class="card"><p class="small">Aún no tienes inmuebles.</p></div>'}<div class="sec"><span>🛒 En venta</span></div><div class="card">${mercado}</div>`;
  };
  UIX.acciones.inmComprar = (s, b, H) => conLineas(H, R => P2.comprarInm(s, b.dataset.v, !!b.dataset.f, R));
  UIX.acciones.inmReformar = (s, b, H) => hecho(H, P2.reformarInm(s, b.dataset.id), '🔨 Empiezan las obras (6 semanas sin alquilar).');
  UIX.acciones.inmConstruir = (s, b, H) => hecho(H, P2.construirInm(s, b.dataset.id), '📄 Pides la licencia de obras.');
  UIX.acciones.inmRenta = (s, b, H) => hecho(H, P2.rentaAltaInm(s, b.dataset.id));
  UIX.acciones.inmVender = (s, b, H) => { if (H.ui.venderInm !== b.dataset.id) { H.ui.venderInm = b.dataset.id; H.render(); return; } H.ui.venderInm = null; conLineas(H, R => P2.venderInm(s, b.dataset.id, R)); };

  // =============== 💼 AGENCIA ===============
  UIX.vistas.agencia = (s, H) => {
    const b = bloqueo(s, 'sports_agency', H); if (b) return b;
    const { esc, eur, kv, nf } = H, A = P2.agencia(s), cap = P2.capacidadAgencia(A);
    return `<div class="card"><h2>💼 Agencia de deportistas</h2>${kv('Reputación de la agencia', `${Math.round(A.rep)}/100`)}${kv('Representados', `${A.representados.length} de ${cap}`)}${kv('Ojeadores y agentes', `${A.ojeadores} (260 €/sem cada uno)`)}${kv('Comisiones ganadas', eur(A.ganado))}
        <p class="small">Te llevas el 10 % del sueldo y el 15 % de los patrocinios de tus representados. Si llevas a más de los que puedes atender, o no les das minutos, se van.</p>
        <div class="fila2">${btn('agOjear', `🔎 Ojear promesas (${eur(150 + 100 * A.ojeadores)})`, '', 'btn')}${btn('agOjeador', '➕ Contratar ojeador', '', 'btn w', A.ojeadores >= 4)}</div>${A.ojeadores ? btn('agDespedir', 'Despedir un ojeador', '', 'btn w full') : ''}</div>
      ${A.prospectos.length ? `<div class="sec"><span>🌟 Promesas</span></div>${A.prospectos.map(p => `<div class="card"><h3>${esc(p.n)} · ${p.edad} años</h3>${kv('Nivel', p.nivel)}${kv('Potencial (estimado)', `${p.est[0]}–${p.est[1]}`)}${kv('Firma', eur(p.firma))}
        ${btn('agFirmar', `✍️ Firmarle (${eur(p.firma)})`, `data-id="${p.uid}"`, 'btn full', s.p.dinero < p.firma)}</div>`).join('')}` : ''}
      ${A.representados.length ? `<div class="sec"><span>✍️ Tus representados</span></div>${A.representados.map(r => `<div class="card"><h3>${esc(r.n)} · ${r.edad} años</h3>${kv('Nivel', nf(r.nivel))}${kv('Club', r.club ? esc(r.club) : 'Sin club aún')}${kv('Sueldo', r.sueldo ? `${eur(r.sueldo)}/sem (tu 10 %: ${eur(Math.round(r.sueldo * 0.1))})` : '—')}
        ${r.sponsor ? kv('Patrocinio', `${eur(r.sponsor)}/sem (tu 15 %: ${eur(Math.round(r.sponsor * 0.15))})`) : ''}${kv('Ánimo', `${Math.round(r.animo)}/100${r.animo < 40 ? ' ⚠️' : ''}`)}${kv('Desarrollo', r.desarrollo > 1 ? '🚀 rápido' : r.desarrollo < 1 ? '🐢 lento' : 'normal')}
        ${btn('agLiberar', H.ui.liberar === r.uid ? '⚠️ Toca otra vez' : 'Dejar de representarle', `data-id="${r.uid}"`, 'btn w full')}</div>`).join('')}` : ''}`;
  };
  UIX.acciones.agOjear = (s, b, H) => conLineas(H, R => P2.ojear(s, R));
  UIX.acciones.agOjeador = (s, b, H) => hecho(H, P2.contratarOjeador(s), '🧑‍💼 Nuevo ojeador: mejores promesas y más capacidad.');
  UIX.acciones.agDespedir = (s, b, H) => hecho(H, P2.despedirOjeador(s));
  UIX.acciones.agFirmar = (s, b, H) => conLineas(H, R => P2.firmarProspecto(s, b.dataset.id, R));
  UIX.acciones.agLiberar = (s, b, H) => { if (H.ui.liberar !== b.dataset.id) { H.ui.liberar = b.dataset.id; H.render(); return; } H.ui.liberar = null; hecho(H, P2.liberarRepresentado(s, b.dataset.id)); };

  // =============== 🎪 EVENTOS ===============
  UIX.vistas.eventos = (s, H) => {
    const b = bloqueo(s, 'events', H); if (b) return b;
    const { esc, eur, kv } = H, E = P2.eventos(s), EV = P2.EV;
    if (E.plan) { const p = E.plan, T = EV.tipos[p.tipo];
      return `<div class="card"><h2>${T[0]} ${esc(T[1])}</h2>${kv('Fecha', `semana ${p.semana} (faltan ${p.semana - s.semana})`)}${kv('Sede', `${esc(EV.sedes[p.sede][0])} · ${EV.sedes[p.sede][1]} plazas`)}${kv('Entrada', eur(EV.precios[p.precio]))}
        ${kv('Estrellas invitadas', p.estrellas)}${kv('Producción', EV.produccion[p.produccion][0])}${kv('Televisión', p.tv ? 'Sí' : 'No')}${kv('Seguro', p.seguro ? 'Sí' : 'No')}${p.sponsor ? kv('Patrocinio', eur(p.sponsor)) : ''}
        ${kv('Coste total', eur(p.total))}${kv('Ya pagado (señal)', eur(p.senal))}${kv('Público esperado', `≈ ${Math.min(EV.sedes[p.sede][1], P2.demandaEvento(s, p))}`)}
        ${btn('evCancelar', H.ui.evCancelar ? '⚠️ Toca otra vez (pierdes la señal)' : 'Cancelar el evento', '', 'btn r full')}</div>`; }
    const p = H.ui.ev = Object.assign({ tipo: 'torneo', sede: 'local', precio: 1, estrellas: 0, produccion: 'basica', semanas: 4, seguro: false, tv: false }, H.ui.ev || {});
    const coste = P2.costeEvento(p), dem = P2.demandaEvento(s, p), cap = EV.sedes[p.sede][1];
    return `<div class="card"><h2>🎪 Organiza un evento</h2>${kv('Tu reputación como organizador/a', `${Math.round(E.rep)}/100`)}
        <div class="sec">Qué</div>${seg('evSet', 'tipo', Object.entries(EV.tipos).map(([k, v]) => [k, `${v[0]} ${v[1]}`]), p.tipo)}
        <div class="sec">Dónde</div>${seg('evSet', 'sede', Object.entries(EV.sedes).map(([k, v]) => [k, `${v[0]} (${v[1]})`]), p.sede)}
        <div class="sec">Entrada</div>${seg('evSet', 'precio', EV.precios.map((v, i) => [i, eur(v)]), p.precio)}
        <div class="sec">Estrellas invitadas (${eur(EV.estrella)} cada una)</div>${seg('evSet', 'estrellas', [0, 1, 2, 3].map(i => [i, String(i)]), p.estrellas)}
        <div class="sec">Producción</div>${seg('evSet', 'produccion', Object.entries(EV.produccion).map(([k, v]) => [k, `${v[0]} (${eur(v[1])})`]), p.produccion)}
        <div class="sec">Cuándo</div>${seg('evSet', 'semanas', [3, 4, 6, 8].map(i => [i, `en ${i} semanas`]), p.semanas)}
        <div class="fila2">${btn('evSet', `${p.seguro ? '✅' : '➕'} Seguro de cancelación`, 'data-c="seguro"', 'btn w')}${btn('evSet', `${p.tv ? '✅' : '➕'} Retransmisión`, 'data-c="tv"', 'btn w')}</div>
        ${kv('Coste total', eur(coste))}${kv('Señal ahora (30 %)', eur(Math.round(coste * 0.3)))}${kv('Público esperado', `≈ ${Math.min(cap, dem)} de ${cap}${dem > cap ? ' (se llenaría)' : ''}`)}
        ${EV.tipos[p.tipo][3] ? '<p class="small">☔ Al aire libre: si llueve, viene menos gente o se cancela (el seguro cubre la cancelación).</p>' : ''}
        ${btn('evPlanificar', '📅 Reservar y organizar', '', 'btn full')}</div>
      ${E.hist.length ? `<div class="card"><h3>📜 Eventos</h3>${E.hist.slice(-8).reverse().map(h => kv(`S${h.semana} · ${esc(EV.tipos[h.tipo][1])}`, `${h.asistentes} personas · ${h.resultado >= 0 ? '+' : ''}${eur(h.resultado)}`)).join('')}</div>` : ''}`;
  };
  UIX.acciones.evSet = (s, b, H) => { const p = H.ui.ev || {}, c = b.dataset.c, v = b.dataset.v; if (c === 'seguro' || c === 'tv') p[c] = !p[c]; else p[c] = /^\d+$/.test(v) ? +v : v; H.ui.ev = p; H.render(); };
  UIX.acciones.evPlanificar = (s, b, H) => conLineas(H, R => P2.planificarEvento(s, H.ui.ev, R));
  UIX.acciones.evCancelar = (s, b, H) => { if (!H.ui.evCancelar) { H.ui.evCancelar = true; H.render(); return; } H.ui.evCancelar = false; conLineas(H, R => P2.cancelarEvento(s, R)); };

  // =============== 📺 MEDIA ===============
  UIX.vistas.media = (s, H) => {
    const b = bloqueo(s, 'media', H); if (b) return b;
    const { esc, eur, kv } = H, M = P2.media(s), MED = P2.MED;
    if (!M.activo) return `<div class="card"><h2>📺 Media & Sports</h2><p>Monta tu productora: un canal de vídeo para empezar, y luego podcast, programa de televisión, derechos de retransmisión y documentales. Tu marca personal trae la primera audiencia.</p>${btn('mdFundar', '🎬 Montar la productora (3.000 €)', '', 'btn full', s.p.dinero < 3000)}</div>`;
    return `<div class="card"><h2>📺 Tu productora</h2>${kv('Audiencia', M.audiencia.toLocaleString('es-ES'))}${kv('Reputación del medio', `${Math.round(M.rep)}/100`)}${kv('Ganado en total', eur(M.ganado))}${M.derechos ? kv('Derechos de la liga', `${M.derechos} semanas`) : ''}${M.doc ? kv('Documental', `rodando · ${M.doc.semanas} sem`) : ''}
        <div class="sec">Programas por semana</div>${seg('mdConf', 'frecuencia', [[1, '1'], [2, '2'], [3, '3']], M.frecuencia)}
        <div class="sec">Producción</div>${seg('mdConf', 'calidad', [[1, 'Casera'], [2, 'Cuidada'], [3, 'Profesional']], M.calidad)}
        <div class="sec">Presentador/a</div>${seg('mdConf', 'presentador', MED.presentadores.map((p, i) => [i, `${p[0]}${p[1] ? ` (${eur(p[1])}/sem)` : ''}`]), M.presentador)}
        <div class="fila2">${btn('mdConf', `${M.polemica ? '🔥 Polémica activada' : '😇 Sin polémica'}`, 'data-c="polemica"', 'btn w')}${btn('mdDerechos', `📡 Derechos (${eur(MED.derechos.coste)})`, '', 'btn w', M.derechos > 0)}</div>
        <p class="small">La polémica sube la audiencia rápido, pero a veces explota: −30 % y tu imagen se resiente.</p></div>
      <div class="card"><h3>📡 Canales</h3>${Object.entries(MED.canales).map(([k, C]) => kv(`${C[0]} ${esc(C[1])}`, M.canales.includes(k) ? `✅ (${eur(C[3])}/programa)` : btn('mdCanal', `Abrir (${eur(C[2])})`, `data-v="${k}"`, 'btn mini'))).join('')}</div>
      <div class="card"><h3>🎞️ Productora</h3><p class="small">Un documental tarda ${MED.doc.semanas} semanas. Se vende mejor con más calidad y más marca personal.</p>${btn('mdDoc', `Rodar un documental (${eur(MED.doc.coste)})`, '', 'btn full', !!M.doc)}</div>`;
  };
  UIX.acciones.mdFundar = (s, b, H) => conLineas(H, R => P2.fundarMedia(s, R));
  UIX.acciones.mdCanal = (s, b, H) => hecho(H, P2.abrirCanal(s, b.dataset.v), '📡 Nuevo canal abierto.');
  UIX.acciones.mdConf = (s, b, H) => hecho(H, P2.configurarMedia(s, b.dataset.c, b.dataset.v));
  UIX.acciones.mdDerechos = (s, b, H) => hecho(H, P2.comprarDerechos(s), '📡 Derechos comprados: la audiencia se dispara.');
  UIX.acciones.mdDoc = (s, b, H) => hecho(H, P2.documental(s), '🎞️ Empieza el rodaje.');
})(globalThis.P2 = globalThis.P2 || {});
