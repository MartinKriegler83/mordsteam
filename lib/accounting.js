// Buchhaltung: Einnahmen nach Kundenart (Unternehmen/Privat) und Region (Inland/EU/Drittland) – für die E/A-Rechnung
// und die 10.000-€-Schwelle für elektronische Dienstleistungen an Privatkunden in anderen EU-Ländern.
import { stripeApi } from "./stripe.js";

export const EU = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
export const EU_B2C_LIMIT_CENTS = 1000000;
export const KU_LIMIT_CENTS = 5500000;       // Kleinunternehmergrenze 55.000 € brutto (seit 2025), nur in Österreich steuerbare Umsätze   // 10.000 € pro Kalenderjahr (EU-weit, Privatkunden außerhalb Österreichs)

export function region(country) {
  const c = String(country || "").toUpperCase();
  if (!c) return "unbekannt";
  if (c === "AT") return "inland";
  return EU.includes(c) ? "eu" : "drittland";
}
export const REGION_LABEL = { inland: "Inland (AT)", eu: "EU-Ausland", drittland: "Nicht-EU-Ausland", unbekannt: "Land unbekannt" };

let accReady = false;
export async function migrateAccounting(env) {
  if (accReady) return;
  // tax_regime/cust_uid/pay_provider: siehe lib/tax.js · paddle_txn/tax_cents: Paddle (britische Privatkunden)
  for (const q of ["ALTER TABLE orders ADD COLUMN bill_country TEXT", "ALTER TABLE orders ADD COLUMN fee_cents INTEGER", "ALTER TABLE orders ADD COLUMN net_cents INTEGER", "ALTER TABLE orders ADD COLUMN tax_id INTEGER",
    "ALTER TABLE orders ADD COLUMN tax_regime TEXT", "ALTER TABLE orders ADD COLUMN cust_uid TEXT", "ALTER TABLE orders ADD COLUMN pay_provider TEXT", "ALTER TABLE orders ADD COLUMN paddle_txn TEXT",
    "ALTER TABLE orders ADD COLUMN tax_cents INTEGER", "ALTER TABLE orders ADD COLUMN invoice_no TEXT",
    "ALTER TABLE orders ADD COLUMN currency TEXT", "ALTER TABLE orders ADD COLUMN amount_orig_cents INTEGER",
    // eur_ok = 1: amount_cents ist sicher der Euro-Betrag (bei Zahlung in Pfund/Dollar aus der Auszahlung) – Go-live-Test 4, M12
    "ALTER TABLE orders ADD COLUMN eur_ok INTEGER",
    // Erstattung/Rückbuchung (Admin-Knopf „Erstattet“, Go-live-Test 4, M13): Betrag in Euro, Zeitpunkt, Notiz
    // Land laut Stripe (Karte, Rechnungsadresse) als zweiter Beleg zum Kundenland (Go-live-Test 4, M14)
    "ALTER TABLE orders ADD COLUMN card_country TEXT", "ALTER TABLE orders ADD COLUMN addr_country TEXT",
    "ALTER TABLE orders ADD COLUMN refunded_cents INTEGER", "ALTER TABLE orders ADD COLUMN refunded_at INTEGER", "ALTER TABLE orders ADD COLUMN refund_note TEXT"]) {
    try { await env.DB.prepare(q).run(); } catch {}
  }
  accReady = true;
}

