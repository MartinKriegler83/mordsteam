// Prüft Solo 002 für alle Kombinationen aus Täter × Variante: Eindeutigkeit der drei Fragen und gleich lange Beweisstücke.
// Aufruf: node tools/check_solo002.mjs
import * as C from "../lib/cases/solo-002.js";
const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
let err = 0, n = 0;
const fail = (m) => { err++; console.log("FEHLER", m); };
const lens = {};
for (let v = 0; v < C.VARIANTS; v++) for (const c of C.CULPRITS) {
  n++;
  const tag = `${c}/v${v}`, sol = C.solution(c, v), docs = C.docs(c, "Test", v);
  // Frage 1: genau ein Gegenstand im Fenster der Ärztin
  const txt = docs.find((d) => d.id === "aerztin").html.match(/etwa (\d+) bis (\d+) Minuten/);
  const lo = hm("22:12") - Number(txt[2]), hi = hm("22:12") - Number(txt[1]);
  const inWin = Object.keys(C.ITEMS).filter((k) => { const t = hm(C.ITEMS[k].t); return t >= lo && t <= hi; });
  if (inWin.length !== 1 || inWin[0] !== sol.gift) fail(`${tag} Frage 1: ${inWin}`);
  // Frage 2: Abdrücke (3 Verdächtige inkl. Täter) und nur der Täter ohne Beleg fürs Fenster
  const P = C.prints(c, v)[sol.gift].sus;
  if (P.length !== 3 || !P.includes(c)) fail(`${tag} Abdrücke ${P}`);
  const [a, b] = C.ITEMS[sol.gift].win.map(hm), S = C.slots(c, v);
  // Brandt (unschuldig, Pokal/Wasser): die ersten 2 Minuten deckt das Inspizientenbuch („von mir gesehen … direkt zur Bühnenpforte“), S2-1
  const insp = docs.find((d) => d.id === "inspizient").html;
  const cover = (k) => k === "felix" && /direkt zur Bühnenpforte|straight to the stage door/.test(insp) ? 2 : 0;
  const noAlibi = C.CULPRITS.filter((k) => !S[k].some(([x, y]) => x <= a + cover(k) && y >= b));
  if (noAlibi.length !== 1 || noAlibi[0] !== c) fail(`${tag} ohne Beleg: ${noAlibi}`);
  for (const k of C.CULPRITS) { const r = S[k]; for (let i = 1; i < r.length; i++) if (r[i][0] <= r[i - 1][1]) fail(`${tag} Überschneidung bei ${k}`); }
  // Täter-Eintrag darf das Fenster nicht einmal berühren
  if (S[c].some(([x, y]) => y >= a && x <= b)) fail(`${tag} Täter-Eintrag berührt Fenster`);
  // Frage 3: Code eindeutig, Tausch wirkt
  const codes = new Set(C.CULPRITS.map((k) => C.solution(k, v).code));
  if (codes.size !== 5 || !/^\d{4}$/.test(sol.code)) fail(`${tag} Codes`);
  // gleich lange Beweisstücke
  for (const d of docs) { const rows = (d.html.match(/<tr>/g) || []).length + "/" + (d.html.match(/<p/g) || []).length; (lens[d.id] ||= new Set()).add(rows); }
  if (!C.resolution(c, v).text) fail(`${tag} Auflösung`);
}
for (const [id, s] of Object.entries(lens)) if (s.size !== 1) fail(`Länge ${id}: ${[...s]}`);
console.log(err ? `${err} Fehler` : `${n} Kombinationen: alles eindeutig und gleich lang`);
