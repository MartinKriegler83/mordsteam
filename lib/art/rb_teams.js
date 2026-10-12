// Rückblende (animiertes Finale) Teams – Fall 001 „Die rote Mappe“ und Fall 002 „Eiskalt kassiert“ (11.10.2026).
// Gezeigt von der Spielleitung für alle (Bildschirm teilen/Beamer), danach auf jedem Team-Gerät abrufbar.
// Personen mit Gesicht im Stil der Akten (helfer aus teams002.js: Mann/Frau laut Anrede, Frisur aus dem Namen, Namensschild).
// Paketgrenzen: Basic nur Akt 1; Premium + Szene Mitwisser/Geld; Premium Plus + Szene Finale. Nichts aus Akt 2/Finale in kleineren Paketen.
// v = buildVars(session) – Werte sind HTML-escaped, deshalb un() vor T() (T escaped selbst).
// Kino-Look (11.10.2026): gleiche Szenen/Untertitel/Fakten, neu gezeichnet mit Licht und Tiefe über cine.js.
//   Fall 001: Büro am Abend (Neon, Glas, Stadtlichter), Archiv im Keller mit Arbeitslicht. Fall 002: Vereinsfest am Abend
//   (Zelt, Lichterketten, Grill-Rauch), Leergut hinten dunkel, Kühlanhänger. Untertitel und SVG laufen danach durch render()
//   (Regionalwörter wie Kassa/Bonkassa/Kühlanhänger, Schweizer ss, US-Englisch) – diese Wörter unverändert lassen.
// Frühere Spieltest-Korrekturen, die erhalten bleiben müssen:
//   Fall 001: Catering-Ausgabe gegen Ausweis statt Teeautomat; Archiv = Regale A/B/C × Fächer 1–4 wie das Spurensicherungsfoto
//   (KARTON_PLATZ); KEINE Security-/Wachmann-Figur (die Taschenkontrolle ist nur ein Tisch); Genitiv über gen(); EN „their own badge“;
//   Zugangskarte nur in der Plus-Szene. Fall 002: Währung aus BETRAG_TXT (nie fest €); Lockvogel-Kisten (DECOYS) auf den Paletten;
//   Geldkassette grau #8A8F96; Kistenfarben laut Stapelplan (stapel() in teams002.js); fast alle bei der Tombola (Zelt voll);
//   Titelzeile nicht abgeschnitten. Szenendauer passt sich der Untertitel-Länge an (rueckblendeTeams unten).
import { INK, PAPER, RED, MUTED, SKIN, o, T } from "./gn.js";
import { helfer, cupSvg, trophyOf } from "./teams002.js";
import { cine, MONO, endcard } from "./cine.js";

