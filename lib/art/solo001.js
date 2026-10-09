// Bilder für Solo 001 „Nachtzug nach Venedig“
import { INK, PAPER, RED, TAN, CARD, SKIN, MUTED, T, o, defs, fig, roster, pic, esc } from "./gn.js";
const L = (en, de, e) => (en ? e : de);
export function zugplan(en) {
  const D = defs();
  const car = (x, w, label, sub, inner = "", hi = false) => `<g><rect x="${x}" y="40" width="${w}" height="92" rx="10" fill="${hi ? "#FFF8EA" : CARD}" stroke="${INK}" stroke-width="3.2"/>${hi ? "" : `<rect x="${x}" y="40" width="${w}" height="92" rx="10" fill="${D.dots}"/>`}${inner}${T(x + w / 2, 30, label, 14, 700)}${T(x + w / 2, 156, sub, 11.5, 500, "#5E5A52")}</g>`;
  const door = (x) => `<rect x="${x - 7}" y="72" width="14" height="28" fill="${TAN}" stroke="${INK}" stroke-width="2.4"/>`;
  let comp = "";
  const lab = ["D1", "2", "3", "4", "5", "6"];
  for (let i = 0; i < 6; i++) { const cx = 368 + i * 34; comp += `<rect x="${cx}" y="48" width="32" height="50" fill="${i === 3 ? "#F4D9D5" : PAPER}" stroke="${INK}" stroke-width="2"/>${T(cx + 16, 78, lab[i], 12, 700, i === 3 ? RED : INK)}`; }
  comp += `<rect x="572" y="48" width="22" height="50" fill="#C9BFA9" stroke="${INK}" stroke-width="2"/>${T(583, 78, "WC", 9.5, 700)}<path d="M366,110 L596,110" stroke="${INK}" stroke-width="1.6" stroke-dasharray="4 4"/>${T(481, 125, L(en, "Gang", "Corridor"), 10, 500, "#5E5A52")}`;
  const svg = `<svg viewBox="0 0 760 180" role="img" aria-label="${L(en, "Zugaufbau von oben", "Train layout from above")}" style="width:100%;display:block;background:${PAPER}">${D.svg}
 <path d="M8,60 Q8,40 30,40 L70,40 L70,132 L30,132 Q8,132 8,112 Z" fill="${INK}"/><rect x="8" y="40" width="62" height="92" fill="${D.hatch}" opacity=".3"/>${T(39, 30, L(en, "Lok", "Loco"), 13, 700)}
 ${car(78, 92, "324", L(en, "Sitzwagen", "Seating car"))}${car(178, 92, "325", L(en, "Speisewagen", "Dining car"))}${car(278, 80, "326", L(en, "Liegewagen", "Couchette car"))}
 ${car(364, 236, L(en, "327 · Schlafwagen", "327 · Sleeping car"), L(en, "Abteil 4: Viktor Hallwachs", "Compartment 4: Viktor Hallwachs"), comp, true)}${car(608, 144, "328", L(en, "Schlafwagen · 12, 14", "Sleeping car · 12, 14"))}
 ${door(174)}${door(274)}${door(361)}${door(604)}
 <path d="M8,170 L40,170 M16,164 L8,170 L16,176" stroke="${RED}" stroke-width="3" fill="none"/>${T(48, 174, L(en, "Fahrtrichtung Venedig", "Direction of travel: Venice"), 10.5, 600, RED, "start")}</svg>`;
  return pic(svg, L(en, "Zugaufbau von oben – antippen zum Vergrößern", "Train layout from above – tap to enlarge"));
}
export function reisende(en) {
  const p = [
    { key: "anton", name: "Anton Kofler", sub: L(en, "Schaffner · Dienst 1", "Conductor · staff 1") },
    { key: "helene", name: "Helene Marquardt", sub: L(en, "Abteil 3", "Compartment 3") },
    { key: "jonas", name: "Jonas Hallwachs", sub: L(en, "Abteil 5", "Compartment 5") },
    { key: "sofia", name: "Sofia Benedetti", sub: L(en, "Abteil 6", "Compartment 6") },
    { key: "lang", name: L(en, "Dr. Friedrich Lang", "Dr Friedrich Lang"), sub: L(en, "Wagen 328 · 12", "Car 328 · 12") },
  ];
  return pic(roster(p), L(en, "Die Reisenden – antippen zum Vergrößern", "The passengers – tap to enlarge"));
}

