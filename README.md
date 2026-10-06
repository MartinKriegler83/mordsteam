# Mordsteam

Website, Shop und Spielplattform von **mordsteam.com**. Mordsteam verkauft digitale Krimispiele, die im Browser gespielt werden:

| Produkt | Spielart | Fälle im Code |
|---|---|---|
| **Teams** | Firmen-Teamevent, mehrere Teams treten gegeneinander an, Spielleitung über eigenes Dashboard | `fall-001` „Die rote Mappe“ in drei Paketen: Basic, Premium (2. Akt), Premium Plus (Finale mit KI-Assistenz ARIA) |
| **Friends** | Krimiabend für 4–8 Personen, jede Person am eigenen Handy, gleichzeitig oder zeitversetzt über mehrere Tage | `friends-001` „Letzte Runde auf der Hütte“, Basic und Plus (mit KI-Verhörraum) |
| **Solo** | Einzelspiel am Handy oder Laptop | `solo-001` „Nachtzug nach Venedig“, `solo-002` „Applaus für einen Toten“, `solo-plus-001` „Der letzte Jahrgang“ (mit KI-Verhörraum) |

> **Repository privat halten.** In `lib/` stehen alle Falllösungen. Ausgeliefert wird nur, was `build.sh` nach `dist/` kopiert.

---

## Technik in einem Satz

Statische Seiten (HTML, CSS, Vanilla-JS ohne Build-Tool und ohne Frameworks) auf **Cloudflare Pages**, Server-Logik als **Cloudflare Pages Functions** (`functions/`), Datenbank **Cloudflare D1** (SQLite), Zahlung über **Stripe Checkout**, Mails über **Resend**, KI-Figuren über die **Anthropic Claude API**. Keine npm-Abhängigkeiten im Projekt.

## Ordnerstruktur

```
build.sh                 Build für Cloudflare Pages: erzeugt dist/ (Teaser oder volle Seite, siehe „Build“)
db/schema.sql            Grundschema der D1-Datenbank (Teams-Plattform und Shop)
functions/               Cloudflare Pages Functions (Server)
  _middleware.js           Sprachweiche für "/" (Besucher außerhalb DACH → /en/)
  api/_middleware.js       zählt API-Aufrufe je Bereich, protokolliert Serverfehler (ops_hits, ops_err)
  api/spiel/[[route]].js   Teams: Spiel, Spielleitung, Admin-Bereich (alle Produkte)
  api/solo/[[route]].js    Solo (dünne Hülle um lib/solo.js)
  api/friends/[[route]].js Friends (dünne Hülle um lib/friends.js)
  api/shop/[[route]].js    Shop: Bestellung, Stripe-Webhook, Mails, Feedback, Kontakt, Widerruf, Cron
lib/                     Spiellogik – wird nie ausgeliefert, nur von functions/ importiert
  game.js                  Teams-Logik: Fälle, Stufen, Funksprüche (hintTimes), Wertung, Statistik
  create.js                Spielrunde anlegen (Admin und Bestellung), Datenbank-Migrationen (migrate)
  solo.js / friends.js     Logik für Solo und Friends inkl. eigener Tabellen und Migrationen
  countries.js             Länderprofile (37 Länder): Behörden, Währung, IBAN, Kennzeichen, Telefon, Städte, Namen
  cases/                   Die Fälle (Texte, Beweisstücke, Lösungen, Hinweise, KI-Prompts)
    fall-001.js / fall-001-en.js   Teams-Fall, deutsch und englische Textschicht
    friends-001.js, solo-001.js, solo-002.js, solo-plus-001.js   Friends- und Solo-Fälle (deutsch, mit der Logik)
    *-en.js                  englische Textschicht je Fall: exportiert nur die Exporte mit sichtbarem Text, gleiche Namen und Struktur
  stripe.js                Stripe-Hilfe für lib/ (der Shop hat eine eigene Kopie)
  accounting.js            Buchhaltung: Einnahmen nach Kundenart und Region, EU-Privatkunden-Schwelle, Kostenvorlagen
  ledger.js                Ausgabenbuch, Einnahmen-Ausgaben-Rechnung je Monat, Reverse Charge je Quartal (inkl. Stripe-Gebühren), Fristen, CSV-Exporte
  feedback.js              Feedback-Mails und -Bögen, Bewertungen
  withdraw.js              Widerrufsfunktion für Verbraucher
  contact.js               Kontaktformular (Spam-Schutz, Limit)
  ops.js                   Betrieb: Mail-Versand, KI-Verbrauch, Zähler, Warnmails
site/                    Öffentliche Website (deutsch) + site/en/ (englisch, generiert)
  spiel/                   Spielplattform „Fallzentrale“: Oberflächen für Teams, Leitung, Solo, Friends, Admin, Urkunde
  assets/                  CSS, Seiten-Skripte, Schriften
  _headers                 Sicherheits-Header, noindex für /spiel/ und Bestellseiten
teaser/                  Platzhalter-Startseite und Impressum für den Teaser-Modus, englisch unter teaser/en/ (index, imprint), paddle-root.html (vorübergehend Startseite für die Paddle-Prüfung)
tools/                   Prüf- und Hilfsskripte (siehe „Lokal testen“)
  en_pages.py              erzeugt site/en/*.html (englische Seiten nie direkt bearbeiten)
  check_*.mjs              Prüfskripte je Fall (Eindeutigkeit der Lösung über alle Varianten); check_*_en.mjs prüft die englische Fassung gegen die deutsche
  github-workflow-feedback-mails.yml   Vorlage der GitHub-Action (Kopie von .github/workflows/feedback-mails.yml)
.github/workflows/feedback-mails.yml   stündlicher Aufruf von /api/shop/cron
faelle/                  alte Arbeitsdokumente (nicht ausgeliefert)
design/                  Designentwürfe (nicht ausgeliefert)
```

