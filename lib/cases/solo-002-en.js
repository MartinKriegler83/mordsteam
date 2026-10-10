// Mordsteam Solo 002 – “Applause for a Dead Man” (English version)
// Same culprits, variants, solutions, ids and HTML structure as solo-002.js. Only player-facing texts differ.
// The server merges { ...DE, ...EN } for English runs; logic (slots, prints, solution, keypad …) comes from the DE module.
import { abdruecke, aushang, hausplan } from "../art/solo002.js";
import {
  SUSPECTS as DE_SUSPECTS, ITEMS as DE_ITEMS, CULPRITS, HINT_PENALTY, WRONG_PENALTY, LIMIT_MIN,
  hm, fmt, COLLAPSE, ORDER, varOf, AUSHANG, WORDS, KEYS, Q1_OPTS, slots, prints, keypad, gapOf,
} from "./solo-002.js";

export const TITLE = "Applause for a Dead Man";
export const UI = {
  clock: "Theatre", until: "until the police", late: "police waiting", stamp: "APPLAUSE", fb: "the theatre case",
  cert: "and unmasked the culprit before the police reached the theatre.", caseNo: "SOLO 002",
  stages: { 2: "New evidence: traces and records", 3: "New evidence: the locker" },
};

const SHORT = { vera: "Ms Lind", tobias: "Mr Grün", nina: "Ms Kessler", paul: "Mr Wendt", felix: "Mr Brandt" };
const ROLE = {
  vera: "Actress, tonight Miranda’s understudy",
  tobias: "Actor, Prospero’s understudy",
  nina: "Assistant director",
  paul: "Head of wardrobe, tonight in the costume workshop",
  felix: "Props master",
};
export const SUSPECTS = Object.fromEntries(Object.entries(DE_SUSPECTS).map(([k, s]) => [k, { ...s, short: SHORT[k], role: ROLE[k] }]));

// Other people named in the fingerprint table (DE prints() returns the German labels)
const OTHER = {
  "Bühnentechniker M. Pichler": "stagehand M. Pichler",
  "Buffet I. Novak": "I. Novak (bar)",
  "Dr. E. Kranz": "Dr E. Kranz",
  "Ankleiderin L. Frisch": "dresser L. Frisch",
};
const other = (x) => OTHER[x] || x;
const ITEM_NAME = {
  tee: "Ginger tea from the flask",
  spray: "Throat spray",
  pokal: "Goblet of grape juice (banquet scene)",
  sekt: "Glass of sparkling wine with the artistic director (interval)",
  bonbon: "Honey lozenge from the bowl in the dressing room",
  wasser: "Glass of water for the monologue (second half)",
};
export const ITEMS = Object.fromEntries(Object.entries(DE_ITEMS).map(([k, I]) => [k, { ...I, name: ITEM_NAME[k], ...(I.others ? { others: I.others.map(other) } : {}) }]));

// ---------- Questions ----------
export const QUESTIONS = [
  { key: "gift", nr: 1, type: "select", label: "What was the poison in?", hint: "The forensic pathologist from row 3 narrows down the time.",
    options: Q1_OPTS.map((k) => [k, ITEMS[k].name]) },
  { key: "taeter", nr: 2, type: "select", label: "Who poisoned Richard Adler?", hint: "Only one person had the opportunity.",
    options: CULPRITS.map((k) => [k, SUSPECTS[k].name]) },
  { key: "code", nr: 3, type: "code", label: "Which number code will the police use to open the culprit’s locker?", hint: "Four digits, e.g. 1234" },
];

