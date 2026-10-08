# Prestige Careers

Una Prestige Career es una **mini-expansión**. Suele costar 0,99 €.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**
>
> Este texto es obligatorio en la ficha y el test de interfaz comprueba que aparece.

## Estados (`commerce/core/prestige.js`)

```
LOCKED ──compra──▶ PURCHASED ─▶ NOT_ELIGIBLE ⇄ ELIGIBLE ─▶ CANDIDATE ─▶ CAMPAIGN ─▶ ELECTION ─▶ OFFICE ─▶ REELECTION ─▶ OFFICE …
                                                    ▲                                     │ (pierdes)          │ (pierdes)
                                                    └─────────────────────────────────────┘                    ▼
                                                                                                             FORMER
```

- **Comprar** solo lleva a `PURCHASED`, que se resuelve en `NOT_ELIGIBLE` o `ELIGIBLE`. Nunca a `OFFICE`.
- **La elegibilidad sale del juego, no del pago:**
  - edad;
  - prestigio (reputación);
  - temporadas de carrera;
  - reputación pública (marca);
  - experiencia institucional;
  - expansiones requeridas.

  `eligibility()` devuelve lo que falta para que la interfaz lo explique.
- **Campaña:**
  - Los apoyos suben cada semana según el esfuerzo, la reputación y los contactos.
  - A las 6 semanas toca la votación.
  - La probabilidad de ganar sale de los apoyos (entre el 5 y el 90 %) y el azar lo pone la semilla de la partida.
  - **Se puede perder.**
- **Mandato:** dura las semanas del cargo y luego hay reelección. Perder la reelección deja la carrera en `FORMER`.

## Carreras

| SKU | Cargo (nombre ficticio: sin FIFA, FIBA, IFSC ni COI) | Requiere | Estado |
|---|---|---|---|
| `prestige_world_football_president` | Presidente de la Federación Mundial de Fútbol | — | **testing** (entitlement de prueba) |
| `prestige_world_climbing_president` | Presidente de la Federación Mundial de Escalada | `sport.climbing` | coming_soon |
| `prestige_world_basket_president` | Presidente de la Federación Mundial de Baloncesto | `sport.basketball` | coming_soon |
| `prestige_world_tennis_president` | Presidente de la Federación Mundial de Tenis | `sport.tennis` | coming_soon |
| `prestige_league_president` | Presidente de la Liga | — | coming_soon |
| `prestige_national_federation` | Presidente de la Federación Nacional | — | coming_soon |
| `prestige_national_coach` | Seleccionador nacional | — | coming_soon |
| `prestige_sporting_director` | Director deportivo | — | coming_soon |
| `prestige_agent` | Agente internacional (versión personal; no sustituye a la expansión Agencia) | — | coming_soon |
| `prestige_referee` | Árbitro internacional (regional → nacional → internacional → grandes finales) | — | coming_soon |
| `prestige_media_personality` | Comentarista / periodista | — | coming_soon |
| `prestige_world_sports_committee` (1,99 €) | Presidente del Comité Mundial del Deporte | 2 deportes | coming_soon |
| `prestige_bundle` (3,99 €) | Las 8 carreras sin requisito de deporte (con nombre) | — | coming_soon |

Las decisiones previstas de cada cargo están en `PRESTIGE_CAREERS[id].decisions`. Por ejemplo, para la presidencia
mundial de fútbol: sedes, formatos, premios, calendario, desarrollo, sponsors, presupuesto, reglas, federaciones y
crisis.

## Dependencias antes de pagar

Si te falta el deporte, la ficha dice «🔒 Necesitas la expansión **Escalada**» y ofrece un botón para verla. El botón
«Comprar» no aparece. El servidor también lo bloquea (`requires`), así que nunca se cobra 0,99 € por algo que no puedes
usar.

## Siguiente paso de gameplay

El motor ya está y está probado. Falta la interfaz y los eventos de cada cargo, que llegarán como una pantalla de
«campaña» semanal reutilizando el formato de decisiones del juego.
