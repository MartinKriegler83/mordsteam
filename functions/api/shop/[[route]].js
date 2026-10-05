// Cloudflare Pages Function: /api/shop/*  – Bestellung, Zahlung (Stripe), automatische Spielrunde
// Umgebungsvariablen:
//   SHOP_OPEN=true              Bestellungen annehmen (nur setzen, wenn das Gewerbe angemeldet ist bzw. in der Vorschau)
//   STRIPE_SECRET_KEY           sk_test_… (Vorschau) bzw. sk_live_… (Produktion)
//   STRIPE_WEBHOOK_SECRET       whsec_… (Webhook-Endpunkt /api/shop/stripe-webhook)
//   ORDER_FAKE_PAY=true         nur für Tests ohne Stripe: Bestellung gilt sofort als bezahlt
//   Early Bird ist standardmäßig AN (25 %, bis 30.11.2026, Banner + Häkchen im Formular).
//   EARLYBIRD_PROZENT=0          Aktion aus (anderer Wert = anderer Prozentsatz)
//   EARLYBIRD_BIS=2026-11-30     optional: anderer letzter Tag der Aktion (Standard 2026-11-30, Banner zeigt „nur noch bis …“)
//   EARLYBIRD_COUPON             optional: eigener Stripe-Gutschein. Ohne Angabe legt der Shop den Gutschein
//                                „MORDSTEAM40“ (bzw. MORDSTEAM<Prozent>) beim ersten Bedarf selbst in Stripe an.
//   RESEND_API_KEY, MAIL_FROM   optional: Bestätigungsmail über Resend (z. B. MAIL_FROM="Mordsteam <office@mordsteam.com>")
//   UID_NR                      eigene UID (z. B. ATU12345678) – erscheint auf allen Rechnungen, sobald gesetzt
//   PADDLE_*                    Paddle für Privatkunden in Großbritannien, siehe lib/paddle.js
// Umsatzsteuer je Bestellung (Rechnungsland, UID, Fußzeile): lib/tax.js
import { CASES, json, fail, randomToken, viennaDate, randInt } from "../../../lib/game.js";
import { migrate, createGameSession, normalizeVars, InputError } from "../../../lib/create.js";
import { COUNTRIES, COUNTRY_ORDER, randomCast, castToEnglish } from "../../../lib/countries.js";
import { runFeedbackMails, feedbackInfo, saveFeedback, publicReviews } from "../../../lib/feedback.js";
import { handleContact } from "../../../lib/contact.js";
import { handleWithdraw, orderNo } from "../../../lib/withdraw.js";
import { sendMail as opsMail } from "../../../lib/ops.js";
import { enrichPayment, migrateAccounting } from "../../../lib/accounting.js";
import { taxContext, TaxInputError, invoiceFooter, invoiceFields } from "../../../lib/tax.js";
import { paddleOn, paddleTransaction, paddleGet, paddleAmounts, paddlePaid, verifyPaddle, ukPrice } from "../../../lib/paddle.js";
import { nlSignup, nlConfirm, nlUnsubscribe, nlVisit, srcVisit, nlAfterOrder, nlTag, migrateNewsletter } from "../../../lib/newsletter.js";
import { createSoloTicket, migrateSolo } from "../../../lib/solo.js";
import { createFriendsGroup, friendsGroupOfOrder, friendsPrice, FRIENDS_PRICE, FRIENDS_PRICE_PLUS, FRIENDS_CASES, friendsCase, friendsCron } from "../../../lib/friends.js";

// Sprache der Webseite (Fehlermeldungen, Stripe, Mail) – getrennt von der Spielsprache
const L = (lang, de, en) => (lang === "en" ? en : de);

// Firmenbuchnummer (erscheint in der Vertragsbestätigung, § 14 UGB) – eingetragen am 2.10.2026
const COMPANY_FN = "689638z";
export const PRICES = { basis: 8900, premium: 11900, plus: 14900 };   // Cent pro Team, Endpreise
export const SOLO_PRICE = 890;                                        // Mordsteam Solo Basic, Endpreis
// Solo-Fälle im Shop (Endpreise in Cent). plus = mit KI-Verhörraum (ab 18)
export const SOLO_OFFERS = {
  "solo-001": { price: 890, no: "Solo 001", de: "Nachtzug nach Venedig", en: "Night Train to Venice", min: 40, head: ["Der Nachtzug wartet.", "The night train is waiting."], goal: ["bis Udine", "until Udine"] },
  "solo-002": { price: 890, no: "Solo 002", de: "Applaus für einen Toten", en: "Applause for a Dead Man", min: 35, head: ["Der Vorhang ist gefallen.", "The curtain has fallen."], goal: ["bis die Polizei im Theater ist", "until the police reach the theatre"] },
  "solo-plus-001": { price: 1590, no: "Solo Plus", de: "Der letzte Jahrgang", en: "The Last Vintage", min: 45, plus: true, head: ["Das Weinfest wartet.", "The wine festival is waiting."], goal: ["bis die Polizei aus Krems kommt", "until the police arrive from Krems"] },
};
const soloOffer = (id) => SOLO_OFFERS[id] || SOLO_OFFERS["solo-001"];
const TIER = { basis: 0, premium: 1, plus: 2 };
const NAMES = { basis: "Basic (50 Min.)", premium: "Premium (70 Min.)", plus: "Premium Plus (90 Min.)" };
const NAMES_EN = { basis: "Basic (50 min)", premium: "Premium (70 min)", plus: "Premium Plus (90 min)" };
const LEAD_DAYS = 1;                                                  // alles digital: spielbar ab morgen
const CASE_ID = "fall-001";
// Teams-Fälle im Shop: Fall 001 (Firmen), Fall 002 (Vereine)
const TEAM_CASES = ["fall-001", "fall-002"];
const caseIdOf = (x) => (TEAM_CASES.includes(x) ? x : CASE_ID);
const caseNr = (id) => id.slice(-3);

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  const route = (params.route || []).join("/");
  const method = request.method;
  try {
    await migrate(env);
    if (route === "meta" && method === "GET") return await meta(env, request);
    if (route === "stripe-webhook" && method === "POST") return await webhook(request, env);
    if (route === "paddle-webhook" && method === "POST") return await paddleWebhook(request, env);
    if (route === "paddle-config" && method === "GET") return json({ on: paddleOn(env), token: paddleOn(env) ? env.PADDLE_CLIENT_TOKEN : null, env: String(env.PADDLE_ENV || "sandbox").toLowerCase() === "live" ? "live" : "sandbox" });
    if (route === "status" && method === "GET") return await status(request, env);
    if (route === "bestellung" && method === "POST") return await bestellung(request, env);
    if (route === "solo" && method === "POST") return await soloBestellung(request, env);
    if (route === "friends" && method === "POST") return await friendsBestellung(request, env);
    if (route === "friends-meta" && method === "GET") return friendsMeta(env, request);
    if (route === "kontakt" && method === "POST") return await handleContact(request, env);
    if (route === "widerruf" && method === "POST") return await handleWithdraw(request, env);
    // Newsletter: Anmeldung mit Bestätigungsmail, Bestätigen/Abmelden per Link, Besuche über Newsletter-Links zählen
    if (route === "newsletter" && method === "POST") return await nlSignup(request, env);
    if (route === "newsletter/bestaetigen" && method === "GET") return await nlConfirm(request, env);
    if (route === "newsletter/abmelden" && method === "GET") return await nlUnsubscribe(request, env);
    if (route === "nl-besuch" && method === "GET") return await nlVisit(request, env);
    if (route === "src-besuch" && method === "GET") return await srcVisit(request, env);
    // Feedback nach dem Spiel
    if (route === "feedback" && method === "GET") {
      const f = await feedbackInfo(env, new URL(request.url).searchParams.get("f"));
      if (!f) return fail("Feedback-Link ungültig. / Invalid feedback link.", 404);
      return json({ variant: f.variant, lang: f.lang, paket: f.paket, firma: f.fiktiv ? "" : f.firma, done: f.done });
    }
    if (route === "feedback" && method === "POST") {
      let b = {}; try { b = await request.json(); } catch {}
      const r = await saveFeedback(env, String(b.f || ""), b);
      if (r.error === "notfound") return fail("Feedback-Link ungültig. / Invalid feedback link.", 404);
      if (r.error === "done") return fail(b.lang === "en" ? "You have already sent your feedback – thank you!" : "Ihr habt euer Feedback schon geschickt – danke!", 409);
      if (r.error === "rating") return fail(b.lang === "en" ? "Please choose a star rating." : "Bitte eine Sternebewertung wählen.");
      return json({ ok: true });
    }
    if (route === "bewertungen" && method === "GET") { const q = new URL(request.url).searchParams; return json({ reviews: await publicReviews(env, q.get("lang") === "en" ? "en" : "de", q.get("produkt") || "", q.get("ort") || "") }); }
    // Täglicher Lauf (GitHub Action): fällige Feedback-Mails verschicken
    if (route === "cron" && method === "POST") {
      if (!env.CRON_KEY || request.headers.get("x-cron-key") !== env.CRON_KEY) return fail("Nicht berechtigt.", 401);
      // Stündlich: Friends-Auflösungen (Wochenmodus). Feedback-Mails nur einmal am Tag (ca. 9 Uhr Wien) oder bei ?alles=1
      const u = new URL(request.url);
      const friends = await friendsCron(env, u.origin);
      const daily = new Date().getUTCHours() === 7 || u.searchParams.get("alles") === "1";
      const sent = daily ? await runFeedbackMails(env, u.origin) : [];
      return json({ ok: true, friends, count: sent.length, sent: sent.map((x) => ({ order: x.order, sent: x.sent })) });
    }
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    if (e instanceof InputError) return fail(e.message);
    return fail("Server error: " + e.message, 500);
  }
}

