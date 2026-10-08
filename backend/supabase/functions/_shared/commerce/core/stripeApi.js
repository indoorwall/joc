// COPIA GENERADA de commerce/core/stripeApi.js (node commerce/tools/sync-backend.mjs). No editar aquí.
// Cliente REST mínimo de Stripe (solo servidor). Sin SDK: form-encoded + fetch inyectado (testeable).
// La versión de la API se fija por entorno (STRIPE_API_VERSION). Nunca se usa en el cliente del juego.
export function encodeForm(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (x && typeof x === 'object' ? encodeForm(x, `${key}[${i}]`, out) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(x)}`)));
    else if (typeof v === 'object') encodeForm(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out.join('&');
}
export function createStripeApi({ secretKey, apiVersion, fetchImpl = globalThis.fetch, base = 'https://api.stripe.com/v1' }) {
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY no configurada');
  const call = async (method, path, params, idempotencyKey) => {
    const headers = { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' };
    if (apiVersion) headers['Stripe-Version'] = apiVersion;
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const url = method === 'GET' && params ? `${base}${path}?${encodeForm(params)}` : `${base}${path}`;
    const res = await fetchImpl(url, { method, headers, body: method === 'GET' ? undefined : encodeForm(params) });
    const body = await res.json();
    if (!res.ok) { const e = new Error(`Stripe ${res.status}: ${body && body.error && body.error.message}`); e.status = res.status; e.stripe = body && body.error; throw e; }
    return body;
  };
  return {
    livemode: secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_'),
    createCustomer: (p, idem) => call('POST', '/customers', p, idem),
    createCheckoutSession: (p, idem) => call('POST', '/checkout/sessions', p, idem),
    retrieveCheckoutSession: (id) => call('GET', `/checkout/sessions/${encodeURIComponent(id)}`, { expand: ['payment_intent.latest_charge.balance_transaction'] }),
    retrievePaymentIntent: (id) => call('GET', `/payment_intents/${encodeURIComponent(id)}`, { expand: ['latest_charge.balance_transaction'] }),
  };
}
