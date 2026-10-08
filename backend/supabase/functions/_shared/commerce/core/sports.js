// COPIA GENERADA de commerce/core/sports.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Deportes como expansiones reales. El fútbol es la base (gratis). Cada deporte registra su módulo.
export const SPORT_MODULE_INTERFACE = ['careerEngine', 'competitionEngine', 'rankingEngine', 'economyHooks', 'events', 'businesses', 'sponsors', 'items', 'prestigeCareers'];
export const SPORTS = [
  { id: 'football', n: 'Fútbol', entitlement: null, status: 'active' },
  { id: 'climbing', n: 'Escalada', entitlement: 'sport.climbing', status: 'testing' },
  { id: 'tennis', n: 'Tenis', entitlement: 'sport.tennis', status: 'coming_soon' },
  { id: 'basketball', n: 'Basket', entitlement: 'sport.basketball', status: 'coming_soon' },
  { id: 'skate', n: 'Skate', entitlement: 'sport.skate', status: 'coming_soon' },
  { id: 'surf', n: 'Surf', entitlement: 'sport.surf', status: 'coming_soon' },
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
// Escalada: datos del módulo (el motor jugable llega en una fase posterior → careerEngine null = «Próximamente»)
registerSportModule({
  id: 'climbing',
  careerEngine: null, competitionEngine: null, rankingEngine: null,
  economyHooks: { income: ['premios', 'sponsors', 'clases', 'campus', 'routesetting'] },
  events: ['lesión de dedos', 'vía nueva en el rocódromo', 'convocatoria de la selección'],
  businesses: ['clases', 'routesetting', 'tienda', 'rocódromo', 'eventos', 'cadena'],
  sponsors: ['marca de pies de gato', 'marca de cuerdas', 'bebida energética'],
  items: ['pies de gato', 'magnesera', 'arnés'],
  prestigeCareers: ['world_climbing_president'],
  ladder: ['rocódromo local', 'autonómico', 'nacional', 'internacional', 'profesional'],
  disciplines: ['bloque', 'dificultad', 'velocidad'],
});
