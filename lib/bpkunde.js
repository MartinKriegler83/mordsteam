// Brightpage – Kundenseiten nach der Annahme (Block 3 und 4, 21.10.2026):
//   brightpage.net/k/formular/<token>   Auftragsformular (Firmendaten fürs Impressum, Design-Wünsche, Inhalte, Domain, Module je Produkt, Zustimmungen)
//   brightpage.net/k/anleitung/<key>    Einseiter-Anleitungen (Cloudflare, Nameserver, Google-Profil, Meta, Google Ads, Stripe, Brevo)
//   brightpage.net/k/uebergabe/<token>  Übergabeprotokoll mit Bestätigung per Klick
//   brightpage.net/k/av                 Vereinbarung zur Auftragsverarbeitung (Art. 28 DSGVO) – Entwurf, mit WKO/Rechtsberatung prüfen
// Token = bp_auftraege.token (zufällig, 144 Bit). Ausgeliefert über den Durchreicher brightpage/functions/k/[[path]].js.
import { BELEG_CSS, htmlPage } from "./bpangebot.js";
import { bpConfig } from "./brightpage.js";
import { migrateAuftrag, auftragSave, auftragNotiz } from "./bpauftrag.js";
import { LOGO_SVG_DARK } from "./bplogo.js";

const err = (msg, status = 400) => Object.assign(new Error(msg), { status });
const s = (x, n) => String(x ?? "").trim().slice(0, n);
const now = () => Date.now();
const VIENNA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => VIENNA.format(new Date());
const zeitJetzt = () => new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit" }).format(new Date());
const parse = (x, d) => { try { return JSON.parse(x || ""); } catch { return d; } };
const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dat = (ymd) => (ymd ? ymd.split("-").reverse().join(".") : "");
const nonceOf = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
// HTML-Antwort mit frischer Nonce (nur für den Drucken-Knopf; sonst kein Skript)
const page = (html, status = 200) => { const n = nonceOf(); return htmlPage(html.replaceAll("__NONCE__", n), status, n); };

let ready = false;
async function migrate(env) {
  if (ready) return;
  await migrateAuftrag(env);
  for (const col of ["formular", "uebergabe"]) { try { await env.DB.prepare(`ALTER TABLE bp_auftraege ADD COLUMN ${col} TEXT`).run(); } catch {} }
  ready = true;
}
export { migrate as migrateKunde };

