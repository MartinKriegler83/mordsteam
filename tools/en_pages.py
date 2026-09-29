# Erzeugt die englischen Seiten unter site/en/ (Kopf, Menü und Fußzeile gemeinsam).
# Aufruf: python3 tools/en_pages.py  – danach site/en/*.html committen.
import os, html
ROOT = os.path.join(os.path.dirname(__file__), "..", "site")
MAP = {"index": "index", "teams": "teams", "friends": "friends", "solo": "solo", "order": "bestellen", "ordered": "bestellt", "privacy": "datenschutz", "imprint": "impressum", "terms": "agb", "contact": "kontakt", "early-bird": "earlybird", "feedback": "feedback", "withdraw": "widerruf"}
LOGO = '<svg width="30" height="30" viewBox="0 0 34 34" fill="none" stroke="#15171C" stroke-width="3" aria-hidden="true"><circle cx="14" cy="14" r="10"/><line x1="21.5" y1="21.5" x2="31" y2="31" stroke-linecap="round"/><circle cx="14" cy="14" r="3.5" fill="#B3261E" stroke="none"/></svg>'



EBBAR = """<div class="promo" id="ebbar"><div class="wrap"><span class="tag">EARLY BIRD</span><span><span class="ebp">40</span>% off your first Teams or Friends game<span class="star">*</span><span class="ebbis"></span></span><a href="early-bird.html">*Conditions</a></div></div>"""

def page(name, title, desc, body, robots=None, scripts="", home=False, promo=False):
    de = MAP[name]
    cur = lambda k: ' aria-current="page"' if k == name else ''
    nav = f'''<a href="teams.html"{cur("teams")}>Teams</a>
<a href="friends.html"{cur("friends")}>Friends</a>
<a href="solo.html"{cur("solo")}>Solo</a>
<a href="teams.html#faq">FAQ</a>'''
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
{EBBAR if (home or promo) else ''}
<header class="header"><div class="wrap">
<a class="logo" href="index.html" aria-label="Mordsteam home">
{LOGO}
<span class="wm-box"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span></span>
</a>
<nav class="nav-desktop" aria-label="Main navigation">
{nav}
<a class="langlink" href="/{'' if de == 'index' else de + '.html'}" hreflang="de" lang="de" title="Deutsch">DE</a>
<a class="btn btn-ink" href="teams.html#packages">Play now</a>
</nav>
<details class="menu">
<summary aria-label="Open menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15171C" stroke-width="2.2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></summary>
<nav aria-label="Menu">
<a href="index.html">Home</a>
{nav}
<a href="/{'' if de == 'index' else de + '.html'}" hreflang="de" lang="de">Deutsch</a>
<a class="btn btn-red" href="teams.html#packages">Play now</a>
</nav>
</details>
</div></header>
{body}
{scripts}
<footer class="footer"><div class="wrap">
<span class="brand"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span></span>
<nav aria-label="Legal"><a href="imprint.html">Imprint</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="contact.html">Contact</a><a href="withdraw.html">Withdraw from contract</a></nav>
<span>© 2026 Mordsteam e.U.</span>
</div></footer>
</body>
</html>
'''

P = {}
P["teams"] = dict(title="Mordsteam Teams – the personalised murder-mystery team event for companies and clubs", promo=True, scripts='<script src="/assets/aktion.js"></script>',
 desc="A murder case starring your team – for companies and clubs. 50 to 90 minutes, competing investigator teams, no game master needed.",
 body='''<nav class="subnav" aria-label="Mordsteam Teams"><div class="wrap">
<b><span>Mordsteam</span> Teams</b>
<a href="#how">How it works</a><a href="#case">Case 001</a><a href="#packages">Packages</a><a href="#faq">FAQ</a>
<a class="btn btn-red" href="order.html">Order</a>
</div></nav>
<main id="top">
<section class="hero"><div class="wrap hero-grid">
<div class="stack">
<div class="eyebrow">Mordsteam Teams · for companies &amp; clubs</div>
<h1>Which one of you did it?</h1>
<p class="lead">The murder case in which your team plays the lead – with your names, your rooms and your in-jokes. Several teams investigate against each other, 50 to 90 minutes, no game master needed.</p>
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
<div><b>Play right away</b><span>straight after buying or whenever you like – in German or English</span></div>
</div></section>

<section id="whoisitfor" class="section"><div class="wrap">
<div class="stack" style="margin-bottom:28px"><div class="eyebrow">Who it's for</div><h2 class="h2">Made for every team with secrets</h2></div>
<div class="audience two">
<div class="aud"><span class="status live">CASE 001 · BOOK NOW</span><h3>Companies</h3><ul class="list"><li>Team building and offsites</li><li>Onboarding new teams</li><li>Department and holiday parties</li></ul></div>
<div class="aud"><span class="status plan">CASE 002 · COMING SOON</span><h3>Clubs</h3><ul class="list"><li>Club nights and anniversaries</li><li>Holiday parties and outings</li><li>Sports, music and cultural clubs</li></ul></div>
</div>
</div></section>

