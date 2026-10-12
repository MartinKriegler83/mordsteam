// Kino-Look für die Rückblenden (11.10.2026): Licht, Verläufe, Atmosphäre, Figuren mit Tiefe.
// Benutzung in einer rb_*-Datei:
//   const C = cine();  …  `<svg …>${C.defs()}${…C.lin(…)…}</svg>`   (defs() erst NACH allen anderen Aufrufen einsetzen → C.wrap(inner))
// Alle IDs sind je Aufruf eindeutig (zwei Szenen liegen beim Überblenden gleichzeitig im DOM).
// Bewegung über die rb-*-Klassen des Players (site/spiel/rueckblende.js), u. a. rb-drift, rb-dust, rb-flicker, rb-snowF, rb-snowB, rb-breathe, rb-walkin, rb-walkout.
import { INK, PAPER, RED, o, T, esc } from "./gn.js";

let cid = 0;
export const SERIF = "Fraunces, Georgia, serif", SANS = "IBM Plex Sans, Arial, sans-serif", MONO = "IBM Plex Mono, monospace";
export function cine(W = 640, H = 360) {
  const base = "c" + ++cid; let n = 0; const D = [];
  const id = () => `${base}_${++n}`;
  const stopsOf = (stops) => stops.map(([off, col, op = 1]) => `<stop offset="${off}" stop-color="${col}" stop-opacity="${op}"/>`).join("");
  const C = {
    W, H,
    // Verlauf linear: stops = [[0,"#000"],[1,"#fff",0.5]] · Richtung über x1,y1,x2,y2 (0..1)
    lin(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) { const i = id(); D.push(`<linearGradient id="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsOf(stops)}</linearGradient>`); return `url(#${i})`; },
    rad(stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) { const i = id(); D.push(`<radialGradient id="${i}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ""}>${stopsOf(stops)}</radialGradient>`); return `url(#${i})`; },
    blur(sd = 4) { const i = id(); D.push(`<filter id="${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`); return `url(#${i})`; },
    clip(path) { const i = id(); D.push(`<clipPath id="${i}"><path d="${path}"/></clipPath>`); return `url(#${i})`; },
    // Hintergrund mit vertikalem Verlauf
    sky(top, bottom, mid) { return `<rect width="${W}" height="${H}" fill="${C.lin(mid ? [[0, top], [0.55, mid], [1, bottom]] : [[0, top], [1, bottom]])}"/>`; },
    // weiches Licht (Lampe, Kerze, Fenster): Kreis mit radialem Verlauf, additiv wirkend
    light(x, y, r, col = "#FFD27A", op = 0.55, cls = "") { return `<circle ${cls ? `class="${cls}" ` : ""}cx="${x}" cy="${y}" r="${r}" fill="${C.rad([[0, col, op], [0.45, col, op * 0.35], [1, col, 0]])}" style="mix-blend-mode:screen"/>`; },
    // Lichtkegel von (x,y) nach unten bis yb, Breite oben w0, unten w1
    cone(x, y, w0, w1, yb, col = "#FFE2A0", op = 0.35, cls = "") { return `<path ${cls ? `class="${cls}" ` : ""}d="M${x - w0 / 2},${y} L${x + w0 / 2},${y} L${x + w1 / 2},${yb} L${x - w1 / 2},${yb} Z" fill="${C.lin([[0, col, op], [1, col, 0]])}" style="mix-blend-mode:screen"/>`; },
    // dunkler Rand (Vignette) – als letztes Element einer Szene
    vignette(op = 0.6, col = "#000") { return `<rect width="${W}" height="${H}" fill="${C.rad([[0.55, col, 0], [1, col, op]], 0.5, 0.5, 0.75)}" pointer-events="none"/>`; },
    // Farbstimmung über das ganze Bild (z. B. kaltes Mondlicht, warmes Kerzenlicht)
    tint(col, op = 0.18, blend = "multiply") { return `<rect width="${W}" height="${H}" fill="${col}" opacity="${op}" style="mix-blend-mode:${blend}" pointer-events="none"/>`; },
    // Boden mit Verlauf und Reflexstreifen
    floor(y, top, bottom) { return `<rect y="${y}" width="${W}" height="${H - y}" fill="${C.lin([[0, top], [1, bottom]])}"/><path d="M0,${y} L${W},${y}" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`; },
    // Holzwand aus Brettern
    wood(x, y, w, h, col = "#6B4A2C", dark = "#3E2A18", vertical = false) {
      const g = C.lin([[0, col], [1, dark]], 0, 0, vertical ? 1 : 0, vertical ? 0 : 1); const k = vertical ? Math.ceil(w / 34) : Math.ceil(h / 26);
      const lines = [...Array(k)].map((_, i) => vertical ? `<path d="M${x + i * 34},${y} L${x + i * 34},${y + h}" stroke="#000" stroke-opacity=".28" stroke-width="2"/>` : `<path d="M${x},${y + i * 26} L${x + w},${y + i * 26}" stroke="#000" stroke-opacity=".28" stroke-width="2"/><path d="M${x + ((i * 97) % w)},${y + i * 26 + 9} q6,4 12,0" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1.4"/>`).join("");
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${g}"/>${lines}`;
    },
    // Fenster: Nachthimmel (optional Mond, Schnee), Sprossen, Lichtschein nach innen
    win(x, y, w, h, { sky = ["#0B1630", "#23345A"], moon = false, snow = 0, frame = "#3A2616", glow = "#9FB6E0" } = {}) {
      const cl = C.clip(`M${x},${y} h${w} v${h} h-${w} Z`);
      const flakes = [...Array(snow)].map((_, i) => `<circle class="rb-snow" style="--d:${(i % 7) * 0.5}s" cx="${x + ((i * 37) % w)}" cy="${y + ((i * 23) % h) - 20}" r="${i % 3 ? 1.3 : 2}" fill="#E9EEF2"/>`).join("");
      return `<g><g clip-path="${cl}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.lin([[0, sky[0]], [1, sky[1]]])}"/>${moon ? `<circle cx="${x + w * 0.7}" cy="${y + h * 0.3}" r="${Math.min(w, h) * 0.13}" fill="#F3EED8"/>${C.light(x + w * 0.7, y + h * 0.3, Math.min(w, h) * 0.5, "#DDE6FF", 0.4)}` : ""}${flakes}</g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${frame}" stroke-width="8"/><path d="M${x + w / 2},${y} L${x + w / 2},${y + h} M${x},${y + h / 2} L${x + w},${y + h / 2}" stroke="${frame}" stroke-width="5"/><rect x="${x - 8}" y="${y + h}" width="${w + 16}" height="8" fill="${frame}"/>${C.light(x + w / 2, y + h / 2, Math.max(w, h) * 0.9, glow, 0.16)}</g>`;
    },
    // Nebel-/Rauchschwaden, die langsam treiben
    fog(y, op = 0.25, col = "#C9D3E0") { const b = C.blur(14); return `<g class="rb-drift" opacity="${op}" filter="${b}">${[0, 1, 2, 3].map((i) => `<ellipse cx="${80 + i * 170}" cy="${y + (i % 2) * 14}" rx="150" ry="26" fill="${col}"/>`).join("")}</g>`; },
    // Staub im Licht
    dust(x, y, w, h, k = 18, col = "#FFF3D0") { return [...Array(k)].map((_, i) => `<circle class="rb-dust" style="--d:${(i % 8) * 0.45}s" cx="${x + ((i * 53) % w)}" cy="${y + ((i * 31) % h)}" r="${i % 4 ? 1 : 1.6}" fill="${col}" opacity=".6"/>`).join(""); },
    // Schneetreiben in zwei Ebenen (hinten klein/langsam, vorne groß/schnell → Tiefe)
    snow(k = 50) { return [...Array(k)].map((_, i) => { const f = i % 3 === 0; return `<circle class="${f ? "rb-snowF" : "rb-snowB"}" style="--d:${((i * 0.37) % 4).toFixed(2)}s" cx="${(i * 71) % (W + 60)}" cy="${(i * 37) % 160 - 40}" r="${f ? 2.6 : 1.3}" fill="#EEF2F6" opacity="${f ? 0.95 : 0.6}"/>`; }).join(""); },
    // Sterne
    stars(k = 40, maxY = 140) { return [...Array(k)].map((_, i) => `<circle class="rb-twinkle" style="--d:${(i % 6) * 0.4}s" cx="${(i * 89) % W}" cy="${(i * 41) % maxY}" r="${i % 5 ? 0.9 : 1.5}" fill="#F3EED8"/>`).join(""); },
    // Schatten unter einer Figur/Sache
    shadow(x, y, rx = 46, ry = 8, op = 0.45) { return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.rad([[0, "#000", op], [1, "#000", 0]])}"/>`; },
    // Figur (Brustbild bis Hüfte, Fuß bei y=0) ohne Gesicht – für echte Mitspieler (Friends) oder Figuren von hinten.
    // opt: coat (Kleidung), hair (Farbe), style: short|long|bun|cap|bald|curly, skin, rim (Streiflicht), name (Schild), back (von hinten), lean (Grad)
    person(x, y, s = 1, opt = {}) {
      const { coat = "#3B4A6B", hair = "#2A2018", style = "short", skin = "#D9B99A", rim = "#FFD9A0", name = "", back = false, lean = 0, hi = false } = opt;
      const sh = C.lin([[0, coat], [1, "#000", 0.55]], 0, 0, 1, 0.3);
      const head = `<ellipse cx="0" cy="-150" rx="21" ry="25" fill="${skin}"/><ellipse cx="7" cy="-150" rx="14" ry="24" fill="#000" opacity=".22"/>`;
      const hairs = {
        short: `<path d="M-22,-152 Q-24,-180 0,-181 Q24,-180 22,-152 Q17,-168 0,-167 Q-17,-168 -22,-152 Z" fill="${hair}"/>`,
        long: `<path d="M-23,-150 Q-27,-184 0,-184 Q27,-184 23,-150 L25,-112 Q16,-114 15,-140 Q12,-166 0,-168 Q-12,-166 -15,-140 Q-16,-114 -25,-112 Z" fill="${hair}"/>`,
        bun: `<path d="M-22,-152 Q-24,-182 0,-182 Q24,-182 22,-152 Q16,-170 0,-170 Q-16,-170 -22,-152 Z" fill="${hair}"/><circle cx="0" cy="-186" r="10" fill="${hair}"/>`,
        cap: `<path d="M-23,-160 Q-22,-184 0,-185 Q22,-184 23,-160 Z" fill="${hair}"/><path d="M-23,-160 L30,-160 L28,-154 L-23,-155 Z" fill="${hair}"/>`,
        bald: `<path d="M-21,-148 Q-22,-158 -18,-162 M21,-148 Q22,-158 18,-162" fill="none" stroke="${hair}" stroke-width="5"/>`,
        curly: [...Array(9)].map((_, i) => { const a = Math.PI * (0.95 + i * 0.13); return `<circle cx="${(Math.cos(a) * 20).toFixed(1)}" cy="${(-156 + Math.sin(a) * 24).toFixed(1)}" r="8" fill="${hair}"/>`; }).join(""),
      };
      const backHair = back ? `<path d="M-22,-150 Q-24,-182 0,-182 Q24,-182 22,-150 Q22,-128 0,-126 Q-22,-128 -22,-150 Z" fill="${hair}"/>` : "";
      const body = `<path d="M-46,0 Q-48,-70 -36,-104 Q-20,-122 0,-122 Q20,-122 36,-104 Q48,-70 46,0 Z" fill="${coat}"/><path d="M-46,0 Q-48,-70 -36,-104 Q-20,-122 0,-122 Q20,-122 36,-104 Q48,-70 46,0 Z" fill="${sh}"/><path d="M-36,-104 Q-50,-60 -44,-14" fill="none" stroke="${rim}" stroke-width="2.5" opacity=".7"/><rect x="-9" y="-130" width="18" height="12" fill="${skin}"/><rect x="-9" y="-130" width="18" height="12" fill="#000" opacity=".25"/>`;
      const rimHead = `<path d="M-20,-160 Q-23,-146 -16,-132" fill="none" stroke="${rim}" stroke-width="2.5" opacity=".8"/>`;
      const tag = name ? `<g transform="translate(0,-58)"><rect x="-40" y="-13" width="80" height="24" rx="3" fill="${PAPER}" stroke="${hi ? RED : INK}" stroke-width="${hi ? 2.5 : 1.6}"/>${T(0, 4, name.length > 10 ? name.slice(0, 9) + "…" : name, 13, 800)}</g>` : "";
      return `<g transform="translate(${x},${y}) scale(${s}) rotate(${lean})">${C.shadow(0, 2, 56, 9)}${body}${back ? backHair : head + (hairs[style] || hairs.short) + rimHead}${tag}</g>`;
    },
    // Titelkarte: Kicker (klein, rot), Titel (Fraunces), Unterzeile – mit Einblendung
    title(kicker, title, sub = "", x = 40, y = 250, col = PAPER) {
      return `<g class="rb-slideup" style="--d:.5s">${T(x, y - 46, kicker, 11, 700, RED, "start").replace("<text ", '<text letter-spacing="3" ')}<text x="${x}" y="${y}" font-family="${SERIF}" font-weight="900" font-size="38" fill="${col}">${esc(title)}</text>${sub ? T(x, y + 28, sub, 14, 500, "#C9C2B4", "start") : ""}<path d="M${x},${y + 42} l120,0" stroke="${RED}" stroke-width="3" class="rb-draw" pathLength="100"/></g>`;
    },
    // Uhrzeit-Einblender im Kinostil (unten links)
    time(t, x = 30, y = 318) { return `<g class="rb-slidein" style="--d:.3s"><rect x="${x}" y="${y - 30}" width="${String(t).length > 5 ? 170 : 104}" height="40" rx="3" fill="#0B0C10" fill-opacity=".82" stroke="#F2C14E" stroke-width="1.5"/><text x="${x + 14}" y="${y - 3}" font-family="${MONO}" font-weight="500" font-size="22" fill="#F2C14E">${esc(t)}</text></g>`; },
    defs() { return `<defs>${D.join("")}</defs>`; },
    // Hülle: Inhalt zuerst erzeugen, dann defs davor setzen
    wrap(inner) { const body = inner(C); return `${C.defs()}${body}`; },
  };
  return C;
}

