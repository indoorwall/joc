# Futbol + tycoon — prototips

- **P2.4 — Monetization Lab totalmente simulado (anuncios con recompensa, compras de prueba de intención, test A/B local, lista de deseos, garaje, colecciones, Mi historia)**: sin anuncios ni pagos reales; ver [`p2/LEEME.md`](p2/LEEME.md).
- **P2.3 — Nueva identidad visual de juego móvil (azul noche, morado y oro, fondos por etapa), navegación en botones grandes (Inicio, Carrera, Vida, Imperio, Perfil), 🛍️ Tienda (gasto opcional, posesiones con valor) y ❤️ Relaciones (decisiones con consecuencias diferidas)**: ver [`p2/LEEME.md`](p2/LEEME.md).
- **P2.2 — Del barrio al negocio, capítulo 1 (fútbol, congelado para pruebas con personas)**: nivel, reputación deportiva y marca personal separados; patrocinadores con identidad y exclusividades; telemetría local con «Informe de prueba» en Ajustes; juego de gestión por decisiones, del barrio a tu primera
  empresa: 8 semanas de captación con varios caminos a las pruebas, ofertas según la puntuación (UD Puerto o Atlético, filosofías
  distintas), liga de 8 equipos con contexto, patrocinios como contratos, peluquería con caja separada, contexto cambiante y
  crisis, hitos que abren funciones, guardado v2 con migración desde P1 y simulador de balance.
  [`p2/del_barrio_p2.html`](p2/del_barrio_p2.html) · diseño, balance y pruebas en [`p2/LEEME.md`](p2/LEEME.md) · código en [`p2/src/`](p2/src)
- **P1 — Del barrio al negocio (prototipo anterior)**: simulador de vida de un deportista (fútbol, baloncesto, escalada, skate, surf o boxeo; con zonas, grados y competiciones reales), vertical para
  iPhone, con formato de juego (HUD, escena, fichas de mañana, tarde y noche y botón «Jugar semana») y 10 pantallas; patrocinadores con nombres de guiño (Rayo Energy, Trébol…) y obligaciones; avatar por capas con tienda; toques de humor; mejoras en las que gastar el dinero (entrenador, fisio, material, caprichos); números rojos con carta del banco, intereses, embargo y quiebra; minijuegos en los momentos decisivos (ascenso, título, finales, clasificatorio para los Juegos) con vidas y consecuencias si fallas, estadios y escenarios que crecen con tu división o competición (5 niveles por deporte, personalizados con tu club, tus marcas y tu nombre), estado de forma, fama y redes sociales, momentos clave, retos, rival, mentor y periodista, salón de la fama, siguiente generación, sonido y tarjeta de temporada; imprevistos, relaciones, hijos, retirada,
  actividades y bienes (9 negocios realistas, cada uno con sus propias mejoras, opciones y acciones; casas con hipoteca, coches y clubes de fútbol) en un mundo de 6 países y 21
  divisiones ficticias.
  [`p1/carrera_p1.html`](p1/carrera_p1.html) · instrucciones y reglas en [`p1/LEEME.md`](p1/LEEME.md)
- **P0 — Jugada interactiva** (descartado por el cambio de dirección; se conserva como referencia):
  [`p0/futbol_p0.html`](p0/futbol_p0.html) · instruccions a [`p0/LLEGEIX-ME.md`](p0/LLEGEIX-ME.md)

Pruebas automáticas (opcional, para desarrollo; necesitan Playwright con Chromium):
`node tests/p2.test.cjs` · `node tests/p1.test.cjs` · `node tests/p0.test.cjs`
