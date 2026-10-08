// Catálogo comercial de «Del barrio al negocio» (versionado, data-driven).
// REGLAS:
//  - Nunca cambiar el significado de un SKU existente: un producto distinto = SKU nuevo.
//  - Un producto SOLO concede entitlements. Ningún entitlement da nivel, reputación, marca, dinero ni resultados.
//  - Precios de dinero REAL en unidades mínimas (céntimos). Nada de floats.
//  - Solo `active` se puede comprar (y `testing` fuera de producción o para testers).
//  - Los ids de Stripe NO van aquí (cambian entre test y live): tabla product_provider_ids.

export const CATALOG_VERSION = 1;

export const PRODUCT_TYPES = ['COSMETIC_PACK', 'SPORT_EXPANSION', 'SYSTEM_EXPANSION', 'PRESTIGE_CAREER', 'BUNDLE', 'REMOVE_ADS', 'SAVE_SLOTS', 'SUPPORTER_PACK', 'FUTURE_SUBSCRIPTION', 'PROMO'];
export const PRODUCT_STATUSES = ['draft', 'testing', 'coming_soon', 'active', 'retired'];

// Registro de entitlements: qué abre cada uno (nunca poder)
export const ENTITLEMENTS = {
  'cosmetic.debut_pack': { kind: 'cosmetic', n: 'Pack Debut' },
  'cosmetic.street_pack': { kind: 'cosmetic', n: 'Street Pack' },
  'cosmetic.pro_pack': { kind: 'cosmetic', n: 'Pro Pack' },
  'cosmetic.luxury_pack': { kind: 'cosmetic', n: 'Luxury Pack' },
  'cosmetic.magnate_pack': { kind: 'cosmetic', n: 'Magnate Pack' },
  'cosmetic.founder_pack': { kind: 'cosmetic', n: 'Founder Pack' },
  'cosmetic.press_badge': { kind: 'cosmetic', n: 'Insignia de prensa' },
  'ads.remove_interstitial': { kind: 'ads', n: 'Sin anuncios obligatorios' },
  'slots.extra_3': { kind: 'slots', n: '+3 carreras', slots: 3 },
  'sport.climbing': { kind: 'sport', n: 'Escalada' },
  'sport.tennis': { kind: 'sport', n: 'Tenis' },
  'sport.basketball': { kind: 'sport', n: 'Basket' },
  'sport.skate': { kind: 'sport', n: 'Skate' },
  'sport.surf': { kind: 'sport', n: 'Surf' },
  'expansion.club_owner': { kind: 'expansion', n: 'Propietario de club' },
  'expansion.real_estate': { kind: 'expansion', n: 'Imperio inmobiliario' },
  'expansion.sports_agency': { kind: 'expansion', n: 'Agencia de deportistas' },
  'expansion.events': { kind: 'expansion', n: 'Organizador de eventos' },
  'expansion.media': { kind: 'expansion', n: 'Media & Sports' },
};
const CLUBS = [['puerto', 'UD Puerto', '⚓', 99], ['costa', 'Real Costa', '🌊', 199], ['atletico', 'Atlético Ciudad', '🔴', 199]];
const COMPETITIONS = [['copa', 'Copa Federación', '🏆'], ['europa', 'Copa de Europa', '⭐'], ['mundial', 'Mundial', '🌍'], ['liga', 'Liga', '👑']];
for (const [c, n] of CLUBS) ENTITLEMENTS[`cosmetic.club_${c}`] = { kind: 'cosmetic', n: `Pack ${n}` };
for (const [c, n] of COMPETITIONS) ENTITLEMENTS[`cosmetic.champion_${c}`] = { kind: 'cosmetic', n: `Pack Campeón · ${n}` };

