# Del barrio al negocio · P2.7 (6 deportes, 5 expansiones y Prestige)

Juego de gestión por decisiones, vertical para iPhone. **Empiezas como deportista → construyes tu carrera →
ganas dinero → inviertes → creas tu primera empresa → se abre tu imperio.** No hay partidos jugables:
los partidos se simulan; tú decides qué haces cada semana y cómo respondes a lo que pasa.

- Abrir: [`del_barrio_p2.html`](del_barrio_p2.html) (un solo archivo, sin conexiones).
- Duración prevista del capítulo: unas 35–40 semanas de juego (estimación: 20–30 minutos; no lo he cronometrado con personas).
- Sin anuncios, compras, cuentas, servidor ni IA externa. Clubes, marcas y lugares ficticios; importes de juego.

## P2.5.1 · Ritmo: decisión → expectativa → tensión → habilidad → consecuencia → historia

Sin deportes, expansiones ni Prestige nuevos. Diseño completo y diagnóstico en
[`docs/P2.5.1_DISENO.md`](../docs/P2.5.1_DISENO.md).

- **Momentos clave en vez de «penalti cada semana».** Antes, el 61 % de los partidos tenía minijuego y el 90 % eran
  penaltis. Ahora:
  - lo tiene el 39 % de los partidos que juegas;
  - el penalti es el 4 % de los momentos;
  - ningún tipo pasa del 10 %;
  - nunca se repite el mismo dos veces seguidas;
  - nunca pasan más de 6 partidos sin ninguno.
- **4 motores y 15 momentos de fútbol.**
  - Los motores son timing, secuencia, objetivo y reacción.
  - Los momentos: penalti, pase al hueco, control orientado, tiro colocado, falta directa, uno contra uno, regate,
    centro/córner, último pase, contraataque, secuencia de pases, defensa/entrada, remate, prueba física y prueba
    técnica.
  - Los demás deportes usan instancias genéricas, con el motor preparado para tener las suyas.
- **Importancia de 1 a 5.** Un partido normal tiene un 30 % de momento; uno importante (rival directo, últimas
  jornadas, zona en juego), un 70 %; la promoción y la final, el 100 %.
  - Se presenta como «🔥 MOMENTO CLAVE» o «🏆 GRAN MOMENTO», con el minuto, la escena y qué consigues si sale o si
    falla.
- **La gestión cambia la dificultad real.** Entrenar, descansar, la energía, una lesión reciente, la confianza del
  míster, las botas, el preparador y la preparación cambian la ventana y la velocidad del minijuego.
  - Antes de jugar se ve el porqué: «Energía 15: llegas reventado/a».
  - La marca y los patrocinadores no dan ventaja, y comprar con dinero real tampoco.
- **Preparación.** «🏆 FINAL · COPA FEDERACIÓN EN 3 SEMANAS · Preparación 62 %» aparece en Inicio.
  - Entrenar suma; la empresa, el trabajo o un acto de patrocinador restan; la fatiga cuenta.
  - Cada acción enseña su efecto («📈 Preparación +12»).
  - Con la misma habilidad, 4 semanas entrenando dan un 64 % de acierto en el momento, frente al 33 % ignorando el
    deporte.
- **FAIL / GOOD / PERFECT.**
  - En un partido, el momento cambia como mucho un gol, con ±5–8 de confianza. Antes eran hasta ±2 goles y −18.
  - En una final o una promoción, el nivel y la preparación ponen la base y el minijuego inclina entre −15 y +18
    puntos. Antes, el minijuego lo decidía todo.
  - Después se enseña **QUÉ PASÓ** y **POR QUÉ IMPORTA**.
- **Estadísticas y logros** (en Mi historia): jugados, éxito, Perfect, racha y reintentos. Logros: 🧊 Sangre fría,
  🔥 En racha, 🎯 Diez de diez y ⭐ Polivalente.
- **Vidas.**
  - Siguen 3 y se recuperan jugando: una cada 6 semanas.
  - Tras fallar: «Aceptar resultado» o «❤️ Usar vida y repetir»; sin vidas, «📺 Recuperar 1 vida».
  - El anuncio da una vida cada 4 semanas como mucho, y 3 por temporada.
- **Director de eventos.** Mira las últimas 8 semanas para evitar rachas iguales, vacías o saturadas, y empuja lo que
  falta: relaciones o empresa.
- **Cruces.**
  - 7 decisiones empresa ↔ deporte: el empleado que falta, una avería, un cliente que coincide con el patrocinador,
    la subida de una empleada, una semana de mucha demanda, un proveedor y la colaboración con el patrocinador.
  - Un Perfect trae clientes a tu negocio y fallar un gran momento le trae polémica.
  - 9 consecuencias diferidas con tus personas: Iker invierte, Sonia presenta un contacto o una campaña, Marc te
    presenta a un exjugador, tus padres te ayudan en una crisis, el míster Paco te recomienda, el benéfico de Dani,
    tu madre en la grada y el consejo de tu padre.
- **Tienda con deseo.**
  - El objetivo personal se ve siempre en Inicio, con lo que tienes, lo que cuesta y el porcentaje.
  - Una sola sugerencia si no has marcado ninguno.
  - Un recordatorio suave al cobrar algo grande.
- **Premium.**
  - Ya no está en la semana 1: se abre con el primer contrato («🔓 Personalización Premium»).
  - Vive dentro de la Tienda: 🛍️ Tienda · 🎒 Mis cosas · 💎 Premium.
  - Al empezar, los deportes de pago dicen «🔒 Expansión», sin precio; la ficha con el precio sale al tocarlos.
