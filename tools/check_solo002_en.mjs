// Prüft die englische Fassung von Solo 002 für alle Kombinationen aus Täter × Variante:
// gleiche Dokumente/Stufen/Reihenfolge und Tabellenzeilen wie DE, gleiche Lösungen und Auswahl-Codes,
// gleich lange Beweisstücke innerhalb EN (Kriterium wie check_solo002.mjs) und keine deutschen Reste.
// Führt am Ende zusätzlich das DE-Prüfskript aus.
// Aufruf: node tools/check_solo002_en.mjs
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as DE from "../lib/cases/solo-002.js";
import * as ENmod from "../lib/cases/solo-002-en.js";

const EN = { ...DE, ...ENmod };
let err = 0, n = 0;
const fail = (m) => { err++; console.log("FEHLER", m); };
const trs = (h) => (h.match(/<tr>/g) || []).length;
const lenKey = (h) => (h.match(/<tr>/g) || []).length + "/" + (h.match(/<p/g) || []).length;

// deutsche Reste: Umlaute/ß, deutsche Anführungszeichen, typische Wörter. Erlaubte Eigennamen werden vorher entfernt.
const ALLOW = ["Theater am Kanal", "Tobias Grün", "Mr Grün", "Herr Grün"];
const WORDS_DE = /\b(der|die|das|und|nicht|Uhr|ist|mit|für|von|bis|eine|einen|auf|zu|den|dem|sich|auch|wird|wurde|sie|oder|aber|noch|nur|wer|Frau|Herr|Spind|Täter|Ärztin|Intendantin|Polizei)\b/i;
const CHARS_DE = /[äöüßÄÖÜ„‚]/;
const found = new Map();
function scan(where, s) {
  if (s == null) return;
  if (typeof s === "object") { for (const [k, x] of Object.entries(s)) scan(`${where}.${k}`, x); return; }
  if (typeof s !== "string") return;
  let t = s.replace(/<[^>]+>/g, " ");
  for (const a of ALLOW) t = t.split(a).join(" ");
  for (const re of [CHARS_DE, WORDS_DE]) {
    const m = t.match(re);
    if (m) { const i = Math.max(0, m.index - 30); const key = `${where}: …${t.slice(i, m.index + 30).replace(/\s+/g, " ")}…`; found.set(key, m[0]); }
  }
}

// statische Texte
scan("TITLE", EN.TITLE); scan("UI", EN.UI); scan("QUESTIONS", EN.QUESTIONS.map((q) => ({ label: q.label, hint: q.hint, options: (q.options || []).map((o) => o[1]) })));
scan("briefing", EN.briefing("Test"));
for (const k of EN.CULPRITS) scan(`SUSPECTS.${k}`, { short: EN.SUSPECTS[k].short, role: EN.SUSPECTS[k].role });
for (const k of Object.keys(EN.ITEMS)) scan(`ITEMS.${k}`, { name: EN.ITEMS[k].name, others: EN.ITEMS[k].others });

// Fragen: gleiche Keys/Typen, Auswahl-Codes in gleicher Reihenfolge
if (EN.QUESTIONS.length !== DE.QUESTIONS.length) fail("Anzahl Fragen");
EN.QUESTIONS.forEach((q, i) => {
  const d = DE.QUESTIONS[i];
  if (q.key !== d.key || q.nr !== d.nr || q.type !== d.type) fail(`Frage ${i + 1}: key/nr/type`);
  const a = (q.options || []).map((o) => o[0]).join(","), b = (d.options || []).map((o) => o[0]).join(",");
  if (a !== b) fail(`Frage ${i + 1}: Optionen ${a} ≠ ${b}`);
});
// Strukturgleichheit SUSPECTS / ITEMS
for (const k of Object.keys(DE.SUSPECTS)) { const a = DE.SUSPECTS[k], b = EN.SUSPECTS[k]; if (!b || a.name !== b.name || a.spind !== b.spind || a.proof !== b.proof) fail(`SUSPECTS ${k}`); }
for (const k of Object.keys(DE.ITEMS)) { const a = DE.ITEMS[k], b = EN.ITEMS[k]; if (!b || a.t !== b.t || String(a.win) !== String(b.win) || String(a.legit) !== String(b.legit) || (a.others || []).length !== (b.others || []).length) fail(`ITEMS ${k}`); }

