// Prüft die englische Fassung von Solo 001 für alle Kombinationen aus Täter × Zeitvariante:
// gleiche Dokumente/Stufen/Reihenfolge wie DE, gleiche Tabellenstruktur und Uhrzeiten, gleiche Lösungen und Auswahl-Codes,
// gleich lange Beweisstücke (Kriterium wie check_solo001.mjs), keine Widersprüche aus dem Spieltest, keine deutschen Reste.
// Aufruf: node tools/check_solo001_en.mjs
import { execFileSync } from "node:child_process";
import * as DE from "../lib/cases/solo-001.js";
import * as EN from "../lib/cases/solo-001-en.js";

let err = 0, n = 0;
const fail = (m) => { err++; console.log("FEHLER", m); };
const C = { ...DE, ...EN };
const count = (s, re) => (s.match(re) || []).length;
const times = (s) => (s.match(/\b\d\d:\d\d\b/g) || []).sort().join(",");

// --- deutsche Reste ---
const GERMAN = /[äöüÄÖÜß„‚]|\b(der|die|das|und|nicht|Uhr|ist|mit|von|nach|ein|eine|auf|zu|im|bei|bis|gegen|kurz|halb|Herr|Frau|Wagen|Abteil|Zug|geöffnet|Tisch|Uhrzeit|Hinweis|Strafminuten)\b/;
// bewusst erlaubt: Eigennamen, Gerätenamen, Bahnhofsnamen
const ALLOW = [/Kofler-Dienst/g, /Wien Hbf/g, /Venezia S\. Lucia/g, /Serenissima-Free/g, /La Serenissima/g];
const seen = new Set();
function scan(where, text) {
  let t = String(text ?? "");
  for (const a of ALLOW) t = t.replace(a, "");
  t = t.replace(/<[^>]+>/g, " ");
  const m = t.match(new RegExp(GERMAN.source, "g"));
  if (m) {
    const key = where + "|" + m.join(",");
    if (seen.has(key)) return;
    seen.add(key);
    const i = t.search(GERMAN);
    fail(`Deutscher Rest in ${where}: ${[...new Set(m)].join(", ")} … „${t.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, " ").trim()}“`);
  }
}

// --- statische Texte ---
if (typeof EN.TITLE !== "string" || EN.TITLE === DE.TITLE) fail("TITLE nicht übersetzt");
scan("TITLE", EN.TITLE);
const deQ = DE.QUESTIONS, enQ = C.QUESTIONS;
if (deQ.length !== enQ.length) fail("Anzahl Fragen verschieden");
deQ.forEach((q, i) => {
  const e = enQ[i] || {};
  for (const k of ["key", "nr", "type"]) if (q[k] !== e[k]) fail(`Frage ${i + 1}: ${k} verschieden`);
  if (!!q.options !== !!e.options) fail(`Frage ${i + 1}: Optionen fehlen/zu viel`);
  if (q.options && q.options.map((o) => o[0]).join() !== e.options.map((o) => o[0]).join()) fail(`Frage ${i + 1}: Options-Codes/Reihenfolge verschieden`);
  scan(`Frage ${i + 1}`, [e.label, e.hint, ...(e.options || []).map((o) => o[1])].join(" | "));
});
for (const k of Object.keys(DE.SUSPECTS)) {
  if (C.SUSPECTS[k]?.spot !== DE.SUSPECTS[k].spot) fail(`SUSPECTS.${k}.spot verschieden`);
  scan(`SUSPECTS.${k}`, C.SUSPECTS[k].name + " " + C.SUSPECTS[k].abt);
}
if (Object.keys(C.SPOTS).join() !== Object.keys(DE.SPOTS).join()) fail("SPOTS-Schlüssel verschieden");
for (const k of Object.keys(DE.SPOTS)) {
  if (C.SPOTS[k].innen !== DE.SPOTS[k].innen) fail(`SPOTS.${k}.innen verschieden`);
  scan(`SPOTS.${k}`, C.SPOTS[k].name + " " + C.SPOTS[k].zugang);
}
const bDE = DE.briefing("Test"), bEN = C.briefing("Test");
if (bDE.steps.length !== bEN.steps.length) fail("Briefing: Anzahl Schritte verschieden");
if (!bEN.text.includes("Test")) fail("Briefing: Spielername fehlt");
scan("Briefing", [bEN.eyebrow, bEN.title, bEN.text, ...bEN.steps.flat()].join(" | "));