// ---------- Hints ----------
export const HINTS = (v) => {
  const V = varOf(v), I = ITEMS[V.item];
  return {
    gift: [
      "The forensic pathologist from row 3 says how long before the collapse the poison was swallowed.",
      "Adler collapsed at 22:12. Turn Dr Roth’s window into clock times.",
      `The poison was swallowed between ${fmt(COLLAPSE - V.hi)} and ${fmt(COLLAPSE - V.lo)}. What exactly did Adler eat or drink during that time? Careful: setting something out or topping it up is not the same as swallowing it.`,
    ],
    taeter: [
      "On the poisoned item Dr Roth found fingerprints belonging to three of the suspects.",
      "The poison went in after the item was set out and before Adler took it. For that period, look for a record for each of the three people.",
      `The window is ${I.win[0]} to ${I.win[1]}. Only one of the three has no record covering it. A statement on its own is not proof.`,
    ],
    code: [
      "The code belongs to the lock, and so to the locker number – not to the person.",
      "Read the handwritten note on the noticeboard carefully.",
      "Letters as on a phone keypad: ABC = 2, DEF = 3, GHI = 4, JKL = 5, MNO = 6, PQRS = 7, TUV = 8, WXYZ = 9.",
    ],
  };
};

// ---------- Briefing ----------
export function briefing(N) {
  return {
    eyebrow: "Theater am Kanal · Vienna · Opening night",
    title: "Applause for a <em>Dead Man</em>",
    text: `It is 22:15. Opening night of Shakespeare’s “The Tempest”, and moments ago the audience was on its feet. Three minutes ago, just after the final applause, Richard Adler, the celebrated Prospero, collapsed behind the curtain. The forensic pathologist from row 3 could do nothing more for him. The artistic director, Dr Elisabeth Kranz, takes you by the arm: “${N}, you write the sharpest reviews in this city. The police will be here in just over half an hour and the building is sealed off. Please – take a look at this.”`,
    steps: [
      ["Read the file", "You start with the papers from tonight. After every correct answer, new evidence is added – it is marked “New”."],
      ["Three questions, in order", "How was he poisoned, who did it – and which code will the police use to open the culprit’s locker?"],
      ["Hints cost time", `Up to three hints per question: +${HINT_PENALTY.join(", +")} penalty minutes. Every wrong answer costs +${WRONG_PENALTY} minutes.`],
      ["Beat the police", `${LIMIT_MIN} minutes until the police arrive. The clock keeps running after that – your time plus penalty minutes gives your score.`],
      ["Fair play", "No AI, no search engines. The case can be cracked with brainpower alone."],
    ],
  };
}