// Prestige Careers (comprar = poder JUGAR la campaña; nunca el cargo)
export const PRESTIGE_LIST = [
  ['world_football_president', 'Presidente de la Federación Mundial de Fútbol', '🌐', 99],
  ['world_climbing_president', 'Presidente de la Federación Mundial de Escalada', '🧗', 99, ['sport.climbing']],
  ['world_basket_president', 'Presidente de la Federación Mundial de Baloncesto', '🏀', 99, ['sport.basketball']],
  ['world_tennis_president', 'Presidente de la Federación Mundial de Tenis', '🎾', 99, ['sport.tennis']],
  ['league_president', 'Presidente de la Liga', '🏟️', 99],
  ['national_federation', 'Presidente de la Federación Nacional', '🏛️', 99],
  ['national_coach', 'Seleccionador nacional', '📋', 99],
  ['sporting_director', 'Director deportivo', '🗂️', 99],
  ['agent', 'Agente internacional', '🤝', 99],
  ['referee', 'Árbitro internacional', '🟨', 99],
  ['media_personality', 'Comentarista / periodista', '🎙️', 99],
  ['world_sports_committee', 'Presidente del Comité Mundial del Deporte', '🌍', 199, null, null, { anyCount: { n: 2, of: ['sport.climbing', 'sport.tennis', 'sport.basketball', 'sport.skate', 'sport.surf'] } }],
];
for (const [id, n] of PRESTIGE_LIST) ENTITLEMENTS[`prestige.${id}`] = { kind: 'prestige', n };

const P = (o) => Object.assign({
  oneTime: true, consumable: false, featured: false, requires: null, trigger: null, visibleWhen: null, bundleContents: null,
  cosmeticOnly: false, version: CATALOG_VERSION, status: 'coming_soon', includes: [], assets: {},
}, o, {
  sku: o.id,
  prices: o.prices || { EUR: o.priceEUR },
  platformProducts: o.platformProducts || { apple: { productId: `com.delbarrio.${o.id}`, type: 'non_consumable' }, google: { productId: o.id, type: 'inapp' } },
});
const NO_STATS = 'Solo aspecto: no da nivel, reputación, marca ni dinero.';

