// Respuestas JSON, CORS restringido al dominio del juego y traducción de errores (sin filtrar detalles internos).
const ORIGIN = Deno.env.get('APP_URL') || '*';
export const cors = { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' };
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
export function fail(e: any) {
  const status = typeof e?.status === 'number' ? e.status : 500;
  if (status >= 500) console.error('[commerce] error', e?.code || e?.message);
  return json({ error: status >= 500 ? 'internal_error' : (e?.code || 'error'), requires: e?.requires, reason: e?.reason }, status);
}
export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    try { return await fn(req); } catch (e) { return fail(e); }
  };
}
export async function body(req: Request) { try { return await req.json(); } catch { return {}; } }
