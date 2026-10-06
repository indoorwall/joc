# P1 — Del barrio al negocio (versión 0.3, 6 de octubre de 2026)

Juego de **gestión y decisiones**, en vertical y pensado para iPhone. No es un simulador de fútbol:
no hay partidos controlables, física, gráficos 3D ni controles deportivos. Los partidos se simulan
con reglas que el juego explica después de cada semana.

- Juego: `p1/carrera_p1.html` (un único archivo, no necesita nada más ni conexión a Internet)
- Pruebas automáticas: `tests/p1.test.cjs` (solo para quien programa; no hace falta para jugar)
- Sin anuncios, compras, cuentas de usuario ni servicios de IA externos.

> **Importes provisionales.** Todo el dinero se muestra en euros, pero son importes de juego:
> no son precios ni salarios reales. Son valores de prueba para equilibrar el juego y se cambian en
> la sección **1. CONFIGURACIÓN** del código.

**Novedades de la versión 0.3 (más realismo y más vida):**
- **Mundo de fútbol**: 6 países (España, Portugal, Italia, Francia, Inglaterra, Alemania) con
  21 divisiones de 10 clubes. Clubes, ciudades y estadios son **ficticios** y se generan en cada partida.
- **Empiezas en un club pequeño**: el de tu barrio (5ª división española, estadio municipal de unos
  cientos de plazas) o el del ojeador (4ª división, en otra ciudad).
- **Temporadas de 18 jornadas** con calendario real de ida y vuelta, clasificación, **ascensos y
  descensos** (2 y 2), campeón y mercado de invierno (tras la jornada 9) y de verano.
- **Contratos realistas**: sueldo semanal, duración en temporadas, prima de fichaje, por victoria,
  por gol, **prima por ascenso**, cláusulas de subida por ascenso y bajada por descenso, gastos de
  vida según el país (o con tu familia) e **impuestos** simplificados por tramos.
- **Estadios según el aforo**: campo municipal, estadio mediano o gran estadio, con público en cada partido.
- **Edad y potencial**: empiezas con 17 años, cumples uno por temporada, mejoras menos con la edad y
  cerca de tu techo.
- **Posición** (delantero, centrocampista o defensa): cambia goles, asistencias y notas.
- **Más vida**: 16 imprevistos (entrevistas, cena del equipo, lesión de un compañero, préstamo a un
  amigo, multa, vídeo viral, sub‑21, avería o inspección en la peluquería…), prensa con titulares cada
  jornada, pestaña **Liga** con la clasificación y tu trayectoria, y próximo rival en la pantalla principal.

---

## 1. Abrirlo

**En el Mac:** descarga `carrera_p1.html` (en GitHub: abre el archivo → **Download raw file**) y haz doble clic.

**En el iPhone (Wi‑Fi de casa):** igual que con el P0. En el Mac, en Terminal, entra en la carpeta
del archivo y ejecuta `python3 -m http.server 8000`. En el iPhone, en la misma Wi‑Fi, abre Safari en
`http://IP-DEL-MAC:8000/carrera_p1.html`. Para pararlo: `Control + C`.

La partida se guarda sola en el navegador del dispositivo. Ojo: el guardado depende de la dirección,
así que abrirlo con doble clic en el Mac y abrirlo en el iPhone son partidas distintas.

## 2. Bucle principal

1. **Consulta** la situación y el **objetivo actual** (tarjeta amarilla, siempre arriba, con barra de progreso).
2. **Toma una decisión**: toca una tarjeta (cada una muestra ventajas en verde, costes en rojo y la regla).
3. **Juega la semana** con el botón verde inferior.
4. **Mira los resultados**: marcador, tu nota, lo que has ganado o perdido y las novedades. Las reglas
   aplicadas están en «🔍 ¿Por qué ha pasado esto?».

Pestañas inferiores: **Carrera** (decidir), **Liga** (clasificación, trayectoria y el mundo),
**Negocio** (comprar y gestionar la peluquería), **Finanzas** (patrimonio, movimientos, evolución y reiniciar).

## 3. Etapas y objetivos

| Etapa | Objetivo | Cómo se consigue |
|---|---|---|
| Barrio | Que te vea un ojeador | Reputación ≥ 25. Partido en la plaza: 3 + nivel/10 (+2 si tienes energía ≥ 50) |
| Ojeador | Elegir plazo | 3 semanas, o 5 semanas con −4 puntos en la prueba |
| Preparación | Buena puntuación | Prueba = nivel + energía/5 + reputación/5 ± 5 de suerte |
| Ofertas | Elegir club | Club del barrio (5ª) o club del ojeador (4ª), ver abajo |
| Profesional | Mejora de contrato | ≥ 6 semanas, ≥ 4 partidos jugados y nota media de los 5 últimos ≥ 6,3 |
| Carrera | Subir de categoría | Ascender con tu club (2 primeros) o fichar por uno mejor en el mercado |
| Ahorro | Comprar la peluquería | 25.000 € de traspaso + caja inicial (2.000 / 5.000 / 9.000 €) |
| Negocio | Patrimonio 100.000 € | Patrimonio = dinero personal + caja del negocio + valor del negocio |

