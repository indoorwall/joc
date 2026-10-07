# P1 — Del barrio al negocio (versión 0.10, 7 de octubre de 2026)

**Simulador de vida** de un deportista (**fútbol** o **escalada**), en vertical y pensado para iPhone,
con formato de juego: cada semana eliges qué haces por la mañana, la tarde y la noche, pulsas
**Jugar semana** y ves el resultado. Pestañas Inicio, Carrera, Empresa y Vida, y ventanas con
decisiones e imprevistos.
No es un simulador deportivo: partidos y competiciones se simulan con reglas que el juego explica.

- Juego: `p1/carrera_p1.html` (un único archivo, sin conexión a Internet)
- Pruebas automáticas: `tests/p1.test.cjs` (solo para quien programa)
- Sin anuncios, compras, cuentas de usuario ni servicios de IA externos.
- Fútbol: clubes, ciudades y estadios **ficticios**. Escalada: **zonas, grados y competiciones reales**;
  rivales ficticios y **marcas inventadas que se parecen a las de verdad** (Red Toro, Adibas, The South Face…). Los importes están en euros pero son **de juego y
  provisionales**: no son precios ni salarios reales. Todo se ajusta en **1. CONFIGURACIÓN**.

**Novedades de la versión 0.10: para que enganche**
- **Momentos clave**: en algunos partidos igualados (más en los grandes y al final de la liga) llega la
  jugada decisiva del minuto 80-90: tirar colocado, reventarla o pasar (si empatáis o perdéis por uno)
  o falta táctica, cruce o repliegue (si ganáis por uno). En escalada, el último bloque o los últimos
  movimientos de una final si vas 2º, 3º o 4º. Cada opción dice su probabilidad (nivel, energía, ánimo,
  cabeza, técnica) y cambia de verdad el marcador, la clasificación, tus goles y primas, o tu puesto,
  podio y premio.
- **Retos**: tres retos cortos que cambian cada 3 semanas, propios de tu deporte y tu etapa (marca un
  gol, gana dos partidos, compite, ve a la roca, ahorra, pasa tiempo con tu familia…). Premio según lo
  que ganas cada semana y extra de ánimo y fama si cumples los tres. Se ven en una fila del inicio.
- **Personajes que vuelven**: un **rival** de tu edad que te pica en el barrio, ficha por un club mejor,
  se cruza contigo en la liga o en las competiciones (duelos), puede lesionarse y te escribe al
  retirarte (y puede acabar siendo tu amigo); tu **mentor** (Paco, el míster del barrio, o Lola, la
  entrenadora del rocódromo) y una **periodista** (Marta Ríos, de Radio Patio) con entrevistas, la tele
  y una «exclusiva». Su historia va por capítulos y se ve en Vida.
- **Salón de la fama**: cada vida terminada se guarda con su puntuación (patrimonio, pantallas y logros).
- **Siguiente generación**: de retirado, si tienes un hijo o hija de 14 años o más, sigues jugando con
  él o ella: hereda el 5 % de tu patrimonio (hasta 20.000 €) y parte de tu fama.
- **Sonido** (se apaga en ⚙️): gol, ovación, logros, compras y cartas del banco, generados en el juego.
- **Temporadas del año**: Nochebuena, Lotería de Navidad, Reyes, vacaciones en el pueblo, ola de calor y
  Halloween; gorro de Papá Noel y jersey navideño solo en diciembre.
- **Tarjeta de temporada** al acabar cada temporada o año, para hacer captura y compartirla.
- Menos imprevistos al azar (35 % de las semanas) para dejar sitio a la historia.

**Novedades de la versión 0.10: arreglos tras el análisis de juego**
- **Escalada**: las pantallas 2 y 3 se pueden pasar compitiendo o yendo a la roca (antes la roca era
  obligatoria y quien solo competía se quedaba atascado para siempre). Retirada obligatoria a los 40.
- **Negocios y clubes**: si la caja sigue en negativo 6 semanas, **concurso**: cierran y se liquidan
  por el 50 % de su valor; la deuda que quede la pagas tú. Aviso cuando un negocio pierde dinero 3
  semanas seguidas y **gerente** opcional (7 % de los ingresos, mínimo 120 €/semana) que ajusta la
  plantilla a la demanda y no usa precios que hunden la fama.
