/* =====================================================================
   22 · INTERFAZ PRESTIGE (carreras de cargo) y retirada del deporte
   ===================================================================== */
(function (P2) {
  'use strict';
  const UIX = P2.UIX = P2.UIX || { vistas: {}, acciones: {} };
  const EST = { LOCKED: '🔒 No está en tu cuenta', NOT_ELIGIBLE: '⏳ Aún no cumples los requisitos', ELIGIBLE: '✅ Puedes presentarte', CAMPAIGN: '📣 En campaña', OFFICE: '👑 En el cargo', REELECTION: '🗳️ Reelección', FORMER: '📜 Etapa terminada' };
  const TIPO = { eleccion: 'Elección', nombramiento: 'Nombramiento', examen: 'Examen', casting: 'Casting' };
  const SKU = id => `prestige_${id}`;
  const barra = (v, cls = '') => `<div class="xp ${cls}"><i style="width:${Math.max(2, Math.min(100, Math.round(v)))}%"></i></div>`;
  // Tarjeta del inicio cuando estás en campaña o en el cargo
  UIX.inicio = (s, H) => {
    const P = P2.prestige(s), id = P.activa; if (!id) return '';
    const C = P2.CARRERAS_PRESTIGE[id], X = P.c[id], { esc } = H;
    if (X.estado === 'CAMPAIGN' || X.estado === 'REELECTION') return `<div class="card prest"><b>${C.ic} ${esc(C.n)} · ${X.estado === 'REELECTION' ? 'reelección' : 'campaña'}</b>
      <div class="kv"><span>${C.tipo === 'eleccion' || X.estado === 'REELECTION' ? 'Tu apoyo' : 'Tu preparación'}</span><b>${Math.round(X.estado === 'REELECTION' ? X.aprobacion * 0.7 + X.prestigio * 0.3 : X.apoyo)}</b></div>${barra(X.estado === 'REELECTION' ? X.aprobacion * 0.7 + X.prestigio * 0.3 : X.apoyo)}
      <div class="kv"><span>${C.tipo === 'examen' ? 'Para aprobar' : 'El rival'}</span><b>${C.tipo === 'examen' ? 60 : Math.round(X.rival)}</b></div>${barra(C.tipo === 'examen' ? 60 : X.rival, 'rival')}
      <p class="small">Quedan ${Math.max(0, (X.estado === 'REELECTION' ? 3 : C.semanasCampana) - X.semanas)} semanas.</p></div>`;
    if (X.estado === 'OFFICE') return `<div class="card prest"><b>${C.ic} ${esc(C.n)} · semana ${X.cargoSemanas} de ${C.mandato}</b>
      <div class="kv"><span>Aprobación</span><b>${Math.round(X.aprobacion)}</b></div>${barra(X.aprobacion)}
      <div class="kv"><span>Presupuesto</span><b>${Math.round(X.presupuesto)}</b></div>${barra(X.presupuesto)}
      <div class="kv"><span>Prestigio</span><b>${Math.round(X.prestigio)}</b></div>${barra(X.prestigio)}${X.polemica > 3 ? `<p class="small">🔥 Polémica: ${Math.round(X.polemica)}</p>` : ''}</div>`;
    return '';
  };
  UIX.vistas.prestige = (s, H) => {
    const { esc, eur, kv } = H, P = P2.prestige(s), C0 = P2.CARRERAS_PRESTIGE;
    const act = P.activa;
    const retiro = s.fase === 'retirado' ? '' : `<div class="card"><h3>👋 Retirarte del deporte</h3><p class="small">Cuelgas las botas: se acaba tu contrato y tus patrocinios. Sigues con tus empresas, inversiones y expansiones. Presentarte a un cargo también te retira.</p>
      ${H.ui.retirar ? '<p class="pmErr">¿Seguro? No hay vuelta atrás en esta carrera.</p>' : ''}<button class="btn ${H.ui.retirar ? 'r' : 'w'} full" data-act="prRetirarse">${H.ui.retirar ? '⚠️ Sí, me retiro' : 'Retirarme'}</button></div>`;
    const lista = Object.entries(C0).map(([id, C]) => {
      const e = P2.estadoPrestige(s, id), req = P2.requisitosPrestige(s, id), X = P.c[id];
      const prod = globalThis.P2C && P2C.getProduct(SKU(id));
      return `<div class="card prestC ${act === id ? 'act' : ''}"><h3>${C.ic} ${esc(C.n)}</h3><p class="small">${TIPO[C.tipo]} · te presentas con ${C.edad} años · sueldo ${eur(C.sueldo)}/semana · mandato de ${C.mandato} semanas</p>
        <p><b>${EST[e] || e}</b></p>
        ${e === 'LOCKED' ? `<button class="btn w full" data-act="uxPremium" data-v="${SKU(id)}">💎 Ver la carrera${prod && prod.prices && prod.prices.EUR ? ` · ${(prod.prices.EUR / 100).toFixed(2).replace('.', ',')} €` : ''}</button><p class="small">Desbloquea la campaña jugable. La compra NO garantiza ganar.</p>` : ''}
        ${e !== 'LOCKED' && !X ? `<div class="reqs">${req.map(r => `<div class="lin ${r.ok ? 'bien' : ''}"><span class="ic">${r.ok ? '✅' : '⬜'}</span><span>${esc(r.t)}</span></div>`).join('')}</div>` : ''}
        ${e === 'ELIGIBLE' && !act ? `${H.ui.candidatura === id ? `<p class="pmErr">Te retiras del deporte${C.edad > s.edad ? ` y pasan ${C.edad - s.edad} años` : ''}. ¿Seguro?</p>` : ''}<button class="btn full" data-act="prCandidatura" data-id="${id}">${H.ui.candidatura === id ? '⚠️ Sí, me presento' : `🎖️ Presentar tu candidatura`}</button>` : ''}
        ${X && X.ultimaVotacion ? kv('Última votación', `${X.ultimaVotacion.votos} de ${X.ultimaVotacion.de}`) : ''}${X && X.mandatos ? kv('Mandatos', X.mandatos) : ''}${X && X.logros && X.logros.length ? kv('Logros', esc(X.logros.slice(-3).map(l => l.n).join(' · '))) : ''}
        ${X && X.estado === 'FORMER' && !act ? '<button class="btn w full" data-act="prReintentar" data-id="' + id + '">🔁 Volver a presentarte</button>' : ''}
        ${act === id ? `<button class="btn w full" data-act="prDejar">${H.ui.dejar ? '⚠️ Toca otra vez para dejarlo' : X.estado === 'CAMPAIGN' ? 'Retirar la candidatura' : 'Dejar el cargo'}</button>` : ''}</div>`;
    }).join('');
    const hist = P.historial.length ? `<div class="card"><h3>📜 Tu historia institucional</h3>${P.historial.map(h => kv(`${C0[h.id].ic} ${esc(C0[h.id].n)}`, `${h.mandatos} ${h.mandatos === 1 ? 'mandato' : 'mandatos'} · ${{ derrota: 'derrota', dimision: 'dimisión', fin: 'fin de etapa', voluntario: 'lo dejaste', retirada: 'te retiraste' }[h.resultado] || h.resultado}`)).join('')}</div>` : '';
    return `<div class="card"><h2>🎖️ Prestige</h2><p class="small">Carreras de cargo para tu segunda vida. Cada una pide méritos de tu carrera. Hay campaña, votación (o examen), mandato con decisiones y crisis, y reelección. Puedes perder.${P2.fueInstitucional(s) ? ' Tienes experiencia institucional.' : ''}</p>
      ${act ? `<p>Ahora: <b>${C0[act].ic} ${esc(C0[act].n)}</b> · ${EST[P.c[act].estado]}. Elige cada semana tu acción en Inicio.</p>` : ''}</div>${retiro}${lista}${hist}`;
  };
  const R0 = () => ({ lineas: [], porque: [], ingresos: [], hitos: [] });
  UIX.acciones.prRetirarse = (s, b, H) => { if (!H.ui.retirar) { H.ui.retirar = true; H.render(); return; } H.ui.retirar = false; const e = P2.retirarse(s, R0()); H.hecho(e ? `⚠️ ${e}` : null, e ? null : '👋 Te retiras del deporte. Tu imperio sigue.'); };
  UIX.acciones.prCandidatura = (s, b, H) => { const id = b.dataset.id; if (H.ui.candidatura !== id) { H.ui.candidatura = id; H.render(); return; } H.ui.candidatura = null; const R = R0(); const e = P2.candidatura(s, id, R); H.hecho(e ? `⚠️ ${e}` : null, e ? null : (R.lineas.slice(-1)[0] || [])[1]); };
  UIX.acciones.prDejar = (s, b, H) => { if (!H.ui.dejar) { H.ui.dejar = true; H.render(); return; } H.ui.dejar = false; const e = P2.dejarCargo(s, R0()); H.hecho(e ? `⚠️ ${e}` : null, e ? null : '🎖️ Etapa cerrada.'); };
  UIX.acciones.prReintentar = (s, b, H) => { const e = P2.reintentar(s, b.dataset.id); H.hecho(e ? `⚠️ ${e}` : null, e ? null : 'Puedes volver a presentarte cuando quieras.'); };
})(globalThis.P2 = globalThis.P2 || {});
