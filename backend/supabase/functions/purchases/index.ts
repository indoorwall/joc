// GET /purchases → «Mis compras»: producto, fecha, proveedor, estado y referencia de orden (nunca datos de tarjeta)
import { handle, json } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  return json(await (await service()).purchaseHistory(user));
}));
