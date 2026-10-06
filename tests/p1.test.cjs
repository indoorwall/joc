// Pruebas automáticas del prototipo P1 (gestión y decisiones, v0.3).
// Ejecución: node tests/p1.test.cjs   (necesita Playwright con Chromium instalado)
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
async function shot(page, name) { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png') }); }

(async () => {
  const browser = await chromium.launch();
  const iphone = { ...devices['iPhone 13'] };
  delete iphone.defaultBrowserType;

  /* ---------- 1. Presentación y bucle de una semana con toques ---------- */
  {
    const { ctx, page, errors, requests } = await openPage(browser, iphone);
    await shot(page, '00_intro');
    check('Primera vez: aparece la presentación', (await page.locator('#btnEmpezar').count()) === 1 && (await st(page)).intro === true);
    await page.locator('#nombre').fill('Leo');
    await tap(page, '[data-act=avatar][data-v="🧑🏾"]');
    await tap(page, '[data-act=posicion][data-v=medio]');
    await tap(page, '#btnEmpezar');
    const si = await st(page);
    check('Al empezar se guardan nombre, personaje y posición', !si.intro && si.nombre === 'Leo' && si.avatar === '🧑🏾' && si.posicion === 'medio' && (await page.locator('#top').textContent()).includes('Leo'));
    await page.evaluate(() => { __P1.nueva(7); __P1.CFG.club.probSuceso = 0; });
    await shot(page, '01_barrio');
    check('Empieza en el barrio con 17 años', (await st(page)).fase === 'barrio' && (await st(page)).edad === 17);
    check('Se ve la misión actual', (await page.locator('#objetivo h3').textContent()).includes('ojeador'));
    check('Sin elegir, «Jugar semana» está desactivado', await page.locator('#btnAvanzar').isDisabled());
    await tap(page, '[data-act=elegir][data-id=plaza]');
    check('Al tocar una carta queda seleccionada', (await page.locator('.opt.sel').count()) === 1 && !(await page.locator('#btnAvanzar').isDisabled()));
    const rep0 = (await st(page)).p.rep;
    await tap(page, '#btnAvanzar');
    const s1 = await st(page);
    check('Jugar la semana muestra resultados explicados', s1.verResultado && (await page.locator('#resultado').count()) === 1 && (await page.locator('.res-line .r').count()) >= 2);
    check('El partido en la plaza sube reputación', s1.p.rep > rep0, `${rep0} → ${s1.p.rep}`);
    await tap(page, '#btnContinuar');
    check('Continuar vuelve a la semana 2', (await st(page)).semana === 2 && !(await st(page)).verResultado);
    const layout = await page.evaluate(() => ({
      over: document.documentElement.scrollWidth > window.innerWidth,
      minH: Math.min(...[...document.querySelectorAll('.opt, .btn, nav button')].map(b => b.getBoundingClientRect().height)),
    }));
    check('Sin desplazamiento horizontal a 390 px', !layout.over);
    check('Botones de al menos 44 px de alto', layout.minH >= 44, `mínimo ${Math.round(layout.minH)} px`);
    const txt = await page.evaluate(() => document.body.innerText);
    check('Los importes se muestran en euros', txt.includes('€') && !/\d cr\b/.test(txt));
    check('Sin errores de JavaScript', errors.length === 0, errors.join(' | '));
    check('Sin peticiones externas', requests.every(u => u.startsWith('file:')), requests.filter(u => !u.startsWith('file:')).join(', '));
    await ctx.close();
  }

  /* ---------- 2. Una temporada entera jugando con toques ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, iphone);
    await page.evaluate(() => __P1.nueva(11));
    const log = {}, vistos = {};
    let marcador = false, prensa = false, liga = null, estadioOk = null, ofertasInicio = null, sucesoOk = false;
    for (let i = 0; i < 400 && !log.fin2; i++) {
      const s = await st(page);
      if (s.verResultado) {
        if (s.ultimo.opo.some(([h]) => h.startsWith('Mercado de invierno'))) log.invierno = s.ultimo.opo.find(([h]) => h.startsWith('Mercado de invierno'))[0];
        if (s.ultimo.partido && !marcador) {
          marcador = (await page.locator('.board .score').count()) === 1 && (await page.locator('.board').textContent()).includes('espectadores');
          prensa = (await page.locator('.paper p').count()) >= 1;
          await shot(page, '04_partido');
        }
        await tap(page, '#btnContinuar'); continue;
      }
      if (s.pendiente) {
        const t = s.pendiente.tipo, v = s.pendiente.ventana;
        if (!vistos[t + (v || '')]) { await shot(page, `03_evento_${t}${v ? '_' + v : ''}`); vistos[t + (v || '')] = 1; }
        if (t === 'ojeador') { log.ojeador = s.semana; await tap(page, '[data-act=resolver][data-v=corto]'); }
        else if (t === 'ofertas') {
          if (v === 'inicio') {
            ofertasInicio = s.pendiente.ofertas;
            log.ofertas = s.semana;
            await tap(page, '[data-act=resolver][data-v="0"]');
          } else {
            log['mercado_' + v] = s.semana;
            if (await page.locator('[data-act=resolver][data-v=quedarse]').count()) await tap(page, '[data-act=resolver][data-v=quedarse]');
            else await tap(page, '[data-act=resolver][data-v="0"]');
          }
        } else if (t === 'mejora') { log.mejora = s.semana; await tap(page, '[data-act=resolver][data-v=aceptar]'); }
        else if (t === 'suceso') {
          const antes = s;
          await tap(page, '[data-act=resolver][data-v="0"]');
          const d = await st(page);
          if (JSON.stringify(antes.p) !== JSON.stringify(d.p) || antes.mods.length !== d.mods.length || antes.agenda.length !== d.agenda.length || JSON.stringify(antes.negocio) !== JSON.stringify(d.negocio)) sucesoOk = true;
          log.suceso = (log.suceso || 0) + 1;
        } else if (t === 'fin') {
          if (!log.fin) { log.fin = s.semana; log.finInfo = { pos: s.pendiente.pos, zona: s.pendiente.zona }; } else log.fin2 = s.semana;
          await tap(page, '[data-act=resolver][data-v=ok]');
        } else await tap(page, '[data-act=resolver][data-v=ok]');
        continue;
      }
      if (s.fase === 'club' && liga === null) {
        await tap(page, 'nav [data-v=liga]');
        await shot(page, '05_liga');
        liga = { filas: await page.locator('table.liga tr:not(.hd)').count(), yo: await page.locator('table.liga tr.yo').count() };
        await tap(page, 'nav [data-v=semana]');
        const cap = await page.evaluate(() => __P1.club(__P1.S.contrato.clubId).cap);
        const svgId = await page.evaluate(() => (document.querySelector('.scene svg linearGradient') || {}).id);
        estadioOk = (cap < 3000 && svgId === 'skP') || (cap >= 3000 && cap < 15000 && svgId === 'skM') || (cap >= 15000 && svgId === 'skC');
        await shot(page, '06_carrera_club');
      }
      let pick;
      if (s.fase === 'barrio') pick = s.p.energia < 40 ? 'descansar' : 'plaza';
      else if (s.fase === 'prep') pick = s.p.energia < 45 ? 'descansar' : s.p.dinero >= 90 ? 'entrenador' : 'trabajar';
      else pick = s.lesion ? 'reposo' : s.p.energia < 45 ? 'reposo' : 'extra';
      await tap(page, `[data-act=elegir][data-id=${pick}]`);
      await tap(page, '#btnAvanzar');
    }
    check('Aparece el ojeador de un club de 4ª división', !!log.ojeador, `semana ${log.ojeador}`);
    check('Tras las pruebas: dos ofertas de clubes pequeños españoles con condiciones distintas', ofertasInicio && ofertasInicio.length === 2 && ofertasInicio[0].familia && !ofertasInicio[1].familia && ofertasInicio[1].salario > ofertasInicio[0].salario && ofertasInicio[1].vida > ofertasInicio[0].vida);
    check('El estadio dibujado corresponde al aforo del club', estadioOk === true);
    check('Pestaña Liga: clasificación de 10 equipos con tu club marcado', liga && liga.filas === 10 && liga.yo === 1, JSON.stringify(liga));
    check('Resultado del partido: marcador, estadio y público', marcador);
    check('Hay noticias de prensa cada jornada', prensa);
    check('Mercado de invierno tras la jornada 9 (con ofertas o aviso)', !!log.invierno, log.invierno);
    check('Llega la oportunidad de mejorar el contrato', !!log.mejora, `semana ${log.mejora}`);
    check('Fin de temporada con clasificación final', !!log.fin, `semana ${log.fin}, ${JSON.stringify(log.finInfo)}`);
    check('Se juega una segunda temporada completa', !!log.fin2, `semana ${log.fin2}`);
    check('Hay imprevistos y sus opciones tienen efecto', log.suceso > 0 && sucesoOk, `${log.suceso} imprevistos`);
    const s = await st(page);
    check('La edad sube con cada temporada', s.edad === 19, `${s.edad} años`);

    // Despeja con toques lo que quede pendiente (resultados, mercado de verano...)
    async function despejar() {
      let s2 = await st(page);
      while (s2.verResultado || s2.pendiente) {
        if (s2.verResultado) await tap(page, '#btnContinuar');
        else if (s2.pendiente.tipo === 'ofertas') await tap(page, (await page.locator('[data-act=resolver][data-v=quedarse]').count()) ? '[data-act=resolver][data-v=quedarse]' : '[data-act=resolver][data-v="0"]');
        else await tap(page, `[data-act=resolver][data-v="${s2.pendiente.tipo === 'mejora' ? 'aceptar' : ['fin', 'meta'].includes(s2.pendiente.tipo) ? 'ok' : '0'}"]`);
        s2 = await st(page);
      }
      return s2;
    }
    await despejar();
    // Negocio: se da dinero para no jugar 60 semanas más en la prueba de interfaz
    await page.evaluate(() => { __P1.S.p.dinero = 31000; __P1.render(); });
    await tap(page, 'nav [data-v=negocio]');
    await tap(page, '[data-act=caja][data-v="5000"]');
    await tap(page, '[data-act=comprar]');
    const d = await st(page);
    check('Se compra la peluquería: dinero −(traspaso + caja) y caja = la elegida', d.negocio && d.negocio.caja === 5000 && d.p.dinero === 31000 - 30000);
    await tap(page, '[data-act=neg][data-c=empleados][data-v="1"]');
    await tap(page, '[data-act=neg][data-c=sueldo][data-v=bueno]');
    await tap(page, '[data-act=neg][data-c=precio][data-v=premium]');
    const d2 = await st(page);
    check('Personal, sueldo y precio se cambian desde la interfaz (contratar sale de la caja)', d2.negocio.empleados === 2 && d2.negocio.sueldo === 'bueno' && d2.negocio.precio === 'premium' && d2.negocio.caja === 4700 && d2.p.dinero === d.p.dinero);
    await shot(page, '07_negocio');
    await tap(page, 'nav [data-v=semana]');
    let separacion = true;
    for (let k = 0; k < 6; k++) {
      const s2 = await despejar();
      await tap(page, `[data-act=elegir][data-id=${s2.lesion || s2.p.energia < 45 ? 'reposo' : 'normal'}]`);
      await tap(page, '#btnAvanzar');
      const post = await st(page);
      if (post.p.dinero - s2.p.dinero !== post.ultimo.eco.reduce((a, [, v]) => a + v, 0)) separacion = false;
      if (post.negocio.caja - s2.negocio.caja !== post.ultimo.negocio.resultado) separacion = false;
    }
    check('El dinero personal y la caja del negocio no se mezclan', separacion);
    await shot(page, '08_resultado_negocio');
    await despejar();
    await tap(page, 'nav [data-v=finanzas]');
    await shot(page, '09_finanzas');
    const pat = await page.evaluate(() => ({ v: __P1.patrimonio(), s: __P1.S }));
    check('Patrimonio = dinero + caja + valor del negocio', pat.v === pat.s.p.dinero + pat.s.negocio.caja + Math.round(25000 * (0.5 + pat.s.negocio.fama / 100)));
    const antes = await st(page);
    await page.reload();
    const despues = await st(page);
    check('La partida (con el mundo y la liga) se guarda y se recupera', despues.semana === antes.semana && despues.p.dinero === antes.p.dinero && !!despues.negocio && JSON.stringify(despues.temporada.tabla) === JSON.stringify(antes.temporada.tabla));
    await tap(page, 'nav [data-v=finanzas]');
    await tap(page, '#btnReiniciar');
    check('Reiniciar pide confirmación (un toque no borra)', (await st(page)).semana === antes.semana);
    await tap(page, '#btnReiniciar');
    const r = await st(page);
    check('El segundo toque reinicia la partida (vuelve a la presentación)', r.semana === 1 && r.fase === 'barrio' && !r.negocio && r.intro);
    await page.reload();
    check('El reinicio también borra el guardado', (await st(page)).semana === 1);
    for (const w of [320, 375]) {
      await page.setViewportSize({ width: w, height: 640 });
      await page.evaluate(() => { __P1.nueva(11); });
      const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (over) check(`Sin desplazamiento horizontal a ${w} px`, false);
    }
    check('Sin errores de JavaScript en la temporada completa', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 3. Reglas (sin interfaz) ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, { viewport: { width: 390, height: 800 } });
    const r = await page.evaluate(() => {
      const G = __P1, out = {};
      G.CFG.club.probSuceso = 0;
      const semana = a => { if (G.S.verResultado) G.continuar(); if (!G.elegir(a)) G.elegir(G.disponible('reposo') ? 'reposo' : 'normal'); const ok = G.avanzarSemana(); G.continuar(); return ok; };
      function alClub(seed, idx) {
        G.nueva(seed);
        G.S.p.rep = 30; G.S.pendiente = { tipo: 'ojeador', clubId: G.S.mundo.ligas['es-4'][3] }; G.resolver('corto');
        for (let i = 0; i < 3; i++) semana('descansar');
        G.continuar();
        G.resolver(String(idx));
      }

      // Mundo
      G.nueva(3);
      const M = G.S.mundo, paises = Object.keys(G.CFG.paises);
      out.paises = paises.length;
      out.ligas = Object.keys(M.ligas).length;
      out.diez = Object.values(M.ligas).every(l => l.length === 10);
      out.nombresUnicos = paises.every(p => { const n = Object.values(M.clubs).filter(c => c.pais === p).map(c => c.nombre); return new Set(n).size === n.length; });
      out.fuerzaPorDivision = paises.every(p => G.CFG.paises[p].ligas.every((L, i) => i === 0 || L.fuerza < G.CFG.paises[p].ligas[i - 1].fuerza));
      out.estadiosPorDivision = paises.every(p => G.CFG.paises[p].ligas.every((L, i) => M.ligas[`${p}-${i + 1}`].every(id => M.clubs[id].cap >= L.cap[0] - 50 && M.clubs[id].cap <= L.cap[1] + 50)));

      // Calendario: 18 jornadas, todos contra todos dos veces
      alClub(5, 0);
      const T = G.S.temporada, cuenta = {};
      for (const ronda of T.cal) for (const [h, a] of ronda) { const k = [h, a].sort().join('-'); cuenta[k] = (cuenta[k] || 0) + 1; }
      out.calendario = T.cal.length === 18 && T.cal.every(r => r.length === 5) && Object.values(cuenta).every(v => v === 2) && Object.keys(cuenta).length === 45;
      out.primerClub = G.S.contrato.clubId === G.S.clubLocal && G.ligaDe(G.S.contrato.clubId).key === 'es-5' && G.S.contrato.vida === G.CFG.club.gastosFamilia;

      // Determinismo
      alClub(5, 1); for (let i = 0; i < 6; i++) { semana('normal'); for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver(G.S.pendiente.tipo === 'mejora' ? 'aceptar' : 'quedarse') || G.resolver('ok') || G.resolver('0'); }
      const a = JSON.stringify([G.S.p, G.S.temporada.tabla]);
      alClub(5, 1); for (let i = 0; i < 6; i++) { semana('normal'); for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver(G.S.pendiente.tipo === 'mejora' ? 'aceptar' : 'quedarse') || G.resolver('ok') || G.resolver('0'); }
      out.determinista = a === JSON.stringify([G.S.p, G.S.temporada.tabla]);

      // Impuestos por tramos
      alClub(2, 1);
      G.S.p.energia = 90; semana('normal');
      const imp = G.S.ultimo.eco.find(([t]) => t.startsWith('Impuestos'));
      out.impuestos = !!imp && imp[1] < 0 && G.S.ultimo.eco.some(([t]) => t.startsWith('Gastos de vida'));

      // Fin de temporada: ascenso, prima y subida de sueldo
      alClub(4, 0);
      const yo = G.S.contrato.clubId;
      G.club(yo).fuerza = 70; G.S.p.nivel = 70; G.S.p.energia = 90;  // equipo muy superior a su liga
      const sal0 = G.S.contrato.salario, din0 = G.S.p.dinero;
      let fin = null;
      for (let i = 0; i < 18; i++) {
        semana('normal');
        for (let g = 0; G.S.pendiente && g < 20; g++) {
          const e = G.S.pendiente;
          if (e.tipo === 'fin') fin = JSON.parse(JSON.stringify(e));
          G.resolver(e.tipo === 'mejora' ? 'aceptar' : e.tipo === 'ofertas' ? (e.ofertas.some(o => o.clubId === yo) ? String(e.ofertas.findIndex(o => o.clubId === yo)) : 'quedarse') : e.tipo === 'fin' ? 'ok' : '0');
        }
      }
      out.fin = fin && fin.zona === 'ascenso' && fin.pos <= 2;
      out.subeDivision = G.ligaDe(yo).key === 'es-4';
      out.subidaSueldo = G.S.contrato.salario >= Math.round(sal0 * 1.5 / 10) * 10 - 10;
      out.primaAscenso = fin && fin.primas.some(p => p.includes('Prima por ascenso'));
      out.nuevaTemporada = G.S.temporada.jornada === 0 && G.S.temporada.año === 2027 && G.S.edad === 18;
      out.ligasSiguen10 = Object.values(G.S.mundo.ligas).every(l => l.length === 10);

      // Mercado: ofertas solo de clubes adecuados a tu nivel y reputación
      G.S.p.nivel = 55; G.S.p.rep = 20;
      const ofs = G.generarOfertas(10);
      out.mercado = ofs.length > 0 && ofs.every(o => { const c = G.club(o.clubId); return 55 - c.fuerza >= -5 && 55 - c.fuerza <= 12; });
      G.S.p.rep = 0;
      out.mercadoReputacion = G.generarOfertas(10).every(o => G.ligaDe(o.clubId).pais === 'es' && G.ligaDe(o.clubId).tier >= 4);

      // Lesiones: jugar agotado puede lesionar; descansado, no
      let lesBaja = 0, lesAlta = 0;
      for (let seed = 1; seed <= 30; seed++) {
        alClub(seed, 1); G.S.p.nivel = 80; G.S.p.energia = 15; G.elegir('patrocinio'); G.avanzarSemana(); if (G.S.lesion > 0) lesBaja++;
        alClub(seed, 1); G.S.p.nivel = 80; G.S.p.energia = 90; G.elegir('normal'); G.avanzarSemana(); if (G.S.lesion > 0) lesAlta++;
      }
      out.lesiones = { lesBaja, lesAlta };

      // El patrocinio puede costar la titularidad
      alClub(3, 1); const u = G.umbralTitular(); G.S.p.energia = 60; G.S.p.nivel = u - 15 + 3; // selección = umbral + 3
      G.elegir('patrocinio'); G.avanzarSemana(); out.patrocinioBanquillo = G.S.ultimo.partido.rol !== 'titular';
      alClub(3, 1); G.S.p.energia = 70; G.S.p.nivel = u - 17.5 + 3; G.elegir('normal'); G.avanzarSemana(); out.normalTitular = G.S.ultimo.partido.rol === 'titular';

      // Negociar al alza
      let okAlta = 0, okBaja = 0, tension = 0;
      for (let seed = 1; seed <= 30; seed++) for (const rep of [80, 10]) {
        alClub(seed, 1); G.S.p.rep = rep; G.S.pendiente = { tipo: 'mejora', oferta: { salario: 200, temporadas: 2 } }; G.resolver('pedir');
        const ok = G.S.contrato.salario === 240;
        if (ok && rep === 80) okAlta++; if (ok && rep === 10) okBaja++;
        if (!ok && G.S.mods.some(m => m.motivo === 'relación tensa con el club')) tension++;
      }
      out.pedir = { okAlta, okBaja, tension };
      alClub(2, 1); const d0 = G.S.p.dinero;
      G.S.pendiente = { tipo: 'mejora', oferta: { salario: 200, temporadas: 2 } }; G.resolver('largo');
      out.largo = G.S.contrato.salario === 180 && G.S.p.dinero === d0 + 720 - Math.round(720 * 0.15) && G.S.contrato.temporadasRestantes === 4;

      // Sucesos: préstamo con devolución programada, mods de selección
      alClub(6, 1); const p0 = G.S.p.dinero;
      G.S.pendiente = { tipo: 'suceso', id: 'prestamo' }; G.resolver('0');
      const ag = G.S.agenda[0];
      out.prestamo = G.S.p.dinero === p0 - 200 && ag && ag.importe === 200;
      let devuelto = false;
      for (let i = 0; i < 5; i++) { semana('normal'); for (let g = 0; G.S.pendiente && g < 20; g++) G.resolver(G.S.pendiente.tipo === 'mejora' ? 'aceptar' : '0') || G.resolver('quedarse') || G.resolver('ok'); if (G.S.ultimo.eco.some(([t]) => t.includes('préstamo'))) devuelto = true; }
      out.prestamoResuelto = G.S.agenda.length === 0 && devuelto === ag.devuelve;
      G.S.pendiente = { tipo: 'suceso', id: 'cena' }; G.resolver('0');
      out.cena = G.S.mods.some(m => m.tipo === 'sel' && m.v === 3);

      // Negocio
      function conNegocio(seed, conf) {
        alClub(seed, 1); G.S.p.dinero = 40000; G.comprarNegocio(5000); Object.assign(G.S.negocio, conf);
        semana('normal'); G.continuar(); return G.S.negocio;
      }
      let n = conNegocio(1, { precio: 'premium', fama: 40, empleados: 2, sueldo: 'bueno' });
      out.premiumBajaFama = n.fama === 38;
      n = conNegocio(1, { precio: 'premium', fama: 70, empleados: 2, sueldo: 'bueno' });
      out.premiumAltaFama = n.fama === 71;
      n = conNegocio(1, { precio: 'economico', fama: 60, empleados: 1, sueldo: 'basico' });
      out.colas = n.ultimo.perdidos > 5 && n.fama === 60 + 1 - 1 - 2;
      n = conNegocio(1, { precio: 'normal', fama: 40, empleados: 4, sueldo: 'bueno', caja: -3000 });
      out.impago = n.caja < 0 && n.ultimo.fam.some(([dd]) => dd === -5);
      // Fuera de España, ir a la peluquería cuesta el viaje
      const enEs = G.ACCIONES.visitaNegocio.fx(G.S).some(([ic]) => ic === '€');
      out.viaje = !enEs;

      // Bloqueos
      G.nueva(9); G.S.pendiente = { tipo: 'ojeador', clubId: G.S.mundo.ligas['es-4'][0] }; G.resolver('corto'); G.S.p.dinero = 10;
      out.entrenadorBloqueado = !G.elegir('entrenador');
      alClub(9, 1); G.S.lesion = 2;
      out.lesionBloquea = !G.elegir('extra') && !G.elegir('normal') && G.elegir('reposo');
      G.nueva(4); out.sinDecision = !G.avanzarSemana();
      G.S.pendiente = { tipo: 'ojeador', clubId: 'c0' }; G.S.eleccion = 'plaza'; out.conEvento = !G.avanzarSemana();
      // Quedarse no es posible si el contrato ha terminado
      alClub(8, 1); G.S.contrato.temporadasRestantes = 0; G.S.pendiente = { tipo: 'ofertas', ventana: 'verano', ofertas: [] };
      out.sinContrato = !G.resolver('quedarse');
      return out;
    });
    check('Mundo: 6 países y 21 divisiones de 10 clubes', r.paises === 6 && r.ligas === 21 && r.diez, `${r.paises} países, ${r.ligas} divisiones`);
    check('Nombres de club únicos y fuerza decreciente por división', r.nombresUnicos && r.fuerzaPorDivision);
    check('El aforo de cada estadio corresponde a su división', r.estadiosPorDivision);
    check('Calendario: 18 jornadas, todos contra todos ida y vuelta', r.calendario);
    check('El club del barrio está en la 5ª división y vives con tu familia', r.primerClub);
    check('Mismas decisiones y semilla → mismos resultados', r.determinista);
    check('El sueldo paga impuestos por tramos y hay gastos de vida', r.impuestos);
    check('Fin de temporada: un equipo muy superior asciende', r.fin && r.subeDivision);
    check('Prima por ascenso y subida de sueldo por cláusula', r.primaAscenso && r.subidaSueldo);
    check('Nueva temporada: jornada 0, año siguiente y un año más de edad', r.nuevaTemporada);
    check('Tras ascensos y descensos todas las divisiones siguen con 10 clubes', r.ligasSiguen10);
    check('Mercado: solo clubes acordes a tu nivel', r.mercado);
    check('Sin reputación solo te quieren clubes modestos españoles', r.mercadoReputacion);
    check('Jugar agotado puede lesionar; descansado, no', r.lesiones.lesBaja > 3 && r.lesiones.lesAlta === 0, JSON.stringify(r.lesiones));
    check('El patrocinio puede costar la titularidad (−8 en la selección)', r.patrocinioBanquillo && r.normalTitular);
    check('Pedir más: depende de la reputación y fallar crea tensión', r.pedir.okAlta > r.pedir.okBaja && r.pedir.tension > 0, JSON.stringify(r.pedir));
    check('Contrato largo: −10 % sueldo, prima de 4 semanas (con impuestos), +2 temporadas', r.largo);
    check('Imprevistos: el préstamo se devuelve (o no) a las 4 semanas', r.prestamo && r.prestamoResuelto);
    check('Imprevistos: la cena del equipo da +3 en la selección', r.cena);
    check('Negocio: premium con poca fama pierde fama; con fama alta, no', r.premiumBajaFama && r.premiumAltaFama);
    check('Negocio: clientes sin atender y caja negativa restan fama', r.colas && r.impago);
    check('Acciones bloqueadas cuando no se cumplen requisitos', r.entrenadorBloqueado && r.lesionBloquea);
    check('No se avanza sin decisión ni con un evento pendiente', r.sinDecision && r.conEvento);
    check('Con el contrato terminado hay que firmar (no se puede «seguir»)', r.sinContrato);
    check('Sin errores de JavaScript en las reglas', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 4. Carreras completas y equilibrio ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, { viewport: { width: 390, height: 800 } });
    const sim = await page.evaluate(() => {
      const G = __P1;
      function play(seed, st) {
        G.nueva(seed, st.pos); const S = () => G.S; const L = { meta: null, compra: null, ascensos: 0, paises: new Set(), ligaMax: 9 };
        for (let w = 0; w < 900 && S().semana <= 260; w++) {
          if (S().verResultado) G.continuar();
          const ev = S().pendiente;
          if (ev) {
            if (ev.tipo === 'ojeador') G.resolver('corto');
            else if (ev.tipo === 'ofertas') {
              let best = 0, bv = -1e9;
              ev.ofertas.forEach((o, i) => { const v = st.valor(o, G.ligaDe(o.clubId).tier); if (v > bv) { bv = v; best = i; } });
              G.resolver(String(best));
            } else if (ev.tipo === 'mejora') G.resolver(st.mejora);
            else if (ev.tipo === 'fin') { if (ev.zona === 'ascenso' || ev.zona === 'campeon') L.ascensos++; G.resolver('ok'); }
            else if (ev.tipo === 'meta') { L.meta = S().semana; G.resolver('ok'); break; }
            else G.resolver('0');
            continue;
          }
          const s = S();
          if (s.fase === 'club') { L.paises.add(G.club(s.contrato.clubId).pais); L.ligaMax = Math.min(L.ligaMax, G.ligaDe(s.contrato.clubId).tier); }
          if (s.fase === 'club' && !s.negocio && s.p.dinero >= 25000 + st.caja) { G.comprarNegocio(st.caja); L.compra = s.semana; if (st.neg) st.neg(G); }
          let a;
          if (s.fase === 'barrio') a = s.p.energia < 40 ? 'descansar' : 'plaza';
          else if (s.fase === 'prep') a = s.prep.semanasRestantes === 1 && s.p.energia < 70 ? 'descansar' : s.p.energia < 35 ? 'descansar' : s.p.dinero >= 90 ? 'entrenador' : s.p.energia > 60 ? 'entrenarSolo' : 'trabajar';
          else a = st.pick(s);
          if (!G.elegir(a)) G.elegir(G.disponible('reposo') ? 'reposo' : G.disponible('normal') ? 'normal' : 'patrocinio');
          if (!G.avanzarSemana()) break;
        }
        return { meta: L.meta, compra: L.compra, nivel: S().p.nivel, fama: S().negocio ? S().negocio.fama : 0, edad: S().edad };
      }
      const neto = o => o.salario * 0.8 - o.vida;
      const strats = {
        crecer: { pos: 'delantero', mejora: 'pedir', caja: 5000, valor: (o, t) => -t * 1000 + neto(o), pick: s => s.lesion ? 'reposo' : s.p.energia < 40 ? (s.p.dinero >= 60 ? 'fisio' : 'reposo') : 'extra' },
        dinero: { pos: 'medio', mejora: 'largo', caja: 2000, valor: o => neto(o) + o.fichaje / 20, pick: s => s.lesion ? 'reposo' : s.semana % 3 === 0 ? 'patrocinio' : s.p.energia < 45 ? 'reposo' : 'normal' },
        empresario: { pos: 'defensa', mejora: 'aceptar', caja: 9000, valor: (o, t) => -t * 300 + neto(o) + (o.familia ? 200 : 0), neg: G => { G.cambiarNegocio('sueldo', 'bueno'); G.cambiarNegocio('empleados', 1); },
          pick: s => s.lesion ? 'reposo' : s.negocio && s.negocio.fama < 70 && s.semana % 2 ? 'visitaNegocio' : s.p.energia < 45 ? 'reposo' : 'normal' },
      };
      const out = {};
      for (const [k, st] of Object.entries(strats)) {
        const runs = [1, 2, 3].map(seed => play(seed, st));
        const m = f => runs.reduce((a, r) => a + f(r), 0) / runs.length;
        out[k] = { meta: m(r => r.meta || 999), compra: m(r => r.compra || 999), nivel: r1(m(r => r.nivel)), fama: r1(m(r => r.fama)), todas: runs.every(r => r.meta) };
      }
      return out;
      function r1(v) { return Math.round(v * 10) / 10; }
    });
    console.log('      Equilibrio (media de 3 carreras):', JSON.stringify(sim));
    const best = m => Object.entries(sim).sort((a, b) => (m === 'meta' ? a[1][m] - b[1][m] : b[1][m] - a[1][m]))[0][0];
    check('Todas las estrategias de prueba alcanzan la meta antes de 260 semanas', Object.values(sim).every(x => x.todas));
    check('Ninguna estrategia gana en todo (meta antes / más nivel / más fama del negocio)',
      new Set([best('meta'), best('nivel'), best('fama')]).size > 1, `meta: ${best('meta')}, nivel: ${best('nivel')}, fama: ${best('fama')}`);
    check('Sin errores de JavaScript en las carreras simuladas', errors.length === 0, errors.join(' | '));
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
