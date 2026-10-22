// Brightpage – Anfragen und Aufträge (Admin-Tab „BP Aufträge“, 20.10.2026).
// Eine Zeile je Anfrage; sie wandert durch die Stationen bis „Abgeschlossen“ oder „Verloren“.
// Formular-Anfragen von brightpage.net kommen automatisch (POST /api/bp/public/anfrage mit BP_INBOX_KEY),
// Anrufe und Mails trägt Martin von Hand ein. Je Auftrag: Erstgespräch-Leitfaden, interne Checkliste je Produkt,
// Zeiterfassung, Korrekturrunden, nächster Schritt mit Datum, Verlauf. Angebote/Formulare/Protokoll folgen (Block 2–4).

import { sendMail } from "./ops.js";
import { bpConfig } from "./brightpage.js";

const err = (msg, status = 400) => Object.assign(new Error(msg), { status });
const s = (x, n) => String(x ?? "").trim().slice(0, n);
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") && !Number.isNaN(Date.parse(d + "T00:00:00Z"));
const now = () => Date.now();
const VIENNA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => VIENNA.format(new Date());
const addDays = (ymd, n) => new Date(Date.parse(ymd + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
// nächster Werktag (Sa/So überspringen; Feiertage nicht berücksichtigt)
export function werktag(ymd, n = 1) {
  let d = ymd, k = 0;
  while (k < n) { d = addDays(d, 1); const wd = new Date(d + "T12:00:00Z").getUTCDay(); if (wd !== 0 && wd !== 6) k++; }
  return d;
}

// Stationen = die 10 Schritte des Auftragsablaufs (Doc „Brightpage Produkttests und Auftragsablauf“)
export const STATIONEN = [
  ["neu", "Neu – noch nicht beantwortet"],
  ["kontaktiert", "Kontaktiert – Erstgespräch vereinbaren"],
  ["gespraech", "Erstgespräch geführt – Angebot schreiben"],
  ["angebot", "Angebot verschickt"],
  ["auftrag", "Auftrag – Anzahlung und Unterlagen offen"],
  ["bau", "Bau auf Vorschau"],
  ["korrektur", "Korrekturen"],
  ["freischaltung", "Freischaltung"],
  ["uebergabe", "Übergabe"],
  ["schluss", "Schlussrechnung offen"],
  ["abgeschlossen", "Abgeschlossen"],
  ["verloren", "Verloren"],
];
const ST = Object.fromEntries(STATIONEN);
// Vorschlag für den nächsten Schritt, wenn eine Station erreicht wird: [Tage (Werktage), Text]
const NEXT = {
  neu: [1, "Antworten bzw. zurückrufen"],
  kontaktiert: [3, "Erstgespräch führen"],
  gespraech: [2, "Angebot schreiben und schicken"],
  angebot: [5, "Beim Kunden nachfassen"],
  auftrag: [5, "Anzahlung und Auftragsformular prüfen"],
  bau: [5, "Vorschau an den Kunden schicken"],
  korrektur: [3, "Korrekturen einarbeiten"],
  freischaltung: [2, "Freischaltung prüfen (Seite, Mail, Weiterleitungen)"],
  uebergabe: [3, "Einschulung und Übergabeprotokoll"],
  schluss: [10, "Zahlung der Schlussrechnung prüfen (Frist 14 Tage)"],
  abgeschlossen: [5, "Um Google-Bewertung bitten, Empfehlungsbonus erwähnen"],
};

// Produkte und Extras (Schlüssel bleiben stabil; Preise stehen in der Preisliste/den Vorlagen)
export const PRODUKTE = [
  ["web-start", "Web Start"], ["web-premium", "Web Premium"], ["shop-start", "Shop Start"], ["shop-premium", "Shop Premium"],
  ["gefunden", "Gefunden werden"], ["werbung", "Online-Werbung starten"], ["newsletter", "Newsletter-Paket"], ["ki", "KI-Lösungen"],
  ["social", "Social-Media-Start"], ["fotos", "Fotos vom Betrieb"], ["termin-a", "Terminbuchung einbinden"], ["termin-b", "Terminanfrage Plus"],
  ["editor", "Online-Editor (Web Start)"], ["texte", "Texte schreiben"], ["service", "Service-Plan"],
];
const PK = new Set(PRODUKTE.map((p) => p[0]));
export const QUELLEN = [["formular", "Formular brightpage.net"], ["chat", "Chat"], ["telefon", "Anruf"], ["mail", "E-Mail"], ["empfehlung", "Empfehlung"], ["persoenlich", "Persönlich"], ["sonstiges", "Sonstiges"]];

// Erstgespräch-Leitfaden (Checkliste mit Notiz je Punkt). Optionaler 4. Eintrag: Schnellauswahl, aus der beim Speichern
// eine Produkt-Vorauswahl entsteht (Admin, Schritt 2c) – [Bezeichnung, Produkt-Schlüssel oder null], multi = mehrere wählbar.
const W = (opts, multi = false) => ({ multi, opts });
export const LEITFADEN = [
  ["ziel", "Ziel der Seite", "Mehr Anfragen/Termine? Weniger Anrufe? Professioneller wirken? Verkaufen?"],
  ["zielgruppe", "Zielgruppe und Gebiet", "Wer soll die Seite finden – Ort, Umkreis, Sprache(n)?"],
  ["inhalte", "Inhalte und Abschnitte", "Welche Abschnitte bzw. Seiten? Preisliste, Team, Referenzen, Anfahrt, Downloads?", W([["One-Pager (bis 6 Abschnitte)", "web-start"], ["Mehrere Seiten (bis 8)", "web-premium"], ["Shop bis 15 Produkte", "shop-start"], ["Shop bis 30 Produkte", "shop-premium"], ["Keine neue Website", null]])],
  ["design", "Design-Wünsche", "Farben, Logo vorhanden? Stil: ruhig/modern/verspielt, Bilder fotorealistisch, gezeichnet oder abstrakt? 2–3 Seiten, die gefallen (und was nicht)."],
  ["domain", "Domain", "Vorhanden? Bei welchem Anbieter? Wunschname frei?"],
  ["email", "E-Mail", "Wo laufen die Mails? Neues Postfach gewünscht (kostet beim Anbieter)?"],
  ["altseite", "Bestehende Website", "Adresse, Baukasten (WordPress, Wix …), was übernehmen, was weg?"],
  ["texte", "Texte", "Schreibt der Kunde selbst oder wir (One-Pager 190 €, sonst 90 €/Seite)?", W([["Kunde schreibt selbst", null], ["Wir schreiben", "texte"]])],
  ["fotos", "Fotos", "Vorhanden und in guter Qualität? Oder Fotos vor Ort (190 € + Anfahrt)?", W([["Gute Fotos vorhanden", null], ["Fotos vor Ort", "fotos"]])],
  ["editor", "Selbst ändern", "Will der Kunde Texte/Preise selbst ändern? (Web Start: Editor +190 €)", W([["Will selbst ändern", "editor"], ["Wir ändern", null]])],
  ["termine", "Termine/Buchung", "Terminanfrage reicht? Buchungssystem vorhanden (einbinden 99 €) oder Terminanfrage Plus (290 €)?", W([["Keine Buchung", null], ["Buchungssystem einbinden", "termin-a"], ["Terminanfrage Plus", "termin-b"]])],
  ["google", "Google-Profil und Verzeichnisse", "Profil vorhanden, wer hat Zugang? „Gefunden werden“ (mit Website 150 €)?", W([["Gefunden werden", "gefunden"], ["Nicht nötig", null]])],
  ["werbung", "Werbung/Newsletter/Social", "Interesse an Online-Werbung, Newsletter, Social-Media-Start?", W([["Online-Werbung", "werbung"], ["Newsletter", "newsletter"], ["Social-Media-Start", "social"]], true)],
  ["ki", "KI-Lösungen", "Viele gleiche Fragen? FAQ-Assistent, Anfrage-Sortierer, Angebotsgenerator, Bewertungs-Antworten?", W([["FAQ-Assistent", "ki"], ["Anfrage-Sortierer", "ki"], ["Angebotsgenerator", "ki"], ["Bewertungs-Antworten", "ki"]], true)],
  ["recht", "Rechtliches", "Impressumsdaten (GISA, Kammer, UID), Datenschutz-Besonderheiten, AGB/Widerruf bei Shops – liefert der Kunde."],
  ["termin", "Termin und Freigabe", "Bis wann? Wer gibt frei? Urlaub/Saison beachten?"],
  ["service", "Nach dem Go-live", "Service-Plan (29/59/119 €), wer ändert künftig?", W([["Kein Service-Plan", null], ["Service Basis", "service"], ["Service Komfort", "service"], ["Service Plus", "service"]])],
  ["budget", "Budget und Entscheidung", "Rahmen genannt? Wer entscheidet? Wann kommt die Entscheidung?"],
];

// Interne Checkliste je Produkt (Bau bis Abschluss). Gemeinsame Punkte stehen in „basis“.
export const CHECK = {
  basis: [
    ["anzahlung", "Anzahlung eingelangt"], ["formular", "Auftragsformular vollständig"], ["zustimmungen", "Zustimmungen erteilt (AGB, AV-Vertrag, Google-Profil)"],
    ["uebergabe", "Übergabeprotokoll bestätigt"], ["schluss", "Schlussrechnung ausgestellt"], ["bezahlt", "Schlussrechnung bezahlt"],
    ["bewertung", "Um Bewertung gebeten, Empfehlungsbonus erwähnt"],
  ],
  "web-start": [
    ["repo", "Repository aus Vorlage in der Brightpage-Organisation angelegt"], ["design", "Eigenes Design (Farben, Schrift, Bildstil) – keine Kopie einer anderen Kundenseite"],
    ["cf", "Cloudflare-Konto des Kunden: Einladung angenommen"], ["pages", "Pages-Projekt verbunden, Vorschau-Adresse läuft"],
    ["inhalte", "Inhalte eingebaut (Texte, Bilder mit Bildbeschreibung)"], ["formtest", "Kontaktformular getestet (Mail kommt an)"], ["mobil", "Handy-Ansicht geprüft"],
    ["recht", "Impressum und Datenschutz des Kunden eingebunden"], ["vorschau", "Vorschau an den Kunden geschickt"],
    ["k1", "Korrekturrunde 1 erledigt"], ["k2", "Korrekturrunde 2 erledigt"], ["dns-sicher", "Bestehende DNS-/Mail-Einträge gesichert"],
    ["domain", "Domain zeigt auf Cloudflare, HTTPS aktiv"], ["mailtest", "E-Mail nach Umstellung getestet (senden und empfangen)"],
    ["weiterleitung", "Alte Adressen leiten weiter"], ["suche", "Search Console und Bing angemeldet, Sitemap eingereicht"],
  ],
  "web-premium": [["seiten", "Alle Seiten laut Seitenliste"], ["editor", "Online-Editor eingerichtet, Einladung verschickt"], ["schulung", "Einschulung im Editor gehalten"]],
  editor: [["editor", "Online-Editor eingerichtet, Einladung verschickt"], ["schulung", "Einschulung im Editor gehalten"]],
  "shop-start": [["stripe", "Stripe-Konto des Kunden: Einladung angenommen"], ["produkte", "Produkte eingepflegt"], ["testkauf", "Testkauf im Testmodus (Mails an Shop und Käufer)"], ["live", "Stripe auf Live umgestellt, Webhook geprüft"], ["agb", "AGB und Widerruf des Kunden eingebunden"]],
  "shop-premium": [["gutschein", "Gutscheine getestet"], ["rechnung", "Rechnung je Bestellung geprüft"], ["bestand", "Bestandspflege geprüft"]],
  gefunden: [["zustimmung", "Schriftliche Zustimmung (Google-Vorgabe) liegt vor"], ["google", "Google-Profil vollständig, Kunde ist Inhaber"], ["apple", "Apple Business Connect"], ["bing", "Bing Places"], ["herold", "HEROLD"], ["wko", "WKO Firmen A-Z"], ["filter", "Web-Filter-Einstufung eingereicht"], ["qr", "Bewertungslink und QR-Kärtchen"], ["bericht", "Kurzbericht nach 30 Tagen"]],
  werbung: [["konto", "Werbekonto des Kunden mit unserem Verwaltungskonto verknüpft"], ["kampagne", "Kampagne angelegt und freigegeben"], ["messung", "Messung über ?src geprüft"], ["auswertung", "Auswertung nach 30 Tagen"]],
  newsletter: [["tool", "Newsletter-Tool: Einladung angenommen"], ["anmeldung", "Anmeldung mit Bestätigungsmail getestet"], ["vorlage", "Vorlage und Willkommensmail"], ["schulung", "Einschulung (1 Std.)"]],
  ki: [["infos", "Infos/FAQ des Kunden vollständig"], ["av", "AV-Vertrag unterschrieben"], ["hinweis", "KI-Hinweis zu Beginn sichtbar"], ["tests", "20 Testfragen bestanden"], ["abo", "KI-Betrieb als Abo angelegt"]],
  social: [["profile", "Profile angelegt/aufgeräumt, Impressum-Link"], ["vorlagen", "5 Beitragsvorlagen übergeben"]],
  fotos: [["termin", "Fototermin vereinbart"], ["einwilligung", "Einwilligung der abgebildeten Personen"], ["bilder", "15 bearbeitete Bilder übergeben"], ["anfahrt", "Anfahrt (km) auf der Rechnung"]],
  "termin-a": [["system", "Buchungssystem des Kunden eingebunden und getestet"]],
  "termin-b": [["zeiten", "Öffnungszeiten, Termindauer, Sperrtage eingetragen"], ["test", "Testanfrage bestätigt und abgesagt"]],
  texte: [["texte", "Texte geschrieben und freigegeben"]],
  service: [["abo", "Service-Abo im Admin angelegt"]],
};

export async function migrateAuftrag(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bp_auftraege (id TEXT PRIMARY KEY, nr TEXT, status TEXT NOT NULL DEFAULT 'neu', quelle TEXT,
    name TEXT, firma TEXT, email TEXT, telefon TEXT, rueckruf INTEGER DEFAULT 0, website TEXT, empfohlen TEXT, herkunft TEXT, sprache TEXT DEFAULT 'de', nachricht TEXT,
    produkte TEXT DEFAULT '[]', kunde_id TEXT, wert_cents INTEGER, notizen TEXT DEFAULT '[]', leitfaden TEXT DEFAULT '{}', checkliste TEXT DEFAULT '{}', zeiten TEXT DEFAULT '[]',
    runden INTEGER DEFAULT 0, next_at TEXT, next_was TEXT, verloren_grund TEXT, token TEXT, kontaktiert_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER, deleted INTEGER DEFAULT 0)`).run();
  // Auftragsformular und Übergabeprotokoll (lib/bpkunde.js, 21.10.2026)
  for (const col of ["formular", "uebergabe", "vorschau"]) { try { await env.DB.prepare(`ALTER TABLE bp_auftraege ADD COLUMN ${col} TEXT`).run(); } catch {} }
  try { await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS bp_auftraege_nr ON bp_auftraege(nr)").run(); } catch {}   // gleichzeitige Anfragen: keine doppelte Nummer
}

const parse = (x, d) => { try { return JSON.parse(x || ""); } catch { return d; } };
const row = (a) => ({ ...a, produkte: parse(a.produkte, []), notizen: parse(a.notizen, []), leitfaden: parse(a.leitfaden, {}), checkliste: parse(a.checkliste, {}), zeiten: parse(a.zeiten, []), formular: parse(a.formular, null), uebergabe: parse(a.uebergabe, null) });
const token = () => [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, "0")).join("");

async function nextNr(env) {
  const y = today().slice(0, 4);
  const r = await env.DB.prepare("SELECT nr FROM bp_auftraege WHERE nr LIKE ? ORDER BY nr DESC LIMIT 1").bind(`A-${y}-%`).first();
  const n = r ? Number(String(r.nr).split("-")[2]) + 1 : 1;
  return `A-${y}-${String(n).padStart(3, "0")}`;
}
async function get(env, id) {
  const a = await env.DB.prepare("SELECT * FROM bp_auftraege WHERE id=? AND deleted=0").bind(s(id, 40)).first();
  if (!a) throw err("Anfrage nicht gefunden.", 404);
  return a;
}

// Neue Anfrage (von Hand im Admin oder vom Formular)
export async function auftragNeu(env, b, auto = false) {
  await migrateAuftrag(env);
  const name = s(b.name, 120), email = s(b.email, 160).toLowerCase();
  if (!name && !s(b.firma, 120)) throw err("Bitte Name oder Firma angeben.");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw err("E-Mail-Adresse prüfen.");
  const quelle = QUELLEN.some((q) => q[0] === b.quelle) ? b.quelle : auto ? "formular" : "sonstiges";
  const id = crypto.randomUUID(), t = today();
  const produkte = (Array.isArray(b.produkte) ? b.produkte : []).filter((p) => PK.has(p));
  const notiz = auto ? [] : s(b.notiz, 2000) ? [{ at: now(), text: s(b.notiz, 2000) }] : [];
  let nr = "";
  for (let i = 0; i < 5; i++) {   // Nummer vergeben; bei gleichzeitiger Anfrage (UNIQUE) die nächste nehmen
    nr = await nextNr(env);
    try {
      await env.DB.prepare(`INSERT INTO bp_auftraege (id, nr, status, quelle, name, firma, email, telefon, rueckruf, website, empfohlen, herkunft, sprache, nachricht, produkte, notizen, next_at, next_was, token, created_at, updated_at)
        VALUES (?,?,'neu',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, nr, quelle, name, s(b.firma, 120), email, s(b.telefon, 40), b.rueckruf ? 1 : 0, s(b.website, 300), s(b.empfohlen, 120), s(b.herkunft, 120),
          b.sprache === "en" ? "en" : "de", s(b.nachricht, 5000), JSON.stringify(produkte), JSON.stringify(notiz), werktag(t, 1), NEXT.neu[1], token(), now(), now()).run();
      break;
    } catch (e) { if (!/UNIQUE/i.test(String(e.message)) || i === 4) throw e; await new Promise((r) => setTimeout(r, 30 + Math.random() * 120)); }
  }
  return { id, nr };
}

