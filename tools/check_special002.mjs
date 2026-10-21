// Prüft das Weihnachts-Special (special-002) für alle Kombinationen aus Täter × Variante, Deutsch und Englisch:
// Eindeutigkeit der vier Fragen, Fallen, gleich lange Beweisstücke der Stufen 1–3, keine deutschen Reste im Englischen.
// Aufruf: node tools/check_special002.mjs
import * as DE from "../lib/cases/special-002.js";
import * as EN from "../lib/cases/special-002-en.js";
import { hutAt, COLS, ROWS, TW, TH, TOWER_COL, KEYPOS } from "../lib/art/special002.js";
let err = 0, n = 0;
const fail = (m) => { err++; console.log("FEHLER", m); };
const lens = {};
const strip = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, "");
for (const [lang, C] of [["de", DE], ["en", { ...DE, ...EN }]]) for (let v = 0; v < DE.VARIANTS; v++) for (const c of DE.CULPRITS) {
  n++;
  const tag = `${lang} ${c}/v${v}`, R = DE.roundOf(c, v), sol = C.solution(c, v), docs = C.docs(c, "Test", v);
  // Frage 1: Fenster, Turmuhr-Versatz, Riegel-Foto
  if (!(R.T > R.D0 && R.T < R.D0 + 4)) fail(`${tag} Tatzeit nicht im Dunkel`);
  if (R.off < 2 || R.off > 4) fail(`${tag} Vorgehen ${R.off}`);
  if (DE.fmt(R.T) !== sol.zeit) fail(`${tag} Lösung Zeit`);
  if (R.t2 === R.T || R.t2 <= R.D0 || R.t2 >= R.D0 + 4) fail(`${tag} Foto 2 Zeit`);
  // die rohe Uhrzeit vom Riegel-Foto ist nie die Lösung (Falle)
  if (R.T + R.off === R.T) fail(`${tag} keine Falle`);
  const strom = docs.find((d) => d.id === "strom").html;
  if (!strom.includes(DE.fmt(R.D0 + 4) + ":05")) fail(`${tag} Baum EIN fehlt im Stromprotokoll`);
  const fotos = docs.find((d) => d.id === "fotos").html;
  if ((fotos.match(/<svg/g) || []).length !== 4) fail(`${tag} vier Fotos`);
  // Frage 2: genau zwei mit dem Motiv, der Lockvogel hat die Aushilfe beim Kinderpunsch
  const withM = DE.ORDER.filter((k) => R.mug[k] === R.M);
  if (withM.length !== 2 || !withM.includes(c) || !withM.includes(R.decoy)) fail(`${tag} Häferl-Paar ${withM}`);
  const counts = {}; for (const k of DE.ORDER) counts[R.mug[k]] = (counts[R.mug[k]] || 0) + 1;
  if (Object.values(counts).sort().join() !== "1,2,2") fail(`${tag} Motive nicht 2/2/1: ${JSON.stringify(counts)}`);
  if (R.decoy === "jonas" || R.decoy === c) fail(`${tag} Lockvogel ${R.decoy}`);
  const sp = docs.find((d) => d.id === "schichtplan").html;
  const helpers = DE.ORDER.filter((k) => new RegExp(`${C.SUSPECTS[k].name.replace(/[“”„]/g, ".")}</td><td>[^<]*(Kinderpunsch|Children’s punch)`).test(sp));
  if (helpers.length !== 1 || helpers[0] !== R.decoy) fail(`${tag} Schichtplan Aushilfe: ${helpers}`);
  // Frage 3: Schablone – an der richtigen Lage genau eine geschlossene Hütte, und das ist das Versteck
  const show = (x, y) => R.holes.map(([i, j]) => hutAt(x + i, y + j));
  const atRight = show(R.x0, 0).filter((h) => R.closed.includes(h));
  if (atRight.length !== 1 || atRight[0] !== R.hide || String(R.hide) !== sol.versteck) fail(`${tag} Schablone: ${atRight}`);
  if (R.x0 + R.p !== TOWER_COL) fail(`${tag} Kerbe nicht am Turm`);
  let notch = 0; for (let x = 0; x <= COLS - TW; x++) for (let y = 0; y <= ROWS - TH; y++) if (x + R.p === TOWER_COL && y === 0) notch++;
  if (notch !== 1) fail(`${tag} Kerbe am Turm nicht eindeutig (${notch})`);
  if (R.closed.length !== 6 || new Set(R.closed).size !== 6) fail(`${tag} geschlossene Hütten ${R.closed}`);
  if ([5, 9, 12, 13, 14, 16, 21, 24].some((h) => R.closed.includes(h))) fail(`${tag} besondere Hütte geschlossen`);
  let traps = 0; for (let x = 0; x <= COLS - TW; x++) for (let y = 0; y <= ROWS - TH; y++) if (!(x === R.x0 && y === 0) && show(x, y).filter((h) => R.closed.includes(h)).length === 1) traps++;
  if (traps < 2) fail(`${tag} zu wenig Fallen (${traps})`);
  const gs = docs.find((d) => d.id === "geschlossen").html;
  for (const h of R.closed) if (!gs.includes(`<td class="mono">${h}</td>`)) fail(`${tag} Aushang ohne ${h}`);
  // Frage 4: Code aus Staubzucker + Form eindeutig, Ziffern verschieden
  if (new Set(R.code).size !== 4 || R.codeStr !== sol.code) fail(`${tag} Code ${R.codeStr}`);
  const vec = R.code.slice(1).map((k, i) => { const [a, b] = KEYPOS(R.code[i]), [x, y] = KEYPOS(k); return [x - a, y - b]; });
  if (DE.pathMatches(R.keys, vec).length !== 1) fail(`${tag} Tastenweg nicht eindeutig`);
  const kp = docs.find((d) => d.id === "kassa").html;
  if ((kp.match(/opacity="\.92"/g) || []).length !== 4 * 26) fail(`${tag} Staubzucker nicht auf genau vier Tasten`);
  // gleich lange Beweisstücke (Stufen 1–3) je Sprache
  for (const d of docs) if (d.stage <= 3) { const k = (d.html.match(/<tr>/g) || []).length + "/" + (strip(d.html).match(/<p[\s>]/g) || []).length; (lens[lang + ":" + d.id] ||= new Set()).add(k); }
  const r = C.resolution(c, v), hints = C.HINTS(v, c);
  if (!r.text || /undefined|NaN|\[object/.test(r.text + JSON.stringify(docs) + JSON.stringify(hints) + JSON.stringify(C.briefing("X")))) fail(`${tag} undefined/NaN`);
  if (!r.text.includes(R.codeStr) || !r.text.includes(DE.fmt(R.T))) fail(`${tag} Auflösung unvollständig`);
  if (lang === "en" && /[äöüÄÖÜß]|\bUhr\b| und | der | die | das |Hütte|„/.test(docs.map((d) => d.title + strip(d.html)).join(" ") + r.text + JSON.stringify(hints) + JSON.stringify(C.QUESTIONS) + JSON.stringify(C.briefing("X")))) {
    const all = docs.map((d) => d.title + strip(d.html)).join(" ") + r.text + JSON.stringify(hints) + JSON.stringify(C.QUESTIONS) + JSON.stringify(C.briefing("X"));
    fail(`${tag} deutsche Reste: ${(all.match(/.{20}([äöüÄÖÜß]|\bUhr\b| und | der | die | das |Hütte|„).{20}/) || [""])[0]}`);
  }
  if (docs.length !== 16) fail(`${tag} ${docs.length} Akten`);
}
for (const [id, s] of Object.entries(lens)) if (s.size !== 1) fail(`Länge ${id}: ${[...s]}`);
console.log(err ? `${err} Fehler` : `${n} Kombinationen (DE+EN): alle vier Fragen eindeutig, Fallen vorhanden, gleich lang`);
process.exit(err ? 1 : 0);
