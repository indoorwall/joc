// POST /restore { apple: [signedTransaction…], google: [{ sku, purchaseToken }…] }
// Re-verifica en el servidor y reconcilia Stripe (webhooks perdidos). Nunca pide volver a pagar.
import { handle, json, body } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  const b = await body(req);
  return json(await (await service()).restore(user, { apple: Array.isArray(b.apple) ? b.apple.slice(0, 50) : [], google: Array.isArray(b.google) ? b.google.slice(0, 50) : [] }));
}));
