// Bilder für Friends „Letzte Runde auf der Hütte“ – echte Spieler ohne Gesicht, erkennbar am Namen auf der Tasse
import { INK, PAPER, RED, TAN, CARD, MUTED, T, o, defs, pic, esc } from "./gn.js";
const BLANK = ["#8E3B2E", "#3E5C8A", "#6B7A3A", "#8C6E4E", "#5A4A5E", "#2F6B6B", "#A0782A", "#4A4A52"];
// Namen kommen schon HTML-escaped (Friends) – für T() erst zurückwandeln, T() escaped selbst
const unesc = (s) => String(s).replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" }[x]));
// people: [{name, i}] in Sitzreihenfolge; present(f) → Set der i, die auf Bild f zu sehen sind
export function zeitraffer(en, people, frames, present) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const fw = 322, fh = 150, n = people.length, seat = Math.min(62, (fw - 40) / Math.max(n, 1));
  let out = "";
  frames.forEach((t, f) => {
    const col = f % 2, row = Math.floor(f / 2), x = 14 + col * (fw + 12), y = 14 + row * (fh + 34);
    const moonX = 40 + f * 26, on = present(f);
    let sc = `<rect width="${fw}" height="${fh}" fill="#121A2E"/>${[...Array(26)].map((_, k) => `<circle cx="${(k * 53 + f * 3) % fw}" cy="${(k * 29) % 70 + 6}" r="${k % 5 ? 0.9 : 1.4}" fill="${PAPER}" opacity=".8"/>`).join("")}<circle cx="${moonX}" cy="26" r="11" fill="#EDE6D2"/>
<path d="M0,92 L40,62 L70,80 L120,40 L170,78 L210,56 L260,84 L322,60 L322,110 L0,110 Z" fill="#1E2840"/><path d="M120,40 L108,52 L132,52 Z M210,56 L200,66 L220,66 Z" fill="#E8EEF2" opacity=".8"/>
<rect x="0" y="108" width="${fw}" height="42" fill="#3A2C1F"/><rect x="10" y="118" width="${fw - 20}" height="8" fill="#6E4F22" ${o(1.5)}/>`;
    people.forEach((p, k) => {
      const cx = 20 + seat / 2 + k * seat + (fw - 40 - n * seat) / 2, bc = BLANK[p.i % BLANK.length];
      if (on.has(p.i)) {
        const fs = Math.min(10, (seat - 6) / (Math.max(unesc(p.name).length, 3) * 0.58));
        sc += `<path d="M${cx - seat * 0.36},124 Q${cx - seat * 0.4},84 ${cx},80 Q${cx + seat * 0.4},84 ${cx + seat * 0.36},124 Z" fill="${bc}" ${o(1.8)}/><circle cx="${cx}" cy="70" r="${seat * 0.17}" fill="#0E0F14" ${o(1.5)}/><path d="M${cx - seat * 0.17},66 Q${cx},${66 - seat * 0.3} ${cx + seat * 0.17},66 Z" fill="${bc}" ${o(1.2)}/>
<rect x="${cx - seat * 0.42}" y="98" width="${seat * 0.84}" height="16" rx="3" fill="${PAPER}" ${o(1.4)}/><path d="M${cx + seat * 0.42},101 q6,5 0,10" fill="none" ${o(1.6)}/>${T(cx, 109.5, unesc(p.name), fs, 700, INK)}<path d="M${cx - 3},96 q-2,-6 1,-10 M${cx + 3},96 q2,-6 -1,-10" stroke="#EDE6D2" stroke-width="1.2" fill="none" opacity=".6"/>`;
      } else {
        sc += `<path d="M${cx - seat * 0.34},124 Q${cx - seat * 0.3},112 ${cx},110 Q${cx + seat * 0.3},112 ${cx + seat * 0.34},124 Z" fill="${bc}" ${o(1.6)}/><path d="M${cx - seat * 0.2},116 Q${cx},113 ${cx + seat * 0.2},116" stroke="${INK}" stroke-width="1" fill="none"/>`;
      }
    });
    out += `<g data-f="${f}" transform="translate(${x},${y})"><rect x="-4" y="-4" width="${fw + 8}" height="${fh + 30}" fill="#111216"/>${[...Array(14)].map((_, k) => `<rect x="${4 + k * 23}" y="${fh + 6}" width="10" height="6" rx="1.5" fill="#3A3A40"/>`).join("")}<g clip-path="url(#z${D.id})">${sc}</g>${T(8, 18, String(f + 1).padStart(2, "0"), 11, 800, PAPER, "start")}<text x="${fw - 8}" y="${fh - 8}" text-anchor="end" font-family="IBM Plex Mono, Menlo, monospace" font-weight="700" font-size="13" fill="#FF9A3C" stroke="#111216" stroke-width="3" paint-order="stroke">${esc(t)}</text></g>`;
  });
  const H = 14 + Math.ceil(frames.length / 2) * (fh + 34);
  const svg = `<svg viewBox="0 0 684 ${H}" role="img" aria-label="${esc(L("Zeitraffer vom Balkon, zehn Bilder: Bank mit Decken und Tassen mit Namen", "Balcony time-lapse, ten frames: bench with blankets and named mugs"))}" style="width:100%;display:block;background:#1A1A1E">${D.svg}<clipPath id="z${D.id}"><rect width="${fw}" height="${fh}"/></clipPath>${out}</svg>`;
  return pic(svg, L("Zeitraffer vom Balkon – antippen zum Vergrößern", "Balcony time-lapse – tap to enlarge"));
}

