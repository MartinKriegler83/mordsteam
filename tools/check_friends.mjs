// Prüft Friends 001 (Version 2): alle Gruppengrößen (4–8), Täter- und Lockvogel-Gruppe, Zeitvarianten, Krimiabend und Plus.
// Genau eine Lösung je Frage und gleich lange Beweisstücke (je Gruppengröße und Variante). Aufruf: node tools/check_friends.mjs
import * as F from "../lib/cases/friends-001.js";
const hm = (t) => { const [h, m] = t.split(":").map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
const rows = (html) => [...html.matchAll(/<tr>(.*?)<\/tr>/gs)].map((m) => [...m[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map((c) => c[1].replace(/<[^>]+>/g, "")));
// Zeitraffer als Bild (9.10.): je Bild [Nr, Zeit, Namen auf der Bank] wie früher die Tabellenzeilen
const frameRows = (html) => [["Bild", "Zeit", "Namen"], ...html.split('<g data-f="').slice(1).map((g) => { const tx = [...g.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]); const t = tx.find((x) => /^\d\d:\d\d$/.test(x)); return [tx[tx.length - 1] === t ? tx[0] : tx.find((x) => /^\d\d$/.test(x)), t, tx.filter((x) => x !== t && !/^\d\d$/.test(x)).join(", ")]; })];
// Punkteblock als Bild (9.10.): je Runde [Nr, Beginn, Namen mit Punkten] – leeres Feld = nicht am Tisch
const blockRows = (html) => { const tx = (h) => [...h.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]); const head = tx(html.split('<g data-h="1">')[1].split("</g>")[0]);
  return [["Runde", "Beginn", "Am Tisch"], ...html.split('<g data-r="').slice(1).map((g) => { const t = tx(g.split('<g data-p=')[0]); return [t[0].replace(".", ""), t[1], [...g.matchAll(/<g data-p="(\d+)">/g)].map((m) => head[+m[1]]).join(", ")]; })]; };
const NAMES = ["Anna", "Bernd", "Clara", "David", "Eva", "Felix", "Gerda", "Hannes"];
let seed = 7; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
let bad = 0, runs = 0; const len = {};
const err = (...a) => { bad++; if (bad < 25) console.log("FEHLER", ...a); };
const AREA = { "Schuhschrank im Flur": "Flur", "Blumentrog auf dem Balkon": "Balkon", "Skiraum im Keller": "Keller", "Bad im Obergeschoss": "Obergeschoss", "Kellerkühlschrank": "Keller", "Holzschuppen draußen": "draußen", "Holzkorb neben dem Kachelofen, Stube": "geprüft", "Zuckerdose im Küchenregal": "geprüft" };  // geprüft = ausdrücklich leer, kein Kandidat
for (let n = 4; n <= 8; n++) for (const cAct of ["karten", "balkon"]) for (const dAct of ["karten", "balkon"]) for (let tv = 0; tv < F.TIME_SHIFTS.length; tv++) for (const plus of [false, true]) for (let trial = 0; trial < 4; trial++) {
  const S = F.setup(n, rnd);
  const pool = S.acts.map((a, i) => i).filter((i) => S.acts[i] === cAct);
  S.culprit = pool[trial % pool.length];
  const dpool = S.acts.map((a, i) => i).filter((i) => S.acts[i] === dAct && i !== S.culprit);
  if (!dpool.length) continue;
  if ((cAct === "karten") + (dAct === "karten") > F.MIX[n][0] - 2) continue;   // am Würfeltisch bleiben immer mindestens zwei (F-8)
  S.decoy = dpool[trial % dpool.length]; S.tvar = tv;
  const beers = S.acts.map((a, i) => i).filter((i) => S.acts[i] === "karten" && i !== S.culprit && i !== S.decoy); S.beer = beers.length ? beers[0] : S.decoy;
  const G = { players: NAMES.slice(0, n).map((name, i) => ({ name, quirk: F.QUIRK_KEYS[rnd(F.QUIRK_KEYS.length)], act: S.acts[i], room: S.rooms[i] })), culprit: S.culprit, decoy: S.decoy, tvar: tv, beer: S.beer, excuse: trial % 4, plus };
  runs++;
  const D = F.docs(G, 0), by = Object.fromEntries(D.map((d) => [d.id, d])), sol = F.solution(G);
  for (const d of D) { if (d.id === "app") continue; const k = n + ":" + plus + ":" + d.id, c = rows(d.html).length + ":" + (d.html.match(/<p[ >]/g) || []).length; if (len[k] && len[k] !== c) err("Länge", n, plus, d.id, c, len[k]); len[k] = len[k] || c; }
  // Frage 1
  const sr = rows(by.sauna.html).slice(1), door = sr.filter((r) => /Saunatür/.test(r[1])).map((r) => hm(r[0]));
  const q1 = sr.filter((r) => /→/.test(r[1]) && !door.some((t) => Math.abs(t - hm(r[0])) <= 2)).map((r) => r[0]);
  if (q1.length !== 1 || q1[0] !== sol.zeit) err("Frage 1", n, q1, sol.zeit);
  // Frage 2a: Wer fehlt im Tatfenster [T-2, T+8]? Genau Täter und Lockvogel.
  const T = hm(sol.zeit), lo = T - 2, hi = T + 8;
  const kOK = (p) => blockRows(by.karten.html).slice(1).filter((r) => { const st = hm(r[1]); return st <= hi && st + 9 >= lo; }).every((r) => r[2].includes(p.name));
  const bOK = (p) => frameRows(by.balkon.html).slice(1).filter((r) => hm(r[1]) >= lo && hm(r[1]) <= hi).every((r) => r[2].includes(p.name));
  const gone = G.players.map((p, i) => ({ p, i })).filter(({ p }) => !(p.act === "karten" ? kOK(p) : bOK(p))).map((x) => x.i).sort();
  if (gone.join() !== [S.culprit, S.decoy].sort().join()) err("Frage 2 Lücken", n, cAct, dAct, gone);
  // Frage 2b: Ausrede des Täters widerlegt, Geschichte des Lockvogels bestätigt
  const [ex] = F.excuseOf(G), app = rows(by.app.html).slice(1);
  if (/Haustür|Auto|Fuchs/.test(ex) && app.filter((r) => r[1] === "Haustür").some((r) => hm(r[0]) > hm("23:40") && hm(r[0]) < hm("07:00"))) err("Haustür", n);
  if (/Balkon/.test(ex) && frameRows(by.balkon.html).slice(1).some((r) => hm(r[1]) >= lo && hm(r[1]) <= hi && r[2].includes(G.players[S.culprit].name))) err("Balkon-Ausrede", n);
  if (/Küche/.test(ex) && !/niemand außer uns/.test(by.karten.html)) err("Küchen-Ausrede", n);
  if (!app.some((r) => r[1] === "Treppe" && hm(r[0]) >= T - 3 && hm(r[0]) <= T + 12)) err("Treppe Lockvogel", n);
  const lt = by.luecken.html, both = [S.culprit, S.decoy].every((i) => lt.includes(G.players[i].name));
  if (plus ? G.players.some((p) => lt.includes(p.name)) : !both) err("Lücken-Notiz", n, plus);
  // Frage 3: Rückweg nach der Kamera
  const area = cAct === "karten" ? ["Stube", "Flur", "Küche"] : ["Stube", "Balkon"];
  const rg = rows(by.rundgang.html).slice(1);
  if (rg.some((r) => !AREA[r[0]])) err("Rundgang-Orte", n);
  const cand = rg.filter((r) => area.includes(AREA[r[0]])).map((r) => r[0]);
  if (cand.length !== 1 || F.SPOTS[sol.versteck].name !== { "Schuhschrank im Flur": "Schuhschrank im Flur", "Blumentrog auf dem Balkon": "Blumentrog auf dem Balkon" }[cand[0]]) err("Frage 3", n, cAct, cand, sol.versteck);
  if (app.some((r) => r[1] === "Keller" && hm(r[0]) > hm("01:19") + (tv ? F.TIME_SHIFTS[tv] : 0) && hm(r[0]) < hm("07:35")))  // 07:36 = Loisl am Morgen err("Keller nach Kamera", n);
  // Frage 4 (Plus)
  if (plus) { const h = F.pwHolders(G); if (h.length !== 3 || h.includes(S.culprit) || new Set(h).size !== 3 || !by.backup) err("Frage 4", n); if (!/Almweg 17/.test(by.plan.html)) err("Hausnummer", n); }
  if (/\{|undefined|NaN/.test(D.map((d) => d.html).join("") + Object.values(F.hints(G)).flat().join(" ") + F.resolution(G).text)) err("Platzhalter", n);
}
console.log(`${runs} Gruppen geprüft (4–8 Spieler, Täter/Lockvogel in beiden Gruppen, alle Zeitvarianten, Krimiabend und Plus)`);
console.log(bad ? `FEHLER: ${bad}` : "alles eindeutig und gleich lang");