## Wie die Produkte technisch funktionieren

### Teams (`/spiel/`)
- Eine **Spielrunde** (`sessions`) gehört zu einer Bestellung oder wird im Admin angelegt. Sie enthält die Eingaben des Bestellers (`vars`: Firma, Namen, Räume, Land, Sprache, Logo …) und die gewürfelten Falldaten (`secrets`: Täter, Uhrzeiten, Kontonummern, Passwörter …). Alle Texte entstehen zur Laufzeit aus Vorlage + `vars` + `secrets`.
- Teams treten mit dem **Beitrittscode** bei (`join`), Zuschauergeräte über `mitlesen` (`viewers`). Die Spielleitung meldet sich mit dem **Leitungscode** an (`leitung/login`), öffnet, startet und beendet die Runde.
- Stufen: Akt 1 (`wer`, `wann`, `warum`, `wo`), Premium zusätzlich Akt 2 (`helfer`, `fach`), Premium Plus zusätzlich Finale (`pin`, mit ARIA). Antworten gehen als ganze Stufe an `loesung`; Fehlversuche kosten Strafminuten, nach zwei Fehlversuchen gibt es `kontrolle`.
- **Funksprüche** (automatische Hinweise) kommen nach Zeitplan je Paket (`HINTS` im Fall); für Akt 2 und Finale je Team relativ zum Akt-Start (`HINTS_REL`, `hintTimes()` in `lib/game.js`).
- **Firmen-Intranet** (`firma`, `firma/login`): fiktive Intranetseiten der Kundenfirma; der Login-Bereich verlangt ein Passwort aus Hund + Jahr. Fehlversuche je Team werden gezählt (`teams.login_fails`), ab dem 3. und 6. zeigt die Fehlermeldung zusätzliche Hilfe.
- **ARIA** (Premium Plus, `aria`, `aria/chat`, `aria/kennwort`): KI-Assistenz im Intranet; Verlauf in `aria_msgs`.
- **Zusatzermittlung** (`bonus`, `bonus/fertig`): nach dem Lösen 3 Bonusfragen, je richtig −2 Min. Wertung. **Sonderauftrag** (`sonder`, `sonder/chat`): nur Premium Plus und nur wenn das Team vor Minute 70 fertig ist; KI-Verhör, richtiges Ziel = Auszeichnung „Sonderermittler“ in der Rangliste (keine Minuten, `ranking().sonder`; Entscheidung 4.10.2026) Verlauf in `aria_msgs` mit Rollen `v-user`/`v-ai`.
- Die Runde endet automatisch, wenn alle Teams gelöst **und** die Zusatzermittlung abgeschlossen haben (`finishIfAllSolved`). Danach Auflösung, Rangliste, Urkunde (`/spiel/urkunde.html`), Statistik in `stats_teams`.
- Sprache der Runde (`sessions.lang`): Deutsch oder Englisch; `caseOf()` legt `fall-001-en.js` über die deutsche Fassung.

