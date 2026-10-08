/* =====================================================================
   12 · TELEMETRÍA LOCAL PARA PRUEBAS CON PERSONAS
   Todo se guarda solo dentro de la partida (en este navegador). No hay servidor,
   ni analítica, ni cuentas, ni envío de datos. Sin datos personales: no se guarda
   el nombre del personaje; el informe se identifica con un código al azar (TEST-A4F72).
   El tester copia el informe a mano y lo manda si quiere.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { eur } = P2;
  const PAUSA_MAX = 5 * 60 * 1000;   // más de 5 minutos sin tocar nada no cuenta como tiempo jugado
  const MOMENTOS = [['T0', 'Inicio', null], ['T1', 'Primera prueba', 'prueba'], ['T2', 'Primer contrato', 'contrato'], ['T3', 'Primera titularidad', null],
    ['T4', 'Primer patrocinador', 'patro'], ['T5', 'Primera empresa', 'empresa'], ['T6', 'Empresa rentable', 'rentable'], ['T7', 'Segunda inversión', 'inversion2']];
  const MOMENTO_DE_HITO = Object.fromEntries(MOMENTOS.filter(m => m[2]).map(m => [m[2], m[0]]));

  function codigo() { let c = ''; for (let i = 0; i < 5; i++) c += '0123456789ABCDEF'[Math.floor(Math.random() * 16)]; return 'TEST-' + c; }
  function nuevaTele() {
    return {
      id: codigo(), version: 'P2.2', inicio: new Date().toISOString(), msActivo: 0, ultimoMs: null, interacciones: 0,
      momentos: { T0: { ms: 0, semana: 1 } },
      acciones: {}, decisiones: {}, registro: [], tiempos: [],
      rutas: [], prueba: null, pruebas: [], ofertas: [], clubes: [], contratos: [], partidos: { jugados: 0, titular: 0, suplente: 0, banquillo: 0 },
      categorias: { sube: 0, baja: 0 },
      marcas: { vistas: [], firmadas: [], rechazadas: [], dejadas: [] }, actos: { ir: 0, aplazar: 0, no: 0 },
      empresa: { semana: null, caja: null, cambios: { precio: 0, empleados: 0, sueldo: 0, marketing: 0 }, aportes: 0, retiradas: 0, crisis: 0, prestamos: 0, venta: null, cierre: null, rentable: null, mejora: null },
      segunda: null, vistas: {}, porque: 0, ultimaPantalla: 'semana', ultimaAccion: null, respuestas: {},
    };
  }
  const T = s => (s.tele && typeof s.tele === 'object' ? s.tele : (s.tele = nuevaTele()));

  // Tiempo real: lo llama la interfaz en cada toque. Las pausas largas no cuentan
  function teleTiempo(s, ahora = Date.now()) {
    const t = T(s);
    if (t.ultimoMs != null) { const d = ahora - t.ultimoMs; if (d > 0 && d < PAUSA_MAX) t.msActivo += d; }
    t.ultimoMs = ahora; t.interacciones++;
  }
  function momento(s, k) { const t = T(s); if (!t.momentos[k]) t.momentos[k] = { ms: t.msActivo, semana: s.semana }; }

  // Registro de lo que pasa. tipo + datos pequeños (nunca texto libre del jugador)
  function tele(s, tipo, d = {}) {
    if (!s || !s.p) return;
    const t = T(s), sem = s.semana;
    const anota = (x) => { t.registro.push(Object.assign({ s: sem, t: tipo }, x)); if (t.registro.length > 400) t.registro.shift(); };
    // Tiempo entre decisiones (semanas jugadas y eventos), sin contar pausas largas
    if (tipo === 'accion' || tipo === 'decision') {
      const ahora = Date.now(), dt = t.ultimaDecMs ? ahora - t.ultimaDecMs : null;
      if (dt != null && dt > 0 && dt < PAUSA_MAX) t.tiempos.push(Math.round(dt / 1000));
      if (t.tiempos.length > 400) t.tiempos.shift();
      t.ultimaDecMs = ahora;
    }
    switch (tipo) {
      case 'accion': t.acciones[d.id] = (t.acciones[d.id] || 0) + 1; t.ultimaAccion = d.id;
        if (['jornada', 'torneo', 'campus', 'plaza', 'preparador'].includes(d.id) && s.fase !== 'club') t.rutas.push({ s: sem, id: d.id }); break;
      case 'decision': {
        const k = `${d.tipo}${d.id ? ':' + d.id : ''}`; t.decisiones[k] = t.decisiones[k] || {}; t.decisiones[k][d.op] = (t.decisiones[k][d.op] || 0) + 1;
        anota({ k, op: d.op }); break;
      }
      case 'invitacion': if (!t.invitacion) t.invitacion = { s: sem, via: d.via }; momento(s, 'T1'); break;
      case 'prueba': t.pruebas.push({ s: sem, score: d.score, via: d.via, ofertas: d.ofertas }); if (!t.prueba) t.prueba = t.pruebas[0]; break;
      case 'ofertas': t.ofertas.push({ s: sem, origen: d.origen, ofertas: d.ofertas }); break;
      case 'club': t.clubes.push({ s: sem, id: d.id }); t.contratos.push({ s: sem, tipo: 'firma', id: d.id }); break;
      case 'renovacion': t.contratos.push({ s: sem, tipo: 'renovación', sueldo: d.sueldo }); break;
      case 'partido': t.partidos.jugados += d.rol === 'titular' || d.rol === 'suplente' ? 1 : 0; if (t.partidos[d.rol] != null) t.partidos[d.rol]++;
        if (d.rol === 'titular' && !d.amateur) momento(s, 'T3'); break;
      case 'categoria': t.categorias[d.tipo] = (t.categorias[d.tipo] || 0) + 1; anota({ tipo: d.tipo, a: d.a }); break;
      case 'marcaVista': if (!t.marcas.vistas.includes(d.id)) t.marcas.vistas.push(d.id); break;
      case 'marcaFirmada': t.marcas.firmadas.push(d.id + (d.renov ? ' (renovación)' : '')); break;
      case 'marcaRechazada': t.marcas.rechazadas.push(d.id); break;
      case 'marcaDejada': t.marcas.dejadas.push(d.id); break;
      case 'acto': t.actos[d.op] = (t.actos[d.op] || 0) + 1; break;
      case 'empresa': if (t.empresa.semana == null) { t.empresa.semana = sem; t.empresa.caja = d.caja; } break;
      case 'config': if (t.empresa.cambios[d.campo] != null) t.empresa.cambios[d.campo]++; break;
      case 'aporte': t.empresa.aportes++; break;
      case 'retirada': t.empresa.retiradas++; break;
      case 'mejora': t.empresa.mejora = d.id; break;
      case 'crisis': t.empresa.crisis++; break;
      case 'prestamo': t.empresa.prestamos++; break;
      case 'venta': t.empresa.venta = sem; break;
      case 'cierre': t.empresa.cierre = sem; break;
      case 'hito': if (MOMENTO_DE_HITO[d.id]) momento(s, MOMENTO_DE_HITO[d.id]); if (d.id === 'rentable') t.empresa.rentable = sem; break;
      case 'segunda': t.segunda = { s: sem, id: d.id }; break;
      case 'vista': t.vistas[d.id] = (t.vistas[d.id] || 0) + 1; t.ultimaPantalla = d.id; break;
      case 'porque': t.porque++; break;
    }
  }

  // ---------- Informe copiable ----------
  const PREGUNTAS = [
    { id: 'p1', t: 'Del 1 al 10, ¿cuánto te ha apetecido seguir jugando?', tipo: 'escala' },
    { id: 'p2', t: '¿En qué momento te has aburrido más?', tipo: 'texto' },
    { id: 'p3', t: '¿Qué decisión te ha hecho dudar más?', tipo: 'texto' },
    { id: 'p4', t: '¿Has entendido por qué ganabas o perdías dinero?', tipo: 'texto' },
    { id: 'p5', t: '¿Te ha importado ganar o perder partidos?', tipo: 'texto' },
    { id: 'p6', t: '¿Te ha interesado gestionar la empresa?', tipo: 'texto' },
    { id: 'p7', t: '¿Qué parte querrías desbloquear después?', tipo: 'multi', ops: ['Más negocios', 'Subir deportivamente', 'Comprar propiedades', 'Comprar un club', 'Otro deporte', 'Otra'] },
    { id: 'p8', t: '¿Volverías a jugar mañana?', tipo: 'una', ops: ['Sí', 'Quizá', 'No'] },
  ];
  const NOMBRES_ACCION = id => (P2.ACCIONES[id] ? P2.ACCIONES[id].n : id);
  const RUTA = { ojeador: 'Ojeador (partidos en la plaza)', jornada: 'Jornada abierta', torneo: 'Torneo local', campus: 'Campus de tecnificación', repesca: 'Repesca (desde el amateur)' };
  function duracion(ms) { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`; }
  const nombreMarca = id => { const M = P2.MARCAS.find(m => m.id === id.split(' ')[0]); return M ? M.n + (id.includes('(') ? ' (renovación)' : '') : id; };

  function informeTest(s) {
    const t = T(s), L = [];
    const linea = (k, v) => L.push(`${k}: ${v}`);
    L.push('TEST P2.2', `ID: ${t.id}`, '');
    linea('Inicio', t.inicio.replace('T', ' ').slice(0, 16));
    linea('Duración real (sin pausas de más de 5 min)', duracion(t.msActivo));
    linea('Semanas jugadas', s.semana - 1);
    linea('Toques en la pantalla', t.interacciones);
    if (t.tiempos.length) { const x = t.tiempos.slice().sort((a, b) => a - b); linea('Tiempo típico por decisión', `${x[Math.floor(x.length / 2)]} s (mediana de ${x.length})`); }
    L.push('');
    linea('Ruta inicial', t.invitacion ? RUTA[t.invitacion.via] || t.invitacion.via : (s.fase === 'amateur' || s.contrato ? 'Sin prueba en la captación → amateur' : 'Aún en el barrio'));
    if (t.rutas.length) linea('Caminos probados', [...new Set(t.rutas.map(r => NOMBRES_ACCION(r.id)))].join(', '));
    if (t.prueba) { linea('Prueba', `semana ${t.prueba.s}, puntuación ${t.prueba.score}`); if (t.pruebas.length > 1) linea('Pruebas en total', t.pruebas.map(p => `${p.score} (sem. ${p.s})`).join(', ')); }
    if (t.ofertas.length) linea('Ofertas recibidas', t.ofertas.map(o => `sem. ${o.s}: ${(o.ofertas || []).map(id => (P2.OFERTAS[id] || { n: id }).n).join(' / ') || 'ninguna'}`).join(' · '));
    linea('Primer club', t.clubes.length ? P2.OFERTAS[t.clubes.find(c => !P2.OFERTAS[c.id].amateur) ? t.clubes.find(c => !P2.OFERTAS[c.id].amateur).id : t.clubes[0].id].n : '—');
    if (t.contratos.length > 1) linea('Contratos y renovaciones', t.contratos.map(c => `${c.tipo} sem. ${c.s}`).join(', '));
    linea('Partidos', `${t.partidos.jugados} jugados · ${t.partidos.titular} de titular · ${t.partidos.banquillo} en el banquillo`);
    linea('Ascensos / descensos del club', `${t.categorias.sube || 0} / ${t.categorias.baja || 0}`);
    L.push('', 'Decisiones semanales:');
    for (const [id, n] of Object.entries(t.acciones).sort((a, b) => b[1] - a[1])) L.push(`  ${NOMBRES_ACCION(id)}: ${n}`);
    L.push('', 'Patrocinadores:');
    L.push(`  Vistos: ${t.marcas.vistas.length}${t.marcas.vistas.length ? ` (${t.marcas.vistas.map(nombreMarca).join(', ')})` : ''}`);
    L.push(`  Firmados: ${t.marcas.firmadas.length}${t.marcas.firmadas.length ? ` (${t.marcas.firmadas.map(nombreMarca).join(', ')})` : ''}`);
    L.push(`  Rechazados: ${t.marcas.rechazadas.length}${t.marcas.dejadas.length ? ` · dejados: ${t.marcas.dejadas.length}` : ''}`);
    L.push(`  Actos: ${t.actos.ir} cumplidos, ${t.actos.aplazar} aplazados, ${t.actos.no} rechazados`);
    L.push('', 'Empresa:');
    if (t.empresa.semana != null) {
      L.push(`  Compra: semana ${t.empresa.semana}`, `  Caja inicial: ${eur(t.empresa.caja)}`, `  Mejora inicial: ${t.empresa.mejora || '—'}`);
      const c = t.empresa.cambios;
      L.push(`  Cambios de precio: ${c.precio} · plantilla: ${c.empleados} · sueldos: ${c.sueldo} · publicidad: ${c.marketing}`);
      L.push(`  Dinero puesto en la caja: ${t.empresa.aportes} veces · sacado: ${t.empresa.retiradas} veces`);
      L.push(`  Crisis: ${t.empresa.crisis} · préstamos: ${t.empresa.prestamos}${t.empresa.venta ? ` · vendida en la semana ${t.empresa.venta}` : ''}${t.empresa.cierre ? ` · cerrada en la semana ${t.empresa.cierre}` : ''}`);
      L.push(`  Rentable: ${t.empresa.rentable ? `semana ${t.empresa.rentable}` : 'todavía no'}`);
    } else L.push('  No ha comprado empresa');
    linea('\nSegunda inversión', t.segunda ? `${(P2.OPORTUNIDADES.find(o => o.id === t.segunda.id) || {}).n} (semana ${t.segunda.s})` : '—');
    L.push('', 'Momentos clave (tiempo real · semana de juego):');
    for (const [k, n] of MOMENTOS) { const m = t.momentos[k]; L.push(`  ${k} ${n}: ${m ? `${duracion(m.ms)} · semana ${m.semana}` : '—'}`); }
    L.push('', 'Hitos alcanzados:');
    for (const H of P2.HITOS) if (s.hitos[H.id]) L.push(`  ✔ ${H.n} (semana ${s.hitos[H.id]})`);
    const v = Object.entries(t.vistas).sort((a, b) => b[1] - a[1]);
    L.push('', `Pantallas más visitadas: ${v.length ? v.map(([k, n]) => `${k} ${n}`).join(', ') : '—'}`);
    linea('Consultas de «¿Por qué ha pasado esto?»', t.porque);
    linea('Momento de salida', `semana ${s.semana}, ${s.fase === 'club' ? 'profesional' : s.fase}, pantalla «${t.ultimaPantalla}», última acción «${t.ultimaAccion ? NOMBRES_ACCION(t.ultimaAccion) : '—'}»${s.pendiente ? `, con una decisión pendiente (${s.pendiente.tipo})` : ''}`);
    linea('Estado final', `nivel ${P2.nf(s.p.nivel)} · reputación deportiva ${Math.round(s.p.rep)} · marca personal ${Math.round(s.p.marca || 0)} · patrimonio ${eur(P2.patrimonio(s))}`);
    L.push('', 'PREGUNTAS');
    for (const [i, q] of PREGUNTAS.entries()) { const r = t.respuestas[q.id]; L.push(`${i + 1}. ${q.t}`, `   ${Array.isArray(r) ? (r.length ? r.join(', ') : '—') : (r != null && r !== '' ? String(r) : '—')}`); }
    return L.join('\n');
  }
  function responder(s, id, valor) {
    const q = PREGUNTAS.find(x => x.id === id); if (!q) return false;
    const t = T(s);
    if (q.tipo === 'multi') { const l = Array.isArray(t.respuestas[id]) ? t.respuestas[id] : []; t.respuestas[id] = l.includes(valor) ? l.filter(x => x !== valor) : l.concat(valor); }
    else t.respuestas[id] = typeof valor === 'string' ? valor.slice(0, 400) : valor;
    return true;
  }

  Object.assign(P2, { nuevaTele, tele, teleTiempo, momentoTele: momento, informeTest, responderTest: responder, PREGUNTAS_TEST: PREGUNTAS, MOMENTOS_TEST: MOMENTOS });
})(globalThis.P2 = globalThis.P2 || {});
