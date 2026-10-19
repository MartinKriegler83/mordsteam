// Gratis-Bonus-Rätsel auf der Specials-Seite (19.10.2026, Martin: „baue 1 und 2“): zwei kurze Rätsel aus der Hollow Lane,
// NICHT Teil des Halloween-Falls (eigene Szene, eigene Personen, eigenes Wort – verrät keine Lösung) – sie zeigen nur,
// welche Art Rätsel im Fall wartet. Rätsel 1 „Wer steckt im Anzug?“ (Bild: Schuhe + Messlatte), Rätsel 2 „Mias Candy-Code“.
// Bilder aus lib/art (gleicher Stil wie die Akte), fest in site/specials.html und site/en/specials.html geschrieben –
// zwischen <!-- bonus --> und <!-- /bonus -->, vor dem Teaser-Video. Bedienung: site/assets/bonus.js, Zählung im Trichter (bz1–bz3).
// Aufruf: node tools/bonus_raetsel.mjs (idempotent; läuft auch am Ende von tools/en_pages.py)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { deco, person, pumpkin, candy, GRID, PX, ORANGE, VIOLET, NIGHT } from "../lib/art/special001.js";
import { o, T, esc, defs, INK, RED, MUTED } from "../lib/art/gn.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
const HAND = `font-family="Caveat, Segoe Print, Bradley Hand, cursive" font-weight="600"`;
const ftin = (i) => `${Math.floor(i / 12)}'${i % 12 ? (i % 12) + '"' : ""}`;
const hit = (key, x0, y0, w, h, label) => `<g class="bz-hit" data-pick="${key}" tabindex="0" role="button" aria-label="${esc(label)}"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#fff" fill-opacity="0"/>`;