// ---------- Anleitungen (Einseiter) ----------
// Menüs der Anbieter ändern sich – Stand Oktober 2026. Schritte bewusst ohne Passwörter: der Kunde lädt uns ein, wir loggen uns nie mit seinen Daten ein.
export const ANLEITUNGEN = {
  cloudflare: { titel: "Cloudflare-Konto anlegen und Brightpage einladen", fuer: ["web-start", "web-premium", "shop-start", "shop-premium"], dauer: "ca. 10 Minuten",
    warum: "Ihre Website läuft bei Cloudflare – schnell, sicher und ohne Hosting-Kosten. Das Konto gehört Ihnen; Brightpage bekommt nur Zugriff als Mitglied und kann jederzeit wieder entfernt werden.",
    brauchen: ["Ihre E-Mail-Adresse", "ein sicheres Passwort (bitte nur für Sie – nie an uns schicken)"],
    schritte: [
      ["Konto anlegen", "Öffnen Sie dash.cloudflare.com/sign-up, geben Sie Ihre E-Mail-Adresse und ein Passwort ein und bestätigen Sie die Mail von Cloudflare.", ["dash.cloudflare.com/sign-up", "Sign up", "E-Mail bestätigen"]],
      ["Gratis-Plan genügt", "Fragt Cloudflare nach einem Tarif, wählen Sie „Free“. Eine Zahlungsart brauchen Sie dafür nicht.", ["Free"]],
      ["Brightpage einladen", "Links unten auf „Manage Account“ bzw. das Konto-Menü, dann „Members“ und „Invite“. Als E-Mail office@brightpage.net eintragen, Rolle „Administrator“, dann „Invite“.", ["Manage Account", "Members", "Invite", "office@brightpage.net", "Administrator"]],
      ["Zwei-Faktor-Schutz (empfohlen)", "Unter „My Profile“ → „Authentication“ die Zwei-Faktor-Anmeldung mit einer App aktivieren.", ["My Profile", "Authentication", "2FA"]],
    ], fertig: "Sie sehen office@brightpage.net unter „Members“ mit Status „Pending“ oder „Accepted“." },
  nameserver: { titel: "Domain zu Cloudflare umstellen (Nameserver)", fuer: ["web-start", "web-premium", "shop-start", "shop-premium"], dauer: "ca. 10 Minuten, wirksam meist in wenigen Stunden",
    warum: "Damit Ihre Domain auf die neue Website zeigt, werden bei Ihrem Domain-Anbieter zwei „Nameserver“ eingetragen. Die Domain bleibt bei Ihrem Anbieter und auf Ihren Namen. Bestehende E-Mail-Postfächer übernehmen wir vorher, damit Mails weiter ankommen.",
    brauchen: ["Zugang zu Ihrem Domain-Anbieter (z. B. World4You, easyname, IONOS, A1)", "die zwei Nameserver-Namen von uns (bekommen Sie per Mail, z. B. „anna.ns.cloudflare.com“)"],
    schritte: [
      ["Erst auf unser Okay warten", "Bitte erst umstellen, wenn wir Ihnen die zwei Nameserver geschickt und die E-Mail-Einstellungen übernommen haben.", ["Mail von Brightpage"]],
      ["Beim Anbieter einloggen", "Melden Sie sich bei Ihrem Domain-Anbieter an und öffnen Sie die Domain.", ["Login", "Meine Domains", "Ihre Domain"]],
      ["Nameserver ändern", "Suchen Sie den Punkt „Nameserver“ bzw. „DNS-Server“ und wählen Sie „eigene Nameserver“. Tragen Sie die beiden Namen von uns ein und löschen Sie alle anderen.", ["Nameserver", "Eigene Nameserver", "2 Namen eintragen", "Speichern"]],
      ["Kurz Bescheid geben", "Schreiben Sie uns eine kurze Mail – wir prüfen, ob alles angekommen ist, und schalten die Website frei.", ["office@brightpage.net"]],
    ], fertig: "Ihr Anbieter zeigt die zwei Cloudflare-Nameserver an. Die Umstellung kann bis zu 24 Stunden dauern – die alte Seite bleibt bis dahin erreichbar." },
  "google-profil": { titel: "Brightpage im Google-Unternehmensprofil als Manager hinzufügen", fuer: ["gefunden"], dauer: "ca. 5 Minuten",
    warum: "Damit wir Ihr Profil vervollständigen und pflegen können. Sie bleiben Inhaber; Manager können keine Inhaber entfernen und das Profil nicht löschen.",
    brauchen: ["das Google-Konto, mit dem Ihr Profil verwaltet wird"],
    schritte: [
      ["Profil öffnen", "Mit dem richtigen Google-Konto angemeldet nach dem Namen Ihres Betriebs suchen oder business.google.com öffnen.", ["google.com", "Name Ihres Betriebs", "Ihr Unternehmensprofil"]],
      ["Personen und Zugriff", "Auf die drei Punkte ⋮ → „Unternehmensprofil-Einstellungen“ → „Personen und Zugriff“.", ["⋮", "Unternehmensprofil-Einstellungen", "Personen und Zugriff"]],
      ["Brightpage einladen", "„Hinzufügen“, office@brightpage.net eintragen, Zugriffsebene „Manager“, „Einladen“.", ["Hinzufügen", "office@brightpage.net", "Manager", "Einladen"]],
    ], fertig: "office@brightpage.net steht unter „Personen und Zugriff“ (zuerst als „Ausstehend“)." },
  meta: { titel: "Brightpage Partner-Zugriff bei Facebook und Instagram geben", fuer: ["werbung", "social"], dauer: "ca. 10 Minuten",
    warum: "Für Werbung oder Profilpflege bekommt Brightpage Zugriff als Partner – ohne Ihr Passwort. Sie können den Zugriff jederzeit wieder entfernen.",
    brauchen: ["Ihr Facebook-Konto mit Admin-Rechten für Ihre Seite", "die Business-Portfolio-ID von Brightpage (schicken wir Ihnen mit)"],
    schritte: [
      ["Business-Einstellungen öffnen", "business.facebook.com öffnen und links unten auf „Einstellungen“ gehen. Gibt es noch kein Business-Portfolio, legen Sie es dort an.", ["business.facebook.com", "Einstellungen"]],
      ["Partner hinzufügen", "„Nutzer“ → „Partner“ → „Hinzufügen“ → „Einem Partner Zugriff auf deine Assets geben“.", ["Nutzer", "Partner", "Hinzufügen"]],
      ["Brightpage-ID eintragen", "Die Business-Portfolio-ID von Brightpage eintragen und die Assets wählen: Ihre Facebook-Seite, Ihr Instagram-Konto und – für Werbung – Ihr Werbekonto, jeweils mit „Verwalten“.", ["Portfolio-ID", "Seite", "Instagram", "Werbekonto", "Speichern"]],
    ], fertig: "Brightpage steht unter „Partner“ mit den freigegebenen Assets." },
  "google-ads": { titel: "Google-Ads-Konto mit Brightpage verknüpfen", fuer: ["werbung"], dauer: "ca. 5 Minuten",
    warum: "Das Werbekonto läuft auf Ihren Namen, Sie zahlen das Budget direkt an Google. Brightpage verwaltet die Kampagne über eine Verknüpfung – ohne Ihr Passwort.",
    brauchen: ["Ihr Google-Ads-Konto (oder wir legen es mit Ihnen gemeinsam an)", "Ihre Zahlungsart bei Google"],
    schritte: [
      ["Anfrage von uns abwarten", "Wir schicken eine Verknüpfungsanfrage an Ihre Google-Ads-Kundennummer (oben rechts im Konto, Format 123-456-7890).", ["Kundennummer an Brightpage"]],
      ["Anfrage annehmen", "In Google Ads: „Verwaltung“ → „Zugriff und Sicherheit“ → „Verwaltungskonten“ → Anfrage von Brightpage „Annehmen“.", ["Verwaltung", "Zugriff und Sicherheit", "Verwaltungskonten", "Annehmen"]],
      ["Tageslimit festlegen", "Das Tagesbudget legen wir mit Ihnen gemeinsam fest – Sie können die Kampagne jederzeit pausieren.", ["Budget", "jederzeit pausierbar"]],
    ], fertig: "Unter „Verwaltungskonten“ steht Brightpage als verknüpft." },
  stripe: { titel: "Stripe-Konto für Ihren Shop", fuer: ["shop-start", "shop-premium"], dauer: "ca. 20 Minuten",
    warum: "Über Stripe nimmt Ihr Shop Karten, Apple Pay und Google Pay an. Das Konto und alle Einnahmen gehören Ihnen; Stripe zahlt direkt auf Ihr Bankkonto aus.",
    brauchen: ["Firmendaten und Bankverbindung", "einen Ausweis (Stripe prüft die Identität)"],
    schritte: [
      ["Konto anlegen", "dashboard.stripe.com/register öffnen, Konto anlegen und die Angaben zum Unternehmen vollständig ausfüllen („Konto aktivieren“).", ["dashboard.stripe.com/register", "Konto aktivieren"]],
      ["Brightpage einladen", "Zahnrad „Einstellungen“ → „Team und Sicherheit“ → „Neues Mitglied“: office@brightpage.net, Rolle „Entwickler“.", ["Einstellungen", "Team und Sicherheit", "Neues Mitglied", "Entwickler"]],
      ["Testmodus zuerst", "Wir richten alles im Testmodus ein und machen gemeinsam einen Testkauf, bevor der Shop echte Zahlungen annimmt.", ["Testmodus", "Testkauf"]],
    ], fertig: "office@brightpage.net steht unter „Team“, Ihr Konto zeigt „Zahlungen aktiviert“." },
  brevo: { titel: "Newsletter-Konto bei Brevo", fuer: ["newsletter"], dauer: "ca. 10 Minuten",
    warum: "Brevo ist ein europäisches Newsletter-Tool, gratis bis 2.000 Kontakte. Das Konto gehört Ihnen; Sie schreiben und versenden Ihre Newsletter selbst.",
    brauchen: ["Ihre Absender-E-Mail-Adresse", "die Anschrift Ihres Betriebs (Pflicht im Newsletter)"],
    schritte: [
      ["Konto anlegen", "brevo.com öffnen, „Kostenlos anmelden“, Angaben zum Betrieb ausfüllen und die Mail bestätigen.", ["brevo.com", "Kostenlos anmelden"]],
      ["Brightpage Zugang geben", "Oben rechts Ihr Konto → „Benutzer“ (bzw. „Einstellungen“ → „Benutzer“) → „Benutzer einladen“: office@brightpage.net. Ist die Einladung in Ihrem Tarif nicht möglich, richten wir es gemeinsam per Bildschirmfreigabe ein – Passwörter bitte nie schicken.", ["Benutzer", "Benutzer einladen", "office@brightpage.net"]],
      ["Absender bestätigen", "Brevo schickt eine Bestätigung an Ihre Absender-Adresse – bitte den Link anklicken.", ["Absender bestätigen"]],
    ], fertig: "Sie können sich bei Brevo einloggen, Brightpage ist eingeladen und Ihr Absender ist bestätigt." },
};
export const anleitungenFuer = (produkte) => Object.entries(ANLEITUNGEN).filter(([, a]) => a.fuer.some((p) => produkte.includes(p))).map(([k, a]) => ({ key: k, titel: a.titel }));