Al llegar al patrimonio objetivo aparece el fin de la versión; se puede seguir jugando.

## 4. Reglas principales

**Barrio y preparación:** partido en la plaza (reputación, −15 energía), entrenar solo (+3 nivel,
−20 energía), entrenador personal (solo en la preparación: +6 nivel, −25 energía, −90 €), trabajar
(+60 €, −15 energía), descansar (+25 energía). Se recuperan 10 de energía por semana.

**Primeras ofertas:**

| | Club del barrio (5ª división) | Club del ojeador (4ª división) |
|---|---|---|
| Sueldo | 40 + 3 €/sem por punto de prueba por encima de 45 | 260 €/sem si la prueba ≥ 58; si no, 190 € |
| Gastos de vida | 40 €/sem (vives con tu familia) | 140 €/sem (otra ciudad) |
| Primas | 15 €/victoria · 1.500 € por ascenso y +50 % de sueldo | 300 € de fichaje · 40 €/victoria · 3.000 € por ascenso y +30 % |
| Duración | 2 temporadas | 1 temporada, −25 % de sueldo si desciende |
| Equipo | Más débil: más fácil ser titular | Más fuerte: más competencia, más visibilidad |

**Divisiones (fuerza media de los equipos · sueldos de referencia por semana):** España: Primera
División (80 · 8.000–40.000 €), Segunda (70 · 1.500–6.000 €), Primera Federación (60 · 400–1.500 €),
Segunda Federación (52 · 150–500 €), Tercera Federación (45 · 40–160 €). Los demás países, en la
pestaña Liga → «El mundo del fútbol».

**Cada semana como profesional:** entrenamiento extra (0,6 × calidad × edad × techo de nivel,
−20 energía), semana normal (0,3 × …, −10 energía), fisio (+25 energía, −60 €, acorta lesiones),
reposo (+15 energía, gratis), acto de patrocinador ((20 + reputación × 3) × visibilidad €, +2 reputación,
−8 en la selección esa semana) y, con negocio, una semana en la peluquería (+6 fama, −4 en la selección;
150 € de viaje si juegas fuera de España).
- Calidad de entrenamiento: de × 1,4 (1ª división) a × 0,9 (5ª). Edad: × 1,2 hasta 20 años, × 1 hasta 24,
  × 0,7 hasta 28 y × 0,4 después. Techo: mejoras menos a 15 puntos de tu potencial (75–92) y nada al alcanzarlo.

**Partido simulado (cada jornada, contra el rival real del calendario):**
- Selección = nivel + energía/4 ± modificadores (imprevistos, adaptación al país, tensión). Titular si
  llega a fuerza del club + 8; si no, suplente con 50 % de jugar.
- Nota = 6 (+0,3 defensa, +0,1 centrocampista) + (nivel − fuerza del rival)/8 + (energía − 60)/30 ± 1,2
  de suerte, +0,6 por gol y +0,3 por asistencia.
- Goles: cada equipo marca según su fuerza y quién juega en casa; tu nota empuja a tu equipo.
- Reputación: (nota − 6) × 2 × visibilidad de la liga + goles × 2 (×3 defensa); la mitad si eres suplente; −1 si no juegas.
- Energía: titular −15, suplente −5, y se recuperan 20 cada semana. Lesión: si juegas con energía < 35,
  2 % de riesgo por punto por debajo; de 1 a 4 semanas fuera.
- Dinero: sueldo + primas − impuestos (5 % hasta 300 €, 15 % hasta 1.000 €, 30 % hasta 4.000 €, 45 % por encima) − gastos de vida.

**Fin de temporada:** los 2 primeros ascienden y los 2 últimos descienden en todas las divisiones de
todos los países (en la tuya cuenta la clasificación real). Se cobran la prima por ascenso (si jugaste
al menos 5 partidos) y las cláusulas de subida o bajada de sueldo. Cumples un año. Si tu contrato termina,
tu club te ofrece renovar (+10 % o −10 % según tu nota media) junto con las otras ofertas.

**Mercado (invierno y verano):** te quieren clubes cuya fuerza esté entre 5 por encima y 12 por debajo
de tu nivel, y cuya reputación exigida alcances: (fuerza de la liga − 40) × 1,2, más un extra en el
extranjero (Portugal +8, Italia/Francia/Alemania +12, Inglaterra +15). Si cambias de país: −4 en la
selección durante 6 semanas (adaptación).

