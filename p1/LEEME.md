# P1 — Del barrio al negocio (versión 0.7, 6 de octubre de 2026)

**Simulador de vida** de un deportista (**fútbol** o **escalada**), en vertical y pensado para iPhone, al estilo de los juegos
tipo BitLife: un diario de tu vida, barras de estado, un botón grande para avanzar el tiempo, menús
de Carrera, Bienes, Relaciones y Actividades, y ventanas emergentes con decisiones e imprevistos.
No es un simulador deportivo: partidos y competiciones se simulan con reglas que el juego explica.

- Juego: `p1/carrera_p1.html` (un único archivo, sin conexión a Internet)
- Pruebas automáticas: `tests/p1.test.cjs` (solo para quien programa)
- Sin anuncios, compras, cuentas de usuario ni servicios de IA externos.
- Fútbol: clubes, ciudades y estadios **ficticios**. Escalada: **zonas, grados y competiciones reales**;
  marcas y rivales ficticios. Los importes están en euros pero son **de juego y
  provisionales**: no son precios ni salarios reales. Todo se ajusta en **1. CONFIGURACIÓN**.

**Novedades de la versión 0.7: escalada**
- Al empezar eliges **deporte** (fútbol o escalada) y, en escalada, tu **punto fuerte** (bloque,
  dificultad o velocidad). La vida, los negocios, las casas, la familia y el modo pruebas son comunes;
  la carrera, las pantallas, los logros y los imprevistos son propios de cada deporte.
- Empiezas con **14 años en el rocódromo del barrio**. Escalando con los amigos el entrenador se fija en
  ti y te ofrece un equipo: **club del barrio** (barato), **centro de tecnificación** (mejor y más caro,
  lejos de casa) o **por libre**. Hasta los 18 tu familia paga cuota, bono, licencia, entrenamiento,
  material, viajes a la roca y competiciones en España; tú puedes ganar algo ayudando en el rocódromo.
- **5 cualidades**: fuerza de dedos, resistencia, técnica, cabeza (miedo y presión) y explosividad.
  Cada modalidad las pesa distinto (bloque, dificultad, velocidad y la combinada olímpica).
- **Plan semanal de escalador**: bloque en el rocódromo, tabla multipresa (prohibida antes de los 16:
  los dedos aún crecen), vías largas, técnica con entrenador, muro de velocidad, proyectar en roca,
  descanso activo, fisio, trabajar de monitor, equipar bloques y grabar contenido para redes.
- **Piel y carga en los dedos**: entrenar duro gasta piel y carga los tendones. Con la carga alta llegan
  las lesiones típicas: polea A2, hombro, codo o tobillo, con semanas de baja y pérdida de fuerza.
- **Roca**: eliges tipo (vía o bloque), **zona real** (Siurana, Margalef, Rodellar, Chulilla, El Chorro,
  Montserrat, Albarracín, La Pedriza y, de viaje, Fontainebleau, Céüse, Frankenjura, Magic Wood, Kalymnos,
  Flatanger, Rocklands y Yosemite) y dificultad (asequible, proyecto o «de tu vida»). Cada zona tiene sus
  meses buenos (Siurana en invierno, Céüse en verano…) y su coste de viaje. Encadenar grados nuevos da
  fama, seguidores y primas; algunas vías tienen nombre propio (La Rambla, Action Directe, Silence…).
- **Grados reales**: escala francesa en vías (de 5 a 9c) y de Fontainebleau en bloque (de 4 a 9A).
- **Competiciones** con calendario anual: liga autonómica, Copa y Campeonato de España (categorías
  sub-16, sub-18 y sub-20 hasta los 19 años), Copa de Europa, Copa del Mundo, Mundial (años impares),
  Europeo (años pares) y **Juegos Olímpicos** (Los Ángeles 2028, Brisbane 2032…) con clasificatorio.
  Resultado con tops y zonas en bloque, presa alcanzada en dificultad y tiempo en velocidad, explicado
  con tu nivel, energía, felicidad, cabeza y presión frente al nivel de los rivales.
- **Equipo nacional**: si haces podio en España o un buen puesto en Copa del Mundo, la federación te
  convoca para el año siguiente (beca, viajes pagados, competiciones internacionales).
