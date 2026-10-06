# P1 — Del barrio al negocio (versión 0.4, 6 de octubre de 2026)

**Simulador de vida** de un futbolista, en vertical y pensado para iPhone, al estilo de los juegos
tipo BitLife: un diario de tu vida, barras de estado, un botón grande para avanzar el tiempo, menús
de Carrera, Bienes, Relaciones y Actividades, y ventanas emergentes con decisiones e imprevistos.
No es un simulador de fútbol: los partidos se simulan con reglas que el juego explica.

- Juego: `p1/carrera_p1.html` (un único archivo, sin conexión a Internet)
- Pruebas automáticas: `tests/p1.test.cjs` (solo para quien programa)
- Sin anuncios, compras, cuentas de usuario ni servicios de IA externos.
- Clubes, ciudades y estadios son **ficticios**. Los importes están en euros pero son **de juego y
  provisionales**: no son precios ni salarios reales. Todo se ajusta en **1. CONFIGURACIÓN**.

**Novedades de la versión 0.4**
- **Nueva interfaz estilo simulador de vida**: cabecera con tu nombre, ocupación, edad y dinero;
  **diario** con todo lo que te pasa cada semana (con «¿Por qué ha pasado esto?»); **4 barras**
  (😊 felicidad, ⚡ energía, 💪 nivel, ⭐ reputación); botón verde **+ Semana**; menús **Carrera**,
  **Bienes**, **Relaciones** y **Actividades**; **ventanas emergentes** para ofertas, mejoras, fin de
  temporada e imprevistos; **logros**.
- **Plan semanal** que se repite solo hasta que lo cambies (como avanzar un año en BitLife).
- **Felicidad**: depende de tus relaciones, casa propia, pareja, coches, mascota, resultados,
  lesiones y deudas, y suma o resta hasta 0,5 a tu nota en los partidos.
- **Relaciones**: madre, padre, mejor amigo/a, pareja (si conoces a alguien) y representante
  (si tienes reputación). Bajan solas si no las cuidas.
- **Actividades** (2 por semana): gimnasio, fiesta, vacaciones, meditar, redes, visitar tus negocios,
  curso de gestión y lotería.
- **44 imprevistos** distintos que afectan a varias cosas a la vez: dinero, felicidad, energía,
  reputación, nivel, relaciones, selección, negocios, casas y clubes.
- **Bienes**:
  - **4 negocios en cadena**: peluquería (25.000 €) → cafetería (70.000 €) → tienda de deportes
    (180.000 €) → gimnasio (450.000 €). Cada uno con su caja, personal, sueldos y precios.
  - **Inmobiliaria**: estudios, pisos, casas adosadas, áticos, chalets y villas. Se revalorizan con
    el mercado; puedes **vivir** en una (−60 % de gastos de vida en España, más felicidad) o
    **alquilarlas** (ingresos semanales, inquilinos que no pagan, calderas que se rompen…).
  - **Coches**: dan felicidad y reputación, pero pierden valor y tienen mantenimiento.
  - **Clubes de fútbol**: puedes comprar el club de tu barrio, el tuyo o otros de tu liga. Decides el
    precio de las entradas y cuánto invertir en la plantilla; si sube de fuerza y asciende, vale más.

---

## 1. Abrirlo

**En el Mac:** descarga `carrera_p1.html` (en GitHub: abre el archivo → **Download raw file**) y haz doble clic.

**En el iPhone (Wi‑Fi de casa):** en el Mac, en Terminal, entra en la carpeta del archivo y ejecuta
`python3 -m http.server 8000`. En el iPhone, en la misma Wi‑Fi, abre Safari en
`http://IP-DEL-MAC:8000/carrera_p1.html`. Para pararlo: `Control + C`.

La partida se guarda sola en el navegador. Las partidas de versiones anteriores no se cargan.

## 2. Cómo se juega

1. Mira la **misión** (arriba) y tus **barras** (abajo).
2. Elige tu **plan semanal** en Carrera (se repite solo) y, si quieres, hasta 2 **actividades** y una
   interacción por persona en **Relaciones**. En **Bienes** compras y gestionas negocios, casas,
   coches y clubes.
3. Pulsa **+ Semana**.
4. Lee el **diario** y decide en las **ventanas emergentes** que aparezcan.

## 3. Reglas principales

**Carrera** (igual que la versión 0.3): barrio → ojeador → pruebas → club del barrio (5ª división) o
del ojeador (4ª) → temporadas de 18 jornadas con ascensos, descensos, mercados de invierno y verano,
primas por ascenso, impuestos y gastos de vida; 6 países y 21 divisiones.
Nota = 6 (+0,3 defensa, +0,1 centrocampista) + (nivel − fuerza del rival)/8 + (energía − 60)/30
+ **(felicidad − 50)/100** ± 1,2 de suerte, +0,6 por gol, +0,3 por asistencia.

**Felicidad:** cada semana se acerca un 25 % a su objetivo = 35 + 0,3 × media de tus relaciones
+ 8 casa propia + 5 pareja (relación ≥ 50) + coches (hasta 8) + 4 mascota − 15 números rojos
− 8 lesión ± resultado del partido (titular +3, sin jugar −4, victoria +4, derrota −4).

**Relaciones:** bajan 1 por semana (pareja 2). Una interacción por persona y semana: pasar tiempo
(+8, +3 felicidad, −5 energía), regalo (+12, −60 €), llamar (+4); a tus padres puedes pedirles dinero
(si la relación es ≥ 50, una vez cada 10 semanas). Si la pareja baja de 15, te deja. El representante
cobra un 10 % de tu sueldo y consigue un 15 % más en las ofertas y una oferta extra en cada mercado.