### Solo (`/spiel/solo.html`)
- Ein Kauf erzeugt ein **Ticket** (`solo_tickets`, Code). Jeder Durchgang ist ein **Run** (`solo_runs`) mit eigenem Täter; der erste zählt für den Vergleich („schneller als X %“, `solo_scores`). Verhöre in `solo_chat`.
- Zum Ticket gehört ein 5-€-Gutscheincode für Friends/Teams (Stripe-Promotion-Code).
- Spielsprache: `solo_tickets.lang`. `soloCase(id, lang)` in `lib/solo.js` legt bei `en` die Textschicht `<id>-en.js` über das deutsche Modul (`{ ...DE, ...EN }`). Der Spielstand liefert `lang`, die Oberfläche übernimmt sie.

### Friends (`/spiel/friends.html`)
- Eine **Gruppe** (`friends_groups`) hat einen Fall für alle (Besetzung, Täter, Zeitvariante), jede Person einen eigenen Durchgang (`friends_players`). Modus `live` (gemeinsame Uhr, Organisator startet) oder `week` (3/5/7 Tage, jeder startet selbst). Lösung und Rangliste erst bei der gemeinsamen Auflösung (`org/reveal` oder automatisch per Cron). Verhöre in `friends_chat`.
- Spielsprache: `friends_groups.lang`, gilt für die ganze Gruppe; `friendsCase(id, lang)` in `lib/friends.js` wie bei Solo. Einladung, Spielstand und Organisator-Seite liefern `lang`.

### Shop (`/api/shop/`)
- Bestellseiten: `bestellen.html` (Teams), `friends-kaufen.html`, `solo-kaufen.html` (+ englische Gegenstücke).
- Alle drei Bestellformulare haben das Feld Spielsprache (`lang`, unabhängig von der Website-Sprache `site`); es landet in `orders.contact.lang` und von dort in Spielrunde, Gruppe bzw. Ticket.
- Alle drei Bestellformulare haben das Kästchen „Bitte keine Neuigkeiten per E-Mail“ (`consent.no_news`). Angekreuzt landet `no_news: true` in `orders.contact`.
- Newsletter-Kürzel: Links aus Newslettern tragen `?nl=<kürzel>`. `assets/menu.js` hängt es an interne Links (keine Speicherung im Browser) und zählt den Besuch (`nl-besuch`); die Bestellformulare schicken es mit, es landet in `orders.contact.nl`.
- Ablauf: Formular → `bestellung` / `friends` / `solo` legt `orders` (Status `pending`) an → Stripe Checkout → Webhook `stripe-webhook` (`checkout.session.completed`) → `fulfill()` legt Spielrunde/Gruppe/Ticket an und schickt die Bestellmail → `bestellt.html` fragt `status` ab.
- Preise stehen im Code, in Cent, als Endpreise: Teams `PRICES` in `functions/api/shop/[[route]].js`, Friends `FRIENDS_PRICE`/`FRIENDS_PRICE_PLUS` in `lib/friends.js`, Solo je Fall (`price` in der Produktliste direkt unter `PRICES`).
- Early Bird: Rabatt als Stripe-Coupon, gesteuert über `EARLYBIRD_*`.
- `cron` (POST, Header `x-cron-key`): löst fällige Friends-Wochenrunden auf, verschickt fällige Feedback-Mails. Aufgerufen stündlich von der GitHub-Action.
- Newsletter (`lib/newsletter.js`): `POST newsletter` (Anmeldung, schickt Bestätigungsmail), `GET newsletter/bestaetigen?t=`, `GET newsletter/abmelden?t=`, `GET nl-besuch?nl=`. Nach jeder angelegten Bestellung ruft `fulfill()` `nlAfterOrder()` auf: bezahlte Bestellung ohne `no_news` → Kontakt (Quelle `kunde`), Abgleich mit der ECG-Liste, Übertragung zu Resend (Contacts, Segment je Sprache „Mordsteam DE/EN“, IDs in `nl_settings`). `no_news` bei einer späteren Bestellung meldet ab. Bei Resend Abgemeldete werden nie wieder aufgenommen.
- Weitere Routen: `meta`, `friends-meta` (Preise, Shop offen?), `feedback` (GET/POST Bogen), `bewertungen` (freigegebene Bewertungen), `kontakt`, `widerruf`, `status`.

