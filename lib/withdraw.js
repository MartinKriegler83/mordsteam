// Widerrufsfunktion („Vertrag widerrufen“, Pflicht für Online-Verträge mit Verbrauchern ab 1.10.2026, VerbRÄG 2026).
// Nur für Bestellungen als Privatperson (contact.kunde = "b2c"; ältere Bestellungen ohne Angabe gelten als Privatperson).
// Rücktritt möglich, solange die Frist (14 Tage ab Zahlung) läuft und die Spielrunde nicht gespielt und beendet ist.
// Seit 23.10.2026 (Freigabe F2): JEDE Erklärung wird angenommen und bestätigt. Passt sie nicht (Frist vorbei, schon gespielt,
// Firmenbestellung, Bestellung nicht gefunden), bleibt die Bestellung unverändert und kommt als „Widerruf prüfen“ in den Admin.
// Nach dem Absenden: sofortige Bestätigung per E-Mail an den Kunden (dauerhafter Datenträger) + Info an office@mordsteam.com.
import { json, fail } from "./game.js";
import { sendMail } from "./ops.js";
import { soloCaseList } from "./solo.js";
import { friendsCase } from "./friends.js";

const OFFICE = "office@mordsteam.com";
const DAY = 86400000;
const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const clip = (x, n) => String(x ?? "").trim().slice(0, n);
export const orderNo = (id) => String(id || "").replace(/-/g, "").slice(0, 8).toUpperCase();
const vienna = (ms) => new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", dateStyle: "medium", timeStyle: "medium" }).format(new Date(ms));

