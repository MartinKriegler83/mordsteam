// Rückblende (animiertes Finale) Solo 001 „Nachtzug nach Venedig“ – Entscheidung 10.10.2026.
// Sechs Szenen im Graphic-Novel-Stil, je Runde aus den Spieldaten (Täter, Zeitvariante, Versteck).
// Die Bewegung kommt aus CSS-Klassen (rb-*), die der Player (site/spiel/rueckblende.js) mitbringt.
// Rückgabe: { music, scenes: [{ svg, dur, sub, sfx: [[sekunde, "knock"|"plop"|"rustle"|"step"|"stamp"|"sting"], …] }] }
import { INK, PAPER, RED, CARD, MUTED, o, T, defs, fig, face, esc } from "./gn.js";

const W = 640, H = 360, NB = "#101830", GOLD = "#F2C14E";
// Lage der Verstecke im Zugplan (Szene 5): x/y im 640×360-Bild
const SPOTPOS = { regal328: [600, 80], schrank328: [588, 112], regal326: [214, 80], notsitz327: [470, 118], heizung327: [398, 118], schirm325: [96, 80], waesche327: [322, 118] };
const svg = (inner) => { const D = defs(); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${D.svg}${inner(D)}</svg>`; };
const clock = (x, y, time) => `<g transform="translate(${x},${y})"><rect x="-6" y="-24" width="92" height="32" rx="4" fill="${INK}" ${o(2, PAPER)}/>${T(40, -1, time, 20, 800, GOLD)}</g>`;
const stars = (n, seed = 3) => [...Array(n)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 7) * 0.4}s" cx="${(i * 97 + seed * 31) % W}" cy="${(i * 53 + seed * 17) % 150}" r="${i % 3 ? 1 : 1.6}" fill="#E9E2D0" opacity=".8"/>`).join("");
// Viktor Hallwachs (Opfer): grau meliert, Schnurrbart, weinrote Hausjacke
const viktor = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-46,0 L-40,-96 Q0,-122 40,-96 L46,0 Z" fill="#6E1F27" ${o(3)}/><path d="M-12,-104 L0,-84 L12,-104" fill="${PAPER}" ${o(2)}/><g class="rb-nod">${face(RED)}<path d="M-21,-160 Q-22,-188 0,-188 Q22,-188 21,-160 Q12,-176 0,-174 Q-12,-176 -21,-160 Z" fill="#B9B3A8" ${o(2)}/><path d="M-10,-134 Q0,-128 10,-134" stroke="#8E8A82" stroke-width="4" fill="none"/></g></g>`;
const sub = (s) => esc(s);

