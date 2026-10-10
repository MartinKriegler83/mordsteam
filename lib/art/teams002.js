// Bilder für Teams Fall 002 (Vereine) – echte Vereinsmitglieder ohne Gesicht: Namensschild und Schichtbändchen
import { INK, PAPER, RED, TAN, CARD, SKIN, SHADE, MUTED, T, o, defs, pic, esc, face } from "./gn.js";
const un = (s) => String(s).replace(/&(amp|lt|gt|quot|#39);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[x]));
const BAND = { rot: "#D23A2E", gelb: "#F2C94C", blau: "#2E6FD2", gruen: "#3FAE4A" };
// Helfer ohne Gesicht (echte Personen): Hemd, Bändchen am erhobenen Handgelenk, optional Namensschild
// Helfer im Graphic-Novel-Stil: Gesicht wie bei den Solo-Figuren (Mann/Frau laut Anrede), Frisur und Haarfarbe aus dem Namen,
// Hemd, Bändchen am Handgelenk, optional Namensschild. fem: true/false
const HAIR = ["#3A2A22", "#5A3A22", "#8A6A3A", "#2A2420", "#9C978D", "#D9B45A"];
const hashOf = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function helfer(x, y, s, shirt, band, name, pose = "up", fem = false, seed = "") {
  const nm = name ? un(name) : "", h = hashOf(seed || nm || shirt), hc = HAIR[h % HAIR.length];
  const arm = pose === "up" ? `<path d="M22,-104 Q40,-130 44,-160" fill="none" stroke="${shirt}" stroke-width="14" stroke-linecap="round"/>${band ? `<rect x="36" y="-166" width="17" height="8" rx="2" fill="${BAND[band]}" ${o(1.4)} transform="rotate(10 44 -162)"/>` : ""}<circle cx="46" cy="-176" r="8" fill="${SKIN}" ${o(1.8)}/>`
    : `<path d="M24,-104 L34,-56" fill="none" stroke="${shirt}" stroke-width="13" stroke-linecap="round"/>${band ? `<rect x="27" y="-60" width="16" height="8" rx="2" fill="${BAND[band]}" ${o(1.4)} transform="rotate(-12 35 -56)"/>` : ""}<circle cx="36" cy="-46" r="7.5" fill="${SKIN}" ${o(1.8)}/>`;
  const hair = fem
    ? (h % 2 ? `<path d="M-22,-150 Q-27,-190 0,-190 Q27,-190 22,-150 L22,-132 Q16,-132 15,-150 Q12,-170 0,-174 Q-12,-170 -15,-150 Q-16,-132 -22,-132 Z" fill="${hc}" ${o(2)}/>` : `<path d="M-20,-150 Q-25,-190 0,-190 Q25,-190 20,-150 L22,-118 L14,-118 Q15,-150 12,-166 Q0,-174 -12,-166 Q-15,-150 -14,-118 L-22,-118 Z" fill="${hc}" ${o(2)}/>`)
    : (h % 2 ? `<path d="M-21,-158 Q-22,-184 0,-186 Q22,-184 21,-158 Q14,-172 0,-172 Q-14,-172 -21,-158 Z" fill="${hc}" ${o(2)}/>` : `<path d="M-21,-156 Q-25,-176 -14,-184 Q-6,-194 4,-188 Q16,-192 21,-178 Q25,-166 21,-156 Q14,-168 2,-168 Q-10,-170 -21,-156 Z" fill="${hc}" ${o(2)}/>`);
  const fs = Math.min(11, 46 / (Math.max(nm.length, 4) * 0.55)), w = fem ? 26 : 30, b = fem ? 34 : 38;
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-${w},-116 Q0,-124 ${w},-116 L${b},-30 L-${b},-30 Z" fill="${shirt}" ${o(2.4)}/><path d="M-24,-104 L-34,-56" stroke="${shirt}" stroke-width="13" stroke-linecap="round"/>${arm}${face("#F2C14E", fem)}${hair}${nm ? `<rect x="-24" y="-102" width="48" height="16" rx="2" fill="${PAPER}" ${o(1.2)}/>${T(0, -90.5, nm, fs, 800, INK)}` : ""}</g>`;
}
const SHIRTS = ["#3E5C8A", "#7A2A24", "#3F5A35", "#5E5A52", "#8C6E4E", "#2F3A4F"];
function shot(D, x, y, time, cap, n, scene) {
  cap = un(cap); n = un(n);
  return `<g transform="translate(${x},${y})"><rect x="-6" y="-6" width="212" height="190" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/><g clip-path="url(#c${D.id})"><rect width="200" height="140" fill="#1E2840"/>${scene}<rect width="200" height="140" fill="${D.dots}" opacity=".1"/></g><rect width="200" height="140" fill="none" stroke="${INK}" stroke-width="3"/><text x="192" y="131" text-anchor="end" font-family="IBM Plex Mono, Menlo, monospace" font-weight="700" font-size="14" fill="#FF9A3C" stroke="#111216" stroke-width="3" paint-order="stroke">${esc(time)}</text>${T(100, 156, cap, Math.min(11, 190 / (Math.max(cap.length, 8) * 0.55)), 700, INK)}${T(100, 172, n, 10, 600, MUTED)}</g>`;
}
const tent = `<path d="M0,40 L100,6 L200,40 L200,140 L0,140 Z" fill="#E8E2D4"/><path d="M0,40 L100,6 L200,40" fill="none" ${o(3)}/><path d="M50,24 L50,140 M150,24 L150,140" stroke="#C9C2B4" stroke-width="3"/>${[20, 60, 100, 140, 180].map((x) => `<circle cx="${x}" cy="${30 + Math.abs(100 - x) / 8}" r="3" fill="#F2C14E"/>`).join("")}`;
export function festfotos(en, d) {
  const D = defs(), L = (a, b) => (en ? b : a);
  const S = {
    zelt: () => `${tent}<rect x="60" y="56" width="80" height="20" fill="#5E4A34" ${o(2)}/>${[72, 100, 128].map((x) => `<circle cx="${x}" cy="48" r="6" fill="#2A2A30"/><rect x="${x - 6}" y="52" width="12" height="6" fill="#2A2A30"/>`).join("")}${[...Array(11)].map((_, i) => `<ellipse cx="${10 + i * 18}" cy="128" rx="10" ry="16" fill="#3A3540"/><circle cx="${10 + i * 18}" cy="108" r="7" fill="#3A3540"/>`).join("")}`,
    grill: () => `${tent}<rect x="40" y="96" width="120" height="44" fill="#2A2A2E" ${o(2)}/>${[50, 70, 90, 110, 130, 150].map((x) => `<path d="M${x},96 q4,-14 0,-26" stroke="#C9C2B4" stroke-width="2" fill="none" opacity=".6"/>`).join("")}${helfer(62, 158, 0.58, SHIRTS[4], "gelb", d.r3, "up", d.fem.r3)}${helfer(140, 158, 0.58, SHIRTS[5], "gelb", d.r4, "down", d.fem.r4)}`,
    gruppe: () => `${tent}<rect x="0" y="86" width="200" height="54" fill="#8C6E4E" ${o(2)}/>${helfer(28, 152, 0.5, SHIRTS[0], "blau", "", "down", true, "a")}${helfer(72, 152, 0.5, SHIRTS[1], d.farbe, d.r2, "up", d.fem.r2)}${helfer(116, 152, 0.5, SHIRTS[2], "gelb", "", "down", false, "b")}${helfer(160, 152, 0.5, SHIRTS[3], d.farbe, "", "up", !d.fem.r2, "c")}`,
    abbau: () => `<rect width="200" height="140" fill="#141B2E"/><rect x="${d.side ? 10 : 90}" y="40" width="100" height="70" fill="#C9C2B4" ${o(2.5)}/>${T(d.side ? 60 : 140, 80, "❄", 18, 700, "#5E86A6")}<rect x="${d.side ? 10 : 90}" y="110" width="100" height="10" fill="${INK}"/>${[0, 1, 2].map((i) => [0, 1, 2, 3].map((j) => `<rect x="${(d.side ? 120 : 6) + i * 24}" y="${116 - j * 14}" width="22" height="13" fill="${["#C9A44A", "#6E8B3D", "#3E5C8A"][(i + j) % 3]}" ${o(1.2)}/>`).join("")).join("")}${helfer(d.side ? 150 : 50, 156, 0.54, SHIRTS[2], null, d.t, "down", d.fem.t)}<path d="M${d.side ? 162 : 62},114 l26,4 l-4,24 l-26,-4 Z" fill="#3B6E8A" ${o(1.4)}/>`,
    leer: () => `${tent}${[30, 70, 110, 150].map((x) => `<rect x="${x}" y="104" width="34" height="6" fill="#8C6E4E" ${o(1.4)}/><path d="M${x + 4},110 L${x + 4},128 M${x + 30},110 L${x + 30},128" ${o(2)}/>`).join("")}`,
  };
  const items = d.shots; // [[time, kind, caption, n]]
  let out = "";
  items.forEach(([t, kind, cap, n], i) => {
    const row = Math.floor(i / 3), inRow = Math.min(3, items.length - row * 3), col = i % 3;
    out += shot(D, (684 - inRow * 228) / 2 + col * 228 + 14, 14 + row * 204, t, cap, n, S[kind]());
  });
  const H = 14 + Math.ceil(items.length / 3) * 204;
  const svg = `<svg viewBox="0 0 684 ${H}" role="img" aria-label="${esc(L("Fotos vom Fest mit Zeitstempel", "Photos from the party with timestamps"))}" style="width:100%;display:block;background:#2B2A27">${D.svg}<clipPath id="c${D.id}"><rect width="200" height="140"/></clipPath>${out}</svg>`;
  return pic(svg, L("Fotos vom Fest – antippen zum Vergrößern", "Party photos – tap to enlarge"));
}

// Temperaturschreiber: Kurve der Innentemperatur (alle 10 Minuten) wie ein Ausdruck des Schreibers
export function tempkurve(en, pts) {   // pts: [[Minute, °C], …]
  const D = defs(), L = (a, b) => (en ? b : a);
  const x0 = 70, x1 = 620, y0 = 250, y1 = 60, lo = -2, hi = 8;
  const m0 = pts[0][0], m1 = pts[pts.length - 1][0];
  const X = (m) => x0 + ((m - m0) / (m1 - m0)) * (x1 - x0), Y = (t) => y0 - ((t - lo) / (hi - lo)) * (y0 - y1);
  const hm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const num = (t) => (Math.round(t * 10) / 10).toFixed(1).replace(".", en ? "." : ",").replace("-", "−");
  let g = "";
  for (let t = lo; t <= hi; t += 1) g += `<path d="M${x0},${Y(t)} L${x1},${Y(t)}" stroke="#E6A0A0" stroke-width="${t % 2 ? 0.6 : 1.2}"/>${t % 2 ? "" : T(x0 - 8, Y(t) + 4, `${num(t).replace(/[.,]0$/, "")} °C`, 11, 600, MUTED, "end")}`;
  pts.forEach(([m]) => { g += `<path d="M${X(m)},${y1} L${X(m)},${y0}" stroke="#E6A0A0" stroke-width="${m % 30 ? 0.6 : 1.2}"/>${m % 30 ? "" : T(X(m), y0 + 18, hm(m), 11, 700, INK)}`; });
  g += `<path d="M${x0},${Y(0)} L${x1},${Y(0)}" stroke="#2E6FD2" stroke-width="1.6" stroke-dasharray="6 4"/>${T(x1, Y(0) - 5, "0 °C", 10.5, 700, "#2E6FD2", "end")}`;
  const line = pts.map(([m, t]) => `${X(m)},${Y(t)}`).join(" ");
  const svg = `<svg viewBox="0 0 640 290" role="img" aria-label="${esc(L("Kurve der Innentemperatur, Werte alle 10 Minuten: ", "Inside temperature curve, readings every 10 minutes: ") + pts.map(([m, t]) => `${hm(m)} ${num(t)} °C`).join(", "))}" style="width:100%;display:block;background:#FBF8F0">${D.svg}
${T(20, 30, L("Innentemperatur · Schreiber-Ausdruck", "Inside temperature · recorder printout"), 13, 800, INK, "start")}<rect x="${x0}" y="${y1}" width="${x1 - x0}" height="${y0 - y1}" fill="#FFFDF7"/>${g}
<polyline points="${line}" fill="none" stroke="#5B2A86" stroke-width="2.6" stroke-linejoin="round"/>${pts.map(([m, t]) => `<circle cx="${X(m)}" cy="${Y(t)}" r="3" fill="#5B2A86"/>`).join("")}</svg>`;
  return pic(svg, L("Temperaturkurve – antippen zum Vergrößern", "Temperature curve – tap to enlarge"));
}

// Leergut-Stapelplan als Foto von oben/vorne: Kühlanhänger in der Mitte, Paletten P1–P3 links, P4–P6 rechts,
// je fünf Lagen Kisten in der Farbe der Marke, fremde Kisten in der anderen Farbe
export function stapel(en, brands, odd) {   // brands: [0..2] je Palette, odd: [[palette, lage], …]
  const D = defs(), L = (a, b) => (en ? b : a);
  const COL = ["#8C5A2A", "#E9C84A", "#3E7CC0"], NAME = L(["Bier", "Limo", "Mineral"], ["Beer", "Lemonade", "Water"]);
  let g = `<rect width="684" height="330" fill="#3A3F48"/><rect y="250" width="684" height="80" fill="#5E5A52"/><rect y="250" width="684" height="80" fill="${D.dots}" opacity=".3"/>
<rect x="282" y="110" width="120" height="140" fill="#C9C2B4" ${o(3)}/><rect x="282" y="110" width="120" height="16" fill="#8A877F" ${o(2)}/>${T(342, 190, "❄", 28, 700, "#5E86A6")}${T(342, 228, L("Kühlanhänger", "Trailer"), 11, 800, INK)}<circle cx="300" cy="258" r="10" fill="${INK}"/><circle cx="384" cy="258" r="10" fill="${INK}"/>`;
  const px = [24, 108, 192, 412, 496, 580];
  for (let p = 1; p <= 6; p++) {
    const x = px[p - 1], b = brands[p - 1];
    g += `<rect x="${x - 4}" y="236" width="88" height="10" fill="#B08A5A" ${o(1.6)}/>`;
    for (let l = 1; l <= 5; l++) {
      const isOdd = odd.some(([q, ll]) => q === p && ll === l), c = isOdd ? COL[b === 0 ? 1 : 0] : COL[b];
      const y = 236 - l * 30;
      g += `<rect x="${x}" y="${y}" width="80" height="28" rx="3" fill="${c}" ${o(1.8)}/><rect x="${x + 8}" y="${y + 5}" width="64" height="8" rx="3" fill="#000" opacity=".25"/>`;
    }
    if (p === 1 || p === 6) for (let l = 1; l <= 5; l++) g += T(p === 1 ? 11 : 673, 236 - l * 30 + 19, String(l), 13, 800, "#F2D24A");   // Lagen nummeriert (10.10.2026)
    g += T(x + 40, 274, `P${p}`, 15, 800, PAPER) + T(x + 40, 290, NAME[b], 10.5, 600, "#E8E2D4");
  }
  g += T(130, 314, L("← links vom Kühlanhänger", "← left of the trailer"), 11, 700, PAPER) + T(540, 314, L("rechts vom Kühlanhänger →", "right of the trailer →"), 11, 700, PAPER);
  g += `<g transform="translate(14,14)">${[0, 1, 2].map((i) => `<rect x="${i * 96}" y="0" width="14" height="14" rx="2" fill="${COL[i]}" ${o(1.2)}/>${T(i * 96 + 20, 12, NAME[i], 11, 700, PAPER, "start")}`).join("")}</g>${T(670, 26, L("Lage 1 unten · Lage 5 oben", "layer 1 bottom · layer 5 top"), 11, 600, "#C9C2B4", "end")}`;
  const desc = brands.map((b, i) => `P${i + 1} ${NAME[b]}${odd.filter(([q]) => q === i + 1).map(([, l]) => `, ${L("Lage", "layer")} ${l} ${NAME[b === 0 ? 1 : 0]}`).join("")}`).join("; ");
  const svg = `<svg viewBox="0 0 684 330" role="img" aria-label="${esc(L("Leergut neben dem Kühlanhänger: ", "Empties next to the trailer: ") + desc)}" style="width:100%;display:block;background:#3A3F48">${D.svg}${g}</svg>`;
  return pic(svg, L("Leergut-Stapel – antippen zum Vergrößern", "Empties stacks – tap to enlarge"));
}

// Vitrine im Vereinsheim: neun Pokale auf drei Glasböden, je mit Gravurplakette (Name, Jahr) und Inventar-Aufkleber
export function vitrine(en, items) {   // items: [[inv, name, jahr], …] in Regal-Reihenfolge
  const D = defs(), L = (a, b) => (en ? b : a);
  const cup = (k, x, y, c) => [
    `<path d="M${x - 22},${y - 70} Q${x - 22},${y - 30} ${x},${y - 26} Q${x + 22},${y - 30} ${x + 22},${y - 70} Z" fill="${c}" ${o(2)}/><path d="M${x - 22},${y - 62} q-14,4 -10,18 q4,8 12,6 M${x + 22},${y - 62} q14,4 10,18 q-4,8 -12,6" fill="none" stroke="${c}" stroke-width="4"/><rect x="${x - 4}" y="${y - 26}" width="8" height="12" fill="${c}"/><rect x="${x - 16}" y="${y - 14}" width="32" height="14" fill="#3A2A1F" ${o(1.6)}/>`,
    `<path d="M${x - 14},${y - 80} L${x + 14},${y - 80} L${x + 8},${y - 34} L${x - 8},${y - 34} Z" fill="${c}" ${o(2)}/><circle cx="${x}" cy="${y - 88}" r="8" fill="${c}" ${o(1.6)}/><rect x="${x - 3}" y="${y - 34}" width="6" height="18" fill="${c}"/><rect x="${x - 18}" y="${y - 16}" width="36" height="16" fill="#3A2A1F" ${o(1.6)}/>`,
    `<path d="M${x - 18},${y - 64} Q${x},${y - 92} ${x + 18},${y - 64} L${x + 12},${y - 34} L${x - 12},${y - 34} Z" fill="${c}" ${o(2)}/><path d="M${x},${y - 78} l6,-12 l-12,0 Z" fill="${c}" ${o(1.4)}/><rect x="${x - 4}" y="${y - 34}" width="8" height="18" fill="${c}"/><rect x="${x - 20}" y="${y - 16}" width="40" height="16" fill="#3A2A1F" ${o(1.6)}/>`,
  ][k % 3];
  let g = `<rect x="20" y="10" width="644" height="420" rx="6" fill="#6E4F34" ${o(3)}/><rect x="36" y="26" width="612" height="388" fill="#2A3344"/><rect x="36" y="26" width="612" height="388" fill="#BFD3E6" opacity=".12"/>${[0, 1, 2].map((i) => `<path d="M${60 + i * 200},30 L${120 + i * 200},410" stroke="#FFFFFF" stroke-width="6" opacity=".06"/>`).join("")}`;
  const COLS = ["#E9B44C", "#C9C2B4", "#C8854A"];
  items.forEach(([inv, name, jahr], i) => {
    const row = Math.floor(i / 3), col = i % 3, x = 136 + col * 206, y = 140 + row * 130;
    if (col === 0) g += `<rect x="36" y="${y}" width="612" height="8" fill="#DCE6EE" opacity=".55"/>`;
    g += cup(i + row, x, y, COLS[(i * 2 + row) % 3]);
    const nm = String(name).replace(/\s+\d{4}$/, ""), fs = Math.min(9, 78 / (Math.max(nm.length, 6) * 0.56));
    g += `<rect x="${x + 26}" y="${y - 54}" width="84" height="34" rx="2" fill="#D9C39A" ${o(1.4)}/>${T(x + 68, y - 40, nm, fs, 700, INK)}${T(x + 68, y - 26, String(jahr), 11.5, 800, INK)}`;
    g += `<rect x="${x - 54}" y="${y - 22}" width="34" height="14" fill="${PAPER}" ${o(1.2)} transform="rotate(-6 ${x - 37} ${y - 15})"/>${`<text x="${x - 37}" y="${y - 12}" text-anchor="middle" font-family="IBM Plex Mono, Menlo, monospace" font-size="9" font-weight="700" fill="${INK}" transform="rotate(-6 ${x - 37} ${y - 15})">${esc(inv)}</text>`}`;
  });
  g += T(342, 430 - 2, "", 1);
  const svg = `<svg viewBox="0 0 684 440" role="img" aria-label="${esc(L("Vitrine mit neun Pokalen: ", "Display cabinet with nine trophies: ") + items.map(([a, b, c]) => `${a} ${b} (${c})`).join(", "))}" style="width:100%;display:block;background:#2B2A27">${D.svg}${g}</svg>`;
  return pic(svg, L("Vitrine – antippen zum Vergrößern", "Display cabinet – tap to enlarge"));
}

const HAND = `font-family="Caveat, Segoe Print, Bradley Hand, cursive" font-weight="600"`;
const HW = (x, y, t, s = 14, c = "#1F2A6B", a = "middle", rot = 0) => `<text x="${x}" y="${y}" text-anchor="${a}" ${HAND} font-size="${s}" fill="${c}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ""}>${esc(t)}</text>`;
// Strichliste der Obfrau als Foto (seit 9.10.2026): drei Zählungen je Sorte, keine Summen, eine Zahl korrigiert.
// parts[i] = [Sa, So Mittag, So Abend]; fix = [Zeile, Spalte, alter (durchgestrichener) Wert]
export function strichliste(en, sorts, parts, fix) {
  const D = defs(), L = (d, e) => (en ? e : d);
  let g = `<g transform="rotate(-1 320 175)"><rect x="10" y="10" width="620" height="330" fill="#FFFDF3" ${o(2)}/>`;
  for (let y = 58; y < 330; y += 22) g += `<path d="M14,${y} H626" stroke="#BFD3E6" stroke-width="1"/>`;
  g += `<path d="M150,14 V336" stroke="#E6A0A0" stroke-width="1.5"/>`;
  g += HW(30, 46, L("Eingelöste Bons – mitgezählt!", "Tokens redeemed – counted myself!"), 26, INK, "start", -1);
  [L("Sa", "Sat"), L("So Mittag", "Sun lunch"), L("So Abend", "Sun evening")].forEach((c, i) => (g += HW(230 + i * 140, 92, c, 20, "#5E5A52")));
  sorts.forEach((s, r) => {
    const y = 136 + r * 44;
    g += `<g data-row="${r}">` + HW(26, y, un(s), 22, INK, "start");
    parts[r].forEach((n, c) => {
      const x = 230 + c * 140, rot = ((r * 3 + c) % 5) - 2;
      if (fix && fix[0] === r && fix[1] === c) g += `<g data-n="${n}">` + HW(x - 22, y - 4, String(fix[2]), 18, "#1F2A6B", "middle", rot) + `<path d="M${x - 44},${y - 10} L${x},${y - 12}" stroke="#1F2A6B" stroke-width="2"/>` + HW(x + 26, y + 4, String(n), 22, "#1F2A6B", "middle", rot) + `</g>`;
      else g += `<g data-n="${n}">` + HW(x, y, String(n), 22, "#1F2A6B", "middle", rot) + `</g>`;
    });
    g += `</g>`;
  });
  g += HW(470, 322, L("→ morgen mit Kassa vergleichen!", "→ compare with the till tomorrow!"), 18, RED, "middle", -3) + `</g>`;
  return pic(`<svg viewBox="0 0 640 350" role="img" aria-label="${esc(L("Foto: handgeschriebene Strichliste der eingelösten Bons", "Photo: handwritten tally sheet of redeemed tokens"))}" style="width:100%;display:block;background:#E9E2D4">${D.svg}${g}</svg>`, L("Strichliste – antippen zum Vergrößern", "Tally sheet – tap to enlarge"));
}
// Verwirr-Akte (seit 9.10.2026): anonymer Zettel unter dem Scheibenwischer
export function zettel(en) {
  const D = defs(), L = (d, e) => (en ? e : d);
  let g = `<rect width="560" height="300" fill="#3A4150"/><path d="M0,230 Q280,200 560,226 L560,300 L0,300 Z" fill="#23272F"/><path d="M40,250 L520,190" stroke="#111" stroke-width="10" stroke-linecap="round"/>`;
  g += `<g transform="rotate(-6 280 140)"><rect x="150" y="50" width="260" height="170" fill="#F7F3E6" ${o(2)}/>`;
  g += en ? HW(280, 118, "I know what you did", 30, INK) + HW(280, 162, "last year!", 30, INK) : HW(280, 108, "Ich weiß, was du", 30, INK) + HW(280, 148, "letztes Jahr", 30, INK) + HW(280, 186, "getan hast!", 30, INK);
  g += `</g>`;
  return pic(`<svg viewBox="0 0 560 300" role="img" aria-label="${esc(L("Foto: Zettel unter dem Scheibenwischer", "Photo: note under the windscreen wiper"))}" style="width:100%;display:block">${D.svg}${g}</svg>`, L("Zettel – antippen zum Vergrößern", "Note – tap to enlarge"));
}
