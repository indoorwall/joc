# Del barrio al negocio · P2 (capítulo 1)

Juego de gestión por decisiones, vertical para iPhone. **Empiezas como deportista → construyes tu carrera →
ganas dinero → inviertes → creas tu primera empresa → se abre tu imperio.** No hay partidos jugables:
los partidos se simulan; tú decides qué haces cada semana y cómo respondes a lo que pasa.

- Abrir: [`del_barrio_p2.html`](del_barrio_p2.html) (un solo archivo, sin conexiones).
- Duración prevista del capítulo: unas 35–40 semanas de juego (estimación: 20–30 minutos; no lo he cronometrado con personas).
- Sin anuncios, compras, cuentas, servidor ni IA externa. Clubes, marcas y lugares ficticios; importes de juego.

## 0. Al empezar: tu personaje

Eliges nombre y personaje con el avatar por capas de P1: piel, pelo, color de pelo, cara, ropa, color, pantalón,
calzado, cabeza, gafas, extras y fondo (botón «Al azar» incluido). Se cambia luego tocando tu cara en la cabecera.
Algunas prendas se ganan con hitos: camiseta de tu club (contrato), medalla (titular), camiseta de tu marca (patrocinador),
traje (empresa), reloj (empresa rentable), corona, cadena, botas y fondo de oro (capítulo completado). La cara cambia
con la energía, las lesiones, el último resultado y las crisis de tu empresa.

**Cómo se juega una semana:** eliges una acción (queda marcada ✓) y pulsas el botón grande **«JUGAR SEMANA»**, como en P1.
Si hay una decisión pendiente, el botón espera hasta que la tomes.

## 1. El recorrido

| Etapa | Qué decides | Qué se abre |
|---|---|---|
| Barrio (8 semanas de captación) | Plaza, entrenar, trabajar, descansar, jornada abierta (sem. 4 y 7), torneo (sem. 5), campus (400 €) | Invitación a las pruebas |
| Pruebas (2 semanas) | Prepararte, llegar descansado/a, pagar un preparador | Ofertas según la puntuación |
| Primera temporada | Qué haces además del partido: entreno extra, descanso, prensa; sucesos | Titularidad, agente, patrocinadores |
| Patrocinios | Qué contratos firmas (máx. 2) y si cumples sus actos | Asesor y traspasos de negocios |
| Primera empresa | Con cuánta caja compras, precios, sueldos, plantilla, publicidad, cuándo poner o sacar dinero | Financiación y venta |
| Rentable 6 semanas seguidas | — | **Segunda inversión: comprar el local, abrir otra peluquería o ser socio de una cafetería** |

Al elegir la segunda inversión termina el capítulo 1 («Ahora empieza tu imperio») y puedes seguir jugando.

### Hitos (cada uno abre algo)

1. Consigue una prueba → sesión con preparador.
2. Firma tu primer contrato profesional → liga, patrocinadores locales, sueldo.
3. Sé titular 3 partidos → agente (renovaciones, otros clubes).
4. Firma tu primer patrocinador → tu asesor te enseña traspasos.
5. Reúne el capital → negociar la compra.
6. Compra tu primera empresa → gestión y la acción «Pasar la semana en la empresa».
7. Empresa rentable 6 semanas seguidas → préstamo y venta del negocio.
8. Elige tu segunda inversión → capítulo 2.

## 2. Reglas principales (todas configurables en `src/00_config.js`)

- **Una acción por semana.** Jugar, entrenar o trabajar piden energía mínima (25–50). Con energía 0 solo puedes descansar.
- **Captación:** 8 semanas. Cuatro caminos a las pruebas: fama 18 (ojeador), jornada abierta (nivel ≈ 50),
  torneo local (riesgo y mucha fama) o campus de pago (400 €). Repetir la misma acción rinde cada vez menos.
  Si se acaba el plazo: **CD San Roque (amateur)** y **repesca cada 6 semanas**. Nunca hay game over.