const shopOpen = (env) => String(env.SHOP_OPEN || "").toLowerCase() === "true";
// Early Bird: läuft, solange EARLYBIRD_PROZENT gesetzt ist und EARLYBIRD_BIS (falls gesetzt) nicht vorbei ist
function earlybird(env) {
  const raw = String(env.EARLYBIRD_PROZENT ?? "").trim();
  const p = raw === "" ? 25 : Math.round(Number(raw));
  if (!(p > 0 && p < 100)) return null;
  const bis = /^\d{4}-\d{2}-\d{2}$/.test(String(env.EARLYBIRD_BIS || "")) ? env.EARLYBIRD_BIS : "2026-11-30";
  if (bis && viennaDate() > bis) return null;
  return { prozent: p, bis };
}
const addDays = (dateStr, d) => { const t = new Date(dateStr + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };

function meta(env, request) {
  const caseId = caseIdOf(new URL(request.url).searchParams.get("case"));
  const c = CASES[caseId];
  const today = viennaDate();
  const site = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "de";
  const FE = c.FIELDS_EN || {};
  const names = COUNTRY_ORDER.map((k) => [k, COUNTRIES[k][site]]);
  const xx = names.pop();
  names.sort((a, b) => a[1].localeCompare(b[1], site));
  return json({
    open: shopOpen(env),
    earlybird: earlybird(env),
    fall: site === "en" ? c.EN.META.title : c.META.title,
    case_id: caseId, nr: caseNr(caseId),
    cases: TEAM_CASES.map((id) => ({ id, nr: caseNr(id), title: site === "en" ? CASES[id].EN.META.title : CASES[id].META.title, audience: site === "en" ? CASES[id].EN.META.audience : CASES[id].META.audience })),
    fiktiv: !!c.FICTIONS,
    laender: [...names, xx],
    sprachen: [["de", site === "en" ? "German" : "Deutsch"], ["en", site === "en" ? "English" : "Englisch"]],
    prices: PRICES,
    earliest: addDays(today, LEAD_DAYS),
    suspects: { basis: c.suspectCount(false), premium: c.suspectCount(true), plus: c.suspectCount(true) },
    fields: c.FIELDS.map(([key, label, example, type, opts]) => ({ key, label: site === "en" && FE[key] ? FE[key][0] : label, example: site === "en" && FE[key] ? FE[key][1] : example, type: type || "text",
      options: opts ? opts.map((o) => [o[0], site === "en" ? o[2] : o[1]]) : null })),
  });
}


// ---------- Umsatzsteuer und Bezahlweg (für Teams, Solo, Friends gleich) ----------
// Preis in der Mail: Pfund bei Paddle-Bestellungen, sonst Euro
const priceTxt = (o) => (o.currency === "GBP" && o.amount_orig_cents != null ? `£${(o.amount_orig_cents / 100).toFixed(2)}` : `${(o.amount_cents / 100).toLocaleString("de-AT", { minimumFractionDigits: 2 })} €`);
// Steuerhinweis in der Bestätigungsmail (passend zur Rechnung)
function vatNote(c, T) {
  const r = c.tax_regime || "ku";
  if (r === "rc_eu") return T(`(Endpreis ohne USt – Reverse Charge, die Steuer schuldet ihr als Leistungsempfänger; eure UID ${c.uid || ""}). Bezahlt über Stripe.`, `(final price without VAT – reverse charge, VAT is accounted for by you as the recipient; your VAT ID ${c.uid || ""}). Paid via Stripe.`);
  if (r === "dl_b2b" || r === "dl_b2c") return T("(Endpreis; in Österreich nicht steuerbar, keine österreichische USt). Bezahlt über Stripe.", "(final price; not subject to Austrian VAT). Paid via Stripe.");
  if (r === "uk_paddle") return T("(Endpreis inkl. britischer Umsatzsteuer). Verkauf und Rechnung über Paddle.com (Merchant of Record).", "(final price incl. UK VAT). Sold and invoiced by Paddle.com (merchant of record).");
  return T("(Endpreis; Kleinunternehmer, keine USt gemäß § 6 Abs. 1 Z 27 UStG). Bezahlt über Stripe.", "(final price; small business, no VAT under § 6 (1) no. 27 UStG). Paid via Stripe.");
}
async function taxStep(env, k, site, contact) {
  let t;
  try { t = await taxContext(env, k, site, contact.kunde); }
  catch (e) { if (e instanceof TaxInputError) throw new InputError(e.message); throw e; }
  if (t.regime === "uk_paddle" && !paddleOn(env)) throw new InputError(L(site,
    "Bestellungen von Privatpersonen aus dem Vereinigten Königreich sind in Kürze möglich. Firmen mit britischer VAT-Nummer können schon jetzt bestellen.",
    "Orders from private customers in the United Kingdom will be possible very soon. Businesses with a UK VAT number can already order."));
  Object.assign(contact, { bill_land: t.bill_land, tax_regime: t.regime, ...(t.uid ? { uid: t.uid } : {}), ...(t.uid_name ? { uid_name: t.uid_name } : {}) });
  return t;
}
// nach dem INSERT: Steuerdaten in eigene Spalten (Buchhaltung, Zusammenfassende Meldung)
async function saveTax(env, id, contact) {
  await migrateAccounting(env);
  await env.DB.prepare("UPDATE orders SET bill_country=?, tax_regime=?, cust_uid=?, pay_provider=? WHERE id=?")
    .bind(contact.bill_land, contact.tax_regime, contact.uid || null, contact.tax_regime === "uk_paddle" ? "paddle" : "stripe", id).run();
}
// Paddle-Kasse (britische Privatkunden): Transaktion anlegen, Weiterleitung auf /zahlung.html
async function paddleStep(env, origin, { id, token, site, gbp, name, description, email }) {
  const t = await paddleTransaction(env, { amount: gbp, currency: "GBP", name, description, orderId: id, email });
  await env.DB.prepare("UPDATE orders SET paddle_txn=?, currency='GBP', amount_orig_cents=? WHERE id=?").bind(t.id, gbp, id).run();
  return json({ redirect: `${origin}/zahlung.html?_ptxn=${encodeURIComponent(t.id)}&o=${id}&k=${token}&l=${site}` });
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
  // Kein Spieltag mehr: spielbar sofort nach dem Kauf, 12 Monate lang, einmal startbar. event_date = Kaufdatum.
  const date = today;
  const validUntil = addDays(today, 365);
  const land = COUNTRY_ORDER.includes(b.land) ? b.land : "AT";
  // Fiktive Besetzung: handverlesen (AT/DE/CH) oder per Generator mit typischen Namen und Städten des Landes
  const caseId = caseIdOf(b.fall), C = CASES[caseId];
  const F = (C.FICTIONS || {})[land] || [];
  const fiktiv = b.besetzung === "fiktiv";
  let cast = b.vars || {};
  if (fiktiv) {
    cast = F.length ? F[randInt(F.length)] : (C.randomCast || randomCast)(land, lang, randInt);
    if (F.length && lang === "en") cast = (C.castToEnglish || castToEnglish)(cast);
  }
  const vars = normalizeVars(caseId, { ...cast, LAND: land }, premium, false, site);

  const k = b.contact || {};
  const s = (x, max = 120) => String(x ?? "").trim().slice(0, max);
  const contact = { name: s(k.name), email: s(k.email, 160).toLowerCase(), telefon: s(k.telefon, 40), rechnung_firma: s(k.rechnung_firma) };
  if (!['b2b', 'b2c'].includes(k.kunde)) throw new InputError(L(site, "Bitte angeben, ob ihr als Unternehmen/Verein oder als Privatperson bestellt.", "Please tell us whether you are ordering as a company/club or as a private individual."));
  contact.kunde = k.kunde;
  if (b.consent && b.consent.no_news) contact.no_news = true; // Widerspruch gegen Neuigkeiten per E-Mail (§ 174 Abs. 4 TKG 2021)
  if (nlTag(b.nl)) contact.nl = nlTag(b.nl);                 // kam über einen Newsletter-Link
  if (nlTag(b.src)) contact.src = nlTag(b.src);              // kam über Werbung (z. B. gads = Google Ads)
  if (contact.name.length < 2) throw new InputError(L(site, "Bitte deinen Namen angeben.", "Please enter your name."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new InputError(L(site, "Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."));
  const c = b.consent || {};
  await taxStep(env, k, site, contact);
  if (fiktiv) contact.fiktiv = true;
  contact.lang = lang;
  contact.site = site;
  contact.fall = caseId;
  if (!fiktiv && !c.zustimmung) throw new InputError(L(site, "Bitte bestätigen, dass alle genannten Personen einverstanden sind.", "Please confirm that everyone named has agreed."));
  if (paket === "plus" && !c.ab18) throw new InputError(L(site, "Premium Plus mit KI ist für Teilnehmende ab 18 Jahren. Bitte bestätigen oder Basic bzw. Premium wählen.", "Premium Plus with AI is for participants aged 18 and over. Please confirm or choose Basic or Premium."));
  // Sofortiger Beginn: ausdrückliches Verlangen + Kenntnis vom Verlust des Rücktrittsrechts (§ 18 Abs. 1 Z 1 und Z 11 FAGG)
  if (contact.kunde === "b2c") {
    if (!c.sofort) throw new InputError(L(site, "Bitte bestätigen, dass wir eure Spielrunde gleich nach dem Bezahlen anlegen dürfen.", "Please confirm that we may set up your game round right after payment."));
    contact.sofort_zustimmung = new Date().toISOString();
  }
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
  // Early Bird: Häkchen gesetzt und Aktion läuft → Rabatt wird bei Stripe automatisch abgezogen (kein Code nötig)
  const eb = b.earlybird === true ? earlybird(env) : null;
  if (b.earlybird === true && !eb) throw new InputError(L(site, "Die Early-Bird-Aktion ist leider schon vorbei. Bitte das Häkchen entfernen.", "Sorry, the early bird offer has ended. Please untick the box."));
  if (eb) { contact.earlybird = eb.prozent; }
  else if (c.no_feedback) contact.no_feedback = true;     // keine Feedback-Mail nach dem Spiel (bei Early Bird Teil der Bedingungen)
  const full = PRICES[paket] * teams;
  const amount = eb ? Math.round(full * (100 - eb.prozent) / 100) : full;
  await env.DB.prepare(
    "INSERT INTO orders (id, token, created_at, status, paket, teams, amount_cents, event_date, vars, contact, logo) VALUES (?,?,?,'pending',?,?,?,?,?,?,?)"
  ).bind(id, token, Date.now(), paket, teams, amount, date, JSON.stringify(vars), JSON.stringify(contact), logo).run();
  await saveTax(env, id, contact);

  const origin = new URL(request.url).origin;
  const pre = site === "en" ? "/en" : "";
  const done = `${origin}${pre}/${site === "en" ? "ordered" : "bestellt"}.html?o=${id}&k=${token}`;
  const title = lang === "en" ? C.EN.META.title : C.META.title;
  const langName = L(site, lang === "en" ? "Englisch" : "Deutsch", lang === "en" ? "English" : "German");
  if (contact.tax_regime === "uk_paddle") return paddleStep(env, origin, { id, token, site, email: contact.email,
    gbp: eb ? Math.round(ukPrice(PRICES[paket]) * teams * (100 - eb.prozent) / 100) : ukPrice(PRICES[paket]) * teams,
    name: L(site, `Mordsteam Fall ${caseNr(caseId)} „${title}“ – ${NAMES[paket]} × ${teams}`, `Mordsteam Case ${caseNr(caseId)} “${title}” – ${NAMES_EN[paket]} × ${teams}`),
    description: L(site, `${teams} Team${teams === 1 ? "" : "s"} · gültig bis ${validUntil} · Spielsprache ${langName}`, `${teams} team${teams === 1 ? "" : "s"} · valid until ${validUntil} · game language ${langName}`) });
  if (env.STRIPE_SECRET_KEY) {
    const cs = await stripe(env, "POST", "checkout/sessions", {
      mode: "payment",
      // Early Bird: Gutschein fix anhängen. Sonst Feld für eigene Codes (z. B. Friends-Codes) anbieten – Stripe erlaubt nicht beides.
      ...(eb ? { discounts: [{ coupon: await ebCoupon(env, eb.prozent) }] } : { allow_promotion_codes: true }),
      locale: site,
      customer_email: contact.email,
      client_reference_id: id,
      success_url: done,
      cancel_url: `${origin}${pre}/${site === "en" ? "order" : "bestellen"}.html?abgebrochen=1`,
      billing_address_collection: "required",
      line_items: [{
        quantity: teams,
        price_data: { currency: "eur", unit_amount: PRICES[paket],
          product_data: { name: L(site, `Mordsteam Fall ${caseNr(caseId)} „${title}“ – ${NAMES[paket]}`, `Mordsteam Case ${caseNr(caseId)} “${title}” – ${NAMES_EN[paket]}`),
            description: L(site, `Pro Team · sofort spielbar, gültig bis ${validUntil} · Spielsprache ${langName}`, `Per team · playable right away, valid until ${validUntil} · game language ${langName}`) } },
      }],
      metadata: { order_id: id },
      payment_intent_data: { metadata: { order_id: id } },
      invoice_creation: { enabled: true, invoice_data: {
        description: L(site, `Personalisierter Krimi-Fall für ${teams} Team${teams === 1 ? "" : "s"}, einmal spielbar bis ${validUntil}.`, `Personalised murder-mystery case for ${teams} team${teams === 1 ? "" : "s"}, playable once until ${validUntil}.`),
        footer: invoiceFooter(contact.tax_regime, site),
        metadata: { order_id: id },
        ...invoiceFields(env, site, contact),
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

// ---------- Solo-Bestellung (ein Fall für eine Person) ----------
async function soloBestellung(request, env) {
  let b = {};
  try { b = await request.json(); } catch {}
  const site = b.site === "en" ? "en" : "de";
  if (!shopOpen(env)) return fail(L(site, "Bestellungen sind derzeit noch nicht möglich.", "Orders are not possible yet."), 403);
  const k = b.contact || {};
  const s = (x, max = 120) => String(x ?? "").trim().slice(0, max);
  const fall = SOLO_OFFERS[b.fall] ? b.fall : "solo-001", F = SOLO_OFFERS[fall];
  const contact = { name: s(k.name), email: s(k.email, 160).toLowerCase(), lang: b.lang === "en" ? "en" : "de", site, produkt: fall };
  const GL = contact.lang === "en" ? L(site, "Englisch", "English") : L(site, "Deutsch", "German");
  if (!["b2b", "b2c"].includes(k.kunde)) throw new InputError(L(site, "Bitte angeben, ob du als Privatperson oder für ein Unternehmen bestellst.", "Please tell us whether you are ordering as a private individual or for a company."));
  contact.kunde = k.kunde;
  if (b.consent && b.consent.no_news) contact.no_news = true; // Widerspruch gegen Neuigkeiten per E-Mail (§ 174 Abs. 4 TKG 2021)
  if (nlTag(b.nl)) contact.nl = nlTag(b.nl);                 // kam über einen Newsletter-Link
  if (nlTag(b.src)) contact.src = nlTag(b.src);              // kam über Werbung (z. B. gads = Google Ads)
  if (contact.name.length < 2) throw new InputError(L(site, "Bitte deinen Namen angeben.", "Please enter your name."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new InputError(L(site, "Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."));
  const c = b.consent || {};
  await taxStep(env, k, site, contact);
  if (contact.kunde === "b2c") {
    if (!c.sofort) throw new InputError(L(site, "Bitte bestätigen, dass wir deinen Code gleich nach dem Bezahlen bereitstellen dürfen.", "Please confirm that we may provide your code right after payment."));
    contact.sofort_zustimmung = new Date().toISOString();
  }
  if (F.plus) {
    if (!c.ab18) throw new InputError(L(site, "Solo Plus mit KI-Verhörraum ist ab 18 Jahren. Bitte bestätigen.", "Solo Plus with the AI interrogation room is for ages 18 and over. Please confirm."));
    contact.ab18 = new Date().toISOString();
  }
  if (!c.agb) throw new InputError(L(site, "Bitte AGB und Datenschutzerklärung akzeptieren.", "Please accept the terms and the privacy policy."));
  contact.no_feedback = true;
  const id = crypto.randomUUID(), token = randomToken(16), today = viennaDate(), validUntil = addDays(today, 365);
  await env.DB.prepare(
    "INSERT INTO orders (id, token, created_at, status, paket, teams, amount_cents, event_date, vars, contact, logo) VALUES (?,?,?,'pending','solo',1,?,?,?,?,NULL)"
  ).bind(id, token, Date.now(), F.price, today, JSON.stringify({ FIRMA: "Mordsteam Solo" }), JSON.stringify(contact)).run();
  await saveTax(env, id, contact);
  const origin = new URL(request.url).origin;
  const pre = site === "en" ? "/en" : "";
  const done = `${origin}${pre}/${site === "en" ? "ordered" : "bestellt"}.html?o=${id}&k=${token}`;
  if (contact.tax_regime === "uk_paddle") return paddleStep(env, origin, { id, token, site, gbp: ukPrice(F.price), email: contact.email,
    name: L(site, `Mordsteam ${F.no} „${F.de}“`, `Mordsteam ${F.no} “${F.en}”`),
    description: L(site, `Krimi für eine Person · Code gültig bis ${validUntil} · Spielsprache ${GL}`, `Murder mystery for one person · code valid until ${validUntil} · game language ${GL}`) });
  if (env.STRIPE_SECRET_KEY) {
    const cs = await stripe(env, "POST", "checkout/sessions", {
      mode: "payment", locale: site, customer_email: contact.email, client_reference_id: id,
      success_url: done, cancel_url: `${origin}${pre}/${site === "en" ? "solo-buy" : "solo-kaufen"}.html?abgebrochen=1`,
      billing_address_collection: "auto",
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: F.price,
        product_data: { name: L(site, `Mordsteam ${F.no} „${F.de}“`, `Mordsteam ${F.no} “${F.en}”`),
          description: L(site, `Krimi für eine Person, Countdown ${F.min} Min.${F.plus ? " mit KI-Verhörraum" : ""} · Code gültig bis ${validUntil} · Spielsprache ${GL}`, `Murder mystery for one person, ${F.min}-minute countdown${F.plus ? " with AI interrogation room" : ""} · code valid until ${validUntil} · game language ${GL}`) } } }],
      metadata: { order_id: id }, payment_intent_data: { metadata: { order_id: id } },
      invoice_creation: { enabled: true, invoice_data: {
        description: L(site, `Mordsteam ${F.no} „${F.de}“, digitaler Krimi für eine Person, spielbar bis ${validUntil}.`, `Mordsteam ${F.no} “${F.en}”, digital murder mystery for one person, playable until ${validUntil}.`),
        footer: invoiceFooter(contact.tax_regime, site),
        metadata: { order_id: id }, ...invoiceFields(env, site, contact) } },
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

// ---------- Friends-Bestellung (Krimiabend für 4–8 Freunde) ----------
function friendsMeta(env, request) {
  const C = friendsCase("friends-001", new URL(request.url).searchParams.get("lang") === "en" ? "en" : "de");
  return json({ open: shopOpen(env), earlybird: earlybird(env), price: FRIENDS_PRICE, price_plus: FRIENDS_PRICE_PLUS, limit_plus: C.LIMIT_MIN_PLUS, quirks: C.QUIRK_KEYS.map((k) => [k, C.QUIRKS[k].label]), limit_min: C.LIMIT_MIN, title: C.TITLE });
}
async function friendsBestellung(request, env) {
  let b = {};
  try { b = await request.json(); } catch {}
  const site = b.site === "en" ? "en" : "de";
  if (!shopOpen(env)) return fail(L(site, "Bestellungen sind derzeit noch nicht möglich.", "Orders are not possible yet."), 403);
  const C = FRIENDS_CASES["friends-001"];
  const s = (x, max = 120) => String(x ?? "").trim().slice(0, max);
  const players = (Array.isArray(b.players) ? b.players : []).map((p) => ({ name: s(p && p.name, 30).replace(/[<>]/g, ""), quirk: C.QUIRKS[p && p.quirk] ? p.quirk : "" }));
  const n = players.length;
  if (n < FRIENDS_PRICE.min || n > FRIENDS_PRICE.max) throw new InputError(L(site, "Bitte 4 bis 8 Personen eintragen.", "Please enter 4 to 8 people."));
  if (players.some((p) => p.name.length < 1)) throw new InputError(L(site, "Bitte für jede Person einen Namen eintragen.", "Please enter a name for every person."));
  if (players.some((p) => !p.quirk)) throw new InputError(L(site, "Bitte für jede Person eine Eigenheit auswählen.", "Please choose a quirk for every person."));
  const low = players.map((p) => p.name.toLowerCase());
  if (new Set(low).size !== n) throw new InputError(L(site, "Zwei Personen haben denselben Namen. Bitte unterscheidbar machen, z. B. mit Initial.", "Two people have the same name. Please make them distinguishable, e.g. with an initial."));
  const mode = b.mode === "week" ? "week" : "live";
  const days = [3, 5, 7].includes(Number(b.days)) ? Number(b.days) : 7;
  const plus = b.variant === "plus";
  const k = b.contact || {};
  const contact = { name: s(k.name), email: s(k.email, 160).toLowerCase(), lang: b.lang === "en" ? "en" : "de", site, produkt: "friends-001", no_feedback: true };
  const GL = contact.lang === "en" ? L(site, "Englisch", "English") : L(site, "Deutsch", "German");
  if (!["b2b", "b2c"].includes(k.kunde)) throw new InputError(L(site, "Bitte angeben, ob du als Privatperson oder für ein Unternehmen bestellst.", "Please tell us whether you are ordering as a private individual or for a company."));
  contact.kunde = k.kunde;
  if (b.consent && b.consent.no_news) contact.no_news = true; // Widerspruch gegen Neuigkeiten per E-Mail (§ 174 Abs. 4 TKG 2021)
  if (nlTag(b.nl)) contact.nl = nlTag(b.nl);                 // kam über einen Newsletter-Link
  if (nlTag(b.src)) contact.src = nlTag(b.src);              // kam über Werbung (z. B. gads = Google Ads)
  if (contact.name.length < 2) throw new InputError(L(site, "Bitte deinen Namen angeben.", "Please enter your name."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new InputError(L(site, "Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."));
  const c = b.consent || {};
  await taxStep(env, k, site, contact);
  if (!c.zustimmung) throw new InputError(L(site, "Bitte bestätigen, dass alle Genannten einverstanden sind.", "Please confirm that everyone named has agreed."));
  if (plus && !c.ab18) throw new InputError(L(site, "Der Krimiabend Plus mit KI-Verhörraum ist für Mitspielende ab 18 Jahren. Bitte bestätigen oder den Krimiabend wählen.", "Mystery Night Plus with the AI interrogation room is for players aged 18 and over. Please confirm or choose the Mystery Night."));
  if (contact.kunde === "b2c") {
    if (!c.sofort) throw new InputError(L(site, "Bitte bestätigen, dass wir eure Runde gleich nach dem Bezahlen anlegen dürfen.", "Please confirm that we may set up your round right after payment."));
    contact.sofort_zustimmung = new Date().toISOString();
  }
  if (!c.agb) throw new InputError(L(site, "Bitte AGB und Datenschutzerklärung akzeptieren.", "Please accept the terms and the privacy policy."));
  const eb = b.earlybird === true ? earlybird(env) : null;
  if (b.earlybird === true && !eb) throw new InputError(L(site, "Die Early-Bird-Aktion ist leider schon vorbei. Bitte das Häkchen entfernen.", "Sorry, the early bird offer has ended. Please untick the box."));
  if (eb) contact.earlybird = eb.prozent;
  const full = friendsPrice(n, plus), amount = eb ? Math.round(full * (100 - eb.prozent) / 100) : full;
  const id = crypto.randomUUID(), token = randomToken(16), today = viennaDate(), validUntil = addDays(today, 365);
  // Die Namen stehen nur bis zum Anlegen der Runde in der Bestellung, danach nur noch in der Runde (die gelöscht wird)
  const vars = { FIRMA: "Mordsteam Friends", friends: { players, mode, days, plus } };
  await env.DB.prepare(
    "INSERT INTO orders (id, token, created_at, status, paket, teams, amount_cents, event_date, vars, contact, logo) VALUES (?,?,?,'pending',?,?,?,?,?,?,NULL)"
  ).bind(id, token, Date.now(), plus ? "friends-plus" : "friends", n, amount, today, JSON.stringify(vars), JSON.stringify(contact)).run();
  await saveTax(env, id, contact);
  const origin = new URL(request.url).origin, pre = site === "en" ? "/en" : "";
  const lim = plus ? C.LIMIT_MIN_PLUS : C.LIMIT_MIN, vName = plus ? L(site, "Krimiabend Plus", "Mystery Night Plus") : L(site, "Krimiabend", "mystery night");
  const done = `${origin}${pre}/${site === "en" ? "ordered" : "bestellt"}.html?o=${id}&k=${token}`;
  const modeTxt = mode === "live" ? L(site, "gleichzeitig", "all at once") : L(site, `über ${days} Tage`, `over ${days} days`);
  if (contact.tax_regime === "uk_paddle") return paddleStep(env, origin, { id, token, site, email: contact.email,
    gbp: eb ? Math.round(ukPrice(full) * (100 - eb.prozent) / 100) : ukPrice(full),
    name: L(site, `Mordsteam Friends 001 – ${vName} für ${n} Personen`, `Mordsteam Friends 001 – ${vName} for ${n} people`),
    description: L(site, `Countdown ${lim} Min., gespielt ${modeTxt} · spielbar bis ${validUntil} · Spielsprache ${GL}`, `${lim}-minute countdown, played ${modeTxt} · playable until ${validUntil} · game language ${GL}`) });
  if (env.STRIPE_SECRET_KEY) {
    const cs = await stripe(env, "POST", "checkout/sessions", {
      mode: "payment", locale: site, customer_email: contact.email, client_reference_id: id,
      ...(eb ? { discounts: [{ coupon: await ebCoupon(env, eb.prozent) }] } : { allow_promotion_codes: true }),
      success_url: done, cancel_url: `${origin}${pre}/${site === "en" ? "friends-buy" : "friends-kaufen"}.html?abgebrochen=1`,
      billing_address_collection: "auto",
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: full,
        product_data: { name: L(site, `Mordsteam Friends 001 „${C.TITLE}“ – ${vName} für ${n} Personen`, `Mordsteam Friends 001 “Last Round at the Chalet” – ${vName} for ${n} people`),
          description: L(site, `Countdown ${lim} Min.${plus ? " mit KI-Verhörraum" : ""}, gespielt ${modeTxt} · spielbar bis ${validUntil} · Spielsprache ${GL}`, `${lim}-minute countdown${plus ? " with AI interrogation room" : ""}, played ${modeTxt} · playable until ${validUntil} · game language ${GL}`) } } }],
      metadata: { order_id: id }, payment_intent_data: { metadata: { order_id: id } },
      invoice_creation: { enabled: true, invoice_data: {
        description: L(site, `Mordsteam Friends 001, digitaler ${plus ? "Krimiabend Plus mit KI-Verhörraum" : "Krimiabend"} für ${n} Personen, einmal spielbar bis ${validUntil}.`, `Mordsteam Friends 001, digital ${plus ? "Mystery Night Plus with AI interrogation room" : "mystery night"} for ${n} people, playable once until ${validUntil}.`),
        footer: invoiceFooter(contact.tax_regime, site),
        metadata: { order_id: id }, ...invoiceFields(env, site, contact) } },
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
    if ((cs.payment_status === "paid" || cs.payment_status === "no_payment_required")) {
      await env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=? AND status='pending'").bind(Date.now(), order.id).run();
      await recordPayment(env, order.id, cs);
      await fulfill(env, order.id, u.origin);
    }
    order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(order.id).first();
  }
  // Paddle: falls die Benachrichtigung (noch) nicht da ist, direkt nachfragen
  if (order.status === "pending" && order.paddle_txn && paddleOn(env)) {
    try {
      const t = await paddleGet(env, order.paddle_txn);
      if (paddlePaid(t)) await paddlePaidOrder(env, order.id, t, u.origin);
    } catch {}
    order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(order.id).first();
  }
  const ct = JSON.parse(order.contact || "{}");
  const out = { status: order.status, paket: order.paket, teams: order.teams, event_date: order.event_date, amount_cents: order.amount_cents,
    firma: JSON.parse(order.vars).FIRMA, lang: ct.lang || "de", land: JSON.parse(order.vars).LAND || "AT", earlybird: ct.earlybird || 0, nr: orderNo(order.id), kunde: ct.kunde || "", fall_nr: caseNr(caseIdOf(ct.fall)) };
  if (order.paket === "solo") {
    out.produkt = "solo";
    const SF = soloOffer(ct.produkt);
    Object.assign(out, { solo_case: ct.produkt || "solo-001", solo_title: SF.de, solo_title_en: SF.en, solo_head: SF.head, solo_min: SF.min, solo_goal: SF.goal });
    if (order.status === "fulfilled") {
      await migrateSolo(env);
      const t = await env.DB.prepare("SELECT code FROM solo_tickets WHERE order_id=?").bind(order.id).first();
      if (t) out.solo_code = t.code;
    }
    return json(out);
  }
  if (order.paket === "friends" || order.paket === "friends-plus") {
    out.produkt = "friends"; out.plus = order.paket === "friends-plus";
    out.teams = order.teams;
    if (order.status === "fulfilled") {
      const g = await friendsGroupOfOrder(env, order.id);
      if (g) Object.assign(out, { org_token: g.org_token, invite: g.invite, mode: g.mode, days: g.window_days });
    }
    return json(out);
  }
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
    if (id && (cs.payment_status === "paid" || cs.payment_status === "no_payment_required")) {
      await env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=? AND status='pending'").bind(Date.now(), id).run();
      await recordPayment(env, id, cs);
      await fulfill(env, id, new URL(request.url).origin);
    }
  }
  return json({ received: true });
}

// ---------- Paddle-Benachrichtigung (britische Privatkunden) ----------
async function paddleWebhook(request, env) {
  const raw = await request.text();
  if (!env.PADDLE_WEBHOOK_SECRET) return fail("Webhook nicht eingerichtet.", 503);
  if (!(await verifyPaddle(raw, request.headers.get("paddle-signature") || "", env.PADDLE_WEBHOOK_SECRET))) return fail("Signatur ungültig.", 400);
  const ev = JSON.parse(raw);
  const t = ev.data || {};
  if ((ev.event_type === "transaction.completed" || ev.event_type === "transaction.paid") && paddlePaid(t)) {
    const id = (t.custom_data && t.custom_data.order_id) || (await env.DB.prepare("SELECT id FROM orders WHERE paddle_txn=?").bind(t.id || "").first() || {}).id;
    if (id) await paddlePaidOrder(env, id, t, new URL(request.url).origin);
  }
  return json({ received: true });
}
async function paddlePaidOrder(env, id, t, origin) {
  const o = await env.DB.prepare("SELECT paddle_txn FROM orders WHERE id=?").bind(id).first();
  if (!o || (o.paddle_txn && t.id && o.paddle_txn !== t.id)) return;   // fremde Transaktion
  await env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=? AND status='pending'").bind(Date.now(), id).run();
  try {
    await migrateAccounting(env);
    const a = paddleAmounts(t);
    // amount_cents = Endpreis inkl. britischer Steuer; tax_cents = britische Steuer (führt Paddle ab); fee/net laut Paddle-Auszahlung
    await env.DB.prepare("UPDATE orders SET amount_cents=COALESCE(?, amount_cents), tax_cents=?, fee_cents=?, net_cents=?, invoice_no=COALESCE(?, invoice_no), amount_orig_cents=COALESCE(?, amount_orig_cents), currency=COALESCE(?, currency) WHERE id=?")
      .bind(a.gross, a.tax, a.fee, a.net, t.invoice_number || null, a.paid, a.paid_currency, id).run();
  } catch { /* Buchhaltungsdaten blockieren nie */ }
  await fulfill(env, id, origin);
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
  if (o.paket === "solo") {
    try {
      await migrateSolo(env);
      const have = await env.DB.prepare("SELECT code FROM solo_tickets WHERE order_id=?").bind(id).first();
      const code = have ? have.code : await createSoloTicket(env, { caseId: SOLO_OFFERS[ct.produkt] ? ct.produkt : "solo-001", orderId: id, lang: ct.lang === "en" ? "en" : "de" });
      await env.DB.prepare("UPDATE orders SET status='fulfilled' WHERE id=?").bind(id).run();
      await soloMail(env, o, code, origin).catch(() => {});
      await nlAfterOrder(env, o);
    } catch (e) {
      await env.DB.prepare("UPDATE orders SET status='paid' WHERE id=?").bind(id).run();
      throw e;
    }
    return;
  }
  if (o.paket === "friends" || o.paket === "friends-plus") {
    try {
      const f = vars.friends || {};
      let g = await friendsGroupOfOrder(env, id);
      if (!g) g = await createFriendsGroup(env, { players: f.players || [], mode: f.mode, days: f.days, orderId: id, lang: ct.lang === "en" ? "en" : "de", plus: !!f.plus });
      // Namen aus der Bestellung entfernen – sie stehen nur noch in der Runde
      await env.DB.prepare("UPDATE orders SET status='fulfilled', vars=? WHERE id=?").bind(JSON.stringify({ FIRMA: "Mordsteam Friends", friends: { n: (f.players || []).length, mode: f.mode, days: f.days, plus: !!f.plus } }), id).run();
      await friendsMail(env, o, g, origin).catch(() => {});
      await nlAfterOrder(env, o);
    } catch (e) {
      await env.DB.prepare("UPDATE orders SET status='paid' WHERE id=?").bind(id).run();
      throw e;
    }
    return;
  }
  try {
    const s = await createGameSession(env, {
      case_id: caseIdOf(ct.fall), tier: TIER[o.paket] ?? 0, event_date: o.event_date, vars, max_teams: o.teams, lang: ct.lang === "en" ? "en" : "de",
      label: `Bestellung · ${vars.FIRMA}`, logo: o.logo,
    });
    await env.DB.prepare("UPDATE orders SET status='fulfilled', session_id=? WHERE id=?").bind(s.id, id).run();
    await sendMail(env, o, s, origin).catch(() => {});
    await nlAfterOrder(env, o);
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
  const caseId = caseIdOf(c.fall), nr = caseNr(caseId);
  const title = lang === "en" ? CASES[caseId].EN.META.title : CASES[caseId].META.title;
  const e = (x) => String(x).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const q = lang === "en" ? "&lang=en" : "";
  const host = origin.replace(/^https?:\/\//, "");
  const MIN = { basis: 50, premium: 70, plus: 90 };
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#15171C">
<div style="font-family:Georgia,serif;font-weight:900;font-size:28px;letter-spacing:.5px;margin-bottom:6px"><span style="color:#B3261E">MORDS</span><span style="color:#15171C">TEAM</span></div>
<h2 style="font-family:Georgia,serif">${T("Euer Fall ist bereit.", "Your case is ready.")}</h2>
<p>${T("Hallo", "Hi")} ${e(c.name)},</p>
<p>${T(`danke für eure Bestellung von <b>Fall ${nr} „${e(title)}“ – ${NAMES[o.paket] || o.paket}</b> für ${o.teams} Team${o.teams === 1 ? "" : "s"} bei ${e(vars.FIRMA)}. Spielbar ab sofort, 12 Monate lang – einmal startbar. Spielsprache: <b>${lang === "en" ? "Englisch" : "Deutsch"}</b>.`,
  `thank you for ordering <b>Case ${nr} “${e(title)}” – ${NAMES_EN[o.paket] || o.paket}</b> for ${o.teams} team${o.teams === 1 ? "" : "s"} at ${e(vars.FIRMA)}. Playable right away, for 12 months – it can be started once. Game language: <b>${lang === "en" ? "English" : "German"}</b>.`)}</p>
<table style="border-collapse:collapse;margin:14px 0">
<tr><td style="padding:6px 12px 6px 0">${T("Organisator-Code (nicht weitergeben):", "Organiser code (don't pass on):")}</td><td style="font-family:monospace;font-size:18px"><b>${e(s.org_code)}</b></td></tr>
<tr><td style="padding:6px 12px 6px 0">${T("Spielcode für die Teams:", "Game code for the teams:")}</td><td style="font-family:monospace;font-size:18px"><b>${e(s.join_code)}</b></td></tr>
</table>
<p><b>${T("So läuft das Spiel", "How the game works")}</b></p>
<ol>
<li>${T("Wann immer ihr spielen wollt – auch gleich jetzt: Öffnet", "Whenever you want to play – even right now: open")} <a href="${origin}/spiel/leitung.html${q ? "?lang=en" : ""}">${host}/spiel/leitung.html</a>${T(", meldet euch mit dem Organisator-Code an und tippt auf „Fall öffnen“.", ", log in with the organiser code and tap “Open case”.")}</li>
<li>${T("Jedes Team öffnet auf <b>einem</b> Gerät", "Each team opens")} <a href="${origin}/spiel/?code=${e(s.join_code)}${q}">${host}/spiel/?code=${e(s.join_code)}</a> ${T("und gibt einen Teamnamen ein.", "on <b>one</b> device and enters a team name.")}</li>
<li>${T(`Sind alle Teams angemeldet, startet ihr den Fall auf der Organisator-Seite (Knopf „Fall starten“). Die Uhr läuft für alle gleichzeitig: ${MIN[o.paket] || 60} Minuten, ohne Pause. Erst ab dem Start können sich weitere Geräte pro Team per QR-Code zum Mitlesen verbinden (im Tab „Einsatz“).`, `Once all teams have joined, start the case on the organiser page (“Start case” button). The clock runs for everyone at the same time: ${MIN[o.paket] || 60} minutes, without a pause. Only once the case has started can more devices per team follow along via QR code (in the “Briefing” tab).`)}</li>
<li>${T("Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht in der Zeit, beendet ihr die Runde auf der Organisator-Seite selbst.", "Once all teams have solved it, the round ends automatically and everyone sees the ranking and the solution. If a team doesn't make it in time, end the round yourself on the organiser page.")}</li>
</ol>
<p><b>${T("Zeitplanung:", "Timing:")}</b> ${T("Plant das Zeitlimit als Obergrenze. Schnelle Teams sind oft nach der Hälfte fertig – die Zusatzermittlung hält sie beschäftigt.", "Plan the time limit as a maximum. Fast teams are often done after half the time – the bonus investigation keeps them busy.")}</p>
<p><b>${T("Tipp:", "Tip:")}</b> ${T(`Öffnet ein paar Tage vorher ${host}/spiel auf einem Firmengerät. Lädt die Seite, bremst euch kein Webfilter.`, `A few days before, open ${host}/spiel on a company device. If the page loads, no web filter will get in your way.`)}</p>
${c.earlybird ? `<p><b>Early Bird:</b> ${T("Danke, dass ihr uns helft! Nach dem Spiel melden wir uns für euer Feedback.", "Thanks for helping us! After the game we'll be in touch for your feedback.")}</p>` : ""}
<p>${T("Die Rechnung kommt separat per Mail von unserem Zahlungsanbieter.", "The invoice will be sent separately by our payment provider.")}</p>
<p>${T("Viel Spaß beim Ermitteln!", "Happy investigating!")}<br>Mordsteam</p>
<hr style="border:0;border-top:1px solid #DDD5C4;margin:24px 0 14px">
<div style="font-size:12.5px;color:#5A5D66;line-height:1.5">
<b>${T("Vertragsbestätigung", "Contract confirmation")}</b><br>
${T("Bestellnummer", "Order number")}: ${orderNo(o.id)}<br>
${T("Anbieter", "Provider")}: Mordsteam e.U., ${T("Inhaber", "owner")} Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, ${T("Österreich", "Austria")}, office@mordsteam.com${COMPANY_FN ? `, FN ${COMPANY_FN}` : ""}, ${T("Firmenbuchgericht", "register court")} Landesgericht Eisenstadt<br>
${T("Leistung", "Service")}: ${T(`Personalisierter digitaler Krimi-Fall „${e(title)}“, Paket ${NAMES[o.paket] || o.paket}, ${o.teams} Team${o.teams === 1 ? "" : "s"}, Spielsprache ${lang === "en" ? "Englisch" : "Deutsch"}; spielbar 12 Monate ab Kauf, einmal startbar.`, `Personalised digital murder-mystery case “${e(title)}”, package ${NAMES_EN[o.paket] || o.paket}, ${o.teams} team${o.teams === 1 ? "" : "s"}, game language ${lang === "en" ? "English" : "German"}; playable for 12 months from purchase, can be started once.`)}<br>
${T("Preis", "Price")}: ${priceTxt(o)} ${vatNote(c, T)}<br>
${T("Es gelten unsere AGB", "Our terms apply")}: <a href="${origin}${site === "en" ? "/en/terms.html" : "/agb.html"}">${origin}${site === "en" ? "/en/terms.html" : "/agb.html"}</a><br>
${c.kunde === "b2b" ? T("Für Bestellungen als Unternehmen, Verein oder Organisation besteht kein gesetzliches Rücktrittsrecht.", "Orders placed as a company, club or organisation have no statutory right of withdrawal.") : T("Ihr habt bei der Bestellung ausdrücklich verlangt, dass wir eure Spielrunde gleich nach dem Bezahlen anlegen und die Codes bereitstellen, und bestätigt, dass ihr als Privatperson dadurch euer Rücktrittsrecht verliert. Es erlischt mit dieser Bestätigung und der Bereitstellung der Codes (§ 18 Abs. 1 Z 11 FAGG), spätestens aber, sobald die Spielrunde gespielt und beendet ist (§ 18 Abs. 1 Z 1 FAGG).", "When ordering, you expressly requested that we set up your game round and provide the codes right after payment, and confirmed that as a private individual you thereby lose your right of withdrawal. It expires with this confirmation and the provision of the codes (§ 18 (1) no. 11 FAGG), but at the latest once the game round has been played and ended (§ 18 (1) no. 1 FAGG).")}${c.kunde !== "b2b" ? `<br>${T("Widerruf (nur Privatpersonen, solange das Rücktrittsrecht besteht)", "Withdrawal (private individuals only, while the right of withdrawal exists)")}: <a href="${origin}${site === "en" ? "/en/withdraw.html" : "/widerruf.html"}?nr=${orderNo(o.id)}">${T("Vertrag widerrufen", "Withdraw from contract")}</a>` : ""}
</div></div>`;
  await opsMail(env, "bestellung", { to: [c.email], reply_to: "office@mordsteam.com",
      subject: T(`Euer Mordsteam-Fall für ${vars.FIRMA} ist bereit`, `Your Mordsteam case for ${vars.FIRMA} is ready`), html });
}

// ---------- Solo: Mail mit Code ----------
async function soloMail(env, o, code, origin) {
  const c = JSON.parse(o.contact), F = soloOffer(c.produkt);
  const site = c.site === "en" ? "en" : "de";
  const T = (de, en) => (site === "en" ? en : de);
  const gEn = c.lang === "en", GL = gEn ? T("Englisch", "English") : T("Deutsch", "German");
  const e = (x) => String(x).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const link = `${origin}/spiel/solo.html?c=${code}`;
  const validUntil = addDays(viennaDate(o.created_at), 365);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C;max-width:560px">
<div style="font-family:Georgia,serif;font-weight:900;font-size:28px;letter-spacing:.5px;margin-bottom:6px"><span style="color:#B3261E">MORDS</span><span style="color:#15171C">TEAM</span></div>
<h2 style="font-family:Georgia,serif">${T(F.head[0], F.head[1])}</h2>
<p>${T("Hallo", "Hi")} ${e(c.name)},</p>
<p>${T(`danke für deine Bestellung von <b>Mordsteam ${F.no} „${F.de}“</b> (Spielsprache ${GL}). Dein Code ist 12 Monate gültig, bis`, `thank you for ordering <b>Mordsteam ${F.no} “${F.en}”</b> (game language ${GL}). Your code is valid for 12 months, until`)} ${validUntil}.</p>
<p style="margin:18px 0"><span style="font-size:13px;color:#5A5D66">${T("Dein Solo-Code", "Your Solo code")}</span><br><b style="font-family:monospace;font-size:28px;letter-spacing:4px">${code}</b></p>
<p style="margin:22px 0"><a href="${link}" style="background:#B3261E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;display:inline-block">${T("Fall öffnen", "Open the case")}</a></p>
<p>${T(`Die Uhr startet erst, wenn du die Akte öffnest – dann hast du ${F.min} Minuten, ${F.goal[0]}. Pausieren geht nicht: Ab dann läuft die Uhr durch, auch wenn du das Fenster schließt. Nimm dir die Zeit also am Stück.${F.plus ? " Im Verhörraum befragst du die Verdächtigen selbst – sie werden von einer KI gespielt." : ""} Als Geschenk? Einfach Code oder Link weitergeben, den Namen gibt ein, wer spielt.`, `The clock only starts when you open the case file – then you have ${F.min} minutes ${F.goal[1]}. There is no pause: from then on the clock keeps running, even if you close the window. So take the time in one go.${F.plus ? " In the interrogation room you question the suspects yourself – they are played by an AI." : ""} A gift? Just pass on the code or link; the name is entered by whoever plays.`)}</p>
<p>${T("Die Rechnung kommt separat per Mail von unserem Zahlungsanbieter.", "The invoice will be sent separately by our payment provider.")}<br>${T("Viel Spaß beim Ermitteln!", "Happy investigating!")}<br>Mordsteam</p>
<hr style="border:0;border-top:1px solid #DDD5C4;margin:24px 0 14px">
<div style="font-size:12.5px;color:#5A5D66;line-height:1.5"><b>${T("Vertragsbestätigung", "Contract confirmation")}</b><br>
${T("Bestellnummer", "Order number")}: ${orderNo(o.id)}<br>
${T("Anbieter", "Provider")}: Mordsteam e.U., ${T("Inhaber", "owner")} Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, ${T("Österreich", "Austria")}, office@mordsteam.com${COMPANY_FN ? `, FN ${COMPANY_FN}` : ""}, ${T("Firmenbuchgericht", "register court")} Landesgericht Eisenstadt<br>
${T("Leistung", "Service")}: ${T(`Digitaler Krimi für eine Person „${F.de}“ (Mordsteam ${F.no})${F.plus ? " mit KI-Verhörraum, ab 18 Jahren" : ""}, Spielsprache ${GL}; spielbar 12 Monate ab Kauf; innerhalb von 30 Tagen nach dem ersten Durchgang bis zu dreimal wiederholbar.`, `Digital murder mystery for one person “${F.en}” (Mordsteam ${F.no})${F.plus ? " with AI interrogation room, ages 18 and over" : ""}, game language ${GL}; playable for 12 months from purchase; can be replayed up to three times within 30 days of the first playthrough.`)}<br>
${T("Preis", "Price")}: ${priceTxt(o)} ${vatNote(c, T)}<br>
${T("Es gelten unsere AGB", "Our terms apply")}: <a href="${origin}${site === "en" ? "/en/terms.html" : "/agb.html"}">${origin}${site === "en" ? "/en/terms.html" : "/agb.html"}</a><br>
${c.kunde === "b2b" ? T("Für Bestellungen als Unternehmen besteht kein gesetzliches Rücktrittsrecht.", "Orders placed as a company have no statutory right of withdrawal.") : T("Du hast ausdrücklich verlangt, dass wir deinen Code gleich nach dem Bezahlen bereitstellen, und bestätigt, dass du als Privatperson dadurch dein Rücktrittsrecht verlierst. Es erlischt mit dieser Bestätigung und der Bereitstellung des Codes (§ 18 Abs. 1 Z 11 FAGG), spätestens aber, sobald der Fall gespielt und beendet ist (§ 18 Abs. 1 Z 1 FAGG).", "You expressly requested that we provide your code right after payment and confirmed that as a private individual you thereby lose your right of withdrawal. It expires with this confirmation and the provision of the code (§ 18 (1) no. 11 FAGG), but at the latest once the case has been played and ended (§ 18 (1) no. 1 FAGG).")}${c.kunde !== "b2b" ? `<br>${T("Widerruf (nur Privatpersonen, solange das Rücktrittsrecht besteht)", "Withdrawal (private individuals only, while the right of withdrawal exists)")}: <a href="${origin}${site === "en" ? "/en/withdraw.html" : "/widerruf.html"}?nr=${orderNo(o.id)}">${T("Vertrag widerrufen", "Withdraw from contract")}</a>` : ""}
</div></div>`;
  await opsMail(env, "solo", { to: [c.email], reply_to: "office@mordsteam.com", subject: T(`Dein Mordsteam-Solo-Fall: ${F.de}`, `Your Mordsteam Solo case: ${F.en}`), html });
}

// ---------- Friends: Mail mit Organisator- und Einladungslink ----------
async function friendsMail(env, o, g, origin) {
  const c = JSON.parse(o.contact);
  const site = c.site === "en" ? "en" : "de";
  const T = (de, en) => (site === "en" ? en : de);
  const e = (x) => String(x).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const orgLink = `${origin}/spiel/friends.html?o=${g.org_token}`, invLink = `${origin}/spiel/friends.html?e=${g.invite}`;
  const validUntil = addDays(viennaDate(o.created_at), 365);
  const GL = g.lang === "en" ? T("Englisch", "English") : T("Deutsch", "German");
  const gd = JSON.parse(g.data), n = gd.players.length, plus = !!gd.plus, lim = plus ? 70 : 45;
  const vName = plus ? T("Krimiabend Plus mit KI-Verhörraum", "Mystery Night Plus with AI interrogation room") : T("Krimiabend", "Mystery Night");
  const modeTxt = g.mode === "live" ? T("gleichzeitig – du startest den Fall für alle", "all at once – you start the case for everyone") : T(`über ${g.window_days} Tage – jeder spielt, wann er Zeit hat`, `over ${g.window_days} days – everyone plays when they have time`);
  const btn = (href, label, dark) => `<a href="${href}" style="background:${dark ? "#15171C" : "#B3261E"};color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;display:inline-block;margin:4px 0">${label}</a>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C;max-width:560px">
<div style="font-family:Georgia,serif;font-weight:900;font-size:28px;letter-spacing:.5px;margin-bottom:6px"><span style="color:#B3261E">MORDS</span><span style="color:#15171C">TEAM</span></div>
<h2 style="font-family:Georgia,serif">${T("Die Hütte wartet.", "The hut is waiting.")}</h2>
<p>${T("Hallo", "Hi")} ${e(c.name)},</p>
<p>${T(`danke für deine Bestellung von <b>Mordsteam Friends 001 „Letzte Runde auf der Hütte“ – ${vName}</b> für ${n} Personen (Spielsprache ${GL}). Gespielt wird ${modeTxt}. Eure Runde ist 12 Monate spielbar, bis ${validUntil}, und lässt sich einmal starten.`, `thank you for ordering <b>Mordsteam Friends 001 “Last Round at the Chalet” – ${vName}</b> (game language ${GL}) for ${n} people. You play ${modeTxt}. Your round is playable for 12 months, until ${validUntil}, and can be started once.`)}</p>
<p><b>1. ${T("Einladungslink an alle schicken", "Send the invitation link to everyone")}</b><br>${T("Jeder öffnet ihn und tippt auf seinen Namen – auch du, wenn du mitspielst.", "Everyone opens it and taps their name – you too, if you're playing.")}<br><a href="${invLink}">${e(invLink)}</a></p>
<p><b>2. ${T("Deine Organisator-Seite (nicht weitergeben)", "Your organiser page (don't pass on)")}</b><br>${T("Dort siehst du, wer schon da ist, und startest den Fall.", "There you can see who has joined and start the case.")}</p>
<p>${btn(orgLink, T("Organisator-Seite öffnen", "Open organiser page"), true)}</p>
<p>${T(`Die Uhr läuft ${lim} Minuten ab dem Start, ohne Pause${g.mode === "live" ? "" : " – über die Woche startet jeder seine eigene Uhr mit dem Öffnen der Akte, also am besten, wenn man die Zeit am Stück hat"}. Die Auflösung mit Rangliste kommt für alle gleichzeitig – sobald alle fertig sind.`, `The clock runs for ${lim} minutes from the start, without a pause${g.mode === "live" ? "" : " – over the week, everyone starts their own clock by opening the case file, so best when you have the time in one go"}. The solution and ranking come for everyone at the same time – once everyone has finished.`)}${plus ? " " + T("Der KI-Verhörraum ist für Mitspielende ab 18 Jahren.", "The AI interrogation room is for players aged 18 and over.") : ""}</p>
${c.earlybird ? `<p><b>Early Bird:</b> ${T("Danke, dass ihr uns helft! Nach der Auflösung fragt euch das Spiel direkt nach eurem Feedback.", "Thanks for helping us! After the solution, the game will ask you for your feedback right away.")}</p>` : ""}
<p>${T("Die Rechnung kommt separat per Mail von unserem Zahlungsanbieter.", "The invoice will be sent separately by our payment provider.")}<br>${T("Viel Spaß beim Ermitteln!", "Happy investigating!")}<br>Mordsteam</p>
<hr style="border:0;border-top:1px solid #DDD5C4;margin:24px 0 14px">
<div style="font-size:12.5px;color:#5A5D66;line-height:1.5"><b>${T("Vertragsbestätigung", "Contract confirmation")}</b><br>
${T("Bestellnummer", "Order number")}: ${orderNo(o.id)}<br>
${T("Anbieter", "Provider")}: Mordsteam e.U., ${T("Inhaber", "owner")} Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, ${T("Österreich", "Austria")}, office@mordsteam.com${COMPANY_FN ? `, FN ${COMPANY_FN}` : ""}, ${T("Firmenbuchgericht", "register court")} Landesgericht Eisenstadt<br>
${T("Leistung", "Service")}: ${T(`Digitaler ${vName} „Letzte Runde auf der Hütte“ (Mordsteam Friends 001) für ${n} Personen, ${lim} Minuten, Spielsprache ${GL}; spielbar 12 Monate ab Kauf, einmal startbar.`, `Digital ${vName} “Last Round at the Chalet” (Mordsteam Friends 001) for ${n} people, ${lim} minutes, game language ${GL}; playable for 12 months from purchase, can be started once.`)}<br>
${T("Preis", "Price")}: ${priceTxt(o)} ${vatNote(c, T)}<br>
${T("Es gelten unsere AGB", "Our terms apply")}: <a href="${origin}${site === "en" ? "/en/terms.html" : "/agb.html"}">${origin}${site === "en" ? "/en/terms.html" : "/agb.html"}</a><br>
${c.kunde === "b2b" ? T("Für Bestellungen als Unternehmen besteht kein gesetzliches Rücktrittsrecht.", "Orders placed as a company have no statutory right of withdrawal.") : T("Du hast ausdrücklich verlangt, dass wir eure Runde gleich nach dem Bezahlen anlegen und die Links bereitstellen, und bestätigt, dass du als Privatperson dadurch dein Rücktrittsrecht verlierst. Es erlischt mit dieser Bestätigung und der Bereitstellung der Links (§ 18 Abs. 1 Z 11 FAGG), spätestens aber mit der gemeinsamen Auflösung (§ 18 Abs. 1 Z 1 FAGG).", "You expressly requested that we set up your round and provide the links right after payment and confirmed that as a private individual you thereby lose your right of withdrawal. It expires with this confirmation and the provision of the links (§ 18 (1) no. 11 FAGG), but at the latest with the joint solution (§ 18 (1) no. 1 FAGG).")}${c.kunde !== "b2b" ? `<br>${T("Widerruf (nur Privatpersonen, solange das Rücktrittsrecht besteht)", "Withdrawal (private individuals only, while the right of withdrawal exists)")}: <a href="${origin}${site === "en" ? "/en/withdraw.html" : "/widerruf.html"}?nr=${orderNo(o.id)}">${T("Vertrag widerrufen", "Withdraw from contract")}</a>` : ""}
</div></div>`;
  await opsMail(env, "friends", { to: [c.email], reply_to: "office@mordsteam.com", subject: T("Euer Mordsteam-Krimiabend: Letzte Runde auf der Hütte", "Your Mordsteam mystery night: Last Round at the Chalet"), html });
}

// Für die Buchhaltung: tatsächlich bezahlter Betrag (nach Rabatt) und Stripe-Rechnungsnummer speichern
async function recordPayment(env, id, cs) {
  try {
    for (const q of ["ALTER TABLE orders ADD COLUMN invoice_no TEXT"]) { try { await env.DB.prepare(q).run(); } catch {} }
    if (cs && Number.isFinite(cs.amount_total)) await env.DB.prepare("UPDATE orders SET amount_cents=? WHERE id=?").bind(cs.amount_total, id).run();
    const invId = cs && (typeof cs.invoice === "string" ? cs.invoice : cs.invoice?.id);
    if (invId) {
      const inv = await stripe(env, "GET", `invoices/${invId}`);
      if (inv && inv.number) await env.DB.prepare("UPDATE orders SET invoice_no=? WHERE id=?").bind(inv.number, id).run();
    }
    if (cs && cs.id) await enrichPayment(env, id, cs.id);
    if (cs && cs.id) {
      await migrateNewsletter(env);
      const d = await stripe(env, "GET", `checkout/sessions/${cs.id}?expand[]=discounts.promotion_code`);
      const pc = d && Array.isArray(d.discounts) && d.discounts.map((x) => x.promotion_code).find((x) => x && typeof x === "object");
      await env.DB.prepare("UPDATE orders SET promo_code=?, discount_cents=? WHERE id=?").bind(pc ? pc.code : null, d && d.total_details ? d.total_details.amount_discount : null, id).run();
    }
  } catch { /* Buchhaltungsdaten dürfen die Bestellung nie blockieren */ }
}

// Early-Bird-Gutschein in Stripe: vorhandenen nehmen oder beim ersten Bedarf selbst anlegen (einmalig, x % Rabatt)
async function ebCoupon(env, prozent) {
  if (env.EARLYBIRD_COUPON) return env.EARLYBIRD_COUPON;
  const id = `MORDSTEAM${prozent}`;
  try { const c = await stripe(env, "GET", `coupons/${id}`); if (c && c.id && c.valid !== false) return c.id; } catch {}
  try { await stripe(env, "POST", "coupons", { id, percent_off: prozent, duration: "once", name: `Early Bird ${prozent} %` }); }
  catch (e) { const c = await stripe(env, "GET", `coupons/${id}`); if (!c || !c.id) throw e; }  // parallel angelegt
  return id;
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
  const r = await fetch(`${env.STRIPE_API_BASE || "https://api.stripe.com/v1"}/${path}`, {
    method,
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: data ? formEncode(data) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Stripe: ${d.error?.message || r.status}`);
  return d;
}
