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

  // ---------- Etapa (fondo y ambiente) ----------
  const ETAPAS = { barrio: '🏘️ Barrio', club: '🏟️ Club', empresa: '🌃 Empresa', magnate: '👑 Magnate' };
  function etapa(s) { if (!s) return 'barrio'; if (s.hitos.inversion2) return 'magnate'; if (s.negocios.length || s.socio) return 'empresa'; if (s.temporada) return 'club'; return 'barrio'; }
  // Fondo decorativo por etapa: SVG simple, sin imágenes externas
  function decorSVG(e) {
    let x = '', seed = 7;
    const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const edificio = (x0, w, h, c, luz, base = 300) => {
      let v = `<rect x="${x0}" y="${base - h}" width="${w}" height="${h}" fill="${c}"/>`;
      for (let yy = base - h + 8; yy < base - 10; yy += 12) for (let xx = x0 + 5; xx < x0 + w - 6; xx += 10) if (r() < 0.45) v += `<rect x="${xx}" y="${yy}" width="5" height="6" rx="1" fill="${luz}" opacity="${0.5 + r() * 0.5}"/>`;
      return v;
    };
    const estrellas = n => Array.from({ length: n }, () => `<circle cx="${Math.round(r() * 400)}" cy="${Math.round(r() * 150)}" r="${(0.6 + r()).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`).join('');
    const defs = `<defs><linearGradient id="dgLuz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="dgOro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC83D" stop-opacity=".45"/><stop offset="1" stop-color="#FFC83D" stop-opacity="0"/></linearGradient></defs>`;
    if (e === 'barrio') {
      x = estrellas(18);
      [[0, 60, 120], [62, 46, 160], [110, 70, 105], [300, 50, 150], [352, 48, 115]].forEach(([a, w, h]) => { x += edificio(a, w, h, '#241a63', '#FFD66B'); });
      x += `<path d="M180 300 L196 228 L330 228 L350 300 Z" fill="#2c3fa8"/><path d="M188 300 L203 236 L323 236 L338 300" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><line x1="263" y1="236" x2="265" y2="300" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
        <rect x="247" y="219" width="34" height="11" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>
        <line x1="150" y1="300" x2="150" y2="215" stroke="#9aa6ff" stroke-width="3"/><circle cx="150" cy="212" r="7" fill="#FFD66B"/><circle cx="150" cy="212" r="22" fill="#FFD66B" opacity=".18"/>`;
    } else if (e === 'club') {
      x = estrellas(10) + `<path d="M0 300 L0 190 Q200 130 400 190 L400 300 Z" fill="#20175c"/><path d="M0 300 L0 215 Q200 165 400 215 L400 300 Z" fill="#2b1f7a"/>
        <path d="M40 300 L95 238 L305 238 L360 300 Z" fill="#2c3fa8"/><ellipse cx="200" cy="268" rx="28" ry="9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><line x1="200" y1="238" x2="200" y2="300" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
      for (const [a, b] of [[30, 1], [370, -1]]) x += `<polygon points="${a},70 ${a + b * 120},300 ${a + b * 30},300" fill="url(#dgLuz)"/><line x1="${a}" y1="70" x2="${a}" y2="300" stroke="#8d95c9" stroke-width="4"/><rect x="${a - 14}" y="58" width="28" height="14" rx="3" fill="#fff"/><circle cx="${a}" cy="65" r="26" fill="#fff" opacity=".15"/>`;
    } else {
      const oro = e === 'magnate';
      x = estrellas(oro ? 30 : 22) + `<circle cx="330" cy="60" r="${oro ? 24 : 18}" fill="${oro ? '#FFC83D' : '#e9e6ff'}" opacity=".85"/>` + (oro ? '<rect x="0" y="150" width="400" height="150" fill="url(#dgOro)"/>' : '');
      [[0, 44, 140], [46, 36, 200], [84, 58, 160], [146, 40, 240], [190, 54, 180], [248, 34, 215], [286, 60, 150], [350, 50, 190]].forEach(([a, w, h], i) => { x += edificio(a, w, h, i % 2 ? '#1b1550' : '#251a6b', oro ? '#FFC83D' : (i % 3 ? '#7FD8FF' : '#FFD66B')); });
      if (oro) x += '<polygon points="166,60 162,72 170,72" fill="#FFC83D"/><line x1="166" y1="72" x2="166" y2="62" stroke="#FFC83D" stroke-width="2"/>';
    }
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${defs}${x}</svg>`;
  }

  // ---------- Tu casa y tu vehículo (se ven: «ahora tengo esto») ----------
  function casaSVG(id) {
    const v = id || 'habitacion';
    let x = '';
    if (v === 'habitacion') x = `<rect width="120" height="120" fill="#6d5ccf"/><rect y="88" width="120" height="32" fill="#4a3a9e"/><rect x="12" y="18" width="26" height="34" rx="2" fill="#ffc83d" opacity=".85"/><path d="M16 46 l8 -12 6 8 4 -5 4 9Z" fill="#ff4f8b"/><rect x="70" y="70" width="46" height="22" rx="4" fill="#8fb4ff"/><rect x="72" y="62" width="14" height="10" rx="3" fill="#fff"/>`;
    else if (v === 'piso') x = `<rect width="120" height="120" fill="#2c3fa8"/><rect y="90" width="120" height="30" fill="#1b2a7a"/><rect x="62" y="14" width="46" height="44" rx="3" fill="#0b1033" stroke="#cfd8ff" stroke-width="3"/>${[[66, 30, 8, 28], [78, 22, 9, 36], [92, 34, 10, 24]].map(([a, b, w, h]) => `<rect x="${a}" y="${b}" width="${w}" height="${h}" fill="#3b2a9e"/><rect x="${a + 2}" y="${b + 4}" width="3" height="3" fill="#ffd66b"/>`).join('')}<rect x="8" y="74" width="44" height="18" rx="6" fill="#ff7aa8"/><rect x="14" y="66" width="12" height="10" rx="3" fill="#ffc0d6"/>`;
    else if (v === 'casaPremium') x = `<rect width="120" height="120" fill="#7fd8ff"/><circle cx="96" cy="20" r="10" fill="#ffc83d"/><rect y="86" width="120" height="34" fill="#5b7dff"/><rect x="8" y="94" width="50" height="12" rx="6" fill="#bff3ff"/><rect x="62" y="44" width="52" height="44" fill="#fff"/><path d="M58 46 L88 24 L118 46Z" fill="#1a1640"/><rect x="72" y="58" width="12" height="12" fill="#7fd8ff"/><rect x="92" y="58" width="12" height="12" fill="#7fd8ff"/>`;
    return `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${x}</svg>`;
  }
  function vehiculoSVG(id, skin) {
    const S = (P2.SKINS_VEHICULO[id] || []).find(k => k.id === skin), c = S ? S.c : { bici: '#3d7bff', moto: '#ff4f8b', cocheUsado: '#8fa3c7', deportivo: '#e23b3b', superdeportivo: '#ffc83d' }[id] || '#8fa3c7';
    const rueda = (x, r = 9) => `<circle cx="${x}" cy="48" r="${r}" fill="#1a1640"/><circle cx="${x}" cy="48" r="${r * 0.45}" fill="#cfd3e6"/>`;
    let x = '';
    if (id === 'bici') x = `${rueda(22, 11)}${rueda(78, 11)}<path d="M22 48 L42 26 L66 26 L78 48 M42 26 L50 48 L66 26 M38 20 h10 M64 20 l4 6" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    else if (id === 'moto') x = `${rueda(22, 11)}${rueda(80, 11)}<path d="M22 48 L40 30 L68 30 L80 48 Z" fill="${c}"/><rect x="44" y="22" width="20" height="8" rx="4" fill="#1a1640"/><path d="M68 30 L76 18 h6" stroke="#cfd3e6" stroke-width="3" fill="none"/>`;
    else if (id === 'deportivo' || id === 'superdeportivo') x = `<path d="M4 46 Q6 34 24 32 L40 22 Q56 18 70 24 L88 32 Q98 34 98 46Z" fill="${c}"/><path d="M42 26 Q56 21 68 26 L74 32 L38 32Z" fill="#7fd8ff" opacity=".85"/>${rueda(24)}${rueda(78)}${id === 'superdeportivo' ? '<path d="M2 30 h14" stroke="#1a1640" stroke-width="4"/>' : ''}`;
    else x = `<path d="M6 46 L8 30 Q10 26 18 26 L30 14 L70 14 L82 26 Q94 28 94 36 L94 46Z" fill="${c}"/><path d="M34 18 L48 18 L48 26 L26 26Z M52 18 L68 18 L78 26 L52 26Z" fill="#bfe9ff"/>${rueda(26)}${rueda(74)}`;
    return `<svg viewBox="0 0 100 60" aria-hidden="true">${x}</svg>`;
  }
  const vivienda = s => (P2.equipado(s, 'vivienda') || { id: 'habitacion' }).id;
  const vehiculo = s => { const P = P2.equipado(s, 'vehiculo'); if (!P) return null; const it = (s.inventario || []).find(i => i.id === P.id); return { P, skin: it && it.skin }; };
  function escena(s, grande) {
    const V = vehiculo(s);
    return `<div class="escenaCasa ${grande ? 'grande' : ''}">${casaSVG(vivienda(s))}<div class="pj">${P2.avatarSVG(s, null, 'cuerpo')}</div>${V ? `<div class="veh">${vehiculoSVG(V.P.id, V.skin)}</div>` : ''}</div>`;
  }

  // ---------- Cabecera y navegación ----------
  function htmlTop(s) {
    return `<button class="hava" data-act="vista" data-v="personaje" aria-label="Tu personaje">${P2.avatarSVG(s, null, 'busto')}</button>
      <div class="hwho"><b>${esc(s.nombre)}</b><span>${esc(nombreFase(s))}</span></div>
      <div class="hres">${pill('💶', fmt(s.p.dinero), s.p.dinero < 0 ? 'mal' : 'oro')}${pill('⚡', Math.round(s.p.energia), s.p.energia < 30 ? 'mal' : '')}${pill('⭐', Math.floor(s.p.rep))}${(s.secciones || []).includes('marcas') ? pill('📣', Math.floor(s.p.marca || 0)) : ''}</div>`;
  }
  // Barra inferior: 4 grupos grandes (Inicio · Carrera · Imperio · Perfil); dentro, pestañas de cada sección
  const grupoDe = v => (P2.SECCIONES.find(x => x.id === v) || { grupo: 'inicio' }).grupo;
  function avisos(s) {
    const avisoEmp = s.negocios.some(n => n.crisis) || (!s.negocios.length && !P2.bloqueoCompra(s, 'peluqueria', 0)) || (s.oportunidadAbierta && !s.oportunidad);
    const avisoMarcas = s.fase === 'club' && MARCAS.some(M => !P2.bloqueoMarca(s, M));
    const avisoInv = P2.inversiones(s).some(x => x.estado === 'disponible' && (x.grupo === 'segunda' || !s.negocios.length));
    return { semana: s.pendiente && ui.vista !== 'semana', empresa: avisoEmp, marcas: avisoMarcas, inversiones: avisoInv };
  }
  function htmlNav(s) {
    const vis = P2.seccionesVisibles(s), av = avisos(s), nuevas = s.seccionesNuevas || [], g0 = grupoDe(ui.vista);
    // Un grupo sin secciones todavía no sale (Carrera aparece al firmar tu primer contrato)
    const grupos = P2.GRUPOS.filter(g => vis.some(x => x.grupo === g.id));
    return `<div class="tabs" style="grid-template-columns:repeat(${grupos.length},1fr)">${grupos.map(g => {
      const secs = vis.filter(x => x.grupo === g.id), nuevo = secs.some(x => nuevas.includes(x.id)), aviso = secs.some(x => av[x.id]);
      return `<button data-act="grupo" data-g="${g.id}" class="g-${g.id} ${g0 === g.id ? 'sel' : ''}" aria-label="${g.n}"><span>${g.ic}</span>${g.n}${nuevo ? '<em>Nuevo</em>' : aviso ? '<i></i>' : ''}</button>`;
    }).join('')}</div>`;
  }
  function htmlSubtabs(s) {
    const g = grupoDe(ui.vista); if (g === 'inicio') return '';
    const secs = P2.seccionesVisibles(s).filter(x => x.grupo === g), nuevas = s.seccionesNuevas || [];
    return `<div class="subtabs g-${g}" role="tablist">${secs.map(x => `<button role="tab" aria-selected="${ui.vista === x.id}" data-act="vista" data-v="${x.id}" class="${ui.vista === x.id ? 'sel' : ''}">${x.ic} ${x.n}${nuevas.includes(x.id) ? '<em>Nuevo</em>' : ''}</button>`).join('')}</div>`;
  }

  // ---------- INICIO: tu personaje en su escenario, objetivo, dinero y progreso ----------
  function htmlHero(s) {
    const H = P2.siguienteHito(s), hechos = HITOS.filter(h => s.hitos[h.id]).length, e = etapa(s);
    return `<div class="hero e-${e}"><div class="stage">${escena(s)}</div>
      <div class="heroInfo"><span class="etq">${ETAPAS[e]} · semana ${s.semana}</span>
        <b class="obj">🎯 ${H ? esc(H.n) : '¡Capítulo completado!'}</b>
        <div class="xp" aria-label="Progreso del capítulo"><i style="width:${Math.round(100 * hechos / HITOS.length)}%"></i></div><small>${hechos} de ${HITOS.length} hitos</small>
        <div class="saldo"><span class="oro">💶 ${esc(eur(s.p.dinero))}</span><span>🏦 ${esc(eur(P2.patrimonio(s)))}</span></div></div></div>${htmlDeseo(s)}`;
  }
  // 🎯 Tu objetivo personal (lista de deseos): uno a la vez
  function htmlDeseo(s) {
    const P = s.deseoActual && P2.producto(s.deseoActual); if (!P) return '';
    const p = Math.min(100, Math.round(100 * Math.max(0, s.p.dinero) / P.precio));
    return `<button class="deseoBar" data-act="verDeseo"><span class="dic">${P.ic}</span><span class="dtx"><small>🎯 TU OBJETIVO PERSONAL</small><b>${esc(P.n)}</b>
      <span class="xp"><i style="width:${p}%"></i></span><small>Tienes ${esc(eur(s.p.dinero))} · necesitas ${esc(eur(P.precio))}</small></span></button>`;
  }
  // Extras del inicio: recompensa de temporada, energía patrocinada y oferta (simulada) en un buen momento
  function htmlExtrasInicio(s) {
    let h = '';
    const m = P2.monEstado(s), tp = m.temporadaPremio;
    if (P2.MONETIZATION.activa && tp && !tp.visto) {
      h += `<div class="card premioT"><h3>🎁 RECOMPENSA DE TEMPORADA</h3><p>Has desbloqueado: <b>👕 Camiseta de la temporada</b> (ya está en tu personaje).</p>
        ${tp.extra ? '<p class="small">✅ También tienes las 🕶️ Gafas edición temporada.</p>' : `${rwBtn(s, 'temporada', {}, 'Consigue también: 🕶️ Gafas edición temporada')}<p class="small">Solo estética: no dan estadísticas.</p>`}
        <button class="btn w full" data-act="premioVisto">Vale</button></div>`;
    }
    if (P2.MONETIZATION.activa && !P2.bloqueoRewarded(s, 'energia')) h += `<div class="card rwCard"><b>⚡ Vas justo de energía</b><p class="small">Descansar sigue siendo la opción de siempre. Si quieres, una vez cada ${P2.MONETIZATION.rewarded.energia.cadaSemanas} semanas:</p>${rwBtn(s, 'energia', { contexto: 'inicio' }, `Recuperación patrocinada: +${P2.MONETIZATION.rewarded.energia.cantidad} energía`)}</div>`;
    if (!ui.iapCard) { const I = P2.ofertaIapAhora(s, ui.iapSesion || 0); if (I) { P2.marcarIapMostrado(s, I.id); ui.iapCard = I.id; ui.iapSesion = (ui.iapSesion || 0) + 1; P2.guardar(s); } }
    if (ui.iapCard) h += htmlIapCard(s, ui.iapCard, 'momento');
    return h;
  }
  const TITULO_MOMENTO = { contrato: '🎉 TU PRIMER CONTRATO', titular: '⭐ YA ERES TITULAR', patro: '🤝 TU PRIMER PATROCINADOR', empresa: '💼 TU PRIMERA EMPRESA', rentable: '📈 EMPRESA RENTABLE' };
  const precioTxt = p => `${String(p.toFixed(2)).replace('.', ',')} €`;
  function htmlIapCard(s, id, donde) {
    const I = P2.IAP_PRODUCTS.find(x => x.id === id); if (!I) return '';
    P2.iapMostrado(s, id, donde);
    return `<div class="card iapCard rz-${I.rareza || 'raro'}">${donde === 'momento' ? `<small class="mom">${TITULO_MOMENTO[I.momentoOferta] || '🎉'}</small>` : ''}
      <div class="fila"><div class="iapPrev">${P2.avatarSVG(s, lookPack(s, I), 'busto')}</div><div><b>${I.ic} ${esc(I.nombre.toUpperCase())}</b><p class="small">${esc(I.descripcion)}</p></div></div>
      <button class="btn full iapBtn" data-act="iap" data-id="${I.id}">Ver · ${precioTxt(I.precio)} <span class="lab">🧪 TEST · sin cargo</span></button>
      ${donde === 'momento' ? '<button class="btn w full" data-act="iapNo">No, gracias</button>' : ''}</div>`;
  }
  // Cómo te quedaría el pack (vista previa)
  function lookPack(s, I) { const L = Object.assign({}, s.look); for (const c of I.contenido) if (Array.isArray(c)) L[c[0]] = c[1]; return L; }
  function rwBtn(s, tipo, data, texto) {
    const lim = (ui.rwSesion || 0) >= P2.MONETIZATION.limitesSesion.rewarded, b = P2.bloqueoRewarded(s, tipo, data);
    if (!b) P2.ofrecidoRewarded(s, tipo, data);
    return `<button class="rw" data-act="rw" data-t="${tipo}" data-id="${esc(data.id || '')}" ${b || lim ? 'disabled' : ''}>📺 ${esc(texto)}${b || lim ? `<small>${esc(lim ? 'Límite de esta sesión' : b)}</small>` : ''}</button>`;
  }
  // Accesos rápidos (como en un juego: tus personas, la tienda, tu imperio)
  function htmlAccesos(s) {
    const vis = P2.seccionesVisibles(s).map(x => x.id);
    const t = [['relaciones', '❤️', 'Relaciones', 'rel'], ['tienda', '🛍️', 'Tienda', 'tienda'], vis.includes('empresa') ? ['empresa', '💼', 'Empresa', 'emp'] : null, vis.includes('liga') ? ['liga', '📊', 'Liga', 'dep'] : ['hitos', '🏅', 'Hitos', 'dep']].filter(Boolean);
    return `<div class="accesos">${t.map(([v, ic, n, c]) => `<button class="acc c-${c}" data-act="vista" data-v="${v}"><span>${ic}</span>${n}${(s.seccionesNuevas || []).includes(v) ? '<em>Nuevo</em>' : ''}</button>`).join('')}
      ${vis.includes('empresa') ? '' : '<button class="acc lock" data-act="vista" data-v="inversiones"><span>🔒</span>Inversiones</button>'}</div>`;
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
    return `<div class="card sit"><div class="escena">${escena}</div><div class="in"><h2>${titulo}</h2><div class="datos">${datos}</div>${extra}</div></div>`;
  }

  // ---------- DECISIÓN ----------
  function htmlDecision(s) {
    const v = P2.vistaPendiente(s);
    if (v) {
      return `<div class="sec"><span>Decisión</span></div><div class="card dec evento ${v.fiesta ? 'fiesta' : ''} ${v.grande ? 'mega' : ''}">${v.grande ? `<div class="megaTop">${decorSVG('empresa')}<span>🔓</span></div>` : ''}<h2><span>${v.ic}</span>${esc(v.titulo)}</h2>${v.texto ? `<p>${esc(v.texto)}</p>` : ''}
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
  const htmlDesbloqueo = x => `<div class="hito desb">🔓 <b>Nueva sección: ${x.ic} ${esc(x.n)}</b><br>${esc(x.d || '')} La tienes abajo, en «${esc((P2.GRUPOS.find(g => g.id === x.grupo) || { n: 'Inicio' }).n)}».</div>`;
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

  // ---------- 🛍️ TIENDA ----------
  const SLOTS = [['vehiculo', '🚗', 'Vehículo'], ['vivienda', '🏠', 'Vivienda'], ['movil', '📱', 'Móvil'], ['calzado', '👟', 'Calzado']];
  function efectoTxt(P) {
    const E = P.ef || {}, l = [];
    if (E.entreno) l.push(`+${Math.round(E.entreno * 100)} % entreno`);
    if (E.prensa) l.push(`+${Math.round(E.prensa * 100)} % redes`);
    if (E.recuperacion) l.push(`+${E.recuperacion} energía/sem.`);
    if (E.gastosVida) l.push(`−${E.gastosVida} €/sem. de gastos`);
    if (P.patrimonial) l.push(`conserva ${Math.round(P.patrimonial * 100)} % de valor`);
    if (P.look) l.push('nueva ropa para tu personaje');
    if (P.consumible) l.push(`se repite cada ${P.enfria} sem.`);
    return l.length ? l.join(' · ') : 'Colección: solo por gusto';
  }
  function htmlTienda(s) {
    const cat = ui.cat || 'ropa', prods = P2.PRODUCTOS.filter(P => P.cat === cat && !P.inicial);
    const tile = P => {
      const tuyo = !P.consumible && P2.posee(s, P.id), bl = tuyo ? null : P2.bloqueoProducto(s, P), conf = ui.confirmar === P.id;
      const estado = tuyo ? 'tuyo' : P.proximamente ? 'bloq prox' : bl ? 'bloq' : conf ? 'conf' : '';
      const pv = P2.precioPara(s, P), R = P2.RAREZAS[P.rareza || 'comun'], des = s.deseoActual === P.id;
      const precio = pv !== P.precio ? `<s>${esc(eur(P.precio))}</s> ${esc(eur(pv))}` : esc(eur(P.precio));
      return `<div class="prod ${estado} rz-${P.rareza || 'comun'}" data-id="${P.id}"><span class="rz" style="--rz:${R.c}">${R.n}</span>
        ${P2.deseable(P) && !tuyo ? `<button class="deseo ${des ? 'sel' : ''}" data-act="quiero" data-id="${P.id}" aria-pressed="${des}" aria-label="Quiero esto">${des ? '❤️' : '🤍'}</button>` : ''}
        <span class="pic">${P.ic}</span><b>${esc(P.n)}</b><span class="pd">${esc(efectoTxt(P))}</span>
        ${bl && !tuyo ? `<span class="bl">🔒 ${esc(bl)}</span>` : ''}
        <button class="precio" data-act="comprarP" data-id="${P.id}" ${tuyo || bl ? 'disabled' : ''}>${tuyo ? '✅ Es tuyo' : conf ? `¿Seguro? ${precio}` : `💶 ${precio}`}</button>
        ${!tuyo && P2.MONETIZATION.activa && !P.proximamente && !P.consumible && P.precio >= P2.MONETIZATION.rewarded.cupon.precioMin && pv === P.precio && !(P.req && P.req.hito && !s.hitos[P.req.hito]) ? rwBtn(s, 'cupon', { id: P.id }, `Cupón −${Math.round(P2.MONETIZATION.rewarded.cupon.pct * 100)} % · ahorras ${eur(P2.descuentoCupon(P.precio))}`) : ''}
        ${pv !== P.precio ? `<span class="cuponOk">${P2.ofertaVigente(s) && P2.ofertaVigente(s).id === P.id ? '🎁 Oferta especial' : '🏷️ Cupón activo'}</span>` : ''}</div>`;
    };
    return `<div class="card tiendaTop"><div class="fila"><div><h2>🛍️ Tienda</h2><p class="small">Disfruta lo que ganas. Nada es obligatorio para competir; algunos objetos ayudan un poco. Toca 🤍 para marcar tu objetivo.</p></div>
        <div class="saldoBox"><small>Disponible</small><b class="oro">${esc(eur(s.p.dinero))}</b></div></div></div>
      ${htmlOfertaEspecial(s, tile)}
      <div class="cats" role="tablist">${P2.CATEGORIAS_TIENDA.map(c => `<button role="tab" aria-selected="${c.id === cat}" data-act="cat" data-v="${c.id}" class="${c.id === cat ? 'sel' : ''}"><span>${c.ic}</span>${c.n}</button>`).join('')}</div>
      <div class="prods">${prods.map(tile).join('')}</div>
      ${htmlCosas(s)}${htmlColecciones(s)}${htmlPremium(s)}`;
  }
  function htmlOfertaEspecial(s, tile) {
    if (!P2.MONETIZATION.activa) return '';
    const o = P2.ofertaVigente(s);
    if (o) return `<div class="sec"><span>🎁 Oferta especial</span><span>hasta la semana ${o.hasta}</span></div><div class="prods uno">${tile(P2.producto(o.id))}</div>`;
    const b = P2.bloqueoRewarded(s, 'oferta');
    return `<div class="card ofertaEsp"><b>🎁 OFERTA ESPECIAL</b><span class="small">Un objeto de tu etapa con descuento. Lo pagas con dinero del juego.</span>${b && b !== 'Desactivado' ? `<span class="small">⏳ ${esc(b)}</span>` : rwBtn(s, 'oferta', { contexto: 'tienda' }, 'Ver anuncio para descubrir la oferta')}</div>`;
  }
  function htmlColecciones(s) {
    return `<div class="sec"><span>🏆 Colecciones</span><span>premio visual</span></div><div class="card colec">${P2.COLECCIONES.map(C => {
      if (C.futura) return `<div class="kv muted"><span>${C.ic} ${esc(C.n)}</span><span class="small">🔒 Próximamente</span></div>`;
      const p = P2.progresoColeccion(s, C), ok = (s.coleccionesHechas || []).includes(C.id);
      return `<div class="kv"><span>${C.ic} <b>${esc(C.n)}</b> <span class="small">${C.items.map(id => `${P2.producto(id).ic}`).join(' ')}</span></span><b>${ok ? `✅ ${esc(C.premioN)}` : `${p.tengo}/${p.total}`}</b></div>`;
    }).join('')}</div>`;
  }
  // Estilo premium: solo variante C del test y solo como prueba de intención (sin cargo)
  function htmlPremium(s) {
    if (!P2.MONETIZATION.activa) return '';
    const l = P2.IAP_PRODUCTS.filter(I => I.categoria === 'cosmetico' && P2.iapEnVariante(s, I.id) && s.monVariante === 'C');
    if (!l.length) return '';
    return `<div class="sec"><span>⭐ Estilo premium</span><span class="lab">🧪 TEST · sin cargo</span></div><p class="small blanco">Solo estética. Lo que ayuda a jugar se compra siempre con dinero del juego.</p>${l.map(I => htmlIapCard(s, I.id, 'tienda')).join('')}`;
  }
  // Tus cosas: lo que llevas puesto en cada hueco y tu colección
  function htmlCosas(s) {
    const inv = s.inventario || [];
    const otros = inv.filter(it => { const P = P2.producto(it.id); return P && !P.slot; });
    const guardados = inv.filter(it => { const P = P2.producto(it.id); return P && P.slot && (s.equipado || {})[P.slot] !== P.id; });
    const vender = it => { const P = P2.producto(it.id); return P.patrimonial ? `<button class="btn w mini" data-act="venderP" data-id="${it.uid}">${ui.venderP === it.uid ? '⚠️ Toca otra vez' : `Vender ${eur(it.valorActual)}`}</button>` : ''; };
    return `<div class="sec"><span>🎒 Tus cosas</span><span>${inv.length} ${inv.length === 1 ? 'objeto' : 'objetos'}</span></div><div class="card cosas">
      <div class="slots">${SLOTS.map(([k, ic, n]) => { const P = P2.equipado(s, k); return `<div class="slot ${P ? '' : 'vacio'}"><span class="sic">${P ? P.ic : ic}</span><small>${n}</small><b>${P ? esc(P.n) : '—'}</b></div>`; }).join('')}</div>
      ${otros.length ? `<div class="coleccion">${otros.map(it => { const P = P2.producto(it.id); return `<span class="chip">${P.ic} ${esc(P.n)}${P.patrimonial ? ` · ${esc(eur(it.valorActual))}` : ''}</span>`; }).join('')}</div>` : ''}
      ${inv.filter(it => P2.producto(it.id).patrimonial).map(it => { const P = P2.producto(it.id); return `<div class="kv"><span>${P.ic} ${esc(P.n)} <span class="small">compra ${esc(eur(it.precioCompra))}</span></span>${vender(it)}</div>`; }).join('')}
      ${guardados.map(it => { const P = P2.producto(it.id); return `<div class="kv"><span>${P.ic} ${esc(P.n)} <span class="small">guardado</span></span><button class="btn w mini" data-act="equipar" data-id="${P.id}">Usar</button></div>`; }).join('')}
      ${inv.length ? '' : '<p class="small">Aún no te has comprado nada. Vives en casa de tus padres y vas andando a todas partes.</p>'}</div>`;
  }
  function htmlRw(s) {
    const p = ui.rw, C = P2.MONETIZATION.rewarded[p.tipo], R = P2.REWARDED[p.tipo];
    let rec = R.d(C);
    if (p.tipo === 'cupon') { const P = P2.producto(p.data.id), d = P2.descuentoCupon(P.precio); rec = `🏷️ Cupón −${Math.round(C.pct * 100)} % para ${P.ic} ${P.n}: comprar por ${eur(P.precio - d)} en vez de ${eur(P.precio)} (ahorras ${eur(d)}). Válido ${C.validez} semanas.`; }
    return `<div class="overlay" role="dialog" aria-label="Simulación de anuncio"><div class="modal">
      <small class="lab">🧪 MONETIZATION LAB</small><h2>📺 SIMULACIÓN DE ANUNCIO</h2>
      <p>En la versión final aquí aparecería un anuncio de aproximadamente 20–30 segundos.</p>
      <div class="recompensa"><small>Tu recompensa sería:</small><b>${esc(rec)}</b></div>
      <button class="btn full" data-act="rwOk">Simular anuncio y aceptar recompensa</button><button class="btn w full" data-act="rwNo">Cancelar</button></div></div>`;
  }
  function htmlIapModal(s) {
    const I = P2.IAP_PRODUCTS.find(x => x.id === ui.iap);
    if (ui.iapResp) return `<div class="overlay" role="dialog"><div class="modal"><h2>🧪 Gracias</h2><p>${ui.iapResp === 'si' ? '¡Anotado que lo comprarías!' : 'Anotado.'} No se ha cobrado nada${P2.MONETIZATION.iap.entregarCosmeticos ? '' : ' y en esta prueba el pack no se entrega'}.</p><button class="btn full" data-act="iapCerrar">Seguir jugando</button></div></div>`;
    return `<div class="overlay" role="dialog" aria-label="Prueba de compra"><div class="modal">
      <small class="lab">🧪 PRUEBA DE COMPRA</small><p>En la versión final esta compra costaría:</p><div class="precioGrande">${precioTxt(I.precio)}</div>
      <h2>${I.ic} ${esc(I.nombre.toUpperCase())}</h2>${I.contenido.some(Array.isArray) ? `<div class="iapPrev grande">${P2.avatarSVG(s, lookPack(s, I), 'cuerpo')}</div>` : ''}
      <ul class="cont">${I.contenido.map(c => `<li>${esc(Array.isArray(c) ? c[2] : c.t)}</li>`).join('')}</ul>
      <p class="small">Sin estadísticas ni ventajas. <b>No se realizará ningún cargo.</b></p><p><b>¿Lo comprarías?</b></p>
      <div class="seg tres3"><button data-act="iapResp" data-v="no">No</button><button data-act="iapResp" data-v="quiza">Quizá</button><button data-act="iapResp" data-v="si" class="sel">Sí, lo compraría</button></div></div></div>`;
  }
  function htmlInter(s) {
    const sa = P2.iapEnVariante(s, 'sinAnuncios');
    return `<div class="overlay" role="dialog" aria-label="Anuncio simulado"><div class="modal">
      <small class="lab">🧪 MONETIZATION LAB</small><h2>📺 Anuncio</h2><p>En la versión gratuita aquí aparecería un anuncio breve.</p>
      <button class="btn full" data-act="interOk">Continuar</button>${sa ? '<button class="btn w full" data-act="iap" data-id="sinAnuncios">🚫 Sin anuncios · 2,99 € <span class="lab">🧪 TEST</span></button>' : ''}</div></div>`;
  }
  function htmlDeseoAviso(s) {
    const a = P2.monEstado(s).deseoAviso, P = P2.producto(a.id);
    return `<div class="overlay" role="dialog"><div class="compraOk"><div class="rayos"></div><small>🎉 ¡YA PUEDES COMPRARLO!</small><div class="bigic">${P.ic}</div><h2>${esc(P.n)}</h2>
      <p>Has llegado a ${esc(eur(s.p.dinero))}. ¿Te lo compras o inviertes ese dinero? Tú decides.</p>
      <button class="btn full" data-act="deseoTienda">🛍️ Ir a la Tienda</button><button class="btn w full" data-act="deseoLuego">Más tarde</button></div></div>`;
  }
  function htmlNuevaCompra() {
    const P = P2.producto(ui.nuevaCompra); if (!P) return '';
    return `<div class="overlay" role="dialog" aria-label="Nueva compra"><div class="compraOk"><div class="rayos"></div><small>🎉 NUEVA COMPRA</small><div class="bigic">${P.ic}</div><h2>${esc(P.n)}</h2>
      <p>${P.consumible ? 'Disfrutado. ' : 'Ahora es tuyo. '}${esc(efectoTxt(P))}.</p>
      ${P.look ? '<button class="btn w full" data-act="vista" data-v="personaje">👕 Probármelo</button>' : ''}<button class="btn full" data-act="cerrarCompra">¡Genial!</button></div></div>`;
  }

  // ---------- ❤️ RELACIONES ----------
  const caraDe = R => P2.avatarSVG({ p: { energia: 80 }, hitos: {} }, Object.assign({}, P2.LOOK_INICIAL, R.look || {}), 'busto');
  function htmlRelaciones(s) {
    const l = P2.personasVisibles(s);
    const grupos = [['Familia', ['familia']], ['Amigos', ['amigo']], ['Tu equipo', ['companero', 'entrenador']], ['Tu carrera', ['representante']], ['Más adelante', ['pareja', 'contacto']]];
    const card = R => {
      if (R.bloqueada) return `<div class="pers bloq"><div class="pava">${R.ic}</div><div class="pinfo"><b>${esc(R.rol.toUpperCase())}</b><span class="estado">🔒 ${esc(R.bloqueada)}</span></div></div>`;
      const v = P2.valorRel(s, R.id), x = (s.relaciones || {})[R.id], hist = x && x.historia ? x.historia.slice(-2).reverse() : [];
      return `<div class="pers"><div class="pava">${caraDe(R)}</div><div class="pinfo"><b>${esc(P2.nombreRel(s, R).toUpperCase())}</b> <span class="rol">· ${esc(R.rol)}</span>
        <div class="corazon">❤️ <b class="num">${v}</b>/100</div><div class="barra rel"><i style="width:${Math.max(3, v)}%"></i></div>
        <span class="estado">«${esc(P2.estadoRel(v))}»</span>
        ${R.id === 'mister' ? '<span class="hist">Sube con tus partidos y tus decisiones en el club.</span>' : hist.map(h => `<span class="hist">S${h.semana} · ${h.d > 0 ? '+' : ''}${h.d} · ${esc(h.t)}</span>`).join('')}</div></div>`;
    };
    return `<div class="card relTop"><h2>❤️ Tus personas</h2><p class="small">Cambian por lo que decides cuando pasa algo, nunca por no entrar: no se pierden solas. Algunas decisiones vuelven semanas después.</p></div>
      ${grupos.map(([n, tipos]) => { const g = l.filter(R => tipos.includes(R.tipo)); return g.length ? `<div class="sec"><span>${n}</span></div>${g.map(card).join('')}` : ''; }).join('')}`;
  }

  // ---------- 📈 INVERSIONES: el camino de deportista a empresario, visible desde el principio ----------
  function htmlInversiones(s) {
    const l = P2.inversiones(s), emp = P2.seccionesVisibles(s).some(x => x.id === 'empresa');
    const EST = { tuya: ['✅ Tuya', 'tuya'], disponible: ['🔓 Disponible', 'disp'], bloqueada: ['🔒 Bloqueada', 'bloq'], otra: ['Elegiste otra', 'iotra'], proximamente: ['🔒 Próximamente', 'iprox'] };
    const card = x => {
      const [et, ec] = EST[x.estado], p = Math.min(100, Math.round(100 * Math.max(0, s.p.dinero) / x.coste));
      return `<div class="inv ${ec}"><div class="invTop"><span class="invIc">${x.ic}</span><div><b>${esc(x.n)}</b><span class="chip">${et}</span></div></div>
        <p class="small">${esc(x.d)}</p>
        ${x.estado === 'proximamente' ? `<p class="small">💶 Unos ${esc(eur(x.coste))}</p>` : x.estado !== 'tuya' && x.estado !== 'otra' ? `<div class="kv"><span>💶 Necesitas ${x.desde ? 'desde ' : ''}${esc(eur(x.coste))}</span><b>${p} %</b></div><div class="barra"><i style="width:${Math.max(2, p)}%"></i></div>` : ''}
        ${x.estado === 'bloqueada' ? `<div class="reqs">${x.reqs.map(r => `<span class="${r.ok ? 'ok' : ''}">${r.ok ? '✅' : '⬜'} ${esc(r.t)}</span>`).join('')}</div>` : ''}
        ${(x.estado === 'disponible' || x.estado === 'tuya') && emp ? `<button class="btn ${x.estado === 'tuya' ? 'w' : ''} full" data-act="vista" data-v="empresa">${x.estado === 'tuya' ? '💼 Gestionar' : '💼 Ver en Empresa'}</button>` : ''}</div>`;
    };
    const grupo = (g, t, extra) => { const x = l.filter(i => i.grupo === g); return `<div class="sec"><span>${t}</span>${extra ? `<span>${extra}</span>` : ''}</div>${x.map(card).join('')}`; };
    return `<div class="card invHead"><h2>📈 Inversiones</h2><p class="small">Tu camino de deportista a empresario. Todo se desbloquea jugando: aquí ves qué viene y qué te falta.</p></div>
      ${grupo('primera', '1 · Tu primera empresa')}${grupo('segunda', '2 · Segunda inversión', 'eliges una')}${grupo('futura', '3 · Más adelante')}`;
  }

  // ---------- 💰 PATRIMONIO ----------
  function htmlPatrimonio(s) {
    const pos = P2.valorPosesiones(s), emp = s.negocios.reduce((a, n) => a + P2.valorNegocio(n), 0), soc = s.socio && !s.socio.vendida ? s.socio.valor : 0;
    const pat = (s.inventario || []).filter(it => (P2.producto(it.id) || {}).patrimonial);
    return `<div class="card patri"><small>TU PATRIMONIO</small><div class="big oro num">${esc(eur(P2.patrimonio(s)))}</div>
        ${kv('💶 Dinero disponible', eur(s.p.dinero))}${kv('🏠 Tus cosas con valor', eur(pos))}${kv('💼 Empresas', s.negocios.length ? eur(emp) : '—')}${s.socio ? kv('🤝 Participación', s.socio.vendida ? 'vendida' : eur(soc)) : ''}
        <p class="small">La ropa, el ocio y la tecnología no suman: son para disfrutar. Vehículos, vivienda y joyas conservan parte de lo que pagaste.</p></div>
      ${pat.length ? `<div class="sec"><span>Posesiones</span></div><div class="card">${pat.map(it => { const P = P2.producto(it.id); return kv(`${P.ic} ${esc(P.n)}`, `${eur(it.precioCompra)} → <span class="oro2">${eur(it.valorActual)}</span>`); }).join('')}</div>` : ''}
      <div class="card">${kv('🛍️ Gastado en la tienda', eur((s.acum || {}).compras || 0))}${kv('💸 Gastos personales', eur((s.acum || {}).gastos || 0))}</div>
      ${htmlGaraje(s)}
      <div class="sec"><span>🏠 Tu casa</span></div><div class="card casaCard">${escena(s, true)}<p class="small">${esc((P2.equipado(s, 'vivienda') || {}).n || '')}. Decoración: próximamente.</p></div>`;
  }
  function htmlGaraje(s) {
    const inv = (s.inventario || []).filter(it => (P2.producto(it.id) || {}).cat === 'vehiculos'), act = (s.equipado || {}).vehiculo;
    const vend = (s.vendidos || []).filter(v => (P2.producto(v.id) || {}).cat === 'vehiculos');
    return `<div class="sec"><span>🚗 Garaje</span><span>${inv.length} ${inv.length === 1 ? 'vehículo' : 'vehículos'}</span></div><div class="card garaje">
      ${inv.length ? inv.map(it => { const P = P2.producto(it.id), skins = P2.SKINS_VEHICULO[it.id] || [];
        return `<div class="vehC ${act === it.id ? 'act' : ''}"><div class="vsvg">${vehiculoSVG(it.id, it.skin)}</div><div><b>${P.ic} ${esc(P.n)}</b> ${act === it.id ? '<span class="chip bien">En uso</span>' : `<button class="btn w mini" data-act="equipar" data-id="${P.id}">Usar</button>`}
          <span class="small">Valor ${esc(eur(it.valorActual))} · pagaste ${esc(eur(it.precioCompra))}</span>
          ${skins.length ? `<span class="small">Aspecto: ${skins.map(k => k.premium ? `🔒 ${esc(k.n)} (Pack ${esc((P2.IAP_PRODUCTS.find(I => I.id === k.premium) || {}).nombre || '')}, prueba)` : esc(k.n)).join(' · ')}</span>` : ''}</div></div>`; }).join('')
        : '<p class="small">Aún no tienes vehículo: vas andando o en autobús. La bici está en la Tienda.</p>'}
      ${vend.length ? `<p class="small">Vehículos anteriores: ${vend.map(v => `${P2.producto(v.id).ic} ${esc(P2.producto(v.id).n)} (vendido en la sem. ${v.semana})`).join(' · ')}</p>` : ''}
      <p class="small">Próximamente: ${P2.PRODUCTOS.filter(P => P.cat === 'vehiculos' && P.proximamente).map(P => `${P.ic} ${esc(P.n)}`).join(', ')}.</p></div>`;
  }

  function htmlHitos(s) {
    const sig = P2.siguienteHito(s);
    return `<div class="card"><h2>🏅 Hitos del capítulo 1</h2><p class="small">Cada hito abre algo nuevo.</p>
      ${HITOS.map((H, i) => `<div class="lin ${s.hitos[H.id] ? 'bien' : ''}"><span class="ic">${s.hitos[H.id] ? '✅' : H === sig ? '🎯' : '⬜'}</span><span><b>${i + 1}. ${esc(H.n)}</b>${s.hitos[H.id] ? ` · semana ${s.hitos[H.id]}` : ''}<br><span class="small">Abre: ${esc(H.abre)}</span></span></div>`).join('')}</div>
      <div class="card"><h3>📔 Diario</h3>${s.diario.slice(-25).reverse().map(d => `<div class="lin"><span class="ic">${d.ic}</span><span><span class="small">S${d.semana}</span> ${esc(d.t)}</span></div>`).join('') || '<p class="small">Aún vacío.</p>'}</div>`;
  }

  function htmlAjustes(s) {
    const B = ui.balance;
    const lab = P2.MONETIZATION.activa ? P2.IAP_PRODUCTS.filter(I => P2.iapEnVariante(s, I.id) && (I.categoria !== 'cosmetico') && (I.id !== 'founder' || ((s.tele || {}).msActivo || 0) >= P2.MONETIZATION.iap.minutosFounder * 60000)) : [];
    return `${htmlInforme(s)}${lab.length ? `<div class="sec"><span>🧪 Productos en prueba</span><span>variante ${esc(s.monVariante || '')}</span></div><p class="small blanco">No se cobra nada: solo queremos saber si te interesarían.</p>${lab.map(I => htmlIapCard(s, I.id, 'ajustes')).join('')}` : ''}<div class="card"><h2>⚙️ Partida</h2>${kv('Semana', s.semana)}${kv('Patrimonio', eur(P2.patrimonio(s)))}${kv('Guardado', `versión ${s.saveVersion}`)}
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
        <div class="lookInfo"><span class="small">Elige cada capa. ${s ? 'Algunas prendas se ganan con los hitos o en la Tienda.' : 'Más adelante podrás cambiarlo tocando tu cara arriba; algunas prendas se ganan con los hitos.'}</span>
        <button class="btn w" data-act="lookAzar">🎲 Al azar</button></div></div>
      <div class="lookTabs" role="tablist">${P2.CAPAS_LOOK.map(([k, ic, n]) => `<button role="tab" aria-selected="${k === cap}" data-act="capa" data-v="${k}" class="${k === cap ? 'sel' : ''}"><span>${ic}</span>${n}</button>`).join('')}</div>
      <div class="lookGrid">${items.map(it => { const bl = s ? P2.bloqueoLook(s, it, cap) : null, puesto = L[cap] === it.id;
        return `<button class="lk ${puesto ? 'sel' : ''}" data-act="look" data-c="${cap}" data-v="${it.id}" ${bl ? 'disabled' : ''} aria-pressed="${puesto}">${P2.avatarSVG(sv, Object.assign({}, L, { [cap]: it.id }), vista)}<b>${esc(it.n)}</b>${bl ? `<span>🔒 ${esc(bl)}</span>` : ''}</button>`; }).join('')}</div>`;
  }
  function htmlPersonaje(s) {
    return `<div class="card perfilTop">${escena(s, true)}<h2>🧍 ${esc(s.nombre)}</h2></div><div class="card">${htmlEditor(s, s.look)}</div><div class="card">${htmlTresVariables(s)}</div>${htmlCosas(s)}`;
  }
  function htmlHistoria(s) {
    const H = P2.miHistoria(s), cel = (ic, v, n) => `<div><span>${ic}</span><b>${v}</b><small>${n}</small></div>`;
    return `<div class="card historia"><h2>🏆 Mi historia</h2><div class="trofeos">
        ${cel('🏆', H.ligasGanadas, 'ligas ganadas')}${cel('⬆️', H.ascensos, 'ascensos')}${cel('📅', H.temporadas, 'temporadas')}${cel('⚽', H.goles, 'goles')}
        ${cel('🤝', H.marcas.length, 'patrocinadores')}${cel('💼', H.empresas, 'empresas')}${cel('🏦', esc(eur(H.patrimonioMax)), 'mayor patrimonio')}${cel('🏅', H.hitos.length, 'hitos')}</div></div>
      <div class="card">${kv('👕 Clubes', H.clubes.length ? esc(H.clubes.join(', ')) : '—')}${kv('🤝 Marcas', H.marcas.length ? H.marcas.map(M => `${M.ic} ${esc(M.n)}`).join(', ') : '—')}
        ${kv('🚗 Vehículos', H.vehiculos.length ? H.vehiculos.map(P => P.ic).join(' ') : '—')}${kv('🏠 Viviendas', H.viviendas.map(P => P.ic).join(' → '))}
        ${kv('🏆 Colecciones', H.colecciones.length ? H.colecciones.map(C => `${C.ic} ${esc(C.n)}`).join(', ') : '—')}</div>
      <div class="card"><h3>Hitos</h3>${H.hitos.length ? H.hitos.map(x => `<div class="lin bien"><span class="ic">✅</span><span>${esc(x.n)} · semana ${s.hitos[x.id]}</span></div>`).join('') : '<p class="small">Tu historia acaba de empezar.</p>'}</div>`;
  }

  // ---------- Render ----------
  function render() {
    if (!S) { pintarEtapa('barrio'); $('top').innerHTML = ''; $('nav').innerHTML = ''; $('main').innerHTML = htmlIntro(); $('main').classList.remove('conBoton'); return; }
    // Secciones abiertas por algo hecho fuera de la semana (firmar una marca, comprar…): se avisa aquí
    const nuevas = P2.revisarSecciones(S, null);
    if (nuevas.length) { ui.desbloqueos = (ui.desbloqueos || []).concat(nuevas); P2.guardar(S); }
    if (!P2.seccionesVisibles(S).some(x => x.id === ui.vista)) ui.vista = 'semana';
    pintarEtapa(etapa(S));
    $('top').innerHTML = htmlTop(S);
    $('nav').innerHTML = htmlNav(S);
    const V = { semana: () => htmlHero(S) + htmlSituacion(S) + htmlDecision(S) + htmlConsecuencia(S) + htmlExtrasInicio(S) + htmlAccesos(S) + htmlBoton(S), liga: htmlLiga, empresa: htmlEmpresa, marcas: htmlMarcas, hitos: htmlHitos, ajustes: htmlAjustes, personaje: htmlPersonaje,
      relaciones: htmlRelaciones, tienda: htmlTienda, patrimonio: htmlPatrimonio, historia: htmlHistoria, inversiones: htmlInversiones }[ui.vista] || (() => '');
    // Anuncio obligatorio simulado: solo en transiciones grandes, nunca durante una decisión ni tras comprar
    if (ui.vista === 'semana' && !ui.inter && !ui.nuevaCompra && P2.intersticialAhora(S)) { ui.inter = true; P2.intersticialMostrado(S); P2.guardar(S); }
    const capa = ui.rw ? htmlRw(S) : ui.iap ? htmlIapModal(S) : ui.nuevaCompra ? htmlNuevaCompra() : ui.inter ? htmlInter(S) : P2.monEstado(S).deseoAviso && !ui.nuevaCompra ? htmlDeseoAviso(S) : '';
    $('main').innerHTML = (ui.flash ? `<div class="flash">${esc(ui.flash)}</div>` : '') + htmlSubtabs(S) + V(S) + capa;
    ui.flash = '';
    $('main').classList.toggle('conBoton', ui.vista === 'semana');
  }
  const guardarYPintar = () => { P2.guardar(S); render(); };
  function pintarEtapa(e) {
    if (document.body.dataset.etapa === e) return;
    document.body.dataset.etapa = e;
    const d = $('decor'); if (d) d.innerHTML = decorSVG(e);
  }
  function irA(v) {
    ui.vista = v; ui.msg = ''; ui.confirmar = null; ui.ultimaDe = Object.assign(ui.ultimaDe || {}, { [grupoDe(v)]: v });
    P2.tele(S, 'vista', { id: v });
    if ((S.seccionesNuevas || []).includes(v)) S.seccionesNuevas = S.seccionesNuevas.filter(x => x !== v);
    P2.guardar(S); render(); window.scrollTo(0, 0);
  }

  function alPulsar(e) {
    if (S) P2.teleTiempo(S);
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act, id = b.dataset.id, neg = b.dataset.neg;
    if (a !== 'reiniciar') ui.reinicio = false;
    if (a !== 'vender') ui.vender = null;
    if (a !== 'comprarP') ui.confirmar = null;
    if (a !== 'venderP') ui.venderP = null;
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
      case 'vista': ui.nuevaCompra = null; irA(b.dataset.v); break;
      case 'grupo': { const g = b.dataset.g, vis = P2.seccionesVisibles(S).filter(x => x.grupo === g).map(x => x.id), u = (ui.ultimaDe || {})[g];
        irA(vis.includes(u) ? u : vis[0] || 'semana'); break; }
      case 'cat': ui.cat = b.dataset.v; render(); break;
      case 'comprarP': { const P = P2.producto(id); if (!P) break;
        if (P2.precioPara(S, P) >= 500 && ui.confirmar !== id) { ui.confirmar = id; render(); break; }   // lo caro se confirma: ¿coche o empresa?
        ui.confirmar = null; if (P2.comprar(S, id)) { ui.nuevaCompra = id; guardarYPintar(); } break; }
      case 'cerrarCompra': ui.nuevaCompra = null; render(); break;
      case 'quiero': if (P2.quiero(S, id)) guardarYPintar(); break;
      case 'verDeseo': { const P = P2.producto(S.deseoActual); if (P) { ui.cat = P.cat; irA('tienda'); } break; }
      case 'deseoTienda': { const a = P2.monEstado(S).deseoAviso; P2.monEstado(S).deseoAviso = null; if (a) ui.cat = P2.producto(a.id).cat; irA('tienda'); break; }
      case 'deseoLuego': P2.monEstado(S).deseoAviso = null; guardarYPintar(); break;
      // Anuncios con recompensa (simulados): nada se entrega hasta «Simular anuncio y aceptar»
      case 'rw': { const p = P2.pedirRewarded(S, b.dataset.t, { id: b.dataset.id || undefined, contexto: ui.vista }); if (p) { ui.rw = p; guardarYPintar(); } break; }
      case 'rwNo': P2.cancelarRewarded(S); ui.rw = null; guardarYPintar(); break;
      case 'rwOk': { const r = ui.rw && P2.aceptarRewarded(S, ui.rw.token); ui.rw = null;
        if (r) { ui.rwSesion = (ui.rwSesion || 0) + 1;
          ui.flash = r.tipo === 'cupon' ? `🏷️ Cupón listo: ${P2.producto(r.id).n} por ${eur(r.precio)}` : r.tipo === 'oferta' ? `🎁 Oferta: ${P2.producto(r.id).n} por ${eur(r.precio)} (antes ${eur(r.original)})` : r.tipo === 'energia' ? `⚡ +${r.ganado} de energía` : '🕶️ Gafas edición temporada desbloqueadas'; }
        guardarYPintar(); break; }
      case 'premioVisto': { const tp = P2.monEstado(S).temporadaPremio; if (tp) tp.visto = true; guardarYPintar(); break; }
      // Compras con dinero real: SOLO prueba de intención. Nunca hay checkout ni cargo
      case 'iap': if (P2.iapClic(S, id)) { ui.iap = id; ui.iapResp = null; ui.inter = false; guardarYPintar(); } break;
      case 'iapResp': if (P2.iapIntencion(S, ui.iap, b.dataset.v)) { ui.iapResp = b.dataset.v; if (ui.iapCard === ui.iap) ui.iapCard = null; guardarYPintar(); } break;
      case 'iapCerrar': ui.iap = null; ui.iapResp = null; render(); break;
      case 'iapNo': ui.iapCard = null; render(); break;
      case 'interOk': P2.intersticialContinuar(S); ui.inter = false; guardarYPintar(); break;
      case 'equipar': if (P2.equipar(S, id)) guardarYPintar(); break;
      case 'venderP': if (ui.venderP !== id) { ui.venderP = id; render(); } else { ui.venderP = null; P2.venderPosesion(S, id); guardarYPintar(); } break;
      case 'accion': if (P2.jugarSemana(S, id)) { guardarYPintar(); window.scrollTo(0, 0); } break;
      case 'decidir': { const r = P2.resolverDecision(S, id); if (r) { if (r.ir) irA(r.ir); else { guardarYPintar(); window.scrollTo(0, 0); } } break; }
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
    ir: v => irA(v), etapa: () => etapa(S), ui2: ui,
    jugar: id => { const r = P2.jugarSemana(S, id || eleccion(S)); guardarYPintar(); return r; }, eleccion: () => eleccion(S),
    decidir: id => { const r = P2.resolverDecision(S, id); guardarYPintar(); return r; },
    guardar: () => P2.guardar(S), cargar: () => { S = P2.cargar(); render(); return S; },
    migrateSave: P2.migrateSave, runBalance: (n, m) => P2.runBalance(n || 100, m), informeBalance: (n) => informeTexto(P2.runBalance(n || 100)),
  };
  P2.arrancar = arrancar;
})(globalThis.P2 = globalThis.P2 || {});
