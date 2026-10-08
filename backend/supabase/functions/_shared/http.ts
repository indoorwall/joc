// Respuestas JSON, CORS restringido (juego y panel admin) y traducción de errores (sin filtrar detalles internos).
// Orígenes permitidos: APP_URL (juego) y ADMIN_URL (panel). Las cabeceras CORS se ponen POR PETICIÓN en `handle`.
const ALLOWED = [Deno.env.get('APP_URL'), Deno.env.get('ADMIN_URL')].filter(Boolean) as string[];
export const corsFor = (origin: string | null) => ({ 'Access-Control-Allow-Origin': origin && ALLOWED.includes(origin) ? origin : (ALLOWED[0] || 'null'), 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' });
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
export function fail(e: any) {
  const status = typeof e?.status === 'number' ? e.status : 500;
  if (status >= 500) console.error('[commerce] error', e?.code || e?.message);
  return json({ error: status >= 500 ? 'internal_error' : (e?.code || 'error'), requires: e?.requires, reason: e?.reason, message: status < 500 ? e?.message : undefined }, status);
}
export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const cors = corsFor(req.headers.get('Origin'));
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    let res: Response;
    try { res = await fn(req); } catch (e) { res = fail(e); }
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  };
}
export async function body(req: Request) { try { return await req.json(); } catch { return {}; } }
