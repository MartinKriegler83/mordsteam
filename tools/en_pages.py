# Erzeugt die englischen Seiten unter site/en/ (Kopf, Menü und Fußzeile gemeinsam).
# Aufruf: python3 tools/en_pages.py  – danach site/en/*.html committen.
import os, html
ROOT = os.path.join(os.path.dirname(__file__), "..", "site")
MAP = {"index": "index", "order": "bestellen", "ordered": "bestellt", "privacy": "datenschutz", "imprint": "impressum", "terms": "agb", "pilot": "pilot", "thanks": "danke"}
LOGO = '<svg width="30" height="30" viewBox="0 0 34 34" fill="none" stroke="#15171C" stroke-width="3" aria-hidden="true"><circle cx="14" cy="14" r="10"/><line x1="21.5" y1="21.5" x2="31" y2="31" stroke-linecap="round"/><circle cx="14" cy="14" r="3.5" fill="#B3261E" stroke="none"/></svg>'

PILOTBAR = """<div class="pilot"><div class="wrap">
<span class="tag">PILOT PHASE</span>
<span>We're looking for pilot companies for case 001 – you play at a special price and give us feedback.</span>
<a href="pilot.html">Apply as a pilot company</a>
</div></div>
"""

def page(name, title, desc, body, robots=None, scripts="", home=False):
    de = MAP[name]
    pre = "" if home else "index.html"
    nav = f'''<a href="{pre}#how">How it works</a>
<a href="{pre}#cases">Cases</a>
<a href="{pre}#packages">Packages</a>
<a href="{pre}#faq">FAQ</a>'''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{html.escape(desc)}">
{f'<meta name="robots" content="{robots}">' if robots else ''}
<link rel="alternate" hreflang="de" href="https://mordsteam.com/{'' if de == 'index' else de + '.html'}">
<link rel="alternate" hreflang="en" href="https://mordsteam.com/en/{'' if name == 'index' else name + '.html'}">
<link rel="stylesheet" href="/assets/style.css">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
</head>
<body>
{PILOTBAR if home else ''}
<header class="header"><div class="wrap">
<a class="logo" href="{'#top' if home else 'index.html'}" aria-label="Mordsteam home">
{LOGO}
<span>MORDSTEAM</span>
</a>
<nav class="nav-desktop" aria-label="Main navigation">
{nav}
<a class="langlink" href="/{'' if de == 'index' else de + '.html'}" hreflang="de" lang="de" title="Deutsch">DE</a>
<a class="btn btn-ink" href="order.html">Order</a>
</nav>
<details class="menu">
<summary aria-label="Open menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15171C" stroke-width="2.2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></summary>
<nav aria-label="Menu">
{nav}
<a href="/{'' if de == 'index' else de + '.html'}" hreflang="de" lang="de">Deutsch</a>
<a class="btn btn-red" href="order.html">Order</a>
</nav>
</details>
</div></header>
{body}
{scripts}
<footer class="footer"><div class="wrap">
<span class="brand">MORDSTEAM</span>
<nav aria-label="Legal"><a href="imprint.html">Imprint</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="mailto:office@mordsteam.com">Contact</a><a href="/{'' if de == 'index' else de + '.html'}" hreflang="de" lang="de">Deutsch</a></nav>
<span>© 2026 Mordsteam</span>
</div></footer>
</body>
</html>
'''

P = {}
P["index"] = dict(title="Mordsteam – The personalised murder-mystery team event", home=True,
 desc="A murder case starring your company, club or group of friends. 50 to 90 minutes, competing investigator teams, no game master needed.",
 body='''<main id="top">
