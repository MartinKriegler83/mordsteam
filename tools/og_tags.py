# Vorschau beim Teilen (Facebook, WhatsApp, LinkedIn, Bio-Links): og:/twitter:-Tags in alle öffentlichen Seiten (seit 15.10.2026).
# Titel und Beschreibung kommen aus <title> und <meta name="description"> der Seite, die Adresse aus canonical bzw. dem Dateipfad.
# Bild: Specials-Seiten → assets/og/special-<lang>.jpg, sonst assets/og/home-<lang>.jpg (Bilder aus tools/og_live.mjs).
# Seiten mit noindex (Bestellung, Spiel, 404 …) bleiben ohne Tags.
# Aufruf: python3 tools/og_tags.py – idempotent (ersetzt den Block <!--og-->…<!--/og-->). Nach tools/en_pages.py erneut ausführen.
import glob, html, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
BASE = "https://mordsteam.com"
n = 0
for p in sorted(glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "en", "*.html"))):
    rel = os.path.relpath(p, ROOT).replace(os.sep, "/")
    s = open(p, encoding="utf-8").read()
    s = re.sub(r"<!--og-->.*?<!--/og-->\n?", "", s, flags=re.S)
    if re.search(r'<meta name="robots" content="[^"]*noindex', s) or "<head>" not in s:
        open(p, "w", encoding="utf-8").write(s); continue
    lang = "en" if re.search(r'<html lang="en"', s) else "de"
    title = re.search(r"<title>(.*?)</title>", s, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', s)
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', s)
    url = canon.group(1) if canon else BASE + "/" + ("" if rel == "index.html" else "en/" if rel == "en/index.html" else rel)
    img = f"{BASE}/assets/og/{'special' if 'specials' in rel else 'home'}-{lang}.jpg"
    t = html.escape(html.unescape(title.group(1).strip()), quote=True) if title else "Mordsteam"
    d = desc.group(1) if desc else ""
    block = ("<!--og-->\n"
             f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Mordsteam">\n'
             f'<meta property="og:locale" content="{"en_US" if lang == "en" else "de_AT"}">\n'
             f'<meta property="og:url" content="{url}">\n<meta property="og:title" content="{t}">\n'
             + (f'<meta property="og:description" content="{d}">\n' if d else "")
             + f'<meta property="og:image" content="{img}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
             f'<meta name="twitter:card" content="summary_large_image">\n<!--/og-->\n')
    s = s.replace('<link rel="stylesheet"', block + '<link rel="stylesheet"', 1) if '<link rel="stylesheet"' in s else s.replace("</head>", block + "</head>", 1)
    open(p, "w", encoding="utf-8").write(s); n += 1
print("og-Tags in", n, "Seiten")
