// Kontaktformular: Nachricht per Resend an office@mordsteam.com (Antworten gehen direkt an die Absenderin).
// Schutz gegen Spam: verstecktes Feld (Honeypot), Mindest-Ausfüllzeit, max. 5 Nachrichten pro Stunde und Anschluss.
// Gespeichert wird nur ein Hash der IP-Adresse mit Zeitpunkt (für das Limit), nach 24 Stunden gelöscht – die Nachricht selbst nur im Postfach.
import { json, fail } from "./game.js";

const TO = "office@mordsteam.com";
const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const clip = (x, n) => String(x ?? "").replace(/\r\n/g, "\n").trim().slice(0, n);

async function ipHash(request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("mordsteam-kontakt:" + ip));
  return [...new Uint8Array(d)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function handleContact(request, env) {
  let b = {};
  try { b = await request.json(); } catch {}
  const en = b.lang === "en";
  const T = (de, e) => (en ? e : de);

  if (b.website) return json({ ok: true });                                   // Honeypot: Bots bekommen „ok“, es passiert nichts
  if (!Number(b.t) || Date.now() - Number(b.t) < 3000) return fail(T("Bitte einen Moment warten und dann nochmal senden.", "Please wait a moment and send again."));

  const name = clip(b.name, 100), email = clip(b.email, 200), message = clip(b.message, 5000);
  if (!name) return fail(T("Bitte euren Namen angeben.", "Please enter your name."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."));
  if (message.length < 5) return fail(T("Bitte eine Nachricht schreiben.", "Please write a message."));
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return fail(T("Das Formular ist gerade nicht erreichbar. Bitte schreibt direkt an office@mordsteam.com.", "The form is not available right now. Please write directly to office@mordsteam.com."), 503);

  // Limit: 5 Nachrichten pro Stunde und Anschluss
  const h = await ipHash(request), now = Date.now();
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS contact_log (ip TEXT NOT NULL, at INTEGER NOT NULL)").run();
    await env.DB.prepare("DELETE FROM contact_log WHERE at < ?").bind(now - 86400000).run();
    const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM contact_log WHERE ip=? AND at > ?").bind(h, now - 3600000).first();
    if (c && c.n >= 5) return fail(T("Ihr habt schon mehrere Nachrichten geschickt. Bitte versucht es später nochmal oder schreibt an office@mordsteam.com.", "You have already sent several messages. Please try again later or write to office@mordsteam.com."), 429);
  } catch {}

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C">
<p><b>Neue Nachricht über das Kontaktformular</b> (${en ? "englische" : "deutsche"} Seite)</p>
<p>Name: ${esc(name)}<br>E-Mail: ${esc(email)}</p>
<div style="white-space:pre-wrap;border-left:3px solid #B3261E;padding:8px 12px;background:#F3EFE6">${esc(message)}</div>
<p style="font-size:12px;color:#5A5D66">Auf diese Mail antworten = Antwort geht direkt an ${esc(email)}.</p></div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [TO], reply_to: email, subject: `Kontaktformular: ${name.slice(0, 60)}`, html,
      text: `Neue Nachricht über das Kontaktformular\n\nName: ${name}\nE-Mail: ${email}\n\n${message}` }),
  }).catch(() => null);
  if (!r || !r.ok) return fail(T("Senden hat nicht geklappt. Bitte schreibt direkt an office@mordsteam.com.", "Sending failed. Please write directly to office@mordsteam.com."), 502);

  try { await env.DB.prepare("INSERT INTO contact_log (ip, at) VALUES (?, ?)").bind(h, now).run(); } catch {}
  return json({ ok: true });
}