// ---------- Evidence ----------
export function docs(c, N, v) {
  const d = [], V = varOf(v), S = slots(c, v), P = prints(c, v);
  // ----- Stage 1 -----
  d.push({ id: "fund", stage: 1, kind: "Note", kk: "Notiz", title: "The artistic director’s report", html: `
<div class="letterhead"><strong>Theater am Kanal · Artistic Director’s Office</strong><span>Dr Elisabeth Kranz · noted at 22:14</span></div>
<p>22:10, final applause. Richard Adler (Prospero) bows three times, then the curtain comes down. At 22:12 he collapses behind the curtain. Dr Roth from row 3, a forensic pathologist, is at his side at once – in vain.</p>
<ul>
<li>The stage door has been locked since 22:12. Nobody has left the building since.</li>
<li>During the interval Adler was with me in my office. At 20:32 Ms Novak from the bar set out sparkling wine, Adler’s engraved premiere glass and a second glass – I was still in the foyer then. At 20:43 I was back in my office, Adler came in shortly after, and at 20:45 we raised our glasses. Just before 20:57 he went back to his dressing room.</li>
<li>The actors on stage and Adler’s dresser Lotte Frisch (with Adler or helping with costume changes, never alone) were never unobserved. Only five people were moving freely backstage – see the cast list.</li>
</ul>
<p class="sign">E. Kranz <span>· Artistic Director</span></p>` });

  d.push({ id: "aerztin", stage: 1, kind: "Findings", kk: "Befund", title: "Findings of the forensic pathologist from row 3", html: `
<div class="letterhead"><strong>Dr Hanne Roth · Forensic pathologist</strong><span>Opening-night guest, row 3 · provisional findings</span></div>
<p>Suspicion: poisoning with a heart medicine made from foxglove, in a massive overdose. When I reached him he was still alive for a moment – his pulse very slow and irregular, then cardiac arrest. Ms Frisch says he felt sick during the last costume change and said everything looked yellow. Yellow vision is the typical sign of foxglove. He took no heart medicine; his heart was healthy. The post-mortem will have to confirm it.</p>
<p>Swallowed, not injected: I can find no puncture mark, and this medicine is taken as drops.</p>
<p>Timing (estimate based on dose and course): he swallowed it roughly ${V.lo} to ${V.hi} minutes before the collapse. Any earlier or later does not fit the course.</p>
<p>The drops taste bitter – in something sweet or cold you would hardly notice them.</p>
<div class="postit">${N}, I’ve written down everything we know. The police will ask: how, who, and where is the little bottle? <span>– H. R.</span></div>` });

  d.push({ id: "besetzung", stage: 1, kind: "List", kk: "Liste", title: "Cast and backstage staff", html: `
<div class="letterhead"><strong>“The Tempest” · Opening night</strong><span>Theater am Kanal · Curtain up 19:30 · Interval 20:35–21:05 · Ends 22:10</span></div>
<table class="grid"><tr><th>Name</th><th>Duty tonight</th></tr>
<tr><td>Richard Adler</td><td>Prospero (victim)</td></tr>
${ORDER.map((k) => `<tr><td>${SUSPECTS[k].name}</td><td>${SUSPECTS[k].role}</td></tr>`).join("")}
<tr><td>Other staff</td><td>M. Pichler (stage crew), I. Novak (bar), R. Huber (make-up), L. Frisch (dresser), J. Wallner (stage door) · at their posts or accompanied all evening</td></tr>
<tr><td>Karl Moser</td><td>Stage manager, at the prompt desk all evening (caught on the stage camera)</td></tr></table>
${hausplan(true)}
<p class="small">The five suspects from ${SUSPECTS[ORDER[0]].name} to ${SUSPECTS[ORDER[ORDER.length - 1]].name} were not on stage tonight and could move freely backstage. Only they could have done it.</p>` });

  d.push({ id: "garderobe", stage: 1, kind: "Note", kk: "Notiz", title: "Richard Adler’s dressing-room log", html: `
<div class="letterhead"><strong>Dressing room 1 · Richard Adler</strong><span>kept by his dresser, L. Frisch</span></div>
<div class="notebook">
<p><span class="nb-date">19:10</span> Mr Adler drinks his ginger tea from his own flask.</p>
<p><span class="nb-date">19:25</span> Throat spray, as always before he goes on. 19:28 to the stage.</p>
<p><span class="nb-date">20:35</span> Interval. Mr Adler comes to the dressing room, wants some peace and quiet.</p>
<p><span class="nb-date">20:40</span> Sweet bowl topped up with fresh honey lozenges.</p>
<p><span class="nb-date">20:43</span> Mr Adler goes upstairs to the artistic director. Dressing room left open – I’m helping the chorus ladies change.</p>
<p><span class="nb-date">20:57</span> Mr Adler back. At 21:00 he takes two honey lozenges – for his voice.</p>
<p><span class="nb-date">21:03</span> To the stage, second half.</p>
</div>` });

  // Brandt innocent and poison in goblet/water glass: Moser sees him put it down and go straight to the stage door (S2-1)
  const toDoor = (it, obj, side) => (c !== "felix" && V.item === it ? `, puts ${obj} on the props table stage ${side} and – I watched him go – heads straight for the stage door` : ` and puts ${obj} on the props table stage ${side}`);
  d.push({ id: "inspizient", stage: 1, kind: "Log", kk: "Protokoll", title: "Stage manager’s prompt book, opening night", html: `
<div class="letterhead"><strong>Prompt book · “The Tempest”</strong><span>K. Moser, stage manager · only entries on Prospero and his props</span></div>
<table class="grid"><tr><th>Time</th><th>Entry</th></tr>
<tr><td class="mono">19:30</td><td>Curtain up, Prospero on stage</td></tr>
<tr><td class="mono">19:50</td><td>Props: F. Brandt fills the goblet with grape juice at my desk, in front of me${toDoor("pokal", "it", "right")}</td></tr>
<tr><td class="mono">20:08</td><td>Scene change: stagehand M. Pichler takes the goblet from the table and sets it on the banquet table – in full view of the stage manager</td></tr>
<tr><td class="mono">20:15</td><td>Banquet scene: Prospero drinks from the goblet</td></tr>
<tr><td class="mono">20:35</td><td>Interval</td></tr>
<tr><td class="mono">21:05</td><td>Second half</td></tr>
<tr><td class="mono">21:10</td><td>Props: F. Brandt fills a water jug and a glass at my desk, in front of me${toDoor("wasser", "them", "left")}</td></tr>
<tr><td class="mono">21:30</td><td>Prospero takes the glass on stage with him</td></tr>
<tr><td class="mono">21:35</td><td>Great monologue: Prospero drains the glass</td></tr>
<tr><td class="mono">22:10</td><td>Final applause</td></tr></table>
<p class="small">On stage and at the prompt desk nobody was ever unobserved. The props tables stand in the dark wings – anyone who works backstage can get to them.</p>` });

  // ----- Stage 2 -----
  d.push({ id: "spuren", stage: 2, kind: "Findings", kk: "Befund", title: "Fingerprints – lifted by Dr Roth", html: `
<div class="letterhead"><strong>Fingerprints</strong><span>Dr H. Roth, lifted using powder and tape borrowed from the make-up room</span></div>
<p>I took prints from everything Adler ate or drank today and compared them with the coffee mugs in the staff room – everyone has their own there, with their name on it. I have left out Adler’s own prints.</p>
${abdruecke(true, Object.fromEntries(ORDER.map((k) => [k, SUSPECTS[k].name])), P, Q1_OPTS, v)}
<p class="small">Important: a print only shows who touched something – not when. In rehearsals, props and glasses pass through a great many hands. The lozenge bowl has stood in the dressing room since rehearsals – Ms Frisch only tops it up. The wine glasses come from the canteen, where everyone clears up now and then.</p>` });

  const STATE = {
    vera: "“Richard and I were together for twelve years. When he left me, he made sure I’d only ever be the understudy here. Tonight I spent most of my time on standby in make-up. Ask Ms Huber. I still bought his throat spray for him, year after year.”",
    tobias: "“Yes, if Adler can’t go on, I play Prospero. He wanted rid of me at the end of the season – everyone knows that. I was in the canteen, and outside for a smoke a few times.”",
    nina: "“The version performed tonight is mine. The programme says ‘Adapted by Richard Adler’. I sat at the lighting desk at the back of the auditorium whenever I was needed.”",
    paul: "“Thirty years I’ve been dressing the gentlemen here, twenty of them Richard Adler. Then he pushed it through that I have to retire in the spring. Tonight I was upstairs in the costume workshop most of the time.”",
    felix: "“Last week Adler bawled me out in front of the whole company over the wrong goblet and demanded I be sacked. Tonight I did my job – and nipped across to the outside store now and then.”",
  };
  d.push({ id: "aussagen", stage: 2, kind: "Log", kk: "Protokoll", title: "Statements of the five suspects", html: `
<div class="letterhead"><strong>Brief questioning after the collapse</strong><span>noted by Dr E. Kranz</span></div>
${ORDER.map((k) => `<p class="q">${SUSPECTS[k].name} – ${SUSPECTS[k].role}</p><p class="a">${STATE[k]}</p>`).join("")}
<p class="small">All five agreed to have their fingerprints taken.</p>` });

  const rows = (list) => list.sort((p, q) => p[0] - q[0]).map((r) => `<tr>${r.slice(1).map((x, i) => `<td${i === 0 ? ' class="mono"' : ""}>${x}</td>`).join("")}</tr>`).join("");
  const maske = [
    ...S.vera.map(([x, y]) => [x, `${fmt(x)}–${fmt(y)}`, "Vera Lind", "Make-up, on standby"]),
    ...S.paul.map(([x, y]) => [x, `${fmt(x)}–${fmt(y)}`, "Paul Wendt", "Costume workshop, 2nd floor"]),
    [hm("19:00"), "19:00–19:24", "Chorus (6 people)", "Make-up"],
    [hm("20:50"), "20:50–21:02", "Extras (4 people)", "Make-up, touch-ups"],
  ];
  d.push({ id: "maske", stage: 2, kind: "List", kk: "Liste", title: "Sign-in book: make-up and costume workshop", html: `
<div class="letterhead"><strong>Make-up · Costume workshop</strong><span>kept by make-up artist R. Huber · whoever arrives signs in, whoever leaves signs out</span></div>
<table class="grid"><tr><th>from–to</th><th>Who</th><th>Where</th></tr>${rows(maske)}</table>
<p class="small">Make-up and the costume workshop are on the 2nd floor, well away from the stage, the dressing rooms and the artistic director’s office. Ms Huber was there all evening.</p>` });

  const pforte = [];
  for (const k of ["tobias", "felix"]) for (const [x, y] of S[k]) {
    pforte.push([x, fmt(x), SUSPECTS[k].name, k === "tobias" ? "out (smoking)" : "out (outside store)"]);
    pforte.push([y, fmt(y), SUSPECTS[k].name, "in"]);
  }
  pforte.push([hm("19:40"), "19:40", "Flower delivery", "in and out"], [hm("21:20"), "21:20", "Fire brigade, fire watch", "patrol of the yard"]);
  d.push({ id: "pforte", stage: 2, kind: "System extract", kk: "Systemauszug", title: "Stage-door log", html: `
<div class="letterhead"><strong>Stage door · Door log</strong><span>Doorkeeper J. Wallner · every exit from and entry into the building</span></div>
<table class="grid"><tr><th>Time</th><th>Who</th><th>Direction</th></tr>${rows(pforte)}</table>
<p class="small">Once you are out, you are out: from outside, only the doorkeeper can open the door. The outside store is across the street.</p>` });

  const pult = [
    ...S.nina.map(([x, y]) => [x, `${fmt(x)}–${fmt(y)}`, "Nina Kessler"]),
    [hm("19:00"), "19:00–19:24", "Technician J. Horak"],
  ];
  d.push({ id: "pult", stage: 2, kind: "System extract", kk: "Systemauszug", title: "Lighting desk: log-ins", html: `
<div class="letterhead"><strong>Auditorium lighting desk · operator log-in</strong><span>The desk in the auditorium, row 22 · log-in by chip card</span></div>
<table class="grid"><tr><th>logged in</th><th>Operator</th></tr>${rows(pult)}</table>
<p class="small">The desk can only be operated while someone is logged in with a card – and only in person at the desk. If nobody is logged in, the lights run automatically as programmed. From the auditorium to backstage is a good five minutes. During the interval the assistant director runs the house lights and interval bells by hand.</p>` });

  // ----- Stage 3 -----
  d.push({ id: "flaeschchen", stage: 3, kind: "Note", kk: "Notiz", title: "Addendum: where is the little bottle?", html: `
<div class="letterhead"><strong>Addendum</strong><span>Dr H. Roth and Dr E. Kranz</span></div>
<p>The drops came from a small brown bottle. We did not find it on any of the five, and nobody has left the building since 22:12.</p>
<p>At 22:13 the doorkeeper heard a locker being slammed shut in the staff corridor. The lockers are secured with combination locks. The culprit is saying nothing – but Mr Wendt keeps a locker book for everyone, because somebody is always forgetting their code.</p>
<p>The police want to open the locker in front of the culprit. Which code?</p>` });

  d.push({ id: "spinde", stage: 3, kind: "List", kk: "Liste", title: "Notice in the staff corridor: lockers", html: `
${aushang(true, AUSHANG)}` });

  d.push({ id: "spindbuch", stage: 3, kind: "Record", kk: "Beleg", title: "The wardrobe master’s locker book", html: `
<div class="receipt"><div class="r-head">LOCKER BOOK · P. WENDT</div>
${Object.keys(WORDS).map((n) => `Locker ${n} · code word ${WORDS[n]}`).join("<br>")}</div>
<p>On the first page it says: <i>“Codes written down as words – each letter is a digit, as on a phone keypad.”</i> The code words are German – the keypad works the same.</p>
<div class="keypad" aria-label="Phone keypad">${["1", ...Object.keys(KEYS).map(Number)].map((k) => `<span><b>${k}</b><small>${KEYS[k] || "&nbsp;"}</small></span>`).join("")}<span><b>*</b><small>&nbsp;</small></span><span><b>0</b><small>&nbsp;</small></span><span><b>#</b><small>&nbsp;</small></span></div>
<p class="small">The code word belongs to the lock, and so to the locker number.</p>` });
  return d;
}

