'use strict';
// La Biblioteca de los Ecos — lógica del juego.

const app = document.getElementById('app');
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const G = {
  save: loadSave(),
  screen: 'title',
  floor: 0,
  node: null,
  battle: null,
  reward: null,
  speed: 1,
};
const sleep = ms => new Promise(r => setTimeout(r, ms / G.speed));

function freshSave() {
  return { cleared: [], decks: Object.fromEntries(LIBRARIANS.map(l => [l.id, [...l.deck]])) };
}
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && Array.isArray(s.cleared) && s.decks) return s;
  } catch (e) { /* sin almacenamiento disponible */ }
  return freshSave();
}
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) { /* ignorar */ }
}

// ---------- Progreso del mapa ----------
const isCleared = id => G.save.cleared.includes(id);
function floorUnlocked(i) {
  if (i === 0) return true;
  const prev = FLOORS[i - 1];
  return isCleared(prev.nodes[prev.nodes.length - 1].id);
}
function nodeUnlocked(f, n) {
  if (!floorUnlocked(f)) return false;
  return n === 0 || isCleared(FLOORS[f].nodes[n - 1].id);
}

// ---------- Componentes de UI ----------
function cardHTML(id, extra = '') {
  const c = CARDS[id];
  return `<div class="card ${extra}" data-card="${id}">
    <div class="card-head"><span class="cost">${c.cost}</span><span class="card-name">${esc(c.name)}</span></div>
    <div class="card-dice">${c.dice.map(d => `<span class="cdie" style="--dc:${DIE_TYPES[d.t].color}">${dieIcon(d.t)}${d.min}-${d.max}</span>`).join('')}</div>
    ${c.effect ? `<div class="card-eff">${EFFECTS[c.effect]}</div>` : ''}
  </div>`;
}

function bar(cur, max, cls) {
  const p = Math.max(0, Math.min(100, (cur / max) * 100));
  return `<div class="bar ${cls}"><div style="width:${p}%"></div><span>${Math.max(0, Math.ceil(cur))}/${max}</span></div>`;
}

// ---------- Pantallas ----------
function render() {
  const fn = { title: renderTitle, map: renderMap, team: renderTeam, gallery: renderGallery, battle: renderBattle, reward: renderReward, ending: renderEnding }[G.screen];
  app.innerHTML = fn();
  if (G.screen === 'battle') requestAnimationFrame(drawLines);
}

function nav() {
  return `<nav class="topnav">
    <button data-act="go" data-to="map" class="${G.screen === 'map' ? 'on' : ''}">Mapa</button>
    <button data-act="go" data-to="team" class="${G.screen === 'team' ? 'on' : ''}">Bibliotecarios</button>
    <button data-act="go" data-to="gallery" class="${G.screen === 'gallery' ? 'on' : ''}">Galería</button>
    <button data-act="go" data-to="title">Inicio</button>
  </nav>`;
}

function renderTitle() {
  return `<div class="title-screen">
    ${floorBackground(FLOORS[3], 'title-bg')}
    <div class="title-box">
      <h1>La Biblioteca<br><small>de los</small> Ecos</h1>
      <p>Recibe a los invitados, choca tus dados contra los suyos y conviértelos en libros.</p>
      <div class="title-buttons">
        <button class="primary" data-act="go" data-to="map">${G.save.cleared.length ? 'Continuar' : 'Comenzar'}</button>
        <button data-act="go" data-to="gallery">Galería de diseños</button>
        ${G.save.cleared.length ? '<button data-act="reset">Borrar progreso</button>' : ''}
      </div>
      <details class="howto"><summary>Cómo se juega</summary>
        <ul>
          <li>Cada personaje tira <b>dados de velocidad</b> al inicio del turno. Los más rápidos actúan primero.</li>
          <li>Selecciona uno de tus dados, elige una <b>página</b> (carta) de la mano y luego el dado enemigo al que apuntas.</li>
          <li>Si apuntas a un dado enemigo que tiene página, se produce un <b>choque</b>: los dados se comparan uno por uno y gana el mayor.</li>
          <li><b>Corte / Perforante / Contundente</b> hacen daño. <b>Bloqueo</b> resta el daño y aturde al atacante si gana. <b>Evasión</b> recupera aturdimiento y se reutiliza si gana.</li>
          <li>Si la barra de <b>aturdimiento</b> llega a 0, el personaje pierde su siguiente turno y recibe el doble de daño.</li>
          <li>Ganar choques y golpear da <b>emoción</b>: más Luz, más poder y un dado extra.</li>
          <li>Las páginas cuestan <b>Luz</b>. Recuperas 1 de Luz y robas 2 páginas por turno.</li>
        </ul>
      </details>
    </div>
  </div>`;
}

