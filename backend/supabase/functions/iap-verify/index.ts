// POST /iap-verify { provider: 'apple', signedTransaction } | { provider: 'google', sku, purchaseToken }
// La app nativa manda la prueba de compra; el servidor la verifica con Apple/Google y concede el entitlement.
import { handle, json, body } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  const b = await body(req);
  const svc = await service();
  if (b.provider === 'apple') return json(await svc.verifyAppleTransaction(user, String(b.signedTransaction || '')));
  if (b.provider === 'google') return json(await svc.verifyGooglePurchase(user, { sku: String(b.sku || ''), purchaseToken: String(b.purchaseToken || '') }));
  return json({ error: 'unknown_provider' }, 400);
}));