const lens = {};
for (let v = 0; v < DE.VARIANTS; v++) for (const c of DE.CULPRITS) {
  n++;
  const tag = `${c}/v${v}`;
  if (JSON.stringify(EN.solution(c, v)) !== JSON.stringify(DE.solution(c, v))) fail(`${tag} Lösung`);
  const dd = DE.docs(c, "Test", v), de = EN.docs(c, "Test", v);
  const sig = (L) => L.map((d) => `${d.id}@${d.stage}`).join(",");
  if (sig(dd) !== sig(de)) fail(`${tag} Dokumente: ${sig(de)} ≠ ${sig(dd)}`);
  de.forEach((d, i) => {
    const o = dd[i]; if (!o) return;
    if (trs(d.html) !== trs(o.html)) fail(`${tag} ${d.id}: ${trs(d.html)} <tr> statt ${trs(o.html)}`);
    if ((d.kk || d.kind) !== (o.kk || o.kind)) fail(`${tag} ${d.id}: kk ${d.kk} ≠ ${o.kk || o.kind}`);
    (lens[d.id] ||= new Set()).add(lenKey(d.html));
    scan(`docs[${tag}].${d.id}`, { kind: d.kind, title: d.title, html: d.html });
  });
  // Hinweise: gleiche Struktur
  const hd = DE.HINTS(v, c), he = EN.HINTS(v, c);
  for (const k of Object.keys(hd)) if ((he[k] || []).length !== hd[k].length) fail(`${tag} Hinweise ${k}`);
  scan(`HINTS[${tag}]`, he);
  // Auflösung: gleiche Felder, nicht leer
  const rd = DE.resolution(c, v), re = EN.resolution(c, v);
  if (Object.keys(rd).join() !== Object.keys(re).join() || !re.text || re.culprit !== rd.culprit) fail(`${tag} Auflösung`);
  if (!re.item.includes(DE.solution(c, v).code)) fail(`${tag} Auflösung ohne Code`);
  scan(`resolution[${tag}]`, re);
}
for (const [id, s] of Object.entries(lens)) if (s.size !== 1) fail(`Länge ${id}: ${[...s]}`);
// Ärztin-Fenster muss in EN dieselben Zahlen zeigen wie DE (Frage 1 hängt daran)
for (let v = 0; v < DE.VARIANTS; v++) {
  const num = (L) => (L.find((d) => d.id === "aerztin").html.match(/<b>(\d+)\D+(\d+) min/i) || []).slice(1).join("-");
  const a = num(EN.docs("vera", "Test", v)), b = (DE.docs("vera", "Test", v).find((d) => d.id === "aerztin").html.match(/etwa <b>(\d+) bis (\d+)/) || []).slice(1).join("-");
  if (!a || a !== b) fail(`v${v} Ärztin-Fenster ${a} ≠ ${b}`);
}
for (const [k, w] of found) fail(`deutscher Rest „${w}“ in ${k}`);

// DE-Prüfskript muss grün bleiben
let deOut = "";
try {
  deOut = execFileSync(process.execPath, [fileURLToPath(new URL("./check_solo002.mjs", import.meta.url))], { encoding: "utf8" }).trim();
} catch (e) { deOut = String(e.stdout || e.message).trim(); }
console.log("DE-Prüfskript:", deOut.split("\n").at(-1));
if (!/alles eindeutig und gleich lang/.test(deOut)) fail("DE-Prüfskript nicht grün");

console.log(err ? `${err} Fehler` : `${n} Kombinationen (EN): alles ok`);
process.exit(err ? 1 : 0);