<section class="hero"><div class="wrap hero-grid">
<div class="stack">
<div class="eyebrow">Case file 001 · The murder-mystery team event</div>
<h1>Which one of you did it?</h1>
<p class="lead">A murder case in which your company, club or group of friends plays the lead – with your names, your rooms and your in-jokes. You investigate in teams against each other – 50 minutes in the Basic package, 70 minutes with a second act in Premium, 90 minutes with an AI finale in Premium Plus. No agency, no actors: instructions and a digital case desk guide you through the case.</p>
<div class="actions">
<a class="btn btn-red" href="#packages">Set up a case for my team</a>
<a class="btn-text" href="#how">How it works</a>
</div>
</div>
<div class="file" aria-hidden="true">
<div class="folder"></div>
<div class="sheet">
<div class="mast"><span>THE EVENING POST</span><span>FRIDAY, 10:30</span></div>
<div class="headline">Poison attack on the boss of <span class="mark">Example Ltd</span></div>
<p><span class="mark">Emma Clarke</span> barely survived. Questioned: <span class="mark">Sarah Mitchell</span> from <span class="mark">Sales</span>, <span class="mark">James Porter</span> from IT and three more colleagues. The red folder with her evidence is missing.</p>
<div class="chips"><span>your names</span><span>your rooms</span><span>your departments</span><span>your in-jokes</span></div>
</div>
<div class="stamp"><div><small>MORDSTEAM · FILE 001</small><strong>UNSOLVED</strong><small>HANDOVER 12:00</small></div></div>
</div>
</div></section>

<section class="facts" aria-label="Key facts"><div class="wrap">
<div><b>50 to 90 min</b><span>Basic with one act, Premium with a second act, Premium Plus with a finale with an AI assistant</span></div>
<div><b>3–6 per team</b><span>as many teams as you like, investigating against each other</span></div>
<div><b>Self-guided</b><span>instructions and a case desk instead of a host</span></div>
<div><b>German or English</b><span>you choose the game language when you order</span></div>
</div></section>

<section id="how" class="section"><div class="wrap stack">
<div class="eyebrow">How it works</div>
<h2 class="h2">Three steps from form to crime scene</h2>
<div class="steps">
<div class="step"><span class="num">1</span><div><h3>Enter your teams</h3><p>Your boss as the victim, the top boss waiting for the folder, five suspects from your group (Premium and Premium Plus: six), plus rooms and teams. Who did it is decided at random – not even the organiser knows in advance.</p></div></div>
<div class="step"><span class="num">2</span><div><h3>Get your file</h3><p>Your personal case file arrives digitally on laptop, phone or tablet. Plus your own case intranet – with your logo – and the case desk for every team.</p></div></div>
<div class="step"><span class="num">3</span><div><h3>Investigate and crack it</h3><p>Four answers, one attempt: who, when, why, where. Enter everything correctly at the case desk and you've solved the case – with a live ranking, a big reveal and winners' certificates to download.</p></div></div>
</div>
</div></section>

<section id="cases" class="section" style="padding-top:0"><div class="wrap stack">
<div class="eyebrow">The cases</div>
<h2 class="h2">A case for every group</h2>
<p class="lead">Each case is written for a particular kind of group. More cases are on the way.</p>
<div class="cases">
<a class="case-card" href="#case"><div class="meta"><span>CASE 001 · FOR COMPANIES</span><span class="status live">PILOT PHASE</span></div><h3>The Red Folder</h3><p>A poison attack on your top floor, a missing folder and a handover to the top boss at 12:00 noon. Someone from your group did it.</p></a>
<div class="case-card upcoming"><div class="meta"><span>MORE CASES</span><span class="status plan">IN PREPARATION</span></div><h3>For clubs and groups of friends</h3><p>The next cases are in the works. Sign up via the pilot request and you'll be the first to know.</p></div>
</div>
</div></section>