- **Mi historia** guarda tu camino: pruebas, ruta amateur, hitos, títulos, finales, momentos y Perfect.
- **Informe del tester:** sección MINIJUEGOS con el reparto por tipo, el éxito, los Perfect, los reintentos, las
  vidas por anuncio, la frecuencia y las alertas de diseño, que son configurables.

## P2.7 · Todos los deportes, las expansiones y el Prestige

Todo está jugable. Las compras siguen siendo simuladas (modo prueba): no hay pagos reales hasta «ACTIVAR PRODUCCIÓN».

- **6 deportes.** Al empezar eliges deporte y especialidad; los de pago salen con candado hasta tenerlos.
  - ⚽ Fútbol (gratis): goles.
  - 🧗 Escalada: circuito. Cada prueba es de bloque, dificultad o velocidad, y tu especialidad suma. Además, proyectos
    en roca del 6a al 9a, y premios en metálico.
  - 🎾 Tenis: sets al mejor de 3 sobre tierra, dura o hierba. Los viajes cuestan dinero y cansan más.
  - 🏀 Basket: puntos y minutos, sin empates.
  - 🛹 Skate: circuito en street o park; los vídeos suben tu estilo.
  - 🏄 Surf: circuito con olas pequeñas, buenas o grandes (cada tabla tiene su ola); viajes de surf.
  - Cambian ligas, rivales, ofertas, acciones, competiciones, momentos clave, minijuegos, material y el vocabulario
    de toda la interfaz.
- **Negocios de cada deporte** (31): por ejemplo, rocódromo y routesetting en escalada, o academia y pistas en tenis.
  Los grandes piden haber montado antes otro. Una segunda empresa exige que la primera sea rentable; el máximo son 6.
- **5 expansiones** (en «Mi mundo» → Imperio, cuando tienes empresa):
  - 🏟️ **Propietario de club:** participaciones, control con el 51 %, entradas, inversión, estadio, patrocinador.
  - 🏢 **Inmobiliaria:** pisos, locales, parkings, edificios, terrenos, hipotecas (regla del 40 %), reformas y obra
    nueva.
  - 💼 **Agencia:** ojear, firmar promesas, ojeadores, comisiones y ofertas por tus representados.
  - 🎪 **Eventos:** tipo, sede, precio, estrella y retransmisión, con demanda y riesgo.
  - 📺 **Media:** canales, presentador, tono, derechos y documentales.
  - Suman al patrimonio. Si se pierde el acceso, se congelan.
- **🎖️ Prestige: 12 carreras de cargo.** Presidencias mundiales (fútbol, escalada, basket y tenis), de la Liga y de
  la Federación Nacional; seleccionador, director deportivo, agente, árbitro, comentarista y el Comité Mundial.
  - Requisitos jugables; al presentarte te retiras y pasan los años hasta la edad del cargo.
  - Campaña semanal contra un rival, votación (o examen o casting) que **se puede perder**, mandato con aprobación,
    presupuesto, prestigio, decisiones, crisis y eventos, y después reelección.
  - Retirarse del deporte también se puede sin Prestige.
- **Sin pagar para ganar:** las expansiones y el Prestige usan un generador de azar aparte. Un test juega la misma
  partida con y sin todo comprado y sale idéntica.

## P2.5 · Interfaz clara: pasar pantallas

Rediseño solo de la interfaz (la lógica, el equilibrio y los guardados no cambian):
- **Tema claro de día**, sin barra de botones abajo.
- **Semana:** tu personaje en su escenario (barrio, club, empresa, magnate), el objetivo con su barra y **3 botones grandes**
  que dicen exactamente lo que das y recibes (💪 +2,6 · ⚡ −25; «≈» si depende del azar). El resto, en «Más opciones».
  **Un toque juega la semana.**
- **Resultado** a pantalla completa: marcador del partido, números que cambian y «Siguiente semana ▶». «¿Por qué?» opcional.
- **Situaciones**: una pregunta por pantalla y respuestas grandes con lo que implica cada una.
- **Celebraciones** para hitos y novedades (con confeti).
- **Cada semana es distinta**: las acciones básicas tienen 3 o 4 versiones que rotan cada semana (nunca la misma dos
  semanas seguidas), por ejemplo «Sprints en la playa», «Técnica en el parque», «Torneo nocturno 3×3», «Camarero en una boda» o
  «Tarde de consola con Marc». Cada versión está compensada (rinde más y cansa más, o rinde menos y da un extra) y una opción
  sale «🔥 destacada» (+20 %). Datos en `p2/src/17_variedad.js`. El simulador confirma que el equilibrio sigue igual.
- **Minijuegos en los momentos decisivos, con consecuencias como en P1** (`p2/src/18_minijuegos.js`): el día de las pruebas
  (3 tiros), la final del torneo del barrio (3 jugadas) y el penalti del partido decisivo (ascenso, descenso o última jornada:
  elige esquina y chuta). Barra de tiempo: para en el verde.
  - **Penalti**: aciertas → +1 gol para tu equipo (+2 si es perfecto), +8/+12 de confianza, reputación y marca. Fallas → +1 gol
    para el rival (+2 si es un desastre), −12/−18 de confianza, −1,5/−3 de reputación y la prensa encima. Cambia de verdad el
    marcador y la clasificación. Si fallas, no hay confeti.
  - **Pruebas**: −5 … +7 puntos. **Torneo**: −5 … +7 en la final.
  - **Simular**: lo decide tu nivel, como mucho un 80 % de acierto (nunca perfecto). Lo simulado no se puede reintentar.
