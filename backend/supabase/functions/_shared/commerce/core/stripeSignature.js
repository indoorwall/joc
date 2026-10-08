// COPIA GENERADA de commerce/core/stripeSignature.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Firma de webhooks de Stripe (esquema v1): HMAC-SHA256(secret, `${t}.${rawBody}`), cabecera `t=…,v1=…`.
// Implementación con WebCrypto (Deno, Node ≥18 y navegador). Tolerancia por defecto 300 s (nunca 0).
const enc = new TextEncoder();
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
  return Array.from(sig, b => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export function parseSignatureHeader(header) {
  const out = { t: null, v1: [] };
  for (const part of String(header || '').split(',')) {
    const [k, v] = part.split('=').map(x => x && x.trim());
    if (k === 't') out.t = Number(v);
    else if (k === 'v1' && v) out.v1.push(v);
  }
  return out;
}
export async function signPayload(rawBody, secret, timestamp = Math.floor(Date.now() / 1000)) {
  return `t=${timestamp},v1=${await hmacHex(secret, `${timestamp}.${rawBody}`)}`;
}
// Devuelve el evento parseado o lanza un error (firma ausente, inválida o fuera de tolerancia)
export async function verifyStripeSignature(rawBody, header, secret, { toleranceSec = 300, now = Math.floor(Date.now() / 1000) } = {}) {
  if (!secret) throw sigError('missing_secret');
  if (typeof rawBody !== 'string') throw sigError('raw_body_required');
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || !v1.length) throw sigError('bad_header');
  if (!(toleranceSec > 0)) throw sigError('tolerance_must_be_positive');
  if (Math.abs(now - t) > toleranceSec) throw sigError('timestamp_out_of_tolerance');
  const expected = await hmacHex(secret, `${t}.${rawBody}`);
  if (!v1.some(s => safeEqual(s, expected))) throw sigError('signature_mismatch');
  return JSON.parse(rawBody);
}
function sigError(code) { const e = new Error(`Firma de webhook no válida: ${code}`); e.code = code; e.status = 400; return e; }
