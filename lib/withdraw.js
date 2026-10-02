// Widerrufsfunktion („Vertrag widerrufen“, Pflicht für Online-Verträge mit Verbrauchern ab 1.10.2026, VerbRÄG 2026).
// Nur für Bestellungen als Privatperson (contact.kunde = "b2c"; ältere Bestellungen ohne Angabe gelten als Privatperson).
// Rücktritt möglich, solange die Frist (14 Tage ab Zahlung) läuft und die Spielrunde nicht gespielt und beendet ist.
// Nach dem Absenden: sofortige Bestätigung per E-Mail an den Kunden (dauerhafter Datenträger) + Info an office@mordsteam.com.
import { json, fail } from "./game.js";
import { sendMail } from "./ops.js";

const OFFICE = "office@mordsteam.com";
const DAY = 86400000;
const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const clip = (x, n) => String(x ?? "").trim().slice(0, n);
export const orderNo = (id) => String(id || "").replace(/-/g, "").slice(0, 8).toUpperCase();
const vienna = (ms) => new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", dateStyle: "medium", timeStyle: "medium" }).format(new Date(ms));

let ready = false;
async function migrateWithdraw(env) {
  if (ready) return;
  for (const s of ["ALTER TABLE orders ADD COLUMN withdrawn_at INTEGER", "ALTER TABLE orders ADD COLUMN withdrawal TEXT"]) {
    try { await env.DB.prepare(s).run(); } catch {}
  }
  ready = true;
}

const send = (env, to, subject, html, replyTo) => sendMail(env, to === OFFICE ? "widerruf-office" : "widerruf", { to: [to], reply_to: replyTo, subject, html });