### Admin (`/spiel/admin.html`)
Zugriff mit dem Admin-Schlüssel (Header `x-admin`). Funktionen: Spielrunden anlegen/löschen, Bestellungen, Solo-Tickets und Friends-Gruppen anlegen und auflisten, Statistik, Feedback freigeben, Betrieb (Mails, KI-Verbrauch, Aufrufe, Fehler), Buchhaltung im Tab „Bestellungen & Finanzen“ (Hauptquelle, ersetzt die frühere Excel-Datei): Einnahmen-Übersicht, Ausgabenbuch mit Steuerart, Kategorie, betrieblichem Anteil und „privat bezahlt“, E/A-Rechnung je Monat und Kategorie, Fristen und Meldungen (Reverse-Charge-Quartale, Zusammenfassende Meldung, U1, E1), Warnungen (mögliche Duplikate, händisch erfasste Stripe-Gebühren, laufende Kosten ohne Buchung seit „Seit“), Exporte Einnahmen/Ausgaben/E/A-Rechnung als CSV, Belege je Ausgabe hochladen und ansehen, alle Belege eines Jahres als ZIP (im Browser gebaut, mit Ausgaben-CSV), Export. Tab „Kunden & Newsletter“: Kundenauswertung je E-Mail-Adresse (Wiederkäufe, Solo-Gutschein über `orders.promo_code`, Bestellungen über Newsletter), Newsletter-Liste und Übertragung, Upload der ECG-Liste (Datei `ecg-liste.hash` der RTR: aneinandergereihte SHA-1-Werte à 20 Byte von Adresse bzw. `@domain`, wird im Browser in Teilen hochgeladen), Newsletter-Entwurf mit Vorschau → Broadcast-Entwurf in Resend (gesendet wird in Resend).

## API-Routen

Alle Routen liefern JSON. Fehlermeldungen kommen in der Spielsprache bzw., wenn noch keine Runde bekannt ist, in der Sprache aus dem Header `x-lang`. Authentifizierung über Header:

| Header | Wer |
|---|---|
| `x-admin` | Admin-Bereich |
| `x-leitung` | Spielleitung einer Teams-Runde (Token aus `leitung/login`) |
| `x-team` / `x-view` | Teamgerät / Zuschauergerät |
| `x-solo` | Solo-Run |
| `x-friends` | Friends-Spieler bzw. Organisator |
| `x-cron-key` | GitHub-Action |

