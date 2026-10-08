// GET /entitlements            → { entitlements, catalogVersion, syncedAt }
// GET /entitlements?order=<id> → estado de una orden propia (para la página «Estamos verificando tu compra»)
import { handle, json } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  const svc = await service();
  const order = new URL(req.url).searchParams.get('order');
  if (order) return json(Object.assign(await svc.orderStatus(user, order), await svc.getEntitlements(user)));
  return json(await svc.getEntitlements(user));
}));
