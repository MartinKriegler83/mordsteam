// Prüft die englische Fassung von Friends 001 (lib/cases/friends-001-en.js) gegen die deutsche.
// Alle Gruppengrößen (4–8), Täter/Lockvogel in beiden Gruppen, alle Zeitvarianten, alle Ausreden, Krimiabend und Plus.
// - gleiche Dokument-IDs/Stufen/Reihenfolge, gleiche <tr>/<p>-Zahl und Uhrzeiten wie DE, kk = deutscher Typ
// - Lösungen, Fragen-Schlüssel und Auswahl-Codes identisch; Rätsel auch auf Englisch eindeutig lösbar
// - Beweisstücke innerhalb EN über alle Varianten gleich lang (gleiches Kriterium wie check_friends.mjs)
// - keine deutschen Reste in den EN-Texten; DE-Prüfskript bleibt grün.  Aufruf: node tools/check_friends_en.mjs
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as DE from "../lib/cases/friends-001.js";
import * as EN from "../lib/cases/friends-001-en.js";
const M = { ...DE, ...EN };

const hm = (t) => { const [h, m] = t.split(":").map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
const rows = (html) => [...html.matchAll(/<tr>(.*?)<\/tr>/gs)].map((m) => [...m[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map((c) => c[1].replace(/<[^>]+>/g, "")));
const trs = (html) => (html.match(/<tr>/g) || []).length;
const ps = (html) => (html.match(/<p[ >]/g) || []).length;
const monos = (html) => [...html.matchAll(/<td class="mono">(.*?)<\/td>/g)].map((m) => m[1]).join(",");
const NAMES = ["Anna", "Bernd", "Clara", "David", "Eva", "Felix", "Gerda", "Hannes"];
let seed = 7; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
let bad = 0, runs = 0; const len = {};
const err = (...a) => { bad++; if (bad < 40) console.log("FEHLER", ...a); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- Exporte ----------
for (const k of Object.keys(EN)) {
  if (!(k in DE)) err("Export fehlt im DE-Modul", k);
  else if (typeof EN[k] !== typeof DE[k]) err("Export-Typ", k);
  else if (typeof EN[k] === "function" && EN[k].length !== DE[k].length) err("Signatur", k, EN[k].length, DE[k].length);
}
if (!same(Object.keys(EN.QUIRKS), Object.keys(DE.QUIRKS))) err("QUIRKS-Schlüssel");
for (const k of DE.QUIRK_KEYS) if (!same(Object.keys(EN.QUIRKS[k]), Object.keys(DE.QUIRKS[k])) || /\{V\}/.test(EN.QUIRKS[k].clip) !== /\{V\}/.test(DE.QUIRKS[k].clip) || /\{Z\}/.test(EN.QUIRKS[k].clip) !== /\{Z\}/.test(DE.QUIRKS[k].clip)) err("QUIRK", k);
if (!same(Object.keys(EN.SPOTS), Object.keys(DE.SPOTS))) err("SPOTS-Schlüssel");
if (!same(Object.keys(EN.EXCUSES), Object.keys(DE.EXCUSES)) || Object.keys(DE.EXCUSES).some((a) => EN.EXCUSES[a].length !== DE.EXCUSES[a].length)) err("EXCUSES-Struktur");

// ---------- Deutsche Reste ----------
const ALLOW = /Zirbenblick|Almweg|Wegscheider|Mordsteam|SaunaControl|Loisl|Ferdl|Zenzi|Rosi|Resi|Raclette/gi;
const GERMAN = /[äöüÄÖÜß„]|“(?=[\s.,;:!?)]|$)|\b(der|die|das|dem|den|und|nicht|Uhr|ist|ich|du|mit|auf|ein|eine|einen|zu|von|bei|wir|sie|hat|war|auch|noch|nur|im|vom|zum|beim|oder|aber|Hütte|Stube|Keller|Küche|Flur|Treppe|Haustür|Punkteblock|Zeitraffer|Bergrettung|Austragshäusl|Nachbar|Frage|Hinweis|Täter|Notiz|Liste|Beleg|Befund|Protokoll|Systemauszug|Zimmer|Runde|Bild|Nr)\b/;
const found = new Map();
const scan = (where, text) => {
  const plain = String(text).replace(/<[^>]+>/g, " ").replace(ALLOW, "Name");
  for (const line of plain.split(/(?<=[.!?:])\s+|\n/)) {
    const m = line.match(GERMAN);
    if (m && !found.has(where + line)) found.set(where + line, `${where}: «${m[0]}» in „${line.trim().slice(0, 140)}“`);
  }
};
scan("TITLE", EN.TITLE); scan("CLOCK_LABEL", EN.CLOCK_LABEL); scan("LATE_LABEL", EN.LATE_LABEL);
for (const [k, q] of Object.entries(EN.QUIRKS)) scan("QUIRKS." + k, `${q.label}. ${q.clip}. ${q.award}.`);
for (const [k, s] of Object.entries(EN.SPOTS)) scan("SPOTS." + k, `${s.name}. ${s.area}.`);
for (const [a, l] of Object.entries(EN.EXCUSES)) l.forEach((x, i) => scan(`EXCUSES.${a}.${i}`, x.join(" ")));

const PW_CODES = DE.PW_OPTIONS.map((o) => o[0]);
const PW_Q_EN = ["What do you know about Ferdl's password?", "Did Ferdl have a cloud backup?", "What was his first cow called?", "What's the chalet's house number?"];
const PW_Q_DE = ["Was weißt du über Ferdls Passwort?", "Wie hieß seine erste Kuh?"];
const OTHER_Q = ["Where were you last night?", "Wo warst du um eins?"];
const FRAG = /uncrackable|Zenzi|Almweg 23/;

for (let n = 4; n <= 8; n++) for (const cAct of ["karten", "balkon"]) for (const dAct of ["karten", "balkon"]) for (let tv = 0; tv < DE.TIME_SHIFTS.length; tv++) for (const plus of [false, true]) for (let trial = 0; trial < 4; trial++) {
  const S = DE.setup(n, rnd);
  const pool = S.acts.map((a, i) => i).filter((i) => S.acts[i] === cAct);
  S.culprit = pool[trial % pool.length];
  const dpool = S.acts.map((a, i) => i).filter((i) => S.acts[i] === dAct && i !== S.culprit);
  if (!dpool.length) continue;
  S.decoy = dpool[trial % dpool.length]; S.tvar = tv;
  const beers = S.acts.map((a, i) => i).filter((i) => S.acts[i] === "karten" && i !== S.culprit && i !== S.decoy); S.beer = beers.length ? beers[0] : S.decoy;
  const G = { players: NAMES.slice(0, n).map((name, i) => ({ name, quirk: DE.QUIRK_KEYS[rnd(DE.QUIRK_KEYS.length)], act: S.acts[i], room: S.rooms[i] })), culprit: S.culprit, decoy: S.decoy, tvar: tv, beer: S.beer, excuse: trial % 4, plus };
  runs++;
  const tag = `n=${n} ${cAct}/${dAct} tv=${tv} ex=${trial % 4} plus=${plus}`;

  // ----- Struktur gegen DE -----
  for (const me of [0, n - 1]) {
    const Dd = DE.docs(G, me), De = M.docs(G, me);
    if (!same(Dd.map((d) => [d.id, d.stage]), De.map((d) => [d.id, d.stage]))) err("Dokumente/Stufen", tag);
    De.forEach((d, i) => {
      const o = Dd[i]; if (!o) return;
      if (trs(d.html) !== trs(o.html)) err("<tr>-Zahl", tag, d.id, trs(d.html), trs(o.html));
      if (ps(d.html) !== ps(o.html)) err("<p>-Zahl", tag, d.id);
      if (monos(d.html) !== monos(o.html)) err("Uhrzeiten", tag, d.id);
      if (d.kk !== (o.kk || o.kind)) err("kk", tag, d.id, d.kk);
      if (!d.kind || d.kind === o.kind) err("kind nicht übersetzt", tag, d.id);
      const ro = rows(o.html), re = rows(d.html);
      if (ro.some((r, j) => r.length !== (re[j] || []).length)) err("Zellen", tag, d.id);
      // Spielernamen stehen an denselben Stellen der Tabellen
      ro.forEach((r, j) => r.forEach((c, k) => { for (const nm of NAMES.slice(0, n)) if (c.includes(nm) !== ((re[j] || [])[k] || "").includes(nm)) err("Name in Tabelle", tag, d.id, j, k, nm); }));
      if (/\{|undefined|NaN|null/.test(d.html + d.title + d.kind)) err("Platzhalter", tag, d.id);
      if (me === 0 && n === 8 && tv === 0 && trial < 2) { scan("docs." + d.id + ".title", d.title); scan("docs." + d.id + ".kind", d.kind); scan("docs." + d.id, d.html); }
    });
  }
  const D = M.docs(G, 0), by = Object.fromEntries(D.map((d) => [d.id, d]));
  // ----- Länge innerhalb EN (wie check_friends.mjs) -----
  for (const d of D) { if (d.id === "app") continue; const k = n + ":" + plus + ":" + d.id, c = rows(d.html).length + ":" + (d.html.match(/<p[ >]/g) || []).length; if (len[k] && len[k] !== c) err("Länge", n, plus, d.id, c, len[k]); len[k] = len[k] || c; }

  // ----- Lösungen, Fragen, Hinweise, Einsatz, Auflösung -----
  const sol = M.solution(G);
  if (!same(sol, DE.solution(G))) err("Lösung", tag);
  const Qd = DE.questions(G), Qe = M.questions(G);
  if (!same(Qd.map((q) => [q.key, q.nr, q.type, (q.options || []).map((o) => o[0])]), Qe.map((q) => [q.key, q.nr, q.type, (q.options || []).map((o) => o[0])]))) err("Fragen/Codes", tag);
  Qe.forEach((q) => { if (q.type === "select" && !q.options.some((o) => o[0] === sol[q.key])) err("Lösung nicht wählbar", tag, q.key); });
  const Hd = DE.hints(G), He = M.hints(G);
  if (!same(Object.keys(Hd).map((k) => [k, Hd[k].length]), Object.keys(He).map((k) => [k, He[k].length]))) err("Hinweise", tag);
  const Bd = DE.briefing("Anna", G), Be = M.briefing("Anna", G);
  if (Bd.steps.length !== Be.steps.length || !Be.text.includes("Anna")) err("Briefing", tag);
  const Rd = DE.resolution(G), Re = M.resolution(G);
  if (Rd.culprit !== Re.culprit || Re.item !== EN.SPOTS[sol.versteck].name || Re.excuse !== M.excuseOf(G)[0]) err("Auflösung", tag);
  if (plus && !/Zenzi23/.test(Re.text)) err("Auflösung Passwort", tag);
  if (/\{|undefined|NaN/.test(Object.values(He).flat().join(" ") + Re.text + Be.text + Be.steps.flat().join(" "))) err("Platzhalter Texte", tag);
  if (n === 8 && trial < 2 && tv === 0) {
    Qe.forEach((q) => { scan("questions." + q.key, q.label + " " + q.hint); (q.options || []).filter((o) => !PW_CODES.includes(o[0]) && !o[0].startsWith("p")).forEach((o) => scan("options." + o[0], o[1])); });
    Object.entries(He).forEach(([k, l]) => l.forEach((h, i) => scan(`hints.${k}.${i}`, h)));
    scan("briefing", [Be.eyebrow, Be.title, Be.text, ...Be.steps.flat()].join("\n"));
    scan("resolution", Re.text);
    G.players.forEach((p) => scan("awardOf", M.awardOf(p)));
  }

  // ----- Rätsel auf Englisch lösbar (Kriterien aus check_friends.mjs) -----
  const sr = rows(by.sauna.html).slice(1), door = sr.filter((r) => /Sauna door/.test(r[1])).map((r) => hm(r[0]));
  const q1 = sr.filter((r) => /→/.test(r[1]) && !door.some((t) => Math.abs(t - hm(r[0])) <= 2)).map((r) => r[0]);
  if (q1.length !== 1 || q1[0] !== sol.zeit) err("Frage 1", tag, q1, sol.zeit);
  const T = hm(sol.zeit), lo = T - 2, hi = T + 8;
  const kOK = (p) => rows(by.karten.html).slice(1).filter((r) => { const st = hm(r[1]); return st <= hi && st + 9 >= lo; }).every((r) => r[2].includes(p.name));
  const bOK = (p) => rows(by.balkon.html).slice(1).filter((r) => hm(r[1]) >= lo && hm(r[1]) <= hi).every((r) => r[2].includes(p.name));
  const gone = G.players.map((p, i) => ({ p, i })).filter(({ p }) => !(p.act === "karten" ? kOK(p) : bOK(p))).map((x) => x.i).sort();
  if (gone.join() !== [S.culprit, S.decoy].sort().join()) err("Frage 2 Lücken", tag, gone);
  const [ex] = M.excuseOf(G), app = rows(by.app.html).slice(1);
  if (/front door|car|fox/.test(ex) && app.filter((r) => r[1] === "Front door").some((r) => hm(r[0]) > hm("23:40") && hm(r[0]) < hm("07:00"))) err("Haustür", tag);
  if (/balcony/.test(ex) && rows(by.balkon.html).slice(1).some((r) => hm(r[1]) >= lo && hm(r[1]) <= hi && r[2].includes(G.players[S.culprit].name))) err("Balkon-Ausrede", tag);
  if (/kitchen/.test(ex) && !/Nobody but us came into the kitchen/.test(by.karten.html)) err("Küchen-Ausrede", tag);
  if (!app.some((r) => r[1] === "Stairs" && hm(r[0]) >= T - 3 && hm(r[0]) <= T + 12)) err("Treppe Lockvogel", tag);
  const lt = by.luecken.html, both = [S.culprit, S.decoy].every((i) => lt.includes(G.players[i].name));
  if (plus ? G.players.some((p) => lt.includes(p.name)) : !both) err("Lücken-Notiz", tag);
  const AREA = { "Shoe cupboard in the hallway": "Hallway", "Flower trough on the balcony": "Balcony", "Ski room in the cellar": "Cellar", "Upstairs bathroom": "Upstairs", "Cellar fridge": "Cellar", "Woodshed outside": "Outside" };
  const area = cAct === "karten" ? ["Living room", "Hallway", "Kitchen"] : ["Living room", "Balcony"];
  const rg = rows(by.rundgang.html).slice(1);
  if (rg.some((r) => !AREA[r[0]])) err("Rundgang-Orte", tag);
  const cand = rg.filter((r) => area.includes(AREA[r[0]])).map((r) => r[0]);
  if (cand.length !== 1 || EN.SPOTS[sol.versteck].name !== cand[0]) err("Frage 3", tag, cand, sol.versteck);
  if (app.some((r) => r[1] === "Cellar" && hm(r[0]) > hm("01:19") + (tv ? DE.TIME_SHIFTS[tv] : 0))) err("Keller nach Kamera", tag);
  if (plus) { if (!by.backup || !/Almweg 17/.test(by.plan.html)) err("Frage 4", tag); }

  // ----- Verhörraum (Plus) -----
  if (plus) {
    const P = G.players.map((_, i) => `[PERSON${i + 1}]`), holders = DE.pwHolders(G);
    for (let idx = 0; idx < n; idx++) {
      for (const me of [0, idx]) {
        const sys = M.doubleSystem(G, idx, me, P);
        if (!/ALWAYS answer in English/.test(sys) || !/German/.test(sys)) err("doubleSystem Englisch-Regel", tag, idx);
        if (/\{|undefined|NaN/.test(sys)) err("doubleSystem Platzhalter", tag, idx);
        if (NAMES.some((nm) => sys.includes(nm))) err("doubleSystem echter Name", tag, idx);
        if (idx === S.culprit && !sys.includes(ex)) err("doubleSystem Ausrede", tag);
        if ((holders.indexOf(idx) >= 0) !== FRAG.test(sys)) err("doubleSystem Passwortwissen", tag, idx);
        if (n === 8 && trial === 0 && tv === 0 && me === 0) scan("doubleSystem", sys.replace(/German/g, ""));
      }
      for (const q of [...PW_Q_EN, ...PW_Q_DE]) {
        const a = M.doubleFallback(G, idx, q);
        if ((holders.indexOf(idx) >= 0) !== FRAG.test(a)) err("doubleFallback Passwort", tag, idx, q);
        if (n === 8 && trial === 0 && tv === 0) scan("doubleFallback", a);
      }
      for (const q of OTHER_Q) {
        const a = M.doubleFallback(G, idx, q);
        if (idx === S.culprit && !a.includes(ex)) err("doubleFallback Ausrede", tag);
        if (FRAG.test(a)) err("doubleFallback verrät Passwort ungefragt", tag, idx);
        if (n === 8 && trial === 0 && tv === 0) scan("doubleFallback", a);
      }
    }
  }
}

console.log(`${runs} Gruppen geprüft (4–8 Spieler, Täter/Lockvogel in beiden Gruppen, alle Zeitvarianten, alle Ausreden, Krimiabend und Plus)`);
if (found.size) { console.log(`Deutsche Reste (${found.size}):`); for (const f of found.values()) console.log("  " + f); bad += found.size; }

// ----- DE-Prüfskript muss grün bleiben -----
try {
  const out = execFileSync(process.execPath, [fileURLToPath(new URL("./check_friends.mjs", import.meta.url))], { encoding: "utf8" });
  if (!/alles eindeutig und gleich lang/.test(out)) { bad++; console.log("FEHLER DE-Prüfskript:\n" + out); }
  else console.log("DE-Prüfskript: " + out.trim().split("\n").at(-1));
} catch (e) { bad++; console.log("FEHLER DE-Prüfskript:", e.message); }

console.log(bad ? `FEHLER: ${bad}` : "Friends 001 EN: alles ok");
