# Checklist para ti: de simulado a Stripe TEST (y, cuando lo digas, a producción)

> Todo esto lo haces tú con tus cuentas. Yo no he creado nada en Stripe, Supabase, Apple ni Google.
> Orden recomendado: **Supabase → Stripe (test) → pruebas → (app nativa) Apple / Google → revisión legal → «ACTIVAR PRODUCCIÓN»**.

---

## 1. Supabase (backend)

Crea **un proyecto por entorno**. Empieza por `dban-staging`; más adelante, `dban-production`.

1. [ ] supabase.com → New project → región UE (por ejemplo Frankfurt). Guarda la contraseña de la base de datos en
   tu gestor de contraseñas.
2. [ ] Instala la CLI de Supabase y, en la carpeta `backend/`:
   ```bash
   supabase login
   supabase link --project-ref <REF_DEL_PROYECTO>   # Settings → General → Reference ID
   supabase db push                                 # aplica migrations/20261008000000_commerce.sql
   psql "<cadena de conexión>" -f supabase/seed.sql # catálogo, precios, configuración remota
   ```
3. [ ] **Auth → Providers:**
   - **Email:** activado, con «Confirm email» y enlace mágico. Sin contraseñas propias.
   - **Google:** activado. Necesitas un OAuth Client ID y su Secret de Google Cloud (Credentials → OAuth client ID →
     Web). La redirect URI la muestra Supabase.
   - **Apple:** activado. Necesitas un Services ID, un Key ID, la clave `.p8` y el Team ID (ver la sección 3).
     Recuerda que el secreto de Apple en el flujo web caduca cada 6 meses.
4. [ ] **Auth → URL Configuration:** Site URL = la URL de tu juego web (por ejemplo `https://juego.tudominio.com`) y
   añádela también en «Redirect URLs».
5. [ ] **Secretos de las Edge Functions:** copia `backend/.env.example` a `backend/.env`, rellénalo y ejecuta:
   ```bash
   supabase secrets set --env-file backend/.env
   ```
   - `APP_ENV=staging`
   - `APP_URL=https://juego.tudominio.com`
   - `STRIPE_SECRET_KEY=sk_test_…` y `STRIPE_WEBHOOK_SECRET=whsec_…` (sección 2)
   - `STRIPE_API_VERSION=2026-09-30.endive` (o la versión que tenga fijada tu cuenta de Stripe)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_DB_URL` las pone Supabase
     automáticamente en las funciones desplegadas. Comprueba en Settings → API qué claves tienes (publishable y
     secret).
6. [ ] **Despliega las funciones:**
   ```bash
   node commerce/tools/sync-backend.mjs     # copia el núcleo a supabase/functions/_shared
   supabase functions deploy                # respeta config.toml (stripe-webhook sin JWT)
   ```
7. [ ] **Hazte admin.** Entra una vez en el juego (o en el panel admin) para que exista tu usuario y ejecuta en el SQL
   editor:
   ```sql
   insert into admin_users (user_id) select id from auth.users where email = 'TU_EMAIL';
   update profiles set is_tester = true where user_id = (select id from auth.users where email = 'TU_EMAIL');
   ```
   El perfil se crea solo al registrarte (trigger `on_auth_user_created`).
8. [ ] **Panel admin:** abre `backend/admin/index.html` en local o súbelo a un sitio privado. Pon la URL del proyecto y
   la clave **publishable**, y entra con el enlace mágico.

## 2. Stripe (modo TEST)

1. [ ] dashboard.stripe.com → crea la cuenta. **Activa el modo de prueba** (Test mode) y quédate en él.
2. [ ] Developers → API keys: copia la **Secret key `sk_test_…`** a `STRIPE_SECRET_KEY` (nunca al juego). La
   Publishable key `pk_test_…` no hace falta con Checkout alojado.
3. [ ] **Products:** crea el Product «Pack Debut» con un Price de **0,99 EUR, One-off**. Copia el `prod_…` y el
   `price_…` y regístralos:
   ```sql
   insert into product_provider_ids (product_id, provider, environment, provider_product_id, provider_price_id)
   values ('pack_debut', 'stripe', 'staging', 'prod_XXXX', 'price_XXXX');
   ```
   Repite para `remove_ads` (3,99 €). Para `sport_climbing` (2,99 €) y `prestige_world_football_president` (0,99 €)
   solo si quieres probar esos entitlements de prueba.
4. [ ] **Webhook:** Developers → Webhooks → Add endpoint.
   - URL: `https://<REF>.supabase.co/functions/v1/stripe-webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`,
     `charge.dispute.created`, `charge.dispute.closed`, `payment_intent.payment_failed`.
   - Copia el **Signing secret `whsec_…`** a `STRIPE_WEBHOOK_SECRET` y vuelve a ejecutar `supabase secrets set`.
