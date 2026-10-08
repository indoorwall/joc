# Stripe: nuestro procesador principal (web/PWA)

> **TEST hasta que digas «ACTIVAR PRODUCCIÓN».**
>
> - Una clave `sk_live_` fuera de producción se rechaza.
> - En producción, el checkout exige `liveModeAllowed = true` (configuración remota que solo cambias tú).
> - Un evento con `livemode` distinto del entorno se rechaza.

## Flujo (Checkout Sessions, `mode=payment`)

1. El juego (con sesión) llama a `POST /functions/v1/checkout-session` con `{ sku, consentWithdrawal: true }`.
2. La Edge Function:
   1. Saca el usuario del JWT (nunca del cuerpo de la petición).
   2. Aplica el rate limit.
   3. Comprueba que el producto existe en el catálogo y está `active` (o `testing` fuera de producción).
   4. Toma el precio de la base de datos (`product_prices`), nunca del cliente.
   5. Comprueba que no lo tienes ya y que cumples los requisitos.
3. Reutiliza una orden `PENDING` con la sesión aún vigente o crea una orden `CREATED`.
4. Crea el Customer **una sola vez por usuario** (`commerce_accounts.stripe_customer_id`, Idempotency-Key
   `customer_<user>`).
5. Crea la Checkout Session:
   - `line_items[0].price` = el price id de Stripe del entorno, sacado de `product_provider_ids`. Fuera de producción,
     si no hay mapeo, usa `price_data` con el precio del servidor.
   - `client_reference_id = order_id`.
   - `metadata` y `payment_intent_data.metadata` = `user_id`, `product_id`, `order_id` y `catalog_version`.
   - `success_url` = `APP_URL/?compra=verificando&order=…&session_id={CHECKOUT_SESSION_ID}`.
   - `cancel_url` = `APP_URL/?compra=cancelada&order=…`.
   - `expires_at` a 30 minutos.
   - `Idempotency-Key: checkout_<order_id>`.
   - Con `stripeTaxEnabled`: `automatic_tax[enabled]=true`, `customer_update[address]=auto` y
     `billing_address_collection=required`.
6. La orden pasa a `PENDING` y se devuelve la `url`. El juego redirige a Stripe. La autenticación SCA/3DS la gestiona
   Stripe.
7. **La success_url no concede nada.** El juego enseña «Estamos verificando tu compra…» y consulta
   `GET /entitlements?order=…` periódicamente.
8. Stripe llama a `POST /functions/v1/stripe-webhook` y la función:
   1. Verifica la firma.
   2. Registra el evento.
   3. Pasa la orden a `PAID`.
   4. Crea las concesiones (`UNIQUE`).
   5. Pasa la orden a `FULFILLED`.
9. El juego ve el entitlement → «¡DESBLOQUEADO!».

Si el webhook tarda, el juego dice «Pago realizado. La compra puede tardar unos segundos en sincronizarse» y ofrece el
botón «Sincronizar compras». `restore` también consulta a Stripe las sesiones `PENDING` por si un webhook se perdió.

## Webhook

- **Endpoint:** `https://<proyecto>.supabase.co/functions/v1/stripe-webhook`, con `verify_jwt = false` en
  `config.toml`.
- **Verificación propia del esquema v1** (`commerce/core/stripeSignature.js`, con WebCrypto):
  - HMAC-SHA256 de `"{t}.{cuerpo sin tocar}"`, con varias `v1` permitidas para rotar el secreto.
  - Tolerancia de 300 s; 0 no se permite.
  - El cuerpo se lee con `await req.text()` **antes** de cualquier parseo.
- **Idempotencia:**
  - `provider_events (provider, event_id)` UNIQUE: un evento ya procesado devuelve 200 sin tocar nada.
  - `payments (provider, provider_payment_id)`, `entitlement_grants`, `refunds` y `disputes` también son UNIQUE.
- **Respuestas:**
  - 400: firma o modo inválido. Stripe no reintenta y no se concede nada.
  - 500: error transitorio. Se guarda el error en `provider_events.error`, se ve en el panel admin y Stripe reintenta.

| Evento | Qué hace |
|---|---|
| `checkout.session.completed` | Si `payment_status` es `paid` → PAID → entrega. Si es `unpaid` (pago asíncrono) → sigue PENDING. Comprueba importe (`amount_subtotal`), moneda y usuario |
| `checkout.session.async_payment_succeeded` | PAID → entrega |
| `checkout.session.async_payment_failed` | FAILED |
| `checkout.session.expired` | CANCELLED |
| `charge.refunded` | Total → REFUNDED y revoca. Parcial → PARTIALLY_REFUNDED (no revoca). Si la orden aún no existe → reembolso «huérfano» guardado por `payment_intent`; cuando llegue el pago, **no se entrega** |
| `charge.dispute.created` | DISPUTED y concesiones `suspended` |
| `charge.dispute.closed` | `won` → FULFILLED y se reactivan. `lost` → REVOKED y se revocan |
| `payment_intent.payment_failed` | Solo auditoría (el usuario puede reintentar dentro del Checkout) |

En el panel de Stripe hay que seleccionar exactamente esos eventos.

## Contabilidad

- `payments` guarda `gross_minor`, `tax_minor`, `provider_fee_minor` y `net_minor`. La comisión y el neto salen de
  `payment_intent.latest_charge.balance_transaction`.
- También guarda `currency` y `country` (país de facturación).
- Todo en unidades mínimas (céntimos).
- Informe por SKU, proveedor y país en el panel admin (`action: report`).

## Impuestos (Stripe Tax)

- Activa Stripe Tax en el panel, registra España (y el régimen OSS de la UE si vendes a otros países) y asigna a cada
  Product el **código fiscal** que te diga tu asesor (ver FUENTES_PLATAFORMAS: `txcd_10201000` o `txcd_10000000`).
- Después pon `stripeTaxEnabled: true` en `remote_config`.
- El IVA **no** está fijado en el código.
- Alternativa: **Stripe Managed Payments** (Stripe como vendedor). Está preparada para estudiarla, no implementada.

## Ids de Stripe ↔ SKU

El id lógico del juego (`pack_debut`) no depende de Stripe. Cuando crees el Product y el Price en Stripe:

```sql
insert into product_provider_ids (product_id, provider, environment, provider_product_id, provider_price_id)
values ('pack_debut', 'stripe', 'staging', 'prod_…', 'price_…');
```

Hay que hacerlo una vez por entorno: los ids de test y de live son distintos. En producción, sin mapeo, el checkout
falla (`stripe_price_not_mapped`) en vez de inventarse un precio.

## Pruebas locales con Stripe CLI

```bash
supabase start && supabase db reset          # migración + seed
supabase functions serve --env-file backend/.env --no-verify-jwt
stripe login
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook   # copia el whsec_… a backend/.env
# Compra de verdad en modo test: abre el juego web, compra el Pack Debut y paga con 4242 4242 4242 4242
stripe trigger checkout.session.completed      # evento genérico (sin nuestra metadata → el webhook lo ignora sin conceder)
stripe events resend evt_…                     # reenviar = probar duplicados (debe responder «duplicate»)
stripe refunds create --payment-intent pi_…    # reembolso → el entitlement desaparece
```

- **Pago fallido:** tarjeta `4000 0000 0000 0002`.
- **Pago con 3DS:** tarjeta `4000 0027 6000 3184`.
- **Pago asíncrono:** un método SEPA de prueba.
- **Eventos desordenados:** reenvía primero el `charge.refunded` y después el `checkout.session.completed` (o
  pruébalo con los tests automáticos, que ya lo cubren).
