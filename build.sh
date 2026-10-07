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
  # VORÜBERGEHEND (Paddle-Prüfung, Okt. 2026): Startseite zeigt die englische Angebotsseite statt "Coming soon".
  # Paddle hat am 7.10.2026 abgelehnt; die Seite bleibt, bis Stripe Managed Payments geprüft hat. Danach PADDLE_PRUEFUNG=0 setzen → wieder "Coming soon" bis zum Go-live.
  PADDLE_PRUEFUNG=1
  if [ "$PADDLE_PRUEFUNG" = "1" ]; then
    cp teaser/paddle-root.html dist/index.html
  else
    cp teaser/index.html dist/index.html
  fi
  cp teaser/impressum.html dist/impressum.html
  # Englische Teaserseite: Besucher außerhalb von DACH landen über functions/_middleware.js automatisch hier
  mkdir -p dist/en && cp teaser/en/index.html dist/en/index.html && cp teaser/en/imprint.html dist/en/imprint.html
  # Für die Prüfung durch Paddle: Angebot, Preise, Erstattung und Rechtstexte (nicht verlinkt, noindex)
  cp site/products.html dist/products.html
else
  echo "Modus: VOLLE SEITE"
  cp -r site/. dist/
fi
