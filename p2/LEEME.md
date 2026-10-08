# Del barrio al negocio · P2 (capítulo 1)

Juego de gestión por decisiones, vertical para iPhone. **Empiezas como deportista → construyes tu carrera →
ganas dinero → inviertes → creas tu primera empresa → se abre tu imperio.** No hay partidos jugables:
los partidos se simulan; tú decides qué haces cada semana y cómo respondes a lo que pasa.

- Abrir: [`del_barrio_p2.html`](del_barrio_p2.html) (un solo archivo, sin conexiones).
- Duración prevista del capítulo: unas 35–40 semanas de juego (estimación: 20–30 minutos; no lo he cronometrado con personas).
- Sin anuncios, compras, cuentas, servidor ni IA externa. Clubes, marcas y lugares ficticios; importes de juego.

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
| `10_sim.js` | Políticas automáticas, `runBalance()` y análisis de la peluquería |
| `20_ui.js`, `estilo.css`, `plantilla.html` | Interfaz (situación → decisión → consecuencia) |

`node p2/build.cjs` une todo en `del_barrio_p2.html`. `p2/cargar.cjs` carga la lógica en Node (tests y simulaciones).
Un club, una marca, un suceso o un negocio nuevo es una entrada de datos más.

Ganchos de depuración en el navegador: `window.__P2` (`S`, `jugar(id)`, `decidir(id)`, `runBalance(n)`, `informe(n)`, `migrateSave`…).
En ⚙️ Ajustes hay un botón que lanza el simulador y muestra el informe.

## 4. Simulación de balance (`P2.runBalance(150)`, 150 partidas por política, máx. 90 semanas)

| Política | Llega a las pruebas en la captación | Contrato (semana) | Empresa (semana) | Capítulo completado (semana) | Patrimonio final | Nivel | Crisis/partida |
|---|---|---|---|---|---|---|---|
| Todo trabajo | 0 % | 100 % (32) | 100 % (38) | 67 % (49) | 10.755 € | 50 | 6,1 |
| Todo entrenamiento | 0 % | 100 % (16) | — | 0 % | 32.501 € | 73 | 0 |
| Todo descanso | 0 % | 100 % (20) | — | 0 % | 23.146 € | 53 | 0 |
| Todo fútbol | 100 % | 100 % (13) | — | 0 % | 30.951 € | 69 | 0 |
| Dinero primero | 19 % | 100 % (22) | 100 % (31) | 100 % (39) | 17.815 € | 49 | 0 |
| Deporte primero | 49 % | 100 % (14) | 100 % (41) | 66 % (51) | 25.713 € | 68 | 3,6 |
| Patrocinios primero | 100 % | 100 % (13) | 100 % (27) | 81 % (35) | 17.607 € | 51 | 10,4 |
| Equilibrada | 59 % | 100 % (12) | 100 % (29) | 100 % (36) | 18.863 € | 66 | 0 |

Notas para leer la tabla:
- Las políticas «todo X» y «deporte primero» no compran empresa o no la gestionan: por eso no terminan el capítulo,
  aunque acumulen dinero de sueldo. «Patrimonio final» se mide al terminar (antes, si completas el capítulo), así que
  no compara riqueza a igual semana.
- «Todo trabajo» solo llega al contrato por la repesca y tarda ~13 semanas más que la equilibrada en terminar.
- **Atlético frente a Puerto con la misma partida** (equilibrada, mismas 88 semillas con las dos ofertas, solo cambia el club):

| | Patrimonio sem. 25 | Sem. 40 | Sem. 60 | Compra empresa | Nivel sem. 70 |
|---|---|---|---|---|---|
| UD Puerto | **4.272 €** | 14.594 € | 24.863 € | sem. 27,6 | 58 |
| Atlético | 2.522 € | **20.206 €** | **39.954 €** | sem. 28,6 | **85** |

- **Peluquería, mejor configuración según el contexto** (12 semanas, fama 50): normal → Normal/Normal/2/sin publicidad;
  competidor → Premium/Normal/1; temporada alta → Normal/Normal/3; avería → Normal/Bajo/3; influencer → Normal/Bajo/3/Redes.
  Cinco contextos, cinco óptimos distintos.

Comprobaciones automáticas del informe (todas superadas en la última ejecución): repetir una sola acción no es lo mejor;
sin carrera no hay empresa y trabajar en vez de jugar es más lento; no se puede trabajar indefinidamente; las pruebas dan
conjuntos de ofertas distintos; Puerto da más dinero al principio y Atlético más nivel y patrimonio a medio plazo;
patrocinios primero no gana a la vez en dinero y deporte; la peluquería no tiene un óptimo único; todas las políticas
legítimas firman contrato; energía nunca negativa; ninguna decisión se atasca.

## 5. Pruebas

`node tests/p2.test.cjs` (unos 30 s; `--rapido` se salta la interfaz): **67 de 67 comprobaciones superadas**. Incluye lo pedido:
energía nunca negativa, recargar no duplica dinero ni caja, una prima no se cobra dos veces, cada partido cuenta una vez,
la clasificación no duplica resultados, los contratos expiran, las lesiones se curan, una empresa puede perder dinero y
recuperarse, guardar/cargar conserva todo, P1 migra a P2 sin errores (y su partida no se toca), guardado corrupto apartado sin borrar.
En la interfaz (Chromium emulando un iPhone 13): la primera decisión se ve sin desplazarse, orden situación → decisión → consecuencia,
sin `undefined`/`NaN`, sin desplazamiento horizontal y sin errores de JavaScript.

## 6. Problemas conocidos y límites

- El balance está probado con bots, no con personas. La duración de 20–30 minutos es una estimación.
- Con la política equilibrada, el 41 % de las partidas no consigue prueba en las 8 semanas y pasa por el amateur
  (los bots no usan el campus). Puede que una persona lo consiga más a menudo; habría que medirlo.
- Puerto compra la empresa antes, pero por muy poco (≈1 semana): la ventaja de «dinero rápido» es moderada.
- La fama del jugador sube mucho en el Atlético (llega a 100 hacia la semana 70) y multiplica la demanda del negocio
  hasta ×1,4: conviene vigilar ese efecto en capítulos siguientes.
- La confianza del míster se satura en 100 con buenas notas.
- Las ligas y rivales son siempre los mismos 8 equipos por categoría; no hay mercado de fichajes entre clubes rivales.
- Tras el capítulo 1 se puede seguir jugando, pero no hay contenido nuevo (solo la segunda inversión elegida).
- Edad: solo cambia cada 52 semanas.
