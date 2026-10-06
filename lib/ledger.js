// Ausgabenbuch und Einnahmen-Ausgaben-Rechnung (6.10.2026). Der Admin ist die Hauptquelle der Buchhaltung,
// die CSV-Exporte sind für Steuerberatung, WKO und Rückfragen des Finanzamts.
//
// Ausgaben: jede Rechnung eine Zeile, mit Steuerart (Reverse Charge, mit österreichischer USt, ohne USt …),
// Kategorie, betrieblichem Anteil und „bezahlt vom Geschäftskonto“ oder „privat bezahlt“.
// Reverse Charge: Steuer je Quartal aus den Ausgaben mit Steuerart „rc“ plus den Stripe-Gebühren (automatisch).
// E/A-Rechnung: Zufluss-Abfluss-Prinzip – Einnahmen nach Zahlungstag, Ausgaben nach „bezahlt am“.
// Fristen: RC-Zahlungen, Zusammenfassende Meldung, USt- und Einkommensteuer-Jahreserklärung, Schwellen.
import { migrateAccounting, accountingSummary, viennaMidnight, viennaDayEnd, eurMissing, netAmount, migrateCosts, quarterOf, rcDue } from "./accounting.js";

export const RC_RATE = 20;
export const STEUERARTEN = {
  rc: "Ausland ohne USt – Reverse Charge (20 % ans Finanzamt)",
  at_ust: "Inland mit USt (in der Rechnung enthalten)",
  ausl_ust: "Ausland mit USt auf der Rechnung (z. B. privates Abo)",
  ohne: "ohne USt (Bank, Behörde, SVS, Kleinunternehmer)",
};
export const KATEGORIEN = ["KI / API (Anthropic)", "Zahlungsgebühren", "Hosting / Domain", "E-Mail-Versand", "Software / Abos", "Geräte / Hardware",
  "Werbung / Marketing", "Beratung / Steuerberatung", "Gebühren / Behörden", "Sozialversicherung (SVS)", "Bankspesen", "Sonstiges"];
const BEZAHLT = { konto: "Geschäftskonto", privat: "privat bezahlt" };

const err = (msg, status = 400) => Object.assign(new Error(msg), { status });
const s = (x, n) => String(x ?? "").trim().slice(0, n);
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") && !Number.isNaN(Date.parse(d + "T00:00:00Z"));
// „1.234,56“, „1234,56“, „1234.56“ → Cent
export function parseEuro(v) {
  let t = String(v ?? "").replace(/\s|€/g, "");
  if (!t) return NaN;
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(/,/g, "");
  return Math.round(Number(t) * 100);
}
const VIENNA_YM = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });
export const viennaYmd = (ms) => VIENNA_YM.format(new Date(ms));   // „2026-10-06“
const business = (e) => Math.round((e.betrag_cents || 0) * (e.anteil ?? 100) / 100);
const paidDay = (e) => e.bezahlt_am || e.datum;

