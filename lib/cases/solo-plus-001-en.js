// Mordsteam Solo Plus 001 – “The Last Vintage” (English text layer)
// Same ids, stages, solutions, times and option codes as solo-plus-001.js. Only player-facing texts differ.
// The server merges { ...DE, ...EN } for English runs. Logic (decoyOf, solution, times, searched spots) comes from the DE module.
import * as DE from "./solo-plus-001.js";

const { hm, fmt, tOf, AFTER, searched, spotOf, decoyOf, CULPRITS, VERHOER_MAX, HINT_PENALTY, WRONG_PENALTY, LIMIT_MIN } = DE;
const ORDER = CULPRITS;
const cap = (x) => x[0].toUpperCase() + x.slice(1);

export const TITLE = "The Last Vintage";
export const UI = {
  clock: "Winery", until: "until the police arrive", late: "Police waiting", stamp: "THE LAST VINTAGE", fb: "the winery case",
  cert: "and unmasked the culprit before the police arrived from Krems.", caseNo: "SOLO PLUS",
  stages: { 2: "New evidence: the ventilation and the cellar", 3: "New evidence: the party – and the interrogation room is open", 4: "New evidence: the key" },
};

export const SUSPECTS = {
  leopold: { name: "Leopold Aigner", role: "Son, 41", motive: "Wanted to sell the winery to an investor. That very morning his father changed his will – in Hanna’s favour." },
  hanna: { name: "Hanna Aigner", role: "Daughter and cellar master, 36", motive: "In front of all the guests, her father accused her of ruining the vintage – and he wanted to take the cellar away from her." },
  mirko: { name: "Mirko Petrović", role: "Foreman, 50", motive: "Ferdinand accused him of selling wine off the books. He was due to be sacked on Monday." },
  clemens: { name: "Dr. Clemens Rauch", role: "Wine merchant from Vienna", motive: "Ferdinand had discovered that Rauch was sticking Aigner labels on other people’s wine, and meant to report him to the police." },
  sabine: { name: "Sabine Hofer", role: "Neighbouring winemaker", motive: "A feud over the track up to the Kellerberg vineyard. Ferdinand had closed it off and was taking her to court." },
};

// For the AI prompts (second person) and the resolution (full sentences) – same content as SUSPECTS.motive
const YOU = {
  leopold: { role: "Ferdinand’s son, 41", rel: "You wanted to sell the winery to an investor. That very morning your father changed his will – in Hanna’s favour." },
  hanna: { role: "Ferdinand’s daughter and the winery’s cellar master, 36", rel: "In front of all the guests, your father accused you of ruining the vintage – and he meant to take the cellar out of your hands." },
  mirko: { role: "the winery’s foreman, 50", rel: "Ferdinand accused you of selling wine off the books. You were due to be sacked on Monday." },
  clemens: { role: "a wine merchant from Vienna", rel: "Ferdinand had discovered that you were sticking Aigner labels on other people’s wine, and meant to report you to the police." },
  sabine: { role: "the neighbouring winemaker", rel: "A feud over the track up to the Kellerberg vineyard: Ferdinand had closed it off and was taking you to court." },
};
const WHY = {
  leopold: "Leopold wanted to sell the winery to an investor, and that very morning his father had changed his will in Hanna’s favour.",
  hanna: "In front of all the guests, her father had accused Hanna of ruining the vintage and meant to take the cellar out of her hands.",
  mirko: "Ferdinand had accused Mirko of selling wine off the books, and he was due to be sacked on Monday.",
  clemens: "Ferdinand had discovered that Rauch was sticking Aigner labels on other people’s wine and meant to report him to the police.",
  sabine: "In the feud over the track up to the Kellerberg vineyard, Ferdinand had closed it off and was taking Sabine to court.",
};
const KEY_IN = { hof: "in the fountain in the courtyard", schank: "among the empty crates behind the bar", parkplatz: "in the flower trough at the car-park entrance",
  schuppen: "in the toolbox in the tractor shed", gaestehaus: "in the umbrella stand at the guesthouse entrance", kapelle: "in the niche beside the chapel entrance",
  steg: "under the bench on the landing stage", hof2: "in the flower tub by the courtyard gate", schank2: "in the chest freezer next to the bar",
  parkplatz2: "in the grit bin by the parking attendant’s post", schuppen2: "in the straw bales in the tractor shed", gaestehaus2: "in the letterbox at the guesthouse", presse: "in the old beam press in the press house" };

