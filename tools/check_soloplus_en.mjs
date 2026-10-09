// Prüft die englische Fassung von Solo Plus 001 gegen die deutsche – alle Kombinationen Täter × Variante.
// Aufruf: node tools/check_soloplus_en.mjs
import * as DE from "../lib/cases/solo-plus-001.js";
import * as ENm from "../lib/cases/solo-plus-001-en.js";
const C = { ...DE, ...ENm };
const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
let err = 0, n = 0; const fail = (m) => { err++; console.log("FEHLER", m); }; const lens = {};

// Deutsche Reste: Umlaute/ß, deutsche Anführungszeichen, typische Wörter. Erlaubte Eigennamen werden vorher entfernt.
const ALLOW = ["Weißenkirchen", "Heuriger", "Petrović"];
const GERMAN = /[äöüÄÖÜß„]|\b(der|die|das|und|nicht|Uhr|ist|mit|ein|eine|auf|bei|zum|zur|nach|vom|im|auch|sie|er|ich|wir|Sie)\b/;
const residue = (where, txt) => {
  let s = String(txt).replace(/<[^>]+>/g, " ");
  for (const a of ALLOW) s = s.split(a).join("");
  const m = s.match(GERMAN);
  if (m) { const i = m.index; fail(`Deutscher Rest in ${where}: „${m[0]}“ … ${s.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, " ")}`); }
};
const ownExports = Object.keys(ENm);
for (const k of ownExports) if (!(k in DE)) fail(`Export ${k} gibt es im DE-Modul nicht`);
const sameShape = (a, b) => typeof a === typeof b && (typeof a !== "object" || a === null || JSON.stringify(Object.keys(a)) === JSON.stringify(Object.keys(b)));
for (const k of ["UI", "SUSPECTS", "LIES", "SPOTS"]) {
  if (!sameShape(C[k], DE[k])) fail(`Struktur ${k}`);
  for (const kk of Object.keys(DE[k])) if (typeof DE[k][kk] === "object" && !sameShape(C[k][kk], DE[k][kk])) fail(`Struktur ${k}.${kk}`);
}
if (C.ID !== DE.ID) fail("ID geändert");
for (const k of Object.keys(DE.SUSPECTS)) if (C.SUSPECTS[k].name !== DE.SUSPECTS[k].name) fail(`Name ${k} geändert`);
if (JSON.stringify(C.VERHOER_SUSPECTS.map((x) => [x.key, x.name])) !== JSON.stringify(DE.VERHOER_SUSPECTS.map((x) => [x.key, x.name]))) fail("VERHOER_SUSPECTS");
// Fragen: gleiche Keys, Typen, Optionscodes in gleicher Reihenfolge
C.QUESTIONS.forEach((q, i) => {
  const d = DE.QUESTIONS[i];
  if (!d || q.key !== d.key || q.nr !== d.nr || q.type !== d.type) fail(`Frage ${i + 1} Struktur`);
  if (JSON.stringify((q.options || []).map((o) => o[0])) !== JSON.stringify((d.options || []).map((o) => o[0]))) fail(`Frage ${i + 1} Optionscodes`);
  if (JSON.stringify((q.options2 || []).map((o) => o[0])) !== JSON.stringify((d.options2 || []).map((o) => o[0]))) fail(`Frage ${i + 1} Optionscodes 2`);
  residue(`Frage ${q.key}`, q.label + " " + q.hint + " " + (q.options || []).map((o) => o[1]).join(" "));
});
if (C.QUESTIONS.length !== DE.QUESTIONS.length) fail("Anzahl Fragen");
residue("TITLE", C.TITLE);
residue("UI", JSON.stringify(C.UI));
residue("SUSPECTS", Object.values(C.SUSPECTS).map((s) => s.role + " " + s.motive).join(" "));
residue("SPOTS", Object.values(C.SPOTS).map((s) => s.name + " " + s.loc).join(" "));
const B = C.briefing("Test");
if (B.steps.length !== DE.briefing("Test").steps.length) fail("Briefing-Schritte");
residue("Briefing", B.eyebrow + " " + B.title + " " + B.text + " " + B.steps.flat().join(" "));

