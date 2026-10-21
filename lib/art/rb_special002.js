// Rückblende (animiertes Finale) Weihnachts-Special „Vier Minuten Finsternis“ – 21.10.2026.
// Sechs Szenen aus den Spieldaten der Runde (lib/cases/special-002.js roundOf): Dunkelzeit, vorgehende Turmuhr,
// Täter/in, Häferl-Motiv, Versteck-Hütte und Code. Kino-Look wie die anderen Rückblenden (lib/art/cine.js).
import { INK, PAPER, RED, MUTED, o, T, esc } from "./gn.js";
import { cine, SERIF, endcard } from "./cine.js";
import { motif } from "./special002.js";

const W = 640, H = 360, GOLD = "#F2C14E", SNOW = "#EEF2F7", WARM = "#FFD27A";
const scene = (inner) => { const C = cine(W, H); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${C.wrap(inner)}</svg>`; };
const wrap2 = (t, n) => { const w = String(t).split(" "), out = [""]; for (const x of w) { if ((out[out.length - 1] + " " + x).trim().length > n && out.length < 2) out.push(x); else out[out.length - 1] = (out[out.length - 1] + " " + x).trim(); } return [out[0], out[1] || ""]; };
const hm = (t) => { const [h, m] = String(t).split(":").map(Number); return [h, m]; };

// Kirchturm mit beleuchteter Uhr (zeigt die Uhrzeit t = "18:05")
function tower(C, x, y, r, t, lit = true) {
  const [h, m] = hm(t), am = (m / 60) * 360, ah = ((h % 12) / 12) * 360 + m / 2;
  const hand = (ang, len, w) => `<path d="M0,0 L0,${-len}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" transform="rotate(${ang})"/>`;
  return `<path d="M${x - r - 20},${H} L${x - r - 20},${y - r - 30} L${x},${y - r - 110} L${x + r + 20},${y - r - 30} L${x + r + 20},${H} Z" fill="#161C2E" ${o(3)}/><path d="M${x},${y - r - 110} L${x},${y - r - 136} M${x - 9},${y - r - 126} L${x + 9},${y - r - 126}" stroke="${INK}" stroke-width="4"/>
${lit ? C.light(x, y, r * 2.4, "#FFE9A8", 0.45) : ""}<g transform="translate(${x},${y})"><circle r="${r}" fill="${lit ? "#F6E7B0" : "#5A5A60"}" ${o(3)}/>${[...Array(12)].map((_, i) => `<path d="M0,${-r + 3} L0,${-r + (i % 3 ? 9 : 14)}" stroke="${INK}" stroke-width="${i % 3 ? 1.6 : 3}" transform="rotate(${i * 30})"/>`).join("")}${hand(ah, r * 0.5, 4.5)}${hand(am, r * 0.8, 2.8)}<circle r="3.5" fill="${INK}"/></g>`;
}
// Holzhütte mit Nummer; lit = Lichterkette und Fenster an
function hut(C, x, y, w, n, lit, closed = false) {
  const h = w * 0.72;
  const bulbs = [0.15, 0.32, 0.5, 0.68, 0.85].map((t, i) => `<circle class="${lit ? "rb-twinkle" : ""}" style="--d:${i * 0.3}s" cx="${x + w * t}" cy="${y + 10 + Math.sin(t * Math.PI) * 6}" r="3.6" fill="${lit ? (i % 2 ? GOLD : "#FFF1C8") : "#3A3836"}"/>`).join("");
  return `<g><path d="M${x - 8},${y} L${x + w / 2},${y - h * 0.5} L${x + w + 8},${y} Z" fill="#6A2A24" ${o(2.4)}/><path d="M${x - 8},${y} L${x + w / 2},${y - h * 0.5} L${x + w + 8},${y}" stroke="${SNOW}" stroke-width="5" fill="none"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#5A3A26" ${o(2.4)}/><rect x="${x + 10}" y="${y + 16}" width="${w - 20}" height="${h * 0.45}" fill="${closed ? "#3A2618" : lit ? "#FFD27A" : "#1A120E"}" ${o(1.6)}/>${closed ? [...Array(4)].map((_, i) => `<path d="M${x + 10},${y + 22 + i * (h * 0.45 / 4)} L${x + w - 10},${y + 22 + i * (h * 0.45 / 4)}" stroke="#2A1A10" stroke-width="2"/>`).join("") : ""}
${lit && !closed ? C.light(x + w / 2, y + 30, w * 0.9, WARM, 0.3, "rb-flicker") : ""}${bulbs}<circle cx="${x + w / 2}" cy="${y - h * 0.22}" r="11" fill="${PAPER}" ${o(1.6)}/>${T(x + w / 2, y - h * 0.22 + 4, String(n), 11, 900, INK)}</g>`;
}
// Christbaum (an/aus)
function tree(C, x, y, s, lit) {
  const lights = [...Array(16)].map((_, i) => { const ly = -40 - (i % 8) * 22 * s, lx = ((i * 37) % 60 - 30) * (1 - (i % 8) / 9) * s; return `<circle class="rb-twinkle" style="--d:${(i % 5) * 0.25}s" cx="${x + lx}" cy="${y + ly}" r="3" fill="${i % 3 ? GOLD : "#FFF4D6"}"/>`; }).join("");
  return `<path d="M${x},${y - 200 * s} L${x + 70 * s},${y - 10} L${x - 70 * s},${y - 10} Z" fill="#163A28" ${o(3)}/><rect x="${x - 8 * s}" y="${y - 12}" width="${16 * s}" height="14" fill="#4A2E1E"/>${lit ? lights + C.light(x, y - 100 * s, 120 * s, WARM, 0.25) : ""}<path transform="translate(${x},${y - 206 * s}) scale(${s})" d="M0,-16 l5,11 12,1 -9,8 3,12 -11,-7 -11,7 3,-12 -9,-8 12,-1 Z" fill="${lit ? GOLD : "#6A5E3A"}" ${o(1.6)}/>`;
}
// Figuren (wie im Gruppenfoto der Akte: Kleidung je Person)
const LOOK = {
  gerry: { coat: "#4A3A2E", style: "cap", hair: "#2A2018" },
  elfi: { coat: "#7A2E3A", style: "bun", hair: "#8A5A2A" },
  rosi: { coat: "#2F5A3A", style: "curly", hair: "#B04A2A" },
  konrad: { coat: "#3F5A35", style: "bald", hair: "#C9C2B4" },
  jonas: { coat: "#F1EEE6", style: "curly", hair: "#E2C06A" },
};
const fig = (C, k, x, y, s = 1, extra = {}) => { const L = LOOK[k] || LOOK.gerry; return `${k === "jonas" ? `<g transform="translate(${x},${y}) scale(${s})"><path d="M-30,-100 Q-80,-150 -72,-50 Q-52,-70 -30,-70 Z M30,-100 Q80,-150 72,-50 Q52,-70 30,-70 Z" fill="${GOLD}" ${o(2)}/></g>` : ""}${C.person(x, y, s, { ...L, rim: "#9FB6E0", ...extra })}`; };
const brunner = (C, x, y, s = 1, extra = {}) => C.person(x, y, s, { coat: "#1F3A5A", style: "short", hair: "#8A8A90", rim: "#9FB6E0", ...extra });
const box = (s = 1) => `<g transform="scale(${s})"><rect x="-26" y="-20" width="52" height="38" rx="4" fill="#B03A2E" ${o(2.4)}/><rect x="-10" y="-26" width="20" height="8" rx="2" fill="#5A5A60" ${o(1.6)}/><rect x="-16" y="-8" width="32" height="16" rx="2" fill="#E3E7EC" ${o(1.4)}/></g>`;
const mug = (k, s = 1) => `<g transform="scale(${s})"><path d="M14,-14 Q30,-14 30,0 Q30,14 14,14" fill="none" ${o(5)}/><path d="M-20,-24 L20,-24 L18,22 Q0,28 -18,22 Z" fill="${PAPER}" ${o(3)}/><rect x="-20" y="-24" width="40" height="7" fill="${RED}"/>${motif(k, 0, 2, 12)}</g>`;