// Felder ändern (Kontakt, Produkte, Wert, nächster Schritt, Leitfaden, Checkliste, Runden)
export async function auftragSave(env, b) {
  await migrateAuftrag(env);
  const a = await get(env, b.id), set = [], val = [];
  const put = (col, v) => { set.push(col + "=?"); val.push(v); };
  for (const [k, n] of [["name", 120], ["firma", 120], ["email", 160], ["telefon", 40], ["website", 300], ["empfohlen", 120], ["nachricht", 5000]]) if (k in b) put(k, s(b[k], n));
  if ("quelle" in b && QUELLEN.some((q) => q[0] === b.quelle)) put("quelle", b.quelle);
  if ("produkte" in b) put("produkte", JSON.stringify((Array.isArray(b.produkte) ? b.produkte : []).filter((p) => PK.has(p))));
  if ("wert" in b) { let x = String(b.wert ?? "").replace(/\s|€/g, ""); x = /,\d{1,2}$/.test(x) ? x.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(x) ? x.replace(/\./g, "") : x.replace(/,/g, "");
    const c = Math.round(Number(x) * 100); put("wert_cents", x && Number.isFinite(c) && c >= 0 ? c : null); }
  if ("next_at" in b) put("next_at", isDate(b.next_at) ? b.next_at : null);
  if ("next_was" in b) put("next_was", s(b.next_was, 200));
  if ("vorschau" in b) { const u = s(b.vorschau, 300); if (u && !/^https:\/\/[^\s<>"']+$/.test(u)) throw err("Vorschau-Adresse bitte vollständig mit https:// angeben."); put("vorschau", u); }
  if ("runden" in b) put("runden", Math.max(0, Math.min(9, Number(b.runden) || 0)));
  if ("kunde_id" in b) put("kunde_id", s(b.kunde_id, 40) || null);
  if (b.leitfaden && typeof b.leitfaden === "object") {
    const cur = parse(a.leitfaden, {}), keys = new Set(LEITFADEN.map((l) => l[0]));
    for (const [k, v] of Object.entries(b.leitfaden)) if (keys.has(k)) {
      const def = LEITFADEN.find((l) => l[0] === k)[3], wahl = def && Array.isArray(v && v.wahl) ? v.wahl.filter((w) => def.opts.some((o) => o[0] === w)).slice(0, def.multi ? 10 : 1) : [];
      cur[k] = { ok: !!(v && v.ok) || wahl.length > 0, text: s(v && v.text, 1000), wahl };
    }
    put("leitfaden", JSON.stringify(cur));
  }
  if (b.checkliste && typeof b.checkliste === "object") {
    const cur = parse(a.checkliste, {});
    for (const [k, v] of Object.entries(b.checkliste)) if (/^[a-z0-9-]+:[a-z0-9-]+$/.test(k)) { if (v) cur[k] = today(); else delete cur[k]; }
    put("checkliste", JSON.stringify(cur));
  }
  if (!set.length) return { ok: true };
  put("updated_at", now());
  await env.DB.prepare(`UPDATE bp_auftraege SET ${set.join(", ")} WHERE id=?`).bind(...val, a.id).run();
  return { ok: true };
}

// Station wechseln: setzt den vorgeschlagenen nächsten Schritt und schreibt einen Verlaufseintrag
export async function auftragStatus(env, b) {
  await migrateAuftrag(env);
  const a = await get(env, b.id), st = s(b.status, 20);
  if (!ST[st]) throw err("Unbekannte Station.");
  if (st === "verloren" && !s(b.grund, 300)) throw err("Bitte kurz den Grund angeben (hilft bei Preisen und Werbung).");
  const notizen = parse(a.notizen, []);
  notizen.push({ at: now(), text: `Station: ${ST[st]}${st === "verloren" ? " – " + s(b.grund, 300) : ""}`, sys: 1 });
  const nx = NEXT[st];
  await env.DB.prepare("UPDATE bp_auftraege SET status=?, notizen=?, next_at=?, next_was=?, verloren_grund=?, kontaktiert_at=COALESCE(kontaktiert_at, ?), updated_at=? WHERE id=?")
    .bind(st, JSON.stringify(notizen), nx ? werktag(today(), nx[0]) : null, nx ? nx[1] : null, st === "verloren" ? s(b.grund, 300) : null,
      st !== "neu" ? now() : null, now(), a.id).run();
  return { ok: true };
}

export async function auftragNotiz(env, b) {
  await migrateAuftrag(env);
  const a = await get(env, b.id), text = s(b.text, 2000);
  if (!text) throw err("Notiz ist leer.");
  const notizen = parse(a.notizen, []);
  notizen.push({ at: now(), text });
  await env.DB.prepare("UPDATE bp_auftraege SET notizen=?, updated_at=? WHERE id=?").bind(JSON.stringify(notizen.slice(-200)), now(), a.id).run();
  return { ok: true };
}

// Zeiterfassung: Minuten + Tätigkeit; „del“ entfernt einen Eintrag (Index)
export async function auftragZeit(env, b) {
  await migrateAuftrag(env);
  const a = await get(env, b.id), z = parse(a.zeiten, []);
  if (Number.isInteger(b.del)) z.splice(b.del, 1);
  else {
    const min = Math.round(Number(String(b.min).replace(",", ".")) || 0);
    if (min <= 0 || min > 600) throw err("Minuten zwischen 1 und 600 angeben.");
    z.push({ datum: isDate(b.datum) ? b.datum : today(), min, was: s(b.was, 120) || "Arbeit" });
  }
  await env.DB.prepare("UPDATE bp_auftraege SET zeiten=?, updated_at=? WHERE id=?").bind(JSON.stringify(z.slice(-500)), now(), a.id).run();
  return { ok: true };
}

export async function auftragLoeschen(env, id) {
  await migrateAuftrag(env);
  await env.DB.prepare("UPDATE bp_auftraege SET deleted=1, updated_at=? WHERE id=?").bind(now(), s(id, 40)).run();
  return { ok: true };
}

export async function auftragListe(env) {
  await migrateAuftrag(env);
  const t = today();
  const list = (await env.DB.prepare("SELECT * FROM bp_auftraege WHERE deleted=0 ORDER BY created_at DESC LIMIT 500").all()).results.map(row);
  const warn = [];
  for (const a of list) {
    // abgeschlossen: nur noch warnen, wenn ein nächster Schritt eingetragen ist (z. B. Nachfassen „zufrieden?“ aus Schritt 8)
    if (a.status === "verloren" || (a.status === "abgeschlossen" && !a.next_at)) continue;
    if (a.status === "neu" && werktag(VIENNA.format(new Date(a.created_at)), 1) < t) warn.push({ id: a.id, text: `${a.nr} ${a.firma || a.name}: seit mehr als 1 Werktag unbeantwortet` });
    else if (a.next_at && a.next_at < t) warn.push({ id: a.id, text: `${a.nr} ${a.firma || a.name}: „${a.next_was || "nächster Schritt"}“ war am ${a.next_at.split("-").reverse().join(".")} fällig` });
    else if (a.next_at === t) warn.push({ id: a.id, heute: 1, text: `${a.nr} ${a.firma || a.name}: heute – ${a.next_was || "nächster Schritt"}` });
  }
  const offen = list.filter((a) => a.status !== "abgeschlossen" && a.status !== "verloren");
  const stats = {
    offen: offen.length, neu: list.filter((a) => a.status === "neu").length,
    pipeline_cents: offen.reduce((x, a) => x + (a.wert_cents || 0), 0),
    gewonnen: list.filter((a) => ["auftrag", "bau", "korrektur", "freischaltung", "uebergabe", "schluss", "abgeschlossen"].includes(a.status)).length,
    verloren: list.filter((a) => a.status === "verloren").length,
  };
  const bewertung = (await bpConfig(env)).bewertung_link || "";
  return { list, warn, stats, today: t, bewertung, stationen: STATIONEN, produkte: PRODUKTE, quellen: QUELLEN, leitfaden: LEITFADEN, check: CHECK };
}

// Eingang vom Kontaktformular auf brightpage.net (Server zu Server, gemeinsamer Schlüssel BP_INBOX_KEY)
export async function anfrageEingang(env, request, b) {
  const key = String(env.BP_INBOX_KEY || "").trim(), got = String(request.headers.get("x-bp-key") || "").trim();
  if (!key || key.length < 24 || got !== key) throw err("Nicht erlaubt.", 403);
  const herkunft = s(b.herkunft, 120);
  return auftragNeu(env, { ...b, quelle: herkunft.startsWith("chat") ? "chat" : b.empfohlen ? "empfehlung" : "formular" }, true);
}

// Info-Mail an Martin, wenn ein Kunde selbst etwas tut (Angebot angenommen, Auftragsformular abgeschickt, Übergabe bestätigt).
// Geht an die Brightpage-Adresse aus den Einstellungen (office@brightpage.net), Absender = Mordsteam-Mailadresse mit Namen „Brightpage“.
// Nie an Kunden. Fehler werden geschluckt – die Kundenaktion darf daran nie scheitern.
export async function bpInfoMail(env, au, betreff, text) {
  try {
    if (!env.RESEND_API_KEY || !env.MAIL_FROM || !au) return false;
    const c = await bpConfig(env), to = String(c.email || "office@brightpage.net");
    const addr = (/<([^>]+)>/.exec(String(env.MAIL_FROM)) || [, String(env.MAIL_FROM)])[1];
    const e = (x) => String(x ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
    const wer = [au.firma, au.name].filter(Boolean).join(" · ");
    return await sendMail(env, "bp-info", { from: `Brightpage <${addr}>`, to: [to], subject: `Brightpage ${au.nr || ""}: ${betreff}${wer ? " – " + wer : ""}`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.5;color:#15171C"><p><b>${e(betreff)}</b></p><p>${e(text)}</p><p>Auftrag ${e(au.nr || "")}${wer ? " · " + e(wer) : ""}</p><p><a href="https://mordsteam.com/spiel/admin.html" style="color:#9A5C06">Im Admin öffnen</a> → Brightpage → Aufträge</p></div>` });
  } catch { return false; }
}