<section id="how" class="section"><div class="wrap stack">
<div class="eyebrow">How it works</div>
<h2 class="h2">Three steps from form to crime scene</h2>
<div class="steps">
<div class="step"><span class="num">1</span><div><h3>Enter your teams</h3><p>Your boss as the victim, the top boss waiting for the folder, five suspects from your group (Premium and Premium Plus: six), plus rooms and teams. Who did it is decided at random – not even the organiser knows in advance.</p></div></div>
<div class="step"><span class="num">2</span><div><h3>Get your file</h3><p>Your personal case file arrives digitally on laptop, phone or tablet. Plus your own case intranet – with your logo – and the case desk for every team.</p></div></div>
<div class="step"><span class="num">3</span><div><h3>Investigate and solve the case</h3><p>Will you find all the crucial clues? Enter everything correctly at the case desk and you've solved the case. At the end: an award ceremony, the big reveal and certificates to download.</p></div></div>
</div>
</div></section>

<section id="case" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Case 001 · The Red Folder · for companies</div>
<h2 class="h2">Your boss survived. Barely. And one of you did it.</h2>
<p class="lead">After the strategy evening, your boss is found poisoned. A red folder is missing – with evidence that someone in the company is diverting money. At 12:00 noon it was due with the top boss – CEO, group chair or board. By then you need to know who did it.</p>
<p><b>Everything happens in your company:</b></p>
<div class="objects"><span>your top floor as the victim</span><span>your colleagues as suspects</span><span>your intranet</span></div>
</div>
<div class="clues" aria-label="Examples from the case file">
<div class="clue"><small>ACCESS LOG</small><span>Who was where, and when?<br>??:?? · door ??? · badge ????</span></div>
<div class="clue"><small>CATERING DELIVERY NOTE</small><span>“What would you like to drink?”<br>order ?? · collected ??:??</span></div>
<div class="clue dark"><small>CASE DESK</small><div class="codebox" aria-label="Four-digit solution code"><i>?</i><i>?</i><i>?</i><i>?</i></div><span class="hint">Enter your answers, solve the case, make the podium.</span></div>
<div class="clue"><small>ARIA · AI ASSISTANT</small><span>Premium Plus only:<br>“How can I help you today?”</span></div>
</div>
<ul class="list case-points">
<li>Act 1: Who? When? Where did the money go? Where is the folder?</li>
<li>Premium: act 2 with new evidence and even trickier questions</li><li>Premium Plus: finale with ARIA, the AI assistant on your intranet – she helps with the last puzzle, but not every answer gets you further</li>
<li>The culprit is always drawn at random from your group – different every round, nobody knows in advance</li>
<li>Your own case intranet with your logo, full of clues</li>
<li>Red herrings with a wink – nobody is shown up, and the victim survives</li>
</ul>
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
<div class="privacy"><h2>Privacy, taken seriously</h2>
<ul class="list"><li>Only names and roles, no emails or photos of your players</li><li>Case website and case desk protected and hidden from search engines</li><li>All data automatically deleted 30 days after the game</li><li>All suspects and the victim agree beforehand – you confirm this when ordering</li><li>Your logo only with confirmed permission – it appears only in your case intranet</li></ul>
</div>
</div></section>

<section id="bewertungen" class="section" hidden><div class="wrap stack">
<div class="eyebrow">Reviews</div>
<h2 class="h2">What investigator teams say</h2>
<div class="reviews" id="reviews"></div>
</div></section>

<section id="faq" class="section faq"><div class="wrap faq-grid">
<div class="stack"><div class="eyebrow">FAQ</div><h2 class="h2">Questions?</h2></div>
<div>
<details><summary>How many people fit in a team?</summary><p>3 to 6 is ideal. Each team enters its answers on one main device and can connect up to 5 more phones or laptops via QR code to follow along – so you can split up the evidence. More people? Just book one more team – that makes the competition more exciting, too.</p></details>
<details><summary>Do we need a game master?</summary><p>No person needed. Instructions and the digital case desk guide you through the case: start, automatic hints, answer entry and award ceremony. One person from your group just starts the clock – and can still play along.</p></details>
<details><summary>How long does a case take?</summary><p>Basic: 50 minutes, one act with four questions. Premium: 70 minutes – after act 1, the case desk unlocks a second act. Premium Plus: 90 minutes – in the finale you question ARIA, the AI assistant on your intranet. If a team gets stuck, HQ sends hints automatically.</p></details>
<details><summary>Who is the culprit?</summary><p>Always someone from your group – drawn at random, new every round. Not even the organiser knows in advance, and neither does the culprit. Everyone who appears in the case should have agreed beforehand.</p></details>
<details><summary>Can we play in English?</summary><p>Yes. You choose the game language (German or English) when you order – independently of the language of this website. The whole case, the intranet, the case desk and ARIA then speak that language.</p></details>
<details><summary>Which countries does the case work in?</summary><p>The case is localised for your country: police, currency, number plates, bank details, phone numbers and cities fit – for the countries of Europe as well as the USA, Canada, Australia and New Zealand. For all other countries we set it in a fictional place.</p></details>
<details><summary>What do we need to play?</summary><p>One laptop, tablet or smartphone with internet per team – for the case file, intranet, answer entry and ranking. Up to 5 more devices per team can follow along via QR code. That's all you need.</p></details>
<details><summary>Can we use AI or Google?</summary><p>Please don't – with one exception: ARIA, the AI assistant in the game (Premium Plus only), helps you in the grand finale. Otherwise the case is built to be solved with brainpower – outside AI and search engines only spoil the fun. A matter of honour among detectives.</p></details>
<details><summary>How gruesome is it?</summary><p>Not at all. A crime story with a wink – no blood, no shock effects, and nobody is shown up.</p></details>
<details><summary>Do we have to enter real names?</summary><p>No. But it's most fun with your real colleagues and rooms – you can also choose a fictional company with invented characters.</p></details>
<details><summary>What age is it for?</summary><p>Our cases are written for adults – with a poisoning, fraud and dark humour. Premium Plus with the AI assistant ARIA is intended for participants aged 18 and over. If younger people play along, for example apprentices, choose Basic or Premium: no AI runs there.</p></details>
<details><summary>Our IT blocks AI tools – will ARIA still work?</summary><p>Usually, yes. Your devices only connect to mordsteam.com; ARIA runs via our server and only knows the invented world of the case. We don't send real names from your personalisation to the AI provider but replace them with placeholders first. If your policies prohibit AI applications altogether, check briefly with your IT or choose Premium without ARIA. Tip for all packages: open mordsteam.com/spiel on a company device beforehand – then you know no web filter will get in the way.</p></details>
<details><summary>How quickly do we get the case?</summary><p>Immediately, in all three packages. After paying you see your game code right on the screen and can start straight away – or any time in the next 12 months. Each case can be started once. Everything is digital, nothing is shipped.</p></details>
<details><summary>Do we get an invoice?</summary><p>Yes, automatically by email – with the company address and VAT number you enter when paying.</p></details>
</div>
</div></section>

