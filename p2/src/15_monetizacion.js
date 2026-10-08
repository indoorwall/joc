/* =====================================================================
   15 · MONETIZATION LAB (P2.4) — TODO SIMULADO
   Sirve para medir qué anuncios con recompensa y qué compras querría la gente,
   SIN anuncios reales, SIN pagos, SIN SDK, SIN servidor y SIN moneda premium.
   Reglas que no se rompen:
   - El juego está equilibrado sin esto: nada de aquí cambia precios, sueldos, energía ni progresión.
   - Nunca se vende poder, dinero del juego, contratos, resultados ni se borran consecuencias.
   - Los anuncios simulados solo dan: un cupón o una oferta en la Tienda (se paga con dinero del juego),
     un poco de energía con límite estricto, o un cosmético. Nunca durante una decisión ni en las pruebas.
   - Las compras con dinero real son solo pruebas de intención («¿lo comprarías?»): no hay cargo ni checkout.
   - Nada de aquí usa el generador aleatorio de la partida (s.rng): la telemetría no cambia el juego.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, eur } = P2;

  // ---------- Configuración central (todo editable aquí) ----------
  const MONETIZATION = {
    activa: true,     // false → no se ofrece nada: el juego queda exactamente igual que sin monetización
    testMode: true,   // P2.4: SIEMPRE simulado. No existe ningún camino a un anuncio o pago real
    variantes: {      // test A/B local: se asigna una vez al crear la partida (no cambia la dificultad)
      A: { n: 'Solo anuncios con recompensa', iap: [] },
      B: { n: 'Anuncios + Pack Debut', iap: ['debut', 'sinAnuncios'] },
      C: { n: 'Anuncios + varios packs', iap: ['debut', 'street', 'pro', 'luxury', 'founder', 'sinAnuncios', 'espacios'] },
    },
    rewarded: {
      cupon: { activo: true, pct: 0.10, maximo: 600, cadaSemanas: 4, precioMin: 80, validez: 4 },
      oferta: { activo: true, pctMin: 0.15, pctMax: 0.25, maximo: 250, cadaSemanas: 6, validez: 3, precioMax: { barrio: 200, club: 700, empresa: 3000, magnate: 10000 } },
      energia: { activo: true, cantidad: 10, umbral: 35, cadaSemanas: 8 },   // con +15 cada 6 semanas, verlos todos daba +3 de nivel y +7 % de patrimonio: demasiado
      temporada: { activo: true },
      empresaBonus: { activo: false, mult: 1.25 },   // futuro: cobrar ingresos offline con bonus. Aún no hay ingresos offline
    },
    iap: { maxPorSesion: 2, semanasEntre: 4, entregarCosmeticos: false, minutosFounder: 25, momentoValido: 3 },
    interstitial: { activo: true, minutosEntre: 12, momentos: ['finTemporada', 'finCapitulo'] },
    limitesSesion: { rewarded: 6 },
  };

  const REWARDED = {
    cupon: { ic: '🏷️', n: 'Cupón de Tienda', d: c => `−${Math.round(c.pct * 100)} % en un objeto (máximo ${eur(c.maximo)})` },
    oferta: { ic: '🎁', n: 'Oferta especial', d: () => 'Descubres un objeto con descuento (lo pagas con dinero del juego)' },
    energia: { ic: '⚡', n: 'Recuperación patrocinada', d: c => `+${c.cantidad} de energía` },
    temporada: { ic: '🕶️', n: 'Cosmético de temporada', d: () => 'Gafas edición temporada (solo estética)' },
    empresaBonus: { ic: '💼', n: 'Bonus de empresa', d: c => `Cobrar ×${c.mult} lo generado fuera de la partida (futuro)` },
  };

  // ---------- Productos simulados con dinero real (solo pruebas de intención) ----------
  // contenido: [capa, id del look, texto] o { tipo, ... } para lo que no es ropa
  const IAP_PRODUCTS = [
    { id: 'debut', ic: '🎉', nombre: 'Pack Debut', precio: 0.99, categoria: 'cosmetico', momentoOferta: 'contrato', unaVez: true, rareza: 'raro',
      descripcion: 'Para celebrar tu primer contrato profesional.',
      contenido: [['ropa', 'debut', '👕 Outfit exclusivo Debut'], ['calzado', 'debut', '👟 Diseño exclusivo de botas'], ['cabeza', 'gorraDebut', '🧢 Gorra exclusiva'], ['fondo', 'debut', '🎨 Fondo de perfil «Debut»']] },
    { id: 'street', ic: '🛹', nombre: 'Pack Street', precio: 1.99, categoria: 'cosmetico', momentoOferta: 'titular', unaVez: true, rareza: 'raro',
      descripcion: 'Estilo de barrio. Solo estética.',
      contenido: [['ropa', 'street', '👕 Sudadera exclusiva'], ['pantalon', 'street', '👖 Pantalón cargo'], ['calzado', 'street', '👟 Zapatillas'], ['cabeza', 'gorraStreet', '🧢 Gorra'], ['fondo', 'urbano', '🏙️ Fondo urbano']] },
    { id: 'pro', ic: '⚡', nombre: 'Pack Pro', precio: 2.99, categoria: 'cosmetico', momentoOferta: 'patro', unaVez: true, rareza: 'epico',
      descripcion: 'Tu carrera despega: viste como un profesional. Sin ventajas.',
      contenido: [['ropa', 'pro', '🧥 Outfit profesional'], ['extra', 'relojPro', '⌚ Reloj (visual)'], ['pelo', 'degradado', '💇 Peinado degradado'], ['gafas', 'pro', '🕶️ Gafas'], ['fondo', 'estadio', '🏟️ Fondo de estadio'], ['calzado', 'pro', '👟 Variante de botas']] },
    { id: 'luxury', ic: '💎', nombre: 'Pack Luxury', precio: 3.99, categoria: 'cosmetico', momentoOferta: 'empresa', unaVez: true, rareza: 'legendario',
      descripcion: 'Para quien ya tiene empresa. El coche se sigue ganando jugando: esto solo cambia su aspecto.',
      contenido: [['ropa', 'trajeLux', '🤵 Traje exclusivo'], ['extra', 'relojPremium', '⌚ Reloj premium (visual)'], ['extra', 'cadenaExcl', '📿 Cadena exclusiva'], ['fondo', 'premium', '✨ Fondo premium'],
        { tipo: 'skin', vehiculo: 'deportivo', skin: 'negra', t: '🏎️ Aspecto «Negro mate» para tu deportivo (si lo tienes)' }, { tipo: 'texto', t: '🏠 Decoración de casa (próximamente)' }] },
    { id: 'founder', ic: '⭐', nombre: 'Founder Pack', precio: 4.99, categoria: 'apoyo', momentoOferta: 'rentable', unaVez: true, rareza: 'legendario',
      descripcion: 'Para quien quiere apoyar el juego. Sin ventaja competitiva.',
      contenido: [{ tipo: 'sinAnuncios', t: '🚫 Sin anuncios obligatorios' }, ['extra', 'insignia', '⭐ Insignia Founder'], ['ropa', 'founder', '👕 Outfit Founder'], ['fondo', 'founder', '🖼️ Fondo exclusivo'],
        { tipo: 'espacios', n: 3, t: '💾 3 espacios extra de carrera' }, ['cabeza', 'gorraStreet', '🧢 Pequeño pack cosmético']] },
    { id: 'sinAnuncios', ic: '🚫', nombre: 'Sin anuncios', precio: 2.99, categoria: 'sinAnuncios', momentoOferta: 'intersticial', unaVez: true,
      descripcion: 'Quita solo los anuncios obligatorios. Los anuncios con recompensa siguen ahí si los quieres.',
      contenido: [{ tipo: 'sinAnuncios', t: '🚫 Fuera los anuncios obligatorios' }, { tipo: 'texto', t: '📺 Los voluntarios con recompensa siguen disponibles' }] },
    { id: 'espacios', ic: '💾', nombre: '+3 carreras', precio: 1.99, categoria: 'espacios', momentoOferta: 'ajustes', unaVez: true,
      descripcion: 'Gratis tienes 2 carreras a la vez. En esta prueba no se limita nada: solo medimos si te interesa.',
      contenido: [{ tipo: 'espacios', n: 3, t: '💾 3 espacios extra de carrera (5 en total)' }] },
  ];
  // Deportes futuros: solo para medir interés en el informe. No se venden en P2.4
  const DEPORTES_FUTUROS = [{ id: 'escalada', ic: '🧗', n: 'Escalada' }, { id: 'tenis', ic: '🎾', n: 'Tenis' }, { id: 'basket', ic: '🏀', n: 'Basket' }, { id: 'surf', ic: '🏄', n: 'Surf' }, { id: 'skate', ic: '🛹', n: 'Skate' }];
  // Aspectos de vehículo (preparado; en P2.4 solo el del Pack Luxury, de prueba)
  const SKINS_VEHICULO = { deportivo: [{ id: 'normal', n: 'De serie', c: '#e23b3b' }, { id: 'negra', n: 'Negro mate', c: '#1b1b22', premium: 'luxury' }] };

  // ---------- Estado ----------
  const nuevoMon = () => ({ ultimo: {}, cupon: null, oferta: null, pend: null, seq: 0, momentos: [], iapVisto: {}, ultimaOfertaIap: null,
    intersticialPend: null, intersticialMs: null, temporadaPremio: null, deseoAvisado: null, deseoAviso: null, premium: [], sinAnuncios: false });
  const M = s => (s.mon && typeof s.mon === 'object' ? s.mon : (s.mon = nuevoMon()));
  const activa = () => MONETIZATION.activa && MONETIZATION.testMode;
  // Hash estable (sin tocar s.rng): para la variante y para elegir la oferta especial
  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  function asignarVariante(s) {
    if (s.monVariante && MONETIZATION.variantes[s.monVariante]) return s.monVariante;
    const ids = Object.keys(MONETIZATION.variantes);
    s.monVariante = ids[hash((s.tele && s.tele.id) || String(s.seed)) % ids.length];
    return s.monVariante;
  }
  const iapEnVariante = (s, id) => { const V = MONETIZATION.variantes[asignarVariante(s)]; return !!V && V.iap.includes(id); };

  // ---------- Telemetría de monetización (separada; nunca toca la partida) ----------
  function teleMon(s, ev, d = {}) {
    if (!s || !s.p) return;
    const t = s.tele || (s.tele = P2.nuevaTele()), m = t.mon || (t.mon = { eventos: [], cuentas: {}, vistos: {}, deseados: {} });
    const e = Object.assign({ e: ev, semana: s.semana, fase: s.fase, dinero: Math.round(s.p.dinero), energia: Math.round(s.p.energia), ms: t.msActivo || 0, patrimonio: P2.patrimonio ? P2.patrimonio(s) : 0 }, d);
    m.eventos.push(e); if (m.eventos.length > 300) m.eventos.shift();
    m.cuentas[ev] = (m.cuentas[ev] || 0) + 1;
    const sub = d.reward_type || d.producto;
    if (sub) m.cuentas[`${ev}:${sub}`] = (m.cuentas[`${ev}:${sub}`] || 0) + 1;
    if (!m.primero) m.primero = {};
    if (!m.primero[ev]) m.primero[ev] = { semana: s.semana, ms: t.msActivo || 0 };
    return e;
  }
  // «Ofrecido» se cuenta una vez por oferta y semana (no cada vez que se pinta la pantalla)
  function vistoMon(s, ev, clave, d) {
    const t = s.tele || (s.tele = P2.nuevaTele()), m = t.mon || (t.mon = { eventos: [], cuentas: {}, vistos: {}, deseados: {} });
    const k = `${ev}|${clave}|${s.semana}`;
    if (m.vistos[k]) return false;
    m.vistos[k] = 1;
    const ks = Object.keys(m.vistos); if (ks.length > 400) delete m.vistos[ks[0]];
    teleMon(s, ev, d); return true;
  }

  // ---------- Descuentos (cupón y oferta especial) ----------
  function descuentoCupon(precio) { const C = MONETIZATION.rewarded.cupon; return Math.max(0, Math.min(Math.round(precio * C.pct), C.maximo, precio)); }
  function cuponVigente(s) { const c = M(s).cupon; return c && s.semana - c.semana < MONETIZATION.rewarded.cupon.validez ? c : null; }
  function ofertaVigente(s) { const o = M(s).oferta; return o && s.semana <= o.hasta ? o : null; }
  function precioConDescuento(s, P) {
    if (!P) return 0;
    const o = ofertaVigente(s); if (o && o.id === P.id) return Math.max(0, o.precio);
    const c = cuponVigente(s); if (c && c.id === P.id) return Math.max(0, P.precio - descuentoCupon(P.precio));
    return P.precio;
  }
  function usarDescuento(s, id) {
    const m = M(s);
    if (m.oferta && m.oferta.id === id) { teleMon(s, 'reward_used', { reward_type: 'oferta', id }); m.oferta = null; }
    else if (m.cupon && m.cupon.id === id) { teleMon(s, 'reward_used', { reward_type: 'cupon', id }); m.cupon = null; }
  }
  const etapaDe = s => (s.hitos.inversion2 ? 'magnate' : s.negocios.length || s.socio ? 'empresa' : s.temporada ? 'club' : 'barrio');
  function candidatosOferta(s) {
    const C = MONETIZATION.rewarded.oferta, max = C.precioMax[etapaDe(s)];
    return P2.PRODUCTOS.filter(P => !P.inicial && !P.proximamente && !P.consumible && P.precio >= 20 && P.precio <= max && !P2.posee(s, P.id) && !P2.bloqueoProducto(s, P, true));
  }

  // ---------- Anuncios con recompensa (simulados) ----------
  // Devuelve null si se puede, o el motivo si no
  function bloqueoRewarded(s, tipo, data = {}) {
    if (!activa()) return 'Desactivado';
    const C = MONETIZATION.rewarded[tipo]; if (!C || !C.activo) return 'Desactivado';
    if (s.pendiente) return 'Antes, decide lo pendiente en «Jugar»';   // nunca durante una decisión (ni para cambiarla)
    const u = M(s).ultimo[tipo];
    if (C.cadaSemanas && u != null && s.semana - u < C.cadaSemanas) return `Otra vez en ${C.cadaSemanas - (s.semana - u)} ${C.cadaSemanas - (s.semana - u) === 1 ? 'semana' : 'semanas'}`;
    if (tipo === 'cupon') {
      const P = P2.producto(data.id);
      if (!P || P.consumible || P.inicial || P.proximamente || P.precio < C.precioMin) return 'Sin cupón para esto';
      if (P2.posee(s, P.id) || P2.bloqueoProducto(s, P, true)) return 'No disponible';
      const c = cuponVigente(s); if (c) return c.id === P.id ? 'Ya tienes el cupón' : 'Ya tienes un cupón activo';
      const o = ofertaVigente(s); if (o && o.id === P.id) return 'Ya está en oferta';
    }
    if (tipo === 'oferta') { if (ofertaVigente(s)) return 'Ya tienes una oferta'; if (!candidatosOferta(s).length) return 'No hay ofertas ahora'; }
    if (tipo === 'energia') {
      if (s.fase === 'pruebas') return 'No antes de las pruebas';   // nunca altera una prueba
      if (s.p.energia >= C.umbral) return 'Solo con poca energía';
      if (s.p.energia >= P2.CFG.energia.max) return 'Ya estás a tope';
    }
    if (tipo === 'temporada') { const t = M(s).temporadaPremio; if (!t || t.extra) return 'No disponible'; }
    return null;
  }
  // Toca «Ver anuncio»: abre la simulación con la recompensa (aún no se entrega)
  function pedirRewarded(s, tipo, data = {}) {
    const b = bloqueoRewarded(s, tipo, data); if (b) return null;
    const m = M(s);
    m.pend = { token: ++m.seq, tipo, data: Object.assign({}, data), semana: s.semana };
    teleMon(s, 'rewarded_offer_clicked', { reward_type: tipo, contexto: data.contexto || data.id || null });
    return m.pend;
  }
  function cancelarRewarded(s) { const m = M(s); if (m.pend) teleMon(s, 'rewarded_offer_cancelled', { reward_type: m.pend.tipo }); m.pend = null; }
  // «Simular anuncio y aceptar»: entrega UNA recompensa por token; un segundo intento no da nada
  function aceptarRewarded(s, token) {
    const m = M(s), p = m.pend;
    if (!p || p.token !== token) return null;
    m.pend = null;
    if (bloqueoRewarded(s, p.tipo, p.data)) return null;
    const C = MONETIZATION.rewarded[p.tipo];
    let r = null;
    if (p.tipo === 'cupon') { const P = P2.producto(p.data.id); m.cupon = { id: P.id, semana: s.semana, ahorro: descuentoCupon(P.precio) }; r = { tipo: 'cupon', id: P.id, ahorro: m.cupon.ahorro, precio: P.precio - m.cupon.ahorro }; }
    if (p.tipo === 'oferta') {
      const l = candidatosOferta(s), h = hash(`${(s.tele && s.tele.id) || s.seed}|${s.semana}`), P = l[h % l.length];
      const pct = C.pctMin + ((h >>> 8) % 11) / 10 * (C.pctMax - C.pctMin), desc = Math.min(Math.round(P.precio * pct), C.maximo);
      m.oferta = { id: P.id, original: P.precio, precio: Math.max(0, P.precio - desc), hasta: s.semana + C.validez - 1 };
      r = { tipo: 'oferta', id: P.id, original: P.precio, precio: m.oferta.precio };
    }
    if (p.tipo === 'energia') { const antes = s.p.energia; s.p.energia = clamp(s.p.energia + C.cantidad, 0, P2.CFG.energia.max); r = { tipo: 'energia', ganado: s.p.energia - antes }; }
    if (p.tipo === 'temporada') { m.temporadaPremio.extra = true; s.lookDesbloqueos = Array.from(new Set((s.lookDesbloqueos || []).concat('gafas:temporada'))); r = { tipo: 'temporada', look: 'gafas:temporada' }; }
    if (!r) return null;
    m.ultimo[p.tipo] = s.semana;
    teleMon(s, 'rewarded_offer_accepted', { reward_type: p.tipo, contexto: p.data.contexto || p.data.id || null });
    return r;
  }
  function ofrecidoRewarded(s, tipo, data = {}) { if (!bloqueoRewarded(s, tipo, data)) vistoMon(s, 'rewarded_offer_shown', tipo + (data.id || ''), { reward_type: tipo, contexto: data.contexto || data.id || null }); }
  // Futuro: cobrar lo generado fuera de la partida. Estructura preparada; sin ingresos offline todavía
  function bonusOffline(base, conAnuncio) { const C = MONETIZATION.rewarded.empresaBonus; return Math.round(base * (conAnuncio && C.activo ? C.mult : 1)); }

  // ---------- Momentos (hitos y finales) ----------
  // Las ofertas solo aparecen en momentos buenos; jamás tras perder, lesión, crisis o sin dinero
  function momentoNegativo(s) {
    const u = s.ultimo && s.ultimo.partido;
    return s.p.lesion > 0 || s.p.dinero < 0 || s.negocios.some(n => n.crisis) || (u && u.resultado === 'derrota') || (s.pendiente && ['crisis', 'socioCapital'].includes(s.pendiente.tipo));
  }
  function momentoMon(s, k) {
    if (!activa()) return;
    const m = M(s);
    m.momentos.push({ k, semana: s.semana }); if (m.momentos.length > 6) m.momentos.shift();
    if (MONETIZATION.interstitial.activo && MONETIZATION.interstitial.momentos.includes(k)) m.intersticialPend = k;
    if (k === 'finTemporada' && MONETIZATION.rewarded.temporada.activo) {
      m.temporadaPremio = { semana: s.semana, extra: false, visto: false };
      s.lookDesbloqueos = Array.from(new Set((s.lookDesbloqueos || []).concat('ropa:temporada')));   // la camiseta es gratis
    }
  }
  // Oferta de pago que tocaría enseñar ahora (o null). sesion: cuántas se han enseñado en esta sesión
  function ofertaIapAhora(s, sesion = 0) {
    if (!activa() || momentoNegativo(s)) return null;
    const m = M(s), L = MONETIZATION.iap;
    if (sesion >= L.maxPorSesion) return null;
    if (m.ultimaOfertaIap != null && s.semana - m.ultimaOfertaIap < L.semanasEntre) return null;
    const mins = ((s.tele && s.tele.msActivo) || 0) / 60000;
    for (const mo of m.momentos) {
      if (s.semana - mo.semana > L.momentoValido) continue;
      const I = IAP_PRODUCTS.find(x => x.momentoOferta === mo.k && iapEnVariante(s, x.id) && !(x.unaVez && m.iapVisto[x.id] != null));
      if (!I) continue;
      if (I.id === 'founder' && mins < L.minutosFounder) continue;   // no demasiado pronto: cuando ya conoces el juego
      return I;
    }
    return null;
  }
  function marcarIapMostrado(s, id) { const m = M(s); if (m.iapVisto[id] != null) return; m.iapVisto[id] = s.semana; m.ultimaOfertaIap = s.semana; m.momentos = m.momentos.filter(x => !IAP_PRODUCTS.some(I => I.id === id && I.momentoOferta === x.k)); }
  function iapMostrado(s, id, donde) { const I = IAP_PRODUCTS.find(x => x.id === id); if (!I) return; vistoMon(s, 'iap_offer_shown', id + donde, { producto: id, precio: I.precio, donde }); }
  function iapClic(s, id) { const I = IAP_PRODUCTS.find(x => x.id === id); if (!I) return null; teleMon(s, 'iap_offer_clicked', { producto: id, precio: I.precio }); return I; }
  // «¿Lo comprarías?» → no / quizá / sí. NUNCA hay pago. Solo si la configuración lo pide se entregan los cosméticos
  function iapIntencion(s, id, resp) {
    const I = IAP_PRODUCTS.find(x => x.id === id); if (!I || !['no', 'quiza', 'si'].includes(resp)) return null;
    teleMon(s, `iap_intent_${resp === 'quiza' ? 'maybe' : resp === 'si' ? 'yes' : 'no'}`, { producto: id, precio: I.precio, minutosJugados: Math.round(((s.tele && s.tele.msActivo) || 0) / 60000) });
    const m = M(s);
    if (resp === 'si' && MONETIZATION.iap.entregarCosmeticos && !m.premium.includes(id)) {
      m.premium.push(id);
      for (const c of I.contenido) if (Array.isArray(c)) s.lookDesbloqueos = Array.from(new Set((s.lookDesbloqueos || []).concat(`${c[0]}:${c[1]}`)));
      if (I.contenido.some(c => c.tipo === 'sinAnuncios')) m.sinAnuncios = true;
    }
    return { cargo: 0, producto: id, respuesta: resp };
  }

  // ---------- Anuncio obligatorio simulado (muy limitado) ----------
  function intersticialAhora(s) {
    const m = M(s), C = MONETIZATION.interstitial;
    if (!activa() || !C.activo || !m.intersticialPend || m.sinAnuncios || s.pendiente) return null;
    const ms = (s.tele && s.tele.msActivo) || 0;
    if (m.intersticialMs != null && ms - m.intersticialMs < C.minutosEntre * 60000) { teleMon(s, 'interstitial_skipped', { momento: m.intersticialPend, motivo: 'frecuencia' }); m.intersticialPend = null; return null; }
    return m.intersticialPend;
  }
  function intersticialMostrado(s) { const m = M(s), k = m.intersticialPend; if (!k) return; m.intersticialPend = null; m.intersticialMs = (s.tele && s.tele.msActivo) || 0; teleMon(s, 'interstitial_shown', { momento: k }); }
  function intersticialContinuar(s) { teleMon(s, 'interstitial_continue', {}); }

  Object.assign(P2, { MONETIZATION, REWARDED, IAP_PRODUCTS, DEPORTES_FUTUROS, SKINS_VEHICULO, nuevoMon, asignarVariante, iapEnVariante, teleMon, vistoMon,
    descuentoCupon, cuponVigente, ofertaVigente, precioConDescuento, usarDescuento, candidatosOferta,
    bloqueoRewarded, pedirRewarded, cancelarRewarded, aceptarRewarded, ofrecidoRewarded, bonusOffline,
    momentoNegativo, momentoMon, ofertaIapAhora, marcarIapMostrado, iapMostrado, iapClic, iapIntencion,
    intersticialAhora, intersticialMostrado, intersticialContinuar, monEstado: M });
})(globalThis.P2 = globalThis.P2 || {});