**Mejora de contrato (tres opciones):** aceptar (+35 % de sueldo y una temporada más); pedir un 20 % más
(probabilidad = tu reputación, entre 10 % y 80 %; si falla, firmas la oferta inicial con relación tensa:
−6 en la selección durante 4 semanas); o contrato largo (−10 % de sueldo, +2 temporadas y prima inmediata
de 4 semanas de sueldo).

**Peluquería:**
- Demanda = 150 × factor de precio × (0,2 + fama/80) × (1 + tu reputación/200) ± 10 %.
- Capacidad = personas × 60 (sueldo básico) o × 70 (sueldo bueno). Clientes = mínimo de demanda y capacidad.
- Precios: económico 10 € (× 1,4 clientes, +1 fama/sem), normal 15 €, premium 25 €
  (× 0,45 clientes, −3 fama/sem mientras la fama sea < 60).
- Sueldos: básico 320 €/sem (−1 fama/sem por rotación), bueno 420 €/sem (+1 fama/sem).
- Gastos: alquiler 300 € + sueldos + 1,5 € de producto por cliente. Contratar cuesta 300 € de la caja; despedir, una semana de sueldo.
- Más de 5 clientes sin atender: −2 fama. Caja en negativo: −5 fama.
- Valor del negocio = 25.000 € × (0,5 + fama/100).

**Dinero personal y caja del negocio están separados.** El sueldo va a tu dinero; los clientes pagan
a la caja. Solo se mueve dinero entre ambos con los botones de traspaso (1.000 €) en «Negocio».
Los cambios de precio y personal no gastan la decisión semanal.

## 5. Pruebas realmente ejecutadas (Chromium sin pantalla, Linux)

64 de 64 comprobaciones superadas con `node tests/p1.test.cjs` (tarda unos 8 minutos), emulando un iPhone 13 con toques:

1. Presentación (nombre, personaje y posición), euros, bucle de una semana, botones de ≥ 44 px,
   sin desplazamiento horizontal a 320, 375 y 390 px, sin errores ni peticiones externas.
2. **Dos temporadas enteras solo con toques**: ojeador de un club de 4ª división (semana 4), dos ofertas
   españolas con condiciones distintas, estadio dibujado según el aforo, clasificación de 10 equipos,
   marcador con estadio y público, prensa, mercado de invierno, mejora de contrato, imprevistos con
   efecto, fin de temporada y edad (19 años al acabar la segunda). Después (con dinero añadido para no
   jugar 60 semanas más) compra de la peluquería, cambios de personal, sueldo y precio, separación
   de dinero personal y caja durante 6 semanas, patrimonio, guardado del mundo y la liga, y reinicio.
3. **Reglas**: 6 países y 21 divisiones de 10 clubes con nombres únicos; aforos por división;
   calendario de ida y vuelta; determinismo; impuestos y gastos; un equipo muy superior asciende,
   cobra la prima y aplica la subida de sueldo; nueva temporada; divisiones siempre de 10 tras
   ascensos y descensos; mercado según nivel y reputación; lesiones; patrocinio; pedir más; contrato
   largo; préstamo; cena del equipo; reglas de fama del negocio; bloqueos.
4. **Carreras completas** (3 estrategias × 3 partidas, hasta 260 semanas): todas llegan a la meta.
   - «Crecer» (entrenamiento extra, buscar más categoría): peluquería ~semana 60, meta ~78, nivel ~78.
   - «Empresario» (cuidar el negocio): peluquería ~89, meta ~106, fama del negocio ~70.
   - «Dinero» (patrocinios, elegir el sueldo más alto): peluquería ~89, meta ~133, nivel ~68.

**No se ha probado:** Safari en Mac ni iPhone real.

## 6. Simplificaciones y pendientes

- **Equilibrio a decidir:** como en la realidad, subir de categoría es lo que más dinero da, así que
  la estrategia «crecer» llega antes a la meta y además con más nivel; solo pierde en el negocio
  (fama ~3). La estrategia «dinero» a corto plazo queda por detrás en todo. Si se quiere que el negocio
  importe más, la meta podría exigir también una fama mínima de la peluquería.
- Divisiones de 10 equipos (las reales tienen 18–24) para que una temporada dure 18 semanas.
- Sin copas, selección absoluta, representante, retirada ni más negocios.
- Los clubes, ciudades y estadios son ficticios; los nombres de división son de ambientación.
- Ajustes en **1. CONFIGURACIÓN**: sueldos y aforos por división, crecimiento (`mejoraNormal`,
  `mejoraExtra`, `potencial`), impuestos, probabilidad de imprevistos (`probSuceso`), negocio y meta.
