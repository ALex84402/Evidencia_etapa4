'use strict';
// Arte procedural en SVG: retratos, fondos de piso e íconos de dados.

let _uid = 0;
const uid = p => `${p}${++_uid}`;

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function gearPath(cx, cy, r1, r2, teeth) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 ? r1 : r2;
    pts.push([cx + Math.cos(a0) * r, cy + Math.sin(a0) * r], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r]);
  }
  return 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(' ')).join('L') + 'Z';
}

// ---------- Retratos ----------
function humanHead(L) {
  const hairBack = {
    long: `<path d="M31 40 Q30 20 50 20 Q70 20 69 40 L72 72 Q60 66 50 66 Q40 66 28 72 Z" fill="${L.hair}"/>`,
    bun:  `<circle cx="50" cy="20" r="9" fill="${L.hair}"/>`,
    short: '',
  }[L.style] || '';
  const hairFront = {
    long:  `<path d="M32 44 Q30 22 50 22 Q70 22 68 44 Q64 32 54 30 Q46 36 32 44 Z" fill="${L.hair}"/>`,
    bun:   `<path d="M32 42 Q31 24 50 24 Q69 24 68 42 Q60 31 50 31 Q40 31 32 42 Z" fill="${L.hair}"/>`,
    short: `<path d="M32 42 Q29 22 50 22 Q71 22 68 42 L66 36 L60 33 L54 36 L48 32 L42 36 L36 34 Z" fill="${L.hair}"/>`,
  }[L.style] || '';
  const acc = {
    glasses: `<g fill="none" stroke="#1a1a1a" stroke-width="1.6"><circle cx="43" cy="47" r="5"/><circle cx="57" cy="47" r="5"/><path d="M48 47 L52 47"/></g>`,
    monocle: `<circle cx="57" cy="47" r="5.5" fill="none" stroke="${L.accent}" stroke-width="1.8"/><path d="M62 49 Q66 60 62 70" fill="none" stroke="${L.accent}" stroke-width="1"/>`,
    tricorn: `<path d="M24 30 Q50 6 76 30 Q62 24 50 26 Q38 24 24 30 Z" fill="#1a1a24"/><path d="M30 28 Q50 20 70 28" stroke="${L.accent}" stroke-width="1.5" fill="none"/>`,
  }[L.acc] || '';
  return `${hairBack}
    <rect x="45" y="58" width="10" height="10" fill="${L.skin}"/>
    <ellipse cx="50" cy="45" rx="17" ry="19" fill="${L.skin}"/>
    ${hairFront}
    <ellipse cx="43" cy="47" rx="2.6" ry="3.2" fill="${L.eyes}"/>
    <ellipse cx="57" cy="47" rx="2.6" ry="3.2" fill="${L.eyes}"/>
    <circle cx="43.8" cy="46" r=".9" fill="#fff"/><circle cx="57.8" cy="46" r=".9" fill="#fff"/>
    <path d="M46 56 Q50 58 54 56" stroke="#5a2a2a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    ${acc}`;
}

