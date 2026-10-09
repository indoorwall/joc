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
    P2.tele(s, 'hito', { id });
    if (id === 'titular') s.agente = true;
    if (R && R.hitos) R.hitos.push(H);
    P2.anotar(s, '🏅', `Hito: ${H.n}. Se abre: ${H.abre}.`);
    if (id === 'rentable') encolar(s, { tipo: 'oportunidad' });
    if (id === 'inversion2') { s.capitulo.completado = true; s.capitulo.semana = s.semana; encolar(s, { tipo: 'capitulo' }); }
    P2.momentoMon(s, id === 'inversion2' ? 'finCapitulo' : id);   // momento bueno: aquí podría aparecer una oferta (simulada)
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
        return { texto: o.fx(s, n), titulo: E.titulo, ic: E.ic, semana: o.ocupaSemana ? '__evento' : null };
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
        const ops = [op('ir', 'Ir al acto', `+${nf(M ? M.marcaActo || 1.5 : 1.5)} de marca personal; la marca sigue contenta`, `Esta semana no haces otra cosa, −${CFG.patrocinio.actoEnergia} energía y −${CFG.patrocinio.actoConfianza} confianza del míster`, 'Ninguno', { tags: ['dinero'], ocupaSemana: true })];
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
        // A la tercera crisis seguida ya no valen los parches: o lo cubres entero de tu bolsillo, o vendes, o cierras
        const ultima = (n.crisisSeguidas || 0) >= 3, cubrir = Math.max(1500, -n.caja + 1500);
        if (ultima) return { ic: '🚨', titulo: `Tu ${T.n.toLowerCase()} no aguanta más`, texto: `Tercera crisis seguida. Caja: ${eur(n.caja)}. El banco ya no te presta y recortar no basta.`,
          ops: [op('aportar', `Cubrirlo todo con ${eur(cubrir)} de tu dinero`, 'Sigues adelante con margen', eur(cubrir), 'Si no cambias nada, volverá a pasar', { tags: ['riesgo'], bloqueo: s.p.dinero < cubrir ? `Tienes ${eur(s.p.dinero)}` : null }),
            op('vender', `Vender ya por ${eur(Math.round(v * CFG.empresa.ventaUrgente))}`, 'Recuperas algo', 'Venta urgente', 'Vuelves a empezar', { tags: ['seguro'], ocupaSemana: true }),
            op('cerrar', 'Cerrar el negocio', `Recuperas ${eur(Math.max(0, n.caja) + 800)} (material)`, 'Pierdes lo invertido', 'Vuelves a empezar', { tags: [], ocupaSemana: true })] };
        const ops = [
          op('aportar', `Poner ${eur(falta)} de tu dinero`, 'El negocio sigue igual', 'Tu colchón personal', 'Si el problema sigue, volverá', { tags: ['seguro'], bloqueo: s.p.dinero < falta ? `Tienes ${eur(s.p.dinero)}` : null }),
          op('prestamo', `Pedir un préstamo de ${eur(CFG.empresa.prestamo.importe)}`, 'Liquidez inmediata sin tocar tu dinero', `Intereses del ${nf(CFG.empresa.prestamo.interesSemanal * 150)} % semanal y cuota`, 'La deuda resta valor al negocio', { tags: ['riesgo', 'dinero'], bloqueo: n.deuda > 0 ? 'Ya tienes un préstamo' : null }),
          op('recortar', 'Reorganizar y recortar (1 empleado menos, sueldos bajos, sin publicidad)', 'Ahorras cada semana', 'La semana entera, −10 fama del negocio y peor ambiente', 'Puede que atiendas a menos gente', { tags: ['dinero'], ocupaSemana: true }),
          op('vender', `Vender ya por ${eur(Math.round(v * CFG.empresa.ventaUrgente))}`, 'Recuperas dinero', `Venta urgente: el ${Math.round((1 - CFG.empresa.ventaUrgente) * 100)} % menos de lo que vale; la semana se va en papeles`, 'Vuelves a empezar', { tags: ['seguro'], ocupaSemana: true }),
          op('cerrar', 'Cerrar el negocio', `Recuperas ${eur(Math.max(0, n.caja) + 800)} (material)`, 'Pierdes lo invertido; la semana se va en el cierre', 'Vuelves a empezar', { tags: [], ocupaSemana: true }),
        ];
        return { ic: '🚨', titulo: `Crisis en tu ${T.n.toLowerCase()}`, texto: `Caja: ${eur(n.caja)}. ${n.rachaNeg} semanas seguidas en pérdidas. Hay que hacer algo.`, ops };
      },
      resolver(s, ev, id) {
        const n = neg(s, ev); if (!n) return { texto: 'Ya no tienes ese negocio.', titulo: 'Crisis', ic: '🚨' };
        const falta = Math.max(500, -n.caja + 500);
        n.crisis = false;
        if (id === 'aportar') { const x = (n.crisisSeguidas || 0) >= 3 ? Math.max(1500, -n.caja + 1500) : falta; if (!P2.aportar(s, n.id, x)) { n.crisis = true; return null; } n.rachaNeg = 0; return { texto: `Pones ${eur(x)}. La caja respira.`, titulo: 'Crisis', ic: '💶' }; }
        if (id === 'prestamo') { if ((n.crisisSeguidas || 0) >= 3 || !P2.pedirPrestamo(s, n.id, CFG.empresa.prestamo.interesSemanal * 1.5)) { n.crisis = true; return null; } n.rachaNeg = 0; return { texto: `El banco te presta ${eur(CFG.empresa.prestamo.importe)}.`, titulo: 'Crisis', ic: '🏦' }; }
        const ocupa = ['recortar', 'vender', 'cerrar'].includes(id) ? '__evento' : null;
        if (id === 'recortar' && (n.crisisSeguidas || 0) >= 3) { n.crisis = true; return null; }
        if (id === 'recortar') { n.empleados = Math.max(1, n.empleados - 1); n.sueldo = 'bajo'; n.marketing = 'nada'; n.fama = P2.r1(n.fama - 10); n.moral = P2.r1(Math.max(0.7, n.moral - 0.1)); n.rachaNeg = 0; return { texto: 'Recortas. Duele, pero gastas menos.', titulo: 'Crisis', ic: '✂️', semana: ocupa }; }
        if (id === 'vender') { const v = P2.venderNegocio(s, n.id, CFG.empresa.ventaUrgente); return { texto: `Vendes por ${eur(v)}.`, titulo: 'Crisis', ic: '🤝', semana: ocupa }; }
        if (id === 'cerrar') { P2.tele(s, 'cierre', {}); const v = Math.max(0, n.caja) + 800; s.p.dinero += v; s.negocios = s.negocios.filter(z => z !== n); P2.anotar(s, '🔒', 'Cierro mi negocio.'); return { texto: `Cierras y recuperas ${eur(v)}.`, titulo: 'Crisis', ic: '🔒', semana: ocupa }; }
        n.crisis = true; return null;
      },
    },
    // Ascenso o descenso del club (independiente de tus ofertas personales)
    cambioCategoria: {
      vista(s, ev) {
        const M = P2.mundo(s), aL = P2.LIGAS[ev.mov.a], deL = P2.LIGAS[ev.mov.de];
        const rivales = M.ligas[ev.mov.a].filter(id => id !== (s.temporada && s.temporada.yo)).map(id => M.equipos[id].n);
        const club = ev.club.replace(/ \(.*\)/, '');
        const obj = P2.OBJETIVOS[P2.objetivoClub(s, ev.mov.a, s.temporada.yo)];
        if (ev.mov.tipo === 'filial') return { ic: '🔒', titulo: 'Puestos de ascenso… pero el filial no puede subir', texto: `Acabáis ${ev.pos}º, pero el primer equipo ya juega en ${aL ? P2.LIGAS[deL.sube].n : 'la categoría de arriba'}. La plaza pasa al siguiente.`, ops: [op('seguir', 'Seguir', '', '', '', { prin: true })], fiesta: false };
        const sube = ev.mov.tipo === 'sube';
        return { ic: sube ? '🎉' : '📉', fiesta: sube,
          titulo: sube ? `¡ASCENSO! ${club} sube a ${aL.corto}` : `Descenso: ${club} baja a ${aL.corto}`,
          texto: sube
            ? `Acabáis ${ev.pos}º en ${deL.n}. La temporada que viene jugáis en ${aL.n}: rivales más fuertes y más gente mirando (exposición ×${nf(aL.exposicion)}).${ev.prima ? ` Prima de ascenso: ${eur(ev.prima)}.` : ''} Nuevo objetivo: ${obj.n.toLowerCase()}. Rivales: ${rivales.join(', ')}.`
            : `Acabáis ${ev.pos}º en ${deL.n}. La temporada que viene jugáis en ${aL.n}: rivales más flojos, pero menos visibilidad (exposición ×${nf(aL.exposicion)}). Nuevo objetivo: ${obj.n.toLowerCase()}. Rivales: ${rivales.join(', ')}.`,
          ops: [op('seguir', sube ? '¡A por la nueva categoría!' : 'Toca levantarse', '', '', '', { prin: true })] };
      },
      resolver(s, ev) { return { texto: ev.mov.tipo === 'sube' ? `${ev.club} sube a ${P2.LIGAS[ev.mov.a].n}.` : ev.mov.tipo === 'baja' ? `${ev.club} baja a ${P2.LIGAS[ev.mov.a].n}.` : 'El filial no puede subir.', titulo: 'Fin de temporada', ic: ev.mov.tipo === 'sube' ? '🎉' : '📉' }; },
    },
    // Desbloqueo grande: Empresa (la segunda parte del juego)
    desbloqueo: {
      vista(s, ev) {
        return { ic: '🔓', fiesta: true, grande: true, titulo: 'NUEVO: EMPRESA', texto: 'Tu asesor te enseña negocios en traspaso. A partir de ahora no solo eres deportista: puedes construir tu imperio. Tu dinero y la caja de la empresa irán por separado.',
          ops: [op('ver', '💼 Ver Empresa', 'Mira la peluquería en traspaso', '', '', { prin: true }), op('luego', 'Más tarde', 'Sigues con tu semana', '', '')] };
      },
      resolver(s, ev, id) { s.seccionesNuevas = (s.seccionesNuevas || []).filter(x => id !== 'ver' || x !== 'empresa'); return { texto: id === 'ver' ? 'Abres Empresa.' : 'La tienes en «Imperio».', titulo: 'Empresa', ic: '💼', ir: id === 'ver' ? 'empresa' : null }; },
    },
    // Una marca te llama: firmar, cambiar una por otra (si chocan o estás al máximo) o decir que no
    patroOferta: {
      vista(s, ev) {
        const M = MARCAS.find(m => m.id === ev.marca), C = P2.condicionesMarca(s, M), b = P2.bloqueoMarca(s, M);
        const efectos = M.identidad;
        const choque = b && /Máximo|mismo sector|exclusividad|compartir imagen/.test(b);
        const ops = [op('firmar', `Firmar con ${M.n}`, `Prima ${eur(C.prima)} y ${eur(C.semanal)}/semana durante ${M.semanas} semanas`, M.obligacion, `Audiencia: ${M.audiencia}. Dos faltas rompen el contrato para siempre`, { tags: M.tier === 'deportiva' && M.ef.entreno ? ['deporte', 'dinero'] : ['dinero'], bloqueo: choque ? null : b, ocupaHueco: !!choque })];
        if (choque) {
          // Para firmarla hay que dejar la que choca (o la más antigua, si estás al máximo)
          const sale = s.patros.map(c => MARCAS.find(m => m.id === c.id)).find(N => N.cat === M.cat || (M.incompatible || []).includes(N.tier) || (N.incompatible || []).includes(M.tier)) || MARCAS.find(m => m.id === s.patros[0].id);
          ops[0] = op('cambiar', `Dejar ${sale.n} y firmar con ${M.n}`, `Prima ${eur(C.prima)} y ${eur(C.semanal)}/semana`, `Pierdes ${sale.n} (${sale.identidad.split('.')[0].toLowerCase()})`, M.obligacion, { tags: ['dinero', 'riesgo'], sale: sale.id });
        }
        ops.push(op('no', 'Decir que no', 'Sin obligaciones nuevas; podrás firmarla más adelante en «Marcas»', 'Te pierdes lo que ofrece', '', { tags: ['deporte', 'seguro'] }));
        return { ic: M.ic, titulo: `${M.n} quiere patrocinarte`, texto: `${M.tier === 'local' ? 'Marca local' : M.tier === 'deportiva' ? 'Marca deportiva' : 'Gran marca'}. ${M.identidad}${choque ? ` Ojo: ${b}` : ''}`, ops };
      },
      resolver(s, ev, id) {
        const M = MARCAS.find(m => m.id === ev.marca);
        if (id === 'no') { P2.tele(s, 'marcaRechazada', { id: M.id }); return { texto: `Le dices que no a ${M.n}.`, titulo: 'Patrocinio', ic: M.ic }; }
        if (id === 'cambiar') {
          const v = DECISIONES.patroOferta.vista(s, ev), o = v.ops.find(x => x.id === 'cambiar');
          if (!o) return null;
          P2.dejarMarca(s, o.sale);
          if (!P2.firmarMarca(s, M.id, null)) return null;
          return { texto: `Cambias de marca: ahora con ${M.n}.`, titulo: 'Patrocinio', ic: M.ic };
        }
        if (id !== 'firmar' || !P2.firmarMarca(s, M.id, null)) return null;
        return { texto: `Firmas con ${M.n}.`, titulo: 'Patrocinio', ic: M.ic };
      },
    },
    // Fin normal de un patrocinio: renovar (prima reducida) o dejarlo
    renovarMarca: {
      vista(s, ev) {
        const M = MARCAS.find(m => m.id === ev.marca), C = P2.condicionesMarca(s, M), b = P2.bloqueoMarca(s, M);
        return { ic: M.ic, titulo: `Termina tu contrato con ${M.n}`, texto: `Has cobrado todos los pagos. ¿Renovar? Al renovar no se vuelve a cobrar la prima de primera firma: solo ${eur(C.prima)}.`,
          ops: [op('renovar', `Renovar ${M.semanas} semanas`, `Prima de renovación ${eur(C.prima)} y ${eur(C.semanal)}/semana${C.semanal > M.semanal ? ' (+10 % por cumplir)' : ''}`, M.obligacion, 'Dos faltas rompen el contrato', { tags: ['dinero'], bloqueo: b }),
            op('no', 'No renovar', 'Te quitas obligaciones', 'Dejas de cobrar', 'Puedes volver a firmar más adelante si cumples los requisitos', { tags: ['deporte'] })] };
      },
      resolver(s, ev, id) {
        const M = MARCAS.find(m => m.id === ev.marca);
        if (id === 'no') return { texto: `Dejas a ${M.n}.`, titulo: 'Patrocinio', ic: M.ic };
        if (id !== 'renovar' || !P2.firmarMarca(s, ev.marca, null)) return null;
        return { texto: `Renuevas con ${M.n}.`, titulo: 'Patrocinio', ic: M.ic };
      },
    },
    // Semana 2 de la empresa: ¿inviertes ya en el local? Solo con la caja que tengas
    mejoraInicial: {
      vista(s, ev) {
        const n = neg(s, ev); if (!n) return null;
        const T = P2.tipoDe(n);
        const ops = T.mejorasIniciales.map(M => op(M.id, `${M.ic} ${M.n}`, M.d, `${eur(M.coste)} de la caja`, 'La caja se queda más corta para imprevistos',
          { tags: ['riesgo', 'dinero'], bloqueo: n.caja < M.coste ? `La caja tiene ${eur(n.caja)}` : null }));
        ops.push(op('nada', 'De momento, nada', 'Guardas la caja para imprevistos', 'Sin mejora', 'Ninguno', { tags: ['seguro'] }));
        return { ic: T.ic, titulo: 'Oportunidad: mejorar el local al empezar', texto: `Caja de la ${T.n.toLowerCase()}: ${eur(n.caja)}. Ahora es el momento barato de hacer algo (después no se repite). Puedes poner dinero tuyo en la caja desde «Empresa» antes de decidir.`, ops };
      },
      resolver(s, ev, id) {
        const n = neg(s, ev); if (!n) return { texto: '', titulo: '', ic: '' };
        if (id === 'nada') { n.mejoraInicial = 'nada'; return { texto: 'Guardas la caja.', titulo: 'Puesta en marcha', ic: '💈' }; }
        if (!P2.aplicarMejoraInicial(s, n, id)) return null;
        const M = P2.tipoDe(n).mejorasIniciales.find(m => m.id === id);
        return { texto: `${M.n}: ${M.d}.`, titulo: 'Puesta en marcha', ic: M.ic };
      },
    },
    socioCapital: {
      vista(s, ev) {
        const K = P2.SOCIO;
        return { ic: '☕', titulo: 'La cafetería pide más capital', texto: `Para salir del bache necesitan dinero de los socios. A ti te toca poner ${eur(ev.importe)}. Tu parte vale ahora ${eur(s.socio.valor)}.`,
          ops: [op('poner', `Poner ${eur(ev.importe)}`, 'Mantienes tu parte (suma a su valor)', eur(ev.importe), 'Si sigue mal, puedes perderlo', { tags: ['riesgo'], bloqueo: s.p.dinero < ev.importe ? `Tienes ${eur(s.p.dinero)}` : null }),
            op('no', 'No poner nada', 'No arriesgas más', `Tu parte pierde un ${Math.round(K.dilucion * 100)} % de valor (te diluyen)`, 'Ninguno', { tags: ['seguro', 'dinero'] })] };
      },
      resolver(s, ev, id) {
        const p = s.socio, K = P2.SOCIO; if (!p) return { texto: '', titulo: '', ic: '' };
        if (id === 'poner') { if (s.p.dinero < ev.importe) return null; s.p.dinero -= ev.importe; p.valor += ev.importe; p.aportado += ev.importe; return { texto: `Pones ${eur(ev.importe)} en la cafetería.`, titulo: 'Cafetería', ic: '☕' }; }
        p.valor = Math.round(p.valor * (1 - K.dilucion));
        return { texto: `No pones dinero: tu parte baja a ${eur(p.valor)}.`, titulo: 'Cafetería', ic: '☕' };
      },
    },
    socioOferta: {
      vista(s, ev) {
        return { ic: '🤝', titulo: 'Quieren comprarte tu parte de la cafetería', texto: `Ofrecen ${eur(ev.precio)}. Pusiste ${eur(s.socio.aportado)} y has cobrado ${eur(s.socio.dividendos)} en dividendos. Ahora vale ${eur(s.socio.valor)}.`,
          ops: [op('vender', `Vender por ${eur(ev.precio)}`, 'Dinero en mano para tu siguiente paso', 'Dejas de cobrar dividendos', 'Si la cafetería despega, te lo pierdes', { tags: ['seguro', 'dinero'] }),
            op('no', 'Quedarte', 'Sigues cobrando si va bien', 'Nada', 'Puede bajar', { tags: ['riesgo'] })] };
      },
      resolver(s, ev, id) {
        const p = s.socio; if (!p) return { texto: '', titulo: '', ic: '' };
        if (id === 'vender') { s.p.dinero += ev.precio; p.vendida = true; p.precioVenta = ev.precio; p.valor = 0; P2.anotar(s, '🤝', `Vendo mi parte de la cafetería por ${eur(ev.precio)}.`); return { texto: `Vendes tu parte por ${eur(ev.precio)}.`, titulo: 'Cafetería', ic: '🤝' }; }
        return { texto: 'Te quedas en la cafetería.', titulo: 'Cafetería', ic: '☕' };
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
        const ops = OPORTUNIDADES.map(o => op(o.id, `${o.ic} ${o.n}`, o.d, `Pones tú: ${eur(o.coste)}${o.hipoteca ? ` (hipoteca de ${eur(o.hipoteca.importe)})` : o.prestamo ? ` (préstamo de ${eur(o.prestamo.importe)} para el nuevo negocio)` : ''}`, o.id === 'segunda' ? 'Dos negocios que gestionar y una deuda' : o.id === 'local' ? 'Si la peluquería va mal, la hipoteca sigue ahí' : 'Puede no dar dividendo, perder valor o pedirte más dinero',
          { tags: o.id === 'socio' ? ['seguro'] : ['dinero', 'riesgo'], bloqueo: s.p.dinero < o.coste ? `Tienes ${eur(s.p.dinero)}: puedes ahorrar y elegirla después en «Empresa»` : null }));
        ops.push(op('luego', 'Decidir más adelante', 'Ahorras antes de dar el paso', 'Nada', 'Ninguno', { tags: ['seguro'] }));
        return { ic: '🔑', titulo: 'Se abre tu segunda oportunidad de inversión', texto: 'Tu negocio lleva semanas dando dinero. El banco, tu asesor y tus contactos te traen tres caminos. Elige con cuál empieza tu imperio.', ops };
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
        return { ic: '🏆', titulo: 'Capítulo 1 completado: ahora empieza tu imperio', texto: `En ${s.semana - 1} semanas has pasado del barrio a tener ${s.negocios.length === 1 ? 'una empresa' : `${s.negocios.length} empresas`}${s.socio ? ' y una participación' : ''}. Patrimonio: ${eur(pat)}. Tu segunda inversión: ${O ? O.n.toLowerCase() : '—'}. Lo siguiente: más negocios, locales y decidir cuánto tiempo das al fútbol y cuánto al imperio. Si estás probando el juego: ⚙️ Ajustes → Informe de prueba.`,
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
    const rebaja = 1 - P2.efectoPatro(s, 'interesFinanciacion');   // contactos de una gran marca: préstamos más baratos
    if (id === 'local') {
      const n = s.negocios[0], H = o.hipoteca;
      n.local = true; n.valorLocal = o.precio; n.fianza = 0;
      n.hipoteca = { deuda: H.importe, interes: H.interes * rebaja, cuota: Math.ceil(H.importe / H.plazo) };
      t = `Compras el local (${eur(o.precio)}): pones ${eur(o.coste)} y una hipoteca de ${eur(H.importe)} que paga el negocio. Adiós al alquiler.`;
    }
    if (id === 'segunda') {
      const n = P2.nuevoNegocio('peluqueria', o.caja), P = o.prestamo;
      n.comprado = s.semana; n.invertido = o.coste + P.importe; n.hist = [0, 0, 0];
      n.deuda = P.importe; n.interes = P.interes * rebaja; n.cuota = Math.ceil(P.importe / P.plazo);
      P2.ponerEnMarcha(n, null);
      s.negocios.push(n);
      t = `Abres tu segunda peluquería: traspaso de ${eur(o.traspaso)} (pones ${eur(o.coste - o.caja)} y un préstamo de ${eur(P.importe)}) y ${eur(o.caja)} de caja.`;
    }
    if (id === 'socio') { s.socio = P2.nuevaParticipacion(s, o.coste); t = 'Entras como socio/a en la cafetería: no decides nada; cada trimestre sabrás cómo va.'; }
    P2.anotar(s, o.ic, t);
    P2.celebrar(s, { tipo: 'negocio', n: o.n, ic: o.ic, invertido: o.coste, texto: id === 'socio' ? 'Ahora eres socio/a' : id === 'local' ? 'El local ya es tuyo' : 'Tu segunda empresa' });
    P2.tele(s, 'segunda', { id });
    conseguirHito(s, 'inversion2', null);
    return t;
  }

  // ---- Navegación progresiva: las secciones aparecen cuando tienen sentido ----
  // grupo: botón de la barra inferior donde vive cada sección
  const SECCIONES = [
    { id: 'semana', ic: '🏠', n: 'Inicio', grupo: 'inicio', cond: () => true },
    { id: 'relaciones', ic: '❤️', n: 'Relaciones', grupo: 'vida', cond: () => true },
    { id: 'liga', ic: '📊', n: 'Liga', grupo: 'carrera', cond: s => !!s.temporada, d: 'La clasificación, tu equipo y tu contrato.' },
    { id: 'marcas', ic: '🤝', n: 'Marcas', grupo: 'carrera', cond: s => !!s.hitos.contrato, d: 'Patrocinadores: contratos con prima, pago semanal y actos.' },
    { id: 'tienda', ic: '🛍️', n: 'Tienda', grupo: 'imperio', cond: () => true },
    { id: 'inversiones', ic: '📈', n: 'Inversiones', grupo: 'imperio', cond: () => true },
    { id: 'empresa', ic: '💼', n: 'Empresa', grupo: 'imperio', cond: s => P2.mercadoAbierto(s), d: 'Negocios en traspaso, tu empresa y su caja.' },
    { id: 'patrimonio', ic: '💰', n: 'Patrimonio', grupo: 'imperio', cond: () => true },
    { id: 'premium', ic: '💎', n: 'Personalización Premium', grupo: 'imperio', cond: s => !!s.hitos.contrato, d: 'Ya eres profesional. Se han desbloqueado colecciones especiales (dentro de la Tienda).' },
    { id: 'personaje', ic: '🧍', n: 'Personaje', grupo: 'perfil', cond: () => true },
    { id: 'historia', ic: '🏆', n: 'Mi historia', grupo: 'perfil', cond: () => true },
    { id: 'hitos', ic: '🏅', n: 'Hitos', grupo: 'perfil', cond: () => true },
    { id: 'ajustes', ic: '⚙️', n: 'Ajustes', grupo: 'perfil', cond: () => true },
  ];
  const GRUPOS = [{ id: 'inicio', ic: '🏠', n: 'Inicio' }, { id: 'carrera', ic: '⚽', n: 'Carrera' }, { id: 'vida', ic: '❤️', n: 'Vida' }, { id: 'imperio', ic: '💼', n: 'Imperio' }, { id: 'perfil', ic: '🧍', n: 'Perfil' }];
  const BASICAS = ['semana', 'relaciones', 'tienda', 'inversiones', 'patrimonio', 'personaje', 'historia', 'hitos', 'ajustes'];
  // Devuelve las secciones recién abiertas (y las guarda para avisar una sola vez)
  function revisarSecciones(s, R) {
    s.secciones = Array.isArray(s.secciones) ? s.secciones : BASICAS.slice();
    const nuevas = [];
    for (const x of SECCIONES) if (!s.secciones.includes(x.id) && x.cond(s)) {
      s.secciones.push(x.id); nuevas.push(x);
      if (BASICAS.includes(x.id)) continue;   // las de siempre (partidas antiguas) no se anuncian
      s.seccionesNuevas = (s.seccionesNuevas || []).concat(x.id); P2.anotar(s, '🔓', `Nueva sección: ${x.n}. ${x.d}`);
      if (x.id === 'empresa') encolar(s, { tipo: 'desbloqueo', seccion: 'empresa' });   // la gran evolución del juego
    }
    const anunciadas = nuevas.filter(x => !BASICAS.includes(x.id));
    if (R && R.desbloqueos) R.desbloqueos.push(...anunciadas);
    return anunciadas;
  }
  const seccionesVisibles = s => SECCIONES.filter(x => (s.secciones || BASICAS).includes(x.id));

  function vistaPendiente(s) {
    const ev = s.pendiente; if (!ev) return null;
    const D = DECISIONES[ev.tipo]; if (!D) return null;
    try { return D.vista(s, ev); } catch (_) { return null; }
  }

  // Patrimonio = tu dinero + valor de tus empresas (+ participación)
  // Patrimonio = dinero disponible + empresas + participación + tus cosas con valor (vehículo, vivienda, joyas…)
  function patrimonio(s) { return Math.round(s.p.dinero + s.negocios.reduce((a, n) => a + P2.valorNegocio(n), 0) + (s.socio && !s.socio.vendida ? s.socio.valor : 0) + (P2.valorPosesiones ? P2.valorPosesiones(s) : 0) + (P2.valorExpansiones ? P2.valorExpansiones(s) : 0)); }

  Object.assign(P2, { SECCIONES, GRUPOS, revisarSecciones, seccionesVisibles, encolar, siguiente, conseguirHito, revisarHitos, siguienteHito, DECISIONES, vistaPendiente, elegirOportunidad, patrimonio });
})(globalThis.P2 = globalThis.P2 || {});
