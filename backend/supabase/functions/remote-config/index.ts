// GET /remote-config → flags y configuración no secreta del entorno (sin JWT). Cambia sin recompilar.
import { handle, json } from '../_shared/http.ts';
import { remoteConfig } from '../_shared/context.ts';
Deno.serve(handle(async () => {
  const c = await remoteConfig();
  const { refunds, disputes, rateLimits, liveModeAllowed, ...publicConfig } = c as any;   // lo interno no sale
  return json(publicConfig);
}));
