// Mordsteam Special 001 – “Trick or Treat” (English version, American English: the case is set in Ohio)
// Same culprits, variants, solutions (except the Candy Code word), ids and HTML structure as special-001.js.
// The server merges { ...DE, ...EN } for English runs; timing logic comes from the DE module.
import { porchCam, lineup, plan, candyGrid, candyNote, zonesOf } from "../art/special001.js";
import {
  SUSPECTS as DE_SUSPECTS, ORDER, CULPRITS, HINT_PENALTY, WRONG_PENALTY, LIMIT_MIN, SKEL,
  fmt, tatOf, decoyOf, hideOf, hubLog, kidsLog, sightings,
} from "./special-001.js";

export const TITLE = "Trick or Treat";
export const UI = {
  clock: "Hollow Lane", until: "until the sheriff", late: "sheriff waiting", stamp: "HALLOWEEN", fb: "the Halloween case",
  cert: "and unmasked the culprit before the sheriff reached Hollow Lane.", caseNo: "SPECIAL HALLOWEEN",
  stages: { 2: "New evidence: cameras and statements", 3: "New evidence: the yard", 4: "New evidence: Frank’s note" },
};
const pad2 = (n) => String(n).padStart(2, "0");

const ROLE = {
  linda: "Neighbor at No. 12, runner-up in the contest for years",
  greg: "Treasurer of the neighborhood fund",
  tyler: "Frank’s nephew, lives with him",
  rosa: "Photographer, taking pictures for the judges",
  coach: "High school football coach",
};
const COSTUME = { linda: "Witch", greg: "Grim Reaper", tyler: "Werewolf", rosa: "Vampire", coach: "Pumpkin Head" };
export const SUSPECTS = Object.fromEntries(Object.entries(DE_SUSPECTS).map(([k, s]) => [k, { ...s, name: k === "coach" ? "Dwayne “Coach” Miller" : s.name, role: ROLE[k], kostuem: COSTUME[k] }]));
export const NAMES = ["Frank", "Doyle", "Linda", "Price", "Greg", "Holloway", "Tyler", "Rosa", "Alvarez", "Dwayne", "Miller", "Agnes", "Whitfield"];

export const ITEM_NAMES = {
  1: "“Boo Hill” tombstone (hollow)", 2: "“R.I.P.” tombstone", 3: "Giant pumpkin (hollowed out)", 4: "Hay bale",
  5: "Scarecrow", 6: "“Here lies …” tombstone", 7: "Pumpkin pile", 8: "Witch’s cauldron",
  9: "Coffin (porch)", 10: "Leaf bags by the garage", 11: "Rocking chair (porch)", 12: "Mailbox",
};
export const WORD = { linda: "RENTED", greg: "LEDGER", tyler: "BEQUEST", rosa: "REPORT", coach: "BETTING" };

// ---------- Questions ----------
export const QUESTIONS = [
  { key: "zeit", nr: 1, type: "time", label: "At what time was the coffin lid shut on Frank?", hint: "Time on the 24-hour clock, e.g. 21:15" },
  { key: "taeter", nr: 2, type: "select", label: "Who was inside the skeleton suit?", hint: "Nobody changed shoes.",
    options: ORDER.map((k) => [k, `${SUSPECTS[k].name} (${SUSPECTS[k].kostuem})`]) },
  { key: "versteck", nr: 3, type: "select", label: "Where is the envelope with the prize money?", hint: "The sheriff will only search one spot.",
    options: Object.keys(ITEM_NAMES).map((n) => [String(n), `${n} · ${ITEM_NAMES[n]}`]) },
  { key: "wort", nr: 4, type: "word", label: "Which word is in Frank’s note?", hint: "One word, capitals don’t matter" },
];
export function solution(c, v) {
  return { zeit: fmt(tatOf(v)), taeter: c, versteck: String(hideOf(c, v)), wort: WORD[c] };
}