5. [ ] **Impuestos:**
   - Settings → Tax → activa Stripe Tax y añade tu registro de IVA en España (y el OSS de la UE si vendes a otros
     países de la UE).
   - Asigna el **código fiscal** que te indique tu asesor a cada Product (ver FUENTES_PLATAFORMAS).
   - Después:
     ```sql
     update remote_config set value = jsonb_set(value, '{stripeTaxEnabled}', 'true') where environment = 'staging';
     ```
6. [ ] **Branding del Checkout** (Settings → Branding): logo, colores y nombre que verá el comprador. Pon también el
   email de soporte.
7. [ ] (Opcional) Valora **Stripe Managed Payments** (Stripe como vendedor de registro: IVA y disputas).

## 3. Apple Developer y App Store Connect (cuando haya app iOS)

1. [ ] Apple Developer Program (99 $/año) a nombre de la empresa (necesitarás un número D-U-N-S).
2. [ ] Certificates, Identifiers & Profiles:
   - App ID `com.delbarrio.app` con la capacidad **In-App Purchase** y **Sign in with Apple**.
   - Services ID para iniciar sesión con Apple en la web (dominio y return URL de Supabase).
   - Key con «Sign in with Apple» (`.p8`): va al panel de Supabase Auth.
3. [ ] App Store Connect → My Apps → nueva app con ese Bundle ID. Copia el **Apple ID numérico** a `APPLE_APP_ID`.
4. [ ] **Agreements, Tax and Banking:** firma el «Paid Applications Agreement» y completa los datos bancarios y
   fiscales. Sin esto no se pueden vender compras dentro de la app.
5. [ ] **In-App Purchases:** crea productos **Non-Consumable** con id `com.delbarrio.<sku>` (por ejemplo
   `com.delbarrio.pack_debut`). Elige un tramo de precio cercano al precio en euros y añade localización y captura de
   revisión.
6. [ ] **Users and Access → Integrations → In-App Purchase:** genera una clave de la App Store Server API. Copia Issuer
   ID, Key ID y el `.p8` a `APPLE_ISSUER_ID`, `APPLE_KEY_ID` y `APPLE_PRIVATE_KEY`.
7. [ ] **App Store Server Notifications V2** (App Information): pon `https://<REF>.supabase.co/functions/v1/apple-notifications`
   en Production y en Sandbox.
8. [ ] Certificados raíz de Apple (apple.com/certificateauthority): en DER y base64, en `APPLE_ROOT_CERTS_B64`.
   `APPLE_ENV=Sandbox` hasta salir a la tienda.
9. [ ] **Sandbox Testers** (Users and Access → Sandbox) y **TestFlight** para probar. Activa `appleBillingEnabled`
   solo en staging.
10. [ ] **UE con Stripe:** **no lo actives** sin antes:
    - aceptar el anexo 14 (términos de la UE);
    - pedir el permiso `custom-purchase-link`;
    - implementar el aviso del sistema y el envío de tokens;
    - aceptar el compromiso de 12 meses;
    - pasar revisión legal.

    Mientras tanto, StoreKit.

## 4. Google Play (cuando haya app Android)

1. [ ] Cuenta de Google Play Console (registro único de 25 $) como organización.
2. [ ] Crea la app con el paquete `com.delbarrio.app` y completa el **perfil de pagos** (Monetización).
3. [ ] **Productos integrados (únicos):** id = SKU (`pack_debut`, `remove_ads`…), con precio y en estado Activo.
4. [ ] Google Cloud → crea un proyecto → activa la «Google Play Android Developer API» → crea una **cuenta de
   servicio** y una clave JSON. Play Console → Usuarios y permisos → invita al email de la cuenta de servicio con los
   permisos de ver datos financieros y gestionar pedidos. Copia el JSON a `GOOGLE_SERVICE_ACCOUNT_JSON` y el paquete a
   `GOOGLE_PACKAGE_NAME`.
5. [ ] **Notificaciones en tiempo real:**
   - Pub/Sub → crea un tema y concede permiso de publicación a `google-play-developer-notifications@system.gserviceaccount.com`.
   - Crea una suscripción **push** a `https://<REF>.supabase.co/functions/v1/google-rtdn?token=<un secreto largo>`.
     Ese secreto va en `GOOGLE_PUBSUB_SHARED_TOKEN`.
   - En Play Console → Monetización → Configuración de monetización, indica el tema.
   - Antes de producción, cambia a autenticación **OIDC**.
