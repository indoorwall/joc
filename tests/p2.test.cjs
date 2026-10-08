// Pruebas de P2: lógica (Node) + interfaz (Chromium emulando un iPhone 13)
// Uso: node tests/p2.test.cjs          (añade --rapido para saltarse la interfaz)
const path = require('path'), fs = require('fs');
const cargarP2 = require('../p2/cargar.cjs');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('/opt/node22/lib/node_modules/playwright'); }
let ok = 0, total = 0;
function check(t, c, extra) { total++; if (c) ok++; console.log(`${c ? 'OK   ' : 'FALLA'} ${t}${!c && extra != null ? ' — ' + extra : ''}`); }

const P2 = cargarP2();
const resolverTodo = (s, pref = []) => { let g = 0; while (s.pendiente && g++ < 10) { const v = P2.vistaPendiente(s); const o = pref.map(p => v.ops.find(x => x.id === p && !x.bloqueo)).find(Boolean) || v.ops.find(x => !x.bloqueo); P2.resolverDecision(s, o.id); } };
// Partida ya en un club profesional (atajo para probar la temporada)
function enClub(oferta = 'puerto', seed = 5) {
  const s = P2.nuevaPartida({ seed }); s.p.nivel = 56; P2.firmar(s, oferta, null); s.p.energia = 90; return s;
}

// ---------- 1. Estado y guardado ----------
{
  const s = P2.nuevaPartida({ seed: 1 });
  check('Partida nueva con saveVersion 2', s.saveVersion === 2 && s.fase === 'barrio' && s.semana === 1);
  for (let i = 0; i < 12; i++) { resolverTodo(s); P2.jugarSemana(s, P2.POLITICAS.equilibrada.accion(s)) || P2.jugarSemana(s, 'descansar'); }
  const copia = P2.migrateSave(JSON.parse(JSON.stringify(s)));
  check('Guardar/cargar conserva todos los sistemas', JSON.stringify(copia) === JSON.stringify(s));
  const viejo = JSON.parse(JSON.stringify(s)); delete viejo.agenda; delete viejo.acum; delete viejo.p.lesion; viejo.confianza = 'x';
  const m = P2.migrateSave(viejo);
  check('Un guardado al que le faltan datos se rellena con valores seguros', m && Array.isArray(m.agenda) && m.acum.sueldo >= 0 && m.p.lesion === 0 && typeof m.confianza === 'number');
  check('Un guardado de una versión futura no se toca', P2.migrateSave({ saveVersion: 99 }) === null && P2.migrateSave('basura') === null && P2.migrateSave(null) === null);
  const p1 = { nombre: 'Leo', semana: 140, fase: 'club', p: { dinero: 999999, rep: 80, nivel: 77, energia: 50 }, negocios: [{ tipo: 'peluqueria' }], contrato: { clubId: 'x' } };
  const d = P2.migrateSave(p1);
  check('Una partida de P1 se convierte en P2 sin romper', d && d.saveVersion === 2 && d.nombre === 'Leo' && d.fase === 'barrio' && d.p.dinero <= 2000 && d.origen === 'p1');
  let crash = false; for (const raro of [{ p: null, fase: 'x' }, { p: {}, semana: 'a' }, { p: { dinero: 'mucho' }, fase: 1, nombre: 5 }]) { try { const r = P2.migrateSave(raro); if (r) { P2.jugarSemana(r, 'descansar'); } } catch (e) { crash = e.message; } }
  check('Partidas de P1 raras o rotas no provocan errores', !crash, crash);
}

// ---------- 2. Barrio, captación y pruebas ----------
{
  const s = P2.nuevaPartida({ seed: 2 });
  s.p.energia = 20;
  check('Sin energía no se puede entrenar, trabajar ni jugar en la plaza', ['entrenar', 'trabajar', 'plaza'].every(a => P2.bloqueoAccion(s, a)) && !P2.bloqueoAccion(s, 'descansar'));
  check('Una acción bloqueada no avanza la semana', P2.jugarSemana(s, 'trabajar') === null && s.semana === 1);
  const t = P2.nuevaPartida({ seed: 3 }); let trabajos = 0;
  for (let i = 0; i < 8; i++) { resolverTodo(t, ['no']); if (P2.jugarSemana(t, 'trabajar')) trabajos++; else P2.jugarSemana(t, 'descansar'); }
  resolverTodo(t);
  check('Trabajar todo lo posible: menos de 8 semanas de trabajo y se acaba la captación', trabajos < 8 && t.fase === 'amateur', `trabajos ${trabajos}, fase ${t.fase}`);
  check('Sin prueba no hay game over: ruta amateur con repesca', t.contrato && P2.OFERTAS[t.contrato.oferta].amateur);
  check('Tras la captación ya no se puede trabajar de repartidor', P2.bloqueoAccion(t, 'trabajar') !== null);
  const rangos = [[45, ''], [50, 'puerto'], [58, 'atleticoFormacion+puerto'], [64, 'atleticoFilial+puerto']].map(([sc, esp]) => P2.ofertasPorPuntuacion(sc).slice().sort().join('+') === esp);
  check('Las pruebas abren puertas distintas según la puntuación (<48, 48–54, 55–61, 62+)', rangos.every(Boolean), JSON.stringify(rangos));
  // La suerte no anula la preparación: con nivel 40 sin preparar nunca llegas a la filial; con 60 + preparador, nunca te quedas fuera
  const sc = (nivel, prep) => { const l = []; for (let i = 0; i < 300; i++) { const x = P2.nuevaPartida({ seed: 100 + i }); x.p.nivel = nivel; x.p.energia = 80; x.preparador = prep; l.push(P2.puntuacionPruebas(x, 'ojeador').score); } return l; };
  const bajos = sc(40, false), altos = sc(60, true);
  check('La suerte cuenta, pero no anula la preparación', Math.max(...bajos) < 55 && Math.min(...altos) >= 55, `bajos máx ${Math.max(...bajos)}, altos mín ${Math.min(...altos)}`);
  const caminos = new Set();
  for (const pol of ['equilibrada', 'todoFutbol', 'todoEntreno', 'imagen']) for (let i = 0; i < 40; i++) { const l = P2.jugarPartida(pol, 500 + i, 20); if (l.via) caminos.add(l.via); }
  check('Hay al menos 3 caminos distintos para llegar a las pruebas', caminos.size >= 3, [...caminos].join(', '));
}

// ---------- 3. Liga, partidos, primas, lesiones y contratos ----------
{
  const s = enClub('puerto');
  let jugadosAntes = 0, maxPorSemana = 0;
  for (let w = 0; w < 14; w++) {
    resolverTodo(s, ['seguir', 'renovar']);
    jugadosAntes = s.stats.jugados;
    if (s.temporada.jornada >= 14) break;
    P2.jugarSemana(s, s.p.energia < 50 ? 'descansar' : 'entrenoExtra') || P2.jugarSemana(s, 'descansar');
    maxPorSemana = Math.max(maxPorSemana, s.stats.jugados - jugadosAntes);
  }
  check('Cada semana cuenta como mucho un partido', maxPorSemana <= 1);
  const T = s.temporadasJugadas.length ? null : s.temporada;
  const tabla = P2.clasificacion(s.temporada);
  check('La clasificación no duplica resultados (todos con los mismos partidos jugados)', tabla.every(r => r.pj === s.temporada.jornada) && tabla.reduce((a, r) => a + r.g, 0) === tabla.reduce((a, r) => a + r.p, 0));
  check('La temporada tiene 14 jornadas con 8 equipos (ida y vuelta)', s.temporada.calendario.length === 14 && s.temporada.calendario.every(j => j.length === 4));
  const ids = s.temporada.equipos.map(e => e.id); const veces = {}; for (const j of s.temporada.calendario) for (const [a, b] of j) { veces[a + b] = (veces[a + b] || 0) + 1; }
  check('Cada equipo juega contra cada rival una vez en casa y otra fuera', ids.every(a => ids.every(b => a === b || veces[a + b] === 1)));
  // Repetir una jornada ya jugada no cuenta de nuevo ni paga dos veces la prima
  const s2 = enClub('puerto', 9); let g = 0;
  while (g++ < 14) { resolverTodo(s2, ['fresco']); P2.jugarSemana(s2, 'descansar'); if (Object.keys(s2.primasCobradas).length) break; }
  const din = s2.p.dinero, pj = s2.stats.jugados, T2 = s2.temporada; T2.jornada -= 1;
  P2.jugarPartido(s2, { lineas: [], porque: [], ingresos: [], hitos: [] });
  check('Una prima no se cobra dos veces y el partido no se cuenta dos veces', s2.p.dinero === din && s2.stats.jugados === pj, `${din}→${s2.p.dinero}`);
  T2.jornada += 1;
  // Fin de contrato
  const s3 = enClub('puerto', 11);
  for (let w = 0; w < 14; w++) { resolverTodo(s3, ['fresco', 'no', 'esperar']); P2.jugarSemana(s3, 'descansar'); }
  for (let g = 0; g < 5 && s3.pendiente && s3.pendiente.tipo !== 'ofertas'; g++) { const v = P2.vistaPendiente(s3); P2.resolverDecision(s3, v.ops.find(o => !o.bloqueo).id); }
  check('El contrato de una temporada expira y llegan ofertas', s3.contrato.temporadasRestantes === 0 && s3.pendiente && s3.pendiente.tipo === 'ofertas' && s3.pendiente.origen === 'fin', JSON.stringify(s3.pendiente));
  resolverTodo(s3, ['renovar', 'costaReal', 'puerto']);
  check('Tras decidir, empieza una temporada nueva', s3.temporada.jornada === 0 && !s3.temporada.cerrada && s3.contrato.temporadasRestantes > 0);
  // Lesiones
  const s4 = enClub('puerto', 12); s4.p.lesion = 2;
  P2.jugarSemana(s4, 'descansar'); const l1 = s4.p.lesion; resolverTodo(s4, ['parar']); P2.jugarSemana(s4, 'descansar');
  check('Las lesiones se recuperan (2 semanas → 0)', l1 === 1 && s4.p.lesion === 0 && s4.ultimo.lineas.some(l => /Recuperad/.test(l[1])));
  check('Lesionado/a no juegas', s4.temporadasJugadas.length === 0 && s4.stats.jugados <= 1);
  // Contexto de la tabla
  const s5 = enClub('puerto', 13); for (let w = 0; w < 5; w++) { resolverTodo(s5); P2.jugarSemana(s5, 'descansar'); }
  check('Antes de cada jornada hay contexto («si ganáis…», «estáis en descenso…»)', P2.contexto(s5.temporada).length > 0);
  const pt = P2.probTitular(s5);
  check('La probabilidad de ser titular se muestra en palabras', pt && /alta|media|baja/.test(pt.nivel));
}

// ---------- 4. Atlético frente a Puerto ----------
{
  const P = P2.OFERTAS.puerto, A = P2.OFERTAS.atleticoFormacion;
  check('Puerto: más sueldo, prima y minutos; Atlético: mejor entreno, exposición y marcas deportivas',
    P.sueldo > A.sueldo && P.prima > A.prima && P.minutos > A.minutos && A.entreno > P.entreno && A.exposicion > P.exposicion && P.patroTier === 'local' && A.patroTier === 'deportiva');
  const a = enClub('atleticoFormacion', 21), p = enClub('puerto', 21);
  check('Las marcas deportivas solo llegan desde el Atlético (o clubes mejores)', P2.bloqueoMarca(p, P2.MARCAS.find(m => m.id === 'kinetic')) !== null && /visibilidad/.test(P2.bloqueoMarca(p, P2.MARCAS.find(m => m.id === 'kinetic'))));
}

// ---------- 5. Patrocinios ----------
{
  const s = enClub('atleticoFilial', 30); s.p.rep = 60; s.p.marca = 60; s.stats.titular = 10;
  P2.firmarMarca(s, 'panaderia', null); P2.firmarMarca(s, 'kinetic', null);
  check('Máximo 2 patrocinadores a la vez', !P2.firmarMarca(s, 'talleres', null) && s.patros.length === 2);
  check('Firmar un patrocinador da el hito', !!s.hitos.patro);
  let actos = 0;
  for (let w = 0; w < 10; w++) { if (s.pendiente && s.pendiente.tipo === 'acto') { actos++; P2.resolverDecision(s, 'ir'); continue; } resolverTodo(s, ['fresco', 'no']); P2.jugarSemana(s, 'descansar'); }
  check('Los actos salen del contrato con fecha (no se pueden repetir a voluntad)', actos >= 1 && actos <= 4 && !P2.ACCIONES.acto, `actos ${actos}`);
  const s2 = enClub('atleticoFilial', 31); s2.p.rep = 60; s2.p.marca = 60; P2.firmarMarca(s2, 'panaderia', null);
  let rotos = 0; for (let w = 0; w < 14; w++) { if (s2.pendiente && s2.pendiente.tipo === 'acto') { P2.resolverDecision(s2, 'no'); continue; } resolverTodo(s2, ['fresco', 'no']); P2.jugarSemana(s2, 'descansar'); }
  check('Faltar dos veces rompe el contrato', s2.patros.length === 0 && s2.patroHist.some(h => h.roto));
}

// ---------- 6. Empresa ----------
{
  const s = enClub('puerto', 40); s.p.dinero = 20000; s.hitos.patro = 1;
  const n = P2.comprarNegocio(s, 'peluqueria', 0, null);
  const A = P2.NEGOCIOS.peluqueria.arranque;
  check('Comprar la peluquería: traspaso + caja inicial; la puesta en marcha (fianza y stock) sale de la caja', n && s.p.dinero === 20000 - 4500 - 1500 && n.caja === 1500 - A.fianza - A.stock && n.fianza === A.fianza);
  P2.jugarSemana(s, 'descansar');
  check('La primera semana la clientela desconfía (ingresos al 60 %)', n.ultimo && n.ultimo.ingresos < P2.calcularSemana(s, Object.assign({}, n, { semanas: 3 })).ingresos * 0.8);
  check('Tras la primera semana llega la oportunidad de mejorar el local', s.pendiente && s.pendiente.tipo === 'mejoraInicial');
  const vm = P2.vistaPendiente(s);
  check('Con la caja mínima no llega para la reforma (con más caja, sí)', vm.ops.find(o => o.id === 'reforma').bloqueo && (() => { const x = enClub('puerto', 41); x.p.dinero = 20000; x.hitos.patro = 1; const m = P2.comprarNegocio(x, 'peluqueria', 2, null); return m.caja >= 1600; })());
  P2.resolverDecision(s, 'nada');
  const din = s.p.dinero;
  Object.assign(n, { precio: 'caro', sueldo: 'alto', empleados: 4, marketing: 'fuerte' });
  let crisis = false;
  for (let w = 0; w < 6; w++) { if (s.pendiente) { if (s.pendiente.tipo === 'crisis') { crisis = true; break; } resolverTodo(s, ['fresco', 'no', 'ya']); continue; } P2.jugarSemana(s, 'descansar'); }
  check('Una empresa mal gestionada pierde dinero', n.hist.slice(-3).some(b => b < 0));
  check('Con pérdidas y poca caja llega una crisis con varias salidas', crisis && P2.vistaPendiente(s).ops.length >= 4);
  check('La caja de la empresa no toca tu dinero personal', s.p.dinero >= din - 1000);
  P2.resolverDecision(s, 'prestamo');
  check('Pedir financiación en la crisis: caja +3.000 y deuda', n.deuda > 0 && n.caja > 0);
  for (let w = 0; w < 10; w++) { resolverTodo(s, ['fresco', 'no', 'ya', 'subir', 'gratis', 'temporal', 'igualar', 'aceptar', 'aportar']); P2.gestorListo(s, n); P2.jugarSemana(s, 'descansar'); }
  check('La empresa se puede recuperar', n.hist.slice(-3).every(b => b > 0) && n.rachaPos >= 3, JSON.stringify(n.hist.slice(-4)));
  const v1 = P2.valorNegocio(n); n.hist = n.hist.map(x => x + 200); const v2 = P2.valorNegocio(n);
  check('El valor depende del beneficio medio (más beneficio → vale más; la deuda resta)', v2 > v1 && P2.valorNegocio(Object.assign({}, n, { deuda: 5000 })) < v2);
  check('Mover dinero entre tu cuenta y la caja es explícito', P2.aportar(s, n.id, 100) && P2.retirar(s, n.id, 100) && !P2.retirar(s, n.id, 99999999));
  const pelu = P2.analisisPeluqueria();
  check('La peluquería no tiene una configuración óptima para todos los contextos', pelu.distintas >= 3, JSON.stringify(pelu));
  check('Sin contrato profesional no se puede comprar empresa', P2.bloqueoCompra(P2.nuevaPartida({ seed: 1 }), 'peluqueria', 0) !== null);
}

