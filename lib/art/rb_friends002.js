// Rückblende (animiertes Finale) Friends 002 „Vier Minuten Finsternis“ – Weihnachts-Special im Friends-Format, 21.10.2026.
// Spieler sind echte Personen: gesichtslose Silhouetten mit Namensschild (C.person, Wintermütze), Täter/in nur mit rotem Schild-Rand.
// Wimmer (erfunden, Opfer, überlebt) erscheint nur von hinten. Kino-Look: Christkindlmarkt bei Nacht, warme Hüttenlichter, Schnee.
// Szenen: 1 Markt vor der Zeremonie · 2 Punschhütte, Licht aus · 3 Spendenkassa im Dunkeln · 4 Kühlhütte · 5 Brett + Schablone · 6 Akte geschlossen · Abspann
import { INK, PAPER, RED, T, o, esc } from "./gn.js";
import { cine, SERIF, MONO, endcard } from "./cine.js";
import { cellOf } from "./special002.js";
import { shapeIcon } from "./friends002.js";

const W = 640, H = 360, GOLD = "#F2C14E", SNOW = "#E9EEF2", WOODC = "#7A4F2E";
const svg = (inner) => { const C = cine(W, H); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${C.wrap(inner)}</svg>`; };
const unesc = (s) => String(s).replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" }[x]));
const COATS = ["#8E3B2E", "#3E5C8A", "#6B7A3A", "#8C6E4E", "#5A4A5E", "#2F6B6B", "#A0782A", "#4A4A52"];
const HATS = ["#C9B79A", "#2F3A4E", "#7A2E26", "#4E6B4A", "#B08A3A", "#5E4E6E", "#8A8F96", "#3E6E78"];
let IDX = new Map();
const look = (name) => { const i = IDX.has(name) ? IDX.get(name) : 0; return { coat: COATS[i % 8], hat: HATS[(i + 3) % 8], hair: "#2A2018", skin: "#D9B99A", style: "beanie" }; };
const player = (C, x, y, s, name, hi = false, rim = "#FFD9A0", extra = {}) => C.person(x, y, s, { ...look(name), name: unesc(name), hi, rim, ...extra });
// Marktstand (Holzhütte mit Satteldach und Lichterkette)
const hut = (C, x, y, w, h, lit = true, label = "") => `${C.wood(x, y, w, h, WOODC, "#3E2A18")}
<path d="M${x - 10},${y + 2} L${x + w / 2},${y - h * 0.42} L${x + w + 10},${y + 2} Z" fill="#5A3A22"/><path d="M${x - 12},${y + 4} L${x + w / 2},${y - h * 0.44} L${x + w + 12},${y + 4} L${x + w + 4},${y + 6} L${x + w / 2},${y - h * 0.36} L${x - 4},${y + 6} Z" fill="${SNOW}"/>
<rect x="${x + 8}" y="${y + h * 0.3}" width="${w - 16}" height="${h * 0.42}" fill="${lit ? "#FFD27A" : "#1A1C24"}" opacity="${lit ? 0.85 : 1}"/>
${lit ? [...Array(Math.floor(w / 14))].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 5) * 0.3}s" cx="${x + 7 + i * 14}" cy="${y + 8 + (i % 2) * 3}" r="2.6" fill="${["#FFD27A", "#F26B4E", "#9FE0A0"][i % 3]}"/>`).join("") : ""}
${label ? T(x + w / 2, y + h * 0.24, label, 10, 800, lit ? PAPER : "#8A8F98") : ""}`;
// Großer Christbaum (an/aus)
const tree = (C, x, y, s, on, cls = "") => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-8" y="-6" width="16" height="26" fill="#3A2616"/>
${[0, 1, 2, 3].map((i) => `<path d="M0,${-170 + i * 40} L${40 + i * 18},${-110 + i * 40} L${-40 - i * 18},${-110 + i * 40} Z" fill="#14402A"/>`).join("")}
<g ${cls ? `class="${cls}"` : ""} ${on ? "" : 'opacity="0"'}>${[...Array(26)].map((_, i) => { const r = i / 26, yy = -150 + r * 140, ww = 20 + r * 80; return `<circle class="rb-twinkle" style="--d:${(i % 6) * 0.25}s" cx="${(((i * 37) % 100) / 100 - 0.5) * ww * 1.6}" cy="${yy}" r="3" fill="${["#FFD27A", "#F26B4E", "#FFF3C8"][i % 3]}"/>`; }).join("")}
${C.light(0, -100, 150, "#FFD27A", 0.35)}</g>
<path d="M0,-188 l6,12 l13,1 l-10,8 l4,13 l-13,-7 l-13,7 l4,-13 l-10,-8 l13,-1 Z" fill="${on ? GOLD : "#5E5A40"}" ${o(1.5)}/></g>`;
const box = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-26" y="-34" width="52" height="34" rx="3" fill="#B3261E" ${o(2)}/><rect x="-10" y="-38" width="20" height="5" fill="${INK}"/>${T(0, -12, "♥", 14, 800, PAPER)}</g>`;
const phoneLight = (C, x, y) => `${C.cone(x, y, 6, 120, y + 120, "#DDEBFF", 0.3)}<rect x="${x - 5}" y="${y - 9}" width="10" height="16" rx="2" fill="#1A1C22" stroke="#DDEBFF" stroke-width="1"/>`;
// Wimmer von hinten: Lodenmantel, Hut
const wimmer = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-44,0 Q-46,-74 -34,-106 Q-18,-122 0,-122 Q18,-122 34,-106 Q46,-74 44,0 Z" fill="#3E4A3A"/><ellipse cx="0" cy="-148" rx="21" ry="24" fill="#C9A07E"/><path d="M-34,-160 L34,-160 L30,-150 L-30,-150 Z M-20,-160 Q-20,-186 0,-186 Q20,-186 20,-160 Z" fill="#2F3A2A"/><path d="M-20,-166 h40" stroke="#B3261E" stroke-width="3"/></g>`;
const andList = (xs, and) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${and} ${xs[xs.length - 1]}`);

// d: { en, name, players[{name, st}], dark, take, cold, off, hide, hideName, x, y, word }
export function rueckblende({ en = false, name, players, dark, take, rawTake, cold, off, hide, hideName, keyHut, keyTag = null, word, tplX = 1 }) {
  const L = (d, e) => (en ? e : d);
  IDX = new Map(players.map((p, i) => [p.name, i]));
  const front = players.filter((p) => p.name !== name).map((p) => p.name).slice(0, 4);
  const scenes = [];

  // 1 Christkindlmarkt vor der Zeremonie
  scenes.push({ dur: 5.5, cam: "in", sfx: [[0.3, "wind"]], sub: L("Kerzenthal, Samstag vor dem dritten Advent. Gleich beginnt die Lichterzeremonie.", "Kerzenthal, the Saturday before the third Sunday of Advent. The lighting ceremony is about to start."), svg: svg((C) => `${C.sky("#060A18", "#2A3558", "#121A36")}${C.stars(34, 120)}