- **Imprevistos**: las opciones que no puedes pagar se desactivan.
- **Banco**: de menor, la deuda la pagan tus padres (y se enfadan); por debajo de 500 € solo cobra una
  comisión de 15 € por semana, sin embargo ni quiebra.
- **Copia de seguridad** (en ⚙️): copiar tu partida en un código y cargarla después; aviso de que
  Safari en iPhone puede borrar los datos tras 7 días sin abrir la web.
- **Menos ventanas**: un compromiso de patrocinador cada 5 semanas como mucho (y 4 tipos nuevos:
  pódcast, visita a un colegio, sorteo con fans y cena con los jefes); las invitaciones a másters ya
  no abren ventana: te apuntan y puedes cancelarlo en Carrera.
- **Ritmo**: el ánimo ya no baja cada semana al empezar; el ojeador llega con reputación 40 (unas 5
  semanas de barrio); en fútbol las marcas esperan a verte 4 semanas en el club y 3 partidos.
- **Pantallas de vida con alternativa**: pareja **o** tu propio coche; hijo **o** 2 propiedades.
- **De retirado**: embajador de marcas (cobras según tu fama) y escribir tu biografía (6 semanas;
  se publica, da dinero, fama y un logro).
- **Interfaz**: la tienda del personaje muestra todas las pestañas en dos filas; los logos de la escena
  y «Ver el parte completo» se tocan bien (44 px); en escalada los 6 indicadores ya caben en pantallas de
  320 px (antes se salían por la derecha). Arreglado el fallo al retirarte justo al acabar una temporada.

**Novedades de la versión 0.10: marcas más realistas y sin repetirse**
- **Muchas más marcas**: 32 de fútbol en 8 categorías (local, botas, bebida, ropa, comida, tecnología,
  reloj y coche) y 25 de escalada en 7 (local, bebida, pies de gato, material, ropa, magnesio y tecnología).
- **Cada marca ficha en su nivel**. En fútbol, cada una tiene las divisiones en las que patrocina: en
  Tercera Federación solo te llaman negocios del barrio (Bar Paco, la panadería, el taller, la pizzería,
  el agua del pueblo); Yoma, Kelmi o Kapa, en Segunda Federación hacia arriba; Pumba, solo en Primera y
  Segunda; Adibas, Gatorrada, Audy o Hugo Bros, solo en Primera; Naik, Red Toro, Rolecs y Manzana, solo
  estrellas de Primera. Las marcas de barrio dejan de buscarte cuando subes mucho. En escalada, las
  medianas y grandes piden nivel (top 10 en España, equipo nacional o Copa del Mundo, o grado en roca)
  y las pequeñas dejan de buscarte cuando eres muy famoso.
- **Sin repeticiones**: nunca te ofrecen una marca que ya tienes ni la misma marca dos veces en la
  misma ventana; si rechazas una marca (o la cambias por otra) no vuelve en un año, y si rompe contigo
  o no te renueva, no vuelve en dos. La hoja de patrocinadores dice por qué cada marca no te llama.

**Novedades de la versión 0.10: números rojos y el banco**
- Si acabas una semana con dinero negativo, llega una **carta del Banco del Barrio** y tienes **una
  semana** (un turno) para volver a positivo. En «Lo próximo» se ve el aviso.
- Si sigues en números rojos: **intereses del 2 % cada semana** (mínimo 20 €) y **embargo** hasta
  cubrir la deuda, en este orden: dinero de las cajas de tus negocios y clubes, coches, casas (la tuya
  la última), negocios y clubes. Los bienes se subastan por el 70 % de lo que valen.
- Si no queda nada que embargar, el banco te ofrece **declararte en quiebra** (ley de segunda oportunidad)
  o intentar pagarlo. Si a las 4 semanas sigues debiendo, **el banco te declara en quiebra**. La quiebra
  borra la deuda, pero pierdes 15 de fama y 25 de ánimo, se van tus marcas y tu equipo, y no te dan
  hipotecas en 2 años. Así la deuda nunca crece sin fin. Logro secreto: «Quiebra… y vuelta a empezar».
- Al volver a positivo, el banco te deja en paz.

