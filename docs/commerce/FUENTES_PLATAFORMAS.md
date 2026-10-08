# Normas de plataformas consultadas (8 de octubre de 2026)

> **Requiere revisión legal y comercial.** Esto es un resumen técnico de páginas oficiales consultadas el 2026-10-08.
> Las normas de Apple y Google cambian a menudo, y en EE. UU. dependen de juicios que siguen abiertos. Antes de activar
> cualquier programa de pago alternativo, vuelve a leer las páginas enlazadas y los contratos que firmes.
> Los puntos marcados **[sin verificar]** no se han podido confirmar en una fuente oficial.

## Apple App Store

- **Contenido digital = compra dentro de la app (IAP) por defecto.** Lo dice la norma 3.1.1: cosméticos, niveles y
  contenido premium.
  https://developer.apple.com/app-store/review/guidelines/#in-app-purchase
- **EE. UU.:**
  - Se permiten botones y enlaces a compras en la web (3.1.1(a) y 3.1.3).
  - La comisión sobre esas compras **no está fijada**. Un tribunal permite a Apple cobrar «costes necesarios», pero aún
    no ha decidido cuánto. **[en litigio]**
- **UE: condiciones nuevas desde el 2026-10-01** (anexo 14 del contrato de desarrollador):
  - Compra dentro de la app con Apple: 26 % (15 % en el programa de pequeñas empresas).
  - Procesador alternativo dentro de la app: 20 % / 10 %.
  - Enlace a compra fuera de la app: 15 % / 10 %, sobre las ventas de los 7 días siguientes al toque.
  - Hay que mantener la misma combinación de opciones durante **12 meses** en todas las tiendas de la UE.
  - Menores: no se permiten ofertas fuera de la app para menores de 13 años ni en la categoría Niños, y entre 13 y
    17 años hace falta un control parental.
  - https://developer.apple.com/support/dma-and-apps-in-the-eu/
  - https://developer.apple.com/support/communication-and-promotion-of-offers-on-the-app-store-in-the-eu/
- **Permiso y API para la UE:**
  - Permiso de la app: `com.apple.developer.storekit.custom-purchase-link.allowed-regions` (iOS 26.2 o posterior).
  - Antes de nada, comprobar `ExternalPurchaseCustomLink.isEligible`. Después, pedir los tokens con `token(for:)`
    (ACQUISITION y SERVICES) y mostrar el aviso del sistema con `showNotice(type:)`.
  - La opción de Apple tiene que verse al menos igual de destacada que las demás.
  - https://developer.apple.com/documentation/storekit/external-purchase
- **Informes a Apple:**
  - Hay que informar de **todos** los tokens, también de los que no acabaron en compra, mediante la External Purchase
    Server API.
  - Las transacciones se informan cada mes, dentro de los 15 días siguientes.
  - Con pagos alternativos, el IVA lo declaras y lo pagas tú.
  - https://developer.apple.com/documentation/externalpurchaseserverapi
- **Validación en el servidor:**
  - App Store Server API, con JWT ES256 firmado con una clave de App Store Connect. Las transacciones llegan como
    `JWSTransaction` firmadas.
  - Notificaciones del servidor, versión 2: `ONE_TIME_CHARGE`, `REFUND`, `REFUND_REVERSED`.
  - Apple publica una librería oficial que verifica la cadena de firma.
  - https://developer.apple.com/documentation/appstoreserverapi
  - https://developer.apple.com/documentation/appstoreservernotifications
- **Restaurar compras:** `Transaction.currentEntitlements` y `AppStore.sync()`. Rellenar `appAccountToken` con el id
  de nuestro usuario **[sin verificar en fuente oficial]**.
- **Inicio de sesión:** si ofreces Google, la norma 4.8 obliga a ofrecer también una opción equivalente, en la práctica
  «Iniciar sesión con Apple» **[comprobar la norma 4.8]**.

## Google Play

- **Play Billing obligatorio** para bienes digitales fuera de los programas alternativos.
  - Desde el 2026-08-31 se exige la librería de facturación 8 o posterior (prórroga posible hasta el 2026-11-01).
  - La versión actual es la 9.1.0.
  - https://developer.android.com/google/play/billing/deprecation-faq
- **EEE, facturación alternativa sin elección del usuario** (desde el 2026-06-30):
  - Comisión: 20 % en instalaciones nuevas, 25 % en existentes, 10 % sobre el primer millón de dólares.
  - Hay que estar registrado como empresa e informar de cada transacción en 24 h (API de transacciones externas).
  - La facturación con elección del usuario es una inscripción aparte.
  - https://support.google.com/googleplay/android-developer/answer/12348241
- **EEE, ofertas externas (enlace fuera de la app):**
  - Comisión: 20 % (10 % sobre el primer millón de dólares), sobre las transacciones de las 24 h siguientes al enlace.
  - No admite apps dirigidas solo a niños.
  - Hay que ofrecer reembolsos.
  - https://support.google.com/googleplay/android-developer/answer/14372887
