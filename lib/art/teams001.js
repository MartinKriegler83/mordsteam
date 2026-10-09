// Bilder für Teams Fall 001 (Firmen) – ohne Texte im Bild, passt für alle Länder und Sprachen
import { INK, PAPER, RED, TAN, CARD, MUTED, T, o, defs, pic, esc } from "./gn.js";
const mark = (x, y, n) => `<g transform="translate(${x},${y})"><path d="M-12,8 L0,-14 L12,8 Z" fill="#F2D24A" ${o(2.2)}/>${T(0, 5, String(n), 11, 800)}</g>`;
export function tatort(en) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const svg = `<svg viewBox="0 0 640 360" role="img" aria-label="${esc(L("Tatortfoto: Schreibtisch mit Beweismarkern 1 bis 4", "Crime scene photo: desk with evidence markers 1 to 4"))}" style="width:100%;display:block;background:#3A3F48">${D.svg}
<rect width="640" height="360" fill="#3A3F48"/><rect x="0" y="0" width="640" height="150" fill="#4A505C"/><rect x="420" y="20" width="180" height="110" fill="#1E2840" ${o(3)}/><path d="M420,75 L600,75 M510,20 L510,130" ${o(2)}/>
<rect x="0" y="230" width="640" height="130" fill="#6E6A62"/><rect x="0" y="230" width="640" height="130" fill="${D.hatch}" opacity=".06"/>
<path d="M60,150 L540,150 L580,210 L20,210 Z" fill="#8C6E4E" ${o(3)}/><rect x="20" y="210" width="560" height="16" fill="#6E4F22" ${o(3)}/><path d="M40,226 L40,300 M560,226 L560,300" ${o(6)}/>
<rect x="110" y="160" width="70" height="38" rx="5" fill="#2A2420" ${o(2)}/><rect x="190" y="166" width="22" height="38" rx="3" fill="${INK}" ${o(1.5)}/><rect x="193" y="170" width="16" height="28" fill="#3B4660"/><path d="M220,190 q8,-8 16,0 q-4,6 -10,4" fill="none" stroke="#C9C2B4" stroke-width="3"/>${mark(160, 150, 1)}
<g transform="rotate(-6 300 180)"><rect x="268" y="160" width="62" height="40" fill="#1A1A1E" ${o(2)}/><rect x="300" y="152" width="26" height="22" fill="#FFE58A" ${o(1.5)}/><path d="M304,160 L322,160 M304,166 L318,166" stroke="#1F2A6B" stroke-width="1.5"/></g>${mark(300, 146, 2)}
<path d="M402,168 L438,168 L434,200 L406,200 Z" fill="${PAPER}" ${o(2.2)}/><path d="M438,176 q12,2 0,16" fill="none" ${o(2.2)}/><ellipse cx="420" cy="170" rx="16" ry="3" fill="#B9A15A"/>${mark(420, 150, 3)}
<path d="M330,302 L416,302 L424,248 L338,248 Z" fill="#5A4030" ${o(3)}/><path d="M337,296 L410,296 L417,254 L344,254 Z" fill="#2A1E16"/><path d="M362,248 Q378,234 394,248" fill="none" ${o(3)}/><path d="M326,302 L420,302 L424,342 L322,342 Z" fill="#6E4F34" ${o(3)}/><path d="M332,306 L414,306 L410,318 L336,318 Z" fill="#1A140E"/><rect x="344" y="298" width="9" height="8" fill="${TAN}" ${o(1.2)}/><rect x="393" y="298" width="9" height="8" fill="${TAN}" ${o(1.2)}/>${mark(456, 326, 4)}
<text x="620" y="346" text-anchor="end" font-family="IBM Plex Mono, Menlo, monospace" font-weight="700" font-size="13" fill="#FF9A3C" stroke="#111216" stroke-width="3" paint-order="stroke">21:20</text></svg>`;
  return pic(svg, L("Tatortfoto – antippen zum Vergrößern", "Crime scene photo – tap to enlarge"));
}
export function kopierraum(en) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const HAND = `font-family="Caveat, Segoe Print, cursive" font-weight="600"`;
  const svg = `<svg viewBox="0 0 640 300" role="img" aria-label="${esc(L("Kopierraum: Aktenvernichter mit Zettel DEFEKT, daneben der Papierkorb; Nahaufnahme der abgerissenen roten Aktendeckel-Ecke", "Copy room: shredder with an out-of-order note, the wastepaper basket next to it; close-up of the torn red folder corner"))}" style="width:100%;display:block;background:#2B2A27">${D.svg}
<g><rect x="10" y="10" width="300" height="280" fill="#4A505C" ${o(3)}/><rect x="10" y="210" width="300" height="80" fill="#6E6A62"/>
<rect x="40" y="80" width="120" height="150" rx="6" fill="#C9C2B4" ${o(3)}/><rect x="40" y="80" width="120" height="30" fill="#8A877F" ${o(2.5)}/><rect x="60" y="88" width="80" height="6" fill="${INK}"/><circle cx="148" cy="100" r="4" fill="${RED}"/>
<g transform="rotate(-4 100 160)"><rect x="54" y="124" width="92" height="74" fill="#FFE58A" ${o(1.5)}/><text x="100" y="148" text-anchor="middle" ${HAND} font-size="18" fill="${RED}">${L("DEFEKT", "BROKEN")}</text><text x="100" y="168" text-anchor="middle" ${HAND} font-size="14" fill="#1F2A6B">${L("Techniker kommt", "technician coming")}</text><text x="100" y="186" text-anchor="middle" ${HAND} font-size="14" fill="#1F2A6B">${L("Montag", "Monday")}</text></g>
<path d="M196,170 L268,170 L260,250 L204,250 Z" fill="#3B4660" ${o(3)}/><path d="M196,170 L268,170" ${o(4)}/>${[208, 222, 236, 250].map((x) => `<path d="M${x},176 L${x - 2},244" stroke="#2A3344" stroke-width="2"/>`).join("")}<path d="M214,170 L222,150 L240,158 L236,170 Z" fill="${RED}" ${o(2)}/>
${T(160, 34, L("Kopierraum · 2. OG", "Copy room · 2nd floor"), 13, 700, PAPER)}</g>
<g transform="translate(330,10)"><rect width="300" height="280" fill="#5E5A52" ${o(3)}/><rect width="300" height="280" fill="${D.dots}" opacity=".25"/>
<path d="M30,50 L230,40 L222,76 L206,84 L216,108 L190,120 L200,150 L166,168 L176,196 L38,206 Z" fill="${RED}" ${o(3)}/>
<rect x="50" y="70" width="140" height="34" fill="none" stroke="${PAPER}" stroke-width="2.5"/>${T(120, 92, L("VERTRAULICH – NUR F", "CONFIDENTIAL – FOR"), 11.5, 800, PAPER)}
<path d="M208,86 L220,94 M192,122 L204,128 M170,170 L180,178" stroke="#8E2219" stroke-width="2"/>
<g transform="translate(250,226) rotate(8)"><rect x="-24" y="-28" width="48" height="52" fill="#F2D24A" ${o(2.6)}/>${T(0, 8, "A", 24, 800)}</g></g></svg>`;
  return pic(svg, L("Kopierraum und Fundstück – antippen zum Vergrößern", "Copy room and found item – tap to enlarge"));
}

