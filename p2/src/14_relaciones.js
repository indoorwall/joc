/* =====================================================================
   14 · RELACIONES: las personas que hacen que la carrera sea una vida
   Data-driven: RELACIONES (personas) y EVENTOS_RELACION (situaciones con decisiones).
   Las relaciones cambian solo por decisiones y eventos, nunca por «no entrar»:
   no hay mantenimiento semanal ni pérdida automática. Muchas decisiones tienen
   consecuencias semanas después (agenda), y el juego recuerda por qué.
   ===================================================================== */
(function (P2) {
  'use strict';
  const { clamp, r1, eur, rnd } = P2;

  // look: apariencia del avatar de cada persona (mismo dibujo que tu personaje)
  const RELACIONES = [
    { id: 'madre', n: 'Carmen', rol: 'Tu madre', tipo: 'familia', ic: '👩', inicial: 75, aparece: () => true, look: { piel: '1', pelo: 'mono', colorPelo: 'castano', ropa: 'chaqueta', colorRopa: 'morado', fondo: 'rosa' } },
    { id: 'padre', n: 'Luis', rol: 'Tu padre', tipo: 'familia', ic: '👨', inicial: 60, aparece: () => true, look: { piel: '2', pelo: 'rapado', colorPelo: 'canoso', cara: 'bigote', ropa: 'camiseta', colorRopa: 'azul', fondo: 'azul' } },
    { id: 'marc', n: 'Marc', rol: 'Mejor amigo', tipo: 'amigo', ic: '🧑', inicial: 70, aparece: () => true, look: { piel: '0', pelo: 'rizos', colorPelo: 'pelirrojo', ropa: 'sudadera', colorRopa: 'naranja', fondo: 'naranja' } },
    { id: 'dani', n: 'Dani', rol: 'Amigo del barrio', tipo: 'amigo', ic: '🧑‍🦱', inicial: 55, aparece: () => true, look: { piel: '4', pelo: 'corto', colorPelo: 'negro', ropa: 'camiseta', colorRopa: 'verde', cabeza: 'gorra', fondo: 'verde' } },
    { id: 'iker', n: 'Iker', rol: 'Compañero de equipo', tipo: 'companero', ic: '⚽', inicial: 50, aparece: s => !!s.temporada, look: { piel: '3', pelo: 'cresta', colorPelo: 'rubio', ropa: 'equipacion', fondo: 'azul' } },
    { id: 'mister', rol: 'Entrenador', tipo: 'entrenador', ic: '👔', aparece: s => !!s.temporada, valor: s => s.confianza,
      nombre: s => ({ puerto: 'Míster Ruiz', atleticoB: 'Míster Gallardo', atletico: 'Míster Gallardo', sanroque: 'Míster Paco', costa: 'Míster Lago' }[P2.oferta(s) ? P2.oferta(s).club : ''] || 'Tu míster'),
      look: { piel: '2', pelo: 'calvo', colorPelo: 'canoso', ropa: 'chaqueta', colorRopa: 'negro', gafas: 'redondas', fondo: 'morado' } },
    { id: 'sonia', n: 'Sonia Vidal', rol: 'Representante', tipo: 'representante', ic: '🤝', inicial: 55, aparece: s => !!s.agente, look: { piel: '1', pelo: 'largo', colorPelo: 'negro', ropa: 'traje', pantalon: 'traje', gafas: 'sol', fondo: 'morado' } },
    { id: 'pareja', rol: 'Pareja', tipo: 'pareja', ic: '❤️', bloqueada: 'Más adelante' },
    { id: 'contactos', rol: 'Contactos de empresa', tipo: 'contacto', ic: '💼', bloqueada: 'Más adelante' },
  ];
  const persona = id => RELACIONES.find(r => r.id === id);
  const rels = s => (s.relaciones && typeof s.relaciones === 'object' ? s.relaciones : (s.relaciones = {}));
  function valorRel(s, id) { const R = persona(id); if (!R) return 0; if (R.valor) return Math.round(R.valor(s)); const x = rels(s)[id]; return x ? x.v : R.inicial || 50; }
  const visible = (s, R) => !R.bloqueada && R.aparece(s);
  const nombreRel = (s, R) => (R.nombre ? R.nombre(s) : R.n);
  function estadoRel(v) {
    return v >= 85 ? 'Confía ciegamente en ti' : v >= 70 ? 'Confía mucho en ti' : v >= 55 ? 'Buena relación' : v >= 40 ? 'Algo distante' : v >= 25 ? 'Relación tensa' : 'Relación rota';
  }
  // Cambia una relación por un motivo (queda en su historia). El míster usa la confianza que ya existe
  function cambiarRel(s, id, d, motivo) {
    const R = persona(id); if (!R || R.bloqueada || !d) return 0;
    if (id === 'mister') { s.confianza = clamp(s.confianza + d, 0, 100); return d; }
    const x = rels(s)[id] || (rels(s)[id] = { v: R.inicial || 50, historia: [] });
    const antes = x.v; x.v = Math.round(clamp(x.v + d, 0, 100));
    if (motivo) { x.historia.push({ semana: s.semana, d: x.v - antes, t: motivo }); if (x.historia.length > 6) x.historia.shift(); }
    P2.tele(s, 'relacion', { id, d: x.v - antes });
    return x.v - antes;
  }
  function personasVisibles(s) { return RELACIONES.filter(R => R.bloqueada || R.aparece(s)); }

  // ---------- Eventos de relación (mismo motor que los sucesos) ----------
  const prog = (s, sem, efecto, data) => P2.programar(s, sem, efecto, Object.assign({ desde: s.semana }, data || {}));
  const EVENTOS_RELACION = [
    { id: 'marcNegocio', ambito: 'relacion', rel: 'marc', fases: ['barrio', 'pruebas', 'amateur', 'club'], unaVez: true, cond: s => s.semana >= 4, peso: () => 3,
      ic: '🧑', titulo: 'Marc te pide ayuda con su puesto de bocadillos', texto: () => 'Quiere montar un puesto en las fiestas del barrio y le faltan manos… y algo de dinero.',
      ops: [
        { id: 'prestar', n: 'Prestarle 200 €', ventaja: 'Marc no lo olvidará', coste: '200 €', riesgo: 'Puede tardar en devolverlo', tags: ['riesgo'], cond: s => s.p.dinero >= 200,
          fx: s => { s.p.dinero -= 200; cambiarRel(s, 'marc', 15, 'Le prestaste dinero para su puesto'); prog(s, 6, 'marcDevuelve', { x: 200 }); prog(s, 13, 'marcContacto'); return 'Marc te abraza: «Te lo devuelvo, de verdad».'; } },
        { id: 'finde', n: 'Echarle una mano el fin de semana', ventaja: 'Mejora la relación sin poner dinero', coste: '−15 energía', riesgo: 'Ninguno', tags: ['seguro'],
          fx: s => { s.p.energia = clamp(s.p.energia - 15, 0, 100); cambiarRel(s, 'marc', 10, 'Le ayudaste a montar su puesto'); prog(s, 13, 'marcContacto'); return 'Montáis el puesto juntos. Os reís mucho.'; } },
        { id: 'no', n: 'Decirle que ahora no puedes', ventaja: 'Te centras en lo tuyo', coste: 'Marc se queda tocado', riesgo: 'La relación se enfría', tags: ['deporte', 'dinero'],
          fx: s => { cambiarRel(s, 'marc', -10, 'No le ayudaste con su puesto'); return 'Marc dice que lo entiende. No suena muy convencido.'; } },
      ] },
    { id: 'padreDuda', ambito: 'relacion', rel: 'padre', fases: ['barrio'], unaVez: true, cond: s => s.semana >= 3 && !s.invitacion, peso: () => 3,
      ic: '👨', titulo: 'Tu padre duda de lo del fútbol', texto: () => '«¿Y si no sale? Deberías buscar algo serio.»',
      ops: [
        { id: 'prometer', n: 'Prometerle que lo conseguirás', ventaja: 'Si lo logras, estará orgulloso', coste: 'Se queda preocupado', riesgo: 'Si no lo logras, se notará', tags: ['deporte', 'riesgo'],
          fx: s => { cambiarRel(s, 'padre', -2, 'Le prometiste que lo conseguirías'); prog(s, 10, 'padreOrgullo'); return '«Vale. Pero dame una alegría.»'; } },
        { id: 'trabajo', n: 'Decirle que también trabajarás', ventaja: '+6 con tu padre', coste: 'Le has dado la razón a medias', riesgo: 'Ninguno', tags: ['seguro', 'dinero'],
          fx: s => { cambiarRel(s, 'padre', 6, 'Le dijiste que también trabajarías'); return 'Tu padre se queda más tranquilo.'; } },
      ] },
    { id: 'cenaFamiliar', ambito: 'relacion', rel: 'madre', fases: ['club', 'amateur'], enfria: 16, cond: s => !!s.temporada && s.temporada.jornada >= 3, peso: () => 1.5,
      ic: '👩', titulo: 'Comida familiar el domingo', texto: () => 'Tu madre ha invitado a toda la familia. Es el día antes de un partido.',
      ops: [
        { id: 'ir', n: 'Ir a la comida', ventaja: '+8 con tu madre y +4 con tu padre', coste: '−8 energía (la sobremesa es larga)', riesgo: 'Ninguno', tags: ['seguro'],
          fx: s => { s.p.energia = clamp(s.p.energia - 8, 0, 100); cambiarRel(s, 'madre', 8, 'Fuiste a la comida familiar'); cambiarRel(s, 'padre', 4, 'Fuiste a la comida familiar'); return 'Croquetas, risas y tu abuela preguntando por la novia.'; } },
        { id: 'no', n: 'Quedarte descansando', ventaja: 'Llegas fresco al partido', coste: '−5 con tu madre', riesgo: 'Ninguno', tags: ['deporte'],
          fx: s => { cambiarRel(s, 'madre', -5, 'No fuiste a la comida familiar'); return 'Tu madre te guarda un táper. Y un poco de rencor.'; } },
      ] },
    { id: 'ikerNovato', ambito: 'relacion', rel: 'iker', fases: ['club', 'amateur'], unaVez: true, cond: s => !!s.temporada && s.temporada.jornada >= 2, peso: () => 3,
      ic: '⚽', titulo: 'Iker acaba de llegar a la ciudad', texto: () => 'Tu nuevo compañero no conoce a nadie y busca piso.',
      ops: [
        { id: 'acoger', n: 'Ayudarle a instalarse', ventaja: 'Un aliado en el vestuario', coste: '−10 energía', riesgo: 'Ninguno', tags: ['seguro'],
          fx: s => { s.p.energia = clamp(s.p.energia - 10, 0, 100); cambiarRel(s, 'iker', 15, 'Le ayudaste a instalarse'); prog(s, 6, 'ikerAsiste'); return 'Le enseñas el barrio y el mejor bar de bocadillos.'; } },
        { id: 'no', n: 'Cada uno a lo suyo', ventaja: 'Tu tiempo es tuyo', coste: 'Iker se busca la vida', riesgo: 'Ninguno', tags: ['deporte'],
          fx: s => { cambiarRel(s, 'iker', -4, 'No le ayudaste al llegar'); return 'Iker encuentra piso solo. Te saluda con frialdad.'; } },
      ] },
    { id: 'ikerPuesto', ambito: 'relacion', rel: 'iker', fases: ['club'], enfria: 12, cond: s => { const p = P2.probTitular(s); return !!s.temporada && p && p.p < 0.75 && !s.p.lesion; }, peso: () => 2,
      ic: '⚽', titulo: 'Iker y tú os jugáis el mismo puesto', texto: () => 'El míster duda entre los dos para el domingo.',
      ops: [
        { id: 'pique', n: 'Pique sano: entrenar más que él', ventaja: '+0,5 de nivel', coste: '−6 con Iker', riesgo: 'El vestuario lo nota', tags: ['deporte'],
          fx: s => { s.p.nivel = r1(Math.min(P2.techoClub(s), s.p.nivel + 0.5)); cambiarRel(s, 'iker', -6, 'Os picasteis por el puesto'); return 'Entrenas como si fuera una final.'; } },
        { id: 'pacto', n: 'Hablarlo con él', ventaja: '+6 con Iker y +2 confianza del míster', coste: 'Nada', riesgo: 'Ninguno', tags: ['seguro'],
          fx: s => { cambiarRel(s, 'iker', 6, 'Hablasteis lo del puesto'); cambiarRel(s, 'mister', 2); return '«Que juegue el que esté mejor.» El míster lo valora.'; } },
      ] },
    { id: 'soniaComision', ambito: 'relacion', rel: 'sonia', fases: ['club'], unaVez: true, cond: s => !!s.agente && s.semana >= (s.hitos.titular || 0) + 3, peso: () => 3,
      ic: '🤝', titulo: 'Sonia, tu representante, quiere subir su comisión', texto: () => '«Te estoy consiguiendo cosas. Quiero el 10 % de las primas.»',
      ops: [
        { id: 'aceptar', n: 'Aceptar', ventaja: '+15 con Sonia: peleará más tus renovaciones', coste: 'Algo menos de primas', riesgo: 'Ninguno', tags: ['seguro'],
          fx: s => { cambiarRel(s, 'sonia', 15, 'Aceptaste su comisión'); s.comisionAgente = 0.1; return 'Sonia sonríe: «Vas a ver lo que consigo».'; } },
        { id: 'no', n: 'Negarte', ventaja: 'Te quedas todo', coste: '−15 con Sonia', riesgo: 'Si la relación se rompe, la pierdes', tags: ['dinero', 'riesgo'],
          fx: s => { cambiarRel(s, 'sonia', -15, 'Te negaste a subir su comisión'); prog(s, 8, 'soniaDecide'); return 'Sonia cuelga sin despedirse.'; } },
      ] },
    { id: 'cumpleMarc', ambito: 'relacion', rel: 'marc', fases: ['barrio', 'pruebas', 'amateur', 'club'], unaVez: true, cond: s => s.semana >= 12, peso: () => 2,
      ic: '🎂', titulo: 'Es el cumpleaños de Marc', texto: () => 'Organiza un viaje de fin de semana con la cuadrilla.',
      ops: [
        { id: 'ir', n: 'Irte con ellos', ventaja: '+10 con Marc y +5 con Dani, +10 energía', coste: '120 € y la semana entera', riesgo: 'Ninguno', tags: ['seguro'], ocupaSemana: true, cond: s => s.p.dinero >= 120,
          fx: s => { s.p.dinero -= 120; s.p.energia = clamp(s.p.energia + 10, 0, 100); cambiarRel(s, 'marc', 10, 'Fuiste a su cumpleaños'); cambiarRel(s, 'dani', 5, 'Fuiste al cumpleaños de Marc'); return 'Un fin de semana que recordaréis siempre.'; } },
        { id: 'regalo', n: 'Mandarle un buen regalo', ventaja: '+4 con Marc', coste: '60 €', riesgo: 'Ninguno', tags: ['dinero'], cond: s => s.p.dinero >= 60,
          fx: s => { s.p.dinero -= 60; cambiarRel(s, 'marc', 4, 'Le mandaste un regalo'); return 'Le encanta, aunque te echa de menos.'; } },
        { id: 'no', n: 'No puedes', ventaja: 'Te centras', coste: '−8 con Marc', riesgo: 'Ninguno', tags: ['deporte'],
          fx: s => { cambiarRel(s, 'marc', -8, 'No fuiste a su cumpleaños'); return 'Marc sube fotos del viaje. Tú no sales en ninguna.'; } },
      ] },
    { id: 'calderaPadres', ambito: 'relacion', rel: 'madre', fases: ['club'], unaVez: true, cond: s => s.p.dinero >= 1200, peso: () => 2,
      ic: '🔥', titulo: 'A tus padres se les rompe la caldera', texto: () => 'En pleno invierno. Arreglarla cuesta 600 €.',
      ops: [
        { id: 'pagar', n: 'Pagarla tú', ventaja: '+10 con tu madre y con tu padre', coste: '600 €', riesgo: 'Ninguno', tags: ['seguro'],
          fx: s => { s.p.dinero -= 600; cambiarRel(s, 'madre', 10, 'Les pagaste la caldera'); cambiarRel(s, 'padre', 10, 'Les pagaste la caldera'); prog(s, 10, 'padresDevuelven'); return 'Tu padre no sabe dónde meterse. Tu madre llora.'; } },
        { id: 'mitad', n: 'Pagar la mitad', ventaja: '+4 con los dos', coste: '300 €', riesgo: 'Ninguno', tags: ['dinero'],
          fx: s => { s.p.dinero -= 300; cambiarRel(s, 'madre', 4, 'Pagaste media caldera'); cambiarRel(s, 'padre', 4, 'Pagaste media caldera'); return 'Lo pagáis a medias.'; } },
        { id: 'no', n: 'Que se apañen', ventaja: 'Guardas tu dinero', coste: '−6 con los dos', riesgo: 'Ninguno', tags: ['dinero'],
          fx: s => { cambiarRel(s, 'madre', -6, 'No les ayudaste con la caldera'); cambiarRel(s, 'padre', -6, 'No les ayudaste con la caldera'); return 'Pasan una semana de frío.'; } },
      ] },
    // Solo sale por una consecuencia anterior (lo lanza la agenda): Marc te presenta a alguien
    { id: 'marcPresenta', ambito: 'relacion', rel: 'marc', fases: ['barrio', 'pruebas', 'amateur', 'club'], soloAgenda: true, cond: () => true, peso: () => 0,
      ic: '🧑', titulo: 'Marc te presenta a Pilar', texto: s => `Por la ayuda con su puesto (semana ${(s.agendaInfo || {}).desde || '?'}), Marc te presenta a Pilar: se jubila y traspasa su peluquería.`,
      ops: [
        { id: 'interesa', n: 'Me interesa', ventaja: 'Con contrato profesional, puedes comprarla antes y 800 € más barata', coste: 'Nada por ahora', riesgo: 'Ninguno', tags: ['dinero', 'seguro'],
          fx: s => { s.contactoNegocio = true; s.descuentoTraspaso = 800; cambiarRel(s, 'marc', 5, 'Te presentó a Pilar'); return 'Pilar te guarda la peluquería con descuento. Mírala en «Imperio».'; } },
        { id: 'no', n: 'Ahora no es el momento', ventaja: 'Sin compromisos', coste: 'Pierdes el descuento', riesgo: 'Ninguno', tags: ['deporte'], fx: () => 'Le das las gracias a Marc.' },
      ] },
  ];

  // Efectos diferidos de las relaciones (la agenda los lanza semanas después)
  Object.assign(P2.EFECTOS, {
    marcDevuelve: (s, d) => { if (valorRel(s, 'marc') < 50) return ['🧑', 'Marc no te devuelve lo que le prestaste. La relación ya no es la que era.', 'mal']; s.p.dinero += d.x + 50; return ['🧑', `Marc te devuelve los ${eur(d.x)}… y 50 € más «por los intereses».`, 'bien']; },
    marcContacto: (s, d) => {
      if (valorRel(s, 'marc') < 65 || s.negocios.length) return null;
      s.agendaInfo = { desde: d.desde };
      P2.encolar(s, { tipo: 'suceso', id: 'marcPresenta' });
      return ['🧑', `Esto viene de la semana ${d.desde}: Marc quiere presentarte a alguien.`, 'bien'];
    },
    padreOrgullo: s => { if (s.hitos.contrato || s.invitacion) { cambiarRel(s, 'padre', 15, 'Cumpliste lo que le prometiste'); return ['👨', 'Tu padre presume de ti en el bar: cumpliste lo que le prometiste (+15).', 'bien']; } cambiarRel(s, 'padre', -5, 'Aún no has cumplido tu promesa'); return ['👨', 'Tu padre no dice nada… pero te mira.', 'mal']; },
    ikerAsiste: s => { if (valorRel(s, 'iker') < 60) return null; s.ayudaCompanero = 1; return ['⚽', 'Iker se acuerda de que le ayudaste: esta semana te busca en cada jugada (más opciones de jugar y mejor nota).', 'bien']; },
    soniaDecide: s => { if (valorRel(s, 'sonia') >= 40) return ['🤝', 'Sonia se lo ha pensado: sigue contigo, sin comisión extra.']; s.agente = false; return ['🤝', 'Sonia te deja: «Búscate otro representante». Te quedas sin agente.', 'mal']; },
    padresDevuelven: s => { s.p.energia = clamp(s.p.energia + 15, 0, P2.CFG.energia.max); cambiarRel(s, 'madre', 3, 'Te devolvieron el favor'); return ['👩', 'Tus padres te devuelven el favor de la caldera: comida para toda la semana (+15 de energía).', 'bien']; },
  });
  for (const E of EVENTOS_RELACION) P2.SUCESOS.push(E);

  Object.assign(P2, { RELACIONES, EVENTOS_RELACION, persona, valorRel, estadoRel, cambiarRel, personasVisibles, nombreRel, relVisible: visible });
})(globalThis.P2 = globalThis.P2 || {});
