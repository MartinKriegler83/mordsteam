// Prüft Teams-Fall 002 „Eiskalt kassiert“ (Vereine) für viele zufällige Runden:
// alle Platzhalter aufgelöst, Lösung in jeder Variante eindeutig (Täter, Tatzeit, Betrag, Versteck, Komplize, Pokal, Code, Startjahr),
// Paketgrenzen (Finale-Spuren nur in Premium Plus), Zusatzfragen und Sonderauftrag gültig.
// Aufruf: node tools/check_teams002.mjs
import { COUNTRY_ORDER } from "../lib/countries.js";
import * as F from "../lib/cases/fall-002.js";
import { regioGuard } from "./regio_guard.mjs";
import { answerGuard } from "./answer_guard.mjs";
let err = 0;
const fail = (m) => { if (err < 40) console.log("FEHLER", m); err++; };
const rand = (n) => Math.floor(Math.random() * n);
const t2m = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const strip = (h) => h.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
const ARTEN = F.VEREINSARTEN.map((a) => a[0]);
let rounds = 0;

for (let i = 0; i < 1200; i++) {
  const tier = i % 3, premium = tier >= 1;
  const land = i % 4 === 0 ? COUNTRY_ORDER[rand(COUNTRY_ORDER.length)] : ["AT", "DE", "CH"][i % 3];
  const pool = F.FICTIONS[land] || [];
  let cast = pool.length ? pool[rand(pool.length)] : F.randomCast(land, "de", rand);
  cast = { ...cast, VEREINSART: ARTEN[i % ARTEN.length], LAND: land };
  const sec = F.makeSecrets(rand, { premium });
  const v = { ...cast, ...sec, LANG: "de", TIER: tier };
  Object.assign(v, F.extraVars(v));
  const R = (t) => t.replace(/\{([A-Z0-9_]+)\}/g, (m, k) => (k in v ? v[k] : m));
  const docs = [...F.DOCS.filter((d) => !d.premiumOnly || premium), ...(premium ? F.DOCS2 : []), ...(tier >= 2 ? F.DOCS3 : [])];
  const all = docs.map((d) => R(d.title + " " + d.html)).join("\n") + F.FIRMA_WEB.pages.map((p) => R(p.html)).join("\n") + R(F.FIRMA_WEB.partner);
  const left = all.match(/\{[A-Z0-9_]+\}/g);
  if (left) fail(`Platzhalter offen (${land}, Paket ${tier}): ${[...new Set(left)].join(" ")}`);
  for (const k of ["intro", "story", ...(premium ? ["story2"] : []), ...(tier >= 2 ? ["story3"] : [])]) { const m = R(F.META[k]).match(/\{[A-Z0-9_]+\}/g); if (m) fail(`META.${k}: ${m}`); }
  rounds++;
  // Go-live-Test 4 (M4): Ehrenobmann/-obfrau mit eigenem Vornamen
  { const e = F.ehrenOf(v, false), fe = e.name.split(/\s+/)[0].toLowerCase();
    const others = [...Array.from({ length: 8 }, (_, k) => v[`S${k + 1}`]), v.OPFER, v.BOSS].filter(Boolean).map((n) => String(n).trim().split(/\s+/)[0].toLowerCase());
    if (others.includes(fe)) fail(`Ehren-Vorname doppelt: ${e.name} (${land})`); }
  // Go-live-Test 3 (T2-1): Einteilung/Abweichungen zeigen nur die Feste VOR heuer – sonst widerspricht der Chat „Heuer bin ich nicht eingeteilt“
  if (premium && (String(v.KASSAPLAN_ROWS).includes(`>${v.HEUER}<`) || String(v.ABWEICH_ROWS).includes(`>${v.HEUER}<`))) fail(`Akt 2 zeigt heuer ${v.HEUER}`);
  if (premium && sec.START > v.HEUER - 3) fail(`Startjahr ${sec.START} nach dem ersten Tauschjahr`);

  const sol = F.solution(sec, cast);
  const byRole = Object.fromEntries(sec.ROLES.map((r, k) => [r, { name: cast[`S${k + 1}`], letter: sec.LETTERS[k] }]));
  // 1) Tatzeit: genau ein „Tür zu“ ohne Entnahme nach dem Betreten durch das Opfer, Entnahmen alle vor 22:30
  if (sec.ENT.some((m) => m >= 22 * 60 + 30) || sec.BACK >= 22 * 60 + 30) fail("Entnahme nach Schankschluss");
  if (!(sec.P_IN < sec.TAT && sec.P_IN >= 22 * 60 + 31)) fail(`Opfer betritt Anhänger zu früh/spät ${sec.P_IN}`);
  if (sol.wann !== F.hm(sec.TAT)) fail("Tatzeit-Lösung");
  const doorClosesAfter = (v.TUER_ROWS.match(/<td>(\d\d:\d\d)<\/td><td>Tür zu<\/td>/g) || []).map((x) => t2m(x.slice(4, 9))).filter((m) => m > sec.P_IN);
  if (doorClosesAfter.length !== 1 || doorClosesAfter[0] !== sec.TAT) fail(`Tür zu nach Opfer nicht eindeutig: ${doorClosesAfter}`);
  // 2) Täter: Bändchenfarbe trifft T, R1, R2; R1 und R2 haben zur Tatzeit ein Alibi
  const durch = strip(v.DURCHSAGE_ROWS), fotos = strip(v.FOTO_ROWS);
  const tomb = [...v.DURCHSAGE_ROWS.matchAll(/<td>(\d\d:\d\d)<\/td><td>[^<]*?(?:Glücksfee|gezogen von)[^<]*<\/td>/g)].map((m) => t2m(m[1]));
  if (!(Math.min(...tomb) < sec.TAT && Math.max(...tomb) > sec.TAT)) fail("Tombola-Alibi deckt die Tatzeit nicht");
  // Go-live-Test 4 (M3): keine Durchsage vor Beginn des Mitschnitts (22:30)
  { const all = [...v.DURCHSAGE_ROWS.matchAll(/<td>(\d\d:\d\d)<\/td>/g)].map((m) => t2m(m[1])); if (Math.min(...all) < 22 * 60 + 30) fail(`Durchsage vor 22:30 (Tat ${F.hm(sec.TAT)})`); }
  if (!durch.includes(byRole.R1.name) || durch.includes(byRole.T.name)) fail("Durchsagen: Glücksfee falsch");
  const serie = /Helfer-Gruppenfotos[^·]*Serie bis (\d\d:\d\d)/.exec(fotos);
  const fStart = [...v.FOTO_ROWS.matchAll(/<td>(\d\d:\d\d)<\/td><td>Helfer-Gruppenfotos/g)].map((m) => t2m(m[1]))[0];
  if (!serie || !(fStart < sec.TAT && t2m(serie[1]) > sec.TAT)) fail("Foto-Alibi deckt die Tatzeit nicht");
  const schicht = strip(v.SCHICHT_ROWS);
  const farbe = sec.COLOR ? "grün" : "rot";
  const row = schicht.split(/(?=Bonkassa|Ausschank|Grill|Auf- und Abbau)/).find((x) => x.includes(` ${farbe} `));
  const inC = sec.ROLES.map((r, k) => cast[`S${k + 1}`]).filter((n) => row && row.includes(n));
  if (inC.length !== 3 || !inC.includes(byRole.T.name)) fail(`Bändchenfarbe trifft nicht genau T, R1, R2: ${inC}`);
  // 3) Betrag
  if (!/^\d+$/.test(sol.betrag) || Number(sol.betrag) !== F.betragOf(land, sec.DIFF)) fail("Betrag");
  // 4) Versteck: genau eine fremde Kiste auf der Fotoseite in der genannten Lage
  const odd = [[sec.PA, sec.LA], ...sec.DECOYS];
  const side = (p) => (p >= 4 ? 1 : 0);
  const hits = odd.filter(([p, l]) => side(p) === sec.SIDE && l === sec.LA);
  if (hits.length !== 1 || new Set(odd.map((x) => x.join("-"))).size !== 4) fail(`Versteck nicht eindeutig ${JSON.stringify(odd)}`);
  if (sol.wo !== `P${sec.PA}-${sec.LA}`) fail("Versteck-Lösung");
  // Zusatzfragen
  const b = F.bonusSolution(sec);
  // Zusatzfrage „Kühlboxen nicht mitzählen“: mindestens eine Kühlbox-Entnahme ab 22:00 in der Ausgabeliste
  if (!sec.ITEMS.some((it, k) => it[1] === 3 && sec.ENT[k] >= 22 * 60) || !/Kühlbox/.test(strip(v.AUSGABE_ROWS))) fail("Ausgabeliste ohne Kühlbox-Entnahme ab 22:00");
  if (/(^|[^−\d])-\d/.test(strip(v.TEMP_ROWS))) fail("Temperatur mit Bindestrich statt Minuszeichen");
  if (b.b_tombola !== byRole.R1.letter || b.b_grill.length !== 2 || b.b_grill.includes(sec.L_T) || !/^\d+$/.test(b.b_kisten)) fail(`Zusatzfragen ${JSON.stringify(b)}`);
  // Paketgrenzen
  if (tier < 2 && /Festchronik|Ehrenob|Blechkassa/.test(all)) fail(`Finale-Spur in Paket ${tier}`);
  if (!premium && /Pokal|Vitrine|Helfergruppe/.test(all)) fail("Akt-2-Spur in Basic");

  if (premium) {
    // Komplize: in allen drei Lücken-Schichten sitzt nach den Tauschs nur M an der Kassa
    const M = cast[`S${sec.M_IDX + 1}`];
    if (!sol.helfer || sol.helfer !== M || M === byRole.T.name) fail("Komplize-Lösung");
    const plan = [...v.KASSAPLAN_ROWS.matchAll(/<tr><td>(\d{4})<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g)].map((m) => ({ y: m[1], s: m[2], ppl: m[3].split(", ") }));
    const chat = [...v.GRUPPE_ROWS.matchAll(/<span>(\d{4})<\/span> · <b>([^<]+)<\/b><\/div>\n?<p>([^<]+)<\/p>/g)].map((m) => ({ y: m[1], who: m[2], txt: m[3] }));
    for (let k = 0; k < chat.length; k += 2) {
      const ask = chat[k], take = chat[k + 1];
      const slot = F.SLOTS.map((s) => `${s[0]} ${s[1]}`).find((s) => ask.txt.includes(s));
      const p = plan.find((x) => x.y === ask.y && x.s === slot);
      if (!p || !p.ppl.includes(ask.who)) { fail(`Tausch passt nicht zur Einteilung: ${ask.y} ${ask.who} ${slot}`); continue; }
      p.ppl = p.ppl.map((n) => (n === ask.who ? take.who : n));
    }
    const dev = [...v.ABWEICH_ROWS.matchAll(/<td>(\d{4})<\/td><td>([^<]+)<\/td>/g)].map((m) => plan.find((x) => x.y === m[1] && x.s === m[2]));
    const common = dev.reduce((acc, p) => acc.filter((n) => p && p.ppl.includes(n)), dev[0] ? [...dev[0].ppl] : []);
    if (common.length !== 1 || common[0] !== M) fail(`Komplize nicht eindeutig: ${common} (M=${M})`);
    // Pokal: Jahre und Inventarnummern eindeutig, genau ein Pokal aus dem Stromausfall-Jahr
    const yrs = F.pokalJahre(sec);
    if (new Set(yrs).size !== yrs.length || new Set(sec.INV).size !== sec.INV.length) fail(`Vitrine doppelt ${yrs}`);
    if (sol.pokal !== String(sec.INV[0])) fail("Pokal-Lösung");
    if (sec.ROLES[sec.M_IDX] === "R5") fail("Komplize ist laut Schichtplan an der Bonkassa eingeteilt – widerspricht dem Chat");
    if (!strip(v.CHRONIK_ROWS).includes(`${sec.STROM}`)) fail("Stromausfall-Jahr fehlt in der Chronik");
  }
  if (tier >= 2) {
    if (new Set([sec.GRUENDUNG, sec.WIESE, sec.ZELT]).size !== 3 || sec.ZELT <= sec.WIESE) fail("Chronik-Jahre");
    if (strip(v.CHRONIK_ROWS).includes(String(sec.ZELT))) fail("Code-Jahr steht in der Chronik");
    const fc = [...v.FESTCHRONIK.matchAll(/<tr><td>(\d{4})<\/td><td>([\d.,’]+)<\/td><td>([^<]+)<\/td><\/tr>/g)].map((m) => ({ y: Number(m[1]), r: Number(m[3].replace(/[^0-9]/g, "")) / Number(m[2].replace(/[^0-9]/g, "")) }));
    const f = { EUR: 1 }; void f;
    const pre = fc.filter((x) => x.y < sec.START).map((x) => x.r), post = fc.filter((x) => x.y >= sec.START).map((x) => x.r);
    if (!pre.length || !post.length || Math.min(...pre) <= Math.max(...post)) fail(`Festchronik zeigt den Start nicht klar (${sec.START})`);
    // Eindeutigkeit: genau ein Jahr, ab dem alle Werte unter allen früheren liegen; sichtbarer Abstand (≥ 2 %), Rückgang nur ca. 1–2 € pro Kopf
    // – der größte Sprung zwischen den sortierten Pro-Kopf-Werten liegt genau zwischen „vor“ und „ab Start“ und ist deutlich größer als jeder andere
    { const srt = fc.map((x) => x.r).sort((a, c) => a - c), gaps = srt.slice(1).map((r, k) => [r - srt[k], k]).sort((a, c) => c[0] - a[0]);
      if (gaps[0][1] !== post.length - 1 || gaps[0][0] < 1.3 * gaps[1][0]) fail(`Startjahr in der Festchronik nicht eindeutig (Start ${sec.START}, Sprünge ${gaps.slice(0, 2).map((g) => g[0].toFixed(3))})`);
      const minPre = Math.min(...pre), maxPost = Math.max(...post), avg = (a) => a.reduce((p, q) => p + q, 0) / a.length;
      if ((minPre - maxPost) / maxPost < 0.02) fail(`Festchronik: Abstand vor/nach Start zu klein (${minPre} / ${maxPost})`);
      const dropRel = (avg(pre) - avg(post)) / avg(pre);
      if (dropRel < 0.04 || dropRel > 0.11) fail(`Festchronik: Rückgang pro Kopf ${Math.round(dropRel * 100)} % statt ca. 1–2 € von ~19,5 €`); }
    { const o = F.SONDER.options(); if (!o[F.zielOf(sec)] || new Set(o.map((x) => x[0])).size !== o.length) fail("Sonderauftrag ungültig"); }
    // Go-live-Test 5 (M4): stufenweise – ohne Namen nur der Fingerzeig auf den Täter, mit Namen das Code-Jahr
    { const X = { ...cast, ...sec }, tn = String(X[`S${X.T_IDX + 1}`] || ""), last = tn.split(" ").pop();
      const fb0 = F.ARIA.fallback(X, "Wonach hat sich jemand bei dir erkundigt?");
      if (fb0.includes(String(sec.ZELT)) || !fb0.includes(tn)) fail("Notfall-Antwort ohne Namen: kein Fingerzeig oder verrät Code-Jahr");
      if (!F.ARIA.fallback(X, `Wonach hat sich ${last} bei dir erkundigt?`).includes(String(sec.ZELT))) fail(`Notfall-Antwort nennt das Code-Jahr nicht (${tn})`);
      for (const q of ["Hallo, kurzer Anruf von der Polizei", "Bonjour!", "Wo ist die Festkassa?"]) if (/\b(19|20)\d\d\b/.test(F.ARIA.fallback(X, q))) fail(`Notfall-Antwort verrät Jahr bei „${q}“`); }
    // Punkt 17: reine Zelt-Frage verrät das Code-Jahr nicht
    if (F.ARIA.fallback({ ...cast, ...sec }, "Wann war das erste Fest mit Zelt?").includes(String(sec.ZELT))) fail("Notfall-Antwort verrät das Code-Jahr bei reiner Zelt-Frage");
  }
}
// Go-live-Test 3 (5.10.2026): keine österreichischen Wörter in DE/CH/LI-Runden (Texte und KI-Figuren)
{ const rg = regioGuard("fall-002", 60); for (const e of rg.errs) fail(e); }
// Go-live-Test 4 (6.10.2026): richtige Antworten aller Stufen zählen als richtig
{ const ag = answerGuard("fall-002", 120); for (const e of ag.errs) fail(e); }
console.log(err ? `${err} Fehler` : `${rounds} Runden (3 Pakete, ${ARTEN.length} Vereinsarten, Länder gemischt): alles ok`);
process.exit(err ? 1 : 0);