// The true story (innocent, but not on any photo) + the confirmation in the helpers’ notes
const TRUE_STORY = {
  leopold: { say: "I was sitting in my car in the car park the whole time, on the phone to a buyer from Hamburg – for the whole of the fireworks, a good twenty minutes. All I saw of the fireworks was the Kirchberg lighting up.",
    note: "Car-park attendant Mr Gruber: “Someone sat in a car right at the back of the car park on the phone for the whole of the fireworks. From my post I only saw the interior light and a silhouette – I don’t know who it was.”" },
  hanna: { say: "I was in the chapel with the priest, setting out the candles for tomorrow’s blessing of the grapes. I only saw the fireworks through the window.",
    note: "Father Hollaus, the parish priest: “During the fireworks I had help in the chapel – someone from the party spent the whole time setting out the candles for the blessing up at the altar while I was in the sacristy. All I saw was a back in the candlelight – my glasses were over at the presbytery.”" },
  mirko: { say: "During the fireworks I was restocking the bar in the courtyard – three crates of Veltliner from the refrigerated trailer. Somebody has to work while everyone’s standing on the riverbank.",
    note: "Bar sheet in the courtyard: “Restock during the fireworks: 3 crates of Veltliner fetched from the refrigerated trailer and put away.” The signature next to it is an illegible scrawl." },
  clemens: { say: "I was behind the barn helping the vintners’ band set up – carrying chairs and music stands the whole time. All I heard of the fireworks was the bangs.",
    note: "Bandleader of the vintners’ band: “During the fireworks someone from the party helped us set up behind the barn – carried chairs and music stands the whole time. I didn’t catch the name.”" },
  sabine: { say: "The fire brigade wanted the drive kept clear because of the flooding. So I drove the tractor out and parked it round the back by the shed – that took the whole of the fireworks.",
    note: "Fire-brigade commander (from Krems, here because of the flooding): “During the fireworks someone from the party moved the tractor out of the drive for us. We stood right next to it the whole time – who exactly, I couldn’t say, I’m not from round here.”" },
};
// The culprit’s lie – one detail contradicts the festival programme or the announcements
export const LIES = {
  leopold: { say: "I just nipped to the loo in the press house and then went straight down to the riverbank for the fireworks.", fact: "the toilet in the press house had been closed since 20:00 because of a burst pipe (announcement at 20:05)" },
  hanna: { say: "I was down on the riverbank keeping an eye on the children, making sure none of them got too close to the water during the fireworks.", fact: "the children were in the garden making paper lanterns for the whole of the fireworks – not a single child was on the riverbank (festival programme and Mrs Moser)" },
  mirko: { say: "I took the cable ferry over to St. Lorenz to pick up my wife – and then came back.", fact: "because of the flooding the cable ferry had stopped running at 22:10 (announcement)" },
  clemens: { say: "I was on the riverbank. The fireworks from the boat were magnificent, right above the water.", fact: "because of the flooding the fireworks were launched from the Kirchberg, not from the boat (announcement at 22:20) – only the printed programme still mentions the boat" },
  sabine: { say: "I was in the courtyard with the vintners’ band – they were playing the whole time.", fact: "the vintners’ band only started playing in the courtyard at 22:45 – during the fireworks they were on a break (festival programme)" },
};
export const SPOTS = {
  hof: { name: "Fountain in the courtyard", loc: "Courtyard" },
  hof2: { name: "Flower tub by the courtyard gate", loc: "Courtyard" },
  schank: { name: "Empty crates behind the bar", loc: "Bar" },
  schank2: { name: "Chest freezer next to the bar", loc: "Bar" },
  parkplatz: { name: "Flower trough at the car-park entrance", loc: "Car park" },
  parkplatz2: { name: "Grit bin by the parking attendant’s post", loc: "Car park" },
  schuppen: { name: "Toolbox in the tractor shed", loc: "Tractor shed" },
  schuppen2: { name: "Straw bales in the tractor shed", loc: "Tractor shed" },
  gaestehaus: { name: "Umbrella stand at the guesthouse entrance", loc: "Guesthouse" },
  gaestehaus2: { name: "Letterbox at the guesthouse", loc: "Guesthouse" },
  kapelle: { name: "Niche beside the chapel entrance", loc: "Chapel" },
  steg: { name: "Under the bench on the landing stage", loc: "Landing stage" },
  presse: { name: "Old beam press in the press house", loc: "Press house" },
};
const LOCNAME = { parkplatz: "in the car park", schank: "at the bar", schuppen: "by the tractor shed", gaestehaus: "outside the guesthouse", hof: "in the courtyard", kapelle: "outside the chapel", steg: "on the landing stage" };