- **Patrocinadores**: 13 marcas en 5 categorías (local, bebida, pies de gato, material y ropa), una
  por categoría a la vez. Te llaman cuando tu fama sube: de la tienda de montaña del barrio (material)
  a La Sportiva, The North Face o **Red Bull** (de 30.000 a 50.000 € al año, solo para estrellas con una
  final de Copa del Mundo, un 9a o una medalla). Puedes elegir dinero fijo o menos fijo con primas por
  podio y por encadenar 8b o más. Se renuevan solos si sigues cumpliendo lo que pide la marca.
  Marcas reales usadas como ambientación: los importes son de juego, no contratos reales.
- **Premios**: competiciones nacionales 500, 300 y 200 €; Copa del Mundo 8.000, 7.000 y 5.000 €.
- **Másters internacionales** en rocódromos (Stuttgart, Arco, Ginebra): solo por invitación (fama 65,
  un top 16 en Copa del Mundo o nivel muy alto), con viaje pagado y 4.000 € para quien gana.
- **Beca del Estado**: si llegas a una final de Copa del Mundo, Mundial o Juegos (las 8 mejores),
  1.400 € al mes durante ese año y el siguiente, pero solo para gastos de escalada (entrenamiento,
  cuotas, material, viajes y competiciones); lo que no gastes al acabar el año se pierde.
- **Seguidores** y colaboraciones en redes. La fama se apaga si no das que hablar.
- **Retirada** desde los 28 años; desde los 34 se pierde nivel cada semana.
- **4 negocios de escalada** (también para futbolistas): escuela de escalada, tienda de material,
  rocódromo de bloque y marca de presas, cada uno con sus propias decisiones. **Furgoneta camper**.
- **17 imprevistos de escalada**: presa que se gira, flapper, pinchazo en el dedo, condiciones
  perfectas, cierre de un sector por nidificación de aves, línea sin escalar (primera ascensión),
  expedición, concentración con la selección, polémica por un grado, control antidopaje…

**Novedades de la versión 0.6**
- **Cada negocio tiene sus propias decisiones**, en su ficha (Bienes → el negocio):
  - **⚙️ Cómo funciona**: 2–3 opciones de gestión que puedes cambiar cuando quieras (horario, tipo de
    clientela, carta, cuotas…). Cada opción muestra qué cambia: clientes, precio, costes, capacidad,
    gastos fijos o fama por semana.
  - **🔨 Mejoras**: 3–4 inversiones permanentes pagadas con la caja del negocio (terraza, cocina,
    piscina, autocobro…). La mitad de lo invertido suma al valor del negocio.
  - **📣 Acciones**: 3 acciones puntuales con tiempo de espera (campañas, ofertas, eventos, críticos,
    banquetes…). Algunas duran unas semanas; otras son una apuesta (pueden salir bien o mal).
- Ninguna es siempre buena: una mejora que solo trae más clientes no sirve si el local ya está lleno
  (antes hace falta más personal o capacidad), y lo que sube el precio suele bajar la clientela.

**Novedades de la versión 0.5**
- **10 pantallas**: el juego avanza por niveles. Cada pantalla tiene 1–3 objetivos claros (barra
  amarilla arriba; tócala para ver el mapa). Al cumplirlos aparece «¡Pantalla superada!», cobras un
  premio y se **desbloquea** lo siguiente (coches, negocios, inmobiliaria, hijos, clubes…).
- **9 negocios realistas**: peluquería, cafetería, lavandería, academia de fútbol, tienda de deportes,
  restaurante, gimnasio, supermercado y hotel. Cada uno con su alquiler, gastos fijos, sueldos con
  Seguridad Social y coste de lo que vende; ganan lo que ganaría un negocio así y tardan años en
  recuperar la inversión.
- **Hipotecas**: entrada del 20 %, plazo de 10, 20 o 30 años, cuota calculada con el interés, el banco
  solo te la da si la cuota cabe en el 40 % de tus ingresos; se puede amortizar; el euríbor sube y baja.
- **Hijos**: con pareja estable puedes tener hasta 4; embarazo, nacimiento, gastos por edad, colegio
  público o privado, imprevistos de hijos.
