// POST /apple-notifications (App Store Server Notifications V2, sin JWT). Firma JWS verificada con la librería oficial.
// Desactivado hasta appleBillingEnabled = true.
import { service } from '../_shared/context.ts';
Deno.serve(async req => {
  try {
    const svc = await service();
    if (!svc.config.appleBillingEnabled) return new Response('disabled', { status: 503 });
    const { signedPayload } = await req.json();
    await svc.handleAppleNotification(String(signedPayload || ''));
    return new Response('ok');
  } catch (e: any) { console.error('[apple]', e?.code || e?.message); return new Response('error', { status: e?.status && e.status < 500 ? 400 : 500 }); }
});