**Novedades de la versión 0.10: el dinero sirve para algo (🛒 Mejoras)**
- Se abre tocando tu dinero (arriba), desde Carrera o desde Vida. Tres tipos de gasto, en los dos deportes:
  - **Tu equipo** (se paga cada semana; si no puedes pagar, se va): entrenador personal (+15 % en lo que
    mejoras entrenando), fisio (−30 % de lesiones y +3 de energía por semana), nutricionista (+4 de
    energía por semana) y psicólogo deportivo (+6 a tu felicidad). En escalada la beca del Estado los paga primero.
  - **Material y casa** (para siempre): cafetera, consola, colchón, sofá, bañera de hielo; en fútbol,
    botas de gama alta, portería en el jardín y gimnasio en casa; en escalada, multipresa, crash pads,
    plafón en casa y **furgoneta camperizada** (viajes a la roca a mitad de precio).
  - **Caprichos** (se gastan y hay que esperar para repetir): masaje, cena de lujo, día de spa, fiesta
    en casa y crucero por el Mediterráneo.
- Cada efecto se ve en «¿Por qué ha pasado esto?» de cada semana. Logro nuevo: tener los cuatro del equipo.

**Novedades de la versión 0.10: toques de humor**
- **15 imprevistos graciosos** en los dos deportes: una paloma que te «elige», el jersey de la abuela,
  karaoke (50 % ovación, 50 % ridículo), el GPS que te mete por un camino de cabras, un gato okupa, ser
  meme, el vecino del taladro, un concurso de la tele, tu doble; en fútbol, el balón en el tejado de la
  señora Pepa, el duelo de baile con la mascota del club y el árbitro que fue tu profe de mates; en
  escalada, la cabra montesa que te juzga, la explosión de magnesio y la canción de los pegues.
- **Titulares de prensa graciosos** de vez en cuando (20 % de las semanas), algunos según tu aspecto
  o tus marcas: «Escándalo de moda: sale a la calle con chanclas y calcetines».
- Tu personaje **habla** en la escena (un bocadillo según cómo te va: gol, podio, sin energía, sin
  dinero, triste, feliz) y **salta** cuando celebra.
- **8 logros secretos** que no se ven hasta conseguirlos (pista en la hoja de logros).

**Novedades de la versión 0.10: tu personaje con tienda**
- Avatar **dibujado por capas** (ya no es un emoji): pelo (11 peinados), tinte, piel (6 tonos), cara
  (pecas, bigote, barba…), ropa (camiseta, la de tu equipo con sus colores, sudadera, hawaiana, traje
  de empresario, la camiseta de tu marca con su nombre…), color, pantalón, calzado, cabeza, gafas,
  extras y fondo. Se elige al empezar y se cambia cuando quieras tocando tu cara arriba (o en Vida).
- **Tienda**: casi todo cuesta dinero de juego (de 5 € el gorro de fiesta a 25.000 € las zapatillas
  de oro o 50.000 € el fondo de oro). Lo comprado es tuyo para siempre; estrenar sube +2 el ánimo.
  Algunas cosas se desbloquean con pantallas (traje en la 4), logros (corona del millonario, medalla)
  o patrocinadores, y tus marcas te **regalan** sus productos (botas, pies de gato, relojes).
- La **cara reacciona**: sonríe con el ánimo alto, se pone triste (y llora) si está bajo, ojos
  cansados sin energía y una tirita si estás lesionado. Tu personaje sale en el HUD y en la escena.

**Novedades de la versión 0.10: patrocinadores con obligaciones (fútbol y escalada)**
- Patrocinadores en los **dos deportes**, con nombres de guiño y su lema: en fútbol 32 marcas en 8
  categorías (local, botas, bebida, ropa, comida, tecnología, reloj y coche), de **Bar Paco** a **Naik**, **Red Toro** o
  **Rolecs** (solo para quien juega en primera); en escalada 25 marcas en 7 categorías, de la tienda de
  montaña del barrio a **La Esportiva**, **The South Face** o **Red Toro** (solo estrellas).
- Cada contrato tiene **obligaciones**:
  - **Compromisos** (rodaje de un anuncio, fiesta de presentación, firma de autógrafos, probar un
    prototipo, viaje de rodaje…) que te **ocupan la tarde**. Puedes cumplir (+relación), excusarte
    (−relación) o, a veces, improvisar algo (50 % viral, 50 % la marca se enfada). Las marcas grandes
    llaman más a menudo.
  - Un **objetivo de temporada** según la marca: goles, ser titular, que tu equipo acabe arriba, un
    podio, encadenar un grado en roca, llegar a X seguidores… Si lo cumples, prima del 10 % de lo que
    te pagan al año y +15 de relación; si no, −20.
  - Una **relación** con cada marca (0-100, empieza en 60): por debajo de 25 rompen el contrato, para
    renovar piden 40 y con 80 o más te suben un 10 %. Los actos de patrocinador (fútbol, +5) y el
    contenido para redes (escalada, +3) la cuidan.