// Fotos von Sofias Kamera: fünf Bilder mit eingeblendetem Zeitstempel; IMG_2202–2204 hängen vom Täter ab
const NIGHT = "#1B2230", NIGHT2 = "#2A3344", WARM = "#E9B44C";
// Ein Kamerabild 200×140 mit eingebranntem Zeitstempel
function shot(D, x, y, file, time, scene) {
  return `<g transform="translate(${x},${y})"><rect x="-6" y="-6" width="212" height="172" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/>
<g clip-path="url(#c${D.id})"><rect width="200" height="140" fill="${NIGHT}"/>${scene}<rect width="200" height="140" fill="${D.dots}" opacity=".18"/></g>
<rect x="0" y="0" width="200" height="140" fill="none" stroke="${INK}" stroke-width="3"/>
<text x="192" y="131" text-anchor="end" font-family="IBM Plex Mono, Menlo, monospace" font-weight="700" font-size="14" fill="#FF9A3C" stroke="#111216" stroke-width="3" paint-order="stroke">${esc(time)}</text>
${T(100, 157, file, 11.5, 700, INK)}</g>`;
}
const S = {
  lampe: (D) => `<rect x="0" y="0" width="200" height="70" fill="${NIGHT2}"/><path d="M20,10 L180,10 L180,64 L20,64 Z" fill="#0E131C" ${o(3)}/><path d="M30,20 L60,20 M120,30 L170,30" stroke="#3B4660" stroke-width="2"/>
<path d="M0,96 L200,96 L200,140 L0,140 Z" fill="${PAPER}" ${o(3)}/><path d="M0,96 L200,96 L200,104 L0,104 Z" fill="${CARD}"/>
<path d="M100,70 L140,140 L60,140 Z" fill="${WARM}" opacity=".22"/><path d="M96,96 L96,62 M104,96 L104,62" ${o(3)}/><path d="M82,62 L118,62 L110,40 L90,40 Z" fill="${RED}" ${o(3)}/><path d="M104,40 L110,40 L118,62 L108,62 Z" fill="#8E2219"/><ellipse cx="100" cy="97" rx="14" ry="3" fill="${INK}"/>
<path d="M140,96 L142,76 L156,76 L158,96 Z" fill="#CFE0E8" opacity=".7" ${o(2)}/>`,
  gang: (D, lab = "326") => `<path d="M0,0 L80,48 L80,96 L0,140 Z" fill="${NIGHT2}" ${o(2.5)}/><path d="M200,0 L120,48 L120,96 L200,140 Z" fill="#6E6656" ${o(2.5)}/><path d="M80,48 L120,48 L120,96 L80,96 Z" fill="#0E131C" ${o(2.5)}/><path d="M0,0 L200,0 L120,48 L80,48 Z" fill="#3A3A40" ${o(2.5)}/><path d="M0,140 L80,96 L120,96 L200,140 Z" fill="#4A4236" ${o(2.5)}/><path d="M100,96 L100,140" stroke="${RED}" stroke-width="3" opacity=".7"/>
<path d="M10,22 L50,40 L50,80 L10,104 Z M56,44 L72,52 L72,82 L56,90 Z" fill="#0E131C" ${o(2)}/><path d="M150,38 L150,104 M176,26 L176,118" ${o(2)}/><circle cx="160" cy="74" r="2.5" fill="${TAN}"/>${T(163, 36, lab, 10, 700, PAPER)}`,
  liege64: (D) => `<rect width="200" height="140" fill="#3A3A40"/><path d="M0,30 L200,30 M0,98 L200,98" ${o(4)}/><rect x="0" y="98" width="200" height="42" fill="#6B5A44" ${o(3)}/><rect x="10" y="8" width="26" height="16" fill="${PAPER}" ${o(2)}/>${T(23, 21, "64", 11, 700)}
<rect x="40" y="34" width="150" height="64" fill="#8C8578" opacity=".35"/>${fig("mann64", 90, 170, 0.62, WARM)}<rect width="200" height="140" fill="#FFFFFF" opacity=".06"/>`,
  notiz: (D) => `<rect width="200" height="140" fill="#4A4236"/><rect x="0" y="80" width="200" height="60" fill="${CARD}" ${o(3)}/><g transform="rotate(-8 100 98)"><rect x="56" y="70" width="80" height="56" fill="#FFFDF5" ${o(2.5)}/><path d="M56,70 L136,70 L136,78 L56,78 Z" fill="${RED}"/>${[86, 94, 102, 110, 118].map((y, i) => `<path d="M64,${y} Q${80 + i * 4},${y - 3} ${96 + (i % 2) * 18},${y}" fill="none" stroke="#38404E" stroke-width="1.6"/>`).join("")}</g><path d="M146,82 L176,128" stroke="${INK}" stroke-width="5"/><path d="M146,82 L176,128" stroke="${TAN}" stroke-width="2.5"/><path d="M0,0 L60,0 L60,60 L0,60 Z" fill="#0E131C" ${o(2.5)}/>${T(178, 22, "6", 18, 700, PAPER)}`,
  unscharf: (D, who) => `${S.gang(D)}<g filter="${D.blur}">${fig(who, 104, 182, 0.7, WARM)}</g><rect width="200" height="140" fill="#FFFFFF" opacity=".07"/>`,
  fenster: (D) => `<rect width="200" height="140" fill="#6E6656"/><rect x="24" y="16" width="152" height="84" rx="10" fill="#0E131C" ${o(3.5)}/><path d="M40,80 Q70,70 90,78 T150,74" stroke="#3B4660" stroke-width="2" fill="none"/><circle cx="140" cy="36" r="5" fill="${PAPER}" opacity=".8"/><path d="M24,16 L46,16 Q40,60 46,100 L24,100 Z" fill="${RED}" ${o(2.5)}/><path d="M176,16 L156,16 Q162,60 156,100 L176,100 Z" fill="${RED}" ${o(2.5)}/><rect x="0" y="108" width="200" height="32" fill="#4A4236" ${o(3)}/><path d="M10,124 L190,124" stroke="${TAN}" stroke-width="3"/>${T(100, 12, "327", 10, 700, PAPER)}`,
};
// variant: "sofia" (Sofia Täterin), "anton" (Anton Täter → Zugbegleiterin), sonst Schaffneruniform
export function kamera(en, variant, s) {
  const D = defs();
  const sh = variant === "sofia"
    ? [["IMG_2202", "01:03", S.gang(D)], ["IMG_2203", "01:05", S.liege64(D)], ["IMG_2204", "01:18", S.notiz(D)]]
    : [["IMG_2202", "01:28", S.gang(D)], ["IMG_2203", "01:33", S.liege64(D)], ["IMG_2204", "01:37", S.unscharf(D, variant === "anton" ? "ferri" : "anton")]];
  const all = [["IMG_2201", "00:44", S.lampe(D)], ...sh, ["IMG_2205", "01:52", S.fenster(D)]];
  const pos = [[14, 14], [242, 14], [470, 14], [128, 196], [356, 196]];
  const svg = `<svg viewBox="0 0 684 372" role="img" aria-label="${en ? "Five photos with camera timestamps" : "Fünf Fotos mit Zeitstempel der Kamera"}" style="width:100%;display:block;background:#2B2A27">${D.svg}<clipPath id="c${D.id}"><rect width="200" height="140"/></clipPath>${all.map((a, i) => shot(D, pos[i][0] + 6, pos[i][1] + 6, a[0], s(a[1]), a[2])).join("")}</svg>`;
  return pic(svg, en ? "Sofia’s photos – tap to enlarge" : "Sofias Fotos – antippen zum Vergrößern");
}

