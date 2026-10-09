// POST /admin { action, … } → panel interno. Solo usuarios en admin_users (comprobado en el servidor).
// Acciones: search, user, grant, revoke, webhookErrors, attention, retry, report. Todo queda auditado.
import { handle, json, body } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const admin = await sessionUser(req);
  if (!admin) return json({ error: 'auth_required' }, 401);
  const b = await body(req);
  const a = (await service()).admin;
  switch (b.action) {
    case 'search': return json(await a.searchUsers(admin, b.q));
    case 'user': return json(await a.userDetail(admin, b.userId));
    case 'grant': return json(await a.grant(admin, { userId: b.userId, entitlementId: b.entitlementId, reason: b.reason }));
    case 'revoke': return json(await a.revoke(admin, { userId: b.userId, entitlementId: b.entitlementId, reason: b.reason }));
    case 'webhookErrors': return json(await a.webhookErrors(admin));
    case 'attention': return json(await a.ordersNeedingAttention(admin));
    case 'retry': return json(await a.retryFulfillment(admin, b.orderId));
    case 'stripeSync': return json(await a.syncStripe(admin));
    case 'report': return json(await a.report(admin, { from: b.from, to: b.to }));
    default: return json({ error: 'unknown_action' }, 400);
  }
}));
