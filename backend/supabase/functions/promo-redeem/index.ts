// POST /promo-redeem { code } → canjea un código (validación en el servidor, rate limit, un canje por usuario)
import { handle, json, body } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  const b = await body(req);
  return json(await (await service()).redeemPromo(user, String(b.code || '').slice(0, 40)));
}));