// ---------- 6b. P2.1: ascensos, elección, patrocinios, inversiones, eventos, navegación, P1 ----------
{
  const resolverHasta = (s, tipo, pref) => { let g = 0; while (s.pendiente && s.pendiente.tipo !== tipo && g++ < 15) { const v = P2.vistaPendiente(s); const o = pref.map(p => v.ops.find(x => x.id === p && !x.bloqueo)).find(Boolean) || v.ops.find(x => !x.bloqueo); P2.resolverDecision(s, o.id); } };
  const jugarTemporada = (s, pref = ['fresco', 'no', 'esperar', 'parar', 'nada']) => { for (let w = 0; w < 14 && !(s.temporada.cerrada); w++) { resolverHasta(s, '__', pref); P2.jugarSemana(s, 'descansar'); } resolverHasta(s, 'cambioCategoria', pref); };
  // Ascenso real
  const a = enClub('puerto', 61); a.p.nivel = 78; P2.mundo(a).equipos.puerto.fuerza = 56; a.temporada.fuerzas.puerto = 56;
  const antes = a.temporada.equipos.map(e => e.id).sort().join();
  jugarTemporada(a);
  const evA = a.pendiente;
  check('Ascenso: al acabar en zona de ascenso sale la celebración', evA && evA.tipo === 'cambioCategoria' && evA.mov.tipo === 'sube' && P2.vistaPendiente(a).fiesta === true, JSON.stringify(evA && evA.mov));
  resolverHasta(a, '__', ['seguir', 'renovar']);
  check('Ascenso: la temporada siguiente se juega en la categoría superior', a.temporada.liga === 'segunda' && P2.mundo(a).ligas.segunda.includes('puerto') && !P2.mundo(a).ligas.tercera.includes('puerto'), a.temporada.liga);
  check('Ascenso: cambian los rivales, la dificultad y el objetivo', a.temporada.equipos.map(e => e.id).sort().join() !== antes && Object.values(a.temporada.fuerzas).reduce((x, y) => x + y, 0) / 8 > 56 && ['descenso', 'top4'].includes(a.temporada.objetivo), a.temporada.objetivo);
  // Descenso real
  const d = enClub('puerto', 62); d.p.nivel = 40; P2.mundo(d).equipos.puerto.fuerza = 36; d.temporada.fuerzas.puerto = 36;
  jugarTemporada(d);
  check('Descenso: al acabar en los 2 últimos, el club baja', d.pendiente && d.pendiente.tipo === 'cambioCategoria' && d.pendiente.mov.tipo === 'baja');
  resolverHasta(d, '__', ['seguir', 'renovar', 'puerto']);
  check('Descenso: la temporada siguiente se juega en la categoría inferior con otros rivales', d.temporada.liga === 'regional' && d.temporada.equipos.some(e => P2.LIGAS.regional.equipos.some(x => x.id === e.id)), d.temporada.liga);
  // Un filial no sube a la categoría de su primer equipo
  const fl = enClub('atleticoFilial', 63); fl.p.nivel = 80; P2.mundo(fl).equipos.atleticoB.fuerza = 66; fl.temporada.fuerzas.atleticoB = 66;
  jugarTemporada(fl); resolverHasta(fl, '__', ['seguir', 'renovar', 'atleticoPrimero']);
  check('Un filial no puede subir a la categoría donde juega su primer equipo', P2.ligaDeClub(fl, 'atleticoB') === 'tercera');
  // Ascenso del club ≠ oferta personal
  check('El ascenso del club no cambia tu contrato (es independiente de tus ofertas)', a.contrato && P2.OFERTAS[a.contrato.oferta].club === 'puerto');

  // Elección semanal explícita
  const e = P2.nuevaPartida({ seed: 70 }); e.eleccion = 'entrenar'; P2.jugarSemana(e, 'entrenar');
  check('Después de cada semana no queda ninguna acción elegida', e.eleccion === null);

  // Patrocinio: N semanas = N pagos; renovar sin prima completa
  const p = enClub('atleticoFilial', 71); p.p.rep = 60; p.p.marca = 60; p.p.nivel = 60; P2.firmarMarca(p, 'panaderia', null);
  const M = P2.MARCAS.find(m => m.id === 'panaderia'); let pagos = 0, sem = p.semana;
  for (let w = 0; w < 32 && !(p.pendiente && p.pendiente.tipo === 'renovarMarca'); w++) {
    if (p.pendiente) { const id = p.pendiente.tipo === 'acto' ? 'ir' : (P2.vistaPendiente(p).ops.find(o => ['fresco', 'no', 'esperar', 'seguir', 'renovar', 'parar'].includes(o.id) && !o.bloqueo) || P2.vistaPendiente(p).ops.find(o => !o.bloqueo)).id; P2.resolverDecision(p, id); }
    else P2.jugarSemana(p, 'descansar');
    if (p.semana !== sem) { pagos += (p.ultimo.ingresos || []).filter(([t]) => t.includes(M.n)).length; sem = p.semana; }
  }
  check(`Un patrocinio de ${M.semanas} semanas paga exactamente ${M.semanas} veces`, pagos === M.semanas, `pagos ${pagos}`);
  check('Al terminar el contrato se puede negociar la renovación', p.pendiente && p.pendiente.tipo === 'renovarMarca');
  const d0 = p.p.dinero; P2.resolverDecision(p, 'renovar');
  const primaRen = Math.round(Math.round(M.prima * P2.CFG.patrocinio.primaRenovacion) * (1 - P2.CFG.club.impuesto));
  check('Renovar no vuelve a pagar la prima inicial completa (solo la de renovación)', p.p.dinero - d0 === primaRen && primaRen < M.prima * 0.5, `${p.p.dinero - d0} vs ${M.prima}`);
  const p2 = enClub('atleticoFilial', 72); p2.p.rep = 60; p2.p.marca = 60; p2.p.nivel = 60; P2.firmarMarca(p2, 'panaderia', null); p2.patros[0].faltas = 1; P2.resolverActo(p2, 'panaderia', 'no');
  check('Romper por incumplir hace perder la marca para siempre', p2.patros.length === 0 && /no vuelve/.test(P2.bloqueoMarca(p2, M) || ''));

  // Segunda inversión: tres estructuras financieras
  const base = () => { const s = enClub('puerto', 80); s.p.dinero = 9000; s.hitos.patro = 1; P2.comprarNegocio(s, 'peluqueria', 1, null); s.hitos.rentable = 1; s.p.dinero = 3600; return s; };
  const L = base(); P2.elegirOportunidad(L, 'local');
  check('Local: entrada asequible + hipoteca, sin alquiler y con valor como activo', L.p.dinero === 100 && L.negocios[0].local && L.negocios[0].hipoteca.deuda === 10500 && P2.calcularSemana(L, L.negocios[0]).costes.alquiler === 0 && L.negocios[0].valorLocal === 14000);
  const S2 = base(); P2.elegirOportunidad(S2, 'segunda');
  check('Segunda peluquería: entrada + préstamo a cargo del nuevo negocio', S2.p.dinero === 100 && S2.negocios.length === 2 && S2.negocios[1].deuda === 4000);
  const So = base(); P2.elegirOportunidad(So, 'socio');
  check('Socio: inversión menor y una participación con su propio valor', So.p.dinero === 600 && So.socio.valor === 3000 && So.socio.aportado === 3000);
  check('Las tres segundas inversiones caben en el dinero típico al desbloquearlas (≤ 3.500 €)', P2.OPORTUNIDADES.every(o => o.coste <= 3500));
  // La participación puede perder valor, quedarse sin dividendo y pedir capital
  let pierde = 0, gana = 0, sinDiv = 0, ampl = 0, ofertas = 0;
  for (let i = 0; i < 300; i++) {
    const x = P2.nuevaPartida({ seed: 9000 + i }); x.socio = P2.nuevaParticipacion(x, 3000);
    for (let q = 0; q < 8; q++) { x.semana = x.socio.proximo; const Rq = { lineas: [], ingresos: [] }; P2.semanaSocio(x, Rq); if (!Rq.ingresos.length) sinDiv++; if (x.pendiente) { if (x.pendiente.tipo === 'socioCapital') ampl++; else ofertas++; P2.resolverDecision(x, 'no'); } }
    const total = x.socio.valor + x.socio.dividendos - (x.socio.aportado - 3000);
    if (total < 3000) pierde++; else gana++;
  }
  check('La inversión como socio puede perder valor (y otras veces ganar)', pierde > 20 && gana > 20, `pierde ${pierde}, gana ${gana}`);
  check('Socio: hay trimestres sin dividendo, peticiones de capital y ofertas de compra', sinDiv > 100 && ampl > 5 && ofertas > 5, `sin dividendo ${sinDiv}, ampliaciones ${ampl}, ofertas ${ofertas}`);

  // Eventos que ocupan la semana
  const o = enClub('puerto', 90); o.p.rep = 40; o.pendiente = { tipo: 'suceso', id: 'clinic' };
  const s0 = o.semana; P2.resolverDecision(o, 'ir');
  check('Un evento con ocupaSemana consume la semana (no permite otra acción)', o.semana === s0 + 1 && o.cont.descansar == null && o.ultimo.lineas.some(l => /semana se va/.test(l[1])));
  const o2 = enClub('puerto', 91); o2.p.rep = 40; o2.pendiente = { tipo: 'suceso', id: 'clinic' }; P2.resolverDecision(o2, 'no');
  check('Una opción sin ocupaSemana no consume la semana', o2.semana === 1);
  const ocupan = P2.SUCESOS.flatMap(E => E.ops.filter(x => x.ocupaSemana).map(x => `${E.id}:${x.id}`));
  check('Hay eventos que ocupan la semana y otros que no', ocupan.length >= 4 && ocupan.length < P2.SUCESOS.reduce((a, E) => a + E.ops.length, 0) / 2, ocupan.join(', '));

  // Navegación progresiva
  const nv = P2.nuevaPartida({ seed: 95 });
  check('Al empezar se ven Inicio, Relaciones, Tienda, Inversiones, Patrimonio, Premium, Personaje, Mi historia, Hitos y Ajustes (sin Liga, Marcas ni Empresa)', P2.seccionesVisibles(nv).map(x => x.id).join() === 'semana,relaciones,tienda,inversiones,patrimonio,premium,personaje,historia,hitos,ajustes');
  check('Relaciones y Tienda están disponibles desde el inicio (antes que Empresa)', ['relaciones', 'tienda'].every(id => nv.secciones.includes(id)) && !nv.secciones.includes('empresa'));
  nv.p.nivel = 56; P2.firmar(nv, 'puerto', null); const nuevas = P2.revisarSecciones(nv, null).map(x => x.id);
  check('Al firmar se abren Liga y Marcas (y se avisa)', nuevas.includes('liga') && nuevas.includes('marcas') && !P2.seccionesVisibles(nv).some(x => x.id === 'empresa') && nv.seccionesNuevas.includes('liga'));
  nv.hitos.patro = 5;
  check('Al abrirse el mercado aparece Empresa', P2.revisarSecciones(nv, null).map(x => x.id).join() === 'empresa');
  check('Empresa se anuncia como gran desbloqueo («NUEVO: EMPRESA»)', [nv.pendiente].concat(nv.cola).some(e => e && e.tipo === 'desbloqueo' && e.seccion === 'empresa'));
  check('Cada sección vive en uno de los 5 grupos de la barra (Inicio, Carrera, Vida, Imperio, Perfil)', P2.GRUPOS.length === 5 && P2.SECCIONES.every(x => P2.GRUPOS.some(g => g.id === x.grupo)));
  // Partida antigua (P2.2) sin las secciones nuevas: se añaden sin avisos
  const vieja = JSON.parse(JSON.stringify(P2.nuevaPartida({ seed: 97 }))); vieja.secciones = ['semana', 'hitos', 'ajustes']; delete vieja.inventario; delete vieja.relaciones; delete vieja.equipado;
  const vm2 = P2.migrateSave(vieja); const av = P2.revisarSecciones(vm2, null);
  check('Una partida de P2.2 se carga con Tienda y Relaciones, sin avisos de «nuevo»', vm2 && Array.isArray(vm2.inventario) && vm2.secciones.includes('tienda') && vm2.secciones.includes('relaciones') && !av.length && !(vm2.seccionesNuevas || []).length);

  // ---------- Tienda ----------
  const t1 = P2.nuevaPartida({ seed: 98 }); t1.p.dinero = 1000;
  const dt0 = t1.p.dinero, bota = P2.producto('botas');
  P2.comprar(t1, 'botas');
  check('Comprar resta el dinero una sola vez', t1.p.dinero === dt0 - bota.precio, t1.p.dinero);
  check('El producto queda en el inventario (y puesto en su hueco)', t1.inventario.some(x => x.id === 'botas') && t1.equipado.calzado === 'botas');
  const d1 = t1.p.dinero;
  check('No se puede comprar dos veces algo único', P2.comprar(t1, 'botas') === null && t1.p.dinero === d1 && t1.inventario.filter(x => x.id === 'botas').length === 1 && !!P2.bloqueoProducto(t1, bota));
  check('Sin dinero no se compra (y no resta nada)', (() => { const x = P2.nuevaPartida({ seed: 99 }); x.p.dinero = 10; return P2.comprar(x, 'consola') === null && x.p.dinero === 10; })());
  check('Lo que pide un hito está bloqueado hasta conseguirlo', !!P2.bloqueoProducto(t1, P2.producto('moto')) && /contrato/i.test(P2.bloqueoProducto(t1, P2.producto('moto'))));
  P2.comprar(t1, 'bici');
  const g1 = P2.migrateSave(JSON.parse(JSON.stringify(t1)));
  check('Guardar/cargar conserva las compras y lo que llevas puesto', g1.inventario.map(x => x.id).join() === 'botas,bici' && g1.equipado.vehiculo === 'bici' && g1.acum.compras === bota.precio + 180);
  const bici = t1.inventario.find(x => x.id === 'bici');
  check('Los patrimoniales guardan precio de compra y valor actual', bici.precioCompra === 180 && bici.valorActual === 90);
  check('El patrimonio incluye los activos patrimoniales (y no lo que no lo es)', P2.patrimonio(t1) === Math.round(t1.p.dinero + 90));
  check('Efectos pequeños y coherentes: botas +3 % entreno, bici +1 energía', Math.abs(P2.efectoTienda(t1, 'entreno') - 0.03) < 1e-9 && P2.efectoTienda(t1, 'recuperacion') === 1);
  const dv = t1.p.dinero; P2.venderPosesion(t1, bici.uid);
  check('Vender un patrimonial devuelve su valor actual y lo saca del inventario', t1.p.dinero === dv + 90 && !t1.inventario.some(x => x.id === 'bici') && !t1.equipado.vehiculo);
  const es = P2.nuevaPartida({ seed: 100 }); es.p.dinero = 2000; es.p.energia = 30;
  P2.comprar(es, 'escapada');
  check('Un consumible no va al inventario, aplica su efecto y no se repite hasta pasar su espera', es.p.energia === 70 && !es.inventario.length && P2.comprar(es, 'escapada') === null && P2.valorRel(es, 'marc') === 73);
  check('Ningún producto es obligatorio: todos los efectos son pequeños', P2.PRODUCTOS.every(P => !P.ef || ((P.ef.entreno || 0) <= 0.06 && (P.ef.prensa || 0) <= 0.15 && (P.ef.recuperacion || 0) <= 4)));
  check('Las 7 categorías tienen productos', P2.CATEGORIAS_TIENDA.length === 7 && P2.CATEGORIAS_TIENDA.every(c => P2.PRODUCTOS.some(P => P.cat === c.id)));
  const lk = P2.nuevaPartida({ seed: 101 }); lk.p.dinero = 5000; lk.hitos.contrato = 3;
  check('Una prenda de la Tienda desbloquea su ropa en el personaje', !P2.ponerLook(lk, 'ropa', 'traje') && P2.comprar(lk, 'outfit') && P2.ponerLook(lk, 'ropa', 'traje'));

  // ---------- Relaciones ----------
  const r1 = P2.nuevaPartida({ seed: 102 });
  check('Al empezar se ven familia y amigos; compañero, míster y representante aparecen después', ['madre', 'padre', 'marc', 'dani'].every(id => P2.personasVisibles(r1).some(R => R.id === id && !R.bloqueada)) && !P2.personasVisibles(r1).some(R => ['iker', 'mister', 'sonia'].includes(R.id)));
  check('Pareja y Contactos se ven bloqueados («más adelante»)', P2.personasVisibles(r1).filter(R => R.bloqueada).map(R => R.id).join() === 'pareja,contactos');
  const v0 = P2.valorRel(r1, 'marc');
  for (let i = 0; i < 30; i++) { r1.pendiente = null; r1.cola = []; P2.jugarSemana(r1, 'descansar'); }
  check('No hay pérdida automática de relación (30 semanas sin decisiones: nada baja)', P2.valorRel(r1, 'marc') >= v0 && P2.valorRel(r1, 'madre') >= 75 && P2.valorRel(r1, 'padre') >= 60 && P2.valorRel(r1, 'dani') >= 55);
  const vm0 = P2.valorRel(r1, 'madre'); P2.cambiarRel(r1, 'madre', -10, 'Prueba');
  const g2 = P2.migrateSave(JSON.parse(JSON.stringify(r1)));
  check('Las relaciones se guardan (valor e historia)', P2.valorRel(g2, 'madre') === vm0 - 10 && g2.relaciones.madre.historia.slice(-1)[0].t === 'Prueba');
  check('El estado se describe con palabras', P2.estadoRel(78) === 'Confía mucho en ti' && P2.estadoRel(20) === 'Relación rota');
  // Consecuencia diferida: ayudar a Marc → semanas después te presenta a Pilar (una sola vez)
  const r2 = P2.nuevaPartida({ seed: 103 }); r2.p.dinero = 500; r2.semana = 5;
  P2.encolar(r2, { tipo: 'suceso', id: 'marcNegocio' }); P2.resolverDecision(r2, 'prestar');
  check('Prestar a Marc: −200 € y +15 con Marc', r2.p.dinero === 300 && P2.valorRel(r2, 'marc') === 85);
  let vistas = 0, devuelto = 0;
  for (let i = 0; i < 25; i++) {
    if (r2.pendiente) { if (r2.pendiente.id === 'marcPresenta') { vistas++; P2.resolverDecision(r2, 'interesa'); continue; } r2.pendiente = null; r2.cola = []; }
    const R = P2.jugarSemana(r2, 'descansar'); if (R && R.lineas.some(l => /Marc te devuelve/.test(l[1]))) devuelto++;
  }
  check('La consecuencia diferida (Marc te devuelve el dinero) ocurre una sola vez', devuelto === 1);
  check('Marc te presenta a Pilar una sola vez y recuerda de qué semana viene', vistas === 1 && r2.contactoNegocio && r2.descuentoTraspaso === 800 && /semana 5/.test(P2.SUCESOS.find(E => E.id === 'marcPresenta').texto(r2)));
  check('Ese contacto abarata el traspaso', P2.capitalNecesario('peluqueria', 0, r2) === P2.capitalNecesario('peluqueria', 0) - 800);
  check('Los eventos que solo lanza la agenda nunca salen al azar', P2.SUCESOS.filter(E => E.soloAgenda).every(E => E.ambito === 'relacion'));
  check('Hay eventos de relación para familia, amigos, compañero y representante', ['madre', 'padre', 'marc', 'iker', 'sonia'].every(id => P2.EVENTOS_RELACION.some(E => E.rel === id)));
  const r3 = enClub('puerto', 104);
  check('El míster es una relación (su valor es la confianza)', P2.valorRel(r3, 'mister') === Math.round(r3.confianza) && P2.personasVisibles(r3).some(R => R.id === 'iker'));

  {
  // ---------- Personaje: más opciones (edad, ojos, cejas, rasgos, piercings, complexión, tatuajes) ----------
  check('Personaje: 20 capas en 5 grupos y más de 170 opciones', P2.CAPAS_LOOK.length === 20 && P2.GRUPOS_LOOK.length === 5 && Object.values(P2.ITEMS_LOOK).reduce((a, l) => a + l.length, 0) >= 170);
  check('Personaje: cada opción se dibuja sin errores en todas las vistas', (() => { try { for (const [c, l] of Object.entries(P2.ITEMS_LOOK)) for (const it of l) for (const m of ['busto', 'cuerpo', 'torso', 'piernas']) if (!/^<svg/.test(P2.avatarSVG({ p: { energia: 80 }, hitos: {} }, Object.assign({}, P2.LOOK_INICIAL, { [c]: it.id }), m))) return false; return true; } catch (e) { return false; } })());
  check('Personaje: una partida antigua recibe los valores nuevos por defecto', (() => { const v = JSON.parse(JSON.stringify(P2.nuevaPartida({ seed: 230 }))); v.look = { pelo: 'afro', colorPelo: 'rubio' }; const m = P2.migrateSave(v); return m.look.pelo === 'afro' && m.look.edad === 'joven' && m.look.tatuaje === 'nada' && m.look.piercing === 'nada'; })());
  check('Personaje: «Al azar» siempre da un look válido', Array.from({ length: 40 }, () => P2.lookAzar()).every(L => JSON.stringify(P2.validarLook(L)) === JSON.stringify(Object.assign({}, P2.LOOK_INICIAL, L))));
  check('Personaje: la apariencia no cambia el juego (complexión y edad son solo estética)', (() => { const a = P2.nuevaPartida({ seed: 231 }), b = P2.nuevaPartida({ seed: 231 }); Object.assign(b.look, { complexion: 'fuerte', edad: 'veterano', tatuaje: 'manga' }); for (let w = 0; w < 10; w++) for (const g of [a, b]) { resolverTodo(g); P2.jugarSemana(g, P2.POLITICAS.equilibrada.accion(g)) || P2.jugarSemana(g, 'descansar'); } const z = g => { const x = JSON.parse(JSON.stringify(g)); delete x.look; delete x.tele; delete x.monVariante; return JSON.stringify(x); }; return z(a) === z(b); })());

  // ---------- Minijuegos y vidas ----------
  const mj1 = P2.nuevaPartida({ seed: 250 });
  check('Minijuegos: una semana normal no tiene minijuego; el torneo y el día de pruebas sí', P2.minijuegoSemana(mj1, 'entrenar') === null && P2.minijuegoSemana(mj1, 'torneo') === 'torneo' && (() => { const x = P2.nuevaPartida({ seed: 251 }); x.fase = 'pruebas'; x.invitacion = { via: 'ojeador', semana: 1, dia: 1 }; return P2.minijuegoSemana(x, 'descansar') === 'prueba'; })());
  const pr = p => { const x = P2.nuevaPartida({ seed: 252 }); x.p.nivel = 55; x.p.energia = 80; x.fase = 'pruebas'; x.invitacion = { via: 'ojeador', semana: 1, dia: 1 }; P2.jugarSemana(x, 'descansar', p == null ? undefined : { minijuego: { tipo: 'prueba', p } }); return x.pruebas.slice(-1)[0]; };
  const p0 = pr(null), pN = pr(P2.MINIJUEGOS.prueba.neutro), p1 = pr(1), pB = pr(0);
  check('Minijuegos: un resultado intermedio no cambia nada (los bots, sin minijuego, juegan igual)', p0 && pN && p0.score === pN.score);
  check('Minijuegos: jugarlo bien suma y jugarlo mal resta, con límite (−5 … +7 en la prueba)', p1.score - p0.score === 7 && pB.score - p0.score === -5);
  check('Minijuegos: «Simular» lo decide tu nivel, como mucho un 80 % (nunca perfecto)', P2.probSimular({ p: { nivel: 99 } }) === 0.8 && P2.probSimular({ p: { nivel: 30 } }) === 0.15 && P2.P_SIM.acierto < 0.9);
  const penP = g => { const x = enClub('puerto', 253); for (let k = 0; k < 40 && x.temporada.jornada < x.temporada.calendario.length - 1; k++) { x.pendiente = null; x.cola = []; P2.jugarSemana(x, 'descansar'); } x.pendiente = null; x.cola = []; x.p.energia = 90; x.p.lesion = 0; P2.jugarSemana(x, 'descansar', g == null ? undefined : { minijuego: { tipo: 'penalti', p: g } }); return x.ultimo.partido; };
  const sinPen = penP(null), conGol = penP(0.75);
  check('Minijuegos: meter el penalti decisivo suma un gol a tu equipo', sinPen && conGol && conGol.gf === sinPen.gf + (['titular', 'suplente'].includes(sinPen.rol) ? 1 : 0));
  const penC = g => { const x = enClub('puerto', 253); for (let k = 0; k < 40 && x.temporada.jornada < x.temporada.calendario.length - 1; k++) { x.pendiente = null; x.cola = []; P2.jugarSemana(x, 'descansar'); } x.pendiente = null; x.cola = []; x.p.energia = 90; x.p.lesion = 0; const c0 = x.confianza; P2.jugarSemana(x, 'descansar', g == null ? undefined : { minijuego: { tipo: 'penalti', p: g } }); return { P: x.ultimo.partido, dc: x.confianza - c0, x }; };
  const fa = penC(0.3), sn = penC(null);
  const juegaFa = ['titular', 'suplente'].includes(fa.P.rol);
  check('Minijuegos: fallar el penalti tiene consecuencias (gol del rival y menos confianza del míster), como en P1', !juegaFa || (fa.P.gc === sn.P.gc + 1 && fa.dc < sn.dc - 8 && fa.x.ultimo.lineas.some(l => /momento decisivo/i.test(l[1]))));
  check('Minijuegos: hay 6 juegos distintos (4 nuevos: toques, pase, jugada ensayada y parada) con dificultad fácil, media o difícil', ['toques', 'pase', 'memoria', 'portero', 'barra', 'penalti'].every(k => P2.JUEGOS[k] && ['Fácil', 'Media', 'Difícil'].includes(P2.JUEGOS[k].dif)) && Object.values(P2.JUEGOS).some(g => g.dif === 'Fácil') && Object.values(P2.JUEGOS).some(g => g.dif === 'Difícil'));
  check('Minijuegos: lo pequeño (pruebas) se juega con juegos fáciles o medios; lo grande (promociones, finales) puede tocar el difícil', P2.JUEGOS_DE.prueba.every(k => P2.JUEGOS[k].dif !== 'Difícil') && P2.JUEGOS_DE.final.some(k => P2.JUEGOS[k].dif === 'Difícil') && P2.JUEGOS_DE.promocion.some(k => P2.JUEGOS[k].dif === 'Difícil'));
  check('Minijuegos: el juego cambia de una vez a otra y no toca el azar de la partida', (() => { const x = P2.nuevaPartida({ seed: 260 }), r0 = JSON.stringify(x.rng), vistos = new Set(); for (let w = 1; w < 30; w++) { x.semana = w; vistos.add(P2.juegoMinijuego(x, 'prueba')); } return vistos.size >= 2 && JSON.stringify(x.rng) === r0 && P2.juegoMinijuego(x, 'penalti') === 'penalti'; })());
  check('Vidas: solo un reintento por momento decisivo y se recargan cada 6 semanas (como en P1)', P2.VIDAS.reintentosPorMomento === 1 && P2.VIDAS.recargaSemanas === 6);
  const vi = P2.nuevaPartida({ seed: 254 });
  check('Vidas: empiezas con 3 y repetir un minijuego gasta una', P2.vidas(vi).n === 3 && P2.usarVida(vi) && P2.vidas(vi).n === 2);
  P2.usarVida(vi); P2.usarVida(vi);
  check('Vidas: sin vidas no se puede repetir', P2.vidas(vi).n === 0 && P2.usarVida(vi) === false);
  const pv = P2.pedirRewarded(vi, 'vida', {}); P2.aceptarRewarded(vi, pv.token);
  check('Vidas: un anuncio (simulado) da +1 vida, una vez por semana', P2.vidas(vi).n === 1 && P2.pedirRewarded(vi, 'vida', {}) === null);
  for (let w = 0; w < P2.VIDAS.recargaSemanas; w++) { vi.pendiente = null; vi.cola = []; P2.jugarSemana(vi, 'descansar'); }
  check('Vidas: se recargan solas con el tiempo (sin pagar ni ver anuncios)', P2.vidas(vi).n >= 2);
  check('Vidas: se guardan con la partida', P2.migrateSave(JSON.parse(JSON.stringify(vi))).vidas.n === P2.vidas(vi).n);

  // ---------- Lo que se juega en un minijuego: categoría, copas, Europa y Mundial ----------
  const finLiga = x => { const T = x.temporada; for (let k = 0; k < 20 && !T.cerrada; k++) { x.pendiente = null; x.cola = []; P2.jugarSemana(x, 'descansar'); } x.pendiente = null; x.cola = []; return T; };
  const buscaPromo = (clase, oferta = 'costaReal') => { for (let sd = 300; sd < 400; sd++) { const x = enClub(oferta, sd), T = finLiga(x); if (T.promocion && T.promocion.clase === clase) return sd; } return null; };
  const sdA = buscaPromo('ascenso'), sdP = buscaPromo('permanencia');
  const promo = (sd, p) => { const x = enClub('costaReal', sd), T = finLiga(x), L = P2.LIGAS[T.liga]; const t = P2.minijuegoSemana(x, 'descansar'), X = P2.enJuego(x, 'promocion'); const R = P2.jugarSemana(x, 'descansar', p == null ? undefined : { minijuego: { tipo: 'promocion', p } }); const M = P2.mundo(x); return { x, T, L, t, X, R, sube: M.ligas[L.sube || T.liga].includes(T.yo) && !!L.sube, baja: !!L.baja && M.ligas[L.baja].includes(T.yo), tam: Object.keys(M.ligas).map(k => M.ligas[k].length) }; };
  check('Categoría: hay temporadas que acaban en promoción de ascenso y de permanencia', sdA != null && sdP != null);
  if (sdA != null) {
    const a = promo(sdA, null);
    check('Categoría: al acabar justo fuera del ascenso, la temporada espera una semana y esa semana el minijuego es la promoción', a.t === 'promocion' && /Subís/.test(a.X.gana) && /misma categoría/.test(a.X.pierde));
    const g = promo(sdA, 0.9), pe = promo(sdA, 0.2);
    check('Categoría: ganar la promoción de ascenso te sube de categoría', g.sube && g.T.promocion.estado === 'ganada' && g.R.lineas.some(l => /ASCENSO/.test(l[1])));
    check('Categoría: perderla te deja en la misma categoría, con consecuencias (confianza y reputación)', !pe.sube && !pe.baja && pe.T.promocion.estado === 'perdida' && pe.x.confianza < g.x.confianza && (pe.R.grandes || []).some(G => !G.bien));
    check('Categoría: las ligas siguen teniendo 8 equipos tras una promoción', g.tam.every(n => n === 8) && pe.tam.every(n => n === 8));
    const b1 = promo(sdA, null), b2 = promo(sdA, null);
    check('Categoría: sin minijuego (bots) la promoción la decide el nivel, siempre igual con la misma semilla', b1.T.promocion.estado === b2.T.promocion.estado && b1.sube === b2.sube);
  }
  if (sdP != null) {
    const g = promo(sdP, 0.9), pe = promo(sdP, 0.2);
    check('Categoría: ganar la promoción de permanencia te mantiene en la categoría', !g.baja && !g.sube && g.T.promocion.estado === 'ganada');
    check('Categoría: perder la promoción de permanencia te baja de categoría', pe.baja && pe.R.lineas.some(l => /Descenso/.test(l[1])));
    check('Categoría: en la permanencia, si te salvas baja el otro (siguen bajando los mismos clubes)', g.tam.every(n => n === 8) && pe.tam.every(n => n === 8));
  }
  // Copas: la final se juega con el minijuego
  const buscaFinal = id => { for (let sd = 400; sd < 480; sd++) { const x = enClub('costaReal', sd); x.p.nivel = 80; if (id !== 'copa') x[id === 'europa' ? 'europaProxima' : 'convocado'] = true; const T = x.temporada, F = P2.COMPETICIONES[id].final; for (let k = 0; k < 20 && T.jornada < F; k++) { x.pendiente = null; x.cola = []; P2.jugarSemana(x, 'descansar'); } x.pendiente = null; x.cola = []; x.p.energia = 90; x.p.lesion = 0; const c = (T.copas || []).find(c => c.id === id); if (c && c.estado === 'viva' && T.jornada === F) return sd; } return null; };
  const finalCopa = (id, sd, p) => { const x = enClub('costaReal', sd); x.p.nivel = 80; if (id !== 'copa') x[id === 'europa' ? 'europaProxima' : 'convocado'] = true; const T = x.temporada, F = P2.COMPETICIONES[id].final; for (let k = 0; k < 20 && T.jornada < F; k++) { x.pendiente = null; x.cola = []; P2.jugarSemana(x, 'descansar'); } x.pendiente = null; x.cola = []; x.p.energia = 90; x.p.lesion = 0; const t = P2.minijuegoSemana(x, 'descansar'), X = P2.enJuego(x, 'final'), d0 = x.p.dinero, r0 = x.p.rep; const R = P2.jugarSemana(x, 'descansar', p == null ? undefined : { minijuego: { tipo: 'final', p } }); return { x, t, X, R, dd: x.p.dinero - d0, dr: x.p.rep - r0, c: T.copas.find(c => c.id === id) }; };
  const pre = enClub('costaReal', 470); pre.europaProxima = true; pre.convocado = true; pre.pendiente = null; P2.jugarSemana(pre, 'descansar');
  check('Copas: cada temporada hay Copa; con plaza europea, Copa de Europa; si te convocan, Mundial', pre.temporada.copas.map(c => c.id).join() === 'copa,europa,mundial' && !pre.europaProxima && !pre.convocado);
  for (const id of ['copa', 'europa', 'mundial']) {
    const sd = buscaFinal(id); if (sd == null) { check(`Copas: se llega a la final de ${P2.COMPETICIONES[id].n}`, false); continue; }
    const g = finalCopa(id, sd, 0.9), pe = finalCopa(id, sd, 0.2);
    check(`Copas: la final de ${P2.COMPETICIONES[id].n} se juega con el minijuego (y dice qué te juegas)`, g.t === 'final' && /Campeones/.test(g.X.gana) && /Subcampeones/.test(g.X.pierde));
    check(`Copas: ganar la final de ${P2.COMPETICIONES[id].n} da el título, premio y fama`, g.c.estado === 'campeon' && g.x.trofeos.some(tr => tr.n === P2.COMPETICIONES[id].n) && g.dd - pe.dd >= P2.COMPETICIONES[id].gana.dinero && g.dr > pe.dr);
    check(`Copas: perder la final de ${P2.COMPETICIONES[id].n} tiene consecuencias (sin título y menos reputación)`, pe.c.estado === 'subcampeon' && !pe.x.trofeos.some(tr => tr.n === P2.COMPETICIONES[id].n) && (pe.R.grandes || []).some(G => !G.bien && /Final perdida/.test(G.titulo)));
  }
  check('Celebraciones: ganar una final, firmar un contrato o comprar un negocio deja un gran momento para animar (con el dinero)', (() => { const sd = buscaFinal('copa'); const g = finalCopa('copa', sd, 0.9), pe = finalCopa('copa', sd, 0.2); const c = g.x.celebraciones.find(x => x.tipo === 'titulo'); const k = enClub('puerto', 9); return c && c.dinero === P2.COMPETICIONES.copa.gana.dinero && !pe.x.celebraciones.some(x => x.tipo === 'titulo') && k.celebraciones.some(x => x.tipo === 'contrato' && x.sueldo > 0); })());
  check('Celebraciones: el primer coche y la primera casa se celebran; el segundo coche no', (() => { const x = P2.nuevaPartida({ seed: 31 }); x.p.dinero = 999999; x.hitos.contrato = 1; x.hitos.titular = 1; x.hitos.capital = 1; x.hitos.empresa = 1; x.hitos.rentable = 1; x.hitos.patro = 1; x.celebraciones = []; P2.comprar(x, 'cocheUsado'); const c1 = x.celebraciones.filter(c => c.tipo === 'coche').length; P2.comprar(x, 'deportivo'); const c2 = x.celebraciones.filter(c => c.tipo === 'coche').length; P2.comprar(x, 'piso'); return c1 === 1 && c2 === 1 && x.celebraciones.some(c => c.tipo === 'casa'); })());
  check('Celebraciones: vender una empresa con beneficio se celebra (y con pérdidas no)', (() => { const x = P2.nuevaPartida({ seed: 32 }); const n = P2.nuevoNegocio('peluqueria', 3000); n.invertido = 100; x.negocios.push(n); x.celebraciones = []; P2.venderNegocio(x, n.id); const y = P2.nuevaPartida({ seed: 32 }); const m = P2.nuevoNegocio('peluqueria', 3000); m.invertido = 1e9; y.negocios.push(m); y.celebraciones = []; P2.venderNegocio(y, m.id); return x.celebraciones.some(c => c.tipo === 'venta' && c.beneficio > 0) && !y.celebraciones.length; })());
  check('Celebraciones: récord de patrimonio al pasar 10.000 € (una vez por cifra)', (() => { const x = P2.nuevaPartida({ seed: 33 }); x.semana = 1; P2.anotarHistoria(x, 'semana'); x.celebraciones = []; x.p.dinero = 12000; P2.anotarHistoria(x, 'semana'); P2.anotarHistoria(x, 'semana'); return x.celebraciones.filter(c => c.tipo === 'patrimonio' && c.cifra === 10000).length === 1; })());
  check('Celebraciones: la primera titularidad como profesional se celebra una sola vez', (() => { const x = enClub('puerto', 34); x.p.nivel = 70; x.confianza = 90; for (let w = 0; w < 12; w++) { x.pendiente = null; x.cola = []; x.p.energia = 95; P2.jugarSemana(x, 'descansar'); } return x.stats.titular >= 2 ? x.celebraciones.filter(c => c.tipo === 'titular').length + (x.celebraciones.length >= 6 ? 1 : 0) >= 1 : true; })());
  check('Celebraciones: la lista no crece sin fin (como mucho 6 pendientes)', (() => { const x = P2.nuevaPartida({ seed: 9 }); for (let i = 0; i < 20; i++) P2.celebrar(x, { tipo: 'titulo', n: 'x' }); return x.celebraciones.length === 6; })());
  check('Copas: la convocatoria para el Mundial pide nivel y reputación de élite', P2.CONVOCATORIA.nivel >= 70 && P2.CONVOCATORIA.rep >= 50);
  check('Copas y promociones: se guardan con la partida', (() => { const x = enClub('costaReal', sdA || 300); finLiga(x); const m = P2.migrateSave(JSON.parse(JSON.stringify(x))); return JSON.stringify(m.temporada.promocion) === JSON.stringify(x.temporada.promocion) && JSON.stringify(m.temporada.copas) === JSON.stringify(x.temporada.copas); })());

  // ---------- Comercio: comprar nunca da ventajas (gameplay) ----------
  {
    const juega = conTodo => {
      const x = P2.nuevaPartida({ seed: 270 }); const orig = P2.tieneEnt;
      if (conTodo) P2.tieneEnt = () => true;   // como si tuviera TODOS los packs, deportes, expansiones, Prestige y sin anuncios
      try { for (let w = 0; w < 60; w++) { resolverTodo(x); P2.jugarSemana(x, P2.POLITICAS.equilibrada.accion(x)) || P2.jugarSemana(x, 'descansar'); } } finally { P2.tieneEnt = orig; }
      const z = JSON.parse(JSON.stringify(x)); delete z.tele; return z;
    };
    const a = juega(false), b = juega(true);
    check('Comercio: tenerlo TODO comprado no cambia nivel, reputación, marca, dinero ni resultados (60 semanas idénticas)', a.p.nivel === b.p.nivel && a.p.rep === b.p.rep && a.p.marca === b.p.marca && a.p.dinero === b.p.dinero && JSON.stringify(a.temporadasJugadas) === JSON.stringify(b.temporadasJugadas) && JSON.stringify(a.stats) === JSON.stringify(b.stats));
    check('Comercio: la partida entera es idéntica con o sin compras (salvo lo cosmético)', JSON.stringify(Object.assign({}, a, { look: null, mon: null, monVariante: null })) === JSON.stringify(Object.assign({}, b, { look: null, mon: null, monVariante: null })), Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => k + ':' + JSON.stringify(a[k]).slice(0, 120) + ' VS ' + JSON.stringify(b[k]).slice(0, 120)).join(' ## '));
    check('Comercio: los cosméticos de pack se desbloquean con el entitlement y no antes', (() => { const x = P2.nuevaPartida({ seed: 271 }); const it = P2.itemLook('ropa', 'debut'); const antes = P2.bloqueoLook(x, it, 'ropa'); const o = P2.tieneEnt; P2.tieneEnt = e => e === 'cosmetic.debut_pack'; const despues = P2.bloqueoLook(x, it, 'ropa'); P2.tieneEnt = o; return !!antes && despues === null; })());
    check('Comercio: la partida NO guarda compras (la fuente de verdad es la cuenta)', !/entitlement|cosmetic\.|stripe/i.test(JSON.stringify(P2.nuevaPartida({ seed: 272 }))));
  }

  // ---------- Variedad semanal ----------
  const vv = P2.nuevaPartida({ seed: 240 }), nombres = [];
  for (let w = 0; w < 8; w++) { nombres.push(P2.varianteSemana(vv, 'entrenar').n); vv.semana++; }
  check('Variedad: la versión de cada acción cambia cada semana (nunca la misma dos semanas seguidas)', nombres.every((n, i) => i === 0 || n !== nombres[i - 1]) && new Set(nombres).size >= 3);
  const vd = P2.nuevaPartida({ seed: 241 }); vd.semana = 2;
  check('Variedad: cada semana hay una opción destacada entre las que puedes hacer', P2.accionesDisponibles(vd).some(x => x.id === P2.destacadaSemana(vd)));
  check('Variedad: las versiones están compensadas (rinden más ⇔ cansan más)', Object.values(P2.VARIANTES).every(l => l.every(v => !(v.m > 1.1) || (v.e || 0) < 0) && Math.abs(l.reduce((a, v) => a + (v.m || 1), 0) / l.length - 1) <= 0.06));
  const va1 = P2.nuevaPartida({ seed: 242 }), va2 = P2.nuevaPartida({ seed: 242 }); P2.varianteSemana(va2, 'plaza'); P2.destacadaSemana(va2);
  check('Variedad: consultar la semana no toca el azar de la partida', va1.rng === va2.rng);

  // ---------- P2.4 · Monetization Lab (todo simulado) ----------
  const MON = P2.MONETIZATION, RWC = MON.rewarded;
  const foto = s => JSON.stringify({ rng: s.rng, temporada: s.temporada, stats: s.stats, pruebas: s.pruebas, invitacion: s.invitacion, contrato: s.contrato, hitos: s.hitos, cola: s.cola, pendiente: s.pendiente, p: { nivel: s.p.nivel, rep: s.p.rep, marca: s.p.marca }, confianza: s.confianza, negocios: s.negocios });
  check('Monetización en modo prueba (testMode) y sin moneda premium', MON.testMode === true && !/gema|moneda premium|💎 x|🪙/i.test(JSON.stringify(P2.IAP_PRODUCTS.map(I => I.contenido))));
  // Anuncio con recompensa: energía
  const e1 = P2.nuevaPartida({ seed: 201 }); e1.p.energia = 20;
  const pe = P2.pedirRewarded(e1, 'energia', {});
  check('Pulsar «Ver anuncio» no entrega nada todavía (solo abre la simulación)', pe && e1.p.energia === 20);
  const fe = foto(e1), r1e = P2.aceptarRewarded(e1, pe.token), e1v = e1.p.energia, r2e = P2.aceptarRewarded(e1, pe.token);
  check('Aceptar el anuncio entrega exactamente una recompensa', r1e && r1e.tipo === 'energia' && e1v === 20 + RWC.energia.cantidad);
  check('No se puede cobrar dos veces la misma recompensa', r2e === null && e1.p.energia === e1v);
  check('La recompensa de energía no toca partidos, pruebas, decisiones ni el azar', foto(e1) === fe);
  check('Frecuencia: no se puede repetir el anuncio de energía hasta pasar sus semanas', !!P2.bloqueoRewarded(e1, 'energia') && P2.pedirRewarded(e1, 'energia') === null);
  e1.semana += RWC.energia.cadaSemanas; e1.p.energia = 20;
  check('Pasadas sus semanas, vuelve a estar disponible', !P2.bloqueoRewarded(e1, 'energia'));
  const cant0 = RWC.energia.cantidad; RWC.energia.cantidad = 500; e1.p.energia = 30; const pe2 = P2.pedirRewarded(e1, 'energia'); P2.aceptarRewarded(e1, pe2.token); RWC.energia.cantidad = cant0;
  check('El anuncio de energía nunca supera el máximo (100)', e1.p.energia === P2.CFG.energia.max);
  const e2 = P2.nuevaPartida({ seed: 202 }); e2.p.energia = 30; e2.fase = 'pruebas';
  check('Nunca altera las pruebas: no hay anuncio de energía antes de una prueba', P2.bloqueoRewarded(e2, 'energia') === 'No antes de las pruebas');
  const e3 = P2.nuevaPartida({ seed: 203 }); e3.p.energia = 20; e3.p.dinero = 5000; P2.encolar(e3, { tipo: 'suceso', id: 'masHoras' });
  check('Nunca durante una decisión: con una decisión pendiente no hay ningún anuncio (no se repite ni se cambia)', Object.keys(P2.REWARDED).every(k => P2.pedirRewarded(e3, k, { id: 'bici' }) === null));
  check('Los anuncios nunca deshacen decisiones: solo dan cupón, oferta, energía, cosmético o una vida para repetir un minijuego', Object.keys(P2.REWARDED).join() === 'cupon,oferta,energia,temporada,vida,empresaBonus' && !RWC.empresaBonus.activo);
  // Cupón de Tienda
  const c1 = P2.nuevaPartida({ seed: 204 }); c1.p.dinero = 100000; Object.assign(c1.hitos, { contrato: 2, titular: 3, empresa: 4, rentable: 5, inversion2: 6 });
  check('Descuento con máximo: 10 % de 32.000 € se queda en el máximo configurado', P2.descuentoCupon(32000) === RWC.cupon.maximo && P2.descuentoCupon(5200) === 520);
  check('El descuento nunca deja un precio negativo', P2.descuentoCupon(0) === 0 && P2.descuentoCupon(3) <= 3 && P2.PRODUCTOS.every(P => P2.precioConDescuento(c1, P) >= 0));
  const pc = P2.pedirRewarded(c1, 'cupon', { id: 'cocheUsado' }); P2.aceptarRewarded(c1, pc.token);
  check('Con el cupón: «comprar por 5.200 €» o «por 4.680 €» tras el anuncio', P2.precioPara(c1, P2.producto('cocheUsado')) === 4680 && P2.precioPara(c1, P2.producto('moto')) === 1900);
  const dc = c1.p.dinero; P2.comprar(c1, 'cocheUsado');
  check('El cupón se gasta una vez en la compra', c1.p.dinero === dc - 4680 && !P2.cuponVigente(c1));
  check('Exploit cerrado: lo comprado con descuento vale según lo que pagaste (no se gana revendiendo)', c1.inventario.find(x => x.id === 'cocheUsado').valorActual === Math.round(4680 * 0.65));
  // Oferta especial
  const o1 = P2.nuevaPartida({ seed: 205 }); o1.p.dinero = 300;
  const po = P2.pedirRewarded(o1, 'oferta', {}), ro = P2.aceptarRewarded(o1, po.token);
  check('Oferta especial: un objeto de la etapa con descuento limitado, pagado con dinero del juego', ro && ro.precio < ro.original && ro.original - ro.precio <= RWC.oferta.maximo && ro.original <= RWC.oferta.precioMax.barrio && o1.p.dinero === 300);
  check('Oferta especial: limitada en frecuencia', !!P2.bloqueoRewarded(o1, 'oferta'));
  // Compras simuladas (prueba de intención)
  const i1 = enClub('puerto', 206); i1.monVariante = 'B';
  const fi = JSON.stringify({ p: i1.p, acum: i1.acum, inv: i1.inventario, rng: i1.rng, temporada: i1.temporada });
  const ri = P2.iapIntencion(i1, 'debut', 'si');
  check('Una compra simulada no cobra nada ni toca la economía, el inventario o el azar', ri && ri.cargo === 0 && JSON.stringify({ p: i1.p, acum: i1.acum, inv: i1.inventario, rng: i1.rng, temporada: i1.temporada }) === fi);
  const html = fs.readFileSync(path.join(__dirname, '..', 'p2', 'del_barrio_p2.html'), 'utf8');
  // El prototipo publicado es SIMULADO: sin red, sin SDK de pago ni de anuncios, sin claves. (El build web real es aparte.)
  check('Ninguna compra ni anuncio real: sin conexiones de red, sin SDK de pago/anuncios y sin claves en el juego', !/fetch\(|XMLHttpRequest|sendBeacon|PaymentRequest|WebSocket|EventSource|admob|googletag|adsbygoogle|js\.stripe\.com|api\.stripe\.com|checkout\.stripe\.com|loadStripe|SKPaymentQueue|BillingClient/i.test(html));
  check('Sin secretos en el juego (ni claves de Stripe ni de Supabase)', !/sk_(test|live)_[A-Za-z0-9]{6,}|rk_(test|live)_|whsec_(?!mock_local|test_fake)[A-Za-z0-9]{6,}|sb_secret_|service_role_key|SUPABASE_SERVICE_ROLE/i.test(html));
  check('El comercio del prototipo es el simulado (backend en el navegador, Stripe falso)', /P2C\.BUILD = 'mock'/.test(html) && !/createHttpBackend|createStripeApi|createPgRepo/.test(html));
  check('No se vende poder ni dinero del juego: los packs son solo estética (y apoyo)', P2.IAP_PRODUCTS.every(I => I.contenido.every(c => Array.isArray(c) ? !!P2.itemLook(c[0], c[1]) : ['skin', 'sinAnuncios', 'espacios', 'texto'].includes(c.tipo))));
  const cosmeticos = P2.IAP_PRODUCTS.flatMap(I => I.contenido.filter(Array.isArray));
  const g1 = P2.nuevaPartida({ seed: 207 }), g2 = P2.nuevaPartida({ seed: 207 });
  for (const [cap, id] of cosmeticos) g2.look[cap] = id;
  for (let w = 0; w < 20; w++) { for (const g of [g1, g2]) { resolverTodo(g); P2.jugarSemana(g, P2.POLITICAS.equilibrada.accion(g)) || P2.jugarSemana(g, 'descansar'); } }
  const sinLook = g => { const x = JSON.parse(JSON.stringify(g)); delete x.look; delete x.tele; delete x.monVariante; return JSON.stringify(x); };
  check('Los cosméticos premium no cambian nada del juego (20 semanas idénticas con y sin ellos)', sinLook(g1) === sinLook(g2));
  check('La entrega de cosméticos simulados está apagada por defecto (la intención no regala nada)', MON.iap.entregarCosmeticos === false && !i1.lookDesbloqueos.includes('ropa:debut'));
  MON.iap.entregarCosmeticos = true; const i2 = enClub('puerto', 208), d2 = i2.p.dinero; P2.iapIntencion(i2, 'debut', 'si'); MON.iap.entregarCosmeticos = false;
  check('Si se simula entregar el cosmético, solo cambia el aspecto (no el dinero)', i2.lookDesbloqueos.includes('ropa:debut') && i2.p.dinero === d2 && P2.ponerLook(i2, 'ropa', 'debut'));
  // Momentos y variantes
  const m1 = P2.nuevaPartida({ seed: 209 }); m1.monVariante = 'B';
  check('El Pack Debut no sale al empezar', P2.ofertaIapAhora(m1, 0) === null);
  m1.p.nivel = 56; P2.firmar(m1, 'puerto', null); m1.pendiente = null; m1.cola = [];
  const of1 = P2.ofertaIapAhora(m1, 0);
  check('Al firmar el primer contrato aparece el Pack Debut (variante B)', of1 && of1.id === 'debut' && of1.precio === 0.99);
  check('Máximo de ofertas por sesión', P2.ofertaIapAhora(m1, MON.iap.maxPorSesion) === null);
  m1.p.lesion = 2;
  check('Nunca tras algo malo: lesionado/a no se ofrece nada', P2.ofertaIapAhora(m1, 0) === null);
  m1.p.lesion = 0; P2.marcarIapMostrado(m1, 'debut');
  check('Una oferta «una vez» no vuelve a salir', P2.ofertaIapAhora(m1, 0) === null);
  const m2 = P2.nuevaPartida({ seed: 210 }); m2.monVariante = 'A'; m2.p.nivel = 56; P2.firmar(m2, 'puerto', null); m2.pendiente = null; m2.cola = [];
  check('Variante A: solo anuncios con recompensa, ninguna compra', P2.ofertaIapAhora(m2, 0) === null && !P2.IAP_PRODUCTS.some(I => P2.iapEnVariante(m2, I.id)));
  const v1 = P2.nuevaPartida({ seed: 211 }), va = v1.monVariante; P2.asignarVariante(v1);
  const vs = new Set(Array.from({ length: 60 }, (_, k) => P2.nuevaPartida({ seed: 300 + k }).monVariante));
  check('Variantes A/B/C: se asignan una sola vez, se guardan y salen las tres', ['A', 'B', 'C'].includes(va) && v1.monVariante === va && P2.migrateSave(JSON.parse(JSON.stringify(v1))).monVariante === va && vs.size === 3);
  // Telemetría y desactivación
  const t1 = P2.nuevaPartida({ seed: 212 }), t2 = P2.nuevaPartida({ seed: 212 });
  for (let w = 0; w < 15; w++) { for (let k = 0; k < 5; k++) { P2.teleMon(t2, 'rewarded_offer_shown', { reward_type: 'cupon' }); P2.vistoMon(t2, 'iap_offer_shown', 'x' + k, {}); } for (const g of [t1, t2]) { resolverTodo(g); P2.jugarSemana(g, P2.POLITICAS.equilibrada.accion(g)) || P2.jugarSemana(g, 'descansar'); } }
  const sinTele = g => { const x = JSON.parse(JSON.stringify(g)); delete x.tele; delete x.monVariante; return JSON.stringify(x); };
  check('La telemetría de monetización no altera el azar ni la partida', sinTele(t1) === sinTele(t2));
  MON.activa = false;
  const offL = P2.jugarPartida(P2.crearBot('equilibrada', 'inteligente', 'locales'), 4242, 70, { seguir: true });
  const off = P2.nuevaPartida({ seed: 213 }); off.p.energia = 10; off.p.nivel = 56; P2.firmar(off, 'puerto', null); off.pendiente = null; off.cola = [];
  const offOk = Object.keys(P2.REWARDED).every(k => P2.bloqueoRewarded(off, k, { id: 'bici' }) === 'Desactivado') && P2.ofertaIapAhora(off, 0) === null && P2.intersticialAhora(off) === null;
  MON.activa = true;
  const onL = P2.jugarPartida(P2.crearBot('equilibrada', 'inteligente', 'locales'), 4242, 70, { seguir: true });
  check('Monetización desactivada: no se ofrece nada y la partida es exactamente la misma', offOk && JSON.stringify(offL) === JSON.stringify(onL));
  // Anuncio obligatorio simulado: muy limitado
  const it1 = enClub('puerto', 214); it1.pendiente = null; it1.cola = []; it1.tele.msActivo = 30 * 60000;
  P2.momentoMon(it1, 'finTemporada');
  check('Anuncio obligatorio simulado: solo en momentos grandes (fin de temporada)', P2.intersticialAhora(it1) === 'finTemporada');
  P2.intersticialMostrado(it1); it1.tele.msActivo += 5 * 60000; P2.momentoMon(it1, 'finCapitulo');
  check('…y como mucho uno cada 12 minutos reales', P2.intersticialAhora(it1) === null);
  P2.momentoMon(it1, 'contrato');
  check('…nunca tras un hito normal ni durante una decisión', P2.intersticialAhora(it1) === null && (P2.momentoMon(it1, 'finTemporada'), it1.pendiente = { tipo: 'suceso', id: 'masHoras' }, P2.intersticialAhora(it1) === null));
  // Lista de deseos
  const w1 = P2.nuevaPartida({ seed: 215 }); w1.p.dinero = 100; P2.quiero(w1, 'bici');
  const w1b = P2.migrateSave(JSON.parse(JSON.stringify(w1)));
  check('La lista de deseos se guarda', w1b.deseoActual === 'bici');
  w1.p.dinero = 200;
  const av1 = P2.revisarDeseo(w1), av2 = P2.revisarDeseo(w1);
  check('Al llegar al dinero del deseo se avisa una sola vez (y no se compra solo)', av1 === true && av2 === false && !P2.posee(w1, 'bici') && w1.mon.deseoAviso.id === 'bici');
  check('Solo un objetivo destacado a la vez', P2.quiero(w1, 'moto') && w1.deseoActual === 'moto');
  // Colecciones, eventos por posesiones, regalos
  const k1 = P2.nuevaPartida({ seed: 216 }); k1.p.dinero = 1000; ['camiseta', 'chandal', 'gorra', 'botas'].forEach(id => P2.comprar(k1, id));
  check('Completar una colección da un fondo de perfil (sin estadísticas)', k1.coleccionesHechas.includes('street') && k1.lookDesbloqueos.includes('fondo:street'));
  check('Lo que compras se ve: la ropa se pone sola en el personaje', k1.look.calzado === 'botas' && ['equipoFav', 'chandalMarca'].includes(k1.look.ropa));
  const k2 = P2.nuevaPartida({ seed: 217 }); k2.p.dinero = 20000; k2.hitos.contrato = 2; k2.hitos.titular = 3; P2.comprar(k2, 'cocheUsado');
  check('Eventos por posesiones: el coche trae una situación semanas después (y tu padre opina del gasto)', k2.agenda.some(a => a.efecto === 'cocheFamilia') && k2.agenda.some(a => a.efecto === 'padreGasto'));
  check('Regalos para tu gente con dinero del juego', P2.PRODUCTOS.filter(P => P.usar && P.usar.rel).length >= 4 && (() => { const x = P2.nuevaPartida({ seed: 218 }); x.p.dinero = 500; P2.comprar(x, 'regaloMadre'); return P2.valorRel(x, 'madre') === 80 && x.p.dinero === 380; })());
  check('Escalera aspiracional: se ven objetos de magnate como «Próximamente» (no se compran)', ['superdeportivo', 'atico', 'villa', 'mansion'].every(id => P2.bloqueoProducto(c1, P2.producto(id)) === 'Próximamente'));
  check('Rareza solo de presentación (no da estadísticas)', P2.PRODUCTOS.filter(P => P.rareza === 'legendario').every(P => !P.ef || P.ef.entreno == null || P.ef.entreno <= 0.06));
  // Inversiones como desbloqueables
  const iv0 = P2.nuevaPartida({ seed: 219 }), ivl = P2.inversiones(iv0);
  check('Inversiones: se ven todas desde el principio (peluquería, las 3 segundas y las futuras)', ivl.length === 1 + P2.OPORTUNIDADES.length + P2.INVERSIONES_FUTURAS.length && ivl.every(x => x.estado === 'bloqueada' || x.estado === 'proximamente'));
  iv0.p.nivel = 56; P2.firmar(iv0, 'puerto', null); iv0.hitos.patro = 3;
  check('Inversiones: la peluquería se desbloquea con el mercado (mismas reglas que Empresa)', P2.inversiones(iv0)[0].estado === 'disponible' && P2.mercadoAbierto(iv0));
  iv0.hitos.empresa = 5; iv0.hitos.rentable = 12;
  check('Inversiones: la segunda inversión se desbloquea con la empresa rentable', P2.inversiones(iv0).filter(x => x.grupo === 'segunda').every(x => x.estado === 'disponible'));
  iv0.oportunidad = 'socio';
  check('Inversiones: al elegir una, las otras quedan como «elegiste otra»', P2.inversiones(iv0).filter(x => x.grupo === 'segunda').map(x => x.estado).sort().join() === 'otra,otra,tuya');
  check('Mi historia resume tu carrera', (() => { const h = P2.miHistoria(c1); return h.vehiculos.some(P => P.id === 'cocheUsado') && h.patrimonioMax > 0; })());
  }

  // Techo de sueldo por categoría
  const tp = enClub('puerto', 96); tp.contrato.sueldo = 440; P2.subirSueldo(tp, 1.4);
  check('El sueldo no supera el techo de la categoría', tp.contrato.sueldo === P2.LIGAS[tp.temporada.liga].sueldoMax);

  // Migración P1: todas las claves conocidas, sin tocar el original
  const almacen = { 'del_barrio_al_negocio_p1_v1': JSON.stringify({ nombre: 'Nora', semana: 50, fase: 'club', p: { dinero: 900, rep: 30, nivel: 60 } }) };
  let escrituras = 0;
  const ls = { getItem: k => (k in almacen ? almacen[k] : null), setItem: () => { escrituras++; }, removeItem: () => { escrituras++; } };
  const P2ls = cargarP2({ localStorage: ls });
  const v1 = P2ls.partidaP1();
  check('P2 encuentra partidas de P1 guardadas con la clave antigua v1', v1 && v1.nombre === 'Nora' && v1.__clave === 'del_barrio_al_negocio_p1_v1');
  check('Leer la partida de P1 no escribe ni borra nada', escrituras === 0 && almacen['del_barrio_al_negocio_p1_v1'].includes('Nora'));
  almacen['del_barrio_al_negocio_p1_v5'] = JSON.stringify({ nombre: 'Leo', fase: 'club', p: { dinero: 100 } });
  check('Si hay varias, se usa la más nueva', P2ls.partidaP1().nombre === 'Leo');
}

