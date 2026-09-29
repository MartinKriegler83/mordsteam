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
  cp teaser/index.html dist/index.html
  cp teaser/impressum.html dist/impressum.html
else
  echo "Modus: VOLLE SEITE"
  cp -r site/. dist/
fi
