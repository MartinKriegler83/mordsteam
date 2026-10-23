# Mordsteam

Website, Shop und Spielplattform von **mordsteam.com**. Mordsteam verkauft digitale Krimispiele, die im Browser gespielt werden:

| Produkt | Spielart | Fälle im Code |
|---|---|---|
| **Teams** | Firmen-Teamevent, mehrere Teams treten gegeneinander an, Spielleitung über eigenes Dashboard | `fall-001` „Die rote Mappe“ in drei Paketen: Basic, Premium (2. Akt), Premium Plus (Finale mit KI-Assistenz ARIA) |
| **Friends** | Krimiabend für 4–8 Personen, jede Person am eigenen Handy, gleichzeitig oder zeitversetzt über mehrere Tage | `friends-001` „Letzte Runde auf der Hütte“, Basic und Plus (mit KI-Verhörraum) |
| **Solo** | Einzelspiel am Handy oder Laptop | `solo-001` „Nachtzug nach Venedig“, `solo-002` „Applaus für einen Toten“, `solo-plus-001` „Der letzte Jahrgang“ (mit KI-Verhörraum) |
| **Specials** | Saison-Fälle im Solo-Format | `special-001` „Süßes oder Saures“ / „Trick or Treat“ (Halloween, ohne KI, 4 Fragen, 50 Min., US-Kleinstadt; Frage 4 mit Antworttyp `word`) |

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
  s/[code].js              Kurzlink /s/<Solo-Code> → /spiel/solo.html?c=<Code> (Geschenkkarte)
  f/[code].js              Kurzlink /f/<Kurzcode> → Friends-Organisator-Seite (friends_groups.short_code, angelegt beim ersten Abruf der Geschenkkarte über /api/shop/status → org_short)
  api/_middleware.js       zählt API-Aufrufe je Bereich, protokolliert Serverfehler (ops_hits, ops_err),
                           wiederholt D1-Abfragen bei „overloaded“/„SQLITE_BUSY“ einmal nach kurzer Pause (lib/dbretry.js)
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
    special-001.js (+ -en)   Halloween-Special, läuft über die Solo-Logik (SOLO_CASES); Bilder in lib/art/special001.js; Rückblende in lib/art/rb_special001.js mit Musik site/assets/audio/rueckblende-special-halloween.m4a
    *-en.js                  englische Textschicht je Fall: exportiert nur die Exporte mit sichtbarem Text, gleiche Namen und Struktur
  art/                     Bilder in den Akten (SVG, Graphic-Novel-Stil), je Runde aus den Falldaten gezeichnet
    gn.js                    Baukasten: Farben, Figuren (fig/roster/face), defs(), pic() = <figure class="gn-pic"> (antippen = groß, spiel/common.js)
    solo001.js, solo002.js, soloplus.js, friends.js, teams001.js, teams002.js   Bilder je Fall; Handschrift über die Schrift Caveat (spiel.css)
  stripe.js                Stripe-Hilfe für lib/ (der Shop hat eine eigene Kopie)
  accounting.js            Buchhaltung: Einnahmen nach Kundenart und Region, EU-Privatkunden-Schwelle, Kostenvorlagen
  ledger.js                Ausgabenbuch, Einnahmen-Ausgaben-Rechnung je Monat, Reverse Charge je Quartal (inkl. Stripe-Gebühren), Fristen, CSV-Exporte
  feedback.js              Feedback-Mails und -Bögen, Bewertungen
  withdraw.js              Widerrufsfunktion für Verbraucher: nimmt seit 23.10.2026 jede Erklärung an (F2); passt sie nicht (Frist, gespielt, Firma), bleibt die Bestellung unverändert mit `withdrawal.review`, ohne passende Bestellung landet sie in `withdraw_inbox` – beides im Admin unter Bestellungen
  contact.js               Kontaktformular (Spam-Schutz, Limit)
  ops.js                   Betrieb: Mail-Versand, KI-Verbrauch, Zähler, Warnmails
