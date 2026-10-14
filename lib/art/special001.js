// Bilder für das Halloween-Special „Süßes oder Saures“ (special-001), Graphic-Novel-Stil wie alle Akten,
// dazu Kürbis-Orange und Violett. Alles als SVG aus denselben Daten wie die Akte (Täter, Tatzeit, Versteck).
import { o, esc, T, defs, pic, INK, RED, PAPER, CARD, TAN, MUTED, SKIN, SHADE } from "./gn.js";

export const ORANGE = "#E8792B", VIOLET = "#3B2A55", NIGHT = "#1B1626", BONE = "#EDE6D3";
export const PX = 2.5;   // Pixel pro Zoll (Messlatte am Pfosten und Fotowand)
const HAND = `font-family="Caveat, Segoe Print, Bradley Hand, cursive" font-weight="600"`;
const ftin = (i) => `${Math.floor(i / 12)}'${i % 12 ? (i % 12) + '"' : ""}`;

// ---------- Figuren (Ganzkörper, Füße bei y=0, H = Körpergröße in px) ----------
const SHOE = {
  // weiße Sneaker (Linda, Tyler – gleiches Modell)
  weiss: (x, H) => { const w = H * .11, h = H * .05; return `<path d="M${x - w * .42},0 L${x - w * .42},${-h} L${x + w * .08},${-h} L${x + w * .16},${-h * .5} Q${x + w * .7},${-h * .42} ${x + w * .62},0 Z" fill="#F7F4EC" ${o(1.6)}/><path d="M${x - w * .42},-3 L${x + w * .62},-3" stroke="#9A968C" stroke-width="2.4"/><path d="M${x - w * .1},${-h * .85} l${w * .18},0 M${x - w * .06},${-h * .62} l${w * .18},0" stroke="#9A968C" stroke-width="1.4"/>`; },
  // schwarze Sneaker (Rosa, Coach – gleiches Modell)
  schwarz: (x, H) => { const w = H * .11, h = H * .05; return `<path d="M${x - w * .42},0 L${x - w * .42},${-h} L${x + w * .08},${-h} L${x + w * .16},${-h * .5} Q${x + w * .7},${-h * .42} ${x + w * .62},0 Z" fill="#1C1B20" ${o(1.6)}/><path d="M${x - w * .42},-3 L${x + w * .62},-3" stroke="#55525C" stroke-width="2.4"/><path d="M${x - w * .1},${-h * .85} l${w * .18},0 M${x - w * .06},${-h * .62} l${w * .18},0" stroke="#8A8792" stroke-width="1.4"/>`; },
  // braune Cowboystiefel (Greg)
  cowboy: (x, H) => { const w = H * .115, h = H * .085; return `<path d="M${x - w * .35},${-h} L${x + w * .1},${-h} L${x + w * .12},${-h * .35} L${x + w * .75},${-h * .12} L${x + w * .8},0 L${x - w * .1},0 L${x - w * .25},${-h * .08} L${x - w * .35},0 L${x - w * .45},0 Z" fill="#7A4A24" ${o(1.6)}/><path d="M${x - w * .2},${-h * .8} Q${x - w * .1},${-h * .55} ${x - w * .2},${-h * .35}" fill="none" stroke="${TAN}" stroke-width="1.4"/><rect x="${x - w * .42}" y="-4" width="${w * .25}" height="4" fill="${INK}"/>`; },
};
const shoes = (H, k) => SHOE[k](-H * .06, H) + SHOE[k](H * .065, H);
const legs = (H, c) => `<path d="M${-H * .09},${-H * .5} L${-H * .085},${-H * .045} L${-H * .025},${-H * .045} L0,${-H * .4} L${H * .025},${-H * .045} L${H * .085},${-H * .045} L${H * .09},${-H * .5} Z" fill="${c}" ${o(2)}/>`;
const head = (H, fill = SKIN) => `<rect x="${-H * .022}" y="${-H * .83}" width="${H * .044}" height="${H * .04}" fill="${fill}" ${o(1.6)}/><ellipse cx="0" cy="${-H * .89}" rx="${H * .058}" ry="${H * .072}" fill="${fill}" ${o(2)}/><path d="M${H * .01},${-H * .96} Q${H * .06},${-H * .93} ${H * .05},${-H * .86} Q${H * .03},${-H * .82} 0,${-H * .818} Q${H * .03},${-H * .88} ${H * .01},${-H * .96} Z" fill="${SHADE}" opacity=".8"/><path d="M${-H * .028},${-H * .9} l${H * .012},0 M${H * .016},${-H * .9} l${H * .012},0" ${o(2.2)}/>`;
const torso = (H, c, sh) => `<path d="M${-H * .13},${-H * .8} Q0,${-H * .83} ${H * .13},${-H * .8} L${H * .1},${-H * .48} L${-H * .1},${-H * .48} Z" fill="${c}" ${o(2)}/><path d="M${H * .03},${-H * .82} Q${H * .13},${-H * .8} ${H * .13},${-H * .8} L${H * .1},${-H * .48} L${H * .04},${-H * .48} Z" fill="${sh}" opacity=".8"/>`;
const arm = (H, c, s, hand = SKIN) => `<path d="M${s * H * .125},${-H * .78} L${s * H * .17},${-H * .5}" ${o(H * .05, INK)}/><path d="M${s * H * .125},${-H * .78} L${s * H * .17},${-H * .5}" stroke="${c}" stroke-width="${H * .05 - 4}" stroke-linecap="round"/><circle cx="${s * H * .17}" cy="${-H * .48}" r="${H * .022}" fill="${hand}" ${o(1.4)}/>`;
const arms = (H, c, hand) => arm(H, c, -1, hand) + arm(H, c, 1, hand);
const COSTUME = {
  hexe: (H) => `${legs(H, INK)}<path d="M${-H * .12},${-H * .78} L${H * .12},${-H * .78} L${H * .2},${-H * .1} L${-H * .2},${-H * .1} Z" fill="#2A2233" ${o(2)}/><path d="M${-H * .2},${-H * .1} L${-H * .14},${-H * .15} L${-H * .08},${-H * .1} L${-H * .02},${-H * .15} L${H * .04},${-H * .1} L${H * .1},${-H * .15} L${H * .2},${-H * .1}" fill="none" ${o(2)}/>${arms(H, "#2A2233")}<path d="M${-H * .13},${-H * .8} L${-H * .22},${-H * .2} L${-H * .12},${-H * .3} Z M${H * .13},${-H * .8} L${H * .22},${-H * .2} L${H * .12},${-H * .3} Z" fill="${VIOLET}" ${o(1.6)}/>${head(H)}<path d="M${-H * .06},${-H * .93} Q${-H * .1},${-H * .8} ${-H * .07},${-H * .74} M${H * .06},${-H * .93} Q${H * .1},${-H * .8} ${H * .07},${-H * .74}" stroke="#B5462A" stroke-width="${H * .03}" fill="none"/><path d="M${-H * .16},${-H * .95} Q0,${-H * .99} ${H * .16},${-H * .95} L${H * .1},${-H * .93} Q0,${-H * .96} ${-H * .1},${-H * .93} Z" fill="${INK}" ${o(1.6)}/><path d="M${-H * .07},${-H * .955} L${H * .02},${-H * 1.2} L${H * .07},${-H * .955} Z" fill="${INK}" ${o(1.6)}/><path d="M${-H * .065},${-H * .975} L${H * .067},${-H * .975}" stroke="${ORANGE}" stroke-width="${H * .018}"/><path d="M${H * .22},${-H * .9} L${H * .22},${-H * .02}" stroke="#7A4A24" stroke-width="${H * .02}"/><path d="M${H * .22},${-H * .14} L${H * .17},0 M${H * .22},${-H * .14} L${H * .22},0 M${H * .22},${-H * .14} L${H * .27},0" stroke="${TAN}" stroke-width="3"/>`,
  sense: (H) => `${legs(H, "#18161C")}<path d="M${-H * .13},${-H * .82} L${H * .13},${-H * .82} L${H * .17},${-H * .07} L${-H * .17},${-H * .07} Z" fill="#18161C" ${o(2)}/><path d="M${H * .02},${-H * .82} L${H * .13},${-H * .82} L${H * .17},${-H * .07} L${H * .05},${-H * .07} Z" fill="#2C2833"/>${arms(H, "#18161C")}<path d="M${-H * .085},${-H * .82} Q${-H * .1},${-H * 1.0} 0,${-H * 1.0} Q${H * .1},${-H * 1.0} ${H * .085},${-H * .82} Z" fill="#18161C" ${o(2)}/><ellipse cx="0" cy="${-H * .885}" rx="${H * .042}" ry="${H * .055}" fill="#CFCBC2" ${o(1.6)}/><path d="M${-H * .022},${-H * .9} l${H * .012},0 M${H * .01},${-H * .9} l${H * .012},0" ${o(2.6)}/><path d="M${-H * .2},${-H * 1.08} L${-H * .2},${-H * .02}" stroke="#6B4A2A" stroke-width="${H * .022}"/><path d="M${-H * .2},${-H * 1.08} Q${H * .02},${-H * 1.12} ${H * .06},${-H * .98} Q${-H * .05},${-H * 1.04} ${-H * .2},${-H * 1.0} Z" fill="#B9BEC6" ${o(1.6)}/>`,
  werwolf: (H) => `${legs(H, "#34507A")}<path d="M${-H * .13},${-H * .8} Q0,${-H * .83} ${H * .13},${-H * .8} L${H * .1},${-H * .48} L${-H * .1},${-H * .48} Z" fill="#9A2B2B" ${o(2)}/>${[-.07, 0, .07].map((d) => `<path d="M${H * d},${-H * .81} L${H * d},${-H * .48}" stroke="${INK}" stroke-width="1.6" opacity=".7"/>`).join("")}<path d="M${-H * .13},${-H * .62} L${H * .13},${-H * .62}" stroke="${INK}" stroke-width="1.6" opacity=".7"/>${arms(H, "#9A2B2B", "#5A4636")}<path d="M${-H * .065},${-H * .82} Q${-H * .09},${-H * .98} ${-H * .05},${-H * 1.02} L${-H * .035},${-H * .97} Q0,${-H * .99} ${H * .035},${-H * .97} L${H * .05},${-H * 1.02} Q${H * .09},${-H * .98} ${H * .065},${-H * .82} Q${H * .07},${-H * .78} 0,${-H * .79} Q${-H * .07},${-H * .78} ${-H * .065},${-H * .82} Z" fill="#5A4636" ${o(2)}/><path d="M${-H * .03},${-H * .86} Q0,${-H * .79} ${H * .03},${-H * .86} L0,${-H * .83} Z" fill="#3A2C22" ${o(1.4)}/><circle cx="${-H * .025}" cy="${-H * .9}" r="${H * .009}" fill="#E9B44C"/><circle cx="${H * .025}" cy="${-H * .9}" r="${H * .009}" fill="#E9B44C"/>`,
  vampir: (H) => `${legs(H, "#151318")}${torso(H, "#151318", "#2A2730")}<path d="M${-H * .03},${-H * .81} L0,${-H * .7} L${H * .03},${-H * .81} Z" fill="${PAPER}" ${o(1.2)}/><path d="M${-H * .14},${-H * .8} L${-H * .25},${-H * .12} L${-H * .12},${-H * .2} Z M${H * .14},${-H * .8} L${H * .25},${-H * .12} L${H * .12},${-H * .2} Z" fill="#7E1A22" ${o(1.6)}/>${arms(H, "#151318")}<path d="M${-H * .14},${-H * .79} L${-H * .1},${-H * .95} L${-H * .04},${-H * .83} Z M${H * .14},${-H * .79} L${H * .1},${-H * .95} L${H * .04},${-H * .83} Z" fill="${RED}" ${o(1.6)}/>${head(H, "#E6E0DA")}<path d="M${-H * .058},${-H * .9} Q${-H * .06},${-H * .97} 0,${-H * .965} Q${H * .06},${-H * .97} ${H * .058},${-H * .9} Q${H * .03},${-H * .94} 0,${-H * .925} Q${-H * .03},${-H * .94} ${-H * .058},${-H * .9} Z" fill="${INK}" ${o(1.4)}/><path d="M${-H * .012},${-H * .855} Q0,${-H * .85} ${H * .012},${-H * .855}" stroke="${RED}" stroke-width="2.4" fill="none"/>`,
  kuerbis: (H) => `${legs(H, "#2F5A3A")}<path d="M${-H * .085},${-H * .3} L${-H * .08},${-H * .05} M${H * .085},${-H * .3} L${H * .08},${-H * .05}" stroke="${PAPER}" stroke-width="2.5"/>${torso(H, "#2F5A3A", "#1F3E28")}<path d="M${-H * .02},${-H * .81} L${-H * .02},${-H * .5}" stroke="${PAPER}" stroke-width="2"/>${arms(H, "#2F5A3A")}<ellipse cx="0" cy="${-H * .92}" rx="${H * .12}" ry="${H * .1}" fill="${ORANGE}" ${o(2.4)}/><path d="M${-H * .05},${-H * 1.01} Q${-H * .07},${-H * .92} ${-H * .05},${-H * .83} M${H * .05},${-H * 1.01} Q${H * .07},${-H * .92} ${H * .05},${-H * .83} M0,${-H * 1.02} L0,${-H * .82}" fill="none" stroke="#B4561B" stroke-width="2"/><path d="M0,${-H * 1.02} Q${H * .01},${-H * 1.06} ${H * .03},${-H * 1.07}" stroke="#3F5A35" stroke-width="${H * .02}" fill="none"/><path d="M${-H * .06},${-H * .95} l${H * .025},${-H * .025} l${H * .015},${H * .025} Z M${H * .06},${-H * .95} l${-H * .025},${-H * .025} l${-H * .015},${H * .025} Z" fill="${INK}"/><path d="M${-H * .065},${-H * .89} L${-H * .04},${-H * .87} L${-H * .02},${-H * .89} L0,${-H * .87} L${H * .02},${-H * .89} L${H * .04},${-H * .87} L${H * .065},${-H * .89} Q0,${-H * .84} ${-H * .065},${-H * .89} Z" fill="${INK}"/>`,
  // Skelett-Anzug über dunkler Kleidung: schwarzer Körper mit aufgedruckten Knochen, Totenkopf-Haube
  anzug: (H) => { const b = (d) => `<path d="${d}" stroke="${BONE}" stroke-width="${H * .022}" stroke-linecap="round" fill="none"/>`;
    return `${legs(H, "#0E0D11")}${torso(H, "#0E0D11", "#0E0D11")}${arms(H, "#0E0D11", "#0E0D11")}${b(`M0,${-H * .8} L0,${-H * .5}`)}${[-.75, -.7, -.65, -.6].map((y) => b(`M${-H * .085},${H * y} Q0,${H * (y - .02)} ${H * .085},${H * y}`)).join("")}${b(`M${-H * .07},${-H * .49} Q0,${-H * .45} ${H * .07},${-H * .49}`)}${b(`M${-H * .06},${-H * .45} L${-H * .055},${-H * .08} M${H * .06},${-H * .45} L${H * .055},${-H * .08}`)}${b(`M${-H * .14},${-H * .76} L${-H * .165},${-H * .52} M${H * .14},${-H * .76} L${H * .165},${-H * .52}`)}<rect x="${-H * .022}" y="${-H * .83}" width="${H * .044}" height="${H * .04}" fill="#0E0D11" ${o(1.6)}/><ellipse cx="0" cy="${-H * .89}" rx="${H * .058}" ry="${H * .072}" fill="#0E0D11" ${o(2)}/><path d="M${-H * .045},${-H * .9} Q${-H * .05},${-H * .955} 0,${-H * .955} Q${H * .05},${-H * .955} ${H * .045},${-H * .9} Q${H * .04},${-H * .86} ${H * .02},${-H * .85} L${-H * .02},${-H * .85} Q${-H * .04},${-H * .86} ${-H * .045},${-H * .9} Z" fill="${BONE}"/><circle cx="${-H * .018}" cy="${-H * .9}" r="${H * .013}" fill="#0E0D11"/><circle cx="${H * .018}" cy="${-H * .9}" r="${H * .013}" fill="#0E0D11"/><path d="M${-H * .015},${-H * .862} l${H * .03},0" stroke="#0E0D11" stroke-width="2" stroke-dasharray="2 2"/>`; },
};
export const TOP = 0.962;   // Scheitel liegt bei 0.962 × H (Kopfellipse) – H so wählen, dass der Scheitel genau auf der Körpergröße liegt
// Nur der Skelett-Anzug (ohne Schuhe), z. B. am Haken in der Garage
export const suitOnly = (inch) => COSTUME.anzug(inch * PX / TOP);
export const person = (costume, inch, shoe, x, y = 0) => { const H = inch * PX / TOP; return `<g transform="translate(${x},${y})">${COSTUME[costume](H)}${shoes(H, shoe)}</g>`; };
// Deko-Skelett aus Kunststoff auf einer Stange: ganz knochenweiß, Knochenfüße
export function deco(inch, x, y, pose = 0) {
  const H = inch * PX / TOP;
  const b = (d, w = H * .025) => `<path d="${d}" stroke="${INK}" stroke-width="${w + 3}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${BONE}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const a = pose === 1 ? `M${H * .13},${-H * .76} L${H * .24},${-H * .95}` : pose === 2 ? `M${H * .13},${-H * .76} L${H * .26},${-H * .7}` : `M${H * .13},${-H * .76} L${H * .16},${-H * .5}`;
  return `<g transform="translate(${x},${y})"><path d="M0,${-H * .45} L0,${H * .02}" stroke="#5E5A52" stroke-width="3"/>${b(`M0,${-H * .8} L0,${-H * .48}`)}${[-.75, -.7, -.65, -.6].map((yy) => b(`M${-H * .085},${H * yy} Q0,${H * (yy - .02)} ${H * .085},${H * yy}`, H * .018)).join("")}${b(`M${-H * .13},${-H * .78} L${H * .13},${-H * .78}`)}${b(`M${-H * .13},${-H * .76} L${-H * .16},${-H * .5}`)}${b(a)}${b(`M${-H * .07},${-H * .49} Q0,${-H * .44} ${H * .07},${-H * .49}`)}${b(`M${-H * .06},${-H * .46} L${-H * .07},${-H * .05} M${H * .06},${-H * .46} L${H * .07},${-H * .05}`)}${b(`M${-H * .07},${-H * .04} L${-H * .12},${-H * .02} M${H * .07},${-H * .04} L${H * .12},${-H * .02}`, H * .02)}<ellipse cx="0" cy="${-H * .89}" rx="${H * .06}" ry="${H * .07}" fill="${BONE}" ${o(2)}/><circle cx="${-H * .022}" cy="${-H * .9}" r="${H * .015}" fill="${INK}"/><circle cx="${H * .022}" cy="${-H * .9}" r="${H * .015}" fill="${INK}"/><path d="M${-H * .02},${-H * .85} l${H * .04},0" stroke="${INK}" stroke-width="2" stroke-dasharray="2 2"/></g>`;
}
export const pumpkin = (x, y, r, lit = true) => `<ellipse cx="${x}" cy="${y - r * .8}" rx="${r}" ry="${r * .8}" fill="${ORANGE}" ${o(2)}/><path d="M${x - r * .4},${y - r * 1.5} Q${x - r * .55},${y - r * .8} ${x - r * .4},${y - r * .1} M${x + r * .4},${y - r * 1.5} Q${x + r * .55},${y - r * .8} ${x + r * .4},${y - r * .1}" fill="none" stroke="#B4561B" stroke-width="1.6"/><path d="M${x},${y - r * 1.6} l${r * .1},${-r * .3}" stroke="#3F5A35" stroke-width="${r * .18}"/>${lit ? `<path d="M${x - r * .5},${y - r * .95} l${r * .2},${-r * .22} l${r * .15},${r * .22} Z M${x + r * .5},${y - r * .95} l${-r * .2},${-r * .22} l${-r * .15},${r * .22} Z M${x - r * .5},${y - r * .55} Q${x},${y - r * .2} ${x + r * .5},${y - r * .55} Q${x},${y - r * .4} ${x - r * .5},${y - r * .55} Z" fill="#FFD36B"/>` : ""}`;

// ---------- 1) Verandakamera: das siebte Skelett ----------
// inch = Körpergröße des Täters, shoe = Schuhmodell, stamp = Zeitstempel „21:27:44“
export function porchCam(en, inch, shoe, stamp) {
  const D = defs(), W = 640, Hh = 400, F = 352, post = 470;
  const ticks = []; for (let i = 48; i <= 78; i++) ticks.push(i);
  const marks = ticks.map((i) => `<path d="M${post - (i % 6 ? 5 : 12)},${F - i * PX} L${post + (i % 6 ? 5 : 12)},${F - i * PX}" stroke="${INK}" stroke-width="${i % 6 ? 1.2 : 2.4}"/>${i % 6 ? "" : T(post + 15, F - i * PX + 4, ftin(i), 11, 700, INK, "start")}`).join("");
  const svg = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(en ? `Porch camera ${stamp}: three decoration skeletons and a fourth skeleton figure next to the measuring post` : `Verandakamera ${stamp}: drei Deko-Skelette und eine vierte Skelettgestalt neben dem Messpfosten`)}" style="width:100%;display:block;background:${NIGHT}">${D.svg}
<defs><radialGradient id="vg${D.id}" cx="50%" cy="50%" r="70%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".85"/></radialGradient><radialGradient id="lp${D.id}" cx="40%" cy="20%" r="70%"><stop offset="0%" stop-color="#F2A65A" stop-opacity=".55"/><stop offset="100%" stop-color="#F2A65A" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${F}" fill="${VIOLET}"/><rect x="0" y="60" width="${W}" height="${F - 60}" fill="#4A3B33" ${o(2)}/>${[...Array(9)].map((_, i) => `<path d="M0,${80 + i * 30} L${W},${80 + i * 30}" stroke="#2E2420" stroke-width="2"/>`).join("")}
<rect x="60" y="120" width="96" height="${F - 120}" fill="#2B1E1A" ${o(3)}/><circle cx="140" cy="240" r="4" fill="#E9B44C"/><rect x="72" y="134" width="72" height="60" fill="#E7B66B" opacity=".55" ${o(2)}/>
<rect width="${W}" height="${Hh}" fill="url(#lp${D.id})"/>
<path d="M0,60 L${W},60 L${W},44 L0,44 Z" fill="#2A2026" ${o(2)}/>${[...Array(12)].map((_, i) => `<circle cx="${30 + i * 52}" cy="${52 + (i % 2) * 6}" r="5" fill="${i % 3 === 0 ? ORANGE : i % 3 === 1 ? "#9B6BD6" : "#7FD36B"}" ${o(1.2)}/>`).join("")}
<rect x="${post - 9}" y="60" width="18" height="${F - 60}" fill="#E9E1CF" ${o(2.4)}/>${marks}
<g transform="translate(${post + 26},${F - 268}) rotate(4)"><rect width="92" height="50" fill="${ORANGE}" ${o(2)}/>${T(46, 18, "YOU MUST BE", 10, 800)}${T(46, 32, "THIS TALL", 13, 800)}${T(46, 44, "TO BE SCARED", 9, 700)}</g>
<g transform="translate(176,${F})"><path d="M16,-44 L34,-118 L136,-118 L128,-44 Z" fill="#3A2420" ${o(2.4)}/><path d="M40,-104 L130,-104" stroke="#5A3A30" stroke-width="2"/><path d="M26,-44 Q28,-62 46,-64 Q64,-62 66,-44 Z" fill="${ORANGE}" ${o(2)}/><ellipse cx="46" cy="-74" rx="10" ry="12" fill="${SKIN}" ${o(2)}/><path d="M36,-78 Q36,-90 46,-90 Q56,-90 56,-78 Q52,-84 46,-84 Q40,-84 36,-78 Z" fill="#C9C4BA" ${o(1.2)}/><path d="M64,-50 L78,-74" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M64,-50 L78,-74" stroke="${ORANGE}" stroke-width="5" stroke-linecap="round"/><rect x="72" y="-92" width="12" height="15" rx="2" fill="#B5462A" ${o(1.6)}/><path d="M0,0 L18,-44 L130,-44 L150,0 Z" fill="#2B1E1A" ${o(2.4)}/><path d="M18,-44 L130,-44 L128,-39 L20,-39 Z" fill="#7A1F2B"/>${T(76, -16, "R.I.P.", 11, 800, BONE)}</g>
${deco(70, 362, F, 1)}${deco(70, 600, F, 2)}${deco(70, 115, F + 6, 0)}
${person("anzug", inch, shoe, 425, F)}
${pumpkin(330, F + 4, 18)}${pumpkin(560, F + 6, 14)}${pumpkin(30, F + 8, 16, false)}
<rect x="0" y="${F}" width="${W}" height="${Hh - F}" fill="#3A2E2A"/><path d="M0,${F} L${W},${F}" ${o(3)}/>
<g filter="${D.blur}" opacity=".45">${[...Array(10)].map((_, i) => `<ellipse cx="${i * 72}" cy="${F + 22}" rx="70" ry="12" fill="#CFC8DA"/>`).join("")}</g>
<rect width="${W}" height="${Hh}" fill="${D.dots}" opacity=".16"/><rect width="${W}" height="${Hh}" fill="url(#vg${D.id})"/>
<rect x="12" y="12" width="300" height="24" fill="#000" opacity=".55"/>${T(20, 29, `DOYLE · PORCH CAM · 10/31/2026 ${stamp}`, 12, 600, "#F2F2F2", "start")}
<circle cx="${W - 54}" cy="24" r="6" fill="${RED}"/>${T(W - 20, 29, "REC", 12, 700, "#F2F2F2", "end")}
<rect x="${W - 120}" y="${Hh - 34}" width="108" height="22" fill="#000" opacity=".55"/>${T(W - 66, Hh - 18, "MOTION · PORCH", 11, 600, "#F2F2F2")}
</svg>`;
  return pic(svg, en ? "Porch camera – tap to enlarge" : "Verandakamera – antippen zum Vergrößern");
}

// ---------- 2) Gruppenfoto vom Kostümwettbewerb vor der „Lineup“-Fotowand ----------
// people: [{ name, costume, inch, shoe }] in Reihenfolge
export function lineup(en, people) {
  const D = defs(), W = 760, Hh = 420, F = 360;
  const xs = people.map((_, i) => 110 + i * 135);
  const lines = []; for (let i = 48; i <= 84; i += 1) lines.push(i);
  const grid = lines.map((i) => `<path d="M40,${F - i * PX} L${W - 40},${F - i * PX}" stroke="${INK}" stroke-width="${i % 6 ? .7 : 2.2}" opacity="${i % 6 ? .35 : .8}"/>${i % 6 ? "" : T(46, F - i * PX - 3, ftin(i), 12, 800, INK, "start") + T(W - 46, F - i * PX - 3, ftin(i), 12, 800, INK, "end")}`).join("");
  const sc = (W - 56) / W, zy = 14 + Hh * sc + 70, ZH = 0;   // ohne Schuh-Ausschnitte (Martin 13.10.: verrät den Hinweis, man zoomt selbst)
  const svg = `<svg viewBox="0 0 ${W} ${zy + ZH + 30}" role="img" aria-label="${esc(en ? "Costume contest photo in front of a lineup wall with height lines" : "Foto vom Kostümwettbewerb vor einer Fotowand mit Größenlinien")}" style="width:100%;display:block;background:#2A2530">${D.svg}
<g transform="translate(14,10)"><rect width="${W - 28}" height="${zy + ZH + 10}" fill="#F5F1E6" ${o(2)}/>
<defs><clipPath id="lc${D.id}"><rect width="${W}" height="${Hh}"/></clipPath></defs><g transform="translate(14,14) scale(${((W - 56) / W).toFixed(4)})" clip-path="url(#lc${D.id})">
<rect width="${W}" height="${Hh}" fill="${VIOLET}"/><rect x="30" y="20" width="${W - 60}" height="${F - 20}" fill="#B9B4AA" ${o(3)}/>${grid}
<rect x="${W / 2 - 150}" y="30" width="300" height="34" fill="${INK}"/>${T(W / 2, 53, "HOLLOW LANE P.D. · LINEUP", 17, 800, ORANGE)}
${people.map((p, i) => person(p.costume, p.inch, p.shoe, xs[i], F)).join("")}
<rect x="0" y="${F}" width="${W}" height="${Hh - F}" fill="#5B5550"/><path d="M0,${F} L${W},${F}" ${o(3)}/>
${pumpkin(22, F + 34, 16)}${pumpkin(W - 22, F + 36, 18)}<rect width="${W}" height="${Hh}" fill="${D.dots}" opacity=".08"/>
</g>
${people.map((p, i) => `<text x="${14 + (xs[i] / W) * (W - 56)}" y="${14 + Hh * (W - 56) / W + 28}" text-anchor="middle" ${HAND} font-size="25" fill="#2B2B6B">${esc(p.name)}</text>`).join("")}
<text x="${(W - 28) / 2}" y="${14 + Hh * (W - 56) / W + 58}" text-anchor="middle" ${HAND} font-size="26" fill="#2B2B6B">${esc(en ? "Costume Contest – Hollow Lane, 20:30" : "Kostümwettbewerb – Hollow Lane, 20:30")}</text>
</g></svg>`;
  return pic(svg, en ? "Contest photo – tap to enlarge" : "Wettbewerbsfoto – antippen zum Vergrößern");
}

// ---------- 3) Gartenplan mit Bewegungszonen der drei Nachbarkameras ----------
export const ITEM_POS = { 1: [114, 384], 2: [55, 387], 3: [210, 321], 4: [260, 386], 5: [303, 335], 6: [42, 333], 7: [54, 246], 8: [389, 289], 9: [185, 178], 10: [452, 205], 11: [292, 178], 12: [482, 392] };   // Abstand zu jeder Zonengrenze ≥ 5° (Nachtest 13.10.)
export const CAMS = { A: [90, 520, -68], B: [260, 520, -90], C: [430, 520, -112] };
export const ZONE = { half: 20, r: 300 };
// Liegt ein Punkt in der Bewegungszone (Kreissektor) einer Kamera?
export function inZone([x, y], [cx, cy, a]) {
  const r = Math.hypot(x - cx, y - cy); if (r > ZONE.r) return false;
  const ang = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
  return Math.abs(((ang - a + 540) % 360) - 180) <= ZONE.half;
}
// Winkelabstand eines Punkts zur nächsten Zonengrenze (für das Prüfskript)
export function zoneMargin([x, y]) {
  return Math.min(...Object.values(CAMS).map(([cx, cy, a]) => { const ang = Math.atan2(y - cy, x - cx) * 180 / Math.PI, d = Math.abs(((ang - a + 540) % 360) - 180), r = Math.hypot(x - cx, y - cy); return Math.min(Math.abs(d - ZONE.half), d < ZONE.half ? Math.abs(r - ZONE.r) / 8 : 99); }));
}
export const zonesOf = (n) => Object.keys(CAMS).filter((k) => inZone(ITEM_POS[n], CAMS[k])).join("");
export function plan(en, names, skel) {
  const W = 760, Hh = 580, D = defs(), L = (d, e) => (en ? e : d);
  const sector = ([x, y, a], col, l) => { const p = (d, r = ZONE.r) => [x + Math.cos((a + d) * Math.PI / 180) * r, y + Math.sin((a + d) * Math.PI / 180) * r].map((v) => v.toFixed(1)).join(","); const [lx, ly] = p(0, 92).split(","); return `<path d="M${x},${y} L${p(-ZONE.half)} A${ZONE.r},${ZONE.r} 0 0 1 ${p(ZONE.half)} Z" fill="${col}" opacity=".13"/><path d="M${x},${y} L${p(-ZONE.half)} A${ZONE.r},${ZONE.r} 0 0 1 ${p(ZONE.half)} Z" fill="none" stroke="${col}" stroke-width="2.4" stroke-dasharray="7 4"/><circle cx="${lx}" cy="${ly}" r="10" fill="${col}"/>${T(+lx, +ly + 4.5, l, 12, 800, "#fff")}`; };
  const ZC = { A: "#2E6FD6", B: "#1E8A4A", C: "#C8342A" };
  const icon = (n, [x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${PAPER}" ${o(2.4)}/>${T(x, y + 5, String(n), 13, 800)}`;
  const ids = Object.keys(ITEM_POS).map(Number);
  const svg = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(L("Gartenplan mit nummerierter Deko und den Bewegungszonen der Kameras A, B und C", "Yard plan with numbered decorations and the motion zones of cameras A, B and C"))}" style="width:100%;display:block;background:${PAPER}">${D.svg}
