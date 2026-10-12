// Rückblende (animiertes Finale) Solo 002 „Applaus für einen Toten“ – 11.10.2026.
// Sechs Szenen aus den Spieldaten der Runde: Täter, vergifteter Gegenstand (Variante), Tatfenster, Spind und Code.
// Bewegung über die rb-*-Klassen des Players (site/spiel/rueckblende.js).
// Kino-Look (11.10.2026, lib/art/cine.js): roter Samt, Goldornamente, Scheinwerferkegel mit Staub, Hinterbühne mit Arbeitslicht,
// Garderobe mit Schminkspiegel-Glühbirnen. Inhalt (sub/sfx/dur, Fakten) unverändert – nur die Zeichnung ist neu.
// Festgehaltene Korrekturen (nicht zurückdrehen):
// - Gegenstand „bonbon“ ist ein HONIGGLAS mit Löffel (Deckel liegt daneben), Adler nimmt einen Löffel Honig – keine Bonbons zeichnen.
// - Szene 2: Täter schleicht zu Adlers Garderobe / zum Requisitentisch / ins Intendanzbüro (Ziel je Gegenstand im Bild);
//   Schild „PAUSE“ nur bei Sekt/Honig (Tatfenster in der Pause), bei Pokal/Wasser „BITTE RUHE“ (Vorstellung läuft). Sekt: auf der Bühne ohne Glas.
// - Szene 3: Tropfen aus braunem Fläschchen in den Gegenstand. Szene 5: Spind mit Nummer und Zahlencode, Fläschchen verschwindet darin.
// - Schlusskarte: wrap2 für lange Werte (nichts abgeschnitten); EN-Untertitel mit lc() nach dem Doppelpunkt.
// - Richard Adler als Prospero (Sternenmantel, grauer Bart, Stab) bleibt erkennbar.
import { INK, PAPER, RED, CARD, MUTED, SKIN, o, T, defs, face, esc } from "./gn.js";
import { cine, SERIF, endcard } from "./cine.js";

