// Newsletter und Kundenauswertung
// - Anmeldung auf der Website mit Bestätigungsmail (Double-Opt-in), Abmeldung per Link
// - Kunden (bezahlte Bestellungen ohne „Bitte keine Neuigkeiten“) kommen über die Bestandskunden-Ausnahme
//   (§ 174 Abs. 4 TKG 2021) auf die Liste – vorher Abgleich mit der ECG-Liste der RTR
// - Übertragung in Resend (Contacts + Segmente „Mordsteam DE“ / „Mordsteam EN“), Versand als Broadcast
// - Newsletter-Kürzel (?nl=…) in Links: Besuche und Bestellungen je Newsletter
// - Kundenauswertung je E-Mail-Adresse (Wiederkäufe, Solo-Gutschein, Umsatz)
import { json, fail, randomToken } from "./game.js";
import { sendMail } from "./ops.js";
import { eurMissing, migrateAccounting } from "./accounting.js";
// Go-live-Test 5 (M19): £/$ ohne Euro-Betrag zählen erst nach der Auszahlung (wie die Finanzen) – bis dahin als „offen“
const eurC = (o) => (eurMissing(o) ? 0 : o.amount_cents || 0), openC = (o) => (eurMissing(o) ? 1 : 0);

const RESEND = (env) => env.RESEND_API_BASE || "https://api.resend.com";   // RESEND_API_BASE nur für lokale Tests
const PAID = "('paid','fulfilling','fulfilled')";
const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const normMail = (x) => String(x || "").trim().toLowerCase().slice(0, 200);
const validMail = (x) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x);
export const nlTag = (x) => { const s = String(x || "").trim().toLowerCase(); return /^[a-z0-9][a-z0-9-]{0,39}$/.test(s) ? s : ""; };

