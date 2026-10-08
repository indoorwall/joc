// POST /google-rtdn (Real-time developer notifications vía Pub/Sub push, sin JWT de Supabase).
// La autenticidad del push se comprueba con el token OIDC de Pub/Sub (audiencia = esta URL). Desactivado hasta googleBillingEnabled.
import { service } from '../_shared/context.ts';
Deno.serve(async req => {
  try {
    const svc = await service();
    if (!svc.config.googleBillingEnabled) return new Response('disabled', { status: 503 });
    const expected = Deno.env.get('GOOGLE_PUBSUB_SHARED_TOKEN');   // mínimo: token en la URL de suscripción; mejor: OIDC (ver GOOGLE_BILLING.md)
    if (!expected || new URL(req.url).searchParams.get('token') !== expected) return new Response('unauthorized', { status: 401 });
    const msg = await req.json();
    const data = JSON.parse(atob(msg?.message?.data || 'e30='));
    if (data.voidedPurchaseNotification) await svc.handleGoogleVoided({ orderId: data.voidedPurchaseNotification.orderId, eventId: msg.message.messageId });
    // ONE_TIME_PRODUCT_PURCHASED: la compra se concede cuando la app llama a /restore o /verify con el token (sabemos el usuario)
    return new Response('ok');
  } catch (e: any) { console.error('[google]', e?.code || e?.message); return new Response('error', { status: 500 }); }
});