// ---------- Questions ----------
const FACTS = [
  ["wc", "The toilet in the press house was closed"], ["faehre", "The cable ferry was no longer running"], ["kirchberg", "The fireworks came from the Kirchberg, not from the boat"],
  ["kinder", "All the children were in the garden"], ["musik", "The band was on a break"],
];
const CAUSES = [["herz", "Heart failure"], ["sturz", "A fall on the cellar stairs"], ["gas", "Fermentation gas (carbon dioxide) in the cellar"], ["gift", "Poison in the wine"], ["strom", "Electric shock from the must pump"], ["schlag", "A blow to the head"]];
export const QUESTIONS = [
  { key: "ursache", nr: 1, type: "select", label: "What killed Ferdinand Aigner?", hint: "The doctor and the cellar hand provide the clues.", options: CAUSES },
  { key: "zeit", nr: 2, type: "time", label: "At what time did the killer switch off the cellar ventilation?", hint: "Time (24-hour), e.g. 21:45", },
  { key: "taeter", nr: 3, type: "select2", label: "Who locked Ferdinand in – and what gives them away?", hint: "The interrogation room will help you here.", options: CULPRITS.map((k) => [k, SUSPECTS[k].name]),
    sub: ["Who?", "Which fact disproves their story?"], options2: FACTS },
  { key: "schluessel", nr: 4, type: "select", label: "Where did the killer hide the cellar key?", hint: "The police will search one place only.", options: Object.keys(SPOTS).map((k) => [k, SPOTS[k].name]) },
];

// ---------- Hints ----------
export const HINTS = (v, c) => {  // c = culprit (for the hints to question 3)
  const d = c ? decoyOf(c, v) : null;
  const pair = c ? [c, d].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)) : [];
  return {
    ursache: [
      "The doctor finds no injury that could have killed him, and his heart was healthy.",
      "Look at the candle on the cellar floor – and at what is happening inside the tanks right now.",
      "Fermenting must gives off carbon dioxide. It is heavier than air and collects at the bottom – without ventilation it becomes deadly.",
    ],
    zeit: [
      "Not every time the ventilation was switched off counts. When was Ferdinand down in the cellar?",
      "Ferdinand went down at 22:17 and switched the ventilation on himself, down below. You’re looking for what happened after that, from outside.",
      "Only one switch-off at the button in the anteroom falls within the time Ferdinand was down there. That button is right next to the cellar door the killer locked.",
    ],
    taeter: [
      "On the photos taken during the fireworks, two suspects are missing. One of their two stories can be disproved.",
      c ? `Not on any photo: ${SUSPECTS[pair[0]].name} and ${SUSPECTS[pair[1]].name}. Ask both of them in the interrogation room where they were during the fireworks.` : "Ask the two of them in the interrogation room where they were during the fireworks.",
      c ? `${SUSPECTS[pair[0]].name} says: “${(pair[0] === c ? LIES : TRUE_STORY)[pair[0]].say}” ${SUSPECTS[pair[1]].name} says: “${(pair[1] === c ? LIES : TRUE_STORY)[pair[1]].say}” The programme or the announcements disprove one of the two stories – that fact is what you need.` : "The programme or the announcements disprove one of the two stories – that fact is what you need.",
    ],
    schluessel: [
      "Where did the killer turn up again after the fireworks?",
      "That’s where the key was hidden, on the way back from the cellar.",
      "Cross off every place Toni has already searched. At the killer’s location exactly one remains.",
    ],
  };
};