- **Retirada**: a partir de los 31 años pierdes nivel cada semana; puedes retirarte desde los 30 (con
  partido de homenaje si tienes fama) y a los 40, o si nadie te ficha, te retiras sí o sí. Después
  sigues jugando tu vida: negocios, tele, cantera, familia… y el mundo del fútbol sigue.

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
- **44 imprevistos** distintos (51 en la versión 0.5) que afectan a varias cosas a la vez: dinero, felicidad, energía,
  reputación, nivel, relaciones, selección, negocios, casas y clubes.
- **Bienes**:
  - **Negocios** con su caja, personal, sueldos y precios (en la 0.5 son 9 y se desbloquean por pantallas).
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

### Modo pruebas
En **⚙️ Partida** (botón de la cabecera) hay atajos para probar sin jugar semanas y semanas: añadir
10.000 / 100.000 / 1.000.000 € a tu dinero, 50.000 € a la caja de cada negocio, energía y felicidad al
máximo, +10 de nivel y reputación, saltar a la pantalla siguiente o desbloquearlo todo, y avanzar 5
semanas o una temporada entera (se para si aparece una decisión). Todo queda anotado en el diario con 🧪.

## 2. Cómo se juega

1. Mira la **misión** (arriba) y tus **barras** (abajo).
2. Elige tu **plan semanal** en Carrera (se repite solo) y, si quieres, hasta 2 **actividades** y una
   interacción por persona en **Relaciones**. En **Bienes** compras y gestionas negocios, casas,
   coches y clubes.
3. Pulsa **+ Semana**.
4. Lee el **diario** y decide en las **ventanas emergentes** que aparezcan.

## 3. Las 10 pantallas

| # | Pantalla | Objetivos | Premio | Desbloquea |
|---|---|---|---|---|
| 1 | 🏘️ El barrio | Reputación 25 (que te vea un ojeador) | +5 felicidad | Las pruebas |
| 2 | 📋 Las pruebas | Firmar tu primer contrato | 300 € | Tu carrera |
| 3 | ⚽ Semiprofesional | 10 partidos · nota media ≥ 6 · ahorrar 3.000 € | 500 € | Coches |
| 4 | 📈 A por el ascenso | Jugar en 3ª categoría o más (o ascender) · mejora o renovación de contrato · ahorrar 25.000 € | 2.000 € | Peluquería y cafetería |
| 5 | 💈 Primer negocio | Comprar un negocio · 60.000 € de patrimonio | 5.000 € | Inmobiliaria e hipotecas, lavandería, academia |
| 6 | 🏠 Casa propia | Vivir en una casa tuya · tener pareja · 2 negocios | 10.000 € | Tienda, restaurante e hijos |
| 7 | 🌍 La élite | Jugar en 1ª/2ª categoría (o 3 negocios) · 300.000 € de patrimonio | 25.000 € | Gimnasio y supermercado |
| 8 | 👨‍👩‍👧 Familia y empresa | Tener un hijo · 4 negocios · una propiedad alquilada | 50.000 € | Hotel y clubes de fútbol |
| 9 | 👴 Colgar las botas | Retirarte del fútbol · 1.000.000 € de patrimonio | 100.000 € | La última pantalla |
| 10 | 🏆 Leyenda | Comprar un club · 6 negocios · 5.000.000 € de patrimonio | +20 felicidad | ¡Juego completado! |

En vidas simuladas, las pantallas 1–8 se superan entre los 17 y los 25 años, la 9 al retirarse
(31–35 años) y la 10 entre los 39 y los 45.

## 3b. Las 10 pantallas de la escalada