// ---------- Rätsel 1, Schritt 1: Hanks Verandakamera, vier Skelette – eines ist ein Mensch ----------
// Lösung: Figur „c“ (Anzug, schwarze Sneaker, 72 Zoll = 6 Fuß)
export const SUIT = { inch: 72, shoe: "schwarz" };
function porch(en, crop = false) {
  const D = defs(), W = 640, Hh = 400, F = 352, post = 478;
  const ticks = []; for (let i = 48; i <= 78; i++) ticks.push(i);
  const marks = ticks.map((i) => `<path d="M${post - (i % 6 ? 5 : 12)},${F - i * PX} L${post + (i % 6 ? 5 : 12)},${F - i * PX}" stroke="${INK}" stroke-width="${i % 6 ? 1.2 : 2.4}"/>${i % 6 ? "" : T(post + 15, F - i * PX + 5, ftin(i), crop ? 14 : 12, 800, "#F3EFE6", "start")}`).join("");
  const fig = [
    ["a", 110, deco(68, 110, F + 4, 0)],
    ["b", 255, deco(74, 255, F, 1)],
    ["c", 420, person("anzug", SUIT.inch, SUIT.shoe, 420, F)],
    ["d", 585, deco(70, 585, F + 2, 2)],
  ];
  const lab = (k) => (en ? `Skeleton ${"ABCD"["abcd".indexOf(k)]}` : `Skelett ${"ABCD"["abcd".indexOf(k)]}`);
  if (crop) fig.splice(0, fig.length, fig[2]);
  return `<svg viewBox="${crop ? "372 128 150 232" : `0 0 ${W} ${Hh}`}" role="img" aria-label="${esc(crop ? (en ? "Close-up: the skeleton suit next to the measuring post" : "Ausschnitt: der Skelett-Anzug neben der Messlatte") : en ? "Hank's porch camera: four skeletons, one next to a measuring post" : "Hanks Verandakamera: vier Skelette, eines neben einem Messpfosten")}" style="width:100%;display:block;background:${NIGHT}">${D.svg.replace(/id="(\w+?)(\d+)"/g, 'id="bz-$1$2"').replace(/url\(#(\w+?)(\d+)\)/g, "url(#bz-$1$2)")}
<rect width="${W}" height="${F}" fill="#120E18"/><rect x="0" y="60" width="${W}" height="${F - 60}" fill="#0F0C12" ${o(2)}/>${[...Array(9)].map((_, i) => `<path d="M0,${80 + i * 30} L${W},${80 + i * 30}" stroke="#1C1722" stroke-width="2"/>`).join("")}
<rect x="300" y="110" width="90" height="${F - 110}" fill="#0B090D" ${o(3)}/><rect x="312" y="124" width="66" height="56" fill="#E7B66B" opacity=".22" ${o(2)}/><circle cx="378" cy="238" r="4" fill="#E9B44C"/>
<rect x="0" y="${F - 16}" width="${W}" height="16" fill="#8A776A" ${o(2)}/>
<path d="M0,60 L${W},60 L${W},44 L0,44 Z" fill="#2A2026" ${o(2)}/>${[...Array(12)].map((_, i) => `<circle cx="${30 + i * 52}" cy="${52 + (i % 2) * 6}" r="5" fill="${i % 3 === 0 ? ORANGE : i % 3 === 1 ? "#9B6BD6" : "#7FD36B"}" ${o(1.2)}/>`).join("")}
<rect x="${post - 9}" y="60" width="18" height="${F - 60}" fill="#E9E1CF" ${o(2.4)}/>${marks}
<g transform="translate(${post + 30},${F - 262}) rotate(-3)"><rect width="92" height="44" fill="${ORANGE}" ${o(2)}/>${T(46, 19, "HANK'S", 12, 800)}${T(46, 36, "HAUNTED PORCH", 10, 800)}</g>
${fig.map(([k, x, svg]) => crop ? svg : `${hit(k, x - 48, 120, 96, F - 100, lab(k))}${svg}</g>`).join("\n")}
${pumpkin(180, F + 4, 16)}${pumpkin(520, F + 6, 14)}${pumpkin(30, F + 8, 16, false)}
<rect x="0" y="${F}" width="${W}" height="${Hh - F}" fill="#8A776A"/><path d="M0,${F} L${W},${F}" ${o(3)}/>
<rect width="${W}" height="${Hh}" fill="#0A0810" opacity=".38" pointer-events="none"/><rect width="${W}" height="${Hh}" fill="url(#bz-d${D.id})" opacity=".14" pointer-events="none"/>
<rect x="12" y="12" width="280" height="24" fill="#000" opacity=".55"/>${T(20, 29, "HANK · PORCH CAM · 10/31/2026 20:52:10", 12, 600, "#F2F2F2", "start")}
<circle cx="${W - 54}" cy="24" r="6" fill="${RED}"/>${T(W - 20, 29, "REC", 12, 700, "#F2F2F2", "end")}
</svg>`;
}

// ---------- Rätsel 1, Schritt 2: Foto von Hanks Kürbis-Party vor einer Wand mit Größenlinien ----------
// Lösung: Josh (schwarze Sneaker, 72 Zoll). Marty: gleiche Schuhe, kleiner. Nell: gleich groß, andere Schuhe.
export const PARTY = [
  { key: "bea", name: "Bea", costume: "hexe", inch: 64, shoe: "weiss" },
  { key: "marty", name: "Marty", costume: "sense", inch: 66, shoe: "schwarz" },
  { key: "josh", name: "Josh", costume: "vampir", inch: 72, shoe: "schwarz" },
  { key: "nell", name: "Nell", costume: "werwolf", inch: 72, shoe: "weiss" },
];
function party(en) {
  const D = defs(), W = 700, Hh = 420, F = 360, xs = PARTY.map((_, i) => 130 + i * 147);
  const lines = []; for (let i = 48; i <= 84; i++) lines.push(i);
  const grid = lines.map((i) => `<path d="M40,${F - i * PX} L${W - 40},${F - i * PX}" stroke="${INK}" stroke-width="${i % 6 ? .7 : 2.2}" opacity="${i % 6 ? .35 : .8}"/>${i % 6 ? "" : T(48, F - i * PX - 3, ftin(i), 15, 800, INK, "start") + T(W - 48, F - i * PX - 3, ftin(i), 15, 800, INK, "end")}`).join("");
  return `<svg viewBox="40 128 ${W - 80} ${Hh + 70 - 128}" role="img" aria-label="${esc(en ? "Photo from Hank's pumpkin party: Bea, Marty, Josh and Nell in costume in front of a wall with height lines" : "Foto von Hanks Kürbis-Party: Bea, Marty, Josh und Nell im Kostüm vor einer Wand mit Größenlinien")}" style="width:100%;display:block;background:#F5F1E6">${D.svg.replace(/id="(\w+?)(\d+)"/g, 'id="bz-$1$2"').replace(/url\(#(\w+?)(\d+)\)/g, "url(#bz-$1$2)")}
<rect width="${W}" height="${Hh}" fill="${VIOLET}"/><rect x="30" y="20" width="${W - 60}" height="${F - 20}" fill="#B9B4AA" ${o(3)}/>${grid}

${PARTY.map((p, i) => `${hit(p.key, xs[i] - 62, 60, 124, Hh + 10, p.name)}${person(p.costume, p.inch, p.shoe, xs[i], F)}</g>`).join("\n")}
<rect x="0" y="${F}" width="${W}" height="${Hh - F}" fill="#5B5550" pointer-events="none"/><path d="M0,${F} L${W},${F}" ${o(3)}/>
${pumpkin(22, F + 34, 16)}${pumpkin(W - 22, F + 36, 18)}
${PARTY.map((p, i) => `<text x="${xs[i]}" y="${Hh + 36}" text-anchor="middle" ${HAND} font-size="28" fill="#2B2B6B" pointer-events="none">${esc(p.name)}</text>`).join("")}
<text x="${W / 2}" y="${Hh + 62}" text-anchor="middle" ${HAND} font-size="20" fill="#2B2B6B" pointer-events="none">${esc(en ? "Hank's party, 20:00 – nobody changed shoes" : "Hanks Party, 20:00 – Schuhe hat niemand gewechselt")}</text>
</svg>`;
}

// ---------- Rätsel 2: Mias Candy-Code (vollständige Tafel, Regel lesbar – anders als im Fall) ----------
export const WORD = { de: "BUH", en: "BOO" };
const codeOf = (w) => [...w].map((ch) => { const r = GRID.findIndex((g) => g.includes(ch)); return [r, GRID[r].indexOf(ch)]; });
function note(en) {
  const pairs = codeOf(WORD[en ? "en" : "de"]), W = 420, H = 190;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(en ? "Mia's note: three candy pairs" : "Mias Zettel: drei Süßigkeiten-Paare")}" style="width:100%;display:block;background:transparent">
<g transform="rotate(-1.5 ${W / 2} ${H / 2})"><rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="#FFF3C9" ${o(2)}/>
<text x="34" y="52" ${HAND} font-size="27" fill="#2A5DB0">${esc(en ? "For Hank! – Mia (8)" : "Für Hank! – Mia (8)")}</text>
${pairs.map(([r, c], i) => { const x = 95 + i * 115, y = 118; return `<rect x="${x - 40}" y="${y - 26}" width="80" height="52" rx="9" fill="#fff" stroke="${INK}" stroke-width="1.4"/>${candy(r, x - 19, y, 15)}${candy(c, x + 19, y, 15)}`; }).join("")}
</g></svg>`;
}
function board(en) {
  const W = 420, cell = 62, x0 = 70, y0 = 78;
  return `<svg viewBox="0 0 ${W} ${y0 + cell * 5 + 44}" role="img" aria-label="${esc(en ? "Candy Code key: 5 by 5 letters, candies mark the rows on the left and the columns on top. Tap the letters." : "Candy-Code-Tafel: 5 mal 5 Buchstaben, Süßigkeiten markieren links die Zeilen und oben die Spalten. Buchstaben antippen.")}" style="width:100%;display:block;background:transparent">
<rect x="4" y="4" width="${W - 8}" height="${y0 + cell * 5 + 36}" fill="#FFF8E8" ${o(2.4)}/>
${T(W / 2, 32, "CANDY CODE", 20, 800, INK)}
${[0, 1, 2, 3, 4].map((i) => candy(i, x0 - 32, y0 + cell * i + cell / 2, 13) + candy(i, x0 + cell * i + cell / 2, y0 - 20, 13)).join("")}
${GRID.map((row, r) => [...row].map((ch, c) => `<g class="bz-cell" data-l="${ch}" tabindex="0" role="button" aria-label="${ch === "I" ? "I/J" : ch}"><rect x="${x0 + c * cell}" y="${y0 + r * cell}" width="${cell}" height="${cell}" fill="${(r + c) % 2 ? "#FFF8E8" : "#F6E7C8"}" ${o(1.6)}/>${T(x0 + c * cell + cell / 2, y0 + r * cell + cell / 2 + 9, ch === "I" ? "I/J" : ch, ch === "I" ? 19 : 25, 800, INK)}</g>`).join("")).join("")}
${T(W / 2, y0 + cell * 5 + 26, en ? "1st candy = row ↓  ·  2nd candy = column →" : "1. Süßigkeit = Zeile ↓  ·  2. Süßigkeit = Spalte →", 13, 700, RED)}
</svg>`;
}

// ---------- Texte ----------
const TX = {
  de: {
    aria: "Gratis-Rätsel", eyebrow: "Gratis-Rätsel · 2 Minuten · ohne Anmeldung",
    h2: "Nebenan bei Hank: Wer steckt im Anzug?",
    lead: "Ein kleiner Bonus-Fall aus der Hollow Lane – nicht Teil des Spiels, aber genau diese Art Rätsel wartet im echten Fall. Hank aus Nr. 18 hat drei Deko-Skelette gekauft. Auf seiner Verandakamera stehen vier.",
    s1: "<b>Schritt 1 von 2:</b> Es ist dunkel auf Hanks Veranda. Seine Deko-Skelette sind aus Kunststoff, mit Knochenfüßen. <b>Tipp auf das Skelett, das keines ist.</b>",
    s1wrong: "Das ist Kunststoff. Schau genau auf die Füße.", s1right: "Erwischt! Unter dem Anzug steckt ein Mensch – mit Turnschuhen.",
    s2: "<b>Schritt 2 von 2:</b> Diese vier waren vorher auf Hanks Party. Die Schuhe hat niemand gewechselt, und die Messlatte auf der Verandakamera zeigt die Größe. <b>Tipp an, wer es war.</b> Hut, Kapuze und Ohren zählen bei der Größe nicht.",
    shoeWrong: "Andere Schuhe – das kann nicht sein.", heightWrong: "Die Schuhe passen. Aber ist die Person so groß wie an der Messlatte?",
    right1: "Richtig: <b>Josh</b> – schwarze Sneaker, genau 6 Fuß. Genau solche Rätsel warten im echten Fall – nur kniffliger.",
    again: "Nochmal ansehen", more: "Noch eins? Mias Candy-Code knacken →",
    c1: "<b>Bonus-Rätsel 2:</b> Mia (8) hat Hank eine Nachricht hinterlassen – im Candy-Code der Hollow-Lane-Kids. Die erste Süßigkeit eines Paars nennt die Zeile, die zweite die Spalte. <b>Tipp die drei Buchstaben der Reihe nach an.</b>",
    yours: "Deine Lösung:", del: "Löschen", wrong2: "Das ergibt kein Wort aus Mias Zettel – nochmal von vorne.",
    right2: "<b>„BUH!“</b> – richtig. Im echten Fall ist die Tafel zerrissen, die Regel verwaschen und Franks Notiz viel länger. Schaffst du das in 50 Minuten?",
    buy: "Ganzen Fall kaufen – 8,90&nbsp;€", probe: "oder die erste Frage des echten Falls gratis spielen", buyHref: "solo-kaufen.html?fall=halloween", probeHref: "/spiel/solo.html?probe=special-001&amp;lang=de",
    hero: "Oder zuerst: Gratis-Rätsel in 2 Minuten ↓",
  },
  en: {
    aria: "Free puzzle", eyebrow: "Free puzzle · 2 minutes · no sign-up",
    h2: "Next door at Hank’s: who’s in the suit?",
    lead: "A little bonus mystery from Hollow Lane – not part of the game, but exactly the kind of puzzle waiting in the real case. Hank from no. 18 bought three decoration skeletons. His porch camera shows four.",
    s1: "<b>Step 1 of 2:</b> It’s dark on Hank’s porch. His decoration skeletons are plastic, with bone feet. <b>Tap the skeleton that isn’t one.</b>",
    s1wrong: "That’s plastic. Look closely at the feet.", s1right: "Got you! There’s a person in that suit – wearing sneakers.",
    s2: "<b>Step 2 of 2:</b> These four were at Hank’s party earlier. Nobody changed shoes, and the measuring post on the porch camera shows the height. <b>Tap who it was.</b> Hats, hoods and ears don’t count towards height.",
    shoeWrong: "Different shoes – can’t be.", heightWrong: "The shoes match. But is that person as tall as the measuring post shows?",
    right1: "Correct: <b>Josh</b> – black sneakers, exactly 6 feet. That’s the kind of puzzle waiting in the real case – only trickier.",
    again: "Look again", more: "One more? Crack Mia’s Candy Code →",
    c1: "<b>Bonus puzzle 2:</b> Mia (8) left Hank a message – in the Hollow Lane kids’ Candy Code. The first candy of a pair gives the row, the second the column. <b>Tap the three letters in order.</b>",
    yours: "Your answer:", del: "Clear", wrong2: "That doesn’t spell Mia’s message – start again.",
    right2: "<b>“BOO!”</b> – correct. In the real case the key is torn, the rule washed out and Frank’s note much longer. Can you crack it in 50 minutes?",
    buy: 'Buy the full case – <span data-eur="890">€8.90</span>', probe: "or play the real case’s first question free", buyHref: "solo-buy.html?fall=halloween", probeHref: "/spiel/solo.html?probe=special-001&amp;lang=en",
    hero: "Or first: a free 2-minute puzzle ↓",
  },
};

function block(en) {
  const X = TX[en ? "en" : "de"];
  return `<!-- bonus --><section id="raetsel" class="section bz" aria-label="${X.aria}" data-word="${WORD[en ? "en" : "de"]}"><div class="wrap">
<div class="eyebrow">${X.eyebrow}</div>
<h2 class="h2">${X.h2}</h2>
<p class="lead">${X.lead}</p>
<div class="bz-step" data-step="1"><p>${X.s1}</p><div class="bz-pic">${porch(en)}</div><p class="bz-msg" aria-live="polite" data-wrong="${esc(X.s1wrong)}" data-right="${esc(X.s1right)}"></p></div>
<div class="bz-step" data-step="2" hidden><p>${X.s2}</p><div class="bz-pic">${party(en)}</div><p class="bz-msg" aria-live="polite" data-shoe="${esc(X.shoeWrong)}" data-height="${esc(X.heightWrong)}"></p></div>
<div class="bz-done" data-done="1" hidden><p class="bz-ok">${X.right1}</p>
<div class="actions"><a class="btn btn-red" href="${X.buyHref}" data-fn="buy">${X.buy}</a></div><p class="small bz-probe"><a href="${X.probeHref}" data-fn="probe">${X.probe}</a></p>
<p><button type="button" class="bz-more">${X.more}</button></p></div>
<div class="bz-step" data-step="3" hidden><p>${X.c1}</p><div class="bz-candy"><div class="bz-pic">${note(en)}</div><div class="bz-pic">${board(en)}</div></div>
<p class="bz-ans"><span>${X.yours}</span> <b class="bz-word" aria-live="polite">_ _ _</b> <button type="button" class="bz-del">${X.del}</button></p><p class="bz-msg" aria-live="polite" data-wrong="${esc(X.wrong2)}"></p></div>
<div class="bz-done" data-done="2" hidden><p class="bz-ok">${X.right2}</p>
<div class="actions"><a class="btn btn-red" href="${X.buyHref}" data-fn="buy">${X.buy}</a></div><p class="small bz-probe"><a href="${X.probeHref}" data-fn="probe">${X.probe}</a></p></div>
</div></section><!-- /bonus -->
`;
}

for (const en of [false, true]) {
  const p = path.join(ROOT, en ? "en/specials.html" : "specials.html");
  let s = fs.readFileSync(p, "utf8");
  const b = block(en);
  if (s.includes("<!-- bonus -->")) s = s.replace(/<!-- bonus -->[\s\S]*?<!-- \/bonus -->\n?/, () => b);
  else {
    const i = s.indexOf('<section class="tvid-sec"');
    if (i < 0) throw new Error("Teaser-Abschnitt fehlt in " + p);
    s = s.slice(0, i) + b + s.slice(i);
  }
  // Hinweis im Hero unter der Probe-Notiz
  const X = TX[en ? "en" : "de"], hint = `<!-- bonus-link --><p class="small bz-hero"><a href="#raetsel">${X.hero}</a></p><!-- /bonus-link -->`;
  if (s.includes("<!-- bonus-link -->")) s = s.replace(/<!-- bonus-link -->[\s\S]*?<!-- \/bonus-link -->/, () => hint);
  else {
    const m = s.match(/<p class="small sp-probe-note">[\s\S]*?<\/p>/);
    if (!m) throw new Error("Probe-Notiz im Hero fehlt in " + p);
    s = s.replace(m[0], () => m[0] + "\n" + hint);
  }
  // Skript
  if (!s.includes("/assets/bonus.js")) s = s.replace("</body>", '<script src="/assets/bonus.js?v=1" defer></script>\n</body>');
  fs.writeFileSync(p, s);
  console.log("Bonus-Rätsel eingebaut:", path.relative(ROOT, p));
}