const W = 640, H = 360, NB = "#14101E", GOLD = "#F2C14E", CURT = "#8E1F2E";
// Szene: eigene cine-Instanz (eindeutige IDs), defs vor dem Inhalt
const scene = (inner) => { const C = cine(W, H); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${C.wrap(inner)}</svg>`; };
const torso = (fill, shade, fem) => { const w = fem ? 26 : 33, b = fem ? 36 : 42; return `<path d="M-${w},-118 Q0,-126 ${w},-118 L${b},-40 L-${b},-40 Z" fill="${fill}" ${o()}/><path d="M8,-123 Q${w},-118 ${w},-118 L${b},-40 L14,-40 Q18,-80 8,-123 Z" fill="${shade}" opacity=".85"/><path d="M-${w},-116 L-${w + 13},-60 M${w},-116 L${w + 13},-60" fill="none" ${o(5)}/>`; };
// Figuren (Brustbild, Fuß bei y=0) – nur für die Rückblende
const FIG = {
  vera: (r) => `${torso("#7FA6C9", "#5E86A8", true)}<path d="M-26,-118 Q0,-104 26,-118" fill="none" stroke="${PAPER}" stroke-width="4"/>${face(r, true)}<path d="M-22,-150 Q-30,-192 0,-192 Q30,-192 22,-150 L26,-110 Q18,-112 16,-150 Q12,-172 0,-175 Q-12,-172 -16,-150 Q-18,-112 -26,-110 Z" fill="#A2472A" ${o(2.2)}/><circle cx="-17" cy="-170" r="5" fill="#F4E3A1" ${o(1.4)}/><circle cx="-17" cy="-170" r="2" fill="${GOLD}"/>`,
  tobias: (r) => `${torso("#22242A", "#14151A")}<path d="M-14,-122 L14,-122 L12,-112 L-12,-112 Z" fill="#22242A" ${o(2)}/>${face(r)}<path d="M-19,-140 Q-18,-122 0,-120 Q18,-122 19,-140 Q12,-130 0,-131 Q-12,-130 -19,-140 Z" fill="#3B2E24" opacity=".85"/><path d="M-21,-158 Q-26,-180 -12,-188 Q-4,-196 6,-190 Q18,-194 22,-180 Q25,-168 21,-156 Q16,-166 4,-170 Q-8,-170 -21,-158 Z" fill="#2E241C" ${o(2)}/>${[-14, -6, 2, 10, 17].map((x, i) => `<circle cx="${x}" cy="${-184 + (i % 2) * 4}" r="4" fill="#2E241C" ${o(1.2)}/>`).join("")}`,
  nina: (r) => `${torso("#2B2D33", "#1A1B20", true)}<path d="M-10,-122 Q0,-112 10,-122" fill="none" ${o(2)}/>${face(r, true)}<path d="M-21,-150 Q-25,-188 0,-189 Q25,-188 21,-150 Q14,-170 0,-173 Q-14,-170 -21,-150 Z" fill="#C9A15A" ${o(2.2)}/><path d="M18,-176 Q34,-170 30,-140" fill="none" stroke="#C9A15A" stroke-width="8" stroke-linecap="round"/><path d="M-24,-176 Q0,-200 24,-176" fill="none" ${o(4)}/><rect x="-28" y="-162" width="9" height="16" rx="3" fill="${INK}"/><path d="M-24,-148 Q-20,-134 -8,-134" fill="none" ${o(2.4)}/><circle cx="-7" cy="-134" r="2.6" fill="${RED}"/>`,
  paul: (r) => `${torso("#6B5B3E", "#4B3F2A")}<path d="M-12,-122 L0,-100 L12,-122" fill="${PAPER}" ${o(1.6)}/><path d="M-20,-120 Q-14,-80 -18,-50 M20,-120 Q14,-80 18,-50" fill="none" stroke="${GOLD}" stroke-width="6"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-23 + (i % 2)},${-110 + i * 10} l6,0" stroke="${INK}" stroke-width="1.4"/>`).join("")}${face(r)}<circle cx="-8" cy="-156" r="6" fill="none" ${o(2.4)}/><circle cx="9" cy="-156" r="6" fill="none" ${o(2.4)}/><path d="M-2,-157 L3,-157" ${o(2)}/><path d="M-21,-150 Q-24,-168 -15,-172 M21,-150 Q24,-168 15,-172" fill="none" stroke="#C9C4BA" stroke-width="7" stroke-linecap="round"/>`,
  felix: (r) => `${torso("#59616B", "#3F454D")}<rect x="-34" y="-62" width="68" height="12" fill="#5C4027" ${o(2)}/><rect x="-24" y="-60" width="10" height="16" fill="#8A877F" ${o(1.4)}/><rect x="12" y="-60" width="8" height="18" fill="${GOLD}" ${o(1.4)}/>${face(r)}<path d="M-18,-142 Q-16,-124 0,-122 Q16,-124 18,-142 Q10,-132 0,-133 Q-10,-132 -18,-142 Z" fill="#6A4A2C" opacity=".9"/><path d="M-22,-160 Q-22,-188 0,-188 Q22,-188 22,-160 Z" fill="${RED}" ${o(2)}/><path d="M-22,-162 L-40,-160 L-22,-156 Z" fill="${RED}" ${o(2)}/>`,
};
const fig = (k, x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">${FIG[k](RED)}</g>`;
// Richard Adler als Prospero: Sternenmantel, langer grauer Bart, Stab (Mantel mit Faltenwurf und Goldsaum)
const adler = (C, x, y, s, prop = "") => {
  const cloak = C.lin([[0, "#2E3F74"], [0.55, "#23305A"], [1, "#121A36"]], 0, 0, 1, 0.2);
  return `<g transform="translate(${x},${y}) scale(${s})">${C.shadow(0, 2, 70, 10, 0.6)}<path d="M-52,0 L-40,-112 Q0,-130 40,-112 L52,0 Z" fill="${cloak}" ${o(3)}/><path d="M-20,-110 Q-26,-60 -30,0 M14,-112 Q22,-56 24,0" fill="none" stroke="#0E1530" stroke-width="3" opacity=".7"/><path d="M-52,0 L52,0" stroke="${GOLD}" stroke-width="4"/><path d="M-40,-112 Q0,-130 40,-112 L36,-100 Q0,-116 -36,-100 Z" fill="#3A2F6E" ${o(2)}/>${[[-24, -80], [10, -60], [-8, -30], [26, -96], [30, -24], [-36, -14], [-30, -52]].map(([a, b]) => `<path d="M${a},${b} l3,6 l-6,0 Z M${a - 3},${b + 2} l6,0 l-3,6 Z" fill="${GOLD}"/>`).join("")}<path d="M60,4 L54,-210" stroke="#6E4F22" stroke-width="7" stroke-linecap="round"/><path d="M58,-12 L53,-204" stroke="#A9834A" stroke-width="2" opacity=".7"/><circle cx="54" cy="-212" r="6" fill="${GOLD}" ${o(2)}/>${face(RED)}<path d="M-18,-142 Q-22,-96 0,-82 Q22,-96 18,-142 Q8,-128 0,-130 Q-8,-128 -18,-142 Z" fill="#D9D4CA" ${o(2)}/><path d="M-6,-120 Q-4,-100 0,-90 M6,-120 Q4,-100 2,-92" fill="none" stroke="#A9A49A" stroke-width="1.6"/><path d="M-22,-160 Q-24,-190 0,-190 Q24,-190 22,-160 Q12,-176 0,-174 Q-12,-176 -22,-160 Z" fill="#D9D4CA" ${o(2)}/>${prop}</g>`;
};
// Gegenstände (Mitte x=320, Standfläche y=272 vor translate)
const glassFill = (C) => C.lin([[0, "#FFFFFF", 0.32], [0.5, "#E9E2D0", 0.12], [1, "#FFFFFF", 0.28]], 0, 0, 1, 0);
const ITEM = {
  pokal: (C) => `<path d="M286,140 Q286,222 320,232 Q354,222 354,140 Z" fill="${C.lin([[0, "#FFE7A0"], [0.45, GOLD], [1, "#9A6E1E"]], 0, 0, 1, 0)}" ${o(3)}/><path d="M292,150 Q320,160 348,150 L346,170 Q320,178 294,170 Z" fill="#5E2A6E"/><path d="M296,150 Q300,200 316,222" fill="none" stroke="#FFF6D0" stroke-width="3" opacity=".7"/><path d="M290,190 L350,190" stroke="#9A6E1E" stroke-width="2"/><rect x="314" y="232" width="12" height="40" fill="${GOLD}" ${o(2.5)}/><path d="M290,272 L350,272 L340,290 L300,290 Z" fill="${C.lin([[0, "#FFE7A0"], [1, "#9A6E1E"]], 0, 0, 1, 0)}" ${o(3)}/>`,
  sekt: (C) => `<path d="M304,112 L336,112 L332,200 Q320,214 308,200 Z" fill="${glassFill(C)}" ${o(2.5)}/><path d="M307,140 L333,140 L331,198 Q320,208 309,198 Z" fill="#E8C76A" opacity=".8"/><path d="M309,118 L311,196" stroke="#FFFFFF" stroke-width="2.5" opacity=".6"/><path d="M320,210 L320,272" ${o(3)}/><path d="M296,280 Q320,268 344,280" fill="none" ${o(3)}/>${[0, 1, 2, 3].map((i) => `<circle cx="${314 + (i % 2) * 10}" cy="${190 - i * 14}" r="2" fill="#FFF8DD"/>`).join("")}<path d="M310,170 L330,170" stroke="${PAPER}" stroke-width="1.4" stroke-dasharray="2 2"/>`,
  // Honigglas mit Löffel, Deckel liegt daneben, Etikett mit Wabe
  bonbon: (C) => `<rect x="282" y="168" width="76" height="104" rx="14" fill="${glassFill(C)}" ${o(3)}/><rect x="285" y="188" width="70" height="81" rx="11" fill="${C.lin([[0, "#F2B640"], [1, "#B8680E"]])}" opacity=".92"/><path d="M288,196 Q320,204 352,196" fill="none" stroke="#F6D27A" stroke-width="3" opacity=".8"/><path d="M290,176 L292,262" stroke="#FFFFFF" stroke-width="3" opacity=".5"/><rect x="278" y="160" width="84" height="10" rx="3" fill="#E9E2D0" fill-opacity=".4" ${o(2.4)}/><g transform="translate(418,266)"><ellipse cx="0" cy="0" rx="36" ry="9" fill="#7A5634" opacity=".5"/><rect x="-33" y="-12" width="66" height="12" rx="3" fill="${C.lin([[0, "#E0C27A"], [1, "#9A7A3E"]])}" ${o(2.5)}/><path d="M-26,-6 L26,-6" stroke="#FFF1C0" stroke-width="1.5" opacity=".7"/></g><path d="M338,206 L376,112" stroke="#B8BCC2" stroke-width="6" stroke-linecap="round"/><path d="M340,200 L374,116" stroke="#FFFFFF" stroke-width="1.6" opacity=".7"/><ellipse cx="338" cy="210" rx="9" ry="6" fill="#B8BCC2" ${o(1.6)}/><rect x="294" y="224" width="52" height="22" rx="3" fill="${PAPER}" ${o(1.4)}/><path d="M320,229 l5,3 l0,6 l-5,3 l-5,-3 l0,-6 Z" fill="#E0A030" ${o(1.2)}/>`,
  wasser: (C) => `<path d="M296,140 L344,140 L338,276 L302,276 Z" fill="${glassFill(C)}" ${o(3)}/><path d="M298,176 L342,176 L338,274 L302,274 Z" fill="${C.lin([[0, "#BFDCEA", 0.75], [1, "#6E9CB6", 0.6]])}"/><path d="M302,146 L306,270" stroke="#FFFFFF" stroke-width="3" opacity=".55"/><ellipse cx="320" cy="176" rx="22" ry="3" fill="#E6F3FA" opacity=".6"/>`,
};
const LOCKERS = [1, 3, 5, 7, 9, 12, 15];
// braunes Fläschchen mit Totenkopf-Etikett (Mitte 0,0)
const bottle = (s = 1) => `<g transform="scale(${s})"><rect x="-12" y="-34" width="24" height="40" rx="5" fill="#6B3E1E" ${o(2.5)}/><path d="M-7,-30 L-7,0" stroke="#C98A4E" stroke-width="2.5" opacity=".7"/><rect x="-6" y="-46" width="12" height="13" fill="${INK}"/><rect x="-10" y="-22" width="20" height="14" fill="${PAPER}" ${o(1.2)}/>${T(0, -12, "☠", 10, 700, RED)}</g>`;
// roter Samtvorhang (Faltenwurf) in einem Rechteck
const velvet = (C, x, y, w, h, folds = 6) => { const g = C.lin([[0, "#5E1520"], [0.25, "#B02A3A"], [0.5, "#6E1824"], [0.75, "#A82636"], [1, "#5E1520"]], 0, 0, 1, 0); const fw = w / folds; return `${[...Array(folds)].map((_, i) => `<rect x="${(x + i * fw).toFixed(1)}" y="${y}" width="${(fw + 0.6).toFixed(1)}" height="${h}" fill="${g}"/>`).join("")}`; };
const goldRope = (x1, y1, x2, y2) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="#7A5A1E" stroke-width="7"/><path d="M${x1},${y1} L${x2},${y2}" stroke="${GOLD}" stroke-width="3" stroke-dasharray="5 4"/>`;

const lc = (x) => String(x).charAt(0).toLowerCase() + String(x).slice(1);
const wrap2 = (t, n = 30) => { t = String(t); if (t.length <= n) return [t, ""]; const i = t.lastIndexOf(" ", n); const k = i > 8 ? i : n; const r = t.slice(k).trim(); return [t.slice(0, k).trim(), r.length > n ? r.slice(0, n - 1) + "…" : r]; };
export function rueckblende(c, v, { en = false, names, items, roles, spind, code, item, win }) {
  const L = (d, e) => (en ? e : d), name = names[c];
  const where = { pokal: L("zum Requisitentisch rechts", "to the props table, right"), wasser: L("zum Requisitentisch links", "to the props table, left"), sekt: L("ins Intendanzbüro", "to the director’s office"), bonbon: L("zu Adlers Garderobe", "to Adler’s dressing room") }[item];
  const drink = { pokal: L("Prospero trinkt aus dem Pokal.", "Prospero drinks from the goblet."), sekt: L("In der Pause stößt Adler mit der Intendantin an.", "At the interval Adler raises a glass with the director."), bonbon: L("Vor dem zweiten Teil nimmt Adler einen Löffel Honig – wie immer.", "Before the second half Adler takes a spoonful of honey – as always."), wasser: L("Im großen Monolog trinkt Prospero das Glas aus.", "In the great monologue Prospero drains the glass.") }[item];
  const props = item === "pokal" || item === "wasser";
  const scenes = [];
  // 1 Titel: Theater am Kanal bei Nacht, Fassade mit Säulen und Goldornament, erleuchtete Bogenfenster, Spiegelung im Kanal
  scenes.push({ dur: 5, cam: "in", sfx: [[0.3, "sting"]], sub: L("Theater am Kanal. Premiere: „Der Sturm“.", "Theater am Kanal. Opening night: “The Tempest”."), svg: scene((C) => {
    const stone = C.lin([[0, "#5A4A44"], [1, "#2A2120"]]), win = C.lin([[0, "#FFE9A8"], [0.6, "#F2B04E"], [1, "#B8642A"]]);
    const cols = [0, 1, 2, 3, 4].map((i) => 318 + i * 70);
    return `${C.sky("#05070F", "#1E2440", "#0D1226")}${C.stars(26, 110)}<circle cx="96" cy="58" r="14" fill="#F3EED8"/>${C.light(96, 58, 70, "#DDE6FF", 0.35)}
<path d="M0,262 L0,190 L40,190 L40,160 L92,160 L92,200 L150,200 L150,150 L196,150 L196,210 L262,210 L262,262 Z" fill="#0B0E1A"/>${[[54, 172], [70, 172], [164, 166], [170, 190], [214, 222]].map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="10" fill="#F2C14E" opacity=".55"/>`).join("")}
<rect x="296" y="96" width="330" height="166" fill="${stone}" ${o(3)}/><path d="M284,96 L461,46 L638,96 Z" fill="#3A2E2A" ${o(3)}/><path d="M318,90 L461,58 L604,90" fill="none" stroke="${GOLD}" stroke-width="2" opacity=".8"/><circle cx="461" cy="78" r="9" fill="none" stroke="${GOLD}" stroke-width="2.4"/><path d="M455,78 L467,78 M461,72 L461,84" stroke="${GOLD}" stroke-width="1.6"/>
<rect x="290" y="96" width="342" height="8" fill="#6E5A3A"/>${[...Array(17)].map((_, i) => `<circle cx="${300 + i * 20}" cy="100" r="2" fill="${GOLD}" opacity=".85"/>`).join("")}
${cols.map((x, i) => (i < 4 ? `<path d="M${x + 14},262 L${x + 14},170 Q${x + 35},146 ${x + 56},170 L${x + 56},262 Z" fill="${win}" ${o(2.5)}/><path d="M${x + 35},158 L${x + 35},262 M${x + 14},206 L${x + 56},206" stroke="#7A4A1E" stroke-width="2"/>` : "")).join("")}
${cols.map((x) => `<rect x="${x - 6}" y="140" width="14" height="122" fill="${C.lin([[0, "#E6D9BE"], [1, "#7A6A54"]], 0, 0, 1, 0)}" ${o(1.6)}/><rect x="${x - 9}" y="134" width="20" height="7" fill="#C9B894" ${o(1.4)}/>`).join("")}
${C.light(461, 214, 210, "#FFC060", 0.32)}
<g class="rb-glow"><rect x="360" y="108" width="202" height="28" fill="${CURT}" ${o(2.5)}/>${T(461, 127, L("DER STURM · PREMIERE", "THE TEMPEST · OPENING"), 13, 800, GOLD)}</g>${[...Array(12)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 4) * 0.3}s" cx="${364 + i * 17.6}" cy="${i % 2 ? 140 : 104}" r="1.8" fill="#FFF1C0"/>`).join("")}
<g><path d="M268,262 L268,196" stroke="#1A1A20" stroke-width="4"/><path d="M262,198 L274,198 L271,186 L265,186 Z" fill="#2A2A30"/><circle class="rb-flicker" cx="268" cy="192" r="4" fill="#FFE2A0"/>${C.light(268, 192, 46, "#FFD27A", 0.5, "rb-flicker")}</g>
<rect y="262" width="${W}" height="98" fill="${C.lin([[0, "#16203A"], [1, "#05070F"]])}"/><path d="M280,262 L${W},262" stroke="#3A3F4E" stroke-width="3"/>${[...Array(9)].map((_, i) => `<path d="M${i * 42 + 296},262 L${i * 42 + 296},252" stroke="#3A3F4E" stroke-width="2.4"/>`).join("")}<path d="M280,252 L${W},252" stroke="#3A3F4E" stroke-width="1.6"/>
${[518, 580].map((x, i) => `<rect class="rb-streak" style="--d:${i * 0.4}s" x="${x}" y="${274 + i * 10}" width="30" height="3" fill="${GOLD}" opacity=".55"/><rect class="rb-streak" style="--d:${0.5 + i * 0.4}s" x="${x + 8}" y="${294 + i * 8}" width="18" height="2.4" fill="${GOLD}" opacity=".35"/>`).join("")}
${C.fog(276, 0.16, "#8E9AB8")}
<rect width="380" height="${H}" fill="${C.lin([[0, "#000", 0.6], [1, "#000", 0]], 0, 0, 1, 0)}"/>
${C.title(L("APPLAUS FÜR EINEN TOTEN", "APPLAUSE FOR A DEAD MAN"), L("Was wirklich geschah", "What really happened"), "", 34, 300)}
${C.vignette(0.55)}`;
  }) });
  // 2 Hinter der Bühne: Gang mit Arbeitslicht, Pausenschild, Ziel je Gegenstand (Garderobe 1 / Intendanz / Seitengasse mit Requisitentisch)
  scenes.push({ dur: 6.5, cam: "right", sfx: [[0.6, "step"], [1.0, "step"], [1.4, "step"], [2.6, "sting"]], sub: L(`${win[0]} bis ${win[1]} – ${name} schleicht ${where}.`, `${win[0]} to ${win[1]} – ${name} slips ${where}.`), svg: scene((C) => {
    let goal;
    if (item === "bonbon" || item === "sekt") {
      const gard = item === "bonbon";
      goal = `<rect x="452" y="74" width="132" height="228" fill="#1A1216" ${o(3)}/><rect x="460" y="82" width="116" height="220" fill="${C.lin([[0, gard ? "#5A3A2A" : "#4A3A30"], [1, "#2A1C16"]], 0, 0, 1, 0)}" ${o(2)}/>${[0, 1].map((k) => `<rect x="472" y="${100 + k * 100}" width="92" height="80" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2.4"/>`).join("")}
${gard ? `<path d="M518,104 l6,13 l14,1 l-11,9 l4,14 l-13,-8 l-13,8 l4,-14 l-11,-9 l14,-1 Z" fill="${GOLD}" ${o(1.6)}/><rect x="480" y="150" width="76" height="34" rx="2" fill="#E9DCC0" ${o(1.6)}/>${T(518, 164, L("GARDEROBE 1", "DRESSING ROOM 1"), en ? 8 : 9.5, 800, INK)}${T(518, 178, "R. ADLER", 10, 800, RED)}`
    : `<rect x="476" y="100" width="84" height="60" fill="${C.lin([[0, "#FFE2A0", 0.9], [1, "#C98A3A", 0.7]])}" ${o(2)}/>${C.light(518, 130, 70, "#FFD27A", 0.4, "rb-flicker")}<rect x="478" y="172" width="80" height="24" rx="2" fill="#E9DCC0" ${o(1.6)}/>${T(518, 189, L("INTENDANZ", "DIRECTOR"), 11, 800, INK)}`}
<circle cx="568" cy="212" r="5" fill="${GOLD}" ${o(1.4)}/><path d="M462,302 L574,302" stroke="#FFD27A" stroke-width="3" opacity=".9"/>${C.light(518, 304, 80, "#FFC060", 0.45)}`;
    } else {
      goal = `${velvet(C, 470, 30, 170, 272, 5)}<path d="M470,30 L470,302" stroke="#3A0C12" stroke-width="3"/><rect x="470" y="30" width="170" height="10" fill="#7A5A1E"/>${C.cone(520, 34, 16, 150, 300, "#9FB6E0", 0.3)}<path d="M512,24 L528,24 L524,36 L516,36 Z" fill="#2A2A30"/>
<rect x="430" y="248" width="150" height="10" fill="#4A3524" ${o(2)}/><path d="M440,258 L440,302 M570,258 L570,302" ${o(4)}/><rect x="438" y="250" width="56" height="7" fill="#C9C2B4"/>${T(466, 256, "PROSPERO", 6.5, 800, INK)}
${item === "pokal" ? `<path d="M508,214 Q508,236 518,240 Q528,236 528,214 Z" fill="${GOLD}" ${o(2)}/><path d="M518,240 L518,248" ${o(3)} stroke="${GOLD}"/>` : `<path d="M508,218 L526,218 L524,248 L510,248 Z" fill="#E9E2D0" fill-opacity=".45" ${o(2)}/><path d="M538,248 L536,226 Q534,214 546,210 Q558,214 556,226 L554,248 Z" fill="#E9E2D0" fill-opacity=".35" ${o(2)}/>`}
<rect x="456" y="60" width="112" height="22" rx="2" fill="#1A1A20" ${o(1.4, "#5E5A52")}/>${T(512, 75, item === "pokal" ? L("REQUISITE · RECHTS", "PROPS · RIGHT") : L("REQUISITE · LINKS", "PROPS · LEFT"), 9.5, 800, "#C9C2B4")}`;
    }
    const cx = 300, cy = 392, s = 1.22;
    return `<rect width="${W}" height="${H}" fill="${C.lin([[0, "#2E2228"], [1, "#120D12"]])}"/>${[...Array(9)].map((_, i) => `<path d="M0,${36 + i * 30} L${W},${36 + i * 30}" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`).join("")}
<path d="M0,28 L${W},28 M0,36 L${W},36" stroke="#3A3036" stroke-width="5"/><path d="M0,44 Q120,52 250,40" fill="none" stroke="#111" stroke-width="2"/>
<g transform="translate(38,74)"><rect x="0" y="0" width="128" height="70" fill="${PAPER}" ${o(2.5)}/><rect x="0" y="0" width="128" height="70" fill="${C.lin([[0, "#FFF", 0.25], [1, "#000", 0.15]])}"/>${item === "sekt" || item === "bonbon" ? T(64, 43, L("PAUSE", "INTERVAL"), 20, 900, RED) : T(64, 42, L("BITTE RUHE", "QUIET PLEASE"), 15, 900, RED)}<circle class="rb-glow" cx="114" cy="12" r="4" fill="${RED}"/></g>${C.light(102, 109, 90, "#FF8A6A", 0.18)}
${goal}
<path d="M250,0 L250,40" stroke="#111" stroke-width="2"/><path d="M240,40 L260,40 L257,56 L243,56 Z" fill="#2A2A30" ${o(1.4, "#555")}/><circle cx="250" cy="58" r="6" fill="#FFF1C8"/>${C.cone(250, 56, 22, 280, 312, "#FFE2A0", 0.3, "rb-flicker")}${C.light(250, 60, 70, "#FFE2A0", 0.55)}
${C.floor(302, "#3A2E26", "#0E0A08")}<path d="M120,320 l26,0 M380,318 l26,0" stroke="#E9D78A" stroke-width="3" opacity=".6"/>${C.light(250, 314, 140, "#FFD27A", 0.18)}
${C.dust(150, 80, 200, 220, 16)}
${C.shadow(cx + 30, 334, 80, 9, 0.55)}
<g class="rb-walkin" style="--from:-300px;--wd:2.6s;--d:.2s"><g class="rb-bob" style="--d:.1s">${fig(c, cx, cy, s)}<g transform="translate(${cx + 58},${cy - 84}) rotate(8)">${bottle(0.8)}</g></g></g>
<rect width="70" height="${H}" fill="${C.lin([[0, "#000", 0.85], [1, "#000", 0]], 0, 0, 1, 0)}"/>
${C.tint("#C8803A", 0.14)}
${C.time(`${win[0]}–${win[1]}`)}
${C.vignette(0.6)}`;
  }) });
  // 3 Die Tropfen: Nahaufnahme am Ort des Gegenstands
  scenes.push({ dur: 6.5, cam: "in", sfx: [[1.7, "plop"], [2.3, "plop"], [2.9, "plop"]], sub: L(`Ein paar Tropfen Fingerhut: ${items[item]}.`, `A few drops of foxglove: ${lc(items[item])}.`), svg: scene((C) => {
    let bg, surf, extra = "", tint = "#C8803A";
    if (item === "bonbon") {
      // Garderobe: Schminkspiegel mit Glühbirnen
      const bulbs = [];
      for (let i = 0; i < 8; i++) bulbs.push([150 + i * 48.5, 34]);
      for (let i = 1; i < 5; i++) { bulbs.push([140, 34 + i * 44]); bulbs.push([500, 34 + i * 44]); }
      bg = `<rect width="${W}" height="${H}" fill="${C.lin([[0, "#4A3428"], [1, "#1E140F"]])}"/>${[...Array(12)].map((_, i) => `<path d="M${i * 56},0 L${i * 56},290" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`).join("")}
<rect x="140" y="34" width="360" height="226" fill="#2A1E1A" ${o(3)}/><rect x="156" y="48" width="328" height="206" fill="${C.lin([[0, "#5C6670"], [0.5, "#2E343C"], [1, "#1C2026"]], 0, 0, 1, 1)}"/><path d="M180,60 L250,60 L170,240 L156,240 L156,110 Z" fill="#FFF" opacity=".07"/><path d="M420,48 L470,48 L380,254 L340,254 Z" fill="#FFF" opacity=".05"/>
<g transform="translate(410,250)" opacity=".35"><path d="M-30,0 Q-32,-60 -20,-80 Q0,-94 20,-80 Q32,-60 30,0 Z" fill="#23305A"/><ellipse cx="0" cy="-104" rx="18" ry="22" fill="#D9D4CA"/></g>
${bulbs.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="9" fill="#FFF4D6" ${o(1.6, "#8A6A3A")}/><circle class="rb-flicker" style="--d:${(i % 5) * 0.37}s" cx="${x}" cy="${y}" r="5" fill="#FFFFFF"/>`).join("")}
${C.light(320, 120, 260, "#FFD99A", 0.35)}`;
      surf = `<rect x="60" y="290" width="520" height="20" fill="${C.lin([[0, "#9A7048"], [1, "#6A4A2C"]])}" ${o(3)}/><rect x="60" y="310" width="520" height="50" fill="#3E2A18" ${o(2)}/>`;
      extra = `<g transform="translate(190,286)"><rect x="-26" y="-8" width="52" height="8" rx="3" fill="#2A2A30" ${o(1.6)}/><circle cx="-12" cy="-12" r="7" fill="#E8C0A8" ${o(1.4)}/></g><g transform="translate(470,288) rotate(-12)"><rect x="-40" y="-5" width="54" height="6" rx="3" fill="#6B4A2C" ${o(1.4)}/><path d="M14,-6 Q28,-2 14,2 Z" fill="#2A2018"/></g>`;
    } else if (item === "sekt") {
      // Intendanzbüro: Holzvertäfelung, Plakat, Schreibtischlampe, Sektflasche und zweites Glas
      tint = "#D08A3A";
      bg = `${C.wood(0, 0, W, 290, "#5A3A24", "#2A1A10", true)}<g transform="translate(46,0)"><rect x="404" y="40" width="150" height="196" fill="#E9DCC0" ${o(3, "#C9A15A")}/><rect x="414" y="50" width="130" height="176" fill="${C.lin([[0, "#1E2A4A"], [1, "#0B1022"]])}"/><path d="M414,190 Q450,170 480,190 Q510,206 544,186 L544,226 L414,226 Z" fill="#2E4A6E"/><path d="M500,70 L486,110 L498,110 L484,150" fill="none" stroke="${GOLD}" stroke-width="2.4"/>${T(479, 214, L("DER STURM", "THE TEMPEST"), 13, 800, PAPER).replace("IBM Plex Sans, Arial, sans-serif", SERIF)}</g>
<g transform="translate(140,290)"><path d="M-30,0 L30,0 L20,-8 L-20,-8 Z" fill="#1E3A2A" ${o(2)}/><path d="M0,-8 L0,-110" stroke="#B8902E" stroke-width="5"/><path d="M-46,-110 L46,-110 L36,-140 L-36,-140 Z" fill="#1E5A3A" ${o(2.5)}/></g>${C.cone(140, 112, 90, 260, 290, "#FFE2A0", 0.32, "rb-flicker")}${C.light(140, 140, 160, "#FFD27A", 0.4)}`;
      surf = `<rect x="40" y="290" width="560" height="20" fill="${C.lin([[0, "#7A4A2C"], [1, "#4A2A18"]])}" ${o(3)}/><rect x="40" y="310" width="560" height="50" fill="#2A180E" ${o(2)}/>`;
      extra = `<g transform="translate(238,0)"><path d="M-14,288 L-14,200 Q-14,180 -6,170 L-6,140 L6,140 L6,170 Q14,180 14,200 L14,288 Z" fill="${C.lin([[0, "#1E3A24"], [0.4, "#3E6A44"], [1, "#0E1E12"]], 0, 0, 1, 0)}" ${o(2.5)}/><rect x="-7" y="132" width="14" height="14" fill="${GOLD}" ${o(1.4)}/><rect x="-13" y="214" width="26" height="30" fill="${PAPER}" ${o(1.2)}/></g><g transform="translate(420,0)"><path d="M-12,190 L12,190 L9,246 Q0,254 -9,246 Z" fill="${glassFill(C)}" ${o(2)}/><path d="M0,252 L0,286 M-14,290 Q0,282 14,290" fill="none" ${o(2.4)}/></g>`;
    } else {
      // dunkle Seitengasse: Samtvorhang, blaues Arbeitslicht, Requisitentisch mit Klebeband-Beschriftung
      tint = "#3A5A8A";
      bg = `<rect width="${W}" height="${H}" fill="${C.lin([[0, "#16141C"], [1, "#07060A"]])}"/>${velvet(C, item === "pokal" ? 0 : 500, 0, 140, 290, 4)}<rect x="${item === "pokal" ? 0 : 500}" y="0" width="140" height="290" fill="#000" opacity=".25"/>
<path d="M${item === "pokal" ? 500 : 20},0 L${item === "pokal" ? 500 : 20},290 M${item === "pokal" ? 560 : 80},0 L${item === "pokal" ? 560 : 80},290" stroke="#2A2A30" stroke-width="5"/>${[0, 1, 2, 3, 4].map((k) => `<path d="M${item === "pokal" ? 500 : 20},${40 + k * 50} L${item === "pokal" ? 560 : 80},${40 + k * 50}" stroke="#2A2A30" stroke-width="3"/>`).join("")}
<path d="M312,0 L312,30" stroke="#111" stroke-width="2"/><path d="M300,30 L324,30 L320,44 L304,44 Z" fill="#2A2A30"/>${C.cone(312, 42, 24, 330, 292, "#AFC4EA", 0.32)}${C.light(312, 46, 60, "#C9D8F6", 0.5)}`;
      surf = `<rect x="120" y="290" width="400" height="20" fill="${C.lin([[0, "#3A2E26"], [1, "#22180F"]])}" ${o(3)}/><rect x="120" y="310" width="400" height="50" fill="#140E0A" ${o(2)}/><rect x="140" y="294" width="88" height="12" fill="#C9C2B4" transform="rotate(-1 184 300)"/>${T(184, 304, "PROSPERO", 9, 800, INK)}`;
      if (item === "wasser") extra = `<g transform="translate(212,0)"><path d="M-22,288 L-18,230 Q-24,214 -10,196 L-8,176 L8,176 L10,196 Q24,214 18,230 L22,288 Z" fill="${glassFill(C)}" ${o(2.5)}/><path d="M-19,236 L19,236 L21,286 L-21,286 Z" fill="#9FC3D6" opacity=".5"/></g>`;
    }
    return `${bg}${surf}${C.shadow(320, 306, 70, 8, 0.6)}${extra}
<g transform="translate(0,18)">${ITEM[item](C)}</g>
${C.dust(200, 60, 260, 200, 14)}
<g class="rb-fadein" style="--d:.6s"><g transform="translate(372,72) rotate(-58)">${bottle()}</g>${C.light(372, 72, 50, "#FFD27A", 0.25)}</g>
${[0, 1, 2].map((i) => `<path class="rb-pill" style="--d:${1.5 + i * 0.6}s" d="M330,96 q-5,9 0,13 q5,-4 0,-13 Z" fill="#7B4A8C" ${o(1.2)}/>`).join("")}
${C.tint(tint, 0.14)}${C.vignette(0.65)}`;
  }) });
  // 4 Der Auftritt: Bühne mit Prospero im Scheinwerferkegel, Publikum im Vordergrund, Vorhang fällt, 22:12
  scenes.push({ dur: 7.5, cam: "in", sfx: [[1.2, "sting"], [4.4, "applause"], [6.2, "stamp"]], sub: L(`${drink} Um 22:12, nach dem Schlussapplaus, bricht er hinter dem Vorhang zusammen.`, `${drink} At 22:12, after the final curtain call, he collapses behind the curtain.`), svg: scene((C) => {
    const prop = item === "sekt" ? "" : item === "bonbon" ? `<path d="M30,-104 L44,-140" stroke="#B8BCC2" stroke-width="4" stroke-linecap="round"/><ellipse cx="45" cy="-143" rx="7" ry="5" fill="#E0A030" ${o(1.6)}/>` : `<path d="M28,-136 L42,-136 L40,-104 L30,-104 Z" fill="${item === "pokal" ? GOLD : "#E9E2D0"}" ${o(2)}/>`;
    const hem = (x, w) => `<rect x="${x}" y="276" width="${w}" height="14" fill="#7A5A1E"/><path d="M${x},280 L${x + w},280" stroke="${GOLD}" stroke-width="2.4" stroke-dasharray="6 4"/>`;
    return `<rect width="${W}" height="${H}" fill="#07060A"/>
<rect x="40" y="36" width="560" height="254" fill="${C.lin([[0, "#141A30"], [0.7, "#24304E"], [1, "#1A2238"]])}"/><circle cx="470" cy="96" r="22" fill="#C9C4AA" opacity=".55"/>${C.light(470, 96, 90, "#C9D3E0", 0.2)}<path d="M40,214 Q90,190 140,214 T240,214 T340,214 T440,214 T540,214 T640,214 L640,290 L40,290 Z" fill="#16233E" opacity=".9"/><path d="M40,240 Q100,222 160,240 T280,240 T400,240 T520,240 T640,240 L640,290 L40,290 Z" fill="#0F1A30"/>
<path d="M0,290 L${W},290 L${W},338 L0,338 Z" fill="${C.lin([[0, "#6A4A2C"], [1, "#2A1A10"]])}"/>${[...Array(9)].map((_, i) => `<path d="M${i * 80 - 40},290 L${i * 90 - 80},338" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`).join("")}<path d="M0,290 L${W},290" stroke="#000" stroke-opacity=".5" stroke-width="3"/>
<ellipse cx="320" cy="294" rx="130" ry="16" fill="#FFF1C8" opacity=".35"/>
${C.cone(320, 0, 40, 250, 296, "#FFF1C8", 0.42)}
${C.dust(240, 40, 160, 220, 18)}
<g class="rb-nod" style="animation-delay:5.6s"><g class="rb-breathe">${adler(C, 320, 290, 1.05, prop)}</g></g>
${[...Array(11)].map((_, i) => `<circle class="rb-flicker" style="--d:${(i % 4) * 0.5}s" cx="${40 + i * 56}" cy="296" r="3" fill="#FFE2A0"/>`).join("")}
<g class="rb-curtL"><g transform="translate(-330,0)">${velvet(C, 0, 0, 330, 290, 6)}${hem(0, 330)}</g></g><g class="rb-curtR"><g transform="translate(640,0)">${velvet(C, 0, 0, 330, 290, 6)}${hem(0, 330)}</g></g>
${velvet(C, 0, 0, 44, 300, 2)}${velvet(C, 596, 0, 44, 300, 2)}<path d="M44,0 L44,300 M596,0 L596,300" stroke="${GOLD}" stroke-width="3"/>
<path d="M0,0 L${W},0 L${W},40 Q480,58 320,46 Q160,58 0,40 Z" fill="${C.lin([[0, "#5E1520"], [1, CURT]])}" ${o(2)}/><path d="M0,40 Q160,58 320,46 Q480,58 ${W},40" fill="none" stroke="${GOLD}" stroke-width="4"/>${[...Array(14)].map((_, i) => `<path d="M${22 + i * 46},${47 + Math.abs(7 - i) * -1} l0,8" stroke="${GOLD}" stroke-width="2"/>`).join("")}<path d="M280,24 Q320,6 360,24 Q320,16 280,24 Z" fill="${GOLD}"/>
<g>${[...Array(12)].map((_, i) => { const x = 22 + i * 54 + (i % 2) * 8; return `<g class="${i % 3 === 0 ? "rb-bob" : ""}" style="--d:${(i % 4) * 0.15}s"><ellipse cx="${x}" cy="${334 - (i % 2) * 6}" rx="17" ry="20" fill="#050407"/><path d="M${x - 30},360 Q${x - 28},${348 - (i % 2) * 6} ${x},${346 - (i % 2) * 6} Q${x + 28},${348 - (i % 2) * 6} ${x + 30},360 Z" fill="#050407"/></g>`; }).join("")}</g>
${C.tint("#C8603A", 0.1)}
<g class="rb-fadein" style="--d:6s">${C.time("22:12")}</g>
${C.vignette(0.5)}`;
  }) });
  // 5 Der Spind: Umkleide mit Leuchtstoffröhre, Fläschchen fliegt in den Spind, Zahlencode
  const li = LOCKERS.indexOf(spind), lx = 30 + li * 84 + 38, ly = 120, bx = 320, by = 210;
  scenes.push({ dur: 7, cam: "left", sfx: String(code).split("").map((_, i) => [1.4 + i * 0.45, "click"]).concat([[3.6, "click"], [4.2, "stamp"]]), sub: L(`Das Fläschchen verschwindet in Spind ${spind} – Code ${code}.`, `The little bottle disappears into locker ${spind} – code ${code}.`), svg: scene((C) => {
    const metal = C.lin([[0, "#7E8794"], [0.5, "#5E6672"], [1, "#3E444E"]], 0, 0, 1, 0), hi = C.lin([[0, "#A3ACB8"], [0.5, "#808A97"], [1, "#59616D"]], 0, 0, 1, 0);
    return `<rect width="${W}" height="${H}" fill="${C.lin([[0, "#3A4440"], [1, "#151A1A"]])}"/>${[...Array(8)].map((_, i) => `<path d="M0,${i * 24} L${W},${i * 24}" stroke="#000" stroke-opacity=".15" stroke-width="1.4"/>`).join("")}
<rect x="170" y="28" width="300" height="7" rx="3.5" fill="#E9F4F0" class="rb-flicker"/>${C.light(320, 28, 240, "#CFE9E0", 0.4, "rb-flicker")}
${LOCKERS.map((n, i) => `<g transform="translate(${30 + i * 84},40)"><rect width="76" height="250" fill="${n === spind ? hi : metal}" ${o(3)}/>${[0, 1, 2].map((k) => `<path d="M14,${24 + k * 8} L62,${24 + k * 8}" ${o(2)}/>`).join("")}<rect x="22" y="70" width="32" height="22" fill="${PAPER}" ${o(1.6)}/>${T(38, 87, String(n), 15, 800)}<rect x="60" y="120" width="8" height="36" rx="3" fill="#2A2E36" ${o(1.4)}/><rect x="16" y="112" width="26" height="34" rx="3" fill="#1A1C22" ${o(1.4)}/>${[0, 1, 2].map((r) => [0, 1].map((q) => `<rect x="${20 + q * 10}" y="${116 + r * 9}" width="7" height="6" fill="#4A505A"/>`).join("")).join("")}<path d="M4,4 L4,246" stroke="#FFF" stroke-opacity=".18" stroke-width="3"/>${n === spind ? `<rect class="rb-glow" x="-4" y="-4" width="84" height="258" fill="none" stroke="${RED}" stroke-width="4"/>` : ""}</g>`).join("")}
${C.light(lx, 160, 120, "#FF6A50", 0.25)}
<rect x="0" y="290" width="${W}" height="70" fill="${C.lin([[0, "#2A2E2E"], [1, "#0A0C0C"]])}"/><path d="M0,290 L${W},290" stroke="#000" stroke-opacity=".5" stroke-width="3"/>
<g class="rb-into" style="--d:.5s;--x:${(lx - 0.45 * bx).toFixed(1)}px;--y:${(ly - 0.45 * by).toFixed(1)}px"><g transform="translate(${bx},${by}) rotate(-14)">${bottle(1.1)}</g></g>
<g class="rb-slideup" style="--d:.8s"><rect x="160" y="250" width="320" height="76" rx="6" fill="${C.lin([[0, "#1E2026"], [1, "#0B0C10"]])}" ${o(2, GOLD)}/>${T(320, 274, L(`Spind ${spind} · Code`, `Locker ${spind} · code`), 13, 700, "#C9BFA9")}${String(code).split("").map((d, i) => `<g class="rb-pop2" style="--d:${1.4 + i * 0.45}s">${T(266 + i * 36, 312, d, 30, 900, GOLD)}</g>`).join("")}</g>
${C.tint("#4A8A7A", 0.12)}${C.vignette(0.6)}`;
  }) });
  // 6 Akte geschlossen: Akte auf dem Schreibtisch unter der Lampe, Foto des Täters mit Büroklammer, Stempel
  scenes.push({ dur: 9, cam: "out", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: scene((C) => {
    const paper = C.lin([[0, "#F6F0E2"], [1, "#DCCFB4"]], 0, 0, 0.4, 1), photo = C.clip("M82,76 L238,76 L238,258 L82,258 Z");
    const [i1, i2] = wrap2(items[item], 32);
    return `${C.wood(0, 0, W, H, "#3A2618", "#1A100A")}${C.light(420, 120, 380, "#FFD99A", 0.3)}
<g transform="translate(40,34) rotate(7)"><rect x="0" y="0" width="120" height="42" fill="#C9B894" ${o(1.6)}/><path d="M92,0 L92,42" stroke="${INK}" stroke-width="1.4" stroke-dasharray="3 3"/>${T(46, 18, L("DER STURM", "THE TEMPEST"), 10, 800, CURT)}${T(46, 32, L("PREMIERE", "OPENING"), 8, 700, MUTED)}</g>
<g class="rb-fadein" style="--d:.2s"><g transform="rotate(-4 160 170)"><rect x="70" y="64" width="186" height="236" fill="#000" opacity=".35" transform="translate(6,8)"/><rect x="70" y="64" width="180" height="232" fill="#F4EFE4" ${o(2)}/><g clip-path="${photo}"><rect x="82" y="76" width="156" height="182" fill="${C.lin([[0, "#3A3040"], [1, "#14101E"]])}"/>${C.light(150, 120, 120, "#FFD27A", 0.3)}${fig(c, 160, 300, 1.05)}</g><rect x="82" y="76" width="156" height="182" fill="none" ${o(1.6)}/></g></g>
<g class="rb-slidein" style="--d:.6s"><rect x="296" y="48" width="320" height="252" fill="#000" opacity=".4"/><rect x="290" y="40" width="320" height="252" fill="${paper}" ${o(3)}/><path d="M290,40 L610,40 L610,52 L290,52 Z" fill="#000" opacity=".05"/><path d="M314,28 L314,70 Q314,78 322,78 Q330,78 330,70 L330,34 Q330,30 326,30 Q322,30 322,34 L322,64" fill="none" stroke="#9AA2AC" stroke-width="3" stroke-linecap="round"/>${T(450, 74, L("ERMITTLUNGSAKTE · SOLO 002", "CASE FILE · SOLO 002"), 13, 800, MUTED)}<path d="M310,86 L590,86" ${o(1.4)}/>
${T(310, 114, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}${T(310, 136, name, 19, 800, INK, "start")}
${T(310, 164, L("Gift im", "Poison in"), 12, 700, MUTED, "start")}${T(310, 182, i1, 13, 800, INK, "start")}${T(310, 198, i2, 13, 800, INK, "start")}
${T(310, 214, L("Spind · Code", "Locker · code"), 12, 700, MUTED, "start")}${T(310, 236, `${spind} · ${code}`, 19, 800, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,284) rotate(-6)"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>
${C.vignette(0.55)}`;
  }) });
  scenes.push(endcard({ en, plural: false }));   // Abspann wie bei den Teasern
  return { music: "/assets/audio/rueckblende-solo-theater.m4a", scenes };
}
export const FIGURES002 = FIG;
