// PaymentProvider: misma interfaz para todos → { purchase(sku, ctx) → { orderId, orderRef, url?, pending?, native? } }.
// Todos terminan igual: el servidor verifica y concede el ENTITLEMENT. El cliente nunca concede nada.
export function createMockPaymentProvider({ backend }) {
  return { id: 'mock', available: () => true,
    async purchase(sku, { token, consentWithdrawal }) { return backend.checkout(token, { sku, platform: 'mock', consentWithdrawal }); } };
}
// Web/PWA: Stripe Checkout alojado. El backend crea la sesión; aquí solo redirigimos (y nada se concede al volver).
export function createStripePaymentProvider({ backend, navigate }) {
  return { id: 'stripe', available: () => true,
    async purchase(sku, { token, consentWithdrawal, platform = 'web' }) {
      const r = await backend.checkout(token, { sku, platform, consentWithdrawal });
      if (r && r.url && navigate) navigate(r.url);
      return r;
    } };
}
// iOS: StoreKit vía puente nativo (Capacitor u otro). appAccountToken = id de usuario para ligar la compra a la cuenta.
export function createApplePaymentProvider({ backend, bridge }) {
  return { id: 'apple', available: () => !!(bridge && bridge.storekit),
    async purchase(sku, { token, userId, product }) {
      const r = await bridge.storekit.purchase(product.platformProducts.apple.productId, { appAccountToken: userId });
      if (r.pending) return { pending: true };
      return backend.iapVerify(token, { provider: 'apple', signedTransaction: r.signedTransaction });
    },
    async restore({ token }) { const txs = await bridge.storekit.currentEntitlements(); return backend.restore(token, { apple: txs.map(t => t.signedTransaction) }); } };
}
// Android: Google Play Billing vía puente nativo. obfuscatedAccountId = hash del id de usuario.
export function createGooglePaymentProvider({ backend, bridge }) {
  return { id: 'google', available: () => !!(bridge && bridge.playBilling),
    async purchase(sku, { token, accountHash, product }) {
      const r = await bridge.playBilling.purchase(product.platformProducts.google.productId, { obfuscatedAccountId: accountHash });
      if (r.pending) return { pending: true };
      return backend.iapVerify(token, { provider: 'google', sku, purchaseToken: r.purchaseToken });
    },
    async restore({ token }) { const ps = await bridge.playBilling.queryPurchases(); return backend.restore(token, { google: ps.map(p => ({ sku: p.sku, purchaseToken: p.purchaseToken })) }); } };
}