<path d="M250,150 L250,60 L262,40 L274,60 L274,150 Z" fill="#1A2140"/><rect x="200" y="110" width="124" height="80" fill="#1A2140"/>
<rect y="250" width="${W}" height="110" fill="${C.lin([[0, "#C9D3E2"], [1, "#7E8CA6"]])}"/>
${hut(C, 20, 200, 110, 70, true, L("MARONI", "CHESTNUTS"))}${hut(C, 150, 196, 104, 72, true, L("KRAPFEN", "DOUGHNUTS"))}${hut(C, 420, 196, 110, 72, true, L("PUNSCH · 24", "PUNCH · 24"))}${hut(C, 548, 200, 92, 70, true)}
${tree(C, 330, 290, 0.95, false)}
<g class="rb-fadein" style="--d:.6s">${[0, 1, 2, 3, 4, 5].map((i) => `<g transform="translate(${70 + i * 95},${330 + (i % 2) * 8}) scale(.42)" opacity=".85"><path d="M-40,0 Q-42,-70 -30,-100 Q0,-120 30,-100 Q42,-70 40,0 Z" fill="#1A1C24"/><ellipse cx="0" cy="-140" rx="20" ry="23" fill="#1A1C24"/></g>`).join("")}</g>
${C.snow(46)}${C.vignette(0.55)}
${C.title(L("MORDSTEAM FRIENDS · WEIHNACHTS-SPECIAL", "MORDSTEAM FRIENDS · CHRISTMAS SPECIAL"), L("Vier Minuten Finsternis", "Four Minutes Dark"), "", 36, 92)}`) });

  // 2 Punschhütte, das Licht geht aus
  const team = [...front]; team.splice(Math.ceil(front.length / 2), 0, name);
  const sx = (i) => 320 + (i - (team.length - 1) / 2) * 112;
  // alle nennen: passen nicht alle ins Bild, heißt es „… und der Rest der Runde“ (Test 21.10.2026)
  const crew = (and, rest) => (players.length > team.length ? `${team.map(unesc).join(", ")} ${rest}` : andList(team.map(unesc), and));
  scenes.push({ dur: 6.5, cam: "in", sfx: [[2.6, "click"]], sub: L(`Punschhütte 24: ${crew("und", "und der Rest der Runde")} schenken aus. Um ${dark} geht das Licht aus.`, `Punch hut 24: ${crew("and", "and the rest of the group")} are serving. At ${dark} the lights go out.`), svg: svg((C) => `${C.wood(0, 0, W, H, "#6B4A2C", "#2E1E10")}