| # | Pantalla | Objetivos | Desbloquea |
|---|---|---|---|
| 1 | El rocódromo del barrio | Escalar 6b en el rocódromo · entrar en un equipo | Las competiciones |
| 2 | El equipo de competición | Competir en 3 pruebas · 7a (o 6C de bloque) en roca | Nuevos retos |
| 3 | Campeonato de España | Top 10 en España · 7c (o 7B) en roca · ahorrar 1.500 € | Coches y furgoneta |
| 4 | Primer patrocinador | Patrocinador · podio en España o 8a en roca (premio 5.000 €) | Escuela de escalada |
| 5 | Profesional | Equipo nacional o 8b en roca · primer negocio | Peluquería, cafetería, tienda de escalada |
| 6 | Copa del Mundo | Competir en una · semifinal, 8b+ o 2 negocios · 80.000 € | Inmobiliaria, rocódromo, lavandería, academia |
| 7 | Élite mundial | Final, 8c o 3 negocios · casa propia · pareja | Hijos, tienda de deportes, restaurante |
| 8 | Sueño olímpico | Juegos, 9a o 4 negocios · 300.000 € | Marca de presas, gimnasio, supermercado |
| 9 | Leyenda de la roca | Retirarte · medalla, primera ascensión, 9a+ o 6 negocios · 1.000.000 € | Hotel |
| 10 | Vida después | Rocódromo propio · 6 negocios · 3.000.000 € | ¡Fin del juego! |

Siempre hay un camino de negocios por si tu techo no da para la élite mundial.

**Dinero en la escalada (importes de juego; un año de juego son 18 semanas):** patrocinadores de 0
(material) a 50.000 €/año cada uno (Red Bull), que se cobran repartidos por semanas; beca del Estado
1.400 €/mes (solo para escalada); ayuda del equipo nacional 120 €/semana; monitor 150 €/semana;
equipador 260 €/semana; premios: autonómico 100/60/40 €, Copa y Campeonato de España 500/300/200 €,
Copa de Europa 800/500/300 €, máster 4.000/2.500/1.500 €, Copa del Mundo 8.000/7.000/5.000 € (del 4º al
8º, de 3.000 a 1.000 €), Europeo 6.000/4.000/3.000 €, Mundial 10.000/8.000/6.000 €; medalla olímpica:
premio del Consejo Superior de Deportes de 94.000, 48.000 o 30.000 €; colaboraciones en redes 2,5 € por cada
1.000 seguidores a partir de 10.000. Gastos: licencia 90 €/año, cuota del equipo (0–45 €/semana), pies
de gato cada 8 semanas de entreno (130 €, gratis con patrocinador), viajes a la roca (40–1.600 €/semana),
inscripción y viaje a competiciones (gratis con el equipo nacional), y vida (con tu familia hasta los 23,
piso compartido hasta los 27, o furgoneta).

**Competir:** puntuación = tu nivel en la modalidad + (energía − 60)/8 + (felicidad − 50)/25 + (cabeza − 50)/10
× presión del evento − piel abierta + suerte (± 4; en velocidad hay un 8 % de resbalón). Tu puesto sale
de comparar esa puntuación con el nivel medio de los rivales (por ejemplo, 52 ± 9 entre 60 en la Copa
de España; 72 ± 6 entre 100 en la Copa del Mundo).

**Roca:** avance semanal = (18 + (tu nivel − nivel del grado) × 5) × condiciones (buenas 1,25, regulares
0,85, malas 0,45) × piel × cabeza. Al llegar al 100 % encadenas.

## 4. Negocios (importes semanales de juego)

