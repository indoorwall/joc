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
    promocion: { ic: '⬆️', n: 'Promoción', d: 'Tres jugadas. Para la barra en la zona verde.', rondas: 3, neutro: 0.4 },
    final: { ic: '🏆', n: 'Final', d: 'Tres jugadas. Para la barra en la zona verde.', rondas: 3, neutro: 0.4 },
    penalti: { ic: '🥅', n: 'Penalti decisivo', d: 'Último minuto, penalti a favor. Elige esquina y chuta en el momento justo.', rondas: 1, neutro: 0.4 },
  };
  const VIDAS = { max: 3, recargaSemanas: 6, reintentosPorMomento: 1 };   // como en P1

  // ¿Esta semana hay un momento decisivo con minijuego?
  function minijuegoSemana(s, accion) {
    if (s.fase === 'pruebas' && s.invitacion && s.semana >= s.invitacion.dia) return 'prueba';
    if (accion === 'torneo') return 'torneo';
    // Lo que más pesa: la categoría (promoción) y las finales (copa, Europa, Mundial)
    if (P2.promoPendiente && P2.promoPendiente(s)) return 'promocion';
    if (P2.finalEstaSemana && P2.finalEstaSemana(s)) return 'final';
    if ((s.fase === 'club' || s.fase === 'amateur') && s.temporada && !s.temporada.cerrada && !s.p.lesion) {
      const T = s.temporada, ultima = T.jornada === T.calendario.length - 1;
      if (ultima || P2.contexto(T).some(t => /ascenso|descenso|decisiv/i.test(t))) return 'penalti';
    }
    return null;
  }
  // Lo que aporta (p = neutro no cambia nada; los bots y la simulación de balance no juegan minijuegos)
  const mj = s => (s.mjSemana && s.mjSemana.semana === s.semana ? s.mjSemana : null);
  function bonusPrueba(s) { const m = mj(s); return m && m.tipo === 'prueba' ? Math.round((m.p - MINIJUEGOS.prueba.neutro) * 12) : 0; }   // −5 … +7
  function bonusTorneo(s) { const m = mj(s); return m && m.tipo === 'torneo' ? r1((m.p - MINIJUEGOS.torneo.neutro) * 12) : 0; }        // −5 … +7
  // Penalti (como en P1): aciertas → +1 gol para tu equipo (+2 si es perfecto); fallas → +1 para el rival (+2 si es un desastre)
  function penalti(s) { const m = mj(s); if (!m || m.tipo !== 'penalti') return null; return m.p >= 0.9 ? 'perfecto' : m.p >= 0.6 ? 'gol' : m.p <= 0.1 ? 'desastre' : 'fallo'; }
  // «Simular»: lo decide tu nivel, como mucho un 80 % (nunca perfecto)
  function probSimular(s) { return clamp(0.3 + (s.p.nivel - 50) / 50, 0.15, 0.8); }
  const P_SIM = { acierto: 0.72, fallo: 0.25 };

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

  Object.assign(P2, { probSimular, P_SIM, MINIJUEGOS, VIDAS, minijuegoSemana, bonusPrueba, bonusTorneo, penalti, vidas, usarVida, recargarVidas, semanasParaVida });
})(globalThis.P2 = globalThis.P2 || {});