// Zahlungsdaten aus Stripe holen: Rechnungsland, UID ja/nein, Stripe-Gebühr und Auszahlung. Fehler blockieren nie etwas.
export async function enrichPayment(env, orderId, sessionId) {
  if (!env.STRIPE_SECRET_KEY || !sessionId) return false;
  try {
    await migrateAccounting(env);
    const cs = await stripeApi(env, "GET", `checkout/sessions/${sessionId}?expand[]=payment_intent.latest_charge.balance_transaction`);
    const cd = cs.customer_details || {};
    const ch = cs.payment_intent && cs.payment_intent.latest_charge;
    const card = ch && ch.payment_method_details && ch.payment_method_details.card;
    // Rechnungsland; falls Stripe keine Adresse abgefragt hat, das Ausgabeland der Karte
    const country = (cd.address && cd.address.country) || (card && card.country) || null;
    const taxId = Array.isArray(cd.tax_ids) && cd.tax_ids.length ? 1 : 0;
    const bt = cs.payment_intent && cs.payment_intent.latest_charge && cs.payment_intent.latest_charge.balance_transaction;
    const fee = bt && typeof bt === "object" ? bt.fee : null, net = bt && typeof bt === "object" ? bt.net : null;
    // Bezahlt in Pfund/Dollar: gebucht wird der Euro-Betrag der Stripe-Buchung
    if (bt && typeof bt === "object" && bt.currency === "eur" && Number.isFinite(bt.amount))
      await env.DB.prepare("UPDATE orders SET amount_cents=?, eur_ok=1 WHERE id=? AND currency IS NOT NULL AND currency<>'EUR'").bind(bt.amount, orderId).run();
    // Rechnungsland aus dem Bestellformular hat Vorrang (danach richtet sich die Rechnung); Stripe nur, falls es fehlt
    await env.DB.prepare("UPDATE orders SET bill_country=COALESCE(bill_country, ?), tax_id=?, fee_cents=COALESCE(?, fee_cents), net_cents=COALESCE(?, net_cents), card_country=COALESCE(?, card_country), addr_country=COALESCE(?, addr_country) WHERE id=?")
      .bind(country, taxId, fee, net, (card && card.country) || null, (cd.address && cd.address.country) || null, orderId).run();
    return true;
  } catch { return false; }
}

// Zeitzone der Buchhaltung: Europe/Vienna (Winterzeit +01:00, Sommerzeit +02:00) – Offset per Intl ermitteln
const VIENNA = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Vienna", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
function viennaOffset(ms) {   // Wiener Ortszeit minus UTC in ms
  const p = Object.fromEntries(VIENNA.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
// 00:00 Uhr Wiener Zeit am Tag „yyyy-mm-dd“ als Zeitstempel (ms); ungültig → NaN
export function viennaMidnight(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
  if (!m) return NaN;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  let t = utc - viennaOffset(utc);
  t = utc - viennaOffset(t);   // Offset am Ergebnis nachprüfen (Umstellungstage)
  return t;
}
// letzte Millisekunde des Tages „yyyy-mm-dd“ in Wiener Zeit (für BETWEEN … AND …)
export function viennaDayEnd(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
  if (!m) return NaN;
  const next = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1)).toISOString().slice(0, 10);
  return viennaMidnight(next) - 1;
}
export const viennaYear = (ms) => +new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Vienna", year: "numeric" }).format(new Date(ms));

