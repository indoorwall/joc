// GET /game-saves → mis carreras en la nube · PUT /game-saves → subir copia (por ranura gana la más reciente)
// Solo datos de juego: no concede nada. Las compras siguen saliendo de los entitlements del servidor.
import { handle, json } from '../_shared/http.ts';
import { accounts, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  if (!user) return json({ error: 'auth_required' }, 401);
  const A = await accounts();
  if (req.method === 'GET') return json(await A.getSaves(user));
  if (req.method === 'PUT' || req.method === 'POST') {
    const raw = await req.text();
    if (raw.length > 2 * 1024 * 1024) return json({ error: 'save_too_large' }, 413);
    let body = {}; try { body = JSON.parse(raw); } catch (_) { return json({ error: 'invalid_saves' }, 400); }
    return json(await A.putSaves(user, body));
  }
  return json({ error: 'method_not_allowed' }, 405);
}));
