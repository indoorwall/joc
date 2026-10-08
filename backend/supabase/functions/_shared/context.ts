// Contexto común de las Edge Functions: base de datos, Stripe, configuración remota, usuario de la sesión.
// SECRETOS: solo variables de entorno del servidor (supabase secrets set …). Nunca en el cliente.
// @deno-types="npm:@types/pg@8.11.10"
import pg from 'npm:pg@8.13.1';
import { createCommerceService } from './commerce/core/service.js';
import { createAccountService } from './commerce/core/accounts.js';
import { createPgRepo } from './commerce/core/pgRepo.js';
import { createStripeApi } from './commerce/core/stripeApi.js';
import { resolveConfig } from './commerce/core/config.js';
import { createAppleVerifier } from './apple.ts';
import { createGoogleVerifier } from './google.ts';

const env = (k: string, def = '') => Deno.env.get(k) ?? def;
export const ENVIRONMENT = env('APP_ENV', 'development');            // development | staging | production
let pool: pg.Pool | null = null;
export function db() {
  if (!pool) pool = new pg.Pool({ connectionString: env('SUPABASE_DB_URL'), max: 2, idleTimeoutMillis: 10_000 });
  return pool;
}
export async function remoteConfig() {
  const r = await db().query('select value from remote_config where environment = $1 and key = $2', [ENVIRONMENT, 'commerce']);
  return resolveConfig(undefined, r.rows[0]?.value || {}, { environment: ENVIRONMENT });
}
export async function service() {
  const config = await remoteConfig();
  const key = env('STRIPE_SECRET_KEY');
  // Seguridad: una clave live fuera de producción, o en producción sin «ACTIVAR PRODUCCIÓN», no se usa
  if ((key.startsWith('sk_live_') || key.startsWith('rk_live_')) && !(ENVIRONMENT === 'production' && config.liveModeAllowed)) throw new Error('live_key_not_allowed_here');
  // STRIPE_API_BASE: solo para pruebas locales (stripe-mock / tests e2e). Ignorado en producción.
  const apiBase = ENVIRONMENT !== 'production' && env('STRIPE_API_BASE') ? env('STRIPE_API_BASE') : undefined;
  const stripe = key ? createStripeApi({ secretKey: key, apiVersion: env('STRIPE_API_VERSION', '2026-09-30.endive'), ...(apiBase ? { base: apiBase } : {}) }) : null;
  return createCommerceService({
    repo: createPgRepo({ pool: db() }), stripe, config,
    env: { environment: ENVIRONMENT, stripeWebhookSecret: env('STRIPE_WEBHOOK_SECRET'), appUrl: env('APP_URL', 'http://localhost:5173') },
    verifiers: { apple: config.appleBillingEnabled ? createAppleVerifier() : undefined, google: config.googleBillingEnabled ? createGoogleVerifier() : undefined },
    log: (...a: unknown[]) => console.log('[commerce]', ...a),
  });
}
// Usuario SIEMPRE desde el JWT de la sesión (nunca desde el cuerpo de la petición)
export async function sessionUser(req: Request) {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const r = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, { headers: { Authorization: auth, apikey: env('SUPABASE_ANON_KEY') || env('SUPABASE_PUBLISHABLE_KEY') } });
  if (!r.ok) return null;
  const u = await r.json();
  if (!u?.id || u.is_anonymous) return null;   // las compras requieren identidad persistente (Apple, Google o email)
  const p = await db().query('select is_tester, is_minor from profiles where user_id = $1', [u.id]);
  return { id: u.id as string, isTester: !!p.rows[0]?.is_tester, isMinor: !!p.rows[0]?.is_minor };
}
// Cuentas: perfil (edad, términos, control parental) y carreras en la nube. Misma lógica que el backend simulado.
export async function accounts() {
  const commerce = await service();
  return createAccountService({ repo: createPgRepo({ pool: db() }), commerce });
}
