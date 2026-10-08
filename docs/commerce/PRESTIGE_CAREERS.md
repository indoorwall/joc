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
| `prestige_world_football_president` | Presidente de la Federación Mundial de Fútbol | — | active (jugable) |
| `prestige_world_climbing_president` | Presidente de la Federación Mundial de Escalada | `sport.climbing` | active (jugable) |
| `prestige_world_basket_president` | Presidente de la Federación Mundial de Baloncesto | `sport.basketball` | active (jugable) |
| `prestige_world_tennis_president` | Presidente de la Federación Mundial de Tenis | `sport.tennis` | active (jugable) |
| `prestige_league_president` | Presidente de la Liga | — | active (jugable) |
| `prestige_national_federation` | Presidente de la Federación Nacional | — | active (jugable) |
| `prestige_national_coach` | Seleccionador nacional | — | active (jugable) |
| `prestige_sporting_director` | Director deportivo | — | active (jugable) |
| `prestige_agent` | Agente internacional (versión personal; no sustituye a la expansión Agencia) | — | active (jugable) |
| `prestige_referee` | Árbitro internacional (regional → nacional → internacional → grandes finales) | — | active (jugable) |
| `prestige_media_personality` | Comentarista / periodista | — | active (jugable) |
| `prestige_world_sports_committee` (1,99 €) | Presidente del Comité Mundial del Deporte | 2 deportes | active (jugable) |
| `prestige_bundle` (3,99 €) | Las 8 carreras sin requisito de deporte (con nombre) | — | active (jugable) |

Las decisiones previstas de cada cargo están en `PRESTIGE_CAREERS[id].decisions`. Por ejemplo, para la presidencia
mundial de fútbol: sedes, formatos, premios, calendario, desarrollo, sponsors, presupuesto, reglas, federaciones y
crisis.

## Dependencias antes de pagar

Si te falta el deporte, la ficha dice «🔒 Necesitas la expansión **Escalada**» y ofrece un botón para verla. El botón
«Comprar» no aparece. El servidor también lo bloquea (`requires`), así que nunca se cobra 0,99 € por algo que no puedes
usar.

## En el juego (P2.7, `p2/src/19_prestige.js` y `22_ui_prestige.js`)

Los 12 cargos son jugables, en la sección **🎖️ Prestige**:

1. **Requisitos jugables** (nunca se compran): reputación, marca, temporadas, títulos, haber jugado ese deporte,
   experiencia institucional, deportes en la cuenta o patrimonio, según el cargo. La ficha dice qué te falta.
2. **Candidatura:** te retiras del deporte y, si hace falta, pasan los años hasta la edad del cargo (te avisa antes).
3. **Campaña** (4–9 semanas): reuniones por bloques de votantes, programa (credibilidad), medios (con riesgo de
   polémica), gira (cuesta dinero) y alianzas (promesas que pesan en el mandato). Los nombramientos, exámenes y
   castings tienen sus propias acciones. Hay un rival.
4. **Votación** (o examen, o decisión): se puede perder. Un test juega candidatos justos de méritos sin campaña y
   pierden; candidatos fuertes que hacen campaña ganan.
5. **Mandato:** aprobación, presupuesto, prestigio y polémica. Cada semana gestión, comunicación, viaje o reforma.
   Tiene decisiones propias del cargo, crisis y un evento periódico (torneo, ventana de fichajes, gran final…).
   Si la aprobación se hunde, dimites.
6. **Reelección** al acabar el mandato. Al terminar la etapa queda en tu historial y puedes volver a presentarte.

Retirarse del deporte también se puede sin Prestige. Tus empresas, inversiones y expansiones siguen.