<section id="case" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Case 001 · The Red Folder · for companies</div>
<h2 class="h2">Your boss survived. Barely. And one of you did it.</h2>
<p class="lead">After the strategy evening, your boss is found poisoned. A red folder is missing – with evidence that someone in the company is diverting money. At 12:00 noon it was due with the top boss – CEO, group chair or board. By then you need to know who did it.</p>
<p><b>Everything happens in your company:</b></p>
<div class="objects"><span>your top floor as the victim</span><span>your colleagues as suspects</span><span>your intranet</span><span>your logo</span></div>
<ul class="list">
<li>Act 1: Who? When? Where did the money go? Where is the folder?</li>
<li>Premium: act 2 with new evidence and even trickier questions</li><li>Premium Plus: finale with ARIA, the AI assistant on your intranet – she helps with the last puzzle, but not every answer gets you further</li>
<li>The culprit is always drawn at random from your group – different every round, nobody knows in advance</li>
<li>Your own case intranet with your logo, full of clues</li>
<li>Red herrings with a wink – nobody is shown up, and the victim survives</li>
<li>Localised for your country: police, currency, number plates, bank details and cities – across Europe, North America and Australia</li>
</ul>
</div>
<div class="clues" aria-label="Examples from the case file">
<div class="clue"><small>ACCESS LOG</small><span>22:47 · Executive office<br>Badge 4 ? ? ?</span></div>
<div class="clue"><small>CATERING DELIVERY NOTE</small><span>Peppermint with honey<br>collected 21:?? · badge ????</span></div>
<div class="clue dark"><small>CASE DESK</small><div class="codebox" aria-label="Four-digit solution code"><i>?</i><i>?</i><i>?</i><i>?</i></div><span class="hint">Enter the code, solve the case, top the ranking.</span></div>
<div class="clue"><small>ARIA · AI ASSISTANT</small><span>Premium Plus only:<br>“I know every appointment. Ask me!”</span></div>
</div>
</div></section>

<section id="packages" class="section"><div class="wrap stack">
<div class="eyebrow">Packages</div>
<h2 class="h2">Three packages, all digital</h2>
<p class="lead">One price per team – whether three or six people investigate in it. You enter all the details before paying, then everything runs automatically.</p>
<div class="pack-grid three">
<div class="pack">
<span class="badge">GETTING STARTED</span>
<h3>Basic</h3><p class="sub">50 minutes · one act</p>
<p class="price">€89 per team</p><p class="per">around €18 per person in teams of 5</p>
<ul class="list"><li>Your personal case – with your names, your rooms and your logo</li><li>Digital case file for every team</li><li>Your own case intranet with hidden clues</li><li>One act with four questions</li><li>Digital case desk: automatic hints, award ceremony and solution</li><li>Winners' certificates to download</li></ul>
<a class="btn btn-line" href="order.html?paket=basis">Order Basic</a>
</div>
<div class="pack featured">
<span class="badge">OUR RECOMMENDATION</span>
<h3>Premium</h3><p class="sub">70 minutes · two acts</p>
<p class="price">€119 per team</p><p class="per">around €24 per person in teams of 5</p>
<ul class="list"><li>Everything in Basic</li><li>Act 2 with new evidence and two more, even trickier questions</li><li>Six suspects instead of five</li></ul>
<a class="btn btn-red" href="order.html?paket=premium">Order Premium</a>
</div>
<div class="pack">
<span class="badge">THE FULL EXPERIENCE</span>
<h3>Premium Plus</h3><p class="sub">90 minutes · two acts and an AI finale</p>
<p class="price">€149 per team</p><p class="per">around €30 per person in teams of 5</p>
<ul class="list"><li>Everything in Premium</li><li>Finale with ARIA, the AI assistant on your intranet: she helps you solve the last puzzle</li><li>For participants aged 18 and over</li></ul>
<a class="btn btn-line" href="order.html?paket=plus">Order Premium Plus</a>
</div>
</div>
<div class="devicebox">
<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M1 17h16"/><rect x="17" y="8" width="6" height="12" rx="1.2"/><path d="M19.5 17.5h1"/></svg>
<p><b>Playable on laptop, phone or tablet.</b> Each team plays on one main device and can connect up to 5 more devices via QR code to follow along – so the team can split up the evidence.</p>
</div>
<p class="example">Example for 15 people in 3 teams: Basic €267, Premium €357, Premium Plus €447. All prices are final prices in euros. 3 to 6 people per team is ideal.</p>
</div></section>

