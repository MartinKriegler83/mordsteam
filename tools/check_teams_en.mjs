// Prüft die englische Fassung von Teams-Fall 001 (lib/cases/fall-001-en.js) für alle Länder und alle drei Pakete.
// Je Land × Paket × Durchlauf wird eine Runde wie im Shop gewürfelt (fiktive Besetzung) und komplett gerendert:
// Akte (alle Akte), Intranet inkl. geschütztem Bereich, Fragen, Funksprüche, Zusatzermittlung, ARIA, Sonderauftrag, Auflösung.
// - keine deutschen Reste (Namen, Firmen, Räume aus der Besetzung sind erlaubt)
// - keine offenen Platzhalter ({OPFER}), kein „undefined“/„NaN“/„null“ im Text
// - jedes Funkspruch-Label gehört zu einer Frage des Pakets (kein „Question 0“)
// - jede Lösung wird angenommen, auch in englischer Schreibweise (6:12 pm, £3,410, Name ohne Akzent, „A and C“)
// - Basic und Premium enthalten nichts, was nur zu Premium Plus gehört (ARIA, Kassensturz)
// Aufruf: node tools/check_teams_en.mjs
import { RAEUME_LAND } from "../lib/cases/fall-001.js";
import { CASES, caseOf, buildVars, render, hintTimes, hintLabel, stageQuestions, norm, same, RULES } from "../lib/game.js";
import { normalizeVars } from "../lib/create.js";
import { COUNTRY_ORDER, COUNTRIES, randomCast, castToEnglish, localize, countryOf, americanize } from "../lib/countries.js";

const C0 = CASES["fall-001"];
const rnd = (n) => Math.floor(Math.random() * n);
let bad = 0, runs = 0;
const found = new Map();
const err = (key, msg) => { bad++; if (!found.has(key)) found.set(key, msg); };

// Wörter, die in einem englischen Text nicht vorkommen dürfen
const GERMAN = /[äöüÄÖÜß„]|\b(der|die|das|dem|den|und|nicht|Uhr|ist|ich|mit|auf|eine?n?|zu|von|bei|wir|sie|hat|war|auch|noch|nur|im|vom|zum|beim|oder|aber|für|über|nach|bis)\b|\b(Herr|Frau|Raum|Büro|Abteilung|Rechnung|Konto|Mappe|Schließfach|Fach|Hinweis|Frage|Täter|Notiz|Liste|Protokoll|Vernehmung|Aktenvermerk|Kennung|Funktion|Vermerk|Freigabe|Betrag|Zahlung|Geschäftsführ|Kollegin|Kollege|Verdächtig|Zentrale|Strafminute|Uhrzeit|Bitte|Danke|Beweis|Ausweis|Zutritt|Feier|Abend|Leitung|Assistenz|Lieferant)(e|en|n|s|er|es|in|innen)?\b/;
// Bewusst österreichische Nebenfiguren und Firmen (siehe Lektorat 3.10.2026), Marken, Fachbegriffe
const ALLOW = /Genusswerk|Hölzl|Brandstetter|Mordsteam|Melange/g;
const NOISE = /\b(undefined|NaN|null)\b|\{[A-Z][A-Z0-9_]*\}/;

const txt = (h) => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&shy;/g, "");

function scan(where, text, known) {
  let plain = txt(text);
  const noise = plain.match(NOISE);
  if (noise) err(`noise:${where}:${noise[0]}`, `${where}: Platzhalter/Leerwert «${noise[0]}» in „${plain.slice(Math.max(0, noise.index - 60), noise.index + 60).trim()}“`);
  if (known) plain = plain.replace(known, " Name ");
  plain = plain.replace(ALLOW, "Name");
  for (const line of plain.split(/(?<=[.!?:])\s+|\n/)) {
    const m = line.match(GERMAN);
    if (m) err(`de:${where}:${m[0]}:${line.slice(0, 40)}`, `${where}: «${m[0]}» in „${line.trim().slice(0, 140)}“`);
  }
}

