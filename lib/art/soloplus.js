// Bilder für Solo Plus „Der letzte Jahrgang“: Steckbriefe mit Merkmal, Fotos ohne Namen
import { INK, PAPER, RED, TAN, CARD, MUTED, T, o, defs, fig, roster, pic, esc } from "./gn.js";
const SKY = "#141B2E", GOLD = "#F2C14E", GREEN = "#6CCB6A";
const burst = (x, y, r, c, n = 14) => [...Array(n)].map((_, i) => { const a = (i / n) * Math.PI * 2; return `<path d="M${x + Math.cos(a) * r * 0.25},${y + Math.sin(a) * r * 0.25} L${x + Math.cos(a) * r},${y + Math.sin(a) * r}" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r}" r="1.8" fill="${c}"/>`; }).join("");
const rain = (x, y, w, c) => [...Array(12)].map((_, i) => { const xx = x - w / 2 + (i * w) / 11; return `<path d="M${xx},${y} Q${xx + 4},${y + 30} ${xx + 2},${y + 60}" stroke="${c}" stroke-width="1.6" fill="none" stroke-dasharray="3 3"/>`; }).join("");
const hill = `<path d="M0,92 Q50,62 110,78 T200,70 L200,104 L0,104 Z" fill="#0E1322"/><path d="M96,70 L100,58 L104,70 Z" fill="#0E1322"/>`;
const river = `<rect x="0" y="100" width="200" height="40" fill="#1E2A44"/><path d="M10,112 L60,112 M90,122 L150,122 M30,132 L80,132" stroke="#3B4C70" stroke-width="2"/>`;
const crowd = (n, y = 128) => [...Array(n)].map((_, i) => `<ellipse cx="${12 + i * (200 / n)}" cy="${y}" rx="11" ry="14" fill="#0A0D16"/><circle cx="${12 + i * (200 / n)}" cy="${y - 18}" r="7" fill="#0A0D16"/>`).join("");
const steg = `<path d="M120,100 L200,92 L200,104 L124,110 Z" fill="#5E4A34" ${o(1.5)}/>`;
const weide = `<path d="M150,10 Q140,60 128,100 M150,10 Q160,60 176,100 M150,10 Q150,60 150,100" stroke="#1F3A2A" stroke-width="5" fill="none"/>`;
// Personen mit Requisiten (Wunderkerze w, Glas g)
const person = (k, x, y, s, prop) => {
  let p = fig(k, x, y, s, GOLD);
  const hx = x + 46 * s, hy = y - 60 * s;
  if (prop === "w") p += `<path d="M${hx},${hy} L${hx + 6 * s},${hy - 40 * s}" stroke="#777" stroke-width="2"/>${burst(hx + 6 * s, hy - 46 * s, 9 * s / 0.5 * 0.5, GOLD, 10)}`;
  if (prop === "g") p += `<path d="M${hx - 6},${hy - 18} Q${hx},${hy - 6} ${hx + 6},${hy - 18} Z M${hx},${hy - 10} L${hx},${hy} M${hx - 4},${hy} L${hx + 4},${hy}" fill="#E8C76A" fill-opacity=".7" stroke="${PAPER}" stroke-width="1.4"/>`;
  return p;
};
function shot(D, x, y, file, time, scene) {
  return `<g transform="translate(${x},${y})"><rect x="-6" y="-6" width="212" height="172" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/><g clip-path="url(#c${D.id})"><rect width="200" height="140" fill="${SKY}"/>${scene}<rect width="200" height="140" fill="${D.dots}" opacity=".12"/></g><rect width="200" height="140" fill="none" stroke="${INK}" stroke-width="3"/><text x="192" y="131" text-anchor="end" font-family="IBM Plex Mono, Menlo, monospace" font-weight="700" font-size="14" fill="#FF9A3C" stroke="#111216" stroke-width="3" paint-order="stroke">${esc(time)}</text>${T(100, 157, file, 11.5, 700, INK)}</g>`;
}
// shots: [[Minute, Motiv-Art, [Verdächtige]]]; kind: raketen, steg, totale, glaeser, bm, weide, finale
export function feuerwerk(en, shots, fmt) {
  const D = defs();
  const SC = {
    raketen: () => `${burst(50, 30, 22, RED)}${burst(140, 24, 16, GOLD)}<path d="M100,96 L96,50 M120,96 L126,46" stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="2 3"/>${hill}${river}${crowd(9)}`,
    steg: (k) => `${burst(160, 26, 18, GOLD)}${hill}${river}${steg}${person("gastF", 168, 166, 0.5)}${k[0] ? person(k[0], 48, 166, 0.56, "w") : ""}${k[1] ? person(k[1], 108, 166, 0.56, "w") : ""}`,
    totale: (k) => `${rain(100, 18, 150, GOLD)}${burst(100, 22, 26, GOLD, 18)}${hill}${river}${crowd(7, 132)}${k[0] ? person(k[0], 146, 160, 0.46) : ""}`,
    glaeser: (k) => `${burst(40, 24, 16, RED)}${hill}${river}${steg}${person("gastM", 56, 166, 0.54, "g")}${k[0] ? person(k[0], 126, 166, 0.56, "g") : ""}`,
    bm: () => `${burst(150, 26, 16, GREEN)}${hill}${river}${person("buergermeister", 70, 166, 0.56)}${person("gastF", 128, 166, 0.54)}`,
    weide: (k) => `${burst(60, 22, 16, GOLD)}${weide}${hill}${river}${k[0] ? person(k[0], 40, 166, 0.54, "g") : ""}${k[1] ? person(k[1], 96, 166, 0.54, "g") : ""}${person("gastM", 158, 166, 0.52, "g")}`,
    finale: () => `${[30, 70, 110, 150].map((x, i) => burst(x, 24 + (i % 2) * 14, 14, GREEN)).join("")}<path d="M60,50 Q100,10 140,50" stroke="${GREEN}" stroke-width="3" fill="none"/>${hill}${river}${crowd(10)}`,
  };
  const n = shots.length, cols = 3, W = 684;
  let out = "";
  shots.forEach(([t, kind, ks], i) => {
    const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols), col = i % cols;
    const x = (W - inRow * 228) / 2 + col * 228 + 14, y = 14 + row * 182;
    out += `<g data-t="${fmt(t)}">${shot(D, x, y, "IMG_" + (4410 + i), fmt(t), SC[kind](ks))}</g>`;
  });
  const H = 14 + Math.ceil(n / cols) * 182;
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${en ? "Photos taken during the fireworks" : "Fotos während des Feuerwerks"}" style="width:100%;display:block;background:#2B2A27">${D.svg}<clipPath id="c${D.id}"><rect width="200" height="140"/></clipPath>${out}</svg>`;
  return pic(svg, en ? "Photos during the fireworks – tap to enlarge" : "Fotos während des Feuerwerks – antippen zum Vergrößern");
}
export function verdaechtige(en, SUS) {
  return pic(roster(Object.entries(SUS).map(([k, x]) => ({ key: k, name: x.name, sub: x.role.replace("Tochter und Kellermeisterin", "Tochter, Kellermeisterin").replace("Daughter and cellar master", "Daughter, cellar master") })), { w: 132, h: 250 }), en ? "The suspects – tap to enlarge" : "Die Verdächtigen – antippen zum Vergrößern");
}

