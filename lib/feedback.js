// Feedback nach dem Spiel: Am Tag nach Spielende bekommt der Besteller eine Mail mit Link zum Feedbackbogen.
// Early-Bird-Bestellungen: ausführlicher Bogen (Teil der Rabattbedingungen). Sonst: kurzer Bogen.
// Ausgelöst täglich per GitHub Action (POST /api/shop/cron mit CRON_KEY) oder per Knopf im Admin.
// Veröffentlicht wird eine Bewertung nur mit Zustimmung (anonym oder mit Namen) UND nach Freigabe im Admin.
import { viennaDate, randomToken } from "./game.js";
import { sendMail } from "./ops.js";

let ready = false;
export async function migrateFeedback(env) {
  if (ready) return;
  for (const s of [
    "ALTER TABLE orders ADD COLUMN feedback_token TEXT",
    "ALTER TABLE orders ADD COLUMN feedback_sent_at INTEGER",
    "CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, order_id TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, variant TEXT NOT NULL, lang TEXT, paket TEXT, rating INTEGER, nps INTEGER, answers TEXT, review TEXT, publish TEXT NOT NULL DEFAULT 'no', publish_name TEXT, approved INTEGER NOT NULL DEFAULT 0)",
    "ALTER TABLE feedback ADD COLUMN home INTEGER NOT NULL DEFAULT 0",
  ]) { try { await env.DB.prepare(s).run(); } catch {} }
  ready = true;
}

