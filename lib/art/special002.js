// Bilder für das Weihnachts-Special „Vier Minuten Finsternis“ (special-002), Graphic-Novel-Stil wie alle Akten:
// Winternacht in Dunkelblau, warmes Licht (Lichterketten, Turmuhr, Kerzen). Alles als SVG aus denselben Daten wie die Akte.
import { o, esc, T, defs, pic, face, INK, RED, PAPER, CARD, TAN, MUTED, SKIN, SHADE } from "./gn.js";

export const NIGHT = "#141A33", NIGHT2 = "#1F2747", GOLD = "#F2C14E", WARM = "#F6E7B0", SNOW = "#EEF2F7", WOOD = "#7A4F2E", CARTON = "#B98B5E";
const HAND = `font-family="Caveat, Segoe Print, Bradley Hand, cursive" font-weight="600"`;
const pad2 = (n) => String(n).padStart(2, "0");

// ---------- Marktplan: 24 Hütten wie ein Adventkalender (6 × 4), Kirche oben ----------
export const COLS = 6, ROWS = 4, CELL = 80, GX = 60, GY = 170, TOWER_COL = 4;
export const GRID = [
  [7, 19, 3, 14, 22, 10],
  [1, 16, 9, 24, 5, 12],
  [18, 4, 21, 8, 15, 2],
  [11, 23, 6, 13, 20, 17],
];
export const cellOf = (n) => { for (let r = 0; r < ROWS; r++) { const c = GRID[r].indexOf(n); if (c >= 0) return [c, r]; } return null; };
export const hutAt = (c, r) => (r >= 0 && r < ROWS && c >= 0 && c < COLS ? GRID[r][c] : null);
const hut = (n, c, r, mark) => {
  const cx = GX + c * CELL + CELL / 2, cy = GY + r * CELL + CELL / 2;
  return `<g><path d="M${cx - 34},${cy - 14} L${cx},${cy - 34} L${cx + 34},${cy - 14} Z" fill="#8E3B2E" ${o(2)}/><path d="M${cx - 34},${cy - 14} L${cx},${cy - 34} L${cx + 34},${cy - 14}" fill="none" stroke="${SNOW}" stroke-width="3" opacity=".9"/>
<rect x="${cx - 30}" y="${cy - 14}" width="60" height="44" fill="#C69A6B" ${o(2)}/>${[...Array(5)].map((_, i) => `<path d="M${cx - 30},${cy - 6 + i * 8} L${cx + 30},${cy - 6 + i * 8}" stroke="#A57B52" stroke-width="1"/>`).join("")}
<circle cx="${cx}" cy="${cy + 6}" r="17" fill="${PAPER}" ${o(2.2)}/>${T(cx, cy + 12, String(n), 17, 800)}${mark || ""}</g>`;
};
// Marktplan (statisch oder als Unterlage der Schablone). extra: zusätzliche Höhe unten (Ablage für die Schablone)
export function planSvg(en, { extra = 0, marks = {}, label = true } = {}) {
  const W = 600, H = 620 + extra, D = defs(), L = (d, e) => (en ? e : d);
  const tx = GX + TOWER_COL * CELL + CELL / 2;
  const huts = GRID.map((row, r) => row.map((n, c) => hut(n, c, r, marks[n])).join("")).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L("Marktplan: 24 nummerierte Hütten in vier Reihen, oben die Kirche mit dem Turm, unten Christbaum und Bühne", "Market plan: 24 numbered huts in four rows, the church with its tower at the top, the Christmas tree and stage at the bottom"))}" style="width:100%;display:block;background:${PAPER}">${D.svg}
