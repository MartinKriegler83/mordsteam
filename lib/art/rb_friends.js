// Rückblende (animiertes Finale) Friends „Letzte Runde auf der Hütte“ – 11.10.2026.
// Spieler sind echte Personen: ohne Gesicht (Silhouetten, Namen auf Tassen bzw. Schildern), wie in den Akten.
// Daten: Täter-Name, Aktivität (Würfeln in der Küche / Balkon), Uhrzeiten der Runde, Versteck, alle Spielernamen.
import { INK, PAPER, RED, CARD, MUTED, o, T, defs, face, esc } from "./gn.js";

const W = 640, H = 360, NB = "#0E1424", GOLD = "#F2C14E", SNOW = "#E9EEF2";
const svg = (inner) => { const D = defs(); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${D.svg}${inner(D)}</svg>`; };
const clock = (x, y, time) => `<g transform="translate(${x},${y})"><rect x="-6" y="-24" width="92" height="32" rx="4" fill="${INK}" ${o(2, PAPER)}/>${T(40, -1, time, 20, 800, GOLD)}</g>`;
const snow = (n, cls = "rb-snow") => [...Array(n)].map((_, i) => `<circle class="${cls}" style="--d:${(i % 9) * 0.35}s" cx="${(i * 71) % W}" cy="${(i * 37) % 200}" r="${i % 3 ? 1.6 : 2.4}" fill="${SNOW}"/>`).join("");
// Silhouette ohne Gesicht, mit Namensschild
const sil = (x, y, s, label, hi = false) => `<g transform="translate(${x},${y}) scale(${s})"><circle cy="-112" r="26" fill="${hi ? "#2A1A1A" : "#1A2030"}" ${o(2.4, hi ? RED : "#4A5A82")}/><path d="M-44,0 Q-42,-80 0,-80 Q42,-80 44,0 Z" fill="${hi ? "#2A1A1A" : "#1A2030"}" ${o(2.4, hi ? RED : "#4A5A82")}/>${label ? `<rect x="-38" y="-46" width="76" height="22" rx="3" fill="${PAPER}" ${o(1.6)}/>${T(0, -30, label.length > 10 ? label.slice(0, 9) + "…" : label, 13, 800)}` : ""}</g>`;
// Ferdl, der Hüttenwirt (Opfer): Bart, Trachtenhemd
const ferdl = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-44,0 L-38,-100 Q0,-122 38,-100 L44,0 Z" fill="#E6DCC6" ${o(3)}/><path d="M-38,-100 L-30,0 M38,-100 L30,0" stroke="#7A2A24" stroke-width="7"/>${face(RED)}<path d="M-18,-142 Q-20,-112 0,-108 Q20,-112 18,-142 Q8,-130 0,-132 Q-8,-130 -18,-142 Z" fill="#8E6A48" ${o(2)}/><path d="M-21,-160 Q-22,-188 0,-188 Q22,-188 21,-160 Q12,-176 0,-174 Q-12,-176 -21,-160 Z" fill="#8E6A48" ${o(2)}/></g>`;

export function rueckblende({ en = false, name, act, players, t1, t2, spot, sauna = "Ferdl" }) {
  const L = (d, e) => (en ? e : d), karten = act === "karten";
  // players: [{ name, act }] – nur die eigene Gruppe (Würfeln bzw. Balkon) erscheint in Szene 2 (Spieltest 11.10.2026)
  const P0 = players.map((p) => (typeof p === "string" ? { name: p, act: null } : p));
  const group = P0.filter((p) => p.name !== name && (p.act == null || p.act === act)).map((p) => p.name).slice(0, 4);
  const seats = [...group]; seats.splice(Math.ceil(group.length / 2), 0, name);   // Täter in der Mitte, max. 5 Plätze
  const sx = (i) => 320 + (i - (seats.length - 1) / 2) * 104;
  const scenes = [];
  // 1 Titel
  scenes.push({ dur: 5, sfx: [[0.3, "wind"]], sub: L("Eine Hütte im Schnee. Eine lange Nacht.", "A chalet in the snow. A long night."), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${snow(60)}
<path d="M0,250 L120,130 L200,200 L320,90 L420,190 L520,120 L640,230 L640,280 L0,280 Z" fill="#1F2A44"/><path d="M320,90 L350,120 L336,118 L320,132 L306,118 L292,122 Z" fill="${SNOW}"/>
<rect y="270" width="${W}" height="90" fill="#DCE3EA"/>
<g transform="translate(260,180)"><rect width="150" height="100" fill="#6B4E2E" ${o(3)}/><path d="M-20,0 L75,-60 L170,0 Z" fill="#4C3720" ${o(3)}/><path d="M-20,0 L75,-60 L170,0" fill="none" stroke="${SNOW}" stroke-width="6"/>
<rect x="18" y="26" width="34" height="28" fill="${GOLD}" ${o(2)}/><rect x="98" y="26" width="34" height="28" fill="${GOLD}" ${o(2)}/><rect class="rb-glow" x="60" y="72" width="30" height="20" fill="${RED}" ${o(2)}/></g>
<g class="rb-fadein" style="--d:1s"><rect x="22" y="22" width="300" height="80" fill="${INK}" opacity=".8"/>${T(36, 46, L("MORDSTEAM FRIENDS", "MORDSTEAM FRIENDS"), 12, 700, RED, "start")}${T(36, 84, L("Was wirklich geschah", "What really happened"), 28, 800, PAPER, "start")}</g>`) });
  // 2 Die Runde – jemand fehlt
  scenes.push({ dur: 6.5, sfx: [[0.4, karten ? "dice" : "wind"], [2.8, "step"], [3.2, "step"]], sub: karten ? L(`Würfeln in der Küche. ${name} steht vom Tisch auf.`, `Dice in the kitchen. ${name} gets up from the table.`) : L(`Auf dem Balkon schauen alle in den Schnee. ${name} geht hinein.`, `Out on the balcony, everyone is watching the snow. ${name} goes inside.`), svg: svg(() => karten
    ? `<rect width="${W}" height="${H}" fill="#3A2A22"/><rect x="40" y="30" width="160" height="100" fill="#101830" ${o(3)}/><path d="M120,30 L120,130 M40,80 L200,80" ${o(3)}/><rect x="80" y="240" width="480" height="24" fill="#7A5634" ${o(3)}/><rect x="80" y="264" width="480" height="96" fill="#5C4027" ${o(2)}/>
${seats.map((p, i) => (p === name ? `<g class="rb-sneak">${sil(sx(i), 250, 0.85, p, true)}</g>` : sil(sx(i), 250, 0.85, p))).join("")}
${[0, 1].map((i) => `<rect x="${296 + i * 26}" y="250" width="18" height="18" rx="3" fill="${PAPER}" ${o(1.6)}/><circle cx="${305 + i * 26}" cy="259" r="2.4" fill="${INK}"/>`).join("")}`
    : `<rect width="${W}" height="${H}" fill="${NB}"/>${snow(50)}<rect y="230" width="${W}" height="130" fill="#5C4027"/><path d="M0,230 L640,230" ${o(3)}/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${20 + i * 80}" y="190" width="12" height="40" fill="#4C3720" ${o(1.6)}/>`).join("")}<path d="M0,190 L640,190" stroke="#4C3720" stroke-width="8"/>
<g transform="translate(590,250)"><rect x="-40" y="-30" width="80" height="34" fill="#7A5634" ${o(2.5)}/><path d="M-40,-30 Q0,-44 40,-30" fill="${SNOW}"/>${T(0, -8, L("Trog", "trough"), 10, 700, PAPER)}</g>
${seats.map((p, i) => (p === name ? `<g class="rb-sneak">${sil(sx(i) - 40, 300, 0.9, p, true)}</g>` : `<g transform="translate(${sx(i) - 40},300) scale(0.9)"><circle cy="-112" r="26" fill="#1A2030" ${o(2.4, "#4A5A82")}/><path d="M-44,0 Q-42,-80 0,-80 Q42,-80 44,0 Z" fill="#1A2030" ${o(2.4, "#4A5A82")}/>${T(0, -36, p.length > 10 ? p.slice(0, 9) + "…" : p, 13, 800, PAPER)}</g>`)).join("")}`) });
  // 3 Der Riegel
  scenes.push({ dur: 6.5, sfx: [[1.2, "click"], [1.5, "creak"], [2.8, "beep"], [3.2, "beep"], [3.6, "beep"]], sub: L(`${t1} – im Keller: Der Riegel der Saunatür wird vorgeschoben, die Sauna auf 110 Grad gedreht.`, `${t1} – in the cellar: the bolt on the sauna door slides shut, the sauna is turned up to 110 degrees.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2B231C"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".07"/>
<rect x="70" y="50" width="200" height="250" fill="#B88A5A" ${o(3.5)}/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M70,${80 + i * 36} L270,${80 + i * 36}" stroke="#8E6A3E" stroke-width="3"/>`).join("")}<rect x="130" y="80" width="80" height="60" fill="#3A2A22" ${o(2.5)}/><rect class="rb-glow" x="134" y="84" width="72" height="52" fill="${RED}" opacity=".6"/>${T(170, 180, "SAUNA", 16, 800, "#3A2A22")}
<rect x="270" y="170" width="40" height="14" rx="3" fill="#8A877F" ${o(2)}/><g class="rb-bolt"><rect x="300" y="166" width="54" height="22" rx="4" fill="#7A5634" ${o(2.5)}/>${T(327, 181, L("Riegel", "bolt"), 9, 700, PAPER)}</g>
<g transform="translate(470,170)"><rect x="-80" y="-80" width="160" height="150" rx="10" fill="${INK}" ${o(2.5, PAPER)}/>${T(0, -50, L("SOLLWERT", "SETPOINT"), 12, 700, "#8A94AE")}<text class="rb-heat" x="0" y="20" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="800" font-size="44" fill="${GOLD}">110°</text><text class="rb-heat0" x="0" y="20" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="800" font-size="44" fill="${GOLD}">95°</text></g>
${clock(22, 330, t1)}`) });
  // 4 Die Speicherkarte
  scenes.push({ dur: 6.5, sfx: [[1.6, "click"], [2.4, "sting"]], sub: L(`${t2} – in der Stube: Die Speicherkarte verschwindet aus ${sauna}s Kamera.`, `${t2} – in the living room: the memory card disappears from ${sauna}’s camera.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#3A2A22"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".07"/>
<path d="M260,300 L300,170 M380,300 L340,170 M320,300 L320,170" ${o(5)}/><rect x="250" y="110" width="140" height="80" rx="10" fill="#2A2E3A" ${o(3)}/><circle cx="320" cy="150" r="28" fill="#101830" ${o(3)}/><circle cx="320" cy="150" r="12" fill="#4A5A82"/><circle class="rb-glow" cx="372" cy="122" r="5" fill="${RED}"/>
<g class="rb-card"><rect x="394" y="146" width="34" height="26" rx="3" fill="#2E5FA8" ${o(2)}/><path d="M394,152 L402,146" stroke="${PAPER}" stroke-width="2"/></g>
<g class="rb-fadein" style="--d:2.4s">${T(470, 120, L("Die Speicherkarte", "The memory card"), 14, 800, GOLD, "start")}${T(470, 140, L("– weg.", "– gone."), 14, 800, GOLD, "start")}</g>
${clock(22, 330, t2)}`) });
  // 5 Der Weg – Grundriss wie im Hüttenplan (Balkon | Stube | Flur | Küche, darunter Sauna | Kellertreppe | Skiraum | Kühlschrank)
  const lc = (x) => (en ? x.charAt(0).toLowerCase() + x.slice(1) : x);
  const up = [[400, 116], [345, 142], [270, 200], [216, 210], [270, 200], [345, 142]];
  const P = karten
    ? [[530, 96], [461, 112], ...up, [392, 112], [324, 112], [240, 100], [324, 112], [392, 128]]
    : [[95, 92], [150, 112], [240, 116], [324, 112], ...up, [380, 112], [324, 112], [240, 100], [150, 112], [95, 124]];
  const [hx, hy] = P[P.length - 1];
  const rm = (x, y, w, h, t, f = CARD) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${o(2.5)}/>${t ? T(x + w / 2, y + 20, t, 12, 800) : ""}`;
  scenes.push({ dur: 7.5, sfx: [[0.8, "step"], [1.3, "step"], [1.8, "step"], [2.3, "step"], [3.0, "click"]], sub: L(`Der Weg: in den Keller, in die Stube – und zurück. Die Speicherkarte landet hier: ${spot}.`, `The route: down to the cellar, into the living room – and back. The memory card ends up here: ${lc(spot)}.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${PAPER}"/>
${rm(40, 40, 110, 110, L("Balkon", "Balcony"), "#E8EEF2")}${rm(150, 40, 174, 110, L("Stube", "Living room"))}${rm(324, 40, 137, 110, L("Flur", "Hallway"), "#E9E3D6")}${rm(461, 40, 139, 110, L("Küche", "Kitchen"))}
${rm(40, 168, 174, 82, L("Sauna", "Sauna"))}${rm(214, 168, 110, 82, L("Kellertreppe", "Cellar stairs"), "#E9E3D6")}${rm(324, 168, 137, 82, L("Skiraum", "Ski room"))}${rm(461, 168, 139, 82, L("Kühlschrank", "Fridge"))}
${[[150, 98], [324, 98], [461, 98]].map(([x, y]) => `<rect x="${x - 3}" y="${y}" width="6" height="30" fill="${CARD}"/>`).join("")}${[[214, 196], [324, 196], [461, 196]].map(([x, y]) => `<rect x="${x - 3}" y="${y}" width="6" height="26" fill="${CARD}"/>`).join("")}
${T(18, 100, L("EG", "GF"), 10, 800, RED, "start")}${T(14, 214, L("KELLER", "CELLAR"), 9, 800, RED, "start")}
<rect x="76" y="114" width="40" height="18" fill="#7A5634" ${o(1.8)}/>${T(96, 144, L("Trog", "trough"), 9, 700, MUTED)}<rect x="226" y="88" width="24" height="16" fill="#2A2E3A" ${o(1.6)}/>${T(238, 118, L("Kamera", "camera"), 9, 700, MUTED)}<rect x="378" y="118" width="30" height="22" fill="#8A6A35" ${o(1.8)}/>${T(393, 148, L("Schuhschrank", "shoe cupboard"), 9, 700, MUTED)}
<path class="rb-draw" style="animation-duration:3.2s" pathLength="100" d="M${P.map((p) => p.join(",")).join(" L")}" fill="none" stroke="${RED}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
<g class="rb-fadein" style="--d:3.6s"><circle class="rb-pulse" cx="${hx}" cy="${hy}" r="13" fill="${RED}"/><circle cx="${hx}" cy="${hy}" r="7" fill="${RED}" ${o(2)}/></g>
<g class="rb-slideup" style="--d:4s"><rect x="40" y="262" width="560" height="84" fill="${INK}"/>${T(60, 290, L("Speicherkarte", "Memory card"), 13, 700, RED, "start")}${T(60, 324, spot, 22, 800, PAPER, "start")}</g>`) });
  // 6 Akte geschlossen
  scenes.push({ dur: 9, sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>${snow(30)}
<g class="rb-fadein" style="--d:.2s">${sil(150, 320, 1.15, name, true)}</g>
<g class="rb-slidein" style="--d:.6s"><rect x="290" y="40" width="320" height="252" fill="${PAPER}" ${o(3)}/>${T(450, 74, L("ERMITTLUNGSAKTE · FRIENDS", "CASE FILE · FRIENDS"), 13, 800, MUTED)}<path d="M310,86 L590,86" ${o(1.4)}/>
${T(310, 114, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}${T(310, 136, name, 19, 800, INK, "start")}
${T(310, 164, L("Sauna verriegelt", "Sauna bolted"), 12, 700, MUTED, "start")}${T(310, 186, t1, 19, 800, INK, "start")}
${T(310, 214, L("Speicherkarte", "Memory card"), 12, 700, MUTED, "start")}${T(310, 234, spot, 14, 700, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,284) rotate(-6)"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>`) });
  return { music: "/assets/audio/rueckblende-friends.m4a", scenes };
}