for (let v = 0; v < DE.TIME_SHIFTS.length; v++) for (const c of DE.CULPRITS) {
  n++; const tag = `${c}/v${v}`;
  const sol = C.solution(c, v), solDE = DE.solution(c, v);
  if (JSON.stringify(sol) !== JSON.stringify(solDE)) fail(`${tag} Lösung abweichend`);
  const D = C.docs(c, "Test", v), DD = DE.docs(c, "Test", v), doc = (id) => D.find((d) => d.id === id).html;
  if (D.map((d) => d.id + ":" + d.stage).join() !== DD.map((d) => d.id + ":" + d.stage).join()) fail(`${tag} Dokumente/Stufen/Reihenfolge`);
  D.forEach((d, i) => {
    const e = DD[i]; if (!e) return;
    if ((d.html.match(/<tr>/g) || []).length !== (e.html.match(/<tr>/g) || []).length) fail(`${tag} ${d.id}: Anzahl <tr>`);
    if ((d.html.replace(/<svg[\s\S]*?<\/svg>/g, "").match(/<p[\s>]/g) || []).length !== (e.html.replace(/<svg[\s\S]*?<\/svg>/g, "").match(/<p[\s>]/g) || []).length) fail(`${tag} ${d.id}: Anzahl <p`);
    if ((d.html.match(/<li>/g) || []).length !== (e.html.match(/<li>/g) || []).length) fail(`${tag} ${d.id}: Anzahl <li>`);
    // Uhrzeiten in den Tabellen identisch (gleiche Logik)
    // „24:00“ steht auf Englisch als „Midnight“ im Festprogramm
    const times = (h) => [...h.matchAll(/<td class="mono">([^<]+)<\/td>/g)].map((r) => (r[1] === "Midnight" ? "24:00" : r[1])).join();
    if (times(d.html) !== times(e.html)) fail(`${tag} ${d.id}: Uhrzeiten abweichend`);
    // Namen der Verdächtigen pro Zeile identisch (Fotos)
    const names = (h) => h.split("<tr>").map((row) => DE.CULPRITS.filter((k) => row.includes(DE.SUSPECTS[k].name)).join("+")).join("|");
    if (names(d.html) !== names(e.html)) fail(`${tag} ${d.id}: Namen je Zeile abweichend`);
    if ((d.kk || d.kind) !== (e.kk || e.kind)) fail(`${tag} ${d.id}: kk (Stilklasse) abweichend`);
    residue(`${tag} ${d.id}`, d.title + " " + d.kind + " " + d.html);
  });
  // Frage 2: genau eine OFF-Schaltung „anteroom“ zwischen 22:18 und 23:00
  const rows = [...doc("lueftung").matchAll(/<td class="mono">(\d\d:\d\d)<\/td><td>(ON|OFF)<\/td><td>([^<]+)<\/td>/g)];
  const cand = rows.filter((r) => r[2] === "OFF" && /Anteroom/.test(r[3]) && hm(r[1]) > hm("22:18") && hm(r[1]) < hm("23:00")).map((r) => r[1]);
  if (cand.length !== 1 || cand[0] !== sol.zeit) fail(`${tag} Frage 2: ${cand}`);
  // Frage 3: auf Fotos in [T-6, T+6] fehlen genau Täter und Lockvogel
  const T = hm(sol.zeit), seen = new Set();
  // Bild (9.10.): Personen an der Kleidungsfarbe im Foto erkennen (wie die Spieler am Merkmal)
  const COL = { leopold: "#2E3A55", hanna: "#2F4A3A", mirko: "#D8CFBE", clemens: "#6B6E72", sabine: "#4A7BB0" };
  for (const part of doc("fotos").split('<g data-t="').slice(1)) { const t = part.slice(0, 5); if (Math.abs(hm(t) - T) <= 6) C.CULPRITS.forEach((k) => { if (part.includes(`fill="${COL[k]}"`)) seen.add(k); }); }
  const miss = C.CULPRITS.filter((k) => !seen.has(k)).sort(), want = [c, C.decoyOf(c, v)].sort();
  if (miss.join() !== want.join()) fail(`${tag} ohne Foto: ${miss} statt ${want}`);
  const KEY = { leopold: "burst pipe", hanna: "paper-lantern making", mirko: "cable ferry", clemens: "from the Kirchberg, not from the boat", sabine: "(on a break before that)" };
  const nts = doc("notizen"); C.CULPRITS.forEach((k) => { if (nts.includes(C.SUSPECTS[k].name) || nts.includes(C.SUSPECTS[k].name.split(" ").pop())) fail(`${tag} Name in Notizen: ${k}`); });
  const all = D.filter((d) => d.stage === 3).map((d) => d.html).join(" ");
  if (!all.includes(KEY[c])) fail(`${tag} Widerlegung fehlt`);
  // Frage 4
  // Bild (9.10.): Legende im Lageplan – durchsucht = durchgestrichen
  const names = new Set(Object.values(C.SPOTS).map((x) => x.name));
  const free = [...doc("verstecke").matchAll(/<text( text-decoration="line-through")? [^>]*>([^<]+)<\/text>/g)].filter((r) => !r[1] && names.has(r[2])).map((r) => r[2]);
  if (free.length !== 4) fail(`${tag} Lageplan: ${free.length} offene Stellen statt 4`);
  if (!free.includes(C.SPOTS[sol.schluessel].name)) fail(`${tag} Versteck durchsucht`);
  { // Bild (9.10.): fünf Fotos mit je genau einer verdächtigen Person, der Täter ist dabei
    const COL2 = { leopold: "#2E3A55", hanna: "#2F4A3A", mirko: "#D8CFBE", clemens: "#6B6E72", sabine: "#4A7BB0" };
    const parts = doc("fotos2").split('<g data-t="').slice(1), who = parts.map((p) => C.CULPRITS.filter((k) => p.includes(`fill="${COL2[k]}"`)));
    if (parts.length !== 5 || who.some((w) => w.length !== 1) || !who.flat().includes(c) || /außer Atem|out of breath/.test(doc("fotos2"))) fail(`${tag} Nachher-Foto ${JSON.stringify(who)}`); }
  for (const d of D) (lens[d.id] ||= new Set()).add((d.html.match(/<tr>/g) || []).length + "/" + (d.html.replace(/<svg[\s\S]*?<\/svg>/g, "").match(/<p[\s>]/g) || []).length);
  // Hinweise
  const H = C.HINTS(v, c), HD = DE.HINTS(v, c);
  for (const q of Object.keys(HD)) { if (!H[q] || H[q].length !== HD[q].length) fail(`${tag} Hinweise ${q}`); residue(`${tag} Hinweise ${q}`, (H[q] || []).join(" ")); }
  // Verhörraum: Prompt enthält Lüge, Englisch-Regel; alle Figuren
  for (const k of C.CULPRITS) {
    const p = C.verhoerSystem(c, v, k), f = C.verhoerFallback(c, v, k);
    if (!/Always answer in English/.test(p) || !/even if the player writes in German/.test(p)) fail(`${tag}/${k} Englisch-Regel fehlt`);
    if (!/NEVER admit/.test(p) && k === c) fail(`${tag}/${k} Geständnis-Regel fehlt`);
    if (/Antworte immer auf Deutsch/.test(p)) fail(`${tag}/${k} deutsche Sprachregel im Prompt`);
    residue(`${tag}/${k} Prompt`, p); residue(`${tag}/${k} Fallback`, f);
  }
  if (!C.verhoerSystem(c, v, c).includes(C.LIES[c].say)) fail(`${tag} Prompt`);
  const R = C.resolution(c, v), RD = DE.resolution(c, v);
  if (R.zeit !== RD.zeit || R.culprit !== RD.culprit) fail(`${tag} Auflösung`);
  residue(`${tag} Auflösung`, R.text + " " + R.summary + " " + R.item);
}
// Go-live-Test 5 (H4): Toni sucht nach 23:00 und meldet „ja, nichts“ – jede Sperre der Festleitung beginnt spätestens 22:20 und ist um 23:00 vorbei
for (const [k, [t, txt]] of Object.entries(ENm.POSTEN)) {
  if (hm(t) > hm("22:20")) fail(`Festleitung ${k}: beginnt erst ${t}`);
  for (const m of txt.matchAll(/\b(\d\d):(\d\d)\b/g)) if (hm(m[0]) > hm("23:00")) fail(`Festleitung ${k}: ${m[0]} nach 23:00`);
  if (/No straw left|sealed|taped shut/i.test(txt)) fail(`Festleitung ${k}: Stelle danach nicht durchsuchbar`);
}
for (const [id, s] of Object.entries(lens)) if (s.size !== 1) fail(`Länge ${id}: ${[...s]}`);
console.log(err ? `${err} Fehler` : `EN: ${n} Kombinationen geprüft – Struktur, Lösungen, Längen und Sprache: alles ok`);