6. [ ] **Pruebas de licencia:** añade tus cuentas de prueba (Configuración → Pruebas de licencia) y sube una versión a
   prueba interna. Activa `googleBillingEnabled` solo en staging.
7. [ ] **EEE con Stripe:** no lo actives sin inscribirte en el programa (facturación alternativa, elección del usuario
   u ofertas externas), sin el informe de transacciones en 24 h y sin revisión legal. Mientras tanto, Play Billing.

## 5. Juego web (build real)

1. [ ] Genera el build:
   ```bash
   SUPABASE_URL=https://<REF>.supabase.co SUPABASE_PUBLISHABLE_KEY=sb_publishable_… APP_ENV=staging node p2/build-web.cjs
   ```
   Crea `dist/web/index.html`, que solo lleva datos públicos (el build rechaza claves secretas).
2. [ ] Súbelo a tu hosting (por ejemplo Netlify, Vercel o Cloudflare Pages) en la URL que pusiste en `APP_URL`, con
   HTTPS.
3. [ ] Las redirecciones de Stripe vuelven a `APP_URL/?compra=verificando&order=…` y el juego hace el resto.

## 6. Pruebas antes de producción (en staging, Stripe TEST)

- [ ] Juega sin cuenta: nada se bloquea.
- [ ] Compra el Pack Debut:
  1. aparece la petición de cuenta;
  2. inicias sesión;
  3. la casilla de desistimiento está desmarcada;
  4. pagas en Stripe con 4242 4242 4242 4242;
  5. ves «Estamos verificando tu compra»;
  6. aparece «¡DESBLOQUEADO!» y el pack puesto.
- [ ] Recarga la página: sigue comprado.
- [ ] Abre el juego en otro navegador o dispositivo e inicia sesión con la misma cuenta: el pack aparece al
  sincronizar o restaurar.
- [ ] Borra los datos del sitio en el navegador → «Restaurar compras»: vuelve sin pagar.
- [ ] Tarjeta rechazada (4000 0000 0000 0002): no se concede nada.
- [ ] Tarjeta con 3DS (4000 0027 6000 3184): se completa tras la autenticación.
- [ ] Cancela en Stripe: el juego dice «Compra cancelada. No se ha cobrado nada».
- [ ] Reembolso desde el panel de Stripe: el pack desaparece al sincronizar y el estado pasa a «Reembolsada».
- [ ] Disputa de prueba (tarjeta 4000 0000 0000 0259): pack suspendido y luego reactivado o revocado según el
  resultado.
- [ ] Reenvía un webhook (Developers → Events → Resend): «duplicate», sin conceder dos veces.
- [ ] Intenta abrir la `success_url` a mano con un `order` inventado: no se concede nada.
- [ ] Panel admin: busca tu usuario, concede y revoca `sport.climbing` con motivo, mira los errores de webhook y el
  informe.
- [ ] Código promo:
  ```sql
  insert into promo_codes (code, sku, max_redemptions) values ('PRENSA2026', 'promo_press', 50);
  ```
  Canjéalo y comprueba que aparece la insignia de prensa.
- [ ] Borra tu cuenta de prueba: en la base de datos, `orders.user_id` es NULL y `user_ref_hash` tiene valor.
- [ ] Revisión legal de `docs/commerce/legal/*` y de la casilla de desistimiento.
- [ ] Decide qué hacer con la vida extra por anuncio en minijuegos (ver ENTITLEMENTS.md).

## 7. «ACTIVAR PRODUCCIÓN» (solo cuando lo digas)

1. [ ] Proyecto de Supabase de **producción** (repite la sección 1 con `APP_ENV=production`).
2. [ ] Stripe en **modo live**:
   - completa la activación de la cuenta (datos de empresa, banco e identidad);
   - crea los Products y Prices **live**;
   - crea el webhook live;
   - pon `sk_live_` y el `whsec_` live **solo** en los secretos de producción.
3. [ ] Inserta los `product_provider_ids` con `environment = 'production'`.
4. [ ] Por último:
   ```sql
   update remote_config set value = jsonb_set(value, '{liveModeAllowed}', 'true') where environment = 'production';
   ```
   Sin esto, el checkout se niega a cobrar.
5. [ ] Haz una compra real tuya de 0,99 € y reembólsala. Comprueba la contabilidad (bruto, IVA, comisión y neto) en el
   panel admin.
