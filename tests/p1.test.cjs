// Pruebas automáticas del prototipo P1 (simulador de vida, v0.7).
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
  // Como un jugador: si no puede pagar la primera opción de un imprevisto, elige otra
  await page.evaluate(() => { const r = __P1.resolver; __P1.resolver = op => r(op) || (op === '0' && __P1.S.pendiente && __P1.S.pendiente.tipo === 'suceso' ? r('1') || r('2') || r('3') : false); });
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
    await tap(page, '[data-act=lookIntro][data-c=piel][data-v="3"]');
    await tap(page, '[data-act=lookIntro][data-c=pelo][data-v=rizos]');
    await tap(page, '[data-act=posicion][data-v=medio]');
    await tap(page, '#btnEmpezar');
    const si = await st(page);
    check('Se guardan nombre, personaje y posición', !si.intro && si.nombre === 'Leo' && si.look.piel === '3' && si.look.pelo === 'rizos' && si.posicion === 'medio' && (await page.locator('#top').textContent()).includes('Leo'));
    await page.evaluate(() => { __P1.nueva(7); __P1.CFG.club.probSuceso = 0; });
    await shot(page, '01_diario_inicio');
    check('Pantalla principal: agenda (mañana, tarde, noche), lo que viene, indicadores, parte y «Cerrar la semana»', (await page.locator('.entry').count()) === 1 && (await page.locator('#objetivo').count()) === 1 && (await page.locator('#agenda .slot').count()) >= 3 && (await page.locator('.gauge').count()) >= 4 && (await page.locator('.prox li').count()) >= 1 && (await page.locator('#btnAvanzar').isEnabled()));
    const rep0 = (await st(page)).p.rep;
    await tap(page, '#btnAvanzar');
    const s1 = await st(page);
    check('«Cerrar la semana» avanza y escribe el parte semanal', s1.semana === 2 && s1.log.length === 1 && (await page.locator('.entry').count()) === 1 && (await page.locator('.entry .el').count()) >= 2);
    check('El plan por defecto (partido en la plaza) sube la reputación', s1.p.rep > rep0, `${rep0} → ${s1.p.rep}`);
    check('Cada semana explica sus reglas en «¿Por qué?»', (await page.locator('details.por .rl').count()) >= 2);
    await tap(page, '#btnAvanzar');
    check('El plan se repite sin volver a elegirlo', (await st(page)).semana === 3 && (await st(page)).log[1].lineas.some(([, t]) => t.includes('partido en la plaza')));
    // Hojas
    for (const [h, sel] of [['carrera', '.opt'], ['bienes', '#patrimonio'], ['relaciones', '[data-act=rel]'], ['actividades', '[data-act=actividad]'], ['logros', '.logro'], ['pantallas', '.nivel'], ['ajustes', '#btnReiniciar']]) {
      if (h === 'actividades') await tap(page, '[data-act=hoja][data-v=relaciones]');
      await tap(page, h === 'actividades' ? '#hoja [data-act=hoja][data-v=actividades]' : `[data-act=hoja][data-v=${h}]`);
      const ok = (await page.locator(`#hoja ${sel}`).count()) > 0;
      if (!ok) check(`Se abre la hoja «${h}»`, false);
      await shot(page, `02_hoja_${h}`);
      await tap(page, '#hoja [data-act=cerrar]');
    }
    check('Se abren y cierran Carrera, Bienes, Relaciones, Actividades, Logros, Pantallas y Partida', (await page.locator('#hoja .hh').count()) === 0);
    await tap(page, '[data-act=hoja][data-v=carrera]');
    await tap(page, '[data-act=elegir][data-id=entrenarSolo]');
    await tap(page, '#hoja [data-act=cerrar]');
    check('El plan se cambia desde Carrera y se ve en la agenda', (await st(page)).plan === 'entrenarSolo' && (await page.locator('#agenda .slot').first().textContent()).includes('Entrenar'));
    const layout = await page.evaluate(() => ({ minH: Math.min(...[...document.querySelectorAll('.ab, .cerrar, #agenda .slot')].map(b => b.getBoundingClientRect().height)) }));
    await tap(page, '[data-act=hoja][data-v="slot:tarde"]');
    await tap(page, '#hoja [data-act=slotSet][data-v="act:meditar"]');
    const felA = (await st(page)).p.fel, semA = (await st(page)).semana;
    await tap(page, '#btnAvanzar');
    for (let g = 0; g < 6 && (await st(page)).pendiente; g++) await page.evaluate(() => __P1.resolver('0') || __P1.resolver('ok') || __P1.resolver('si') || __P1.resolver('corto'));
    const dA = await st(page), ultimo = dA.log[dA.log.length - 1];
    check('Agenda: la tarde se programa con toques y se hace al cerrar la semana (y se repite)', dA.agendaSlots.tarde === 'act:meditar' && ultimo.lineas.some(([, t]) => /Meditar/.test(t)) && ultimo.lineas.some(([, t]) => /Noche libre/.test(t)) && dA.semana === semA + 1);
    check('Botones principales de al menos 44 px', layout.minH >= 44, `mínimo ${Math.round(layout.minH)} px`);
    for (const w of [320, 375, 390]) {
      await page.setViewportSize({ width: w, height: 680 });
      for (const h of [null, 'carrera', 'bienes', 'relaciones', 'actividades', 'negocio:peluqueria']) {
        await page.evaluate(h => { __P1.S.hoja = h; __P1.render(); }, h);
        const over = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('hoja').scrollWidth) > document.documentElement.clientWidth);
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
        else if (t === 'eventoPatro') await tap(page, '#modal [data-v=si]');
        else if (t === 'pantalla' || t === 'retiro') { log.pantallas = (log.pantallas || 0) + (t === 'pantalla' ? 1 : 0); await tap(page, '#modal [data-v=ok]'); }
        else {
          const antes = JSON.stringify([s.p, s.mods, s.agenda, s.rel, s.negocios]);
          await tap(page, '#modal .po:not([disabled])');
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
    await tap(page, '[data-act=hoja][data-v=relaciones]');
    await tap(page, '#hoja [data-act=hoja][data-v=actividades]');
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
    await resolverConToques();
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
    await page.evaluate(() => { const r = __P1.resolver; __P1.resolver = op => r(op) || (op === '0' && __P1.S.pendiente && __P1.S.pendiente.tipo === 'suceso' ? r('1') || r('2') || r('3') : false); });
    const despues = await st(page);
    check('La vida entera se guarda y se recupera al recargar', despues.semana === antes.semana && despues.p.dinero === antes.p.dinero && despues.log.length === antes.log.length && despues.clubes.length === antes.clubes.length && despues.inmuebles.length === antes.inmuebles.length, JSON.stringify([antes.semana, despues.semana, antes.p.dinero, despues.p.dinero, antes.log.length, despues.log.length, despues.clubes.length, despues.inmuebles.length]));
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
      const resolverTodo = () => { for (let g = 0; G.S.pendiente && g < 20; g++) { const e = G.S.pendiente; G.resolver(e.tipo === 'eventoPatro' ? 'si' : e.tipo === 'mejora' ? 'aceptar' : ['fin', 'pantalla', 'retiro'].includes(e.tipo) ? 'ok' : e.tipo === 'ofertas' ? (e.ventana === 'invierno' || G.S.contrato.temporadasRestantes > 0 ? 'quedarse' : '0') : '0'); } };
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
      semana('normal'); resolverTodo(); const m1 = G.S.rel.find(x => x.id === 'madre').v;
      const i1 = G.interactuar('madre', 'tiempo'), i2 = G.interactuar('madre', 'llamar');
      out.relaciones = m1 === m0 - 1 && i1 && !i2 && G.S.rel.find(x => x.id === 'madre').v === m1 + 8;
      // Actividades: máximo 2 y sin repetir
      const a = G.realizarActividad('meditar'), b = G.realizarActividad('meditar'), c = G.realizarActividad('redes'), d = G.realizarActividad('loteria');
      out.actividades = a && !b && c && !d;
      semana('normal'); resolverTodo(); out.actividadesReset = G.realizarActividad('meditar');
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
        if (e.dep === 'escalada') continue; // se prueban en la sección de escalada
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
      for (let i = 0; i < 16; i++) { G.S.rel.find(r => r.id === 'pareja').v = 90; semana('normal'); if ([G.S.pendiente].concat(G.S.cola).some(e => e && e.id === 'nacimiento')) nacio = true; if (G.S.ultimo.eco.some(([t]) => t.startsWith('Gastos de'))) gasto = true; resolverTodo(); }
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
      out.n = Object.keys(G.CFG.negocios).length;
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
          if (a.dur) { for (let i = 0; i < a.dur; i++) { G.elegir('rentas'); G.avanzarSemana(); while (G.S.pendiente) G.resolver(G.S.pendiente.tipo === 'suceso' ? '0' : G.S.pendiente.tipo === 'eventoPatro' ? 'si' : 'ok'); } caduca = !(n().temp || []).some(t => t.id === a.id); }
          if (hecha && !repetida && caduca) out.accionOk.push(tipo);
          // Todo lo demás se puede elegir y se juegan 10 semanas sin errores
          D.mejoras.forEach(x => G.comprarMejora(tipo, x.id));
          D.opciones.forEach(x => x.valores.forEach((_, i) => G.elegirOpcion(tipo, x.id, i)));
          G.S.semana += 60; D.acciones.forEach(x => G.accionNegocio(tipo, x.id));
          for (let i = 0; i < 10; i++) { G.elegir('rentas'); G.avanzarSemana(); while (G.S.pendiente) G.resolver(G.S.pendiente.tipo === 'suceso' ? '0' : G.S.pendiente.tipo === 'eventoPatro' ? 'si' : 'ok'); }
          if (!isFinite(n().caja) || !isFinite(n().fama)) out.errores.push(tipo + ': NaN');
        } catch (e) { out.errores.push(tipo + ': ' + e.message); }
      }
      return out;
    });
    const N = r.n;
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
    // Modo pruebas (en ⚙️ Partida)
    await page.evaluate(() => { __P1.S.hoja = 'ajustes'; __P1.render(); });
    const d0 = await st(page);
    await page.locator('[data-act="prueba"][data-v="dinero:100000"]').tap();
    await page.locator('[data-act="prueba"][data-v="caja"]').tap();
    await page.locator('[data-act="prueba"][data-v="todo"]').tap();
    const d1 = await st(page);
    await page.evaluate(() => { __P1.S.hoja = 'ajustes'; __P1.render(); });
    await page.locator('[data-act="prueba"][data-v="semanas:5"]').tap();
    const d2 = await st(page);
    check('Modo pruebas: dinero, caja, desbloquear todo y avanzar varias semanas', d1.p.dinero === d0.p.dinero + 100000 && d1.negocios[0].caja === d0.negocios[0].caja + 50000 && d1.pantalla === 9 && (d2.semana > d1.semana || !!d2.pendiente), `semana ${d1.semana}→${d2.semana}`);
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
            else G.resolver(ev.tipo === 'eventoPatro' ? 'si' : ['fin', 'pantalla', 'retiro'].includes(ev.tipo) ? 'ok' : '0');
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

  /* ---------- 6. Escalada ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, iphone);
    // Empezar una vida de escalada con toques
    await page.evaluate(() => { localStorage.clear(); __P1.reiniciar(11); });
    await page.locator('#nombre').fill('Ada');
    await tap(page, '[data-act=deporte][data-v=escalada]');
    check('Escalada: la presentación deja elegir deporte y punto fuerte', (await page.locator('[data-act=fuerte]').count()) === 3 && (await page.locator('[data-act=posicion]').count()) === 0);
    await tap(page, '[data-act=fuerte][data-v=dificultad]');
    await tap(page, '#btnEmpezar');
    let d = await st(page);
    check('Escalada: empiezas con 14 años en el rocódromo, con 5 cualidades', d.deporte === 'escalada' && d.fase === 'rocodromo' && d.edad === 14 && Object.keys(d.esc.at).length === 5 && d.esc.at.resistencia > d.esc.at.cabeza);
    check('Escalada: la cabecera, el diario y la barra lo dicen', (await page.locator('#top').textContent()).includes('rocódromo') && (await page.locator('#main').textContent()).includes('escalo') && (await page.locator('#dock').textContent()).includes('🧗'));
    await tap(page, '[data-act=hoja][data-v=carrera]');
    await shot(page, '40_escalada_carrera');
    check('Escalada: la hoja Carrera muestra cualidades y plan del rocódromo', (await page.locator('#hoja [data-act=elegir][data-id=amigos]').count()) === 1 && (await page.locator('#hoja [data-act=elegir][data-id=tabla]').count()) === 0);
    await tap(page, '#hoja [data-act=elegir][data-id=amigos]');
    await tap(page, '#hoja [data-act=cerrar]');
    for (let i = 0; i < 12 && !(await st(page)).pendiente; i++) await tap(page, '#btnAvanzar');
    // Puede salir antes un imprevisto: se resuelven hasta llegar a la oferta de equipo
    for (let g = 0; g < 30; g++) {
      d = await st(page);
      if (d.pendiente && d.pendiente.tipo === 'equipoEsc') break;
      if (d.pendiente) await page.locator('#modal [data-act=resolver]:not([disabled])').first().tap();
      else await tap(page, '#btnAvanzar');
    }
    d = await st(page);
    check('Escalada: con reputación 15 el entrenador te ofrece entrar en un equipo (3 opciones)', d.pendiente && d.pendiente.tipo === 'equipoEsc' && (await page.locator('#modal [data-act=resolver]').count()) === 3);
    await shot(page, '41_escalada_equipo');
    await page.locator('#modal [data-act=resolver][data-v=club]').tap();
    d = await st(page);
    check('Escalada: al entrar en el equipo te federas (la licencia la pagan tus padres) y tienes un proyecto en roca', d.fase === 'escalador' && d.esc.federado && d.esc.equipo === 'club' && !!d.esc.proy);
    await tap(page, '[data-act=hoja][data-v=carrera]');
    check('Escalada: la tabla de dedos está bloqueada antes de los 16', (await page.locator('#hoja [data-act=elegir][data-id=tabla]').isDisabled()));
    await page.locator('#zonas summary').tap();
    await page.locator('#hoja [data-act=escProy][data-c=zona][data-v=margalef]').tap();
    d = await st(page);
    check('Escalada: se elige zona de escalada con toques', d.esc.proy.zona === 'margalef' && d.plan === 'roca');
    await shot(page, '42_escalada_roca');
    const ins = page.locator('#hoja [data-act=escIns]').first(); const insId = await ins.getAttribute('data-id');
    await ins.tap();
    d = await st(page);
    check('Escalada: se puede decir que no a una competición', d.esc.ins[insId] === false);
    for (const w of [320, 390]) {
      await page.setViewportSize({ width: w, height: 700 });
      for (const h of ['carrera', null]) { await page.evaluate(h => { __P1.S.hoja = h; __P1.render(); }, h);
        if (await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('hoja').scrollWidth) > document.documentElement.clientWidth)) check(`Escalada sin desplazamiento horizontal a ${w} px`, false); }
    }
    await page.setViewportSize({ width: 390, height: 844 });

    const r = await page.evaluate(() => {
      const G = __P1, out = {}, K = G.CFG.escalada;
      G.CFG.club.probSuceso = 0;
      const limpiar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver(G.S.pendiente.tipo === 'equipoEsc' ? 'club' : G.S.pendiente.tipo === 'patrocinio' ? '0' : G.S.pendiente.tipo === 'nacional' || G.S.pendiente.tipo === 'invitacion' || G.S.pendiente.tipo === 'eventoPatro' ? 'si' : G.S.pendiente.tipo === 'suceso' ? '0' : 'ok'); };
      const escalador = (seed, edad) => { G.nueva(seed, null, 'escalada', 'bloque'); G.S.p.rep = 15; G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar(); if (edad) G.S.edad = edad; G.S.p.dinero = 5000; return G.S; };
      const semana = a => { limpiar(); if (a) G.elegir(a); G.avanzarSemana(); limpiar(); };
      // Grados reales
      out.grados = G.GRADOS_VIA.length === 25 && G.GRADOS_VIA[14] === '8a' && G.GRADOS_VIA[24] === '9c' && G.GRADOS_BLOQUE[15] === '8A' && G.GRADOS_BLOQUE[21] === '9A';
      // Calendario: Mundial en años impares, Europeo en pares, Juegos en 2028
      const c27 = G.calendarioEsc(2027), c28 = G.calendarioEsc(2028), c26 = G.calendarioEsc(2026);
      out.calendario = c27.some(c => c.amb === 'mundial') && !c27.some(c => c.amb === 'europeo') && c26.some(c => c.amb === 'europeo') && c28.some(c => c.amb === 'jjoo' && c.lugar === 'Los Ángeles') && !c27.some(c => c.amb === 'jjoo') && c26.filter(c => c.amb === 'mundo').length === 8;
      // Requisitos
      let s = escalador(1, 15);
      const cm = G.calendarioEsc().find(c => c.amb === 'mundo'), ce = G.calendarioEsc().find(c => c.amb === 'esp'), jo = G.calendarioEsc(2028).find(c => c.amb === 'jjoo');
      out.req = [G.reqComp(cm), G.reqComp(ce)];
      out.reqEdad = /16/.test(G.reqComp(cm) || '') && !G.reqComp(ce);
      s.edad = 20; out.reqNacional = /nacional/.test(G.reqComp(cm) || '');
      s.esc.nacional = s.esc.año; s.p.dinero = 5000; out.conNacional = !G.reqComp(cm);
      s.esc.año = 2028; s.esc.nacional = 2028; out.reqJJOO = /clasific/.test(G.reqComp(jo) || '');
      // Competir: mejor nivel → mejor puesto (de media)
      const media = nivel => { let suma = 0; for (let i = 0; i < 30; i++) { s = escalador(100 + i, 22); for (const k of Object.keys(s.esc.at)) s.esc.at[k] = nivel; s.p.energia = 80; s.semanasAño = 3; s.esc.modoComp = 'todo'; semana('descansoEsc'); const p = s.esc.palmares[0]; suma += p ? p.pos : 99; } return suma / 30; };
      out.compite = { alto: media(68), bajo: media(45) };
      out.comp = out.compite.alto < out.compite.bajo && out.compite.alto < 10;
      s = escalador(7, 22); s.semanasAño = 3; s.esc.modoComp = 'todo'; semana('descansoEsc');
      out.palmares = s.esc.palmares.length === 1 && /Copa de España de bloque/.test(s.esc.palmares[0].n) && /T\dZ/.test(s.esc.palmares[0].marca) && s.ultimo.dep.some(([t, , w]) => /media/.test(w));
      // Velocidad: marca en segundos
      s = escalador(8, 22); s.semanasAño = 5; s.esc.modoComp = 'todo'; semana('descansoEsc');
      out.velocidad = /( s|resbalón)/.test((s.esc.palmares[0] || {}).marca || '');
      // Roca: condiciones por meses y encadenar
      s = escalador(9, 22);
      s.semanasAño = 10; const julio = G.ZONAS.siurana.buenos.includes(Math.floor(10 * 12 / 18));
      out.condiciones = !julio && G.ZONAS.ceuse.buenos.includes(Math.floor(10 * 12 / 18));
      for (const k of Object.keys(s.esc.at)) s.esc.at[k] = 60;
      s.semanasAño = 1; G.cambiarProyecto('zona', 'siurana'); G.cambiarProyecto('rel', '1');
      const g0 = s.esc.proy.grado, rep0 = s.p.rep; let semanas = 0;
      while (s.esc.maxVia < g0 && semanas < 20) { s.p.energia = 90; s.esc.carga = 0; s.semanasAño = 1; semana('roca'); s = G.S; semanas++; }
      out.encDbg = [g0, s.esc.maxVia, semanas, s.esc.envios.length, s.esc.proy.grado];
      out.encadena = s.esc.maxVia === g0 && semanas <= 6 && s.esc.envios.length === 1 && s.esc.proy.grado > g0;
      out.encadenaRep = s.p.rep >= rep0;
      // Lesiones: con los dedos muy cargados y tabla aparecen; descansado, no
      let les = 0;
      for (let i = 0; i < 40; i++) { s = escalador(300 + i, 20); s.esc.carga = 95; s.p.energia = 20; semana('tabla'); if (G.S.lesion > 0) les++; }
      let lesB = 0;
      for (let i = 0; i < 40; i++) { s = escalador(400 + i, 20); s.esc.carga = 0; s.p.energia = 90; semana('tecnica'); if (G.S.lesion > 0) lesB++; }
      out.lesiones = { alta: les, baja: lesB };
      s = escalador(12, 20); s.lesion = 3; out.lesionBloquea = !G.disponible('rocoBloque') && G.disponible('descansoEsc');
      // Patrocinadores: varias marcas a la vez (una por categoría) y cobro semanal
      s = escalador(13, 20); s.p.rep = 41; semana('descansoEsc');
      s = G.S; out.patroDbg = s.patros.map(p => p.marca + ' ' + p.año);
      out.patroOferta = s.patros.length === 1 && s.patros[0].año > 0;
      semana('descansoEsc');
      out.patroCobra = G.S.ultimo.eco.some(([t, v]) => t.startsWith('Patrocinio') && v > 0);
      s = escalador(31, 22); s.p.rep = 65; s.esc.mejor = { esp: 2 }; s.esc.nacional = s.esc.año; for (let i = 0; i < 16; i++) { s.p.rep = 65; s.semanasAño = 3; semana('descansoEsc'); }
      out.variasMarcas = new Set(G.S.patros.map(p => p.cat)).size >= 3;
      out.marcas = G.CFG.escalada.patrocinadores.length >= 12;
      // Red Bull: solo estrellas, 30.000-50.000 €/año
      s = escalador(32, 25); s.p.rep = 95; const rbSin = G.reqPatro('redtoro'); s.esc.mejor.mundo = 5; const rbCon = G.reqPatro('redtoro'), rbPago = G.pagoPatro('redtoro');
      out.redbull = !rbSin && rbCon && rbPago >= 30000 && rbPago <= 50000;
      // Premios reales: nacionales 500/300/200, Copa del Mundo 8.000/7.000/5.000, máster 4.000
      const A = G.AMBITOS;
      out.premios = A.esp.premio.slice(0, 3).join() === '500,300,200' && A.cesp.premio.slice(0, 3).join() === '500,300,200' && A.mundo.premio.slice(0, 3).join() === '8000,7000,5000' && A.master.premio[0] === 4000;
      // Máster por invitación
      s = escalador(33, 24); const ma = G.calendarioEsc().find(c => c.amb === 'master');
      out.masterSinInv = /invitación/.test(G.reqComp(ma) || '');
      for (const k of Object.keys(s.esc.at)) s.esc.at[k] = 95;
      s.p.rep = 70; s.semanasAño = ma.sem - 2; G.elegir('descansoEsc'); G.avanzarSemana();
      out.masterInv = G.S.esc.invit[ma.id] === true && G.S.esc.ins[ma.id] === true && G.S.ultimo.opo.some(([, t]) => t.includes('Me invitan'));
      limpiar();
      for (let i = 0; i < 3; i++) { G.S.p.rep = 70; semana('descansoEsc'); }
      const pm = G.S.esc.palmares.find(x => x.amb === 'master') || {};
      out.masterDbg = [pm.n, pm.pos, G.S.semanasAño];
      out.master = /Máster/.test(pm.n || '') && pm.pos <= 3 && G.S.esc.anual.premios >= 1500;
      // Beca del Estado: final de Copa del Mundo → 1.400 €/mes solo para escalada; lo que sobra se pierde
      s = escalador(34, 24); for (const k of Object.keys(s.esc.at)) s.esc.at[k] = 95; s.esc.nacional = s.esc.año; s.p.rep = 60; s.semanasAño = 6; s.esc.modoComp = 'todo';
      const a0b = s.esc.año; semana('descansoEsc');
      s = G.S; const pc = s.esc.palmares[0] || {};
      out.becaDbg = [pc.n, pc.pos, s.esc.becaHasta];
      out.becaConcedida = /Copa del Mundo/.test(pc.n || '') && pc.pos <= 8 && s.esc.becaHasta === a0b + 1;
      semana('descansoEsc'); const saldo1 = G.S.esc.becaSaldo;
      out.becaIngreso = saldo1 >= 900;
      const din = G.S.p.dinero; G.S.semanasAño = 2; semana('tecnica');
      out.becaPaga = !G.S.ultimo.eco.some(([t]) => /entrenador/.test(t)) && G.S.ultimo.dep.some(([t]) => /con la beca/.test(t));
      G.S.semanasAño = 17; semana('descansoEsc');
      out.becaPierde = G.S.esc.becaSaldo === 0 && G.S.ultimo.opo.some(([, t]) => /Se pierden/.test(t));
      // Oro olímpico: 90.000 € y beca de 60.000 €/año hasta los siguientes Juegos; si no repites, se pierde
      s = escalador(35, 24); for (const k of Object.keys(s.esc.at)) s.esc.at[k] = 99; s.esc.año = 2028; s.esc.nacional = 2028; s.esc.olimpico = { año: 2028, mod: 'combinada' }; s.semanasAño = 10; s.esc.modoComp = 'todo';
      semana('descansoEsc'); s = G.S; const oro = s.esc.palmares[0] || {};
      out.oroDbg = [oro.n, oro.pos, s.esc.becaOlimpica];
      out.oro = oro.amb === 'jjoo' && oro.pos === 1 && s.esc.becaOlimpica && s.esc.becaOlimpica.hasta === 2032 && G.S.ultimo.eco.some(([t, v]) => /Consejo|medalla/.test(t) && v === 90000);
      semana('descansoEsc'); out.oroCobra = G.S.ultimo.eco.some(([t, v]) => /Beca olímpica/.test(t) && v === Math.round(60000 / 18));
      s = G.S; s.esc.año = 2032; s.esc.nacional = 2032; s.esc.olimpico = { año: 2032, mod: 'combinada' }; s.semanasAño = 10; for (const k of Object.keys(s.esc.at)) s.esc.at[k] = 40;
      semana('descansoEsc'); out.oroPierde = !G.S.esc.becaOlimpica && (G.S.esc.palmares[0] || {}).amb === 'jjoo';
      // Fin de año: cumpleaños, resumen y equipo nacional si haces podio en España
      s = escalador(14, 20); s.esc.anual.mejorEsp = 2; s.semanasAño = 17; const e0 = s.edad, a0 = s.esc.año;
      G.elegir('descansoEsc'); G.avanzarSemana();
      s = G.S; const tipos = [s.pendiente && s.pendiente.tipo].concat(s.cola.map(e => e.tipo));
      out.finAño = s.edad === e0 + 1 && s.esc.año === a0 + 1 && tipos.includes('finEsc') && tipos.includes('nacional');
      limpiar(); out.nacional = G.S.esc.nacional === a0 + 1 && G.S.esc.beca > 0;
      // Hasta los 18 la familia paga; después, cuota y gastos de vida
      s = escalador(15, 16); semana('descansoEsc'); out.menor = !G.S.ultimo.eco.some(([t]) => /Cuota/.test(t)) && G.S.ultimo.eco.filter(([t]) => /Gastos/.test(t)).every(([, v]) => v === 0);
      s = escalador(16, 25); semana('descansoEsc'); out.adulto = G.S.ultimo.eco.some(([t, v]) => /Cuota/.test(t) && v < 0) && G.S.ultimo.eco.some(([t, v]) => /Gastos/.test(t) && v < 0);
      // Retirada desde los 28
      s = escalador(17, 27); out.retiroAntes = !G.retirarseYa();
      s.edad = 28; out.retiro = G.retirarseYa() && G.S.fase === 'retirado' && G.S.pendiente && G.S.pendiente.tipo === 'retiro';
      limpiar(); out.retiradoAcciones = G.disponible('entrenadorEsc') && !G.disponible('entrenador') && G.disponible('rentas');
      semana('entrenadorEsc'); out.retiradoSemana = G.S.fase === 'retirado';
      // Pantallas y desbloqueos propios
      s = escalador(18, 22);
      out.pantallas = G.pantallas().length === 10 && G.pantallas()[0].n === 'El rocódromo del barrio';
      s.pantalla = 3; out.bloq4 = !!G.bloqueoNegocio('escuelaEsc');
      s.pantalla = 4; out.desb5 = !G.bloqueoNegocio('escuelaEsc') && !!G.bloqueoNegocio('peluqueria') && !G.desbloqueado('clubes');
      s.pantalla = 9; out.desb10 = !G.bloqueoNegocio('hotel');
      // Logros propios
      out.logros = G.logrosDe().some(l => l[0] === 'ochoa') && !G.logrosDe().some(l => l[0] === 'gol');
      // Imprevistos de escalada
      let errores = 0, total = 0;
      for (const [id, e] of Object.entries(G.SUCESOS)) {
        if (e.dep !== 'escalada') continue;
        for (let k = 0; k < e.ops.length; k++) {
          s = escalador(500 + total, 24); s.p.rep = 75; s.p.dinero = 20000; s.esc.nacional = s.esc.año; s.esc.carga = 70; s.esc.maxVia = 15;
          for (const kk of Object.keys(s.esc.at)) s.esc.at[kk] = 60;
          s.rel.push({ id: 'h1', tipo: 'hijo', nombre: 'Leo', v: 70, semana: 0, edad: 8, privado: false });
          const data = e.prep ? e.prep(s) : {};
          try { s.pendiente = { tipo: 'suceso', id, data }; G.render(); if (!G.resolver(String(k))) errores++; } catch (err) { errores++; }
          total++;
        }
      }
      out.sucesos = { errores, total, distintos: Object.values(G.SUCESOS).filter(e => e.dep === 'escalada').length };
      // En escalada no salen imprevistos de fútbol
      s = escalador(19, 22); let futbol = 0;
      for (let i = 0; i < 200; i++) { const e = G.elegirSuceso(); if (e && ['cena', 'tarde', 'botas', 'capitan', 'hijoFutbol'].includes(e.id)) futbol++; }
      out.sinFutbol = futbol === 0;
      return out;
    });
    check('Escalada: grados reales (francesa en vía, Fontainebleau en bloque)', r.grados);
    check('Escalada: calendario con Copa del Mundo, Mundial (años impares), Europeo (pares) y Juegos (Los Ángeles 2028)', r.calendario);
    check('Escalada: requisitos (16 años, equipo nacional, plaza olímpica)', r.reqEdad && r.reqNacional && r.conNacional && r.reqJJOO, JSON.stringify([r.req, r.reqEdad, r.reqNacional, r.conNacional, r.reqJJOO]));
    check('Escalada: en competición, más nivel da mejor puesto', r.comp, JSON.stringify(r.compite));
    check('Escalada: el resultado se explica y da marca de bloque (tops y zonas) y de velocidad (segundos)', r.palmares && r.velocidad);
    check('Escalada: condiciones de la roca según el mes (Siurana mala en verano, Céüse buena)', r.condiciones);
    check('Escalada: proyectar en roca hasta encadenar sube tu grado máximo y pasa al siguiente proyecto', r.encadena && r.encadenaRep, JSON.stringify([r.encadena, r.encadenaRep, r.encDbg]));
    check('Escalada: con los dedos cargados la tabla lesiona; descansado, no', r.lesiones.alta > 5 && r.lesiones.baja === 0 && r.lesionBloquea, JSON.stringify(r.lesiones));
    check('Escalada: patrocinadores según tu fama, que se cobran cada semana', r.patroOferta && r.patroCobra, JSON.stringify([r.patroDbg, r.patroOferta, r.patroCobra]));
    check('Escalada: muchas marcas y varias a la vez (una por categoría)', r.marcas && r.variasMarcas);
    check('Escalada: Red Toro solo para estrellas, de 30.000 a 50.000 € al año', r.redbull);
    check('Escalada: premios de 500/300/200 € en España, 8.000/7.000/5.000 € en Copa del Mundo y 4.000 € en los másters', r.premios);
    check('Escalada: másters internacionales solo por invitación, con premio', r.masterSinInv && r.masterInv && r.master, JSON.stringify([r.masterDbg, r.masterSinInv, r.masterInv, r.master]));
check('Escalada: oro olímpico = 90.000 € y beca de 60.000 €/año hasta los siguientes Juegos, que se pierde si no repites', r.oro && r.oroCobra && r.oroPierde, JSON.stringify([r.oroDbg, r.oro, r.oroCobra, r.oroPierde]));
        check('Escalada: beca del Estado por llegar a una final de Copa del Mundo, solo para gastos de escalada', r.becaConcedida && r.becaIngreso && r.becaPaga && r.becaPierde, JSON.stringify([r.becaDbg, r.becaConcedida, r.becaIngreso, r.becaPaga, r.becaPierde]));
    check('Escalada: fin de año con cumpleaños, resumen y convocatoria del equipo nacional', r.finAño && r.nacional);
    check('Escalada: hasta los 18 pagan tus padres; después, cuota y gastos de vida', r.menor && r.adulto);
    check('Escalada: retirada desde los 28 y acciones propias de retirado', r.retiroAntes && r.retiro && r.retiradoAcciones && r.retiradoSemana);
    check('Escalada: 10 pantallas propias y desbloqueos (escuela en la 5, hotel en la 10, sin clubes de fútbol)', r.pantallas && r.bloq4 && r.desb5 && r.desb10);
    check('Escalada: logros propios', r.logros);
    check('Escalada: todos sus imprevistos y opciones funcionan', r.sucesos.errores === 0 && r.sucesos.distintos >= 15, `${r.sucesos.distintos} imprevistos, ${r.sucesos.total} opciones`);
    check('Escalada: no salen imprevistos de fútbol', r.sinFutbol);

    // Patrocinadores con obligaciones (fútbol y escalada)
    const rp = await page.evaluate(() => {
      const G = __P1, out = {}; G.CFG.club.probSuceso = 0;
      const todas = G.CFG.escalada.patrocinadores.concat(G.CFG.patrocinio.futbol);
      const reales = /red bull|nike|adidas|puma|rolex|\baudi\b|\bseat\b|north face|la sportiva|\bscarpa\b|petzl|mammut|\bpatagonia\b|black diamond|edelrid|tenaya|aquarius|under armour|kappa|\bcasio\b|\bjoma\b|kelme|mizuno|gatorade|\blotto\b|hugo boss|festina|xiaomi|samsung|\bapple\b|burger king|telepizza|\bocun\b|five ten|arc.?teryx|friction labs|gopro|\bcamp\b|\bkia\b|\bbeal\b/i;
      out.guino = todas.every(P => !reales.test(P.marca) && P.lema) && todas.some(P => P.marca === 'Red Toro');
      out.futbolMarcas = G.CFG.patrocinio.futbol.length >= 30 && new Set(G.CFG.patrocinio.futbol.map(P => P.cat)).size === 8 && G.CFG.escalada.patrocinadores.length >= 24;
      const limpiar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) { const e = G.S.pendiente; G.resolver(e.tipo === 'eventoPatro' || e.tipo === 'nacional' || e.tipo === 'invitacion' ? 'si' : e.tipo === 'equipoEsc' ? 'club' : ['fin', 'pantalla', 'retiro', 'finEsc'].includes(e.tipo) ? 'ok' : e.tipo === 'mejora' ? 'aceptar' : e.tipo === 'ofertas' && G.S.contrato && G.S.contrato.temporadasRestantes > 0 ? 'quedarse' : '0'); } };
      // Fútbol: al club, llega una oferta y se cobra
      G.nueva(41); G.S.p.rep = 30; G.S.pendiente = { tipo: 'ojeador', clubId: G.S.mundo.ligas['es-4'][3] }; G.resolver('corto');
      for (let i = 0; i < 4; i++) { limpiar(); G.elegir('descansar'); G.avanzarSemana(); } limpiar();
      out.futClub = G.S.fase === 'club';
      G.S.p.rep = 40; G.S.patroOf.prox = 0; G.S.patroOf.ofrecida = {}; G.S.patros = [];
      let oferta = null;
      for (let i = 0; i < 6 && !oferta; i++) {
        G.elegir('normal'); G.S.p.energia = 90; G.avanzarSemana();
        for (let g = 0; G.S.pendiente && g < 20; g++) { const e = G.S.pendiente; if (e.tipo === 'patrocinio' && !oferta) { oferta = JSON.parse(JSON.stringify(e)); G.resolver('0'); } else limpiar(); }
      }
      out.futOferta = !!oferta && !!oferta.ofertas[0].obj && G.S.patros.length >= 1;
      G.S.patros.forEach(p => { p.proxEv = 999; });
      G.elegir('normal'); G.avanzarSemana();
      out.futCobra = G.S.ultimo.eco.some(([t, v]) => t.startsWith('Patrocinio de') && v > 0);
      limpiar();
      G.S.p.rep = 95; out.futEstrella = !G.reqPatro('naik') && !G.reqPatro('rolecs') && G.reqPatro('barPaco'); G.S.p.rep = 40;
      // Compromisos: llega uno; cumplir sube la relación y ocupa la tarde
      const pt = G.S.patros[0]; pt.proxEv = G.S.semana; G.S.patroOf.ultEv = -99; G.S.patroOf.prox = 999;
      G.elegir('normal'); G.avanzarSemana();
      let ev = null;
      for (let g = 0; G.S.pendiente && g < 20; g++) { const e = G.S.pendiente; if (e.tipo === 'eventoPatro') { ev = e; break; } limpiar(); }
      out.evento = !!ev;
      const rel0 = pt.rel; G.resolver('si');
      out.cumplir = pt.rel > rel0 && !!G.S.tardePatro;
      G.ponerSlot('tarde', 'act:meditar'); G.cerrarSemana(); limpiar();
      out.tardeOcupada = G.S.log[G.S.log.length - 1].lineas.some(([, t]) => t.includes('Tarde ocupada')) && !G.S.tardePatro;
      // Excusarse baja la relación; por debajo de 25 rompen el contrato
      G.S.pendiente = { tipo: 'eventoPatro', id: pt.id, ev: 'fiesta' }; const r1 = pt.rel; G.resolver('no');
      out.excusa = pt.rel < r1;
      pt.rel = 10; G.elegir('normal'); G.avanzarSemana();
      out.ruptura = !G.S.patros.some(p => p.id === pt.id) && G.S.ultimo.opo.some(([, t]) => t.includes('rompe el contrato'));
      limpiar();
      // Objetivo de temporada: prima y relación; si fallas con la relación baja, no renuevan
      G.S.patros = []; G.firmarPatro('pumba'); const pb = G.S.patros[0]; pb.desde = G.S.semana - 10;
      G.S.patroTemp.goles = 50; const R1 = G.balancePatros();
      out.objetivoOk = R1.eco.some(([t, v]) => t.includes('objetivo cumplido') && v > 0) && pb.rel === 75 && pb.temporadas === 1;
      pb.desde = G.S.semana - 10; pb.rel = 45; G.S.patroTemp.goles = 0; const R2 = G.balancePatros();
      out.objetivoMal = !G.S.patros.length && R2.opo.some(([, t]) => t.includes('No cumplo')) && R2.opo.some(([, t]) => t.includes('no me renueva'));
      // Escalada: objetivos propios, logos en la escena y hoja
      G.nueva(42, null, 'escalada', 'bloque'); G.S.p.rep = 15; G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar(); G.S.p.rep = 60;
      G.firmarPatro('escarpa'); const pe = G.S.patros[0];
      out.escObjetivo = pe.obj.tipo === 'grado' && /\d/.test(pe.obj.t);
      G.render(); const m = document.querySelector('.escena .marcas');
      out.escMarcaEnEscena = !!m && m.textContent.includes('Escarpa');
      G.S.hoja = 'patros'; G.render(); const hh = document.getElementById('hoja').textContent;
      out.hoja = hh.includes('Escarpa') && hh.includes('Relación') && hh.includes('Encadenar');
      G.S.hoja = null; G.render();
      // Partidas guardadas antiguas
      const vieja = JSON.parse(JSON.stringify(G.S)); delete vieja.patros; delete vieja.patroOf; delete vieja.patrosHist;
      vieja.esc.patros = [{ id: 'redbull', marca: 'Red Bull', cat: 'bebida', ic: '🐂', año: 40000, temporadas: 2 }];
      const mg = G.migrar(vieja); out.migra = mg.patros[0].id === 'redtoro' && mg.patros[0].marca === 'Red Toro' && mg.patros[0].rel === 60 && !!mg.patros[0].obj;
      return out;
    });
    check('Patrocinadores: nombres de guiño (Red Toro, Adibas…), ninguna marca real, cada una con su lema', rp.guino);
    check('Patrocinadores: más de 30 marcas de fútbol en 8 categorías y más de 24 de escalada', rp.futbolMarcas);
    check('Fútbol: en un club llegan ofertas con objetivo y se cobran cada semana', rp.futClub && rp.futOferta && rp.futCobra, JSON.stringify(rp));
    check('Fútbol: las marcas top (Naik, Rolecs) solo para primera división', rp.futEstrella);
    check('Patrocinadores: compromisos que ocupan la tarde; cumplir sube la relación', rp.evento && rp.cumplir && rp.tardeOcupada, JSON.stringify(rp));
    check('Patrocinadores: excusarse baja la relación y por debajo de 25 rompen el contrato', rp.excusa && rp.ruptura);
    check('Patrocinadores: objetivo de temporada con prima; si fallas y la relación es baja, no renuevan', rp.objetivoOk && rp.objetivoMal);
    check('Escalada: objetivos propios, logos en la escena y hoja de patrocinadores', rp.escObjetivo && rp.escMarcaEnEscena && rp.hoja, JSON.stringify(rp));
    check('Partidas guardadas antiguas: las marcas se convierten (Red Bull → Red Toro)', rp.migra);
    // Marcas realistas y sin repeticiones
    const mr = await page.evaluate(() => {
      const G = __P1, out = {}, cats = G.CFG.patrocinio.cats.futbol;
      G.silencio = true;
      const fut = (liga, rep) => { G.nueva(5); G.S.fase = 'club'; G.S.contrato = { clubId: G.S.mundo.ligas[liga][0], salario: 100, temporadasRestantes: 2 }; G.S.p.rep = rep; };
      const todas = () => cats.flatMap(c => G.ofertasPatro(c));
      fut('es-5', 60); const t5 = todas();
      out.tercera = t5.length > 0 && t5.every(o => ['local', 'bebida', 'comida'].includes(o.cat)) && !t5.some(o => o.id === 'pumba');
      fut('es-4', 60); out.segundaFed = !todas().some(o => ['pumba', 'adibas', 'naik', 'aquarios'].includes(o.id));
      fut('es-2', 60); out.segunda = G.ofertasPatro('botas').some(o => o.id === 'pumba');
      fut('es-1', 95); const t1 = todas(); out.primera = t1.some(o => o.id === 'naik') && !t1.some(o => ['barPaco', 'panaderia', 'yoma', 'kapa'].includes(o.id));
      // Nunca dos veces la misma marca en una ventana, ni una que ya tienes
      out.distintas = cats.every(c => { const l = G.ofertasPatro(c).map(o => o.id); return new Set(l).size === l.length; });
      fut('es-2', 60); G.firmarPatro('pumba'); out.yaLaTengo = !G.ofertasPatro('botas').some(o => o.id === 'pumba');
      // Rechazar: esas marcas no vuelven en un año
      G.S.patros = []; const of = G.ofertasPatro('bebida'); G.S.pendiente = { tipo: 'patrocinio', cat: 'bebida', ofertas: of }; G.resolver('no');
      out.rechazo = of.length > 0 && !G.ofertasPatro('bebida').some(o => of.some(x => x.id === o.id));
      G.S.semana += 19; out.vuelve = G.ofertasPatro('bebida').some(o => of.some(x => x.id === o.id));
      // Escalada: las marcas pequeñas no buscan estrellas y las grandes piden nivel
      G.nueva(6, null, 'escalada', 'bloque'); G.S.fase = 'escalador'; G.S.esc.equipo = 'club'; G.S.p.rep = 90; G.S.esc.mejor = { mundo: 3 };
      const ee = G.CFG.patrocinio.cats.escalada.flatMap(c => G.ofertasPatro(c)).map(o => o.id);
      out.escEstrella = ee.includes('esportiva') && !ee.some(id => ['tiendaBarrio', 'tiza', 'kombucha', 'tenaja'].includes(id));
      G.S.p.rep = 45; G.S.esc.mejor = {}; G.S.esc.maxVia = 8; G.S.esc.maxBloque = 5;
      const ej = G.CFG.patrocinio.cats.escalada.flatMap(c => G.ofertasPatro(c)).map(o => o.id);
      out.escNivel = !ej.some(id => ['escarpa', 'petzel', 'esportiva', 'aquarios', 'mamut'].includes(id)) && ej.includes('tenaja');
      G.silencio = false; G.nueva(7);
      return out;
    });
    check('Marcas realistas: en Tercera Federación solo negocios del barrio; Pumba desde Segunda; las top, solo en Primera', mr.tercera && mr.segundaFed && mr.segunda && mr.primera, JSON.stringify(mr));
    check('Marcas sin repetir: nunca la misma dos veces en una ventana ni una que ya tienes; si la rechazas, no vuelve en un año', mr.distintas && mr.yaLaTengo && mr.rechazo && mr.vuelve, JSON.stringify(mr));
    check('Escalada: las marcas pequeñas no buscan estrellas y las grandes piden nivel (España, selección, Copa del Mundo)', mr.escEstrella && mr.escNivel, JSON.stringify(mr));

    // Tu personaje y la tienda (con toques)
    await page.evaluate(() => { const G = __P1; G.CFG.club.probSuceso = 0; G.nueva(51); G.S.p.dinero = 1000; G.S.hoja = null; G.render(); });
    await tap(page, '#top .hava');
    const lk1 = await page.evaluate(() => ({ hoja: __P1.S.hoja, items: document.querySelectorAll('#tienda .lk').length, prev: !!document.querySelector('.lookPrev svg') }));
    await tap(page, '[data-act=capaLook][data-v=pelo]');
    await tap(page, '[data-act=look][data-c=pelo][data-v=cresta]');
    const lk2 = await page.evaluate(() => ({ d: __P1.S.p.dinero, pelo: __P1.S.look.pelo, arm: __P1.S.armario.slice() }));
    await tap(page, '[data-act=look][data-c=pelo][data-v=corto]');
    await tap(page, '[data-act=look][data-c=pelo][data-v=cresta]');
    const lk3 = await page.evaluate(() => ({ d: __P1.S.p.dinero, pelo: __P1.S.look.pelo }));
    for (const w of [320, 390]) {
      await page.setViewportSize({ width: w, height: 700 });
      if (await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('hoja').scrollWidth) > document.documentElement.clientWidth)) check(`Tienda sin desplazamiento horizontal a ${w} px`, false);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const lk4 = await page.evaluate(() => {
      const G = __P1, out = {};
      G.S.capaLook = 'cabeza'; G.render();
      out.corona = document.querySelector('[data-act=look][data-c=cabeza][data-v=corona]').disabled && !G.ponerLook('cabeza', 'corona');
      G.S.p.dinero = 5000; out.traje = !G.ponerLook('ropa', 'traje'); G.S.pantalla = 4; out.traje2 = G.ponerLook('ropa', 'traje') && G.S.look.ropa === 'traje';
      G.S.p.dinero = 5; out.caro = !G.ponerLook('calzado', 'doradas');
      G.S.p.fel = 90; const feliz = G.avatarSVG(null, 'busto'); G.S.p.fel = 10; out.cambiaCara = feliz !== G.avatarSVG(null, 'busto');
      G.S.lesion = 3; out.tirita = G.avatarSVG(null, 'busto').includes('rotate(-20'); G.S.lesion = 0;
      G.S.hoja = null; G.render(); out.escena = !!document.querySelector('.escena .yo svg');
      out.botasPrecio = G.precioLook('calzado', 'botas');
      G.nueva(52, null, 'escalada', 'bloque'); G.S.p.rep = 40; G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club');
      for (let g = 0; G.S.pendiente && g < 10; g++) G.resolver('ok') || G.resolver('0') || G.resolver('si');
      out.piesAntes = G.precioLook('calzado', 'pies'); G.firmarPatro('tenaja'); out.piesDespues = G.precioLook('calzado', 'pies');
      out.piesGratis = G.ponerLook('calzado', 'pies') && G.S.p.dinero >= 0 && G.S.armario.includes('calzado:pies');
      out.sinBotasEsc = !G.ponerLook('calzado', 'botas');
      return out;
    });
    check('Tu personaje: se abre tocando tu cara arriba, con vista previa y tienda', lk1.hoja === 'avatar' && lk1.items >= 6 && lk1.prev, JSON.stringify(lk1));
    check('Tienda: comprar cobra una vez y lo que compras es tuyo para siempre', lk2.d === 880 && lk2.pelo === 'cresta' && lk2.arm.includes('pelo:cresta') && lk3.d === 880 && lk3.pelo === 'cresta', JSON.stringify([lk2, lk3]));
    check('Tienda: cosas bloqueadas por logros y pantallas, y sin dinero no se compra', lk4.corona && lk4.traje && lk4.traje2 && lk4.caro, JSON.stringify(lk4));
    check('Tu cara cambia con el ánimo y con las lesiones; tu personaje sale en la escena', lk4.cambiaCara && lk4.tirita && lk4.escena);
    check('Las marcas regalan sus productos (pies de gato gratis con patrocinador) y cada deporte tiene lo suyo', lk4.piesAntes === 90 && lk4.piesDespues === 0 && lk4.piesGratis && lk4.sinBotasEsc && lk4.botasPrecio === 80, JSON.stringify(lk4));

    // Toques de humor
    const hu = await page.evaluate(() => {
      const G = __P1, out = {};
      const ids = ['paloma', 'jersey', 'karaoke', 'gps', 'gato', 'meme', 'taladro', 'concurso', 'doble', 'tejado', 'mascotaClub', 'arbitro', 'cabra', 'magnesioCae', 'cancion'];
      out.sucesos = ids.every(id => G.SUCESOS[id]);
      G.CFG.club.probSuceso = 0; G.nueva(61); G.CFG.humor.probTitular = 1;
      G.elegir('plaza'); G.avanzarSemana();
      out.titular = G.S.log[G.S.log.length - 1].lineas.some(([i, t]) => i === '📰' && t.includes('«'));
      G.CFG.humor.probTitular = 0.2;
      G.S.p.fel = 90; G.S.ultimo = null; G.S.pendiente = null; G.render();
      out.bocadillo = !!document.querySelector('.escena .bocata') && !!document.querySelector('.escena .yo.salta');
      G.S.p.fel = 55; G.S.p.energia = 60; G.render(); out.sinBocadillo = !document.querySelector('.escena .bocata');
      G.S.hoja = 'logros'; G.render(); out.secretos = document.getElementById('hoja').textContent.includes('Logro secreto');
      G.S.look.calzado = 'chanclas'; G.S.look.ropa = 'traje'; G.S.hoja = null; G.elegir('plaza'); G.avanzarSemana();
      out.chanclas = !!G.S.logros.chanclas;
      G.S.hoja = 'logros'; G.render(); out.visible = document.getElementById('hoja').textContent.includes('Chanclas con calcetines');
      G.S.hoja = null; G.render();
      return out;
    });
    check('Humor: imprevistos graciosos en los dos deportes (paloma, karaoke, la mascota del club, la cabra montesa…)', hu.sucesos);
    check('Humor: titulares de prensa graciosos y bocadillos de tu personaje que salta cuando está feliz', hu.titular && hu.bocadillo && hu.sinBocadillo, JSON.stringify(hu));
    check('Humor: logros secretos que no se ven hasta conseguirlos (chanclas con calcetines y traje)', hu.secretos && hu.chanclas && hu.visible, JSON.stringify(hu));

    // Mejoras: en qué gastar el dinero (con toques)
    await page.evaluate(() => { const G = __P1; G.CFG.club.probSuceso = 0; G.nueva(71, null, 'escalada', 'bloque'); G.S.p.dinero = 30000; G.S.hoja = null; G.render(); });
    await tap(page, '#dinero');
    const mj1 = await page.evaluate(() => ({ hoja: __P1.S.hoja, filas: document.querySelectorAll('#hoja .row').length }));
    await tap(page, '[data-act=contratar][data-id=entrenador]');
    await tap(page, '[data-act=material][data-id=plafon]');
    const mj2 = await page.evaluate(() => ({ personal: __P1.S.personal.slice(), mat: __P1.S.materialCasa.slice(), d: __P1.S.p.dinero }));
    const mj = await page.evaluate(() => {
      const G = __P1, out = {};
      out.ef = G.efMejoras();
      // Entrenar con entrenador y plafón mejora más (misma partida, misma suerte)
      const snap = JSON.stringify(G.S), suma = () => Object.values(G.S.esc.at).reduce((a, v) => a + v, 0);
      const sin = JSON.parse(snap); sin.personal = []; sin.materialCasa = []; G.S = sin;
      let a0 = suma(); G.elegir('amigos'); G.avanzarSemana(); const gSin = suma() - a0;
      G.S = JSON.parse(snap); a0 = suma(); G.elegir('amigos'); G.avanzarSemana(); const gCon = suma() - a0;
      out.entrena = gCon > gSin * 1.15; out.gSin = gSin; out.gCon = gCon;
      out.pagaEntrenador = G.S.ultimo.eco.some(([t, v]) => t === 'Entrenador personal' && v === -150) || G.S.ultimo.dep.some(([t]) => t.startsWith('Entrenador personal'));
      // Material: no se compra dos veces; cada deporte tiene el suyo
      out.unaVez = !G.comprarMaterial('plafon') && !G.comprarMaterial('porteria');
      // Caprichos: dan lo que dicen y hay que esperar para repetir
      G.S.p.energia = 30; const d0 = G.S.p.dinero; out.spa = G.usarCapricho('spa') && G.S.p.energia === 50 && G.S.p.dinero === d0 - 250 && !G.usarCapricho('spa');
      // Lesiones y viajes
      G.comprarMaterial('crashpad'); G.contratar('fisio'); out.lesion = Math.abs(G.efMejoras().lesion - 0.45) < 1e-9;
      const v0 = G.costeViajeZona('siurana'); G.S.p.dinero += 20000; G.comprarMaterial('furgo'); out.furgo = G.costeViajeZona('siurana') === Math.round(v0 / 2);
      // Sin dinero, el personal se va
      G.S.p.dinero = 0; G.S.esc.becaSaldo = 0; G.elegir('descansoEsc'); G.avanzarSemana();
      out.seVa = G.S.personal.length === 0 && G.S.ultimo.opo.some(([, t]) => t.includes('no le puedo pagar'));
      // Fútbol: lo suyo
      G.nueva(72); G.S.p.dinero = 10000; out.futbol = G.comprarMaterial('porteria') && !G.comprarMaterial('plafon') && G.contratar('psico') && G.efMejoras().animo === 6;
      return out;
    });
    check('Mejoras: se abren tocando tu dinero; contratar y comprar con toques', mj1.hoja === 'mejoras' && mj1.filas >= 10 && mj2.personal.includes('entrenador') && mj2.mat.includes('plafon') && mj2.d === 26000, JSON.stringify([mj1, mj2]));
    check('Mejoras: el entrenador y el material hacen que entrenes mejor, y el entrenador se paga cada semana', mj.entrena && mj.pagaEntrenador, JSON.stringify(mj));
    check('Mejoras: material para siempre y propio de cada deporte; caprichos con espera', mj.unaVez && mj.spa && mj.futbol, JSON.stringify(mj));
    check('Mejoras: fisio y crash pads bajan las lesiones; la furgo abarata los viajes; sin dinero, tu equipo se va', mj.lesion && mj.furgo && mj.seVa, JSON.stringify(mj));

    // Números rojos: carta del banco, plazo, intereses y embargo
    const bk = await page.evaluate(() => {
      const G = __P1, out = {}, limpiar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver('ok') || G.resolver('0') || G.resolver('si'); };
      G.CFG.club.probSuceso = 0; G.CFG.humor.probTitular = 0; G.nueva(81); G.S.pantalla = 9; G.S.edad = 36; G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal;
      G.S.p.dinero = 200000; G.comprarCoche('utilitario'); G.comprarInmueble(G.S.anuncios[0].id, false); G.comprarNegocio('peluqueria', 6000);
      const n = G.S.negocios[0]; n.caja = 500;
      G.S.p.dinero = -3000; G.elegir('rentas'); G.avanzarSemana();
      out.carta = G.S.pendiente && G.S.pendiente.tipo === 'cartaBanco' && !!G.banco();
      G.render(); out.cartaVisible = document.getElementById('evento').textContent.includes('Banco del Barrio');
      out.sinEmbargoAun = G.S.coches.length === 1 && !G.S.ultimo.eco.some(([t]) => t.startsWith('Intereses del banco')); limpiar();
      G.S.p.dinero = -3000; G.elegir('rentas'); G.avanzarSemana();
      out.intereses = G.S.ultimo.eco.some(([t, v]) => t.startsWith('Intereses del banco') && v < 0);
      out.embargo = G.S.pendiente && G.S.pendiente.tipo === 'embargo' && n.caja === 0 && G.S.coches.length === 0 && G.S.p.dinero >= 0 && !G.banco();
      out.casaSigue = G.S.inmuebles.length === 1; limpiar();
      // Si sales a tiempo, no pasa nada
      G.nueva(82); G.S.edad = 30; G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal; G.S.p.dinero = -100; G.elegir('rentas'); G.avanzarSemana(); limpiar();
      G.S.p.dinero = 5000; G.elegir('rentas'); G.avanzarSemana();
      out.aTiempo = !G.banco() && !G.S.ultimo.eco.some(([t]) => t.startsWith('Intereses del banco')) && G.S.ultimo.opo.some(([, t]) => t.includes('Salgo de los números rojos'));
      return out;
    });
    check('Números rojos: carta del banco con una semana de plazo', bk.carta && bk.cartaVisible && bk.sinEmbargoAun, JSON.stringify(bk));
    check('Números rojos: pasado el plazo, intereses y embargo (caja del negocio, luego el coche) hasta cubrir la deuda', bk.intereses && bk.embargo && bk.casaSigue, JSON.stringify(bk));
    check('Números rojos: si sales a tiempo, el banco te deja en paz', bk.aTiempo, JSON.stringify(bk));
    const qb = await page.evaluate(() => {
      const G = __P1, out = {}, sem = () => { G.elegir('rentas'); G.avanzarSemana(); };
      const pasar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) { const t = G.S.pendiente.tipo; if (t === 'quiebra') { out.ventanaQuiebra = true; G.resolver(out.elegir); } else G.resolver('ok') || G.resolver('0') || G.resolver('si'); } };
      // Sin nada que embargar: puedes declararte en quiebra
      G.CFG.club.probSuceso = 0; G.CFG.humor.probTitular = 0;
      G.nueva(83); G.S.edad = 36; G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal; G.S.pantalla = 9; G.S.p.rep = 50;
      G.S.patros = [{ id: 'barPaco', marca: 'Bar Paco', cat: 'local', ic: '🍺', año: 500, temporadas: 2, rel: 60, obj: null, proxEv: 999 }];
      out.elegir = 'quiebra'; G.S.p.dinero = -5000;
      for (let i = 0; i < 4 && !G.S.quiebras; i++) { sem(); pasar(); }
      out.quiebra = !!out.ventanaQuiebra && G.S.quiebras === 1 && G.S.p.dinero >= 0 && G.S.patros.length === 0 && G.S.p.rep <= 35 && !G.banco();
      out.veto = /hipotecas/.test(G.bloqueoInmueble(G.S.anuncios[0], true) || '');
      // Si no te declaras, el banco lo hace a las 4 semanas
      G.nueva(84); G.S.edad = 36; G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal;
      out.ventanaQuiebra = false; out.elegir = 'seguir'; G.S.p.dinero = -5000;
      let semanas = 0;
      for (let i = 0; i < 10 && !G.S.quiebras; i++) { G.S.p.dinero = Math.min(G.S.p.dinero, -5000); sem(); semanas++; pasar(); }
      out.forzada = G.S.quiebras === 1 && G.S.p.dinero >= 0 && semanas <= 6 && G.S.log[G.S.log.length - 1].lineas.concat(G.S.log[G.S.log.length - 2].lineas).some(([, t]) => t.includes('me declara en quiebra'));
      return out;
    });
    check('Números rojos: sin nada que embargar puedes declararte en quiebra (deuda borrada, pierdes fama y marcas, sin hipotecas)', qb.quiebra && qb.veto, JSON.stringify(qb));
    check('Números rojos: si no te declaras, el banco te declara en quiebra a las pocas semanas: la deuda nunca crece sin fin', qb.forzada, JSON.stringify(qb));
    // Fallos corregidos del análisis
    const fx = await page.evaluate(() => {
      const G = __P1, out = {}, limpiar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver('ok') || G.resolver('0') || G.resolver('si') || G.resolver('seguir'); };
      G.CFG.club.probSuceso = 0; G.CFG.humor.probTitular = 0;
      // Escalada: se puede pasar la pantalla 2 compitiendo, sin ir a la roca
      G.nueva(91, null, 'escalada', 'bloque'); G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar();
      G.S.pantalla = 1; G.S.esc.comps = 3; G.S.esc.maxVia = -1; G.S.esc.maxBloque = -1; G.S.esc.mejor = { esp: 15 };
      out.p2Competir = G.progresoObjetivos().every(([, v]) => v >= 1);
      G.nueva(96, null, 'escalada', 'bloque'); G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar();
      // Imprevistos: lo que no puedes pagar no se puede elegir
      G.S.p.dinero = 10; G.S.pendiente = { tipo: 'suceso', id: 'taladro', data: {} }; G.render();
      out.noPagable = !G.resolver('2') && document.querySelector('#evento [data-v="2"]').disabled && G.resolver('0') && G.S.p.dinero === 10;
      // Menores: la deuda la pagan sus padres
      G.S.edad = 15; G.S.p.dinero = -300; const m0 = G.S.rel.find(r => r.id === 'madre').v; G.elegir('descansoEsc'); G.avanzarSemana(); limpiar();
      out.menor = G.S.p.dinero >= 0 && !G.banco() && G.S.rel.find(r => r.id === 'madre').v < m0;
      // Deuda pequeña: solo comisión, sin embargo ni quiebra
      G.nueva(92); G.S.edad = 30; G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal; G.S.p.dinero = -100;
      for (let i = 0; i < 8; i++) { G.S.p.dinero = -100; G.elegir('rentas'); G.avanzarSemana(); limpiar(); }
      out.pequena = !G.S.quiebras && G.S.ultimo.eco.some(([t]) => t.startsWith('Comisión del banco'));
      // Negocio con la caja en negativo: concurso y cierre
      G.nueva(93); G.S.edad = 36; G.S.fase = 'retirado'; G.S.ultimoClub = G.S.clubLocal; G.S.pantalla = 9; G.S.p.dinero = 100000; G.comprarNegocio('peluqueria', 6000);
      const n = G.S.negocios[0]; let concurso = false;
      for (let i = 0; i < 9 && G.S.negocios.length; i++) { n.caja = -5000; G.elegir('rentas'); G.avanzarSemana(); if (G.S.pendiente && G.S.pendiente.tipo === 'concurso') concurso = true; limpiar(); }
      out.concurso = concurso && G.S.negocios.length === 0;
      // Gerente: ajusta la plantilla a la demanda
      G.S.p.dinero = 100000; G.comprarNegocio('peluqueria', 6000); const n2 = G.S.negocios[0]; n2.empleados = G.CFG.negocios.peluqueria.empleadosMax; n2.caja = 50000;
      G.ponerGerente('peluqueria'); G.elegir('rentas'); G.avanzarSemana(); limpiar();
      out.gerente = n2.gerente && n2.empleados < G.CFG.negocios.peluqueria.empleadosMax && n2.ultimo.gerente > 0;
      // Copia de seguridad: exportar y volver a cargar
      const codigo = G.exportarPartida(), sem = G.S.semana, din = G.S.p.dinero;
      G.nueva(94); out.importa = G.importarPartida(codigo) && G.S.semana === sem && G.S.p.dinero === din && !G.importarPartida('basura');
      // Fútbol: pantallas con alternativa a pareja e hijos
      G.nueva(95); G.S.pantalla = 5; G.S.coches = [{ id: 'k1', tipo: 'utilitario', valor: 9000 }];
      out.sinPareja = G.progresoObjetivos().some(([t, v]) => t.includes('coche') && v === 1);
      return out;
    });
    check('Escalada: la pantalla 2 se puede pasar compitiendo, sin ir a la roca', fx.p2Competir, JSON.stringify(fx));
    check('Imprevistos: las opciones que no puedes pagar no se pueden elegir', fx.noPagable, JSON.stringify(fx));
    check('Deudas: de menor las pagan tus padres; si son pequeñas, solo comisión (sin quiebra)', fx.menor && fx.pequena, JSON.stringify(fx));
    check('Negocios: si la caja sigue en negativo, concurso y cierre; el gerente ajusta la plantilla', fx.concurso && fx.gerente, JSON.stringify(fx));
    check('Copia de seguridad: exportar la partida a un código y volver a cargarla', fx.importa, JSON.stringify(fx));
    check('Fútbol: las pantallas de vida tienen alternativa (pareja o coche, hijo o propiedades)', fx.sinPareja, JSON.stringify(fx));
    // Ritmo e interfaz (puntos naranjas del análisis)
    await page.setViewportSize({ width: 320, height: 640 });
    const nj = await page.evaluate(() => {
      const G = __P1, out = {}, limpiar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver('si') || G.resolver('ok') || G.resolver('0') || G.resolver('club') || G.resolver('corto') || G.resolver('seguir'); };
      G.CFG.club.probSuceso = 0; G.CFG.humor.probTitular = 0;
      // Compromisos de patrocinador: como mucho uno cada 5 semanas, aunque tengas muchas marcas
      G.nueva(101, null, 'escalada', 'bloque'); G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar(); G.S.edad = 22; G.S.p.dinero = 5000;
      for (const id of ['tenaja', 'edelrit', 'enueve', 'kombucha', 'tiza']) G.firmarPatro(id);
      const sem = [];
      for (let i = 0; i < 40; i++) { G.S.p.rep = 40; G.S.p.dinero = 5000; G.elegir('descansoEsc'); G.avanzarSemana(); if ([G.S.pendiente].concat(G.S.cola).some(e => e && e.tipo === 'eventoPatro')) sem.push(G.S.semana); limpiar(); }
      out.compromisos = sem.length >= 4 && sem.every((w, i) => !i || w - sem[i - 1] >= 5); out.semCompromisos = sem;
      // Ánimo estable al empezar
      G.nueva(102); const f0 = G.S.p.fel; for (let i = 0; i < 4; i++) { G.elegir('plaza'); G.avanzarSemana(); limpiar(); }
      out.animo = G.S.p.fel >= f0 - 3; out.fel = [f0, G.S.p.fel];
      // Barrio: el ojeador no llega antes de la semana 4
      G.nueva(103); let oj = null; for (let i = 0; i < 10 && !oj; i++) { G.elegir('plaza'); G.avanzarSemana(); if (G.S.pendiente && G.S.pendiente.tipo === 'ojeador') oj = G.S.semana - 1; else limpiar(); }
      out.barrio = oj >= 4; out.oj = oj;
      // Fútbol: las marcas no llaman en tu primera semana en el club
      G.S.pendiente = null; G.S.p.rep = 30; G.S.pendiente = { tipo: 'ojeador', clubId: G.S.mundo.ligas['es-4'][3] }; G.resolver('corto');
      for (let i = 0; i < 4; i++) { limpiar(); G.elegir('descansar'); G.avanzarSemana(); } limpiar();
      G.S.p.rep = 60; let pronto = false; for (let i = 0; i < 2; i++) { G.elegir('normal'); G.avanzarSemana(); if ([G.S.pendiente].concat(G.S.cola).some(e => e && e.tipo === 'patrocinio')) pronto = true; limpiar(); }
      out.noPronto = G.S.fase === 'club' && !pronto;
      // Escalada: retirada obligatoria a los 40
      G.nueva(104, null, 'escalada', 'bloque'); G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar(); G.S.edad = 39; G.S.semanasAño = 17; G.S.p.dinero = 5000;
      G.elegir('descansoEsc'); G.avanzarSemana(); limpiar(); out.retiro40 = G.S.fase === 'retirado' && G.S.edad === 40;
      // De retirado: embajador de marcas y biografía
      G.S.p.rep = 50; const d0 = G.S.p.dinero; G.elegir('embajador'); G.avanzarSemana(); limpiar();
      out.embajador = G.S.ultimo.eco.some(([t, v]) => t.startsWith('Embajador') && v > 0);
      for (let i = 0; i < 6; i++) { G.elegir('biografia'); G.avanzarSemana(); limpiar(); }
      out.biografia = !!G.S.libroPublicado && !!G.S.logros.biografia;
      // Interfaz: pestañas de la tienda visibles y zonas táctiles grandes
      G.nueva(105, null, 'escalada', 'bloque'); G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar(); G.firmarPatro('tenaja'); G.S.hoja = 'avatar'; G.render();
      out.pestanas = [...document.querySelectorAll('.lookTabs button')].every(b => { const r = b.getBoundingClientRect(); return r.right <= window.innerWidth && r.left >= 0; });
      G.S.hoja = null; G.render(); const m = document.querySelector('.escena .marcas');
      out.marcas = !!m && m.getBoundingClientRect().height >= 44;
      return out;
    });
    await page.setViewportSize({ width: 390, height: 844 });
    check('Menos ventanas: un compromiso de patrocinador cada 5 semanas como mucho; másters sin ventana', nj.compromisos && r.masterInv, JSON.stringify(nj));
    check('Ritmo: ánimo estable al empezar, ojeador no antes de la semana 4 y marcas que esperan a verte jugar', nj.animo && nj.barrio && nj.noPronto, JSON.stringify(nj));
    check('Escalada: retirada a los 40; de retirado, embajador de marcas y biografía', nj.retiro40 && nj.embajador && nj.biografia, JSON.stringify(nj));
    check('Interfaz: todas las pestañas de la tienda se ven a 320 px y los logos de la escena se tocan bien (≥ 44 px)', nj.pestanas && nj.marcas, JSON.stringify(nj));
    // Momentos clave: la jugada decisiva cambia el resultado de verdad
    const mo = await page.evaluate(() => {
      const G = __P1, out = { futbol: 0, aciertos: 0, fallos: 0, coherente: true, escalada: 0, sube: 0, baja: 0, escCoherente: true };
      const limpiar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver('si') || G.resolver('ok') || G.resolver('0') || G.resolver('corto') || G.resolver('quedarse'); };
      G.CFG.club.probSuceso = 0; G.CFG.humor.probTitular = 0; G.CFG.momentos.prob = 1; G.CFG.momentos.probGrande = 1;
      G.nueva(111); G.S.p.rep = 30; G.S.pendiente = { tipo: 'ojeador', clubId: G.S.mundo.ligas['es-4'][3] }; G.resolver('corto');
      for (let i = 0; i < 4; i++) { limpiar(); G.elegir('descansar'); G.avanzarSemana(); } limpiar();
      for (let w = 0; w < 80 && out.futbol < 12; w++) {
        G.S.p.energia = 90; G.S.p.nivel = Math.max(G.S.p.nivel, 85); G.S.lesion = 0; G.elegir('normal'); G.avanzarSemana();
        for (let g = 0; G.S.pendiente && g < 20; g++) {
          const ev = G.S.pendiente;
          if (ev.tipo === 'momento') {
            out.futbol++; const T = G.S.temporada, yo = G.S.contrato.clubId, g0 = G.S.stats.goles, pts0 = T.tabla[yo].pts;
            G.resolver(ev.clase === 'ataque' ? 'colocado' : 'cruce');
            const res = G.S.pendiente; out.ventanaResultado = out.ventanaResultado || (res && res.tipo === 'momentoRes');
            const x = T.tabla[yo]; if (x.pts !== 3 * x.g + x.e || x.pj !== x.g + x.e + x.p) out.coherente = false;
            const tot = Object.values(T.tabla); if (tot.reduce((a, t) => a + t.gf, 0) !== tot.reduce((a, t) => a + t.gc, 0)) out.coherente = false;
            if (ev.clase === 'ataque') { if (G.S.stats.goles === g0 + 1) { out.aciertos++; if (x.pts <= pts0) out.coherente = false; } else { out.fallos++; if (x.pts !== pts0) out.coherente = false; } }
            else { if (x.pts === pts0) out.aciertos++; else { out.fallos++; if (x.pts !== pts0 - 2) out.coherente = false; } }
            const e = G.S.log.find(l => l.semana === ev.semana); if (!e || !e.lineas.some(([, t]) => t.includes('Jugada final'))) out.coherente = false;
          } else G.resolver('si') || G.resolver('ok') || G.resolver('aceptar') || G.resolver('quedarse') || G.resolver('0');
        }
      }
      // Escalada: final con la opción arriesgada; puesto, podios y premio cambian juntos
      G.nueva(112, null, 'escalada', 'bloque'); G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar(); G.S.edad = 22;
      for (let i = 0; i < 30; i++) {
        const E = G.S.esc, pod0 = E.podios, d0 = G.S.p.dinero;
        E.palmares.unshift({ año: E.año, n: 'Copa de España de prueba', amb: 'esp', mod: 'bloque', pos: 3, N: 60, ronda: 'final' });
        G.S.pendiente = { tipo: 'momento', dep: 'escalada', clase: 'final', amb: 'esp', mod: 'bloque', pos: 3, nombre: 'Copa de España de prueba', semana: G.S.semana, año: E.año, antes: {} };
        G.resolver('todo'); out.escalada++;
        const p = E.palmares[0].pos;
        if (p === 2) { out.sube++; if (E.podios !== pod0 || G.S.p.dinero <= d0) out.escCoherente = false; }
        else if (p === 4) { out.baja++; if (E.podios !== pod0 - 1 || G.S.p.dinero >= d0) out.escCoherente = false; }
        else out.escCoherente = false;
        limpiar();
      }
      G.CFG.momentos.prob = 0.22; G.CFG.momentos.probGrande = 0.45;
      return out;
    });
    check('Momentos clave en fútbol: la jugada decisiva cambia el marcador, la clasificación y tus goles', mo.futbol >= 5 && mo.aciertos > 0 && mo.fallos > 0 && mo.coherente && mo.ventanaResultado, JSON.stringify(mo));
    check('Momentos clave en escalada: el último bloque de la final cambia el puesto, los podios y el premio', mo.escalada === 30 && mo.sube > 0 && mo.baja > 0 && mo.escCoherente, JSON.stringify(mo));
    // Retos de la semana
    await page.evaluate(() => { const G = __P1; G.CFG.club.probSuceso = 0; G.CFG.humor.probTitular = 0; G.nueva(121); G.S.hoja = null; G.render(); });
    const re0 = await page.evaluate(() => ({ n: __P1.S.retos && __P1.S.retos.lista.length, fila: !!document.querySelector('#retos') }));
    await tap(page, '#retos');
    const re1 = await page.evaluate(() => ({ hoja: __P1.S.hoja, filas: document.querySelectorAll('#hoja .row').length }));
    const re = await page.evaluate(() => {
      const G = __P1, out = {}, limpiar = () => { for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver('ok') || G.resolver('0') || G.resolver('corto') || G.resolver('si'); };
      G.S.hoja = null;
      // Forzamos un reto de ahorro y lo cumplimos
      G.S.retos.lista[0] = { id: 'ahorro', base: { v: G.S.p.dinero, meta: 100 }, hecho: false }; G.S.retos.bonus = false;
      const premio = G.S.retos.premio; G.S.p.dinero += 500; const d0 = G.S.p.dinero;
      G.elegir('plaza'); G.avanzarSemana(); limpiar();
      out.cumplido = G.S.retos.lista[0].hecho === true || G.S.retos.completos >= 1;
      out.premio = G.S.ultimo.eco.some(([t, v]) => t.startsWith('Reto cumplido') && v === premio);
      // Cambian a las 3 semanas y son distintos
      const ids0 = G.S.retos.lista.map(r => r.id).join(), hasta = G.S.retos.hasta;
      for (let i = 0; i < 4; i++) { G.elegir('plaza'); G.avanzarSemana(); limpiar(); }
      out.cambian = G.S.retos.hasta > hasta && G.S.retos.lista.map(r => r.id).join() !== ids0;
      // Cada deporte y etapa tiene los suyos
      G.nueva(122, null, 'escalada', 'bloque'); G.S.pendiente = { tipo: 'equipoEsc' }; G.resolver('club'); limpiar(); G.nuevosRetos();
      out.escalada = G.S.retos.lista.every(r => !G.RETOS[r.id].dep || G.RETOS[r.id].dep === 'escalada') && G.S.retos.lista.length === 3;
      return out;
    });
    check('Retos: 3 retos en el inicio que se abren con un toque', re0.n === 3 && re0.fila && re1.hoja === 'retos' && re1.filas === 3, JSON.stringify([re0, re1]));
    check('Retos: cumplir uno da su premio; cambian cada 3 semanas; cada deporte tiene los suyos', re.cumplido && re.premio && re.cambian && re.escalada, JSON.stringify(re));

    // Vidas completas de escalada
    const vidas = await page.evaluate(() => {
      const G = __P1; G.silencio = true; G.CFG.club.probSuceso = 0.45;
      function vida(seed, fuerte, roca) {
        G.nueva(seed, null, 'escalada', fuerte); const S = () => G.S; const L = { p5: null, nac: null };
        for (let w = 0; w < 3000 && S().edad < 34; w++) {
          const ev = S().pendiente;
          if (ev) { if (ev.tipo === 'equipoEsc') G.resolver(S().p.nivel >= 30 ? 'centro' : 'club'); else if (ev.tipo === 'patrocinio' || ev.tipo === 'suceso') G.resolver('0'); else if (ev.tipo === 'nacional') { L.nac = L.nac || S().edad; G.resolver('si'); } else if (ev.tipo === 'invitacion' || ev.tipo === 'eventoPatro') G.resolver('si'); else G.resolver('ok'); continue; }
          const s = S(), E = s.esc;
          if (s.pantalla >= 5 && !L.p5) L.p5 = s.edad;
          if (s.fase !== 'rocodromo') for (const [k, T] of Object.entries(G.CFG.negocios)) if (!G.bloqueoNegocio(k) && s.p.dinero > T.precio + T.cajaOpciones[1] + 3000) G.comprarNegocio(k, T.cajaOpciones[1]);
          for (const n of s.negocios) if (n.caja < 0 && s.p.dinero > 1000) G.traspasar(n.tipo, 'aCaja');
          if (s.fase === 'escalador' && s.edad >= 31) G.retirarseYa();
          let a;
          if (s.fase === 'rocodromo') a = s.p.energia < 35 ? 'descansoEsc' : (s.semana % 3 ? 'amigos' : 'resistencia');
          else if (s.fase === 'escalador') {
            if (s.lesion) a = 'fisioEsc'; else if (s.p.energia < 35 || E.carga > 60) a = 'descansoEsc';
            else a = (roca ? ['roca', 'roca', 'tabla', 'resistencia', 'tecnica'] : ['rocoBloque', 'tabla', 'resistencia', 'velocidad', 'tecnica', 'roca'])[s.semana % (roca ? 5 : 6)];
            if (s.p.dinero < 100) a = s.edad >= 18 ? 'monitor' : 'ayudar';
          } else a = s.negocios.length ? 'gestionar' : 'entrenadorEsc';
          G.elegir(a) || G.elegir('descansoEsc');
          if (!G.avanzarSemana() && !S().pendiente) break;
        }
        const s = S();
        return { seed, edad: s.edad, pantalla: s.pantalla, p5: L.p5, nac: L.nac, via: s.esc.maxVia, nivel: s.p.nivel, rep: s.p.rep, comps: s.esc.comps, pat: Math.round(G.patrimonio()), fase: s.fase };
      }
      return [vida(21, 'bloque', false), vida(22, 'dificultad', true), vida(23, 'velocidad', false)];
    });
    console.log('      Vidas de escalada:', JSON.stringify(vidas));
    check('Escalada: tres vidas simuladas hasta los 34 años sin errores ni atascos', vidas.every(v => v.edad >= 34 && v.fase === 'retirado'));
    check('Escalada: se progresa por pantallas (todas superan la 5 antes de los 30)', vidas.every(v => v.p5 && v.p5 < 30), vidas.map(v => `pantalla 5 a los ${v.p5}`).join(', '));
    check('Escalada: nadie llega a la élite sin esfuerzo (nivel máximo < 92) y todos compiten', vidas.every(v => v.nivel < 92 && v.comps > 20));
    check('Escalada: sin errores de JavaScript', errors.length === 0, errors.join(' | '));
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