<section class="cta"><div class="wrap">
<h2>One of you has something to hide.</h2>
<p>Find out who.</p>
<a class="btn btn-ink" href="order.html">Order a case</a>
</div></section>
</main>''')

P["index"] = dict(title="Mordsteam – Murder mysteries you solve yourselves", home=True, scripts='<script src="/assets/aktion.js"></script>',
 desc="Personalised murder-mystery games to play: as a team event for companies and clubs, with friends or on your own. In the browser, no game master.",
 body='''<main id="top">
<section class="bh" aria-labelledby="bh-t"><div class="wrap">
<svg class="bh-lupe" viewBox="0 0 34 34" aria-hidden="true"><g fill="none" stroke="#F3EFE6" stroke-width="3"><circle cx="14" cy="14" r="9"/><line x1="20.5" y1="20.5" x2="29" y2="29" stroke-linecap="round"/></g><circle class="dot" cx="14" cy="14" r="3.5" fill="#E0463C"/></svg>
<h1 id="bh-t"><span class="r">MORDS</span>TEAM</h1>
<p class="claim">Murder mysteries you solve yourselves.</p>
<p class="sub">One case, your names, a culprit among you. As a team, with friends or on your own – on any device, ready to go instantly.</p>
<div class="actions"><a class="btn btn-red" href="#games">Choose a case</a><a class="btn btn-ghost" href="teams.html">For companies &amp; clubs</a></div>
</div>
<span class="evid e1" aria-hidden="true">1</span><span class="evid e2" aria-hidden="true">2</span><span class="evid e3" aria-hidden="true">3</span>
<div class="tape" aria-hidden="true"><span>CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · </span></div>
</section>

<section id="games" class="section"><div class="wrap">
<div class="stack"><div class="eyebrow">Three ways to the crime scene</div><h2 class="h2">Which case suits you?</h2></div>
<div class="games">
<article class="game live"><span class="tab">TEAMS</span><span class="smark ok">PLAY<br>NOW</span>
<h3 class="gname"><span class="wm-r">MORDS</span>TEAM <span class="gp">TEAMS</span></h3>
<p class="for">The murder-mystery team event for companies and clubs.</p>
<p>Your boss has been poisoned, the evidence is gone – and one of you did it. Several teams investigate against each other, with your names and your rooms.</p>
<p class="meta">3–6 PLAYERS PER TEAM · ANY NUMBER OF TEAMS · 50–90 MIN · FROM €89 PER TEAM</p>
<a class="btn btn-red" href="teams.html">Go to Mordsteam Teams</a>
</article>
<article class="game"><span class="tab">FRIENDS</span><span class="smark soon">COMING<br>SOON</span>
<h3 class="gname"><span class="wm-r">MORDS</span>TEAM <span class="gp">FRIENDS</span></h3>
<p class="for">The murder-mystery night for your friends.</p>
<p>You are the suspects – with your real names and your little quirks. Everyone plays at the same time, or whenever they have time this week.</p>
<p class="meta">4–8 INVESTIGATORS · EVERYONE ON THEIR OWN DEVICE · 45–70 MIN · FROM €29 PER GROUP</p>
<a class="btn btn-line" href="friends.html">Find out more</a>
</article>
<article class="game"><span class="tab">SOLO</span><span class="smark soon">COMING<br>SOON</span>
<h3 class="gname"><span class="wm-r">MORDS</span>TEAM <span class="gp">SOLO</span></h3>
<p class="for">A case just for you.</p>
<p>Thirty minutes, four suspects, one truth. The quick mystery in between – and the perfect taste of a team game.</p>
<p class="meta">1 INVESTIGATOR · APPROX. 30 MIN · ANY TIME · ANYWHERE · €8.90</p>
<a class="btn btn-line" href="solo.html">Find out more</a>
</article>
</div>
</div></section>


<section class="facts" aria-label="What makes Mordsteam"><div class="wrap">
<div><b>Personalised</b><span>your names, your rooms, your in-jokes – or a fictional cast</span></div>
<div><b>No game master</b><span>instructions and a digital case desk guide you through</span></div>
<div><b>Play right away</b><span>on laptop, phone or tablet – in German or English</span></div>
<div><b>Privacy</b><span>no cookies, no tracking, automatic deletion after the game</span></div>
</div></section>

<section id="bewertungen" class="section" hidden><div class="wrap stack">
<div class="eyebrow">Reviews</div>
<h2 class="h2">What investigator teams say</h2>
<div class="reviews" id="reviews"></div>
</div></section>

