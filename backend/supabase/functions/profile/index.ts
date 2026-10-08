// GET /profile → mi perfil · PATCH /profile → cambiarlo (validado en el servidor: país, nombre, edad una sola vez, términos)
import { handle, json } from '../_shared/http.ts';
import { accounts, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  const A = await accounts();
  if (req.method === 'GET') return json(await A.getProfile(user));
  if (req.method === 'PATCH' || req.method === 'POST') return json(await A.updateProfile(user, await req.json().catch(() => ({}))));
  return json({ error: 'method_not_allowed' }, 405);
}));