**`/api/spiel/…`** (Teams und Admin)
- Spiel: `GET state`, `GET akte`, `GET code`, `POST join`, `POST mitlesen`, `POST loesung`, `POST kontrolle`, `GET firma`, `POST firma/login`, `GET aria`, `POST aria/chat`, `POST aria/kennwort`, `POST bonus`, `POST bonus/fertig`, `GET sonder`, `POST sonder/chat`, `POST feedback`
- Leitung: `POST leitung/login`, `GET leitung/state`, `POST leitung/aktion`, `GET leitung/aufloesung`
- Admin: `POST admin/session`, `GET admin/sessions`, `POST admin/delete`, `GET admin/orders`, `POST admin/order-shipped`, `GET admin/stats`, `GET admin/export`, `GET admin/meta`, `GET admin/ops`, `GET admin/buchhaltung`, `GET/POST admin/kosten`, `POST admin/kosten/loeschen`, `GET admin/ausgaben?jahr=`, `POST admin/ausgaben`, `POST admin/ausgaben/loeschen`, `POST admin/ausgaben/doppelt-ok`, `POST admin/rc/bezahlt` (`quartal`, `paid`, `datum`), `POST admin/pflicht` (`key` zm:/u1:/e1:), `POST admin/est-vz` (`jahr`, `euro`), `POST admin/kosten/ueberspringen` (`cost_id`, `period`, `undo`), `POST admin/ausgaben/zuordnen` (`id`, `cost_id`), `GET admin/export/ausgaben?von=&bis=`, `GET admin/export/ea?jahr=`, `POST admin/ausgaben/beleg?id=` (roher Body, Kopf `x-filename`; PDF/JPG/PNG/HEIC/WebP bis 20 MB), `GET admin/ausgaben/beleg?file=`, `POST admin/ausgaben/beleg/loeschen` (nur markieren, Datei bleibt im Speicher), `GET admin/feedback`, `POST admin/feedback-approve`, `POST admin/feedback-run`, `GET admin/kunden`, `GET admin/newsletter`, `POST admin/newsletter/sync`, `POST admin/newsletter/ecg` (`phase` start/chunk/done), `POST admin/newsletter/entwurf` (`preview: true` = nur Vorschau)
- Nur Testrunden: `POST test/vorspulen` (Spielzeit vorspulen)

**`/api/solo/…`** (Admin-Testticket: `admin/ticket` mit `case`, `lang`, `name`): `start`, `begin`, `state`, `answer`, `hint`, `verhoer`, `aufgeben`, `ticket`, `feedback`, `test/vorspulen`, `admin/list`, `admin/ticket`

**`/api/friends/…`** (Admin-Testgruppe: `admin/group` mit `n`, `lang`, `plus`, `mode`): `claim`, `begin`, `state`, `answer`, `hint`, `verhoer`, `aufgeben`, `invite`, `org`, `org/start`, `org/reveal`, `feedback`, `admin/list`, `admin/group`

**`/api/shop/…`**: siehe Abschnitt Shop.

## Datenmodell (D1)

Grundschema in `db/schema.sql`. Neue Spalten und Tabellen werden zusätzlich beim ersten Aufruf automatisch angelegt (`migrate()` in `lib/create.js`, eigene Migrationen in `lib/solo.js`, `lib/friends.js`, `lib/feedback.js`, `lib/ops.js`, `lib/contact.js`). **Neue Spalten immer an beiden Stellen eintragen** (schema.sql für neue Datenbanken, Migration für bestehende).

