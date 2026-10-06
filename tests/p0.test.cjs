// Proves automàtiques del prototip P0.
// Execució: node tests/p0.test.cjs   (necessita Playwright amb Chromium instal·lat)
// Nota: Chromium amb emulació de mòbil NO substitueix una prova real a Safari / iPhone.
'use strict';
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium, devices } = pw;

const FILE = 'file://' + path.resolve(__dirname, '..', 'p0', 'futbol_p0.html');
const SHOTS = process.env.SHOT_DIR || null;
const results = [];
function check(name, ok, detail) { results.push({ name, ok, detail }); console.log(`${ok ? 'OK  ' : 'FALLA'} ${name}${detail ? ' — ' + detail : ''}`); }

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

async function padBox(page) { return page.locator('#pad').boundingBox(); }

async function touchDrag(client, x0, y0, x1, y1, steps = 12) {
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= steps; i++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps }] });
    await new Promise(r => setTimeout(r, 16));
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function touchTap(client, x, y) {
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function center(page, sel) { const b = await page.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }

(async () => {
  const browser = await chromium.launch();
  const iphone = { ...devices['iPhone 13'] };
  delete iphone.defaultBrowserType;

  /* ---- 1 + 2 + 9: un sol dit (tàctil) en vertical, sense desplaçament ni peticions externes ---- */
  {
    const { ctx, page, errors, requests } = await openPage(browser, iphone);
    const client = await ctx.newCDPSession(page);
    const start = await center(page, '#btnStart');
    await touchTap(client, start.x, start.y);
    await page.waitForTimeout(100);
    check('Tàctil: el toc a «Comença» inicia la jugada', await page.evaluate(() => __P0.S.phase === 'playing'));
    // Passada amb un dit: el mode «Passar» ja és el predeterminat. Arrossegar cap al company.
    const dir = await page.evaluate(() => { const b = __P0.S.ball, m = __P0.P.mate; const d = Math.hypot(m.x - b.x, m.y - b.y); return { x: (m.x - b.x) / d, y: (m.y - b.y) / d }; });
    const pb = await padBox(page);
    const ox = pb.x + pb.width / 2, oy = pb.y + pb.height / 2;
    await touchDrag(client, ox, oy, ox + dir.x * 75, oy + dir.y * 75);
    await page.waitForTimeout(50);
    const afterPass = await page.evaluate(() => ({ owner: __P0.S.owner, kind: __P0.S.ball.kind, lastKicker: __P0.S.ball.lastKicker, ev: __P0.S.events.slice() }));
    check('Tàctil: arrossegar i deixar anar executa una passada', afterPass.lastKicker === 'hero' && afterPass.ev.includes('Passada'), JSON.stringify(afterPass));
    // Sense pilota: el mateix gest fa un desmarcatge del protagonista (no del company).
    await page.waitForTimeout(150);
    const before = await page.evaluate(() => ({ hx: __P0.P.hero.x, hy: __P0.P.hero.y, mtx: __P0.P.mate.tx, owner: __P0.S.owner, phase: __P0.S.phase }));
    if (before.owner !== 'hero' && before.phase === 'playing') {
      await touchDrag(client, ox, oy, ox, oy - 70);
      const run = await page.evaluate(() => __P0.S.run && { x: __P0.S.run.x, y: __P0.S.run.y });
      check('Passar no canvia el jugador controlat: el gest següent mou el protagonista', !!run && run.y < before.hy - 1 && Math.abs(run.x - before.hx) < 0.5, JSON.stringify({ before, run }));
    } else check('Passar no canvia el jugador controlat', false, 'la jugada ja havia acabat: ' + JSON.stringify(before));
    // Xut amb un dit: seleccionar «Xutar» amb un toc (sense mantenir-lo) i arrossegar.
    await page.evaluate(() => { __P0.reset(7); __P0.start(); });
    const shoot = await center(page, '#btnShoot');
    await touchTap(client, shoot.x, shoot.y);
    check('Tàctil: un toc a «Xutar» selecciona el mode', await page.evaluate(() => __P0.mode === 'shot'));
    await touchDrag(client, ox, oy + 20, ox + 10, oy - 80);
    const shot = await page.evaluate(() => ({ kind: __P0.S.ball.kind, ev: __P0.S.events.slice(), vy: __P0.S.ball.vy, phase: __P0.S.phase, res: __P0.S.result && __P0.S.result.kind }));
    check('Tàctil: xut cap amunt va cap a la porteria', shot.ev.includes('Xut') && (shot.vy < 0 || shot.res), JSON.stringify(shot));
    // Un toc curt (sense arrossegar) no executa res.
    await page.evaluate(() => { __P0.reset(8); __P0.start(); });
    await touchTap(client, ox, oy);
    check('Un toc sense arrossegar no dispara cap acció', await page.evaluate(() => __P0.S.owner === 'hero' && __P0.S.events.length === 0));
    const scroll = await page.evaluate(() => ({ y: window.scrollY, x: window.scrollX, top: document.scrollingElement.scrollTop }));
    check('Els gestos no desplacen la pàgina', scroll.y === 0 && scroll.x === 0 && scroll.top === 0, JSON.stringify(scroll));
    const layout = await page.evaluate(() => {
      const c = document.getElementById('controls').getBoundingClientRect(), f = document.getElementById('field').getBoundingClientRect();
      return { vh: innerHeight, controlsTop: c.top, controlsH: c.height, fieldH: f.height, docW: document.documentElement.scrollWidth, vw: innerWidth };
    });
    check('Franja de control a la part inferior i camp visible a sobre', layout.controlsTop > layout.vh * 0.5 && layout.fieldH > layout.vh * 0.45 && layout.docW <= layout.vw, JSON.stringify(layout));
    if (SHOTS) {
      await page.evaluate(() => { __P0.reset(3); __P0.start(); });
      await page.screenshot({ path: path.join(SHOTS, 'iphone_inici.png') });
    }
    const external = requests.filter(u => !u.startsWith('file://') && !u.startsWith('data:'));
    check('Cap petició de xarxa externa (ni serveis de pagament)', external.length === 0, external.join(', ') || `${requests.length} peticions, totes locals`);
    check('Sense errors de JavaScript (mòbil)', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---- 1 (ratolí): les mateixes accions amb ratolí a l'escriptori ---- */
  {
    const { ctx, page, errors } = await openPage(browser, { viewport: { width: 1280, height: 860 } });
    await page.click('#btnStart');
    await page.click('#btnShoot');
    const pb = await padBox(page), ox = pb.x + pb.width / 2, oy = pb.y + pb.height / 2;
    await page.mouse.move(ox, oy); await page.mouse.down();
    await page.mouse.move(ox + 5, oy - 40, { steps: 5 });
    await page.waitForTimeout(80);
    const aiming = await page.evaluate(() => __P0.S.events.length === 0 && __P0.S.owner === 'hero');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'mac_apuntant.png') });
    await page.mouse.move(ox + 8, oy - 90, { steps: 5 });
    await page.mouse.up();
    const ev = await page.evaluate(() => __P0.S.events.slice());
    check('Ratolí: mantenir premut només apunta; deixar anar xuta', aiming && ev.includes('Xut'), JSON.stringify(ev));
    check('Sense errors de JavaScript (escriptori)', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---- Proves de simulació (pas fix, sense dependre del temps real) ---- */
  const { ctx, page, errors } = await openPage(browser, iphone);
  await page.evaluate(() => { document.getElementById('introOverlay').classList.add('hidden'); __P0.setManual(true); });

  // 3: passada, desmarcatge, devolució i xut
  const seq = await page.evaluate(() => {
    let completed = 0, goals = 0, tries = 40; const outcomes = {};
    for (let seed = 1; seed <= tries; seed++) {
      __P0.reset(seed); __P0.start();
      const S = () => __P0.S, P = __P0.P;
      const b = S().ball, m = P.mate;
      __P0.heroKick('pass', m.x - b.x, m.y - b.y, 0.5);
      for (let i = 0; i < 300 && S().owner !== 'mate' && S().phase === 'playing'; i++) __P0.advance(1 / 60);
      if (S().owner === 'mate') {
        __P0.heroRun(-0.7, -0.7, 0.5);            // desmarcatge curt en diagonal, lluny del defensor
        for (let i = 0; i < 600 && S().owner !== 'hero' && S().phase === 'playing'; i++) __P0.advance(1 / 60);
        if (S().owner === 'hero' && S().events.some(e => e.startsWith('Devolució') || e.startsWith('Passada forçada'))) {
          completed++;
          const h = S().ball, gk = P.gk, tx = gk.x > 0 ? -3.0 : 3.0;
          __P0.setMode('shot'); __P0.heroKick('shot', tx - h.x, 0 - h.y, 0.7);
        }
      }
      __P0.advance(3);
      const k = S().result ? S().result.kind : 'none';
      outcomes[k] = (outcomes[k] || 0) + 1;
      if (k === 'goal') goals++;
    }
    return { completed, goals, tries, outcomes };
  });
  check('Es pot completar passada → desmarcatge → devolució → xut', seq.completed > 0 && seq.goals > 0, JSON.stringify(seq));
  check('La devolució no està garantida', seq.completed < seq.tries, `${seq.completed}/${seq.tries} devolucions`);

  // 4: una passada mal triada (per on és el defensor) es pot interceptar
  const icpt = await page.evaluate(() => {
    let losses = 0, n = 30; const kinds = {};
    for (let seed = 100; seed < 100 + n; seed++) {
      __P0.reset(seed); __P0.start();
      const b = __P0.S.ball, d = __P0.P.def;
      __P0.heroKick('pass', d.x - b.x, d.y - b.y, 0.4);
      __P0.advance(4);
      const r = __P0.S.result ? __P0.S.result.kind : 'none';
      kinds[r] = (kinds[r] || 0) + 1;
      if (r === 'loss') losses++;
    }
    return { losses, n, kinds };
  });
  check('El defensor intercepta una passada mal triada', icpt.losses >= icpt.n * 0.6, JSON.stringify(icpt));

  // La pilota no travessa el defensor: xut fort directe contra el seu cos
  const block = await page.evaluate(() => {
    let through = 0, n = 30;
    for (let seed = 200; seed < 200 + n; seed++) {
      __P0.reset(seed); __P0.start();
      __P0.teleport('def', -2.5, 17.0);
      const b = __P0.S.ball, d = __P0.P.def;
      __P0.CONFIG.shot.errorDeg = 0; __P0.CONFIG.shot.errorPowerDeg = 0; __P0.CONFIG.pressure.extraErrorDeg = 0;
      __P0.CONFIG.shot.liftNoise = 0;
      __P0.heroKick('shot', d.x - b.x, d.y - b.y, 0.3);
      let passed = false;
      for (let i = 0; i < 120; i++) { __P0.advance(1 / 60); if (__P0.S.ball.y < d.y - 1 && __P0.S.ball.lastKicker === 'hero') passed = true; }
      if (passed) through++;
    }
    __P0.CONFIG.shot.errorDeg = 2.0; __P0.CONFIG.shot.errorPowerDeg = 3.0; __P0.CONFIG.pressure.extraErrorDeg = 3.0; __P0.CONFIG.shot.liftNoise = 0.35;
    return { through, n };
  });
  check('La pilota no travessa el defensor quan va contra ell', block.through === 0, JSON.stringify(block));

  // 5: xuts amb resultats diferents segons les condicions
  const shots = await page.evaluate(() => {
    const out = { goal: 0, save: 0, out: 0, loss: 0, time: 0, none: 0 }, byZone = {};
    const spots = [[0, 11], [-6, 13], [5, 15], [-3, 19], [8, 10]];
    let seed = 1000;
    for (const [sx, sy] of spots) {
      const z = byZone[`${sx},${sy}`] = { goal: 0, save: 0, out: 0, other: 0 };
      for (let i = 0; i < 80; i++) {
        __P0.reset(seed++); __P0.start();
        __P0.teleport('def', 15, 24); __P0.teleport('hero', sx, sy);
        // el porter es col·loca durant mig segon
        __P0.advance(0.5);
        const tx = (Math.random() * 2 - 1) * 4.6, p = 0.35 + Math.random() * 0.65;
        const b = __P0.S.ball;
        __P0.heroKick('shot', tx - b.x, 0 - b.y, p);
        __P0.advance(4);
        const k = __P0.S.result ? __P0.S.result.kind : 'none';
        out[k]++; if (z[k] !== undefined) z[k]++; else z.other++;
      }
    }
    return { out, byZone };
  });
  check('Hi ha xuts que acaben en gol, aturada i fora', shots.out.goal > 0 && shots.out.save > 0 && shots.out.out > 0, JSON.stringify(shots));
  const z0 = shots.byZone['0,11'], z3 = shots.byZone['-3,19'];
  check('El porter no ho atura tot ni ho deixa passar tot', z0.goal > 0 && z0.save > 0 && z3.save > 0, JSON.stringify({ '0,11': z0, '-3,19': z3 }));

  // Molta força → per sobre del travesser més sovint
  const over = await page.evaluate(() => {
    const res = {};
    for (const p of [0.6, 1.0]) {
      let overBar = 0;
      for (let s = 0; s < 60; s++) {
        __P0.reset(5000 + s); __P0.start(); __P0.teleport('def', 15, 24); __P0.teleport('hero', 0, 20); __P0.advance(0.5);
        const b = __P0.S.ball; __P0.heroKick('shot', 2.5 - b.x, -b.y, p); __P0.advance(4);
        if (__P0.S.result && __P0.S.result.kind === 'out' && /travesser/.test(__P0.S.result.text)) overBar++;
      }
      res[p] = overBar;
    }
    return res;
  });
  check('La força excessiva fa anar la pilota per sobre', over['1'] > over['0.6'], JSON.stringify(over));

  // 6: el rellotge acaba la jugada
  const timer = await page.evaluate(() => {
    const keep = __P0.CONFIG.defender.tackleRateHero;
    __P0.CONFIG.defender.tackleRateHero = 0;      // perquè la jugada no acabi abans per una pèrdua
    const t0 = JSON.parse(JSON.stringify(__P0.TALLY));
    __P0.reset(42); __P0.start();
    __P0.advance(14.9);
    const mid = __P0.S.phase;
    __P0.advance(0.3);
    const r = { mid, phase: __P0.S.phase, kind: __P0.S.result && __P0.S.result.kind, clock: __P0.S.clock, timeDelta: __P0.TALLY.time - t0.time };
    __P0.CONFIG.defender.tackleRateHero = keep;
    return r;
  });
  check('El comptador de 15 s acaba la jugada', timer.mid === 'playing' && timer.kind === 'time' && timer.clock === 0 && timer.timeDelta === 1, JSON.stringify(timer));

  // Apuntar consumeix temps: el rellotge segueix a temps real mentre s'apunta
  const aimClock = await page.evaluate(() => {
    __P0.reset(43); __P0.start();
    const c0 = __P0.S.clock, s0 = __P0.S.time;
    return { c0, s0 };
  });
  // (comprovat al bloc tàctil real; aquí es verifica amb un arrossegament simulat a la pàgina)
  const aimCheck = await page.evaluate(() => {
    const pad = document.getElementById('pad'), r = pad.getBoundingClientRect();
    const ev = (t, x, y) => pad.dispatchEvent(new PointerEvent(t, { pointerId: 9, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    ev('pointerdown', r.left + 100, r.top + 100); ev('pointermove', r.left + 100, r.top + 40);
    const c0 = __P0.S.clock, s0 = __P0.S.time;
    __P0.advance(1.0);
    const r1 = { clockUsed: c0 - __P0.S.clock, simUsed: __P0.S.time - s0 };
    __P0.advance(3.0);
    const c1 = __P0.S.clock, s1 = __P0.S.time;
    __P0.advance(1.0);
    r1.clockUsedLater = c1 - __P0.S.clock; r1.simUsedLater = __P0.S.time - s1;
    ev('pointercancel', 0, 0);
    return r1;
  });
  check('Apuntar consumeix temps i l\'alentiment és limitat', Math.abs(aimCheck.clockUsed - 1) < 0.02 && aimCheck.simUsed < 0.8 && Math.abs(aimCheck.simUsedLater - 1) < 0.05 || false, JSON.stringify(aimCheck));

  // 8: el resultat i el gol es registren una sola vegada
  const once = await page.evaluate(() => {
    const keep = { e: __P0.CONFIG.shot.errorDeg, p: __P0.CONFIG.shot.errorPowerDeg, gr: __P0.CONFIG.keeper.diveReach, kr: __P0.CONFIG.keeper.reaction };
    __P0.CONFIG.shot.errorDeg = 0; __P0.CONFIG.shot.errorPowerDeg = 0; __P0.CONFIG.keeper.diveReach = 0.1; __P0.CONFIG.keeper.reaction = 0.4;
    const t0 = __P0.TALLY.goal, p0 = __P0.TALLY.plays;
    __P0.reset(77); __P0.start(); __P0.teleport('def', 15, 24); __P0.teleport('hero', 0, 9); __P0.advance(0.4);
    const b = __P0.S.ball; __P0.heroKick('shot', 3.0 - b.x, -b.y, 0.6);
    __P0.advance(6);
    const second = __P0.endPlay('goal', {});
    __P0.advance(3);
    Object.assign(__P0.CONFIG.shot, { errorDeg: keep.e, errorPowerDeg: keep.p }); __P0.CONFIG.keeper.diveReach = keep.gr; __P0.CONFIG.keeper.reaction = keep.kr;
    const overlayVisible = !document.getElementById('resultOverlay').classList.contains('hidden');
    return { kind: __P0.S.result.kind, goalDelta: __P0.TALLY.goal - t0, playsDelta: __P0.TALLY.plays - p0, second, shown: __P0.S.resultShowCount, overlayVisible };
  });
  check('Gol i finestra de resultat registrats una sola vegada', once.kind === 'goal' && once.goalDelta === 1 && once.playsDelta === 1 && once.second === false && once.shown === 1 && once.overlayVisible, JSON.stringify(once));
  if (SHOTS) { await page.evaluate(() => __P0.advance(0)); await page.waitForTimeout(100); await page.screenshot({ path: path.join(SHOTS, 'iphone_resultat_gol.png') }); }

  // 7: «Repetir» restableix pilota, jugadors, rellotge, resultat i controls
  await page.evaluate(() => { __P0.setMode('shot'); });
  await page.click('#btnRepeat');
  const reset = await page.evaluate(() => {
    const st = __P0.CONFIG.start, P = __P0.P, S = __P0.S;
    const near = (p, q) => Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9;
    return {
      players: near(P.hero, st.hero) && near(P.mate, st.mate) && near(P.def, st.defender) && near(P.gk, st.keeper),
      ball: S.owner === 'hero' && S.ball.z === 0 && S.ball.vx === 0 && S.ball.vy === 0,
      clock: S.clock === __P0.CONFIG.clockSeconds, phase: S.phase, result: S.result, events: S.events.length,
      mode: __P0.mode, overlayHidden: document.getElementById('resultOverlay').classList.contains('hidden'), run: S.run,
    };
  });
  check('Repetir restableix pilota, jugadors, rellotge, resultat i controls', reset.players && reset.ball && reset.clock && reset.phase === 'playing' && reset.result === null && reset.events === 0 && reset.mode === 'pass' && reset.overlayHidden && reset.run === null, JSON.stringify(reset));

  // Pausa en perdre visibilitat
  const pauseRes = await page.evaluate(() => {
    __P0.setManual(false);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    const c0 = __P0.S.clock;
    __P0.advance(2);
    const r = { paused: __P0.paused, frozen: __P0.S.clock === c0, overlay: !document.getElementById('pauseOverlay').classList.contains('hidden') };
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.getElementById('btnResume').click();
    r.resumed = !__P0.paused;
    __P0.setManual(true);
    return r;
  });
  check('La jugada es pausa quan la pàgina perd visibilitat', pauseRes.paused && pauseRes.frozen && pauseRes.overlay && pauseRes.resumed, JSON.stringify(pauseRes));
  check('Sense errors de JavaScript (simulació)', errors.length === 0, errors.join(' | '));
  await ctx.close();

  // 9 + 10: revisió estàtica de l'arxiu
  const src = require('fs').readFileSync(path.resolve(__dirname, '..', 'p0', 'futbol_p0.html'), 'utf8');
  const net = /(fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|<script[^>]+src=|<link[^>]+href=|https?:\/\/)/i.exec(src);
  check('L\'arxiu no conté connexions de xarxa, scripts externs ni URL', !net, net ? net[0] : 'cap');
  check('No hi ha anuncis, compres, monedes ni vides', !/(admob|adsense|googlesyndication|purchase|stripe|paypal|storekit)/i.test(src));

  await browser.close();
  const fails = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} comprovacions superades.`);
  process.exit(fails ? 1 : 0);
})();