function monsterHead(L) {
  switch (L.kind) {
    case 'gear':
      return `<path d="${gearPath(50, 42, 17, 22, 10)}" fill="${L.accent}" stroke="#2a1a0a" stroke-width="1.5"/>
        <circle cx="50" cy="42" r="9" fill="#2a1a0a"/><circle cx="50" cy="42" r="4" fill="${L.eyes}"/>`;
    case 'clock':
      return `<circle cx="50" cy="42" r="20" fill="#f0e6c8" stroke="${L.accent}" stroke-width="3"/>
        ${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<line x1="${50 + Math.cos(a) * 15}" y1="${42 + Math.sin(a) * 15}" x2="${50 + Math.cos(a) * 18}" y2="${42 + Math.sin(a) * 18}" stroke="#3a2a1a" stroke-width="1.4"/>`; }).join('')}
        <path d="M50 42 L50 28 M50 42 L60 46" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/>
        <path d="M50 62 L50 84" stroke="${L.accent}" stroke-width="2"/><circle cx="50" cy="86" r="5" fill="${L.accent}"/>`;
    case 'hood':
      return `<path d="M26 66 Q24 22 50 18 Q76 22 74 66 Z" fill="${L.coat}" stroke="#0a1a1e" stroke-width="1.5"/>
        <ellipse cx="50" cy="46" rx="14" ry="16" fill="#060c0e"/>
        <ellipse cx="44" cy="46" rx="2" ry="1.2" fill="${L.eyes}"/><ellipse cx="56" cy="46" rx="2" ry="1.2" fill="${L.eyes}"/>`;
    case 'lamp':
      return `${L.crown ? Array.from({ length: 5 }, (_, i) => { const x = 22 + i * 14; return `<path d="M${x} 30 L${x} 14" stroke="${L.accent}" stroke-width="2"/><path d="M${x} 13 q-3 -6 0 -10 q3 4 0 10" fill="#ffe08a"/>`; }).join('') : ''}
        <rect x="34" y="26" width="32" height="34" rx="4" fill="#2a1a10" stroke="${L.accent}" stroke-width="2"/>
        <rect x="38" y="30" width="24" height="26" rx="2" fill="${L.accent}" opacity=".85"/>
        <path d="M50 52 q-7 -8 0 -18 q7 10 0 18" fill="#fff6c8"/>
        <path d="M30 26 L70 26 L64 18 L36 18 Z" fill="#2a1a10"/>
        <circle cx="45" cy="44" r="1.6" fill="#2a1a10"/><circle cx="55" cy="44" r="1.6" fill="#2a1a10"/>`;
    case 'hollow':
      return `<path d="M32 30 L36 14 L42 26 L50 10 L58 26 L64 14 L68 30 Z" fill="${L.accent}" opacity=".9"/>
        <ellipse cx="50" cy="45" rx="17" ry="19" fill="#e8e0f0"/>
        <path d="M38 40 Q50 36 62 40 Q62 62 50 64 Q38 62 38 40 Z" fill="#06040a"/>
        <path d="M41 46 L47 47 M53 47 L59 46" stroke="${L.eyes}" stroke-width="2" stroke-linecap="round"/>
        <path d="M33 34 Q30 60 26 80 M67 34 Q70 60 74 80" stroke="#3a2a5a" stroke-width="3" fill="none"/>`;
    default:
      return humanHead({ skin: '#ccc', hair: '#444', style: 'short', eyes: '#000', accent: '#888' });
  }
}

function fullMonster(L) {
  switch (L.kind) {
    case 'eel':
      return `<path d="M14 88 Q30 50 50 70 Q72 92 80 50 Q86 28 66 22" fill="none" stroke="${L.coat}" stroke-width="16" stroke-linecap="round"/>
        <path d="M14 88 Q30 50 50 70 Q72 92 80 50 Q86 28 66 22" fill="none" stroke="${L.accent}" stroke-width="2" stroke-dasharray="3 6"/>
        <ellipse cx="62" cy="22" rx="12" ry="9" fill="${L.coat}"/>
        <circle cx="60" cy="19" r="3" fill="${L.eyes}"/><path d="M52 26 L56 24 L58 28 L61 25" stroke="#fff" stroke-width="1.2" fill="none"/>
        <path d="M74 14 l4 -6 l-1 5 l4 -2" stroke="${L.accent}" stroke-width="1.5" fill="none"/>`;
    case 'moth':
      return `<path d="M50 50 Q20 16 10 34 Q8 56 50 56 Z" fill="${L.coat}" stroke="${L.accent}" stroke-width="1.5"/>
        <path d="M50 50 Q80 16 90 34 Q92 56 50 56 Z" fill="${L.coat}" stroke="${L.accent}" stroke-width="1.5"/>
        <path d="M50 56 Q26 60 22 80 Q40 80 50 62 Z" fill="${L.coat}" opacity=".85"/>
        <path d="M50 56 Q74 60 78 80 Q60 80 50 62 Z" fill="${L.coat}" opacity=".85"/>
        <circle cx="28" cy="38" r="6" fill="${L.accent}"/><circle cx="72" cy="38" r="6" fill="${L.accent}"/>
        <ellipse cx="50" cy="60" rx="6" ry="20" fill="#2a1a10"/>
        <circle cx="50" cy="40" r="7" fill="#3a2a1a"/>
        <circle cx="47" cy="39" r="2" fill="${L.eyes}"/><circle cx="53" cy="39" r="2" fill="${L.eyes}"/>
        <path d="M47 34 Q42 22 36 20 M53 34 Q58 22 64 20" stroke="#3a2a1a" stroke-width="1.5" fill="none"/>
        <path d="M50 84 q-4 -8 0 -14 q4 6 0 14" fill="#ffb84a"/>`;
    case 'page':
      return `<g transform="rotate(-8 50 50)">
        <path d="M26 18 L66 18 L76 28 L76 84 L26 84 Z" fill="${L.coat}" stroke="${L.accent}" stroke-width="1.5"/>
        <path d="M66 18 L66 28 L76 28" fill="#cfc6a8" stroke="${L.accent}" stroke-width="1"/>
        ${[34, 40, 64, 70, 76].map(y => `<line x1="32" y1="${y}" x2="${y > 60 ? 70 : 60}" y2="${y}" stroke="#9a8a6a" stroke-width="1"/>`).join('')}
        <ellipse cx="51" cy="52" rx="13" ry="8" fill="#fff"/><circle cx="51" cy="52" r="5.5" fill="${L.eyes}"/><circle cx="52.5" cy="50.5" r="1.6" fill="#fff"/>
      </g>`;
  }
  return null;
}

function portrait(L, cls = '') {
  const gid = uid('pg');
  const full = L.kind ? fullMonster(L) : null;
  const body = full ? '' : `
    <path d="M16 100 Q18 70 50 66 Q82 70 84 100 Z" fill="${L.coat}"/>
    <path d="M40 67 L50 82 L60 67 Z" fill="${L.accent}"/>
    <path d="M50 82 L50 100" stroke="${L.accent}" stroke-width="1.5"/>`;
  const head = full || (L.kind ? monsterHead(L) : humanHead(L));
  return `<svg class="portrait ${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id="${gid}" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="${L.bg}" stop-opacity="1"/><stop offset="1" stop-color="#05050a"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#${gid})"/>
    ${body}${head}
  </svg>`;
}

// ---------- Fondos de piso ----------
function shelves(rng, w, h, y0, tint) {
  let s = '';
  const shelfH = 46;
  for (let y = y0; y < h - 20; y += shelfH) {
    s += `<rect x="0" y="${y + shelfH - 6}" width="${w}" height="6" fill="#000" opacity=".45"/>`;
    let x = 4;
    while (x < w) {
      const bw = 6 + rng() * 10, bh = shelfH - 12 - rng() * 14;
      const l = 18 + rng() * 22;
      s += `<rect x="${x.toFixed(1)}" y="${(y + shelfH - 6 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="hsl(${tint + rng() * 40 - 20},35%,${l.toFixed(0)}%)" opacity=".55"/>`;
      x += bw + 1 + (rng() < 0.08 ? 20 : 0);
    }
  }
  return s;
}

