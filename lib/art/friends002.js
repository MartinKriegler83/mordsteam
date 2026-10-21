// Bilder für Friends 002 „Vier Minuten Finsternis“ (Weihnachts-Special im Friends-Format, 21.10.2026).
// Graphic-Novel-Stil wie alle Akten (lib/art/gn.js), Farben wie das Solo-Special (lib/art/special002.js).
// Alles als SVG aus den Gruppendaten: Marktplan mit Christbaum (Schablone mit Kerbe unten), Pfandmarke,
// Schlüsselbrett im Marktbüro, Rätselplakat mit Buchstaben-Lichterkette.
import { o, esc, T, defs, pic, INK, RED, PAPER, MUTED } from "./gn.js";
import { GRID, hutAt, NIGHT, NIGHT2, GOLD, WARM, SNOW, WOOD, CARTON } from "./special002.js";
export { GRID, hutAt };

const HAND = `font-family="Caveat, Segoe Print, Bradley Hand, cursive" font-weight="600"`;

// ---------- Marktplan von der Budenstraße aus: 24 Hütten, unten der Christbaum ----------
// Anders als im Solo-Fall sitzt die Kerbe der Schablone UNTEN und gehört an die Spitze des Christbaums.
export const COLS = 6, ROWS = 4, CELL = 80, GX = 60, GY = 110, TREE_COL = 2, TW = 3, TH = 3;
const hut = (n, c, r, mark) => {
  const cx = GX + c * CELL + CELL / 2, cy = GY + r * CELL + CELL / 2;
  return `<g data-hut="${n}"><path d="M${cx - 34},${cy - 14} L${cx},${cy - 34} L${cx + 34},${cy - 14} Z" fill="#2F5A3A" ${o(2)}/><path d="M${cx - 34},${cy - 14} L${cx},${cy - 34} L${cx + 34},${cy - 14}" fill="none" stroke="${SNOW}" stroke-width="3" opacity=".9"/>
<rect x="${cx - 30}" y="${cy - 14}" width="60" height="44" fill="#C69A6B" ${o(2)}/>${[...Array(5)].map((_, i) => `<path d="M${cx - 30},${cy - 6 + i * 8} L${cx + 30},${cy - 6 + i * 8}" stroke="#A57B52" stroke-width="1"/>`).join("")}
<circle cx="${cx}" cy="${cy + 6}" r="17" fill="${PAPER}" ${o(2.2)}/>${T(cx, cy + 12, String(n), 17, 800)}${mark || ""}</g>`;
};
const treeX = () => GX + TREE_COL * CELL + CELL / 2;
export function planF(en, { extra = 0, marks = {}, label = true } = {}) {
  const W = 600, H = 560 + extra, D = defs(), L = (d, e) => (en ? e : d), tx = treeX(), ty = GY + ROWS * CELL + 8;
  const huts = GRID.map((row, r) => row.map((n, c) => hut(n, c, r, marks[n])).join("")).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L("Plan des Elternvereins: 24 nummerierte Hütten in vier Reihen, oben die Kirche, unten in der Mitte der Christbaum, rechts die Bühne", "Parents’ association plan: 24 numbered huts in four rows, the church at the top, the Christmas tree at the bottom middle, the stage on the right"))}" style="width:100%;display:block;background:${PAPER}">${D.svg}
