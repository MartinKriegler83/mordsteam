// Cloudflare Pages Function: /api/shop/*  – Bestellung, Zahlung (Stripe), automatische Spielrunde
// Umgebungsvariablen:
//   SHOP_OPEN=true              Bestellungen annehmen (nur setzen, wenn das Gewerbe angemeldet ist bzw. in der Vorschau)
//   STRIPE_SECRET_KEY           sk_test_… (Vorschau) bzw. sk_live_… (Produktion)
//   STRIPE_WEBHOOK_SECRET       whsec_… (Webhook-Endpunkt /api/shop/stripe-webhook)
//   ORDER_FAKE_PAY=true         nur für Tests ohne Stripe: Bestellung gilt sofort als bezahlt
//   RESEND_API_KEY, MAIL_FROM   optional: Bestätigungsmail über Resend (z. B. MAIL_FROM="Mordsteam <office@mordsteam.com>")
import { CASES, json, fail, randomToken, viennaDate } from "../../../lib/game.js";
import { migrate, createGameSession, normalizeVars, InputError } from "../../../lib/create.js";

export const PRICES = { basis: 8900, premium: 11900, plus: 14900 };   // Cent pro Team, Endpreise
const TIER = { basis: 0, premium: 1, plus: 2 };
const NAMES = { basis: "Basis (50 Min.)", premium: "Premium (70 Min.)", plus: "Premium Plus (90 Min.)" };
const LEAD_DAYS = 1;                                                  // alles digital: spielbar ab morgen
const CASE_ID = "fall-001";

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  const route = (params.route || []).join("/");
  const method = request.method;
  try {
    await migrate(env);
    if (route === "meta" && method === "GET") return meta(env);
    if (route === "stripe-webhook" && method === "POST") return webhook(request, env);
    if (route === "status" && method === "GET") return status(request, env);
    if (route === "bestellung" && method === "POST") return bestellung(request, env);
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    if (e instanceof InputError) return fail(e.message);
    return fail("Serverfehler: " + e.message, 500);
  }
}

