#!/bin/sh
# Cloudflare Pages Build: erzeugt den Ordner dist/.
# Solange LAUNCH nicht "true" ist, zeigt mordsteam.com nur den Teaser
# (plus Impressum, Datenschutz und die Spielplattform unter /spiel/).
# Vorschau-Deployments (andere Branches als main) zeigen immer die ganze Seite.
set -e
rm -rf dist
mkdir -p dist
if [ "$CF_PAGES_BRANCH" = "main" ] && [ "$LAUNCH" != "true" ]; then
  echo "Modus: TEASER"
  cp -r site/assets site/spiel site/_headers site/robots.txt site/favicon.ico site/site.webmanifest site/impressum.html site/datenschutz.html dist/
  cp teaser/index.html dist/index.html
  # Rechtsseiten: Navigation zur noch versteckten Seite entfernen
  for f in dist/impressum.html dist/datenschutz.html; do
    sed -i -e '/<nav class="nav-desktop"/,/<\/nav>/d' -e '/<details class="menu">/,/<\/details>/d' \
      -e 's#<a href="agb.html">AGB</a>##' -e 's#href="pilot.html"#href="mailto:office@mordsteam.com"#g' "$f"
  done
else
  echo "Modus: VOLLE SEITE"
  cp -r site/. dist/
fi