- **Pruebas:** nivel + energía (−6 a +4) + fama × 0,2 (máx. 6) + preparador (+3) + recomendación (0–2) + suerte (±4).
  - < 48: sin contrato profesional (amateur y repesca).
  - 48–54: UD Puerto.
  - 55–61: UD Puerto + contrato de formación del Atlético Ciudad B.
  - 62+: UD Puerto + ficha del filial del Atlético (mejores condiciones).
  - Preparada y apagada: oportunidad excepcional para 70+ (`CFG.pruebas.excepcional`).
- **Clubes distintos, no solo sueldos distintos:**

| | UD Puerto | Atlético Ciudad B (formación / filial) |
|---|---|---|
| Sueldo y prima | 250 €/sem · 1.800 € | 90 €/sem · 0 € / 150 €/sem · 500 € |
| Minutos | +6 (juegas casi seguro) | −6 / −2 (cuesta ser titular) |
| Entreno | ×0,6 · techo de nivel 60 | ×1,4 · techo 80 |
| Exposición (fama e interés) | ×0,6 | ×1,4 / ×1,5 |
| Marcas | solo locales | locales y deportivas |
| Futuro | renovar | subir al primer equipo (520 €/sem, prima 3.000 €) |

- **Liga:** 8 equipos, 14 jornadas (ida y vuelta), suben 2 y bajan 2. Se ve la clasificación, el próximo rival,
  el objetivo del club y el contexto («si ganáis, entráis en puestos de ascenso»). La clasificación se calcula
  siempre desde los resultados guardados (no puede duplicarse) y cada jornada se juega una sola vez.
- **Partido:** titular, suplente o banquillo según nivel, confianza del míster, club, energía y azar. En pantalla
  se ve «probabilidad alta/media/baja de ser titular»; la fórmula está en «¿Por qué ha pasado esto?».
  Tu nota mueve la confianza, la fama, el interés de otros clubes y los patrocinios; el resultado del equipo
  mueve la tabla y las primas (que se cobran una sola vez por jornada).
- **Patrocinios = contratos:** requisito de fama (y de titularidades en las deportivas), prima, pago semanal,
  duración y **actos con fecha** que ocupan una semana entera. Dos faltas rompen el contrato. Máximo 2.
- **Dinero personal y caja de la empresa separados.** Tu sueldo va a tu cuenta; los clientes pagan a la caja.
  Mover dinero es una decisión explícita («Poner en la caja» / «Sacar a tu cuenta»).
- **Peluquería:** demanda = 110 × (0,4 + fama/100) × precio × publicidad × contexto × tu fama de futbolista.
  La fama del negocio va hacia la calidad real (sueldos) y el precio justo; las colas la bajan. El antiguo dueño
  la deja mal configurada (3 empleados mal pagados y precios bajos): hay que decidir desde el primer día.
  - **Contexto que cambia:** competidor low cost, empleada que pide aumento, avería, subida de alquiler,
    influencer, temporada de bodas, tu mejor peluquera recibe otra oferta. Dependen del estado del negocio.
  - **Capital inicial:** 600 / 2.000 / 4.500 € de caja además del traspaso (4.500 €).
    Poca caja = compras antes, pero cualquier golpe te deja en rojo.
  - **Crisis:** caja negativa o 3 semanas en pérdidas con poca caja. Opciones: poner tu dinero, préstamo,
    recortar (−fama), vender con descuento o cerrar.
  - **Valor** = beneficio medio de 6 semanas × 26 + caja + fama × 15 − deuda (mínimo 1.500 €).

## 3. Arquitectura

Módulos en `p2/src/` (datos separados de la lógica; la lógica no toca la pantalla):