| Tabelle | Inhalt |
|---|---|
| `sessions` | Teams-Spielrunde: Fall, Paket (`premium` 0/1/2), Status, Datum, `vars`, `secrets`, Beitritts- und Leitungscode, Testmodus, Sprache, Logo, max. Teams |
| `teams` | Team einer Runde: Token, Stufenzeiten (`core_at`, `act2_at`, `solved_at`), Strafminuten, Fehlversuche, Hinweise, ARIA-Status, Bonus, `login_fails` |
| `attempts` | jeder Lösungsversuch (Payload, richtig/falsch) |
| `viewers` | Zuschauergeräte je Team |
| `aria_msgs` | Chatverlauf ARIA und Sonderauftrag |
| `stats_teams` | anonymisierte Statistik je Team nach Spielende |
| `orders` | Bestellungen aller Produkte: Paket, Betrag (Cent), Status, Kontakt, Stripe-Session, Zahlungs-/Versanddaten, Feedback-Token |
| `feedback` | Feedbackbögen und Bewertungen (Veröffentlichung nur mit Zustimmung und Freigabe) |
| `solo_tickets`, `solo_runs`, `solo_chat`, `solo_scores` | Solo |
| `friends_groups`, `friends_players`, `friends_chat` | Friends |
| `ops_mail`, `ops_ai`, `ops_hits`, `ops_err`, `ops_alerts` | Betriebszähler (keine Inhalte, keine Empfänger) |
| `expenses` | Ausgabenbuch: Rechnungsdatum, bezahlt am, Verkäufer (`anbieter`), Rechnungsnummer, Rechnungswährung (`waehrung` EUR/USD/GBP), Rechnungsbetrag und USt laut Rechnung (`rechnung_cents`, `rechnung_ust_cents`), Euro-Betrag laut Konto (`betrag_cents`), davon Fremdwährungsgebühr der Bank (`fx_fee_cents`, zählt als Bankspesen, nicht in Reverse Charge) und USt in Euro (`ust_cents`, bei Fremdwährung im Verhältnis der Rechnung aus dem Rechnungswert gerechnet), Kategorie, Steuerart (`rc`, `at_ust`, `ausl_ust`, `ohne`), Betrag in Euro (bei Reverse Charge netto), Anteil, bezahlt von (`konto`/`privat`), Beleg, `cost_id` (Vorlage), `dup_ok`, `bank_ref` (für den späteren Kontoauszug-Import); Löschen setzt `deleted=1`. Belege der früheren Tabelle `rc_entries` werden einmalig übernommen |
| `expense_files` | Belege zu Ausgaben: Name, Typ, Größe, Schlüssel im R2-Speicher (`belege/<Jahr>/<Ausgabe>/<Datei>`), `deleted` |
| `rc_payments` | Zahlungen der Reverse-Charge-USt je Quartal mit Betrag; offen = Quartalssteuer − Zahlungen (Nachträge nach der Zahlung → „Nachzahlung offen“). Alte Tabelle `rc_paid` wird einmalig übernommen |
| `ledger_settings` | Einstellungen der Buchhaltung, z. B. `est_vz_<Jahr>` = Einkommensteuer-Vorauszahlung je Quartal „Cent\|gespeichert am“ |
| `cost_skips` | übersprungene Zeiträume laufender Kosten (`cost_id`, `period` = JJJJ-MM des Zeitraumbeginns) |
| `duties_done` | erledigte Meldungen (`zm:JJJJ-MM`, `u1:JJJJ`, `e1:JJJJ`) |
| `cost_items` | Kostenvorlagen im Admin (mit `frist` = in „Fristen und Meldungen“ zeigen, z. B. SVS/WKO; `tag` = Abbuchung am Monatstag: fehlende Buchung wird 3 Tage danach gemeldet, sonst nach Ende des Zeitraums) (Posten, Rhythmus, Betrag, betrieblicher Anteil, Beleg); Startliste wird einmal angelegt, Löschen setzt `deleted=1` |
| `contact_log` | Hash der IP für das Limit von Kontaktformular und Newsletter-Anmeldung, nach 24 h gelöscht |
| `nl_contacts` | Newsletter-Empfänger: Quelle (`kunde`/`anmeldung`), Status (`pending`/`active`/`unsub`/`ecg`), Sprache, Token für Bestätigen/Abmelden, Einwilligungstext mit Zeitpunkten, Übertragung zu Resend |
| `nl_ecg` | ECG-Liste der RTR als SHA-1-Hex (nur die aktuelle Version) |
| `nl_settings` | Resend-Segment-IDs, Stand der ECG-Liste |
| `nl_visits` | Besuche über Newsletter-Links je Kürzel und Tag (ohne Personendaten) |
| `nl_drafts` | an Resend geschickte Newsletter-Entwürfe |

## Umgebungsvariablen (Cloudflare Pages → Settings → Variables and Secrets)

Nur Namen, keine Werte. Production und Preview haben je eigene Werte.