// Punkteblock der Würfelrunde: Handschrift (Caveat, in spiel.css), wer weg war, hat in der Runde keine Punkte
const unesc2 = (s) => String(s).replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m, x) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" }[x]));
const HAND = `font-family="Caveat, Segoe Print, Bradley Hand, cursive" font-weight="600"`;
const H = (x, y, t, s = 14, c = "#1F2A6B", a = "middle", rot = 0) => `<text x="${x}" y="${y}" text-anchor="${a}" ${HAND} font-size="${s}" fill="${c}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ""}>${esc(t)}</text>`;
// people: [{name, i}], times: ["23:58", …], at(r) → Set der i am Tisch in Runde r, note: Randnotiz
export function punkteblock(en, people, times, at, note) {
  const D = defs(), L = (d, e) => (en ? e : d);
  const n = people.length, cw = Math.min(110, 430 / Math.max(n, 1)), x0 = 150, top = 92, rh = 34, W = x0 + n * cw + 40;
  const pts = (r, i) => 3 + ((r * 7 + i * 13 + r * i * 5 + r * r * 3) % 22);   // r² verhindert konstante Spalten (Spieltest 9.10.: eine Person hatte immer 20)
  let g = `<rect x="10" y="10" width="${W - 20}" height="${top + times.length * rh + 120}" fill="#FFFDF3" ${o(2)}/>`;
  for (let y = top - 20; y < top + times.length * rh + 90; y += 17) g += `<path d="M10,${y} L${W - 10},${y}" stroke="#BFD3E6" stroke-width="1"/>`;
  g += `<path d="M${x0 - 14},14 L${x0 - 14},${top + times.length * rh + 116}" stroke="#E6A0A0" stroke-width="1.6"/>`;
  g += H(30, 50, L("Würfeln – Freitag Nacht", "Dice – Friday night"), 28, INK, "start", -1.5);
  g += H(30, top + 2, L("Runde", "Round"), 16, MUTED, "start");
  g += `<g data-h="1">`;
  people.forEach((p, k) => { g += H(x0 + k * cw + cw / 2, top + 2, unesc2(p.name), Math.min(22, cw / (Math.max(unesc2(p.name).length, 3) * 0.45)), INK, "middle", (k % 2 ? 2 : -2)); });
  g += `</g>`;
  times.forEach((t, r) => {
    const y = top + 30 + r * rh + (r >= 2 ? 26 : 0), on = at(r);
    g += `<g data-r="${r}">` + H(30, y, `${r + 1}.`, 20, INK, "start") + H(60, y, t, 16, MUTED, "start");
    people.forEach((p, k) => { if (on.has(p.i)) g += `<g data-p="${k}">` + H(x0 + k * cw + cw / 2 + (((r * 3 + k) % 5) - 2), y + (((r + k * 2) % 3) - 1), String(pts(r, p.i)), 21, ((r + k) % 4 === 0) ? "#2A3A8C" : "#1F2A6B", "middle", ((r * 2 + k) % 7) - 3) + `</g>`; });
    g += `</g>`;
    if (r === 1) g += `<path d="M24,${y + 12} L${W - 30},${y + 12}" stroke="${RED}" stroke-width="1.4" stroke-dasharray="5 4"/>` + H(x0, y + 32, unesc2(note), 18, RED, "start", -1.5);
  });
  g += `<path d="M24,${top + times.length * rh + 36} L${W - 30},${top + times.length * rh + 36}" ${o(1.6)}/>` + H(30, top + times.length * rh + 66, L("Nach Runde 8 ab ins Bett!", "Bed after round 8!"), 19, INK, "start", -1);
  const Hh = top + times.length * rh + 140;
  const svg = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(L("Punkteblock der Würfelrunde, Punkte je Runde und Person", "Dice score sheet, points per round and person"))}" style="width:100%;display:block;background:#8C6E4E">${D.svg}<rect width="${W}" height="${Hh}" fill="${D.hatch}" opacity=".06"/>${g}</svg>`;
  return pic(svg, L("Punkteblock – antippen zum Vergrößern", "Score sheet – tap to enlarge"));
}