// Übersicht: Summen je Kundenart × Region für einen Zeitraum, plus EU-Privatkunden im laufenden Kalenderjahr
// Zahlung in Pfund/Dollar ohne gesicherten Euro-Betrag: zählt nirgends mit, bis der Euro-Betrag nachgetragen ist
export const eurMissing = (o) => !!o.currency && o.currency !== "EUR" && !o.eur_ok;
// Umsatz nach Erstattung: Widerruf ohne eingetragenen Betrag gilt als voll erstattet (wie bisher)
export const netAmount = (o) => (o.status === "withdrawn" && o.refunded_cents == null ? 0 : Math.max(0, (o.amount_cents || 0) - (o.refunded_cents || 0)));
export async function accountingSummary(env, from, to) {
  await migrateAccounting(env);
  const rows = (await env.DB.prepare("SELECT id, status, stripe_session, amount_cents, refunded_cents, fee_cents, net_cents, tax_cents, bill_country, tax_id, tax_regime, cust_uid, pay_provider, invoice_no, contact, paid_at, currency, eur_ok, amount_orig_cents, card_country, addr_country FROM orders WHERE status IN ('paid','fulfilling','fulfilled','refunded','withdrawn') AND paid_at BETWEEN ? AND ?").bind(from, to).all()).results;
  // fehlende Stripe-Daten nachholen (höchstens 20 pro Aufruf)
  let n = 0;
  for (const o of rows) if (o.stripe_session && o.fee_cents == null && n < 20) { n++; if (await enrichPayment(env, o.id, o.stripe_session)) Object.assign(o, await env.DB.prepare("SELECT fee_cents, net_cents, bill_country, tax_id, amount_cents, eur_ok, card_country, addr_country FROM orders WHERE id=?").bind(o.id).first()); }
  for (const o of rows) o.amount_cents = netAmount(o);
  const missing = rows.filter(eurMissing).map((o) => ({ id: o.id, date: o.paid_at, currency: o.currency, orig: o.amount_orig_cents, provider: o.pay_provider || "" }));
  const okRows = rows.filter((o) => !eurMissing(o) && o.amount_cents > 0);
  const groups = {};
  for (const o of okRows) {
    const c = JSON.parse(o.contact || "{}"), kind = c.kunde === "b2b" || (!o.tax_regime && o.tax_id) ? "unternehmen" : "privat", reg = region(o.bill_country);
    const k = kind + ":" + reg, g = (groups[k] ||= { kunde: kind, region: reg, count: 0, gross: 0, fee: 0, net: 0 });
    g.count++; g.gross += o.amount_cents || 0; g.fee += o.fee_cents || 0; g.net += o.net_cents ?? ((o.amount_cents || 0) - (o.fee_cents || 0));
  }
  const y = viennaYear(to), ys = viennaMidnight(`${y}-01-01`), ye = viennaMidnight(`${y + 1}-01-01`) - 1;   // Kalenderjahr in Wiener Zeit
  const all = (await env.DB.prepare("SELECT status, amount_cents, refunded_cents, bill_country, tax_id, tax_regime, contact, currency, eur_ok FROM orders WHERE status IN ('paid','fulfilling','fulfilled','refunded','withdrawn') AND paid_at BETWEEN ? AND ?").bind(ys, ye).all()).results;
  // EU-Privatumsatz für die 10.000-€-Schwelle: alles mit Kleinunternehmer-Rechnung in ein anderes EU-Land
  const isEuB2C = (o) => region(o.bill_country) === "eu" && (o.tax_regime ? o.tax_regime === "ku" : !(JSON.parse(o.contact || "{}").kunde === "b2b" || o.tax_id));
  for (const o of all) o.amount_cents = netAmount(o);
  const allOk = all.filter((o) => !eurMissing(o) && o.amount_cents > 0);
  const euB2C = allOk.filter(isEuB2C).reduce((a, o) => a + (o.amount_cents || 0), 0);
  // Kleinunternehmergrenze: in Österreich steuerbare Umsätze = alle Kleinunternehmer-Rechnungen (AT + EU-Privat)
  const kuSum = allOk.filter((o) => (o.tax_regime ? o.tax_regime === "ku" : region(o.bill_country) === "inland" || isEuB2C(o))).reduce((a, o) => a + (o.amount_cents || 0), 0);
  // Zusammenfassende Meldung: EU-Firmen mit gültiger UID (Reverse Charge) im gewählten Zeitraum
  const zm = okRows.filter((o) => o.tax_regime === "rc_eu").map((o) => ({ date: o.paid_at, uid: o.cust_uid, land: o.bill_country, cents: o.amount_cents || 0, invoice: o.invoice_no || null }));
  // je Rechnungsart und Bezahlweg
  const RN = { ku: "Kleinunternehmer (steuerfrei)", rc_eu: "EU-Firma, Reverse Charge", dl_b2b: "Nicht-EU-Firma, nicht steuerbar", dl_b2c: "Nicht-EU-Privat, nicht steuerbar", uk_paddle: "UK über Paddle" };
  const regimes = {};
  for (const o of okRows) { const k = o.tax_regime || "alt"; const g = (regimes[k] ||= { regime: k, label: RN[k] || "vor dem 6.10.2026 (ohne Zuordnung)", count: 0, gross: 0, tax: 0 }); g.count++; g.gross += o.amount_cents || 0; g.tax += o.tax_cents || 0; }
  // Rechnungsland weicht vom Land der Karte oder der Stripe-Adresse ab → prüfen (Paddle prüft selbst)
  const landCheck = okRows.filter((o) => o.pay_provider !== "paddle" && o.bill_country && ((o.card_country && o.card_country !== o.bill_country) || (o.addr_country && o.addr_country !== o.bill_country)))
    .map((o) => ({ id: o.id, date: o.paid_at, bill: o.bill_country, card: o.card_country || "", addr: o.addr_country || "", regime: o.tax_regime || "" }));
  return { groups: Object.values(groups), regimes: Object.values(regimes), zm, eur_missing: missing, land_check: landCheck,
    eu_b2c: { year: y, cents: euB2C, limit: EU_B2C_LIMIT_CENTS, warn: Math.round(EU_B2C_LIMIT_CENTS * 0.8) },
    ku: { year: y, cents: kuSum, limit: KU_LIMIT_CENTS } };
}