// Fotos nach dem Feuerwerk: je eine Person vor ihrem Ort, Ort als Bildunterschrift, kein Name
const NIGHT2 = "#141B2E", LAMP2 = "#F2C14E";
const glow2 = (x, y, r = 40) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LAMP2}" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r / 3}" fill="${LAMP2}" opacity=".2"/>`;
const PLACE2 = {
  parkplatz: () => `<rect y="96" width="200" height="44" fill="#2A2C33"/><path d="M20,140 L40,100 M80,140 L90,100 M140,140 L140,100" stroke="#E8E2D4" stroke-width="2" opacity=".5"/>${glow2(30, 26)}<path d="M30,26 L30,100" ${o(3)}/><path d="M22,26 L38,26" ${o(4)} stroke="${LAMP2}"/><path d="M118,96 Q122,76 140,74 L176,74 Q190,76 196,96 Z" fill="#3B4660" ${o(2)}/><circle cx="132" cy="98" r="7" fill="${INK}"/><circle cx="182" cy="98" r="7" fill="${INK}"/>`,
  schank: () => `${[20, 60, 100, 140, 180].map((x) => `<circle cx="${x}" cy="${14 + (x % 40) / 8}" r="4" fill="${LAMP2}"/>`).join("")}<path d="M0,12 Q100,26 200,12" stroke="#555" fill="none"/><rect x="0" y="92" width="200" height="48" fill="#6E4F22" ${o(2.5)}/><rect x="0" y="88" width="200" height="8" fill="#8C6E4E" ${o(2)}/>${[30, 46, 62].map((x) => `<path d="M${x},88 L${x},70 L${x + 6},70" ${o(3)} stroke="#C9C2B4"/>`).join("")}${[150, 160, 170, 180].map((x) => `<rect x="${x}" y="58" width="7" height="30" rx="2" fill="#2F5A2A" ${o(1.2)}/>`).join("")}`,
  schuppen: () => `<path d="M0,40 L100,16 L200,40 L200,140 L0,140 Z" fill="#4A3A2A" ${o(2.5)}/>${[...Array(12)].map((_, i) => `<path d="M${i * 17},40 L${i * 17},140" stroke="#3A2C1F" stroke-width="2"/>`).join("")}<rect x="120" y="60" width="72" height="80" fill="#1A140E"/><circle cx="160" cy="112" r="22" fill="#2A2A2A" ${o(3)}/><circle cx="160" cy="112" r="8" fill="#B0661E"/><rect x="128" y="76" width="40" height="22" fill="#B0661E" ${o(2)}/>${glow2(60, 50, 30)}`,
  gaestehaus: () => `<rect x="0" y="20" width="200" height="120" fill="#C9BFA9" ${o(2.5)}/><rect x="14" y="40" width="34" height="30" fill="${LAMP2}" ${o(2)} opacity=".8"/><rect x="150" y="40" width="34" height="30" fill="#2A3344" ${o(2)}/><rect x="84" y="60" width="34" height="80" fill="#6E4F22" ${o(2)}/><rect x="70" y="26" width="64" height="16" fill="${PAPER}" ${o(1.5)}/>${glow2(102, 56, 26)}`,
  hof: () => `<rect width="200" height="140" fill="#3A3530"/><path d="M40,140 L40,50 Q100,0 160,50 L160,140" fill="${NIGHT2}" ${o(3)}/><path d="M0,104 L200,104" stroke="#55504A" stroke-width="2"/>${[...Array(10)].map((_, i) => `<path d="M${i * 22},104 L${i * 22 - 10},140" stroke="#55504A" stroke-width="1.5"/>`).join("")}<ellipse cx="170" cy="106" rx="18" ry="12" fill="#8C6E4E" ${o(2)}/><path d="M152,100 L188,100 M152,112 L188,112" stroke="#5E4E38" stroke-width="2"/>${glow2(30, 30, 26)}`,
  kapelle: () => `<path d="M60,140 L60,60 L100,30 L140,60 L140,140 Z" fill="#E8E2D4" ${o(2.5)}/><path d="M92,30 L92,8 L108,8 L108,30" fill="#E8E2D4" ${o(2)}/><path d="M100,0 L100,8 M96,3 L104,3" ${o(2)}/><path d="M88,140 L88,104 Q100,90 112,104 L112,140" fill="#6E4F22" ${o(2)}/><circle cx="100" cy="72" r="8" fill="${LAMP2}" ${o(1.5)}/>`,
  steg: () => `<rect y="88" width="200" height="52" fill="#1E2A44"/><path d="M10,100 L60,100 M90,116 L150,116" stroke="#3B4C70" stroke-width="2"/><path d="M0,104 L200,96 L200,110 L0,118 Z" fill="#5E4A34" ${o(1.5)}/>${[20, 80, 140, 190].map((x) => `<path d="M${x},${108 - x / 25} L${x},140" stroke="#3A2C1F" stroke-width="4"/>`).join("")}<circle cx="160" cy="24" r="10" fill="${PAPER}" opacity=".8"/>`,
};
export function nachher(en, shots, fmt, LOCNAME) {
  const D = defs(), W = 684;
  let out = "";
  shots.forEach(([t, k, loc], i) => {
    const row = Math.floor(i / 3), inRow = Math.min(3, shots.length - row * 3), col = i % 3;
    const x = (W - inRow * 228) / 2 + col * 228 + 14, y = 14 + row * 196;
    const cap = LOCNAME[loc][0].toUpperCase() + LOCNAME[loc].slice(1);
    out += `<g data-t="${fmt(t)}" transform="translate(${x},${y})"><rect x="-6" y="-6" width="212" height="186" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/><g clip-path="url(#c${D.id})"><rect width="200" height="140" fill="${NIGHT2}"/>${PLACE2[loc]()}${fig(k, 70 + (i % 2) * 50, 168, 0.56, LAMP2)}<rect width="200" height="140" fill="${D.dots}" opacity=".12"/></g><rect width="200" height="140" fill="none" stroke="${INK}" stroke-width="3"/><text x="192" y="131" text-anchor="end" font-family="IBM Plex Mono, Menlo, monospace" font-weight="700" font-size="14" fill="#FF9A3C" stroke="#111216" stroke-width="3" paint-order="stroke">${fmt(t)}</text>${T(100, 156, "IMG_" + (4430 + i), 11, 700)}${T(100, 172, cap, 11, 600, MUTED)}</g>`;
  });
  const H = 14 + Math.ceil(shots.length / 3) * 196;
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${en ? "Photos taken after the fireworks" : "Fotos nach dem Feuerwerk"}" style="width:100%;display:block;background:#2B2A27">${D.svg}<clipPath id="c${D.id}"><rect width="200" height="140"/></clipPath>${out}</svg>`;
  return pic(svg, en ? "Photos after the fireworks – tap to enlarge" : "Fotos nach dem Feuerwerk – antippen zum Vergrößern");
}