${C.light(320, 40, 360, "#FFD27A", 0.45)}
${[...Array(14)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 5) * 0.3}s" cx="${20 + i * 46}" cy="${28 + (i % 2) * 6}" r="4" fill="${["#FFD27A", "#F26B4E", "#9FE0A0"][i % 3]}"/>`).join("")}
${team.map((n, i) => player(C, sx(i), 290, 0.95, n, n === name)).join("")}
<rect x="0" y="262" width="${W}" height="98" fill="${C.lin([[0, "#8A5A34"], [1, "#4A2E18"]])}"/><path d="M0,262 H${W}" stroke="#2A1A0C" stroke-width="4"/>
${[60, 150, 490, 580].map((x) => `<path d="M${x - 14},300 L${x + 12},300 L${x + 9},330 L${x - 11},330 Z M${x + 12},306 q10,0 9,8 q-1,7 -10,7" fill="#B3261E" ${o(2)}/>`).join("")}
${box(604, 256, 0.8)}
<g class="rb-fadein" style="--d:2.6s"><rect width="${W}" height="${H}" fill="#03050C" fill-opacity=".86"/></g>
<g class="rb-fadein" style="--d:3s">${C.time(dark)}</g>${C.vignette(0.5)}`) });

  // 3 Im Dunkeln: die Spendenkassa
  scenes.push({ dur: 6.5, cam: "in", sfx: [[1.4, "rattle"], [3.2, "beep"]], sub: L(`${take}: Im Handylicht nimmt ${unesc(name)} die Spendenkassa vom Tresen. Die Akku-Kassa druckt weiter – mit einer Uhr, die ${off} Minuten vorgeht.`, `${take}: by the light of a phone, ${unesc(name)} takes the donation box off the counter. The battery till keeps printing – with a clock that is ${off} minutes fast.`), svg: svg((C) => `<rect width="${W}" height="${H}" fill="#04060E"/>${C.stars(10, 60)}
