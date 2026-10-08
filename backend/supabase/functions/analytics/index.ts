// POST /analytics { name, props } → telemetría de compra (lista blanca de eventos y propiedades; sin tarjeta ni PII)
import { handle, json, body } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  const b = await body(req);
  const ok = await (await service()).track(user?.id || null, String(b.name || ''), b.props || {});
  return json({ ok });
}));
