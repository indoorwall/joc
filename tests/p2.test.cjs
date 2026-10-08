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
  for (const pol of ['equilibrada', 'todoFutbol', 'deportePrimero', 'dineroPrimero']) for (let i = 0; i < 40; i++) { const l = P2.jugarPartida(pol, 500 + i, 20); if (l.via) caminos.add(l.via); }
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
  const ids = P2.LIGAS.tercera.equipos.map(e => e.id); const veces = {}; for (const j of s.temporada.calendario) for (const [a, b] of j) { veces[a + b] = (veces[a + b] || 0) + 1; }
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
  const s = enClub('atleticoFilial', 30); s.p.rep = 60; s.stats.titular = 10;
  P2.firmarMarca(s, 'panaderia', null); P2.firmarMarca(s, 'kinetic', null);
  check('Máximo 2 patrocinadores a la vez', !P2.firmarMarca(s, 'talleres', null) && s.patros.length === 2);
  check('Firmar un patrocinador da el hito', !!s.hitos.patro);
  let actos = 0;
  for (let w = 0; w < 10; w++) { if (s.pendiente && s.pendiente.tipo === 'acto') { actos++; P2.resolverDecision(s, 'ir'); continue; } resolverTodo(s, ['fresco', 'no']); P2.jugarSemana(s, 'descansar'); }
  check('Los actos salen del contrato con fecha (no se pueden repetir a voluntad)', actos >= 2 && actos <= 5 && !P2.ACCIONES.acto, `actos ${actos}`);
  const s2 = enClub('atleticoFilial', 31); s2.p.rep = 60; P2.firmarMarca(s2, 'panaderia', null);
  let rotos = 0; for (let w = 0; w < 14; w++) { if (s2.pendiente && s2.pendiente.tipo === 'acto') { P2.resolverDecision(s2, 'no'); continue; } resolverTodo(s2, ['fresco', 'no']); P2.jugarSemana(s2, 'descansar'); }
  check('Faltar dos veces rompe el contrato', s2.patros.length === 0 && s2.patroHist.some(h => h.roto));
}

// ---------- 6. Empresa ----------
{
  const s = enClub('puerto', 40); s.p.dinero = 20000; s.hitos.patro = 1;
  const n = P2.comprarNegocio(s, 'peluqueria', 0, null);
  check('Comprar la peluquería: traspaso + caja inicial, dinero y caja separados', n && s.p.dinero === 20000 - 4500 - 600 && n.caja === 600);
  const din = s.p.dinero;
  Object.assign(n, { precio: 'caro', sueldo: 'alto', empleados: 4, marketing: 'fuerte' });
  let crisis = false;
  for (let w = 0; w < 6; w++) { if (s.pendiente) { if (s.pendiente.tipo === 'crisis') { crisis = true; break; } resolverTodo(s, ['fresco', 'no', 'ya']); continue; } P2.jugarSemana(s, 'descansar'); }
  check('Una empresa mal gestionada pierde dinero', n.hist.slice(-3).some(b => b < 0));
  check('Con pérdidas y poca caja llega una crisis con varias salidas', crisis && P2.vistaPendiente(s).ops.length >= 4);
  check('La caja de la empresa no toca tu dinero personal', s.p.dinero >= din - 1000);
  P2.resolverDecision(s, 'prestamo');
  check('Pedir financiación en la crisis: caja +3.000 y deuda', n.deuda > 0 && n.caja > 0);
  Object.assign(n, { precio: 'normal', sueldo: 'normal', empleados: 2, marketing: 'nada' });
  for (let w = 0; w < 8; w++) { resolverTodo(s, ['fresco', 'no', 'ya', 'subir', 'gratis', 'temporal', 'igualar', 'aceptar']); P2.jugarSemana(s, 'descansar'); }
  check('La empresa se puede recuperar', n.hist.slice(-3).every(b => b > 0) && n.rachaPos >= 3, JSON.stringify(n.hist.slice(-4)));
  const v1 = P2.valorNegocio(n); n.hist = n.hist.map(x => x + 200); const v2 = P2.valorNegocio(n);
  check('El valor depende del beneficio medio (más beneficio → vale más; la deuda resta)', v2 > v1 && P2.valorNegocio(Object.assign({}, n, { deuda: 5000 })) < v2);
  check('Mover dinero entre tu cuenta y la caja es explícito', P2.aportar(s, n.id, 100) && P2.retirar(s, n.id, 100) && !P2.retirar(s, n.id, 99999999));
  const pelu = P2.analisisPeluqueria();
  check('La peluquería no tiene una configuración óptima para todos los contextos', pelu.distintas >= 3, JSON.stringify(pelu));
  check('Sin contrato profesional no se puede comprar empresa', P2.bloqueoCompra(P2.nuevaPartida({ seed: 1 }), 'peluqueria', 0) !== null);
}

