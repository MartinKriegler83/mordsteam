// Prüft Friends 002 „Vier Minuten Finsternis“: alle Gruppengrößen (4–8), alle Täter/Lockvogel-Paare, alle Zeitvarianten, viele Seeds.
// Jede Frage wird nur aus den Beweisstücken gelöst und muss genau die hinterlegte Lösung ergeben. Aufruf: node tools/check_friends002.mjs [en]
import * as DE from "../lib/cases/friends-002.js";
import * as EN from "../lib/cases/friends-002-en.js";
import { hutAt, TREE_COL, TW, TH, COLS, ROWS } from "../lib/art/friends002.js";
const en = process.argv[2] === "en", F = en ? EN : DE;
const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const hms = (t) => { const [h, m, s] = t.split(":").map(Number); return h * 3600 + m * 60 + (s || 0); };
const strip = (x) => x.replace(/<[^>]+>/g, "").trim();
const rows = (html) => [...html.matchAll(/<tr>(.*?)<\/tr>/gs)].map((m) => [...m[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map((c) => strip(c[1])));
const NAMES = ["Anna", "Bernd", "Clara", "David", "Eva", "Felix", "Gerda", "Hannes"];
let seed = 11; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
let bad = 0, runs = 0; const len = {}, sols = { zeit: new Set(), schluessel: new Set(), versteck: new Set(), motiv: new Set() };
const err = (...a) => { bad++; if (bad < 25) console.log("FEHLER", ...a); };
const RX = en ? { off: /Power failure/, aus: /Market lighting OFF \(lighting/, in: /put into the donation box/, out: /out of reach/, take: /Take one of mine/, closed: /Door closed/ }
  : { off: /Netzausfall/, aus: /Marktbeleuchtung AUS \(Licht/, in: /in die Spendenkassa gelegt/, out: /nicht greifbar/, take: /Nimm eine von meinen/, closed: /Tür geschlossen/ };
const GERMAN = /\b(und|der|die|das|nicht|Hütte|Schlüssel|Spendenkassa|Kassa|wird|ist|mit|von|Uhr)\b/;
for (let n = 4; n <= 8; n++) for (let c = 0; c < n; c++) for (let dd = 0; dd < n; dd++) for (let tv = 0; tv < 3; tv++) for (let trial = 0; trial < 3; trial++) {
  if (dd === c) continue;
  const S = DE.setup(n, rnd);
  // Täter/Lockvogel gezielt setzen, Stationen passend tauschen
  const swap = (a, b) => { [S.stations[a], S.stations[b]] = [S.stations[b], S.stations[a]]; };
  const ic = S.stations.findIndex((x, i) => i === S.culprit); swap(S.culprit, c); const kassa = S.stations.indexOf("kassa"); if (kassa !== dd) swap(kassa, dd);
  if (S.stations[c] === "kassa") continue;
  if (!["spuelen", "nachschub"].includes(S.stations[c])) { const b = S.stations.findIndex((x) => x === "spuelen" || x === "nachschub"); swap(b, c); }
  S.culprit = c; S.decoy = dd; S.tvar = tv;
  const G = DE.groupData(NAMES.slice(0, n).map((name) => ({ name, quirk: "snacks" })), S);
  runs++;
  const D = F.docs(G, 0), by = Object.fromEntries(D.map((d) => [d.id, d])), sol = F.solution(G), P = G.players;
  for (const k of Object.keys(sols)) sols[k].add(sol[k]);
  for (const d of D) { const key = n + ":" + d.id, cc = rows(d.html).length + ":" + (d.html.match(/<p[ >]/g) || []).length + ":" + (d.html.match(/<g data-/g) || []).length; if (len[key] && len[key] !== cc) err("Länge", n, d.id, cc, len[key]); len[key] = len[key] || cc; }
  // Frage 1: Kassa-Versatz aus Netzausfall vs. Stromprotokoll
  const sr = rows(by.strom.html).slice(1), br = rows(by.bons.html).slice(1);
  const aus = hms(sr.find((r) => RX.aus.test(r[1]))[0]), netz = hms(br.find((r) => RX.off.test(r[2]))[0]);
  const off = Math.round((netz - aus) / 60) * 60;
  const tin = hms(br.find((r) => RX.in.test(r[2]))[0]) - off, tout = hms(br.find((r) => RX.out.test(r[2]))[0]) - off;
  const mm = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}`;
  if (mm(tin) !== mm(tout) || mm(tin) !== sol.zeit) err("Frage 1", n, mm(tin), mm(tout), sol.zeit);
  if (mm(tin + off) === sol.zeit) err("Frage 1 Falle fehlt", n);
  if (tin < aus || tout > aus + 240) err("Frage 1 außerhalb der Finsternis", n);
  // Frage 2: Marke → Besitzer → Chat → Alibi
  const nr = Number(by.kuehlhuette.html.match(/(?:Nummer|number) (\d+)/)[1]);
  const owner = rows(by.marken.html).slice(1).find((r) => r[1].split(", ").map(Number).includes(nr))[0];
  const ch = rows(by.chat.html).slice(1), ti = ch.findIndex((r) => RX.take.test(r[2]));
  if (ch[ti][1] !== owner) err("Frage 2 Chat-Besitzer", n);
  const asker = ch.slice(0, ti).reverse().find((r) => r[1] !== owner)[1];
  const close = hms(rows(by.aggregat.html).slice(1).filter((r) => RX.closed.test(r[1])).map((r) => r[0]).filter((t) => hms(t) > aus && hms(t) < aus + 600)[0]);
  const alibi = br.some((r) => r[1] === owner && Math.abs(hms(r[0]) - off - close) <= 20);
  if (!alibi || "p" + P.findIndex((p) => p.name === asker) !== sol.taeter) err("Frage 2", n, owner, asker, sol.taeter);
  const sched = rows(by.schicht.html).slice(1).find((r) => r[0] === asker)[2];
  if (!/hinten|at the back/.test(sched)) err("Frage 2 Täter vorne", n);
  if (close < aus || close > aus + 240) err("Kühlhütte außerhalb der Finsternis", n);
  // Frage 3: Brett gegen Anhänger-Liste
  const hooks = [...by.brett.html.matchAll(/<g data-hook="([^"]*)" data-tag="([^"]*)">/g)].map((m) => ({ label: m[1], tag: m[2] }));
  const list = rows(by.anhaenger.html).slice(1), SN = (k) => (en ? "en" : "de") && k;
  const nameOfShape = Object.fromEntries(Object.entries((await import("../lib/art/friends002.js")).SHAPE_NAME[en ? "en" : "de"]).map(([k, v]) => [v, k]));
  const tagOfHook = Object.fromEntries(list.map((r, i) => [i, nameOfShape[r[1]]]));
  const wrong = hooks.map((h, i) => ({ h, i })).filter(({ h, i }) => h.tag && h.tag !== tagOfHook[i]);
  if (wrong.length !== 1 || wrong[0].i !== 0) err("Frage 3 falsche Anhänger", n, wrong.length);
  const realIdx = Object.entries(tagOfHook).find(([, t]) => t === wrong[0].h.tag)[0];
  const ans3 = list[realIdx][0].match(/(\d+)/)[1];
  if (ans3 !== sol.schluessel) err("Frage 3", n, ans3, sol.schluessel);
  const empty = hooks.map((h, i) => (h.tag ? null : i)).filter((x) => x !== null);
  if (empty.length !== 2 || !empty.includes(Number(realIdx))) err("Frage 3 leere Haken", n);
  const other = list[empty.find((i) => i !== Number(realIdx))][0].match(/(\d+)/)[1];
  if (!new RegExp(`(Hütte|hut) ${other} –`).test(by.anhaenger.html)) err("Frage 3 zweiter leerer Haken nicht erklärt", n);
  // Frage 4: Schablone, Kerbe unten an der Baumspitze
  const R = DE.roundOf(G), closed = rows(by.geschlossen.html).slice(1).map((r) => Number(r[0]));
  const notch = Number(by.karton.html.match(/L(\d+(?:\.\d+)?),\d+ L\d+(?:\.\d+)?,\d+ L0,/)?.[1] ?? NaN);
  const p = Math.round((notch - 11 - 40) / 80);
  if (p !== R.p) err("Kerbe", n, p, R.p);
  const under = (x, y) => R.holes.map(([i, j]) => hutAt(x + i, y + j));
  const hit = under(TREE_COL - p, ROWS - TH).filter((h) => closed.includes(h));
  if (hit.length !== 1 || String(hit[0]) !== sol.versteck) err("Frage 4", n, hit, sol.versteck);
  let traps = 0; for (let x = 0; x <= COLS - TW; x++) for (let y = 0; y <= ROWS - TH; y++) if (!(x === TREE_COL - p && y === ROWS - TH) && under(x, y).filter((h) => closed.includes(h)).length === 1) traps++;
  if (traps < 2) err("Frage 4 zu leicht", n, traps);
  if ([sol.schluessel, other].includes(sol.versteck)) err("Frage 4 = Schlüsselbrett-Hütte", n);
  // Frage 5: Sterne lesen
  const word = [...by.plakat.html.matchAll(/<g data-b="s">.*?<text[^>]*>([^<]*)<\/text>/gs)].map((m) => m[1]).join("");
  const mi = DE.MOTIVES.findIndex((m) => m[en ? "en" : "de"] === word);
  if ("m" + mi !== sol.motiv) err("Frage 5", n, word, sol.motiv);
  const opt = F.questions(G)[4].options[mi][1];
  if (!opt.toUpperCase().includes(word.slice(0, 4))) err("Frage 5 Option passt nicht zum Wort", word, opt);
  // Platzhalter, Sprache
  const all = D.map((d) => d.html).join("") + Object.values(F.hints(G)).flat().join(" ") + F.resolution(G).text + JSON.stringify(F.questions(G)) + JSON.stringify(F.briefing("Anna"));
  if (/undefined|NaN|\$\{|\[object/.test(all)) err("Platzhalter", n);
  if (en && GERMAN.test(strip(all).replace(/Kerzenthal|Christkind|Brunner|Gruber|Petra Hold|Hofer|Strobl|Pammer|Wagenhofer|Eibl|KühlTec|Elektro|Lángos/g, ""))) err("Deutsch im Englischen", n, strip(all).match(GERMAN)[0]);
}
for (const [k, v] of Object.entries(sols)) if (v.size < 3) err("zu wenig Varianz", k, [...v]);
console.log(`${runs} Gruppen geprüft (${en ? "EN" : "DE"}; 4–8 Spieler, alle Täter/Lockvogel-Paare, 3 Zeitvarianten, je 3 Seeds); Lösungen: Zeit ${sols.zeit.size}, Schlüssel ${sols.schluessel.size}, Versteck ${sols.versteck.size}, Motiv ${sols.motiv.size}`);
console.log(bad ? `FEHLER: ${bad}` : "alles eindeutig und gleich lang");
process.exit(bad ? 1 : 0);