- Los **logos** de tus marcas salen en la escena del inicio; al tocarlos se abre la hoja
  **💼 Patrocinadores** (también desde Carrera) con pago, relación, objetivo y próximo compromiso.
- Ofertas fijas o variables (menos fijo con primas: en fútbol por gol y por ascenso o título).
- Logros nuevos: primer patrocinador y «Te da alitas» (firmar con Red Toro).
- Las partidas guardadas antes se convierten solas (por ejemplo, Red Bull pasa a Red Toro).

**Novedades de la versión 0.9: interfaz de juego**
- Pantalla de inicio limpia, como un juego de móvil: **HUD** arriba (avatar con el número de pantalla,
  nombre, monedas y logros), la **pantalla** que tienes que superar con su barra, una **escena** del
  lugar donde estás (barrio, estadio, rocódromo o la zona de roca de tu proyecto), los **indicadores**
  (en escalada también piel y dedos) y **tu semana** con tres fichas grandes: ☀️ mañana (tu plan
  principal), 🌇 tarde y 🌙 noche (una actividad, tiempo con alguien o libres para descansar). Debajo, el
  partido o la competición del fin de semana y lo próximo.
- Botón grande **JUGAR SEMANA** siempre visible y, debajo, un resumen corto de la semana anterior
  (el parte completo está en Vida → Partes).
- Pestañas **Inicio, Carrera, Empresa y Vida**. Fondo oscuro con el color del deporte (verde fútbol,
  morado y naranja en escalada), paneles redondeados y botones con relieve.
- **Oro olímpico** en escalada: 90.000 € y beca de 60.000 € al año hasta los siguientes Juegos (si
  allí no repites el oro, la pierdes).

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
- **Patrocinadores**: 25 marcas en 7 categorías (local, bebida, pies de gato, material, ropa, magnesio y tecnología), una
  por categoría a la vez. Te llaman cuando tu fama sube: de la tienda de montaña del barrio (material)
  a La Esportiva, The South Face o **Red Toro** (de 30.000 a 50.000 € al año, solo para estrellas con una
  final de Copa del Mundo, un 9a o una medalla). Puedes elegir dinero fijo o menos fijo con primas por
  podio y por encadenar 8b o más. Tienen compromisos, objetivo y relación (ver novedades de la 0.10)
  y renuevan si sigues cumpliendo lo que pide la marca y os lleváis bien. Marcas inventadas; importes de juego.
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

1. Mira la **pantalla** que tienes que superar (arriba) y lo próximo (debajo de tus fichas).
2. Elige tus tres **fichas**: la mañana (tu plan principal) y, si quieres, la tarde y la noche con una
   actividad o tiempo con alguien. Todo se repite hasta que lo cambies. En **Vida** puedes además
   llamar, regalar o pasar tiempo con cada persona; en **Empresa** compras y gestionas negocios,
   casas, coches y clubes.
3. Pulsa **Jugar semana**.
4. Lee el **parte semanal** y decide en las cartas que aparezcan.

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
(material) a 50.000 €/año cada uno (Red Toro), que se cobran repartidos por semanas; beca del Estado
1.400 €/mes (solo para escalada); ayuda del equipo nacional 120 €/semana; monitor 150 €/semana;
equipador 260 €/semana; premios: autonómico 100/60/40 €, Copa y Campeonato de España 500/300/200 €,
Copa de Europa 800/500/300 €, máster 4.000/2.500/1.500 €, Copa del Mundo 8.000/7.000/5.000 € (del 4º al
8º, de 3.000 a 1.000 €), Europeo 6.000/4.000/3.000 €, Mundial 10.000/8.000/6.000 €; medalla olímpica:
oro 90.000 € más una **beca olímpica de 60.000 € al año hasta los siguientes Juegos** (si allí no
repites el oro, o no vas, la pierdes); plata 48.000 €; bronce 30.000 €; colaboraciones en redes 2,5 € por cada
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