<section class="section duo"><div class="wrap">
<div class="stack" style="margin-bottom:28px"><div class="eyebrow">Who it's for</div><h2 class="h2">Made for every group with secrets</h2></div>
<div class="audience">
<div class="aud"><span class="status live">CASE 001 · PILOT PHASE</span><h3>Companies</h3><ul class="list"><li>Team building and offsites</li><li>Onboarding new teams</li><li>Department and holiday parties</li></ul></div>
<div class="aud"><span class="status plan">IN PREPARATION</span><h3>Clubs</h3><ul class="list"><li>Club nights and anniversaries</li><li>Holiday parties and outings</li><li>Sports, music and cultural clubs</li></ul></div>
<div class="aud"><span class="status plan">PLANNED</span><h3>Friends</h3><ul class="list"><li>Milestone birthdays</li><li>Cabin weekends and game nights</li><li>Stag and hen parties</li></ul></div>
</div>
<div class="privacy"><h2>Privacy, taken seriously</h2>
<ul class="list"><li>Only names and roles, no emails or photos of your players</li><li>Case website and case desk protected and hidden from search engines</li><li>All data automatically deleted 30 days after the event</li><li>All suspects and the victim agree beforehand – you confirm this when ordering</li><li>Your logo only with confirmed permission – it appears only in your case intranet</li></ul>
</div>
</div></section>

<section id="faq" class="section faq"><div class="wrap faq-grid">
<div class="stack"><div class="eyebrow">FAQ</div><h2 class="h2">Questions?</h2></div>
<div>
<details><summary>How many people fit in a team?</summary><p>3 to 6 is ideal. Each team enters its answers on one main device and can connect up to 5 more phones or laptops via QR code to follow along – so you can split up the evidence. More people? Just book one more team – that makes the competition more exciting, too.</p></details>
<details><summary>Do we need a game master?</summary><p>No person needed. Instructions and the digital case desk guide you through the case: start, automatic hints, answer entry and ranking. One person from your group just starts the clock – and can still play along.</p></details>
<details><summary>How long does a case take?</summary><p>Basic: 50 minutes, one act with four questions. Premium: 70 minutes – after act 1, the case desk unlocks a second act. Premium Plus: 90 minutes – in the finale you question ARIA, the AI assistant on your intranet. If a team gets stuck, HQ sends hints automatically.</p></details>
<details><summary>Who is the culprit?</summary><p>Always someone from your group – drawn at random, new every round. Not even the organiser knows in advance, and neither does the culprit. Everyone who appears in the case should have agreed beforehand.</p></details>
<details><summary>Can we play in English?</summary><p>Yes. You choose the game language (German or English) when you order – independently of the language of this website. The whole case, the intranet, the case desk and ARIA then speak that language.</p></details>
<details><summary>Which countries does the case work in?</summary><p>The case is localised for your country: police, currency, number plates, bank details, phone numbers and cities fit – for the countries of Europe as well as the USA, Canada, Australia and New Zealand. For all other countries we set it in a fictional place.</p></details>
<details><summary>What do we need to play?</summary><p>One smartphone, tablet or laptop with internet per team – for the case file, answer entry and ranking. More devices per team are welcome.</p></details>
<details><summary>Can we use AI or Google?</summary><p>Please don't. The case is built to be solved with brainpower – AI and search engines only spoil the fun. A matter of honour among detectives.</p></details>
<details><summary>How gruesome is it?</summary><p>Not at all. It's a poisoning without blood and with a wink – and your boss survives. At the reveal, the victim can even confront the culprit in person.</p></details>
<details><summary>Do we have to enter real names?</summary><p>No. It's most fun with your real colleagues and rooms – but you can also choose a fictional company with invented characters. Then you don't enter any names when ordering.</p></details>
<details><summary>What age is it for?</summary><p>Our cases are written for adults – with a poisoning, fraud and dark humour. Premium Plus with the AI assistant ARIA is intended for participants aged 18 and over. If younger people play along, for example apprentices, choose Basic or Premium: no AI runs there.</p></details>
<details><summary>Our IT blocks AI tools – will ARIA still work?</summary><p>Usually, yes. Your devices only connect to mordsteam.com; ARIA runs via our server and only knows the invented world of the case. We don't send real names from your personalisation to the AI provider but replace them with placeholders first. If your policies prohibit AI applications altogether, check briefly with your IT or choose Premium without ARIA. Tip for all packages: open mordsteam.com/spiel on a company device beforehand – then you know no web filter will get in the way.</p></details>
<details><summary>How quickly do we get the case?</summary><p>Immediately, in all three packages. After paying you see your game code right on the screen, and you can play from the next day. Everything is digital, nothing is shipped.</p></details>
<details><summary>Do we get an invoice?</summary><p>Yes, automatically by email – with the company address and VAT number you enter when paying.</p></details>
</div>
</div></section>