// ---------- Ausgaben: Liste aller absetzbaren Kosten (Checkliste für die E/A-Rechnung) ----------
// Eine Zeile je Kostenposten mit Rhythmus, Betrag, betrieblichem Anteil und wo der Beleg liegt.
// Die Startliste wird einmal angelegt (feste IDs, INSERT OR IGNORE); Gelöschtes kommt nicht zurück (deleted=1).
export const COST_ART = { monatlich: "monatlich", quartal: "vierteljährlich", jaehrlich: "jährlich", einmalig: "einmalig", nutzung: "nach Verbrauch" };
const COST_SEED = [
  ["claude-abo", "Claude-Abo (claude.ai)", "Anthropic", "monatlich", 14999, "EUR", null, "Rechnung per Mail von Anthropic; claude.ai → Einstellungen → Abrechnung", "Gemischt genutzt: betrieblichen Anteil festlegen und begründen – oder eigenes Abo nur für Mordsteam. Ausländischer Anbieter: Reverse Charge mit WKO/Steuerberater klären."],
  ["claude-api", "Claude API (KI-Figuren im Spiel)", "Anthropic", "nutzung", null, "USD", 100, "platform.claude.com → Settings → Billing → Invoices", "Guthaben-Aufladungen; Verbrauch im Tab Betrieb."],
  ["cloudflare", "Cloudflare Workers Paid (Hosting, Datenbank)", "Cloudflare", "monatlich", 500, "USD", 100, "dash.cloudflare.com → Manage Account → Billing", ""],
  ["resend", "Resend (Mailversand)", "Resend", "monatlich", 0, "USD", 100, "resend.com → Settings → Billing", "Bis zum Go-live Free; danach Pro 20 $/Monat (50.000 Mails) – Betrag dann ändern."],
  ["domain", "Domain mordsteam.com", "", "jaehrlich", null, "EUR", 100, "Rechnung des Domain-Anbieters", "Anbieter und Betrag eintragen."],
  ["m365", "Microsoft 365 (über den App Store)", "Apple", "jaehrlich", 9900, "EUR", 40, "Rechnung von Apple: reportaproblem.apple.com bzw. Bestätigungsmail", "Gekauft im App Store – Verkäufer ist Apple. Gemischt genutzt, 40 % betrieblich (Angabe Martin, 6.10.2026) – Anteil begründen; „Seit“ = Monat der Verlängerung eintragen."],
  ["icloud", "iCloud+ (E-Mail office@mordsteam.com)", "Apple", "monatlich", null, "EUR", null, "Apple-Rechnung per Mail / reportaproblem.apple.com", "Gemischt privat/betrieblich: Anteil festlegen."],
  ["stripe", "Stripe-Gebühren", "Stripe", "nutzung", null, "EUR", 100, "Stripe Dashboard → Berichte / monatliche Gebührenrechnung", "Je Zahlung; Summe steht in der Buchhaltungs-Übersicht."],
  ["github", "GitHub", "GitHub", "monatlich", 0, "USD", 100, "github.com → Settings → Billing", "Free-Plan – nur ändern, falls bezahlt."],
  ["firmenbuch", "Firmenbuch-Eintragung Mordsteam e.U.", "Republik Österreich (Justiz)", "einmalig", null, "EUR", 100, "Gebührenvorschreibung / JustizOnline", "Betrag laut Vorschreibung; eventuell gebührenfrei nach NeuFöG."],
  ["gewerbe", "Gewerbeanmeldung", "Bezirkshauptmannschaft", "einmalig", null, "EUR", 100, "Bescheid", "Betrag eintragen, sobald angemeldet."],
  ["svs", "SVS-Beiträge (Sozialversicherung)", "SVS", "quartal", null, "EUR", 100, "SVS-Vorschreibung / meineSV", "Ab Gewerbeanmeldung; als Betriebsausgabe absetzbar."],
  ["wko", "WKO-Grundumlage", "Wirtschaftskammer", "jaehrlich", null, "EUR", 100, "WKO-Vorschreibung", "Ab Gewerbeanmeldung."],
  ["konto", "Geschäftskonto – s Plus Kontoführung", "", "monatlich", 2125, "EUR", 100, "Kontoauszug der Bank (monatliche Kontoführungsgebühr)", "Ca. 21,25 € pro Monat (Angabe Martin, 6.10.2026) – Betrag bei Änderung anpassen."],
  ["arbeitsmittel", "Arbeitsmittel anteilig (MacBook, Handy, Internet)", "", "nutzung", null, "EUR", null, "Kaufbelege, Mobilfunk-/Internetrechnungen", "Betrieblichen Anteil festlegen; Computer über die Abschreibung (AfA)."],
];
let costsReady = false;
export async function migrateCosts(env) {
  if (costsReady) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS cost_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, anbieter TEXT, art TEXT NOT NULL, betrag_cents INTEGER, waehrung TEXT NOT NULL DEFAULT 'EUR', anteil INTEGER, seit TEXT, beleg TEXT, hinweis TEXT, sort INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0, updated_at INTEGER)").run();
  try { await env.DB.prepare("ALTER TABLE cost_items ADD COLUMN tag INTEGER").run(); } catch {}   // Abbuchung am Monatstag (6.10.2026)
  try { await env.DB.prepare("ALTER TABLE cost_items ADD COLUMN frist INTEGER").run(); } catch {}   // in „Fristen und Meldungen“ zeigen (Zahlung laut Vorschreibung)
  const st = env.DB.prepare("INSERT OR IGNORE INTO cost_items (id, name, anbieter, art, betrag_cents, waehrung, anteil, beleg, hinweis, sort, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  await env.DB.batch(COST_SEED.map(([id, n, a, art, b, w, p, beleg, h], i) => st.bind(id, n, a, art, b, w, p, beleg, h, (i + 1) * 10, Date.now())));
  await env.DB.prepare("UPDATE cost_items SET frist=1 WHERE id IN ('svs','wko') AND frist IS NULL").run();
  // Microsoft 365 wird über den App Store gekauft: Verkäufer ist Apple (6.10.2026) – nur, solange die Vorlage unverändert ist
  await env.DB.prepare("UPDATE cost_items SET name='Microsoft 365 (über den App Store)', anbieter='Apple', beleg='Rechnung von Apple: reportaproblem.apple.com bzw. Bestätigungsmail', hinweis='Gekauft im App Store – Verkäufer ist Apple. Gemischt genutzt, 40 % betrieblich – Anteil begründen; „Seit“ = Monat der Verlängerung eintragen.' WHERE id='m365' AND anbieter='Microsoft'").run();
  costsReady = true;
}
const PER_YEAR = { monatlich: 12, quartal: 4, jaehrlich: 1 };
export async function costList(env) {
  await migrateCosts(env);
  const items = (await env.DB.prepare("SELECT * FROM cost_items WHERE deleted=0 ORDER BY sort, name").all()).results;
  // Fixkosten pro Jahr je Währung: voll (100 %) und betrieblich (mit Anteil; offener Anteil zählt nicht)
  const sums = {};
  for (const x of items) {
    const f = PER_YEAR[x.art];
    if (!f || x.betrag_cents == null) continue;
    const s = (sums[x.waehrung] ||= { year_full: 0, year_business: 0 });
    s.year_full += x.betrag_cents * f;
    if (x.anteil != null) s.year_business += Math.round(x.betrag_cents * f * x.anteil / 100);
  }
  return { items, sums, arten: COST_ART, open: items.filter((x) => x.betrag_cents == null || x.anteil == null).length };
}
export async function costSave(env, b) {
  await migrateCosts(env);
  const s = (x, n) => String(x ?? "").trim().slice(0, n);
  const name = s(b.name, 120);
  if (!name) throw Object.assign(new Error("Bitte einen Namen für den Posten eingeben."), { status: 400 });
  const art = COST_ART[b.art] ? b.art : "monatlich";
  const amt = b.betrag === "" || b.betrag == null ? null : Math.round(Number(String(b.betrag).replace(/\s/g, "").replace(",", ".")) * 100);
  if (amt != null && !(amt >= 0)) throw Object.assign(new Error("Betrag bitte als Zahl, z. B. 149,99."), { status: 400 });
  const anteil = b.anteil === "" || b.anteil == null ? null : Math.max(0, Math.min(100, Math.round(Number(b.anteil))));
  const w = ["EUR", "USD"].includes(b.waehrung) ? b.waehrung : "EUR";
  const seit = /^\d{4}-\d{2}(-\d{2})?$/.test(b.seit || "") ? b.seit : null;
  const tag = b.tag === "" || b.tag == null ? null : Math.round(Number(String(b.tag).replace(".", "")));
  if (tag != null && !(tag >= 1 && tag <= 31)) throw Object.assign(new Error("Abbuchungstag bitte zwischen 1 und 31."), { status: 400 });
  const id = s(b.id, 40) || "k-" + crypto.randomUUID().slice(0, 8);
  const max = await env.DB.prepare("SELECT COALESCE(MAX(sort),0) AS m FROM cost_items").first();
  await env.DB.prepare(`INSERT INTO cost_items (id, name, anbieter, art, betrag_cents, waehrung, anteil, seit, beleg, hinweis, sort, deleted, updated_at, tag, frist) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, anbieter=excluded.anbieter, art=excluded.art, betrag_cents=excluded.betrag_cents, waehrung=excluded.waehrung, anteil=excluded.anteil, seit=excluded.seit, beleg=excluded.beleg, hinweis=excluded.hinweis, tag=excluded.tag, frist=excluded.frist, deleted=0, updated_at=excluded.updated_at`)
    .bind(id, name, s(b.anbieter, 80), art, amt, w, Number.isNaN(anteil) ? null : anteil, seit, s(b.beleg, 300), s(b.hinweis, 500), (max?.m || 0) + 10, Date.now(), tag, b.frist === true || b.frist === "on" || b.frist === "1" ? 1 : 0).run();
  return costList(env);
}
export async function costDelete(env, id) {
  await migrateCosts(env);
  await env.DB.prepare("UPDATE cost_items SET deleted=1, updated_at=? WHERE id=?").bind(Date.now(), String(id || "")).run();
  return costList(env);
}

