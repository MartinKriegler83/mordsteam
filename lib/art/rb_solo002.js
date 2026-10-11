// Rückblende (animiertes Finale) Solo 002 „Applaus für einen Toten“ – 11.10.2026.
// Sechs Szenen aus den Spieldaten der Runde: Täter, vergifteter Gegenstand (Variante), Tatfenster, Spind und Code.
// Bewegung über die rb-*-Klassen des Players (site/spiel/rueckblende.js).
import { INK, PAPER, RED, CARD, MUTED, SKIN, o, T, defs, face, esc } from "./gn.js";

const W = 640, H = 360, NB = "#14101E", GOLD = "#F2C14E", CURT = "#8E1F2E";
const svg = (inner) => { const D = defs(); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${D.svg}${inner(D)}</svg>`; };
const clock = (x, y, time) => `<g transform="translate(${x},${y})"><rect x="-6" y="-24" width="${time.length > 5 ? 150 : 92}" height="32" rx="4" fill="${INK}" ${o(2, PAPER)}/>${T(time.length > 5 ? 69 : 40, -1, time, 20, 800, GOLD)}</g>`;
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
// Richard Adler als Prospero: Sternenmantel, langer grauer Bart, Stab
const adler = (x, y, s, prop = "") => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-52,0 L-40,-112 Q0,-130 40,-112 L52,0 Z" fill="#23305A" ${o(3)}/>${[[-24, -80], [10, -60], [-8, -30], [26, -96], [30, -24]].map(([a, b]) => `<path d="M${a},${b} l3,6 l-6,0 Z" fill="${GOLD}"/>`).join("")}<path d="M60,4 L54,-210" stroke="#6E4F22" stroke-width="7" stroke-linecap="round"/>${face(RED)}<path d="M-18,-142 Q-22,-96 0,-82 Q22,-96 18,-142 Q8,-128 0,-130 Q-8,-128 -18,-142 Z" fill="#D9D4CA" ${o(2)}/><path d="M-22,-160 Q-24,-190 0,-190 Q24,-190 22,-160 Q12,-176 0,-174 Q-12,-176 -22,-160 Z" fill="#D9D4CA" ${o(2)}/>${prop}</g>`;
// Gegenstände
const ITEM = {
  pokal: () => `<path d="M286,140 Q286,222 320,232 Q354,222 354,140 Z" fill="${GOLD}" ${o(3)}/><path d="M292,150 Q320,160 348,150 L346,170 Q320,178 294,170 Z" fill="#5E2A6E"/><rect x="314" y="232" width="12" height="40" fill="${GOLD}" ${o(2.5)}/><path d="M290,272 L350,272 L340,290 L300,290 Z" fill="${GOLD}" ${o(3)}/>`,
  sekt: () => `<path d="M304,112 L336,112 L332,200 Q320,214 308,200 Z" fill="#E9E2D0" fill-opacity=".35" ${o(2.5)}/><path d="M307,140 L333,140 L331,198 Q320,208 309,198 Z" fill="#E8C76A" opacity=".8"/><path d="M320,210 L320,272" ${o(3)}/><path d="M296,280 Q320,268 344,280" fill="none" ${o(3)}/>${[0, 1, 2, 3].map((i) => `<circle cx="${314 + (i % 2) * 10}" cy="${190 - i * 14}" r="2" fill="#FFF8DD"/>`).join("")}<path d="M310,170 L330,170" stroke="${PAPER}" stroke-width="1.4" stroke-dasharray="2 2"/>`,
  bonbon: () => `<path d="M240,220 Q320,300 400,220 Z" fill="#C9D6DC" fill-opacity=".6" ${o(3)}/><path d="M236,220 L404,220" ${o(3)}/>${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${270 + i * 20}" cy="${212 - (i % 2) * 6}" rx="12" ry="9" fill="#E3A33A" ${o(2)}/>`).join("")}`,
  wasser: () => `<path d="M296,140 L344,140 L338,276 L302,276 Z" fill="#E9E2D0" fill-opacity=".35" ${o(3)}/><path d="M298,176 L342,176 L338,274 L302,274 Z" fill="#9FC3D6" opacity=".6"/>`,
};
const LOCKERS = [1, 3, 5, 7, 9, 12, 15];

const lc = (x) => String(x).charAt(0).toLowerCase() + String(x).slice(1);
const wrap2 = (t, n = 30) => { t = String(t); if (t.length <= n) return [t, ""]; const i = t.lastIndexOf(" ", n); const k = i > 8 ? i : n; const r = t.slice(k).trim(); return [t.slice(0, k).trim(), r.length > n ? r.slice(0, n - 1) + "…" : r]; };
export function rueckblende(c, v, { en = false, names, items, roles, spind, code, item, win }) {
  const L = (d, e) => (en ? e : d), name = names[c];
  const where = { pokal: L("zum Requisitentisch rechts", "to the props table, right"), wasser: L("zum Requisitentisch links", "to the props table, left"), sekt: L("ins Intendanzbüro", "to the director’s office"), bonbon: L("zu Adlers Garderobe", "to Adler’s dressing room") }[item];
  const drink = { pokal: L("Prospero trinkt aus dem Pokal.", "Prospero drinks from the goblet."), sekt: L("In der Pause stößt Adler mit der Intendantin an.", "At the interval Adler raises a glass with the director."), bonbon: L("Vor dem zweiten Teil nimmt Adler zwei Bonbons – wie immer.", "Before the second half Adler takes two lozenges – as always."), wasser: L("Im großen Monolog trinkt Prospero das Glas aus.", "In the great monologue Prospero drains the glass.") }[item];
  const scenes = [];
  // 1 Titel
  scenes.push({ dur: 5, sfx: [[0.3, "sting"]], sub: L("Theater am Kanal. Premiere: „Der Sturm“.", "Theater am Kanal. Opening night: “The Tempest”."), svg: svg((D) => `<rect width="${W}" height="${H}" fill="${NB}"/>${[...Array(30)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 6) * 0.4}s" cx="${(i * 89) % W}" cy="${(i * 41) % 110}" r="1.2" fill="#E9E2D0"/>`).join("")}