// ---------- Auftragsformular ----------
// Feld: [key, label, typ, optionen|undefined, pflicht]; Abschnitt nur bei passenden Produkten (fuer) oder immer
const SHOP = ["shop-start", "shop-premium"], WEB = ["web-start", "web-premium", ...SHOP];
export const FORM = [
  { k: "betrieb", t: "Ihr Betrieb", hint: "Diese Angaben kommen ins Impressum und auf die Website.", fuer: null, felder: [
    ["firmenname", "Firmen- bzw. Vereinsname", "text", null, 1], ["rechtsform", "Rechtsform (z. B. Einzelunternehmen, e.U., GmbH, Verein)", "text"],
    ["inhaber", "Inhaber/in, Geschäftsführung bzw. Obmann/Obfrau", "text", null, 1], ["adresse", "Anschrift des Betriebs", "text", null, 1],
    ["telefon", "Telefon für die Website", "text"], ["email", "E-Mail für die Website", "email", null, 1],
    ["uid", "UID-Nummer (falls vorhanden)", "text"], ["fn", "Firmenbuchnummer und -gericht (falls eingetragen)", "text"], ["zvr", "ZVR-Zahl (nur Vereine)", "text"],
    ["gewerbe", "Gewerbe bzw. Beruf, zuständige Behörde und Kammer (z. B. „Tischler, BH Neusiedl, WK Burgenland“)", "textarea"],
    ["oeffnungszeiten", "Öffnungszeiten", "textarea"], ["social", "Links zu Facebook, Instagram usw.", "textarea"]] },
  { k: "design", t: "Design-Wünsche", hint: "Jede Brightpage-Website bekommt ein eigenes Design – je genauer Sie beschreiben, was Ihnen gefällt, desto besser trifft der erste Entwurf.", fuer: WEB, felder: [
    ["logo", "Logo", "radio", ["Logo vorhanden – schicke ich mit", "Kein Logo – ein schöner Schriftzug reicht", "Logo bitte gestalten (nach Absprache)"]],
    ["farben", "Farben (Hausfarben, Farben aus dem Logo, Wünsche)", "text"],
    ["stil", "Stil", "radio", ["Ruhig und seriös", "Modern und klar", "Warm und handwerklich", "Verspielt und bunt", "Elegant und edel"]],
    ["bildstil", "Bilder", "radio", ["Eigene Fotos", "Fotorealistische Bilder", "Gezeichnet / Illustration", "Abstrakt (Formen, Farben)", "Comic"]],
    ["vorbilder", "2–3 Websites, die Ihnen gefallen – und was genau (Farben, Aufbau, Bilder …)", "textarea"],
    ["nogo", "Was Ihnen gar nicht gefällt", "textarea"]] },
  { k: "inhalte", t: "Inhalte", hint: "", fuer: WEB, felder: [
    ["abschnitte", "Welche Bereiche soll die Website haben?", "checks", ["Begrüßung", "Über uns", "Leistungen / Angebot", "Preise", "Team", "Referenzen / Kundenstimmen", "Galerie", "Anfahrt / Karte", "FAQ", "Downloads", "Kontakt"]],
    ["texte", "Texte", "radio", ["Ich liefere die Texte", "Brightpage schreibt die Texte (gebucht)", "Teils, teils"]],
    ["textinhalt", "Texte, Stichworte, was Sie besonders macht", "textarea"],
    ["dateien", "Link zu Ihren Dateien (Logo, Fotos, Texte) – z. B. WeTransfer, Dropbox oder Google Drive. Alternativ per Mail an office@brightpage.net.", "text"]] },
  { k: "domain", t: "Domain und E-Mail", hint: "", fuer: WEB, felder: [
    ["domain", "Domain (bestehend oder Wunschadresse)", "text", null, 1],
    ["domain_status", "Die Domain …", "radio", ["gehört mir schon", "soll neu registriert werden (auf meinen Namen)"]],
    ["registrar", "Bei welchem Anbieter liegt die Domain? (z. B. World4You, easyname, IONOS, A1)", "text"],
    ["mail", "E-Mail-Postfächer", "radio", ["Laufen schon beim Anbieter – bleiben so", "Ich brauche neue Postfächer", "Keine eigenen Postfächer"]],
    ["altseite", "Bestehende Website: Adresse und was übernommen werden soll", "textarea"]] },
  { k: "shop", t: "Shop", hint: "", fuer: SHOP, felder: [
    ["produkte", "Link zur Produktliste (Name, Preis, Beschreibung, Foto je Produkt – gern als Tabelle)", "text"],
    ["versand", "Versand bzw. Abholung (Länder, Kosten, Gratis ab …)", "textarea"],
    ["agb", "AGB und Widerrufsbelehrung", "radio", ["Liefere ich", "Ich nutze die WKO-Muster – bitte mit meinen Daten einbauen"]]] },
  { k: "gefunden", t: "Gefunden werden", hint: "Google verlangt, dass Sie uns ausdrücklich beauftragen, Ihr Profil zu bearbeiten.", fuer: ["gefunden"], felder: [
    ["google_profil", "Google-Unternehmensprofil", "radio", ["Ist vorhanden", "Gibt es noch nicht", "Weiß ich nicht"]],
    ["google_konto", "Google-Konto (E-Mail), mit dem das Profil verwaltet wird", "text"],
    ["z_google", "Ich beauftrage Brightpage, mein Unternehmensprofil bei Google sowie Einträge bei Apple Business Connect, Bing Places, HEROLD und WKO Firmen A-Z in meinem Namen anzulegen bzw. zu bearbeiten.", "check", null, 1]] },
  { k: "werbung", t: "Online-Werbung", hint: "", fuer: ["werbung"], felder: [
    ["plattform", "Plattform", "radio", ["Google-Anzeigen", "Instagram / Facebook", "Bitte beraten"]],
    ["werbeziel", "Was soll die Werbung bringen? (Anrufe, Anfragen, Verkäufe, Bekanntheit)", "textarea"],
    ["budget", "Monatliches Werbebudget (empfohlen ab 300 €, zahlen Sie direkt an die Plattform)", "text"]] },
  { k: "newsletter", t: "Newsletter", hint: "", fuer: ["newsletter"], felder: [
    ["nl_tool", "Newsletter-Tool", "radio", ["Neu bei Brevo (gratis bis 2.000 Kontakte)", "Habe schon ein Tool"]],
    ["nl_absender", "Absender-Name und -Adresse", "text"]] },
  { k: "ki", t: "KI-Helfer", hint: "", fuer: ["ki"], felder: [
    ["ki_infos", "Die häufigsten Fragen Ihrer Kunden – mit Ihren Antworten (Stichworte genügen)", "textarea"],
    ["ki_ton", "Ton", "radio", ["Sie-Form, sachlich", "Sie-Form, herzlich", "Du-Form, locker"]],
    ["ki_tabu", "Was der Helfer nie sagen oder versprechen darf", "textarea"]] },
  { k: "termin-a", t: "Terminbuchung", hint: "", fuer: ["termin-a"], felder: [
    ["buchungssystem", "Ihr Buchungssystem und der Link zur Buchungsseite", "text"]] },
  { k: "termin-b", t: "Terminanfrage Plus", hint: "", fuer: ["termin-b"], felder: [
    ["tb_zeiten", "Zeiten, in denen Termine möglich sind (je Wochentag)", "textarea"],
    ["tb_dauer", "Dauer eines Termins (Minuten)", "text"],
    ["tb_sperr", "Sperrtage (Urlaub, Feiertage, Ruhetage)", "textarea"],
    ["tb_mail", "An welche E-Mail-Adresse kommen die Anfragen?", "email"]] },
  { k: "fotos", t: "Fotos vom Betrieb", hint: "", fuer: ["fotos"], felder: [
    ["foto_termin", "Wunschtermine für das Fotoshooting (bis 2 Stunden)", "text"], ["foto_ort", "Adresse des Fotoshootings", "text"],
    ["foto_motive", "Was soll auf die Fotos? (Team, Räume, Arbeit, Produkte)", "textarea"]] },
  { k: "editor", t: "Online-Editor", hint: "", fuer: ["editor", "web-premium", "shop-premium"], felder: [
    ["editor_mail", "Wer bekommt Zugang zum Editor? (Name und E-Mail)", "text"]] },
  { k: "recht", t: "Rechtstexte", hint: "Rechtsberatung dürfen wir nicht leisten – die Texte liefern Sie oder Sie nutzen die Muster der Wirtschaftskammer.", fuer: WEB, felder: [
    ["rechtstexte", "Impressum und Datenschutzerklärung", "radio", ["Ich liefere die Texte", "Ich nutze die WKO-Muster – Brightpage baut sie mit meinen Daten ein"]]] },
  { k: "zustimmung", t: "Zustimmungen", hint: "", fuer: null, felder: [
    ["z_rechte", "Ich bestätige, dass ich die Rechte an den gelieferten Texten, Bildern und Logos habe bzw. sie verwenden darf.", "check", null, 1],
    ["z_av", "Ich schließe mit Brightpage die Vereinbarung zur Auftragsverarbeitung nach Art. 28 DSGVO ab (Text unter dem Link).", "check", null, 1]] },
];
export const formAbschnitte = (produkte) => FORM.filter((x) => !x.fuer || x.fuer.some((p) => produkte.includes(p)));

