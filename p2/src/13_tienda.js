/* =====================================================================
   13 · TIENDA: disfrutar de lo que ganas (y un sumidero de dinero)
   Data-driven: añadir un producto es añadir una entrada a PRODUCTOS.
   La mayoría son colección o personalización. Algunos tienen un efecto pequeño y
   coherente (botas → entreno, móvil → redes, vehículo/vivienda → descanso), nunca
   imprescindible para competir. Los patrimoniales guardan precioCompra y valorActual
   (sin depreciación todavía) y suman al patrimonio.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, r1, eur } = P2;

  const CATEGORIAS_TIENDA = [
    { id: 'ropa', ic: '👕', n: 'Ropa' }, { id: 'accesorios', ic: '⌚', n: 'Accesorios' }, { id: 'tecnologia', ic: '📱', n: 'Tecnología' },
    { id: 'vehiculos', ic: '🚗', n: 'Vehículos' }, { id: 'vivienda', ic: '🏠', n: 'Vivienda' }, { id: 'ocio', ic: '🎮', n: 'Ocio' }, { id: 'equipamiento', ic: '⚽', n: 'Equipamiento' },
  ];
  // req: hito necesario (los precios crecen con la carrera) · slot: lo que llevas «puesto» (uno por hueco)
  // patrimonial: fracción del precio que conserva como valor · consumible: se gasta (y puedes repetir tras «enfria» semanas)
  // ef (pequeños): entreno · prensa (marca por prensa y redes) · recuperacion (energía/semana) · gastosVida (−€/semana como profesional)
  // look: prendas del avatar que desbloquea
  const PRODUCTOS = [
    // 👕 Ropa
    { id: 'camiseta', cat: 'ropa', ic: '👕', n: 'Camiseta de tu equipo favorito', precio: 25, rareza: 'comun', look: ['ropa:equipoFav'], d: 'Para ir a la plaza con estilo.' },
    { id: 'chandal', cat: 'ropa', ic: '🧥', n: 'Chándal de marca', precio: 90, rareza: 'comun', look: ['ropa:chandalMarca', 'pantalon:chandal'], d: 'El de los entrenamientos buenos.' },
    { id: 'outfit', cat: 'ropa', ic: '🤵', n: 'Outfit premium', precio: 650, rareza: 'raro', req: { hito: 'contrato' }, look: ['ropa:traje', 'pantalon:traje'], d: 'Para entrevistas y eventos. Desbloquea el traje en tu personaje.' },
    // ⌚ Accesorios
    { id: 'gorra', cat: 'accesorios', ic: '🧢', n: 'Gorra', precio: 30, rareza: 'comun', look: ['cabeza:gorraPlana'], d: 'Colección.' },
    { id: 'relojDep', cat: 'accesorios', ic: '⌚', n: 'Reloj deportivo', precio: 180, rareza: 'comun', look: ['extra:relojDep'], d: 'Cuenta pasos, mide pulsaciones y queda bien.' },
    { id: 'cadena', cat: 'accesorios', ic: '📿', n: 'Cadena de oro', precio: 3000, rareza: 'epico', req: { hito: 'empresa' }, patrimonial: 0.6, look: ['extra:cadena'], d: 'Un capricho que conserva parte de su valor.' },
    { id: 'relojLujo', cat: 'accesorios', ic: '💎', n: 'Reloj de lujo', precio: 9000, rareza: 'legendario', req: { hito: 'rentable' }, patrimonial: 0.7, look: ['extra:reloj'], d: 'De los que se heredan.' },
    // 📱 Tecnología
    { id: 'movilBasico', cat: 'tecnologia', ic: '📱', n: 'Móvil básico', precio: 120, rareza: 'comun', slot: 'movil', ef: { prensa: 0.05 }, d: 'Fotos decentes: tu prensa y redes rinden un 5 % más.' },
    { id: 'movilBueno', cat: 'tecnologia', ic: '📲', n: 'Móvil bueno', precio: 450, rareza: 'raro', req: { hito: 'contrato' }, slot: 'movil', ef: { prensa: 0.1 }, d: 'Tus redes rinden un 10 % más.' },
    { id: 'movilPremium', cat: 'tecnologia', ic: '🤳', n: 'Móvil premium', precio: 1300, rareza: 'epico', req: { hito: 'titular' }, slot: 'movil', ef: { prensa: 0.15 }, d: 'Tus redes rinden un 15 % más.' },
    // 🚗 Vehículos
    { id: 'bici', cat: 'vehiculos', ic: '🚲', n: 'Bicicleta', precio: 180, rareza: 'comun', slot: 'vehiculo', patrimonial: 0.5, ef: { recuperacion: 1 }, d: 'Llegas antes a todo: +1 de energía por semana.' },
    { id: 'moto', cat: 'vehiculos', ic: '🛵', n: 'Moto', precio: 1900, rareza: 'raro', req: { hito: 'contrato' }, slot: 'vehiculo', patrimonial: 0.6, ef: { recuperacion: 2 }, d: 'Menos autobús: +2 de energía por semana.' },
    { id: 'cocheUsado', cat: 'vehiculos', ic: '🚗', n: 'Coche de segunda mano', precio: 5200, rareza: 'raro', req: { hito: 'titular' }, slot: 'vehiculo', patrimonial: 0.65, ef: { recuperacion: 3 }, d: 'Tu primer coche: +3 de energía por semana.' },
    { id: 'superdeportivo', cat: 'vehiculos', ic: '🚀', n: 'Superdeportivo', precio: 180000, rareza: 'legendario', proximamente: true, d: 'Para cuando seas magnate de verdad.' },
    { id: 'deportivo', cat: 'vehiculos', ic: '🏎️', n: 'Coche deportivo', precio: 32000, rareza: 'legendario', req: { hito: 'inversion2' }, slot: 'vehiculo', patrimonial: 0.7, ef: { recuperacion: 3 }, d: 'Cuando seas magnate.' },
    // 🏠 Vivienda (la habitación en casa de tus padres la tienes desde el principio)
    { id: 'habitacion', cat: 'vivienda', ic: '🛏️', n: 'Habitación en casa familiar', precio: 0, slot: 'vivienda', inicial: true, d: 'Gratis… y con tus padres al lado.' },
    { id: 'piso', cat: 'vivienda', ic: '🏢', n: 'Piso pequeño', precio: 16000, rareza: 'epico', req: { hito: 'empresa' }, slot: 'vivienda', patrimonial: 1, ef: { gastosVida: 25, recuperacion: 2 }, d: 'Tuyo: −25 € de gastos a la semana, descansas mejor y vale lo que pagaste.' },
    { id: 'casaPremium', cat: 'vivienda', ic: '🏡', n: 'Vivienda premium', precio: 65000, rareza: 'legendario', req: { hito: 'inversion2' }, slot: 'vivienda', patrimonial: 1, ef: { gastosVida: 40, recuperacion: 4 }, d: 'Con jardín y gimnasio.' },
    { id: 'atico', cat: 'vivienda', ic: '🌇', n: 'Ático con vistas', precio: 250000, rareza: 'legendario', proximamente: true, d: 'La ciudad a tus pies.' },
    { id: 'villa', cat: 'vivienda', ic: '🏝️', n: 'Villa junto al mar', precio: 600000, rareza: 'legendario', proximamente: true, d: 'Capítulos futuros.' },
    { id: 'mansion', cat: 'vivienda', ic: '🏰', n: 'Mansión', precio: 1500000, rareza: 'legendario', proximamente: true, d: 'El final del camino… o no.' },
    // 🎮 Ocio
    { id: 'consola', cat: 'ocio', ic: '🎮', n: 'Videoconsola', precio: 350, rareza: 'raro', d: 'Colección. Las tardes de domingo son tuyas.' },
    { id: 'escapada', cat: 'ocio', ic: '🏖️', n: 'Escapada de fin de semana', precio: 700, consumible: true, enfria: 8, usar: { energia: 40, rel: { marc: 3, madre: 2 } }, d: '+40 de energía. Te llevas a Marc. Se puede repetir cada 8 semanas.' },
    { id: 'cenaEquipo', cat: 'ocio', ic: '🍝', n: 'Invitar a cenar al equipo', precio: 250, req: { hito: 'contrato' }, consumible: true, enfria: 10, usar: { rel: { iker: 6 }, confianza: 2 }, d: 'El vestuario lo agradece (+2 confianza del míster). Cada 10 semanas.' },
    // Regalos y planes con tu gente (dinero del juego; nunca dinero real)
    { id: 'regaloMadre', cat: 'ocio', ic: '💐', n: 'Regalo para tu madre', precio: 120, rareza: 'comun', consumible: true, enfria: 10, usar: { rel: { madre: 5 } }, d: '+5 con tu madre. Cada 10 semanas.' },
    { id: 'cenaMarc', cat: 'ocio', ic: '🍔', n: 'Cena con Marc', precio: 60, rareza: 'comun', consumible: true, enfria: 6, usar: { rel: { marc: 4 } }, d: '+4 con Marc. Cada 6 semanas.' },
    { id: 'entradas', cat: 'ocio', ic: '🎟️', n: 'Entradas para un concierto', precio: 150, rareza: 'raro', consumible: true, enfria: 12, usar: { rel: { padre: 4, dani: 4 } }, d: 'Con tu padre y Dani: +4 con cada uno. Cada 12 semanas.' },
    // ⚽ Equipamiento deportivo
    { id: 'botas', cat: 'equipamiento', ic: '👟', n: 'Botas buenas', precio: 95, rareza: 'comun', look: ['calzado:botas'], slot: 'calzado', ef: { entreno: 0.03 }, d: 'Más cómodas: entrenas un 3 % mejor.' },
    { id: 'botasPro', cat: 'equipamiento', ic: '⚡', n: 'Botas profesionales', precio: 420, rareza: 'raro', look: ['calzado:botasPro'], req: { hito: 'contrato' }, slot: 'calzado', ef: { entreno: 0.06 }, d: 'Entrenas un 6 % mejor.' },
    { id: 'masaje', cat: 'equipamiento', ic: '💆', n: 'Pistola de masaje', precio: 260, ef: { recuperacion: 2 }, d: '+2 de energía por semana.' },
    { id: 'gimnasio', cat: 'equipamiento', ic: '🏋️', n: 'Gimnasio en casa', precio: 2600, rareza: 'epico', req: { posee: 'piso' }, patrimonial: 0.5, ef: { entreno: 0.05 }, d: 'Necesitas tu propio piso. Entrenas un 5 % mejor.' },
  ];
  const producto = id => PRODUCTOS.find(p => p.id === id);
  const inventario = s => (Array.isArray(s.inventario) ? s.inventario : (s.inventario = []));
  const posee = (s, id) => inventario(s).some(x => x.id === id) || (producto(id) && producto(id).inicial);
  // Lo que llevas «puesto» en cada hueco (vehículo, vivienda, móvil, calzado)
  const equipado = (s, slot) => { const e = (s.equipado || {})[slot]; return e ? producto(e) : PRODUCTOS.find(p => p.slot === slot && p.inicial) || null; };

  // Precio para ti: el de la lista, o con el cupón / la oferta especial que hayas conseguido (Monetization Lab)
  const precioPara = (s, P) => (P2.precioConDescuento ? P2.precioConDescuento(s, P) : P.precio);
  function bloqueoProducto(s, P, sinDinero) {
    if (!P) return 'No existe.';
    if (P.inicial) return 'Ya lo tienes.';
    if (P.proximamente) return 'Próximamente';
    if (!P.consumible && posee(s, P.id)) return 'Ya es tuyo.';
    if (P.req && P.req.hito && !(s.hitos && s.hitos[P.req.hito])) { const H = P2.HITOS.find(h => h.id === P.req.hito); return `Se desbloquea con: ${H ? H.n.toLowerCase() : P.req.hito}`; }
    if (P.req && P.req.posee && !posee(s, P.req.posee)) return `Necesitas: ${producto(P.req.posee).n.toLowerCase()}`;
    if (P.consumible && P.enfria) { const u = (s.usoTienda || {})[P.id]; if (u != null && s.semana - u < P.enfria) return `Otra vez en ${P.enfria - (s.semana - u)} semanas.`; }
    if (!sinDinero && s.p.dinero < precioPara(s, P)) return `Te faltan ${eur(precioPara(s, P) - s.p.dinero)}.`;
    return null;
  }
  // Comprar: el dinero se resta una sola vez; lo único no se compra dos veces
  function comprar(s, id) {
    const P = producto(id); if (bloqueoProducto(s, P)) return null;
    const precio = precioPara(s, P);
    s.p.dinero -= precio; s.acum.compras = (s.acum.compras || 0) + precio;
    if (precio !== P.precio && P2.usarDescuento) P2.usarDescuento(s, P.id);
    s.usoTienda = s.usoTienda || {};
    let item = null;
    if (P.consumible) {
      s.usoTienda[P.id] = s.semana;
      const U = P.usar || {};
      if (U.energia) s.p.energia = clamp(s.p.energia + U.energia, 0, P2.CFG.energia.max);
      if (U.confianza && s.fase === 'club') s.confianza = clamp(s.confianza + U.confianza, 0, 100);
      for (const [rid, d] of Object.entries(U.rel || {})) P2.cambiarRel(s, rid, d, P.n);
    } else {
      // El valor sale de lo que pagaste (con descuento, vale menos): así un cupón no se convierte en beneficio al revender
      item = { uid: 'i' + (s.semana * 1000 + inventario(s).length), id: P.id, semana: s.semana, precioCompra: precio, valorActual: P.patrimonial ? Math.round(precio * P.patrimonial) : 0, skin: null };
      inventario(s).push(item);
      if (P.slot) { s.equipado = s.equipado || {}; s.equipado[P.slot] = P.id; }
      if (P.look) {
        s.lookDesbloqueos = Array.from(new Set((s.lookDesbloqueos || []).concat(P.look)));
        const hechas = {};   // te lo pones al momento: «ahora tengo esto»
        for (const x of P.look) { const [cap, lid] = x.split(':'); if (!hechas[cap] && P2.ponerLook) { P2.ponerLook(s, cap, lid); hechas[cap] = 1; } }
      }
      s.historiaCosas = Array.from(new Set((s.historiaCosas || []).concat(P.id)));
    }
    if (P2.alComprar) P2.alComprar(s, P, precio);
    P2.anotar(s, P.ic, `Me compro: ${P.n.toLowerCase()} (${eur(precio)}).`);
    P2.tele(s, 'compra', { id: P.id, precio });
    return item || { id: P.id, consumido: true };
  }
  // Vender un patrimonial: recuperas su valor actual
  function venderPosesion(s, uid) {
    const it = inventario(s).find(x => x.uid === uid), P = it && producto(it.id);
    if (!it || !P || !P.patrimonial) return 0;
    s.p.dinero += it.valorActual;
    s.inventario = inventario(s).filter(x => x !== it);
    if (P.slot && s.equipado && s.equipado[P.slot] === P.id) delete s.equipado[P.slot];
    s.vendidos = (s.vendidos || []).concat({ id: P.id, semana: s.semana, precio: it.valorActual }).slice(-20);
    P2.anotar(s, '🏷️', `Vendo: ${P.n.toLowerCase()} por ${eur(it.valorActual)}.`);
    P2.tele(s, 'ventaPosesion', { id: P.id });
    return it.valorActual;
  }
  function equipar(s, id) {
    const P = producto(id); if (!P || !P.slot || !posee(s, id)) return false;
    s.equipado = s.equipado || {}; s.equipado[P.slot] = id; return true;
  }
  // Efectos: los objetos con hueco cuentan solo si los llevas puestos; el resto, si los tienes
  function efectoTienda(s, k) {
    if (!s) return 0;
    let t = 0;
    for (const it of inventario(s)) {
      const P = producto(it.id); if (!P || !P.ef || !P.ef[k]) continue;
      if (P.slot && (s.equipado || {})[P.slot] !== P.id) continue;
      t += P.ef[k];
    }
    return t;
  }
  const valorPosesiones = s => inventario(s).reduce((a, it) => a + (it.valorActual || 0), 0);

  const RAREZAS = { comun: { n: 'Común', c: '#8e8aa8' }, raro: { n: 'Raro', c: '#3d7bff' }, epico: { n: 'Épico', c: '#a64bff' }, legendario: { n: 'Legendario', c: '#e8a000' } };
  Object.assign(P2, { CATEGORIAS_TIENDA, PRODUCTOS, RAREZAS, producto, posee, equipado, bloqueoProducto, precioPara, comprar, venderPosesion, equipar, efectoTienda, valorPosesiones });
})(globalThis.P2 = globalThis.P2 || {});
