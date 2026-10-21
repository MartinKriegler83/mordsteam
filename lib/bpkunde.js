// Brightpage – Kundenseiten nach der Annahme (Block 3 und 4, 21.10.2026):
//   brightpage.net/k/formular/<token>   Auftragsformular (Firmendaten fürs Impressum, Design-Wünsche, Inhalte, Domain, Module je Produkt, Zustimmungen)
//   brightpage.net/k/anleitung/<key>    Einseiter-Anleitungen (Cloudflare, Nameserver, Google-Profil, Meta, Google Ads, Stripe, Brevo)
//   brightpage.net/k/uebergabe/<token>  Übergabeprotokoll mit Bestätigung per Klick
//   brightpage.net/k/av                 Vereinbarung zur Auftragsverarbeitung (Art. 28 DSGVO) – Entwurf, mit WKO/Rechtsberatung prüfen
// Token = bp_auftraege.token (zufällig, 144 Bit). Ausgeliefert über den Durchreicher brightpage/functions/k/[[path]].js.
import { BELEG_CSS, htmlPage, bedingungen, widerruf, AGB_STAND } from "./bpangebot.js";
import { sendMail } from "./ops.js";
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
export const anleitungenFuer = (produkte) => Object.entries(ANLEITUNGEN).filter(([, a]) => a.fuer.some((p) => produkte.includes(p))).map(([k, a]) => ({ key: k, titel: a.titel, titel_en: (ANLEITUNGEN_EN[k] || a).titel }));

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
  { k: "ki", t: "KI-Lösungen", hint: "", fuer: ["ki"], felder: [
    ["ki_infos", "Die häufigsten Fragen Ihrer Kunden – mit Ihren Antworten (Stichworte genügen)", "textarea"],
    ["ki_ton", "Ton", "radio", ["Sie-Form, sachlich", "Sie-Form, herzlich", "Du-Form, locker"]],
    ["ki_tabu", "Was der KI-Assistent nie sagen oder versprechen darf", "textarea"]] },
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

// Englische Fassung der Anleitungen (Menüpunkte so, wie sie in der englischen Oberfläche der Anbieter heißen)
export const ANLEITUNGEN_EN = {
  cloudflare: { titel: "Create a Cloudflare account and invite Brightpage", dauer: "about 10 minutes",
    warum: "Your website runs on Cloudflare – fast, secure and with no hosting costs. The account is yours; Brightpage only gets access as a member and can be removed at any time.",
    brauchen: ["your e-mail address", "a secure password (just for you – never send it to us)"],
    schritte: [
      ["Create the account", "Open dash.cloudflare.com/sign-up, enter your e-mail address and a password and confirm the e-mail from Cloudflare.", ["dash.cloudflare.com/sign-up", "Sign up", "Confirm e-mail"]],
      ["The free plan is enough", "If Cloudflare asks for a plan, choose “Free”. No payment method is needed.", ["Free"]],
      ["Invite Brightpage", "Bottom left “Manage Account” (or the account menu), then “Members” and “Invite”. Enter office@brightpage.net, role “Administrator”, then “Invite”.", ["Manage Account", "Members", "Invite", "office@brightpage.net", "Administrator"]],
      ["Two-factor login (recommended)", "Under “My Profile” → “Authentication” turn on two-factor login with an app.", ["My Profile", "Authentication", "2FA"]],
    ], fertig: "office@brightpage.net appears under “Members” as “Pending” or “Accepted”." },
  nameserver: { titel: "Point your domain to Cloudflare (nameservers)", dauer: "about 10 minutes, usually active within a few hours",
    warum: "To make your domain show the new website, two “nameservers” are entered at your domain provider. The domain stays with your provider and in your name. We move existing mailboxes first so e-mail keeps arriving.",
    brauchen: ["access to your domain provider", "the two nameserver names from us (sent by e-mail, e.g. “anna.ns.cloudflare.com”)"],
    schritte: [
      ["Wait for our go-ahead", "Please only switch once we've sent you the two nameservers and moved the e-mail settings.", ["E-mail from Brightpage"]],
      ["Log in at your provider", "Log in at your domain provider and open the domain.", ["Login", "My domains", "Your domain"]],
      ["Change nameservers", "Find “Nameservers” or “DNS servers”, choose “custom nameservers”, enter the two names from us and remove all others.", ["Nameservers", "Custom nameservers", "Enter 2 names", "Save"]],
      ["Let us know", "Send us a short e-mail – we check that everything has arrived and switch the website live.", ["office@brightpage.net"]],
    ], fertig: "Your provider shows the two Cloudflare nameservers. The switch can take up to 24 hours – the old site stays online until then." },
  "google-profil": { titel: "Add Brightpage as a manager of your Google Business Profile", dauer: "about 5 minutes",
    warum: "So we can complete and maintain your profile. You remain the owner; managers cannot remove owners or delete the profile.",
    brauchen: ["the Google account that manages your profile"],
    schritte: [
      ["Open your profile", "Signed in with the right Google account, search for your business name or open business.google.com.", ["google.com", "Your business name", "Your Business Profile"]],
      ["People and access", "Click the three dots ⋮ → “Business Profile settings” → “People and access”.", ["⋮", "Business Profile settings", "People and access"]],
      ["Invite Brightpage", "“Add”, enter office@brightpage.net, access level “Manager”, “Invite”.", ["Add", "office@brightpage.net", "Manager", "Invite"]],
    ], fertig: "office@brightpage.net is listed under “People and access” (first as “Pending”)." },
  meta: { titel: "Give Brightpage partner access on Facebook and Instagram", dauer: "about 10 minutes",
    warum: "For ads or profile care Brightpage gets partner access – without your password. You can remove it at any time.",
    brauchen: ["your Facebook account with admin rights for your page", "Brightpage's business portfolio ID (we send it to you)"],
    schritte: [
      ["Open business settings", "Open business.facebook.com and go to “Settings” (bottom left). If you don't have a business portfolio yet, create one there.", ["business.facebook.com", "Settings"]],
      ["Add a partner", "“Users” → “Partners” → “Add” → “Give a partner access to your assets”.", ["Users", "Partners", "Add"]],
      ["Enter Brightpage's ID", "Enter Brightpage's business portfolio ID and choose the assets: your Facebook page, your Instagram account and – for ads – your ad account, each with “Manage”.", ["Portfolio ID", "Page", "Instagram", "Ad account", "Save"]],
    ], fertig: "Brightpage is listed under “Partners” with the assets you shared." },
  "google-ads": { titel: "Link your Google Ads account with Brightpage", dauer: "about 5 minutes",
    warum: "The ad account is in your name and you pay the budget directly to Google. Brightpage manages the campaign via a link – without your password.",
    brauchen: ["your Google Ads account (or we set it up together)", "your payment method at Google"],
    schritte: [
      ["Wait for our request", "We send a link request to your Google Ads customer ID (top right in the account, format 123-456-7890).", ["Customer ID to Brightpage"]],
      ["Accept the request", "In Google Ads: “Admin” → “Access and security” → “Managers” → accept Brightpage's request.", ["Admin", "Access and security", "Managers", "Accept"]],
      ["Set a daily limit", "We agree the daily budget with you – you can pause the campaign at any time.", ["Budget", "pause any time"]],
    ], fertig: "Brightpage is listed as linked under “Managers”." },
  stripe: { titel: "Stripe account for your shop", dauer: "about 20 minutes",
    warum: "Stripe lets your shop accept cards, Apple Pay and Google Pay. The account and all revenue are yours; Stripe pays out directly to your bank account.",
    brauchen: ["company details and bank account", "an ID document (Stripe verifies identity)"],
    schritte: [
      ["Create the account", "Open dashboard.stripe.com/register, create the account and complete the business details (“Activate account”).", ["dashboard.stripe.com/register", "Activate account"]],
      ["Invite Brightpage", "Gear icon “Settings” → “Team and security” → “New member”: office@brightpage.net, role “Developer”.", ["Settings", "Team and security", "New member", "Developer"]],
      ["Test mode first", "We set everything up in test mode and do a test purchase together before the shop takes real payments.", ["Test mode", "Test purchase"]],
    ], fertig: "office@brightpage.net is listed under “Team” and your account shows “Payments enabled”." },
  brevo: { titel: "Newsletter account with Brevo", dauer: "about 10 minutes",
    warum: "Brevo is a European newsletter tool, free for up to 2,000 contacts. The account is yours; you write and send your newsletters yourself.",
    brauchen: ["your sender e-mail address", "your business address (required in newsletters)"],
    schritte: [
      ["Create the account", "Open brevo.com, “Sign up free”, fill in your business details and confirm the e-mail.", ["brevo.com", "Sign up free"]],
      ["Give Brightpage access", "Your account (top right) → “Users” (or “Settings” → “Users”) → “Invite user”: office@brightpage.net. If your plan doesn't allow invitations, we set it up together via screen sharing – never send passwords.", ["Users", "Invite user", "office@brightpage.net"]],
      ["Confirm the sender", "Brevo sends a confirmation to your sender address – please click the link.", ["Confirm sender"]],
    ], fertig: "You can log in to Brevo, Brightpage is invited and your sender is confirmed." },
};

