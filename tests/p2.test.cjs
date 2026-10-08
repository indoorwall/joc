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
  for (let w = 0; w < 25 && !(p.pendiente && p.pendiente.tipo === 'renovarMarca'); w++) {
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
  check('Al empezar solo se ven Semana, Hitos y Ajustes', P2.seccionesVisibles(nv).map(x => x.id).join() === 'semana,hitos,ajustes');
  nv.p.nivel = 56; P2.firmar(nv, 'puerto', null); const nuevas = P2.revisarSecciones(nv, null).map(x => x.id);
  check('Al firmar se abren Liga y Marcas (y se avisa)', nuevas.includes('liga') && nuevas.includes('marcas') && !P2.seccionesVisibles(nv).some(x => x.id === 'empresa') && nv.seccionesNuevas.includes('liga'));
  nv.hitos.patro = 5;
  check('Al abrirse el mercado aparece Empresa', P2.revisarSecciones(nv, null).map(x => x.id).join() === 'empresa');

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
  check('El informe de prueba tiene las secciones pedidas', ['TEST P2.2', T.id, 'Duración real', 'Semanas jugadas', 'Ruta inicial', 'Prueba', 'Primer club', 'Decisiones semanales', 'Patrocinadores', 'Empresa', 'Caja inicial', 'Segunda inversión', 'Momentos clave', 'Hitos alcanzados', 'Pantallas más visitadas', 'Momento de salida', 'PREGUNTAS'].every(x => inf.includes(x)));
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
  const ctx = await b.newContext({ ...pw.devices['iPhone 13'] });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(url);
  check('UI: arranca en la pantalla de inicio', await page.locator('[data-act="empezar"]').isVisible());
  check('UI: al empezar se elige el personaje (12 capas y vista previa)', await page.locator('.lookTabs button').count() === 12 && await page.locator('.lookPrev svg').isVisible());
  await page.fill('#nombre', 'Vega');
  await page.tap('.lookTabs [data-v="pelo"]'); await page.tap('.lk[data-c="pelo"][data-v="rizos"]');
  await page.tap('.lookTabs [data-v="colorRopa"]'); await page.tap('.lk[data-c="colorRopa"][data-v="rojo"]');
  await page.tap('.lookTabs [data-v="gafas"]'); await page.tap('.lk[data-c="gafas"][data-v="sol"]');
  check('UI: en el inicio no se ofrecen prendas que exigen hitos', await page.locator('.lk[data-v="traje"], .lk[data-v="corona"]').count() === 0);
  check('UI: el nombre no se pierde al cambiar de capa', await page.inputValue('#nombre') === 'Vega');
  await page.tap('[data-act="empezar"]');
  check('UI: la partida empieza con el personaje elegido', await page.evaluate(() => __P2.S.look.pelo === 'rizos' && __P2.S.look.colorRopa === 'rojo' && __P2.S.look.gafas === 'sol' && __P2.S.nombre === 'Vega'));
  check('UI: tu cara sale en la cabecera', await page.locator('#top .hava svg').isVisible());
  check('UI: al empezar la barra solo tiene Semana, Hitos y Ajustes', (await page.locator('#nav button').allTextContents()).map(x => x.replace(/[^A-Za-zñ]/g, '')).join() === 'Semana,Hitos,Ajustes');
  check('UI: el botón «Jugar semana» empieza desactivado hasta que eliges', await page.locator('#jugar').isDisabled());
  const box = await page.locator('.dec .opt').first().boundingBox(), vh = page.viewportSize().height;
  check('UI: la primera decisión se ve sin desplazarse en un iPhone 13', box && box.y + box.height < vh - 60, JSON.stringify(box));
  const orden = await page.evaluate(() => { const m = document.getElementById('main'); const a = m.querySelector('.sit'), d = m.querySelector('.dec'); return a && d && (a.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; });
  check('UI: orden situación → decisión → consecuencia', orden);
  const s0 = await page.evaluate(() => __P2.S.semana);
  await page.tap('[data-act="elegir"][data-id="entrenar"]');
  check('UI: elegir una acción no pasa la semana', await page.evaluate(s0 => __P2.S.semana === s0 && __P2.S.eleccion === 'entrenar', s0));
  check('UI: el botón «Jugar semana» enseña lo elegido', (await page.textContent('#jugar')).includes('Entrenar duro'));
  await page.tap('#jugar');
  check('UI: «Jugar semana» juega la semana con la acción elegida', await page.evaluate(s0 => __P2.S.semana === s0 + 1 && __P2.S.cont.entrenar === 1, s0));
  check('UI: tras la semana se ve la consecuencia con «¿Por qué?»', await page.locator('details.por summary').first().isVisible() && (await page.textContent('#main')).includes('Entrenas duro'));
  const antes = await page.evaluate(() => ({ d: __P2.S.p.dinero, s: __P2.S.semana, n: __P2.S.p.nivel }));
  await page.reload();
  const despues = await page.evaluate(() => ({ d: __P2.S.p.dinero, s: __P2.S.semana, n: __P2.S.p.nivel }));
  check('UI: recargar no duplica nada (dinero, semana y nivel iguales)', JSON.stringify(antes) === JSON.stringify(despues), JSON.stringify([antes, despues]));
  // Con una decisión pendiente, el botón espera
  await page.evaluate(() => { __P2.S.pendiente = { tipo: 'suceso', id: 'masHoras' }; __P2.render(); });
  check('UI: con una decisión pendiente, el botón «Jugar semana» no aparece (decides primero)', await page.locator('#jugar').count() === 0);
  await page.tap('.dec [data-act="decidir"][data-id="no"]');
  check('UI: tras decidir, el botón sigue esperando a que elijas', await page.locator('#jugar').isDisabled() && (await page.textContent('#jugar')).includes('Elige'));
  // Personaje: cambiarlo luego desde la cabecera; las prendas de hitos se desbloquean
  await page.tap('#top .hava');
  await page.tap('.lookTabs [data-v="ropa"]');
  check('UI: el traje de empresario está bloqueado hasta tener empresa', await page.locator('.lk[data-v="traje"]').isDisabled());
  await page.tap('.lk[data-c="ropa"][data-v="sudadera"]');
  check('UI: cambiar de ropa desde «Tu personaje» se guarda', await page.evaluate(() => __P2.S.look.ropa === 'sudadera' && JSON.parse(localStorage.getItem('del_barrio_al_negocio_p2')).look.ropa === 'sudadera'));
  // Club, empresa y recarga
  await page.evaluate(() => { const S = __P2.S; S.p.nivel = 58; __P2.P2.firmar(S, 'puerto', null); S.p.dinero = 9000; S.hitos.patro = 3; __P2.render(); });
  check('UI: al firmar aparecen Liga y Marcas con la etiqueta «Nuevo»', await page.locator('#nav [data-v="liga"] em').isVisible() && await page.locator('#nav [data-v="marcas"]').isVisible());
  await page.tap('[data-act="vista"][data-v="empresa"]');
  await page.tap('[data-act="comprar"][data-id="1"]');
  const c1 = await page.evaluate(() => ({ d: __P2.S.p.dinero, c: __P2.S.negocios[0].caja }));
  check('UI: comprar la peluquería desde «Empresa»', c1.c === 3000 - 1250 && c1.d === 9000 - 4500 - 3000, JSON.stringify(c1));
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
  for (const v of ['semana', 'liga', 'empresa', 'marcas', 'hitos', 'ajustes']) { await page.tap(`[data-act="vista"][data-v="${v}"]`); const tx = await page.evaluate(() => document.getElementById('main').innerText); const m = tx.match(/.{0,40}(undefined|NaN|\[object).{0,20}/); if (m) malas.push(v + ': ' + m[0]); }
  check('UI: ninguna vista muestra undefined/NaN', !malas.length, malas.join(' | '));
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  check('UI: sin desplazamiento horizontal', ancho);
  // Partida de P1 en el navegador → «Seguir con tu jugador de P1»
  const ctx2 = await b.newContext({ ...pw.devices['iPhone 13'] }); const p2 = await ctx2.newPage();
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
  await page.tap('[data-act="vista"][data-v="ajustes"]');
  await page.tap('#informeTest summary');
  await page.tap('[data-act="resp"][data-q="p1"][data-v="7"]');
  await page.tap('[data-act="resp"][data-q="p8"][data-v="Sí"]');
  await page.fill('#r_p2', 'Al principio'); await page.dispatchEvent('#r_p2', 'change');
  await page.tap('[data-act="informe"]');
  const inf = await page.inputValue('#textoInforme');
  check('UI: «Informe de prueba» genera un texto copiable con ID, duración y respuestas', /TEST P2\.2/.test(inf) && /ID: TEST-[0-9A-F]{5}/.test(inf) && inf.includes('Duración real') && inf.includes('Al principio') && /\n   7\n/.test(inf) && inf.includes('Sí'));
  check('UI: el informe cuenta las pantallas visitadas', /Pantallas más visitadas: .*ajustes/.test(inf));
  check('UI: sin errores de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
  fin();
})();
function fin() {
  console.log('\nEstrategias deportivas (todas pueden comprar):'); for (const [k, p] of Object.entries(informe.deportivasPuedenComprar)) console.log(`  ${k}: contrato sem ${p.semanaContrato} · empresa sem ${p.semanaEmpresa} · capítulo ${p.capituloPct} % (sem ${p.semanaCapitulo}) · patrimonio sem 80 ${p.patrimonio80} · nivel ${p.nivel}`);
  console.log(`\n${ok} de ${total} comprobaciones superadas.`);
  process.exitCode = ok === total ? 0 : 1;
}