- **6 minijuegos con dificultad** (`P2.JUEGOS` en `p2/src/18_minijuegos.js`; se dibujan en `20_ui.js`):
  - ⚽ **Toques** (fácil): toca cuando el balón baja a tu pie, 5 toques.
  - 👟 **Pase al desmarcado** (fácil): un compañero queda libre un instante (cada vez menos tiempo); tócalo. Si tocas antes, lo cortan.
  - 🎯 **Disparo preciso** (media): la barra de siempre, 3 disparos cada vez más difíciles.
  - 🧠 **Jugada ensayada** (media): memoriza 4 o 5 flechas y repítelas en orden; un fallo acaba la jugada.
  - 🧤 **Parada imposible** (difícil): el balón sale a un lado; tírate antes de que entre (0,7 → 0,44 s). Si te tiras antes, gol.
  - 🥅 **Penalti** (media): esquina + potencia, en el partido decisivo.
  - Qué juego toca depende de lo que se juega: pruebas → toques, pase o disparo; torneo → pase, toques o jugada;
    promoción y finales → jugada, parada o disparo. Cambia de una vez a otra (sin tocar el azar de la partida) y la
    pantalla de inicio dice el juego y su dificultad. Vidas, anuncio simulado y «Simular» funcionan igual en todos.
- **Lo que te juegas en un minijuego** (`p2/src/19_copas.js`): ahora un minijuego puede decidir la categoría o un título.
  - **Promoción de ascenso**: si acabas justo fuera de los puestos de ascenso, la temporada espera una semana y te juegas
    subir. Ganas → subes; pierdes → te quedas (−5 confianza).
  - **Promoción de permanencia**: si acabas último salvado o primero en descenso. Ganas → te quedas (baja el otro);
    pierdes → bajas.
  - **Final por el título** (en la categoría más alta, si acabas 1º o 2º): campeones o subcampeones.
  - **Copa Federación** (cada temporada): cuartos y semifinal se resuelven solos por nivel; **la final la juegas tú**.
  - **Copa de Europa**: si acabas 1º o 2º en la categoría más alta, la temporada siguiente. Final con minijuego.
  - **Mundial**: si te convocan (nivel 75 y reputación 55), la temporada siguiente. **La final la juegas tú**.
  - Antes de jugar se ve **qué pasa si ganas y si pierdes**. Perder una final: sin título, menos reputación y marca, la
    prensa encima. Ganar: título en «Mi historia», premio, reputación y marca. Sin minijuego (bots, «Simular») lo decide el
    nivel, sin tocar el azar de la partida. Premios moderados: el simulador da como mucho +6 % de patrimonio a 80 semanas.
- **Grandes momentos animados** (pantalla completa, con confeti, antes que nada más): **ascenso** (escalera de categorías con
  tu club subiendo y la prima), **contrato** (el contrato del club con sueldo, duración, prima por victoria y **total del contrato**,
  la firma que se dibuja, el sello «FIRMADO» y la prima de fichaje contando hacia arriba), **renovación**, **compra de negocio**
  (el local abre la persiana y se enciende «ABIERTO», con lo invertido), **título** (copa que cae, lluvia de monedas, premio en
  euros, reputación y marca) y, además, **nuevo patrocinador** (cheque a tu nombre) y **convocatoria con la selección**. La lógica
  y también: **récord de patrimonio** (10.000, 25.000, 50.000, 100.000 €… con torres de billetes), **primera moto o primer coche**
  (el coche entra en la carretera y suenan las llaves), **primera casa** (se abre la puerta y se encienden las luces),
  **venta de una empresa con beneficio** (sello «VENDIDA»), **primera titularidad** (tu camiseta con dorsal bajo los focos),
  **primer gol como profesional**, **MVP** (nota 9 o más, una vez por temporada) y **salvados** en la promoción. La lógica
  solo deja el aviso (`P2.celebrar`, como mucho 6 pendientes); la interfaz lo anima. Con «reducir movimiento» se ve quieto y completo.
- **Vidas** (❤️, máximo 3, como en P1): **un reintento por momento decisivo**, nunca para deshacer una decisión. Se recupera
  1 cada 6 semanas y, sin vidas, con un anuncio simulado (+1, una vez por semana). *Cambio de criterio respecto a P2.4, que
  no tenía vidas: lo pidió el responsable del juego.*
- **🌍 Mi mundo** (botón arriba a la derecha): Perfil, Vida, Tienda, Inversiones, Liga, Marcas, Empresa, Patrimonio, Historia, Hitos y Ajustes, con lo que aún no
  está abierto en gris y su candado. «‹ Jugar» vuelve al juego.

## P2.6 · Cuenta, varias carreras y todos los packs

- **🗂️ Mis carreras** (en «Mi mundo», Ajustes y la pantalla de inicio): 2 carreras gratis a la vez y 3 más con
  «+3 carreras» o el Founder Pack.
  - Cada carrera tiene su ranura: continuar, cambiar el nombre, copiar a otra ranura y borrar (con «Deshacer»).
  - **💾 Guardar y salir**: guarda y te lleva a «Mis carreras». Al volver a abrir el juego sigues en la última carrera
    jugada, justo donde la dejaste. También se guarda al cambiar de pestaña o bloquear el móvil.
  - Una partida de antes de las ranuras aparece sola como «Carrera 1».
  - Si pierdes el pack (reembolso u otra cuenta), las carreras de las ranuras de pago se quedan guardadas y
    bloqueadas: nunca se borran.
- **👤 Cuenta** (gratis y opcional): con Apple, Google o un código de 6 cifras por email. Sin contraseñas.
  - En esta versión todo es simulado: el código sale en una «bandeja de entrada simulada» y no se envía nada.
  - Perfil: nombre visible, país, edad y aceptación de los términos. La edad no se puede cambiar después.
  - Menores: sin ofertas ni publicidad. Menores de 13 años necesitan el permiso de su madre, padre o tutor para
    comprar; lo comprueba también el servidor.
  - ☁️ Carreras en la nube: guardar, traer en otro dispositivo y copia automática. Por ranura gana la copia más
    reciente.
  - Descargar mis datos (JSON), cerrar sesión y eliminar la cuenta (hay que escribir ELIMINAR).
  - Backend real preparado: migración `20261009000000_accounts.sql` y Edge Functions `profile`, `game-saves` y
    `account-export`, con las mismas reglas que el simulado y probadas contra Postgres y Deno.
