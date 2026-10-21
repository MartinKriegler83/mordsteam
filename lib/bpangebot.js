// Brightpage – Angebote, Online-Annahme und Kundenlinks (Block 2 des Auftragsablaufs, 20.10.2026).
//
// Ablauf: Entwurf im Admin (BP Aufträge → Angebot, Positionen aus Vorlagen) → „Freigeben“ vergibt Nummer AN-JJJJ-NNN, Kundenlink und Gültigkeit (30 Tage)
//         → Martin schickt den Link selbst per Mail (mailto-Vorlage) → Kunde öffnet brightpage.net/k/angebot/<token>, wählt optionale Positionen,
//         bestätigt Rechnungsdaten und nimmt zahlungspflichtig an → Kunde in der Kundenliste, Anzahlungsrechnung (Standard 50 %) wird angelegt und
//         ausgestellt, Auftrag springt auf Station „Auftrag“ → Kunde sieht die Rechnung sofort unter brightpage.net/k/rechnung/<token> (EPC-QR, optional Stripe-Link).
//
// Die Seiten unter brightpage.net/k/* sind ein Durchreicher (brightpage/functions/k/[[path]].js) auf /api/bp/public/k/* hier,
// abgesichert mit dem gemeinsamen Schlüssel BP_INBOX_KEY. Die Tokens sind zufällig (144 Bit) und stehen nur in der Mail an den Kunden.
import { bpConfig, kundeSave, rechnungSave, rechnungAusstellen, VAT_LINE, regimeOf, migrateBp, splitPlzOrt } from "./brightpage.js";
import { auftragStatus, auftragSave, auftragNotiz, migrateAuftrag, PRODUKTE } from "./bpauftrag.js";
import { LOGO_SVG } from "./bplogo.js";
import qrcode from "./qrcode.js";
import { LAENDER, LAND_OK } from "./laender.js";
import { EU } from "./tax.js";

