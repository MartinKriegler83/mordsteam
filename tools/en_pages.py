# Erzeugt die englischen Seiten unter site/en/ (Kopf, Menü und Fußzeile gemeinsam).
# Aufruf: python3 tools/en_pages.py  – danach site/en/*.html committen.
import os, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zebra import finish
ROOT = os.path.join(os.path.dirname(__file__), "..", "site")
MAP = {"index": "index", "teams": "teams", "friends": "friends", "solo": "solo", "order": "bestellen", "ordered": "bestellt", "privacy": "datenschutz", "imprint": "impressum", "terms": "agb", "contact": "kontakt", "early-bird": "earlybird", "feedback": "feedback", "withdraw": "widerruf", "solo-buy": "solo-kaufen", "friends-buy": "friends-kaufen", "newsletter": "newsletter"}
LOGO = '<svg width="30" height="30" viewBox="0 0 34 34" fill="none" stroke="#15171C" stroke-width="3" aria-hidden="true"><circle cx="14" cy="14" r="10"/><line x1="21.5" y1="21.5" x2="31" y2="31" stroke-linecap="round"/><circle cx="14" cy="14" r="3.5" fill="#B3261E" stroke="none"/></svg>'



EBBAR = """<div class="promo" id="ebbar"><div class="wrap"><span class="tag">EARLY BIRD</span><span><span class="ebp">25</span>% off your first Teams or Friends game<span class="star">*</span><span class="ebbis"> – only until 30 November</span></span><a href="early-bird.html">*Conditions</a></div></div>"""

def page(name, title, desc, body, robots=None, scripts="", home=False, promo=False):
    de = MAP[name]
    # „Play now“: auf Teams/Solo zu den eigenen Optionen, sonst zur Spielauswahl auf der Startseite
    play = {"index": "#games", "teams": "#packages", "solo": "#price", "solo-buy": "#solo", "friends": "#price", "friends-buy": "#friends"}.get(name, "index.html#games")
    cur = lambda k: ' aria-current="page"' if k == name else ''
    nav = f'''<a href="teams.html"{cur("teams")}>Teams</a>
<a href="friends.html"{cur("friends")}>Friends</a>
<a href="solo.html"{cur("solo")}>Solo</a>'''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{html.escape(desc)}">
{f'<meta name="robots" content="{robots}">' if robots else ''}
{f'<link rel="canonical" href="https://mordsteam.com/en/{"" if name == "index" else name + ".html"}">' + chr(10) if name in ("index", "teams", "friends", "solo") else ''}<link rel="alternate" hreflang="de" href="https://mordsteam.com/{'' if de == 'index' else de + '.html'}">
<link rel="alternate" hreflang="en" href="https://mordsteam.com/en/{'' if name == 'index' else name + '.html'}">
<link rel="alternate" hreflang="x-default" href="https://mordsteam.com/{'' if de == 'index' else de + '.html'}">
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
<a class="btn btn-ink" href="{play}">Play now</a>
</nav>
<details class="menu">
<summary aria-label="Open menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15171C" stroke-width="2.2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></summary>
<nav aria-label="Menu">
<a href="index.html">Home</a>
{nav}
<a href="/{'' if de == 'index' else de + '.html'}" hreflang="de" lang="de">Deutsch</a>
<a class="btn btn-red" href="{play}">Play now</a>
</nav>
</details>
</div></header>
{body}
{scripts}
<footer class="footer"><div class="wrap">
<span class="brand"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span></span>
<nav aria-label="Legal"><a href="newsletter.html">Newsletter</a><a href="imprint.html">Imprint</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="contact.html">Contact</a><a href="withdraw.html">Withdraw from contract</a></nav>
<nav class="social" aria-label="Social media"><a href="https://www.facebook.com/profile.php?id=61595086617436" rel="noopener" target="_blank">Facebook</a><a href="https://www.instagram.com/_mordsteam_/" rel="noopener" target="_blank">Instagram</a><a href="https://www.tiktok.com/@mordsteam" rel="noopener" target="_blank">TikTok</a><a href="https://www.youtube.com/@mordsteam-mk" rel="noopener" target="_blank">YouTube</a></nav>
<span>© 2026 Mordsteam e.U.</span>
</div></footer>
<script src="/assets/menu.js" defer></script>
</body>
</html>
'''

P = {}
P["teams"] = dict(title="Mordsteam Teams – the personalised murder-mystery team event for companies and clubs", promo=True, scripts='<script src="/assets/aktion.js"></script>',
 desc="A murder case starring your team – for companies and clubs. A 50- to 90-minute countdown, competing investigator teams, no game master needed.",
 body='''<nav class="subnav" aria-label="Mordsteam Teams"><div class="wrap">
<b><span>Mordsteam</span> Teams</b>
<a href="#how">How it works</a><a href="#case">Case 001</a><a href="#case002">Case 002</a><a href="#packages">Packages</a><a href="#faq">FAQ</a>
<a class="btn btn-red" href="order.html">Order</a>
</div></nav>
<main id="top">
<section class="hero"><div class="wrap hero-grid">
<div class="stack">
<div class="eyebrow">Mordsteam Teams · for companies &amp; clubs</div>
<h1>Which one of you did it?</h1>
<p class="lead">The murder case in which your team plays the lead – with your names, your rooms and your in-jokes. One team against the clock or several teams against each other, a 50- to 90-minute countdown, no game master needed.</p>
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
<section class="tvid-sec" aria-label="Teaser video"><div class="wrap">
<div class="tvid" data-video="teams-en"><video muted loop playsinline preload="none" aria-label="Teaser video Teams"></video><button class="tvid-sound" type="button" aria-pressed="false" data-on="Sound on" data-off="Sound off">Sound on</button></div>
</div></section>
<script src="/assets/teaser.js?v=2" defer></script>

<section class="facts" aria-label="Key facts"><div class="wrap">
<div><b><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>50 to 90 min</b><span>Countdown – Basic with one act, Premium with a second act, Premium Plus with an AI finale</span></div>
<div><b>3–6 per team</b><span>one team against the clock or as many as you like against each other</span></div>
<div><b>Self-guided</b><span>instructions and a case desk instead of a host</span></div>
<div><b>Play right away</b><span>straight after buying or whenever you like – in German or English</span></div>
</div></section>

<section id="whoisitfor" class="section"><div class="wrap">
<div class="stack" style="margin-bottom:28px"><div class="eyebrow">Who it's for</div><h2 class="h2">Made for every team with secrets</h2></div>
<div class="audience two">
<div class="aud"><span class="status live">CASE 001 · BOOK NOW</span><h3>Companies</h3><ul class="list"><li><a class="inlink" href="team-building-ideas.html">Team building and offsites</a></li><li>Onboarding new teams</li><li><a class="inlink" href="virtual-team-building.html">Ideal for virtual teams</a></li></ul></div>
<div class="aud"><span class="status live">CASE 002 · BOOK NOW</span><h3>Clubs</h3><ul class="list"><li><a class="inlink" href="club-night-ideas.html">Club nights and anniversaries</a></li><li>Team building and fun activities</li><li>Sports, fire brigade, music, theatre and culture</li></ul></div>
</div>
</div></section>

<section id="how" class="section"><div class="wrap stack">
<div class="eyebrow">How it works</div>
<h2 class="h2">Three steps from form to crime scene</h2>
<div class="steps">
<div class="step"><span class="num">1</span><div><h3>Enter your teams</h3><p>Choose your case (company or club), then the victim – your boss or your club's chair –, who should receive the evidence, five suspects from your group (Premium and Premium Plus: six), plus places and teams. Who did it is decided at random – not even the organiser knows in advance.</p></div></div>
<div class="step"><span class="num">2</span><div><h3>Get your file</h3><p>Your personal case file arrives digitally on laptop, phone or tablet. Plus your own case website – company intranet or club website, with your logo – and the case desk for every team.</p></div></div>
<div class="step"><span class="num">3</span><div><h3>Investigate and solve the case</h3><p>Will you find all the crucial clues? Enter everything correctly at the case desk and you've solved the case. At the end: an award ceremony, the big reveal and certificates to download.</p></div></div>
</div>
</div></section>

<section id="case" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Case 001 · The Red Folder · for companies</div>
<h2 class="h2">Your boss survived. Barely. And one of you did it.</h2>
<p class="lead">After the strategy evening, your boss is found poisoned. A red folder is missing – with evidence that someone in the company is diverting money. At 12:00 noon it was due with the top boss – CEO, group chair or board. By then you need to know who did it. You search your own company intranet, check access logs, taxi receipts and video calls – and soon realise that almost everyone had a motive. Including the person next to you.</p>
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
<div class="actions case-buy"><a class="case-more" href="#packages">Compare packages →</a><a class="btn btn-red" href="order.html?fall=001">Order case 001 – from €89 per team</a></div>
</div></section>

<section id="case002" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Case 002 · Cold Cash · for clubs</div>
<h2 class="h2">After the fête, your chair is in the fridge trailer. And the cash box is gone.</h2>
<p class="lead">Sunday, just before midnight: your club's fête is over and the helpers are clearing up. Your chair – or president, chief, captain – is found locked in the refrigerated trailer, badly chilled but alive. The cash box with the cash book has vanished. At 7:00 the brewery collects the empties, and in the evening the annual general meeting wants the treasurer's report. You check the rota, the wristbands and the photos from the fête, read the trailer's temperature log, add up the tally sheet against the token book and search the empties for the cash box. One of you did it.</p>
<p><b>Everything happens in your club:</b></p>
<div class="objects"><span>your chair as the victim</span><span>your members as suspects</span><span>your fête and your club website</span></div>
</div>
<div class="clues" aria-label="Examples from the case file">
<div class="clue"><small>TEMPERATURE LOGGER</small><span>When did the door close?<br>??:?? · door closed · set point ?? °C</span></div>
<div class="clue"><small>SHIFT ROTA</small><span>What colour is your wristband?<br>bar · barbecue · token till · clear-up</span></div>
<div class="clue dark"><small>CASE DESK</small><div class="codebox" aria-label="Four-digit solution code"><i>?</i><i>?</i><i>?</i><i>?</i></div><span class="hint">Enter your answers, solve the case, make the podium.</span></div>
<div class="clue"><small>HONORARY CHAIR · AI INTERROGATION</small><span>Premium Plus only:<br>“Everything used to be simpler …”</span></div>
</div>
<ul class="list case-points">
<li>Act 1: Who? When did the door close? How much money is missing? Where is the cash box?</li>
<li>Premium: act 2 – who helped at the token till, and where is the money from previous years?</li>
<li>Premium Plus: finale with an AI interrogation of your honorary chair – who knows everything about the club but loves to ramble</li>
<li>Fits sports, fire brigade, music, theatre and culture clubs: trophies, music and raffle follow your club</li>
<li>The culprit is always drawn at random from your group – different every round, nobody knows in advance</li>
<li>Completely different puzzles from case 001 – play both and you won't recognise a single one</li>
</ul>
<div class="actions case-buy"><a class="case-more" href="#packages">Compare packages →</a><a class="btn btn-red" href="order.html?fall=002">Order case 002 – from €89 per team</a></div>
</div></section>

<section id="packages" class="section"><div class="wrap stack">
<div class="eyebrow">Packages</div>
<h2 class="h2">Three packages, all digital</h2>
<p class="lead">One price per team – whether three or six people investigate in it. You enter all the details before paying, then everything runs automatically.</p>
<div class="pack-grid three">
<div class="pack">
<span class="badge">GETTING STARTED</span>
<h3>Basic</h3><p class="sub"><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>50-minute countdown · one act</p>
<p class="price">€89 per team</p><p class="per">around €18 per person in teams of 5</p>
<ul class="list"><li>Your personal case – with your names, your rooms and your logo</li><li>Digital case file for every team</li><li>Your own case intranet with hidden clues</li><li>One act with four questions</li><li>Digital case desk: automatic hints, award ceremony and solution</li><li>Every team that solves the case can earn bonus minutes for the ranking in the bonus investigation</li><li>Winners' certificates to download</li></ul>
<a class="btn btn-line" href="order.html?paket=basis">Order Basic<span class="bp"><span class="bd"> – </span>€89</span></a>
</div>
<div class="pack">
<span class="badge">THE CLASSIC</span>
<h3>Premium</h3><p class="sub"><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>70-minute countdown · two acts</p>
<p class="price">€119 per team</p><p class="per">around €24 per person in teams of 5</p>
<ul class="list"><li>Everything in Basic</li><li>Act 2 with new evidence and two more, even trickier questions</li><li>Six suspects instead of five</li><li>Every team that solves the case can earn bonus minutes for the ranking in the bonus investigation</li></ul>
<a class="btn btn-line" href="order.html?paket=premium">Order Premium<span class="bp"><span class="bd"> – </span>€119</span></a>
</div>
<div class="pack featured">
<span class="badge">THE FULL EXPERIENCE</span>
<h3>Premium Plus</h3><p class="sub"><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>90-minute countdown · two acts and an AI finale</p>
<p class="price">€149 per team</p><p class="per">around €30 per person in teams of 5</p>
<ul class="list"><li>Everything in Premium</li><li>Every team that solves the case can earn bonus minutes for the ranking in the bonus investigation</li><li>AI finale: case 001 with ARIA, the AI assistant on the intranet (PIN and cash count), case 002 with an AI interrogation of the honorary chair (code and start year)</li><li>A surprise for teams that finish before minute 70 – an AI interrogation as a special assignment, with the “Special investigators” award</li><li>For participants aged 18 and over</li></ul>
<a class="btn btn-red" href="order.html?paket=plus">Order Premium Plus<span class="bp"><span class="bd"> – </span>€149</span></a>
</div>
</div>
<div class="devicebox">
<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M1 17h16"/><rect x="17" y="8" width="6" height="12" rx="1.2"/><path d="M19.5 17.5h1"/></svg>
<p><b>Playable on laptop, phone or tablet.</b> Each team plays on one main device and can connect up to 5 more devices via QR code to follow along – so the team can split up the evidence.</p>
</div>
<p class="example">Example for 15 people in 3 teams: Basic €267, Premium €357, Premium Plus €447. All prices are final prices. 4 to 6 people per team is ideal, 3 to 6 is possible.</p>
</div></section>