| Archivo | Contenido |
|---|---|
| `00_config.js` | Balance y contenido: clubes, ligas, acciones, marcas, negocios, oportunidades, hitos |
| `01_util.js` | Azar con semilla guardada en la partida, formato |
| `02_estado.js` | Partida nueva, **saveVersion 2**, `migrateSave()` (rellena valores seguros, convierte P1, nunca borra) |
| `03_liga.js` | Calendario, clasificación, contexto de la jornada |
| `04_carrera.js` | Acciones, captación, pruebas, ofertas, contratos, convocatoria, partido, fin de temporada |
| `05_patrocinios.js` | Contratos, pagos, actos, objetivos |
| `06_negocios.js` | Tipo de negocio genérico, semana, valoración, caja, préstamo, compra/venta |
| `07_eventos.js` | Motor de sucesos por datos (condición, peso, enfriamiento, opciones) y consecuencias diferidas |
| `08_decisiones.js` | Decisiones pendientes (sucesos, ofertas, actos, crisis, repesca, segunda inversión) e hitos |
| `09_semana.js` | `jugarSemana()` y `resolverDecision()`: las dos únicas puertas que cambian la partida |
| `10_sim.js` | Bots por dimensiones (deportiva × empresarial × comercial), `runBalance()` y análisis de la peluquería |
| `11_avatar.js` | Avatar por capas (datos de prendas, desbloqueos por hito y dibujo) |
| `20_ui.js`, `estilo.css`, `plantilla.html` | Interfaz (situación → decisión → consecuencia, botón «Jugar semana», editor del personaje) |

`node p2/build.cjs` une todo en `del_barrio_p2.html`. `p2/cargar.cjs` carga la lógica en Node (tests y simulaciones).
Un club, una marca, un suceso o un negocio nuevo es una entrada de datos más.

Ganchos de depuración en el navegador: `window.__P2` (`S`, `jugar(id)`, `decidir(id)`, `runBalance(n)`, `informe(n)`, `migrateSave`…).
En ⚙️ Ajustes hay un botón que lanza el simulador y muestra el informe.

## P2.1: balance, coherencia temporal y decisiones

### Qué cambia

1. **Ascensos y descensos reales.** Las categorías están encadenadas: Regional Preferente → Tercera Federación →
   Segunda Federación → Primera Federación. Al acabar la temporada suben los 2 primeros y bajan los 2 últimos
   (arriba del todo no se sube y abajo del todo no se baja). El «mundo» (qué club juega dónde y con qué fuerza)
   se guarda en la partida.
   - Al subir: celebración, prima de ascenso si has jugado (UD Puerto 1.200 €, Atlético B 600–800 €), +3 de fama,
     rivales nuevos y más fuertes, más exposición (Segunda ×1,3, Primera ×1,6) y techo de sueldo mayor.
   - Al bajar: rivales más flojos, menos exposición, −2 de fama.
   - El objetivo de cada temporada se calcula según lo fuerte que es tu club en su categoría
     (no bajar / top 4 / ascenso / título).
   - Un filial no puede subir a la categoría de su primer equipo: la plaza pasa al siguiente.
   - El ascenso del club y las ofertas personales son cosas distintas: pueden pasar a la vez o no.
   - **Techo de sueldo por categoría** (Regional 80, Tercera 450, Segunda 900, Primera 1.500 €/semana): ninguna
     renovación ni subida lo supera.
2. **Una decisión cada semana.** Tras jugar, `s.eleccion = null`. «Jugar semana» está desactivado
   («Elige qué haces esta semana») hasta que tocas una acción. Nada se elige solo. Con una decisión pendiente,
   el botón desaparece hasta que decides.
3. **Segunda inversión con tres estructuras financieras** (lo que pones tú hoy cabe en el dinero típico al
   desbloquearla, unos 3.800 € de mediana):
   - **Local**: 3.500 € de entrada + hipoteca de 10.500 € (0,2 %/semana, 156 semanas) que paga la peluquería.
     Desaparece el alquiler (450 €/semana) y el local cuenta como activo (vale 14.000 € y se revaloriza).
   - **Segunda peluquería**: 2.000 € + 1.500 € de caja y un préstamo de 4.000 € a cargo del nuevo negocio.
     Tiene su propia puesta en marcha.
   - **Socio de la cafetería**: 3.000 € y no gestionas.
