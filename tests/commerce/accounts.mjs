// Cuentas: perfil (edad, país, términos, control parental), carreras en la nube y descarga de datos.
// Corre contra el repositorio en memoria y contra PostgreSQL real (misma semántica).
import { createAccountService, TERMS_VERSION, publicProfile } from '../../commerce/core/accounts.js';
import { createCommerceService } from '../../commerce/core/service.js';
import { createFakeStripe } from '../../commerce/core/fakeStripe.js';

const err = async p => { try { await p; return null; } catch (e) { return e.code || e.message; } };
const partida = (semana, extra = {}) => JSON.stringify(Object.assign({ saveVersion: 2, semana, nombre: 'Alex', p: { dinero: 100 } }, extra));

export async function runAccounts(name, makeRepo, check, [U1, U2]) {
  const T = `[${name}] Cuenta: `;
  const repo = await makeRepo();
  const stripe = createFakeStripe({ webhookSecret: 'whsec_t', mock: true });
  const svc = createCommerceService({ repo, stripe, config: { environment: 'development' }, env: { environment: 'development', stripeWebhookSecret: 'whsec_t', appUrl: 'https://juego.test' } });
  const A = createAccountService({ repo, commerce: svc });
  const u = { id: U1, isTester: true }, u2 = { id: U2, isTester: true };

  check(T + 'sin sesión no hay perfil', await err(A.getProfile(null)) === 'auth_required');
  const p0 = await A.getProfile(u);
  check(T + 'perfil nuevo: hay que completarlo (edad y términos) y aún no se puede comprar', p0.needsProfile && !p0.canPurchase);
  check(T + 'el país solo puede ser uno de la lista', await err(A.updateProfile(u, { country: 'XX' })) === 'invalid_country');
  check(T + 'nombre vacío o solo símbolos peligrosos → rechazado', await err(A.updateProfile(u, { displayName: '  <>  ' })) === 'invalid_display_name');
  check(T + 'términos de otra versión → rechazado', await err(A.updateProfile(u, { acceptTerms: '1999-01-01' })) === 'terms_version_mismatch');
  const p1 = await A.updateProfile(u, { displayName: '  Alex   <b>Gol</b> ', country: 'ES', ageBand: '18p', acceptTerms: TERMS_VERSION, marketingOptIn: true });
  check(T + 'perfil completo: nombre limpio, país, mayor de edad, términos con fecha', p1.displayName === 'Alex bGol/b' && p1.country === 'ES' && !p1.isMinor && p1.termsVersion === TERMS_VERSION && p1.termsAcceptedAt && p1.canPurchase && !p1.needsProfile && p1.marketingOptIn);
  check(T + 'la edad no se puede cambiar después (nadie se «hace mayor» para saltarse límites)', await err(A.updateProfile(u, { ageBand: '13_17' })) === 'age_locked');
  check(T + 'repetir la misma edad no es un cambio', !(await err(A.updateProfile(u, { ageBand: '18p' }))));

  // Menor de 13: sin permiso parental no puede comprar (también en el SERVIDOR) y nunca recibe publicidad
  const m = await A.updateProfile(u2, { displayName: 'Peque', country: 'ES', ageBand: 'u13', acceptTerms: TERMS_VERSION, marketingOptIn: true });
  check(T + 'menor: sin publicidad aunque marque la casilla', m.isMinor && !m.marketingOptIn);
  check(T + 'menor de 13 sin permiso parental → no puede comprar', !m.canPurchase && m.parentalStatus === 'none');
  check(T + 'servidor: checkout de un menor de 13 sin permiso → parental_consent_required', await err(svc.createCheckout(u2, { sku: 'pack_debut', consentWithdrawal: true })) === 'parental_consent_required');
  check(T + 'email del tutor inválido → rechazado', await err(A.updateProfile(u2, { parentEmail: 'no-es-un-email' })) === 'invalid_email');
  check(T + 'un adulto no pide permiso parental', await err(A.updateProfile(u, { parentEmail: 'x@y.es' })) === 'parental_not_needed');
  const pend = await A.updateProfile(u2, { parentEmail: 'Madre@Correo.es' });
  check(T + 'permiso pedido → pendiente (sigue sin poder comprar)', pend.parentalStatus === 'pending' && !pend.canPurchase);
  const ok = await A.setParentalStatus(U2, 'approved');
  check(T + 'el tutor aprueba (desde su correo, en el servidor) → ya puede comprar', ok.parentalStatus === 'approved' && ok.canPurchase);
  check(T + 'servidor: con permiso, el checkout se abre', !(await err(svc.createCheckout(u2, { sku: 'pack_debut', consentWithdrawal: true }))));
  check(T + 'no se puede aprobar dos veces', await err(A.setParentalStatus(U2, 'approved')) === 'parental_not_pending');
  check(T + 'perfil público: sin email del tutor (no sale nunca hacia el cliente)', !('parentEmail' in ok));
  check(T + 'perfil sin edad (de antes) → hay que completarlo', publicProfile({ displayName: 'x' }).needsProfile);

  // Carreras en la nube
  check(T + 'nube vacía al principio', (await A.getSaves(u)).ranuras.length === 0);
  const r1 = await A.putSaves(u, { ranuras: [{ i: 0, data: partida(10), titulo: 'Mi carrera', guardadoEn: 1000 }, { i: 1, data: partida(3), guardadoEn: 1000 }] });
  check(T + 'subir dos carreras', r1.guardadas.length === 2);
  const g = await A.getSaves(u);
  check(T + 'bajarlas: mismas ranuras, datos y título', g.ranuras.length === 2 && JSON.parse(g.ranuras[0].data).semana === 10 && g.ranuras[0].titulo === 'Mi carrera');
  const r2 = await A.putSaves(u, { ranuras: [{ i: 0, data: partida(4), guardadoEn: 500 }] });
  check(T + 'una copia MÁS VIEJA no pisa la de la nube (otro móvil desactualizado)', r2.conservadas.includes(0) && JSON.parse((await A.getSaves(u)).ranuras[0].data).semana === 10);
  const r3 = await A.putSaves(u, { ranuras: [{ i: 0, data: partida(12), guardadoEn: 2000 }], borradas: [1] });
  check(T + 'una copia más nueva sí; y borrar una ranura es explícito', r3.guardadas.includes(0) && r3.borradas.includes(1) && (await A.getSaves(u)).ranuras.length === 1);
  check(T + 'datos que no son una partida → rechazado', await err(A.putSaves(u, { ranuras: [{ i: 2, data: '{"hola":1}' }] })) === 'invalid_save_data');
  check(T + 'ranura fuera de rango → rechazado', await err(A.putSaves(u, { ranuras: [{ i: 99, data: partida(1) }] })) === 'invalid_slot');
  check(T + 'partida enorme → rechazado (413)', await err(A.putSaves(u, { ranuras: [{ i: 2, data: partida(1, { relleno: 'x'.repeat(500 * 1024) }) }] })) === 'save_too_large');
  check(T + 'las carreras de otro usuario no se ven', (await A.getSaves(u2)).ranuras.length === 0);

  const d = await A.exportData(u);
  check(T + 'descargar mis datos: perfil, compras, entitlements y carreras', d.profile.displayName && Array.isArray(d.purchases.orders) && Array.isArray(d.entitlements) && d.careers.length === 1 && d.careers[0].data);

  await svc.deleteAccount(u);
  check(T + 'eliminar la cuenta borra el perfil y las carreras de la nube', !(await repo.getProfile(U1)) && (await repo.listGameSaves(U1)).length === 0);
}
