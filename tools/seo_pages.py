# Erzeugt die Themenseiten für Suchbegriffe (SEO) unter site/*.html – Kopf und Fußzeile wie die übrigen deutschen Seiten.
# Aufruf: python3 tools/seo_pages.py   (danach python3 tools/zebra.py ist nicht nötig, das Skript ruft finish() selbst auf)
# Die Seiten erscheinen wie alles andere erst mit LAUNCH=true auf mordsteam.com, vorher nur auf der Vorschau.
import os, re, json, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zebra import finish
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
BASE = "https://mordsteam.com/"

# Kopf (bis inkl. </header>) und Fuß (ab </main>) aus teams.html bzw. en/teams.html übernehmen, „aktuelle Seite“-Markierung entfernen.
# Reihenfolge: zuerst tools/en_pages.py (erzeugt en/teams.html), dann dieses Skript.
def templates(lang):
    src = open(os.path.join(ROOT, "teams.html" if lang == "de" else "en/teams.html"), encoding="utf-8").read()
    head = src[: src.index("</header>") + len("</header>")].replace(' aria-current="page"', "")
    head = re.sub(r'<link rel="alternate" hreflang="de"[^>]*>\n<link rel="alternate" hreflang="en"[^>]*>\n', "", head)
    return head, src[src.index("</main>"):]

L = {
  "de": dict(play="Jetzt spielen", how="So funktioniert's", why="Warum Mordsteam", flow="Ablauf", steps_h2="In drei Schritten zum Fall", offer="Angebot", faq_h2="Häufige Fragen", prefix=""),
  "en": dict(play="Play now", how="How it works", why="Why Mordsteam", flow="How it works", steps_h2="Three steps to your case", offer="What we offer", faq_h2="Frequently asked questions", prefix="en/"),
}

def faq_ld(faq):
    return json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}} for q, a in faq]}, ensure_ascii=False)