// Englische Schreibweisen einer richtigen Lösung
function variants(pattern, sol, land) {
  const s = String(sol);
  const out = [s];
  if (pattern === "time") {
    const [h, m] = s.split(":").map(Number);
    if (h >= 13) out.push(`${h - 12}:${String(m).padStart(2, "0")} pm`, `${h - 12}.${String(m).padStart(2, "0")}pm`);
    if (h === 12) out.push(`12:${String(m).padStart(2, "0")} pm`);
    if (h === 0) out.push(`12:${String(m).padStart(2, "0")} am`);
    if (h >= 1 && h <= 11) out.push(`${h}:${String(m).padStart(2, "0")} am`);
  }
  if (pattern === "amount") {
    const n = Number(s), sym = { GB: "£", US: "$", AU: "A$", CA: "C$", NZ: "NZ$", IE: "€", XX: "€" }[land] || "";
    out.push(n.toLocaleString("en-GB"), `${sym}${n.toLocaleString("en-GB")}`, `${sym}${n.toLocaleString("en-GB")}.00`, `${n}.00`);
  }
  if (pattern === "name") out.push(s.normalize("NFD").replace(/[̀-ͯ]/g, ""), s.toLowerCase(), s.split(" ").pop());
  if (pattern === "letter") out.push(s.toLowerCase(), `Suspect ${s}`, `(${s})`);
  if (pattern === "letters") { const [a, b] = s.replace(/[^A-Z]/g, "").split(""); out.push(`${a} and ${b}`, `${b}, ${a}`, `${a}&${b}`); }
  if (pattern === "spot") out.push(s.toLowerCase(), s.replace("-", " "));
  if (pattern === "num") out.push(`Locker ${s}`, `No. ${s}`);
  if (pattern === "digits4") out.push(`…${s}`);
  return out;
}

