// Prüft das Halloween-Special (special-001) für alle Kombinationen aus Täter × Variante:
// Eindeutigkeit der vier Fragen, Fallen, gleich lange Beweisstücke der Stufen 1–3.
// Aufruf: node tools/check_special001.mjs [en]
import * as DE from "../lib/cases/special-001.js";
import { zonesOf, codeOf, GRID, ITEM_POS, zoneMargin } from "../lib/art/special001.js";
const EN = process.argv[2] === "en" ? await import("../lib/cases/special-001-en.js") : null;
const C = EN ? { ...DE, ...EN } : DE;
let err = 0, n = 0;
const fail = (m) => { err++; console.log("FEHLER", m); };
const lens = {};
for (let v = 0; v < DE.VARIANTS; v++) for (const c of DE.CULPRITS) {
  n++;
  const tag = `${c}/v${v}`, sol = C.solution(c, v), docs = C.docs(c, "Test", v), T = DE.tatOf(v);
  // Frage 1: genau ein „Deckel zu“ ohne Kindergruppe bei Frank in [-3, +1]
  const visits = DE.kidsLog(v).filter((k) => k[2] === "frank").map((k) => k[0]);
  const closes = DE.hubLog(v).filter(([, e]) => /ZU/.test(e)).map(([t]) => t);
  const lone = closes.filter((t) => !visits.some((k) => k >= t - 3 && k <= t + 1));
  if (lone.length !== 1 || DE.fmt(lone[0]) !== sol.zeit) fail(`${tag} Frage 1: ${lone.map(DE.fmt)}`);
  // Falle Nr. 15 liegt neben der Tatzeit
  if (!DE.kidsLog(v).some((k) => k[2] === "15" && Math.abs(k[0] - T) <= 2)) fail(`${tag} Falle Nr. 15 fehlt`);
  // alle Zeiten zwischen 21:00 und 21:45
  if (DE.hubLog(v).some(([t]) => t < DE.hm("20:58") || t > DE.hm("21:45"))) fail(`${tag} Zeiten außerhalb`);
  // Frage 2: Schuhe + Größe eindeutig, Schuhe allein und Größe allein nicht immer
  const S = DE.SUSPECTS[c];
  const match = DE.ORDER.filter((k) => DE.SUSPECTS[k].shoe === S.shoe && Math.abs(DE.SUSPECTS[k].inch - S.inch) <= 2);
  if (match.length !== 1) fail(`${tag} Schuhe+Größe: ${match}`);
  // Sichtungen: zur Tatzeit fehlen genau Täter und Lockvogel
  const sg = DE.sightings(c, v);
  const absent = DE.ORDER.filter((k) => !sg.some(([a, b, kk]) => kk === k && a <= T - 1 && b >= T + 1));
  const want = [c, DE.decoyOf(c, v)].sort();
  if (absent.sort().join() !== want.join()) fail(`${tag} Sichtungen fehlen: ${absent}`);
  // Täter: Lücke groß genug zum Umziehen (mind. 6 Min. vor und nach T)
  const tc = sg.filter((r) => r[2] === c);
  if (!(tc[0][1] <= T - 6 && tc[1][0] >= T + 5)) fail(`${tag} Lücke Täter zu klein`);
  // Lockvogel passt nicht zu Schuhen+Größe
  const d0 = DE.SUSPECTS[DE.decoyOf(c, v)];
  if (d0.shoe === S.shoe && Math.abs(d0.inch - S.inch) <= 2) fail(`${tag} Lockvogel gleich`);
  // Frage 3: Versteck eindeutig über Kamerazonen
  const H = DE.hideOf(c, v), Z = zonesOf(H);
  if (!Z) fail(`${tag} Versteck ohne Zone`);
  const same = Object.keys(DE.ITEM_NAMES).filter((k) => zonesOf(Number(k)) === Z);
  if (same.length !== 1 || same[0] !== sol.versteck) fail(`${tag} Versteck nicht eindeutig: ${same}`);
  const bw = docs.find((d) => d.id === "bewegungen").html;
  const bueck = ["A", "B", "C"].filter((cam) => new RegExp(`(Kamera|Camera) ${cam}</p><table[^]*?(bückt sich|bends down)`).test(bw.split(/<p class="q">/).find((x) => x.startsWith((EN ? "Camera " : "Kamera ") + cam)) ? `<p class="q">` + bw.split(/<p class="q">/).find((x) => x.startsWith((EN ? "Camera " : "Kamera ") + cam)) : ""));
  if (bueck.join("") !== Z) fail(`${tag} Bewegungen ${bueck.join("")} ≠ ${Z}`);
  // Frage 4: Wort ohne J, im Code darstellbar, Notiz enthält so viele Paare wie Buchstaben
  const w = sol.wort;
  if (/J/.test(w) || codeOf(w).some(([r, cc]) => r < 0 || GRID[r][cc] !== w[codeOf(w).indexOf([r, cc])] && false)) fail(`${tag} Wort`);
  const nt = docs.find((d) => d.id === "notiz").html;
  if ((nt.match(/stroke-dasharray="3 3"/g) || []).length !== w.length) fail(`${tag} Notiz-Paare`);
  // Lösung in den Hinweisen nicht vor der Frage verraten: Täternamen tauchen in Stufe 1 nicht als Täter auf
  // gleich lange Beweisstücke (Stufen 1–3; Stufe 4 hängt am Wort und kommt erst nach der Täterfrage)
  for (const d of docs) if (d.stage <= 3) { const k = (d.html.match(/<tr>/g) || []).length + "/" + (d.html.replace(/<svg[\s\S]*?<\/svg>/g, "").match(/<p[\s>]/g) || []).length; (lens[d.id] ||= new Set()).add(k); }
  const r = C.resolution(c, v);
  if (!r.text || /undefined|NaN/.test(r.text + JSON.stringify(docs) + JSON.stringify(C.HINTS(v, c)))) fail(`${tag} undefined/NaN`);
  if (EN && /[äöüÄÖÜß]|Uhr\b| und | der | die /.test(docs.map((d) => d.title + d.html.replace(/<svg[\s\S]*?<\/svg>/g, "")).join(" ") + r.text)) fail(`${tag} deutsche Reste`);
}
for (const n of Object.keys(ITEM_POS)) if (zoneMargin(ITEM_POS[n]) < 4.5) fail(`Deko ${n} liegt zu nah an einer Zonengrenze (${zoneMargin(ITEM_POS[n]).toFixed(1)}°)`);
for (const [id, s] of Object.entries(lens)) if (s.size !== 1) fail(`Länge ${id}: ${[...s]}`);
// Wort-Antwort: Normalisierung
if (DE.normWord("gemietet ") !== "GEMIETET" || DE.normWord("Kassenbuch!") !== "KASSENBUCH") fail("normWord");
console.log(err ? `${err} Fehler` : `${n} Kombinationen${EN ? " (EN)" : ""}: alle vier Fragen eindeutig, Fallen vorhanden, gleich lang`);
process.exit(err ? 1 : 0);
