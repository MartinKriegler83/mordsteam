// Rückblende (animiertes Finale) Halloween-Special „Süßes oder Saures“ – 13.10.2026.
// Sechs Szenen aus den Spieldaten der Runde: Täter (Kostüm, Größe, Schuhe), Tatzeit, Versteck, Kamerazonen, Wort.
// Kino-Look wie die anderen Rückblenden (lib/art/cine.js), Bewegung über die rb-*-Klassen des Players.
import { INK, PAPER, RED, MUTED, SKIN, o, T, esc } from "./gn.js";
import { cine, SERIF, endcard } from "./cine.js";
import { person, deco, pumpkin, suitOnly, ORANGE, VIOLET, BONE } from "./special001.js";

const W = 640, H = 360, GOLD = "#F2C14E", MOON = "#F3EED8";
const scene = (inner) => { const C = cine(W, H); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${C.wrap(inner)}</svg>`; };
const wrap2 = (t, n) => { const w = String(t).split(" "), out = [""]; for (const x of w) { if ((out[out.length - 1] + " " + x).trim().length > n && out.length < 2) out.push(x); else out[out.length - 1] = (out[out.length - 1] + " " + x).trim(); } return [out[0], out[1] || ""]; };
const bat = (x, y, s = 1, d = 0) => `<g class="rb-drift" style="--d:${d}s"><path transform="translate(${x},${y}) scale(${s})" d="M0,0 Q-8,-10 -20,-6 Q-14,-2 -16,6 Q-8,0 -4,6 Q0,2 0,6 Q0,2 4,6 Q8,0 16,6 Q14,-2 20,-6 Q8,-10 0,0 Z" fill="#0B0912"/></g>`;
const lanternLight = (C, x, y, r = 40) => C.light(x, y, r, "#FFB347", 0.5, "rb-flicker");

// Frank im Sarg, aufgesetzt mit Cider-Becher (grauer Schnauzer, orangefarbener Pullover „BOO“)
const frank = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-34,0 Q-36,-46 -24,-62 Q0,-72 24,-62 Q36,-46 34,0 Z" fill="${ORANGE}" ${o(2.4)}/>${T(0, -28, "BOO", 13, 900, INK)}<rect x="-8" y="-76" width="16" height="10" fill="${SKIN}" ${o(1.6)}/><ellipse cx="0" cy="-94" rx="19" ry="22" fill="${SKIN}" ${o(2.2)}/><path d="M-19,-100 Q-20,-118 0,-118 Q20,-118 19,-100 Q14,-110 0,-110 Q-14,-110 -19,-100 Z" fill="#C9C4BA" ${o(1.6)}/><path d="M-9,-86 Q0,-80 9,-86" fill="none" stroke="#C9C4BA" stroke-width="5" stroke-linecap="round"/><path d="M-9,-97 l5,0 M4,-97 l5,0" ${o(2.4)}/><g transform="translate(30,-46)"><rect x="-9" y="-14" width="18" height="22" rx="3" fill="#7A3B1E" ${o(2)}/><path d="M9,-8 q8,0 8,7 q0,7 -8,7" fill="none" ${o(2)}/><path class="rb-drift" d="M-3,-18 q-4,-8 2,-14 M3,-18 q4,-8 -1,-14" fill="none" stroke="#F1EADB" stroke-width="1.8" opacity=".7"/></g><path d="M24,-56 L34,-50" ${o(8, ORANGE)}/></g>`;
// Sarg (offen: Deckel lehnt hinten; zu: Deckel liegt mit Riegel)
const coffin = (x, y, open, bolt = false) => `<g transform="translate(${x},${y})">${open ? `<path d="M-60,-20 L-46,-118 L60,-118 L74,-20 Z" fill="#3A2420" ${o(2.6)}/><path d="M-38,-104 L52,-104" stroke="#5A3A30" stroke-width="3"/>${T(7, -72, "R.I.P.", 16, 900, BONE)}` : ""}<path d="M-80,0 L-66,-34 L84,-34 L98,0 Z" fill="#2B1E1A" ${o(2.6)}/>${open ? `<path d="M-70,-30 L88,-30 L84,-38 L-66,-38 Z" fill="#7A1F2B" ${o(1.6)}/>` : `<path d="M-74,-34 L-62,-56 L80,-56 L92,-34 Z" fill="#5A2E2E" ${o(2.6)}/>${T(10, -40, "R.I.P.", 14, 900, BONE)}`}${bolt ? `<g class="rb-pop" style="--d:.9s"><rect x="-6" y="-50" width="34" height="10" rx="2" fill="#B8935A" ${o(2)}/><rect x="10" y="-56" width="8" height="22" fill="#8A6A3A" ${o(1.6)}/></g>` : ""}</g>`;
// Versteck-Deko groß gezeichnet
const HIDE_ART = {
  1: () => `<path d="M-46,0 L-46,-86 Q-46,-120 0,-120 Q46,-120 46,-86 L46,0 Z" fill="#8A8F96" ${o(3)}/><path d="M-46,0 L-46,-86 Q-46,-120 0,-120 L0,0 Z" fill="#000" opacity=".12"/>${T(0, -72, "BOO", 18, 900, INK)}${T(0, -50, "HILL", 14, 800, INK)}<path d="M-20,-30 l12,10 M14,-34 l-8,14" stroke="#5E6168" stroke-width="2"/>`,
  3: () => `<ellipse cx="0" cy="-52" rx="72" ry="54" fill="${ORANGE}" ${o(3)}/>${[-40, -16, 16, 40].map((dx) => `<path d="M${dx},-104 Q${dx * 1.35},-52 ${dx},0" fill="none" stroke="#B4561B" stroke-width="2.4"/>`).join("")}<path d="M0,-104 q6,-18 18,-20" stroke="#3F5A35" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M-36,-64 l14,-16 l12,16 Z M36,-64 l-14,-16 l-12,16 Z M-38,-34 Q0,-6 38,-34 Q0,-20 -38,-34 Z" fill="#FFD36B"/>`,
  4: () => `<rect x="-78" y="-64" width="156" height="64" rx="8" fill="#D9B45A" ${o(3)}/>${[...Array(14)].map((_, i) => `<path d="M${-70 + i * 11},${-58 + (i % 3) * 6} l${(i % 2 ? 6 : -4)},${44 - (i % 3) * 6}" stroke="#A9842E" stroke-width="2"/>`).join("")}<path d="M-78,-34 L78,-34" stroke="#7A5A1E" stroke-width="4"/>`,
  5: () => `<path d="M0,0 L0,-150 M-60,-110 L60,-110" stroke="#6B4A2A" stroke-width="8" stroke-linecap="round"/><path d="M-56,-114 L56,-114 L44,-50 L-44,-50 Z" fill="#9A2B2B" ${o(2.6)}/>${[-30, 0, 30].map((dx) => `<path d="M${dx},-114 L${dx * 0.8},-50" stroke="${INK}" stroke-width="1.4" opacity=".6"/>`).join("")}<ellipse cx="0" cy="-138" rx="22" ry="24" fill="#D9C39A" ${o(2.4)}/><path d="M-30,-152 L30,-152 L18,-164 L-18,-164 Z" fill="#7A5A30" ${o(2)}/><path d="M-8,-142 l4,0 M5,-142 l4,0 M-8,-128 Q0,-124 8,-128" ${o(2)}/><path d="M-44,-50 l-6,12 M44,-50 l6,12 M-56,-114 l-10,6 M56,-114 l10,6" stroke="#E9C46A" stroke-width="3"/>`,
  8: (C) => `${C.light(0, -70, 70, "#7FD36B", 0.45, "rb-flicker")}<path d="M-62,-70 Q-66,-6 0,0 Q66,-6 62,-70 Z" fill="#1B1A1F" ${o(3)}/><ellipse cx="0" cy="-70" rx="64" ry="14" fill="#2A2A30" ${o(2.6)}/><ellipse cx="0" cy="-70" rx="54" ry="9" fill="#7FD36B"/>${[[-20, -84], [8, -92], [26, -82]].map(([x, y], i) => `<circle class="rb-pop" style="--d:${0.3 + i * 0.3}s" cx="${x}" cy="${y}" r="${6 - i}" fill="#A6E88E" ${o(1.2)}/>`).join("")}<path d="M-50,0 l-8,10 M50,0 l8,10" ${o(5)}/>`,
};
const envelope = (s = 1) => `<g transform="scale(${s})"><rect x="-26" y="-16" width="52" height="32" rx="2" fill="#F4EFE4" ${o(2)}/><path d="M-26,-16 L0,4 L26,-16" fill="none" ${o(2)}/>${T(0, 12, "$5,000", 9, 800, RED)}</g>`;

export function rueckblende(c, v, { en = false, name, short, costume, kostuem, inch, shoe, time, tPause, tHide, hide, hideName, hideIn, zones, word }) {
  const L = (d, e) => (en ? e : d);
  const scenes = [];
  // 1 Titel: Hollow Lane bei Nacht – Vollmond, Kürbislaternen, Franks Haus mit Skeletten
  scenes.push({ dur: 5, cam: "in", sfx: [[0.3, "wind"], [0.6, "sting"]], sub: L("Halloween in der Hollow Lane. Um 22:00 sollte der Preis vergeben werden.", "Halloween on Hollow Lane. The prize was due to be handed out at 22:00."), svg: scene((C) => {
    const house = (x, w, h, lit) => `<path d="M${x},262 L${x},${262 - h} L${x + w / 2},${262 - h - w * 0.36} L${x + w},${262 - h} L${x + w},262 Z" fill="#141022" ${o(2.4, "#05040A")}/>${lit.map(([dx, dy]) => `<rect x="${x + dx}" y="${262 - h + dy}" width="16" height="18" fill="#FFB347" opacity=".85"/>`).join("")}`;
    return `${C.sky("#05040C", VIOLET, "#1A1230")}${C.stars(30, 120)}<circle cx="520" cy="70" r="34" fill="${MOON}"/>${C.light(520, 70, 140, "#E8E2FF", 0.35)}
${bat(430, 60, 1.1, 0)}${bat(470, 90, 0.8, 0.6)}${bat(380, 110, 0.7, 1.2)}
${house(20, 130, 90, [[20, 30], [90, 30]])}${house(470, 150, 96, [[24, 34], [104, 34]])}
<path d="M180,262 L180,140 L320,80 L460,140 L460,262 Z" fill="#241A2E" ${o(3, "#05040A")}/><rect x="300" y="190" width="40" height="72" fill="#3A2420" ${o(2.4)}/><rect x="206" y="160" width="40" height="40" fill="#FFB347" opacity=".9" ${o(2)}/><rect x="394" y="160" width="40" height="40" fill="#FFB347" opacity=".9" ${o(2)}/>${C.light(320, 200, 160, "#FFB347", 0.3)}
${deco(30, 232, 262, 1)}${deco(30, 372, 262, 2)}${deco(30, 420, 262, 0)}
${pumpkin(190, 268, 14)}${pumpkin(262, 268, 11)}${pumpkin(450, 268, 13)}${lanternLight(C, 190, 258)}${lanternLight(C, 450, 258)}
<rect y="262" width="${W}" height="98" fill="${C.lin([[0, "#1E1828"], [1, "#05040A"]])}"/>
${C.fog(282, 0.22, "#B8B0D0")}
<rect width="360" height="${H}" fill="${C.lin([[0, "#000", 0.65], [1, "#000", 0]], 0, 0, 1, 0)}"/>
${C.title(L("SÜSSES ODER SAURES", "TRICK OR TREAT"), L("Was wirklich geschah", "What really happened"), "", 34, 312)}
${C.vignette(0.55)}`;
  }) });
  // 2 Garage: Ersatz-Skelettanzug am Haken, die Täterin / der Täter kommt im eigenen Kostüm herein
  scenes.push({ dur: 6.5, cam: "right", sfx: [[0.6, "step"], [1.0, "step"], [1.4, "step"], [3.2, "rustle"]], sub: L(`${name} legt das ${kostuem}-Kostüm ab und zieht Franks Ersatz-Skelettanzug über.`, `${name} takes off the ${kostuem} costume and pulls on Frank’s spare skeleton suit.`), svg: scene((C) => {
    return `<rect width="${W}" height="${H}" fill="${C.lin([[0, "#2A2630"], [1, "#0E0C12"]])}"/>${[...Array(8)].map((_, i) => `<path d="M0,${30 + i * 34} L${W},${30 + i * 34}" stroke="#000" stroke-opacity=".2" stroke-width="2"/>`).join("")}
<rect x="40" y="40" width="250" height="262" fill="${C.lin([[0, "#1A1530"], [1, "#0A0814"]])}" ${o(3)}/>${C.stars(10, 120).replace(/cx="(\d+)"/g, (m, x) => `cx="${40 + (Number(x) % 240)}"`)}<circle cx="230" cy="90" r="16" fill="${MOON}"/>${[0, 1, 2, 3].map((k) => `<path d="M40,${40 + k * 18} L290,${40 + k * 18}" stroke="#5A5560" stroke-width="5"/>`).join("")}
<path d="M300,40 L300,302" stroke="#444" stroke-width="4"/>
<rect x="430" y="70" width="10" height="8" fill="#888"/><path d="M435,78 L435,92" ${o(2)}/>
<g class="rb-fadeout" style="--d:3.2s"><g transform="translate(435,262) scale(.92)">${suitOnly(66)}</g></g>
<rect x="470" y="200" width="120" height="102" fill="#4A3A2A" ${o(2.4)}/><path d="M470,236 L590,236 M470,270 L590,270" ${o(2)}/>${pumpkin(500, 200, 14, false)}${T(560, 228, "SPARE", 10, 800, "#C9C2B4")}
${C.light(360, 40, 260, "#FFE2A0", 0.25, "rb-flicker")}<path d="M350,30 L370,30 L366,44 L354,44 Z" fill="#2A2A30"/>
${C.floor(302, "#2E2A26", "#0E0C0A")}
${C.shadow(330, 306, 60, 8)}
<g class="rb-walkin" style="--from:-320px;--wd:2.4s;--d:.2s"><g class="rb-fadeout" style="--d:3.4s">${person(costume, inch, shoe, 330, 302)}</g></g>
<g class="rb-fadein" style="--d:3.6s">${person("anzug", inch, shoe, 330, 302)}</g>
${C.tint("#6A4AA0", 0.12)}${C.vignette(0.6)}`;
  }) });
  // 3 Veranda: Frank macht Pause im offenen Sarg, das „siebte Skelett“ steht zwischen den Deko-Skeletten
  scenes.push({ dur: 7, cam: "left", sfx: [[0.8, "creak"], [3.0, "sting"]], sub: L(`${tPause}: Frank macht Pause im offenen Sarg. Kein Kind in Sicht.`, `${tPause}: Frank takes a break in the open coffin. Not a kid in sight.`), svg: scene((C) => {
    return `<rect width="${W}" height="${H}" fill="${VIOLET}"/><rect x="0" y="40" width="${W}" height="262" fill="${C.lin([[0, "#5A4638"], [1, "#2E2420"]])}"/>${[...Array(9)].map((_, i) => `<path d="M0,${60 + i * 28} L${W},${60 + i * 28}" stroke="#241A16" stroke-width="2"/>`).join("")}
<path d="M0,40 L${W},40 L${W},26 L0,26 Z" fill="#2A2026"/>${[...Array(13)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 4) * 0.3}s" cx="${20 + i * 50}" cy="${34 + (i % 2) * 5}" r="5" fill="${i % 3 === 0 ? ORANGE : i % 3 === 1 ? "#9B6BD6" : "#7FD36B"}"/>`).join("")}
${C.light(200, 60, 260, "#F2A65A", 0.35)}
${deco(70, 70, 302, 0)}${deco(70, 520, 302, 2)}
<g class="rb-breathe">${person("anzug", inch, shoe, 450, 302)}</g>
${coffin(210, 302, true)}<g class="rb-nod">${frank(215, 270, 0.9)}</g>
${pumpkin(330, 306, 16)}${lanternLight(C, 330, 294)}
${C.floor(302, "#3A2E2A", "#120E0C")}${C.fog(312, 0.2, "#CFC8DA")}
${C.time(tPause)}
${C.tint("#3B2A55", 0.15)}${C.vignette(0.6)}`;
  }) });
  // 4 Der Deckel: zu, Riegel vor, Nebel auf Dauerbetrieb
  scenes.push({ dur: 7, cam: "in", sfx: [[0.6, "boom"], [1.0, "knock"], [1.3, "click"], [2.0, "wind"], [3.0, "knock"], [3.4, "knock"]], sub: L(`${time}: Deckel zu, Riegel vor – und der Nebel läuft durchgehend.`, `${time}: lid shut, bolt across – and the fog runs nonstop.`), svg: scene((C) => {
    return `<rect width="${W}" height="${H}" fill="${C.lin([[0, "#1A1220"], [1, "#06040A"]])}"/>${C.light(320, 220, 260, "#C8342A", 0.25, "rb-flicker")}
${coffin(300, 290, false, true)}
<g class="rb-fadein" style="--d:1.4s">${C.fog(250, 0.45, "#E6E0F0")}${C.fog(276, 0.4, "#D8D2E6")}</g>
<g transform="translate(520,120)"><rect x="-30" y="-60" width="60" height="120" fill="#E9E1CF" ${o(2.4)}/><circle cx="0" cy="-10" r="18" fill="${RED}" ${o(2.4)}/><g class="rb-flash" style="--d:1.6s"><circle cx="0" cy="-10" r="30" fill="#FF6A50" opacity=".6"/></g>${T(0, 30, L("NEBEL", "FOG"), 11, 900, INK)}${T(0, 44, L("DAUER", "CONT."), 9, 800, RED)}</g>
<g class="rb-sneak">${person("anzug", inch, shoe, 160, 300).replace('<g transform="translate(160,300)">', '<g transform="translate(160,300) scale(.9)">')}</g>
${C.time(time)}
${C.vignette(0.65)}`;
  }) });
  // 5 Garten: das Skelett bückt sich – der Umschlag verschwindet im Versteck, die Kameras gegenüber sehen es
  const camsTxt = zones.length === 1 ? L(`Nur Kamera ${zones[0]} sieht es.`, `Only Camera ${zones[0]} sees it.`) : L(`Die Kameras ${zones[0]} und ${zones[1]} sehen es.`, `Cameras ${zones[0]} and ${zones[1]} see it.`);
  scenes.push({ dur: 7, cam: "right", sfx: [[0.8, "step"], [1.2, "step"], [2.4, "rustle"], [3.4, "beep"]], sub: L(`${tHide}: Der Umschlag verschwindet ${hideIn}. ${camsTxt}`, `${tHide}: the envelope disappears ${hideIn}. ${camsTxt}`), svg: scene((C) => {
    const camX = { A: 110, B: 320, C: 530 };
    return `${C.sky("#05040C", "#1A1430", "#0E0A1C")}${C.stars(20, 90)}<circle cx="600" cy="128" r="20" fill="${MOON}"/>${C.light(600, 128, 80, "#E8E2FF", 0.3)}
<rect y="200" width="${W}" height="160" fill="${C.lin([[0, "#1E2A1C"], [1, "#0A0E08"]])}"/>
${Object.entries(camX).map(([k, x]) => `<g transform="translate(${x},40)"><rect x="-16" y="-10" width="32" height="20" rx="4" fill="#0B0C10" ${o(1.6, "#555")}/><circle cx="0" cy="0" r="5" fill="${zones.includes(k) ? "#FF5A4A" : "#3A3A40"}"/>${zones.includes(k) ? `<g class="rb-flash" style="--d:${3.2 + Object.keys(camX).indexOf(k) * 0.2}s"><circle cx="0" cy="0" r="14" fill="#FF5A4A" opacity=".5"/></g>${C.cone(x - x, 10, 10, 180, 200, "#FF5A4A", 0.14)}` : ""}${T(0, 26, L("Kamera ", "Camera ") + k, 10, 800, zones.includes(k) ? "#FF8A7A" : "#7A7680")}</g>`).join("")}
<g transform="translate(400,300)">${(HIDE_ART[hide] || HIDE_ART[4])(C)}</g>
${C.shadow(270, 304, 60, 8)}
<g class="rb-walkin" style="--from:-260px;--wd:2s;--d:.2s"><g transform="rotate(14 270 300)">${person("anzug", inch, shoe, 270, 300)}</g></g>
<g class="rb-into" style="--d:2.4s;--x:-30px;--y:12px"><g transform="translate(360,232)">${envelope(1)}</g></g>
${C.fog(318, 0.18, "#B8B0D0")}
${C.time(tHide)}
${C.vignette(0.6)}`;
  }) });
  // 6 Akte geschlossen: Akte mit Lineup-Foto, Feldern und Stempel
  scenes.push({ dur: 9, cam: "out", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: scene((C) => {
    const paper = C.lin([[0, "#F6F0E2"], [1, "#DCCFB4"]], 0, 0, 0.4, 1);
    const [h1, h2] = wrap2(hideName, 30);
    return `${C.wood(0, 0, W, H, "#3A2618", "#1A100A")}${C.light(420, 120, 380, "#FFD99A", 0.3)}
${pumpkin(36, 350, 20)}${lanternLight(C, 36, 336, 50)}
<g class="rb-fadein" style="--d:.2s"><g transform="rotate(-5 160 170)"><rect x="66" y="70" width="190" height="230" fill="#000" opacity=".35" transform="translate(6,8)"/><rect x="66" y="70" width="184" height="226" fill="#F4EFE4" ${o(2)}/><rect x="78" y="82" width="160" height="176" fill="#B9B4AA"/>${[48, 54, 60, 66, 72].map((i) => `<path d="M78,${258 - i * 2.2} L238,${258 - i * 2.2}" stroke="${INK}" stroke-width="${i % 12 ? 0.8 : 1.6}" opacity=".6"/>`).join("")}<g transform="translate(158,258) scale(.88)">${person("anzug", inch, shoe, 0, 0)}</g><text x="158" y="284" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="22" fill="#2B2B6B">${esc(short)}</text></g></g>
<g class="rb-slidein" style="--d:.6s"><rect x="296" y="48" width="320" height="252" fill="#000" opacity=".4"/><rect x="290" y="40" width="320" height="252" fill="${paper}" ${o(3)}/>${T(310, 70, L("ERMITTLUNGSAKTE · HOLLOW LANE", "CASE FILE · HOLLOW LANE"), 12, 800, RED, "start")}
${T(310, 100, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}${T(310, 122, name, 18, 800, INK, "start")}
${T(310, 148, L("Sarg geschlossen", "Coffin shut"), 12, 700, MUTED, "start")}${T(310, 168, time, 17, 800, INK, "start")}
${T(310, 192, L("Preisgeld im", "Prize money in"), 12, 700, MUTED, "start")}${T(310, 210, h1, 13, 800, INK, "start")}${T(310, 226, h2, 13, 800, INK, "start")}
${T(310, 250, L("Franks Wort", "Frank’s word"), 12, 700, MUTED, "start")}${T(310, 272, word, 18, 800, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(450,308) rotate(-6)"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), 24, 900, RED)}</g></g>
${C.vignette(0.55)}`;
  }) });
  scenes.push(endcard({ en, plural: false }));
  return { music: "/assets/audio/rueckblende-special-halloween.m4a", scenes };
}
