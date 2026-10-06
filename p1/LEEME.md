# P1 — Del barrio al negocio (versión 0.2, 6 de octubre de 2026)

Juego de **gestión y decisiones**, en vertical y pensado para iPhone. No es un simulador de fútbol:
no hay partidos controlables, física, gráficos 3D ni controles deportivos. Los partidos se simulan
con reglas que el juego explica después de cada semana.

- Juego: `p1/carrera_p1.html` (un único archivo, no necesita nada más ni conexión a Internet)
- Pruebas automáticas: `tests/p1.test.cjs` (solo para quien programa; no hace falta para jugar)
- Sin anuncios, compras, cuentas de usuario ni servicios de IA externos.

> **Importes provisionales.** Todo el dinero se muestra en euros, pero son importes de juego:
> no son precios ni salarios reales. Son valores de prueba para equilibrar el juego y se cambian en
> la sección **1. CONFIGURACIÓN** del código.

**Novedades de la versión 0.2:** importes en euros e interfaz de juego: presentación con nombre y
personaje, escenas dibujadas (barrio, pruebas, estadio, peluquería), misión con barra de progreso y
mapa de etapas, decisiones como cartas con iconos (💪 nivel, ⚡ energía, ⭐ reputación, €), marcador
del partido con escudos, nota del jugador, «botín de la semana», confeti en los momentos clave y las
reglas detalladas en «¿Por qué ha pasado esto?».

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

Pestañas inferiores: **Carrera** (decidir), **Negocio** (comprar y gestionar la peluquería),
**Finanzas** (patrimonio, movimientos, evolución y reiniciar).

## 3. Etapas y objetivos

| Etapa | Objetivo | Cómo se consigue |
|---|---|---|
| Barrio | Que te vea un ojeador | Reputación ≥ 25. Partido en la plaza: 3 + nivel/10 (+2 si tienes energía ≥ 50) |
| Ojeador | Elegir plazo | 3 semanas, o 5 semanas con −4 puntos en la prueba |
| Preparación | Buena puntuación | Prueba = nivel + energía/5 + reputación/5 ± 5 de suerte |
| Ofertas | Elegir club | Dos clubes con condiciones distintas (ver abajo) |
| Profesional | Mejora de contrato | ≥ 6 semanas, ≥ 4 partidos jugados y nota media de los 5 últimos ≥ la del club |
| Ahorro | Comprar la peluquería | 1500 € + caja inicial (200 / 500 / 900) |
| Negocio | Patrimonio 5000 € | Patrimonio = dinero personal + caja del negocio + valor del negocio |

Al llegar al patrimonio objetivo aparece el fin de la versión; se puede seguir jugando.

## 4. Reglas principales

**Decisiones del barrio y la preparación:** partido en la plaza (reputación, −15 energía), entrenar
solo (+3 nivel, −20 energía), entrenador personal (solo en la preparación: +6 nivel, −25 energía,
−90 €), trabajar (+60 €, −15 energía), descansar (+25 energía). Se recuperan 10 de energía por semana.

**Los dos clubes:**

| | Atlético Ciudad (grande, filial) | UD Puerto (modesto) |
|---|---|---|
| Salario | 110 si la prueba ≥ 60; si no, 70 | 160 + 3 por punto de prueba por encima de 55 |
| Prima de fichaje / por victoria | 0 / 15 | 150 / 30 |
| Calidad de entrenamiento | × 1,5 | × 1 |
| Titular con selección ≥ | 62 | 52 |
| Visibilidad (reputación) | × 1,5 | × 1 |
| Mejora de contrato | Nota ≥ 6,3 → primer equipo: 300/sem, pero titular con ≥ 72 | Nota ≥ 6,0 → salario × 1,4 |

**Cada semana como profesional:** entrenamiento extra (+2 × calidad nivel, −20 energía), semana normal
(+1 × calidad, −10), fisio (+25 energía, −40 €, acorta lesiones), reposo (+15 energía, gratis),
acto de patrocinador (+30 + reputación €, +2 reputación, −8 en la selección esa semana) y, si tienes
negocio, pasar la semana en la peluquería (+6 fama, −4 en la selección).