// ---------- Hints ----------
export const HINTS = (v, c) => {
  const T = tatOf(v), dec = decoyOf(c, v), H = hideOf(c, v), Z = zonesOf(H).split(""), w = WORD[c];
  const pair = [c, dec].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).map((k) => `${SUSPECTS[k].short} (${SUSPECTS[k].kostuem})`);
  return {
    zeit: [
      "Read Frank’s scare plan: when does he open the lid, and when does he shut it?",
      "Compare every “Coffin lid CLOSED” with the trick-or-treaters on the No. 15 camera. Careful: not every group there went to Frank’s.",
      "You’re looking for the “Coffin lid CLOSED” with no group at Frank’s right before it and none right after. Shortly afterward the fog ran nonstop.",
    ],
    taeter: [
      "The seventh skeleton is a person in a suit – and nobody changed shoes. Compare them with the contest photo (tap the picture and zoom in). Two shoe models are worn by two people each, one by a single person.",
      "If only one person wears those shoes, that settles it. Otherwise: which of the two matches the height on the measuring post – and who isn’t on any neighbor’s camera at the time? Hats, hoods, masks and the pumpkin head don’t count for height.",
      `At ${fmt(T)} only ${pair[0]} and ${pair[1]} are missing from the neighbors’ cameras. Only one of them matches the shoes and the height.`,
    ],
    versteck: [
      "Where the skeleton bends down, that’s where the envelope is. Which cameras saw it?",
      "Each camera’s motion zone is drawn in its own color on the yard plan (A blue, B green, C red). You’re looking for the decoration that lies in exactly those zones – and in no other.",
      Z.length === 1 ? `Only Camera ${Z[0]} shows the skeleton bending down. Only one decoration lies in its zone alone.` : `Cameras ${Z[0]} and ${Z[1]} show the skeleton bending down. Only one decoration lies in both zones and not in the third.`,
    ],
    wort: [
      "The note is written in the scavenger hunt’s Candy Code: every two candies make one letter.",
      `The first candy gives the row, the second the column. The word starts with “${w.slice(0, 2)}”.`,
      `The word starts with “${w.slice(0, Math.ceil(w.length / 2))}” and has ${w.length} letters.`,
    ],
  };
};

// ---------- Briefing ----------
export function briefing(N) {
  return {
    eyebrow: "Hollow Lane · Maple Hollow, Ohio · Halloween",
    title: "Trick or <em>Treat</em>",
    text: `It’s 21:55 (9:55 pm) on October 31. At 22:00 Hollow Lane was supposed to hand out the prize for the scariest homemade yard – 5,000 dollars from the neighborhood fund. But at 21:40 kids found Frank Doyle, the street’s Halloween fanatic, unconscious in his own prop coffin: lid bolted shut, full of fog. He’s alive – barely. The envelope with the prize money is gone. And the kids swear: “One of the skeletons stood up.” The sheriff is out across the whole county tonight and needs 50 minutes. Agnes Whitfield from No. 13 has called you in, ${N}. Until the sheriff gets here, you’re in charge.`,
    steps: [
      ["Read the case file", "You start with the documents from tonight. After each correct answer, new evidence is added – marked “New”."],
      ["Four questions, in order", "When was the coffin shut, who was inside the skeleton suit, where is the prize money – and what did Frank want to announce at 22:00?"],
      ["Hints cost time", `Up to three hints per question: +${HINT_PENALTY.join(", +")} penalty minutes. Every wrong answer costs +${WRONG_PENALTY} minutes.`],
      ["Beat the sheriff", `${LIMIT_MIN} minutes until the sheriff arrives. The clock keeps running after that – your time plus penalty minutes is your score.`],
      ["Fair play", "No AI, no search engine. The case can be solved with brains alone."],
    ],
  };
}

