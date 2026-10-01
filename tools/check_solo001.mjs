// Prüft Solo 001 für alle Kombinationen aus Täter × Zeitvariante: Lösung im Text auffindbar,
// keine Widersprüche aus dem Spieltest (Kofler, Bons, Blister) und gleich lange Beweisstücke.
// Aufruf: node tools/check_solo001.mjs
import * as C from "../lib/cases/solo-001.js";
let err = 0, n = 0;
const fail = (m) => { err++; console.log("FEHLER", m); };
const lens = {};
for (let v = 0; v < C.TIME_SHIFTS.length; v++) for (const c of C.CULPRITS) {
  n++;
  const tag = `${c}/v${v}`, sol = C.solution(c, v), D = C.docs(c, "Test", v);
  const doc = (id) => (D.find((d) => d.id === id) || {}).html || "";
  if (!doc("tuer").includes(`>${sol.zeit}<`)) fail(`${tag} Tatzeit ${sol.zeit} fehlt im Türprotokoll`);
  if (!/einlassen oder hinausgehen/.test(doc("tuer"))) fail(`${tag} Taster-Erklärung fehlt`);
  const all = D.map((d) => d.html).join(" ");
  if (/2 × Pfefferminztee/.test(all)) fail(`${tag} 2 × Pfefferminztee`);
  const kofler = all.split("Anton Kofler, Dienstabteil 1")[1] || "";
  const kStmt = kofler.slice(0, kofler.indexOf("</p>", kofler.indexOf("<p class=\"a\">")));
  if (c === "sofia" && /halb zwei|01:3/.test(kStmt)) fail(`${tag} Kofler bestätigt Sofias falsche Zeit`);
  if (!C.SPOTS[sol.versteck]) fail(`${tag} Versteck unbekannt`);
  const r = C.resolution(c, v);
  if (!/Blister/.test(r.text)) fail(`${tag} Blister in der Auflösung fehlt`);
  for (const d of D) (lens[d.id] ||= new Set()).add((d.html.match(/<tr>/g) || []).length + "/" + (d.html.match(/<p/g) || []).length);
}
for (const [id, s] of Object.entries(lens)) if (s.size > 2) fail(`Länge ${id}: ${[...s]}`);
console.log(err ? `${err} Fehler` : `${n} Kombinationen: Lösung auffindbar, keine bekannten Widersprüche`);