export function rueckblende(c, v, { en = false, name, short, dark, darkClock, time, timeClock, motifKey, motifName, hide, hideName, code }) {
  const L = (d, e) => (en ? e : d);
  const scenes = [];
  const market = (C, lit, clock) => `${C.sky("#070B18", "#1A2340", "#0F1730")}${C.stars(28, 130)}${tower(C, 560, 112, 30, clock, true)}
${tree(C, 110, 286, 1.05, lit)}${hut(C, 190, 210, 92, 9, lit)}${hut(C, 300, 214, 86, 16, lit)}${hut(C, 404, 210, 90, 24, lit)}
${C.floor(286, "#2A3346", "#0C1018")}<path d="M0,286 Q160,280 320,288 T640,284 L640,296 L0,296 Z" fill="${SNOW}" opacity=".8"/>`;

  // 1 Titel: der Markt kurz vor der Lichterzeremonie
  scenes.push({ dur: 5, cam: "in", sfx: [[0.3, "wind"], [0.8, "chord"]], sub: L("Christkindlmarkt in Kerzenthal. Um 18:00 sollte das Christkind den Baum einschalten.", "The Christmas market in Kerzenthal. At 18:00 the Christkind was due to switch on the tree."), svg: scene((C) => `${market(C, true, "17:58")}
${C.snow(40)}<rect width="360" height="${H}" fill="${C.lin([[0, "#000", 0.65], [1, "#000", 0]], 0, 0, 1, 0)}"/>
${C.title(L("VIER MINUTEN FINSTERNIS", "FOUR MINUTES DARK"), L("Was wirklich geschah", "What really happened"), "", 34, 312)}
${C.vignette(0.55)}`) });

  // 2 Dunkel: Marktbeleuchtung aus, nur die Turmuhr leuchtet – sie geht vor
  scenes.push({ dur: 6.5, cam: "right", sfx: [[1.0, "click"], [1.2, "boom"], [2.4, "wind"]], sub: L(`${dark}: Die Lichter gehen aus – vier Minuten Finsternis. Nur die Turmuhr leuchtet, und sie geht vor.`, `${dark}: the lights go out – four minutes of darkness. Only the tower clock is lit, and it runs fast.`), svg: scene((C) => `${market(C, false, darkClock)}
<g class="rb-fadeout" style="--d:1s">${market(C, true, darkClock)}</g>
<g class="rb-fadein" style="--d:1.1s"><rect width="${W}" height="${H}" fill="#000" opacity=".45"/>${tower(C, 560, 112, 30, darkClock, true)}</g>
${[...Array(9)].map((_, i) => `<circle class="rb-twinkle" style="--d:${1.6 + (i % 4) * 0.3}s" cx="${60 + i * 52}" cy="${300 + (i % 3) * 12}" r="3" fill="#CFE0FF" opacity=".8"/>`).join("")}
${C.snow(30)}${C.time(dark)}${C.vignette(0.65)}`) });

  // 3 Die Kassa: im Dunkeln vom Punschstand genommen, Wimmer sieht es im Handylicht
  scenes.push({ dur: 7, cam: "left", sfx: [[0.5, "step"], [0.9, "step"], [1.3, "step"], [1.7, "rattle"], [3.2, "step"], [3.6, "step"]], sub: L(`Im Dunkeln nimmt ${name} die Spendenkassa vom Punschstand. Marktmeister Wimmer sieht es im Licht seines Handys und läuft nach.`, `In the dark, ${name} takes the donation box from the punch stall. Market manager Wimmer sees it by the light of his phone and follows.`), svg: scene((C) => `${C.sky("#05070F", "#121A2E")}${C.stars(14, 90)}
${hut(C, 300, 170, 200, 24, false)}${T(400, 290, L("PUNSCH · ELTERNVEREIN", "PUNCH · PARENTS’ ASSOCIATION"), 11, 800, "#C9C2B4")}
${C.floor(300, "#1E2636", "#080A10")}${C.shadow(300, 304, 60, 8)}
<g class="rb-walkout" style="--to:-300px;--wd:3.4s;--d:1.8s">${fig(C, c, 330, 302, 0.92)}<g transform="translate(352,226)">${box(0.9)}</g></g>
<g class="rb-fadein" style="--d:2.4s">${C.cone(560, 150, 10, 260, 340, "#E8F0FF", 0.35)}${brunner(C, 570, 302, 0.9)}<rect x="548" y="140" width="14" height="22" rx="2" fill="#E8F0FF" ${o(1.4)}/></g>
${C.tint("#1A2A5A", 0.2)}${C.vignette(0.7)}`) });

  // 4 Die Kühlhütte: hineingestoßen, Riegel vor – die Turmuhr zeigt die vorgehende Zeit
  scenes.push({ dur: 7, cam: "in", sfx: [[0.6, "boom"], [1.2, "click"], [2.6, "knock"], [3.0, "knock"], [3.4, "knock"]], sub: L(`${time}: ${short} stößt Wimmer in die Kühlhütte, reißt ihm den Generalschlüssel vom Gürtel und schiebt den Riegel vor. Das Häferl mit dem Motiv „${motifName}“ bleibt drinnen.`, `${time}: ${short} shoves Wimmer into the cold store, tears the master key off his belt and pushes the bolt across. The mug with the ${motifName} motif is left inside.`), svg: scene((C) => `${C.sky("#060912", "#141C30")}
${tower(C, 560, 96, 34, timeClock, true)}
<rect x="80" y="60" width="330" height="${H}" fill="#9FB2C4" ${o(3)}/><rect x="120" y="96" width="250" height="${H}" fill="#8BA0B5" ${o(3)}/>${T(245, 86, L("KÜHLHÜTTE", "COLD STORE"), 15, 900, INK)}
${C.cone(40, 360, 20, 300, 160, "#E8F0FF", 0.18)}
<g transform="translate(330,226)"><rect x="-20" y="-12" width="96" height="22" rx="4" fill="#7E8791" ${o(2.4)}/><rect x="-10" y="-24" width="20" height="46" rx="3" fill="#5E6670" ${o(2)}/>
<g class="rb-slidein" style="--d:1.0s"><rect x="40" y="-6" width="60" height="12" rx="3" fill="#C9CFD6" ${o(1.8)}/></g></g>
<g class="rb-slidein" style="--d:.7s"><g transform="translate(436,232)"><path d="M26,-20 L220,-34 L220,22 L26,22 Z" fill="#2A2233" ${o(2.4)}/><path d="M0,-24 Q30,-30 40,-8 Q46,14 26,22 L-4,22 Q-18,6 0,-24 Z" fill="#1E1E22" ${o(2.4)}/>${[0, 1, 2, 3].map((i) => `<path d="M${2 + i * 8},-18 l-2,34" stroke="#3A3A40" stroke-width="2"/>`).join("")}</g></g>
<g class="rb-fadein" style="--d:2.2s"><rect x="150" y="250" width="110" height="90" rx="6" fill="#0B0C10" opacity=".7"/><g transform="translate(205,302)">${mug(motifKey, 1.4)}</g></g>
${C.time(time)}${C.tint("#2A3A6A", 0.18)}${C.vignette(0.65)}`) });

  // 5 Das Versteck: geschlossene Hütte, Generalschlüssel, neuer Code
  scenes.push({ dur: 7, cam: "right", sfx: [[0.6, "step"], [1.0, "step"], [1.8, "click"], [2.8, "rustle"], [4.0, "beep"], [4.3, "beep"], [4.6, "beep"], [4.9, "beep"]], sub: L(`Mit Wimmers Generalschlüssel verschwindet die Kassa in Hütte ${hide} – die ist das ganze Wochenende zu. Neuer Code: ${code}.`, `With Wimmer’s master key, the box disappears into hut ${hide} – it is closed all weekend. New code: ${code}.`), svg: scene((C) => `${C.sky("#05070F", "#121A2E")}${C.stars(18, 100)}${C.snow(24)}
${hut(C, 250, 150, 220, hide, false, true)}<g transform="translate(360,214) rotate(-4)"><rect x="-70" y="-14" width="140" height="28" fill="${PAPER}" ${o(2)}/>${T(0, 5, L("HEUTE GESCHLOSSEN", "CLOSED TODAY"), 12, 900, RED)}</g>
${C.floor(310, "#1E2636", "#080A10")}${C.shadow(200, 314, 60, 8)}
<g class="rb-walkin" style="--from:-240px;--wd:1.8s;--d:.2s">${fig(C, c, 200, 312, 0.9, { back: true })}<g class="rb-into" style="transform-box:fill-box;transform-origin:center;--d:2.6s;--x:150px;--y:-20px"><g transform="translate(232,236)">${box(0.9)}</g></g></g>
<g class="rb-fadein" style="--d:3.6s"><g transform="translate(520,250)"><rect x="-64" y="-70" width="128" height="140" rx="12" fill="#9AA3AE" ${o(2.4)}/><rect x="-50" y="-58" width="100" height="24" rx="4" fill="#20262E"/>${T(0, -40, code, 18, 800, "#7FE0A0")}${[...Array(9)].map((_, i) => `<rect x="${-46 + (i % 3) * 32}" y="${-26 + Math.floor(i / 3) * 30}" width="26" height="24" rx="4" fill="#E3E7EC" ${o(1.4)}/>${T(-33 + (i % 3) * 32, -9 + Math.floor(i / 3) * 30, String(i + 1), 11, 800, INK)}`).join("")}</g></g>
${C.tint("#1A2A5A", 0.2)}${C.vignette(0.65)}`) });

  // 6 Akte geschlossen
  scenes.push({ dur: 9, cam: "out", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: scene((C) => {
    const paper = C.lin([[0, "#F6F0E2"], [1, "#DCCFB4"]], 0, 0, 0.4, 1);
    const [h1, h2] = wrap2(hideName, 30);
    return `${C.wood(0, 0, W, H, "#3A2618", "#1A100A")}${C.light(420, 120, 380, "#FFD99A", 0.3)}
<g class="rb-fadein" style="--d:.2s"><g transform="rotate(-6 150 190)"><rect x="70" y="96" width="170" height="200" fill="#000" opacity=".35" transform="translate(6,8)"/><rect x="70" y="96" width="164" height="196" fill="#F4EFE4" ${o(2)}/><rect x="82" y="108" width="140" height="150" fill="#2A3150"/><g transform="translate(152,196)">${mug(motifKey, 2.1)}</g>${T(152, 280, L("Beweisstück: Häferl", "Exhibit: mug"), 11, 700, MUTED)}</g></g>
<g class="rb-slidein" style="--d:.6s"><rect x="296" y="48" width="320" height="252" fill="#000" opacity=".4"/><rect x="290" y="40" width="320" height="252" fill="${paper}" ${o(3)}/>${T(310, 70, L("ERMITTLUNGSAKTE · KERZENTHAL", "CASE FILE · KERZENTHAL"), 12, 800, RED, "start")}
${T(310, 100, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}${T(310, 122, name, 17, 800, INK, "start")}
${T(310, 148, L("Riegel vor um", "Bolted at"), 12, 700, MUTED, "start")}${T(310, 168, time, 17, 800, INK, "start")}
${T(310, 192, L("Versteck", "Hiding place"), 12, 700, MUTED, "start")}${T(310, 210, h1, 13, 800, INK, "start")}${T(310, 226, h2, 13, 800, INK, "start")}
${T(310, 250, L("Code der Kassa", "Box code"), 12, 700, MUTED, "start")}${T(310, 272, code, 18, 800, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(450,308) rotate(-6)"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), 24, 900, RED).replace("<text ", '<text letter-spacing="2" ')}</g></g>
${C.vignette(0.55)}`;
  }) });
  scenes.push(endcard({ en, plural: false }));
  return { music: "/assets/audio/rueckblende-special-weihnachten.m4a", scenes };
}
export { esc, SERIF };
