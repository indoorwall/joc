# Catálogo comercial (generado)

> GENERADO desde `commerce/catalog/catalog.js` (versión **1**) con `node commerce/tools/gen-catalog-doc.mjs`. No editar a mano.

Reglas: un SKU nunca cambia de significado (un producto distinto = SKU nuevo). Solo `active` se vende (y `testing` fuera de producción o a testers).
Precios en unidades mínimas (céntimos de EUR). Apple y Google usan su precio localizado; los ids de Stripe van por entorno en `product_provider_ids`.

| SKU | Tipo | Estado | Precio | Entitlements | Requisitos | Visible cuando | Apple | Google |
|---|---|---|---|---|---|---|---|---|
| `pack_debut` | COSMETIC_PACK | active | 0,99 € | `cosmetic.debut_pack` | — | anyHito=contrato | com.delbarrio.pack_debut | pack_debut |
| `pack_street` | COSMETIC_PACK | coming_soon | 1,99 € | `cosmetic.street_pack` | — | siempre | com.delbarrio.pack_street | pack_street |
| `pack_pro` | COSMETIC_PACK | coming_soon | 2,99 € | `cosmetic.pro_pack` | — | anyHito=titular | com.delbarrio.pack_pro | pack_pro |
| `pack_luxury` | COSMETIC_PACK | coming_soon | 3,99 € | `cosmetic.luxury_pack` | — | anyHito=empresa | com.delbarrio.pack_luxury | pack_luxury |
| `pack_magnate` | COSMETIC_PACK | coming_soon | 4,99 € | `cosmetic.magnate_pack` | — | anyHito=inversion2 | com.delbarrio.pack_magnate | pack_magnate |
| `founder_pack` | SUPPORTER_PACK | coming_soon | 4,99 € | `cosmetic.founder_pack`<br>`slots.extra_3`<br>`ads.remove_interstitial` | — | siempre | com.delbarrio.founder_pack | founder_pack |
| `club_pack_puerto` | COSMETIC_PACK | coming_soon | 0,99 € | `cosmetic.club_puerto` | — | club=puerto | com.delbarrio.club_pack_puerto | club_pack_puerto |
| `club_pack_costa` | COSMETIC_PACK | coming_soon | 1,99 € | `cosmetic.club_costa` | — | club=costa | com.delbarrio.club_pack_costa | club_pack_costa |
| `club_pack_atletico` | COSMETIC_PACK | coming_soon | 1,99 € | `cosmetic.club_atletico` | — | club=atletico | com.delbarrio.club_pack_atletico | club_pack_atletico |
| `champion_pack_copa` | COSMETIC_PACK | coming_soon | 0,99 € | `cosmetic.champion_copa` | — | trophy=copa | com.delbarrio.champion_pack_copa | champion_pack_copa |
| `champion_pack_europa` | COSMETIC_PACK | coming_soon | 0,99 € | `cosmetic.champion_europa` | — | trophy=europa | com.delbarrio.champion_pack_europa | champion_pack_europa |
| `champion_pack_mundial` | COSMETIC_PACK | coming_soon | 0,99 € | `cosmetic.champion_mundial` | — | trophy=mundial | com.delbarrio.champion_pack_mundial | champion_pack_mundial |
| `champion_pack_liga` | COSMETIC_PACK | coming_soon | 0,99 € | `cosmetic.champion_liga` | — | trophy=liga | com.delbarrio.champion_pack_liga | champion_pack_liga |
| `remove_ads` | REMOVE_ADS | active | 3,99 € | `ads.remove_interstitial` | — | siempre | com.delbarrio.remove_ads | remove_ads |
| `extra_save_slots_3` | SAVE_SLOTS | coming_soon | 1,99 € | `slots.extra_3` | — | siempre | com.delbarrio.extra_save_slots_3 | extra_save_slots_3 |
| `sport_climbing` | SPORT_EXPANSION | testing | 2,99 € | `sport.climbing` | — | siempre | com.delbarrio.sport_climbing | sport_climbing |
| `sport_tennis` | SPORT_EXPANSION | coming_soon | 2,99 € | `sport.tennis` | — | siempre | com.delbarrio.sport_tennis | sport_tennis |
| `sport_basketball` | SPORT_EXPANSION | coming_soon | 2,99 € | `sport.basketball` | — | siempre | com.delbarrio.sport_basketball | sport_basketball |
| `sport_skate` | SPORT_EXPANSION | coming_soon | 2,99 € | `sport.skate` | — | siempre | com.delbarrio.sport_skate | sport_skate |
| `sport_surf` | SPORT_EXPANSION | coming_soon | 2,99 € | `sport.surf` | — | siempre | com.delbarrio.sport_surf | sport_surf |
| `sports_bundle` | BUNDLE | coming_soon | 8,99 € | `sport.climbing`<br>`sport.tennis`<br>`sport.basketball`<br>`sport.skate`<br>`sport.surf` | — | siempre | com.delbarrio.sports_bundle | sports_bundle |
| `expansion_club_owner` | SYSTEM_EXPANSION | coming_soon | 3,99 € | `expansion.club_owner` | — | anyHito=empresa | com.delbarrio.expansion_club_owner | expansion_club_owner |
| `expansion_real_estate` | SYSTEM_EXPANSION | coming_soon | 2,99 € | `expansion.real_estate` | — | anyHito=empresa | com.delbarrio.expansion_real_estate | expansion_real_estate |
| `expansion_sports_agency` | SYSTEM_EXPANSION | coming_soon | 2,99 € | `expansion.sports_agency` | — | anyHito=empresa | com.delbarrio.expansion_sports_agency | expansion_sports_agency |
| `expansion_events` | SYSTEM_EXPANSION | coming_soon | 2,99 € | `expansion.events` | — | anyHito=empresa | com.delbarrio.expansion_events | expansion_events |
| `expansion_media` | SYSTEM_EXPANSION | coming_soon | 2,99 € | `expansion.media` | — | anyHito=empresa | com.delbarrio.expansion_media | expansion_media |
| `empire_bundle` | BUNDLE | coming_soon | 6,99 € | `expansion.club_owner`<br>`expansion.real_estate`<br>`expansion.sports_agency`<br>`expansion.events` | — | anyHito=empresa | com.delbarrio.empire_bundle | empire_bundle |
| `prestige_world_football_president` | PRESTIGE_CAREER | testing | 0,99 € | `prestige.world_football_president` | — | siempre | com.delbarrio.prestige_world_football_president | prestige_world_football_president |
| `prestige_world_climbing_president` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.world_climbing_president` | sport.climbing | siempre | com.delbarrio.prestige_world_climbing_president | prestige_world_climbing_president |
| `prestige_world_basket_president` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.world_basket_president` | sport.basketball | siempre | com.delbarrio.prestige_world_basket_president | prestige_world_basket_president |
| `prestige_world_tennis_president` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.world_tennis_president` | sport.tennis | siempre | com.delbarrio.prestige_world_tennis_president | prestige_world_tennis_president |
| `prestige_league_president` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.league_president` | — | siempre | com.delbarrio.prestige_league_president | prestige_league_president |
| `prestige_national_federation` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.national_federation` | — | siempre | com.delbarrio.prestige_national_federation | prestige_national_federation |
| `prestige_national_coach` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.national_coach` | — | siempre | com.delbarrio.prestige_national_coach | prestige_national_coach |
| `prestige_sporting_director` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.sporting_director` | — | siempre | com.delbarrio.prestige_sporting_director | prestige_sporting_director |
| `prestige_agent` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.agent` | — | siempre | com.delbarrio.prestige_agent | prestige_agent |
| `prestige_referee` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.referee` | — | siempre | com.delbarrio.prestige_referee | prestige_referee |
| `prestige_media_personality` | PRESTIGE_CAREER | coming_soon | 0,99 € | `prestige.media_personality` | — | siempre | com.delbarrio.prestige_media_personality | prestige_media_personality |
| `prestige_world_sports_committee` | PRESTIGE_CAREER | coming_soon | 1,99 € | `prestige.world_sports_committee` | 2 de: sport.climbing, sport.tennis, sport.basketball, sport.skate, sport.surf | siempre | com.delbarrio.prestige_world_sports_committee | prestige_world_sports_committee |
| `prestige_bundle` | BUNDLE | coming_soon | 3,99 € | `prestige.world_football_president`<br>`prestige.league_president`<br>`prestige.national_federation`<br>`prestige.national_coach`<br>`prestige.sporting_director`<br>`prestige.agent`<br>`prestige.referee`<br>`prestige.media_personality` | — | siempre | com.delbarrio.prestige_bundle | prestige_bundle |
| `promo_press` | PROMO | active | solo código | `cosmetic.press_badge` | — | siempre | — | — |
| `season_pass` | FUTURE_SUBSCRIPTION | draft | — | — | — | siempre | — | — |

## Contenido de cada producto

### 🌟 Pack Debut · `pack_debut`

Para celebrar tu primer contrato profesional.

- Outfit Debut
- Botas Debut (visuales)
- Gorra Debut
- Fondo «Primer contrato»
- Insignia Debut
- Balón firmado para tu vitrina

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🧢 Street Pack · `pack_street`

Estilo de barrio.

- Sudadera Street
- Pantalón urbano
- Zapatillas
- Gorra
- Gafas
- Mochila
- Fondo urbano
- Skin de bicicleta

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🏟️ Pro Pack · `pack_pro`

Para cuando ya eres titular habitual.

- Outfit profesional
- Traje casual
- Maleta deportiva
- Reloj (visual)
- Auriculares
- Botas Pro (visuales)
- Fondo estadio
- Fondo vestuario
- Skin de coche
- Pose

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 💎 Luxury Pack · `pack_luxury`

Aspecto de empresario. No regala coche ni casa.

- Traje Luxury
- Reloj
- Cadena
- Gafas
- Fondo rooftop
- Decoración de vivienda
- Decoración de despacho
- Skin de coche
- Pose de empresario

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🏙️ Magnate Pack · `pack_magnate`

Para el final de la partida.

- Traje magnate
- Reloj legendario
- Fondo skyline
- Despacho premium
- Decoración de mansión
- Skin de superdeportivo
- Insignia Magnate

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🏅 Founder Pack · `founder_pack`

Apoya el proyecto desde el principio.

- Insignia Founder
- Outfit Founder
- Fondo Founder
- +3 ranuras de carrera
- Sin anuncios obligatorios
- Decoración conmemorativa

### ⚓ Pack UD Puerto · `club_pack_puerto`

Los colores de UD Puerto.

- Camiseta
- Chaqueta
- Bufanda
- Mochila
- Fondo
- Decoración
- Memorabilia

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🌊 Pack Real Costa · `club_pack_costa`

Los colores de Real Costa.

- Camiseta
- Chaqueta
- Bufanda
- Mochila
- Fondo
- Decoración
- Memorabilia

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🔴 Pack Atlético Ciudad · `club_pack_atletico`

Los colores de Atlético Ciudad.

- Camiseta
- Chaqueta
- Bufanda
- Mochila
- Fondo
- Decoración
- Memorabilia

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🏆 Pack Campeón · Copa Federación · `champion_pack_copa`

Solo para quien ha ganado Copa Federación.

- Camiseta especial
- Trofeo visual
- Fondo
- Botas (visuales)
- Celebración
- Insignia

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### ⭐ Pack Campeón · Copa de Europa · `champion_pack_europa`

Solo para quien ha ganado Copa de Europa.

- Camiseta especial
- Trofeo visual
- Fondo
- Botas (visuales)
- Celebración
- Insignia

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🌍 Pack Campeón · Mundial · `champion_pack_mundial`

Solo para quien ha ganado Mundial.

- Camiseta especial
- Trofeo visual
- Fondo
- Botas (visuales)
- Celebración
- Insignia

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 👑 Pack Campeón · Liga · `champion_pack_liga`

Solo para quien ha ganado Liga.

- Camiseta especial
- Trofeo visual
- Fondo
- Botas (visuales)
- Celebración
- Insignia

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

### 🚫 Quitar anuncios · `remove_ads`

Elimina solo la publicidad obligatoria. Los anuncios con recompensa siguen disponibles si quieres verlos.

- Sin anuncios obligatorios entre pantallas
- Los anuncios voluntarios con recompensa siguen ahí

### 💾 +3 carreras · `extra_save_slots_3`

Juega hasta 4 carreras distintas a la vez.

- 3 ranuras de carrera más

### 🧗 Escalada · `sport_climbing`

Del rocódromo del barrio a la élite: bloque, dificultad y velocidad.

- Carrera: rocódromo local → autonómico → nacional → internacional → profesional
- Bloque, dificultad, velocidad, ranking, campeonatos, selección
- Ingresos: premios, sponsors, clases, campus, equipamiento de vías
- Negocios: clases, routesetting, tienda, rocódromo, eventos, cadena

### 🎾 Tenis · `sport_tennis`

Ranking, superficies, viajes y torneos.

- Ranking, superficies, viajes, calendario, entrenadores, premios, fatiga, lesiones
- Negocios: clases, academia, pistas, club, torneos, alto rendimiento

### 🏀 Basket · `sport_basketball`

Minutos, rol, playoffs y selección.

- Minutos, rol, contratos, liga, playoffs, estadísticas, selección
- Negocios: campus, academia, gimnasio, 3x3, pabellón, club

### 🛹 Skate · `sport_skate`

Reputación callejera, vídeos y contests.

- Street reputation, vídeos, contests, sponsors, estilo, comunidad
- Negocios: skateshop, marca, tablas, ropa, skatepark, eventos

### 🏄 Surf · `sport_surf`

Olas, viajes, ranking y tablas.

- Oleaje, condiciones, viajes, ranking, tablas, clima, sponsors
- Negocios: escuela, alquiler, shop, shaping, surf camp, alojamiento, eventos

### 🏅 Todos los deportes · `sports_bundle`

Los 5 deportes. Si ya tienes alguno, no se duplica.

- Escalada
- Tenis
- Basket
- Skate
- Surf

Contiene exactamente: `sport_climbing`, `sport_tennis`, `sport_basketball`, `sport_skate`, `sport_surf`. No incluye productos futuros.

### 🏟️ Propietario de club · `expansion_club_owner`

Compra participaciones o un club entero y gobiérnalo.

- Participaciones y compra de club
- Presidencia
- Director deportivo, entrenador, plantilla, cantera
- Instalaciones, estadio, patrocinadores, finanzas

### 🏢 Imperio inmobiliario · `expansion_real_estate`

Locales, pisos, parkings, edificios y terrenos.

- Locales, pisos, parkings, edificios, terrenos
- Reformas, alquiler, financiación, revalorización

### 💼 Agencia de deportistas · `expansion_sports_agency`

Capta, representa y negocia.

- Captación y scouting
- Representados, contratos, patrocinadores, comisiones
- Conflictos y crecimiento de agencia

### 🎪 Organizador de eventos · `expansion_events`

Sedes, entradas, sponsors y riesgo.

- Sedes, entradas, sponsors, deportistas
- Producción, premios, retransmisión, riesgo financiero

### 📺 Media & Sports · `expansion_media`

Tu canal, tu productora, tus derechos.

- Canal, streaming, productora, programas
- Derechos, audiencia, publicidad, patrocinios

### 👑 Empire Bundle · `empire_bundle`

Club, inmobiliaria, agencia y eventos.

- Propietario de club
- Imperio inmobiliario
- Agencia de deportistas
- Organizador de eventos

Contiene exactamente: `expansion_club_owner`, `expansion_real_estate`, `expansion_sports_agency`, `expansion_events`. No incluye productos futuros.

### 🌐 Presidente de la Federación Mundial de Fútbol · `prestige_world_football_president`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🧗 Presidente de la Federación Mundial de Escalada · `prestige_world_climbing_president`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🏀 Presidente de la Federación Mundial de Baloncesto · `prestige_world_basket_president`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🎾 Presidente de la Federación Mundial de Tenis · `prestige_world_tennis_president`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🏟️ Presidente de la Liga · `prestige_league_president`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🏛️ Presidente de la Federación Nacional · `prestige_national_federation`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 📋 Seleccionador nacional · `prestige_national_coach`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🗂️ Director deportivo · `prestige_sporting_director`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🤝 Agente internacional · `prestige_agent`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🟨 Árbitro internacional · `prestige_referee`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🎙️ Comentarista / periodista · `prestige_media_personality`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🌍 Presidente del Comité Mundial del Deporte · `prestige_world_sports_committee`

Carrera Prestige: una campaña nueva para optar a este cargo con lo que has construido en tu carrera.

> **Desbloquea la campaña jugable para intentar conseguir este cargo. La compra NO garantiza ganar.**

- Campaña jugable: elegibilidad, candidatura, apoyos, campaña, votación, mandato y reelección

### 🎖️ Prestige Bundle · `prestige_bundle`

Exactamente estas 8 carreras. No incluye carreras futuras.

- Presidente de la Federación Mundial de Fútbol
- Presidente de la Liga
- Presidente de la Federación Nacional
- Seleccionador nacional
- Director deportivo
- Agente internacional
- Árbitro internacional
- Comentarista / periodista

Contiene exactamente: `prestige_world_football_president`, `prestige_league_president`, `prestige_national_federation`, `prestige_national_coach`, `prestige_sporting_director`, `prestige_agent`, `prestige_referee`, `prestige_media_personality`. No incluye productos futuros.

### 📰 Insignia de prensa · `promo_press`

Solo con código promocional.

- Insignia de prensa

_Solo aspecto: no da nivel, reputación, marca, dinero ni resultados._

###  Pase de temporada · `season_pass`

Reservado. No se usa todavía.


## Registro de entitlements

| Entitlement | Tipo | Nombre |
|---|---|---|
| `cosmetic.debut_pack` | cosmetic | Pack Debut |
| `cosmetic.street_pack` | cosmetic | Street Pack |
| `cosmetic.pro_pack` | cosmetic | Pro Pack |
| `cosmetic.luxury_pack` | cosmetic | Luxury Pack |
| `cosmetic.magnate_pack` | cosmetic | Magnate Pack |
| `cosmetic.founder_pack` | cosmetic | Founder Pack |
| `cosmetic.press_badge` | cosmetic | Insignia de prensa |
| `ads.remove_interstitial` | ads | Sin anuncios obligatorios |
| `slots.extra_3` | slots | +3 carreras |
| `sport.climbing` | sport | Escalada |
| `sport.tennis` | sport | Tenis |
| `sport.basketball` | sport | Basket |
| `sport.skate` | sport | Skate |
| `sport.surf` | sport | Surf |
| `expansion.club_owner` | expansion | Propietario de club |
| `expansion.real_estate` | expansion | Imperio inmobiliario |
| `expansion.sports_agency` | expansion | Agencia de deportistas |
| `expansion.events` | expansion | Organizador de eventos |
| `expansion.media` | expansion | Media & Sports |
| `cosmetic.club_puerto` | cosmetic | Pack UD Puerto |
| `cosmetic.club_costa` | cosmetic | Pack Real Costa |
| `cosmetic.club_atletico` | cosmetic | Pack Atlético Ciudad |
| `cosmetic.champion_copa` | cosmetic | Pack Campeón · Copa Federación |
| `cosmetic.champion_europa` | cosmetic | Pack Campeón · Copa de Europa |
| `cosmetic.champion_mundial` | cosmetic | Pack Campeón · Mundial |
| `cosmetic.champion_liga` | cosmetic | Pack Campeón · Liga |
| `prestige.world_football_president` | prestige | Presidente de la Federación Mundial de Fútbol |
| `prestige.world_climbing_president` | prestige | Presidente de la Federación Mundial de Escalada |
| `prestige.world_basket_president` | prestige | Presidente de la Federación Mundial de Baloncesto |
| `prestige.world_tennis_president` | prestige | Presidente de la Federación Mundial de Tenis |
| `prestige.league_president` | prestige | Presidente de la Liga |
| `prestige.national_federation` | prestige | Presidente de la Federación Nacional |
| `prestige.national_coach` | prestige | Seleccionador nacional |
| `prestige.sporting_director` | prestige | Director deportivo |
| `prestige.agent` | prestige | Agente internacional |
| `prestige.referee` | prestige | Árbitro internacional |
| `prestige.media_personality` | prestige | Comentarista / periodista |
| `prestige.world_sports_committee` | prestige | Presidente del Comité Mundial del Deporte |