<section class="cta"><div class="wrap">
<h2>One of you has something to hide.</h2>
<p>Enter your teams and find out who.</p>
<a class="btn btn-ink" href="order.html">Order</a>
</div></section>
</main>''')

P["order"] = dict(title="Order – Mordsteam", robots="noindex", desc="Order case 001 “The Red Folder”: enter your details, pay, get your game code immediately.",
 scripts='<div class="pricebar" id="pricebar"><div class="wrap"><span id="pb-text"></span><strong id="pb-sum"></strong></div></div>\n<script src="/assets/bestellen.js"></script>',
 body='''<main class="page shop"><div class="wrap">
<div class="eyebrow">Order · Case 001</div>
<h1>Order your case</h1>
<p class="lead">Enter who appears in your case, pay – and get your game code immediately. Takes about 5 minutes.</p>
<div class="note" id="closed" hidden>Orders are not open yet. You can look at the form but can't submit it yet.</div>
<div class="note" id="cancelled" hidden>The payment was cancelled. Your entries are still here – you can simply try again.</div>
<form class="form" id="order" novalidate>

<fieldset class="step"><legend><span>1</span> Package and date</legend>
<div class="pick" role="radiogroup" aria-label="Package">
<label class="pickcard"><input type="radio" name="paket" value="basis" checked><span><b>Basic</b><small>50 minutes<br>Act 1 with four questions</small><em>€89 per team</em></span></label>
<label class="pickcard"><input type="radio" name="paket" value="premium"><span><b>Premium</b><small>70 minutes<br>Act 1 + act 2 with two more, even trickier tasks</small><em>€119 per team</em></span></label>
<label class="pickcard"><input type="radio" name="paket" value="plus"><span><b>Premium Plus</b><small>90 minutes<br>Acts 1 &amp; 2 + finale with ARIA, the AI assistant on the intranet</small><em>€149 per team</em></span></label>
</div>
<p class="note" id="plusnote" hidden>ARIA is intended for participants aged 18 and over. If younger people play along, for example apprentices, please choose Basic or Premium – no AI runs there.</p>
<div class="two">
<div class="field"><label for="teams">Number of teams *</label>
<select id="teams" name="teams"></select><span class="hint">3 to 6 people per team is ideal. Each team needs one device.</span></div>
<div class="field"><label for="event_date">Game day *</label><input id="event_date" name="event_date" type="date" required><span class="hint" id="datehint"></span></div>
</div>
</fieldset>

<fieldset class="step"><legend><span>2</span> Language, country and cast</legend>
<div class="two">
<div class="field"><label for="lang">Game language *</label>
<select id="lang" name="lang"><option value="en">English</option><option value="de">German</option></select>
<span class="hint">The language of the case file, intranet, case desk and ARIA – independent of this website.</span></div>
<div class="field"><label for="land">Country *</label>
<select id="land" name="land"></select>
<span class="hint">Police, currency, number plates, bank details and cities in the case will match your country.</span></div>
</div>
<p class="steplead">The case is most fun with real people and places: your boss as the victim, colleagues as suspects, your rooms as the crime scene. If you'd rather not enter anyone, you get an invented company with invented characters.</p>
<div class="pick two-pick" role="radiogroup" aria-label="Cast">
<label class="pickcard"><input type="radio" name="besetzung" value="echt" checked><span><b>With your company</b><small>Your names, your rooms, your logo<br>recommended</small></span></label>
<label class="pickcard"><input type="radio" name="besetzung" value="fiktiv"><span><b>Fictional company</b><small>Invented company and characters<br>no data entry</small></span></label>
</div>
<p class="note" id="fiktivnote" hidden>You play in an invented company with invented characters – which one, the case will tell you. The steps for company, victim and suspects are skipped.</p>
</fieldset>

<fieldset class="step" data-real><legend><span>2</span> Your company</legend>
<div id="f-firma"></div>
<div class="field"><label for="logo">Company logo <span class="opt">optional</span></label>
<div class="logobox"><img id="logoprev" alt="" hidden><input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><button type="button" class="linkbtn" id="logodel" hidden>Remove logo</button></div>
<span class="hint">Appears on the case intranet. PNG or SVG with a transparent background looks best.</span></div>
<label class="check" id="logorechte" hidden><input type="checkbox" name="logo_rechte"><span>We may use this logo for our internal team event. *</span></label>
</fieldset>

