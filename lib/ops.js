// Betrieb & Kapazität: Mails, KI-Verbrauch, Aufrufe und Fehler mitzählen – und rechtzeitig warnen.
// Gespeichert werden nur Zähler und Metadaten (Art, Zeit, Ergebnis) – keine Empfänger, keine Inhalte.
//
// Umgebungsvariablen (alle optional):
//   KI_BUDGET_USD=20          Monatsbudget für die Claude-API; Warnung bei 70 %
//   MAIL_LIMIT_DAY=100        Tageslimit des Mail-Tarifs (Resend Free: 100, Pro: kein Tageslimit → 0)
//   MAIL_LIMIT_MONTH=3000     Monatslimit (Resend Free 3.000, Pro 50.000)
//   REQ_LIMIT_DAY=100000      Aufruflimit pro Tag (Workers Free: 100.000; mit Workers Paid 0 = kein Tageslimit)
//   ALERT_TO=office@mordsteam.com
import { viennaDate } from "./game.js";

// Preise Claude Haiku 4.5 in USD pro Million Token
export const AI_PRICE = { input: 1, output: 5, cache_write: 1.25, cache_read: 0.1 };
const WARN = 0.7;

const num = (v, d) => { const n = Number(v); return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : d; };
export function limits(env) {
  return {
    mail_day: num(env.MAIL_LIMIT_DAY, 100),
    mail_month: num(env.MAIL_LIMIT_MONTH, 3000),
    req_day: num(env.REQ_LIMIT_DAY, 100000),
    ai_budget: num(env.KI_BUDGET_USD, 20),
  };
}
const month = (day) => day.slice(0, 7);

let ready = false;
export async function migrateOps(env) {
  if (ready || !env.DB) return;
  for (const s of [
    "CREATE TABLE IF NOT EXISTS ops_mail (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, ok INTEGER NOT NULL, status INTEGER)",
    "CREATE INDEX IF NOT EXISTS ops_mail_day ON ops_mail(day)",
    "CREATE TABLE IF NOT EXISTS ops_ai (day TEXT PRIMARY KEY, calls INTEGER NOT NULL DEFAULT 0, errors INTEGER NOT NULL DEFAULT 0, input INTEGER NOT NULL DEFAULT 0, output INTEGER NOT NULL DEFAULT 0, cache_write INTEGER NOT NULL DEFAULT 0, cache_read INTEGER NOT NULL DEFAULT 0, cost_usd REAL NOT NULL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS ops_hits (day TEXT NOT NULL, area TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, area))",
    "CREATE TABLE IF NOT EXISTS ops_err (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, day TEXT NOT NULL, area TEXT, status INTEGER, msg TEXT)",
    "CREATE INDEX IF NOT EXISTS ops_err_day ON ops_err(day)",
    "CREATE TABLE IF NOT EXISTS ops_alerts (key TEXT PRIMARY KEY, at INTEGER NOT NULL)",
  ]) { try { await env.DB.prepare(s).run(); } catch {} }
  ready = true;
}

// ---------- Mails ----------
// Alle Mails laufen hierüber. kind: bestellung, solo, feedback, kontakt, widerruf, widerruf-office, warnung
export async function sendMail(env, kind, msg) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, ...msg }),
  }).catch(() => null);
  const ok = !!(r && r.ok);
  try {
    await migrateOps(env);
    const now = Date.now(), day = viennaDate(now);
    await env.DB.prepare("INSERT INTO ops_mail (at, day, kind, ok, status) VALUES (?,?,?,?,?)").bind(now, day, kind, ok ? 1 : 0, r ? r.status : 0).run();
    if (kind !== "warnung") await checkMail(env, day);
  } catch {}
  return ok;
}
async function checkMail(env, day) {
  const L = limits(env);
  const d = await env.DB.prepare("SELECT COUNT(*) AS n FROM ops_mail WHERE day=? AND kind<>'warnung'").bind(day).first();
  if (L.mail_day > 0 && d.n >= Math.ceil(L.mail_day * WARN))
    await alert(env, `mail-day-${day}`, `Mail-Limit: heute schon ${d.n} von ${L.mail_day} Mails`,
      `Heute wurden bereits <b>${d.n}</b> Mails verschickt. Das Tageslimit des Mail-Tarifs liegt bei <b>${L.mail_day}</b>. Darüber kommen Mails (z. B. Bestellbestätigungen) nicht mehr an.<br><br><b>Abhilfe:</b> In Resend auf den Pro-Tarif wechseln (kein Tageslimit), danach in Cloudflare die Variable MAIL_LIMIT_DAY auf 0 setzen.`);
  const m = await env.DB.prepare("SELECT COUNT(*) AS n FROM ops_mail WHERE day LIKE ? AND kind<>'warnung'").bind(month(day) + "%").first();
  if (L.mail_month > 0 && m.n >= Math.ceil(L.mail_month * WARN))
    await alert(env, `mail-month-${month(day)}-${m.n >= L.mail_month * 0.9 ? 90 : 70}`, `Mail-Limit: ${m.n} von ${L.mail_month} Mails in diesem Monat`,
      `In diesem Monat wurden bereits <b>${m.n}</b> Mails verschickt, das Monatslimit liegt bei <b>${L.mail_month}</b>.<br><br><b>Abhilfe:</b> Mail-Tarif in Resend erhöhen und MAIL_LIMIT_MONTH in Cloudflare anpassen.`);
}

