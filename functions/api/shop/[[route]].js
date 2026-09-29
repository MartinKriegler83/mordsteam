// Cloudflare Pages Function: /api/shop/*  – Bestellung, Zahlung (Stripe), automatische Spielrunde
// Umgebungsvariablen:
//   SHOP_OPEN=true              Bestellungen annehmen (nur setzen, wenn das Gewerbe angemeldet ist bzw. in der Vorschau)
//   STRIPE_SECRET_KEY           sk_test_… (Vorschau) bzw. sk_live_… (Produktion)
//   STRIPE_WEBHOOK_SECRET       whsec_… (Webhook-Endpunkt /api/shop/stripe-webhook)
//   ORDER_FAKE_PAY=true         nur für Tests ohne Stripe: Bestellung gilt sofort als bezahlt
//   RESEND_API_KEY, MAIL_FROM   optional: Bestätigungsmail über Resend (z. B. MAIL_FROM="Mordsteam <office@mordsteam.com>")
import { CASES, json, fail, randomToken, viennaDate, randInt } from "../../../lib/game.js";
import { migrate, createGameSession, normalizeVars, InputError } from "../../../lib/create.js";
import { COUNTRIES, COUNTRY_ORDER, randomCast, castToEnglish } from "../../../lib/countries.js";

// Sprache der Webseite (Fehlermeldungen, Stripe, Mail) – getrennt von der Spielsprache
const L = (lang, de, en) => (lang === "en" ? en : de);

export const PRICES = { basis: 8900, premium: 11900, plus: 14900 };   // Cent pro Team, Endpreise
const TIER = { basis: 0, premium: 1, plus: 2 };
const NAMES = { basis: "Basis (50 Min.)", premium: "Premium (70 Min.)", plus: "Premium Plus (90 Min.)" };
const NAMES_EN = { basis: "Basic (50 min)", premium: "Premium (70 min)", plus: "Premium Plus (90 min)" };
const LEAD_DAYS = 1;                                                  // alles digital: spielbar ab morgen
const CASE_ID = "fall-001";

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  const route = (params.route || []).join("/");
  const method = request.method;
  try {
    await migrate(env);
    if (route === "meta" && method === "GET") return meta(env, request);
    if (route === "stripe-webhook" && method === "POST") return webhook(request, env);
    if (route === "status" && method === "GET") return status(request, env);
    if (route === "bestellung" && method === "POST") return bestellung(request, env);
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    if (e instanceof InputError) return fail(e.message);
    return fail("Server error: " + e.message, 500);
  }
}