let ready = false;
export async function migrateLedger(env) {
  if (ready) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, datum TEXT NOT NULL, bezahlt_am TEXT, anbieter TEXT NOT NULL, beschreibung TEXT,
    kategorie TEXT, steuerart TEXT NOT NULL, betrag_cents INTEGER NOT NULL, ust_cents INTEGER, orig TEXT, anteil INTEGER NOT NULL DEFAULT 100, bezahlt_von TEXT NOT NULL DEFAULT 'konto',
    beleg TEXT, notiz TEXT, cost_id TEXT, dup_ok INTEGER NOT NULL DEFAULT 0, bank_ref TEXT, created_at INTEGER NOT NULL, updated_at INTEGER, deleted INTEGER NOT NULL DEFAULT 0)`).run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS rc_paid (quartal TEXT PRIMARY KEY, paid_at INTEGER)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS duties_done (key TEXT PRIMARY KEY, done_at INTEGER)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS expense_files (id TEXT PRIMARY KEY, expense_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, r2_key TEXT NOT NULL, created_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0)").run();
  // Belege aus dem früheren Reverse-Charge-Formular einmalig übernehmen (gleiche ID, Gelöschtes bleibt gelöscht)
  try {
    await env.DB.prepare(`INSERT OR IGNORE INTO expenses (id, datum, bezahlt_am, anbieter, beschreibung, kategorie, steuerart, betrag_cents, anteil, bezahlt_von, notiz, created_at, deleted)
      SELECT id, datum, datum, anbieter, '', 'Sonstiges', 'rc', netto_cents, 100, 'konto', notiz, created_at, deleted FROM rc_entries`).run();
  } catch {}   // Tabelle rc_entries gibt es nur in alten Datenbanken
  ready = true;
}

export async function expenseSave(env, b) {
  await migrateLedger(env);
  const datum = isDate(b.datum) ? b.datum : null;
  if (!datum) throw err("Bitte das Rechnungsdatum angeben.");
  const bezahlt = b.bezahlt_am ? (isDate(b.bezahlt_am) ? b.bezahlt_am : null) : datum;
  if (!bezahlt) throw err("„Bezahlt am“ ist kein gültiges Datum.");
  const anbieter = s(b.anbieter, 80);
  if (!anbieter) throw err("Bitte den Anbieter angeben.");
  const steuerart = STEUERARTEN[b.steuerart] ? b.steuerart : null;
  if (!steuerart) throw err("Bitte die Steuerart wählen.");
  const betrag = parseEuro(b.betrag);
  if (!(betrag > 0)) throw err(steuerart === "rc" ? "Betrag in Euro (netto, laut Kontoauszug) bitte als Zahl, z. B. 18,40." : "Betrag in Euro bitte als Zahl, z. B. 21,25.");
  const ust = b.ust === "" || b.ust == null ? null : parseEuro(b.ust);
  if (ust != null && !(ust >= 0 && ust < betrag)) throw err("Die enthaltene USt muss kleiner als der Betrag sein.");
  const anteil = b.anteil === "" || b.anteil == null ? 100 : Math.round(Number(String(b.anteil).replace(",", ".").replace("%", "")));
  if (!(anteil >= 0 && anteil <= 100)) throw err("Betrieblicher Anteil bitte zwischen 0 und 100 %.");
  const kategorie = KATEGORIEN.includes(b.kategorie) ? b.kategorie : "Sonstiges";
  const von = BEZAHLT[b.bezahlt_von] ? b.bezahlt_von : "konto";
  const id = s(b.id, 40) || "a-" + crypto.randomUUID().slice(0, 8);
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO expenses (id, datum, bezahlt_am, anbieter, beschreibung, kategorie, steuerart, betrag_cents, ust_cents, orig, anteil, bezahlt_von, beleg, notiz, cost_id, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET datum=excluded.datum, bezahlt_am=excluded.bezahlt_am, anbieter=excluded.anbieter, beschreibung=excluded.beschreibung, kategorie=excluded.kategorie,
      steuerart=excluded.steuerart, betrag_cents=excluded.betrag_cents, ust_cents=excluded.ust_cents, orig=excluded.orig, anteil=excluded.anteil, bezahlt_von=excluded.bezahlt_von,
      beleg=excluded.beleg, notiz=excluded.notiz, cost_id=COALESCE(excluded.cost_id, expenses.cost_id), dup_ok=0, updated_at=excluded.updated_at, deleted=0`)
    .bind(id, datum, bezahlt, anbieter, s(b.beschreibung, 160), kategorie, steuerart, betrag, ust, s(b.orig, 40) || null, anteil, von, s(b.beleg, 300) || null, s(b.notiz, 300) || null,
      s(b.cost_id, 40) || null, now, now).run();
  return { ok: true, id };
}
export async function expenseDelete(env, id) {
  await migrateLedger(env);
  await env.DB.prepare("UPDATE expenses SET deleted=1, updated_at=? WHERE id=?").bind(Date.now(), String(id || "")).run();
  return { ok: true };
}
export async function expenseDupOk(env, id) {
  await migrateLedger(env);
  await env.DB.prepare("UPDATE expenses SET dup_ok=1 WHERE id=?").bind(String(id || "")).run();
  return { ok: true };
}
export async function rcMarkPaid(env, b) {
  await migrateLedger(env);
  const q = /^\d{4}-Q[1-4]$/.test(b.quartal || "") ? b.quartal : null;
  if (!q) throw err("Quartal ungültig.");
  const at = isDate(b.datum) ? viennaMidnight(b.datum) + 12 * 3600000 : Date.now();
  if (b.paid) await env.DB.prepare("INSERT INTO rc_paid (quartal, paid_at) VALUES (?,?) ON CONFLICT(quartal) DO UPDATE SET paid_at=excluded.paid_at").bind(q, at).run();
  else await env.DB.prepare("DELETE FROM rc_paid WHERE quartal=?").bind(q).run();
  return { ok: true };
}
export async function dutyDone(env, b) {
  await migrateLedger(env);
  const key = /^(zm:\d{4}-\d{2}|u1:\d{4}|e1:\d{4})$/.test(b.key || "") ? b.key : null;
  if (!key) throw err("Unbekannte Pflicht.");
  if (b.done) await env.DB.prepare("INSERT INTO duties_done (key, done_at) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET done_at=excluded.done_at").bind(key, Date.now()).run();
  else await env.DB.prepare("DELETE FROM duties_done WHERE key=?").bind(key).run();
  return { ok: true };
}

