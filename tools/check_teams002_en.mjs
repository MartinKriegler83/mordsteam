// Prüft die englische Fassung von Teams-Fall 002 „Cold Cash“: alle Länder × 3 Pakete × alle Vereinsarten,
// keine offenen Platzhalter, keine deutschen Reste, Lösungen identisch zur deutschen Logik, KI-Figur und Notfall-Antworten englisch.
// Aufruf: node tools/check_teams002_en.mjs
import { COUNTRY_ORDER, americanize, isUS } from "../lib/countries.js";
import * as F from "../lib/cases/fall-002.js";
const E = F.EN;
let err = 0;
const fail = (m) => { if (err < 60) console.log("FEHLER", m); err++; };
const rand = (n) => Math.floor(Math.random() * n);
const ARTEN = F.VEREINSARTEN.map((a) => a[0]);
// typische deutsche Wörter (Wortgrenzen) – Namen, Orte, Vereine werden vorher entfernt
const GERMAN = /\b(und|oder|der|die|das|den|dem|des|ein|eine|einen|nicht|mit|für|von|bei|nach|Uhr|Lage|Kiste|Kisten|Bonkassa|Kühlanhänger|Schank|Würstel|Festkassa|Verein|Vereins|Polizei|Akte|Funk|Seite|links|rechts|Helfer|weitere|Jugend|Personen|gezogen|Hauptpreis|zurück|Entnahme|Tür|auf|zu|Sollwert|Grill|Fest|Lücke|Einteilung|Pokal)\b/;
let rounds = 0;
for (const land of COUNTRY_ORDER) for (let tier = 0; tier < 3; tier++) for (let k = 0; k < 3; k++) {
  const premium = tier >= 1;
  const pool = F.FICTIONS[land] || [];
  let cast = pool.length ? F.castToEnglish(pool[rand(pool.length)]) : F.randomCast(land, "en", rand);
  cast = { ...cast, VEREINSART: ARTEN[(tier * 3 + k) % ARTEN.length], LAND: land };
  const sec = F.makeSecrets(rand, { premium });
  const v = { ...cast, ...sec, LANG: "en", TIER: tier, WRONG: 5 };
  Object.assign(v, F.extraVars(v));
  const R = (t) => { const o = t.replace(/\{([A-Z0-9_]+)\}/g, (m, key) => (key in v ? v[key] : m)); return isUS(v) ? americanize(o) : o; };
  const docs = [...E.DOCS.filter((d) => !d.premiumOnly || premium), ...(premium ? E.DOCS2 : []), ...(tier >= 2 ? E.DOCS3 : [])];
  if (E.DOCS.length !== F.DOCS.length || E.DOCS2.length !== F.DOCS2.length || E.DOCS3.length !== F.DOCS3.length) fail("Anzahl Beweisstücke DE/EN verschieden");
  const parts = [...docs.map((d) => [d.id, R(d.title + " " + d.html)]), ...E.FIRMA_WEB.pages.map((p) => ["web-" + p.id, R(p.html)]), ["partner", R(E.FIRMA_WEB.partner)],
    ...["intro", "story", ...(premium ? ["story2"] : []), ...(tier >= 2 ? ["story3"] : [])].map((key) => ["meta-" + key, R(E.META[key])]),
    ...Object.entries(E.UI).map(([key, t]) => ["ui-" + key, R([].concat(t).join(" "))]),
    ...[...E.QUESTIONS, ...E.QUESTIONS2, ...E.QUESTIONS3, ...E.BONUS].map((q) => ["q-" + q.key, R(q.label + " " + q.hint)]),
    ...Object.entries(E.TIPS).flatMap(([key, t]) => t.map((x) => ["tip-" + key, R(x)]))];
  // Namen und Eigennamen entfernen, dann nach deutschen Resten suchen
  const known = [...Object.values(cast).filter((x) => typeof x === "string" && x.length > 1), v.EHREN, v.MASKOTTCHEN, v.ZEITUNG, v.COP, v.BEHOERDE_ORT, "obmann"]
    .flatMap((x) => [x, ...String(x).split(/\s+/)]).filter((x) => x && x.length > 1).sort((a, b) => b.length - a.length);
  const kill = new RegExp(known.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  for (const [id, h] of parts) {
    const left = h.match(/\{[A-Z0-9_]+\}/g);
    if (left) fail(`${land}/${tier} ${id}: Platzhalter ${left}`);
    const txt = h.replace(/<[^>]*>/g, " ").replace(kill, " ");
    const m = txt.match(GERMAN);
    if (m) fail(`${land}/${tier} ${id}: deutsches Wort „${m[0]}“ in: …${txt.slice(Math.max(0, m.index - 50), m.index + 40)}…`);
  }
  // gleiche Lösung wie die deutsche Logik, Ehrenobmann englisch
  const sol = F.solution(sec, cast);
  if (!sol.wann || !sol.betrag || !sol.wo) fail("Lösung unvollständig");
  if (tier >= 2) {
    const x = { ...cast, ...sec, LANG: "en" };
    const sys = E.ARIA.system(x);
    if (!sys.includes(String(sec.ZELT)) || GERMAN.test(sys.replace(kill, " ").replace(/\[PERSON\d\]/g, ""))) fail(`${land}: Ehrenobmann-Prompt nicht sauber englisch`);
    const fb = E.ARIA.fallback(x, "What did they ask you about last week?");
    if (!fb.includes(String(sec.ZELT))) fail(`${land}: Notfall-Antwort ohne Code-Jahr`);
    if (!E.SONDER.options()[F.zielOf(sec)]) fail("Sonderauftrag ungültig");
  }
  rounds++;
}
console.log(err ? `${err} Fehler` : `${rounds} englische Runden (${COUNTRY_ORDER.length} Länder × 3 Pakete × 3, Vereinsarten gemischt): alles ok`);
process.exit(err ? 1 : 0);