- **💎 Todos los packs a la venta** (simulados), con su contenido real:
  - **Street:** sudadera, pantalón, zapatillas, gorra, gafas, mochila, fondo urbano y bici Street.
  - **Pro:** outfit, traje casual, maleta, reloj, auriculares, botas, gafas, peinado, dos fondos, coche Pro y pose Pro.
  - **Luxury:** traje, reloj, cadena, gafas, fondos rooftop y premium, decoración de casa y de despacho, coche negro
    mate y pose de empresario.
  - **Magnate:** traje, reloj legendario, fondo skyline, despacho premium, decoración de mansión, deportivo de oro,
    insignia 🏙️ y llave de oro en la vitrina.
  - **Founder:** outfit, insignia, fondo, placa conmemorativa, +3 carreras y sin anuncios obligatorios.
  - **Clubes** (UD Puerto, Real Costa, Atlético Ciudad; solo si juegas en ese club): camiseta, chaqueta, bufanda,
    mochila, fondo, rincón del club en casa y camiseta firmada en la vitrina.
  - **Campeón** (Copa, Copa de Europa, Mundial y Liga; solo si la has ganado): camiseta, botas, trofeo en la mano y
    réplica en casa, fondo, insignia y una celebración especial cuando ganas el título.
  - **Pose** (capa nueva del personaje): «Saludo» y «Brazos abiertos» gratis; Pro, empresario y campeón con su pack.
  - **Garaje:** eliges el aspecto de cada vehículo. **Tu casa** y **Tu despacho** (en Empresa) se decoran; plantas y
    cojines son gratis.
  - Todo es solo aspecto. Si un pack se reembolsa, lo suyo vuelve a lo básico y no se toca nada más.

## P2.5 · Comercio real (arquitectura de producción; aquí, simulado)

Todo el detalle está en [`docs/commerce/`](../docs/commerce/COMMERCE.md): arquitectura, catálogo, Stripe, Apple,
Google, entitlements, expansiones, Prestige Careers, seguridad, pruebas y el [checklist](../docs/commerce/CHECKLIST.md)
para pasar a Stripe TEST y, más adelante, a producción.

- **💎 Premium** (en «Mi mundo»): pestañas Destacados, Packs, Deportes, Expansiones, Prestige, Bundles y Comprado.
  - El precio real tiene un estilo distinto del dinero del juego.
  - Cada ficha dice qué incluye, si es permanente, sus requisitos y si es «solo aspecto».
  - La casilla de desistimiento viene desmarcada y «No, gracias» es igual de visible que «Comprar».
- **Compras simuladas:** el mismo `CommerceService` del servidor corre en el navegador, con un Stripe falso que firma
  los webhooks como el real. No hay red ni cobro.
  - La compra pide una cuenta, abre un checkout de prueba y muestra «Estamos verificando tu compra…» hasta que llega
    el webhook. Entonces sale «¡DESBLOQUEADO!» y el pack se pone solo.
  - «Mis compras» y «Restaurar compras» funcionan aunque borres la caché, porque las compras están en la cuenta, no en
    la partida. También hay códigos promocionales.
- **Pack Debut (0,99 €).** Outfit, botas, gorra, fondo, insignia 🌟 junto a tu semana y balón firmado
  en tu vitrina.
  - «Quitar anuncios» (3,99 €) quita solo los anuncios obligatorios.
  - `sport_climbing` y `prestige_world_football_president` existen como entitlements de prueba.
- **Backend real preparado** (`backend/`): migración PostgreSQL con RLS, Edge Functions de Supabase (checkout, webhook
  de Stripe, entitlements, restaurar, compras, promo, admin, Apple y Google preparados), panel de administración y
  `.env.example`.
  - Build web real: `node p2/build-web.cjs`.
  - Probado contra Postgres real, con las Edge Functions reales en Deno y en navegador.
- **Comprar nunca da ventajas.** Hay un test que juega 60 semanas con todo comprado y la partida sale idéntica, salvo
  lo cosmético.

## P2.4 · Monetization Lab (todo simulado)

Versión para **validar monetización antes de integrar nada real**. No hay AdMob, App Store / Google Play Billing, Stripe,
SDK publicitario, servidor, cuentas, consentimiento publicitario ni moneda premium. El juego no hace ninguna petición de red
(lo comprueba un test). Toda la configuración está en `MONETIZATION` (`p2/src/15_monetizacion.js`): precios, frecuencias,
descuentos, qué se ofrece y si está activo (`activa: false` → el juego queda exactamente igual; `testMode: true` siempre).

**Principio:** juego completo gratis + anuncios voluntarios con recompensa + cosméticos + compras pequeñas y permanentes.
No se venden victorias, nivel, reputación, marca, confianza, contratos, empresas ni dinero del juego; no hay vidas; ningún
anuncio repite una prueba, cambia un partido, evita un descenso o una quiebra, ni borra una decisión. Los objetos que ayudan
a jugar (botas, móvil, coche, vivienda…) se siguen comprando solo con dinero del juego.

**Anuncios con recompensa simulados** («📺 Ver anuncio» → «SIMULACIÓN DE ANUNCIO» → Cancelar / Simular y aceptar):

