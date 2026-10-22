// Brightpage (Webdesign unter der Mordsteam e.U.) – Rechnungen, Kunden und Abos (Service, Werbe-Betreuung, KI-Betrieb) im Admin (19.10.2026).
// Eine Firma, eine Buchhaltung: Bezahlte Brightpage-Rechnungen fließen als Einnahmen in dieselbe E/A-Rechnung,
// Kleinunternehmergrenze, U30/U1 und Zusammenfassende Meldung wie die Shop-Bestellungen (bpPaidRows → lib/accounting.js, lib/ledger.js).
//
// Ablauf: Entwurf (ohne Nummer, frei änderbar) → Ausstellen (fortlaufende Nummer BP-JJJJ-NNN, danach gesperrt)
//         → Bezahlt (Datum + Betrag laut Kontoauszug = Zufluss) · Offene Rechnung stornieren = Stornorechnung mit eigener Nummer.
// Anzahlung: eigene Rechnung (Typ „anzahlung“); die Schlussrechnung zieht bezahlte Anzahlungen ab (keine Doppelzählung).
// Abos: „fällige Abo-Rechnungen anlegen“ erzeugt Entwürfe je offenem Zeitraum (Vorauszahlung zu Monats-/Quartals-/Jahresbeginn).
// Absenderdaten, IBAN usw. stehen in ledger_settings (bp_cfg), nie im Code. Eigene UID kommt aus UID_NR.
import { EU } from "./tax.js";
import { LAND_OK } from "./laender.js";