function towerSVG() {
  const h = 92, W = 300;
  const total = FLOORS.length * h + 60;
  let g = `<path d="M20 60 L150 8 L280 60 Z" fill="#2a2238" stroke="#b89aff" stroke-width="1.5"/>`;
  FLOORS.forEach((f, i) => {
    const y = total - (i + 1) * h;
    const unlocked = floorUnlocked(i);
    const done = isCleared(f.nodes[f.nodes.length - 1].id);
    const sel = G.floor === i;
    g += `<g class="tower-floor ${unlocked ? '' : 'locked'} ${sel ? 'sel' : ''}" data-act="floor" data-i="${i}" tabindex="0" role="button" aria-label="${esc(f.name)}">
      <rect x="20" y="${y}" width="${W - 40}" height="${h - 4}" rx="4" fill="${f.colors[0]}" stroke="${sel ? f.accent : '#555'}" stroke-width="${sel ? 3 : 1}"/>
      ${Array.from({ length: 5 }, (_, k) => `<rect x="${34 + k * 48}" y="${y + 14}" width="30" height="${h - 32}" rx="15" fill="#000" opacity=".35"/>`).join('')}
      <text x="150" y="${y + h / 2 - 2}" text-anchor="middle" class="tf-name">${esc(f.name)}</text>
      <text x="150" y="${y + h / 2 + 16}" text-anchor="middle" class="tf-sub">${unlocked ? (done ? 'Despejado' : `Piso ${i + 1}`) : 'Bloqueado'}</text>
    </g>`;
  });
  return `<svg class="tower" viewBox="0 0 ${W} ${total + 4}" role="group" aria-label="Pisos de la biblioteca">${g}</svg>`;
}

function nodePathSVG(fi) {
  const f = FLOORS[fi];
  const W = 520, H = 170, n = f.nodes.length;
  const pts = f.nodes.map((_, i) => [60 + i * ((W - 120) / Math.max(1, n - 1)), 85 + (i % 2 ? -35 : 25)]);
  let s = '';
  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    s += `<path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" stroke="${isCleared(f.nodes[i].id) ? f.accent : '#555'}" stroke-width="3" stroke-dasharray="${isCleared(f.nodes[i].id) ? '0' : '6 6'}" fill="none"/>`;
  }
  f.nodes.forEach((node, i) => {
    const [x, y] = pts[i];
    const un = nodeUnlocked(fi, i), done = isCleared(node.id), sel = G.node === node.id;
    const r = node.boss ? 26 : 20;
    s += `<g class="map-node ${un ? '' : 'locked'} ${sel ? 'sel' : ''}" data-act="node" data-id="${node.id}" tabindex="0" role="button" aria-label="${esc(node.name)}">
      ${un && !done ? `<circle cx="${x}" cy="${y}" r="${r + 8}" fill="${f.accent}" opacity=".18" class="pulse"/>` : ''}
      <circle cx="${x}" cy="${y}" r="${r}" fill="${done ? f.accent : '#1a1620'}" stroke="${sel ? '#fff' : f.accent}" stroke-width="${sel ? 3 : 2}"/>
      ${node.boss ? `<path d="M${x - 11} ${y + 6} L${x - 13} ${y - 8} L${x - 5} ${y - 1} L${x} ${y - 11} L${x + 5} ${y - 1} L${x + 13} ${y - 8} L${x + 11} ${y + 6} Z" fill="${done ? '#1a1620' : f.accent}"/>`
        : `<path d="M${x - 8} ${y - 9} L${x + 8} ${y - 9} L${x + 8} ${y + 9} L${x - 8} ${y + 9} Z M${x} ${y - 9} L${x} ${y + 9}" fill="none" stroke="${done ? '#1a1620' : f.accent}" stroke-width="2"/>`}
      <text x="${x}" y="${y + r + 18}" text-anchor="middle" class="node-label">${esc(node.name)}</text>
    </g>`;
  });
  return `<svg class="node-map" viewBox="0 0 ${W} ${H + 20}" role="group" aria-label="Recepciones de ${esc(f.name)}">${s}</svg>`;
}

function renderMap() {
  const f = FLOORS[G.floor];
  const node = f.nodes.find(n => n.id === G.node);
  let detail = '<p class="muted">Elige una recepción en el mapa del piso.</p>';
  if (node) {
    const ni = f.nodes.indexOf(node);
    const un = nodeUnlocked(G.floor, ni);
    detail = `<h3>${esc(node.name)} ${node.boss ? '<span class="tag">Jefe</span>' : ''} ${isCleared(node.id) ? '<span class="tag ok">Despejado</span>' : ''}</h3>
      <div class="enemy-preview">${node.enemies.map(e => `<figure>${portrait(ENEMIES[e].look)}<figcaption>${esc(ENEMIES[e].name)}<br><small>${ENEMIES[e].hp} PV</small></figcaption></figure>`).join('')}</div>
      <button class="primary" data-act="start" ${un ? '' : 'disabled'}>${un ? 'Iniciar recepción' : 'Bloqueado'}</button>`;
  }
  return `${nav()}<div class="map-screen">
    <div class="map-left">${towerSVG()}</div>
    <div class="map-right">
      <div class="floor-banner">${floorBackground(f)}<div class="floor-banner-text"><h2>${esc(f.name)}</h2><p>${esc(f.desc)}</p></div></div>
      ${floorUnlocked(G.floor) ? nodePathSVG(G.floor) : '<p class="muted locked-msg">Despeja el piso anterior para abrir este.</p>'}
      <div class="node-detail">${detail}</div>
    </div>
  </div>`;
}

