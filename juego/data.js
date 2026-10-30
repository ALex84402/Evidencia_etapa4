'use strict';
// Datos del juego "La Biblioteca de los Ecos".
// Tipos de dado: slash (corte), pierce (perforante), blunt (contundente) = ofensivos
//                block (bloqueo), evade (evasión) = defensivos

const DIE_TYPES = {
  slash:  { name: 'Corte',       off: true,  color: '#e0524f' },
  pierce: { name: 'Perforante',  off: true,  color: '#e8933a' },
  blunt:  { name: 'Contundente', off: true,  color: '#d8c04a' },
  block:  { name: 'Bloqueo',     off: false, color: '#4f8fe0' },
  evade:  { name: 'Evasión',     off: false, color: '#4fc98a' },
};

const EFFECTS = {
  draw:     'Al usar: roba 1 página.',
  light:    'Al usar: recupera 1 de Luz.',
  stagger3: 'Al golpear: inflige 3 de aturdimiento extra.',
  heal3:    'Al golpear: recupera 3 de vida.',
  power1:   'Al usar: +1 a todos los dados de esta página.',
};

const CARDS = {
  // --- Páginas de los bibliotecarios ---
  corte:        { name: 'Corte Rápido',        cost: 0, dice: [{ t: 'slash', min: 3, max: 6 }] },
  doble:        { name: 'Doble Tajo',          cost: 1, dice: [{ t: 'slash', min: 3, max: 5 }, { t: 'slash', min: 3, max: 5 }] },
  estocada:     { name: 'Estocada',            cost: 1, dice: [{ t: 'pierce', min: 4, max: 8 }] },
  guardia:      { name: 'Guardia Firme',       cost: 0, dice: [{ t: 'block', min: 3, max: 7 }] },
  paso:         { name: 'Paso Lateral',        cost: 0, dice: [{ t: 'evade', min: 2, max: 6 }], effect: 'draw' },
  martillo:     { name: 'Golpe de Tomo',       cost: 2, dice: [{ t: 'blunt', min: 5, max: 9 }, { t: 'blunt', min: 2, max: 5 }] },
  contraataque: { name: 'Contraataque',        cost: 1, dice: [{ t: 'block', min: 3, max: 6 }, { t: 'slash', min: 4, max: 7 }] },
  lectura:      { name: 'Lectura Veloz',       cost: 0, dice: [{ t: 'pierce', min: 2, max: 4 }], effect: 'light' },
  baluarte:     { name: 'Baluarte',            cost: 1, dice: [{ t: 'block', min: 5, max: 9 }, { t: 'block', min: 3, max: 6 }] },
  eco:          { name: 'Eco Resonante',       cost: 2, dice: [{ t: 'blunt', min: 4, max: 8 }, { t: 'blunt', min: 4, max: 8 }], effect: 'stagger3' },
  vendaval:     { name: 'Danza del Vendaval',  cost: 2, dice: [{ t: 'evade', min: 4, max: 8 }, { t: 'slash', min: 5, max: 9 }, { t: 'slash', min: 3, max: 6 }] },
  segundero:    { name: 'Aguja del Segundero', cost: 1, dice: [{ t: 'pierce', min: 3, max: 6 }, { t: 'pierce', min: 3, max: 6 }], effect: 'draw' },
  marea:        { name: 'Marea Alta',          cost: 2, dice: [{ t: 'blunt', min: 6, max: 10 }, { t: 'evade', min: 3, max: 7 }] },
  votiva:       { name: 'Llama Votiva',        cost: 1, dice: [{ t: 'slash', min: 4, max: 7 }], effect: 'heal3' },
  concentracion:{ name: 'Concentración',       cost: 1, dice: [{ t: 'pierce', min: 4, max: 7 }, { t: 'block', min: 4, max: 7 }], effect: 'power1' },
  tormenta:     { name: 'Tormenta de Páginas', cost: 3, dice: [{ t: 'slash', min: 5, max: 9 }, { t: 'pierce', min: 5, max: 9 }, { t: 'blunt', min: 5, max: 9 }] },

  // --- Páginas de los invitados (enemigos) ---
  garra:        { name: 'Garra Oxidada',       cost: 0, dice: [{ t: 'slash', min: 2, max: 6 }] },
  engranaje:    { name: 'Engranaje Suelto',    cost: 1, dice: [{ t: 'blunt', min: 3, max: 7 }] },
  tictac:       { name: 'Tic-Tac',             cost: 0, dice: [{ t: 'evade', min: 2, max: 5 }] },
  pendulazo:    { name: 'Pendulazo',           cost: 1, dice: [{ t: 'blunt', min: 4, max: 7 }, { t: 'block', min: 2, max: 5 }] },
  hora_final:   { name: 'Hora Final',          cost: 2, dice: [{ t: 'pierce', min: 5, max: 9 }, { t: 'slash', min: 4, max: 7 }] },
  arpon:        { name: 'Arpón Herrumbroso',   cost: 1, dice: [{ t: 'pierce', min: 4, max: 8 }] },
  red:          { name: 'Red de Algas',        cost: 0, dice: [{ t: 'block', min: 3, max: 6 }] },
  mordida:      { name: 'Mordida Eléctrica',   cost: 1, dice: [{ t: 'slash', min: 3, max: 6 }, { t: 'pierce', min: 2, max: 5 }] },
  naufragio:    { name: 'Naufragio',           cost: 2, dice: [{ t: 'blunt', min: 6, max: 10 }, { t: 'blunt', min: 3, max: 6 }] },
  mecha:        { name: 'Mecha Encendida',     cost: 0, dice: [{ t: 'slash', min: 3, max: 6 }] },
  alas:         { name: 'Polvo de Alas',       cost: 1, dice: [{ t: 'evade', min: 4, max: 7 }, { t: 'pierce', min: 3, max: 6 }] },
  incendio:     { name: 'Incendio Lento',      cost: 2, dice: [{ t: 'slash', min: 5, max: 9 }, { t: 'slash', min: 5, max: 8 }], effect: 'stagger3' },
  silencio:     { name: 'Silencio',            cost: 0, dice: [{ t: 'block', min: 4, max: 8 }] },
  hoja:         { name: 'Hoja Afilada',        cost: 0, dice: [{ t: 'slash', min: 3, max: 7 }] },
  vacio:        { name: 'Lectura del Vacío',   cost: 2, dice: [{ t: 'pierce', min: 6, max: 10 }, { t: 'blunt', min: 5, max: 9 }, { t: 'evade', min: 4, max: 7 }] },
  olvido:       { name: 'Olvido',              cost: 3, dice: [{ t: 'blunt', min: 8, max: 14 }, { t: 'slash', min: 6, max: 10 }] },
};