<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="${PAPER}" ${o(3)}/>
${label ? `${T(22, 32, L("KERZENTHAL · PLAN FÜR DIE PUNSCH-HELFER", "KERZENTHAL · PLAN FOR THE PUNCH HELPERS"), 14, 800, INK, "start")}${T(22, 50, L("vom Elternverein, Rückseite des Schichtplans", "from the parents’ association, back of the shift rota"), 11, 500, MUTED, "start")}` : ""}
<path d="M420,100 L420,66 L470,48 L520,66 L520,100 Z" fill="#D8CFBF" ${o(2.2)}/>${T(470, 92, L("Kirche", "Church"), 10, 700, MUTED)}
<rect x="${GX - 6}" y="${GY - 4}" width="${COLS * CELL + 12}" height="${ROWS * CELL + 8}" fill="#E5E1D8" opacity=".7"/>
${huts}
<rect x="${GX + COLS * CELL + 4}" y="${GY + CELL + 14}" width="26" height="52" fill="#B8C7D6" ${o(2)}/>${T(GX + COLS * CELL + 17, GY + CELL + 82, L("Kühl-", "Cold"), 9, 700, INK)}${T(GX + COLS * CELL + 17, GY + CELL + 93, L("hütte", "store"), 9, 700, INK)}
<g data-tree="1"><path d="M${tx},${ty} L${tx + 32},${ty + 64} L${tx - 32},${ty + 64} Z" fill="#2F5A3A" ${o(2)}/><path d="M${tx},${ty - 7} l3,8 l8,0 l-6,5 l2,8 l-7,-5 l-7,5 l2,-8 l-6,-5 l8,0 Z" fill="${GOLD}" ${o(1.2)}/><rect x="${tx - 4}" y="${ty + 64}" width="8" height="10" fill="${WOOD}"/>${T(tx + 40, ty + 44, L("Christbaum", "Christmas tree"), 11, 700, INK, "start")}</g>
<g transform="translate(${GX + 330},${GY + ROWS * CELL + 22})"><rect width="140" height="38" fill="#C9B79A" ${o(2)}/>${T(70, 25, L("Bühne", "Stage"), 12, 800)}</g>
${extra ? `<rect x="${GX - 6}" y="${GY + 6 * CELL - 14}" width="${COLS * CELL + 12}" height="${TH * CELL + 24}" fill="none" stroke="${MUTED}" stroke-width="1.6" stroke-dasharray="6 6"/>${T(GX + COLS * CELL, GY + 6 * CELL - 20, L("Ablage", "Tray"), 11, 600, MUTED, "end")}` : ""}
</svg>`;
}
export function marketPlanF(en, marks) { return pic(planF(en, { marks }), en ? "Market plan – tap to enlarge" : "Marktplan – antippen zum Vergrößern"); }

// ---------- Schablone: Einsatz aus einem Häferl-Karton (3 × 3 Felder), Kerbe UNTEN über Spalte p ----------
export function templateF(en, p, holes, { standalone = false } = {}) {
  const w = TW * CELL, h = TH * CELL, hs = 50, nx = p * CELL + CELL / 2;
  const outer = `M0,0 L${w},0 L${w},${h} L${nx + 11},${h} L${nx},${h + 16} L${nx - 11},${h} L0,${h} Z`;
  const cut = holes.map(([c, r]) => { const x = c * CELL + (CELL - hs) / 2, y = r * CELL + (CELL - hs) / 2 - 2; return `M${x},${y} L${x + hs},${y} L${x + hs},${y + hs} L${x},${y + hs} Z`; }).join(" ");
  const D = defs();
  const print = `<g opacity=".55">${T(w / 2, 20, en ? "PUNCH MUGS · 6 PCS" : "PUNSCH-HÄFERL · 6 STK.", 12, 800, "#6B3F1D")}${[[30, h - 26], [w - 32, h - 30]].map(([x, y]) => `<path d="M${x - 8},${y - 6} L${x + 6},${y - 6} L${x + 4},${y + 8} L${x - 6},${y + 8} Z M${x + 6},${y - 3} q7,0 6,5 q-1,4 -6,4" fill="none" stroke="${RED}" stroke-width="2"/>`).join("")}</g>`;
  const body = `<path d="${outer} ${cut}" fill="${CARTON}" fill-rule="evenodd" ${o(2.2, "#5A3A1E")}/>${print}`;
  if (!standalone) return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(2px 4px 3px rgba(0,0,0,.35))" aria-hidden="true">${body}</svg>`;
  const W = w + 80, H = h + 90;
  return pic(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Cardboard insert from a box of punch mugs with four square holes and a V-shaped notch on the bottom edge" : "Einsatz aus einem Häferl-Karton mit vier quadratischen Löchern und einer V-Kerbe an der Unterkante")}" style="width:100%;display:block;background:#3A3F4A">${D.svg}<g transform="translate(40,30)">${body}</g>${T(40 + nx, H - 12, en ? "↑ notch" : "↑ Kerbe", 12, 700, WARM)}</svg>`, en ? "Cardboard insert – tap to enlarge" : "Karton-Einsatz – antippen zum Vergrößern");
}
// Interaktiv wie im Solo-Fall (site/spiel/friends.js: .schab): Plan als Unterlage, Karton aus der Ablage ziehen oder mit Pfeilen schieben
export function schabloneF(en, id, p, holes) {
  const extra = TH * CELL + 60, W = 600, H = 560 + extra, x0 = 0, y0 = 6;
  const pos = (x, y) => `left:${((GX + x * CELL) / W * 100).toFixed(3)}%;top:${((GY + y * CELL) / H * 100).toFixed(3)}%;width:${(TW * CELL / W * 100).toFixed(3)}%;height:${(TH * CELL / H * 100).toFixed(3)}%`;
  const btn = (dx, dy, l, a) => `<button type="button" data-mv="${dx},${dy}" aria-label="${esc(a)}" style="min-width:48px;min-height:48px;font-size:20px;border:2px solid ${INK};border-radius:8px;background:${PAPER};color:${INK};cursor:pointer">${l}</button>`;
  return `<div class="schab" data-id="${esc(id)}" data-w="${W}" data-h="${H}" data-gx="${GX}" data-gy="${GY}" data-cell="${CELL}" data-cols="${COLS}" data-rows="${ROWS}" data-tw="${TW}" data-th="${TH}" data-x0="${x0}" data-y0="${y0}" data-maxy="6" style="margin:12px 0">
<div class="schab-st" style="position:relative;user-select:none;-webkit-user-select:none">${planF(en, { extra, label: false })}<div class="schab-t" role="img" aria-label="${esc(en ? "Cardboard insert, movable" : "Karton-Einsatz, verschiebbar")}" style="position:absolute;${pos(x0, y0)};cursor:grab;touch-action:none">${templateF(en, p, holes)}</div></div>
<div class="schab-ctl" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px">${btn(-1, 0, "◀", en ? "Move left" : "nach links")}${btn(0, -1, "▲", en ? "Move up" : "nach oben")}${btn(0, 1, "▼", en ? "Move down" : "nach unten")}${btn(1, 0, "▶", en ? "Move right" : "nach rechts")}</div>
<p class="small" style="text-align:center;margin:6px 0 0">${en ? "Drag the insert or use the arrows – it snaps onto the huts." : "Einsatz ziehen oder mit den Pfeilen verschieben – er rastet auf den Hütten ein."}</p></div>`;
}

// ---------- Pfandmarke am Boden der Kühlhütte ----------
export function pfandmarke(en, nr) {
  const W = 520, H = 320, D = defs();
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? `Red plastic deposit token number ${nr} on the floor of the cold store` : `Rote Pfandmarke aus Plastik mit der Nummer ${nr} am Boden der Kühlhütte`)}" style="width:100%;display:block;background:#AFC1D2">${D.svg}
${[...Array(14)].map((_, i) => `<path d="M${i * 40},0 L${i * 40},${H}" stroke="#8EA2B5" stroke-width="3"/>`).join("")}${[...Array(9)].map((_, i) => `<path d="M0,${i * 40} L${W},${i * 40}" stroke="#8EA2B5" stroke-width="3"/>`).join("")}<rect width="${W}" height="${H}" fill="${SNOW}" opacity=".25"/>
<ellipse cx="268" cy="196" rx="96" ry="30" fill="#000" opacity=".18"/><ellipse cx="260" cy="170" rx="92" ry="58" fill="#B3261E" ${o(3)}/><ellipse cx="260" cy="164" rx="70" ry="42" fill="none" stroke="#E87A6E" stroke-width="3"/>
${T(260, 154, en ? "DEPOSIT" : "PFAND", 15, 800, "#FBE3DE")}${T(260, 188, String(nr), 34, 800, "#FFFFFF")}
<rect x="12" y="12" width="150" height="28" rx="6" fill="#000" opacity=".55"/>${T(87, 32, en ? "Police photo" : "Polizeifoto", 13, 700, SNOW)}</svg>`;
  return pic(svg, en ? "Deposit token – tap to enlarge" : "Pfandmarke – antippen zum Vergrößern");
}

