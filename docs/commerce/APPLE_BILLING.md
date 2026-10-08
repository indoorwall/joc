# Apple: StoreKit (por defecto) y pagos alternativos en la UE (solo si se aprueban)

> Estado: **preparado y desactivado** (`appleBillingEnabled = false`). Todavía no hay app iOS. Cuando exista
> (Capacitor u otra), el `ApplePaymentProvider` usa un puente nativo (`bridge.storekit`). Normas consultadas el
> 2026-10-08 en FUENTES_PLATAFORMAS.md. **Requiere revisión legal y comercial.**

## Regla

Todo contenido digital en iOS (packs, deportes, expansiones, Prestige, quitar anuncios) se vende con **StoreKit**
(norma 3.1.1). El `PaymentRouter` **nunca** usa Stripe en iOS salvo que se cumpla todo esto a la vez:

- `ios.externalPurchase.enabled = true` en `remote_config` (solo lo cambias tú);
- la tienda del usuario está en `ios.externalPurchase.storefronts`;
- el dispositivo es elegible: `ExternalPurchaseCustomLink.isEligible` es verdadero, y lo informa la app;
- el usuario no es menor (menores de 13: nunca; entre 13 y 17: hace falta control parental);
- hemos firmado los términos de la UE (anexo 14, desde el 2026-10-01), tenemos el permiso
  `com.apple.developer.storekit.custom-purchase-link.allowed-regions`, mostramos el aviso del sistema
  (`showNotice(type:)`) y enviamos los tokens a la **External Purchase Server API**;
- aceptamos mantener la misma combinación de opciones de pago **12 meses** en todas las tiendas de la UE.

Las comisiones de la UE en 2026 son 26 %/15 % con Apple, 20 %/10 % con procesador alternativo y 15 %/10 % con enlace
externo. Stripe **no** elimina la comisión de Apple.

## Compra con StoreKit → mismo entitlement

1. La app llama a `Product.purchase(options: [.appAccountToken(<user_id>)])`.
2. La app manda el `jwsRepresentation` de la transacción a `POST /functions/v1/iap-verify`:
   `{ provider: 'apple', signedTransaction }`.
3. El servidor verifica la firma con la **App Store Server Library oficial**
   (`backend/supabase/functions/_shared/apple.ts`) y comprueba que `appAccountToken` es el usuario de la sesión, el
   producto (`com.delbarrio.<sku>`) y el entorno.
4. Llama a `grantFromProvider({ source: 'apple', sourcePurchaseId: originalTransactionId })`: orden PAID →
   FULFILLED → entitlement activo. Es idempotente.
5. Las **App Store Server Notifications V2** llegan a `POST /functions/v1/apple-notifications`: `REFUND` o `REVOKE`
   revoca el entitlement; `ONE_TIME_CHARGE` concede si trae `appAccountToken`.

## Restaurar

- Botón «Restaurar compras» → `AppStore.sync()` → `Transaction.currentEntitlements` → `POST /restore` con
  `{ apple: [jws…] }`.
- El servidor vuelve a verificar cada transacción. Nunca se pide volver a pagar.
- Una compra hecha en la web con Stripe también aparece en iOS, porque el entitlement está en la cuenta. Revisa la
  norma 3.1.3 sobre contenido comprado fuera de la app («multiplatform services») antes de anunciarlo.

## Configuración de App Store Connect (cuando haya app)

1. Productos **no consumibles** con id `com.delbarrio.<sku>` (por ejemplo `com.delbarrio.pack_debut`) y precio por
   tramo.
2. Clave de la **App Store Server API** (Users and Access → Integrations → In-App Purchase): `.p8`, Key ID e Issuer
   ID. Van en `APPLE_PRIVATE_KEY`, `APPLE_KEY_ID` y `APPLE_ISSUER_ID`.
3. URL de las notificaciones V2 (producción y sandbox): `https://<proyecto>.supabase.co/functions/v1/apple-notifications`.
4. Certificados raíz de Apple (Apple PKI) en `APPLE_ROOT_CERTS_B64`. Bundle ID y App Apple ID en `APPLE_BUNDLE_ID` y
   `APPLE_APP_ID`.

## Pruebas

- **StoreKit Testing en Xcode:** archivo `.storekit` con los mismos ids. Sirve para probar comprar, cancelar, compras
  pendientes (Ask to Buy) y reembolsos sin App Store Connect.
- **Sandbox:** cuentas de Sandbox (App Store Connect → Users and Access → Sandbox Testers), con `APPLE_ENV=Sandbox`.
- **TestFlight:** usa el sandbox, así que no se cobra. Prueba compra, restaurar en otro dispositivo y reembolso
  (desde el panel de sandbox).
- **Tests automáticos:** `tests/commerce/contract.mjs` usa un verificador simulado y cubre transacción válida,
  duplicada, de otra cuenta, JWS inválido, notificación REFUND y el flag desactivado.
