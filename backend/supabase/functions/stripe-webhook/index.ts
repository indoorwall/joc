// POST /stripe-webhook (sin JWT: verify_jwt = false). Cuerpo SIN TOCAR + cabecera Stripe-Signature.
// 200 = procesado o duplicado · 400 = firma o modo inválido (Stripe no reintenta) · 500 = reintentar.
import { service } from '../_shared/context.ts';
Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });
  const raw = await req.text();                       // ¡antes de cualquier JSON.parse!
  const sig = req.headers.get('stripe-signature') || '';
  try {
    const r = await (await service()).handleStripeWebhook(raw, sig);
    return new Response(JSON.stringify({ received: true, duplicate: !!r.duplicate }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    const status = e?.status && e.status < 500 ? 400 : 500;
    console.error('[stripe-webhook]', e?.code || e?.message);
    return new Response(JSON.stringify({ error: e?.code || 'error' }), { status, headers: { 'Content-Type': 'application/json' } });
  }
});