for (const land of COUNTRY_ORDER) for (let tier = 0; tier <= 2; tier++) for (let trial = 0; trial < 3; trial++) {
  runs++;
  const where0 = `${land}/${["Basic", "Premium", "Plus"][tier]}#${trial}`;
  const F = (C0.FICTIONS || {})[land] || [];
  let cast = F.length && trial === 0 ? castToEnglish(F[rnd(F.length)]) : randomCast(land, "en", rnd);
  let vars;
  try { vars = normalizeVars("fall-001", { ...cast, LAND: land }, tier >= 1, true, "en"); }
  catch (e) { err(`vars:${where0}`, `${where0}: Besetzung ungültig: ${e.message}`); continue; }
  const secrets = C0.makeSecrets(rnd, { premium: tier >= 1, lang: "en", feier: [vars.RAUM_FEIER, vars.FIRMA, vars.STADT, vars.PARK].filter(Boolean).join(" "), land: vars.LAND });
  const session = { case_id: "fall-001", lang: "en", premium: tier, duration_min: RULES.durations[tier], vars: JSON.stringify(vars), secrets: JSON.stringify(secrets),
    started_at: Date.now(), status: "running" };
  const c = caseOf(session), v = buildVars(session);
  // Namen, Firmen und Räume aus der Besetzung bzw. aus der Raumliste des Landes sind keine deutschen Reste
  const raw = [...Object.values(vars), ...Object.values(secrets), ...Object.values(RAEUME_LAND[land] || {}).flat()].flat().filter((x) => typeof x === "string" && x.length >= 3);
  raw.push(...[COUNTRIES[land].suffix, COUNTRIES[land].schein].filter(Boolean));
  const parts = raw.flatMap((x) => x.split(/\s+/)).filter((x) => x.length >= 3 && /^\p{Lu}/u.test(x));
  const list = [...new Set([...raw, ...parts, ...raw.map((x) => x.toUpperCase())])].sort((a, b) => b.length - a.length);
  // eine einzige Regex je Runde (schnell): ganze Wörter, längste zuerst
  const known = new RegExp(`(?<![\\p{L}])(?:${list.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}])`, "gu");
  const plus = tier >= 2, premium = tier >= 1;
  const all = [];
  const add = (where, t) => { all.push(t); scan(`${where0} ${where}`, t, known); };

  // Akte
  const docs = [...c.DOCS.filter((d) => !d.premiumOnly || premium), ...(premium ? c.DOCS2 : []), ...(plus && c.DOCS3 ? c.DOCS3 : [])];
  for (const d of docs) add(`Akte ${d.id}`, render(d.title, v) + "\n" + render(d.html, v));
  // Intranet inkl. geschütztem Bereich
  const us = (t, pr = false) => (land === "US" ? americanize(t, pr) : t);   // wie im Server (usText)
  for (const p of c.FIRMA_WEB.pages) add(`Intranet ${p.id}`, p.title + "\n" + us(p.id === "news" && plus && c.ARIA ? c.ARIA.news : "") + render(p.html, v));
  add("Intranet geschützt", render(c.FIRMA_WEB.partner, v));
  if (c.FIRMA_WEB.login && c.FIRMA_WEB.login.label) add("Intranet Login", c.FIRMA_WEB.login.label);
  // Fragen, Funksprüche
  const qs = [1, 2, 3].flatMap((st) => (st === 1 || (st === 2 && premium) || (st === 3 && plus) ? stageQuestions(session, st) : []));
  for (const q of qs) add(`Frage ${q.key}`, render(q.label, v) + " · " + q.hint);
  for (const h of hintTimes(session, { core_at: Date.now(), act2_at: Date.now() })) {
    const label = hintLabel(session, h.q);
    if (!qs.some((q) => q.key === h.q)) err(`hintq:${tier}:${h.q}`, `${where0}: Funkspruch zu Frage „${h.q}“, die es im Paket nicht gibt`);
    if (/\b0\b|undefined|NaN/.test(label) || !label.trim()) err(`label:${tier}:${h.q}`, `${where0}: Funkspruch-Label „${label}“ für ${h.q}`);
    add(`Funkspruch ${label} L${h.level}`, label + " " + render(c.TIPS[h.q][h.level - 1], v));
  }
  // Zusatzermittlung
  for (const q of c.BONUS || []) add(`Bonus ${q.key}`, render(q.label, v) + " · " + q.hint);
  // Auflösung
  add("Auflösung", render(c.META.story, v));
  if (premium && c.META.story2) add("Auflösung Akt 2", render(c.META.story2, v));
  if (plus && c.META.story3) add("Auflösung Finale", render(c.META.story3, v));
  // ARIA und Sonderauftrag (nur Premium Plus)
  if (plus && c.ARIA) {
    const x = { ...vars, ...secrets, LANG: "en" };
    x.HBF = localize(countryOf(x.LAND), "en", x.STADT).hbf;
    add("ARIA Notiz", us(c.ARIA.note(x)));
    if (c.ARIA.calendar) add("ARIA Kalender", us(JSON.stringify(c.ARIA.calendar(x)), true));
    add("ARIA System", us(c.ARIA.system(x), true));
    if (c.SONDER) {
      add("Sonder", [c.SONDER.surprise, c.SONDER.task, c.SONDER.label].map((t) => render(t, v)).join("\n") + "\n" + c.SONDER.options().map((o) => o[1]).join(", "));
      add("Sonder System", us(c.SONDER.system({ ...x, SCHEINFIRMA_TXT: String(v.SCHEINFIRMA || ""), T_ER: v.T_ER || "", T_HE: v.T_HE || "" }), true));
    }
  }
  // USA: kein britischer Wortschatz mehr; englischsprachige Länder: Nebenfiguren mit englischen Namen
  const UK = /\b(car parks?|mobile phones?|work mobiles?|number plates?|camomile|colour\w*|favourite|centre|programme|maths|biscuits|left-luggage|in hospital|cancelled|labelled|organis\w*|recognis\w*|realis\w*|memoris\w*|apologis\w*|grey|fish and chips)\b|\b(Mr|Mrs|Ms|Dr) (?=[A-Z])/i;
  if (land === "US") for (const t of all) { const m = txt(t).match(UK); if (m) { const i = txt(t).indexOf(m[0]); err(`us:${m[0].toLowerCase()}`, `${where0}: britisch „${m[0]}“ in „${txt(t).slice(Math.max(0, i - 50), i + 50).replace(/\s+/g, " ")}“`); } }
  if (["GB", "IE", "US", "CA", "AU", "NZ", "XX"].includes(land)) for (const t of all) { const m = txt(t).match(/Genusswerk|Hölzl|Brandstetter/); if (m) err(`neben:${land}:${m[0]}`, `${where0}: Nebenfigur „${m[0]}“ nicht lokalisiert`); }
  // Paket-Grenzen
  if (!plus) for (const t of all) { const m = txt(t).match(/\bARIA\b|cash count|locker contents/i); if (m) { err(`leak:${tier}:${m[0]}`, `${where0}: „${m[0]}“ taucht im Paket ohne Finale auf`); break; } }
  // Lösungen in englischer Schreibweise
  const sol = c.solution(secrets, vars);
  for (const q of qs) for (const inp of variants(q.pattern, sol[q.key], land)) {
    if (!same(norm[q.pattern](inp), norm[q.pattern](sol[q.key]))) err(`sol:${q.key}:${inp}`, `${where0}: Frage ${q.key}: „${inp}“ abgelehnt (Lösung ${sol[q.key]})`);
  }
  const bsol = c.bonusSolution(secrets);
  for (const q of c.BONUS || []) for (const inp of variants(q.pattern, bsol[q.key], land)) {
    if (!same(norm[q.pattern](inp), norm[q.pattern](bsol[q.key]))) err(`bsol:${q.key}:${inp}`, `${where0}: Bonus ${q.key}: „${inp}“ abgelehnt (Lösung ${bsol[q.key]})`);
  }
}

if (found.size) { for (const m of [...found.values()].slice(0, 60)) console.log("FEHLER", m); if (found.size > 60) console.log(`… und ${found.size - 60} weitere`); }
console.log(bad ? `${found.size} verschiedene Fehler in ${runs} Runden` : `Teams EN: ${runs} Runden (${COUNTRY_ORDER.length} Länder × 3 Pakete × 3), alles ok`);
process.exit(bad ? 1 : 0);