site/                    Öffentliche Website (deutsch) + site/en/ (englisch, generiert)
  spiel/                   Spielplattform „Fallzentrale“: Oberflächen für Teams, Leitung, Solo, Friends, Admin, Urkunde
  assets/                  CSS, Seiten-Skripte, Schriften
  specials.html            Specials-Seite (Halloween „Süßes oder Saures“, frühere Specials, FAQ); Startseite mit Abschnitt #specials, Navigation „Specials“ auf allen Seiten; Kauf über solo-kaufen.html?fall=halloween (8,90 € wie Solo, seit 18.10.2026; vorher 11,90 €). **Gratis-Probe** (18.10.2026): Knopf „Erste Frage gratis spielen“ → /spiel/solo.html?probe=special-001&lang=de|en → POST /api/solo/probe legt ein Ticket mit `probe=1` an (Code beginnt mit „P“, höchstens 10 je Anschluss und Tag, IP nur als Hash). Nur Frage 1 und deren Beweisstücke; nach Frage 1 endet der Durchgang ohne Auflösung, Rückblende, Gutschein, Wertung oder Feedback, danach Kaufknopf (POST /api/solo/probe/kauf zählt den Klick). Proben werden nach 2 Tagen gelöscht und erscheinen nicht in der Admin-Liste. **Trichter**: site/assets/funnel.js (nur auf den Specials-Seiten, `data-page`) meldet view, s50, s90, video, ton, probe, buy an GET /api/shop/ev; der Server zählt probe_start, probe_q1, probe_buy (lib/funnel.js, Tabelle `funnel`: Seite + Ereignis + Tag, keine Personendaten); Anzeige im Admin unter „Kunden & Newsletter“, Kasten „Specials-Seite · wo steigen Besucher aus?“
  specials-xmas.html      Specials-Seite mit Weihnachts-Special „Vier Minuten Finsternis“ (special-002, 8,90 €) oben und Halloween unter „Frühere Specials“; EN aus tools/en_pages.py. **Umschalten in build.sh**: XMAS=true/false erzwingt; sonst an auf Vorschau-Zweigen und auf main ab 1.11.2026 (Wiener Zeit) – dann ersetzt specials-xmas.html die specials.html, und Blöcke `<!--XMAS-ON-->…<!--/XMAS-ON-->` / `<!--XMAS-OFF-->…<!--/XMAS-OFF-->` (Startseite DE/EN) werden passend entfernt. Achtung: das Datum wird beim Build geprüft, also am 1.11. neu bauen. Kauf und Gratis-Probe von special-002 sind auf mordsteam.com erst ab 1.11.2026 möglich (lib/solo.js SALE_FROM, solo-kaufen data-from).
  assets/bewegung.js       Bewegung (22.10.2026, ohne Bibliothek, jede Bewegung nur einmal, „Bewegung reduzieren“ schaltet ab, ohne JS bleibt alles wie vorher): Startseite „Probier’s: dein Vorname“ → Name im Aktenauszug (nur im Browser), Fall-Karten fallen beim Scrollen auf den Tisch, roter Faden über „Drei Schritte …“ (`.steps` mit 3 `.step`, ab 760 px), Weihnachts-Abschnitt der Startseite: Lichter gehen aus (4 Min. Zeitraffer). CSS am Ende von style.css (`bw-*`). Eingebunden auf allen DE-Seiten mit Schritten bzw. Karten und über tools/en_pages.py auf allen EN-Seiten. Startseite zählt mit funnel.js (`home-de`/`home-en`, Ereignisse view, name, s50, fall, s90), Admin-Kasten „Startseite · Bewegung wirkt?“
  assets/video/            Teaser-Videos der Bereichsseiten <name>-169/-916.mp4 + .jpg (Poster), geladen von assets/teaser.js über data-video; Halloween: special-halloween(-en), Weihnachten: special-weihnachten(-en)
  404.html                 Fehlerseite für unbekannte Adressen (DE und EN, auf /en/… Englisch zuerst über assets/notfound.js; ohne sie liefert Cloudflare die Startseite mit Status 200)
  _headers                 Sicherheits-Header, noindex für /spiel/ und Bestellseiten