- **EE. UU.:** desde el 2025-10-29 se permiten enlaces y otros métodos de pago. Las comisiones del programa empiezan a
  aplicarse el 2026-10-01 y dependen de un juicio abierto. **[en litigio]**
  https://support.google.com/googleplay/android-developer/answer/16470497
- **En el servidor:**
  - Comprobar cada compra con `purchases.productsv2.getproductpurchasev2`.
  - **Reconocerla (acknowledge) en menos de 3 días**; si no, Google la reembolsa sola.
  - Notificaciones en tiempo real por Pub/Sub: `ONE_TIME_PRODUCT_PURCHASED` y, desde julio de 2026, una notificación
    nueva cuando hay un reembolso pendiente de revisión.
  - API de compras anuladas (Voided Purchases).
  - Enlazar cada compra con el usuario mediante el id de cuenta ofuscado.
  - https://developer.android.com/google/play/billing/lifecycle/one-time
  - https://developer.android.com/google/play/billing/security
- **Pruebas:**
  - Probadores de licencia con tarjetas de prueba, incluidas tarjetas lentas que generan compras pendientes.
  - Probar también con una cuenta que no sea probadora.
  - https://developer.android.com/google/play/billing/test

## Stripe

- **Versión actual de la API:** `2026-09-30.endive`. La versión se fija en una variable de entorno, no en el código.
  https://docs.stripe.com/api/versioning
- **Checkout (pago único):**
  - Parámetros: `mode=payment`, `client_reference_id`, `metadata`, `payment_intent_data.metadata`,
    `automatic_tax[enabled]=true` y, con un cliente que ya existe, `customer_update[address]=auto`.
  - Las sesiones caducan a las 24 h.
  - https://docs.stripe.com/tax/checkout/page
- **Entrega de la compra:**
  - Se entrega con `checkout.session.completed` si `payment_status` no es `unpaid`, y con
    `checkout.session.async_payment_succeeded`.
  - También hay que atender `async_payment_failed` y `expired`.
  - Los eventos pueden llegar repetidos o a la vez, así que la entrega tiene que poder repetirse sin efectos dobles.
  - https://docs.stripe.com/checkout/fulfillment
- **Reembolsos y disputas:**
  - Reembolsos: `charge.refunded` (total o parcial), más `refund.created`, `refund.updated` y `refund.failed`.
  - Disputas: `charge.dispute.created`, `charge.dispute.closed` y `charge.dispute.funds_*`.
  - https://docs.stripe.com/refunds#refund-events
- **Firma de los webhooks:**
  - Cabecera `Stripe-Signature: t=…,v1=…`, con HMAC-SHA256 de `"{t}.{cuerpo sin tocar}"`.
  - Margen habitual: 5 minutos. No usar margen 0.
  - https://docs.stripe.com/webhooks#verify-manually
- **Stripe Tax:**
  - `txcd_10201000` corresponde a «Video Games – downloaded – non subscription – with permanent rights», y
    `txcd_10000000` a los servicios electrónicos en general. **Que lo elija el asesor fiscal.**
  - En la UE el IVA va según dónde vive el comprador, así que hay que pedirle al menos el país.
  - https://docs.stripe.com/tax/tax-codes
- **Managed Payments:** Stripe actúa como vendedor (merchant of record) y se encarga del IVA, el fraude y las disputas.
  Hay que valorarla.
  https://docs.stripe.com/payments/managed-payments/eligibility
- **Pagos con enlace desde la app móvil:** la guía de Stripe dice **solo EE. UU.** En la UE hay que seguir los
  programas de Apple y Google.
  https://docs.stripe.com/mobile/digital-goods
- **Stripe CLI:** `stripe listen --forward-to …` y `stripe trigger …`.
  https://docs.stripe.com/webhooks#test-webhook

## Supabase

- **Webhook:** poner `verify_jwt = false` en `config.toml` para la función del webhook y leer el cuerpo con
  `await req.text()` antes de verificar la firma.
  https://supabase.com/docs/guides/functions/function-configuration
- **Claves:**
  - La clave secreta (`sb_secret_…`) o la `service_role` se saltan el RLS: **solo en el servidor**.
  - Las claves antiguas `anon` y `service_role` dejarán de funcionar a finales de 2026; usar las claves «publishable» y
    «secret».
  - https://supabase.com/docs/guides/api/api-keys
- **Inicio de sesión con Apple:**
  - En la app nativa, `signInWithIdToken`.
  - En el flujo web (OAuth) hay que renovar el secreto cada 6 meses.
  - https://supabase.com/docs/guides/auth/social-login/auth-apple

## Derecho del consumidor en la UE **[sin revisar; requiere revisión legal]**

Para contenido digital hay 14 días de desistimiento. Ese derecho solo se pierde con el consentimiento expreso del
comprador y su reconocimiento de que lo pierde, antes de recibir el contenido. El checkout lo prepara con una casilla
explícita, desactivada por defecto (ver PURCHASE_TERMS en `COMMERCE.md`).