| Recompensa | Dónde | Qué da | Límite |
|---|---|---|---|
| 🏷️ Cupón de Tienda (prioritario) | En cada objeto de 80 € o más que aún no tienes | −10 % (máx. 600 €) en ese objeto | 1 cada 4 semanas; válido 4 semanas; 1 activo |
| 🎁 Oferta especial | Arriba en la Tienda | Un objeto de tu etapa con −15–25 % (máx. 250 €; precio máx. 200 € en el barrio … 10.000 € de magnate) | 1 cada 6 semanas; válida 3 semanas |
| ⚡ Recuperación patrocinada | Inicio, con menos de 35 de energía | +10 energía (nunca pasa de 100) | 1 cada 8 semanas; nunca en pruebas |
| 🕶️ Cosmético de temporada | Al acabar una temporada (la camiseta es gratis) | Gafas edición temporada (solo estética) | Una por temporada |
| 💼 Bonus de empresa | Preparado, desactivado | Cobrar ×1,25 lo generado fuera de la partida | Cuando existan ingresos offline |

Ninguno se ofrece con una decisión pendiente. Además, máximo 6 por sesión. **Exploit encontrado y cerrado:** comprar un piso
con cupón y venderlo por su valor daba beneficio; ahora el valor sale de lo que pagaste. **Ajuste:** con +15 de energía cada
6 semanas, ver todos los anuncios daba +3 de nivel y +7 % de patrimonio; con +10 cada 8 semanas la diferencia es ruido.

**Compras simuladas** (`IAP_PRODUCTS`): al tocar sale «🧪 PRUEBA DE COMPRA · costaría X € · No se realizará ningún cargo ·
¿Lo comprarías? No / Quizá / Sí». No se entrega nada (`entregarCosmeticos: false`), solo se mide la intención.

| Producto | Precio | Cuándo aparece | Contenido |
|---|---|---|---|
| 🎉 Pack Debut | 0,99 € | Tras firmar el primer contrato | Outfit, botas, gorra y fondo «Debut» |
| 🛹 Pack Street | 1,99 € | Al ser titular | Sudadera, pantalón cargo, zapatillas, gorra, fondo urbano |
| ⚡ Pack Pro | 2,99 € | Primer patrocinador | Outfit, reloj, peinado, gafas, fondo de estadio, botas |
| 💎 Pack Luxury | 3,99 € | Primera empresa | Traje, reloj premium, cadena, fondo premium, aspecto negro mate del deportivo |
| ⭐ Founder Pack | 4,99 € | Empresa rentable y 25 min jugados | Sin anuncios obligatorios, insignia, outfit, fondo, +3 carreras |
| 🚫 Sin anuncios | 2,99 € | En el anuncio obligatorio y en Ajustes | Quita solo los obligatorios (los voluntarios siguen) |
| 💾 +3 carreras | 1,99 € | Ajustes | Solo medir interés (no se limita nada) |

Las ofertas solo salen en momentos buenos (máx. 2 por sesión, 1 cada 4 semanas, una vez cada una) y nunca tras perder,
lesión, crisis, sin dinero o durante una decisión. **Test A/B local:** al crear la partida se asigna A (solo anuncios),
B (anuncios + Pack Debut + Sin anuncios) o C (anuncios + todos los packs, con «⭐ Estilo premium» en la Tienda). No cambia la dificultad.

**Anuncio obligatorio simulado:** solo al final de temporada o de capítulo, como mucho uno cada 12 minutos reales, nunca
tras cada semana, partido o compra. «En la versión gratuita aquí aparecería un anuncio breve. [Continuar]». No hay banners.

**Deseo y posesiones:** escalera de la Tienda visible desde el principio (superdeportivo, ático, villa y mansión como
«Próximamente»), rareza solo visual, **❤️ Quiero esto** (un objetivo en Inicio con barra y aviso «¡YA PUEDES COMPRARLO!» una
vez, sin comprar solo), ropa y accesorios que se ponen solos en el personaje, tu vivienda como fondo de Inicio y Perfil, tu
vehículo en escena, **🚗 Garaje** (activo, anteriores, valor, aspectos), **🏆 Colecciones** (Street, Profesional, Lujo → fondo),
**🏆 Mi historia** (Perfil), regalos y planes con tu gente (dinero del juego) y 4 situaciones que llegan por lo que compras.

**🧍 Personaje con muchas más opciones** (mismo estilo plano): 20 capas en 5 grupos (Cara, Pelo, Cuerpo, Ropa, Extras) y
más de 180 opciones. Nuevas: edad (joven, adulto/a, maduro/a, veterano/a, con arrugas y canas), forma y color de ojos,
cejas, rasgos (lunar, cicatriz, hoyuelos, ojeras, pecas, mejillas rojas, lágrima tatuada), piercings (oreja, varios, nariz,
septum, ceja, labio), complexión (delgada, normal, atlética, fuerte), tatuajes (estrella, rosa, brazo entero, tribales,
cuello, mano, los dos brazos), 5 peinados y 4 colores de pelo más, y 10 tonos de piel. Las opciones de la cara se ven con
zoom en el editor. Todo es estética: no cambia nada del juego. Las personas de «Vida» también usan estas opciones.

**📈 Inversiones desbloqueables** (Imperio → Inversiones, visible desde el principio): el camino de deportista a empresario
como una escalera. 1) Peluquería en traspaso (se abre con las mismas reglas que Empresa: primer patrocinador o 10 partidos
como profesional), 2) segunda inversión, eliges una (local propio, segunda peluquería o socio en la cafetería; se abre con la
empresa rentable 6 semanas) y 3) más adelante, como «Próximamente»: restaurante, cadena de gimnasios, pisos en alquiler y
comprar un club. Cada una enseña su estado (🔒 bloqueada / 🔓 disponible / ✅ tuya / elegiste otra), lo que falta para
abrirla y cuánto dinero llevas reunido. No cambia ninguna regla ni ningún precio.