${phoneLight(C, 230, 120)}
<g class="rb-fadein" style="--d:.3s">${player(C, 230, 320, 1.05, name, true, "#DDEBFF")}</g>
<g class="rb-walkout" style="--d:1.6s;--wd:2.8s">${box(300, 250, 1.1)}</g>
<rect x="0" y="262" width="${W}" height="98" fill="#140C06"/>
<g class="rb-slidein" style="--d:2.4s"><rect x="430" y="70" width="170" height="210" fill="#F4F0E6" ${o(1.5)}/>${T(515, 96, L("KASSA 24", "TILL 24"), 12, 800, INK)}<path d="M444,104 H586" stroke="${INK}" stroke-dasharray="3 3"/>
<text x="446" y="130" font-family="${MONO}" font-size="13" fill="${INK}">${esc(rawTake)}</text><text x="446" y="148" font-family="${MONO}" font-size="11" fill="${INK}">${esc(L("in Spendenkassa", "into donation box"))}</text>
<text x="446" y="180" font-family="${MONO}" font-size="13" fill="${RED}">${esc(rawTake)}</text><text x="446" y="198" font-family="${MONO}" font-size="11" fill="${RED}">${esc(L("nicht greifbar", "out of reach"))}</text>
${T(515, 252, L(`Uhr +${off} Min.`, `clock +${off} min`), 13, 800, RED)}</g>
${C.time(take)}${C.vignette(0.6)}`) });

  // 4 Die Kühlhütte
  scenes.push({ dur: 6.5, cam: "in", sfx: [[2.2, "boom"], [3, "click"], [3.6, "plop"]], sub: L(`${cold}: Wimmer hört die Münzen und geht hinterher. ${unesc(name)} stößt ihn in die Kühlhütte und sperrt zweimal zu. Dabei fällt eine rote Pfandmarke.`, `${cold}: Wimmer hears the coins and follows. ${unesc(name)} shoves him into the cold store and turns the key twice. A red deposit token falls to the ground.`), svg: svg((C) => `${C.sky("#05080F", "#1A2440")}
<rect x="300" y="60" width="240" height="230" fill="#AFC1D2" ${o(3)}/>${[...Array(6)].map((_, i) => `<path d="M300,${80 + i * 36} H540" stroke="#8EA2B5" stroke-width="3"/>`).join("")}
${T(420, 50, L("KÜHLHÜTTE · GRUBER", "COLD STORE · GRUBER"), 13, 800, SNOW)}
<rect x="340" y="110" width="160" height="180" fill="#0E1A2A"/>
<g class="rb-walkout" style="--d:1.4s;--wd:1.2s">${wimmer(420, 290, 0.95)}</g>
<g class="rb-fadein" style="--d:2.2s"><rect x="340" y="110" width="160" height="180" fill="#8EA2B5" ${o(3)}/><rect x="480" y="190" width="12" height="26" rx="3" fill="${INK}"/></g>
<g class="rb-walkin" style="--from:-180px;--wd:1.6s">${player(C, 220, 320, 1, name, true, "#9FB6E0")}</g>
<g class="rb-pop" style="--d:3.6s"><ellipse cx="290" cy="330" rx="20" ry="11" fill="#B3261E" ${o(2)}/>${T(290, 334, L("PFAND", "TOKEN"), 7, 800, PAPER)}</g>
<rect y="320" width="${W}" height="40" fill="#C9D3E2" opacity=".25"/>${C.snow(30)}${C.time(cold)}${C.vignette(0.55)}`) });

  // 5 Schlüsselbrett und Schablone
  scenes.push({ dur: 7.5, cam: "in", sfx: [[1, "click"], [3.4, "sting"]], sub: L(`Den Kühlhütten-Schlüssel hatte ${unesc(name)} schon vorher vom Brett genommen – an seinem Haken hing der Schlüssel von Hütte ${keyHut}. Mit Wimmers Generalschlüssel kommt die Kassa in die geschlossene Hütte ${hide}, gefunden im Dunkeln mit der Karton-Schablone vom Christbaum aus.`, `${unesc(name)} had taken the cold-store key off the board earlier – the key for hut ${keyHut} hung on its hook. With Wimmer’s master key the box goes into hut ${hide}, which was closed – found in the dark with the cardboard template, counted from the Christmas tree.`), svg: svg((C) => `${C.wood(0, 0, W, H, "#3A2616", "#140C06")}