let ready = false;
export async function migrateWithdraw(env) {
  if (ready) return;
  for (const s of ["ALTER TABLE orders ADD COLUMN withdrawn_at INTEGER", "ALTER TABLE orders ADD COLUMN withdrawal TEXT",
    "CREATE TABLE IF NOT EXISTS withdraw_inbox (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, nr TEXT, email TEXT, name TEXT, grund TEXT, site TEXT, done INTEGER DEFAULT 0)"]) {
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
  const roh = String(b.nr || "").toUpperCase().replace(/[\s#-]/g, "");
  if (nr.length !== 8 && roh.length >= 8 && /[^0-9A-F]/.test(roh)) return fail(T("Die Bestellnummer besteht nur aus den Ziffern 0–9 und den Buchstaben A–F. Bitte in der Bestätigungsmail nachsehen.", "The order number only contains the digits 0–9 and the letters A–F. Please check your confirmation email."));
  if (nr.length !== 8) return fail(T("Bitte die Bestellnummer angeben (8 Zeichen, steht in der Bestätigungsmail).", "Please enter the order number (8 characters, shown in the confirmation email)."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(T("Bitte die E-Mail-Adresse angeben, mit der ihr bestellt habt.", "Please enter the email address you used to order."));
  if (name.length < 2) return fail(T("Bitte euren Namen angeben.", "Please enter your name."));
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return fail(T(`Die Widerrufsfunktion ist gerade nicht erreichbar. Bitte schickt euren Widerruf per E-Mail an ${OFFICE}.`, `The withdrawal function is not available right now. Please send your withdrawal by email to ${OFFICE}.`), 503);

  const { results } = await env.DB.prepare(
    "SELECT * FROM orders WHERE upper(substr(replace(id,'-',''),1,8)) = ? AND status IN ('paid','fulfilling','fulfilled','withdrawn')").bind(nr).all();
  const o = results.find((x) => { try { return JSON.parse(x.contact).email === email; } catch { return false; } });
  if (!o) return unmatched(env, { nr, email, name, grund, en, T });

  const c = JSON.parse(o.contact || "{}");
  if (o.status === "withdrawn") return json({ ok: true, already: true, nr });
  if (o.withdrawal) { try { if (JSON.parse(o.withdrawal).review) return json({ ok: true, already: true, review: true, nr }); } catch {} }
  const pruef = [];   // Gründe, warum der Widerruf geprüft werden muss (F2: trotzdem annehmen und bestätigen)
  if (c.kunde === "b2b") pruef.push(T("Die Bestellung wurde für ein Unternehmen, einen Verein oder eine Organisation aufgegeben.", "The order was placed for a company, club or organisation."));
  const paidAt = o.paid_at || o.created_at;
  // Frist: 14 Kalendertage ab dem Tag des Vertragsabschlusses, endet um 24 Uhr Wiener Zeit (§ 11 FAGG, EU-Fristen-VO) – Nachttest 22.10.2026 E-H2
  const wien = (ms) => new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Vienna" });
  const fristEnde = (() => { const d = new Date(wien(paidAt) + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 14); return d.toISOString().slice(0, 10); })();
  if (wien(Date.now()) > fristEnde) pruef.push(T("Die 14-tägige Rücktrittsfrist ist nach unseren Unterlagen abgelaufen.", "According to our records, the 14-day withdrawal period has expired."));
  const solo = o.paket === "solo", friends = o.paket === "friends" || o.paket === "friends-plus";
  let fg = null;
  if (friends) {
    fg = await env.DB.prepare("SELECT id, status, case_id FROM friends_groups WHERE order_id=?").bind(o.id).first().catch(() => null);
    if (fg && fg.status === "revealed") pruef.push(T("Der Krimiabend wurde nach unseren Unterlagen bereits gespielt und aufgelöst.", "According to our records, the mystery night has already been played and solved."));
  }
  let s = null, soloTicket = null, soloPlayed = false, soloStarted = false;
  if (solo) {
    soloTicket = await env.DB.prepare("SELECT code FROM solo_tickets WHERE order_id=?").bind(o.id).first().catch(() => null);
    if (soloTicket) {
      const r = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN ended_at IS NOT NULL THEN 1 ELSE 0 END) AS e FROM solo_runs WHERE code=?").bind(soloTicket.code).first();
      soloStarted = (r?.n || 0) > 0; soloPlayed = (r?.e || 0) > 0;
    }
    if (soloPlayed) pruef.push(T("Der Fall wurde nach unseren Unterlagen bereits gespielt und beendet.", "According to our records, the case has already been played and ended."));
  } else s = o.session_id ? await env.DB.prepare("SELECT id, status, started_at FROM sessions WHERE id=?").bind(o.session_id).first() : null;
  if (s && s.status === "finished") pruef.push(T("Die Spielrunde wurde nach unseren Unterlagen bereits gespielt und beendet.", "According to our records, the game round has already been played and ended."));
  const started = solo ? soloStarted : friends ? !!(fg && fg.status === "running") : !!(s && (s.status === "running" || s.started_at));

  const now = Date.now();
  const review = pruef.length > 0;
  const rec = { name, email, grund, started, at: now, site: en ? "en" : "de", ...(review ? { review: pruef } : {}) };
  if (review) {
    // Bestellung bleibt wie sie ist, Martin entscheidet im Admin (Erstatten oder begründet ablehnen)
    await env.DB.prepare("UPDATE orders SET withdrawal=? WHERE id=?").bind(JSON.stringify(rec), o.id).run();
  } else {
    await env.DB.prepare("UPDATE orders SET status='withdrawn', withdrawn_at=?, withdrawal=? WHERE id=?").bind(now, JSON.stringify(rec), o.id).run();
    // Nicht gestartete Runde sperren (Codes funktionieren nicht mehr)
    if (s && !started) await env.DB.prepare("UPDATE sessions SET status='withdrawn' WHERE id=?").bind(s.id).run();
    if (soloTicket) await env.DB.prepare("UPDATE solo_tickets SET status='withdrawn' WHERE code=?").bind(soloTicket.code).run();
    if (fg && !started) await env.DB.prepare("UPDATE friends_groups SET status='withdrawn' WHERE id=?").bind(fg.id).run();
  }

  const when = vienna(now);
  // Leistung und Betrag wie bestellt: richtiger Fall bzw. Paket, Originalwährung, Zahlenformat je Sprache (Nachttest 15.10.2026)
  let ct = {}; try { ct = JSON.parse(o.contact || "{}"); } catch {}
  const cur = String(o.currency || "EUR").toUpperCase(), orig = cur !== "EUR" && o.amount_orig_cents != null;
  const betrag = new Intl.NumberFormat(en ? (cur === "USD" ? "en-US" : cur === "GBP" ? "en-GB" : "en-IE") : "de-AT", { style: "currency", currency: orig ? cur : "EUR" }).format((orig ? o.amount_orig_cents : o.amount_cents) / 100);
  const sc = solo ? (soloCaseList().find((c) => c.id === ct.produkt) || soloCaseList().find((c) => c.id === "solo-001")) : null;
  const PAKET = { basis: "Basic", premium: "Premium", plus: "Premium Plus" };
  const paket = PAKET[o.paket] || String(o.paket || "");
  // Friends: Fall aus der Runde bzw. der Bestellung (Nachttest 22.10. A-M1 – stand fest auf 001)
  const fid = (fg && fg.case_id) || (/^friends-\d{3}$/.test(String(ct.fall || ct.produkt || "")) ? String(ct.fall || ct.produkt) : "friends-001");
  const fde = friends ? (friendsCase(fid, "de") || friendsCase("friends-001", "de")) : null, fen = friends ? (friendsCase(fid, "en") || fde) : null;
  const fnr = fid.slice(-3);
  const leistung = friends ? T(`Mordsteam Friends ${fnr} „${fde.TITLE}“${o.paket === "friends-plus" ? " (Plus)" : ""}, ${o.teams} Personen, ${betrag}`, `Mordsteam Friends ${fnr} “${fen.TITLE}”${o.paket === "friends-plus" ? " (Plus)" : ""}, ${o.teams} people, ${betrag}`)
    : solo ? T(`Mordsteam ${sc.no} „${sc.title}“, ${betrag}`, `Mordsteam ${sc.no} “${sc.title_en}”, ${betrag}`)
    : T(`Mordsteam Teams, Paket ${paket}, ${o.teams} Team${o.teams === 1 ? "" : "s"}, ${betrag}`, `Mordsteam Teams, ${paket} package, ${o.teams} team${o.teams === 1 ? "" : "s"}, ${betrag}`);
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
<p>${review
    ? T(`Wir haben eure Erklärung erhalten und prüfen sie. ${pruef.map(esc).join(" ")} Wir melden uns innerhalb von 7 Tagen mit unserer Entscheidung. Bis dahin bleibt eure Bestellung unverändert.`, `We have received your declaration and are reviewing it. ${pruef.map(esc).join(" ")} We will get back to you with our decision within 7 days. Until then, your order remains unchanged.`)
    : started
    ? T("Die Spielrunde war beim Widerruf bereits gestartet. Wir erstatten den bezahlten Betrag abzüglich eines anteiligen Betrags für die bis dahin erbrachte Leistung (§ 16 FAGG, AGB Punkt 8) innerhalb von 14 Tagen über das ursprüngliche Zahlungsmittel.", "The game round had already been started when you withdrew. We will refund the amount paid, minus a proportionate amount for the service provided up to that point (§ 16 FAGG, terms section 8), within 14 days using the original means of payment.")
    : T("Die Spielrunde wurde noch nicht gestartet und ist ab sofort gesperrt. Wir erstatten den vollen Betrag innerhalb von 14 Tagen über das ursprüngliche Zahlungsmittel.", "The game round had not been started and is now locked. We will refund the full amount within 14 days using the original means of payment.")}</p>
<p>${T("Bei Fragen antwortet einfach auf diese E-Mail.", "If you have any questions, just reply to this email.")}<br>Mordsteam</p>
<p style="font-size:11.5px;color:#8A8D96">Mordsteam e.U. · ${T("Inhaber", "Owner")} Martin Kriegler · Sportplatzgasse 16, 7152 Pamhagen, ${T("Österreich", "Austria")} · FN 689638z · ${T("Firmenbuchgericht", "Register court")} Landesgericht Eisenstadt</p>
</div>`;
  const okCustomer = await send(env, email, T(`Bestätigung eures Widerrufs – Bestellung ${orderNo(o.id)}`, `Confirmation of your withdrawal – order ${orderNo(o.id)}`), html, OFFICE);
  await send(env, OFFICE, review ? `WIDERRUF PRÜFEN ${orderNo(o.id)} (${betrag})` : `WIDERRUF ${orderNo(o.id)} – ${started ? "gestartet, anteilig erstatten" : "voll erstatten"} (${betrag})`,
    `<p>Widerruf eingegangen am ${when}.</p>${review ? `<p><b>Prüfen:</b> ${pruef.map(esc).join(" ")}<br>Die Bestellung ist unverändert. Im Admin unter Bestellungen entscheiden: erstatten oder dem Kunden begründet antworten (innerhalb von 7 Tagen, so steht es in seiner Bestätigung).</p>` : ""}<p>Bestellung ${orderNo(o.id)} (${esc(o.id)}), ${esc(leistung)}<br>Name: ${esc(name)}, E-Mail: ${esc(email)}<br>Runde gestartet: ${started ? "ja → anteilig erstatten" : "nein → voll erstatten, Runde ist gesperrt"}${grund ? `<br>Anmerkung: ${esc(grund)}` : ""}</p><p><b>To do:</b> Erstattung in Stripe innerhalb von 14 Tagen (Zahlungen → Zahlung suchen → Erstatten).</p>`, email);
  return json({ ok: true, nr: orderNo(o.id), when, started, review, mail: okCustomer });
}

// Keine passende Bestellung: trotzdem annehmen, Eingang bestätigen (ohne Freitext, damit niemand fremde Mails verschicken kann)
// und Martin informieren. Höchstens 50 solcher Bestätigungen pro Tag.
async function unmatched(env, { nr, email, name, grund, en, T }) {
  const now = Date.now(), when = vienna(now);
  const tag = new Date(now).toLocaleDateString("sv-SE", { timeZone: "Europe/Vienna" });
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM withdraw_inbox WHERE at > ?").bind(now - DAY).first().catch(() => ({ n: 0 }));
  await env.DB.prepare("INSERT INTO withdraw_inbox (at, nr, email, name, grund, site) VALUES (?,?,?,?,?,?)").bind(now, nr, email, name, grund, en ? "en" : "de").run();
  let mail = false;
  if ((n?.n || 0) < 50) mail = await send(env, email, T("Eingang eures Widerrufs bei Mordsteam", "Receipt of your withdrawal at Mordsteam"),
    `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C;max-width:560px">
<div style="font-family:Georgia,serif;font-weight:900;font-size:22px;margin-bottom:10px"><span style="color:#B3261E">MORDS</span>TEAM</div>
<p>${T("Hallo,", "Hi,")}</p>
<p>${T(`wir bestätigen den Eingang eines Widerrufs am ${when} mit der Bestellnummer ${esc(nr)} und dieser E-Mail-Adresse. Wir konnten ihn noch keiner Bestellung zuordnen und prüfen das. Wir melden uns innerhalb von 7 Tagen.`, `we confirm receipt of a withdrawal on ${when} with the order number ${esc(nr)} and this email address. We could not yet match it to an order and are checking this. We will get back to you within 7 days.`)}</p>
<p>${T("Bei Fragen antwortet einfach auf diese E-Mail.", "If you have any questions, just reply to this email.")}<br>Mordsteam</p>
<p style="font-size:11.5px;color:#8A8D96">Mordsteam e.U. · Sportplatzgasse 16, 7152 Pamhagen, ${T("Österreich", "Austria")} · FN 689638z · Landesgericht Eisenstadt</p></div>`, OFFICE);
  await send(env, OFFICE, `WIDERRUF OHNE ZUORDNUNG – ${nr}`, `<p>Widerruf eingegangen am ${when}, keine Bestellung mit Nummer ${esc(nr)} und E-Mail ${esc(email)} gefunden.</p><p>Name: ${esc(name)}${grund ? `<br>Anmerkung: ${esc(grund)}` : ""}</p><p><b>To do:</b> In Stripe bzw. im Admin nach Name und E-Mail suchen und dem Kunden innerhalb von 7 Tagen antworten. Steht im Admin unter Bestellungen → „Widerrufe ohne Zuordnung“.</p>`, email);
  return json({ ok: true, unmatched: true, nr, when, mail });
}