export const PRODUCTS = [
  // ---------- Packs cosméticos ----------
  P({ id: 'pack_debut', type: 'COSMETIC_PACK', status: 'active', priceEUR: 99, entitlements: ['cosmetic.debut_pack'], featured: true, cosmeticOnly: true,
    name: 'Pack Debut', description: 'Para celebrar tu primer contrato profesional.', trigger: 'primer_contrato', visibleWhen: { anyHito: ['contrato'] },
    includes: ['Outfit Debut', 'Botas Debut (visuales)', 'Gorra Debut', 'Fondo «Primer contrato»', 'Insignia Debut', 'Balón firmado para tu vitrina'], note: NO_STATS, assets: { ic: '🌟', color: '#7c5cff' } }),
  P({ id: 'pack_street', type: 'COSMETIC_PACK', status: 'active', priceEUR: 199, entitlements: ['cosmetic.street_pack'], cosmeticOnly: true, name: 'Street Pack', description: 'Estilo de barrio.',
    includes: ['Sudadera Street', 'Pantalón cargo', 'Zapatillas Street', 'Gorra Street', 'Gafas Street', 'Mochila Street', 'Fondo urbano', 'Aspecto Street para tu bicicleta', 'Pose «Saludo» lista'], note: NO_STATS, assets: { ic: '🧢', color: '#ff4f8b' } }),
  P({ id: 'pack_pro', type: 'COSMETIC_PACK', status: 'active', priceEUR: 299, entitlements: ['cosmetic.pro_pack'], cosmeticOnly: true, name: 'Pro Pack', description: 'Para cuando ya eres titular habitual.', trigger: 'titular_habitual', visibleWhen: { anyHito: ['titular'] },
    includes: ['Outfit profesional', 'Traje casual', 'Maleta deportiva', 'Reloj Pro (visual)', 'Auriculares Pro', 'Botas Pro (visuales)', 'Gafas Pro', 'Peinado degradado', 'Fondo estadio', 'Fondo vestuario', 'Aspecto Pro para tu coche', 'Pose Pro'], note: NO_STATS, assets: { ic: '🏟️', color: '#2f7bff' } }),
  P({ id: 'pack_luxury', type: 'COSMETIC_PACK', status: 'active', priceEUR: 399, entitlements: ['cosmetic.luxury_pack'], cosmeticOnly: true, name: 'Luxury Pack', description: 'Aspecto de empresario. No regala coche ni casa.', trigger: 'primera_empresa', visibleWhen: { anyHito: ['empresa'] },
    includes: ['Traje Luxury', 'Reloj premium (visual)', 'Cadena exclusiva', 'Gafas Luxury', 'Fondo rooftop', 'Fondo premium', 'Decoración de vivienda', 'Decoración de despacho', 'Aspecto negro mate para tu coche', 'Pose de empresario'], note: NO_STATS, assets: { ic: '💎', color: '#c88c00' } }),
  P({ id: 'pack_magnate', type: 'COSMETIC_PACK', status: 'active', priceEUR: 499, entitlements: ['cosmetic.magnate_pack'], cosmeticOnly: true, name: 'Magnate Pack', description: 'Para el final de la partida.', trigger: 'late_game', visibleWhen: { anyHito: ['inversion2'] },
    includes: ['Traje magnate', 'Reloj legendario', 'Fondo skyline', 'Despacho premium', 'Decoración de mansión (en tu vivienda)', 'Aspecto oro para el deportivo y el superdeportivo', 'Insignia Magnate', 'Llave de oro para tu vitrina'], note: NO_STATS, assets: { ic: '🏙️', color: '#111827' } }),
  P({ id: 'founder_pack', type: 'SUPPORTER_PACK', status: 'active', priceEUR: 499, entitlements: ['cosmetic.founder_pack', 'slots.extra_3', 'ads.remove_interstitial'], name: 'Founder Pack', description: 'Apoya el proyecto desde el principio.',
    includes: ['Insignia Founder', 'Outfit Founder', 'Fondo Founder', '+3 ranuras de carrera (5 en total)', 'Sin anuncios obligatorios', 'Placa conmemorativa para tu casa y tu vitrina'], note: 'Sin estadísticas. Compra permanente.', assets: { ic: '🏅', color: '#12bfae' } }),
  ...CLUBS.map(([c, n, ic, price]) => P({ id: `club_pack_${c}`, type: 'COSMETIC_PACK', status: 'active', priceEUR: price, entitlements: [`cosmetic.club_${c}`], cosmeticOnly: true, name: `Pack ${n}`, description: `Los colores de ${n}.`,
    visibleWhen: { club: c }, includes: ['Camiseta', 'Chaqueta', 'Bufanda', 'Mochila', 'Fondo del club', 'Rincón del club en tu casa', 'Camiseta firmada para tu vitrina'], note: NO_STATS, assets: { ic } })),
  ...COMPETITIONS.map(([c, n, ic]) => P({ id: `champion_pack_${c}`, type: 'COSMETIC_PACK', status: 'active', priceEUR: 99, entitlements: [`cosmetic.champion_${c}`], cosmeticOnly: true, name: `Pack Campeón · ${n}`, description: `Solo para quien ha ganado ${n}.`,
    visibleWhen: { trophy: c }, includes: ['Camiseta especial', 'Trofeo en la mano y réplica en casa', 'Fondo de campeón', 'Botas de campeón (visuales)', 'Celebración de campeón', 'Insignia'], note: NO_STATS, assets: { ic } })),
  // ---------- Anuncios y ranuras ----------
  P({ id: 'remove_ads', type: 'REMOVE_ADS', status: 'active', priceEUR: 399, entitlements: ['ads.remove_interstitial'], name: 'Quitar anuncios', description: 'Elimina solo la publicidad obligatoria. Los anuncios con recompensa siguen disponibles si quieres verlos.',
    includes: ['Sin anuncios obligatorios entre pantallas', 'Los anuncios voluntarios con recompensa siguen ahí'], note: 'No cambia nada del juego.', assets: { ic: '🚫', color: '#334155' } }),
  P({ id: 'extra_save_slots_3', type: 'SAVE_SLOTS', status: 'active', priceEUR: 199, entitlements: ['slots.extra_3'], name: '+3 carreras', description: 'Juega hasta 5 carreras distintas a la vez (2 gratis + 3).', includes: ['3 ranuras de carrera más (5 en total)', 'También se copian en tu cuenta'], assets: { ic: '💾' } }),
  // ---------- Deportes ----------
  P({ id: 'sport_climbing', type: 'SPORT_EXPANSION', status: 'active', priceEUR: 299, entitlements: ['sport.climbing'], name: 'Escalada', description: 'Del rocódromo del barrio a la élite: bloque, dificultad y velocidad.',
    includes: ['Carrera: rocódromo local → autonómico → nacional → internacional → profesional', 'Bloque, dificultad, velocidad, ranking, campeonatos, selección', 'Ingresos: premios, sponsors, clases, campus, equipamiento de vías', 'Negocios: clases, routesetting, tienda, rocódromo, eventos, cadena'], assets: { ic: '🧗', color: '#0ea5e9' } }),
  P({ id: 'sport_tennis', type: 'SPORT_EXPANSION', status: 'active', priceEUR: 299, entitlements: ['sport.tennis'], name: 'Tenis', description: 'Ranking, superficies, viajes y torneos.',
    includes: ['Ranking, superficies, viajes, calendario, entrenadores, premios, fatiga, lesiones', 'Negocios: clases, academia, pistas, club, torneos, alto rendimiento'], assets: { ic: '🎾' } }),
  P({ id: 'sport_basketball', type: 'SPORT_EXPANSION', status: 'active', priceEUR: 299, entitlements: ['sport.basketball'], name: 'Basket', description: 'Minutos, rol, playoffs y selección.',
    includes: ['Minutos, rol, contratos, liga, playoffs, estadísticas, selección', 'Negocios: campus, academia, gimnasio, 3x3, pabellón, club'], assets: { ic: '🏀' } }),
  P({ id: 'sport_skate', type: 'SPORT_EXPANSION', status: 'active', priceEUR: 299, entitlements: ['sport.skate'], name: 'Skate', description: 'Reputación callejera, vídeos y contests.',
    includes: ['Street reputation, vídeos, contests, sponsors, estilo, comunidad', 'Negocios: skateshop, marca, tablas, ropa, skatepark, eventos'], assets: { ic: '🛹' } }),
  P({ id: 'sport_surf', type: 'SPORT_EXPANSION', status: 'active', priceEUR: 299, entitlements: ['sport.surf'], name: 'Surf', description: 'Olas, viajes, ranking y tablas.',
    includes: ['Oleaje, condiciones, viajes, ranking, tablas, clima, sponsors', 'Negocios: escuela, alquiler, shop, shaping, surf camp, alojamiento, eventos'], assets: { ic: '🏄' } }),
  P({ id: 'sports_bundle', type: 'BUNDLE', status: 'active', priceEUR: 899, entitlements: ['sport.climbing', 'sport.tennis', 'sport.basketball', 'sport.skate', 'sport.surf'],
    bundleContents: ['sport_climbing', 'sport_tennis', 'sport_basketball', 'sport_skate', 'sport_surf'], name: 'Todos los deportes', description: 'Los 5 deportes. Si ya tienes alguno, no se duplica.', includes: ['Escalada', 'Tenis', 'Basket', 'Skate', 'Surf'], assets: { ic: '🏅' } }),
  // ---------- Expansiones de sistema ----------
  P({ id: 'expansion_club_owner', status: 'active', type: 'SYSTEM_EXPANSION', priceEUR: 399, entitlements: ['expansion.club_owner'], name: 'Propietario de club', description: 'Compra participaciones o un club entero y gobiérnalo.',
    includes: ['Participaciones y compra de club', 'Presidencia', 'Director deportivo, entrenador, plantilla, cantera', 'Instalaciones, estadio, patrocinadores, finanzas'], visibleWhen: { anyHito: ['empresa'] }, assets: { ic: '🏟️' } }),
  P({ id: 'expansion_real_estate', status: 'active', type: 'SYSTEM_EXPANSION', priceEUR: 299, entitlements: ['expansion.real_estate'], name: 'Imperio inmobiliario', description: 'Locales, pisos, parkings, edificios y terrenos.',
    includes: ['Locales, pisos, parkings, edificios, terrenos', 'Reformas, alquiler, financiación, revalorización'], visibleWhen: { anyHito: ['empresa'] }, assets: { ic: '🏢' } }),
  P({ id: 'expansion_sports_agency', status: 'active', type: 'SYSTEM_EXPANSION', priceEUR: 299, entitlements: ['expansion.sports_agency'], name: 'Agencia de deportistas', description: 'Capta, representa y negocia.',
    includes: ['Captación y scouting', 'Representados, contratos, patrocinadores, comisiones', 'Conflictos y crecimiento de agencia'], visibleWhen: { anyHito: ['empresa'] }, assets: { ic: '💼' } }),
  P({ id: 'expansion_events', status: 'active', type: 'SYSTEM_EXPANSION', priceEUR: 299, entitlements: ['expansion.events'], name: 'Organizador de eventos', description: 'Sedes, entradas, sponsors y riesgo.',
    includes: ['Sedes, entradas, sponsors, deportistas', 'Producción, premios, retransmisión, riesgo financiero'], visibleWhen: { anyHito: ['empresa'] }, assets: { ic: '🎪' } }),
  P({ id: 'expansion_media', status: 'active', type: 'SYSTEM_EXPANSION', priceEUR: 299, entitlements: ['expansion.media'], name: 'Media & Sports', description: 'Tu canal, tu productora, tus derechos.',
    includes: ['Canal, streaming, productora, programas', 'Derechos, audiencia, publicidad, patrocinios'], visibleWhen: { anyHito: ['empresa'] }, assets: { ic: '📺' } }),
  P({ id: 'empire_bundle', status: 'active', type: 'BUNDLE', priceEUR: 699, entitlements: ['expansion.club_owner', 'expansion.real_estate', 'expansion.sports_agency', 'expansion.events'],
    bundleContents: ['expansion_club_owner', 'expansion_real_estate', 'expansion_sports_agency', 'expansion_events'], name: 'Empire Bundle', description: 'Club, inmobiliaria, agencia y eventos.', visibleWhen: { anyHito: ['empresa'] },
    includes: ['Propietario de club', 'Imperio inmobiliario', 'Agencia de deportistas', 'Organizador de eventos'], assets: { ic: '👑' } }),
  // ---------- Prestige Careers ----------
  ...PRESTIGE_LIST.map(([id, n, ic, price, reqAll, status, reqExtra]) => P({ id: `prestige_${id}`, type: 'PRESTIGE_CAREER', status: status || 'active', priceEUR: price, entitlements: [`prestige.${id}`],
    requires: reqAll || reqExtra ? Object.assign({}, reqAll ? { all: reqAll } : {}, reqExtra || {}) : null, name: n, description: 'Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.',
    disclaimer: 'Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.',
    includes: ['Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección'], prestige: id, assets: { ic } })),
  P({ id: 'prestige_bundle', status: 'active', type: 'BUNDLE', priceEUR: 399, entitlements: ['prestige.world_football_president', 'prestige.league_president', 'prestige.national_federation', 'prestige.national_coach', 'prestige.sporting_director', 'prestige.agent', 'prestige.referee', 'prestige.media_personality'],
    bundleContents: ['prestige_world_football_president', 'prestige_league_president', 'prestige_national_federation', 'prestige_national_coach', 'prestige_sporting_director', 'prestige_agent', 'prestige_referee', 'prestige_media_personality'],
    name: 'Prestige Bundle', description: 'Exactamente estas 8 carreras. No incluye carreras futuras.', includes: ['Presidente de la Federación Mundial de Fútbol', 'Presidente de la Liga', 'Presidente de la Federación Nacional', 'Seleccionador nacional', 'Director deportivo', 'Agente internacional', 'Árbitro internacional', 'Comentarista / periodista'], assets: { ic: '🎖️' } }),
  // ---------- Promo y futuro ----------
  P({ id: 'promo_press', type: 'PROMO', status: 'active', priceEUR: null, prices: {}, promoOnly: true, entitlements: ['cosmetic.press_badge'], name: 'Insignia de prensa', description: 'Solo con código promocional.', includes: ['Insignia de prensa'], cosmeticOnly: true, platformProducts: {}, assets: { ic: '📰' } }),
  P({ id: 'season_pass', type: 'FUTURE_SUBSCRIPTION', status: 'draft', priceEUR: null, prices: {}, oneTime: false, entitlements: [], name: 'Pase de temporada', description: 'Reservado. No se usa todavía.', platformProducts: {} }),
];

export const CATALOG = { version: CATALOG_VERSION, currency: 'EUR', products: PRODUCTS, entitlements: ENTITLEMENTS };

export function getProduct(sku, catalog = CATALOG) { return catalog.products.find(p => p.id === sku) || null; }