// Englische Texte des Auftragsformulars: Abschnitt → [Titel, Hinweis], Feld → [Bezeichnung, Optionen?]
export const FORM_EN = {
  betrieb: ["Your business", "These details go into the imprint and onto the website."],
  firmenname: ["Company or organisation name"], rechtsform: ["Legal form (e.g. sole trader, Ltd, GmbH, association)"], inhaber: ["Owner, managing director or chair"],
  adresse: ["Business address"], telefon: ["Phone number for the website"], email: ["E-mail for the website"], uid: ["VAT ID (if any)"], fn: ["Company register number and court (if registered)"],
  zvr: ["Association register number (associations only)"], gewerbe: ["Trade or profession, responsible authority and chamber"], oeffnungszeiten: ["Opening hours"], social: ["Links to Facebook, Instagram etc."],
  design: ["Design wishes", "Every Brightpage website gets its own design – the more precisely you describe what you like, the better the first draft fits."],
  logo: ["Logo", ["I have a logo – sending it", "No logo – a nice wordmark is enough", "Please design a logo (by arrangement)"]], farben: ["Colours (house colours, colours from the logo, wishes)"],
  stil: ["Style", ["Calm and serious", "Modern and clean", "Warm and crafted", "Playful and colourful", "Elegant and refined"]],
  bildstil: ["Pictures", ["Own photos", "Photorealistic images", "Drawn / illustration", "Abstract (shapes, colours)", "Comic"]],
  vorbilder: ["2–3 websites you like – and what exactly (colours, layout, pictures …)"], nogo: ["What you don't like at all"],
  inhalte: ["Content", ""], abschnitte: ["Which sections should the website have?", ["Welcome", "About us", "Services / offer", "Prices", "Team", "References / testimonials", "Gallery", "Directions / map", "FAQ", "Downloads", "Contact"]],
  texte: ["Texts", ["I supply the texts", "Brightpage writes the texts (booked)", "Partly"]], textinhalt: ["Texts, key points, what makes you special"],
  dateien: ["Link to your files (logo, photos, texts) – e.g. WeTransfer, Dropbox or Google Drive. Or by e-mail to office@brightpage.net."],
  domain: ["Domain and e-mail", ""], domain_status: ["The domain …", ["is already mine", "should be newly registered (in my name)"]],
  registrar: ["Which provider holds the domain?"], mail: ["Mailboxes", ["Already with my provider – stay as they are", "I need new mailboxes", "No own mailboxes"]],
  altseite: ["Existing website: address and what should be kept"],
  shop: ["Shop", ""], produkte: ["Link to the product list (name, price, description, photo per product – a table is fine)"], versand: ["Shipping or pick-up (countries, costs, free from …)"],
  agb: ["Terms and withdrawal notice", ["I supply them", "Please build them in from a template with my details"]],
  gefunden: ["Get found", "Google requires that you expressly instruct us to edit your profile."], google_profil: ["Google Business Profile", ["Exists", "Doesn't exist yet", "Don't know"]],
  google_konto: ["Google account (e-mail) that manages the profile"],
  z_google: ["I instruct Brightpage to create or edit my Google Business Profile and listings on Apple Business Connect, Bing Places and local directories in my name."],
  werbung: ["Online advertising", ""], plattform: ["Platform", ["Google ads", "Instagram / Facebook", "Please advise"]], werbeziel: ["What should the ads achieve? (calls, enquiries, sales, awareness)"],
  budget: ["Monthly ad budget (we recommend from €300, paid directly to the platform)"],
  newsletter: ["Newsletter", ""], nl_tool: ["Newsletter tool", ["New with Brevo (free up to 2,000 contacts)", "I already have a tool"]], nl_absender: ["Sender name and address"],
  ki: ["AI solutions", ""], ki_infos: ["Your customers' most frequent questions – with your answers (key points are enough)"], ki_ton: ["Tone", ["Formal, factual", "Formal, warm", "Informal, relaxed"]],
  ki_tabu: ["What the AI assistant must never say or promise"],
  "termin-a": ["Booking system", ""], buchungssystem: ["Your booking system and the link to the booking page"],
  "termin-b": ["Appointment request Plus", ""], tb_zeiten: ["Times when appointments are possible (per weekday)"], tb_dauer: ["Length of an appointment (minutes)"],
  tb_sperr: ["Blocked days (holidays, closing days)"], tb_mail: ["Which e-mail address receives the requests?"],
  fotos: ["Photos of your business", ""], foto_termin: ["Preferred dates for the photo shoot (up to 2 hours)"], foto_ort: ["Address of the photo shoot"], foto_motive: ["What should be in the photos? (team, rooms, work, products)"],
  editor: ["Online editor", ""], editor_mail: ["Who gets access to the editor? (name and e-mail)"],
  recht: ["Legal texts", "We cannot give legal advice – you supply the texts or use a template from your chamber of commerce."],
  rechtstexte: ["Imprint and privacy policy", ["I supply the texts", "I use a template – Brightpage builds it in with my details"]],
  zustimmung: ["Consents", ""], z_rechte: ["I confirm that I hold the rights to the texts, pictures and logos supplied or may use them."],
  z_av: ["I conclude the data processing agreement (Art. 28 GDPR) with Brightpage (text under the link)."],
};

// ---------- Sprache und Kundenart (D-M5, UX1 – 22.10.2026) ----------
const L2 = (lang, de, en) => (lang === "en" ? en : de);
const qLang = (lang) => (lang === "en" ? "?lang=en" : "");
// Sprache = Sprache des letzten Angebots, sonst der Anfrage
async function spracheVon(env, a) {
  const x = await env.DB.prepare("SELECT sprache FROM bp_angebote WHERE auftrag_id=? AND deleted=0 ORDER BY updated_at DESC LIMIT 1").bind(a.id).first().catch(() => null);
  return ((x && x.sprache) || a.sprache) === "en" ? "en" : "de";
}
async function istB2c(env, a) {
  if (!a.kunde_id) return false;
  const k = await env.DB.prepare("SELECT art FROM bp_kunden WHERE id=?").bind(a.kunde_id).first().catch(() => null);
  return !!k && k.art === "b2c";
}
// Abschnitte für die Kundenseite: Texte englisch, Privatkunden ohne Firmenpflicht. Die Werte der Auswahlfelder bleiben deutsch
// (f[5] = englische Anzeige je Option), damit im Admin alle Angaben einheitlich sind.
function formLoc(secs, lang, b2c) {
  return secs.map((x) => {
    const e = lang === "en" ? FORM_EN[x.k] || [] : [];
    return { ...x, t: e[0] || x.t, hint: e[1] ?? x.hint, felder: x.felder.map((f) => {
      const fe = lang === "en" ? FORM_EN[f[0]] || [] : [], g = [...f];
      if (fe[0]) g[1] = fe[0];
      g[5] = fe[1] || null;
      if (b2c && f[0] === "firmenname") g[1] = L2(lang, "Name (für das Impressum)", "Name (for the imprint)");
      if (b2c && f[0] === "inhaber") g[4] = 0;
      return g;
    }) };
  });
}
const optText = (f, v) => { const i = (f[3] || []).indexOf(v); return i >= 0 && f[5] && f[5][i] ? f[5][i] : v; };
const ZUST_NAMEN = { z_rechte: "Rechte an Inhalten", z_av: "Auftragsverarbeitung", z_google: "Auftrag Google-Profil" };
// Formular erst ab Station „Auftrag“, nicht bei „Verloren“ (UX16)
const FORM_OFFEN = ["auftrag", "bau", "korrektur", "freischaltung", "uebergabe", "schluss", "abgeschlossen"];

