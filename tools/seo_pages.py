# Erzeugt die Themenseiten für Suchbegriffe (SEO) unter site/*.html – Kopf und Fußzeile wie die übrigen deutschen Seiten.
# Aufruf: python3 tools/seo_pages.py   (danach python3 tools/zebra.py ist nicht nötig, das Skript ruft finish() selbst auf)
# Die Seiten erscheinen wie alles andere erst mit LAUNCH=true auf mordsteam.com, vorher nur auf der Vorschau.
import os, re, json, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zebra import finish
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
BASE = "https://mordsteam.com/"

# Kopf (bis inkl. </header>) und Fuß (ab </main>) aus teams.html übernehmen, „aktuelle Seite“-Markierung entfernen
src = open(os.path.join(ROOT, "teams.html"), encoding="utf-8").read()
head_tpl = src[: src.index("</header>") + len("</header>")]
foot_tpl = src[src.index("</main>"):]
head_tpl = head_tpl.replace(' aria-current="page"', "")
head_tpl = re.sub(r'<link rel="alternate" hreflang="de"[^>]*>\n<link rel="alternate" hreflang="en"[^>]*>\n', "", head_tpl)
head_tpl = re.sub(r'<a class="langlink" href="/en/teams.html"[^>]*>EN</a>', '<a class="langlink" href="/en/" hreflang="en" lang="en" title="English">EN</a>', head_tpl)
head_tpl = head_tpl.replace('<a href="/en/teams.html" hreflang="en" lang="en">English</a>', '<a href="/en/" hreflang="en" lang="en">English</a>')

SIG = ""  # Signet setzt zebra.finish() vor </main>, wenn ein roter Schlussaufruf da ist

def faq_ld(faq):
    return json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}} for q, a in faq]}, ensure_ascii=False)

def page(p):
    h = head_tpl
    h = re.sub(r"<title>.*?</title>", f"<title>{html.escape(p['title'])}</title>", h, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{html.escape(p["desc"])}">\n<link rel="canonical" href="{BASE}{p["slug"]}.html">\n<script type="application/ld+json">{faq_ld(p["faq"])}</script>', h)
    h = re.sub(r'(<nav class="nav-desktop"[^>]*>.*?)<a class="btn btn-ink" href="[^"]*">Jetzt spielen</a>', lambda m: m.group(1) + f'<a class="btn btn-ink" href="{p["cta_href"]}">Jetzt spielen</a>', h, flags=re.S)
    h = re.sub(r'(<details class="menu">.*?)<a class="btn btn-red" href="[^"]*">Jetzt spielen</a>', lambda m: m.group(1) + f'<a class="btn btn-red" href="{p["cta_href"]}">Jetzt spielen</a>', h, flags=re.S)
    points = "".join(f"<li>{x}</li>" for x in p["points"])
    steps = "".join(f'<div class="step"><span class="num">{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></div>' for i, (t, d) in enumerate(p["steps"]))
    offers = "".join(f'<div class="aud"><span class="status live">{o[0]}</span><h3>{o[1]}</h3><p>{o[2]}</p><p><a class="btn btn-line" href="{o[3]}">{o[4]}</a></p></div>' for o in p["offers"])
    faq = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in p["faq"])
    main = f'''
<main id="top">
<section class="hero"><div class="wrap"><div class="stack" style="max-width:820px">
<div class="eyebrow">{p["eyebrow"]}</div>
<h1>{p["h1"]}</h1>
<p class="lead">{p["lead"]}</p>
<div class="actions"><a class="btn btn-red" href="{p["cta_href"]}">{p["cta"]}</a><a class="btn-text" href="#ablauf">So funktioniert's</a></div>
</div></div></section>

<section class="section"><div class="wrap stack" style="max-width:900px">
<div class="eyebrow">Warum Mordsteam</div>
<h2 class="h2">{p["why_h2"]}</h2>
<p>{p["why"]}</p>
<ul class="list">{points}</ul>
</div></section>

<section id="ablauf" class="section"><div class="wrap">
<div class="stack" style="margin-bottom:28px"><div class="eyebrow">Ablauf</div><h2 class="h2">In drei Schritten zum Fall</h2></div>
<div class="steps">{steps}</div>
</div></section>

<section class="section"><div class="wrap">
<div class="stack" style="margin-bottom:28px"><div class="eyebrow">Angebot</div><h2 class="h2">{p["offers_h2"]}</h2></div>
<div class="audience two">{offers}</div>
<p class="small" style="margin-top:16px">{p["offers_note"]}</p>
</div></section>

<section id="faq" class="section faq"><div class="wrap stack" style="max-width:900px">
<div class="eyebrow">FAQ</div><h2 class="h2">Häufige Fragen</h2>
<div>{faq}</div>
</div></section>

<section class="cta"><div class="wrap">
<h2>{p["cta_h2"]}</h2>
<p>{p["cta_p"]}</p>
<a class="btn btn-ink" href="{p["cta_href"]}">{p["cta"]}</a>
</div></section>
'''
    out = h + "\n" + main + foot_tpl
    return finish(out, "de")

