// Rückblende (animiertes Finale) Friends „Letzte Runde auf der Hütte“ – 11.10.2026.
// Spieler sind echte Personen: ohne Gesicht (Silhouetten, Namen auf Tassen bzw. Schildern), wie in den Akten.
// Daten: Täter-Name, Aktivität (Würfeln in der Küche / Balkon), Uhrzeiten der Runde, Versteck, alle Spielernamen.
// Kino-Look (11.10.2026): Winternacht – warmes Hüttenlicht innen, kaltes Blau draußen, Schnee. Mitspieler über C.person
// (gesichtslos, Frisur/Kleidung deterministisch aus dem Namen), Täter/in nur mit rotem Schild-Rand, nicht als Monster.
// Ferdl (erfunden, Opfer) behält sein Gesicht und ist in Szene 3 durch das Saunafenster zu sehen.
// Szene 5 = Hüttenplan aus der Akte (hutPlan in lib/cases/friends-001.js): EG Balkon | Stube | Flur | Küche, Keller Sauna | Kellertreppe | Skiraum | Kühlschrank.
import { INK, PAPER, RED, face, T, o, esc } from "./gn.js";
import { BLANK } from "./friends.js";
import { cine, SERIF, MONO, endcard } from "./cine.js";

const W = 640, H = 360, GOLD = "#F2C14E", SNOW = "#E9EEF2";
const svg = (inner) => { const C = cine(W, H); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${C.wrap(inner)}</svg>`; };
// Namen kommen in Friends HTML-escaped an – für T() zurückwandeln (T escaped selbst, sonst „&amp;amp;“)
const unesc = (s) => String(s).replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" }[x]));
// Aussehen der Mitspieler: stabil aus dem Namen abgeleitet (gleicher Name → gleiche Figur in allen Szenen)
const COATS = ["#8E3B2E", "#3E5C8A", "#6B7A3A", "#8C6E4E", "#5A4A5E", "#2F6B6B", "#A0782A", "#4A4A52"];
const HAIRS = ["#2A2018", "#5A3A22", "#8A6A3A", "#C9A45A", "#17171B", "#7A3A22"];
const SKINS = ["#D9B99A", "#C9A07E", "#E3C4A8", "#A87B5A"];
const STYLES = ["short", "long", "bun", "curly", "cap", "long", "short"];
// Kleidung = Deckenfarbe des Spielers im Zeitraffer der Akte (BLANK in lib/art/friends.js, Index = Platz in der Spielerliste) – Nachtest 12.10.2026
let IDX = new Map();
const look = (name) => { let h = 7; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return { coat: IDX.has(name) ? BLANK[IDX.get(name) % BLANK.length] : COATS[h % 8], hair: HAIRS[(h >>> 3) % 6], skin: SKINS[(h >>> 6) % 4], style: STYLES[(h >>> 9) % 7] }; };
const player = (C, x, y, s, name, hi = false, rim = "#FFD9A0") => C.person(x, y, s, { ...look(name), name: unesc(name), hi, rim });
// Ferdl, der Hüttenwirt (Opfer): Bart, Trachtenhemd
const ferdl = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-44,0 L-38,-100 Q0,-122 38,-100 L44,0 Z" fill="#E6DCC6" ${o(3)}/><path d="M-38,-100 L-30,0 M38,-100 L30,0" stroke="#7A2A24" stroke-width="7"/>${face(RED)}<path d="M-18,-142 Q-20,-112 0,-108 Q20,-112 18,-142 Q8,-130 0,-132 Q-8,-130 -18,-142 Z" fill="#8E6A48" ${o(2)}/><path d="M-21,-160 Q-22,-188 0,-188 Q22,-188 21,-160 Q12,-176 0,-174 Q-12,-176 -21,-160 Z" fill="#8E6A48" ${o(2)}/></g>`;
// Berge mit Schneekappen
const ridge = (pts, fill, cap) => `<path d="M${pts.map((p) => p.join(",")).join(" L")} L640,360 L0,360 Z" fill="${fill}"/>` + (cap ? pts.slice(1, -1).map(([x, y]) => `<path d="M${x},${y} l-14,16 l6,-2 l8,6 l8,-6 l6,2 Z" fill="${cap}" opacity=".85"/>`).join("") : "");
const pine = (x, y, s, col = "#0C1626") => `<path transform="translate(${x},${y}) scale(${s})" d="M0,-60 L14,-30 L8,-30 L20,-6 L4,-6 L4,4 L-4,4 L-4,-6 L-20,-6 L-8,-30 L-14,-30 Z" fill="${col}"/>`;

export function rueckblende({ en = false, name, act, players, t1, t2, spot, sauna = "Ferdl" }) {
  const L = (d, e) => (en ? e : d), karten = act === "karten";
  // players: [{ name, act }] – nur die eigene Gruppe (Würfeln bzw. Balkon) erscheint in Szene 2 (Spieltest 11.10.2026)
  const P0 = players.map((p) => (typeof p === "string" ? { name: p, act: null } : p));
  IDX = new Map(P0.map((p, i) => [p.name, i]));
  const group = P0.filter((p) => p.name !== name && (p.act == null || p.act === act)).map((p) => p.name).slice(0, 4);
  const seats = [...group]; seats.splice(Math.ceil(group.length / 2), 0, name);   // Täter in der Mitte, max. 5 Plätze
  const sx = (i) => 320 + (i - (seats.length - 1) / 2) * 104;
  const scenes = [];

  // 1 Titel – Hütte in der Winternacht
  scenes.push({ dur: 5, cam: "in", sfx: [[0.3, "wind"]], sub: L("Eine Hütte im Schnee. Eine lange Nacht.", "A chalet in the snow. A long night."), svg: svg((C) => {
    const win = (x, y, w, h, d) => `<g class="rb-flicker" style="--d:${d}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.lin([[0, "#FFE3A0"], [1, "#F2A23C"]])}"/></g><path d="M${x + w / 2},${y} v${h} M${x},${y + h / 2} h${w}" stroke="#3A2616" stroke-width="3"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#2A1A0E" stroke-width="4"/>`;
    return `${C.sky("#050913", "#2A3B60", "#111C36")}${C.stars(30, 150)}<circle cx="540" cy="62" r="20" fill="#F3EED8"/>${C.light(540, 62, 120, "#C9D8FF", 0.35)}
${ridge([[0, 230], [90, 150], [170, 205], [260, 120], [360, 200], [450, 140], [560, 190], [640, 160]], "#22314F", "#C9D3E2")}
${ridge([[0, 270], [120, 215], [230, 255], [330, 225], [470, 262], [560, 232], [640, 250]], "#16203A")}
<rect y="268" width="${W}" height="92" fill="${C.lin([[0, "#AFC0D6"], [1, "#5E7090"]])}"/><path d="M0,272 Q160,258 320,270 T640,266 L640,280 L0,280 Z" fill="#C9D6E6" opacity=".6"/>
${pine(60, 290, 1.3)}${pine(110, 300, 1.7)}${pine(248, 296, 1.2)}${pine(290, 288, 0.9)}
<g transform="translate(78,0)"><g class="rb-drift" opacity=".35">${[0, 1, 2].map((i) => `<ellipse cx="${492 + i * 12}" cy="${132 - i * 26}" rx="${10 + i * 8}" ry="${7 + i * 4}" fill="#C9D3E0"/>`).join("")}</g>
<rect x="484" y="132" width="16" height="40" fill="#3A2A20"/><rect x="480" y="128" width="24" height="7" fill="${SNOW}"/>
${C.light(440, 238, 170, "#FFB65A", 0.35, "rb-flicker")}
${C.wood(350, 190, 180, 92, "#7A5634", "#3E2A18")}
<path d="M330,196 L440,128 L550,196 L536,198 L440,140 L344,198 Z" fill="${SNOW}"/><path d="M344,198 L440,140 L536,198 L536,192 L440,134 L344,192 Z" fill="#2A1C12"/>
${win(370, 210, 40, 32, 0)}${win(470, 210, 40, 32, 0.7)}<rect x="424" y="236" width="32" height="46" fill="#2A1A0E"/><rect x="428" y="240" width="24" height="42" fill="${C.lin([[0, "#F2A23C"], [1, "#8A4A1A"]])}" class="rb-flicker" style="--d:.4s"/>
<path d="M300,248 h50 M300,248 v34 M314,248 v34 M328,248 v34 M342,248 v34" stroke="#3A2616" stroke-width="4"/><path d="M296,246 h56" stroke="${SNOW}" stroke-width="4"/>
<path d="M350,282 L530,282 L560,300 L320,300 Z" fill="#FFC870" opacity=".18"/></g>
<rect x="0" y="0" width="460" height="190" fill="${C.lin([[0, "#03050B", 0.7], [1, "#03050B", 0]], 0, 0, 1, 0)}"/>
${C.snow(46)}
${C.title(L("MORDSTEAM FRIENDS", "MORDSTEAM FRIENDS"), L("Was wirklich geschah", "What really happened"), L("Letzte Runde auf der Hütte", "Last Round at the Chalet"), 40, 112)}
${C.tint("#2A4A8A", 0.14, "soft-light")}`;
  }) });

  // 2 Die Runde – jemand fehlt (nur die Gruppe des Täters)
  scenes.push({ dur: 6.5, cam: "left", sfx: [[0.4, karten ? "dice" : "wind"], [2.8, "step"], [3.2, "step"]], sub: karten ? L(`Würfeln in der Küche. ${name} steht vom Tisch auf.`, `Dice in the kitchen. ${name} gets up from the table.`) : L(`Auf dem Balkon schauen alle in den Schnee. ${name} geht hinein.`, `Out on the balcony, everyone is watching the snow. ${name} goes inside.`), svg: svg((C) => {
    const FY = 322, S = 0.82;
    const who = (exitTo, rim) => seats.map((p, i) => p === name
      ? `<g class="rb-walkout" style="--to:${exitTo(sx(i))}px;--wd:2.6s;--d:2.6s">${C.person(sx(i), FY, S, { ...look(p), rim })}<g class="rb-fadeout" style="--d:2.2s"><g transform="translate(${sx(i)},${FY - 58 * S}) scale(${S})"><rect x="-40" y="-13" width="80" height="24" rx="3" fill="${PAPER}" stroke="${RED}" stroke-width="2.5"/>${T(0, 4, unesc(p).length > 10 ? unesc(p).slice(0, 9) + "…" : unesc(p), 13, 800)}</g></g></g>`
      : `<g class="rb-breathe" style="animation-delay:-${(i * 0.7).toFixed(1)}s">${player(C, sx(i), FY, S, p, false, rim)}</g>`);
    if (karten) {
      const ppl = who((x) => 640 - x, "#FFD9A0");
      // Täter zuerst zeichnen → geht HINTER den anderen zur Tür, sein Schild blendet beim Aufstehen aus (keine überlappenden Namensschilder, 11.10.2026)
      const ci = seats.indexOf(name), order = [ppl[ci], ...ppl.filter((_, i) => i !== ci)];
      return `${C.wood(0, 0, W, 300, "#6E4A2A", "#2E1E12")}
${C.win(44, 58, 118, 100, { snow: 10, moon: true })}
<rect x="470" y="96" width="132" height="8" fill="#3A2616"/>${[[482, "#C9B48A", 26], [512, "#E9E3D6", 30], [548, "#8A5A3A", 22], [574, "#B8C4C8", 24]].map(([x, c, h]) => `<rect x="${x}" y="${96 - h}" width="20" height="${h}" rx="3" fill="${c}" opacity=".85"/>`).join("")}<rect x="512" y="60" width="20" height="6" rx="2" fill="#B33A2A"/>
<rect x="566" y="120" width="70" height="180" fill="#120B06"/><rect x="566" y="120" width="70" height="180" fill="none" stroke="#3A2616" stroke-width="6"/>
${C.light(320, 230, 300, "#FFC870", 0.5, "rb-flicker")}
<path d="M320,0 L320,58" stroke="#111" stroke-width="2"/>
<g class="rb-flicker">${C.cone(320, 78, 70, 520, 330, "#FFE2A0", 0.28)}</g>
<path d="M290,78 L350,78 L336,58 L304,58 Z" fill="#2E3A2A"/><path d="M290,78 L350,78" stroke="#FFE2A0" stroke-width="2"/><ellipse cx="320" cy="80" rx="12" ry="4" fill="#FFF3D0"/>${C.light(320, 80, 40, "#FFF3D0", 0.9)}
${C.dust(220, 100, 200, 160, 12)}
${order.join("")}
<path d="M70,286 L570,286 L612,322 L28,322 Z" fill="${C.lin([[0, "#8A6238"], [1, "#5C3E22"]])}"/><path d="M70,286 L570,286" stroke="#B88A5A" stroke-width="2"/>
<rect x="28" y="322" width="584" height="40" fill="${C.lin([[0, "#3E2A18"], [1, "#1A100A"]])}"/>
${C.light(320, 302, 200, "#FFD27A", 0.35)}
${C.shadow(270, 312, 22, 4, 0.6)}<g class="rb-bob" style="--d:.1s"><path d="M258,290 L282,290 L279,312 L261,312 Z" fill="#6B2E1E"/><path d="M258,290 L282,290" stroke="#A85A3A" stroke-width="2.5"/></g>
${[[312, 300, -8], [338, 306, 12]].map(([x, y, r]) => `<g transform="translate(${x},${y}) rotate(${r})"><rect x="-8" y="-8" width="16" height="16" rx="3" fill="${PAPER}"/><rect x="0" y="-8" width="8" height="16" rx="2" fill="#000" opacity=".12"/><circle r="2.2" fill="${INK}"/><circle cx="-4" cy="-4" r="1.6" fill="${INK}"/><circle cx="4" cy="4" r="1.6" fill="${INK}"/></g>`).join("")}
<g transform="translate(410,296) rotate(-4)"><rect x="-26" y="-12" width="52" height="24" fill="#FFFDF3"/>${[-6, 0, 6].map((y) => `<path d="M-20,${y} h40" stroke="#BFD3E6" stroke-width="1"/>`).join("")}</g>
${[150, 200, 470, 520].map((x, i) => `<g transform="translate(${x},${300 + (i % 2) * 6})"><rect x="-8" y="-12" width="16" height="16" rx="2" fill="${["#E9E3D6", "#B33A2A", "#3E5C8A", "#E9E3D6"][i]}"/><path d="M8,-8 q6,4 0,8" fill="none" stroke="#E9E3D6" stroke-width="2"/></g>`).join("")}
${C.tint("#FF9A3C", 0.12, "soft-light")}`;
    }
    // Balkon: Nacht, Schneefall, Hauswand mit Tür links, Geländer vorn, Blumentrog rechts
    const ppl = who((x) => 50 - x, "#9FB6E0"), ci = seats.indexOf(name), order = [ppl[ci], ...ppl.filter((_, i) => i !== ci)];
    const blanket = (x, k) => `<path d="M${x - 40},292 Q${x},280 ${x + 40},292 L${x + 44},318 L${x - 44},318 Z" fill="${COATS[(k + 3) % 8]}"/><path d="M${x - 40},298 L${x + 42},298 M${x - 42},308 L${x + 43},308" stroke="#F1EADB" stroke-width="2" opacity=".4"/>`;
    return `${C.sky("#03060E", "#22345A", "#0C1630")}${C.stars(18, 120)}
${ridge([[240, 230], [330, 150], [420, 210], [520, 130], [640, 200]], "#1A2744", "#B8C6DA")}
${C.wood(0, 0, 250, 300, "#5C3E24", "#2A1A0E", true)}
<path d="M0,0 L250,0 L250,22 L0,22 Z" fill="#20140B"/><path d="M0,22 L250,22 L250,30 L0,30 Z" fill="${SNOW}" opacity=".9"/>
<rect x="20" y="96" width="62" height="206" fill="${C.lin([[0, "#F7B85A"], [1, "#8A4A1A"]])}" class="rb-flicker"/><rect x="20" y="96" width="62" height="206" fill="none" stroke="#20140B" stroke-width="7"/>
${C.win(110, 80, 110, 96, { sky: ["#FFD27A", "#E08A3A"], frame: "#20140B", glow: "#FFC870" })}
${C.light(70, 220, 210, "#FFB65A", 0.4, "rb-flicker")}${C.light(560, 80, 160, "#9FB6E0", 0.25)}
<rect x="0" y="300" width="${W}" height="60" fill="${C.lin([[0, "#3A2A1E"], [1, "#1A120C"]])}"/><rect x="60" y="300" width="560" height="8" fill="#2A1C12"/>
<rect x="${sx(0) - 56}" y="292" width="${sx(seats.length - 1) - sx(0) + 112}" height="10" fill="#4A3220"/>
${order.join("")}
${seats.map((p, i) => blanket(sx(i), i)).join("")}
<rect x="0" y="316" width="${W}" height="10" fill="#4A3220"/><path d="M0,315 L640,315" stroke="${SNOW}" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${12 + i * 78}" y="326" width="10" height="34" fill="#2E1E12"/>`).join("")}
<g transform="translate(596,300)">${C.shadow(0, 14, 44, 5)}<path d="M-40,-30 L40,-30 L34,12 L-34,12 Z" fill="${C.lin([[0, "#8A6238"], [1, "#4A3220"]])}"/><path d="M-42,-30 Q-20,-44 0,-38 Q24,-46 42,-30 Z" fill="${SNOW}"/>${[-20, 0, 20].map((x) => `<path d="M${x},-36 l-4,-12 M${x},-36 l5,-10" stroke="#3A4A3A" stroke-width="2"/>`).join("")}${T(0, -4, L("Trog", "trough"), 11, 700, "#F1EADB")}</g>
${C.snow(40)}
${C.tint("#3A5A9A", 0.18, "soft-light")}`;
  }) });

  // 3 Der Riegel – Keller, Saunatür, Sollwert 95° → 110°
  scenes.push({ dur: 6.5, cam: "in", sfx: [[1.2, "click"], [1.5, "creak"], [2.8, "beep"], [3.2, "beep"], [3.6, "beep"]], sub: L(`${t1} – im Keller: Der Riegel der Saunatür wird vorgeschoben, die Sauna auf 110 Grad gedreht.`, `${t1} – in the cellar: the bolt on the sauna door slides shut, the sauna is turned up to 110 degrees.`), svg: svg((C) => {
    const winClip = C.clip("M132,82 h76 v56 h-76 Z");
    return `${C.sky("#1C1712", "#2E241B")}
${[...Array(9)].map((_, r) => `<path d="M0,${r * 34} H640" stroke="#000" stroke-opacity=".22" stroke-width="2"/>${[...Array(8)].map((_, c) => `<path d="M${(c * 86 + (r % 2) * 43) % 640},${r * 34} v34" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`).join("")}`).join("")}
<rect y="22" width="${W}" height="10" fill="#4A4038"/><rect y="40" width="${W}" height="6" fill="#5A4E44"/>
<rect x="0" y="300" width="${W}" height="60" fill="${C.lin([[0, "#2A221A"], [1, "#0E0B08"]])}"/>
${C.light(400, 70, 260, "#FFD9A0", 0.35, "rb-flicker")}<path d="M400,32 L400,58" stroke="#111" stroke-width="2"/><circle cx="400" cy="64" r="7" fill="#FFF3D0" class="rb-flicker"/>
${C.light(170, 300, 160, "#FF5A2A", 0.45, "rb-glow")}
<rect x="62" y="42" width="216" height="262" fill="#2A1E14"/>
<rect x="70" y="50" width="200" height="250" fill="${C.lin([[0, "#D8A86E"], [0.6, "#B88A5A"], [1, "#7A5634"]], 0, 0, 1, 0)}"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${98 + i * 28},50 V300" stroke="#7A5634" stroke-opacity=".5" stroke-width="2"/>`).join("")}
<rect x="128" y="78" width="84" height="64" fill="#3A2A22"/>
<g clip-path="${winClip}"><rect x="132" y="82" width="76" height="56" fill="${C.lin([[0, "#FF9A5A"], [1, "#B8321E"]])}"/>${ferdl(170, 240, 0.74)}<rect x="132" y="82" width="76" height="56" fill="#FFB27A" class="rb-glow" opacity=".45"/></g>
<rect x="128" y="78" width="84" height="64" fill="none" stroke="#5C4027" stroke-width="4"/>
${T(170, 182, "SAUNA", 16, 800, "#3A2A22")}<rect x="232" y="196" width="10" height="44" rx="4" fill="#5C4027"/>
<rect x="70" y="298" width="200" height="4" fill="#FF7A3A" class="rb-glow"/>
${C.fog(290, 0.3, "#FFD2B0")}
<rect x="270" y="170" width="40" height="14" rx="3" fill="#8A877F" ${o(2)}/><g class="rb-bolt"><rect x="300" y="166" width="54" height="22" rx="4" fill="${C.lin([[0, "#C9C4BA"], [1, "#6E6A62"]])}" ${o(2)}/><rect x="340" y="160" width="10" height="34" rx="3" fill="#5E5A52" ${o(1.6)}/>${T(322, 181, L("Riegel", "bolt"), 9, 800, INK)}</g>
<g transform="translate(476,170)">${C.shadow(6, 92, 80, 8, 0.5)}<rect x="-84" y="-84" width="168" height="160" rx="12" fill="${C.lin([[0, "#3A3D44"], [1, "#16171B"]])}" stroke="#5E5A52" stroke-width="2"/><rect x="-66" y="-42" width="132" height="84" rx="6" fill="#0A0B0E"/>
${T(0, -56, L("SOLLWERT", "SETPOINT"), 12, 700, "#8A94AE")}${C.light(0, 4, 80, "#FFB04A", 0.35, "rb-glow")}
<text class="rb-heat" x="0" y="20" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="44" fill="#FF6A3A">110°</text><text class="rb-heat0" x="0" y="20" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="44" fill="${GOLD}">95°</text>
<circle cx="-50" cy="58" r="5" fill="${RED}" class="rb-glow"/><circle cx="0" cy="58" r="9" fill="#2A2C32" stroke="#5E5A52" stroke-width="2"/><circle cx="40" cy="58" r="5" fill="#3A6A3A"/></g>
<rect x="466" y="250" width="20" height="50" fill="#4A4038"/>
${C.tint("#FF6A2A", 0.12, "soft-light")}
${C.time(t1)}`;
  }) });

  // 4 Die Speicherkarte – Stube, Ferdls Kamera auf Stativ
  scenes.push({ dur: 6.5, cam: "right", sfx: [[1.6, "click"], [2.4, "sting"]], sub: L(`${t2} – in der Stube: Die Speicherkarte verschwindet aus ${sauna}s Kamera.`, `${t2} – in the living room: the memory card disappears from ${sauna}’s camera.`), svg: svg((C) => `${C.wood(0, 0, W, 300, "#5A3C22", "#24170C")}
${C.win(48, 64, 120, 110, { snow: 10, moon: true })}
<path d="M0,300 L640,300 L640,360 L0,360 Z" fill="${C.lin([[0, "#3A2A1E"], [1, "#120C08"]])}"/>
<path d="M60,180 L180,180 L460,360 L120,360 Z" fill="${C.lin([[0, "#9FB6E0", 0.22], [1, "#9FB6E0", 0]])}" style="mix-blend-mode:screen"/>${C.dust(80, 190, 220, 120, 10, "#DDE6FF")}
<g transform="translate(470,160)"><rect x="0" y="0" width="140" height="140" fill="${C.lin([[0, "#3E6A52"], [1, "#1E3A2A"]], 0, 0, 1, 0)}"/>${[1, 2, 3].map((k) => `<path d="M${k * 35},0 V140 M0,${k * 35} H140" stroke="#122A1C" stroke-width="2"/>`).join("")}<rect x="-6" y="-10" width="152" height="12" fill="#2E5A42"/><rect x="44" y="96" width="52" height="38" fill="#1A0E06"/><rect x="48" y="104" width="44" height="30" fill="${C.lin([[0, "#FFD27A"], [1, "#E0601E"]])}" class="rb-flicker"/></g>
${C.light(540, 270, 200, "#FF9A3C", 0.45, "rb-flicker")}
<ellipse cx="320" cy="326" rx="170" ry="18" fill="#6A2A22" opacity=".55"/>
${C.shadow(320, 304, 80, 8, 0.6)}
<path d="M262,302 L304,182 M378,302 L336,182 M320,304 L320,182" stroke="#15171C" stroke-width="5" stroke-linecap="round"/><rect x="306" y="178" width="28" height="14" fill="#20232A"/>
<rect x="250" y="110" width="140" height="80" rx="10" fill="${C.lin([[0, "#3A3F4C"], [1, "#16181E"]])}" stroke="#0A0B0E" stroke-width="2.5"/><rect x="264" y="100" width="40" height="12" rx="3" fill="#2A2E38"/>
<circle cx="320" cy="150" r="30" fill="#0A0B10" stroke="#4A4F5C" stroke-width="3"/><circle cx="320" cy="150" r="18" fill="${C.rad([[0, "#5A6A9A"], [1, "#101830"]], 0.4, 0.4, 0.6)}"/><ellipse cx="312" cy="142" rx="6" ry="4" fill="#DDE6FF" opacity=".7"/>
<circle class="rb-glow" cx="372" cy="122" r="5" fill="${RED}"/>${C.light(372, 122, 22, "#FF3A2A", 0.6, "rb-glow")}
<rect x="388" y="146" width="6" height="30" fill="#0A0B0E"/>
<g class="rb-card"><rect x="394" y="146" width="34" height="26" rx="3" fill="#2E5FA8" ${o(2)}/><path d="M394,152 L402,146" stroke="${PAPER}" stroke-width="2"/><rect x="400" y="158" width="20" height="6" fill="${GOLD}" opacity=".8"/></g>
<g class="rb-fadein" style="--d:2.4s"><text x="392" y="64" font-family="${SERIF}" font-weight="700" font-style="italic" font-size="22" fill="${GOLD}">${esc(L("Die Speicherkarte", "The memory card"))}</text><text x="392" y="92" font-family="${SERIF}" font-weight="700" font-style="italic" font-size="22" fill="${GOLD}">${esc(L("– weg.", "– gone."))}</text></g>
${C.tint("#FF8A3C", 0.1, "soft-light")}
${C.time(t2)}`) });

  // 5 Der Weg – Grundriss wie im Hüttenplan (Balkon | Stube | Flur | Küche, darunter Sauna | Kellertreppe | Skiraum | Kühlschrank)
  const lc = (x) => (en ? x.charAt(0).toLowerCase() + x.slice(1) : x);
  // Weg (Nachtest 12.10.2026): bis an die Saunatür (① Riegel), dann Stube (② Kamera), dann Versteck (③);
  // im Flur oben entlang (y 100), damit der Weg nie über den Schuhschrank läuft, wenn der nicht das Versteck ist
  const down = [[345, 100], [335, 150], [290, 192], [208, 210]], back = [[290, 192], [335, 150], [345, 100]];
  const P = karten
    ? [[530, 96], [461, 104], [400, 100], ...down, ...back, [324, 104], [238, 108], [324, 104], [393, 106], [393, 124]]
    : [[95, 92], [150, 104], [230, 120], [324, 104], ...down, ...back, [324, 104], [238, 108], [150, 104], [96, 120]];
  const ST = [[200, 210, L("Riegel", "bolt")], [238, 108, L("Kamera", "camera")], [P[P.length - 1][0], P[P.length - 1][1], ""]];
  const [hx, hy] = P[P.length - 1];
  const WALL = "#3F424A";
  const rm = (x, y, w, h, t, f = "#FFFDF8") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" fill-opacity=".72" stroke="${WALL}" stroke-width="2.5"/>${t ? T(x + w / 2, y + 19, t, 12.5, 700, "#15171C") : ""}`;
  const note = (x, y, t) => T(x, y, t, 9.5, 600, "#5E5A52");
  scenes.push({ dur: 7.5, cam: "none", sfx: [[0.8, "step"], [1.3, "step"], [1.8, "step"], [2.3, "step"], [3.0, "click"]], sub: L(`Der Weg: in den Keller, in die Stube – und zurück. Die Speicherkarte landet hier: ${spot}.`, `The route: down to the cellar, into the living room – and back. The memory card ends up here: ${lc(spot)}.`), svg: svg((C) => {
    const d = `M${P.map((p) => p.join(",")).join(" L")}`;
    return `${C.wood(0, 0, W, H, "#3A2616", "#140C06")}
<rect x="28" y="30" width="590" height="236" fill="#000" opacity=".35" transform="translate(5,6)"/>
<rect x="24" y="26" width="592" height="236" fill="${C.lin([[0, "#FBF7EE"], [1, "#E6DCC6"]], 0, 0, 1, 1)}"/>
${[...Array(23)].map((_, i) => `<path d="M${36 + i * 25},26 V262" stroke="#BFD3E6" stroke-opacity=".35" stroke-width="1"/>`).join("")}${[...Array(9)].map((_, i) => `<path d="M24,${38 + i * 25} H616" stroke="#BFD3E6" stroke-opacity=".35" stroke-width="1"/>`).join("")}
${rm(40, 40, 110, 110, L("Balkon", "Balcony"), "#E3ECF4")}${rm(150, 40, 174, 110, L("Stube", "Living room"))}${rm(324, 40, 137, 110, L("Flur", "Hallway"), "#EDE6D8")}${rm(461, 40, 139, 110, L("Küche", "Kitchen"))}
${rm(40, 168, 174, 82, L("Sauna", "Sauna"), "#F4E2CC")}${rm(214, 168, 110, 82, L("Kellertreppe", "Cellar stairs"), "#EDE6D8")}${rm(324, 168, 137, 82, L("Skiraum", "Ski room"))}${rm(461, 168, 139, 82, L("Kühlschrank", "Fridge"))}
${[[150, 98], [324, 98], [461, 98]].map(([x, y]) => `<rect x="${x - 3}" y="${y}" width="6" height="30" fill="#F6F1E6"/>`).join("")}${[[214, 196], [324, 196], [461, 196]].map(([x, y]) => `<rect x="${x - 3}" y="${y}" width="6" height="26" fill="#F3ECDD"/>`).join("")}
${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${232 + i * 13},214 v24" stroke="#8A867C" stroke-width="1.5"/>`).join("")}
<path d="M60,214 h70 M60,226 h70" stroke="#B88A5A" stroke-width="3"/>${note(127, 244, L("Riegel außen", "bolt outside"))}
<rect x="480" y="196" width="26" height="40" rx="3" fill="#DDE3E6" stroke="${WALL}" stroke-width="1.5"/>
${[0, 1].map((i) => `<path d="M${350 + i * 12},200 l6,40" stroke="#8A867C" stroke-width="3" stroke-linecap="round"/>`).join("")}
<text transform="translate(33,95) rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans, Arial, sans-serif" font-size="9" font-weight="800" letter-spacing="2" fill="${RED}">${esc(L("ERDGESCHOSS", "GROUND FL."))}</text>
<text transform="translate(33,209) rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans, Arial, sans-serif" font-size="9" font-weight="800" letter-spacing="2" fill="${RED}">${esc(L("KELLER", "CELLAR"))}</text>
<rect x="76" y="114" width="40" height="18" rx="2" fill="#7A5634" stroke="${INK}" stroke-width="1.5"/>${note(96, 144, L("Trog", "trough"))}
<rect x="226" y="88" width="24" height="16" rx="2" fill="#2A2E3A"/><circle cx="238" cy="96" r="4" fill="#4A5A82"/><path d="M232,104 l-6,10 M244,104 l6,10" stroke="#2A2E3A" stroke-width="1.6"/>${note(238, 126, L("Kamera", "camera"))}
<rect x="378" y="118" width="30" height="22" rx="2" fill="#8A6A35" stroke="${INK}" stroke-width="1.5"/>${note(393, 148, L("Schuhschrank", "shoe cupboard"))}
${C.light(110, 40, 300, "#FFE9B0", 0.35)}
<path d="${d}" fill="none" stroke="${RED}" stroke-opacity=".18" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
<path class="rb-draw" style="animation-duration:3.2s" pathLength="100" d="${d}" fill="none" stroke="${RED}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100"/>
<circle cx="${P[0][0]}" cy="${P[0][1]}" r="5" fill="${PAPER}" stroke="${RED}" stroke-width="2.5"/>
${ST.map(([x, y], i) => `<g class="rb-pop2" style="--d:${[1.9, 2.9, 3.7][i]}s"><circle cx="${x + (i === 2 ? 0 : 0)}" cy="${y - 18}" r="9" fill="${RED}" ${o(1.6, PAPER)}/>${T(x, y - 14, String(i + 1), 11, 800, PAPER)}</g>`).join("")}
<g class="rb-fadein" style="--d:3.6s"><circle class="rb-pulse" cx="${hx}" cy="${hy}" r="14" fill="${RED}"/><circle cx="${hx}" cy="${hy}" r="7" fill="${RED}" ${o(2)}/></g>
<g class="rb-slideup" style="--d:4s"><rect x="40" y="270" width="560" height="62" rx="3" fill="${C.lin([[0, "#1A1C22"], [1, "#0B0C10"]], 0, 0, 1, 0)}"/><rect x="40" y="270" width="5" height="62" fill="${RED}"/>${T(62, 292, L("Speicherkarte", "Memory card"), 12, 700, RED, "start")}<text x="62" y="320" font-family="${SERIF}" font-weight="700" font-size="22" fill="${PAPER}">${esc(spot)}</text></g>`;
  }) });

  // 6 Akte geschlossen
  scenes.push({ dur: 9, cam: "out", sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: svg((C) => `${C.sky("#05080F", "#1A2440")}
${C.win(40, 46, 200, 200, { snow: 14, moon: true, frame: "#1A120C" })}
<rect x="0" y="296" width="${W}" height="64" fill="${C.lin([[0, "#1A140E"], [1, "#07050A"]])}"/>
${C.light(140, 150, 200, "#9FB6E0", 0.28)}
<g class="rb-fadein" style="--d:.2s"><g class="rb-breathe">${player(C, 150, 340, 1.05, name, true, "#9FB6E0")}</g></g>
<g class="rb-slidein" style="--d:.6s">
<rect x="296" y="48" width="320" height="252" fill="#000" opacity=".45"/>
<rect x="290" y="40" width="320" height="252" fill="${C.lin([[0, "#FBF6EA"], [1, "#DCD0B8"]], 0, 0, 1, 1)}"/>
${C.light(560, 60, 220, "#FFE9B0", 0.35)}
<path d="M312,28 L312,74 Q312,82 320,82 Q328,82 328,74 L328,36 Q328,30 322,30 Q316,30 316,36 L316,70" fill="none" stroke="#8A8F98" stroke-width="3" stroke-linecap="round"/>
${T(450, 74, L("ERMITTLUNGSAKTE · FRIENDS", "CASE FILE · FRIENDS"), 13, 800, "#5E5A52")}<path d="M310,86 L590,86" stroke="${INK}" stroke-width="1.4"/>
${T(310, 114, L("Täter/in", "Culprit"), 12, 700, "#5E5A52", "start")}<text x="310" y="138" font-family="${SERIF}" font-weight="800" font-size="21" fill="${INK}">${esc(unesc(name))}</text>
${T(310, 164, L("Sauna verriegelt", "Sauna bolted"), 12, 700, "#5E5A52", "start")}<text x="310" y="188" font-family="${MONO}" font-weight="700" font-size="19" fill="${INK}">${esc(t1)}</text>
${T(310, 214, L("Speicherkarte", "Memory card"), 12, 700, "#5E5A52", "start")}${T(310, 234, spot, 14, 700, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,284) rotate(-6)" opacity=".92"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>`) });
  scenes.push(endcard({ en, plural: true }));   // Abspann wie bei den Teasern
  return { music: "/assets/audio/rueckblende-friends-huette.m4a", scenes };
}