**Informe de prueba:** nueva sección MONETIZACIÓN (variante, anuncios ofrecidos/pulsados/aceptados por tipo, cada compra
simulada con sí/quizá/no, primer clic, anuncio obligatorio y posible abandono, deseos, gasto en Tienda y % de ingresos) y
7 preguntas nuevas (incluida la experimental sobre deportes nuevos).

**Simulación** (20 partidas por perfil, 100 semanas; con la monetización apagada todo es idéntico a P2.3):

| Perfil | Empresa (sem.) | Capítulo | Patrimonio sem. 80 | Gastado en Tienda | Anuncios vistos | Nivel |
|---|---|---|---|---|---|---|
| Ahorrador | 35,2 | 100 % (sem. 42,7) | 76.900 € | 0 € | 0 | 75,7 |
| Inversor (empresa agresiva) | 29,9 | 100 % (sem. 37,3) | 62.000 € | 0 € | 0 | 75,6 |
| Consumidor moderado | 47,3 | 100 % (sem. 55,2) | 44.300 € | 35.000 € | 0 | 76,7 |
| Caprichoso | 53,1 | 100 % (sem. 62,0) | 38.900 € | 45.400 € | 0 | 76,9 |
| Moderado + anuncios a veces | 47,5 | 100 % (sem. 55,3) | 41.700 € | 34.300 € | 5 | 75,1 |
| Moderado + todos los anuncios | 46,4 | 100 % (sem. 55,0) | 40.300 € | 34.100 € | 22 | 77,5 |
| Ahorrador + todos los anuncios | 35,5 | 100 % (sem. 43,0) | 74.600 € | 14.800 € | 22 | 77,0 |

Ver todos los anuncios no da una ruta superior: el capítulo llega igual y el patrimonio no sube (las ofertas incluso hacen
gastar algo más).

## P2.3 · Identidad visual, Tienda y Relaciones

Misma lógica, mismo balance deportivo y empresarial que P2.2. Cambia cómo se ve y vuelve «la vida» del personaje.

**Aspecto de juego móvil (sin verde):** azul noche y morado oscuro con degradados, azul eléctrico de acento, oro para dinero
y recompensas, y un color por categoría: deporte (azul), relaciones (rosa), empresa (turquesa) y tienda (magenta).
Fondo SVG por etapa, sin imágenes externas: **barrio** (edificios, campo y plaza), **club** (estadio y focos),
**empresa** (skyline nocturno) y **magnate** (skyline dorado). El inicio enseña tu personaje en su escenario, el objetivo
(siguiente hito) con barra de progreso, el dinero y el patrimonio, y accesos grandes a Relaciones, Tienda, Empresa y Liga.

**Navegación:** 4 botones grandes abajo al empezar y 5 desde que firmas. Dentro de cada uno, pestañas:

| Botón | Secciones | Cuándo aparecen |
|---|---|---|
| 🏠 Inicio | La semana | Siempre |
| ⚽ Carrera | Liga · Marcas | Al firmar tu primer contrato (antes no sale el botón) |
| ❤️ Vida | Relaciones | Siempre |
| 💼 Imperio | Tienda · Inversiones · Empresa · Patrimonio | Tienda y Patrimonio siempre; Empresa al abrirse el mercado |
| 🧍 Perfil | Personaje · Hitos · Ajustes | Siempre |

Empresa sigue llegando con las mismas reglas (primer patrocinador, o 10 partidos como profesional) y ahora se anuncia
con una tarjeta grande **«🔓 NUEVO: EMPRESA»**. Peluquería, caja, empleados, sueldos, precios, publicidad, préstamos,
crisis, valoración y segunda inversión no cambian.

**🛍️ Tienda** (`13_tienda.js`, datos en `PRODUCTOS`): 7 categorías (ropa, accesorios, tecnología, vehículos, vivienda,
ocio, equipamiento), unos 25 productos con precios que crecen con la carrera (los caros piden un hito). La mayoría son
colección; algunos ayudan un poco y con sentido: botas (+3–6 % entreno), móvil (+5–15 % a prensa y redes), vehículo y
pistola de masaje (+1–3 de energía por semana), piso propio (−25 €/semana de gastos). Nada es necesario para competir.
Los caros (500 € o más) se confirman con un segundo toque. Al comprar sale **«🎉 NUEVA COMPRA»**. Vehículos, vivienda y
joyas son **patrimoniales** (guardan `precioCompra` y `valorActual`, suman al patrimonio y se pueden vender por su valor);
lo demás es gasto. Algunas prendas desbloquean ropa del personaje. **Tus cosas** enseña vehículo, vivienda, móvil, calzado
y tu colección. El dinero disponible y el patrimonio se ven por separado (sección **Patrimonio**).

**❤️ Relaciones** (`14_relaciones.js`, datos en `RELACIONES` y `EVENTOS_RELACION`): madre, padre, Marc (mejor amigo) y Dani
desde el principio; Iker (compañero) y el míster al fichar (el valor del míster es su confianza); Sonia (representante)
cuando tienes agente; pareja y contactos se ven bloqueados («más adelante»). Cada tarjeta: cara, nombre, papel,
❤️ valor/100, estado («Confía mucho en ti»…) y los dos últimos motivos de cambio. **No hay botón de «hablar», ni
mantenimiento semanal, ni pérdida automática**: solo cambian con decisiones en situaciones (un 30 % de las semanas sin
otra decisión). Varias tienen consecuencias semanas después, y el juego dice de dónde vienen: prestar 200 € a Marc → te
los devuelve (si seguís bien) y luego te presenta a Pilar, que traspasa su peluquería 800 € más barata; ayudar a Iker →
un partido en el que te busca (más opciones de jugar y +0,5 de nota); prometer a tu padre que lo conseguirás → orgullo
o decepción; negarte a la comisión de Sonia → puede dejarte. Con Sonia a 70 o más, tus renovaciones mejoran un poco.

