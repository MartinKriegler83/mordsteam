// Rückblende (animiertes Finale) Solo Plus „Der letzte Jahrgang“ – 11.10.2026.
// Sechs Szenen aus den Spieldaten: Täter, Uhrzeit Lüftung aus (Variante), Ort nach dem Feuerwerk, Schlüsselversteck.
import { INK, PAPER, RED, CARD, MUTED, o, T, defs, fig, face, esc } from "./gn.js";

const W = 640, H = 360, NB = "#0F1424", GOLD = "#F2C14E", GREEN = "#5FBF6A";
const svg = (inner) => { const D = defs(); return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${D.svg}${inner(D)}</svg>`; };
const clock = (x, y, time) => `<g transform="translate(${x},${y})"><rect x="-6" y="-24" width="92" height="32" rx="4" fill="${INK}" ${o(2, PAPER)}/>${T(40, -1, time, 20, 800, GOLD)}</g>`;
const burst = (x, y, r, c, cls = "rb-burst", d = 0) => `<g class="${cls}" style="--d:${d}s;transform-origin:${x}px ${y}px">${[...Array(14)].map((_, i) => { const a = (i / 14) * Math.PI * 2; return `<path d="M${x},${y} L${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="3" fill="${c}"/>`; }).join("")}</g>`;
const crowd = (n, y = 300) => [...Array(n)].map((_, i) => `<g transform="translate(${30 + i * (580 / (n - 1))},${y})"><circle cy="-46" r="16" fill="#05060B" stroke="#4A5A82" stroke-width="2"/><path d="M-24,0 Q-22,-34 0,-34 Q22,-34 24,0 Z" fill="#05060B" stroke="#4A5A82" stroke-width="2"/></g>`).join("");
// Ferdinand Aigner (Opfer): Winzer mit grauem Schnurrbart, grüne Weste
const ferdinand = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-44,0 L-38,-100 Q0,-122 38,-100 L44,0 Z" fill="#E6DCC6" ${o(3)}/><path d="M-30,-104 L-12,-104 L-14,0 L-34,0 Z M30,-104 L12,-104 L14,0 L34,0 Z" fill="#3F5A35" ${o(2)}/><g class="rb-nod" style="animation-delay:3.4s">${face(RED)}<path d="M-12,-136 Q0,-130 12,-136" stroke="#8E8A82" stroke-width="5" fill="none"/><path d="M-21,-160 Q-22,-186 0,-186 Q22,-186 21,-160 Q12,-174 0,-172 Q-12,-174 -21,-160 Z" fill="#9C978D" ${o(2)}/></g></g>`;
// Lageplan-Positionen (wie lib/art/soloplus.js, Bild 684 breit → hier verkleinert)
const POS = { hof: [304, 208], hof2: [304, 246], schank: [424, 200], schank2: [474, 212], parkplatz: [600, 300], parkplatz2: [640, 236], schuppen: [96, 96], schuppen2: [146, 128], gaestehaus: [520, 86], gaestehaus2: [576, 86], kapelle: [96, 300], steg: [250, 392], presse: [176, 204] };
function plan(L) {
  const b = (x, y, w, h, lab, fill = CARD) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" ${o(2.6)}/>${T(x + w / 2, y + 16, lab, 11.5, 800)}`;
  return `<rect x="8" y="8" width="668" height="420" fill="#DCE6C8" ${o(2.6)}/><path d="M8,360 Q200,340 340,356 T676,350 L676,428 L8,428 Z" fill="#7FA6C4" ${o(2.6)}/>${T(560, 410, L("Donau", "Danube"), 14, 800, "#1E3A5A")}
${b(56, 60, 120, 90, L("Traktorschuppen", "Tractor shed"), "#C9B48E")}${b(146, 166, 104, 70, L("Presshaus", "Press house"), "#D8CDB4")}
<rect x="262" y="160" width="84" height="100" fill="#EDE4CF" ${o(2.6)}/>${T(304, 176, L("Hof", "Courtyard"), 11.5, 800)}
${b(392, 150, 112, 80, L("Schank", "Bar"), "#E9C88E")}${b(470, 40, 140, 70, L("Gästehaus", "Guesthouse"), "#E8E2D4")}
<rect x="560" y="200" width="110" height="130" fill="#B8B4AA" ${o(2.6)}/>${T(615, 216, L("Parkplatz", "Car park"), 11.5, 800)}
<path d="M70,330 L70,282 L96,262 L122,282 L122,330 Z" fill="#F1EADB" ${o(2.4)}/>${T(96, 346, L("Kapelle", "Chapel"), 11.5, 800)}
<path d="M226,356 L276,356 L276,404 L226,404" fill="#8C6E4E" ${o(2)}/>`;
}

export function rueckblende(c, v, { en = false, names, time, spotKey, spotName, place }) {
  const L = (d, e) => (en ? e : d), name = names[c], [sx, sy] = POS[spotKey];
  const scenes = [];
  // 1 Titel
  scenes.push({ dur: 5, sfx: [[0.6, "boom"], [2.0, "boom"]], sub: L("Weinfest im Weingut Aigner. Feuerwerk über der Donau.", "Wine festival at the Aigner winery. Fireworks over the Danube."), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>
${burst(470, 90, 52, GOLD, "rb-burst", 0.4)}${burst(560, 140, 38, RED, "rb-burst", 1.8)}${burst(380, 130, 30, GREEN, "rb-burst", 3)}
<path d="M0,250 Q120,200 240,232 T480,214 T640,226 L640,280 L0,280 Z" fill="#1B2440"/>${[...Array(8)].map((_, i) => `<path d="M${40 + i * 70},250 l0,-24 M${30 + i * 70},236 l20,0" stroke="#2D3A5C" stroke-width="3"/>`).join("")}
<rect y="276" width="${W}" height="84" fill="#122036"/>${[0, 1, 2, 3].map((i) => `<rect class="rb-streak" style="--d:${i * 0.3}s" x="${300 + i * 70}" y="${292 + (i % 2) * 16}" width="46" height="4" fill="${GOLD}" opacity=".45"/>`).join("")}
<g class="rb-fadein" style="--d:1s"><rect x="22" y="22" width="300" height="80" fill="${INK}" opacity=".8"/>${T(36, 46, L("DER LETZTE JAHRGANG", "THE LAST VINTAGE"), 12, 700, RED, "start")}${T(36, 84, L("Was wirklich geschah", "What really happened"), 28, 800, PAPER, "start")}</g>`) });
  // 2 Alle schauen hinauf
  scenes.push({ dur: 6.5, sfx: [[0.3, "boom"], [1.6, "boom"], [3.4, "step"], [3.8, "step"], [4.2, "step"]], sub: L(`Alle schauen zum Feuerwerk. ${name} nicht – auf keinem Foto während des Feuerwerks.`, `Everyone watches the fireworks. Not ${name} – missing from every photo taken during the fireworks.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>
${burst(180, 80, 46, GOLD, "rb-burst", 0.2)}${burst(330, 60, 34, RED, "rb-burst", 1.4)}${burst(470, 96, 40, GREEN, "rb-burst", 2.6)}
<rect y="250" width="${W}" height="110" fill="#1A2238"/>${crowd(12, 300)}
<g class="rb-sneak">${fig(c, 560, 330, 0.9, RED)}</g>`) });
  // 3 Lüftung aus
  scenes.push({ dur: 6.5, sfx: [[1.2, "click"], [2.0, "click"], [2.6, "creak"]], sub: L(`${time} – ${name} sperrt die Kellertür ab und schaltet im Vorraum die Lüftung aus.`, `${time} – ${name} locks the cellar door and switches off the ventilation in the anteroom.`), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#2A2621"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".08"/>
<rect x="60" y="60" width="150" height="230" fill="#5C4027" ${o(3.5)}/><path d="M60,60 Q135,10 210,60" fill="#4C3720" ${o(3)}/><circle cx="190" cy="180" r="7" fill="${GOLD}" ${o(2)}/>${T(135, 110, L("KELLER", "CELLAR"), 14, 800, PAPER)}
<g class="rb-fadein" style="--d:.8s"><g transform="translate(196,176) rotate(-30)"><circle r="7" fill="none" stroke="${GOLD}" stroke-width="3"/><path d="M7,0 L30,0 M22,0 L22,7 M28,0 L28,6" stroke="${GOLD}" stroke-width="3"/></g></g>
<rect x="340" y="80" width="200" height="150" rx="8" fill="#C9C2B4" ${o(3)}/>${T(440, 108, L("LÜFTUNG GÄRKELLER", "FERMENTATION CELLAR FAN"), 11, 800, INK)}
<g transform="translate(400,170)"><circle r="34" fill="#8A877F" ${o(2.5)}/><g class="rb-fan">${[0, 1, 2].map((i) => `<path d="M0,0 Q14,-30 0,-30 Q-10,-20 0,0 Z" fill="#5E5A52" transform="rotate(${i * 120})"/>`).join("")}</g><circle r="5" fill="${INK}"/></g>
<g transform="translate(490,170)"><rect x="-18" y="-30" width="36" height="60" rx="6" fill="${PAPER}" ${o(2.5)}/><rect class="rb-switch" x="-10" y="-24" width="20" height="24" rx="3" fill="${GREEN}" ${o(2)}/>${T(0, 22, L("AUS", "OFF"), 10, 800, RED)}</g>
${clock(22, 330, time)}`) });
  // 4 Gärgas
  scenes.push({ dur: 7, sfx: [[1.0, "sting"], [5.2, "stamp"]], sub: L("Im Keller steigt das Gärgas. Die Kerze erlischt – Ferdinand wartet auf den Fassbinder, der nie kommt.", "Fermentation gas rises in the cellar. The candle goes out – Ferdinand waits for the cooper, who never comes."), svg: svg((D) => `<rect width="${W}" height="${H}" fill="#1E1A16"/><rect width="${W}" height="${H}" fill="url(#d${D.id})" opacity=".06"/>
${[0, 1, 2].map((i) => `<g transform="translate(${420 + i * 0},${110 + i * 70})"><ellipse cx="80" cy="0" rx="90" ry="32" fill="#6E4F22" ${o(3)}/><ellipse cx="0" cy="0" rx="18" ry="32" fill="#8A6A35" ${o(2.5)}/><path d="M40,-30 L40,30 M120,-30 L120,30" stroke="#3B2A14" stroke-width="5"/></g>`).join("")}
${ferdinand(200, 340, 1.15)}
<g transform="translate(330,250)"><rect x="-8" y="0" width="16" height="40" fill="${PAPER}" ${o(2)}/><path class="rb-flame" d="M0,-24 Q10,-8 0,0 Q-10,-8 0,-24 Z" fill="${GOLD}" ${o(1.4)}/></g>
<rect class="rb-gas" x="0" y="0" width="${W}" height="${H}" fill="${GREEN}"/>
<g transform="translate(560,40)"><rect x="-40" y="0" width="80" height="44" rx="4" fill="${INK}" ${o(2, PAPER)}/><text class="rb-co2" x="0" y="31" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="800" font-size="20" fill="${RED}">CO₂ ↑</text></g>`) });
  // 5 Der Schlüssel
  scenes.push({ dur: 7, sfx: [[0.8, "step"], [1.3, "step"], [1.8, "step"], [2.3, "step"], [3.0, "click"]], sub: L(`Auf dem Rückweg verschwindet der Kellerschlüssel: ${spotName}.`, `On the way back the cellar key disappears: ${spotName}.`), svg: svg(() => `<rect width="${W}" height="${H}" fill="#C9D3B4"/><g transform="translate(50,0) scale(0.84)">${plan(L)}
<path class="rb-draw" pathLength="100" d="M198,204 L${sx},204 L${sx},${sy}" fill="none" stroke="${RED}" stroke-width="6" stroke-linecap="round"/>
<g class="rb-fadein" style="--d:2.8s"><circle class="rb-pulse" cx="${sx}" cy="${sy}" r="14" fill="${RED}"/><circle cx="${sx}" cy="${sy}" r="8" fill="${RED}" ${o(2)}/></g></g>
<g class="rb-slideup" style="--d:3.2s"><rect x="40" y="262" width="560" height="84" fill="${INK}"/>${T(60, 290, L(`Schlüssel · ${place}`, `Key · ${place}`), 13, 700, RED, "start")}${T(60, 324, spotName, spotName.length > 40 ? 18 : 22, 800, PAPER, "start")}</g>`) });
  // 6 Akte geschlossen
  scenes.push({ dur: 9, sfx: [[2.2, "stamp"], [2.3, "chord"]], sub: L("Akte geschlossen.", "Case closed."), svg: svg(() => `<rect width="${W}" height="${H}" fill="${NB}"/>
<g class="rb-fadein" style="--d:.2s">${fig(c, 150, 330, 1.05, RED)}</g>
<g class="rb-slidein" style="--d:.6s"><rect x="290" y="40" width="320" height="252" fill="${PAPER}" ${o(3)}/>${T(450, 74, L("ERMITTLUNGSAKTE · SOLO PLUS", "CASE FILE · SOLO PLUS"), 13, 800, MUTED)}<path d="M310,86 L590,86" ${o(1.4)}/>
${T(310, 114, L("Täter/in", "Culprit"), 12, 700, MUTED, "start")}${T(310, 136, name, 19, 800, INK, "start")}
${T(310, 164, L("Lüftung aus", "Fan off"), 12, 700, MUTED, "start")}${T(310, 186, time, 19, 800, INK, "start")}
${T(310, 214, L("Kellerschlüssel", "Cellar key"), 12, 700, MUTED, "start")}${T(310, 234, spotName.length > 36 ? spotName.slice(0, 35) + "…" : spotName, 13, 700, INK, "start")}</g>
<g class="rb-stamp" style="--d:2.2s"><g transform="translate(456,284) rotate(-6)"><rect x="-138" y="-28" width="276" height="56" fill="none" stroke="${RED}" stroke-width="5"/><rect x="-130" y="-20" width="260" height="40" fill="none" stroke="${RED}" stroke-width="2"/>${T(0, 9, L("AKTE GESCHLOSSEN", "CASE CLOSED"), en ? 28 : 24, 900, RED)}</g></g>`) });
  return { music: "/assets/audio/rueckblende-solo.m4a", scenes };
}