// Mögliche Verstecke: Plan mit Nummern, Karten mit Maßband (Länge = Innenmaß), Schloss, Stempel „durchsucht“, Vergleichsrolle 46 cm
const V_ORDER = ["schirm325", "regal326", "waesche327", "heizung327", "notsitz327", "regal328", "schrank328"];
const V_MAP = { schirm325: [224, 116], regal326: [344, 116], waesche327: [384, 98], heizung327: [430, 120], notsitz327: [538, 120], regal328: [628, 116], schrank328: [700, 116] };
const V_ICON = {
  regal: `<rect x="-38" y="-30" width="76" height="60" fill="${CARD}" ${o(2.6)}/><path d="M-38,-6 L38,-6 M-38,18 L38,18" ${o(2.6)}/><rect x="-30" y="-24" width="26" height="18" rx="3" fill="${MUTED}" ${o(2)}/><rect x="4" y="-20" width="22" height="14" rx="3" fill="${RED}" ${o(2)}/><rect x="-14" y="0" width="34" height="18" rx="3" fill="#3B4660" ${o(2)}/>`,
  schrank: `<rect x="-24" y="-34" width="48" height="68" fill="#8C6E4E" ${o(2.6)}/><path d="M0,-34 L0,34" ${o(2)}/><circle cx="-5" cy="2" r="2.5" fill="${TAN}" ${o(1)}/><circle cx="5" cy="2" r="2.5" fill="${TAN}" ${o(1)}/><path d="M6,-34 L24,-34 L24,34 L6,34" fill="#5E4A34" opacity=".5"/>`,
  schirm: `<path d="M-16,-6 L16,-6 L13,34 L-13,34 Z" fill="#3B4660" ${o(2.6)}/><path d="M-6,-6 L-10,-34 Q-10,-40 -4,-40 M6,-6 L9,-30 Q10,-36 15,-34" fill="none" ${o(2.6)}/><path d="M-16,-6 L16,-6" ${o(3)}/>`,
  heizung: `<rect x="-40" y="-18" width="80" height="40" fill="#C9C2B4" ${o(2.6)}/>${[...Array(9)].map((_, i) => `<path d="M${-32 + i * 8},-12 L${-32 + i * 8},16" ${o(1.6)}/>`).join("")}<rect x="30" y="-28" width="10" height="10" fill="${INK}"/><rect x="33" y="-25" width="4" height="4" fill="${TAN}"/>`,
  waesche: `<rect x="-36" y="-26" width="72" height="54" fill="#8C6E4E" ${o(2.6)}/><rect x="-28" y="-18" width="56" height="38" fill="none" ${o(1.8)}/><path d="M-6,-2 Q-6,-14 0,-14 Q6,-14 6,-2" fill="none" ${o(2.4)}/><rect x="-9" y="-3" width="18" height="14" rx="2" fill="${TAN}" ${o(2)}/>`,
  notsitz: `<rect x="-34" y="-30" width="68" height="18" rx="4" fill="${RED}" ${o(2.6)}/><path d="M-30,-12 L-30,-4 M30,-12 L30,-4" ${o(3)}/><rect x="-36" y="-4" width="72" height="36" fill="${CARD}" ${o(2.6)}/><path d="M-36,8 L36,8" ${o(1.6)} stroke-dasharray="4 3"/><circle cx="0" cy="20" r="3" fill="${INK}"/>`,
};
const V_KIND = { schirm325: "schirm", regal326: "regal", waesche327: "waesche", heizung327: "heizung", notsitz327: "notsitz", regal328: "regal", schrank328: "schrank" };
const V_LOCK = (x, y) => `<path d="M${x - 5},${y} Q${x - 5},${y - 9} ${x},${y - 9} Q${x + 5},${y - 9} ${x + 5},${y}" fill="none" ${o(2)}/><rect x="${x - 7}" y="${y}" width="14" height="10" rx="2" fill="${INK}"/>`;
function vwrap(t, n) { const w = t.split(" "), out = [""]; for (const x of w) { if ((out.at(-1) + " " + x).trim().length > n) out.push(x); else out[out.length - 1] = (out.at(-1) + " " + x).trim(); } return out; }
export function verstecke(en, SPOTS, searched) {
  const D = defs();
  const L = (de, e) => (en ? e : de);
  // Plan oben: Wagen 325–328 mit Nummern
  const car = (x, w, lab, sub) => `<rect x="${x}" y="40" width="${w}" height="92" rx="10" fill="${CARD}" stroke="${INK}" stroke-width="3"/>${T(x + w / 2, 30, lab, 14, 700)}${T(x + w / 2, 147, sub, 10.5, 500, MUTED)}`;
  let map = `<g transform="translate(-140,0)">${car(178, 92, "325", L("Speisewagen", "Dining car"))}${car(278, 80, "326", L("Liegewagen", "Couchette car"))}${car(364, 236, "327", L("Schlafwagen", "Sleeping car"))}${car(608, 144, "328", L("Schlafwagen", "Sleeping car"))}`;
  for (let i = 0; i < 6; i++) map += `<rect x="${368 + i * 34}" y="48" width="32" height="50" fill="${PAPER}" ${o(1.6)}/>${T(384 + i * 34, 78, ["D1", "2", "3", "4", "5", "6"][i], 11, 700, MUTED)}`;
  map += `<path d="M366,108 L596,108" ${o(1.4)} stroke-dasharray="4 4"/>`;
  V_ORDER.forEach((k, i) => { const [x, y] = V_MAP[k]; map += `<circle cx="${x}" cy="${y}" r="11" fill="${RED}" ${o(2.2)}/>${T(x, y + 4.5, String(i + 1), 12, 700, PAPER)}`; });
  map += `</g>`;
  // Karten
  const cw = 160, ch = 232, cols = 4;
  let cards = "";
  V_ORDER.forEach((k, i) => {
    const s = SPOTS[k], cm = parseInt(s.innen), x = 10 + (i % cols) * (cw + 8), y = 166 + Math.floor(i / cols) * (ch + 10);
    const done = searched.includes(k), locked = !/^(offen|open)/i.test(s.zugang);
    const tapeW = Math.round(cm * 1.45);
    let c = `<g transform="translate(${x},${y})"><rect width="${cw}" height="${ch}" fill="${PAPER}" ${o(2.6)}/><circle cx="16" cy="16" r="11" fill="${RED}" ${o(2)}/>${T(16, 20.5, String(i + 1), 12, 700, PAPER)}`;
    c += `<g transform="translate(${cw / 2},62)">${V_ICON[V_KIND[k]]}</g>`;
    if (locked) c += V_LOCK(cw - 18, 22);
    // Maßband
    c += `<rect x="${(cw - tapeW) / 2}" y="108" width="${tapeW}" height="12" fill="#E9C84A" ${o(1.8)}/>${[...Array(Math.floor(cm / 10) + 1)].map((_, j) => `<path d="M${(cw - tapeW) / 2 + j * 14.5},108 L${(cw - tapeW) / 2 + j * 14.5},${j % 5 ? 113 : 116}" ${o(1)}/>`).join("")}${T(cw / 2, 135, s.innen, 13, 700)}`;
    c += vwrap(s.name, 24).map((ln, j) => T(cw / 2, 154 + j * 13, ln, 10.5, 600)).join("");
    c += vwrap(s.zugang, 28).map((ln, j) => T(cw / 2, 156 + 13 * vwrap(s.name, 24).length + j * 12, ln, 9.5, 500, MUTED)).join("");
    const note = done && k === "waesche327" ? L("Herr Kofler hat aufgesperrt", "Mr Kofler unlocked it") : "";
    if (done) c += `<g transform="translate(${cw / 2},70) rotate(-14)"><rect x="-66" y="-14" width="132" height="${note ? 40 : 28}" fill="#FFF8EA" fill-opacity=".8" stroke="${RED}" stroke-width="3"/>${T(0, 5, L("DURCHSUCHT · LEER", "SEARCHED · EMPTY"), 10.5, 800, RED)}${note ? T(0, 19, note, 9, 600, RED) : ""}</g>`;
    cards += c + `</g>`;
  });
  // Vergleich: Rolle 46 cm im selben Maßstab
  const rx = 10 + 3 * (cw + 8), ry = 166 + ch + 10;
  cards += `<g transform="translate(${rx},${ry})"><rect width="${cw}" height="${ch}" fill="#FFF8EA" stroke="${INK}" stroke-width="2.6" stroke-dasharray="6 4"/>${T(cw / 2, 30, L("Zum Vergleich", "For comparison"), 12, 700)}<rect x="${(cw - 67) / 2}" y="70" width="67" height="14" rx="7" fill="#D8C9A8" ${o(2)}/><ellipse cx="${(cw + 67) / 2}" cy="77" rx="4" ry="7" fill="${CARD}" ${o(1.6)}/>${T(cw / 2, 108, L("Rolle 46 cm", "Roll 46 cm"), 13, 700, RED)}${T(cw / 2, 126, L("gleicher Maßstab", "same scale"), 10, 500, MUTED)}</g>`;
  const H = ry + ch + 10;
  const svg = `<svg viewBox="0 0 ${10 + 4 * (cw + 8) + 2} ${H}" role="img" aria-label="${esc(L("Plan der Verstecke und Karten mit Innenmaß", "Plan of hiding places with inside measurements"))}" style="width:100%;display:block;background:${PAPER}">${D.svg}${map}${cards}</svg>`;
  return pic(svg, L("Mögliche Verstecke – antippen zum Vergrößern", "Possible hiding places – tap to enlarge"));
}

