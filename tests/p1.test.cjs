// Pruebas automáticas del prototipo P1 (simulador de vida, v0.6).
// Ejecución: node tests/p1.test.cjs   (necesita Playwright con Chromium instalado; tarda unos minutos)
// Opcional: SHOT_DIR=/carpeta para guardar capturas de pantalla.
// Nota: Chromium con emulación de móvil NO sustituye una prueba real en Safari / iPhone.
'use strict';
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium, devices } = pw;

const FILE = 'file://' + path.resolve(__dirname, '..', 'p1', 'carrera_p1.html');
const SHOTS = process.env.SHOT_DIR || null;
const results = [];
function check(name, ok, detail) { results.push({ name, ok }); console.log(`${ok ? 'OK   ' : 'FALLA'} ${name}${detail ? ' — ' + detail : ''}`); }

async function openPage(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => requests.push(r.url()));
  await page.goto(FILE);
  return { ctx, page, errors, requests };
}
const st = page => page.evaluate(() => JSON.parse(JSON.stringify(__P1.S)));
async function tap(page, sel) { await page.locator(sel).first().tap(); }
async function shot(page, name) { if (SHOTS) { await page.waitForTimeout(350); await page.screenshot({ path: path.join(SHOTS, name + '.png') }); } }

(async () => {
  const browser = await chromium.launch();
  const iphone = { ...devices['iPhone 13'] };
  delete iphone.defaultBrowserType;

  /* ---------- 1. Presentación, diario, barras y botón «+ Semana» ---------- */
  {
    const { ctx, page, errors, requests } = await openPage(browser, iphone);
    await shot(page, '00_intro');
    check('Primera vez: aparece «Empezar una nueva vida»', (await page.locator('#btnEmpezar').count()) === 1 && (await st(page)).intro === true);
    await page.locator('#nombre').fill('Leo');
    await tap(page, '[data-act=avatar][data-v="🧑🏾"]');
    await tap(page, '[data-act=posicion][data-v=medio]');
    await tap(page, '#btnEmpezar');
    const si = await st(page);
    check('Se guardan nombre, personaje y posición', !si.intro && si.nombre === 'Leo' && si.avatar === '🧑🏾' && si.posicion === 'medio' && (await page.locator('#top').textContent()).includes('Leo'));
    await page.evaluate(() => { __P1.nueva(7); __P1.CFG.club.probSuceso = 0; });
    await shot(page, '01_diario_inicio');
    check('Pantalla principal: diario, misión, 4 barras y botón «+ Semana»', (await page.locator('.entry').count()) === 1 && (await page.locator('#objetivo').count()) === 1 && (await page.locator('#dock .st').count()) === 4 && (await page.locator('#btnAvanzar').isEnabled()));
    const rep0 = (await st(page)).p.rep;
    await tap(page, '#btnAvanzar');
    const s1 = await st(page);
    check('«+ Semana» avanza y escribe la semana en el diario', s1.semana === 2 && s1.log.length === 1 && (await page.locator('.entry').count()) === 1 && (await page.locator('.entry .el').count()) >= 2);
    check('El plan por defecto (partido en la plaza) sube la reputación', s1.p.rep > rep0, `${rep0} → ${s1.p.rep}`);
    check('Cada semana explica sus reglas en «¿Por qué?»', (await page.locator('details.por .rl').count()) >= 2);
    await tap(page, '#btnAvanzar');
    check('El plan se repite sin volver a elegirlo', (await st(page)).semana === 3 && (await st(page)).log[1].lineas.some(([, t]) => t.includes('partido en la plaza')));
    // Hojas
    for (const [h, sel] of [['carrera', '.opt'], ['bienes', '#patrimonio'], ['relaciones', '[data-act=rel]'], ['actividades', '[data-act=actividad]'], ['logros', '.logro'], ['pantallas', '.nivel'], ['ajustes', '#btnReiniciar']]) {
      await tap(page, `[data-act=hoja][data-v=${h}]`);
      const ok = (await page.locator(`#hoja ${sel}`).count()) > 0;
      if (!ok) check(`Se abre la hoja «${h}»`, false);
      await shot(page, `02_hoja_${h}`);
      await tap(page, '#hoja [data-act=cerrar]');
    }
    check('Se abren y cierran Carrera, Bienes, Relaciones, Actividades, Logros, Pantallas y Partida', (await page.locator('#hoja .hh').count()) === 0);
    await tap(page, '[data-act=hoja][data-v=carrera]');
    await tap(page, '[data-act=elegir][data-id=entrenarSolo]');
    await tap(page, '#hoja [data-act=cerrar]');
    check('El plan se cambia desde Carrera y se ve en la barra inferior', (await st(page)).plan === 'entrenarSolo' && (await page.locator('#dock .plan').textContent()).includes('Entrenar'));
    const layout = await page.evaluate(() => ({ minH: Math.min(...[...document.querySelectorAll('.ab, .age')].map(b => b.getBoundingClientRect().height)) }));
    check('Botones principales de al menos 44 px', layout.minH >= 44, `mínimo ${Math.round(layout.minH)} px`);
    for (const w of [320, 375, 390]) {
      await page.setViewportSize({ width: w, height: 680 });
      for (const h of [null, 'carrera', 'bienes', 'relaciones', 'actividades', 'negocio:peluqueria']) {
        await page.evaluate(h => { __P1.S.hoja = h; __P1.render(); }, h);
        const over = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('hoja').scrollWidth) > window.innerWidth);
        if (over) check(`Sin desplazamiento horizontal a ${w} px (${h || 'diario'})`, false);
      }
    }
    check('Sin desplazamiento horizontal a 320, 375 y 390 px', true);
    const txt = await page.evaluate(() => document.body.innerText);
    check('Los importes se muestran en euros', txt.includes('€') && !/\d cr\b/.test(txt));
    check('Sin errores de JavaScript', errors.length === 0, errors.join(' | '));
    check('Sin peticiones externas', requests.every(u => u.startsWith('file:')), requests.filter(u => !u.startsWith('file:')).join(', '));
    await ctx.close();
  }

  /* ---------- 2. Una vida jugada con toques ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, iphone);
    await page.evaluate(() => __P1.nueva(11));
    const log = {}, vistos = {};
    let sucesoOk = 0, res = false;
    async function resolverConToques() {
      let s = await st(page);
      while (s.pendiente) {
        const t = s.pendiente.tipo;
        if (!vistos[t]) { await shot(page, `03_popup_${t}`); vistos[t] = 1; }
        log[t] = (log[t] || 0) + 1;
        if (t === 'ojeador') await tap(page, '#modal [data-v=corto]');
        else if (t === 'ofertas') {
          if (s.pendiente.ventana === 'inicio') log.ofertasInicio = s.pendiente.ofertas;
          await tap(page, (await page.locator('#modal [data-v=quedarse]').count()) ? '#modal [data-v=quedarse]' : '#modal [data-v="0"]');
        } else if (t === 'mejora') await tap(page, '#modal [data-v=aceptar]');
        else if (t === 'fin') { log.finInfo = log.finInfo || s.pendiente.zona || s.pendiente.pos; await tap(page, '#modal [data-v=ok]'); }
        else if (t === 'pantalla' || t === 'retiro') { log.pantallas = (log.pantallas || 0) + (t === 'pantalla' ? 1 : 0); await tap(page, '#modal [data-v=ok]'); }
        else {
          const antes = JSON.stringify([s.p, s.mods, s.agenda, s.rel, s.negocios]);
          await tap(page, '#modal [data-v="0"]');
          const d = await st(page);
          if (JSON.stringify([d.p, d.mods, d.agenda, d.rel, d.negocios]) !== antes || d.log[d.log.length - 1].lineas.some(([, x]) => x.includes('→'))) sucesoOk++;
        }
        s = await st(page);
      }
      return s;
    }
    for (let i = 0; i < 400; i++) {
      const s = await resolverConToques();
      if ((log.fin || 0) >= 2 && (log.mejora || s.semana > 70)) break;
      if (s.fase === 'barrio' && s.plan !== 'plaza' && s.p.energia >= 40) { await tap(page, '[data-act=hoja][data-v=carrera]'); await tap(page, '[data-act=elegir][data-id=plaza]'); await tap(page, '#hoja [data-act=cerrar]'); }
      if (s.fase === 'barrio' && s.p.energia < 40 && s.plan !== 'descansar') await page.evaluate(() => __P1.elegir('descansar'));
      if (s.fase === 'club' && s.plan !== 'extra' && !s.lesion && s.p.energia >= 45) await page.evaluate(() => __P1.elegir('extra'));
      if (s.fase === 'club' && s.p.energia < 45 && s.plan !== 'reposo') await page.evaluate(() => __P1.elegir('reposo'));
      await tap(page, '#btnAvanzar');
      const d = await st(page);
      if (d.log.length && d.log[d.log.length - 1].partido && !res) { res = (await page.locator('.entry .res').count()) > 0; await shot(page, '04_diario_partido'); }
    }
    const s = await st(page);
    const o = log.ofertasInicio || [];
    check('Ojeador, pruebas y dos ofertas españolas con condiciones distintas', !!log.ojeador && o.length === 2 && o[0].familia && !o[1].familia && o[1].salario > o[0].salario);
    check('El diario muestra cada partido con resultado y nota', res && s.log.some(e => e.partido && e.lineas.some(([, t]) => t.includes('nota'))));
    check('Llega la mejora de contrato en ventana emergente', !!log.mejora);
    check('Fin de temporada en ventana emergente; se juegan dos temporadas', log.fin >= 2 && s.trayectoria.length >= 2, `${log.fin} fin(es), ${JSON.stringify(log.finInfo)}`);
    check('Hay imprevistos y su opción tiene efecto', (log.suceso || 0) > 3 && sucesoOk > 0, `${log.suceso} imprevistos, ${sucesoOk} con efecto`);
    check('Un año más por temporada: 19 años al acabar la segunda', s.edad === 19, `${s.edad} años`);
    check('Se superan pantallas jugando (barrio, pruebas…) con su ventana', (log.pantallas || 0) >= 2 && s.pantalla >= 2, `pantalla actual ${s.pantalla + 1}`);

    // Bienes con toques (se da dinero para no jugar 100 semanas más en la prueba de interfaz)
    // y se coloca en la pantalla 8 para tener desbloqueados los negocios
    await page.evaluate(() => { __P1.S.p.dinero = 2000000; __P1.S.pantalla = 7; __P1.render(); });
    await tap(page, '[data-act=hoja][data-v=bienes]');
    await shot(page, '05_bienes');
    await tap(page, '[data-act=hoja][data-v="negocio:peluqueria"]');
    await tap(page, '#hoja [data-act=caja][data-v="6000"]');
    await tap(page, '#btnComprar');
    let d = await st(page);
    check('Comprar la peluquería: −(traspaso + caja) de tu dinero; la caja es la elegida', d.negocios.length === 1 && d.negocios[0].caja === 6000 && d.p.dinero === 2000000 - 36000);
    const emp0 = d.negocios[0].empleados;
    await tap(page, '#hoja [data-act=neg][data-c=empleados][data-v="1"]');
    await tap(page, '#hoja [data-act=neg][data-c=sueldo][data-v=bueno]');
    await tap(page, '#hoja [data-act=neg][data-c=precio][data-v=premium]');
    d = await st(page);
    check('Personal, sueldo y precio desde la interfaz (contratar sale de la caja)', d.negocios[0].empleados === emp0 + 1 && d.negocios[0].sueldo === 'bueno' && d.negocios[0].precio === 'premium' && d.negocios[0].caja === 5700);
    await shot(page, '06_negocio');
    await tap(page, '#hoja [data-act=cerrar]');
    check('Negocios bloqueados por pantalla: gimnasio abierto en la 8, hotel cerrado hasta la 9', await page.locator('#hoja [data-v="negocio:gimnasio"]').isEnabled() && !(await page.locator('#hoja [data-v="negocio:hotel"]').isEnabled()) && (await page.locator('#hoja').textContent()).includes('pantalla 9'));
    await page.evaluate(() => { __P1.S.pantalla = 8; __P1.render(); });
    const anuncio = d.anuncios[0], dinAntes = d.p.dinero, gastosCompra = Math.round(anuncio.precio * 0.10 / 100) * 100;
    await tap(page, `#hoja [data-act=comprarInm][data-id=${anuncio.id}][data-v=contado]`);
    d = await st(page);
    const inm = d.inmuebles[0];
    check('Comprar una propiedad al contado (+10 % de impuestos y notaría)', inm && inm.compra === anuncio.precio && !inm.hipoteca && d.p.dinero === dinAntes - anuncio.precio - gastosCompra);
    await tap(page, `#hoja [data-act=inm][data-id=${inm.id}][data-v=alquiler]`);
    await tap(page, '#hoja [data-act=comprarCoche][data-v=utilitario]');
    const local = d.clubLocal, vClub = await page.evaluate(id => __P1.valorClub(id), local);
    const antesClub = (await st(page)).p.dinero;
    await tap(page, `#hoja [data-act=comprarClub][data-id=${local}]`);
    d = await st(page);
    check('Comprar el club del barrio: −(valor + 10 % de caja)', d.clubes.length === 1 && d.clubes[0].clubId === local && d.p.dinero === antesClub - vClub - d.clubes[0].caja);
    await tap(page, `#hoja [data-act=hoja][data-v="club:${local}"]`);
    await tap(page, '#hoja [data-act=clubSet][data-c=inversion][data-v=alta]');
    await shot(page, '07_club_propio');
    await tap(page, '#hoja [data-act=cerrar]');
    await tap(page, '#hoja [data-act=cerrar]');
    await tap(page, '[data-act=hoja][data-v=relaciones]');
    await tap(page, '#hoja [data-act=rel][data-id=madre][data-v=tiempo]');
    await tap(page, '#hoja [data-act=cerrar]');
    await tap(page, '[data-act=hoja][data-v=actividades]');
    await tap(page, '#hoja [data-act=actividad][data-v=meditar]');
    await tap(page, '#hoja [data-act=cerrar]');
    d = await st(page);
    check('Relaciones y actividades se hacen con toques y se anotan en el diario', d.semanaAct.acts.includes('meditar') && d.rel.find(r => r.id === 'madre').semana === d.semana && d.semanaAct.lineas.length >= 2);
    const fuerza0 = await page.evaluate(id => __P1.club(id).fuerza, local);
    let separacion = true, alquiler = false;
    for (let k = 0; k < 6; k++) {
      const pre = await resolverConToques();
      await tap(page, '#btnAvanzar');
      const post = await st(page);
      if (post.p.dinero - pre.p.dinero !== post.ultimo.eco.reduce((a, [, v]) => a + v, 0)) separacion = false;
      const n0 = pre.negocios[0], n1 = post.negocios.find(n => n.tipo === n0.tipo);
      if (n1.caja - n0.caja !== n1.ultimo.resultado) separacion = false;
      if (post.ultimo.eco.some(([t]) => t.startsWith('Alquiler'))) alquiler = true;
    }
    check('Tu dinero, la caja de los negocios y la del club no se mezclan', separacion);
    check('La propiedad encuentra inquilino y cobra alquiler', alquiler);
    check('La inversión alta sube la fuerza del club comprado', (await page.evaluate(id => __P1.club(id).fuerza, local)) > fuerza0);
    d = await st(page);
    check('Logros: contrato, negocio, casa, coche y club', ['contrato', 'negocio', 'casa', 'coche', 'club'].every(k => d.logros[k]));
    await tap(page, '#objetivo');
    await shot(page, '09_pantallas');
    check('La barra de pantalla abre el mapa de las 10 pantallas', (await page.locator('#hoja .nivel').count()) === 10 && (await page.locator('#hoja .nivel.actual').count()) === 1);
    await tap(page, '#hoja [data-act=cerrar]');
    const pat = await page.evaluate(() => {
      const S = __P1.S; const v = n => Math.round(__P1.CFG.negocios[n.tipo].precio * (0.5 + n.fama / 100));
      const calc = S.p.dinero + S.negocios.reduce((a, n) => a + n.caja + v(n), 0) + S.inmuebles.reduce((a, i) => a + i.valor - (i.hipoteca ? Math.round(i.hipoteca.deuda) : 0), 0) + S.coches.reduce((a, k) => a + k.valor, 0) + S.clubes.reduce((a, o) => a + o.caja + __P1.valorClub(o.clubId), 0);
      return [calc, __P1.patrimonio()];
    });
    check('Patrimonio = dinero + negocios + casas + coches + clubes − hipotecas', pat[0] === pat[1]);
    await tap(page, '[data-act=hoja][data-v=bienes]');
    await shot(page, '08_bienes_lleno');
    await tap(page, '#hoja [data-act=cerrar]');
    await resolverConToques();
    const antes = await st(page);
    await page.reload();
    const despues = await st(page);
    check('La vida entera se guarda y se recupera al recargar', despues.semana === antes.semana && despues.p.dinero === antes.p.dinero && despues.log.length === antes.log.length && despues.clubes.length === 1 && despues.inmuebles.length === 1);
    await tap(page, '[data-act=hoja][data-v=ajustes]');
    await tap(page, '#btnReiniciar');
    check('Reiniciar pide confirmación', (await st(page)).semana === antes.semana);
    await tap(page, '#btnReiniciar');
    const r = await st(page);
    check('El segundo toque empieza una vida nueva', r.semana === 1 && r.intro && !r.negocios.length);
    check('Sin errores de JavaScript en la vida jugada', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 3. Reglas (sin interfaz) ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, { viewport: { width: 390, height: 800 } });
    const r = await page.evaluate(() => {
      const G = __P1, out = {};
      G.CFG.club.probSuceso = 0;
      const resolverTodo = () => { for (let g = 0; G.S.pendiente && g < 20; g++) { const e = G.S.pendiente; G.resolver(e.tipo === 'mejora' ? 'aceptar' : ['fin', 'pantalla', 'retiro'].includes(e.tipo) ? 'ok' : e.tipo === 'ofertas' ? (e.ventana === 'invierno' || G.S.contrato.temporadasRestantes > 0 ? 'quedarse' : '0') : '0'); } };
      const semana = a => { resolverTodo(); if (a) G.elegir(a); const ok = G.avanzarSemana(); return ok; };
      const cerrarPantallas = () => { while (G.S.pendiente && G.S.pendiente.tipo === 'pantalla') G.resolver('ok'); };
      function alClub(seed, idx) {
        G.nueva(seed);
        G.S.p.rep = 30; G.S.pendiente = { tipo: 'ojeador', clubId: G.S.mundo.ligas['es-4'][3] }; G.resolver('corto'); cerrarPantallas();
        for (let i = 0; i < 3; i++) { G.elegir('descansar'); G.avanzarSemana(); cerrarPantallas(); }
        G.resolver(String(idx)); cerrarPantallas();
      }
      // Mundo y calendario
      G.nueva(3);
      const M = G.S.mundo;
      out.mundo = Object.keys(G.CFG.paises).length === 6 && Object.keys(M.ligas).length === 21 && Object.values(M.ligas).every(l => l.length === 10);
      alClub(5, 0);
      const T = G.S.temporada, cuenta = {};
      for (const ronda of T.cal) for (const [h, a] of ronda) { const k = [h, a].sort().join('-'); cuenta[k] = (cuenta[k] || 0) + 1; }
      out.calendario = T.cal.length === 18 && Object.values(cuenta).every(v => v === 2) && Object.keys(cuenta).length === 45;
      out.primerClub = G.S.contrato.clubId === G.S.clubLocal && G.S.plan === 'normal';
      // Determinismo
      alClub(5, 1); for (let i = 0; i < 6; i++) semana('normal');
      const a1 = JSON.stringify([G.S.p, G.S.temporada.tabla]);
      alClub(5, 1); for (let i = 0; i < 6; i++) semana('normal');
      out.determinista = a1 === JSON.stringify([G.S.p, G.S.temporada.tabla]);
      // Ascenso con prima y subida de sueldo
      alClub(4, 0);
      const yo = G.S.contrato.clubId; G.club(yo).fuerza = 70; G.S.p.nivel = 70;
      let fin = null; const sal0 = G.S.contrato.salario;
      for (let i = 0; i < 18; i++) { G.S.p.energia = 90; semana('normal'); if (G.S.pendiente && G.S.pendiente.tipo === 'fin') fin = JSON.parse(JSON.stringify(G.S.pendiente)); resolverTodo(); }
      out.ascenso = fin && fin.zona === 'ascenso' && G.ligaDe(yo).key === 'es-4' && fin.primas.some(p => p.includes('Prima por ascenso')) && G.S.contrato.salario > sal0 && G.S.edad === 18;
      // Felicidad: cambia la nota
      const notas = [];
      for (const fel of [95, 5]) { alClub(8, 1); G.S.p.fel = fel; G.S.p.nivel = 62; G.S.p.energia = 80; G.elegir('normal'); G.avanzarSemana(); notas.push(G.S.ultimo.partido.notaBase); }
      out.felicidadNota = Math.abs((notas[0] - notas[1]) - 0.9) < 0.05;
      // Relaciones: bajan solas; una interacción por persona y semana
      alClub(6, 1); const m0 = G.S.rel.find(x => x.id === 'madre').v;
      semana('normal'); const m1 = G.S.rel.find(x => x.id === 'madre').v;
      const i1 = G.interactuar('madre', 'tiempo'), i2 = G.interactuar('madre', 'llamar');
      out.relaciones = m1 === m0 - 1 && i1 && !i2 && G.S.rel.find(x => x.id === 'madre').v === m1 + 8;
      // Actividades: máximo 2 y sin repetir
      const a = G.realizarActividad('meditar'), b = G.realizarActividad('meditar'), c = G.realizarActividad('redes'), d = G.realizarActividad('loteria');
      out.actividades = a && !b && c && !d;
      semana('normal'); out.actividadesReset = G.realizarActividad('meditar');
      // Pantallas: los negocios se desbloquean al avanzar de pantalla
      alClub(1, 1); G.S.p.dinero = 20000000; resolverTodo();
      G.S.pantalla = 3; const p4 = !G.comprarNegocio('peluqueria', 6000);
      G.S.pantalla = 4; const p5 = G.comprarNegocio('peluqueria', 6000) && !G.comprarNegocio('gimnasio', 60000);
      G.S.pantalla = 7; const p8 = G.comprarNegocio('gimnasio', 60000) && !G.comprarNegocio('hotel', 100000);
      out.desbloqueos = p4 && p5 && p8;
      G.S.pantalla = 9;
      Object.assign(G.S.negocios[0], { precio: 'premium', fama: 40, empleados: 2, sueldo: 'bueno' });
      semana('normal'); out.premiumBajaFama = G.S.negocios[0].fama === 38;
      // Realismo: todos los negocios ganan dinero con una gestión normal y tardan entre 1 y 10 años (52-520 semanas) en amortizarse
      out.realismo = Object.keys(G.CFG.negocios).map(k => { const b = G.beneficioTipico(k), sem = G.CFG.negocios[k].precio / b; return [k, b, Math.round(sem)]; });
      out.realista = out.realismo.every(([, b, sem]) => b > 0 && sem >= 52 && sem <= 520);
      // Inmuebles: vivir en tu casa rebaja los gastos (en España, fuera de casa de tu familia)
      const gv0 = G.gastosVida().v;
      const an = G.S.anuncios[0]; G.comprarInmueble(an.id, false); const im = G.S.inmuebles[0];
      G.modoInmueble(im.id, 'vivienda');
      out.vivienda = G.gastosVida().v === Math.round(gv0 * 0.4);
      const val0 = im.valor; for (let i = 0; i < 20; i++) semana('normal');
      out.revaloriza = G.S.inmuebles[0].valor !== val0;
      // Coches: pierden valor
      G.comprarCoche('deportivo'); const k0 = G.S.coches[0].valor; semana('normal');
      out.coche = G.S.coches[0].valor < k0 && G.S.ultimo.eco.some(([t]) => t.startsWith('Mantenimiento'));
      // Clubes: valor por fórmula, inversión sube la fuerza
      const cid = G.S.clubLocal, f0 = G.club(cid).fuerza;
      out.valorClub = G.valorClub(cid) === Math.round(250000 * Math.exp((f0 - 45) / 6) / 1000) * 1000;
      G.comprarClub(cid); G.cambiarClub(cid, 'inversion', 'alta'); semana('normal');
      out.inversion = G.club(cid).fuerza > f0 && G.S.ultimo.neg.some(([t]) => t.includes(G.club(cid).nombre));
      out.presidente = G.S.contrato.clubId !== cid || true;
      // Imprevistos: todos se pueden mostrar y resolver sin errores
      let errores = 0, total = 0;
      for (const [id, e] of Object.entries(G.SUCESOS)) {
        for (let k = 0; k < e.ops.length; k++) {
          alClub(20 + total, 1); resolverTodo(); G.S.pantalla = 9; G.S.p.dinero = 9000000; G.comprarNegocio('peluqueria', 6000);
          G.comprarInmueble(G.S.anuncios[0].id, false); G.modoInmueble(G.S.inmuebles[0].id, 'alquiler'); G.S.inmuebles[0].inquilino = true;
          G.S.inmuebles[0].hipoteca = { deuda: 50000, cuota: 400, restantes: 200, plazo: 20, interes: 0.035 };
          G.comprarCoche('utilitario'); G.comprarClub(G.S.clubLocal);
          G.S.rel.push({ id: 'h1', tipo: 'hijo', nombre: 'Leo', v: 70, semana: 0, edad: 8, privado: false });
          if (id === 'colgarBotas') G.S.edad = 33;
          if (id === 'mudarse' || id === 'aniversario' || id === 'discusion') G.S.rel.push({ id: 'pareja', tipo: 'pareja', nombre: 'Noa', v: 60, semana: 0 });
          if (id === 'mudarse') G.modoInmueble(G.S.inmuebles[0].id, 'vivienda');
          const data = e.prep ? e.prep(G.S) : id === 'nacimiento' ? { id: 'h1' } : id === 'cita' ? { nombre: 'Noa' } : {};
          try { G.S.pendiente = { tipo: 'suceso', id, data }; G.render(); if (!G.resolver(String(k))) errores++; } catch (err) { errores++; }
          total++;
        }
      }
      out.sucesos = { total, errores, distintos: Object.keys(G.SUCESOS).length };
      // Préstamo con devolución a las 4 semanas
      alClub(6, 1); G.S.p.dinero = 1000; const p0 = G.S.p.dinero;
      G.S.pendiente = { tipo: 'suceso', id: 'prestamo', data: {} }; G.resolver('0');
      const ag = G.S.agenda[0]; let devuelto = false;
      for (let i = 0; i < 5; i++) { semana('normal'); if (G.S.ultimo.eco.some(([t]) => t.includes('préstamo'))) devuelto = true; }
      out.prestamo = G.S.p.dinero !== p0 && ag.importe === 200 && devuelto === ag.devuelve && G.S.agenda.length === 0;
      // Representante: más sueldo en ofertas y comisión semanal
      alClub(9, 1); G.S.p.nivel = 55; G.S.p.rep = 40; const sinAg = G.generarOfertas(1)[0];
      alClub(9, 1); G.S.p.nivel = 55; G.S.p.rep = 40; G.S.rel.push({ id: 'agente', tipo: 'agente', nombre: 'Sam', v: 60, semana: 0 }); const conAg = G.generarOfertas(1)[0];
      semana('normal');
      out.agente = conAg.salario > sinAg.salario && G.S.ultimo.eco.some(([t]) => t.startsWith('Comisión'));
      // Lesiones, patrocinio y pedir más (reglas de antes)
      let lesBaja = 0, lesAlta = 0;
      for (let seed = 1; seed <= 25; seed++) {
        alClub(seed, 1); G.S.p.nivel = 80; G.S.p.energia = 15; G.elegir('patrocinio'); G.avanzarSemana(); if (G.S.lesion > 0) lesBaja++;
        alClub(seed, 1); G.S.p.nivel = 80; G.S.p.energia = 90; G.elegir('normal'); G.avanzarSemana(); if (G.S.lesion > 0) lesAlta++;
      }
      out.lesiones = { lesBaja, lesAlta };
      let okAlta = 0, okBaja = 0;
      for (let seed = 1; seed <= 25; seed++) for (const rep of [80, 10]) {
        alClub(seed, 1); G.S.p.rep = rep; G.S.pendiente = { tipo: 'mejora', oferta: { salario: 200, temporadas: 2 } }; G.resolver('pedir');
        if (G.S.contrato.salario === 240) { if (rep === 80) okAlta++; else okBaja++; }
      }
      out.pedir = { okAlta, okBaja };
      // Pantalla 1 → 2 al dejar el barrio: premio y ventana
      G.nueva(12); G.S.p.rep = 30; G.S.pendiente = { tipo: 'ojeador', clubId: G.S.mundo.ligas['es-4'][3] }; G.resolver('corto');
      out.pantalla1 = G.S.pantalla === 1 && G.S.pendiente && G.S.pendiente.tipo === 'pantalla' && G.S.pendiente.n === 0;
      // Hipoteca: el banco mira tus ingresos; la cuota baja la deuda cada semana
      alClub(14, 1); resolverTodo(); G.S.pantalla = 9;
      const caro = G.S.anuncios.slice().sort((x, y) => y.precio - x.precio)[0];
      G.S.ingresosHist = [200, 200, 200]; G.S.p.dinero = 2000000;
      const negada = !!G.bloqueoInmueble(caro, true);
      G.S.ingresosHist = [20000, 20000, 20000];
      const hc = G.condicionesHipoteca(caro), d0 = G.S.p.dinero;
      const okH = G.comprarInmueble(caro.id, true);
      const ih = G.S.inmuebles[0];
      const pagoInicial = d0 - G.S.p.dinero === hc.entrada + hc.gastos;
      const pat0 = G.patrimonio(); const deuda0 = ih.hipoteca.deuda;
      semana('normal');
      const bajaDeuda = G.S.inmuebles[0].hipoteca.deuda < deuda0 && G.S.ultimo.eco.some(([t, v]) => t.startsWith('Hipoteca') && v === -hc.cuota);
      const cuota0 = G.S.inmuebles[0].hipoteca.cuota; G.amortizarHipoteca(ih.id);
      out.hipoteca = { negada, okH, pagoInicial, bajaDeuda, amortiza: G.S.inmuebles[0].hipoteca.cuota < cuota0, cuotaFormula: hc.cuota === Math.round(hc.principal * (0.035 / 18) / (1 - Math.pow(1 + 0.035 / 18, -hc.semanas))) };
      // Hijos: embarazo, nacimiento, gastos y cumpleaños
      alClub(15, 1); resolverTodo(); G.S.pantalla = 9; G.S.edad = 24;
      G.S.rel.push({ id: 'pareja', tipo: 'pareja', nombre: 'Noa', v: 90, semana: 0 });
      const th = G.interactuar('pareja', 'tenerHijo');
      let nacio = false, gasto = false;
      for (let i = 0; i < 16; i++) { G.S.rel.find(r => r.id === 'pareja').v = 90; semana('normal'); if (G.S.pendiente && G.S.pendiente.id === 'nacimiento') nacio = true; if (G.S.ultimo.eco.some(([t]) => t.startsWith('Gastos de'))) gasto = true; resolverTodo(); }
      const hijo = G.S.rel.find(r => r.tipo === 'hijo');
      out.hijos = { th, nacio, gasto, hijo: !!hijo, edad0: hijo && hijo.edad, segundo: !!G.bloqueoHijo() === false };
      // Retirada voluntaria: sin sueldo, el mundo sigue y cumples años
      alClub(16, 1); resolverTodo(); G.S.edad = 29;
      const antes30 = !G.retirarseYa(); G.S.edad = 30;
      const ret = G.retirarseYa();
      const popupRetiro = G.S.pendiente && G.S.pendiente.tipo === 'retiro'; resolverTodo();
      const j0 = G.S.temporada.jornada, año0 = G.S.temporada.año;
      for (let i = 0; i < 18; i++) semana(null);
      out.retiro = { antes30, ret, popupRetiro, fase: G.S.fase, sinSueldo: !G.S.ultimo.eco.some(([t]) => t.startsWith('Salario')), mundo: G.S.temporada.año === año0 + 1 && G.S.temporada.jornada === j0, edad: G.S.edad, plan: G.S.plan };
      // Declive con la edad y retirada forzosa a los 40
      alClub(17, 1); resolverTodo(); G.S.edad = 34; G.S.p.nivel = 70; G.S.p.energia = 90; semana('normal');
      out.declive = G.S.ultimo.dep.some(([t]) => t.startsWith('Edad: −'));
      alClub(18, 1); resolverTodo(); G.S.edad = 39;
      for (let i = 0; i < 18 && G.S.fase === 'club'; i++) { G.S.p.energia = 90; semana('normal'); resolverTodo(); }
      out.forzosa = G.S.fase === 'retirado' && G.S.edad === 40;
      // Sin evento pendiente no hay bloqueo; con evento, no se avanza
      G.nueva(4); G.S.pendiente = { tipo: 'ojeador', clubId: 'c0' }; out.conEvento = !G.avanzarSemana();
      return out;
    });
    check('Mundo: 6 países y 21 divisiones de 10 clubes', r.mundo);
    check('Calendario de ida y vuelta (18 jornadas)', r.calendario);
    check('Primer club: el del barrio; el plan pasa a «semana normal»', r.primerClub);
    check('Mismas decisiones y semilla → mismos resultados', r.determinista);
    check('Ascenso: prima, subida de sueldo, nueva división y cumpleaños', r.ascenso);
    check('La felicidad cambia la nota (felicidad 95 frente a 5: +0,9)', r.felicidadNota);
    check('Relaciones: bajan 1 por semana; una interacción por persona y semana', r.relaciones);
    check('Actividades: máximo 2 por semana, sin repetir, y se reinician', r.actividades && r.actividadesReset);
    check('Los negocios se desbloquean por pantallas (peluquería en la 5, gimnasio en la 8, hotel en la 9)', r.desbloqueos);
    check('Negocios realistas: todos ganan dinero y se amortizan en 1–10 años', r.realista, r.realismo.map(([k, b, sem]) => `${k} ${b} €/sem (${sem} sem)`).join(', '));
    check('Pantalla 1 superada al dejar el barrio, con premio y ventana', r.pantalla1);
    check('Hipoteca: el banco la niega con pocos ingresos; entrada + gastos; la cuota baja la deuda; amortizar baja la cuota', Object.values(r.hipoteca).every(Boolean), JSON.stringify(r.hipoteca));
    check('Hijos: embarazo de 14 semanas, nacimiento, gastos semanales', r.hijos.th && r.hijos.nacio && r.hijos.gasto && r.hijos.hijo, JSON.stringify(r.hijos));
    check('Retirada: desde los 30, sin sueldo, el mundo sigue y cumples años', r.retiro.antes30 && r.retiro.ret && r.retiro.popupRetiro && r.retiro.fase === 'retirado' && r.retiro.sinSueldo && r.retiro.mundo && r.retiro.edad === 31, JSON.stringify(r.retiro));
    check('Con 34 años se pierde nivel cada semana; a los 40 la retirada es obligatoria', r.declive && r.forzosa);
    check('Negocio: premium con poca fama pierde fama', r.premiumBajaFama);
    check('Vivir en tu casa rebaja un 60 % los gastos de vida', r.vivienda);
    check('Las propiedades cambian de valor con el mercado', r.revaloriza);
    check('Los coches pierden valor y tienen mantenimiento', r.coche);
    check('Club: valor por fórmula; la inversión sube la fuerza y se explica', r.valorClub && r.inversion);
    check('Todos los imprevistos y todas sus opciones funcionan', r.sucesos.errores === 0, `${r.sucesos.distintos} imprevistos, ${r.sucesos.total} opciones`);
    check('Préstamo a un amigo: se devuelve (o no) a las 4 semanas', r.prestamo);
    check('Representante: mejores sueldos en las ofertas y comisión semanal', r.agente);
    check('Jugar agotado puede lesionar; descansado, no', r.lesiones.lesBaja > 3 && r.lesiones.lesAlta === 0, JSON.stringify(r.lesiones));
    check('Pedir más depende de la reputación', r.pedir.okAlta > r.pedir.okBaja, JSON.stringify(r.pedir));
    check('Con una decisión pendiente no se avanza', r.conEvento);
    check('Sin errores de JavaScript en las reglas', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 3b. Decisiones propias de cada negocio ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, iphone);
    const r = await page.evaluate(() => {
      const G = __P1, out = { faltan: [], mejoraOk: [], opcionOk: [], accionOk: [], errores: [] };
      G.CFG.club.probSuceso = 0;
      const ids = new Set();
      for (const [tipo, D] of Object.entries(G.DECISIONES)) {
        if (D.opciones.length < 2 || D.mejoras.length < 3 || D.acciones.length < 3) out.faltan.push(tipo);
        ids.add([...D.mejoras, ...D.acciones].map(x => x.id).sort().join());
      }
      out.todos = Object.keys(G.CFG.negocios).every(t => G.DECISIONES[t]);
      out.distintas = ids.size === Object.keys(G.DECISIONES).length;
      for (const tipo of Object.keys(G.DECISIONES)) {
        try {
          const D = G.DECISIONES[tipo];
          G.nueva(3); G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal; G.S.pantalla = 9; G.S.pendiente = null; G.S.cola = [];
          G.S.p.dinero = 5e6; G.comprarNegocio(tipo, G.CFG.negocios[tipo].cajaOpciones[2]);
          const n = () => G.S.negocios.find(x => x.tipo === tipo);
          n().caja = 2e6;
          // Mejora: cuesta caja, se aplica una sola vez y cambia demanda o capacidad
          const m = D.mejoras[0], caja0 = n().caja, ef0 = JSON.stringify(G.efectosNegocio(tipo)), cap0 = G.capacidadNegocio(tipo);
          const ok1 = G.comprarMejora(tipo, m.id), ok2 = G.comprarMejora(tipo, m.id);
          if (ok1 && !ok2 && n().caja === caja0 - m.coste && n().mejoras.includes(m.id) && (JSON.stringify(G.efectosNegocio(tipo)) !== ef0 || G.capacidadNegocio(tipo) !== cap0)) out.mejoraOk.push(tipo);
          // Opción: se guarda y cambia los efectos
          const o = D.opciones[0], otro = (o.def || 0) === 0 ? 1 : 0, efA = JSON.stringify(G.efectosNegocio(tipo));
          G.elegirOpcion(tipo, o.id, otro);
          if (n().opc[o.id] === otro && JSON.stringify(G.efectosNegocio(tipo)) !== efA) out.opcionOk.push(tipo);
          // Acción: se hace, queda en espera y, si dura, caduca
          const a = D.acciones.find(x => x.dur) || D.acciones[0];
          const hecha = G.accionNegocio(tipo, a.id), repetida = G.accionNegocio(tipo, a.id);
          let caduca = true;
          if (a.dur) { for (let i = 0; i < a.dur; i++) { G.elegir('rentas'); G.avanzarSemana(); while (G.S.pendiente) G.resolver(G.S.pendiente.tipo === 'suceso' ? '0' : 'ok'); } caduca = !(n().temp || []).some(t => t.id === a.id); }
          if (hecha && !repetida && caduca) out.accionOk.push(tipo);
          // Todo lo demás se puede elegir y se juegan 10 semanas sin errores
          D.mejoras.forEach(x => G.comprarMejora(tipo, x.id));
          D.opciones.forEach(x => x.valores.forEach((_, i) => G.elegirOpcion(tipo, x.id, i)));
          G.S.semana += 60; D.acciones.forEach(x => G.accionNegocio(tipo, x.id));
          for (let i = 0; i < 10; i++) { G.elegir('rentas'); G.avanzarSemana(); while (G.S.pendiente) G.resolver(G.S.pendiente.tipo === 'suceso' ? '0' : 'ok'); }
          if (!isFinite(n().caja) || !isFinite(n().fama)) out.errores.push(tipo + ': NaN');
        } catch (e) { out.errores.push(tipo + ': ' + e.message); }
      }
      return out;
    });
    const N = 9;
    check('Cada negocio tiene sus propias decisiones (≥2 opciones, ≥3 mejoras, ≥3 acciones)', r.todos && r.distintas && r.faltan.length === 0, r.faltan.join());
    check('Mejoras: se pagan con la caja, una sola vez, y cambian demanda o capacidad', r.mejoraOk.length === N, r.mejoraOk.join());
    check('Opciones de gestión: se guardan y cambian los resultados', r.opcionOk.length === N, r.opcionOk.join());
    check('Acciones: tienen espera y sus efectos temporales caducan', r.accionOk.length === N, r.accionOk.join());
    check('Todas las mejoras, opciones y acciones funcionan sin errores', r.errores.length === 0, r.errores.join(' | '));
    // Con toques en la ficha del negocio
    await page.evaluate(() => { const G = __P1; G.nueva(5); G.S.intro = false; G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal; G.S.pantalla = 9; G.S.pendiente = null; G.S.cola = [];
      G.S.p.dinero = 100000; G.comprarNegocio('peluqueria', 10000); G.S.hoja = 'negocio:peluqueria'; G.render(); });
    await shot(page, '30_decisiones');
    const caja0 = (await st(page)).negocios[0].caja;
    await page.locator('[data-act="mejora"]:not([disabled])').first().tap();
    await page.locator('[data-act="opcion"]').last().tap();
    await page.locator('[data-act="accionNeg"]:not([disabled])').first().tap();
    const d = await st(page), n = d.negocios[0];
    check('Con toques: comprar mejora, cambiar opción y hacer acción', n.mejoras.length === 1 && n.caja < caja0 && Object.keys(n.opc).length === 1 && Object.keys(n.cd).length === 1, JSON.stringify({ m: n.mejoras, opc: n.opc, cd: n.cd }));
    check('Sin errores de JavaScript en las decisiones de negocio', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 4. Vidas completas y equilibrio ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, { viewport: { width: 390, height: 800 } });
    const sim = await page.evaluate(() => {
      const G = __P1;
      G.silencio = true; // sin dibujar ni guardar, para ir rápido
      function play(seed, st) {
        G.nueva(seed, st.pos); const S = () => G.S; const L = { cien: null, millon: null };
        for (let w = 0; w < 1200 && S().semana <= 300; w++) {
          const ev = S().pendiente;
          if (ev) {
            if (ev.tipo === 'ojeador') G.resolver('corto');
            else if (ev.tipo === 'ofertas') { let best = 0, bv = -1e9; ev.ofertas.forEach((o, i) => { const v = st.valor(o, G.ligaDe(o.clubId).tier); if (v > bv) { bv = v; best = i; } }); G.resolver(String(best)); }
            else if (ev.tipo === 'mejora') G.resolver(st.mejora);
            else G.resolver(['fin', 'pantalla', 'retiro'].includes(ev.tipo) ? 'ok' : '0');
            continue;
          }
          const s = S();
          if (!L.cien && G.patrimonio() >= 100000) L.cien = s.semana;
          if (!L.millon && G.patrimonio() >= 1000000) L.millon = s.semana;
          if (s.fase === 'club') st.invertir(G, s);
          let a;
          if (s.fase === 'barrio') a = s.p.energia < 40 ? 'descansar' : 'plaza';
          else if (s.fase === 'prep') a = s.prep.semanasRestantes === 1 && s.p.energia < 70 ? 'descansar' : s.p.energia < 35 ? 'descansar' : s.p.dinero >= 90 ? 'entrenador' : s.p.energia > 60 ? 'entrenarSolo' : 'trabajar';
          else a = st.pick(s);
          G.elegir(a);
          if (s.fase === 'club' && s.p.fel < 50) G.realizarActividad('meditar');
          if (!G.avanzarSemana() && !S().pendiente) break;
        }
        const s = S();
        return { cien: L.cien, millon: L.millon, nivel: s.p.nivel, fama: s.negocios.length ? Math.max(...s.negocios.map(n => n.fama)) : 0, fel: s.p.fel };
      }
      const neto = o => o.salario * 0.8 - o.vida;
      const strats = {
        crecer: { pos: 'delantero', mejora: 'pedir', valor: (o, t) => -t * 1000 + neto(o), pick: s => s.lesion ? 'reposo' : s.p.energia < 40 ? (s.p.dinero >= 60 ? 'fisio' : 'reposo') : 'extra',
          invertir(G, s) { if (!s.negocios.length && s.p.dinero > 37000) G.comprarNegocio('peluqueria', 6000); } },
        rentista: { pos: 'medio', mejora: 'largo', valor: o => neto(o) + o.fichaje / 20, pick: s => s.lesion ? 'reposo' : s.semana % 3 === 0 ? 'patrocinio' : s.p.energia < 45 ? 'reposo' : 'normal',
          invertir(G, s) { if (!s.negocios.length && s.p.dinero > 34000) G.comprarNegocio('peluqueria', 3000);
            const a = s.anuncios.slice().sort((x, y) => x.precio - y.precio)[0];
            if (s.negocios.length && a && (!G.bloqueoInmueble(a, false) || !G.bloqueoInmueble(a, true))) { G.comprarInmueble(a.id, !!G.bloqueoInmueble(a, false)); const i = G.S.inmuebles[G.S.inmuebles.length - 1]; G.modoInmueble(i.id, G.S.inmuebles.length === 1 ? 'vivienda' : 'alquiler'); } } },
        empresario: { pos: 'defensa', mejora: 'aceptar', valor: (o, t) => -t * 300 + neto(o) + (o.familia ? 200 : 0), pick: s => s.lesion ? 'reposo' : s.p.energia < 45 ? 'reposo' : 'normal',
          invertir(G, s) {
            for (const [k, T] of Object.entries(G.CFG.negocios)) if (!s.negocios.find(n => n.tipo === k) && s.p.dinero > T.precio + T.cajaOpciones[1] + 2000) { if (G.comprarNegocio(k, T.cajaOpciones[1])) { G.cambiarNegocio(k, 'sueldo', 'bueno'); G.cambiarNegocio(k, 'empleados', 1); } }
            for (const n of s.negocios) { if (n.caja < 0 && s.p.dinero > 1000) G.traspasar(n.tipo, 'aCaja'); }
            if (s.negocios.length && !G.bloqueoActividad(s, 'visitarNegocios')) G.realizarActividad('visitarNegocios');
          } },
      };
      const out = {};
      for (const [k, st] of Object.entries(strats)) {
        const runs = [1, 2, 3].map(seed => play(seed, st));
        const m = f => Math.round(runs.reduce((a, r) => a + f(r), 0) / runs.length * 10) / 10;
        out[k] = { cien: m(r => r.cien || 999), millon: m(r => r.millon || 999), nivel: m(r => r.nivel), fama: m(r => r.fama), fel: m(r => r.fel), todas: runs.every(r => r.cien) };
      }
      return out;
    });
    console.log('      Equilibrio (media de 3 vidas):', JSON.stringify(sim));
    const best = m => Object.entries(sim).sort((a, b) => (m === 'cien' ? a[1][m] - b[1][m] : b[1][m] - a[1][m]))[0][0];
    check('Todas las estrategias llegan a 100.000 € antes de 300 semanas', Object.values(sim).every(x => x.todas));
    check('Ninguna estrategia gana en todo (100.000 € antes / más nivel / más fama del negocio)',
      new Set([best('cien'), best('nivel'), best('fama')]).size > 1, `100k: ${best('cien')}, nivel: ${best('nivel')}, fama: ${best('fama')}`);
    check('Sin errores de JavaScript en las vidas simuladas', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 5. Código: sin anuncios, compras, cuentas ni servicios externos ---------- */
  {
    const src = require('fs').readFileSync(path.resolve(__dirname, '..', 'p1', 'carrera_p1.html'), 'utf8');
    const bad = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'https://', 'http://', '<iframe', 'sendBeacon', 'import('].filter(t => src.includes(t));
    check('El código no contiene conexiones externas', bad.length === 0, bad.join(', '));
  }

  await browser.close();
  const fails = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - fails} de ${results.length} comprobaciones superadas.`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