<rect x="6" y="6" width="${W - 12}" height="${Hh - 12}" fill="${PAPER}" ${o(3)}/>
${T(26, 40, "14 HOLLOW LANE · DOYLE", 18, 800, INK, "start")}${T(26, 60, L("Garten mit Halloween-Deko · Plan der Jury", "Yard with Halloween decorations · judges’ plan"), 12, 500, MUTED, "start")}
<rect x="26" y="205" width="380" height="195" fill="#B9C79A" opacity=".6" ${o(2)}/>
<path d="M235,200 L235,400" stroke="#CFC6B6" stroke-width="22"/>
<rect x="80" y="80" width="300" height="70" fill="${CARD}" ${o(3)}/>${T(230, 122, L("HAUS", "HOUSE"), 16, 800)}
<rect x="110" y="150" width="250" height="50" fill="#D9C9A8" ${o(2.4)}/>${T(235, 196, L("Veranda", "Porch"), 10, 600, MUTED)}
<rect x="410" y="80" width="96" height="100" fill="${CARD}" ${o(3)}/>${T(458, 134, L("GARAGE", "GARAGE"), 12, 800)}
<rect x="418" y="180" width="80" height="220" fill="#CFC6B6" ${o(2)}/>${T(458, 300, L("Einfahrt", "Driveway"), 10, 600, MUTED)}
<rect x="20" y="400" width="500" height="22" fill="#D6D0C4" ${o(2)}/>${T(270, 415, L("Gehsteig", "Sidewalk"), 10, 600, MUTED)}
<rect x="20" y="422" width="500" height="70" fill="#8F8B84"/>${T(300, 470, "HOLLOW LANE", 14, 800, PAPER)}<path d="M30,457 L520,457" stroke="${PAPER}" stroke-width="2" stroke-dasharray="14 10" opacity=".7"/>
${[13, 15, 17].map((n, i) => `<rect x="${[90, 260, 430][i] - 50}" y="510" width="100" height="44" fill="${CARD}" ${o(2)}/>${T([90, 260, 430][i], 548, L("Nr. ", "No. ") + n, 10, 700, MUTED)}`).join("")}
${Object.entries(CAMS).map(([l, c]) => sector(c, ZC[l], l)).join("")}
${Object.entries(CAMS).map(([l, [x, y]]) => `<rect x="${x - 11}" y="${y - 7}" width="22" height="14" rx="3" fill="${INK}"/><circle cx="${x}" cy="${y}" r="3.5" fill="${ZC[l]}"/>${T(x + 16, y + 4, L("Kamera ", "Camera ") + l, 11, 800, ZC[l], "start")}`).join("")}
${skel.map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="8" fill="${BONE}" ${o(1.8)}/><circle cx="${x - 2.6}" cy="${y - 1}" r="1.6" fill="${INK}"/><circle cx="${x + 2.6}" cy="${y - 1}" r="1.6" fill="${INK}"/></g>`).join("")}
${ids.map((n) => icon(n, ITEM_POS[n])).join("")}
<g transform="translate(540,80)"><rect width="200" height="${ids.length * 19 + 96}" fill="#fff" ${o(1.6)}/>${T(12, 22, L("Deko", "Decorations"), 12, 800, INK, "start")}${ids.map((n, i) => T(12, 44 + i * 19, `${n}  ${names[n]}`, 11, 500, INK, "start")).join("")}<circle cx="20" cy="${ids.length * 19 + 52}" r="7" fill="${BONE}" ${o(1.6)}/>${T(34, ids.length * 19 + 56, L("Deko-Skelett", "Decoration skeleton"), 11, 500, INK, "start")}<path d="M12,${ids.length * 19 + 74} l16,0" stroke="${INK}" stroke-width="2" stroke-dasharray="7 4"/>${T(34, ids.length * 19 + 78, L("Bewegungszone je Kamera", "Motion zone per camera"), 11, 500, INK, "start")}</g>
</svg>`;
  return pic(svg, L("Gartenplan – antippen zum Vergrößern", "Yard plan – tap to enlarge"));
}

