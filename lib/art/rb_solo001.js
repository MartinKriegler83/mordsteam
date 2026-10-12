// Rückblende (animiertes Finale) Solo 001 „Nachtzug nach Venedig“ – Entscheidung 10.10.2026.
// Sechs Szenen, je Runde aus den Spieldaten (Täter, Zeitvariante, Versteck).
// Kino-Look 11.10.2026 (lib/art/cine.js): Nacht, der Zug fährt durch die Dunkelheit (vorbeiziehende Lichter, Fensterreflexe),
// gedämpftes Abteillicht, Messing, Nebel. Inhalt (sub, sfx, dur, Fakten) unverändert – nur die Zeichnung ist neu.
// Die Bewegung kommt aus CSS-Klassen (rb-*), die der Player (site/spiel/rueckblende.js) mitbringt; dazu eine eigene
// Klasse s1-pass (vorbeiziehende Lichter im Fenster), die jede Szene in ihrem <style> selbst mitbringt.
// Rückgabe: { music, scenes: [{ svg, dur, sub, cam, sfx: [[sekunde, "knock"|"plop"|"rustle"|"step"|"stamp"|"sting"], …] }] }
// Korrekturen, die erhalten bleiben müssen:
// - Opfer Viktor trägt ocker/senfbraun (#8A6A2A) – nicht rot, sonst wird er mit Jonas (roter Pullover) verwechselt.
// - Szene 3: Blister mit LEEREN Mulden (alle zehn Tabletten sind im Cognac).
// - Szene 5: Verstecke im Zugplan an der Stelle wie im Spielbild „Mögliche Verstecke“ (lib/art/solo001.js, V_MAP):
//   Gepäckregal 326 am Wagenende (Seite zu 327), Gepäckregal 328 am Einstieg (Seite zu 327), Notsitz vor Abteil 6 usw.
// - Schlusskarte: lange Werte zweizeilig (wrap2), nichts abgeschnitten (Spieltest 11.10.2026); EN Kleinschreibung nach Doppelpunkt (lc).
import { INK, PAPER, RED, CARD, MUTED, TAN, o, T, fig, face, esc } from "./gn.js";
import { cine, SERIF, endcard } from "./cine.js";