// ---------- gemeinsamer Seitenrahmen ----------
function seite(c, titel, inhalt, nonce = "__NONCE__", script = "") {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)} · Brightpage</title>
<style>${BELEG_CSS}
.kf{max-width:200mm;margin:0 auto;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;color:#15171C}
.kf .card{background:#fff;border-radius:12px;padding:22px;margin:0 0 14px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 10px 30px rgba(21,23,28,.07)}
.kf .head{background:#15171C;color:#F3EFE6;border-radius:12px 12px 0 0;padding:20px 22px;margin:0}.kf .head svg{height:28px;width:auto}
.kf .bar{height:4px;background:#D9820B;margin:0 0 14px;border-radius:0 0 4px 4px}
.kf h1{font-size:26px;margin:0 0 6px}.kf h2{font-size:19px;margin:0 0 4px;display:flex;gap:10px;align-items:center}
.kf h2 .n{flex:none;width:28px;height:28px;border-radius:50%;background:#D9820B;color:#15171C;display:grid;place-items:center;font-size:14px}
.kf .hint{color:#5A5D65;font-size:14px;margin:0 0 12px}
.kf label.f{display:block;font-size:14px;color:#3D4048;margin:12px 0 4px}
.kf input[type=text],.kf input[type=email],.kf textarea{width:100%;font:inherit;font-size:16px;padding:11px 12px;border:1px solid #C9CCD2;border-radius:8px;background:#fff;color:#15171C}
.kf textarea{min-height:84px}.kf .opts{display:flex;flex-wrap:wrap;gap:8px}
.kf .opts label{display:flex;gap:8px;align-items:center;border:1px solid #C9CCD2;border-radius:999px;padding:8px 14px;cursor:pointer;font-size:15px;background:#fff}
.kf .opts input{accent-color:#D9820B}.kf .opts label:has(input:checked){border-color:#D9820B;background:#FBEBD3}
.kf .chk{display:flex;gap:10px;align-items:flex-start;margin:12px 0;line-height:1.45}.kf .chk input{width:20px;height:20px;flex:none;margin-top:2px;accent-color:#D9820B}
.kf .req{color:#B3261E}.kf .actions{display:flex;gap:10px;flex-wrap:wrap;position:sticky;bottom:0;background:linear-gradient(transparent,#ECE7DC 30%);padding:18px 0 12px}
.kf .guides a{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid #E4E1DA;border-radius:10px;margin:8px 0;color:#15171C;text-decoration:none;background:#FBFAF7}
.kf .guides a:hover{border-color:#D9820B}.kf .path{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0}.kf .path span{font-size:13px;background:#F3EFE6;border:1px solid #E4E1DA;border-radius:6px;padding:3px 8px}
.kf .path span+span:before{content:"→ ";color:#D9820B}
.kf ol.steps{list-style:none;padding:0;margin:0;counter-reset:s}.kf ol.steps li{counter-increment:s;position:relative;padding:0 0 18px 46px}
.kf ol.steps li:before{content:counter(s);position:absolute;left:0;top:0;width:32px;height:32px;border-radius:50%;background:#15171C;color:#F3EFE6;display:grid;place-items:center;font-weight:700}
.kf dl{display:grid;grid-template-columns:minmax(140px,30%) 1fr;gap:6px 14px;margin:0}.kf dt{color:#5A5D65;font-size:14px}.kf dd{margin:0;white-space:pre-wrap}
@media (max-width:640px){.kf .card{border-radius:0;padding:16px}.kf .head{border-radius:0}.kf dl{grid-template-columns:1fr}.kf dt{margin-top:6px}}
@media print{.kf .actions,.noprint{display:none!important}.kf .card{box-shadow:none}}</style></head>
<body><div class="kf"><div class="head"><div class="logo">${LOGO_SVG_DARK}</div></div><div class="bar"></div>${inhalt}
<p class="small" style="text-align:center;color:#6B6E76;margin:18px 0 6px">${esc(c.firma)} · ${esc(c.strasse)}, ${esc(c.plz_ort)} · <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a></p></div>
<script nonce="${nonce}">var p=document.getElementById("pr");if(p)p.addEventListener("click",function(){window.print()});${script}</script></body></html>`;
}

async function byToken(env, tok) {
  await migrate(env);
  if (!/^[0-9a-f]{36}$/.test(tok)) return null;
  return env.DB.prepare("SELECT * FROM bp_auftraege WHERE token=? AND deleted=0").bind(tok).first();
}
function nichtGefunden(c) { return page(seite(c, "Link ungültig", `<div class="card"><h1>Dieser Link ist nicht (mehr) gültig.</h1><p>Bitte prüfen Sie den Link aus unserer Mail oder schreiben Sie an <a href="mailto:office@brightpage.net">office@brightpage.net</a>.</p></div>`), 404); }

function feld(f, v, fehler) {
  const [k, l, typ, opt, req] = f, R = req ? ` <span class="req">*</span>` : "", bad = fehler && fehler.includes(k) ? ' style="border-color:#B3261E"' : "";
  if (typ === "text" || typ === "email") return `<label class="f" for="f-${k}">${esc(l)}${R}</label><input type="${typ}" id="f-${k}" name="${k}" value="${esc(v || "")}" maxlength="500"${bad}>`;
  if (typ === "textarea") return `<label class="f" for="f-${k}">${esc(l)}${R}</label><textarea id="f-${k}" name="${k}" maxlength="5000"${bad}>${esc(v || "")}</textarea>`;
  if (typ === "radio") return `<label class="f">${esc(l)}${R}</label><div class="opts">${opt.map((o) => `<label><input type="radio" name="${k}" value="${esc(o)}" ${v === o ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>`;
  if (typ === "checks") { const vs = Array.isArray(v) ? v : []; return `<label class="f">${esc(l)}${R}</label><div class="opts">${opt.map((o) => `<label><input type="checkbox" name="${k}" value="${esc(o)}" ${vs.includes(o) ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>`; }
  if (typ === "check") return `<label class="chk"${bad}><input type="checkbox" name="${k}" value="1" ${v ? "checked" : ""}><span>${esc(l)}${R}${k === "z_av" ? ` <a href="/k/av" target="_blank" rel="noopener" style="color:#9A5C06">Vereinbarung lesen</a>` : ""}</span></label>`;
  return "";
}
export function formWert(f, form) {
  const [k, , typ] = f;
  if (typ === "checks") return form.getAll(k).map((x) => s(x, 100)).slice(0, 20);
  if (typ === "check") return form.get(k) === "1";
  return s(form.get(k), typ === "textarea" ? 5000 : 500);
}

function formularSeite(c, a, opts = {}) {
  const F = parse(a.formular, {}), d = opts.werte || F.daten || {}, produkte = parse(a.produkte, []), secs = formAbschnitte(produkte);
  const guides = anleitungenFuer(produkte);
  const eingereicht = F.eingereicht_at && !opts.bearbeiten;
  const name = a.name || a.firma || "";
  if (eingereicht) {
    return seite(c, "Auftragsformular", `<div class="card"><h1>Danke – Ihre Angaben sind da.</h1><p>Eingereicht am ${new Date(F.eingereicht_at).toLocaleString("de-AT", { timeZone: "Europe/Vienna" })}. Wir melden uns, sobald der erste Entwurf fertig ist. Etwas vergessen oder geändert? <a href="?bearbeiten=1" style="color:#9A5C06">Angaben ergänzen</a> oder einfach an <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a> schreiben.</p></div>
      ${guides.length ? `<div class="card guides"><h2>Ihre nächsten Schritte</h2><p class="hint">Kurze Anleitungen – jeweils ein paar Minuten, ohne Passwörter an uns.</p>${guides.map((g) => `<a href="/k/anleitung/${g.key}" target="_blank" rel="noopener"><b>${esc(g.titel)}</b><span>→</span></a>`).join("")}</div>` : ""}
      ${zusammenfassung(secs, d)}`);
  }
  return seite(c, "Auftragsformular", `<form method="post" id="kf">
    <div class="card"><h1>Ihr Auftragsformular</h1><p>${name ? `Hallo ${esc(name)}, d` : "D"}amit wir mit Ihrer Website loslegen können, brauchen wir ein paar Angaben. Sie können jederzeit <b>zwischenspeichern</b> und später weitermachen – der Link bleibt gültig.</p>
      ${F.gespeichert_at && !F.eingereicht_at ? `<p class="ok">Zwischengespeichert am ${new Date(F.gespeichert_at).toLocaleString("de-AT", { timeZone: "Europe/Vienna" })}.</p>` : ""}
      ${opts.fehler ? `<div class="err" role="alert">${esc(opts.fehler)}</div>` : ""}${opts.ok ? `<div class="ok" role="status">${esc(opts.ok)}</div>` : ""}
      <p class="small">Felder mit <span class="req">*</span> brauchen wir zum Absenden.</p></div>
    ${secs.map((x, i) => `<div class="card"><h2><span class="n">${i + 1}</span>${esc(x.t)}</h2>${x.hint ? `<p class="hint">${esc(x.hint)}</p>` : ""}${x.felder.map((f) => feld(f, d[f[0]], opts.fehlerFelder)).join("")}</div>`).join("")}
    ${guides.length ? `<div class="card guides"><h2>Anleitungen für Sie</h2><p class="hint">Diese Schritte machen Sie selbst – je ein paar Minuten, ohne Passwörter an uns zu schicken.</p>${guides.map((g) => `<a href="/k/anleitung/${g.key}" target="_blank" rel="noopener"><b>${esc(g.titel)}</b><span>→</span></a>`).join("")}</div>` : ""}
    <div class="actions"><button class="btn ghost" type="submit" name="aktion" value="speichern" formnovalidate>Zwischenspeichern</button><button class="btn amber" type="submit" name="aktion" value="absenden" style="flex:1">Absenden</button></div></form>`);
}
function zusammenfassung(secs, d) {
  const val = (f) => { const v = d[f[0]]; return f[2] === "check" ? (v ? "✓ zugestimmt" : "–") : Array.isArray(v) ? v.join(", ") : v || "–"; };
  return `<div class="card"><h2>Ihre Angaben</h2>${secs.map((x) => `<h3 style="margin:16px 0 6px;font-size:15px;color:#9A5C06">${esc(x.t)}</h3><dl>${x.felder.map((f) => `<dt>${esc(f[1].replace(/\s*\(.*$/, "").slice(0, 80))}</dt><dd>${esc(val(f))}</dd>`).join("")}</dl>`).join("")}</div>`;
}

export async function publicFormular(env, tok, url) {
  const c = await bpConfig(env), a = await byToken(env, tok);
  if (!a) return nichtGefunden(c);
  return page(formularSeite(c, a, { bearbeiten: url.searchParams.get("bearbeiten") === "1" }));
}
export async function publicFormularPost(env, tok, form, ip = "") {
  const c = await bpConfig(env), a = await byToken(env, tok);
  if (!a) return nichtGefunden(c);
  const secs = formAbschnitte(parse(a.produkte, [])), daten = {};
  for (const x of secs) for (const f of x.felder) daten[f[0]] = formWert(f, form);
  const F = parse(a.formular, {}), aktion = form.get("aktion") === "absenden" ? "absenden" : "speichern";
  if (aktion === "absenden") {
    const fehlen = secs.flatMap((x) => x.felder.filter((f) => f[4] && (f[2] === "check" ? !daten[f[0]] : !daten[f[0]]))).map((f) => f[0]);
    if (fehlen.length) return page(formularSeite(c, a, { werte: daten, bearbeiten: true, fehlerFelder: fehlen, fehler: `Bitte noch ausfüllen bzw. bestätigen: ${fehlen.map((k) => secs.flatMap((x) => x.felder).find((f) => f[0] === k)[1].replace(/\s*\(.*$/, "").slice(0, 60)).join(" · ")}` }), 400);
  }
  const t = now(), zust = { ...(F.zustimmungen || {}) };
  for (const [k, v] of Object.entries(daten)) if (k.startsWith("z_") && v && !zust[k]) zust[k] = { at: t, ip: s(ip, 60) };
  const neu = { daten, gespeichert_at: t, eingereicht_at: aktion === "absenden" ? t : F.eingereicht_at || null, zustimmungen: zust };
  await env.DB.prepare("UPDATE bp_auftraege SET formular=?, updated_at=? WHERE id=?").bind(JSON.stringify(neu), t, a.id).run();
  if (aktion === "absenden") {
    const ck = { "basis:formular": true }; if (daten.z_rechte && daten.z_av && (daten.z_google !== false)) ck["basis:zustimmungen"] = true;
    if (daten.z_google) ck["gefunden:zustimmung"] = true;
    await auftragSave(env, { id: a.id, checkliste: ck, next_was: "Auftragsformular prüfen, Bau starten", next_at: today() });
    await auftragNotiz(env, { id: a.id, text: `Auftragsformular ${F.eingereicht_at ? "aktualisiert" : "eingereicht"} vom Kunden (Zustimmungen: ${Object.keys(zust).join(", ") || "keine"}).` });
    return new Response(null, { status: 303, headers: { location: `/k/formular/${tok}`, "cache-control": "no-store" } });
  }
  return page(formularSeite(c, { ...a, formular: JSON.stringify(neu) }, { ok: "Zwischengespeichert – Sie können jederzeit über denselben Link weitermachen." }));
}

export async function publicAnleitung(env, key) {
  const c = await bpConfig(env), g = ANLEITUNGEN[key];
  if (!g) return page(seite(c, "Anleitung", `<div class="card"><h1>Anleitung nicht gefunden.</h1></div>`), 404);
  return page(seite(c, g.titel, `<div class="card"><p class="small" style="color:#9A5C06;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px">Anleitung · ${esc(g.dauer)}</p><h1>${esc(g.titel)}</h1><p>${esc(g.warum)}</p>
      <h3 style="font-size:15px;margin:14px 0 4px">Sie brauchen</h3><ul style="margin:0 0 4px;padding-left:20px">${g.brauchen.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
    <div class="card"><ol class="steps">${g.schritte.map(([t, d, p]) => `<li><b>${esc(t)}</b><br>${esc(d)}<div class="path">${p.map((x) => `<span>${esc(x)}</span>`).join("")}</div></li>`).join("")}</ol>
      <p class="ok" style="margin-top:6px"><b>Fertig, wenn:</b> ${esc(g.fertig)}</p>
      <p class="small">Menüs der Anbieter ändern sich manchmal. Finden Sie einen Punkt nicht? Kurz an <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a> schreiben – wir helfen gern, auch per Bildschirmfreigabe. Passwörter bitte nie per Mail schicken.</p>
      <p class="noprint"><button class="btn ghost" type="button" id="pr">Drucken / PDF</button></p></div>`), 200);
}

// AV-Vereinbarung nach Art. 28 DSGVO (überarbeitet 21.10.2026 nach Prüfung gegen Art. 28, WKO-Muster und SCC 2021/915).
// Echte Unterauftragsverarbeiter von Brightpage sind nur Anthropic und Resend; Cloudflare, Brevo und Stripe laufen über Konten des Kunden.
export async function publicAV(env) {
  const c = await bpConfig(env);
  const P = (t) => `<p>${t}</p>`;
  return page(seite(c, "Auftragsverarbeitung", `<div class="card"><h1>Vereinbarung zur Auftragsverarbeitung</h1><p class="hint">nach Art. 28 DSGVO zwischen dem Kunden (Verantwortlicher) und ${esc(c.firma)}, Marke Brightpage (Auftragsverarbeiter). Abgeschlossen elektronisch mit der Zustimmung im Auftragsformular (Art. 28 Abs. 9 DSGVO); Zeitpunkt und Textversion werden gespeichert.</p>
    ${P("<b>1. Gegenstand.</b> Brightpage verarbeitet personenbezogene Daten für den Kunden, nur zum Bau, Betrieb und zur Betreuung der beauftragten Leistungen: speichern, weiterleiten, anzeigen und löschen von Formular-Anfragen, Newsletter-Anmeldungen, Anfragen an KI-Helfer und Shop-Bestellungen. Die Vereinbarung gilt, solange Brightpage für den Kunden tätig ist.")}
    ${P("<b>2. Daten und Betroffene.</b> Kontaktdaten, Nachrichten und Bestelldaten von Besuchern, Kunden und Interessenten des Kunden. Keine besonderen Kategorien nach Art. 9 DSGVO, außer ausdrücklich vereinbart. Der Kunde weist Nutzer darauf hin, in Formularen und KI-Helfern keine sensiblen Daten einzugeben.")}
    ${P("<b>3. Rolle des Kunden.</b> Der Kunde ist Verantwortlicher. Er entscheidet über Zweck und Mittel der Verarbeitung und sorgt für die Rechtsgrundlage.")}
    ${P("<b>4. Weisungen.</b> Brightpage handelt nur auf dokumentierte Weisung des Kunden – diese Vereinbarung, das Angebot und Anweisungen per E-Mail –, auch bei Übermittlungen in Drittländer. Verlangt ein Gesetz etwas anderes, informiert Brightpage vorher, sofern das erlaubt ist. Hält Brightpage eine Weisung für rechtswidrig, sagt Brightpage das sofort.")}
    ${P("<b>5. Vertraulichkeit und Sicherheit.</b> Zugriff haben nur Personen, die zur Vertraulichkeit verpflichtet sind. Die technischen und organisatorischen Maßnahmen nach Art. 32 DSGVO stehen in Anlage 1.")}
    ${P("<b>6. Unterauftragsverarbeiter.</b> Der Kunde stimmt zu, dass Brightpage diese Dienste einsetzt: <b>Anthropic PBC</b> (USA) für KI-Helfer und <b>Resend Inc.</b> (USA) für den Versand von Formular-Mails. Grundlage der Übermittlung ist das EU-US Data Privacy Framework, sofern der Anbieter zertifiziert ist, sonst – und falls das Framework wegfällt – die EU-Standardvertragsklauseln im Vertrag des Anbieters. Brightpage gibt die gleichen Datenschutzpflichten an diese Dienste weiter und haftet für sie. Neue Dienste kündigt Brightpage 14 Tage vorher an; widerspricht der Kunde, kann jede Seite die betroffene Leistung kündigen.")}
    ${P("<b>7. Dienste des Kunden.</b> Cloudflare (Hosting), Brevo (Newsletter) und Stripe (Zahlungen) laufen über Konten des Kunden mit eigenen Verträgen. Brightpage arbeitet dort nur als eingeladenes Mitglied auf Weisung des Kunden.")}
    ${P("<b>8. Unterstützung.</b> Brightpage unterstützt den Kunden bei Anfragen Betroffener (Auskunft, Löschung usw.), bei Datenpannen und bei Datenschutz-Folgenabschätzungen. Eine Datenpanne meldet Brightpage binnen 48 Stunden mit allen bekannten Angaben nach Art. 33 Abs. 3 DSGVO.")}
    ${P("<b>9. Ende.</b> Nach Ende der Zusammenarbeit gibt Brightpage die Daten nach Wahl des Kunden zurück oder löscht sie – ausgenommen, was ein Gesetz aufzubewahren verlangt.")}
    ${P("<b>10. Nachweise.</b> Brightpage stellt alle nötigen Nachweise zur Verfügung und ermöglicht Überprüfungen, auch vor Ort, durch den Kunden oder einen beauftragten Prüfer nach Terminabsprache.")}
    <h3 style="font-size:16px;margin:18px 0 6px">Anlage 1 – Technische und organisatorische Maßnahmen</h3>
    <ul style="margin:0;padding-left:20px"><li>Verschlüsselte Übertragung (HTTPS) für Website, Formulare und Verwaltung</li><li>Zwei-Faktor-Anmeldung bei allen eingesetzten Diensten</li><li>Persönliche Zugänge statt geteilter Passwörter; Zugriff nur, soweit nötig</li><li>Datensparsamkeit: nur Daten, die für die Leistung nötig sind</li><li>Regelmäßige Sicherungen der Website-Stände</li><li>Löschung, sobald der Zweck wegfällt</li></ul>
    <p class="small" style="margin-top:14px">Fassung vom 21.10.2026.</p></div>`));
}

// Muster-Widerrufsformular (FAGG Anhang I Teil B) – für Verbraucher, verlinkt aus der Widerrufsbelehrung im Angebot
export async function publicWiderruf(env) {
  const c = await bpConfig(env);
  return page(seite(c, "Widerrufsformular", `<div class="card"><h1>Muster-Widerrufsformular</h1>
    <p class="hint">Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück – eine formlose E-Mail genügt ebenso.</p>
    <p>An: ${esc(c.firma)}, ${esc(c.strasse)}, ${esc(c.plz_ort)}, E-Mail: <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a></p>
    <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*):</p>
    <p>______________________________________________</p>
    <p>Bestellt am (*) / erhalten am (*): ____________________</p>
    <p>Name des/der Verbraucher(s): ____________________</p>
    <p>Anschrift des/der Verbraucher(s): ____________________</p>
    <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ____________________</p>
    <p>Datum: ____________________</p>
    <p class="small">(*) Unzutreffendes streichen.</p>
    <p class="noprint"><button class="btn ghost" type="button" id="pr">Drucken / PDF</button></p></div>`));
}

// ---------- Übergabeprotokoll ----------
export const ZUGAENGE = {
  basis: ["Website ist online unter der vereinbarten Adresse", "Kontaktformular getestet – Anfragen kommen an", "Impressum und Datenschutzerklärung eingebunden"],
  web: ["Cloudflare-Konto gehört dem Kunden, Brightpage ist nur Mitglied", "Domain bleibt beim Domain-Anbieter auf den Namen des Kunden"],
  editor: ["Zugang zum Online-Editor eingerichtet und eingeschult"],
  shop: ["Stripe-Konto gehört dem Kunden, Testkauf erfolgreich", "AGB und Widerrufsbelehrung des Kunden eingebunden"],
  gefunden: ["Google-Unternehmensprofil vollständig, Kunde ist Inhaber", "Einträge Apple, Bing, HEROLD, WKO Firmen A-Z", "Bewertungs-Link und QR-Kärtchen übergeben"],
  werbung: ["Werbekonto auf den Namen des Kunden, Kampagne läuft"],
  newsletter: ["Newsletter-Tool gehört dem Kunden, Anmeldung getestet, Einschulung erfolgt"],
  ki: ["KI-Helfer mit KI-Hinweis aktiv, Testfragen bestanden"],
};
export function zugaengeFuer(produkte) {
  const L = [...ZUGAENGE.basis];
  if (produkte.some((p) => WEB.includes(p))) L.push(...ZUGAENGE.web);
  if (produkte.some((p) => ["editor", "web-premium", "shop-premium"].includes(p))) L.push(...ZUGAENGE.editor);
  if (produkte.some((p) => SHOP.includes(p))) L.push(...ZUGAENGE.shop);
  for (const k of ["gefunden", "werbung", "newsletter", "ki"]) if (produkte.includes(k)) L.push(...ZUGAENGE[k]);
  return L;
}
const HINWEISE = "Die Domain verlängert sich jährlich bei Ihrem Domain-Anbieter – bitte die Rechnung dort bezahlen.\nHosting bei Cloudflare kostet 0 €; die Website braucht keine Sicherheitsupdates.\nÄnderungen: selbst im Editor (falls gebucht), mit einem Service-Plan oder einzeln (kleine Änderung bis 15 Minuten 35 €, sonst 85 € pro Stunde).\nPasswörter und Zugänge bitte sicher aufbewahren und nie per Mail verschicken.";

// Admin: Protokoll speichern / freigeben
export async function uebergabeSave(env, b) {
  await migrate(env);
  const a = await env.DB.prepare("SELECT * FROM bp_auftraege WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!a) throw err("Auftrag nicht gefunden.", 404);
  const U = parse(a.uebergabe, {});
  if (U.bestaetigt) throw err("Das Protokoll ist schon vom Kunden bestätigt.");
  const punkte = (Array.isArray(b.punkte) ? b.punkte : []).slice(0, 30).map((p) => ({ t: s(p.t, 200), ok: !!p.ok })).filter((p) => p.t);
  const n = { website: s(b.website, 200), einschulung: /^\d{4}-\d{2}-\d{2}$/.test(b.einschulung || "") ? b.einschulung : "", punkte, offen: s(b.offen, 2000), hinweise: s(b.hinweise ?? HINWEISE, 3000),
    freigegeben_at: b.freigeben ? now() : U.freigegeben_at || null };
  if (b.freigeben && !n.website) throw err("Bitte die Website-Adresse eintragen.");
  await env.DB.prepare("UPDATE bp_auftraege SET uebergabe=?, updated_at=? WHERE id=?").bind(JSON.stringify(n), now(), a.id).run();
  if (b.freigeben && !U.freigegeben_at) await auftragNotiz(env, { id: a.id, text: "Übergabeprotokoll zur Bestätigung freigegeben." });
  return { ok: true, token: a.token };
}
export async function uebergabeVorlage(env, id) {
  await migrate(env);
  const a = await env.DB.prepare("SELECT produkte, uebergabe, website FROM bp_auftraege WHERE id=?").bind(s(id, 40)).first();
  return { punkte: zugaengeFuer(parse(a && a.produkte, [])).map((t) => ({ t, ok: true })), hinweise: HINWEISE };
}

function protokollHtml(c, a, U, opts = {}) {
  const kunde = a.firma || a.name || "", leistungen = opts.leistungen || [];
  const b = U.bestaetigt;
  return seite(c, "Übergabeprotokoll", `<div class="card" style="position:relative">${b ? `<div class="stamp" style="top:18px">BESTÄTIGT ${dat(b.datum)}</div>` : ""}
      <p class="small" style="color:#9A5C06;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px">Übergabeprotokoll ${esc(a.nr)}</p>
      <h1>${esc(kunde)}</h1><dl style="margin-top:10px"><dt>Website</dt><dd><a href="${esc(/^https?:/.test(U.website) ? U.website : "https://" + U.website)}" style="color:#9A5C06">${esc(U.website)}</a></dd>
      ${U.einschulung ? `<dt>Einschulung am</dt><dd>${dat(U.einschulung)}</dd>` : ""}${leistungen.length ? `<dt>Leistungen laut Angebot</dt><dd>${leistungen.map(esc).join("\n")}</dd>` : ""}</dl></div>
    <div class="card"><h2>Übergeben und geprüft</h2>${U.punkte.map((p) => `<div class="chk"><span style="flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:13px;${p.ok ? "background:#2F7D4F;color:#fff" : "background:#E4E1DA;color:#6B6E76"}">${p.ok ? "✓" : "–"}</span><span>${esc(p.t)}</span></div>`).join("")}
      ${U.offen ? `<h3 style="font-size:15px;margin:14px 0 4px">Offene Punkte</h3><p style="white-space:pre-wrap;margin:0">${esc(U.offen)}</p>` : ""}</div>
    <div class="card"><h2>Gut zu wissen</h2><ul style="margin:0;padding-left:20px">${String(U.hinweise || "").split("\n").filter(Boolean).map((h) => `<li style="margin:4px 0">${esc(h)}</li>`).join("")}</ul></div>
    ${b ? `<div class="card"><p class="ok" style="margin:0">Bestätigt am ${dat(b.datum)} um ${esc(b.zeit)} von <b>${esc(b.name)}</b>. Vielen Dank für die Zusammenarbeit!</p></div><p class="noprint" style="text-align:center"><button class="btn ghost" type="button" id="pr">Drucken / PDF</button></p>`
      : opts.form ? `<form method="post" class="card" style="border-top:5px solid #D9820B"><h2>Übernahme bestätigen</h2>${opts.fehler ? `<div class="err">${esc(opts.fehler)}</div>` : ""}
        <label class="chk"><input type="checkbox" name="ok" value="1"><span>Ich bestätige, dass die Website und die Zugänge wie oben übergeben wurden${U.einschulung ? " und ich eingeschult wurde" : ""}. Offene Punkte sind oben festgehalten.</span></label>
        <label class="f" for="f-n">Ihr Vor- und Nachname</label><input type="text" id="f-n" name="name" maxlength="120" value="${esc(opts.name || "")}">
        <p style="margin:16px 0 0"><button class="btn amber" type="submit" style="width:100%;font-size:17px;padding:15px">Übernahme bestätigen</button></p>
        <p class="small">Mit der Bestätigung gilt die Leistung als abgenommen; danach kommt die Schlussrechnung.</p></form>` : ""}`);
}
async function leistungenFuer(env, a) {
  const x = await env.DB.prepare("SELECT positionen, annahme FROM bp_angebote WHERE auftrag_id=? AND status='angenommen' AND deleted=0 ORDER BY updated_at DESC LIMIT 1").bind(a.id).first().catch(() => null);
  if (!x) return [];
  const pos = parse(x.positionen, []), gew = (parse(x.annahme, {}) || {}).gewaehlt || [];
  return pos.filter((p, i) => !p.opt || gew.includes(i)).map((p) => `${p.text}${p.art === "monat" ? " (monatlich)" : ""}`);
}
export async function publicUebergabe(env, tok) {
  const c = await bpConfig(env), a = await byToken(env, tok);
  if (!a) return nichtGefunden(c);
  const U = parse(a.uebergabe, {});
  if (!U.freigegeben_at) return page(seite(c, "Übergabeprotokoll", `<div class="card"><h1>Das Übergabeprotokoll ist noch in Arbeit.</h1><p>Sie bekommen den Link, sobald es fertig ist.</p></div>`));
  return page(protokollHtml(c, a, U, { form: true, leistungen: await leistungenFuer(env, a) }));
}
export async function publicUebergabePost(env, tok, form, ip = "") {
  const c = await bpConfig(env), a = await byToken(env, tok);
  if (!a) return nichtGefunden(c);
  const U = parse(a.uebergabe, {});
  if (!U.freigegeben_at || U.bestaetigt) return publicUebergabe(env, tok);
  const name = s(form.get("name"), 120);
  if (form.get("ok") !== "1" || name.length < 3) return page(protokollHtml(c, a, U, { form: true, name, leistungen: await leistungenFuer(env, a), fehler: "Bitte das Häkchen setzen und Ihren Namen eintragen." }), 400);
  U.bestaetigt = { name, datum: today(), zeit: zeitJetzt(), ip: s(ip, 60) };
  await env.DB.prepare("UPDATE bp_auftraege SET uebergabe=?, updated_at=? WHERE id=?").bind(JSON.stringify(U), now(), a.id).run();
  await auftragSave(env, { id: a.id, checkliste: { "basis:uebergabe": true }, next_was: "Schlussrechnung erstellen und schicken", next_at: today() });
  await auftragNotiz(env, { id: a.id, text: `Übergabeprotokoll bestätigt von ${name}.` });
  return new Response(null, { status: 303, headers: { location: `/k/uebergabe/${tok}`, "cache-control": "no-store" } });
}

// ---------- Nachfassen (Hinweise in der Auftragsliste) ----------
export async function nachfassWarnungen(env) {
  await migrate(env);
  const t = today(), out = [];
  const L = (await env.DB.prepare("SELECT id, nr, firma, name, status, produkte, formular, uebergabe, checkliste, notizen, kunde_id FROM bp_auftraege WHERE deleted=0 AND status NOT IN ('verloren')").all()).results;
  const offen = (await env.DB.prepare("SELECT nr, kunde_id, faellig, summe_cents FROM bp_invoices WHERE deleted=0 AND status='offen' AND faellig < ?").bind(t).all()).results;
  for (const a of L) {
    const who = `${a.nr} ${a.firma || a.name}`, F = parse(a.formular, {}), U = parse(a.uebergabe, {}), ck = parse(a.checkliste, {}), notes = parse(a.notizen, []);
    const seit = (re) => { const n = notes.filter((x) => re.test(x.text)).pop(); return n ? VIENNA.format(new Date(n.at)) : null; };
    const tage = (ymd) => (ymd ? Math.floor((Date.parse(t) - Date.parse(ymd)) / 86400000) : 0);
    if (a.status === "auftrag" && !F.eingereicht_at) { const d = seit(/^Station: Auftrag/); if (d && tage(d) >= 5) out.push({ id: a.id, text: `${who}: Auftragsformular seit ${tage(d)} Tagen offen – nachfassen` }); }
    if (a.status === "uebergabe" && U.freigegeben_at && !U.bestaetigt && Date.now() - U.freigegeben_at > 3 * 86400000) out.push({ id: a.id, text: `${who}: Übergabeprotokoll noch nicht bestätigt – nachfassen` });
    for (const r of offen.filter((x) => x.kunde_id && x.kunde_id === a.kunde_id)) out.push({ id: a.id, text: `${who}: Rechnung ${r.nr} seit ${r.faellig.split("-").reverse().join(".")} überfällig – Zahlungserinnerung` });
    if (a.status === "abgeschlossen") {
      const d = seit(/^Station: Abgeschlossen/), p = parse(a.produkte, []);
      if (!ck["basis:bewertung"] && d && tage(d) >= 3) out.push({ id: a.id, heute: 1, text: `${who}: um Google-Bewertung bitten (Empfehlungsbonus erwähnen)` });
      if (d && tage(d) >= 30 && ((p.includes("gefunden") && !ck["gefunden:bericht"]) || (p.includes("werbung") && !ck["werbung:auswertung"]))) out.push({ id: a.id, text: `${who}: 30-Tage-Bericht fällig` });
    }
  }
  return out;
}