<fieldset class="step" data-real><legend><span>3</span> Victim and top boss</legend>
<p class="steplead">The victim is your boss – don't worry, it ends well. The top boss is above them, for example the group CEO or the board chair.</p>
<div id="f-opfer" class="person"></div>
<div id="f-boss" class="person"></div>
</fieldset>

<fieldset class="step" data-real><legend><span>4</span> The suspects</legend>
<p class="steplead">Five colleagues (Premium and Premium Plus: six). One of them becomes the culprit at random – not even we know who in advance. Good picks are people who play along and can laugh at themselves.</p>
<div id="f-sus"></div>
</fieldset>

<fieldset class="step"><legend><span>5</span> Contact and invoice</legend>
<div class="two">
<div class="field"><label for="c_name">Your name *</label><input id="c_name" name="c_name" maxlength="120" autocomplete="name"></div>
<div class="field"><label for="c_email">Email *</label><input id="c_email" name="c_email" type="email" maxlength="160" autocomplete="email"><span class="hint">We send the game code and invoice here.</span></div>
</div>
<div class="two">
<div class="field"><label for="c_tel">Phone <span class="opt">optional</span></label><input id="c_tel" name="c_tel" type="tel" maxlength="40" autocomplete="tel"></div>
<div class="field"><label for="c_firma">Company on the invoice <span class="opt">optional</span></label><input id="c_firma" name="c_firma" maxlength="120" autocomplete="organization"><span class="hint">You enter the billing address and VAT number when paying.</span></div>
</div>
</fieldset>

<fieldset class="step"><legend><span>6</span> Review and pay</legend>
<div class="summary" id="summary"></div>
<label class="check" id="zustimmungbox"><input type="checkbox" name="zustimmung"><span>Everyone we have entered by name knows about it and agrees to appear in the fictional case – including as victim or suspect. *</span></label>
<label class="check" id="ab18box" hidden><input type="checkbox" name="ab18"><span>All participants are at least 18 years old (required for ARIA in Premium Plus). *</span></label>
<label class="check"><input type="checkbox" name="agb"><span>I accept the <a href="terms.html" target="_blank">terms</a> and have read the <a href="privacy.html" target="_blank">privacy policy</a>. *</span></label>
<p class="formerr" id="err" role="alert" hidden></p>
<div><button class="btn btn-red" type="submit" id="submit">Order and pay</button></div>
<p class="hint small">Payment is handled securely by Stripe (card, Apple Pay, Google Pay and more). You see the game code, instructions and organiser code right afterwards. No VAT charged (Austrian small business scheme). Prices in euros.</p>
</fieldset>
</form>
</div></main>''')

P["ordered"] = dict(title="Order – Mordsteam", robots="noindex, nofollow", desc="Your Mordsteam order.",
 scripts='<script src="/assets/bestellt.js"></script>',
 body='''<main class="page shop"><div class="wrap" id="out">
<div class="eyebrow">Order</div>
<h1>One moment …</h1>
<p class="lead">We're creating your case.</p>
<div class="spinner" aria-hidden="true"></div>
</div></main>''')

P["privacy"] = dict(title="Privacy policy – Mordsteam", desc="How Mordsteam handles your data.",
 body='''<main class="page"><div class="wrap prose">