// ---------- gemeinsamer Seitenrahmen ----------
function seite(c, titel, inhalt, nonce = "__NONCE__", script = "") {
  return `<!doctype html><html lang="${c.lang === "en" ? "en" : "de"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)} · Brightpage</title>
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
function nichtGefunden(c) { return page(seite(c, "Link ungültig", `<div class="card"><h1>Dieser Link ist nicht (mehr) gültig.</h1><p>Bitte prüfen Sie den Link aus unserer Mail oder schreiben Sie an <a href="mailto:office@brightpage.net">office@brightpage.net</a>.</p><p class="small" lang="en">This link is not (or no longer) valid. Please check the link from our e-mail or write to office@brightpage.net.</p></div>`), 404); }

function feld(f, v, fehler, lang = "de") {
  const [k, l, typ, opt, req] = f, R = req ? ` <span class="req">*</span>` : "", bad = fehler && fehler.includes(k) ? ' style="border-color:#B3261E"' : "";
  if (typ === "text" || typ === "email") return `<label class="f" for="f-${k}">${esc(l)}${R}</label><input type="${typ}" id="f-${k}" name="${k}" value="${esc(v || "")}" maxlength="500"${bad}>`;
  if (typ === "textarea") return `<label class="f" for="f-${k}">${esc(l)}${R}</label><textarea id="f-${k}" name="${k}" maxlength="5000"${bad}>${esc(v || "")}</textarea>`;
  if (typ === "radio") return `<label class="f">${esc(l)}${R}</label><div class="opts">${opt.map((o, i) => `<label><input type="radio" name="${k}" value="${esc(o)}" ${v === o ? "checked" : ""}> ${esc((f[5] && f[5][i]) || o)}</label>`).join("")}</div>`;
  if (typ === "checks") { const vs = Array.isArray(v) ? v : []; return `<label class="f">${esc(l)}${R}</label><div class="opts">${opt.map((o, i) => `<label><input type="checkbox" name="${k}" value="${esc(o)}" ${vs.includes(o) ? "checked" : ""}> ${esc((f[5] && f[5][i]) || o)}</label>`).join("")}</div>`; }
  if (typ === "check") return `<label class="chk"${bad}><input type="checkbox" name="${k}" value="1" ${v ? "checked" : ""}><span>${esc(l)}${R}${k === "z_av" ? ` <a href="/k/av${qLang(lang)}" target="_blank" rel="noopener" style="color:#9A5C06">${L2(lang, "Vereinbarung lesen", "Read the agreement")}</a>` : ""}</span></label>`;
  return "";
}
export function formWert(f, form) {
  const [k, , typ] = f;
  if (typ === "checks") return form.getAll(k).map((x) => s(x, 100)).slice(0, 20);
  if (typ === "check") return form.get(k) === "1";
  return s(form.get(k), typ === "textarea" ? 5000 : 500);
}

function formularSeite(c, a, opts = {}) {
  const lang = c.lang, F = parse(a.formular, {}), d = opts.werte || F.daten || {}, produkte = parse(a.produkte, []), secs = formLoc(formAbschnitte(produkte), lang, opts.b2c);
  const guides = lang === "en" ? anleitungenFuer(produkte).map((g) => ({ ...g, titel: (ANLEITUNGEN_EN[g.key] || g).titel })) : anleitungenFuer(produkte);
  const glink = (g) => `/k/anleitung/${g.key}${qLang(lang)}`;
  const eingereicht = F.eingereicht_at && !opts.bearbeiten;
  const name = a.name || a.firma || "", zeit = (t) => new Date(t).toLocaleString(L2(lang, "de-AT", "en-GB"), { timeZone: "Europe/Vienna" });
  const titel = L2(lang, "Auftragsformular", "Order form");
  if (eingereicht) {
    return seite(c, titel, `<div class="card"><h1>${L2(lang, "Danke – Ihre Angaben sind da.", "Thank you – we have your details.")}</h1><p>${L2(lang, "Eingereicht am", "Submitted on")} ${zeit(F.eingereicht_at)}. ${L2(lang, "Wir melden uns, sobald der erste Entwurf fertig ist. Etwas vergessen oder geändert?", "We'll be in touch as soon as the first draft is ready. Forgot something or want to change it?")} <a href="?bearbeiten=1${lang === "en" ? "&lang=en" : ""}" style="color:#9A5C06">${L2(lang, "Angaben ergänzen", "Edit your details")}</a> ${L2(lang, "oder einfach an", "or simply write to")} <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a>${L2(lang, " schreiben", "")}.</p></div>
      ${guides.length ? `<div class="card guides"><h2>${L2(lang, "Ihre nächsten Schritte", "Your next steps")}</h2><p class="hint">${L2(lang, "Kurze Anleitungen – jeweils ein paar Minuten, ohne Passwörter an uns.", "Short guides – a few minutes each, without sending us any passwords.")}</p>${guides.map((g) => `<a href="${glink(g)}" target="_blank" rel="noopener"><b>${esc(g.titel)}</b><span>→</span></a>`).join("")}</div>` : ""}
      ${zusammenfassung(secs, d, lang)}`);
  }
  const hallo = name ? L2(lang, `Hallo ${esc(name)}, d`, `Hello ${esc(name)}, t`) : L2(lang, "D", "T");
  return seite(c, titel, `<form method="post" id="kf"><input type="hidden" name="v" value="${Number(F.gespeichert_at) || 0}">
    <div class="card"><h1>${L2(lang, "Ihr Auftragsformular", "Your order form")}</h1><p>${hallo}${L2(lang, "amit wir mit Ihrer Website loslegen können, brauchen wir ein paar Angaben. Sie können jederzeit <b>zwischenspeichern</b> und später weitermachen – der Link bleibt gültig.", "o get started on your website we need a few details. You can <b>save</b> at any time and continue later – the link stays valid.")}</p>
      ${F.gespeichert_at && !F.eingereicht_at && !opts.ok ? `<p class="ok">${L2(lang, "Zwischengespeichert am", "Saved on")} ${zeit(F.gespeichert_at)}.</p>` : ""}
      ${opts.fehler ? `<div class="err" role="alert">${esc(opts.fehler)}</div>` : ""}${opts.ok ? `<div class="ok" role="status">${esc(opts.ok)}</div>` : ""}
      <p class="small">${L2(lang, "Felder mit", "Fields marked")} <span class="req">*</span> ${L2(lang, "brauchen wir zum Absenden.", "are needed to submit.")}</p></div>
    ${secs.map((x, i) => `<div class="card"><h2><span class="n">${i + 1}</span>${esc(x.t)}</h2>${x.hint ? `<p class="hint">${esc(x.hint)}</p>` : ""}${x.felder.map((f) => feld(f, d[f[0]], opts.fehlerFelder, lang)).join("")}</div>`).join("")}
    ${guides.length ? `<div class="card guides"><h2>${L2(lang, "Anleitungen für Sie", "Guides for you")}</h2><p class="hint">${L2(lang, "Diese Schritte machen Sie selbst – je ein paar Minuten, ohne Passwörter an uns zu schicken.", "You do these steps yourself – a few minutes each, without sending us any passwords.")}</p>${guides.map((g) => `<a href="${glink(g)}" target="_blank" rel="noopener"><b>${esc(g.titel)}</b><span>→</span></a>`).join("")}</div>` : ""}
    <div class="actions"><button class="btn ghost" type="submit" name="aktion" value="speichern" formnovalidate>${L2(lang, "Zwischenspeichern", "Save for later")}</button><button class="btn amber" type="submit" name="aktion" value="absenden" style="flex:1">${L2(lang, "Absenden", "Submit")}</button></div></form>`);
}
function zusammenfassung(secs, d, lang = "de") {
  const val = (f) => { const v = d[f[0]]; return f[2] === "check" ? (v ? L2(lang, "✓ zugestimmt", "✓ agreed") : "–") : Array.isArray(v) ? v.map((x) => optText(f, x)).join(", ") : v ? optText(f, v) : "–"; };
  return `<div class="card"><h2>${L2(lang, "Ihre Angaben", "Your details")}</h2>${secs.map((x) => `<h3 style="margin:16px 0 6px;font-size:15px;color:#9A5C06">${esc(x.t)}</h3><dl>${x.felder.map((f) => `<dt>${esc(f[1].replace(/\s*\(.*$/, "").slice(0, 80))}</dt><dd>${esc(val(f))}</dd>`).join("")}</dl>`).join("")}</div>`;
}
// Kontext für die Kundenseiten eines Auftrags: Sprache, Kundenart, Sperre vor „Auftrag“ bzw. bei „Verloren“
async function formKontext(env, tok) {
  const c0 = await bpConfig(env), a = await byToken(env, tok);
  if (!a) return { antwort: nichtGefunden(c0) };
  const lang = await spracheVon(env, a), c = { ...c0, lang }, b2c = await istB2c(env, a);
  if (!FORM_OFFEN.includes(a.status)) {
    const verloren = a.status === "verloren";
    return { antwort: page(seite(c, L2(lang, "Auftragsformular", "Order form"), `<div class="card"><h1>${verloren ? L2(lang, "Dieser Auftrag ist nicht mehr aktiv.", "This order is no longer active.") : L2(lang, "Das Auftragsformular ist noch nicht freigeschaltet.", "The order form isn't open yet.")}</h1><p>${verloren ? L2(lang, "Möchten Sie doch loslegen? Schreiben Sie uns einfach an", "Would you like to go ahead after all? Simply write to") : L2(lang, "Es öffnet sich, sobald Sie das Angebot angenommen haben. Fragen? Schreiben Sie an", "It opens as soon as you have accepted the quote. Questions? Write to")} <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a>.</p></div>`), verloren ? 410 : 403) };
  }
  return { c, a, lang, b2c };
}
export async function publicFormular(env, tok, url) {
  const k = await formKontext(env, tok);
  if (k.antwort) return k.antwort;
  return page(formularSeite(k.c, k.a, { b2c: k.b2c, bearbeiten: url.searchParams.get("bearbeiten") === "1" }));
}
const leer = (v) => v === "" || v === false || v == null || (Array.isArray(v) && !v.length);
export async function publicFormularPost(env, tok, form, ip = "") {
  const k = await formKontext(env, tok);
  if (k.antwort) return k.antwort;
  const { c, a, lang, b2c } = k;
  const secs = formLoc(formAbschnitte(parse(a.produkte, [])), lang, b2c), daten = {};
  for (const x of secs) for (const f of x.felder) daten[f[0]] = formWert(f, form);
  const F = parse(a.formular, {});
  let aktion = form.get("aktion") === "absenden" ? "absenden" : "speichern";
  // D-M7: Inzwischen von anderer Stelle gespeichert → zusammenführen (neue, nicht leere Werte gewinnen) statt still zu überschreiben
  const konflikt = !!F.gespeichert_at && (Number(form.get("v")) || 0) !== F.gespeichert_at;
  if (konflikt) { const alt = F.daten || {}; for (const key of Object.keys(daten)) if (leer(daten[key]) && !leer(alt[key])) daten[key] = alt[key]; aktion = "speichern"; }
  if (aktion === "absenden") {
    const alle = secs.flatMap((x) => x.felder), fehlen = alle.filter((f) => f[4] && leer(daten[f[0]])).map((f) => f[0]);
    if (fehlen.length) return page(formularSeite(c, a, { b2c, werte: daten, bearbeiten: true, fehlerFelder: fehlen, fehler: `${L2(lang, "Bitte noch ausfüllen bzw. bestätigen", "Please still fill in or confirm")}: ${fehlen.map((key) => alle.find((f) => f[0] === key)[1].replace(/\s*\(.*$/, "").slice(0, 60)).join(" · ")}` }), 400);
  }
  const t = now(), zust = { ...(F.zustimmungen || {}) };
  for (const [key, v] of Object.entries(daten)) if (key.startsWith("z_") && v && !zust[key]) zust[key] = { at: t, ip: s(ip, 60) };
  const neu = { daten, gespeichert_at: t, eingereicht_at: aktion === "absenden" ? t : F.eingereicht_at || null, zustimmungen: zust };
  await env.DB.prepare("UPDATE bp_auftraege SET formular=?, updated_at=? WHERE id=?").bind(JSON.stringify(neu), t, a.id).run();
  if (aktion === "absenden") {
    const ck = { "basis:formular": true }; if (daten.z_rechte && daten.z_av && (daten.z_google !== false)) ck["basis:zustimmungen"] = true;
    if (daten.z_google) ck["gefunden:zustimmung"] = true;
    await auftragSave(env, { id: a.id, checkliste: ck, next_was: "Auftragsformular prüfen, Bau starten", next_at: today() });
    await auftragNotiz(env, { id: a.id, text: `Auftragsformular ${F.eingereicht_at ? "aktualisiert" : "eingereicht"} vom Kunden (Zustimmungen: ${Object.keys(zust).map((z) => ZUST_NAMEN[z] || z).join(", ") || "keine"}).` });
    return new Response(null, { status: 303, headers: { location: `/k/formular/${tok}${qLang(lang)}`, "cache-control": "no-store" } });
  }
  const ok = konflikt ? L2(lang, "Ihre Angaben wurden inzwischen an anderer Stelle geändert (z. B. in einem anderen Fenster). Wir haben beide Stände zusammengeführt und zwischengespeichert – bitte kurz prüfen und dann absenden.", "Your details were changed elsewhere in the meantime (e.g. in another window). We merged both versions and saved them – please check briefly and then submit.")
    : L2(lang, "Zwischengespeichert – Sie können jederzeit über denselben Link weitermachen.", "Saved – you can continue any time via the same link.");
  return page(formularSeite(c, { ...a, formular: JSON.stringify(neu) }, { b2c, ok, bearbeiten: true }));
}

export async function publicAnleitung(env, key, lang = "de") {
  lang = lang === "en" ? "en" : "de";
  const c = { ...(await bpConfig(env)), lang }, g0 = ANLEITUNGEN[key], g = g0 && lang === "en" ? { ...g0, ...(ANLEITUNGEN_EN[key] || {}) } : g0;
  if (!g) return page(seite(c, L2(lang, "Anleitung", "Guide"), `<div class="card"><h1>${L2(lang, "Anleitung nicht gefunden.", "Guide not found.")}</h1></div>`), 404);
  return page(seite(c, g.titel, `<div class="card"><p class="small" style="color:#9A5C06;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px">${L2(lang, "Anleitung", "Guide")} · ${esc(g.dauer)}</p><h1>${esc(g.titel)}</h1><p>${esc(g.warum)}</p>
      <h3 style="font-size:15px;margin:14px 0 4px">${L2(lang, "Sie brauchen", "You need")}</h3><ul style="margin:0 0 4px;padding-left:20px">${g.brauchen.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
    <div class="card"><ol class="steps">${g.schritte.map(([t, d, p]) => `<li><b>${esc(t)}</b><br>${esc(d)}<div class="path">${p.map((x) => `<span>${esc(x)}</span>`).join("")}</div></li>`).join("")}</ol>
      <p class="ok" style="margin-top:6px"><b>${L2(lang, "Fertig, wenn:", "Done when:")}</b> ${esc(g.fertig)}</p>
      <p class="small">${L2(lang, "Menüs der Anbieter ändern sich manchmal. Finden Sie einen Punkt nicht? Kurz an", "Providers sometimes change their menus. Can't find an item? Just write to")} <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a> ${L2(lang, "schreiben – wir helfen gern, auch per Bildschirmfreigabe. Passwörter bitte nie per Mail schicken.", "– we're happy to help, also via screen sharing. Please never send passwords by e-mail.")}</p>
      <p class="noprint"><button class="btn ghost" type="button" id="pr">${L2(lang, "Drucken / PDF", "Print / PDF")}</button></p></div>`), 200);
}

// AV-Vereinbarung nach Art. 28 DSGVO (überarbeitet 21.10.2026 nach Prüfung gegen Art. 28, WKO-Muster und SCC 2021/915).
// Echte Unterauftragsverarbeiter von Brightpage sind nur Anthropic und Resend; Cloudflare, Brevo und Stripe laufen über Konten des Kunden.
export async function publicAV(env, lang = "de") {
  const c = { ...(await bpConfig(env)), lang: lang === "en" ? "en" : "de" };
  const P = (t) => `<p>${t}</p>`;
  return page(seite(c, "Auftragsverarbeitung", `${c.lang === "en" ? `<div class="card" lang="en"><h1>Data processing agreement</h1><p>Under Art. 28 GDPR between you (controller) and Brightpage (processor). The agreement is concluded in German; the German text below is the binding version. In short: we only process personal data of your website visitors on your instructions and only for the services you booked, keep it confidential and secure, use only Anthropic (AI solutions) and Resend (form e-mails) as sub-processors, report data breaches within 48 hours and delete or return the data when we stop working together. Questions or an English courtesy translation: <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a>.</p></div>` : ""}<div class="card"><h1>Vereinbarung zur Auftragsverarbeitung</h1><p class="hint">nach Art. 28 DSGVO zwischen dem Kunden (Verantwortlicher) und ${esc(c.firma)}, Marke Brightpage (Auftragsverarbeiter). Abgeschlossen elektronisch mit der Zustimmung im Auftragsformular (Art. 28 Abs. 9 DSGVO); Zeitpunkt und Textversion werden gespeichert.</p>
    ${P("<b>1. Gegenstand.</b> Brightpage verarbeitet personenbezogene Daten für den Kunden, nur zum Bau, Betrieb und zur Betreuung der beauftragten Leistungen: speichern, weiterleiten, anzeigen und löschen von Formular-Anfragen, Newsletter-Anmeldungen, Anfragen an KI-Lösungen und Shop-Bestellungen. Die Vereinbarung gilt, solange Brightpage für den Kunden tätig ist.")}
    ${P("<b>2. Daten und Betroffene.</b> Kontaktdaten, Nachrichten und Bestelldaten von Besuchern, Kunden und Interessenten des Kunden. Keine besonderen Kategorien nach Art. 9 DSGVO, außer ausdrücklich vereinbart. Der Kunde weist Nutzer darauf hin, in Formularen und KI-Lösungen keine sensiblen Daten einzugeben.")}
    ${P("<b>3. Rolle des Kunden.</b> Der Kunde ist Verantwortlicher. Er entscheidet über Zweck und Mittel der Verarbeitung und sorgt für die Rechtsgrundlage.")}
    ${P("<b>4. Weisungen.</b> Brightpage handelt nur auf dokumentierte Weisung des Kunden – diese Vereinbarung, das Angebot und Anweisungen per E-Mail –, auch bei Übermittlungen in Drittländer. Verlangt ein Gesetz etwas anderes, informiert Brightpage vorher, sofern das erlaubt ist. Hält Brightpage eine Weisung für rechtswidrig, sagt Brightpage das sofort.")}
    ${P("<b>5. Vertraulichkeit und Sicherheit.</b> Zugriff haben nur Personen, die zur Vertraulichkeit verpflichtet sind. Die technischen und organisatorischen Maßnahmen nach Art. 32 DSGVO stehen in Anlage 1.")}
    ${P("<b>6. Unterauftragsverarbeiter.</b> Der Kunde stimmt zu, dass Brightpage diese Dienste einsetzt: <b>Anthropic PBC</b> (USA) für KI-Lösungen und <b>Resend Inc.</b> (USA) für den Versand von Formular-Mails. Grundlage der Übermittlung ist das EU-US Data Privacy Framework, sofern der Anbieter zertifiziert ist, sonst – und falls das Framework wegfällt – die EU-Standardvertragsklauseln im Vertrag des Anbieters. Brightpage gibt die gleichen Datenschutzpflichten an diese Dienste weiter und haftet für sie. Neue Dienste kündigt Brightpage 14 Tage vorher an; widerspricht der Kunde, kann jede Seite die betroffene Leistung kündigen.")}
    ${P("<b>7. Dienste des Kunden.</b> Cloudflare (Hosting), Brevo (Newsletter) und Stripe (Zahlungen) laufen über Konten des Kunden mit eigenen Verträgen. Brightpage arbeitet dort nur als eingeladenes Mitglied auf Weisung des Kunden.")}
    ${P("<b>8. Unterstützung.</b> Brightpage unterstützt den Kunden bei Anfragen Betroffener (Auskunft, Löschung usw.), bei Datenpannen und bei Datenschutz-Folgenabschätzungen. Eine Datenpanne meldet Brightpage binnen 48 Stunden mit allen bekannten Angaben nach Art. 33 Abs. 3 DSGVO.")}
    ${P("<b>9. Ende.</b> Nach Ende der Zusammenarbeit gibt Brightpage die Daten nach Wahl des Kunden zurück oder löscht sie – ausgenommen, was ein Gesetz aufzubewahren verlangt.")}
    ${P("<b>10. Nachweise.</b> Brightpage stellt alle nötigen Nachweise zur Verfügung und ermöglicht Überprüfungen, auch vor Ort, durch den Kunden oder einen beauftragten Prüfer nach Terminabsprache.")}
    <h3 style="font-size:16px;margin:18px 0 6px">Anlage 1 – Technische und organisatorische Maßnahmen</h3>
    <ul style="margin:0;padding-left:20px"><li>Verschlüsselte Übertragung (HTTPS) für Website, Formulare und Verwaltung</li><li>Zwei-Faktor-Anmeldung bei allen eingesetzten Diensten</li><li>Persönliche Zugänge statt geteilter Passwörter; Zugriff nur, soweit nötig</li><li>Datensparsamkeit: nur Daten, die für die Leistung nötig sind</li><li>Regelmäßige Sicherungen der Website-Stände</li><li>Löschung, sobald der Zweck wegfällt</li></ul>
    <p class="small" style="margin-top:14px">Fassung vom 21.10.2026.</p></div>`));
}

// Muster-Widerrufsformular (FAGG Anhang I Teil B) – für Verbraucher, verlinkt aus der Widerrufsbelehrung im Angebot
export async function publicWiderruf(env, lang = "de") {
  const c = { ...(await bpConfig(env)), lang: lang === "en" ? "en" : "de" };
  if (c.lang === "en") return page(seite(c, "Model withdrawal form", `<div class="card"><h1>Model withdrawal form</h1>
    <p class="hint">Complete and return this form only if you wish to withdraw from the contract – a simple e-mail is just as fine.</p>
    <p>To: ${esc(c.firma)}, ${esc(c.strasse)}, ${esc(c.plz_ort)}, Austria, e-mail: <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a></p>
    <p>I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service (*):</p>
    <p>______________________________________________</p>
    <p>Ordered on (*) / received on (*): ____________________</p>
    <p>Name of consumer(s): ____________________</p>
    <p>Address of consumer(s): ____________________</p>
    <p>Signature of consumer(s) (only if this form is notified on paper): ____________________</p>
    <p>Date: ____________________</p>
    <p class="small">(*) Delete as appropriate.</p>
    <p class="noprint"><button class="btn ghost" type="button" id="pr">Print / PDF</button></p></div>`));
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

// ---------- AGB als eigene Seite (brightpage.net/k/agb) – dieselben Texte wie im Angebot ----------
export async function publicAgb(env, lang = "de") {
  const c = { ...(await bpConfig(env)), lang: lang === "en" ? "en" : "de" }, en = c.lang === "en", T = (d, e) => (en ? e : d);
  const kopf = `${esc(c.firma)}, ${esc(c.strasse)}, ${esc(c.plz_ort)}${c.fn ? " · FN " + esc(c.fn) : ""}${c.uid ? " · UID " + esc(c.uid) : ""}`;
  return page(seite(c, T("AGB", "Terms"), `<div class="card agb"><h1>${T("Allgemeine Geschäftsbedingungen", "Terms and conditions")}</h1>
    <p class="hint">${T("Brightpage, ein Angebot der", "Brightpage, a service of")} ${kopf}. ${AGB_STAND[c.lang]}. ${T("Diese Bedingungen stehen auch in jedem Angebot und gelten mit dessen Annahme.", "These terms are also included in every quote and apply on its acceptance.")}</p>
    <p class="noprint"><a href="#unternehmer" style="color:#9A5C06">${T("A · Für Unternehmer", "A · For businesses")}</a> · <a href="#verbraucher" style="color:#9A5C06">${T("B · Für Verbraucher", "B · For consumers")}</a> · <a href="widerrufen${en ? "?lang=en" : ""}" style="color:#9A5C06">${T("Vertrag widerrufen", "Withdraw from contract")}</a></p></div>
  <div class="card agb" id="unternehmer"><h2>${T("A · Für Unternehmer", "A · For businesses")}</h2><p class="hint">${T("Firmen, Selbstständige und Vereine mit Geschäftsbetrieb.", "Companies, self-employed people and associations with a business operation.")}</p>${bedingungen(c.lang, null, false)}</div>
  <div class="card agb" id="verbraucher"><h2>${T("B · Für Verbraucher", "B · For consumers")}</h2><p class="hint">${T("Privatpersonen und Vereine ohne Geschäftsbetrieb.", "Private individuals and associations without a business operation.")}</p>${bedingungen(c.lang, null, true)}${widerruf(c.lang, c)}</div>
  <p class="noprint" style="text-align:center"><button class="btn ghost" type="button" id="pr">${T("Drucken / PDF", "Print / PDF")}</button></p>
  <style>.kf .agb p{margin:0 0 10px;line-height:1.55}.kf .agb a{color:#9A5C06}</style>`));
}

// ---------- Widerrufsbutton (§ 13a FAGG, seit 1.10.2026): brightpage.net/k/widerrufen ----------
// Nimmt jede Widerrufserklärung an (geprüft wird danach von Hand), bestätigt den Eingang sofort per E-Mail mit Datum und Uhrzeit
// (Absender: Mordsteam-Mailadresse mit Namen „Brightpage“, Antworten an office@brightpage.net) und informiert office@.
let wrReady = false;
async function migrateWr(env) {
  if (wrReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bp_widerrufe (id TEXT PRIMARY KEY, at INTEGER NOT NULL, nr TEXT, name TEXT, email TEXT, nachricht TEXT,
    angebot_id TEXT, auftrag_id TEXT, ip TEXT, mail_ok INTEGER NOT NULL DEFAULT 0, lang TEXT)`).run();
  wrReady = true;
}
const wrZeit = (ms, en) => new Intl.DateTimeFormat(en ? "en-GB" : "de-AT", { timeZone: "Europe/Vienna", dateStyle: "long", timeStyle: "medium" }).format(new Date(ms));
function wrForm(c, en, w = {}, fehler = "") {
  const T = (d, e) => (en ? e : d), v = (k) => esc(w[k] || "");
  return seite(c, T("Vertrag widerrufen", "Withdraw from contract"), `<div class="card"><h1>${T("Vertrag widerrufen", "Withdraw from contract")}</h1>
    <p class="hint">${T("Haben Sie als Verbraucher online einen Vertrag mit Brightpage geschlossen, können Sie ihn binnen 14 Tagen ab Vertragsabschluss ohne Angabe von Gründen widerrufen. Nach dem Absenden bestätigen wir den Eingang sofort per E-Mail mit Datum und Uhrzeit.", "If you concluded a contract with Brightpage online as a consumer, you can withdraw within 14 days of conclusion without giving reasons. After sending, we immediately confirm receipt by e-mail with date and time.")}</p>
    ${fehler ? `<p class="err" role="alert" style="background:#FBE9E5;color:#7A1F14;padding:10px 12px;border-radius:8px">${esc(fehler)}</p>` : ""}
    <form method="post" action="widerrufen${en ? "?lang=en" : ""}">
      <label class="f" for="w-name">${T("Ihr Name", "Your name")} <span class="req">*</span></label><input type="text" id="w-name" name="name" required maxlength="120" value="${v("name")}" autocomplete="name">
      <label class="f" for="w-mail">${T("E-Mail-Adresse (für die Bestätigung)", "E-mail address (for the confirmation)")} <span class="req">*</span></label><input type="email" id="w-mail" name="email" required maxlength="160" value="${v("email")}" autocomplete="email">
      <label class="f" for="w-nr">${T("Angebots- oder Vertragsnummer", "Quote or contract number")} <span class="req">*</span></label><input type="text" id="w-nr" name="nr" required maxlength="40" value="${v("nr")}" placeholder="${T("z. B. AN-2026-001", "e.g. AN-2026-001")}">
      <label class="f" for="w-msg">${T("Nachricht (optional)", "Message (optional)")}</label><textarea id="w-msg" name="nachricht" maxlength="1000">${v("nachricht")}</textarea>
      <input type="text" name="website" value="" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <p style="margin-top:16px"><button class="btn amber" type="submit" style="font-size:17px;padding:14px 22px">${T("Widerruf bestätigen", "Confirm withdrawal")}</button></p>
    </form>
    <p class="small" style="margin-top:12px">${T("Sie können auch einfach eine E-Mail schicken an", "You can also simply send an e-mail to")} <a href="mailto:${esc(c.email)}" style="color:#9A5C06">${esc(c.email)}</a> · <a href="widerruf${en ? "?lang=en" : ""}" style="color:#9A5C06">${T("Muster-Widerrufsformular", "Model withdrawal form")}</a> · <a href="agb${en ? "?lang=en" : ""}" style="color:#9A5C06">${T("AGB", "Terms")}</a></p></div>`);
}
export async function publicWiderrufen(env, lang = "de", form = null, ip = "") {
  const c = { ...(await bpConfig(env)), lang: lang === "en" ? "en" : "de" }, en = c.lang === "en", T = (d, e) => (en ? e : d);
  if (!form) return page(wrForm(c, en));
  await migrateWr(env);
  const w = { name: s(form.get("name"), 120), email: s(form.get("email"), 160).toLowerCase(), nr: s(form.get("nr"), 40).toUpperCase(), nachricht: s(form.get("nachricht"), 1000) };
  if (s(form.get("website"), 200)) return page(wrForm(c, en, w), 200);   // Bot-Falle
  if (w.name.length < 2) return page(wrForm(c, en, w, T("Bitte Ihren Namen angeben.", "Please enter your name.")), 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(w.email)) return page(wrForm(c, en, w, T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid e-mail address.")), 400);
  if (w.nr.length < 3) return page(wrForm(c, en, w, T("Bitte die Angebots- oder Vertragsnummer angeben (steht im Angebot, z. B. AN-2026-001).", "Please enter the quote or contract number (shown in the quote, e.g. AN-2026-001).")), 400);
  const ipk = s(ip, 60), t = now();
  if (ipk) { const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM bp_widerrufe WHERE ip=? AND at>?").bind(ipk, t - 3600000).first(); if (n && n.n >= 5) return page(wrForm(c, en, w, T(`Zu viele Versuche. Bitte schicken Sie Ihren Widerruf per E-Mail an ${c.email}.`, `Too many attempts. Please send your withdrawal by e-mail to ${c.email}.`)), 429); }
  // Passendes Angebot suchen (Nummer + E-Mail des Kunden); gespeichert wird der Widerruf in jedem Fall
  const nr = w.nr.replace(/\s+/g, "");
  const a = await env.DB.prepare("SELECT id, auftrag_id, kunde, annahme FROM bp_angebote WHERE upper(nr)=? AND deleted=0").bind(nr).first().catch(() => null);
  let treffer = null;
  let mailPasst = false;
  if (a) { treffer = a; const k = parse(a.kunde, {}); mailPasst = String(k.email || "").toLowerCase() === w.email; }
  const id = crypto.randomUUID(), zeit = wrZeit(t, en);
  await env.DB.prepare("INSERT INTO bp_widerrufe (id, at, nr, name, email, nachricht, angebot_id, auftrag_id, ip, lang) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(id, t, nr, w.name, w.email, w.nachricht, treffer ? treffer.id : null, treffer ? treffer.auftrag_id : null, ipk, c.lang).run();
  if (treffer && treffer.auftrag_id) await auftragNotiz(env, { id: treffer.auftrag_id, text: `WIDERRUF online erklärt am ${wrZeit(t, false)} von ${w.name} (${w.email}) zu ${nr}${w.nachricht ? ": " + w.nachricht : ""} – bitte prüfen und Erstattung binnen 14 Tagen.` }).catch(() => {});
  // Absender: Adresse aus MAIL_FROM, Name „Brightpage“
  const addr = (/<([^>]+)>/.exec(String(env.MAIL_FROM || "")) || [, String(env.MAIL_FROM || "")])[1];
  const from = addr ? `Brightpage <${addr}>` : undefined;
  const zeilen = `<p><b>${T("Eingegangen am", "Received on")}:</b> ${esc(zeit)}<br><b>${T("Name", "Name")}:</b> ${esc(w.name)}<br><b>${T("E-Mail", "E-mail")}:</b> ${esc(w.email)}<br><b>${T("Angebots-/Vertragsnummer", "Quote/contract number")}:</b> ${esc(nr)}${w.nachricht ? `<br><b>${T("Nachricht", "Message")}:</b> ${esc(w.nachricht)}` : ""}</p>`;
  const kunde = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#15171C"><p>${T(`Guten Tag ${esc(w.name)},`, `Hello ${esc(w.name)},`)}</p>
<p>${T("hiermit bestätigen wir den Eingang Ihres Widerrufs:", "we hereby confirm receipt of your withdrawal:")}</p>${zeilen}
<p>${T("Wir prüfen den Widerruf und melden uns in Kürze. Bereits geleistete Zahlungen erstatten wir binnen 14 Tagen ab Eingang des Widerrufs, abzüglich eines anteiligen Betrags, falls Sie den vorzeitigen Beginn verlangt haben.", "We will review the withdrawal and get back to you shortly. We refund payments already made within 14 days of receipt of the withdrawal, less a proportionate amount if you requested an early start.")}</p>
<p>${T("Liebe Grüße", "Best regards")}<br>Brightpage – ${T("ein Angebot der", "a service of")} ${esc(c.firma)}<br>${esc(c.strasse)}, ${esc(c.plz_ort)} · ${esc(c.email)}</p></div>`;
  let ok = false;
  if (env.RESEND_API_KEY && env.MAIL_FROM) {
    ok = await sendMail(env, "widerruf", { ...(from ? { from } : {}), to: [w.email], reply_to: c.email, subject: T(`Eingangsbestätigung Ihres Widerrufs (${nr})`, `Confirmation of receipt of your withdrawal (${nr})`), html: kunde });
    await sendMail(env, "widerruf-office", { ...(from ? { from } : {}), to: [c.email], reply_to: w.email, subject: `Brightpage: Widerruf eingegangen (${nr})`, html: `<p>Online-Widerruf über brightpage.net/k/widerrufen:</p>${zeilen}<p>${treffer ? `Angebot gefunden – Notiz im Auftrag ist gesetzt. E-Mail ${mailPasst ? "passt zum Angebot" : "<b>weicht von der Angebots-Adresse ab</b> – bitte prüfen"}.` : `<b>Kein Angebot mit dieser Nummer gefunden</b> – bitte von Hand zuordnen.`} Bestätigung an den Kunden: ${ok ? "verschickt" : "<b>NICHT verschickt</b> – bitte selbst bestätigen"}.</p>` });
  }
  if (ok) await env.DB.prepare("UPDATE bp_widerrufe SET mail_ok=1 WHERE id=?").bind(id).run();
  return page(seite(c, T("Widerruf eingegangen", "Withdrawal received"), `<div class="card"><h1>${T("Ihr Widerruf ist eingegangen", "Your withdrawal has been received")}</h1>${zeilen}
    <p>${ok ? T(`Die Bestätigung haben wir soeben an ${esc(w.email)} geschickt.`, `We have just sent the confirmation to ${esc(w.email)}.`) : T(`Die Bestätigung per E-Mail konnte gerade nicht verschickt werden. Bitte speichern oder drucken Sie diese Seite als Nachweis und schicken Sie zusätzlich eine kurze E-Mail an ${esc(c.email)}.`, `The confirmation e-mail could not be sent just now. Please save or print this page as proof and also send a short e-mail to ${esc(c.email)}.`)}</p>
    <p class="noprint"><button class="btn ghost" type="button" id="pr">${T("Drucken / PDF", "Print / PDF")}</button></p></div>`));
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
  ki: ["KI-Lösung mit KI-Hinweis aktiv, Testfragen bestanden"],
  texte: ["Texte vom Kunden freigegeben und auf der Website"],
  fotos: ["Fotos übergeben (Download-Link), Nutzungsrecht für Website und Werbung"],
  termin: ["Terminbuchung auf der Website getestet – Buchung kommt beim Kunden an"],
  social: ["Social-Media-Profile gehören dem Kunden, Bilder und 5 Beitragsvorlagen übergeben"],
};
const ZUGAENGE_EN = {
  basis: ["Website is online at the agreed address", "Contact form tested – enquiries arrive", "Imprint and privacy policy included"],
  web: ["Cloudflare account belongs to the client, Brightpage is only a member", "Domain stays with the domain provider in the client's name"],
  editor: ["Access to the online editor set up, training given"],
  shop: ["Stripe account belongs to the client, test purchase successful", "Client's terms and withdrawal notice included"],
  gefunden: ["Google Business Profile complete, client is owner", "Listings on Apple, Bing and local directories", "Review link and QR cards handed over"],
  werbung: ["Ad account in the client's name, campaign running"],
  newsletter: ["Newsletter tool belongs to the client, sign-up tested, training given"],
  ki: ["AI solution active with AI notice, test questions passed"],
  texte: ["Copy approved by the client and live on the website"],
  fotos: ["Photos handed over (download link), right to use them for website and advertising"],
  termin: ["Booking on the website tested – bookings reach the client"],
  social: ["Social media profiles belong to the client, images and 5 post templates handed over"],
};
export function zugaengeFuer(produkte, lang = "de") {
  const Z = lang === "en" ? ZUGAENGE_EN : ZUGAENGE;
  const L = [...Z.basis];
  if (produkte.some((p) => WEB.includes(p))) L.push(...Z.web);
  if (produkte.some((p) => ["editor", "web-premium", "shop-premium"].includes(p))) L.push(...Z.editor);
  if (produkte.some((p) => SHOP.includes(p))) L.push(...Z.shop);
  for (const k of ["gefunden", "werbung", "newsletter", "ki", "texte", "fotos", "social"]) if (produkte.includes(k)) L.push(...Z[k]);
  if (produkte.some((p) => p === "termin-a" || p === "termin-b")) L.push(...Z.termin);
  return L;
}
const HINWEISE = "Die Domain verlängert sich jährlich bei Ihrem Domain-Anbieter – bitte die Rechnung dort bezahlen.\nHosting bei Cloudflare kostet 0 €; die Website braucht keine Sicherheitsupdates.\nÄnderungen: selbst im Editor (falls gebucht), mit einem Service-Plan oder einzeln (kleine Änderung bis 15 Minuten 35 €, sonst 85 € pro Stunde).\nPasswörter und Zugänge bitte sicher aufbewahren und nie per Mail verschicken.";
const HINWEISE_EN = "Your domain renews yearly with your domain provider – please pay their invoice there.\nHosting on Cloudflare costs €0; the website needs no security updates.\nChanges: yourself in the editor (if booked), with a service plan or one by one (small change up to 15 minutes €35, otherwise €85 per hour).\nPlease keep passwords and logins safe and never send them by e-mail.";

// Admin: Protokoll speichern / freigeben
export async function uebergabeSave(env, b) {
  await migrate(env);
  const a = await env.DB.prepare("SELECT * FROM bp_auftraege WHERE id=? AND deleted=0").bind(s(b.id, 40)).first();
  if (!a) throw err("Auftrag nicht gefunden.", 404);
  const U = parse(a.uebergabe, {});
  if (U.bestaetigt) throw err("Das Protokoll ist schon vom Kunden bestätigt.");
  const punkte = (Array.isArray(b.punkte) ? b.punkte : []).slice(0, 30).map((p) => ({ t: s(p.t, 200), ok: !!p.ok })).filter((p) => p.t);
  const n = { website: s(b.website, 200), einschulung: /^\d{4}-\d{2}-\d{2}$/.test(b.einschulung || "") ? b.einschulung : "", punkte, offen: s(b.offen, 2000), hinweise: s(b.hinweise ?? HINWEISE, 3000) };
  // Nach der Freigabe geändert → Freigabe zurücknehmen, damit der Kunde nichts Halbfertiges bestätigt (UX15)
  const inhalt = (x) => JSON.stringify([x.website || "", x.einschulung || "", x.punkte || [], x.offen || "", x.hinweise || ""]);
  const geaendert = !!U.freigegeben_at && inhalt(n) !== inhalt(U);
  n.freigegeben_at = b.freigeben ? now() : geaendert ? null : U.freigegeben_at || null;
  if (b.freigeben && !n.website) throw err("Bitte die Website-Adresse eintragen.");
  await env.DB.prepare("UPDATE bp_auftraege SET uebergabe=?, updated_at=? WHERE id=?").bind(JSON.stringify(n), now(), a.id).run();
  if (b.freigeben && !U.freigegeben_at) await auftragNotiz(env, { id: a.id, text: "Übergabeprotokoll zur Bestätigung freigegeben." });
  else if (b.freigeben && geaendert) await auftragNotiz(env, { id: a.id, text: "Übergabeprotokoll geändert und erneut freigegeben." });
  else if (geaendert) await auftragNotiz(env, { id: a.id, text: "Übergabeprotokoll nach der Freigabe geändert – Freigabe zurückgenommen, bitte neu freigeben." });
  return { ok: true, token: a.token, freigegeben: !!n.freigegeben_at };
}
export async function uebergabeVorlage(env, id) {
  await migrate(env);
  const a = await env.DB.prepare("SELECT id, sprache, produkte, uebergabe, website FROM bp_auftraege WHERE id=?").bind(s(id, 40)).first();
  const lang = a ? await spracheVon(env, a) : "de";
  return { punkte: zugaengeFuer(parse(a && a.produkte, []), lang).map((t) => ({ t, ok: true })), hinweise: lang === "en" ? HINWEISE_EN : HINWEISE, sprache: lang };
}

function protokollHtml(c, a, U, opts = {}) {
  const lang = c.lang, kunde = a.firma || a.name || "", leistungen = opts.leistungen || [];
  const b = U.bestaetigt, T = L2(lang, "Übergabeprotokoll", "Handover record");
  return seite(c, T, `<div class="card" style="position:relative">${b ? `<div class="stamp" style="top:18px">${L2(lang, "BESTÄTIGT", "CONFIRMED")} ${dat(b.datum)}</div>` : ""}
      <p class="small" style="color:#9A5C06;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px">${T} ${esc(a.nr)}</p>
      <h1>${esc(kunde)}</h1><dl style="margin-top:10px"><dt>Website</dt><dd><a href="${esc(/^https?:/.test(U.website) ? U.website : "https://" + U.website)}" style="color:#9A5C06">${esc(U.website)}</a></dd>
      ${U.einschulung ? `<dt>${L2(lang, "Einschulung am", "Training on")}</dt><dd>${dat(U.einschulung)}</dd>` : ""}${leistungen.length ? `<dt>${L2(lang, "Leistungen laut Angebot", "Services as per quote")}</dt><dd>${leistungen.map(esc).join("\n")}</dd>` : ""}</dl></div>
    <div class="card"><h2>${L2(lang, "Übergeben und geprüft", "Handed over and checked")}</h2>${U.punkte.map((p) => `<div class="chk"><span style="flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:13px;${p.ok ? "background:#2F7D4F;color:#fff" : "background:#E4E1DA;color:#6B6E76"}">${p.ok ? "✓" : "–"}</span><span>${esc(p.t)}</span></div>`).join("")}
      ${U.offen ? `<h3 style="font-size:15px;margin:14px 0 4px">${L2(lang, "Offene Punkte", "Open items")}</h3><p style="white-space:pre-wrap;margin:0">${esc(U.offen)}</p>` : ""}</div>
    <div class="card"><h2>${L2(lang, "Gut zu wissen", "Good to know")}</h2><ul style="margin:0;padding-left:20px">${String(U.hinweise || "").split("\n").filter(Boolean).map((h) => `<li style="margin:4px 0">${esc(h)}</li>`).join("")}</ul></div>
    ${b ? `<div class="card"><p class="ok" style="margin:0">${L2(lang, `Bestätigt am ${dat(b.datum)} um ${esc(b.zeit)} von <b>${esc(b.name)}</b>. Vielen Dank für die Zusammenarbeit!`, `Confirmed on ${dat(b.datum)} at ${esc(b.zeit)} by <b>${esc(b.name)}</b>. Thank you for working with us!`)}</p></div><p class="noprint" style="text-align:center"><button class="btn ghost" type="button" id="pr">${L2(lang, "Drucken / PDF", "Print / PDF")}</button></p>`
      : opts.form ? `<form method="post" class="card" style="border-top:5px solid #D9820B"><h2>${L2(lang, "Übernahme bestätigen", "Confirm handover")}</h2>${opts.fehler ? `<div class="err">${esc(opts.fehler)}</div>` : ""}
        <label class="chk"><input type="checkbox" name="ok" value="1"><span>${L2(lang, `Ich bestätige, dass die Website und die Zugänge wie oben übergeben wurden${U.einschulung ? " und ich eingeschult wurde" : ""}. Offene Punkte sind oben festgehalten.`, `I confirm that the website and the logins were handed over as listed above${U.einschulung ? " and that I received training" : ""}. Open items are recorded above.`)}</span></label>
        <label class="f" for="f-n">${L2(lang, "Ihr Vor- und Nachname", "Your first and last name")}</label><input type="text" id="f-n" name="name" maxlength="120" value="${esc(opts.name || "")}">
        <p style="margin:16px 0 0"><button class="btn amber" type="submit" style="width:100%;font-size:17px;padding:15px">${L2(lang, "Übernahme bestätigen", "Confirm handover")}</button></p>
        <p class="small">${L2(lang, "Mit der Bestätigung gilt die Leistung als abgenommen; danach kommt die Schlussrechnung.", "With your confirmation the work counts as accepted; the final invoice follows.")}</p></form>` : ""}`);
}
async function leistungenFuer(env, a, lang = "de") {
  const x = await env.DB.prepare("SELECT positionen, annahme FROM bp_angebote WHERE auftrag_id=? AND status='angenommen' AND deleted=0 ORDER BY updated_at DESC LIMIT 1").bind(a.id).first().catch(() => null);
  if (!x) return [];
  const pos = parse(x.positionen, []), gew = (parse(x.annahme, {}) || {}).gewaehlt || [];
  return pos.filter((p, i) => !p.opt || gew.includes(i)).map((p) => `${p.text}${p.art === "monat" ? L2(lang, " (monatlich)", " (monthly)") : ""}`);
}
async function protKontext(env, tok) {
  const c0 = await bpConfig(env), a = await byToken(env, tok);
  if (!a) return { antwort: nichtGefunden(c0) };
  const lang = await spracheVon(env, a);
  return { c: { ...c0, lang }, a, lang };
}
export async function publicUebergabe(env, tok) {
  const k = await protKontext(env, tok);
  if (k.antwort) return k.antwort;
  const { c, a, lang } = k, U = parse(a.uebergabe, {});
  if (!U.freigegeben_at) return page(seite(c, L2(lang, "Übergabeprotokoll", "Handover record"), `<div class="card"><h1>${L2(lang, "Das Übergabeprotokoll ist noch in Arbeit.", "The handover record is still being prepared.")}</h1><p>${L2(lang, "Sie bekommen den Link, sobald es fertig ist.", "You'll get the link as soon as it's ready.")}</p></div>`));
  return page(protokollHtml(c, a, U, { form: true, leistungen: await leistungenFuer(env, a, lang) }));
}
export async function publicUebergabePost(env, tok, form, ip = "") {
  const k = await protKontext(env, tok);
  if (k.antwort) return k.antwort;
  const { c, a, lang } = k, U = parse(a.uebergabe, {});
  if (!U.freigegeben_at || U.bestaetigt) return publicUebergabe(env, tok);
  const name = s(form.get("name"), 120);
  if (form.get("ok") !== "1" || name.length < 3) return page(protokollHtml(c, a, U, { form: true, name, leistungen: await leistungenFuer(env, a, lang), fehler: L2(lang, "Bitte das Häkchen setzen und Ihren Namen eintragen.", "Please tick the box and enter your name.") }), 400);
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
  const L = (await env.DB.prepare("SELECT id, nr, firma, name, status, produkte, formular, uebergabe, checkliste, notizen, kunde_id, created_at FROM bp_auftraege WHERE deleted=0 AND status NOT IN ('verloren')").all()).results;
  let offen = [];
  try { offen = (await env.DB.prepare("SELECT i.nr, i.kunde_id, i.faellig, (SELECT g.auftrag_id FROM bp_angebote g WHERE g.deleted=0 AND (g.id=i.angebot_id OR g.rechnung_id=i.id) LIMIT 1) AS auftrag_id FROM bp_invoices i WHERE i.deleted=0 AND i.status='offen' AND i.faellig < ?").bind(t).all()).results; }
  catch { offen = (await env.DB.prepare("SELECT nr, kunde_id, faellig, NULL AS auftrag_id FROM bp_invoices WHERE deleted=0 AND status='offen' AND faellig < ?").bind(t).all()).results; }
  // Rechnung ohne Angebotsbezug → jüngster laufender Auftrag des Kunden (sonst jüngster überhaupt)
  const proKunde = {};
  for (const a of [...L].sort((x, y) => (x.created_at || 0) - (y.created_at || 0))) if (a.kunde_id) { const cur = proKunde[a.kunde_id]; if (!cur || cur.status === "abgeschlossen" || a.status !== "abgeschlossen") proKunde[a.kunde_id] = a; }
  for (const r of offen) { const a = (r.auftrag_id && L.find((x) => x.id === r.auftrag_id)) || (r.kunde_id && proKunde[r.kunde_id]); if (a) out.push({ id: a.id, text: `${a.nr} ${a.firma || a.name}: Rechnung ${r.nr} seit ${r.faellig.split("-").reverse().join(".")} überfällig – Zahlungserinnerung` }); }
  for (const a of L) {
    const who = `${a.nr} ${a.firma || a.name}`, F = parse(a.formular, {}), U = parse(a.uebergabe, {}), ck = parse(a.checkliste, {}), notes = parse(a.notizen, []);
    const seit = (re) => { const n = notes.filter((x) => re.test(x.text)).pop(); return n ? VIENNA.format(new Date(n.at)) : null; };
    const tage = (ymd) => (ymd ? Math.floor((Date.parse(t) - Date.parse(ymd)) / 86400000) : 0);
    if (a.status === "auftrag" && !F.eingereicht_at) { const d = seit(/^Station: Auftrag/); if (d && tage(d) >= 5) out.push({ id: a.id, text: `${who}: Auftragsformular seit ${tage(d)} Tagen offen – nachfassen` }); }
    if (a.status === "uebergabe" && U.freigegeben_at && !U.bestaetigt && Date.now() - U.freigegeben_at > 3 * 86400000) out.push({ id: a.id, text: `${who}: Übergabeprotokoll noch nicht bestätigt – nachfassen` });
    if (a.status === "abgeschlossen") {
      const d = seit(/^Station: Abgeschlossen/), p = parse(a.produkte, []);
      if (!ck["basis:bewertung"] && d && tage(d) >= 3) out.push({ id: a.id, heute: 1, text: `${who}: um Google-Bewertung bitten (Empfehlungsbonus erwähnen)` });
      if (d && tage(d) >= 30 && ((p.includes("gefunden") && !ck["gefunden:bericht"]) || (p.includes("werbung") && !ck["werbung:auswertung"]))) out.push({ id: a.id, text: `${who}: 30-Tage-Bericht fällig` });
    }
  }
  return out;
}
