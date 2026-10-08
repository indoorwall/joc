# Seguridad del comercio

Principio: el cliente **nunca** es fuente de verdad. El usuario sale de la sesión, el producto del catálogo, el precio
del servidor o de la tienda, y la confirmación del pago del proveedor (webhook firmado o verificación en el servidor).

## Amenazas, defensas y tests

| Ataque | Defensa | Test |
|---|---|---|
| Cambiar el precio desde DevTools (`price`, `amountMinor` en el cuerpo) | Se ignora. El precio sale de `product_prices` / `product_provider_ids` | contrato «precio manipulado»; e2e «ignora precio y userId» |
| Cambiar el id del producto | Solo existen los SKUs del catálogo; `draft`, `coming_soon`, `promo_only` y `retired` no se venden | «producto inexistente», «coming_soon», «draft», «solo-promo» |
| Cambiar el user id (cuerpo o metadata) | El usuario sale del JWT; un webhook con `user_id` distinto al de la orden se rechaza | «user_id cambiado», e2e |
| Crearse un entitlement a mano | RLS: sin políticas de escritura y `REVOKE INSERT/UPDATE/DELETE` para `anon` y `authenticated` | [RLS] «no puede crearse un entitlement / escribir en entitlements / marcar PAID / crear órdenes, pagos ni reembolsos / hacerse admin ni tester» |
| Reutilizar un checkout | `provider_checkout_id` UNIQUE; una orden FULFILLED no se reabre; una nueva compra de lo que ya tienes → `owned` | «no se cobra dos veces», e2e 409 |
| Abrir la success_url sin pagar | La success_url **no concede**: solo hace polling del estado de la orden | contrato y e2e en navegador «volver de Stripe NO concede nada» |
| Webhook falso, manipulado o antiguo | HMAC-SHA256 v1, cuerpo sin tocar, tolerancia de 300 s; sin firma → 400 | «firma inválida», «sin cabecera», «antiguo», «cuerpo manipulado»; e2e 400 |
| Webhook repetido | `provider_events` UNIQUE, más UNIQUE en pagos y concesiones | «duplicado», «mismo pago con otro id de evento» |
| Eventos desordenados | Reembolso huérfano por `payment_intent`; `completed` después de un REFUNDED no entrega | «reembolso antes que el pago», «async antes que completed» |
| Importe distinto | Se compara `amount_subtotal` y la moneda con la orden | «importe distinto → no se entrega» |
| Mezclar test y live | `livemode` del evento contra el entorno; una clave `sk_live_` fuera de producción se rechaza; `liveModeAllowed` solo en producción | «evento live en test», «pagos reales bloqueados hasta ACTIVAR PRODUCCIÓN» |
| Ver órdenes ajenas | RLS y `orderStatus` comprueba el dueño | [RLS] y «ver una orden ajena» |
| Fuerza bruta de códigos promo | Rate limit (5/h) y un canje por usuario | «rate limit en códigos promo» |
| Abuso de checkout, restore o sync | Rate limits configurables (`rateLimits`) en la tabla `rate_limits` | idem |
| Admin falso | `admin_users` comprobado en el servidor; motivo obligatorio; auditoría en `admin_actions` | «un usuario normal no puede usar el admin», e2e 403 |
| Secretos en el cliente | El juego solo lleva la URL y la clave publishable; el build web rechaza claves secretas; test de patrones `sk_`, `whsec_`, `sb_secret_` | «sin secretos en el juego», «.env.example sin secretos» |
| Datos de tarjeta | Nunca pasan por nosotros (Stripe Checkout alojado); la telemetría descarta tarjeta, email y similares | «telemetría sin tarjeta ni email», «Mis compras sin tarjeta» |
| Apple/Google falsificados | JWS verificado con la librería oficial de Apple; `purchaseToken` consultado a Google; `appAccountToken` y `obfuscatedAccountId` deben coincidir | «JWS inválido», «transacción de otra cuenta» |

## Secretos y entornos

- **Solo en el servidor** (`supabase secrets set`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `APPLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON` y
  `GOOGLE_PUBSUB_SHARED_TOKEN`.
- **Tres proyectos de Supabase:** DEV, STAGING y PRODUCTION. Cada uno con su `APP_ENV` y sus claves de Stripe: test en
  DEV y STAGING, live solo en PRODUCTION y solo después de «ACTIVAR PRODUCCIÓN».
- `.env` está en `.gitignore`; `backend/.env.example` solo lleva marcadores.

## Privacidad, menores y textos legales

> **Requiere revisión legal.** Los textos de abajo son una arquitectura de mínimos, no asesoría legal.

- **Datos personales mínimos:**
  - `profiles`: nombre visible, país y las marcas `is_minor` y `is_tester`.
  - Telemetría con lista blanca de eventos y propiedades, sin PII.
- **Borrar la cuenta:**
  - Se borran el perfil, los dispositivos, las partidas en la nube y la telemetría.
  - Las órdenes, los pagos y las concesiones se **anonimizan**: `user_id` pasa a NULL y queda `user_ref_hash`, porque
    la contabilidad se conserva por obligación legal.
  - Después se borra el usuario de Auth (función `account-delete`).
- **Menores:**
  - Nada de ofertas agresivas: no hay cuentas atrás, ni urgencia, ni preselección, y «No, gracias» es igual de grande
    que «Comprar».
  - El router no ofrece pagos fuera de la tienda a menores.
  - `is_minor` queda preparado para los requisitos parentales de cada región, como el control parental de Apple entre
    13 y 17 años.
- **Desistimiento de 14 días (UE):** hay una casilla explícita, desmarcada por defecto, antes de pagar contenido
  digital que se entrega al momento. Se guarda en `orders.withdrawal_consent_at`.
- **Documentos preparados** (borradores, en `docs/commerce/legal/`):
  - Política de privacidad
  - Términos de uso
  - Condiciones de compra
  - Política de reembolsos
  - Consentimiento de anuncios

  Todos marcados **«requiere revisión legal»**.
- **Licencias:** no se usan FIFA, FIBA, IFSC, COI ni sus logos. Los nombres son ficticios y configurables en el
  catálogo, y hay un test que lo comprueba.
