#!/bin/sh
# Cloudflare Pages Build: erzeugt den Ordner dist/.
# Solange LAUNCH nicht "true" ist, zeigt mordsteam.com nur den Teaser
# (plus die nicht verlinkte Spielplattform unter /spiel/).
# Vorschau-Deployments (andere Branches als main) zeigen immer die ganze Seite.
set -e
rm -rf dist
mkdir -p dist
if [ "$CF_PAGES_BRANCH" = "main" ] && [ "$LAUNCH" != "true" ]; then
  echo "Modus: TEASER"
  # Öffentlich nur eine neutrale Seite "im Aufbau" – kein Angebot, keine Werbung.
  # Die Spielplattform (/spiel/, nicht verlinkt, noindex) bleibt für Testrunden erreichbar.
  cp -r site/assets site/spiel site/_headers site/robots.txt site/favicon.ico site/site.webmanifest dist/
  # Angebotsseite statt „Coming soon“ (DE-Startseite und /en/) – war für die Prüfung durch Zahlungsanbieter nötig
  # (Paddle, Okt. 2026). Seit 7.10.2026 aus: ANGEBOT_SEITE=0. Bei Bedarf wieder auf 1 setzen.
  ANGEBOT_SEITE=0
  if [ "$ANGEBOT_SEITE" = "1" ]; then
    cp teaser/paddle-root.html dist/index.html
  else
    cp teaser/index.html dist/index.html
  fi
  cp teaser/impressum.html dist/impressum.html
  # Newsletter-Anmeldung mit Datenschutzerklärung (seit 10.10.2026, erzeugt von tools/teaser_pages.py)
  cp teaser/newsletter.html teaser/datenschutz.html dist/
  # Englische Teaserseite: Besucher außerhalb von DACH landen über functions/_middleware.js automatisch hier
  mkdir -p dist/en && cp teaser/en/imprint.html teaser/en/newsletter.html teaser/en/privacy.html dist/en/
  if [ "$ANGEBOT_SEITE" = "1" ]; then cp teaser/en/angebot.html dist/en/index.html; else cp teaser/en/index.html dist/en/index.html; fi
  # Angebot, Preise, Erstattung und Rechtstexte für Prüfungen durch Zahlungsanbieter (nicht verlinkt, noindex)
  cp site/products.html dist/products.html
else
  echo "Modus: VOLLE SEITE"
  cp -r site/. dist/
fi
# Weihnachts-Special (21.10.2026): Seite und Startseiten-Abschnitt erst ab 1.11.2026 (Wiener Zeit) öffentlich.
# Vorschau und lokale Builds zeigen es immer. Cloudflare-Variable XMAS=true erzwingt es, XMAS=false schaltet es ab.
# Achtung: Der Wechsel passiert nur beim Bauen – am 1.11. einmal neu bereitstellen (Retry deployment) oder pushen.
if [ -f dist/specials.html ]; then
  XMAS_ON=0
  if [ "$XMAS" = "true" ]; then XMAS_ON=1
  elif [ "$XMAS" = "false" ]; then XMAS_ON=0
  elif [ "$CF_PAGES_BRANCH" != "main" ]; then XMAS_ON=1
  elif [ "$(TZ=Europe/Vienna date +%Y%m%d)" -ge 20261101 ]; then XMAS_ON=1
  fi
  if [ "$XMAS_ON" = "1" ]; then
    mv dist/specials-xmas.html dist/specials.html; mv dist/en/specials-xmas.html dist/en/specials.html; DROP="XMAS-OFF"; KEEP="XMAS-ON"
  else
    rm -f dist/specials-xmas.html dist/en/specials-xmas.html; DROP="XMAS-ON"; KEEP="XMAS-OFF"
  fi
  for f in $(grep -rl -e '<!--XMAS-ON-->' -e '<!--XMAS-OFF-->' dist --include='*.html'); do
    awk -v d="$DROP" -v k="$KEEP" '$0 == "<!--" d "-->" {skip=1; next} $0 == "<!--/" d "-->" {skip=0; next} $0 == "<!--" k "-->" || $0 == "<!--/" k "-->" {next} !skip' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  done
  echo "Weihnachts-Special: $XMAS_ON"
else
  rm -f dist/specials-xmas.html dist/en/specials-xmas.html
fi
# Eigene UID ins Impressum (Go-live-Test 5, M23): aus der Cloudflare-Text-Variable UID_NR, nur im Format ATU + 8 Ziffern.
# Ohne Variable bleiben die unsichtbaren Platzhalter <!--UID_DE--> / <!--UID_EN--> stehen.
if echo "$UID_NR" | grep -Eq '^ATU[0-9]{8}$'; then
  for f in $(grep -rl -e '<!--UID_DE-->' -e '<!--UID_EN-->' dist --include='*.html'); do
    sed -i "s|<!--UID_DE-->|<br>UID-Nummer: $UID_NR|; s|<!--UID_EN-->|<br>VAT ID: $UID_NR|" "$f"
  done
  echo "UID im Impressum: gesetzt"
fi
# Stylesheets mit Versionsnummer je Deployment (10.10.2026): Safari behielt sonst das alte style.css im Speicher
V=$(printf '%s' "${CF_PAGES_COMMIT_SHA:-$(date +%s)}" | cut -c1-8)
for f in $(grep -rl -e 'style.css"' -e 'spiel.css"' dist --include='*.html'); do
  sed -i "s|assets/style.css\"|assets/style.css?v=$V\"|g; s|spiel/spiel.css\"|spiel/spiel.css?v=$V\"|g" "$f"
done
echo "CSS-Version: $V"
