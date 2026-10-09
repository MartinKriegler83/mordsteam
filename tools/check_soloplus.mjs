// Prüft Solo Plus 001 für alle Kombinationen aus Täter × Variante. Aufruf: node tools/check_soloplus.mjs
import * as C from "../lib/cases/solo-plus-001.js";
const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const strip = (h) => h.replace(/<[^>]+>/g, " ");
let err = 0, n = 0; const fail = (m) => { err++; console.log("FEHLER", m); }; const lens = {};
for (let v = 0; v < C.TIME_SHIFTS.length; v++) for (const c of C.CULPRITS) {
  n++; const tag = `${c}/v${v}`, sol = C.solution(c, v), D = C.docs(c, "Test", v), doc = (id) => D.find((d) => d.id === id).html;
  // Frage 3: Täter + widerlegende Tatsache; die Tatsache steht in Programm oder Durchsagen
  { const [who, fact] = sol.taeter.split("|"); const q3 = C.QUESTIONS.find((q) => q.key === "taeter");
    if (who !== c || !q3.options2.some((o) => o[0] === fact)) fail(`${tag} Frage 3 Lösung`);
    if (new Set(Object.values(C.FACT_OF)).size !== 5) fail("FACT_OF nicht eindeutig");
    const kw = { wc: "Rohrbruch", faehre: "Rollfähre", kirchberg: "vom Kirchberg", kinder: "Lampionbasteln", musik: "Winzermusik" }[fact];
    if (!(doc("durchsagen") + doc("programm")).includes(kw) || !C.LIES[c].fact.includes(kw.replace("vom ", "").replace("Lampionbasteln", "Garten").replace("Rohrbruch", "Rohrbruch"))) fail(`${tag} Frage 3 Tatsache ${fact}`); }
  // Frage 2: genau eine AUS-Schaltung „Vorraum“ zwischen 22:18 (Ferdinand unten) und 23:00
  const rows = [...doc("lueftung").matchAll(/<td class="mono">(\d\d:\d\d)<\/td><td>(EIN|AUS)<\/td><td>([^<]+)<\/td>/g)];
  const cand = rows.filter((r) => r[2] === "AUS" && /Vorraum/.test(r[3]) && hm(r[1]) > hm("22:18") && hm(r[1]) < hm("23:00")).map((r) => r[1]);
  if (cand.length !== 1 || cand[0] !== sol.zeit) fail(`${tag} Frage 2: ${cand}`);
  // Frage 3: auf Fotos in [T-6, T+6] fehlen genau Täter und Lockvogel
  const T = hm(sol.zeit), seen = new Set();
  // Bild (9.10.): Personen an der Kleidungsfarbe im Foto erkennen (wie die Spieler am Merkmal)
  const COL = { leopold: "#2E3A55", hanna: "#2F4A3A", mirko: "#D8CFBE", clemens: "#6B6E72", sabine: "#4A7BB0" };
  for (const part of doc("fotos").split('<g data-t="').slice(1)) { const t = part.slice(0, 5); if (Math.abs(hm(t) - T) <= 6) C.CULPRITS.forEach((k) => { if (part.includes(`fill="${COL[k]}"`)) seen.add(k); }); }
  const miss = C.CULPRITS.filter((k) => !seen.has(k)).sort(), want = [c, C.decoyOf(c, v)].sort();
  if (miss.join() !== want.join()) fail(`${tag} ohne Foto: ${miss} statt ${want}`);
  // Photo-Unschuldige: mind. je ein Foto vor und nach T (6 Minuten Weg)
  // Lüge des Täters wird durch Programm/Durchsagen/Notizen widerlegt – Stichworte prüfen
  const KEY = { leopold: "Rohrbruch", hanna: "Lampionbasteln", mirko: "Rollfähre", clemens: "vom Kirchberg, nicht vom Schiff", sabine: "(vorher Pause)" };
  // Die Bestätigung des Lockvogels darf keinen Namen nennen – sonst wäre Frage 3 ohne Verhör lösbar
  const nts = D.find((d) => d.id === "notizen").html; C.CULPRITS.forEach((k) => { if (nts.includes(C.SUSPECTS[k].name) || nts.includes(C.SUSPECTS[k].name.split(" ").pop())) fail(`${tag} Name in Notizen: ${k}`); });
  const all = D.filter((d) => d.stage === 3).map((d) => d.html).join(" ");
  if (!all.includes(KEY[c])) fail(`${tag} Widerlegung fehlt`);
  // Frage 4: am Ort des Täters genau ein nicht durchsuchter Platz
  // Bild (9.10.): Legende im Lageplan – durchsucht = durchgestrichen
  const names = new Set(Object.values(C.SPOTS).map((x) => x.name));
  const free = [...doc("verstecke").matchAll(/<text( text-decoration="line-through")? [^>]*>([^<]+)<\/text>/g)].filter((r) => !r[1] && names.has(r[2])).map((r) => r[2]);
  if (free.length !== 8) fail(`${tag} Lageplan: ${free.length} offene Stellen statt 8`);
  if (!free.includes(C.SPOTS[sol.schluessel].name)) fail(`${tag} Versteck durchsucht`);
  // Frage 4 (seit 8.10.2026): am Ort des Täters zwei freie Stellen, die Festleitung schließt genau die falsche aus
  { const loc = C.AFTER[c], pair = [loc, loc + "2"].map((k) => C.SPOTS[k].name), fl = doc("festleitung");
    if (!pair.every((x) => free.includes(x))) fail(`${tag} Frage 4: nicht beide Stellen frei`);
    const other = sol.schluessel === loc ? loc + "2" : loc;
    if (!fl.includes(C.POSTEN[other][1])) fail(`${tag} Frage 4: Ausschluss fehlt`);
    if (fl.includes(C.POSTEN[sol.schluessel][1])) fail(`${tag} Frage 4: Versteck ausgeschlossen`);
    // keine freie Stelle außer dem Versteck bleibt übrig, wenn man Ort + Festleitung kombiniert
    const left = free.filter((x) => pair.includes(x) && !Object.entries(C.SPOTS).some(([k, s]) => s.name === x && fl.includes(C.POSTEN[k]?.[1] || "§")));
    if (left.length !== 1 || left[0] !== C.SPOTS[sol.schluessel].name) fail(`${tag} Frage 4 nicht eindeutig: ${left}`);
    // seit 9.10.2026: drei Orte mit zwei freien Stellen – an jedem anderen Ort schließt die Festleitung genau eine aus, Täter-Ort nur über die Fotos
    const locs = C.openLocs(c, v);
    if (locs.length !== 3 || new Set(locs).size !== 3 || !locs.includes(loc)) fail(`${tag} Frage 4: Orte ${locs}`);
    for (const o of locs) { const pr = [o, o + "2"]; if (!pr.every((k) => free.includes(C.SPOTS[k].name))) fail(`${tag} Frage 4: ${o} nicht frei`);
      if (pr.filter((k) => fl.includes(C.POSTEN[k][1])).length !== 1) fail(`${tag} Frage 4: Festleitung an ${o} nicht genau eine Stelle`); }
    if (!doc("fotos2").includes(C.SPOTS[loc].loc) && !/data-t/.test(doc("fotos2"))) fail(`${tag} Frage 4: Täter-Ort nicht auf den Fotos`); }
  { // Bild (9.10.): fünf Fotos mit je genau einer verdächtigen Person, der Täter ist dabei
    const COL2 = { leopold: "#2E3A55", hanna: "#2F4A3A", mirko: "#D8CFBE", clemens: "#6B6E72", sabine: "#4A7BB0" };
    const parts = doc("fotos2").split('<g data-t="').slice(1), who = parts.map((p) => C.CULPRITS.filter((k) => p.includes(`fill="${COL2[k]}"`)));
    if (parts.length !== 5 || who.some((w) => w.length !== 1) || !who.flat().includes(c) || /außer Atem|out of breath/.test(doc("fotos2"))) fail(`${tag} Nachher-Foto ${JSON.stringify(who)}`); }
  for (const d of D) (lens[d.id] ||= new Set()).add((d.html.match(/<tr>/g) || []).length + "/" + (d.html.replace(/<svg[\s\S]*?<\/svg>/g, "").match(/<p[\s>]/g) || []).length);
  if (!C.verhoerSystem(c, v, c).includes(C.LIES[c].say)) fail(`${tag} Prompt`);
}
// Go-live-Test 5 (H4): Toni sucht nach 23:00 und meldet „ja, nichts“ – jede Sperre der Festleitung beginnt spätestens 22:20 und ist um 23:00 vorbei
for (const [k, [t, txt]] of Object.entries(C.POSTEN)) {
  if (hm(t) > hm("22:20")) fail(`Festleitung ${k}: beginnt erst ${t}`);
  for (const m of txt.matchAll(/\b(\d\d):(\d\d)\b/g)) if (hm(m[0]) > hm("23:00")) fail(`Festleitung ${k}: ${m[0]} nach 23:00`);
  if (/kein Stroh mehr|plombiert|zugeklebt/i.test(txt)) fail(`Festleitung ${k}: Stelle danach nicht durchsuchbar`);
}
for (const [id, s] of Object.entries(lens)) if (s.size !== 1) fail(`Länge ${id}: ${[...s]}`);
console.log(err ? `${err} Fehler` : `${n} Kombinationen: alles eindeutig und gleich lang`);