// --- alle Kombinationen ---
const lens = {};
for (let v = 0; v < DE.TIME_SHIFTS.length; v++) for (const c of DE.CULPRITS) {
  n++;
  const tag = `${c}/v${v}`;
  const dDE = DE.docs(c, "Test", v), dEN = C.docs(c, "Test", v);
  const sig = (D) => D.map((d) => `${d.id}@${d.stage}`).join(" ");
  if (sig(dDE) !== sig(dEN)) fail(`${tag} Dokumente/Stufen/Reihenfolge verschieden:\n  DE ${sig(dDE)}\n  EN ${sig(dEN)}`);
  for (const e of dEN) {
    const g = dDE.find((x) => x.id === e.id);
    if (!g) continue;
    if (count(g.html, /<tr>/g) !== count(e.html, /<tr>/g)) fail(`${tag} ${e.id}: <tr> DE ${count(g.html, /<tr>/g)} ≠ EN ${count(e.html, /<tr>/g)}`);
    if (count(g.html, /<p/g) !== count(e.html, /<p/g)) fail(`${tag} ${e.id}: <p DE ${count(g.html, /<p/g)} ≠ EN ${count(e.html, /<p/g)}`);
    if (times(g.html) !== times(e.html)) fail(`${tag} ${e.id}: Uhrzeiten verschieden\n  DE ${times(g.html)}\n  EN ${times(e.html)}`);
    if ((e.kk || e.kind) !== (g.kk || g.kind)) fail(`${tag} ${e.id}: kk passt nicht zur DE-Art (Styling)`);
    scan(`Dokument ${e.id}`, `${e.kind} | ${e.title} | ${e.html}`);
    (lens[e.id] ||= new Set()).add(count(e.html, /<tr>/g) + "/" + count(e.html, /<p/g));
  }
  const sDE = DE.solution(c, v), sEN = C.solution(c, v);
  if (JSON.stringify(sDE) !== JSON.stringify(sEN)) fail(`${tag} Lösung verschieden`);
  // gleiche inhaltliche Prüfungen wie im DE-Skript
  const doc = (id) => (dEN.find((d) => d.id === id) || {}).html || "";
  if (!doc("tuer").includes(`>${sEN.zeit}<`)) fail(`${tag} Tatzeit ${sEN.zeit} fehlt im Türprotokoll`);
  if (!/letting in or leaving/.test(doc("tuer"))) fail(`${tag} Taster-Erklärung fehlt`);
  const all = dEN.map((d) => d.html).join(" ");
  if (/2 × peppermint tea/i.test(all)) fail(`${tag} 2 × peppermint tea`);
  const kofler = all.split("Anton Kofler, staff compartment 1")[1] || "";
  const kStmt = kofler.slice(0, kofler.indexOf("</p>", kofler.indexOf("<p class=\"a\">")));
  if (!kofler) fail(`${tag} Kofler-Aussage nicht gefunden`);
  if (c === "sofia" && /half past one|01:3/.test(kStmt)) fail(`${tag} Kofler bestätigt Sofias falsche Zeit`);
  if (!C.SPOTS[sEN.versteck]) fail(`${tag} Versteck unbekannt`);
  const rDE = DE.resolution(c, v), r = C.resolution(c, v);
  if (!/blister/i.test(r.text)) fail(`${tag} Blister in der Auflösung fehlt`);
  if (times(rDE.text) !== times(r.text)) fail(`${tag} Auflösung: Uhrzeiten verschieden`);
  if (r.culprit !== C.SUSPECTS[c].name || r.item !== C.SPOTS[sEN.versteck].name) fail(`${tag} Auflösung: Name/Versteck passt nicht`);
  scan("Auflösung " + c, `${r.culprit} | ${r.item} | ${r.text}`);
  // Hinweise
  const hDE = DE.HINTS(v, c), hEN = C.HINTS(v, c);
  for (const q of DE.QUESTIONS) {
    if ((hDE[q.key] || []).length !== (hEN[q.key] || []).length) fail(`${tag} Hinweise ${q.key}: Anzahl verschieden`);
    if (times((hDE[q.key] || []).join(" ")) !== times((hEN[q.key] || []).join(" "))) fail(`${tag} Hinweise ${q.key}: Uhrzeiten verschieden`);
    scan(`Hinweise ${q.key}`, (hEN[q.key] || []).join(" | "));
  }
}
for (const [id, s] of Object.entries(lens)) if (s.size > 2) fail(`Länge ${id}: ${[...s]}`);

// --- deutsches Prüfskript muss grün bleiben ---
try {
  const out = execFileSync(process.execPath, [new URL("./check_solo001.mjs", import.meta.url).pathname], { encoding: "utf8" });
  if (/FEHLER|\d+ Fehler/.test(out)) fail("DE-Prüfskript: " + out.trim());
  else console.log("DE-Prüfskript:", out.trim());
} catch (e) { fail("DE-Prüfskript bricht ab: " + (e.stdout || e.message)); }

console.log(err ? `${err} Fehler` : `${n} Kombinationen (EN): Struktur, Lösungen, Codes und Längen wie DE, keine deutschen Reste – alles ok`);
