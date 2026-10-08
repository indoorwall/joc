/* =====================================================================
   18 · MINIJUEGOS EN LOS MOMENTOS DECISIVOS (y vidas para repetirlos)
   Solo en momentos especiales: el día de las pruebas, el torneo del barrio y los partidos
   decisivos (ascenso, descenso, última jornada). Son cortos (un toque) y AYUDAN, pero no lo
   deciden todo: tu nivel sigue mandando. Siempre se pueden «Simular» (resultado neutro).
   Vidas: sirven SOLO para repetir un minijuego que ha salido mal (nunca para deshacer una
   decisión). Se recargan solas (1 cada pocas semanas) y con un anuncio simulado (+1).
   La nota del minijuego (p, de 0 a 1) llega a la lógica en jugarSemana(s, acción, { minijuego }).
   Sin minijuego (bots, simulación), todo funciona exactamente igual que antes.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, r1 } = P2;

  const MINIJUEGOS = {
    prueba: { ic: '📋', n: 'Día de pruebas', d: 'Tres tiros a puerta delante de los ojeadores. Para la barra en la zona verde.', rondas: 3, neutro: 0.4 },
    torneo: { ic: '🏆', n: 'Final del torneo', d: 'Tres jugadas decisivas. Para la barra en la zona verde.', rondas: 3, neutro: 0.4 },
    penalti: { ic: '🥅', n: 'Penalti decisivo', d: 'Último minuto, penalti a favor. Elige esquina y chuta en el momento justo.', rondas: 1, neutro: 0.4 },
  };
  const VIDAS = { max: 3, recargaSemanas: 4 };

  // ¿Esta semana hay un momento decisivo con minijuego?
  function minijuegoSemana(s, accion) {
    if (s.fase === 'pruebas' && s.invitacion && s.semana >= s.invitacion.dia) return 'prueba';
    if (accion === 'torneo') return 'torneo';
    if ((s.fase === 'club' || s.fase === 'amateur') && s.temporada && !s.temporada.cerrada && !s.p.lesion) {
      const T = s.temporada, ultima = T.jornada === T.calendario.length - 1;
      if (ultima || P2.contexto(T).some(t => /ascenso|descenso|decisiv/i.test(t))) return 'penalti';
    }
    return null;
  }
  // Lo que aporta: con p = neutro (simular) no cambia nada
  const mj = s => (s.mjSemana && s.mjSemana.semana === s.semana ? s.mjSemana : null);
  function bonusPrueba(s) { const m = mj(s); return m && m.tipo === 'prueba' ? Math.round((m.p - MINIJUEGOS.prueba.neutro) * 10) : 0; }   // −4 … +6
  function bonusTorneo(s) { const m = mj(s); return m && m.tipo === 'torneo' ? r1((m.p - MINIJUEGOS.torneo.neutro) * 12) : 0; }        // −5 … +7
  // Penalti: si lo metes (p ≥ 0,6) es un gol más para tu equipo y +0,5 de nota; si lo fallas, −0,3
  function penalti(s) { const m = mj(s); return m && m.tipo === 'penalti' ? (m.p >= 0.6 ? 'gol' : m.p <= 0.3 ? 'fallo' : null) : null; }

  // ---------- Vidas ----------
  const vidas = s => (s.vidas && typeof s.vidas === 'object' ? s.vidas : (s.vidas = { n: VIDAS.max, recarga: s.semana || 1 }));
  function usarVida(s) { const v = vidas(s); if (v.n <= 0) return false; v.n--; if (v.n === VIDAS.max - 1) v.recarga = s.semana; P2.teleMon && P2.teleMon(s, 'vida_usada', { quedan: v.n }); return true; }
  function recargarVidas(s) {
    const v = vidas(s);
    if (v.n >= VIDAS.max) { v.recarga = s.semana; return 0; }
    let g = 0;
    while (v.n < VIDAS.max && s.semana - v.recarga >= VIDAS.recargaSemanas) { v.n++; v.recarga += VIDAS.recargaSemanas; g++; }
    return g;
  }
  const semanasParaVida = s => { const v = vidas(s); return v.n >= VIDAS.max ? 0 : Math.max(1, VIDAS.recargaSemanas - (s.semana - v.recarga)); };

  Object.assign(P2, { MINIJUEGOS, VIDAS, minijuegoSemana, bonusPrueba, bonusTorneo, penalti, vidas, usarVida, recargarVidas, semanasParaVida });
})(globalThis.P2 = globalThis.P2 || {});