const err = (msg, status = 400) => Object.assign(new Error(msg), { status });
const s = (x, n) => String(x ?? "").trim().slice(0, n);
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") && !Number.isNaN(Date.parse(d + "T00:00:00Z"));
const isYm = (d) => /^\d{4}-(0[1-9]|1[0-2])$/.test(d || "");
const now = () => Date.now();
const rid = () => crypto.randomUUID();
const VIENNA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => VIENNA.format(new Date());
const addDays = (ymd, n) => new Date(Date.parse(ymd + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
// Mittag Wiener Zeit als Zeitstempel (bleibt sicher am selben Kalendertag)
export const noonVienna = (ymd) => Date.parse(ymd + "T12:00:00+01:00");

// „1.234,56“, „1234,56“, „1234.56“, „1.500“ (= 1500), „-50“ → Cent
export function cents(v) {
  let t = String(v ?? "").replace(/\s|€/g, "");
  if (!t) return NaN;
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");   // „1.500“ = 1500 € (Tausenderpunkt, 20.10.2026)
  else t = t.replace(/,/g, "");
  return Math.round(Number(t) * 100);
}

export const REGIME_LABEL = {
  ku: "Kleinunternehmer (AT und EU-Privat)",
  rc_eu: "EU-Firma mit UID – Reverse Charge",
  dl_b2b: "Firma außerhalb der EU – nicht steuerbar",
  dl_b2c: "Privat außerhalb der EU – nicht steuerbar (mit Steuerberatung bestätigen)",
};
// Steuerhinweis auf der Rechnung (gleich wie lib/tax.js für den Shop)
export const VAT_LINE = {
  de: {
    ku: "Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung gemäß § 6 Abs. 1 Z 27 UStG.",
    rc_eu: "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, Art. 196 MwSt-RL): Die Umsatzsteuer schuldet der Leistungsempfänger.",
    dl_b2b: "Nicht im Inland steuerbare Leistung – Steuerschuldnerschaft des Leistungsempfängers.",
    dl_b2c: "Nicht im Inland steuerbare Leistung (Leistungsort im Land des Kunden), keine österreichische Umsatzsteuer.",
  },
  en: {
    ku: "VAT exempt under the Austrian small business scheme (§ 6 (1) no. 27 UStG).",
    rc_eu: "Reverse charge (Art. 196 EU VAT Directive): VAT is to be accounted for by the recipient.",
    dl_b2b: "Not subject to Austrian VAT (place of supply outside Austria) – reverse charge: any VAT is to be accounted for by the recipient.",
    dl_b2c: "Not subject to Austrian VAT (place of supply in the customer's country).",
  },
};
// Webdesign ist keine „elektronisch erbrachte Dienstleistung“: EU-Privatkunden bleiben beim Kleinunternehmer (Leistungsort AT, § 3a Abs. 7),
// zählen aber NICHT zur 10.000-€-Schwelle für EU-Privatkunden (die gilt nur für elektronische Leistungen/Fernverkäufe).
export function regimeOf(k) {
  const land = s(k.land, 2).toUpperCase() || "AT", b2b = k.art === "b2b", uid = s(k.uid, 20);
  if (land === "AT") return "ku";
  if (EU.includes(land)) return b2b && uid ? "rc_eu" : "ku";
  return b2b ? "dl_b2b" : "dl_b2c";
}

let ready = false;
export async function migrateBp(env) {
  if (ready) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bp_kunden (id TEXT PRIMARY KEY, art TEXT NOT NULL DEFAULT 'b2b', firma TEXT, name TEXT, strasse TEXT, plz_ort TEXT,
    land TEXT NOT NULL DEFAULT 'AT', uid TEXT, email TEXT, sprache TEXT NOT NULL DEFAULT 'de', notiz TEXT, created_at INTEGER NOT NULL, updated_at INTEGER, deleted INTEGER NOT NULL DEFAULT 0)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bp_invoices (id TEXT PRIMARY KEY, nr TEXT UNIQUE, typ TEXT NOT NULL DEFAULT 'rechnung', status TEXT NOT NULL DEFAULT 'entwurf',
    kunde_id TEXT, kunde TEXT NOT NULL, regime TEXT NOT NULL, sprache TEXT NOT NULL DEFAULT 'de', datum TEXT, leistung TEXT, faellig TEXT, titel TEXT, text_oben TEXT, text_unten TEXT,
    positionen TEXT NOT NULL, abzuege TEXT, summe_cents INTEGER NOT NULL DEFAULT 0, bezahlt_am TEXT, bezahlt_cents INTEGER, storno_von TEXT, storno_nr TEXT,
    abo_id TEXT, abo_periode TEXT, created_at INTEGER NOT NULL, updated_at INTEGER, deleted INTEGER NOT NULL DEFAULT 0)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bp_abos (id TEXT PRIMARY KEY, kunde_id TEXT NOT NULL, titel TEXT NOT NULL, preis_cents INTEGER NOT NULL, rhythmus TEXT NOT NULL DEFAULT 'monat',
    start TEXT NOT NULL, ende TEXT, aktiv INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER)`).run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS ledger_settings (k TEXT PRIMARY KEY, v TEXT)").run();
  // Brightpage-Kundendatenbank (21.10.2026): PLZ und Ort getrennt, Telefon, Website; plz_ort bleibt als zusammengesetzte Zeile für Rechnungen
  for (const col of ["plz", "ort", "telefon", "website"]) { try { await env.DB.prepare(`ALTER TABLE bp_kunden ADD COLUMN ${col} TEXT`).run(); } catch {} }
  // Erstattung bezahlter Rechnungen (Widerruf, 22.10.2026): Betrag, Datum der Rücküberweisung, Grund
  for (const [col, typ] of [["erstattet_cents", "INTEGER"], ["erstattet_am", "TEXT"], ["erstattet_grund", "TEXT"]]) { try { await env.DB.prepare(`ALTER TABLE bp_invoices ADD COLUMN ${col} ${typ}`).run(); } catch {} }
  ready = true;
}

// ---------- Einstellungen (Absender, Bank) ----------
const CFG_KEYS = ["firma", "marke", "inhaber", "strasse", "plz_ort", "email", "web", "telefon", "iban", "bic", "bank", "fn", "fb_gericht", "ziel_tage", "fusszeile", "bewertung_link"];
const CFG_DEFAULT = { firma: "Mordsteam e.U.", marke: "Brightpage", inhaber: "", strasse: "Sportplatzgasse 16", plz_ort: "7152 Pamhagen", email: "office@brightpage.net", web: "brightpage.net", telefon: "",
  iban: "", bic: "", bank: "", fn: "", fb_gericht: "", ziel_tage: "14", fusszeile: "", bewertung_link: "https://g.page/r/CRyRx0aimESXEBM/review" };
export async function bpConfig(env) {
  await migrateBp(env);
  const r = await env.DB.prepare("SELECT v FROM ledger_settings WHERE k='bp_cfg'").first();
  let c = {}; try { c = JSON.parse(r ? r.v : "{}"); } catch {}
  return { ...CFG_DEFAULT, ...c, uid: env.UID_NR ? String(env.UID_NR) : "" };
}
export async function bpConfigSave(env, b) {
  await migrateBp(env);
  const c = {};
  for (const k of CFG_KEYS) c[k] = s(b[k], k === "fusszeile" ? 300 : 120);
  c.iban = c.iban.toUpperCase().replace(/\s/g, "");
  if (c.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(c.iban)) throw err("IBAN hat kein gültiges Format.");
  c.bic = c.bic.toUpperCase().replace(/\s/g, "");
  if (c.bic && !/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(c.bic)) throw err("BIC hat kein gültiges Format (8 oder 11 Zeichen).");
  if (c.bewertung_link && !/^https:\/\/(g\.page|search\.google\.com|www\.google\.(com|at|de|ch)|maps\.app\.goo\.gl)\//.test(c.bewertung_link)) throw err("Google-Bewertungslink bitte so einfügen, wie Google ihn ausgibt (https://g.page/r/…/review).");
  const t = Number(c.ziel_tage); c.ziel_tage = String(Number.isFinite(t) && t >= 0 && t <= 90 ? Math.round(t) : 14);
  await env.DB.prepare("INSERT INTO ledger_settings (k, v) VALUES ('bp_cfg', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(JSON.stringify(c)).run();
  return bpConfig(env);
}

// ---------- Kunden ----------
// „3100 St. Pölten“ → PLZ + Ort (für ältere Einträge mit einer Zeile)
export function splitPlzOrt(x) { const m = String(x || "").trim().match(/^([A-Z]{0,2}-?\d{4,5})\s+(.+)$/i); return m ? [m[1], m[2]] : ["", String(x || "").trim()]; }
function cleanKunde(b) {
  let plz = s(b.plz, 10), ort = s(b.ort, 100);
  if (!plz && !ort && b.plz_ort) [plz, ort] = splitPlzOrt(s(b.plz_ort, 120));
  const k = { art: b.art === "b2c" ? "b2c" : "b2b", firma: s(b.firma, 120), name: s(b.name, 120), strasse: s(b.strasse, 120), plz, ort, plz_ort: `${plz} ${ort}`.trim(),
    land: s(b.land, 2).toUpperCase() || "AT", uid: s(b.uid, 20).toUpperCase().replace(/[\s.\-]/g, ""), email: s(b.email, 160), sprache: b.sprache === "en" ? "en" : "de", notiz: s(b.notiz, 500),
    telefon: s(b.telefon, 40), website: s(b.website, 200) };
  if (!LAND_OK.has(k.land)) throw err("Land bitte als Kürzel aus der Liste (z. B. AT, DE, CH, GB, US).");
  if (k.art === "b2b" && !k.firma) throw err("Bei Firmen, Vereinen und Organisationen bitte den Namen der Organisation angeben.");
  if (k.art === "b2c" && !k.name) throw err("Bitte den Namen angeben.");
  if (!k.strasse || !k.plz || !k.ort) throw err("Bitte die Anschrift angeben (Straße, PLZ und Ort) – sie muss auf die Rechnung.");
  if (k.art === "b2c") k.uid = "";
  if (k.uid && k.land !== "AT" && EU.includes(k.land) && k.uid.slice(0, 2) !== (k.land === "GR" ? "EL" : k.land)) throw err("Die UID passt nicht zum Land.");
  if (k.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(k.email)) throw err("E-Mail-Adresse prüfen.");
  return k;
}
export async function kundeSave(env, b) {
  await migrateBp(env);
  const k = cleanKunde(b), id = s(b.id, 40);
  if (id) {
    const r = await env.DB.prepare("UPDATE bp_kunden SET art=?, firma=?, name=?, strasse=?, plz_ort=?, plz=?, ort=?, land=?, uid=?, email=?, telefon=?, website=?, sprache=?, notiz=?, updated_at=? WHERE id=? AND deleted=0")
      .bind(k.art, k.firma, k.name, k.strasse, k.plz_ort, k.plz, k.ort, k.land, k.uid, k.email, k.telefon, k.website, k.sprache, k.notiz, now(), id).run();
    if (!r.meta.changes) throw err("Kunde nicht gefunden.", 404);
    return { id };
  }
  const nid = rid();
  await env.DB.prepare("INSERT INTO bp_kunden (id, art, firma, name, strasse, plz_ort, plz, ort, land, uid, email, telefon, website, sprache, notiz, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(nid, k.art, k.firma, k.name, k.strasse, k.plz_ort, k.plz, k.ort, k.land, k.uid, k.email, k.telefon, k.website, k.sprache, k.notiz, now()).run();
  return { id: nid };
}
export async function kundeDelete(env, id) {
  await migrateBp(env);
  const used = await env.DB.prepare("SELECT COUNT(*) n FROM bp_invoices WHERE kunde_id=? AND deleted=0 AND nr IS NOT NULL").bind(id).first();
  if (used && used.n) throw err("Für diesen Kunden gibt es ausgestellte Rechnungen – er bleibt gespeichert (Aufbewahrungspflicht).");
  await env.DB.prepare("UPDATE bp_kunden SET deleted=1, updated_at=? WHERE id=?").bind(now(), id).run();
  await env.DB.prepare("UPDATE bp_abos SET aktiv=0, updated_at=? WHERE kunde_id=?").bind(now(), id).run();
  return { ok: true };
}
async function kundeGet(env, id) {
  const k = await env.DB.prepare("SELECT * FROM bp_kunden WHERE id=? AND deleted=0").bind(id).first();
  if (!k) throw err("Bitte einen Kunden auswählen.");
  return k;
}
const snapshot = (k) => ({ art: k.art, firma: k.firma || "", name: k.name || "", strasse: k.strasse || "", plz_ort: k.plz_ort || "", land: k.land, uid: k.uid || "", email: k.email || "" });

// ---------- Rechnungen ----------
function cleanPositionen(list) {
  const out = [];
  for (const p of Array.isArray(list) ? list.slice(0, 40) : []) {
    const text = s(p.text, 400);
    if (!text) continue;
    const menge = Number(String(p.menge ?? "1").replace(",", "."));
    const preis = typeof p.preis_cents === "number" ? Math.round(p.preis_cents) : cents(p.preis);
    if (!Number.isFinite(menge) || menge <= 0 || menge > 10000) throw err(`Menge prüfen: „${text.slice(0, 40)}“`);
    if (!Number.isFinite(preis) || Math.abs(preis) > 100000000) throw err(`Preis prüfen: „${text.slice(0, 40)}“`);
    out.push({ text, menge: Math.round(menge * 100) / 100, einheit: s(p.einheit, 20), preis_cents: preis, cents: Math.round(menge * preis) });
  }
  return out;
}
const sumPos = (pos) => pos.reduce((a, p) => a + p.cents, 0);

// Entwurf anlegen oder ändern (nur solange keine Nummer vergeben ist)
export async function rechnungSave(env, b) {
  await migrateBp(env);
  const id = s(b.id, 40);
  if (id) {
    const old = await env.DB.prepare("SELECT status FROM bp_invoices WHERE id=? AND deleted=0").bind(id).first();
    if (!old) throw err("Rechnung nicht gefunden.", 404);
    if (old.status !== "entwurf") throw err("Ausgestellte Rechnungen lassen sich nicht mehr ändern – bei Fehlern stornieren und neu ausstellen.");
  }
  const k = await kundeGet(env, s(b.kunde_id, 40));
  const typ = ["rechnung", "anzahlung", "schluss"].includes(b.typ) ? b.typ : "rechnung";
  const pos = cleanPositionen(b.positionen);
  if (!pos.length) throw err("Bitte mindestens eine Position mit Text und Preis eintragen.");
  // Schlussrechnung: bezahlte Anzahlungen desselben Kunden abziehen (ausgewählt im Formular)
  const abz = [];
  if (typ === "schluss") for (const aid of (Array.isArray(b.anzahlungen) ? b.anzahlungen : []).slice(0, 10)) {
    const a = await env.DB.prepare("SELECT id, nr, datum, bezahlt_cents, summe_cents, kunde_id FROM bp_invoices WHERE id=? AND typ='anzahlung' AND status='bezahlt' AND deleted=0").bind(s(aid, 40)).first();
    if (!a || a.kunde_id !== k.id) throw err("Anzahlung nicht gefunden oder noch nicht bezahlt.");
    const dup = await env.DB.prepare("SELECT nr FROM bp_invoices WHERE deleted=0 AND id<>? AND status NOT IN ('entwurf','storniert') AND typ<>'storno' AND abzuege LIKE ?").bind(id || "", `%"id":"${a.id}"%`).first();
    if (dup) throw err(`Die Anzahlung ${a.nr} ist schon in Rechnung ${dup.nr} abgezogen.`);
    abz.push({ id: a.id, nr: a.nr, datum: a.datum, cents: a.bezahlt_cents ?? a.summe_cents });
  }
  const total = sumPos(pos) - abz.reduce((x, a) => x + a.cents, 0);
  if (total < 0) throw err("Die Anzahlungen sind höher als die Rechnungssumme.");
  const sprache = b.sprache === "en" ? "en" : b.sprache === "de" ? "de" : k.sprache || "de";
  const row = { kunde_id: k.id, kunde: JSON.stringify(snapshot(k)), regime: regimeOf(k), sprache, typ, leistung: s(b.leistung, 120), titel: s(b.titel, 160),
    text_oben: s(b.text_oben, 1000), text_unten: s(b.text_unten, 1000), positionen: JSON.stringify(pos), abzuege: JSON.stringify(abz), summe_cents: total };
  if (id) {
    await env.DB.prepare("UPDATE bp_invoices SET kunde_id=?, kunde=?, regime=?, sprache=?, typ=?, leistung=?, titel=?, text_oben=?, text_unten=?, positionen=?, abzuege=?, summe_cents=?, updated_at=? WHERE id=? AND status='entwurf'")
      .bind(row.kunde_id, row.kunde, row.regime, row.sprache, row.typ, row.leistung, row.titel, row.text_oben, row.text_unten, row.positionen, row.abzuege, row.summe_cents, now(), id).run();
    return { id };
  }
  const nid = rid();
  await env.DB.prepare(`INSERT INTO bp_invoices (id, typ, status, kunde_id, kunde, regime, sprache, leistung, titel, text_oben, text_unten, positionen, abzuege, summe_cents, abo_id, abo_periode, created_at)
    VALUES (?,?,'entwurf',?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(nid, row.typ, row.kunde_id, row.kunde, row.regime, row.sprache, row.leistung, row.titel, row.text_oben, row.text_unten,
    row.positionen, row.abzuege, row.summe_cents, s(b.abo_id, 40) || null, s(b.abo_periode, 7) || null, now()).run();
  return { id: nid };
}

// nächste freie Nummer BP-JJJJ-NNN (fortlaufend je Jahr, über alle Typen inkl. Storno)
async function nextNr(env, year) {
  const r = await env.DB.prepare("SELECT nr FROM bp_invoices WHERE nr LIKE ? ORDER BY nr DESC LIMIT 1").bind(`BP-${year}-%`).first();
  const n = r ? Number(String(r.nr).split("-")[2]) + 1 : 1;
  return `BP-${year}-${String(n).padStart(3, "0")}`;
}

// Ausstellen: Nummer, Rechnungsdatum, Fälligkeit, Kundendaten werden eingefroren (aktuelle Anschrift aus der Kundenliste)
export async function rechnungAusstellen(env, b) {
  await migrateBp(env);
  const cfg = await bpConfig(env);
  if (!cfg.strasse || !cfg.plz_ort) throw err("Bitte zuerst unter „Einstellungen“ die Absender-Anschrift eintragen.");
  if (!cfg.iban) throw err("Bitte zuerst unter „Einstellungen“ die IBAN eintragen.");
  const inv = await env.DB.prepare("SELECT * FROM bp_invoices WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!inv) throw err("Rechnung nicht gefunden.", 404);
  if (inv.status !== "entwurf") throw err("Diese Rechnung ist schon ausgestellt.");
  const k = await kundeGet(env, inv.kunde_id);
  const regime = regimeOf(k);
  if (regime === "rc_eu" && !cfg.uid) throw err("Reverse-Charge-Rechnungen brauchen die eigene UID (Cloudflare-Variable UID_NR).");
  // dieselbe Anzahlung darf nur in EINER gültigen Rechnung abgezogen sein (z. B. zwei offene Admin-Tabs, 20.10.2026)
  for (const a of JSON.parse(inv.abzuege || "[]")) {
    const dup = await env.DB.prepare("SELECT nr FROM bp_invoices WHERE deleted=0 AND id<>? AND status NOT IN ('entwurf','storniert') AND typ<>'storno' AND abzuege LIKE ?").bind(inv.id, `%"id":"${a.id}"%`).first();
    if (dup) throw err(`Die Anzahlung ${a.nr} ist schon in Rechnung ${dup.nr} abgezogen.`);
  }
  const datum = isDate(b.datum) ? b.datum : today();
  const faellig = addDays(datum, Number(cfg.ziel_tage) || 14);
  for (let i = 0; i < 3; i++) {
    const nr = await nextNr(env, datum.slice(0, 4));
    try {
      const r = await env.DB.prepare("UPDATE bp_invoices SET nr=?, status='offen', datum=?, faellig=?, kunde=?, regime=?, updated_at=? WHERE id=? AND status='entwurf'")
        .bind(nr, datum, faellig, JSON.stringify(snapshot(k)), regime, now(), inv.id).run();
      if (!r.meta.changes) throw err("Diese Rechnung ist schon ausgestellt.");
      return { id: inv.id, nr };
    } catch (e) { if (e.status || !/UNIQUE/i.test(String(e.message))) throw e; }   // Nummer gerade vergeben → nächste
  }
  throw err("Nummer konnte nicht vergeben werden – bitte nochmal versuchen.", 409);
}

export async function rechnungBezahlt(env, b) {
  await migrateBp(env);
  const inv = await env.DB.prepare("SELECT * FROM bp_invoices WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!inv) throw err("Rechnung nicht gefunden.", 404);
  if (b.zurueck) {   // Zahlung zurücknehmen (Tippfehler)
    if (inv.status !== "bezahlt") throw err("Die Rechnung ist nicht als bezahlt markiert.");
    const used = await env.DB.prepare("SELECT nr FROM bp_invoices WHERE deleted=0 AND status NOT IN ('entwurf','storniert') AND typ<>'storno' AND abzuege LIKE ?").bind(`%"id":"${inv.id}"%`).first();
    if (used) throw err(`Diese Anzahlung ist schon in Rechnung ${used.nr} abgezogen.`);
    await env.DB.prepare("UPDATE bp_invoices SET status='offen', bezahlt_am=NULL, bezahlt_cents=NULL, updated_at=? WHERE id=?").bind(now(), inv.id).run();
    return { ok: true };
  }
  if (inv.status !== "offen") throw err(inv.status === "entwurf" ? "Bitte die Rechnung zuerst ausstellen." : "Die Rechnung ist nicht offen.");
  if (!isDate(b.bezahlt_am)) throw err("Bitte das Datum der Gutschrift am Konto angeben.");
  if (b.bezahlt_am < inv.datum) throw err("Das Zahlungsdatum liegt vor dem Rechnungsdatum. Anzahlungen vor der Rechnung: Rechnung mit dem Datum der Zahlung ausstellen.");
  const c = b.betrag ? cents(b.betrag) : inv.summe_cents;
  if (!Number.isFinite(c) || c <= 0) throw err("Betrag prüfen.");
  await env.DB.prepare("UPDATE bp_invoices SET status='bezahlt', bezahlt_am=?, bezahlt_cents=?, updated_at=? WHERE id=?").bind(b.bezahlt_am, c, now(), inv.id).run();
  return { ok: true, abweichung: c !== inv.summe_cents ? c - inv.summe_cents : 0 };
}

// Erstattung einer bezahlten Rechnung (z. B. nach Widerruf, § 15 FAGG: binnen 14 Tagen ab Eingang des Widerrufs).
// Die Rechnung bleibt „bezahlt“; die E/A-Rechnung zählt nur den behaltenen Betrag (wie Erstattungen im Shop: refunded_cents).
// Teilbetrag möglich (anteiliges Entgelt bei verlangtem vorzeitigem Beginn). zurueck=true nimmt eine Fehlbuchung zurück.
export async function rechnungErstattung(env, b) {
  await migrateBp(env);
  const inv = await env.DB.prepare("SELECT * FROM bp_invoices WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!inv) throw err("Rechnung nicht gefunden.", 404);
  if (b.zurueck) { await env.DB.prepare("UPDATE bp_invoices SET erstattet_cents=NULL, erstattet_am=NULL, erstattet_grund=NULL, updated_at=? WHERE id=?").bind(now(), inv.id).run(); return { ok: true }; }
  if (inv.status !== "bezahlt") throw err("Erstatten geht nur bei bezahlten Rechnungen. Offene Rechnungen stornieren.");
  if (!isDate(b.am)) throw err("Bitte das Datum der Rücküberweisung angeben.");
  if (b.am < inv.bezahlt_am) throw err("Die Rücküberweisung kann nicht vor der Zahlung liegen.");
  if (b.am > new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Vienna" })) throw err("Die Rücküberweisung kann nicht in der Zukunft liegen – erst erfassen, wenn das Geld überwiesen ist.");
  const c = cents(b.betrag);
  if (!Number.isFinite(c) || c <= 0) throw err("Betrag prüfen.");
  if (c > (inv.bezahlt_cents || 0)) throw err("Es kann höchstens der bezahlte Betrag erstattet werden.");
  await env.DB.prepare("UPDATE bp_invoices SET erstattet_cents=?, erstattet_am=?, erstattet_grund=?, updated_at=? WHERE id=?").bind(c, b.am, s(b.grund, 300), now(), inv.id).run();
  return { ok: true };
}

// Stornieren: nur offene Rechnungen (bezahlte: Erstattung mit der Steuerberatung klären). Erzeugt eine Stornorechnung mit eigener Nummer.
export async function rechnungStorno(env, b) {
  await migrateBp(env);
  const inv = await env.DB.prepare("SELECT * FROM bp_invoices WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!inv) throw err("Rechnung nicht gefunden.", 404);
  if (inv.status === "entwurf") { await env.DB.prepare("UPDATE bp_invoices SET deleted=1, updated_at=? WHERE id=?").bind(now(), inv.id).run(); return { ok: true, geloescht: true }; }
  if (inv.status !== "offen") throw err("Nur offene Rechnungen lassen sich stornieren. Bei bezahlten Rechnungen die Erstattung mit der Steuerberatung klären.");
  if (inv.typ === "storno") throw err("Eine Stornorechnung lässt sich nicht stornieren.");
  const datum = today(), nid = rid();
  const pos = JSON.parse(inv.positionen || "[]").map((p) => ({ ...p, preis_cents: -p.preis_cents, cents: -p.cents }));
  const abz = JSON.parse(inv.abzuege || "[]").map((a) => ({ ...a, cents: -a.cents }));
  for (let i = 0; i < 3; i++) {
    const nr = await nextNr(env, datum.slice(0, 4));
    try {
      await env.DB.prepare(`INSERT INTO bp_invoices (id, nr, typ, status, kunde_id, kunde, regime, sprache, datum, leistung, faellig, titel, text_oben, text_unten, positionen, abzuege, summe_cents, storno_von, created_at)
        VALUES (?,?,'storno','storniert',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(nid, nr, inv.kunde_id, inv.kunde, inv.regime, inv.sprache, datum, inv.leistung, datum,
        (inv.sprache === "en" ? "for invoice " : "zu Rechnung ") + inv.nr, s(b.grund, 300), "", JSON.stringify(pos), JSON.stringify(abz), -inv.summe_cents, inv.id, now()).run();
      await env.DB.prepare("UPDATE bp_invoices SET status='storniert', storno_nr=?, updated_at=? WHERE id=?").bind(nr, now(), inv.id).run();
      return { ok: true, nr };
    } catch (e) { if (!/UNIQUE/i.test(String(e.message))) throw e; }
  }
  throw err("Nummer konnte nicht vergeben werden – bitte nochmal versuchen.", 409);
}

// ---------- Abos (Service, Werbe-Betreuung, KI-Betrieb) ----------
export async function aboSave(env, b) {
  await migrateBp(env);
  await kundeGet(env, s(b.kunde_id, 40));
  const preis = cents(b.preis);
  const rh = ["monat", "quartal", "jahr"].includes(b.rhythmus) ? b.rhythmus : "monat";
  if (!s(b.titel, 160)) throw err("Bitte eine Bezeichnung angeben (z. B. „Service Basis“).");
  if (!Number.isFinite(preis) || preis <= 0) throw err("Preis prüfen.");
  if (!isYm(b.start)) throw err("Beginn als Monat angeben (JJJJ-MM).");
  if (b.ende && !isYm(b.ende)) throw err("Ende als Monat angeben (JJJJ-MM) oder leer lassen.");
  const id = s(b.id, 40);
  if (id) {
    await env.DB.prepare("UPDATE bp_abos SET kunde_id=?, titel=?, preis_cents=?, rhythmus=?, start=?, ende=?, aktiv=?, updated_at=? WHERE id=?")
      .bind(s(b.kunde_id, 40), s(b.titel, 160), preis, rh, b.start, b.ende || null, b.aktiv === false ? 0 : 1, now(), id).run();
    return { id };
  }
  // Nachttest D-2.11: Doppelklick legte zwei gleiche aktive Abos an
  const dup = await env.DB.prepare("SELECT id FROM bp_abos WHERE kunde_id=? AND lower(titel)=lower(?) AND aktiv=1").bind(s(b.kunde_id, 40), s(b.titel, 160)).first().catch(() => null);
  if (dup) throw err("Dieses Abo läuft für den Kunden schon (gleiche Bezeichnung, aktiv). Unter Brightpage → Abos ansehen oder die Bezeichnung ändern.");
  const nid = rid();
  await env.DB.prepare("INSERT INTO bp_abos (id, kunde_id, titel, preis_cents, rhythmus, start, ende, aktiv, created_at) VALUES (?,?,?,?,?,?,?,1,?)")
    .bind(nid, s(b.kunde_id, 40), s(b.titel, 160), preis, rh, b.start, b.ende || null, now()).run();
  return { id: nid };
}
const STEP = { monat: 1, quartal: 3, jahr: 12 };
const ymAdd = (ym, n) => { let [y, m] = ym.split("-").map(Number); m += n; while (m > 12) { m -= 12; y++; } return `${y}-${String(m).padStart(2, "0")}`; };
const MON = { de: ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
function periodLabel(ym, rh, lang) {
  const M = MON[lang === "en" ? "en" : "de"], [y, m] = ym.split("-").map(Number);
  if (rh === "monat") return `${M[m - 1]} ${y}`;
  const end = ymAdd(ym, STEP[rh] - 1), [y2, m2] = end.split("-").map(Number);
  return `${M[m - 1]}${y !== y2 ? " " + y : ""} – ${M[m2 - 1]} ${y2}`;
}
// Zeiträume bis einschließlich laufendem Monat, für die es noch keine Rechnung (auch keinen Entwurf) gibt
async function aboOpen(env, a) {
  const cur = today().slice(0, 7), have = new Set((await env.DB.prepare("SELECT abo_periode FROM bp_invoices WHERE abo_id=? AND deleted=0 AND typ<>'storno' AND status<>'storniert'").bind(a.id).all()).results.map((r) => r.abo_periode));
  const out = [];
  for (let p = a.start, g = 0; p <= cur && g < 120; p = ymAdd(p, STEP[a.rhythmus] || 1), g++) {
    if (a.ende && p > a.ende) break;
    if (!have.has(p)) out.push(p);
  }
  return out;
}
export async function aboRechnungen(env) {
  await migrateBp(env);
  const abos = (await env.DB.prepare("SELECT * FROM bp_abos WHERE aktiv=1").all()).results;
  let n = 0;
  for (const a of abos) {
    const k = await env.DB.prepare("SELECT * FROM bp_kunden WHERE id=? AND deleted=0").bind(a.kunde_id).first();
    if (!k) continue;
    for (const p of await aboOpen(env, a)) {
      const lang = k.sprache === "en" ? "en" : "de", lab = periodLabel(p, a.rhythmus, lang);
      await rechnungSave(env, { kunde_id: k.id, typ: "rechnung", sprache: lang, leistung: lab, titel: a.titel + " – " + lab,
        positionen: [{ text: `${a.titel} (${lab})`, menge: 1, einheit: lang === "en" ? "flat" : "pauschal", preis_cents: a.preis_cents }], abo_id: a.id, abo_periode: p });
      n++;
    }
  }
  return { angelegt: n };
}

// ---------- Übersicht für den Admin ----------
export async function bpOverview(env) {
  await migrateBp(env);
  const cfg = await bpConfig(env);
  const kunden = (await env.DB.prepare("SELECT * FROM bp_kunden WHERE deleted=0 ORDER BY COALESCE(NULLIF(firma,''), name)").all()).results.map((k) => { const [p, o] = k.plz || k.ort ? [k.plz || "", k.ort || ""] : splitPlzOrt(k.plz_ort); return { ...k, plz: p, ort: o, regime: regimeOf(k) }; });
  const rechnungen = (await env.DB.prepare("SELECT * FROM bp_invoices WHERE deleted=0 ORDER BY COALESCE(nr,'ZZZ') DESC, created_at DESC LIMIT 500").all()).results
    .map((r) => ({ ...r, kunde: JSON.parse(r.kunde || "{}"), positionen: JSON.parse(r.positionen || "[]"), abzuege: JSON.parse(r.abzuege || "[]") }));
  const abos = [];
  for (const a of (await env.DB.prepare("SELECT * FROM bp_abos ORDER BY aktiv DESC, created_at").all()).results) abos.push({ ...a, offen: a.aktiv ? (await aboOpen(env, a)).length : 0 });
  const t = today(), y = t.slice(0, 4);
  const sum = (f) => rechnungen.filter(f).reduce((a, r) => a + (r.status === "bezahlt" ? (r.bezahlt_cents || 0) - (r.erstattet_cents || 0) : r.summe_cents), 0);
  const stats = {
    jahr: y,
    bezahlt: sum((r) => r.status === "bezahlt" && (r.bezahlt_am || "").startsWith(y)),
    offen: sum((r) => r.status === "offen"), offen_n: rechnungen.filter((r) => r.status === "offen").length,
    ueberfaellig_n: rechnungen.filter((r) => r.status === "offen" && r.faellig && r.faellig < t).length,
    entwuerfe_n: rechnungen.filter((r) => r.status === "entwurf").length,
    abo_monat: abos.filter((a) => a.aktiv).reduce((x, a) => x + Math.round(a.preis_cents / (STEP[a.rhythmus] || 1)), 0),
    abo_offen: abos.reduce((x, a) => x + a.offen, 0),
  };
  const fehlt = [];
  if (!cfg.strasse || !cfg.plz_ort) fehlt.push("Absender-Anschrift");
  if (!cfg.iban) fehlt.push("IBAN");
  if (!cfg.fn) fehlt.push("Firmenbuchnummer (Pflicht auf Rechnungen der e.U., § 14 UGB)");
  let auftraege = [];   // für die Kundenkarte (Aufträge je Kunde), Tabelle aus lib/bpauftrag.js
  try { auftraege = (await env.DB.prepare("SELECT id, nr, status, kunde_id, wert_cents, firma, name, created_at FROM bp_auftraege WHERE deleted=0 AND kunde_id IS NOT NULL ORDER BY created_at DESC").all()).results; } catch {}
  return { cfg, kunden, rechnungen, abos, auftraege, stats, fehlt, today: t, regime_label: REGIME_LABEL, vat: VAT_LINE };
}

// ---------- Buchhaltung: bezahlte Brightpage-Rechnungen im Format der Bestellungen ----------
// Wird in lib/accounting.js (Einnahmen, Kleinunternehmergrenze, U30, ZM) und lib/ledger.js (E/A-Rechnung) mit den Bestellungen zusammengeführt.
// pay_provider „bp“ = Banküberweisung, keine Gebühr, immer Euro. Zeitpunkt = Mittag (Wien) des Zahlungstags (Zufluss).
export async function bpPaidRows(env, from, to) {
  try {
    await migrateBp(env);
    const vonYmd = VIENNA.format(new Date(from)), bisYmd = VIENNA.format(new Date(to));
    const rows = (await env.DB.prepare("SELECT * FROM bp_invoices WHERE deleted=0 AND status='bezahlt' AND bezahlt_am BETWEEN ? AND ?").bind(vonYmd, bisYmd).all()).results;
    return rows.map((r) => {
      const k = JSON.parse(r.kunde || "{}"), amt = r.bezahlt_cents || 0;
      return { id: "bp:" + r.id, status: "paid", paket: "brightpage", paddle_txn: null, stripe_session: null, amount_cents: amt, refunded_cents: r.erstattet_cents || null, fee_cents: 0, net_cents: amt, tax_cents: 0,
        bill_country: k.land || "AT", tax_id: k.uid ? 1 : 0, tax_regime: r.regime, cust_uid: k.uid || null, pay_provider: "bp", invoice_no: r.nr,
        contact: JSON.stringify({ kunde: k.art === "b2c" ? "b2c" : "b2b", produkt: r.nr }), paid_at: noonVienna(r.bezahlt_am), currency: "EUR", eur_ok: 1, amount_orig_cents: null,
        card_country: null, addr_country: null, land_ok: 1 };
    });
  } catch { return []; }   // Brightpage darf die Shop-Buchhaltung nie blockieren
}
