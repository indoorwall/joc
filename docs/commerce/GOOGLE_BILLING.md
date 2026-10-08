# Google Play: Play Billing (por defecto) y facturación alternativa (solo si nos inscribimos)

> Estado: **preparado y desactivado** (`googleBillingEnabled = false`). Todavía no hay app Android. El
> `GooglePaymentProvider` usa un puente nativo (`bridge.playBilling`). Normas consultadas el 2026-10-08 en
> FUENTES_PLATAFORMAS.md. **Requiere revisión legal y comercial.**

## Regla

Contenido digital en Android = **Google Play Billing**, con la librería 8 o posterior. El `PaymentRouter` solo usa
Stripe en Android si se cumple todo esto:

- `android.alternativeBilling.enabled = true`;
- el país del usuario está en `countries`;
- estamos inscritos en el programa correspondiente (`mode`: `alternative_only`, `user_choice` o `external_offers`);
- el usuario no es menor.

En `user_choice`, Play Billing se ofrece **en paralelo** (`alsoOfferGoogle`). Cada transacción hecha con Stripe se
informa a Google en menos de 24 h (API de transacciones externas). **Stripe no elimina la comisión de Google**: en el
EEE, de 2026 en adelante, es del 20–25 %, o del 10 % sobre el primer millón.

## Compra con Play Billing → mismo entitlement

1. La app lanza la compra con `obfuscatedAccountId` = hash del id de usuario (`accountHash`).
2. La app manda `{ provider: 'google', sku, purchaseToken }` a `POST /functions/v1/iap-verify`.
3. El servidor llama a la Play Developer API (`purchases.productsv2`, ver `_shared/google.ts`) con una cuenta de
   servicio y comprueba el producto, el estado (`PURCHASED` o `PENDING`) y la cuenta ofuscada.
4. Si la compra está `PENDING`, no se concede nada; se espera.
5. Si está `PURCHASED`, se llama a `grantFromProvider({ source: 'google', sourcePurchaseId: orderId })` →
   entitlement. Después se hace **acknowledge en menos de 3 días**; si no, Google reembolsa sola.
6. Las **notificaciones en tiempo real** (Pub/Sub push) llegan a `POST /functions/v1/google-rtdn`. Una compra anulada
   (voided) se revoca.
   - Autenticación del push: como mínimo, un token secreto en la URL de la suscripción.
   - **Antes de producción hay que sustituirlo por OIDC**: la cuenta de servicio de Pub/Sub firma un JWT y la función
     verifica emisor y audiencia.

> Verifica los nombres de campo de `purchases.productsv2` contra la referencia vigente antes de activarlo: la API v2
> es reciente.

## Restaurar

`queryPurchasesAsync` → `POST /restore` con `{ google: [{ sku, purchaseToken }] }` → el servidor verifica cada compra
de nuevo.

## Configuración de Google Play Console (cuando haya app)

1. Productos integrados **únicos (no consumibles)** con id = SKU (por ejemplo `pack_debut`).
2. Cuenta de servicio en Google Cloud con acceso a la API Google Play Android Developer; invítala en Play Console
   (Usuarios y permisos) con permiso de finanzas y pedidos. El JSON va en `GOOGLE_SERVICE_ACCOUNT_JSON`.
3. Tema de Pub/Sub y suscripción push a `https://<proyecto>.supabase.co/functions/v1/google-rtdn?token=<GOOGLE_PUBSUB_SHARED_TOKEN>`.
   Configúralo en Monetización → Configuración de monetización.
4. `GOOGLE_PACKAGE_NAME` = el nombre del paquete de la app.

## Pruebas

- **Probadores de licencia** (Play Console → Configuración → Pruebas de licencia), con tarjetas de prueba: siempre
  aprueba, siempre rechaza y lentas (para compras pendientes).
- Prueba también con una cuenta que **no** sea probadora.
- **Cancelar y reembolsar:** desde el panel de pedidos → comprueba que llega la notificación de anulación y se revoca
  el entitlement.
- **Restaurar:** reinstala la app o usa otro dispositivo con la misma cuenta.
- **Tests automáticos:** compra pendiente, comprada con acknowledge, anulada y flag desactivado, con un verificador
  simulado (`tests/commerce/contract.mjs`).