const shopOpen = (env) => String(env.SHOP_OPEN || "").toLowerCase() === "true";
const addDays = (dateStr, d) => { const t = new Date(dateStr + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };

function meta(env, request) {
  const c = CASES[CASE_ID];
  const today = viennaDate();
  const site = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "de";
  const FE = c.FIELDS_EN || {};
  const names = COUNTRY_ORDER.map((k) => [k, COUNTRIES[k][site]]);
  const xx = names.pop();
  names.sort((a, b) => a[1].localeCompare(b[1], site));
  return json({
    open: shopOpen(env),
    fall: site === "en" ? c.EN.META.title : c.META.title,
    fiktiv: !!c.FICTIONS,
    laender: [...names, xx],
    sprachen: [["de", site === "en" ? "German" : "Deutsch"], ["en", site === "en" ? "English" : "Englisch"]],
    prices: PRICES,
    earliest: addDays(today, LEAD_DAYS),
    suspects: { basis: c.suspectCount(false), premium: c.suspectCount(true), plus: c.suspectCount(true) },
    fields: c.FIELDS.map(([key, label, example, type]) => ({ key, label: site === "en" && FE[key] ? FE[key][0] : label, example: site === "en" && FE[key] ? FE[key][1] : example, type: type || "text" })),
  });
}

// ---------- Bestellung anlegen ----------
async function bestellung(request, env) {
  let b = {};
  try { b = await request.json(); } catch {}
  const site = b.site === "en" ? "en" : "de";                 // Sprache der Bestellseite
  const lang = b.lang === "en" ? "en" : b.lang === "de" ? "de" : site; // Sprache des Spiels
  if (!shopOpen(env)) return fail(L(site, "Bestellungen sind derzeit noch nicht möglich.", "Orders are not possible yet."), 403);
  const paket = TIER[b.paket] != null ? b.paket : "basis";
  const premium = TIER[paket] >= 1;
  const teams = Math.round(Number(b.teams));
  if (!(teams >= 1 && teams <= 15)) throw new InputError(L(site, "Bitte 1 bis 15 Teams wählen.", "Please choose 1 to 15 teams."));
  const today = viennaDate();
  const date = String(b.event_date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new InputError(L(site, "Bitte einen Spieltag wählen.", "Please choose a game day."));
  if (date < addDays(today, LEAD_DAYS)) throw new InputError(L(site, "Der Spieltag muss frühestens morgen sein.", "The game day must be tomorrow at the earliest."));
  if (date > addDays(today, 365)) throw new InputError(L(site, "Der Spieltag darf höchstens ein Jahr in der Zukunft liegen.", "The game day can be at most one year ahead."));
  const land = COUNTRY_ORDER.includes(b.land) ? b.land : "AT";
  // Fiktive Besetzung: handverlesen (AT/DE/CH) oder per Generator mit typischen Namen und Städten des Landes
  const F = (CASES[CASE_ID].FICTIONS || {})[land] || [];
  const fiktiv = b.besetzung === "fiktiv";
  let cast = b.vars || {};
  if (fiktiv) {
    cast = F.length ? F[randInt(F.length)] : randomCast(land, lang, randInt);
    if (F.length && lang === "en") cast = castToEnglish(cast);
  }
  const vars = normalizeVars(CASE_ID, { ...cast, LAND: land }, premium, false, site);

  const k = b.contact || {};
  const s = (x, max = 120) => String(x ?? "").trim().slice(0, max);
  const contact = { name: s(k.name), email: s(k.email, 160).toLowerCase(), telefon: s(k.telefon, 40), rechnung_firma: s(k.rechnung_firma) };
  if (contact.name.length < 2) throw new InputError(L(site, "Bitte deinen Namen angeben.", "Please enter your name."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new InputError(L(site, "Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."));
  const c = b.consent || {};
  if (fiktiv) contact.fiktiv = true;
  contact.lang = lang;
  contact.site = site;
  if (!fiktiv && !c.zustimmung) throw new InputError(L(site, "Bitte bestätigen, dass alle genannten Personen einverstanden sind.", "Please confirm that everyone named has agreed."));
  if (paket === "plus" && !c.ab18) throw new InputError(L(site, "Premium Plus mit ARIA ist für Teilnehmende ab 18 Jahren. Bitte bestätigen oder Basis bzw. Premium wählen.", "Premium Plus with ARIA is for participants aged 18 and over. Please confirm or choose Basic or Premium."));
  if (!c.agb) throw new InputError(L(site, "Bitte AGB und Datenschutzerklärung akzeptieren.", "Please accept the terms and the privacy policy."));
  let logo = null;
  if (b.logo && !fiktiv) {
    logo = String(b.logo);
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo)) throw new InputError(L(site, "Das Logo muss ein Bild sein (PNG, JPG oder WebP).", "The logo must be an image (PNG, JPG or WebP)."));
    if (logo.length > 400000) throw new InputError(L(site, "Das Logo ist zu groß.", "The logo is too large."));
    if (!c.logo_rechte) throw new InputError(L(site, "Bitte bestätigen, dass ihr das Logo verwenden dürft.", "Please confirm that you may use the logo."));
  }

  const id = crypto.randomUUID();
  const token = randomToken(16);
  const amount = PRICES[paket] * teams;
  await env.DB.prepare(
    "INSERT INTO orders (id, token, created_at, status, paket, teams, amount_cents, event_date, vars, contact, logo) VALUES (?,?,?,'pending',?,?,?,?,?,?,?)"
  ).bind(id, token, Date.now(), paket, teams, amount, date, JSON.stringify(vars), JSON.stringify(contact), logo).run();

  const origin = new URL(request.url).origin;
  const pre = site === "en" ? "/en" : "";
  const done = `${origin}${pre}/${site === "en" ? "ordered" : "bestellt"}.html?o=${id}&k=${token}`;
  const title = lang === "en" ? CASES[CASE_ID].EN.META.title : CASES[CASE_ID].META.title;
  const langName = L(site, lang === "en" ? "Englisch" : "Deutsch", lang === "en" ? "English" : "German");
  if (env.STRIPE_SECRET_KEY) {
    const cs = await stripe(env, "POST", "checkout/sessions", {
      mode: "payment",
      allow_promotion_codes: true,                 // Gutscheine, z. B. Pilotrabatt
      locale: site,
      customer_email: contact.email,
      client_reference_id: id,
      success_url: done,
      cancel_url: `${origin}${pre}/${site === "en" ? "order" : "bestellen"}.html?abgebrochen=1`,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      line_items: [{
        quantity: teams,
        price_data: { currency: "eur", unit_amount: PRICES[paket],
          product_data: { name: L(site, `Mordsteam Fall 001 „${title}“ – ${NAMES[paket]}`, `Mordsteam Case 001 “${title}” – ${NAMES_EN[paket]}`),
            description: L(site, `Pro Team · Spieltag ${date} · Spielsprache ${langName}`, `Per team · game day ${date} · game language ${langName}`) } },
      }],
      metadata: { order_id: id },
      payment_intent_data: { metadata: { order_id: id } },
      invoice_creation: { enabled: true, invoice_data: {
        description: L(site, `Personalisierter Krimi-Fall für ${teams} Team${teams === 1 ? "" : "s"}, Spieltag ${date}.`, `Personalised murder-mystery case for ${teams} team${teams === 1 ? "" : "s"}, game day ${date}.`),
        footer: L(site, "Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung gemäß § 6 Abs. 1 Z 27 UStG.", "VAT exempt under the Austrian small business scheme (§ 6 (1) no. 27 UStG)."),
        metadata: { order_id: id },
        ...(contact.rechnung_firma ? { custom_fields: [{ name: L(site, "Firma", "Company"), value: contact.rechnung_firma.slice(0, 30) }] } : {}),
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
  return fail(L(site, "Die Zahlung ist noch nicht eingerichtet.", "Payment is not set up yet."), 503);
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
  const ct = JSON.parse(order.contact || "{}");
  const out = { status: order.status, paket: order.paket, teams: order.teams, event_date: order.event_date, amount_cents: order.amount_cents,
    firma: JSON.parse(order.vars).FIRMA, lang: ct.lang || "de", land: JSON.parse(order.vars).LAND || "AT" };
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
  const ct = JSON.parse(o.contact || "{}");
  try {
    const s = await createGameSession(env, {
      case_id: CASE_ID, tier: TIER[o.paket] ?? 0, event_date: o.event_date, vars, max_teams: o.teams, lang: ct.lang === "en" ? "en" : "de",
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
  const site = c.site === "en" ? "en" : "de";
  const lang = c.lang === "en" ? "en" : "de";
  const T = (de, en) => (site === "en" ? en : de);
  const title = lang === "en" ? CASES[CASE_ID].EN.META.title : CASES[CASE_ID].META.title;
  const e = (x) => String(x).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const q = lang === "en" ? "&lang=en" : "";
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#15171C">
<h2 style="font-family:Georgia,serif">${T("Euer Fall ist bereit.", "Your case is ready.")}</h2>
<p>${T("Hallo", "Hi")} ${e(c.name)},</p>
<p>${T(`danke für eure Bestellung von <b>Fall 001 „${e(title)}“ – ${NAMES[o.paket] || o.paket}</b> für ${o.teams} Team${o.teams === 1 ? "" : "s"} bei ${e(vars.FIRMA)}. Spieltag: <b>${e(o.event_date)}</b>. Spielsprache: <b>${lang === "en" ? "Englisch" : "Deutsch"}</b>.`,
  `thank you for ordering <b>Case 001 “${e(title)}” – ${NAMES_EN[o.paket] || o.paket}</b> for ${o.teams} team${o.teams === 1 ? "" : "s"} at ${e(vars.FIRMA)}. Game day: <b>${e(o.event_date)}</b>. Game language: <b>${lang === "en" ? "English" : "German"}</b>.`)}</p>
<table style="border-collapse:collapse;margin:14px 0">
<tr><td style="padding:6px 12px 6px 0">${T("Organisator-Code (nur für euch):", "Organiser code (just for you):")}</td><td style="font-family:monospace;font-size:18px"><b>${e(s.org_code)}</b></td></tr>
<tr><td style="padding:6px 12px 6px 0">${T("Spielcode für die Teams:", "Game code for the teams:")}</td><td style="font-family:monospace;font-size:18px"><b>${e(s.join_code)}</b></td></tr>
</table>
<p><b>${T("So geht's am Spieltag:", "How it works on the day:")}</b></p>
<ol>
<li>${T("Organisator:", "Organiser: open")} <a href="${origin}/spiel/leitung.html${q ? "?lang=en" : ""}">${origin}/spiel/leitung.html</a>${T(" öffnen, mit dem Organisator-Code anmelden und „Fall öffnen“.", ", log in with the organiser code and click “Open case”.")}</li>
<li>${T("Jedes Team öffnet", "Each team opens")} <a href="${origin}/spiel/?code=${e(s.join_code)}${q}">${origin}/spiel/?code=${e(s.join_code)}</a> ${T("auf einem Gerät und gibt einen Teamnamen ein.", "on one device and enters a team name.")}</li>
<li>${T("Wenn alle bereit sind: „Fall starten“. Die Uhr läuft für alle gleichzeitig.", "When everyone is ready: “Start case”. The clock runs for everyone at the same time.")}</li>
<li>${T("Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht in der Zeit, beendet ihr die Runde auf der Organisator-Seite selbst.", "Once all teams have solved it, the round ends automatically and everyone sees the ranking and the solution. If a team doesn't make it in time, end the round yourself on the organiser page.")}</li>
</ol>
<p><b>${T("Tipp:", "Tip:")}</b> ${T(`Öffnet ein paar Tage vorher ${origin}/spiel auf einem Firmengerät. Lädt die Seite, bremst euch kein Webfilter.`, `A few days before, open ${origin}/spiel on a company device. If the page loads, no web filter will get in your way.`)}</p>
<p>${T("Die Rechnung kommt separat per Mail von unserem Zahlungsanbieter.", "The invoice will be sent separately by our payment provider.")}</p>
<p>${T("Viel Spaß beim Ermitteln!", "Happy investigating!")}<br>Mordsteam</p></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [c.email], reply_to: "office@mordsteam.com",
      subject: T(`Euer Mordsteam-Fall für ${vars.FIRMA} ist bereit`, `Your Mordsteam case for ${vars.FIRMA} is ready`), html }),
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