<section class="cta"><div class="wrap">
<h2>One of you has something to hide.</h2>
<p>Find out who.</p>
<a class="btn btn-ink" href="#games">Choose a case</a>
</div></section>
</main>''')

P["friends"] = dict(title="Mordsteam Friends – the murder-mystery night for your friends (coming soon)", promo=True, scripts='<script src="/assets/aktion.js"></script>',
 desc="Mordsteam Friends: a mystery in which you are the suspects. At the same time or whenever each of you has time. Coming soon.",
 body='''<main id="top">
<section class="ph"><div class="wrap">
<div class="stack">
<span class="soonstamp">COMING SOON</span>
<h1><span>Mordsteam</span><br>Friends</h1>
<p class="lead">The murder-mystery night for your friends. You are the suspects – with your real names and your little quirks. And one of you did it.</p>
<div class="actions" style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-red" href="contact.html">Register interest</a><a class="btn btn-line" href="teams.html">Meanwhile: Mordsteam Teams</a></div>
</div>
<div class="teaser" aria-label="Preview of the first case">
<div class="mast"><span>CASE · FRIENDS 001</span><span>SATURDAY, 7:40 AM</span></div>
<h2>Last Round at the Chalet</h2>
<p>A weekend in the mountains, a rented chalet, a landlord with an embarrassing vlog. On Saturday morning he is found dead in the sauna – the door bolted from outside. Every one of you had a reason.</p>
</div>
</div></section>
<section class="section" style="background:var(--paper-2)"><div class="wrap stack">
<div class="eyebrow">Two ways to play</div>
<h2 class="h2">Together in the evening – or whenever each of you has time</h2>
<div class="modes">
<div class="mode"><h3>At the same time</h3><p>You sit together or meet on a video call. Everyone starts together, each investigates on their own phone, the clock runs the same for all.</p></div>
<div class="mode"><h3>Over the week</h3><p>No date needed: everyone plays within 3, 5 or 7 days, whenever they like. You only see who has already investigated – the reveal and the ranking come for everyone at the same time.</p></div>
</div>
</div></section>
<section class="facts" aria-label="Key facts"><div class="wrap">
<div><b>4–8 investigators</b><span>each on their own, on their own device</span></div>
<div><b>45 or 70 min</b><span>Mystery Night or Mystery Night Plus with an AI character</span></div>
<div><b>Your names</b><span>with harmless quirks from a list – nobody is embarrassed</span></div>
<div><b>No game master</b><span>everything runs automatically in the browser</span></div>
</div></section>
</main>''')

P["solo"] = dict(title="Mordsteam Solo – a murder mystery just for you (coming soon)",
 desc="Mordsteam Solo: a murder case for one person, about 30 minutes, right in the browser. Coming soon.",
 body='''<main id="top">
<section class="ph"><div class="wrap">
<div class="stack">
<span class="soonstamp">COMING SOON</span>
<h1><span>Mordsteam</span><br>Solo</h1>
<p class="lead">A case just for you. About thirty minutes, four suspects, one truth – the quick mystery in between.</p>
<div class="actions" style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-red" href="contact.html">Register interest</a><a class="btn btn-line" href="teams.html">Meanwhile: Mordsteam Teams</a></div>
</div>
<div class="teaser" aria-label="Preview of the first case">
<div class="mast"><span>CASE · SOLO 001</span><span>NIGHT TRAIN, 2:14 AM</span></div>
<h2>Night Train to Venice</h2>
<p>In the sleeping car, an art dealer lies dead in his compartment. You happen to be on board, and the conductor asks for your help. You have until the train pulls into Venice.</p>
</div>
</div></section>
<section class="facts" aria-label="Key facts"><div class="wrap">
<div><b>1 investigator</b><span>just you, on your own device</span></div>
<div><b>Approx. 30 min</b><span>the playing time is the train's remaining journey</span></div>
<div><b>Different every time</b><span>who did it is decided anew for each case</span></div>
<div><b>A taste of more</b><span>enjoyed it? Then bring Mordsteam to your team</span></div>
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

<fieldset class="step"><legend><span>1</span> Package and teams</legend>
<div class="pick" role="radiogroup" aria-label="Package">
<label class="pickcard"><input type="radio" name="paket" value="basis" checked><span><b>Basic</b><small>50 minutes<br>Act 1 with four questions</small><em>€89 per team</em></span></label>
<label class="pickcard"><input type="radio" name="paket" value="premium"><span><b>Premium</b><small>70 minutes<br>Act 1 + act 2 with two more, even trickier tasks</small><em>€119 per team</em></span></label>
<label class="pickcard"><input type="radio" name="paket" value="plus"><span><b>Premium Plus</b><small>90 minutes<br>Acts 1 &amp; 2 + finale with ARIA, the AI assistant on the intranet</small><em>€149 per team</em></span></label>
</div>
<p class="note" id="plusnote" hidden>ARIA is intended for participants aged 18 and over. If younger people play along, for example apprentices, please choose Basic or Premium – no AI runs there.</p>
<div class="two">
<div class="field"><label for="teams">Number of teams *</label>
<select id="teams" name="teams"></select><span class="hint">3 to 6 people per team is ideal. Each team needs one device.</span></div>
<div class="field"><span class="label">When do you play?</span><p class="whenbox">Whenever you like: right after paying or any time in the next 12 months. Each case can be started once.</p></div>
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
<div class="field"><span class="label">You are ordering as *</span>
<label class="check"><input type="radio" name="kunde" value="b2b"><span>Company, club or organisation</span></label>
<label class="check"><input type="radio" name="kunde" value="b2c"><span>Private individual</span></label>
<span class="hint">Private individuals have a statutory right of withdrawal (see <a href="terms.html#ruecktritt" target="_blank" rel="noopener">terms section 8</a>).</span></div>
</fieldset>