<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="${PAPER}" ${o(3)}/>
${label ? `${T(22, 36, L("CHRISTKINDLMARKT KERZENTHAL", "KERZENTHAL CHRISTMAS MARKET"), 15, 800, INK, "start")}${T(22, 54, L("Kirchplatz · Plan des Marktbüros", "Church square · market office plan"), 11, 500, MUTED, "start")}` : ""}
<rect x="${GX - 6}" y="${GY - 4}" width="${COLS * CELL + 12}" height="${ROWS * CELL + 8}" fill="#E5E1D8" opacity=".7"/>
<path d="M260,165 L260,96 L330,64 L400,96 L400,165 Z" fill="#D8CFBF" ${o(2.6)}/><rect x="300" y="122" width="40" height="43" rx="18" fill="#6B5A48" ${o(2)}/>
<rect x="${tx - 22}" y="58" width="44" height="107" fill="#CFC5B3" ${o(2.6)}/><path d="M${tx - 26},58 L${tx},18 L${tx + 26},58 Z" fill="#5E6E5A" ${o(2.4)}/><path d="M${tx},18 L${tx},6 M${tx - 5},11 L${tx + 5},11" ${o(2)}/>
<circle cx="${tx}" cy="88" r="13" fill="${WARM}" ${o(2)}/><path d="M${tx},88 L${tx},79 M${tx},88 L${tx + 6},90" ${o(1.6)}/>
<path d="M${tx - 9},165 L${tx},175 L${tx + 9},165" fill="${RED}" ${o(1.4)}/>
${T(tx + 30, 76, L("Kirchturm", "Church tower"), 11, 700, INK, "start")}${T(180, 140, L("Pfarrkirche", "Parish church"), 11, 600, MUTED)}
${huts}
<rect x="${GX + COLS * CELL + 4}" y="${GY + CELL + 14}" width="26" height="52" fill="#B8C7D6" ${o(2)}/>${T(GX + COLS * CELL + 17, GY + CELL + 82, L("Kühl-", "Cold"), 9, 700, INK)}${T(GX + COLS * CELL + 17, GY + CELL + 93, L("hütte", "store"), 9, 700, INK)}
<g transform="translate(${GX + 40},${GY + ROWS * CELL + 22})"><path d="M30,0 L60,58 L0,58 Z" fill="#2F5A3A" ${o(2)}/><path d="M30,-6 l3,8 l8,0 l-6,5 l2,8 l-7,-5 l-7,5 l2,-8 l-6,-5 l8,0 Z" fill="${GOLD}" ${o(1.2)}/><rect x="26" y="58" width="8" height="10" fill="${WOOD}"/>${T(76, 40, L("Christbaum", "Christmas tree"), 11, 700, INK, "start")}</g>
<g transform="translate(${GX + 300},${GY + ROWS * CELL + 30})"><rect width="150" height="40" fill="#C9B79A" ${o(2)}/>${T(75, 26, L("Bühne", "Stage"), 12, 800)}</g>
${extra ? `<rect x="${GX - 6}" y="${GY + ROWS * CELL + 74}" width="${COLS * CELL + 12}" height="${extra - 4}" fill="none" stroke="${MUTED}" stroke-width="1.6" stroke-dasharray="6 6"/>${T(GX + COLS * CELL, GY + ROWS * CELL + 92, L("Ablage", "Tray"), 11, 600, MUTED, "end")}` : ""}
</svg>`;
}
export function marketPlan(en, marks) { return pic(planSvg(en, { marks }), en ? "Market plan – tap to enlarge" : "Marktplan – antippen zum Vergrößern"); }

// ---------- Schablone: ausgestanzter Lebkuchen-Karton (tw × th Felder), Kerbe oben über Spalte p ----------
export const TW = 3, TH = 3;
export function templateSvg(en, p, holes, { standalone = false } = {}) {
  const w = TW * CELL, h = TH * CELL, hs = 50, nx = p * CELL + CELL / 2;
  const outer = `M0,0 L${nx - 11},0 L${nx},16 L${nx + 11},0 L${w},0 L${w},${h} L0,${h} Z`;
  const cut = holes.map(([c, r]) => { const x = c * CELL + (CELL - hs) / 2, y = r * CELL + (CELL - hs) / 2 + 6; return `M${x},${y} L${x + hs},${y} L${x + hs},${y + hs} L${x},${y + hs} Z`; }).join(" ");
  const D = defs();
  const print = `<g opacity=".55">${T(w / 2, h - 18, en ? "GINGERBREAD · KERZENTHAL" : "LEBKUCHEN · KERZENTHAL", 13, 800, "#6B3F1D")}${[[34, 40], [w - 30, 70], [40, h - 60]].map(([x, y]) => `<path d="M${x},${y + 6} C${x - 10},${y - 4} ${x - 4},${y - 12} ${x},${y - 4} C${x + 4},${y - 12} ${x + 10},${y - 4} ${x},${y + 6} Z" fill="${RED}"/>`).join("")}</g>`;
  const body = `<path d="${outer} ${cut}" fill="${CARTON}" fill-rule="evenodd" ${o(2.2, "#5A3A1E")}/>${print}<path d="${outer}" fill="none" stroke="#5A3A1E" stroke-width="1" stroke-dasharray="2 5" transform="translate(4,4) scale(${(w - 8) / w},${(h - 8) / h})" opacity=".5"/>`;
  if (!standalone) return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(2px 4px 3px rgba(0,0,0,.35))" aria-hidden="true">${body}</svg>`;
  const W = w + 80, H = h + 80;
  return pic(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Die-cut gingerbread carton with four square holes and a V-shaped notch on the top edge" : "Ausgestanzter Lebkuchen-Karton mit vier quadratischen Löchern und einer V-Kerbe an der Oberkante")}" style="width:100%;display:block;background:#3A3F4A">${D.svg}<rect width="${W}" height="${H}" fill="${D.dots}" opacity=".15"/><g transform="translate(40,40)">${body}</g>${T(W / 2, 28, en ? "notch ↓" : "Kerbe ↓", 12, 700, WARM)}</svg>`, en ? "Gingerbread carton – tap to enlarge" : "Lebkuchen-Karton – antippen zum Vergrößern");
}
// Interaktive Schablone (site/spiel/solo.js: .schab): Plan als Unterlage, Karton verschiebbar (Ziehen oder Pfeile), rastet je Feld ein
export function schablone(en, id, p, holes) {
  const extra = TH * CELL + 70, W = 600, H = 620 + extra, x0 = 0, y0 = ROWS + 1;
  const pos = (x, y) => `left:${((GX + x * CELL) / W * 100).toFixed(3)}%;top:${((GY + y * CELL) / H * 100).toFixed(3)}%;width:${(TW * CELL / W * 100).toFixed(3)}%;height:${(TH * CELL / H * 100).toFixed(3)}%`;
  const btn = (dx, dy, l, a) => `<button type="button" data-mv="${dx},${dy}" aria-label="${esc(a)}" style="min-width:48px;min-height:48px;font-size:20px;border:2px solid ${INK};border-radius:8px;background:${PAPER};color:${INK};cursor:pointer">${l}</button>`;
  return `<div class="schab" data-id="${esc(id)}" data-w="${W}" data-h="${H}" data-gx="${GX}" data-gy="${GY}" data-cell="${CELL}" data-cols="${COLS}" data-rows="${ROWS}" data-tw="${TW}" data-th="${TH}" data-x0="${x0}" data-y0="${y0}" data-maxy="${ROWS + 1}" style="margin:12px 0">
<div class="schab-st" style="position:relative;user-select:none;-webkit-user-select:none">${planSvg(en, { extra, label: false })}<div class="schab-t" role="img" aria-label="${esc(en ? "Gingerbread carton, movable" : "Lebkuchen-Karton, verschiebbar")}" style="position:absolute;${pos(x0, y0)};cursor:grab;touch-action:none">${templateSvg(en, p, holes)}</div></div>
<div class="schab-ctl" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px">${btn(-1, 0, "◀", en ? "Move left" : "nach links")}${btn(0, -1, "▲", en ? "Move up" : "nach oben")}${btn(0, 1, "▼", en ? "Move down" : "nach unten")}${btn(1, 0, "▶", en ? "Move right" : "nach rechts")}</div>
<p class="small" style="text-align:center;margin:6px 0 0">${en ? "Drag the carton or use the arrows – it snaps onto the huts." : "Karton ziehen oder mit den Pfeilen verschieben – er rastet auf den Hütten ein."}</p></div>`;
}

// ---------- Turmuhr ----------
function towerClock(x, y, r, hh, mm) {
  const ticks = [...Array(60)].map((_, i) => { const a = i * 6 * Math.PI / 180, l = i % 5 ? r * .1 : r * .2, w = i % 5 ? 1.4 : 3; return `<path d="M${(x + Math.sin(a) * (r - 3)).toFixed(1)},${(y - Math.cos(a) * (r - 3)).toFixed(1)} L${(x + Math.sin(a) * (r - 3 - l)).toFixed(1)},${(y - Math.cos(a) * (r - 3 - l)).toFixed(1)}" stroke="${INK}" stroke-width="${w}"/>`; }).join("");
  const num = [[12, 0], [3, 90], [6, 180], [9, 270]].map(([n, d]) => { const a = d * Math.PI / 180; return T(x + Math.sin(a) * (r - 30), y - Math.cos(a) * (r - 30) + 6, String(n), r * .22, 800); }).join("");
  const ma = mm * 6 * Math.PI / 180, ha = ((hh % 12) + mm / 60) * 30 * Math.PI / 180;
  return `<circle cx="${x}" cy="${y}" r="${r + 16}" fill="${WARM}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${WARM}" ${o(3)}/>${ticks}${num}
<path d="M${x},${y} L${(x + Math.sin(ha) * r * .5).toFixed(1)},${(y - Math.cos(ha) * r * .5).toFixed(1)}" ${o(6)}/><path d="M${x},${y} L${(x + Math.sin(ma) * r * .86).toFixed(1)},${(y - Math.cos(ma) * r * .86).toFixed(1)}" ${o(3.4)}/><circle cx="${x}" cy="${y}" r="4" fill="${INK}"/>`;
}
const stars = (n, W, H) => [...Array(n)].map((_, i) => `<circle cx="${(i * 97) % W}" cy="${(i * 53) % (H * .4)}" r="${i % 3 ? 1 : 1.6}" fill="${SNOW}" opacity=".7"/>`).join("");
const huts = (y, dark = true) => [...Array(6)].map((_, i) => `<path d="M${i * 70 - 10},${y} L${i * 70 + 25},${y - 26} L${i * 70 + 60},${y} Z" fill="${dark ? "#0E1226" : "#3A2A22"}" ${o(2)}/><rect x="${i * 70 - 6}" y="${y}" width="62" height="60" fill="${dark ? "#161B33" : "#5A3E2A"}" ${o(2)}/>`).join("");
const crowd = (y, phones) => [...Array(11)].map((_, i) => { const x = 20 + i * 58 + (i % 2) * 10, h = 70 + (i * 13) % 25; return `<path d="M${x - 22},${y} Q${x - 22},${y - h * .6} ${x},${y - h * .62} Q${x + 22},${y - h * .6} ${x + 22},${y} Z" fill="#05070F" ${o(2)}/><circle cx="${x}" cy="${y - h * .75}" r="13" fill="#05070F" ${o(2)}/>${phones && i % 3 === 0 ? `<rect x="${x + 6}" y="${y - h * .9}" width="8" height="13" fill="${SNOW}" ${o(1)}/><circle cx="${x + 10}" cy="${y - h * .9 - 8}" r="14" fill="${SNOW}" opacity=".18"/>` : ""}`; }).join("");
// kind: christkind | menge | riegel | baum ; time = Uhrzeit auf der Turmuhr (Minuten seit 0:00)
export function towerPhoto(en, kind, time, no) {
  const W = 640, H = 420, D = defs(), hh = Math.floor(time / 60), mm = time % 60;
  const sky = `<rect width="${W}" height="${H}" fill="${NIGHT}"/>${stars(40, W, H)}`;
  const tower = (x, y, r) => `<rect x="${x - r - 22}" y="${y - r - 40}" width="${2 * r + 44}" height="${H}" fill="#2A3150" ${o(3)}/><path d="M${x - r - 30},${y - r - 40} L${x},${y - r - 120} L${x + r + 30},${y - r - 40} Z" fill="#232A45" ${o(3)}/>${towerClock(x, y, r, hh, mm)}`;
  let scene = "";
  if (kind === "christkind") scene = `${tower(520, 132, 80)}${huts(300)}<rect x="60" y="300" width="300" height="40" fill="#2A2233" ${o(2)}/>
<g transform="translate(205,300)"><path d="M-34,0 L-22,-110 L22,-110 L34,0 Z" fill="${SNOW}" ${o(2.4)}/><circle cx="0" cy="-126" r="17" fill="${SKIN}" ${o(2)}/><path d="M-20,-136 Q0,-160 20,-136" fill="#E9D27A" ${o(2)}/>${[-14, -5, 5, 14].map((d) => `<rect x="${d - 1.5}" y="-158" width="3" height="12" fill="${SNOW}"/><path d="M${d},-162 q-3,-5 0,-9 q3,4 0,9 Z" fill="${GOLD}"/>`).join("")}<rect x="18" y="-88" width="6" height="22" fill="${SNOW}" ${o(1.2)}/><path d="M21,-92 q-5,-8 0,-15 q5,7 0,15 Z" fill="${GOLD}"/><circle cx="21" cy="-96" r="22" fill="${GOLD}" opacity=".22"/></g>${crowd(H, true)}`;
  else if (kind === "menge") scene = `${tower(480, 132, 82)}${huts(260)}${crowd(H - 20, true)}${crowd(H + 30, true)}`;
  else if (kind === "riegel") scene = `${tower(548, 112, 72)}<rect x="40" y="70" width="380" height="${H}" fill="#9FB2C4" ${o(3)}/><rect x="90" y="110" width="250" height="${H}" fill="#8BA0B5" ${o(3)}/>${T(215, 100, en ? "COLD STORE" : "KÜHLHÜTTE", 18, 800, INK)}
<path d="M90,${H} L-40,${H} L-40,0 Z" fill="${SNOW}" opacity=".08"/><path d="M-20,${H - 40} L250,220 L330,300 Z" fill="${SNOW}" opacity=".18"/>
<rect x="290" y="236" width="110" height="20" rx="4" fill="#7E8791" ${o(2.4)}/><rect x="300" y="226" width="20" height="40" rx="3" fill="#5E6670" ${o(2)}/><rect x="356" y="240" width="40" height="12" rx="3" fill="#B9C2CB" ${o(2)}/>
<g transform="translate(380,250)"><path d="M0,-26 Q34,-30 46,-6 Q52,16 30,24 L-6,24 Q-20,8 0,-26 Z" fill="#6E2A2A" ${o(2.4)}/>${[...Array(5)].map((_, i) => `<path d="M${2 + i * 8},-20 l0,40" stroke="#4E1C1C" stroke-width="2"/>`).join("")}<path d="M4,-22 Q-16,-30 -14,-6" fill="#6E2A2A" ${o(2.2)}/><path d="M30,24 L60,60 L120,60 L120,20 L40,10" fill="#2A2233" ${o(2.4)}/></g>`;
  else scene = `${tower(530, 122, 78)}${huts(280, false)}<g transform="translate(220,${H})"><path d="M0,-330 L120,-40 L-120,-40 Z" fill="#245236" ${o(3)}/><path d="M0,-260 L95,-120 L-95,-120 Z" fill="#2E6B45" opacity=".6"/>${[...Array(46)].map((_, i) => `<circle cx="${((i * 37) % 200) - 100}" cy="${-60 - ((i * 59) % 260)}" r="4" fill="${i % 2 ? GOLD : "#F7E9C6"}"/>`).filter((_, i) => true).join("")}<path d="M0,-352 l7,16 l17,1 l-13,11 l4,17 l-15,-9 l-15,9 l4,-17 l-13,-11 l17,-1 Z" fill="${GOLD}" ${o(2)}/><circle cx="0" cy="-200" r="170" fill="${GOLD}" opacity=".12"/><rect x="-14" y="-40" width="28" height="40" fill="${WOOD}" ${o(2)}/></g>${crowd(H + 20, false)}`;
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? `Visitor photo ${no}: the lit church tower clock in the dark` : `Besucherfoto ${no}: die beleuchtete Turmuhr im Dunkeln`)}" style="width:100%;display:block;background:${NIGHT}">${D.svg}${sky}${scene}<rect x="12" y="12" width="96" height="30" rx="6" fill="#000" opacity=".55"/>${T(60, 33, (en ? "Photo " : "Foto ") + no, 15, 800, SNOW)}</svg>`;
  return pic(svg, en ? `Photo ${no} – tap to enlarge` : `Foto ${no} – antippen zum Vergrößern`);
}

