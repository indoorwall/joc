# Deportes y expansiones

> Todo está **jugable** y a la venta en modo prueba (`active`, sin pagos reales hasta «ACTIVAR PRODUCCIÓN»).
> El código del juego está en `p2/src/00_deportes.js`, `00_negocios_deporte.js`, `19_expansiones.js` y
> `21_ui_expansiones.js`. Ninguna compra da nivel, reputación, marca, dinero ni resultados: abre contenido que hay
> que jugar. Un test juega 60 semanas con y sin «todo comprado» y la partida es idéntica.

## Deportes (`commerce/core/sports.js` + `p2/src/00_deportes.js`)

| Deporte | Entitlement | Formato | Lo propio |
|---|---|---|---|
| ⚽ Fútbol | — (gratis) | goles | El juego base |
| 🧗 Escalada | `sport.climbing` | circuito (todos compiten; 10-8-6-5-4-3-2-1 puntos) | Bloque, dificultad y velocidad por prueba; especialidad; proyectos en roca 6a–9a; premios |
| 🎾 Tenis | `sport.tennis` | sets (al mejor de 3) | Superficies (tierra, dura, hierba); viajes con coste; fatiga extra; premios |
| 🏀 Basket | `sport.basketball` | puntos (sin empates) | Minutos y línea estadística; tiro |
| 🛹 Skate | `sport.skate` | circuito | Street y park; vídeos que suben el estilo; calle |
| 🏄 Surf | `sport.surf` | circuito | Olas pequeñas, buenas o grandes (según la tabla); viajes de surf; premios |

- Al empezar una carrera eliges deporte (y especialidad). Los que no tienes salen con candado y su precio.
- Cada deporte cambia ligas, rivales, ofertas, acciones, competiciones, momentos clave, minijuegos y material.
  También cambia el vocabulario: la escalada no habla de goles ni de partidos.
- `canPlaySport(id, entitlements)` devuelve `ok`, `locked` o `coming_soon`. Este último sale si el módulo no tiene
  motor; ahora los 5 lo tienen.
- **Negocios del deporte:** cada uno tiene los suyos (escalada: clases, routesetting, tienda, rocódromo, eventos y
  cadena; tenis: clases, academia, pistas, club, torneos y alto rendimiento; etc.). Los grandes piden haber montado
  antes el pequeño. Una segunda empresa exige que la primera sea rentable, y el máximo son 6.

## Expansiones de sistema

Se abren con la expansión **y** con tu primera empresa (hito `empresa`). Sin la expansión, la sección enseña qué
trae y un botón para verla. Si se pierde el acceso (reembolso), lo construido se congela: no se borra ni sigue
generando.

| SKU | Entitlement | Qué se juega |
|---|---|---|
| `expansion_club_owner` (3,99 €) | `expansion.club_owner` | Comprar participaciones (y el control con el 51 %), precio de las entradas, inversión en plantilla y cantera, ampliar el estadio, buscar patrocinador, aportar o retirar dinero. Cada semana: taquilla, TV, sponsor, gastos y resultados; al final de temporada, ascensos y valor del club |
| `expansion_real_estate` (2,99 €) | `expansion.real_estate` | Locales, pisos, parkings, edificios y terrenos; hipoteca (el banco no da más del 40 % de tus ingresos), reformas, obra nueva con licencia, alquiler alto o normal, venta. El mercado y el euríbor se mueven cada semana |
| `expansion_sports_agency` (2,99 €) | `expansion.sports_agency` | Ojear, firmar promesas, contratar ojeadores, comisiones semanales y ofertas por tus representados (decisión) |
| `expansion_events` (2,99 €) | `expansion.events` | Tipo de evento, sede, precio, estrella invitada, retransmisión; demanda, riesgo y cancelación |
| `expansion_media` (2,99 €) | `expansion.media` | Fundar el medio, abrir canales, presentador y tono, comprar derechos, documentales; audiencia, publicidad y patrocinio |
| `empire_bundle` (6,99 €) | las 4 primeras | Exactamente esas 4 |
| `sports_bundle` (8,99 €) | los 5 deportes | Exactamente esos 5 (no duplica los que ya tengas) |

El azar de las expansiones y del Prestige va en un generador aparte (`rngX`), así que tener o usar una expansión
nunca cambia un partido ni una prueba.

## No bombardear

- La tienda Premium filtra por fase e hitos.
- Muestra como mucho 3 destacados y nunca algo que ya tienes.
- Esconde lo que no aplica: los packs de campeón solo aparecen si ganaste esa competición, y los de club solo con tu
  club.
- `remote_config.visibleSkus` y `hiddenSkus` permiten recortar la tienda sin publicar una versión nueva.