// ---------- Claude-API ----------
export async function logAI(env, usage, ok = true) {
  try {
    await migrateOps(env);
    const u = usage || {};
    const inp = u.input_tokens || 0, out = u.output_tokens || 0, cw = u.cache_creation_input_tokens || 0, cr = u.cache_read_input_tokens || 0;
    const cost = (inp * AI_PRICE.input + out * AI_PRICE.output + cw * AI_PRICE.cache_write + cr * AI_PRICE.cache_read) / 1e6;
    const day = viennaDate();
    await env.DB.prepare(`INSERT INTO ops_ai (day, calls, errors, input, output, cache_write, cache_read, cost_usd) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(day) DO UPDATE SET calls=calls+excluded.calls, errors=errors+excluded.errors, input=input+excluded.input, output=output+excluded.output,
      cache_write=cache_write+excluded.cache_write, cache_read=cache_read+excluded.cache_read, cost_usd=cost_usd+excluded.cost_usd`)
      .bind(day, ok ? 1 : 0, ok ? 0 : 1, inp, out, cw, cr, cost).run();
    const L = limits(env);
    const m = await env.DB.prepare("SELECT SUM(cost_usd) AS c, SUM(errors) AS e FROM ops_ai WHERE day LIKE ?").bind(month(day) + "%").first();
    if (L.ai_budget > 0 && (m.c || 0) >= L.ai_budget * WARN) {
      const lvl = m.c >= L.ai_budget ? 100 : 70;
      await alert(env, `ai-${month(day)}-${lvl}`, `KI-Budget: ${lvl} % erreicht (${(m.c || 0).toFixed(2)} $ von ${L.ai_budget} $)`,
        `Die Claude-API hat in diesem Monat bereits ca. <b>${(m.c || 0).toFixed(2)} $</b> verbraucht (Budget ${L.ai_budget} $).<br><br><b>Bitte prüfen:</b> Guthaben in der Claude Console (Settings → Billing), ggf. aufladen bzw. automatisches Aufladen aktivieren. Budget ändern: Variable KI_BUDGET_USD in Cloudflare.`);
    }
    if (!ok) {
      const d = await env.DB.prepare("SELECT errors FROM ops_ai WHERE day=?").bind(day).first();
      if (d && d.errors >= 5) await alert(env, `ai-err-${day}`, `KI-Fehler: ${d.errors} fehlgeschlagene ARIA-Antworten heute`,
        `Die Claude-API hat heute <b>${d.errors}</b> Mal nicht geantwortet. Die Teams bekommen dann automatisch die Ersatz-Hinweise, der Fall bleibt lösbar.<br><br><b>Häufige Ursachen:</b> Guthaben aufgebraucht, API-Schlüssel ungültig oder Störung bei Anthropic (status.claude.com).`);
    }
  } catch {}
}

// ---------- Aufrufe und Fehler ----------
export async function countHit(env, area, n = 1) {
  try {
    await migrateOps(env);
    const day = viennaDate();
    await env.DB.prepare("INSERT INTO ops_hits (day, area, n) VALUES (?,?,?) ON CONFLICT(day, area) DO UPDATE SET n=n+excluded.n").bind(day, area, n).run();
    const L = limits(env);
    if (L.req_day > 0 && Math.random() < 0.02) {
      const t = await env.DB.prepare("SELECT SUM(n) AS n FROM ops_hits WHERE day=?").bind(day).first();
      if ((t.n || 0) >= L.req_day * WARN) await alert(env, `req-${day}`, `Server-Limit: ca. ${t.n} Aufrufe heute (Limit ${L.req_day})`,
        `Heute gab es bereits rund <b>${t.n}</b> Server-Aufrufe. Im kostenlosen Cloudflare-Tarif sind <b>${L.req_day}</b> pro Tag möglich, darüber fällt die Seite bis Mitternacht (UTC) aus.<br><br><b>Abhilfe:</b> In Cloudflare auf Workers Paid wechseln (5 $/Monat, 10 Mio. Aufrufe), danach REQ_LIMIT_DAY auf 0 setzen.`);
    }
  } catch {}
}
export async function logError(env, area, status, msg) {
  try {
    await migrateOps(env);
    const now = Date.now(), day = viennaDate(now);
    await env.DB.prepare("INSERT INTO ops_err (at, day, area, status, msg) VALUES (?,?,?,?,?)").bind(now, day, area, status, String(msg || "").slice(0, 300)).run();
    await env.DB.prepare("DELETE FROM ops_err WHERE at < ?").bind(now - 90 * 86400000).run();
    const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM ops_err WHERE day=?").bind(day).first();
    if (c.n > 10) await alert(env, `err-${day}`, `Fehler: heute schon ${c.n} Serverfehler`,
      `Heute sind bereits <b>${c.n}</b> Serverfehler aufgetreten. Die Liste mit Bereich und Meldung steht im Admin-Bereich unter „Kapazität &amp; System“.`);
  } catch {}
}