# Angebotskarten: einheitlich Produkt · Zielgruppe als Abzeichen, Titel = was es ist (keine Fallnummern im Titel)
FIRMEN_OFFER = ("TEAMS · FÜR FIRMEN", "Krimi-Teamevent für Firmen", "Ein Kriminalfall in eurer Firma, mit euren Namen. Basic 89 €, Premium 119 €, Premium Plus mit KI-Finale 149 € – pro Team, beliebig viele Teams.", "teams.html", "Teams ansehen")
VEREINE_OFFER = ("TEAMS · FÜR VEREINE", "Krimi-Teamevent für Vereine", "Nach dem Vereinsfest ist die Festkassa weg – und jemand aus dem Verein war's. Gleiche Pakete und Preise wie für Firmen.", "teams.html#fall002", "Vereinsfall ansehen")
FRIENDS_OFFER = ("FRIENDS · 4–8 PERSONEN", "Krimiabend für Freunde", "Ihr seid die Verdächtigen – jeder ermittelt am eigenen Handy. Ab 29 € für bis zu 4 Personen.", "friends.html", "Friends ansehen")
SOLO_OFFER = ("SOLO · 1 PERSON", "Krimi für dich allein", "Drei Fälle zum Allein-Lösen am Handy, 30–45 Minuten, ab 8,90 € – mit 5-€-Gutschein für Friends oder Teams.", "solo.html", "Solo ansehen")

