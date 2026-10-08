// PaymentRouter: elige proveedor según plataforma, tienda, país, configuración, programas de billing y producto.
// NUNCA «Stripe siempre». En iOS/Android, la tienda del sistema salvo programa aprobado y elegible.
export const PROVIDERS = ['mock', 'stripe', 'apple', 'google'];

// ctx = { platform: 'web'|'pwa'|'ios'|'android', storefront, country, appleExternalEligible, isMinor, age }
export function choosePaymentProvider(product, ctx, config) {
  if (!config.commerceEnabled) return { provider: null, reason: 'commerce_disabled' };
  if (!product || !product.prices) return { provider: null, reason: 'unknown_product' };
  if (config.environment === 'development' || ctx.platform === 'mock') return { provider: 'mock', reason: 'development' };
  const p = ctx.platform;
  if (p === 'web' || p === 'pwa') return config.stripeEnabled ? { provider: 'stripe', reason: 'web' } : { provider: null, reason: 'stripe_disabled' };
  if (p === 'ios') {
    const ext = config.ios && config.ios.externalPurchase;
    const minor = ctx.isMinor || (ctx.age != null && ctx.age < 18);
    if (ext && ext.enabled && config.stripeEnabled && !minor && (ext.storefronts || []).includes(ctx.storefront) && ctx.appleExternalEligible === true)
      return { provider: 'stripe', reason: 'ios_external_purchase', requiresSystemDisclosure: true, reportTo: 'apple_external_purchase_server_api' };
    return config.appleBillingEnabled ? { provider: 'apple', reason: 'storekit' } : { provider: null, reason: 'apple_billing_disabled' };
  }
  if (p === 'android') {
    const alt = config.android && config.android.alternativeBilling;
    if (alt && alt.enabled && config.stripeEnabled && (alt.countries || []).includes(ctx.country) && !(ctx.isMinor))
      return { provider: 'stripe', reason: `android_${alt.mode || 'alternative_billing'}`, reportTo: 'google_external_transactions_api', alsoOfferGoogle: alt.mode === 'user_choice' && config.googleBillingEnabled };
    return config.googleBillingEnabled ? { provider: 'google', reason: 'play_billing' } : { provider: null, reason: 'google_billing_disabled' };
  }
  return { provider: null, reason: 'unknown_platform' };
}