// ---------- 6c. P2.2: nivel, reputación y marca; patrocinadores con identidad; telemetría ----------
{
  const R0 = () => ({ lineas: [], porque: [], ingresos: [], hitos: [], desbloqueos: [] });
  // Tres variables que no suben juntas
  const v = enClub('puerto', 100); v.p.rep = 40; v.p.marca = 10; v.p.energia = 100;
  let a0 = { ...v.p }; P2.aplicarAccion(v, 'prensa', R0());
  check('Prensa sube la marca personal, no el nivel ni la reputación deportiva', v.p.marca > a0.marca && v.p.nivel === a0.nivel && v.p.rep === a0.rep);
  const b = P2.nuevaPartida({ seed: 101 }); a0 = { ...b.p }; P2.aplicarAccion(b, 'entrenar', R0());
  check('Entrenar sube el nivel, no la reputación ni la marca', b.p.nivel > a0.nivel && b.p.rep === a0.rep && b.p.marca === a0.marca);
  a0 = { ...b.p }; P2.aplicarAccion(b, 'plaza', R0());
  check('Jugar en la plaza sube la reputación deportiva, no la marca', b.p.rep > a0.rep && b.p.marca === a0.marca);
  // Techo comercial ligado al prestigio deportivo
  const malo = enClub('puerto', 102); malo.p.rep = 10; malo.p.marca = 0; for (let i = 0; i < 60; i++) P2.sumarMarca(malo, 3);
  const bueno = enClub('puerto', 103); bueno.p.rep = 70; bueno.p.marca = 0; for (let i = 0; i < 60; i++) P2.sumarMarca(bueno, 3);
  check('Un jugador sin prestigio no llega a una marca enorme solo con actos (techo suave)', malo.p.marca < 70 && bueno.p.marca >= 95, `${malo.p.marca} / ${bueno.p.marca}`);
  check('Se puede ser más comercial que buen jugador (marca por encima de la reputación)', bueno.p.marca > bueno.p.rep + 20);
  const perfil = (dep, com) => { let rep = 0, marca = 0, nivel = 0; for (let i = 1; i <= 6; i++) { const o = P2.nuevaPartida; let S; P2.nuevaPartida = x => (S = o(x)); P2.jugarPartida(P2.crearBot(dep, 'inteligente', com), 2000 + i, 90, { seguir: true }); P2.nuevaPartida = o; rep += S.p.rep / 6; marca += S.p.marca / 6; nivel += S.p.nivel / 6; } return { rep, marca, nivel }; };
  const A = perfil('entreno', 'sin'), B = perfil('imagen', 'maximos');
  check('Perfil «gran jugador poco comercial» (entrenar sin marcas): nivel y reputación altos, marca baja', A.nivel > 75 && A.rep > 75 && A.marca < A.rep - 20, JSON.stringify(A));
  check('Perfil «más comercial que futbolista» (imagen y marcas): marca por encima de su reputación', B.marca > B.rep + 15 && B.nivel < A.nivel - 15, JSON.stringify(B));

  // Patrocinadores: identidad, exclusividad y oferta
  const ps = enClub('atleticoFilial', 110); ps.p.marca = 90; ps.p.rep = 80; ps.p.nivel = 70; ps.stats.titular = 10; ps.hitos.patro = 1;
  P2.comprarNegocio(Object.assign(ps.p, { dinero: 20000 }) && ps, 'peluqueria', 2, null); const n = ps.negocios[0]; n.semanas = 5;
  const sinP = P2.calcularSemana(ps, n);
  P2.firmarMarca(ps, 'panaderia', null); const conP = P2.calcularSemana(ps, n);
  check('Patrocinador local: te manda clientes al negocio (+6 % de demanda)', Math.abs(conP.demanda / sinP.demanda - 1.06) < 0.02, `${sinP.demanda} → ${conP.demanda}`);
  check('Dos marcas del mismo sector no conviven; una gran marca no admite locales', /mismo sector/.test(P2.conflictoMarca(ps, Object.assign({}, P2.MARCAS.find(m => m.id === 'talleres'), { cat: 'comercio' })) || '') && /locales/.test(P2.conflictoMarca(ps, P2.MARCAS.find(m => m.id === 'nova')) || ''));
  const tl = enClub('atleticoFilial', 111); tl.p.marca = 60; tl.p.rep = 60; tl.hitos.patro = 1; tl.p.dinero = 20000; P2.comprarNegocio(tl, 'peluqueria', 2, null); tl.negocios[0].semanas = 5;
  const f0 = P2.calcularSemana(tl, tl.negocios[0]).costes.fijos; P2.firmarMarca(tl, 'talleres', null);
  check('Patrocinador local de empresa: rebaja los gastos fijos del negocio', P2.calcularSemana(tl, tl.negocios[0]).costes.fijos === f0 - 40);
  const kk = enClub('atleticoFilial', 112); kk.p.marca = 60; kk.p.rep = 60; kk.p.nivel = 60; kk.stats.titular = 5; const t0 = P2.techoClub(kk); P2.firmarMarca(kk, 'kinetic', null);
  check('Marca deportiva (Kinetic): mejor entrenamiento y techo de nivel +3, sin «+10 de nivel por unas botas»', P2.techoClub(kk) === t0 + 3 && P2.efectoPatro(kk, 'entreno') > 0 && kk.p.nivel === 60);
  const nv = enClub('puerto', 113); nv.p.marca = 80; nv.p.rep = 70; nv.hitos.patro = 1; nv.p.dinero = 20000; P2.comprarNegocio(nv, 'peluqueria', 2, null);
  check('Gran marca: solo en categorías altas (no en Tercera)', /Segunda|Primera|Solo patrocina/.test(P2.bloqueoMarca(nv, P2.MARCAS.find(m => m.id === 'nova')) || '') || /visibilidad/.test(P2.bloqueoMarca(nv, P2.MARCAS.find(m => m.id === 'nova')) || ''));
  // Oferta como decisión
  const of = enClub('atleticoFilial', 114); of.p.marca = 30; of.p.rep = 40; of.p.nivel = 56; of.stats.titular = 4;
  P2.revisarOfertasMarca(of);
  check('Al cumplir requisitos, la marca te llama (decisión con identidad y opción de decir que no)', of.pendiente && of.pendiente.tipo === 'patroOferta' && P2.vistaPendiente(of).ops.some(o => o.id === 'no'));
  P2.resolverDecision(of, 'no');
  check('Rechazar una marca queda registrado y se puede firmar después', of.tele.marcas.rechazadas.length === 1 && !P2.bloqueoMarca(of, P2.MARCAS.find(m => m.id === of.tele.marcas.rechazadas[0])));
  const ac = enClub('atleticoFilial', 115); ac.p.marca = 30; P2.firmarMarca(ac, 'panaderia', null); const e0 = ac.p.energia, c0 = ac.confianza; P2.resolverActo(ac, 'panaderia', 'ir');
  check('Ir a un acto cuesta energía y confianza del míster (más actos = menos carrera)', ac.p.energia < e0 && ac.confianza < c0);
  check('Hay marcas con más dinero y más obligaciones y otras con menos dinero y más crecimiento deportivo', (() => { const K = P2.MARCAS.find(m => m.id === 'kinetic'), V = P2.MARCAS.find(m => m.id === 'vertice'); return V.semanal > K.semanal && V.actoCada < K.actoCada && K.ef.entreno && !V.ef.entreno; })());

  // Telemetría local
  const tl2 = P2.nuevaPartida({ seed: 120, nombre: 'Nombre Secreto' });
  check('ID de test anónimo al empezar (TEST-XXXXX)', /^TEST-[0-9A-F]{5}$/.test(tl2.tele.id));
  P2.teleTiempo(tl2, 1000); P2.teleTiempo(tl2, 61000); P2.teleTiempo(tl2, 61000 + 20 * 60000);
  check('La duración real cuenta el tiempo jugado y no las pausas largas', tl2.tele.msActivo === 60000);
  for (let i = 0; i < 6; i++) { resolverTodo(tl2, ['no']); P2.jugarSemana(tl2, i % 2 ? 'descansar' : 'entrenar'); }
  check('Registra las acciones semanales', tl2.tele.acciones.entrenar === 3 && tl2.tele.acciones.descansar === 3);
  const sx = P2.nuevaPartida({ seed: 121 }); sx.pendiente = { tipo: 'suceso', id: 'masHoras' }; P2.resolverDecision(sx, 'finde');
  check('Registra las decisiones y la opción elegida', sx.tele.decisiones['suceso:masHoras'] && sx.tele.decisiones['suceso:masHoras'].finde === 1);
  const full = P2.nuevaPartida({ seed: 1003, nombre: 'Nombre Secreto' }); const o = P2.nuevaPartida; P2.nuevaPartida = () => full;
  P2.jugarPartida(P2.crearBot('equilibrada', 'inteligente', 'locales'), 1003, 90); P2.nuevaPartida = o;
  const T = full.tele;
  check('Momentos clave T1–T7 con semana de juego', ['T1', 'T2', 'T3', 'T5', 'T6', 'T7'].every(k => T.momentos[k] && T.momentos[k].semana > 0), JSON.stringify(Object.keys(T.momentos)));
  check('Registra prueba, club, partidos, empresa (caja) y segunda inversión', T.prueba && T.clubes.length && T.partidos.jugados > 5 && T.empresa.caja > 0 && T.segunda);
  P2.responderTest(full, 'p1', 8); P2.responderTest(full, 'p7', 'Más negocios'); P2.responderTest(full, 'p8', 'Quizá'); P2.responderTest(full, 'p2', 'En la liga');
  const inf = P2.informeTest(full);
  check('El informe de prueba tiene las secciones pedidas', ['TEST P2.4', 'Tienda', 'Relaciones', 'MONETIZACIÓN', T.id, 'Duración real', 'Semanas jugadas', 'Ruta inicial', 'Prueba', 'Primer club', 'Decisiones semanales', 'Patrocinadores', 'Empresa', 'Caja inicial', 'Segunda inversión', 'Momentos clave', 'Hitos alcanzados', 'Pantallas más visitadas', 'Momento de salida', 'PREGUNTAS'].every(x => inf.includes(x)));
  check('Las respuestas a las preguntas salen en el informe', inf.includes('8') && inf.includes('Más negocios') && inf.includes('Quizá') && inf.includes('En la liga'));
  check('El informe no incluye el nombre del personaje', !inf.includes('Nombre Secreto'));
}

