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
    { id: 'camiseta', cat: 'ropa', ic: '👕', n: 'Camiseta de tu equipo favorito', precio: 25, d: 'Para ir a la plaza con estilo.' },
    { id: 'chandal', cat: 'ropa', ic: '🧥', n: 'Chándal de marca', precio: 90, d: 'El de los entrenamientos buenos.' },
    { id: 'outfit', cat: 'ropa', ic: '🤵', n: 'Outfit premium', precio: 650, req: { hito: 'contrato' }, look: ['ropa:traje', 'pantalon:traje'], d: 'Para entrevistas y eventos. Desbloquea el traje en tu personaje.' },
    // ⌚ Accesorios
    { id: 'gorra', cat: 'accesorios', ic: '🧢', n: 'Gorra', precio: 30, d: 'Colección.' },
    { id: 'relojDep', cat: 'accesorios', ic: '⌚', n: 'Reloj deportivo', precio: 180, d: 'Cuenta pasos, mide pulsaciones y queda bien.' },
    { id: 'cadena', cat: 'accesorios', ic: '📿', n: 'Cadena de oro', precio: 3000, req: { hito: 'empresa' }, patrimonial: 0.6, look: ['extra:cadena'], d: 'Un capricho que conserva parte de su valor.' },
    { id: 'relojLujo', cat: 'accesorios', ic: '💎', n: 'Reloj de lujo', precio: 9000, req: { hito: 'rentable' }, patrimonial: 0.7, look: ['extra:reloj'], d: 'De los que se heredan.' },
    // 📱 Tecnología
    { id: 'movilBasico', cat: 'tecnologia', ic: '📱', n: 'Móvil básico', precio: 120, slot: 'movil', ef: { prensa: 0.05 }, d: 'Fotos decentes: tu prensa y redes rinden un 5 % más.' },
    { id: 'movilBueno', cat: 'tecnologia', ic: '📲', n: 'Móvil bueno', precio: 450, req: { hito: 'contrato' }, slot: 'movil', ef: { prensa: 0.1 }, d: 'Tus redes rinden un 10 % más.' },
    { id: 'movilPremium', cat: 'tecnologia', ic: '🤳', n: 'Móvil premium', precio: 1300, req: { hito: 'titular' }, slot: 'movil', ef: { prensa: 0.15 }, d: 'Tus redes rinden un 15 % más.' },
    // 🚗 Vehículos
    { id: 'bici', cat: 'vehiculos', ic: '🚲', n: 'Bicicleta', precio: 180, slot: 'vehiculo', patrimonial: 0.5, ef: { recuperacion: 1 }, d: 'Llegas antes a todo: +1 de energía por semana.' },
    { id: 'moto', cat: 'vehiculos', ic: '🛵', n: 'Moto', precio: 1900, req: { hito: 'contrato' }, slot: 'vehiculo', patrimonial: 0.6, ef: { recuperacion: 2 }, d: 'Menos autobús: +2 de energía por semana.' },
    { id: 'cocheUsado', cat: 'vehiculos', ic: '🚗', n: 'Coche de segunda mano', precio: 5200, req: { hito: 'titular' }, slot: 'vehiculo', patrimonial: 0.65, ef: { recuperacion: 3 }, d: 'Tu primer coche: +3 de energía por semana.' },
    { id: 'deportivo', cat: 'vehiculos', ic: '🏎️', n: 'Coche deportivo', precio: 32000, req: { hito: 'inversion2' }, slot: 'vehiculo', patrimonial: 0.7, ef: { recuperacion: 3 }, d: 'Cuando seas magnate.' },
    // 🏠 Vivienda (la habitación en casa de tus padres la tienes desde el principio)
    { id: 'habitacion', cat: 'vivienda', ic: '🛏️', n: 'Habitación en casa familiar', precio: 0, slot: 'vivienda', inicial: true, d: 'Gratis… y con tus padres al lado.' },
    { id: 'piso', cat: 'vivienda', ic: '🏢', n: 'Piso pequeño', precio: 16000, req: { hito: 'empresa' }, slot: 'vivienda', patrimonial: 1, ef: { gastosVida: 25, recuperacion: 2 }, d: 'Tuyo: −25 € de gastos a la semana, descansas mejor y vale lo que pagaste.' },
    { id: 'casaPremium', cat: 'vivienda', ic: '🏡', n: 'Vivienda premium', precio: 65000, req: { hito: 'inversion2' }, slot: 'vivienda', patrimonial: 1, ef: { gastosVida: 40, recuperacion: 4 }, d: 'Con jardín y gimnasio.' },
    // 🎮 Ocio
    { id: 'consola', cat: 'ocio', ic: '🎮', n: 'Videoconsola', precio: 350, d: 'Colección. Las tardes de domingo son tuyas.' },
    { id: 'escapada', cat: 'ocio', ic: '🏖️', n: 'Escapada de fin de semana', precio: 700, consumible: true, enfria: 8, usar: { energia: 40, rel: { marc: 3, madre: 2 } }, d: '+40 de energía. Te llevas a Marc. Se puede repetir cada 8 semanas.' },
    { id: 'cenaEquipo', cat: 'ocio', ic: '🍝', n: 'Invitar a cenar al equipo', precio: 250, req: { hito: 'contrato' }, consumible: true, enfria: 10, usar: { rel: { iker: 6 }, confianza: 2 }, d: 'El vestuario lo agradece (+2 confianza del míster). Cada 10 semanas.' },
    // ⚽ Equipamiento deportivo
    { id: 'botas', cat: 'equipamiento', ic: '👟', n: 'Botas buenas', precio: 95, slot: 'calzado', ef: { entreno: 0.03 }, d: 'Más cómodas: entrenas un 3 % mejor.' },
    { id: 'botasPro', cat: 'equipamiento', ic: '⚡', n: 'Botas profesionales', precio: 420, req: { hito: 'contrato' }, slot: 'calzado', ef: { entreno: 0.06 }, d: 'Entrenas un 6 % mejor.' },
    { id: 'masaje', cat: 'equipamiento', ic: '💆', n: 'Pistola de masaje', precio: 260, ef: { recuperacion: 2 }, d: '+2 de energía por semana.' },
    { id: 'gimnasio', cat: 'equipamiento', ic: '🏋️', n: 'Gimnasio en casa', precio: 2600, req: { posee: 'piso' }, patrimonial: 0.5, ef: { entreno: 0.05 }, d: 'Necesitas tu propio piso. Entrenas un 5 % mejor.' },
  ];
  const producto = id => PRODUCTOS.find(p => p.id === id);
  const inventario = s => (Array.isArray(s.inventario) ? s.inventario : (s.inventario = []));
  const posee = (s, id) => inventario(s).some(x => x.id === id) || (producto(id) && producto(id).inicial);
  // Lo que llevas «puesto» en cada hueco (vehículo, vivienda, móvil, calzado)
  const equipado = (s, slot) => { const e = (s.equipado || {})[slot]; return e ? producto(e) : PRODUCTOS.find(p => p.slot === slot && p.inicial) || null; };

  function bloqueoProducto(s, P) {
    if (!P) return 'No existe.';
    if (P.inicial) return 'Ya lo tienes.';
    if (!P.consumible && posee(s, P.id)) return 'Ya es tuyo.';
    if (P.req && P.req.hito && !(s.hitos && s.hitos[P.req.hito])) { const H = P2.HITOS.find(h => h.id === P.req.hito); return `Se desbloquea con: ${H ? H.n.toLowerCase() : P.req.hito}`; }
    if (P.req && P.req.posee && !posee(s, P.req.posee)) return `Necesitas: ${producto(P.req.posee).n.toLowerCase()}`;
    if (P.consumible && P.enfria) { const u = (s.usoTienda || {})[P.id]; if (u != null && s.semana - u < P.enfria) return `Otra vez en ${P.enfria - (s.semana - u)} semanas.`; }
    if (s.p.dinero < P.precio) return `Te faltan ${eur(P.precio - s.p.dinero)}.`;
    return null;
  }
  // Comprar: el dinero se resta una sola vez; lo único no se compra dos veces
  function comprar(s, id) {
    const P = producto(id); if (bloqueoProducto(s, P)) return null;
    s.p.dinero -= P.precio; s.acum.compras = (s.acum.compras || 0) + P.precio;
    s.usoTienda = s.usoTienda || {};
    let item = null;
    if (P.consumible) {
      s.usoTienda[P.id] = s.semana;
      const U = P.usar || {};
      if (U.energia) s.p.energia = clamp(s.p.energia + U.energia, 0, P2.CFG.energia.max);
      if (U.confianza && s.fase === 'club') s.confianza = clamp(s.confianza + U.confianza, 0, 100);
      for (const [rid, d] of Object.entries(U.rel || {})) P2.cambiarRel(s, rid, d, P.n);
    } else {
      item = { uid: 'i' + (s.semana * 1000 + inventario(s).length), id: P.id, semana: s.semana, precioCompra: P.precio, valorActual: P.patrimonial ? Math.round(P.precio * P.patrimonial) : 0 };
      inventario(s).push(item);
      if (P.slot) { s.equipado = s.equipado || {}; s.equipado[P.slot] = P.id; }
      if (P.look) s.lookDesbloqueos = Array.from(new Set((s.lookDesbloqueos || []).concat(P.look)));
    }
    P2.anotar(s, P.ic, `Me compro: ${P.n.toLowerCase()} (${eur(P.precio)}).`);
    P2.tele(s, 'compra', { id: P.id, precio: P.precio });
    return item || { id: P.id, consumido: true };
  }
  // Vender un patrimonial: recuperas su valor actual
  function venderPosesion(s, uid) {
    const it = inventario(s).find(x => x.uid === uid), P = it && producto(it.id);
    if (!it || !P || !P.patrimonial) return 0;
    s.p.dinero += it.valorActual;
    s.inventario = inventario(s).filter(x => x !== it);
    if (P.slot && s.equipado && s.equipado[P.slot] === P.id) delete s.equipado[P.slot];
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

  Object.assign(P2, { CATEGORIAS_TIENDA, PRODUCTOS, producto, posee, equipado, bloqueoProducto, comprar, venderPosesion, equipar, efectoTienda, valorPosesiones });
})(globalThis.P2 = globalThis.P2 || {});