// ---------- Schlüsselbrett im Marktbüro: Anhänger mit Formen ----------
export const SHAPES = ["kreis", "quadrat", "dreieck", "stern", "herz", "raute", "tropfen", "mond", "glocke", "tanne"];
export const SHAPE_NAME = {
  de: { kreis: "roter Kreis", quadrat: "blaues Quadrat", dreieck: "grünes Dreieck", stern: "gelber Stern", herz: "rosa Herz", raute: "violette Raute", tropfen: "türkiser Tropfen", mond: "oranger Mond", glocke: "goldene Glocke", tanne: "dunkelgrüne Tanne" },
  en: { kreis: "red circle", quadrat: "blue square", dreieck: "green triangle", stern: "yellow star", herz: "pink heart", raute: "purple diamond", tropfen: "turquoise drop", mond: "orange moon", glocke: "golden bell", tanne: "dark green fir" },
};
const SHAPE = {
  kreis: (s) => `<circle r="${s}" fill="#D23B2E" ${o(2)}/>`,
  quadrat: (s) => `<rect x="${-s}" y="${-s}" width="${2 * s}" height="${2 * s}" fill="#2E66C8" ${o(2)}/>`,
  dreieck: (s) => `<path d="M0,${-s * 1.1} L${s},${s * .8} L${-s},${s * .8} Z" fill="#3E9A4A" ${o(2)}/>`,
  stern: (s) => `<path d="M0,${-s * 1.1} L${s * .32},${-s * .32} L${s * 1.05},${-s * .32} L${s * .45},${s * .14} L${s * .68},${s * .9} L0,${s * .44} L${-s * .68},${s * .9} L${-s * .45},${s * .14} L${-s * 1.05},${-s * .32} L${-s * .32},${-s * .32} Z" fill="#F2C14E" ${o(2)}/>`,
  herz: (s) => `<path d="M0,${s * .9} C${-s * 1.4},${-s * .1} ${-s * .7},${-s * 1.2} 0,${-s * .4} C${s * .7},${-s * 1.2} ${s * 1.4},${-s * .1} 0,${s * .9} Z" fill="#E88AB0" ${o(2)}/>`,
  raute: (s) => `<path d="M0,${-s * 1.15} L${s * .85},0 L0,${s * 1.15} L${-s * .85},0 Z" fill="#7B4FB0" ${o(2)}/>`,
  tropfen: (s) => `<path d="M0,${-s * 1.15} C${s * .9},${-s * .1} ${s * .9},${s * .9} 0,${s * .9} C${-s * .9},${s * .9} ${-s * .9},${-s * .1} 0,${-s * 1.15} Z" fill="#2BA8A8" ${o(2)}/>`,
  mond: (s) => `<path d="M${s * .4},${-s * 1.05} A${s * 1.1},${s * 1.1} 0 1 0 ${s * .4},${s * 1.05} A${s * .8},${s * .8} 0 1 1 ${s * .4},${-s * 1.05} Z" fill="#E8862B" ${o(2)}/>`,
  glocke: (s) => `<path d="M0,${-s} C${s * .7},${-s} ${s * .7},${s * .2} ${s},${s * .7} L${-s},${s * .7} C${-s * .7},${s * .2} ${-s * .7},${-s} 0,${-s} Z" fill="#C9A23A" ${o(2)}/><circle cy="${s * .9}" r="${s * .2}" fill="#C9A23A" ${o(1.6)}/>`,
  tanne: (s) => `<path d="M0,${-s * 1.15} L${s * .7},${-s * .1} L${s * .35},${-s * .1} L${s},${s * .8} L${-s},${s * .8} L${-s * .35},${-s * .1} L${-s * .7},${-s * .1} Z" fill="#1F5A32" ${o(2)}/>`,
};
export const shapeIcon = (k, x, y, s) => `<g transform="translate(${x},${y})">${SHAPE[k](s)}</g>`;
// hooks: [{ label, tag }] (tag = Form oder null = Haken leer), 2 Reihen à 5
export function brett(en, hooks) {
  const W = 700, H = 440, D = defs();
  const cell = (h, i) => {
    const c = i % 5, r = Math.floor(i / 5), x = 60 + c * 130, y = 70 + r * 180;
    const key = h.tag ? `<path d="M${x},${y + 18} L${x},${y + 74}" stroke="#8A8F96" stroke-width="5"/><circle cx="${x}" cy="${y + 30}" r="9" fill="none" stroke="#8A8F96" stroke-width="5"/><path d="M${x},${y + 66} l9,0 M${x},${y + 74} l7,0" stroke="#8A8F96" stroke-width="4"/>
<path d="M${x - 3},${y + 38} L${x - 3},${y + 92}" stroke="#E5DCC8" stroke-width="2"/>${shapeIcon(h.tag, x, y + 110, 20)}` : `${T(x, y + 70, en ? "(empty)" : "(leer)", 12, 600, "#C9BFA9")}`;
    return `<g data-hook="${esc(h.label)}" data-tag="${h.tag || ""}"><rect x="${x - 52}" y="${y - 36}" width="104" height="26" rx="4" fill="${PAPER}" ${o(1.6)}/>${T(x, y - 18, h.label, 13, 800)}<path d="M${x - 6},${y - 6} q0,14 6,16 q6,-2 6,-16" fill="none" stroke="#5E5A52" stroke-width="4"/>${key}</g>`;
  };
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Key board in the market office: ten hooks with name plates, keys with coloured tags in different shapes" : "Schlüsselbrett im Marktbüro: zehn Haken mit Schildern, Schlüssel mit farbigen Anhängern in verschiedenen Formen")}" style="width:100%;display:block;background:#6E5038">${D.svg}
<rect x="20" y="16" width="${W - 40}" height="${H - 32}" fill="#9A7650" ${o(3)}/>${[...Array(8)].map((_, i) => `<path d="M20,${40 + i * 52} L${W - 20},${40 + i * 52}" stroke="#86643F" stroke-width="2"/>`).join("")}
${hooks.map(cell).join("")}
<rect x="${W - 190}" y="${H - 44}" width="168" height="26" rx="6" fill="#000" opacity=".55"/>${T(W - 106, H - 26, en ? "Police photo · 19:12" : "Polizeifoto · 19:12", 12, 700, SNOW)}</svg>`;
  return pic(svg, en ? "Key board – tap to enlarge" : "Schlüsselbrett – antippen zum Vergrößern");
}

// ---------- Brunners Adventrätsel-Plakat: Lichterkette aus Buchstaben-Lampen ----------
// bulbs: [{ ch, star }] – Sterne (gelb, sternförmig) tragen das Wort, runde Lampen (rot/grün/blau) Füllbuchstaben
export function plakat(en, bulbs) {
  const W = 760, H = 460, D = defs(), n = bulbs.length, x0 = 40, step = (W - 80) / (n - 1);
  const yAt = (i) => 120 + Math.sin(i / (n - 1) * Math.PI) * 60;
  const COL = ["#C8342A", "#2F7A3A", "#2E66C8"];
  const bulb = (b, i) => {
    const x = x0 + i * step, y = yAt(i) + 26;
    const shape = b.star ? `<path d="M${x},${y - 22} L${x + 7},${y - 7} L${x + 22},${y - 7} L${x + 10},${y + 3} L${x + 14},${y + 19} L${x},${y + 9} L${x - 14},${y + 19} L${x - 10},${y + 3} L${x - 22},${y - 7} L${x - 7},${y - 7} Z" fill="${GOLD}" ${o(2)}/>`
      : `<ellipse cx="${x}" cy="${y}" rx="15" ry="19" fill="${COL[i % 3]}" ${o(2)}/>`;
    return `<g data-b="${b.star ? "s" : "r"}"><path d="M${x},${yAt(i)} L${x},${y - 18}" stroke="${INK}" stroke-width="2"/>${shape}${T(x, y + 6, b.ch, 15, 800, b.star ? INK : "#FFFFFF")}</g>`;
  };
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Hand-drawn advent puzzle poster: a punch stall under a chain of lights; every bulb carries a letter, some bulbs are yellow stars, the others are round" : "Handgezeichnetes Adventrätsel-Plakat: ein Punschstand unter einer Lichterkette; jede Lampe trägt einen Buchstaben, einige Lampen sind gelbe Sterne, die anderen rund")}" style="width:100%;display:block;background:#F7F1E3">${D.svg}
<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="#FBF7EC" ${o(3)}/>
<text x="${W / 2}" y="58" text-anchor="middle" ${HAND} font-size="34" fill="${RED}">${esc(en ? "Advent puzzle for the nursery" : "Adventrätsel für den Kindergarten")}</text>
<path d="M${x0},120 Q${W / 2},${120 + 120} ${W - 40},120" fill="none" stroke="${INK}" stroke-width="2.4"/>
${bulbs.map(bulb).join("")}
<g transform="translate(230,250)"><path d="M-20,40 L150,-10 L320,40 Z" fill="#8E3B2E" ${o(2.4)}/><rect x="0" y="40" width="300" height="130" fill="#C69A6B" ${o(2.4)}/>${[...Array(7)].map((_, i) => `<path d="M0,${54 + i * 18} L300,${54 + i * 18}" stroke="#A57B52" stroke-width="1.4"/>`).join("")}
<rect x="20" y="78" width="260" height="34" fill="${PAPER}" ${o(2)}/>${T(150, 101, en ? "PUNCH · FOR THE NURSERY ROOF" : "PUNSCH · FÜRS KINDERGARTENDACH", 14, 800)}
<path d="M44,170 l0,-30 q14,-8 28,0 l0,30 Z M224,170 l0,-30 q14,-8 28,0 l0,30 Z" fill="${WARM}" ${o(2)}/></g>
<text x="40" y="${H - 30}" ${HAND} font-size="22" fill="${MUTED}">${esc(en ? "– A. Brunner" : "– A. Brunner")}</text></svg>`;
  return pic(svg, en ? "Poster – tap to enlarge" : "Plakat – antippen zum Vergrößern");
}