<section class="section duo"><div class="wrap">
<div class="privacy"><h2>Privacy, taken seriously</h2>
<ul class="list"><li>Only names and roles, no emails or photos of your players</li><li>Case website and case desk protected and hidden from search engines</li><li>All data automatically deleted 30 days after the game</li><li>All suspects and the victim agree beforehand – you confirm this when ordering</li><li>Your logo only with confirmed permission – it appears only on your case website</li></ul>
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
<details><summary>Which case suits us?</summary><p>Case 001 “The Red Folder” is set in your company – with your boss as the victim, ideal for team building. Case 002 “Cold Cash” is set in your club – after the club fête, with your chair as the victim. Process, packages and prices are the same, the puzzles completely different. So you can play both, one after the other.</p></details>
<details><summary>Who is the culprit?</summary><p>Always someone from your group – drawn at random, new every round. Not even the organiser knows in advance, and neither does the culprit. Everyone who appears in the case should have agreed beforehand.</p></details>
<details><summary>Can we play with just one team?</summary><p>Yes. Then you play against the clock: the ranking and certificate show your time including penalty minutes. With several teams it becomes a contest – whoever solves the case first wins.</p></details>
<details><summary>How many people fit in a team?</summary><p>4 to 6 is ideal, 3 to 6 is possible. Each team enters its answers on one main device and can connect up to 5 more phones or laptops via QR code to follow along – so you can split up the evidence. More of you? Then split up: 12 people play best as 3 teams of 4 – with at least 4 per team everyone stays involved, and several teams make the contest more exciting. The order form works out the right number of teams for you.</p></details>
<details><summary>Do we need a game master?</summary><p>No person needed. Instructions and the digital case desk guide you through the case: start, automatic hints, answer entry and award ceremony. One person from your group just starts the clock – and can still play along.</p></details>
<details><summary>Is this like a murder mystery dinner?</summary><p>Similar, just without actors or a set menu – your team does the investigating. More: <a href="murder-mystery-team-building.html">Murder mystery team building</a>.</p></details>
<details><summary>Can we pause?</summary><p>No. From the start the clock runs for all teams at the same time and without a pause – that keeps the contest fair. So plan the playing time in one go.</p></details>
<details><summary>How much time do you have?</summary><p>The countdown is your maximum time, not a fixed playing time: Basic 50 minutes (one act with four questions), Premium 70 minutes (after act 1, the case desk unlocks a second act), Premium Plus 90 minutes (with an AI finale). How fast you finish depends on how experienced you are at solving puzzles. We played every case in many test runs and set the time so that it can be solved within it. If the countdown runs out, you keep playing until you as organisers end the round – the clock then shows in red how far over you are. If a team gets stuck, HQ sends hints automatically.</p></details>
<details><summary>Can we play in English?</summary><p>Yes. You choose the game language (German or English) when you order – independently of the language of this website. The whole case, the case website, the case desk and the AI in the finale then speak that language.</p></details>
<details><summary>Which countries does the case work in?</summary><p>The case is localised for your country: police, currency, number plates, bank details, phone numbers and cities fit – for the countries of Europe as well as the USA, Canada, Australia and New Zealand. For all other countries we set it in a fictional place.</p></details>
<details><summary>What do we need to play?</summary><p>One laptop, tablet or smartphone with internet per team – for the case file, case website, answer entry and ranking. Up to 5 more devices per team can follow along via QR code. That's all you need.</p></details>
<details><summary>Can we use AI or Google?</summary><p>Please don't – with one exception: the AI in the game (Premium Plus only) – ARIA in case 001, the honorary chair in case 002 – helps you in the grand finale. Otherwise the case is built to be solved with brainpower – outside AI and search engines only spoil the fun. A matter of honour among detectives.</p></details>
<details><summary>How gruesome is it?</summary><p>Not at all. A crime story with a wink – no blood, no shock effects, and nobody is shown up.</p></details>
<details><summary>Do we have to enter real names?</summary><p>No. But it's most fun with your real colleagues and rooms – you can also choose a fictional company or club with invented characters.</p></details>
<details><summary>What age is it for?</summary><p>Our cases are written for adults – with a poisoning or a fridge trailer, fraud and dark humour. Premium Plus with AI (ARIA or the honorary chair's interrogation) is intended for participants aged 18 and over. If younger people play along, for example apprentices or the club's youth section, choose Basic or Premium: no AI runs there.</p></details>
<details><summary>Our IT blocks AI tools – will the AI finale still work?</summary><p>Usually, yes. Your devices only connect to mordsteam.com; the AI runs via our server and only knows the invented world of the case. We don't send real names from your personalisation to the AI provider but replace them with placeholders first. If your policies prohibit AI applications altogether, check briefly with your IT or choose Premium without AI. Tip for all packages: open mordsteam.com/spiel on a company device beforehand – then you know no web filter will get in the way.</p></details>
<details><summary>How quickly do we get the case?</summary><p>Immediately, in all three packages. After paying you see your game code right on the screen and can start straight away – or any time in the next 12 months. Each case can be started once. Everything is digital, nothing is shipped.</p></details>
<details><summary>Can we use a voucher?</summary><p>Yes: enter the €5 voucher from Mordsteam Solo in the payment step. One voucher per order, not combinable with the early bird discount.</p></details>
<details><summary>Do we get an invoice?</summary><p>Yes, automatically by email. If you order as a company, club or organisation, enter the company name, billing country and – if you have one – VAT ID in the order form, and the address when paying.</p></details>
</div>
</div></section>

<section class="cta"><div class="wrap">
<h2>One of you has something to hide.</h2>
<p>Find out who.</p>
<a class="btn btn-ink" href="order.html">Order a case</a>
</div></section>
</main>''')

P["index"] = dict(title="Mordsteam – Today, you’re the detectives", home=True, scripts='<script src="/assets/aktion.js"></script>',
 desc="Personalised murder-mystery games to play: as a team event for companies and clubs, with friends or on your own. In the browser, no game master.",
 body='''<main id="top">
<section class="bh" aria-labelledby="bh-t"><div class="wrap">
<svg class="bh-lupe" viewBox="0 0 34 34" aria-hidden="true"><g fill="none" stroke="#F3EFE6" stroke-width="3"><circle cx="14" cy="14" r="9"/><line x1="20.5" y1="20.5" x2="29" y2="29" stroke-linecap="round"/></g><circle class="dot" cx="14" cy="14" r="3.5" fill="#E0463C"/></svg>
<h1 id="bh-t"><span class="r">MORDS</span>TEAM</h1>
<p class="kicker">The online murder-mystery game<br class="mbr"> starring you</p>
<p class="claim">Today, you’re the detectives.</p>
<p class="sub">Mordsteam is a murder-mystery game in your browser: you get a case file with your own names in it, hunt for clues, question suspects and unmask the culprit. As a team event at work, as a mystery night with friends or on your own – on phone or laptop, nothing to download.</p>
<div class="actions"><a class="btn btn-red" href="#games">Choose a case</a><a class="btn btn-ghost" href="teams.html">For companies &amp; clubs</a></div>
</div>
<span class="evm e1" aria-hidden="true">1</span><span class="evm e2" aria-hidden="true">2</span><span class="evm e3" aria-hidden="true">3</span>
<div class="tape" aria-hidden="true"><span>CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · CRIME SCENE · DO NOT CROSS · MORDSTEAM · </span></div>
</section>

<section id="games" class="section"><div class="wrap">
<div class="stack"><div class="eyebrow">Three ways to the crime scene</div><h2 class="h2">Which case suits you?</h2></div>
<div class="games">
<article class="game live"><span class="tab">TEAMS</span><span class="smark ok">PLAY<br>NOW</span>
<h3 class="gname"><span class="wm-r">MORDS</span>TEAM<span class="gp">TEAMS</span></h3>
<p class="purpose">Solve it together</p>
<p class="for">The murder-mystery team event: you investigate as a team, together. Several teams can also compete against each other.</p>
<p>Two cases: at work your boss is poisoned and the evidence is gone; at your club, your chair ends up in the fridge trailer and the cash box is missing. One of you did it – with your names and your places.</p>
<p class="meta">3–6 PLAYERS PER TEAM · ANY NUMBER OF TEAMS · 50–90 MIN · FROM €89 PER TEAM</p>
<a class="btn btn-red" href="teams.html">Go to Mordsteam Teams</a>
</article>
<article class="game live"><span class="tab">FRIENDS</span><span class="smark ok">PLAY<br>NOW</span>
<h3 class="gname"><span class="wm-r">MORDS</span>TEAM<span class="gp">FRIENDS</span></h3>
<p class="purpose">Everyone for themselves</p>
<p class="for">The mystery night for friends: everyone investigates on their own phone – who unmasks the culprit first?</p>
<p>You are the suspects – with your real names and your little quirks. Everyone plays at the same time, or whenever they have time this week.</p>
<p class="meta">4–8 INVESTIGATORS · EVERYONE ON THEIR OWN DEVICE · 50–75 MIN · FROM €29 PER GROUP</p>
<p class="small" style="margin:0 0 10px">Also a great gift: after buying you get a gift card to print or save as PDF.</p>
<a class="btn btn-red" href="friends.html">Go to Mordsteam Friends</a>
</article>
<article class="game live"><span class="tab">SOLO</span><span class="smark ok">PLAY<br>NOW</span>
<h3 class="gname"><span class="wm-r">MORDS</span>TEAM<span class="gp">SOLO</span></h3>
<p class="purpose">On your own</p>
<p class="for">A case just for you.</p>
<p>One countdown, five suspects, one truth. The quick mystery in between – and the perfect taste of a team game.</p>
<p class="meta">1 INVESTIGATOR · 35–45 MIN · ANY TIME · FROM €8.90</p>
<p class="small" style="margin:0 0 10px">Also a great gift: after buying you get a gift card to print or save as PDF.</p>
<a class="btn btn-red" href="solo.html">Go to Mordsteam Solo</a>
</article>
</div>
</div></section>

<section id="wahl" class="section"><div class="wrap">
<div class="choose" aria-labelledby="choose-t">
<h3 id="choose-t" class="choose-h">Teams or Friends?</h3>
<div class="choose-grid">
<div class="pcard"><span class="tab">TEAMS</span>
<p class="pcard-h">Choose <b>Teams</b> if …</p>
<ul>
<li>you want to solve it <b>together</b> and grow as a team</li>
<li>you have a <b>shared date</b> – on site or on a video call</li>
<li>you're a bigger group: from 3 people, larger groups play in <b>several teams</b></li>
<li>it's for a <b>department, offsite or club</b></li>
</ul>
<a class="pcard-link" href="teams.html">More about Teams →</a>
</div>
<div class="pcard"><span class="tab">FRIENDS</span>
<p class="pcard-h">Choose <b>Friends</b> if …</p>
<ul>
<li>it should be <b>everyone against everyone</b> – who catches the culprit first?</li>
<li>not everyone is free at the same time – everyone plays <b>whenever they like</b>, all week</li>
<li>you're <b>4 to 8</b> people and everyone has their own phone</li>
<li>it's for <b>friends, family</b> or colleagues in private</li>
</ul>
<a class="pcard-link" href="friends.html">More about Friends →</a>
</div>
</div>
</div>
</div></section>


<section class="facts four" aria-label="What makes Mordsteam"><div class="wrap">
<div><b>Personalised</b><span>your names, your rooms, your in-jokes – or a fictional cast</span></div>
<div><b>Digital game guidance</b><span>instructions and a digital case desk guide you through</span></div>
<div><b>No acting</b><span>the culprit is a role that randomly carries one of your names – nobody has to lie</span></div>
<div><b>Play right away</b><span>on laptop, phone or tablet – in German or English</span></div>
</div></section>

<section id="bewertungen" class="section" data-ort="home" hidden><div class="wrap stack">
<div class="eyebrow">Reviews</div>
<h2 class="h2">What investigator teams say</h2>
<div class="reviews" id="reviews"></div>
</div></section>

<section class="cta"><div class="wrap">
<h2>One of you has something to hide.</h2>
<p>Find out who.</p>
<a class="btn btn-ink" href="#games">Choose a case</a>
<p class="cta-nl"><a href="newsletter.html">Be the first to hear about new cases – sign up for the <b>newsletter</b></a></p>
</div></section>
<section class="sig" aria-label="Mordsteam"><div class="wrap">
<div class="sig-row"><svg class="sig-lupe" viewBox="3 3 28 28" aria-hidden="true"><g fill="none" stroke="#15171C" stroke-width="3"><circle cx="14" cy="14" r="9"/><line x1="20.5" y1="20.5" x2="29" y2="29" stroke-linecap="round"/></g><circle class="dot" cx="14" cy="14" r="3.5" fill="#B3261E"/></svg><p class="sig-wm"><span class="r">MORDS</span>TEAM</p></div>
<p class="sig-frage">Can you crack the case?</p>
</div></section>
</main>''')

P["friends"] = dict(title="Mordsteam Friends – the murder-mystery night where one of you did it", promo=True, scripts='<script src="/assets/aktion.js"></script>',
 desc="Mordsteam Friends: the murder-mystery night for 4–8 friends. You are the suspects, everyone investigates on their own phone – together or over the week. From €29.",
 body='''<nav class="subnav" aria-label="Mordsteam Friends"><div class="wrap">
<b><span>Mordsteam</span> Friends</b>
<a href="#how">How it works</a><a href="#case">Friends 001</a><a href="#price">Price</a><a href="#faq">FAQ</a>
<a class="btn btn-red" href="friends-buy.html">Order</a>
</div></nav>
<main id="top">
<section class="hero"><div class="wrap hero-grid">
<div class="stack">
<div class="eyebrow">Mordsteam Friends · for 4–8 friends</div>
<h1>One of you did it.</h1>
<p class="lead">The murder-mystery night for your friends: you are the suspects – with your real names and your little quirks. Everyone investigates for themselves on their own phone, on the same evening or spread over the week – who unmasks the culprit first?</p>
<div class="actions">
<a class="btn btn-red" href="friends-buy.html">Order the mystery night – from €29</a>
<a class="btn-text" href="#how">How it works</a>
</div>
<p class="small">Play in English or German.</p>
</div>
<div class="file" aria-hidden="true">
<div class="folder"></div>
<div class="sheet">
<div class="mast"><span>ZIRBENBLICK CHALET · 1,640 M</span><span>SATURDAY, 7:40 AM</span></div>
<div class="headline">Landlord found dead in the sauna</div>
<p>A weekend in the mountains, a rented chalet, a landlord with an embarrassing vlog and a mania for going digital: sauna, doors, camera – everything in his “smart chalet” is recorded. In the morning he lies dead in the sauna, the door bolted from outside. Every one of you had a reason.</p>
<div class="chips"><span>4–8 suspects: you</span><span>12+ pieces of evidence</span><span>3 or 5 questions</span><span>50 or 75 min countdown</span></div>
</div>
<div class="stamp"><div><small>MORDSTEAM · FRIENDS 001</small><strong>UNSOLVED</strong><small>THE HELICOPTER IS COMING</small></div></div>
</div>
</div></section>
<section class="tvid-sec" aria-label="Teaser video"><div class="wrap">
<div class="tvid" data-video="friends-en"><video muted loop playsinline preload="none" aria-label="Teaser video Friends"></video><button class="tvid-sound" type="button" aria-pressed="false" data-on="Sound on" data-off="Sound off">Sound on</button></div>
</div></section>
<script src="/assets/teaser.js?v=2" defer></script>

<section class="facts" aria-label="Key facts"><div class="wrap">
<div><b>4–8 investigators</b><span>each on their own phone, tablet or laptop</span></div>
<div><b><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>50 or 75 min</b><span>Countdown for Mystery Night or Mystery Night Plus with AI interrogation room</span></div>
<div><b>Your names</b><span>with harmless quirks from a list – nobody is embarrassed</span></div>
<div><b>Digital game guidance</b><span>everything runs automatically in the browser, no app, no account</span></div>
</div></section>

<section id="how" class="section"><div class="wrap stack">
<div class="eyebrow">How it works</div>
<h2 class="h2">Three steps to the reveal</h2>
<div class="steps">
<div class="step"><span class="num">1</span><div><h3>Enter your group</h3><p>When ordering, you enter 4 to 8 first names and pick a quirk for each person – “snores like a chainsaw”, “dances while cooking” and so on. The game draws the culprit. Nobody knows in advance, not even the culprit.</p></div></div>
<div class="step"><span class="num">2</span><div><h3>Share the link</h3><p>You get one invitation link for the group. Everyone opens it on their own device and taps their name. Play at the same time on one evening – together or on a video call – or over 3, 5 or 7 days, whenever each of you has time.</p></div></div>
<div class="step"><span class="num">3</span><div><h3>Investigate and reveal</h3><p>Everyone for themselves – talking is allowed, but every tip helps the competition: read the evidence, check alibis, solve the questions. Once everyone is done, the reveal comes for all at the same time – with a ranking, the culprit's confession and a fun award for everyone.</p></div></div>
</div>
</div></section>

<section class="section"><div class="wrap stack">
<div class="eyebrow">Two ways to play</div>
<h2 class="h2">Together in the evening – or whenever each of you has time</h2>
<div class="modes">
<div class="mode"><h3>At the same time</h3><p>You sit together or meet on a video call. The organiser starts the case for everyone, each investigates on their own phone, the clock runs the same for all. Then: joint reveal and ranking.</p></div>
<div class="mode"><h3>Over the week</h3><p>No date needed: everyone plays within 3, 5 or 7 days, whenever they like. You only see who has already investigated – the reveal and the ranking come for everyone at the same time. Until then: keep quiet!</p></div>
</div>
</div></section>

<section id="case" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Friends 001 · Last Round at the Chalet</div>
<h2 class="h2">“Ferdl! In the sauna! Dead!”</h2>
<p class="lead">A weekend at the Zirbenblick chalet. Landlord Ferdl has digitised his chalet right down to the sauna and films a vlog about his guests. In the evening he proudly shows you the trailer for the new episode – with a secretly filmed clip of every one of you. In the morning he lies dead in the sauna. The road is snowed in, the helicopter is on its way. By the time it lands, it must be clear who did it. Everyone gets the same file: the sauna control log, the chalet app, the dice game score sheet and Ferdl's notes. Who spots the gap first – and who has something to hide?</p>
<p><b>The suspects – that's you, for example:</b></p>
<div class="objects"><span>snores like a chainsaw</span><span>sings in the shower</span><span>secretly eats other people's chocolate</span><span>can't lose at dice</span><span>dances while cooking</span><span>is afraid of cows</span></div>
</div>
<div class="clues" aria-label="Examples from the case file">
<div class="clue"><small>SAUNA CONTROL</small><span>Setpoint 95 → 110 °C<br>??:?? · outside panel</span></div>
<div class="clue"><small>SCORE PAD, KITCHEN</small><span>“Round 4 – three of us”<br>Who was missing?</span></div>
<div class="clue dark"><small>YOUR INVESTIGATION</small><div class="codebox" aria-label="Questions"><i>1</i><i>2</i><i>3</i></div><span class="hint">Time, culprit, hiding place – before the helicopter.</span></div>
<div class="clue"><small>CHALET APP</small><span>Motion on the stairs · ??:??<br>Who wasn't in their place?</span></div>
</div>
<ul class="list case-points">
<li>You are the suspects – with your names, rooms and quirks</li>
<li>The culprit is drawn at random; everyone finds out at the reveal</li>
<li>Questions that build on each other – new evidence after each correct answer</li>
<li>Hints at the click of a button, each costs penalty minutes</li>
<li>Ranking by time plus penalty minutes – and a fun award for everyone</li>
<li>A stylish mystery with a wink – no gore, no shock effects</li>
</ul>
<div class="actions case-buy"><a class="case-more" href="#price">Basic or Plus? →</a><a class="btn btn-red" href="friends-buy.html">Order your mystery night – from €29</a></div>
</div></section>

<section id="price" class="section"><div class="wrap stack">
<div class="eyebrow">Price</div>
<h2 class="h2">One price for the whole group</h2>
<p class="lead">No subscription, no sign-up: order, share the link, start playing. You pay once for everyone – with 8 people that's just over €6 per person.</p>
<div class="pack-grid">
<div class="pack">
<span class="badge">BASIC</span>
<h3>Mystery Night</h3><p class="sub"><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>50-minute countdown · 4–8 people</p>
<p class="price">from €29</p><p class="per">€29 for up to 4 people, +€5 per extra person</p>
<ul class="list"><li>“Last Round at the Chalet” with your names and quirks</li><li>12 pieces of evidence, 3 questions, culprit drawn at random</li><li>At the same time or over 3, 5 or 7 days</li><li>Joint reveal with ranking</li><li>A fun award for everyone</li><li>Playable for 12 months, can be started once</li></ul>
<a class="btn btn-line" href="friends-buy.html">Order the mystery night – from €29</a>
</div>
<div class="pack featured">
<span class="badge">PREMIUM · WITH AI</span>
<h3>Mystery Night Plus</h3><p class="sub"><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>75-minute countdown · 4–8 people</p>
<p class="price">from €49</p><p class="per">€49 for up to 4 people, +€8 per extra person</p>
<ul class="list"><li>Everything in the Mystery Night</li><li><b>The interrogation room:</b> question your friends – played by AI, with their names and quirks</li><li>40 questions per person, spread across all doubles as you like</li><li>One of them lies – catch them out in the interrogation and you find the culprit</li><li>A two-step finale: Ferdl's cloud password and his secret “Part 2” – only your doubles know both</li><li>For players aged 18 and over</li></ul>
<a class="btn btn-red" href="friends-buy.html?v=plus">Order Mystery Night Plus – from €49</a>
</div>
</div>
<div class="devicebox">
<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M1 17h16"/><rect x="17" y="8" width="6" height="12" rx="1.2"/><path d="M19.5 17.5h1"/></svg>
<p><b>Everyone plays on their own device.</b> Phone, tablet or laptop, right in the browser, no app and no account. With the invitation link anyone can switch to another device, even mid-case.</p>
</div>
</div></section>

<section id="bewertungen" class="section" data-produkt="friends" hidden><div class="wrap stack">
<div class="eyebrow">Reviews</div>
<h2 class="h2">What investigators say</h2>
<div class="reviews" id="reviews"></div>
</div></section>

<section id="faq" class="section faq"><div class="wrap faq-grid">
<div class="stack"><div class="eyebrow">FAQ</div><h2 class="h2">Questions?</h2></div>
<div>
<details><summary>Who is the culprit?</summary><p>One of you – drawn at random when the round is set up. Nobody knows in advance, not the organiser and not the culprit: they investigate like everyone else and may find out it was them. Everyone learns it together at the reveal.</p></details>
<details><summary>How much time do you have?</summary><p>The countdown is your maximum time, not a fixed playing time: 50 minutes in the Mystery Night, 75 in Mystery Night Plus with the interrogation room and finale. How fast you finish depends on how experienced you are at solving puzzles. We played every case in many test runs and set the time so that it can be solved within it. If the countdown runs out, just keep playing – the clock then shows in red how far over you are. The ranking counts playing time plus penalty minutes.</p></details>
<details><summary>Can we pause?</summary><p>No, the clock runs without a pause – that is part of the game. When playing together it starts for everyone when the organiser starts; over the week, everyone starts their own clock by opening the case file. So best to start when you have the time in one go.</p></details>
<details><summary>At the same time or over the week – which is better?</summary><p>At the same time is ideal for an evening together, also on a video call: the organiser starts for everyone, then you reveal together. Over the week suits you if you can't find a date: everyone plays within 3, 5 or 7 days, and the reveal comes for everyone at the same time.</p></details>
<details><summary>Over the week: how do we know when the reveal is ready?</summary><p>The reveal comes automatically as soon as everyone has played – at the latest at the end of the time window. The organiser then gets an email with the link and shares it in your group chat, for example on WhatsApp. Everyone opens their invitation link again and sees the culprit, the ranking and their award. Nobody has to keep the page open.</p></details>
<details><summary>What if someone can't play?</summary><p>They remain a suspect in the story – the case stays just as solvable for the others. In the ranking they appear as “didn't play”. In the weekly mode the reveal then comes at the end of the time window.</p></details>
<details><summary>Which quirks are there?</summary><p>16 affectionately harmless quirks to choose from, from “sings in the shower” to “talks to plants”. There is deliberately no free text – so nobody gets embarrassed. Please only enter people who want to play with their name and quirk.</p></details>
<details><summary>Does the organiser play too?</summary><p>Of course! Just add yourself to the group. You only need the organiser page to share the link and start – you won't see the culprit there either.</p></details>
<details><summary>Can people spoil the solution for each other?</summary><p>In theory, yes – but whoever helps others makes their own ranking worse. Anyone who has finished only sees “solved”, not the solution. The culprit, the reveal and the times come for everyone together.</p></details>
<details><summary>Do we need an app or an account?</summary><p>No. Mordsteam Friends runs right in the browser on phone, tablet or laptop. Everyone only needs the invitation link.</p></details>
<details><summary>Is this a murder mystery game for home?</summary><p>Yes – no character booklets, no costumes, everyone investigates on their own phone. More: <a href="murder-mystery-game-at-home.html">Murder mystery game at home</a>.</p></details>
<details><summary>Can I give a mystery night as a gift?</summary><p>Yes. Order the round with the names of the group you are giving it to – the names appear in the case and can’t be changed after purchase. After paying you get a gift card to print or save as PDF, with your dedication and a QR code to the organiser page. The recipient then starts the evening themselves.</p></details>
<details><summary>Can I use a voucher?</summary><p>Yes: enter the €5 voucher from Mordsteam Solo in the payment step. One voucher per order, not combinable with the early bird discount.</p></details>
<details><summary>What is the AI interrogation room in Mystery Night Plus?</summary><p>Once you have solved question 1, the interrogation room opens: each of your friends has an AI double with their name and quirk that you can question via chat – you have 40 questions. One of them lies to you, and for the finale – Ferdl's cloud password and his secret “Part 2” – you need what only the doubles know. The AI only knows the invented world of the case; real names never go to the AI provider – we replace them with placeholders first.</p></details>
<details><summary>From what age?</summary><p>The case is written for adults – a mystery with a wink, no blood and no shock effects. Teenagers can play the Mystery Night well too. Mystery Night Plus with the AI interrogation room is for ages 18 and over; you confirm this when ordering.</p></details>
<details><summary>Is it good for colleagues, too?</summary><p>Yes, as a relaxed round after work or spread over the week: everyone plays for themselves, and at the end there is a ranking and the reveal for all. If you'd rather investigate together as a team – say as a team event for your department – <a href="teams.html">Mordsteam Teams</a> is the right choice.</p></details>
<details><summary>Do we get an invoice?</summary><p>Yes, automatically by email. If you order as a company, club or organisation, enter the company name, billing country and – if you have one – VAT ID in the order form, and the address when paying.</p></details>
<details><summary>Is Mordsteam Friends available in English?</summary><p>Yes. You choose the game language – German or English – when ordering.</p></details>
</div>
</div></section>

<section class="cta"><div class="wrap">
<h2>The helicopter is already on its way.</h2>
<p>By the time it lands, you'll know which of you did it.</p>
<a class="btn btn-ink" href="friends-buy.html">Order the mystery night – from €29</a>
</div></section>
</main>''')

P["friends-buy"] = dict(title="Order Friends – Mordsteam", robots="noindex", desc="Order Mordsteam Friends 001 “Last Round at the Chalet”: the mystery night for 4–8 friends from €29, invitation link right away.",
 scripts='<script src="/assets/billing.js"></script>\n<script src="/assets/friends-kaufen.js"></script>',
 body='''<main class="page shop"><div class="wrap">
<div class="eyebrow">Order · Mordsteam Friends 001</div>
<h1>Last Round at the Chalet</h1>
<p class="lead">The mystery night for 4–8 friends, with a 50- or 75-minute countdown: everyone investigates for themselves on their own device. After payment you get the invitation link for the group and your organiser page right away – on screen and by email.</p>
<div class="note" id="closed" hidden>Orders are not open yet. You can look at the form, but not submit it yet.</div>
<div class="note" id="cancelled" hidden>The payment was cancelled. You can simply try again.</div>
<form class="form" id="friends" novalidate>
<fieldset class="step"><legend><span>1</span> Which version?</legend>
<label class="check"><input type="radio" name="variant" value="basis" checked><span><b>Mystery Night</b> · 50-minute countdown · from €29 (up to 4 people, +€5 per extra person)</span></label>
<label class="check"><input type="radio" name="variant" value="plus"><span><b>Mystery Night Plus</b> · 75-minute countdown · from €49 (up to 4 people, +€8 per extra person) – with AI interrogation room: you question the AI doubles of your friends. 18+.</span></label>
<div class="field"><label for="lang">Game language *</label>
<select id="lang" name="lang"><option value="en">English</option><option value="de">German</option></select>
<span class="hint">Applies to the whole group: case file, questions, interrogation room and solution – independent of this website.</span></div>
</fieldset>
<fieldset class="step"><legend><span>2</span> Your group</legend>
<div class="field"><label for="n">How many are playing? *</label><select id="n" name="n"><option>4</option><option>5</option><option selected>6</option><option>7</option><option>8</option></select>
<span class="hint">Add yourself if you're playing. The game draws the culprit – you'll only find out at the reveal too.</span></div>
<div id="people" class="fr-people"></div>
<p class="hint">First names are enough; if two share a first name, add an initial (e.g. “Anna B.”). The quirk is a harmless running gag in the case – there is deliberately no free text.</p>
<p class="hint">🎁 A gift? Enter the group of the person you’re giving it to – the names can’t be changed after purchase. After payment you’ll get a gift card to print or save as PDF.</p>
<label class="check"><input type="checkbox" name="zustimmung"><span>Everyone named knows about it and agrees to play in the fictional case with their name and the chosen quirk – including as a suspect or culprit. *</span></label>
</fieldset>
<fieldset class="step"><legend><span>3</span> How do you want to play?</legend>
<label class="check"><input type="radio" name="mode" value="live" checked><span><b>At the same time</b> – you play on the same evening, together or on a video call. You start the case for everyone.</span></label>
<label class="check"><input type="radio" name="mode" value="week"><span><b>Over the week</b> – everyone plays when they have time. The reveal comes for everyone together.</span></label>
<div class="field" id="daysbox" hidden><label for="days">Time window</label><select id="days" name="days"><option value="3">3 days</option><option value="5">5 days</option><option value="7" selected>7 days</option></select><span class="hint">The days start when you tap start on your organiser page – not with the purchase.</span></div>
</fieldset>
<fieldset class="step"><legend><span>4</span> Your details</legend>
<div class="two">
<div class="field"><label for="c_name">Your name *</label><input id="c_name" name="c_name" maxlength="120" autocomplete="name"></div>
<div class="field"><label for="c_email">Email *</label><input id="c_email" name="c_email" type="email" maxlength="160" autocomplete="email"><span class="hint">We'll send the links and the invoice here.</span></div>
</div>
<div class="field"><span class="label">You are ordering as *</span>
<label class="check"><input type="radio" name="kunde" value="b2c"><span>Private individual</span></label>
<label class="check"><input type="radio" name="kunde" value="b2b"><span>Company, club or organisation</span></label>
<span class="hint">Private individuals have the statutory right of withdrawal (see <a href="terms.html#ruecktritt" target="_blank" rel="noopener">terms section 8</a>).</span></div>
<div id="billbox"></div>
</fieldset>
<fieldset class="step"><legend><span>5</span> Review and pay</legend>
<div class="summary"><div class="sumrow"><span id="sumtxt">Mordsteam Friends 001 “Last Round at the Chalet” · 6 people · 50-minute countdown · game language German</span><b id="sumprice">€39.00</b></div>
<div class="sumrow" id="ebrow" hidden><span>Early bird −<span class="ebp">25</span>%</span><b id="ebprice"></b></div>
<p class="small">Final price for the whole group. Playable for 12 months, can be started once. VAT exempt (small business scheme).</p></div>
<label class="check" id="ab18box" hidden><input type="checkbox" name="ab18"><span>All players are at least 18 years old (required for the AI interrogation room) and agree that an AI plays their doubles in the game – only with placeholders instead of real names and the chosen quirk. *</span></label>
<label class="check" id="ebbox" hidden><input type="checkbox" name="earlybird"><span><b>Early bird: <span class="ebp">25</span>% off</b> your first game. In return: after the reveal you give us short feedback in the game (<a href="early-bird.html" target="_blank" rel="noopener">conditions</a>).</span></label>
<p class="hint" id="voucherhint">Voucher code, e.g. from Mordsteam Solo? Enter it in the next step when paying.</p>
<label class="check" id="sofortbox" hidden><input type="checkbox" name="sofort"><span>I expressly request that you set up our round and provide the links right after payment – we can still play whenever we like. I am aware that as a private individual I thereby lose my right of withdrawal (at the latest with the joint reveal). *</span></label>
<label class="check"><input type="checkbox" name="no_news"><span>No news by email, please. Otherwise we'll occasionally tell you about new Mordsteam cases – you can unsubscribe in every email with one click.</span></label>
<label class="check"><input type="checkbox" name="agb"><span>I accept the <a href="terms.html" target="_blank">terms</a> and have read the <a href="privacy.html" target="_blank">privacy policy</a>. *</span></label>
<p class="formerr" id="err" role="alert" hidden></p>
<div><button class="btn btn-red" type="submit" id="submit">Order and pay – €39.00</button></div>
<p class="hint small" id="payhint">Payment is handled securely by Stripe (card, Apple Pay, Google Pay and more). You'll see the links right afterwards.</p>
</fieldset>
</form>
</div></main>''')

P["solo"] = dict(title="Mordsteam Solo – murder mysteries just for you", scripts='<script src="/assets/aktion.js"></script>',
 desc="Three cases for one person: night train, theatre and winery – with an AI interrogation room in the Plus case. On phone, tablet or laptop, from €8.90.",
 body='''<nav class="subnav" aria-label="Mordsteam Solo"><div class="wrap">
<b><span>Mordsteam</span> Solo</b>
<a href="#how">How it works</a><a href="#case">Solo 001</a><a href="#case2">Solo 002</a><a href="#caseplus">Solo Plus</a><a href="#price">Price</a><a href="#faq">FAQ</a>
<a class="btn btn-red" href="solo-buy.html">Buy</a>
</div></nav>
<main id="top">
<section class="hero"><div class="wrap hero-grid">
<div class="stack">
<div class="eyebrow">Mordsteam Solo · just for you</div>
<h1>Who did it on the night train?</h1>
<p class="lead">A body in the sleeping car, five suspects, 40 minutes to Udine. The murder mystery for one person: read the evidence, check the alibis, convict the killer – on your phone, tablet or laptop, whenever and wherever you like.</p>
<div class="actions">
<a class="btn btn-red" href="#price">Choose a case – from €8.90</a>
<a class="btn-text" href="#how">How it works</a>
</div>
</div>
<div class="file" aria-hidden="true">
<div class="folder"></div>
<div class="sheet">
<div class="mast"><span>LA SERENISSIMA · VIENNA – VENICE</span><span>2:15 AM</span></div>
<div class="headline">Art dealer dead in compartment 4</div>
<p>Sleeping car 327, just past Villach. A sleeping pill in the cognac, a forgery in the suitcase. Five people on the train had a motive – and only one had the opportunity.</p>
<div class="chips"><span>5 suspects</span><span>16 pieces of evidence</span><span>3 questions</span><span>1 investigator: you</span></div>
</div>
<div class="stamp"><div><small>MORDSTEAM · SOLO 001</small><strong>UNSOLVED</strong><small>UDINE ARR. 2:55 AM</small></div></div>
</div>
</div></section>
<section class="tvid-sec" aria-label="Teaser video"><div class="wrap">
<div class="tvid" data-video="solo-en"><video muted loop playsinline preload="none" aria-label="Teaser video Solo"></video><button class="tvid-sound" type="button" aria-pressed="false" data-on="Sound on" data-off="Sound off">Sound on</button></div>
</div></section>
<script src="/assets/teaser.js?v=2" defer></script>

<section class="facts" aria-label="Key facts"><div class="wrap">
<div><b>1 investigator</b><span>just you, on your own device</span></div>
<div><b><svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>35–45 min</b><span>countdown depending on the case – your time until the police arrive</span></div>
<div><b>Different every time</b><span>the killer is drawn anew for every playthrough</span></div>
<div><b>Play right away</b><span>code straight after purchase, valid for 12 months</span></div>
</div></section>

<section id="how" class="section"><div class="wrap stack">
<div class="eyebrow">How it works</div>
<h2 class="h2">Three steps from purchase to certificate</h2>
<div class="steps">
<div class="step"><span class="num">1</span><div><h3>Get your code</h3><p>After paying you get your game code on screen and by email. Start right away or any time within the next 12 months – also as a gift: the name is only entered when playing.</p></div></div>
<div class="step"><span class="num">2</span><div><h3>Investigate</h3><p>The clock runs from the start. You begin at the crime scene, and every correct answer unlocks new evidence. Stuck? Hints are one click away – for penalty minutes.</p></div></div>
<div class="step"><span class="num">3</span><div><h3>Convict</h3><p>Time of the crime, killer, hiding place: once you have solved all the questions, you see your final time, how much faster you were than the others – and get your certificate with your name.</p></div></div>
</div>
</div></section>

<section id="case" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Solo 001 · Night Train to Venice</div>
<h2 class="h2">The conductor knocks. “You read crime novels, don't you?”</h2>
<p class="lead">Night train from Vienna to Venice, 2:15 am. The art dealer Viktor Hallwachs lies dead in his compartment, and the painting in his suitcase is a copy. At 2:55 am the police board in Udine – by then you want to be able to tell them who did it. The conductor hands you everything he has: the compartment door log, a passenger's photos and the statements of the five suspects. Somewhere in there an alibi has a gap – and the real painting is still on the train.</p>
<p><b>Five suspects, five motives:</b></p>
<div class="objects"><span>the business partner</span><span>the nephew</span><span>the journalist</span><span>the conductor</span><span>the art appraiser</span></div>
</div>
<div class="clues" aria-label="Examples from the case file">
<div class="clue"><small>DOOR LOG COMPARTMENT 4</small><span>Who let whom in?<br>??:?? · opened · inside</span></div>
<div class="clue"><small>DINING CAR RECEIPT</small><span>“Table 3, two teas”<br>paid ??:??</span></div>
<div class="clue dark"><small>YOUR INVESTIGATION</small><div class="codebox" aria-label="Three questions"><i>1</i><i>2</i><i>3</i></div><span class="hint">Time, killer, hiding place – before Udine.</span></div>
<div class="clue"><small>WI-FI LOG</small><span>Which phone was where?<br>AP 327 · ??:?? to ??:??</span></div>
</div>
<ul class="list case-points">
<li>Three questions that build on each other: time, killer, hiding place</li>
<li>Evidence in three stages – the next only after the right answer</li>
<li>The killer is drawn for every playthrough, the evidence adapts</li>
<li>Hints at the click of a button, each costs penalty minutes</li>
<li>At the end: “faster than X %” of all investigators – how do you measure up?</li>
<li>A stylish mystery with a wink – no blood, no shock effects</li>
</ul>
<div class="actions case-buy"><a class="case-more" href="#price">All Solo cases →</a><a class="btn btn-red" href="solo-buy.html?fall=001">Buy the case – €8.90</a></div>
</div></section>

<section id="case2" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Solo 002 · Applause for a Dead Man</div>
<h2 class="h2">The curtain falls. The star doesn't get up again.</h2>
<p class="lead">Opening night at a theatre in Vienna. Richard Adler, the celebrated Prospero, takes his bow – and collapses behind the curtain. Poison. The artistic director asks for your help: the police will be here in just over half an hour. Backstage, everyone has touched something – tea, throat spray, goblet, glasses. You compare fingerprints, work back from the doctor's findings and finally crack the culprit's locker.</p>
<p><b>Five suspects backstage:</b></p>
<div class="objects"><span>the ex-partner</span><span>the understudy</span><span>the assistant director</span><span>the dresser</span><span>the prop master</span></div>
</div>
<div class="clues" aria-label="Examples from the case file">
<div class="clue"><small>DOCTOR'S FINDINGS</small><span>“swallowed about<br>?? to ?? minutes ago”</span></div>
<div class="clue"><small>FINGERPRINTS</small><span>Who touched<br>the glass?</span></div>
<div class="clue dark"><small>YOUR INVESTIGATION</small><div class="codebox" aria-label="Questions"><i>1</i><i>2</i><i>3</i></div><span class="hint">What, who – and the locker code.</span></div>
<div class="clue"><small>LOCKER BOOK</small><span>Locker 9 · code word ????<br>ABC = 2, DEF = 3 …</span></div>
</div>
<ul class="list case-points">
<li>New puzzles: work out time windows, match fingerprints, crack a locker code</li>
<li>Evidence in three stages – the next only after the right answer</li>
<li>Killer and source of the poison drawn anew for every playthrough</li>
<li>With an investigation sheet to tick off alibis</li>
<li>A stylish mystery with a wink – no blood, no shock effects</li>
</ul>
<div class="actions case-buy"><a class="case-more" href="#price">All Solo cases →</a><a class="btn btn-red" href="solo-buy.html?fall=002">Buy the case – €8.90</a></div>
</div></section>

<section id="caseplus" class="section case"><div class="wrap case-grid">
<div class="stack">
<div class="eyebrow">Solo Plus · The Last Vintage · with AI</div>
<h2 class="h2">“Talk to the people.”</h2>
<p class="lead">Harvest festival at a winery in the Wachau. Winemaker Ferdinand Aigner lies dead in the fermentation cellar, the door locked from outside, the key gone. The five suspects are waiting in the press house – and this time you interrogate them yourself. The press photographer's pictures, the ventilation log and the announcements from the organisers show who was where and when. Who is lying to you, and where the key went, you only find out in the interrogation.</p>
<p><b>Five suspects who answer you live:</b></p>
<div class="objects"><span>the son</span><span>the daughter</span><span>the foreman</span><span>the wine merchant</span><span>the neighbouring winemaker</span></div>
</div>
<div class="clues" aria-label="Examples from the case file">
<div class="clue"><small>VENTILATION LOG</small><span>OFF · switch in the hall<br>??:??</span></div>
<div class="clue"><small>FIREWORKS PHOTOS</small><span>Who can be seen –<br>and who can't?</span></div>
<div class="clue dark"><small>THE INTERROGATION ROOM</small><div class="codebox" aria-label="Questions"><i>1</i><i>2</i><i>3</i><i>4</i></div><span class="hint">One is lying. Find the contradiction.</span></div>
<div class="clue"><small>ANNOUNCEMENTS</small><span>“Attention, change …”<br>10:20 pm</span></div>
</div>
<ul class="list case-points">
<li>The interrogation room: you ask in the chat, the suspects answer live – played by an AI</li>
<li>One of them is lying – only the right questions reveal the contradiction</li>
<li>Four questions, a 45-minute countdown, killer drawn anew for every playthrough</li>
<li>The AI only knows the invented world of the case – your name never goes to the AI provider</li>
<li>Ages 18 and over</li>
</ul>
<div class="actions case-buy"><a class="case-more" href="#price">All Solo cases →</a><a class="btn btn-red" href="solo-buy.html?fall=plus">Buy the case – €15.90</a></div>
</div></section>

<section id="price" class="section"><div class="wrap stack">
<div class="eyebrow">Price</div>
<h2 class="h2">Three cases just for you</h2>
<p class="lead">No subscription, no account: buy, get your code, start playing. Every Solo case comes with a €5 voucher for a game with friends or your team.</p>
<div class="pack-grid three">
<div class="pack">
<span class="badge">BASIC</span>
<h3>Night Train to Venice</h3><p class="sub">Solo 001 · <svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>40-minute countdown · 1 person</p>
<p class="price">€8.90</p><p class="per">A body on the night train – and a forgery in the suitcase</p>
<ul class="list"><li>16 pieces of evidence, 5 suspects, 3 questions</li><li>Killer drawn anew for every playthrough – replay up to three times</li><li>Hints at the click of a button</li><li>Result “faster than X %” on your first playthrough</li><li>Certificate with your name to print or save as PDF</li><li>€5 voucher for a Friends or Teams game</li></ul>
<a class="btn btn-line" href="solo-buy.html?fall=001">Buy the case – €8.90</a>
</div>
<div class="pack">
<span class="badge">BASIC</span>
<h3>Applause for a Dead Man</h3><p class="sub">Solo 002 · <svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>35-minute countdown · 1 person</p>
<p class="price">€8.90</p><p class="per">Opening night at a Vienna theatre – and the star doesn't get up again</p>
<ul class="list"><li>New case, new puzzles: poison, fingerprints and a locked locker</li><li>Killer drawn anew for every playthrough – replay up to three times</li><li>Hints at the click of a button</li><li>Certificate with your name</li><li>€5 voucher for a Friends or Teams game</li></ul>
<a class="btn btn-line" href="solo-buy.html?fall=002">Buy the case – €8.90</a>
</div>
<div class="pack featured">
<span class="badge">PREMIUM · WITH AI</span>
<h3>The Last Vintage</h3><p class="sub">Solo Plus · <svg class="ico-cd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="8"/><path d="M12 14v-4M9 2h6M12 2v4M19 7l1.5-1.5"/></svg>45-minute countdown · 1 person</p>
<p class="price">€15.90</p><p class="per">Death at a wine festival in the Wachau</p>
<ul class="list"><li><b>The interrogation room:</b> question the suspects yourself – they answer live, played by AI</li><li>One of them is lying – find the contradiction</li><li>Killer drawn anew for every playthrough – replay up to three times</li><li>Certificate with your name</li><li>€5 voucher for a Friends or Teams game</li><li>Ages 18 and over</li></ul>
<a class="btn btn-red" href="solo-buy.html?fall=plus">Buy the case – €15.90</a>
</div>
</div>
<div class="devicebox">
<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M1 17h16"/><rect x="17" y="8" width="6" height="12" rx="1.2"/><path d="M19.5 17.5h1"/></svg>
<p><b>Playable on phone, tablet or laptop.</b> Right in the browser, no app and no account. A stable internet connection is all you need – ideal for the train, the lunch break or an evening on the sofa.</p>
</div>
</div></section>

<section id="bewertungen" class="section" data-produkt="solo" hidden><div class="wrap stack">
<div class="eyebrow">Voices</div>
<h2 class="h2">What investigators say</h2>
<div class="reviews" id="reviews"></div>
</div></section>

<section id="faq" class="section faq"><div class="wrap faq-grid">
<div class="stack"><div class="eyebrow">FAQ</div><h2 class="h2">Any questions?</h2></div>
<div>
<details><summary>How much time do you have?</summary><p>The countdown is your maximum time, not a fixed playing time: 40 minutes for Solo 001, 35 for Solo 002 and 45 for Solo Plus – until the police arrive. How fast you finish depends on how experienced you are at solving puzzles. We played every case in many test runs and set the time so that it can be solved within it. If the countdown runs out, just keep playing – the clock then shows in red how far over you are, and that counts towards your final time.</p></details>
<details><summary>Can I pause?</summary><p>No. The clock starts as soon as you open the case file and keeps running. Until then, take as long as you like: the code is valid for 12 months. If you close the window during the game, your code takes you back – but the clock will have kept running.</p></details>
<details><summary>How do the hints work?</summary><p>Each question has three hints, from a gentle nudge to almost the answer. They cost 1, 2 and 3 penalty minutes. A wrong answer costs 3 minutes, and you can try again straight away.</p></details>
<details><summary>What does “faster than X %” mean?</summary><p>Your final time (time played plus penalty minutes) is compared with all other investigators who solved the case for the first time. There is no public leaderboard, nobody sees your name.</p></details>
<details><summary>Can I play the case again?</summary><p>Yes, for all three cases: up to three times within 30 days of your first playthrough. A different killer is drawn for each playthrough, and the matching evidence changes too. Only your first playthrough counts for the comparison.</p></details>
<details><summary>Can I give Mordsteam Solo as a gift?</summary><p>Yes. After buying you get a gift card on the confirmation page and in the order email to print or save as PDF – with your dedication, the code and a QR code. The name that appears in the story and on the certificate is only entered by whoever plays.</p></details>
<details><summary>What is the €5 voucher?</summary><p>Every Solo case gives you a €5 voucher code after your first playthrough – solved or not. Redeem it in the payment step when ordering Mordsteam Friends or Teams. One voucher per order; it can't be combined with the early bird or other offers and can't be exchanged for cash.</p></details>
<details><summary>Do I need an app or an account?</summary><p>No. Mordsteam Solo runs right in the browser on phone, tablet or laptop. All you need is your code.</p></details>
<details><summary>May I use Google or AI?</summary><p>Please don't. The cases are built so you solve them with your wits and the evidence – everything you need is in the file. The only AI allowed to play along are the suspects in the Solo Plus interrogation room. A matter of honour among investigators.</p></details>
<details><summary>From what age?</summary><p>The cases are written for adults – mysteries with a wink, no blood and no shock effects. Teenagers can play Solo 001 and Solo 002 well too. Solo Plus with the AI interrogation room is for ages 18 and over; you confirm this when buying.</p></details>
<details><summary>Do I get an invoice?</summary><p>Yes, automatically by email. If you buy for a company, club or organisation, enter the company name, billing country and – if you have one – VAT ID in the order form, and the address when paying.</p></details>
<details><summary>Is Mordsteam Solo available in English?</summary><p>Yes. You choose the game language – German or English – when buying.</p></details>
</div>
</div></section>

<section class="cta"><div class="wrap">
<h2>At 2:55 am the train stops in Udine.</h2>
<p>By then you'll know who did it.</p>
<a class="btn btn-ink" href="#price">Choose a case – from €8.90</a>
</div></section>
</main>''')

P["solo-buy"] = dict(title="Buy Solo – Mordsteam", robots="noindex", desc="Buy Mordsteam Solo: murder mysteries for one person from €8.90, code right away on screen and by email.",
 scripts='<script src="/assets/billing.js"></script>\n<script src="/assets/solo-kaufen.js"></script>',
 body='''<main class="page shop"><div class="wrap">
<div class="eyebrow">Order · Mordsteam Solo</div>
<h1>A case just for you</h1>
<p class="lead">Murder mysteries for one person. You pay once and get your code right away on screen and by email.</p>
<div class="note" id="closed" hidden>Orders are not open yet. You can look at the form, but not submit it yet.</div>
<div class="note" id="cancelled" hidden>The payment was cancelled. You can simply try again.</div>
<form class="form" id="solo" novalidate>
<fieldset class="step"><legend><span>1</span> Which case?</legend>
<label class="check"><input type="radio" name="fall" value="solo-001" checked><span><b>Night Train to Venice</b> · Solo 001 · 40-minute countdown · €8.90</span></label>
<label class="check"><input type="radio" name="fall" value="solo-002"><span><b>Applause for a Dead Man</b> · Solo 002 · 35-minute countdown · €8.90</span></label>
<label class="check"><input type="radio" name="fall" value="solo-plus-001"><span><b>The Last Vintage</b> · Solo Plus · 45-minute countdown · €15.90 – with AI interrogation room, ages 18+</span></label>
<div class="field"><label for="lang">Game language *</label>
<select id="lang" name="lang"><option value="en">English</option><option value="de">German</option></select>
<span class="hint">The language of the case, the questions and the certificate – independent of this website.</span></div>
</fieldset>
<fieldset class="step"><legend><span>2</span> Your details</legend>
<div class="two">
<div class="field"><label for="c_name">Your name *</label><input id="c_name" name="c_name" maxlength="120" autocomplete="name"></div>
<div class="field"><label for="c_email">Email *</label><input id="c_email" name="c_email" type="email" maxlength="160" autocomplete="email"><span class="hint">We'll send your code and invoice here.</span></div>
</div>
<p class="hint">A gift? No problem: after paying you get a gift card to print or save as PDF. The name that appears in the story and on the certificate is only entered by whoever plays.</p>
<div class="field"><span class="label">You are ordering as *</span>
<label class="check"><input type="radio" name="kunde" value="b2c"><span>Private individual</span></label>
<label class="check"><input type="radio" name="kunde" value="b2b"><span>Company, club or organisation</span></label>
<span class="hint">Private individuals have the statutory right of withdrawal (see <a href="terms.html#ruecktritt" target="_blank" rel="noopener">terms section 8</a>).</span></div>
<div id="billbox"></div>
</fieldset>
<fieldset class="step"><legend><span>3</span> Review and pay</legend>
<div class="summary"><div class="sumrow"><span id="sumtxt">Mordsteam Solo 001 “Night Train to Venice” · 40-minute countdown · game language German</span><b id="sumprice">€8.90</b></div><p class="small">Final price. Code valid for 12 months. After your first playthrough, replayable up to three times within 30 days with a different killer. Plus a €5 voucher for Mordsteam Friends or Teams. VAT exempt (small business scheme).</p></div>
<label class="check" id="sofortbox" hidden><input type="checkbox" name="sofort"><span>I expressly request that you provide my code right after payment – I can still play whenever I like. I am aware that as a private individual I thereby lose my right of withdrawal (at the latest once the case has been played). *</span></label>
<label class="check" id="ab18box" hidden><input type="checkbox" name="ab18"><span>I am at least 18 years old and agree that an AI plays the suspects in the interrogation room. My name is not sent to the AI provider. *</span></label>
<label class="check"><input type="checkbox" name="no_news"><span>No news by email, please. Otherwise we'll occasionally tell you about new Mordsteam cases – you can unsubscribe in every email with one click.</span></label>
<label class="check"><input type="checkbox" name="agb"><span>I accept the <a href="terms.html" target="_blank">terms</a> and have read the <a href="privacy.html" target="_blank">privacy policy</a>. *</span></label>
<p class="formerr" id="err" role="alert" hidden></p>
<div><button class="btn btn-red" type="submit" id="submit">Order and pay – €8.90</button></div>
<p class="hint small" id="payhint">Payment is handled securely by Stripe (card, Apple Pay, Google Pay and more). You'll see your code right afterwards.</p>
</fieldset>
</form>
</div></main>''')

P["order"] = dict(title="Order – Mordsteam", robots="noindex", desc="Order Mordsteam Teams: case 001 “The Red Folder” for companies or case 002 “Cold Cash” for clubs – enter your details, pay, get your game code immediately.",
 scripts='<div class="pricebar" id="pricebar"><div class="wrap"><span id="pb-text"></span><strong id="pb-sum"></strong></div></div>\n<script src="/assets/billing.js"></script>\n<script src="/assets/bestellen.js"></script>',
 body='''<main class="page shop"><div class="wrap">
<div class="eyebrow">Order · Teams · Case <span class="casenr">001</span></div>
<h1>Order your case</h1>
<p class="lead">Enter who appears in your case, pay – and get your game code immediately. Takes about 5 minutes.</p>
<div class="note" id="closed" hidden>Orders are not open yet. You can look at the form but can't submit it yet.</div>
<div class="note" id="cancelled" hidden>The payment was cancelled. Your entries are still here – you can simply try again.</div>
<form class="form" id="order" novalidate>

<fieldset class="step"><legend><span>1</span> Case</legend>
<div class="pick two-pick" role="radiogroup" aria-label="Case">
<label class="pickcard"><input type="radio" name="fall" value="fall-001" checked><span><b>Case 001 · The Red Folder</b><small>For companies and teams<br>Poisoning at the strategy evening</small></span></label>
<label class="pickcard"><input type="radio" name="fall" value="fall-002"><span><b>Case 002 · Cold Cash</b><small>For clubs<br>Locked in the refrigerated trailer after the club fête</small></span></label>
</div>
</fieldset>

<fieldset class="step"><legend><span>2</span> Package and teams</legend>
<div class="pick" role="radiogroup" aria-label="Package">
<label class="pickcard"><input type="radio" name="paket" value="basis" checked><span><b>Basic</b><small>50-minute countdown<br>Act 1 with four questions</small><em>€89 per team</em></span></label>
<label class="pickcard"><input type="radio" name="paket" value="premium"><span><b>Premium</b><small>70-minute countdown<br>Act 1 + act 2 with two more, even trickier tasks</small><em>€119 per team</em></span></label>
<label class="pickcard"><input type="radio" name="paket" value="plus"><span><b>Premium Plus</b><small>90-minute countdown<br>Acts 1 &amp; 2 + finale <span data-c1>with ARIA, the AI assistant on the intranet</span><span data-c2 hidden>with an AI interrogation of the honorary chair</span></small><em>€149 per team</em></span></label>
</div>
<p class="note" id="plusnote" hidden><span data-c1>ARIA is</span><span data-c2 hidden>The AI interrogation is</span> intended for participants aged 18 and over. If younger people play along, for example <span data-c1>apprentices</span><span data-c2 hidden>the club's youth section</span>, please choose Basic or Premium – no AI runs there.</p>
<div class="two">
<div class="field"><label for="teams">Number of teams *</label>
<select id="teams" name="teams"></select>
<div class="teamcalc"><label for="personen">How many of you are there in total?</label><input id="personen" type="number" min="1" max="200" inputmode="numeric" placeholder="e.g. 12"></div>
<span class="hint" id="teamtip">4 to 6 people per team is ideal (3 to 6 possible), each team needs one device. Enter your head count – we'll suggest the right number of teams.</span></div>
<div class="field"><span class="label">When do you play?</span><p class="whenbox">Whenever you like: right after paying or any time in the next 12 months. Each case can be started once.</p></div>
</div>
</fieldset>

<fieldset class="step"><legend><span>2</span> Language, country and cast</legend>
<div class="two">
<div class="field"><label for="lang">Game language *</label>
<select id="lang" name="lang"><option value="en">English</option><option value="de">German</option></select>
<span class="hint">The language of the case file, <span data-c1>intranet, case desk and ARIA</span><span data-c2 hidden>club website, case desk and AI interrogation</span> – independent of this website.</span></div>
<div class="field"><label for="land">Country *</label>
<select id="land" name="land"></select>
<span class="hint">Police, currency, number plates, bank details and cities in the case will match your country.</span></div>
</div>
<p class="steplead" data-c1>The case is most fun with real people and places: your boss as the victim, colleagues as suspects, your rooms as the crime scene. If you'd rather not enter anyone, you get an invented company with invented characters.</p>
<p class="steplead" data-c2 hidden>The case is most fun with real people and places: your chair as the victim, club members as suspects, your fête and clubhouse as the crime scene. If you'd rather not enter anyone, you get an invented club with invented characters.</p>
<div class="pick two-pick" role="radiogroup" aria-label="Cast">
<label class="pickcard"><input type="radio" name="besetzung" value="echt" checked><span><b><span data-c1>With your company</span><span data-c2 hidden>With your club</span></b><small><span data-c1>Your names, your rooms, your logo</span><span data-c2 hidden>Your names, your fête, your logo</span><br>recommended</small></span></label>
<label class="pickcard"><input type="radio" name="besetzung" value="fiktiv"><span><b><span data-c1>Fictional company</span><span data-c2 hidden>Fictional club</span></b><small><span data-c1>Invented company and characters</span><span data-c2 hidden>Invented club and characters</span><br>no data entry</small></span></label>
</div>
<p class="note" id="fiktivnote" hidden><span data-c1>You play in an invented company with invented characters – which one, the case will tell you. The steps for company, victim and suspects are skipped.</span><span data-c2 hidden>You play in an invented club with invented characters – which one, the case will tell you. The steps for club, victim and suspects are skipped.</span></p>
</fieldset>

<fieldset class="step" data-real><legend><span>2</span> <span data-c1>Your company</span><span data-c2 hidden>Your club</span></legend>
<div id="f-firma"></div>
<div class="field"><label for="logo"><span data-c1>Company logo</span><span data-c2 hidden>Club logo</span> <span class="opt">optional</span></label>
<div class="logobox"><img id="logoprev" alt="" hidden><input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><button type="button" class="linkbtn" id="logodel" hidden>Remove logo</button></div>
<span class="hint">Appears <span data-c1>on the case intranet</span><span data-c2 hidden>on the club website in the case</span>. PNG or SVG with a transparent background looks best.</span></div>
<label class="check" id="logorechte" hidden><input type="checkbox" name="logo_rechte"><span>We may use this logo for our <span data-c1>internal team event</span><span data-c2 hidden>club game</span>. *</span></label>
</fieldset>

<fieldset class="step" data-real><legend><span>3</span> <span data-c1>Victim and top boss</span><span data-c2 hidden>Victim and treasurer's report</span></legend>
<p class="steplead" data-c1>The victim is your boss – don't worry, it ends well. The top boss is above them, for example the group CEO or the board chair.</p>
<p class="steplead" data-c2 hidden>The victim is your chair (or president, chief …) – don't worry, it ends well. Add whoever is to receive the treasurer's report at the annual general meeting, for example the auditor or the mayor.</p>
<div id="f-opfer" class="person"></div>
<div id="f-boss" class="person"></div>
</fieldset>

<fieldset class="step" data-real><legend><span>4</span> The suspects</legend>
<p class="steplead">Five <span data-c1>colleagues</span><span data-c2 hidden>club members</span> (Premium and Premium Plus: six). One of them becomes the culprit at random – not even we know who in advance. Good picks are people who play along and can laugh at themselves.</p>
<div id="f-sus"></div>
</fieldset>

<fieldset class="step"><legend><span>5</span> Contact and invoice</legend>
<div class="two">
<div class="field"><label for="c_name">Your name *</label><input id="c_name" name="c_name" maxlength="120" autocomplete="name"></div>
<div class="field"><label for="c_email">Email *</label><input id="c_email" name="c_email" type="email" maxlength="160" autocomplete="email"><span class="hint">We send the game code and invoice here.</span></div>
</div>
<div class="two">
<div class="field"><label for="c_tel">Phone <span class="opt">optional</span></label><input id="c_tel" name="c_tel" type="tel" maxlength="40" autocomplete="tel"></div>
<div class="field"><label for="c_firma"><span data-c1>Company</span><span data-c2 hidden>Club</span> on the invoice <span class="opt">required when ordering as a company or club</span></label><input id="c_firma" name="c_firma" maxlength="120" autocomplete="organization"><span class="hint">You enter the billing address when paying; billing country and VAT ID further down.</span></div>
</div>
<div class="field"><span class="label">You are ordering as *</span>
<label class="check"><input type="radio" name="kunde" value="b2b"><span>Company, club or organisation</span></label>
<label class="check"><input type="radio" name="kunde" value="b2c"><span>Private individual</span></label>
<span class="hint">Private individuals have a statutory right of withdrawal (see <a href="terms.html#ruecktritt" target="_blank" rel="noopener">terms section 8</a>).</span></div>
<div id="billbox"></div>
</fieldset>

<fieldset class="step"><legend><span>6</span> Review and pay</legend>
<div class="summary" id="summary"></div>
<label class="check" id="zustimmungbox"><input type="checkbox" name="zustimmung"><span>Everyone we have entered by name knows about it and agrees to appear in the fictional case – including as victim or suspect. *</span></label>
<label class="check" id="ab18box" hidden><input type="checkbox" name="ab18"><span>All participants are at least 18 years old (required for <span data-c1>ARIA</span><span data-c2 hidden>the AI interrogation</span> in Premium Plus). *</span></label>
<label class="check ebcheck" id="ebbox" hidden><input type="checkbox" name="earlybird"><span><b>Early bird: <span class="ebp">25</span>% off.</b> I'd like the discount and am happy to give short feedback after the game and write a review. <a href="early-bird.html" target="_blank">Conditions</a></span></label>
<p class="hint" id="voucherhint">Voucher code, e.g. from Mordsteam Solo? Enter it in the next step when paying.</p>
<label class="check" id="nofbbox"><input type="checkbox" name="no_feedback"><span>The day after the game we'll send you a short feedback request by email. Tick here if you'd rather not receive it.</span></label>
<label class="check" id="sofortbox" hidden><input type="checkbox" name="sofort"><span>I expressly want you to set up my game round and provide the codes right after payment – we can still play whenever we like. I understand that as a private individual I thereby lose my right of withdrawal (at the latest once the round has been played). *</span></label>
<label class="check"><input type="checkbox" name="no_news"><span>No news by email, please. Otherwise we'll occasionally tell you about new Mordsteam cases – you can unsubscribe in every email with one click.</span></label>
<label class="check"><input type="checkbox" name="agb"><span>I accept the <a href="terms.html" target="_blank">terms</a> and have read the <a href="privacy.html" target="_blank">privacy policy</a>. *</span></label>
<p class="formerr" id="err" role="alert" hidden></p>
<div><button class="btn btn-red" type="submit" id="submit">Order and pay</button></div>
<p class="hint small" id="payhint">Payment is handled securely by Stripe (card, Apple Pay, Google Pay and more). You see the game code, instructions and organiser code right afterwards. No VAT charged (Austrian small business scheme). Prices in euros. You enter a voucher code (e.g. from Mordsteam Solo) in the payment step – it cannot be combined with the early bird discount.</p>
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
<p>Mordsteam e.U., owner Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, Austria (FN 689638z, Landesgericht Eisenstadt)<br>Email: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a></p>
<h2>2. Visiting the website</h2>
<p>The website is delivered via Cloudflare (Cloudflare, Inc., USA, and affiliated companies). Technically necessary connection data such as IP address, time, page requested and browser identifier are processed to deliver the site securely and quickly (Art. 6(1)(f) GDPR). Cloudflare is certified under the EU-US Data Privacy Framework.</p>
<p>To see how often which pages are visited, we use Cloudflare Web Analytics. It works without cookies and without storing anything in your browser and does not build profiles of individual visitors; we only see aggregated figures (e.g. page views, country, device type). The legal basis is our legitimate interest in improving the website (Art. 6(1)(f) GDPR). For operations, we also count server requests and emails sent only as numbers per day – without IP addresses, recipients or content.</p>
<p>We use no cookies and do not track individual visitors. Fonts are hosted locally; no data is sent to Google. Without cookies, your browser only stores what the site needs: the chosen currency, a draft of the order form and your game progress (the browser’s local storage). To show your local currency, Cloudflare determines the country from your IP address; we do not store the IP address.</p>
<h2>3. Feedback after the game</h2>
<p>The day after the game ends, we send the person who ordered a single email with a link to a feedback form (Art. 6(1)(f) GDPR – we want to improve our cases; for early bird orders part of the discount conditions, Art. 6(1)(b) GDPR). You can opt out of this email when ordering. We store your answers without reference to the people in the case. We only publish a review if you expressly agree in the form – anonymously or under the name you provide for it. You can withdraw your consent at any time by email; we will then remove the review from the website.</p>
<p>After a Teams round ends, we ask on every game device – voluntarily and without names – how the game was (stars, difficulty, optionally comments and a few words for the website). This is stored with the team name and round, without further personal data. The words are only published with express consent – anonymously or with the first name you enter – and only after we approve them (Art. 6(1)(a) GDPR).</p>
<p>For Mordsteam Friends, we ask every player right in the browser after the joint reveal for feedback (stars, difficulty, optionally comments and a few words for the website). This is voluntary. It is stored with the first name from the round; the words are only published with express consent – anonymously or with the first name – and only after we approve them (Art. 6(1)(a) GDPR).</p>
<p>For Mordsteam Solo, we ask for your feedback right in the browser at the end of the game (stars, difficulty, optionally a sentence and suggestions for improvement). This is voluntary. It is stored with your player name; your words are only published if you expressly agree – anonymously, with your first name or with your first name and the initial of your surname – and only after we approve them. After a replay we briefly ask once how it went; we never publish these answers.</p>
<h2>4. Order and payment</h2>
<p>For an order we process the chosen game with package or variant, the number of teams or players, the game language, your name, your email address, whether you order as a company or private individual, optionally phone and invoice company, and the details for personalising the case where the game provides for it (e.g. company or group name, place, rooms, names, title, role or quirks of the people who appear in the case, optionally your logo). The purpose is performance of the contract (Art. 6(1)(b) GDPR). If you choose a fictional cast, you don't provide any personal data for the personalisation.</p>
<p>Payment and invoicing are handled by Stripe (Stripe Payments Europe, Ltd., Dublin, Ireland). Stripe receives your payment and billing data for this – for orders as a company, club or organisation also your VAT number – and processes it under its own responsibility; we never see card details. If you provide a VAT ID as a business from an EU member state, we check it before payment via the European Commission's VAT Information Exchange System (VIES) (Art. 6(1)(c) GDPR). For purchases by private individuals in the United Kingdom, Link (Stripe group) is the seller; Link receives your payment and billing data as well as the order number and product and processes them under its own responsibility (Link privacy notice: link.com). If you withdraw from a contract, we process the order number, name, email address, time and any note to handle and document the withdrawal (Art. 6(1)(b) and (c) GDPR). We send the order confirmation and the feedback email via the email service Resend (Resend, Inc., USA; sent via servers in the EU, safeguarded by EU standard contractual clauses). News by email to customers: see section 7. We keep invoice and payment data for as long as tax retention obligations require (in Austria usually seven years).</p>
<h2>5. Game round</h2>
<p>For the game round we store the personalisation details, the names of the teams or players, times, answer attempts and hints used in a database at Cloudflare. On the players' devices only a login key is stored in the browser's local storage (no cookie, no tracking). 30 days after the game ends we delete the game round including game progress, answer attempts, chat histories and, where applicable, logo – if a case is never played, 13 months after the order at the latest; the personal data of the personalisation is then removed from the order. To develop our cases further, we keep anonymous statistics (e.g. playing times, number of wrong attempts and hints) without names.</p>
<p><b>Mordsteam Friends:</b> The person ordering enters the first names of the players and one quirk each from a fixed list, and confirms that everyone agrees. We only use this information to set up the fictional case for the group (Art. 6(1)(b) GDPR). Whoever picks their name via the invitation link gets their own game progress; the others in the group only see who has joined or finished, and only see the ranking and times at the joint reveal. The names are stored only in the game round, not in the order. 30 days after the reveal we delete the round including names and game progress, a round that is never revealed 13 months after the order at the latest.</p>
<h2>6. AI characters in the game</h2>
<p>In some games or variants you can chat with an AI-controlled character (stated in the game description). What you write in the chat is sent together with the invented case data to our AI provider Anthropic so that the character can reply (Art. 6(1)(b) GDPR). We replace the real names from the personalisation (e.g. company, people, rooms) with placeholders before sending and only reinsert them in the reply – even if they are typed into the chat. The players' devices only connect to mordsteam.com, not directly to the AI provider. Anthropic processes the data as a processor, does not use it to train its models and deletes inputs and outputs after 30 days by default. The transfer to the USA is based on certification under the EU-US Data Privacy Framework or on EU standard contractual clauses.</p>
<p>In Mordsteam Friends Mystery Night Plus, the AI plays the players' doubles. For this we transmit no names, only placeholders, the chosen quirk from the list, the invented case data and the questions asked in the interrogation room; names someone types into a question are also replaced with placeholders first. Interrogation histories are stored with the game round and deleted with it.</p>
<p>In Mordsteam Solo Plus, the AI plays invented suspects. For this we only transmit the invented case data and your questions in the interrogation room – not your name. Please do not type personal data into your questions. We delete the conversations together with your playthroughs, 30 days after your last game ended.</p>
<p>In Mordsteam Teams Premium Plus, the AI plays ARIA, the assistant on the case intranet, and – in the special assignment for fast teams – a character being interrogated. We replace real names (company, boss, suspects, rooms) with placeholders before transmission; only these placeholders, the invented case data and the chat messages are transmitted. We delete the conversations with the game round, 30 days after the game ended.</p>
<p>Please don't enter real personal data in the chat – the AI character doesn't need it and only knows the world of the game. The number of messages per game round is limited. We store the chat history with the game round and delete it 30 days after the game ends. AI characters are labelled as AI; their answers may contain errors.</p>
<h2 id="newsletter">7. Newsletter and customer analysis</h2>
<p><b>Signing up on the website:</b> If you sign up for the newsletter, we store your email address, the language, the text of your consent and the time of sign-up and confirmation. You are only signed up once you click the link in our confirmation email (double opt-in). The legal basis is your consent (Art. 6(1)(a) GDPR, § 174(3) Austrian Telecommunications Act 2021); you can withdraw it at any time via the unsubscribe link in every email. To prevent abuse we store a hashed short value of your IP address for 24 hours.</p>
<p><b>Customers:</b> We occasionally send news about new Mordsteam cases to the email address from a paid order (§ 174(4) Austrian Telecommunications Act 2021, Art. 6(1)(f) GDPR) – unless you opted out when ordering. Beforehand we check the address against the ECG list of the Austrian regulator RTR; if it is listed, you won't receive a newsletter. You can unsubscribe in every email with one click.</p>
<p><b>Sending:</b> For sending we transfer your email address, first name and language to our email service Resend (Resend, Inc., USA; safeguarded by EU standard contractual clauses). After you unsubscribe we keep the address marked as “unsubscribed” so that it is not added to the list again.</p>
<p><b>Analysis:</b> Links in our newsletters contain a short tag (e.g. <code>?nl=2026-12</code>). It is not stored in your browser, only passed on to the next page, so that we can count how many visits and orders a newsletter brought; visits are counted without personal data. We also analyse whether and how often customers order again and whether a Solo voucher was redeemed (Art. 6(1)(f) GDPR – we want to know which games and newsletters are worthwhile). Only we use this analysis; it does not lead to any automated decisions.</p>
<h2>8. Contact form and email</h2>
<p>If you write to us using the contact form or by email, we process your name, email address and message to answer your enquiry (Art. 6(1)(b) or (f) GDPR). Messages from the form are delivered to our mailbox via our email service Resend (Resend, Inc., USA; sent via servers in the EU) and stored there. To prevent abuse, we also store a hashed short value of your IP address with the time and delete it after 24 hours. Our emails are processed via Apple iCloud.</p>
<h2>9. Your rights</h2>
<p>You have the right to access, rectification, erasure, restriction of processing, data portability and objection. Write to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. You can also lodge a complaint with the Austrian Data Protection Authority: <a href="https://www.dsb.gv.at">www.dsb.gv.at</a>.</p>
<p>Last updated: October 2026</p>
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
<p>Registered seat: Pamhagen<br>Company register number: FN 689638z<br>Register court: Landesgericht Eisenstadt<!--UID_EN--></p>
<h2>Business purpose</h2>
<p>Development and online sale of digital murder-mystery and puzzle games for companies, clubs and private individuals.</p>
<h2>VAT</h2>
<p>Small business under § 6 (1) no. 27 of the Austrian VAT Act – no VAT is charged.<!-- UID --></p>
<h2>Trade law</h2>
<p>Member of the Austrian Economic Chamber, Burgenland<br>Trade: Services in automatic data processing and information technology (non-regulated trade, freies Gewerbe)<br>GISA number (Austrian trade register): 40212968<br>Trade authority: Bezirkshauptmannschaft Neusiedl am See<br>Applicable law: Austrian Trade Act (Gewerbeordnung), available at <a href="https://www.ris.bka.gv.at">www.ris.bka.gv.at</a></p>
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
<p class="small">Last updated: October 2026 · This is a translation for information. The <a href="/agb.html" hreflang="de">German version</a> is legally binding.</p>

<h2>1. Provider and scope</h2>
<p>The provider is Mordsteam e.U., owner Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, Austria, company register number FN 689638z, register court Landesgericht Eisenstadt, email: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a> (“we”). These terms apply to all orders via mordsteam.com, from businesses as well as consumers (“you”). Deviating conditions only apply if we agree to them in writing. The version valid at the time of your order applies.</p>

<h2>2. Our service</h2>
<p>We provide digital murder-mystery games that you play online in your browser – depending on the game, together in teams, as a group or on your own (“game round”). What exactly is included follows from the description of the chosen game when ordering: game, package or variant, number of teams or players, playing time and, where applicable, personalisation. After payment you receive access codes with which you open and start the game round. Nothing is delivered physically.</p>
<ul>
<li>The game round is playable for 12 months from purchase. How often it can be started is stated in the game description: Teams and Friends rounds can be started once, Solo cases can be replayed up to three times within 30 days of the first playthrough (with a newly drawn killer). A started round runs for the stated playing time or chosen time window and ends. Once started, the clock runs without interruption; pausing is not possible.</li>
<li>For Mordsteam Teams, the number of teams is limited to the number booked; up to 5 more devices per team can follow along.</li>
<li>With Mordsteam Friends, every person entered plays on their own device via the invitation link. Anyone who doesn't play remains a suspect in the case; the round stays solvable for the others. The round ends with the joint reveal – once everyone has finished, at the latest when the playing time or the chosen time window is over.</li>
<li>To play you need an internet-enabled device with an up-to-date browser. We are not responsible for web filters or blocks by your IT; we recommend opening mordsteam.com/spiel beforehand on the intended device.</li>
<li>All cases are entirely fictional. Names and details you enter are built into a fictional story; the accusations made in it are not meant seriously.</li>
</ul>

<h2>3. Conclusion of the contract</h2>
<p>The presentation of the packages on the website is not a binding offer. In the order form you choose the game, package or variant, the number of teams or players and the game language and – where the game offers personalisation – enter the details for your case. Before submitting you see a summary with the total price and can check and correct all entries. By clicking “Order and pay” and paying via Stripe you make a binding offer. The contract is concluded as soon as payment has succeeded and we show you the codes or confirm them by email.</p>
<p>We send you the contract details (game, package or variant, scope, price, game language) and the link to these terms with the confirmation email; you can view and save these terms on this page at any time. The contract language is German; this English version is for information.</p>

<h2>4. Prices, payment and discounts</h2>
<ul>
<li>All prices are final prices. You pay in euros; with a billing country of the United Kingdom in pounds sterling, with the USA, Canada or Mexico in US dollars. The amount shown in the order form applies. We are a small business; under § 6 (1) no. 27 of the Austrian VAT Act no VAT is charged. If a business from another EU member state orders with a valid VAT ID, it accounts for VAT in its own country (reverse charge). For orders from countries outside the EU, the service is not subject to Austrian VAT.</li>
<li>Payment is made in advance via our payment provider Stripe (e.g. card, Apple Pay, Google Pay). You receive the invoice by email. If you order as a company, club or organisation, the invoice includes your company address and – if provided – your VAT number; we check VAT numbers from EU member states via the EU VIES system before payment.</li>
<li>For private individuals in the United Kingdom, Link, a service of the Stripe group, is the seller and contractual partner for payment (merchant of record). Link charges UK VAT (included in the price), processes the payment and sends the payment confirmation and invoice; Link's terms apply in addition. Mordsteam provides the game round; these terms apply to the content and the game. Businesses, clubs and organisations in the United Kingdom pay in pounds via Stripe; the invoice contains no Austrian VAT, and any UK VAT is to be accounted for by the recipient (reverse charge).</li>
<li>Discounts and vouchers (e.g. early bird) apply under the conditions published for them, cannot be combined and cannot be exchanged for cash. The <a href="early-bird.html">early bird conditions</a> form part of this contract if you choose the early bird discount.</li>
<li>Solo voucher: every Mordsteam Solo case you buy comes with a €5 voucher code after your first playthrough. It can be redeemed once, only on an order of Mordsteam Friends or Teams (not on Solo cases). One voucher per order; it cannot be combined with the early bird or other offers.</li>
</ul>

<h2>5. Your details and obligations</h2>
<ul>
<li>You only enter names, roles and details of people who know about it and agree to appear in the fictional case – including as victim or suspect. You confirm this when ordering.</li>
<li>Where the game offers it, you only upload a logo if you are allowed to use it for this purpose. It appears exclusively within your game round.</li>
<li>Details must not contain insulting, discriminatory or unlawful content. We may refuse such orders; in that case we refund any amount already paid.</li>
<li>You are responsible for the accuracy of your details and the consent of the people named.</li>
</ul>

<h2>6. AI characters in the game</h2>
<ul>
<li>Some games or variants include a character you talk to by chat and which is controlled by artificial intelligence (“AI character”). Which ones is stated in the game description. Variants with an AI character are intended only for participants aged 18 and over; you confirm this when ordering.</li>
<li>In Mordsteam Friends Mystery Night Plus, an AI plays the players' doubles (“AI doubles”) – with placeholders instead of real names and only with the chosen quirk from the list. By ordering you confirm that all players agree to this.</li>
<li>In Mordsteam Solo Plus, an AI plays the invented suspects in the interrogation room. Solo Plus is for people aged 18 and over; you confirm this when ordering. The AI answers are generated live and may occasionally be inaccurate – the case can always also be solved with the hints.</li>
<li>AI characters are labelled as AI, only know the invented world of the case and can make mistakes. Their answers are part of the game and not information or advice. Please don't enter real personal data in the chat.</li>
<li>The number of messages per game round is limited; the limit is shown in the game. If the AI is temporarily unavailable, you automatically receive all information needed to solve the case – the case remains solvable.</li>
</ul>

<h2>7. Rights of use</h2>
<p>Cases, texts, graphics and software are protected by copyright. You receive the simple, non-transferable right to play your game round for your own or internal use. You may not publish, pass on or reuse case content, solutions or codes for other rounds. You are welcome to share certificates, results and photos of your game round.</p>

<h2 id="ruecktritt">8. Right of withdrawal for consumers</h2>
<p>This right of withdrawal applies to consumers only. If you order as a company, club or for your professional activity, there is no statutory right of withdrawal.</p>
<p><b>Withdrawal period:</b> As a consumer you may withdraw from the contract within 14 days of its conclusion without giving reasons – unless the right of withdrawal has expired earlier.</p>
<p><b>Immediate start and expiry:</b> When ordering as a private individual, you expressly request that we set up your game round and provide the codes right after payment – you still play whenever you like – and confirm that you know you thereby lose your right of withdrawal. Our service is a game provided online. Insofar as it counts as digital content, the right of withdrawal expires when the codes are provided following our email confirmation (§ 18 (1) no. 11 FAGG). Insofar as it counts as a (digital) service, it expires once the game round has been fully performed, i.e. played and ended (§ 18 (1) no. 1 FAGG); for Mordsteam Friends that is the joint reveal.</p>
<p><b>Withdrawal before the game ends:</b> If you withdraw before the right has expired, we refund all payments within 14 days using the original means of payment. If the game round has not been started, we refund the full price. If it has already been started, you pay a proportionate amount for the service provided up to the withdrawal (§ 16 FAGG), because you expressly requested the immediate start. It is based on the playing time elapsed up to the withdrawal in relation to the total playing time of the booked variant; setting up and personalising the game round has already been fully performed.</p>
<p><b>How to withdraw:</b> Use the “Withdraw from contract” function on our website or send us a clear statement, e.g. by email to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. To meet the deadline it is sufficient to send the statement before the period expires. You may use this model form, but you don't have to:</p>
<blockquote class="small">To Mordsteam e.U., Martin Kriegler, Sportplatzgasse 16, 7152 Pamhagen, Austria, office@mordsteam.com: I/we hereby withdraw from the contract concluded by me/us for the following service: … · Ordered on: … · Order number: … · Name: … · Address: … · Date: …</blockquote>
<p id="uk-refund"><b>Private customers in the United Kingdom (purchase via Link):</b> you can request a full refund within <b>14 days of purchase</b> as long as the game round has not been started or the code has not been redeemed – by email to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a> or via Link support (link.com). Refunds are made by Link to the original means of payment.</p>

<h2>9. Warranty and faults</h2>
<p>The statutory warranty applies, for consumers under the Austrian Consumer Warranty Act (VGG). If something doesn't work as described, please let us know as soon as possible at <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. We will fix the fault or provide a new game round; if that is not possible, we refund the price in full or in part.</p>

<h2>10. Liability</h2>
<p>We are liable without limitation for intent and gross negligence and for personal injury. We are not liable to businesses for slight negligence; towards consumers, liability under the mandatory provisions of the Austrian Consumer Protection Act remains unaffected. Towards businesses our liability is also limited to the order value, as far as legally permitted. We are not liable for outages beyond our control (such as problems with your internet connection, your IT or third-party providers), but we're happy to help find a solution.</p>

<h2>11. Storage and deletion</h2>
<p>30 days after the end of the game round we delete the round including game progress, personalisation and, where applicable, logo. A game round is playable for 12 months from purchase; we delete a round that has not been started, including the personal data entered, 13 months after the order at the latest. Companies receive no refund. Consumers may request, even after this period, that we create the game round again (you then enter the details again) as long as we offer the case; if we no longer offer it, we refund the price paid. Details are in the <a href="privacy.html">privacy policy</a>.</p>

<h2>12. Complaints and dispute resolution</h2>
<p>Please send complaints to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>; we'll get back to you as soon as we can. We are not obliged to take part in proceedings before a consumer arbitration body. In Austria, the <a href="https://www.ombudsstelle.at" target="_blank" rel="noopener">Internet Ombudsstelle</a> is responsible for disputes from online transactions.</p>

<h2>13. Applicable law and jurisdiction</h2>
<p>Austrian law applies, excluding the UN Convention on Contracts for the International Sale of Goods and conflict-of-law rules. Consumers retain the protection of mandatory provisions of the country in which they have their habitual residence. The place of jurisdiction for businesses is the court with subject-matter jurisdiction for 7152 Pamhagen.</p>

<h2>14. Final provisions</h2>
<p>If any provision of these terms is invalid, the rest remains valid. Towards businesses, the invalid provision is replaced by a rule that comes closest to its purpose.</p>
</div></main>''')

P["early-bird"] = dict(title="Early bird – Mordsteam", desc="Early bird until 30 November 2026: 25% off your first Mordsteam game – the conditions.",
 body='''<main class="page"><div class="wrap prose">
<div class="eyebrow">Early bird</div>
<h1 class="h1-page">25% off your first Teams or Friends game</h1>
<p class="lead">Mordsteam has just launched. Help us make our cases even better – and play your first case at 25% off. The offer applies to orders placed by 30 November 2026.</p>
<h2>How it works</h2>
<ul>
<li>When ordering, tick the <b>early bird</b> box in the last step. The discount is deducted automatically at checkout – no code needed.</li>
<li>Valid for Mordsteam Teams – all packages, any number of teams – and for Mordsteam Friends. Mordsteam Solo is excluded.</li>
</ul>
<h2>What we ask in return</h2>
<ul>
<li>The day after your game we'll send you a short email with a feedback form. You give us honest feedback – it takes about 5 minutes. With Mordsteam Friends the game asks you right after the reveal; there is no email.</li>
<li>You write a short review. Whether and under which name we show it on mordsteam.com is up to you.</li>
</ul>
<h2>The fine print</h2>
<ul>
<li>One discounted order per company or group, for your first game.</li>
<li>Cannot be combined with other vouchers.</li>
<li>Valid for orders placed up to and including 30 November 2026. You can play later – the discount stays.</li>
</ul>
<p><a class="btn btn-red" href="order.html">Order a Teams case</a></p>
</div></main>''')

P["feedback"] = dict(title="Feedback – Mordsteam", robots="noindex, nofollow", desc="Feedback on your Mordsteam case.",
 scripts='<script src="/assets/feedback.js"></script>',
 body='''<main class="page"><div class="wrap">
<div class="eyebrow">Feedback · Case 001</div>
<h1 class="h1-page">How was your team event?</h1>
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
<p>As a <b>private individual</b> you can withdraw from your contract with us here as long as the right of withdrawal exists: within 14 days of ordering and before the game round has been played and ended. Orders placed as a company, club or organisation have no statutory right of withdrawal. Details are in our <a href="terms.html#ruecktritt">terms, section 8</a>. Private customers in the United Kingdom bought via Link; the refund is then made by Link to the original means of payment.</p>
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


P["newsletter"] = dict(title="Newsletter – Mordsteam", desc="Be the first to hear about new Mordsteam cases: the Mordsteam newsletter.", scripts='<script src="/assets/newsletter.js"></script>',
 body='''<main class="page"><div class="wrap prose">
<div class="eyebrow">Newsletter</div>
<h1>Be the first to hear about new cases</h1>
<div class="note" id="nl-status" role="status" hidden></div>
<p>New cases for Teams, Friends and Solo, seasonal mysteries, the occasional offer: we get in touch when there's something to investigate – and no more often. You can unsubscribe in every email with one click.</p>
<form id="nlf" class="form" novalidate>
<div class="field"><label for="nl-email">Email</label><input id="nl-email" name="email" type="email" autocomplete="email" maxlength="200" required></div>
<label class="check"><input type="checkbox" name="consent"><span>Yes, send me news about new Mordsteam cases by email. I can unsubscribe at any time with one click.</span></label>
<div class="hp" aria-hidden="true"><label for="nl-web">Website</label><input id="nl-web" name="website" tabindex="-1" autocomplete="off"></div>
<p class="small">After submitting you'll receive an email with a confirmation link. You are only signed up once you click it. More in our <a href="privacy.html#newsletter">privacy policy</a>.</p>
<p class="formerr" id="nlerr" role="alert" hidden></p>
<div><button class="btn btn-red" type="submit">Sign up</button></div>
</form>
</div></main>''')

for name, p in P.items():
    out = page(name, p["title"], p["desc"], p["body"], p.get("robots"), p.get("scripts", ""), p.get("home", False), p.get("promo", False))
    out = finish(out, "en")
    with open(os.path.join(ROOT, "en", name + ".html"), "w") as f:
        f.write(out)
# ---------- products.html: eine Seite mit Angebot, Preisen, Erstattung und allen Rechtstexten (für die Prüfung durch Paddle) ----------
# Auch im Teaser-Modus erreichbar (build.sh), nicht verlinkt, noindex. Rechtstexte kommen aus P["terms"], P["privacy"], P["imprint"].
import re as _re
def _inner(name):
    b = P[name]["body"]
    b = _re.sub(r'^<main[^>]*><div class="wrap prose">', "", b.strip()); b = _re.sub(r"</div></main>$", "", b.strip())
    b = _re.sub(r'href="(?:/en/)?(terms|privacy|imprint)\.html(#[^"]*)?"', lambda m: f'href="{m.group(2) or "#" + m.group(1)}"', b)
    b = _re.sub(r'<a href="(?!https?:|mailto:|#)[^"]*"[^>]*>(.*?)</a>', r"\1", b)   # Links auf Seiten, die im Teaser fehlen
    b = b.replace("<h1>", "<h2>").replace("</h1>", "</h2>")
    return b
PROD = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Products, prices and policies – Mordsteam</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/assets/style.css">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
</head>
<body>
<header class="header"><div class="wrap"><a class="logo" href="/" aria-label="Mordsteam">{LOGO}<span class="wm-box"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span></span></a>
<nav class="nav-desktop" aria-label="Contents"><a href="#products">Products</a><a href="#refunds">Refunds</a><a href="#terms">Terms</a><a href="#privacy">Privacy</a><a href="#imprint">Imprint</a></nav></div></header>
<main class="page"><div class="wrap prose">
<h1>Mordsteam – products, prices and policies</h1>
<p><b>Mordsteam e.U.</b> (sole proprietor: Martin Kriegler) · Sportplatzgasse 16, 7152 Pamhagen, Austria · Company register FN 689638z · <a href="mailto:office@mordsteam.com">office@mordsteam.com</a></p>
<p>Mordsteam sells <b>digital murder-mystery games that are played in the web browser</b> on a phone, tablet or laptop – no download, no physical goods. The players solve a case with evidence, interrogations and puzzles; in some games their own names appear in the case file, and the Plus versions include AI characters that players can question. Games are available in German and English.</p>
<p><b>Delivery:</b> immediately after payment, by email and on the confirmation page (game code, links and instructions). Each purchase can be played once within 12 months (Solo cases: up to three replays within 30 days of the first playthrough).</p>

<h2 id="products">Products and prices</h2>
<p>Prices are final prices. Customers in the USA, Canada and Mexico pay in US dollars, customers in the EU and the rest of the world in euros, both via Stripe (no VAT charged – Austrian small business scheme; reverse charge for EU businesses with a VAT ID). <b>Businesses in the United Kingdom pay in pounds via Stripe</b> (reverse charge). <b>Private customers in the United Kingdom pay in pounds via Link</b> (Stripe), which is the merchant of record for these orders; their prices include UK VAT.</p>
<div style="overflow-x:auto"><table class="grid">
<tr><th>Product</th><th>What you get</th><th>Price (EUR)</th><th>United Kingdom (GBP, incl. VAT)</th><th>USA, Canada, Mexico (USD)</th></tr>
<tr><td><b>Mordsteam Teams – Basic</b></td><td>Personalised case for one team of 3–6 players, 50-minute countdown</td><td>€89 per team</td><td>£89 per team</td><td>$99 per team</td></tr>
<tr><td><b>Mordsteam Teams – Premium</b></td><td>As Basic plus act 2 with new evidence, 70 minutes, six suspects</td><td>€119 per team</td><td>£119 per team</td><td>$139 per team</td></tr>
<tr><td><b>Mordsteam Teams – Premium Plus</b></td><td>As Premium plus an AI-powered finale, 90 minutes</td><td>€149 per team</td><td>£149 per team</td><td>$169 per team</td></tr>
<tr><td><b>Mordsteam Friends – mystery night</b></td><td>Murder-mystery night for 4–8 friends, everyone plays on their own phone, 50-minute countdown</td><td>€29 for 4 people, +€5 per additional person</td><td>£29 for 4 people, +£5 per additional person</td><td>$33 for 4 people, +$6 per additional person</td></tr>
<tr><td><b>Mordsteam Friends – mystery night Plus</b></td><td>As above with AI interrogation room and five instead of three questions, 75-minute countdown</td><td>€49 for 4 people, +€8 per additional person</td><td>£49 for 4 people, +£8 per additional person</td><td>$56 for 4 people, +$9 per additional person</td></tr>
<tr><td><b>Mordsteam Solo 001 / 002</b></td><td>A case for one person, 35–40-minute countdown</td><td>€8.90</td><td>£8.99</td><td>$9.99</td></tr>
<tr><td><b>Mordsteam Solo Plus</b></td><td>A case for one person with AI interrogation room, 45-minute countdown</td><td>€15.90</td><td>£15.99</td><td>$17.99</td></tr>
</table></div>
<p class="small">Introductory offer until 30 November 2026: 25% off the first Teams or Friends game in exchange for honest feedback.</p>

<h2 id="refunds">Refund policy</h2>
<p><b>Private customers in the United Kingdom (purchase via Link):</b> you can request a full refund within <b>14 days of purchase</b> as long as the game round has not been started or the code has not been redeemed – by email to <a href="mailto:office@mordsteam.com">office@mordsteam.com</a> or via Link support (link.com). Refunds are made by Link to the original means of payment.</p>
<p><b>Consumers in the EU and elsewhere:</b> the statutory 14-day right of withdrawal applies as described in section 8 of the <a href="#terms">terms</a>. If the game round has not been started, we refund the full price.</p>
<p><b>Technical problems:</b> if something does not work as described, contact us at <a href="mailto:office@mordsteam.com">office@mordsteam.com</a> – see section 9 of the terms.</p>

<hr>
<section id="terms">{_inner("terms")}</section>
<hr>
<section id="privacy">{_inner("privacy")}</section>
<hr>
<section id="imprint">{_inner("imprint")}</section>
</div></main>
<footer class="footer"><div class="wrap"><span class="brand"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span></span><span>© 2026 Mordsteam e.U.</span></div></footer>
</body>
</html>
'''
with open(os.path.join(ROOT, "products.html"), "w") as f:
    f.write(PROD)
# Englische Startseite im Teaser-Modus (teaser/en/index.html, 6.10.2026): Angebotsseite statt „Coming soon“,
# damit Paddle Produkt, Preise und Rechtstexte prüfen kann. Kein Bestellen – der Shop öffnet erst mit dem Go-live.
_LAND_HERO = """<h1>Murder-mystery games you play in the browser</h1>
<p class="lead">Solve a case together – with your team at work, with friends at home, or on your own. Evidence, interrogations and puzzles on your phone, tablet or laptop. No app, no download, no acting.</p>
<div class="ms-cards">
<div class="ms-card"><div class="ms-k">Teams</div><h3>Team building</h3><p>Several teams compete to solve the same case – personalised with your company, rooms and colleagues. 50, 70 or 90-minute countdown.</p><p class="ms-p">from €89 per team</p></div>
<div class="ms-card"><div class="ms-k">Friends</div><h3>Mystery night</h3><p>4–8 friends, everyone investigates on their own phone – together on one evening or whenever it suits over a few days. One of you is the culprit.</p><p class="ms-p">from €29</p></div>
<div class="ms-card"><div class="ms-k">Solo</div><h3>A case for one</h3><p>Short, self-contained cases for one person, 35–45 minutes, with an AI interrogation room in the Plus version.</p><p class="ms-p">from €8.90</p></div>
</div>
<h2>How it works</h2>
<ol><li>Choose a game and package, enter your details (names, company or friends) and pay securely.</li><li>You receive the links and codes immediately by email and on the confirmation page.</li><li>Open the case file whenever you're ready – the countdown starts when you start the case.</li></ol>
<p class="small">Payment is processed by Stripe; private customers in the United Kingdom buy via Link (Stripe), which acts as merchant of record. Questions: <a href="mailto:office@mordsteam.com">office@mordsteam.com</a></p>
<hr>"""
LAND = PROD.replace("<title>Products, prices and policies – Mordsteam</title>", "<title>Mordsteam – murder-mystery games for teams, friends and solo</title>\n<meta name=\"description\" content=\"Digital murder-mystery games played in the browser: team building for companies, mystery nights for friends and solo cases.\">\n<link rel=\"alternate\" hreflang=\"de\" href=\"https://mordsteam.com/\">\n<link rel=\"alternate\" hreflang=\"en\" href=\"https://mordsteam.com/en/\">\n<style>.ms-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:18px 0 26px}.ms-card{background:#fff;border:1px solid var(--line,#ddd);padding:16px 18px}.ms-card h3{margin:4px 0 6px}.ms-card p{margin:0 0 8px}.ms-k{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--red,#B3261E)}.ms-p{font-weight:600}.ms-lang{margin-left:14px;font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.1em}.ms-lang a{color:inherit}.ms-foot a{color:inherit;margin-right:12px}.ms-lang-m{margin-left:auto}@media (min-width:1080px){.ms-lang-m{display:none}}</style>", 1)
LAND = LAND.replace('<a href="#imprint">Imprint</a></nav>', '<a href="#imprint">Imprint</a><span class="ms-lang"><a href="/?lang=de" hreflang="de" lang="de">DE</a> · <b>EN</b></span></nav><span class="ms-lang ms-lang-m"><a href="/?lang=de" hreflang="de" lang="de">DE</a> · <b>EN</b></span>', 1)
_h1 = '<h1>Mordsteam – products, prices and policies</h1>'
assert LAND.count(_h1) == 1
LAND = LAND.replace(_h1, _LAND_HERO + '\n<h2>About us</h2>', 1)
LAND = LAND.replace('<span>© 2026 Mordsteam e.U.</span></div></footer>', '<span class="ms-foot"><a href="#products">Prices</a><a href="#refunds">Refunds</a><a href="#terms">Terms</a><a href="#privacy">Privacy</a><a href="/en/imprint.html">Imprint</a><a href="/?lang=de" lang="de">Deutsch</a></span><span>© 2026 Mordsteam e.U.</span></div></footer>', 1)
assert "Coming soon" not in LAND and "ms-cards" in LAND and 'ms-lang' in LAND and 'ms-foot' in LAND
# Seit 7.10.2026 liegt sie als teaser/en/angebot.html bereit; /en/ zeigt wieder „Coming soon“ (teaser/en/index.html, von Hand gepflegt).
# build.sh nimmt die Angebotsseite nur, solange ANGEBOT_SEITE=1 gesetzt ist.
with open(os.path.join(ROOT, "..", "teaser", "en", "angebot.html"), "w") as f:
    f.write(LAND)
# Vorübergehend für die Paddle-Prüfung (Okt. 2026): dieselbe Angebotsseite auch unter "/", ohne Sprachumschalter
# (der DE-Link würde auf sich selbst zeigen). build.sh nimmt sie nur, solange ANGEBOT_SEITE=1 gesetzt ist.
ROOTP = LAND
for _a, _b in [('<span class="ms-lang"><a href="/?lang=de" hreflang="de" lang="de">DE</a> · <b>EN</b></span></nav><span class="ms-lang ms-lang-m"><a href="/?lang=de" hreflang="de" lang="de">DE</a> · <b>EN</b></span>', '</nav>'),
               ('<a href="/?lang=de" lang="de">Deutsch</a></span>', '</span>'),
               ('<link rel="alternate" hreflang="de" href="https://mordsteam.com/">', '<link rel="canonical" href="https://mordsteam.com/">')]:
    assert ROOTP.count(_a) == 1, _a
    ROOTP = ROOTP.replace(_a, _b, 1)
assert "?lang=de" not in ROOTP
with open(os.path.join(ROOT, "..", "teaser", "paddle-root.html"), "w") as f:
    f.write(ROOTP)
print("ok", len(P))
# Fotokarten auf den Fallseiten (DE und EN) wieder einsetzen – die englischen Seiten wurden gerade neu geschrieben
import subprocess
subprocess.run(["node", os.path.join(os.path.dirname(os.path.abspath(__file__)), "site_bilder.mjs")], check=True)