// Aspecto de los retratos: ver art.js
const LIBRARIANS = [
  {
    id: 'iria', name: 'Iria', title: 'Archivista de la Espada',
    hp: 55, stagger: 26, dice: { n: 2, min: 2, max: 5 },
    deck: ['corte', 'corte', 'doble', 'doble', 'guardia', 'paso', 'paso', 'contraataque'],
    look: { skin: '#f1c9a5', hair: '#b8323a', style: 'long', coat: '#2b2f4a', accent: '#d9b45a', eyes: '#3a1e1e', bg: '#40263a' },
    bio: 'Clasifica los libros prohibidos con una hoja de papel templado. Nunca retrocede dos veces.',
  },
  {
    id: 'teo', name: 'Teo', title: 'Guardián del Atril',
    hp: 62, stagger: 34, dice: { n: 2, min: 1, max: 4 },
    deck: ['guardia', 'guardia', 'baluarte', 'baluarte', 'martillo', 'corte', 'corte', 'contraataque'],
    look: { skin: '#a8754f', hair: '#2a2420', style: 'short', coat: '#3c4a3a', accent: '#b98a4a', eyes: '#1c1c1c', bg: '#26382f', acc: 'glasses' },
    bio: 'Carga un atril de roble como escudo. Dice que todo libro merece ser defendido, incluso los malos.',
  },
  {
    id: 'nadia', name: 'Nadia', title: 'Lectora de la Lanza',
    hp: 48, stagger: 22, dice: { n: 2, min: 3, max: 6 },
    deck: ['estocada', 'estocada', 'estocada', 'lectura', 'lectura', 'paso', 'paso', 'doble'],
    look: { skin: '#f6dcc3', hair: '#e8e2d0', style: 'bun', coat: '#203a4f', accent: '#6fc3d9', eyes: '#2a6d8a', bg: '#1d3445' },
    bio: 'Lee tres libros a la vez y ataca antes de que termines de leer esta frase.',
  },
];