function renderTeam() {
  return `${nav()}<div class="team-screen">
    ${LIBRARIANS.map(l => {
      const deck = G.save.decks[l.id];
      const counts = {};
      deck.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
      return `<section class="lib-panel">
        <div class="lib-head">${portrait(l.look)}<div><h2>${esc(l.name)}</h2><p class="muted">${esc(l.title)}</p>
          <p>PV ${l.hp} · Aturdimiento ${l.stagger} · ${l.dice.n} dados (${l.dice.min}-${l.dice.max})</p><p class="bio">${esc(l.bio)}</p></div></div>
        <h3>Mazo (${deck.length} páginas, mínimo 6)</h3>
        <div class="deck-grid">${Object.entries(counts).map(([c, n]) => `<div class="deck-item">${cardHTML(c)}<div class="deck-ctl"><span>x${n}</span>
          <button data-act="remove-card" data-lib="${l.id}" data-card="${c}" ${deck.length <= 6 ? 'disabled' : ''} aria-label="Quitar ${esc(CARDS[c].name)}">Quitar</button></div></div>`).join('')}</div>
      </section>`;
    }).join('')}
  </div>`;
}

function renderGallery() {
  const chars = [...LIBRARIANS.map(l => ({ ...l, side: 'Bibliotecario' })), ...Object.values(ENEMIES).map(e => ({ ...e, title: e.boss ? 'Jefe' : 'Invitado', side: 'Invitado' }))];
  return `${nav()}<div class="gallery">
    <h2>Personajes</h2>
    <div class="gallery-grid">${chars.map(c => `<figure class="gallery-card">${portrait(c.look)}<figcaption><b>${esc(c.name)}</b><small>${esc(c.title)}</small><p>${esc(c.bio)}</p></figcaption></figure>`).join('')}</div>
    <h2>Pisos</h2>
    <div class="gallery-floors">${FLOORS.map(f => `<figure>${floorBackground(f)}<figcaption><b>${esc(f.name)}</b><p>${esc(f.desc)}</p></figcaption></figure>`).join('')}</div>
    <h2>Tipos de dado</h2>
    <div class="die-legend">${Object.entries(DIE_TYPES).map(([k, d]) => `<span>${dieIcon(k)} ${d.name}</span>`).join('')}</div>
  </div>`;
}

// ---------- Combate ----------
function makeUnit(def, side, idx, deck) {
  return {
    uid: side + idx, side, def, name: def.name,
    hp: def.hp, maxHp: def.hp, stagger: def.stagger, maxStagger: def.stagger,
    light: 3, maxLight: 3, drawPile: shuffle([...deck]), hand: [], discard: [], dice: [],
    stunned: false, recoverTurn: 0, alive: true, coins: 0, emotion: 0, power: 0, extraDie: 0, floats: [],
  };
}

function startBattle(nodeId) {
  const f = FLOORS[G.floor];
  const node = f.nodes.find(n => n.id === nodeId);
  const B = {
    node, floor: f, turn: 0, phase: 'plan', sel: null, log: [], view: null, result: null,
    players: LIBRARIANS.map((l, i) => makeUnit(l, 'p', i, G.save.decks[l.id])),
    enemies: node.enemies.map((e, i) => makeUnit(ENEMIES[e], 'e', i, ENEMIES[e].deck)),
  };
  B.all = [...B.players, ...B.enemies];
  B.all.forEach(u => drawCards(u, 4));
  G.battle = B;
  G.screen = 'battle';
  logMsg(`Comienza la recepción: ${node.name}.`);
  startTurn();
}

const B_ = () => G.battle;
const active = u => u.alive && !u.stunned;
const unitById = id => B_().all.find(u => u.uid === id);
function logMsg(m, cls = '') { const B = B_(); B.log.unshift({ m, cls }); B.log.length = Math.min(B.log.length, 40); }

function drawCards(u, n) {
  for (let i = 0; i < n; i++) {
    if (!u.drawPile.length) { u.drawPile = shuffle(u.discard); u.discard = []; }
    if (!u.drawPile.length || u.hand.length >= HAND_LIMIT) return;
    u.hand.push(u.drawPile.pop());
  }
}

function startTurn() {
  const B = B_();
  B.turn++;
  for (const u of B.all) {
    if (!u.alive) continue;
    if (u.stunned && B.turn >= u.recoverTurn) {
      u.stunned = false; u.stagger = u.maxStagger;
      logMsg(`${u.name} se recupera del aturdimiento.`);
    }
    if (B.turn > 1) { u.light = Math.min(u.maxLight, u.light + 1); drawCards(u, 2); }
    const n = u.def.dice.n + u.extraDie;
    u.dice = u.stunned ? [] : Array.from({ length: n }, () => ({ speed: rnd(u.def.dice.min, u.def.dice.max), card: null, target: null }));
  }
  enemyPlan();
  B.phase = 'plan';
  const first = B.players.find(u => active(u) && u.dice.length);
  B.sel = first ? { uid: first.uid, di: 0 } : null;
  B.view = null;
}

