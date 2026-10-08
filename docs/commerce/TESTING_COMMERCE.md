# Pruebas del comercio

## Cómo ejecutarlas

```bash
npm install                                   # instala pg (solo para los tests contra Postgres)
node tests/commerce/commerce.test.mjs         # núcleo + cliente + contrato en memoria (sin dependencias)

# Contrato completo contra PostgreSQL REAL + RLS (aplica shim de Supabase + migración + seed en una base vacía):
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/dban_test node tests/commerce/commerce.test.mjs

# …y además las Edge Functions REALES en Deno sobre HTTP + el build web en un navegador:
DENO_BIN=$(which deno) DATABASE_URL=… node tests/commerce/commerce.test.mjs

node tests/p2.test.cjs                        # juego + interfaz Premium (Chromium) + «sin pagar para ganar»
```

Resultado de esta entrega (8 de octubre de 2026):

- **`commerce.test.mjs` completo (con Postgres 16 y Deno 2.5): 266 de 266.** Desglose:
  - unitarias;
  - cliente;
  - contrato en memoria;
  - contrato en Postgres;
  - RLS;
  - e2e HTTP;
  - e2e en navegador.
- **`p2.test.cjs`: 342 de 342.**

## Qué cubren

| Área | Dónde | Casos |
|---|---|---|
| Stripe (punto 109) | `contract.mjs` (memoria y Postgres), `edge.e2e.mjs` | checkout válido, producto inexistente, precio manipulado, usuario incorrecto, webhook válido, firma inválida, duplicado, eventos desordenados, pago fallido o asíncrono, expirado, reembolso total y parcial, disputa abierta, ganada y perdida, entitlement duplicado, bundle, restaurar (también con webhook perdido) |
| Seguridad (punto 110) | `contract.mjs`, `pg.mjs`, `edge.e2e.mjs`, `p2.test.cjs` | cambiar precio, cambiar producto, crear entitlement a mano (RLS), reutilizar checkout, success_url sin pagar, webhook falso, cambiar user id, mezcla test/live, secretos en el cliente |
| Juego (punto 111) | `p2.test.cjs` «Comercio: …», `unit.mjs` | un pack no sube nivel, reputación ni marca, no mejora partidos ni da dinero (60 semanas idénticas con todo comprado); Prestige no concede el cargo; una expansión sin motor no concede nada; quitar anuncios no afecta al juego |
| Base de datos | `pg.mjs` | migración desde cero, seed al día, RLS (lectura propia, sin escritura de cliente, anónimo), UNIQUE, precios enteros, concesión revocada inmutable, trigger de entitlements, máquina de estados |
| Router | `unit.mjs` | dev → Mock; web → Stripe; iOS → Apple salvo programa de la UE aprobado, tienda incluida, dispositivo elegible y no menor; Android → Google salvo programa inscrito; flags apagados |
| Interfaz | `p2.test.cjs` «UI Premium» | ficha completa, casilla sin preselección, «No, gracias» igual de visible, sin urgencia falsa, petición de cuenta, checkout de prueba, «verificando», ¡DESBLOQUEADO!, Mis compras, restaurar con caché borrada, dependencias, próximamente, insignia, quitar anuncios |

## Pruebas manuales antes de producción

Sigue la sección «Pruebas antes de producción» de [CHECKLIST.md](CHECKLIST.md). En resumen:

- **Stripe en modo test:**
  - compra real con la tarjeta 4242;
  - pago rechazado (4000 0000 0000 0002);
  - 3DS (4000 0027 6000 3184);
  - reembolso desde el panel;
  - disputa de prueba;
  - webhook reenviado.
- **Restaurar:** en otro navegador y en otro dispositivo.
- **Borrar la cuenta:** después, comprobar en la base de datos la anonimización.
- **Apple y Google** (cuando haya app): StoreKit Testing, Sandbox, TestFlight, probadores de licencia, compra
  pendiente, cancelación y reembolso.

## Errores conocidos y límites

- **Apple y Google** están preparados y probados con verificadores simulados, pero **no contra las tiendas reales**:
  no hay app nativa todavía.
- **Google `purchases.productsv2`:** hay que confirmar los nombres de campo contra la referencia vigente antes de
  activarlo.
- **Pub/Sub de Google:** usa un token compartido en la URL. Antes de producción hay que pasar a OIDC.
- **Stripe real:** el código usa la API REST real, pero en esta entrega solo se ha probado contra un Stripe falso con
  la misma forma de la API. Falta la prueba con tu cuenta en modo test (CHECKLIST).
- **Packs Street, Pro, Luxury, Magnate y Founder, ranuras de carrera, deportes, expansiones y la interfaz de las
  Prestige:** arquitectura y fichas `coming_soon`, sin contenido o motor jugable todavía.
- **Vida extra por anuncio en minijuegos:** encendida en el prototipo y apagada por defecto en producción (ver la nota
  en ENTITLEMENTS.md).