export function rueckblende(c, v, { en = false, names, spots, timer }) {
  const L = (d, e) => (en ? e : d), s = timer(v);
  const name = names[c], spot = spots[c], spotKey = spot.key;
  const [sx, sy] = SPOTPOS[spotKey] || [470, 118];
  const scenes = [];
  // 1 Titel
  scenes.push({ dur: 5, sfx: [[0.2, "rattle"]], sub: L("Nachtzug nach Venedig. Wagen 327.", "Night train to Venice. Car 327."), svg: svg((D) => `<rect width="${W}" height="${H}" fill="${NB}"/>${stars(40)}<circle cx="540" cy="70" r="26" fill="#E9E2D0"/><circle cx="552" cy="62" r="24" fill="${NB}"/>
<g class="rb-pan-slow"><path d="M-40,250 L80,170 L140,215 L230,140 L310,205 L400,155 L490,215 L570,160 L700,200 L700,270 L-40,270 Z" fill="#1B2440"/></g>
<rect y="268" width="${W}" height="92" fill="#0B1020"/><path d="M0,292 L640,292" stroke="#3A4560" stroke-width="3"/>
<g class="rb-train">${[0, 1, 2, 3].map((i) => `<g transform="translate(${70 + i * 132},236)"><rect width="124" height="52" rx="8" fill="#2B3350" ${o(2.5)}/>${[0, 1, 2, 3].map((k) => i === 2 && k === 1 ? `<rect class="rb-glow" x="${10 + k * 28}" y="12" width="20" height="16" fill="${RED}"/>` : `<rect x="${10 + k * 28}" y="12" width="20" height="16" fill="${GOLD}" opacity=".85"/>`).join("")}${T(62, 46, String(325 + i), 9, 700, "#8A94AE")}</g>`).join("")}</g>
<g class="rb-fadein" style="--d:1s"><rect x="22" y="22" width="300" height="92" fill="${INK}" opacity=".75"/>${T(36, 50, L("NACHTZUG NACH VENEDIG", "NIGHT TRAIN TO VENICE"), 13, 700, RED, "start")}${T(36, 92, L("Was wirklich geschah", "What really happened"), 30, 800, PAPER, "start")}</g>`) });
  // 2 Die Tür
  scenes.push({ dur: 6.5, sfx: [[1.6, "knock"], [1.95, "knock"], [3.1, "creak"]], sub: L(`${s("01:31")} – ${name} klopft an Abteil 4. Viktor öffnet arglos.`, `${s("01:31")} – ${name} knocks at compartment 4. Viktor opens without suspicion.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2A2E3A"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".08"/>
<path d="M0,300 L640,300 L640,360 L0,360 Z" fill="#3B3328"/><path d="M0,300 L640,300" ${o(3)}/>
${[0, 1, 2].map((i) => `<rect x="${30 + i * 120}" y="70" width="90" height="70" fill="#101830" ${o(3)}/><path class="rb-streak" style="--d:${i * 0.3}s" d="M${40 + i * 120},120 L${110 + i * 120},92" stroke="#2B3350" stroke-width="6"/>`).join("")}
<path class="rb-light" d="M396,60 L250,300 L396,300 Z" fill="${RED}"/><rect class="rb-light" x="392" y="60" width="12" height="240" fill="${RED}"/>
<g class="rb-door"><rect x="400" y="60" width="150" height="240" fill="#6B4E2E" ${o(3.5)}/><rect x="414" y="74" width="122" height="120" fill="#4C3720" ${o(2)}/><circle cx="530" cy="190" r="6" fill="${GOLD}" ${o(2)}/><rect x="455" y="100" width="40" height="34" rx="3" fill="${PAPER}" ${o(2)}/>${T(475, 125, "4", 22, 800)}</g>
<g class="rb-walk">${fig(c, 300, 300, 1.15, RED)}</g>
<g class="rb-pop" style="--d:1.6s">${T(452, 52, L("klopf", "knock"), 15, 800, PAPER)}</g><g class="rb-pop" style="--d:1.95s">${T(500, 40, L("klopf", "knock"), 15, 800, PAPER)}</g>
${clock(22, 330, s("01:31"))}`) });
  // 3 Der Cognac
  scenes.push({ dur: 6.5, sfx: [[2.0, "plop"], [2.6, "plop"], [3.2, "plop"]], sub: L("Zehn Tabletten Schlafmittel – im Cognac aufgelöst.", "Ten sleeping pills – dissolved in the cognac."), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#3A2A22"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".07"/>
<rect x="20" y="40" width="200" height="130" fill="#101830" ${o(3)}/><path class="rb-streak" d="M30,150 L210,90" stroke="#2B3350" stroke-width="8"/>
${viktor(150, 330, 1.25)}<rect x="250" y="250" width="380" height="20" fill="#7A5634" ${o(3)}/><rect x="250" y="270" width="380" height="90" fill="#5C4027" ${o(2)}/>
<path d="M430,250 L424,196 Q440,170 456,196 L450,250 Z" fill="#E9E2D0" fill-opacity=".35" ${o(2.5)}/><path d="M426,214 Q440,206 454,214 L452,232 Q440,238 428,232 Z" fill="#B5651D" opacity=".9"/>
<g transform="translate(520,236) rotate(-12)"><rect x="-44" y="-26" width="88" height="52" rx="6" fill="#C9CED4" ${o(2.5)}/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${-30 + i * 15}" cy="-8" rx="5" ry="7" fill="#DCE3E8" ${o(1.4)}/><ellipse cx="${-30 + i * 15}" cy="10" rx="5" ry="7" fill="#DCE3E8" ${o(1.4)}/>`).join("")}</g>
${[0, 1, 2].map((i) => `<circle class="rb-pill" style="--d:${1.6 + i * 0.6}s" cx="440" cy="120" r="4.5" fill="${PAPER}" ${o(1.4)}/>`).join("")}
${clock(22, 330, s("01:34"))}`) });
  // 4 Der Tausch
  scenes.push({ dur: 6, sfx: [[1.2, "rustle"], [3.2, "sting"]], sub: L("„Lagune im Nebel“ – das Original wird zur Rolle, im Rahmen bleibt die Kopie.", "“Lagoon in the Mist” – the original becomes a roll, the copy stays in the frame."), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2B2420"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".07"/>
<g transform="translate(60,60)"><rect width="230" height="170" fill="#9A6F2E" ${o(3.5)}/><rect x="16" y="16" width="198" height="138" fill="#9FB3BC" ${o(2)}/><path d="M16,110 Q80,98 140,106 T214,102 L214,154 L16,154 Z" fill="#6F8791"/><g class="rb-fadein" style="--d:3s">${T(115, 200, L("Kopie", "Copy"), 16, 800, PAPER)}</g></g>
<g class="rb-roll"><g transform="translate(400,190) rotate(-18)"><rect x="-110" y="-22" width="220" height="44" rx="22" fill="#9FB3BC" ${o(3)}/><ellipse cx="110" cy="0" rx="10" ry="22" fill="#6F8791" ${o(2.5)}/><rect x="-20" y="-24" width="14" height="48" fill="${RED}" ${o(2)}/></g></g>
<rect class="rb-flash" style="--d:3.2s" width="${W}" height="${H}" fill="#fff"/>
<g class="rb-fadein" style="--d:3.4s">${T(420, 120, L("Original · 46 cm", "Original · 46 cm"), 16, 800, GOLD)}</g>`) });
  // 5 Das Versteck
  scenes.push({ dur: 7, sfx: [[0.8, "step"], [1.3, "step"], [1.8, "step"], [2.3, "step"], [3.0, "click"]], sub: L(`Die Rolle verschwindet: ${spot.name}.`, `The roll disappears: ${spot.name}.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".25"/>
${[["325", 40], ["326", 170], ["327", 300], ["328", 520]].map(([n, x]) => `<rect x="${x}" y="50" width="${n === "327" ? 200 : 110}" height="96" rx="10" fill="${CARD}" ${o(3)}/>${T(x + (n === "327" ? 100 : 55), 40, n, 15, 800)}`).join("")}
${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${306 + i * 31}" y="58" width="29" height="50" fill="${i === 3 ? "#F4D9D5" : PAPER}" ${o(1.6)}/>${T(320 + i * 31, 88, i ? String(i + 1) : L("D1", "S1"), 10, 700, MUTED)}`).join("")}
<path d="M300,128 L500,128" ${o(1.4)} stroke-dasharray="4 4"/>
<path class="rb-draw" pathLength="100" d="M413,108 L413,128 L${sx},128 L${sx},${sy}" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>
<g class="rb-fadein" style="--d:2.8s"><circle class="rb-pulse" cx="${sx}" cy="${sy}" r="13" fill="${RED}"/><circle cx="${sx}" cy="${sy}" r="7" fill="${RED}" ${o(2)}/></g>
<g class="rb-slideup" style="--d:3.2s"><rect x="40" y="190" width="560" height="120" fill="${INK}"/>${T(60, 230, L("Versteck", "Hiding place"), 13, 700, RED, "start")}${T(60, 266, spot.name, spot.name.length > 44 ? 18 : 22, 800, PAPER, "start")}${T(60, 294, L("kurz nach der Tat", "shortly after the crime"), 14, 600, "#C9BFA9", "start")}</g>`) });
  // 6 Gelöst
  const sp = spot.name.length > 34 ? spot.name.slice(0, 33) + "…" : spot.name;
  scenes.push({ dur: 9, sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${stars(30, 7)}
<g class="rb-fadein" style="--d:.2s">${fig(c, 150, 330, 1.05, RED)}</g>
<g class="rb-slidein" style="--d:.6s"><rect x="290" y="40" width="320" height="252" fill="${PAPER}" ${o(3)}/>${T(450, 74, L("ERMITTLUNGSAKTE · SOLO 001", "CASE FILE · SOLO 001"), 13, 800, MUTED)}<path d="M310,86 L590,86" ${o(1.4)}/>
${T(310, 114, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}${T(310, 136, name, 19, 800, INK, "start")}
${T(310, 164, L("Tatzeit", "Time"), 12, 700, MUTED, "start")}${T(310, 186, s("01:31"), 19, 800, INK, "start")}
${T(310, 214, L("Gemälde", "Painting"), 12, 700, MUTED, "start")}${T(310, 234, sp, 13, 700, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,284) rotate(-6)"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>`) });
  return { music: "/assets/audio/rueckblende-solo.m4a", scenes };
}
