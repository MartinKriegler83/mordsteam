// Kleine Stripe-Hilfe für Bibliotheken (der Shop hat seine eigene Kopie in functions/api/shop)
function formEncode(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") formEncode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out.join("&");
}
export async function stripeApi(env, method, path, data) {
  const r = await fetch(`${env.STRIPE_API_BASE || "https://api.stripe.com/v1"}/${path}`, {
    method,
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: data ? formEncode(data) : undefined,
  });
  const d = await r.json();
  if (!r.ok) { const e = new Error(`Stripe: ${d.error?.message || r.status}`); e.status = r.status; throw e; }
  return d;
}

// Solo-Gutschein als Stripe-Aktionscode: 5 € Rabatt, einmal einlösbar, im Bezahlschritt von Teams (und später Friends).
// Grundlage ist der Stripe-Gutschein „SOLO5“ (wird beim ersten Bedarf angelegt).
export const SOLO_COUPON = "SOLO5";
export async function createSoloPromo(env, code) {
  if (!env.STRIPE_SECRET_KEY) return false;
  // Gutschein gilt auch an Pfund- und Dollar-Kassen: 5 € · £5 · $6 (currency_options, lib/prices.js)
  const opts = { gbp: { amount_off: 500 }, usd: { amount_off: 600 } };
  try { const c = await stripeApi(env, "GET", `coupons/${SOLO_COUPON}`); if (!c.currency_options || !c.currency_options.usd) { try { await stripeApi(env, "POST", `coupons/${SOLO_COUPON}`, { currency_options: opts }); } catch {} } }
  catch { try { await stripeApi(env, "POST", "coupons", { id: SOLO_COUPON, amount_off: 500, currency: "eur", currency_options: opts, duration: "once", name: "Solo-Gutschein 5 €" }); } catch {} }
  // Neuere Stripe-API-Versionen erwarten promotion[coupon], ältere coupon – beides versuchen
  for (const body of [{ promotion: { type: "coupon", coupon: SOLO_COUPON }, code, max_redemptions: 1 }, { coupon: SOLO_COUPON, code, max_redemptions: 1 }]) {
    try { await stripeApi(env, "POST", "promotion_codes", body); return true; }
    catch (e) { if (/already exists/i.test(e.message)) return true; }
  }
  return false;
}

// Teams-Gutschein für verschenkte Solo-Codes (Admin „Geschenk-Codes“): eigener Betrag oder Prozentsatz, einmal einlösbar,
// mit Ablaufdatum. Gilt nur für Teams: Mindestbestellwert = kleinster Teams-Preis (89 € / £89 / $99) – Friends liegt immer darunter.
const TEAMS_MIN = { eur: 8900, gbp: 8900, usd: 9900 };
export async function createTeamsPromo(env, code, { type, value, until }) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe ist nicht eingerichtet (STRIPE_SECRET_KEY fehlt).");
  const pct = type === "pct";
  const v = Math.round(Number(value) || 0);
  const id = pct ? `TEAMS-PCT-${v}` : `TEAMS-EUR-${v}`;
  const coupon = pct
    ? { id, percent_off: v, duration: "once", name: `Teams-Gutschein ${v} %` }
    : { id, amount_off: v * 100, currency: "eur", currency_options: { gbp: { amount_off: v * 100 }, usd: { amount_off: Math.round(v * 1.15) * 100 } }, duration: "once", name: `Teams-Gutschein ${v} €` };
  try { await stripeApi(env, "GET", `coupons/${id}`); } catch { await stripeApi(env, "POST", "coupons", coupon); }
  const expires = Math.floor(Date.parse(`${until}T23:59:59+01:00`) / 1000);
  const restrictions = { minimum_amount: TEAMS_MIN.eur, minimum_amount_currency: "eur", currency_options: { gbp: { minimum_amount: TEAMS_MIN.gbp }, usd: { minimum_amount: TEAMS_MIN.usd } } };
  let last;
  for (const body of [{ promotion: { type: "coupon", coupon: id }, code, max_redemptions: 1, expires_at: expires, restrictions }, { coupon: id, code, max_redemptions: 1, expires_at: expires, restrictions }]) {
    try { await stripeApi(env, "POST", "promotion_codes", body); return true; }
    catch (e) { last = e; if (/already exists/i.test(e.message)) return true; }
  }
  throw last;
}
