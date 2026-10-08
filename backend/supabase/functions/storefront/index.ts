// POST /storefront { game: { hitos, trophies, club } } → catálogo con estado por usuario (comprado, requisitos, precio)
import { handle, json, body } from '../_shared/http.ts';
import { service, sessionUser } from '../_shared/context.ts';
Deno.serve(handle(async req => {
  const user = await sessionUser(req);
  const b = await body(req);
  const g = b.game || {};
  const game = { hitos: typeof g.hitos === 'object' ? g.hitos : {}, trophies: Array.isArray(g.trophies) ? g.trophies.slice(0, 20) : [], club: typeof g.club === 'string' ? g.club : null };
  return json(await (await service()).storefront(user, game));
}));