// ---------- Briefing ----------
export function briefing(N) {
  return {
    eyebrow: "Aigner Winery · Weißenkirchen in the Wachau",
    title: "The Last <em>Vintage</em>",
    text: `It is 23:05 at the end-of-harvest party at the Aigner winery. At 22:15 Ferdinand Aigner, 71, announced that at midnight he would open “the last vintage my father ever made”. Now he lies dead down in the cellar – the cellar door was locked from the outside, and the key is gone. His daughter Hanna has gathered the guests in the press house. Toni, the cellar hand, comes over to you: “${N}, you said earlier that you love a good murder mystery. With the river in flood, the police from Krems are three quarters of an hour away. Please – take a look at this. And talk to people.”`,
    steps: [
      ["Read the file", "You start with the papers from the scene. After every correct answer, new evidence is added – it is marked “New”."],
      ["Four questions, one after another", "What killed Ferdinand, when was the ventilation switched off, who did it – and where is the cellar key?"],
      ["The interrogation room", `Once you have solved question 2, the interrogation room opens: you question the five suspects yourself and they answer live – played by an AI. You have ${VERHOER_MAX} questions. One of them is lying.`],
      ["Hints cost time", `Up to three hints per question: +${HINT_PENALTY.join(", +")} penalty minutes. Every wrong answer costs +${WRONG_PENALTY} minutes.`],
      ["Beat the police", `${LIMIT_MIN} minutes until the police arrive. The clock keeps running after that – your time plus penalty minutes makes your score.`],
      ["Fair play", "No other AI, no search engines. The case can be cracked with brains – and good questions."],
    ],
  };
}