174 de 174 comprobaciones superadas con `node tests/p1.test.cjs` (unos 10 minutos), emulando un iPhone 13 con toques:
1. Presentación, fichas de la semana (mañana, tarde, noche), lo próximo, indicadores, resumen de la semana, «Jugar semana»,
   tarde programada con toques que se hace al cerrar la semana, plan que se repite, las 7 hojas,
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
6b. **Patrocinadores**: nombres de guiño sin marcas reales y con lema; más de 30 marcas de fútbol en 8
   categorías y más de 24 de escalada; cada marca solo en su división o nivel (en Tercera Federación solo
   negocios del barrio, Pumba desde Segunda, las top solo en Primera; en escalada, las pequeñas no buscan
   estrellas y las grandes piden nivel); nunca la misma marca dos veces en una ventana ni una que ya tienes;
   las rechazadas no vuelven en un año; ofertas en un club que se cobran cada semana; marcas top solo en primera; compromisos que
   ocupan la tarde (cumplir sube la relación, excusarse la baja, por debajo de 25 rompen); objetivo de
   temporada con prima y no renovación si fallas con mala relación; objetivos de escalada, logos en la
   escena y hoja propia; conversión de partidas antiguas.
6c. **Tu personaje**: se abre tocando tu cara, tienda con toques (comprar cobra una vez y es para
   siempre), bloqueos por logros, pantallas y dinero, la cara cambia con el ánimo y las lesiones, sale en
   la escena, regalos de las marcas y cosas propias de cada deporte; sin desplazamiento horizontal.
6d. **Humor**: los imprevistos graciosos existen y se resuelven (dentro de las pruebas de todos los
   imprevistos), titulares graciosos, bocadillo y salto de tu personaje, logros secretos ocultos hasta conseguirlos.
6e. **Mejoras**: se abren tocando tu dinero; contratar y comprar con toques; con entrenador y plafón se
   mejora más entrenando (misma partida y misma suerte); el entrenador se paga cada semana; material para
   siempre y propio de cada deporte; caprichos con espera; fisio y crash pads bajan las lesiones; la furgo
   abarata los viajes; sin dinero, tu equipo se va.
6f. **Números rojos**: carta del banco con una semana de plazo; menores (pagan sus padres) y deudas pequeñas (solo comisión); pasado el plazo, intereses y embargo
   (caja del negocio, luego el coche) hasta cubrir la deuda, sin tocar la casa si no hace falta; si sales a tiempo, nada.
   Sin nada que embargar: quiebra voluntaria (deuda borrada, menos fama, sin marcas, sin hipotecas) o
   quiebra forzada a las 4 semanas.
6g. **Arreglos del análisis**: pantalla 2 de escalada compitiendo; imprevistos que no puedes pagar desactivados;
   concurso de negocios y gerente; copia de seguridad con código; pantallas de vida con alternativa; compromisos
   espaciados; ánimo estable; ojeador desde la semana 4; marcas que esperan a verte jugar; retirada de escalada a
   los 40; embajador y biografía; pestañas de la tienda y zonas táctiles; sin desbordes a 320 px (la comprobación
   ahora mide el ancho real de la pantalla).
6h. **Para que enganche**: momentos clave en fútbol (marcador, clasificación y goles coherentes) y en
   escalada (puesto, podios y premio); retos (premio, cambio cada 3 semanas, propios de cada deporte); rival,
   mentor y periodista (capítulos que no salen al azar, duelos, sección en Vida); temporadas del año; tarjeta;
   sonido; siguiente generación con toques y salón de la fama.
6i. **Segunda auditoría**: 8 vidas simuladas hasta los 70 años (con siguiente generación) sin fallos de
   reglas, textos rotos ni desbordes; partida antigua (v0.9) que carga bien; los 171 avisos caben a 320 px.
   Arreglos: el rival puede ser chico o chica y los textos concuerdan; empezar con tu hijo funciona también
   en escalada; inicio más compacto (indicadores en una fila, 2 marcas y «+N», bocadillo que no tapa las
   marcas) para que la agenda se vea entera encima de JUGAR en un iPhone 13.
6j. **Forma y riesgo**: la energía marca tu forma (agotado/a, cansado/a, justo/a, en forma), con aviso en
   «Tu semana» y explicación al tocarlo. Cansado/a entrenas al 30–85 %, la nota del partido o los puntos de
   competición bajan mucho y el riesgo de lesión empieza en 45 de energía. Cada semana de entreno puede salir
   mal (más si vas cansado/a o desanimado/a) o redonda (en forma y con ánimo). El ánimo pesa el doble en la
   nota. Reposo baja la selección (−4), el gimnasio cansado/a puede sobrecargarte, la fiesta puede dar resaca
   y meditar recupera menos. Medido en una temporada: entrenando extra agotado/a se sube unos 4 de nivel
   frente a 10 con semanas normales.