// Stripe-Gebühren je Monat (aus den Bestellungen) – zählen als Ausgabe und als Reverse-Charge-Leistung (Stripe sitzt in Irland)
async function stripeFees(env, from, to) {
  await migrateAccounting(env);
  const rows = (await env.DB.prepare("SELECT paid_at, fee_cents FROM orders WHERE fee_cents > 0 AND paddle_txn IS NULL AND COALESCE(pay_provider,'') <> 'paddle' AND status IN ('paid','fulfilling','fulfilled','refunded','withdrawn') AND paid_at BETWEEN ? AND ?").bind(from, to).all()).results;
  const m = {};
  for (const o of rows) { const k = viennaYmd(o.paid_at).slice(0, 7); m[k] = (m[k] || 0) + o.fee_cents; }
  return Object.entries(m).sort().map(([month, cents]) => ({ id: "stripe-" + month, auto: true, datum: lastDay(month), bezahlt_am: lastDay(month), anbieter: "Stripe (Gebühren, automatisch)",
    beschreibung: `Stripe-Gebühren ${month.slice(5)}/${month.slice(0, 4)} aus den Zahlungen`, kategorie: "Zahlungsgebühren", steuerart: "rc", betrag_cents: cents, anteil: 100, bezahlt_von: "konto" }));
}
const lastDay = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
const nextMonthEnd = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10); };
const MONAT = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
export const monthName = (ym) => `${MONAT[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

// Mögliche Doppelbuchungen: gleicher Anbieter (erstes Wort), gleicher Betrag, höchstens 5 Tage auseinander
function findDuplicates(list) {
  const key = (e) => s(e.anbieter, 80).toLowerCase().split(/[\s(,.-]+/)[0];
  const days = (d) => Date.parse(d + "T00:00:00Z") / 86400000;
  const flagged = new Set();
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    if (a.dup_ok || b.dup_ok) continue;   // „kein Duplikat“ bei einer der beiden genügt
    if (key(a) === key(b) && a.betrag_cents === b.betrag_cents && Math.abs(days(a.datum) - days(b.datum)) <= 5) { flagged.add(a.id); flagged.add(b.id); }
  }
  return flagged;
}

// Laufende Posten (Vorlagen aus der Kostenliste): fehlt für einen abgeschlossenen Monat/Quartal/Jahr eine Buchung?
async function missingRecurring(env, list, year, today) {
  await migrateCosts(env);
  const items = (await env.DB.prepare("SELECT * FROM cost_items WHERE deleted=0 AND art IN ('monatlich','quartal','jaehrlich') AND betrag_cents > 0").all()).results;
  const out = [];
  const curYm = today.slice(0, 7);
  for (const it of items) {
    const booked = list.filter((e) => e.cost_id === it.id);
    const first = it.seit ? it.seit.slice(0, 7) : booked.length ? booked.map((e) => e.datum.slice(0, 7)).sort()[0] : null;
    if (!first) continue;
    const step = it.art === "monatlich" ? 1 : it.art === "quartal" ? 3 : 12;
    let [y, m] = first.split("-").map(Number);
    for (let guard = 0; guard < 200; guard++) {
      const startYm = `${y}-${String(m).padStart(2, "0")}`;
      const endDate = new Date(Date.UTC(y, m - 1 + step, 0)).toISOString().slice(0, 10), endYm = endDate.slice(0, 7);
      if (endYm >= curYm) break;   // laufender Zeitraum: noch nicht fällig
      if (Number(endYm.slice(0, 4)) === year && !booked.some((e) => e.datum >= `${startYm}-01` && e.datum <= endDate))
        out.push({ cost_id: it.id, name: it.name, anbieter: it.anbieter || "", period: step === 1 ? monthName(startYm) : step === 3 ? quarterOf(startYm + "-01").replace("-", " ") : String(y),
          datum: endDate, betrag_cents: it.betrag_cents, waehrung: it.waehrung, anteil: it.anteil ?? 100 });
      m += step; while (m > 12) { m -= 12; y++; }
    }
  }
  return out.slice(0, 24);
}

// Alles für ein Kalenderjahr: Ausgaben, E/A je Monat, Kategorien, Reverse Charge, Fristen, Warnungen
export async function ledgerYear(env, year, todayYmd) {
  await migrateLedger(env);
  await migrateAccounting(env);
  const Y = Number(year) || Number(viennaYmd(Date.now()).slice(0, 4));
  const today = todayYmd || viennaYmd(Date.now());
  const ys = viennaMidnight(`${Y}-01-01`), ye = viennaDayEnd(`${Y}-12-31`);
  // Ausgaben, die das Jahr berühren (Rechnungsdatum oder Zahlung im Jahr)
  const manual = (await env.DB.prepare("SELECT * FROM expenses WHERE deleted=0 AND ((datum BETWEEN ? AND ?) OR (bezahlt_am BETWEEN ? AND ?)) ORDER BY datum DESC, created_at DESC")
    .bind(`${Y}-01-01`, `${Y}-12-31`, `${Y}-01-01`, `${Y}-12-31`).all()).results;
  const fees = await stripeFees(env, ys, ye);
  const dups = findDuplicates(manual);
  const expenses = manual.map((e) => ({ ...e, betrieblich_cents: business(e), rc_cents: e.steuerart === "rc" ? Math.round(e.betrag_cents * RC_RATE / 100) : 0,
    dup: dups.has(e.id) && !e.dup_ok, stripe_manual: /stripe/i.test(e.anbieter) && e.kategorie === "Zahlungsgebühren" }));
  const files = await filesOf(env, manual.map((e) => e.id));
  for (const e of expenses) e.files = files[e.id] || [];

  // Reverse Charge je Quartal (nach Rechnungsdatum)
  const paid = Object.fromEntries((await env.DB.prepare("SELECT quartal, paid_at FROM rc_paid").all()).results.map((r) => [r.quartal, r.paid_at]));
  const qs = {};
  for (const e of [...manual.filter((x) => x.steuerart === "rc" && x.datum.startsWith(String(Y))), ...fees]) {
    const q = quarterOf(e.datum), g = (qs[q] ||= { quartal: q, netto: 0, count: 0 });
    g.netto += e.betrag_cents; g.count++;
  }
  const quarters = Object.values(qs).sort((a, b) => a.quartal.localeCompare(b.quartal))
    .map((g) => ({ ...g, steuer: Math.round(g.netto * RC_RATE / 100), faellig: rcDue(g.quartal), bezahlt: paid[g.quartal] || null }));

  // E/A-Rechnung je Monat (Zufluss-Abfluss)
  const months = Array.from({ length: 12 }, (_, i) => ({ month: `${Y}-${String(i + 1).padStart(2, "0")}`, einnahmen: 0, ausgaben: 0, gebuehren: 0, rc_bezahlt: 0, gewinn: 0 }));
  const M = (ymd) => months[Number(ymd.slice(5, 7)) - 1];
  const orders = (await env.DB.prepare("SELECT status, amount_cents, refunded_cents, paid_at, currency, eur_ok, tax_cents, fee_cents, net_cents, paddle_txn, pay_provider FROM orders WHERE status IN ('paid','fulfilling','fulfilled','refunded','withdrawn') AND paid_at BETWEEN ? AND ?").bind(ys, ye).all()).results;
  let eurMiss = 0;
  // Paddle (Merchant of Record, UK): Einnahme ist die Auszahlung – britische USt und Paddle-Gebühr bleiben bei Paddle
  const income = (o) => {
    if (!(o.paddle_txn || o.pay_provider === "paddle")) return netAmount(o);
    if (o.status === "withdrawn" && o.refunded_cents == null) return 0;
    const payout = o.net_cents ?? ((o.amount_cents || 0) - (o.tax_cents || 0) - (o.fee_cents || 0));
    return Math.max(0, payout - (o.refunded_cents || 0));
  };
  for (const o of orders) { if (eurMissing(o)) { eurMiss++; continue; } M(viennaYmd(o.paid_at)).einnahmen += income(o); }
  const cats = Object.fromEntries(KATEGORIEN.map((k) => [k, 0]));
  for (const e of manual) { const d = paidDay(e); if (!d.startsWith(String(Y))) continue; M(d).ausgaben += business(e); cats[e.kategorie || "Sonstiges"] = (cats[e.kategorie || "Sonstiges"] || 0) + business(e); }
  for (const f of fees) { M(f.datum).gebuehren += f.betrag_cents; cats["Zahlungsgebühren"] += f.betrag_cents; }
  // bezahlte RC-Steuer ist selbst eine Betriebsausgabe (im Monat der Zahlung) – auch für Quartale aus dem Vorjahr
  const allQ = await rcQuartersAll(env);
  let rcPaidYear = 0;
  for (const q of allQ) if (q.bezahlt && viennaYmd(q.bezahlt).startsWith(String(Y))) { M(viennaYmd(q.bezahlt)).rc_bezahlt += q.steuer; rcPaidYear += q.steuer; }
  if (rcPaidYear) cats["Reverse-Charge-USt (bezahlt)"] = rcPaidYear;
  for (const m of months) m.gewinn = m.einnahmen - m.ausgaben - m.gebuehren - m.rc_bezahlt;
  const sum = (k) => months.reduce((a, m) => a + m[k], 0);
  const totals = { einnahmen: sum("einnahmen"), ausgaben: sum("ausgaben"), gebuehren: sum("gebuehren"), rc_bezahlt: sum("rc_bezahlt"), gewinn: sum("gewinn"),
    privat_bezahlt: manual.filter((e) => e.bezahlt_von === "privat" && paidDay(e).startsWith(String(Y))).reduce((a, e) => a + business(e), 0) };

  // Fristen und Meldungen
  const acc = await accountingSummary(env, ys, ye);
  const done = Object.fromEntries((await env.DB.prepare("SELECT key, done_at FROM duties_done").all()).results.map((r) => [r.key, r.done_at]));
  const duties = [];
  for (const q of quarters) duties.push({ key: "rc:" + q.quartal, kind: "rc", title: `Reverse-Charge-USt ${q.quartal.replace("-", " ")} überweisen`, detail: `${q.count} Beleg(e), Netto ${eu(q.netto)} €, Verwendungszweck „U“ + Quartal`, cents: q.steuer, due: q.faellig, done: q.bezahlt });
  const zmMonths = {};
  for (const z of acc.zm || []) { const k = viennaYmd(z.date).slice(0, 7); (zmMonths[k] ||= { n: 0, cents: 0 }); zmMonths[k].n++; zmMonths[k].cents += z.cents; }
  for (const [k, v] of Object.entries(zmMonths).sort()) duties.push({ key: "zm:" + k, kind: "zm", title: `Zusammenfassende Meldung ${monthName(k)}`, detail: `${v.n} Rechnung(en) an EU-Firmen mit UID – in FinanzOnline je UID melden (Meldezeitraum mit der WKO bestätigen)`, cents: v.cents, due: nextMonthEnd(k), done: done["zm:" + k] || null });
  const rcYear = quarters.reduce((a, q) => a + q.steuer, 0);
  if (rcYear > 0) duties.push({ key: "u1:" + Y, kind: "u1", title: `Umsatzsteuer-Jahreserklärung (U1) ${Y}`, detail: `Pflicht, weil ${Y} Reverse-Charge-USt angefallen ist (${eu(rcYear)} €). Elektronisch in FinanzOnline.`, cents: rcYear, due: `${Y + 1}-06-30`, done: done["u1:" + Y] || null });
  if (totals.einnahmen > 0 || totals.ausgaben > 0) duties.push({ key: "e1:" + Y, kind: "e1", title: `Einkommensteuererklärung (E1 mit Beilage E1a) ${Y}`, detail: `Gewinn laut E/A-Rechnung ${eu(totals.gewinn)} €. Pflicht neben dem Gehalt, wenn andere Einkünfte über 730 € liegen; bei Verlust freiwillig sinnvoll. Elektronisch in FinanzOnline.`, cents: totals.gewinn, due: `${Y + 1}-06-30`, done: done["e1:" + Y] || null });
  for (const d of duties) d.status = d.done ? "erledigt" : d.due < today ? "überfällig" : "offen";

  return { year: Y, today, steuerarten: STEUERARTEN, kategorien: KATEGORIEN, bezahlt: BEZAHLT, rate: RC_RATE,
    expenses, stripe_fees: fees, months, totals, by_kategorie: Object.entries(cats).filter(([, v]) => v).map(([k, v]) => ({ kategorie: k, cents: v })),
    quarters, duties, eur_missing: eurMiss, missing: await missingRecurring(env, manual.concat(await allBooked(env, Y)), Y, today),
    dup_count: expenses.filter((e) => e.dup).length, stripe_manual: expenses.filter((e) => e.stripe_manual).length,
    ohne_beleg: expenses.filter((e) => !e.files.length && !e.beleg).length, belege: !!env.BELEGE,
    anbieter_liste: (await env.DB.prepare("SELECT anbieter, COUNT(*) n FROM expenses WHERE deleted=0 GROUP BY anbieter ORDER BY n DESC LIMIT 60").all()).results.map((r) => r.anbieter),
    thresholds: { ku: acc.ku, eu_b2c: acc.eu_b2c } };
}
async function allBooked(env, Y) {   // Buchungen außerhalb des Jahres (für „seit“ ohne eingetragenes Datum)
  return (await env.DB.prepare("SELECT id, datum, cost_id FROM expenses WHERE deleted=0 AND cost_id IS NOT NULL AND datum NOT LIKE ?").bind(`${Y}-%`).all()).results;
}
async function rcQuartersAll(env) {
  const manual = (await env.DB.prepare("SELECT datum, betrag_cents FROM expenses WHERE deleted=0 AND steuerart='rc'").all()).results;
  const fees = await stripeFees(env, 0, Date.now() + 86400000);
  const paid = (await env.DB.prepare("SELECT quartal, paid_at FROM rc_paid").all()).results;
  return paid.map((p) => ({ quartal: p.quartal, bezahlt: p.paid_at,
    steuer: Math.round([...manual, ...fees].filter((e) => quarterOf(e.datum) === p.quartal).reduce((a, e) => a + e.betrag_cents, 0) * RC_RATE / 100) }));
}

// ---------- CSV-Exporte (Excel-tauglich: Semikolon, Dezimalkomma, BOM) ----------
const q = (x) => { const t = String(x ?? ""); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const eu = (c) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));
const de = (ymd) => (ymd ? ymd.split("-").reverse().join(".") : "");
const csv = (lines) => "﻿" + lines.map((l) => l.map(q).join(";")).join("\r\n");

export async function expensesCsv(env, von, bis) {
  await migrateLedger(env);
  const rows = (await env.DB.prepare("SELECT * FROM expenses WHERE deleted=0 AND COALESCE(bezahlt_am, datum) BETWEEN ? AND ? ORDER BY COALESCE(bezahlt_am, datum), created_at").bind(von, bis).all()).results;
  const fees = await stripeFees(env, viennaMidnight(von), viennaDayEnd(bis));
  const dups = findDuplicates(rows);
  const files = await filesOf(env, rows.map((e) => e.id));
  const all = [...rows, ...fees].sort((a, b) => paidDay(a).localeCompare(paidDay(b)));
  const lines = [["Rechnungsdatum", "bezahlt am", "bezahlt an", "Beschreibung", "Kategorie", "Steuerart", "Betrag (€)", "davon USt (€)", "Originalbetrag", "betriebl. Anteil (%)", "Betriebsausgabe (€)", "RC-USt 20 % (€)", "bezahlt von", "Beleg", "Notiz", "Prüfen"]];
  for (const e of all) lines.push([de(e.datum), de(paidDay(e)), e.anbieter, e.beschreibung || "", e.kategorie || "", STEUERARTEN[e.steuerart] || e.steuerart, eu(e.betrag_cents), eu(e.ust_cents), e.orig || "",
    e.anteil ?? 100, eu(business(e)), e.steuerart === "rc" ? eu(Math.round(e.betrag_cents * RC_RATE / 100)) : "", BEZAHLT[e.bezahlt_von] || "", [e.beleg, ...(files[e.id] || []).map((f) => f.name)].filter(Boolean).join(", "), e.notiz || "",
    e.auto ? "automatisch aus Stripe" : dups.has(e.id) && !e.dup_ok ? "möglicherweise doppelt" : ""]);
  return csv(lines);
}

export async function earCsv(env, year) {
  const d = await ledgerYear(env, year);
  const L = [[`Mordsteam e.U. – Einnahmen-Ausgaben-Rechnung ${d.year}`], [`erstellt am ${de(d.today)} aus dem Admin (Zufluss-Abfluss-Prinzip; Beträge in Euro)`], [],
    ["Monat", "Einnahmen (€)", "Betriebsausgaben (€)", "Stripe-Gebühren (€)", "Reverse-Charge-USt bezahlt (€)", "Gewinn (€)"]];
  for (const m of d.months) L.push([monthName(m.month), eu(m.einnahmen), eu(m.ausgaben), eu(m.gebuehren), eu(m.rc_bezahlt), eu(m.gewinn)]);
  L.push(["Summe", eu(d.totals.einnahmen), eu(d.totals.ausgaben), eu(d.totals.gebuehren), eu(d.totals.rc_bezahlt), eu(d.totals.gewinn)]);
  L.push([], ["Betriebsausgaben nach Kategorie", "Betrag (€)"]);
  for (const k of d.by_kategorie) L.push([k.kategorie, eu(k.cents)]);
  L.push([], ["davon privat bezahlt (Einlage)", eu(d.totals.privat_bezahlt)]);
  L.push([], ["Reverse Charge je Quartal", "Belege", "Netto (€)", "USt 20 % (€)", "fällig am", "bezahlt am"]);
  for (const x of d.quarters) L.push([x.quartal, x.count, eu(x.netto), eu(x.steuer), de(x.faellig), x.bezahlt ? de(viennaYmd(x.bezahlt)) : "offen"]);
  L.push([], ["Schwellen", "Stand (€)", "Grenze (€)"],
    [`Kleinunternehmergrenze ${d.thresholds.ku.year} (brutto)`, eu(d.thresholds.ku.cents), eu(d.thresholds.ku.limit)],
    [`EU-Privatkunden ${d.thresholds.eu_b2c.year}`, eu(d.thresholds.eu_b2c.cents), eu(d.thresholds.eu_b2c.limit)]);
  L.push([], ["Fristen und Meldungen", "fällig am", "Status"]);
  for (const x of d.duties) L.push([x.title, de(x.due), x.status]);
  if (d.eur_missing) L.push([], [`Achtung: ${d.eur_missing} Zahlung(en) in Pfund/Dollar ohne Euro-Betrag zählen noch nicht mit (Admin → Buchhaltung: Übersicht).`]);
  return csv(L);
}

// ---------- Belege (Fotos, PDFs) im Cloudflare-Speicher R2, Binding BELEGE ----------
// Datei im Speicher unter belege/<Jahr>/<Ausgabe>/<Datei-ID>; Metadaten in expense_files. Entfernen markiert nur (Aufbewahrungspflicht).
export const BELEG_TYPES = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif", "image/gif": "gif" };
export const BELEG_MAX = 20 * 1024 * 1024;
async function filesOf(env, ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 80) {
    const part = ids.slice(i, i + 80);
    if (!part.length) continue;
    const rows = (await env.DB.prepare(`SELECT id, expense_id, name, mime, size, created_at FROM expense_files WHERE deleted=0 AND expense_id IN (${part.map(() => "?").join(",")}) ORDER BY created_at`).bind(...part).all()).results;
    for (const r of rows) (out[r.expense_id] ||= []).push({ id: r.id, name: r.name, mime: r.mime, size: r.size });
  }
  return out;
}
const safeName = (n) => String(n || "beleg").normalize("NFC").replace(/[\\/\u0000-\u001f"<>|:*?]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "beleg";
export async function belegUpload(env, expenseId, name, mime, body) {
  await migrateLedger(env);
  if (!env.BELEGE) throw err("Der Belegspeicher ist in dieser Umgebung noch nicht eingerichtet (Cloudflare R2, Binding BELEGE).", 503);
  const e = await env.DB.prepare("SELECT id, datum FROM expenses WHERE id=? AND deleted=0").bind(String(expenseId || "")).first();
  if (!e) throw err("Ausgabe nicht gefunden – bitte zuerst speichern.", 404);
  let type = String(mime || "").split(";")[0].trim().toLowerCase();
  const ext = (String(name).match(/\.([a-z0-9]{2,5})$/i) || [])[1]?.toLowerCase();
  if (!BELEG_TYPES[type] && ext) type = Object.keys(BELEG_TYPES).find((k) => BELEG_TYPES[k] === ext || (ext === "jpeg" && k === "image/jpeg")) || type;
  if (!BELEG_TYPES[type]) throw err("Nur PDF oder Fotos (JPG, PNG, HEIC, WebP) als Beleg.", 415);
  const buf = body instanceof ArrayBuffer ? body : await new Response(body).arrayBuffer();
  if (!buf.byteLength) throw err("Die Datei ist leer.");
  if (buf.byteLength > BELEG_MAX) throw err("Die Datei ist größer als 20 MB.", 413);
  const id = "b-" + crypto.randomUUID().slice(0, 12), fname = safeName(name);
  const key = `belege/${e.datum.slice(0, 4)}/${e.id}/${id}.${BELEG_TYPES[type]}`;
  await env.BELEGE.put(key, buf, { httpMetadata: { contentType: type }, customMetadata: { expense: e.id, name: fname } });
  await env.DB.prepare("INSERT INTO expense_files (id, expense_id, name, mime, size, r2_key, created_at) VALUES (?,?,?,?,?,?,?)").bind(id, e.id, fname, type, buf.byteLength, key, Date.now()).run();
  return { ok: true, id, name: fname, size: buf.byteLength };
}
export async function belegGet(env, fileId) {
  await migrateLedger(env);
  if (!env.BELEGE) throw err("Der Belegspeicher ist in dieser Umgebung noch nicht eingerichtet.", 503);
  const f = await env.DB.prepare("SELECT * FROM expense_files WHERE id=?").bind(String(fileId || "")).first();
  if (!f) throw err("Beleg nicht gefunden.", 404);
  const obj = await env.BELEGE.get(f.r2_key);
  if (!obj) throw err("Die Datei fehlt im Speicher.", 404);
  return new Response(obj.body, { headers: { "content-type": f.mime, "content-length": String(f.size), "cache-control": "no-store", "x-content-type-options": "nosniff",
    "content-security-policy": "sandbox; default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline'; object-src 'self'",
    "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(f.name)}` } });
}
export async function belegDelete(env, fileId) {
  await migrateLedger(env);
  await env.DB.prepare("UPDATE expense_files SET deleted=1 WHERE id=?").bind(String(fileId || "")).run();   // Datei bleibt im Speicher (Aufbewahrung)
  return { ok: true };
}
