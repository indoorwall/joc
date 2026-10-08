# Entitlements: el núcleo

Un **pago** concede uno o varios **entitlements**. El juego nunca pregunta «¿pagó?», pregunta «¿tiene el entitlement X?».

```js
P2.tieneEnt('cosmetic.debut_pack')   // en el juego (lo conecta la interfaz con el cliente de comercio)
COM.has('sport.climbing')            // en el cliente de comercio
```

## Modelo

**Concesión** (*grant*, tabla `entitlement_grants`): un hecho que no se borra.

```json
{
  "id": "uuid",
  "userId": "uuid",
  "entitlementId": "sport.climbing",
  "source": "stripe",                  // stripe | apple | google | promo | admin | legacy (y mock en el prototipo)
  "sourcePurchaseId": "pi_… / originalTransactionId / GPA.… / promo:… / admin:…",
  "orderId": "uuid | null",            // null en promo, admin y legacy
  "productId": "sport_climbing",
  "grantedAt": "2026-10-08T10:00:00Z",
  "status": "active",                  // active | suspended (disputa) | revoked
  "revokedAt": null, "revokeReason": null, "revokeRef": null
}
```

**Entitlement** (tabla `entitlements`, la mantiene un trigger): `active` si **alguna** concesión del usuario para ese
id está activa.

Garantías en la base de datos:

- `UNIQUE (order_id, entitlement_id)`: una orden no concede dos veces lo mismo.
- `UNIQUE (source, source_purchase_id, entitlement_id)`: un webhook repetido o un restore no duplican nada.
- Una concesión `revoked` no se puede reactivar (trigger `grants_guard`). El historial no se reescribe.
- El cliente **no puede** escribir en `entitlement_grants` ni en `entitlements` (RLS sin políticas de escritura y
  `REVOKE INSERT/UPDATE/DELETE`). Los tests lo comprueban contra un Postgres real.

## Bundles

- Un bundle concede todos sus entitlements.
- Si ya tenías uno, se registra **otra concesión** (otra fuente), pero el entitlement no se duplica.
- Si se reembolsa el bundle, solo se revocan **sus** concesiones: lo que tenías por otra vía sigue activo. Hay un test
  que lo comprueba.
- No se puede comprar un producto si ya tienes **todos** sus entitlements (`owned`). Si tienes una parte, sí, y la
  ficha avisa: «ya tienes una parte». El descuento de «completa el bundle» está preparado para el futuro: el estado
  `partiallyOwned` y `missing` ya existen.

## Ciclo de vida

| Evento | Concesiones | Entitlement |
|---|---|---|
| Pago confirmado (webhook de Stripe, transacción verificada de Apple, compra verificada de Google) | `active` | activo |
| Reembolso total | `revoked` (fecha, motivo, referencia) | inactivo, salvo que otra concesión lo mantenga |
| Reembolso parcial | siguen `active` (política `refunds.partialRevokes`) | activo |
| Disputa abierta | `suspended` (política `disputes.suspend`) | inactivo |
| Disputa ganada | `active` | activo |
| Disputa perdida | `revoked` | inactivo |
| Admin revoca (con motivo) | `revoked` | inactivo |

Si el jugador pierde un cosmético, lo que llevaba puesto de ese pack vuelve a lo básico al sincronizar
(`limpiarLook`).

## Qué abre cada tipo (y qué no)

| Tipo | Abre | Nunca |
|---|---|---|
| `cosmetic.*` | Ropa, botas, gorra, fondo, insignia y objetos de vitrina (`req: { premium }` en `11_avatar.js`) | Nivel, reputación, marca, dinero, partidos |
| `ads.remove_interstitial` | Quita los anuncios **obligatorios** | No quita los voluntarios con recompensa (siguen disponibles) |
| `slots.extra_3` | +3 ranuras de carrera | — |
| `sport.*` | Poder **jugar** ese deporte cuando su módulo esté listo (`canPlaySport`) | Victorias ni ranking |
| `expansion.*` | Sistemas nuevos (club, inmobiliaria, agencia…) | Empresas ya hechas ni dinero |
| `prestige.*` | Poder **jugar la campaña** del cargo | El cargo: hay que ganarlo (ver PRESTIGE_CAREERS.md) |

Test de juego: una partida de 60 semanas con **todo** comprado es idéntica, salvo lo cosmético, a la misma partida
sin comprar nada (`tests/p2.test.cjs`, «Comercio: …»).

## Caché en el dispositivo

- Clave `dban_commerce_v1` de localStorage, **separada de la partida**. Guarda la cuenta, los entitlements y la
  fecha de la última sincronización.
- Sin conexión se juega con la caché y no se puede comprar. Al volver la conexión se revalida al arrancar.
- Borrar la partida no borra las compras. Borrar la caché tampoco: «Restaurar compras» las recupera de la cuenta.
- En el prototipo, el «servidor» simulado guarda sus datos en otra clave (`dban_mock_server_v1`).

## Migración desde el prototipo P2.4

- `IAP_PRODUCTS` (debut, street, pro, luxury, founder, sinAnuncios, espacios) pasan a los SKUs `pack_debut`,
  `pack_street`, `pack_pro`, `pack_luxury`, `founder_pack`, `remove_ads` y `extra_save_slots_3` (`OLD_IAP` en
  `20_ui.js`).
- Las «pruebas de intención» (`iapIntencion`) **no concedían nada**, así que no se migra ninguna compra. La fuente
  `legacy` queda reservada por si alguna vez hiciera falta.
- Los cosméticos con `req: { premium: 'debut' }` ahora se desbloquean con `cosmetic.debut_pack` (`PREMIUM_ENT` en
  `11_avatar.js`).
- `m.sinAnuncios` (flag antiguo de la partida) se sustituye por `ads.remove_interstitial` en la cuenta.

## Conflicto pendiente de tu decisión: vidas por anuncio

En el prototipo pediste «vidas que se recuperen con anuncios» para repetir minijuegos, y esos minijuegos deciden
ascensos, descensos y finales. La regla 95 de este encargo dice que un anuncio con recompensa **no puede** cambiar un
resultado ni evitar un descenso.

Qué he hecho:

- En la arquitectura de anuncios, la vida extra es un placement **experimental** (`minigame_life`), **apagado por
  defecto** (`rewarded.minigameLife = false`) y fuera de los placements de producción.
- El prototipo publicado lo mantiene **encendido** para que lo sigas probando.
- Las vidas que se recargan con el tiempo no cambian.

Antes de producción tienes que decidir si lo dejas apagado (recomendado por la regla 95) o lo permites solo en
momentos que no decidan categoría ni títulos.