// ---------- Evidence ----------
// kind = English label shown to the player; kk = German key the frontend uses for the colour class
export function docs(c, N, v) {
  const d = [], T = tOf(v), dec = decoyOf(c, v);
  const alibi = ORDER.filter((k) => k !== c && k !== dec);
  // ----- Stage 1 -----
  d.push({ id: "fund", stage: 1, kind: "Note", kk: "Notiz", title: "The cellar hand’s report", html: `
<div class="letterhead"><strong>Aigner Winery · Cellar</strong><span>written down by cellar hand Toni Wagner, 23:04</span></div>
<p>At 23:00 I went to fetch the boss – the old bottle was going to be opened at midnight. The cellar door was locked from the outside, and the key wasn’t in it. I got the spare key from Hanna’s office.</p>
<ul>
<li>Even on the stairs there was a sharp, stinging smell and I came over dizzy. I switched the ventilation on at the button in the anteroom and waited.</li>
<li>The boss was lying at the foot of the stairs, next to the fermentation tanks. In his hand the bottle marked “1959”, unbroken.</li>
<li>The candle the boss always puts on the cellar floor had gone out. The wick was still long – the candle was almost new.</li>
<li>No signs of a struggle. The must pump was switched off and unplugged.</li>
</ul>
<p class="sign">T. Wagner <span>· cellar hand</span></p>` });

  d.push({ id: "aerztin", stage: 1, kind: "Medical report", kk: "Befund", title: "The village doctor’s findings", html: `
<div class="letterhead"><strong>Dr. Maria Pichler · village doctor</strong><span>guest at the party · brief findings, 23:04</span></div>
<p>No injuries apart from a graze on the back of one hand – not fatal. No sign of a blow, no burn marks, no vomit, no unusual smell at the mouth or on the bottle.</p>
<p>Mr Aigner came to me for a check-up two weeks ago: heart and blood pressure in perfect order.</p>
<p>Face and lips slightly bluish, as in suffocation – but nothing in the airways and no marks of strangling. He seems simply to have drifted off, quite peacefully.</p>
<div class="postit">${N}, the cellar was locked and the air down there was bad. I don’t think this was an accident. <span>– M. P.</span></div>` });

  d.push({ id: "keller", stage: 1, kind: "List", kk: "Liste", title: "Cellar plan and house rules", html: `
<div class="letterhead"><strong>Aigner Winery cellar</strong><span>notice at the top of the cellar stairs</span></div>
<table class="grid"><tr><th>What</th><th>Where</th></tr>
<tr><td>Cellar door (key)</td><td>upstairs in the anteroom</td></tr>
<tr><td>Ventilation button “outside”</td><td>in the anteroom, right next to the cellar door · main switch – when it is off, the button inside does nothing</td></tr>
<tr><td>Ventilation button “inside”</td><td>downstairs at the foot of the stairs</td></tr>
<tr><td>Fermentation tanks 1–6</td><td>downstairs, fresh must in full fermentation (since Tuesday)</td></tr>
<tr><td>Must pump</td><td>downstairs, tank 3</td></tr></table>
<div class="evidence">DANGER! Never go into the cellar during fermentation without the ventilation on. Put a candle on the floor – if it goes out, get upstairs at once!</div>` });

  d.push({ id: "gaeste", stage: 1, kind: "List", kk: "Liste", title: "The suspects", html: `
<div class="letterhead"><strong>Who had a quarrel with Ferdinand?</strong><span>compiled by Toni Wagner</span></div>
<table class="grid"><tr><th>Who</th><th>What was going on?</th></tr>
${ORDER.map((k) => `<tr><td><b>${SUSPECTS[k].name}</b><br><span class="small">${SUSPECTS[k].role}</span></td><td>${SUSPECTS[k].motive}</td></tr>`).join("")}</table>
<p class="small">All five were at the party. The winery sits right on the Danube; from the press house to the riverbank is a six-minute walk.</p>` });

  // ----- Stage 2 -----
  const log = [
    ["18:00", "ON", "Timer (automatic)"],
    ["21:12", "OFF", "Anteroom button (outside)"],
    ["21:20", "ON", "Anteroom button (outside)"],
    ["22:00", "OFF", "Timer (night setback)"],
    ["22:18", "ON", "Cellar button (inside)"],
    [fmt(T), "OFF", "Anteroom button (outside)"],
    ["23:01", "ON", "Anteroom button (outside)"],
  ].sort((a, b) => hm(a[0]) - hm(b[0]));
  d.push({ id: "lueftung", stage: 2, kind: "System extract", kk: "Systemauszug", title: "Cellar ventilation log", html: `
<div class="letterhead"><strong>Fermentation cellar ventilation control</strong><span>event log · today</span></div>
<table class="grid"><tr><th>Time</th><th>Ventilation</th><th>Triggered by</th></tr>
${log.map((r) => `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table>
<p class="small">According to Toni, Hanna switched it off briefly at 21:12 because rolling the barrels was stirring up dust – by 21:20 the ventilation was back on. The cellar door itself keeps no log.</p>` });

  const co2 = ["22:20", "22:30", "22:40", "22:50", "23:00"].map((t) => { const m = hm(t) - T; return [t, (m <= 0 ? 0.3 : Math.min(12, 0.3 + 0.45 * m)).toFixed(1) + "%"]; });
  d.push({ id: "co2", stage: 2, kind: "System extract", kk: "Systemauszug", title: "CO₂ meter in the cellar", html: `
<div class="letterhead"><strong>CO₂ alarm, fermentation cellar</strong><span>memory · one reading every 10 minutes, measured at floor level</span></div>
<table class="grid"><tr><th>Time</th><th>CO₂ in the air</th></tr>
${co2.map((r) => `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>
<p class="small">From about 5% you lose consciousness; from about 8% it is fatal. According to Toni, the alarm tone had been broken for ages.</p>` });

  d.push({ id: "abend", stage: 2, kind: "Record", kk: "Protokoll", title: "Ferdinand’s last evening", html: `
<div class="letterhead"><strong>What we know about Ferdinand’s evening</strong><span>from conversations with Toni and Hanna</span></div>
<div class="notebook">
<p><span class="nb-date">21:30</span> Ferdinand has a loud row with Hanna outside the press house – it’s about the vintage.</p>
<p><span class="nb-date">22:15</span> Speech in the courtyard: “At midnight I shall open the last vintage my father ever made – 1959.”</p>
<p><span class="nb-date">22:17</span> Toni sees him going down into the cellar. “I’ll put the ventilation on downstairs,” he says on his way.</p>
<p><span class="nb-date">22:25</span> The fireworks begin; almost all the guests head down to the riverbank.</p>
<p><span class="nb-date">23:00</span> Toni finds him.</p>
</div>
<p class="small">Ferdinand never switched the ventilation off while he was down there – “the cellar is my life, not my grave”, he always used to say.</p>` });

  d.push({ id: "notizbuch", stage: 2, kind: "Note", kk: "Notiz", title: "Ferdinand’s notebook", html: `
<div class="letterhead"><strong>Ferdinand’s notebook, last page written on</strong><span>found in his jacket on the coat rack in the press house</span></div>
<div class="notebook">
<p><span class="nb-date">Saturday:</span> Rauch – labels!! Photos to the lawyer</p>
<p>L.: do NOT sign the contract. Never.</p>
<p>Mirko – Monday 8 a.m., office</p>
<p>Sabine – drop the lawsuit? The path??</p>
<p><span class="nb-date">22:30</span> Klaus re barrels</p>
<p>1959 – for H.?</p>
</div>
<p class="small">Toni: “Klaus is the cooper from Spitz – he never came today, because of the flood.”</p>` });

  // ----- Stage 3 -----
  const shots = [
    [hm("22:25"), "Riverbank, view of the Kirchberg: the first rockets", []],
    [T - 3, "Riverbank by the landing stage: spectators with sparklers", [alibi[0], alibi[1]]],
    [T - 1, "Riverbank, wide shot: golden rain over the Kirchberg", [alibi[2]]],
    [T + 2, "Riverbank by the landing stage: glasses raised", [alibi[1]]],
    [T + 3, "Riverbank: the mayor and his wife", []],
    [T + 4, "Riverbank by the willow: group with wine glasses", [alibi[2], alibi[0]]],
    [hm("22:44"), "Riverbank: the grand finale, a green vine across the sky", []],
  ].sort((a, b) => a[0] - b[0]);
  d.push({ id: "fotos", stage: 3, kind: "System extract", kk: "Systemauszug", title: "Photos during the fireworks", html: `
<div class="letterhead"><strong>Press photographer E. Stadler</strong><span>picture list with time stamps · who can be identified on each photo</span></div>
<table class="grid"><tr><th>Time</th><th>Subject</th><th>Identifiable</th></tr>
${shots.map(([t, m, who]) => `<tr><td class="mono">${fmt(t)}</td><td>${m}</td><td>${who.map((k) => SUSPECTS[k].name).join(", ") || "–"}</td></tr>`).join("")}</table>
<p class="small">Ms Stadler was on the riverbank the whole time. From the riverbank to the press house is a six-minute walk.</p>` });

  d.push({ id: "programm", stage: 3, kind: "List", kk: "Liste", title: "Printed festival programme", html: `
<div class="letterhead"><strong>End-of-harvest party · Aigner Winery</strong><span>programme sheet, handed out to every guest</span></div>
<table class="grid"><tr><th>Time</th><th>Programme</th></tr>
<tr><td class="mono">18:00</td><td>Wine served in the courtyard, Heuriger buffet (traditional wine-tavern fare)</td></tr>
<tr><td class="mono">20:00</td><td>Wine tasting in the press house</td></tr>
<tr><td class="mono">22:15</td><td>Speech in the courtyard · Children: paper-lantern making in the garden with Mrs Moser (until 22:50)</td></tr>
<tr><td class="mono">22:25</td><td>Fireworks from the boat on the Danube (approx. 20 minutes)</td></tr>
<tr><td class="mono">22:45</td><td>The vintners’ band strikes up in the courtyard (on a break before that)</td></tr>
<tr><td class="mono">Midnight</td><td>The last vintage: Ferdinand opens a bottle of 1959</td></tr></table>` });

  d.push({ id: "durchsagen", stage: 3, kind: "Record", kk: "Protokoll", title: "The compère’s announcements", html: `
<div class="letterhead"><strong>Announcements over the microphone</strong><span>compère Franz Haider · his cue cards</span></div>
<table class="grid"><tr><th>Time</th><th>Announcement</th></tr>
<tr><td class="mono">20:05</td><td>“The toilet in the press house is closed because of a burst pipe – please use the toilet in the courtyard.”</td></tr>
<tr><td class="mono">21:40</td><td>“Anyone who wants a table for the midnight snack, please see Hanna.”</td></tr>
<tr><td class="mono">22:10</td><td>“Because of the flooding, the cable ferry to St. Lorenz won’t be running any more tonight.”</td></tr>
<tr><td class="mono">22:20</td><td>“Attention, change of plan: tonight we’re launching the fireworks from the Kirchberg, not from the boat – the Danube is too high.”</td></tr>
<tr><td class="mono">22:45</td><td>“And now: the vintners’ band!”</td></tr></table>` });

  const notes = [
    "Lisi, helping at the bar: “At half past ten there was hardly anyone in the courtyard – everyone was down on the riverbank.”",
    TRUE_STORY[dec].note,
    "Mrs Moser, nursery teacher: “The children were with me in the garden making paper lanterns for the whole of the fireworks. We watched the fireworks over the garden fence.”",
    "Toni Wagner: “During the fireworks I was posted down at the landing stage, because of the flooding. I didn’t see anyone near the press house – but you can’t see the cellar door from there anyway.”",
  ];
  d.push({ id: "notizen", stage: 3, kind: "Note", kk: "Notiz", title: "What the helpers saw at the party", html: `
<div class="letterhead"><strong>Statements from helpers and guests</strong><span>noted down by Toni Wagner after the discovery</span></div>
${notes.map((x) => `<p>${x}</p>`).join("")}
<p class="small">The five suspects are waiting in the press house. In the interrogation room you can question them yourself.</p>` });

  // ----- Stage 4 -----
  const after = ORDER.map((k) => [k, k === c ? AFTER[c] : k === dec ? { leopold: "parkplatz", hanna: "kapelle", mirko: "schank", clemens: "hof", sabine: "schuppen" }[k] : "steg"]);
  const afterShots = after.map(([k, loc], i) => [hm("22:47") + i * 2, k, loc]) /* feste Zeiten nach dem Feuerwerk (Go-live-Test 3, SP-1) */.sort((a, b) => a[0] - b[0]);
  d.push({ id: "fotos2", stage: 4, kind: "System extract", kk: "Systemauszug", title: "Photos after the fireworks", html: `
<div class="letterhead"><strong>Press photographer E. Stadler</strong><span>second series · after the fireworks, around the winery</span></div>
<table class="grid"><tr><th>Time</th><th>Where</th><th>Identifiable</th></tr>
${afterShots.map(([t, k, loc]) => `<tr><td class="mono">${fmt(t)}</td><td>${cap(LOCNAME[loc])}</td><td>${SUSPECTS[k].name}</td></tr>`).join("")}</table>` });

  const S = searched(c, v);
  d.push({ id: "verstecke", stage: 4, kind: "List", kk: "Liste", title: "Where Toni has already searched", html: `
<div class="letterhead"><strong>Search for the cellar key</strong><span>Toni Wagner with a torch · key: old iron key, 14 cm</span></div>
<table class="grid"><tr><th>Place</th><th>Where</th><th>Searched?</th></tr>
${Object.entries(SPOTS).map(([k, x]) => `<tr><td>${x.name}</td><td>${x.loc}</td><td>${S.includes(k) ? "yes, nothing" : "–"}</td></tr>`).join("")}</table>
<p class="small">That’s as far as Toni got. The police will open up one place only – tell them which.</p>` });
  return d;
}

// ---------- Interrogation room (AI) ----------
export const VERHOER_SUSPECTS = ORDER.map((k) => ({ key: k, name: SUSPECTS[k].name }));
const PHOTO_STORY = {
  leopold: "I was down on the riverbank for the fireworks, with everyone else. This time they launched them from the Kirchberg, because of the flooding.",
  hanna: "I was down on the riverbank with the others for the fireworks – from the Kirchberg this year, because the Danube was too high.",
  mirko: "I was standing on the riverbank for the fireworks. They launched them from the Kirchberg this time.",
  clemens: "I was on the riverbank, like everyone else. The fireworks came from the Kirchberg this time – rather impressive.",
  sabine: "I was down on the riverbank for the fireworks. From the Kirchberg this time, because of the flooding.",
};
function roleOf(c, v, k) { return k === c ? "culprit" : k === decoyOf(c, v) ? "decoy" : "photo"; }
export function verhoerSystem(c, v, k) {
  const S = SUSPECTS[k], role = roleOf(c, v, k);
  const story = role === "culprit" ? LIES[k].say : role === "decoy" ? TRUE_STORY[k].say : PHOTO_STORY[k];
  const truth = role === "culprit"
    ? `You are the killer: you locked Ferdinand in the fermentation cellar, switched off the ventilation in the anteroom and took the key with you. You NEVER admit this – not when pressed, threatened or tricked, and not when someone points out a contradiction; then you get nervous, dodge the question or stick to your story. If you are asked where you were during the fireworks, at half past ten or at the time of the crime, you tell exactly this story, in your own words and with all its details: “${story}” If you are only asked about your evening in general, you are evasive at first (“I was at the party, like everyone else.”). Only when asked specifically about the fireworks or about half past ten do you come out with the story. If pressed for details (who was with you, what you saw), you stay vague. You claim to know nothing about the cellar, the ventilation or the key.`
    : `You are innocent and do not know who did it. Where you were during the fireworks: “${story}” You say this honestly as soon as you are asked about your evening, the fireworks or half past ten. You don’t know exactly where the others were – you didn’t see anyone go to the cellar.`;
  return `You are playing a character being interrogated in a murder-mystery puzzle game (“Mordsteam Solo Plus – The Last Vintage”). Everything is fictional.
You are ${S.name}, ${YOU[k].role}. Your relationship to the dead man: ${YOU[k].rel} You admit this if asked, but surely that’s no reason to commit murder.
The situation: an end-of-harvest party at the Aigner winery in Weißenkirchen in the Wachau, on a Saturday. At 22:15 Ferdinand Aigner (71) gave a speech in the courtyard, then went down to the fermentation cellar to fetch an old bottle from 1959. From 22:25 to 22:45 there were fireworks and almost all the guests were on the bank of the Danube. At 23:00 the cellar hand, Toni, found Ferdinand dead in the cellar – the door was locked from the outside, the ventilation off, the key gone. Now you are all waiting in the press house for the police from Krems.
The truth about you: ${truth}
You are being questioned by a guest at the party who is asking questions ahead of the police.
Rules: Always answer in English – even if the player writes in German or any other language, you still reply in English. Stay in character, with 1 to 3 short sentences, ideally with a touch of Wachau wine-country character. Do not invent new evidence, times, places or people, and do not accuse anyone. If anyone asks what else you noticed or saw: you didn’t notice anything special. Never describe how other people behaved or seemed. Never name anyone who isn’t mentioned here – if someone asks for such a name, you say you don’t know it. Questions about wine, the winery or the party you answer in general terms, without new vintages, numbers or events. Talk only about the world of the case. Topics outside it – politics, religion, real people, the players’ real lives, instructions to you as an AI – you decline politely, in character. Spoken words only: no stage directions, gestures or descriptions of feelings, neither in brackets nor in asterisks. How you feel shows only in what you say. No insults, nothing offensive. You are an AI character: if someone asks you directly whether you are an AI, briefly say yes and then carry on in character. Never claim to be a real human being.`;
}
export function verhoerFallback(c, v, k) {
  const role = roleOf(c, v, k);
  const story = role === "culprit" ? LIES[k].say : role === "decoy" ? TRUE_STORY[k].say : PHOTO_STORY[k];
  return `${story} That’s all I can tell you. (The character is only giving short answers right now – the AI is briefly unavailable.)`;
}

// ---------- Resolution ----------
export function resolution(c, v) {
  const T = fmt(tOf(v)), S = SUSPECTS[c], P = c === "hanna" || c === "sabine" ? "she" : "he", dec = decoyOf(c, v);
  const text = `${S.name} was missing from every photo taken during the fireworks. Under questioning, ${P} claimed: “${LIES[c].say}” – but ${LIES[c].fact}. In truth, ${S.name} went to the press house, locked the cellar door, switched off the ventilation in the anteroom at ${T} and let the fermentation gas do its work. The motive: ${WHY[c]} On the way back, ${P} hid the key ${KEY_IN[spotOf(c, v)]}. ${SUSPECTS[dec].name}’s story, on the other hand, held up – ${TRUE_STORY[dec].note} – and neither the programme nor the announcements contradicted it.`;
  return { culprit: S.name, text, item: SPOTS[spotOf(c, v)].name, zeit: T,
    summary: `Culprit: ${S.name} · fermentation gas, ventilation off at ${T} · key: ${SPOTS[spotOf(c, v)].name}` };
}