const L = (lang, de, en) => (lang === "en" ? en : de);
const e = (x) => String(x ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

// Fällige Feedback-Mails: bezahlte Bestellung, Runde beendet (nicht Test), Ende liegt mind. einen Kalendertag zurück
export async function dueFeedback(env, { force = false } = {}) {
  await migrateFeedback(env);
  const { results } = await env.DB.prepare(
    `SELECT o.*, s.ended_at, s.status AS s_status, s.test_mode FROM orders o JOIN sessions s ON s.id = o.session_id
     WHERE o.status = 'fulfilled' AND o.feedback_sent_at IS NULL AND o.id NOT IN (SELECT order_id FROM feedback) AND s.status = 'finished' AND s.ended_at IS NOT NULL AND s.test_mode = 0
     ORDER BY s.ended_at LIMIT 50`).all();
  const today = viennaDate();
  return results.filter((o) => {
    const c = JSON.parse(o.contact || "{}");
    if (c.no_feedback) return false;                     // beim Bestellen abgewählt
    return force || viennaDate(o.ended_at) < today;      // frühestens am Folgetag
  });
}

export async function runFeedbackMails(env, origin, opts = {}) {
  const due = await dueFeedback(env, opts);
  const out = [];
  for (const o of due) {
    const c = JSON.parse(o.contact || "{}");
    const token = o.feedback_token || randomToken(16);
    const site = c.site === "en" ? "en" : "de";
    const link = `${origin}${site === "en" ? "/en/feedback.html" : "/feedback.html"}?f=${token}`;
    let sent = false;
    if (env.RESEND_API_KEY && env.MAIL_FROM && c.email) {
      sent = await sendMail(env, "feedback", { to: [c.email], reply_to: "office@mordsteam.com",
          subject: L(site, c.earlybird ? "Early Bird: Wie war euer Teamevent mit Mordsteam?" : "Wie war euer Teamevent mit Mordsteam?", c.earlybird ? "Early bird: how was your team event with Mordsteam?" : "How was your team event with Mordsteam?"),
          html: mailHtml(site, c, link) });
    }
    // Ohne Mailversand (noch nicht eingerichtet) nicht als versendet markieren – der Link erscheint im Admin
    await env.DB.prepare("UPDATE orders SET feedback_token=?, feedback_sent_at=? WHERE id=?").bind(token, sent ? Date.now() : null, o.id).run();
    out.push({ order: o.id, email: c.email, sent, link, earlybird: !!c.earlybird });
  }
  return out;
}

function mailHtml(site, c, link) {
  const T = (de, en) => (site === "en" ? en : de);
  const btn = `<p style="margin:22px 0"><a href="${link}" style="background:#B3261E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;display:inline-block">${T("Zum Feedbackbogen", "Open the feedback form")}</a></p>`;
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C;max-width:560px">
<div style="font-family:Georgia,serif;font-weight:900;font-size:22px;letter-spacing:.5px;margin-bottom:10px"><span style="color:#B3261E">MORDS</span><span style="color:#15171C">TEAM</span></div>
<p>${T("Hallo", "Hi")} ${e(c.name)},</p>
<p>${T("euer Mordsteam-Fall ist abgeschlossen – wir hoffen, es hat allen Spaß gemacht!", "your Mordsteam case is closed – we hope everyone had fun!")}</p>
${c.earlybird
  ? `<p>${T("Ihr habt den Early-Bird-Rabatt genutzt – danke, dass ihr uns helft, Mordsteam besser zu machen! Wie vereinbart, bitten wir euch jetzt um euer Feedback. Das dauert rund 5 Minuten.", "You used the early bird discount – thanks for helping us make Mordsteam better! As agreed, we'd now love your feedback. It takes about 5 minutes.")}</p>`
  : `<p>${T("Verratet ihr uns in 2 Minuten, wie Mordsteam in euer Teamevent gepasst hat – Stimmung, Aufwand, wieder buchen? Wie das Spiel selbst war, haben wir eure Spieler schon direkt nach der Runde gefragt.", "Could you tell us in 2 minutes how Mordsteam fitted into your team event – mood, effort, would you book again? We already asked your players right after the round how they liked the game itself.")}</p>`}
${btn}
<p style="font-size:13px;color:#5A5D66">${T("Ob wir eure Bewertung auf mordsteam.com zeigen dürfen – anonym oder mit Namen –, entscheidet ihr im Bogen. Ohne eure Zustimmung veröffentlichen wir nichts.", "Whether we may show your review on mordsteam.com – anonymously or with your name – is up to you in the form. We publish nothing without your consent.")}</p>
<p>${T("Danke und bis zum nächsten Fall!", "Thank you and see you at the next case!")}<br>Martin · Mordsteam</p>
<p style="font-size:12px;color:#8A8D96">${T("Ihr bekommt diese eine Mail, weil ihr bei Mordsteam bestellt habt. Weitere Feedback-Mails zu dieser Bestellung schicken wir nicht.", "You're receiving this one email because you ordered from Mordsteam. We won't send further feedback emails about this order.")}</p>
<p style="font-size:11.5px;color:#8A8D96">Mordsteam e.U. · ${T("Inhaber", "Owner")} Martin Kriegler · Sportplatzgasse 16, 7152 Pamhagen, ${T("Österreich", "Austria")} · FN 689638z · ${T("Firmenbuchgericht", "Register court")} Landesgericht Eisenstadt</p>
</div>`;
}

// ---------- Feedbackbogen ----------
export async function feedbackInfo(env, token) {
  await migrateFeedback(env);
  if (!token) return null;
  const o = await env.DB.prepare("SELECT * FROM orders WHERE feedback_token=?").bind(token).first();
  if (!o) return null;
  const c = JSON.parse(o.contact || "{}");
  const done = await env.DB.prepare("SELECT id FROM feedback WHERE order_id=?").bind(o.id).first();
  return { order: o, variant: c.earlybird ? "eb" : "std", lang: c.site === "en" ? "en" : "de", game_lang: c.lang || "de",
    paket: o.paket, firma: JSON.parse(o.vars || "{}").FIRMA || "", fiktiv: !!c.fiktiv, done: !!done };
}

const clip = (x, n) => String(x ?? "").trim().replace(/\s+\n/g, "\n").slice(0, n);
export async function saveFeedback(env, token, b) {
  const info = await feedbackInfo(env, token);
  if (!info) return { error: "notfound" };
  if (info.done) return { error: "done" };
  const int = (x, lo, hi) => { const n = Math.round(Number(x)); return n >= lo && n <= hi ? n : null; };
  const rating = int(b.rating, 1, 5);
  if (!rating) return { error: "rating" };
  const publish = ["no", "anon", "name"].includes(b.publish) ? b.publish : "no";
  const answers = {};
  for (const k of ["event", "stimmung", "aufwand", "again", "improve", "tech", "players", "call", "best", "difficulty", "duration", "aria"]) if (b[k] != null && b[k] !== "") answers[k] = clip(b[k], 1500);
  await env.DB.prepare("INSERT INTO feedback (id, order_id, created_at, variant, lang, paket, rating, nps, answers, review, publish, publish_name, approved) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)")
    .bind(crypto.randomUUID(), info.order.id, Date.now(), info.variant, info.lang, info.paket, rating, int(b.nps, 0, 10),
      JSON.stringify(answers), clip(b.review, 800), publish, publish === "name" ? clip(b.publish_name, 80) : null).run();
  return { ok: true };
}

// Freigegebene Bewertungen für die Startseite (nur mit Zustimmung)
// ort = "home": handverlesene Stimmen für die Startseite (alle Produkte). Sonst: Unterseite des Produkts (Teams, Friends oder Solo).
export async function publicReviews(env, lang, produkt = "", ort = "") {
  await migrateFeedback(env);
  const where = ort === "home" ? "home=1" : `approved=1 AND ${produkt === "solo" ? "paket = 'solo'" : produkt === "friends" ? "paket = 'friends'" : "COALESCE(paket,'') NOT IN ('solo','friends')"}`;
  const { results } = await env.DB.prepare(
    `SELECT rating, review, publish, publish_name, lang, created_at, paket, variant FROM feedback WHERE ${where} AND publish IN ('anon','name') AND review <> '' ORDER BY (lang = ?) DESC, created_at DESC LIMIT 6`).bind(lang).all();
  return results.map((r) => ({ rating: r.rating, text: r.review, name: r.publish === "name" ? r.publish_name || "" : "", produkt: r.paket === "solo" || r.paket === "friends" ? r.paket : "teams", von: ["spieler", "solo", "solo-replay", "friends"].includes(r.variant) ? "spieler" : "organisator" }));
}
