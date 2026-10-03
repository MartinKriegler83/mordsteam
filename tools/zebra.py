# Abschnitts-Hintergründe und Abschluss-Signet für die Seiten (DE und EN).
# - Helle Abschnitte direkt in <main> wechseln zwischen den zwei Beigetönen (bg-a / bg-b),
#   dunkle oder rote Bänder (Video, Eckdaten, Schlussaufruf, Signet) zählen nicht mit, versteckte auch nicht.
# - Seiten mit rotem Schlussaufruf bekommen davor nichts, danach das Signet (Lupe + MORDSTEAM + „Könnt ihr den Fall knacken?“).
# Aufruf für die deutschen Seiten: python3 tools/zebra.py   (en_pages.py nutzt dieselben Funktionen)
import os, re, glob
SKIP = re.compile(r'\b(facts|cta|sig|bh|tvid-sec)\b')
SIG = {"de": ("Könnt ihr den Fall knacken?", "Mordsteam"), "en": ("Can you crack the case?", "Mordsteam")}
LUPE = '<svg class="sig-lupe" viewBox="3 3 28 28" aria-hidden="true"><g fill="none" stroke="#15171C" stroke-width="3"><circle cx="14" cy="14" r="9"/><line x1="20.5" y1="20.5" x2="29" y2="29" stroke-linecap="round"/></g><circle class="dot" cx="14" cy="14" r="3.5" fill="#B3261E"/></svg>'

def sig(lang):
    q, label = SIG[lang]
    return f'<section class="sig" aria-label="{label}"><div class="wrap">\n<div class="sig-row">{LUPE}<p class="sig-wm"><span class="r">MORDS</span>TEAM</p></div>\n<p class="sig-frage">{q}</p>\n</div></section>\n'

def zebra(html):
    m = re.search(r'<main[^>]*>.*</main>', html, re.S)
    if not m: return html
    n = [0]
    def tag(t):
        attrs = t.group(1)
        cm = re.search(r'class="([^"]*)"', attrs)
        cls = [c for c in (cm.group(1).split() if cm else []) if c not in ("bg-a", "bg-b")]
        if not SKIP.search(" ".join(cls)) and not re.search(r'\bhidden\b', attrs):
            cls.append("bg-b" if n[0] % 2 else "bg-a"); n[0] += 1
        new = f'class="{" ".join(cls)}"'
        attrs = re.sub(r'class="[^"]*"', new, attrs) if cm else f' {new}{attrs}'
        return f'<section{attrs}>'
    body = re.sub(r'<section([^>]*)>', tag, m.group(0))
    return html[:m.start()] + body + html[m.end():]

def add_sig(html, lang):
    if 'class="cta"' not in html or 'class="sig"' in html: return html
    return html.replace('</main>', sig(lang) + '</main>', 1)

def finish(html, lang):
    return zebra(add_sig(html, lang))

if __name__ == "__main__":
    root = os.path.join(os.path.dirname(__file__), "..", "site")
    for f in sorted(glob.glob(os.path.join(root, "*.html"))):
        t = open(f).read(); u = finish(t, "de")
        if u != t: open(f, "w").write(u); print("aktualisiert:", os.path.basename(f))