// ---------- Warnmail (höchstens einmal pro Schlüssel) ----------
async function alert(env, key, subject, html) {
  const r = await env.DB.prepare("INSERT OR IGNORE INTO ops_alerts (key, at) VALUES (?,?)").bind(key, Date.now()).run();
  if (!r.meta?.changes) return;
  await sendMail(env, "warnung", { to: [env.ALERT_TO || "office@mordsteam.com"], subject: `⚠️ Mordsteam: ${subject}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C;max-width:560px"><div style="font-family:Georgia,serif;font-weight:900;font-size:20px;margin-bottom:10px"><span style="color:#B3261E">MORDS</span>TEAM · Warnung</div><p>${html}</p><p style="font-size:12px;color:#5A5D66">Diese Warnung kommt automatisch und höchstens einmal pro Anlass. Details im Admin-Bereich unter „Kapazität &amp; System“.</p></div>` });
}

// ---------- Übersicht für den Admin-Bereich ----------
export async function opsSummary(env) {
  await migrateOps(env);
  const today = viennaDate(), mon = month(today);
  const since = viennaDate(Date.now() - 29 * 86400000);
  const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).all().then((r) => r.results);
  const [mailDays, mailKinds, aiDays, hitDays, hitAreas, errs, alerts] = await Promise.all([
    q("SELECT day, COUNT(*) AS n, SUM(ok) AS ok FROM ops_mail WHERE day >= ? AND kind<>'warnung' GROUP BY day ORDER BY day", since),
    q("SELECT kind, COUNT(*) AS n, SUM(ok) AS ok FROM ops_mail WHERE day LIKE ? GROUP BY kind ORDER BY n DESC", mon + "%"),
    q("SELECT * FROM ops_ai WHERE day >= ? ORDER BY day", since),
    q("SELECT day, SUM(n) AS n FROM ops_hits WHERE day >= ? GROUP BY day ORDER BY day", since),
    q("SELECT area, SUM(n) AS n FROM ops_hits WHERE day LIKE ? GROUP BY area ORDER BY n DESC", mon + "%"),
    q("SELECT at, area, status, msg FROM ops_err ORDER BY at DESC LIMIT 50"),
    q("SELECT key, at FROM ops_alerts ORDER BY at DESC LIMIT 20"),
  ]);
  const sum = (a, k, f = () => true) => a.filter(f).reduce((s, x) => s + (x[k] || 0), 0);
  const inMonth = (x) => x.day.startsWith(mon);
  return {
    today, month: mon, limits: limits(env), price: AI_PRICE,
    mail: { today: sum(mailDays, "n", (x) => x.day === today), month: sum(mailKinds, "n", (k) => k.kind !== "warnung"), failed_month: sum(mailKinds, "n", (k) => k.kind !== "warnung") - sum(mailKinds, "ok", (k) => k.kind !== "warnung"), days: mailDays, kinds: mailKinds },
    ai: { today_calls: sum(aiDays, "calls", (x) => x.day === today), month_calls: sum(aiDays, "calls", inMonth), month_errors: sum(aiDays, "errors", inMonth),
      month_cost: sum(aiDays, "cost_usd", inMonth), month_input: sum(aiDays, "input", inMonth) + sum(aiDays, "cache_read", inMonth) + sum(aiDays, "cache_write", inMonth),
      month_output: sum(aiDays, "output", inMonth), days: aiDays },
    hits: { today: sum(hitDays, "n", (x) => x.day === today), days: hitDays, areas: hitAreas },
    errors: { today: errs.filter((e) => viennaDate(e.at) === today).length, list: errs },
    alerts,
    configured: { mail: !!(env.RESEND_API_KEY && env.MAIL_FROM), ai: !!env.ANTHROPIC_API_KEY, stripe: !!env.STRIPE_SECRET_KEY, stripe_live: String(env.STRIPE_SECRET_KEY || "").startsWith("sk_live"), shop_open: String(env.SHOP_OPEN || "").toLowerCase() === "true", fake_pay: String(env.ORDER_FAKE_PAY || "").toLowerCase() === "true" },
  };
}
