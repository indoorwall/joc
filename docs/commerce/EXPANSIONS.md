# Deportes y expansiones: arquitectura (sin todo el contenido todavía)

> Aquí se implementa la **arquitectura** para todas las expansiones, no el gameplay de 5 deportes y 5 expansiones.
> Un producto solo se vende cuando su estado es `active`. Ahora mismo, Escalada está en `testing`: el entitlement de
> prueba existe, pero su juego aún no.

## Deportes (`commerce/core/sports.js`)

```js
SPORTS = [
  { id: 'football', entitlement: null, status: 'active' },              // juego base, gratis
  { id: 'climbing', entitlement: 'sport.climbing', status: 'testing' },
  { id: 'tennis', … 'coming_soon' }, { id: 'basketball', … }, { id: 'skate', … }, { id: 'surf', … },
]
SPORT_MODULE_INTERFACE = ['careerEngine', 'competitionEngine', 'rankingEngine', 'economyHooks', 'events', 'businesses', 'sponsors', 'items', 'prestigeCareers']
```

- **`registerSportModule(mod)`** rechaza un módulo que no tenga toda la interfaz.
- **`canPlaySport(id, entitlements)`** devuelve:
  - `ok` para el fútbol;
  - `locked` si falta el entitlement;
  - `coming_soon` si lo tienes pero el módulo aún no tiene `careerEngine`. Así nunca se cobra algo que rompe la
    partida: la ficha lo dice antes.
- **Escalada** ya registra sus datos:
  - escalera: rocódromo local → autonómico → nacional → internacional → profesional;
  - modalidades: bloque, dificultad y velocidad;
  - ingresos: premios, sponsors, clases, campus y routesetting;
  - negocios: clases, routesetting, tienda, rocódromo, eventos y cadena;
  - sponsors, objetos y su Prestige (Presidente Mundial de Escalada).
- **El motor jugable** puede portarse del motor de escalada de P1 (`p1/`), que ya existe. Esa es la fase F6.

**Cómo añadir un deporte:**

1. Crea su módulo, con la interfaz completa, en `commerce/core/sports.js` o en un archivo propio.
2. Implementa `careerEngine` (por semanas, como `jugarSemana`) y `competitionEngine`.
3. Cambia el estado del producto en el catálogo a `testing`, pruébalo con testers y después pásalo a `active`.
4. **Nunca cambies los nombres del fútbol** ni reutilices un SKU.

## Expansiones de sistema

| SKU | Entitlement | Contenido previsto |
|---|---|---|
| `expansion_club_owner` (3,99 €) | `expansion.club_owner` | Participaciones, compra del club, presidencia, director deportivo, entrenador, plantilla, cantera, instalaciones, estadio, sponsors, finanzas |
| `expansion_real_estate` (2,99 €) | `expansion.real_estate` | Locales, pisos, parkings, edificios, terrenos, reformas, alquiler, financiación, revalorización |
| `expansion_sports_agency` (2,99 €) | `expansion.sports_agency` | Captación, representados, contratos, sponsors, comisiones, scouting, conflictos, crecimiento |
| `expansion_events` (2,99 €) | `expansion.events` | Sedes, entradas, sponsors, deportistas, producción, premios, retransmisión, riesgo |
| `expansion_media` (2,99 €) | `expansion.media` | Canal, streaming, productora, programas, derechos, audiencia, publicidad |
| `empire_bundle` (6,99 €) | las 4 primeras | Exactamente esas 4 |
| `sports_bundle` (8,99 €) | los 5 deportes | Exactamente esos 5 (no duplica los que ya tengas) |

Todas son `coming_soon` y solo se ven cuando tienes una empresa (`visibleWhen: { anyHito: ['empresa'] }`). Ninguna
regala empresas, dinero ni victorias: abren **sistemas nuevos** que luego hay que jugar.

## No bombardear

- La tienda Premium filtra por fase e hitos.
- Muestra como mucho 3 destacados y nunca algo que ya tienes.
- Esconde lo que no aplica: los packs de campeón solo aparecen si ganaste esa competición, y los de club solo con tu
  club.
- `remote_config.visibleSkus` y `hiddenSkus` permiten recortar la tienda sin publicar una versión nueva.