<rect x="150" y="90" width="340" height="190" fill="#3A2E2A" ${o(3)}/><path d="M140,90 L320,40 L500,90 Z" fill="#2A211E" ${o(3)}/>${[0, 1, 2, 3].map((i) => `<rect x="${172 + i * 82}" y="180" width="50" height="100" rx="25" fill="${GOLD}" opacity=".85" ${o(2.5)}/>`).join("")}
<g class="rb-glow"><rect x="190" y="112" width="260" height="44" fill="${CURT}" ${o(2.5)}/>${T(320, 141, L("DER STURM · PREMIERE", "THE TEMPEST · OPENING"), 17, 800, GOLD)}</g>
<rect y="280" width="${W}" height="80" fill="#0E1626"/>${[0, 1, 2, 3].map((i) => `<rect class="rb-streak" style="--d:${i * 0.25}s" x="${190 + i * 80}" y="${296 + (i % 2) * 14}" width="40" height="4" fill="${GOLD}" opacity=".5"/>`).join("")}
<g class="rb-fadein" style="--d:1s"><rect x="22" y="22" width="300" height="80" fill="${INK}" opacity=".8"/>${T(36, 46, L("APPLAUS FÜR EINEN TOTEN", "APPLAUSE FOR A DEAD MAN"), 12, 700, RED, "start")}${T(36, 84, L("Was wirklich geschah", "What really happened"), 28, 800, PAPER, "start")}</g>`) });
  // 2 Hinter der Bühne
  scenes.push({ dur: 6.5, sfx: [[0.6, "step"], [1.0, "step"], [1.4, "step"], [2.6, "sting"]], sub: L(`${win[0]} bis ${win[1]} – ${name} schleicht ${where}.`, `${win[0]} to ${win[1]} – ${name} slips ${where}.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#241C24"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".07"/>
<path d="M0,300 L640,300 L640,360 L0,360 Z" fill="#2E2620"/><path d="M0,300 L640,300" ${o(3)}/>
<rect x="430" y="40" width="190" height="260" fill="${CURT}" ${o(3)}/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${448 + i * 36},40 Q${440 + i * 36},170 ${448 + i * 36},300" fill="none" stroke="#5E1520" stroke-width="4"/>`).join("")}
<rect x="40" y="70" width="120" height="70" fill="${PAPER}" ${o(2.5)}/>${T(100, 112, L("PAUSE", "INTERVAL"), 18, 900, RED)}
<path d="M330,0 L330,40" ${o(2)}/><path d="M310,40 L350,40 L340,58 L320,58 Z" fill="${INK}"/><path class="rb-light" d="M320,58 L250,300 L410,300 L340,58 Z" fill="${GOLD}"/>
<g class="rb-walk">${fig(c, 330, 300, 1.12)}<g transform="translate(372,214)"><rect x="-7" y="-20" width="14" height="22" rx="3" fill="#6B3E1E" ${o(2)}/><rect x="-4" y="-27" width="8" height="8" fill="${INK}"/><circle class="rb-glow" cx="3" cy="-8" r="3" fill="${PAPER}"/></g></g>
${clock(22, 330, `${win[0]}–${win[1]}`)}`) });
  // 3 Die Tropfen
  scenes.push({ dur: 6.5, sfx: [[1.7, "plop"], [2.3, "plop"], [2.9, "plop"]], sub: L(`Ein paar Tropfen Fingerhut: ${items[item]}.`, `A few drops of foxglove: ${lc(items[item])}.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2B2420"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".07"/>