// ---------- 4) Candy-Code: Tafel (Polybios-Quadrat) und Franks verschlüsselte Notiz ----------
export const GRID = ["ABCDE", "FGHIK", "LMNOP", "QRSTU", "VWXYZ"];   // J wie I
const CANDY = [
  (s) => `<path d="M0,${-s} L${s * .8},${s * .8} L${-s * .8},${s * .8} Z" fill="#F4F0E2" ${o(1.6)}/><path d="M${-s * .44},${s * .1} L${s * .44},${s * .1} L${s * .8},${s * .8} L${-s * .8},${s * .8} Z" fill="#F2B33D"/><path d="M${-s * .8},${s * .8} L${-s * .55},${s * .45} L${s * .55},${s * .45} L${s * .8},${s * .8} Z" fill="${ORANGE}"/><path d="M0,${-s} L${s * .8},${s * .8} L${-s * .8},${s * .8} Z" fill="none" ${o(1.6)}/>`,   // Candy Corn
  (s) => `<path d="M0,${s * .3} L0,${s * 1.1}" stroke="#EDE6D3" stroke-width="${s * .22}"/><path d="M0,${s * .3} L0,${s * 1.1}" fill="none" ${o(1)}/><circle cx="0" cy="${-s * .2}" r="${s * .7}" fill="#D44C8A" ${o(1.6)}/><path d="M0,${-s * .2} m${-s * .45},0 a${s * .45},${s * .45} 0 1,1 ${s * .45},${s * .45} a${s * .3},${s * .3} 0 1,1 ${-s * .1},${-s * .55}" fill="none" stroke="#FCE7F1" stroke-width="${s * .14}"/>`,   // Lolli
  (s) => `<path d="M${-s * .55},0 L${-s * 1.05},${-s * .45} L${-s * 1.05},${s * .45} Z M${s * .55},0 L${s * 1.05},${-s * .45} L${s * 1.05},${s * .45} Z" fill="#7A3FB0" ${o(1.4)}/><ellipse cx="0" cy="0" rx="${s * .6}" ry="${s * .45}" fill="#9B6BD6" ${o(1.6)}/><path d="M${-s * .25},${-s * .2} q${s * .2},${s * .2} ${s * .45},0" fill="none" stroke="#E7DAF6" stroke-width="${s * .1}"/>`,   // Bonbon
  (s) => `<rect x="${-s * .9}" y="${-s * .5}" width="${s * 1.8}" height="${s}" rx="${s * .12}" fill="#5A3826" ${o(1.6)}/><path d="M${-s * .3},${-s * .5} L${-s * .3},${s * .5} M${s * .3},${-s * .5} L${s * .3},${s * .5} M${-s * .9},0 L${s * .9},0" stroke="#3A2418" stroke-width="${s * .08}"/><path d="M${s * .2},${-s * .5} L${s * .9},${-s * .5} L${s * .9},${s * .5} L${s * .45},${s * .5} Z" fill="#C8342A" opacity=".9"/>`,   // Schokoriegel
  (s) => `<path d="M${-s},${s * .3} Q${-s * .5},${-s * .7} 0,0 T${s},${-s * .2}" fill="none" stroke="${INK}" stroke-width="${s * .5}" stroke-linecap="round"/><path d="M${-s},${s * .3} Q${-s * .5},${-s * .7} 0,0" fill="none" stroke="#7FD36B" stroke-width="${s * .36}" stroke-linecap="round"/><path d="M0,0 T${s},${-s * .2}" fill="none" stroke="#F2B33D" stroke-width="${s * .36}" stroke-linecap="round"/>`,   // Gummiwurm
];
export const candy = (i, x, y, s = 14) => `<g transform="translate(${x},${y})">${CANDY[i](s)}</g>`;
export function codeOf(word) { const out = []; for (const ch of word.toUpperCase().replace(/J/g, "I")) { const r = GRID.findIndex((g) => g.includes(ch)); out.push([r, GRID[r].indexOf(ch)]); } return out; }
export function candyGrid(en) {
  const D = defs(), W = 460, cell = 60, x0 = 110, y0 = 120;
  const svg = `<svg viewBox="0 0 ${W} ${y0 + cell * 5 + 50}" role="img" aria-label="${esc(en ? "Candy Code key: a 5 by 5 grid of letters, rows and columns marked with candies" : "Candy-Code-Tafel: ein Raster aus 5 mal 5 Buchstaben, Zeilen und Spalten mit Süßigkeiten markiert")}" style="width:100%;display:block;background:${ORANGE}">${D.svg}
<rect width="${W}" height="${y0 + cell * 5 + 50}" fill="${D.dots}" opacity=".35"/>
<rect x="20" y="16" width="${W - 40}" height="${y0 + cell * 5 + 18}" fill="#FFF8E8" ${o(2.4)}/>
${T(W / 2, 48, "CANDY CODE", 24, 800, INK)}${T(W / 2, 70, en ? "Hollow Lane Kids’ Scavenger Hunt · Key" : "Schnitzeljagd der Hollow-Lane-Kids · Schlüssel", 12, 600, MUTED)}
${[0, 1, 2, 3, 4].map((i) => candy(i, x0 + cell * i + cell / 2, y0 - 20)).join("")}
${[0, 1, 2, 3, 4].map((i) => candy(i, x0 - 34, y0 + cell * i + cell / 2)).join("")}
${GRID.map((row, r) => [...row].map((ch, c) => `<rect x="${x0 + c * cell}" y="${y0 + r * cell}" width="${cell}" height="${cell}" fill="${(r + c) % 2 ? "#FFF8E8" : "#F6E7C8"}" ${o(1.6)}/>${T(x0 + c * cell + cell / 2, y0 + r * cell + cell / 2 + 9, ch === "I" ? "I/J" : ch, ch === "I" ? 20 : 26, 800, INK)}`).join("")).join("")}
<text x="${W / 2}" y="${y0 + cell * 5 + 26}" text-anchor="middle" ${HAND} font-size="20" fill="${RED}">${esc(en ? "1st candy = row ↓  ·  2nd candy = column →" : "1. Süßigkeit = Zeile ↓  ·  2. Süßigkeit = Spalte →")}</text>
</svg>`;
  return pic(svg, en ? "Candy Code key – tap to enlarge" : "Candy-Code-Tafel – antippen zum Vergrößern");
}
export function candyNote(en, word) {
  const D = defs(), pairs = codeOf(word), per = 5, rows = Math.ceil(pairs.length / per), W = 520, rh = 64;
  const H = 120 + rows * rh + 40;
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Frank’s notepad page with candy symbols in pairs" : "Franks Notizblock mit Süßigkeiten-Symbolen in Paaren")}" style="width:100%;display:block;background:#2A2530">${D.svg}
<g transform="rotate(-1.5 ${W / 2} ${H / 2})"><rect x="24" y="16" width="${W - 48}" height="${H - 32}" fill="#FFFDF4" ${o(2)}/>${[...Array(Math.floor((H - 60) / 26))].map((_, i) => `<path d="M24,${70 + i * 26} L${W - 24},${70 + i * 26}" stroke="#BFD3E6" stroke-width="1"/>`).join("")}<path d="M70,16 L70,${H - 16}" stroke="#E8A0A0" stroke-width="1.4"/>
<text x="84" y="58" ${HAND} font-size="26" fill="#1F2A6B">${esc(en ? "Announce at 22:00:" : "Um 22:00 verkünden:")}</text>
${pairs.map(([r, c], i) => { const x = 110 + (i % per) * 80, y = 104 + Math.floor(i / per) * rh; return `<rect x="${x - 34}" y="${y - 22}" width="68" height="44" rx="8" fill="none" stroke="#1F2A6B" stroke-width="1.6" stroke-dasharray="3 3"/>${candy(r, x - 16, y)}${candy(c, x + 16, y)}`; }).join("")}
<text x="${W - 50}" y="${H - 30}" text-anchor="end" ${HAND} font-size="22" fill="#1F2A6B">– F. D.</text></g>
</svg>`;
  return pic(svg, en ? "Frank’s note – tap to enlarge" : "Franks Notiz – antippen zum Vergrößern");
}