<rect x="24" y="30" width="200" height="140" fill="#9A7650" ${o(2)}/>${T(124, 52, L("SCHLÜSSELBRETT", "KEY BOARD"), 11, 800, PAPER)}
${[0, 1, 2, 3].map((i) => `<path d="M${54 + i * 46},76 q0,10 5,12" fill="none" stroke="#5E5A52" stroke-width="3"/>`).join("")}
<g class="rb-fadeout" style="--d:.9s"><rect x="56" y="92" width="10" height="30" fill="#8A8F96"/></g>
<g class="rb-fadein" style="--d:1.1s"><rect x="56" y="92" width="10" height="30" fill="#8A8F96"/>${keyTag ? shapeIcon(keyTag, 61, 138, 10) : `<circle cx="61" cy="136" r="9" fill="${GOLD}" ${o(1.5)}/>`}${T(61, 160, String(keyHut), 11, 800, RED)}</g>
${T(61, 72, L("KÜHL", "COLD"), 9, 800, INK)}
<rect x="250" y="30" width="360" height="300" fill="#F7F1E3" ${o(2)}/>
${[...Array(4)].map((_, r) => [...Array(6)].map((_, c) => `<rect x="${266 + c * 56}" y="${46 + r * 52}" width="48" height="44" fill="${WOODC}" opacity=".85" ${o(1)}/>`).join("")).join("")}
${tree(C, 266 + 2 * 56 + 24, 318, 0.3, true)}
<g class="rb-slideup" style="--d:1.8s"><rect x="${266 + tplX * 56 - 4}" y="${46 + 52 - 4}" width="${3 * 56}" height="${3 * 52}" fill="#B98B5E" opacity=".8" ${o(2)}/></g>
${(() => { const [c, r] = cellOf(Number(hide)) || [0, 0], hx = 266 + c * 56 + 24, hy = 46 + r * 52 + 22; return `<g class="rb-pop" style="--d:3.4s"><circle class="rb-pulse" cx="${hx}" cy="${hy}" r="20" fill="${RED}" opacity=".5"/><circle cx="${hx}" cy="${hy}" r="14" fill="${RED}"/>${T(hx, hy + 5, String(hide), 13, 800, PAPER)}</g>`; })()}
<g class="rb-slideup" style="--d:4s"><rect x="24" y="200" width="200" height="40" fill="#0B0C10" opacity=".85"/>${T(124, 225, `${L("Hütte", "Hut")} ${hide} · ${unesc(hideName)}`, 12, 800, GOLD)}</g>${C.vignette(0.45)}`) });

  // 6 Akte geschlossen
  scenes.push({ dur: 9, cam: "out", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: svg((C) => `${C.sky("#05080F", "#1A2440")}${C.stars(20, 120)}
${tree(C, 70, 330, 0.75, true)}
<g class="rb-fadein" style="--d:.2s"><g class="rb-breathe">${player(C, 196, 345, 0.8, name, true, "#9FB6E0")}</g></g>
<g class="rb-slidein" style="--d:.6s"><rect x="296" y="48" width="320" height="252" fill="#000" opacity=".45"/>
<rect x="290" y="40" width="320" height="252" fill="${C.lin([[0, "#FBF6EA"], [1, "#DCD0B8"]], 0, 0, 1, 1)}"/>
${T(450, 74, L("ERMITTLUNGSAKTE · FRIENDS", "CASE FILE · FRIENDS"), 13, 800, "#5E5A52")}<path d="M310,86 L590,86" stroke="${INK}" stroke-width="1.4"/>
${T(310, 112, L("Täter/in", "Culprit"), 12, 700, "#5E5A52", "start")}<text x="310" y="136" font-family="${SERIF}" font-weight="800" font-size="21" fill="${INK}">${esc(unesc(name))}</text>
${T(310, 160, L("Spendenkassa weg", "Donation box gone"), 12, 700, "#5E5A52", "start")}<text x="310" y="182" font-family="${MONO}" font-weight="700" font-size="18" fill="${INK}">${esc(take)}</text>
${T(310, 206, L("Versteck", "Hiding place"), 12, 700, "#5E5A52", "start")}${T(310, 226, `${L("Hütte", "Hut")} ${hide}`, 14, 700, INK, "start")}
${T(310, 250, L("In den Sternen", "In the stars"), 12, 700, "#5E5A52", "start")}${T(310, 270, word, 14, 800, RED, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,300) rotate(-6)" opacity=".92"><rect x="-138" y="-24" width="276" height="48" fill="none" stroke="${RED}" stroke-width="5"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), 24, 900, RED)}</g></g>${C.snow(30)}${C.vignette(0.5)}`) });

  scenes.push(endcard({ en, plural: true }));
  return { music: "/assets/audio/rueckblende-special-weihnachten.m4a", scenes };
}
