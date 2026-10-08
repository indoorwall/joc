// COPIA GENERADA de commerce/core/prestige.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Motor de Prestige Careers. Comprar desbloquea la CAMPAÑA; el cargo hay que ganárselo.
// Estados: LOCKED → PURCHASED → NOT_ELIGIBLE / ELIGIBLE → CANDIDATE → CAMPAIGN → ELECTION → OFFICE → REELECTION → FORMER
export const PRESTIGE_STATES = ['LOCKED', 'PURCHASED', 'NOT_ELIGIBLE', 'ELIGIBLE', 'CANDIDATE', 'CAMPAIGN', 'ELECTION', 'OFFICE', 'REELECTION', 'FORMER'];
export const PRESTIGE_DISCLAIMER = 'Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.';

// Requisitos jugables (nunca se compran). game = { age, rep, marca, seasons, hitos, trophies, entitlements, institutional }
export const PRESTIGE_CAREERS = {
  world_football_president: { entitlement: 'prestige.world_football_president', n: 'Presidente de la Federación Mundial de Fútbol', voters: 211, termWeeks: 208,
    eligibility: { minAge: 35, minRep: 85, minSeasons: 8, minMarca: 40, institutional: 1 },
    decisions: ['sedes', 'formatos', 'premios', 'calendario', 'desarrollo', 'sponsors', 'presupuesto', 'reglas', 'federaciones', 'crisis'] },
  world_climbing_president: { entitlement: 'prestige.world_climbing_president', requires: ['sport.climbing'], n: 'Presidente de la Federación Mundial de Escalada', voters: 90, termWeeks: 208,
    eligibility: { minAge: 30, minRep: 75, minSeasons: 6 }, decisions: ['calendario mundial', 'sedes', 'modalidades', 'paraescalada', 'juveniles', 'sponsors', 'derechos', 'presupuesto', 'crecimiento'] },
  league_president: { entitlement: 'prestige.league_president', n: 'Presidente de la Liga', voters: 42, termWeeks: 208, eligibility: { minAge: 30, minRep: 70, minSeasons: 6 },
    decisions: ['reparto audiovisual', 'calendario', 'patrocinadores', 'reglas económicas', 'control financiero', 'expansión', 'formato'] },
  national_coach: { entitlement: 'prestige.national_coach', n: 'Seleccionador nacional', voters: 1, termWeeks: 104, eligibility: { minAge: 32, minRep: 65, minSeasons: 8 },
    decisions: ['convocatorias', 'torneos', 'selección', 'presión', 'clubes', 'medios'] },
};
export function eligibility(career, game) {
  const e = career.eligibility || {}, g = game || {}, missing = [];
  if (e.minAge && !(g.age >= e.minAge)) missing.push(`edad ≥ ${e.minAge}`);
  if (e.minRep && !(g.rep >= e.minRep)) missing.push(`prestigio ≥ ${e.minRep}`);
  if (e.minSeasons && !(g.seasons >= e.minSeasons)) missing.push(`${e.minSeasons} temporadas de carrera`);
  if (e.minMarca && !(g.marca >= e.minMarca)) missing.push(`reputación pública ≥ ${e.minMarca}`);
  if (e.institutional && !((g.institutional || 0) >= e.institutional)) missing.push('experiencia institucional');
  for (const r of career.requires || []) if (!(g.entitlements || []).includes(r)) missing.push(`expansión ${r}`);
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
