// Titelbilder je Fall (Entscheidung 9.10.2026): gleicher Rahmen – Spielart, Titel, roter Aufhänger, Ort bei Nacht, rotes Licht, Stempel.
import { INK, PAPER, RED, o, defs } from "./gn.js";
const GOLD = "#F2C14E", GREEN = "#6CCB6A", SKY = "#141B2E", SKY2 = "#1E2A48", W = 800, H = 1000, LRED = "#E0574C", STEEL = "#8A8A90";
const burst = (x, y, r, c, n = 18, w = 3) => [...Array(n)].map((_, i) => { const a = (i / n) * Math.PI * 2; return `<path d="M${x + Math.cos(a) * r * 0.22},${y + Math.sin(a) * r * 0.22} L${x + Math.cos(a) * r},${y + Math.sin(a) * r}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><circle cx="${x + Math.cos(a) * r * 1.08}" cy="${y + Math.sin(a) * r * 1.08}" r="${w}" fill="${c}"/>`; }).join("");
const trail = (x1, y1, x2, y2, c) => `<path d="M${x1},${y1} Q${(x1 + x2) / 2 + 20},${(y1 + y2) / 2} ${x2},${y2}" stroke="${c}" stroke-width="2.5" fill="none" stroke-dasharray="4 7" stroke-linecap="round"/>`;
const moon = (x, y, r, bg) => `<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="${PAPER}" opacity=".06"/><circle cx="${x}" cy="${y}" r="${r}" fill="${PAPER}"/><circle cx="${x + r * 0.45}" cy="${y - r * 0.3}" r="${r * 0.92}" fill="${bg}"/>`;
const stars = (n, y1, y2, seed = 1) => { let s = seed, out = ""; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280); for (let i = 0; i < n; i++) out += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(y1 + rnd() * (y2 - y1)).toFixed(0)}" r="${(1 + rnd() * 1.6).toFixed(1)}" fill="${PAPER}" opacity="${(0.4 + rnd() * 0.5).toFixed(2)}"/>`; return out; };
const pine = (x, y, s, c = "#0B1A14", snow = false) => `<path d="M${x},${y - 120 * s} L${x + 34 * s},${y - 60 * s} L${x + 18 * s},${y - 60 * s} L${x + 46 * s},${y - 10 * s} L${x - 46 * s},${y - 10 * s} L${x - 18 * s},${y - 60 * s} L${x - 34 * s},${y - 60 * s} Z" fill="${c}"/><rect x="${x - 5 * s}" y="${y - 10 * s}" width="${10 * s}" height="${14 * s}" fill="#1A1210"/>${snow ? `<path d="M${x},${y - 120 * s} L${x + 14 * s},${y - 95 * s} L${x - 14 * s},${y - 95 * s} Z M${x - 30 * s},${y - 56 * s} L${x + 30 * s},${y - 56 * s} L${x + 22 * s},${y - 48 * s} L${x - 22 * s},${y - 48 * s} Z" fill="#DCE6F0"/>` : ""}`;
const mono = (x, y, t, s, c, w = 700, a = "middle", extra = "") => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="IBM Plex Mono, monospace" font-weight="${w}" font-size="${s}" fill="${c}" ${extra}>${t}</text>`;

function frame(en, k, D, scene) {
  const T = en ? k.en : k.de;
  const fs1 = Math.min(92, 1300 / Math.max(T.t1.length, T.t2.length));
  let g = scene;
  g += `<radialGradient id="v${D.id}" cx="50%" cy="55%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient><rect width="${W}" height="${H}" fill="url(#v${D.id})"/>`;
  const st = k.stamp || [165, 845, -11];
  g += `<g transform="translate(${st[0]},${st[1]}) rotate(${st[2]})" opacity=".92"><rect x="-128" y="-38" width="256" height="76" fill="${PAPER}" fill-opacity=".08" stroke="${RED}" stroke-width="6"/><rect x="-119" y="-29" width="238" height="58" fill="none" stroke="${RED}" stroke-width="2.2"/>${mono(0, 13, en ? "OPEN CASE" : "AKTE OFFEN", 34, RED, 700, "middle", `textLength="196" lengthAdjust="spacingAndGlyphs"`)}</g>`;
  g += `<rect x="0" y="0" width="${W}" height="8" fill="${RED}"/>`;
  g += mono(44, 64, T.kick, 20, GOLD, 500, "start", `letter-spacing="5"`);
  g += `<text x="40" y="${64 + fs1 * 0.95}" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="${fs1}" fill="${PAPER}" stroke="${INK}" stroke-width="8" paint-order="stroke">${T.t1}</text>`;
  g += `<text x="40" y="${64 + fs1 * 1.97}" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="${fs1}" fill="${PAPER}" stroke="${INK}" stroke-width="8" paint-order="stroke">${T.t2}</text>`;
  g += `<text x="44" y="${64 + fs1 * 1.97 + 48}" font-family="IBM Plex Sans, Arial, sans-serif" font-weight="600" font-size="26" fill="${LRED}" stroke="${INK}" stroke-width="5" paint-order="stroke">${T.hook}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.t1} ${T.t2}">${D.svg}${g}<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${INK}" stroke-width="8"/></svg>`;
}
const glowDown = (D, x1, x2, y, spread = 180) => `<path d="M${x1},${y} L${x2},${y} L${x2 + spread},${H} L${x1 - spread},${H} Z" fill="${RED}" opacity=".7" filter="${D.blur}"/><path d="M${x1 + 20},${y} L${x2 - 20},${y} L${x2 + spread / 3},${H} L${x1 - spread / 3},${H} Z" fill="#FF6A55" opacity=".3"/>`;

