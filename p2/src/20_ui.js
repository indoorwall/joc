/* =====================================================================
   20 · INTERFAZ (móvil): SITUACIÓN → DECISIÓN → CONSECUENCIA
   Solo pinta y llama a jugarSemana / resolverDecision / acciones de gestión.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, OFERTAS, OBJETIVOS, LIGAS, MARCAS, NEGOCIOS, HITOS, OPORTUNIDADES, esc, eur, nf, fmt, clamp } = P2;
  let S = null;
  const ui = { vista: 'semana', reinicio: false, balance: null, msg: '', look: null, capa: 'piel', nombre: 'Alex', celes: [] };
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
  // Decoración encima de cualquier vivienda (solo aspecto)
  function decoCasaSVG(d) {
    if (!d || d === 'nada') return '';
    if (d === 'plantas') return '<rect x="4" y="96" width="12" height="12" rx="2" fill="#8a5a2b"/><path d="M10 96 q-8 -14 -2 -22 q4 8 2 22 q2 -16 10 -18 q-2 12 -10 18" fill="#22a35a"/><ellipse cx="40" cy="104" rx="12" ry="4" fill="#ff8a2a"/><ellipse cx="54" cy="104" rx="10" ry="4" fill="#ffc83d"/>';
    if (d === 'lujo') return '<rect x="40" y="10" width="34" height="24" fill="#2b1f4f" stroke="#ffc83d" stroke-width="3"/><path d="M44 30 l9 -12 7 8 5 -5 6 9Z" fill="#7fd8ff"/><ellipse cx="60" cy="112" rx="40" ry="6" fill="#7b1e3a" opacity=".85"/><path d="M8 70 h10 l-3 10 h-4Z" fill="#ffc83d"/><rect x="12" y="80" width="2" height="26" fill="#c8901a"/><circle cx="13" cy="70" r="9" fill="#ffc83d" opacity=".25"/>';
    if (d === 'mansion') return '<path d="M60 0 v8" stroke="#c8901a" stroke-width="2"/><path d="M44 14 q16 10 32 0 l-4 6 q-12 6 -24 0Z" fill="#ffc83d"/>' + [46, 53, 60, 67, 74].map(x => `<circle cx="${x}" cy="22" r="1.8" fill="#fff8d6"/>`).join('') + '<circle cx="60" cy="16" r="18" fill="#ffc83d" opacity=".18"/><rect x="6" y="14" width="22" height="30" fill="#5b2bb5" stroke="#ffc83d" stroke-width="3"/><rect x="92" y="14" width="22" height="30" fill="#14206b" stroke="#ffc83d" stroke-width="3"/><path d="M30 120 L40 92 h40 L90 120Z" fill="#a3122a" opacity=".85"/><path d="M40 92 h40" stroke="#ffc83d" stroke-width="2"/>';
    if (d === 'founder') return '<rect x="44" y="12" width="32" height="22" rx="2" fill="#0b1033" stroke="#ffc83d" stroke-width="2.5"/><path d="M60 15 l2.5 5 5.5 .8 -4 3.8 1 5.4 -5 -2.6 -5 2.6 1 -5.4 -4 -3.8 5.5 -.8Z" fill="#ffc83d"/>';
    const club = /^club_/.test(d) && P2.CLUBES_PACK[d.slice(5)];
    if (club) return `<path d="M8 12 h34 l-17 22Z" fill="${club.c1}" stroke="${club.c2}" stroke-width="2"/><text x="25" y="23" text-anchor="middle" font-size="9">${club.ic}</text><path d="M80 10 q14 6 28 0 v6 q-14 6 -28 0Z" fill="${club.c1}"/><path d="M86 12 v6 M94 13 v6 M102 12 v6" stroke="${club.c2}" stroke-width="2"/><rect x="88" y="60" width="22" height="26" rx="2" fill="#fff" stroke="${club.c1}" stroke-width="2"/><text x="99" y="78" text-anchor="middle" font-size="11" font-weight="900" fill="${club.c1}">9</text>`;
    const copa = /^trofeo_/.test(d) && P2.CAMPEON_PACK[d.slice(7)];
    if (copa) return `<rect x="78" y="58" width="38" height="4" fill="#8a5a2b"/><path d="M88 34 h18 v5 q0 12 -9 13 q-9 -1 -9 -13Z" fill="#ffc83d" stroke="#c8901a"/><rect x="95.5" y="52" width="3" height="3" fill="#ffc83d"/><rect x="91" y="55" width="12" height="3" fill="${copa.c1}"/><circle cx="97" cy="44" r="18" fill="#ffc83d" opacity=".15"/>`;
    return '';
  }
  // Tu despacho (cuando tienes empresa) con su decoración
  function despachoSVG(d) {
    let x = '<rect width="160" height="90" fill="#e9e4ff"/><rect y="70" width="160" height="20" fill="#b9a98f"/><rect x="96" y="10" width="54" height="36" fill="#bfe0ff" stroke="#fff" stroke-width="3"/><path d="M123 10 v36 M96 28 h54" stroke="#fff" stroke-width="2"/>';
    if (d === 'magnate') x = '<rect width="160" height="90" fill="#0d0d12"/><rect y="70" width="160" height="20" fill="#2a1a10"/><rect x="8" y="6" width="144" height="52" fill="#07071a" stroke="#ffc83d" stroke-width="2"/>' + [[12, 26], [24, 14], [36, 30], [50, 10], [64, 24], [80, 16], [96, 28], [110, 12], [126, 22], [138, 30]].map(([a, b]) => `<rect x="${a}" y="${b}" width="11" height="${58 - b}" fill="#141433" stroke="#ffc83d" stroke-width=".6"/><rect x="${a + 3}" y="${b + 4}" width="2" height="3" fill="#ffc83d"/>`).join('');
    if (d === 'lujo') x += '<rect x="12" y="10" width="34" height="24" fill="#2b1f4f" stroke="#ffc83d" stroke-width="3"/><path d="M16 30 l9 -12 7 8 5 -5 6 9Z" fill="#7fd8ff"/><ellipse cx="80" cy="84" rx="50" ry="5" fill="#7b1e3a" opacity=".8"/>';
    if (d === 'plantas' || d === 'lujo') x += '<rect x="6" y="56" width="12" height="14" rx="2" fill="#8a5a2b"/><path d="M12 56 q-8 -14 -2 -22 q4 8 2 22 q2 -16 10 -18 q-2 12 -10 18" fill="#22a35a"/>';
    const mesa = d === 'magnate' ? '#ffc83d' : d === 'lujo' ? '#5b3a1e' : '#c8b38f';
    x += `<rect x="40" y="52" width="80" height="8" rx="2" fill="${mesa}"/><rect x="44" y="60" width="6" height="14" fill="${mesa}"/><rect x="110" y="60" width="6" height="14" fill="${mesa}"/><rect x="66" y="40" width="22" height="13" rx="2" fill="#1a1640"/><rect x="68" y="42" width="18" height="9" fill="#7fd8ff"/>`;
    x += `<path d="M126 44 h12 v22 h-12Z" fill="${d === 'magnate' ? '#111' : d === 'lujo' ? '#4b1f7a' : '#3b4a6b'}"/><rect x="124" y="64" width="16" height="4" rx="2" fill="#222"/>`;
    if (d === 'magnate') x += '<circle cx="50" cy="44" r="7" fill="#3d7bff" stroke="#ffc83d" stroke-width="1.5"/><path d="M43 44 h14 M50 37 q4 7 0 14 q-4 -7 0 -14" stroke="#ffc83d" stroke-width=".8" fill="none"/><rect x="48" y="51" width="4" height="2" fill="#ffc83d"/>';
    if (d === 'lujo') x += '<path d="M100 44 h8 l-2 8 h-4Z" fill="#ffc83d"/><circle cx="104" cy="44" r="7" fill="#ffc83d" opacity=".25"/>';
    return `<svg viewBox="0 0 160 90" aria-hidden="true">${x}</svg>`;
  }
  function casaSVG(id, d) {
    const v = id || 'habitacion';
    let x = '';
    if (v === 'habitacion') x = `<rect width="120" height="120" fill="#6d5ccf"/><rect y="88" width="120" height="32" fill="#4a3a9e"/><rect x="12" y="18" width="26" height="34" rx="2" fill="#ffc83d" opacity=".85"/><path d="M16 46 l8 -12 6 8 4 -5 4 9Z" fill="#ff4f8b"/><rect x="70" y="70" width="46" height="22" rx="4" fill="#8fb4ff"/><rect x="72" y="62" width="14" height="10" rx="3" fill="#fff"/>`;
    else if (v === 'piso') x = `<rect width="120" height="120" fill="#2c3fa8"/><rect y="90" width="120" height="30" fill="#1b2a7a"/><rect x="62" y="14" width="46" height="44" rx="3" fill="#0b1033" stroke="#cfd8ff" stroke-width="3"/>${[[66, 30, 8, 28], [78, 22, 9, 36], [92, 34, 10, 24]].map(([a, b, w, h]) => `<rect x="${a}" y="${b}" width="${w}" height="${h}" fill="#3b2a9e"/><rect x="${a + 2}" y="${b + 4}" width="3" height="3" fill="#ffd66b"/>`).join('')}<rect x="8" y="74" width="44" height="18" rx="6" fill="#ff7aa8"/><rect x="14" y="66" width="12" height="10" rx="3" fill="#ffc0d6"/>`;
    else if (v === 'casaPremium') x = `<rect width="120" height="120" fill="#7fd8ff"/><circle cx="96" cy="20" r="10" fill="#ffc83d"/><rect y="86" width="120" height="34" fill="#5b7dff"/><rect x="8" y="94" width="50" height="12" rx="6" fill="#bff3ff"/><rect x="62" y="44" width="52" height="44" fill="#fff"/><path d="M58 46 L88 24 L118 46Z" fill="#1a1640"/><rect x="72" y="58" width="12" height="12" fill="#7fd8ff"/><rect x="92" y="58" width="12" height="12" fill="#7fd8ff"/>`;
    return `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${x}${decoCasaSVG(d)}</svg>`;
  }
  function vehiculoSVG(id, skin) {
    const S = (P2.SKINS_VEHICULO[id] || []).find(k => k.id === skin), c = S ? S.c : { bici: '#3d7bff', moto: '#ff4f8b', cocheUsado: '#8fa3c7', deportivo: '#e23b3b', superdeportivo: '#ffc83d' }[id] || '#8fa3c7';
    const rueda = (x, r = 9) => `<circle cx="${x}" cy="48" r="${r}" fill="#1a1640"/><circle cx="${x}" cy="48" r="${r * 0.45}" fill="#cfd3e6"/>`;
    let x = '';
    if (id === 'bici') x = `${rueda(22, 11)}${rueda(78, 11)}<path d="M22 48 L42 26 L66 26 L78 48 M42 26 L50 48 L66 26 M38 20 h10 M64 20 l4 6" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    else if (id === 'moto') x = `${rueda(22, 11)}${rueda(80, 11)}<path d="M22 48 L40 30 L68 30 L80 48 Z" fill="${c}"/><rect x="44" y="22" width="20" height="8" rx="4" fill="#1a1640"/><path d="M68 30 L76 18 h6" stroke="#cfd3e6" stroke-width="3" fill="none"/>`;
    else if (id === 'deportivo' || id === 'superdeportivo') x = `<path d="M4 46 Q6 34 24 32 L40 22 Q56 18 70 24 L88 32 Q98 34 98 46Z" fill="${c}"/><path d="M42 26 Q56 21 68 26 L74 32 L38 32Z" fill="#7fd8ff" opacity=".85"/>${rueda(24)}${rueda(78)}${id === 'superdeportivo' ? '<path d="M2 30 h14" stroke="#1a1640" stroke-width="4"/>' : ''}`;
    else x = `<path d="M6 46 L8 30 Q10 26 18 26 L30 14 L70 14 L82 26 Q94 28 94 36 L94 46Z" fill="${c}"/><path d="M34 18 L48 18 L48 26 L26 26Z M52 18 L68 18 L78 26 L52 26Z" fill="#bfe9ff"/>${rueda(26)}${rueda(74)}`;
    // Aspecto de pack: franjas del segundo color
    if (S && S.f) x += id === 'bici' ? `<path d="M42 26 L66 26" stroke="${S.f}" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="48" r="4" fill="${S.f}"/><circle cx="78" cy="48" r="4" fill="${S.f}"/>`
      : id === 'moto' ? `<path d="M40 36 H70" stroke="${S.f}" stroke-width="3"/>` : `<path d="M${id === 'cocheUsado' ? 10 : 8} 40 H92" stroke="${S.f}" stroke-width="3"/><path d="M${id === 'cocheUsado' ? 10 : 8} 44 H92" stroke="${S.f}" stroke-width="1.2"/>`;
    return `<svg viewBox="0 0 100 60" aria-hidden="true">${x}</svg>`;
  }
  const vivienda = s => (P2.equipado(s, 'vivienda') || { id: 'habitacion' }).id;
  const vehiculo = s => { const P = P2.equipado(s, 'vehiculo'); if (!P) return null; const it = (s.inventario || []).find(i => i.id === P.id); return { P, skin: it && it.skin }; };
  function escena(s, grande) {
    const V = vehiculo(s);
    return `<div class="escenaCasa ${grande ? 'grande' : ''}">${casaSVG(vivienda(s), P2.deco(s).casa)}<div class="pj">${P2.avatarSVG(s, null, 'cuerpo')}</div>${V ? `<div class="veh">${vehiculoSVG(V.P.id, V.skin)}</div>` : ''}</div>`;
  }

  // ---------- Cabecera y navegación ----------
  function htmlTop(s) {
    const SEC = P2.SECCIONES.find(x => x.id === ui.vista);
    if (ui.vista !== 'semana') return `<button class="atras" data-act="vista" data-v="semana">‹ Jugar</button><div class="hwho"><b>${SEC ? `${SEC.ic} ${esc(SEC.id === 'relaciones' ? 'Vida' : SEC.id === 'personaje' ? 'Perfil' : SEC.n)}` : ''}</b></div><div class="dinero">💶 <b>${esc(eur(s.p.dinero))}</b></div>`;
    return `<button class="hava" data-act="vista" data-v="personaje" aria-label="Tu personaje">${P2.avatarSVG(s, null, 'busto')}</button>
      <div class="hwho"><b>Semana ${s.semana} ${insignias()}<span class="vidasTop">${'❤️'.repeat(P2.vidas(s).n)}</span></b><span>${esc(nombreFase(s).replace(/ · semana \d+.*$/, ''))}</span></div><div class="dinero">💶 <b>${esc(eur(s.p.dinero))}</b></div>
      <button class="mundoBtn" data-act="mundo" aria-label="Mi mundo">🌍${hayNovedad(s) ? '<i aria-label="hay novedades"></i>' : ''}</button>
      <div class="ener" aria-label="Energía ${Math.round(s.p.energia)}">⚡<div class="bar"><i style="width:${Math.round(s.p.energia)}%"></i></div>${Math.round(s.p.energia)}</div>`;
  }
  function htmlTopViejo(s) {
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
    if (!ui.iapCard && !(COM && COM.isMinor())) { const I = P2.ofertaIapAhora(s, ui.iapSesion || 0); if (I) { P2.marcarIapMostrado(s, I.id); ui.iapCard = I.id; ui.iapSesion = (ui.iapSesion || 0) + 1; P2.guardar(s); } }
    if (ui.iapCard) h += htmlIapCard(s, ui.iapCard, 'momento');
    return h;
  }
  const TITULO_MOMENTO = { contrato: '🎉 TU PRIMER CONTRATO', titular: '⭐ YA ERES TITULAR', patro: '🤝 TU PRIMER PATROCINADOR', empresa: '💼 TU PRIMERA EMPRESA', rentable: '📈 EMPRESA RENTABLE' };
  const precioTxt = p => `${String(p.toFixed(2)).replace('.', ',')} €`;
  function htmlIapCard(s, id, donde) {
    const I = P2.IAP_PRODUCTS.find(x => x.id === id); if (!I) return '';
    const sku = OLD_IAP[id], Pc = sku && P2C.getProduct(sku);
    if (Pc && Pc.entitlements.every(e => P2.tieneEnt(e))) return '';   // lo que ya tienes no se vuelve a ofrecer
    P2.iapMostrado(s, id, donde);
    return `<div class="card iapCard rz-${I.rareza || 'raro'}">${donde === 'momento' ? `<small class="mom">${TITULO_MOMENTO[I.momentoOferta] || '🎉'}</small>` : ''}
      <div class="fila"><div class="iapPrev">${P2.avatarSVG(s, lookPack(s, I), 'busto')}</div><div><b>${I.ic} ${esc(I.nombre.toUpperCase())}</b><p class="small">${esc(I.descripcion)}</p></div></div>
      <button class="btn full iapBtn" data-act="iap" data-id="${I.id}">Ver · ${realTxt(((P2C.getProduct(OLD_IAP[I.id]) || {}).prices || {}).EUR || Math.round(I.precio * 100))} <span class="lab">💎 Premium</span></button>
      ${donde === 'momento' ? '<button class="btn w full" data-act="iapNo">No, gracias</button>' : ''}</div>`;
  }
  // Cómo te quedaría el pack (vista previa)
  function lookPack(s, I) { if (P2.PACKS[OLD_IAP[I.id]]) return P2.lookPack(s, OLD_IAP[I.id]); const L = Object.assign({}, s.look); for (const c of I.contenido) if (Array.isArray(c)) L[c[0]] = c[1]; return L; }
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
    const F = T.formato || 'goles', D = P2.deporteDe(s), circ = F === 'circuito';
    const ult = T.resultados.slice(-3).map(j => { if (circ) { const i = j[0].orden.indexOf(T.yo); return `${i + 1}º`; } const m = j.find(x => x.l === T.yo || x.v === T.yo); return `${P2.nombreEquipo(T, m.l)} ${m.gl}-${m.gv} ${P2.nombreEquipo(T, m.v)}`; });
    const cab = circ ? '<th>#</th><th>Deportista</th><th>Pruebas</th><th>🥇</th><th>Pts</th>' : F === 'goles' ? '<th>#</th><th>Equipo</th><th>PJ</th><th>DG</th><th>Pts</th>' : `<th>#</th><th>${D.individual ? 'Jugador/a' : 'Equipo'}</th><th>PJ</th><th>G</th><th>P</th>`;
    const fila = r => circ ? `<td>${r.pj}</td><td>${r.g}</td><td><b>${r.pts}</b></td>` : F === 'goles' ? `<td>${r.pj}</td><td>${r.gf - r.gc >= 0 ? '+' : ''}${r.gf - r.gc}</td><td><b>${r.pts}</b></td>` : `<td>${r.pj}</td><td><b>${r.g}</b></td><td>${r.p}</td>`;
    const c = s.contrato;
    return `<div class="card"><h2>${esc(L.n)}</h2><p class="small">Jornada ${T.jornada} de ${T.calendario.length} · ${Z.asc ? `suben ${Z.asc} a ${esc(LIGAS[L.sube].corto)}` : 'categoría más alta: se juega el título'}${Z.desc ? ` · bajan ${Z.desc} a ${esc(LIGAS[L.baja].corto)}` : ' · no hay descenso'}</p>
      <table><tr>${cab}</tr>
      ${tabla.map((r, i) => `<tr class="${r.id === T.yo ? 'yo' : ''} ${i < Z.asc ? 'asc' : i >= n - Z.desc ? 'desc' : ''}"><td>${i + 1}</td><td>${esc(r.n)}</td>${fila(r)}</tr>`).join('')}</table>
      ${circ ? `<p class="small">Cada prueba: ${P2.PTS_CIRCUITO.join(', ')} puntos del 1º al 8º.</p>` : ''}
      <p class="small">${Z.asc ? '🟩 ascenso' : ''}${Z.asc && Z.desc ? ' · ' : ''}${Z.desc ? '🟥 descenso' : ''}</p></div>
      <div class="card"><h3>${D.individual ? 'Tu temporada' : 'Tu equipo'}</h3>${kv('Objetivo del club', OBJETIVOS[P2.objetivoDe(T)].n)}${s.especialidad && D.especialidades ? kv('Tu especialidad', esc((D.especialidades.find(([id]) => id === s.especialidad) || [, '—'])[1])) : ''}
        ${circ || D.condiciones ? [0, 1, 2].map(i => T.jornada + i < T.calendario.length ? kv(i ? 'Después' : 'Próxima prueba', esc(P2.NOMBRE_COND[P2.condicion(s, T, T.jornada + i)] || '—') + (P2.bonusEspecialidad(s, P2.condicion(s, T, T.jornada + i)) > 0 ? ' ⭐' : '')) : '').join('') : ''}
        ${circ ? '' : prox.map((p, i) => kv(i ? 'Después' : 'Próximo rival', `${p.local ? '🏠' : '✈️'} ${esc(P2.nombreEquipo(T, p.rival))}`)).join('')}
        ${D.id === 'escalada' ? kv('Grado en roca', s.gradoRoca == null ? '—' : P2.GRADOS[s.gradoRoca]) : ''}${D.id === 'skate' ? kv('Estilo', `${s.estilo || 0}/20`) : ''}${D.id === 'basket' ? kv('Acierto de tiro', `${s.tiro || 0}/10`) : ''}
        ${D.id === 'tenis' ? kv('Dominio de superficies', ['tierra', 'dura', 'hierba'].map(k => `${P2.NOMBRE_COND[k].split(' ')[0]} ${(s.superficies || {})[k] || 0}/3`).join(' · ')) : ''}
        ${ult.length ? kv('Últimos', esc(ult.join(' · '))) : ''}</div>
      <div class="card"><h3>Tú</h3>${kv('Contrato', `${eur(c.sueldo)}/semana · ${c.temporadasRestantes} ${c.temporadasRestantes === 1 ? 'temporada' : 'temporadas'}`)}
        ${htmlTresVariables(s)}${kv('Confianza del míster', `${Math.round(s.confianza)}/100`)}${kv('Interés de otros clubes', `${Math.round(s.interes)}/100`)}${kv('Valor de mercado', eur(P2.valorMercado(s)))}
        ${kv('Partidos', `${s.stats.jugados} (${s.stats.titular} de titular) · ${s.stats.goles} ${P2.V(s).stats}`)}${kv('Agente', s.agente ? 'Sí' : 'Al ser titular 3 veces')}
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
      return h + htmlMercado(s);
    }
    for (const n of s.negocios) h += htmlNegocio(s, n);
    h += htmlMercado(s);
    if (P2.tieneHito(s, 'rentable') && !s.oportunidad) {
      h += `<div class="card"><h3>🔑 Segunda inversión</h3>${OPORTUNIDADES.map(o => opcion({ id: o.id, n: `${o.ic} ${o.n}`, ventaja: o.d, coste: `Pones tú: ${eur(o.coste)}`, bloqueo: s.p.dinero < o.coste ? `Tienes ${eur(s.p.dinero)}` : null }, 'oportunidad')).join('')}</div>`;
    }
    if (s.socio) { const p = s.socio, E = P2.SOCIO.estados[p.estado] || {};
      h += `<div class="card"><h3>🤝 Tu parte de la cafetería</h3>${p.vendida ? `<p class="small">La vendiste por ${eur(p.precioVenta)}. Cobraste ${eur(p.dividendos)} en dividendos.</p>` :
        `${kv('Vale ahora', eur(p.valor))}${kv('Has puesto', eur(p.aportado))}${kv('Dividendos cobrados', eur(p.dividendos))}${kv('Cómo va', `${E.ic || ''} ${esc(E.n || '—')}`)}${kv('Próximas noticias', `semana ${p.proximo}`)}
        <p class="small">No la gestionas. Cada ${P2.SOCIO.trimestre} semanas llega el resultado: puede haber dividendo, no haberlo, perder valor o pedirte más capital.</p>`}</div>`; }
    if (s.negocios.length) h += `<div class="sec"><span>🪑 Tu despacho</span><span>solo aspecto</span></div><div class="card despacho"><div class="despSvg">${despachoSVG(P2.deco(s).despacho)}</div>${htmlDeco(s, 'despacho')}</div>`;
    return h;
  }
  // Negocios en traspaso de tu deporte (la peluquería está arriba)
  function htmlMercado(s) {
    const l = P2.negociosDeCarrera(s).filter(k => NEGOCIOS[k].deporte); if (!l.length || !P2.mercadoAbierto(s)) return '';
    const D = P2.deporteDe(s);
    return `<div class="sec"><span>${D.ic} Negocios de ${esc(D.n.toLowerCase())} en traspaso</span><span>${l.length}</span></div>${l.map(k => { const T = NEGOCIOS[k], tengo = s.negocios.some(n => n.tipo === k);
      const b0 = P2.bloqueoCompra(s, k, 0);
      return `<details class="card mercado"><summary><b>${T.ic} ${esc(T.n)}</b><span class="small">${tengo ? '✅ ya es tuyo · ' : ''}traspaso ${eur(T.traspaso)}${b0 && /Necesitas tener|primera empresa|6 negocios/.test(b0) ? ` · 🔒 ${esc(b0)}` : ''}</span></summary>
        <p class="small">${esc(T.d)}</p>${kv('Precio normal', `${eur(T.precios.normal.valor)} ${esc(T.unidad)}`)}${kv('Alquiler y fijos', `${eur(T.alquiler + T.fijos)}/semana`)}${kv('Cómo lo dejan', `${T.configInicial.empleados} empleados, sueldos bajos, precios baratos`)}
        ${T.cajas.map((c, i) => { const b = P2.bloqueoCompra(s, k, i); return `<button class="opt" data-act="comprar" data-t="${k}" data-id="${i}" ${b ? 'disabled' : ''}><b>Comprar con ${eur(c)} de caja</b><span class="ls"><span class="l"><i class="v">✓</i> Total: ${eur(P2.capitalNecesario(k, i, s))}</span></span>${b ? `<span class="bl">🔒 ${esc(b)}</span>` : ''}</button>`; }).join('')}</details>`; }).join('')}`;
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
      <div class="sec">Precio ${esc(T.unidad || 'por cliente')}</div>${seg('precio', T.precios)}
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
      ${htmlCosas(s)}${htmlColecciones(s)}${htmlPremiumTienda(s)}`;
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
  // Escaparate «Estilo premium» dentro de la Tienda (variante C del test): lleva a la ficha de Premium
  function htmlPremiumTienda(s) {
    if (!P2.MONETIZATION.activa) return '';
    const l = P2.IAP_PRODUCTS.filter(I => I.categoria === 'cosmetico' && P2.iapEnVariante(s, I.id) && s.monVariante === 'C');
    if (!l.length) return '';
    return `<div class="sec"><span>⭐ Estilo premium</span><span class="lab">💎 dinero real</span></div><p class="small blanco">Solo estética. Lo que ayuda a jugar se compra siempre con dinero del juego.</p>${l.map(I => htmlIapCard(s, I.id, 'tienda')).join('')}`;
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
    if (p.tipo === 'vida') rec = '❤️ +1 vida para repetir el minijuego';
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
      <button class="btn full" data-act="interOk">Continuar</button>${sa ? `<button class="btn w full" data-act="iap" data-id="sinAnuncios">🚫 Quitar anuncios · ${realTxt(P2C.getProduct('remove_ads').prices.EUR)} <span class="lab">💎 Premium</span></button>` : ''}</div></div>`;
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
      <div class="sec"><span>🏠 Tu casa</span></div><div class="card casaCard">${escena(s, true)}<p class="small">${esc((P2.equipado(s, 'vivienda') || {}).n || '')}. Decoración: ${esc((P2.decoDe('casa', P2.deco(s).casa) || {}).n || '')}.</p>${htmlDeco(s, 'casa')}</div>`;
  }
  // Selector de decoración (casa o despacho): lo bloqueado lleva a la ficha del pack
  const skuDe = k => ({ debut: 'pack_debut', street: 'pack_street', pro: 'pack_pro', luxury: 'pack_luxury', magnate: 'pack_magnate', founder: 'founder_pack' }[k]
    || (/^club_/.test(k) ? `club_pack_${k.slice(5)}` : /^champ_/.test(k) ? `champion_pack_${k.slice(6)}` : ''));
  function htmlDeco(s, tipo) {
    const act = P2.deco(s)[tipo];
    return `<div class="decos" role="group" aria-label="Decoración">${P2.DECOR[tipo].filter(d => !(P2.bloqueoDeco(tipo, d.id) && /^(club_|trofeo_)/.test(d.id))).map(d => { const bl = P2.bloqueoDeco(tipo, d.id);
      return `<button class="deco ${act === d.id ? 'sel' : ''}" data-act="deco" data-t="${tipo}" data-v="${d.id}" aria-pressed="${act === d.id}" ${bl ? `data-sku="${esc(skuDe(d.premium))}"` : ''}>${bl ? '🔒 ' : ''}${esc(d.n)}</button>`; }).join('')}</div>`;
  }
  function htmlGaraje(s) {
    const inv = (s.inventario || []).filter(it => (P2.producto(it.id) || {}).cat === 'vehiculos'), act = (s.equipado || {}).vehiculo;
    const vend = (s.vendidos || []).filter(v => (P2.producto(v.id) || {}).cat === 'vehiculos');
    return `<div class="sec"><span>🚗 Garaje</span><span>${inv.length} ${inv.length === 1 ? 'vehículo' : 'vehículos'}</span></div><div class="card garaje">
      ${inv.length ? inv.map(it => { const P = P2.producto(it.id), skins = P2.SKINS_VEHICULO[it.id] || [];
        return `<div class="vehC ${act === it.id ? 'act' : ''}"><div class="vsvg">${vehiculoSVG(it.id, it.skin)}</div><div><b>${P.ic} ${esc(P.n)}</b> ${act === it.id ? '<span class="chip bien">En uso</span>' : `<button class="btn w mini" data-act="equipar" data-id="${P.id}">Usar</button>`}
          <span class="small">Valor ${esc(eur(it.valorActual))} · pagaste ${esc(eur(it.precioCompra))}</span>
          ${skins.length > 1 ? `<div class="skins" role="group" aria-label="Aspecto">${skins.map(k => { const bl = P2.bloqueoSkin(it.id, k.id), puesto = (it.skin || 'normal') === k.id;
            return `<button class="skin ${puesto ? 'sel' : ''}" data-act="skin" data-id="${esc(it.uid)}" data-v="${k.id}" aria-pressed="${puesto}" ${bl ? `data-sku="${esc(skuDe(k.premium))}"` : ''}><i style="background:${k.c}${k.f ? `;box-shadow:inset 0 -5px 0 ${k.f}` : ''}"></i>${bl ? '🔒 ' : ''}${esc(k.n)}</button>`; }).join('')}</div>` : ''}</div></div>`; }).join('')
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
    const R = P2.listarPartidas().find(r => r.activa) || {};
    return `${htmlInforme(s)}<div class="card"><h2>👤 Cuenta y carreras</h2><p class="small">${conCuenta() ? `Has entrado como <b>${esc(COM.account().email || 'tu cuenta')}</b>.` : 'Juegas sin cuenta. Con una cuenta gratis, tus compras y tus carreras quedan a salvo.'}</p>
        <button class="btn full" data-act="guardarSalir">💾 Guardar y salir</button><button class="btn w full" data-act="carreras">🗂️ Mis carreras</button>
        <button class="btn w full" data-act="cuenta">👤 ${conCuenta() ? 'Mi cuenta' : 'Crear cuenta o entrar'}</button><button class="btn w full" data-act="vista" data-v="premium">💎 Premium · Mis compras · Restaurar</button></div>${lab.length && false ? '' : ''}<div class="card"><h2>⚙️ Partida</h2>${kv('Carrera', esc(R.titulo || '—'))}${kv('Ranura', `${(R.n || 1)} de ${P2.ranurasMax()}`)}${kv('Semana', s.semana)}${kv('Patrimonio', eur(P2.patrimonio(s)))}${kv('Guardado', `versión ${s.saveVersion}${R.guardadoEn ? ` · ${esc(haceTxt(R.guardadoEn))}` : ''}`)}
      <div class="sec">Copia de seguridad</div><p class="small">Copia este código para guardar la partida fuera del navegador.</p>
      <textarea id="codigo" readonly>${esc(btoa(unescape(encodeURIComponent(JSON.stringify(s)))))}</textarea>
      <textarea id="importar" placeholder="Pega aquí un código para cargarlo"></textarea>
      <button class="btn w full" data-act="importar">📥 Cargar desde código</button>
      ${ui.msg ? `<p class="small">${esc(ui.msg)}</p>` : ''}
      <button class="btn r full" data-act="reiniciar">${ui.reinicio ? '⚠️ Toca otra vez para borrar esta carrera' : '🗑️ Borrar esta carrera'}</button><p class="small">Para empezar otra vida sin perder esta, usa una ranura libre en «Mis carreras».</p></div>
      <details class="card"><summary><b>🧪 Balance (simulador)</b></summary><p class="small">Juega cientos de partidas con políticas automáticas (todo trabajo, todo entreno…).</p>
        <button class="btn w full" data-act="balance">▶ Simular 100 partidas por política</button>${B ? `<pre>${esc(B)}</pre>` : ''}</details>
      <p class="small" style="color:rgba(255,255,255,.7);text-align:center">Clubes, marcas y lugares ficticios. Importes de juego. Anuncios, compras y cuenta: simulados en esta versión (sin red).</p>`;
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

  // Precio real de un deporte (la ficha se abre al tocarlo)
  const SKU_DEPORTE = { 'sport.climbing': 'sport_climbing', 'sport.tennis': 'sport_tennis', 'sport.basketball': 'sport_basketball', 'sport.skate': 'sport_skate', 'sport.surf': 'sport_surf' };
  function precioDeporte(X) { const P = globalThis.P2C && P2C.getProduct(SKU_DEPORTE[X.entitlement]); return P && P.prices && P.prices.EUR ? realTxt(P.prices.EUR) : 'Premium'; }
  function htmlIntro() {
    const p1 = P2.partidaP1();
    const dep = ui.deporte && P2.DEPORTES[ui.deporte] ? ui.deporte : 'futbol', D = P2.DEPORTES[dep];
    const elegirDep = `<div class="card"><h3>Tu deporte</h3><div class="deportes" role="radiogroup">${Object.values(P2.DEPORTES).map(X => { const ok = P2.deporteDisponible(X.id);
        return `<button role="radio" aria-checked="${X.id === dep}" class="dep ${X.id === dep ? 'sel' : ''} ${ok ? '' : 'lock'}" data-act="deporte" data-v="${X.id}" style="--dc:${X.color}"><span>${X.ic}</span><b>${esc(X.n)}</b><small>${ok ? (X.entitlement ? 'Tuyo' : 'Gratis') : `🔒 ${esc(precioDeporte(X))}`}</small></button>`; }).join('')}</div>
      <p class="small">${esc(D.d)}</p>
      ${D.especialidades ? `<p class="small"><b>Tu especialidad</b> (te da ventaja en las pruebas que son lo tuyo):</p><div class="chipsel">${D.especialidades.map(([id, n, ic, d]) => `<button data-act="especialidad" data-v="${id}" class="${(ui.esp || D.especialidades[0][0]) === id ? 'sel' : ''}" title="${esc(d)}">${ic} ${esc(n)}</button>`).join('')}</div>
        <p class="small">${esc((D.especialidades.find(([id]) => id === (ui.esp || D.especialidades[0][0])) || [])[3] || '')}</p>` : ''}</div>`;
    return `<div class="intro"><div style="font-size:48px">${D.ic} → 💈 → 🏢</div><h1>Del barrio al negocio</h1><p>Capítulo 1</p>${elegirDep}
      <div class="card"><h3>Empiezas con 17 años</h3><p class="small">Tienes 8 semanas para que un club se fije en ti. Cada semana eliges una sola cosa. No hay una opción siempre buena: todo tiene ventaja, coste y riesgo.</p>
        <label class="small" for="nombre">Tu nombre</label><input type="text" id="nombre" maxlength="20" value="${esc(ui.nombre)}"></div>
      <div class="card"><h3>Tu personaje</h3>${htmlEditor(null, ui.look || (ui.look = Object.assign({}, P2.LOOK_INICIAL)))}
        <button class="btn g full" data-act="empezar">Empezar</button>
        ${p1 ? `<button class="btn w full" data-act="desdeP1">📦 Seguir con tu jugador de P1</button><p class="small">Conserva tu nombre, parte de tus ahorros y algo de fama. Tu partida de P1 no se toca.</p>` : ''}</div>
      <div class="card introCuenta">${hayCarreras() ? '<button class="btn w full" data-act="carreras">🗂️ Mis carreras</button>' : ''}
        ${conCuenta() ? `<p class="small">👤 Has entrado como <b>${esc(COM.account().email || 'tu cuenta')}</b>.</p><button class="btn w full" data-act="cuenta">Mi cuenta</button>`
          : comercio() ? '<button class="btn w full" data-act="cuEntrar" data-v="intro">🔐 ¿Ya tienes cuenta? Entra y trae tus carreras</button><p class="small">No hace falta cuenta para jugar.</p>' : ''}</div></div>`;
  }

  // Editor del avatar: al empezar (s = null, todo lo básico) y luego desde la cabecera (con prendas que abren los hitos)
  function htmlEditor(s, L) {
    const cap = ui.capa, capa = P2.CAPAS_LOOK.find(c => c[0] === cap) || P2.CAPAS_LOOK[0], vista = capa[3];
    const items = P2.ITEMS_LOOK[cap].filter(it => s || !it.req);
    const sv = s || { p: { energia: 80 }, hitos: {} };
    return `<div class="lookTop"><div class="lookPrev">${P2.avatarSVG(sv, L, 'cuerpo')}</div>
        <div class="lookInfo"><span class="small">Elige cada capa. ${s ? 'Algunas prendas se ganan con los hitos o en la Tienda.' : 'Más adelante podrás cambiarlo tocando tu cara arriba; algunas prendas se ganan con los hitos.'}</span>
        <button class="btn w" data-act="lookAzar">🎲 Al azar</button></div></div>
      <div class="lookGrupos" role="tablist">${P2.GRUPOS_LOOK.map(([g, ic, n]) => `<button role="tab" aria-selected="${g === capa[4]}" data-act="grupoLook" data-v="${g}" class="${g === capa[4] ? 'sel' : ''}"><span>${ic}</span>${n}</button>`).join('')}</div>
      <div class="lookTabs" role="tablist">${P2.CAPAS_LOOK.filter(c => c[4] === capa[4]).map(([k, ic, n]) => `<button role="tab" aria-selected="${k === cap}" data-act="capa" data-v="${k}" class="${k === cap ? 'sel' : ''}"><span>${ic}</span>${n}</button>`).join('')}</div>
      <div class="lookGrid">${items.map(it => { const bl = s ? P2.bloqueoLook(s, it, cap) : null, puesto = L[cap] === it.id;
        return `<button class="lk ${puesto ? 'sel' : ''}" data-act="look" data-c="${cap}" data-v="${it.id}" ${bl ? 'disabled' : ''} aria-pressed="${puesto}">${P2.avatarSVG(sv, Object.assign({}, L, { [cap]: it.id }), vista)}<b>${esc(it.n)}</b>${bl ? `<span>🔒 ${esc(bl)}</span>` : ''}</button>`; }).join('')}</div>`;
  }
  function htmlPersonaje(s) {
    return `<div class="card perfilTop">${escena(s, true)}<h2>🧍 ${esc(s.nombre)}</h2></div><div class="card">${htmlEditor(s, s.look)}</div><div class="card">${htmlTresVariables(s)}</div>${htmlCosas(s)}`;
  }
  function htmlHistoria(s) {
    const H = P2.miHistoria(s), cel = (ic, v, n) => `<div><span>${ic}</span><b>${v}</b><small>${n}</small></div>`;
    return `<div class="card historia"><h2>🏆 Mi historia</h2><div class="trofeos">
        ${cel('🏆', H.trofeos.length, 'títulos')}${cel('⬆️', H.ascensos, 'ascensos')}${cel('📅', H.temporadas, 'temporadas')}${cel('⚽', H.goles, 'goles')}
        ${cel('🤝', H.marcas.length, 'patrocinadores')}${cel('💼', H.empresas, 'empresas')}${cel('🏦', esc(eur(H.patrimonioMax)), 'mayor patrimonio')}${cel('🏅', H.hitos.length, 'hitos')}</div></div>
      <div class="card">${kv('👕 Clubes', H.clubes.length ? esc(H.clubes.join(', ')) : '—')}${kv('🤝 Marcas', H.marcas.length ? H.marcas.map(M => `${M.ic} ${esc(M.n)}`).join(', ') : '—')}
        ${kv('🚗 Vehículos', H.vehiculos.length ? H.vehiculos.map(P => P.ic).join(' ') : '—')}${kv('🏠 Viviendas', H.viviendas.map(P => P.ic).join(' → '))}
        ${kv('🏆 Títulos', H.trofeos.length ? H.trofeos.map(x => `${x.ic} ${esc(x.n)}`).join(', ') : '—')}
        ${vitrina().length ? kv('💎 Vitrina', vitrina().map(([, ic, n]) => `${ic} ${esc(n)}`).join(', ')) : ''}
        ${kv('🏆 Colecciones', H.colecciones.length ? H.colecciones.map(C => `${C.ic} ${esc(C.n)}`).join(', ') : '—')}</div>
      <div class="card"><h3>Hitos</h3>${H.hitos.length ? H.hitos.map(x => `<div class="lin bien"><span class="ic">✅</span><span>${esc(x.n)} · semana ${s.hitos[x.id]}</span></div>`).join('') : '<p class="small">Tu historia acaba de empezar.</p>'}</div>`;
  }


  // =====================================================================
  //  BUCLE PRINCIPAL (P2.5): pasar pantallas. Semana → Resultado → (Situación / Celebración) → Semana
  //  Un botón grande por pantalla. Lo demás está en «Mi mundo», solo si quieres.
  // =====================================================================
  const COLORES_OP = ['azul', 'naranja', 'rosa', 'turquesa', 'violeta'];
  // Lo que da cada acción, a la vista (vista previa sobre una copia: no toca la partida ni su azar)
  const EXTRA_OP = { jornada: '📋 Prueba si tu nivel llega (≈50)', torneo: '🏆 Si ganas: invitación', campus: '📋 Te proponen para las pruebas', preparador: '📋 +3 en la prueba',
    gestionar: '💼 Tu empresa rinde más', prensa: '📣 Más marca personal', entrenoExtra: '👔 Le gusta al míster' };
  function previaAccion(s, id) {
    const una = rng => {
      const c = JSON.parse(JSON.stringify(Object.assign({}, s, { tele: null, diario: [] }))); if (rng != null) c.rng = rng;
      const a = { dinero: c.p.dinero, energia: c.p.energia, nivel: c.p.nivel, rep: c.p.rep, marca: c.p.marca || 0 };
      try { P2.aplicarAccionSemana(c, id, { lineas: [], porque: [], ingresos: [], hitos: [], desbloqueos: [] }); } catch (_) { return null; }
      return { dinero: c.p.dinero - a.dinero, energia: c.p.energia - a.energia, nivel: c.p.nivel - a.nivel, rep: c.p.rep - a.rep, marca: (c.p.marca || 0) - a.marca };
    };
    const x = una(null), y = una((s.rng ^ 0x5bd1e995) >>> 0);
    if (!x) return { d: {}, aprox: false };
    return { d: x, aprox: !!y && ['nivel', 'rep', 'marca', 'dinero'].some(k => Math.abs(x[k] - y[k]) > 0.05) };
  }
  const ETQ = { nivel: '💪', rep: '⭐', marca: '📣', dinero: '💶', energia: '⚡', confianza: '👔' };
  function chipsAccion(s, id) {
    const { d, aprox } = previaAccion(s, id), l = [];
    for (const k of ['nivel', 'rep', 'marca', 'dinero', 'energia']) {
      const v = d[k]; if (!v || Math.abs(v) < 0.05) continue;
      l.push(`<span class="chip">${ETQ[k]} ${aprox && k !== 'energia' ? '≈' : ''}${v > 0 ? '+' : '−'}${k === 'dinero' ? eur(Math.abs(v)) : nf(Math.round(Math.abs(v) * 10) / 10)}</span>`);
    }
    if (EXTRA_OP[id]) l.push(`<span class="chip">${esc(EXTRA_OP[id])}</span>`);
    return l.join('');
  }
  // Orden de las opciones: lo especial de la semana primero, después lo básico de tu fase
  const PRIORIDAD = ['jornada', 'torneo', 'campus', 'preparador', 'entrenar', 'entrenoExtra', 'plaza', 'prensa', 'gestionar', 'trabajar', 'mediaJornada', 'descansar'];
  function opcionesSemana(s) {
    const l = P2.accionesDisponibles(s).sort((a, b) => PRIORIDAD.indexOf(a.id) - PRIORIDAD.indexOf(b.id));
    const libres = l.filter(x => !x.bloqueo), bloq = l.filter(x => x.bloqueo);
    let top = libres.slice(0, 3);
    if (s.p.energia < 45 && !top.some(x => x.id === 'descansar')) { const d = libres.find(x => x.id === 'descansar'); if (d) top = top.slice(0, 2).concat(d); }
    return { top, resto: libres.filter(x => !top.includes(x)), bloq };
  }
  function tarjetaOp(s, x, i) {
    const v = P2.varianteSemana(s, x.id), dest = P2.destacadaSemana(s) === x.id;
    return `<button class="op ${COLORES_OP[i % COLORES_OP.length]} ${dest ? 'dest' : ''}" data-act="jugarYa" data-id="${x.id}">${dest ? '<span class="fuego">🔥 Esta semana rinde +20 %</span>' : ''}<span class="ic">${v ? v.ic : x.A.ic}</span><span class="tx"><b>${esc(v ? v.n : x.A.n)}</b>${v && v.d ? `<small>${esc(v.d)}</small>` : ''}<span class="chips">${chipsAccion(s, x.id)}</span></span><span class="go" aria-hidden="true">›</span></button>`;
  }
  function escenaExterior(s) {
    const e = etapa(s), V = vehiculo(s);
    const edif = { barrio: [[14, 70], [66, 96], [null, 60, 72]], club: [], empresa: [[10, 110], [58, 140], [null, 120, 60], [null, 90, 14]], magnate: [[10, 120], [58, 150], [null, 130, 60], [null, 100, 14]] }[e] || [];
    return `<div class="exterior e-${e}"><span class="sol"></span>${e === 'club' ? '<span class="grada"></span><span class="foco f1"></span><span class="foco f2"></span>' : ''}
      ${edif.map(([l, h, r]) => `<span class="edif" style="${l != null ? `left:${l}px` : `right:${r}px`};height:${h}px"></span>`).join('')}
      <div class="pj">${P2.avatarSVG(s, null, 'cuerpo')}</div>${V ? `<div class="veh">${vehiculoSVG(V.P.id, V.skin)}</div>` : ''}</div>`;
  }
  function objetivo(s) {
    const H = P2.siguienteHito(s), K = CFG.captacion, hechos = HITOS.filter(h => s.hitos[h.id]).length;
    let p, izq, der;
    if (s.fase === 'barrio') { p = 100 * s.p.rep / K.repOjeador; izq = `⭐ Reputación ${Math.floor(s.p.rep)} de ${K.repOjeador}`; const q = P2.semanasCaptacion(s); der = `${q} ${q === 1 ? 'semana' : 'semanas'}`; }
    else if (s.fase === 'pruebas') { const k = s.invitacion.dia - s.semana + 1; p = 100 * (1 - Math.max(0, k) / 3); izq = `📋 Pruebas ${k <= 1 ? 'al final de esta semana' : `en ${k} semanas`}`; der = `💪 Nivel ${nf(s.p.nivel)}`; }
    else { p = 100 * hechos / HITOS.length; izq = `🏅 ${hechos} de ${HITOS.length} hitos`; const T = s.temporada; der = T && T.jornada ? `${P2.posicion(T)}º en la liga` : ''; }
    return `<div class="obj"><b>🎯 ${H ? esc(H.n) : '¡Capítulo completado!'}</b><div class="prog"><i style="width:${Math.max(3, Math.min(100, Math.round(p)))}%"></i></div><div class="fila"><span>${izq}</span><span>${der}</span></div></div>`;
  }
  // Lo que te juegas esta semana: promoción, final o el partido de liga
  function htmlEnJuego(s, pj) {
    const X = P2.enJuego(s, 'promocion') || P2.enJuego(s, 'final');
    if (X) return `<div class="partidoProx grandeJuego">${X.ic} Esta semana: <b>${esc(X.n)}</b><br><small>✓ ${esc(X.gana)} · ✗ ${esc(X.pierde)}</small></div>`;
    return pj ? `<div class="partidoProx">⚽ Esta semana: ${pj.local ? 'en casa contra' : 'visitas a'} <b>${esc(P2.nombreEquipo(s.temporada, pj.rival))}</b></div>` : '';
  }
  function htmlSemana(s) {
    const o = opcionesSemana(s), enEquipo = s.fase === 'club' || s.fase === 'amateur', pj = enEquipo && s.temporada ? P2.partidoDeLaJornada(s.temporada) : null;
    const mas = ui.masOps ? `<div class="ops">${o.resto.map((x, i) => tarjetaOp(s, x, i + 3)).join('')}${o.bloq.map(x => `<button class="op gris" disabled><span class="ic">${x.A.ic}</span><span class="tx"><b>${esc(x.A.n)}</b><span class="chips"><span class="chip">🔒 ${esc(x.bloqueo)}</span></span></span></button>`).join('')}</div>` : '';
    return `<div class="pant">${escenaExterior(s)}${objetivo(s)}${htmlDeseo(s)}
      ${enEquipo ? htmlEnJuego(s, pj) : ''}
      <h1>${enEquipo ? '¿Qué haces además del partido?' : '¿Qué haces esta semana?'}</h1>
      <div class="ops">${o.top.map((x, i) => tarjetaOp(s, x, i)).join('')}</div>
      ${o.resto.length || o.bloq.length ? `<button class="masOps" data-act="masOps">${ui.masOps ? 'Menos opciones' : `Más opciones (${o.resto.length + o.bloq.length})`}</button>` : ''}${mas}
      ${htmlExtrasInicio(s)}</div>`;
  }
  const hayNovedad = s => (s.seccionesNuevas || []).length > 0 || Object.values(avisos(s)).some(Boolean);

  // ---- Resultado de la semana: pantalla completa con los números que cambian ----
  const TIT_ACC = { entrenar: '¡Has entrenado duro!', plaza: '¡Partidazo en la plaza!', trabajar: '¡Semana de repartos!', descansar: '¡Como nuevo!', jornada: 'Jornada abierta', torneo: 'Torneo local', campus: 'Campus de tecnificación', preparador: 'Sesión con el preparador',
    entrenoExtra: 'Entreno extra', mediaJornada: 'Media jornada', prensa: 'Prensa y redes', gestionar: 'Semana en la empresa', __acto: 'Acto de patrocinio', __evento: 'Semana especial' };
  function filaCambio(ic, n, a, b, din) {
    const d = Math.round((b - a) * 10) / 10; if (Math.abs(d) < 0.05) return '';
    const f = v => (din ? eur(v) : nf(Math.round(v * 10) / 10));
    return `<div class="cam"><span>${ic} ${n}</span><span class="v ${d >= 0 ? 'mas1' : 'menos1'}"><span data-cuenta="${a}|${b}|${din ? 1 : 0}">${f(b)}</span> <small>(${d >= 0 ? '+' : '−'}${din ? eur(Math.abs(d)) : nf(Math.abs(d))})</small></span></div>`;
  }
  function htmlResultado(s) {
    const { R, id, a, b } = ui.res, P = R.partido, A = P2.ACCIONES[id] || {};
    const ic = P ? (P.resultado === 'victoria' ? '🎉' : P.resultado === 'derrota' ? '😣' : '🤝') : (R.variante && R.variante.ic) || A.ic || '📅';
    const V = R.variante, nom = V && V.i ? V.n : TIT_ACC[id];
    const G = (R.grandes || [])[0];
    const tit = G ? G.titulo : P ? (P.resultado === 'victoria' ? '¡Victoria!' : P.resultado === 'derrota' ? 'Derrota' : 'Empate') : V && V.i ? `¡${V.n}!` : TIT_ACC[id] || 'Semana jugada';
    const filas = filaCambio('💶', 'Dinero', a.dinero, b.dinero, true) + filaCambio('⚡', 'Energía', a.energia, b.energia) + filaCambio('💪', 'Nivel', a.nivel, b.nivel) + filaCambio('⭐', 'Reputación', a.rep, b.rep)
      + (s.contrato ? filaCambio('📣', 'Marca', a.marca, b.marca) + filaCambio('👔', 'Confianza del míster', a.confianza, b.confianza) : '');
    const lineas = R.lineas.filter(l => !P || !/^Jornada \d+:/.test(l[1])).slice(0, 3);
    const sig = ui.fiestas && ui.fiestas.length ? 'Continuar ▶' : s.pendiente ? 'Continuar ▶' : 'Siguiente semana ▶';
    return `<div class="pant res"><div class="grande">${G ? G.ic : ic}</div><h2>${esc(tit)}</h2>${(R.grandes || []).map(x => `<div class="enjuego ${x.bien ? 'bien' : 'mal'}"><b>${x.ic} ${esc(x.titulo)}</b><span>${esc(x.texto)}</span></div>`).join('')}<p>Semana ${R.semana} ${P ? `· ${esc(nom || '')}` : 'completada'}${R.destacada ? ' · 🔥 destacada' : ''}</p>
      ${P && P.formato === 'circuito' ? `<div class="marcador ${P.resultado}"><small>Jornada ${P.jornada}${P.cond ? ` · ${esc(P2.NOMBRE_COND[P.cond] || '')}` : ''}</small><b>${P.puesto && P.rol !== 'lesionado' && P.rol !== 'noConvocado' && P.rol !== 'banquillo' ? `<span>${P.puesto}º</span> de ${P.gc}` : 'No compites'}</b>${P.detalle ? `<small>${esc(P.detalle)}</small>` : ''}`
        : P ? `<div class="marcador ${P.resultado}"><small>Jornada ${P.jornada} · ${P.local ? 'en casa' : 'fuera'}${P.cond ? ` · ${esc(P2.NOMBRE_COND[P.cond] || '')}` : ''}</small><b>${P.local ? 'Tu equipo' : esc(P.rival)} <span>${P.local ? P.gf : P.gc} - ${P.local ? P.gc : P.gf}</span> ${P.local ? esc(P.rival) : 'Tu equipo'}</b>${P.formato === 'sets' && P.detalle ? `<small>${esc(P.detalle)}</small>` : ''}` : ''}${P ? `
        <small>${{ titular: 'Titular', suplente: 'Sales desde el banquillo', banquillo: 'No juegas', lesionado: 'Lesionado/a', noConvocado: 'No convocado/a' }[P.rol] || ''}${P.nota != null ? ` · nota ${nf(P.nota)}` : ''}${P.formato === 'puntos' && P.detalle ? ` · ${esc(P.detalle)}` : P.goles && (!P.formato || P.formato === 'goles') ? ` · ⚽ ${P.goles === 1 ? '1 gol' : P.goles + ' goles'}` : P.goles && P.formato === 'sets' ? ` · 🎾 ${P.goles} aces` : ''}</small></div>` : ''}
      <div class="cambios">${filas || '<div class="cam"><span>Sin cambios en tus números</span></div>'}</div>
      ${lineas.length ? `<div class="lineasRes">${lineas.map(linea).join('')}</div>` : ''}
      ${R.porque.length || R.ingresos.length || R.lineas.length > lineas.length ? `<details class="por"><summary>❓ ¿Por qué?</summary>${R.lineas.slice(3).map(linea).join('')}${R.porque.map(x => `<p>${esc(x)}</p>`).join('')}${R.ingresos.map(([x, v]) => kv(esc(x), `${v >= 0 ? '+' : '−'}${eur(Math.abs(v))}`)).join('')}</details>` : ''}
      <button class="cta" data-act="seguir">${sig}</button></div>`;
  }
  // ---- Después de decidir algo ----
  function htmlDecidido(s) {
    const D = ui.dec, W = D.semanaJugada ? s.ultimo : null;
    return `<div class="pant res"><div class="grande">${D.ic || '✅'}</div><h2>${esc(D.titulo || '')}</h2>${D.texto ? `<p>${esc(D.texto)}</p>` : ''}
      ${(D.lineas || []).concat(W ? W.lineas : []).slice(0, 4).length ? `<div class="lineasRes">${(D.lineas || []).concat(W ? W.lineas : []).slice(0, 4).map(linea).join('')}</div>` : ''}
      <button class="cta" data-act="seguir">${ui.fiestas && ui.fiestas.length || s.pendiente ? 'Continuar ▶' : 'Siguiente semana ▶'}</button></div>`;
  }
  // ---- Situación: una pregunta, respuestas grandes con lo que implica cada una ----
  function htmlSitu(s) {
    const v = P2.vistaPendiente(s);
    if (!v) return htmlSemana(s);
    const persona = (P2.EVENTOS_RELACION.concat(P2.EVENTOS_POSESION || []).find(E => s.pendiente.tipo === 'suceso' && E.id === s.pendiente.id) || {}).rel;
    const R = persona && P2.persona(persona);
    return `<div class="pant"><div class="sit ${v.fiesta ? 'dorada' : ''} ${v.grande ? 'mega' : ''}">${v.grande ? `<div class="megaTop">${decorSVG('empresa')}<span>🔓</span></div>` : ''}
      ${R && R.look ? `<div class="quien">${caraDe(R)}</div>` : `<div class="grande peq">${v.ic}</div>`}<h2>${esc(v.titulo)}</h2>${v.texto ? `<p>${esc(v.texto)}</p>` : ''}
      ${v.ops.map(o => `<button class="resp ${o.prin ? 'prin' : ''}" data-act="decidir" data-id="${esc(o.id)}" ${o.bloqueo ? 'disabled' : ''}><b>${esc(o.n)}</b>
        <span class="ls">${o.ventaja ? `<span class="l"><i class="v">✓</i> ${esc(o.ventaja)}</span>` : ''}${o.coste ? `<span class="l"><i class="c">−</i> ${esc(o.coste)}</span>` : ''}${o.riesgo && o.riesgo !== 'Ninguno' && o.riesgo !== '—' ? `<span class="l"><i class="r">⚠</i> ${esc(o.riesgo)}</span>` : ''}</span>
        ${o.ocupaSemana ? '<span class="ocupa">⏳ Ocupa la semana entera</span>' : ''}${o.bloqueo ? `<span class="bl">🔒 ${esc(o.bloqueo)}</span>` : ''}</button>`).join('')}</div></div>`;
  }
  // ---- Celebraciones: hitos y novedades ----
  function htmlFiesta(s) {
    const F = ui.fiestas[0];
    if (F.tipo === 'hito') return `<div class="pant fiesta"><div class="rayos"></div><div class="grande">🏅</div><small class="eti">¡HITO CONSEGUIDO!</small><h2>${esc(F.H.n)}</h2><p>Se abre: ${esc(F.H.abre)}</p>
      <div class="exterior mini">${'<span class="sol"></span>'}<div class="pj">${P2.avatarSVG(Object.assign({}, s, { ultimo: { partido: { resultado: 'victoria' } } }), null, 'cuerpo')}</div></div>
      <button class="cta oro" data-act="seguir">¡Genial! ▶</button></div>`;
    return `<div class="pant fiesta"><div class="rayos"></div><div class="grande">${F.x.ic}</div><small class="eti">🔓 NUEVO</small><h2>${esc(F.x.n)}</h2><p>${esc(F.x.d || '')} Lo tienes en 🌍 Mi mundo.</p>
      <button class="cta oro" data-act="verNuevo" data-v="${F.x.id}">Ver ahora</button><button class="masOps" data-act="seguir">Más tarde</button></div>`;
  }

  // ---- Grandes momentos animados: ascenso, contrato, negocio, título, patrocinio, convocatoria ----
  const TRAZO_FIRMA = 'M8 44 C 22 6, 40 70, 58 34 S 84 8, 98 40 S 128 66, 146 30 S 176 12, 190 42 S 222 58, 250 26';
  const dinero = (v, signo = '+') => `<div class="bigMoney">${signo}<span data-cuenta="0|${Math.round(v)}|1">${eur(Math.round(v))}</span></div>`;
  function htmlCele(s, c) {
    const cerrar = `<button class="cta oro" data-act="celeOk">${{ titulo: '¡A celebrarlo! ▶', ascenso: '¡A por la nueva categoría! ▶', coche: '¡Arrancar! ▶', casa: '¡Entrar! ▶', gol: '¡A celebrarlo! ▶', patrimonio: '¡A por más! ▶' }[c.tipo] || '¡Vamos! ▶'}</button>`;
    let h = '';
    if (c.tipo === 'contrato') {
      const semT = (s.temporada && s.temporada.calendario ? s.temporada.calendario.length : 14), total = c.sueldo * semT * (c.temporadas || 1);
      h = `<small class="eti">${c.renov ? '✍️ RENOVACIÓN FIRMADA' : c.amateur ? '✍️ FICHA FIRMADA' : '✍️ CONTRATO PROFESIONAL'}</small>
        <div class="contrato" style="--c1:${esc(c.c1 || '#7c5cff')};--c2:${esc(c.c2 || '#fff')}">
          <div class="cHead"><span class="escudo">${c.ic || '⚽'}</span><span><b>${esc(c.club)}</b><small>${esc(c.liga || '')}</small></span></div>
          <div class="cFila" style="--i:0"><span>💶 ${c.amateur ? 'Dietas' : 'Sueldo'}</span><b>${eur(c.sueldo)}/semana</b></div>
          <div class="cFila" style="--i:1"><span>📅 Duración</span><b>${c.temporadas} ${c.temporadas === 1 ? 'temporada' : 'temporadas'}</b></div>
          ${c.primaVictoria ? `<div class="cFila" style="--i:2"><span>🏆 Prima por victoria</span><b>${eur(c.primaVictoria)}</b></div>` : ''}
          <div class="cFila total" style="--i:3"><span>💰 Total del contrato</span><b>${eur(total)}</b></div>
          <div class="cFirma"><svg viewBox="0 0 260 70" aria-hidden="true"><path class="trazo" d="${TRAZO_FIRMA}"/></svg><span>${esc(s.nombre || '')}</span></div>
          <div class="sello">FIRMADO</div>
        </div>
        ${c.prima ? `${dinero(c.prima)}<p class="small">Prima de ${c.renov ? 'renovación' : 'fichaje'} (neto), ya en tu cuenta</p>` : ''}`;
    } else if (c.tipo === 'ascenso') {
      const L = Object.entries(P2.LIGAS).sort((a, b) => b[1].nivel - a[1].nivel), ia = L.findIndex(([k]) => k === c.a), id = L.findIndex(([k]) => k === c.de);
      h = `<small class="eti">⬆️ ¡SUBIMOS DE CATEGORÍA!</small><h2>¡ASCENSO!</h2>
        <div class="escalera">${L.map(([k, X], i) => `<div class="pelda ${k === c.a ? 'meta' : k === c.de ? 'origen' : ''}"><span>${esc(X.corto || X.n)}</span>${k === c.a ? `<b class="ficha" style="--d:${(id - ia) * 50}px">${c.ic || '⚽'} ${esc(c.club)}</b>` : ''}</div>`).join('')}</div>
        <p>La temporada que viene: <b>${esc(P2.LIGAS[c.a].n)}</b>. Más público, más sueldo, más ojos mirando.</p>
        ${c.prima ? `${dinero(c.prima)}<p class="small">Prima de ascenso</p>` : ''}`;
    } else if (c.tipo === 'negocio') {
      h = `<small class="eti">💼 ${esc((c.texto || '').toUpperCase())}</small>
        <div class="local"><div class="toldo"></div><div class="rotulo">${c.ic} ${esc(c.n)}</div><div class="escaparate"><span class="abierto">ABIERTO</span><span class="persiana"></span></div></div>
        <h2>¡${esc(c.n)} es tuya!</h2>
        ${c.invertido ? `${dinero(c.invertido, '')}<p class="small">Lo que has invertido. Ahora, a que dé dinero.</p>` : ''}`;
    } else if (c.tipo === 'titulo') {
      h = `<small class="eti">🏆 ¡CAMPEONES!</small><div class="copaGrande">${c.ic || '🏆'}</div><h2>${esc(c.n)}</h2>
        <div class="monedas" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 7) * 0.18}s">🪙</i>`).join('')}</div>
        ${c.dinero ? `${dinero(c.dinero)}<p class="small">Premio por el título</p>` : ''}
        <div class="chipsCele">${c.rep ? `<span>⭐ +${c.rep} reputación</span>` : ''}${c.marca ? `<span>📣 +${c.marca} marca</span>` : ''}<span>🏆 A tu vitrina</span></div>
        ${c.comp && P2.premiumOk(`champ_${c.comp}`) ? `<div class="celeCampeon"><div class="iapPrev">${P2.avatarSVG(s, Object.assign({}, s.look, { pose: 'campeon', extra: `trofeo_${c.comp}`, ropa: `camp_${c.comp}` }), 'cuerpo')}</div><small>💎 Celebración de campeón</small></div>` : ''}`;
    } else if (c.tipo === 'patrocinio') {
      h = `<small class="eti">🤝 ${c.renov ? 'PATROCINIO RENOVADO' : 'NUEVO PATROCINADOR'}</small>
        <div class="cheque"><div class="chTop"><span>${c.ic}</span><b>${esc(c.n)}</b></div><div class="chFila">Páguese a: <b>${esc(s.nombre || '')}</b></div>
          <div class="chImporte">${eur(c.prima)}</div><div class="cFirma mini"><svg viewBox="0 0 260 70" aria-hidden="true"><path class="trazo" d="${TRAZO_FIRMA}"/></svg></div></div>
        ${dinero(c.prima)}<p class="small">Prima (neto) y después ${eur(c.semanal)}/semana durante ${c.semanas} semanas</p>`;
    } else if (c.tipo === 'patrimonio') {
      h = `<small class="eti">🏦 ¡NUEVO RÉCORD!</small><h2>Tu patrimonio supera los ${eur(c.cifra)}</h2>
        <div class="torres" aria-hidden="true">${[30, 48, 66, 84, 100].map((v, i) => `<span style="--h:${v}%;--i:${i}"><i>💶</i></span>`).join('')}</div>
        ${dinero(c.total, '')}<p class="small">Todo lo que tienes: dinero, empresas, inversiones y cosas.</p>`;
    } else if (c.tipo === 'coche') {
      h = `<small class="eti">🔑 ${c.moto ? '¡TU PRIMERA MOTO!' : '¡TU PRIMER COCHE!'}</small>
        <div class="carretera"><div class="cocheEntra">${vehiculoSVG(c.id, null)}</div><span class="llaves">🔑</span></div>
        <h2>${esc(c.n)}</h2><p>Se acabó el autobús. ${c.moto ? 'Ahora llegas a todo antes.' : 'Ahora el barrio te ve llegar.'}</p>`;
    } else if (c.tipo === 'casa') {
      h = `<small class="eti">🏠 ¡TU PRIMERA CASA!</small>
        <div class="casita"><div class="tejado"></div><div class="fachada"><span class="ventana v1"></span><span class="ventana v2"></span><span class="puerta"><i></i></span></div></div>
        <h2>${esc(c.n)}</h2><p>Tus llaves, tu puerta, tus normas.</p>`;
    } else if (c.tipo === 'venta') {
      h = `<small class="eti">🤝 ¡VENDIDA CON BENEFICIO!</small>
        <div class="local vendida"><div class="toldo"></div><div class="rotulo">${c.ic} ${esc(c.n)}</div><div class="escaparate"><span class="abierto">GRACIAS</span></div><div class="sello">VENDIDA</div></div>
        ${dinero(c.precio)}<div class="chipsCele"><span>📈 Beneficio: +${eur(c.beneficio)}</span></div>`;
    } else if (c.tipo === 'titular') {
      h = `<small class="eti">🏟️ ¡ERES TITULAR!</small>
        <div class="focos" aria-hidden="true"><i></i><i></i></div>
        <div class="camiseta" style="--c1:${esc(c.c1 || '#7c5cff')};--c2:${esc(c.c2 || '#fff')}"><b>${c.dorsal}</b><span>${esc((s.nombre || '').toUpperCase().slice(0, 12))}</span></div>
        <h2>Tu primer partido de titular</h2><p>Con ${esc(c.club)}. El míster confía en ti: ahora, a no soltar el puesto.</p>`;
    } else if (c.tipo === 'gol') {
      const D = P2.deporteDe(s), G = { futbol: ['¡TU PRIMER GOL!', '¡GOOOOL!', 'Tu primer gol como profesional'], basket: ['¡TUS PRIMEROS PUNTOS!', '¡CANASTA!', 'Tus primeros puntos como profesional'],
        tenis: ['¡TU PRIMER ACE!', '¡ACE!', 'Tu primer ace como profesional'] }[D.id] || ['¡TU PRIMER PODIO!', '¡PODIO!', 'Tu primer podio en el circuito'];
      h = `<small class="eti">${D.ic} ${G[0]}</small>
        <div class="porteria golAnim"><span class="balonGol">${D.ic}</span></div>
        <h2>${G[1]}</h2><p>${G[2]}${c.rival && D.formato !== 'circuito' ? `, contra ${esc(c.rival)}` : ''}. Este no se olvida.</p>`;
    } else if (c.tipo === 'grado') {
      h = `<small class="eti">🪨 ¡ENCADENADO!</small><div class="copaGrande">🧗</div><h2>Tu primer ${esc(c.grado)}</h2><p>${c.grado === '9a' ? 'Un 9a. Muy poca gente en el mundo ha llegado aquí.' : 'Un 8a en roca: ya escalas como los mejores de tu país.'}</p>`;
    } else if (c.tipo === 'mvp') {
      h = `<small class="eti">⭐ JUGADOR DEL PARTIDO</small><div class="copaGrande mvp">🏅</div><h2>MVP · nota ${nf(c.nota)}</h2>
        <p>Partidazo${c.rival ? ` contra ${esc(c.rival)}` : ''}. Todo el mundo habla de ti.</p>
        <div class="estrellas" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<i style="--i:${i}">⭐</i>`).join('')}</div>`;
    } else if (c.tipo === 'salvados') {
      h = `<small class="eti">🛟 ¡SALVADOS!</small><div class="copaGrande flota">🛟</div><h2>${esc(c.club)} sigue en ${esc(c.liga)}</h2><p>Sufrimiento hasta el final, pero la categoría se queda en casa.</p>`;
    } else if (c.tipo === 'premium') {
      h = `<small class="eti">💎 ¡DESBLOQUEADO!</small>${P2.PACKS[c.sku] ? `<div class="iapPrev grande celePack">${P2.avatarSVG(s, null, 'cuerpo')}</div>` : `<div class="copaGrande">${c.ic}</div>`}<h2>${esc(c.n)}</h2>
        <div class="chipsCele">${(c.includes || []).slice(0, 6).map(x => `<span>${esc(x)}</span>`).join('')}</div><p class="small">Ya está en tu cuenta. Si cambias de móvil o empiezas otra carrera, lo recuperas con «Restaurar compras».</p>`;
    } else if (c.tipo === 'convocatoria') {
      h = `<small class="eti">🌍 ¡CONVOCATORIA!</small><div class="copaGrande">🌍</div><h2>¡Te llama la selección!</h2><p>La temporada que viene juegas el Mundial. Si llegáis a la final, la juegas tú.</p>`;
    }
    return `<div class="pant cele cele-${esc(c.tipo)}"><div class="rayos"></div>${h}${cerrar}</div>`;
  }
  // ---- Minijuegos: barra de tiempo (y esquina en el penalti); vidas para repetir ----
  const ESQ = [['izq', '⬅️', 'Izquierda'], ['centro', '⬆️', 'Centro'], ['dcha', '➡️', 'Derecha']];
  const corazones = s => { const v = P2.vidas(s); return `<span class="vidas" aria-label="${v.n} vidas">${'❤️'.repeat(v.n)}${'🤍'.repeat(Math.max(0, P2.VIDAS.max - v.n))}</span>`; };
  const juegoDe = J => P2.JUEGOS[J.juego] || P2.JUEGOS.barra;
  const COMPIS = ['Dani', 'Marc', 'Leo'];
  const FLECHAS = [['izquierda', '⬅️'], ['arriba', '⬆️'], ['derecha', '➡️'], ['abajo', '⬇️']];
  const puntosMj = J => `<div class="mjPuntos">${J.res.map(x => `<span>${x >= 0.7 ? '⭐' : x >= 0.4 ? '👍' : '✖️'}</span>`).join('')}</div>`;
  let mjTimer = null;
  const mjVivo = J => ui.mj === J && ui.vista === 'semana';
  // Empieza (o vuelve a empezar) el juego que toca en este momento
  function empezarJuego(J) {
    clearTimeout(mjTimer); J.res = []; J.msg = ''; J.libre = null; J.balon = null;
    J.fase = { penalti: 'esquina', barra: 'barra', toques: 'toques', pase: 'pase', memoria: 'mver', portero: 'portero' }[J.juego] || 'barra';
    if (J.fase === 'pase') programarPase(J);
    if (J.fase === 'portero') programarTiro(J);
    if (J.fase === 'mver') { const n = J.tipo === 'torneo' ? 4 : 5; J.sec = Array.from({ length: n }, () => Math.floor(Math.random() * 4)); J.entrada = []; J.idx = -1; programarMemoria(J); }
  }
  function siguienteRonda(J, prog) { if (J.res.length >= juegoDe(J).rondas) { terminarMinijuego(); render(); } else { prog(J); render(); } }
  function programarPase(J) {
    J.libre = null;
    mjTimer = setTimeout(() => { if (ui.mj !== J) return; J.libre = Math.floor(Math.random() * 3); J.t0 = performance.now(); J.msg = ''; render();
      const ventana = [1000, 850, 700][J.res.length] || 700;
      mjTimer = setTimeout(() => { if (ui.mj !== J || J.libre == null) return; J.res.push(0); J.msg = '¡Lo han cubierto!'; siguienteRonda(J, programarPase); }, ventana);
    }, 700 + Math.random() * 1100);
  }
  function programarTiro(J) {
    J.balon = null;
    mjTimer = setTimeout(() => { if (ui.mj !== J) return; J.balon = ['izq', 'centro', 'dcha'][Math.floor(Math.random() * 3)]; J.t0 = performance.now(); J.msg = ''; render();
      const ventana = [700, 560, 440][J.res.length] || 440;
      mjTimer = setTimeout(() => { if (ui.mj !== J || J.balon == null) return; J.res.push(0); J.balon = null; J.msg = '¡Gol! No llegas.'; siguienteRonda(J, programarTiro); }, ventana);
    }, 800 + Math.random() * 1400);
  }
  function programarMemoria(J) {
    mjTimer = setTimeout(() => { if (ui.mj !== J) return; J.idx++; if (J.idx >= J.sec.length) { J.fase = 'mrep'; render(); return; } render(); programarMemoria(J); }, J.idx < 0 ? 600 : 750);
  }
  function htmlMinijuego(s) {
    const J = ui.mj, M = P2.MINIJUEGOS[J.tipo], X = J.enJuego, Gj = juegoDe(J);
    const chip = `<div class="mjJuego"><span>${Gj.ic} ${esc(Gj.n)}</span><em class="dif d-${Gj.dif === 'Fácil' ? 'facil' : Gj.dif === 'Difícil' ? 'dificil' : 'media'}">${Gj.dif}</em></div>`;
    if (J.fase === 'intro') return `<div class="pant res mj"><div class="grande">${X ? X.ic : M.ic}</div><small class="eti">${X ? 'TE LO JUEGAS TODO' : 'MOMENTO DECISIVO'}</small><h2>${esc(X ? X.n : M.n)}</h2><p>${esc(X ? X.d : M.d)}</p>
      ${X ? `<div class="enjuego bien"><b>✓ Si ganas</b><span>${esc(X.gana)}</span></div><div class="enjuego mal"><b>✗ Si pierdes</b><span>${esc(X.pierde)}</span></div>` : ''}${chip}<p class="small">${esc(Gj.d)}</p>${corazones(s)}
      <button class="cta oro" data-act="mjEmpezar">¡Jugar! ▶</button><button class="masOps" data-act="mjSimular">Simular: lo decide tu nivel (${Math.round(P2.probSimular(s) * 100)} % de acierto)</button></div>`;
    if (J.fase === 'esquina') return `<div class="pant res mj"><div class="porteria"><span class="portero">🧤</span></div><h2>¿A qué lado chutas?</h2>
      <div class="esquinas">${ESQ.map(([k, ic, n]) => `<button class="op ${k === 'centro' ? 'naranja' : 'azul'}" data-act="mjEsquina" data-v="${k}"><span class="ic">${ic}</span><span class="tx"><b>${n}</b></span></button>`).join('')}</div></div>`;
    if (J.fase === 'barra') {
      const z = Math.max(10, 22 - J.res.length * 5);
      return `<div class="pant res mj"><small class="eti">${J.tipo === 'penalti' ? 'POTENCIA Y PRECISIÓN' : `TIRO ${J.res.length + 1} DE ${Gj.rondas}`}</small><h2>¡Para en el verde!</h2>
        <div class="mjBarra"><span class="zona" style="left:${50 - z / 2}%;width:${z}%"></span><span class="marca" id="mjMarca"></span></div>
        <div class="mjPuntos">${J.res.map(x => `<span class="${x >= 0.7 ? 'bien' : x >= 0.4 ? 'medio' : 'mal'}">${x >= 0.7 ? '⭐' : x >= 0.4 ? '👍' : '✖️'}</span>`).join('')}</div>
        <button class="cta" data-act="mjParar" id="mjParar">¡AHORA!</button></div>`;
    }
    const msg = J.msg ? `<p class="mjMsg">${esc(J.msg)}</p>` : '<p class="mjMsg">&nbsp;</p>';
    // Toques (fácil): toca cuando el balón baja a tu pie
    if (J.fase === 'toques') return `<div class="pant res mj"><small class="eti">TOQUE ${J.res.length + 1} DE ${Gj.rondas}</small><h2>¡Toca cuando baje!</h2>
      <div class="mjToques"><span class="zonaPie"></span><span class="balon" id="mjBalon">⚽</span><span class="pie">👟</span></div>${puntosMj(J)}${msg}
      <button class="cta" data-act="mjToque" id="mjToque">¡TOQUE!</button></div>`;
    // Pase al desmarcado (fácil): un compañero se queda solo un instante
    if (J.fase === 'pase') return `<div class="pant res mj"><small class="eti">PASE ${Math.min(J.res.length + 1, Gj.rondas)} DE ${Gj.rondas}</small><h2>${J.libre != null ? '¡Ahora! ¡Está solo!' : 'Espera al desmarque…'}</h2>
      <div class="mjCampo">${COMPIS.map((n, i) => `<button class="comp ${J.libre === i ? 'libre' : ''}" data-act="mjPase" data-v="${i}"><span class="mono">${J.libre === i ? '🙋' : '🧍'}</span><small>${n}</small>${J.libre === i ? '' : '<i class="rival">🛡️</i>'}</button>`).join('')}</div>${puntosMj(J)}${msg}</div>`;
    // Jugada ensayada (media): memoriza y repite
    if (J.fase === 'mver') return `<div class="pant res mj"><small class="eti">MIRA LA JUGADA</small><h2>Memoriza el orden</h2>
      <div class="mjPizarra"><span class="flechaGrande">${J.idx >= 0 && J.idx < J.sec.length ? FLECHAS[J.sec[J.idx]][1] : '📋'}</span></div>
      <div class="mjSec">${J.sec.map((_, i) => `<span class="${i === J.idx ? 'on' : i < J.idx ? 'ya' : ''}"></span>`).join('')}</div><p class="mjMsg">Paso ${Math.max(1, Math.min(J.sec.length, J.idx + 1))} de ${J.sec.length}</p></div>`;
    if (J.fase === 'mrep') return `<div class="pant res mj"><small class="eti">TU TURNO</small><h2>Repite la jugada</h2>
      <div class="mjSec">${J.sec.map((_, i) => `<span class="${i < J.entrada.length ? 'ya' : ''}">${i < J.entrada.length ? FLECHAS[J.entrada[i]][1] : ''}</span>`).join('')}</div>
      <div class="mjFlechas">${FLECHAS.map(([k, ic], i) => `<button class="op azul" data-act="mjFlecha" data-v="${i}" aria-label="${k}"><span class="ic">${ic}</span></button>`).join('')}</div></div>`;
    // Parada imposible (difícil): reflejos
    if (J.fase === 'portero') return `<div class="pant res mj"><small class="eti">TIRO ${Math.min(J.res.length + 1, Gj.rondas)} DE ${Gj.rondas}</small><h2>${J.balon != null ? '¡¡YA!!' : 'Atento…'}</h2>
      <div class="porteria tiros">${['izq', 'centro', 'dcha'].map(k => `<span class="hueco">${J.balon === k ? '⚽' : ''}</span>`).join('')}</div>
      <div class="esquinas">${ESQ.map(([k, ic, n]) => `<button class="op ${k === 'centro' ? 'naranja' : 'azul'}" data-act="mjParada" data-v="${k}"><span class="ic">${k === 'centro' ? '🧤' : ic}</span><span class="tx"><b>${n}</b></span></button>`).join('')}</div>${puntosMj(J)}${msg}</div>`;
    // fin
    const p = J.p, bien = p >= 0.6, tit = X ? (bien ? '¡LO HABÉIS CONSEGUIDO!' : '¡Se escapa!') : J.tipo === 'penalti' ? (bien ? '¡GOOOOL!' : J.parada ? '¡Parada del portero!' : '¡Fuera!') : p >= 0.75 ? '¡Espectacular!' : bien ? '¡Bien hecho!' : 'No ha salido…';
    const bp = P2.bonusPrueba({ mjSemana: { tipo: 'prueba', p, semana: 0 }, semana: 0 }), bt = P2.bonusTorneo({ mjSemana: { tipo: 'torneo', p, semana: 0 }, semana: 0 });
    const ef = X ? (bien ? X.gana : X.pierde) : J.tipo === 'prueba' ? `${bp >= 0 ? '+' : ''}${bp} puntos en la prueba${bp < 0 ? ': los ojeadores apuntan tus fallos' : ''}`
      : J.tipo === 'torneo' ? `${bt >= 0 ? '+' : ''}${nf(bt)} en la final del torneo`
        : (P2.deporteDe(S).penTxt || ['¡Perfecto! +2 goles para tu equipo, +12 de confianza y más fama', '+1 gol para tu equipo, +8 de confianza y más fama', 'Desastre: el rival marca dos en la contra, −18 de confianza y la prensa te cae encima', 'El rival marca en la contra: −12 de confianza y −1,5 de reputación'])[p >= 0.9 ? 0 : bien ? 1 : p <= 0.1 ? 2 : 3];
    const v = P2.vidas(S);
    return `<div class="pant res mj"><div class="grande">${bien ? '🎉' : '😬'}</div><h2>${tit}</h2><p>${esc(ef)}</p>${corazones(s)}
      <button class="cta ${bien ? 'oro' : ''}" data-act="mjFin">${bien ? '¡Genial! Seguir ▶' : 'Seguir con este resultado ▶'}</button>
      ${!bien && !J.simulado && J.reintentos < P2.VIDAS.reintentosPorMomento ? (v.n > 0 ? `<button class="cta reintentar" data-act="mjReintentar">🔁 Reintentar (−1 ❤️)</button><p class="small">Solo un reintento por momento decisivo.</p>` : `${rwBtn(s, 'vida', { contexto: 'minijuego' }, 'Ver anuncio: +1 vida')}<p class="small">O espera: recuperas una vida en ${P2.semanasParaVida(s)} ${P2.semanasParaVida(s) === 1 ? 'semana' : 'semanas'}.</p>`) : ''}
      ${J.simulado ? '<p class="small">Simulado: lo ha decidido tu nivel.</p>' : ''}</div>`;
  }
  let mjAnim = null;
  function animarMinijuego() {
    cancelAnimationFrame(mjAnim);
    if (ui.mj && ui.mj.fase === 'toques') {   // el balón sube y baja; abajo (≈100) está tu pie
      const b = document.getElementById('mjBalon'); if (!b) return;
      const vel = 0.0021 + ui.mj.res.length * 0.00025, t0 = performance.now();
      const paso = tt => { ui.mjPos = 100 * Math.abs(Math.sin((tt - t0) * vel)); b.style.top = (ui.mjPos * 0.78) + '%'; mjAnim = requestAnimationFrame(paso); };
      mjAnim = requestAnimationFrame(paso); return;
    }
    const el = document.getElementById('mjMarca'); if (!el || !ui.mj) return;
    const vel = 0.0024 + ui.mj.res.length * 0.0009 + (ui.mj.tipo === 'penalti' ? 0.0012 : 0), t0 = performance.now();
    const paso = tt => { ui.mjPos = 50 + 48 * Math.sin((tt - t0) * vel); el.style.left = ui.mjPos + '%'; mjAnim = requestAnimationFrame(paso); };
    mjAnim = requestAnimationFrame(paso);
  }
  function terminarMinijuego() {
    const J = ui.mj, M = P2.MINIJUEGOS[J.tipo];
    if (J.tipo === 'penalti') {
      const sc = J.res[0], portero = ESQ[Math.floor(Math.random() * 3)][0];
      const gol = sc >= 0.85 || (sc >= 0.4 && portero !== J.esquina);
      J.parada = !gol && sc >= 0.4; J.p = gol ? 0.6 + 0.4 * sc : 0.3 * sc;
    } else if (J.juego !== 'memoria') J.p = J.res.reduce((a, b) => a + b, 0) / juegoDe(J).rondas;
    clearTimeout(mjTimer);
    J.fase = 'fin';
  }
  function jugarConfirmado(id, opc) {
    const a0 = foto(S), v0 = P2.varianteSemana(S, id), R = P2.jugarSemana(S, id, opc); if (!R) return;
    ui.res = { R, id, a: a0, b: foto(S), v: v0 }; ui.fiestas = fiestasDe(R.hitos, R.desbloqueos); ui.paso = 'resultado'; ui.masOps = false; ui.desbloqueos = [];
    // Sin confeti cuando la noticia es mala (como en P1): si fallas el momento decisivo, no hay fiesta
    const fallo = opc && opc.minijuego && opc.minijuego.p < 0.6;
    if (R.partido && R.partido.resultado === 'victoria' && !fallo) ui.confeti = true;
    guardarYPintar(); window.scrollTo(0, 0);
  }

  function htmlJuego(s) {
    if (ui.mj) return htmlMinijuego(s);
    if (ui.paso === 'resultado' && ui.res) return htmlResultado(s);
    if (ui.paso === 'decidido' && ui.dec) return htmlDecidido(s);
    if (ui.paso === 'fiesta' && ui.fiestas && ui.fiestas.length) return htmlFiesta(s);
    ui.paso = null;
    if (s.pendiente) return htmlSitu(s);
    return htmlSemana(s);
  }
  // ---- Mi mundo: todo lo demás, con iconos grandes ----
  // Ayudas para las pantallas de expansiones y Prestige (21_ui_*.js)
  const HX = { esc, eur, kv, nf, fmt, opcion, ui, $, get S() { return S; }, render: () => render(), guardar: () => { if (S) P2.guardar(S); },
    hecho: (ok, txt, cls) => { if (ok === null || ok === undefined) { if (txt) ui.flash = txt; if (S) P2.guardar(S); render(); } else { ui.flash = ok; render(); } },
    premium: sku => { ui.pm = Object.assign(ui.pm || { tab: 'expansiones' }, { sku, paso: null, error: null, consent: false }); render(); }, irA: v => irA(v) };
  const MUNDO = [['personaje', '👤', 'Perfil', '#8b5cf6'], ['relaciones', '❤️', 'Vida', '#ff4f8b'], ['tienda', '🛍️', 'Tienda', '#d94bff'], ['inversiones', '📈', 'Inversiones', '#12bfae'],
    ['liga', '📊', 'Liga', '#2f7bff', 'Al fichar'], ['marcas', '🤝', 'Marcas', '#ff9a2e', 'Al fichar'], ['empresa', '💼', 'Empresa', '#0b8a7e', 'Más adelante'], ['patrimonio', '💰', 'Patrimonio', '#e8a000'],
    ['historia', '🏆', 'Historia', '#ffb000'], ['hitos', '🏅', 'Hitos', '#5f35c9'], ['premium', '💎', 'Premium', '#111827'], ['ajustes', '⚙️', 'Ajustes', '#8e8aa8']];
  function htmlMundo(s) {
    const vis = P2.seccionesVisibles(s).map(x => x.id), av = avisos(s), nuevas = s.seccionesNuevas || [];
    return `<div class="velo" data-act="cerrarMundo"><div class="hoja" role="dialog" aria-label="Mi mundo"><div class="asa"></div><h3>🌍 Mi mundo</h3>
      <div class="iconos">${MUNDO.concat(P2.UIX ? P2.UIX.mundo(s) : []).map(([id, ic, n, c, lock]) => { const ok = vis.includes(id);
        return `<button class="icono ${ok ? '' : 'lock'}" ${ok ? `data-act="vista" data-v="${id}"` : 'disabled'}><span style="background:${c}">${ic}</span>${n}${ok ? '' : `<small>🔒 ${lock}</small>`}${ok && nuevas.includes(id) ? '<em>Nuevo</em>' : ok && av[id] ? '<em>!</em>' : ''}</button>`; }).join('')}</div>
      <p class="nota">Aquí está todo lo demás. Entra cuando quieras: para jugar no hace falta.</p>
      <div class="mundoAcc"><button data-act="guardarSalir">💾<span>Guardar y salir</span></button><button data-act="carreras">🗂️<span>Mis carreras</span></button><button data-act="cuenta">👤<span>${conCuenta() ? 'Mi cuenta' : 'Cuenta'}</span></button></div>
      <button class="cerrar" data-act="cerrarMundo">Volver al juego</button></div></div>`;
  }
  function contar() {
    if (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('[data-cuenta]').forEach(el => {
      const [a, b, din] = el.dataset.cuenta.split('|'), A = +a, B = +b, grande = !!el.closest('.bigMoney'), t0 = performance.now() + (grande ? 1200 : 0), dur = grande ? 1500 : 700;   // el dinero grande cuenta cuando aparece
      const paso = tt => { const p = Math.max(0, Math.min(1, (tt - t0) / dur)), v = A + (B - A) * (1 - Math.pow(1 - p, 3)); el.textContent = din === '1' ? eur(v) : nf(Math.round(v * 10) / 10); if (p < 1) requestAnimationFrame(paso); };
      requestAnimationFrame(paso);
    });
  }
  function confeti() {
    if (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = ['#ff4f8b', '#2f7bff', '#ffc22e', '#12bfae', '#8b5cf6', '#ff9a2e'];
    for (let i = 0; i < 50; i++) { const c = document.createElement('i'); c.className = 'confeti'; c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length]; c.style.animationDuration = (1.6 + Math.random() * 1.8) + 's'; c.style.animationDelay = Math.random() * .4 + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 4000); }
  }
  const foto = s => ({ dinero: s.p.dinero, energia: s.p.energia, nivel: s.p.nivel, rep: s.p.rep, marca: s.p.marca || 0, confianza: s.confianza });
  function fiestasDe(hitos, desb) { return (hitos || []).map(H => ({ tipo: 'hito', H })).concat((desb || []).filter(x => x.id !== 'empresa').map(x => ({ tipo: 'nuevo', x }))); }


  // =====================================================================
  // 💎 PREMIUM: comercio real (aquí, SIMULADO: backend en el navegador y Stripe falso, sin red ni cobro)
  // La partida no es la fuente de verdad: la cuenta sí. El juego pregunta P2.tieneEnt('…').
  // =====================================================================
  const almacen = (() => { try { const k = '__dban_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (_) { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; } })();
  let COM = null;
  function comercio() {
    if (COM || !globalThis.P2C) return COM;
    const W = globalThis.P2C_WEB;
    if (W && P2C.createHttpBackend && P2C.createWebAuth) {
      // Build web real: Supabase Auth + Edge Functions + Stripe Checkout (redirección)
      let auth = null; try { auth = P2C.createWebAuth({ supabaseUrl: W.supabaseUrl, publishableKey: W.publishableKey }); } catch (_) { auth = null; }
      const be = Object.assign(P2C.createHttpBackend({ functionsUrl: W.functionsUrl, publishableKey: W.publishableKey }),
        { signUp: o => auth.signUp(o), signIn: o => auth.signIn(o), signOut: () => auth && auth.signOut() });
      COM = P2C.createCommerceClient({ backend: be, storage: almacen, platform: 'web', config: { environment: W.environment }, navigate: u => location.assign(u) });
      COM.backend = be; COM.web = true;
      be.remoteConfig().then(rc => { Object.assign(COM.config, rc || {}); }).catch(() => {});
      const conSesion = () => auth && auth.session().then(s => s && COM.useSession(s)).then(() => { limpiarLook(S); render(); }).catch(() => {});
      if (auth) { conSesion(); auth.onChange(conSesion); }
    } else {
      // Prototipo: backend simulado en el navegador (mismo servicio que el servidor), sin red ni cobro
      const be = P2C.createMockBackend({ storage: almacen });
      COM = P2C.createCommerceClient({ backend: be, storage: almacen, platform: 'mock', config: { rewarded: { minigameLife: true } } });
      COM.backend = be;
    }
    P2.tieneEnt = e => COM.has(e);
    return COM;
  }
  const SIM = () => !(COM && COM.web);
  comercio();
  const realTxt = m => (globalThis.P2C ? P2C.formatMinor(m) : `${(m / 100).toFixed(2).replace('.', ',')} €`);
  const OLD_IAP = { debut: 'pack_debut', street: 'pack_street', pro: 'pack_pro', luxury: 'pack_luxury', founder: 'founder_pack', sinAnuncios: 'remove_ads', espacios: 'extra_save_slots_3' };
  const SKU_IAP = Object.fromEntries(Object.entries(OLD_IAP).map(([k, v]) => [v, k]));
  const PM_TABS = [['destacados', '✨ Destacados'], ['packs', '🧢 Packs'], ['deportes', '🏅 Deportes'], ['expansiones', '🏗️ Expansiones'], ['prestige', '🎖️ Prestige'], ['bundles', '🎁 Bundles'], ['comprado', '🧾 Comprado']];
  const PM_TIPOS = { packs: ['COSMETIC_PACK', 'SUPPORTER_PACK', 'REMOVE_ADS', 'SAVE_SLOTS'], deportes: ['SPORT_EXPANSION'], expansiones: ['SYSTEM_EXPANSION'], prestige: ['PRESTIGE_CAREER'], bundles: ['BUNDLE'] };
  const TIPO_TXT = { COSMETIC_PACK: 'Pack cosmético', SUPPORTER_PACK: 'Pack de apoyo', REMOVE_ADS: 'Sin anuncios', SAVE_SLOTS: 'Ranuras de carrera', SPORT_EXPANSION: 'Deporte', SYSTEM_EXPANSION: 'Expansión', PRESTIGE_CAREER: 'Prestige Career', BUNDLE: 'Bundle', PROMO: 'Promoción' };
  const ESTADO_TXT = { CREATED: 'Creada', PENDING: 'Pendiente', PAID: 'Pagada', FULFILLED: 'Completada', FAILED: 'Fallida', CANCELLED: 'Cancelada', REFUNDED: 'Reembolsada', PARTIALLY_REFUNDED: 'Reembolso parcial', DISPUTED: 'En disputa', REVOKED: 'Revocada' };
  function ctxJuego(s) {
    const club = s && s.contrato ? String((P2.OFERTAS[s.contrato.oferta] || {}).club || '').replace(/B$/, '') : null;
    return { hitos: (s && s.hitos) || {}, trophies: ((s && s.trofeos) || []).map(x => x.id).filter(Boolean), club };
  }
  const nombreEnt = e => ((P2C.CATALOG.entitlements[e] || {}).n || e);
  // Si una compra se reembolsa, lo que llevabas puesto de ese pack vuelve a lo básico
  function limpiarLook(s) { P2.limpiarPremium(s); }
  async function pmAsync(fn) {
    try { await fn(); } catch (e) { ui.pm = Object.assign(ui.pm || {}, { error: e.code || e.message }); }
    limpiarLook(S); if (S) P2.guardar(S); render();
  }
  const pmErrorTxt = c => ({ account_required: 'Necesitas una cuenta.', offline: 'Sin conexión: puedes seguir jugando, pero las compras necesitan internet.', owned: 'Ya es tuyo.', coming_soon: 'Todavía no está disponible.',
    requires: 'Te falta un requisito.', withdrawal_consent_required: 'Marca la casilla para continuar.', promo_invalid: 'Ese código no existe.', promo_already_redeemed: 'Ya has usado ese código.', promo_exhausted: 'Ese código ya no tiene canjes.',
    promo_expired: 'Ese código ha caducado.', rate_limited: 'Demasiados intentos. Prueba en unos minutos.', provider_unavailable: 'Este método de pago no está disponible aquí.' }[c] || 'Algo ha fallado. No se ha cobrado nada.');
  function pmCard(x) {
    const P = x.product, st = x.state, ic = (P.assets && P.assets.ic) || '💎';
    const etiqueta = st.owned ? '<span class="pmEstado ok">✓ Tuyo</span>' : P.status === 'coming_soon' ? '<span class="pmEstado">Próximamente</span>' : st.blocked === 'requires' ? '<span class="pmEstado">🔒 Requisito</span>' : st.price ? `<span class="precioReal">${realTxt(st.price.amountMinor)}</span>` : '';
    return `<button class="pmCard ${st.owned ? 'tuyo' : ''}" data-act="pmVer" data-id="${esc(P.id)}"><span class="pmIc" style="background:${esc((P.assets && P.assets.color) || '#7c5cff')}">${ic}</span>
      <span class="pmTx"><b>${esc(P.name)}</b><small>${esc(TIPO_TXT[P.type] || '')}${P.cosmeticOnly ? ' · solo aspecto' : ''}${st.partiallyOwned ? ' · ya tienes una parte' : ''}</small></span>${etiqueta}</button>`;
  }
  function htmlPremium(s) {
    const C = comercio(); if (!C) return '<div class="card"><p>La tienda Premium no está disponible.</p></div>';
    const pm = ui.pm || (ui.pm = { tab: 'destacados' });
    const store = C.store(ctxJuego(s));
    const tabs = `<div class="pmTabs" role="tablist">${PM_TABS.map(([k, n]) => `<button role="tab" aria-selected="${pm.tab === k}" class="${pm.tab === k ? 'sel' : ''}" data-act="pmTab" data-v="${k}">${n}</button>`).join('')}</div>`;
    const cabecera = `<div class="card pmHead"><h2>💎 Premium</h2><p class="small">Gratis para jugar. Aquí solo hay <b>identidad</b> y <b>más juego</b>: nunca nivel, victorias, ascensos ni dinero del juego.</p>
      ${SIM() ? '<p class="small pmModo">🧪 Versión de prueba: compras <b>simuladas</b> (Stripe en modo test, sin red). No se cobra nada.</p>' : COM.config.environment !== 'production' ? '<p class="small pmModo">🧪 Stripe en modo TEST: usa una tarjeta de prueba; no se cobra dinero real.</p>' : ''}
      ${C.isGuest() ? `<button class="btn w full" data-act="pmCuenta">🔐 Crear cuenta para proteger tus compras</button><button class="btn w full" data-act="pmEntrar">Ya tengo cuenta</button>` : `<p class="small">Cuenta: <b>${esc(C.account().email || 'sin email')}</b> · ${esc(METODO_TXT[C.account().method] || C.account().method)}${SIM() ? ' (simulada)' : ''} · <button class="enlace" data-act="cuenta">Mi cuenta</button></p>`}</div>`;
    let cuerpo = '';
    if (pm.tab === 'comprado') cuerpo = htmlMisCompras(s, C);
    else {
      const lista = pm.tab === 'destacados' ? (store.featured.length ? store.featured.map(p => store.products.find(x => x.product.id === p.id)).filter(Boolean) : store.products.filter(x => x.state.purchasable).slice(0, 3))
        : store.products.filter(x => (PM_TIPOS[pm.tab] || []).includes(x.product.type));
      cuerpo = `<div class="pmLista">${lista.map(pmCard).join('') || '<p class="small blanco">Nada por aquí todavía. Lo que se puede comprar aparece según avanzas en tu carrera.</p>'}</div>`;
      if (pm.tab === 'destacados' && C.entitlements().length) cuerpo += `<div class="card"><h3>✓ Ya tienes</h3><p class="small">${C.entitlements().map(e => esc(nombreEnt(e))).join(' · ')}</p></div>`;
    }
    return cabecera + tabs + cuerpo;
  }
  function htmlMisCompras(s, C) {
    if (C.isGuest()) return `<div class="card"><h3>🧾 Mis compras</h3><p>${esc(C.terms.accountPrompt)}</p><button class="btn full" data-act="pmCuenta">Crear cuenta</button><button class="btn w full" data-act="pmEntrar">Ya tengo cuenta</button></div>`;
    const H = ui.pm.hist;
    const filas = H ? (H.orders.length ? H.orders.map(o => `<div class="lin"><span class="ic">${o.status === 'FULFILLED' ? '✅' : /REFUND|REVOK/.test(o.status) ? '↩️' : o.status === 'FAILED' || o.status === 'CANCELLED' ? '✖️' : '⏳'}</span><span><b>${esc(o.name)}</b> · ${esc(realTxt(o.amountMinor))}<br><span class="small">${esc(new Date(o.date).toLocaleDateString('es-ES'))} · ${esc(o.provider === 'stripe' ? 'Stripe (simulado)' : o.provider)} · ${esc(ESTADO_TXT[o.status] || o.status)} · ref. ${esc(o.orderRef)}</span></span></div>`).join('') : '<p class="small">Todavía no has comprado nada.</p>')
      + (H.other || []).map(g => `<div class="lin"><span class="ic">🎁</span><span>${esc(nombreEnt(g.entitlementId))}<br><span class="small">${esc(g.source === 'promo' ? 'Código promocional' : g.source === 'admin' ? 'Regalo del equipo' : g.source)} · ${esc(g.status === 'active' ? 'activo' : g.status)}</span></span></div>`).join('') : '<p class="small">Cargando…</p>';
    return `<div class="card"><h3>🧾 Mis compras</h3>${filas}<p class="small">¿Problemas con una compra? Escríbenos con la <b>referencia de la orden</b>. Nunca te pediremos datos de tu tarjeta.</p></div>
      <div class="card"><h3>🔄 Restaurar</h3><p class="small">Tus compras están en tu cuenta, no en la partida: si cambias de móvil o empiezas otra carrera, las recuperas aquí sin volver a pagar.</p>
        <button class="btn full" data-act="pmRestaurar">Restaurar compras</button><button class="btn w full" data-act="pmSync">Sincronizar compras</button>${C.lastSync() ? `<p class="small">Última sincronización: ${esc(new Date(C.lastSync()).toLocaleString('es-ES'))}</p>` : ''}</div>
      <div class="card"><h3>🎟️ Código promocional</h3><div class="fila"><input id="pmPromo" class="inp" maxlength="40" placeholder="CÓDIGO" autocomplete="off"><button class="btn" data-act="pmPromo">Canjear</button></div>${ui.pm.promoMsg ? `<p class="small">${esc(ui.pm.promoMsg)}</p>` : ''}</div>
      <div class="card"><h3>👤 Cuenta</h3><p class="small">${esc(C.account().email || '')} · ${esc(METODO_TXT[C.account().method] || C.account().method)}${SIM() ? ' (simulada)' : ''}</p><button class="btn w full" data-act="cuenta">Gestionar mi cuenta</button><button class="btn w full" data-act="pmSalir">Cerrar sesión</button>
        <p class="small">En «Mi cuenta» puedes editar tu perfil, copiar tus carreras en la nube, descargar tus datos o eliminar la cuenta.</p></div>`;
  }
  // Ficha y pasos de compra (capa encima del juego)
  function htmlPmCapa(s) {
    const C = comercio(), pm = ui.pm; if (!C || !pm) return '';
    const P = pm.sku && P2C.getProduct(pm.sku);
    const err = pm.error ? `<p class="pmErr" role="alert">${esc(pmErrorTxt(pm.error))}</p>` : '';
    if (!P) return '';
    const st = C.state(P.id, ctxJuego(s)), price = st.price ? realTxt(st.price.amountMinor) : '';
    if (pm.paso === 'checkout') return `<div class="overlay" role="dialog" aria-label="Pago"><div class="modal pmCheckout"><small class="eti">🔒 CHECKOUT DE PRUEBA · STRIPE TEST (SIMULADO)</small>
      <h2>${esc(P.name)}</h2><div class="pmTotal"><span>Total</span><b>${price}</b></div><p class="small">Aquí, en el juego real, se abriría la página segura de Stripe. En esta versión de prueba <b>no se pide ninguna tarjeta y no se cobra nada</b>.</p>
      <p class="small">Referencia de la orden: <b>${esc(pm.orderRef || '')}</b></p>
      <button class="btn full" data-act="pmPagar" data-v="paid">Pagar ${price} (simulado)</button><button class="btn w full" data-act="pmPagar" data-v="failed">Simular pago rechazado</button><button class="btn w full" data-act="pmPagar" data-v="cancel">Cancelar</button></div></div>`;
    if (pm.paso === 'redirigiendo') return `<div class="overlay" role="dialog"><div class="modal"><div class="pmSpin" aria-hidden="true"></div><h2>Te llevamos al pago seguro…</h2><p class="small">El pago se hace en la página de Stripe. Ref. ${esc(pm.orderRef || '')}</p></div></div>`;
    if (pm.paso === 'verificando') return `<div class="overlay" role="dialog" aria-label="Verificando"><div class="modal"><div class="pmSpin" aria-hidden="true"></div><h2>${esc(C.terms.verifying)}</h2><p class="small">Esperamos la confirmación del servidor (el webhook de Stripe). Volver de la página de pago no concede nada por sí solo.</p><p class="small">Ref. ${esc(pm.orderRef || '')}</p></div></div>`;
    if (pm.paso === 'lento') return `<div class="overlay" role="dialog"><div class="modal"><h2>⏳ Casi…</h2><p>${esc(C.terms.slow)}</p><button class="btn full" data-act="pmSync">Sincronizar compras</button><button class="btn w full" data-act="pmCerrar">Cerrar</button><p class="small">Ref. ${esc(pm.orderRef || '')}</p></div></div>`;
    if (pm.paso === 'error') return `<div class="overlay" role="dialog"><div class="modal"><h2>No se ha completado</h2><p>No se ha cobrado nada.</p><p class="small">Ref. ${esc(pm.orderRef || '')}</p><button class="btn full" data-act="pmCerrar">Volver</button></div></div>`;
    // Ficha del producto: todo antes de pagar
    const K = P2.PACKS[P.id], sv = s || { p: { energia: 80 }, hitos: {} };
    const prevSkins = K && (K.skins || []).length ? `<div class="pmPrevX">${K.skins.filter(([v], i, a) => a.findIndex(x => x[0] === v) === i).slice(0, 2).map(([v, k]) => `<div title="${esc((P2.skinDe(v, k) || {}).n || '')}">${vehiculoSVG(v, k)}</div>`).join('')}</div>` : '';
    const prevDeco = K && (K.deco || []).length ? `<div class="pmPrevX">${K.deco.map(([tp, d]) => `<div>${tp === 'casa' ? casaSVG(s ? vivienda(s) : 'piso', d) : despachoSVG(d)}</div>`).join('')}</div>` : '';
    const prev = K ? `<div class="iapPrev grande">${P2.avatarSVG(sv, P2.lookPack(s, P.id), 'cuerpo')}</div>${prevSkins}${prevDeco}` : `<div class="grande peq">${(P.assets && P.assets.ic) || '💎'}</div>`;
    const req = st.requires && !st.requires.ok ? `<div class="pmReq">🔒 ${st.requires.missing.length ? `Necesitas ${st.requires.missing.map(e => `la expansión <b>${esc(nombreEnt(e))}</b>`).join(' y ')}.` : ''}${st.requires.anyCount ? ` Necesitas al menos ${st.requires.anyCount.n} deportes.` : ''}
      ${st.requires.missing.map(e => { const R = P2C.PRODUCTS.find(x => x.entitlements.length === 1 && x.entitlements[0] === e); return R ? `<button class="btn w" data-act="pmVer" data-id="${esc(R.id)}">Ver ${esc(R.name)}</button>` : ''; }).join('')}</div>` : '';
    const puede = st.purchasable;
    return `<div class="overlay" role="dialog" aria-label="${esc(P.name)}"><div class="modal pmFicha">${prev}<small class="eti">${esc(TIPO_TXT[P.type] || '')}</small><h2>${esc(P.name)}</h2>
      ${price ? `<div class="pmPrecio"><b>${price}</b><span>dinero real · pago único</span></div>` : ''}
      <p>${esc(P.description)}</p>
      ${P.includes.length ? `<div class="pmIncluye"><b>Incluye</b><ul>${P.includes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${P.cosmeticOnly ? `<p class="small">✨ ${esc(C.terms.cosmetic)}</p>` : ''}${P.type === 'PRESTIGE_CAREER' ? `<p class="pmAviso">⚠️ ${esc(C.terms.prestige)}</p>` : ''}
      ${P.oneTime ? `<p class="small">♾️ ${esc(C.terms.permanent)}</p>` : ''}${req}
      ${st.owned ? '<p class="pmOk">✓ Ya es tuyo.</p>' : P.status === 'coming_soon' ? '<p class="pmProx">Próximamente: todavía no se puede comprar.</p>' : ''}
      ${puede ? `<label class="pmConsent"><input type="checkbox" data-act="pmConsent" ${pm.consent ? 'checked' : ''}> ${esc(C.terms.withdrawal)} <span class="small">(texto pendiente de revisión legal)</span></label>` : ''}
      ${err}
      <div class="pmBotones">${puede ? `<button class="btn full" data-act="pmComprar" ${pm.consent ? '' : 'disabled'}>Comprar · ${price}</button>` : ''}<button class="btn w full" data-act="pmCerrar">${puede ? 'No, gracias' : 'Cerrar'}</button></div>
      ${puede ? '<p class="small">🧪 Simulado: no se cobra nada. En la versión real, el pago lo procesa Stripe (o la tienda de tu móvil).</p>' : ''}</div></div>`;
  }
  // =====================================================================
  // 🗂️ MIS CARRERAS (varias partidas a la vez) · 👤 CUENTA (crear, entrar, perfil, nube, datos, borrar)
  // La cuenta guarda compras y una copia de las carreras; la partida sigue funcionando sin cuenta y sin red.
  // =====================================================================
  const FASE_TXT = { barrio: 'Captación en el barrio', pruebas: 'Preparando las pruebas', amateur: 'Fútbol amateur', club: 'Profesional' };
  const METODO_TXT = { apple: 'Apple', google: 'Google', email: 'email' };
  const haceTxt = ms => { if (!ms) return ''; const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? 'ahora mismo' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `el ${new Date(ms).toLocaleDateString('es-ES')}`; };
  const hayCarreras = () => P2.listarPartidas().some(r => r.existe);
  const conCuenta = () => !!(comercio() && !COM.isGuest());
  const nubeAuto = () => { try { return almacen.getItem('dban_nube_auto') !== '0'; } catch (_) { return true; } };
  function resetUiPartida() { Object.assign(ui, { celes: [], pm: null, mj: null, rw: null, iap: null, iapCard: null, inter: false, nuevaCompra: null, fiestas: [], paso: null, mundo: false, desbloqueos: [], msg: '', vista: 'semana', borrarCar: null, ren: null }); }
  // ---- Copia en la nube ----
  async function nubeSubir() { const r = await COM.putSaves(P2.exportarPartidas()); P2.limpiarBorradas(r.borradas || []); return r; }
  let nubeT = null;
  // Copia automática (al guardar y salir, al cambiar de carrera y cada 4 semanas). Si falla (sin red), lo intenta la próxima vez.
  function nubeAutoSubir() { if (!conCuenta() || !nubeAuto() || !COM.online()) return; clearTimeout(nubeT); nubeT = setTimeout(() => { nubeSubir().then(() => { if (ui.pant) render(); }).catch(() => {}); }, 300); }
  async function nubeTraer(forzar) {
    const blob = await COM.getSaves();
    const r = P2.importarPartidas(blob, { forzar });
    if (r.escritas.includes(P2.ranuraActiva()) || !S) { const s2 = P2.cargar(); if (s2) S = s2; }
    return Object.assign(r, { total: blob.ranuras.length });
  }
  function nubeResumen(r) {
    if (!r.total) return 'No hay carreras en tu cuenta todavía.';
    const p = [], max = P2.ranurasMax();
    if (r.escritas.length) p.push(`${r.escritas.length} ${r.escritas.length === 1 ? 'carrera traída' : 'carreras traídas'}`);
    const viejas = r.omitidas.filter(i => i < max), bloq = r.omitidas.filter(i => i >= max);
    if (viejas.length) p.push(`${viejas.length} sin tocar (la de este dispositivo es más nueva)`);
    if (bloq.length) p.push(`${bloq.length} en ranuras de «+3 carreras» (se quedan en la nube)`);
    if (r.invalidas.length) p.push(`${r.invalidas.length} que no se pudieron leer`);
    ui.nubeForzar = viejas.length > 0;
    return (p.join(' · ') || 'Nada que traer') + '.';
  }
  // Una carrera en una ranura de pago sin el pack (reembolso, otra cuenta, cerrar sesión): se guarda y se bloquea, nunca se borra
  function comprobarRanura() {
    if (S && P2.ranuraActiva() >= P2.ranurasMax()) { S = null; resetUiPartida(); ui.pant = 'carreras'; ui.flash = '🔒 Esa carrera está en una ranura de «+3 carreras» y ahora no tienes ese pack. Está guardada y a salvo.'; }
  }
  function htmlNube() {
    const C = comercio(); if (!C) return '';
    if (C.isGuest()) return `<div class="card nube"><h3>☁️ Tus carreras, a salvo</h3><p class="small">Con una cuenta gratis tus carreras se copian en la nube y las sigues en otro móvil u ordenador.</p>
      <button class="btn full" data-act="cuCrear" data-v="carreras">Crear cuenta</button><button class="btn w full" data-act="cuEntrar" data-v="carreras">Ya tengo cuenta</button></div>`;
    return `<div class="card nube"><h3>☁️ Copia en tu cuenta</h3><p class="small">${C.lastCloudSave() ? `Última copia: ${esc(haceTxt(Date.parse(C.lastCloudSave())))}.` : 'Todavía no has subido ninguna copia.'}${SIM() ? ' 🧪 Nube simulada.' : ''}</p>
      <div class="fila2"><button class="btn" data-act="nubeSubir">⬆️ Guardar en la nube</button><button class="btn w" data-act="nubeTraer">⬇️ Traer de la nube</button></div>
      <label class="chk"><input type="checkbox" data-act="nubeAuto" ${nubeAuto() ? 'checked' : ''}> Copia automática (al guardar y salir y cada 4 semanas)</label>
      ${ui.nubeMsg ? `<p class="small nubeMsg">${esc(ui.nubeMsg)}</p>` : ''}${ui.nubeForzar ? '<button class="btn w full" data-act="nubeForzar">Usar igualmente las de la nube</button>' : ''}</div>`;
  }
  function htmlCarreras() {
    const L = P2.listarPartidas(), pap = ui.deshacer ? P2.papelera() : null, max = P2.ranurasMax(), tot = P2.totalRanuras();
    const libres = L.filter(r => !r.existe && !r.rota && !r.bloqueada).length;
    const tarjeta = r => {
      if (r.existe) {
        const R = r.resumen, sv = { p: { energia: 80 }, hitos: {} };
        const botones = r.bloqueada ? '<p class="small carNota">🔒 Ranura de «+3 carreras»: guardada y a salvo. Vuelve a tener el pack para jugarla.</p>'
          : `<div class="carBtns"><button class="btn g" data-act="carSeguir" data-i="${r.i}">${r.activa && S ? '▶ Seguir jugando' : '▶ Continuar'}</button>
            <button class="btn w mini" data-act="carRen" data-i="${r.i}" aria-label="Cambiar el nombre">✏️</button>${libres ? `<button class="btn w mini" data-act="carCopiar" data-i="${r.i}" aria-label="Copiar en otra ranura">📄</button>` : ''}
            <button class="btn w mini ${ui.borrarCar === r.i ? 'peligro' : ''}" data-act="carBorrar" data-i="${r.i}" aria-label="Borrar">${ui.borrarCar === r.i ? '⚠️ Toca otra vez para borrar' : '🗑️'}</button></div>`;
        return `<div class="carrera ${r.activa ? 'act' : ''} ${r.bloqueada ? 'bloq' : ''}" data-i="${r.i}"><div class="carAva">${P2.avatarSVG(sv, R.look, 'busto')}</div>
          <div class="carTx">${ui.ren === r.i ? `<div class="fila"><input id="carNombre" class="inp" maxlength="30" value="${esc(r.titulo)}" aria-label="Nombre de la carrera"><button class="btn mini" data-act="carRenOk" data-i="${r.i}">OK</button></div>` : `<b>${esc(r.titulo)}</b>`}
            <small>${(P2.DEPORTES[R.deporte] || P2.DEPORTES.futbol).ic} ${esc(R.nombre)}, ${R.edad} años · semana ${R.semana} · ${esc(R.club || FASE_TXT[R.fase] || '')}${P2.deporteDisponible(R.deporte) ? '' : ` · 🔒 necesita ${esc(P2.DEPORTES[R.deporte].n)}`}</small>
            <small>💰 ${esc(eur(R.patrimonio))}${R.trofeos ? ` · 🏆 ${R.trofeos}` : ''}${R.empresas ? ` · 💼 ${R.empresas}` : ''}${r.guardadoEn ? ` · 💾 ${esc(haceTxt(r.guardadoEn))}` : ''}</small></div>${botones}</div>`;
      }
      if (r.rota) return `<div class="carrera vacia"><b>⚠️ Carrera ${r.n}</b><small>No se pudo leer. Hemos apartado una copia de seguridad en este navegador.</small></div>`;
      if (r.bloqueada) return `<button class="carrera vacia lock" data-act="carMas"><b>🔒 Carrera ${r.n}</b><small>Con «+3 carreras» juegas hasta ${tot} vidas distintas a la vez.</small></button>`;
      return `<button class="carrera vacia" data-act="carNueva" data-i="${r.i}"><b>➕ Nueva carrera</b><small>Ranura ${r.n} libre</small></button>`;
    };
    return `<div class="intro carreras"><h1>🗂️ Mis carreras</h1><p>${max} ${max === 1 ? 'ranura' : 'ranuras'}${max < tot ? ` · ${tot - max} más con «+3 carreras»` : ''}. Cada carrera es una vida distinta. Tus compras valen en todas.</p>
      ${pap ? `<div class="card deshacer"><span>🗑️ Has borrado «${esc((pap.meta && pap.meta.titulo) || `Carrera ${pap.i + 1}`)}».</span><button class="btn w mini" data-act="carDeshacer">Deshacer</button></div>` : ''}
      <div class="carLista">${L.map(tarjeta).join('')}</div>
      ${htmlNube()}
      <div class="fila2"><button class="btn w" data-act="cuenta">👤 ${conCuenta() ? 'Mi cuenta' : 'Cuenta'}</button>${S ? '<button class="btn w" data-act="carVolver">‹ Volver a la partida</button>' : ''}</div></div>`;
  }

  // ---- Pantalla «Mi cuenta» ----
  function htmlCuenta() {
    const C = comercio(); if (!C) return '<div class="card"><p>La cuenta no está disponible.</p></div>';
    const volver = `<button class="btn w full" data-act="cuVolver">‹ Volver</button>`;
    if (C.isGuest()) return `<div class="intro cuentaP"><h1>👤 Tu cuenta</h1><div class="card"><h3>Juega sin cuenta, o crea una gratis</h3>
      <ul class="ventajas"><li>🛡️ Tus compras, protegidas y restaurables</li><li>☁️ Tus carreras, copiadas en la nube</li><li>📱 Sigue en otro móvil u ordenador</li></ul>
      <button class="btn full" data-act="cuCrear" data-v="cuenta">Crear cuenta</button><button class="btn w full" data-act="cuEntrar" data-v="cuenta">Ya tengo cuenta</button>
      <p class="small">Sin contraseñas: Apple, Google o un código a tu email.${SIM() ? ' 🧪 Simulado: no se crea ninguna cuenta real ni se envía nada.' : ''}</p></div>${volver}</div>`;
    const a = C.account(), p = C.profile() || {};
    const sv = S || { p: { energia: 80 }, hitos: {}, look: P2.LOOK_INICIAL };
    const tutor = p.ageBand === 'u13' ? `<div class="card"><h3>👪 Permiso de tu familia</h3><p class="small">${p.parentalStatus === 'approved' ? '✅ Tu madre, padre o tutor ha dado permiso: puedes comprar.' : p.parentalStatus === 'pending' ? '⏳ Esperando a que tu madre, padre o tutor acepte desde su correo. Mientras, juegas a todo igual.' : 'Para comprar necesitas el permiso de tu madre, padre o tutor.'}</p>
        ${p.parentalStatus !== 'approved' ? '<button class="btn w full" data-act="cuTutorAbrir">Ver o pedir permiso</button>' : ''}</div>`
      : p.isMinor ? '<div class="card"><h3>🧒 Cuenta de menor</h3><p class="small">No te enseñamos ofertas ni publicidad. Antes de comprar, pide permiso en casa.</p></div>' : '';
    return `<div class="intro cuentaP"><h1>👤 Mi cuenta</h1>
      <div class="card cuentaHead"><div class="carAva">${P2.avatarSVG(sv, S ? null : sv.look, 'busto')}</div><div><b>${esc(p.displayName || (S && S.nombre) || 'Sin nombre')}</b><small>${esc(a.email || 'sin email')} · con ${esc(METODO_TXT[a.method] || a.method)}${SIM() ? ' · 🧪 simulada' : ''}</small>
        ${p.createdAt ? `<small>Desde el ${esc(new Date(p.createdAt).toLocaleDateString('es-ES'))}</small>` : ''}</div></div>
      ${p.needsProfile ? '<div class="card aviso"><b>Completa tu perfil</b><p class="small">Necesitamos tu edad y que aceptes los términos para poder comprar.</p><button class="btn full" data-act="cuEditar">Completar perfil</button></div>' : ''}
      <div class="card"><h3>🪪 Perfil</h3>${kv('Nombre', esc(p.displayName || '—'))}${kv('País', esc((P2C.COUNTRIES.find(([c]) => c === p.country) || [, '—'])[1]))}${kv('Edad', esc(p.ageBand ? P2C.AGE_TXT[p.ageBand] : '—'))}
        ${p.isMinor ? '' : kv('Novedades por email', p.marketingOptIn ? 'Sí' : 'No')}${kv('Términos', p.termsVersion ? `aceptados (${esc(p.termsVersion)})` : 'pendientes')}
        <button class="btn w full" data-act="cuEditar">✏️ Editar perfil</button></div>
      ${tutor}
      ${htmlNube()}
      <div class="card"><h3>💎 Compras</h3><p class="small">${C.entitlements().length ? `Tienes: ${C.entitlements().map(e => esc(nombreEnt(e))).join(' · ')}` : 'Todavía no has comprado nada.'}</p>
        <button class="btn w full" data-act="cuCompras">🧾 Mis compras y restaurar</button></div>
      <div class="card"><h3>🔏 Privacidad y datos</h3><button class="btn w full" data-act="cuDatos">📦 Descargar mis datos</button>
        <div class="fila2"><button class="btn w" data-act="cuLegal" data-v="terminos">📄 Términos</button><button class="btn w" data-act="cuLegal" data-v="privacidad">🔏 Privacidad</button></div></div>
      <div class="card"><h3>🚪 Sesión</h3><button class="btn w full" data-act="cuSalir">Cerrar sesión</button><p class="small">Tus carreras siguen en este dispositivo. Tus compras, en tu cuenta.</p>
        <button class="btn w full peligro" data-act="cuBorrar">Eliminar mi cuenta</button></div>
      ${volver}</div>`;
  }

  // ---- Capa de cuenta (crear / entrar / perfil / permiso / nube / borrar) ----
  const LEGAL = {
    terminos: `<ul><li>El juego es gratis. Lo que se compra es solo aspecto o más juego: nunca victorias, nivel, reputación ni dinero del juego.</li><li>Los precios son en euros, con impuestos incluidos, y se ven antes de pagar.</li><li>Las compras son permanentes, se guardan en tu cuenta y se restauran en cualquier dispositivo.</li><li>Al ser contenido digital entregado al momento, al comprar aceptas perder el desistimiento de 14 días (te lo preguntamos siempre con una casilla).</li><li>Menores de 13 años: necesitan el permiso de su madre, padre o tutor para comprar.</li><li>Puedes eliminar tu cuenta cuando quieras.</li></ul>`,
    privacidad: `<ul><li>Guardamos: tu email (o el alias de Apple), el nombre que eliges, tu país, tu franja de edad, tus compras y, si quieres, una copia de tus carreras.</li><li>Nunca vemos tu tarjeta: el pago lo procesa Stripe (o la tienda de tu móvil).</li><li>No vendemos tus datos. A menores no les mandamos publicidad.</li><li>Puedes descargar todos tus datos o borrar tu cuenta desde «Mi cuenta».</li><li>Al borrarla, los registros contables de las compras se guardan anonimizados porque la ley lo exige.</li></ul>`,
  };
  const cuErrorTxt = (c, cu) => ({ invalid_email: 'Ese email no parece válido.', email_required: 'Escribe tu email.', account_exists: 'Ya hay una cuenta con ese email. Toca «Ya tengo cuenta» para entrar.',
    account_not_found: 'No hay ninguna cuenta con ese email. ¿Quieres crear una?', invalid_code: `Código incorrecto.${cu && cu.intentos ? ` Te quedan ${Math.max(0, 5 - cu.intentos)} intentos.` : ''}`,
    code_expired: 'El código ha caducado. Pide otro.', too_many_attempts: 'Demasiados intentos. Pide un código nuevo.', rate_limited: 'Espera unos segundos antes de pedir otro código.',
    offline: 'Sin conexión. Puedes seguir jugando; la cuenta necesita internet.', invalid_display_name: 'Escribe un nombre.', invalid_country: 'Elige un país de la lista.', invalid_age: 'Dinos tu edad.',
    age_locked: 'La edad no se puede cambiar.', terms_required: 'Para seguir tienes que aceptar los términos y la privacidad.', confirm_required: 'Escribe ELIMINAR para confirmar.',
    profile_required: 'Completa tu perfil para poder comprar.', parental_consent_required: 'Necesitas el permiso de tu madre, padre o tutor para comprar.', parental_not_needed: 'No hace falta permiso.' }[c] || pmErrorTxt(c));
  function htmlCuCapa() {
    const C = comercio(), cu = ui.cu; if (!C || !cu) return '';
    const err = cu.error ? `<p class="pmErr" role="alert">${esc(cuErrorTxt(cu.error, cu))}</p>` : '';
    const sim = SIM(), crear = cu.modo !== 'entrar', a = C.account() || {};
    let h = '';
    switch (cu.paso) {
      case 'inicio':
        h = `<h2>${crear ? '🔐 Crea tu cuenta' : '🔐 Entra en tu cuenta'}</h2>
          ${crear ? `<p>${esc(C.terms.accountPrompt)}</p><ul class="ventajas"><li>🛡️ Compras protegidas y restaurables</li><li>☁️ Tus carreras, copiadas en la nube</li><li>📱 Sigue en otro móvil u ordenador</li></ul>` : '<p>Con la misma cuenta recuperas tus compras y tus carreras en este dispositivo.</p>'}
          <button class="btn full apple" data-act="cuMetodo" data-v="apple">Continuar con Apple</button>
          <button class="btn full google" data-act="cuMetodo" data-v="google">Continuar con Google</button>
          <button class="btn full" data-act="cuMetodo" data-v="email">✉️ Continuar con email</button>
          ${cu.aviso ? `<p class="pmOk">${esc(cu.aviso)}</p>` : ''}
          <p class="small">Sin contraseñas.${sim ? ' 🧪 Simulado: no se crea ninguna cuenta real ni se envía nada.' : ''} Puedes seguir jugando sin cuenta.</p>${err}
          <button class="btn w full" data-act="cuModo" data-v="${crear ? 'entrar' : 'crear'}">${crear ? 'Ya tengo cuenta' : 'Crear una cuenta nueva'}</button><button class="btn w full" data-act="cuCerrar">Ahora no</button>`; break;
      case 'sistema': {
        const ap = cu.metodo === 'apple';
        h = `<div class="hojaSis ${esc(cu.metodo)}"><small class="eti">🧪 SIMULACIÓN · ${ap ? 'INICIAR SESIÓN CON APPLE' : 'ACCEDER CON GOOGLE'}</small><h2>${ap ? 'Tu Apple ID' : 'Elige una cuenta de Google'}</h2>
          <p class="small">En el juego real aquí se abre la pantalla de ${ap ? 'Apple' : 'Google'}. Para probar, escribe un email inventado.</p>
          <input id="cuEmail" class="inp" type="email" autocomplete="email" value="${esc(cu.email || '')}" placeholder="${ap ? 'tu@icloud.com' : 'tu@gmail.com'}" aria-label="Email">
          ${ap && crear ? `<div class="radios"><label><input type="radio" name="cuOcultar" value="no" ${cu.ocultar ? '' : 'checked'}> Compartir mi email</label><label><input type="radio" name="cuOcultar" value="si" ${cu.ocultar ? 'checked' : ''}> Ocultar mi email (Apple te da un alias)</label></div>` : ''}
          ${err}<button class="btn full" data-act="cuSistemaOk">Continuar</button><button class="btn w full" data-act="cuAtras">Atrás</button></div>`; break;
      }
      case 'email':
        h = `<h2>✉️ ${crear ? 'Tu email' : 'Entra con tu email'}</h2><p class="small">Te mandamos un código de 6 cifras. Sin contraseñas.</p>
          <input id="cuEmail" class="inp" type="email" autocomplete="email" inputmode="email" value="${esc(cu.email || '')}" placeholder="tu@email.com" aria-label="Email">${err}
          <button class="btn full" data-act="cuPedirCodigo">Enviarme el código</button><button class="btn w full" data-act="cuAtras">Atrás</button>`; break;
      case 'codigo':
        h = `<h2>📬 Revisa tu correo</h2><p>Hemos enviado un código de 6 cifras a <b>${esc(cu.email)}</b>.</p>
          ${cu.testCode ? `<div class="bandeja" role="note"><small>🧪 BANDEJA DE ENTRADA (SIMULADA)</small><b>Del barrio al negocio</b><span>Tu código es <b class="cod">${esc(cu.testCode)}</b>. Caduca en 10 minutos.</span></div>` : ''}
          <input id="cuCodigo" class="inp codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······" aria-label="Código de 6 cifras">${err}
          ${cu.aviso ? `<p class="pmOk">${esc(cu.aviso)}</p>` : ''}
          <button class="btn full" data-act="cuVerificar">Confirmar</button><button class="btn w full" data-act="cuReenviar">Reenviar el código</button>
          <p class="small">¿No llega? Mira en spam o en promociones.</p><button class="btn w full" data-act="cuAtras">Cambiar el email</button>`; break;
      case 'perfil': {
        const p = C.profile() || {}, fijo = !!p.ageBand, edad = cu.edad || p.ageBand || '', terms = p.termsVersion !== P2C.TERMS_VERSION;
        h = `<h2>${cu.editar ? '✏️ Editar perfil' : '👤 Tu perfil'}</h2>${cu.editar ? '' : '<p class="small">Un último paso: así el juego es adecuado para ti.</p>'}
          <label class="campo">Nombre que se ve<input id="cuNombre" class="inp" maxlength="24" value="${esc(cu.nombre != null ? cu.nombre : (p.displayName || (S && S.nombre) || ''))}"></label>
          <label class="campo">País<select id="cuPais" class="inp">${P2C.COUNTRIES.map(([c, n]) => `<option value="${c}" ${(cu.pais || p.country || 'ES') === c ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
          <div class="campo"><span>Edad</span>${fijo ? `<b>${esc(P2C.AGE_TXT[p.ageBand])}</b><small>La edad no se puede cambiar. Si te equivocaste, escríbenos.</small>`
            : `<div class="segEdad" role="radiogroup">${P2C.AGE_BANDS.map(x => `<button role="radio" data-act="cuEdad" data-v="${x}" class="${edad === x ? 'sel' : ''}" aria-checked="${edad === x}">${esc(P2C.AGE_TXT[x])}</button>`).join('')}</div>`}</div>
          ${edad && edad !== '18p' ? '<p class="small">🧒 Eres menor: no te enseñamos ofertas ni publicidad.' + (edad === 'u13' ? ' Para comprar, tu madre, padre o tutor tendrá que dar permiso.' : ' Antes de comprar, pide permiso en casa.') + '</p>' : ''}
          ${terms ? `<label class="pmConsent"><input type="checkbox" id="cuTerminos" data-act="cuTerminos" ${cu.terminos ? 'checked' : ''}> He leído y acepto los <button class="enlace" data-act="cuLegal" data-v="terminos">Términos</button> y la <button class="enlace" data-act="cuLegal" data-v="privacidad">Privacidad</button>.</label>` : ''}
          ${edad === '18p' ? `<label class="pmConsent"><input type="checkbox" id="cuNovedades" data-act="cuNovedades" ${(cu.novedades != null ? cu.novedades : p.marketingOptIn) ? 'checked' : ''}> Quiero recibir novedades del juego por email (opcional)</label>` : ''}
          ${err}<button class="btn full" data-act="cuGuardarPerfil">${cu.editar ? 'Guardar' : 'Guardar y seguir'}</button><button class="btn w full" data-act="cuCerrar">${cu.editar ? 'Cancelar' : 'Más tarde'}</button>`; break;
      }
      case 'tutor': {
        const p = C.profile() || {};
        h = `<h2>👪 Permiso de tu familia</h2>
          ${p.parentalStatus === 'pending' ? `<p>Hemos escrito a tu madre, padre o tutor. Cuando acepte desde su correo, podrás comprar. Mientras, puedes jugar a todo.</p>${sim ? '<button class="btn full" data-act="cuTutorSim" data-v="1">🧪 Simular que acepta</button><button class="btn w full" data-act="cuTutorSim" data-v="0">🧪 Simular que no acepta</button>' : ''}`
          : p.parentalStatus === 'approved' ? '<p>✅ Tu familia ha dado permiso. Ya puedes comprar.</p>'
          : `<p>Como tienes menos de 13 años, para comprar necesitas que tu madre, padre o tutor dé permiso. Escribe su email y le mandamos un mensaje${sim ? ' (simulado: no se envía nada)' : ''}.</p>
            ${p.parentalStatus === 'rejected' ? '<p class="small">La última vez no dio permiso. Puedes volver a pedirlo.</p>' : ''}<input id="cuTutor" class="inp" type="email" placeholder="email de tu madre, padre o tutor" aria-label="Email de tu madre, padre o tutor"><button class="btn full" data-act="cuTutorPedir">Pedir permiso</button>`}
          ${err}<button class="btn w full" data-act="cuSeguir">${p.parentalStatus === 'approved' ? 'Seguir' : 'Ahora no, seguir jugando'}</button>`; break;
      }
      case 'listo':
        h = `<div class="copaGrande">✅</div><h2>¡Cuenta lista!</h2><ul class="ventajas"><li>🛡️ Tus compras quedan en tu cuenta</li><li>☁️ Tus carreras se pueden copiar en la nube</li><li>📱 Entra en otro dispositivo con ${esc(METODO_TXT[a.method] || 'tu cuenta')}</li></ul>
          ${hayCarreras() ? '<button class="btn g full" data-act="cuSubirYa">☁️ Copiar ya mis carreras en la cuenta</button>' : ''}${ui.nubeMsg ? `<p class="small nubeMsg">${esc(ui.nubeMsg)}</p>` : ''}${err}
          <button class="btn full" data-act="cuFin">${cu.origen === 'compra' ? 'Volver a la compra' : 'Seguir jugando'}</button>`; break;
      case 'nube': {
        const B = cu.blob || { ranuras: [] };
        h = `<h2>☁️ Tus carreras en la cuenta</h2>${B.ranuras.length ? `<div class="pmLista">${B.ranuras.map(r => { let s = null; try { s = JSON.parse(r.data); } catch (_) { s = null; }
          return `<div class="lin"><span class="ic">🗂️</span><span><b>${esc(r.titulo || (s ? `Carrera de ${s.nombre}` : `Carrera ${r.i + 1}`))}</b><br><span class="small">${s ? `Semana ${s.semana}` : ''}${r.guardadoEn ? ` · ${esc(haceTxt(r.guardadoEn))}` : ''}</span></span></div>`; }).join('')}</div>
          <button class="btn g full" data-act="cuTraer">⬇️ Traer a este dispositivo</button><p class="small">Si aquí tienes una versión más reciente de la misma carrera, no se toca.</p>` : '<p>No hay carreras guardadas en tu cuenta.</p>'}
          ${ui.nubeMsg ? `<p class="small nubeMsg">${esc(ui.nubeMsg)}</p>` : ''}${err}<button class="btn w full" data-act="cuFin">Seguir</button>`; break;
      }
      case 'legal':
        h = `<h2>${cu.doc === 'privacidad' ? '🔏 Privacidad' : '📄 Términos'}</h2><div class="legal">${LEGAL[cu.doc] || ''}</div><p class="small">Resumen. Borrador pendiente de revisión legal (versión ${esc(P2C.TERMS_VERSION)}).</p><button class="btn full" data-act="cuAtras">Volver</button>`; break;
      case 'datos':
        h = `<h2>📦 Tus datos</h2><p class="small">Todo lo que guardamos de tu cuenta: perfil, compras, lo que tienes desbloqueado y tus carreras.</p>
          ${cu.datos ? `<a class="btn full" download="mis-datos-del-barrio.json" href="${esc(cu.datosUrl || '#')}">⬇️ Descargar (JSON)</a><button class="btn w full" data-act="cuCopiarDatos">📋 Copiar</button>${cu.copiado ? '<p class="pmOk">Copiado.</p>' : ''}<textarea id="cuDatosTxt" readonly rows="8" aria-label="Tus datos">${esc(cu.datos.slice(0, 3000))}${cu.datos.length > 3000 ? '\n…' : ''}</textarea>` : err ? '' : '<div class="pmSpin" aria-hidden="true"></div>'}
          ${err}<button class="btn w full" data-act="cuCerrar">Cerrar</button>`; break;
      case 'borrar':
        h = `<h2>⚠️ Eliminar tu cuenta</h2><p>Se borran tu perfil, tus carreras de la nube y el acceso a tus compras. <b>No se puede deshacer.</b></p>
          <p class="small">Las carreras de este dispositivo se quedan aquí. Los registros contables de las compras se conservan anonimizados porque la ley lo exige.</p>
          <label class="campo">Escribe ELIMINAR para confirmar<input id="cuConfirma" class="inp" autocomplete="off" autocapitalize="characters"></label>${err}
          <button class="btn r full" data-act="cuBorrarOk">Eliminar mi cuenta</button><button class="btn w full" data-act="cuCerrar">Cancelar</button>`; break;
    }
    return `<div class="overlay" role="dialog" aria-label="Cuenta"><div class="modal cuenta ${cu.busy ? 'ocupado' : ''}">${h}</div></div>`;
  }
  function cuAbrir(modo, origen) { comercio(); ui.cu = { paso: 'inicio', modo, origen: origen || null }; if (COM) COM.track('account_prompt', { source: origen || 'menu' }); render(); }
  async function cuAsync(fn) {
    if (ui.cu) Object.assign(ui.cu, { busy: true, error: null }); render();
    try { await fn(); } catch (e) { if (ui.cu) ui.cu.error = e.code || e.message; }
    if (ui.cu) ui.cu.busy = false;
    limpiarLook(S); if (S && P2.ranuraActiva() < P2.ranurasMax()) P2.guardar(S); render();
  }
  function cuTerminar() { const o = ui.cu && ui.cu.origen; ui.cu = null; ui.nubeMsg = ''; if (o === 'compra' && ui.pm && ui.pm.sku) Object.assign(ui.pm, { paso: null, error: null }); }
  function cuLeerPerfil() {
    const cu = ui.cu; if (!cu) return;
    if ($('cuNombre')) cu.nombre = $('cuNombre').value; if ($('cuPais')) cu.pais = $('cuPais').value;
    if ($('cuTerminos')) cu.terminos = $('cuTerminos').checked; if ($('cuNovedades')) cu.novedades = $('cuNovedades').checked;
  }
  async function cuDespuesPerfil() {
    const cu = ui.cu; if (!cu) return;
    if (cu.modo === 'entrar') { const B = await COM.getSaves().catch(() => null); if (B && B.ranuras.length) { cu.blob = B; cu.paso = 'nube'; return; } }
    if (cu.nuevo) { cu.paso = 'listo'; return; }
    cuTerminar();
  }
  async function cuTrasEntrar(nuevo) {
    const cu = ui.cu; if (!cu) return;
    cu.nuevo = !!nuevo; cu.error = null; cu.aviso = null;
    const p = await COM.loadProfile().catch(() => COM.profile());
    if (nuevo || !p || p.needsProfile) { cu.paso = 'perfil'; return; }
    await cuDespuesPerfil();
  }
  function cuAlias() { return `${Math.random().toString(36).slice(2, 10)}@privaterelay.appleid.test`; }
  const CU_CAPA = /^cu(CopiarDatos|Modo|Metodo|SistemaOk|PedirCodigo|Reenviar|Verificar|Atras|Edad|Terminos|Novedades|GuardarPerfil|TutorPedir|TutorSim|Seguir|SubirYa|Traer|BorrarOk)$/;
  function cuAccion(a, b) {
    const cu = ui.cu;
    if (CU_CAPA.test(a) && !cu) return true;
    switch (a) {
      case 'cuCrear': cuAbrir('crear', b.dataset.v); return true;
      case 'cuEntrar': cuAbrir('entrar', b.dataset.v); return true;
      case 'cuModo': Object.assign(cu, { modo: b.dataset.v, error: null, aviso: null }); render(); return true;
      case 'cuMetodo': {
        const m = b.dataset.v; Object.assign(cu, { metodo: m, error: null });
        if (m === 'email') { cu.paso = 'email'; render(); return true; }
        if (SIM()) { cu.paso = 'sistema'; cu.email = cu.email || `${String((S && S.nombre) || 'jugador').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '') || 'jugador'}@${m === 'apple' ? 'icloud' : 'gmail'}.test`; render(); return true; }
        cuAsync(async () => { const r = await COM.createAccount({ method: m }); if (r && r.pending) cu.aviso = 'Te llevamos a iniciar sesión…'; });
        return true;
      }
      case 'cuSistemaOk': {
        const em = (($('cuEmail') || {}).value || '').trim(), oc = document.querySelector('input[name="cuOcultar"]:checked');
        cu.email = em; cu.ocultar = !!(oc && oc.value === 'si');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { cu.error = 'invalid_email'; render(); return true; }
        cuAsync(async () => {
          if (cu.modo === 'entrar') { await COM.signIn({ email: em }); await cuTrasEntrar(false); }
          else { await COM.createAccount({ method: cu.metodo, email: cu.ocultar ? cuAlias() : em }); await cuTrasEntrar(true); }
        });
        return true;
      }
      case 'cuPedirCodigo': case 'cuReenviar': {
        const em = a === 'cuReenviar' ? cu.email : (($('cuEmail') || {}).value || '').trim();
        if (!em) { cu.error = 'email_required'; render(); return true; }
        cuAsync(async () => { const r = await COM.requestCode({ email: em, intent: cu.modo === 'entrar' ? 'signin' : 'signup' }); Object.assign(cu, { email: em, testCode: r.testCode || null, paso: 'codigo', intentos: 0, aviso: a === 'cuReenviar' ? 'Te hemos mandado un código nuevo.' : null }); });
        return true;
      }
      case 'cuVerificar': {
        const code = (($('cuCodigo') || {}).value || '').replace(/\D/g, '');
        cuAsync(async () => {
          try { const r = await COM.verifyCode({ email: cu.email, code, intent: cu.modo === 'entrar' ? 'signin' : 'signup' }); await cuTrasEntrar(r.isNew); }
          catch (e) { if (e.code === 'invalid_code') cu.intentos = (cu.intentos || 0) + 1; throw e; }
        });
        return true;
      }
      case 'cuAtras': cu.error = null; cu.aviso = null; cu.paso = cu.paso === 'legal' ? (cu.prev || 'perfil') : cu.paso === 'codigo' ? 'email' : 'inicio'; if (cu.paso === 'inicio' && cu.solo) { ui.cu = null; } render(); return true;
      case 'cuEdad': cuLeerPerfil(); cu.edad = b.dataset.v; cu.error = null; render(); return true;
      case 'cuTerminos': case 'cuNovedades': cuLeerPerfil(); return true;
      case 'cuLegal': if (cu) { cuLeerPerfil(); cu.prev = cu.paso; cu.doc = b.dataset.v; cu.paso = 'legal'; } else ui.cu = { paso: 'legal', doc: b.dataset.v, solo: true, prev: 'inicio' }; render(); return true;
      case 'cuGuardarPerfil': {
        cuLeerPerfil();
        const p = COM.profile() || {}, fijo = !!p.ageBand, terms = p.termsVersion !== P2C.TERMS_VERSION;
        if (!fijo && !cu.edad) { cu.error = 'invalid_age'; render(); return true; }
        if (terms && !cu.terminos) { cu.error = 'terms_required'; render(); return true; }
        const patch = { displayName: cu.nombre, country: cu.pais };
        if (!fijo) patch.ageBand = cu.edad;
        if (terms) patch.acceptTerms = P2C.TERMS_VERSION;
        if ((cu.edad || p.ageBand) === '18p' && cu.novedades != null) patch.marketingOptIn = !!cu.novedades;
        cuAsync(async () => {
          const np = await COM.updateProfile(patch);
          if (cu.editar) { ui.cu = null; ui.flash = '✅ Perfil guardado.'; return; }
          if (np.ageBand === 'u13' && np.parentalStatus !== 'approved') { cu.paso = 'tutor'; return; }
          await cuDespuesPerfil();
        });
        return true;
      }
      case 'cuTutorAbrir': ui.cu = { paso: 'tutor', origen: 'cuenta' }; render(); return true;
      case 'cuTutorPedir': { const em = (($('cuTutor') || {}).value || '').trim(); cuAsync(async () => { await COM.updateProfile({ parentEmail: em }); }); return true; }
      case 'cuTutorSim': cuAsync(async () => { await COM.backend.approveParent(COM.account().token, b.dataset.v === '1'); await COM.loadProfile(); }); return true;
      case 'cuSeguir': if (cu.origen === 'cuenta' || cu.editar) { ui.cu = null; render(); } else cuAsync(cuDespuesPerfil); return true;
      case 'cuSubirYa': cuAsync(async () => { const r = await nubeSubir(); ui.nubeMsg = `☁️ ${r.guardadas.length === 1 ? 'Copiada 1 carrera' : `Copiadas ${r.guardadas.length} carreras`} en tu cuenta.`; }); return true;
      case 'cuTraer': cuAsync(async () => { const r = await nubeTraer(false); ui.nubeMsg = nubeResumen(r); }); return true;
      case 'cuFin': case 'cuCerrar': cuTerminar(); render(); return true;
      case 'cuenta': if (S) P2.guardar(S); ui.mundo = false; ui.pant = 'cuenta'; if (conCuenta()) COM.loadProfile().then(() => render()).catch(() => {}); render(); window.scrollTo(0, 0); return true;
      case 'cuVolver': ui.pant = S ? null : 'carreras'; if (!S && !hayCarreras()) ui.pant = null; render(); return true;
      case 'cuEditar': ui.cu = { paso: 'perfil', editar: !(COM.profile() || {}).needsProfile, origen: 'cuenta', modo: 'crear' }; render(); return true;
      case 'cuCompras': ui.pant = null; ui.pm = { tab: 'comprado' }; if (S) { irA('premium'); pmAsync(async () => { ui.pm.hist = await COM.history(); }); } else { ui.pant = 'cuenta'; render(); } return true;
      case 'cuDatos': ui.cu = { paso: 'datos' }; cuAsync(async () => { const j = JSON.stringify(await COM.exportData(), null, 2); ui.cu.datos = j; try { ui.cu.datosUrl = URL.createObjectURL(new Blob([j], { type: 'application/json' })); } catch (_) { ui.cu.datosUrl = '#'; } }); return true;
      case 'cuCopiarDatos': { const x = $('cuDatosTxt'); const fin = () => { cu.copiado = true; render(); };
        if (navigator.clipboard) navigator.clipboard.writeText(cu.datos).then(fin).catch(() => { if (x) { x.select(); try { document.execCommand('copy'); } catch (_) {} } fin(); });
        else { if (x) { x.select(); try { document.execCommand('copy'); } catch (_) {} } fin(); } return true; }
      case 'cuSalir': if (S) P2.guardar(S); COM.signOut(); limpiarLook(S); ui.flash = '👋 Has cerrado sesión. Tus carreras siguen en este dispositivo.'; comprobarRanura(); if (S) P2.guardar(S); render(); return true;
      case 'cuBorrar': ui.cu = { paso: 'borrar' }; render(); return true;
      case 'cuBorrarOk': {
        if ((($('cuConfirma') || {}).value || '').trim().toUpperCase() !== 'ELIMINAR') { cu.error = 'confirm_required'; render(); return true; }
        cuAsync(async () => { if (S) P2.guardar(S); await COM.deleteAccount(); ui.cu = null; ui.flash = 'Cuenta eliminada. Tus carreras de este dispositivo siguen aquí.'; comprobarRanura(); });
        return true;
      }
      // ---- Nube ----
      case 'nubeSubir': pmAsyncNube(async () => { const r = await nubeSubir(); ui.nubeMsg = `☁️ ${r.guardadas.length === 1 ? 'Copiada 1 carrera' : `Copiadas ${r.guardadas.length} carreras`}${r.conservadas.length ? ` · ${r.conservadas.length} sin tocar (en la nube había una más nueva)` : ''}.`; ui.nubeForzar = false; }); return true;
      case 'nubeTraer': pmAsyncNube(async () => { const r = await nubeTraer(false); ui.nubeMsg = nubeResumen(r); }); return true;
      case 'nubeForzar': pmAsyncNube(async () => { const r = await nubeTraer(true); ui.nubeMsg = nubeResumen(r); ui.nubeForzar = false; }); return true;
      case 'nubeAuto': try { almacen.setItem('dban_nube_auto', b.checked ? '1' : '0'); } catch (_) {} return true;
      // ---- Mis carreras ----
      case 'carreras': if (S) P2.guardar(S); nubeAutoSubir(); ui.mundo = false; ui.pant = 'carreras'; ui.borrarCar = null; render(); window.scrollTo(0, 0); return true;
      case 'guardarSalir': if (S) P2.guardar(S); nubeAutoSubir(); ui.mundo = false; ui.pant = 'carreras'; ui.flash = '💾 Partida guardada. Puedes cerrar el juego: la retomas justo donde la dejaste.'; render(); window.scrollTo(0, 0); return true;
      case 'carVolver': ui.pant = null; render(); return true;
      case 'carSeguir': {
        const i = +b.dataset.i; if (S) P2.guardar(S);
        const s2 = P2.cargar(i); if (!s2) { ui.flash = 'No se pudo abrir esa carrera.'; render(); return true; }
        S = s2; resetUiPartida(); ui.pant = null; ui.deshacer = false; limpiarLook(S); P2.guardar(S); nubeAutoSubir(); render(); window.scrollTo(0, 0); return true;
      }
      case 'carNueva': {
        const i = +b.dataset.i; if (S) P2.guardar(S);
        if (!P2.usarRanura(i)) return true;
        S = null; resetUiPartida(); ui.pant = null; ui.nuevaEn = i; ui.deshacer = false; ui.look = Object.assign({}, P2.LOOK_INICIAL); ui.nombre = 'Alex'; render(); window.scrollTo(0, 0); return true;
      }
      case 'carRen': { ui.ren = +b.dataset.i; render(); const inp = $('carNombre'); if (inp) { inp.focus(); inp.select(); } return true; }
      case 'carRenOk': P2.renombrarPartida(+b.dataset.i, ($('carNombre') || {}).value); ui.ren = null; nubeAutoSubir(); render(); return true;
      case 'carCopiar': { const i = +b.dataset.i, j = P2.primeraLibre(); if (S && i === P2.ranuraActiva()) P2.guardar(S); ui.flash = j >= 0 && P2.copiarPartida(i, j) ? `📄 Copiada en la ranura ${j + 1}: prueba otro camino sin perder el tuyo.` : 'No hay ninguna ranura libre.'; render(); return true; }
      case 'carBorrar': {
        const i = +b.dataset.i; if (ui.borrarCar !== i) { ui.borrarCar = i; render(); return true; }
        ui.borrarCar = null; const act = i === P2.ranuraActiva();
        if (P2.borrarPartida(i)) { ui.deshacer = true; if (act) S = null; }
        render(); return true;
      }
      case 'carDeshacer': { const j = P2.deshacerBorrado(); ui.deshacer = false; ui.flash = j >= 0 ? `↩️ Recuperada en la ranura ${j + 1}.` : 'No hay sitio libre para recuperarla.'; render(); return true; }
      case 'carMas': ui.pm = { tab: 'packs', sku: 'extra_save_slots_3', paso: null, error: null, consent: false }; if (COM) COM.track('product_view', { sku: 'extra_save_slots_3', source: 'carreras' }); render(); return true;
    }
    return false;
  }
  async function pmAsyncNube(fn) { try { await fn(); } catch (e) { ui.nubeMsg = cuErrorTxt(e.code || e.message); } render(); }
  // Pantallas fuera de la partida (Mis carreras, Mi cuenta): sin barra de juego
  function pintarFuera(html) {
    pintarEtapa(S ? etapa(S) : 'barrio');
    $('top').innerHTML = ''; $('nav').innerHTML = '';
    const capa = ui.cu ? htmlCuCapa() : ui.pm && (ui.pm.sku || ui.pm.paso) ? htmlPmCapa(S) : '';
    $('main').innerHTML = (ui.flash ? `<div class="flash quieta">${esc(ui.flash)}</div>` : '') + html + capa;
    ui.flash = '';
    $('main').classList.remove('conBoton'); document.body.classList.remove('enSeccion');
  }
  // Insignias y vitrina (lo que se ve de las compras en el juego)
  // Insignias (junto a tu semana; como mucho 3) y vitrina: datos en 19_packs.js. La de prensa llega por código promocional.
  const insignias = () => P2.INSIGNIAS_PACK.filter(([k]) => P2.premiumOk(k)).concat(P2.tieneEnt('cosmetic.press_badge') ? [['', '📰', 'Prensa']] : []).slice(0, 3)
    .map(([, ic, n]) => `<span class="insignia" title="Insignia ${n}" aria-label="Insignia ${n}">${ic}</span>`).join('');
  const vitrina = () => P2.VITRINA_PACK.filter(([k]) => P2.premiumOk(k)).concat(P2.tieneEnt('cosmetic.press_badge') ? [['', '📰', 'Acreditación de prensa']] : []);
  function equiparPack(sku) { if (S) P2.equiparPack(S, sku); }

  // ---------- Render ----------
  function render() {
    comprobarRanura();
    if (S) { P2.activarDeporte(S.deporte); comprobarDeporte(); }
    if (ui.pant === 'cuenta') return pintarFuera(htmlCuenta());
    if (ui.pant === 'carreras' || (!S && ui.nuevaEn == null && hayCarreras())) return pintarFuera(htmlCarreras());
    if (!S) { pintarEtapa('barrio'); $('top').innerHTML = ''; $('nav').innerHTML = ''; $('main').innerHTML = (ui.flash ? `<div class="flash">${esc(ui.flash)}</div>` : '') + htmlIntro() + (ui.cu ? htmlCuCapa() : ui.pm && (ui.pm.sku || ui.pm.paso) ? htmlPmCapa(null) : ''); ui.flash = ''; $('main').classList.remove('conBoton'); document.body.classList.remove('enSeccion'); return; }
    // Secciones abiertas por algo hecho fuera de la semana (firmar una marca, comprar…): se avisa aquí
    const nuevas = P2.revisarSecciones(S, null);
    if (nuevas.length) { ui.fiestas = (ui.fiestas || []).concat(fiestasDe([], nuevas)); if (!ui.paso) ui.paso = 'fiesta'; P2.guardar(S); }
    if (!P2.seccionesVisibles(S).some(x => x.id === ui.vista)) ui.vista = 'semana';
    // Grandes momentos: se enseñan antes que nada (menos en mitad de un minijuego)
    if (!ui.mj && Array.isArray(S.celebraciones) && S.celebraciones.length) { if (S.celebraciones.some(c => c.tipo === 'coche' || c.tipo === 'casa')) ui.nuevaCompra = null; ui.celes = (ui.celes || []).concat(S.celebraciones); S.celebraciones = []; P2.guardar(S); ui.confeti = true; }
    const cele = ui.celes && ui.celes.length ? ui.celes[0] : null;
    pintarEtapa(etapa(S));
    $('top').innerHTML = htmlTop(S);
    $('nav').innerHTML = '';
    const V = { semana: htmlJuego, liga: htmlLiga, empresa: htmlEmpresa, marcas: htmlMarcas, hitos: htmlHitos, ajustes: htmlAjustes, personaje: htmlPersonaje,
      relaciones: htmlRelaciones, tienda: htmlTienda, patrimonio: htmlPatrimonio, historia: htmlHistoria, inversiones: htmlInversiones, premium: htmlPremium }[ui.vista]
      || (P2.UIX && P2.UIX.vistas[ui.vista] ? s => P2.UIX.vistas[ui.vista](s, HX) : () => '');
    // Anuncio obligatorio simulado: solo en transiciones grandes, nunca durante una decisión ni tras comprar
    if (ui.vista === 'semana' && !ui.inter && !ui.nuevaCompra && !ui.mundo && !ui.mj && !ui.paso && !cele && !ui.cu && !(ui.pm && (ui.pm.sku || ui.pm.paso)) && P2.intersticialAhora(S)) { ui.inter = true; P2.intersticialMostrado(S); P2.guardar(S); }
    const capa = ui.cu ? htmlCuCapa() : ui.pm && (ui.pm.sku || ui.pm.paso) ? htmlPmCapa(S) : ui.rw ? htmlRw(S) : ui.iap ? htmlIapModal(S) : ui.nuevaCompra ? htmlNuevaCompra() : ui.inter ? htmlInter(S) : P2.monEstado(S).deseoAviso && !ui.nuevaCompra ? htmlDeseoAviso(S) : '';
    const mundo = ui.mundo ? htmlMundo(S) : '';
    $('main').innerHTML = cele ? htmlCele(S, cele) : (ui.flash ? `<div class="flash">${esc(ui.flash)}</div>` : '') + V(S) + capa + mundo;
    ui.flash = '';
    $('main').classList.remove('conBoton');
    document.body.classList.toggle('enSeccion', ui.vista !== 'semana');
    contar();
    if (ui.mj && (ui.mj.fase === 'barra' || ui.mj.fase === 'toques') && ui.vista === 'semana') animarMinijuego(); else cancelAnimationFrame(mjAnim);
    if (!ui.mj || !['pase', 'mver', 'portero'].includes(ui.mj.fase)) clearTimeout(mjTimer);
    if (ui.confeti) { ui.confeti = false; confeti(); }
    traducir();
  }
  // Cada deporte habla a su manera: «partido» → «competición», «el míster» → «tu entrenadora»… (solo el texto visible)
  function traducir() {
    if (!S || !S.deporte || S.deporte === 'futbol') return;
    for (const raiz of [$('main'), $('top')]) {
      if (!raiz) continue;
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const v = P2.tx(S, n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    }
  }
  // Una carrera de un deporte que esta cuenta ya no tiene (reembolso, otra cuenta): se guarda y se bloquea
  function comprobarDeporte() {
    if (S && !P2.deporteDisponible(S.deporte)) { const D = P2.deporteDe(S); P2.guardar(S); S = null; resetUiPartida(); ui.pant = 'carreras'; ui.flash = `🔒 Esa carrera es de ${D.n} y esta cuenta no tiene ${D.n}. Está guardada y a salvo.`; }
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
    if (a !== 'carBorrar') ui.borrarCar = null;
    if (cuAccion(a, b)) return;
    if (P2.UIX && P2.UIX.acciones[a]) { P2.UIX.acciones[a](S, b, HX); return; }
    switch (a) {
      case 'deporte': { const X = P2.DEPORTES[b.dataset.v]; if (!X) break; if ($('nombre')) ui.nombre = $('nombre').value;
        if (!P2.deporteDisponible(X.id)) { ui.pm = { tab: 'deportes', sku: SKU_DEPORTE[X.entitlement], paso: null, error: null, consent: false }; comercio() && COM.track('product_view', { sku: ui.pm.sku, source: 'intro' }); render(); break; }
        ui.deporte = X.id; ui.esp = null; render(); break; }
      case 'especialidad': if ($('nombre')) ui.nombre = $('nombre').value; ui.esp = b.dataset.v; render(); break;
      case 'empezar': { const n = ($('nombre').value || '').trim().slice(0, 20) || 'Alex'; const dep = ui.deporte && P2.deporteDisponible(ui.deporte) ? ui.deporte : 'futbol';
        S = P2.nuevaPartida({ nombre: n, look: ui.look, deporte: dep, especialidad: ui.esp }); ui.vista = 'semana'; ui.nuevaEn = null; guardarYPintar(); nubeAutoSubir(); window.scrollTo(0, 0); break; }
      case 'capa': if ($('nombre')) ui.nombre = $('nombre').value; ui.capa = b.dataset.v; render(); break;
      case 'grupoLook': if ($('nombre')) ui.nombre = $('nombre').value; ui.capa = (P2.CAPAS_LOOK.find(c => c[4] === b.dataset.v) || P2.CAPAS_LOOK[0])[0]; render(); break;
      case 'look': if ($('nombre')) ui.nombre = $('nombre').value;
        if (S) { if (P2.ponerLook(S, b.dataset.c, b.dataset.v)) guardarYPintar(); }
        else { const it = P2.itemLook(b.dataset.c, b.dataset.v); if (it && !it.req) { ui.look = Object.assign({}, ui.look, { [b.dataset.c]: b.dataset.v }); render(); } }
        break;
      case 'lookAzar': if ($('nombre')) ui.nombre = $('nombre').value; if (S) { S.look = P2.validarLook(P2.lookAzar()); guardarYPintar(); } else { ui.look = P2.validarLook(P2.lookAzar()); render(); } break;
      case 'elegir': S.eleccion = id; guardarYPintar(); break;
      // Un toque juega la semana
      case 'jugarYa': { if (P2.bloqueoAccion(S, id)) break;
        const t = P2.minijuegoSemana(S, id);
        if (t) { ui.mj = { tipo: t, juego: P2.juegoMinijuego(S, t), accion: id, fase: 'intro', res: [], reintentos: 0, enJuego: P2.enJuego(S, t) }; render(); window.scrollTo(0, 0); break; }
        jugarConfirmado(id); break; }
      case 'mjEmpezar': empezarJuego(ui.mj); render(); break;
      case 'mjToque': { cancelAnimationFrame(mjAnim); const J = ui.mj, pos = ui.mjPos == null ? 0 : ui.mjPos, x = clamp((pos - 60) / 24, 0, 1);
        J.res.push(x); J.msg = x >= 0.7 ? '¡Toque perfecto!' : x > 0 ? 'Justo…' : '¡Se te cae!';
        if (J.res.length >= juegoDe(J).rondas) terminarMinijuego(); render(); break; }
      case 'mjPase': { const J = ui.mj; if (J.fase !== 'pase') break; clearTimeout(mjTimer); const v = +b.dataset.v;
        if (J.libre == null) { J.res.push(0); J.msg = '¡Demasiado pronto! Lo cortan.'; }
        else if (v !== J.libre) { J.res.push(0); J.msg = 'Ese estaba marcado…'; }
        else { const ventana = [1000, 850, 700][J.res.length] || 700, x = clamp(1 - 0.4 * (performance.now() - J.t0) / ventana, 0.6, 1); J.res.push(x); J.msg = x >= 0.8 ? '¡Pase perfecto!' : '¡Buen pase!'; }
        J.libre = null; siguienteRonda(J, programarPase); break; }
      case 'mjFlecha': { const J = ui.mj; if (J.fase !== 'mrep') break; const v = +b.dataset.v;
        if (v !== J.sec[J.entrada.length]) { J.p = J.entrada.length / J.sec.length; J.fallo = true; terminarMinijuego(); render(); break; }
        J.entrada.push(v); if (J.entrada.length >= J.sec.length) { J.p = 1; terminarMinijuego(); } render(); break; }
      case 'mjParada': { const J = ui.mj; if (J.fase !== 'portero') break; clearTimeout(mjTimer); const v = b.dataset.v;
        if (J.balon == null) { J.res.push(0); J.msg = '¡Te tiras antes de tiempo!'; }
        else if (v !== J.balon) { J.res.push(0); J.msg = 'Al otro lado… ¡gol!'; }
        else { const ventana = [700, 560, 440][J.res.length] || 440, x = clamp(1 - 0.5 * (performance.now() - J.t0) / ventana, 0.5, 1); J.res.push(x); J.msg = x >= 0.8 ? '¡PARADÓN!' : '¡La sacas!'; }
        J.balon = null; siguienteRonda(J, programarTiro); break; }
      case 'mjEsquina': ui.mj.esquina = b.dataset.v; ui.mj.fase = 'barra'; render(); break;
      case 'mjParar': { cancelAnimationFrame(mjAnim); const J = ui.mj, pos = ui.mjPos == null ? 50 : ui.mjPos, z = Math.max(10, 22 - J.res.length * 5);
        J.res.push(clamp(1 - Math.max(0, Math.abs(pos - 50) - z / 4) / 40, 0, 1));
        if (J.res.length >= juegoDe(J).rondas) terminarMinijuego();
        render(); break; }
      case 'mjSimular': { clearTimeout(mjTimer); const J = ui.mj, ok = Math.random() < P2.probSimular(S); J.p = ok ? P2.P_SIM.acierto : P2.P_SIM.fallo; J.parada = !ok; J.simulado = true; J.fase = 'fin'; render(); break; }
      case 'mjReintentar': if (P2.usarVida(S)) { ui.mj.reintentos++; ui.mj.fallo = false; empezarJuego(ui.mj); guardarYPintar(); } break;
      case 'mjFin': { clearTimeout(mjTimer); const J = ui.mj; ui.mj = null; P2.teleMon(S, 'minijuego', { tipo: J.tipo, p: Math.round(J.p * 100) / 100, reintentos: J.reintentos, simulado: !!J.simulado }); jugarConfirmado(J.accion, { minijuego: { tipo: J.tipo, p: J.p } }); break; }
      case 'celeOk': ui.celes.shift(); if (ui.celes.length) ui.confeti = true; render(); window.scrollTo(0, 0); break;
      case 'seguir': if (ui.paso === 'fiesta') ui.fiestas.shift();
        if (ui.fiestas && ui.fiestas.length) { ui.paso = 'fiesta'; ui.confeti = true; } else { ui.paso = null; ui.res = null; ui.dec = null; }
        render(); window.scrollTo(0, 0); break;
      case 'verNuevo': ui.fiestas = []; ui.paso = null; irA(b.dataset.v); break;
      case 'masOps': ui.masOps = !ui.masOps; render(); break;
      case 'mundo': ui.mundo = true; render(); break;
      case 'cerrarMundo': if (e.target !== b && b.classList.contains('velo')) break; ui.mundo = false; render(); break;
      case 'jugar': { const a = eleccion(S); if (a && P2.jugarSemana(S, a)) { ui.desbloqueos = []; guardarYPintar(); if (S.semana % 4 === 0) nubeAutoSubir(); window.scrollTo(0, 0); } break; }
      case 'desdeP1': { const v = P2.partidaP1(); S = (v && P2.migrateSave(v)) || P2.nuevaPartida({}); ui.vista = 'semana'; ui.nuevaEn = null; guardarYPintar(); break; }
      case 'vista': ui.nuevaCompra = null; ui.mundo = false; irA(b.dataset.v); break;
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
          ui.flash = r.tipo === 'cupon' ? `🏷️ Cupón listo: ${P2.producto(r.id).n} por ${eur(r.precio)}` : r.tipo === 'oferta' ? `🎁 Oferta: ${P2.producto(r.id).n} por ${eur(r.precio)} (antes ${eur(r.original)})` : r.tipo === 'energia' ? `⚡ +${r.ganado} de energía` : r.tipo === 'vida' ? `❤️ +1 vida (${r.vidas}/${P2.VIDAS.max})` : '🕶️ Gafas edición temporada desbloqueadas'; }
        guardarYPintar(); break; }
      case 'premioVisto': { const tp = P2.monEstado(S).temporadaPremio; if (tp) tp.visto = true; guardarYPintar(); break; }
      // Compras con dinero real: SOLO prueba de intención. Nunca hay checkout ni cargo
      case 'iap': if (P2.iapClic(S, id)) { ui.pm = Object.assign(ui.pm || { tab: 'destacados' }, { sku: OLD_IAP[id] || id, paso: null, error: null, consent: false }); ui.inter = false; comercio() && COM.track('product_view', { sku: ui.pm.sku, source: 'oferta' }); guardarYPintar(); } break;
      // ---- Premium ----
      case 'pmTab': ui.pm = Object.assign(ui.pm || {}, { tab: b.dataset.v }); if (b.dataset.v === 'comprado' && !COM.isGuest()) pmAsync(async () => { ui.pm.hist = await COM.history(); }); else render(); break;
      case 'pmVer': { const P = P2C.getProduct(id); ui.pm = Object.assign(ui.pm || { tab: 'destacados' }, { sku: id, paso: null, error: null, consent: false });
        COM.track(P && P.type === 'BUNDLE' ? 'bundle_view' : P && P.type === 'PRESTIGE_CAREER' ? 'prestige_view' : P && P.type === 'SYSTEM_EXPANSION' ? 'expansion_view' : 'product_view', { sku: id }); render(); break; }
      case 'pmConsent': ui.pm.consent = !!b.checked; ui.pm.error = null; render(); break;
      case 'pmCerrar': ui.pm = { tab: (ui.pm && ui.pm.tab) || 'destacados', hist: ui.pm && ui.pm.hist }; COM.track('checkout_cancelled', {}); render(); break;
      case 'pmCuenta': cuAbrir('crear', ui.pm && ui.pm.sku ? 'compra' : 'premium'); break;
      case 'pmEntrar': cuAbrir('entrar', ui.pm && ui.pm.sku ? 'compra' : 'premium'); break;
      case 'pmComprar': { const sku = ui.pm.sku;
        if (COM.isGuest()) { cuAbrir('crear', 'compra'); COM.track('account_prompt', { sku }); break; }
        pmAsync(async () => {
          // Antes de pagar: perfil completo (edad y términos) y, si es menor de 13, permiso de su familia
          const p = COM.profile() || await COM.loadProfile().catch(() => null);
          if (p && p.needsProfile) { ui.cu = { paso: 'perfil', origen: 'compra', modo: 'crear' }; return; }
          if (p && !p.canPurchase) { ui.cu = { paso: 'tutor', origen: 'compra' }; return; }
          const r = await COM.purchase(sku, { consentWithdrawal: !!ui.pm.consent }); Object.assign(ui.pm, { paso: SIM() ? 'checkout' : 'redirigiendo', orderId: r.orderId, orderRef: r.orderRef, error: null });
        }); break; }
      case 'pmPagar': { const out = b.dataset.v, orderId = ui.pm.orderId, sku = ui.pm.sku;
        ui.pm.paso = 'verificando'; render();
        pmAsync(async () => {
          await COM.backend.completeCheckout(orderId, out);
          const o = await COM.waitForOrder(orderId, { tries: 30, intervalMs: 300 });
          if (o.status === 'FULFILLED') { const P = P2C.getProduct(sku); equiparPack(sku); ui.pm = { tab: 'comprado' };
            if (S && !ui.pant) { ui.celes = (ui.celes || []).concat({ tipo: 'premium', sku, n: P.name, ic: (P.assets && P.assets.ic) || '💎', includes: P.includes }); ui.confeti = true; } else { ui.pm = null; ui.flash = `💎 ¡${P.name} desbloqueado!`; const dx = Object.values(P2.DEPORTES).find(X => X.entitlement && P.entitlements.includes(X.entitlement)); if (dx && !S) { ui.deporte = dx.id; ui.esp = null; } return; }
            ui.pm.hist = await COM.history(); }
          else ui.pm.paso = o.status === 'SLOW' ? 'lento' : 'error';
        }); break; }
      case 'pmRestaurar': pmAsync(async () => { await COM.restore(); ui.pm.hist = await COM.history(); ui.flash = '✅ Compras restauradas desde tu cuenta.'; }); break;
      case 'pmSync': pmAsync(async () => { await COM.sync(); ui.pm.hist = await COM.history(); if (ui.pm.paso === 'lento') ui.pm.paso = null; ui.flash = '🔄 Compras sincronizadas.'; }); break;
      case 'pmPromo': { const code = ($('pmPromo') || {}).value || ''; pmAsync(async () => { const r = await COM.redeem(code); ui.pm.promoMsg = `🎁 Canjeado: ${r.granted.map(nombreEnt).join(', ')}`; ui.pm.hist = await COM.history(); }).then(() => { if (ui.pm.error) { ui.pm.promoMsg = pmErrorTxt(ui.pm.error); ui.pm.error = null; render(); } }); break; }
      case 'pmSalir': if (S) P2.guardar(S); COM.signOut(); ui.pm = { tab: 'comprado' }; limpiarLook(S); comprobarRanura(); if (S) P2.guardar(S); render(); break;
      case 'iapResp': if (P2.iapIntencion(S, ui.iap, b.dataset.v)) { ui.iapResp = b.dataset.v; if (ui.iapCard === ui.iap) ui.iapCard = null; guardarYPintar(); } break;
      case 'iapCerrar': ui.iap = null; ui.iapResp = null; render(); break;
      case 'iapNo': ui.iapCard = null; render(); break;
      case 'interOk': P2.intersticialContinuar(S); ui.inter = false; guardarYPintar(); break;
      case 'equipar': if (P2.equipar(S, id)) guardarYPintar(); break;
      // Aspecto de vehículo y decoración: si está bloqueado, se abre la ficha del pack (sin comprar nada)
      case 'skin': case 'deco': {
        if (b.dataset.sku) { ui.pm = Object.assign(ui.pm || { tab: 'packs' }, { sku: b.dataset.sku, paso: null, error: null, consent: false }); comercio() && COM.track('product_view', { sku: b.dataset.sku, source: a }); render(); break; }
        if (a === 'skin' ? P2.ponerSkin(S, id, b.dataset.v) : P2.ponerDeco(S, b.dataset.t, b.dataset.v)) guardarYPintar(); break; }
      case 'venderP': if (ui.venderP !== id) { ui.venderP = id; render(); } else { ui.venderP = null; P2.venderPosesion(S, id); guardarYPintar(); } break;
      case 'accion': if (P2.jugarSemana(S, id)) { guardarYPintar(); window.scrollTo(0, 0); } break;
      case 'decidir': { const r = P2.resolverDecision(S, id); if (r) { ui.fiestas = fiestasDe(r.hitos, (r.desbloqueos || []).concat(ui.desbloqueos || [])); ui.desbloqueos = [];
        if (r.ir) { ui.fiestas = []; irA(r.ir); } else { ui.dec = r; ui.paso = 'decidido'; guardarYPintar(); window.scrollTo(0, 0); } } break; }
      case 'comprar': { const R = { lineas: [], hitos: [] }, tipo = b.dataset.t && NEGOCIOS[b.dataset.t] ? b.dataset.t : 'peluqueria', T = NEGOCIOS[tipo];
        if (P2.comprarNegocio(S, tipo, Number(id), R)) { S.ultimaDecision = { semana: S.semana, ic: T.ic, titulo: `Compras: ${T.n.toLowerCase()}`, texto: 'Ya eres empresario/a. Ajusta precios y personal y vigila la caja.', lineas: [], hitos: R.hitos }; guardarYPintar(); } break; }
      case 'config': if (P2.configurar(S, neg, b.dataset.c, b.dataset.v)) guardarYPintar(); break;
      case 'empleados': { const n = S.negocios.find(x => x.id === neg); if (n && P2.configurar(S, neg, 'empleados', n.empleados + Number(b.dataset.v))) guardarYPintar(); break; }
      case 'aportar': case 'retirar': { const x = Number(($(`imp_${neg}`) || {}).value) || 0; if ((a === 'aportar' ? P2.aportar : P2.retirar)(S, neg, x)) guardarYPintar(); break; }
      case 'prestamo': if (P2.pedirPrestamo(S, neg)) guardarYPintar(); break;
      case 'vender': if (ui.vender !== neg) { ui.vender = neg; render(); } else { ui.vender = null; P2.venderNegocio(S, neg, 1); guardarYPintar(); } break;
      case 'marca': { const R = { lineas: [], hitos: [] }; if (P2.firmarMarca(S, id, R)) { const M = MARCAS.find(m => m.id === id); S.ultimaDecision = { semana: S.semana, ic: M.ic, titulo: `Firmas con ${M.n}`, texto: M.obligacion + '.', lineas: [], hitos: R.hitos }; guardarYPintar(); } break; }
      case 'oportunidad': if (P2.elegirOportunidad(S, id)) { ui.vista = 'semana'; guardarYPintar(); } break;
      case 'importar': { try { const v = P2.migrateSave(JSON.parse(decodeURIComponent(escape(atob(($('importar').value || '').trim()))))); if (!v) throw 0; S = v; ui.msg = ''; ui.vista = 'semana'; guardarYPintar(); } catch (_) { ui.msg = 'Ese código no es válido.'; render(); } break; }
      case 'reiniciar': if (!ui.reinicio) { ui.reinicio = true; render(); } else { ui.reinicio = false; P2.borrarPartida(P2.ranuraActiva()); S = null; resetUiPartida(); ui.deshacer = true; ui.pant = hayCarreras() ? 'carreras' : null; if (!ui.pant) ui.nuevaEn = P2.ranuraActiva(); render(); window.scrollTo(0, 0); } break;
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
    // Vuelta desde Stripe (build web): «Estamos verificando tu compra…» hasta que el servidor confirme
    try {
      const q = new URLSearchParams(location.search), ord = q.get('order');
      if (comercio() && COM.web && q.get('compra') === 'verificando' && ord) {
        ui.vista = 'premium'; ui.pm = { tab: 'comprado', paso: 'verificando', orderId: ord, orderRef: ord.replace(/-/g, '').slice(0, 10).toUpperCase() };
        history.replaceState(null, '', location.pathname);
        pmAsync(async () => { const o = await COM.waitForOrder(ord, { tries: 40, intervalMs: 1500 });
          if (o.status === 'FULFILLED') { const P = P2C.getProduct(o.sku); equiparPack(o.sku); ui.pm = { tab: 'comprado' }; ui.celes = (ui.celes || []).concat({ tipo: 'premium', sku: o.sku, n: P.name, ic: (P.assets && P.assets.ic) || '💎', includes: P.includes }); ui.confeti = true; ui.pm.hist = await COM.history(); }
          else ui.pm.paso = o.status === 'SLOW' ? 'lento' : 'error'; });
      } else if (q.get('compra') === 'cancelada') { ui.flash = 'Compra cancelada. No se ha cobrado nada.'; history.replaceState(null, '', location.pathname); }
    } catch (_) { /* sin location (tests) */ }
    // Revalida las compras con la cuenta al arrancar (offline: se usa la caché)
    if (comercio() && !COM.isGuest()) COM.sync().then(() => COM.loadProfile().catch(() => null)).then(() => { limpiarLook(S); if (S) P2.guardar(S); render(); }).catch(() => {});
    // Al salir de la app (cambiar de pestaña, bloquear el móvil): se guarda y, con cuenta, copia en la nube
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S) { P2.guardar(S); nubeAutoSubir(); } });
  }

  // Ganchos de depuración (como window.__P1)
  globalThis.__P2 = {
    P2, get S() { return S; }, set S(v) { S = v; }, render, ui, get COM() { return comercio(); },
    nueva: (opc) => { S = P2.nuevaPartida(opc || {}); guardarYPintar(); return S; }, informe: () => P2.informeTest(S),
    ir: v => irA(v), etapa: () => etapa(S), ui2: ui,
    jugar: id => { const r = P2.jugarSemana(S, id || eleccion(S)); guardarYPintar(); return r; }, eleccion: () => eleccion(S),
    decidir: id => { const r = P2.resolverDecision(S, id); guardarYPintar(); return r; },
    guardar: () => P2.guardar(S), cargar: (i) => { S = P2.cargar(i); render(); return S; },
    carreras: () => P2.listarPartidas(), get cu() { return ui.cu; },
    migrateSave: P2.migrateSave, runBalance: (n, m) => P2.runBalance(n || 100, m), informeBalance: (n) => informeTexto(P2.runBalance(n || 100)),
  };
  P2.arrancar = arrancar;
})(globalThis.P2 = globalThis.P2 || {});