// Abspann wie bei den Werbe-Teasern (12.10.2026, Martin): Lupe, MORDSTEAM, rote Zeile, Einladung, mordsteam.com – steht ≥ 3 s ruhig.
// plural: Friends/Teams sprechen eine Gruppe an („Kommt zurück …“), Solo eine Person („Komm zurück …“).
export function endcard({ en = false, plural = false } = {}) {
  const W = 640, H = 360, C = cine(W, H), L = (d, e) => (en ? e : d);
  const kicker = L("DER NÄCHSTE FALL WARTET SCHON", "THE NEXT CASE IS WAITING");
  const line = plural ? L("Kommt zurück und löst weitere Fälle.", "Come back and solve more cases.") : L("Komm zurück und löse weitere Fälle.", "Come back and solve more cases.");
  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mordsteam">${C.wrap((C) => `<rect width="${W}" height="${H}" fill="#1B1C22"/><rect width="${W}" height="${H}" fill="${C.rad([[0, "#3A3832", 0.9], [1, "#1B1C22", 0]], 0.5, 0.45, 0.6)}"/>
<g class="rb-fadein" style="--d:.1s"><g transform="translate(320,92)"><circle cx="-4" cy="-4" r="17" fill="none" stroke="#F1EADB" stroke-width="6"/><circle cx="-4" cy="-4" r="7" fill="${RED}"/><path d="M8,8 L22,22" stroke="#F1EADB" stroke-width="6.5" stroke-linecap="round"/></g></g>
<g class="rb-fadein" style="--d:.3s"><text x="320" y="178" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="66" letter-spacing="1"><tspan fill="${RED}">MORDS</tspan><tspan fill="#F1EADB">TEAM</tspan></text></g>
<g class="rb-fadein" style="--d:.7s"><text x="320" y="210" text-anchor="middle" font-family="${MONO}" font-weight="500" font-size="12.5" letter-spacing="2.6" fill="#E0654A">${esc(kicker)}</text></g>
<g class="rb-fadein" style="--d:1s"><text x="320" y="248" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-style="italic" font-size="25" fill="#F1EADB">${esc(line)}</text></g>
<g class="rb-fadein" style="--d:1.3s"><rect x="236" y="268" width="168" height="38" rx="3" fill="${RED}"/><text x="320" y="293" text-anchor="middle" font-family="${MONO}" font-weight="500" font-size="17" fill="#F1EADB">mordsteam.com</text></g>`)}</svg>`;
  return { dur: 5, cam: "none", sfx: [], sub: "", svg };
}