// ---------- 7. Simulación de balance ----------
let informe;
{
  const t0 = Date.now(); informe = P2.runBalance(150); const ms = Date.now() - t0;
  for (const c of informe.comprobaciones) check(`Balance: ${c.t}`, c.ok);
  check('Balance: 1.200 partidas en menos de 30 s', ms < 30000, `${ms} ms`);
  const e = informe.politicas.equilibrada;
  check('Una partida equilibrada completa el capítulo en 25–60 semanas', e.capituloPct >= 70 && e.semanaCapitulo >= 25 && e.semanaCapitulo <= 60, JSON.stringify(e));
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
  await page.fill('#nombre', 'Vega'); await page.tap('[data-act="empezar"]');
  const box = await page.locator('.dec .opt').first().boundingBox(), vh = page.viewportSize().height;
  check('UI: la primera decisión se ve sin desplazarse en un iPhone 13', box && box.y + box.height < vh - 60, JSON.stringify(box));
  const orden = await page.evaluate(() => { const m = document.getElementById('main'); const a = m.querySelector('.sit'), d = m.querySelector('.dec'); return a && d && (a.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; });
  check('UI: orden situación → decisión → consecuencia', orden);
  await page.tap('[data-act="accion"][data-id="entrenar"]');
  check('UI: tras la semana se ve la consecuencia con «¿Por qué?»', await page.locator('details.por summary').first().isVisible() && (await page.textContent('#main')).includes('Entrenas duro'));
  const antes = await page.evaluate(() => ({ d: __P2.S.p.dinero, s: __P2.S.semana, n: __P2.S.p.nivel }));
  await page.reload();
  const despues = await page.evaluate(() => ({ d: __P2.S.p.dinero, s: __P2.S.semana, n: __P2.S.p.nivel }));
  check('UI: recargar no duplica nada (dinero, semana y nivel iguales)', JSON.stringify(antes) === JSON.stringify(despues), JSON.stringify([antes, despues]));
  // Club, empresa y recarga
  await page.evaluate(() => { const S = __P2.S; S.p.nivel = 58; __P2.P2.firmar(S, 'puerto', null); S.p.dinero = 9000; S.hitos.patro = 3; __P2.render(); });
  await page.tap('[data-act="vista"][data-v="empresa"]');
  await page.tap('[data-act="comprar"][data-id="1"]');
  const c1 = await page.evaluate(() => ({ d: __P2.S.p.dinero, c: __P2.S.negocios[0].caja }));
  check('UI: comprar la peluquería desde «Empresa»', c1.c === 2000 && c1.d === 9000 - 4500 - 2000);
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
  check('UI: sin errores de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
  fin();
})();
function fin() {
  console.log('\nPolíticas:'); for (const p of Object.values(informe.politicas)) console.log(`  ${p.politica}: contrato ${p.contratoPct} % (sem ${p.semanaContrato}) · empresa ${p.empresaPct} % (sem ${p.semanaEmpresa}) · capítulo ${p.capituloPct} % (sem ${p.semanaCapitulo}) · patrimonio ${p.patrimonio} · nivel ${p.nivel}`);
  console.log(`\n${ok} de ${total} comprobaciones superadas.`);
  process.exitCode = ok === total ? 0 : 1;
}