**Simulador:** nueva dimensión de consumo (`ahorra`, `gasta`, `caprichos`) con la equilibrada, 40 partidas, 100 semanas:

| Consumo | Gastado en tienda | Empresa (semana) | Capítulo | Patrimonio sem. 80 |
|---|---|---|---|---|
| Ahorra | 0 € | 35,7 | 100 % (sem. 43) | 74.400 € |
| Gasta (colchón 1.500 €) | 33.000 € | 47,4 | 100 % (sem. 55) | 43.300 € |
| Caprichos | 46.600 € | 52,9 | 100 % (sem. 62) | 41.900 € |

Comprar retrasa la empresa y el patrimonio, pero no impide progresar: «¿me compro el coche o guardo para la empresa?».

**Guardado:** mismo `saveVersion 2`. Una partida de P2.2 se carga sin perder nada: se añaden inventario, relaciones y las
secciones nuevas (sin avisos de «nuevo»).

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

## P2.2: lista para pruebas con personas (versión final del fútbol)

> **Estado: congelado.** P2.2 es la última iteración del prototipo de fútbol antes de empezar el de escalada.
> No añade negocios, categorías ni funciones grandes: solo claridad, decisiones con patrocinadores, tres
> variables separadas y telemetría local para pruebas.

### Cómo hacer una prueba con una persona

1. Pásale el enlace o `del_barrio_p2.html` y no le expliques casi nada.
2. Que juegue 20–30 minutos. Si lo deja antes, también es información.
3. Al terminar: ⚙️ **Ajustes → 🧪 Informe de prueba**. Responde las 8 preguntas (opcionales), pulsa «Generar informe»
   y «Copiar el informe». Te lo manda por mensaje. Cada partida tiene un código anónimo (`TEST-A4F72`) para distinguir informes.
4. Nada sale del navegador: no hay servidor, ni analítica, ni cuentas. El informe no incluye el nombre del personaje.

### 1. Tres variables distintas

| Variable | Qué es | Cómo sube | Para qué sirve |
|---|---|---|---|
| 💪 **Nivel** | Qué buen futbolista eres | Entrenar, preparador, entrenamientos del club (según el club), experiencia | Convocatoria, nota, ofertas, marcas deportivas |
| ⭐ **Reputación deportiva** | Lo reconocido que eres en el fútbol | Plaza, torneo y jornada abierta; notas, titularidad, goles, categoría (exposición), ascensos | Ojeadores, pruebas, valor de mercado, requisito de marcas grandes y techo de tu marca |
| 📣 **Marca personal** | Lo atractivo que eres para marcas, medios y clientes | Prensa y redes, entrevistas, actos y campañas, firmar marcas, clínic, partidos muy visibles (nota 7,5+ en categorías con público), ascensos | Requisitos de patrocinadores, clientes de tu negocio (+0,4 % por punto), influencers |

- **Techo comercial suave:** 30 + reputación deportiva. Por encima, lo comercial rinde solo un 15 % y la marca se
  desinfla poco a poco. Un jugador malo no llega a una marca enorme solo con actos, pero se puede ser bastante más
  comercial que buen jugador.
- **Medido con bots (90 semanas):**
  - Entrenar sin marcas: nivel 84, reputación 96 y marca 54 (el «Jugador A»).
  - Ruta imagen con marcas: nivel 55, reputación 43 y marca 73 (el «Jugador B»).
- Las tres se ven en «Liga» y «Marcas». La cabecera muestra 💶 ⚡ ⭐, y 📣 cuando ya hay patrocinadores.

### 2. Patrocinadores con identidad

| Marca | Tipo | Paga | Carga de actos | Qué aporta (efecto creíble) | Requisitos |
|---|---|---|---|---|---|
| 🥖 Panadería Ríos | Local (comercio) | 150 € + 25 €/sem, 14 sem. | 1 cada 6 sem. | Te manda clientes: +6 % de demanda en tu negocio | Marca 6 |
| 🔧 Talleres Costa | Local (motor) | 300 € + 55 €/sem, 10 sem. | 1 cada 3 sem. | Contactos de empresa: −40 €/sem de gastos fijos del negocio | Marca 14 |
| 👟 Kinetic Sport | Deportiva (material) | 800 € + 90 €/sem, 28 sem. | 1 cada 6 sem. | Entrenas un 25 % mejor, +4 de energía por semana, −25 % de lesiones, techo de nivel +3 | Marca 18, reputación 30, nivel 55, 3 titularidades |
| ⚡ Vértice Energy | Deportiva (bebida) | 1.500 € + 170 €/sem, 14 sem. | 1 cada 3 sem. | Escaparate: +30 % de interés de clubes y más marca por partidos visibles | Marca 32, reputación 35 |
| 📡 Nova Telecom | Grande (telecom) | 4.000 € + 260 €/sem, 18 sem. | 1 cada 4 sem. (+3 de marca por campaña) | Contactos con bancos: préstamos e hipoteca un 30 % más baratos | Marca 60, reputación 50, jugar en Segunda o más arriba |

- **Por qué elegir:**
  - máximo 2 contratos;
  - dos del mismo sector no conviven y Nova no admite marcas locales;
  - cada acto ocupa la semana, cansa (−10 de energía) y al míster no le gusta que faltes al entreno (−2 de confianza);
  - duraciones y objetivos distintos;
  - romper por faltas hace perder la marca para siempre.
- Ejemplo de dilema:
  - **Vértice:** más dinero y escaparate, pero un acto cada 3 semanas.
  - **Kinetic:** paga menos y te hace mejor jugador.