// ---------- Solo Plus: Kellertür beim Leseschlussfest ----------
function scSoloPlus(en, D) {
  let g = `<rect width="${W}" height="${H}" fill="${SKY}"/><rect width="${W}" height="560" fill="${SKY2}" opacity=".55"/><rect width="${W}" height="620" fill="${D.dots}" opacity=".10"/>`;
  g += moon(728, 318, 30, SKY2);
  g += trail(640, 520, 640, 200, GOLD) + burst(640, 190, 100, GOLD, 22, 3.5) + trail(470, 520, 500, 360, RED) + burst(500, 355, 58, LRED, 16, 3) + trail(300, 520, 250, 400, GREEN) + burst(250, 395, 40, GREEN, 14, 2.6) + burst(730, 60, 30, LRED, 12, 2) + burst(560, 70, 22, GOLD, 10, 2);
  g += `<path d="M0,430 Q120,350 260,385 T520,365 Q640,330 800,375 L800,560 L0,560 Z" fill="#0E1322"/><path d="M540,357 L548,295 L556,357 Z M538,357 h20 v28 h-20 Z" fill="#0E1322"/>`;
  for (let i = 0; i < 9; i++) g += `<path d="M${-20 + i * 30},${500 + i * 6} Q300,${450 - i * 2} 820,${480 + i * 6}" stroke="#2E5A3C" stroke-width="5" fill="none"/>`;
  g += `<g filter="${D.blur}" opacity=".35"><path d="M-20,470 Q200,440 420,468 T820,455 L820,500 Q600,520 400,498 T-20,505 Z" fill="#A9B6CC"/><path d="M-20,520 Q260,495 520,522 T820,512 L820,545 L-20,548 Z" fill="#8C9AB4"/></g><path d="M0,545 Q400,515 800,540 L800,580 L0,580 Z" fill="#0A0D16"/>`;
  g += wall(D, 560, 940);
  const dx = 225, dy = 590, dw = 350, dh = 350;
  g += cobbles(940);
  g += archDoor(D, dx, dy, dw, dh);
  g += `<rect x="${dx + dw - 70}" y="${dy + 190}" width="96" height="18" fill="#26262A" ${o(2.5)}/><path d="M${dx + dw + 2},${dy + 210} q0,-34 22,-34 q22,0 22,34" fill="none" stroke="${STEEL}" stroke-width="7"/><rect x="${dx + dw - 4}" y="${dy + 206}" width="56" height="48" rx="6" fill="#C9A23A" ${o(3)}/><circle cx="${dx + dw + 24}" cy="${dy + 226}" r="5" fill="${INK}"/><path d="M${dx + dw + 24},${dy + 228} v12" stroke="${INK}" stroke-width="4"/>`;
  g += glowDown(D, dx + 8, dx + dw - 8, dy + dh - 4) + `<rect x="${dx + 6}" y="${dy + dh - 8}" width="${dw - 12}" height="8" fill="#FF5A4A"/><path d="M${dx + 4},${dy + dh - 6} L${dx + dw - 4},${dy + dh - 6} L${dx + dw - 40},${dy + dh - 70} L${dx + 40},${dy + dh - 70} Z" fill="${RED}" opacity=".28" filter="${D.blur}"/>`;
  g += `<path d="M140,640 v22 q0,12 10,12" fill="none" stroke="${STEEL}" stroke-width="5" stroke-linecap="round"/><rect x="108" y="620" width="64" height="22" fill="${PAPER}" ${o(2)} transform="rotate(-4 140 631)"/>${mono(140, 636, en ? "CELLAR" : "KELLER", 12, INK, 700, "middle", `transform="rotate(-4 140 631)"`)}`;
  g += `<g transform="translate(640,975) rotate(-78) scale(1.6)"><path d="M-16,-40 Q0,-6 16,-40 Z" fill="#E8C76A" fill-opacity=".35" ${o(2.5, PAPER)}/><path d="M0,-22 L0,8 M-12,8 L12,8" stroke="${PAPER}" stroke-width="2.5"/></g><path d="M690,985 q40,6 80,-4" stroke="#7A1D2A" stroke-width="7" stroke-linecap="round" opacity=".8"/>`;
  return g;
}
function wall(D, y0, y1, c = "#3A3330", b = "#4A423D") {
  let g = `<rect x="0" y="${y0}" width="${W}" height="${y1 - y0}" fill="${c}"/><rect x="0" y="${y0}" width="${W}" height="${y1 - y0}" fill="${D.dots}" opacity=".22"/>`;
  for (let r = 0; y0 + 10 + r * 48 < y1; r++) for (let k = 0; k < 9; k++) g += `<rect x="${k * 100 + (r % 2) * 50 - 30}" y="${y0 + 10 + r * 48}" width="92" height="42" rx="6" fill="${b}" ${o(2, "#1C1817")}/>`;
  return g + `<path d="M0,${y0} L800,${y0} L800,${y1} L560,${y1} L330,${y0} Z" fill="${INK}" opacity=".42"/>`;
}
const cobbles = (y) => `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="#2A2422"/>${[...Array(14)].map((_, i) => `<ellipse cx="${i * 62 + 20}" cy="${y + 22 + (i % 2) * 18}" rx="26" ry="9" fill="#3A3330" ${o(1.5, "#1C1817")}/>`).join("")}`;
function archDoor(D, dx, dy, dw, dh) {
  let g = `<path d="M${dx - 26},${dy + dh} L${dx - 26},${dy + 120} Q${dx + dw / 2},${dy - 70} ${dx + dw + 26},${dy + 120} L${dx + dw + 26},${dy + dh} Z" fill="#6E655C" ${o(5)}/><path d="M${dx},${dy + dh} L${dx},${dy + 130} Q${dx + dw / 2},${dy - 30} ${dx + dw},${dy + 130} L${dx + dw},${dy + dh} Z" fill="#4A2E1E" ${o(4)}/>`;
  for (let i = 1; i < 6; i++) g += `<path d="M${dx + i * dw / 6},${dy + (i === 3 ? 18 : 40)} L${dx + i * dw / 6},${dy + dh}" stroke="#2B1A10" stroke-width="3"/>`;
  g += `<path d="M${dx},${dy + dh} L${dx},${dy + 130} Q${dx + dw / 2},${dy - 30} ${dx + dw},${dy + 130} L${dx + dw},${dy + dh} Z" fill="${D.hatch}" opacity=".18"/>`;
  for (const y of [dy + 100, dy + 240]) g += `<rect x="${dx - 4}" y="${y}" width="${dw + 8}" height="16" fill="#26262A" ${o(2.5)}/>${[0, 1, 2, 3, 4].map((k) => `<circle cx="${dx + 20 + k * dw / 5.4}" cy="${y + 8}" r="3.5" fill="${STEEL}"/>`).join("")}`;
  return g + `<path d="M${dx},${dy + dh} L${dx},${dy + 130}" stroke="${LRED}" stroke-width="4" opacity=".8"/>`;
}

