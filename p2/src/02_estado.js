/* =====================================================================
   02 · ESTADO, GUARDADO Y MIGRACIÓN (saveVersion = 2)
   Una partida antigua nunca debe romper la interfaz: todo dato que falte
   se rellena con un valor seguro. Nunca se borra una partida automáticamente.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG } = P2;

  // Partida nueva + variante del test de monetización (se asigna una vez y se guarda)
  // Grandes momentos para celebrar en pantalla (ascenso, contrato, negocio, título, patrocinio). Solo los pinta la interfaz.
  // ¿Tiene la CUENTA este entitlement? (compras reales). La partida nunca es la fuente de verdad: lo conecta
  // la interfaz con el cliente de comercio. Sin comercio (tests, Node) siempre es false.
  P2.tieneEnt = P2.tieneEnt || (() => false);
  function celebrar(s, c) { const l = s.celebraciones = Array.isArray(s.celebraciones) ? s.celebraciones : []; l.push(Object.assign({ semana: s.semana }, c)); if (l.length > 6) l.shift(); }
  P2.celebrar = celebrar;
  function nuevaPartida(opc = {}) {
    // Deporte de la partida (el fútbol si no se dice; los de pago, solo si la cuenta los tiene: lo comprueba quien la crea)
    const dep = P2.DEPORTES && P2.DEPORTES[opc.deporte] ? opc.deporte : 'futbol';
    if (P2.activarDeporte) P2.activarDeporte(dep);
    const s = partidaBase(opc); s.deporte = dep;
    const E = (P2.DEPORTES && P2.DEPORTES[dep].especialidades) || null;
    s.especialidad = E ? (E.some(([id]) => id === opc.especialidad) ? opc.especialidad : E[0][0]) : null;
    if (dep === 'futbol') s.agenda.push({ semana: 1, efecto: 'primeraPachanga', data: {} });   // P2.6: pequeña victoria temprana
    if (P2.asignarVariante) P2.asignarVariante(s); return s;
  }
  function partidaBase(opc = {}) {
    const I = CFG.inicio, seed = (opc.seed >>> 0) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    return {
      saveVersion: CFG.saveVersion,
      seed, rng: seed,
      nombre: opc.nombre || 'Alex', ciudad: I.ciudad, edad: I.edad,
      look: P2.validarLook ? P2.validarLook(opc.look) : (opc.look || {}),   // tu personaje (capas del avatar)
      eleccion: null,                  // acción elegida para la semana (se juega con el botón)
      secciones: ['semana', 'relaciones', 'tienda', 'inversiones', 'patrimonio', 'personaje', 'historia', 'hitos', 'ajustes'],   // pestañas visibles (se abren al avanzar). Premium: con el primer contrato, dentro de la Tienda
      inventario: [], equipado: {}, usoTienda: {}, lookDesbloqueos: [], deco: { casa: 'nada', despacho: 'nada' },   // decoración (solo aspecto)   // tienda: lo que tienes y lo que llevas
      relaciones: {},                  // personas: { id: { v, historia } } (solo cambian por decisiones)
      deseoActual: null,
      vidas: { n: 3, recarga: 1 },       // para repetir minijuegos; se recargan solas y con anuncio (simulado)
      mjSemana: null,
      // P2.5.1 · ritmo: historial de momentos (cooldowns), estadísticas, gran partido que se acerca, variedad de semanas
      minigameHistory: [], mjStats: { jugados: 0, exitos: 0, perfects: 0, racha: 0, mejorRacha: 0, reintentos: 0, vidasUsadas: 0, vidasAnuncio: 0, vidasAnuncioTemp: {}, porTipo: {}, simulados: 0 },
      logrosMj: {}, memorables: [],
      // P2.6 · experiencia: tu gran sueño, tu objetivo personal y lo que recuerdan los clubes
      sueno: P2.SUENOS && P2.SUENOS.some(x => x.id === opc.sueno) ? opc.sueno : null, metaPersonal: null, memClubes: {}, introVista: !!opc.introVista, eventoImportante: null, semLog: [], tagsSemana: [], ultAcciones: [], finLesion: 0,               // objetivo personal de la Tienda (lista de deseos)
      historiaCosas: [], trofeos: [], celebraciones: [], vendidos: [], coleccionesHechas: [], historia: { ascensos: 0, patrimonioMax: 0, semanaMax: 1 },
      mon: P2.nuevoMon ? P2.nuevoMon() : {},   // Monetization Lab (todo simulado)
      monVariante: null,               // A / B / C del test local
      deporte: 'futbol', especialidad: null,   // deporte de esta carrera (los de pago: expansiones) y tu especialidad
      superficies: {}, estilo: 0, tiro: 0, gradoRoca: null,   // lo propio de cada deporte (solo cuenta en el suyo)
      seccionesNuevas: [],
      semana: 1,
      fase: 'barrio',                  // barrio · pruebas · amateur · club
      // nivel: cómo juegas · rep: reputación deportiva (cómo te ve el fútbol) · marca: marca personal (cómo te ven marcas y medios)
      p: { nivel: I.nivel, energia: I.energia, rep: I.rep, marca: I.marca, dinero: I.dinero, lesion: 0 },
      tele: P2.nuevaTele ? P2.nuevaTele() : null,   // telemetría local para pruebas (no sale del navegador)
      cont: {},                        // veces que has hecho cada acción (rendimientos decrecientes)
      invitacion: null,                // { via, semana, dia }
      pruebas: [],                     // historial de pruebas { semana, score, via, detalle }
      preparador: false,
      ofertas: null,                   // ofertas por decidir tras unas pruebas
      contrato: null,                  // { oferta, desde, temporadasRestantes, sueldo, ... }
      confianza: CFG.club.confianzaInicial,
      interes: 0,
      temporada: null,                 // { liga, n, calendario, resultados, jornada, ... }
      temporadasJugadas: [],
      stats: { jugados: 0, titular: 0, suplente: 0, goles: 0, notas: [], titularTemp: 0, notasTemp: [] },
      primasCobradas: {},              // clave temporada-jornada: una prima nunca se cobra dos veces
      agente: false,
      patros: [],                      // contratos de patrocinio activos
      patroHist: [],
      negocios: [],                    // empresas (caja separada del dinero personal)
      oportunidad: null,               // segunda inversión elegida
      hitos: {},                       // id → semana en que se consiguió
      agenda: [],                      // consecuencias diferidas { semana, efecto, data }
      pendiente: null,                 // decisión que hay que tomar antes de seguir
      cola: [],                        // decisiones en espera
      sucesosVistos: {},               // id → última semana (enfriamiento)
      ultimo: null,                    // consecuencias de la última semana
      diario: [],
      acum: { sueldo: 0, primas: 0, patrocinio: 0, trabajo: 0, gastos: 0, impuestos: 0, aportado: 0, retirado: 0, compras: 0 },
      capitulo: { completado: false, semana: null },
      origen: opc.origen || 'nueva',
    };
  }

  // Rellena lo que falte con los valores de una partida nueva (recursivo en objetos simples)
  function rellenar(def, obj) {
    if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return obj == null ? def : obj;
    for (const k of Object.keys(def)) {
      const d = def[k];
      if (!(k in obj) || obj[k] === undefined) obj[k] = P2.copia(d);
      else if (d && typeof d === 'object' && !Array.isArray(d) && obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) rellenar(d, obj[k]);
      else if (Array.isArray(d) && !Array.isArray(obj[k])) obj[k] = P2.copia(d);
      else if (typeof d === 'number' && (typeof obj[k] !== 'number' || !isFinite(obj[k]))) obj[k] = d;
    }
    return obj;
  }

  // Una partida de P1 (otra estructura) se convierte en un jugador nuevo de P2 que conserva lo esencial
  function desdeP1(v) {
    const p = v && typeof v.p === 'object' && v.p ? v.p : {};
    const num = (x, d) => (typeof x === 'number' && isFinite(x) ? x : d);
    const s = nuevaPartida({ nombre: typeof v.nombre === 'string' && v.nombre.trim() ? v.nombre.slice(0, 24) : 'Alex', origen: 'p1', look: v.look });
    s.p.dinero = Math.round(P2.clamp(num(p.dinero, CFG.inicio.dinero), 0, 2000));
    s.p.rep = Math.round(P2.clamp(num(p.rep, CFG.inicio.rep), 0, 12));
    s.p.marca = Math.round(s.p.rep / 2);
    s.p.nivel = P2.clamp(num(p.nivel, CFG.inicio.nivel), CFG.inicio.nivel, CFG.inicio.nivel + 6);
    s.diario.push({ semana: 1, ic: '📦', t: `Vienes de P1: conservas tu nombre, parte de tus ahorros (${P2.eur(s.p.dinero)}) y algo de fama.` });
    return s;
  }

  // migrateSave: cualquier cosa → partida v2 válida, o null si no se puede aprovechar
  function migrateSave(v) {
    if (!v || typeof v !== 'object') return null;
    if (P2.activarDeporte) P2.activarDeporte(v.deporte && P2.DEPORTES && P2.DEPORTES[v.deporte] ? v.deporte : 'futbol');
    if (v.saveVersion === CFG.saveVersion) return validar(rellenar(nuevaPartida({ seed: v.seed, deporte: v.deporte, especialidad: v.especialidad }), v));
    if (v.saveVersion == null && v.p && (v.fase || v.semana)) return validar(desdeP1(v));   // partida de P1
    if (typeof v.saveVersion === 'number' && v.saveVersion > CFG.saveVersion) return null;    // de una versión futura: no se toca
    return null;
  }
  // Corrige valores imposibles (por si el guardado se editó o se cortó a medias)
  function validar(s) {
    const E = CFG.energia;
    s.p.energia = P2.clamp(s.p.energia, 0, E.max);
    s.p.rep = P2.clamp(s.p.rep, 0, 100);
    s.p.marca = P2.clamp(typeof s.p.marca === 'number' ? s.p.marca : Math.round(s.p.rep / 2), 0, 100);
    if (!s.tele || typeof s.tele !== 'object' || !s.tele.id) s.tele = P2.nuevaTele ? P2.nuevaTele() : null;
    s.p.lesion = Math.max(0, s.p.lesion | 0);
    s.confianza = P2.clamp(s.confianza, 0, 100);
    s.interes = P2.clamp(s.interes, 0, 100);
    if (!['barrio', 'pruebas', 'amateur', 'club', 'retirado'].includes(s.fase)) s.fase = 'barrio';
    if ((s.fase === 'club' || s.fase === 'amateur') && (!s.contrato || !s.temporada)) s.fase = s.invitacion ? 'pruebas' : 'barrio';
    if (s.contrato && !P2.OFERTAS[s.contrato.oferta]) { s.contrato = null; s.temporada = null; s.fase = 'barrio'; }
    s.negocios = s.negocios.filter(n => n && P2.NEGOCIOS[n.tipo]).map(n => rellenar(P2.nuevoNegocio(n.tipo, 0), n));
    s.patros = s.patros.filter(c => c && P2.MARCAS.some(m => m.id === c.id));
    if (s.pendiente && typeof s.pendiente !== 'object') s.pendiente = null;
    if (!Array.isArray(s.cola)) s.cola = [];
    s.diario = s.diario.slice(-150);
    if (P2.validarLook) s.look = P2.validarLook(s.look);
    if (P2.deco) P2.deco(s);
    // Tienda y relaciones: solo lo que existe y con valores sanos
    if (P2.producto) {
      s.inventario = (Array.isArray(s.inventario) ? s.inventario : []).filter(it => it && P2.producto(it.id) && !P2.producto(it.id).consumible)
        .map(it => Object.assign(it, { precioCompra: Math.max(0, +it.precioCompra || 0), valorActual: Math.max(0, +it.valorActual || 0) }));
      const eq = s.equipado && typeof s.equipado === 'object' ? s.equipado : {};
      for (const k of Object.keys(eq)) if (!s.inventario.some(it => it.id === eq[k] && P2.producto(it.id).slot === k)) delete eq[k];
      s.equipado = eq;
    }
    if (!Array.isArray(s.lookDesbloqueos)) s.lookDesbloqueos = [];
    if (!s.relaciones || typeof s.relaciones !== 'object' || Array.isArray(s.relaciones)) s.relaciones = {};
    if (s.deseoActual && !(P2.producto && P2.producto(s.deseoActual))) s.deseoActual = null;
    // P2.5.1: Premium se abre con el primer contrato (y vive dentro de la Tienda)
    if (Array.isArray(s.secciones) && !(s.hitos && s.hitos.contrato)) s.secciones = s.secciones.filter(x => x !== 'premium');
    if (P2.asignarVariante) P2.asignarVariante(s);
    for (const k of Object.keys(s.relaciones)) { const x = s.relaciones[k]; if (!x || typeof x.v !== 'number' || !isFinite(x.v)) delete s.relaciones[k]; else { x.v = P2.clamp(Math.round(x.v), 0, 100); if (!Array.isArray(x.historia)) x.historia = []; } }
    s.saveVersion = CFG.saveVersion;
    return s;
  }

  // ---- Guardado en el navegador (partidas múltiples) ----
  // Cada carrera vive en su ranura. La ranura 0 usa la clave de siempre: una partida de antes de las ranuras
  // aparece sola como «Carrera 1». El índice guarda la ranura activa, el nombre de cada carrera y cuándo se guardó.
  const LS = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
  const R = () => CFG.ranuras;
  const totalRanuras = () => R().gratis + R().extra;
  const claveRanura = i => (i === 0 ? CFG.claveGuardado : `${CFG.claveGuardado}_r${i}`);
  const CLAVE_INDICE = CFG.claveGuardado + '_partidas', CLAVE_PAPELERA = CFG.claveGuardado + '_papelera';
  const okRanura = i => Number.isInteger(i) && i >= 0 && i < totalRanuras();
  function indice() {
    const ls = LS(); let x = null;
    try { x = JSON.parse((ls && ls.getItem(CLAVE_INDICE)) || 'null'); } catch (_) { x = null; }
    if (!x || typeof x !== 'object') x = {};
    if (!okRanura(x.activa)) x.activa = 0;
    if (!x.meta || typeof x.meta !== 'object' || Array.isArray(x.meta)) x.meta = {};
    return x;
  }
  function escribirIndice(x) { const ls = LS(); if (!ls) return false; try { ls.setItem(CLAVE_INDICE, JSON.stringify(x)); return true; } catch (_) { return false; } }
  // Ranuras que puedes usar: 2 gratis + 3 con «+3 carreras» (o el Founder Pack). Lo decide la CUENTA, no la partida.
  function ranurasMax() { return R().gratis + (P2.tieneEnt('slots.extra_3') ? R().extra : 0); }
  const ranuraActiva = () => indice().activa;
  function usarRanura(i) {
    if (!okRanura(i) || i >= ranurasMax()) return false;
    const x = indice(); x.activa = i; return escribirIndice(x);
  }
  function guardar(s) {
    const ls = LS(); if (!ls || !s) return false;
    const x = indice(), i = x.activa;
    if (i >= ranurasMax()) return false;   // ranura de pago sin el pack (p. ej. tras un reembolso): se conserva, no se escribe
    try { ls.setItem(claveRanura(i), JSON.stringify(s)); } catch (_) { return false; }
    x.meta[i] = Object.assign({}, x.meta[i], { guardadoEn: Date.now() });
    x.borradas = (x.borradas || []).filter(k => k !== i);
    escribirIndice(x);
    return true;
  }
  function leer(i) {
    const ls = LS(); if (!ls || !okRanura(i)) return null;
    let raw = null;
    try { raw = ls.getItem(claveRanura(i)); } catch (_) { return null; }
    if (!raw) return null;
    try {
      const s = migrateSave(JSON.parse(raw));
      if (s) return s;
    } catch (_) { /* se guarda una copia abajo */ }
    // No se pudo leer: se aparta una copia (nunca se borra) y la ranura queda libre
    try { ls.setItem(claveRanura(i) + '_copia_' + Date.now(), raw); ls.removeItem(claveRanura(i)); } catch (_) {}
    return null;
  }
  // Carga la carrera activa (o la de la ranura i, que pasa a ser la activa)
  function cargar(i) {
    if (i != null) { if (!usarRanura(i)) return null; }
    const a = ranuraActiva();
    if (a >= ranurasMax()) return null;
    return leer(a);
  }
  // Resumen para la lista «Mis carreras» (sin cargar la interfaz)
  function resumenPartida(s) {
    if (!s) return null;
    const of = s.contrato && P2.OFERTAS ? P2.OFERTAS[s.contrato.oferta] : null;
    return { deporte: s.deporte || 'futbol', nombre: s.nombre, semana: s.semana, fase: s.fase, edad: s.edad, dinero: s.p.dinero, club: of ? of.club : null,
      patrimonio: P2.patrimonio ? P2.patrimonio(s) : s.p.dinero, look: s.look, trofeos: (s.trofeos || []).length, empresas: (s.negocios || []).length };
  }
  // Leer otras carreras activa su deporte un momento: al acabar se vuelve al que estaba
  function sinCambiarDeporte(fn) { const prev = P2.deporteActivo; try { return fn(); } finally { if (prev && P2.activarDeporte) P2.activarDeporte(prev); } }
  function listarPartidas() { return sinCambiarDeporte(listarPartidas_); }
  function listarPartidas_() {
    const x = indice(), max = ranurasMax(), ls = LS(), out = [];
    for (let i = 0; i < totalRanuras(); i++) {
      let s = null, raw = null;
      try { raw = ls && ls.getItem(claveRanura(i)); } catch (_) { raw = null; }
      if (raw) { try { s = migrateSave(JSON.parse(raw)); } catch (_) { s = null; } }
      const m = x.meta[i] || {};
      out.push({ i, n: i + 1, existe: !!s, rota: !!raw && !s, bloqueada: i >= max, de_pago: i >= R().gratis, activa: x.activa === i,
        titulo: m.titulo || (s ? `Carrera de ${s.nombre}` : `Carrera ${i + 1}`), guardadoEn: m.guardadoEn || null, resumen: resumenPartida(s) });
    }
    return out;
  }
  function renombrarPartida(i, titulo) {
    if (!okRanura(i)) return false;
    const t = String(titulo || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    const x = indice(); x.meta[i] = Object.assign({}, x.meta[i]);
    if (t) x.meta[i].titulo = t; else delete x.meta[i].titulo;
    return escribirIndice(x);
  }
  // Borrar es siempre una decisión del jugador. La última carrera borrada se guarda en la papelera para «Deshacer».
  function borrarPartida(i) {
    const ls = LS(); if (!ls || !okRanura(i)) return false;
    let raw = null; try { raw = ls.getItem(claveRanura(i)); } catch (_) { return false; }
    if (!raw) return false;
    const x = indice();
    try { ls.setItem(CLAVE_PAPELERA, JSON.stringify({ i, raw, meta: x.meta[i] || {}, at: Date.now() })); ls.removeItem(claveRanura(i)); } catch (_) { return false; }
    delete x.meta[i]; x.borradas = [...new Set([...(x.borradas || []), i])]; escribirIndice(x);
    return true;
  }
  function papelera() { const ls = LS(); try { const p = JSON.parse((ls && ls.getItem(CLAVE_PAPELERA)) || 'null'); return p && okRanura(p.i) ? p : null; } catch (_) { return null; } }
  // Deshacer: vuelve a su ranura si está libre; si no, a la primera libre que puedas usar
  function deshacerBorrado() {
    const ls = LS(), p = papelera(); if (!ls || !p) return -1;
    const libres = listarPartidas().filter(r => !r.existe && !r.rota && !r.bloqueada).map(r => r.i);
    const j = libres.includes(p.i) ? p.i : libres[0];
    if (j == null) return -1;
    try { ls.setItem(claveRanura(j), p.raw); ls.removeItem(CLAVE_PAPELERA); } catch (_) { return -1; }
    const x = indice(); x.meta[j] = p.meta || {}; x.borradas = (x.borradas || []).filter(k => k !== j); escribirIndice(x);
    return j;
  }
  // Copiar una carrera a otra ranura libre (probar otro camino sin perder el tuyo)
  function copiarPartida(i, j) { return sinCambiarDeporte(() => copiarPartida_(i, j)); }
  function copiarPartida_(i, j) {
    const ls = LS(); if (!ls || !okRanura(i) || !okRanura(j) || i === j || j >= ranurasMax()) return false;
    let raw = null; try { raw = ls.getItem(claveRanura(i)); if (!raw || ls.getItem(claveRanura(j))) return false; } catch (_) { return false; }
    const s = migrateSave(JSON.parse(raw)); if (!s) return false;
    s.tele = P2.nuevaTele ? P2.nuevaTele() : s.tele;   // otra carrera: otro informe de prueba
    try { ls.setItem(claveRanura(j), JSON.stringify(s)); } catch (_) { return false; }
    const x = indice(); x.meta[j] = { titulo: `${(x.meta[i] && x.meta[i].titulo) || `Carrera de ${s.nombre}`} (copia)`.slice(0, 30), guardadoEn: Date.now() }; x.borradas = (x.borradas || []).filter(k => k !== j); escribirIndice(x);
    return true;
  }
  const primeraLibre = () => { const r = listarPartidas().find(x => !x.existe && !x.rota && !x.bloqueada); return r ? r.i : -1; };
  // Copia de todas las carreras para guardarla en la cuenta (la nube). Solo datos de juego.
  function exportarPartidas() {
    const ls = LS(), x = indice(), ranuras = [];
    for (let i = 0; i < totalRanuras(); i++) { let raw = null; try { raw = ls && ls.getItem(claveRanura(i)); } catch (_) { raw = null; } if (raw) ranuras.push({ i, data: raw, titulo: (x.meta[i] || {}).titulo || null, guardadoEn: (x.meta[i] || {}).guardadoEn || null }); }
    return { v: 1, saveVersion: CFG.saveVersion, activa: x.activa, ranuras, borradas: (x.borradas || []).filter(i => !ranuras.some(r => r.i === i)) };
  }
  // Las ranuras borradas aquí ya se han borrado también en la nube
  function limpiarBorradas(lista) { const x = indice(); x.borradas = (x.borradas || []).filter(i => !(lista || []).includes(i)); escribirIndice(x); }
  // Traer carreras de la cuenta. Por defecto solo rellena ranuras vacías o más antiguas que la copia; nunca escribe algo
  // que no sea una partida válida. Las ranuras de pago solo se escriben si las tienes (si no, se quedan en la nube).
  function importarPartidas(blob, opc) { return sinCambiarDeporte(() => importarPartidas_(blob, opc)); }
  function importarPartidas_(blob, { forzar = false } = {}) {
    const ls = LS(), r = { escritas: [], omitidas: [], invalidas: [] };
    if (!ls || !blob || !Array.isArray(blob.ranuras)) return r;
    const x = indice(), max = ranurasMax();
    for (const it of blob.ranuras) {
      if (!it || !okRanura(it.i)) { r.invalidas.push(it && it.i); continue; }
      if (it.i >= max) { r.omitidas.push(it.i); continue; }
      let s = null; try { s = migrateSave(JSON.parse(it.data)); } catch (_) { s = null; }
      if (!s) { r.invalidas.push(it.i); continue; }
      let local = null; try { local = ls.getItem(claveRanura(it.i)); } catch (_) { local = null; }
      const tLocal = (x.meta[it.i] || {}).guardadoEn || 0;
      if (local && !forzar && !((it.guardadoEn || 0) > tLocal)) { r.omitidas.push(it.i); continue; }
      try { ls.setItem(claveRanura(it.i), JSON.stringify(s)); } catch (_) { r.invalidas.push(it.i); continue; }
      x.meta[it.i] = { titulo: typeof it.titulo === 'string' ? it.titulo.slice(0, 30) : undefined, guardadoEn: it.guardadoEn || Date.now() };
      x.borradas = (x.borradas || []).filter(k => k !== it.i);
      r.escritas.push(it.i);
    }
    escribirIndice(x);
    return r;
  }
  // Busca una partida de P1 en todas sus claves conocidas, de la más nueva a la más antigua.
  // Solo lee: nunca escribe ni borra el guardado original.
  function partidaP1() {
    const ls = LS(); if (!ls) return null;
    for (const k of CFG.clavesP1) {
      try { const raw = ls.getItem(k); if (!raw) continue; const v = JSON.parse(raw); if (v && typeof v === 'object' && v.p) return Object.assign(v, { __clave: k }); } catch (_) { /* clave rota: probamos la siguiente */ }
    }
    return null;
  }

  function anotar(s, ic, t) { s.diario.push({ semana: s.semana, ic, t }); if (s.diario.length > 150) s.diario.shift(); }

  Object.assign(P2, { nuevaPartida, migrateSave, rellenar, validar, desdeP1, guardar, cargar, partidaP1, anotar,
    ranurasMax, ranuraActiva, usarRanura, listarPartidas, renombrarPartida, borrarPartida, papelera, deshacerBorrado, copiarPartida, primeraLibre,
    exportarPartidas, importarPartidas, limpiarBorradas, resumenPartida, claveRanura, totalRanuras });
})(globalThis.P2 = globalThis.P2 || {});
