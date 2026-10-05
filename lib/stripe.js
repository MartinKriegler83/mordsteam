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
  try { await stripeApi(env, "GET", `coupons/${SOLO_COUPON}`); }
  catch { try { await stripeApi(env, "POST", "coupons", { id: SOLO_COUPON, amount_off: 500, currency: "eur", duration: "once", name: "Solo-Gutschein 5 €" }); } catch {} }
  // Neuere Stripe-API-Versionen erwarten promotion[coupon], ältere coupon – beides versuchen
  for (const body of [{ promotion: { type: "coupon", coupon: SOLO_COUPON }, code, max_redemptions: 1 }, { coupon: SOLO_COUPON, code, max_redemptions: 1 }]) {
    try { await stripeApi(env, "POST", "promotion_codes", body); return true; }
    catch (e) { if (/already exists/i.test(e.message)) return true; }
  }
  return false;
}