const ENEMIES = {
  engranero: {
    name: 'Engranero', hp: 34, stagger: 18, dice: { n: 1, min: 1, max: 4 },
    deck: ['garra', 'garra', 'garra', 'engranaje', 'engranaje', 'tictac'],
    look: { kind: 'gear', coat: '#5a4a3a', accent: '#c48a3a', bg: '#3a2e22', eyes: '#ffcf4a' },
    bio: 'Un aprendiz de relojero que se ajustó tantas piezas que olvidó cuál era su cara.',
  },
  pendulo: {
    name: 'Péndulo Errante', hp: 40, stagger: 22, dice: { n: 1, min: 2, max: 5 },
    deck: ['pendulazo', 'pendulazo', 'tictac', 'tictac', 'garra', 'engranaje'],
    look: { kind: 'clock', coat: '#3e3550', accent: '#d8c58a', bg: '#2a2438', eyes: '#d8c58a' },
    bio: 'Va de un lado a otro desde hace cien años. Si se detiene, el tiempo se detiene con él.',
  },
  relojero: {
    name: 'Maestra Relojera', hp: 80, stagger: 36, dice: { n: 2, min: 2, max: 5 }, boss: true,
    deck: ['hora_final', 'hora_final', 'pendulazo', 'pendulazo', 'engranaje', 'engranaje', 'tictac', 'garra'],
    look: { skin: '#e8c8b0', hair: '#7a7a82', style: 'bun', coat: '#4a3020', accent: '#e0a83a', eyes: '#c0402a', bg: '#3a2418', acc: 'monocle' },
    bio: 'Construyó un reloj que marca la hora exacta de tu muerte. Viene a comprobar si funciona.',
  },
  pescador: {
    name: 'Pescador Sin Rostro', hp: 50, stagger: 24, dice: { n: 1, min: 2, max: 5 },
    deck: ['arpon', 'arpon', 'red', 'red', 'garra', 'naufragio'],
    look: { kind: 'hood', coat: '#2a4a50', accent: '#8ab8a8', bg: '#183038', eyes: '#9ef0e0' },
    bio: 'Pesca en los charcos de tinta del segundo piso. Lo que saca no siempre tiene nombre.',
  },
  anguila: {
    name: 'Anguila de Tinta', hp: 42, stagger: 20, dice: { n: 2, min: 2, max: 5 },
    deck: ['mordida', 'mordida', 'mordida', 'tictac', 'garra', 'red'],
    look: { kind: 'eel', coat: '#1a2a40', accent: '#5ae0ff', bg: '#0e1e30', eyes: '#fff36a' },
    bio: 'Nació de una pluma que se cayó al mar. Escribe chispas al morder.',
  },
  capitana: {
    name: 'Capitana Ahogada', hp: 105, stagger: 44, dice: { n: 3, min: 2, max: 5 }, boss: true,
    deck: ['naufragio', 'naufragio', 'arpon', 'arpon', 'mordida', 'red', 'red', 'hora_final'],
    look: { skin: '#8fb8b0', hair: '#1e3a40', style: 'long', coat: '#1e2e48', accent: '#c8a050', eyes: '#e8fff8', bg: '#102838', acc: 'tricorn' },
    bio: 'Su barco se hundió dentro de un libro de aventuras. Busca uno nuevo con mejor final.',
  },
  farolera: {
    name: 'Farolera', hp: 58, stagger: 26, dice: { n: 2, min: 2, max: 5 },
    deck: ['mecha', 'mecha', 'mecha', 'silencio', 'incendio', 'alas'],
    look: { kind: 'lamp', coat: '#4a2a1a', accent: '#ffb84a', bg: '#2a1a12', eyes: '#fff0b0' },
    bio: 'Enciende las lámparas que nadie pidió. Le molesta muchísimo la oscuridad ajena.',
  },
  polilla: {
    name: 'Polilla Ardiente', hp: 46, stagger: 22, dice: { n: 2, min: 3, max: 6 },
    deck: ['alas', 'alas', 'alas', 'mecha', 'mecha', 'tictac'],
    look: { kind: 'moth', coat: '#5a3a2a', accent: '#ff7a3a', bg: '#24140e', eyes: '#ffea8a' },
    bio: 'Se enamoró de una lámpara y ahora es parte de ella.',
  },
  lampadario: {
    name: 'El Lampadario', hp: 125, stagger: 50, dice: { n: 3, min: 2, max: 6 }, boss: true,
    deck: ['incendio', 'incendio', 'alas', 'alas', 'silencio', 'silencio', 'mecha', 'vacio'],
    look: { kind: 'lamp', coat: '#2a1a3a', accent: '#ff5a2a', bg: '#1a0e1a', eyes: '#ffffff', crown: true },
    bio: 'Un candelabro de mil brazos que juró iluminar cada página, aunque ardan.',
  },
  pagina: {
    name: 'Página Suelta', hp: 30, stagger: 16, dice: { n: 1, min: 3, max: 6 },
    deck: ['hoja', 'hoja', 'hoja', 'silencio', 'tictac'],
    look: { kind: 'page', coat: '#e8e0c8', accent: '#9a8a6a', bg: '#1e1e2a', eyes: '#3a2a5a' },
    bio: 'Arrancada de un libro que ya nadie recuerda. Corta como solo el papel sabe.',
  },
  hueca: {
    name: 'La Bibliotecaria Hueca', hp: 190, stagger: 70, dice: { n: 3, min: 3, max: 6 }, boss: true,
    deck: ['vacio', 'vacio', 'olvido', 'olvido', 'silencio', 'silencio', 'hoja', 'hoja', 'incendio'],
    look: { kind: 'hollow', coat: '#16121e', accent: '#b89aff', bg: '#0a0812', eyes: '#d8c8ff', crown: true },
    bio: 'Fue la primera bibliotecaria. Leyó tanto que se quedó vacía, y ahora quiere llenarse con ustedes.',
  },
};