- **Las marcas te llaman:** cuando cumples los requisitos, llega una decisión con su identidad: firmar, cambiar una marca por otra (si chocan o estás al máximo) o decir que no. Puedes firmarla después en «Marcas».
- **Efecto en la partida** (equilibrada, gestión inteligente, 100 semanas): sin marcas 100.124 € · solo Kinetic +25 % ·
  solo Vértice +29 %.
  - Kinetic da más nivel a mitad de partida (76,7 frente a 74,9 en la semana 60) y mejor sueldo final (916 € frente a 865 €).
  - Vértice da más marca (77 frente a 69) y algo más de patrimonio.
  - Al cerrar el capítulo (semana ~42) la diferencia es todavía pequeña: los patrocinadores rinden a medio plazo.

### 3. Telemetría local e informe

Se guarda en la partida:
- **Tiempo y ritmo:** fecha y hora de inicio; tiempo real jugado (sin pausas de más de 5 minutos); semanas; toques; tiempo entre decisiones.
- **Lo que hace cada semana:** acciones semanales; decisiones y opción elegida; caminos de captación y semana de la invitación.
- **Carrera:** pruebas y puntuación; ofertas recibidas; club elegido; contratos y renovaciones; partidos y titularidades; ascensos y descensos.
- **Patrocinadores:** vistos, firmados, rechazados y dejados; actos cumplidos, aplazados y rechazados.
- **Empresa:**
  - compra, caja inicial y mejora inicial;
  - cambios de precio, plantilla, sueldos y publicidad;
  - aportes y retiradas; crisis; préstamos; venta o cierre;
  - semana de rentabilidad y segunda inversión.
- **Uso de la interfaz:** pestañas visitadas; consultas de «¿Por qué ha pasado esto?»; última pantalla y última acción (momento de salida).
- **Momentos clave T0–T7:** inicio, primera prueba, primer contrato, primera titularidad, primer patrocinador,
  primera empresa, empresa rentable, segunda inversión. Cada uno con tiempo real y semana de juego.

El informe añade las 8 preguntas (escala 1–10, textos, opciones múltiples y sí/quizá/no) con sus respuestas.

### 4. Ritmo en el móvil

- **Pantalla Semana:** situación → decisión → botón «Jugar semana» (siempre visible abajo) → consecuencia.
- **Acciones:** se ven en una línea (qué ganas); al elegir una se despliegan su coste y su riesgo.
- **Consecuencia:** primero el resumen (dinero, energía, nota) y las 4 primeras líneas; el resto, en «Ver más».
  Las fórmulas siguen en «¿Por qué ha pasado esto?».
- **Navegación progresiva intacta:** cada sección nueva se anuncia al desbloquearse y lleva «Nuevo» hasta que la visitas.
- **Sin esperas ni límites:** no hay esperas reales, energía por tiempo, anuncios ni compras.

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

`node tests/p2.test.cjs` (alrededor de un minuto; `--rapido` se salta la interfaz): **470 de 470 comprobaciones superadas**.

- **Las de P2 y P2.1** (ver arriba).
- **Nuevas de P2.2:**
  - prensa sube la marca y no el nivel ni la reputación; entrenar sube el nivel y no las otras dos; la plaza sube la reputación y no la marca;
  - techo comercial ligado a la reputación;
  - los perfiles «gran jugador poco comercial» y «más comercial que futbolista» salen jugando;
  - efectos de los patrocinadores: clientes, gastos fijos, entrenamiento y techo de nivel, sin «+10 de nivel por unas botas»;
  - exclusividades;
  - la gran marca solo en categorías altas;
  - las ofertas llegan como decisión y el rechazo queda registrado;
  - los actos cuestan energía y confianza;
  - ID anónimo `TEST-XXXXX`; la duración real no cuenta pausas largas;
  - se registran acciones, decisiones, momentos T1–T7, prueba, club, partidos, empresa y segunda inversión;
  - el informe tiene todas las secciones y las respuestas, y no incluye el nombre del personaje.
- **Interfaz:** el informe se genera en Ajustes con ID, duración, pantallas visitadas y respuestas.

## 6. Problemas conocidos y límites

- El balance está probado con bots, no con personas. Para eso es P2.2: la duración de 20–30 minutos está por medir.
- **Ruta «imagen + empresa»:** a 80 semanas tiene algo más de patrimonio que la equilibrada con patrocinadores máximos
  (98.877 € frente a 94.670 €). A 100 semanas ya queda por debajo. Su coste está sobre todo en sueldo (268 € frente a 881 €),
  categoría y nivel. Es una elección legítima y no la mejor a largo plazo, pero la diferencia en dinero es moderada.
- **Patrocinadores:** rinden a medio plazo. Al cerrar el capítulo (semana ~42) el patrimonio con o sin marcas
  varía poco (15.534 € / 16.076 € / 16.666 €); a 100 semanas, un 25–40 % más.
- **Kinetic frente a Vértice:** la diferencia deportiva existe, pero es pequeña (unos 2 puntos de nivel en la semana 60).
- **Caja de 3.000 € y de 5.500 €:** con el gestor inteligente acaban casi igual a 80 semanas (81.513 € frente a 81.296 €). La de 1.500 € compra
  antes, con crisis y menos patrimonio.
- **Tiempo real en el informe:** se mide entre toques. Si alguien lee mucho rato sin tocar nada (más de 5 minutos), ese tramo no cuenta.
- **Telemetría dentro de la partida:** si el tester borra la partida o usa «Empezar una nueva vida», empieza una telemetría nueva.
- **Economía de final de partida grande** (90.000–145.000 € hacia la semana 80–100). El capítulo acaba hacia la semana 42.
- La confianza del míster se satura en 100 con buenas notas.
- Tras el capítulo 1 se puede seguir jugando, pero no hay contenido nuevo.