const err = (msg, status = 400) => Object.assign(new Error(msg), { status });
const s = (x, n) => String(x ?? "").trim().slice(0, n);
const now = () => Date.now();
const VIENNA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => VIENNA.format(new Date());
const addDays = (ymd, n) => new Date(Date.parse(ymd + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const parse = (x, d) => { try { return JSON.parse(x || ""); } catch { return d; } };
const token = () => [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, "0")).join("");
const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PK = new Set(PRODUKTE.map((p) => p[0]));

// ---------- Vorlagen (Preise wie brightpage.net/preise; Texte DE/EN) ----------
// art: einmal | monat · opt: als Option anbieten (Kunde kann sie bei der Annahme dazuwählen)
const V = (key, prod, preis, de, en, dde, den, extra = {}) => ({ key, prod, preis_cents: preis * 100, text: { de, en }, detail: { de: dde, en: den }, einheit: { de: "Pauschale", en: "flat fee" }, art: "einmal", ...extra });
export const VORLAGEN = [
  V("web-start", "web-start", 990, "Web Start – Website als One-Pager", "Web Start – one-page website",
    "Bis zu 6 Abschnitte, eigenes Design, Kontaktformular, Handy-optimiert, Suchmaschinen-Grundlagen, Anmeldung bei Google, Hosting 0 €. Fertig meist in 2 Wochen ab Unterlagen.",
    "Up to 6 sections, own design, contact form, mobile-optimised, search basics, Google registration, €0 hosting. Usually ready within 2 weeks of receiving your material."),
  V("web-premium", "web-premium", 2490, "Web Premium – Firmenwebsite bis 8 Seiten", "Web Premium – business website up to 8 pages",
    "Bis zu 8 Seiten, eigenes Design, Online-Editor zum Selbständern, datenschutzfreundlich ohne Tracking, Einschulung und Anleitung, Code-Übergabe auf Wunsch. Fertig meist in 3–4 Wochen ab Unterlagen.",
    "Up to 8 pages, own design, online editor, privacy-friendly without tracking, training and guide, code handover on request. Usually ready within 3–4 weeks of receiving your material."),
  V("seite", "web-premium", 150, "Zusätzliche Seite", "Additional page", "Weitere Unterseite im selben Design.", "Further page in the same design.", { einheit: { de: "Seite", en: "page" } }),
  V("shop-start", "shop-start", 2490, "Shop Start – Webshop bis 15 Produkte", "Shop Start – web shop up to 15 products",
    "Alles aus Web Start, Kartenzahlung, Apple Pay und Google Pay über Stripe (Konto auf Ihren Namen), Bestellbestätigungen per Mail, Einbindung Ihrer AGB und Widerrufsbelehrung. Fertig meist in 4 Wochen.",
    "Everything in Web Start, card payment, Apple Pay and Google Pay via Stripe (account in your name), order e-mails, your terms and withdrawal notice included. Usually ready within 4 weeks."),
  V("shop-premium", "shop-premium", 3900, "Shop Premium – Webshop bis 30 Produkte", "Shop Premium – web shop up to 30 products",
    "Alles aus Shop Start, dazu Gutscheine, Rechnungen, Produktverwaltung (Preise, Fotos, Bestand selbst pflegen). Fertig meist in 4–6 Wochen.",
    "Everything in Shop Start, plus vouchers, invoices, product management (prices, photos, stock). Usually ready within 4–6 weeks."),
  V("produkt", "shop-start", 15, "Zusätzliches Produkt im Shop", "Additional shop product", "Je weiteres Produkt über dem Paketumfang.", "Each product beyond the package.", { einheit: { de: "Stk.", en: "pcs" } }),
  V("editor", "editor", 190, "Online-Editor für Web Start", "Online editor for Web Start", "Texte, Bilder und Öffnungszeiten selbst ändern, mit Einschulung und Anleitung.", "Change texts, pictures and opening hours yourself, with training and a guide.", { opt: true }),
  V("texte-1", "texte", 190, "Texte schreiben (One-Pager)", "Copywriting (one-pager)", "Wir schreiben die Texte nach einem kurzen Gespräch, Sie geben frei.", "We write the copy after a short call, you approve it.", { opt: true }),
  V("texte-seite", "texte", 90, "Texte schreiben je Seite", "Copywriting per page", "Texte je Seite nach kurzem Gespräch, mit Freigabe.", "Copy per page after a short call, with approval.", { einheit: { de: "Seite", en: "page" }, opt: true }),
  V("fotos", "fotos", 190, "Fotos vom Betrieb", "Photos of your business", "Bei Ihnen vor Ort, bis 2 Stunden, 15 bearbeitete Bilder. Anfahrt nach amtlichem Kilometergeld extra.", "On site, up to 2 hours, 15 edited pictures. Travel at the official mileage rate extra.", { opt: true }),
  V("anfahrt", "fotos", 0.5, "Anfahrt (amtliches Kilometergeld)", "Travel (official mileage rate)", "Hin und zurück.", "Return trip.", { einheit: { de: "km", en: "km" } }),
  V("termin-a", "termin-a", 99, "Terminbuchung einbinden", "Embed your booking system",
    "Ihr bestehendes Buchungssystem (z. B. Calendly, Shore, Treatwell) als Knopf oder eingebettet auf der Website, getestet.",
    "Your existing booking system (e.g. Calendly) as a button or embedded on the website, tested.", { opt: true }),
  V("termin-b", "termin-b", 290, "Terminanfrage Plus", "Appointment request Plus",
    "Formular mit freien Wunschterminen aus Ihren Öffnungszeiten (Termindauer und Sperrtage legen Sie fest). Sie bestätigen per Mail – ohne Kalender-Synchronisation.",
    "Form offering free slots from your opening hours (you set slot length and blocked days). You confirm by e-mail – no calendar sync.", { opt: true }),
  V("gefunden-web", "gefunden", 150, "Gefunden werden (mit neuer Website)", "Get found (with a new website)",
    "Google-Unternehmensprofil, Apple Maps, Bing, HEROLD, WKO Firmen A-Z mit einheitlichen Daten, Web-Filter-Einstufung, Bewertungs-QR-Kärtchen, Kurzbericht nach 30 Tagen.",
    "Google Business Profile, Apple Maps, Bing and local directories with consistent details, web filter categorisation, review QR cards, short report after 30 days.", { opt: true }),
  V("gefunden", "gefunden", 290, "Gefunden werden", "Get found",
    "Google-Unternehmensprofil, Apple Maps, Bing, HEROLD, WKO Firmen A-Z mit einheitlichen Daten, Web-Filter-Einstufung, Bewertungs-QR-Kärtchen, Kurzbericht nach 30 Tagen.",
    "Google Business Profile, Apple Maps, Bing and local directories with consistent details, web filter categorisation, review QR cards, short report after 30 days."),
  V("werbung", "werbung", 390, "Online-Werbung starten", "Start online advertising",
    "Eine Plattform (Google oder Instagram/Facebook), eine Kampagne mit bis zu 3 Anzeigen, Werbekonto auf Ihren Namen, Messung ohne Cookies, Auswertung nach 30 Tagen mit einer Anpassung. Werbebudget zahlen Sie direkt an die Plattform.",
    "One platform (Google or Instagram/Facebook), one campaign with up to 3 ads, ad account in your name, cookie-free tracking, review after 30 days with one adjustment. You pay the ad budget directly to the platform."),
  V("werbung-2", "werbung", 190, "Zweite Werbe-Plattform", "Second ad platform", "Dieselbe Kampagne zusätzlich auf der zweiten Plattform.", "The same campaign on the second platform.", { opt: true }),
  V("newsletter", "newsletter", 490, "Newsletter-Paket", "Newsletter package",
    "Anmeldung mit Bestätigungsmail, europäisches Newsletter-Tool (z. B. Brevo), Vorlage im Website-Design, Willkommensmail, 1 Stunde Einschulung.",
    "Sign-up with confirmation e-mail, European newsletter tool (e.g. Brevo), template in your design, welcome e-mail, 1 hour of training."),
  V("newsletter-shop", "newsletter", 190, "Newsletter: Käufer automatisch auf die Liste", "Newsletter: buyers join automatically", "Mit Abwahlmöglichkeit beim Kauf.", "With an opt-out at checkout.", { opt: true }),
  V("social", "social", 290, "Social-Media-Start", "Social media start",
    "Profile auf Facebook, Instagram, LinkedIn anlegen oder aufräumen, Profil- und Titelbilder im Website-Design, Impressum-Link, 5 Beitragsvorlagen.",
    "Set up or tidy Facebook, Instagram, LinkedIn profiles, images in your website design, imprint link, 5 post templates.", { opt: true }),
  V("ki-bewertung", "ki", 390, "KI-Helfer: Bewertungs-Antworthelfer (Einrichtung)", "AI helper: review reply helper (setup)", "Einrichtung mit Ihren Infos, KI-Kennzeichnung, eine Korrekturrunde, Einschulung.", "Setup with your information, AI labelling, one correction round, training."),
  V("ki-faq", "ki", 490, "KI-Helfer: FAQ-Assistent (Einrichtung)", "AI helper: FAQ assistant (setup)", "Einrichtung mit Ihren Infos, KI-Kennzeichnung, eine Korrekturrunde, Einschulung.", "Setup with your information, AI labelling, one correction round, training."),
  V("ki-sortierer", "ki", 690, "KI-Helfer: Anfrage-Sortierer (Einrichtung)", "AI helper: enquiry sorter (setup)", "Einrichtung mit Ihren Infos, KI-Kennzeichnung, eine Korrekturrunde, Einschulung.", "Setup with your information, AI labelling, one correction round, training."),
  V("ki-angebot", "ki", 890, "KI-Helfer: Angebotsgenerator (Einrichtung)", "AI helper: quote generator (setup)", "Einrichtung mit Ihren Infos, KI-Kennzeichnung, eine Korrekturrunde, Einschulung.", "Setup with your information, AI labelling, one correction round, training."),
  V("ki-alle", "ki", 2190, "KI-Helfer: alle vier (Einrichtung)", "AI helpers: all four (setup)", "Bewertungs-Antworthelfer, FAQ-Assistent, Anfrage-Sortierer, Angebotsgenerator (statt 2.460 €).", "Review replies, FAQ assistant, enquiry sorter, quote generator (instead of €2,460)."),
  V("ki-betrieb", "ki", 29, "KI-Betrieb bis 1.000 Vorgänge", "AI operation up to 1,000 requests", "Für alle Helfer zusammen, monatlich kündbar; bei mehr Vorgängen ab Folgemonat die passende Stufe.", "For all helpers together, cancel monthly; higher tier from the following month if exceeded.", { art: "monat", einheit: { de: "Monat", en: "month" } }),
  V("ki-betrieb-2500", "ki", 59, "KI-Betrieb bis 2.500 Vorgänge", "AI operation up to 2,500 requests", "Für alle Helfer zusammen, monatlich kündbar.", "For all helpers together, cancel monthly.", { art: "monat", einheit: { de: "Monat", en: "month" } }),
  V("ki-betrieb-5000", "ki", 89, "KI-Betrieb bis 5.000 Vorgänge", "AI operation up to 5,000 requests", "Für alle Helfer zusammen, monatlich kündbar.", "For all helpers together, cancel monthly.", { art: "monat", einheit: { de: "Monat", en: "month" } }),
  V("ki-betrieb-10000", "ki", 159, "KI-Betrieb bis 10.000 Vorgänge", "AI operation up to 10,000 requests", "Für alle Helfer zusammen, monatlich kündbar; darüber auf Anfrage.", "For all helpers together, cancel monthly; above on request.", { art: "monat", einheit: { de: "Monat", en: "month" } }),
  V("stunden", "", 85, "Zusatzwünsche nach Aufwand", "Extra work by the hour", "Zweite Sprache, Sonderwünsche, Automatisierung.", "Second language, special requests, automation.", { einheit: { de: "Std.", en: "hrs" } }),
  V("service-basis", "service", 29, "Service Basis", "Service Basic", "Domain-Erinnerung, Überwachung, Sicherung, monatliche Kontrolle, Änderungen 75 €/h. Monatlich kündbar (1 Monat zum Monatsende).", "Domain reminder, monitoring, backups, monthly check, changes at €75/h. Cancel monthly.", { art: "monat", opt: true, einheit: { de: "Monat", en: "month" } }),
  V("service-komfort", "service", 59, "Service Komfort", "Service Comfort", "Alles aus Basis, 30 Minuten Änderungen im Monat, Pflege des Google-Profils. Monatlich kündbar.", "Everything in Basic, 30 minutes of changes a month, Google profile care. Cancel monthly.", { art: "monat", opt: true, einheit: { de: "Monat", en: "month" } }),
  V("service-plus", "service", 119, "Service Plus", "Service Plus", "Alles aus Komfort, 90 Minuten Änderungen im Monat, Shop-Kontrolle, Quartalsbericht. Monatlich kündbar.", "Everything in Comfort, 90 minutes of changes a month, shop checks, quarterly report. Cancel monthly.", { art: "monat", opt: true, einheit: { de: "Monat", en: "month" } }),
  V("werbe-betreuung", "werbung", 79, "Werbe-Betreuung", "Ad management", "Monatlicher Check, bis 30 Minuten Optimierung, kurzer Bericht. Monatlich kündbar.", "Monthly check, up to 30 minutes optimisation, short report. Cancel monthly.", { art: "monat", opt: true, einheit: { de: "Monat", en: "month" } }),
];
const VK = Object.fromEntries(VORLAGEN.map((v) => [v.key, v]));
// Vorschlag aus den Produkten des Auftrags
const AUTO = { "web-start": ["web-start"], "web-premium": ["web-premium"], "shop-start": ["shop-start"], "shop-premium": ["shop-premium"], editor: ["editor"], texte: ["texte-1"],
  fotos: ["fotos", "anfahrt"], "termin-a": ["termin-a"], "termin-b": ["termin-b"], gefunden: ["gefunden-web"], werbung: ["werbung"], newsletter: ["newsletter"], social: ["social"], ki: ["ki-faq", "ki-betrieb"], service: ["service-basis"] };
// Standard-Reihenfolge = Reihenfolge der Vorlagen (Website, ihre Extras, Shop, Texte, Fotos, Termine, Gefunden werden, Werbung, Newsletter, Social, KI; laufend extra)
export const RANG = Object.fromEntries(VORLAGEN.map((v, i) => [v.key, i]));
export const sortPos = (pos) => pos.map((p, i) => [p, i]).sort((a, b) => ((RANG[a[0].key] ?? 999) - (RANG[b[0].key] ?? 999)) || a[1] - b[1]).map((x) => x[0]);
// Vorschlag aus Produkten und Leitfaden-Schnellauswahl (KI-Helfer, Service-Stufe, Texte)
export function vorschlag(produkte, lang = "de", leitfaden = {}) {
  const web = produkte.some((p) => ["web-start", "web-premium", "shop-start", "shop-premium"].includes(p));
  const wahl = (k) => (leitfaden[k] && Array.isArray(leitfaden[k].wahl) ? leitfaden[k].wahl : []);
  const keys = [];
  for (const p of produkte) {
    if (p === "ki") {
      const KI = { "FAQ-Assistent": "ki-faq", "Anfrage-Sortierer": "ki-sortierer", Angebotsgenerator: "ki-angebot", "Bewertungs-Antworten": "ki-bewertung" };
      const w = wahl("ki").map((x) => KI[x]).filter(Boolean);
      keys.push(...(w.length === 4 ? ["ki-alle"] : w.length ? w : ["ki-faq"]), "ki-betrieb");
      continue;
    }
    if (p === "service") { const S = { "Service Basis": "service-basis", "Service Komfort": "service-komfort", "Service Plus": "service-plus" }; keys.push(S[wahl("service")[0]] || "service-basis"); continue; }
    if (p === "texte") { keys.push(produkte.includes("web-start") || !web ? "texte-1" : "texte-seite"); continue; }
    for (const k of AUTO[p] || []) keys.push(k === "gefunden-web" && !web ? "gefunden" : k);
  }
  const pos = sortPos([...new Set(keys)].map((k) => posFromVorlage(k, lang)));
  // Extras bleiben abwählbar wie beim Hinzufügen von Hand – außer es gäbe sonst nichts Fixes zum Annehmen (21.10.2026)
  if (!pos.some((p) => p.art === "einmal" && !p.opt)) for (const p of pos) if (p.art === "einmal") p.opt = false;
  return pos;
}
function posFromVorlage(k, lang) {
  const v = VK[k];
  return { key: v.key, text: v.text[lang], detail: v.detail[lang], menge: 1, einheit: v.einheit[lang], preis_cents: Math.round(v.preis_cents), art: v.art, opt: !!v.opt };   // laufende Posten und Extras bleiben freiwillig
}

// ---------- Datenbank ----------
let ready = false;
export async function migrateAngebot(env) {
  if (ready) return;
  await migrateBp(env); await migrateAuftrag(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bp_angebote (id TEXT PRIMARY KEY, nr TEXT UNIQUE, auftrag_id TEXT NOT NULL, token TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'entwurf',
    sprache TEXT NOT NULL DEFAULT 'de', kunde TEXT NOT NULL DEFAULT '{}', titel TEXT, text_oben TEXT, text_unten TEXT, positionen TEXT NOT NULL DEFAULT '[]',
    anzahlung_pct INTEGER NOT NULL DEFAULT 50, gueltig_tage INTEGER NOT NULL DEFAULT 30, gueltig_bis TEXT, datum TEXT, stripe_link TEXT,
    annahme TEXT, rechnung_id TEXT, created_at INTEGER NOT NULL, updated_at INTEGER, deleted INTEGER NOT NULL DEFAULT 0)`).run();
  try { await env.DB.prepare("ALTER TABLE bp_invoices ADD COLUMN token TEXT").run(); } catch {}
  try { await env.DB.prepare("ALTER TABLE bp_invoices ADD COLUMN angebot_id TEXT").run(); } catch {}   // Schlussrechnung ↔ Angebot (gegen doppelte Schlussrechnungen)   // Kundenlink je Rechnung (existiert schon → Fehler ignorieren)
  ready = true;
}
const row = (a) => ({ ...a, kunde: parse(a.kunde, {}), positionen: parse(a.positionen, []), annahme: parse(a.annahme, null) });

function cleanPos(list) {
  const out = [];
  for (const p of Array.isArray(list) ? list.slice(0, 40) : []) {
    const text = s(p.text, 200);
    if (!text) continue;
    const menge = Number(String(p.menge ?? "1").replace(",", "."));
    let preis = typeof p.preis_cents === "number" ? Math.round(p.preis_cents) : NaN;
    if (!Number.isFinite(preis)) { let t = String(p.preis ?? "").replace(/\s|€/g, ""); if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); else t = t.replace(/,/g, ""); preis = Math.round(Number(t) * 100); }
    if (!Number.isFinite(menge) || menge <= 0 || menge > 10000) throw err(`Menge prüfen: „${text.slice(0, 40)}“`);
    if (!Number.isFinite(preis) || Math.abs(preis) > 100000000) throw err(`Preis prüfen: „${text.slice(0, 40)}“`);
    out.push({ key: s(p.key, 30), text, detail: s(p.detail, 600), menge: Math.round(menge * 100) / 100, einheit: s(p.einheit, 20), preis_cents: preis,
      cents: Math.round(menge * preis), art: p.art === "monat" ? "monat" : "einmal", opt: !!p.opt });
  }
  return out;
}
function cleanKunde(k = {}) {
  let plz = s(k.plz, 10), ort = s(k.ort, 100);
  if (!plz && !ort && k.plz_ort) [plz, ort] = splitPlzOrt(s(k.plz_ort, 120));
  const land = s(k.land, 2).toUpperCase();
  if (land && !LAND_OK.has(land)) throw err("Land bitte als Kürzel aus der Liste (z. B. AT, DE, CH, GB, US).");
  return { art: k.art === "b2c" ? "b2c" : "b2b", firma: s(k.firma, 120), name: s(k.name, 120), strasse: s(k.strasse, 120), plz, ort, plz_ort: `${plz} ${ort}`.trim(),
    land: (s(k.land, 2).toUpperCase() || "AT"), uid: s(k.uid, 20).toUpperCase().replace(/[\s.\-]/g, ""), email: s(k.email, 160) };
}
// Summen: einmalig (Pflicht + gewählte Optionen) und monatlich
export function summen(pos, gewaehlt = null) {
  const on = (p, i) => !p.opt || (gewaehlt ? gewaehlt.includes(i) : false);
  let einmal = 0, monat = 0;
  pos.forEach((p, i) => { if (!on(p, i)) return; if (p.art === "monat") monat += p.cents; else einmal += p.cents; });
  return { einmal, monat };
}

async function getA(env, id) {
  const a = await env.DB.prepare("SELECT * FROM bp_angebote WHERE id=? AND deleted=0").bind(s(id, 40)).first();
  if (!a) throw err("Angebot nicht gefunden.", 404);
  return a;
}

// ---------- Admin ----------
export async function angeboteListe(env, auftragId) {
  await migrateAngebot(env);
  const list = (await env.DB.prepare("SELECT * FROM bp_angebote WHERE auftrag_id=? AND deleted=0 ORDER BY created_at DESC").bind(s(auftragId, 40)).all()).results.map(row);
  const a = await env.DB.prepare("SELECT kunde_id FROM bp_auftraege WHERE id=?").bind(s(auftragId, 40)).first();
  const kid = a && a.kunde_id;
  const rechnungen = kid ? (await env.DB.prepare("SELECT id, nr, typ, status, datum, faellig, summe_cents, bezahlt_am, bezahlt_cents, token, abzuege, abo_id FROM bp_invoices WHERE kunde_id=? AND deleted=0 ORDER BY created_at DESC").bind(kid).all()).results.map((r) => ({ ...r, abzuege: parse(r.abzuege, []) })) : [];
  const kunde = kid ? await env.DB.prepare("SELECT * FROM bp_kunden WHERE id=? AND deleted=0").bind(kid).first() : null;
  const abos = kid ? (await env.DB.prepare("SELECT * FROM bp_abos WHERE kunde_id=? ORDER BY created_at").bind(kid).all()).results : [];
  return { list: list.map((x) => ({ ...x, summen: summen(x.positionen, x.annahme ? x.annahme.gewaehlt : null) })), rechnungen, kunde, abos,
    vorlagen: VORLAGEN.map((v) => ({ key: v.key, prod: v.prod, text: v.text, detail: v.detail, einheit: v.einheit, preis_cents: Math.round(v.preis_cents), art: v.art, opt: !!v.opt })), today: today() };
}

export async function angebotSave(env, b) {
  await migrateAngebot(env);
  const id = s(b.id, 40);
  const old = id ? await getA(env, id) : null;
  if (old && !["entwurf", "gesendet", "abgelaufen"].includes(old.status)) throw err("Angenommene oder abgelehnte Angebote lassen sich nicht mehr ändern – bitte ein neues Angebot anlegen.");
  const auftrag = await env.DB.prepare("SELECT * FROM bp_auftraege WHERE id=? AND deleted=0").bind(s(old ? old.auftrag_id : b.auftrag_id, 40)).first();
  if (!auftrag) throw err("Auftrag nicht gefunden.", 404);
  const sprache = b.sprache === "en" ? "en" : b.sprache === "de" ? "de" : old ? old.sprache : auftrag.sprache || "de";
  let pos = "positionen" in b ? cleanPos(b.positionen) : old ? parse(old.positionen, []) : vorschlag(parse(auftrag.produkte, []), sprache, parse(auftrag.leitfaden, {})).map((p) => ({ ...p, cents: Math.round(p.menge * p.preis_cents) }));
  const k = "kunde" in b ? cleanKunde(b.kunde) : old ? parse(old.kunde, {}) : cleanKunde({ art: auftrag.firma ? "b2b" : "b2c", firma: auftrag.firma, name: auftrag.name, email: auftrag.email });
  const pctRaw = Number(String("anzahlung_pct" in b ? b.anzahlung_pct : old ? old.anzahlung_pct : 50).replace(",", "."));
  if (!Number.isFinite(pctRaw) || pctRaw < 0 || pctRaw > 100) throw err("Anzahlung bitte als Zahl von 0 bis 100 eintragen.");
  const pct = Math.round(pctRaw);
  const tage = Math.max(7, Math.min(90, Math.round(Number("gueltig_tage" in b ? b.gueltig_tage : old ? old.gueltig_tage : 30)) || 30));
  const stripe = "stripe_link" in b ? s(b.stripe_link, 300) : old ? old.stripe_link || "" : "";
  if (stripe && !/^https:\/\/(buy|checkout)\.stripe\.com\/[\w\-/?=&.]+$/.test(stripe)) throw err("Stripe-Link bitte als https://buy.stripe.com/… einfügen (oder leer lassen).");
  const titel = "titel" in b ? s(b.titel, 160) : old ? old.titel : (sprache === "en" ? "Your new website" : "Ihre neue Website");
  // Standardtexte (im Editor änderbar)
  const oben = "text_oben" in b ? s(b.text_oben, 2000) : old ? old.text_oben : L(sprache, "Vielen Dank für das angenehme Gespräch. Nachstehend finden Sie Ihr Angebot.", "Thank you for the pleasant conversation. Please find your quote below.");
  const unten = "text_unten" in b ? s(b.text_unten, 2000) : old ? old.text_unten : L(sprache, "Vielen Dank für Ihr Vertrauen.", "Thank you for your trust.");
  if (old) {
    await env.DB.prepare("UPDATE bp_angebote SET sprache=?, kunde=?, titel=?, text_oben=?, text_unten=?, positionen=?, anzahlung_pct=?, gueltig_tage=?, stripe_link=?, updated_at=? WHERE id=?")
      .bind(sprache, JSON.stringify(k), titel, oben, unten, JSON.stringify(pos), pct, tage, stripe, now(), old.id).run();
    return { id: old.id };
  }
  const nid = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO bp_angebote (id, auftrag_id, status, sprache, kunde, titel, text_oben, text_unten, positionen, anzahlung_pct, gueltig_tage, stripe_link, created_at, updated_at)
    VALUES (?,?,'entwurf',?,?,?,?,?,?,?,?,?,?,?)`).bind(nid, auftrag.id, sprache, JSON.stringify(k), titel, oben, unten, JSON.stringify(pos), pct, tage, stripe, now(), now()).run();
  return { id: nid };
}

async function nextNr(env) {
  const y = today().slice(0, 4);
  const r = await env.DB.prepare("SELECT nr FROM bp_angebote WHERE nr LIKE ? ORDER BY nr DESC LIMIT 1").bind(`AN-${y}-%`).first();
  return `AN-${y}-${String(r ? Number(String(r.nr).split("-")[2]) + 1 : 1).padStart(3, "0")}`;
}

// Freigeben: Nummer (einmalig), Kundenlink, Gültigkeit ab heute; Auftrag → Station „Angebot verschickt“
export async function angebotFreigeben(env, b) {
  await migrateAngebot(env);
  const a = await getA(env, b.id);
  if (!["entwurf", "gesendet", "abgelaufen"].includes(a.status)) throw err("Dieses Angebot ist schon angenommen oder abgelehnt.");
  const pos = parse(a.positionen, []);
  if (!pos.length) throw err("Bitte mindestens eine Position eintragen.");
  if (summen(pos).einmal <= 0 && !pos.some((p) => p.art === "monat")) throw err("Das Angebot hat keinen Betrag.");
  const k = parse(a.kunde, {});
  if (!k.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(k.email)) throw err("Bitte beim Kunden eine gültige E-Mail-Adresse eintragen.");
  if (summen(pos, pos.map((p, i) => i)).einmal > 100000000) throw err("Das Angebot ist höher als 1 Mio. € – bitte aufteilen.");
  const fahrt = pos.find((p) => p.key === "anfahrt" && Number(p.menge) <= 1);
  if (fahrt) throw err("Bei „Anfahrt“ stehen noch 1 km – bitte die Kilometer (hin und zurück) eintragen.");
  const t = today(), tok = a.token || token();
  let nr = a.nr;
  for (let i = 0; i < 3; i++) {
    nr = a.nr || await nextNr(env);
    try {
      await env.DB.prepare("UPDATE bp_angebote SET nr=?, token=?, status='gesendet', datum=?, gueltig_bis=?, updated_at=? WHERE id=?").bind(nr, tok, t, addDays(t, a.gueltig_tage || 30), now(), a.id).run();
      break;
    } catch (e) { if (!/UNIQUE/i.test(String(e.message)) || i === 2) throw e; }
  }
  const au = await env.DB.prepare("SELECT status FROM bp_auftraege WHERE id=?").bind(a.auftrag_id).first();
  if (au && ["neu", "kontaktiert", "gespraech"].includes(au.status)) await auftragStatus(env, { id: a.auftrag_id, status: "angebot" });
  await auftragSave(env, { id: a.auftrag_id, wert: (summen(pos).einmal / 100).toFixed(2).replace(".", ",") });
  await auftragNotiz(env, { id: a.auftrag_id, text: `Angebot ${nr} freigegeben, gültig bis ${addDays(t, a.gueltig_tage || 30).split("-").reverse().join(".")}` });
  return { id: a.id, nr, token: tok };
}

export async function angebotStatus(env, b) {
  await migrateAngebot(env);
  const a = await getA(env, b.id), st = s(b.status, 20);
  if (st === "abgelehnt" && ["entwurf", "gesendet", "abgelaufen"].includes(a.status)) {
    await env.DB.prepare("UPDATE bp_angebote SET status='abgelehnt', updated_at=? WHERE id=?").bind(now(), a.id).run();
    return { ok: true };
  }
  if (st === "loeschen" && a.status === "entwurf") { await env.DB.prepare("UPDATE bp_angebote SET deleted=1, updated_at=? WHERE id=?").bind(now(), a.id).run(); return { ok: true }; }
  throw err("Das geht in diesem Status nicht.");
}

export async function angebotVorschau(env, b) {
  await migrateAngebot(env);
  const a = row(await getA(env, b.id));
  return { html: angebotHtml(await bpConfig(env), a, { mode: "admin" }) };
}

// Kundenlink für eine ausgestellte Rechnung (z. B. Schlussrechnung)
export async function rechnungLink(env, b) {
  await migrateAngebot(env);
  const r = await env.DB.prepare("SELECT id, nr, token FROM bp_invoices WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!r || !r.nr) throw err("Nur ausgestellte Rechnungen haben einen Kundenlink.");
  if (r.token) return { token: r.token };
  const t = token();
  await env.DB.prepare("UPDATE bp_invoices SET token=? WHERE id=?").bind(t, r.id).run();
  return { token: t };
}

// Rechnung im Belegdesign für den Admin (Ansehen/Drucken)
export async function rechnungAdminHtml(env, b) {
  await migrateAngebot(env);
  const r = await env.DB.prepare("SELECT * FROM bp_invoices WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!r) throw err("Rechnung nicht gefunden.", 404);
  if (!r.nr) throw err("Entwürfe bitte im Untertab „Rechnungen“ ansehen.");
  return { html: rechnungHtml(await bpConfig(env), r, { nonce: "" }).replace(/<script[\s\S]*?<\/script>/g, "") };
}

// Schlussrechnung aus dem angenommenen Angebot: gewählte einmalige Positionen minus bezahlte Anzahlung (als Entwurf)
export async function schlussAusAngebot(env, b) {
  await migrateAngebot(env);
  const a = await env.DB.prepare("SELECT * FROM bp_angebote WHERE auftrag_id=? AND status='angenommen' AND deleted=0 ORDER BY updated_at DESC LIMIT 1").bind(s(b.auftrag_id, 40)).first();
  if (!a) throw err("Es gibt kein angenommenes Angebot zu diesem Auftrag.");
  const au = await env.DB.prepare("SELECT kunde_id FROM bp_auftraege WHERE id=?").bind(a.auftrag_id).first();
  if (!au || !au.kunde_id) throw err("Dem Auftrag ist kein Kunde zugeordnet.");
  const ex = await env.DB.prepare("SELECT nr, status FROM bp_invoices WHERE typ='schluss' AND deleted=0 AND status NOT IN ('storniert') AND (angebot_id=? OR (kunde_id=? AND abzuege LIKE ?))").bind(a.id, au.kunde_id, `%${a.rechnung_id || "§"}%`).first();
  if (ex) throw err(`Für dieses Angebot gibt es schon eine Schlussrechnung${ex.nr ? " (" + ex.nr + ")" : " (Entwurf)"}.`);
  const anz = a.rechnung_id ? await env.DB.prepare("SELECT id, status, nr FROM bp_invoices WHERE id=?").bind(a.rechnung_id).first() : null;
  if (anz && anz.status !== "bezahlt" && anz.status !== "storniert") throw err(`Die Anzahlung ${anz.nr || ""} ist noch nicht als bezahlt gebucht – zuerst in Schritt 4 buchen.`);
  const abzug = anz && anz.status === "bezahlt" ? [anz.id] : [];   // stornierte Anzahlung: Schlussrechnung ohne Abzug
  const x = row(a), lang = x.sprache === "en" ? "en" : "de", gew = (x.annahme && x.annahme.gewaehlt) || [];
  const pos = x.positionen.filter((p, i) => p.art !== "monat" && (!p.opt || gew.includes(i))).map((p) => ({ text: p.text, menge: p.menge, einheit: p.einheit, preis_cents: p.preis_cents }));
  const t = today(), von = (x.annahme && x.annahme.datum) || x.datum;
  const id = (await rechnungSave(env, { kunde_id: au.kunde_id, typ: "schluss", sprache: lang, titel: x.titel, leistung: `${dLong(von, lang)} – ${dLong(t, lang)}`,
    text_oben: L(lang, `Vielen Dank für die gute Zusammenarbeit! Laut Angebot ${x.nr} verrechnen wir die erbrachten Leistungen.`, `Thank you for the good cooperation! As agreed in quote ${x.nr}, we invoice the services provided.`),
    positionen: pos, anzahlungen: abzug })).id;
  await env.DB.prepare("UPDATE bp_invoices SET angebot_id=? WHERE id=?").bind(a.id, id).run();
  return { id };
}

// Hinweise für die Auftragsliste (laufen bald ab, abgelaufen, angenommen)
export async function angebotWarnungen(env) {
  await migrateAngebot(env);
  const t = today(), out = [];
  // hängengebliebene Annahme (Abbruch zwischen Sperre und Abschluss) nach 5 Minuten wieder freigeben
  await env.DB.prepare("UPDATE bp_angebote SET status='gesendet' WHERE status='annahme' AND updated_at < ?").bind(now() - 300000).run();
  const rows = (await env.DB.prepare("SELECT a.id, a.nr, a.status, a.gueltig_bis, a.auftrag_id, a.rechnung_id, u.nr anr, u.firma, u.name, u.status ustatus FROM bp_angebote a JOIN bp_auftraege u ON u.id=a.auftrag_id WHERE a.deleted=0 AND u.deleted=0 AND a.status='gesendet'").all()).results;
  for (const r of rows) {
    const who = `${r.anr} ${r.firma || r.name}`;
    if (r.gueltig_bis < t) {
      await env.DB.prepare("UPDATE bp_angebote SET status='abgelaufen', updated_at=? WHERE id=? AND status='gesendet'").bind(now(), r.id).run();
      out.push({ id: r.auftrag_id, text: `${who}: Angebot ${r.nr} ist abgelaufen – nachfassen oder neu freigeben` });
    } else if (r.gueltig_bis <= addDays(t, 3)) out.push({ id: r.auftrag_id, heute: 1, text: `${who}: Angebot ${r.nr} läuft am ${r.gueltig_bis.split("-").reverse().join(".")} ab` });
  }
  return out;
}

// ---------- Öffentliche Seiten (über brightpage.net/k/*) ----------
export function bpKeyOk(env, request) {
  const key = String(env.BP_INBOX_KEY || "").trim(), got = String(request.headers.get("x-bp-key") || "").trim();
  return key.length >= 24 && got === key;
}
export function htmlPage(html, status = 200, nonce = "") {
  return new Response(html, { status, headers: {
    "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer",
    "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'${nonce ? `; script-src 'nonce-${nonce}'` : ""}`,
  } });
}

const L = (lang, de, en) => (lang === "en" ? en : de);
const money = (c, lang) => (c / 100).toLocaleString(lang === "en" ? "en-GB" : "de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const dLong = (ymd, lang) => (ymd ? (lang === "en" ? new Date(ymd + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ymd.split("-").reverse().join(".")) : "");
const nl = (t) => esc(t).replace(/\n/g, "<br>");

// Gemeinsames Belegdesign (Angebot, Rechnung, später Übergabeprotokoll)
export const BELEG_CSS = `
@page{size:A4;margin:16mm 16mm 14mm}
*{box-sizing:border-box}html{background:#ECE7DC}body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:10pt;line-height:1.5;color:#15171C;margin:0;padding:24px 12px}
.sheet{max-width:200mm;margin:0 auto;background:#fff;padding:16mm 16mm 12mm;box-shadow:0 1px 3px rgba(0,0,0,.08),0 12px 40px rgba(21,23,28,.10);border-radius:4px;position:relative}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;padding-bottom:6mm;border-bottom:3px solid #15171C}
.logo svg{height:30px;width:auto;display:block}.tag{font-size:8pt;color:#6B6E76;margin-top:5px;letter-spacing:.02em}
.sender{font-size:8.5pt;color:#4A4D55;text-align:right;line-height:1.45}
.accent{height:3px;width:42mm;background:#D9820B;margin:-3px 0 9mm}
.cols{display:flex;justify-content:space-between;gap:10mm;flex-wrap:wrap}
.from{font-size:7.5pt;color:#6B6E76;border-bottom:1px solid #C9CCD2;display:inline-block;margin-bottom:2mm}
.addr{min-height:30mm}.meta{border-collapse:collapse;font-size:9pt}.meta td{padding:1.5px 0 1.5px 12px;vertical-align:top}.meta td:first-child{color:#6B6E76;padding-left:0}
.kicker{font-size:8pt;letter-spacing:.14em;text-transform:uppercase;color:#D9820B;font-weight:700;margin:9mm 0 1mm}
h1{font-size:19pt;line-height:1.2;margin:0 0 3mm;letter-spacing:-.01em}
table.pos{width:100%;border-collapse:collapse;margin-top:5mm}table.pos th{text-align:left;font-size:8pt;color:#6B6E76;text-transform:uppercase;letter-spacing:.06em;border-bottom:1.5px solid #15171C;padding:5px 4px}
table.pos th.r{text-align:right}table.pos td{padding:7px 4px;border-bottom:1px solid #E4E1DA;vertical-align:top}.r{text-align:right;white-space:nowrap;padding-left:10px!important}.tot td.r:not(:last-child){white-space:normal}
.pd{font-size:8.5pt;color:#5A5D65;margin-top:2px}.pq{display:none;font-size:9pt;color:#3D4048;margin-top:3px;font-weight:600}.optl{display:inline-block;font-size:7.5pt;font-weight:700;color:#9A5C06;background:#FBEBD3;border-radius:3px;padding:0 5px;margin-left:6px;vertical-align:1px}
tr.off td{color:#9A9DA4}tr.off .pd{color:#B0B3B9}
.tot td{border:0!important;padding:3px 4px}.tot .big td{font-weight:700;font-size:12pt;border-top:1.5px solid #15171C!important;padding-top:7px}
.box{margin-top:6mm;padding:4mm 5mm;border:1px solid #E4E1DA;border-radius:3mm;background:#FBFAF7}
.box h3{margin:0 0 2mm;font-size:10pt}
.cond{font-size:8.3pt;color:#3D4048;columns:2;column-gap:8mm}.cond p{margin:0 0 2mm;break-inside:avoid}
.vat{margin-top:4mm;font-size:8.8pt;color:#3D4048}
.pay{display:flex;gap:7mm;align-items:center}.pay svg{width:31mm;height:31mm;flex:none}.pay small{color:#6B6E76}
.foot{margin-top:10mm;border-top:1px solid #E4E1DA;padding-top:3mm;font-size:7.4pt;color:#6B6E76;display:flex;justify-content:space-between;gap:6mm}
.stamp{position:absolute;top:58mm;right:14mm;transform:rotate(-8deg);border:2.5px solid #2F7D4F;color:#2F7D4F;padding:3px 12px;border-radius:6px;font-weight:800;letter-spacing:.06em;font-size:12pt;background:rgba(255,255,255,.85)}
.stamp.grey{border-color:#9A9DA4;color:#6B6E76}
.draft{position:fixed;top:40%;left:0;right:0;text-align:center;font-size:60pt;color:rgba(179,38,30,.13);transform:rotate(-20deg);font-weight:800;pointer-events:none}
.screen{max-width:200mm;margin:0 auto 14px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;color:#15171C}
.screen .bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between}
.btn{display:inline-block;font:600 15px/1 system-ui,-apple-system,sans-serif;padding:13px 20px;border-radius:10px;border:0;background:#15171C;color:#fff;cursor:pointer;text-decoration:none}
.btn.amber{background:#D9820B;color:#15171C}.btn.ghost{background:#fff;color:#15171C;border:1px solid #C9CCD2}
.accept{max-width:200mm;margin:16px auto 0;background:#fff;border-radius:12px;padding:22px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;box-shadow:0 12px 40px rgba(21,23,28,.10);border-top:5px solid #D9820B}
.accept h2{margin:0 0 6px;font-size:21px}.accept p{line-height:1.55}
.accept .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}.accept label.f{display:block;font-size:13px;color:#4A4D55;margin-bottom:3px}
.accept input[type=text],.accept input[type=email],.accept select{width:100%;font:inherit;padding:10px 11px;border:1px solid #C9CCD2;border-radius:8px;background:#fff}
.accept .chk{display:flex;gap:10px;align-items:flex-start;margin:12px 0;line-height:1.45}.accept .chk input{width:20px;height:20px;margin-top:2px;flex:none;accent-color:#D9820B}
.accept .sum{display:flex;justify-content:space-between;font-weight:700;font-size:17px;padding:12px 0;border-top:1px solid #E4E1DA;margin-top:10px}
.err{background:#FDECEA;color:#8A1F17;padding:10px 12px;border-radius:8px;margin:10px 0}
.ok{background:#E8F4EC;color:#1F5C37;padding:12px 14px;border-radius:8px;margin:10px 0}
.small{font-size:13px;color:#5A5D65}
@media (max-width:640px){body{padding:10px 0}.screen{padding:0 10px}.sheet{padding:7mm 5mm;border-radius:0}.top{flex-direction:column}.sender{text-align:left}.cond{columns:1}.accept{border-radius:0}.accept .grid{grid-template-columns:1fr}.stamp{top:auto;bottom:10mm}table.pos td,table.pos th{padding-left:2px;padding-right:2px}table.pos{font-size:9.5pt}.c-pos,.c-menge,.c-ep,.c-abr,table.tot tr>:first-child{display:none}.pq{display:block}.meta td{padding-left:8px}}
@media print{html,body{background:#fff;padding:0}.sheet{box-shadow:none;padding:0;max-width:none}.screen,.accept,.noprint{display:none!important}.draft{position:fixed}}`;

function kopf(c, lang) {
  return `<div class="top"><div><div class="logo">${LOGO_SVG}</div><div class="tag">${esc(L(lang, "Websites, Shops und KI-Helfer für Betriebe in Österreich", "Websites, shops and AI helpers for small businesses"))}</div></div>
<div class="sender">${esc(c.firma)}<br>${esc(c.strasse)}<br>${esc(c.plz_ort)}<br>${esc(c.email)}${c.telefon ? "<br>" + esc(c.telefon) : ""}<br>${esc(c.web)}</div></div><div class="accent"></div>`;
}
function adresse(c, k) {
  return `<div class="addr"><div class="from">${esc(c.firma)} · ${esc(c.strasse)} · ${esc(c.plz_ort)}</div><br>
${k.art === "b2b" && k.firma ? `<b>${esc(k.firma)}</b><br>${k.name ? esc(k.name) + "<br>" : ""}` : `<b>${esc(k.name || k.firma)}</b><br>`}${k.strasse ? esc(k.strasse) + "<br>" : ""}${esc(k.plz_ort || `${k.plz || ""} ${k.ort || ""}`.trim())}${k.land && k.land !== "AT" ? "<br>" + esc(k.land) : ""}</div>`;
}
function fuss(c, lang) {
  return `<div class="foot"><div>${esc(c.firma)}${c.inhaber ? ", " + L(lang, "Inhaber", "owner") + " " + esc(c.inhaber) : ""}<br>${esc(c.strasse)}, ${esc(c.plz_ort)}, ${L(lang, "Österreich", "Austria")}</div>
<div>${c.fn ? L(lang, "Firmenbuch", "Company register") + " " + esc(c.fn) + (c.fb_gericht ? ", " + esc(c.fb_gericht) : "") + "<br>" : ""}${c.uid ? "UID " + esc(c.uid) : ""}</div>
<div>${esc(c.email)}<br>${esc(c.web)}${c.fusszeile ? "<br>" + esc(c.fusszeile) : ""}</div></div>`;
}

// Bedingungen = AGB (Fassung 10/2026). Eine Quelle für das Angebot und die Seite brightpage.net/k/agb.
// Geprüft 21.10.2026 gegen KSchG, FAGG (inkl. Widerrufsbutton § 13a), ABGB, UGB, UrhG, DSGVO, AI Act; Prüf-Doc „Brightpage-AGB: Prüfung“.
// Getrennt für Unternehmer (b2b) und Verbraucher (b2c): Haftungsbeschränkung, verkürzte Gewährleistung, Abnahme-Fiktion, Aufrechnungsverbot und Gerichtsstand nur bei Unternehmern.
// pct = Anzahlung in % (null = „laut Angebot“, für die AGB-Seite)
export const AGB_STAND = { de: "Fassung Oktober 2026", en: "Version October 2026" };
export function bedingungen(lang, pct, b2c) {
  const anzDe = pct === null ? "Die Anzahlung laut Angebot ist nach der Annahme fällig – die Rechnung erhalten Sie sofort. " : pct ? `${pct} % Anzahlung nach Annahme – die Rechnung erhalten Sie sofort. ` : "";
  const anzEn = pct === null ? "The advance payment stated in the quote is due on acceptance – you receive the invoice immediately. " : pct ? `${pct}% advance payment on acceptance – you receive the invoice immediately. ` : "";
  const de = [
    `<b>Geltung.</b> Diese Bedingungen gelten für Aufträge an Brightpage, ein Angebot der Mordsteam e.U.${b2c ? "" : " Abweichende Bedingungen des Kunden gelten nur, wenn wir ihnen in Textform zustimmen."} Erklärungen und Änderungen genügen in Textform (E-Mail).`,
    `<b>Preise.</b> Fixpreise in Euro laut Angebot; Steuerhinweis siehe Angebot. Monatliche Leistungen sind freiwillig und mit 1 Monat zum Monatsende kündbar.`,
    `<b>Zahlung.</b> ${anzDe}Der Rest mit der Schlussrechnung nach der Übergabe, zahlbar binnen 14 Tagen. Bei Zahlungsverzug fallen die gesetzlichen Verzugszinsen an${b2c ? "" : ", bei Unternehmern zusätzlich 40 € Pauschale"}. Laufende Leistungen dürfen wir bei Verzug nach Mahnung pausieren.${b2c ? "" : " Aufrechnen kann der Kunde nur mit von uns anerkannten oder gerichtlich festgestellten Forderungen."}`,
    `<b>Ablauf und Mitwirkung.</b> Wir beginnen, sobald ${pct === 0 ? "" : "Anzahlung und "}Unterlagen (Auftragsformular) da sind; die genannte Dauer gilt ab dann. Fehlen Unterlagen trotz Erinnerung mit 14 Tagen Nachfrist länger als 30 Tage, dürfen wir die bisher erbrachte Arbeit abrechnen und den Termin neu planen.`,
    `<b>Korrekturen.</b> Zwei Korrekturrunden sind enthalten; eine Runde ist eine gesammelte Liste von Änderungswünschen. Weitere Änderungen und Zusatzwünsche nur nach Ihrer Zustimmung, zu 85 € pro Stunde.`,
    `<b>Inhalte und Rechtstexte.</b> Texte, Bilder, Logos und Rechtstexte (Impressum, Datenschutz, AGB) liefern Sie und haben die Rechte daran${b2c ? "" : ". Erheben Dritte wegen dieser Inhalte Ansprüche gegen uns, hält uns der Kunde schad- und klaglos, außer wir haben die Rechtsverletzung selbst verschuldet"}. Wir binden sie ein. Unsere Hinweise auf fehlende Pflichtangaben sind technisch-organisatorisch und ersetzen keine rechtliche Prüfung; Rechtsberatung leisten wir nicht.`,
    `<b>Konten und Kosten Dritter.</b> Domain, Hosting-Konto, Google-Unternehmensprofil und Werbekonten lauten auf Sie; wir erhalten mit Ihrer Zustimmung in Textform (Auftragsformular) nur Verwalterrechte. Sie können diese jederzeit beenden, wir geben sie dann binnen 7 Werktagen ab. Das Google-Unternehmensprofil selbst ist kostenlos, unser Entgelt betrifft nur unsere Arbeit. Konten und Profile halten wir nie wegen offener Zahlungen zurück. Domain, E-Mail-Postfach, Werbebudget, Zahlungs- und Buchungsdienste zahlen Sie direkt an den jeweiligen Anbieter. Die Verfügbarkeit dieser Dienste ist nicht Teil unserer Leistung; es gelten deren Bedingungen.`,
    `<b>Abnahme.</b> ${b2c ? "Wir übergeben die Leistung mit dem Übergabeprotokoll, das Sie bestätigen." : "Mit dem Übergabeprotokoll. Meldet der Kunde binnen 14 Tagen nach unserer Fertigstellungsmeldung keine wesentlichen Mängel, gilt die Leistung als abgenommen – darauf weisen wir in der Fertigstellungsmeldung ausdrücklich hin. Lässt der Kunde die Website auf seinen Wunsch freischalten und nutzt sie, gilt sie ebenfalls als abgenommen. Gewährleistung für später erkennbare Mängel bleibt unberührt."}`,
    `<b>Nutzungsrechte.</b> Mit vollständiger Zahlung erhalten Sie an den für Sie individuell erstellten Leistungen (Design, Texte, individueller Code) ein ausschließliches, zeitlich und örtlich unbeschränktes, übertragbares Werknutzungsrecht für alle Nutzungsarten, einschließlich der Bearbeitung durch Dritte; den Code samt Ablage übergeben wir auf Wunsch kostenlos. An wiederverwendbaren Bausteinen und Vorlagen erhalten Sie ein nicht ausschließliches Nutzungsrecht im selben Umfang; wir dürfen sie weiterverwenden. Fremde Bestandteile (z. B. Schriften, Fotos, Open-Source-Software) unterliegen deren Lizenzen.${b2c ? "" : " Bis zur vollständigen Zahlung darf der Kunde die Leistungen nur vorläufig nutzen."}`,
    `<b>Referenz.</b> Wir dürfen Ihren Namen, Ihr Logo und Ihre Website (Link, Screenshot) als Referenz zeigen. Sie können jederzeit formlos per E-Mail widersprechen; wir entfernen die Referenz dann binnen 14 Tagen.`,
    `<b>KI-Helfer.</b> Geschuldet ist die vereinbarte Einrichtung, nicht die inhaltliche Richtigkeit jeder einzelnen Antwort. Sie liefern und prüfen die Inhalte, aus denen der Helfer antwortet, und testen ihn vor dem Start. Der Helfer weist gleich zu Beginn darauf hin, dass eine KI antwortet (AI Act Art. 50); diesen Hinweis dürfen Sie nicht entfernen.`,
    `<b>Datenschutz.</b> Soweit wir personenbezogene Daten in Ihrem Auftrag verarbeiten (z. B. Formularanfragen, KI-Helfer, Wartung), gilt unsere Vereinbarung zur Auftragsverarbeitung nach Art. 28 DSGVO (brightpage.net/k/av); sie ist Teil des Auftrags.`,
    `<b>Gewährleistung.</b> ${b2c ? "Es gelten die gesetzlichen Gewährleistungsbestimmungen." : "Es gilt die gesetzliche Gewährleistung mit einer Frist von 12 Monaten ab Übergabe; Mängel meldet der Kunde bitte binnen 14 Tagen ab Erkennen. Wir beheben Mängel zunächst durch Verbesserung. Gelingt das zweimal nicht, kann der Kunde Preisminderung oder bei nicht geringfügigen Mängeln Wandlung verlangen."}`,
    `<b>Haftung.</b> ${b2c ? "Wir haften nach den gesetzlichen Bestimmungen." : "Wir haften – auch für unsere Gehilfen – nur bei Vorsatz und grober Fahrlässigkeit; für Personenschäden haften wir nach dem Gesetz."} Eine bestimmte Platzierung bei Google oder einen bestimmten Werbeerfolg schulden wir nicht.`,
    `<b>Höhere Gewalt.</b> Bei höherer Gewalt ruhen die Leistungspflichten beider Seiten. Dauert sie länger als 2 Monate, können beide Seiten vom noch nicht erfüllten Teil zurücktreten.`,
    `<b>Recht${b2c ? "" : " und Gericht"}.</b> ${b2c ? "Es gilt österreichisches Recht; zwingende Verbraucherschutzbestimmungen des Staates, in dem Sie Ihren gewöhnlichen Aufenthalt haben, bleiben unberührt." : "Es gilt österreichisches Recht unter Ausschluss der Verweisungsnormen und des UN-Kaufrechts. Gerichtsstand ist das für 7152 Pamhagen sachlich zuständige Gericht."} Ist eine Bestimmung unwirksam, bleiben die übrigen gültig.`,
  ];
  const en = [
    `<b>Scope.</b> These terms apply to orders placed with Brightpage, a service of Mordsteam e.U.${b2c ? "" : " The client's own terms only apply if we agree to them in text form."} Notices and changes in text form (e-mail) are sufficient.`,
    `<b>Prices.</b> Fixed prices in euros as quoted; see the tax note in the quote. Monthly services are optional and can be cancelled with 1 month's notice to the end of a month.`,
    `<b>Payment.</b> ${anzEn}The balance with the final invoice after handover, payable within 14 days. Late payment incurs statutory default interest${b2c ? "" : ", for businesses plus a €40 flat fee"}. We may pause ongoing services after a reminder.${b2c ? "" : " The client may only set off claims that we have acknowledged or that have been established by a court."}`,
    `<b>Process and cooperation.</b> We start once ${pct === 0 ? "" : "the advance payment and "}your material (order form) have arrived; stated durations apply from then. If material is still missing more than 30 days after a reminder with a 14-day deadline, we may invoice the work done so far and reschedule.`,
    `<b>Corrections.</b> Two rounds of corrections are included; one round is a single collected list of change requests. Further changes and extra requests only with your approval, at €85 per hour.`,
    `<b>Content and legal texts.</b> You supply texts, pictures, logos and legal texts (imprint, privacy policy, terms) and hold the rights${b2c ? "" : ". If third parties raise claims against us because of this content, the client indemnifies us unless we caused the infringement ourselves"}. We include them. Our notes on missing mandatory information are technical and organisational and do not replace a legal review; we do not give legal advice.`,
    `<b>Accounts and third-party costs.</b> Domain, hosting account, Google Business Profile and ad accounts are in your name; with your consent in text form (order form) we only receive manager rights. You can end these at any time and we give them up within 7 working days. The Google Business Profile itself is free; our fee covers only our work. We never withhold accounts or profiles because of unpaid invoices. Domain, mailbox, ad budget, payment and booking services are paid by you directly to the provider. The availability of these services is not part of our work; their own terms apply.`,
    `<b>Acceptance.</b> ${b2c ? "We hand over the work with the handover record, which you confirm." : "With the handover record. If the client reports no material defects within 14 days of our notice of completion, the work is deemed accepted – we point this out expressly in that notice. If the client has the website published at their request and uses it, it is also deemed accepted. Warranty for defects discovered later remains unaffected."}`,
    `<b>Rights of use.</b> On full payment you receive an exclusive, transferable right to use the work created individually for you (design, texts, custom code) without limitation in time or territory and for all types of use, including modification by third parties; we hand over the code and its repository free of charge on request. For reusable components and templates you receive a non-exclusive right of the same scope; we may reuse them. Third-party components (e.g. fonts, photos, open-source software) are subject to their licences.${b2c ? "" : " Until full payment the client may only use the work provisionally."}`,
    `<b>Reference.</b> We may show your name, logo and website (link, screenshot) as a reference. You can object informally by e-mail at any time; we then remove the reference within 14 days.`,
    `<b>AI helpers.</b> We owe the agreed setup, not the factual accuracy of every single answer. You supply and check the content the helper answers from and test it before launch. The helper states at the start that an AI is answering (AI Act Art. 50); you may not remove this notice.`,
    `<b>Data protection.</b> Where we process personal data on your behalf (e.g. form enquiries, AI helpers, maintenance), our data processing agreement under Art. 28 GDPR applies (brightpage.net/k/av?lang=en); it is part of the order.`,
    `<b>Warranty.</b> ${b2c ? "Statutory warranty rights apply." : "Statutory warranty applies for 12 months from handover; please report defects within 14 days of discovery. We first remedy defects by repair. If this fails twice, the client may demand a price reduction or, for defects that are not minor, rescission."}`,
    `<b>Liability.</b> ${b2c ? "We are liable in accordance with the law." : "We – including our agents – are only liable for intent and gross negligence; for personal injury we are liable in accordance with the law."} We do not owe any particular Google ranking or advertising result.`,
    `<b>Force majeure.</b> In the event of force majeure both parties' obligations are suspended. If it lasts longer than 2 months, either party may withdraw from the part not yet performed.`,
    `<b>Law${b2c ? "" : " and jurisdiction"}.</b> ${b2c ? "Austrian law applies; mandatory consumer protection rules of the country of your habitual residence remain unaffected." : "Austrian law applies, excluding its conflict-of-law rules and the UN Convention on Contracts for the International Sale of Goods. Place of jurisdiction is the competent court for 7152 Pamhagen, Austria."} If a provision is invalid, the others remain valid.`,
  ];
  return (lang === "en" ? en : de).map((x) => `<p>${x}</p>`).join("");
}
export function widerruf(lang, c) {
  const k = "https://brightpage.net/k/";
  return lang === "en"
    ? `<p><b>Right of withdrawal (consumers).</b> You may withdraw from this contract within 14 days without giving reasons. The period starts on the day the contract is concluded (your acceptance). To withdraw, send us a clear statement (e.g. an e-mail to ${esc(c.email)} or a letter to ${esc(c.firma)}, ${esc(c.strasse)}, ${esc(c.plz_ort)}). You can also withdraw online with the button “Withdraw from contract” at <a href="${k}widerrufen?lang=en" target="_blank" rel="noopener">brightpage.net/k/widerrufen</a>; we confirm receipt immediately by e-mail. You may use the <a href="${k}widerruf?lang=en" target="_blank" rel="noopener">model withdrawal form</a>, but you don't have to. Sending the withdrawal before the period ends is sufficient. If you withdraw, we refund all payments within 14 days. If you asked us to start during the withdrawal period, you pay an appropriate amount corresponding to the share of the services provided until your withdrawal. The right of withdrawal expires once we have fully performed the service, if you expressly requested the early start and confirmed before we began that you are aware you lose your right of withdrawal on full performance.</p>`
    : `<p><b>Widerrufsrecht (Verbraucher).</b> Sie können binnen 14 Tagen ohne Angabe von Gründen vom Vertrag zurücktreten. Die Frist beginnt mit dem Tag des Vertragsabschlusses (Ihrer Annahme). Dazu genügt eine eindeutige Erklärung (z. B. E-Mail an ${esc(c.email)} oder Brief an ${esc(c.firma)}, ${esc(c.strasse)}, ${esc(c.plz_ort)}). Sie können auch online über die Schaltfläche „Vertrag widerrufen“ unter <a href="${k}widerrufen" target="_blank" rel="noopener">brightpage.net/k/widerrufen</a> widerrufen; wir bestätigen den Eingang sofort per E-Mail. Sie können das <a href="${k}widerruf" target="_blank" rel="noopener">Muster-Widerrufsformular</a> verwenden, müssen aber nicht. Es reicht, den Widerruf vor Fristende abzusenden. Bei Widerruf erstatten wir alle Zahlungen binnen 14 Tagen. Haben Sie verlangt, dass wir schon während der Frist beginnen, zahlen Sie einen angemessenen Betrag, der dem Anteil der bis zum Widerruf erbrachten Leistungen entspricht. Das Widerrufsrecht erlischt, wenn wir die Leistung vollständig erbracht haben, nachdem Sie ausdrücklich den vorzeitigen Beginn verlangt und vor Beginn bestätigt haben, zur Kenntnis genommen zu haben, dass Sie Ihr Widerrufsrecht mit vollständiger Vertragserfüllung verlieren.</p>`;
}

const PAUSCH = new Set(["", "pauschale", "pauschal", "flat fee", "flat rate"]);
const istPauschal = (p) => Number(p.menge) === 1 && PAUSCH.has(String(p.einheit || "").trim().toLowerCase());
const PLURAL = { Seite: "Seiten", "Seite(n)": "Seiten", page: "pages", "page(s)": "pages", Monat: "Monate", month: "months", Stunde: "Stunden" };
function mengeText(p, lang) {
  const m = Number(p.menge), e = String(p.einheit || "").trim(), z = String(m).replace(".", lang === "en" ? "." : ",");
  const unit = m === 1 ? e.replace("(n)", "").replace("(s)", "") : PLURAL[e] || e.replace("(n)", "n").replace("(s)", "s");
  return `${z} ${unit}`.trim();
}

// mode: admin (Vorschau) | public (mit Annahme-Formular) · opts: fehler, werte (Formularwerte nach Fehler), nonce
export function angebotHtml(c, a, opts = {}) {
  const lang = a.sprache === "en" ? "en" : "de", T = (de, en) => L(lang, de, en), k = a.kunde || {}, pos = a.positionen || [];
  const angenommen = a.status === "angenommen", gew = angenommen && a.annahme ? a.annahme.gewaehlt || [] : null;
  const offen = opts.mode === "public" && a.status === "gesendet" && a.gueltig_bis >= today();
  const w = opts.werte || null;
  const sel = (i) => (w ? (w.gewaehlt || []).includes(i) : gew ? gew.includes(i) : false);
  const sm = summen(pos, pos.map((p, i) => i).filter(sel));
  const hasOpt = pos.some((p) => p.opt), hasMon = pos.some((p) => p.art === "monat");
  const b2c = k.art === "b2c";
  const vatKey = regimeOf({ land: (w && w.land) || k.land || "AT", art: k.art, uid: (w && w.uid) || k.uid });
  const einmal = pos.map((p, i) => [p, i]).filter(([p]) => p.art !== "monat"), monat = pos.map((p, i) => [p, i]).filter(([p]) => p.art === "monat");
  const nr = new Map([...einmal, ...monat].map(([, i], n) => [i, n + 1]));   // fortlaufend: erst einmalige, dann laufende Positionen
  // Pauschale: nur „Pauschale“ und Betrag; Mengen-Positionen (z. B. 2 Seiten) zusätzlich Einzelpreis. Am Handy: Leistung + Betrag, Menge × Preis unter der Beschreibung.
  const posRow = (p, i) => {
    const on = !p.opt || sel(i), pausch = istPauschal(p), mg = mengeText(p, lang), q = !pausch ? `${mg} × ${money(p.preis_cents, lang)}` : "";
    const head = `<td class="c-pos">${nr.get(i)}</td><td><b>${esc(p.text)}</b>${p.opt ? `<span class="optl">${T("Option", "Option")}</span>` : ""}${p.detail ? `<div class="pd">${nl(p.detail)}</div>` : ""}`;
    if (p.art === "monat") return `<tr class="${on ? "" : "off"}" data-row="${i}">${head}<div class="pq">${T("monatlich", "monthly")}${p.menge !== 1 ? " · " + esc(mg) : ""}</div></td><td class="r c-abr">${T("monatlich", "monthly")}${p.menge !== 1 ? `<br><span class="pd">${esc(mg)}</span>` : ""}</td><td class="r">${money(p.cents, lang)}</td></tr>`;
    return `<tr class="${on ? "" : "off"}" data-row="${i}">${head}${q ? `<div class="pq">${esc(q)}</div>` : ""}</td><td class="r c-menge">${pausch ? T("Pauschale", "Flat fee") : esc(mg)}</td><td class="r c-ep">${pausch ? "" : money(p.preis_cents, lang)}</td><td class="r">${money(p.cents, lang)}</td></tr>`;
  };
  const titel = T("Angebot", "Quote");
  const stamp = angenommen ? `<div class="stamp">${T("ANGENOMMEN", "ACCEPTED")} ${dLong(a.annahme && a.annahme.datum, lang)}</div>`
    : a.status === "abgelaufen" || (a.status === "gesendet" && a.gueltig_bis < today()) ? `<div class="stamp grey">${T("ABGELAUFEN", "EXPIRED")}</div>` : a.status === "abgelehnt" ? `<div class="stamp grey">${T("NICHT ANGENOMMEN", "DECLINED")}</div>` : "";
  const sheet = `<div class="sheet">${a.status === "entwurf" ? `<div class="draft">${T("ENTWURF", "DRAFT")}</div>` : ""}${stamp}
${kopf(c, lang)}
<div class="cols">${adresse(c, k)}
<table class="meta"><tr><td>${T("Angebotsnummer", "Quote no.")}</td><td><b>${esc(a.nr || T("(Entwurf)", "(draft)"))}</b></td></tr>
<tr><td>${T("Datum", "Date")}</td><td>${dLong(a.datum || today(), lang)}</td></tr>
<tr><td>${T("Gültig bis", "Valid until")}</td><td>${dLong(a.gueltig_bis || addDays(today(), a.gueltig_tage || 30), lang)}</td></tr>
<tr><td>${T("Ansprechperson", "Contact")}</td><td>Martin Kriegler</td></tr></table></div>
<div class="kicker">${titel}</div><h1>${esc(a.titel || "")}</h1>
${a.text_oben ? `<p>${nl(a.text_oben)}</p>` : ""}${hasOpt && !angenommen ? `<p class="pd" style="margin-top:-2mm">${T("Mit „Option“ markierte Positionen können Sie bei der Annahme dazuwählen.", "Items marked “Option” can be added when you accept.")}</p>` : ""}
<table class="pos"><tr><th class="c-pos" style="width:6%">${T("Pos.", "Item")}</th><th>${T("Leistung", "Service")}</th><th class="r c-menge">${T("Menge", "Qty")}</th><th class="r c-ep">${T("Einzelpreis", "Unit price")}</th><th class="r">${T("Betrag", "Amount")}</th></tr>
${einmal.map(([p, i]) => posRow(p, i)).join("")}</table>
<table class="pos tot"><tr class="big"><td></td><td class="r">${T("Gesamt einmalig", "Total one-off")}${hasOpt ? T(" (mit gewählten Optionen)", " (with selected options)") : ""}</td><td class="r" style="width:30mm" data-sum="einmal">${money(sm.einmal, lang)}</td></tr>
${a.anzahlung_pct ? `<tr><td></td><td class="r">${T(`davon ${a.anzahlung_pct} % Anzahlung bei Annahme`, `of which ${a.anzahlung_pct}% advance payment on acceptance`)}</td><td class="r" data-sum="anz">${money(Math.round(sm.einmal * a.anzahlung_pct / 100), lang)}</td></tr>` : ""}</table>
${hasMon ? `<table class="pos" style="margin-top:7mm"><tr><th class="c-pos" style="width:6%"></th><th>${T("Laufend nach dem Go-live (freiwillig)", "Ongoing after go-live (optional)")}</th><th class="r c-abr">${T("Abrechnung", "Billing")}</th><th class="r">${T("Betrag", "Amount")}</th></tr>
${monat.map(([p, i]) => posRow(p, i)).join("")}</table>
<table class="pos tot"><tr><td></td><td class="r"><b>${T("Monatlich", "Monthly")}</b></td><td class="r" style="width:30mm" data-sum="monat"><b>${money(sm.monat, lang)}</b></td></tr></table>` : ""}
<p class="vat" id="vatline">${esc(VAT_LINE[lang][vatKey] || "")}</p>
${a.text_unten ? `<p>${nl(a.text_unten)}</p>` : ""}
<div class="box"><h3>${T("Bedingungen (AGB, ", "Terms (")}${AGB_STAND[lang]}) <a class="noprint" href="https://brightpage.net/k/agb${lang === "en" ? "?lang=en" : ""}" target="_blank" rel="noopener" style="font-size:12px;font-weight:400;color:#9A5C06">${T("als eigene Seite", "as a separate page")}</a></h3><div class="cond">${bedingungen(lang, a.anzahlung_pct, b2c)}</div>${b2c ? `<div class="cond" style="columns:1;margin-top:2mm">${widerruf(lang, c)}</div>` : ""}</div>
${angenommen && a.annahme ? `<p class="vat">${T("Online angenommen am", "Accepted online on")} ${dLong(a.annahme.datum, lang)} ${T("um", "at")} ${esc(a.annahme.zeit || "")} ${T("von", "by")} <b>${esc(a.annahme.name)}</b>${a.annahme.fruehstart ? T(" – vorzeitiger Beginn verlangt, Verlust des Widerrufsrechts bei vollständiger Erfüllung zur Kenntnis genommen", " – early start requested, loss of the right of withdrawal on full performance acknowledged") : ""}.</p>` : ""}
${fuss(c, lang)}</div>`;

  let form = "";
  if (offen) {
    const v = (f) => esc(w ? w[f] ?? "" : k[f] ?? "");
    form = `<form class="accept" method="post" id="acc">
<h2>${T("Angebot annehmen", "Accept the quote")}</h2>
<p class="small">${T("Bitte prüfen Sie die Rechnungsdaten. Nach dem Klick erhalten Sie sofort die Anzahlungsrechnung – zahlbar per Überweisung oder QR-Code.", "Please check your billing details. After clicking you immediately receive the advance invoice – payable by bank transfer or QR code.")}</p>
${opts.fehler ? `<div class="err" role="alert">${esc(opts.fehler)}</div>` : ""}
${hasOpt ? `<h3 style="margin:16px 0 4px;font-size:16px">${T("Optionen dazuwählen", "Add options")}</h3>${pos.map((p, i) => (p.opt ? `<label class="chk"><input type="checkbox" name="opt" value="${i}" ${sel(i) ? "checked" : ""} data-c="${p.cents}" data-m="${p.art === "monat" ? 1 : 0}"><span><b>${esc(p.text)}</b> – ${money(p.cents, lang)}${p.art === "monat" ? T(" pro Monat", " per month") : ""}${p.detail ? `<br><span class="small">${esc(p.detail)}</span>` : ""}</span></label>` : "")).join("")}` : ""}
<h3 style="margin:16px 0 8px;font-size:16px">${T("Rechnungsdaten", "Billing details")}</h3>
<div class="grid">
${k.art === "b2b" ? `<div><label class="f" for="f-firma">${T("Firma / Verein", "Company / organisation")} *</label><input type="text" id="f-firma" name="firma" required maxlength="120" value="${v("firma")}" autocomplete="organization"></div>` : k.firma ? `<div><label class="f" for="f-firma">${T("Verein (falls Sie für einen Verein bestellen)", "Club or association (if ordering for one)")}</label><input type="text" id="f-firma" name="firma" maxlength="120" value="${v("firma")}" autocomplete="organization"></div>` : ""}
<div><label class="f" for="f-name">${k.art === "b2b" ? T("Ansprechperson", "Contact person") : T("Name", "Name") + " *"}</label><input type="text" id="f-name" name="name" ${k.art === "b2b" ? "" : "required"} maxlength="120" value="${v("name")}" autocomplete="name"></div>
<div><label class="f" for="f-str">${T("Straße und Hausnummer", "Street and number")} *</label><input type="text" id="f-str" name="strasse" required maxlength="120" value="${v("strasse")}" autocomplete="street-address"></div>
<div style="display:grid;grid-template-columns:110px 1fr;gap:10px"><div><label class="f" for="f-plz">${T("PLZ", "Postcode")} *</label><input type="text" id="f-plz" name="plz" required maxlength="10" inputmode="numeric" value="${v("plz")}" autocomplete="postal-code"></div>
<div><label class="f" for="f-ort">${T("Ort", "Town")} *</label><input type="text" id="f-ort" name="ort" required maxlength="100" value="${v("ort")}" autocomplete="address-level2"></div></div>
<div><label class="f" for="f-land">${T("Land", "Country")}</label><select id="f-land" name="land">${LAENDER.map(([c2, de, en], i) => `${i === 7 ? '<option disabled>──────────</option>' : ""}<option value="${c2}" ${(w ? w.land : k.land || (lang === "en" ? "GB" : "AT")) === c2 ? "selected" : ""}>${lang === "en" ? en : de}</option>`).join("")}</select></div>
${k.art === "b2b" ? `<div><label class="f" for="f-uid">${T("UID-Nummer (falls vorhanden)", "VAT ID (if any)")}</label><input type="text" id="f-uid" name="uid" maxlength="20" value="${v("uid")}"></div>` : ""}
<div><label class="f" for="f-mail">${T("E-Mail für Rechnungen", "E-mail for invoices")} *</label><input type="email" id="f-mail" name="email" required maxlength="160" value="${v("email")}" autocomplete="email"></div>
</div>
<h3 style="margin:18px 0 6px;font-size:16px">${T("Bestätigung", "Confirmation")}</h3>
<div><label class="f" for="f-sig">${T("Ihr Vor- und Nachname (gilt als Unterschrift)", "Your full name (serves as signature)")} *</label><input type="text" id="f-sig" name="unterschrift" required maxlength="120" value="${esc(w ? w.unterschrift || "" : "")}" autocomplete="name"></div>
<label class="chk"><input type="checkbox" name="agb" value="1" required ${w && w.agb ? "checked" : ""}><span>${T(`Ich nehme das Angebot ${esc(a.nr)} mit den oben genannten Bedingungen an${k.art === "b2b" ? " und bin berechtigt, für die genannte Firma bzw. den Verein zu bestellen" : ""}.`, `I accept quote ${esc(a.nr)} with the terms above${k.art === "b2b" ? " and am authorised to order for the organisation named" : ""}.`)}</span></label>
${b2c ? `<p class="small" style="margin:14px 0 2px">${T("Nur wenn wir schon vor Ende der 14-tägigen Widerrufsfrist beginnen sollen – ohne Häkchen beginnen wir nach Ablauf der Frist:", "Only if we should start before the 14-day withdrawal period ends – without ticks we start after the period:")}</p>
<label class="chk"><input type="checkbox" name="fruehstart" value="1" ${w && w.fruehstart ? "checked" : ""}><span>${T("Ich verlange ausdrücklich, dass Brightpage schon vor Ablauf der Widerrufsfrist mit der Leistung beginnt. Bei einem Widerruf zahle ich einen anteiligen Betrag für die bis dahin erbrachten Leistungen.", "I expressly request that Brightpage starts the work before the withdrawal period ends. If I withdraw, I pay a proportionate amount for the work done until then.")}</span></label>
<label class="chk"><input type="checkbox" name="kenntnis" value="1" ${w && w.kenntnis ? "checked" : ""}><span>${T("Mir ist bekannt, dass ich mein Widerrufsrecht verliere, sobald Brightpage den Vertrag vollständig erfüllt hat.", "I am aware that I lose my right of withdrawal once Brightpage has fully performed the contract.")}</span></label>` : ""}
<div class="sum"><span>${T("Gesamt einmalig", "Total one-off")}</span><span data-sum="einmal">${money(sm.einmal, lang)}</span></div>
${a.anzahlung_pct ? `<div class="small" style="margin:-6px 0 12px">${T(`Anzahlung ${a.anzahlung_pct} % jetzt:`, `Advance ${a.anzahlung_pct}% now:`)} <b data-sum="anz">${money(Math.round(sm.einmal * a.anzahlung_pct / 100), lang)}</b>${hasMon ? ` · ${T("monatlich", "monthly")} <b data-sum="monat">${money(sm.monat, lang)}</b>` : ""}</div>` : ""}
<button class="btn amber" type="submit" style="width:100%;font-size:17px;padding:16px">${T("Angebot zahlungspflichtig annehmen", "Accept quote with obligation to pay")}</button>
<p class="small" style="margin-top:10px">${T("Bis zum Klick können Sie alle Eingaben ändern. Dieses Angebot bleibt als Vertragstext unter diesem Link abrufbar (Vertragssprache Deutsch); nach der Annahme erhalten Sie eine Bestätigung per Mail.", "You can change all entries until you click. This quote remains available as the contract text under this link (contract language: German or English as shown); you receive a confirmation by e-mail after acceptance.")}</p>
<p class="small" style="margin-top:10px">${T("Fragen? Einfach antworten auf unsere Mail oder", "Questions? Just reply to our e-mail or write to")} <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>.</p>
</form>
<script nonce="${opts.nonce}">(function(){var f=document.getElementById("acc");if(!f)return;var pct=${Number(a.anzahlung_pct) || 0},base=${summen(pos, []).einmal},baseM=${summen(pos, []).monat},lang="${lang}";
function m(c){return(c/100).toLocaleString(lang==="en"?"en-GB":"de-AT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"}
function up(){var e=base,mo=baseM;f.querySelectorAll('input[name=opt]').forEach(function(x){var r=document.querySelector('tr[data-row="'+x.value+'"]');if(r)r.className=x.checked?"":"off";if(x.checked){if(x.dataset.m==="1")mo+=+x.dataset.c;else e+=+x.dataset.c}});
document.querySelectorAll('[data-sum=einmal]').forEach(function(x){x.textContent=m(e)});document.querySelectorAll('[data-sum=anz]').forEach(function(x){x.textContent=m(Math.round(e*pct/100))});document.querySelectorAll('[data-sum=monat]').forEach(function(x){x.textContent=m(mo)})}
// Steuerhinweis live nach Land und UID (Nachttest 21.10.2026, UX4) – gleiche Regel wie regimeOf()
var VL=${JSON.stringify(VAT_LINE[lang]).replace(/</g, "\\u003c")},EUL=${JSON.stringify(EU)},art="${k.art === "b2c" ? "b2c" : "b2b"}";
function vat(){var ld=(f.land&&f.land.value||"AT").toUpperCase(),uid=f.uid?f.uid.value.trim():"",key=ld==="AT"?"ku":EUL.indexOf(ld)>=0?(art==="b2b"&&uid?"rc_eu":"ku"):(art==="b2b"?"dl_b2b":"dl_b2c");var el=document.getElementById("vatline");if(el)el.textContent=VL[key]||""}
f.addEventListener("input",vat);f.addEventListener("change",vat);vat();
f.addEventListener("change",up);f.addEventListener("submit",function(){var b=f.querySelector("button[type=submit]");setTimeout(function(){b.disabled=true;b.textContent="…"},0)});})();</script>`;
  } else if (opts.mode === "public") {
    form = `<div class="accept">${angenommen
      ? `<h2>${T("Vielen Dank – Ihr Auftrag ist bestätigt.", "Thank you – your order is confirmed.")}</h2>${opts.rechnungToken ? `<p><a class="btn amber" href="/k/rechnung/${esc(opts.rechnungToken)}">${T("Anzahlungsrechnung ansehen", "View advance invoice")}</a></p>` : ""}`
      : a.status === "annahme" ? `<h2>${T("Ihre Annahme wird gerade verarbeitet …", "Your acceptance is being processed …")}</h2><p>${T("Bitte laden Sie die Seite in ein paar Sekunden neu – dann sehen Sie Ihre Rechnung.", "Please reload the page in a few seconds to see your invoice.")}</p>`
      : a.status === "abgelehnt" ? `<h2>${T("Dieses Angebot ist nicht mehr aktiv.", "This quote is no longer active.")}</h2><p>${T("Schreiben Sie uns gerne, wenn Sie ein neues Angebot möchten:", "Write to us if you'd like a new quote:")} <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`
      : `<h2>${T("Dieses Angebot ist abgelaufen.", "This quote has expired.")}</h2><p>${T("Kein Problem – schreiben Sie uns kurz, dann schicken wir es Ihnen aktualisiert:", "No problem – drop us a line and we'll send an updated version:")} <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`}</div>`;
  }
  const bar = opts.mode === "public" ? `<div class="screen noprint"><div class="bar"><span><b>${esc(a.nr || "")}</b> · ${esc(c.marke || "Brightpage")}</span>${offen ? `<a class="btn" href="#acc">${T("Zur Annahme", "Go to acceptance")} ↓</a>` : ""}</div></div>` : "";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)} ${esc(a.nr || "")} · ${esc(c.marke || "Brightpage")}</title><style>${BELEG_CSS}</style></head><body>${bar}${sheet}${form}</body></html>`;
}

// EPC-QR (Zahlen mit Code) serverseitig
function epcSvg(c, cents, ref) {
  if (!c.iban || cents <= 0) return "";
  const lines = ["BCD", "002", "1", "SCT", c.bic || "", (c.firma || "").slice(0, 70), c.iban, "EUR" + (cents / 100).toFixed(2), "", "", String(ref || "").slice(0, 140)];
  try {
    const q = qrcode(0, "M");
    q.addData(unescape(encodeURIComponent(lines.join("\n"))));
    q.make();
    return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  } catch { return ""; }
}

export function rechnungHtml(c, r, opts = {}) {
  const lang = r.sprache === "en" ? "en" : "de", T = (de, en) => L(lang, de, en), k = parse(r.kunde, {}), pos = parse(r.positionen, []), abz = parse(r.abzuege, []);
  const titel = { rechnung: T("Rechnung", "Invoice"), anzahlung: T("Anzahlungsrechnung", "Advance invoice"), schluss: T("Schlussrechnung", "Final invoice"), storno: T("Stornorechnung", "Cancellation invoice") }[r.typ] || T("Rechnung", "Invoice");
  const brutto = pos.reduce((x, p) => x + p.cents, 0), offen = r.status === "offen";
  const qr = offen ? epcSvg(c, r.summe_cents, r.nr) : "";
  const stamp = r.status === "bezahlt" ? `<div class="stamp">${T("BEZAHLT", "PAID")} ${dLong(r.bezahlt_am, lang)}</div>` : r.status === "storniert" ? `<div class="stamp grey">${T("STORNIERT", "CANCELLED")}</div>` : "";
  const sheet = `<div class="sheet">${stamp}${kopf(c, lang)}
<div class="cols">${adresse(c, k)}
<table class="meta"><tr><td>${T("Rechnungsnummer", "Invoice no.")}</td><td><b>${esc(r.nr)}</b></td></tr>
<tr><td>${T("Rechnungsdatum", "Invoice date")}</td><td>${dLong(r.datum, lang)}</td></tr>
<tr><td>${r.typ === "anzahlung" ? T("Leistung", "Service") : T("Leistungszeitraum", "Service period")}</td><td>${esc(r.leistung || dLong(r.datum, lang))}</td></tr>
${r.typ !== "storno" ? `<tr><td>${T("Fällig am", "Due date")}</td><td>${dLong(r.faellig, lang)}</td></tr>` : ""}
${k.uid ? `<tr><td>${T("UID Kunde", "Customer VAT ID")}</td><td>${esc(k.uid)}</td></tr>` : ""}${c.uid ? `<tr><td>${T("Unsere UID", "Our VAT ID")}</td><td>${esc(c.uid)}</td></tr>` : ""}</table></div>
<div class="kicker">${titel}</div><h1>${esc(r.titel || "")}</h1>
${r.text_oben ? `<p>${nl(r.text_oben)}</p>` : ""}
<table class="pos"><tr><th class="c-pos" style="width:6%">${T("Pos.", "Item")}</th><th>${T("Leistung", "Description")}</th><th class="r c-menge">${T("Menge", "Qty")}</th><th class="r c-ep">${T("Einzelpreis", "Unit price")}</th><th class="r">${T("Betrag", "Amount")}</th></tr>
${pos.map((p, i) => `<tr><td class="c-pos">${i + 1}</td><td>${nl(p.text)}<div class="pq">${esc(mengeText(p, lang))} × ${money(p.preis_cents, lang)}</div></td><td class="r c-menge">${esc(mengeText(p, lang))}</td><td class="r c-ep">${money(p.preis_cents, lang)}</td><td class="r">${money(p.cents, lang)}</td></tr>`).join("")}</table>
<table class="pos tot">${abz.length ? `<tr><td></td><td class="r">${T("Summe", "Subtotal")}</td><td class="r" style="width:30mm">${money(brutto, lang)}</td></tr>
${abz.map((x) => `<tr><td></td><td class="r">${x.cents < 0 ? T("Rücknahme Abzug Anzahlung", "reversal of advance payment") : T("abzüglich Anzahlung", "less advance payment")} ${esc(x.nr)} ${T("vom", "of")} ${dLong(x.datum, lang)}</td><td class="r">${x.cents < 0 ? "+" : "−"}${money(Math.abs(x.cents), lang)}</td></tr>`).join("")}` : ""}
<tr class="big"><td></td><td class="r">${r.typ === "storno" ? T("Gutschrift", "Credit") : abz.length ? T("Zu zahlen", "Amount due") : T("Gesamtbetrag", "Total")}</td><td class="r" style="width:30mm">${money(r.summe_cents, lang)}</td></tr></table>
<p class="vat">${esc(VAT_LINE[lang][r.regime] || "")}</p>
${offen && r.typ !== "storno" ? `<div class="box pay">${qr ? `<div>${qr}</div>` : ""}<div>${T("Bitte überweisen Sie den Betrag bis", "Please transfer the amount by")} <b>${dLong(r.faellig, lang)}</b>:<br>
<b>${esc(c.firma)}</b><br>IBAN <b>${esc((c.iban || "").replace(/(.{4})/g, "$1 ").trim())}</b>${c.bic ? " · BIC " + esc(c.bic) : ""}${c.bank ? "<br>" + esc(c.bank) : ""}<br>${T("Verwendungszweck", "Reference")}: <b>${esc(r.nr)}</b>
${qr ? `<br><small>${T("Mit der Banking-App scannen („Zahlen mit Code“) – Betrag und Verwendungszweck sind schon ausgefüllt.", "Scan with your banking app (EPC QR code) – amount and reference are pre-filled.")}</small>` : ""}</div></div>` : ""}
${r.text_unten ? `<p style="margin-top:5mm">${nl(r.text_unten)}</p>` : ""}
${fuss(c, lang)}</div>`;
  const stripe = offen && opts.stripe ? `<a class="btn ghost" href="${esc(opts.stripe)}" rel="noopener">${T("Lieber mit Karte zahlen", "Pay by card instead")}</a>` : "";
  const bar = `<div class="screen noprint">${opts.neu ? `<div class="ok"><b>${T("Vielen Dank für Ihren Auftrag!", "Thank you for your order!")}</b> ${T("Hier ist Ihre Anzahlungsrechnung. Eine Bestätigung mit allen Links bekommen Sie zusätzlich per Mail. Als Nächstes schicken wir Ihnen das Auftragsformular für Ihre Unterlagen.", "Here is your advance invoice. You'll also get a confirmation with all links by e-mail. Next, we'll send you the order form for your material.")}</div>` : ""}
<div class="bar"><span><b>${esc(r.nr)}</b> · ${esc(c.marke || "Brightpage")}</span><span style="display:flex;gap:8px;flex-wrap:wrap">${stripe}<button class="btn" type="button" id="pr">${T("Drucken / PDF", "Print / PDF")}</button></span></div></div>`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)} ${esc(r.nr)} · ${esc(c.marke || "Brightpage")}</title><style>${BELEG_CSS}</style></head><body>${bar}${sheet}
<script nonce="${opts.nonce}">document.getElementById("pr").addEventListener("click",function(){window.print()});</script></body></html>`;
}

function nichtGefunden(lang = "de") {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brightpage</title><style>${BELEG_CSS}</style></head><body><div class="accept"><div class="logo" style="max-width:220px">${LOGO_SVG}</div><h2 style="margin-top:18px">Dieser Link ist nicht (mehr) gültig.</h2><p>Bitte prüfen Sie den Link aus unserer Mail oder schreiben Sie an <a href="mailto:office@brightpage.net">office@brightpage.net</a>.</p><p class="small">This link is not valid. Please check the link in our e-mail.</p></div></body></html>`;
}

const nonceOf = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");

// GET /k/angebot/<token>
export async function publicAngebot(env, tok, extra = {}) {
  await migrateAngebot(env);
  if (!/^[0-9a-f]{36}$/.test(tok)) return htmlPage(nichtGefunden(), 404);
  const a = await env.DB.prepare("SELECT * FROM bp_angebote WHERE token=? AND deleted=0 AND status<>'entwurf'").bind(tok).first();
  if (!a) return htmlPage(nichtGefunden(), 404);
  const r = row(a), c = await bpConfig(env), nonce = nonceOf();
  let rt = null;
  if (r.rechnung_id) { const inv = await env.DB.prepare("SELECT token FROM bp_invoices WHERE id=?").bind(r.rechnung_id).first(); rt = inv && inv.token; }
  return htmlPage(angebotHtml(c, r, { mode: "public", nonce, rechnungToken: rt, ...extra }), extra.fehler ? 400 : 200, nonce);
}

// GET /k/rechnung/<token>
export async function publicRechnung(env, tok, neu = false) {
  await migrateAngebot(env);
  if (!/^[0-9a-f]{36}$/.test(tok)) return htmlPage(nichtGefunden(), 404);
  const r = await env.DB.prepare("SELECT * FROM bp_invoices WHERE token=? AND deleted=0 AND nr IS NOT NULL").bind(tok).first();
  if (!r) return htmlPage(nichtGefunden(), 404);
  const an = await env.DB.prepare("SELECT stripe_link FROM bp_angebote WHERE rechnung_id=?").bind(r.id).first();
  const c = await bpConfig(env), nonce = nonceOf();
  return htmlPage(rechnungHtml(c, r, { nonce, neu, stripe: r.typ === "anzahlung" && an ? an.stripe_link : "" }), 200, nonce);
}

// POST /k/angebot/<token> – Annahme (Formular, application/x-www-form-urlencoded)
export async function publicAnnahme(env, tok, form, ip = "") {
  await migrateAngebot(env);
  if (!/^[0-9a-f]{36}$/.test(tok)) return htmlPage(nichtGefunden(), 404);
  const a0 = await env.DB.prepare("SELECT * FROM bp_angebote WHERE token=? AND deleted=0").bind(tok).first();
  if (!a0) return htmlPage(nichtGefunden(), 404);
  if (a0.status !== "gesendet" || a0.gueltig_bis < today()) return publicAngebot(env, tok);
  const a = row(a0), lang = a.sprache === "en" ? "en" : "de", T = (de, en) => L(lang, de, en), k0 = a.kunde;
  const pos = a.positionen;
  const gewaehlt = form.getAll("opt").map(Number).filter((i) => Number.isInteger(i) && pos[i] && pos[i].opt);
  const w = { firma: s(form.get("firma"), 120), name: s(form.get("name"), 120), strasse: s(form.get("strasse"), 120), plz: s(form.get("plz"), 10), ort: s(form.get("ort"), 100),
    land: s(form.get("land"), 2).toUpperCase() || "AT", uid: s(form.get("uid"), 20), email: s(form.get("email"), 160), unterschrift: s(form.get("unterschrift"), 120),
    agb: form.get("agb") === "1", fruehstart: form.get("fruehstart") === "1", kenntnis: form.get("kenntnis") === "1", gewaehlt };
  const back = (fehler) => publicAngebot(env, tok, { fehler, werte: w });
  if (!w.agb) return back(T("Bitte bestätigen Sie die Annahme mit dem Häkchen.", "Please tick the confirmation box."));
  // Vorzeitiger Beginn nur mit beiden Erklärungen (§ 10, § 18 Abs 1 Z 1 FAGG) – einzeln wäre es unklar, also nachfragen
  if (k0.art === "b2c" && w.fruehstart !== w.kenntnis) return back(T("Für den Beginn vor Ablauf der Widerrufsfrist brauchen wir beide Häkchen – oder keines, dann beginnen wir nach Ablauf der Frist.", "To start before the withdrawal period ends we need both ticks – or none, then we start after the period."));
  if (w.unterschrift.length < 3) return back(T("Bitte Ihren Vor- und Nachnamen als Unterschrift eintragen.", "Please enter your full name as signature."));
  const kd = { art: k0.art, firma: w.firma, name: k0.art === "b2b" ? w.name : w.name || w.unterschrift, strasse: w.strasse, plz: w.plz, ort: w.ort,
    land: w.land, uid: k0.art === "b2b" ? w.uid : "", email: w.email, sprache: lang, notiz: `Angebot ${a.nr}` };
  const sm = summen(pos, gewaehlt);
  // Sperre gegen Doppelklick/zwei Tabs: nur einer kommt von „gesendet“ auf „annahme“
  const lock = await env.DB.prepare("UPDATE bp_angebote SET status='annahme', updated_at=? WHERE id=? AND status='gesendet'").bind(now(), a.id).run();
  if (!lock.meta.changes) {   // zweiter Klick/Tab: kurz auf die erste Annahme warten, dann dorthin weiterleiten
    for (let i = 0; i < 6; i++) {
      const x = await env.DB.prepare("SELECT status, rechnung_id FROM bp_angebote WHERE id=?").bind(a.id).first();
      if (x && x.status === "angenommen") {
        const inv = x.rechnung_id ? await env.DB.prepare("SELECT token FROM bp_invoices WHERE id=?").bind(x.rechnung_id).first() : null;
        return new Response(null, { status: 303, headers: { location: inv && inv.token ? `/k/rechnung/${inv.token}?neu=1` : `/k/angebot/${tok}`, "cache-control": "no-store" } });
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return publicAngebot(env, tok);
  }
  try {
    const au = await env.DB.prepare("SELECT * FROM bp_auftraege WHERE id=?").bind(a.auftrag_id).first();
    if (au) { kd.telefon = au.telefon || ""; kd.website = au.website || ""; }   // Kontakt aus der Anfrage in die Kundendatenbank
    let kundeId;
    try { kundeId = (await kundeSave(env, { ...kd, id: au && au.kunde_id ? au.kunde_id : "" })).id; }
    catch (e) { if (e.status === 404 && au && au.kunde_id) kundeId = (await kundeSave(env, kd)).id; else throw e; }
    const t = today(), zeit = new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit" }).format(new Date());
    let rechnungId = null, rechnungNr = "", rtok = null, hinweis = "";
    const anz = Math.round(sm.einmal * (a.anzahlung_pct || 0) / 100);
    if (anz > 0) {
      const optText = gewaehlt.length ? T(` inkl. Optionen: ${gewaehlt.map((i) => pos[i].text).join(", ")}`, ` incl. options: ${gewaehlt.map((i) => pos[i].text).join(", ")}`) : "";
      rechnungId = (await rechnungSave(env, { kunde_id: kundeId, typ: "anzahlung", sprache: lang, leistung: T(`laut Angebot ${a.nr}`, `per quote ${a.nr}`), titel: a.titel,
        text_oben: T(`Vielen Dank für Ihren Auftrag! Laut Angebot ${a.nr}, angenommen am ${t.split("-").reverse().join(".")}, stellen wir die vereinbarte Anzahlung in Rechnung.`, `Thank you for your order! As agreed in quote ${a.nr}, accepted on ${dLong(t, "en")}, we invoice the advance payment.`),
        positionen: [{ text: T(`Anzahlung ${a.anzahlung_pct} % – Auftragssumme ${money(sm.einmal, "de")} laut Angebot ${a.nr}${optText}`, `Advance payment ${a.anzahlung_pct}% – order total ${money(sm.einmal, "en")} per quote ${a.nr}${optText}`), menge: 1, einheit: "", preis_cents: anz }] })).id;
      try { rechnungNr = (await rechnungAusstellen(env, { id: rechnungId, datum: t })).nr; }
      catch (e) { hinweis = `Anzahlungsrechnung als Entwurf angelegt, Ausstellen fehlgeschlagen: ${e.message}`; }
      if (rechnungNr) { rtok = token(); await env.DB.prepare("UPDATE bp_invoices SET token=? WHERE id=?").bind(rtok, rechnungId).run(); }
    }
    const annahme = { datum: t, zeit, name: w.unterschrift, fruehstart: w.fruehstart, kenntnis: w.kenntnis, gewaehlt, ip: s(ip, 60), einmal_cents: sm.einmal, monat_cents: sm.monat };
    await env.DB.prepare("UPDATE bp_angebote SET status='angenommen', annahme=?, rechnung_id=?, kunde=?, updated_at=? WHERE id=?")
      .bind(JSON.stringify(annahme), rechnungId, JSON.stringify({ ...cleanKunde(kd) }), now(), a.id).run();
    if (au) {
      if (["neu", "kontaktiert", "gespraech", "angebot"].includes(au.status)) await auftragStatus(env, { id: au.id, status: "auftrag" });
      const prods = new Set(parse(au.produkte, []));
      pos.forEach((p, i) => { if ((!p.opt || gewaehlt.includes(i)) && VK[p.key] && VK[p.key].prod && PK.has(VK[p.key].prod)) prods.add(VK[p.key].prod); });
      await auftragSave(env, { id: au.id, kunde_id: kundeId, produkte: [...prods], wert: (sm.einmal / 100).toFixed(2).replace(".", ",") });
      await auftragNotiz(env, { id: au.id, text: `Angebot ${a.nr} online angenommen von ${w.unterschrift} (${money(sm.einmal, "de")} einmalig${sm.monat ? ", " + money(sm.monat, "de") + " monatlich" : ""}${gewaehlt.length ? ", Optionen: " + gewaehlt.map((i) => pos[i].text).join(", ") : ""})${rechnungNr ? ` – Anzahlungsrechnung ${rechnungNr} ausgestellt` : ""}${hinweis ? " – " + hinweis : ""}${k0.art === "b2c" ? (w.fruehstart ? " – vorzeitiger Beginn verlangt" : " – Verbraucher: Beginn erst nach 14 Tagen Widerrufsfrist") : ""}. Bestätigungsmail schicken!` });
    }
    if (rtok) return new Response(null, { status: 303, headers: { location: `/k/rechnung/${rtok}?neu=1`, "cache-control": "no-store" } });
    return new Response(null, { status: 303, headers: { location: `/k/angebot/${tok}`, "cache-control": "no-store" } });
  } catch (e) {
    await env.DB.prepare("UPDATE bp_angebote SET status='gesendet', updated_at=? WHERE id=? AND status='annahme'").bind(now(), a.id).run();
    if (e.status) return back(lang === "en" ? enFehler(e.message) : e.message);
    throw e;
  }
}
// Meldungen aus der Kundenprüfung (lib/brightpage.js) für englische Kunden
function enFehler(m) {
  const M = [[/Firmen, Vereinen/, "Please enter the name of your company or organisation."], [/Namen angeben/, "Please enter your name."], [/Anschrift/, "Please enter your address (street, postcode and town)."],
    [/E-Mail/, "Please check your e-mail address."], [/UID passt nicht/, "The VAT ID does not match the country."], [/Land/, "Please choose your country."]];
  const hit = M.find(([re]) => re.test(m));
  return hit ? hit[1] : "Please check your entries.";
}
