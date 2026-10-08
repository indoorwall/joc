/* =====================================================================
   20 · INTERFAZ (móvil): SITUACIÓN → DECISIÓN → CONSECUENCIA
   Solo pinta y llama a jugarSemana / resolverDecision / acciones de gestión.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, OFERTAS, OBJETIVOS, LIGAS, MARCAS, NEGOCIOS, HITOS, OPORTUNIDADES, esc, eur, nf, fmt, clamp } = P2;
  let S = null;
  const ui = { vista: 'semana', reinicio: false, balance: null, msg: '', look: null, capa: 'pelo', nombre: 'Alex' };
  const $ = id => document.getElementById(id);

  // ---------- Utilidades de pintado ----------
  const pill = (ic, v, cls = '') => `<span class="pill ${cls}">${ic} <span class="num">${v}</span></span>`;
  const dato = (t, v) => `<div class="dato"><small>${t}</small><b>${v}</b></div>`;
  const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
  const chip = (t, cls = '') => `<span class="chip ${cls}">${t}</span>`;
  const linea = ([ic, t, cls]) => `<div class="lin ${cls || ''}"><span class="ic">${ic}</span><span>${esc(t)}</span></div>`;
  const opcion = (o, act, extra = '', cls = '') => `<button class="opt ${o.prin ? 'prin' : ''} ${cls}" data-act="${act}" data-id="${esc(o.id)}" ${o.bloqueo ? 'disabled' : ''} ${extra} ${act === 'elegir' ? `aria-pressed="${cls === 'elegida'}"` : ''}>
      <b>${esc(o.n)}</b>
      <span class="ls">${o.ventaja ? `<span class="l"><i class="v">✓</i> ${esc(o.ventaja)}</span>` : ''}${o.coste ? `<span class="l"><i class="c">−</i> ${esc(o.coste)}</span>` : ''}${o.riesgo && o.riesgo !== 'Ninguno' ? `<span class="l"><i class="r">⚠</i> ${esc(o.riesgo)}</span>` : ''}</span>
      ${o.ocupaSemana ? '<span class="ocupa">⏳ Ocupa la semana entera</span>' : ''}
      ${o.bloqueo ? `<span class="bl">🔒 ${esc(o.bloqueo)}</span>` : ''}</button>`;

  function nombreFase(s) {
    const O = P2.oferta(s);
    if (s.fase === 'barrio') return `Captación · semana ${s.semana} de ${CFG.captacion.semanas}`;
    if (s.fase === 'pruebas') return `Preparando las pruebas · semana ${s.semana}`;
    if (s.fase === 'amateur') return `${O.n} (amateur) · semana ${s.semana}`;
    return `${O.n} · semana ${s.semana}`;
  }

  // ---------- Cabecera y navegación ----------
  function htmlTop(s) {
    return `<button class="hava" data-act="vista" data-v="personaje" aria-label="Tu personaje">${P2.avatarSVG(s, null, 'busto')}</button>
      <div class="hwho"><b>${esc(s.nombre)}</b><span>${esc(nombreFase(s))}</span></div>
      <div class="hres">${pill('💶', fmt(s.p.dinero), s.p.dinero < 0 ? 'mal' : 'oro')}${pill('⚡', Math.round(s.p.energia), s.p.energia < 30 ? 'mal' : '')}${pill('⭐', Math.floor(s.p.rep))}${(s.secciones || []).includes('marcas') ? pill('📣', Math.floor(s.p.marca || 0)) : ''}</div>`;
  }
  function htmlNav(s) {
    const b = (v, ic, t, aviso) => `<button data-act="vista" data-v="${v}" class="${ui.vista === v ? 'sel' : ''}"><span>${ic}</span>${t}${(s.seccionesNuevas || []).includes(v) ? '<em>Nuevo</em>' : aviso ? '<i></i>' : ''}</button>`;
    const avisoEmp = s.negocios.some(n => n.crisis) || (!s.negocios.length && !P2.bloqueoCompra(s, 'peluqueria', 0)) || (s.oportunidadAbierta && !s.oportunidad);
    const avisoMarcas = s.fase === 'club' && MARCAS.some(M => !P2.bloqueoMarca(s, M));
    const aviso = { semana: s.pendiente && ui.vista !== 'semana', empresa: avisoEmp, marcas: avisoMarcas };
    const l = P2.seccionesVisibles(s);
    return `<div class="tabs" style="grid-template-columns:repeat(${l.length},1fr)">${l.map(x => b(x.id, x.ic, x.n, aviso[x.id])).join('')}</div>`;
  }

  // ---------- SITUACIÓN ----------
  function htmlSituacion(s) {
    const P = s.p, K = CFG.captacion;
    let escena = '', titulo = '', datos = '', extra = '';
    if (s.fase === 'barrio') {
      const quedan = P2.semanasCaptacion(s);
      escena = `🏘️ ⚽ 🛵 <b>Barrio de ${esc(s.ciudad)}</b>`;
      titulo = `Te quedan ${quedan} ${quedan === 1 ? 'semana' : 'semanas'} para conseguir una prueba`;
      datos = dato('Nivel', nf(P.nivel)) + dato('Energía', Math.round(P.energia)) + dato('Reputación', `${Math.floor(P.rep)}/${K.repOjeador}`) + dato('Ahorros', eur(P.dinero));
      const jProx = K.jornadasAbiertas.find(w => w >= s.semana), tProx = K.torneo.find(w => w >= s.semana);
      extra = `<div class="barra ${quedan <= 2 ? 'urg' : ''}"><i style="width:${Math.round(100 * (s.semana - 1) / K.semanas)}%"></i></div>
        <div class="caminos">Caminos: <b>👀 reputación ${K.repOjeador}</b> · <b>📋 ${jProx ? `jornada sem. ${jProx}` : 'jornada pasada'}</b> · <b>🏆 ${tProx ? `torneo sem. ${tProx}` : 'torneo pasado'}</b> · <b class="${P.dinero >= 400 ? 'ok' : ''}">🎓 ${s.semana <= 7 ? 'campus 400 €' : 'campus cerrado'}</b>. Sin prueba: equipo amateur y repesca.</div>`;
    } else if (s.fase === 'pruebas') {
      const inv = s.invitacion, k = inv.dia - s.semana + 1;
      const est = Math.round(P2.puntuacionPruebas(Object.assign(P2.copia(s), { rng: 1 }), inv.via).partes.filter(([t]) => t !== 'Suerte del día').reduce((a, [, v]) => a + v, 0));
      const ofs = P2.ofertasPorPuntuacion(est);
      escena = `📋 🏟️ <b>Pruebas: ${k <= 1 ? 'al final de esta semana' : `en ${k} semanas`}</b>`;
      titulo = `Ahora mismo sacarías un ${est} (± ${CFG.pruebas.suerte} de suerte)`;
      datos = dato('Nivel', nf(P.nivel)) + dato('Energía', Math.round(P.energia)) + dato('Reputación', Math.floor(P.rep)) + dato('Preparador', s.preparador ? '+3' : 'No');
      extra = `<div class="ctx">${ofs.length ? `Con ${est}: ${ofs.map(o => OFERTAS[o].n + (o === 'atleticoFormacion' ? ' (formación)' : o === 'atleticoFilial' ? ' (filial)' : '')).join(' y ')}.` : `Con ${est} no llegas a ${CFG.pruebas.rangos[2].min}: ningún contrato profesional.`} ${CFG.pruebas.rangos.filter(r => r.min > -99).map(r => `${r.min}+`).join(' · ')}</div>`;
    } else {
      const T = s.temporada, O = P2.oferta(s), pj = P2.partidoDeLaJornada(T), pos = P2.posicion(T), pt = P2.probTitular(s);
      escena = `🏟️ ${O.ic} <b>${esc(O.n)} · ${esc(LIGAS[T.liga].corto)}</b>`;
      titulo = pj ? `Jornada ${pj.j + 1} de ${T.calendario.length}: ${pj.local ? 'en casa contra' : 'visitas a'} ${esc(P2.nombreEquipo(T, pj.rival))}` : 'Temporada terminada';
      datos = dato('Posición', T.jornada ? `${pos}º/${T.calendario[0].length * 2}` : '—') + dato('Objetivo', OBJETIVOS[P2.objetivoDe(T)].corto) +
        dato('Confianza', `${Math.round(s.confianza)}`) + dato('Titular', pt ? pt.nivel.replace('nula', 'no juegas') : '—');
      const ctx = P2.contexto(T);
      extra = `${ctx.length ? `<div class="ctx">${esc(ctx.join(' '))}</div>` : ''}
        ${s.fase === 'amateur' ? `<p class="small">Repesca para ser profesional en ${CFG.amateur.repescaCada - ((s.amateurSemanas || 0) % CFG.amateur.repescaCada)} semanas.</p>` : ''}
        ${P.lesion ? `<p class="small">🤕 Lesionado/a: ${P.lesion} ${P.lesion === 1 ? 'semana' : 'semanas'}.</p>` : ''}`;
    }
    const H = P2.siguienteHito(s);
    return `<div class="card sit"><div class="escena">${escena}</div><div class="in"><h2>${titulo}</h2><div class="datos">${datos}</div>${extra}
      ${H ? `<div class="prox">🎯 Siguiente hito: <b>${esc(H.n)}</b></div>` : ''}</div></div>`;
  }

  // ---------- DECISIÓN ----------
  function htmlDecision(s) {
    const v = P2.vistaPendiente(s);
    if (v) {
      return `<div class="sec"><span>Decisión</span></div><div class="card dec evento ${v.fiesta ? 'fiesta' : ''}"><h2><span>${v.ic}</span>${esc(v.titulo)}</h2>${v.texto ? `<p>${esc(v.texto)}</p>` : ''}
        ${v.ops.map(o => opcion(o, 'decidir')).join('')}</div>`;
    }
    const l = P2.accionesDisponibles(s);
    const tit = s.fase === 'club' || s.fase === 'amateur' ? '¿Qué haces esta semana, además del partido?' : '¿Qué haces esta semana?';
    return `<div class="sec"><span>Decisión</span><span>elige y pulsa «Jugar semana»</span></div><div class="card dec"><h3>${tit}</h3>
      ${l.filter(x => !x.bloqueo).map(({ id, A }) => { const sel = id === eleccion(s); return opcion({ id, n: `${A.ic} ${A.n}`, ventaja: A.ventaja, coste: sel ? A.coste : '', riesgo: sel ? A.riesgo : '' }, 'elegir', '', sel ? 'elegida' : 'compacta'); }).join('')}
      ${l.filter(x => x.bloqueo).map(({ id, A, bloqueo }) => `<button class="opt mini" disabled><b>${A.ic} ${esc(A.n)}</b><span class="bl">🔒 ${esc(bloqueo)}</span></button>`).join('')}</div>`;
  }

  // Acción elegida para la semana: la tuya si sigue disponible; si no, la primera que se puede hacer
  // Acción elegida para la semana: solo la que el jugador ha tocado (nunca se elige sola)
  function eleccion(s) {
    const libres = P2.accionesDisponibles(s).filter(x => !x.bloqueo).map(x => x.id);
    return libres.includes(s.eleccion) ? s.eleccion : null;
  }
  function htmlBoton(s) {
    if (s.pendiente) return '';   // la decisión pendiente es lo que toca: el botón vuelve después
    const id = eleccion(s), A = P2.ACCIONES[id];
    if (!A) return `<button class="jugar" id="jugar" disabled>Jugar semana<small>Elige qué haces esta semana</small></button>`;
    return `<button class="jugar" id="jugar" data-act="jugar">▶ Jugar semana<small>${A.ic} ${esc(A.n)}${s.fase === 'club' || s.fase === 'amateur' ? ' + partido' : ''}</small></button>`;
  }

  // ---------- CONSECUENCIA ----------
  function htmlConsecuencia(s) {
    let h = '';
    if (ui.desbloqueos && ui.desbloqueos.length) h += `<div class="card">${ui.desbloqueos.map(htmlDesbloqueo).join('')}</div>`;
    const D = s.ultimaDecision;
    if (D && D.semana === s.semana && !D.semanaJugada) {
      h += `<div class="card"><h3>${D.ic} ${esc(D.titulo)}</h3><p>${esc(D.texto)}</p>${(D.lineas || []).map(linea).join('')}${(D.hitos || []).map(htmlHito).join('')}${(D.desbloqueos || []).map(htmlDesbloqueo).join('')}</div>`;
    }
    const R = s.ultimo;
    if (R) {
      const chips = [chip(`💶 ${R.dinero >= 0 ? '+' : '−'}${fmt(Math.abs(R.dinero))} €`, R.dinero > 0 ? 'bien' : R.dinero < 0 ? 'mal' : ''), chip(`⚡ ${R.energia >= 0 ? '+' : ''}${Math.round(R.energia)}`, R.energia < -10 ? 'mal' : '')];
      if (R.partido && R.partido.nota != null) chips.push(chip(`📝 nota ${nf(R.partido.nota)}`, R.partido.nota >= 6.5 ? 'bien' : R.partido.nota < 5.5 ? 'mal' : ''));
      h += `<div class="sec"><span>Consecuencia</span><span>semana ${R.semana}</span></div><div class="card">
        <div class="resumen">${chips.join('')}</div>
        ${R.hitos.map(htmlHito).join('')}${(R.desbloqueos || []).map(htmlDesbloqueo).join('')}
        ${R.lineas.slice(0, 4).map(linea).join('')}${R.lineas.length > 4 ? `<details class="por mas"><summary>Ver ${R.lineas.length - 4} más</summary>${R.lineas.slice(4).map(linea).join('')}</details>` : ''}
        ${R.ingresos.length ? `<details class="por"><summary>💶 Tus cuentas de la semana</summary>${R.ingresos.map(([t, v]) => kv(esc(t), `${v >= 0 ? '+' : '−'}${eur(Math.abs(v))}`)).join('')}</details>` : ''}
        ${R.porque.length ? `<details class="por"><summary>❓ ¿Por qué ha pasado esto?</summary>${R.porque.map(t => `<p>${esc(t)}</p>`).join('')}</details>` : ''}</div>`;
    }
    return h;
  }
  const htmlDesbloqueo = x => `<div class="hito desb">🔓 <b>Nueva sección: ${x.ic} ${esc(x.n)}</b><br>${esc(x.d || '')} La tienes abajo, en la barra.</div>`;
  const htmlHito = H => `<div class="hito">🏅 <b>Hito: ${esc(H.n)}</b><br>Se abre: ${esc(H.abre)}</div>`;

  // ---------- Vistas ----------
  function htmlLiga(s) {
    if (!s.temporada) return `<div class="card"><h2>📊 Liga</h2><p>Aún no tienes equipo. Consigue una prueba y firma tu primer contrato.</p></div>`;
    const T = s.temporada, L = LIGAS[T.liga], O = P2.oferta(s), tabla = P2.clasificacion(T), n = tabla.length, Z = P2.zonas(T.liga);
    const prox = [0, 1, 2].map(i => P2.partidoDeLaJornada(T, T.jornada + i)).filter(Boolean);
    const ult = T.resultados.slice(-3).map((j, i) => { const m = j.find(x => x.l === T.yo || x.v === T.yo); return `${P2.nombreEquipo(T, m.l)} ${m.gl}-${m.gv} ${P2.nombreEquipo(T, m.v)}`; });
    const c = s.contrato;
    return `<div class="card"><h2>${esc(L.n)}</h2><p class="small">Jornada ${T.jornada} de ${T.calendario.length} · ${Z.asc ? `suben ${Z.asc} a ${esc(LIGAS[L.sube].corto)}` : 'categoría más alta: se juega el título'}${Z.desc ? ` · bajan ${Z.desc} a ${esc(LIGAS[L.baja].corto)}` : ' · no hay descenso'}</p>
      <table><tr><th>#</th><th>Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr>
      ${tabla.map((r, i) => `<tr class="${r.id === T.yo ? 'yo' : ''} ${i < Z.asc ? 'asc' : i >= n - Z.desc ? 'desc' : ''}"><td>${i + 1}</td><td>${esc(r.n)}</td><td>${r.pj}</td><td>${r.gf - r.gc >= 0 ? '+' : ''}${r.gf - r.gc}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>
      <p class="small">${Z.asc ? '🟩 ascenso' : ''}${Z.asc && Z.desc ? ' · ' : ''}${Z.desc ? '🟥 descenso' : ''}</p></div>
      <div class="card"><h3>Tu equipo</h3>${kv('Objetivo del club', OBJETIVOS[P2.objetivoDe(T)].n)}${prox.map((p, i) => kv(i ? 'Después' : 'Próximo rival', `${p.local ? '🏠' : '✈️'} ${esc(P2.nombreEquipo(T, p.rival))}`)).join('')}
        ${ult.length ? kv('Últimos', esc(ult.join(' · '))) : ''}</div>
      <div class="card"><h3>Tú</h3>${kv('Contrato', `${eur(c.sueldo)}/semana · ${c.temporadasRestantes} ${c.temporadasRestantes === 1 ? 'temporada' : 'temporadas'}`)}
        ${htmlTresVariables(s)}${kv('Confianza del míster', `${Math.round(s.confianza)}/100`)}${kv('Interés de otros clubes', `${Math.round(s.interes)}/100`)}${kv('Valor de mercado', eur(P2.valorMercado(s)))}
        ${kv('Partidos', `${s.stats.jugados} (${s.stats.titular} de titular) · ${s.stats.goles} goles`)}${kv('Agente', s.agente ? 'Sí' : 'Al ser titular 3 veces')}
        <details class="por"><summary>❓ ¿Cómo se decide si juegas?</summary><p>Nivel + (confianza − 50) × 0,2 + ventaja del club (${O.minutos >= 0 ? '+' : ''}${O.minutos}) + energía (+2 con 60 o más, −4 con menos de 40) + azar (±6), frente al nivel del once de tu club (${nf(T.fuerzas[T.yo])}). Titular si llegas; suplente si te quedas a menos de 7.</p></details></div>
      ${s.temporadasJugadas.length ? `<div class="card"><h3>Temporadas</h3>${s.temporadasJugadas.map(t => kv(`${esc(t.club)} · ${esc((LIGAS[t.liga] || {}).corto || "")}`, `${t.pos}º · ${t.cumple ? '✅' : '❌'} · nota ${nf(t.media)}`)).join('')}</div>` : ''}`;
  }

  function htmlEmpresa(s) {
    let h = '';
    if (!s.negocios.length) {
      const T = NEGOCIOS.peluqueria;
      if (!P2.mercadoAbierto(s)) return `<div class="card"><h2>💼 Empresa</h2><p>Todavía no tienes empresa. Tu asesor te enseñará negocios en traspaso cuando firmes tu primer patrocinador (o tras 10 partidos como profesional).</p><p class="small">Tu dinero y la caja de una empresa van siempre por separado.</p></div>`;
      const media = Math.round(T.historialVendedor.reduce((a, b) => a + b, 0) / T.historialVendedor.length);
      h += `<div class="card"><h2>${T.ic} Peluquería en traspaso</h2><p>Barrio de ${esc(s.ciudad)}. El dueño se jubila y el negocio va justo: casi no gana. Bien llevada puede dar mucho más.</p>
        ${kv('Traspaso', eur(T.traspaso))}${kv('Beneficio de las últimas semanas', `~${eur(media)}/semana`)}${kv('Cómo la deja', `${T.configInicial.empleados} empleados, sueldos bajos, precios baratos · alquiler ${eur(T.alquiler)}/semana`)}
        <p class="small">Además del traspaso pones dinero en la caja. Poca caja: compras antes, pero cualquier avería o mala racha te deja en números rojos. Mucha caja: tardas más en reunirla, pero aguantas y puedes aprovechar oportunidades.</p>
        ${T.cajas.map((c, i) => { const b = P2.bloqueoCompra(s, 'peluqueria', i); return opcion({ id: String(i), n: `Comprar con ${eur(c)} de caja`, ventaja: `Total: ${eur(T.traspaso + c)}`, coste: i === 0 ? 'Margen mínimo' : i === 1 ? 'Margen razonable' : 'Mucho margen', riesgo: i === 0 ? 'Una semana mala y estás en crisis' : i === 2 ? 'Tardas más en comprar' : '', bloqueo: b }, 'comprar'); }).join('')}</div>`;
      return h;
    }
    for (const n of s.negocios) h += htmlNegocio(s, n);
    if (P2.tieneHito(s, 'rentable') && !s.oportunidad) {
      h += `<div class="card"><h3>🔑 Segunda inversión</h3>${OPORTUNIDADES.map(o => opcion({ id: o.id, n: `${o.ic} ${o.n}`, ventaja: o.d, coste: `Pones tú: ${eur(o.coste)}`, bloqueo: s.p.dinero < o.coste ? `Tienes ${eur(s.p.dinero)}` : null }, 'oportunidad')).join('')}</div>`;
    }
    if (s.socio) { const p = s.socio, E = P2.SOCIO.estados[p.estado] || {};
      h += `<div class="card"><h3>🤝 Tu parte de la cafetería</h3>${p.vendida ? `<p class="small">La vendiste por ${eur(p.precioVenta)}. Cobraste ${eur(p.dividendos)} en dividendos.</p>` :
        `${kv('Vale ahora', eur(p.valor))}${kv('Has puesto', eur(p.aportado))}${kv('Dividendos cobrados', eur(p.dividendos))}${kv('Cómo va', `${E.ic || ''} ${esc(E.n || '—')}`)}${kv('Próximas noticias', `semana ${p.proximo}`)}
        <p class="small">No la gestionas. Cada ${P2.SOCIO.trimestre} semanas llega el resultado: puede haber dividendo, no haberlo, perder valor o pedirte más capital.</p>`}</div>`; }
    return h;
  }
  function htmlNegocio(s, n) {
    const T = NEGOCIOS[n.tipo], x = P2.calcularSemana(s, n), v = P2.valorNegocio(n), bm = Math.round(P2.beneficioMedio(n));
    const seg = (campo, tabla) => `<div class="seg">${Object.entries(tabla).map(([k, o]) => `<button data-act="config" data-neg="${n.id}" data-c="${campo}" data-v="${k}" class="${n[campo] === k ? 'sel' : ''}">${esc(o.n)}${o.valor ? ` ${o.valor} €` : o.coste != null && campo !== 'sueldo' ? (o.coste ? ` ${o.coste} €` : '') : ''}</button>`).join('')}</div>`;
    const ctx = [n.ctx.competidor ? '🏪 Competidor enfrente' : '', n.ctx.temporadaAlta ? `💍 Temporada alta (${n.ctx.temporadaAlta} sem.)` : '', n.ctx.averia ? `🔧 Avería (${n.ctx.averia} sem.)` : '', n.ctx.influencer ? `🤳 Influencer (${n.ctx.influencer} sem.)` : '', n.local ? '🏢 Local propio' : ''].filter(Boolean);
    const rent = P2.tieneHito(s, 'rentable');
    return `<div class="card"><h2>${T.ic} ${T.n}${s.negocios.length > 1 ? ` ${s.negocios.indexOf(n) + 1}` : ''}</h2>
      ${n.crisis ? '<div class="ctx" style="background:#fde8e6;border-color:var(--bad)">🚨 En crisis: decide en «Semana».</div>' : ''}
      <div class="datos dos">${dato('Caja de la empresa', eur(n.caja))}${dato('Valor', eur(v))}${dato('Fama del negocio', Math.round(n.fama))}${dato('Beneficio medio', `${eur(bm)}/sem`)}</div>
      ${ctx.length ? `<div class="resumen" style="margin-top:8px">${ctx.map(t => chip(t)).join('')}</div>` : ''}
      ${n.ultimo ? `<p class="small">Última semana: ${n.ultimo.clientes} clientes, ${n.ultimo.beneficio >= 0 ? 'beneficio' : 'pérdidas'} ${eur(n.ultimo.beneficio)}${n.ultimo.colas > 5 ? `, ${n.ultimo.colas} se fueron por las colas` : ''}.</p>` : '<p class="small">Aún no ha pasado ninguna semana contigo al mando.</p>'}
      <div class="sec">Precio por corte</div>${seg('precio', T.precios)}
      <div class="sec">Sueldos</div>${seg('sueldo', T.sueldos)}
      <div class="sec">Empleados</div><div class="paso"><button data-act="empleados" data-neg="${n.id}" data-v="-1" aria-label="Menos">−</button><b>${n.empleados}</b><button data-act="empleados" data-neg="${n.id}" data-v="1" aria-label="Más">+</button><span class="small">cada uno atiende ~${T.capacidadEmpleado} clientes/semana</span></div>
      <div class="sec">Publicidad</div>${seg('marketing', T.marketing)}
      <div class="prev">📈 Con esta configuración, la próxima semana: unos <b>${x.clientes} clientes</b> (demanda ${x.demanda}, capacidad ${x.capacidad}) y <b>${x.beneficio >= 0 ? '+' : '−'}${eur(Math.abs(x.beneficio))}</b>. La fama tiende a ${x.famaObjetivo}.</div>
      <details class="por"><summary>❓ ¿Cómo se calcula?</summary><p>Demanda = ${T.demandaBase} × (0,4 + fama/100) × precio × publicidad × contexto × tu fama de futbolista. Atiendes como mucho la capacidad (empleados × ${T.capacidadEmpleado}). Coste: alquiler, fijos, sueldos, publicidad y material. La fama del negocio va hacia la calidad real: cobrar caro con sueldos bajos acaba hundiéndola; las colas también.</p>
        <p>Valor = beneficio medio de las últimas ${CFG.empresa.valoracion.semanasMedia} semanas × ${CFG.empresa.valoracion.multiplo} + caja + fama × ${CFG.empresa.valoracion.porFama} − deuda.</p></details>
      <div class="sec">Dinero entre tu cuenta y la caja</div>
      <div class="fila"><input type="number" inputmode="numeric" min="0" step="100" id="imp_${n.id}" placeholder="Importe (€)"></div>
      <div class="fila" style="margin-top:6px"><button class="btn w" data-act="aportar" data-neg="${n.id}">⬇️ Poner en la caja</button><button class="btn w" data-act="retirar" data-neg="${n.id}">⬆️ Sacar a tu cuenta</button></div>
      ${n.deuda ? `<p class="small">🏦 Préstamo: debes ${eur(n.deuda)} (cuota ${eur(n.cuota)}/semana).</p>` : ''}
      ${n.local ? `<p class="small">🏢 Local propio: vale ${eur(n.valorLocal)}${n.hipoteca && n.hipoteca.deuda ? ` · hipoteca pendiente ${eur(n.hipoteca.deuda)} (${eur(n.hipoteca.cuota)}/semana + intereses)` : ''}.</p>` : n.fianza ? `<p class="small">🔑 Fianza del local: ${eur(n.fianza)} (se recupera al vender).</p>` : ''}
      ${n.mejoraInicial && n.mejoraInicial !== 'nada' ? `<p class="small">✨ Mejora inicial: ${esc((P2.tipoDe(n).mejorasIniciales.find(m => m.id === n.mejoraInicial) || {}).n || '')}.</p>` : ''}
      ${rent ? `<div class="fila" style="margin-top:8px">${!n.deuda ? `<button class="btn w" data-act="prestamo" data-neg="${n.id}">🏦 Pedir ${eur(CFG.empresa.prestamo.importe)}</button>` : ''}<button class="btn r" data-act="vender" data-neg="${n.id}">${ui.vender === n.id ? '⚠️ Toca otra vez para vender' : `🤝 Vender por ${eur(v)}`}</button></div>` : '<p class="small">🔒 Financiación y venta: al mantenerla rentable 6 semanas seguidas.</p>'}
    </div>`;
  }

  // Las tres variables: nivel (cómo juegas), reputación deportiva (cómo te ve el fútbol), marca personal (cómo te ven las marcas)
  function htmlTresVariables(s) {
    const barra = (v, max = 100) => `<div class="barra"><i style="width:${Math.max(2, Math.min(100, v / max * 100))}%"></i></div>`;
    return `<div class="tres">
      <div><b>💪 Nivel ${nf(s.p.nivel)}</b>${barra(s.p.nivel)}<span>Cómo juegas. Sube entrenando.</span></div>
      <div><b>⭐ Reputación ${Math.floor(s.p.rep)}</b>${barra(s.p.rep)}<span>Cómo te ve el fútbol: notas, titularidad, categoría, ascensos.</span></div>
      <div><b>📣 Marca ${Math.floor(s.p.marca || 0)}</b>${barra(s.p.marca || 0)}<span>Cómo te ven marcas, medios y clientes. Techo suave: ${P2.techoMarca(s)} (30 + reputación).</span></div></div>`;
  }
  function htmlMarcas(s) {
    let h = `<div class="card"><h2>🤝 Patrocinadores</h2>${htmlTresVariables(s)}
      <p class="small">Cada marca te da algo distinto, no solo dinero. Máximo ${CFG.patrocinio.maxContratos} a la vez y dos del mismo sector no conviven. Cada acto ocupa una semana entera. Si rompes un contrato por faltar, esa marca no vuelve.</p></div>`;
    if (s.patros.length) h += `<div class="sec">Tus contratos</div>` + s.patros.map(c => { const M = MARCAS.find(m => m.id === c.id); return `<div class="card"><h3>${M.ic} ${esc(M.n)}</h3><p class="small">${esc(M.identidad)}</p>${kv('Pago', `${eur(c.semanal || M.semanal)}/semana`)}${kv('Pagos', `${c.pagos} de ${c.semanas} (quedan ${P2.semanasRestantes(c)})`)}${kv('Próximo acto', c.proxActo - c.desde < c.semanas ? `semana ${c.proxActo}` : 'ninguno')}${kv('Faltas', `${c.faltas}/${CFG.patrocinio.faltasMax}`)}${M.objetivo ? kv('Objetivo', `nota media ${nf(M.objetivo.notaMedia)} → ${eur(M.objetivo.bonus)}`) : ''}</div>`; }).join('');
    h += `<div class="sec">Marcas</div><div class="card">` + P2.marcasVisibles(s).map(({ M, bloqueo, renovacion }) => { const C = P2.condicionesMarca(s, M); return opcion({ id: M.id, n: `${M.ic} ${M.n} · ${M.tier === 'local' ? 'local' : M.tier === 'deportiva' ? 'deportiva' : 'gran marca'}${renovacion ? ' · volver a firmar' : ''}`,
      ventaja: `${M.identidad} Prima ${eur(C.prima)}${renovacion ? ' (renovación)' : ''}, ${eur(C.semanal)}/semana, ${M.semanas} semanas`,
      coste: M.obligacion, riesgo: `Sector: ${M.cat}${M.incompatible ? ' · no admite marcas locales' : ''} · audiencia: ${M.audiencia}${M.objetivo ? ` · bonus si tu nota media llega a ${nf(M.objetivo.notaMedia)}` : ''}`, bloqueo }, 'marca'); }).join('') + `</div>`;
    return h;
  }

  function htmlHitos(s) {
    const sig = P2.siguienteHito(s);
    return `<div class="card"><h2>🏅 Hitos del capítulo 1</h2><p class="small">Cada hito abre algo nuevo.</p>
      ${HITOS.map((H, i) => `<div class="lin ${s.hitos[H.id] ? 'bien' : ''}"><span class="ic">${s.hitos[H.id] ? '✅' : H === sig ? '🎯' : '⬜'}</span><span><b>${i + 1}. ${esc(H.n)}</b>${s.hitos[H.id] ? ` · semana ${s.hitos[H.id]}` : ''}<br><span class="small">Abre: ${esc(H.abre)}</span></span></div>`).join('')}</div>
      <div class="card"><h3>📔 Diario</h3>${s.diario.slice(-25).reverse().map(d => `<div class="lin"><span class="ic">${d.ic}</span><span><span class="small">S${d.semana}</span> ${esc(d.t)}</span></div>`).join('') || '<p class="small">Aún vacío.</p>'}</div>`;
  }

  function htmlAjustes(s) {
    const B = ui.balance;
    return `${htmlInforme(s)}<div class="card"><h2>⚙️ Partida</h2>${kv('Semana', s.semana)}${kv('Patrimonio', eur(P2.patrimonio(s)))}${kv('Guardado', `versión ${s.saveVersion}`)}
      <div class="sec">Copia de seguridad</div><p class="small">Copia este código para guardar la partida fuera del navegador.</p>
      <textarea id="codigo" readonly>${esc(btoa(unescape(encodeURIComponent(JSON.stringify(s)))))}</textarea>
      <textarea id="importar" placeholder="Pega aquí un código para cargarlo"></textarea>
      <button class="btn w full" data-act="importar">📥 Cargar desde código</button>
      ${ui.msg ? `<p class="small">${esc(ui.msg)}</p>` : ''}
      <button class="btn r full" data-act="reiniciar">${ui.reinicio ? '⚠️ Toca otra vez para borrar esta partida' : '🔄 Empezar una nueva vida'}</button></div>
      <details class="card"><summary><b>🧪 Balance (simulador)</b></summary><p class="small">Juega cientos de partidas con políticas automáticas (todo trabajo, todo entreno…).</p>
        <button class="btn w full" data-act="balance">▶ Simular 100 partidas por política</button>${B ? `<pre>${esc(B)}</pre>` : ''}</details>
      <p class="small" style="color:rgba(255,255,255,.7);text-align:center">Clubes, marcas y lugares ficticios. Importes de juego. Sin anuncios, compras ni conexiones.</p>`;
  }

  // Informe para testers: todo local; se copia a mano. Preguntas opcionales al final
  function htmlInforme(s) {
    const t = s.tele || {}, Rr = t.respuestas || {};
    const preg = P2.PREGUNTAS_TEST.map((q, i) => {
      const r = Rr[q.id];
      if (q.tipo === 'escala') return `<label class="preg">${i + 1}. ${esc(q.t)}<div class="seg diez">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button data-act="resp" data-q="${q.id}" data-v="${n}" class="${r === n ? 'sel' : ''}">${n}</button>`).join('')}</div></label>`;
      if (q.tipo === 'texto') return `<label class="preg" for="r_${q.id}">${i + 1}. ${esc(q.t)}</label><textarea class="respuesta" id="r_${q.id}" data-q="${q.id}" rows="2">${esc(r || '')}</textarea>`;
      return `<div class="preg">${i + 1}. ${esc(q.t)}<div class="chipsel">${q.ops.map(o => `<button data-act="resp" data-q="${q.id}" data-v="${esc(o)}" class="${(Array.isArray(r) ? r.includes(o) : r === o) ? 'sel' : ''}">${esc(o)}</button>`).join('')}</div></div>`;
    }).join('');
    return `<details class="card" id="informeTest" ${ui.informeAbierto ? 'open' : ''}><summary><b>🧪 Informe de prueba</b> <span class="small">${esc(t.id || '')}</span></summary>
      <p class="small">Si estás probando el juego: responde (si quieres) y pulsa «Generar informe». Copia el texto y mándalo. Todo se queda en este navegador: no se envía nada y no incluye tu nombre.</p>
      ${preg}
      <button class="btn g full" data-act="informe">📋 Generar informe</button>
      ${ui.informe ? `<textarea id="textoInforme" readonly rows="12">${esc(ui.informe)}</textarea><button class="btn w full" data-act="copiarInforme">Copiar el informe</button>${ui.copiado ? `<p class="small">${esc(ui.copiado)}</p>` : ''}` : ''}</details>`;
  }

  function htmlIntro() {
    const p1 = P2.partidaP1();
    return `<div class="intro"><div style="font-size:48px">⚽ → 💈 → 🏢</div><h1>Del barrio al negocio</h1><p>Capítulo 1</p>
      <div class="card"><h3>Empiezas con 17 años</h3><p class="small">Tienes 8 semanas para que un club se fije en ti. Cada semana eliges una sola cosa. No hay una opción siempre buena: todo tiene ventaja, coste y riesgo.</p>
        <label class="small" for="nombre">Tu nombre</label><input type="text" id="nombre" maxlength="20" value="${esc(ui.nombre)}"></div>
      <div class="card"><h3>Tu personaje</h3>${htmlEditor(null, ui.look || (ui.look = Object.assign({}, P2.LOOK_INICIAL)))}
        <button class="btn g full" data-act="empezar">Empezar</button>
        ${p1 ? `<button class="btn w full" data-act="desdeP1">📦 Seguir con tu jugador de P1</button><p class="small">Conserva tu nombre, parte de tus ahorros y algo de fama. Tu partida de P1 no se toca.</p>` : ''}</div></div>`;
  }

  // Editor del avatar: al empezar (s = null, todo lo básico) y luego desde la cabecera (con prendas que abren los hitos)
  function htmlEditor(s, L) {
    const cap = ui.capa, capa = P2.CAPAS_LOOK.find(c => c[0] === cap) || P2.CAPAS_LOOK[0], vista = capa[3];
    const items = P2.ITEMS_LOOK[cap].filter(it => s || !it.req);
    const sv = s || { p: { energia: 80 }, hitos: {} };
    return `<div class="lookTop"><div class="lookPrev">${P2.avatarSVG(sv, L, 'cuerpo')}</div>
        <div class="lookInfo"><span class="small">Elige cada capa. ${s ? 'Algunas prendas se ganan con los hitos.' : 'Más adelante podrás cambiarlo tocando tu cara arriba; algunas prendas se ganan con los hitos.'}</span>
        <button class="btn w" data-act="lookAzar">🎲 Al azar</button></div></div>
      <div class="lookTabs" role="tablist">${P2.CAPAS_LOOK.map(([k, ic, n]) => `<button role="tab" aria-selected="${k === cap}" data-act="capa" data-v="${k}" class="${k === cap ? 'sel' : ''}"><span>${ic}</span>${n}</button>`).join('')}</div>
      <div class="lookGrid">${items.map(it => { const bl = s ? P2.bloqueoLook(s, it) : null, puesto = L[cap] === it.id;
        return `<button class="lk ${puesto ? 'sel' : ''}" data-act="look" data-c="${cap}" data-v="${it.id}" ${bl ? 'disabled' : ''} aria-pressed="${puesto}">${P2.avatarSVG(sv, Object.assign({}, L, { [cap]: it.id }), vista)}<b>${esc(it.n)}</b>${bl ? `<span>🔒 ${esc(bl)}</span>` : ''}</button>`; }).join('')}</div>`;
  }
  function htmlPersonaje(s) {
    return `<div class="card"><h2>🧍 ${esc(s.nombre)}</h2>${htmlEditor(s, s.look)}</div>`;
  }

  // ---------- Render ----------
  function render() {
    if (!S) { $('top').innerHTML = ''; $('nav').innerHTML = ''; $('main').innerHTML = htmlIntro(); $('main').classList.remove('conBoton'); return; }
    // Secciones abiertas por algo hecho fuera de la semana (firmar una marca, comprar…): se avisa aquí
    const nuevas = P2.revisarSecciones(S, null);
    if (nuevas.length) { ui.desbloqueos = (ui.desbloqueos || []).concat(nuevas); P2.guardar(S); }
    $('top').innerHTML = htmlTop(S);
    $('nav').innerHTML = htmlNav(S);
    const V = { semana: () => htmlSituacion(S) + htmlDecision(S) + htmlConsecuencia(S) + htmlBoton(S), liga: htmlLiga, empresa: htmlEmpresa, marcas: htmlMarcas, hitos: htmlHitos, ajustes: htmlAjustes, personaje: htmlPersonaje }[ui.vista] || (() => '');
    $('main').innerHTML = V(S);
    $('main').classList.toggle('conBoton', ui.vista === 'semana');
  }
  const guardarYPintar = () => { P2.guardar(S); render(); };

  function alPulsar(e) {
    if (S) P2.teleTiempo(S);
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act, id = b.dataset.id, neg = b.dataset.neg;
    if (a !== 'reiniciar') ui.reinicio = false;
    if (a !== 'vender') ui.vender = null;
    switch (a) {
      case 'empezar': { const n = ($('nombre').value || '').trim().slice(0, 20) || 'Alex'; S = P2.nuevaPartida({ nombre: n, look: ui.look }); ui.vista = 'semana'; guardarYPintar(); window.scrollTo(0, 0); break; }
      case 'capa': if ($('nombre')) ui.nombre = $('nombre').value; ui.capa = b.dataset.v; render(); break;
      case 'look': if ($('nombre')) ui.nombre = $('nombre').value;
        if (S) { if (P2.ponerLook(S, b.dataset.c, b.dataset.v)) guardarYPintar(); }
        else { const it = P2.itemLook(b.dataset.c, b.dataset.v); if (it && !it.req) { ui.look = Object.assign({}, ui.look, { [b.dataset.c]: b.dataset.v }); render(); } }
        break;
      case 'lookAzar': if ($('nombre')) ui.nombre = $('nombre').value; if (S) { S.look = P2.validarLook(P2.lookAzar()); guardarYPintar(); } else { ui.look = P2.validarLook(P2.lookAzar()); render(); } break;
      case 'elegir': S.eleccion = id; guardarYPintar(); break;
      case 'jugar': { const a = eleccion(S); if (a && P2.jugarSemana(S, a)) { ui.desbloqueos = []; guardarYPintar(); window.scrollTo(0, 0); } break; }
      case 'desdeP1': { const v = P2.partidaP1(); S = (v && P2.migrateSave(v)) || P2.nuevaPartida({}); ui.vista = 'semana'; guardarYPintar(); break; }
      case 'vista': ui.vista = b.dataset.v; ui.msg = ''; P2.tele(S, 'vista', { id: ui.vista }); P2.guardar(S); if ((S.seccionesNuevas || []).includes(ui.vista)) { S.seccionesNuevas = S.seccionesNuevas.filter(x => x !== ui.vista); P2.guardar(S); } render(); window.scrollTo(0, 0); break;
      case 'accion': if (P2.jugarSemana(S, id)) { guardarYPintar(); window.scrollTo(0, 0); } break;
      case 'decidir': if (P2.resolverDecision(S, id)) { guardarYPintar(); window.scrollTo(0, 0); } break;
      case 'comprar': { const R = { lineas: [], hitos: [] }; if (P2.comprarNegocio(S, 'peluqueria', Number(id), R)) { S.ultimaDecision = { semana: S.semana, ic: '💈', titulo: 'Compras la peluquería', texto: 'Ya eres empresario/a. Ajusta precios y personal y vigila la caja.', lineas: [], hitos: R.hitos }; guardarYPintar(); } break; }
      case 'config': if (P2.configurar(S, neg, b.dataset.c, b.dataset.v)) guardarYPintar(); break;
      case 'empleados': { const n = S.negocios.find(x => x.id === neg); if (n && P2.configurar(S, neg, 'empleados', n.empleados + Number(b.dataset.v))) guardarYPintar(); break; }
      case 'aportar': case 'retirar': { const x = Number(($(`imp_${neg}`) || {}).value) || 0; if ((a === 'aportar' ? P2.aportar : P2.retirar)(S, neg, x)) guardarYPintar(); break; }
      case 'prestamo': if (P2.pedirPrestamo(S, neg)) guardarYPintar(); break;
      case 'vender': if (ui.vender !== neg) { ui.vender = neg; render(); } else { ui.vender = null; P2.venderNegocio(S, neg, 1); guardarYPintar(); } break;
      case 'marca': { const R = { lineas: [], hitos: [] }; if (P2.firmarMarca(S, id, R)) { const M = MARCAS.find(m => m.id === id); S.ultimaDecision = { semana: S.semana, ic: M.ic, titulo: `Firmas con ${M.n}`, texto: M.obligacion + '.', lineas: [], hitos: R.hitos }; guardarYPintar(); } break; }
      case 'oportunidad': if (P2.elegirOportunidad(S, id)) { ui.vista = 'semana'; guardarYPintar(); } break;
      case 'importar': { try { const v = P2.migrateSave(JSON.parse(decodeURIComponent(escape(atob(($('importar').value || '').trim()))))); if (!v) throw 0; S = v; ui.msg = ''; ui.vista = 'semana'; guardarYPintar(); } catch (_) { ui.msg = 'Ese código no es válido.'; render(); } break; }
      case 'reiniciar': if (!ui.reinicio) { ui.reinicio = true; render(); } else { ui.reinicio = false; try { localStorage.removeItem(CFG.claveGuardado); } catch (_) {} S = null; ui.vista = 'semana'; render(); } break;
      case 'resp': P2.responderTest(S, b.dataset.q, /^\d+$/.test(b.dataset.v) ? Number(b.dataset.v) : b.dataset.v); ui.informeAbierto = true; guardarYPintar(); break;
      case 'informe': ui.informeAbierto = true; ui.informe = P2.informeTest(S); ui.copiado = ''; guardarYPintar(); break;
      case 'copiarInforme': {
        const ta = $('textoInforme');
        const ok = () => { ui.copiado = 'Copiado. Pégalo en un mensaje.'; render(); };
        const manual = () => { ta.focus(); ta.select(); ui.copiado = 'Mantén pulsado el texto y elige «Copiar».'; };
        try { navigator.clipboard.writeText(ui.informe).then(ok, manual); } catch (_) { manual(); }
        break;
      }
      case 'balance': { b.disabled = true; b.textContent = 'Simulando…'; setTimeout(() => { ui.balance = informeTexto(P2.runBalance(100)); render(); }, 30); break; }
    }
  }

  function informeTexto(r) {
    const l = [`Partidas por política: ${r.partidasPorPolitica}`, ''];
    for (const p of Object.values(r.politicas)) l.push(`${p.politica}: pruebas ${p.pruebasPct} % · contrato ${p.contratoPct} % (sem. ${p.semanaContrato}) · empresa ${p.empresaPct} % · capítulo ${p.capituloPct} % (sem. ${p.semanaCapitulo}) · patrimonio ${fmt(p.patrimonio)} € · nivel ${p.nivel}`);
    l.push('', `Atlético: ${JSON.stringify(r.atleticoVsPuerto.atletico)}`, `Puerto: ${JSON.stringify(r.atleticoVsPuerto.puerto)}`, '', 'Peluquería (mejor configuración por contexto):');
    for (const [k, v] of Object.entries(r.peluqueria)) if (k !== 'distintas') l.push(`  ${k}: ${v.mejor} (${fmt(v.beneficio12sem)} € en 12 semanas)`);
    l.push('', ...r.comprobaciones.map(c => `${c.ok ? '✅' : '❌'} ${c.t}`));
    return l.join('\n');
  }

  function arrancar() {
    try { S = P2.cargar(); } catch (_) { S = null; }
    document.addEventListener('click', alPulsar);
    // Telemetría: cuántas veces se abre «¿Por qué ha pasado esto?» y respuestas escritas del informe
    document.addEventListener('toggle', e => { const d = e.target; if (S && d.matches && d.matches('details.por') && d.open && /Por qué|Cómo se/.test(d.textContent)) { P2.tele(S, 'porque', {}); P2.guardar(S); } }, true);
    document.addEventListener('change', e => { const x = e.target; if (S && x.classList && x.classList.contains('respuesta')) { P2.responderTest(S, x.dataset.q, x.value); P2.guardar(S); } });
    render();
    const a = $('arranque'); if (a) a.remove();
  }

  // Ganchos de depuración (como window.__P1)
  globalThis.__P2 = {
    P2, get S() { return S; }, set S(v) { S = v; }, render, ui,
    nueva: (opc) => { S = P2.nuevaPartida(opc || {}); guardarYPintar(); return S; }, informe: () => P2.informeTest(S),
    jugar: id => { const r = P2.jugarSemana(S, id || eleccion(S)); guardarYPintar(); return r; }, eleccion: () => eleccion(S),
    decidir: id => { const r = P2.resolverDecision(S, id); guardarYPintar(); return r; },
    guardar: () => P2.guardar(S), cargar: () => { S = P2.cargar(); render(); return S; },
    migrateSave: P2.migrateSave, runBalance: (n, m) => P2.runBalance(n || 100, m), informeBalance: (n) => informeTexto(P2.runBalance(n || 100)),
  };
  P2.arrancar = arrancar;
})(globalThis.P2 = globalThis.P2 || {});