const W = 640, H = 360, GOLD = "#F2C14E", BRASS = "#C9A45A", WARM = "#FFC978";
// vorbeiziehende Lichter: eigene Animation, Weg ±--a, Dauer --t, Versatz --d (negativ = schon unterwegs)
const STYLE = `<style>.s1-pass{animation:s1Pass var(--t,2s) linear infinite;animation-delay:var(--d,0s)}@keyframes s1Pass{from{transform:translateX(var(--a,160px))}to{transform:translateX(calc(var(--a,160px) * -1))}}</style>`;
const svg = (inner) => { const C = cine(W, H); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${STYLE}${C.wrap(inner)}</svg>`; };
const rr = (x, y, w, h, r) => `M${x + r},${y} h${w - 2 * r} q${r},0 ${r},${r} v${h - 2 * r} q0,${r} -${r},${r} h-${w - 2 * r} q-${r},0 -${r},-${r} v-${h - 2 * r} q0,-${r} ${r},-${r} Z`;

// Zugfenster bei Nacht: Hügel, ferne Lichter und Masten ziehen vorbei, Spiegelung im Glas
function nightWin(C, x, y, w, h, { k = 4, seed = 1, moon = false, frame = "#24170E", r = 12 } = {}) {
  const cl = C.clip(rr(x, y, w, h, r)), cx = x + w / 2, hz = y + h * 0.66, a = Math.round(w * 0.8);
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.lin([[0, "#050914"], [0.62, "#14203C"], [1, "#22304F"]])}"/>`;
  s += [...Array(5)].map((_, i) => `<circle cx="${x + ((i * 53 + seed * 19) % w)}" cy="${y + 8 + ((i * 29 + seed * 7) % (h * 0.4))}" r="${i % 2 ? 0.8 : 1.2}" fill="#E9E2D0" opacity=".7"/>`).join("");
  if (moon) s += `<path d="M${x + w * 0.72},${y + h * 0.12} a${h * 0.12},${h * 0.12} 0 1,0 0,${h * 0.24} a${h * 0.09},${h * 0.12} 0 1,1 0,-${h * 0.24} Z" fill="#F3EED8"/>${C.light(x + w * 0.7, y + h * 0.24, h * 0.4, "#CFDBFF", 0.35)}`;
  s += `<path d="M${x},${hz} Q${x + w * 0.2},${hz - h * 0.16} ${x + w * 0.42},${hz - h * 0.05} T${x + w * 0.78},${hz - h * 0.1} T${x + w},${hz - h * 0.03} L${x + w},${y + h} L${x},${y + h} Z" fill="#0A1124"/>`;
  s += [...Array(k)].map((_, i) => `<g class="s1-pass" style="--a:${a}px;--t:${(5 + (i % 3) * 1.6).toFixed(1)}s;--d:-${(i * 1.9 + seed).toFixed(1)}s"><circle cx="${cx + ((i * 23) % 40) - 20}" cy="${(hz + 3 + ((i * 7) % (h * 0.18))).toFixed(1)}" r="${i % 2 ? 1.3 : 2}" fill="${WARM}"/></g>`).join("");
  s += `<g class="s1-pass" style="--a:${Math.round(a * 1.3)}px;--t:2.4s;--d:-${seed * 0.7}s"><rect x="${cx - 36}" y="${(hz + h * 0.14).toFixed(1)}" width="72" height="2.6" rx="1.3" fill="#FFB75A" opacity=".75"/></g>`;
  s += `<g class="s1-pass" style="--a:${a}px;--t:1.5s;--d:-${seed * 0.4}s"><rect x="${cx - 3}" y="${y}" width="6" height="${h}" fill="#03050B"/><path d="M${cx},${y + h * 0.16} L${cx + w * 0.7},${y + h * 0.24}" stroke="#03050B" stroke-width="1.4"/></g>`;
  s += `<path d="M${x + w * 0.56},${y} L${x + w * 0.74},${y} L${x + w * 0.38},${y + h} L${x + w * 0.2},${y + h} Z" fill="#fff" opacity=".05"/>${C.light(x + w * 0.24, y + h * 0.3, h * 0.28, "#FFD9A0", 0.22)}`;
  return `<g clip-path="${cl}">${s}</g><path d="${rr(x, y, w, h, r)}" fill="none" stroke="${frame}" stroke-width="8"/><path d="${rr(x + 4, y + 4, w - 8, h - 8, r - 3)}" fill="none" stroke="${BRASS}" stroke-width="1.3" opacity=".55"/>`;
}
// Uhrzeit-Einblender (Kino-Stil aus cine.js)
const clock = (C, time) => C.time(time, 30, 312);
// Viktor Hallwachs (Opfer): grau meliert, Schnurrbart, ockerbraune Hausjacke (#8A6A2A – bewusst nicht rot wie Jonas)
const viktor = (C, x, y, s) => `<g transform="translate(${x},${y}) scale(${s})">${C.shadow(0, 2, 60, 9)}<path d="M-46,0 L-40,-96 Q0,-122 40,-96 L46,0 Z" fill="#8A6A2A" ${o(3)}/><path d="M-46,0 L-40,-96 Q0,-122 40,-96 L46,0 Z" fill="${C.lin([[0, "#000", 0], [0.55, "#000", 0.05], [1, "#000", 0.45]], 0, 0, 1, 0)}"/><path d="M-38,-92 Q-46,-50 -42,-6" fill="none" stroke="${WARM}" stroke-width="2.5" opacity=".6"/><path d="M-12,-104 L0,-84 L12,-104" fill="${PAPER}" ${o(2)}/><g class="rb-nod">${face(RED)}<path d="M-21,-160 Q-22,-188 0,-188 Q22,-188 21,-160 Q12,-176 0,-174 Q-12,-176 -21,-160 Z" fill="#B9B3A8" ${o(2)}/><path d="M-10,-134 Q0,-128 10,-134" stroke="#8E8A82" stroke-width="4" fill="none"/></g></g>`;
const sub = (s) => esc(s);

const lc = (x) => String(x).charAt(0).toLowerCase() + String(x).slice(1);
// zweizeilig statt abgeschnitten (Spieltest 11.10.2026) – n so gewählt, dass alle Verstecke (DE/EN) ohne „…“ passen
const wrap2 = (t, n = 36) => { t = String(t); if (t.length <= n) return [t, ""]; const i = t.lastIndexOf(" ", n); let k = i > 8 ? i : n; if (t.length - k < 11) { const j = t.lastIndexOf(" ", k - 1); if (j > 8) k = j; } /* kein Einzelwort in Zeile 2 */ const r = t.slice(k).trim(); return [t.slice(0, k).trim(), r.length > n ? r.slice(0, n - 1) + "…" : r]; };