<rect x="120" y="290" width="400" height="20" fill="#7A5634" ${o(3)}/><rect x="120" y="310" width="400" height="50" fill="#5C4027" ${o(2)}/>
<g transform="translate(0,${item === "bonbon" ? 70 : 18})">${ITEM[item]()}</g>
<g class="rb-fadein" style="--d:.6s"><g transform="translate(372,72) rotate(-58)"><rect x="-12" y="-34" width="24" height="40" rx="5" fill="#6B3E1E" ${o(2.5)}/><rect x="-6" y="-46" width="12" height="13" fill="${INK}"/><rect x="-10" y="-22" width="20" height="14" fill="${PAPER}" ${o(1.2)}/>${T(0, -12, "☠", 10, 700, RED)}</g></g>
${[0, 1, 2].map((i) => `<path class="rb-pill" style="--d:${1.5 + i * 0.6}s" d="M330,96 q-5,9 0,13 q5,-4 0,-13 Z" fill="#7B4A8C" ${o(1.2)}/>`).join("")}`) });
  // 4 Der Auftritt
  scenes.push({ dur: 7.5, sfx: [[1.2, "sting"], [4.4, "applause"], [6.2, "stamp"]], sub: L(`${drink} Um 22:12, nach dem Schlussapplaus, bricht er hinter dem Vorhang zusammen.`, `${drink} At 22:12, after the final curtain call, he collapses behind the curtain.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#0E0B12"/><path d="M0,290 L640,290 L640,360 L0,360 Z" fill="#4A3524"/><path d="M0,290 L640,290" ${o(3)}/>
<path class="rb-light" style="animation-delay:.2s" d="M320,0 L200,290 L440,290 Z" fill="${GOLD}"/>
<g class="rb-nod" style="animation-delay:5.6s">${adler(320, 290, 1.05, item === "bonbon" ? `<ellipse cx="34" cy="-110" rx="9" ry="7" fill="#E3A33A" ${o(1.6)}/>` : `<path d="M28,-136 L42,-136 L40,-104 L30,-104 Z" fill="${item === "pokal" ? GOLD : "#E9E2D0"}" ${o(2)}/>`)}</g>
<g class="rb-curtL"><rect x="-330" y="0" width="330" height="290" fill="${CURT}" ${o(3)}/></g><g class="rb-curtR"><rect x="640" y="0" width="330" height="290" fill="${CURT}" ${o(3)}/></g>
<rect x="0" y="0" width="${W}" height="36" fill="${CURT}" ${o(3)}/>
<g class="rb-fadein" style="--d:6s">${clock(22, 330, "22:12")}</g>`) });
  // 5 Der Spind
  scenes.push({ dur: 7, sfx: String(code).split("").map((_, i) => [1.4 + i * 0.45, "click"]).concat([[3.6, "click"], [4.2, "stamp"]]), sub: L(`Das Fläschchen verschwindet in Spind ${spind} – Code ${code}.`, `The little bottle disappears into locker ${spind} – code ${code}.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#3A3F48"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".06"/>
${LOCKERS.map((n, i) => `<g transform="translate(${30 + i * 84},40)"><rect width="76" height="250" fill="${n === spind ? "#8A93A0" : "#6E7682"}" ${o(3)}/>${[0, 1, 2].map((k) => `<path d="M14,${24 + k * 8} L62,${24 + k * 8}" ${o(2)}/>`).join("")}<rect x="22" y="70" width="32" height="22" fill="${PAPER}" ${o(1.6)}/>${T(38, 87, String(n), 15, 800)}${n === spind ? `<rect class="rb-glow" x="-4" y="-4" width="84" height="258" fill="none" stroke="${RED}" stroke-width="4"/>` : ""}</g>`).join("")}
<g class="rb-slideup" style="--d:.8s"><rect x="160" y="250" width="320" height="76" rx="6" fill="${INK}" ${o(2, PAPER)}/>${T(320, 274, L(`Spind ${spind} · Code`, `Locker ${spind} · code`), 13, 700, "#C9BFA9")}${String(code).split("").map((d, i) => `<g class="rb-pop2" style="--d:${1.4 + i * 0.45}s">${T(266 + i * 36, 312, d, 30, 900, GOLD)}</g>`).join("")}</g>`) });
  // 6 Akte geschlossen
  scenes.push({ dur: 9, sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>
<g class="rb-fadein" style="--d:.2s">${fig(c, 150, 330, 1.05)}</g>
<g class="rb-slidein" style="--d:.6s"><rect x="290" y="40" width="320" height="252" fill="${PAPER}" ${o(3)}/>${T(450, 74, L("ERMITTLUNGSAKTE · SOLO 002", "CASE FILE · SOLO 002"), 13, 800, MUTED)}<path d="M310,86 L590,86" ${o(1.4)}/>
${T(310, 114, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}${T(310, 136, name, 19, 800, INK, "start")}
${T(310, 164, L("Gift im", "Poison in"), 12, 700, MUTED, "start")}${T(310, 182, wrap2(items[item], 32)[0], 13, 800, INK, "start")}${T(310, 198, wrap2(items[item], 32)[1], 13, 800, INK, "start")}
${T(310, 214, L("Spind · Code", "Locker · code"), 12, 700, MUTED, "start")}${T(310, 236, `${spind} · ${code}`, 19, 800, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,284) rotate(-6)"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>`) });
  return { music: "/assets/audio/rueckblende-solo.m4a", scenes };
}
export const FIGURES002 = FIG;
