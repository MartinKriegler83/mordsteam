# Mordsteam

Website, Spielplattform und Fall-Dokumente für mordsteam.com. **Repository privat halten** – hier liegen die Falllösungen.

```
site/          Website (Startseite, Pilot-Formular, Rechtstexte)
site/spiel/    Spielplattform „Fallzentrale“ (nur Oberflächen, keine Fallinhalte)
teaser/        Platzhalter-Startseite bis zum Launch
functions/     Server-Funktionen (Pilot-Formular, Spiel-API)
lib/           Spiellogik und Fälle – wird nie öffentlich ausgeliefert
db/schema.sql  Datenbank der Spielplattform (Cloudflare D1)
build.sh       Baut dist/: Teaser oder volle Seite (Schalter LAUNCH)
faelle/        Arbeitsdokumente zu den Fällen
```

## Veröffentlichen

```
cd ~/Projekte/mordsteam
git add .
git commit -m "Was geändert wurde"
git push
```

- `main` → mordsteam.com (Teaser, solange `LAUNCH` nicht `true` ist)
- Vorschau der vollen Seite: `git push origin main:vorschau`
