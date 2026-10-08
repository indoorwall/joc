// GET /account-export → descargar mis datos (perfil, compras, entitlements y carreras). RGPD art. 15 y 20.
import { handle, json } from '../_shared/http.ts';
import { accounts, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  return json(await (await accounts()).exportData(user));
}));
