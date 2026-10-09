// Bilder auf den Fallseiten der Website (Entscheidung 9.10.2026): je Fall eine breite Fotokarte unter den Beispiel-Notizen.
// Die Bilder kommen aus denselben Bild-Bausteinen wie im Spiel (lib/art), mit festen Beispieldaten (fester Zufallswert),
// und werden fest in die HTML-Seiten geschrieben – zwischen <!-- bild:… --> und <!-- /bild -->.
// Aufruf: node tools/site_bilder.mjs   (idempotent; erneut ausführen, wenn sich ein Bild-Baustein ändert)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as S1 from "../lib/cases/solo-001.js";
import * as S1E from "../lib/cases/solo-001-en.js";
import * as S2 from "../lib/cases/solo-002.js";
import * as S2E from "../lib/cases/solo-002-en.js";
import * as F from "../lib/cases/friends-001.js";
import * as FE from "../lib/cases/friends-001-en.js";
import { feuerwerk } from "../lib/art/soloplus.js";
import { COVERS } from "../lib/art/covers.js";
import { CASES, caseOf, buildVars, render, RULES } from "../lib/game.js";
import { normalizeVars } from "../lib/create.js";
import { randomCast } from "../lib/countries.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
// fester Zufall (mulberry32), damit die Seiten bei jedem Lauf gleich bleiben
const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const figs = (h) => h.match(/<figure class="gn-pic[\s\S]*?<\/figure>/g) || [];
const one = (h, what) => { const f = figs(h); if (!f.length) throw new Error("Kein Bild gefunden: " + what); return f; };

function solo001(en) { return one((en ? S1E : S1).docs("jonas", en ? "Alex" : "Martin", 0).find((d) => d.id === "kamera").html, "solo001")[0]; }
function solo002(en) { return one((en ? S2E : S2).docs("paul", en ? "Alex" : "Martin", 2).find((d) => d.id === "spuren").html, "solo002")[0]; }
function soloplus(en) {
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, T = 22 * 60 + 31;
  return feuerwerk(en, [[T - 3, "steg", ["leopold", "hanna"]], [T - 1, "totale", ["mirko"]], [T + 2, "glaeser", ["sabine"]]], fmt);
}
function friends(en) {
  const M = en ? FE : F, r = seeded(48), rnd = (n) => Math.floor(r() * n);
  const NAMES = en ? ["Emma", "Ben", "Chloe", "Dave", "Lucy"] : ["Anna", "Ben", "Clara", "David", "Eva"];
  const St = F.setup(5, rnd);
  const G = { players: NAMES.map((name, i) => ({ name, quirk: F.QUIRK_KEYS[i % F.QUIRK_KEYS.length], act: St.acts[i], room: St.rooms[i] })), culprit: St.culprit, decoy: St.decoy, tvar: 0, beer: St.beer, excuse: 0, plus: false };
  return one(M.docs(G, 0).find((d) => d.id === "karten").html, "friends")[0];
}
function teams(caseId, en, seed) {
  const r = seeded(seed), rnd = (n) => Math.floor(r() * n), lang = en ? "en" : "de", land = en ? "GB" : "AT";
  const C0 = CASES[caseId], cast = (C0.randomCast || randomCast)(land, lang, rnd);
  const vars = normalizeVars(caseId, { ...cast, LAND: land }, true, true, lang);
  const secrets = C0.makeSecrets(rnd, { premium: true, lang, land, feier: [vars.RAUM_FEIER, vars.FIRMA, vars.STADT, vars.PARK].filter(Boolean).join(" ") });
  const session = { case_id: caseId, lang, premium: 2, duration_min: RULES.durations[2], vars: JSON.stringify(vars), secrets: JSON.stringify(secrets), started_at: 0, status: "running" };
  const c = caseOf(session), v = buildVars(session);
  return [...c.DOCS, ...(c.DOCS2 || []), ...(c.DOCS3 || [])].flatMap((d) => figs(render(d.html, v)));
}
const label = (f) => (f.match(/aria-label="([^"]*)"/) || [])[1] || "";
function t001(en) {
  const all = teams("fall-001", en, 1001);
  const taxi = all.find((f) => /Taxi/i.test(label(f))), lauf = all.find((f) => /Lauf|Run/i.test(label(f)));
  if (!taxi || !lauf) throw new Error("Teams 001: Taxi oder Lauf fehlt");
  return `<div class="duo">${taxi}${lauf}</div>`;
}
function t002(en) {
  const f = teams("fall-002", en, 2002).find((x) => /Fest|Fotos|photo/i.test(label(x)) && /Bändchen|wristband|Festzelt|marquee|Zelt/i.test(x));
  if (!f) throw new Error("Teams 002: Festfotos fehlen");
  return f;
}

const CARDS = [
  { key: "solo001", page: "solo.html", sec: "fall", pageEn: "en/solo.html", secEn: "case", make: solo001,
    de: ["AUS DER AKTE · FOTOS VON SOFIAS KAMERA", "Was zeigt die Kamera – und wann?"], en: ["FROM THE FILE · PHOTOS FROM SOFIA’S CAMERA", "What does the camera show – and when?"] },
  { key: "solo002", page: "solo.html", sec: "fall2", pageEn: "en/solo.html", secEn: "case2", make: solo002,
    de: ["AUS DER AKTE · FINGERABDRÜCKE", "Wessen Abdrücke sind wo?"], en: ["FROM THE FILE · FINGERPRINTS", "Whose prints are where?"] },
  { key: "soloplus", page: "solo.html", sec: "fallplus", pageEn: "en/solo.html", secEn: "caseplus", make: soloplus,
    de: ["AUS DER AKTE · FOTOS DER PRESSEFOTOGRAFIN", "Wer ist zu sehen – und wer nicht?"], en: ["FROM THE FILE · THE PRESS PHOTOGRAPHER’S PICTURES", "Who can be seen – and who can’t?"] },
  { key: "friends", page: "friends.html", sec: "fall", pageEn: "en/friends.html", secEn: "case", make: friends,
    de: ["AUS DER AKTE · PUNKTEBLOCK DER WÜRFELRUNDE", "Wer fehlte in welcher Runde?"], en: ["FROM THE FILE · DICE GAME SCORE SHEET", "Who was missing in which round?"] },
  { key: "t001", page: "teams.html", sec: "fall", pageEn: "en/teams.html", secEn: "case", make: t001,
    de: ["AUS DER AKTE · TAXIQUITTUNG UND LAUF-APP", "Wer war wann wo unterwegs?"], en: ["FROM THE FILE · TAXI RECEIPT AND RUNNING APP", "Who was where – and when?"] },
  { key: "t002", page: "teams.html", sec: "fall002", pageEn: "en/teams.html", secEn: "case002", make: t002,
    de: ["AUS DER AKTE · FOTOS VOM FEST", "Wer trägt welches Bändchen?"], en: ["FROM THE FILE · PHOTOS FROM THE FÊTE", "Who wears which wristband?"] },
];

// Website: kein Vergrößern – Figur ohne Knopf-Rolle; IDs je Karte eindeutig machen
const tidy = (html, key) => html
  .replace(/<figure class="gn-pic[^"]*" tabindex="0" role="button" aria-label="[^"]*">/g, '<figure class="gn-pic">')
  .replace(/(id="|url\(#|href="#)([A-Za-z]+\d+)/g, `$1sb-${key}-$2`);

const pages = {};
const get = (p) => (pages[p] ??= fs.readFileSync(path.join(ROOT, p), "utf8"));
for (const c of CARDS) {
  for (const en of [false, true]) {
    const p = en ? c.pageEn : c.page, id = en ? c.secEn : c.sec, [lab, q] = en ? c.en : c.de;
    let s = get(p);
    const a = s.indexOf(`<section id="${id}"`);
    if (a < 0) throw new Error(`Abschnitt ${id} fehlt in ${p}`);
    const end = s.indexOf("</section>", a), sec = s.slice(a, end);
    const card = `<!-- bild:${c.key} --><div class="clue wide"><small>${lab}</small>${tidy(c.make(en), c.key)}<span>${q}</span></div><!-- /bild -->`;
    let neu;
    if (sec.includes(`<!-- bild:${c.key} -->`)) neu = sec.replace(new RegExp(`<!-- bild:${c.key} -->[\\s\\S]*?<!-- /bild -->`), () => card);
    else {
      const m = sec.match(/<div class="clues"[\s\S]*?\n<\/div>\n<ul/);
      if (!m) throw new Error(`Notizen-Block nicht gefunden: ${p} #${id}`);
      neu = sec.replace(m[0], () => m[0].replace(/\n<\/div>\n<ul$/, `\n${card}\n</div>\n<ul`));
    }
    pages[p] = s.slice(0, a) + neu + s.slice(end);
  }
}
// Titelbilder (tools/cover_bilder.mjs erzeugt site/assets/cover/*.webp): Fallseiten – am Handy nach der Überschrift, am Mac über den Notizen
const img = (key, en, cls) => { const T = COVERS[key][en ? "en" : "de"]; return `<img class="${cls}" src="/assets/cover/${key}-${en ? "en" : "de"}.webp" alt="${en ? "Case cover" : "Titelbild"}: ${T.t1} ${T.t2}" width="600" height="750" loading="lazy" decoding="async">`; };
const swap = (sec, mark, html, where) => {
  const re = new RegExp(`<!-- ${mark} -->[\\s\\S]*?<!-- /cover -->`);
  const block = `<!-- ${mark} -->${html}<!-- /cover -->`;
  if (re.test(sec)) return sec.replace(re, () => block);
  const m = sec.match(where);
  if (!m) throw new Error("Stelle für " + mark + " nicht gefunden");
  return sec.replace(m[0], () => m[0] + block);
};
for (const c of CARDS) {
  for (const en of [false, true]) {
    const p = en ? c.pageEn : c.page, id = en ? c.secEn : c.sec;
    let s = get(p);
    const a = s.indexOf(`<section id="${id}"`), end = s.indexOf("</section>", a);
    let sec = s.slice(a, end);
    sec = swap(sec, `cover-m:${c.key}`, img(c.key, en, "case-cover cover-m"), /<h2 class="h2">[\s\S]*?<\/h2>/);
    sec = swap(sec, `cover-d:${c.key}`, img(c.key, en, "case-cover cover-d"), /<div class="clues"[^>]*>/);
    pages[p] = s.slice(0, a) + sec + s.slice(end);
  }
}
// Startseite: Titelbilder in den Spielkarten
const HOME = { TEAMS: ["t001", "t002"], FRIENDS: ["friends"], SOLO: ["solo001", "solo002", "soloplus"] };
for (const en of [false, true]) {
  const p = en ? "en/index.html" : "index.html";
  let s = get(p);
  for (const [gp, keys] of Object.entries(HOME)) {
    const html = `<div class="covers${keys.length === 1 ? " one" : ""}">${keys.map((k) => img(k, en, "cv")).join("")}</div>`;
    s = swap(s, `cover-home:${gp}`, html, new RegExp(`<h3 class="gname">[^\\n]*<span class="gp">${gp}</span></h3>`));
  }
  pages[p] = s;
}
for (const [p, s] of Object.entries(pages)) fs.writeFileSync(path.join(ROOT, p), s);
console.log("Fallseiten- und Titelbilder geschrieben:", Object.keys(pages).join(", "));