// Reverse Charge (Belege, Quartale) steht seit 6.10.2026 im Ausgabenbuch: lib/ledger.js
export const quarterOf = (datum) => { const [y, m] = String(datum).split("-").map(Number); return `${y}-Q${Math.floor((m - 1) / 3) + 1}`; };
export function rcDue(q) { const [y, n] = q.split("-Q").map(Number); const m = n * 3 + 2; return m > 12 ? `${y + 1}-${String(m - 12).padStart(2, "0")}-15` : `${y}-${String(m).padStart(2, "0")}-15`; }

// Euro-Betrag einer Pfund-/Dollar-Zahlung von Hand nachtragen (aus der Paddle- bzw. Stripe-Abrechnung)
export async function setEuroAmount(env, b) {
  await migrateAccounting(env);
  const cents = Math.round(Number(String(b.euro || "").replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")) * 100);
  if (!b.id || !Number.isFinite(cents) || cents <= 0) { const e = new Error("Bitte einen gültigen Euro-Betrag eingeben."); e.status = 400; throw e; }
  const r = await env.DB.prepare("UPDATE orders SET amount_cents=?, eur_ok=1 WHERE id=? AND currency IS NOT NULL AND currency<>'EUR'").bind(cents, String(b.id)).run();
  if (!r.meta?.changes) { const e = new Error("Bestellung nicht gefunden."); e.status = 404; throw e; }
  return { ok: true };
}

// Erstattung oder Rückbuchung erfassen (Admin). Betrag in Euro (bei Pfund/Dollar: Euro-Betrag laut Abrechnung).
// Voll erstattet + „sperren“: Bestellung „refunded“, Spielcodes gelten nicht mehr (wie beim Widerruf).
export async function recordRefund(env, b) {
  await migrateAccounting(env);
  const o = await env.DB.prepare("SELECT id, status, paket, amount_cents, session_id FROM orders WHERE id=?").bind(String(b.id || "")).first();
  if (!o) { const e = new Error("Bestellung nicht gefunden."); e.status = 404; throw e; }
  if (!["paid", "fulfilling", "fulfilled", "withdrawn", "refunded"].includes(o.status)) { const e = new Error("Nur bezahlte Bestellungen können erstattet werden."); e.status = 409; throw e; }
  const raw = String(b.euro ?? "").trim();
  const cents = raw === "" ? o.amount_cents : Math.round(Number(raw.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")) * 100);
  if (!Number.isFinite(cents) || cents <= 0 || cents > o.amount_cents) { const e = new Error(`Bitte einen Betrag zwischen 0,01 € und ${(o.amount_cents / 100).toFixed(2).replace(".", ",")} € eingeben.`); e.status = 400; throw e; }
  const full = cents >= o.amount_cents, lock = full && b.sperren !== false;
  await env.DB.prepare("UPDATE orders SET refunded_cents=?, refunded_at=?, refund_note=?, status=CASE WHEN ? THEN 'refunded' ELSE status END WHERE id=?")
    .bind(cents, Date.now(), String(b.notiz || "").slice(0, 300) || null, lock ? 1 : 0, o.id).run();
  if (lock) {
    if (o.session_id) await env.DB.prepare("UPDATE sessions SET status='withdrawn' WHERE id=? AND status <> 'finished'").bind(o.session_id).run();
    await env.DB.prepare("UPDATE solo_tickets SET status='withdrawn' WHERE order_id=?").bind(o.id).run().catch(() => {});
    await env.DB.prepare("UPDATE friends_groups SET status='withdrawn' WHERE order_id=? AND status <> 'revealed'").bind(o.id).run().catch(() => {});
  }
  return { ok: true, refunded_cents: cents, full, locked: lock };
}
