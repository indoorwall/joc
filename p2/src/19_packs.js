/* =====================================================================
   19 · PACKS: qué trae cada pack (ropa, poses, aspecto de vehículos, decoración de casa y despacho, insignias
   y vitrina). SOLO aspecto: nada de esto toca nivel, reputación, marca, dinero ni resultados.
   Quien decide si lo tienes es la CUENTA (P2.premiumOk → entitlements del servidor), nunca la partida.
   ===================================================================== */
(function (P2) {
  'use strict';
  const ok = k => P2.premiumOk(k);
  const CL = P2.CLUBES_PACK, CP = P2.CAMPEON_PACK;

  // ---------- Aspecto de los vehículos (se ganan jugando; el pack solo cambia el color) ----------
  const SKINS_VEHICULO = {
    bici: [{ id: 'normal', n: 'De serie', c: '#3d7bff' }, { id: 'street', n: 'Street (rosa y amarillo)', c: '#ff4f8b', f: '#ffc83d', premium: 'street' }],
    moto: [{ id: 'normal', n: 'De serie', c: '#ff4f8b' }],
    cocheUsado: [{ id: 'normal', n: 'De serie', c: '#8fa3c7' }, { id: 'pro', n: 'Pro (azul con franjas)', c: '#14206b', f: '#3d7bff', premium: 'pro' },
      { id: 'negra', n: 'Negro mate Luxury', c: '#1b1b22', f: '#ffc83d', premium: 'luxury' }],
    deportivo: [{ id: 'normal', n: 'De serie', c: '#e23b3b' }, { id: 'pro', n: 'Pro (azul con franjas)', c: '#14206b', f: '#3d7bff', premium: 'pro' },
      { id: 'negra', n: 'Negro mate Luxury', c: '#1b1b22', f: '#ffc83d', premium: 'luxury' }, { id: 'oro', n: 'Oro Magnate', c: '#ffc83d', f: '#111111', premium: 'magnate' }],
    superdeportivo: [{ id: 'normal', n: 'De serie', c: '#ffc83d' }, { id: 'oro', n: 'Negro y oro Magnate', c: '#0d0d12', f: '#ffc83d', premium: 'magnate' }],
  };
  const skinDe = (veh, id) => (SKINS_VEHICULO[veh] || []).find(k => k.id === id) || null;
  function bloqueoSkin(veh, id) { const k = skinDe(veh, id); if (!k) return 'No existe'; return !k.premium || ok(k.premium) ? null : `💎 ${P2.PACK_NOMBRE[k.premium]} (Premium)`; }
  function ponerSkin(s, uid, id) {
    const it = (s.inventario || []).find(x => x.uid === uid); if (!it || bloqueoSkin(it.id, id)) return false;
    it.skin = id === 'normal' ? undefined : id; return true;
  }

  // ---------- Decoración (casa y despacho) ----------
  const DECOR = {
    casa: [{ id: 'nada', n: 'Como está' }, { id: 'plantas', n: 'Plantas y cojines' }, { id: 'lujo', n: 'Decoración Luxury', premium: 'luxury' },
      { id: 'mansion', n: 'Decoración de mansión', premium: 'magnate' }, { id: 'founder', n: 'Placa conmemorativa Founder', premium: 'founder' }]
      .concat(Object.entries(CL).map(([k, C]) => ({ id: `club_${k}`, n: `Rincón ${C.n}`, premium: `club_${k}` })),
        Object.entries(CP).map(([k, C]) => ({ id: `trofeo_${k}`, n: `Réplica del trofeo · ${C.n}`, premium: `champ_${k}` }))),
    despacho: [{ id: 'nada', n: 'Básico' }, { id: 'plantas', n: 'Con plantas' }, { id: 'lujo', n: 'Despacho Luxury', premium: 'luxury' }, { id: 'magnate', n: 'Despacho premium Magnate', premium: 'magnate' }],
  };
  const decoDe = (tipo, id) => (DECOR[tipo] || []).find(d => d.id === id) || null;
  function bloqueoDeco(tipo, id) { const d = decoDe(tipo, id); if (!d) return 'No existe'; return !d.premium || ok(d.premium) ? null : `💎 ${P2.PACK_NOMBRE[d.premium]} (Premium)`; }
  function deco(s) { const d = s.deco && typeof s.deco === 'object' ? s.deco : (s.deco = {}); if (!decoDe('casa', d.casa)) d.casa = 'nada'; if (!decoDe('despacho', d.despacho)) d.despacho = 'nada'; return d; }
  function ponerDeco(s, tipo, id) { if (bloqueoDeco(tipo, id)) return false; deco(s)[tipo] = id; return true; }

  // ---------- Qué trae cada pack (por SKU del catálogo) ----------
  // equipar: lo que se pone al comprarlo · skins: [vehículo, aspecto] · deco: [casa|despacho, id]
  const PACKS = {
    pack_debut: { equipar: [['ropa', 'debut'], ['calzado', 'debut'], ['cabeza', 'gorraDebut'], ['fondo', 'debut']] },
    pack_street: { equipar: [['ropa', 'street'], ['pantalon', 'street'], ['calzado', 'street'], ['cabeza', 'gorraStreet'], ['gafas', 'street'], ['extra', 'mochilaStreet'], ['fondo', 'urbano'], ['pose', 'saludo']],
      skins: [['bici', 'street']] },
    pack_pro: { equipar: [['ropa', 'pro'], ['calzado', 'pro'], ['extra', 'maletaPro'], ['fondo', 'vestPro'], ['pose', 'pro']], tambien: [['ropa', 'casualPro'], ['extra', 'relojPro'], ['extra', 'auriPro'], ['fondo', 'estadio'], ['gafas', 'pro'], ['pelo', 'degradado']],
      skins: [['cocheUsado', 'pro'], ['deportivo', 'pro']] },
    pack_luxury: { equipar: [['ropa', 'trajeLux'], ['pantalon', 'traje'], ['calzado', 'zapatos'], ['gafas', 'lux'], ['extra', 'relojPremium'], ['fondo', 'rooftop'], ['pose', 'empresario']], tambien: [['extra', 'cadenaExcl'], ['fondo', 'premium']],
      skins: [['cocheUsado', 'negra'], ['deportivo', 'negra']], deco: [['casa', 'lujo'], ['despacho', 'lujo']] },
    pack_magnate: { equipar: [['ropa', 'magnate'], ['pantalon', 'traje'], ['calzado', 'zapatos'], ['extra', 'relojLeg'], ['fondo', 'skyline']], tambien: [['extra', 'insigniaMag']],
      skins: [['deportivo', 'oro'], ['superdeportivo', 'oro']], deco: [['casa', 'mansion'], ['despacho', 'magnate']] },
    founder_pack: { equipar: [['ropa', 'founder'], ['extra', 'insignia'], ['fondo', 'founder']], deco: [['casa', 'founder']] },
  };
  for (const k of Object.keys(CL)) PACKS[`club_pack_${k}`] = { equipar: [['ropa', `clubCam_${k}`], ['extra', `bufanda_${k}`], ['fondo', `club_${k}`]], tambien: [['ropa', `clubChaq_${k}`], ['extra', `mochila_${k}`]], deco: [['casa', `club_${k}`]] };
  for (const k of Object.keys(CP)) PACKS[`champion_pack_${k}`] = { equipar: [['ropa', `camp_${k}`], ['calzado', `camp_${k}`], ['extra', `trofeo_${k}`], ['fondo', `camp_${k}`], ['pose', 'campeon']], deco: [['casa', `trofeo_${k}`]] };

  // Insignias (junto a tu semana) y vitrina (en «Mi historia»): se ven si la cuenta tiene el pack
  const INSIGNIAS = [['founder', '🏅', 'Founder'], ['magnate', '🏙️', 'Magnate'], ['debut', '🌟', 'Debut']]
    .concat(Object.entries(CP).map(([k, C]) => [`champ_${k}`, C.ic, `Campeón · ${C.n}`]));
  const VITRINA = [['debut', '⚽', 'Balón firmado de tu debut'], ['founder', '🏛️', 'Placa conmemorativa Founder'], ['magnate', '🗝️', 'Llave de oro de la ciudad']]
    .concat(Object.entries(CL).map(([k, C]) => [`club_${k}`, C.ic, `Camiseta firmada y enmarcada de ${C.n}`]), Object.entries(CP).map(([k, C]) => [`champ_${k}`, C.ic, `Réplica del trofeo · ${C.n}`]));

  // Al comprar: te pone lo principal del pack, y el aspecto/decoración donde ya tengas el vehículo o la casa
  function equiparPack(s, sku) {
    const K = PACKS[sku]; if (!K || !s) return false;
    for (const [cap, id] of K.equipar || []) P2.ponerLook(s, cap, id);
    for (const [veh, sk] of K.skins || []) for (const it of (s.inventario || []).filter(x => x.id === veh)) ponerSkin(s, it.uid, sk);
    for (const [tipo, id] of K.deco || []) ponerDeco(s, tipo, id);
    return true;
  }
  // Si la cuenta ya no tiene un pack (reembolso, otra cuenta): lo que llevabas de ese pack vuelve a lo básico.
  // Nunca toca nada más de la partida.
  function limpiarPremium(s) {
    if (!s) return;
    if (s.look) for (const [cap] of P2.CAPAS_LOOK) { const it = P2.itemLook(cap, s.look[cap]); if (it && P2.bloqueoLook(s, it, cap)) s.look[cap] = P2.LOOK_INICIAL[cap]; }
    for (const it of s.inventario || []) if (it.skin && bloqueoSkin(it.id, it.skin)) it.skin = undefined;
    const d = deco(s); for (const t of ['casa', 'despacho']) if (bloqueoDeco(t, d[t])) d[t] = 'nada';
  }
  // Lo que aparece en la ficha del producto para ver cómo queda ANTES de pagar
  function lookPack(s, sku) { const K = PACKS[sku], L = Object.assign({}, P2.LOOK_INICIAL, (s && s.look) || {}); if (K) for (const [cap, id] of K.equipar || []) L[cap] = id; return L; }

  Object.assign(P2, { SKINS_VEHICULO, DECOR, PACKS, INSIGNIAS_PACK: INSIGNIAS, VITRINA_PACK: VITRINA, skinDe, bloqueoSkin, ponerSkin, decoDe, bloqueoDeco, ponerDeco, deco, equiparPack, limpiarPremium, lookPack });
})(globalThis.P2 = globalThis.P2 || {});