<fieldset class="step"><legend><span>6</span> Review and pay</legend>
<div class="summary" id="summary"></div>
<label class="check" id="zustimmungbox"><input type="checkbox" name="zustimmung"><span>Everyone we have entered by name knows about it and agrees to appear in the fictional case – including as victim or suspect. *</span></label>
<label class="check" id="ab18box" hidden><input type="checkbox" name="ab18"><span>All participants are at least 18 years old (required for ARIA in Premium Plus). *</span></label>
<label class="check ebcheck" id="ebbox" hidden><input type="checkbox" name="earlybird"><span><b>Early bird: <span class="ebp">40</span>% off.</b> I'd like the discount and am happy to give short feedback after the game and write a review. <a href="early-bird.html" target="_blank">Conditions</a></span></label>
<label class="check" id="nofbbox"><input type="checkbox" name="no_feedback"><span>The day after the game we'll send you a short feedback request by email. Tick here if you'd rather not receive it.</span></label>
<label class="check" id="sofortbox" hidden><input type="checkbox" name="sofort"><span>I expressly want you to set up my game round and provide the codes right after payment – we can still play whenever we like. I understand that as a private individual I thereby lose my right of withdrawal (at the latest once the round has been played). *</span></label>
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
<p>Mordsteam e.U., owner Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, Austria<br>Email: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a></p>
<h2>2. Visiting the website</h2>
<p>The website is delivered via Cloudflare (Cloudflare, Inc., USA, and affiliated companies). Technically necessary connection data such as IP address, time, page requested and browser identifier are processed to deliver the site securely and quickly (Art. 6(1)(f) GDPR). Cloudflare is certified under the EU-US Data Privacy Framework.</p>
<p>We use no cookies, no tracking and no analytics tools. Fonts are hosted locally; no data is sent to Google.</p>
<h2>3. Feedback after the game</h2>
<p>The day after the game ends, we send the person who ordered a single email with a link to a feedback form (Art. 6(1)(f) GDPR – we want to improve our cases; for early bird orders part of the discount conditions, Art. 6(1)(b) GDPR). You can opt out of this email when ordering. We store your answers without reference to the people in the case. We only publish a review if you expressly agree in the form – anonymously or under the name you provide for it. You can withdraw your consent at any time by email; we will then remove the review from the website.</p>
<h2>4. Order and payment</h2>
<p>For an order we process the chosen game with package or variant, the number of teams or players, the game language, your name, your email address, whether you order as a company or private individual, optionally phone and invoice company, and the details for personalising the case where the game provides for it (e.g. company or group name, place, rooms, names, title, role or quirks of the people who appear in the case, optionally your logo). The purpose is performance of the contract (Art. 6(1)(b) GDPR). If you choose a fictional cast, you don't provide any personal data for the personalisation.</p>
<p>Payment and invoicing are handled by Stripe (Stripe Payments Europe, Ltd., Dublin, Ireland). Stripe receives your payment and billing data for this and processes it under its own responsibility; we never see card details. If you withdraw from a contract, we process the order number, name, email address, time and any note to handle and document the withdrawal (Art. 6(1)(b) and (c) GDPR). We send the order confirmation and the feedback email via the email service Resend (Resend, Inc., USA; sent via servers in the EU, safeguarded by EU standard contractual clauses). We keep invoice and payment data for as long as tax retention obligations require (in Austria usually seven years).</p>
<h2>5. Game round</h2>
<p>For the game round we store the personalisation details, the names of the teams or players, times, answer attempts and hints used in a database at Cloudflare. On the players' devices only a login key is stored in the browser's local storage (no cookie, no tracking). 30 days after the game ends we delete the game round including teams, answer attempts, chat histories and logo – if a case is never played, 13 months after the order at the latest; the personal data of the personalisation is then removed from the order. To develop our cases further, we keep anonymous statistics (e.g. playing times, number of wrong attempts and hints) without names.</p>
<h2>6. AI characters in the game</h2>
<p>In some games or variants you can chat with an AI-controlled character (stated in the game description). What you write in the chat is sent together with the invented case data to our AI provider Anthropic so that the character can reply (Art. 6(1)(b) GDPR). We replace the real names from the personalisation (e.g. company, people, rooms) with placeholders before sending and only reinsert them in the reply – even if they are typed into the chat. The players' devices only connect to mordsteam.com, not directly to the AI provider. Anthropic processes the data as a processor, does not use it to train its models and deletes inputs and outputs after 30 days by default. The transfer to the USA is based on certification under the EU-US Data Privacy Framework or on EU standard contractual clauses.</p>
<p>Please don't enter real personal data in the chat – the AI character doesn't need it and only knows the world of the game. The number of messages per game round is limited. We store the chat history with the game round and delete it 30 days after the game ends. AI characters are labelled as AI; their answers may contain errors.</p>
<h2>7. Contact form and email</h2>
<p>If you write to us using the contact form or by email, we process your name, email address and message to answer your enquiry (Art. 6(1)(b) or (f) GDPR). Messages from the form are delivered to our mailbox via our email service Resend (Resend, Inc., USA; sent via servers in the EU) and stored there. To prevent abuse, we also store a hashed short value of your IP address with the time and delete it after 24 hours. Our emails are processed via Apple iCloud.</p>
<h2>8. Your rights</h2>
<p>You have the right to access, rectification, erasure, restriction of processing, data portability and objection. Write to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. You can also lodge a complaint with the Austrian Data Protection Authority: <a href="https://www.dsb.gv.at">www.dsb.gv.at</a>.</p>
<p>Last updated: September 2026</p>
</div></main>''')

P["imprint"] = dict(title="Imprint – Mordsteam", desc="Legal information about Mordsteam.",
 body='''<main class="page"><div class="wrap prose">
