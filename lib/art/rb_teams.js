// Rückblende (animiertes Finale) Teams – Fall 001 „Die rote Mappe“ und Fall 002 „Eiskalt kassiert“ (11.10.2026).
// Gezeigt von der Spielleitung für alle (Bildschirm teilen/Beamer), danach auf jedem Team-Gerät abrufbar.
// Personen mit Gesicht im Stil der Akten (helfer aus teams002.js: Mann/Frau laut Anrede, Frisur aus dem Namen, Namensschild).
// Paketgrenzen: Basic nur Akt 1; Premium + Szene Mitwisser/Geld; Premium Plus + Szene Finale. Nichts aus Akt 2/Finale in kleineren Paketen.
// v = buildVars(session) – Werte sind HTML-escaped, deshalb un() vor T() (T escaped selbst).
import { INK, PAPER, RED, CARD, MUTED, SKIN, o, T, defs } from "./gn.js";
import { helfer } from "./teams002.js";

const W = 640, H = 360, NB = "#0E1424", GOLD = "#F2C14E";
const un = (s) => String(s ?? "").replace(/&(amp|lt|gt|quot|#39);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[x]));
const svg = (inner) => { const D = defs(); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${D.svg}${inner(D)}</svg>`; };
const clock = (x, y, time) => `<g transform="translate(${x},${y})"><rect x="-6" y="-24" width="92" height="32" rx="4" fill="${INK}" ${o(2, PAPER)}/>${T(40, -1, time, 20, 800, GOLD)}</g>`;
const person = (x, y, s, name, fem, shirt = "#2F3A4F", seed = "") => helfer(x, y, s, shirt, null, name, "down", fem, seed);
const gen = (n) => (/[sßxz]$/i.test(n) ? n + "’" : n + "s");   // Genitiv: „Fuchs’ Tee“, „Annas Tee“
const short = (s, n = 18) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const stars = (n) => [...Array(n)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 7) * 0.3}s" cx="${(i * 89) % W}" cy="${(i * 41) % 130}" r="${i % 4 ? 1.2 : 1.8}" fill="#DCE3EA"/>`).join("");
const title = (en, line) => `<g class="rb-fadein" style="--d:1s"><rect x="22" y="22" width="330" height="92" fill="${INK}" opacity=".85"/>${T(36, 46, "MORDSTEAM TEAMS", 12, 700, RED, "start")}${T(36, 82, en ? "What really happened" : "Was wirklich geschah", 28, 800, PAPER, "start")}${T(36, 104, short(line, 40), 12, 600, "#C9C2B4", "start")}</g>`;
// Schlussbild: Person links, Akte rechts mit Zeilen, Stempel
function closing(en, who, fem, shirt, label, rows) {
  const L = (d, e) => (en ? e : d), step = rows.length > 4 ? 36 : 42, h = 54 + rows.length * step + 56;
  const y0 = Math.max(14, (H - h) / 2 - 6);
  return svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${stars(26)}
<g class="rb-fadein" style="--d:.2s">${person(150, 420, 1.5, who, fem, shirt)}</g>
<g class="rb-slidein" style="--d:.6s"><rect x="290" y="${y0}" width="320" height="${h}" fill="${PAPER}" ${o(3)}/>${T(450, y0 + 28, label, 13, 800, MUTED)}<path d="M310,${y0 + 40} L590,${y0 + 40}" ${o(1.4)}/>
${rows.map(([k, val], i) => `${T(310, y0 + 60 + i * step, k, 11, 700, MUTED, "start")}${T(310, y0 + 79 + i * step, short(val, 30), val.length > 22 ? 14 : 17, 800, INK, "start")}`).join("")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,${y0 + h - 18}) rotate(-5)"><rect x="-138" y="-28" width="276" height="56" fill="${PAPER}" fill-opacity=".55" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>`);
}
// rote Mappe
const mappe = (x, y, s = 1, cls = "", st = "") => `<g class="${cls}" style="${st}"><g transform="translate(${x},${y}) scale(${s})"><rect x="-34" y="-24" width="68" height="48" rx="3" fill="${RED}" ${o(2.4)}/><rect x="-22" y="-12" width="44" height="12" fill="none" stroke="${PAPER}" stroke-width="1.6"/></g></g>`;

// ---------------------------------------------------------------- Fall 001
export function rueckblende001(v, tier, en) {
  const L = (d, e) => (en ? e : d);
  const t = un(v.T), m = un(v.M || ""), opfer = un(v.OPFER), firma = un(v.FIRMA), schein = un(v.SCHEINFIRMA), raum = un(v.RAUM_TATORT);
  const tf = v.T_HE === "she", mf = v.M_HE === "she", of = v.V_HE === "she", konto = String(v.KONTO), zeit = String(v.TATZEIT);
  const karton = un(v.KARTON), platz = un(v.KARTON_PLATZ);
  const TS = "#2F3A4F", OS = "#7A2A24", MS = "#5E5A52";
  const scenes = [];
  // 1 Titel: Bürohaus bei Nacht
  scenes.push({ dur: 5, sfx: [[0.4, "sting"]], sub: L(`${firma}. Ein Abend im Büro.`, `${firma}. An evening at the office.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${stars(40)}
<rect x="330" y="60" width="200" height="300" fill="#1F2A44" ${o(3)}/>${[...Array(8)].map((_, r) => [...Array(5)].map((_, c) => `<rect x="${346 + c * 36}" y="${76 + r * 34}" width="24" height="20" fill="${r === 3 && c === 2 ? RED : (r * 5 + c) % 4 ? "#2A3554" : GOLD}" ${r === 3 && c === 2 ? 'class="rb-glow"' : ""} ${o(1.4)}/>`).join("")).join("")}
<rect x="560" y="150" width="80" height="210" fill="#18213A" ${o(2.4)}/><rect x="0" y="200" width="300" height="160" fill="#141B2E"/><rect y="330" width="${W}" height="30" fill="#0A0E18"/>
${title(en, firma)}`) });
  // 2 Das Geld
  scenes.push({ dur: 6.5, sfx: [[0.6, "rustle"], [1.6, "rustle"], [3.2, "plop"]], sub: L(`${t} schleust Firmengeld über „${schein}“ auf das Konto •••• ${konto}. ${opfer} sammelt die Beweise in einer roten Mappe.`, `${t} siphons company money via “${schein}” into account •••• ${konto}. ${opfer} gathers the evidence in a red folder.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2B2A27"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".08"/>
${[0, 1, 2].map((i) => `<g class="rb-slideup" style="--d:${0.3 + i * 0.5}s"><g transform="translate(${40 + i * 26},${70 + i * 22}) rotate(${-4 + i * 3})"><rect width="150" height="110" fill="${PAPER}" ${o(2.2)}/>${T(12, 22, L("RECHNUNG", "INVOICE"), 12, 800, INK, "start")}${T(12, 40, short(schein, 22), 10, 700, MUTED, "start")}<path d="M12,56 L120,56 M12,68 L100,68 M12,80 L110,80" stroke="#B9AE98" stroke-width="3"/></g></g>`).join("")}
<path class="rb-draw" pathLength="100" d="M230,150 C280,120 300,120 340,130" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/><path class="rb-fadein" style="--d:2.6s" d="M330,120 L344,131 L328,140" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>
<g class="rb-fadein" style="--d:2.6s"><rect x="350" y="96" width="190" height="80" rx="8" fill="#2E5FA8" ${o(2.4)}/>${T(366, 120, L("PRIVATKONTO", "PRIVATE ACCOUNT"), 11, 700, PAPER, "start")}<text x="366" y="156" font-family="IBM Plex Mono, monospace" font-weight="800" font-size="22" fill="${PAPER}">•••• ${konto}</text></g>
${person(500, 430, 1.3, t, tf, TS)}
<g class="rb-fadein" style="--d:3.6s">${person(250, 430, 1.2, opfer, of, OS)}${mappe(330, 330, 0.9)}</g>`) });
  // 3 Der Tee – Ausgabe am Catering gegen Ausweis (wie im Lieferschein Catering)
  scenes.push({ dur: 7, sfx: [[1.0, "click"], [2.3, "plop"], [2.8, "plop"], [3.3, "plop"]], sub: L(`${zeit} – ${t} holt mit dem eigenen Ausweis ${gen(opfer)} Tee am Catering und tropft Herztropfen hinein.`, `${zeit} – ${t} collects ${opfer}’s tea at catering with ${v.T_HIS || "their"} own badge and adds digitalis drops.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#3A3F48"/><rect y="230" width="${W}" height="130" fill="#6E6A62"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".06"/>
<rect x="20" y="40" width="250" height="34" fill="${INK}" ${o(2)}/>${T(145, 63, "CATERING", 16, 800, GOLD)}
${person(110, 300, 1.0, "", true, "#E9E2D0", "catering")}
<rect x="10" y="200" width="290" height="40" fill="#8C6E4E" ${o(3)}/><rect x="20" y="240" width="270" height="120" fill="#6E4F34" ${o(2)}/>
<g transform="translate(200,166)"><path d="M-22,34 L22,34 L18,0 L-18,0 Z" fill="${PAPER}" ${o(2)}/><path d="M18,6 q16,4 0,22" fill="none" ${o(2)}/><path d="M-6,0 Q0,-12 6,0" fill="none" ${o(2)}/></g>
<g transform="translate(250,150)"><rect width="40" height="50" rx="5" fill="#2A2E3A" ${o(2.2)}/><circle class="rb-pop" style="--d:1s" cx="20" cy="16" r="7" fill="#3FAE4A"/><rect x="8" y="28" width="24" height="14" rx="2" fill="#4A505C"/></g>
<g transform="translate(400,250)"><path d="M-30,-40 L30,-40 L24,10 L-24,10 Z" fill="${PAPER}" ${o(2.4)}/><path d="M30,-30 q16,6 0,26" fill="none" ${o(2.4)}/><ellipse cx="0" cy="-38" rx="27" ry="5" fill="#B9A15A"/>${T(0, -10, "♥", 14, 800, RED)}</g>
<g transform="translate(400,110)"><rect x="-10" y="-40" width="20" height="34" rx="4" fill="#5A3A22" ${o(2)}/><rect x="-5" y="-50" width="10" height="12" fill="${INK}"/>${[0, 1, 2].map((i) => `<circle class="rb-pill" style="--d:${2.2 + i * 0.5}s" cx="0" cy="8" r="5" fill="${RED}"/>`).join("")}</g>
${person(540, 430, 1.35, t, tf, TS)}
${clock(22, 340, zeit)}`) });
  // 4 19:47 – die Mappe verschwindet
  scenes.push({ dur: 6.5, sfx: [[0.5, "creak"], [2.4, "rustle"], [3.2, "sting"]], sub: L(`19:47 – „${raum}“: ${opfer} liegt bewusstlos am Schreibtisch. ${t} nimmt die rote Mappe.`, `19:47 – “${raum}”: ${opfer} lies unconscious at the desk. ${t} takes the red folder.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#3A3F48"/><rect width="${W}" height="150" fill="#4A505C"/><rect x="430" y="24" width="170" height="100" fill="#1E2840" ${o(3)}/><path d="M430,74 L600,74 M515,24 L515,124" ${o(2)}/>
<rect x="150" y="120" width="70" height="120" rx="8" fill="#2A2420" ${o(2.4)}/><path d="M170,262 Q176,196 248,172 L272,190 Q214,206 206,262 Z" fill="${OS}" ${o(2.4)}/>
<path d="M40,190 L480,190 L510,236 L10,236 Z" fill="#8C6E4E" ${o(3)}/><rect x="10" y="236" width="500" height="16" fill="#6E4F22" ${o(3)}/><path d="M30,252 L30,330 M490,252 L490,330" ${o(6)}/>
<g transform="rotate(80 120 200)"><path d="M104,188 L136,188 L132,214 L108,214 Z" fill="${PAPER}" ${o(2)}/></g>
<path d="M236,190 Q280,176 330,190 L326,204 Q280,194 240,206 Z" fill="${OS}" ${o(2)}/><ellipse cx="334" cy="197" rx="9" ry="6" fill="${SKIN}" ${o(1.6)}/>
<g transform="translate(286,170) rotate(-78)"><ellipse cx="0" cy="0" rx="18" ry="21" fill="${SKIN}" ${o(2.4)}/><path d="M-19,4 Q-22,-24 0,-24 Q22,-24 19,4 Q10,-10 0,-10 Q-10,-10 -19,4 Z" fill="${of ? "#5A3A22" : "#3A2A22"}" ${o(2)}/><path d="M-8,6 L-2,6 M4,6 L10,6" ${o(2)}/></g>
${mappe(330, 176, 0.8, "rb-sneak")}
<g class="rb-walk">${person(560, 430, 1.3, t, tf, TS)}</g>
${clock(22, 340, "19:47")}`) });
  // 5 Kopierraum + Taschenkontrolle
  scenes.push({ dur: 6.5, sfx: [[0.6, "rattle"], [2.4, "rustle"], [3.6, "step"], [4.0, "step"]], sub: L("Der Aktenvernichter ist defekt, nur eine Ecke reißt ab. An den Ausgängen: Taschenkontrolle.", "The shredder is broken – only a corner tears off. And bags are checked at the exits."), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#4A505C"/><rect y="250" width="${W}" height="110" fill="#6E6A62"/>
<rect x="60" y="100" width="150" height="180" rx="6" fill="#C9C2B4" ${o(3)}/><rect x="60" y="100" width="150" height="34" fill="#8A877F" ${o(2.5)}/><rect x="84" y="110" width="100" height="7" fill="${INK}"/>
<g transform="rotate(-4 135 190)"><rect x="82" y="150" width="106" height="70" fill="#FFE58A" ${o(1.5)}/><text x="135" y="194" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="24" fill="${RED}">${L("DEFEKT", "BROKEN")}</text></g>
${mappe(134, 92, 0.7, "rb-pop2", "--d:.4s")}
<path d="M240,200 L300,200 L294,270 L246,270 Z" fill="#3B4660" ${o(3)}/><path class="rb-pill" style="--d:2.2s" d="M262,150 L276,140 L286,152 L272,160 Z" fill="${RED}" ${o(1.6)}/>
<g transform="translate(470,0)"><rect x="-70" y="60" width="140" height="210" fill="#1E2840" ${o(3)}/><rect x="-70" y="60" width="140" height="210" fill="#4F7A5A" opacity=".25"/>${T(0, 50, L("AUSGANG", "EXIT"), 16, 800, "#7BD389")}<rect x="-110" y="180" width="80" height="90" fill="#2A2E3A" ${o(2.4)}/>${T(-70, 172, L("TASCHENKONTROLLE", "BAG CHECK"), 11, 800, GOLD)}<g class="rb-fadein" style="--d:3.2s"><path d="M-96,262 L-44,262 L-50,232 L-90,232 Z" fill="#5A4030" ${o(2)}/><path d="M-82,232 Q-70,216 -58,232" fill="none" ${o(2.4)}/><circle cx="-70" cy="214" r="12" fill="none" stroke="${GOLD}" stroke-width="3"/><path d="M-62,222 L-52,234" stroke="${GOLD}" stroke-width="4"/></g></g>`) });
  // 6 Archiv 19:56 – Regale A/B/C mit je 4 Fächern wie auf dem Spurensicherungsfoto; Platz aus KARTON_PLATZ
  const pm = platz.match(/([ABC])\D+(\d)/) || [, "B", "2"], ri = "ABC".indexOf(pm[1]), fi = Number(pm[2]) - 1;
  const ax = (r) => 40 + r * 140, ay = (f) => 54 + f * 66, tx = ax(ri) + 60, ty = ay(fi) + 30;
  scenes.push({ dur: 7, sfx: [[0.6, "step"], [1.0, "step"], [2.6, "rustle"], [3.4, "click"]], sub: L(`19:56 – Archiv: Die Mappe landet in Karton ${karton} (${platz}). Rot markiert: Schredder am Freitag, 12:00.`, `19:56 – archive: the folder goes into box ${karton} (${platz}). Red label: shredding on Friday at 12:00.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2A2C33"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".1"/>
${[0, 1, 2].map((r) => `<rect x="${ax(r)}" y="44" width="120" height="270" fill="#6E655C" ${o(2.5)}/>${T(ax(r) + 60, 36, L("REGAL ", "SHELF ") + "ABC"[r], 12, 800, "#F2E7B8")}${[0, 1, 2, 3].map((f) => { const hi = r === ri && f === fi; return `<rect x="${ax(r) + 6}" y="${ay(f)}" width="108" height="58" fill="#3A3330"/><rect x="${ax(r)}" y="${ay(f) + 58}" width="120" height="6" fill="#8A7E70"/>${T(ax(r) + 14, ay(f) + 14, String(f + 1), 10, 700, "#F2E7B8")}<rect x="${ax(r) + 22}" y="${ay(f) + 8}" width="86" height="48" fill="#C9A878" ${o(2)}/><rect x="${ax(r) + 38}" y="${ay(f) + 22}" width="54" height="18" fill="${PAPER}" ${o(1.2)}/>${hi ? T(ax(r) + 65, ay(f) + 35, short(karton, 9), 10, 800) + `<circle class="rb-fadein" style="--d:3.4s" cx="${ax(r) + 100}" cy="${ay(f) + 30}" r="7" fill="#C8342A" ${o(1.6)}/>` : `<path d="M${ax(r) + 46},${ay(f) + 31} L${ax(r) + 84},${ay(f) + 31}" stroke="#9C978D" stroke-width="3"/>`}`; }).join("")}`).join("")}
${mappe(560, 210, 0.8, "rb-into", `--d:1.6s;--x:${tx - 560}px;--y:${ty - 210}px`)}
<g class="rb-fadein" style="--d:3.4s"><rect x="${ax(ri) + 2}" y="${ay(fi) - 2}" width="116" height="62" fill="none" stroke="${RED}" stroke-width="4"/>${T(550, 70, L("Fr 12:00", "Fri 12:00"), 13, 800, "#F2E7B8")}${T(550, 88, L("Schredder", "shredder"), 12, 700, "#F2E7B8")}</g>
${person(570, 440, 1.25, t, tf, TS)}
${clock(22, 350, "19:56")}`) });
  // Premium: Mitwisser und Schließfach
  if (tier >= 1) {
    const fach = String(v.FACH), bf = en ? `${un(v.STADT)} ${un(v.HBF)}` : `${un(v.HBF)} ${un(v.STADT)}`;
    scenes.push({ dur: 7, sfx: [[0.8, "stamp"], [2.6, "rustle"], [4.2, "click"]], sub: L(`${m} hat die Scheinrechnungen durchgewunken – und einen Anteil bekommen. Der Rest liegt im Schließfach ${fach}, ${bf}.`, `${m} waved the fake invoices through – and got a share. The rest is in locker ${fach}, ${bf}.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2B2A27"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".06"/>
<g transform="translate(40,40) rotate(-3)"><rect width="150" height="110" fill="${PAPER}" ${o(2.2)}/>${T(12, 22, L("RECHNUNG", "INVOICE"), 12, 800, INK, "start")}${T(12, 40, short(schein, 22), 10, 700, MUTED, "start")}</g>
<g class="rb-stamp" style="--d:.8s"><g transform="translate(118,118) rotate(-10)"><rect x="-62" y="-16" width="124" height="32" fill="none" stroke="#2E7D3A" stroke-width="3"/>${T(0, 6, L("FREIGEGEBEN", "APPROVED"), 14, 900, "#2E7D3A")}</g></g>
${person(130, 430, 1.3, m, mf, MS)}
<g class="rb-fadein" style="--d:2.2s"><g transform="translate(300,160)"><rect x="-40" y="-26" width="80" height="52" rx="4" fill="#C9B27A" ${o(2.4)}/><path d="M-40,-26 L0,4 L40,-26" fill="none" ${o(2)}/>${T(0, 46, L("Donnerstag, Mittag", "Thursday, lunchtime"), 11, 700, PAPER)}</g></g>
<g class="rb-fadein" style="--d:3.6s"><g transform="translate(410,40)"><rect width="200" height="250" fill="#8A877F" ${o(3)}/>${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${12 + c * 62}" y="${12 + r * 58}" width="52" height="48" fill="${r === 2 && c === 1 ? RED : "#B5B1A8"}" ${o(1.8)}/>`).join("")).join("")}${T(105, 166, fach, 13, 800, PAPER)}${T(100, 274, short(bf, 26), 12, 700, PAPER)}</g></g>`) });
  }
  // Premium Plus: ARIA-Notiz, PIN, Anteil im Koffer
  if (tier >= 2) {
    scenes.push({ dur: 7, sfx: [[0.8, "click"], [1.6, "beep"], [3.4, "click"], [4.6, "sting"]], sub: L(`Mit ${gen(opfer)} Zugangskarte speichert ${t} die PIN in ARIA – Kennwort: Raum ${un(v.ROOM_NEU)}. ${gen(m)} Anteil: ${un(v.ANTEIL_TXT)}.`, `With ${opfer}’s access card, ${t} saves the PIN in ARIA – password: ${un(v.ROOM_NEU)}. ${m}’s share: ${un(v.ANTEIL_TXT)}.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>
<g transform="translate(120,30)"><rect width="170" height="300" rx="22" fill="#1A1A1E" ${o(3, "#4A505C")}/><rect x="12" y="34" width="146" height="236" rx="6" fill="#E9EEF2"/>${T(85, 62, "ARIA", 18, 900, "#2E5FA8")}
<rect x="24" y="84" width="122" height="56" rx="6" fill="#FFFFFF" ${o(1.4, "#9C978D")}/>${T(34, 104, L("Geschützte Notiz", "Protected note"), 11, 800, INK, "start")}${T(34, 126, "🔒 " + short(L("Raum ", "") + un(v.ROOM_NEU), 15), 11, 700, MUTED, "start")}
<g class="rb-fadein" style="--d:3s"><rect x="24" y="156" width="122" height="62" rx="6" fill="#FFF7D6" ${o(1.4, "#C9A44A")}/>${T(85, 178, "PIN", 11, 800, MUTED)}<text x="85" y="206" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="800" font-size="24" fill="${INK}">${String(v.PIN || "")}</text></g></g>
<g class="rb-slideup" style="--d:.4s"><rect x="340" y="40" width="96" height="60" rx="5" fill="${PAPER}" ${o(2)}/><rect x="352" y="56" width="72" height="28" fill="#2E5FA8"/>${T(388, 75, "ID", 12, 800, PAPER)}</g>
<g class="rb-fadein" style="--d:4.2s"><g transform="translate(470,250)"><rect x="-80" y="-60" width="160" height="110" rx="10" fill="#5A4030" ${o(3)}/><path d="M-26,-60 Q0,-86 26,-60" fill="none" ${o(5)}/>${T(0, 0, short(un(v.ANTEIL_TXT), 12), 20, 900, GOLD)}${T(0, 30, L("Koffer: ", "case: ") + short(m, 16), 11, 700, PAPER)}</g></g>
${clock(22, 350, "20:48")}`) });
  }
  // Schluss: Akte
  const rows = [[L("Täter/in", "Culprit"), t], [L("Gift im Tee", "Poison in the tea"), zeit], [L("Konto", "Account"), "•••• " + konto], [L("Rote Mappe", "Red folder"), karton]];
  if (tier >= 1) rows.push([L("Mitwisser/in · Schließfach", "Accomplice · locker"), `${m} · ${v.FACH}`]);
  if (tier >= 2) rows.push(["PIN", String(v.PIN || "")]);
  scenes.push({ dur: 9, sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: closing(en, t, tf, TS, L("ERMITTLUNGSAKTE · DIE ROTE MAPPE", "CASE FILE · THE RED FOLDER"), rows) });
  return scenes;
}

// ---------------------------------------------------------------- Fall 002
const BAND = { rot: "#D23A2E", gelb: "#F2C94C", blau: "#2E6FD2", gruen: "#3FAE4A", grün: "#3FAE4A", red: "#D23A2E", yellow: "#F2C94C", blue: "#2E6FD2", green: "#3FAE4A" };
const tent = (x, y, w, h) => `<path d="M${x},${y + h * 0.3} L${x + w / 2},${y} L${x + w},${y + h * 0.3} L${x + w},${y + h} L${x},${y + h} Z" fill="#E8E2D4" ${o(3)}/>${[...Array(9)].map((_, i) => `<circle class="rb-twinkle" style="--d:${i * 0.2}s" cx="${x + 12 + i * (w - 24) / 8}" cy="${y + h * 0.3 + 10 - Math.abs(4 - i) * 3}" r="4" fill="${GOLD}"/>`).join("")}`;
const trailer = (x, y) => `<g transform="translate(${x},${y})"><rect width="220" height="130" fill="#D8DDE2" ${o(3)}/><rect x="150" y="18" width="52" height="96" fill="#C2C8CE" ${o(2.4)}/>${T(110, -8, "❄", 22, 700, "#5E86A6")}<circle cx="40" cy="146" r="16" fill="${INK}" ${o(2, "#4A505C")}/><circle cx="180" cy="146" r="16" fill="${INK}" ${o(2, "#4A505C")}/></g>`;
export function rueckblende002(v, tier, en) {
  const L = (d, e) => (en ? e : d);
  const t = un(v.T), m = un(v.M || ""), opfer = un(v.OPFER), verein = un(v.FIRMA), fest = un(v.FEST || ""), r1 = un(v.R1 || "");
  const tf = v.T_HE === "she", mf = v.M_HE === "she", of = v.V_HE === "she", zeit = String(v.TATZEIT), pin = String(v.P_IN_T);
  const farbe = BAND[String(v.FARBE || "").toLowerCase()] || "#3FAE4A", fword = un(v.FARBE || "");
  const TS = "#3F5A35", OS = "#7A2A24", MS = "#8C6E4E", BOX = "#8A8F96";
  const cur = (un(v.BETRAG_TXT).match(/[^\d\s.,'’-]+/) || ["€"])[0];   // Währung der Runde (€, CHF, £, $ …)
  const scenes = [];
  // 1 Titel: Fest bei Nacht
  scenes.push({ dur: 5, sfx: [[0.3, "applause"]], sub: L(`${verein} – ${fest}. Ein langer Abend.`, `${verein} – ${fest}. A long night.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${stars(36)}<rect y="290" width="${W}" height="70" fill="#1E2A1C"/>
${tent(300, 150, 300, 160)}${trailer(60, 200)}
${title(en, verein)}`) });
  // 2 Die Bons
  scenes.push({ dur: 6.5, sfx: [[0.6, "rustle"], [1.6, "click"], [3.0, "plop"]], sub: L(`${t} bringt nachgedruckte Bons über die Bonkassa in Umlauf und kassiert. ${opfer} zählt mit: Es fehlen ${un(v.BETRAG_TXT)}.`, `${t} sells reprinted tokens through the token till and pockets the money. ${opfer} keeps count: ${un(v.BETRAG_TXT)} is missing.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2B2A27"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".07"/>
<rect x="60" y="210" width="300" height="30" fill="#8C6E4E" ${o(3)}/><rect x="80" y="240" width="260" height="120" fill="#6E4F34" ${o(2)}/>
${[...Array(7)].map((_, i) => `<g class="rb-slideup" style="--d:${0.3 + i * 0.25}s"><g transform="translate(${90 + i * 36},${150 - (i % 2) * 14}) rotate(${-8 + i * 3})"><rect width="40" height="56" fill="${i % 3 ? "#F2C94C" : "#F7DA7A"}" ${o(1.6)}/>${T(20, 32, L("BON", "TOKEN"), en ? 8 : 10, 800, INK)}</g></g>`).join("")}
${person(470, 430, 1.3, t, tf, TS)}<g class="rb-fadein" style="--d:2.6s"><rect x="510" y="300" width="40" height="22" fill="#3FAE4A" ${o(1.4)}/>${T(530, 316, cur, cur.length > 1 ? 10 : 14, 800, INK)}</g>
<g class="rb-fadein" style="--d:3.4s"><g transform="translate(40,30) rotate(-3)"><rect width="190" height="96" fill="${PAPER}" ${o(2)}/><text x="16" y="34" font-family="Caveat, cursive" font-weight="600" font-size="20" fill="#1F2A6B">${L("Strichliste", "Tally")} ||||  ||||  |||</text><text x="16" y="74" font-family="Caveat, cursive" font-weight="600" font-size="22" fill="${RED}">− ${short(un(v.BETRAG_TXT), 10)}</text></g></g>`) });
  // 3 Die Kassa am Stehtisch
  scenes.push({ dur: 6.5, sfx: [[0.8, "step"], [1.2, "step"], [2.6, "creak"]], sub: L(`${pin} – ${opfer} stellt die Festkassa auf den Stehtisch und geht in den Kühlanhänger, Getränke zählen.`, `${pin} – ${opfer} leaves the cash box on the standing table and goes into the trailer to count drinks.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${stars(20)}<rect y="290" width="${W}" height="70" fill="#1E2A1C"/>
${trailer(300, 140)}<rect class="rb-light" x="450" y="158" width="52" height="96" fill="${GOLD}"/>
<g transform="translate(200,230)"><rect x="-6" y="0" width="12" height="70" fill="#5A4030" ${o(2)}/><ellipse cx="0" cy="0" rx="50" ry="10" fill="#8C6E4E" ${o(2.4)}/><rect x="-26" y="-26" width="52" height="26" rx="3" fill="${BOX}" ${o(2)}/><rect x="-8" y="-20" width="16" height="6" fill="${INK}"/></g>
<g class="rb-sneak">${person(110, 440, 1.3, opfer, of, OS)}</g>
${clock(22, 350, pin)}`) });
  // 4 Tatzeit: Tür verriegelt, Schnellkühlen, Kassette weg, Bändchen im Türspalt
  scenes.push({ dur: 7, sfx: [[0.4, "applause"], [1.6, "click"], [2.2, "beep"], [2.5, "beep"], [3.4, "rustle"]], sub: L(`${zeit} – Tombola. ${t} verriegelt die Tür, stellt auf Schnellkühlen, nimmt die Kassa. Ein ${fword}es Bändchen bleibt im Türspalt.`, `${zeit} – raffle time. ${t} bolts the door, sets rapid cooling, takes the cash box. A ${fword} wristband catches in the door.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${stars(16)}<rect y="290" width="${W}" height="70" fill="#1E2A1C"/>
<g opacity=".55">${tent(-60, 120, 240, 150)}</g>${T(60, 112, L("TOMBOLA", "RAFFLE"), 14, 800, GOLD)}
${trailer(260, 130)}<rect x="410" y="148" width="52" height="96" fill="#C2C8CE" ${o(2.4)}/>
<g class="rb-bolt"><rect x="452" y="190" width="40" height="12" rx="3" fill="#8A877F" ${o(2)}/></g>
<g transform="translate(560,170)"><rect x="-34" y="-30" width="68" height="60" rx="6" fill="${INK}" ${o(2, PAPER)}/><text class="rb-heat0" x="0" y="8" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="800" font-size="20" fill="${GOLD}">4°</text><text class="rb-heat" x="0" y="8" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="800" font-size="20" fill="#7BC6FF">❄ MAX</text></g>
<g class="rb-fadein" style="--d:3.6s"><path d="M462,236 l20,6 l-3,9 l-20,-6 Z" fill="${farbe}" ${o(1.4)}/></g>
<g class="rb-sneak">${person(330, 440, 1.25, t, tf, TS)}<rect x="356" y="330" width="44" height="24" rx="3" fill="${BOX}" ${o(2)}/></g>
${clock(22, 350, zeit)}`) });
  // 5 Leergut 23:20
  const pa = Number(v.PA) || 1, la = Number(v.LA) || 1, br = v.PAL_BRAND || [0, 0, 0, 0, 0, 0];
  const COL = ["#8C5A2A", "#E9C84A", "#3E7CC0"], first = pa <= 3 ? 1 : 4, left = first === 1;
  const px = (q) => (left ? 70 : 250) + (q - first) * 110, ly = (l) => 290 - l * 34;   // Lage 1 unten · Lage 5 oben (wie im Stapelplan)
  const tx = px(pa) + 40, ty = ly(la) + 16;
  scenes.push({ dur: 7, sfx: [[0.8, "step"], [1.2, "step"], [2.8, "rustle"], [3.6, "click"]], sub: L(`23:20 – Leergut ${un(v.SEITE_TXT)}: Die Kassa kommt in eine Kiste der falschen Marke – Palette ${pa}, ${un(v.LAGE_TXT)}.`, `23:20 – empties, ${un(v.SEITE_TXT)} of the trailer: the cash box goes into an odd crate – pallet ${pa}, ${un(v.LAGE_TXT)}.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="#141B2E"/>${stars(14)}<rect y="300" width="${W}" height="60" fill="#1E2A1C"/>
<g opacity=".8">${trailer(left ? 420 : 10, 140)}</g>
${[0, 1, 2].map((i) => { const q = first + i, b = br[q - 1] || 0; return `<rect x="${px(q) - 4}" y="290" width="88" height="10" fill="#B08A5A" ${o(1.6)}/>${[1, 2, 3, 4, 5].map((l) => { const odd = (q === pa && l === la) || (v.DECOYS || []).some(([dp, dl]) => dp === q && dl === l); return `<rect x="${px(q)}" y="${ly(l)}" width="80" height="32" rx="3" fill="${odd ? COL[b === 0 ? 1 : 0] : COL[b]}" ${o(1.8)}/>`; }).join("")}${T(px(q) + 40, 322, "P" + q, 14, 800, PAPER)}`; }).join("")}
<g class="rb-into" style="--d:1.8s;--x:${tx - (left ? 560 : 100)}px;--y:${ty - 200}px"><rect x="${left ? 538 : 78}" y="188" width="44" height="24" rx="3" fill="${BOX}" ${o(2)}/></g>
<g class="rb-fadein" style="--d:3.3s"><circle class="rb-pulse" cx="${tx}" cy="${ty}" r="18" fill="${RED}"/><rect x="${tx - 44}" y="${ty - 20}" width="88" height="40" rx="5" fill="none" stroke="${RED}" stroke-width="4"/></g>
${person(left ? 580 : 80, 440, 1.2, t, tf, TS)}
${clock(22, 350, "23:20")}`) });
  // Premium: Mitwisser und Pokal
  if (tier >= 1) {
    scenes.push({ dur: 7, sfx: [[0.8, "rustle"], [2.4, "click"], [3.8, "sting"]], sub: L(`${m} hat sich immer in die Bonkassa-Schichten getauscht. Das Geld der Vorjahre lag im ${un(v.POKAL)} aus ${v.STROM} (Inv. ${v.INV0}).`, `${m} kept swapping into the token till shifts. Earlier years’ money was in the ${un(v.POKAL)} from ${v.STROM} (inv. ${v.INV0}).`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2B2A27"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".06"/>
<g transform="translate(40,40)"><rect width="230" height="150" fill="${PAPER}" ${o(2.2)}/>${T(14, 26, L("Schichtplan", "Shift rota"), 14, 800, INK, "start")}${[0, 1, 2].map((r) => `<path d="M14,${48 + r * 30} L216,${48 + r * 30}" stroke="#B9AE98" stroke-width="2"/>${T(16, 68 + r * 30, L("Bonkassa", "Token till"), 11, 700, MUTED, "start")}<g class="rb-fadein" style="--d:${0.6 + r * 0.6}s">${T(214, 68 + r * 30, "⇄ " + short(m, 14), 11, 800, RED, "end")}</g>`).join("")}</g>
${person(150, 440, 1.3, m, mf, MS)}
<g class="rb-fadein" style="--d:2.4s"><g transform="translate(470,60)"><rect x="-120" y="0" width="240" height="250" fill="#3A2F24" ${o(3)}/><rect x="-108" y="12" width="216" height="226" fill="#1F2A44" opacity=".5"/><path d="M-30,60 L30,60 L22,120 Q0,140 -22,120 Z" fill="${GOLD}" ${o(2.4)}/><path d="M-30,70 Q-56,74 -40,100 M30,70 Q56,74 40,100" fill="none" stroke="${GOLD}" stroke-width="6"/><rect x="-14" y="132" width="28" height="18" fill="${GOLD}" ${o(2)}/><rect x="-30" y="150" width="60" height="14" fill="#5A4030" ${o(2)}/>${T(0, 190, String(v.STROM), 16, 800, PAPER)}${T(0, 214, (en ? "Inv. " : "Inv.-Nr. ") + v.INV0, 12, 700, "#C9C2B4")}<g class="rb-pop2" style="--d:3.8s">${T(0, 50, `${cur} ${cur} ${cur}`, cur.length > 1 ? 13 : 18, 900, "#3FAE4A")}</g></g></g>`) });
  }
  // Premium Plus: Blechkassa im Archivkasten
  if (tier >= 2) {
    scenes.push({ dur: 7, sfx: [[0.8, "creak"], [2.0, "click"], [2.4, "click"], [2.8, "click"], [3.2, "click"], [4.0, "chord"]], sub: L(`Der Rest: eine Blechkassa im Archivkasten, Code ${v.ZELT} – das erste Fest mit Zelt. Seit ${v.START} zweigt ${t} ab.`, `The rest: a cash tin in the archive cupboard, code ${v.ZELT} – the first fête with a marquee. Skimming since ${v.START}: ${t}.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>
<g transform="translate(60,40)"><rect width="230" height="280" fill="#6E5A3C" ${o(3)}/>${[0, 1, 2].map((r) => `<rect x="10" y="${84 + r * 86}" width="210" height="8" fill="#4A3B26"/>`).join("")}<rect x="40" y="110" width="150" height="60" rx="6" fill="#9CA3A8" ${o(2.4)}/>${T(115, 146, L("Blechkassa", "Cash tin"), 12, 800, INK)}</g>
<g transform="translate(450,180)"><rect x="-110" y="-70" width="220" height="140" rx="10" fill="${INK}" ${o(2.5, PAPER)}/>${T(0, -36, "CODE", 12, 700, "#8A94AE")}${String(v.ZELT).split("").map((d, i) => `<g class="rb-pop2" style="--d:${2 + i * 0.4}s"><rect x="${-84 + i * 44}" y="-18" width="36" height="48" rx="4" fill="#1F2A44" ${o(2, GOLD)}/>${T(-66 + i * 44, 16, d, 26, 800, GOLD)}</g>`).join("")}</g>
<g class="rb-fadein" style="--d:4s">${T(450, 300, L(`seit ${v.START} zweigt ${short(t, 16)} ab`, `skimming since ${v.START}: ${short(t, 16)}`), 13, 800, PAPER)}</g>`) });
  }
  // Rettung (kurz) ist in Szene 6: Akte
  const rows = [[L("Täter/in", "Culprit"), t], [L("Tür verriegelt", "Door bolted"), zeit], [L("Es fehlen", "Missing"), un(v.BETRAG_TXT)], [L("Kassette", "Cash box"), `${L("Palette", "Pallet")} ${pa} · ${L("Lage", "layer")} ${la}`]];
  if (tier >= 1) rows.push([L("Mitwisser/in · Pokal", "Accomplice · trophy"), `${m} · ${v.INV0}`]);
  if (tier >= 2) rows.push([L("Code Blechkassa", "Cash tin code"), String(v.ZELT)]);
  scenes.push({ dur: 9, sfx: [[0.4, "knock"], [0.8, "knock"], [2.2, "stamp"], [2.3, "chord"]], sub: L(`23:48 hört der Wirt das Klopfen – ${opfer} ist gerettet. Akte geschlossen.`, `At 23:48 the landlord hears the knocking – ${opfer} is rescued. Case closed.`), svg: closing(en, t, tf, TS, L("ERMITTLUNGSAKTE · EISKALT KASSIERT", "CASE FILE · COLD CASH"), rows) });
  return scenes;
}

export function rueckblendeTeams(caseId, v, tier, en) {
  const scenes = caseId === "fall-002" ? rueckblende002(v, tier, en) : rueckblende001(v, tier, en);
  // Lesezeit: höchstens 3 Wörter pro Sekunde plus 0,5 s (Plattform-Test 11.10.2026: Untertitel waren zu schnell)
  for (const sc of scenes) { const w = (sc.sub.match(/\S+/g) || []).length; sc.dur = Math.max(sc.dur, Math.ceil((w / 3 + 0.5) * 2) / 2); }
  return { music: "/assets/audio/rueckblende-teams.m4a", scenes };   // Musik 75 s, blendet am Ende aus
}
