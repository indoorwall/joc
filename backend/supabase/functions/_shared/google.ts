// Verificador de Google Play (Play Developer API). Desactivado mientras googleBillingEnabled = false.
// Secretos: GOOGLE_SERVICE_ACCOUNT_JSON (cuenta de servicio con permiso en Play Console), GOOGLE_PACKAGE_NAME
async function accessToken() {
  const sa = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') || 'null');
  if (!sa) throw Object.assign(new Error('google_not_configured'), { code: 'google_not_configured', status: 503 });
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` });
  return (await r.json()).access_token as string;
}
export function createGoogleVerifier() {
  const pkg = Deno.env.get('GOOGLE_PACKAGE_NAME') || '';
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases`;
  return {
    // purchases.productsv2 (getproductpurchasev2): estado, reconocimiento, cuenta ofuscada.
    // VERIFICAR nombres de campos contra la referencia vigente antes de activar (ver docs/commerce/GOOGLE_BILLING.md).
    async getPurchase(productId: string, token: string) {
      const r = await fetch(`${base}/productsv2/tokens/${encodeURIComponent(token)}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
      if (!r.ok) throw Object.assign(new Error('google_purchase_not_found'), { code: 'google_purchase_not_found', status: 404 });
      const p = await r.json();
      const li = (p.productLineItem || []).find((x: any) => x.productId === productId);
      if (!li) throw Object.assign(new Error('google_product_mismatch'), { code: 'google_product_mismatch', status: 409 });
      const state = p.purchaseStateContext?.purchaseState;   // PURCHASED | PENDING | CANCELLED
      return { orderId: p.orderId, purchaseState: state, acknowledged: p.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED', obfuscatedAccountId: p.obfuscatedExternalAccountId, productId, regionCode: p.regionCode, testPurchase: !!p.testPurchaseContext };
    },
    // Reconocer en < 3 días (si no, Google reembolsa)
    async acknowledge(productId: string, token: string) {
      await fetch(`${base}/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}:acknowledge`, { method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: '{}' });
    },
  };
}