<h1>Imprint</h1>
<p>Information pursuant to § 5 of the Austrian E-Commerce Act, § 14 of the Austrian Commercial Code and § 63 of the Austrian Trade Act, and disclosure pursuant to § 25 of the Austrian Media Act. The <a href="/impressum.html" hreflang="de">German version</a> is legally binding.</p>
<h2>Company</h2>
<p><b>Mordsteam e.U.</b><br>Owner: Martin Kriegler<br>Legal form: registered sole proprietorship (eingetragenes Einzelunternehmen)</p>
<p>Sportplatzgasse 16<br>7152 Pamhagen<br>Austria</p>
<p>Email: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a><br>Contact form: <a href="contact.html">mordsteam.com/en/contact</a></p>
<h2>Company register</h2>
<p>Registered seat: Pamhagen<br>Company register number: <!-- FN -->to be added after registration<br>Register court: Landesgericht Eisenstadt</p>
<h2>Business purpose</h2>
<p>Development and online sale of digital murder-mystery and puzzle games for companies, clubs and private individuals.</p>
<h2>VAT</h2>
<p>Small business under § 6 (1) no. 27 of the Austrian VAT Act – no VAT is charged.<!-- UID --></p>
<h2>Trade law</h2>
<p><!-- GEWERBE -->Member of the Austrian Economic Chamber, Burgenland<br>Trade authority: Bezirkshauptmannschaft Neusiedl am See<br>Applicable law: Austrian Trade Act (Gewerbeordnung), available at <a href="https://www.ris.bka.gv.at">www.ris.bka.gv.at</a></p>
<h2>Media owner and general direction</h2>
<p>The media owner is Mordsteam e.U. (see above). This website provides information about Mordsteam's digital murder-mystery games and allows them to be ordered.</p>
<h2>Liability for links</h2>
<p>The operators of linked external pages are solely responsible for their content.</p>
<h2>Copyright</h2>
<p>Texts, cases, graphics and logo of this website are protected by copyright. Use is only permitted with our consent.</p>
</div></main>''')

P["terms"] = dict(title="Terms – Mordsteam", desc="Terms and conditions of Mordsteam.",
 body='''<main class="page"><div class="wrap prose">
<h1>Terms and conditions</h1>
<p class="small">Last updated: September 2026 · This is a translation for information. The <a href="/agb.html" hreflang="de">German version</a> is legally binding.</p>

<h2>1. Provider and scope</h2>
<p>The provider is Mordsteam e.U., owner Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, Austria, register court Landesgericht Eisenstadt, email: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a> (“we”). These terms apply to all orders via mordsteam.com, from businesses as well as consumers (“you”). Deviating conditions only apply if we agree to them in writing. The version valid at the time of your order applies.</p>

<h2>2. Our service</h2>
<p>We provide digital murder-mystery games that you play online in your browser – depending on the game, together in teams, as a group or on your own (“game round”). What exactly is included follows from the description of the chosen game when ordering: game, package or variant, number of teams or players, playing time and, where applicable, personalisation. After payment you receive access codes with which you open and start the game round. Nothing is delivered physically.</p>
<ul>
<li>The game round is playable for 12 months from purchase and can be started once. It then runs for the playing time or time window stated in the description and ends.</li>
<li>To play you need an internet-enabled device with an up-to-date browser. We are not responsible for web filters or blocks by your IT; we recommend opening mordsteam.com/spiel beforehand on the intended device.</li>
<li>All cases are entirely fictional. Names and details you enter are built into a fictional story; the accusations made in it are not meant seriously.</li>
</ul>

<h2>3. Conclusion of the contract</h2>
<p>The presentation of the packages on the website is not a binding offer. In the order form you choose package, teams and game language and enter the details for your case. Before submitting you see a summary with the total price and can check and correct all entries. By clicking “Order and pay” and paying via Stripe you make a binding offer. The contract is concluded as soon as payment has succeeded and we show you the codes or confirm them by email.</p>
<p>We send you the contract details (package, teams, price, game language) and the link to these terms with the confirmation email; you can view and save these terms on this page at any time. The contract language is German; this English version is for information.</p>

<h2>4. Prices, payment and discounts</h2>
<ul>
<li>All prices are final prices in euros per team. We are a small business; under § 6 (1) no. 27 of the Austrian VAT Act no VAT is charged.</li>
<li>Payment is made in advance via our payment provider Stripe (e.g. card, Apple Pay, Google Pay). You receive the invoice by email.</li>
<li>Discounts and vouchers (e.g. early bird) apply under the conditions published for them, cannot be combined and cannot be exchanged for cash. The <a href="early-bird.html">early bird conditions</a> form part of this contract if you choose the early bird discount.</li>
</ul>