// CO₂-Warngerät: LCD mit Messkurve und Grenzlinien 5 % / 8 %
const LCD = "#B9C9A0", LCDINK = "#22301A";
// rows: [["22:20", "0,3 %"], ...]
export function co2(en, rows) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const x0 = 150, x1 = 556, y0 = 250, y1 = 80, vmax = 12;
  const X = (i) => x0 + (i * (x1 - x0)) / (rows.length - 1), Y = (v) => y0 - (v / vmax) * (y0 - y1);
  const vals = rows.map((r) => parseFloat(r[1].replace(",", ".")));
  let g = "";
  for (let v = 0; v <= vmax; v += 2) g += `<path d="M${x0},${Y(v)} L${x1},${Y(v)}" stroke="${LCDINK}" stroke-width="0.6" opacity=".25"/>${T(x0 - 10, Y(v) + 4, `${v}${en ? "%" : " %"}`, 11, 600, LCDINK, "end")}`;
  const lim = (v, t) => `<path d="M${x0},${Y(v)} L${x1},${Y(v)}" stroke="${LCDINK}" stroke-width="1.6" stroke-dasharray="6 4"/>${T(x0 + 6, Y(v) - 5, t, 10.5, 700, LCDINK, "start")}`;
  const pts = vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  const svg = `<svg viewBox="0 0 640 360" role="img" aria-label="${esc(L("Display des CO₂-Warngeräts: Messkurve von ", "CO₂ alarm display: readings from ") + rows.map((r) => r[0] + " " + r[1]).join(", "))}" style="width:100%;display:block;background:#2B2A27">${D.svg}
<rect x="20" y="16" width="600" height="328" rx="26" fill="#C9C2B4" ${o(3)}/><rect x="20" y="16" width="600" height="328" rx="26" fill="${D.dots}" opacity=".3"/>
${T(60, 46, "CO₂ ALARM · GK-200", 13, 800, INK, "start")}<circle cx="586" cy="40" r="8" fill="#5E5A52" ${o(2)}/>${T(572, 44, L("Warnton: defekt", "Alarm: faulty"), 10, 700, RED, "end")}
<rect x="44" y="58" width="552" height="236" rx="8" fill="${LCD}" ${o(3)}/>
${g}${lim(5, L("5 % bewusstlos", "5% unconscious"))}${lim(8, L("8 % tödlich", "8% fatal"))}
<polyline points="${pts}" fill="none" stroke="${LCDINK}" stroke-width="3"/>
${vals.map((v, i) => `<rect x="${X(i) - 5}" y="${Y(v) - 5}" width="10" height="10" fill="${LCDINK}"/>${T(X(i), Y(v) - 12, rows[i][1], 11.5, 800, LCDINK)}${T(X(i), y0 + 22, rows[i][0], 12, 700, LCDINK)}`).join("")}
${T(320, 324, L("Speicher · alle 10 Minuten · am Boden gemessen", "Memory · every 10 minutes · measured at floor level"), 11, 600, INK)}</svg>`;
  return pic(svg, L("CO₂-Messgerät – antippen zum Vergrößern", "CO₂ meter – tap to enlarge"));
}