// ---------- Evidence ----------
const KIDS_EN = {
  "drei Kinder (Prinzessin, Dino, Pirat)": "three kids (princess, dinosaur, pirate)",
  "fünf Teenager als Zombies": "five teenagers dressed as zombies",
  "Feuerwehrmann und Marienkäfer mit Papa": "firefighter and ladybug with their dad",
  "zwei Astronauten": "two astronauts",
  "Einhorn mit Mama": "unicorn with her mom",
  "zwei Hexen mit Oma": "two witches with their grandma",
  "drei Pfadfinder als Mumien": "three scouts dressed as mummies",
  "die Ninja-Zwillinge mit ihrer Mutter": "the ninja twins with their mother",
};
const HUB_EN = {
  "Spuk-Modus aktiv · Nebel: Intervall": "Scare mode on · Fog: intermittent",
  "Bewegung Weg": "Motion path",
  "Bewegung Veranda": "Motion porch",
  "Sargdeckel AUF · Schrei-Sound": "Coffin lid OPEN · scream sound",
  "Sargdeckel AUF": "Coffin lid OPEN",
  "Sargdeckel ZU": "Coffin lid CLOSED",
  "Nebel: DAUERBETRIEB": "Fog: CONTINUOUS",
  "Nebel: Intervall": "Fog: intermittent",
  "Nebel: AUS (manuell)": "Fog: OFF (manual)",
};
const PLACES = {
  linda: [["hands out candy at the door of No. 12", "No. 11"], ["stands at the gate of No. 12 with the candy bowl", "No. 11"]],
  greg: [["serves punch at the table outside No. 17", "No. 19"], ["serves punch again, table outside No. 17", "No. 19"]],
  tyler: [["scares kids at the corner of Maple Avenue", "No. 9"], ["sits on the wall on Maple Avenue with two friends", "No. 9"]],
  rosa: [["photographs the yards of No. 9 and No. 11", "No. 10"], ["photographs the yard of No. 21", "No. 20"]],
  coach: [["leads the kids’ parade with a megaphone, outside No. 21", "No. 22"], ["hands out glow sticks to the parade outside No. 19", "No. 20"]],
};
const STATE = {
  linda: "“I was handing out candy at my door all evening. I popped inside once for a refill – Frank gives out the full-size candy bars, you have to keep up. Not that it matters, he always wins anyway.”",
  greg: "“I was at the punch table outside No. 17. I went home once to put the donation can somewhere safe. Frank had the envelope with the prize money – he wanted to hand it over himself.”",
  tyler: "“I was with the guys at the corner of Maple Avenue, scaring kids. At some point I went to my car to charge my phone. I’m staying with Uncle Frank until my debts are paid off. We get along. Mostly. He’s been on the phone with his lawyer for days – none of my business.”",
  rosa: "“I was photographing every yard for the judges, up and down the street. I went home once to swap batteries. Frank and I had a fight about my guests, yes. He even threatened to go to the city. So what?”",
  coach: "“I ran the kids’ parade with a megaphone. I went into my garage once for batteries. The bet with Frank? That was a joke between neighbors.”",
};
export function docs(c, N, v) {
  const d = [], T = tatOf(v), H = hideOf(c, v), Z = zonesOf(H), S = SUSPECTS[c];
  const rows = (list) => list.map((r) => `<tr>${r.map((x, i) => `<td${i === 0 ? ' class="mono"' : ""}>${x}</td>`).join("")}</tr>`).join("");
  // ----- Stage 1 -----
  d.push({ id: "fund", stage: 1, kind: "Note", kk: "Notiz", title: "Report by Agnes Whitfield (No. 13)", html: `
<div class="letterhead"><strong>Agnes Whitfield · retired nurse</strong><span>13 Hollow Lane · written at 21:52</span></div>
<p>At 21:40 the ninja twins from No. 22 and their mother came up to Frank’s coffin on the porch. No scream came from the coffin, and fog was seeping out of the cracks. The wooden bolt on the outside of the lid was shut – Frank only has it for show, you can’t reach it from inside. The mother opened it and called me.</p>
<ul>
<li>Frank was lying in the coffin, unconscious, his face gray from the fog. I pulled him out and gave him rescue breaths. He’s breathing again; the ambulance took him at 21:50. He can’t remember a thing.</li>
<li>The hose from the fog machine runs into the coffin – so it smokes when the lid pops open. On continuous, with the lid shut, there’s hardly any air left inside.</li>
<li>Frank’s judging folder was on the rocking chair on the porch. The envelope with the 5,000 dollars is missing.</li>
<li>Kids from the street say one of the skeletons on the porch “stood up” and ran into the yard – none of them knows exactly when. Frank has six prop skeletons, three on the porch and three in the yard.</li>
</ul>
<div class="postit">${N}, the sheriff is bound to ask: when did it happen, who did it, where’s the money – and why? <span>– A. W.</span></div>` });

  d.push({ id: "spukplan", stage: 1, kind: "Note", kk: "Notiz", title: "Frank’s scare plan (on the front door)", html: `
<div class="letterhead"><strong>SCARE PLAN · HALLOWEEN</strong><span>handwritten, taped to the front door</span></div>
<div class="notebook">
<p>from 21:00 ME in the coffin!! Spook app on auto</p>
<p>Kids come up the path → lid OPEN + scream button</p>
<p>Kids gone → lid CLOSED, wait, next group</p>
<p>Breaks in between: leave lid open, drink cider</p>
<p>Fog: intermittent. Big groups → CONTINUOUS button on the porch post, then back to intermittent</p>
<p>Judging folder + envelope → rocking chair. 22:00 awards ceremony!</p>
</div>
<p class="small">The spook app logs the motion sensors on the path and on the porch, the sensor on the coffin lid and the fog machine.</p>` });

  const hub = hubLog(v).sort((a, b) => a[0] - b[0]);
  d.push({ id: "spukapp", stage: 1, kind: "App log", kk: "Systemauszug", title: "Spook app: tonight’s log", html: `
<div class="letterhead"><strong>SpookHub · Haunted Yard Doyle</strong><span>log from Frank’s phone, events to the minute</span></div>
<table class="grid"><tr><th>Time</th><th>Event</th></tr>${rows(hub.map(([t, e]) => [fmt(t), HUB_EN[e] || e]))}</table>
<p class="small">“Motion path” = sensor on the front path, “Motion porch” = sensor on the porch. The coffin lid only reports open and closed – not who moves it.</p>` });

  const kids = kidsLog(v);
  d.push({ id: "kamera15", stage: 1, kind: "List", kk: "Liste", title: "Doorbell camera No. 15: trick-or-treaters", html: `
<div class="letterhead"><strong>The Parkers · 15 Hollow Lane</strong><span>excerpt from the camera app, across the street from Frank’s house</span></div>
<table class="grid"><tr><th>Time</th><th>Who</th><th>Where to</th></tr>${rows(kids.map(([t, w, wo]) => [fmt(t), KIDS_EN[w] || w, wo === "frank" ? "up Frank’s path (No. 14)" : "to our door (No. 15)"]))}</table>
<p class="small">Our camera sees Frank’s front path and our own front door. Other groups walked past Frank’s house without going up.</p>` });

  d.push({ id: "wettbewerb", stage: 1, kind: "List", kk: "Liste", title: "Costume contest at 20:30", html: `
<div class="letterhead"><strong>Hollow Lane Costume Contest</strong><span>photo in front of Frank’s “lineup” photo wall · adult category entrants</span></div>
${lineup(true, ORDER.map((k) => ({ name: SUSPECTS[k].short, costume: SUSPECTS[k].costume, inch: SUSPECTS[k].inch, shoe: SUSPECTS[k].shoe })))}
<table class="grid"><tr><th>Name</th><th>Costume</th><th>Who</th></tr>${ORDER.map((k) => `<tr><td>${SUSPECTS[k].name}</td><td>${SUSPECTS[k].kostuem}</td><td>${SUSPECTS[k].role}</td></tr>`).join("")}</table>
<p class="small">As every year, the yard prize has one rule: every decoration must be homemade – nothing bought, nothing rented. Only these five were out on the street all evening and knew Frank’s scare plan. All the other adults were with their kids or at their own door – the cameras confirm it.</p>` });

  d.push({ id: "drohbrief", stage: 1, kind: "Evidence", kk: "Fundstück", title: "Note in Frank’s mailbox", html: `
<div class="letterhead"><strong>Evidence</strong><span>from Frank’s mailbox, delivered yesterday</span></div>
<p class="mono" style="font-size:20px;letter-spacing:2px">YOUR YARD WILL BE YOUR GRAVE – 10/31</p>
<p>Cut-out letters, no sender. On the back, in small print: <i>“Hollow Creek High presents: the Drama Club’s Haunted House Tour! Tickets $5 at the door.”</i></p>
<p class="small">Agnes Whitfield: “The whole street got the same note in their mailbox yesterday. The drama club does it every year.”</p>` });

  // ----- Stage 2 -----
  const stamp = `${fmt(T - 1)}:${pad2(14 + (v || 0) * 9)}`;
  d.push({ id: "verandakamera", stage: 2, kind: "Camera still", kk: "Systemauszug", title: `Frank’s porch camera at ${fmt(T - 1)}`, html: `
<div class="letterhead"><strong>Porch camera · 14 Hollow Lane</strong><span>still from the motion recording</span></div>
${porchCam(true, S.inch, S.shoe, stamp)}
<p>Frank has six plastic prop skeletons: all white, with bone feet, on stakes. At 21:50 a black full-body skeleton suit was found in a leaf bag next to the garage – Frank’s spare costume from the garage. The garage was open all evening.</p>
<p class="small">Frank put the height chart on the post himself (“You must be this tall to be scared”). It measures from the porch floor, in feet and inches – like the photo wall at the contest.</p>` });

  const sg = sightings(c, v);
  d.push({ id: "sichtungen", stage: 2, kind: "List", kk: "Liste", title: "Neighbors’ cameras: who was where and when", html: `
<div class="letterhead"><strong>Doorbell camera review</strong><span>Hollow Lane No. 9 to 22 · put together by Agnes Whitfield</span></div>
<table class="grid"><tr><th>From–to</th><th>Costume</th><th>What</th></tr>${rows(sg.map(([a, b, k, i]) => [`${fmt(a)}–${fmt(b)}`, SUSPECTS[k].kostuem, `${PLACES[k][i][0]} (camera ${PLACES[k][i][1]})`]))}</table>
<p class="small">The cameras show costumes, not faces. Each costume appeared only once on the street.</p>` });

  d.push({ id: "aussagen", stage: 2, kind: "Record", kk: "Protokoll", title: "Statements of the five", html: `
<div class="letterhead"><strong>Quick interviews outside Frank’s house</strong><span>noted by Agnes Whitfield</span></div>
${ORDER.map((k) => `<p class="q">${SUSPECTS[k].name} – ${SUSPECTS[k].kostuem}</p><p class="a">${STATE[k]}</p>`).join("")}
<p class="small">All five were back in their costumes when we talked.</p>` });

  // ----- Stage 3 -----
  d.push({ id: "garten", stage: 3, kind: "List", kk: "Liste", title: "Frank’s yard: the judges’ plan", html: `
${plan(true, ITEM_NAMES, SKEL)}
<p class="small">Cameras A, B and C hang on the houses across the street (No. 13, 15 and 17). Their apps only report motion inside the marked motion zone.</p>` });

  const camRows = (cam) => [
    [fmt(T + 1), "Figure in skeleton suit at the edge of the zone, briefly"],
    [fmt(T + 2), Z.includes(cam) ? "Figure in skeleton suit bends down, about 20 seconds, then moves on" : "no motion"],
    [fmt(T + 5), "Group of trick-or-treaters on the front path"],   // the path lies in all three zones
  ];
  d.push({ id: "bewegungen", stage: 3, kind: "App log", kk: "Systemauszug", title: "Motion alerts from cameras A, B and C", html: `
<div class="letterhead"><strong>Motion alerts after the attack</strong><span>from the apps at No. 13 (A), No. 15 (B) and No. 17 (C)</span></div>
${["A", "B", "C"].map((cam) => `<p class="q">Camera ${cam}</p><table class="grid"><tr><th>Time</th><th>Alert</th></tr>${rows(camRows(cam))}</table>`).join("")}
<p class="small">In the dark the cameras only pick up outlines – but the bone print lights up in the glow of the porch light.</p>` });

  d.push({ id: "nachtrag", stage: 3, kind: "Note", kk: "Notiz", title: "Follow-up: where’s the money?", html: `
<div class="letterhead"><strong>Follow-up</strong><span>Agnes Whitfield, 22:05</span></div>
<p>None of the five had the envelope, and it wasn’t in the leaf bag with the suit either. The culprit had to get rid of it somewhere in the yard, fast – surely planning to come back for it later.</p>
<p>The sheriff called: he won’t dig up the whole yard, he’ll check exactly one spot. Which one?</p>` });

  // ----- Stage 4 -----
  d.push({ id: "notiz", stage: 4, kind: "Evidence", kk: "Fundstück", title: "Frank’s note from the judging folder", html: `
<div class="letterhead"><strong>Evidence</strong><span>notepad, at the very back of Frank’s judging folder</span></div>
${candyNote(true, WORD[c])}
<p>Agnes Whitfield: “Frank wanted to announce something at the awards ceremony at 22:00, ‘something that will change this street’. He wouldn’t say more. He wrote it in code instead – like his scavenger hunt for the kids.”</p>` });

  d.push({ id: "tafel", stage: 4, kind: "Evidence", kk: "Fundstück", title: "The scavenger hunt’s Candy Code chart", html: `
${candyGrid(true)}
<p class="small">The chart has hung on Frank’s garage door since the scavenger hunt last summer. Every letter is made of two candies.</p>` });
  return d;
}

