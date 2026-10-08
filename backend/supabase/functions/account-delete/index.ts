// POST /account-delete → borra la cuenta: PII fuera; órdenes y pagos se conservan anonimizados (obligación contable).
import { handle, json } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  await (await service()).deleteAccount(user);
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '' } });
  // Los datos ya están anonimizados (idempotente): si Auth falla, se devuelve error para reintentar
  return r.ok ? json({ deleted: true }) : json({ error: 'auth_delete_failed', retry: true }, 502);
}));