// Lageplan des Weinguts mit Tonis Suche: Nummern im Plan, grau + durchgestrichen = schon durchsucht
const POS = { hof: [304, 208], hof2: [304, 246], schank: [424, 200], schank2: [474, 212], parkplatz: [600, 300], parkplatz2: [640, 236], schuppen: [96, 96], schuppen2: [146, 128], gaestehaus: [520, 86], gaestehaus2: [576, 86], kapelle: [96, 300], steg: [250, 392], presse: [176, 204] };
export function lageplan(en, SPOTS, searched) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const keys = Object.keys(SPOTS);
  const b = (x, y, w, h, lab, fill = CARD) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" ${o(2.6)}/>${T(x + w / 2, y + 16, lab, 11.5, 800)}`;
  let map = `<rect x="8" y="8" width="668" height="420" fill="#DCE6C8" ${o(2.6)}/><rect x="8" y="8" width="668" height="420" fill="${D.dots}" opacity=".35"/>
<path d="M8,360 Q200,340 340,356 T676,350 L676,428 L8,428 Z" fill="#7FA6C4" ${o(2.6)}/>${T(560, 410, L("Donau", "Danube"), 14, 800, "#1E3A5A")}
<path d="M196,226 Q220,300 250,350" fill="none" stroke="${MUTED}" stroke-width="3" stroke-dasharray="6 5"/>${T(250, 300, L("6 Min. zu Fuß", "6 min walk"), 10, 700, MUTED, "start")}
${b(56, 60, 120, 90, L("Traktorschuppen", "Tractor shed"), "#C9B48E")}${b(146, 166, 104, 70, L("Presshaus", "Press house"), "#D8CDB4")}${T(198, 228, L("↓ Keller", "↓ cellar"), 10, 700, RED)}
<rect x="262" y="160" width="84" height="100" fill="#EDE4CF" ${o(2.6)}/>${T(304, 176, L("Hof", "Courtyard"), 11.5, 800)}<path d="M286,260 L322,260" stroke="#EDE4CF" stroke-width="6"/><path d="M284,256 L284,264 M324,256 L324,264" ${o(3)}/>
${b(392, 150, 112, 80, L("Schank", "Bar"), "#E9C88E")}${b(470, 40, 140, 70, L("Gästehaus", "Guesthouse"), "#E8E2D4")}
<rect x="560" y="200" width="110" height="130" fill="#B8B4AA" ${o(2.6)}/>${T(615, 216, L("Parkplatz", "Car park"), 11.5, 800)}<path d="M640,330 L640,352" ${o(3)}/>${T(634, 346, L("Einfahrt", "entrance"), 9, 600, INK, "end")}
<path d="M70,330 L70,282 L96,262 L122,282 L122,330 Z" fill="#F1EADB" ${o(2.4)}/>${T(96, 346, L("Kapelle", "Chapel"), 11.5, 800)}
<path d="M226,356 L276,356 L276,404 L226,404" fill="#8C6E4E" ${o(2)}/>${T(300, 384, L("Bootssteg", "Landing stage"), 10.5, 700, "#1E3A5A", "start")}
${T(20, 30, L("Weingut Aigner · Lageplan", "Aigner winery · site plan"), 12.5, 800, INK, "start")}`;
  keys.forEach((k, i) => { const [x, y] = POS[k], done = searched.includes(k); map += `<circle cx="${x}" cy="${y}" r="12" fill="${done ? "#8A877F" : RED}" ${o(2.2)}/>${T(x, y + 4.5, String(i + 1), 11.5, 800, PAPER)}${done ? `<path d="M${x + 7},${y - 15} l8,8 m0,-8 l-8,8" stroke="${INK}" stroke-width="3"/>` : ""}`; });
  // Legende
  const half = Math.ceil(keys.length / 2);
  let leg = "";
  keys.forEach((k, i) => { const col = i < half ? 0 : 1, row = i < half ? i : i - half, x = 14 + col * 336, y = 452 + row * 24, done = searched.includes(k);
    leg += `<circle cx="${x + 10}" cy="${y}" r="9" fill="${done ? "#8A877F" : RED}" ${o(1.6)}/>${T(x + 10, y + 4, String(i + 1), 10, 800, PAPER)}${T(x + 26, y + 4, SPOTS[k].name, 11, done ? 500 : 700, done ? MUTED : INK, "start").replace("<text ", done ? '<text text-decoration="line-through" ' : "<text ")}`; });
  const H = 452 + half * 24 + 14;
  leg += T(14, H - 10, L("Grau und durchgestrichen = von Toni schon durchsucht, nichts gefunden", "Grey and struck through = already searched by Toni, nothing found"), 10.5, 600, MUTED, "start");
  const svg = `<svg viewBox="0 0 684 ${H}" role="img" aria-label="${esc(L("Lageplan des Weinguts mit nummerierten Verstecken; grau = schon durchsucht", "Site plan of the winery with numbered hiding places; grey = already searched"))}" style="width:100%;display:block;background:${PAPER}">${D.svg}${map}${leg}</svg>`;
  return pic(svg, L("Lageplan mit Tonis Suche – antippen zum Vergrößern", "Site plan with Toni’s search – tap to enlarge"));
}