// ---------- Resolution ----------
const HOW = {
  pokal: (p) => `${p} put the drops into the goblet of grape juice, which had been standing unobserved on the props table stage right since 19:50 – the sweet juice masked the bitter taste`,
  sekt: (p) => `${p} slipped into the artistic director’s office, where the sparkling wine had been waiting since 20:32, and put the drops into Adler’s engraved premiere glass – cold and fizzy, you can barely taste them`,
  bonbon: (p) => `${p} let the drops fall onto the fresh honey lozenges in Adler’s open dressing room while Adler was upstairs in the artistic director’s office – before the second half he always took two`,
  wasser: (p) => `${p} put the drops into the glass of water that had been standing ready on the props table stage left since 21:10 for the great monologue`,
};
const CONF = {
  vera: (g, t, how) => `Vera Lind did not spend the whole time in make-up – ${g} she is missing from the sign-in book, so she was not there during the time window ${t} either. During that time ${how("she")}. She put the little bottle in her locker – number 9, since the swap with Tobias Grün. “For twelve years he took my parts away,” she says. “Tonight I wrote his ending.”`,
  tobias: (g, t, how) => `According to the stage-door log, Tobias Grün was not outside smoking ${g} but inside the building – nobody can vouch for him in the canteen, so not during the time window ${t} either. During that time ${how("he")}. All he wanted, he says, was for Adler to miss the opening-night party so that he could finally play Prospero. The little bottle was in his locker – number 7, since the swap with Vera Lind.`,
  nina: (g, t, how) => `Nina Kessler was not logged in at the lighting desk ${g}, so not during the time window ${t} either. During that time ${how("she")}. Adler had passed off her adaptation as his own – “tonight he would have taken a bow for my words,” she says. The little bottle was in her locker, number 12.`,
  paul: (g, t, how) => `Paul Wendt was not in the costume workshop ${g}, so not during the time window ${t} either – the sign-in book only has him there at other times. During that time ${how("he")}. Thirty years in the house, and Adler packed him off into retirement. The little bottle was in his own locker, number 3 – the very man who kept the locker book.`,
  felix: (g, t, how) => `Felix Brandt was not at the outside store ${g}, so not during the time window ${t} either – according to the stage-door log he was inside the building at the time. While there, ${how("he")}. Adler had humiliated him in front of everyone and demanded he be sacked. The little bottle was in his locker, number 15.`,
};
export function resolution(c, v) {
  const V = varOf(v), I = ITEMS[V.item], [g0, g1] = gapOf(c, v);
  const code = keypad(WORDS[SUSPECTS[c].spind]);
  return {
    culprit: SUSPECTS[c].name, text: CONF[c](`between ${g0} and ${g1}`, `from ${I.win[0]} to ${I.win[1]}`, HOW[V.item]), item: `Locker ${SUSPECTS[c].spind}, code ${code}`,
    summary: `Culprit: ${SUSPECTS[c].name} · Poison in: ${I.name} · Locker ${SUSPECTS[c].spind}, code ${code}`,
  };
}
