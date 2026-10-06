// Pruebas automáticas del prototipo P1 (gestión y decisiones).
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
async function shot(page, name) { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true }); }

(async () => {
  const browser = await chromium.launch();
  const iphone = { ...devices['iPhone 13'] };
  delete iphone.defaultBrowserType;

  /* ---------- 1. Interfaz táctil: bucle de una semana ---------- */
  {
    const { ctx, page, errors, requests } = await openPage(browser, iphone);
    await page.evaluate(() => __P1.nueva(7));
    await shot(page, '01_barrio');
    check('Empieza en el barrio, semana 1', (await st(page)).fase === 'barrio' && (await st(page)).semana === 1);
    check('Se ve el objetivo actual', (await page.locator('#objetivo h3').textContent()).includes('ojeador'));
    check('Sin elegir, «Avanzar semana» está desactivado', await page.locator('#btnAvanzar').isDisabled());
    await tap(page, '[data-act=elegir][data-id=plaza]');
    check('Al tocar una decisión queda seleccionada', (await page.locator('.opt.sel').count()) === 1 && !(await page.locator('#btnAvanzar').isDisabled()));
    const rep0 = (await st(page)).p.rep;
    await tap(page, '#btnAvanzar');
    await shot(page, '02_resultado');
    const s1 = await st(page);
    check('Avanzar muestra resultados explicados', s1.verResultado && (await page.locator('#resultado').count()) === 1 && (await page.locator('.res-line .r').count()) >= 2);
    check('El partido en la plaza sube reputación', s1.p.rep > rep0, `${rep0} → ${s1.p.rep}`);
    await tap(page, '#btnContinuar');
    check('Continuar vuelve a la semana 2', (await st(page)).semana === 2 && !(await st(page)).verResultado);

    // Sin desbordamiento horizontal y botones grandes
    const layout = await page.evaluate(() => ({
      over: document.documentElement.scrollWidth > window.innerWidth,
      minH: Math.min(...[...document.querySelectorAll('.opt, .btn, nav button')].map(b => b.getBoundingClientRect().height)),
    }));
    check('Sin desplazamiento horizontal a 390 px', !layout.over);
    check('Botones de al menos 44 px de alto', layout.minH >= 44, `mínimo ${Math.round(layout.minH)} px`);
    for (const w of [320, 375]) {
      await page.setViewportSize({ width: w, height: 640 });
      for (const t of ['negocio', 'finanzas', 'semana']) {
        await tap(page, `nav [data-v=${t}]`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        if (over) check(`Sin desplazamiento horizontal a ${w} px (${t})`, false);
      }
    }
    check('Sin desplazamiento horizontal a 320 y 375 px en las tres pestañas', true);
    check('Sin errores de JavaScript', errors.length === 0, errors.join(' | '));
    check('Sin peticiones externas', requests.every(u => u.startsWith('file:')), requests.filter(u => !u.startsWith('file:')).join(', '));
    await ctx.close();
  }

  /* ---------- 2. Partida completa jugando con toques ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, iphone);
    await page.evaluate(() => __P1.nueva(11));
    const log = {};
    let compraOk = null, separacion = true, cambioNeg = false, shotsDone = {};
    for (let i = 0; i < 160; i++) {
      let s = await st(page);
      if (s.verResultado) {
        if (s.negocio && s.ultimo.negocio && !shotsDone.res) { await shot(page, '06_resultado_negocio'); shotsDone.res = 1; }
        await tap(page, '#btnContinuar'); continue;
      }
      if (s.pendiente) {
        const t = s.pendiente.tipo;
        if (!shotsDone[t]) { await shot(page, '03_evento_' + t); shotsDone[t] = 1; }
        log[t] = s.semana;
        const v = { ojeador: 'corto', ofertas: 'puerto', mejora: 'aceptar', meta: 'ok' }[t];
        await tap(page, `[data-act=resolver][data-v=${v}]`);
        if (t === 'meta') break;
        continue;
      }
      // Compra del negocio cuando hay dinero
      if (s.fase === 'club' && !s.negocio && s.p.dinero >= 1500 + 500) {
        await tap(page, 'nav [data-v=negocio]');
        await shot(page, '04_compra');
        await tap(page, '[data-act=caja][data-v="500"]');
        const antes = (await st(page)).p.dinero;
        await tap(page, '[data-act=comprar]');
        const d = await st(page);
        compraOk = d.negocio && d.negocio.caja === 500 && d.p.dinero === antes - 2000;
        // Decisiones de personal y precio desde la interfaz
        await tap(page, '[data-act=neg][data-c=empleados][data-v="1"]');
        await tap(page, '[data-act=neg][data-c=sueldo][data-v=bueno]');
        const d2 = await st(page);
        cambioNeg = d2.negocio.empleados === 2 && d2.negocio.sueldo === 'bueno' && d2.negocio.caja === 450 && d2.p.dinero === d.p.dinero;
        await shot(page, '05_negocio');
        log.compra = d.semana;
        await tap(page, 'nav [data-v=semana]');
        s = await st(page);
      }
      let pick;
      if (s.fase === 'barrio') pick = s.p.energia < 40 ? 'descansar' : 'plaza';
      else if (s.fase === 'prep') pick = s.p.energia < 45 ? 'descansar' : s.p.dinero >= 90 ? 'entrenador' : 'trabajar';
      else pick = s.lesion ? 'reposo' : s.p.energia < 45 ? 'reposo' : 'normal';
      await tap(page, `[data-act=elegir][data-id=${pick}]`);
      const pre = await st(page);
      await tap(page, '#btnAvanzar');
      const post = await st(page);
      // Separación: el resultado del negocio va a la caja, no al dinero personal
      if (pre.negocio) {
        const persDelta = post.ultimo.eco.reduce((a, [, v]) => a + v, 0);
        if (post.p.dinero - pre.p.dinero !== persDelta) separacion = false;
        if (post.negocio.caja - pre.negocio.caja !== post.ultimo.negocio.resultado) separacion = false;
      }
    }
    const s = await st(page);
    check('Aparece el ojeador', !!log.ojeador, `semana ${log.ojeador}`);
    check('Hay ofertas de dos clubes tras las pruebas', !!log.ofertas, `semana ${log.ofertas}`);
    check('Llega la oportunidad de mejorar el contrato', !!log.mejora, `semana ${log.mejora}`);
    check('Se compra la peluquería: dinero −(precio + caja) y caja = la elegida', compraOk === true, `semana ${log.compra}`);
    check('Personal y sueldo se cambian desde la interfaz (la contratación sale de la caja)', cambioNeg);
    check('El dinero personal y la caja del negocio no se mezclan', separacion);
    check('Se alcanza la meta de patrimonio de la versión', !!log.meta, `semana ${log.meta}, patrimonio ${await page.evaluate(() => __P1.patrimonio())}`);
    await tap(page, 'nav [data-v=finanzas]');
    await shot(page, '07_finanzas');
    const pat = await page.evaluate(() => ({ txt: document.getElementById('patrimonio').textContent, v: __P1.patrimonio(), s: __P1.S }));
    check('El resumen de patrimonio = dinero + caja + valor del negocio', pat.v === pat.s.p.dinero + pat.s.negocio.caja + Math.round(1500 * (0.5 + pat.s.negocio.fama / 100)));

    // Guardado local
    const antes = await st(page);
    await page.reload();
    const despues = await st(page);
    check('La partida se guarda y se recupera al recargar', despues.semana === antes.semana && despues.p.dinero === antes.p.dinero && !!despues.negocio);
    // Reinicio con confirmación
    await tap(page, 'nav [data-v=finanzas]');
    await tap(page, '#btnReiniciar');
    check('Reiniciar pide confirmación (un toque no borra)', (await st(page)).semana === antes.semana);
    await tap(page, '#btnReiniciar');
    const r = await st(page);
    check('El segundo toque reinicia la partida', r.semana === 1 && r.fase === 'barrio' && !r.negocio);
    await page.reload();
    check('El reinicio también borra el guardado', (await st(page)).semana === 1);
    check('Sin errores de JavaScript en la partida completa', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 3. Reglas y equilibrio (sin interfaz) ---------- */
  {
    const { ctx, page, errors } = await openPage(browser, { viewport: { width: 390, height: 800 } });
    const r = await page.evaluate(() => {
      const G = __P1, out = {};
      // Ofertas: ninguna domina en todo
      const of = G.ofertasClubes(62);
      out.ofertas = of.puerto.salario > of.ciudad.salario && of.ciudad.calidad > of.puerto.calidad && of.puerto.umbral < of.ciudad.umbral;
      out.ofertasSegunPrueba = G.ofertasClubes(70).puerto.salario > G.ofertasClubes(50).puerto.salario && G.ofertasClubes(60).ciudad.salario > G.ofertasClubes(59).ciudad.salario;

      // Llegar rápido a club con estado controlado
      function alClub(seed, club) {
        G.nueva(seed);
        G.S.p.rep = 30; G.S.pendiente = { tipo: 'ojeador' }; G.resolver('corto');
        for (let i = 0; i < 3; i++) { G.elegir('descansar'); G.avanzarSemana(); G.continuar(); }
        G.resolver(club);
      }
      // Determinismo
      alClub(5, 'puerto'); for (let i = 0; i < 6; i++) { G.elegir('normal'); G.avanzarSemana(); G.continuar(); if (G.S.pendiente) G.resolver('aceptar'); }
      const a = JSON.stringify(G.S.p);
      alClub(5, 'puerto'); for (let i = 0; i < 6; i++) { G.elegir('normal'); G.avanzarSemana(); G.continuar(); if (G.S.pendiente) G.resolver('aceptar'); }
      out.determinista = a === JSON.stringify(G.S.p);

      // Lesiones: jugar con energía muy baja a veces lesiona, con energía alta nunca
      let lesBaja = 0, lesAlta = 0;
      for (let seed = 1; seed <= 40; seed++) {
        alClub(seed, 'puerto'); G.S.p.nivel = 70; G.S.p.energia = 15; G.elegir('patrocinio'); G.avanzarSemana(); if (G.S.lesion > 0) lesBaja++;
        alClub(seed, 'puerto'); G.S.p.nivel = 70; G.S.p.energia = 90; G.elegir('normal'); G.avanzarSemana(); if (G.S.lesion > 0) lesAlta++;
      }
      out.lesiones = { lesBaja, lesAlta };

      // Selección: el patrocinio puede costar la titularidad
      alClub(3, 'puerto'); G.S.p.nivel = 40; G.S.p.energia = 60; // 40 + 15 = 55 ≥ 52
      G.elegir('patrocinio'); G.avanzarSemana();
      out.patrocinioBanquillo = G.S.ultimo.partido.rol !== 'titular';
      alClub(3, 'puerto'); G.S.p.nivel = 40; G.S.p.energia = 70;
      G.elegir('normal'); G.avanzarSemana();
      out.normalTitular = G.S.ultimo.partido.rol === 'titular';

      // Negociar al alza: con reputación alta suele salir bien, con baja suele salir mal (y hay tensión)
      let okAlta = 0, okBaja = 0, tension = 0;
      for (let seed = 1; seed <= 30; seed++) {
        for (const rep of [80, 10]) {
          alClub(seed, 'puerto'); G.S.p.rep = rep;
          G.S.pendiente = { tipo: 'mejora', oferta: { texto: 'x', equipo: 'Primer equipo', salario: 200, primaVictoria: 40, umbral: 52, rivalNivel: 45, visibilidad: 1.2, probVictoria: 0.4, semanas: 40 } };
          G.resolver('pedir');
          const ok = G.S.contrato.salario === 240;
          if (rep === 80 && ok) okAlta++;
          if (rep === 10 && ok) okBaja++;
          if (!ok && G.S.tension > 0) tension++;
        }
      }
      out.pedir = { okAlta, okBaja, tension };
      // Contrato largo: menos salario, prima inmediata
      alClub(2, 'puerto'); const d0 = G.S.p.dinero;
      G.S.pendiente = { tipo: 'mejora', oferta: { texto: 'x', equipo: 'Primer equipo', salario: 200, primaVictoria: 40, umbral: 52, rivalNivel: 45, visibilidad: 1.2, probVictoria: 0.4, semanas: 40 } };
      G.resolver('largo');
      out.largo = G.S.contrato.salario === 180 && G.S.p.dinero === d0 + 720 && G.S.contrato.semanasRestantes === 60;

      // Negocio: reglas de fama
      function conNegocio(seed, conf) {
        alClub(seed, 'puerto'); G.S.p.dinero = 5000; G.comprarNegocio(500); Object.assign(G.S.negocio, conf);
        G.elegir('normal'); G.avanzarSemana(); G.continuar(); return G.S.negocio;
      }
      let n = conNegocio(1, { precio: 'premium', fama: 40, empleados: 2, sueldo: 'bueno' });
      out.premiumBajaFama = n.fama === 38; // −3 + 1
      n = conNegocio(1, { precio: 'premium', fama: 70, empleados: 2, sueldo: 'bueno' });
      out.premiumAltaFama = n.fama === 71;
      n = conNegocio(1, { precio: 'economico', fama: 60, empleados: 1, sueldo: 'basico' });
      out.colas = n.ultimo.perdidos > 3 && n.fama === 60 + 1 - 1 - 2;
      n = conNegocio(1, { precio: 'normal', fama: 40, empleados: 3, sueldo: 'bueno', caja: -500 });
      out.impago = n.caja < 0 && n.ultimo.fam.some(([d]) => d === -5);
      // Con la caja en negativo no se toca el dinero personal automáticamente
      const dp = G.S.p.dinero; G.elegir('normal'); G.avanzarSemana();
      out.cajaNoTocaPersonal = G.S.p.dinero - dp === G.S.ultimo.eco.reduce((x, [, v]) => x + v, 0);
      // Traspasos
      G.continuar(); const c0 = G.S.negocio.caja, p0 = G.S.p.dinero; G.traspasar('aCaja');
      out.traspaso = G.S.negocio.caja === c0 + 100 && G.S.p.dinero === p0 - 100;

      // Acciones bloqueadas: entrenador sin dinero, entrenar lesionado
      G.nueva(9); G.S.pendiente = { tipo: 'ojeador' }; G.resolver('corto'); G.S.p.dinero = 10;
      out.entrenadorBloqueado = !G.elegir('entrenador');
      alClub(9, 'puerto'); G.S.lesion = 2;
      out.lesionBloquea = !G.elegir('extra') && !G.elegir('normal') && G.elegir('reposo');
      // Sin decisión no se avanza; con evento pendiente tampoco
      G.nueva(4); out.sinDecision = !G.avanzarSemana();
      G.S.pendiente = { tipo: 'ojeador' }; G.S.eleccion = 'plaza'; out.conEvento = !G.avanzarSemana();
      return out;
    });
    check('Ofertas: el modesto paga más; el grande entrena mejor y exige más para ser titular', r.ofertas);
    check('Las condiciones dependen de la puntuación de la prueba', r.ofertasSegunPrueba);
    check('Mismas decisiones y semilla → mismos resultados', r.determinista);
    check('Jugar agotado puede lesionar; descansado, no', r.lesiones.lesBaja > 5 && r.lesiones.lesAlta === 0, JSON.stringify(r.lesiones));
    check('El patrocinio puede costar la titularidad (−8 en la selección)', r.patrocinioBanquillo && r.normalTitular);
    check('Pedir más: depende de la reputación y fallar crea tensión', r.pedir.okAlta > r.pedir.okBaja && r.pedir.tension > 0, JSON.stringify(r.pedir));
    check('Contrato largo: −10 % salario, prima de 4 semanas, 60 semanas', r.largo);
    check('Negocio: premium con poca fama pierde fama; con fama alta, no', r.premiumBajaFama && r.premiumAltaFama);
    check('Negocio: clientes sin atender restan fama', r.colas);
    check('Negocio: caja negativa resta fama y no toca el dinero personal', r.impago && r.cajaNoTocaPersonal);
    check('Traspaso de dinero personal a caja', r.traspaso);
    check('Acciones bloqueadas cuando no se cumplen requisitos', r.entrenadorBloqueado && r.lesionBloquea);
    check('No se avanza sin decisión ni con un evento pendiente', r.sinDecision && r.conEvento);

    // Equilibrio: estrategias distintas ganan en cosas distintas
    const sim = await page.evaluate(() => {
      const G = __P1;
      function play(seed, st) {
        G.nueva(seed); const S = () => G.S; const L = { meta: null };
        for (let w = 0; w < 150; w++) {
          if (S().verResultado) G.continuar();
          const ev = S().pendiente;
          if (ev) {
            if (ev.tipo === 'ojeador') G.resolver(st.plazo);
            else if (ev.tipo === 'ofertas') G.resolver(st.club);
            else if (ev.tipo === 'mejora') G.resolver(st.mejora);
            else { L.meta = S().semana; G.resolver('ok'); break; }
            continue;
          }
          if (S().fase === 'club' && !S().negocio && S().p.dinero >= 1500 + st.caja) { G.comprarNegocio(st.caja); if (st.neg) st.neg(G); }
          const s = S();
          let a;
          if (s.fase === 'barrio') a = s.p.energia < 40 ? 'descansar' : 'plaza';
          else if (s.fase === 'prep') a = s.prep.semanasRestantes === 1 && s.p.energia < 70 ? 'descansar' : s.p.energia < 35 ? 'descansar' : s.p.dinero >= 90 ? 'entrenador' : s.p.energia > 60 ? 'entrenarSolo' : 'trabajar';
          else a = st.pick(s);
          if (!G.elegir(a)) G.elegir(G.disponible('reposo') ? 'reposo' : 'patrocinio');
          G.avanzarSemana();
        }
        return { meta: L.meta, nivel: S().p.nivel, fama: S().negocio ? S().negocio.fama : 0 };
      }
      const strats = {
        crecer: { plazo: 'largo', club: 'ciudad', mejora: 'pedir', caja: 500, pick: s => s.lesion ? 'reposo' : s.p.energia < 40 ? (s.p.dinero >= 40 ? 'fisio' : 'reposo') : 'extra' },
        dinero: { plazo: 'corto', club: 'puerto', mejora: 'largo', caja: 200, pick: s => s.lesion ? 'reposo' : s.semana % 3 === 0 ? 'patrocinio' : s.p.energia < 45 ? 'reposo' : 'normal' },
        empresario: { plazo: 'corto', club: 'puerto', mejora: 'aceptar', caja: 900, neg: G => { G.cambiarNegocio('sueldo', 'bueno'); G.cambiarNegocio('precio', 'premium'); },
          pick: s => s.lesion ? 'reposo' : s.negocio && s.negocio.fama < 60 && s.semana % 2 ? 'visitaNegocio' : s.p.energia < 45 ? 'reposo' : 'normal' },
      };
      const out = {};
      for (const [k, st] of Object.entries(strats)) {
        const runs = [1, 2, 3, 4, 5].map(seed => play(seed, st));
        out[k] = { meta: runs.reduce((a, r) => a + (r.meta || 999), 0) / runs.length, nivel: runs.reduce((a, r) => a + r.nivel, 0) / runs.length, fama: runs.reduce((a, r) => a + r.fama, 0) / runs.length, todas: runs.every(r => r.meta) };
      }
      return out;
    });
    const best = m => Object.entries(sim).sort((a, b) => (m === 'meta' ? a[1][m] - b[1][m] : b[1][m] - a[1][m]))[0][0];
    console.log('      Equilibrio (media de 5 partidas):', JSON.stringify(sim));
    check('Todas las estrategias de prueba alcanzan la meta', Object.values(sim).every(x => x.todas));
    check('Ninguna estrategia gana en todo (meta antes / más nivel / más fama del negocio)',
      new Set([best('meta'), best('nivel'), best('fama')]).size === 3, `meta: ${best('meta')}, nivel: ${best('nivel')}, fama: ${best('fama')}`);
    check('Sin errores de JavaScript en reglas y simulaciones', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- 4. Código: sin anuncios, compras, cuentas ni servicios externos ---------- */
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