// Beweisfotos A (Blister) und B (Rahmen mit Fäden) – klein, nur Stimmung, der Text bleibt maßgeblich
const pic2 = (svg, alt) => `<figure class="gn-pic gn-small" tabindex="0" role="button" aria-label="${esc(alt)}">${svg}</figure>`;
export function blister(en) {
  const D = defs(), L = (d, e) => (en ? e : d);
  let cells = "";
  for (let i = 0; i < 10; i++) { const x = 92 + (i % 5) * 46, y = 74 + Math.floor(i / 5) * 58; cells += `<ellipse cx="${x}" cy="${y}" rx="16" ry="20" fill="#DCE3E8" ${o(2.2)}/><path d="M${x - 10},${y - 8} L${x + 2},${y + 12} M${x + 8},${y - 12} L${x - 4},${y + 4} M${x - 12},${y + 6} L${x + 10},${y - 2}" ${o(1.6)}/><path d="M${x - 16},${y} Q${x - 8},${y - 14} ${x},${y - 20}" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".8"/>`; }
  const svg = `<svg viewBox="0 0 420 270" role="img" aria-label="${L("Leerer Blister mit zehn herausgedrückten Tabletten, Apothekenetikett abgerissen", "Empty blister pack, all ten tablets pushed out, pharmacy label torn off")}" style="width:100%;display:block;background:#5E5A52">${D.svg}
<rect width="420" height="270" fill="${D.dots}" opacity=".25"/>
<g transform="rotate(-5 210 130)"><rect x="60" y="40" width="250" height="150" rx="8" fill="#C9CED4" ${o(3)}/><rect x="60" y="40" width="250" height="150" rx="8" fill="${D.hatch}" opacity=".08"/>${cells}
${T(185, 182, "SOMNARIL 10 mg", 13, 800, RED)}
<path d="M250,190 L310,190 L310,150 L296,160 L304,170 L288,176 L296,186 Z" fill="${PAPER}" ${o(2)}/>${T(298, 182, L("…theke", "…armacy"), 8.5, 600, MUTED)}</g>
<g transform="translate(330,210) rotate(8)"><rect x="-24" y="-30" width="48" height="56" fill="#F2D24A" ${o(2.6)}/>${T(0, 6, "A", 26, 800)}</g>
<rect x="20" y="236" width="220" height="16" fill="${PAPER}" ${o(2)}/>${[...Array(11)].map((_, i) => `<path d="M${20 + i * 22},236 L${20 + i * 22},${i % 5 ? 243 : 248}" ${o(1.4)}/>`).join("")}${T(250, 249, "10 cm", 11, 700, PAPER, "start")}</svg>`;
  return pic2(svg, L("Fundstück A – antippen zum Vergrößern", "Exhibit A – tap to enlarge"));
}
export function rahmen(en) {
  const D = defs(), L = (d, e) => (en ? e : d);
  let threads = "";
  for (let i = 0; i < 26; i++) { const t = i / 25, x = 98 + t * 224; threads += `<path d="M${x},88 q${(i % 3) - 1},7 ${(i % 2 ? 2 : -2)},${8 + (i % 4) * 2}" fill="none" stroke="#E7DCC4" stroke-width="1.6"/>`; }
  for (let i = 0; i < 18; i++) { const y = 92 + i * 8.6; threads += `<path d="M98,${y} q7,${(i % 3) - 1} ${9 + (i % 3) * 2},${i % 2 ? 2 : -1}" fill="none" stroke="#E7DCC4" stroke-width="1.6"/><path d="M322,${y} q-7,${(i % 3) - 1} ${-9 - (i % 3) * 2},${i % 2 ? 2 : -1}" fill="none" stroke="#E7DCC4" stroke-width="1.6"/>`; }
  const svg = `<svg viewBox="0 0 420 330" role="img" aria-label="${L("Rahmen mit Kopie der Lagune, am inneren Rand hängen Fäden einer alten Leinwand", "Frame with the copy of the lagoon; threads of an old canvas hang from the inner edge")}" style="width:100%;display:block;background:#2B2A27">${D.svg}
<rect x="70" y="60" width="280" height="200" fill="#9A6F2E" ${o(3.5)}/><rect x="70" y="60" width="280" height="200" fill="${D.hatch}" opacity=".18"/><rect x="88" y="78" width="244" height="164" fill="#6E4F22" ${o(2)}/>
<rect x="98" y="88" width="224" height="144" fill="#9FB3BC" ${o(2)}/><path d="M98,170 Q150,160 210,168 T322,164 L322,232 L98,232 Z" fill="#6F8791"/><path d="M98,150 Q160,140 220,148 T322,142" fill="none" stroke="#D9E2E6" stroke-width="5" opacity=".7"/><path d="M150,170 L150,120 M150,128 L170,138 L150,146" fill="none" ${o(2.4)}/><path d="M236,166 Q246,130 262,166" fill="#4A5F68" ${o(2)}/>
${threads}
<path d="M352,112 L392,84" stroke="${RED}" stroke-width="3"/><circle cx="324" cy="118" r="16" fill="none" stroke="${RED}" stroke-width="3"/>${T(392, 76, L("Fäden", "threads"), 12, 700, RED, "end")}
${T(210, 290, L("„Lagune im Nebel“ · Rahmen 46 × 61 cm", "“Lagoon in the Mist” · frame 46 × 61 cm"), 12.5, 700, PAPER)}
<g transform="translate(46,40) rotate(-8)"><rect x="-22" y="-26" width="44" height="50" fill="#F2D24A" ${o(2.6)}/>${T(0, 8, "B", 24, 800)}</g></svg>`;
  return pic2(svg, L("Der Rahmen – antippen zum Vergrößern", "The frame – tap to enlarge"));
}
