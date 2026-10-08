// POST /checkout-session  { sku, platform, consentWithdrawal }  → { orderId, orderRef, url }
// Usuario desde el JWT; precio y producto desde el servidor. Nunca acepta precio ni userId del cliente.
import { handle, json, body } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required', message: 'Crea una cuenta para proteger y restaurar tus compras en cualquier dispositivo.' }, 401);
  const b = await body(req);
  const svc = await service();
  return json(await svc.createCheckout(user, { sku: String(b.sku || ''), platform: b.platform === 'pwa' ? 'pwa' : 'web', consentWithdrawal: b.consentWithdrawal === true }));
}));