| Name | Art | Zweck |
|---|---|---|
| `DB` | D1-Binding | Datenbank (Production: `mordsteam-live`, Preview: Testdatenbank) |
| `BELEGE` | R2-Binding | Belege der Buchhaltung (Fotos, PDFs). Production: Bucket `mordsteam-belege`, Preview: `mordsteam-belege-test`. Ohne Binding: Upload im Admin ausgeblendet |
| `ADMIN_KEY` | Secret | Zugang zum Admin-Bereich |
| `CRON_KEY` | Secret | Schutz der Route `shop/cron` (gleicher Wert als GitHub-Repository-Secret `CRON_KEY`) |
| `ANTHROPIC_API_KEY` | Secret | Claude API für ARIA, Verhörräume, Sonderauftrag. Fehlt er, antworten die Figuren im Notfallmodus mit festen Texten. |
| `STRIPE_SECRET_KEY` | Secret | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Secret | Signaturprüfung des Stripe-Webhooks |
| `RESEND_API_KEY` | Secret | Mailversand; für den Newsletter (Kontakte, Segmente, Broadcasts) mit **Full access** |
| `ECG_API_KEY` | Secret | optional: API-Key der RTR (Entwickler-Schnittstelle der ECG-Liste). Gesetzt → jede Kundenadresse wird vor der Newsletter-Übertragung automatisch geprüft (SHA-512 von Adresse und Domain); sonst Abgleich gegen die im Admin hochgeladene Hash-Datei |
| `MAIL_FROM` | Text | Absender der automatischen Mails; ohne ihn werden keine Mails verschickt |
| `ARIA_MODEL` | Text | Claude-Modell (Standard: `claude-haiku-4-5-20251001`) |
| `SHOP_OPEN` | Text | `true` = Bestellungen möglich |
| `ORDER_FAKE_PAY` | Text | `true` = Bestellung ohne Stripe gilt als bezahlt (nur Tests) |
| `LAUNCH` | Text (Build) | `true` = auf `main` volle Seite statt Teaser |
| `EARLYBIRD_PROZENT`, `EARLYBIRD_BIS`, `EARLYBIRD_COUPON` | Text | Early-Bird-Rabatt (Standard 25 %), Enddatum (Standard 2026-11-30), Stripe-Coupon |
| `KI_BUDGET_USD` | Text | Monatsbudget Claude API, Warnung bei 70 % (Standard 20) |
| `MAIL_LIMIT_DAY`, `MAIL_LIMIT_MONTH` | Text | Mail-Kontingent für Warnungen (Standard 100 / 3000; 0 = kein Limit) |
| `REQ_LIMIT_DAY` | Text | Aufruflimit pro Tag für Warnungen (Standard 100000; 0 = kein Limit) |
| `ALERT_TO` | Text | Empfänger der Warnmails (Standard office@mordsteam.com) |
| `PUBLIC_ORIGIN` | Text | Basis-URL in Mails (Standard https://mordsteam.com) |
| `ASSETS` | automatisch | statische Dateien (von Pages bereitgestellt) |

GitHub-Repository-Secret: `CRON_KEY`.

## Build

Cloudflare Pages führt `build.sh` aus und veröffentlicht `dist/`:
- Branch `main` und `LAUNCH` ≠ `true` → **Teaser-Modus**: nur `teaser/index.html` und `teaser/impressum.html` als öffentliche Seite, englisch `teaser/en/` → `/en/` (seit 6.10.2026 eine Angebotsseite mit Spielen, Preisen, Erstattung, AGB, Datenschutz und Impressum statt „Coming soon“ – für die Prüfung durch Paddle; erzeugt von `tools/en_pages.py` aus products.html, ohne Bestellknöpfe) und `/en/imprint.html` (Besucher außerhalb von DACH werden über `functions/_middleware.js` dorthin geleitet, Umschalter DE · EN oben rechts). **Vorübergehend während der Paddle-Prüfung** (`PADDLE_PRUEFUNG=1` in `build.sh`) zeigt auch `/` diese englische Angebotsseite (`teaser/paddle-root.html`, ohne Sprachumschalter, ebenfalls von `tools/en_pages.py` erzeugt); nach der Freigabe `PADDLE_PRUEFUNG=0` → wieder `teaser/index.html` („Coming soon“). Dazu `site/spiel/` (nicht verlinkt, `noindex`) und die Assets.
- Alle anderen Fälle (Branch `vorschau`, oder `LAUNCH=true`) → **volle Seite**: ganz `site/`.

Die Functions (`functions/`) laufen in beiden Modi.

## Deploy

- **Production:** Push auf `main` → Cloudflare baut und veröffentlicht mordsteam.com.
- **Vorschau:** `git push origin main:vorschau` → Preview-Deployment des Branches `vorschau` mit voller Seite. Variablen und Datenbank-Binding für Preview werden in Cloudflare getrennt von Production eingestellt.

```
cd ~/Projekte/mordsteam
git add -A
git commit -m "Was geändert wurde"
git push
git push origin main:vorschau
```

## Lokal testen

Voraussetzung: Node.js. Wrangler wird per `npx` geladen.

1. **Prüfskripte** (ohne Server), nach jeder Änderung an einem Fall:
   ```
   node tools/check_teams.mjs
   node tools/check_teams002.mjs
   node tools/check_solo001.mjs
   node tools/check_solo002.mjs
   node tools/check_soloplus.mjs
   node tools/check_friends.mjs
   for f in tools/check_*_en.mjs; do node $f; done
   ```
   Alle müssen ohne „FEHLER“ enden. `check_teams.mjs` und `check_teams002.mjs` rufen zusätzlich zwei Wächter auf: `tools/regio_guard.mjs` (keine österreichischen Wörter in DE/CH/LI-Runden) und `tools/answer_guard.mjs` (die richtigen Antworten jeder Stufe zählen über `checkAnswers` als richtig, falsche und Vornamen anderer Personen als falsch – in allen Paketen, Sprachen und Ländern).
2. **Englische Seiten neu erzeugen** nach Änderungen an deutschen Seiten mit englischem Gegenstück: `python3 tools/en_pages.py`
3. **Lokaler Server mit Datenbank**: Im Projektordner eine `wrangler.toml` und eine `.dev.vars` anlegen (beide stehen in `.gitignore` und dürfen nie committet werden – eine `wrangler.toml` im Repo würde die Einstellungen des Cloudflare-Projekts überschreiben):
   ```toml
   # wrangler.toml (nur lokal)
   name = "mordsteam"
   compatibility_date = "2024-09-01"
   pages_build_output_dir = "dist"
   [[d1_databases]]
   binding = "DB"
   database_name = "mordsteam"
   database_id = "local"
   ```
   ```
   # .dev.vars (nur lokal, Testwerte)
   ADMIN_KEY=testkey
   SHOP_OPEN=true
   ORDER_FAKE_PAY=true
   ```
   Dann:
   ```
   CF_PAGES_BRANCH=vorschau sh build.sh
   npx wrangler d1 execute mordsteam --local --file db/schema.sql
   npx wrangler pages dev dist --port 8790
   ```
   Seite: http://localhost:8790, Admin: http://localhost:8790/spiel/admin.html (Schlüssel aus `.dev.vars`). Ohne `ANTHROPIC_API_KEY` laufen alle KI-Figuren im Notfallmodus. Testrunden (`test_mode`) lassen sich mit `test/vorspulen` vorspulen. Mails und Newsletter lokal testen: in `.dev.vars` `RESEND_API_KEY=test`, `MAIL_FROM=Mordsteam <test@example.com>` und `RESEND_API_BASE=http://127.0.0.1:8799` setzen und auf Port 8799 einen kleinen Ersatz-Server starten, der die Resend-Aufrufe (`/emails`, `/contacts`, `/segments`, `/broadcasts`) beantwortet. `RESEND_API_BASE` in Cloudflare nie setzen.