const shopOpen = (env) => String(env.SHOP_OPEN || "").toLowerCase() === "true";
const addDays = (dateStr, d) => { const t = new Date(dateStr + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };

function meta(env) {
  const c = CASES[CASE_ID];
  const today = viennaDate();
  return json({
    open: shopOpen(env),
    fall: c.META.title,
    fiktiv_firma: c.FICTION ? c.FICTION.FIRMA : null,
    prices: PRICES,
    earliest: addDays(today, LEAD_DAYS),
    suspects: { basis: c.suspectCount(false), premium: c.suspectCount(true), plus: c.suspectCount(true) },
    fields: c.FIELDS.map(([key, label, example, type]) => ({ key, label, example, type: type || "text" })),
  });
}

// ---------- Bestellung anlegen ----------
async function bestellung(request, env) {
  if (!shopOpen(env)) return fail("Bestellungen sind derzeit noch nicht möglich.", 403);
  let b = {};
  try { b = await request.json(); } catch {}
  const paket = TIER[b.paket] != null ? b.paket : "basis";
  const premium = TIER[paket] >= 1;
  const teams = Math.round(Number(b.teams));
  if (!(teams >= 1 && teams <= 15)) throw new InputError("Bitte 1 bis 15 Teams wählen.");
  const today = viennaDate();
  const date = String(b.event_date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new InputError("Bitte einen Spieltag wählen.");
  if (date < addDays(today, LEAD_DAYS)) throw new InputError("Der Spieltag muss frühestens morgen sein.");
  if (date > addDays(today, 365)) throw new InputError("Der Spieltag darf höchstens ein Jahr in der Zukunft liegen.");
  const fiktiv = b.besetzung === "fiktiv" && !!CASES[CASE_ID].FICTION;
  const vars = normalizeVars(CASE_ID, fiktiv ? CASES[CASE_ID].FICTION : b.vars || {}, premium, false);

  const k = b.contact || {};
  const s = (x, max = 120) => String(x ?? "").trim().slice(0, max);
  const contact = { name: s(k.name), email: s(k.email, 160).toLowerCase(), telefon: s(k.telefon, 40), rechnung_firma: s(k.rechnung_firma) };
  if (contact.name.length < 2) throw new InputError("Bitte deinen Namen angeben.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new InputError("Bitte eine gültige E-Mail-Adresse angeben.");
  const c = b.consent || {};
  if (fiktiv) contact.fiktiv = true;
  if (!fiktiv && !c.zustimmung) throw new InputError("Bitte bestätigen, dass alle genannten Personen einverstanden sind.");
  if (!c.agb) throw new InputError("Bitte AGB und Datenschutzerklärung akzeptieren.");
  let logo = null;
  if (b.logo && !fiktiv) {
    logo = String(b.logo);
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo)) throw new InputError("Das Logo muss ein Bild sein (PNG, JPG oder WebP).");
    if (logo.length > 400000) throw new InputError("Das Logo ist zu groß.");
    if (!c.logo_rechte) throw new InputError("Bitte bestätigen, dass ihr das Logo verwenden dürft.");
  }

  const id = crypto.randomUUID();
  const token = randomToken(16);
  const amount = PRICES[paket] * teams;
  await env.DB.prepare(
    "INSERT INTO orders (id, token, created_at, status, paket, teams, amount_cents, event_date, vars, contact, logo) VALUES (?,?,?,'pending',?,?,?,?,?,?,?)"
  ).bind(id, token, Date.now(), paket, teams, amount, date, JSON.stringify(vars), JSON.stringify(contact), logo).run();

  const origin = new URL(request.url).origin;
  const done = `${origin}/bestellt.html?o=${id}&k=${token}`;
  if (env.STRIPE_SECRET_KEY) {
    const cs = await stripe(env, "POST", "checkout/sessions", {
      mode: "payment",
      allow_promotion_codes: true,                 // Gutscheine, z. B. Pilotrabatt
      locale: "de",
      customer_email: contact.email,
      client_reference_id: id,
      success_url: done,
      cancel_url: `${origin}/bestellen.html?abgebrochen=1`,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      line_items: [{
        quantity: teams,
        price_data: { currency: "eur", unit_amount: PRICES[paket],
          product_data: { name: `Mordsteam Fall 001 „${CASES[CASE_ID].META.title}“ – ${NAMES[paket]}`, description: `Pro Team · Spieltag ${date}` } },
      }],
      metadata: { order_id: id },
      payment_intent_data: { metadata: { order_id: id } },
      invoice_creation: { enabled: true, invoice_data: {
        description: `Personalisierter Krimi-Fall für ${teams} Team${teams === 1 ? "" : "s"}, Spieltag ${date}.`,
        footer: "Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung gemäß § 6 Abs. 1 Z 27 UStG.",
        metadata: { order_id: id },
        ...(contact.rechnung_firma ? { custom_fields: [{ name: "Firma", value: contact.rechnung_firma.slice(0, 30) }] } : {}),
      } },
    });
    await env.DB.prepare("UPDATE orders SET stripe_session=? WHERE id=?").bind(cs.id, id).run();
    return json({ redirect: cs.url });
  }
  if (String(env.ORDER_FAKE_PAY || "").toLowerCase() === "true") {
    await env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=?").bind(Date.now(), id).run();
    await fulfill(env, id, origin);
    return json({ redirect: done });
  }
  return fail("Die Zahlung ist noch nicht eingerichtet.", 503);
}

// ---------- Status für die Bestätigungsseite ----------
async function status(request, env) {
  const u = new URL(request.url);
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(u.searchParams.get("o") || "").first();
  if (!o || o.token !== u.searchParams.get("k")) return fail("Bestellung nicht gefunden.", 404);
  let order = o;
  // Falls der Webhook (noch) nicht angekommen ist: direkt bei Stripe nachfragen
  if (order.status === "pending" && order.stripe_session && env.STRIPE_SECRET_KEY) {
    const cs = await stripe(env, "GET", `checkout/sessions/${order.stripe_session}`);
    if (cs.payment_status === "paid") {
      await env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=? AND status='pending'").bind(Date.now(), order.id).run();
      await fulfill(env, order.id, u.origin);
    }
    order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(order.id).first();
  }
  const out = { status: order.status, paket: order.paket, teams: order.teams, event_date: order.event_date, amount_cents: order.amount_cents,
    firma: JSON.parse(order.vars).FIRMA };
  if (order.status === "fulfilled" && order.session_id) {
    const s = await env.DB.prepare("SELECT join_code, org_code FROM sessions WHERE id=?").bind(order.session_id).first();
    if (s) Object.assign(out, s);
  }
  return json(out);
}

// ---------- Stripe-Webhook ----------
async function webhook(request, env) {
  const raw = await request.text();
  if (!env.STRIPE_WEBHOOK_SECRET) return fail("Webhook nicht eingerichtet.", 503);
  if (!(await verifyStripe(raw, request.headers.get("stripe-signature") || "", env.STRIPE_WEBHOOK_SECRET))) return fail("Signatur ungültig.", 400);
  const ev = JSON.parse(raw);
  if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
    const cs = ev.data.object;
    const id = cs.metadata?.order_id || cs.client_reference_id;
    if (id && cs.payment_status === "paid") {
      await env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=? AND status='pending'").bind(Date.now(), id).run();
      await fulfill(env, id, new URL(request.url).origin);
    }
  }
  return json({ received: true });
}