<h2>5. Your details and obligations</h2>
<ul>
<li>You only enter names, roles and details of people who know about it and agree to appear in the fictional case – including as victim or suspect. You confirm this when ordering.</li>
<li>You only upload a logo if you may use it for your internal team event. It appears exclusively within your game round.</li>
<li>Details must not contain insulting, discriminatory or unlawful content. We may refuse such orders; in that case we refund any amount already paid.</li>
<li>You are responsible for the accuracy of your details and the consent of the people named.</li>
</ul>

<h2>6. AI characters in the game</h2>
<ul>
<li>Some games or variants include a character you talk to by chat and which is controlled by artificial intelligence (“AI character”). Which ones is stated in the game description. Variants with an AI character are intended only for participants aged 18 and over; you confirm this when ordering.</li>
<li>AI characters are labelled as AI, only know the invented world of the case and can make mistakes. Their answers are part of the game and not information or advice. Please don't enter real personal data in the chat.</li>
<li>The number of messages per game round is limited; the limit is shown in the game. If the AI is temporarily unavailable, you automatically receive all information needed to solve the case – the case remains solvable.</li>
</ul>

<h2>7. Rights of use</h2>
<p>Cases, texts, graphics and software are protected by copyright. You receive the simple, non-transferable right to play your game round for internal use. You may not publish, pass on or reuse case content, solutions or codes for other rounds. You are welcome to share the winners' certificate and photos of your event.</p>

<h2 id="ruecktritt">8. Right of withdrawal for consumers</h2>
<p>This right of withdrawal applies to consumers only. If you order as a company, club or for your professional activity, there is no statutory right of withdrawal.</p>
<p><b>Withdrawal period:</b> As a consumer you may withdraw from the contract within 14 days of its conclusion without giving reasons – unless the right of withdrawal has expired earlier.</p>
<p><b>Immediate start and expiry:</b> When ordering as a private individual, you expressly request that we set up your game round and provide the codes right after payment – you still play whenever you like – and confirm that you know you thereby lose your right of withdrawal. Our service is a game provided online. Insofar as it counts as digital content, the right of withdrawal expires when the codes are provided following our email confirmation (§ 18 (1) no. 11 FAGG). Insofar as it counts as a (digital) service, it expires once the game round has been fully performed, i.e. played and ended (§ 18 (1) no. 1 FAGG).</p>
<p><b>Withdrawal before the game ends:</b> If you withdraw before the right has expired, we refund all payments within 14 days using the original means of payment. If the game round has not been started, we refund the full price. If it has already been started, you pay a proportionate amount for the service provided up to the withdrawal (§ 16 FAGG), because you expressly requested the immediate start. It is based on the playing time elapsed up to the withdrawal in relation to the total playing time of the booked variant; setting up and personalising the game round has already been fully performed.</p>
<p><b>How to withdraw:</b> Use the “Withdraw from contract” function on our website or send us a clear statement, e.g. by email to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. To meet the deadline it is sufficient to send the statement before the period expires. You may use this model form, but you don't have to:</p>
<blockquote class="small">To Mordsteam e.U., Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, Austria, office@mordsteam.com: I/we hereby withdraw from the contract concluded by me/us for the following service: … · Ordered on: … · Order number: … · Name: … · Address: … · Date: …</blockquote>

<h2>9. Warranty and faults</h2>
<p>The statutory warranty applies, for consumers under the Austrian Consumer Warranty Act (VGG). If something doesn't work as described, please let us know as soon as possible at <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. We will fix the fault or provide a new game round; if that is not possible, we refund the price in full or in part.</p>

<h2>10. Liability</h2>
<p>We are liable without limitation for intent and gross negligence and for personal injury. We are not liable to businesses for slight negligence; towards consumers, liability under the mandatory provisions of the Austrian Consumer Protection Act remains unaffected. Towards businesses our liability is also limited to the order value, as far as legally permitted. We are not liable for outages beyond our control (such as problems with your internet connection, your IT or third-party providers), but we're happy to help find a solution.</p>

<h2>11. Storage and deletion</h2>
<p>30 days after the end of the game round we delete the round including teams, personalisation and logo. A game round is playable for 12 months from purchase; after that we delete a round that has not been started, including the personal data entered. Companies receive no refund. Consumers may request, even after this period, that we create the game round again (you then enter the details again) as long as we offer the case; if we no longer offer it, we refund the price paid. Details are in the <a href="privacy.html">privacy policy</a>.</p>

<h2>12. Complaints and dispute resolution</h2>
<p>Please send complaints to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>; we'll get back to you as soon as we can. We are not obliged to take part in proceedings before a consumer arbitration body. In Austria, the <a href="https://www.ombudsstelle.at" target="_blank" rel="noopener">Internet Ombudsstelle</a> is responsible for disputes from online transactions.</p>

<h2>13. Applicable law and jurisdiction</h2>
<p>Austrian law applies, excluding the UN Convention on Contracts for the International Sale of Goods and conflict-of-law rules. Consumers retain the protection of mandatory provisions of the country in which they have their habitual residence. The place of jurisdiction for businesses is the court with subject-matter jurisdiction for 7152 Pamhagen.</p>

<h2>14. Final provisions</h2>
<p>If any provision of these terms is invalid, the rest remains valid. Towards businesses, the invalid provision is replaced by a rule that comes closest to its purpose.</p>
</div></main>''')

P["early-bird"] = dict(title="Early bird – Mordsteam", desc="Early bird: 40% off your first Mordsteam game – the conditions.",
 body='''<main class="page"><div class="wrap prose">
