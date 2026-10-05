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
    "ALTER TABLE orders ADD COLUMN currency TEXT", "ALTER TABLE orders ADD COLUMN amount_orig_cents INTEGER"]) {
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
    // Rechnungsland aus dem Bestellformular hat Vorrang (danach richtet sich die Rechnung); Stripe nur, falls es fehlt
    await env.DB.prepare("UPDATE orders SET bill_country=COALESCE(bill_country, ?), tax_id=?, fee_cents=COALESCE(?, fee_cents), net_cents=COALESCE(?, net_cents) WHERE id=?")
      .bind(country, taxId, fee, net, orderId).run();
    return true;
  } catch { return false; }
}

// Übersicht: Summen je Kundenart × Region für einen Zeitraum, plus EU-Privatkunden im laufenden Kalenderjahr
export async function accountingSummary(env, from, to) {
  await migrateAccounting(env);
  const rows = (await env.DB.prepare("SELECT id, stripe_session, amount_cents, fee_cents, net_cents, tax_cents, bill_country, tax_id, tax_regime, cust_uid, pay_provider, invoice_no, contact, paid_at FROM orders WHERE status IN ('paid','fulfilling','fulfilled') AND paid_at BETWEEN ? AND ?").bind(from, to).all()).results;
  // fehlende Stripe-Daten nachholen (höchstens 20 pro Aufruf)
  let n = 0;
  for (const o of rows) if (o.stripe_session && o.fee_cents == null && n < 20) { n++; if (await enrichPayment(env, o.id, o.stripe_session)) Object.assign(o, await env.DB.prepare("SELECT fee_cents, net_cents, bill_country, tax_id FROM orders WHERE id=?").bind(o.id).first()); }
  const groups = {};
  for (const o of rows) {
    const c = JSON.parse(o.contact || "{}"), kind = c.kunde === "b2b" || (!o.tax_regime && o.tax_id) ? "unternehmen" : "privat", reg = region(o.bill_country);
    const k = kind + ":" + reg, g = (groups[k] ||= { kunde: kind, region: reg, count: 0, gross: 0, fee: 0, net: 0 });
    g.count++; g.gross += o.amount_cents || 0; g.fee += o.fee_cents || 0; g.net += o.net_cents ?? ((o.amount_cents || 0) - (o.fee_cents || 0));
  }
  const y = new Date(to).getFullYear(), ys = Date.UTC(y, 0, 1) - 7200000, ye = Date.UTC(y + 1, 0, 1) - 7200000;
  const all = (await env.DB.prepare("SELECT amount_cents, bill_country, tax_id, tax_regime, contact FROM orders WHERE status IN ('paid','fulfilling','fulfilled') AND paid_at BETWEEN ? AND ?").bind(ys, ye).all()).results;
  // EU-Privatumsatz für die 10.000-€-Schwelle: alles mit Kleinunternehmer-Rechnung in ein anderes EU-Land
  const isEuB2C = (o) => region(o.bill_country) === "eu" && (o.tax_regime ? o.tax_regime === "ku" : !(JSON.parse(o.contact || "{}").kunde === "b2b" || o.tax_id));
  const euB2C = all.filter(isEuB2C).reduce((a, o) => a + (o.amount_cents || 0), 0);
  // Kleinunternehmergrenze: in Österreich steuerbare Umsätze = alle Kleinunternehmer-Rechnungen (AT + EU-Privat)
  const kuSum = all.filter((o) => (o.tax_regime ? o.tax_regime === "ku" : region(o.bill_country) === "inland" || isEuB2C(o))).reduce((a, o) => a + (o.amount_cents || 0), 0);
  // Zusammenfassende Meldung: EU-Firmen mit gültiger UID (Reverse Charge) im gewählten Zeitraum
  const zm = rows.filter((o) => o.tax_regime === "rc_eu").map((o) => ({ date: o.paid_at, uid: o.cust_uid, land: o.bill_country, cents: o.amount_cents || 0, invoice: o.invoice_no || null }));
  // je Rechnungsart und Bezahlweg
  const RN = { ku: "Kleinunternehmer (steuerfrei)", rc_eu: "EU-Firma, Reverse Charge", dl_b2b: "Nicht-EU-Firma, nicht steuerbar", dl_b2c: "Nicht-EU-Privat, nicht steuerbar", uk_paddle: "UK-Privat über Paddle" };
  const regimes = {};
  for (const o of rows) { const k = o.tax_regime || "alt"; const g = (regimes[k] ||= { regime: k, label: RN[k] || "vor dem 6.10.2026 (ohne Zuordnung)", count: 0, gross: 0, tax: 0 }); g.count++; g.gross += o.amount_cents || 0; g.tax += o.tax_cents || 0; }
  return { groups: Object.values(groups), regimes: Object.values(regimes), zm,
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
  ["icloud", "iCloud+ (E-Mail office@mordsteam.com)", "Apple", "monatlich", null, "EUR", null, "Apple-Rechnung per Mail / reportaproblem.apple.com", "Gemischt privat/betrieblich: Anteil festlegen."],
  ["stripe", "Stripe-Gebühren", "Stripe", "nutzung", null, "EUR", 100, "Stripe Dashboard → Berichte / monatliche Gebührenrechnung", "Je Zahlung; Summe steht in der Buchhaltungs-Übersicht."],
  ["github", "GitHub", "GitHub", "monatlich", 0, "USD", 100, "github.com → Settings → Billing", "Free-Plan – nur ändern, falls bezahlt."],
  ["firmenbuch", "Firmenbuch-Eintragung Mordsteam e.U.", "Republik Österreich (Justiz)", "einmalig", null, "EUR", 100, "Gebührenvorschreibung / JustizOnline", "Betrag laut Vorschreibung; eventuell gebührenfrei nach NeuFöG."],
  ["gewerbe", "Gewerbeanmeldung", "Bezirkshauptmannschaft", "einmalig", null, "EUR", 100, "Bescheid", "Betrag eintragen, sobald angemeldet."],
  ["svs", "SVS-Beiträge (Sozialversicherung)", "SVS", "quartal", null, "EUR", 100, "SVS-Vorschreibung / meineSV", "Ab Gewerbeanmeldung; als Betriebsausgabe absetzbar."],
  ["wko", "WKO-Grundumlage", "Wirtschaftskammer", "jaehrlich", null, "EUR", 100, "WKO-Vorschreibung", "Ab Gewerbeanmeldung."],
  ["arbeitsmittel", "Arbeitsmittel anteilig (MacBook, Handy, Internet)", "", "nutzung", null, "EUR", null, "Kaufbelege, Mobilfunk-/Internetrechnungen", "Betrieblichen Anteil festlegen; Computer über die Abschreibung (AfA)."],
];
let costsReady = false;
export async function migrateCosts(env) {
  if (costsReady) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS cost_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, anbieter TEXT, art TEXT NOT NULL, betrag_cents INTEGER, waehrung TEXT NOT NULL DEFAULT 'EUR', anteil INTEGER, seit TEXT, beleg TEXT, hinweis TEXT, sort INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0, updated_at INTEGER)").run();
  const st = env.DB.prepare("INSERT OR IGNORE INTO cost_items (id, name, anbieter, art, betrag_cents, waehrung, anteil, beleg, hinweis, sort, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  await env.DB.batch(COST_SEED.map(([id, n, a, art, b, w, p, beleg, h], i) => st.bind(id, n, a, art, b, w, p, beleg, h, (i + 1) * 10, Date.now())));
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
  const id = s(b.id, 40) || "k-" + crypto.randomUUID().slice(0, 8);
  const max = await env.DB.prepare("SELECT COALESCE(MAX(sort),0) AS m FROM cost_items").first();
  await env.DB.prepare(`INSERT INTO cost_items (id, name, anbieter, art, betrag_cents, waehrung, anteil, seit, beleg, hinweis, sort, deleted, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, anbieter=excluded.anbieter, art=excluded.art, betrag_cents=excluded.betrag_cents, waehrung=excluded.waehrung, anteil=excluded.anteil, seit=excluded.seit, beleg=excluded.beleg, hinweis=excluded.hinweis, deleted=0, updated_at=excluded.updated_at`)
    .bind(id, name, s(b.anbieter, 80), art, amt, w, Number.isNaN(anteil) ? null : anteil, seit, s(b.beleg, 300), s(b.hinweis, 500), (max?.m || 0) + 10, Date.now()).run();
  return costList(env);
}
export async function costDelete(env, id) {
  await migrateCosts(env);
  await env.DB.prepare("UPDATE cost_items SET deleted=1, updated_at=? WHERE id=?").bind(Date.now(), String(id || "")).run();
  return costList(env);
}

// ---------- Reverse Charge: Belege ausländischer Anbieter und Zahlungen je Quartal ----------
// Kleinunternehmer schulden auf Leistungen ausländischer Anbieter 20 % österreichische USt (ohne Vorsteuerabzug).
// Keine UVA nötig (außer auf Aufforderung), aber Zahlung je Quartal bis zum 15. des zweitfolgenden Monats;
// Jahreserklärung, sobald im Jahr Steuer zu zahlen war.
const RC_RATE = 20;
let rcReady = false;
async function migrateRc(env) {
  if (rcReady) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS rc_entries (id TEXT PRIMARY KEY, datum TEXT NOT NULL, anbieter TEXT NOT NULL, netto_cents INTEGER NOT NULL, notiz TEXT, created_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS rc_paid (quartal TEXT PRIMARY KEY, paid_at INTEGER)").run();
  rcReady = true;
}
export const quarterOf = (datum) => { const [y, m] = String(datum).split("-").map(Number); return `${y}-Q${Math.floor((m - 1) / 3) + 1}`; };
export function rcDue(q) { const [y, n] = q.split("-Q").map(Number); const m = n * 3 + 2; return m > 12 ? `${y + 1}-${String(m - 12).padStart(2, "0")}-15` : `${y}-${String(m).padStart(2, "0")}-15`; }
export async function rcList(env) {
  await migrateRc(env);
  const entries = (await env.DB.prepare("SELECT id, datum, anbieter, netto_cents, notiz FROM rc_entries WHERE deleted=0 ORDER BY datum DESC, created_at DESC").all()).results;
  const paid = Object.fromEntries((await env.DB.prepare("SELECT quartal, paid_at FROM rc_paid").all()).results.map((r) => [r.quartal, r.paid_at]));
  const qs = {};
  for (const e of entries) { const q = quarterOf(e.datum); const g = (qs[q] ||= { quartal: q, netto: 0, count: 0 }); g.netto += e.netto_cents; g.count++; }
  const quarters = Object.values(qs).sort((a, b) => b.quartal.localeCompare(a.quartal))
    .map((g) => ({ ...g, steuer: Math.round(g.netto * RC_RATE / 100), faellig: rcDue(g.quartal), bezahlt: paid[g.quartal] || null }));
  return { entries, quarters, rate: RC_RATE };
}
export async function rcSave(env, b) {
  await migrateRc(env);
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(b.datum || "") ? b.datum : null;
  if (!datum) throw Object.assign(new Error("Bitte das Rechnungsdatum angeben."), { status: 400 });
  const anbieter = String(b.anbieter || "").trim().slice(0, 80);
  if (!anbieter) throw Object.assign(new Error("Bitte den Anbieter angeben."), { status: 400 });
  const netto = Math.round(Number(String(b.netto ?? "").replace(/\s/g, "").replace(",", ".")) * 100);
  if (!(netto > 0)) throw Object.assign(new Error("Nettobetrag in Euro bitte als Zahl, z. B. 18,40."), { status: 400 });
  await env.DB.prepare("INSERT INTO rc_entries (id, datum, anbieter, netto_cents, notiz, created_at) VALUES (?,?,?,?,?,?)")
    .bind("rc-" + crypto.randomUUID().slice(0, 8), datum, anbieter, netto, String(b.notiz || "").trim().slice(0, 200), Date.now()).run();
  return rcList(env);
}
export async function rcDelete(env, id) {
  await migrateRc(env);
  await env.DB.prepare("UPDATE rc_entries SET deleted=1 WHERE id=?").bind(String(id || "")).run();
  return rcList(env);
}
export async function rcMarkPaid(env, b) {
  await migrateRc(env);
  const q = /^\d{4}-Q[1-4]$/.test(b.quartal || "") ? b.quartal : null;
  if (!q) throw Object.assign(new Error("Quartal ungültig."), { status: 400 });
  if (b.paid) await env.DB.prepare("INSERT INTO rc_paid (quartal, paid_at) VALUES (?,?) ON CONFLICT(quartal) DO UPDATE SET paid_at=excluded.paid_at").bind(q, Date.now()).run();
  else await env.DB.prepare("DELETE FROM rc_paid WHERE quartal=?").bind(q).run();
  return rcList(env);
}