**Actividades (2 por semana, sin repetir):** gimnasio (nivel según tu techo, −10 energía, +3
felicidad, −30 €), fiesta (+12 felicidad, −20 energía, −50 €, 25 % de foto comprometida: −3
reputación), vacaciones (+25 felicidad, +30 energía, −600 €, −4 en la selección; cada 6 semanas),
meditar (+6 felicidad, +5 energía), redes (+2 reputación; 10 % de polémica), visitar negocios (+4
fama en todos), curso de gestión (−800 €, +5 % de demanda en todos tus negocios, máximo 3) y lotería
(−2 €, 1 entre 5.000 de ganar 50.000 €).

**Negocios:** demanda = base × factor de precio × (0,2 + fama/80) × (1 + reputación/200)
× (1 + 5 % por curso) ± 10 %. Capacidad = personas × capacidad por sueldo. Resultado = ingresos −
alquiler − sueldos − género. Fama: precio económico +1, premium −3 (si fama < 60), sueldo básico −1,
bueno +1, clientes perdidos −2, caja negativa −5. Valor = precio × (0,5 + fama/100).

| Negocio | Precio | Alquiler/sem | Demanda base | Precio normal |
|---|---|---|---|---|
| 💈 Peluquería | 25.000 € | 300 € | 150 clientes | 15 € |
| ☕ Cafetería | 70.000 € | 700 € | 900 consumiciones | 4,5 € |
| 👟 Tienda de deportes | 180.000 € | 1.500 € | 400 ventas | 40 € |
| 🏋️ Gimnasio | 450.000 € | 3.000 € | 1.500 socios | 9 €/semana |

**Inmuebles:** precios de referencia de 70.000 € (estudio) a 2.500.000 € (villa), ±15 % por anuncio.
El mercado sube de media un 0,08 % por semana con altibajos. Gastos: 0,015 % del valor por semana.
Alquiler: 50 % de probabilidad semanal de encontrar inquilino; 20 % de impuesto sobre el alquiler.
Vender cuesta un 5 % de comisión.

**Coches:** de 14.000 € (utilitario: +5 felicidad, +1 reputación) a 280.000 € (superdeportivo: +18,
+8). Pierden un 0,3 % por semana y cuestan un 0,05 % de mantenimiento.

**Clubes:** valor = 250.000 € × e^((fuerza − 45) / 6) (un club de 5ª vale unos 200.000 €; uno de
1ª, decenas de millones). Caja inicial: 10 % del valor. Ingresos semanales 0,5 % del valor (entradas
baratas −5 % y +1 reputación/semana; caras +8 % y −1 reputación/semana). Gastos 0,48 % + inversión
(media 0,2 %: +0,05 fuerza/semana; alta 0,5 %: +0,12). Si eres dueño del club en el que juegas: +3 en
la selección.

**Patrimonio** = tu dinero + cajas y valor de negocios + valor de casas y coches + cajas y valor de clubes.
Tu dinero y las cajas de negocios y clubes están **separados**; solo se mueven con los botones de traspaso.

## 4. Pruebas realmente ejecutadas (Chromium sin pantalla, Linux)

60 de 60 comprobaciones superadas con `node tests/p1.test.cjs` (unos 10 minutos), emulando un iPhone 13 con toques:
1. Presentación, diario, misión, 4 barras, botón «+ Semana», plan que se repite, las 6 hojas, botones
   de ≥ 44 px, sin desplazamiento horizontal a 320/375/390 px, euros, sin errores ni peticiones externas.
2. **Una vida jugada con toques**: ojeador, dos ofertas españolas distintas, partidos en el diario con
   resultado y nota, mejora de contrato, dos fines de temporada, imprevistos con efecto, 19 años al
   acabar la segunda temporada. Después (con dinero añadido para no jugar 100 semanas más): compra y
   gestión de la peluquería, desbloqueo de la cafetería, piso en alquiler que encuentra inquilino,
   coche, compra del club del barrio con inversión alta que sube su fuerza, relaciones y actividades;
   tu dinero y las cajas no se mezclan; patrimonio, logros, guardado y reinicio.
3. **Reglas**: mundo, calendario, determinismo, ascenso con prima, felicidad en la nota (+0,9 entre
   felicidad 95 y 5), relaciones, actividades, cadena de negocios, vivienda (−60 % de gastos),
   revalorización, coches, clubes, **los 44 imprevistos con sus 77 opciones**, préstamo,
   representante, lesiones y negociación.
4. **Vidas completas** (3 estrategias × 3 vidas, hasta 300 semanas; todas llegan a 100.000 €):
   - «Crecer» (entrenamiento extra, buscar categoría): 100.000 € en la semana ~80, millón ~123, nivel ~92.
   - «Empresario» (los 4 negocios bien gestionados): 100.000 € ~115, millón ~171, fama de negocio ~99.
   - «Rentista» (patrocinios, casas en alquiler): 100.000 € ~138, millón ~210.
   Ninguna gana en todo.

**No se ha probado:** Safari en Mac ni iPhone real.

## 5. Pendientes y simplificaciones

- Sin hipotecas ni mejoras de vivienda; los inmuebles se pagan al contado.
- Sin hijos, estudios, jubilación ni muerte del personaje.
- Las divisiones tienen 10 equipos para que una temporada dure 18 semanas.
- Equilibrio por revisar tras jugarlo: precios de negocios y clubes, frecuencia de imprevistos
  (`club.probSuceso`), efecto de la felicidad.