// Tiefgarage Parkdeck 2 von oben: Stellplätze P2-10 bis P2-20, belegte Plätze mit Kennzeichen, Ausfahrt mit Kontrolle
export function garage(en, cars) {   // cars: { "P2-14": { plate, kind: "car"|"free"|"zone" } }
  const D = defs(), L = (d, e) => (en ? e : d);
  const bw = 54, x0 = 20, y0 = 60;
  let g = `<rect x="10" y="10" width="620" height="300" fill="#5E5A52" ${o(3)}/><rect x="10" y="10" width="620" height="300" fill="${D.dots}" opacity=".2"/>`;
  g += `<rect x="10" y="190" width="620" height="70" fill="#4A4640"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${40 + i * 76},225 L${80 + i * 76},225" stroke="${PAPER}" stroke-width="3" stroke-dasharray="0"/>`).join("")}<path d="M560,225 L600,225 M590,215 L604,225 L590,235" stroke="${PAPER}" stroke-width="3" fill="none"/>`;
  for (let i = 0; i <= 10; i++) {
    const nr = `P2-${10 + i}`, x = x0 + i * bw, c = cars[nr] || { kind: "free" };
    g += `<rect x="${x}" y="${y0}" width="${bw}" height="120" fill="${c.kind === "zone" ? "#C9A44A" : "#6E6A62"}" stroke="${PAPER}" stroke-width="2"/>${T(x + bw / 2, y0 - 8, nr, 10, 700, PAPER)}`;
    if (c.kind === "zone") g += `<path d="M${x},${y0} L${x + bw},${y0 + 120} M${x + bw},${y0} L${x},${y0 + 120}" stroke="${INK}" stroke-width="2" opacity=".5"/><rect x="${x + 3}" y="${y0 + 52}" width="${bw - 6}" height="16" fill="#C9A44A"/>${T(x + bw / 2, y0 + 64, L("Lieferzone", "Delivery"), 8.5, 800, INK)}`;
    if (c.kind === "car") g += `<rect x="${x + 7}" y="${y0 + 10}" width="${bw - 14}" height="100" rx="12" fill="${c.color || "#3B4660"}" ${o(2.4)}/><rect x="${x + 11}" y="${y0 + 26}" width="${bw - 22}" height="22" rx="4" fill="#1E2840"/><rect x="${x + 11}" y="${y0 + 74}" width="${bw - 22}" height="16" rx="4" fill="#1E2840"/><rect x="${x + 4}" y="${y0 + 98}" width="${bw - 8}" height="15" fill="${PAPER}" ${o(1.4)}/>${T(x + bw / 2, y0 + 109, c.plate, Math.min(9, (bw - 10) / (String(c.plate).length * 0.6)), 800, INK)}`;
  }
  g += `<rect x="560" y="262" width="60" height="40" fill="#E8E2D4" ${o(2.4)}/>${T(590, 286, L("Kontrolle", "Check"), 9.5, 800)}${T(470, 296, L("Ausfahrt →", "Exit →"), 12, 800, PAPER)}${T(20, 34, L("Tiefgarage · Parkdeck 2", "Parking garage · deck 2"), 13, 800, PAPER, "start")}`;
  const svg = `<svg viewBox="0 0 640 320" role="img" aria-label="${esc(L("Plan von Parkdeck 2 mit den belegten Stellplätzen und Kennzeichen", "Plan of parking deck 2 with occupied spaces and number plates"))}" style="width:100%;display:block;background:#2B2A27">${D.svg}${g}</svg>`;
  return pic(svg, L("Tiefgarage – antippen zum Vergrößern", "Parking garage – tap to enlarge"));
}