<h1>Privacy policy</h1>
<p class="small">This is a translation of our German privacy policy. In case of doubt, the <a href="/datenschutz.html" hreflang="de">German version</a> applies.</p>
<h2>1. Controller</h2>
<p>Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, Austria<br>Email: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a></p>
<h2>2. Visiting the website</h2>
<p>The website is delivered via Cloudflare (Cloudflare, Inc., USA, and affiliated companies). Technically necessary connection data such as IP address, time, page requested and browser identifier are processed to deliver the site securely and quickly (Art. 6(1)(f) GDPR). Cloudflare is certified under the EU-US Data Privacy Framework.</p>
<p>We use no cookies, no tracking and no analytics tools. Fonts are hosted locally; no data is sent to Google.</p>
<h2>3. Pilot application</h2>
<p>If you submit the “Apply for a pilot place” form, we store the type and name of your group (company, club or group of friends), your name, email, optionally phone, country, team size, occasion, preferred period and your message. The purpose is to process your application and arrange a pilot date (Art. 6(1)(b) GDPR, pre-contractual measures). The data is stored in a Cloudflare data store and deleted after 12 months at the latest, earlier if you ask us to.</p>
<h2>4. Order and payment</h2>
<p>For an order we process the chosen package, number of teams, game day, game language, your name, your email address, optionally phone and invoice company, and the details for personalising the case (company name, city, rooms, names, title and role of the people who appear in the case, optionally your logo). The purpose is performance of the contract (Art. 6(1)(b) GDPR). If you choose the fictional company, you don't provide any personal data for the personalisation.</p>
<p>Payment and invoicing are handled by Stripe (Stripe Payments Europe, Ltd., Dublin, Ireland). Stripe receives your payment and billing data for this and processes it under its own responsibility; we never see card details. We keep invoice and payment data for as long as tax retention obligations require (in Austria usually seven years).</p>
<h2>5. Game round and case desk</h2>
<p>For the game round we store the personalisation details, team names, times, answer attempts and hints in a database at Cloudflare. On the teams' devices only a login key is stored in the browser's local storage (no cookie, no tracking). 30 days after the game day we delete the game round including teams, answer attempts, chat histories and logo; the personal data of the personalisation is then removed from the order. To develop our cases further, we keep anonymous statistics (playing times, number of wrong attempts and hints per team) without names.</p>
<h2>6. ARIA – AI assistant in the Premium Plus package</h2>
<p>In the Premium Plus package, teams can chat with ARIA, an AI assistant on the case intranet, in the finale. What the teams write in the chat is sent together with the invented case data (calendar, intranet) to our AI provider Anthropic so that ARIA can reply (Art. 6(1)(b) GDPR). We replace the real names from the personalisation (company, people, rooms) with placeholders before sending and only reinsert them in the reply – even if they are typed into the chat. The teams' devices only connect to mordsteam.com, not directly to the AI provider. Anthropic processes the data as a processor, does not use it to train its models and deletes inputs and outputs after 30 days by default. The transfer to the USA is based on certification under the EU-US Data Privacy Framework or on EU standard contractual clauses.</p>
<p>Please don't enter real personal data in the chat – ARIA doesn't need it and only knows the world of the game. Each team can send at most 100 messages. We store the chat history with the game round and delete it 30 days after the game day. ARIA is labelled as an AI; her answers may contain errors.</p>
<h2>7. Email contact</h2>
<p>If you email us, we process your details to answer your enquiry (Art. 6(1)(b) or (f) GDPR). Our emails are processed via Apple iCloud.</p>
<h2>8. Your rights</h2>
<p>You have the right to access, rectification, erasure, restriction of processing, data portability and objection. Write to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. You can also lodge a complaint with the Austrian Data Protection Authority: <a href="https://www.dsb.gv.at">www.dsb.gv.at</a>.</p>
<p>Last updated: September 2026</p>
</div></main>''')

P["imprint"] = dict(title="Imprint – Mordsteam", desc="Legal information about Mordsteam.",
 body='''<main class="page"><div class="wrap prose">
<h1>Imprint</h1>
<p>Information pursuant to § 5 of the Austrian E-Commerce Act and disclosure pursuant to § 25 of the Austrian Media Act. The <a href="/impressum.html" hreflang="de">German version</a> is legally binding.</p>
<h2>Media owner and service provider</h2>
<p>Martin Kriegler<br>Sportplatzgasse 16<br>7152 Pamhagen<br>Austria</p>
<p>Email: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a></p>
<h2>General direction</h2>
<p>Information about Mordsteam's murder-mystery team events.</p>
<h2>Liability for links</h2>
<p>The operators of linked external pages are solely responsible for their content.</p>
<h2>Copyright</h2>
<p>Texts, cases, graphics and logo of this website are protected by copyright. Use is only permitted with our consent.</p>
</div></main>''')

P["terms"] = dict(title="Terms – Mordsteam", desc="Terms and conditions of Mordsteam.",
 body='''<main class="page"><div class="wrap prose">