let ready = false;
export async function migrateNewsletter(env) {
  if (ready) return;
  for (const q of [
    // status: pending (Anmeldung unbestätigt) · active (darf Newsletter bekommen) · unsub (abgemeldet / widersprochen) · ecg (steht auf der ECG-Liste)
    "CREATE TABLE IF NOT EXISTS nl_contacts (email TEXT PRIMARY KEY, lang TEXT NOT NULL DEFAULT 'de', name TEXT, source TEXT NOT NULL, status TEXT NOT NULL, token TEXT NOT NULL, created_at INTEGER NOT NULL, confirmed_at INTEGER, consent TEXT, unsub_at INTEGER, synced_at INTEGER, sync_error TEXT)",
    "CREATE TABLE IF NOT EXISTS nl_ecg (h TEXT PRIMARY KEY, v INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS nl_settings (k TEXT PRIMARY KEY, v TEXT)",
    "CREATE TABLE IF NOT EXISTS nl_visits (tag TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, day))",
    "CREATE TABLE IF NOT EXISTS src_visits (src TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (src, day))",
    "CREATE TABLE IF NOT EXISTS nl_drafts (id TEXT PRIMARY KEY, tag TEXT NOT NULL, lang TEXT NOT NULL, subject TEXT NOT NULL, broadcast_id TEXT, created_at INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS nl_contacts_token ON nl_contacts (token)",
  ]) await env.DB.prepare(q).run();
  for (const q of ["ALTER TABLE orders ADD COLUMN promo_code TEXT", "ALTER TABLE orders ADD COLUMN discount_cents INTEGER"]) { try { await env.DB.prepare(q).run(); } catch {} }
  ready = true;
}
const setting = async (env, k) => (await env.DB.prepare("SELECT v FROM nl_settings WHERE k=?").bind(k).first())?.v ?? null;
const setSetting = (env, k, v) => env.DB.prepare("INSERT INTO nl_settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k, v == null ? null : String(v)).run();

// ---------- Resend ----------
async function resend(env, method, path, body) {
  if (!env.RESEND_API_KEY) { const e = new Error("RESEND_API_KEY fehlt."); e.code = "nokey"; throw e; }
  const r = await fetch(RESEND(env) + path, { method, headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 404) return null;
  if (!r.ok) {
    const e = new Error(r.status === 401 || r.status === 403
      ? "Resend lehnt den Zugriff ab. Der Schlüssel RESEND_API_KEY braucht „Full access“ (nicht nur „Sending access“), damit Kontakte und Newsletter angelegt werden können."
      : `Resend: ${d.message || d.name || r.status}`);
    e.code = r.status; throw e;
  }
  return d;
}
// Segment je Sprache: einmal in Resend anlegen, ID merken
async function segmentId(env, lang) {
  const k = `segment_${lang}`;
  let id = await setting(env, k);
  if (id) return id;
  const d = await resend(env, "POST", "/segments", { name: lang === "en" ? "Mordsteam EN" : "Mordsteam DE" });
  id = d && d.id;
  if (!id) throw new Error("Segment konnte in Resend nicht angelegt werden.");
  await setSetting(env, k, id);
  return id;
}

// ---------- ECG-Liste (RTR): Datei = aneinandergereihte SHA-1-Werte (20 Byte) von „adresse“ bzw. „@domain“ ----------
async function sha1hex(s) {
  const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
// Bevorzugt: Entwickler-Schnittstelle der RTR (Cloudflare-Secret ECG_API_KEY). Geprüft werden SHA-512 von Adresse und Domain (ohne @),
// beide in Kleinbuchstaben. Ist die Schnittstelle nicht erreichbar, wird ein Fehler geworfen – der Kontakt wird dann nicht übertragen.
async function ecgApi(env, e) {
  const sha512 = async (x) => [...new Uint8Array(await crypto.subtle.digest("SHA-512", new TextEncoder().encode(x)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hs = [await sha512(e), await sha512(e.slice(e.indexOf("@") + 1))];
  const r = await fetch((env.ECG_API_BASE || "https://ecg.rtr.at") + "/dev/api/v1/emails/check/batch", {
    method: "POST", headers: { "x-api-key": env.ECG_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ emails: hs, hashed: true, contained: true }),
  });
  if (!r.ok) throw new Error(`ECG-Schnittstelle der RTR: Fehler ${r.status}`);
  const d = await r.json().catch(() => null);
  if (!d || !Array.isArray(d.emails)) throw new Error("ECG-Schnittstelle der RTR: unerwartete Antwort");
  return d.emails.length > 0;
}
// Mehrere Adressen in wenigen Anfragen (je 500 Hashes): liefert die Menge der Adressen, die auf der ECG-Liste stehen
const sha512hex = async (x) => [...new Uint8Array(await crypto.subtle.digest("SHA-512", new TextEncoder().encode(x)))].map((b) => b.toString(16).padStart(2, "0")).join("");
async function ecgApiBatch(env, emails) {
  const pairs = [];
  for (const raw of emails) { const e = normMail(raw); const at = e.indexOf("@"); if (at < 1) continue; pairs.push([e, await sha512hex(e), await sha512hex(e.slice(at + 1))]); }
  const all = [...new Set(pairs.flatMap((p) => [p[1], p[2]]))];
  const hit = new Set();
  for (let i = 0; i < all.length; i += 500) {
    const r = await fetch((env.ECG_API_BASE || "https://ecg.rtr.at") + "/dev/api/v1/emails/check/batch", {
      method: "POST", headers: { "x-api-key": env.ECG_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ emails: all.slice(i, i + 500), hashed: true, contained: true }),
    });
    if (!r.ok) throw new Error(`ECG-Schnittstelle der RTR: Fehler ${r.status}`);
    const d = await r.json().catch(() => null);
    if (!d || !Array.isArray(d.emails)) throw new Error("ECG-Schnittstelle der RTR: unerwartete Antwort");
    for (const h of d.emails) hit.add(String(h).toLowerCase());
  }
  return new Set(pairs.filter((p) => hit.has(p[1]) || hit.has(p[2])).map((p) => p[0]));
}
export async function ecgListed(env, email) {
  const e = normMail(email); const at = e.indexOf("@"); if (at < 1) return false;
  if (env.ECG_API_KEY) return ecgApi(env, e);
  const v = Number(await setting(env, "ecg_version")) || 0; if (!v) return false;
  const hs = [await sha1hex(e), await sha1hex(e.slice(at))];
  const r = await env.DB.prepare("SELECT 1 AS x FROM nl_ecg WHERE v=? AND h IN (?, ?)").bind(v, hs[0], hs[1]).first();
  return !!r;
}
// Hochladen in Teilen: {phase:'start'} → {phase:'chunk', v, hashes:[hex…]} → {phase:'done', v, total}
export async function ecgUpload(env, b) {
  await migrateNewsletter(env);
  if (b.phase === "start") { const v = Date.now(); return { v }; }
  const v = Number(b.v); if (!v) throw Object.assign(new Error("Version fehlt."), { status: 400 });
  if (b.phase === "chunk") {
    const hs = (Array.isArray(b.hashes) ? b.hashes : []).filter((h) => /^[0-9a-f]{40}$/.test(h)).slice(0, 2000);
    const stmts = [];
    for (let i = 0; i < hs.length; i += 50) {
      const part = hs.slice(i, i + 50);
      stmts.push(env.DB.prepare(`INSERT OR IGNORE INTO nl_ecg (h, v) VALUES ${part.map(() => "(?, ?)").join(",")}`).bind(...part.flatMap((h) => [h, v])));
    }
    if (stmts.length) await env.DB.batch(stmts);
    return { ok: true, n: hs.length };
  }
  if (b.phase === "done") {
    const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM nl_ecg WHERE v=?").bind(v).first();
    if (!c || !c.n) throw Object.assign(new Error("Keine Einträge angekommen – Datei prüfen."), { status: 400 });
    await setSetting(env, "ecg_version", v);
    await setSetting(env, "ecg_count", c.n);
    await setSetting(env, "ecg_at", Date.now());
    await env.DB.prepare("DELETE FROM nl_ecg WHERE v<>?").bind(v).run();
    const removed = await ecgRecheck(env);
    return { ok: true, count: c.n, removed };
  }
  throw Object.assign(new Error("Unbekannter Schritt."), { status: 400 });
}
// Nach neuer Liste: Kunden-Kontakte, die jetzt auf der ECG-Liste stehen, aus Resend entfernen
// Bei der Schnittstelle: alle aktiven Kunden-Kontakte in einem Durchgang (vor jedem Newsletter-Entwurf und per Knopf im Admin)
export async function ecgRecheck(env) {
  await migrateNewsletter(env);
  const rows = (await env.DB.prepare("SELECT email FROM nl_contacts WHERE source='kunde' AND status='active'").all()).results;
  const listed = env.ECG_API_KEY ? await ecgApiBatch(env, rows.map((r) => r.email)) : null;
  let n = 0;
  for (const r of rows) {
    if (!(listed ? listed.has(normMail(r.email)) : await ecgListed(env, r.email))) continue;
    n++;
    await env.DB.prepare("UPDATE nl_contacts SET status='ecg', synced_at=NULL WHERE email=?").bind(r.email).run();
    try { await resend(env, "DELETE", `/contacts/${encodeURIComponent(r.email)}`); } catch {}
  }
  if (env.ECG_API_KEY) { await setSetting(env, "ecg_check_at", Date.now()); await setSetting(env, "ecg_check_n", rows.length); await setSetting(env, "ecg_check_removed", n); }
  return n;
}
// Admin: Abgleich jetzt (optional mit einer Testadresse, die nur geprüft und nicht gespeichert wird)
export async function ecgCheckNow(env, b = {}) {
  if (!env.ECG_API_KEY) throw Object.assign(new Error("Secret ECG_API_KEY fehlt."), { status: 400 });
  const test = normMail(b.test || "");
  if (test) { if (!validMail(test)) throw Object.assign(new Error("Testadresse ungültig."), { status: 400 }); return { test, listed: (await ecgApiBatch(env, [test])).has(test) }; }
  const removed = await ecgRecheck(env);
  return { ok: true, checked: Number(await setting(env, "ecg_check_n")) || 0, removed };
}

// ---------- Kunden nach dem Kauf ----------
// Wird nach jeder erfolgreich angelegten Bestellung aufgerufen. Fehler blockieren die Bestellung nie.
export async function nlAfterOrder(env, order) {
  try {
    await migrateNewsletter(env);
    const ct = JSON.parse(order.contact || "{}");
    const email = normMail(ct.email); if (!validMail(email)) return;
    const lang = ct.lang === "en" ? "en" : "de", now = Date.now();
    const row = await env.DB.prepare("SELECT * FROM nl_contacts WHERE email=?").bind(email).first();
    if (ct.no_news) {
      // Widerspruch bei dieser Bestellung gilt auch für frühere Zustimmungen
      if (row && row.status !== "unsub") {
        await env.DB.prepare("UPDATE nl_contacts SET status='unsub', unsub_at=? WHERE email=?").bind(now, email).run();
        try { await resend(env, "PATCH", `/contacts/${encodeURIComponent(email)}`, { unsubscribed: true }); } catch {}
      }
      return;
    }
    if (row && (row.status === "unsub" || row.status === "active")) return;   // abgemeldet bleibt abgemeldet; aktiv bleibt aktiv
    if (row && row.status === "pending") {
      await env.DB.prepare("UPDATE nl_contacts SET status='active', source='kunde', confirmed_at=? WHERE email=?").bind(now, email).run();
    } else if (row && row.status === "ecg") {
      if (await ecgListed(env, email)) return;
      await env.DB.prepare("UPDATE nl_contacts SET status='active' WHERE email=?").bind(email).run();
    } else if (!row) {
      const st = (await ecgListed(env, email)) ? "ecg" : "active";
      await env.DB.prepare("INSERT INTO nl_contacts (email, lang, name, source, status, token, created_at, confirmed_at) VALUES (?,?,?,?,?,?,?,?)")
        .bind(email, lang, String(ct.name || "").slice(0, 80), "kunde", st, randomToken(16), now, now).run();
      if (st === "ecg") return;
    }
    await syncOne(env, email);
  } catch { /* Newsletter darf eine Bestellung nie stören */ }
}

// Einen Kontakt nach Resend übertragen (anlegen oder ins Segment aufnehmen). Abgemeldete bleiben abgemeldet.
async function syncOne(env, email) {
  const c = await env.DB.prepare("SELECT * FROM nl_contacts WHERE email=?").bind(email).first();
  if (!c || c.status !== "active") return "skip";
  if (c.source === "kunde" && (await ecgListed(env, email))) {
    await env.DB.prepare("UPDATE nl_contacts SET status='ecg' WHERE email=?").bind(email).run();
    return "ecg";
  }
  try {
    const seg = await segmentId(env, c.lang === "en" ? "en" : "de");
    const ex = await resend(env, "GET", `/contacts/${encodeURIComponent(email)}`);
    // Wer sich nach einer Abmeldung selbst neu anmeldet und per Mail bestätigt (Double-Opt-in), wird in Resend wieder angemeldet.
    // Erkennbar daran: Quelle Anmeldung, bestätigt, seither nicht abgemeldet und noch nicht übertragen.
    const resub = c.source === "anmeldung" && c.confirmed_at && !c.unsub_at && !c.synced_at;
    if (ex && ex.unsubscribed && resub) await resend(env, "PATCH", `/contacts/${encodeURIComponent(email)}`, { unsubscribed: false });
    else if (ex && ex.unsubscribed) {
      await env.DB.prepare("UPDATE nl_contacts SET status='unsub', unsub_at=?, synced_at=?, sync_error=NULL WHERE email=?").bind(Date.now(), Date.now(), email).run();
      return "unsub";
    }
    if (ex) await resend(env, "POST", `/contacts/${encodeURIComponent(email)}/segments/${seg}`);
    else await resend(env, "POST", "/contacts", { email, first_name: (c.name || "").split(" ")[0] || undefined, unsubscribed: false, segments: [{ id: seg }] });
    await env.DB.prepare("UPDATE nl_contacts SET synced_at=?, sync_error=NULL WHERE email=?").bind(Date.now(), email).run();
    return "ok";
  } catch (e) {
    await env.DB.prepare("UPDATE nl_contacts SET sync_error=? WHERE email=?").bind(String(e.message).slice(0, 300), email).run();
    throw e;
  }
}
// Admin: alle bezahlten Kunden ohne Widerspruch nachtragen und alles Offene übertragen
export async function syncAll(env) {
  await migrateNewsletter(env);
  const orders = (await env.DB.prepare(`SELECT id, contact FROM orders WHERE status IN ${PAID} ORDER BY paid_at`).all()).results;
  for (const o of orders) await nlAfterOrderLocal(env, o);
  const todo = (await env.DB.prepare("SELECT email FROM nl_contacts WHERE status='active' AND synced_at IS NULL LIMIT 200").all()).results;
  const out = { ok: 0, ecg: 0, unsub: 0, errors: 0, error: null };
  for (const r of todo) {
    try { const s = await syncOne(env, r.email); if (out[s] != null) out[s]++; }
    catch (e) { out.errors++; out.error = e.message; if (e.code === 401 || e.code === 403 || e.code === "nokey") break; }
  }
  return out;
}
// wie nlAfterOrder, aber ohne sofortige Übertragung (die macht syncAll gesammelt)
async function nlAfterOrderLocal(env, order) {
  const ct = JSON.parse(order.contact || "{}");
  const email = normMail(ct.email); if (!validMail(email)) return;
  const row = await env.DB.prepare("SELECT status FROM nl_contacts WHERE email=?").bind(email).first();
  if (ct.no_news) { if (row && row.status !== "unsub") await env.DB.prepare("UPDATE nl_contacts SET status='unsub', unsub_at=? WHERE email=?").bind(Date.now(), email).run(); return; }
  if (row) return;
  const st = (await ecgListed(env, email)) ? "ecg" : "active";
  await env.DB.prepare("INSERT INTO nl_contacts (email, lang, name, source, status, token, created_at, confirmed_at) VALUES (?,?,?,?,?,?,?,?)")
    .bind(email, ct.lang === "en" ? "en" : "de", String(ct.name || "").slice(0, 80), "kunde", st, randomToken(16), Date.now(), Date.now()).run();
}

// ---------- Anmeldung auf der Website (Double-Opt-in) ----------
const CONSENT = {
  de: "Ja, schickt mir Neuigkeiten zu neuen Mordsteam-Fällen per E-Mail. Abmelden geht jederzeit mit einem Klick.",
  en: "Yes, send me news about new Mordsteam cases by email. I can unsubscribe at any time with one click.",
};
async function ipHash(request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("mordsteam-newsletter:" + ip));
  return [...new Uint8Array(d)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join("");
}
export async function nlSignup(request, env) {
  await migrateNewsletter(env);
  let b = {}; try { b = await request.json(); } catch {}
  const en = b.lang === "en", T = (de, e) => (en ? e : de);
  if (b.website) return json({ ok: true });                                        // Honeypot
  if (!Number(b.t) || Date.now() - Number(b.t) < 2000) return fail(T("Bitte einen Moment warten und dann nochmal senden.", "Please wait a moment and try again."));
  const email = normMail(b.email);
  if (!validMail(email)) return fail(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."));
  if (!b.consent) return fail(T("Bitte bestätigen, dass du Neuigkeiten per E-Mail bekommen möchtest.", "Please confirm that you would like to receive news by email."));
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return fail(T("Die Anmeldung ist gerade nicht möglich. Bitte versuch es später nochmal.", "Signing up is not possible right now. Please try again later."), 503);
  // Limit: 5 Anmeldungen pro Stunde und Anschluss
  const h = await ipHash(request), now = Date.now();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS contact_log (ip TEXT NOT NULL, at INTEGER NOT NULL)").run();
  await env.DB.prepare("DELETE FROM contact_log WHERE at < ?").bind(now - 86400000).run();
  const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM contact_log WHERE ip=? AND at > ?").bind(h, now - 3600000).first();
  if (c && c.n >= 5) return fail(T("Zu viele Anmeldungen von diesem Anschluss. Bitte später nochmal versuchen.", "Too many sign-ups from this connection. Please try again later."), 429);
  await env.DB.prepare("INSERT INTO contact_log (ip, at) VALUES (?, ?)").bind(h, now).run();

  const lang = en ? "en" : "de";
  const row = await env.DB.prepare("SELECT * FROM nl_contacts WHERE email=?").bind(email).first();
  if (row && row.status === "active") {
    // schon dabei – keine Auskunft, ob die Adresse bekannt ist. Außer: über den Link im Newsletter bei Resend abgemeldet → normale Neuanmeldung
    let ex = null; try { ex = await resend(env, "GET", `/contacts/${encodeURIComponent(email)}`); } catch {}
    if (!(ex && ex.unsubscribed)) {
      // Go-live-Test 5 (M18): kurze Info an genau diese Adresse (höchstens 1 pro Tag) – die Seite antwortet wie bei einer Neuanmeldung, Dritte erfahren nichts
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS nl_info (email TEXT PRIMARY KEY, at INTEGER NOT NULL)").run();
      const last = await env.DB.prepare("SELECT at FROM nl_info WHERE email=?").bind(email).first();
      if (!last || last.at < now - 86400000) {
        await env.DB.prepare("INSERT INTO nl_info (email, at) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET at=excluded.at").bind(email, now).run();
        const html = mailFrame(lang, `<p style="font-size:20px;font-weight:bold;margin:0 0 12px">${T("Du bist schon dabei!", "You're already signed up!")}</p>
<p>${T("Du bekommst die Neuigkeiten von Mordsteam schon – nichts weiter zu tun.", "You already receive news from Mordsteam – nothing else to do.")}</p>
<p style="font-size:13px;color:#5A5D66">${T("Abmelden kannst du dich jederzeit über den Link in jedem Newsletter.", "You can unsubscribe at any time via the link in every newsletter.")}</p>`);
        await sendMail(env, "newsletter", { to: [email], subject: T("Du bist schon angemeldet – Mordsteam", "You're already signed up – Mordsteam"), html,
          text: `${T("Du bekommst die Neuigkeiten von Mordsteam schon – nichts weiter zu tun. Abmelden kannst du dich jederzeit über den Link in jedem Newsletter.", "You already receive news from Mordsteam – nothing else to do. You can unsubscribe at any time via the link in every newsletter.")}` });
      }
      return json({ ok: true });
    }
  }
  const token = randomToken(16);
  const consent = JSON.stringify({ text: CONSENT[lang], at: new Date(now).toISOString(), page: String(b.page || "").slice(0, 120) });
  if (row) await env.DB.prepare("UPDATE nl_contacts SET status='pending', source='anmeldung', lang=?, token=?, consent=?, unsub_at=NULL WHERE email=?").bind(lang, token, consent, email).run();
  else await env.DB.prepare("INSERT INTO nl_contacts (email, lang, source, status, token, created_at, consent) VALUES (?,?,?,?,?,?,?)").bind(email, lang, "anmeldung", "pending", token, now, consent).run();
  const origin = new URL(request.url).origin, link = `${origin}/api/shop/newsletter/bestaetigen?t=${token}${lang === "en" ? "&l=en" : ""}`;
  const html = mailFrame(lang, `<p style="font-size:20px;font-weight:bold;margin:0 0 12px">${T("Fast geschafft!", "Almost done!")}</p>
<p>${T("Bitte bestätige deine Anmeldung für die Neuigkeiten von Mordsteam:", "Please confirm your sign-up for news from Mordsteam:")}</p>
<p style="margin:22px 0"><a href="${link}" style="background:#B3261E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;display:inline-block">${T("Anmeldung bestätigen", "Confirm sign-up")}</a></p>
<p style="font-size:13px;color:#5A5D66">${T("Du hast dich nicht angemeldet? Dann ignoriere diese Mail einfach – ohne Bestätigung bekommst du nichts von uns.", "Didn't sign up? Just ignore this email – without confirmation you won't hear from us.")}</p>`, false);
  const ok = await sendMail(env, "newsletter", { to: [email], subject: T("Bitte bestätige deine Anmeldung – Mordsteam", "Please confirm your sign-up – Mordsteam"), html,
    text: `${T("Bitte bestätige deine Anmeldung für die Neuigkeiten von Mordsteam:", "Please confirm your sign-up for news from Mordsteam:")}\n${link}` });
  if (!ok) return fail(T("Die Bestätigungsmail konnte nicht gesendet werden. Bitte später nochmal versuchen.", "The confirmation email could not be sent. Please try again later."), 502);
  return json({ ok: true });
}
export async function nlConfirm(request, env) {
  await migrateNewsletter(env);
  const u = new URL(request.url), t = String(u.searchParams.get("t") || "");
  const row = t && (await env.DB.prepare("SELECT * FROM nl_contacts WHERE token=?").bind(t).first());
  const page = (lang, s) => Response.redirect(`${u.origin}${lang === "en" ? "/en/newsletter.html" : "/newsletter.html"}?s=${s}`, 302);
  if (!row) return page(u.searchParams.get("l") === "en" ? "en" : "de", "ungueltig");   // Sprache aus dem Link (Go-live-Test 5, N7i)
  if (row.status === "pending") {
    const consent = JSON.parse(row.consent || "{}"); consent.confirmed = new Date().toISOString();
    await env.DB.prepare("UPDATE nl_contacts SET status='active', confirmed_at=?, consent=?, synced_at=NULL WHERE email=?").bind(Date.now(), JSON.stringify(consent), row.email).run();
    try { await syncOne(env, row.email); } catch {}
  }
  return page(row.lang, row.status === "unsub" ? "abgemeldet" : "bestaetigt");
}
export async function nlUnsubscribe(request, env) {
  await migrateNewsletter(env);
  const u = new URL(request.url), t = String(u.searchParams.get("t") || "");
  const row = t && (await env.DB.prepare("SELECT * FROM nl_contacts WHERE token=?").bind(t).first());
  if (!row) return Response.redirect(`${u.origin}/newsletter.html?s=ungueltig`, 302);
  await env.DB.prepare("UPDATE nl_contacts SET status='unsub', unsub_at=? WHERE email=?").bind(Date.now(), row.email).run();
  try { await resend(env, "PATCH", `/contacts/${encodeURIComponent(row.email)}`, { unsubscribed: true }); } catch {}
  return Response.redirect(`${u.origin}${row.lang === "en" ? "/en/newsletter.html" : "/newsletter.html"}?s=abgemeldet`, 302);
}
// Besuch über einen Newsletter-Link zählen (nur Kürzel und Tag, keine Personendaten)
export async function nlVisit(request, env) {
  await migrateNewsletter(env);
  const tag = nlTag(new URL(request.url).searchParams.get("nl"));
  if (tag) {
    const day = new Date().toISOString().slice(0, 10);
    await env.DB.prepare("INSERT INTO nl_visits (tag, day, n) VALUES (?, ?, 1) ON CONFLICT(tag, day) DO UPDATE SET n=n+1").bind(tag, day).run();
  }
  return new Response(null, { status: 204 });
}

// Besuch über Werbung zählen (nur Kürzel und Tag, keine Personendaten)
export async function srcVisit(request, env) {
  await migrateNewsletter(env);
  const src = nlTag(new URL(request.url).searchParams.get("src"));
  if (src) {
    const day = new Date().toISOString().slice(0, 10);
    await env.DB.prepare("INSERT INTO src_visits (src, day, n) VALUES (?, ?, 1) ON CONFLICT(src, day) DO UPDATE SET n=n+1").bind(src, day).run();
  }
  return new Response(null, { status: 204 });
}

// ---------- Mailrahmen (Bestätigungsmail und Newsletter) ----------
function mailFrame(lang, inner, newsletter, preheader = "") {
  const en = lang === "en";
  const foot = newsletter
    ? (en ? `You are receiving this newsletter from Mordsteam because you ordered from us or signed up.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#5A5D66">Unsubscribe</a> · ` : `Du bekommst diesen Newsletter von Mordsteam, weil du bei uns bestellt oder dich angemeldet hast.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#5A5D66">Abmelden</a> · `)
    : "";
  return `<div style="background:#F3EFE6;padding:24px 12px"><div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<div style="max-width:560px;margin:0 auto;background:#FFFDF8;border:1px solid #DDD5C4;border-radius:10px;padding:26px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#15171C">
<div style="font-family:Georgia,serif;font-weight:900;font-size:28px;letter-spacing:.5px;margin-bottom:${newsletter ? 2 : 14}px"><span style="color:#B3261E">MORDS</span><span style="color:#15171C">TEAM</span></div>
${newsletter ? `<div style="font-family:monospace;font-size:11px;letter-spacing:2px;color:#B3261E;margin-bottom:16px">NEWSLETTER</div>` : ""}
${inner}
<p style="font-size:12px;color:#5A5D66;border-top:1px solid #DDD5C4;padding-top:12px;margin-top:24px">${foot}Mordsteam e.U. · ${en ? "Owner" : "Inhaber"} Martin Kriegler · Sportplatzgasse 16, 7152 Pamhagen, ${en ? "Austria" : "Österreich"} · FN 689638z, ${en ? "register court" : "Landesgericht"} ${en ? "Landesgericht Eisenstadt" : "Eisenstadt"} · <a href="mailto:office@mordsteam.com" style="color:#5A5D66">office@mordsteam.com</a> · <a href="https://mordsteam.com/${en ? "en/imprint.html" : "impressum.html"}" style="color:#5A5D66">${en ? "Imprint" : "Impressum"}</a></p>
</div></div>`;
}
// Text mit einfachen Regeln: Leerzeile = neuer Absatz, „- “ = Aufzählung, [Text](https://…) = Link, **fett**
function textToHtml(src, tag) {
  const link = (url) => { try { const u = new URL(url); if (/(^|\.)mordsteam\.com$/.test(u.hostname) && tag) u.searchParams.set("nl", tag); return u.toString(); } catch { return "#"; } };
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, t, u) => `<a href="${esc(link(u.replace(/&amp;/g, "&")))}" style="color:#B3261E">${t}</a>`);
  return String(src || "").replace(/\r\n/g, "\n").split(/\n{2,}/).map((block) => {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length && lines.every((l) => /^\s*[-•]\s+/.test(l))) return `<ul style="padding-left:20px;margin:0 0 14px">${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ""))}</li>`).join("")}</ul>`;
    return lines.length ? `<p style="margin:0 0 14px">${lines.map(inline).join("<br>")}</p>` : "";
  }).join("");
}
export function newsletterHtml(d) {
  const tag = nlTag(d.tag), lang = d.lang === "en" ? "en" : "de";
  let cta = "";
  if (d.button && d.button_url) {
    let u = "#"; try { const x = new URL(d.button_url); if (/(^|\.)mordsteam\.com$/.test(x.hostname) && tag) x.searchParams.set("nl", tag); u = x.toString(); } catch {}
    cta = `<p style="margin:22px 0"><a href="${esc(u)}" style="background:#B3261E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;display:inline-block">${esc(d.button)}</a></p>`;
  }
  const head = d.headline ? `<p style="font-family:Georgia,serif;font-size:24px;font-weight:bold;line-height:1.25;margin:0 0 14px">${esc(d.headline)}</p>` : "";
  return mailFrame(lang, head + textToHtml(d.text, tag) + cta, true, d.preheader || "");
}
// Abmeldungen aus Resend übernehmen (Abmeldelink in Newsletter-Mails läuft über Resend und meldet uns nichts).
// Läuft beim Laden des Admins und vor jedem Entwurf, höchstens einmal pro Minute. Nur Kontakte, die schon übertragen wurden –
// wer sich gerade neu angemeldet und bestätigt hat (synced_at leer), wird beim Übertragen wieder angemeldet.
export async function pullUnsubs(env, force = false) {
  await migrateNewsletter(env);
  if (!env.RESEND_API_KEY) return { skipped: true };
  const last = Number(await setting(env, "pull_at")) || 0;
  if (!force && Date.now() - last < 60000) return { skipped: true };
  await setSetting(env, "pull_at", Date.now());
  const unsub = new Set();
  let listed = false;
  try {
    let after = "", pages = 0;
    do {
      const d = await resend(env, "GET", `/contacts?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`);
      if (!d || !Array.isArray(d.data)) break;
      listed = true;
      for (const c of d.data) if (c.unsubscribed && c.email) unsub.add(normMail(c.email));
      after = d.has_more && d.data.length ? d.data[d.data.length - 1].id : "";
    } while (after && ++pages < 50);
  } catch (e) { if (e.code === 401 || e.code === 403 || e.code === "nokey") { await setSetting(env, "pull_error", e.message); throw e; } }
  if (!listed) {
    // Ersatz, falls die Liste nicht abrufbar ist: einzeln nachfragen (Resend erlaubt nur wenige Aufrufe pro Sekunde)
    const rows = (await env.DB.prepare("SELECT email FROM nl_contacts WHERE status='active' AND synced_at IS NOT NULL ORDER BY synced_at LIMIT 20").all()).results;
    for (const r of rows) { const c = await resend(env, "GET", `/contacts/${encodeURIComponent(r.email)}`); if (c && c.unsubscribed) unsub.add(r.email); }
  }
  let removed = 0;
  for (const email of unsub) {
    const r = await env.DB.prepare("UPDATE nl_contacts SET status='unsub', unsub_at=? WHERE email=? AND status='active' AND synced_at IS NOT NULL").bind(Date.now(), email).run();
    removed += r.meta?.changes || 0;
  }
  await setSetting(env, "pull_removed", removed);
  await setSetting(env, "pull_error", null);
  return { ok: true, removed };
}
export async function nlDraft(env, b) {
  await migrateNewsletter(env);
  const tag = nlTag(b.tag), lang = b.lang === "en" ? "en" : "de";
  if (!tag) throw Object.assign(new Error("Bitte ein Kürzel angeben (z. B. 2026-12): Kleinbuchstaben, Ziffern, Bindestrich."), { status: 400 });
  const subject = String(b.subject || "").trim().slice(0, 150);
  if (!subject) throw Object.assign(new Error("Bitte einen Betreff angeben."), { status: 400 });
  if (String(b.text || "").trim().length < 20) throw Object.assign(new Error("Bitte einen Text schreiben."), { status: 400 });
  const html = newsletterHtml({ ...b, tag, lang });
  if (b.preview) return { html };
  // Vor jedem Newsletter: alle Kunden-Kontakte neu gegen die ECG-Liste prüfen – schlägt das fehl, wird kein Entwurf angelegt
  let ecgRemoved = 0;
  if (env.ECG_API_KEY) {
    try { ecgRemoved = await ecgRecheck(env); }
    catch (e) { throw Object.assign(new Error(`ECG-Abgleich fehlgeschlagen (${e.message}) – Entwurf nicht angelegt. Bitte später noch einmal versuchen.`), { status: 502 }); }
  } else {
    // Ohne Schlüssel nur mit hochgeladener ECG-Liste, die höchstens 30 Tage alt ist (Go-live-Test 4, M17)
    const v = Number(await setting(env, "ecg_version")) || 0;
    if (!v || Date.now() - v > 30 * 86400000) throw Object.assign(new Error("ECG-Abgleich nicht möglich: Schlüssel ECG_API_KEY fehlt und keine aktuelle ECG-Liste (höchstens 30 Tage alt) hochgeladen. Entwurf nicht angelegt."), { status: 409 });
  }
  try { await pullUnsubs(env, true); } catch {}
  const seg = await segmentId(env, lang);
  const d = await resend(env, "POST", "/broadcasts", {
    segment_id: seg, from: env.MAIL_FROM, reply_to: "office@mordsteam.com", subject, html,
    name: `Newsletter ${tag} (${lang.toUpperCase()})`,
  });
  const id = randomToken(8);
  await env.DB.prepare("INSERT INTO nl_drafts (id, tag, lang, subject, broadcast_id, created_at) VALUES (?,?,?,?,?,?)").bind(id, tag, lang, subject, d && d.id, Date.now()).run();
  return { ok: true, broadcast_id: d && d.id, html, ecg_removed: ecgRemoved };
}

// ---------- Admin-Übersicht: Newsletter ----------
export async function nlAdmin(env) {
  await migrateNewsletter(env);
  await migrateAccounting(env);   // Spalten currency/eur_ok auch in frischen Datenbanken
  try { await pullUnsubs(env); } catch (e) { await setSetting(env, "pull_error", String(e.message).slice(0, 200)); }
  const counts = (await env.DB.prepare("SELECT source, status, COUNT(*) AS n, SUM(CASE WHEN synced_at IS NOT NULL THEN 1 ELSE 0 END) AS synced FROM nl_contacts GROUP BY source, status").all()).results;
  const errors = (await env.DB.prepare("SELECT email, sync_error FROM nl_contacts WHERE sync_error IS NOT NULL ORDER BY created_at DESC LIMIT 5").all()).results;
  const drafts = (await env.DB.prepare("SELECT tag, lang, subject, broadcast_id, created_at FROM nl_drafts ORDER BY created_at DESC LIMIT 20").all()).results;
  const visits = (await env.DB.prepare("SELECT tag, SUM(n) AS n FROM nl_visits GROUP BY tag").all()).results;
  // Bestellungen je Newsletter-Kürzel
  const rows = (await env.DB.prepare(`SELECT contact, amount_cents, currency, eur_ok FROM orders WHERE status IN ${PAID}`).all()).results;
  const per = {};
  for (const o of rows) { let ct = {}; try { ct = JSON.parse(o.contact || "{}"); } catch {} const t = nlTag(ct.nl); if (!t) continue; (per[t] ||= { orders: 0, cents: 0, open: 0 }); per[t].orders++; per[t].cents += eurC(o); per[t].open += openC(o); }
  // Anmeldungen über die Website (10.10.2026): Liste mit Status, auch ohne Kauf; Käufer = bezahlte Bestellung mit derselben Adresse
  const buyers = new Set(rows.map((o) => { try { return String(JSON.parse(o.contact || "{}").email || "").trim().toLowerCase(); } catch { return ""; } }).filter(Boolean));
  const signups = (await env.DB.prepare("SELECT email, lang, status, created_at, confirmed_at, unsub_at, synced_at, sync_error FROM nl_contacts WHERE source='anmeldung' ORDER BY created_at DESC LIMIT 300").all()).results
    .map((r) => ({ ...r, buyer: buyers.has(String(r.email).toLowerCase()) }));
  const tags = [...new Set([...drafts.map((d) => d.tag), ...visits.map((v) => v.tag), ...Object.keys(per)])].sort().reverse()
    .map((t) => ({ tag: t, visits: (visits.find((v) => v.tag === t) || {}).n || 0, orders: (per[t] || {}).orders || 0, cents: (per[t] || {}).cents || 0, open: (per[t] || {}).open || 0 }));
  return {
    counts, errors, drafts, tags, signups,
    ecg: { api: !!env.ECG_API_KEY, count: Number(await setting(env, "ecg_count")) || 0, at: Number(await setting(env, "ecg_at")) || null,
      check_at: Number(await setting(env, "ecg_check_at")) || null, check_n: Number(await setting(env, "ecg_check_n")) || 0, check_removed: Number(await setting(env, "ecg_check_removed")) || 0 },
    segments: { de: await setting(env, "segment_de"), en: await setting(env, "segment_en") },
    key: !!env.RESEND_API_KEY, from: env.MAIL_FROM || null,
    pull: { at: Number(await setting(env, "pull_at")) || null, removed: Number(await setting(env, "pull_removed")) || 0, error: await setting(env, "pull_error") },
  };
}

// Werbung: Besuche, Bestellungen und Umsatz je Herkunft (gesamt und letzte 30 Tage)
async function sourcesOf(env, rows) {
  const since = Date.now() - 30 * 86400000, day30 = new Date(since).toISOString().slice(0, 10);
  const vis = (await env.DB.prepare("SELECT src, SUM(n) AS n, SUM(CASE WHEN day >= ? THEN n ELSE 0 END) AS n30 FROM src_visits GROUP BY src").bind(day30).all()).results;
  const per = {};
  for (const o of rows) {
    let ct = {}; try { ct = JSON.parse(o.contact || "{}"); } catch {}
    const s = nlTag(ct.src); if (!s) continue;
    const x = (per[s] ||= { orders: 0, cents: 0, orders30: 0, cents30: 0, open: 0 });
    x.orders++; x.cents += eurC(o); x.open += openC(o);
    if ((o.paid_at || o.created_at) >= since) { x.orders30++; x.cents30 += eurC(o); }
  }
  return [...new Set([...vis.map((v) => v.src), ...Object.keys(per)])].sort().map((s) => {
    const v = vis.find((x) => x.src === s) || {}, p = per[s] || {};
    return { src: s, visits: v.n || 0, visits30: v.n30 || 0, orders: p.orders || 0, cents: p.cents || 0, orders30: p.orders30 || 0, cents30: p.cents30 || 0, open: p.open || 0 };
  });
}

// ---------- Kundenauswertung ----------
export async function customers(env) {
  await migrateNewsletter(env);
  const rows = (await env.DB.prepare(`SELECT id, paket, amount_cents, currency, eur_ok, contact, paid_at, created_at, promo_code FROM orders WHERE status IN ${PAID} ORDER BY COALESCE(paid_at, created_at)`).all()).results;
  let vouchers = new Map();
  try { vouchers = new Map((await env.DB.prepare("SELECT voucher, order_id FROM solo_tickets WHERE voucher IS NOT NULL").all()).results.map((r) => [String(r.voucher).toUpperCase(), r.order_id])); } catch {}
  const orderMail = new Map();
  const prod = (p) => (p === "solo" ? "solo" : String(p).startsWith("friends") ? "friends" : "teams");
  const by = new Map();
  for (const o of rows) {
    let ct = {}; try { ct = JSON.parse(o.contact || "{}"); } catch {}
    const email = normMail(ct.email); if (!email) continue;
    orderMail.set(o.id, email);
    const at = o.paid_at || o.created_at;
    const c = by.get(email) || { email, name: ct.name || "", kunde: ct.kunde || "", lang: ct.lang || "de", orders: 0, cents: 0, first: at, last: at, products: { teams: 0, friends: 0, solo: 0 }, firstProduct: prod(o.paket), times: [], voucher: 0, nl: 0, open: 0 };
    c.orders++; c.cents += eurC(o); c.open += openC(o); c.last = at; c.products[prod(o.paket)]++; c.times.push(at);
    if (o.promo_code && vouchers.has(String(o.promo_code).toUpperCase())) c.voucher++;
    if (nlTag(ct.nl)) c.nl++;
    if (ct.name) c.name = ct.name;
    by.set(email, c);
  }
  const status = new Map((await env.DB.prepare("SELECT email, status FROM nl_contacts").all()).results.map((r) => [r.email, r.status]));
  const list = [...by.values()];
  const repeat = list.filter((c) => c.orders > 1);
  const gaps = repeat.map((c) => (c.times[1] - c.times[0]) / 86400000);
  // Solo-Gutschein: eingelöst bei Friends/Teams, und ob vom selben Kunden
  let vUsed = 0, vSame = 0;
  for (const o of rows) {
    if (!o.promo_code || !vouchers.has(String(o.promo_code).toUpperCase())) continue;
    vUsed++;
    const src = orderMail.get(vouchers.get(String(o.promo_code).toUpperCase()));
    if (src && src === orderMail.get(o.id)) vSame++;
  }
  const soloFirst = list.filter((c) => c.firstProduct === "solo");
  const soloUp = soloFirst.filter((c) => c.products.friends + c.products.teams > 0);
  const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  return {
    kpi: {
      customers: list.length, orders: rows.length, cents: rows.reduce((s, o) => s + eurC(o), 0), open: rows.reduce((s, o) => s + openC(o), 0),
      repeat: repeat.length, repeat_rate: list.length ? repeat.length / list.length : 0,
      days_to_second: median(gaps), solo_first: soloFirst.length, solo_up: soloUp.length,
      voucher_used: vUsed, voucher_same: vSame,
      nl_orders: rows.filter((o) => { try { return !!nlTag(JSON.parse(o.contact || "{}").nl); } catch { return false; } }).length,
    },
    sources: await sourcesOf(env, rows),
    list: list.sort((a, b) => b.last - a.last).slice(0, 300).map(({ times, ...c }) => ({ ...c, news: status.get(c.email) || "–" })),
  };
}
