# P0 — Jugada interactiva (versió 0.1, 6 d'octubre de 2026)

Prototip de **només una jugada**: passada, desmarcatge, devolució i xut, en vertical i amb un dit.
No hi ha carrera, economia, vides, anuncis, compres ni connexió a Internet. Es pot repetir gratis.

- Joc: `p0/futbol_p0.html` (un sol arxiu, sense res més)
- Proves automàtiques: `tests/p0.test.cjs` (només per a qui programa; no cal per jugar)

---

## 1. Obrir-lo al Mac (ja disponible, sense instal·lar res)

1. Descarrega `futbol_p0.html` (a GitHub: obre l'arxiu → botó **Download raw file**).
2. Guarda'l en una carpeta, per exemple `Documents/Futbol/`.
3. Fes-hi **doble clic**. S'obrirà amb Safari o el navegador que tinguis.
4. Prem **Comença**. Amb el ratolí: clica i arrossega a la zona fosca de sota, deixa anar per executar.

**Còpia de seguretat:** abans de substituir-lo per una versió nova, canvia el nom de l'actual
(per exemple `futbol_p0_v0.1_funciona.html`) i conserva-la.

## 2. Com es juga

| Situació | Què fas |
|---|---|
| Tens la pilota | Toca **Passar** o **Xutar** (queda seleccionat, no cal mantenir-lo). Arrossega a la zona de sota: la direcció és cap on va la pilota (**amunt = porteria**) i la llargada és la força. Deixa anar. |
| No tens la pilota | Arrossega a la mateixa zona per fer un **desmarcatge curt**. |
| Toc curt sense arrossegar | No fa res (així no es dispara res per error). |

- Ets el jugador blau amb l'anell groc i l'etiqueta **TU**. Passar **no** et canvia de jugador.
- El company (blau clar) **decideix** si et torna la pilota. Mentre la té, una línia discontínua
  mostra la devolució que veu: **verda** = lliure, **vermella** = tapada.
- El defensor (vermell) pot interceptar o prendre la pilota. El porter (verd) pot aturar.
- La línia sobre el camp és **orientativa**: el con mostra l'error probable. Si es torna **vermella**
  al xutar, hi ha massa força i la pilota pot anar per sobre.
- Mentre apuntes el joc s'alenteix una mica (com a màxim 2,5 s per jugada), però **el rellotge no s'atura**.
- La jugada acaba amb gol, aturada, fora, pèrdua o als 15 segons. El resultat explica què ha passat.
- Si la pàgina perd el focus o la visibilitat (canvies d'app, de pestanya o de finestra), el joc es **pausa**.

## 3. Provar-lo a l'iPhone

**Encara no s'ha provat en cap iPhone ni a Safari.** Les proves s'han fet amb Chromium simulant un iPhone.

**Ruta A — xarxa Wi-Fi de casa (gratuïta; cal un pas de configuració al Mac)**

1. Al Mac, obre **Terminal** (Aplicacions → Utilitats).
2. Escriu `cd ` (amb un espai), arrossega a la finestra la carpeta on hi ha `futbol_p0.html` i prem Retorn.
3. Escriu `python3 -m http.server 8000` i prem Retorn.
   Si el Mac demana instal·lar les «eines de línia d'ordres», són gratuïtes i d'Apple: accepta i torna-ho a provar.
   Si el Mac pregunta si vols acceptar connexions entrants, digues que sí.
4. Busca l'adreça del Mac: Configuració del Sistema → Wi-Fi → Detalls → **Adreça IP** (per exemple `192.168.1.23`).
5. A l'iPhone, connectat a **la mateixa Wi-Fi**, obre Safari i escriu: `http://192.168.1.23:8000/futbol_p0.html`
   (amb la teva adreça).
6. Per aturar-ho, al Terminal prem `Control + C`.

Només ho pot veure qui estigui a la teva Wi-Fi mentre el Terminal estigui obert. No és públic.

**Ruta B — enllaç a Internet (requereix la teva autorització; no s'ha fet)**

Es podria publicar en un enllaç privat o en un servei d'allotjament gratuït, per obrir-lo des de qualsevol lloc.
No s'ha creat cap enllaç. Si ho vols, cal que ho autoritzis explícitament.

**Què cal comprovar a l'iPhone (ajuda de l'assessor):**
- Que la pàgina no es desplaça ni fa zoom en arrossegar.
- Que la franja inferior és còmoda per al polze i no queda tapada per la barra d'inici.
- Que la notch / illa dinàmica no tapa el rellotge.
- Que en tornar d'una altra app apareix la pausa.
- Que el ritme (15 s, velocitats) es percep bé.

## 4. Proves realment executades (Chromium sense pantalla, Linux)

27 de 27 comprovacions superades amb `node tests/p0.test.cjs`:

1. **Un sol dit / ratolí**: gestos tàctils simulats (mida iPhone 13) i ratolí d'escriptori. Toc a Comença,
   toc a Xutar, arrossegar i deixar anar → passada i xut. Un toc curt no dispara res. La pàgina no es desplaça.
2. **Passar no canvia el jugador**: després de passar, el mateix gest mou el protagonista, no el company.
3. **Seqüència completa**: passada → desmarcatge → devolució → xut, comprovada en 40 jugades simulades
   (38 devolucions; 2 pèrdues). També s'ha mesurat que els desmarcatges cap enrere o laterals tenen
   devolució gairebé sempre i els desmarcatges llargs cap a porteria, entre un 35 % i un 90 %.
4. **Intercepció**: una passada tirada per on és el defensor s'intercepta (30 de 30).
   Un xut contra el cos del defensor no el travessa mai (30 de 30 bloquejats).
5. **Gol, aturada i fora**: 400 xuts simulats des de 5 posicions amb direcció i força variades
   donen tots tres resultats. Des del punt de penal: ~40 % gols; des de 19 m: ~9 %.
   A força màxima des de 20 m la pilota va per sobre del travesser en 50 de 60 casos; al 60 %, en cap.
6. **Rellotge**: una jugada sense acció acaba exactament als 15 s com a «Temps exhaurit».
   Apuntar consumeix temps real; l'alentiment s'esgota als 2,5 s.
7. **Repetir**: restableix pilota, jugadors, rellotge, resultat, missatges i el mode (Passar).
8. **Registre únic**: un gol suma 1 al recompte i la finestra surt 1 vegada encara que es forci un segon final.
9. **Cap petició externa**: l'arxiu no fa cap connexió (verificat en execució i revisant el codi).
10. **Sense diners**: no hi ha anuncis, compres, monedes ni vides.

També: pausa en perdre visibilitat, cap error de JavaScript, i captures revisades a 390×664, 375×550 i 320×460 px.

**No s'ha provat:** Safari al Mac, Safari a l'iPhone, rendiment en un mòbil real, sensació real del polze.

## 5. Simplificacions del prototip

- Només mig camp: la zona de joc té un límit inferior (línia discontínua) i laterals propis. Sortir-ne = «Fora».
- Sense fores de joc, faltes, córners ni regat (el protagonista no es mou amb la pilota).
- Un sol defensor. Si intercepta o pren la pilota, la jugada acaba com a «Pèrdua».
- Qualsevol pilota que toca el porter compta com a «Aturada».
- Les figures es dibuixen més grans que la mida real perquè es vegin al mòbil.
- Les xifres (velocitats, temps de reacció, abast del porter) són **valors de prova**, no dades reals.

## 6. Ajustos pendents (per decidir després de provar-lo)

- Sensació de força: llargada d'arrossegament per a 100 % (`control.maxDragPx`).
- Dificultat del porter (`keeper.reaction`, `keeper.diveSpeed`, `keeper.diveReach`).
- Agressivitat del defensor (`defender.tackleRateHero`, `defender.pressMateAfter`).
- Si cal un mode preseleccionat (ara és Passar) o començar sense cap.
- Alentiment en apuntar (`control.aimTimeScale`, `control.aimSlowBudget`).

Tots aquests valors són a l'inici del codi, a la secció **1. CONFIGURACIÓ**, separats de la lògica del joc.