| Negocio | Traspaso | Alquiler + fijos | Sueldo (con S. S.) | Coste de lo vendido | Precio normal | Gana aprox.* | Se amortiza* |
|---|---|---|---|---|---|---|---|
| 💈 Peluquería | 30.000 € | 250 + 150 € | 370 € (50 clientes) | 1,5 €/cliente | 16 € | ~310 €/sem | ~2 años |
| ☕ Cafetería | 60.000 € | 450 + 350 € | 400 € (300 consumiciones) | 1 € | 3,5 € | ~550 €/sem | ~2 años |
| 🧺 Lavandería | 90.000 € | 350 + 300 € | 380 € (1 encargado) | 1,2 €/lavado | 6 € | ~675 €/sem | ~2,5 años |
| 🥅 Academia de fútbol | 120.000 € | 700 + 300 € | 300 € (40 alumnos) | 1,5 € | 20 €/sem | 750–2.000 €/sem (depende mucho de tu fama) | 1–3 años |
| 👟 Tienda de deportes | 180.000 € | 1.200 + 400 € | 400 € (140 ventas) | 80 % de lo vendido | 45 € | ~980 €/sem | ~3,5 años |
| 🍽️ Restaurante | 300.000 € | 900 + 2.400 € | 450 € (65 comensales) | 32 % de lo vendido | 24 € | ~1.500 €/sem | ~4 años |
| 🏋️ Gimnasio | 450.000 € | 2.800 + 3.500 € | 420 € (280 socios) | 0,8 €/socio | 9 €/sem | ~2.000 €/sem | ~4,5 años |
| 🛒 Supermercado | 650.000 € | 2.500 + 2.000 € | 400 € (300 compras) | 80 % de lo vendido | 28 € | ~3.200 €/sem | ~4 años |
| 🏨 Hotel con encanto | 1.500.000 € | 0 + 3.500 € (edificio propio) | 430 € (35 noches) | 15 €/noche | 80 € | ~3.600 €/sem | ~8 años |
| 🧗 Escuela de escalada | 22.000 € | 200 + 200 € | 420 € (14 alumnos por guía) | 5 €/alumno | 50 € | ~440 €/sem (depende mucho de tu fama) | ~1 año |
| 🎒 Tienda de material de escalada | 90.000 € | 700 + 250 € | 400 € (120 ventas) | 66 % de lo vendido | 60 € | ~1.070 €/sem | ~1,5 años |
| 🧱 Rocódromo de bloque | 400.000 € | 3.500 + 2.600 € | 400 € (250 entradas) | 0,5 €/entrada | 10 € | ~3.200 €/sem | ~2,5 años |
| 🧩 Marca de presas | 450.000 € | 1.200 + 900 € | 450 € (60 juegos) | 45 % de lo vendido | 90 € | ~2.900 €/sem | ~3 años |

\* Con fama 50, reputación 50, precios normales y la plantilla justa (52 semanas = 1 año real).
Al comprarlo heredas la plantilla del dueño anterior. Demanda = base × precio × (0,2 + fama/80)
× (1 + tu reputación × sensibilidad) × cursos ± 10 %. La academia es la que más depende de tu fama.

### Decisiones de cada negocio

| Negocio | Cómo funciona (opciones) | Mejoras (coste) | Acciones |
|---|---|---|---|
| 💈 Peluquería | Reservas (Sin cita / Solo con cita); Horario (Normal / Abrir sábados tarde) | Reformar el local (8000 €); Lavacabezas con masaje (3000 €); Vender champús y ceras (2000 €); Zona de barbería (6000 €) | Campaña en redes; Martes de descuento; Curso de tendencias para el equipo |
| ☕ Cafetería | Horario (Solo mañanas / Mañana y tarde / Hasta medianoche); Café (Normal / De especialidad) | Terraza (con licencia) (4000 €); Cafetera profesional (5000 €); Cocina para tapas y bocadillos (12.000 €) | Poner el fútbol en la tele; Oferta de desayuno; Noche de música en directo |
| 🧺 Lavandería autoservicio | Horario (De 8 a 22 / 24 horas); Detergente (Normal / Ecológico) | Más lavadoras industriales (15.000 €); Secadoras de bajo consumo (8000 €); Pago con app y monedero (3000 €); Recogida a domicilio (5000 €) | Buzoneo de folletos; Tarjeta de fidelidad; Convenio con hoteles y gimnasios |
| 🥅 Academia de fútbol | Enfoque (Diversión / Competición); Grupos (De 20 niños / De 12 niños) | Césped artificial nuevo (25.000 €); Escuela de porteros (6000 €); Análisis de vídeo (4000 €) | Campus de verano; Organizar un torneo; Entrenar tú unas semanas |
| 👟 Tienda de deportes | Surtido (Básico / Equilibrado / Premium); Camisetas con tu nombre (No / Sí) | Tienda online (15.000 €); Zona para probar zapatillas (6000 €); Acuerdo con una gran marca (20.000 €) | Rebajas; Firma de autógrafos; Escaparate nuevo |
| 🍽️ Restaurante | Oferta (Menú del día / Carta / Degustación); Jefe de cocina (Cocinero de siempre / Chef reconocido); Comida a domicilio (No / Sí (plataformas)) | Cocina renovada (20.000 €); Terraza (8000 €); Bodega de vinos (10.000 €) | Invitar a un crítico gastronómico; Jornadas gastronómicas; Aceptar un banquete de boda |
| 🏋️ Gimnasio | Horario (De 6 a 23 / 24 horas); Clases dirigidas (Pocas / Muchas); Cuota (Sin permanencia / Con permanencia) | Piscina (120.000 €); Zona de spa (40.000 €); Renovar las máquinas (30.000 €) | Campaña «Año nuevo, vida nueva»; Clase magistral contigo; Convenio con empresas |
| 🛒 Supermercado | Productos (Marcas conocidas / Mucha marca blanca); Pedidos a domicilio (No / Sí) | Cajas de autocobro (25.000 €); Sección de frescos (40.000 €); Aparcamiento (50.000 €) | Folleto de ofertas; Renegociar con proveedores; Degustación de productos locales |
| 🏨 Hotel con encanto | Venta de habitaciones (Solo web propia / Plataformas de reservas); Tarifas (Fijas / Según la demanda) | Ampliar con 6 habitaciones (250.000 €); Restaurante propio (80.000 €); Spa (120.000 €) | Invitar a influencers; Acoger un congreso; Paquete «escapada romántica» |