// ---------- Solution ----------
const MOTIVE = {
  linda: "Frank had found out that Linda’s yard decorations weren’t homemade but rented from a party supply store – against the contest’s number one rule. At 22:00 he was going to disqualify her in front of the whole street. The word in his note: RENTED.",
  greg: "Money was missing from the neighborhood fund, and Frank had gone through the ledger. At 22:00 he was going to expose the gap in front of everyone – the prize money was supposed to buy Greg time to cover it. The word in Frank’s note: LEDGER.",
  tyler: "Tyler has debts he can’t pay back. At 22:00 Frank was going to announce that he was leaving his house not to Tyler but to the street’s Halloween fund. The word in his note: BEQUEST.",
  rosa: "Rosa rents out her house to vacation guests without a permit. Frank had reported her to the city and was going to tell everyone at 22:00. The word in his note: REPORT.",
  coach: "Coach secretly bets against his own team – and it kept losing suspiciously often. Frank had known since their bet. At 22:00 he was going to make it public in front of the whole street – the end of his coaching job. The word in his note: BETTING.",
};
const SHOE_TXT = { weiss: "white sneakers", schwarz: "black sneakers", cowboy: "brown cowboy boots" };
const ftin = (i) => `${Math.floor(i / 12)}′${i % 12}″`;
export function resolution(c, v) {
  const T = tatOf(v), S = SUSPECTS[c], H = hideOf(c, v), Z = zonesOf(H).split("");
  const pron = c === "linda" || c === "rosa" ? "she" : "he";
  const twin = ORDER.find((k) => k !== c && SUSPECTS[k].shoe === S.shoe);
  const shoeTxt = twin ? `${SHOE_TXT[S.shoe]} – the same model as ${SUSPECTS[twin].short}, but ${S.short} is ${ftin(S.inch)} tall and ${SUSPECTS[twin].short} ${ftin(SUSPECTS[twin].inch)}` : `${SHOE_TXT[S.shoe]} that nobody else wore`;
  const IN = { 1: "inside the hollow “Boo Hill” tombstone", 3: "inside the hollowed-out giant pumpkin", 4: "in the hay bale", 5: "under the scarecrow’s shirt", 8: "in the witch’s cauldron" };
  const text = `${S.name} took off the ${S.kostuem.toLowerCase()} costume, pulled Frank’s spare skeleton suit on in the open garage and stood among the prop skeletons on the porch. At ${fmt(T - 3)} Frank opened the lid for a break – not a kid in sight. At ${fmt(T)} ${S.short} slammed the lid shut, slid the bolt across and at ${fmt(T + 1)} hit the fog’s continuous button on the post. With the envelope from the judging folder on the rocking chair, ${pron} ran into the yard and hid it ${IN[H]} (no. ${H}) – exactly where ${Z.length === 1 ? `only Camera ${Z[0]} saw the skeleton bend down` : `Cameras ${Z[0]} and ${Z[1]} saw the skeleton bend down`}. ${pron[0].toUpperCase() + pron.slice(1)} stuffed the suit into a leaf bag. The kids who came up onto the porch at ${fmt(T + 5)} took the silent coffin for one of Frank’s breaks. What gave ${S.short} away were the shoes: ${shoeTxt}. ${MOTIVE[c]} Frank is recovering in the hospital. When questioned, ${S.short} only says: “He was just supposed to get a scare.”`;
  return {
    culprit: S.name, text, item: `${ITEM_NAMES[H]} (No. ${H})`,
    summary: `Culprit: ${S.name} (${S.kostuem}) · Coffin shut at ${fmt(T)} · Hiding place: ${ITEM_NAMES[H]} · Word: ${WORD[c]}`,
  };
}