function floorBackground(floor, cls = '') {
  const W = 800, H = 400, rng = seeded(floor.id.length * 977 + floor.name.length);
  const gid = uid('fg');
  const tint = { clocks: 30, tide: 195, lamps: 20, dome: 260 }[floor.theme];
  let decor = '';
  if (floor.theme === 'clocks') {
    decor += `<circle cx="400" cy="120" r="90" fill="#f0e2bc" opacity=".12" stroke="${floor.accent}" stroke-width="4"/>`;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; decor += `<line x1="${400 + Math.cos(a) * 72}" y1="${120 + Math.sin(a) * 72}" x2="${400 + Math.cos(a) * 86}" y2="${120 + Math.sin(a) * 86}" stroke="${floor.accent}" stroke-width="3" opacity=".5"/>`; }
    decor += `<path d="M400 120 L400 52 M400 120 L448 140" stroke="${floor.accent}" stroke-width="5" opacity=".6" stroke-linecap="round"/>`;
    decor += `<path d="${gearPath(120, 330, 50, 62, 12)}" fill="${floor.accent}" opacity=".12"/><path d="${gearPath(690, 70, 36, 46, 9)}" fill="${floor.accent}" opacity=".12"/>`;
  } else if (floor.theme === 'tide') {
    for (let i = 0; i < 4; i++) {
      const y = 290 + i * 26;
      decor += `<path d="M0 ${y} ${Array.from({ length: 9 }, (_, k) => `Q${k * 100 + 50} ${y - 16 + (i % 2) * 8} ${k * 100 + 100} ${y}`).join(' ')} L800 400 L0 400 Z" fill="#0a3a4a" opacity="${0.25 + i * 0.12}"/>`;
    }
    for (let i = 0; i < 26; i++) decor += `<circle cx="${(rng() * W).toFixed(0)}" cy="${(rng() * 300).toFixed(0)}" r="${(2 + rng() * 7).toFixed(1)}" fill="none" stroke="#9ef0ff" opacity=".25"/>`;
  } else if (floor.theme === 'lamps') {
    const rg = uid('lg');
    decor += `<defs><radialGradient id="${rg}"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></radialGradient></defs>`;
    for (let i = 0; i < 6; i++) {
      const x = 70 + i * 132, y = 70 + (i % 2) * 50;
      decor += `<line x1="${x}" y1="0" x2="${x}" y2="${y - 14}" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${y}" r="70" fill="url(#${rg})"/><rect x="${x - 10}" y="${y - 14}" width="20" height="26" rx="3" fill="#ffb84a" opacity=".85"/>`;
    }
  } else if (floor.theme === 'dome') {
    decor += `<path d="M0 260 Q400 -120 800 260" fill="none" stroke="${floor.accent}" stroke-width="3" opacity=".3"/>`;
    for (let i = 0; i < 70; i++) decor += `<circle cx="${(rng() * W).toFixed(0)}" cy="${(rng() * 230).toFixed(0)}" r="${(0.6 + rng() * 1.8).toFixed(1)}" fill="#f0e8ff" opacity="${(0.3 + rng() * 0.7).toFixed(2)}"/>`;
    const letters = 'ABDEGLMORSÑ';
    for (let i = 0; i < 12; i++) decor += `<text x="${(rng() * W).toFixed(0)}" y="${(20 + rng() * 200).toFixed(0)}" fill="${floor.accent}" opacity=".35" font-size="${(10 + rng() * 14).toFixed(0)}" font-family="serif">${letters[Math.floor(rng() * letters.length)]}</text>`;
    decor += `<circle cx="640" cy="70" r="30" fill="#e8e0ff" opacity=".7"/><circle cx="652" cy="62" r="28" fill="${floor.colors[0]}"/>`;
  }
  return `<svg class="floor-bg ${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${floor.colors[0]}"/><stop offset="1" stop-color="${floor.colors[1]}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${gid})"/>
    <g opacity=".7">${shelves(rng, W, H, 150, tint)}</g>
    ${decor}
    <rect y="${H - 40}" width="${W}" height="40" fill="#000" opacity=".35"/>
  </svg>`;
}

// ---------- Íconos de dados ----------
const DIE_ICON_PATHS = {
  slash:  '<path d="M4 20 L18 4 L20 6 L6 22 Z" /><path d="M3 21 l3 -1 l-2 -2 z"/>',
  pierce: '<path d="M3 21 L17 7" stroke-width="2.6" stroke="currentColor"/><path d="M14 4 L21 3 L20 10 Z"/>',
  blunt:  '<rect x="4" y="4" width="11" height="8" rx="1"/><path d="M11 12 L19 21" stroke-width="3" stroke="currentColor"/>',
  block:  '<path d="M12 2 L21 5 Q21 16 12 22 Q3 16 3 5 Z"/>',
  evade:  '<path d="M3 8 Q12 4 20 8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M5 14 Q13 10 21 14" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M3 20 Q10 16 16 19" fill="none" stroke="currentColor" stroke-width="2.4"/>',
};
function dieIcon(t) {
  return `<svg class="die-icon" viewBox="0 0 24 24" style="color:${DIE_TYPES[t].color}" fill="currentColor" aria-label="${DIE_TYPES[t].name}">${DIE_ICON_PATHS[t]}</svg>`;
}
