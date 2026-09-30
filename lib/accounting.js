// Buchhaltung: Einnahmen nach Kundenart (Unternehmen/Privat) und Region (Inland/EU/Drittland) – für die E/A-Rechnung
// und die 10.000-€-Schwelle für elektronische Dienstleistungen an Privatkunden in anderen EU-Ländern.
import { stripeApi } from "./stripe.js";

export const EU = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
export const EU_B2C_LIMIT_CENTS = 1000000;   // 10.000 € pro Kalenderjahr (EU-weit, Privatkunden außerhalb Österreichs)

export function region(country) {
  const c = String(country || "").toUpperCase();
  if (!c) return "unbekannt";
  if (c === "AT") return "inland";
  return EU.includes(c) ? "eu" : "drittland";
}
export const REGION_LABEL = { inland: "Inland (AT)", eu: "EU-Ausland", drittland: "Nicht-EU-Ausland", unbekannt: "Land unbekannt" };

export async function migrateAccounting(env) {
  for (const q of ["ALTER TABLE orders ADD COLUMN bill_country TEXT", "ALTER TABLE orders ADD COLUMN fee_cents INTEGER", "ALTER TABLE orders ADD COLUMN net_cents INTEGER", "ALTER TABLE orders ADD COLUMN tax_id INTEGER"]) {
    try { await env.DB.prepare(q).run(); } catch {}
  }
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
    await env.DB.prepare("UPDATE orders SET bill_country=COALESCE(?, bill_country), tax_id=?, fee_cents=COALESCE(?, fee_cents), net_cents=COALESCE(?, net_cents) WHERE id=?")
      .bind(country, taxId, fee, net, orderId).run();
    return true;
  } catch { return false; }
}

// Übersicht: Summen je Kundenart × Region für einen Zeitraum, plus EU-Privatkunden im laufenden Kalenderjahr
export async function accountingSummary(env, from, to) {
  await migrateAccounting(env);
  const rows = (await env.DB.prepare("SELECT id, stripe_session, amount_cents, fee_cents, net_cents, bill_country, tax_id, contact, paid_at FROM orders WHERE status IN ('paid','fulfilling','fulfilled') AND paid_at BETWEEN ? AND ?").bind(from, to).all()).results;
  // fehlende Stripe-Daten nachholen (höchstens 20 pro Aufruf)
  let n = 0;
  for (const o of rows) if (o.stripe_session && o.fee_cents == null && n < 20) { n++; if (await enrichPayment(env, o.id, o.stripe_session)) Object.assign(o, await env.DB.prepare("SELECT fee_cents, net_cents, bill_country, tax_id FROM orders WHERE id=?").bind(o.id).first()); }
  const groups = {};
  for (const o of rows) {
    const c = JSON.parse(o.contact || "{}"), kind = c.kunde === "b2b" || o.tax_id ? "unternehmen" : "privat", reg = region(o.bill_country);
    const k = kind + ":" + reg, g = (groups[k] ||= { kunde: kind, region: reg, count: 0, gross: 0, fee: 0, net: 0 });
    g.count++; g.gross += o.amount_cents || 0; g.fee += o.fee_cents || 0; g.net += o.net_cents ?? ((o.amount_cents || 0) - (o.fee_cents || 0));
  }
  const y = new Date(to).getFullYear(), ys = Date.UTC(y, 0, 1) - 7200000, ye = Date.UTC(y + 1, 0, 1) - 7200000;
  const all = (await env.DB.prepare("SELECT amount_cents, bill_country, tax_id, contact FROM orders WHERE status IN ('paid','fulfilling','fulfilled') AND paid_at BETWEEN ? AND ?").bind(ys, ye).all()).results;
  const euB2C = all.filter((o) => region(o.bill_country) === "eu" && !(JSON.parse(o.contact || "{}").kunde === "b2b" || o.tax_id)).reduce((a, o) => a + (o.amount_cents || 0), 0);
  return { groups: Object.values(groups), eu_b2c: { year: y, cents: euB2C, limit: EU_B2C_LIMIT_CENTS } };
}
