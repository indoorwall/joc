// Backend REAL por HTTP (Supabase Edge Functions). Solo en el build web/app, nunca en el prototipo simulado.
// El token es el JWT de la sesión de Supabase Auth; el servidor saca el usuario de ahí.
export function createHttpBackend({ functionsUrl, publishableKey, fetchImpl = (...a) => globalThis.fetch(...a) }) {
  const req = async (name, { method = 'GET', token, body, query } = {}) => {
    const url = `${functionsUrl}/${name}${query ? `?${new URLSearchParams(query)}` : ''}`;
    const r = await fetchImpl(url, { method, headers: Object.assign({ apikey: publishableKey, 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}), body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || `http_${r.status}`), { code: j.error || `http_${r.status}`, status: r.status, message: j.message });
    return j;
  };
  return {
    kind: 'http',
    checkout: (token, body) => req('checkout-session', { method: 'POST', token, body }),
    entitlements: token => req('entitlements', { token }),
    orderStatus: (token, orderId) => req('entitlements', { token, query: { order: orderId } }),
    purchases: token => req('purchases', { token }),
    restore: (token, body) => req('restore', { method: 'POST', token, body: body || {} }),
    promo: (token, code) => req('promo-redeem', { method: 'POST', token, body: { code } }),
    storefront: (token, game) => req('storefront', { method: 'POST', token, body: { game } }),
    iapVerify: (token, body) => req('iap-verify', { method: 'POST', token, body }),
    track: (token, name, props) => req('analytics', { method: 'POST', token, body: { name, props } }).catch(() => null),
    remoteConfig: () => req('remote-config'),
    deleteAccount: token => req('account-delete', { method: 'POST', token }),
  };
}