**Partido simulado:**
- Selección = nivel + energía/4 (− penalizaciones). Si llega al umbral, eres titular; si no, suplente con 50 % de jugar.
- Nota = 6 + (nivel − nivel rival)/8 + (energía − 60)/30 ± 1,2 de suerte.
- Victoria: probabilidad base del club ± 8 % por punto de nota (4 % si eres suplente); empate 25 %.
- Reputación: (nota − 6) × 3 × visibilidad (mitad si eres suplente), +1 si ganas; −1 si no juegas.
- Energía: titular −15, suplente −5, y se recuperan 20 cada semana.
- Lesión: si juegas con energía < 35, riesgo de 2 % por cada punto por debajo; 2 semanas fuera.
- Dinero: salario + prima por victoria (si juegas) − 60 de gastos de vida.

**Mejora de contrato (tres opciones):** aceptar; pedir un 20 % más (probabilidad = tu reputación,
entre 10 % y 80 %; si falla, firmas la oferta inicial con relación tensa: −6 en la selección durante
4 semanas); o contrato largo (−10 % salario, 60 semanas y prima inmediata de 4 semanas de salario).
Al acabar un contrato se renueva con +10 % o −10 % según tu nota media.

**Peluquería:**
- Demanda = 60 × factor de precio × (0,2 + fama/80) × (1 + tu reputación/200) ± 10 %.
- Capacidad = personas × 32 (sueldo básico) o × 38 (sueldo bueno). Clientes = mínimo de demanda y capacidad.
- Precios: económico 9 € (× 1,4 clientes, +1 fama/sem), normal 13 €, premium 19 €
  (× 0,45 clientes, −3 fama/sem mientras la fama sea < 60).
- Sueldos: básico 100 € (−1 fama/sem por rotación), bueno 140 € (+1 fama/sem).
- Gastos: alquiler 160 + sueldos + 2 € de producto por cliente. Contratar cuesta 50 de la caja; despedir, una semana de sueldo.
- Más de 3 clientes sin atender: −2 fama. Caja en negativo: −5 fama.
- Valor del negocio = 1500 × (0,5 + fama/100).

**Dinero personal y caja del negocio están separados.** El salario va a tu dinero; los clientes pagan
a la caja. Solo se mueve dinero entre ambos con los botones de traspaso (100 €) en «Negocio».
Los cambios de precio y personal no gastan la decisión semanal.

## 5. Pruebas realmente ejecutadas (Chromium sin pantalla, Linux)

45 de 45 comprobaciones superadas con `node tests/p1.test.cjs`, emulando un iPhone 13 con toques:

1. Presentación (nombre y personaje), importes en euros y bucle de una semana por la interfaz: no se puede avanzar sin decidir, la decisión queda marcada,
   los resultados se explican y «Continuar» pasa a la semana siguiente.
2. Partida completa solo con toques: ojeador (semana 4), ofertas (7), mejora de contrato (22),
   compra de la peluquería (24), cambio de personal y sueldo, y meta de patrimonio (34).
3. En todas las semanas con negocio: el dinero personal solo cambia con los movimientos personales
   y la caja solo con el resultado del negocio.
4. Guardado al recargar; reiniciar necesita dos toques y borra también el guardado.
5. Reglas: ofertas sin opción dominante, lesiones solo al jugar agotado (23 de 40 frente a 0 de 40),
   el patrocinio puede quitar la titularidad, pedir más depende de la reputación (25/30 frente a 7/30)
   y crea tensión al fallar, contrato largo, efectos de fama del negocio, caja negativa y traspasos.
6. Equilibrio (media de 5 partidas por estrategia; todas llegan a la meta):
   - «Dinero» (club modesto, patrocinios, contrato largo): meta en ~30 semanas, nivel ~51.
   - «Crecer» (club grande, entrenamiento extra): ~37 semanas, nivel ~98.
   - «Empresario» (sueldo bueno, premium, visitas al negocio): ~34 semanas, fama ~50.
   Cada estrategia gana en una cosa distinta: ninguna es la mejor en todo.
7. Sin desplazamiento horizontal a 320, 375 y 390 px; botones de al menos 48 px; sin errores de
   JavaScript; sin peticiones externas.

**No se ha probado:** Safari en Mac ni iPhone real.

## 6. Simplificaciones y pendientes

- Solo hay un negocio y dos clubes. No hay traspasos entre clubes, edad ni retirada.
- Estrategias sencillas (sin gestionar el negocio) siguen llegando a la meta, más despacio y con el
  negocio en declive: falta decidir si la meta debe exigir más del negocio.
- Ajustes a decidir tras probarlo: umbral del ojeador (`barrio.repOjeador`), precio y meta
  (`negocio.precio`, `metaPatrimonio`), fuerza del patrocinio, demanda base del negocio.