async function verifyStripe(payload, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v]));
  const sigs = header.split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((x) => x.toString(16).padStart(2, "0")).join("");
  return sigs.includes(hex);
}

// ---------- Bezahlte Bestellung → Spielrunde anlegen (genau einmal) ----------
async function fulfill(env, id, origin) {
  const lock = await env.DB.prepare("UPDATE orders SET status='fulfilling' WHERE id=? AND status='paid'").bind(id).run();
  if (!lock.meta || !lock.meta.changes) return; // schon erledigt oder nicht bezahlt
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
  const vars = JSON.parse(o.vars);
  try {
    const s = await createGameSession(env, {
      case_id: CASE_ID, tier: TIER[o.paket] ?? 0, event_date: o.event_date, vars, max_teams: o.teams,
      label: `Bestellung · ${vars.FIRMA}`, logo: o.logo,
    });
    await env.DB.prepare("UPDATE orders SET status='fulfilled', session_id=? WHERE id=?").bind(s.id, id).run();
    await sendMail(env, o, s, origin).catch(() => {});
  } catch (e) {
    await env.DB.prepare("UPDATE orders SET status='paid' WHERE id=?").bind(id).run();
    throw e;
  }
}

// ---------- Bestätigungsmail (optional, über Resend) ----------
async function sendMail(env, o, s, origin) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return;
  const c = JSON.parse(o.contact);
  const vars = JSON.parse(o.vars);
  const e = (x) => String(x).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#15171C">
<h2 style="font-family:Georgia,serif">Euer Fall ist bereit.</h2>
<p>Hallo ${e(c.name)},</p>
<p>danke für eure Bestellung von <b>Fall 001 „${e(CASES[CASE_ID].META.title)}“ – ${NAMES[o.paket] || o.paket}</b> für ${o.teams} Team${o.teams === 1 ? "" : "s"} bei ${e(vars.FIRMA)}. Spieltag: <b>${e(o.event_date)}</b>.</p>
<table style="border-collapse:collapse;margin:14px 0">
<tr><td style="padding:6px 12px 6px 0">Organisator-Code (nur für euch):</td><td style="font-family:monospace;font-size:18px"><b>${e(s.org_code)}</b></td></tr>
<tr><td style="padding:6px 12px 6px 0">Spielcode für die Teams:</td><td style="font-family:monospace;font-size:18px"><b>${e(s.join_code)}</b></td></tr>
</table>
<p><b>So geht's am Spieltag:</b></p>
<ol>
<li>Organisator: <a href="${origin}/spiel/leitung.html">${origin}/spiel/leitung.html</a> öffnen, mit dem Organisator-Code anmelden und „Fall öffnen“.</li>
<li>Jedes Team öffnet <a href="${origin}/spiel/?code=${e(s.join_code)}">${origin}/spiel/?code=${e(s.join_code)}</a> auf einem Gerät und gibt einen Teamnamen ein.</li>
<li>Wenn alle bereit sind: „Fall starten“. Die Uhr läuft für alle gleichzeitig.</li>
<li>Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht in der Zeit, beendet ihr die Runde auf der Organisator-Seite selbst.</li>
</ol>
<p><b>Tipp:</b> Öffnet ein paar Tage vorher ${origin}/spiel auf einem Firmengerät. Lädt die Seite, bremst euch kein Webfilter.</p>
<p>Die Rechnung kommt separat per Mail von unserem Zahlungsanbieter.</p>
<p>Viel Spaß beim Ermitteln!<br>Mordsteam</p></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [c.email], reply_to: "office@mordsteam.com", subject: `Euer Mordsteam-Fall für ${vars.FIRMA} ist bereit`, html }),
  });
}

// ---------- Stripe-API ----------
function formEncode(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") formEncode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out.join("&");
}
async function stripe(env, method, path, data) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: data ? formEncode(data) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Stripe: ${d.error?.message || r.status}`);
  return d;
}
