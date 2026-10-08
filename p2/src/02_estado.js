/* =====================================================================
   02 · ESTADO, GUARDADO Y MIGRACIÓN (saveVersion = 2)
   Una partida antigua nunca debe romper la interfaz: todo dato que falte
   se rellena con un valor seguro. Nunca se borra una partida automáticamente.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG } = P2;

  function nuevaPartida(opc = {}) {
    const I = CFG.inicio, seed = (opc.seed >>> 0) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    return {
      saveVersion: CFG.saveVersion,
      seed, rng: seed,
      nombre: opc.nombre || 'Alex', ciudad: I.ciudad, edad: I.edad,
      look: P2.validarLook ? P2.validarLook(opc.look) : (opc.look || {}),   // tu personaje (capas del avatar)
      eleccion: null,                  // acción elegida para la semana (se juega con el botón)
      semana: 1,
      fase: 'barrio',                  // barrio · pruebas · amateur · club
      p: { nivel: I.nivel, energia: I.energia, rep: I.rep, dinero: I.dinero, lesion: 0 },
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
      acum: { sueldo: 0, primas: 0, patrocinio: 0, trabajo: 0, gastos: 0, impuestos: 0, aportado: 0, retirado: 0 },
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
    s.p.nivel = P2.clamp(num(p.nivel, CFG.inicio.nivel), CFG.inicio.nivel, CFG.inicio.nivel + 6);
    s.diario.push({ semana: 1, ic: '📦', t: `Vienes de P1: conservas tu nombre, parte de tus ahorros (${P2.eur(s.p.dinero)}) y algo de fama.` });
    return s;
  }

  // migrateSave: cualquier cosa → partida v2 válida, o null si no se puede aprovechar
  function migrateSave(v) {
    if (!v || typeof v !== 'object') return null;
    if (v.saveVersion === CFG.saveVersion) return validar(rellenar(nuevaPartida({ seed: v.seed }), v));
    if (v.saveVersion == null && v.p && (v.fase || v.semana)) return validar(desdeP1(v));   // partida de P1
    if (typeof v.saveVersion === 'number' && v.saveVersion > CFG.saveVersion) return null;    // de una versión futura: no se toca
    return null;
  }
  // Corrige valores imposibles (por si el guardado se editó o se cortó a medias)
  function validar(s) {
    const E = CFG.energia;
    s.p.energia = P2.clamp(s.p.energia, 0, E.max);
    s.p.rep = P2.clamp(s.p.rep, 0, 100);
    s.p.lesion = Math.max(0, s.p.lesion | 0);
    s.confianza = P2.clamp(s.confianza, 0, 100);
    s.interes = P2.clamp(s.interes, 0, 100);
    if (!['barrio', 'pruebas', 'amateur', 'club'].includes(s.fase)) s.fase = 'barrio';
    if ((s.fase === 'club' || s.fase === 'amateur') && (!s.contrato || !s.temporada)) s.fase = s.invitacion ? 'pruebas' : 'barrio';
    if (s.contrato && !P2.OFERTAS[s.contrato.oferta]) { s.contrato = null; s.temporada = null; s.fase = 'barrio'; }
    s.negocios = s.negocios.filter(n => n && P2.NEGOCIOS[n.tipo]).map(n => rellenar(P2.nuevoNegocio(n.tipo, 0), n));
    s.patros = s.patros.filter(c => c && P2.MARCAS.some(m => m.id === c.id));
    if (s.pendiente && typeof s.pendiente !== 'object') s.pendiente = null;
    if (!Array.isArray(s.cola)) s.cola = [];
    s.diario = s.diario.slice(-150);
    if (P2.validarLook) s.look = P2.validarLook(s.look);
    s.saveVersion = CFG.saveVersion;
    return s;
  }

  // ---- Guardado en el navegador ----
  const LS = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
  function guardar(s) {
    const ls = LS(); if (!ls || !s) return false;
    try { ls.setItem(CFG.claveGuardado, JSON.stringify(s)); return true; } catch (_) { return false; }
  }
  function cargar() {
    const ls = LS(); if (!ls) return null;
    let raw = null;
    try { raw = ls.getItem(CFG.claveGuardado); } catch (_) { return null; }
    if (!raw) return null;
    try {
      const s = migrateSave(JSON.parse(raw));
      if (s) return s;
    } catch (_) { /* se guarda una copia abajo */ }
    // No se pudo leer: se aparta una copia (nunca se borra) y se empieza de nuevo
    try { ls.setItem(CFG.claveGuardado + '_copia_' + Date.now(), raw); ls.removeItem(CFG.claveGuardado); } catch (_) {}
    return null;
  }
  function partidaP1() {
    const ls = LS(); if (!ls) return null;
    try { const raw = ls.getItem(CFG.claveP1); return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  }

  function anotar(s, ic, t) { s.diario.push({ semana: s.semana, ic, t }); if (s.diario.length > 150) s.diario.shift(); }

  Object.assign(P2, { nuevaPartida, migrateSave, rellenar, validar, desdeP1, guardar, cargar, partidaP1, anotar });
})(globalThis.P2 = globalThis.P2 || {});