4. **La cafetería ya no es dinero garantizado.** La participación tiene valor, estado, dividendos e historial.
   Cada 6 semanas llega un resultado:
   - trimestre bueno (dividendo 4,5 %);
   - normal (2 %);
   - malo (sin dividendo, −8 % de valor);
   - expansión (sin dividendo, +8 %);
   - problemas (−15 %, y a veces piden capital: si no pones, te diluyen un 30 %).
   A veces alguien ofrece comprar tu parte (80–120 % de su valor). El patrimonio cuenta el valor actual, no lo invertido.
5. **Puesta en marcha de la peluquería.** Al comprar salen de la caja la fianza (900 €, se recupera al vender) y el
   stock (350 €). La primera semana se ingresa un 60 % (la clientela desconfía) y en la segunda hay 250 € de
   reparaciones. Después llega una **oportunidad de mejora** que solo puedes pagar con caja:
   - sillón y lavacabezas (900 €, +15 % de capacidad);
   - lavado de cara (1.600 €, +12 de fama y +5 a la fama objetivo);
   - fiesta de reapertura (450 €, +7 de fama).

   Cajas iniciales: 1.500 / 3.000 / 5.500 €.
6. **Patrocinios exactos.**
   - Un contrato de N semanas paga N veces (se cuentan los pagos, ya no las semanas del calendario) y no hay actos después del último pago.
   - Al terminar bien se negocia la renovación: solo se cobra el 25 % de la prima, y el pago semanal sube un 10 % si cumpliste todos los actos.
   - Si rompes por incumplir, esa marca no vuelve.
   - Los requisitos usan la **marca personal** (fama × factor de nivel: con poco nivel tu fama vale menos).
   - Las marcas deportivas piden además nivel mínimo (Kinetic 55, Vértice 62).
7. **Eventos que ocupan la semana** (`ocupaSemana` en cada opción). Al elegirlas, la semana pasa entera (el partido
   se juega igual) y no hay otra acción:

| Ocupan la semana | No la ocupan (modificadores) |
|---|---|
| Doblar turnos toda la semana (más horas) | Solo el fin de semana · rechazar |
| Dedicar la semana a la peluquería (la empresa te necesita) | Que lo resuelva la encargada · ignorar |
| Mudarse a un local más barato (alquiler) | Aceptar o negociar la subida |
| Clínic de una semana con niños (nuevo) | Rumor de ojeador · partido decisivo · compañero lesionado |
| Ir al acto del patrocinador | Agente: escuchar / cerrar / pedir mejora · renovación anticipada |
| Crisis: reorganizar y recortar · vender · cerrar | Crisis: poner dinero · pedir préstamo |
| | Entreno personal · molestias · entrevista · bar del amigo · evento antes del partido |
| | Empresa: competidor · aumento · avería · influencer · temporada alta · peluquera estrella |

   Además, a la **tercera crisis seguida** el banco ya no presta y recortar no basta: o lo cubres entero de tu
   bolsillo, o vendes, o cierras. Así una empresa hundida no encadena crisis sin fin.
8. **Simulador justo por dimensiones**: deportiva (trabajo, entreno, fútbol, descanso, equilibrada) × empresarial
   (no optimiza, prudente, agresiva, inteligente) × comercial (sin, locales, máximos) = 60 combinaciones.
   Todas pueden comprar la peluquería.
9. **Ruta «imagen + empresa»** (plaza y prensa, caja mínima, patrocinios máximos): sigue siendo legítima,
   pero tiene coste. La marca personal pesa por el nivel deportivo, y con poco nivel llegan peores clubes,
   el techo de sueldo de categorías bajas y menos marcas deportivas.
10. **Migración desde P1**: se buscan las claves `…_p1_v5`, `v4`, `v3`, `v2` y `v1` (de la más nueva a la más antigua).
    Solo se leen: nunca se escribe ni se borra el guardado original.
11. **Navegación progresiva**:
    - Al empezar: Semana, Hitos, Ajustes.
    - Al firmar: Liga y Marcas.
    - Al abrirse el mercado: Empresa.

    Cada sección nueva sale como desbloqueo («🔓 Nueva sección…») y con la etiqueta «Nuevo» en la barra hasta que la visitas.