// ---------- Solo 001: Nachtzug, Abteil 4 ----------
function scSolo001(en, D) {
  const NB = "#101830";
  let g = `<rect width="${W}" height="${H}" fill="${NB}"/><rect width="${W}" height="600" fill="${D.dots}" opacity=".10"/>${stars(60, 330, 520, 7)}`;
  g += moon(700, 380, 32, NB);
  // Alpen
  g += `<path d="M0,560 L90,440 L150,500 L250,380 L330,470 L420,400 L520,500 L610,410 L700,480 L800,420 L800,620 L0,620 Z" fill="#1B2440"/><path d="M250,380 L280,420 L262,415 L250,430 L238,412 L222,418 Z M610,410 L636,446 L620,440 L608,452 L598,436 L586,440 Z M90,440 L110,468 L96,462 L84,472 L76,460 Z" fill="#C9D3E2"/>`;
  g += `<path d="M0,600 L800,600 L800,640 L0,640 Z" fill="#0B1020"/>`;
  for (let i = 0; i < 12; i++) g += pine(30 + i * 72, 610, 0.5 + (i % 3) * 0.12, "#0A1410");
  // Wagen
  const y0 = 640, y1 = 900;
  g += `<rect x="-20" y="${y0}" width="840" height="${y1 - y0}" rx="18" fill="#1F3B5A" ${o(5)}/><rect x="-20" y="${y0 + 18}" width="840" height="10" fill="#C9A23A"/><rect x="-20" y="${y1 - 46}" width="840" height="10" fill="#C9A23A"/>`;
  g += `<rect x="-20" y="${y0}" width="840" height="${y1 - y0}" fill="${D.hatch}" opacity=".08"/>`;
  const wins = [[40, false], [200, false], [360, true], [520, false], [680, false]];
  for (const [x, red] of wins) {
    g += `<rect x="${x}" y="${y0 + 52}" width="120" height="110" rx="10" fill="${red ? "#5A1410" : "#E9C77A"}" ${o(4)}/>`;
    if (red) g += `<rect x="${x + 4}" y="${y0 + 56}" width="112" height="70" fill="#7A1D17"/>${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${x + 6},${y0 + 62 + k * 11} H${x + 114}" stroke="#4A0E0A" stroke-width="3"/>`).join("")}<rect x="${x + 4}" y="${y0 + 126}" width="112" height="32" fill="#FF5A4A" opacity=".85"/><path d="M${x + 4},${y0 + 162} L${x + 116},${y0 + 162} L${x + 150},${y1 + 60} L${x - 30},${y1 + 60} Z" fill="${RED}" opacity=".5" filter="${D.blur}"/>`;
    else g += `<path d="M${x + 10},${y0 + 60} L${x + 50},${y0 + 60} L${x + 20},${y0 + 150} L${x + 10},${y0 + 150} Z" fill="#FFF3C8" opacity=".5"/>`;
    g += mono(x + 60, y0 + 190, String(wins.indexOf(wins.find((w) => w[0] === x)) + 2), 22, PAPER);
  }
  g += `<rect x="300" y="${y0 + 205}" width="200" height="26" fill="${PAPER}" ${o(2)}/>${mono(400, y0 + 224, "WIEN – VENEZIA", 16, INK)}`;
  // Fahrwerk, Schienen, Fahrtlinien
  g += `<rect x="0" y="${y1}" width="${W}" height="${H - y1}" fill="#14110F"/>${[120, 260, 540, 680].map((x) => `<circle cx="${x}" cy="${y1 + 6}" r="26" fill="#1A1A1E" ${o(4)}/><circle cx="${x}" cy="${y1 + 6}" r="7" fill="${STEEL}"/>`).join("")}<rect x="0" y="${y1 + 30}" width="${W}" height="8" fill="${STEEL}"/>${[...Array(20)].map((_, i) => `<rect x="${i * 42}" y="${y1 + 40}" width="26" height="8" fill="#3A2A1E"/>`).join("")}`;
  for (let i = 0; i < 7; i++) g += `<path d="M${-40 + i * 10},${y0 + 30 + i * 34} h${120 + (i % 3) * 60}" stroke="${PAPER}" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
  return g;
}