function enemyPlan() {
  const B = B_();
  const targets = B.players.filter(u => u.alive);
  for (const e of B.enemies) {
    if (!active(e)) continue;
    // Dados más rápidos eligen primero las páginas más caras.
    const order = e.dice.map((d, i) => i).sort((a, b) => e.dice[b].speed - e.dice[a].speed);
    for (const di of order) {
      const opts = e.hand.map((c, i) => i).filter(i => CARDS[e.hand[i]].cost <= e.light);
      if (!opts.length) break;
      opts.sort((a, b) => CARDS[e.hand[b]].cost - CARDS[e.hand[a]].cost);
      const hi = Math.random() < 0.6 ? opts[0] : pick(opts);
      const id = e.hand.splice(hi, 1)[0];
      e.light -= CARDS[id].cost;
      const tu = pick(targets);
      e.dice[di].card = id;
      e.dice[di].target = { uid: tu.uid, di: tu.dice.length ? rnd(0, tu.dice.length - 1) : -1 };
    }
  }
}

function defaultTarget(u, di) {
  const B = B_();
  for (const e of B.enemies) {
    const k = e.dice.findIndex(d => d.card && d.target && d.target.uid === u.uid && d.target.di === di);
    if (active(e) && k >= 0) return { uid: e.uid, di: k };
  }
  const withDice = B.enemies.find(e => active(e) && e.dice.length);
  if (withDice) return { uid: withDice.uid, di: 0 };
  const any = B.enemies.find(e => e.alive);
  return { uid: any.uid, di: -1 };
}

function assignCard(handIdx) {
  const B = B_();
  if (!B.sel) return;
  const u = unitById(B.sel.uid), die = u.dice[B.sel.di];
  if (die.card) unassign(u, B.sel.di);
  const id = u.hand[handIdx];
  if (CARDS[id].cost > u.light) { flash(`${u.name} no tiene suficiente Luz.`); return; }
  u.light -= CARDS[id].cost;
  u.hand.splice(handIdx, 1);
  die.card = id;
  die.target = defaultTarget(u, B.sel.di);
  // Avanzar al siguiente dado libre para agilizar la planificación.
  const next = nextFreeDie();
  if (next) B.sel = next;
}

function nextFreeDie() {
  for (const u of B_().players) {
    if (!active(u)) continue;
    const di = u.dice.findIndex(d => !d.card);
    if (di >= 0) return { uid: u.uid, di };
  }
  return null;
}

function unassign(u, di) {
  const die = u.dice[di];
  if (!die.card) return;
  u.light += CARDS[die.card].cost;
  u.hand.push(die.card);
  die.card = null; die.target = null;
}