12. El avatar no cambia.

## 4. Simulación de balance (P2.1)

`P2.runBalance(40)`: 40 partidas por combinación, mismas semillas para todas. «Semana» = semana real de juego.

**Por dimensión** (media de las combinaciones; capítulo y patrimonio al cerrarlo):

| Deportiva | Capítulo | Semana | Nivel |
|---|---|---|---|
| Trabajo primero | 91 % | 56,1 | 50 |
| Entrenamiento primero | 93 % | 44,9 | 78 |
| Fútbol primero | 94 % | 42,5 | 61 |
| Conservadora (descanso) | 94 % | 50,6 | 49 |
| Equilibrada | 92 % | 41,3 | 71 |

| Empresarial | Capítulo | Semana | Crisis por partida |
|---|---|---|---|
| No optimiza | 71 % | 48,5 | 2,7 |
| Prudente | 100 % | 52,1 | 0 |
| Agresiva | 100 % | 42,2 | 1,1 |
| Inteligente | 100 % | 45,4 | 0,2 |

Comercial: sin, locales o máximos apenas cambian el resultado al cerrar el capítulo (18.302 / 18.429 / 18.465 €).

**Deportivas con la misma gestión (inteligente, patrocinios locales), todas pueden comprar, 100 semanas:**

| | Capítulo (semana) | Patrimonio sem. 80 | Nivel | Categoría máx. |
|---|---|---|---|---|
| Equilibrada | 100 % (40,3) | 93.692 € | 77 | 3,7 |
| Solo entrenamiento | 100 % (44,1) | 93.872 € | 83 | 3,9 |
| Solo fútbol | 100 % (40,9) | 68.809 € | 69 | 3,4 |
| Solo descanso | 100 % (47,9) | 41.776 € | 54 | 2,7 |
| Trabajo primero | 100 % (53,7) | 53.032 € | 53 | 2,7 |

**Caja inicial con el mismo gestor inteligente** (equilibrada, 100 semanas):

| Caja | Compra (sem.) | Capítulo (sem.) | Crisis por partida | Patrimonio sem. 80 |
|---|---|---|---|---|
| 1.500 € | 29,9 | 37,7 | 1,0 | 83.491 € |
| 3.000 € | 32,9 | 40,3 | 0 | 93.692 € |
| 5.500 € | 38,6 | 45,7 | 0 | 96.053 € |

La caja mínima compra y cierra el capítulo antes, pero es la única con crisis y la que menos patrimonio tiene a 80 semanas.

**Ruta «imagen + empresa» frente a carrera** (mismos patrocinios máximos, 100 semanas):

| | Capítulo (sem.) | Patrimonio sem. 100 | Nivel | Sueldo final | Marca personal | Categoría máx. |
|---|---|---|---|---|---|---|
| Imagen + caja mínima | **35,0** | 135.035 € | 55 | 317 € | 84 | 2,8 |
| Imagen + inteligente | 36,6 | 128.079 € | 55 | 293 € | 84 | 2,9 |
| Equilibrada | 39,4 | 143.022 € | 77 | 849 € | 115 | 3,7 |
| Solo entrenamiento | 42,1 | **147.153 €** | 83 | 906 € | 128 | 3,9 |

Es la forma más rápida de ser empresario, pero no la mejor para crecer: a 100 semanas queda por debajo de las rutas
deportivas (un 6–9 % menos de patrimonio) y con un sueldo, una categoría y una marca personal mucho peores.

**Atlético frente a Puerto** (misma partida, 28 semillas con las dos ofertas): patrimonio semana 25 → Puerto
5.132 € / Atlético 3.543 €; semana 40 → 21.801 / 23.066 €; semana 80 → 63.646 / 107.729 €; nivel 57 / 85.

**Segunda inversión** (mismas partidas, obligando cada opción; mediana de dinero al desbloquearla 3.819 €):
las tres completan el capítulo (100 %). A 80 semanas, local 102.380 € > segunda peluquería 88.860 € > socio 69.330 €.
La cafetería es la más tranquila y la que menos rinde.

