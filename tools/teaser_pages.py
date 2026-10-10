#!/usr/bin/env python3
# Teaser-Modus (mordsteam.com vor dem Go-live): Newsletter-Anmeldung und Datenschutzerklärung als schlanke Seiten
# ohne Navigation zum Angebot. Inhalt (<main>) kommt unverändert aus den Seiten der vollen Website, damit Text,
# Einwilligung und Datenschutz identisch bleiben. Erzeugt:
#   teaser/newsletter.html, teaser/datenschutz.html, teaser/en/newsletter.html, teaser/en/privacy.html
# Aufruf: python3 tools/teaser_pages.py   (nach jeder Änderung an site/newsletter.html, site/datenschutz.html oder den EN-Seiten)
import os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PAGES = [
    ("site/newsletter.html", "teaser/newsletter.html", "de", "/en/newsletter.html"),
    ("site/datenschutz.html", "teaser/datenschutz.html", "de", "/en/privacy.html"),
    ("site/en/newsletter.html", "teaser/en/newsletter.html", "en", "/newsletter.html"),
    ("site/en/privacy.html", "teaser/en/privacy.html", "en", "/datenschutz.html"),
]
LUPE = '<svg width="28" height="28" viewBox="0 0 34 34" fill="none" stroke="#15171C" stroke-width="3" aria-hidden="true"><circle cx="14" cy="14" r="10"/><line x1="21.5" y1="21.5" x2="31" y2="31" stroke-linecap="round"/><circle cx="14" cy="14" r="3.5" fill="#B3261E" stroke="none"/></svg>'


def header(lang, other):
    home = "/en/" if lang == "en" else "/"
    lab = ("Mordsteam home", "DE", "Deutsch") if lang == "en" else ("Mordsteam Startseite", "EN", "English")
    return (f'<header class="header"><div class="wrap">\n<a class="logo" href="{home}" aria-label="{lab[0]}">{LUPE}'
            f'<span class="wm-box"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span></span></a>\n'
            f'<nav class="nav-desktop" style="display:flex" aria-label="{"Language" if lang == "en" else "Sprache"}">'
            f'<a class="langlink" href="{other}" hreflang="{lab[1].lower()}" lang="{lab[1].lower()}" title="{lab[2]}">{lab[1]}</a></nav>\n</div></header>')


def footer(lang):
    if lang == "en":
        links = '<a href="/en/newsletter.html">Newsletter</a><a href="/en/imprint.html">Imprint</a><a href="/en/privacy.html">Privacy</a>'
    else:
        links = '<a href="/newsletter.html">Newsletter</a><a href="/impressum.html">Impressum</a><a href="/datenschutz.html">Datenschutz</a>'
    return (f'<footer class="footer"><div class="wrap">\n<span class="brand"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span></span>\n'
            f'<nav aria-label="{"Legal" if lang == "en" else "Rechtliches"}">{links}</nav>\n<span>© 2026 Mordsteam e.U.</span>\n</div></footer>')


for src, dst, lang, other in PAGES:
    s = open(os.path.join(ROOT, src), encoding="utf-8").read()
    n = 0
    s, k = re.subn(r"<header class=\"header\">[\s\S]*?</header>", lambda m: header(lang, other), s, count=1); n += k
    s, k = re.subn(r"<footer class=\"footer\">[\s\S]*?</footer>", lambda m: footer(lang), s, count=1); n += k
    assert n == 2, f"Kopf oder Fuß nicht gefunden: {src}"
    s = re.sub(r'\s*<script src="/?assets/(menu|currency)\.js"[^>]*></script>', "", s)
    # Teaser: nicht in Suchmaschinen, Stil und Skripte absolut (Seiten liegen auch unter /en/)
    s = s.replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n<meta name="viewport"', 1)
    s = re.sub(r'(href|src)="(?:\.\./)?assets/', r'\1="/assets/', s)
    # relative Links im Inhalt auf die Teaser-Seiten zeigen lassen
    base = "/en/" if lang == "en" else "/"
    s = s.replace('href="datenschutz.html', 'href="/datenschutz.html').replace('href="privacy.html', f'href="{base}privacy.html')
    s = re.sub(r'<link rel="(alternate|manifest)"[^>]*>\n?', "", s)
    os.makedirs(os.path.dirname(os.path.join(ROOT, dst)), exist_ok=True)
    open(os.path.join(ROOT, dst), "w", encoding="utf-8").write(s)
    left = sorted(set(re.findall(r'href="([^"#:]+\.html)', s)) - {"/newsletter.html", "/datenschutz.html", "/impressum.html", "/en/newsletter.html", "/en/privacy.html", "/en/imprint.html"})
    assert not left, f"{dst}: Links auf Seiten, die es im Teaser nicht gibt: {left}"
    print("geschrieben:", dst)
