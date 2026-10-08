/* =====================================================================
   11 · TU PERSONAJE: avatar dibujado por capas (mismo dibujo que P1)
   Se elige al empezar. Algunas prendas se desbloquean con hitos.
   La cara cambia sola con la energía, las lesiones y cómo te va.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { esc } = P2;

  const PIEL = ['#ffe3c8', '#f6c9a0', '#e2a877', '#c48650', '#8f5b35', '#5e3b22', '#fff1e4', '#3f2615', '#f2c4b0', '#d8b48a'];
  const COLOR_OJOS = { marron: '#5a3418', miel: '#a8742a', verde: '#3f8f4f', azul: '#3d7bff', gris: '#7d8aa0', negro: '#1a1414' };
  const COLOR_PELO = { negro: '#22201f', castano: '#6b4226', rubio: '#e8c36a', pelirrojo: '#c4512b', canoso: '#cfcfcf', azul: '#2f7bf5', rosa: '#ff6fb5', verde: '#3ccf6e', platino: '#f1ead2', cobrizo: '#9a4a1e', morado: '#8b5cf6', blanco: '#f7f7f7' };
  const COLOR_ROPA = { rojo: '#e23b3b', azul: '#2f6fe0', verde: '#22a35a', amarillo: '#f6c623', negro: '#2a2d34', blanco: '#f4f4f4', morado: '#7b4bd6', naranja: '#ff8a2a' };
  const FONDO_LOOK = { azul: '#bfe0ff', verde: '#c6f0d2', naranja: '#ffd9b3', morado: '#dccbff', rosa: '#ffd0e6' };
  const LOOK_INICIAL = { piel: '1', pelo: 'corto', colorPelo: 'castano', cara: 'nada', ropa: 'camiseta', colorRopa: 'azul', pantalon: 'chandal', calzado: 'deportivas', cabeza: 'nada', gafas: 'nada', extra: 'nada', fondo: 'azul',
    edad: 'joven', complexion: 'normal', ojos: 'redondos', colorOjos: 'marron', cejas: 'normales', rasgo: 'nada', piercing: 'nada', tatuaje: 'nada', pose: 'nada' };
  const VISTA_LOOK = { cara: '16 18 68 52', busto: '6 -12 88 88', cuerpo: '0 -16 100 176', torso: '8 52 84 64', piernas: '14 92 72 64' };

  // Capas y prendas (datos). req.hito: se desbloquea al conseguir ese hito
  // [capa, icono, nombre, vista previa, grupo del editor]
  const CAPAS = [['piel', '✋', 'Piel', 'busto', 'cara'], ['edad', '🎂', 'Edad', 'cara', 'cara'], ['ojos', '👁️', 'Ojos', 'cara', 'cara'], ['colorOjos', '🎨', 'Color de ojos', 'cara', 'cara'],
    ['cejas', '〰️', 'Cejas', 'cara', 'cara'], ['cara', '🧔', 'Barba y bigote', 'busto', 'cara'], ['rasgo', '✨', 'Rasgos', 'cara', 'cara'], ['piercing', '💍', 'Piercings', 'cara', 'cara'],
    ['pelo', '💇', 'Peinado', 'busto', 'pelo'], ['colorPelo', '🎨', 'Color de pelo', 'busto', 'pelo'],
    ['complexion', '💪', 'Complexión', 'cuerpo', 'cuerpo'], ['tatuaje', '🖋️', 'Tatuajes', 'torso', 'cuerpo'],
    ['ropa', '👕', 'Ropa', 'torso', 'ropa'], ['colorRopa', '🖌️', 'Color', 'torso', 'ropa'], ['pantalon', '👖', 'Pantalón', 'piernas', 'ropa'], ['calzado', '👟', 'Calzado', 'piernas', 'ropa'],
    ['cabeza', '🧢', 'Cabeza', 'busto', 'extras'], ['gafas', '🕶️', 'Gafas', 'busto', 'extras'], ['extra', '🎒', 'Extras', 'cuerpo', 'extras'], ['pose', '🕺', 'Pose', 'cuerpo', 'extras'], ['fondo', '🖼️', 'Fondo', 'busto', 'extras']];
  const GRUPOS_LOOK = [['cara', '🙂', 'Cara'], ['pelo', '💇', 'Pelo'], ['cuerpo', '💪', 'Cuerpo'], ['ropa', '👕', 'Ropa'], ['extras', '🧢', 'Extras']];
  // Clubes y competiciones de los packs (colores del club; competiciones ficticias)
  const CLUBES_PACK = { puerto: { n: 'UD Puerto', ic: '⚓', c1: '#1d3c78', c2: '#ffffff' }, costa: { n: 'Real Costa', ic: '🌊', c1: '#3aa0e0', c2: '#ffffff' }, atletico: { n: 'Atlético Ciudad', ic: '🔴', c1: '#d62839', c2: '#ffffff' } };
  const CAMPEON_PACK = { copa: { n: 'Copa Federación', ic: '🏆', c1: '#c8901a', c2: '#ffffff', fondo: '#3a2400' }, europa: { n: 'Copa de Europa', ic: '⭐', c1: '#14206b', c2: '#ffc83d', fondo: '#0b1033' },
    mundial: { n: 'Mundial', ic: '🌍', c1: '#0f7a43', c2: '#ffc83d', fondo: '#06331d' }, liga: { n: 'Liga', ic: '👑', c1: '#5b2bb5', c2: '#ffc83d', fondo: '#1e0d45' } };
  const porClub = f => Object.entries(CLUBES_PACK).map(([k, C]) => f(k, C));
  const porCopa = f => Object.entries(CAMPEON_PACK).map(([k, C]) => f(k, C));
  const ITEMS = {
    piel: [6, 0, 8, 1, 9, 2, 3, 4, 5, 7].map((i, k) => ({ id: String(i), n: `Tono ${k + 1}` })),
    edad: [['joven', 'Joven'], ['adulto', 'Adulto/a'], ['maduro', 'Maduro/a'], ['veterano', 'Veterano/a']].map(([id, n]) => ({ id, n })),
    ojos: [['redondos', 'Redondos'], ['grandes', 'Grandes'], ['almendrados', 'Almendrados'], ['pequenos', 'Pequeños'], ['caidos', 'Caídos'], ['pestanas', 'Con pestañas']].map(([id, n]) => ({ id, n })),
    colorOjos: [['marron', 'Marrones'], ['miel', 'Miel'], ['verde', 'Verdes'], ['azul', 'Azules'], ['gris', 'Grises'], ['negro', 'Negros']].map(([id, n]) => ({ id, n })),
    cejas: [['normales', 'Normales'], ['finas', 'Finas'], ['gruesas', 'Gruesas'], ['arqueadas', 'Arqueadas'], ['rectas', 'Rectas'], ['corte', 'Con corte']].map(([id, n]) => ({ id, n })),
    rasgo: [['nada', 'Nada'], ['lunar', 'Lunar'], ['cicatriz', 'Cicatriz'], ['hoyuelos', 'Hoyuelos'], ['sonrojo', 'Mejillas rojas'], ['ojeras', 'Ojeras'], ['pecasFuertes', 'Muchas pecas'], ['lagrima', 'Lágrima tatuada']].map(([id, n]) => ({ id, n })),
    piercing: [['nada', 'Nada'], ['oreja', 'Aro en la oreja'], ['orejas', 'Varios en las orejas'], ['nariz', 'Aro en la nariz'], ['septum', 'Septum'], ['ceja', 'En la ceja'], ['labio', 'En el labio'], ['combo', 'Oreja + nariz']].map(([id, n]) => ({ id, n })),
    complexion: [['delgada', 'Delgada'], ['normal', 'Normal'], ['atletica', 'Atlética'], ['fuerte', 'Fuerte']].map(([id, n]) => ({ id, n })),
    tatuaje: [['nada', 'Nada'], ['antebrazo', 'Estrella en el antebrazo'], ['rosa', 'Rosa en el antebrazo'], ['manga', 'Brazo entero'], ['tribal', 'Brazaletes tribales'], ['cuello', 'Cuello'], ['mano', 'Mano'], ['ambos', 'Los dos brazos']].map(([id, n]) => ({ id, n })),
    pelo: [['corto', 'Corto'], ['largo', 'Largo'], ['coleta', 'Coleta'], ['rizos', 'Rizos'], ['rapado', 'Rapado'], ['calvo', 'Sin pelo'], ['mono', 'Moño'], ['tupe', 'Tupé'], ['trenzas', 'Trenzas'], ['afro', 'Afro'], ['cresta', 'Cresta'], ['bob', 'Melena corta'], ['rastas', 'Rastas'], ['raya', 'Raya al lado'], ['mohicano', 'Mohicano'], ['mono2', 'Dos moños']].map(([id, n]) => ({ id, n }))
      .concat([{ id: 'degradado', n: 'Degradado Pro', req: { premium: 'pro' } }]),
    colorPelo: [['negro', 'Negro'], ['castano', 'Castaño'], ['rubio', 'Rubio'], ['pelirrojo', 'Pelirrojo'], ['canoso', 'Canoso'], ['azul', 'Azul eléctrico'], ['rosa', 'Rosa chicle'], ['verde', 'Verde'], ['platino', 'Platino'], ['cobrizo', 'Cobrizo'], ['morado', 'Morado'], ['blanco', 'Blanco']].map(([id, n]) => ({ id, n })),
    cara: [['nada', 'Nada'], ['pecas', 'Pecas'], ['pintura', 'Pintura de guerra'], ['bigote', 'Bigote'], ['perilla', 'Perilla'], ['barba', 'Barba']].map(([id, n]) => ({ id, n })),
    ropa: [{ id: 'camiseta', n: 'Camiseta' }, { id: 'tirantes', n: 'Tirantes' }, { id: 'hawaiana', n: 'Hawaiana' }, { id: 'sudadera', n: 'Sudadera' }, { id: 'chaqueta', n: 'Chaqueta' }, { id: 'plumas', n: 'Plumas' },
      { id: 'equipacion', n: 'Camiseta de tu club', req: { hito: 'contrato' } }, { id: 'marca', n: 'Camiseta de tu marca', req: { hito: 'patro' } }, { id: 'traje', n: 'Traje de empresario', req: { hito: 'empresa' } },
      { id: 'equipoFav', n: 'Camiseta de tu equipo', req: { tienda: 'camiseta' } }, { id: 'chandalMarca', n: 'Chándal de marca', req: { tienda: 'chandal' } }, { id: 'temporada', n: 'Camiseta de la temporada', req: { anuncio: 'temporada' } },
      { id: 'debut', n: 'Outfit Debut', req: { premium: 'debut' } }, { id: 'street', n: 'Sudadera Street', req: { premium: 'street' } }, { id: 'pro', n: 'Outfit Pro', req: { premium: 'pro' } },
      { id: 'trajeLux', n: 'Traje Luxury', req: { premium: 'luxury' } }, { id: 'founder', n: 'Camiseta Founder', req: { premium: 'founder' } },
      { id: 'casualPro', n: 'Traje casual Pro', req: { premium: 'pro' } }, { id: 'magnate', n: 'Traje Magnate', req: { premium: 'magnate' } }]
      .concat(porClub((k, C) => ({ id: `clubCam_${k}`, n: `Camiseta ${C.n}`, req: { premium: `club_${k}` } })), porClub((k, C) => ({ id: `clubChaq_${k}`, n: `Chaqueta ${C.n}`, req: { premium: `club_${k}` } })),
        porCopa((k, C) => ({ id: `camp_${k}`, n: `Camiseta campeón · ${C.n}`, req: { premium: `champ_${k}` } }))),
    colorRopa: [['azul', 'Azul'], ['rojo', 'Rojo'], ['verde', 'Verde'], ['amarillo', 'Amarillo'], ['negro', 'Negro'], ['blanco', 'Blanco'], ['morado', 'Morado'], ['naranja', 'Naranja']].map(([id, n]) => ({ id, n })),
    pantalon: [{ id: 'chandal', n: 'Chándal' }, { id: 'corto', n: 'Corto' }, { id: 'vaquero', n: 'Vaqueros' }, { id: 'falda', n: 'Falda' }, { id: 'traje', n: 'De traje', req: { hito: 'empresa' } }, { id: 'street', n: 'Cargo Street', req: { premium: 'street' } }],
    calzado: [{ id: 'deportivas', n: 'Deportivas' }, { id: 'chanclas', n: 'Chanclas' }, { id: 'botas', n: 'Botas de fútbol' }, { id: 'montana', n: 'De montaña' }, { id: 'zapatos', n: 'Zapatos' }, { id: 'doradas', n: 'Botas de oro', req: { hito: 'inversion2' } },
      { id: 'botasPro', n: 'Botas profesionales', req: { tienda: 'botasPro' } }, { id: 'debut', n: 'Botas Debut', req: { premium: 'debut' } }, { id: 'street', n: 'Zapatillas Street', req: { premium: 'street' } }, { id: 'pro', n: 'Botas Pro', req: { premium: 'pro' } }]
      .concat(porCopa((k, C) => ({ id: `camp_${k}`, n: `Botas de campeón · ${C.n}`, req: { premium: `champ_${k}` } }))),
    cabeza: [{ id: 'nada', n: 'Nada' }, { id: 'cinta', n: 'Cinta' }, { id: 'gorra', n: 'Gorra' }, { id: 'gorro', n: 'Gorro de lana' }, { id: 'fiesta', n: 'Gorro de fiesta' }, { id: 'vaquero', n: 'Sombrero' }, { id: 'corona', n: 'Corona', req: { hito: 'inversion2' } },
      { id: 'gorraPlana', n: 'Gorra de colección', req: { tienda: 'gorra' } }, { id: 'gorraDebut', n: 'Gorra Debut', req: { premium: 'debut' } }, { id: 'gorraStreet', n: 'Gorra Street', req: { premium: 'street' } }],
    gafas: [['nada', 'Sin gafas'], ['corazon', 'Corazón'], ['redondas', 'Redondas'], ['sol', 'De sol'], ['deportivas', 'Deportivas']].map(([id, n]) => ({ id, n }))
      .concat([{ id: 'temporada', n: 'Gafas edición temporada', req: { anuncio: 'temporada' } }, { id: 'pro', n: 'Gafas Pro', req: { premium: 'pro' } },
        { id: 'street', n: 'Gafas Street', req: { premium: 'street' } }, { id: 'lux', n: 'Gafas Luxury', req: { premium: 'luxury' } }]),
    extra: [{ id: 'nada', n: 'Nada' }, { id: 'balon', n: 'Balón' }, { id: 'mochila', n: 'Mochila' }, { id: 'auriculares', n: 'Auriculares' }, { id: 'capa', n: 'Capa' },
      { id: 'medalla', n: 'Medalla', req: { hito: 'titular' } }, { id: 'reloj', n: 'Reloj de lujo', req: { hito: 'rentable' } }, { id: 'cadena', n: 'Cadena de oro', req: { hito: 'inversion2' } },
      { id: 'relojDep', n: 'Reloj deportivo', req: { tienda: 'relojDep' } }, { id: 'relojPro', n: 'Reloj Pro', req: { premium: 'pro' } }, { id: 'relojPremium', n: 'Reloj Premium', req: { premium: 'luxury' } },
      { id: 'cadenaExcl', n: 'Cadena exclusiva', req: { premium: 'luxury' } }, { id: 'insignia', n: 'Insignia Founder', req: { premium: 'founder' } },
      { id: 'mochilaStreet', n: 'Mochila Street', req: { premium: 'street' } }, { id: 'maletaPro', n: 'Maleta deportiva Pro', req: { premium: 'pro' } }, { id: 'auriPro', n: 'Auriculares Pro', req: { premium: 'pro' } },
      { id: 'relojLeg', n: 'Reloj legendario', req: { premium: 'magnate' } }, { id: 'insigniaMag', n: 'Insignia Magnate', req: { premium: 'magnate' } }]
      .concat(porClub((k, C) => ({ id: `bufanda_${k}`, n: `Bufanda ${C.n}`, req: { premium: `club_${k}` } })), porClub((k, C) => ({ id: `mochila_${k}`, n: `Mochila ${C.n}`, req: { premium: `club_${k}` } })),
        porCopa((k, C) => ({ id: `trofeo_${k}`, n: `Trofeo · ${C.n}`, req: { premium: `champ_${k}` } }))),
    // Poses: los brazos (solo aspecto)
    pose: [{ id: 'nada', n: 'De pie' }, { id: 'saludo', n: 'Saludo' }, { id: 'abiertos', n: 'Brazos abiertos' }, { id: 'pro', n: 'Pose Pro', req: { premium: 'pro' } },
      { id: 'empresario', n: 'Pose de empresario', req: { premium: 'luxury' } }, { id: 'campeon', n: 'Celebración de campeón', req: { premium: 'champ' } }],
    fondo: [['azul', 'Azul'], ['verde', 'Verde'], ['naranja', 'Naranja'], ['morado', 'Morado'], ['rosa', 'Rosa']].map(([id, n]) => ({ id, n }))
      .concat([{ id: 'noche', n: 'Noche estrellada', req: { hito: 'contrato' } }, { id: 'dorado', n: 'Fondo de oro', req: { hito: 'inversion2' } },
        { id: 'street', n: 'Fondo Street', req: { coleccion: 'street' } }, { id: 'vestuario', n: 'Fondo Vestuario', req: { coleccion: 'pro' } }, { id: 'lujo', n: 'Fondo Lujo', req: { coleccion: 'lujo' } },
        { id: 'debut', n: 'Fondo Debut', req: { premium: 'debut' } }, { id: 'urbano', n: 'Fondo Urbano', req: { premium: 'street' } }, { id: 'estadio', n: 'Fondo Estadio', req: { premium: 'pro' } },
        { id: 'premium', n: 'Fondo Premium', req: { premium: 'luxury' } }, { id: 'founder', n: 'Fondo Founder', req: { premium: 'founder' } },
        { id: 'vestPro', n: 'Fondo Vestuario Pro', req: { premium: 'pro' } }, { id: 'rooftop', n: 'Fondo Rooftop', req: { premium: 'luxury' } }, { id: 'skyline', n: 'Fondo Skyline', req: { premium: 'magnate' } }])
      .concat(porClub((k, C) => ({ id: `club_${k}`, n: `Fondo ${C.n}`, req: { premium: `club_${k}` } })), porCopa((k, C) => ({ id: `camp_${k}`, n: `Fondo campeón · ${C.n}`, req: { premium: `champ_${k}` } }))),
  };
  const itemLook = (cap, id) => (ITEMS[cap] || []).find(x => x.id === id);
  // Packs del prototipo → entitlements reales del catálogo (commerce/catalog)
  const PREMIUM_ENT = { debut: 'cosmetic.debut_pack', street: 'cosmetic.street_pack', pro: 'cosmetic.pro_pack', luxury: 'cosmetic.luxury_pack', magnate: 'cosmetic.magnate_pack', founder: 'cosmetic.founder_pack' };
  const PACK_NOMBRE = { debut: 'Pack Debut', street: 'Street Pack', pro: 'Pro Pack', luxury: 'Luxury Pack', magnate: 'Magnate Pack', founder: 'Founder Pack', champ: 'un Pack Campeón' };
  for (const [k, C] of Object.entries(CLUBES_PACK)) { PREMIUM_ENT[`club_${k}`] = `cosmetic.club_${k}`; PACK_NOMBRE[`club_${k}`] = `Pack ${C.n}`; }
  for (const [k, C] of Object.entries(CAMPEON_PACK)) { PREMIUM_ENT[`champ_${k}`] = `cosmetic.champion_${k}`; PACK_NOMBRE[`champ_${k}`] = `Pack Campeón · ${C.n}`; }
  PREMIUM_ENT.champ = Object.keys(CAMPEON_PACK).map(k => `cosmetic.champion_${k}`);   // la celebración: con cualquier Pack Campeón
  // ¿Tiene la cuenta este pack? (la cuenta decide: P2.tieneEnt lo conecta la interfaz con el comercio)
  const premiumOk = k => { const E = PREMIUM_ENT[k]; return Array.isArray(E) ? E.some(e => P2.tieneEnt(e)) : !!(E && P2.tieneEnt(E)); };
  Object.assign(P2, { PREMIUM_ENT, PACK_NOMBRE, premiumOk, CLUBES_PACK, CAMPEON_PACK });
  function bloqueoLook(s, it, cap) {
    if (!it || !it.req) return null;
    if (s && Array.isArray(s.lookDesbloqueos) && s.lookDesbloqueos.includes(`${cap || ''}:${it.id}`)) return null;   // comprado en la Tienda
    if (it.req.hito && !(s && s.hitos && s.hitos[it.req.hito])) { const H = P2.HITOS.find(h => h.id === it.req.hito); return `Hito: ${H ? H.n : it.req.hito}`; }
    // Cosméticos que solo se consiguen en la Tienda, con recompensas, colecciones o packs (en P2.4, packs solo de prueba)
    if (it.req.tienda) return `Tienda: ${P2.producto ? (P2.producto(it.req.tienda) || { n: '' }).n : ''}`;
    if (it.req.anuncio) return 'Recompensa de temporada';
    if (it.req.coleccion) return `Completa la colección ${(P2.COLECCIONES || []).find(c => c.id === it.req.coleccion) ? P2.COLECCIONES.find(c => c.id === it.req.coleccion).n : ''}`;
    if (it.req.premium) return premiumOk(it.req.premium) ? null : `💎 ${PACK_NOMBRE[it.req.premium] || 'Pack'} (Premium)`;
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
    if (Math.random() < 0.7) L.edad = 'joven';
    if (Math.random() < 0.6) L.rasgo = 'nada';
    if (Math.random() < 0.6) L.piercing = 'nada';
    if (Math.random() < 0.6) L.tatuaje = 'nada';
    if (Math.random() < 0.7) L.pose = 'nada';
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

  // Variantes cosméticas: reutilizan una forma base con otros colores y un adorno (sin estadísticas)
  const VAR_ROPA = {
    equipoFav: { base: 'equipacion', c1: '#c8102e', c2: '#ffffff', num: '7' },
    temporada: { base: 'equipacion', c1: '#3d7bff', c2: '#ffc83d', num: '24' },
    chandalMarca: { base: 'chaqueta', tc: '#1a1640', ad: '<path d="M22 74 v32 M78 74 v32" stroke="#3d7bff" stroke-width="2.5"/><path d="M32 86 h36" stroke="#3d7bff" stroke-width="2"/>' },
    debut: { base: 'camiseta', tc: '#1a1640', ad: '<path d="M43 68 L50 78 L57 68" fill="none" stroke="#ffc83d" stroke-width="2.5"/><text x="50" y="99" text-anchor="middle" font-size="12" font-weight="900" fill="#ffc83d" font-family="Arial,sans-serif">D</text>' },
    street: { base: 'sudadera', tc: '#ff4f8b', ad: '<path d="M36 88 q7 -6 14 0 t14 0" fill="none" stroke="#ffc83d" stroke-width="3"/><circle cx="58" cy="80" r="2.5" fill="#7fd8ff"/>' },
    pro: { base: 'chaqueta', tc: '#0b1033', ad: '<path d="M30 92 h40" stroke="#3d7bff" stroke-width="4"/><path d="M31 97 h38" stroke="#8b5cf6" stroke-width="2"/>' },
    trajeLux: { base: 'traje', tc: '#4b1f7a', ad: '<path d="M49 72 L51 72 L52.5 90 L50 94 L47.5 90Z" fill="#ffc83d"/><circle cx="62" cy="80" r="2" fill="#ffc83d"/>' },
    founder: { base: 'camiseta', tc: '#ffc83d', ad: '<path d="M50 80 l3 6 6.5 .8 -4.8 4.4 1.3 6.4 -6 -3.2 -6 3.2 1.3 -6.4 -4.8 -4.4 6.5 -.8Z" fill="#1a1640"/>' },
    casualPro: { base: 'chaqueta', tc: '#24345e', ad: '<path d="M42 68 L50 82 L58 68Z" fill="#f4f4f4"/><path d="M40 68 L50 84 L60 68" fill="none" stroke="#18233f" stroke-width="2.5"/><path d="M60 80 l5 -1 v3 h-5Z" fill="#3d7bff"/>' },
    magnate: { base: 'traje', tc: '#0d0d12', ad: '<path d="M43 68 L48 92 M57 68 L52 92" stroke="#ffc83d" stroke-width="2.4"/><path d="M49 72 L51 72 L52.5 90 L50 94 L47.5 90Z" fill="#1a1a1a"/><rect x="60" y="77" width="7" height="3" rx="1" fill="#ffc83d"/><circle cx="50" cy="100" r="1.4" fill="#ffc83d"/><circle cx="50" cy="106" r="1.4" fill="#ffc83d"/>' },
  };
  for (const [k, C] of Object.entries(CLUBES_PACK)) {
    VAR_ROPA[`clubCam_${k}`] = { base: 'equipacion', c1: C.c1, c2: C.c2, num: '9' };
    VAR_ROPA[`clubChaq_${k}`] = { base: 'chaqueta', tc: C.c1, ad: `<path d="M30 84 h40 M30 88 h40" stroke="${C.c2}" stroke-width="2"/><text x="60" y="80" text-anchor="middle" font-size="7">${C.ic}</text>` };
  }
  for (const [k, C] of Object.entries(CAMPEON_PACK)) VAR_ROPA[`camp_${k}`] = { base: 'equipacion', c1: C.c1, c2: C.c2, num: '★' };
  const VAR_CABEZA = { gorraPlana: '#2a2d34', gorraDebut: '#1a1640', gorraStreet: '#ff4f8b' };
  const FONDO_ESP = {
    street: '<rect x="-20" y="-30" width="140" height="140" fill="#3b1c6e"/><path d="M-20 70 L120 40 M-20 90 L120 60" stroke="#ff4f8b" stroke-width="8" opacity=".6"/>',
    vestuario: '<rect x="-20" y="-30" width="140" height="140" fill="#1d3a9e"/>' + [0, 1, 2, 3, 4].map(i => `<rect x="${-14 + i * 26}" y="-10" width="22" height="90" rx="3" fill="#2b4fc0" stroke="#173083"/>`).join(''),
    lujo: '<rect x="-20" y="-30" width="140" height="140" fill="#1a1640"/><circle cx="50" cy="30" r="46" fill="#ffc83d" opacity=".25"/><path d="M50 -6 l10 14 -10 14 -10 -14Z" fill="#ffc83d" opacity=".7"/>',
    debut: '<rect x="-20" y="-30" width="140" height="140" fill="#1a1640"/><path d="M50 -10 l6 14 15 1 -11 10 4 15 -14 -8 -14 8 4 -15 -11 -10 15 -1Z" fill="#ffc83d" opacity=".35"/>',
    urbano: '<rect x="-20" y="-30" width="140" height="140" fill="#2a1a78"/>' + [[-14, 20, 30], [12, 0, 28], [40, 14, 26], [66, -6, 30], [92, 10, 26]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="110" fill="#1b1550"/><rect x="${x + 6}" y="${y + 8}" width="5" height="6" fill="#ffd66b"/>`).join(''),
    estadio: '<rect x="-20" y="-30" width="140" height="140" fill="#1d3a9e"/><path d="M-20 80 Q50 50 120 80 L120 110 L-20 110Z" fill="#2c3fa8"/><circle cx="2" cy="-4" r="14" fill="#fff" opacity=".35"/><circle cx="98" cy="-4" r="14" fill="#fff" opacity=".35"/>',
    premium: '<defs><linearGradient id="fpPrem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#c8901a"/></linearGradient></defs><rect x="-20" y="-30" width="140" height="140" fill="url(#fpPrem)"/><path d="M50 -4 l9 12 -9 12 -9 -12Z" fill="#fff" opacity=".6"/>',
    founder: '<rect x="-20" y="-30" width="140" height="140" fill="#0b1033"/><rect x="-16" y="-26" width="132" height="132" fill="none" stroke="#ffc83d" stroke-width="4"/><path d="M50 -12 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1Z" fill="#ffc83d"/>',
    vestPro: '<rect x="-20" y="-30" width="140" height="140" fill="#0b1033"/>' + [0, 1, 2, 3, 4].map(i => `<rect x="${-14 + i * 26}" y="-14" width="22" height="84" rx="3" fill="#18245e" stroke="#3d7bff"/><rect x="${-6 + i * 26}" y="-4" width="6" height="2" fill="#ffc83d"/>`).join('') + '<rect x="-20" y="72" width="140" height="8" fill="#8a5a2b"/>',
    rooftop: '<defs><linearGradient id="fpRoof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a5c"/><stop offset=".6" stop-color="#ffc83d"/><stop offset="1" stop-color="#ffe7b0"/></linearGradient></defs><rect x="-20" y="-30" width="140" height="140" fill="url(#fpRoof)"/><circle cx="78" cy="10" r="12" fill="#fff4d6"/>'
      + [[-18, 40, 18], [2, 30, 14], [18, 46, 16], [62, 34, 16], [80, 24, 20], [102, 44, 18]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="80" fill="#6b3a6e" opacity=".75"/>`).join('') + '<path d="M-20 70 h140 M-20 62 h140" stroke="#2a2d34" stroke-width="2"/>' + [-10, 10, 30, 50, 70, 90, 110].map(x => `<path d="M${x} 62 v8" stroke="#2a2d34" stroke-width="2"/>`).join(''),
    skyline: '<rect x="-20" y="-30" width="140" height="140" fill="#07071a"/><circle cx="16" cy="-6" r="9" fill="#ffc83d" opacity=".9"/>'
      + [[-18, 30, 16], [0, 4, 14], [16, -14, 12], [30, 18, 14], [46, -24, 12], [60, 8, 16], [78, -6, 14], [94, 22, 16]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="120" fill="#141433" stroke="#ffc83d" stroke-width=".8"/>${[0, 1, 2, 3, 4].map(r => `<rect x="${x + 3}" y="${y + 6 + r * 12}" width="3" height="4" fill="#ffc83d" opacity=".8"/><rect x="${x + w - 6}" y="${y + 10 + r * 12}" width="3" height="4" fill="#ffc83d" opacity=".55"/>`).join('')}`).join('') + '<path d="M52 -24 v-10" stroke="#ffc83d" stroke-width="1.5"/>',
  };
  for (const [k, C] of Object.entries(CLUBES_PACK)) FONDO_ESP[`club_${k}`] = `<rect x="-20" y="-30" width="140" height="140" fill="${C.c1}"/>` + [-30, -6, 18, 42, 66, 90].map(x => `<path d="M${x} 110 L${x + 40} -30" stroke="${C.c2}" stroke-width="7" opacity=".22"/>`).join('') + `<text x="84" y="6" text-anchor="middle" font-size="22" opacity=".55">${C.ic}</text>`;
  for (const [k, C] of Object.entries(CAMPEON_PACK)) FONDO_ESP[`camp_${k}`] = `<rect x="-20" y="-30" width="140" height="140" fill="${C.fondo}"/><circle cx="50" cy="30" r="52" fill="${C.c2}" opacity=".12"/>`
    + '<path d="M36 -16 h28 v8 q0 18 -14 20 q-14 -2 -14 -20Z M46 12 h8 v12 h-8Z M40 24 h20 v6 h-20Z" fill="#ffc83d" opacity=".35"/>' + [[8, -8, '#ff4f8b'], [92, 0, '#7fd8ff'], [16, 30, '#ffc83d'], [86, 40, '#22a35a'], [4, 60, '#ffc83d'], [96, 70, '#ff4f8b']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="4" height="6" fill="${c}" transform="rotate(30 ${x} ${y})"/>`).join('') + `<text x="50" y="80" text-anchor="middle" font-size="14" opacity=".7">${C.ic}</text>`;

  function oscurecer(hex, f) { const n = parseInt(hex.slice(1), 16), c = k => Math.round(((n >> k) & 255) * f); return `rgb(${c(16)},${c(8)},${c(0)})`; }
  function avatarSVG(s, L, modo) {
    L = Object.assign({}, LOOK_INICIAL, L || (s && s.look) || {});
    modo = modo || 'cuerpo';
    if (['gorra', 'gorro'].includes(L.cabeza) && ['cresta', 'mono', 'tupe', 'afro'].includes(L.pelo)) L.pelo = 'corto';
    const sk = PIEL[+L.piel] || PIEL[1], hc = COLOR_PELO[L.colorPelo] || COLOR_PELO.castano, rc = COLOR_ROPA[L.colorRopa] || COLOR_ROPA.azul, rd = oscurecer(rc, 0.75);
    const fel = animo(s), ene = s && s.p ? s.p.energia : 80;
    const O = s && s.contrato ? P2.OFERTAS[s.contrato.oferta] : null;
    let c1 = O && O.c1 ? O.c1 : '#2e9d4f', c2 = O && O.c2 ? O.c2 : '#ffffff';
    const RV = VAR_ROPA[L.ropa]; if (RV) { L.ropa = RV.base; if (RV.c1) { c1 = RV.c1; c2 = RV.c2; } }
    const CV = VAR_CABEZA[L.cabeza]; if (CV) L.cabeza = 'gorra';
    const pelo2 = L.pelo; if (pelo2 === 'degradado') L.pelo = 'rapado';
    // Complexión: hombros, brazos y torso más estrechos o más anchos
    const dx = { delgada: -2, normal: 0, atletica: 1.5, fuerte: 3 }[L.complexion] || 0, gb = { delgada: -1, normal: 0, atletica: 0.5, fuerte: 1.5 }[L.complexion] || 0;
    const xa = 20 - dx, xb = 69 + dx, wa = 11 + gb;
    const tinta = '#1d2a55';
    const marca = s && s.patros && s.patros.length ? P2.MARCAS.find(m => m.id === s.patros[0].id) : null;
    let h = '';
    if (modo === 'busto') {
      if (L.fondo === 'noche') h += `<rect x="-20" y="-30" width="140" height="140" fill="#1d2552"/>${[[18, 0], [80, 6], [30, 60], [86, 52], [62, -6], [12, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join('')}`;
      else if (L.fondo === 'dorado') h += `<rect x="-20" y="-30" width="140" height="140" fill="#f5c518"/><circle cx="50" cy="34" r="44" fill="#ffe27a"/>`;
      else if (FONDO_ESP[L.fondo]) h += FONDO_ESP[L.fondo];
      else h += `<rect x="-20" y="-30" width="140" height="140" fill="${FONDO_LOOK[L.fondo] || FONDO_LOOK.azul}"/>`;
    } else h += `<ellipse cx="50" cy="153" rx="28" ry="4" fill="rgba(0,0,0,.25)"/>`;
    if (L.extra === 'capa') h += `<path d="M31 74 L14 146 L86 146 L69 74Z" fill="#d6283b"/>`;
    const mochilaC = L.extra === 'mochila' ? '#3b4a6b' : L.extra === 'mochilaStreet' ? '#ff4f8b' : /^mochila_/.test(L.extra) ? (CLUBES_PACK[L.extra.slice(8)] || {}).c1 : null;
    const clubX = /^(bufanda|mochila)_/.test(L.extra) ? CLUBES_PACK[L.extra.split('_')[1]] : null, copaX = /^trofeo_/.test(L.extra) ? CAMPEON_PACK[L.extra.slice(7)] : null;
    if (mochilaC) h += `<rect x="30" y="72" width="40" height="34" rx="8" fill="${mochilaC}"/>`;
    if (L.pelo === 'largo') h += `<path d="M23 40 Q23 12 50 12 Q77 12 77 40 L79 84 Q50 92 21 84Z" fill="${hc}"/>`;
    if (L.pelo === 'afro') h += `<circle cx="50" cy="34" r="33" fill="${hc}"/>`;
    if (L.pelo === 'coleta') h += `<path d="M70 24 Q94 28 86 64 Q80 44 68 36Z" fill="${hc}"/>`;
    if (L.pelo === 'trenzas') h += `<path d="M25 46 L21 92 M75 46 L79 92" stroke="${hc}" stroke-width="9" stroke-linecap="round"/><circle cx="21" cy="92" r="3" fill="#e23b3b"/><circle cx="79" cy="92" r="3" fill="#e23b3b"/>`;
    if (L.pelo === 'mono') h += `<circle cx="50" cy="11" r="9" fill="${hc}"/>`;
    if (L.pelo === 'mono2') h += `<circle cx="30" cy="16" r="8" fill="${hc}"/><circle cx="70" cy="16" r="8" fill="${hc}"/>`;
    if (L.pelo === 'bob') h += `<path d="M22 42 Q22 12 50 12 Q78 12 78 42 L78 64 Q66 70 60 62 L40 62 Q34 70 22 64Z" fill="${hc}"/>`;
    if (L.pelo === 'rastas') h += [26, 34, 66, 74].map((x, i) => `<path d="M${x} 36 Q${x + (i < 2 ? -3 : 3)} 62 ${x + (i < 2 ? -1 : 1)} 86" stroke="${hc}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x - 2} 50 h4 M${x - 2} 64 h4 M${x - 2} 78 h4" stroke="${oscurecer(hc, 0.7)}" stroke-width="1.2"/>`).join('');
    const pStreet = L.pantalon === 'street'; if (pStreet) L.pantalon = 'vaquero';
    const pc = pStreet ? '#2a2d34' : { chandal: '#4a5260', vaquero: '#3d5f9e', traje: '#2b2f3a', corto: rc, falda: rc }[L.pantalon] || '#4a5260';
    if (L.pantalon === 'corto') h += `<rect x="38" y="118" width="9" height="24" rx="4" fill="${sk}"/><rect x="53" y="118" width="9" height="24" rx="4" fill="${sk}"/><rect x="34" y="104" width="32" height="18" rx="4" fill="${pc}"/><line x1="50" y1="110" x2="50" y2="122" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`;
    else if (L.pantalon === 'falda') h += `<rect x="38" y="122" width="9" height="20" rx="4" fill="${sk}"/><rect x="53" y="122" width="9" height="20" rx="4" fill="${sk}"/><path d="M34 104 L66 104 L72 128 L28 128Z" fill="${pc}"/>`;
    else {
      h += `<rect x="36" y="104" width="13" height="38" rx="4" fill="${pc}"/><rect x="51" y="104" width="13" height="38" rx="4" fill="${pc}"/>`;
      if (L.pantalon === 'chandal') h += `<rect x="37" y="108" width="2" height="32" fill="#fff" opacity=".8"/><rect x="61" y="108" width="2" height="32" fill="#fff" opacity=".8"/>`;
      if (L.pantalon === 'vaquero' && !pStreet) h += `<path d="M42 108 v30 M58 108 v30" stroke="#f0c040" stroke-width="1" stroke-dasharray="2 2"/>`;
      if (pStreet) h += `<rect x="37" y="118" width="11" height="8" rx="2" fill="#3b3f4a"/><rect x="52" y="118" width="11" height="8" rx="2" fill="#3b3f4a"/><path d="M36 134 h13 M51 134 h13" stroke="#ff4f8b" stroke-width="2"/>`;
    }
    const zap = (col, extra) => `<rect x="31" y="139" width="19" height="10" rx="5" fill="${col}"/><rect x="50" y="139" width="19" height="10" rx="5" fill="${col}"/>${extra || ''}`;
    if (L.calzado === 'deportivas') h += zap('#ffffff', `<path d="M35 144 h10 M54 144 h10" stroke="${rc}" stroke-width="2.5"/><rect x="31" y="146" width="19" height="3" fill="#ccc"/><rect x="50" y="146" width="19" height="3" fill="#ccc"/>`);
    else if (L.calzado === 'botas') h += zap('#1d1d1f', `<path d="M34 150 v2 M40 150 v2 M46 150 v2 M54 150 v2 M60 150 v2 M66 150 v2" stroke="#999" stroke-width="2"/><path d="M36 143 h8 M55 143 h8" stroke="${c1}" stroke-width="2"/>`);
    else if (L.calzado === 'chanclas') h += `<rect x="38" y="139" width="9" height="8" rx="3" fill="#fff"/><rect x="53" y="139" width="9" height="8" rx="3" fill="#fff"/><rect x="31" y="147" width="19" height="3" rx="1.5" fill="#2f6fe0"/><rect x="50" y="147" width="19" height="3" rx="1.5" fill="#2f6fe0"/>`;
    else if (L.calzado === 'zapatos') h += zap('#5b3a1e', '<path d="M35 142 h6 M55 142 h6" stroke="#fff" stroke-width="1.5" opacity=".5"/>');
    else if (L.calzado === 'montana') h += zap('#7a5230', '<path d="M36 141 l4 3 M40 141 l4 3 M56 141 l4 3 M60 141 l4 3" stroke="#f6c623" stroke-width="1.5"/><rect x="31" y="146" width="19" height="3" fill="#2a2d34"/><rect x="50" y="146" width="19" height="3" fill="#2a2d34"/>');
    else if (L.calzado === 'botasPro') h += zap('#3d7bff', '<path d="M34 150 v2 M40 150 v2 M46 150 v2 M54 150 v2 M60 150 v2 M66 150 v2" stroke="#7fd8ff" stroke-width="2"/><path d="M35 143 h9 M55 143 h9" stroke="#ffc83d" stroke-width="2"/>');
    else if (L.calzado === 'debut') h += zap('#ff4f8b', '<path d="M35 143 h9 M55 143 h9" stroke="#ffc83d" stroke-width="2.5"/><path d="M34 150 v2 M40 150 v2 M46 150 v2 M54 150 v2 M60 150 v2 M66 150 v2" stroke="#1a1640" stroke-width="2"/>');
    else if (L.calzado === 'street') h += zap('#ffc83d', '<path d="M35 143 h10 M54 143 h10" stroke="#1a1640" stroke-width="2.5"/><rect x="31" y="146" width="19" height="3" fill="#fff"/><rect x="50" y="146" width="19" height="3" fill="#fff"/>');
    else if (L.calzado === 'pro') h += zap('#0b1033', '<path d="M35 143 h9 M55 143 h9" stroke="#3d7bff" stroke-width="2.5"/><path d="M34 150 v2 M40 150 v2 M46 150 v2 M54 150 v2 M60 150 v2 M66 150 v2" stroke="#8b5cf6" stroke-width="2"/>');
    else if (/^camp_/.test(L.calzado)) { const C = CAMPEON_PACK[L.calzado.slice(5)] || CAMPEON_PACK.copa; h += zap('#ffc83d', `<path d="M35 143 h9 M55 143 h9" stroke="${C.c1}" stroke-width="2.5"/><path d="M34 150 v2 M40 150 v2 M46 150 v2 M54 150 v2 M60 150 v2 M66 150 v2" stroke="${C.c1}" stroke-width="2"/><circle cx="46" cy="142" r="1.4" fill="#fff"/><circle cx="65" cy="142" r="1.4" fill="#fff"/>`); }
    else if (L.calzado === 'doradas') h += zap('#f5c518', '<path d="M35 142 h8 M54 142 h8" stroke="#fff" stroke-width="2" opacity=".8"/><rect x="31" y="146" width="19" height="3" fill="#c99a00"/><rect x="50" y="146" width="19" height="3" fill="#c99a00"/>');
    const largas = ['sudadera', 'chaqueta', 'plumas', 'traje'].includes(L.ropa), sinMangas = L.ropa === 'tirantes';
    const tc = RV && RV.tc ? RV.tc : L.ropa === 'equipacion' ? c1 : L.ropa === 'traje' ? '#2b2f3a' : L.ropa === 'marca' ? '#ffffff' : rc;
    // Brazos: cada uno en su grupo. La pose los gira desde el hombro; tatuajes, reloj, trofeo y maleta van con su brazo.
    const ca = xa + wa / 2, cb = xb - gb + wa / 2, tat = L.tatuaje;
    // Pose: [giro del brazo izquierdo, giro del derecho, ¿por delante del cuerpo?]
    const POSE = { saludo: [0, -128], abiertos: [26, -26], pro: [18, -168], empresario: [-38, 38, true], campeon: [152, -152] }[L.pose] || [0, 0];
    const recto = (x, y) => (POSE[1] ? ` rotate(${-POSE[1]} ${x} ${y})` : '');   // lo que lleva en la mano se queda derecho
    const tribal = c => `<path d="M${c - wa / 2 + .5} 99 h${wa - 1} M${c - wa / 2 + .5} 102 l2 -2 2 2 2 -2 2 2 2 -2" stroke="${tinta}" stroke-width="1.4" fill="none"/>`;
    const manga = x => (sinMangas ? '' : `<rect x="${x}" y="72" width="${wa}" height="${largas ? 34 : 16}" rx="5.5" fill="${tc}"/>`);
    let brL = `<rect x="${xa}" y="74" width="${wa}" height="34" rx="5.5" fill="${sk}"/>`, brR = `<rect x="${xb - gb}" y="74" width="${wa}" height="34" rx="5.5" fill="${sk}"/>`;
    if (tat === 'antebrazo' || tat === 'ambos') brL += `<path d="M${ca} 94 l1.6 3.3 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5Z" fill="none" stroke="${tinta}" stroke-width="1"/>`;
    if (tat === 'rosa') brL += `<circle cx="${ca}" cy="97" r="2.6" fill="#d6283b" stroke="${tinta}" stroke-width=".8"/><path d="M${ca} 99.5 v6 M${ca} 102 l-2.4 -1.6" stroke="${tinta}" stroke-width="1"/>`;
    if (tat === 'manga') brL += `<path d="M${xa + 1} 78 q${wa / 2} 4 ${wa - 2} 0 M${xa + 1} 86 q${wa / 2} 4 ${wa - 2} 0 M${xa + 1} 94 q${wa / 2} 4 ${wa - 2} 0 M${xa + 1} 102 q${wa / 2} 3 ${wa - 2} 0" stroke="${tinta}" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="${ca}" cy="90" r="2" fill="${tinta}" opacity=".85"/>`;
    if (tat === 'tribal') brL += tribal(ca);
    if (tat === 'tribal' || tat === 'ambos') brR += tribal(cb);
    brL += manga(xa) + `<circle cx="${ca}" cy="110" r="5.5" fill="${sk}"/>`;
    brR += manga(xb - gb) + `<circle cx="${cb}" cy="110" r="5.5" fill="${sk}"/>`;
    if (tat === 'mano') brR += `<path d="M${cb} 112.5 l-2.2 -2.2 a1.3 1.3 0 0 1 2.2 -1.3 a1.3 1.3 0 0 1 2.2 1.3Z" fill="${tinta}"/>`;
    const reloj = { reloj: '<rect x="20" y="100" width="11" height="5" rx="1.5" fill="#f5c518" stroke="#b08a00" stroke-width=".8"/>', relojDep: '<rect x="20" y="100" width="11" height="5" rx="1.5" fill="#1a1a1a"/><rect x="23" y="101" width="5" height="3" fill="#7fd8ff"/>',
      relojPro: '<rect x="20" y="100" width="11" height="5" rx="1.5" fill="#c9cfdb" stroke="#7d8597" stroke-width=".8"/><circle cx="25.5" cy="102.5" r="1.4" fill="#3d7bff"/>',
      relojPremium: '<rect x="19" y="99" width="13" height="7" rx="2" fill="#ffc83d" stroke="#c8901a" stroke-width=".8"/><path d="M25.5 100 l2 2.5 -2 2.5 -2 -2.5Z" fill="#fff"/>',
      relojLeg: '<rect x="18.5" y="98.5" width="14" height="8" rx="2.5" fill="#111" stroke="#ffc83d" stroke-width="1.2"/><circle cx="25.5" cy="102.5" r="2.6" fill="#ffc83d"/><path d="M25.5 101 v1.6 l1.2 .8" stroke="#111" stroke-width=".7"/><circle cx="30.5" cy="100" r=".9" fill="#7fd8ff"/>' }[L.extra];
    if (reloj) brL += `<g transform="translate(${xa - 20} 0)">${reloj}</g>`;
    if (copaX) brR += `<g transform="translate(${cb} 101)${recto(0, 8)}"><path d="M-7 -12 h14 v4 q0 8 -7 9 q-7 -1 -7 -9Z" fill="#ffc83d" stroke="#c8901a" stroke-width=".8"/><path d="M-7 -10 q-4 0 -4 3 q0 3 4 3 M7 -10 q4 0 4 3 q0 3 -4 3" fill="none" stroke="#ffc83d" stroke-width="1.4"/><rect x="-1.5" y="1" width="3" height="5" fill="#ffc83d"/><rect x="-5" y="6" width="10" height="3.5" rx="1" fill="${copaX.c1}"/><text x="0" y="-4" text-anchor="middle" font-size="5">${copaX.ic}</text></g>`;
    if (L.extra === 'maletaPro') brR += `<g transform="translate(${cb} 113)${recto(0, -3)}"><path d="M-4 0 v-3 h8 v3" stroke="#222" stroke-width="1.6" fill="none"/><rect x="-11" y="0" width="22" height="13" rx="3" fill="#0b1033"/><path d="M-11 5 h22" stroke="#3d7bff" stroke-width="2"/><path d="M-11 8 h22" stroke="#8b5cf6" stroke-width="1"/></g>`;
    const gL = POSE[0] ? `<g transform="rotate(${POSE[0]} ${ca} 77)">${brL}</g>` : brL, gR = POSE[1] ? `<g transform="rotate(${POSE[1]} ${cb} 77)">${brR}</g>` : brR;
    if (!POSE[2]) h += gL + gR;
    h += `<rect x="44" y="58" width="12" height="16" rx="4" fill="${sk}"/>`;
    if (tat === 'cuello') h += `<path d="M53 63 l1 2 2.2 .3 -1.6 1.5 .4 2.2 -2 -1 -2 1 .4 -2.2 -1.6 -1.5 2.2 -.3Z" fill="${tinta}"/>`;
    if (L.ropa === 'sudadera') h += `<path d="M34 72 Q50 56 66 72Z" fill="${rd}"/>`;
    const ancho = (L.ropa === 'plumas' ? 3 : 0) + dx;
    h += `<path d="M${30 - ancho} 78 Q${30 - ancho} 68 40 68 L60 68 Q${70 + ancho} 68 ${70 + ancho} 78 L${70 + ancho} 110 L${30 - ancho} 110Z" fill="${tc}"/>`;
    if (['camiseta', 'marca', 'equipacion', 'tirantes'].includes(L.ropa)) h += `<path d="M43 68 Q50 ${L.ropa === 'tirantes' ? 80 : 75} 57 68Z" fill="${sk}"/>`;
    if (L.ropa === 'tirantes') h += `<path d="M30 70 h6 M64 70 h6" stroke="${sk}" stroke-width="5"/>`;
    if (L.ropa === 'equipacion') h += `<rect x="38" y="70" width="5" height="40" fill="${c2}" opacity=".9"/><rect x="57" y="70" width="5" height="40" fill="${c2}" opacity=".9"/><text x="50" y="100" text-anchor="middle" font-size="15" font-weight="900" fill="${c2}" stroke="${c1}" stroke-width=".6" font-family="Arial,sans-serif">${RV && RV.num ? RV.num : '10'}</text>`;
    if (L.ropa === 'marca') { const t = marca ? marca.n.split(' ')[0].toUpperCase() : '★'; h += `<text x="50" y="94" text-anchor="middle" font-size="${t.length > 9 ? 5.5 : t.length > 6 ? 7 : 9}" font-weight="900" fill="${rc === '#f4f4f4' ? '#e23b3b' : rc}" font-family="Arial,sans-serif">${esc(t)}</text>`; }
    if (L.ropa === 'sudadera') h += `<rect x="40" y="94" width="20" height="10" rx="3" fill="${rd}"/><path d="M46 72 v10 M54 72 v10" stroke="#fff" stroke-width="1.2"/>`;
    if (L.ropa === 'chaqueta') h += `<line x1="50" y1="70" x2="50" y2="110" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><path d="M40 68 L50 78 L60 68" fill="none" stroke="${rd}" stroke-width="3"/>`;
    if (L.ropa === 'plumas') h += `<path d="M27 82 h46 M27 92 h46 M27 102 h46" stroke="rgba(0,0,0,.2)" stroke-width="2"/><path d="M42 68 Q50 74 58 68" fill="none" stroke="${rd}" stroke-width="4"/>`;
    if (L.ropa === 'hawaiana') h += `${[[38, 82], [60, 78], [46, 98], [64, 100], [34, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/><circle cx="${x}" cy="${y}" r="1.4" fill="#f6c623"/>`).join('')}<path d="M42 68 L50 80 L58 68" fill="none" stroke="#fff" stroke-width="2"/>`;
    if (L.ropa === 'traje') h += `<path d="M43 68 L50 86 L57 68Z" fill="#fff"/><path d="M49 72 L51 72 L52.5 90 L50 94 L47.5 90Z" fill="#d6283b"/><path d="M43 68 L48 92 M57 68 L52 92" stroke="#444b5c" stroke-width="2"/>`;
    if (RV && RV.ad) h += RV.ad;
    if (mochilaC) h += `<path d="M37 70 L38 108 M63 70 L62 108" stroke="${mochilaC}" stroke-width="4"/>${L.extra === 'mochilaStreet' ? '<circle cx="62" cy="96" r="3" fill="#ffc83d"/>' : clubX ? `<text x="62" y="99" text-anchor="middle" font-size="6">${clubX.ic}</text>` : ''}`;
    if (/^bufanda_/.test(L.extra) && clubX) h += `<path d="M36 68 Q50 78 64 68 L64 74 Q50 84 36 74Z" fill="${clubX.c2}" stroke="${clubX.c1}" stroke-width="1.2"/><path d="M40 71.5 Q50 78.5 60 71.5" stroke="${clubX.c1}" stroke-width="2" fill="none"/><rect x="56" y="74" width="8" height="22" fill="${clubX.c2}" stroke="${clubX.c1}" stroke-width="1.2"/><path d="M56 80 h8 M56 86 h8 M56 92 h8" stroke="${clubX.c1}" stroke-width="2.4"/><path d="M57 96 v3.5 M60 96 v3.5 M63 96 v3.5" stroke="${clubX.c1}" stroke-width="1.2"/>`;
    if (L.extra === 'insigniaMag') h += `<circle cx="61" cy="80" r="5.5" fill="#0d0d12" stroke="#ffc83d" stroke-width="1.5"/><path d="M57.5 83 v-4 h1.6 v-2.5 h1.6 v-2 h1.6 v3 h1.6 v5.5Z" fill="#ffc83d"/>`;
    if (POSE[2]) h += gL + gR;
    if (L.extra === 'cadenaExcl') h += `<path d="M39 70 Q50 92 61 70" fill="none" stroke="#ffc83d" stroke-width="3.5"/><path d="M50 84 l5 6 -5 6 -5 -6Z" fill="#7fd8ff" stroke="#ffc83d" stroke-width="1.2"/>`;
    if (L.extra === 'insignia') h += `<circle cx="61" cy="80" r="5" fill="#1a1640" stroke="#ffc83d" stroke-width="1.5"/><path d="M61 76.5 l1.2 2.5 2.7 .3 -2 1.8 .6 2.7 -2.5 -1.4 -2.5 1.4 .6 -2.7 -2 -1.8 2.7 -.3Z" fill="#ffc83d"/>`;
    if (L.extra === 'cadena') h += `<path d="M41 70 Q50 88 59 70" fill="none" stroke="#f5c518" stroke-width="2.5"/><circle cx="50" cy="83" r="3.2" fill="#f5c518"/>`;
    if (L.extra === 'medalla') h += `<path d="M42 68 L50 86 L58 68" fill="none" stroke="#2f6fe0" stroke-width="3.5"/><circle cx="50" cy="90" r="6.5" fill="#f5c518" stroke="#b08a00"/><text x="50" y="93" text-anchor="middle" font-size="8" font-weight="900" fill="#b08a00">1</text>`;
    if (L.extra === 'balon') h += `<circle cx="84" cy="141" r="9" fill="#fff" stroke="#333" stroke-width="1"/><path d="M84 137 l3.5 2.5 -1.3 4 h-4.4 l-1.3 -4Z" fill="#333"/>`;
    h += `<circle cx="25" cy="42" r="5" fill="${sk}"/><circle cx="75" cy="42" r="5" fill="${sk}"/><circle cx="50" cy="40" r="25" fill="${sk}"/>`;
    if (L.cara === 'barba') h += `<path d="M27 44 Q30 70 50 70 Q70 70 73 44 Q70 58 60 56 Q50 62 40 56 Q30 58 27 44Z" fill="${hc}"/>`;
    h += `<circle cx="35" cy="50" r="4" fill="#ff7b7b" opacity=".3"/><circle cx="65" cy="50" r="4" fill="#ff7b7b" opacity=".3"/>`;
    const ed = L.edad, arr = oscurecer(sk, 0.72);
    if (ed === 'adulto' || ed === 'maduro' || ed === 'veterano') h += `<path d="M41 51 q-2 4 0 7 M59 51 q2 4 0 7" stroke="${arr}" stroke-width="1" fill="none" opacity=".6"/>`;
    if (ed === 'maduro' || ed === 'veterano') h += `<path d="M40 22 q10 -3 20 0 M42 26 q8 -2 16 0" stroke="${arr}" stroke-width="1" fill="none" opacity=".55"/><path d="M29 43 l-3 -2 M29 46 l-3 1 M71 43 l3 -2 M71 46 l3 1" stroke="${arr}" stroke-width="1" opacity=".6"/>`;
    if (ed === 'veterano') h += `<path d="M33 49 q2 2 5 2 M62 51 q3 0 5 -2" stroke="${arr}" stroke-width="1" fill="none" opacity=".6"/>`;
    const rg = L.rasgo;
    if (rg === 'sonrojo') h += `<circle cx="35" cy="50" r="5" fill="#ff5a6e" opacity=".4"/><circle cx="65" cy="50" r="5" fill="#ff5a6e" opacity=".4"/>`;
    if (rg === 'pecasFuertes') h += [[36, 47], [39, 49], [42, 47], [35, 51], [40, 52], [58, 47], [61, 49], [64, 47], [60, 52], [65, 51], [47, 46], [53, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#b5651d"/>`).join('');
    if (rg === 'lunar') h += `<circle cx="61" cy="55" r="1.3" fill="#3b2412"/>`;
    if (rg === 'ojeras') h += `<path d="M34 48 q5 3 10 0 M56 48 q5 3 10 0" stroke="#7a6a9a" stroke-width="1.4" fill="none" opacity=".5"/>`;
    if (rg === 'lagrima') h += `<path d="M36 50 q-1.5 2.5 0 4 q1.5 -1.5 0 -4Z" fill="${tinta}"/>`;
    if (L.cara === 'pecas') h += [[40, 49], [43, 51], [38, 52], [60, 49], [57, 51], [62, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#b5651d"/>`).join('');
    if (L.cara === 'pintura') h += `<path d="M30 47 h9 M30 51 h9 M61 47 h9 M61 51 h9" stroke="${O ? c1 : rc}" stroke-width="2.2" stroke-linecap="round"/>`;
    const iris = COLOR_OJOS[L.colorOjos] || COLOR_OJOS.marron;
    const ojoNormal = x => {
      const f = L.ojos;
      if (f === 'grandes') return `<ellipse cx="${x}" cy="43" rx="4.4" ry="5" fill="#fff" stroke="#222" stroke-width=".8"/><circle cx="${x + .5}" cy="43.5" r="3.2" fill="${iris}"/><circle cx="${x + .5}" cy="43.5" r="1.6" fill="#111"/><circle cx="${x + 1.6}" cy="42" r="1.1" fill="#fff"/>`;
      if (f === 'almendrados') return `<path d="M${x - 4.5} 43.5 Q${x} 38.5 ${x + 4.5} 43 Q${x} 46.5 ${x - 4.5} 43.5Z" fill="#fff" stroke="#222" stroke-width="1"/><circle cx="${x}" cy="43" r="2.2" fill="${iris}"/><circle cx="${x}" cy="43" r="1.1" fill="#111"/><circle cx="${x + .8}" cy="42.2" r=".6" fill="#fff"/>`;
      if (f === 'pequenos') return `<circle cx="${x}" cy="43" r="2.3" fill="${iris}"/><circle cx="${x}" cy="43" r="1.2" fill="#111"/><circle cx="${x + .7}" cy="42.3" r=".6" fill="#fff"/>`;
      if (f === 'caidos') return `<circle cx="${x}" cy="44" r="3.2" fill="${iris}"/><circle cx="${x}" cy="44" r="1.6" fill="#111"/><circle cx="${x + 1}" cy="43" r=".9" fill="#fff"/><path d="M${x - 4} 41.5 Q${x} 40 ${x + 4} 42" stroke="#222" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      const p = `<circle cx="${x}" cy="43" r="3.3" fill="${iris}"/><circle cx="${x}" cy="43" r="1.8" fill="#111"/><circle cx="${x + 1}" cy="42" r="1" fill="#fff"/>`;
      return f === 'pestanas' ? p + `<path d="M${x - 3.5} 40 l-1.5 -2 M${x} 39.4 v-2.4 M${x + 3.5} 40 l1.5 -2" stroke="#222" stroke-width="1.2" stroke-linecap="round"/>` : p;
    };
    const ojo = x => ene < 25 ? `<path d="M${x - 4} 44 h8" stroke="#222" stroke-width="2.4" stroke-linecap="round"/>`
      : fel > 75 ? `<path d="M${x - 4} 45 Q${x} 39 ${x + 4} 45" stroke="#222" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        : ojoNormal(x);
    h += ojo(39) + ojo(61);
    const ce = L.cejas, cw = { finas: 1.2, gruesas: 3.4 }[ce] || 2, cc = ['canoso', 'blanco', 'platino'].includes(L.colorPelo) ? '#9a9a9a' : hc;
    if (fel < 40) h += `<path d="M34 35 l7 -2 M66 35 l-7 -2" stroke="${cc}" stroke-width="${cw}" stroke-linecap="round"/>`;
    else if (ce === 'arqueadas') h += `<path d="M34 35 q4 -6 9 -1 M57 34 q5 -5 9 1" stroke="${cc}" stroke-width="${cw}" fill="none" stroke-linecap="round"/>`;
    else if (ce === 'rectas') h += `<path d="M34 34 h9 M57 34 h9" stroke="${cc}" stroke-width="${cw + .4}" stroke-linecap="round"/>`;
    else h += `<path d="M34 34 q5 -3 9 0 M57 34 q5 -3 9 0" stroke="${cc}" stroke-width="${cw}" fill="none" stroke-linecap="round"/>`;
    if (ce === 'corte') h += `<path d="M61 31.5 l1.5 4" stroke="${sk}" stroke-width="1.6"/>`;
    if (rg === 'cicatriz') h += `<path d="M36 30 l5 9" stroke="#e7a3a3" stroke-width="1.4" stroke-linecap="round"/><path d="M37 32 l2 -1 M38.5 35 l2 -1" stroke="#e7a3a3" stroke-width="1"/>`;
    if (ene < 25) h += `<path d="M34 48 q5 3 9 0 M57 48 q5 3 9 0" stroke="#7a6a9a" stroke-width="1.2" fill="none" opacity=".7"/>`;
    h += fel > 65 ? `<path d="M41 52 Q50 63 59 52Z" fill="#7a2a2a"/><path d="M44 57 Q50 61 56 57" fill="#ff7b8a"/>`
      : fel >= 40 ? `<path d="M43 54 Q50 59 57 54" stroke="#5a2a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        : `<path d="M43 58 Q50 52 57 58" stroke="#5a2a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    if (fel < 25) h += `<path d="M65 47 q2 4 0 6 q-2 -2 0 -6Z" fill="#59b7ff"/>`;
    if (rg === 'hoyuelos') h += `<path d="M39 54 q-1 2 0 3 M61 54 q1 2 0 3" stroke="${arr}" stroke-width="1.2" fill="none"/>`;
    if (L.cara === 'bigote') h += `<path d="M41 51 Q50 46 59 51 Q50 54 41 51Z" fill="${hc}"/>`;
    if (L.cara === 'perilla') h += `<path d="M46 61 L54 61 L50 69Z" fill="${hc}"/>`;
    if (s && s.p && s.p.lesion > 0) h += `<g transform="rotate(-20 60 28)"><rect x="52" y="25" width="17" height="6" rx="3" fill="#f3c89a" stroke="#c99a6a" stroke-width=".8"/><path d="M58 26 v4 M62 26 v4" stroke="#c99a6a" stroke-width=".6"/></g>`;
    const flequillo = `<path d="M24 42 Q22 14 50 13 Q78 14 76 42 Q72 28 62 26 Q50 32 36 26 Q28 30 24 42Z" fill="${hc}"/>`;
    if (['corto', 'coleta', 'trenzas', 'mono', 'largo'].includes(L.pelo)) h += flequillo;
    else if (L.pelo === 'rizos') h += [[28, 30], [36, 20], [46, 16], [56, 16], [65, 20], [72, 30], [25, 40], [75, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${hc}"/>`).join('');
    else if (L.pelo === 'rapado') h += `<path d="M26 36 Q28 16 50 15 Q72 16 74 36 Q66 22 50 22 Q34 22 26 36Z" fill="${hc}" opacity=".55"/>` + (pelo2 === 'degradado' ? `<path d="M32 26 Q36 8 52 8 Q68 9 70 24 Q60 16 50 18 Q40 18 32 26Z" fill="${hc}"/>` : '');
    else if (L.pelo === 'calvo') h += `<ellipse cx="40" cy="24" rx="6" ry="3" fill="#fff" opacity=".35"/>`;
    else if (L.pelo === 'tupe') h += `<path d="M24 42 Q22 18 46 15 Q40 2 62 3 Q82 6 76 24 Q78 32 76 42 Q70 26 50 26 Q32 28 24 42Z" fill="${hc}"/>`;
    else if (L.pelo === 'afro') h += `<path d="M26 34 Q50 16 74 34 Q50 26 26 34Z" fill="${hc}"/>`;
    else if (L.pelo === 'bob') h += `<path d="M24 44 Q20 12 50 12 Q80 12 76 44 Q72 26 50 24 Q30 26 24 44Z" fill="${hc}"/><path d="M28 30 Q40 20 56 22" stroke="#fff" stroke-width="1.5" opacity=".25" fill="none"/>`;
    else if (L.pelo === 'rastas') h += `<path d="M24 40 Q22 14 50 13 Q78 14 76 40 Q70 24 50 24 Q30 24 24 40Z" fill="${hc}"/>` + [36, 43, 50, 57, 64].map(x => `<path d="M${x} 19 v6" stroke="${oscurecer(hc, 0.7)}" stroke-width="1.2"/>`).join('');
    else if (L.pelo === 'raya') h += `<path d="M24 42 Q22 14 50 13 Q78 14 76 42 Q74 26 60 22 L58 16 Q46 26 30 28 Q26 32 24 42Z" fill="${hc}"/><path d="M58 15.5 l-1 4.5" stroke="${oscurecer(hc, 0.6)}" stroke-width="1.2"/>`;
    else if (L.pelo === 'mohicano') h += `<path d="M26 36 Q28 16 50 15 Q72 16 74 36 Q66 22 50 22 Q34 22 26 36Z" fill="${hc}" opacity=".35"/><path d="M43 26 Q42 6 50 2 Q58 6 57 26Z" fill="${hc}"/>`;
    else if (L.pelo === 'mono2') h += flequillo;
    else if (L.pelo === 'cresta') h += `<path d="M26 36 Q28 16 50 15 Q72 16 74 36 Q66 22 50 22 Q34 22 26 36Z" fill="${hc}" opacity=".5"/><path d="M42 26 L38 -2 L48 10 L50 -8 L54 10 L64 -2 L58 26Z" fill="${hc}"/>`;
    if ((ed === 'maduro' || ed === 'veterano') && !['calvo', 'canoso', 'blanco', 'platino'].includes(L.pelo === 'calvo' ? 'calvo' : L.colorPelo)) h += `<path d="M25 38 q1 -6 4 -9 M75 38 q-1 -6 -4 -9" stroke="#d8d8d8" stroke-width="${ed === 'veterano' ? 4 : 2.5}" stroke-linecap="round" opacity=".9"/>`;
    // Piercings (encima del pelo para que se vean)
    const pc2 = '#c9cfdb', pg = '#ffc83d', pi = L.piercing, aro = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#5a4a2a" stroke-width="2.6"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    if (pi === 'oreja' || pi === 'combo') h += aro(75.5, 48.5, 3, pg);
    if (pi === 'orejas') h += aro(75.5, 48.5, 3, pg) + aro(24.5, 48.5, 3, pg) + `<circle cx="78" cy="40" r="1.4" fill="${pc2}" stroke="#555" stroke-width=".5"/><circle cx="79" cy="44" r="1.4" fill="${pc2}" stroke="#555" stroke-width=".5"/><circle cx="22" cy="41" r="1.4" fill="${pc2}" stroke="#555" stroke-width=".5"/>`;
    if (pi === 'nariz' || pi === 'combo') h += aro(54, 50.5, 2.2, pc2);
    if (pi === 'septum') h += `<path d="M47.5 50 q2.5 4.5 5 0" stroke="#555" stroke-width="2.6" fill="none"/><path d="M47.5 50 q2.5 4.5 5 0" stroke="${pc2}" stroke-width="1.6" fill="none"/>`;
    if (pi === 'ceja') h += `<circle cx="64.5" cy="30.5" r="1.5" fill="${pc2}" stroke="#555" stroke-width=".5"/><circle cx="65.8" cy="35.5" r="1.5" fill="${pc2}" stroke="#555" stroke-width=".5"/>`;
    if (pi === 'labio') h += aro(54.5, 60, 2.2, pc2);
    if (L.gafas === 'redondas') h += `<circle cx="39" cy="43" r="7" fill="rgba(255,255,255,.15)" stroke="#222" stroke-width="2"/><circle cx="61" cy="43" r="7" fill="rgba(255,255,255,.15)" stroke="#222" stroke-width="2"/><path d="M46 43 h8 M32 42 l-6 -2 M68 42 l6 -2" stroke="#222" stroke-width="2"/>`;
    else if (L.gafas === 'sol') h += `<rect x="30" y="37" width="17" height="11" rx="4" fill="#111"/><rect x="53" y="37" width="17" height="11" rx="4" fill="#111"/><path d="M47 41 h6 M30 40 l-5 -1 M70 40 l5 -1" stroke="#111" stroke-width="2"/><path d="M33 40 l4 0" stroke="#fff" stroke-width="1.5" opacity=".6"/>`;
    else if (L.gafas === 'temporada') h += `<rect x="30" y="37" width="17" height="11" rx="4" fill="#2a1a78" stroke="#d94bff" stroke-width="2"/><rect x="53" y="37" width="17" height="11" rx="4" fill="#2a1a78" stroke="#d94bff" stroke-width="2"/><path d="M47 41 h6" stroke="#d94bff" stroke-width="2"/><path d="M33 40 l5 0 M56 40 l5 0" stroke="#7fd8ff" stroke-width="1.5"/>`;
    else if (L.gafas === 'pro') h += `<path d="M29 38 h18 l-2 9 q-7 3 -14 0Z M53 38 h18 l-2 9 q-7 3 -14 0Z" fill="#3a2d10" stroke="#ffc83d" stroke-width="1.5"/><path d="M47 40 h6" stroke="#ffc83d" stroke-width="1.5"/>`;
    else if (L.gafas === 'street') h += `<rect x="30" y="37" width="17" height="11" rx="5.5" fill="#ff4f8b" opacity=".85" stroke="#ffc83d" stroke-width="2"/><rect x="53" y="37" width="17" height="11" rx="5.5" fill="#ff4f8b" opacity=".85" stroke="#ffc83d" stroke-width="2"/><path d="M47 41 h6 M30 40 l-5 -1 M70 40 l5 -1" stroke="#ffc83d" stroke-width="2"/>`;
    else if (L.gafas === 'lux') h += `<path d="M29 38 h18 q0 10 -9 10 q-9 0 -9 -10Z M53 38 h18 q0 10 -9 10 q-9 0 -9 -10Z" fill="#5a3d0a" opacity=".9" stroke="#ffc83d" stroke-width="1.6"/><path d="M47 39 q3 -2 6 0 M29 38 l-4 -1 M71 38 l4 -1" stroke="#ffc83d" stroke-width="1.6" fill="none"/>`;
    else if (L.gafas === 'deportivas') h += `<path d="M26 39 Q50 32 74 39 L72 48 Q50 43 28 48Z" fill="#ff5a1f"/><path d="M30 41 Q50 36 70 41" stroke="#fff" stroke-width="1.2" opacity=".6" fill="none"/>`;
    else if (L.gafas === 'corazon') { const co = x => `<path d="M${x} 49 l-7 -7 a4 4 0 0 1 7 -4 a4 4 0 0 1 7 4Z" fill="#ff2d6f"/>`; h += co(39) + co(61) + `<path d="M46 42 h8" stroke="#ff2d6f" stroke-width="1.5"/>`; }
    if (L.cabeza === 'gorra') { const g1 = CV || rc, g2 = CV ? oscurecer(CV, 0.7) : rd; h += `<path d="M24 34 Q24 9 50 9 Q76 9 76 34Z" fill="${g1}"/><path d="M50 30 Q80 26 92 35 Q72 38 50 34Z" fill="${g2}"/><circle cx="50" cy="10" r="2.5" fill="${g2}"/>${CV === '#1a1640' ? '<path d="M44 24 h12" stroke="#ffc83d" stroke-width="2.5"/>' : ''}`; }
    else if (L.cabeza === 'gorro') h += `<path d="M23 36 Q23 5 50 5 Q77 5 77 36Z" fill="${rc}"/><rect x="22" y="29" width="56" height="9" rx="4" fill="${rd}"/><circle cx="50" cy="4" r="6" fill="#fff"/>`;
    else if (L.cabeza === 'cinta') h += `<path d="M25 30 Q50 22 75 30 L75 36 Q50 28 25 36Z" fill="${rc}"/>`;
    else if (L.cabeza === 'fiesta') h += `<path d="M38 18 L50 -14 L62 18Z" fill="#ff6fb5"/><path d="M41 10 L59 10 M44 2 L56 2" stroke="#f6c623" stroke-width="3"/><circle cx="50" cy="-14" r="4" fill="#f6c623"/>`;
    else if (L.cabeza === 'vaquero') h += `<path d="M32 22 Q32 2 50 5 Q68 2 68 22Z" fill="#8a5a2b"/><ellipse cx="50" cy="22" rx="38" ry="6" fill="#6b4422"/><rect x="32" y="16" width="36" height="4" fill="#2a2d34"/>`;
    else if (L.cabeza === 'corona') h += `<path d="M31 21 L33 1 L42 11 L50 -4 L58 11 L67 1 L69 21Z" fill="#f5c518" stroke="#b08a00" stroke-width="1"/><circle cx="50" cy="15" r="2.5" fill="#e23b3b"/><circle cx="40" cy="16" r="2" fill="#2f6fe0"/><circle cx="60" cy="16" r="2" fill="#22a35a"/>`;
    if (L.extra === 'auriculares' || L.extra === 'auriPro') { const pro = L.extra === 'auriPro', ac = pro ? '#0b1033' : rc; h += `<path d="M23 42 Q23 7 50 7 Q77 7 77 42" fill="none" stroke="${pro ? '#ffc83d' : '#2a2d34'}" stroke-width="5"/><rect x="17" y="35" width="10" height="16" rx="4" fill="${ac}"/><rect x="73" y="35" width="10" height="16" rx="4" fill="${ac}"/>${pro ? '<circle cx="22" cy="43" r="2.2" fill="#3d7bff"/><circle cx="78" cy="43" r="2.2" fill="#3d7bff"/>' : ''}`; }
    return `<svg viewBox="${VISTA_LOOK[modo] || VISTA_LOOK.cuerpo}" class="avatar" aria-hidden="true">${h}</svg>`;
  }

  Object.assign(P2, { LOOK_INICIAL, CAPAS_LOOK: CAPAS, GRUPOS_LOOK, COLOR_OJOS, ITEMS_LOOK: ITEMS, COLOR_PELO, COLOR_ROPA, PIEL, itemLook, bloqueoLook, ponerLook, lookAzar, validarLook, avatarSVG });
})(globalThis.P2 = globalThis.P2 || {});