let flashTimer;
function flash(msg) {
  const el = document.getElementById('flash');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

function addFloat(u, text, cls) {
  u.floats.push({ text, cls, t: performance.now(), k: Math.random() });
}

function rollDie(d, u, bonus) { return Math.max(0, rnd(d.min, d.max) + u.power + bonus); }

function gainCoin(u, n = 1) {
  if (!u.alive || u.emotion >= EMOTION_THRESHOLDS.length) return;
  u.coins += n;
  while (u.emotion < EMOTION_THRESHOLDS.length && u.coins >= EMOTION_THRESHOLDS[u.emotion]) {
    u.emotion++;
    if (u.emotion === 1) { u.maxLight++; u.light = u.maxLight; logMsg(`${u.name} alcanza emoción 1: +1 Luz máxima.`, 'emo-log'); }
    if (u.emotion === 2) { u.power++; logMsg(`${u.name} alcanza emoción 2: +1 a todos sus dados.`, 'emo-log'); }
    if (u.emotion === 3) { u.extraDie++; logMsg(`${u.name} alcanza emoción 3: +1 dado de velocidad.`, 'emo-log'); }
    addFloat(u, '¡Emoción!', 'emo');
  }
}

function applyHit(att, tgt, amount, die, card) {
  if (amount <= 0 || !tgt.alive) return;
  const mult = tgt.stunned ? 2 : 1;
  const dmg = amount * mult;
  tgt.hp -= dmg;
  addFloat(tgt, `-${dmg}`, 'dmg');
  let stg = Math.round(amount * (die.t === 'blunt' ? 1.5 : 1)) + (card.effect === 'stagger3' ? 3 : 0);
  if (!tgt.stunned) staggerDamage(tgt, stg, true);
  if (card.effect === 'heal3' && att.alive) { att.hp = Math.min(att.maxHp, att.hp + 3); addFloat(att, '+3', 'heal'); }
  logMsg(`${att.name} golpea a ${tgt.name}: ${dmg} de daño${mult > 1 ? ' (¡aturdido, x2!)' : ''}.`, att.side === 'p' ? 'good' : 'bad');
  gainCoin(att); gainCoin(tgt);
  if (tgt.hp <= 0) {
    tgt.hp = 0; tgt.alive = false; tgt.dice = [];
    logMsg(`${tgt.name} ${tgt.side === 'e' ? 'se ha convertido en un libro' : 'ha caído'}.`, tgt.side === 'e' ? 'good' : 'bad');
  }
}

function staggerDamage(u, n, silent) {
  if (n <= 0 || u.stunned || !u.alive) return;
  u.stagger -= n;
  if (!silent) { addFloat(u, `-${n} atd.`, 'stg'); logMsg(`${u.name} recibe ${n} de aturdimiento.`); }
  if (u.stagger <= 0) {
    u.stagger = 0; u.stunned = true; u.recoverTurn = B_().turn + 2;
    addFloat(u, '¡Aturdido!', 'stun');
    logMsg(`¡${u.name} queda aturdido!`, 'stun');
  }
}

function useCard(u, card) {
  if (card.effect === 'draw') drawCards(u, 1);
  if (card.effect === 'light') u.light = Math.min(u.maxLight, u.light + 1);
}

function setView(left, right, text) {
  B_().view = { left, right, text };
  render();
}

function viewSide(u, card, queue, cur) {
  return { name: u.name, side: u.side, card: card.name, dice: queue.map(d => ({ t: d.t, min: d.min, max: d.max })), cur };
}

async function clash(A, Bn) {
  const [P, E] = A.u.side === 'p' ? [A, Bn] : [Bn, A];
  const cp = CARDS[P.d.card], ce = CARDS[E.d.card];
  useCard(P.u, cp); useCard(E.u, ce);
  const qp = cp.dice.map(d => ({ ...d })), qe = ce.dice.map(d => ({ ...d }));
  const bp = cp.effect === 'power1' ? 1 : 0, be = ce.effect === 'power1' ? 1 : 0;
  logMsg(`Choque: ${P.u.name} (${cp.name}) contra ${E.u.name} (${ce.name}).`);
  setView(viewSide(P.u, cp, qp), viewSide(E.u, ce, qe), '¡Choque!');
  await sleep(650);
  while (qp.length && qe.length && active(P.u) && active(E.u)) {
    const dp = qp.shift(), de = qe.shift();
    const vp = rollDie(dp, P.u, bp), ve = rollDie(de, E.u, be);
    const res = compareDice(P.u, dp, vp, cp, E.u, de, ve, ce);
    if (res.reuse === 'p') qp.unshift(dp);
    if (res.reuse === 'e') qe.unshift(de);
    setView(viewSide(P.u, cp, qp, { t: dp.t, v: vp, win: vp > ve }), viewSide(E.u, ce, qe, { t: de.t, v: ve, win: ve > vp }), res.text);
    await sleep(900);
  }
  // Dados restantes golpean sin oposición.
  if (qp.length && active(P.u) && E.u.alive) await oneSidedDice(P.u, cp, qp, E.u, bp);
  if (qe.length && active(E.u) && P.u.alive) await oneSidedDice(E.u, ce, qe, P.u, be);
}

function compareDice(ua, da, va, ca, ub, db, vb, cb) {
  if (va === vb) return { text: `Empate (${va})` };
  const aWins = va > vb;
  const [wu, wd, wv, wc, lu, ld, lv] = aWins ? [ua, da, va, ca, ub, db, vb] : [ub, db, vb, cb, ua, da, va];
  const wOff = DIE_TYPES[wd.t].off, lOff = DIE_TYPES[ld.t].off;
  gainCoin(wu);
  let reuse = null;
  if (wOff) {
    applyHit(wu, lu, ld.t === 'block' ? wv - lv : wv, wd, wc);
  } else if (wd.t === 'block') {
    staggerDamage(lu, wv - lv);
  } else {
    // Evasión ganadora: recupera aturdimiento y se reutiliza si esquivó un ataque.
    if (!wu.stunned) { wu.stagger = Math.min(wu.maxStagger, wu.stagger + wv); addFloat(wu, `+${wv} atd.`, 'heal'); }
    if (lOff) reuse = wu === ua ? 'p' : 'e';
  }
  return { text: `${wu.name} gana (${wv} vs ${lv})`, reuse };
}

async function oneSidedDice(att, card, queue, tgt, bonus) {
  while (queue.length && active(att) && tgt.alive) {
    const d = queue.shift();
    if (!DIE_TYPES[d.t].off) continue;
    const v = rollDie(d, att, bonus);
    applyHit(att, tgt, v, d, card);
    const side = viewSide(att, card, queue, { t: d.t, v, win: true });
    if (att.side === 'p') setView(side, { name: tgt.name, side: tgt.side, card: 'Sin defensa', dice: [] }, `Ataque unilateral: ${v}`);
    else setView({ name: tgt.name, side: tgt.side, card: 'Sin defensa', dice: [] }, side, `Ataque unilateral: ${v}`);
    await sleep(750);
  }
}

function retarget(fromSide) {
  const pool = (fromSide === 'p' ? B_().enemies : B_().players).filter(u => u.alive);
  return pool.length ? pick(pool) : null;
}

async function resolveTurn() {
  const B = B_();
  B.phase = 'resolve';
  B.sel = null;
  const key = (u, di) => `${u.uid}:${di}`;
  const entries = [];
  for (const u of B.all) {
    if (!active(u)) continue;
    u.dice.forEach((d, di) => { if (d.card) entries.push({ u, di, d, k: key(u, di) }); });
  }
  entries.sort((a, b) => b.d.speed - a.d.speed || (a.u.side === 'p' ? -1 : 1));
  const byKey = new Map(entries.map(e => [e.k, e]));
  const pairs = new Map();
  // Clash: un dado del jugador que apunta a un dado enemigo con página.
  for (const p of entries) {
    if (p.u.side !== 'p' || !p.d.target || p.d.target.di < 0) continue;
    const ek = `${p.d.target.uid}:${p.d.target.di}`;
    const e = byKey.get(ek);
    if (e && !pairs.has(ek) && !pairs.has(p.k)) { pairs.set(ek, p); pairs.set(p.k, e); }
  }
  // Los dados enemigos que apuntan a un dado del jugador sin rival también chocan (el defensor intercepta).
  for (const e of entries) {
    if (e.u.side !== 'e' || pairs.has(e.k) || !e.d.target || e.d.target.di < 0) continue;
    const pk = `${e.d.target.uid}:${e.d.target.di}`;
    const p = byKey.get(pk);
    if (p && !pairs.has(pk) && p.d.target && p.d.target.uid === e.u.uid) { pairs.set(pk, e); pairs.set(e.k, p); }
  }
  const done = new Set();
  render();
  await sleep(300);
  for (const en of entries) {
    if (done.has(en.k)) continue;
    done.add(en.k);
    if (!active(en.u)) continue;
    if (battleOver()) break;
    const partner = pairs.get(en.k);
    if (partner && !done.has(partner.k) && active(partner.u)) {
      done.add(partner.k);
      await clash(en, partner);
    } else {
      let tgt = unitById(en.d.target.uid);
      if (!tgt || !tgt.alive) tgt = retarget(en.u.side);
      if (!tgt) continue;
      const card = CARDS[en.d.card];
      useCard(en.u, card);
      logMsg(`${en.u.name} usa ${card.name} contra ${tgt.name}.`);
      await oneSidedDice(en.u, card, card.dice.map(d => ({ ...d })), tgt, card.effect === 'power1' ? 1 : 0);
    }
  }
  // Las páginas usadas van al descarte.
  for (const u of B.all) {
    for (const d of u.dice) if (d.card) u.discard.push(d.card);
    u.dice = [];
  }
  B.view = null;
  if (battleOver()) return endBattle();
  startTurn();
  render();
}

function battleOver() {
  const B = B_();
  return B.enemies.every(u => !u.alive) || B.players.every(u => !u.alive);
}

function endBattle() {
  const B = B_();
  const win = B.enemies.every(u => !u.alive);
  B.result = win ? 'win' : 'lose';
  B.phase = 'end';
  render();
}

function claimVictory() {
  const B = B_();
  if (!isCleared(B.node.id)) G.save.cleared.push(B.node.id);
  persist();
  const pool = shuffle([...B.floor.rewards]);
  G.reward = { options: pool.slice(0, 3), chosen: null, last: B.node.id === FLOORS[FLOORS.length - 1].nodes.slice(-1)[0].id };
  G.screen = 'reward';
  G.battle = null;
  render();
}

function renderReward() {
  const R = G.reward;
  return `${nav()}<div class="reward-screen">
    <h2>Recepción completada</h2>
    <p>Los invitados se han convertido en libros. Elige una página para añadir a un mazo.</p>
    <div class="reward-cards">${R.options.map((c, i) => `<button class="reward-pick ${R.chosen === i ? 'sel' : ''}" data-act="reward-pick" data-i="${i}">${cardHTML(c)}</button>`).join('')}</div>
    ${R.chosen !== null ? `<p>¿Quién se la queda?</p><div class="reward-libs">${LIBRARIANS.map(l => `<button data-act="reward-give" data-lib="${l.id}">${portrait(l.look)}<span>${esc(l.name)} (${G.save.decks[l.id].length})</span></button>`).join('')}</div>` : ''}
    <button data-act="reward-skip">Omitir</button>
  </div>`;
}

function finishReward() {
  const last = G.reward.last;
  G.reward = null;
  if (last) { G.screen = 'ending'; render(); return; }
  // Seleccionar automáticamente la siguiente recepción disponible.
  for (let fi = 0; fi < FLOORS.length; fi++) {
    const n = FLOORS[fi].nodes.findIndex((node, ni) => nodeUnlocked(fi, ni) && !isCleared(node.id));
    if (n >= 0) { G.floor = fi; G.node = FLOORS[fi].nodes[n].id; break; }
  }
  G.screen = 'map';
  render();
}

function renderEnding() {
  return `<div class="title-screen">${floorBackground(FLOORS[3], 'title-bg')}
    <div class="title-box"><h1>Fin</h1>
      <p>La Bibliotecaria Hueca se ha convertido en el libro más grueso de la colección. Por primera vez en siglos, la Cúpula guarda silencio... del bueno.</p>
      <p class="muted">Gracias por jugar. Puedes volver a recibir a cualquier invitado desde el mapa.</p>
      <button class="primary" data-act="go" data-to="map">Volver al mapa</button></div></div>`;
}

function unitHTML(u) {
  const B = B_();
  const now = performance.now();
  u.floats = u.floats.filter(f => now - f.t < 1100 * Math.max(1, 1 / G.speed));
  const emo = `<span class="emo" title="Nivel de emoción">${'◆'.repeat(u.emotion)}${'◇'.repeat(EMOTION_THRESHOLDS.length - u.emotion)}</span>`;
  const lights = Array.from({ length: u.maxLight }, (_, i) => `<i class="${i < u.light ? 'on' : ''}"></i>`).join('');
  const dice = u.stunned ? '<span class="stunned-label">Aturdido</span>' :
    u.dice.map((d, di) => {
      const sel = B.sel && B.sel.uid === u.uid && B.sel.di === di;
      const c = d.card ? CARDS[d.card] : null;
      const tip = c ? `${c.name}: ${c.dice.map(x => `${DIE_TYPES[x.t].name} ${x.min}-${x.max}`).join(', ')}` : 'Sin página';
      return `<button class="sdie ${u.side} ${sel ? 'sel' : ''} ${c ? 'has' : ''}" data-act="die" data-uid="${u.uid}" data-di="${di}" title="${esc(tip)}" ${B.phase !== 'plan' ? 'disabled' : ''}>
        <b>${d.speed}</b><small>${c ? esc(c.name) : (u.side === 'p' ? 'Elegir' : '—')}</small></button>`;
    }).join('');
  return `<div class="unit ${u.side} ${u.alive ? '' : 'dead'} ${u.stunned ? 'stunned' : ''}" data-unit="${u.uid}">
    <div class="unit-art">${portrait(u.def.look)}${u.floats.map(f => `<span class="float ${f.cls}" style="--x:${(f.k * 40 - 20).toFixed(0)}px">${esc(f.text)}</span>`).join('')}</div>
    <div class="unit-info">
      <div class="unit-name">${esc(u.name)} ${emo}</div>
      ${bar(u.hp, u.maxHp, 'hp')}${bar(u.stagger, u.maxStagger, 'stg')}
      <div class="light" title="Luz ${u.light}/${u.maxLight}">${lights}</div>
    </div>
    <div class="dice-row">${u.alive ? dice : '<span class="stunned-label">Fuera de combate</span>'}</div>
  </div>`;
}

function clashViewHTML(v) {
  if (!v) return '';
  const side = s => s ? `<div class="cv-side ${s.side}">
    <div class="cv-name">${esc(s.name)}</div><div class="cv-card">${esc(s.card)}</div>
    <div class="cv-cur">${s.cur ? `<span class="cv-roll ${s.cur.win ? 'win' : 'lose'}">${dieIcon(s.cur.t)}<b>${s.cur.v}</b></span>` : ''}</div>
    <div class="cv-queue">${s.dice.map(d => `<span>${dieIcon(d.t)}${d.min}-${d.max}</span>`).join('')}</div></div>` : '<div class="cv-side"></div>';
  return `<div class="clash-view">${side(v.left)}<div class="cv-text">${esc(v.text)}</div>${side(v.right)}</div>`;
}

function renderBattle() {
  const B = B_();
  const selU = B.sel ? unitById(B.sel.uid) : B.players.find(u => u.alive);
  let bottom = '';
  if (B.phase === 'end') {
    bottom = B.result === 'win'
      ? `<div class="end-panel"><h2>¡Victoria!</h2><button class="primary" data-act="claim">Recoger libros</button></div>`
      : `<div class="end-panel"><h2>Derrota</h2><p>Los bibliotecarios regresarán, como siempre.</p><button class="primary" data-act="retry">Reintentar</button><button data-act="go" data-to="map">Volver al mapa</button></div>`;
  } else if (selU) {
    const canPlan = B.phase === 'plan';
    bottom = `<div class="hand-bar">
      <div class="hand-head"><b>${esc(selU.name)}</b> · Mano (${selU.hand.length}) · Luz ${selU.light}/${selU.maxLight}
        ${B.sel ? ` · Dado de velocidad ${unitById(B.sel.uid).dice[B.sel.di]?.speed ?? ''}` : ''}</div>
      <div class="hand">${selU.hand.map((c, i) => `<button class="hand-card" data-act="play" data-i="${i}" ${!canPlan || !B.sel || CARDS[c].cost > selU.light ? 'disabled' : ''}>${cardHTML(c)}</button>`).join('') || '<p class="muted">Sin páginas en la mano.</p>'}</div>
      <div class="hand-actions">
        <button data-act="speed">Velocidad x${G.speed}</button>
        <button class="primary" data-act="fight" ${canPlan ? '' : 'disabled'}>¡Combatir!</button>
      </div>
    </div>`;
  }
  return `<div class="battle">
    <div class="stage" id="stage">
      ${floorBackground(B.floor, 'stage-bg')}
      <div class="stage-top"><span>${esc(B.floor.name)} — ${esc(B.node.name)}</span><span>Turno ${B.turn}</span><button data-act="flee">Retirarse</button></div>
      <div class="units-row enemies">${B.enemies.map(unitHTML).join('')}</div>
      <div class="center">${clashViewHTML(B.view) || (B.phase === 'plan' ? '<div class="hint">1) Toca uno de tus dados · 2) elige una página · 3) toca un dado enemigo para cambiar el objetivo</div>' : '')}</div>
      <div class="units-row players">${B.players.map(unitHTML).join('')}</div>
      <svg class="lines" id="lines"></svg>
      <div id="flash" class="flash" role="status"></div>
    </div>
    ${bottom}
    <div class="log">${B.log.map(l => `<div class="${l.cls}">${esc(l.m)}</div>`).join('')}</div>
  </div>`;
}

function drawLines() {
  const B = B_();
  const svg = document.getElementById('lines'), stage = document.getElementById('stage');
  if (!B || !svg || !stage || B.phase !== 'plan') return;
  const sr = stage.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
  const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - sr.left, r.top + r.height / 2 - sr.top]; };
  const anchor = t => {
    const el = t.di >= 0 ? stage.querySelector(`.sdie[data-uid="${t.uid}"][data-di="${t.di}"]`) : null;
    return el || stage.querySelector(`.unit[data-unit="${t.uid}"] .unit-art`);
  };
  let s = '<defs><marker id="ah-p" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#7fd0ff"/></marker><marker id="ah-e" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#ff6a6a"/></marker></defs>';
  for (const u of B.all) {
    if (!active(u)) continue;
    u.dice.forEach((d, di) => {
      if (!d.card || !d.target) return;
      const from = stage.querySelector(`.sdie[data-uid="${u.uid}"][data-di="${di}"]`);
      const to = anchor(d.target);
      if (!from || !to) return;
      const [x1, y1] = center(from), [x2, y2] = center(to);
      const mx = (x1 + x2) / 2 + (u.side === 'p' ? 30 : -30);
      s += `<path d="M${x1} ${y1} Q${mx} ${(y1 + y2) / 2} ${x2} ${y2}" class="tline ${u.side}" marker-end="url(#ah-${u.side})"/>`;
    });
  }
  svg.innerHTML = s;
}
window.addEventListener('resize', () => { if (G.screen === 'battle') drawLines(); });

