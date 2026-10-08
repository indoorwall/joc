// Cuentas: perfil, edad, términos, control parental y copia de las carreras en la nube.
// Igual que el comercio: la MISMA lógica en el servidor real (Edge Functions + Postgres) y en el backend simulado del juego.
// El cliente nunca decide: valida aquí (país de una lista, nombre limpio, edad que no se puede «subir» después, etc.).
import { CommerceError } from './service.js';

// Versión de los términos que el jugador acepta al crear la cuenta (borrador: requiere revisión legal)
export const TERMS_VERSION = '2026-10-08';
export const AGE_BANDS = ['u13', '13_17', '18p'];
export const AGE_TXT = { u13: 'Menos de 13 años', '13_17': 'De 13 a 17 años', '18p': '18 años o más' };
export const COUNTRIES = [['ES', 'España'], ['AD', 'Andorra'], ['PT', 'Portugal'], ['FR', 'Francia'], ['IT', 'Italia'], ['DE', 'Alemania'], ['GB', 'Reino Unido'],
  ['IE', 'Irlanda'], ['NL', 'Países Bajos'], ['BE', 'Bélgica'], ['CH', 'Suiza'], ['AT', 'Austria'], ['MX', 'México'], ['AR', 'Argentina'], ['CO', 'Colombia'],
  ['CL', 'Chile'], ['PE', 'Perú'], ['UY', 'Uruguay'], ['VE', 'Venezuela'], ['EC', 'Ecuador'], ['US', 'Estados Unidos'], ['ZZ', 'Otro país']];
export const SAVE_LIMITS = { slots: 10, slotBytes: 400 * 1024, totalBytes: 1500 * 1024, titulo: 30 };

const req = (cond, code, status = 400) => { if (!cond) throw new CommerceError(code, status); };
const limpio = (x, n) => String(x == null ? '' : x).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const emailOk = e => typeof e === 'string' && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Lo que ve el jugador de su perfil (y lo que decide qué ofertas se le enseñan)
export function publicProfile(p) {
  const x = p || {};
  const ageBand = AGE_BANDS.includes(x.ageBand) ? x.ageBand : null;
  const isMinor = ageBand ? ageBand !== '18p' : !!x.isMinor;
  return {
    displayName: x.displayName || null, country: x.country || null, ageBand, isMinor,
    marketingOptIn: !!x.marketingOptIn && !isMinor,
    termsVersion: x.termsVersion || null, termsAcceptedAt: x.termsAcceptedAt || null,
    parentalStatus: x.parentalStatus || 'none',
    // Menores de 13: la cuenta necesita el permiso de su madre, padre o tutor antes de poder comprar
    canPurchase: !!ageBand && x.termsVersion === TERMS_VERSION && (ageBand !== 'u13' || x.parentalStatus === 'approved'),
    needsProfile: !ageBand || x.termsVersion !== TERMS_VERSION,
    createdAt: x.createdAt || null,
  };
}