<h1>Terms and conditions</h1>
<p class="lead">We will publish our general terms and conditions when the order system launches. During the pilot phase, the individually agreed conditions apply.</p>
</div></main>''')

P["pilot"] = dict(title="Apply for a pilot place – Mordsteam", desc="Apply for a pilot place for case 001 and play the personalised murder-mystery team event at a special price.",
 body='''<main class="page"><div class="wrap">
<div class="eyebrow">Pilot phase · Case 001</div>
<h1>Apply for a pilot place</h1>
<p class="lead">We're testing case 001 “The Red Folder” with a few company teams before the shop opens. You play at a special price, we get your honest feedback. Clubs and groups of friends: sign up too – we'll get in touch as soon as your case is ready.</p>

<form class="form" method="post" action="/api/pilot">
<input type="hidden" name="lang" value="en">
<div class="field"><label for="gruppe">We are *</label>
<select id="gruppe" name="gruppe" required><option value="">Please choose</option><option value="eine Firma">a company</option><option value="ein Verein">a club</option><option value="ein Freundeskreis">a group of friends</option><option value="etwas anderes">something else</option></select></div>
<div class="two">
<div class="field"><label for="firma">Name of the company, club or group *</label><input id="firma" name="firma" required maxlength="120" autocomplete="organization"></div>
<div class="field"><label for="name">Your name *</label><input id="name" name="name" required maxlength="120" autocomplete="name"></div>
</div>
<div class="two">
<div class="field"><label for="email">Email *</label><input id="email" name="email" type="email" required maxlength="160" autocomplete="email"></div>
<div class="field"><label for="telefon">Phone</label><input id="telefon" name="telefon" type="tel" maxlength="40" autocomplete="tel"><span class="hint">optional</span></div>
</div>
<div class="two">
<div class="field"><label for="land">Country *</label><input id="land" name="land" required maxlength="40" autocomplete="country-name"></div>
<div class="field"><label for="teamgroesse">Group size *</label>
<select id="teamgroesse" name="teamgroesse" required><option value="">Please choose</option><option value="4–6 Personen">4–6 people</option><option value="7–12 Personen">7–12 people</option><option value="13–30 Personen">13–30 people</option><option value="31–60 Personen">31–60 people</option></select></div>
</div>
<div class="two">
<div class="field"><label for="anlass">Occasion</label>
<select id="anlass" name="anlass"><option value="">Please choose</option><option>Team building day</option><option>Offsite / retreat</option><option>Onboarding</option><option>Department or holiday party</option><option>Club night / anniversary</option><option>Birthday / private party</option><option>Other occasion</option></select></div>
<div class="field"><label for="zeitraum">Preferred period</label><input id="zeitraum" name="zeitraum" maxlength="80" placeholder="e.g. November or Q1 2027"></div>
</div>
<div class="field"><label for="nachricht">Anything else we should know?</label><textarea id="nachricht" name="nachricht" maxlength="2000"></textarea></div>
<div class="hp" aria-hidden="true"><label for="website">Website</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>
<label class="check"><input type="checkbox" name="datenschutz" value="ja" required><span>I have read the <a href="privacy.html">privacy policy</a> and agree that my details are stored to process the pilot application. *</span></label>
<div><button class="btn btn-red" type="submit">Send application</button></div>
<p class="hint" style="font-size:14px;color:#5A5D66">* Required fields. Please don't enter any employee data – we only need that when you order.</p>
</form>
</div></main>''')

P["thanks"] = dict(title="Thank you – Mordsteam", robots="noindex", desc="Your application has arrived.",
 body='''<main class="page"><div class="wrap">
<div class="eyebrow">File opened</div>
<h1>Thank you, your application has arrived.</h1>
<p class="lead">We'll get back to you by email in the next few days. Until then: nobody leaves the building.</p>
<p style="margin-top:28px"><a class="btn btn-ink" href="index.html">Back to the home page</a></p>
</div></main>''')

for name, p in P.items():
    out = page(name, p["title"], p["desc"], p["body"], p.get("robots"), p.get("scripts", ""), p.get("home", False))
    with open(os.path.join(ROOT, "en", name + ".html"), "w") as f:
        f.write(out)
print("ok", len(P))