Comprobaciones automáticas del informe (todas superadas): ninguna estrategia de una sola acción completa más capítulos que la equilibrada;
trabajar en vez de jugar retrasa contrato y capítulo; no se puede trabajar indefinidamente; las pruebas dan ofertas distintas;
Puerto da más al principio y Atlético más a medio plazo; caja mínima antes pero con más crisis y sin ser la mejor en todo;
ruta imagen con coste deportivo y sin ser la mejor a largo plazo; las tres segundas inversiones viables; la peluquería sin óptimo único;
todas las combinaciones firman contrato; energía nunca negativa; sin decisiones atascadas.

## 5. Pruebas

`node tests/p2.test.cjs` (alrededor de un minuto; `--rapido` se salta la interfaz): **118 de 118 comprobaciones superadas**.

- **De P2:**
  - energía nunca negativa; recargar no duplica dinero ni caja;
  - una prima no se cobra dos veces; cada partido cuenta una vez; la clasificación no duplica resultados;
  - los contratos expiran; las lesiones se curan;
  - una empresa puede perder dinero y recuperarse;
  - guardar y cargar conserva todo; P1 migra sin errores; un guardado corrupto se aparta sin borrarse.
- **Nuevas de P2.1:**
  - ascender y descender cambian de verdad la categoría, los rivales y el objetivo;
  - un filial no sube a la categoría de su primer equipo;
  - tras cada semana no queda ninguna acción elegida;
  - un patrocinio de N semanas paga exactamente N veces; renovar no repite la prima completa; romper hace perder la marca;
  - las tres segundas inversiones funcionan con estructuras financieras distintas;
  - la participación de socio puede perder valor, quedarse sin dividendo, pedir capital y recibir ofertas;
  - los eventos con `ocupaSemana` consumen la semana y los demás no;
  - navegación progresiva; techo de sueldo;
  - P1 se encuentra con la clave `v1`, se usa la más nueva y no se escribe nada.
- **Interfaz** (Chromium emulando un iPhone 13):
  - personaje con 12 capas y prendas de hitos bloqueadas;
  - al empezar la barra solo tiene 3 secciones;
  - «Jugar semana» desactivado hasta elegir, y sin botón mientras hay una decisión pendiente;
  - Liga y Marcas aparecen con «Nuevo» al firmar;
  - sin `undefined`/`NaN`, sin desplazamiento horizontal y sin errores de JavaScript.

## 6. Problemas conocidos y límites

- El balance está probado con bots, no con personas. La duración de 20–30 minutos es una estimación.
- **Los patrocinios pesan poco** en la economía: con o sin ellos, el patrimonio al cerrar el capítulo es casi igual
  (18.302 € / 18.429 € / 18.465 €). Sirven sobre todo para abrir el mercado de negocios. Pendiente de equilibrar.
- **Economía de final de partida grande**: hacia la semana 80–100, con local propio, fama alta y sueldo de Segunda/Primera,
  el patrimonio pasa de 90.000–140.000 €. Está dentro de lo esperable para «imperio», pero no está pensado para
  ese tramo (el capítulo acaba hacia la semana 40).
- La ruta «imagen + empresa» cierra el capítulo 4–5 semanas antes y a 100 semanas acaba con un 6–9 % menos de
  patrimonio: el coste existe, pero en dinero es moderado (en sueldo y categoría es claro).
- La prudente (caja máxima, sin riesgos) nunca entra en crisis y llega al capítulo más tarde (semana 52): segura pero lenta.
- Puerto compra la empresa antes que Atlético, pero por poco: la ventaja de «dinero rápido» es moderada.
- La confianza del míster se satura en 100 con buenas notas.
- Los clubes de las categorías vecinas que suben o bajan se eligen al azar entre los más fuertes / más débiles
  (esas ligas no se juegan partido a partido).
- Tras el capítulo 1 se puede seguir jugando, pero no hay contenido nuevo.
- Edad: solo cambia cada 52 semanas.