// Zugplan (wie Spielbild zugplan/verstecke, um 150 px nach links verschoben): Wagen oben bei y=PY
const PY = 54, DX = -150;
const CARS = [["325", 178, 92, ["Speisewagen", "Dining car"]], ["326", 278, 80, ["Liegewagen", "Couchette car"]], ["327", 364, 236, ["Schlafwagen", "Sleeping car"]], ["328", 608, 144, ["Schlafwagen", "Sleeping car"]]];
// Verstecke: x wie V_MAP in solo001.js (Plan-Koordinaten), y relativ zur Wagenoberkante
const SPOTPOS = { schirm325: [224, 76], regal326: [344, 76], waesche327: [384, 58], heizung327: [430, 80], notsitz327: [554, 80], regal328: [628, 76], schrank328: [700, 76] };
const KIND = { schirm325: "schirm", regal326: "regal", waesche327: "waesche", heizung327: "heizung", notsitz327: "notsitz", regal328: "regal", schrank328: "schrank" };
// Symbole der Verstecke (wie die Karten im Spielbild)
const ICON = {
  regal: `<rect x="-38" y="-30" width="76" height="60" fill="${CARD}" ${o(2.6)}/><path d="M-38,-6 L38,-6 M-38,18 L38,18" ${o(2.6)}/><rect x="-30" y="-24" width="26" height="18" rx="3" fill="${MUTED}" ${o(2)}/><rect x="4" y="-20" width="22" height="14" rx="3" fill="${RED}" ${o(2)}/><rect x="-14" y="0" width="34" height="18" rx="3" fill="#3B4660" ${o(2)}/>`,
  schrank: `<rect x="-24" y="-34" width="48" height="68" fill="#8C6E4E" ${o(2.6)}/><path d="M0,-34 L0,34" ${o(2)}/><circle cx="-5" cy="2" r="2.5" fill="${TAN}" ${o(1)}/><circle cx="5" cy="2" r="2.5" fill="${TAN}" ${o(1)}/><path d="M6,-34 L24,-34 L24,34 L6,34" fill="#5E4A34" opacity=".5"/>`,
  schirm: `<path d="M-16,-6 L16,-6 L13,34 L-13,34 Z" fill="#3B4660" ${o(2.6)}/><path d="M-6,-6 L-10,-34 Q-10,-40 -4,-40 M6,-6 L9,-30 Q10,-36 15,-34" fill="none" ${o(2.6, CARD)}/><path d="M-16,-6 L16,-6" ${o(3)}/>`,
  heizung: `<rect x="-40" y="-18" width="80" height="40" fill="#C9C2B4" ${o(2.6)}/>${[...Array(9)].map((_, i) => `<path d="M${-32 + i * 8},-12 L${-32 + i * 8},16" ${o(1.6)}/>`).join("")}<rect x="30" y="-28" width="10" height="10" fill="${INK}" stroke="${CARD}" stroke-width="1"/><rect x="33" y="-25" width="4" height="4" fill="${TAN}"/>`,
  waesche: `<rect x="-36" y="-26" width="72" height="54" fill="#8C6E4E" ${o(2.6)}/><rect x="-28" y="-18" width="56" height="38" fill="none" ${o(1.8)}/><path d="M-6,-2 Q-6,-14 0,-14 Q6,-14 6,-2" fill="none" ${o(2.4)}/><rect x="-9" y="-3" width="18" height="14" rx="2" fill="${TAN}" ${o(2)}/>`,
  notsitz: `<rect x="-34" y="-30" width="68" height="18" rx="4" fill="${RED}" ${o(2.6)}/><path d="M-30,-12 L-30,-4 M30,-12 L30,-4" ${o(3, CARD)}/><rect x="-36" y="-4" width="72" height="36" fill="${CARD}" ${o(2.6)}/><path d="M-36,8 L36,8" ${o(1.6)} stroke-dasharray="4 3"/><circle cx="0" cy="20" r="3" fill="${INK}"/>`,
};