// ---------- Eventos ----------
app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act;
  const B = G.battle;
  switch (act) {
    case 'go': G.screen = el.dataset.to; break;
    case 'reset':
      if (!confirm('¿Borrar todo el progreso?')) return;
      G.save = freshSave(); persist(); G.floor = 0; G.node = null; break;
    case 'floor': {
      const i = +el.dataset.i;
      if (!floorUnlocked(i)) return;
      G.floor = i; G.node = null; break;
    }
    case 'node': G.node = el.dataset.id; break;
    case 'start': startBattle(G.node); break;
    case 'remove-card': {
      const deck = G.save.decks[el.dataset.lib];
      if (deck.length <= 6) return;
      deck.splice(deck.indexOf(el.dataset.card), 1); persist(); break;
    }
    case 'die': {
      if (!B || B.phase !== 'plan') return;
      const u = unitById(el.dataset.uid), di = +el.dataset.di;
      if (u.side === 'p') {
        if (B.sel && B.sel.uid === u.uid && B.sel.di === di && u.dice[di].card) unassign(u, di);
        B.sel = { uid: u.uid, di };
      } else if (B.sel) {
        const pu = unitById(B.sel.uid), die = pu.dice[B.sel.di];
        if (!die.card) { flash('Primero elige una página para este dado.'); return; }
        die.target = { uid: u.uid, di };
      }
      break;
    }
    case 'play': assignCard(+el.dataset.i); break;
    case 'fight': resolveTurn(); return;
    case 'speed': G.speed = G.speed === 1 ? 2 : G.speed === 2 ? 4 : 1; break;
    case 'flee': if (!confirm('¿Retirarse de la recepción?')) return; G.battle = null; G.screen = 'map'; break;
    case 'retry': startBattle(B.node.id); break;
    case 'claim': claimVictory(); return;
    case 'reward-pick': G.reward.chosen = +el.dataset.i; break;
    case 'reward-give':
      G.save.decks[el.dataset.lib].push(G.reward.options[G.reward.chosen]); persist();
      finishReward(); return;
    case 'reward-skip': finishReward(); return;
  }
  render();
});
app.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
});

// Avanzar al primer piso/recepción pendiente al abrir el mapa.
(function initSelection() {
  for (let fi = FLOORS.length - 1; fi >= 0; fi--) if (floorUnlocked(fi)) { G.floor = fi; break; }
  const f = FLOORS[G.floor];
  const n = f.nodes.find((node, ni) => nodeUnlocked(G.floor, ni) && !isCleared(node.id));
  G.node = (n || f.nodes[0]).id;
})();
render();
