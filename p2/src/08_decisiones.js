/* =====================================================================
   08 · DECISIONES PENDIENTES E HITOS
   Todo lo que hay que decidir pasa por aquí: sucesos, ofertas, actos de
   patrocinio, crisis de la empresa, repesca y la segunda inversión.
   Cada tipo define título, texto, opciones (ventaja/coste/riesgo) y qué hacen.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { CFG, OFERTAS, MARCAS, HITOS, OPORTUNIDADES, eur, nf } = P2;

  function encolar(s, ev) {
    if (!s.pendiente) s.pendiente = ev; else s.cola.push(ev);
  }
  function siguiente(s) { s.pendiente = s.cola.length ? s.cola.shift() : null; }

  // ---- Hitos ----
  function conseguirHito(s, id, R) {
    if (s.hitos[id]) return false;
    const H = HITOS.find(h => h.id === id);
    if (!H) return false;
    s.hitos[id] = s.semana;
    if (id === 'titular') s.agente = true;
    if (R && R.hitos) R.hitos.push(H);
    P2.anotar(s, '🏅', `Hito: ${H.n}. Se abre: ${H.abre}.`);
    if (id === 'rentable') encolar(s, { tipo: 'oportunidad' });
    if (id === 'inversion2') { s.capitulo.completado = true; s.capitulo.semana = s.semana; encolar(s, { tipo: 'capitulo' }); }
    return true;
  }
  function revisarHitos(s, R) {
    if (s.stats.titular >= CFG.club.titularidadesHito) conseguirHito(s, 'titular', R);
    if (s.hitos.contrato && !s.negocios.length && s.p.dinero >= P2.capitalNecesario('peluqueria', 0)) conseguirHito(s, 'capital', R);
    if (s.negocios.length) conseguirHito(s, 'capital', R);
  }
  function siguienteHito(s) { return HITOS.find(h => !s.hitos[h.id]) || null; }

  const op = (id, n, ventaja, coste, riesgo, extra = {}) => Object.assign({ id, n, ventaja, coste, riesgo }, extra);
  const neg = (s, ev) => s.negocios.find(n => n.id === ev.neg);

  const DECISIONES = {
    suceso: {
      vista(s, ev) {
        const E = P2.SUCESOS.find(x => x.id === ev.id), n = neg(s, ev);
        return { ic: E.ic, titulo: E.titulo, texto: typeof E.texto === 'function' ? E.texto(s, n) : E.texto, ops: E.ops.filter(o => !o.cond || o.cond(s, n)) };
      },
      resolver(s, ev, id) {
        const E = P2.SUCESOS.find(x => x.id === ev.id), n = neg(s, ev), o = E.ops.find(x => x.id === id);
        if (!o || (o.cond && !o.cond(s, n))) return null;
        return { texto: o.fx(s, n), titulo: E.titulo, ic: E.ic };
      },
    },
    ofertas: {
      vista(s, ev) {
        const ops = ev.ofertas.map(id => {
          if (id === 'renovar') {
            const c = ev.condiciones.find(x => x.id === 'renovar'), O = P2.oferta(s);
            return op('renovar', c.n, `${eur(c.sueldo)}/semana · prima ${eur(c.prima)} · ${c.temporadas} temporadas`, 'Sigues donde estás', `Techo de nivel ${O.techoNivel}`, { tags: ['seguro'], clubIc: O.ic });
          }
          const O = OFERTAS[id];
          return op(id, `${O.ic} ${O.n} · ${O.lema}`, `${eur(O.sueldo)}/semana${O.prima ? ` · prima ${eur(O.prima)}` : ''} · ${O.pros.join(' · ')}`, O.contras.join(' · ') || '—', `Entreno ×${nf(O.entreno)} · exposición ×${nf(O.exposicion)} · ${O.temporadas} ${O.temporadas === 1 ? 'temporada' : 'temporadas'}`,
            { tags: O.sueldo >= 200 ? ['dinero'] : ['deporte'], oferta: id });
        });
        if (ev.origen === 'fin' && ev.contratoVivo) ops.push(op('seguir', 'Seguir con tu contrato actual', `Te quedan ${s.contrato.temporadasRestantes} temporadas`, 'Nada', 'Ninguno', { tags: ['seguro'] }));
        if (ev.origen === 'sinOferta' && s.fase === 'amateur') ops.push(op('seguir', 'Seguir en CD San Roque', `Próxima repesca en ${CFG.amateur.repescaCada} semanas`, 'Sigues sin ser profesional', 'Ninguno', { tags: ['seguro'] }));
        if (ev.origen === 'repesca') ops.push(op('seguir', 'Quedarte en CD San Roque', 'Sigues jugando cada semana', 'Rechazas ser profesional', '—', { tags: ['seguro'] }));
        const titulo = { pruebas: 'Ofertas tras las pruebas', repesca: '¡La repesca sale bien!', fin: 'Final de temporada: ¿qué haces?', sinOferta: s.fase === 'amateur' ? 'La repesca no sale' : 'Sin contrato profesional… todavía' }[ev.origen];
        const texto = ev.origen === 'sinOferta'
          ? (s.fase === 'amateur' ? `Sacas un ${ev.score}: hace falta ${CFG.pruebas.rangos[2].min}. Sigue sumando nivel en San Roque.` : `${ev.score != null ? `Sacas un ${ev.score} y hace falta ${CFG.pruebas.rangos[2].min}. ` : 'Se acaba el periodo de captación sin que nadie te llame. '}No es el final: CD San Roque (Regional) te ofrece jugar. Cada ${CFG.amateur.repescaCada} semanas habrá una repesca.`)
          : ev.origen === 'fin' ? `Confianza del club ${Math.round(s.confianza)} · interés de otros clubes ${Math.round(s.interes)} · nivel ${nf(s.p.nivel)}.`
            : `Sacas un ${ev.score}. Cada club es un camino distinto, no solo otro sueldo.`;
        return { ic: '✍️', titulo, texto, ops };
      },
      resolver(s, ev, id, R) {
        if (id === 'seguir') {
          if (ev.origen === 'fin') P2.nuevaTemporada(s, R);
          return { texto: 'Sigues donde estás.', titulo: 'Decisión', ic: '👍' };
        }
        if (id === 'renovar') { P2.firmarRenovacion(s, ev.condiciones.find(x => x.id === 'renovar'), R); return { texto: `Renuevas con ${P2.oferta(s).n}.`, titulo: 'Renovación', ic: '✍️' }; }
        if (!ev.ofertas.includes(id)) return null;
        P2.firmar(s, id, R);
        return { texto: `Firmas con ${OFERTAS[id].n}: ${eur(OFERTAS[id].sueldo)}/semana.`, titulo: 'Contrato firmado', ic: OFERTAS[id].ic, firma: id };
      },
    },
    acto: {
      vista(s, ev) {
        const M = MARCAS.find(m => m.id === ev.marca), c = s.patros.find(x => x.id === ev.marca) || {};
        const ops = [op('ir', 'Ir al acto (ocupa tu semana)', '+1,5 fama; la marca sigue pagando', 'Esta semana no haces otra cosa', 'Ninguno', { tags: ['dinero'] })];
        if (!c.aplazado) ops.push(op('aplazar', 'Pedir moverlo una semana', 'Esta semana haces lo que quieras', 'Solo se puede una vez por contrato', 'Ninguno', { tags: ['deporte'] }));
        ops.push(op('no', 'No ir', 'Esta semana haces lo que quieras', `Falta ${(c.faltas || 0) + 1}/${CFG.patrocinio.faltasMax}`, 'Con dos faltas rompen el contrato (−4 fama)', { tags: ['deporte', 'riesgo'] }));
        return { ic: M ? M.ic : '📣', titulo: `Compromiso con ${M ? M.n : 'tu marca'}`, texto: M ? M.obligacion + '.' : '', ops };
      },
      resolver(s, ev, id) {
        if (!['ir', 'aplazar', 'no'].includes(id)) return null;
        const t = P2.resolverActo(s, ev.marca, id);
        return { texto: t, titulo: 'Patrocinio', ic: '📣', semana: id === 'ir' ? '__acto' : null };
      },
    },
    crisis: {
      vista(s, ev) {
        const n = neg(s, ev); if (!n) return null;
        const T = P2.tipoDe(n), falta = Math.max(500, -n.caja + 500), v = P2.valorNegocio(n);
        const ops = [
          op('aportar', `Poner ${eur(falta)} de tu dinero`, 'El negocio sigue igual', 'Tu colchón personal', 'Si el problema sigue, volverá', { tags: ['seguro'], bloqueo: s.p.dinero < falta ? `Tienes ${eur(s.p.dinero)}` : null }),
          op('prestamo', `Pedir un préstamo de ${eur(CFG.empresa.prestamo.importe)}`, 'Liquidez inmediata sin tocar tu dinero', `Intereses del ${nf(CFG.empresa.prestamo.interesSemanal * 150)} % semanal y cuota`, 'La deuda resta valor al negocio', { tags: ['riesgo', 'dinero'], bloqueo: n.deuda > 0 ? 'Ya tienes un préstamo' : null }),
          op('recortar', 'Recortar costes (1 empleado menos, sueldos bajos, sin publicidad)', 'Ahorras cada semana', '−10 fama del negocio y peor ambiente', 'Puede que atiendas a menos gente', { tags: ['dinero'] }),
          op('vender', `Vender ya por ${eur(Math.round(v * CFG.empresa.ventaUrgente))}`, 'Recuperas dinero', `Venta urgente: el ${Math.round((1 - CFG.empresa.ventaUrgente) * 100)} % menos de lo que vale`, 'Vuelves a empezar', { tags: ['seguro'] }),
          op('cerrar', 'Cerrar el negocio', `Recuperas ${eur(Math.max(0, n.caja) + 800)} (material)`, 'Pierdes lo invertido', 'Vuelves a empezar', { tags: [] }),
        ];
        return { ic: '🚨', titulo: `Crisis en tu ${T.n.toLowerCase()}`, texto: `Caja: ${eur(n.caja)}. ${n.rachaNeg} semanas seguidas en pérdidas. Hay que hacer algo.`, ops };
      },
      resolver(s, ev, id) {
        const n = neg(s, ev); if (!n) return { texto: 'Ya no tienes ese negocio.', titulo: 'Crisis', ic: '🚨' };
        const falta = Math.max(500, -n.caja + 500);
        n.crisis = false;
        if (id === 'aportar') { if (!P2.aportar(s, n.id, falta)) return null; n.rachaNeg = 0; return { texto: `Pones ${eur(falta)}. La caja respira.`, titulo: 'Crisis', ic: '💶' }; }
        if (id === 'prestamo') { if (!P2.pedirPrestamo(s, n.id, CFG.empresa.prestamo.interesSemanal * 1.5)) return null; n.rachaNeg = 0; return { texto: `El banco te presta ${eur(CFG.empresa.prestamo.importe)}.`, titulo: 'Crisis', ic: '🏦' }; }
        if (id === 'recortar') { n.empleados = Math.max(1, n.empleados - 1); n.sueldo = 'bajo'; n.marketing = 'nada'; n.fama = P2.r1(n.fama - 10); n.moral = P2.r1(Math.max(0.7, n.moral - 0.1)); n.rachaNeg = 0; return { texto: 'Recortas. Duele, pero gastas menos.', titulo: 'Crisis', ic: '✂️' }; }
        if (id === 'vender') { const v = P2.venderNegocio(s, n.id, CFG.empresa.ventaUrgente); return { texto: `Vendes por ${eur(v)}.`, titulo: 'Crisis', ic: '🤝' }; }
        if (id === 'cerrar') { const v = Math.max(0, n.caja) + 800; s.p.dinero += v; s.negocios = s.negocios.filter(z => z !== n); P2.anotar(s, '🔒', 'Cierro mi negocio.'); return { texto: `Cierras y recuperas ${eur(v)}.`, titulo: 'Crisis', ic: '🔒' }; }
        n.crisis = true; return null;
      },
    },
    repesca: {
      vista() {
        return { ic: '🔁', titulo: 'Repesca del Atlético y de UD Puerto', texto: 'Una nueva oportunidad para firmar como profesional. Cuenta tu nivel y tu energía de hoy.',
          ops: [op('ir', 'Presentarte a la repesca', 'Si llegas a 48, contrato profesional', 'Nada', 'Si sale mal, otra en 6 semanas', { tags: ['deporte'] }), op('no', 'Esta vez no', 'Sigues a lo tuyo', 'Pierdes la oportunidad', 'Ninguno', { tags: ['seguro'] })] };
      },
      resolver(s, ev, id, R) {
        if (id === 'no') return { texto: 'Dejas pasar la repesca.', titulo: 'Repesca', ic: '🔁' };
        if (id !== 'ir') return null;
        const sc = P2.diaDePruebas(s, R, 'repesca');
        return { texto: `Repesca: sacas un ${sc}.`, titulo: 'Repesca', ic: '🔁' };
      },
    },
    oportunidad: {
      vista(s) {
        const ops = OPORTUNIDADES.map(o => op(o.id, `${o.ic} ${o.n}`, o.d, eur(o.coste), o.id === 'segunda' ? 'Más trabajo y más riesgo' : o.id === 'local' ? 'Te quedas con poca liquidez' : 'No controlas el negocio',
          { tags: o.id === 'socio' ? ['seguro'] : ['dinero', 'riesgo'], bloqueo: s.p.dinero < o.coste ? `Tienes ${eur(s.p.dinero)}: puedes ahorrar y elegirla después en «Empresa»` : null }));
        ops.push(op('luego', 'Decidir más adelante', 'Ahorras antes de dar el paso', 'Nada', 'Ninguno', { tags: ['seguro'] }));
        return { ic: '🔑', titulo: 'Se abre tu segunda oportunidad de inversión', texto: 'Tu peluquería lleva semanas dando dinero. El banco, tu asesor y tus contactos te traen tres caminos. Elige con cuál empieza tu imperio.', ops };
      },
      resolver(s, ev, id) {
        if (id === 'luego') { s.oportunidadAbierta = true; return { texto: 'Lo piensas con calma. La tienes en «Empresa».', titulo: 'Inversión', ic: '🔑' }; }
        const t = elegirOportunidad(s, id);
        return t ? { texto: t, titulo: 'Segunda inversión', ic: '🔑' } : null;
      },
    },
    capitulo: {
      vista(s) {
        const pat = patrimonio(s);
        const O = P2.OPORTUNIDADES.find(o => o.id === s.oportunidad);
        return { ic: '🏆', titulo: 'Capítulo 1 completado: ahora empieza tu imperio', texto: `En ${s.semana - 1} semanas has pasado del barrio a tener ${s.negocios.length === 1 ? 'una empresa' : `${s.negocios.length} empresas`}${s.socio ? ' y una participación' : ''}. Patrimonio: ${eur(pat)}. Tu segunda inversión: ${O ? O.n.toLowerCase() : '—'}. Lo siguiente: más negocios, locales y decidir cuánto tiempo das al fútbol y cuánto al imperio.`,
          ops: [op('seguir', 'Seguir jugando', 'Tu carrera y tus empresas continúan', '', '', { tags: ['seguro'], prin: true })] };
      },
      resolver() { return { texto: 'Sigues construyendo.', titulo: 'Capítulo 1', ic: '🏆' }; },
    },
  };

  function elegirOportunidad(s, id) {
    const o = OPORTUNIDADES.find(x => x.id === id);
    if (!o || s.p.dinero < o.coste || s.oportunidad) return null;
    s.p.dinero -= o.coste;
    s.oportunidad = id; s.oportunidadAbierta = false;
    let t = '';
    if (id === 'local') { s.negocios[0].local = true; t = 'Compras el local: tu peluquería deja de pagar alquiler.'; }
    if (id === 'segunda') { const n = P2.nuevoNegocio('peluqueria', 1000); n.comprado = s.semana; n.invertido = o.coste; n.hist = [0, 0, 0]; s.negocios.push(n); t = 'Abres tu segunda peluquería (con 1.000 € de caja).'; }
    if (id === 'socio') { s.socio = { inversion: o.coste, desde: s.semana }; t = 'Entras como socio/a en la cafetería: cobrarás una parte de lo que gane.'; }
    P2.anotar(s, o.ic, t);
    conseguirHito(s, 'inversion2', null);
    return t;
  }

  function vistaPendiente(s) {
    const ev = s.pendiente; if (!ev) return null;
    const D = DECISIONES[ev.tipo]; if (!D) return null;
    try { return D.vista(s, ev); } catch (_) { return null; }
  }

  // Patrimonio = tu dinero + valor de tus empresas (+ participación)
  function patrimonio(s) { return Math.round(s.p.dinero + s.negocios.reduce((a, n) => a + P2.valorNegocio(n), 0) + (s.socio ? s.socio.inversion : 0)); }

  Object.assign(P2, { encolar, siguiente, conseguirHito, revisarHitos, siguienteHito, DECISIONES, vistaPendiente, elegirOportunidad, patrimonio });
})(globalThis.P2 = globalThis.P2 || {});