export function createAccountService({ repo, clock = () => new Date(), commerce = null }) {
  const now = () => clock().toISOString();
  const auth = user => req(user && user.id, 'auth_required', 401);

  async function getProfile(user) { auth(user); return publicProfile(await repo.getProfile(user.id)); }

  // Cambios del perfil: todo validado aquí. La edad solo puede fijarse una vez (no se puede «crecer» para saltarse límites).
  async function updateProfile(user, patch = {}) {
    auth(user);
    req(patch && typeof patch === 'object' && !Array.isArray(patch), 'invalid_profile');
    const cur = (await repo.getProfile(user.id)) || {};
    const f = {};
    if ('displayName' in patch) { const n = limpio(patch.displayName, 24); req(n.length >= 1, 'invalid_display_name'); f.displayName = n; }
    if ('country' in patch) { req(COUNTRIES.some(([c]) => c === patch.country), 'invalid_country'); f.country = patch.country; }
    if ('ageBand' in patch) {
      req(AGE_BANDS.includes(patch.ageBand), 'invalid_age');
      req(!cur.ageBand || cur.ageBand === patch.ageBand, 'age_locked', 409);
      f.ageBand = patch.ageBand; f.isMinor = patch.ageBand !== '18p';
    }
    const minor = f.ageBand ? f.isMinor : (cur.ageBand ? cur.ageBand !== '18p' : false);
    if ('marketingOptIn' in patch) f.marketingOptIn = patch.marketingOptIn === true && !minor;   // a menores nunca se les manda publicidad
    if (minor) f.marketingOptIn = false;
    if ('acceptTerms' in patch) { req(patch.acceptTerms === TERMS_VERSION, 'terms_version_mismatch'); f.termsVersion = TERMS_VERSION; f.termsAcceptedAt = now(); }
    if ('parentEmail' in patch) {
      req((f.ageBand || cur.ageBand) === 'u13', 'parental_not_needed');
      req(emailOk(patch.parentEmail), 'invalid_email');
      req(cur.parentalStatus !== 'approved', 'parental_already_approved', 409);
      f.parentEmail = patch.parentEmail.toLowerCase(); f.parentalStatus = 'pending'; f.parentalRequestedAt = now();
    }
    req(Object.keys(f).length > 0, 'invalid_profile');
    await repo.upsertProfile(user.id, f);
    return publicProfile(await repo.getProfile(user.id));
  }
  // El permiso parental lo da la madre/padre/tutor desde el enlace de SU correo (servidor), nunca la app del menor.
  async function setParentalStatus(userId, status) {
    req(['approved', 'rejected'].includes(status), 'invalid_status');
    const cur = await repo.getProfile(userId);
    req(cur && cur.parentalStatus === 'pending', 'parental_not_pending', 409);
    await repo.upsertProfile(userId, { parentalStatus: status, parentalDecidedAt: now() });
    return publicProfile(await repo.getProfile(userId));
  }

  // ---------- Carreras en la nube ----------
  // Solo datos de juego (la partida). Nada de esto toca compras: los entitlements siguen viniendo del servidor.
  async function getSaves(user) {
    auth(user);
    const rows = await repo.listGameSaves(user.id);
    return { v: 1, ranuras: rows.map(r => ({ i: r.slot, data: r.data.data, titulo: r.data.titulo || null, guardadoEn: r.data.guardadoEn || null })).sort((a, b) => a.i - b.i),
      updatedAt: rows.reduce((m, r) => (r.updatedAt > m ? r.updatedAt : m), null) };
  }
  // Por ranura, gana la copia más reciente: un móvil viejo no pisa lo que jugaste en otro. Borrar es explícito.
  async function putSaves(user, blob = {}) {
    auth(user);
    req(blob && Array.isArray(blob.ranuras) && blob.ranuras.length <= SAVE_LIMITS.slots, 'invalid_saves');
    const borradas = Array.isArray(blob.borradas) ? blob.borradas : [];
    let total = 0;
    for (const r of blob.ranuras) {
      req(r && Number.isInteger(r.i) && r.i >= 0 && r.i < SAVE_LIMITS.slots, 'invalid_slot');
      req(typeof r.data === 'string' && r.data.length <= SAVE_LIMITS.slotBytes, 'save_too_large', 413);
      let ok = false; try { const o = JSON.parse(r.data); ok = !!o && typeof o === 'object' && typeof o.saveVersion === 'number'; } catch (_) { ok = false; }
      req(ok, 'invalid_save_data');
      total += r.data.length;
    }
    req(total <= SAVE_LIMITS.totalBytes, 'save_too_large', 413);
    for (const i of borradas) req(Number.isInteger(i) && i >= 0 && i < SAVE_LIMITS.slots, 'invalid_slot');
    const existing = Object.fromEntries((await repo.listGameSaves(user.id)).map(r => [r.slot, r]));
    const out = { guardadas: [], conservadas: [], borradas: [] };
    for (const r of blob.ranuras) {
      const prev = existing[r.i], tPrev = prev && prev.data && prev.data.guardadoEn || 0, tNew = Number(r.guardadoEn) || 0;
      if (prev && tPrev > tNew) { out.conservadas.push(r.i); continue; }
      await repo.upsertGameSave(user.id, r.i, { data: r.data, titulo: r.titulo ? limpio(r.titulo, SAVE_LIMITS.titulo) : null, guardadoEn: tNew || Date.parse(now()) }, now());
      out.guardadas.push(r.i);
    }
    for (const i of borradas) if (!blob.ranuras.some(r => r.i === i) && existing[i]) { await repo.deleteGameSave(user.id, i); out.borradas.push(i); }
    return Object.assign(out, { at: now() });
  }

  // Descargar mis datos (RGPD, art. 20): perfil, compras, entitlements y carreras
  async function exportData(user) {
    auth(user);
    const profile = await getProfile(user);
    const saves = await getSaves(user);
    const purchases = commerce ? await commerce.purchaseHistory(user) : null;
    const ents = commerce ? await commerce.getEntitlements(user) : null;
    return { exportedAt: now(), userId: user.id, profile, purchases, entitlements: ents && ents.entitlements, careers: saves.ranuras.map(r => ({ slot: r.i, title: r.titulo, savedAt: r.guardadoEn, data: r.data })) };
  }
  return { getProfile, updateProfile, setParentalStatus, getSaves, putSaves, exportData };
}