def page(p, lang):
    T = L[lang]
    head_tpl, foot_tpl = templates(lang)
    de_url = f"{BASE}{p['slug'] if lang == 'de' else p['pair']}.html"
    en_url = f"{BASE}en/{p['pair'] if lang == 'de' else p['slug']}.html"
    other = f"/en/{p['pair']}.html" if lang == "de" else f"/{p['pair']}.html"
    h = head_tpl
    h = re.sub(r"<title>.*?</title>", f"<title>{html.escape(p['title'])}</title>", h, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{html.escape(p["desc"])}">\n<link rel="canonical" href="{de_url if lang == "de" else en_url}">\n<link rel="alternate" hreflang="de" href="{de_url}">\n<link rel="alternate" hreflang="en" href="{en_url}">\n<script type="application/ld+json">{faq_ld(p["faq"])}</script>', h)
    # Sprachumschalter auf die Partnerseite
    h = re.sub(r'(<a class="langlink" href=")[^"]*(")', lambda m: m.group(1) + other + m.group(2), h)
    h = re.sub(r'(<a href=")/(?:en/)?teams\.html(" hreflang="(?:de|en)" lang="(?:de|en)">)', lambda m: m.group(1) + other + m.group(2), h)
    h = re.sub(r'(<nav class="nav-desktop"[^>]*>.*?)<a class="btn btn-ink" href="[^"]*">' + T["play"] + '</a>', lambda m: m.group(1) + f'<a class="btn btn-ink" href="{p["cta_href"]}">{T["play"]}</a>', h, flags=re.S)
    h = re.sub(r'(<details class="menu">.*?)<a class="btn btn-red" href="[^"]*">' + T["play"] + '</a>', lambda m: m.group(1) + f'<a class="btn btn-red" href="{p["cta_href"]}">{T["play"]}</a>', h, flags=re.S)
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
<div class="actions"><a class="btn btn-red" href="{p["cta_href"]}">{p["cta"]}</a><a class="btn-text" href="#ablauf">{T["how"]}</a></div>
</div></div></section>

<section class="section"><div class="wrap stack" style="max-width:900px">
<div class="eyebrow">{T["why"]}</div>
<h2 class="h2">{p["why_h2"]}</h2>
<p>{p["why"]}</p>
<ul class="list">{points}</ul>
</div></section>

<section id="ablauf" class="section"><div class="wrap">
<div class="stack" style="margin-bottom:28px"><div class="eyebrow">{T["flow"]}</div><h2 class="h2">{T["steps_h2"]}</h2></div>
<div class="steps">{steps}</div>
</div></section>

<section class="section"><div class="wrap">
<div class="stack" style="margin-bottom:28px"><div class="eyebrow">{T["offer"]}</div><h2 class="h2">{p["offers_h2"]}</h2></div>
<div class="audience two">{offers}</div>
<p class="small" style="margin-top:16px">{p["offers_note"]}</p>
</div></section>

<section id="faq" class="section faq"><div class="wrap stack" style="max-width:900px">
<div class="eyebrow">FAQ</div><h2 class="h2">{T["faq_h2"]}</h2>
<div>{faq}</div>
</div></section>

<section class="cta"><div class="wrap">
<h2>{p["cta_h2"]}</h2>
<p>{p["cta_p"]}</p>
<a class="btn btn-ink" href="{p["cta_href"]}">{p["cta"]}</a>
</div></section>
'''
    return finish(h + "\n" + main + foot_tpl, lang)

# Angebotskarten: einheitlich Produkt · Zielgruppe als Abzeichen, Titel = was es ist (keine Fallnummern im Titel)
FIRMEN_OFFER = ("TEAMS · FÜR FIRMEN", "Krimi-Teamevent für Firmen", "Ein Kriminalfall in eurer Firma, mit euren Namen. Basic 89 €, Premium 119 €, Premium Plus mit KI-Finale 149 € – pro Team, beliebig viele Teams.", "teams.html", "Teams ansehen")
VEREINE_OFFER = ("TEAMS · FÜR VEREINE", "Krimi-Teamevent für Vereine", "Nach dem Vereinsfest ist die Festkassa weg – und jemand aus dem Verein war's. Gleiche Pakete und Preise wie für Firmen.", "teams.html#fall002", "Vereinsfall ansehen")
FRIENDS_OFFER = ("FRIENDS · 4–8 PERSONEN", "Krimiabend für Freunde", "Ihr seid die Verdächtigen – jeder ermittelt am eigenen Handy. Ab 29 € für bis zu 4 Personen.", "friends.html", "Friends ansehen")
SOLO_OFFER = ("SOLO · 1 PERSON", "Krimi für dich allein", "Drei Fälle zum Allein-Lösen am Handy, 30–45 Minuten, ab 8,90 € – mit 5-€-Gutschein für Friends oder Teams.", "solo.html", "Solo ansehen")

PAGES = [
  dict(slug="teamevent-online", pair="virtual-team-building", title="Teamevent online: Krimi-Teamevent für Remote-Teams | Mordsteam",
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

  dict(slug="teambuilding-ideen", pair="team-building-ideas", title="Teambuilding-Ideen: Krimi-Teamevent für Offsite und Onboarding | Mordsteam",
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

  dict(slug="krimidinner-firma", pair="murder-mystery-team-building", title="Krimidinner für Firmen – ohne Dinner, mit euch als Verdächtigen | Mordsteam",
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

  dict(slug="vereinsabend-ideen", pair="club-night-ideas", title="Vereinsabend-Ideen: Krimi für Sportverein, Feuerwehr & Musikverein | Mordsteam",
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

  dict(slug="krimispiel-zuhause", pair="murder-mystery-game-at-home", title="Krimispiel für Zuhause: Krimiabend mit Freunden am Handy | Mordsteam",
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
         ("Wie lange dauert das Krimispiel?", "Friends hat 50 Minuten Countdown, Friends Plus 75 Minuten. Solo-Fälle dauern rund 30 bis 45 Minuten."),
         ("Was kostet das Krimispiel?", "Friends ab 29 € bis 4 Personen (jede weitere +5 €), Premium mit KI ab 49 € (jede weitere +8 €). Solo ab 8,90 €."),
         ("Braucht man eine App?", "Nein. Alles läuft im Browser am Handy, Tablet oder Laptop.")],
    cta_h2="Einer von euch war's.", cta_p="Findet heraus, wer – beim nächsten Spieleabend."),
]

# English topic pages – aimed at what English speakers search for, not a word-for-word translation
COMPANY_EN = ("TEAMS · FOR COMPANIES", "Murder mystery team event for companies", "A crime case set in your own company, starring your names. Basic €89, Premium €119, Premium Plus with AI finale €149 – per team, as many teams as you like.", "teams.html", "See Teams")
CLUB_EN = ("TEAMS · FOR CLUBS", "Murder mystery team event for clubs", "After the club fête the cash box is gone – and someone from the club did it. Same packages and prices as for companies.", "teams.html#case002", "See the club case")
FRIENDS_EN = ("FRIENDS · 4–8 PEOPLE", "Murder mystery night for friends", "You are the suspects – everyone investigates on their own phone. From €29 for up to 4 people.", "friends.html", "See Friends")
SOLO_EN = ("SOLO · 1 PERSON", "A murder mystery just for you", "Three cases to solve on your own phone, 30–45 minutes, from €8.90 – with a €5 voucher for Friends or Teams.", "solo.html", "See Solo")

PAGES_EN = [
  dict(slug="virtual-team-building", pair="teamevent-online", title="Virtual team building: a murder mystery for remote teams | Mordsteam",
    desc="Virtual team building without a host: a personalised murder mystery starring your colleagues. For remote and hybrid teams, 50–90 minutes, from €89 per team.",
    eyebrow="Virtual team building · remote · hybrid", h1="Virtual team building – a murder mystery starring your team",
    lead="A virtual team event that doesn't feel like another meeting: your team solves a crime set in your own company – with your names, departments and in-jokes. Everyone plays from wherever they are.",
    cta="Set up a case for my team", cta_href="order.html",
    why_h2="Why a murder mystery works online",
    why="On video calls, people switch off after ten minutes. A case where your own colleagues are the suspects keeps everyone involved: splitting up the evidence, comparing alibis, deciding together – on a call or in the office.",
    points=["Personalised: your company, your names, your rooms – or a fictional cast", "No host needed: instructions and the digital case desk run the game", "Remote, hybrid or in person: each team needs one device, up to 5 more can follow along via QR code", "One team against the clock or several teams competing, with leaderboard and certificate", "Playable in English or German – ideal for international teams"],
    steps=[("Order and personalise", "Choose case and package, enter names and departments – or pick a fictional cast."), ("Get your game code", "Right after payment you get your links. Play whenever you like within 12 months."), ("Investigate and solve", "The clock starts for all teams at once. The first team to crack the case wins.")],
    offers_h2="The right package for your team", offers=[COMPANY_EN, FRIENDS_EN],
    offers_note="Prices per team, everything included – no shipping, no host. Invoice with company address and VAT number by email.",
    faq=[("How does a virtual team event with Mordsteam work?", "Each team opens its digital case file and the case website in the browser. You talk on a video call or in the room and enter your answers at the case desk. Hints arrive automatically; no host is needed."),
         ("How many people can take part?", "Ideally 3 to 6 people per team. There is no limit on the number of teams – a whole department can play against each other."),
         ("How long does it take?", "The countdown is 50, 70 or 90 minutes depending on the package. Allow one to two hours including the introduction."),
         ("What do we need?", "One laptop, tablet or smartphone with internet per team. No app, no installation."),
         ("Does it work for hybrid teams?", "Yes. People in the office and people dialling in from home play in the same team – the evidence can be split across several devices.")],
    cta_h2="One of you has something to hide.", cta_p="Find out who – at your next virtual team event."),

  dict(slug="team-building-ideas", pair="teambuilding-ideen", title="Team building ideas: a murder mystery for offsites and onboarding | Mordsteam",
    desc="Team building that actually brings people together: a murder mystery set in your own company. For offsites, onboarding new colleagues and as a fun activity, 50–90 minutes, from €89 per team.",
    eyebrow="Team building · offsite · onboarding · fun activity", h1="Team building idea: which of you did it?",
    lead="A crime case set in your own company – with your names, departments and in-jokes. Teams split up the evidence, compare alibis and decide together against the clock. Ideal for offsites, onboarding new colleagues or as a fun activity in between.",
    cta="Set up a case for our team", cta_href="order.html",
    why_h2="Team building everyone joins in",
    why="Many team-building formats are either a talk or a chore. In a murder mystery people really work together: who holds which clue, who keeps the overview, who asks the right question – it all shows during the game. And because colleagues are the suspects, new team members get to know everyone fast.",
    points=["For offsites, strategy days and workshops as a programme item", "Onboarding: new colleagues play along and learn names and departments", "A fun activity in between – 50, 70 or 90 minute countdown", "In person, hybrid or remote: each team needs just one device", "Several teams competing, with leaderboard and certificate – no host needed"],
    steps=[("Choose case and package", "Basic (50 min), Premium with a second act (70 min) or Premium Plus with AI finale (90 min)."), ("Personalise", "Enter names, departments and rooms – or pick a fictional cast."), ("Play", "One person starts the clock and can still play along. The case desk handles the rest.")],
    offers_h2="For companies and clubs", offers=[COMPANY_EN, CLUB_EN],
    offers_note="A case can be started once within 12 months – so you can already order for your next offsite.",
    faq=[("How many people can take part?", "As many as you like: form teams of 3 to 6 and order the matching number of teams. All teams play the same case against each other at the same time."),
         ("Is it suitable for onboarding new employees?", "Yes. New colleagues appear in the case with their name and department and work with people they would otherwise only meet weeks later."),
         ("Does it fit into an offsite programme?", "Yes. With a 50 to 90 minute countdown it fits between two workshop sessions. All you need is internet and one laptop, tablet or phone per team."),
         ("Does it work for remote teams?", "Yes. Each team plays in its own video-call room or together on one call – the case file is fully digital."),
         ("Is it suitable for everyone?", "A tongue-in-cheek murder mystery, no gore, no shock effects – nobody is embarrassed. The package with the AI finale is for participants aged 18 and over.")],
    cta_h2="One of you has something to hide.", cta_p="Find out who – at your next team building."),

  dict(slug="murder-mystery-team-building", pair="krimidinner-firma", title="Murder mystery team building for companies – no actors needed | Mordsteam",
    desc="The alternative to a murder mystery dinner for companies: a personalised case your teams solve themselves – in person or online, no actors, from €89 per team.",
    eyebrow="Murder mystery · team event · corporate event", h1="Murder mystery team building – where your team investigates",
    lead="At a classic murder mystery dinner, everyone watches actors. At Mordsteam your team does the work: you solve a case set in your own company – with you as the suspects. You're welcome to order dinner as well.",
    cta="Set up your team event", cta_href="order.html",
    why_h2="What's different from a murder mystery dinner",
    why="A murder mystery dinner is entertainment. A murder mystery team event is collaboration: teams have to analyse evidence, coordinate and decide under time pressure. That's what makes it real team building.",
    points=["No actors, no venue tie-in, no minimum spend", "Personalised with your names, departments and rooms", "Several teams competing at the same time, with leaderboard", "In the office, at a restaurant, at a seminar hotel or online", "Fixed price per team, playable immediately"],
    steps=[("Choose case and package", "Basic (50 min), Premium with a second act (70 min) or Premium Plus with AI finale (90 min)."), ("Enter the cast", "Who is the victim, who are the suspects? With real names or a fictional cast."), ("Play", "The case desk starts the clock for all teams. At the end: solution, leaderboard and certificate.")],
    offers_h2="A team event instead of a murder mystery dinner", offers=[COMPANY_EN, FRIENDS_EN],
    offers_note="For a murder mystery night with friends there is Mordsteam Friends – everyone plays on their own phone.",
    faq=[("Is Mordsteam a murder mystery dinner?", "Not quite: there are no actors and no set menu. Your team solves the case itself – but feel free to eat while you play."),
         ("How many people is it for?", "From small teams of 3 to large groups with many teams. Ideally 3 to 6 people per team."),
         ("Does anyone have to play a role?", "No. Everyone investigates. The culprit is a role in the case that randomly carries the name of a participant – not even they know."),
         ("What does it cost?", "€89 (Basic), €119 (Premium) or €149 (Premium Plus) per team, with everything you need to play."),
         ("Can we play online?", "Yes, everything is digital. Each team only needs one device with internet.")],
    cta_h2="Which of you did it?", cta_p="Your team investigates – not just the audience."),

  dict(slug="club-night-ideas", pair="vereinsabend-ideen", title="Club night ideas: a murder mystery for sports clubs, bands and societies | Mordsteam",
    desc="Ideas for your club night: a murder mystery set in your own club – after the club fête the cash box is gone. For sports clubs, fire brigades, bands and drama societies, from €89 per team.",
    eyebrow="Club night · social evening · team building for clubs", h1="Club night idea: who took the cash box?",
    lead="After the club fête someone is locked in the refrigerated trailer – and the cash box is gone. The case is set in your own club, with your names and your fête ground. Someone from your group did it.",
    cta="Set up the club case", cta_href="order.html?fall=002",
    why_h2="An evening your club will talk about for a long time",
    why="Sports club, fire brigade, band, drama society or community group: everyone knows the fête, the rota, the token till and the empties. That's what the case is built from – with words that fit your kind of club.",
    points=["Its own club case, “Cold Cash” – written for clubs", "Personalised: club name, fête ground, clubhouse, chair", "Several teams competing, with award ceremony and certificate", "In the clubhouse on phones or laptops – no projector, no host", "Ideal for club nights, end of season, anniversaries or social evenings"],
    steps=[("Choose your kind of club", "Sports, fire brigade, music, theatre or culture – the case uses the matching terms."), ("Enter the cast", "Club name, fête ground and the members who may be suspects."), ("Play", "The clock runs for all teams at once. The first to find the cash box wins.")],
    offers_h2="For clubs and groups of friends", offers=[CLUB_EN, FRIENDS_EN],
    offers_note="The kind of club only changes the words in the case (trophy, anecdotes, raffle prize), never the solution or the playing time.",
    faq=[("Which clubs is it for?", "Sports clubs, volunteer fire brigades, bands, drama societies and community groups – and any other club that holds a fête."),
         ("How many members can play?", "You form teams of 3 to 6 people. There is no limit on the number of teams."),
         ("Do we need equipment at the clubhouse?", "Just one phone, tablet or laptop per team and internet. No app, no installation."),
         ("Do we have to use real names?", "No, a fictional cast is possible. But it's most fun with your real members – anyone who appears should agree."),
         ("What age is it for?", "The case is written for adults. The package with the AI interrogation is for participants aged 18 and over.")],
    cta_h2="Someone in your club has something to hide.", cta_p="Find the cash box before the brewery collects the empties."),

  dict(slug="murder-mystery-game-at-home", pair="krimispiel-zuhause", title="Murder mystery game at home: a whodunnit for friends on your phones | Mordsteam",
    desc="A murder mystery game for home: you are the suspects, everyone investigates on their own phone. For 4–8 friends, at the same time or over a week, from €29. Also playable alone from €8.90.",
    eyebrow="Murder mystery game · whodunnit · game night", h1="Murder mystery game at home – and you are the suspects",
    lead="A murder mystery night with friends, without character booklets or costumes: everyone investigates on their own phone, one of you is the culprit – and nobody knows who. Play together in one evening or over a week, whenever each of you has time.",
    cta="Order a mystery night – from €29", cta_href="friends-buy.html",
    why_h2="What makes this game night different",
    why="In classic murder mystery games everyone reads out a role. In Mordsteam Friends everyone investigates for themselves, with their own evidence – and at the end the leaderboard shows who solved the case fastest.",
    points=["For 4 to 8 people, each on their own phone", "At the same time in one evening or spread over 3, 5 or 7 days", "You are the suspects – the culprit is drawn at random", "Premium with AI interrogation room: question your fellow players' doubles (18+)", "Playing alone? Mordsteam Solo from €8.90"],
    steps=[("Enter names", "When ordering, enter your group's first names and choose how you want to play."), ("Share the link", "You get one invitation link for the group. Everyone taps their own name."), ("Investigate", "Hints cost time, wrong answers too. At the end the solution is revealed to everyone at once.")],
    offers_h2="Murder mystery for groups or on your own", offers=[FRIENDS_EN, SOLO_EN],
    offers_note="Every Solo case includes a €5 voucher for Friends or Teams.",
    faq=[("How many people do you need?", "Mordsteam Friends is for 4 to 8 people. On your own, play Mordsteam Solo."),
         ("Do we have to be in the same place?", "No. Everyone plays on their own phone – together in the living room or apart, at the same time or over a week."),
         ("How long does it take?", "Friends has a 50-minute countdown, Friends Plus 75 minutes. Solo cases take around 30 to 45 minutes."),
         ("What does it cost?", "Friends from €29 for up to 4 people (+€5 per extra person), Premium with AI from €49 (+€8 per extra person). Solo from €8.90."),
         ("Do we need an app?", "No. Everything runs in the browser on phone, tablet or laptop.")],
    cta_h2="One of you did it.", cta_p="Find out who – at your next game night."),
]

for p in PAGES:
    open(os.path.join(ROOT, p["slug"] + ".html"), "w", encoding="utf-8").write(page(p, "de"))
for p in PAGES_EN:
    open(os.path.join(ROOT, "en", p["slug"] + ".html"), "w", encoding="utf-8").write(page(p, "en"))
print("ok", len(PAGES), len(PAGES_EN))
