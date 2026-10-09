// Prüft Teams-Fall 001: IBAN-Darstellung in allen Ländern (die gesuchten letzten 4 Ziffern stehen nie geteilt),
// Zusatzermittlung (Lösungen eindeutig) und Sonderauftrag (Ziel gültig) für viele zufällige Runden.
// Aufruf: node tools/check_teams.mjs
import { account, COUNTRY_ORDER } from "../lib/countries.js";
import * as F from "../lib/cases/fall-001.js";
import { regioGuard } from "./regio_guard.mjs";
import { answerGuard } from "./answer_guard.mjs";
import { readdirSync, readFileSync } from "fs";
import { PRICE_TABLE, convPrice } from "../lib/prices.js";
import { placeholderGuard } from "./placeholder_guard.mjs";
let err = 0;
const fail = (m) => { err++; console.log("FEHLER", m); };
for (const c of COUNTRY_ORDER) for (const k of ["9697", "0102", "4521"]) for (const bank of [false, true]) {
  const a = account(c, k, bank);
  if (!a.endsWith(k)) fail(`${c} endet nicht auf ${k}: ${a}`);
  const before = a.slice(0, -4);
  if (/\d$/.test(before) && /[A-Z]{2}\d{2} /.test(a)) fail(`${c} letzte 4 Ziffern nicht als eigener Block: ${a}`);
}

const rand = (n) => Math.floor(Math.random() * n);
for (let i = 0; i < 500; i++) for (const premium of [false, true]) {
  const sec = F.makeSecrets(rand, { premium, lang: i % 2 ? "en" : "de", feier: "Panorama-Lounge" });
  const b = F.bonusSolution(sec);
  if (!/^\d\d:\d\d$/.test(b.b_zeit) || b.b_taxi.length !== 2 || b.b_video.length !== 1) fail(`Bonus unvollständig ${JSON.stringify(b)}`);
  if (b.b_taxi.includes(b.b_video)) fail("Bonus: Video-Person sitzt auch im Taxi");
  if (b.b_taxi.includes(sec.L_T) || b.b_video === sec.L_T) fail("Bonus: Täter als Alibi-Person");
  if (premium && !F.ZIELE[F.zielOf(sec)]) fail("Sonderauftrag: Ziel ungültig");
  if (sec.ROOM_NEU && /panorama/i.test(sec.ROOM_NEU)) fail("Kennwort-Raum steckt im Feierraum-Namen");
}
// Go-live-Test 3 (5.10.2026): keine österreichischen Wörter in DE/CH/LI-Runden (Texte und KI-Figuren)
{ const rg = regioGuard("fall-001", 60); for (const e of rg.errs) fail(e); }
// Go-live-Test 4 (6.10.2026): richtige Antworten aller Stufen zählen als richtig
{ const ag = answerGuard("fall-001", 120); for (const e of ag.errs) fail(e); }
// Landeswährung (lib/prices.js): jeder markierte Preis der englischen Seiten braucht £ und $ in der Tabelle; Server-Preise ebenso
{
  const files = readdirSync(new URL("../site/en/", import.meta.url)).filter((f) => f.endsWith(".html"));
  for (const f of files) for (const m of readFileSync(new URL("../site/en/" + f, import.meta.url), "utf8").matchAll(/data-eur="(\d+)"/g))
    if (!PRICE_TABLE[m[1]]) fail(`Preis ${m[1]} Cent auf en/${f} fehlt in lib/prices.js`);
  for (const c of [8900, 11900, 14900, 2900, 500, 4900, 800, 890, 1590]) for (const cur of ["GBP", "USD"]) { try { convPrice(c, cur); } catch (e) { fail(e.message); } }
}
// Go-live-Test 5 (H3): Scheinrechnungen aufsteigend und knapp UNTER der Freigabegrenze, in jedem Land
{ const { scaled } = await import("../lib/countries.js");
  for (const c of COUNTRY_ORDER) { const r = [4850, 4920, 4990].map((e) => scaled(c, e)), g = F.freigabeOf(c);
    if (!(r[0] < r[1] && r[1] < r[2] && r[2] < g)) fail(`${c}: Rechnungen ${r.join("/")} nicht aufsteigend unter Freigabegrenze ${g}`); } }
// Offene Platzhalter in gerenderten Akten (9.10.2026, {TORTE})
for (const e of placeholderGuard("fall-001", 40)) fail(e);
console.log(err ? `${err} Fehler` : `IBAN in ${COUNTRY_ORDER.length} Ländern, 1000 Runden Zusatzermittlung/Sonderauftrag: alles ok`);
// Bild-Rätsel Archivregal und Kantine-Akte (9.10.2026)
{ const { pictureGuard } = await import("./picture_guard.mjs"); for (const e of pictureGuard("fall-001", 80)) fail(e); }