6k. **Fama y redes**: tocar ⭐ abre «Fama y redes»: lo próximo que te da la fama (y la lista completa),
   tu perfil, qué publicas y tu muro con «me gusta» y comentarios. Seguidores también en fútbol. Publicar
   (actividad de tarde o noche) tiene 5 tipos: foto entrenando (seguro), reto viral (12 % viral, 15 %
   ridículo), picar a tu rival (35 % polémica), publi de tu marca (cobras y sube la relación) y vida personal
   (ánimo, 10 % prensa rosa). Tus hazañas se publican solas. Con más seguidores de los que corresponden a tu
   fama, la fama sube; desde 10.000 seguidores, colaboraciones pagadas. Tocar ⚡ abre tu forma.
6l. **Varios deportes**: el juego tiene dos motores. El de equipo (ligas, partidos, posiciones) sirve para
   fútbol y baloncesto; el individual (competiciones, cualidades, retos al aire libre) para escalada y, pronto,
   skate, surf y boxeo. Cada deporte trae su paquete: ligas o competiciones, posiciones o modalidades, marcas,
   escenas, imprevistos, logros, retos, jugadas decisivas y textos.
   **Baloncesto**: base, alero o pívot; Liga ACB, Primera, Segunda y Tercera FEB, Primera Nacional, Italia,
   Francia, Alemania, Turquía y la NBA (con G League); marcadores de 70-100 puntos sin empates (prórroga) y
   tabla de 2 puntos por victoria y 1 por derrota; puntos, rebotes y asistencias según tu posición y minutos;
   jugadas finales (triple sobre la bocina, penetración, pase; falta, tapón o defensa); marcas propias
   (Air Jordaniano, Spaldon, Piqui…); cancha del barrio y pabellones; triple-doble como logro secreto.
   **Skate**: street y park (las dos modalidades olímpicas); empiezas con 14 años en el skatepark del barrio;
   cualidades propias (pop, aguante, técnica, cabeza, fluidez); «Cuerpo» y «Tobillos» en vez de piel y dedos;
   spots reales (MACBA, Fòrum, Madrid Río, Southbank, Hubba Hideout, El Toro, Venice, Burnside, Bowl du Prado,
   Bryggeriet) con trucos de street y de bowl como «proyectos»; Copa y Campeonato de España, Pro Tour mundial,
   Equis Games por invitación, Mundiales, Europeos y Juegos; marcas propias (Elemento, Panadero, Santa Crus,
   Vanz, Naik SB, Espitfuego, Trasher, Suprim, Monstruo…); imprevistos, logros, tienda y mejoras propios.
   **Surf**: shortboard (la modalidad olímpica) y olas grandes; empiezas en la playa del barrio; «Piel» (sol y
   sal) y «Hombros»; olas reales con su temporada (Mundaka, Rodiles, Pantín, Supertubos, Hossegor, Pipeline,
   Teahupo'o, Jeffreys Bay, Punta Galea, Belharra, Nazaré, Jaws, Mavericks); alturas de ola y maniobras como
   «proyectos»; Circuito español, Qualifying Series, Championship Tour, desafíos de olas grandes por invitación
   (Nazaré, Jaws), Mundiales y Juegos; mangas con las dos mejores olas; marcas propias (Pukus, Perdido, Channel
   Islas, O'Nail, Rip Curvas, Quicksilva, Billabonk…); localismo, swell del año, delfines y gaviotas ladronas.
   **Boxeo**: amateur (torneos olímpicos con oro, plata y dos bronces: Copa y Campeonato de España, Copa del
   Mundo, preolímpico y Juegos) y profesional desde los 18 (veladas contra rivales de tu nivel cada pocas
   semanas, con bolsa según tu fama; título de Europa con 5 victorias; mundial tras ganar el europeo; velada
   estelar en Las Vegas por invitación); récord con victorias y KO; «Cara» y «Golpes» acumulados (los KO en
   contra pueden dejarte de baja); sin retos al aire libre; marcas propias (Everlas, Ganador Gloves, Cleto Reyos,
   Proteínas Hulk…); pesaje, rueda de prensa, promotor, sparring del campeón y hasta una película de tu vida.
   Las partidas creadas sin posición válida (por ejemplo, de otro deporte) toman la primera de su deporte.

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