teaser/                  Platzhalter-Startseite und Impressum für den Teaser-Modus, englisch unter teaser/en/ (index = Coming soon, imprint, angebot), paddle-root.html (Angebotsseite für /, nur mit ANGEBOT_SEITE=1)
tools/                   Prüf- und Hilfsskripte (siehe „Lokal testen“)
  en_pages.py              erzeugt site/en/*.html (englische Seiten nie direkt bearbeiten; ruft am Ende site_bilder.mjs auf)
  site_bilder.mjs          Fotokarten auf den Fallseiten (solo, friends, teams, DE+EN) aus lib/art mit festen Beispieldaten,
                           zwischen <!-- bild:… --> und <!-- /bild -->; dazu die Titelbilder (Startseite, Fallseiten) zwischen
                           <!-- cover-…:… --> und <!-- /cover -->; nach Änderungen an lib/art erneut ausführen
  cover_bilder.mjs         Titelbilder der Fälle (lib/art/covers.js) als site/assets/cover/<fall>-<de|en>.webp, 600 × 750;
                           braucht Playwright/Chromium und Python mit Pillow (Claudes Arbeitsumgebung)
  check_*.mjs              Prüfskripte je Fall (Eindeutigkeit der Lösung über alle Varianten); check_*_en.mjs prüft die englische Fassung gegen die deutsche
  placeholder_guard.mjs    rendert Teams-Akten und meldet offene Platzhalter wie {TORTE} (läuft in check_teams/check_teams002)
  picture_guard.mjs        prüft die Teams-Bildrätsel in gerenderten Runden: Archivregal (Fall 001) und Strichliste (Fall 002)
  og_tags.py               Vorschau beim Teilen: og:/twitter:-Tags in alle öffentlichen Seiten (Block <!--og-->…<!--/og-->,
                           idempotent; Specials → assets/og/special-<lang>.jpg, sonst home-<lang>.jpg); nach en_pages.py erneut ausführen
  og_live.mjs              erzeugt die Vorschaubilder site/assets/og/home-*.jpg und special-*.jpg (1200 × 630; Playwright + Pillow)
  teaser_pages.py          erzeugt teaser/newsletter.html, teaser/datenschutz.html, teaser/en/newsletter.html und teaser/en/privacy.html aus den Seiten der vollen Website (Inhalt gleich, ohne Navigation zum Angebot); nach Änderungen an Newsletter- oder Datenschutzseite erneut ausführen
  github-workflow-feedback-mails.yml   Vorlage der GitHub-Action (Kopie von .github/workflows/feedback-mails.yml)
.github/workflows/feedback-mails.yml   stündlicher Aufruf von /api/shop/cron
faelle/                  alte Arbeitsdokumente (nicht ausgeliefert)
design/                  Designentwürfe (nicht ausgeliefert)
```

Rückblende (Solo, seit 11.10.2026): Nach Spielende zeigt der Solo-Client zuerst „Was ist wirklich passiert?“ mit Knopf „▶ Rückblende ansehen“ (oder „Direkt zur Auflösung“), danach Zusammenfassung und Urkunde; auf der Ergebnisseite lässt sie sich erneut abspielen. Ablauf: `GET /api/solo/rueckblende` (erst nach Spielende, sonst 409) → `lib/rueckblende.js` holt die Rundendaten → Szenen aus `lib/art/rb_solo001.js`, `rb_solo002.js`, `rb_soloplus.js` (je 6 SVG-Szenen, Untertitel, Geräusch-Zeitpunkte) → Player `site/spiel/rueckblende.js` (16:9, CSS-Animationen `rb-*`, Musik je Fall, alle synthetisch komponiert und ohne Ticken (11.10.2026): Solo 001 `site/assets/audio/rueckblende-solo-nachtzug.m4a`, Solo 002 `rueckblende-solo-theater.m4a`, Solo Plus `rueckblende-solo-weingut.m4a`, Special Halloween `rueckblende-special-halloween.m4a` (Szenen in `lib/art/rb_special001.js`), Geräusche per WebAudio, Überspringen/Ton aus, Esc). Gesehen wird je Durchgang im Browser gemerkt (`ms_rb_<code>_<start>`).

Kino-Look (11.10.2026, alle Rückblenden): Der Player legt jede Szene in eine langsame Kamerafahrt (`cam`: in/out/left/right/up/none, Standard wechselnd), darüber Vignette, Filmkorn und Kinobalken (je 4,5 % oben/unten – Bildinhalt in y 22–338 halten), Überblendung 0,9 s; die Kamera-Ebene hat `will-change:transform` (wird als Bild skaliert, Buchstaben zittern nicht). Jede Rückblende endet mit dem Abspann `endcard()` aus `cine.js` (5 s, wie bei den Teasern: Lupe, MORDSTEAM, „Der nächste Fall wartet schon“, „Komm/Kommt zurück …“, mordsteam.com). Videos fürs Prüfen: jede Szene einzeln OHNE Kamerafahrt rendern (1,25-fach, 30 fps – Text steht pixelgenau still), Kamera, Überblendung, Vignette, Korn und Balken danach subpixelgenau dazurechnen; leerer Untertitel (`sub:""`) blendet die Untertitelzeile aus (Abspann). Zeichenhelfer mit eindeutigen IDs je Szene: `lib/art/cine.js` (Verläufe, Licht, Lichtkegel, Fenster, Holz, Nebel, Staub, Schnee, gesichtslose Figur `person` für echte Mitspieler, Titelkarte, Uhrzeit-Einblender). Prüfen: Standbilder bzw. MP4 mit Ton per Playwright mit gefälschter Uhr (`page.clock`, Animationen je Bild gesetzt) und Geräuschen über einen OfflineAudioContext – die Skripte liegen nicht im Repo.

Rückblende (Friends, seit 11.10.2026): Erst nach der gemeinsamen Auflösung (`friends_groups.status = revealed`, vorher 409) zeigt der Friends-Client „Was ist wirklich passiert?“, danach Auflösung und Rangliste; auf der Auflösungsseite lässt sie sich erneut abspielen. `GET /api/friends/rueckblende` → `friendsRueckblende` in `lib/rueckblende.js` (Täter, Würfeln/Balkon, Uhrzeiten der Zeitvariante, Versteck, alle Spielernamen roh aus `friends_groups.data`) → `lib/art/rb_friends.js` (Spieler als Silhouetten ohne Gesicht mit Namensschild) → Player mit Musik `site/assets/audio/rueckblende-friends-huette.m4a` (synthetisch, ohne Ticken). Gesehen-Merker je Spieler: `ms_rb_f_<token[0:12]>`.

Rückblende (Teams, seit 11.10.2026): erst nach Spielende (`sessions.status = finished`, vorher 409). Die Spielleitung zeigt sie für alle (Kasten „Das Finale“ mit „▶ Rückblende für alle zeigen“ auf `leitung.html`, gedacht für Bildschirm teilen/Beamer); jedes Team kann sie auf der Ergebnisseite neben „Umschlag öffnen“ selbst starten – nie automatisch, damit es im Raum kein Ton-Durcheinander gibt. `GET /api/spiel/leitung/rueckblende` (x-leitung) und `GET /api/spiel/rueckblende` (x-team/x-view) → `teamsRueckblende(session)` in `lib/rueckblende.js` → `lib/art/rb_teams.js` (Fall 001 und 002, Szenen aus `buildVars`; Basic nur Akt 1, Premium + Mitwisser/Geld, Premium Plus + Finale). Musik `site/assets/audio/rueckblende-teams-buero.m4a` (78 s, synthetisch, ohne Ticken; der Player blendet bei natürlichem Ende sanft aus). Szenendauer passt sich der Untertitel-Länge an (höchstens 3 Wörter pro Sekunde + 0,5 s). Untertitel und Bilder laufen durch `render()` (Regionalwörter DE/CH/LI, Schweizer ss, US-Englisch). Friends-Organisator: `GET /api/friends/org/rueckblende?o=…` (Knopf auf der Organisator-Seite nach der Auflösung).


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
- Eine **Gruppe** (`friends_groups`) hat einen Fall für alle (Besetzung, Täter, Zeitvariante), jede Person einen eigenen Durchgang (`friends_players`). Modus `live` (gemeinsame Uhr, Organisator startet) oder `week` (3/5/7 Tage, jeder startet selbst). Lösung und Rangliste erst bei der gemeinsamen Auflösung (automatisch, sobald alle fertig sind oder die Frist um ist, per Cron; oder vom Organisator über `org/reveal`). Der Organisator darf vorziehen, sobald mindestens eine Person fertig ist und niemand mehr mitten im Spiel ist – wer nie angefangen hat, steht dann als „nicht gespielt“ in der Rangliste (seit 11.10.2026; Testgruppen immer). Verhöre in `friends_chat`.
- Spielsprache: `friends_groups.lang`, gilt für die ganze Gruppe; `friendsCase(id, lang)` in `lib/friends.js` wie bei Solo. Einladung, Spielstand und Organisator-Seite liefern `lang`.

### Shop (`/api/shop/`)
- Bestellseiten: `bestellen.html` (Teams), `friends-kaufen.html`, `solo-kaufen.html` (+ englische Gegenstücke).
- Alle drei Bestellformulare haben das Feld Spielsprache (`lang`, unabhängig von der Website-Sprache `site`); es landet in `orders.contact.lang` und von dort in Spielrunde, Gruppe bzw. Ticket.
- Alle drei Bestellformulare haben das Kästchen „Bitte keine Neuigkeiten per E-Mail“ (`consent.no_news`). Angekreuzt landet `no_news: true` in `orders.contact`.
- Newsletter-Kürzel: Links aus Newslettern tragen `?nl=<kürzel>`. `assets/menu.js` hängt es an interne Links (keine Speicherung im Browser) und zählt den Besuch (`nl-besuch`); die Bestellformulare schicken es mit, es landet in `orders.contact.nl`.
- Werbe-Kürzel: `?src=<kürzel>` (z. B. `meta-de`, `meta-en`, `insta`, `fb`, `tiktok`, `gads`; ohne `src` aus `fbclid` → `meta`, `gclid` → `gads`) – gleich wie `nl`: `assets/menu.js` hängt es an interne Links, zählt den Besuch (`src-besuch`, nicht bei internen Seitenwechseln und nicht bei Rückkehr nach Zahlungsabbruch) und die Formulare schicken es mit (`orders.contact.src`).
- Zahlungsabbruch: Stripe schickt zurück auf das Formular mit `?abgebrochen=1`, dazu Fall (`fall=`, Solo) bzw. Variante (`v=plus`, Friends) und `src`/`nl` der Bestellung (`cancelQ()` in `functions/api/shop/[[route]].js`).
- Unbekannter Solo-Fall (`fall`) → 400. POST-Bodys, die kein JSON-Objekt sind (`null`, Zahl, Liste), lehnen alle API-Routen mit 400 ab (`badBody()` in `lib/game.js`).
- Ablauf: Formular → `bestellung` / `friends` / `solo` legt `orders` (Status `pending`) an → Stripe Checkout → Webhook `stripe-webhook` (`checkout.session.completed`) → `fulfill()` legt Spielrunde/Gruppe/Ticket an und schickt die Bestellmail → `bestellt.html` fragt `status` ab.
- Preise stehen im Code, in Cent, als Endpreise: Teams `PRICES` in `functions/api/shop/[[route]].js`, Friends `FRIENDS_PRICE`/`FRIENDS_PRICE_PLUS` in `lib/friends.js`, Solo je Fall (`price` in der Produktliste direkt unter `PRICES`).
- Early Bird: Rabatt als Stripe-Coupon, gesteuert über `EARLYBIRD_*`.
- `cron` (POST, Header `x-cron-key`): löst fällige Friends-Wochenrunden auf, verschickt fällige Feedback-Mails. Aufgerufen stündlich von der GitHub-Action.
- Newsletter (`lib/newsletter.js`): `POST newsletter` (Anmeldung, schickt Bestätigungsmail), `GET newsletter/bestaetigen?t=`, `GET newsletter/abmelden?t=`, `GET nl-besuch?nl=`. Nach jeder angelegten Bestellung ruft `fulfill()` `nlAfterOrder()` auf: bezahlte Bestellung ohne `no_news` → Kontakt (Quelle `kunde`), Abgleich mit der ECG-Liste, Übertragung zu Resend (Contacts, Segment je Sprache „Mordsteam DE/EN“, IDs in `nl_settings`). `no_news` bei einer späteren Bestellung meldet ab. Bei Resend Abgemeldete werden nicht wieder aufgenommen – außer sie melden sich selbst neu an und bestätigen per Mail (dann setzt `syncOne` sie in Resend wieder auf angemeldet). Abmeldungen über den Resend-Link holt `pullUnsubs()` (GET `/contacts`, ersatzweise einzeln) beim Laden des Admins (`GET admin/newsletter`, höchstens einmal pro Minute) und vor jedem Entwurf; `nlSignup` fragt bei „aktiv“ in Resend nach und startet bei dort Abgemeldeten die normale Neuanmeldung.
- Bestellbestätigungen (Teams, Solo, Friends) hängen seit 23.10.2026 die AGB als HTML-Datei an (`agbAnhang`, über `env.ASSETS` von `/agb` bzw. `/en/terms`) und nennen die gesetzliche Gewährleistung (F10). Verein ohne UID-Nummer bestellt als Privatperson, Verein mit UID als Unternehmen (F9).
- Weitere Routen: `meta`, `friends-meta` (Preise, Shop offen?), `feedback` (GET/POST Bogen), `bewertungen` (freigegebene Bewertungen), `kontakt`, `widerruf`, `status`.

### Admin (`/spiel/admin.html`)
Zugriff mit dem Admin-Schlüssel (Header `x-admin`). Funktionen: Spielrunden anlegen/löschen, Bestellungen, Solo-Tickets und Friends-Gruppen anlegen und auflisten, Statistik, Feedback freigeben, Betrieb (Mails, KI-Verbrauch, Aufrufe, Fehler), Buchhaltung im Tab „Bestellungen & Finanzen“ (Hauptquelle, ersetzt die frühere Excel-Datei): Einnahmen-Übersicht, Ausgabenbuch mit Steuerart, Kategorie, betrieblichem Anteil und „privat bezahlt“, E/A-Rechnung je Monat und Kategorie, Fristen und Meldungen (Reverse-Charge-Quartale, Zusammenfassende Meldung, U1, E1), Warnungen (mögliche Duplikate, händisch erfasste Stripe-Gebühren, laufende Kosten ohne Buchung seit „Seit“), Exporte Einnahmen/Ausgaben/E/A-Rechnung als CSV, Belege je Ausgabe hochladen und ansehen, alle Belege eines Jahres als ZIP (im Browser gebaut, mit Ausgaben-CSV), Export. Tab „Steuer & Abgaben“ (16.10.2026, ersetzt den Abschnitt „Fristen und Meldungen“ im Tab Finanzen; „bezahlt“ bei SVS/WKO-Fristen bucht die Ausgabe direkt mit `cost_id` und hakt die Frist ab, `steuerUebersicht` in `lib/ledger.js`, Daten im Feld `steuer` von `GET admin/ausgaben`): nächste Zahlung und Summe der nächsten 31 Tage, Zahlungen (Reverse-Charge-Quartale, SVS/WKO laut Vorschreibung, ESt-Vorauszahlung) mit Verwendungszweck zum Kopieren („U 07-09/2026“, Steuernummer nie im Admin), Meldungen (UVA je Quartal mit Befreiungsstatus: Vorjahresumsatz unter 55.000 € und Zahllast bis Fälligkeit bezahlt = keine UVA; sonst Pflicht mit Häkchen `uva:JJJJ-Qn`; ZM, U1, E1), Aufstellung nach Formular U30 je Quartal (KZ 000/016 Kleinunternehmer-Umsätze nach Zahlungstag, KZ 057 Reverse-Charge-Steuer nach Rechnungsdatum, KZ 060/066 = 0, KZ 095 Zahllast, nicht steuerbare Umsätze zur Kontrolle) mit Jahresspalte für die U1, Warnungen (Zahlung in 14 Tagen fällig/überfällig, UVA-Pflicht, Kleinunternehmer- und EU-Privat-Schwelle), Export `GET admin/export/steuer?jahr=` (CSV). Tab „Kunden & Newsletter“: Kundenauswertung je E-Mail-Adresse (Wiederkäufe, Solo-Gutschein über `orders.promo_code`, Bestellungen über Newsletter), Newsletter-Liste und Übertragung, Liste der Anmeldungen über die Website (Status, Zeitpunkte, in Resend, Käufer – auch ohne Kauf), Upload der ECG-Liste (Datei `ecg-liste.hash` der RTR: aneinandergereihte SHA-1-Werte à 20 Byte von Adresse bzw. `@domain`, wird im Browser in Teilen hochgeladen), Newsletter-Entwurf mit Vorschau → Broadcast-Entwurf in Resend (gesendet wird in Resend).

### Gratis-Bonus-Rätsel auf den Specials-Seiten (19.10.2026)
Zwei kurze Rätsel aus der Hollow Lane direkt auf `specials.html` / `en/specials.html` (Abschnitt `#raetsel`, vor dem Teaser-Video) – **nicht Teil des Halloween-Falls**, eigene Szene und Lösung: (1) „Wer steckt im Anzug?“ – Skelett mit Schuhen antippen, dann auf dem Partyfoto die Person (Schuhe + Messlatte; Lösung Josh), (2) „Mias Candy-Code“ (BUH / BOO). Bilder aus `lib/art`, erzeugt mit `node tools/bonus_raetsel.mjs` (zwischen `<!-- bonus -->` und `<!-- /bonus -->`, läuft auch am Ende von `tools/en_pages.py`). Bedienung `site/assets/bonus.js`; mit `?src=…-r` (Rätsel-Anzeige) springt die Seite direkt zum Rätsel. Zählung im Trichter: `bz0` angefangen, `bz1` Skelett gefunden, `bz2` Rätsel 1 gelöst, `bz3` Candy-Code gelöst.

### Brightpage im Admin (Tab „Brightpage“, 19.10.2026)
Webdesign unter der Mordsteam e.U. – eine Firma, eine Buchhaltung. Dateien: `lib/brightpage.js` (Logik, Tabellen `bp_kunden`, `bp_invoices`, `bp_abos`, Einstellungen in `ledger_settings` unter `bp_cfg`), `functions/api/bp/[[route]].js` (`/api/bp/admin/*`, Admin-Schlüssel), `site/spiel/admin-bp.js` (Tab, Rechnungsansicht mit QR-Code).
- Ablauf: Entwurf (ohne Nummer) → Ausstellen (fortlaufend `BP-JJJJ-NNN`, Kundendaten eingefroren, danach gesperrt) → Bezahlt (Gutschriftdatum + Betrag) · offene Rechnung stornieren = Stornorechnung mit eigener Nummer · Entwurf löschen.
- Arten: Rechnung, Anzahlungsrechnung, Schlussrechnung (zieht bezahlte Anzahlungen desselben Kunden ab – keine Doppelzählung).
- Steuer je Kunde (`regimeOf`): AT und EU-Privat → Kleinunternehmer; EU-Firma mit UID → Reverse Charge (+ ZM); Nicht-EU-Firma → `dl_b2b`; Nicht-EU-Privat → `dl_b2c`. Hinweistexte wie `lib/tax.js`. Webdesign ist keine elektronische Leistung → zählt nicht zur 10.000-€-Schwelle für EU-Privatkunden.
- Buchhaltung: `bpPaidRows()` liefert bezahlte Rechnungen im Format der Bestellungen (`pay_provider` `bp`, Zufluss am Zahlungstag) – eingebunden in `accountingSummary` (Einnahmen, Kleinunternehmergrenze, U30, ZM) und `ledgerYear` (E/A-Rechnung).
- Pflege-Abos: je Kunde, monatlich/vierteljährlich/jährlich im Voraus; „Als Entwürfe anlegen“ erzeugt für jeden begonnenen Zeitraum ohne Rechnung einen Entwurf.
- Rechnung ansehen: eigenes Fenster (A4, DE/EN), QR-Code „Zahlen mit Code“ (EPC, UTF-8) bei offenen Rechnungen, „Drucken → Als PDF sichern“. Absender, IBAN, Firmenbuch unter „Einstellungen“ (nicht im Code); eigene UID aus `UID_NR`.
- Erstattung (22.10.2026): bezahlte Rechnungen lassen sich nicht stornieren, aber erstatten (`POST admin/rechnung/erstattung` mit Betrag, Datum, Grund; `zurueck:true` nimmt eine Fehlbuchung zurück). Spalten `erstattet_cents`, `erstattet_am`, `erstattet_grund`; `bpPaidRows` gibt sie als `refunded_cents` weiter → E/A-Rechnung, KU-Grenze und U30 zählen nur den behaltenen Betrag (wie Erstattungen im Shop, im Zahlungsmonat).
- Einstellungen enthalten auch den Google-Bewertungslink (`bewertung_link`, nur g.page/google-Adressen) für die Bewertungs-Mail.

### Brightpage-Auftragsablauf (Tab „Brightpage“ → Aufträge, 20.–22.10.2026)
Dateien: `lib/bpauftrag.js` (Tabelle `bp_auftraege`, Stationen, Checklisten `CHECK`, Leitfaden, Warnungen, `bpInfoMail`), `lib/bpangebot.js` (Angebote `bp_angebote`, Vorlagen, Annahme mit zwei Häkchen für vorzeitigen Beginn, AGB-Texte `bedingungen()`/`widerruf()`), `lib/bpkunde.js` (Kundenseiten `/api/bp/public/k/*`: Auftragsformular, Anleitungen, AV, AGB, Widerrufsformular und Widerrufsbutton `bp_widerrufe`, Übergabeprotokoll), `lib/bpbesuch.js` (Besucherzähler `bp_besuche` ohne Cookies), `site/spiel/admin-bpa.js` (8 Schritte, Mails per Kopieren).
- Kundenseiten erreicht der Kunde über brightpage.net/k/* (Durchreicher im Brightpage-Repo mit `BP_INBOX_KEY`).
- Info-Mails an office@brightpage.net (nie an Kunden): Angebot angenommen, Auftragsformular eingereicht/geändert, Übergabe bestätigt. Automatisch an Kunden gehen nur die Eingangsbestätigung eines Online-Widerrufs und seit 23.10.2026 (F3) die Auftragsbestätigung nach der Online-Annahme (`auftragsBestaetigung` in `lib/bpangebot.js`, angenommenes Angebot als HTML-Anhang, Notiz im Auftrag). Kundenseiten (Angebot, Rechnung, Auftragsformular, Übergabe) zeigen Verbrauchern 14 Tage ab Annahme oben „Vertrag widerrufen“ (F4, `widerrufBar` + `mitWiderruf` in `functions/api/bp`, `/k/widerrufen?nr=` füllt die Nummer vor). Auftragsformular: Transparenzhinweis Google und optionale Zustimmung `z_bewertung` (F6). AV: GitHub und Pages CMS als Unterauftragsverarbeiter (F7). Bewertungsbitte und Empfehlungsbonus sind getrennte Mails (F8).
- KI-Lösungen im Angebot (23.10.2026): neu `ki-produkt` 390 €, `ki-sprachnotiz` 490 €, `ki-mailbox` 590 € und Extra `uebersetzung` 190 € (englische Fassung der Website; nur Englisch, Martin 23.10.) (lib/bpangebot.js, Preisliste in admin-bp.js, Leitfaden in bpauftrag.js). Das Paket `ki-alle` (2.190 €) gilt nur für die ursprünglichen vier, `ki-alle7` (3.490 €) für alle sieben; Bestpreis-Regel: kostet die Auswahl im Vorschlag 3.490 € oder mehr, nimmt der Vorschlag das Gesamtpaket (steht auch in den AGB unter Preise); der Vorschlag ersetzt diese vier durch das Paket und lässt die neuen einzeln stehen. AGB: KI-Lösungen laufen nur mit dem monatlichen KI-Betrieb; kleine Änderungen nach der Übergabe ohne Service-Plan 35 € bis 15 Minuten. AV-Vertrag: Mistral immer für die Spracherkennung.
- Admin merkt den offenen Auftrag (`sessionStorage bpa_open`) und lädt beim Zurückkehren ins Fenster still neu (nicht während Bearbeitung).
- Checklisten: Web Premium und Shops erben die Web-Start-Punkte (Schlüssel bleiben `web-start:…`); Schritt 5 zeigt „Vorschau und Korrekturen“ zuletzt, Abo-Punkte (`…:abo`) stehen in Schritt 7. Vorschau-Adresse je Auftrag (`bp_auftraege.vorschau`, nur https) geht in die Vorschau-Mail; Kopieren der Vorschau-Mail hakt „Vorschau geschickt“ ab.
- Verbraucher ohne vorzeitigen Beginn: Hinweis mit Fristende (Annahme + 14 Tage) und Arbeitsbeginn ab Tag 17, Warnung beim Wechsel auf „Bau“.
- Widerruf: Panel im Auftrag, sobald ein Widerruf zum Auftrag existiert (online oder „von Hand erfassen“, `POST admin/widerruf`): Eingangsbestätigung, offene Rechnungen stornieren, Bezahltes erstatten (Frist 14 Tage ab Eingang), Auftrag auf „Verloren“, Abschluss-Mail; Warnung, wenn der Kunde Unternehmer ist.
- Schritt 8: Nachfassen „Ist der Kunde zufrieden?“ als nächster Schritt mit Datum; abgeschlossene Aufträge erscheinen nur mit eingetragenem nächsten Schritt in den Hinweisen.

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
- Spiel: `GET state`, `GET akte`, `GET code`, `POST join`, `POST mitlesen`, `POST loesung`, `POST kontrolle`, `GET firma`, `POST firma/login`, `GET aria`, `POST aria/chat`, `POST aria/kennwort`, `POST bonus`, `POST bonus/fertig`, `GET sonder`, `POST sonder/chat`, `GET rueckblende`, `POST feedback`
- Leitung: `POST leitung/login`, `GET leitung/state`, `POST leitung/aktion`, `GET leitung/aufloesung`, `GET leitung/rueckblende`
- Admin: `POST admin/session`, `GET admin/sessions`, `POST admin/delete`, `GET admin/orders`, `POST admin/order-shipped`, `GET admin/stats`, `GET admin/export`, `GET admin/meta`, `GET admin/ops`, `GET admin/buchhaltung`, `GET/POST admin/kosten`, `POST admin/kosten/loeschen`, `GET admin/ausgaben?jahr=`, `POST admin/ausgaben`, `POST admin/ausgaben/loeschen`, `POST admin/ausgaben/doppelt-ok`, `POST admin/rc/bezahlt` (`quartal`, `paid`, `datum`), `POST admin/pflicht` (`key` zm:/u1:/e1:/est:/uva:), `GET admin/export/steuer?jahr=`, `POST admin/est-vz` (`jahr`, `euro`), `POST admin/kosten/ueberspringen` (`cost_id`, `period`, `undo`), `POST admin/ausgaben/zuordnen` (`id`, `cost_id`), `GET admin/export/ausgaben?von=&bis=`, `GET admin/export/ea?jahr=`, `POST admin/ausgaben/beleg?id=` (roher Body, Kopf `x-filename`; PDF/JPG/PNG/HEIC/WebP bis 20 MB), `GET admin/ausgaben/beleg?file=`, `POST admin/ausgaben/beleg/loeschen` (nur markieren, Datei bleibt im Speicher), `GET admin/feedback`, `POST admin/feedback-approve`, `POST admin/feedback-run`, `GET admin/kunden`, `GET admin/newsletter`, `POST admin/newsletter/sync`, `POST admin/newsletter/ecg` (`phase` start/chunk/done), `POST admin/newsletter/entwurf` (`preview: true` = nur Vorschau)
- Nur Testrunden: `POST test/vorspulen` (Spielzeit vorspulen)

**`/api/solo/…`** (Admin-Testticket: `admin/ticket` mit `case`, `lang`, `name`): `start`, `begin`, `state`, `answer`, `hint`, `verhoer`, `aufgeben`, `ticket`, `feedback`, `test/vorspulen`, `admin/list`, `admin/ticket`. **Geschenk-Codes (Werbung):** `POST admin/geschenk` (`case`, `lang`, `n` 1–20, `note`, `promo` {`type` eur|pct, `value`, `until`} oder null) legt echte Solo-Tickets ohne Kauf an (`solo_tickets.gift=1`, `gift_note`) und je Code optional einen Teams-Gutschein in Stripe (`TEAMS-XXXXXX`, Gutschein `TEAMS-EUR-<n>`/`TEAMS-PCT-<n>`, einmal einlösbar, `expires_at`, Mindestbestellwert 89 € / £89 / $99 = nur Teams; `promo`, `promo_label`, `promo_until`). Solche Tickets bekommen keinen 5-€-Gutschein; das Spielende zeigt den Teams-Gutschein. `GET admin/geschenke` (Liste mit Notiz, gespielt, Zeit, Gutschein eingelöst laut `orders.promo_code`, plus alle Solo-Fälle aus `SOLO_CASES`). Öffentlich `GET geschenk?c=` (nur für `gift=1`) für die Geschenkkarte `/geschenk.html?c=<Code>&l=de|en`. Aktenzeichen auf jeder Geschenkkarte = Spielcode (Solo) bzw. Kurzcode der Organisator-Seite (Friends). **Geschenkkarte als PDF** (12.10.2026): `POST /api/shop/geschenk-pdf` (`o`+`k` oder `c`, `l`, `fuer`, `von`, `text`) → `lib/geschenkpdf.js` bettet `geschenk.html` mit Schriften, Titelbildern und Skripten komplett ein (`window.__GK`, Klasse `gk-pdf`) und lässt Cloudflare Browser Rendering ein A4-PDF ohne Ränder rendern – Link, Code und QR-Code bleiben klickbar (beim iPhone-Druck „als PDF“ gehen Links verloren). Binding `BROWSER` (`quickAction("pdf")`), sonst REST mit `BR_API_TOKEN` + `BR_ACCOUNT_ID`; ohne beides 503 und die Seite verweist auf „Drucken“. Höchstens 20 PDFs je Anschluss in 10 Min. (`pdf_log`, IP gehasht). Lokal: `BR_API_BASE` auf einen Ersatz-Renderer, `PDF_HTML_TEST=1` + `html:true` liefert das eingebettete HTML

**`/api/friends/…`** (Admin-Testgruppe: `admin/group` mit `n`, `lang`, `plus`, `mode`): `claim`, `begin`, `state`, `answer`, `hint`, `verhoer`, `aufgeben`, `rueckblende`, `invite`, `org`, `org/start`, `org/reveal`, `feedback`, `admin/list`, `admin/group`

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
| `BR_API_TOKEN` | Secret | Geschenkkarte als PDF über die Browser-Rendering-REST-API (API-Token mit Recht „Browser Rendering“ bzw. „Browser Run“ – Edit). Pages bietet keine Browser-Rendering-Bindung an (12.10.2026); ein Binding `BROWSER` würde bevorzugt. Ohne Token nur „Drucken“ |
| `BR_ACCOUNT_ID` | Secret | Cloudflare-Konto-ID für die Browser-Rendering-REST-API |
| `BELEGE` | R2-Binding | Belege der Buchhaltung (Fotos, PDFs). Production: Bucket `mordsteam-belege`, Preview: `mordsteam-belege-test`. Ohne Binding: Upload im Admin ausgeblendet |
| `ADMIN_KEY` | Secret | Zugang zum Admin-Bereich (Production und Preview getrennt; gilt erst nach einem neuen Deployment). Prüfung in `lib/adminauth.js` für Spiel-, Solo- und Friends-API: nach 10 Fehlversuchen je Anschluss in 15 Minuten 15 Minuten gesperrt (Tabelle `admin_fail`, IP nur als Hash). Das Login-Formular ist für die Passwörter-App gebaut (Benutzer „admin“), „Auf diesem Gerät angemeldet bleiben“ speichert den Schlüssel im Browser, „Abmelden“ löscht ihn |
| `CRON_KEY` | Secret | Schutz der Route `shop/cron` (gleicher Wert als GitHub-Repository-Secret `CRON_KEY`) |
| `ANTHROPIC_API_KEY` | Secret | Claude API für ARIA, Verhörräume, Sonderauftrag. Fehlt er, antworten die Figuren im Notfallmodus mit festen Texten. |
| `STRIPE_SECRET_KEY` | Secret | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Secret | Signaturprüfung des Stripe-Webhooks |
| `RESEND_API_KEY` | Secret | Mailversand; für den Newsletter (Kontakte, Segmente, Broadcasts) mit **Full access** |
| `ECG_API_KEY` | Secret | optional: API-Key der RTR (Entwickler-Schnittstelle der ECG-Liste). Gesetzt → jede Kundenadresse wird vor der Newsletter-Übertragung automatisch geprüft (SHA-512 von Adresse und Domain); sonst Abgleich gegen die im Admin hochgeladene Hash-Datei |
| `MAIL_FROM` | Text | Absender der automatischen Mails; ohne ihn werden keine Mails verschickt |
| `ARIA_MODEL` | Text | Claude-Modell (Standard: `claude-haiku-4-5-20251001`) |
| `SHOP_OPEN` | Text | `true` = Bestellungen möglich |
| `MANAGED_PAYMENTS` | Text | `true` = Privatkunden aus Großbritannien kaufen über Stripe Managed Payments (Link ist Verkäufer, Preis inkl. britischer USt, Steuercode `txcd_10201003`, API-Version 2025-03-31.basil nur für diese Sitzungen). Sonst sehen sie „in Kürze möglich“. UK-Firmen zahlen immer über das normale Stripe (Reverse Charge). Vorher Managed Payments im Stripe-Dashboard aktivieren (Einstellungen → Managed Payments) |
| `ORDER_FAKE_PAY` | Text | `true` = Bestellung ohne Stripe gilt als bezahlt (nur Tests) |
| `LAUNCH` | Text (Build) | `true` = auf `main` volle Seite statt Teaser |
| `UID_NR` | Text (auch Build) | eigene UID (`ATU` + 8 Ziffern): auf allen Rechnungen und – beim Bauen – im Impressum (DE/EN, Teaser, products.html) anstelle der Platzhalter `<!--UID_DE-->` / `<!--UID_EN-->`. Muss **Text** sein, Secrets sind beim Build nicht sichtbar |
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
- Branch `main` und `LAUNCH` ≠ `true` → **Teaser-Modus**: nur `teaser/index.html` und `teaser/impressum.html` als öffentliche Seite, englisch `teaser/en/index.html` → `/en/` („Coming soon“) und `/en/imprint.html` (Besucher außerhalb von DACH werden über `functions/_middleware.js` dorthin geleitet, Umschalter DE · EN oben rechts). Schalter `ANGEBOT_SEITE` in `build.sh` (seit 7.10.2026 `0`): mit `1` zeigen `/` und `/en/` stattdessen die englische Angebotsseite mit Spielen, Preisen, Erstattung und Rechtstexten ohne Bestellknöpfe (`teaser/paddle-root.html` und `teaser/en/angebot.html`, beide von `tools/en_pages.py` aus products.html erzeugt) – war für die Prüfung durch Paddle nötig. `/products.html` (noindex, nicht verlinkt) bleibt immer erreichbar. Dazu `site/spiel/` (nicht verlinkt, `noindex`) und die Assets. Seit 10.10.2026 zeigt der Teaser unter „Könnt ihr den Fall knacken?“ eine rote Box „Nichts verpassen“ / „Don’t miss a thing“ zur Newsletter-Anmeldung; dafür liefert der Teaser auch `/newsletter.html`, `/datenschutz.html`, `/en/newsletter.html` und `/en/privacy.html` aus (aus `tools/teaser_pages.py`). Die Anmeldung braucht in Production `RESEND_API_KEY` und `MAIL_FROM`.
- Alle anderen Fälle (Branch `vorschau`, oder `LAUNCH=true`) → **volle Seite**: ganz `site/`.

Die Functions (`functions/`) laufen in beiden Modi.

Zum Schluss setzt `build.sh` die UID aus `UID_NR` ins Impressum ein (nur gültiges Format `ATU12345678`, sonst bleiben die unsichtbaren Platzhalter).

**Adressen für Suchmaschinen (seit 16.10.2026):** Cloudflare Pages leitet `/x.html` per 308 auf `/x` um. Deshalb verwenden `site/sitemap.xml`, `canonical`, `hreflang` und `og:url` die Adressen **ohne** `.html` (z. B. `https://mordsteam.com/teams`, `https://mordsteam.com/en/`). `tools/en_pages.py`, `tools/seo_pages.py` und `tools/og_tags.py` erzeugen sie so. Interne Links (`href="/teams.html"`) dürfen `.html` behalten, sie laufen über die Weiterleitung. Neue Seite → Eintrag in `site/sitemap.xml` ohne `.html`. Google Search Console: Domain-Property `mordsteam.com`, Sitemap `sitemap.xml`.

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
   node tools/check_special001.mjs && node tools/check_special001.mjs en
   node tools/check_soloplus.mjs
   node tools/check_friends.mjs
   node tools/check_special002.mjs                                        # Weihnachts-Special Solo (DE und EN)
   node tools/check_friends002.mjs                                        # Friends 002 „Vier Minuten Finsternis“
   for f in tools/check_*_en.mjs; do node $f; done
   ```
   Alle müssen ohne „FEHLER“ enden. `check_teams.mjs` und `check_teams002.mjs` rufen zusätzlich zwei Wächter auf: `tools/regio_guard.mjs` (keine österreichischen Wörter in DE/CH/LI-Runden) und `tools/answer_guard.mjs` (die richtigen Antworten jeder Stufe zählen über `checkAnswers` als richtig, falsche und Vornamen anderer Personen als falsch – in allen Paketen, Sprachen und Ländern).
2. **Englische Seiten neu erzeugen** nach Änderungen an deutschen Seiten mit englischem Gegenstück: `python3 tools/en_pages.py`, danach `python3 tools/og_tags.py` (Vorschau-Tags).
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
