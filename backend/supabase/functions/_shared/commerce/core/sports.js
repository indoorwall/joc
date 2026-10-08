// COPIA GENERADA de commerce/core/sports.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Deportes como expansiones reales. El fútbol es la base (gratis). Cada deporte registra su módulo.
export const SPORT_MODULE_INTERFACE = ['careerEngine', 'competitionEngine', 'rankingEngine', 'economyHooks', 'events', 'businesses', 'sponsors', 'items', 'prestigeCareers'];
export const SPORTS = [
  { id: 'football', n: 'Fútbol', entitlement: null, status: 'active' },
  { id: 'climbing', n: 'Escalada', entitlement: 'sport.climbing', status: 'active', game: 'escalada' },
  { id: 'tennis', n: 'Tenis', entitlement: 'sport.tennis', status: 'active', game: 'tenis' },
  { id: 'basketball', n: 'Basket', entitlement: 'sport.basketball', status: 'active', game: 'basket' },
  { id: 'skate', n: 'Skate', entitlement: 'sport.skate', status: 'active', game: 'skate' },
  { id: 'surf', n: 'Surf', entitlement: 'sport.surf', status: 'active', game: 'surf' },
];
export const SPORT_MODULES = {};
export function registerSportModule(mod) {
  const missing = SPORT_MODULE_INTERFACE.filter(k => !(k in mod));
  if (!mod.id || missing.length) throw new Error(`Módulo de deporte incompleto (${mod.id}): falta ${missing.join(', ')}`);
  SPORT_MODULES[mod.id] = mod; return mod;
}
// ¿Se puede jugar? El deporte base siempre; los demás con su entitlement y un módulo jugable
export function canPlaySport(id, entitlements = []) {
  const s = SPORTS.find(x => x.id === id); if (!s) return { ok: false, reason: 'unknown' };
  if (!s.entitlement) return { ok: true, base: true };   // el juego base
  if (!entitlements.includes(s.entitlement)) return { ok: false, reason: 'locked', entitlement: s.entitlement };
  const m = SPORT_MODULES[id];
  if (!m || !m.careerEngine) return { ok: false, reason: 'coming_soon', owned: true };
  return { ok: true };
}
// Módulos jugables: el motor de carrera es el del juego (p2/src/00_deportes.js + 03/04), con el formato de cada deporte
const MODULOS = {
  climbing: { format: 'circuito', ladder: ['rocódromos', 'autonómico', 'nacional', 'internacional'], disciplines: ['bloque', 'dificultad', 'velocidad'], extra: ['proyectos en roca (grados 6a–9a)'],
    economyHooks: { income: ['premios', 'sponsors', 'clases', 'campus', 'routesetting'] }, businesses: ['clases', 'routesetting', 'tienda', 'rocódromo', 'eventos', 'cadena'], prestigeCareers: ['world_climbing_president'] },
  tennis: { format: 'sets', ladder: ['club', 'autonómico', 'nacional', 'internacional'], surfaces: ['tierra', 'dura', 'hierba'], extra: ['viajes', 'fatiga', 'premios'],
    economyHooks: { income: ['premios', 'sponsors', 'clases'] }, businesses: ['clases', 'academia', 'pistas', 'club', 'torneos', 'alto rendimiento'], prestigeCareers: ['world_tennis_president'] },
  basketball: { format: 'puntos', ladder: ['autonómica', 'nacional plata', 'nacional oro', 'primera nacional'], roles: ['base', 'alero', 'pívot'], extra: ['minutos', 'estadísticas', 'playoffs', 'selección'],
    economyHooks: { income: ['sueldo', 'primas', 'sponsors'] }, businesses: ['campus', 'academia', 'gimnasio', '3x3', 'pabellón', 'club'], prestigeCareers: ['world_basket_president'] },
  skate: { format: 'circuito', ladder: ['barrio', 'autonómica', 'nacional', 'pro tour'], disciplines: ['street', 'park'], extra: ['estilo', 'partes de vídeo', 'reputación callejera'],
    economyHooks: { income: ['premios', 'sponsors', 'vídeos'] }, businesses: ['skateshop', 'marca', 'tablas', 'ropa', 'skatepark', 'eventos'], prestigeCareers: [] },
  surf: { format: 'circuito', ladder: ['locales', 'autonómico', 'nacional', 'mundial'], conditions: ['olas pequeñas', 'olas buenas', 'olas grandes'], extra: ['viajes de surf', 'tablas', 'clima'],
    economyHooks: { income: ['premios', 'sponsors', 'escuela'] }, businesses: ['escuela', 'alquiler', 'shop', 'shaping', 'surf camp', 'alojamiento', 'eventos'], prestigeCareers: [] },
};
for (const s of SPORTS) if (MODULOS[s.id]) registerSportModule(Object.assign({ id: s.id, careerEngine: 'p2', competitionEngine: 'p2', rankingEngine: MODULOS[s.id].format, events: [], sponsors: [], items: [] }, MODULOS[s.id]));
