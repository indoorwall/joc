/* =====================================================================
   11 · TU PERSONAJE: avatar dibujado por capas (mismo dibujo que P1)
   Se elige al empezar. Algunas prendas se desbloquean con hitos.
   La cara cambia sola con la energía, las lesiones y cómo te va.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { esc } = P2;

  const PIEL = ['#ffe3c8', '#f6c9a0', '#e2a877', '#c48650', '#8f5b35', '#5e3b22'];
  const COLOR_PELO = { negro: '#22201f', castano: '#6b4226', rubio: '#e8c36a', pelirrojo: '#c4512b', canoso: '#cfcfcf', azul: '#2f7bf5', rosa: '#ff6fb5', verde: '#3ccf6e' };
  const COLOR_ROPA = { rojo: '#e23b3b', azul: '#2f6fe0', verde: '#22a35a', amarillo: '#f6c623', negro: '#2a2d34', blanco: '#f4f4f4', morado: '#7b4bd6', naranja: '#ff8a2a' };
  const FONDO_LOOK = { azul: '#bfe0ff', verde: '#c6f0d2', naranja: '#ffd9b3', morado: '#dccbff', rosa: '#ffd0e6' };
  const LOOK_INICIAL = { piel: '1', pelo: 'corto', colorPelo: 'castano', cara: 'nada', ropa: 'camiseta', colorRopa: 'azul', pantalon: 'chandal', calzado: 'deportivas', cabeza: 'nada', gafas: 'nada', extra: 'nada', fondo: 'azul' };
  const VISTA_LOOK = { busto: '6 -12 88 88', cuerpo: '0 -16 100 176', torso: '8 52 84 64', piernas: '14 92 72 64' };

  // Capas y prendas (datos). req.hito: se desbloquea al conseguir ese hito
  const CAPAS = [['pelo', '💇', 'Pelo', 'busto'], ['colorPelo', '🎨', 'Color de pelo', 'busto'], ['piel', '✋', 'Piel', 'busto'], ['cara', '🧔', 'Cara', 'busto'],
    ['ropa', '👕', 'Ropa', 'torso'], ['colorRopa', '🖌️', 'Color', 'torso'], ['pantalon', '👖', 'Pantalón', 'piernas'], ['calzado', '👟', 'Calzado', 'piernas'],
    ['cabeza', '🧢', 'Cabeza', 'busto'], ['gafas', '🕶️', 'Gafas', 'busto'], ['extra', '🎒', 'Extras', 'cuerpo'], ['fondo', '🖼️', 'Fondo', 'busto']];
  const ITEMS = {
    piel: [0, 1, 2, 3, 4, 5].map(i => ({ id: String(i), n: `Tono ${i + 1}` })),
    pelo: [['corto', 'Corto'], ['largo', 'Largo'], ['coleta', 'Coleta'], ['rizos', 'Rizos'], ['rapado', 'Rapado'], ['calvo', 'Sin pelo'], ['mono', 'Moño'], ['tupe', 'Tupé'], ['trenzas', 'Trenzas'], ['afro', 'Afro'], ['cresta', 'Cresta']].map(([id, n]) => ({ id, n })),
    colorPelo: [['negro', 'Negro'], ['castano', 'Castaño'], ['rubio', 'Rubio'], ['pelirrojo', 'Pelirrojo'], ['canoso', 'Canoso'], ['azul', 'Azul eléctrico'], ['rosa', 'Rosa chicle'], ['verde', 'Verde']].map(([id, n]) => ({ id, n })),
    cara: [['nada', 'Nada'], ['pecas', 'Pecas'], ['pintura', 'Pintura de guerra'], ['bigote', 'Bigote'], ['perilla', 'Perilla'], ['barba', 'Barba']].map(([id, n]) => ({ id, n })),
    ropa: [{ id: 'camiseta', n: 'Camiseta' }, { id: 'tirantes', n: 'Tirantes' }, { id: 'hawaiana', n: 'Hawaiana' }, { id: 'sudadera', n: 'Sudadera' }, { id: 'chaqueta', n: 'Chaqueta' }, { id: 'plumas', n: 'Plumas' },
      { id: 'equipacion', n: 'Camiseta de tu club', req: { hito: 'contrato' } }, { id: 'marca', n: 'Camiseta de tu marca', req: { hito: 'patro' } }, { id: 'traje', n: 'Traje de empresario', req: { hito: 'empresa' } }],
    colorRopa: [['azul', 'Azul'], ['rojo', 'Rojo'], ['verde', 'Verde'], ['amarillo', 'Amarillo'], ['negro', 'Negro'], ['blanco', 'Blanco'], ['morado', 'Morado'], ['naranja', 'Naranja']].map(([id, n]) => ({ id, n })),
    pantalon: [{ id: 'chandal', n: 'Chándal' }, { id: 'corto', n: 'Corto' }, { id: 'vaquero', n: 'Vaqueros' }, { id: 'falda', n: 'Falda' }, { id: 'traje', n: 'De traje', req: { hito: 'empresa' } }],
    calzado: [{ id: 'deportivas', n: 'Deportivas' }, { id: 'chanclas', n: 'Chanclas' }, { id: 'botas', n: 'Botas de fútbol' }, { id: 'montana', n: 'De montaña' }, { id: 'zapatos', n: 'Zapatos' }, { id: 'doradas', n: 'Botas de oro', req: { hito: 'inversion2' } }],
    cabeza: [{ id: 'nada', n: 'Nada' }, { id: 'cinta', n: 'Cinta' }, { id: 'gorra', n: 'Gorra' }, { id: 'gorro', n: 'Gorro de lana' }, { id: 'fiesta', n: 'Gorro de fiesta' }, { id: 'vaquero', n: 'Sombrero' }, { id: 'corona', n: 'Corona', req: { hito: 'inversion2' } }],
    gafas: [['nada', 'Sin gafas'], ['corazon', 'Corazón'], ['redondas', 'Redondas'], ['sol', 'De sol'], ['deportivas', 'Deportivas']].map(([id, n]) => ({ id, n })),
    extra: [{ id: 'nada', n: 'Nada' }, { id: 'balon', n: 'Balón' }, { id: 'mochila', n: 'Mochila' }, { id: 'auriculares', n: 'Auriculares' }, { id: 'capa', n: 'Capa' },
      { id: 'medalla', n: 'Medalla', req: { hito: 'titular' } }, { id: 'reloj', n: 'Reloj de lujo', req: { hito: 'rentable' } }, { id: 'cadena', n: 'Cadena de oro', req: { hito: 'inversion2' } }],
    fondo: [['azul', 'Azul'], ['verde', 'Verde'], ['naranja', 'Naranja'], ['morado', 'Morado'], ['rosa', 'Rosa']].map(([id, n]) => ({ id, n }))
      .concat([{ id: 'noche', n: 'Noche estrellada', req: { hito: 'contrato' } }, { id: 'dorado', n: 'Fondo de oro', req: { hito: 'inversion2' } }]),
  };
  const itemLook = (cap, id) => (ITEMS[cap] || []).find(x => x.id === id);
  function bloqueoLook(s, it, cap) {
    if (!it || !it.req) return null;
    if (s && Array.isArray(s.lookDesbloqueos) && s.lookDesbloqueos.includes(`${cap || ''}:${it.id}`)) return null;   // comprado en la Tienda
    if (it.req.hito && !(s && s.hitos && s.hitos[it.req.hito])) { const H = P2.HITOS.find(h => h.id === it.req.hito); return `Hito: ${H ? H.n : it.req.hito}`; }
    return null;
  }
  function ponerLook(s, cap, id) {
    const it = itemLook(cap, id);
    if (!it || bloqueoLook(s, it, cap)) return false;
    s.look = Object.assign({}, LOOK_INICIAL, s.look || {}, { [cap]: id });
    return true;
  }
  // Un look al azar (solo con lo que no necesita hitos)
  function lookAzar() {
    const L = {};
    for (const [cap] of CAPAS) { const l = ITEMS[cap].filter(it => !it.req); L[cap] = l[Math.floor(Math.random() * l.length)].id; }
    if (Math.random() < 0.6) L.cabeza = 'nada';
    if (Math.random() < 0.6) L.gafas = 'nada';
    if (Math.random() < 0.5) L.extra = 'nada';
    if (Math.random() < 0.5) L.cara = 'nada';
    return L;
  }
  function validarLook(L) {
    const out = Object.assign({}, LOOK_INICIAL);
    if (L && typeof L === 'object') for (const [cap] of CAPAS) if (itemLook(cap, L[cap])) out[cap] = L[cap];
    return out;
  }

  // Ánimo para la cara: sin felicidad en P2, sale de la energía, las lesiones y el último resultado
  function animo(s) {
    if (!s || !s.p) return 70;
    let a = 65;
    const u = s.ultimo && s.ultimo.partido;
    if (u) a += u.resultado === 'victoria' ? 15 : u.resultado === 'derrota' ? -20 : 0;
    if (s.p.lesion > 0) a -= 30;
    if (s.negocios && s.negocios.some(n => n.crisis)) a -= 15;
    return a;
  }

  function oscurecer(hex, f) { const n = parseInt(hex.slice(1), 16), c = k => Math.round(((n >> k) & 255) * f); return `rgb(${c(16)},${c(8)},${c(0)})`; }
  function avatarSVG(s, L, modo) {
    L = Object.assign({}, LOOK_INICIAL, L || (s && s.look) || {});
    modo = modo || 'cuerpo';
    if (['gorra', 'gorro'].includes(L.cabeza) && ['cresta', 'mono', 'tupe', 'afro'].includes(L.pelo)) L.pelo = 'corto';
    const sk = PIEL[+L.piel] || PIEL[1], hc = COLOR_PELO[L.colorPelo] || COLOR_PELO.castano, rc = COLOR_ROPA[L.colorRopa] || COLOR_ROPA.azul, rd = oscurecer(rc, 0.75);
    const fel = animo(s), ene = s && s.p ? s.p.energia : 80;
    const O = s && s.contrato ? P2.OFERTAS[s.contrato.oferta] : null, c1 = O && O.c1 ? O.c1 : '#2e9d4f', c2 = O && O.c2 ? O.c2 : '#ffffff';
    const marca = s && s.patros && s.patros.length ? P2.MARCAS.find(m => m.id === s.patros[0].id) : null;
    let h = '';
    if (modo === 'busto') {
      if (L.fondo === 'noche') h += `<rect x="-20" y="-30" width="140" height="140" fill="#1d2552"/>${[[18, 0], [80, 6], [30, 60], [86, 52], [62, -6], [12, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join('')}`;
      else if (L.fondo === 'dorado') h += `<rect x="-20" y="-30" width="140" height="140" fill="#f5c518"/><circle cx="50" cy="34" r="44" fill="#ffe27a"/>`;
      else h += `<rect x="-20" y="-30" width="140" height="140" fill="${FONDO_LOOK[L.fondo] || FONDO_LOOK.azul}"/>`;
    } else h += `<ellipse cx="50" cy="153" rx="28" ry="4" fill="rgba(0,0,0,.25)"/>`;
    if (L.extra === 'capa') h += `<path d="M31 74 L14 146 L86 146 L69 74Z" fill="#d6283b"/>`;
    if (L.extra === 'mochila') h += `<rect x="30" y="72" width="40" height="34" rx="8" fill="#3b4a6b"/>`;
    if (L.pelo === 'largo') h += `<path d="M23 40 Q23 12 50 12 Q77 12 77 40 L79 84 Q50 92 21 84Z" fill="${hc}"/>`;
    if (L.pelo === 'afro') h += `<circle cx="50" cy="34" r="33" fill="${hc}"/>`;
    if (L.pelo === 'coleta') h += `<path d="M70 24 Q94 28 86 64 Q80 44 68 36Z" fill="${hc}"/>`;
    if (L.pelo === 'trenzas') h += `<path d="M25 46 L21 92 M75 46 L79 92" stroke="${hc}" stroke-width="9" stroke-linecap="round"/><circle cx="21" cy="92" r="3" fill="#e23b3b"/><circle cx="79" cy="92" r="3" fill="#e23b3b"/>`;
    if (L.pelo === 'mono') h += `<circle cx="50" cy="11" r="9" fill="${hc}"/>`;
    const pc = { chandal: '#4a5260', vaquero: '#3d5f9e', traje: '#2b2f3a', corto: rc, falda: rc }[L.pantalon] || '#4a5260';
    if (L.pantalon === 'corto') h += `<rect x="38" y="118" width="9" height="24" rx="4" fill="${sk}"/><rect x="53" y="118" width="9" height="24" rx="4" fill="${sk}"/><rect x="34" y="104" width="32" height="18" rx="4" fill="${pc}"/><line x1="50" y1="110" x2="50" y2="122" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`;
    else if (L.pantalon === 'falda') h += `<rect x="38" y="122" width="9" height="20" rx="4" fill="${sk}"/><rect x="53" y="122" width="9" height="20" rx="4" fill="${sk}"/><path d="M34 104 L66 104 L72 128 L28 128Z" fill="${pc}"/>`;
    else {
      h += `<rect x="36" y="104" width="13" height="38" rx="4" fill="${pc}"/><rect x="51" y="104" width="13" height="38" rx="4" fill="${pc}"/>`;
      if (L.pantalon === 'chandal') h += `<rect x="37" y="108" width="2" height="32" fill="#fff" opacity=".8"/><rect x="61" y="108" width="2" height="32" fill="#fff" opacity=".8"/>`;
      if (L.pantalon === 'vaquero') h += `<path d="M42 108 v30 M58 108 v30" stroke="#f0c040" stroke-width="1" stroke-dasharray="2 2"/>`;
    }
    const zap = (col, extra) => `<rect x="31" y="139" width="19" height="10" rx="5" fill="${col}"/><rect x="50" y="139" width="19" height="10" rx="5" fill="${col}"/>${extra || ''}`;
    if (L.calzado === 'deportivas') h += zap('#ffffff', `<path d="M35 144 h10 M54 144 h10" stroke="${rc}" stroke-width="2.5"/><rect x="31" y="146" width="19" height="3" fill="#ccc"/><rect x="50" y="146" width="19" height="3" fill="#ccc"/>`);
    else if (L.calzado === 'botas') h += zap('#1d1d1f', `<path d="M34 150 v2 M40 150 v2 M46 150 v2 M54 150 v2 M60 150 v2 M66 150 v2" stroke="#999" stroke-width="2"/><path d="M36 143 h8 M55 143 h8" stroke="${c1}" stroke-width="2"/>`);
    else if (L.calzado === 'chanclas') h += `<rect x="38" y="139" width="9" height="8" rx="3" fill="#fff"/><rect x="53" y="139" width="9" height="8" rx="3" fill="#fff"/><rect x="31" y="147" width="19" height="3" rx="1.5" fill="#2f6fe0"/><rect x="50" y="147" width="19" height="3" rx="1.5" fill="#2f6fe0"/>`;
    else if (L.calzado === 'zapatos') h += zap('#5b3a1e', '<path d="M35 142 h6 M55 142 h6" stroke="#fff" stroke-width="1.5" opacity=".5"/>');
    else if (L.calzado === 'montana') h += zap('#7a5230', '<path d="M36 141 l4 3 M40 141 l4 3 M56 141 l4 3 M60 141 l4 3" stroke="#f6c623" stroke-width="1.5"/><rect x="31" y="146" width="19" height="3" fill="#2a2d34"/><rect x="50" y="146" width="19" height="3" fill="#2a2d34"/>');
    else if (L.calzado === 'doradas') h += zap('#f5c518', '<path d="M35 142 h8 M54 142 h8" stroke="#fff" stroke-width="2" opacity=".8"/><rect x="31" y="146" width="19" height="3" fill="#c99a00"/><rect x="50" y="146" width="19" height="3" fill="#c99a00"/>');
    const largas = ['sudadera', 'chaqueta', 'plumas', 'traje'].includes(L.ropa), sinMangas = L.ropa === 'tirantes';
    const tc = L.ropa === 'equipacion' ? c1 : L.ropa === 'traje' ? '#2b2f3a' : L.ropa === 'marca' ? '#ffffff' : rc;
    h += `<rect x="20" y="74" width="11" height="34" rx="5.5" fill="${sk}"/><rect x="69" y="74" width="11" height="34" rx="5.5" fill="${sk}"/>`;
    if (!sinMangas) h += `<rect x="20" y="72" width="11" height="${largas ? 34 : 16}" rx="5.5" fill="${tc}"/><rect x="69" y="72" width="11" height="${largas ? 34 : 16}" rx="5.5" fill="${tc}"/>`;
    h += `<circle cx="25.5" cy="110" r="5.5" fill="${sk}"/><circle cx="74.5" cy="110" r="5.5" fill="${sk}"/>`;
    if (L.extra === 'reloj') h += `<rect x="20" y="100" width="11" height="5" rx="1.5" fill="#f5c518" stroke="#b08a00" stroke-width=".8"/>`;
    h += `<rect x="44" y="58" width="12" height="16" rx="4" fill="${sk}"/>`;
    if (L.ropa === 'sudadera') h += `<path d="M34 72 Q50 56 66 72Z" fill="${rd}"/>`;
    const ancho = L.ropa === 'plumas' ? 3 : 0;
    h += `<path d="M${30 - ancho} 78 Q${30 - ancho} 68 40 68 L60 68 Q${70 + ancho} 68 ${70 + ancho} 78 L${70 + ancho} 110 L${30 - ancho} 110Z" fill="${tc}"/>`;
    if (['camiseta', 'marca', 'equipacion', 'tirantes'].includes(L.ropa)) h += `<path d="M43 68 Q50 ${L.ropa === 'tirantes' ? 80 : 75} 57 68Z" fill="${sk}"/>`;
    if (L.ropa === 'tirantes') h += `<path d="M30 70 h6 M64 70 h6" stroke="${sk}" stroke-width="5"/>`;
    if (L.ropa === 'equipacion') h += `<rect x="38" y="70" width="5" height="40" fill="${c2}" opacity=".9"/><rect x="57" y="70" width="5" height="40" fill="${c2}" opacity=".9"/><text x="50" y="100" text-anchor="middle" font-size="15" font-weight="900" fill="${c2}" stroke="${c1}" stroke-width=".6" font-family="Arial,sans-serif">10</text>`;
    if (L.ropa === 'marca') { const t = marca ? marca.n.split(' ')[0].toUpperCase() : '★'; h += `<text x="50" y="94" text-anchor="middle" font-size="${t.length > 9 ? 5.5 : t.length > 6 ? 7 : 9}" font-weight="900" fill="${rc === '#f4f4f4' ? '#e23b3b' : rc}" font-family="Arial,sans-serif">${esc(t)}</text>`; }
    if (L.ropa === 'sudadera') h += `<rect x="40" y="94" width="20" height="10" rx="3" fill="${rd}"/><path d="M46 72 v10 M54 72 v10" stroke="#fff" stroke-width="1.2"/>`;
    if (L.ropa === 'chaqueta') h += `<line x1="50" y1="70" x2="50" y2="110" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><path d="M40 68 L50 78 L60 68" fill="none" stroke="${rd}" stroke-width="3"/>`;
    if (L.ropa === 'plumas') h += `<path d="M27 82 h46 M27 92 h46 M27 102 h46" stroke="rgba(0,0,0,.2)" stroke-width="2"/><path d="M42 68 Q50 74 58 68" fill="none" stroke="${rd}" stroke-width="4"/>`;
    if (L.ropa === 'hawaiana') h += `${[[38, 82], [60, 78], [46, 98], [64, 100], [34, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/><circle cx="${x}" cy="${y}" r="1.4" fill="#f6c623"/>`).join('')}<path d="M42 68 L50 80 L58 68" fill="none" stroke="#fff" stroke-width="2"/>`;
    if (L.ropa === 'traje') h += `<path d="M43 68 L50 86 L57 68Z" fill="#fff"/><path d="M49 72 L51 72 L52.5 90 L50 94 L47.5 90Z" fill="#d6283b"/><path d="M43 68 L48 92 M57 68 L52 92" stroke="#444b5c" stroke-width="2"/>`;
    if (L.extra === 'mochila') h += `<path d="M37 70 L38 108 M63 70 L62 108" stroke="#3b4a6b" stroke-width="4"/>`;
    if (L.extra === 'cadena') h += `<path d="M41 70 Q50 88 59 70" fill="none" stroke="#f5c518" stroke-width="2.5"/><circle cx="50" cy="83" r="3.2" fill="#f5c518"/>`;
    if (L.extra === 'medalla') h += `<path d="M42 68 L50 86 L58 68" fill="none" stroke="#2f6fe0" stroke-width="3.5"/><circle cx="50" cy="90" r="6.5" fill="#f5c518" stroke="#b08a00"/><text x="50" y="93" text-anchor="middle" font-size="8" font-weight="900" fill="#b08a00">1</text>`;
    if (L.extra === 'balon') h += `<circle cx="84" cy="141" r="9" fill="#fff" stroke="#333" stroke-width="1"/><path d="M84 137 l3.5 2.5 -1.3 4 h-4.4 l-1.3 -4Z" fill="#333"/>`;
    h += `<circle cx="25" cy="42" r="5" fill="${sk}"/><circle cx="75" cy="42" r="5" fill="${sk}"/><circle cx="50" cy="40" r="25" fill="${sk}"/>`;
    if (L.cara === 'barba') h += `<path d="M27 44 Q30 70 50 70 Q70 70 73 44 Q70 58 60 56 Q50 62 40 56 Q30 58 27 44Z" fill="${hc}"/>`;
    h += `<circle cx="35" cy="50" r="4" fill="#ff7b7b" opacity=".3"/><circle cx="65" cy="50" r="4" fill="#ff7b7b" opacity=".3"/>`;
    if (L.cara === 'pecas') h += [[40, 49], [43, 51], [38, 52], [60, 49], [57, 51], [62, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#b5651d"/>`).join('');
    if (L.cara === 'pintura') h += `<path d="M30 47 h9 M30 51 h9 M61 47 h9 M61 51 h9" stroke="${O ? c1 : rc}" stroke-width="2.2" stroke-linecap="round"/>`;
    const ojo = x => ene < 25 ? `<path d="M${x - 4} 44 h8" stroke="#222" stroke-width="2.4" stroke-linecap="round"/>`
      : fel > 75 ? `<path d="M${x - 4} 45 Q${x} 39 ${x + 4} 45" stroke="#222" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        : `<circle cx="${x}" cy="43" r="3.3" fill="#222"/><circle cx="${x + 1}" cy="42" r="1" fill="#fff"/>`;
    h += ojo(39) + ojo(61);
    h += fel < 40 ? `<path d="M34 35 l7 -2 M66 35 l-7 -2" stroke="${hc}" stroke-width="2" stroke-linecap="round"/>` : `<path d="M34 34 q5 -3 9 0 M57 34 q5 -3 9 0" stroke="${hc}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (ene < 25) h += `<path d="M34 48 q5 3 9 0 M57 48 q5 3 9 0" stroke="#7a6a9a" stroke-width="1.2" fill="none" opacity=".7"/>`;
    h += fel > 65 ? `<path d="M41 52 Q50 63 59 52Z" fill="#7a2a2a"/><path d="M44 57 Q50 61 56 57" fill="#ff7b8a"/>`
      : fel >= 40 ? `<path d="M43 54 Q50 59 57 54" stroke="#5a2a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        : `<path d="M43 58 Q50 52 57 58" stroke="#5a2a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    if (fel < 25) h += `<path d="M65 47 q2 4 0 6 q-2 -2 0 -6Z" fill="#59b7ff"/>`;
    if (L.cara === 'bigote') h += `<path d="M41 51 Q50 46 59 51 Q50 54 41 51Z" fill="${hc}"/>`;
    if (L.cara === 'perilla') h += `<path d="M46 61 L54 61 L50 69Z" fill="${hc}"/>`;
    if (s && s.p && s.p.lesion > 0) h += `<g transform="rotate(-20 60 28)"><rect x="52" y="25" width="17" height="6" rx="3" fill="#f3c89a" stroke="#c99a6a" stroke-width=".8"/><path d="M58 26 v4 M62 26 v4" stroke="#c99a6a" stroke-width=".6"/></g>`;
    const flequillo = `<path d="M24 42 Q22 14 50 13 Q78 14 76 42 Q72 28 62 26 Q50 32 36 26 Q28 30 24 42Z" fill="${hc}"/>`;
    if (['corto', 'coleta', 'trenzas', 'mono', 'largo'].includes(L.pelo)) h += flequillo;
    else if (L.pelo === 'rizos') h += [[28, 30], [36, 20], [46, 16], [56, 16], [65, 20], [72, 30], [25, 40], [75, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${hc}"/>`).join('');
    else if (L.pelo === 'rapado') h += `<path d="M26 36 Q28 16 50 15 Q72 16 74 36 Q66 22 50 22 Q34 22 26 36Z" fill="${hc}" opacity=".55"/>`;
    else if (L.pelo === 'calvo') h += `<ellipse cx="40" cy="24" rx="6" ry="3" fill="#fff" opacity=".35"/>`;
    else if (L.pelo === 'tupe') h += `<path d="M24 42 Q22 18 46 15 Q40 2 62 3 Q82 6 76 24 Q78 32 76 42 Q70 26 50 26 Q32 28 24 42Z" fill="${hc}"/>`;
    else if (L.pelo === 'afro') h += `<path d="M26 34 Q50 16 74 34 Q50 26 26 34Z" fill="${hc}"/>`;
    else if (L.pelo === 'cresta') h += `<path d="M26 36 Q28 16 50 15 Q72 16 74 36 Q66 22 50 22 Q34 22 26 36Z" fill="${hc}" opacity=".5"/><path d="M42 26 L38 -2 L48 10 L50 -8 L54 10 L64 -2 L58 26Z" fill="${hc}"/>`;
    if (L.gafas === 'redondas') h += `<circle cx="39" cy="43" r="7" fill="rgba(255,255,255,.15)" stroke="#222" stroke-width="2"/><circle cx="61" cy="43" r="7" fill="rgba(255,255,255,.15)" stroke="#222" stroke-width="2"/><path d="M46 43 h8 M32 42 l-6 -2 M68 42 l6 -2" stroke="#222" stroke-width="2"/>`;
    else if (L.gafas === 'sol') h += `<rect x="30" y="37" width="17" height="11" rx="4" fill="#111"/><rect x="53" y="37" width="17" height="11" rx="4" fill="#111"/><path d="M47 41 h6 M30 40 l-5 -1 M70 40 l5 -1" stroke="#111" stroke-width="2"/><path d="M33 40 l4 0" stroke="#fff" stroke-width="1.5" opacity=".6"/>`;
    else if (L.gafas === 'deportivas') h += `<path d="M26 39 Q50 32 74 39 L72 48 Q50 43 28 48Z" fill="#ff5a1f"/><path d="M30 41 Q50 36 70 41" stroke="#fff" stroke-width="1.2" opacity=".6" fill="none"/>`;
    else if (L.gafas === 'corazon') { const co = x => `<path d="M${x} 49 l-7 -7 a4 4 0 0 1 7 -4 a4 4 0 0 1 7 4Z" fill="#ff2d6f"/>`; h += co(39) + co(61) + `<path d="M46 42 h8" stroke="#ff2d6f" stroke-width="1.5"/>`; }
    if (L.cabeza === 'gorra') h += `<path d="M24 34 Q24 9 50 9 Q76 9 76 34Z" fill="${rc}"/><path d="M50 30 Q80 26 92 35 Q72 38 50 34Z" fill="${rd}"/><circle cx="50" cy="10" r="2.5" fill="${rd}"/>`;
    else if (L.cabeza === 'gorro') h += `<path d="M23 36 Q23 5 50 5 Q77 5 77 36Z" fill="${rc}"/><rect x="22" y="29" width="56" height="9" rx="4" fill="${rd}"/><circle cx="50" cy="4" r="6" fill="#fff"/>`;
    else if (L.cabeza === 'cinta') h += `<path d="M25 30 Q50 22 75 30 L75 36 Q50 28 25 36Z" fill="${rc}"/>`;
    else if (L.cabeza === 'fiesta') h += `<path d="M38 18 L50 -14 L62 18Z" fill="#ff6fb5"/><path d="M41 10 L59 10 M44 2 L56 2" stroke="#f6c623" stroke-width="3"/><circle cx="50" cy="-14" r="4" fill="#f6c623"/>`;
    else if (L.cabeza === 'vaquero') h += `<path d="M32 22 Q32 2 50 5 Q68 2 68 22Z" fill="#8a5a2b"/><ellipse cx="50" cy="22" rx="38" ry="6" fill="#6b4422"/><rect x="32" y="16" width="36" height="4" fill="#2a2d34"/>`;
    else if (L.cabeza === 'corona') h += `<path d="M31 21 L33 1 L42 11 L50 -4 L58 11 L67 1 L69 21Z" fill="#f5c518" stroke="#b08a00" stroke-width="1"/><circle cx="50" cy="15" r="2.5" fill="#e23b3b"/><circle cx="40" cy="16" r="2" fill="#2f6fe0"/><circle cx="60" cy="16" r="2" fill="#22a35a"/>`;
    if (L.extra === 'auriculares') h += `<path d="M23 42 Q23 7 50 7 Q77 7 77 42" fill="none" stroke="#2a2d34" stroke-width="5"/><rect x="17" y="35" width="10" height="16" rx="4" fill="${rc}"/><rect x="73" y="35" width="10" height="16" rx="4" fill="${rc}"/>`;
    return `<svg viewBox="${VISTA_LOOK[modo] || VISTA_LOOK.cuerpo}" class="avatar" aria-hidden="true">${h}</svg>`;
  }

  Object.assign(P2, { LOOK_INICIAL, CAPAS_LOOK: CAPAS, ITEMS_LOOK: ITEMS, COLOR_PELO, COLOR_ROPA, PIEL, itemLook, bloqueoLook, ponerLook, lookAzar, validarLook, avatarSVG });
})(globalThis.P2 = globalThis.P2 || {});