<div class="eyebrow">Early bird</div>
<h1 class="h1-page">40% off your first Teams or Friends game</h1>
<p class="lead">Mordsteam has just launched. Help us make our cases even better – and play your first case at 40% off.</p>
<h2>How it works</h2>
<ul>
<li>When ordering, tick the <b>early bird</b> box in the last step. The discount is deducted automatically at checkout – no code needed.</li>
<li>Valid for Mordsteam Teams – all packages, any number of teams – and for Mordsteam Friends once it is available. Mordsteam Solo is excluded.</li>
</ul>
<h2>What we ask in return</h2>
<ul>
<li>The day after your game we'll send you a short email with a feedback form. You give us honest feedback – it takes about 5 minutes.</li>
<li>You write a short review. Whether and under which name we show it on mordsteam.com is up to you.</li>
</ul>
<h2>The fine print</h2>
<ul>
<li>One discounted order per company or group, for your first game.</li>
<li>Cannot be combined with other vouchers.</li>
<li>Valid while the offer runs. We'll announce the end date here and in the banner in advance. Orders placed before then keep the discount, even if you play later.</li>
</ul>
<p><a class="btn btn-red" href="order.html">Order a Teams case</a></p>
</div></main>''')

P["feedback"] = dict(title="Feedback – Mordsteam", robots="noindex, nofollow", desc="Feedback on your Mordsteam case.",
 scripts='<script src="/assets/feedback.js"></script>',
 body='''<main class="page"><div class="wrap">
<div class="eyebrow">Feedback · Case 001</div>
<h1 class="h1-page">How was your case?</h1>
<p class="lead" id="fbintro"></p>
<div id="fb"><p class="muted">Loading …</p></div>
</div></main>''')

P["contact"] = dict(title="Contact – Mordsteam", desc="How to reach Mordsteam.", scripts='<script src="/assets/kontakt.js"></script>',
 body='''<main class="page"><div class="wrap prose">
<div class="eyebrow">Contact</div>
<h1>Get in touch</h1>
<div class="contactcard">
<p class="cc-firm">Mordsteam e.U.</p>
<p>Martin Kriegler</p>
<p>Sportplatzgasse 16, 7152 Pamhagen, Austria</p>
<p><a class="cc-mail" href="mailto:office@mordsteam.com">office@mordsteam.com</a></p>
</div>
<p>Questions about a case, an order or your game round? Write to us – using the form or by email. We'll get back to you as soon as we can.</p>
<form id="kf" class="form" novalidate>
<div class="two">
<div class="field"><label for="kf-name">Name</label><input id="kf-name" name="name" autocomplete="name" maxlength="100" required></div>
<div class="field"><label for="kf-email">Email</label><input id="kf-email" name="email" type="email" autocomplete="email" maxlength="200" required></div>
</div>
<div class="field"><label for="kf-msg">Message</label><textarea id="kf-msg" name="message" rows="6" maxlength="5000" required></textarea></div>
<div class="hp" aria-hidden="true"><label for="kf-web">Website</label><input id="kf-web" name="website" tabindex="-1" autocomplete="off"></div>
<p class="small">We only use your details to answer your enquiry. More in our <a href="privacy.html">privacy policy</a>.</p>
<p class="formerr" id="kferr" role="alert" hidden></p>
<div><button class="btn btn-red" type="submit">Send message</button></div>
</form>
<p class="small" style="margin-top:20px">You'll find all company details in the <a href="imprint.html">imprint</a>.</p>
</div></main>''')

P["withdraw"] = dict(title="Withdraw from contract – Mordsteam", desc="Withdraw from a contract with Mordsteam (private individuals).", scripts='<script src="/assets/widerruf.js"></script>',
 body='''<main class="page"><div class="wrap prose">
<div class="eyebrow">Withdrawal</div>
<h1>Withdraw from contract</h1>
<p>As a <b>private individual</b> you can withdraw from your contract with us here as long as the right of withdrawal exists: within 14 days of ordering and before the game round has been played and ended. Orders placed as a company, club or organisation have no statutory right of withdrawal. Details are in our <a href="terms.html#ruecktritt">terms, section 8</a>.</p>
<p><button class="btn btn-red" type="button" id="wr-start">Withdraw from contract</button></p>
<form id="wf" class="form" novalidate hidden>
<div class="two">
<div class="field"><label for="wf-nr">Order number</label><input id="wf-nr" name="nr" maxlength="12" autocomplete="off" required><span class="hint">8 characters, shown in the confirmation email.</span></div>
<div class="field"><label for="wf-email">Email address used for the order</label><input id="wf-email" name="email" type="email" autocomplete="email" maxlength="200" required></div>
</div>
<div class="field"><label for="wf-name">Name</label><input id="wf-name" name="name" autocomplete="name" maxlength="120" required></div>
<div class="field"><label for="wf-grund">Note <span class="opt">optional</span></label><textarea id="wf-grund" name="grund" rows="3" maxlength="1000"></textarea><span class="hint">You don't have to give a reason.</span></div>
<p class="formerr" id="wferr" role="alert" hidden></p>
<div><button class="btn btn-red" type="submit">Confirm withdrawal</button></div>
<p class="small">By clicking “Confirm withdrawal” you send us your declaration of withdrawal for the order stated. You will immediately receive a confirmation by email with its content, date and time.</p>
</form>
</div></main>''')

for name, p in P.items():
    out = page(name, p["title"], p["desc"], p["body"], p.get("robots"), p.get("scripts", ""), p.get("home", False), p.get("promo", False))
    with open(os.path.join(ROOT, "en", name + ".html"), "w") as f:
        f.write(out)
print("ok", len(P))
