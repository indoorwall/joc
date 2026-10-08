// COPIA GENERADA de commerce/core/prestige.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Motor de Prestige Careers. Comprar desbloquea la CAMPAÑA; el cargo hay que ganárselo.
// Estados: LOCKED → PURCHASED → NOT_ELIGIBLE / ELIGIBLE → CANDIDATE → CAMPAIGN → ELECTION → OFFICE → REELECTION → FORMER
export const PRESTIGE_STATES = ['LOCKED', 'PURCHASED', 'NOT_ELIGIBLE', 'ELIGIBLE', 'CANDIDATE', 'CAMPAIGN', 'ELECTION', 'OFFICE', 'REELECTION', 'FORMER'];
export const PRESTIGE_DISCLAIMER = 'Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.';

// Requisitos jugables (nunca se compran). game = { age, rep, marca, seasons, hitos, trophies, entitlements, institutional }
// Los mismos 12 cargos que juega P2 (p2/src/19_prestige.js). termWeeks = semanas de juego de un mandato.
export const PRESTIGE_CAREERS = {
  world_football_president: { entitlement: 'prestige.world_football_president', n: 'Presidente de la Federación Mundial de Fútbol', type: 'election', voters: 211, termWeeks: 26,
    eligibility: { minAge: 35, minRep: 80, minSeasons: 5, minMarca: 40, institutional: 1 },
    decisions: ['sedes', 'formatos', 'premios', 'calendario', 'desarrollo', 'sponsors', 'presupuesto', 'reglas', 'federaciones', 'crisis'] },
  world_climbing_president: { entitlement: 'prestige.world_climbing_president', requires: ['sport.climbing'], n: 'Presidente de la Federación Mundial de Escalada', type: 'election', voters: 90, termWeeks: 24,
    eligibility: { minAge: 30, minRep: 75, minSeasons: 4 }, decisions: ['calendario mundial', 'sedes', 'modalidades', 'paraescalada', 'juveniles', 'sponsors', 'derechos', 'presupuesto', 'crecimiento'] },
  world_basket_president: { entitlement: 'prestige.world_basket_president', requires: ['sport.basketball'], n: 'Presidente de la Federación Mundial de Baloncesto', type: 'election', voters: 150, termWeeks: 24,
    eligibility: { minAge: 30, minRep: 78, minSeasons: 5 }, decisions: ['ventanas de selecciones', '3x3', 'frecuencia del mundial', 'baloncesto femenino'] },
  world_tennis_president: { entitlement: 'prestige.world_tennis_president', requires: ['sport.tennis'], n: 'Presidente de la Federación Mundial de Tenis', type: 'election', voters: 140, termWeeks: 24,
    eligibility: { minAge: 30, minRep: 78, minSeasons: 5 }, decisions: ['copa por países', 'calendario', 'juez electrónico', 'ayudas a jugadores'] },
  league_president: { entitlement: 'prestige.league_president', n: 'Presidente de la Liga', type: 'election', voters: 42, termWeeks: 22, eligibility: { minAge: 30, minRep: 65, minSeasons: 4, minMarca: 30 },
    decisions: ['reparto audiovisual', 'calendario', 'patrocinadores', 'reglas económicas', 'control financiero', 'expansión', 'formato'] },
  national_federation: { entitlement: 'prestige.national_federation', n: 'Presidente de la Federación Nacional', type: 'election', voters: 120, termWeeks: 22, eligibility: { minAge: 30, minRep: 60, minSeasons: 3 },
    decisions: ['licencias', 'formación de entrenadores', 'arbitraje', 'sede de la selección'] },
  national_coach: { entitlement: 'prestige.national_coach', n: 'Seleccionador nacional', type: 'appointment', voters: 1, termWeeks: 20, eligibility: { minAge: 32, minRep: 65, minSeasons: 5, minTrophies: 1 },
    decisions: ['convocatorias', 'torneos', 'selección', 'presión', 'clubes', 'medios'] },
  sporting_director: { entitlement: 'prestige.sporting_director', n: 'Director deportivo', type: 'appointment', voters: 1, termWeeks: 20, eligibility: { minAge: 30, minRep: 55, minSeasons: 4 },
    decisions: ['fichajes', 'entrenador', 'ventas', 'ojeadores'] },
  agent: { entitlement: 'prestige.agent', n: 'Agente internacional', type: 'exam', voters: 1, termWeeks: 24, eligibility: { minAge: 25, minRep: 50, minMarca: 35 },
    decisions: ['traspasos', 'comisiones', 'renovaciones', 'captación'] },
  referee: { entitlement: 'prestige.referee', n: 'Árbitro internacional', type: 'exam', voters: 1, termWeeks: 22, eligibility: { minAge: 25, minRep: 45, minSeasons: 3 },
    decisions: ['jugadas dudosas', 'autoridad', 'preparación física', 'medios'] },
  media_personality: { entitlement: 'prestige.media_personality', n: 'Comentarista / periodista', type: 'casting', voters: 1, termWeeks: 24, eligibility: { minAge: 22, minRep: 40, minMarca: 45 },
    decisions: ['exclusivas', 'grandes retransmisiones', 'tono', 'polémicas'] },
  world_sports_committee: { entitlement: 'prestige.world_sports_committee', requiresAny: { n: 2, of: ['sport.climbing', 'sport.tennis', 'sport.basketball', 'sport.skate', 'sport.surf'] }, n: 'Presidente del Comité Mundial del Deporte', type: 'election', voters: 100, termWeeks: 26,
    eligibility: { minAge: 40, minRep: 85, minMarca: 50, institutional: 1, minNetWorth: 250000 }, decisions: ['sede de los Juegos', 'nuevos deportes', 'antidopaje', 'derechos de televisión', 'igualdad'] },
};
export function eligibility(career, game) {
  const e = career.eligibility || {}, g = game || {}, missing = [];
  if (e.minAge && !(g.age >= e.minAge)) missing.push(`edad ≥ ${e.minAge}`);
  if (e.minRep && !(g.rep >= e.minRep)) missing.push(`prestigio ≥ ${e.minRep}`);
  if (e.minSeasons && !(g.seasons >= e.minSeasons)) missing.push(`${e.minSeasons} temporadas de carrera`);
  if (e.minMarca && !(g.marca >= e.minMarca)) missing.push(`reputación pública ≥ ${e.minMarca}`);
  if (e.institutional && !((g.institutional || 0) >= e.institutional)) missing.push('experiencia institucional');
  if (e.minTrophies && !((g.trophies || 0) >= e.minTrophies)) missing.push(`${e.minTrophies} título(s)`);
  if (e.minNetWorth && !((g.netWorth || 0) >= e.minNetWorth)) missing.push(`patrimonio ≥ ${e.minNetWorth}`);
  for (const r of career.requires || []) if (!(g.entitlements || []).includes(r)) missing.push(`expansión ${r}`);
  if (career.requiresAny && career.requiresAny.of.filter(r => (g.entitlements || []).includes(r)).length < career.requiresAny.n) missing.push(`${career.requiresAny.n} deportes: ${career.requiresAny.of.join(', ')}`);
  return { ok: missing.length === 0, missing };
}
// Estado derivado: la compra solo lleva hasta PURCHASED / NOT_ELIGIBLE / ELIGIBLE
export function prestigeState(career, { entitlements = [], game = {}, progress = null } = {}) {
  if (!entitlements.includes(career.entitlement)) return 'LOCKED';
  if (progress && progress.state && !['LOCKED', 'PURCHASED', 'NOT_ELIGIBLE', 'ELIGIBLE'].includes(progress.state)) return progress.state;
  return eligibility(career, Object.assign({ entitlements }, game)).ok ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
}
// Transiciones jugables. rnd ∈ [0,1) lo aporta el juego (semilla de la partida)
export function startCandidacy(career, ctx) {
  const st = prestigeState(career, ctx);
  if (st !== 'ELIGIBLE') return { ok: false, state: st };
  return { ok: true, progress: { state: 'CANDIDATE', supports: 0, weeks: 0 } };
}
export function campaignWeek(progress, { effort = 1, rep = 50, contacts = 0 } = {}) {
  const p = Object.assign({}, progress);
  if (p.state === 'CANDIDATE') p.state = 'CAMPAIGN';
  if (p.state !== 'CAMPAIGN') return p;
  p.weeks++; p.supports = Math.min(100, p.supports + Math.max(0, Math.round(effort * (2 + rep / 25 + contacts / 10))));
  if (p.weeks >= 6) p.state = 'ELECTION';
  return p;
}
export function election(career, progress, rnd) {
  if (progress.state !== 'ELECTION' && progress.state !== 'REELECTION') return progress;
  const pWin = Math.max(0.05, Math.min(0.9, progress.supports / 100));
  const won = rnd < pWin;
  return Object.assign({}, progress, won ? { state: 'OFFICE', termLeft: career.termWeeks, terms: (progress.terms || 0) + 1 } : { state: progress.state === 'REELECTION' ? 'FORMER' : 'ELIGIBLE', lastLost: true, supports: 0, weeks: 0 });
}
export function officeWeek(progress) {
  if (progress.state !== 'OFFICE') return progress;
  const p = Object.assign({}, progress, { termLeft: progress.termLeft - 1 });
  if (p.termLeft <= 0) Object.assign(p, { state: 'REELECTION', weeks: 0 });
  return p;
}
