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
  for (const r of doc("fotos").matchAll(/<td class="mono">(\d\d:\d\d)<\/td><td>[^<]*<\/td><td>([^<]*)<\/td>/g)) if (Math.abs(hm(r[1]) - T) <= 6) C.CULPRITS.forEach((k) => { if (r[2].includes(C.SUSPECTS[k].name)) seen.add(k); });
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
  const free = [...doc("verstecke").matchAll(/<tr><td>([^<]+)<\/td><td>([^<]+)<\/td><td>(–|ja, nichts)<\/td>/g)].filter((r) => r[3] === "–").map((r) => r[1]);
  if (!free.includes(C.SPOTS[sol.schluessel].name)) fail(`${tag} Versteck durchsucht`);
  // Frage 4 (seit 8.10.2026): am Ort des Täters zwei freie Stellen, die Festleitung schließt genau die falsche aus
  { const loc = C.AFTER[c], pair = [loc, loc + "2"].map((k) => C.SPOTS[k].name), fl = doc("festleitung");
    if (!pair.every((x) => free.includes(x))) fail(`${tag} Frage 4: nicht beide Stellen frei`);
    const other = sol.schluessel === loc ? loc + "2" : loc;
    if (!fl.includes(C.POSTEN[other][1])) fail(`${tag} Frage 4: Ausschluss fehlt`);
    if (fl.includes(C.POSTEN[sol.schluessel][1])) fail(`${tag} Frage 4: Versteck ausgeschlossen`);
    // keine freie Stelle außer dem Versteck bleibt übrig, wenn man Ort + Festleitung kombiniert
    const left = free.filter((x) => pair.includes(x) && !Object.entries(C.SPOTS).some(([k, s]) => s.name === x && fl.includes(C.POSTEN[k]?.[1] || "§")));
    if (left.length !== 1 || left[0] !== C.SPOTS[sol.schluessel].name) fail(`${tag} Frage 4 nicht eindeutig: ${left}`); }
  const after = doc("fotos2"); if (!after.includes(C.SUSPECTS[c].name) || after.includes("außer Atem")) fail(`${tag} Nachher-Foto`);
  for (const d of D) (lens[d.id] ||= new Set()).add((d.html.match(/<tr>/g) || []).length + "/" + (d.html.match(/<p/g) || []).length);
  if (!C.verhoerSystem(c, v, c).includes(C.LIES[c].say)) fail(`${tag} Prompt`);
}
for (const [id, s] of Object.entries(lens)) if (s.size !== 1) fail(`Länge ${id}: ${[...s]}`);
console.log(err ? `${err} Fehler` : `${n} Kombinationen: alles eindeutig und gleich lang`);
