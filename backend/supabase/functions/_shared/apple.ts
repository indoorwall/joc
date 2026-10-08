// Verificador de Apple (App Store Server API + notificaciones V2). Usa la librería OFICIAL de Apple para verificar
// la cadena de certificados del JWS. Desactivado mientras appleBillingEnabled = false.
// Secretos: APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (.p8), APPLE_BUNDLE_ID, APPLE_APP_ID, APPLE_ENV (Sandbox|Production)
export function createAppleVerifier() {
  const env = (k: string) => Deno.env.get(k) || '';
  let verifier: any = null;
  async function get() {
    if (verifier) return verifier;
    const lib: any = await import('npm:@apple/app-store-server-library');
    const roots = (env('APPLE_ROOT_CERTS_B64') || '').split(',').filter(Boolean).map(b => Uint8Array.from(atob(b), c => c.charCodeAt(0)));
    if (!roots.length) throw Object.assign(new Error('apple_not_configured'), { code: 'apple_not_configured', status: 503 });
    const environment = env('APPLE_ENV') === 'Production' ? lib.Environment.PRODUCTION : lib.Environment.SANDBOX;
    verifier = new lib.SignedDataVerifier(roots, true, environment, env('APPLE_BUNDLE_ID'), Number(env('APPLE_APP_ID')) || undefined);
    return verifier;
  }
  return {
    async verifyTransaction(jws: string) {
      const t = await (await get()).verifyAndDecodeTransaction(jws);
      return { transactionId: t.transactionId, originalTransactionId: t.originalTransactionId, productId: t.productId, appAccountToken: t.appAccountToken, environment: t.environment, storefront: t.storefront, price: t.price, currency: t.currency, revocationDate: t.revocationDate };
    },
    async verifyNotification(signedPayload: string) {
      const v = await get();
      const n = await v.verifyAndDecodeNotification(signedPayload);
      const tx = n.data?.signedTransactionInfo ? await v.verifyAndDecodeTransaction(n.data.signedTransactionInfo) : {};
      return { notificationUUID: n.notificationUUID, notificationType: n.notificationType, transaction: tx };
    },
  };
}
