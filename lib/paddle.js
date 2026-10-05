// Paddle (Merchant of Record) – nur für Privatkunden in Großbritannien (Entscheidung 5.10.2026).
// Paddle verkauft dort in eigenem Namen, berechnet und führt die britische Umsatzsteuer ab und zahlt monatlich aus.
//
// Cloudflare-Variablen:
//   PADDLE_ENV             "sandbox" (Test) oder "live"
//   PADDLE_API_KEY         Secret – API-Schlüssel aus Paddle → Developer tools → Authentication
//   PADDLE_CLIENT_TOKEN    öffentlicher Client-Token (für Paddle.js auf /zahlung.html)
//   PADDLE_WEBHOOK_SECRET  Secret – aus der Benachrichtigung (Webhook) auf /api/shop/paddle-webhook
//   PADDLE_API_BASE        nur für Tests
// Ohne alle drei Schlüssel ist Paddle aus: britische Privatkunden sehen „bald verfügbar“.

export const paddleOn = (env) => !!(env.PADDLE_API_KEY && env.PADDLE_CLIENT_TOKEN && env.PADDLE_WEBHOOK_SECRET);
const base = (env) => env.PADDLE_API_BASE || (String(env.PADDLE_ENV || "").toLowerCase() === "live" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com");

async function paddle(env, method, path, body) {
  const r = await fetch(base(env) + path, {
    method, headers: { authorization: `Bearer ${env.PADDLE_API_KEY}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Paddle: ${(d.error && (d.error.detail || d.error.code)) || r.status}`);
  return d.data;
}

// Transaktion mit Einzelpreis (Endpreis inkl. britischer Steuer, tax_mode internal) anlegen
export async function paddleTransaction(env, { amount, currency = "GBP", name, description, orderId, email }) {
  return paddle(env, "POST", "/transactions", {
    items: [{ quantity: 1, price: {
      name: name.slice(0, 150), description: description.slice(0, 200),
      unit_price: { amount: String(amount), currency_code: currency }, tax_mode: "internal",
      product: { name: name.slice(0, 150), tax_category: "standard" },
    } }],
    currency_code: currency, collection_mode: "automatic",
    custom_data: { order_id: orderId, email },
  });
}
export const paddleGet = (env, id) => paddle(env, "GET", `/transactions/${encodeURIComponent(id)}`);

// Beträge aus einer Paddle-Transaktion (Cent). Bezahlt wird in Pfund; für die Buchhaltung zählen die Werte
// der Auszahlung (payout_totals) in Euro – dafür im Paddle-Konto als Auszahlungswährung EUR wählen.
export function paddleAmounts(t) {
  const n = (x) => (x == null || x === "" ? null : Math.round(Number(x)));
  const tot = (t && t.details && t.details.totals) || {}, pay = (t && t.details && t.details.payout_totals) || {};
  const eur = String(pay.currency_code || "").toUpperCase() === "EUR";
  return { paid: n(tot.total), paid_currency: String(tot.currency_code || t.currency_code || "GBP").toUpperCase(),
    gross: eur ? n(pay.total) : null, tax: eur ? n(pay.tax) : null, fee: eur ? n(pay.fee) : null, net: eur ? n(pay.earnings) : null,
    payout_currency: String(pay.currency_code || "").toUpperCase() || null };
}
// Pfund-Preise für Privatkunden in Großbritannien: gleiche Zahl wie in Euro, ,90 wird zu ,99 (Entscheidung 5.10.2026)
export const ukPrice = (eurCents) => (eurCents % 100 === 90 ? eurCents + 9 : eurCents);
export const paddlePaid = (t) => !!t && ["paid", "completed"].includes(t.status);

// Signatur prüfen: Header „Paddle-Signature: ts=…;h1=…“, HMAC-SHA256 über „ts:rohdaten“
export async function verifyPaddle(raw, header, secret) {
  const parts = Object.fromEntries(String(header || "").split(";").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const ts = Number(parts.ts);
  if (!ts || !parts.h1 || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${raw}`));
  const hex = [...new Uint8Array(mac)].map((x) => x.toString(16).padStart(2, "0")).join("");
  return String(header).split(";").some((p) => p.trim() === `h1=${hex}`);
}