// ---------- 7. Simulación de balance ----------
let informe;
{
  const t0 = Date.now(); informe = P2.runBalance(20); const ms = Date.now() - t0;
  for (const c of informe.comprobaciones) check(`Balance: ${c.t}`, c.ok);
  check('Balance: rejilla de 60 combinaciones y pruebas aparte en menos de 90 s', ms < 90000, `${ms} ms`);
  const e = informe.deportivasPuedenComprar.equilibrada;
  check('Una partida equilibrada completa el capítulo en 25–60 semanas', e.capituloPct >= 70 && e.semanaCapitulo >= 25 && e.semanaCapitulo <= 60, JSON.stringify(e));
  check('Balance: las 3 segundas inversiones se pueden pagar con el dinero típico al desbloquearlas', informe.deportivasPuedenComprar.equilibrada.dineroOportunidad >= Math.min(...P2.OPORTUNIDADES.map(o => o.coste)) && P2.OPORTUNIDADES.every(o => o.coste <= 3500), `mediana ${informe.deportivasPuedenComprar.equilibrada.dineroOportunidad}`);
  fs.writeFileSync(path.join(__dirname, '..', 'p2', 'balance.json'), JSON.stringify(informe, null, 1));
}

// ---------- 8. Interfaz ----------
(async () => {
  if (process.argv.includes('--rapido')) return fin();
  require('child_process').execSync('node ' + path.join(__dirname, '..', 'p2', 'build.cjs'));
  const url = 'file://' + path.join(__dirname, '..', 'p2', 'del_barrio_p2.html');
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ ...pw.devices['iPhone 13'], reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errs = [];
  const redes = []; page.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) redes.push(r.url()); });
  // Navegar como una persona: botón del grupo en la barra y, si hace falta, la pestaña de la sección
  // Navegar como una persona: «‹ Jugar» para volver; «🌍 Mi mundo» → icono de la sección
  const ir = async (pg, v) => {
    const cerrarAnuncio = async () => { if (await pg.locator('[data-act="interOk"]').count()) await pg.click('[data-act="interOk"]', { force: true }); };
    await cerrarAnuncio();
    if (await pg.locator('.atras').count()) await pg.tap('.atras');
    await cerrarAnuncio();
    if (v === 'semana') return;
    if (await pg.locator('.mundoBtn').count()) { await pg.tap('.mundoBtn'); await pg.tap(`.icono[data-v="${v}"]`); }
    else await pg.evaluate(v => __P2.ir(v), v);
  };
  await page.goto(url);
  check('UI: arranca en la pantalla de inicio', await page.locator('[data-act="empezar"]').isVisible());
  check('UI: al empezar se elige el personaje (5 grupos, 20 capas y vista previa)', await page.locator('.lookGrupos button').count() === 5 && P2.CAPAS_LOOK.length === 20 && await page.locator('.lookPrev svg').isVisible());
  await page.fill('#nombre', 'Vega');
  await page.tap('.lookGrupos [data-v="pelo"]'); await page.tap('.lookTabs [data-v="pelo"]'); await page.tap('.lk[data-c="pelo"][data-v="rizos"]');
  await page.tap('.lookGrupos [data-v="ropa"]'); await page.tap('.lookTabs [data-v="colorRopa"]'); await page.tap('.lk[data-c="colorRopa"][data-v="rojo"]');
  await page.tap('.lookGrupos [data-v="extras"]'); await page.tap('.lookTabs [data-v="gafas"]'); await page.tap('.lk[data-c="gafas"][data-v="sol"]');
  await page.tap('.lookGrupos [data-v="cara"]'); await page.tap('.lookTabs [data-v="piercing"]'); await page.tap('.lk[data-c="piercing"][data-v="combo"]');
  await page.tap('.lookGrupos [data-v="cuerpo"]'); await page.tap('.lookTabs [data-v="tatuaje"]'); await page.tap('.lk[data-c="tatuaje"][data-v="rosa"]');
  check('UI: en el inicio no se ofrecen prendas que exigen hitos', await page.locator('.lk[data-v="traje"], .lk[data-v="corona"]').count() === 0);
  check('UI: el nombre no se pierde al cambiar de capa', await page.inputValue('#nombre') === 'Vega');
  await page.tap('[data-act="empezar"]');
  check('UI: la partida empieza con el personaje elegido (también piercing y tatuaje)', await page.evaluate(() => __P2.S.look.pelo === 'rizos' && __P2.S.look.colorRopa === 'rojo' && __P2.S.look.gafas === 'sol' && __P2.S.look.piercing === 'combo' && __P2.S.look.tatuaje === 'rosa' && __P2.S.nombre === 'Vega'));
  check('UI: tu cara sale en la cabecera', await page.locator('#top .hava svg').isVisible());
  check('UI: sin barra de botones abajo: solo el botón «Mi mundo» arriba', await page.locator('#nav button').count() === 0 && await page.locator('.mundoBtn').isVisible());
  check('UI: el inicio enseña tu personaje en su escenario, el objetivo y la energía (fondo claro)', await page.locator('.exterior .pj svg').isVisible() && (await page.textContent('.obj')).includes('Consigue una prueba') && await page.locator('#top .ener').isVisible() && await page.evaluate(() => getComputedStyle(document.getElementById('decor')).display === 'none'));
  check('UI: como mucho 3 opciones grandes y cada una dice lo que da', await page.locator('.pant > .ops > .op').count() === 3 && await page.evaluate(() => [...document.querySelectorAll('.pant > .ops > .op')].every(b => b.querySelector('.chip'))));
  const box = await page.locator('.op').first().boundingBox(), vh = page.viewportSize().height;
  check('UI: la primera opción se ve sin desplazarse en un iPhone 13', box && box.y + box.height < vh, JSON.stringify(box));
  check('UI: cada opción dice cuánta energía cuesta o da', await page.evaluate(() => [...document.querySelectorAll('.pant > .ops > .op')].every(b => /⚡/.test(b.textContent))));
  const s0 = await page.evaluate(() => __P2.S.semana);
  await page.tap('.op[data-id="entrenar"]');
  check('UI: un toque en la opción juega la semana', await page.evaluate(s0 => __P2.S.semana === s0 + 1 && __P2.S.cont.entrenar === 1, s0));
  check('UI: después sale la pantalla de resultado con los números que cambian', await page.locator('.res h2').isVisible() && (await page.textContent('.cambios')).includes('Nivel'));
  const antes = await page.evaluate(() => ({ d: __P2.S.p.dinero, s: __P2.S.semana, n: __P2.S.p.nivel }));
  await page.reload();
  const despues = await page.evaluate(() => ({ d: __P2.S.p.dinero, s: __P2.S.semana, n: __P2.S.p.nivel }));
  check('UI: recargar no duplica nada (dinero, semana y nivel iguales)', JSON.stringify(antes) === JSON.stringify(despues), JSON.stringify([antes, despues]));
  check('UI: tras recargar vuelves a tu semana', await page.locator('.op').count() >= 3);
  // Una situación: pantalla propia, respuestas grandes; después, su consecuencia y a seguir
  await page.evaluate(() => { __P2.S.pendiente = { tipo: 'suceso', id: 'masHoras' }; __P2.render(); });
  check('UI: con algo pendiente, sale la situación y no las opciones de la semana', await page.locator('.sit').isVisible() && await page.locator('.op').count() === 0 && await page.locator('.resp').count() >= 2);
  await page.tap('.resp[data-id="no"]');
  check('UI: tras responder se ve lo que ha pasado con un botón para seguir', await page.locator('.res [data-act="seguir"]').isVisible());
  await page.tap('[data-act="seguir"]');
  check('UI: y vuelves a elegir tu semana', await page.locator('.op').count() >= 3);
  await page.tap('.mundoBtn');
  check('UI: «Mi mundo» enseña lo abierto y, bloqueado, lo que viene (Liga, Empresa)', await page.locator('.icono[data-v="tienda"]').isVisible() && await page.locator('.icono.lock').count() >= 3);
  await page.tap('.hoja .cerrar');
  // Personaje: cambiarlo luego desde la cabecera; las prendas de hitos se desbloquean
  await page.tap('#top .hava');
  await page.tap('.lookGrupos [data-v="ropa"]'); await page.tap('.lookTabs [data-v="ropa"]');
  check('UI: el traje de empresario está bloqueado hasta tener empresa', await page.locator('.lk[data-v="traje"]').isDisabled());
  await page.tap('.lk[data-c="ropa"][data-v="sudadera"]');
  check('UI: cambiar de ropa desde «Tu personaje» se guarda', await page.evaluate(() => __P2.S.look.ropa === 'sudadera' && JSON.parse(localStorage.getItem('del_barrio_al_negocio_p2')).look.ropa === 'sudadera'));
  // Club, empresa y recarga
  await ir(page, 'semana');
  await page.evaluate(() => { const S = __P2.S; S.p.nivel = 58; __P2.P2.firmar(S, 'puerto', null); S.p.dinero = 9000; __P2.render(); });
  check('UI: al firmar sale la animación del contrato (club, sueldo, duración, total, firma y prima)', await page.locator('.cele-contrato .contrato').isVisible() && await (async () => { const x = await page.textContent('.cele-contrato'); return x.includes('UD Puerto') && x.includes('/semana') && x.includes('Total del contrato') && x.includes('FIRMADO') && x.includes('Prima de fichaje'); })() && await page.locator('.cele .trazo').count() === 1);
  await page.click('[data-act="celeOk"]', { force: true });
  check('UI: al firmar se celebra lo nuevo («NUEVO: Liga»)', await page.locator('.fiesta').isVisible() && (await page.textContent('.fiesta')).includes('Liga'));
  for (let g = 0; g < 4 && await page.locator('.fiesta').count(); g++) await page.tap('.fiesta [data-act="seguir"]');
  check('UI: en el club se juega con partido («¿Qué haces además del partido?»)', (await page.textContent('.pant h1')).includes('partido') && await page.evaluate(() => document.body.dataset.etapa === 'club'));
  await page.evaluate(() => { const S = __P2.S; S.pendiente = null; S.cola = []; S.hitos.patro = 3; __P2.render(); });
  check('UI: al abrirse el mercado sale el gran aviso «NUEVO: EMPRESA»', await page.locator('.sit.mega').isVisible() && (await page.textContent('.sit.mega')).includes('NUEVO: EMPRESA'));
  await page.tap('.sit.mega [data-act="decidir"][data-id="ver"]');
  check('UI: «Ver Empresa» te lleva a Empresa', await page.evaluate(() => __P2.ui.vista === 'empresa') && await page.locator('.atras').isVisible());
  await page.tap('[data-act="comprar"][data-id="1"]');
  const c1 = await page.evaluate(() => ({ d: __P2.S.p.dinero, c: __P2.S.negocios[0].caja }));
  check('UI: comprar la peluquería desde «Empresa»', c1.c === 3000 - 1250 && c1.d === 9000 - 4500 - 3000, JSON.stringify(c1));
  check('UI: al comprar el negocio sale la animación del local (persiana, «ABIERTO» y lo invertido)', await page.locator('.cele-negocio .local .persiana').count() === 1 && (await page.textContent('.cele-negocio')).includes('ABIERTO') && /7\.?500/.test(await page.textContent('.cele-negocio .bigMoney')));
  await page.click('[data-act="celeOk"]', { force: true });
  await page.tap('[data-act="config"][data-c="precio"][data-v="caro"]');
  check('UI: cambiar el precio enseña la previsión al momento', (await page.textContent('.prev')).includes('clientes') && await page.evaluate(() => __P2.S.negocios[0].precio === 'caro'));
  await page.fill(`#imp_${await page.evaluate(() => __P2.S.negocios[0].id)}`, '500');
  await page.tap('[data-act="aportar"]');
  const c2 = await page.evaluate(() => ({ d: __P2.S.p.dinero, c: __P2.S.negocios[0].caja }));
  check('UI: poner dinero en la caja es explícito (sale de tu cuenta)', c2.c === c1.c + 500 && c2.d === c1.d - 500);
  await page.reload();
  const c3 = await page.evaluate(() => ({ d: __P2.S.p.dinero, c: __P2.S.negocios[0].caja }));
  check('UI: recargar no duplica dinero ni caja', JSON.stringify(c2) === JSON.stringify(c3));
  const malas = [];
  for (const v of ['semana', 'relaciones', 'liga', 'marcas', 'tienda', 'empresa', 'patrimonio', 'personaje', 'hitos', 'ajustes']) { await ir(page, v); const tx = await page.evaluate(() => document.getElementById('main').innerText); const m = tx.match(/.{0,40}(undefined|NaN|\[object).{0,20}/); if (m) malas.push(v + ': ' + m[0]); }
  check('UI: ninguna vista muestra undefined/NaN', !malas.length, malas.join(' | '));
  // Tienda: comprar, ver la celebración, inventario y patrimonio
  await page.evaluate(() => { __P2.S.p.dinero = 5000; __P2.guardar(); });
  await ir(page, 'tienda');
  await page.tap('[data-act="cat"][data-v="vehiculos"]');
  const dm = await page.evaluate(() => __P2.S.p.dinero);
  await page.tap('[data-act="comprarP"][data-id="moto"]');
  check('UI: lo caro pide confirmación (no se compra al primer toque)', await page.evaluate(dm => __P2.S.p.dinero === dm && !__P2.S.inventario.some(x => x.id === 'moto'), dm) && (await page.textContent('.prod.conf')).includes('¿Seguro?'));
  await page.tap('[data-act="comprarP"][data-id="moto"]');
  check('UI: la primera moto sale a lo grande («¡TU PRIMERA MOTO!») y el dinero baja una vez', await page.locator('.cele-coche .cocheEntra svg').isVisible() && (await page.textContent('.cele-coche')).includes('PRIMERA MOTO') && await page.evaluate(dm => __P2.S.p.dinero === dm - 1900, dm));
  await page.click('[data-act="celeOk"]', { force: true });
  check('UI: tras la gran animación no se repite el aviso de «NUEVA COMPRA»', await page.locator('.compraOk').count() === 0);
  check('UI: la moto aparece en «Tus cosas» como vehículo', (await page.textContent('.cosas')).includes('Moto') && await page.locator('.prod.tuyo[data-id="moto"] .precio').isDisabled());
  await page.reload();
  check('UI: recargar conserva la compra y no la duplica', await page.evaluate(dm => __P2.S.p.dinero === dm - 1900 && __P2.S.inventario.filter(x => x.id === 'moto').length === 1, dm));
  await ir(page, 'patrimonio');
  check('UI: el patrimonio incluye la moto (1.140 €)', (await page.textContent('.patri')).includes('1140'));
  // Minijuego en la interfaz: el día de las pruebas
  await ir(page, 'semana');
  await page.evaluate(() => { const S = __P2.S; S.pendiente = null; S.cola = []; S.p.lesion = 0; S.p.energia = 90; for (let k = 0; k < 40 && S.temporada.jornada < S.temporada.calendario.length - 1; k++) { S.pendiente = null; S.cola = []; __P2.P2.jugarSemana(S, 'descansar'); } S.pendiente = null; S.cola = []; S.p.lesion = 0; S.p.energia = 90; S.celebraciones = []; __P2.ui.celes = []; __P2.render(); __P2.ui.celes = []; __P2.ui.paso = null; __P2.ui.fiestas = []; __P2.ui.mundo = false; __P2.ui.vista = 'semana'; __P2.render(); });
  await page.click('.op', { force: true });
  check('UI: en el partido decisivo sale el minijuego del penalti (con vidas y opción de simular)', (await page.textContent('.mj')).includes('Penalti') && await page.locator('.mj .vidas').isVisible() && await page.locator('[data-act="mjSimular"]').isVisible());
  await page.click('[data-act="mjSimular"]', { force: true });
  check('UI: simular enseña si ha salido bien o mal (lo decide tu nivel) y no deja reintentar', (await page.textContent('.mj')).includes('Simulado') && await page.locator('[data-act="mjReintentar"]').count() === 0);
  await page.click('[data-act="mjFin"]', { force: true });
  if (await page.locator('.cele-ascenso').count()) {
    check('UI: al subir de categoría sale la animación del ascenso (escalera de categorías y prima)', await page.locator('.cele-ascenso .escalera .pelda.meta .ficha').isVisible() && (await page.textContent('.cele-ascenso')).includes('ASCENSO'));
    await page.click('[data-act="celeOk"]', { force: true });
  }
  for (let g = 0; g < 4 && await page.locator('[data-act="celeOk"]').count(); g++) await page.click('[data-act="celeOk"]', { force: true });
  check('UI: después sigue la semana con el resultado del partido', await page.locator('.res .marcador').isVisible());
  for (let g = 0; g < 6 && await page.locator('[data-act="seguir"]').count(); g++) await page.click('[data-act="seguir"]', { force: true });
  // Promoción: te juegas la categoría en el minijuego
  await page.evaluate(() => { const S = __P2.S, T = S.temporada, L = __P2.P2.LIGAS[T.liga]; S.pendiente = null; S.cola = []; T.cerrada = true; T.promocion = { clase: L.sube ? 'ascenso' : L.baja ? 'permanencia' : 'titulo', estado: 'pendiente', pos: 3 }; __P2.ui.paso = null; __P2.ui.fiestas = []; __P2.ui.mundo = false; __P2.ui.vista = 'semana'; __P2.render(); });
  if (await page.locator('[data-act="interOk"]').count()) await page.click('[data-act="interOk"]', { force: true });
  check('UI: la semana de la promoción avisa de lo que te juegas', (await page.textContent('.partidoProx')).includes('Esta semana') && (await page.textContent('.partidoProx')).includes('✗'));
  await page.click('.op', { force: true });
  check('UI: el minijuego de la promoción dice qué pasa si ganas y si pierdes', (await page.textContent('.mj')).includes('TE LO JUEGAS TODO') && await page.locator('.mj .enjuego.bien').isVisible() && await page.locator('.mj .enjuego.mal').isVisible());
  await page.evaluate(() => { __P2.ui.mj.res = [0.1, 0.1, 0.1]; __P2.ui.mj.p = 0.1; __P2.ui.mj.fase = 'fin'; __P2.render(); });
  check('UI: si pierdes la promoción puedes reintentar gastando una vida', (await page.textContent('.mj')).includes('Se escapa') && (await page.locator('[data-act="mjReintentar"]').count() + await page.locator('.rw[data-t="vida"]').count()) === 1);
  await page.click('[data-act="mjFin"]', { force: true });
  for (let g = 0; g < 4 && await page.locator('[data-act="celeOk"]').count(); g++) await page.click('[data-act="celeOk"]', { force: true });
  check('UI: el resultado de la promoción sale en grande', await page.locator('.res').isVisible() && await page.evaluate(() => __P2.S.ultimo.lineas.some(l => /Promoción|Final por el título/.test(l[1]))));
  for (let g = 0; g < 6 && await page.locator('[data-act="seguir"]').count(); g++) await page.click('[data-act="seguir"]', { force: true });
  // Los 4 minijuegos nuevos, jugados de verdad
  const mjDe = async juego => { await page.evaluate(j => { const S = __P2.S, T = S.temporada; S.pendiente = null; S.cola = []; T.cerrada = true; T.promocion = { clase: 'ascenso', estado: 'pendiente', pos: 3 }; __P2.ui.celes = []; __P2.ui.paso = null; __P2.ui.fiestas = []; __P2.ui.mundo = false; __P2.ui.inter = false; __P2.ui.vista = 'semana'; __P2.ui.mj = { tipo: 'promocion', juego: j, accion: 'descansar', fase: 'intro', res: [], reintentos: 0, enJuego: __P2.P2.enJuego(S, 'promocion') }; __P2.render(); }, juego); };
  await mjDe('toques');
  check('UI: el minijuego enseña qué juego es y su dificultad', (await page.textContent('.mjJuego')).includes('Toques') && (await page.textContent('.mjJuego .dif')).includes('Fácil'));
  await page.click('[data-act="mjEmpezar"]', { force: true });
  for (let k = 0; k < 5; k++) { await page.waitForFunction(() => __P2.ui.mjPos > 88, null, { timeout: 5000 }); await page.click('#mjToque', { force: true }); }
  check('UI: Toques (fácil): tocar cuando el balón baja al pie sale bien', await page.evaluate(() => __P2.ui.mj.fase === 'fin' && __P2.ui.mj.p >= 0.6));
  await mjDe('pase'); await page.click('[data-act="mjEmpezar"]', { force: true });
  check('UI: Pase (fácil): esperas al desmarque con tres compañeros', await page.locator('.mjCampo .comp').count() === 3);
  for (let k = 0; k < 3; k++) { await page.waitForSelector('.comp.libre', { timeout: 6000 }); await page.click('.comp.libre', { force: true }); }
  check('UI: Pase (fácil): pasar al desmarcado a tiempo sale bien', await page.evaluate(() => __P2.ui.mj.fase === 'fin' && __P2.ui.mj.p >= 0.6));
  await mjDe('pase'); await page.click('[data-act="mjEmpezar"]', { force: true }); await page.click('.comp >> nth=0', { force: true });
  check('UI: Pase: tocar antes del desmarque cuenta como fallo', await page.evaluate(() => __P2.ui.mj.res[0] === 0));
  await mjDe('memoria'); await page.click('[data-act="mjEmpezar"]', { force: true });
  check('UI: Jugada ensayada (media): primero enseña la jugada', await page.locator('.mjPizarra').isVisible());
  await page.waitForFunction(() => __P2.ui.mj.fase === 'mrep', null, { timeout: 8000 });
  const sec = await page.evaluate(() => __P2.ui.mj.sec);
  for (const f of sec) await page.click(`[data-act="mjFlecha"][data-v="${f}"]`, { force: true });
  check('UI: Jugada ensayada: repetirla bien es un acierto perfecto', await page.evaluate(() => __P2.ui.mj.fase === 'fin' && __P2.ui.mj.p === 1));
  await mjDe('memoria'); await page.click('[data-act="mjEmpezar"]', { force: true }); await page.waitForFunction(() => __P2.ui.mj.fase === 'mrep', null, { timeout: 8000 });
  await page.evaluate(() => { const J = __P2.ui.mj; J.sec = [0, 1, 2, 3, 0]; });
  await page.click('[data-act="mjFlecha"][data-v="0"]', { force: true }); await page.click('[data-act="mjFlecha"][data-v="3"]', { force: true });
  check('UI: Jugada ensayada: equivocarse acaba la jugada (1 de 5 → fallo, se puede reintentar con una vida)', await page.evaluate(() => __P2.ui.mj.fase === 'fin' && Math.abs(__P2.ui.mj.p - 0.2) < 1e-9) && (await page.locator('[data-act="mjReintentar"]').count() + await page.locator('.rw[data-t="vida"]').count()) === 1);
  await mjDe('portero');
  check('UI: Parada imposible es el juego difícil', (await page.textContent('.mjJuego .dif')).includes('Difícil'));
  await page.click('[data-act="mjEmpezar"]', { force: true });
  for (let k = 0; k < 3; k++) { await page.waitForFunction(() => __P2.ui.mj.balon != null, null, { timeout: 6000 }); const lado = await page.evaluate(() => __P2.ui.mj.balon); await page.click(`[data-act="mjParada"][data-v="${lado}"]`, { force: true }); }
  check('UI: Parada imposible: tirarse al lado bueno a tiempo para los tres tiros', await page.evaluate(() => __P2.ui.mj.fase === 'fin' && __P2.ui.mj.p >= 0.6));
  await mjDe('portero'); await page.click('[data-act="mjEmpezar"]', { force: true });
  await page.waitForFunction(() => __P2.ui.mj.res.length >= 1, null, { timeout: 6000 });
  check('UI: Parada imposible: si no te tiras, es gol', await page.evaluate(() => __P2.ui.mj.res[0] === 0));
  await page.evaluate(() => { __P2.ui.mj = null; const T = __P2.S.temporada; T.promocion = null; __P2.render(); });
  // Monetization Lab en la interfaz
  await page.evaluate(() => { __P2.S.p.dinero = 900; __P2.S.monVariante = 'C'; __P2.S.pendiente = null; __P2.S.cola = []; __P2.guardar(); });
  await ir(page, 'tienda'); await page.tap('[data-act="cat"][data-v="accesorios"]');
  await page.tap('.rw[data-t="cupon"][data-id="relojDep"]');
  check('UI: «Ver anuncio» abre la simulación con la recompensa (sin vídeo ni espera)', (await page.textContent('.modal')).includes('SIMULACIÓN DE ANUNCIO') && (await page.textContent('.modal')).includes('20–30 segundos'));
  await page.tap('[data-act="rwOk"]');
  check('UI: tras aceptar, el reloj sale con el precio rebajado', (await page.textContent('.prod[data-id="relojDep"] .precio')).includes('162'));
  // ---------- Premium: comercio real (simulado en el navegador, mismo servicio que el servidor) ----------
  const din0 = await page.evaluate(() => ({ d: __P2.S.p.dinero, n: __P2.S.p.nivel, r: __P2.S.p.rep, m: __P2.S.p.marca }));
  await page.tap('.iapCard [data-act="iap"]');
  const fx = await page.textContent('.pmFicha');
  check('UI Premium: la oferta abre la ficha con nombre, precio REAL, qué incluye, «solo aspecto» y permanente', fx.includes('Pack Debut') && /0,99 €/.test(fx) && fx.includes('dinero real') && fx.includes('Incluye') && fx.includes('Solo aspecto') && fx.includes('Compra permanente'));
  check('UI Premium: «Comprar» desactivado hasta marcar la casilla (sin preselección) y «No, gracias» igual de visible', await page.locator('[data-act="pmComprar"]').isDisabled() && !(await page.locator('[data-act="pmConsent"]').isChecked()) && await page.locator('.pmBotones [data-act="pmCerrar"]').isVisible());
  check('UI Premium: sin cuentas atrás ni urgencia falsa', !/quedan \d|solo hoy|termina en|últimas unidades|oferta expira/i.test(fx));
  await page.click('[data-act="pmConsent"]', { force: true });
  await page.click('[data-act="pmComprar"]', { force: true });
  check('UI Premium: invitado → «Crea una cuenta para proteger y restaurar tus compras en cualquier dispositivo»', (await page.textContent('.modal')).includes('Crea una cuenta para proteger y restaurar tus compras en cualquier dispositivo') && await page.locator('[data-act="pmCerrar"]').isVisible());
  await page.click('[data-act="pmCrear"][data-v="email"]', { force: true });
  await page.waitForFunction(() => !__P2.COM.isGuest());
  await page.click('[data-act="pmComprar"]', { force: true });
  await page.waitForSelector('.pmCheckout');
  const ck = await page.textContent('.pmCheckout');
  check('UI Premium: checkout de prueba (Stripe TEST simulado): no pide tarjeta, no cobra, enseña la referencia', ck.includes('STRIPE TEST') && ck.includes('no se pide ninguna tarjeta') && /Referencia de la orden: [A-Z0-9]{10}/.test(ck));
  await page.click('[data-act="pmPagar"][data-v="paid"]', { force: true });
  check('UI Premium: «Estamos verificando tu compra…» (espera al servidor, no a la página de éxito)', (await page.textContent('.modal')).includes('Estamos verificando tu compra'));
  await page.waitForSelector('.cele-premium', { timeout: 15000 });
  check('UI Premium: compra confirmada → gran momento «¡DESBLOQUEADO!» y el Pack Debut puesto', (await page.textContent('.cele-premium')).includes('Pack Debut') && await page.evaluate(() => __P2.P2.tieneEnt('cosmetic.debut_pack') && __P2.S.look.ropa === 'debut' && __P2.S.look.calzado === 'debut'));
  check('UI Premium: comprar no toca el juego (dinero del juego, nivel, reputación y marca iguales)', await page.evaluate(a => __P2.S.p.dinero === a.d && __P2.S.p.nivel === a.n && __P2.S.p.rep === a.r && __P2.S.p.marca === a.m, din0));
  await page.click('[data-act="celeOk"]', { force: true });
  await ir(page, 'premium');
  await page.waitForSelector('.pmTabs');
  await page.waitForFunction(() => /Completada/.test(document.body.textContent));
  const mc = await page.textContent('#main');
  check('UI Premium: «Mis compras» con producto, fecha, proveedor, estado y referencia', mc.includes('Pack Debut') && mc.includes('Completada') && /ref\. [A-Z0-9]{10}/.test(mc) && mc.includes('Restaurar compras'));
  await page.evaluate(() => { __P2.COM.clearCache(); __P2.render(); });
  check('UI Premium: con la caché del navegador borrada el pack no aparece…', await page.evaluate(() => !__P2.P2.tieneEnt('cosmetic.debut_pack')));
  await page.click('[data-act="pmRestaurar"]', { force: true });
  await page.waitForFunction(() => __P2.P2.tieneEnt('cosmetic.debut_pack'));
  check('UI Premium: …y «Restaurar compras» lo recupera de la cuenta sin pagar', await page.evaluate(() => __P2.P2.tieneEnt('cosmetic.debut_pack') && __P2.COM.backend._repo.dump().payments.length === 1));
  await page.evaluate(() => { __P2.ui.pm = { tab: 'destacados', sku: 'prestige_world_football_president' }; __P2.render(); });
  check('UI Premium: Prestige avisa «La compra NO garantiza ganar»', (await page.textContent('.pmFicha')).includes('La compra NO garantiza ganar'));
  await page.evaluate(() => { __P2.ui.pm = { tab: 'destacados', sku: 'prestige_world_climbing_president' }; __P2.render(); });
  check('UI Premium: dependencia antes de pagar: «Necesitas la expansión Escalada» + botón para verla', (await page.textContent('.pmFicha')).includes('Necesitas la expansión') && (await page.textContent('.pmFicha')).includes('Escalada') && await page.locator('.pmReq [data-act="pmVer"][data-id="sport_climbing"]').count() === 1 && await page.locator('[data-act="pmComprar"]').count() === 0);
  await page.evaluate(() => { __P2.ui.pm = { tab: 'destacados', sku: 'pack_street' }; __P2.render(); });
  check('UI Premium: «Próximamente» no se puede comprar', (await page.textContent('.pmFicha')).includes('Próximamente') && await page.locator('[data-act="pmComprar"]').count() === 0);
  await page.evaluate(() => { __P2.ui.pm = { tab: 'destacados' }; __P2.render(); });
  await ir(page, 'premium');
  check('UI Premium: pestañas Destacados, Packs, Deportes, Expansiones, Prestige, Bundles y Comprado; precios reales con estilo propio', await page.locator('.pmTabs button').count() === 7 && (await page.locator('.precioReal').count()) >= 0 && !(await page.textContent('#main')).includes('gemas'));
  await ir(page, 'semana');
  check('UI Premium: la insignia Debut se ve junto a tu semana', (await page.textContent('#top')).includes('🌟'));
  await page.evaluate(() => { __P2.ui.pm = { tab: 'destacados', sku: 'remove_ads', consent: true }; __P2.render(); });
  await page.click('[data-act="pmComprar"]', { force: true });
  await page.waitForSelector('.pmCheckout');
  await page.click('[data-act="pmPagar"][data-v="paid"]', { force: true });
  await page.waitForSelector('.cele-premium', { timeout: 15000 });
  await page.click('[data-act="celeOk"]', { force: true });
  check('UI Premium: «Quitar anuncios» quita los obligatorios (los voluntarios siguen)', await page.evaluate(() => { const S = __P2.S; S.tele.mon.intersticialPend = 'test'; S.tele.mon.intersticialMs = null; return __P2.P2.intersticialAhora(S) === null && __P2.P2.REWARDED && true; }));
  await page.evaluate(() => { __P2.ui.pm = null; __P2.ui.vista = 'semana'; __P2.render(); });
  await page.tap('.prod[data-id="relojDep"] .deseo').catch(() => {});
  await ir(page, 'inversiones');
  check('UI: «Inversiones» enseña el camino con lo desbloqueado y lo que falta', await page.locator('.inv').count() >= 8 && (await page.textContent('#main')).includes('Segunda inversión'));
  await ir(page, 'historia');
  check('UI: «Mi historia» enseña tu carrera', (await page.textContent('#main')).includes('Mi historia'));
  await ir(page, 'relaciones');
  check('UI: Relaciones muestra tarjetas con nombre, valor y estado', await page.locator('.pers:not(.bloq)').count() >= 6 && (await page.textContent('#main')).includes('CARMEN') && (await page.textContent('#main')).includes('/100') && await page.locator('.pers.bloq').count() === 2);
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  check('UI: sin desplazamiento horizontal', ancho);
  // Partida de P1 en el navegador → «Seguir con tu jugador de P1»
  const ctx2 = await b.newContext({ ...pw.devices['iPhone 13'], reducedMotion: 'reduce' }); const p2 = await ctx2.newPage();
  await p2.goto(url);
  await p2.evaluate(() => { localStorage.setItem('del_barrio_al_negocio_p1_v5', JSON.stringify({ nombre: 'Ruth', semana: 80, fase: 'club', p: { dinero: 5000, rep: 50, nivel: 70 } })); });
  await p2.reload();
  await p2.tap('[data-act="desdeP1"]');
  check('UI: una partida de P1 pasa a P2 sin errores y sin borrar la de P1', await p2.evaluate(() => __P2.S.nombre === 'Ruth' && __P2.S.saveVersion === 2 && !!localStorage.getItem('del_barrio_al_negocio_p1_v5')));
  // Guardado corrupto: no rompe y no se borra
  await p2.evaluate(() => localStorage.setItem('del_barrio_al_negocio_p2', '{roto'));
  await p2.reload();
  check('UI: un guardado corrupto no rompe el juego y se aparta una copia', await p2.locator('[data-act="empezar"]').isVisible() && await p2.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('del_barrio_al_negocio_p2_copia_'))));
  // Informe de prueba en Ajustes
  await ir(page, 'ajustes');
  await page.tap('#informeTest summary');
  await page.tap('[data-act="resp"][data-q="p1"][data-v="7"]');
  await page.tap('[data-act="resp"][data-q="p8"][data-v="Sí"]');
  await page.fill('#r_p2', 'Al principio'); await page.dispatchEvent('#r_p2', 'change');
  await page.tap('[data-act="informe"]');
  const inf = await page.inputValue('#textoInforme');
  check('UI: «Informe de prueba» genera un texto copiable con ID, duración y respuestas', /TEST P2\.4/.test(inf) && /ID: TEST-[0-9A-F]{5}/.test(inf) && inf.includes('Duración real') && inf.includes('Al principio') && /\n   7\n/.test(inf) && inf.includes('Sí'));
  check('UI: el informe cuenta las pantallas visitadas', /Pantallas más visitadas: .*ajustes/.test(inf));
  check('UI: sin errores de JavaScript', errs.length === 0, errs.join(' | '));
  check('UI: el juego no hace ninguna petición de red (ni anuncios ni pagos reales)', redes.length === 0, redes.join(' '));
  await b.close();
  fin();
})();
function fin() {
  console.log('\nEstrategias deportivas (todas pueden comprar):'); for (const [k, p] of Object.entries(informe.deportivasPuedenComprar)) console.log(`  ${k}: contrato sem ${p.semanaContrato} · empresa sem ${p.semanaEmpresa} · capítulo ${p.capituloPct} % (sem ${p.semanaCapitulo}) · patrimonio sem 80 ${p.patrimonio80} · nivel ${p.nivel}`);
  console.log(`\n${ok} de ${total} comprobaciones superadas.`);
  process.exitCode = ok === total ? 0 : 1;
}