export function rueckblende(c, v, { en = false, names, spots, timer }) {
  const L = (d, e) => (en ? e : d), s = timer(v);
  const name = names[c], spot = spots[c], spotKey = spot.key;
  const [px, py] = SPOTPOS[spotKey] || [554, 80];
  const sx = px + DX, sy = PY + py;
  const scenes = [];

  // 1 Titel – der Nachtzug fährt durch die Dunkelheit Richtung Venedig (nach links), Abteil 4 glüht rot
  scenes.push({ dur: 5, cam: "right", sfx: [[0.2, "rattle"]], sub: L("Nachtzug nach Venedig. Wagen 327.", "Night train to Venice. Car 327."), svg: svg((C) => {
    const car = (x, n, red) => `<g transform="translate(${x},0)"><rect y="226" width="124" height="54" rx="7" fill="${C.lin([[0, "#3A4566"], [0.5, "#222A44"], [1, "#11152A"]])}" ${o(2.2, "#05070E")}/><path d="M4,231 L120,231" stroke="#8A97BA" stroke-width="1.2" opacity=".5"/>${[0, 1, 2, 3].map((k) => red && k === 1 ? `<rect class="rb-glow" x="${10 + k * 28}" y="238" width="20" height="16" rx="2" fill="${RED}"/>` : `<rect x="${10 + k * 28}" y="238" width="20" height="16" rx="2" fill="${C.lin([[0, "#FFE3A6"], [1, "#E9A24C"]])}" opacity="${k === 3 && n === "325" ? 0.55 : 0.92}"/>`).join("")}${T(62, 274, n, 9, 700, "#7E89A8")}</g>`;
    return `${C.sky("#03050F", "#262741", "#0E1630")}${C.stars(36, 150)}
<path d="M548,46 a24,24 0 1,0 0,48 a18,24 0 1,1 0,-48 Z" fill="#F3EED8"/>${C.light(540, 70, 120, "#C9D6FF", 0.28)}
<path d="M-20,214 L60,150 L110,184 L190,118 L250,170 L330,128 L420,186 L500,140 L590,180 L660,150 L660,240 L-20,240 Z" fill="#141C36"/><path d="M190,118 L172,134 L196,130 L208,140 Z M330,128 L316,142 L338,138 Z M500,140 L486,154 L508,150 Z" fill="#7E8BAE" opacity=".35"/>
<path d="M-20,238 Q80,200 170,226 T380,214 T660,222 L660,262 L-20,262 Z" fill="#0C1124"/>
${C.fog(232, 0.22, "#8E9BC0")}
<rect y="276" width="${W}" height="84" fill="${C.lin([[0, "#0A0E1C"], [1, "#030409"]])}"/><path d="M0,288 L640,288" stroke="#4B5878" stroke-width="2.5"/><path d="M0,294 L640,294" stroke="#1E2640" stroke-width="2"/>
<g class="rb-train">${C.cone(30, 252, 6, 60, 252, "#FFE9B0", 0)}<path d="M-120,244 L28,248 L28,258 L-120,272 Z" fill="${C.lin([[0, "#FFE9B0", 0], [1, "#FFE9B0", 0.38]], 0, 0, 1, 0)}" style="mix-blend-mode:screen"/>
<g><path d="M30,280 L30,244 Q30,226 52,226 L112,226 L112,280 Z" fill="${C.lin([[0, "#2B3352"], [1, "#0E1222"]])}" ${o(2.2, "#05070E")}/><rect x="46" y="236" width="22" height="14" rx="2" fill="#E9A24C" opacity=".7"/><circle cx="36" cy="262" r="3.5" fill="#FFF2C8"/>${C.light(36, 262, 26, "#FFE9B0", 0.7)}</g>
${car(118, "325")}${car(248, "326")}${car(378, "327", true)}${car(508, "328")}
${[118, 248, 378, 508].map((x) => `<rect x="${x + 4}" y="290" width="116" height="40" fill="${C.lin([[0, "#FFC978", 0.16], [1, "#FFC978", 0]])}"/>`).join("")}${C.light(431, 246, 46, RED, 0.55, "rb-glow")}</g>
<path d="M0,360 L0,318 Q40,300 70,314 Q100,296 140,316 L170,304 Q220,320 260,312 L640,330 L640,360 Z" fill="#020306"/>
${C.title(L("NACHTZUG NACH VENEDIG", "NIGHT TRAIN TO VENICE"), L("Was wirklich geschah", "What really happened"), L("Wagen 327 · Abteil 4", "Car 327 · Compartment 4"), 40, 104)}
${C.vignette(0.55)}`;
  }) });

  // 2 Die Tür – Gang im Schlafwagen, Lichter der Nacht wandern über die Wand, die Tür zu Abteil 4 geht auf
  scenes.push({ dur: 6.5, cam: "in", sfx: [[1.6, "knock"], [1.95, "knock"], [3.1, "creak"]], sub: L(`${s("01:31")} – ${name} klopft an Abteil 4. Viktor öffnet arglos.`, `${s("01:31")} – ${name} knocks at compartment 4. Viktor opens without suspicion.`), svg: svg((C) => {
    const door = (x, n, cls = "") => `<g${cls ? ` class="${cls}"` : ""}><rect x="${x}" y="64" width="150" height="236" fill="${C.lin([[0, "#7A5634"], [1, "#4A3220"]], 0, 0, 1, 0)}" ${o(3, "#1A120A")}/><rect x="${x + 14}" y="78" width="122" height="116" rx="3" fill="#3E2A18" ${o(2, "#1A120A")}/><rect x="${x + 18}" y="82" width="114" height="108" rx="2" fill="${C.lin([[0, "#6B4A2C"], [1, "#3A2616"]])}"/><rect x="${x + 14}" y="206" width="122" height="80" rx="3" fill="none" stroke="#1A120A" stroke-width="2" opacity=".6"/><rect x="${x + 128}" y="176" width="8" height="30" rx="3" fill="${BRASS}" ${o(1.4, "#3A2616")}/><rect x="${x + 55}" y="100" width="40" height="32" rx="4" fill="${C.lin([[0, "#F4DA92"], [1, "#B88A3A"]])}" ${o(1.8, "#3A2616")}/>${T(x + 75, 124, n, 21, 800, "#2A1C10")}</g>`;
    return `<rect width="${W}" height="${H}" fill="#120D09"/>${C.wood(0, 40, W, 262, "#5A3D24", "#2A1B10", true)}
<rect width="${W}" height="44" fill="${C.lin([[0, "#0A0806"], [1, "#2A2018"]])}"/>${[150, 470].map((x, i) => `<ellipse cx="${x}" cy="40" rx="26" ry="7" fill="#FFE3A6"/>${C.light(x, 48, 120, "#FFC978", 0.42, "rb-flicker")}`).join("")}
<path d="M0,154 L640,154" stroke="${BRASS}" stroke-width="3" opacity=".5"/>
${[0, 1, 2].map((i) => `<g class="s1-pass" style="--a:420px;--t:${(2.6 + i * 0.7).toFixed(1)}s;--d:-${(i * 1.1).toFixed(1)}s"><path d="M${290 + i * 30},40 L${340 + i * 30},40 L${300 + i * 30},302 L${250 + i * 30},302 Z" fill="${C.lin([[0, "#9FB6E0", 0.0], [0.5, "#9FB6E0", 0.12], [1, "#9FB6E0", 0]], 0, 0, 1, 0)}" style="mix-blend-mode:screen"/></g>`).join("")}
${door(-90, "3")}
<rect x="400" y="64" width="150" height="236" fill="${C.lin([[0, "#FFE9B8"], [1, "#E9A24C"]])}"/>
${door(400, "4", "rb-door")}${door(610, "5")}
<rect x="200" y="96" width="60" height="22" rx="3" fill="#1A120A" ${o(1.5, BRASS)}/>${T(230, 112, "327", 12, 700, BRASS)}
${C.floor(300, "#4A1E1A", "#1C0B09")}<path d="M0,318 L640,318 M0,346 L640,346" stroke="${BRASS}" stroke-width="1.5" opacity=".25"/>
<path class="rb-light" d="M400,64 L240,300 L400,300 Z" fill="${C.lin([[0, "#FFD79A", 0.9], [1, "#FFD79A", 0.1]], 1, 0, 0, 0)}"/><path class="rb-light" d="M400,300 L200,360 L430,360 Z" fill="#FFD79A"/><rect class="rb-light" x="396" y="64" width="10" height="236" fill="#FFE9B8"/>
<g class="rb-walk"><g class="rb-breathe">${fig(c, 300, 405, 1.35, "#E9A24C")}</g></g>
<g class="rb-pop" style="--d:1.6s">${T(452, 52, L("klopf", "knock"), 16, 800, "#FFE3A6")}</g><g class="rb-pop" style="--d:1.95s">${T(506, 44, L("klopf", "knock"), 16, 800, "#FFE3A6")}</g>
${C.tint("#1A2340", 0.22)}${clock(C, s("01:31"))}${C.vignette(0.6)}`;
  }) });

  // 3 Der Cognac – im Abteil 4: Viktor nickt ein, zehn Tabletten im Glas, der Blister ist leer
  scenes.push({ dur: 6.5, cam: "in", sfx: [[2.0, "plop"], [2.6, "plop"], [3.2, "plop"]], sub: L("Zehn Tabletten Schlafmittel – im Cognac aufgelöst.", "Ten sleeping pills – dissolved in the cognac."), svg: svg((C) => {
    let cells = "";
    // Alle zehn Mulden leer: dunkles Loch, hochstehender Folienlappen, Riss wie in der Akte (Nachtest 12.10.2026: wurde als „voll“ gelesen)
    for (let i = 0; i < 10; i++) { const x = -32 + (i % 5) * 16, y = -9 + Math.floor(i / 5) * 19, f = i % 2 ? 1 : -1; cells += `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="7" fill="#2A2E33" ${o(1.3, "#5E646B")}/><ellipse cx="${x + 1}" cy="${y + 1.5}" rx="3.6" ry="4.6" fill="#15181B"/><path d="M${x - 3.5},${y - 3} L${x + 1},${y + 4}" ${o(0.9, "#7A8088")}/><path d="M${x - 4.5 * f},${y - 5} L${x + 3 * f},${y - 9} L${x + 4.5 * f},${y - 3} Z" fill="#E9EDF0" ${o(0.9, "#5E646B")}/>`; }
    return `<rect width="${W}" height="${H}" fill="#140D08"/>${C.wood(0, 0, W, 360, "#5A3D24", "#24170D", true)}
${nightWin(C, 214, 50, 220, 146, { k: 5, seed: 2, moon: true })}
<path d="M196,40 Q214,120 206,214 L184,214 Q190,120 176,40 Z" fill="${C.lin([[0, "#6E1E22"], [1, "#2E0A0E"]], 0, 0, 1, 0)}"/><path d="M452,40 Q434,120 442,214 L464,214 Q458,120 472,40 Z" fill="${C.lin([[0, "#2E0A0E"], [1, "#6E1E22"]], 0, 0, 1, 0)}"/>
<rect x="566" y="96" width="10" height="26" fill="${BRASS}"/><path d="M548,96 L594,96 L584,72 L558,72 Z" fill="${C.lin([[0, "#F2D7A0"], [1, "#B88A3A"]])}" ${o(1.5, "#3A2616")}/>
<g class="rb-flicker">${C.light(571, 100, 170, "#FFC978", 0.5)}${C.cone(571, 98, 40, 230, 262, "#FFD79A", 0.22)}</g>
<path d="M0,214 L250,214 L250,360 L0,360 Z" fill="${C.lin([[0, "#5A1A1E"], [1, "#22080A"]])}"/><path d="M0,214 L250,214" stroke="#000" stroke-opacity=".4" stroke-width="3"/>
${viktor(C, 140, 334, 1.22)}
${C.shadow(420, 268, 200, 12, 0.5)}<rect x="262" y="254" width="378" height="14" fill="${C.lin([[0, "#9A6E42"], [1, "#5C4027"]])}" ${o(2, "#1A120A")}/><rect x="262" y="268" width="378" height="92" fill="${C.lin([[0, "#3A2616"], [1, "#160E07"]])}"/>
<path d="M418,206 Q414,236 440,244 Q466,236 462,206 Z" fill="#E9E2D0" fill-opacity=".18" ${o(1.8, "#D9D2C2")}/><path d="M416,222 Q440,216 464,222 Q462,238 440,243 Q418,238 416,222 Z" fill="${C.lin([[0, "#E08A3A"], [1, "#7A3A12"]])}"/><path d="M440,244 L440,254 M428,255 L452,255" ${o(2.4, "#D9D2C2")}/><path d="M423,212 Q422,228 430,236" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>${C.light(440, 226, 30, "#FFB060", 0.45)}
${[0, 1, 2, 3].map((i) => `<circle class="rb-dust" style="--d:${(2.4 + i * 0.5).toFixed(1)}s" cx="${432 + i * 5}" cy="${238 - (i % 2) * 4}" r="1.3" fill="#FFE3A6"/>`).join("")}
<g transform="translate(546,238) rotate(-11) scale(1.18)">${C.shadow(4, 16, 54, 8, 0.5)}<rect x="-46" y="-24" width="92" height="48" rx="5" fill="${C.lin([[0, "#E3E7EA"], [1, "#9AA2AA"]], 0, 0, 1, 1)}" ${o(2, "#3A3F45")}/>${cells}<path d="M-46,-16 L-30,-24" stroke="#fff" stroke-width="2" opacity=".6"/>${T(0, 21, "SOMNARIL 10 mg", 6.5, 800, RED)}</g><g opacity=".9"><path d="M492,262 l7,-3 l3,5 l-6,3 Z" fill="#DDE2E6" stroke="#6B7178" stroke-width=".8"/><path d="M606,266 l6,-2 l2,5 l-7,1 Z" fill="#DDE2E6" stroke="#6B7178" stroke-width=".8"/></g>
${[0, 1, 2].map((i) => `<circle class="rb-pill" style="--d:${1.6 + i * 0.6}s" cx="${436 + i * 4}" cy="130" r="4.5" fill="${PAPER}" ${o(1.4)}/>`).join("")}
${C.dust(500, 110, 120, 120, 10)}
${C.tint("#2A1608", 0.16)}${clock(C, s("01:34"))}${C.vignette(0.62)}`;
  }) });

  // 4 Der Tausch – „Lagune im Nebel“ im offenen Koffer: die Kopie bleibt im Rahmen, das Original wird zur Rolle
  scenes.push({ dur: 6, cam: "left", sfx: [[1.2, "rustle"], [3.2, "sting"]], sub: L("„Lagune im Nebel“ – das Original wird zur Rolle, im Rahmen bleibt die Kopie.", "“Lagoon in the Mist” – the original becomes a roll, the copy stays in the frame."), svg: svg((C) => {
    // Motiv exakt wie Bild B der Akte (lib/art/solo001.js rahmen): Nebelstreifen, Fahne am Mast, dunkle Kuppel, Wasser (Nachtest 12.10.2026)
    const lagoon = (x, y, w, h) => `<g transform="translate(${x},${y}) scale(${(w / 224).toFixed(4)},${(h / 144).toFixed(4)}) translate(-98,-88)"><rect x="98" y="88" width="224" height="144" fill="${C.lin([[0, "#B9C8CC"], [1, "#9FB3BC"]])}"/><path d="M98,170 Q150,160 210,168 T322,164 L322,232 L98,232 Z" fill="#6F8791"/><path d="M98,150 Q160,140 220,148 T322,142" fill="none" stroke="#D9E2E6" stroke-width="5" opacity=".7"/><path d="M150,170 L150,120 M150,128 L170,138 L150,146" fill="none" ${o(2.4)}/><path d="M236,166 Q246,130 262,166" fill="#4A5F68" ${o(2)}/><path d="M150,200 Q160,196 172,200 M238,212 Q250,208 262,212" stroke="#D9E2E6" stroke-width="1.6" opacity=".5" fill="none"/></g>`;
    let threads = ""; for (let i = 0; i < 12; i++) threads += `<path d="M${88 + i * 17},70 q${(i % 3) - 1},5 ${i % 2 ? 2 : -2},${6 + (i % 4) * 2}" fill="none" stroke="#E7DCC4" stroke-width="1.4"/>`;
    return `<rect width="${W}" height="${H}" fill="#120C08"/>${C.wood(0, 0, W, 360, "#4E3520", "#1C120A", true)}
${nightWin(C, 476, 30, 150, 120, { k: 3, seed: 4 })}
<g class="rb-flicker">${C.light(190, 40, 260, "#FFC978", 0.42)}</g>
<path d="M0,250 L640,250 L640,360 L0,360 Z" fill="${C.lin([[0, "#5A1A1E"], [1, "#1C0608"]])}"/><path d="M0,250 L640,250" stroke="#000" stroke-opacity=".45" stroke-width="3"/>
<path d="M36,40 L320,40 L326,232 L30,232 Z" fill="${C.lin([[0, "#5E3A1E"], [1, "#2E1A0C"]])}" ${o(2.5, "#140C06")}/><path d="M46,50 L310,50 L314,224 L42,224 Z" fill="#7A2A24" opacity=".5"/>
${C.shadow(178, 236, 150, 10, 0.55)}
<g transform="translate(64,58)"><rect width="228" height="172" fill="${C.lin([[0, "#D9A85A"], [0.5, "#9A6F2E"], [1, "#6E4F22"]], 0, 0, 1, 1)}" ${o(3, "#2A1A0A")}/><rect x="14" y="14" width="200" height="144" fill="#6E4F22" ${o(1.5, "#2A1A0A")}/>${lagoon(22, 22, 184, 128)}<rect x="22" y="22" width="184" height="128" fill="none" ${o(1.5, "#2A1A0A")}/></g>${threads}
<rect x="24" y="226" width="308" height="64" rx="6" fill="${C.lin([[0, "#6B4428"], [1, "#2E1A0C"]])}" ${o(2.5, "#140C06")}/><path d="M24,240 L332,240" stroke="${BRASS}" stroke-width="1.5" opacity=".5"/><rect x="164" y="228" width="28" height="12" rx="2" fill="${BRASS}" ${o(1.2, "#3A2616")}/>
<g class="rb-fadein" style="--d:3s"><text x="178" y="320" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="700" font-size="20" fill="${PAPER}">${esc(L("Kopie", "Copy"))}</text></g>
${C.shadow(440, 268, 130, 12, 0.5)}
<g class="rb-roll"><g transform="translate(440,226) rotate(-18)"><rect x="-110" y="-22" width="220" height="44" rx="22" fill="${C.lin([[0, "#D9E2E6"], [0.35, "#9FB3BC"], [0.75, "#6F8791"], [1, "#3E525A"]])}" ${o(2.6, "#1A2228")}/><path d="M-96,-6 Q-40,-12 20,-6 T100,-8" stroke="#EEF2F2" stroke-width="3" opacity=".5" fill="none"/><path d="M-100,8 Q-30,4 30,10 T104,6" stroke="#5E7882" stroke-width="4" opacity=".7" fill="none"/><ellipse cx="110" cy="0" rx="10" ry="22" fill="#E7DCC4" ${o(2.2, "#1A2228")}/><path d="M110,-14 a7,14 0 1,1 -1,28 a4,9 0 1,1 1,-18" fill="none" stroke="#8C7A5A" stroke-width="1.4"/><rect x="-20" y="-24" width="14" height="48" fill="${RED}" ${o(1.8, "#3A0E0A")}/></g></g>
<rect class="rb-flash" style="--d:3.2s" width="${W}" height="${H}" fill="#FFF6E0"/>
<g class="rb-fadein" style="--d:3.4s"><g transform="translate(440,226) rotate(-18)"><path d="M-110,-38 L110,-38 M-110,-44 L-110,-32 M110,-44 L110,-32" stroke="${GOLD}" stroke-width="2"/></g>${T(452, 152, L("Original · 46 cm", "Original · 46 cm"), 17, 800, GOLD)}</g>
${C.fog(205, 0.16, "#C9D3E0")}
${C.tint("#2A1A0A", 0.14)}${C.vignette(0.62)}`;
  }) });

  // 5 Das Versteck – Zugplan unter der Lampe, der Weg von Abteil 4 zum Versteck
  const [n1, n2] = wrap2(spot.name, 36);
  scenes.push({ dur: 7, cam: "none", sfx: [[0.8, "step"], [1.3, "step"], [1.8, "step"], [2.3, "step"], [3.0, "click"]], sub: L(`Die Rolle verschwindet: ${spot.name}.`, `The roll disappears: ${lc(spot.name)}.`), svg: svg((C) => {
    const X = (x) => x + DX;
    let plan = CARS.map(([n, x, w, sub]) => `<rect x="${X(x)}" y="${PY}" width="${w}" height="88" rx="9" fill="${n === "327" ? "#FBF4E4" : CARD}" ${o(2.6)}/>${T(X(x) + w / 2, PY - 9, n === "327" ? L("327 · Schlafwagen", "327 · Sleeping car") : n, 13, 800)}${n === "327" ? "" : T(X(x) + w / 2, PY + 104, L(sub[0], sub[1]), 10, 500, MUTED)}`).join("");
    plan += [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${X(368 + i * 34)}" y="${PY + 8}" width="32" height="50" fill="${i === 3 ? "#F4D9D5" : PAPER}" ${o(1.6)}/>${T(X(384 + i * 34), PY + 38, i ? String(i + 1) : L("D1", "S1"), 11, 700, i === 3 ? RED : MUTED)}`).join("");
    plan += `<rect x="${X(572)}" y="${PY + 8}" width="22" height="50" fill="#C9BFA9" ${o(1.6)}/>${T(X(583), PY + 37, "WC", 8.5, 700)}<path d="M${X(366)},${PY + 70} L${X(596)},${PY + 70}" ${o(1.3)} stroke-dasharray="4 4"/>${T(X(481), PY + 84, L("Gang", "Corridor"), 9.5, 500, MUTED)}`;
    plan += [174, 274, 361, 604].map((x) => `<rect x="${X(x) - 6}" y="${PY + 30}" width="12" height="26" fill="${TAN}" ${o(2)}/>`).join("");
    plan += `<path d="M${X(178) - 4},${PY + 120} L${X(178) + 26},${PY + 120} M${X(178) + 4},${PY + 115} L${X(178) - 4},${PY + 120} L${X(178) + 4},${PY + 125}" stroke="${RED}" stroke-width="2.4" fill="none"/>${T(X(178) + 32, PY + 124, L("Fahrtrichtung Venedig", "Direction of travel: Venice"), 9.5, 600, RED, "start")}`;
    const cx4 = X(368 + 3 * 34 + 16), cy = PY + 70;
    return `<rect width="${W}" height="${H}" fill="#0E0906"/>${C.wood(0, 0, W, H, "#4A3020", "#140C06")}
${C.light(320, 110, 360, "#FFC978", 0.45)}
<rect x="18" y="26" width="604" height="162" fill="#000" opacity=".45" transform="translate(6,8)"/>
<rect x="18" y="26" width="604" height="162" fill="${C.lin([[0, "#F6EFDF"], [1, "#DCCFB4"]], 0, 0, 1, 1)}"/><rect x="18" y="26" width="604" height="162" fill="${C.rad([[0.5, "#000", 0], [1, "#3A2616", 0.25]], 0.5, 0.5, 0.75)}"/>
${plan}
<path class="rb-draw" pathLength="100" d="M${cx4},${PY + 58} L${cx4},${cy} L${sx},${cy} L${sx},${sy}" fill="none" stroke="${RED}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
<g class="rb-fadein" style="--d:2.8s"><circle class="rb-pulse" cx="${sx}" cy="${sy}" r="13" fill="${RED}"/><circle cx="${sx}" cy="${sy}" r="7" fill="${RED}" ${o(2)}/></g>
<g class="rb-slideup" style="--d:3.2s"><rect x="30" y="202" width="580" height="116" rx="4" fill="#0B0C10" fill-opacity=".9" stroke="${GOLD}" stroke-width="1.4"/>
<circle cx="540" cy="260" r="46" fill="${C.rad([[0, "#FFE3A6", 0.35], [1, "#FFE3A6", 0]])}"/><g transform="translate(540,262) scale(.82)">${ICON[KIND[spotKey]] || ICON.notsitz}</g>
${T(52, 230, L("Versteck", "Hiding place").toUpperCase(), 11, 700, RED, "start").replace("<text ", '<text letter-spacing="3" ')}
<text x="52" y="${n2 ? 258 : 266}" font-family="${SERIF}" font-weight="700" font-size="21" fill="${PAPER}">${esc(n1)}</text>${n2 ? `<text x="52" y="282" font-family="${SERIF}" font-weight="700" font-size="21" fill="${PAPER}">${esc(n2)}</text>` : ""}
${T(52, 304, L("kurz nach der Tat", "shortly after the crime"), 13, 500, "#C9BFA9", "start")}</g>
${C.vignette(0.55)}`;
  }) });

  // 6 Gelöst – Akte geschlossen: Täter/in im Abteillicht, Akte mit Büroklammer und Stempel
  const sp = spot.name, [g1, g2] = wrap2(sp);
  scenes.push({ dur: 9, cam: "out", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: svg((C) => `<rect width="${W}" height="${H}" fill="#0C0806"/>${C.wood(0, 0, W, H, "#3E2818", "#120A05", true)}
${nightWin(C, 46, 54, 210, 150, { k: 5, seed: 5, moon: true })}
${C.light(150, 200, 170, "#FFC978", 0.3)}
<g class="rb-fadein" style="--d:.2s"><g class="rb-breathe">${fig(c, 150, 402, 1.3, "#E9A24C")}</g></g>
<path d="M0,300 L640,300 L640,360 L0,360 Z" fill="${C.lin([[0, "#2A0E0E", 0.6], [1, "#000", 0.9]])}"/>
<g class="rb-slidein" style="--d:.6s">
<rect x="298" y="50" width="320" height="260" fill="#000" opacity=".55" filter="${C.blur(6)}"/>
<rect x="290" y="40" width="320" height="260" fill="${C.lin([[0, "#FBF6EA"], [0.6, "#F1EADB"], [1, "#DCCFB4"]], 0, 0, 1, 1)}" ${o(1.5, "#8C7A5A")}/>
<rect x="290" y="40" width="320" height="260" fill="${C.rad([[0, "#FFF4D8", 0.5], [1, "#FFF4D8", 0]], 0.3, 0.2, 0.7)}"/>
<path d="M318,30 L318,74 Q318,84 328,84 Q338,84 338,74 L338,38 Q338,30 331,30 Q324,30 324,38 L324,70" fill="none" stroke="#9CA3AA" stroke-width="3" stroke-linecap="round"/><path d="M318,30 L318,52" stroke="#E6EAEE" stroke-width="1.2"/>
${T(458, 74, L("ERMITTLUNGSAKTE · SOLO 001", "CASE FILE · SOLO 001"), 13, 800, MUTED)}<path d="M310,86 L590,86" ${o(1.4)}/>
${T(310, 108, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}<text x="310" y="130" font-family="${SERIF}" font-weight="800" font-size="21" fill="${INK}">${esc(name)}</text>
${T(310, 154, L("Tatzeit", "Time"), 12, 700, MUTED, "start")}${T(310, 175, s("01:31"), 19, 800, INK, "start")}
${T(310, 198, L("Gemälde", "Painting"), 12, 700, MUTED, "start")}${T(310, 216, g1, 13.5, 700, INK, "start")}${g2 ? T(310, 232, g2, 13.5, 700, INK, "start") : ""}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,290) rotate(-5)"><rect x="-138" y="-28" width="276" height="56" fill="#FBF6EA" fill-opacity=".25" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>
${C.vignette(0.55)}`) });
  scenes.push(endcard({ en, plural: false }));   // Abspann wie bei den Teasern
  return { music: "/assets/audio/rueckblende-solo-nachtzug.m4a", scenes };
}