| 🧗 Escuela de escalada | Tamaño de los grupos (Grupos de 8 / Grupos de 4); Dónde se dan los cursos (En roca / En rocódromo) | Furgoneta de 9 plazas (9000 €); Material nuevo (cuerdas, arneses, cascos) (3000 €); Web con reservas (1500 €); Guías con el título de Técnico Deportivo (4000 €) | Campamento de verano; Curso impartido por ti; Jornada para una empresa |
| 🎒 Tienda de material de escalada | Alquiler de material (No / Sí (pies de gato, crash pads)); Surtido (Básico / Completo / Técnico y de alta montaña) | Murito para probar pies de gato (4000 €); Taller de resolado (6000 €); Tienda online (10.000 €) | Stand en un festival de escalada; Rebajas de fin de temporada; Charla y firma tuya en la tienda |
| 🧱 Rocódromo de bloque | Cómo se paga (Entrada suelta / Abonos mensuales); Cambio de bloques (Cada mes / Cada semana / Cada tres meses); Horario (De 10 a 23 / Desde las 7) | Zona de entrenamiento (tablas y paneles) (25.000 €); Muro de velocidad homologado (60.000 €); Cafetería y zona de trabajo (30.000 €); Ampliar la nave (120.000 €) | Liga interna de bloque; Cumpleaños infantiles; Jornada de puertas abiertas |
| 🧩 Marca de presas | Material (Poliuretano / Madera y volúmenes de fibra); A quién vendes (Rocódromos / También competiciones) | Nueva colección de moldes (30.000 €); Taller de curado más grande (50.000 €); Distribuidor en Europa (40.000 €) | Colección firmada por ti; Feria de la industria; Oferta a rocódromos nuevos |

Demanda final = la de arriba × el efecto de tus opciones, mejoras y acciones activas (en la ficha se
explica la cuenta en «¿Por qué?»).

## 5. Hipotecas, hijos y retirada

Un «año de juego» es una temporada: 18 semanas (edades, plazos e intereses van en años de juego).
- **Hipoteca**: entrada 20 % + 10 % de impuestos y notaría (también al contado). Interés 3,5 % anual
  (el euríbor puede subirlo o bajarlo medio punto). Cuota = deuda × r / (1 − (1 + r)^−semanas), con
  r = interés / 18. El banco exige que todas tus cuotas quepan en el 40 % de tus ingresos medios de las
  últimas semanas. Amortizar 10.000 € baja la cuota. Al vender, se cancela lo que quede.
- **Hijos**: con pareja (relación ≥ 60), desde los 20 años y con la pantalla 7. Embarazo de 14 semanas;
  cuestan 150 €/semana hasta los 5 años y 220 € hasta los 17 (+150 € con colegio privado). Si os
  lleváis bien, +5 de felicidad cada uno (hasta 2); si la relación baja de 30, −5.
- **Retirada**: desde los 31 años pierdes 0,15 de nivel por semana (0,35 desde los 34). Puedes
  retirarte desde los 30 en «Carrera»; desde los 36 tu club ya no renueva, desde los 37 nadie te
  ofrece contrato y a los 40 te retiras sí o sí. Con reputación ≥ 50 tienes partido de homenaje
  (reputación × 100 €). Retirado eliges plan: tus negocios (+3 fama), comentarista de TV (reputación
  × 30 € y mantienes la fama), entrenar en una cantera (350 €), familia (+3 en todas las relaciones)
  o vivir de las rentas. Tu reputación baja 1 cada 6 semanas salvo en la tele.