// ---------- Häferl-Motive ----------
export const MOTIFS = ["stern", "engel", "krippe", "schneemann"];
export const MOTIF_NAME = { de: { stern: "Stern (2022)", engel: "Engel (2023)", krippe: "Krippe (2024)", schneemann: "Schneemann (2025)" }, en: { stern: "star (2022)", engel: "angel (2023)", krippe: "nativity stable (2024)", schneemann: "snowman (2025)" } };
const MOT = {
  stern: (s) => `<path d="M0,${-s} L${s * .29},${-s * .31} L${s * .95},${-s * .31} L${s * .43},${s * .12} L${s * .59},${s * .81} L0,${s * .4} L${-s * .59},${s * .81} L${-s * .43},${s * .12} L${-s * .95},${-s * .31} L${-s * .29},${-s * .31} Z" fill="${GOLD}" ${o(1.4)}/>`,
  engel: (s) => `<path d="M${-s * .2},${-s * .2} Q${-s * 1.1},${-s * .9} ${-s * .9},${s * .2} Q${-s * .5},${s * .05} ${-s * .2},${s * .1} Z M${s * .2},${-s * .2} Q${s * 1.1},${-s * .9} ${s * .9},${s * .2} Q${s * .5},${s * .05} ${s * .2},${s * .1} Z" fill="#CFE0F2" ${o(1.2)}/><path d="M${-s * .35},${s * .95} L0,${-s * .3} L${s * .35},${s * .95} Z" fill="${SNOW}" ${o(1.3)}/><circle cx="0" cy="${-s * .5}" r="${s * .24}" fill="${SKIN}" ${o(1.2)}/><ellipse cx="0" cy="${-s * .82}" rx="${s * .3}" ry="${s * .09}" fill="none" stroke="${GOLD}" stroke-width="${s * .1}"/>`,
  krippe: (s) => `<path d="M${-s},${-s * .1} L0,${-s * .9} L${s},${-s * .1} Z" fill="#8E5A34" ${o(1.3)}/><rect x="${-s * .8}" y="${-s * .1}" width="${s * 1.6}" height="${s}" fill="#B07A4C" ${o(1.3)}/><path d="M${-s * .4},${s * .9} L${-s * .2},${s * .35} L${s * .2},${s * .35} L${s * .4},${s * .9}" fill="none" ${o(1.3)}/><rect x="${-s * .25}" y="${s * .25}" width="${s * .5}" height="${s * .18}" fill="#E9D27A" ${o(1)}/><path d="M0,${-s * 1.25} l${s * .1},${s * .2} l${s * .2},0 l${-s * .16},${s * .12} l${s * .07},${s * .2} l${-s * .21},${-s * .12} l${-s * .21},${s * .12} l${s * .07},${-s * .2} l${-s * .16},${-s * .12} l${s * .2},0 Z" fill="${GOLD}"/>`,
  schneemann: (s) => `<circle cx="0" cy="${s * .45}" r="${s * .55}" fill="${SNOW}" ${o(1.3)}/><circle cx="0" cy="${-s * .4}" r="${s * .38}" fill="${SNOW}" ${o(1.3)}/><rect x="${-s * .3}" y="${-s * 1.15}" width="${s * .6}" height="${s * .4}" fill="${INK}"/><rect x="${-s * .45}" y="${-s * .8}" width="${s * .9}" height="${s * .1}" fill="${INK}"/><path d="M0,${-s * .38} l${s * .35},${s * .08} l${-s * .35},${s * .06} Z" fill="#E8792B"/><circle cx="0" cy="${s * .3}" r="${s * .07}" fill="${INK}"/><circle cx="0" cy="${s * .55}" r="${s * .07}" fill="${INK}"/>`,
};
export const motif = (k, x, y, s) => `<g transform="translate(${x},${y})">${MOT[k](s)}</g>`;
const mug = (k, x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M14,-14 Q30,-14 30,0 Q30,14 14,14" fill="none" ${o(5)}/><path d="M14,-14 Q30,-14 30,0 Q30,14 14,14" fill="none" stroke="${SNOW}" stroke-width="2.4"/><rect x="-18" y="-24" width="34" height="46" rx="5" fill="${SNOW}" ${o(2.4)}/><rect x="-18" y="-24" width="34" height="5" fill="${RED}"/>${motif(k, -1, 0, 11)}</g>`;

// ---------- Gruppenfoto 17:55: fünf Standler mit Häferln ----------
const BODY = {
  gerry: (r) => `<path d="M-34,-118 Q0,-126 34,-118 L42,-40 L-42,-40 Z" fill="#4A3A2E" ${o()}/><path d="M-22,-112 L22,-112 L28,-40 L-28,-40 Z" fill="#6E5A44" ${o(2)}/>${[...Array(6)].map((_, i) => `<circle cx="${-14 + i * 6}" cy="${-70 + (i % 2) * 8}" r="2.2" fill="#2A221A"/>`).join("")}${face(r)}<path d="M-24,-160 Q-22,-186 2,-187 Q26,-185 24,-160 Z" fill="#5E5244" ${o(2)}/><path d="M-26,-162 L30,-162 L36,-156 L-24,-156 Z" fill="#4A4036" ${o(2)}/><path d="M-12,-140 Q0,-134 12,-140 L10,-131 Q0,-126 -10,-131 Z" fill="#6B5A48"/>`,
  elfi: (r) => `<path d="M-26,-118 Q0,-126 26,-118 L36,-40 L-36,-40 Z" fill="#7A2E3A" ${o()}/><path d="M-18,-112 L18,-112 L26,-40 L-26,-40 Z" fill="${SNOW}" ${o(2)}/>${[[-6, -90], [8, -74], [-4, -58]].map(([x, y]) => `<path d="M${x},${y + 5} C${x - 7},${y - 3} ${x - 3},${y - 9} ${x},${y - 3} C${x + 3},${y - 9} ${x + 7},${y - 3} ${x},${y + 5} Z" fill="${RED}"/>`).join("")}${face(r, true)}<path d="M-22,-150 Q-26,-190 0,-191 Q26,-190 22,-150 Q20,-170 0,-172 Q-20,-170 -22,-150 Z" fill="#C9C2B4" ${o(2)}/><circle cx="-8" cy="-156" r="7" fill="none" ${o(2.4)}/><circle cx="9" cy="-156" r="7" fill="none" ${o(2.4)}/><path d="M-1,-156 L2,-156" ${o(2)}/>`,
  rosi: (r) => `<path d="M-26,-118 Q0,-126 26,-118 L36,-40 L-36,-40 Z" fill="#2F5A3A" ${o()}/><path d="M-20,-118 Q0,-96 20,-118 L16,-100 Q0,-84 -16,-100 Z" fill="${SNOW}" ${o(1.6)}/><path d="M-26,-118 L-10,-80 L10,-80 L26,-118" fill="none" stroke="${RED}" stroke-width="4"/>${face(r, true)}<path d="M-22,-160 Q-20,-190 0,-190 Q20,-190 22,-160 Q14,-176 0,-176 Q-14,-176 -22,-160 Z" fill="#E1B95A" ${o(2)}/><path d="M-24,-172 Q0,-200 24,-172" fill="none" stroke="#E1B95A" stroke-width="9"/><path d="M-24,-172 Q0,-200 24,-172" fill="none" ${o(1.4)}/>`,
  konrad: (r) => `<path d="M-34,-118 Q0,-126 34,-118 L42,-40 L-42,-40 Z" fill="#3F5A35" ${o()}/><path d="M-8,-122 L-6,-44 M8,-122 L6,-44" stroke="#2A3D22" stroke-width="2.4"/>${face(r)}<path d="M-20,-148 Q-22,-112 0,-106 Q22,-112 20,-148 Q10,-130 0,-132 Q-10,-130 -20,-148 Z" fill="#E9E5DA" ${o(2)}/><path d="M-21,-158 Q-22,-186 0,-188 Q22,-186 21,-158 Q14,-172 0,-170 Q-14,-172 -21,-158 Z" fill="#E9E5DA" ${o(2)}/>`,
  jonas: (r) => `<path d="M-40,-110 Q-90,-170 -80,-60 Q-60,-80 -34,-80 Z M40,-110 Q90,-170 80,-60 Q60,-80 34,-80 Z" fill="${GOLD}" ${o(2)}/><path d="M-28,-118 Q0,-126 28,-118 L40,-40 L-40,-40 Z" fill="${SNOW}" ${o()}/>${face(r)}<path d="M-21,-158 Q-24,-182 -10,-186 Q2,-194 14,-186 Q24,-180 21,-158 Q12,-172 0,-170 Q-12,-172 -21,-158 Z" fill="#B07A3A" ${o(2)}/><ellipse cx="0" cy="-200" rx="20" ry="6" fill="none" stroke="${GOLD}" stroke-width="4"/>`,
};
export function groupPhoto(en, people) {
  const W = 760, H = 380, D = defs(), w = 140;
  const lights = [...Array(24)].map((_, i) => `<circle cx="${12 + i * 32}" cy="${44 + Math.sin(i * .9) * 10}" r="5" fill="${i % 3 ? GOLD : "#F7E9C6"}" ${o(1)}/>`).join("");
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Group photo at 17:55: five stallholders in a row, each holding a punch mug with a motif" : "Gruppenfoto um 17:55: fünf Standler in einer Reihe, jede Person hält ein Punsch-Häferl mit Motiv")}" style="width:100%;display:block;background:${NIGHT2}">${D.svg}
<rect width="${W}" height="${H}" fill="${NIGHT2}"/><path d="M0,44 Q380,70 ${W},44" fill="none" stroke="#0C0F1E" stroke-width="2"/>${lights}
${[...Array(6)].map((_, i) => `<path d="M${i * 140 - 30},170 L${i * 140 + 40},120 L${i * 140 + 110},170 Z" fill="#3A2A22" ${o(2)}/><rect x="${i * 140 - 22}" y="170" width="124" height="120" fill="#5A3E2A" ${o(2)}/><rect x="${i * 140 - 10}" y="186" width="100" height="40" fill="#E9B44C" opacity=".35"/>`).join("")}
<rect x="0" y="${H - 50}" width="${W}" height="50" fill="${SNOW}" opacity=".85"/>
${people.map((p, i) => { const x = 80 + i * w; return `<g transform="translate(${x},${H - 10}) scale(1.25)">${BODY[p.key](RED)}</g>${mug(p.motif, x + 6, H - 100, 1.55)}`; }).join("")}
<rect x="${W - 160}" y="12" width="148" height="28" rx="6" fill="#000" opacity=".55"/>${T(W - 86, 32, en ? "Market blog · 17:55" : "Marktblog · 17:55", 13, 700, SNOW)}
</svg>`;
  return pic(svg, en ? "Group photo – tap to enlarge" : "Gruppenfoto – antippen zum Vergrößern");
}
export function mugPhoto(en, k) {
  const W = 520, H = 340, D = defs();
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Punch mug on the floor of the cold store, with a year motif" : "Punsch-Häferl auf dem Boden der Kühlhütte, mit Jahresmotiv")}" style="width:100%;display:block;background:#AFC1D2">${D.svg}
${[...Array(14)].map((_, i) => `<path d="M${i * 40},0 L${i * 40},${H}" stroke="#8EA2B5" stroke-width="3"/>`).join("")}${[...Array(9)].map((_, i) => `<path d="M0,${i * 40} L${W},${i * 40}" stroke="#8EA2B5" stroke-width="3"/>`).join("")}<rect width="${W}" height="${H}" fill="${SNOW}" opacity=".25"/>
<ellipse cx="260" cy="290" rx="120" ry="22" fill="#000" opacity=".2"/>${mug(k, 250, 190, 4)}
<rect x="12" y="12" width="150" height="28" rx="6" fill="#000" opacity=".55"/>${T(87, 32, en ? "Police photo" : "Polizeifoto", 13, 700, SNOW)}</svg>`;
  return pic(svg, en ? "Mug – tap to enlarge" : "Häferl – antippen zum Vergrößern");
}

// ---------- Ziffernfeld mit Staubzucker und Serviette ----------
export const KEYPOS = (k) => [(k - 1) % 3, Math.floor((k - 1) / 3)];
export function keypad(en, keys) {
  const W = 420, H = 440, D = defs(), s = 92, x0 = 72, y0 = 92;
  const dust = (cx, cy, seed) => [...Array(26)].map((_, i) => { const a = (i * 137.5 + seed * 31) * Math.PI / 180, r = ((i * 7 + seed * 3) % 30); return `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r * .8).toFixed(1)}" r="${1.2 + (i % 3) * .7}" fill="#FFFFFF" opacity=".92"/>`; }).join("");
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Keypad of the donation box, nine keys from 1 to 9, four of them dusted with icing sugar" : "Ziffernfeld der Spendenkassa, neun Tasten von 1 bis 9, vier davon mit Staubzucker bestäubt")}" style="width:100%;display:block;background:#3B414D">${D.svg}
<rect x="30" y="30" width="${W - 60}" height="${H - 60}" rx="18" fill="#9AA3AE" ${o(3)}/><rect x="50" y="48" width="${W - 100}" height="30" rx="6" fill="#20262E" ${o(2)}/>${T(W / 2, 69, "- - - -", 16, 700, "#7FD36B")}
${[...Array(9)].map((_, i) => { const k = i + 1, [c, r] = KEYPOS(k), x = x0 + c * s, y = y0 + r * s; return `<rect x="${x}" y="${y}" width="${s - 16}" height="${s - 16}" rx="10" fill="#E3E7EC" ${o(2.4)}/>${T(x + (s - 16) / 2, y + (s - 16) / 2 + 12, String(k), 32, 800)}${keys.includes(k) ? dust(x + (s - 16) / 2, y + (s - 16) / 2, k) : ""}`; }).join("")}
<rect x="12" y="${H - 34}" width="150" height="26" rx="6" fill="#000" opacity=".55"/>${T(87, H - 16, en ? "Police photo" : "Polizeifoto", 12, 700, SNOW)}</svg>`;
  return pic(svg, en ? "Keypad – tap to enlarge" : "Ziffernfeld – antippen zum Vergrößern");
}
// Serviette: Weg des Kometen über eine Prägung aus 4 × 4 Punkten (versetzt), Schweif am Anfang, Stern am Ende
export function napkin(en, seq) {
  const W = 420, H = 420, D = defs(), s = 70, x0 = 105, y0 = 105, off = [1, 0];
  const P = seq.map((k) => { const [c, r] = KEYPOS(k); return [x0 + (c + off[0]) * s, y0 + (r + off[1]) * s + 35]; });
  const emb = [...Array(16)].map((_, i) => `<circle cx="${x0 - 35 + (i % 4) * s + 35}" cy="${y0 + Math.floor(i / 4) * s + 35}" r="9" fill="none" stroke="#D9D3C4" stroke-width="2"/>`).join("");
  const [a, b] = [P[0], P[1]], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const tail = [-14, 0, 14].map((d) => { const nx = -Math.sin(ang) * d, ny = Math.cos(ang) * d; return `<path d="M${(a[0] + nx * .3).toFixed(1)},${(a[1] + ny * .3).toFixed(1)} q${(-Math.cos(ang) * 30 + nx).toFixed(1)},${(-Math.sin(ang) * 30 + ny).toFixed(1)} ${(-Math.cos(ang) * 64 + nx * 1.6).toFixed(1)},${(-Math.sin(ang) * 64 + ny * 1.6).toFixed(1)}" fill="none" stroke="#2A4FA0" stroke-width="2" stroke-linecap="round" opacity=".8"/>`; }).join("");
  const e = P[P.length - 1], star = `<path d="M${e[0]},${e[1] - 20} l6,13 l14,1 l-11,9 l4,14 l-13,-8 l-13,8 l4,-14 l-11,-9 l14,-1 Z" fill="none" stroke="#2A4FA0" stroke-width="2.4"/>`;
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Paper napkin with a ballpoint sketch: a comet with its tail, its path running through four points and ending in a star" : "Papierserviette mit Kugelschreiber-Skizze: ein Komet mit Schweif, sein Weg führt über vier Punkte und endet in einem Stern")}" style="width:100%;display:block;background:#7A2E2E">${D.svg}
<g transform="rotate(-3 210 210)"><rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="#FBF8F1" ${o(2)}/><path d="M34,34 L${W - 34},${H - 34} M${W - 34},34 L34,${H - 34}" stroke="#EDE7DA" stroke-width="2"/>${emb}
${tail}<path d="M${P.map((p) => p.join(",")).join(" L")}" fill="none" stroke="#2A4FA0" stroke-width="3" stroke-linejoin="round" stroke-dasharray="1 0"/>${P.slice(1, -1).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#2A4FA0"/>`).join("")}<circle cx="${P[0][0]}" cy="${P[0][1]}" r="4.5" fill="#2A4FA0"/>${star}
<text x="62" y="${H - 54}" ${HAND} font-size="26" fill="#2A4FA0">${esc(en ? "the comet’s path" : "der Weg des Kometen")}</text></g></svg>`;
  return pic(svg, en ? "Napkin – tap to enlarge" : "Serviette – antippen zum Vergrößern");
}