const W = 640, H = 360, GOLD = "#F2C14E";
const un = (s) => String(s ?? "").replace(/&(amp|lt|gt|quot|#39);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[x]));
const svg = (inner) => { const C = cine(); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${C.wrap(inner)}</svg>`; };
const person = (x, y, s, name, fem, shirt = "#2F3A4F", seed = "") => helfer(x, y, s, shirt, null, name, "down", fem, seed);
const gen = (n) => (/[sßxz]$/i.test(n) ? n + "’" : n + "s");   // Genitiv: „Fuchs’ Tee“, „Annas Tee“
const short = (s, n = 18) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const stars = (n, maxY = 130) => [...Array(n)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 7) * 0.3}s" cx="${(i * 89) % W}" cy="${(i * 41) % maxY + 24}" r="${i % 4 ? 1 : 1.6}" fill="#DCE3EA"/>`).join("");
// Figur mit Gegenlicht und Atmen (Animation auf eigener äußerer <g>)
const fig = (C, x, y, s, name, fem, shirt, glow = "#9FB6E0", seed = "") => `${C.light(x, y - 170 * s, 120 * s, glow, 0.26)}<g class="rb-breathe">${person(x, y, s, name, fem, shirt, seed)}</g>`;
// Stadtlichter hinter Glas (Fall 001)
function city(C, x, y, w, h, k = 1) {
  const cl = C.clip(`M${x},${y} h${w} v${h} h-${w} Z`);
  let b = "", lit = "";
  for (let i = 0, bx = x - 12; bx < x + w; i++) {
    const bw = 30 + ((i * 37 + k * 13) % 38), bh = h * (0.3 + ((i * 53 + k * 7) % 45) / 100), by = y + h - bh;
    b += `<rect x="${bx}" y="${by.toFixed(0)}" width="${bw}" height="${bh.toFixed(0)}" fill="${i % 2 ? "#131A2C" : "#0E1426"}"/>`;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) if ((i * 7 + r * 3 + c * 5 + k) % 4 === 0 && by + 8 + r * 11 < y + h - 4) lit += `<rect x="${bx + 5 + c * 9}" y="${(by + 7 + r * 11).toFixed(0)}" width="4" height="5" fill="${(i + r) % 3 ? "#F2C14E" : "#CFE3F7"}" opacity=".75"/>`;
    bx += bw + 2;
  }
  return `<g clip-path="${cl}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.lin([[0, "#060A16"], [0.65, "#18203C"], [1, "#3C2F4C"]])}"/>${b}${lit}</g>`;
}
// Glasfront mit Sprossen und Spiegelung
const glass = (C, x, y, w, h, step = 160, k = 1) => `${city(C, x, y, w, h, k)}<path d="M${x + w * 0.12},${y + h} L${x + w * 0.3},${y} L${x + w * 0.36},${y} L${x + w * 0.18},${y + h} Z" fill="#DDE8FF" opacity=".05"/>${[...Array(Math.max(0, Math.floor(w / step) - (w % step ? 0 : 1)))].map((_, i) => `<rect x="${x + (i + 1) * step - 3}" y="${y}" width="6" height="${h}" fill="#0A0D14"/>`).join("")}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#0A0D14" stroke-width="7"/>`;
// Neonröhre an der Decke (flackert leicht) mit Lichtkegel
const neon = (C, x, y, w, yb = 300, d = 0) => `<g class="rb-flicker" style="--d:${d}s">${C.cone(x + w / 2, y + 6, w, w * 1.9, yb, "#DCEBFF", 0.16)}<rect x="${x}" y="${y}" width="${w}" height="7" rx="3" fill="#F4FAFF"/>${C.light(x + w / 2, y + 4, w * 0.8, "#CFE3FF", 0.35)}</g><rect x="${x - 6}" y="${y - 4}" width="${w + 12}" height="5" fill="#2A2E36"/>`;
// Rote Mappe (Animationsklasse auf äußerer <g>, fill-box → rb-into skaliert um die eigene Mitte)
const mappe = (x, y, s = 1, cls = "", st = "") => `<g class="${cls}" style="${cls === "rb-into" ? "transform-box:fill-box;transform-origin:center;" : ""}${st}"><g transform="translate(${x},${y}) scale(${s})"><rect x="-30" y="-20" width="68" height="48" rx="3" fill="#000" opacity=".35"/><rect x="-34" y="-24" width="68" height="48" rx="3" fill="${RED}" ${o(2.4)}/><path d="M-32,-22 L32,-22" stroke="#E86A5E" stroke-width="2"/><rect x="-22" y="-12" width="44" height="12" fill="none" stroke="${PAPER}" stroke-width="1.6"/></g></g>`;
const paperSheet = (C, w, h) => `<rect x="4" y="6" width="${w}" height="${h}" fill="#000" opacity=".35"/><rect width="${w}" height="${h}" fill="${C.lin([[0, "#F7F1E3"], [1, "#DED2BA"]], 0, 0, 1, 1)}" ${o(2)}/>`;

// Schlussbild: Person links mit Gegenlicht, Akte rechts (Papier mit Verlauf, Schatten, Büroklammer, Lampenlicht), Stempel
function closing(en, who, fem, shirt, label, rows) {
  const L = (d, e) => (en ? e : d), step = rows.length > 5 ? 32 : rows.length > 4 ? 34 : 40, h = 50 + rows.length * step + 62;
  const y0 = Math.round((H - h) / 2);
  return svg((C) => `${C.sky("#0B0907", "#22180F", "#16110C")}<path d="M0,250 L640,232 L640,360 L0,360 Z" fill="${C.lin([[0, "#3A2818"], [1, "#160F09"]])}"/>
${C.light(150, 120, 230, "#6E86C0", 0.22)}${C.light(470, 40, 330, "#FFC870", 0.3)}
<g class="rb-fadein" style="--d:.2s">${C.light(150, 150, 150, "#FFB860", 0.22)}<g class="rb-breathe">${person(150, 420, 1.5, who, fem, shirt)}</g></g>
<g class="rb-slidein" style="--d:.6s"><g transform="translate(292,${y0}) rotate(1.2 160 ${h / 2})">${paperSheet(C, 320, h)}<rect width="320" height="${h}" fill="${C.rad([[0, "#FFF6DC", 0.5], [1, "#FFF6DC", 0]], 0.3, 0.1, 0.8)}"/>
<path d="M296,-10 L296,34 Q296,44 304,44 Q312,44 312,34 L312,-2 Q312,-8 307,-8 Q302,-8 302,-2 L302,30" fill="none" stroke="#A8ADB4" stroke-width="3" stroke-linecap="round"/>
${T(152, 28, label, 12, 800, MUTED)}<path d="M20,40 L300,40" stroke="${RED}" stroke-width="2"/>
${rows.map(([k, val], i) => `${T(20, 58 + i * step, k, 10.5, 700, MUTED, "start")}${T(20, 76 + i * step, short(val, 30), val.length > 22 ? 14 : 17, 800, INK, "start")}`).join("")}</g></g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(462,${y0 + h - 30}) rotate(-6)"><rect x="-134" y="-26" width="268" height="52" fill="${PAPER}" fill-opacity=".45" stroke="${RED}" stroke-width="5"/><rect x="-126" y="-18" width="252" height="36" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 27 : 23, 900, RED)}</g></g>${C.vignette(0.55)}`);
}

// ---------------------------------------------------------------- Fall 001
export function rueckblende001(v, tier, en) {
  const L = (d, e) => (en ? e : d);
  const t = un(v.T), m = un(v.M || ""), opfer = un(v.OPFER), firma = un(v.FIRMA), schein = un(v.SCHEINFIRMA), raum = un(v.RAUM_TATORT);
  const tf = v.T_HE === "she", mf = v.M_HE === "she", of = v.V_HE === "she", konto = String(v.KONTO), zeit = String(v.TATZEIT);
  const karton = un(v.KARTON), platz = un(v.KARTON_PLATZ);
  const TS = "#2F3A4F", OS = "#7A2A24", MS = "#5E5A52";
  const wall = (C) => C.sky("#121826", "#283040");
  const scenes = [];
  // 1 Titel: Bürohaus am Abend – Glasturm, ein rotes Fenster, Stadtlichter, Straßenlaterne
  scenes.push({ dur: 5, cam: "in", sfx: [[0.4, "sting"]], sub: L(`${firma}. Ein Abend im Büro.`, `${firma}. An evening at the office.`), svg: svg((C) => `${C.sky("#050814", "#3A2C48", "#141A34")}${stars(26, 110)}
${city(C, 0, 150, 640, 170, 3)}
<rect x="300" y="110" width="120" height="220" fill="#0F1628"/>${[...Array(5)].map((_, r) => [...Array(3)].map((_, c) => `<rect x="${312 + c * 36}" y="${126 + r * 38}" width="24" height="22" fill="${(r + c) % 3 ? "#1A2440" : "#C9DDF2"}" opacity="${(r + c) % 3 ? 1 : 0.55}"/>`).join("")).join("")}
<rect x="440" y="44" width="170" height="290" fill="${C.lin([[0, "#22325A"], [0.5, "#152038"], [1, "#0C1324"]], 0, 0, 1, 0)}" ${o(2.5, "#0A0D14")}/>
${[...Array(8)].map((_, r) => [...Array(5)].map((_, c) => { const red = r === 3 && c === 2, lit = (r * 5 + c) % 4 === 0, cool = (r * 3 + c) % 7 === 1; return `<rect x="${452 + c * 31}" y="${58 + r * 33}" width="24" height="22" fill="${red ? RED : lit ? "#F2C14E" : cool ? "#BFD6EE" : "#1B2744"}" ${red ? 'class="rb-glow"' : ""} opacity="${lit || cool ? 0.85 : 1}"/>`; }).join("")).join("")}
${C.light(527, 152, 70, "#FF4A3A", 0.5, "rb-glow")}<path d="M450,334 L520,44 L548,44 L478,334 Z" fill="#DDE8FF" opacity=".05"/>
<rect y="318" width="${W}" height="42" fill="${C.lin([[0, "#151A26"], [1, "#07090E"]])}"/>${[60, 200, 520].map((x) => `<rect x="${x}" y="322" width="40" height="3" fill="#F2C14E" opacity=".25"/>`).join("")}
<path d="M392,330 L392,206 Q392,196 404,196 L420,196" fill="none" stroke="#0A0C12" stroke-width="5"/>${C.cone(420, 200, 14, 120, 330, "#FFD9A0", 0.3)}${C.light(420, 200, 60, "#FFD9A0", 0.6, "rb-flicker")}
${C.fog(300, 0.2, "#8090B8")}
<rect width="460" height="${H}" fill="${C.lin([[0, "#000", 0.55], [1, "#000", 0]], 0, 0, 1, 0)}"/>
${C.title("MORDSTEAM TEAMS", L("Was wirklich geschah", "What really happened"), short(firma, 40), 36, 250)}${C.vignette(0.6)}`) });
  // 2 Das Geld – Büro am Abend, Schreibtischlampe, Monitor mit dem Privatkonto
  scenes.push({ dur: 6.5, cam: "left", sfx: [[0.6, "rustle"], [1.6, "rustle"], [3.2, "plop"]], sub: L(`${t} schleust Firmengeld über „${schein}“ auf das Konto •••• ${konto}. ${opfer} sammelt die Beweise in einer roten Mappe.`, `${t} siphons company money via “${schein}” into account •••• ${konto}. ${opfer} gathers the evidence in a red folder.`), svg: svg((C) => `${wall(C)}${glass(C, 0, 24, 640, 150, 160, 2)}
${neon(C, 380, 26, 140, 250, 0.4)}
<path d="M0,226 L640,226 L640,250 L0,250 Z" fill="${C.lin([[0, "#5A4630"], [1, "#3A2C1E"]])}"/><rect y="250" width="${W}" height="110" fill="${C.lin([[0, "#2A2018"], [1, "#0E0B08"]])}"/><path d="M0,226 L640,226" stroke="#8C6E4E" stroke-width="2"/>
<path d="M150,226 L150,150 L118,96" fill="none" stroke="#15171C" stroke-width="5"/><path d="M96,92 L140,92 L132,74 L104,74 Z" fill="#15171C"/>${C.cone(118, 92, 40, 230, 226, "#FFD9A0", 0.3)}${C.light(118, 180, 150, "#FFC870", 0.3)}
${[0, 1, 2].map((i) => `<g class="rb-slideup" style="--d:${0.3 + i * 0.5}s"><g transform="translate(${40 + i * 26},${70 + i * 22}) rotate(${-4 + i * 3})">${paperSheet(C, 150, 110)}${T(12, 22, L("RECHNUNG", "INVOICE"), 12, 800, INK, "start")}${T(12, 40, short(schein, 22), 10, 700, MUTED, "start")}<path d="M12,56 L120,56 M12,68 L100,68 M12,80 L110,80" stroke="#B9AE98" stroke-width="3"/></g></g>`).join("")}
<path class="rb-draw" pathLength="100" d="M230,150 C280,120 300,120 340,130" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/><path class="rb-fadein" style="--d:2.6s" d="M330,120 L344,131 L328,140" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>
<rect x="440" y="196" width="16" height="30" fill="#15171C"/><rect x="412" y="222" width="72" height="6" rx="2" fill="#15171C"/><rect x="342" y="86" width="212" height="112" rx="6" fill="#0A0C12"/>
<g class="rb-fadein" style="--d:2.6s">${C.light(448, 142, 190, "#4F86E8", 0.4)}<rect x="350" y="94" width="196" height="96" rx="3" fill="${C.lin([[0, "#3A6FC0"], [1, "#1E3F78"]])}"/>${T(366, 120, L("PRIVATKONTO", "PRIVATE ACCOUNT"), 11, 700, PAPER, "start")}<text x="366" y="160" font-family="${MONO}" font-weight="800" font-size="24" fill="${PAPER}">•••• ${konto}</text></g>
${fig(C, 560, 430, 1.3, t, tf, TS, "#6F9BE8")}
<g class="rb-fadein" style="--d:3.6s">${fig(C, 250, 430, 1.2, opfer, of, OS, "#FFC870")}${mappe(330, 330, 0.9)}</g>${C.vignette(0.55)}`) });
  // 3 Der Tee – Ausgabe am Catering gegen Ausweis (wie im Lieferschein Catering)
  scenes.push({ dur: 7, cam: "in", sfx: [[1.0, "click"], [2.3, "plop"], [2.8, "plop"], [3.3, "plop"]], sub: L(`${zeit} – ${t} holt mit dem eigenen Ausweis ${gen(opfer)} Tee am Catering und tropft Herztropfen hinein.`, `${zeit} – ${t} collects ${opfer}’s tea at catering with ${v.T_HIS || "their"} own badge and adds digitalis drops.`), svg: svg((C) => `${wall(C)}${glass(C, 300, 24, 340, 170, 170, 5)}
<rect y="226" width="${W}" height="134" fill="${C.lin([[0, "#3A3833"], [1, "#16150F"]])}"/><path d="M300,226 L640,226" stroke="#000" stroke-opacity=".4" stroke-width="3"/>
${C.cone(145, 74, 240, 300, 210, "#FFD9A0", 0.22)}<rect x="20" y="40" width="250" height="34" fill="#0B0C10" ${o(2, "#3A3330")}/>${T(145, 63, "CATERING", 16, 800, GOLD)}${C.light(145, 57, 150, "#F2C14E", 0.25)}
<g class="rb-breathe">${person(110, 300, 1.0, "", true, "#E9E2D0", "catering")}</g>
<rect x="10" y="200" width="290" height="40" fill="${C.lin([[0, "#A07E58"], [1, "#6E5236"]])}" ${o(3)}/><rect x="20" y="240" width="270" height="120" fill="${C.lin([[0, "#5A4028"], [1, "#24180E"]])}" ${o(2)}/>${[80, 155, 230].map((x) => `<path d="M${x},248 L${x},350" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`).join("")}
<g transform="translate(200,166)"><path d="M-22,34 L22,34 L18,0 L-18,0 Z" fill="${PAPER}" ${o(2)}/><path d="M18,6 q16,4 0,22" fill="none" ${o(2)}/><path d="M-6,0 Q0,-12 6,0" fill="none" ${o(2)}/></g>
${[0, 1].map((i) => `<path class="rb-dust" style="--d:${i * 0.9}s" d="M${196 + i * 8},160 q-8,-12 0,-24 q8,-12 0,-24" fill="none" stroke="#E8E2D4" stroke-width="2" opacity=".5"/>`).join("")}
<g transform="translate(250,150)"><rect width="40" height="50" rx="5" fill="#2A2E3A" ${o(2.2)}/><circle class="rb-pop" style="--d:1s" cx="20" cy="16" r="7" fill="#3FAE4A"/><rect x="8" y="28" width="24" height="14" rx="2" fill="#4A505C"/></g><g class="rb-fadein" style="--d:1s"><g class="rb-fadeout" style="--d:1.6s">${C.light(270, 166, 40, "#3FAE4A", 0.7)}</g></g>
<ellipse cx="400" cy="262" rx="70" ry="10" fill="#7A5A3A" ${o(2)}/><rect x="394" y="268" width="12" height="80" fill="#3A2C1E"/>${C.light(400, 220, 110, "#FFE2A0", 0.22)}
<g transform="translate(400,250)"><path d="M-30,-40 L30,-40 L24,10 L-24,10 Z" fill="${PAPER}" ${o(2.4)}/><path d="M30,-30 q16,6 0,26" fill="none" ${o(2.4)}/><ellipse cx="0" cy="-38" rx="27" ry="5" fill="#B9A15A"/>${T(0, -10, "♥", 14, 800, RED)}</g>
${[0, 1, 2].map((i) => `<path class="rb-dust" style="--d:${i * 0.7}s" d="M${390 + i * 10},204 q-8,-12 0,-22 q8,-12 0,-22" fill="none" stroke="#F1EADB" stroke-width="2.4" opacity=".55"/>`).join("")}
<g transform="translate(400,110)"><rect x="-10" y="-40" width="20" height="34" rx="4" fill="${C.lin([[0, "#7A5232"], [1, "#3A2414"]], 0, 0, 1, 0)}" ${o(2)}/><rect x="-5" y="-50" width="10" height="12" fill="${INK}"/>${[0, 1, 2].map((i) => `<circle class="rb-pill" style="--d:${2.2 + i * 0.5}s" cx="0" cy="8" r="5" fill="${RED}"/>`).join("")}</g>
${fig(C, 540, 430, 1.35, t, tf, TS, "#BFD6EE")}
${C.time(zeit)}${C.vignette(0.55)}`) });
  // 4 19:47 – die Mappe verschwindet (Grundriss wie Tatortfoto: Fenster rechts oben, Schreibtisch quer)
  scenes.push({ dur: 6.5, cam: "right", sfx: [[0.5, "creak"], [2.4, "rustle"], [3.2, "sting"]], sub: L(`19:47 – „${raum}“: ${opfer} liegt bewusstlos am Schreibtisch. ${t} nimmt die rote Mappe.`, `19:47 – “${raum}”: ${opfer} lies unconscious at the desk. ${t} takes the red folder.`), svg: svg((C) => `${C.sky("#141A28", "#2C3242")}<rect y="150" width="${W}" height="80" fill="${C.lin([[0, "#262B36"], [1, "#30353F"]])}"/>
${glass(C, 430, 24, 170, 100, 85, 7)}${C.light(515, 74, 160, "#7F9CD8", 0.2)}
<g transform="translate(40,58)"><rect width="${Math.min(300, short(raum, 34).length * 6.8 + 26)}" height="34" rx="3" fill="${C.lin([[0, "#DCD6C8"], [1, "#A8A294"]])}" ${o(2)}/>${T(13, 22, short(raum, 34), 12, 800, INK, "start")}</g>
<rect x="150" y="120" width="70" height="120" rx="8" fill="${C.lin([[0, "#3A322C"], [1, "#1A1612"]], 0, 0, 1, 0)}" ${o(2.4)}/><path d="M170,262 Q176,196 248,172 L272,190 Q214,206 206,262 Z" fill="${OS}" ${o(2.4)}/>
<rect y="230" width="${W}" height="130" fill="${C.lin([[0, "#3A3833"], [1, "#121110"]])}"/>
<path d="M40,190 L480,190 L510,236 L10,236 Z" fill="${C.lin([[0, "#9C7C58"], [1, "#6E5236"]])}" ${o(3)}/><rect x="10" y="236" width="500" height="16" fill="#5A3E1C" ${o(3)}/><path d="M30,252 L30,330 M490,252 L490,330" ${o(6)}/>
<path d="M420,190 L420,128 L394,104" fill="none" stroke="#15171C" stroke-width="4"/><path d="M374,104 L410,104 L404,90 L380,90 Z" fill="#15171C"/>${C.cone(392, 104, 34, 200, 200, "#FFD9A0", 0.32)}${C.light(330, 186, 150, "#FFC870", 0.32)}
<g transform="rotate(80 120 200)"><path d="M104,188 L136,188 L132,214 L108,214 Z" fill="${PAPER}" ${o(2)}/></g><path d="M120,214 q30,6 60,0" stroke="#B9A15A" stroke-width="3" fill="none" opacity=".7"/>
<path d="M236,190 Q280,176 330,190 L326,204 Q280,194 240,206 Z" fill="${OS}" ${o(2)}/><ellipse cx="334" cy="197" rx="9" ry="6" fill="${SKIN}" ${o(1.6)}/>
<g transform="translate(286,170) rotate(-78)"><ellipse cx="0" cy="0" rx="18" ry="21" fill="${SKIN}" ${o(2.4)}/><path d="M-19,4 Q-22,-24 0,-24 Q22,-24 19,4 Q10,-10 0,-10 Q-10,-10 -19,4 Z" fill="${of ? "#5A3A22" : "#3A2A22"}" ${o(2)}/><path d="M-8,6 L-2,6 M4,6 L10,6" ${o(2)}/></g>
${mappe(330, 176, 0.8, "rb-sneak")}
<g class="rb-walk">${fig(C, 560, 430, 1.3, t, tf, TS, "#7F9CD8")}</g>
${C.tint("#1A2A50", 0.18)}${C.time("19:47")}${C.vignette(0.6)}`) });
  // 5 Kopierraum + Taschenkontrolle (ohne Wachpersonal – nur der Kontrolltisch am Ausgang)
  scenes.push({ dur: 6.5, cam: "left", sfx: [[0.6, "rattle"], [2.4, "rustle"], [3.6, "step"], [4.0, "step"]], sub: L("Der Aktenvernichter ist defekt, nur eine Ecke reißt ab. An den Ausgängen: Taschenkontrolle.", "The shredder is broken – only a corner tears off. And bags are checked at the exits."), svg: svg((C) => `${C.sky("#2A3140", "#465060")}<rect y="250" width="${W}" height="110" fill="${C.lin([[0, "#5E5A52"], [1, "#2A2824"]])}"/><path d="M0,250 L640,250" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
${neon(C, 70, 28, 160, 280, 0)}${neon(C, 380, 28, 140, 280, 1.1)}
<ellipse cx="135" cy="282" rx="90" ry="10" fill="#000" opacity=".35"/><rect x="60" y="100" width="150" height="180" rx="6" fill="${C.lin([[0, "#DAD4C6"], [1, "#9E988A"]], 0, 0, 1, 0)}" ${o(3)}/><rect x="60" y="100" width="150" height="34" fill="#8A877F" ${o(2.5)}/><rect x="84" y="110" width="100" height="7" fill="${INK}"/><circle cx="196" cy="118" r="4" fill="${RED}"/>
<g transform="rotate(-4 135 190)"><rect x="82" y="150" width="106" height="70" fill="#FFE58A" ${o(1.5)}/><text x="135" y="194" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="24" fill="${RED}">${L("DEFEKT", "BROKEN")}</text></g>
${mappe(134, 92, 0.7, "rb-pop2", "--d:.4s")}
<path d="M240,200 L300,200 L294,270 L246,270 Z" fill="${C.lin([[0, "#4A5878"], [1, "#2A3248"]], 0, 0, 1, 0)}" ${o(3)}/><path class="rb-pill" style="--d:2.2s" d="M262,150 L276,140 L286,152 L272,160 Z" fill="${RED}" ${o(1.6)}/>
<g transform="translate(470,0)"><rect x="-70" y="60" width="140" height="210" fill="#141C2C" ${o(3)}/><rect x="-58" y="72" width="116" height="110" fill="${C.lin([[0, "#2E4A3A"], [1, "#16241C"]])}" opacity=".9"/><path d="M-40,182 L-10,72 L4,72 L-26,182 Z" fill="#fff" opacity=".05"/><rect x="40" y="170" width="16" height="6" rx="2" fill="#8A877F"/>
<rect x="-50" y="34" width="100" height="24" rx="3" fill="#0E2A16" ${o(1.6)}/>${T(0, 51, L("AUSGANG", "EXIT"), 15, 800, "#7BD389")}<g class="rb-flicker" style="--d:.6s">${C.light(0, 46, 90, "#5BD07A", 0.4)}</g>
<rect x="-116" y="190" width="92" height="12" fill="#3A3E4A" ${o(2)}/><path d="M-108,202 L-108,270 M-32,202 L-32,270" ${o(4)}/><rect x="-126" y="206" width="112" height="22" rx="2" fill="#0B0C10" ${o(1.4, "#5A4630")}/>${T(-70, 221, L("TASCHENKONTROLLE", "BAG CHECK"), 10.5, 800, GOLD)}
<g class="rb-fadein" style="--d:3.2s"><path d="M-96,190 L-44,190 L-50,160 L-90,160 Z" fill="#5A4030" ${o(2)}/><path d="M-82,160 Q-70,144 -58,160" fill="none" ${o(2.4)}/><circle cx="-70" cy="142" r="12" fill="#DCE8FF" fill-opacity=".2" stroke="${GOLD}" stroke-width="3"/><path d="M-62,150 L-52,162" stroke="${GOLD}" stroke-width="4"/></g></g>
${C.tint("#3A5A70", 0.14)}${C.vignette(0.55)}`) });
  // 6 Archiv 19:56 – Regale A/B/C mit je 4 Fächern wie auf dem Spurensicherungsfoto; Platz aus KARTON_PLATZ. Keller, nacktes Arbeitslicht.
  const pm = platz.match(/([ABC])\D+(\d)/) || [, "B", "2"], ri = "ABC".indexOf(pm[1]), fi = Number(pm[2]) - 1;
  const ax = (r) => 130 + r * 125, ay = (f) => 62 + f * 62, tx = ax(ri) + 61, ty = ay(fi) + 28;
  scenes.push({ dur: 7, cam: "in", sfx: [[0.6, "step"], [1.0, "step"], [2.6, "rustle"], [3.4, "click"]], sub: L(`19:56 – Archiv: Die Mappe landet in Karton ${karton} (${platz}). Rot markiert: Schredder am Freitag, 12:00.`, `19:56 – archive: the folder goes into box ${karton} (${platz}). Red label: shredding on Friday at 12:00.`), svg: svg((C) => `${C.sky("#101116", "#24252B")}${[0, 1, 2, 3, 4, 5].map((r) => `<path d="M0,${40 + r * 46} L640,${40 + r * 46}" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>`).join("")}<path d="M0,26 L640,26" stroke="#3A3C44" stroke-width="8"/><path d="M0,40 L640,40" stroke="#5A5C64" stroke-width="5" opacity=".6"/>
<rect y="306" width="${W}" height="54" fill="${C.lin([[0, "#2A2A2E"], [1, "#0E0E10"]])}"/>
${C.light(372, 78, 320, "#FFD49A", 0.32, "rb-flicker")}
${[0, 1, 2].map((r) => `<rect x="${ax(r)}" y="56" width="110" height="250" fill="${C.lin([[0, "#7A7066"], [1, "#4E463F"]], 0, 0, 1, 0)}" ${o(2.5)}/>${T(ax(r) + 55, 50, L("REGAL ", "SHELF ") + "ABC"[r], 12, 800, "#F2E7B8")}${[0, 1, 2, 3].map((f) => { const hi = r === ri && f === fi; return `<rect x="${ax(r) + 5}" y="${ay(f)}" width="100" height="54" fill="#2A2420"/><rect x="${ax(r)}" y="${ay(f) + 54}" width="110" height="6" fill="#8A7E70"/>${T(ax(r) + 11, ay(f) + 14, String(f + 1), 10, 700, "#F2E7B8")}<rect x="${ax(r) + 20}" y="${ay(f) + 6}" width="82" height="46" fill="${C.lin([[0, "#D4B488"], [1, "#A88A5E"]])}" ${o(2)}/><rect x="${ax(r) + 32}" y="${ay(f) + 20}" width="58" height="17" fill="${PAPER}" ${o(1.2)}/>${hi ? T(ax(r) + 61, ay(f) + 32, short(karton, 9), 10, 800) + `<circle class="rb-fadein" style="--d:3.4s" cx="${ax(r) + 96}" cy="${ay(f) + 28}" r="6" fill="#C8342A" ${o(1.4)}/>` : `<path d="M${ax(r) + 42},${ay(f) + 29} L${ax(r) + 80},${ay(f) + 29}" stroke="#9C978D" stroke-width="3"/>`}`; }).join("")}`).join("")}
<path d="M372,22 L372,66" stroke="#111" stroke-width="2"/><rect x="366" y="62" width="12" height="8" fill="#3A3A3A"/><circle cx="372" cy="76" r="8" fill="#FFF2C8"/>${C.cone(372, 80, 20, 430, 306, "#FFE2A8", 0.2, "rb-flicker")}
${C.dust(250, 100, 240, 190, 16)}
<g class="rb-fadein" style="--d:3.4s"><rect x="${ax(ri) + 2}" y="${ay(fi) - 2}" width="106" height="58" fill="none" stroke="${RED}" stroke-width="4"/><g transform="translate(22,70) rotate(-3)"><rect width="92" height="52" fill="${RED}" ${o(2)}/>${T(46, 22, L("Fr 12:00", "Fri 12:00"), 13, 800, PAPER)}${T(46, 40, L("Schredder", "shredder"), 12, 700, PAPER)}</g></g>
${mappe(560, 240, 0.8, "rb-into", `--d:1.6s;--x:${tx - 562}px;--y:${ty - 242}px`)}
${fig(C, 562, 440, 1.25, t, tf, TS, "#FFD49A")}
${C.time("19:56")}${C.tint("#5A3A1A", 0.12)}${C.vignette(0.7)}`) });
  // Premium: Mitwisser und Schließfach (links Büro warm, rechts Schließfächer am Bahnhof kalt)
  if (tier >= 1) {
    const fach = String(v.FACH), bf = en ? `${un(v.STADT)} ${un(v.HBF)}` : `${un(v.HBF)} ${un(v.STADT)}`;
    scenes.push({ dur: 7, cam: "right", sfx: [[0.8, "stamp"], [2.6, "rustle"], [4.2, "click"]], sub: L(`${m} hat die Scheinrechnungen durchgewunken – und einen Anteil bekommen. Der Rest liegt im Schließfach ${fach}, ${bf}.`, `${m} waved the fake invoices through – and got a share. The rest is in locker ${fach}, ${bf}.`), svg: svg((C) => `${C.sky("#1E1812", "#2E2418")}${C.light(110, 60, 260, "#FFC870", 0.3)}
<path d="M380,0 L640,0 L640,360 L340,360 Z" fill="${C.lin([[0, "#1A2230"], [1, "#2E3846"]])}"/>${[0, 1, 2, 3, 4, 5, 6].map((r) => `<path d="M${380 - r * 6},${r * 52} L640,${r * 52}" stroke="#000" stroke-opacity=".2" stroke-width="1.5"/>`).join("")}<path d="M380,0 L340,360" stroke="#000" stroke-width="6" opacity=".6"/>
${neon(C, 440, 26, 140, 300, 0.3)}
<g transform="translate(40,40) rotate(-3)">${paperSheet(C, 150, 110)}${T(12, 22, L("RECHNUNG", "INVOICE"), 12, 800, INK, "start")}${T(12, 40, short(schein, 22), 10, 700, MUTED, "start")}<path d="M12,56 L120,56 M12,68 L100,68" stroke="#B9AE98" stroke-width="3"/></g>
<g class="rb-stamp" style="--d:.8s"><g transform="translate(118,118) rotate(-10)"><rect x="-62" y="-16" width="124" height="32" fill="none" stroke="#2E7D3A" stroke-width="3"/>${T(0, 6, L("FREIGEGEBEN", "APPROVED"), 14, 900, "#2E7D3A")}</g></g>
${fig(C, 130, 430, 1.3, m, mf, MS, "#FFC870")}
<g class="rb-fadein" style="--d:2.2s"><g transform="translate(290,160)"><rect x="-37" y="-22" width="80" height="52" rx="4" fill="#000" opacity=".35"/><rect x="-40" y="-26" width="80" height="52" rx="4" fill="${C.lin([[0, "#DCC48C"], [1, "#B09A62"]])}" ${o(2.4)}/><path d="M-40,-26 L0,4 L40,-26" fill="none" ${o(2)}/>${T(0, 46, L("Donnerstag, Mittag", "Thursday, lunchtime"), 11, 700, PAPER)}</g></g>
<g class="rb-fadein" style="--d:3.6s"><g transform="translate(410,40)"><rect x="6" y="8" width="200" height="250" fill="#000" opacity=".4"/><rect width="200" height="250" fill="${C.lin([[0, "#9EA3A8"], [1, "#6E7378"]], 0, 0, 1, 0)}" ${o(3)}/>${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => { const hi = r === 2 && c === 1; return `<rect x="${12 + c * 62}" y="${12 + r * 58}" width="52" height="48" fill="${hi ? RED : C.lin([[0, "#C9C6BE"], [1, "#9C988F"]])}" ${o(1.8)}/><rect x="${16 + c * 62}" y="${28 + r * 58}" width="5" height="14" rx="2" fill="#4A4E54"/>`; }).join("")).join("")}${C.light(105, 152, 70, "#FF5A48", 0.35, "rb-glow")}${T(105, 166, fach, 13, 800, PAPER)}${T(100, 274, short(bf, 26), 12, 700, PAPER)}</g></g>${C.vignette(0.6)}`) });
  }
  // Premium Plus: ARIA-Notiz, PIN, Anteil im Koffer (Zugangskarte des Opfers nur hier)
  if (tier >= 2) {
    scenes.push({ dur: 7, cam: "in", sfx: [[0.8, "click"], [1.6, "beep"], [3.4, "click"], [4.6, "sting"]], sub: L(`Mit ${gen(opfer)} Zugangskarte speichert ${t} die PIN in ARIA – Kennwort: Raum ${un(v.ROOM_NEU)}. ${gen(m)} Anteil: ${un(v.ANTEIL_TXT)}.`, `With ${opfer}’s access card, ${t} saves the PIN in ARIA – password: ${un(v.ROOM_NEU)}. ${m}’s share: ${un(v.ANTEIL_TXT)}.`), svg: svg((C) => `${C.sky("#070A14", "#141A2A")}${glass(C, 330, 24, 310, 120, 155, 9)}
<rect y="270" width="${W}" height="90" fill="${C.lin([[0, "#2A2018"], [1, "#0C0906"]])}"/><path d="M0,270 L640,270" stroke="#5A4630" stroke-width="2"/>
${C.light(235, 180, 230, "#8FB4FF", 0.35)}
<g transform="translate(150,30)"><rect x="6" y="8" width="170" height="300" rx="22" fill="#000" opacity=".45"/><rect width="170" height="300" rx="22" fill="#1A1A1E" ${o(3, "#4A505C")}/><rect x="12" y="34" width="146" height="236" rx="6" fill="${C.lin([[0, "#F2F6FA"], [1, "#D6DEE8"]])}"/>${T(85, 62, "ARIA", 18, 900, "#2E5FA8")}
<rect x="24" y="84" width="122" height="56" rx="6" fill="#FFFFFF" ${o(1.4, "#9C978D")}/>${T(34, 104, L("Geschützte Notiz", "Protected note"), 11, 800, INK, "start")}${T(34, 126, "🔒 " + short(L("Raum ", "") + un(v.ROOM_NEU), 15), 11, 700, MUTED, "start")}
<g class="rb-fadein" style="--d:3s"><rect x="24" y="156" width="122" height="62" rx="6" fill="#FFF7D6" ${o(1.4, "#C9A44A")}/>${T(85, 178, "PIN", 11, 800, MUTED)}<text x="85" y="206" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="24" fill="${INK}">${String(v.PIN || "")}</text></g></g>
<g class="rb-slideup" style="--d:.4s"><g transform="translate(334,140) rotate(-6)"><rect x="4" y="5" width="110" height="68" rx="6" fill="#000" opacity=".4"/><rect width="110" height="68" rx="6" fill="${C.lin([[0, "#F6F1E6"], [1, "#D8D0C0"]])}" ${o(2)}/><rect x="10" y="10" width="90" height="22" fill="#2E5FA8"/>${T(55, 26, "ID", 12, 800, PAPER)}${T(55, 52, short(opfer, 16), 9.5, 700, INK)}<rect x="10" y="58" width="40" height="4" fill="#9C978D"/></g></g>
<g class="rb-fadein" style="--d:4.2s"><g transform="translate(526,268)">${C.shadow(0, 54, 90, 8, 0.6)}<rect x="-84" y="-60" width="168" height="112" rx="10" fill="${C.lin([[0, "#6E5038"], [1, "#3A2818"]])}" ${o(3)}/><path d="M-26,-60 Q0,-86 26,-60" fill="none" ${o(5)}/><path d="M-84,-28 L84,-28" stroke="#000" stroke-opacity=".3" stroke-width="2"/>${C.light(0, -4, 70, GOLD, 0.3)}${T(0, 0, short(un(v.ANTEIL_TXT), 12), 20, 900, GOLD)}${T(0, 30, L("Koffer: ", "case: ") + short(m, 16), 11, 700, PAPER)}</g></g>
${C.time("20:48")}${C.vignette(0.6)}`) });
  }
  // Schluss: Akte
  const rows = [[L("Täter/in", "Culprit"), t], [L("Gift im Tee", "Poison in the tea"), zeit], [L("Konto", "Account"), "•••• " + konto], [L("Rote Mappe", "Red folder"), karton]];
  if (tier >= 1) rows.push([L("Mitwisser/in · Schließfach", "Accomplice · locker"), `${m} · ${v.FACH}`]);
  if (tier >= 2) rows.push(["PIN", String(v.PIN || "")]);
  scenes.push({ dur: 9, cam: "none", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: closing(en, t, tf, TS, L("ERMITTLUNGSAKTE · DIE ROTE MAPPE", "CASE FILE · THE RED FOLDER"), rows) });
  return scenes;
}

// ---------------------------------------------------------------- Fall 002
const BAND = { rot: "#D23A2E", gelb: "#F2C94C", blau: "#2E6FD2", gruen: "#3FAE4A", grün: "#3FAE4A", red: "#D23A2E", yellow: "#F2C94C", blue: "#2E6FD2", green: "#3FAE4A" };
// Nachthimmel über dem Festgelände mit Baumreihe
const night = (C, k = 24) => `${C.sky("#050914", "#1C2238", "#0E1428")}${stars(k, 100)}<path d="M0,250 Q30,200 60,232 Q90,190 130,228 Q170,196 200,236 L200,300 L0,300 Z M440,240 Q480,196 520,230 Q560,188 600,226 Q620,210 640,220 L640,300 L440,300 Z" fill="#0A0F14"/>`;
const ground = (C, y = 290) => `<rect y="${y}" width="${W}" height="${H - y}" fill="${C.lin([[0, "#1A2416"], [1, "#070A06"]])}"/><path d="M0,${y} L640,${y}" stroke="#000" stroke-opacity=".4" stroke-width="3"/>`;
// Lichterkette: Draht mit Glühbirnen (funkeln)
function garland(x1, y1, x2, y2, n = 9, sag = 24, d0 = 0) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag * 2;
  const pt = (t) => [(1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2];
  return `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="#0A0A0A" stroke-width="1.5"/>${[...Array(n)].map((_, i) => { const [x, y] = pt((i + 0.5) / n); return `<g class="rb-twinkle" style="--d:${((i + d0) % 6) * 0.35}s"><circle cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="7" fill="#FFD27A" opacity=".28"/><circle cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="3" fill="#FFE9B0"/></g>`; }).join("")}`;
}
// Festzelt: Giebel vorn, leuchtende Plane, offener Eingang (optional voll Leute), Lichterkette an der Traufe
function tent(C, x, y, w, h, crowd = false) {
  const e = y + h * 0.3, dx = w * 0.3, dw = w * 0.4;
  const people = crowd ? [...Array(10)].map((_, i) => `<ellipse cx="${x + dx + 8 + i * (dw - 16) / 9}" cy="${y + h - 4}" rx="${dw / 22}" ry="${h * 0.16}" fill="#2A1E14"/><circle cx="${x + dx + 8 + i * (dw - 16) / 9}" cy="${y + h - h * 0.2 - (i % 3) * 3}" r="${dw / 30}" fill="#2A1E14"/>`).join("") : "";
  return `${C.light(x + w / 2, y + h * 0.6, w * 0.75, "#FFB860", 0.3)}<path d="M${x},${e} L${x + w / 2},${y} L${x + w},${e} L${x + w},${y + h} L${x},${y + h} Z" fill="${C.lin([[0, "#F4E6C8"], [1, "#C8A878"]])}" ${o(2.5, "#2A2014")}/>
<path d="M${x + w * 0.25},${y + h * 0.15} L${x + w * 0.25},${y + h} M${x + w * 0.75},${y + h * 0.15} L${x + w * 0.75},${y + h}" stroke="#B8986A" stroke-width="3"/>
<rect x="${x + dx}" y="${y + h * 0.45}" width="${dw}" height="${h * 0.55}" fill="${C.lin([[0, "#FFD48A"], [1, "#E09A48"]])}"/>${people}<path d="M${x + dx},${y + h * 0.45} Q${x + dx + 14},${y + h * 0.75} ${x + dx},${y + h} M${x + dx + dw},${y + h * 0.45} Q${x + dx + dw - 14},${y + h * 0.75} ${x + dx + dw},${y + h}" stroke="#C8A878" stroke-width="10" fill="none"/>
${garland(x, e + 6, x + w / 2, y + 8, 5, 6)}${garland(x + w / 2, y + 8, x + w, e + 6, 5, 6, 3)}`;
}
// Kühlanhänger (gleiche Maße wie bisher: Tür bei x+150..x+202, y+18..y+114)
const trailer = (C, x, y) => `<g transform="translate(${x},${y})">${C.shadow(110, 150, 140, 10, 0.6)}<path d="M-30,110 L0,104" stroke="#2A2E36" stroke-width="5"/><rect width="220" height="130" fill="${C.lin([[0, "#E6EAEE"], [1, "#9EA6AE"]])}" ${o(3)}/>${[30, 60, 90, 120].map((xx) => `<path d="M${xx},4 L${xx},126" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`).join("")}<rect y="122" width="220" height="8" fill="#5A6068"/><rect x="150" y="18" width="52" height="96" fill="${C.lin([[0, "#CDD3D9"], [1, "#9EA6AE"]])}" ${o(2.4)}/><rect x="192" y="60" width="6" height="16" rx="2" fill="#4A505C"/>${T(110, -8, "❄", 22, 700, "#7FA6C6")}<circle cx="40" cy="146" r="16" fill="${INK}" ${o(2, "#4A505C")}/><circle cx="180" cy="146" r="16" fill="${INK}" ${o(2, "#4A505C")}/><circle cx="40" cy="146" r="6" fill="#5A6068"/><circle cx="180" cy="146" r="6" fill="#5A6068"/></g>`;
// Grill mit Rauch (ein Blur)
const grill = (C, x, y) => `<rect x="${x - 34}" y="${y - 24}" width="68" height="20" rx="4" fill="#2A2A2E" ${o(2)}/><path d="M${x - 24},${y - 4} L${x - 30},${y + 40} M${x + 24},${y - 4} L${x + 30},${y + 40}" ${o(4)}/>${C.light(x, y - 24, 46, "#FF7A30", 0.55, "rb-flicker")}<g filter="${C.blur(8)}" opacity=".32">${[0, 1, 2].map((i) => `<g class="rb-drift" style="animation-delay:-${i * 3}s"><ellipse cx="${x - 10 + i * 20}" cy="${y - 50 - i * 36}" rx="${26 + i * 12}" ry="${14 + i * 5}" fill="#C9C2B4"/></g>`).join("")}</g>`;
export function rueckblende002(v, tier, en) {
  const L = (d, e) => (en ? e : d);
  const t = un(v.T), m = un(v.M || ""), opfer = un(v.OPFER), verein = un(v.FIRMA), fest = un(v.FEST || ""), r1 = un(v.R1 || "");
  const tf = v.T_HE === "she", mf = v.M_HE === "she", of = v.V_HE === "she", zeit = String(v.TATZEIT), pin = String(v.P_IN_T);
  const farbe = BAND[String(v.FARBE || "").toLowerCase()] || "#3FAE4A", fword = un(v.FARBE || "");
  const TS = "#3F5A35", OS = "#7A2A24", MS = "#8C6E4E", BOX = "#8A8F96";
  const cur = (un(v.BETRAG_TXT).match(/[^\d\s.,'’-]+/) || ["€"])[0];   // Währung der Runde (€, CHF, £, $ …)
  const box = (x, y) => `<rect x="${x}" y="${y}" width="44" height="24" rx="3" fill="${BOX}" ${o(2)}/><rect x="${x + 4}" y="${y + 3}" width="36" height="5" fill="#fff" opacity=".2"/><rect x="${x + 16}" y="${y + 10}" width="12" height="5" fill="${INK}"/>`;
  const scenes = [];
  // 1 Titel: Fest am Abend – Zelt leuchtet, Lichterketten, Grill-Rauch, Kühlanhänger
  scenes.push({ dur: 5, cam: "in", sfx: [[0.3, "applause"]], sub: L(`${verein} – ${fest}. Ein langer Abend.`, `${verein} – ${fest}. A long night.`), svg: svg((C) => `${night(C, 30)}${ground(C, 296)}
${trailer(C, 40, 166)}${tent(C, 340, 150, 280, 150)}${garland(220, 150, 340, 196, 6, 14, 2)}
${grill(C, 300, 280)}${C.light(480, 300, 200, "#FFB860", 0.18)}
<rect width="${W}" height="150" fill="${C.lin([[0, "#000", 0.5], [1, "#000", 0]])}"/>
${C.title("MORDSTEAM TEAMS", L("Was wirklich geschah", "What really happened"), short(verein, 40), 36, 96)}${C.vignette(0.6)}`) });
  // 2 Die Bons – im Zelt an der Bonkassa
  scenes.push({ dur: 6.5, cam: "left", sfx: [[0.6, "rustle"], [1.6, "click"], [3.0, "plop"]], sub: L(`${t} bringt nachgedruckte Bons über die Bonkassa in Umlauf und kassiert. ${opfer} zählt mit: Es fehlen ${un(v.BETRAG_TXT)}.`, `${t} sells reprinted tokens through the token till and pockets the money. ${opfer} keeps count: ${un(v.BETRAG_TXT)} is missing.`), svg: svg((C) => `${C.sky("#3A2A18", "#1A120A")}${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${i * 128},0 L${i * 128 + 20},300" stroke="#000" stroke-opacity=".18" stroke-width="3"/>`).join("")}<path d="M0,0 L640,0 L640,40 Q320,70 0,40 Z" fill="#2A1C10"/>
${garland(0, 30, 330, 40, 8, 14)}${garland(330, 40, 640, 26, 8, 14, 4)}${C.light(320, 120, 360, "#FFB860", 0.25)}
<rect y="300" width="${W}" height="60" fill="${C.lin([[0, "#2A1E12"], [1, "#0C0804"]])}"/>
<rect x="60" y="210" width="300" height="30" fill="${C.lin([[0, "#A07E58"], [1, "#6E5236"]])}" ${o(3)}/><rect x="80" y="240" width="260" height="120" fill="${C.lin([[0, "#5A4028"], [1, "#1E140A"]])}" ${o(2)}/>${C.light(210, 200, 150, "#FFD48A", 0.25)}
${[...Array(7)].map((_, i) => `<g class="rb-slideup" style="--d:${0.3 + i * 0.25}s"><g transform="translate(${90 + i * 36},${150 - (i % 2) * 14}) rotate(${-8 + i * 3})"><rect x="2" y="3" width="40" height="56" fill="#000" opacity=".3"/><rect width="40" height="56" fill="${i % 3 ? "#F2C94C" : "#F7DA7A"}" ${o(1.6)}/><path d="M4,8 L36,8" stroke="#000" stroke-opacity=".2" stroke-dasharray="2 2"/>${T(20, 32, L("BON", "TOKEN"), en ? 8 : 10, 800, INK)}</g></g>`).join("")}
${fig(C, 470, 430, 1.3, t, tf, TS, "#FFC870")}<g class="rb-fadein" style="--d:2.6s"><rect x="510" y="300" width="40" height="22" fill="#3FAE4A" ${o(1.4)}/>${T(530, 316, cur, cur.length > 1 ? 10 : 14, 800, INK)}</g>
<g class="rb-fadein" style="--d:3.4s"><g transform="translate(40,34) rotate(-3)">${paperSheet(C, 190, 96)}<text x="16" y="34" font-family="Caveat, cursive" font-weight="600" font-size="20" fill="#1F2A6B">${L("Strichliste", "Tally")} ||||  ||||  |||</text><text x="16" y="74" font-family="Caveat, cursive" font-weight="600" font-size="22" fill="${RED}">− ${short(un(v.BETRAG_TXT), 10)}</text></g></g>${C.vignette(0.55)}`) });
  // 3 Die Kassa am Stehtisch – Hof bei Nacht, Opfer geht zum Kühlanhänger
  scenes.push({ dur: 6.5, cam: "right", sfx: [[0.8, "step"], [1.2, "step"], [2.6, "creak"]], sub: L(`${pin} – ${opfer} stellt die Festkassa auf den Stehtisch und geht in den Kühlanhänger, Getränke zählen.`, `${pin} – ${opfer} leaves the cash box on the standing table and goes into the trailer to count drinks.`), svg: svg((C) => `${night(C, 20)}${ground(C)}
${C.light(40, 220, 200, "#FFB860", 0.22)}${garland(0, 60, 300, 80, 8, 16)}${garland(300, 80, 640, 50, 8, 16, 3)}
${trailer(C, 300, 140)}<rect class="rb-light" x="450" y="158" width="52" height="96" fill="${GOLD}"/><g class="rb-light">${C.light(476, 250, 120, "#FFD48A", 0.6)}</g>
<g transform="translate(150,226)">${C.shadow(0, 72, 50, 6)}<rect x="-6" y="0" width="12" height="70" fill="#5A4030" ${o(2)}/><ellipse cx="0" cy="0" rx="50" ry="10" fill="${C.lin([[0, "#A07E58"], [1, "#6E5236"]])}" ${o(2.4)}/>${box(-22, -26)}</g>${C.light(150, 210, 60, "#FFE2A8", 0.25)}
<g class="rb-sneak">${fig(C, 262, 440, 1.3, opfer, of, OS, "#FFC870")}</g>
${C.time(pin)}${C.tint("#1A2A50", 0.15)}${C.vignette(0.6)}`) });
  // 4 Tatzeit: fast alle bei der Tombola (Zelt voll); Tür verriegelt, Schnellkühlen, Kassette weg, Bändchen im Türspalt
  scenes.push({ dur: 7, cam: "out", sfx: [[0.4, "applause"], [1.6, "click"], [2.2, "beep"], [2.5, "beep"], [3.4, "rustle"]], sub: L(`${zeit} – Tombola. ${t} verriegelt die Tür, stellt auf Schnellkühlen, nimmt die Kassa. Ein ${fword}es Bändchen bleibt im Türspalt.`, `${zeit} – raffle time. ${t} bolts the door, sets rapid cooling, takes the cash box. A ${fword} wristband catches in the door.`), svg: svg((C) => `${night(C, 16)}${ground(C)}
${tent(C, -60, 130, 260, 160, true)}<rect x="22" y="96" width="120" height="26" rx="3" fill="#0B0C10" ${o(1.6, "#5A4630")}/>${T(82, 115, L("TOMBOLA", "RAFFLE"), 14, 800, GOLD)}${C.light(82, 108, 80, GOLD, 0.25)}
${trailer(C, 260, 130)}<rect x="410" y="148" width="52" height="96" fill="${C.lin([[0, "#CDD3D9"], [1, "#9EA6AE"]])}" ${o(2.4)}/>
<g class="rb-bolt"><rect x="452" y="190" width="40" height="12" rx="3" fill="#8A877F" ${o(2)}/></g>
<g transform="translate(560,170)"><path d="M-44,0 L-58,0" stroke="#4A505C" stroke-width="4"/><rect x="-44" y="-36" width="88" height="72" rx="6" fill="#0B0E14" ${o(2, PAPER)}/>${T(0, -20, L("KÜHLUNG", "COOLING"), 9.5, 800, "#8A94AE")}<g class="rb-fadeout" style="--d:2.4s"><text x="0" y="10" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="19" fill="${GOLD}">+4 °C</text></g><g class="rb-fadein" style="--d:2.6s">${C.light(0, 4, 60, "#7BC6FF", 0.45)}<text x="0" y="10" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="19" fill="#7BC6FF">−2 °C</text>${T(0, 27, L("SCHNELLKÜHLEN", "RAPID COOLING"), 8.5, 800, "#7BC6FF")}</g></g>
<g class="rb-fadein" style="--d:3.6s"><path d="M462,236 l20,6 l-3,9 l-20,-6 Z" fill="${farbe}" ${o(1.4)}/>${C.light(470, 240, 24, farbe, 0.5)}</g>
<g class="rb-sneak">${fig(C, 330, 440, 1.25, t, tf, TS, "#9FB6E0")}${box(356, 330)}</g>
${C.time(zeit)}${C.tint("#1A2A50", 0.12)}${C.vignette(0.6)}`) });
  // 5 Leergut 23:20 – hinten dunkel, Paletten wie im Stapelplan (Farben je Marke, Lockvogel-Kisten DECOYS), Kassette in die falsche Kiste
  const pa = Number(v.PA) || 1, la = Number(v.LA) || 1, br = v.PAL_BRAND || [0, 0, 0, 0, 0, 0];
  const COL = ["#8C5A2A", "#E9C84A", "#3E7CC0"], first = pa <= 3 ? 1 : 4, left = first === 1;
  const px = (q) => 205 + (q - first) * 100, ly = (l) => 286 - l * 32;   // Lage 1 unten · Lage 5 oben (wie im Stapelplan)
  const tx = px(pa) + 40, ty = ly(la) + 16, cx = 552, bx0 = cx - 44, by0 = 246;
  scenes.push({ dur: 7, cam: "left", sfx: [[0.8, "step"], [1.2, "step"], [2.8, "rustle"], [3.6, "click"]], sub: L(`23:20 – Leergut ${un(v.SEITE_TXT)}: Die Kassa kommt in eine Kiste der falschen Marke – Palette ${pa}, ${un(v.LAGE_TXT)}.`, `23:20 – empties, ${un(v.SEITE_TXT)} of the trailer: the cash box goes into an odd crate – pallet ${pa}, ${un(v.LAGE_TXT)}.`), svg: svg((C) => `${night(C, 14)}${ground(C, 296)}${C.light(left ? 40 : 600, 150, 220, "#FFB860", 0.14)}
<g opacity=".85">${trailer(C, left ? 520 : -22, 150)}</g>
${[0, 1, 2].map((i) => { const q = first + i, b = br[q - 1] || 0; return `${C.shadow(px(q) + 40, 298, 54, 6, 0.6)}<rect x="${px(q) - 4}" y="286" width="88" height="10" fill="#8A6A40" ${o(1.6)}/>${[1, 2, 3, 4, 5].map((l) => { const odd = (q === pa && l === la) || (v.DECOYS || []).some(([dp, dl]) => dp === q && dl === l); return `<rect x="${px(q)}" y="${ly(l)}" width="80" height="30" rx="3" fill="${odd ? COL[b === 0 ? 1 : 0] : COL[b]}" ${o(1.8)}/><rect x="${px(q) + 8}" y="${ly(l) + 5}" width="64" height="8" rx="3" fill="#000" opacity=".25"/>`; }).join("")}${T(px(q) + 40, 318, "P" + q, 14, 800, PAPER)}`; }).join("")}
${C.light(tx, ty, 90, "#B8C8E8", 0.25)}
<g class="rb-into" style="transform-box:fill-box;transform-origin:center;--d:1.8s;--x:${tx - bx0 - 22}px;--y:${ty - by0 - 12}px">${box(bx0, by0)}</g>
<g class="rb-fadein" style="--d:3.3s"><circle class="rb-pulse" cx="${tx}" cy="${ty}" r="18" fill="${RED}"/><rect x="${tx - 44}" y="${ty - 19}" width="88" height="38" rx="5" fill="none" stroke="${RED}" stroke-width="4"/></g>
${fig(C, cx, 422, 1.2, t, tf, TS, "#8FA6D8")}
${C.time("23:20")}${C.tint("#16244A", 0.12)}${C.vignette(0.65)}`) });
  // Premium: Mitwisser und Pokal (Vereinsheim, Vitrine im Spotlicht)
  if (tier >= 1) {
    // Pokal genau wie im Vitrinenbild der Akte: Form/Farbe nach Platz der Inventar-Nr. in der sortierten Vitrine (trophyOf in teams002.js)
    const tro = trophyOf(v.INV0, Array.isArray(v.INV) && v.INV.length ? v.INV : [v.INV0]);
    scenes.push({ dur: 7, cam: "left", sfx: [[0.8, "rustle"], [2.4, "click"], [3.8, "sting"]], sub: L(`${m} hat sich immer in die Bonkassa-Schichten getauscht. Das Geld der Vorjahre lag im ${un(v.POKAL)} aus ${v.STROM} (Inv. ${v.INV0}).`, `${m} kept swapping into the token till shifts. Earlier years’ money was in the ${un(v.POKAL)} from ${v.STROM} (inv. ${v.INV0}).`), svg: svg((C) => `${C.wood(0, 0, 640, 360, "#5A3E26", "#24180E", true)}${C.light(150, 40, 240, "#FFC870", 0.3)}
<rect y="300" width="${W}" height="60" fill="${C.lin([[0, "#2A1C10"], [1, "#0A0604"]])}"/>
<g transform="translate(40,40)">${paperSheet(C, 230, 150)}${T(14, 26, L("Schichtplan", "Shift rota"), 14, 800, INK, "start")}${[0, 1, 2].map((r) => `<path d="M14,${48 + r * 30} L216,${48 + r * 30}" stroke="#B9AE98" stroke-width="2"/>${T(16, 68 + r * 30, L("Bonkassa", "Token till"), 11, 700, MUTED, "start")}<g class="rb-fadein" style="--d:${0.6 + r * 0.6}s">${T(214, 68 + r * 30, "⇄ " + short(m, 14), 11, 800, RED, "end")}</g>`).join("")}<circle cx="115" cy="-2" r="5" fill="${RED}" ${o(1.4)}/></g>
${fig(C, 150, 440, 1.3, m, mf, MS, "#FFC870")}
<g class="rb-fadein" style="--d:2.4s"><g transform="translate(470,50)"><rect x="-114" y="6" width="240" height="260" fill="#000" opacity=".4"/><rect x="-120" y="0" width="240" height="260" fill="${C.lin([[0, "#4A3A2A"], [1, "#2A1E14"]], 0, 0, 1, 0)}" ${o(3)}/><rect x="-108" y="12" width="216" height="236" fill="${C.lin([[0, "#1F2A44"], [1, "#0E1424"]])}"/>${C.cone(0, 14, 30, 200, 240, "#FFF2D0", 0.25)}<path d="M-108,170 L108,170" stroke="#C9D8E8" stroke-width="2" opacity=".5"/><path d="M-90,248 L-20,12 L0,12 L-70,248 Z" fill="#fff" opacity=".06"/>
${C.light(0, 110, 100, tro.color, 0.4)}<g transform="translate(0,168) scale(1.2)">${cupSvg(tro.shape, 0, 0, tro.color)}</g><g transform="translate(-74,150) rotate(-6)"><rect x="-26" y="-10" width="52" height="19" fill="${PAPER}" ${o(1.2)}/><text x="0" y="4" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" fill="${INK}">${v.INV0}</text></g>${T(0, 196, String(v.STROM), 16, 800, PAPER)}${T(0, 220, (en ? "Inv. " : "Inv.-Nr. ") + v.INV0, 12, 700, "#C9C2B4")}<g class="rb-pop2" style="--d:3.8s">${T(0, 38, `${cur} ${cur} ${cur}`, cur.length > 1 ? 13 : 18, 900, "#3FAE4A")}</g></g></g>${C.vignette(0.6)}`) });
  }
  // Premium Plus: Blechkassa im Archivkasten (dunkler Raum, Taschenlampe)
  if (tier >= 2) {
    scenes.push({ dur: 7, cam: "in", sfx: [[0.8, "creak"], [2.0, "click"], [2.4, "click"], [2.8, "click"], [3.2, "click"], [4.0, "chord"]], sub: L(`Der Rest: eine Blechkassa im Archivkasten, Code ${v.ZELT} – das erste Fest mit Zelt. Seit ${v.START} zweigt ${t} ab.`, `The rest: a cash tin in the archive cupboard, code ${v.ZELT} – the first fête with a marquee. Skimming since ${v.START}: ${t}.`), svg: svg((C) => `${C.sky("#0A0C12", "#1A1C22")}<rect y="320" width="${W}" height="40" fill="#08090C"/>
<g transform="translate(60,36)"><rect x="6" y="8" width="230" height="280" fill="#000" opacity=".5"/><rect width="230" height="280" fill="${C.lin([[0, "#7A6444"], [1, "#4A3B26"]], 0, 0, 1, 0)}" ${o(3)}/>${[0, 1, 2].map((r) => `<rect x="10" y="${84 + r * 86}" width="210" height="8" fill="#3A2E1C"/>`).join("")}<rect x="22" y="20" width="40" height="60" fill="#C9B890" ${o(1.5)}/><rect x="70" y="26" width="34" height="54" fill="#9C8A66" ${o(1.5)}/><rect x="40" y="110" width="150" height="60" rx="6" fill="${C.lin([[0, "#C4CBD0"], [1, "#7E868C"]])}" ${o(2.4)}/><rect x="50" y="116" width="130" height="6" fill="#fff" opacity=".3"/>${T(115, 146, L("Blechkassa", "Cash tin"), 12, 800, INK)}</g>
${C.cone(175, 22, 20, 220, 236, "#FFF0C8", 0.3)}${C.light(175, 176, 110, "#FFF0C8", 0.35)}${C.dust(80, 60, 200, 160, 12)}
<g transform="translate(450,180)">${C.light(0, 0, 170, "#4F6AA8", 0.3)}<rect x="-110" y="-70" width="220" height="140" rx="10" fill="${INK}" ${o(2.5, PAPER)}/>${T(0, -36, "CODE", 12, 700, "#8A94AE")}${String(v.ZELT).split("").map((d, i) => `<g class="rb-pop2" style="--d:${2 + i * 0.4}s"><rect x="${-84 + i * 44}" y="-18" width="36" height="48" rx="4" fill="#1F2A44" ${o(2, GOLD)}/>${T(-66 + i * 44, 16, d, 26, 800, GOLD)}</g>`).join("")}</g>
<g class="rb-fadein" style="--d:4s">${T(450, 300, L(`seit ${v.START} zweigt ${short(t, 16)} ab`, `skimming since ${v.START}: ${short(t, 16)}`), 13, 800, PAPER)}</g>${C.vignette(0.7)}`) });
  }
  // Rettung (eigene kurze Szene vor der Akte, Freigabe 12.10.2026): Wirt (neutral, Schürze, ohne Namensschild) öffnet die Anhängertür, Opfer in Decke, Kühlnebel
  const wirt = (x, y, s) => `<g class="rb-breathe">${helfer(x, y, s, "#4A505C", null, "", "down", false, "wirt")}<g transform="translate(${x},${y}) scale(${s})"><path d="M-24,-100 L24,-100 L32,-30 L-32,-30 Z" fill="#E9E2D0" ${o(2)}/><path d="M-24,-100 L-30,-118 M24,-100 L30,-118" stroke="#E9E2D0" stroke-width="3"/><rect x="-10" y="-74" width="20" height="14" rx="2" fill="none" stroke="#B9AE98" stroke-width="2"/></g></g>`;
  const decke = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-38,-122 Q0,-136 38,-122 L32,-108 Q0,-118 -32,-108 Z" fill="#8E5A34" ${o(2)}/><path d="M-38,-122 Q-50,-80 -46,-30 L-26,-30 Q-30,-80 -24,-112 Z M38,-122 Q50,-80 46,-30 L26,-30 Q30,-80 24,-112 Z" fill="#8E5A34" ${o(2)}/><path d="M-44,-60 L-28,-60 M-44,-50 L-28,-50 M44,-60 L28,-60 M44,-50 L28,-50" stroke="#D9C39A" stroke-width="3"/></g>`;
  scenes.push({ dur: 4, cam: "in", sfx: [[0.3, "knock"], [0.7, "knock"], [1.1, "knock"], [1.6, "creak"]], sub: L(`23:48 hört der Wirt das Klopfen – ${opfer} ist gerettet.`, `At 23:48 the landlord hears the knocking – ${opfer} is rescued.`), svg: svg((C) => `${night(C, 16)}${ground(C)}
${C.light(600, 220, 200, "#FFB860", 0.18)}${garland(0, 54, 320, 74, 7, 14)}${garland(320, 74, 640, 50, 7, 14, 3)}
${trailer(C, 180, 110)}<g class="rb-fadein" style="--d:.9s"><rect x="330" y="128" width="52" height="96" fill="${C.lin([[0, "#F4F8FF"], [1, "#BFD6EE"]])}"/>${C.cone(356, 224, 52, 200, 330, "#DDEBFF", 0.3)}${C.light(356, 176, 110, "#DDEBFF", 0.5)}<path d="M382,128 L404,118 L404,234 L382,224 Z" fill="${C.lin([[0, "#CDD3D9"], [1, "#8E969E"]], 0, 0, 1, 0)}" ${o(2)}/></g>
<g class="rb-fadeout" style="--d:.9s"><rect x="330" y="128" width="52" height="96" fill="${C.lin([[0, "#CDD3D9"], [1, "#9EA6AE"]])}" ${o(2.4)}/></g>
<g class="rb-fadein" style="--d:1s">${C.fog(240, 0.3, "#DCE8F4")}</g>
${wirt(500, 440, 1.2)}
<g class="rb-fadein" style="--d:1.4s">${C.light(350, 250, 120, "#DDEBFF", 0.3)}<g class="rb-breathe">${person(350, 440, 1.2, opfer, of, OS)}${decke(350, 440, 1.2)}</g></g>
${C.time("23:48")}${C.tint("#1A2A50", 0.12)}${C.vignette(0.6)}`) });
  const rows = [[L("Täter/in", "Culprit"), t], [L("Tür verriegelt", "Door bolted"), zeit], [L("Es fehlen", "Missing"), un(v.BETRAG_TXT)], [L("Kassette", "Cash box"), `${L("Palette", "Pallet")} ${pa} · ${L("Lage", "layer")} ${la}`]];
  if (tier >= 1) rows.push([L("Mitwisser/in · Pokal", "Accomplice · trophy"), `${m} · ${v.INV0}`]);
  if (tier >= 2) rows.push([L("Code Blechkassa", "Cash tin code"), String(v.ZELT)]);
  scenes.push({ dur: 9, cam: "none", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: closing(en, t, tf, TS, L("ERMITTLUNGSAKTE · EISKALT KASSIERT", "CASE FILE · COLD CASH"), rows) });
  return scenes;
}

export function rueckblendeTeams(caseId, v, tier, en) {
  const scenes = caseId === "fall-002" ? rueckblende002(v, tier, en) : rueckblende001(v, tier, en);
  // Lesezeit: höchstens 3 Wörter pro Sekunde plus 0,5 s (Plattform-Test 11.10.2026: Untertitel waren zu schnell)
  for (const sc of scenes) { const w = (sc.sub.match(/\S+/g) || []).length; sc.dur = Math.max(sc.dur, Math.ceil((w / 3 + 0.5) * 2) / 2); }
  scenes.push(endcard({ en, plural: true }));   // Abspann wie bei den Teasern
  return { music: "/assets/audio/rueckblende-teams-buero.m4a", scenes };   // Musik 78 s (ohne Ticken), der Player blendet am Ende aus
}