// Alibi-Nachweise: Lauf-App (R4) und Videokonferenz (R3) als Screenshots – Werte kommen aus den Falldaten
const un = (s) => String(s).replace(/&(amp|lt|gt|quot|#39);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[x]));
const fit = (t, w, max) => Math.min(max, w / (Math.max(String(t).length, 4) * 0.58));
export function laufuhr(en, name, park) {
  const D = defs(), L = (d, e) => (en ? e : d), nm = un(name), pk = un(park);
  const svg = `<svg viewBox="0 0 300 420" role="img" aria-label="${esc(L(`Lauf-App von ${nm}: Runde im ${pk}, 9,2 km, 19:35 bis 20:15`, `Running app of ${nm}: loop in ${pk}, 9.2 km, 19:35 to 20:15`))}" style="width:100%;display:block;background:#2B2A27">${D.svg}
<rect x="20" y="10" width="260" height="400" rx="30" fill="${INK}" ${o(3)}/><rect x="34" y="40" width="232" height="350" rx="8" fill="#15171C"/>
${T(150, 64, nm, fit(nm, 200, 15), 800, PAPER)}${T(150, 82, L("Donnerstag · Laufen", "Thursday · Run"), 11, 500, "#9AA0A8")}
<clipPath id="m${D.id}"><rect x="46" y="94" width="208" height="150" rx="6"/></clipPath><g clip-path="url(#m${D.id})"><rect x="46" y="94" width="208" height="150" fill="#D8D2C2"/><path d="M46,118 L254,104 M46,232 L254,236 M80,94 L66,244 M236,94 L244,244" stroke="#F1EADB" stroke-width="7"/><path d="M74,112 Q150,100 234,108 L238,226 Q150,236 72,230 Z" fill="#9CC48A"/><path d="M74,112 Q150,100 234,108 L238,226 Q150,236 72,230 Z" fill="${D.dots}" opacity=".35"/><ellipse cx="160" cy="168" rx="34" ry="20" fill="#7FA6C4" stroke="#5E86A6" stroke-width="2"/><path d="M90,150 Q120,140 150,112 M126,224 Q150,190 160,188 M184,108 Q200,150 226,146 M104,128 Q110,170 104,222" fill="none" stroke="#EDE4CF" stroke-width="3" stroke-dasharray="4 3"/><circle cx="96" cy="180" r="5" fill="#5E8A4A"/><circle cx="118" cy="200" r="5" fill="#5E8A4A"/><circle cx="200" cy="190" r="5" fill="#5E8A4A"/><circle cx="196" cy="132" r="5" fill="#5E8A4A"/><circle cx="140" cy="136" r="5" fill="#5E8A4A"/><circle cx="112" cy="160" r="5" fill="#5E8A4A"/><circle cx="214" cy="214" r="5" fill="#5E8A4A"/><polyline points="70,206 64,186 72,164 90,150 104,128 126,116 150,112 170,118 184,108 204,112 220,126 226,146 218,164 222,184 210,204 190,214 170,210 150,218 128,224 104,222 86,214 70,206" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linejoin="round" opacity=".7"/><polyline points="70,206 64,186 72,164 90,150 104,128 126,116 150,112 170,118 184,108 204,112 220,126 226,146 218,164 222,184 210,204 190,214 170,210 150,218 128,224 104,222 86,214 70,206" fill="none" stroke="${RED}" stroke-width="4" stroke-linejoin="round"/><circle cx="72" cy="164" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(72, 167.5, "1", 8, 800, INK)}<circle cx="104" cy="128" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(104, 131.5, "2", 8, 800, INK)}<circle cx="170" cy="118" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(170, 121.5, "3", 8, 800, INK)}<circle cx="204" cy="112" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(204, 115.5, "4", 8, 800, INK)}<circle cx="218" cy="164" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(218, 167.5, "5", 8, 800, INK)}<circle cx="210" cy="204" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(210, 207.5, "6", 8, 800, INK)}<circle cx="170" cy="210" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(170, 213.5, "7", 8, 800, INK)}<circle cx="128" cy="224" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(128, 227.5, "8", 8, 800, INK)}<circle cx="86" cy="214" r="6.5" fill="${PAPER}" ${o(1.4)}/>${T(86, 217.5, "9", 8, 800, INK)}<path d="M70,206 L70,188" stroke="${INK}" stroke-width="2"/><path d="M70,188 L82,192 L70,196 Z" fill="#6CCB6A" stroke="${INK}" stroke-width="1"/></g><rect x="46" y="94" width="208" height="150" rx="6" fill="none" stroke="#3A3F48" stroke-width="2"/><rect x="${150 - Math.min(90, pk.length * 3.6)}" y="226" width="${Math.min(180, pk.length * 7.2)}" height="15" rx="3" fill="#15171C" opacity=".75"/>${T(150, 237, pk, fit(pk, 170, 10.5), 700, PAPER)}
${T(150, 280, L("9,2 km", "9.2 km"), 32, 800, PAPER)}
${T(92, 306, "19:35", 15, 700, "#6CCB6A")}${T(150, 306, "→", 15, 700, "#9AA0A8")}${T(208, 306, "20:15", 15, 700, RED)}
${[38, 44, 41, 46, 43, 47, 42, 45, 40].map((h, i) => `<rect x="${62 + i * 20}" y="${352 - h * 0.5}" width="14" height="${h * 0.5}" rx="2" fill="${i % 2 ? "#E07A5F" : RED}"/>`).join("")}${T(150, 366, L("km 1–9 · Ø Herzfrequenz 152", "km 1–9 · avg heart rate 152"), 11, 600, "#9AA0A8")}${T(150, 382, L("GPS durchgehend", "GPS continuous"), 10.5, 600, "#6CCB6A")}</svg>`;
  return `<figure class="gn-pic gn-tiny" tabindex="0" role="button" aria-label="${esc(L("Lauf-App – antippen zum Vergrößern", "Running app – tap to enlarge"))}">${svg}</figure>`;
}
export function videocall(en, raum, r3, kunde) {
  const D = defs(), L = (d, e) => (en ? e : d), a = un(r3), b = un(kunde), r = un(raum);
  const tile = (x, label, initial, col) => `<rect x="${x}" y="70" width="250" height="160" rx="6" fill="${col}"/><circle cx="${x + 125}" cy="138" r="34" fill="#3A3F48" ${o(2)}/>${T(x + 125, 150, initial, 32, 800, PAPER)}<rect x="${x + 8}" y="200" width="${Math.min(234, String(label).length * 8 + 20)}" height="22" rx="3" fill="#111216" opacity=".8"/>${T(x + 16, 216, label, fit(label, 220, 12), 700, PAPER, "start")}`;
  const svg = `<svg viewBox="0 0 560 300" role="img" aria-label="${esc(L(`Videokonferenz ${r}: ${a} und ${b}, 19:30 bis 20:20, Kamera an`, `Video conference ${r}: ${a} and ${b}, 19:30 to 20:20, camera on`))}" style="width:100%;display:block;background:#2B2A27">${D.svg}
<rect x="10" y="10" width="540" height="280" rx="10" fill="#1E2028" ${o(3)}/><rect x="10" y="10" width="540" height="44" rx="10" fill="#2A2D36"/>${T(26, 38, r, fit(r, 300, 13), 700, PAPER, "start")}<circle cx="420" cy="32" r="6" fill="${RED}"/>${T(432, 37, "19:30 – 20:20", 13, 700, PAPER, "start")}
${tile(22, a, a.trim()[0] || "?", "#2F3A4F")}${tile(288, `${L("Kunde", "Client")} ${b}`, b.trim()[0] || "?", "#4A4438")}
<rect x="210" y="246" width="140" height="32" rx="16" fill="#2A2D36"/><circle cx="240" cy="262" r="8" fill="#6CCB6A"/>${T(256, 267, L("Kamera an", "Camera on"), 12, 700, PAPER, "start")}</svg>`;
  return `<figure class="gn-pic gn-small" tabindex="0" role="button" aria-label="${esc(L("Videokonferenz – antippen zum Vergrößern", "Video conference – tap to enlarge"))}">${svg}</figure>`;
}

// Taxi-Quittung als Thermobeleg (Betrag und Ziel aus den Falldaten, keine Namen – die stehen im Text)
export function taxibeleg(en, taxi, firma, betrag) {
  const D = defs(), L = (d, e) => (en ? e : d), tx = un(taxi), fi = un(firma), be = un(betrag);
  const M = (y, a, b, w = 500) => `<text x="40" y="${y}" font-family="IBM Plex Mono, Menlo, monospace" font-size="12.5" font-weight="${w}" fill="#2A2A2E">${esc(a)}</text>${b != null ? `<text x="240" y="${y}" text-anchor="end" font-family="IBM Plex Mono, Menlo, monospace" font-size="12.5" font-weight="${w}" fill="#2A2A2E">${esc(b)}</text>` : ""}`;
  const fiS = Math.min(12.5, 200 / (Math.max(fi.length, 4) * 0.62));   // Firmenname nie abschneiden oder teilen – notfalls kleiner
  const jag = [...Array(14)].map((_, i) => `L${264 - i * 17 - 8.5},398 L${264 - (i + 1) * 17},390`).join(" ");
  const svg = `<svg viewBox="0 0 280 420" role="img" aria-label="${esc(L(`Taxi-Quittung ${tx}: Donnerstag 19:15, ${fi} nach Innenstadt, 2 Personen, ${be}, bar`, `Taxi receipt ${tx}: Thursday 19:15, ${fi} to city centre, 2 passengers, ${be}, cash`))}" style="width:100%;display:block;background:#5E5A52">${D.svg}
<path d="M26,14 L264,14 L264,390 ${jag} L26,390 Z" fill="#FBF8F0" ${o(1.6)} transform="rotate(-1.5 140 200)"/>
<g transform="rotate(-1.5 140 200)">${T(145, 44, tx.toUpperCase(), fit(tx, 210, 15), 800, "#2A2A2E")}${T(145, 62, L("Quittung", "Receipt"), 11, 600, "#5E5A52")}
<path d="M40,74 L240,74" stroke="#2A2A2E" stroke-dasharray="3 3"/>
${M(96, L("Datum", "Date"), L("Donnerstag", "Thursday"))}${M(116, L("Abfahrt", "Pick-up"), "19:15")}${M(140, L("Von", "From"), null)}<text x="40" y="160" font-family="IBM Plex Mono, Menlo, monospace" font-size="${fiS.toFixed(1)}" font-weight="600" fill="#2A2A2E">${esc(fi)}</text>${M(190, L("Nach", "To"), null)}${M(208, L("Innenstadt", "city centre"), null, 600)}${M(228, L("Fahrgäste", "Passengers"), "2")}
<path d="M40,236 L240,236" stroke="#2A2A2E" stroke-dasharray="3 3"/>${M(262, L("BETRAG", "TOTAL"), be, 800)}${M(284, L("Zahlung", "Payment"), L("bar", "cash"))}
<path d="M40,300 L240,300" stroke="#2A2A2E" stroke-dasharray="3 3"/>${T(145, 326, L("Danke für die Fahrt!", "Thank you for riding!"), 11.5, 600, "#5E5A52")}
${[...Array(22)].map((_, i) => `<rect x="${52 + i * 8}" y="342" width="${i % 3 ? 3 : 5}" height="26" fill="#2A2A2E"/>`).join("")}</g></svg>`;
  return `<figure class="gn-pic gn-tiny" tabindex="0" role="button" aria-label="${esc(L("Taxi-Quittung – antippen zum Vergrößern", "Taxi receipt – tap to enlarge"))}">${svg}</figure>`;
}
