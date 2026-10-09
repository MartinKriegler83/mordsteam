// Bild-Baukasten „Graphic Novel“ für die Akten (Entscheidung 9.10.2026): kräftige Konturen, harte Schatten,
// Rasterpunkte, Rot als Licht. Alles als SVG-Text – die Bilder entstehen je Runde aus denselben Daten wie die Akte.
export const INK = "#111216", PAPER = "#F1EADB", CARD = "#E4DAC6", RED = "#C8342A", TAN = "#D9C39A", SKIN = "#E8D2B8", SHADE = "#B79C80", MUTED = "#5E5A52";
let uid = 0;   // eindeutige IDs für Muster je Bild
export const o = (w = 3, c = INK) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
export const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
export const T = (x, y, t, s = 13, w = 600, c = INK, a = "middle") => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="IBM Plex Sans, Arial, sans-serif" font-weight="${w}" font-size="${s}" fill="${c}">${esc(t)}</text>`;
export function defs() {
  const id = ++uid;
  return { id, svg: `<defs><pattern id="d${id}" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.2" fill="#C9BFA9"/></pattern><pattern id="h${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0,0 L0,6" stroke="${INK}" stroke-width="1.6"/></pattern><filter id="b${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`, dots: `url(#d${id})`, hatch: `url(#h${id})`, blur: `url(#b${id})` };
}
// Kopf: Schattenhälfte rechts, rotes Streiflicht links; Frauen mit Wimpern und roten Lippen, Männer mit kräftigen Brauen und Kinnlinie
function face(rim, fem) {
  const shape = fem ? "M-18,-150 Q-20,-178 0,-182 Q20,-178 18,-150 Q16,-130 0,-125 Q-16,-130 -18,-150 Z" : "M-20,-150 Q-21,-179 0,-182 Q21,-179 20,-150 Q19,-130 6,-124 L-6,-124 Q-19,-130 -20,-150 Z";
  const sh = fem ? "M3,-181 Q20,-178 18,-150 Q16,-130 2,-125 Q11,-150 3,-181 Z" : "M3,-181 Q21,-179 20,-150 Q19,-130 6,-124 L2,-124 Q11,-150 3,-181 Z";
  const eyes = fem ? `<path d="M-11,-156 Q-7,-159 -3,-156 M5,-156 Q9,-159 13,-156" fill="none" ${o(2.2)}/><path d="M-11,-157 l-2,-3 M13,-157 l2,-3" ${o(1.4)}/>` : `<path d="M-12,-161 L-3,-160 M5,-160 L13,-161" ${o(3)}/><path d="M-10,-155 L-4,-155 M6,-155 L12,-155" ${o(2.4)}/>`;
  const mouth = fem ? `<path d="M-5,-135 Q0,-132 5,-135 Q0,-137.5 -5,-135 Z" fill="${RED}" ${o(1.2)}/>` : `<path d="M-6,-134 Q0,-132 6,-134" fill="none" ${o(2)}/>`;
  return `<path d="${shape}" fill="${SKIN}" ${o()}/><path d="${sh}" fill="${SHADE}"/><path d="M-16,-160 Q-19,-145 -13,-133" fill="none" stroke="${rim}" stroke-width="3"/>${eyes}<path d="M0,-151 L-2,-142 L2,-141" fill="none" ${o(1.8)}/>${mouth}`;
}
function torso(fill, shade, fem) {
  const w = fem ? 26 : 33, b = fem ? 36 : 42;
  return `<path d="M-${w},-118 Q0,-126 ${w},-118 L${b},-40 L-${b},-40 Z" fill="${fill}" ${o()}/><path d="M8,-123 Q${w},-118 ${w},-118 L${b},-40 L14,-40 Q18,-80 8,-123 Z" fill="${shade}" opacity=".85"/><path d="M-${w},-116 L-${w + 13},-60 M${w},-116 L${w + 13},-60" fill="none" ${o(5)}/>`;
}
// Figuren (Brustbild, Füße bei y=0 liegen unter dem Bildrand). key → Zeichnung
const FIG = {
  // Solo 001
  anton: (r) => `${torso("#1F2A44", "#111827")}<path d="M-6,-122 L-6,-44 M6,-122 L6,-44" stroke="${TAN}" stroke-width="2" stroke-dasharray="1 9"/><rect x="-28" y="-104" width="14" height="9" fill="${TAN}" ${o(1.5)}/>${face(r)}<path d="M-23,-168 L23,-168 L26,-160 L-26,-160 Z" fill="${INK}" ${o(2)}/><path d="M-20,-168 Q-18,-188 0,-188 Q18,-188 20,-168 Z" fill="#1F2A44" ${o(2)}/><circle cx="0" cy="-176" r="4" fill="${TAN}"/>`,
  helene: (r) => `${torso("#2F3A4F", "#1C2433", true)}${[...Array(7)].map((_, i) => `<circle cx="${-12 + i * 4}" cy="${-114 - Math.abs(3 - i) * 1.3}" r="2.4" fill="${PAPER}" ${o(1)}/>`).join("")}${face(r, true)}<path d="M-22,-150 Q-27,-190 0,-190 Q27,-190 22,-150 L23,-128 Q16,-128 15,-150 Q12,-170 0,-174 Q-12,-170 -15,-150 Q-16,-128 -23,-128 Z" fill="#B9B4AA" ${o(2.4)}/><circle cx="-19" cy="-141" r="3" fill="${PAPER}" ${o(1)}/><circle cx="19" cy="-141" r="3" fill="${PAPER}" ${o(1)}/>`,
  jonas: (r) => `${torso("#7A2A24", "#4E1714")}<path d="M-16,-122 Q0,-100 16,-122" fill="none" ${o(3)}/><path d="M-6,-108 L-7,-92 M6,-108 L7,-92" ${o(2.4)}/>${face(r)}<path d="M-21,-158 Q-25,-176 -14,-184 Q-6,-194 4,-188 Q16,-192 21,-178 Q25,-166 21,-156 Q14,-168 2,-168 Q-10,-170 -21,-158 Z" fill="#4A3B2A" ${o(2)}/><path d="M-12,-180 Q-6,-176 -2,-182 M6,-184 Q10,-178 14,-182" fill="none" ${o(1.6, "#2A2118")}/><path d="M-14,-131 L-14,-128 M-9,-128 L-9,-126 M9,-128 L9,-126 M14,-131 L14,-128" ${o(1.4, MUTED)}/>`,
  sofia: (r) => `${torso("#5E5A52", "#3B3832", true)}<path d="M-20,-118 L14,-60" stroke="${RED}" stroke-width="4"/><rect x="2" y="-74" width="26" height="18" rx="3" fill="${INK}" ${o(2)}/><circle cx="15" cy="-65" r="5" fill="${MUTED}" ${o(1.5)}/>${[...Array(12)].map((_, i) => { const a = Math.PI * (0.85 + i * 0.12); return `<circle cx="${(Math.cos(a) * 23).toFixed(1)}" cy="${(-158 + Math.sin(a) * 26).toFixed(1)}" r="8" fill="${INK}"/>`; }).join("")}<path d="M-24,-150 Q-30,-120 -24,-104 M24,-150 Q30,-120 24,-104" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>${face(r, true)}<path d="M-18,-165 Q0,-182 18,-165" fill="none" stroke="${INK}" stroke-width="7"/>`,
  // Fahrgast Liegeplatz 64 (ohne Namen): Strickjacke, hebt die Hand gegen die Kamera
  mann64: (r) => `${torso("#5F6B4A", "#3E4730")}<path d="M-8,-122 L-4,-44 M8,-122 L4,-44" stroke="${INK}" stroke-width="1.6"/>${face(r)}<path d="M-21,-158 Q-22,-184 0,-186 Q22,-184 21,-158 Q14,-172 0,-172 Q-14,-172 -21,-158 Z" fill="#2A2420" ${o(2)}/><path d="M-24,-158 Q-27,-146 -21,-142 M24,-158 Q27,-146 21,-142" fill="none" ${o(2)}/><path d="M30,-110 Q48,-140 52,-168" fill="none" stroke="#5F6B4A" stroke-width="16" stroke-linecap="round"/><path d="M30,-110 Q48,-140 52,-168" fill="none" ${o(2)} stroke-dasharray="0"/><ellipse cx="55" cy="-190" rx="19" ry="23" fill="${SKIN}" ${o(2.6)}/><path d="M47,-206 L47,-218 M55,-210 L55,-224 M63,-206 L63,-218 M70,-196 L76,-204" fill="none" ${o(5)} stroke="${SKIN}"/><path d="M47,-206 L47,-218 M55,-210 L55,-224 M63,-206 L63,-218" fill="none" ${o(1.6)}/><path d="M60,-190 Q70,-185 66,-172" fill="${SHADE}" opacity=".7"/>`,
  // Zugbegleiterin (Speisewagen): Weste, Dutt, Serviertablett
  ferri: (r) => `${torso("#7A1F2B", "#4E121B", true)}<path d="M-9,-122 L0,-104 L9,-122 Z" fill="${PAPER}" ${o(1.6)}/>${face(r, true)}<path d="M-19,-152 Q-23,-184 0,-186 Q23,-184 19,-152 Q14,-170 0,-172 Q-14,-170 -19,-152 Z" fill="#3A2A22" ${o(2)}/><circle cx="0" cy="-192" r="10" fill="#3A2A22" ${o(2)}/><ellipse cx="44" cy="-88" rx="34" ry="7" fill="#C9C2B4" ${o(2.4)}/><path d="M30,-95 L30,-108 L40,-108 L40,-95 M50,-95 L50,-104 Q56,-104 56,-98 L56,-95" fill="${PAPER}" ${o(1.8)}/>`,
  lang: (r) => `${torso("#4A4438", "#2E2A23")}<path d="M-10,-120 L0,-114 L10,-120 L10,-108 L0,-114 L-10,-108 Z" fill="${RED}" ${o(1.6)}/>${face(r)}<path d="M-19,-142 Q-17,-116 0,-112 Q17,-116 19,-142 Q8,-128 0,-130 Q-8,-128 -19,-142 Z" fill="#9C978D" ${o(2)}/><path d="M-21,-154 Q-23,-174 -13,-178 M21,-154 Q23,-174 13,-178" fill="none" stroke="#9C978D" stroke-width="6"/>`,
};
export function fig(key, x, y, s = 1, rim = RED) { return `<g transform="translate(${x},${y}) scale(${s})">${FIG[key](rim)}</g>`; }
// Reihe von Porträt-Panels mit Namensleiste (Referenz für Fotos)
export function roster(people, { w = 104, h = 250 } = {}) {
  const W = people.length * w + 6;
  return `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(people.map((p) => p.name).join(", "))}" style="width:100%;display:block;background:${PAPER}">${people.map((p, i) => `<g><rect x="${6 + i * w}" y="6" width="${w - 6}" height="${h - 54}" fill="${CARD}" stroke="${INK}" stroke-width="3"/>${fig(p.key, 3 + i * w + w / 2, h - 14, 0.84, CARD)}<rect x="${6 + i * w}" y="${h - 48}" width="${w - 6}" height="42" fill="${INK}"/>${T(3 + i * w + w / 2, h - 30, p.name, 10.2, 600, PAPER)}${T(3 + i * w + w / 2, h - 14, p.sub || "", 9.5, 400, TAN)}</g>`).join("")}</svg>`;
}
// Bild in der Akte: Rahmen + Hinweis „zum Vergrößern antippen“ (spiel/common.js)
export const pic = (svg, alt = "") => `<figure class="gn-pic" tabindex="0" role="button" aria-label="${esc(alt)}">${svg}</figure>`;
