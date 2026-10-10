// Bilder für Solo 002 „Applaus für einen Toten“
import { INK, PAPER, RED, TAN, CARD, MUTED, T, o, defs, pic, esc } from "./gn.js";
// Fingerabdruck-Muster (Rillen als Tusche-Linien, im Oval beschnitten)
const RID = `fill="none" stroke="#2A2620" stroke-width="2" stroke-linecap="round"`;
const PAT = {
  wirbel: () => [...Array(9)].map((_, i) => `<ellipse cx="0" cy="2" rx="${3 + i * 3.4}" ry="${4 + i * 4.3}" ${RID}/>`).join(""),
  bogen: () => [...Array(15)].map((_, i) => { const y = -34 + i * 5.2, a = 14 - Math.abs(i - 7) * 1.4; return `<path d="M-30,${y + 4} Q0,${y - a} 30,${y + 4}" ${RID}/>`; }).join(""),
  schleife: () => [...Array(10)].map((_, i) => { const r = 2.5 + i * 3.4; return `<path d="M-30,${2 - r} L4,${2 - r} A${r},${r} 0 0 1 4,${2 + r} L-30,${2 + r}" ${RID}/>`; }).join(""),
  // Doppelschleife (Paul, seit 10.10.2026): vorher gespiegelte Schleife, zu ähnlich zu Tobias
  doppel: () => [...Array(8)].map((_, i) => { const r = 3 + i * 3.6; return `<path d="M${-r},-6 A${r},${r} 0 0 1 ${r},-6 L${r},6 A${r},${r} 0 0 1 ${-r},6 Z" transform="rotate(-35)" ${RID}/>`; }).join("") + [...Array(4)].map((_, i) => `<path d="M-30,${-34 + i * 5} Q0,${-44 + i * 5} 30,${-34 + i * 5} M-30,${34 - i * 5} Q0,${44 - i * 5} 30,${34 - i * 5}" ${RID}/>`).join(""),
  narbe: () => PAT.wirbel() + `<path d="M-26,-20 L24,16" stroke="#F4EFE4" stroke-width="5" stroke-linecap="round"/>`,
};
const TYPES = { wirbel: (s) => PAT.wirbel(), bogen: () => PAT.bogen(), schleifeL: () => PAT.schleife(), schleifeR: () => PAT.doppel(), narbe: () => PAT.narbe() };
export const PRINT_OF = { vera: "wirbel", tobias: "schleifeL", nina: "bogen", paul: "schleifeR", felix: "narbe" };
let pid = 0;
export function print(type, x, y, s = 1, rot = 0) {
  const id = "fp" + ++pid;
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><defs><clipPath id="${id}"><ellipse cx="0" cy="0" rx="22" ry="29"/></clipPath></defs><ellipse cx="0" cy="0" rx="22" ry="29" fill="#F4EFE4"/><g clip-path="url(#${id})">${TYPES[type]()}</g><ellipse cx="0" cy="0" rx="22" ry="29" fill="none" stroke="#2A2620" stroke-width="1" opacity=".5"/></g>`;
}
const TITLE = {
  tee: ["Ingwertee (Thermoskanne)", "Ginger tea (flask)"], spray: ["Halsspray", "Throat spray"], pokal: ["Pokal mit Traubensaft", "Goblet of grape juice"],
  sekt: ["Sektglas bei der Intendantin", "Sparkling wine (director)"], bonbon: ["Bonbonschale in der Garderobe", "Lozenge bowl, dressing room"], wasser: ["Wasserglas für den Monolog", "Glass of water, monologue"],
};
// SUS: key→Name (Vergleichsbecher in fester Reihenfolge), P: prints(c, v), keys: Gegenstände, v: Variante (mischt die Reihenfolge der Abdrücke je Karte)
export function abdruecke(en, SUS, P, keys, v = 0) {
  const items = keys.map((k, i) => {
    const sus = P[k].sus.slice(), n = sus.length, r = (i * 2 + v + 1) % Math.max(n, 1);
    const mixed = sus.slice(r).concat(sus.slice(0, r));
    if ((i + v) % 2) mixed.reverse();
    return { title: [TITLE[k][en ? 1 : 0]], sus: mixed, others: P[k].others };
  });
  const D = defs(), L = (d, e) => (en ? e : d);
  // Vergleichskarte: Kaffeebecher mit Namen
  let top = `<rect x="8" y="8" width="668" height="150" fill="${CARD}" ${o(2.6)}/>${T(18, 30, L("Vergleich: Abdrücke von den Kaffeebechern im Personalraum", "Reference: prints from the coffee mugs in the staff room"), 12.5, 700, INK, "start")}`;
  Object.entries(SUS).forEach(([k, name], i) => {
    const cx = 76 + i * 133;
    top += `<path d="M${cx - 30},88 q14,0 14,14 q0,14 -14,14" fill="none" ${o(4)}/><rect x="${cx - 60}" y="72" width="34" height="52" rx="4" fill="${PAPER}" ${o(2.4)}/><path d="M${cx - 60},80 L${cx - 26},80" ${o(1.4)}/>${print(PRINT_OF[k], cx + 22, 98, 1, -6)}${T(cx - 4, 148, name, 11, 700)}`;
  });
  // Gegenstände
  let cards = "";
  items.forEach((it, i) => {
    const x = 8 + (i % 3) * 226, y = 170 + Math.floor(i / 3) * 186, w = 218;
    const pr = [...it.sus.map((k) => ({ t: PRINT_OF[k] })), ...it.others.map((n) => ({ t: null, n }))];
    cards += `<g transform="translate(${x},${y})"><rect width="${w}" height="176" fill="${PAPER}" ${o(2.6)}/>${it.title.map((ln, j) => T(w / 2, 20 + j * 14, ln, 11.5, 700)).join("")}`;
    cards += `<rect x="10" y="${it.title.length > 1 ? 42 : 32}" width="${w - 20}" height="${it.title.length > 1 ? 124 : 134}" fill="#EDE4CF" stroke="#B8A98A" stroke-width="1.5" stroke-dasharray="5 3"/>`;
    if (!pr.length) cards += T(w / 2, 104, L("keine verwertbaren Abdrücke", "no usable prints"), 11, 600, MUTED);
    const gap = Math.min(46, (w - 30) / Math.max(pr.length, 1));
    pr.forEach((p, j) => {
      const px = w / 2 - ((pr.length - 1) * gap) / 2 + j * gap, py = 98;
      if (p.t) cards += print(p.t, px, py, gap < 44 ? 0.78 : 0.9, (j % 2 ? 7 : -5));
      else cards += `<g transform="translate(${px},${py})"><ellipse rx="${gap < 44 ? 16 : 19}" ry="${gap < 44 ? 22 : 25}" fill="#D9D2C2" ${o(1.4)} stroke-dasharray="3 3"/>${p.n.split(" ").slice(-2).map((t, q, a) => T(0, -4 + q * 11 - (a.length - 1) * 2, t, 8.5, 600, MUTED)).join("")}</g>`;
    });
    cards += `</g>`;
  });
  const svg = `<svg viewBox="0 0 684 ${170 + 2 * 186}" role="img" aria-label="${esc(L("Abdruckkarten der Gegenstände und Vergleichsabdrücke der fünf Verdächtigen", "Print cards for each item and reference prints of the five suspects"))}" style="width:100%;display:block;background:${PAPER}">${D.svg}${top}${cards}</svg>`;
  return pic(svg, L("Fingerabdrücke – antippen zum Vergrößern", "Fingerprints – tap to enlarge"));
}

// Aushang im Personalgang: getippte Liste auf der Pinnwand, darauf der Zettel von P. W. (der Tausch 7/9 ist bewusst nicht markiert)
const HAND = `font-family="Caveat, Segoe Print, Bradley Hand, cursive" font-weight="600"`;   // Caveat: spiel.css
const H = (x, y, t, s = 13, c = "#1F2A6B", a = "start") => `<text x="${x}" y="${y}" text-anchor="${a}" ${HAND} font-size="${s}" fill="${c}">${esc(t)}</text>`;
export function aushang(en, rows) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const top = 70, rh = 30;
  let tab = "";
  rows.forEach(([n, nm], i) => { const y = top + 52 + i * rh; tab += `<path d="M120,${y + 9} L470,${y + 9}" stroke="#CFC6B2" stroke-width="1"/><text x="150" y="${y}" text-anchor="middle" font-family="IBM Plex Mono, Menlo, monospace" font-size="15" font-weight="700" fill="${INK}">${n}</text><text x="200" y="${y}" font-family="IBM Plex Sans, Arial, sans-serif" font-size="15" fill="${INK}">${esc(nm)}</text>`; });
  const y7 = top + 40 + rows.findIndex((r) => r[0] === 7) * rh, y9 = top + 40 + rows.findIndex((r) => r[0] === 9) * rh;
  const pen = `<path d="M372,${y7 - 6} C412,${y7 - 4} 412,${y9 - 8} 376,${y9 - 6}" fill="none" stroke="#1F2A6B" stroke-width="2.2"/><path d="M384,${y9 - 12} L375,${y9 - 6} L385,${y9 - 1}" fill="none" stroke="#1F2A6B" stroke-width="2.2"/><path d="M376,${y7 - 6} L386,${y7 - 11} M376,${y7 - 6} L386,${y7 - 1}" fill="none" stroke="#1F2A6B" stroke-width="2.2"/>${H(414, (y7 + y9) / 2 - 2, L("getauscht!", "swapped!"), 14)}`;
  const note = en ? ["Swapped since Monday:", "Ms Lind now has 9,", "Mr Grün has 7", "(9 is closer to make-up).", "New notice to follow.", "– P. W."] : ["Seit Montag getauscht:", "Frau Lind hat jetzt die 9,", "Herr Grün die 7", "(die 9 ist näher an der Maske).", "Neuer Aushang folgt.", "– P. W."];
  const ph = top + 70 + rows.length * rh;
  const svg = `<svg viewBox="0 0 600 ${ph + 150}" role="img" aria-label="${esc(L("Aushang Spindbelegung mit handschriftlichem Zettel", "Locker notice with handwritten note"))}" style="width:100%;display:block;background:#B98A55">${D.svg}
<rect width="600" height="${ph + 150}" fill="#B98A55"/><rect width="600" height="${ph + 150}" fill="${D.dots}" opacity=".5"/>
<g transform="rotate(-1.2 300 200)"><rect x="96" y="${top - 46}" width="400" height="${ph - 4}" fill="#FFFDF8" ${o(2)}/>
${T(296, top - 14, L("SPINDBELEGUNG PERSONALGANG", "LOCKER ALLOCATION · STAFF CORRIDOR"), 14, 800, INK)}${T(296, top + 6, L("Stand: letzte Woche", "As of: last week"), 11, 500, MUTED)}
${T(150, top + 22, L("Spind", "Locker"), 11, 700, MUTED)}${T(200, top + 22, "Name", 11, 700, MUTED, "start")}${tab}
<circle cx="116" cy="${top - 30}" r="6" fill="${RED}" ${o(1.5)}/><circle cx="476" cy="${top - 30}" r="6" fill="${RED}" ${o(1.5)}/></g>
<g transform="translate(318,${ph - 40}) rotate(4)"><rect x="0" y="0" width="262" height="160" fill="#FFE58A" ${o(1.5)}/><rect x="0" y="0" width="262" height="160" fill="#000" opacity=".04"/>${note.map((t, i) => H(14, 30 + i * 23, t, i === 5 ? 17 : 19.5, "#1F2A6B", "start")).join("")}<circle cx="131" cy="10" r="5" fill="#2E5FA8" ${o(1.2)}/></g></svg>`;
  return pic(svg, L("Aushang im Personalgang – antippen zum Vergrößern", "Notice in the staff corridor – tap to enlarge"));
}

// Hausplan Erdgeschoss (Orientierung, kein Rätsel)
export function hausplan(en) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const room = (x, y, w, h, lab, sub = "", fill = CARD, ls = 12) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${o(2.6)}/>${T(x + w / 2, y + h / 2 + (sub ? -3 : 4), lab, ls, 700)}${sub ? T(x + w / 2, y + h / 2 + 12, sub, 9.5, 500, MUTED) : ""}`;
  // Saal mit Sitzreihen
  let rows = "";
  for (let i = 0; i < 11; i++) rows += `<path d="M${54 + i * 15},96 L${54 + i * 15},300" stroke="#B8A98A" stroke-width="3" stroke-dasharray="7 4"/>`;
  const svg = `<svg viewBox="0 0 684 420" role="img" aria-label="${esc(L("Hausplan des Theaters am Kanal", "Floor plan of the Theater am Kanal"))}" style="width:100%;display:block;background:${PAPER}">${D.svg}
${T(14, 24, L("Theater am Kanal · Hausplan Erdgeschoss (nicht maßstabsgetreu)", "Theater am Kanal · ground-floor plan (not to scale)"), 12.5, 700, INK, "start")}
${room(10, 330, 120, 74, L("Foyer · Buffet", "Foyer · bar"))}${room(140, 330, 110, 74, L("Intendanzbüro", "Director’s office"))}
<rect x="40" y="80" width="190" height="236" fill="${CARD}" ${o(2.6)}/>${rows}${T(135, 72, L("Zuschauersaal", "Auditorium"), 12, 700)}
<rect x="44" y="176" width="26" height="46" fill="${RED}" ${o(2)}/><rect x="74" y="184" width="76" height="32" fill="${PAPER}" opacity=".9"/>${T(78, 197, L("Lichtpult", "Lighting desk"), 9.5, 700, RED, "start")}${T(78, 210, L("Reihe 22", "row 22"), 9, 600, RED, "start")}

<path d="M240,80 L240,316" stroke="${RED}" stroke-width="5"/>${T(250, 330, L("Vorhang", "curtain"), 9.5, 600, RED, "start")}
<rect x="244" y="130" width="196" height="136" fill="#E9DFC8" ${o(2.6)}/>${T(342, 200, L("Bühne", "Stage"), 14, 800)}<rect x="300" y="214" width="84" height="18" fill="#8C6E4E" ${o(2)}/>${T(342, 248, L("Festtafel", "banquet table"), 9.5, 600, MUTED)}
<rect x="244" y="80" width="196" height="46" fill="#5E5A52" ${o(2.6)}/>${T(342, 98, L("Seitengasse links", "Wings, stage left"), 10.5, 700, PAPER)}<rect x="400" y="106" width="34" height="14" fill="${TAN}" ${o(1.6)}/>${T(342, 116, L("Requisitentisch", "props table"), 9, 600, PAPER)}
<rect x="244" y="270" width="196" height="46" fill="#5E5A52" ${o(2.6)}/>${T(342, 290, L("Seitengasse rechts", "Wings, stage right"), 10.5, 700, PAPER)}<rect x="400" y="276" width="34" height="14" fill="${TAN}" ${o(1.6)}/>${T(342, 306, L("Requisitentisch", "props table"), 9, 600, PAPER)}
<rect x="248" y="272" width="44" height="16" fill="${INK}"/>${T(270, 284, L("Pult", "desk"), 9, 700, PAPER)}${T(330, 342, L("Inspizientenpult (K. Moser)", "Prompt desk (K. Moser)"), 9.5, 600, MUTED)}<path d="M270,290 L300,334" stroke="${MUTED}" stroke-width="1.4"/>
<rect x="450" y="80" width="18" height="236" fill="#D8CDB4" ${o(2)}/><text x="459" y="200" transform="rotate(-90 459 200)" text-anchor="middle" font-family="IBM Plex Sans, Arial, sans-serif" font-size="9.5" font-weight="600" fill="${MUTED}">${L("Gang", "Corridor")}</text>
${room(478, 80, 100, 56, L("Garderobe", "Dressing room"), "R. Adler")}${room(478, 142, 100, 56, L("Personalraum", "Staff room"), L("Kaffeebecher", "coffee mugs"))}${room(478, 204, 100, 56, L("Personalgang", "Staff corridor"), L("Spinde", "lockers"))}
${room(478, 266, 100, 50, L("Treppe", "Stairs"), L("↑ 2. Stock: Maske", "↑ 2nd floor: make-up"), "#EDE4CF", 11)}
${room(588, 80, 86, 70, L("Bühnen-", "Stage"), L("pforte", "door"), "#EDE4CF", 11)}${T(631, 166, L("J. Wallner", "J. Wallner"), 9.5, 600, MUTED)}
<path d="M631,180 L631,330" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/><path d="M624,322 L631,332 L638,322" fill="none" ${o(2)}/>${T(631, 352, L("Hof · Straße", "Yard · street"), 10, 700)}${T(631, 370, L("Außenlager", "Outside store"), 10, 700)}${T(631, 384, L("gegenüber", "across the road"), 9, 500, MUTED)}
</svg>`;
  return pic(svg, L("Hausplan – antippen zum Vergrößern", "Floor plan – tap to enlarge"));
}
