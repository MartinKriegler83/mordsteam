// Prüft Friends 001: für jede Gruppengröße (4–8), jede Aktivität des Täters und jede Zeitvariante
// genau eine Lösung je Frage und gleich lange Beweisstücke (Länge darf nur von der Gruppengröße abhängen).
// Aufruf: node tools/check_friends.mjs
import * as F from "../lib/cases/friends-001.js";
const txt = (h) => h.replace(/<\/t[dh]>/g, " | ").replace(/<tr>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
const hm = (t) => { const [h, m] = t.split(":").map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
const rows = (html) => [...html.matchAll(/<tr>(.*?)<\/tr>/gs)].map((m) => [...m[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map((c) => c[1].replace(/<[^>]+>/g, "")));
const NAMES = ["Anna", "Bernd", "Clara", "David", "Eva", "Felix", "Gerda", "Hannes"];
let seed = 7; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
let bad = 0, runs = 0; const len = {};
const err = (...a) => { bad++; if (bad < 25) console.log("FEHLER", ...a); };
for (let n = 4; n <= 8; n++) for (const cAct of ["karten", "balkon", "bett"]) for (let tv = 0; tv < F.TIME_SHIFTS.length; tv++) for (let trial = 0; trial < 6; trial++) {
  const S = F.setup(n, rnd);
  // Täter mit der gewünschten Aktivität erzwingen, Zeitvariante setzen, Bier-Person neu wählen
  const pool = S.acts.map((a, i) => i).filter((i) => S.acts[i] === cAct);
  S.culprit = pool[trial % pool.length]; S.tvar = tv;
  const beers = S.acts.map((a, i) => i).filter((i) => S.acts[i] === "karten" && i !== S.culprit); S.beer = beers[trial % beers.length];
  const G = { players: NAMES.slice(0, n).map((name, i) => ({ name, quirk: F.QUIRK_KEYS[rnd(F.QUIRK_KEYS.length)], act: S.acts[i], room: S.rooms[i] })), culprit: S.culprit, tvar: S.tvar, beer: S.beer };
  runs++;
  const D = F.docs(G, 0), by = Object.fromEntries(D.map((d) => [d.id, d])), sol = F.solution(G), s = F.timer(G.tvar);
  // gleiche Länge je Gruppengröße
  for (const d of D) { const k = n + ":" + d.id, c = rows(d.html).length + ":" + (d.html.match(/<p[ >]/g) || []).length + ":" + (d.html.match(/<li>/g) || []).length; if (len[k] && len[k] !== c) err("Länge", n, d.id, c, len[k]); len[k] = len[k] || c; }
  // Frage 1: Sollwert-Änderung ohne Türereignis in ±2 Min.
  const sr = rows(by.sauna.html).slice(1);
  const door = sr.filter((r) => /Saunatür/.test(r[1])).map((r) => hm(r[0]));
  const q1 = sr.filter((r) => /→/.test(r[1]) && !door.some((t) => Math.abs(t - hm(r[0])) <= 2)).map((r) => r[0]);
  if (q1.length !== 1 || q1[0] !== sol.zeit) err("Frage 1", n, G.tvar, q1, sol.zeit);
  // Frage 2: wer hat für das Tatfenster [T-2, T+8] keinen Beleg?
  const T = hm(sol.zeit), lo = T - 2, hi = T + 8, has = new Set();
  for (const r of rows(by.karten.html).slice(1)) { const st = hm(r[1]); if (st <= hi && st + 9 >= lo) for (const p of G.players) if (r[2].includes(p.name)) has.add(p.name + "@k" + st); }
  const kartenOK = (p) => rows(by.karten.html).slice(1).filter((r) => { const st = hm(r[1]); return st <= hi && st + 9 >= lo; }).every((r) => r[2].includes(p.name));
  const balkonOK = (p) => rows(by.balkon.html).slice(1).filter((r) => hm(r[1]) >= lo && hm(r[1]) <= hi).every((r) => r[2].includes(p.name));
  const bettOK = (p) => rows(by.tracker.html).slice(1).filter((r) => r[0] === p.name && hm(r[1]) < hi && hm(r[2]) > lo).every((r) => r[3] !== "wach");
  const noAlibi = G.players.map((p, i) => ({ p, i })).filter(({ p }) => !({ karten: kartenOK, balkon: balkonOK, bett: bettOK })[p.act](p)).map((x) => "p" + x.i);
  if (noAlibi.length !== 1 || noAlibi[0] !== sol.taeter) err("Frage 2", n, G.players[G.culprit].act, noAlibi, sol.taeter);
  // Frage 3: Bereiche, die der Täter nach der Kamera erreichen konnte
  const app = rows(by.app.html).slice(1), sd = hm(app.find((r) => /Speicherkarte/.test(r[2]))[0]);
  const act = G.players[G.culprit].act;
  if (app.some((r) => r[1] === "Keller" && hm(r[0]) > sd)) err("Keller nach der Kamera", n);
  const areas = new Set(["Stube", "Flur", "Obergeschoss", "Balkon"]);                  // später ins Bett: Flur + Obergeschoss
  if (act === "karten") areas.add("Küche");                                            // Küche nur für die Kartenspieler selbst
  if (act === "bett") areas.delete("Balkon");
  if (/Vom Balkon/.test(by.schnee.html)) areas.add("draußen");
  const vs = rows(by.verstecke.html).slice(1);
  const cand = Object.entries(F.SPOTS).filter(([k, x]) => areas.has(x.area) && k !== "austrag" && vs.find((r) => r[0] === x.name)[3] !== "ja, leer").map(([k]) => k);
  if (cand.length !== 1 || cand[0] !== sol.versteck) err("Frage 3", n, act, cand, sol.versteck);
  if (/\{|undefined|NaN/.test(D.map((d) => d.html).join(""))) err("Platzhalter", n);
}
console.log(`${runs} Gruppen geprüft (4–8 Spieler, alle Täter-Typen, alle Zeitvarianten)`);
console.log(bad ? `FEHLER: ${bad}` : "alles eindeutig und gleich lang");