PAGES = [
  dict(slug="teamevent-online", title="Teamevent online: Krimi-Teamevent für Remote-Teams | Mordsteam",
    desc="Virtuelles Teamevent ohne Moderator: ein personalisierter Krimifall mit euren Namen. Für Remote- und Hybrid-Teams, 50–90 Minuten, ab 89 € pro Team.",
    eyebrow="Teamevent online · virtuell · hybrid", h1="Teamevent online – ein Krimi, in dem euer Team die Hauptrolle spielt",
    lead="Ein virtuelles Teamevent, das nicht nach Pflichttermin aussieht: Euer Team löst einen Kriminalfall, der in eurer eigenen Firma spielt – mit euren Namen, Abteilungen und Insidern. Jeder spielt von dort, wo er gerade ist.",
    cta="Fall für mein Team konfigurieren", cta_href="bestellen.html",
    why_h2="Warum ein Krimi als Online-Teamevent funktioniert",
    why="Bei Online-Teamevents schalten viele nach zehn Minuten innerlich ab. Ein Fall, in dem die eigenen Kolleginnen und Kollegen verdächtig sind, hält alle bei der Sache: Beweisstücke aufteilen, Alibis vergleichen, gemeinsam entscheiden – im Videocall oder im Büro.",
    points=["Personalisiert: eure Firma, eure Namen, eure Räume – auf Wunsch auch fiktiv", "Ohne Moderator: Anleitung und digitale Fallzentrale führen durch das Spiel", "Remote, hybrid oder vor Ort: jedes Team braucht nur ein Gerät, bis zu 5 weitere lesen per QR-Code mit", "Ein Team gegen die Uhr oder mehrere Teams im Wettkampf, mit Rangliste und Urkunde", "Auf Deutsch oder Englisch – ideal für internationale Teams"],
    steps=[("Bestellen und personalisieren", "Fall und Paket wählen, Namen und Abteilungen eintragen – oder eine fiktive Besetzung nehmen."), ("Spielcode erhalten", "Direkt nach dem Bezahlen bekommt ihr eure Links. Gespielt wird, wann ihr wollt – innerhalb von 12 Monaten."), ("Ermitteln und lösen", "Die Uhr startet für alle Teams gleichzeitig. Wer den Fall zuerst löst, gewinnt.")],
    offers_h2="Das passende Paket für euer Team", offers=[FIRMEN_OFFER, FRIENDS_OFFER],
    offers_note="Preise pro Team, inkl. allem – keine Versandkosten, keine Spielleitung nötig. Rechnung mit Firmenadresse und UID automatisch per E-Mail.",
    faq=[("Wie funktioniert ein Online-Teamevent mit Mordsteam?", "Jedes Team öffnet seine digitale Fallakte und die Fall-Website im Browser. Ihr sprecht euch im Videocall oder im Raum ab und gebt eure Lösung in der Fallzentrale ein. Hinweise kommen automatisch, ein Moderator ist nicht nötig."),
         ("Wie viele Personen können mitmachen?", "Ideal sind 3 bis 6 Personen pro Team. Die Zahl der Teams ist offen – so spielt auch eine ganze Abteilung gleichzeitig gegeneinander."),
         ("Wie lange dauert das Teamevent?", "Der Countdown beträgt je nach Paket 50, 70 oder 90 Minuten. Plant mit Einführung rund eine bis zwei Stunden ein."),
         ("Was brauchen wir technisch?", "Pro Team ein Laptop, Tablet oder Smartphone mit Internet. Keine App, keine Installation."),
         ("Ist das Teamevent auch für hybride Teams geeignet?", "Ja. Wer im Büro sitzt und wer von zu Hause zugeschaltet ist, spielt im selben Team – die Beweisstücke lassen sich auf mehrere Geräte aufteilen.")],
    cta_h2="Einer von euch hat etwas zu verbergen.", cta_p="Findet heraus, wer – beim nächsten Online-Teamevent."),

  dict(slug="teambuilding-ideen", title="Teambuilding-Ideen: Krimi-Teamevent für Offsite und Onboarding | Mordsteam",
    desc="Teambuilding, das wirklich zusammenschweißt: ein Krimifall in eurer eigenen Firma. Für Offsites, Onboarding neuer Kolleg:innen und als Fun Activity, 50–90 Minuten, ab 89 € pro Team.",
    eyebrow="Teambuilding · Offsite · Onboarding · Fun Activity", h1="Teambuilding-Idee: Wer von euch war's?",
    lead="Ein Kriminalfall, der in eurer eigenen Firma spielt – mit euren Namen, Abteilungen und Insidern. Die Teams teilen Beweise auf, vergleichen Alibis und entscheiden gemeinsam unter Zeitdruck. Ideal für Offsites, das Onboarding neuer Kolleginnen und Kollegen oder als Fun Activity zwischendurch.",
    cta="Fall für unser Team konfigurieren", cta_href="bestellen.html",
    why_h2="Teambuilding, bei dem alle mitmachen",
    why="Viele Teambuilding-Formate sind entweder Vortrag oder Pflichtübung. Beim Krimi arbeiten die Leute tatsächlich zusammen: Wer welche Information hat, wer den Überblick behält, wer die richtige Frage stellt – das zeigt sich im Spiel von selbst. Und weil Kolleginnen und Kollegen die Verdächtigen sind, lernen sich auch neue Teammitglieder schnell kennen.",
    points=["Für Offsites, Strategietage und Workshops als Programmpunkt", "Onboarding: neue Kolleg:innen spielen mit und lernen Namen und Abteilungen kennen", "Fun Activity für zwischendurch – 50, 70 oder 90 Minuten Countdown", "Vor Ort, hybrid oder remote: jedes Team braucht nur ein Gerät", "Mehrere Teams im Wettkampf, mit Rangliste und Urkunde – ganz ohne Moderator"],
    steps=[("Fall und Paket wählen", "Basic (50 Min.), Premium mit zweitem Akt (70 Min.) oder Premium Plus mit KI-Finale (90 Min.)."), ("Personalisieren", "Namen, Abteilungen und Räume eintragen – oder eine fiktive Besetzung nehmen."), ("Spielen", "Eine Person startet die Uhr und kann trotzdem mitspielen. Alles Weitere führt die Fallzentrale.")],
    offers_h2="Für Firmen und Vereine", offers=[FIRMEN_OFFER, VEREINE_OFFER],
    offers_note="Ein Fall lässt sich innerhalb von 12 Monaten einmal starten – ihr könnt also schon jetzt für das nächste Offsite bestellen.",
    faq=[("Wie viele Leute können mitmachen?", "So viele ihr wollt: Ihr bildet Teams zu 3 bis 6 Personen und bestellt die passende Anzahl Teams. Alle Teams spielen denselben Fall gleichzeitig gegeneinander."),
         ("Eignet sich das für das Onboarding neuer Mitarbeitender?", "Ja. Neue Kolleginnen und Kollegen kommen im Fall mit Namen und Abteilung vor und arbeiten im Team mit Leuten zusammen, die sie sonst erst nach Wochen kennenlernen würden."),
         ("Passt der Krimi in ein Offsite-Programm?", "Ja. Mit 50 bis 90 Minuten Countdown passt er als Block zwischen zwei Workshop-Einheiten. Gebraucht wird nur Internet und pro Team ein Laptop, Tablet oder Handy."),
         ("Geht das auch mit Remote-Teams?", "Ja. Jedes Team spielt in einem eigenen Videocall-Raum oder gemeinsam in einem Call – die Fallakte ist komplett digital."),
         ("Ist der Krimi für alle geeignet?", "Ein Krimi mit Augenzwinkern, ohne Blut und ohne Schockeffekte – niemand wird bloßgestellt. Das Paket mit KI-Finale ist für Teilnehmende ab 18 Jahren.")],
    cta_h2="Einer von euch hat etwas zu verbergen.", cta_p="Findet heraus, wer – beim nächsten Teambuilding."),

  dict(slug="krimidinner-firma", title="Krimidinner für Firmen – ohne Dinner, mit euch als Verdächtigen | Mordsteam",
    desc="Die Alternative zum Krimidinner für Firmen: ein personalisierter Krimifall, den eure Teams selbst lösen – vor Ort oder online, ohne Schauspieler, ab 89 € pro Team.",
    eyebrow="Krimidinner · Krimi-Teamevent · Firmenevent", h1="Krimidinner für Firmen – nur dass euer Team ermittelt",
    lead="Beim klassischen Krimidinner schauen alle Schauspielern zu. Bei Mordsteam ist euer Team selbst gefragt: Ihr löst einen Fall, der in eurer Firma spielt – mit euch als Verdächtigen. Das Essen dürft ihr trotzdem dazu bestellen.",
    cta="Krimi-Teamevent konfigurieren", cta_href="bestellen.html",
    why_h2="Was anders ist als beim Krimidinner",
    why="Ein Krimidinner ist Unterhaltung. Ein Krimi-Teamevent ist Zusammenarbeit: Die Teams müssen Beweise auswerten, sich absprechen und unter Zeitdruck entscheiden. Genau das macht es zu einem echten Teambuilding.",
    points=["Keine Schauspieler, keine Location-Bindung, kein Mindestumsatz", "Personalisiert mit euren Namen, Abteilungen und Räumen", "Mehrere Teams gleichzeitig im Wettkampf, mit Rangliste", "Im Büro, im Lokal, im Seminarhotel oder online", "Festpreis pro Team, sofort spielbar"],
    steps=[("Fall und Paket wählen", "Basic (50 Min.), Premium mit zweitem Akt (70 Min.) oder Premium Plus mit KI-Finale (90 Min.)."), ("Besetzung eintragen", "Wer ist das Opfer, wer verdächtig? Mit echten Namen oder fiktiver Besetzung."), ("Spielen", "Die Fallzentrale startet die Uhr für alle Teams. Am Ende gibt es Auflösung, Rangliste und Urkunde.")],
    offers_h2="Krimi-Teamevent statt Krimidinner", offers=[FIRMEN_OFFER, FRIENDS_OFFER],
    offers_note="Für den Krimiabend im Freundeskreis gibt es Mordsteam Friends – jeder spielt am eigenen Handy.",
    faq=[("Ist Mordsteam ein Krimidinner?", "Nicht ganz: Es gibt keine Schauspieler und kein festes Menü. Euer Team löst den Fall selbst – ihr könnt aber gerne dabei essen."),
         ("Für wie viele Personen eignet sich das Firmenevent?", "Für kleine Teams ab 3 Personen bis zu großen Gruppen mit vielen Teams. Ideal sind 3 bis 6 Personen pro Team."),
         ("Muss jemand eine Rolle spielen?", "Nein. Alle ermitteln. Der Täter ist eine Rolle im Fall, die per Zufall den Namen eines Teilnehmers trägt – nicht einmal er selbst weiß es."),
         ("Was kostet das Krimi-Teamevent?", "89 € (Basic), 119 € (Premium) oder 149 € (Premium Plus) pro Team, mit allem, was ihr zum Spielen braucht."),
         ("Können wir das auch online spielen?", "Ja, alles ist digital. Jedes Team braucht nur ein Gerät mit Internet.")],
    cta_h2="Wer von euch war's?", cta_p="Euer Team ermittelt – nicht nur das Publikum."),

  dict(slug="vereinsabend-ideen", title="Vereinsabend-Ideen: Krimi für Sportverein, Feuerwehr & Musikverein | Mordsteam",
    desc="Ideen für den Vereinsabend: ein Krimi, der in eurem Verein spielt – nach dem Vereinsfest ist die Festkassa weg. Für Sport, Feuerwehr, Musik, Theater, ab 89 € pro Team.",
    eyebrow="Vereinsabend · Kameradschaftsabend · Teambuilding im Verein", h1="Vereins&shy;abend-Idee: Wer hat die Festkassa?",
    lead="Nach dem Vereinsfest wird jemand im Kühlanhänger eingesperrt – und die Festkassa ist weg. Der Krimifall spielt in eurem eigenen Verein, mit euren Namen und eurem Festplatz. Jemand aus eurer Runde war's.",
    cta="Vereinsfall konfigurieren", cta_href="bestellen.html?fall=002",
    why_h2="Ein Abend, über den der Verein noch lange redet",
    why="Ob Sportverein, Feuerwehr, Musikverein, Theatergruppe oder Kulturverein: Jeder kennt Fest, Schichtplan, Bonkassa und Leergut. Genau daraus ist der Fall gebaut – mit Wörtern, die zu eurer Vereinsart passen.",
    points=["Eigener Vereinsfall „Eiskalt kassiert“ – für Vereine geschrieben", "Personalisiert: Vereinsname, Festplatz, Vereinsheim, Obfrau oder Obmann", "Mehrere Teams gegeneinander, mit Siegerehrung und Urkunde", "Im Vereinsheim auf Handy oder Laptop – kein Beamer, keine Spielleitung", "Ideal für Vereinsabend, Saisonabschluss, Jubiläum oder Kameradschaftsabend"],
    steps=[("Vereinsart wählen", "Sport, Feuerwehr, Musik, Theater oder Kultur – der Fall übernimmt die passenden Begriffe."), ("Besetzung eintragen", "Vereinsname, Festplatz und die Mitglieder, die verdächtig sein dürfen."), ("Spielen", "Die Uhr läuft für alle Teams gleichzeitig. Wer die Kassa zuerst findet, gewinnt.")],
    offers_h2="Für Vereine und Freundeskreise", offers=[VEREINE_OFFER, FRIENDS_OFFER],
    offers_note="Die Vereinsart ändert nur die Wörter im Fall (Pokal, Anekdoten, Tombolapreis), nie die Lösung oder die Spieldauer.",
    faq=[("Für welche Vereine passt der Krimi?", "Für Sportvereine, Freiwillige Feuerwehren, Musikvereine, Theatergruppen und Kulturvereine – und alle anderen Vereine, die Feste feiern."),
         ("Wie viele Mitglieder können mitspielen?", "Ihr bildet Teams zu 3 bis 6 Personen. Die Zahl der Teams ist offen."),
         ("Brauchen wir Technik im Vereinsheim?", "Nur ein Handy, Tablet oder Laptop pro Team und Internet. Keine App, keine Installation."),
         ("Müssen wir echte Namen eintragen?", "Nein, eine fiktive Besetzung ist möglich. Am meisten Spaß macht es aber mit euren echten Mitgliedern – wer vorkommt, sollte einverstanden sein."),
         ("Ab welchem Alter?", "Der Fall ist für Erwachsene geschrieben. Das Paket mit KI-Verhör ist für Teilnehmende ab 18 Jahren.")],
    cta_h2="Jemand aus eurem Verein hat etwas zu verbergen.", cta_p="Findet die Festkassa, bevor die Brauerei das Leergut holt."),

  dict(slug="krimispiel-zuhause", title="Krimispiel für Zuhause: Krimiabend mit Freunden am Handy | Mordsteam",
    desc="Krimispiel für Zuhause: Ihr seid die Verdächtigen, jeder ermittelt am eigenen Handy. Für 4–8 Freunde, gleichzeitig oder über eine Woche, ab 29 €. Auch allein spielbar ab 8,90 €.",
    eyebrow="Krimispiel · Krimiabend · Spieleabend", h1="Krimispiel für Zuhause – und ihr seid die Ver&shy;dächtigen",
    lead="Ein Krimiabend mit Freunden, ganz ohne Rollenhefte und Verkleidung: Jeder ermittelt am eigenen Handy, einer von euch ist der Täter – und niemand weiß, wer. Gespielt wird gleichzeitig am Abend oder über eine Woche, wann jeder Zeit hat.",
    cta="Krimiabend bestellen – ab 29 €", cta_href="friends-kaufen.html",
    why_h2="Was diesen Krimiabend anders macht",
    why="Bei klassischen Krimispielen liest jeder eine Rolle vor. Bei Mordsteam Friends ermittelt jeder für sich, mit eigenen Beweisstücken – und am Ende zeigt die Rangliste, wer den Fall am schnellsten gelöst hat.",
    points=["Für 4 bis 8 Personen, jeder am eigenen Handy", "Gleichzeitig am Abend oder zeitversetzt über 3, 5 oder 7 Tage", "Ihr seid die Verdächtigen – der Täter wird per Zufall gezogen", "Premium mit KI-Verhörraum: befragt eure Mitspieler als Doppelgänger (ab 18)", "Allein spielen? Mordsteam Solo ab 8,90 €"],
    steps=[("Namen eintragen", "Beim Bestellen die Vornamen der Gruppe eintragen und Spielart wählen."), ("Link teilen", "Ihr bekommt einen Einladungslink für die Gruppe. Jeder tippt auf seinen Namen."), ("Ermitteln", "Hinweise kosten Zeit, falsche Antworten auch. Am Ende kommt die Auflösung für alle gleichzeitig.")],
    offers_h2="Krimispiel für Gruppen oder allein", offers=[FRIENDS_OFFER, SOLO_OFFER],
    offers_note="Jeder Solo-Fall enthält einen 5-€-Gutschein für Friends oder Teams.",
    faq=[("Wie viele Personen braucht man für das Krimispiel?", "Mordsteam Friends ist für 4 bis 8 Personen. Allein spielt ihr Mordsteam Solo."),
         ("Müssen alle am selben Ort sein?", "Nein. Jeder spielt am eigenen Handy – zusammen im Wohnzimmer oder verteilt, gleichzeitig oder über eine Woche."),
         ("Wie lange dauert das Krimispiel?", "Friends Basic hat 50 Minuten Countdown, Premium 70 Minuten. Solo-Fälle dauern rund 30 bis 45 Minuten."),
         ("Was kostet das Krimispiel?", "Friends ab 29 € bis 4 Personen (jede weitere +5 €), Premium mit KI ab 49 € (jede weitere +8 €). Solo ab 8,90 €."),
         ("Braucht man eine App?", "Nein. Alles läuft im Browser am Handy, Tablet oder Laptop.")],
    cta_h2="Einer von euch war's.", cta_p="Findet heraus, wer – beim nächsten Spieleabend."),
]

for p in PAGES:
    path = os.path.join(ROOT, p["slug"] + ".html")
    open(path, "w", encoding="utf-8").write(page(p))
print("ok", len(PAGES))