## 6. Reglas principales

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

## 7. Pruebas realmente ejecutadas (Chromium sin pantalla, Linux)

105 de 105 comprobaciones superadas con `node tests/p1.test.cjs` (unos 10 minutos), emulando un iPhone 13 con toques:
1. Presentación, diario, barra de pantalla, 4 barras, botón «+ Semana», plan que se repite, las 7 hojas,
   botones de ≥ 44 px, sin desplazamiento horizontal a 320/375/390 px, euros, sin errores ni peticiones externas.
2. **Una vida jugada con toques**: ojeador, ofertas, partidos, mejora, dos temporadas, imprevistos,
   pantallas superadas con su ventana. Después (con dinero añadido y en la pantalla 8): peluquería y su
   gestión, bloqueo del hotel hasta la pantalla 9, casa al contado (+10 % de gastos), alquiler, coche,
   club del barrio con inversión, relaciones y actividades, mapa de pantallas, cuentas separadas,
   patrimonio con hipotecas, guardado y reinicio.
3. **Reglas**: mundo, calendario, determinismo, ascenso, felicidad, relaciones, actividades,
   **desbloqueo de negocios por pantallas**, **realismo de los 13 negocios** (todos ganan dinero y se
   amortizan en 1–10 años), pantalla 1 con premio, **hipoteca** (el banco la niega con pocos ingresos,
   entrada + gastos, la cuota baja la deuda, amortizar baja la cuota, fórmula de la cuota), **hijos**
   (embarazo, nacimiento, gastos), **retirada** (desde los 30, sin sueldo, el mundo sigue, cumpleaños;
   declive a los 34; retirada obligatoria a los 40), **los 51 imprevistos con sus 89 opciones**,
   préstamo, representante, lesiones y negociación.
3b. **Decisiones de negocio**: los 13 negocios tienen decisiones propias y distintas (≥ 2 opciones,
   ≥ 3 mejoras, ≥ 3 acciones); las mejoras se pagan una vez con la caja y cambian demanda o capacidad;
   las opciones cambian los resultados; las acciones tienen espera y sus efectos caducan; todas se
   ejecutan sin errores durante 10 semanas; y con toques en la ficha.
4. Vidas completas con tres estrategias (todas llegan a 100.000 € y ninguna gana en todo).
6. **Escalada**: presentación con deporte y punto fuerte (con toques), rocódromo con 14 años, oferta de
   equipo, licencia pagada por la familia, tabla bloqueada antes de los 16, elegir zona y competiciones
   con toques, sin desplazamiento horizontal; grados reales; calendario (Mundial impar, Europeo par,
   Juegos 2028); requisitos (edad, equipo nacional, plaza olímpica); más nivel = mejor puesto; marca
   de bloque y velocidad; condiciones por meses; encadenar en roca; lesiones por carga; patrocinios;
   fin de año y equipo nacional; gastos según la edad; retirada desde los 28; pantallas y desbloqueos
   propios; logros propios; los 17 imprevistos de escalada (33 opciones); sin imprevistos de fútbol;
   y tres vidas simuladas hasta los 34 años (todas pasan la pantalla 5 antes de los 30).

Además, tres vidas simuladas hasta los 66 años superan las 10 pantallas sin errores.

**No se ha probado:** Safari en Mac ni iPhone real.

## 8. Pendientes y simplificaciones

- Sin reformas de vivienda, estudios de los hijos ni muerte del personaje.
- Las divisiones tienen 10 equipos para que una temporada dure 18 semanas.
- Escalada: el calendario se repite cada año (sedes reales habituales, simplificado a 3 pruebas de Copa
  del Mundo por modalidad); el formato olímpico es el de París 2024 (bloque y dificultad combinados, y
  velocidad); no hay categorías por sexo; la escalada en roca no distingue entre a vista, flash y
  ensayada.
- Equilibrio por revisar tras jugarlo: precios de negocios y clubes, frecuencia de imprevistos
  (`club.probSuceso`), efecto de la felicidad.