export async function handleWithdraw(request, env) {
  let b = {};
  try { b = await request.json(); } catch {}
  const en = b.lang === "en";
  const T = (de, e) => (en ? e : de);
  await migrateWithdraw(env);

  const nr = String(b.nr || "").toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 8);
  const email = clip(b.email, 200).toLowerCase();
  const name = clip(b.name, 120);
  const grund = clip(b.grund, 1000);
  if (nr.length !== 8) return fail(T("Bitte die Bestellnummer angeben (8 Zeichen, steht in der Bestätigungsmail).", "Please enter the order number (8 characters, shown in the confirmation email)."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(T("Bitte die E-Mail-Adresse angeben, mit der ihr bestellt habt.", "Please enter the email address you used to order."));
  if (name.length < 2) return fail(T("Bitte euren Namen angeben.", "Please enter your name."));
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return fail(T(`Die Widerrufsfunktion ist gerade nicht erreichbar. Bitte schickt euren Widerruf per E-Mail an ${OFFICE}.`, `The withdrawal function is not available right now. Please send your withdrawal by email to ${OFFICE}.`), 503);

  const { results } = await env.DB.prepare(
    "SELECT * FROM orders WHERE upper(substr(replace(id,'-',''),1,8)) = ? AND status IN ('paid','fulfilling','fulfilled','withdrawn')").bind(nr).all();
  const o = results.find((x) => { try { return JSON.parse(x.contact).email === email; } catch { return false; } });
  if (!o) return fail(T(`Wir finden keine Bestellung mit dieser Bestellnummer und E-Mail-Adresse. Bitte prüft beide Angaben oder schreibt an ${OFFICE}.`, `We can't find an order with this order number and email address. Please check both or write to ${OFFICE}.`), 404);

  const c = JSON.parse(o.contact || "{}");
  if (o.status === "withdrawn") return json({ ok: true, already: true, nr });
  if (c.kunde === "b2b") return fail(T(`Diese Bestellung wurde für ein Unternehmen, einen Verein oder eine Organisation aufgegeben. Dafür besteht kein gesetzliches Rücktrittsrecht. Falls das nicht stimmt, schreibt uns bitte an ${OFFICE}.`, `This order was placed for a company, club or organisation. There is no statutory right of withdrawal for such orders. If this is not correct, please write to us at ${OFFICE}.`), 422);
  const paidAt = o.paid_at || o.created_at;
  if (Date.now() - paidAt > 14 * DAY) return fail(T("Die 14-tägige Rücktrittsfrist für diese Bestellung ist abgelaufen.", "The 14-day withdrawal period for this order has expired."), 422);
  const solo = o.paket === "solo", friends = o.paket === "friends" || o.paket === "friends-plus";
  let fg = null;
  if (friends) {
    fg = await env.DB.prepare("SELECT id, status FROM friends_groups WHERE order_id=?").bind(o.id).first().catch(() => null);
    if (fg && fg.status === "revealed") return fail(T("Der Krimiabend wurde bereits gespielt und aufgelöst. Damit ist das Rücktrittsrecht erloschen (§ 18 Abs. 1 Z 1 FAGG, siehe AGB Punkt 8).", "The mystery night has already been played and solved, so the right of withdrawal has expired (§ 18 (1) no. 1 FAGG, see terms section 8)."), 422);
  }
  let s = null, soloTicket = null, soloPlayed = false, soloStarted = false;
  if (solo) {
    soloTicket = await env.DB.prepare("SELECT code FROM solo_tickets WHERE order_id=?").bind(o.id).first().catch(() => null);
    if (soloTicket) {
      const r = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN ended_at IS NOT NULL THEN 1 ELSE 0 END) AS e FROM solo_runs WHERE code=?").bind(soloTicket.code).first();
      soloStarted = (r?.n || 0) > 0; soloPlayed = (r?.e || 0) > 0;
    }
    if (soloPlayed) return fail(T("Der Fall wurde bereits gespielt und beendet. Damit ist das Rücktrittsrecht erloschen (§ 18 Abs. 1 Z 1 FAGG, siehe AGB Punkt 8).", "The case has already been played and ended, so the right of withdrawal has expired (§ 18 (1) no. 1 FAGG, see terms section 8)."), 422);
  } else s = o.session_id ? await env.DB.prepare("SELECT id, status, started_at FROM sessions WHERE id=?").bind(o.session_id).first() : null;
  if (s && s.status === "finished") return fail(T("Die Spielrunde wurde bereits gespielt und beendet. Damit ist das Rücktrittsrecht erloschen (§ 18 Abs. 1 Z 1 FAGG, siehe AGB Punkt 8).", "The game round has already been played and ended, so the right of withdrawal has expired (§ 18 (1) no. 1 FAGG, see terms section 8)."), 422);
  const started = solo ? soloStarted : friends ? !!(fg && fg.status === "running") : !!(s && (s.status === "running" || s.started_at));

  const now = Date.now();
  const rec = { name, email, grund, started, at: now, site: en ? "en" : "de" };
  await env.DB.prepare("UPDATE orders SET status='withdrawn', withdrawn_at=?, withdrawal=? WHERE id=?").bind(now, JSON.stringify(rec), o.id).run();
  // Nicht gestartete Runde sperren (Codes funktionieren nicht mehr)
  if (s && !started) await env.DB.prepare("UPDATE sessions SET status='withdrawn' WHERE id=?").bind(s.id).run();
  if (soloTicket) await env.DB.prepare("UPDATE solo_tickets SET status='withdrawn' WHERE code=?").bind(soloTicket.code).run();
  if (fg && !started) await env.DB.prepare("UPDATE friends_groups SET status='withdrawn' WHERE id=?").bind(fg.id).run();

  const when = vienna(now);
  const betrag = (o.amount_cents / 100).toLocaleString("de-AT", { minimumFractionDigits: 2 });
  const leistung = friends ? T(`Mordsteam Friends 001 „Letzte Runde auf der Hütte“, ${o.teams} Personen, ${betrag} €`, `Mordsteam Friends 001 “Last Round at the Chalet”, ${o.teams} people, €${betrag}`) : solo ? T(`Mordsteam Solo 001 „Nachtzug nach Venedig“, ${betrag} €`, `Mordsteam Solo 001 “Night Train to Venice”, €${betrag}`) : T(`Mordsteam-Krimifall, Paket ${o.paket}, ${o.teams} Team${o.teams === 1 ? "" : "s"}, ${betrag} €`, `Mordsteam murder-mystery case, package ${o.paket}, ${o.teams} team${o.teams === 1 ? "" : "s"}, €${betrag}`);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C;max-width:560px">
<div style="font-family:Georgia,serif;font-weight:900;font-size:22px;margin-bottom:10px"><span style="color:#B3261E">MORDS</span>TEAM</div>
<p>${T("Hallo", "Hi")} ${esc(name)},</p>
<p>${T("wir bestätigen den Eingang eures Widerrufs:", "we confirm receipt of your withdrawal:")}</p>
<div style="border-left:3px solid #B3261E;background:#F3EFE6;padding:10px 14px">
<b>${T("Widerrufserklärung", "Declaration of withdrawal")}</b><br>
${T("Hiermit widerrufe ich den Vertrag über folgende Leistung", "I hereby withdraw from the contract for the following service")}: ${esc(leistung)}<br>
${T("Bestellnummer", "Order number")}: ${orderNo(o.id)}<br>
${T("Bestellt am", "Ordered on")}: ${vienna(o.created_at)}<br>
Name: ${esc(name)} · E-Mail: ${esc(email)}${grund ? `<br>${T("Anmerkung", "Note")}: ${esc(grund)}` : ""}<br>
${T("Eingegangen am", "Received on")}: ${when}
</div>
<p>${started
    ? T("Die Spielrunde war beim Widerruf bereits gestartet. Wir erstatten den bezahlten Betrag abzüglich eines anteiligen Betrags für die bis dahin erbrachte Leistung (§ 16 FAGG, AGB Punkt 8) innerhalb von 14 Tagen über das ursprüngliche Zahlungsmittel.", "The game round had already been started when you withdrew. We will refund the amount paid, minus a proportionate amount for the service provided up to that point (§ 16 FAGG, terms section 8), within 14 days using the original means of payment.")
    : T("Die Spielrunde wurde noch nicht gestartet und ist ab sofort gesperrt. Wir erstatten den vollen Betrag innerhalb von 14 Tagen über das ursprüngliche Zahlungsmittel.", "The game round had not been started and is now locked. We will refund the full amount within 14 days using the original means of payment.")}</p>
<p>${T("Bei Fragen antwortet einfach auf diese E-Mail.", "If you have any questions, just reply to this email.")}<br>Mordsteam</p>
<p style="font-size:11.5px;color:#8A8D96">Mordsteam e.U. · ${T("Inhaber", "Owner")} Martin Kriegler · Sportplatzgasse 16, 7152 Pamhagen, ${T("Österreich", "Austria")} · FN 689638z · ${T("Firmenbuchgericht", "Register court")} Landesgericht Eisenstadt</p>
</div>`;
  const okCustomer = await send(env, email, T(`Bestätigung eures Widerrufs – Bestellung ${orderNo(o.id)}`, `Confirmation of your withdrawal – order ${orderNo(o.id)}`), html, OFFICE);
  await send(env, OFFICE, `WIDERRUF ${orderNo(o.id)} – ${started ? "gestartet, anteilig erstatten" : "voll erstatten"} (${betrag} €)`,
    `<p>Widerruf eingegangen am ${when}.</p><p>Bestellung ${orderNo(o.id)} (${esc(o.id)}), ${esc(leistung)}<br>Name: ${esc(name)}, E-Mail: ${esc(email)}<br>Runde gestartet: ${started ? "ja → anteilig erstatten" : "nein → voll erstatten, Runde ist gesperrt"}${grund ? `<br>Anmerkung: ${esc(grund)}` : ""}</p><p><b>To do:</b> Erstattung in Stripe innerhalb von 14 Tagen (Zahlungen → Zahlung suchen → Erstatten).</p>`, email);
  return json({ ok: true, nr: orderNo(o.id), when, started, mail: okCustomer });
}