// Pisos de la biblioteca (el mapa). Cada piso tiene recepciones en orden.
const FLOORS = [
  {
    id: 'relojes', name: 'Vestíbulo de los Relojes', theme: 'clocks',
    colors: ['#3a2a1e', '#1a120c'], accent: '#e0a83a',
    desc: 'Mil relojes marcan horas distintas. Los invitados llegan siempre puntuales... a algo.',
    rewards: ['segundero', 'doble', 'estocada', 'guardia', 'contraataque', 'lectura'],
    nodes: [
      { id: 'r1', name: 'Sala de Engranajes', enemies: ['engranero', 'engranero'] },
      { id: 'r2', name: 'Pasillo del Péndulo', enemies: ['pendulo', 'engranero'] },
      { id: 'r3', name: 'Torre del Reloj', enemies: ['relojero', 'pendulo'], boss: true },
    ],
  },
  {
    id: 'marea', name: 'Galería de la Marea', theme: 'tide',
    colors: ['#123848', '#08141e'], accent: '#5ae0ff',
    desc: 'La tinta subió como el mar. Los estantes flotan y los libros respiran burbujas.',
    rewards: ['marea', 'baluarte', 'martillo', 'segundero', 'paso', 'concentracion'],
    nodes: [
      { id: 'm1', name: 'Muelle de Tinta', enemies: ['pescador', 'anguila'] },
      { id: 'm2', name: 'Arrecife de Lomos', enemies: ['anguila', 'anguila', 'pescador'] },
      { id: 'm3', name: 'Cubierta Hundida', enemies: ['capitana', 'pescador'], boss: true },
    ],
  },
  {
    id: 'lamparas', name: 'Sala de las Lámparas', theme: 'lamps',
    colors: ['#3a1e14', '#140a08'], accent: '#ffb84a',
    desc: 'Aquí nunca es de noche. Leer cansa los ojos; quedarse, el alma.',
    rewards: ['votiva', 'eco', 'vendaval', 'concentracion', 'marea'],
    nodes: [
      { id: 'l1', name: 'Pabellón de Mechas', enemies: ['farolera', 'polilla'] },
      { id: 'l2', name: 'Jardín de Brasas', enemies: ['polilla', 'polilla', 'farolera'] },
      { id: 'l3', name: 'Altar de Cera', enemies: ['lampadario', 'polilla'], boss: true },
    ],
  },
  {
    id: 'cupula', name: 'Cúpula del Silencio', theme: 'dome',
    colors: ['#1a1430', '#06040c'], accent: '#b89aff',
    desc: 'El último piso. Las estrellas son letras y el silencio pesa como un tomo.',
    rewards: ['tormenta', 'eco', 'vendaval', 'votiva'],
    nodes: [
      { id: 'c1', name: 'Antesala de las Páginas', enemies: ['pagina', 'pagina', 'pagina'] },
      { id: 'c2', name: 'Corazón de la Cúpula', enemies: ['hueca', 'pagina', 'pagina'], boss: true },
    ],
  },
];

const SAVE_KEY = 'biblioteca-ecos-save-v1';
const HAND_LIMIT = 8;
const EMOTION_THRESHOLDS = [3, 7, 12];