// ---------- Solo 002: Theater, Vorhang ----------
function scSolo002(en, D) {
  let g = `<rect width="${W}" height="${H}" fill="#0A0A0D"/><rect width="${W}" height="${H}" fill="${D.dots}" opacity=".06"/>`;
  // Hinterbühne: dunkle Kulisse mit Sternenhimmel-Prospekt (Der Sturm)
  g += `<rect x="150" y="360" width="500" height="420" fill="#141B2E"/>${stars(26, 380, 600, 11).replace(/cx="(\d+)"/g, (m, x) => `cx="${150 + (+x % 500)}"`)}<path d="M150,700 Q260,640 380,690 T650,670 L650,780 L150,780 Z" fill="#1E2A44"/><path d="M150,730 q40,-14 80,0 t80,0 t80,0 t80,0 t80,0 t80,0" stroke="#3B4C70" stroke-width="3" fill="none"/>`;
  // Bühnenboden in Perspektive
  g += `<path d="M150,780 L650,780 L800,940 L0,940 Z" fill="#4A2E1C"/>${[...Array(9)].map((_, i) => { const t = i / 8; return `<path d="M${150 + t * 500},780 L${t * 800},940" stroke="#2A180E" stroke-width="2"/>`; }).join("")}<path d="M150,780 L650,780 L800,940 L0,940 Z" fill="${D.hatch}" opacity=".08"/>`;
  // Vorhänge
  const drape = (x, w, flip) => { let p = `<path d="M${x},330 L${x + w},330 ${flip ? `Q${x + w * 0.25},600 ${x + w * 0.55},840 L${x},840` : `L${x + w},840 Q${x + w * 0.45},600 ${x},330`} Z" fill="#8E1B16" ${o(4)}/>`; for (let i = 1; i < 6; i++) { const xx = x + (w * i) / 6; p += `<path d="M${xx},334 Q${xx + (flip ? -20 : 20)},600 ${xx + (flip ? -50 : 50) * (i / 6)},830" stroke="#5A0E0A" stroke-width="5" fill="none"/>`; } return p; };
  g += drape(0, 230, false) + drape(570, 230, true);
  g += `<path d="M0,350 Q100,400 200,360 T400,360 T600,360 T800,360 L800,322 L0,322 Z" fill="#7A1712" ${o(4)}/><rect x="0" y="314" width="${W}" height="16" fill="#C9A23A" ${o(2)}/>`;
  // Spotlight auf den Fundort
  g += `<path d="M420,330 L250,880 L590,880 Z" fill="#FFF3C8" opacity=".13"/><ellipse cx="420" cy="868" rx="190" ry="44" fill="#FFF3C8" opacity=".22"/>`;
  // Fundort: Pokal umgekippt, roter Saft, Prosperos Buch und Stab, Rosen
  g += `<path d="M330,872 q80,14 170,-2 q30,10 -16,20 q-80,8 -150,-4 z" fill="${RED}"/>`;
  g += `<g transform="translate(300,862) rotate(-80) scale(2.1)"><path d="M-18,-46 Q0,-6 18,-46 Z" fill="#C9A23A" ${o(2)}/><path d="M0,-24 L0,6 M-13,6 L13,6" stroke="#C9A23A" stroke-width="4"/></g>`;
  g += `<g transform="translate(520,846) rotate(-6)"><path d="M-60,0 L0,-12 L60,0 L60,22 L0,10 L-60,22 Z" fill="${PAPER}" ${o(3)}/><path d="M0,-12 V10" stroke="${INK}" stroke-width="2.5"/>${[0, 1, 2, 3].map((k) => `<path d="M${-50},${2 + k * 4} L-8,${-6 + k * 4} M8,${-6 + k * 4} L50,${2 + k * 4}" stroke="#8C8476" stroke-width="1.6"/>`).join("")}<path d="M-60,22 L0,10 L60,22 L60,28 L0,16 L-60,28 Z" fill="#5A3A24" ${o(2)}/></g>`;
  g += `<path d="M590,900 L740,830" stroke="#6E4A2A" stroke-width="10" stroke-linecap="round"/><circle cx="742" cy="828" r="10" fill="#C9A23A" ${o(2)}/>`;
  g += `<g transform="translate(220,900) rotate(-14)"><path d="M0,0 L90,-6" stroke="#2E5A3C" stroke-width="6"/>${[[90, -6], [80, -22], [100, -22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${RED}" ${o(2)}/><path d="M${x - 6},${y} q6,-8 12,0" stroke="#5A0E0A" stroke-width="2.5" fill="none"/>`).join("")}</g>`;
  // Rampe mit Rampenlichtern, rotes Licht von unten
  g += `<rect x="0" y="940" width="${W}" height="${H - 940}" fill="#1A1A1E"/>${[...Array(10)].map((_, i) => `<path d="M${40 + i * 80},944 l-16,-14 h32 z" fill="#FF6A55"/>`).join("")}<rect x="0" y="880" width="${W}" height="60" fill="${RED}" opacity=".25" filter="${D.blur}"/>`;
  return g;
}

// ---------- Friends: Hütte im Schnee, Saunatür ----------
function scFriends(en, D) {
  const NB = "#0F1A2C";
  let g = `<rect width="${W}" height="${H}" fill="${NB}"/><rect width="${W}" height="620" fill="${D.dots}" opacity=".10"/>${stars(70, 320, 560, 3)}`;
  // Hubschrauber mit Suchscheinwerfer
  g += `<path d="M640,372 L560,620 L700,620 Z" fill="#FFF3C8" opacity=".10"/><g transform="translate(640,360)"><ellipse cx="0" cy="0" rx="30" ry="14" fill="#1A1A1E" ${o(2.5, "#3A3A44")}/><path d="M28,-2 L74,-6 L78,-14 L84,-14 L82,2 L28,6 Z" fill="#1A1A1E"/><path d="M-50,-20 H50" stroke="${STEEL}" stroke-width="3"/><circle cx="-8" cy="12" r="3" fill="${LRED}"/></g>`;
  // Berge
  g += `<path d="M0,520 L120,400 L210,470 L330,360 L450,470 L560,420 L800,520 L800,640 L0,640 Z" fill="#1E2A44"/><path d="M330,360 L366,404 L344,398 L330,416 L316,398 L296,404 Z M120,400 L146,428 L128,424 L116,436 L104,424 Z" fill="#DCE6F0"/>`;
  // Schnee-Boden
  g += `<path d="M0,640 Q400,600 800,640 L800,${H} L0,${H} Z" fill="#C9D6E6"/><path d="M0,640 Q400,600 800,640 L800,${H} L0,${H} Z" fill="${D.dots}" opacity=".25"/>`;
  for (const [x, s] of [[60, 1.1], [150, 0.9], [720, 1.2], [650, 0.8], [770, 0.7]]) g += pine(x, 660, s, "#0B1A14", true);
  // Hütte
  const hx = 200, hy = 560;
  g += `<rect x="${hx}" y="${hy + 70}" width="300" height="200" fill="#5A3A24" ${o(4)}/>${[...Array(7)].map((_, i) => `<path d="M${hx},${hy + 96 + i * 26} H${hx + 300}" stroke="#3A2416" stroke-width="3"/>`).join("")}<path d="M${hx - 40},${hy + 76} L${hx + 150},${hy - 40} L${hx + 340},${hy + 76} Z" fill="#2A1C14" ${o(4)}/><path d="M${hx - 40},${hy + 76} L${hx + 150},${hy - 40} L${hx + 340},${hy + 76} L${hx + 300},${hy + 60} L${hx + 150},${hy - 18} L${hx},${hy + 60} Z" fill="#E8EEF5"/>`;
  g += [[hx + 40, hy + 120], [hx + 190, hy + 120]].map(([x, y]) => `<rect x="${x}" y="${y}" width="70" height="56" fill="#E9C77A" ${o(3)}/><path d="M${x + 35},${y} V${y + 56} M${x},${y + 28} H${x + 70}" stroke="${INK}" stroke-width="3"/>`).join("");
  g += `<rect x="${hx + 120}" y="${hy + 196}" width="50" height="74" fill="#3A2416" ${o(3)}/>`;
  // Sauna-Anbau mit roter Tür
  const sx = 540, sy = 700;
  g += `<rect x="${sx}" y="${sy}" width="160" height="130" fill="#6E4A2E" ${o(4)}/><path d="M${sx - 16},${sy + 4} L${sx + 80},${sy - 50} L${sx + 176},${sy + 4} Z" fill="#2A1C14" ${o(4)}/><path d="M${sx - 16},${sy + 4} L${sx + 80},${sy - 50} L${sx + 176},${sy + 4} L${sx + 150},${sy - 4} L${sx + 80},${sy - 34} L${sx + 10},${sy - 4} Z" fill="#E8EEF5"/>`;
  g += `<rect x="${sx + 56}" y="${sy + 40}" width="52" height="90" fill="#FF5A4A" ${o(3)}/><rect x="${sx + 64}" y="${sy + 50}" width="36" height="28" fill="#FFB0A0"/>${mono(sx + 82, sy + 30, "SAUNA", 14, PAPER)}`;
  g += `<path d="M${sx + 56},${sy + 130} L${sx + 108},${sy + 130} L${sx + 190},${H} L${sx - 30},${H} Z" fill="${RED}" opacity=".55" filter="${D.blur}"/>`;
  g += `${[0, 1, 2].map((i) => `<path d="M${sx + 120 + i * 14},${sy - 40} q-10,-20 0,-40 q10,-20 0,-40" stroke="#DCE6F0" stroke-width="4" fill="none" opacity=".45"/>`).join("")}`;
  // Fußspuren im Schnee zur Sauna
  for (let i = 0; i < 8; i++) { const x = 320 + i * 34, y = 960 - i * 15; g += `<ellipse cx="${x}" cy="${y + (i % 2) * 10}" rx="9" ry="5" fill="#8C9AB4" transform="rotate(-20 ${x} ${y})"/>`; }
  return g;
}

// ---------- Teams 001: Konferenzraum, rote Mappe ----------
function scT001(en, D) {
  const NB = "#0D1426";
  let g = `<rect width="${W}" height="${H}" fill="${NB}"/>`;
  // Fensterfront mit Skyline
  g += `<g transform="translate(0,34)"><rect x="0" y="300" width="${W}" height="380" fill="#16213C"/><rect x="0" y="300" width="${W}" height="380" fill="${D.dots}" opacity=".12"/>${moon(660, 370, 26, "#16213C")}`;
  const bld = [[0, 520, 90], [80, 460, 70], [150, 540, 60], [210, 430, 90], [300, 500, 70], [370, 400, 80], [450, 480, 90], [540, 440, 70], [610, 520, 80], [690, 470, 110]];
  for (const [x, y, w] of bld) { g += `<rect x="${x}" y="${y}" width="${w}" height="${680 - y}" fill="#0A1020"/>`; for (let r = y + 14; r < 670; r += 22) for (let c = x + 10; c < x + w - 10; c += 18) if ((r * 7 + c * 3) % 5 < 2) g += `<rect x="${c}" y="${r}" width="8" height="10" fill="#E9C77A" opacity=".7"/>`; }
  g += [0, 200, 400, 600, 800].map((x) => `<rect x="${x - 6}" y="300" width="12" height="380" fill="#22283A" ${o(2)}/>`).join("") + `</g>`;
  // Raum und Tisch in Perspektive
  g += `<rect x="0" y="700" width="${W}" height="${H - 700}" fill="#141012"/>`;
  g += [[250, 735], [550, 735]].map(([x, y]) => `<path d="M${x - 36},${y} q0,-60 36,-62 q36,2 36,62 Z" fill="#0E0E12" ${o(3, "#2A2A30")}/>`).join("");
  g += `<path d="M60,1000 L220,740 L580,740 L740,1000 Z" fill="#4A3426" ${o(5)}/><path d="M60,1000 L220,740 L580,740 L740,1000 Z" fill="${D.hatch}" opacity=".1"/><path d="M220,740 L580,740" stroke="#6E5240" stroke-width="3"/>`;
  // Hängelampe mit rotem Licht
  g += `<path d="M400,334 V600" stroke="#2A2A30" stroke-width="4"/><path d="M350,640 Q400,580 450,640 Z" fill="#2A2A30" ${o(3)}/><ellipse cx="400" cy="640" rx="50" ry="8" fill="#FF6A55"/>`;
  g += `<path d="M352,642 L448,642 L600,960 L200,960 Z" fill="${RED}" opacity=".35" filter="${D.blur}"/><ellipse cx="400" cy="880" rx="200" ry="60" fill="${RED}" opacity=".28" filter="${D.blur}"/>`;
  // Laptop links, aufgeklappt, Bildschirm rot
  g += `<g transform="translate(200,840) rotate(6)"><path d="M-60,0 L60,0 L70,14 L-70,14 Z" fill="#3A3A44" ${o(3)}/><path d="M-54,0 L-50,-80 L50,-80 L54,0 Z" fill="#1A1A1E" ${o(3)}/><path d="M-46,-6 L-43,-72 L43,-72 L46,-6 Z" fill="${RED}"/>${mono(0, -44, "⚠", 22, PAPER)}${mono(0, -20, en ? "ACCESS DENIED" : "GESPERRT", 9, PAPER)}</g>`;
  // rote Mappe in der Mitte
  g += `<g transform="translate(410,860) rotate(-6)"><rect x="-120" y="-72" width="240" height="144" fill="#A0201A" ${o(5)}/><rect x="-110" y="-62" width="240" height="144" fill="${RED}" ${o(4)}/><rect x="-110" y="-62" width="240" height="144" fill="${D.hatch}" opacity=".15"/><rect x="-50" y="-20" width="120" height="34" fill="${PAPER}" ${o(2.5)}/>${mono(10, 3, en ? "CONFIDENTIAL" : "VERTRAULICH", 14, INK)}<path d="M100,-62 L130,-62 L130,-30" fill="none" stroke="${INK}" stroke-width="3"/></g>`;
  // umgekippte Tasse mit Kaffee rechts
  g += `<path d="M560,920 q50,10 110,-2 q16,10 -14,18 q-60,8 -98,-4 z" fill="#3A2210"/><g transform="translate(570,905) rotate(-72)"><rect x="-22" y="-28" width="44" height="54" rx="7" fill="${PAPER}" ${o(3.5)}/><path d="M22,-12 q20,10 0,24" stroke="${INK}" stroke-width="4" fill="none"/><ellipse cx="0" cy="-28" rx="22" ry="6" fill="#3A2210" ${o(2.5)}/></g>`;
  // Name card „CEO“
  g += `<g transform="translate(560,790)"><path d="M-44,0 L44,0 L36,-30 L-36,-30 Z" fill="${PAPER}" ${o(2.5)}/>${mono(0, -9, en ? "CEO" : "CHEFIN", 13, INK)}</g>`;
  return g;
}

// ---------- Teams 002: Festzelt, Kühlanhänger ----------
function scT002(en, D) {
  const NB = "#101A2E";
  let g = `<rect width="${W}" height="${H}" fill="${NB}"/><rect width="${W}" height="620" fill="${D.dots}" opacity=".10"/>${stars(50, 320, 480, 5)}`;
  // Festzelt
  g += `<path d="M20,640 L20,500 L200,400 L380,500 L380,640 Z" fill="#E8E2D2" ${o(4)}/><path d="M20,500 L200,400 L380,500" fill="none" stroke="${INK}" stroke-width="4"/><path d="M110,640 L110,520 M200,640 L200,500 M290,640 L290,520" stroke="#B9B2A2" stroke-width="3"/><rect x="140" y="560" width="120" height="80" fill="#2A2018" ${o(3)}/>`;
  g += `<path d="M20,500 Q110,540 200,500 T380,500" stroke="#2A2A30" stroke-width="2" fill="none"/>${[...Array(9)].map((_, i) => `<circle cx="${30 + i * 42}" cy="${508 + Math.sin(i) * 10}" r="6" fill="${GOLD}"/>`).join("")}`;
  // Boden
  g += `<rect x="0" y="640" width="${W}" height="${H - 640}" fill="#1E2618"/><rect x="0" y="640" width="${W}" height="${H - 640}" fill="${D.dots}" opacity=".15"/>`;
  // Bierbänke
  g += [[60, 720], [220, 760]].map(([x, y]) => `<rect x="${x}" y="${y}" width="150" height="14" fill="#6E4A2E" ${o(2.5)}/><path d="M${x + 14},${y + 14} v30 M${x + 136},${y + 14} v30" stroke="${INK}" stroke-width="4"/>`).join("");
  // Leergut-Kisten
  const crate = (x, y, c) => `<rect x="${x}" y="${y}" width="70" height="44" fill="${c}" ${o(3)}/><path d="M${x + 8},${y + 10} h54" stroke="${INK}" stroke-width="3"/>`;
  g += crate(40, 900, "#2E5A3C") + crate(110, 900, "#B3261E") + crate(75, 856, "#2E5A3C") + crate(180, 900, "#C9A23A");
  // Kühlanhänger
  const tx = 400, ty = 500;
  g += `<rect x="${tx}" y="${ty}" width="360" height="330" fill="#E9EEF2" ${o(5)}/><rect x="${tx}" y="${ty}" width="360" height="330" fill="${D.dots}" opacity=".18"/><rect x="${tx}" y="${ty + 300}" width="360" height="30" fill="#B9C2CC" ${o(3)}/>`;
  g += `<circle cx="${tx + 300}" cy="${ty + 90}" r="40" fill="#5E86A6" ${o(3)}/>${mono(tx + 300, ty + 104, "❄", 40, PAPER)}${mono(tx + 300, ty + 160, en ? "COOLING" : "KÜHL", 18, "#2A4A66")}`;
  // Tür halb offen? Tür zu, roter Spalt
  g += `<rect x="${tx + 40}" y="${ty + 40}" width="180" height="260" fill="#D7DEE5" ${o(4)}/><path d="M${tx + 130},${ty + 40} V${ty + 300}" stroke="${INK}" stroke-width="3"/><rect x="${tx + 150}" y="${ty + 150}" width="40" height="12" fill="${STEEL}" ${o(2)}/><path d="M${tx + 127},${ty + 44} V${ty + 296}" stroke="#FF5A4A" stroke-width="5"/>`;
  g += `<path d="M${tx + 122},${ty + 300} L${tx + 134},${ty + 300} L${tx + 260},${H} L${tx},${H} Z" fill="${RED}" opacity=".55" filter="${D.blur}"/>`;
  g += `<circle cx="${tx + 80}" cy="${ty + 380}" r="34" fill="#1A1A1E" ${o(4)}/><circle cx="${tx + 280}" cy="${ty + 380}" r="34" fill="#1A1A1E" ${o(4)}/><circle cx="${tx + 80}" cy="${ty + 380}" r="10" fill="${STEEL}"/><circle cx="${tx + 280}" cy="${ty + 380}" r="10" fill="${STEEL}"/>`;
  // Reif/Eis an der Tür
  g += `<path d="M${tx + 40},${ty + 40} l10,14 l8,-10 l10,16 l10,-12 l8,10 l10,-14 l10,12 l12,-10" stroke="#BFD3E6" stroke-width="3" fill="none"/>`;
  return g;
}

export const COVERS = {
  soloplus: { sc: scSoloPlus, de: { kick: "SOLO PLUS · MIT KI", t1: "Der letzte", t2: "Jahrgang", hook: "Einer lügt." }, en: { kick: "SOLO PLUS · WITH AI", t1: "The Last", t2: "Vintage", hook: "One of them is lying." } },
  solo001: { sc: scSolo001, de: { kick: "SOLO · FALL 001", t1: "Nachtzug", t2: "nach Venedig", hook: "Bis Udine musst du es wissen." }, en: { kick: "SOLO · CASE 001", t1: "Night Train", t2: "to Venice", hook: "Solve it before Udine." }, stamp: [190, 935, -8] },
  solo002: { sc: scSolo002, de: { kick: "SOLO · FALL 002", t1: "Applaus für", t2: "einen Toten", hook: "Der Vorhang fällt. Er steht nicht mehr auf." }, en: { kick: "SOLO · CASE 002", t1: "Applause for", t2: "a Dead Man", hook: "The curtain falls. He doesn't get up." }, stamp: [600, 420, 9] },
  friends: { sc: scFriends, de: { kick: "FRIENDS · KRIMIABEND", t1: "Letzte Runde", t2: "auf der Hütte", hook: "Einer von euch war's." }, en: { kick: "FRIENDS · MYSTERY NIGHT", t1: "Last Round", t2: "at the Chalet", hook: "One of you did it." }, stamp: [160, 920, -9] },
  t001: { sc: scT001, de: { kick: "TEAMS · FÜR FIRMEN", t1: "Die rote", t2: "Mappe", hook: "Eure Chefin hat überlebt. Knapp." }, en: { kick: "TEAMS · FOR COMPANIES", t1: "The Red", t2: "Folder", hook: "Your boss survived. Barely." }, stamp: [190, 395, -8] },
  t002: { sc: scT002, de: { kick: "TEAMS · FÜR VEREINE", t1: "Eiskalt", t2: "kassiert", hook: "Die Festkassa ist weg." }, en: { kick: "TEAMS · FOR CLUBS", t1: "Cold", t2: "Cash", hook: "The cash box is gone." }, stamp: [200, 800, -10] },
};
export function cover(key, en) { const k = COVERS[key], D = defs(); return frame(en, k, D, k.sc(en, D)); }

