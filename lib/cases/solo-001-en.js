// Mordsteam Solo 001 – “Night Train to Venice” (English version)
// Same ids, stages, culprits, time variants, solutions and option codes as solo-001.js – only the visible texts differ.
// The server merges { ...DE, ...EN } for English runs. All game logic (time shifts, door log, searched spots) comes from DE.
import * as DE from "./solo-001.js";

const { timer, hm, fmt, shiftOf, cap, SEARCHED, HINT_PENALTY, WRONG_PENALTY, LIMIT_MIN, deathWin } = DE;

export const TITLE = "Night Train to Venice";

// approximate time in words, the way fellow passengers would put it (“just after half past one”)
function roughly(t) {
  const q = Math.round(hm(t) / 5) * 5;
  const W = { 75: "around quarter past one", 80: "around twenty past one", 85: "just before half past one", 90: "around half past one", 95: "just after half past one",
    100: "around twenty to two", 105: "around quarter to two", 110: "around ten to two", 115: "just before two", 120: "around two" };
  return W[q] || `around ${fmt(q)}`;
}

const SUSPECT_ABT = { helene: "Compartment 3", jonas: "Compartment 5", sofia: "Compartment 6", anton: "Staff compartment 1", lang: "Car 328, compartment 12" };
const SUSPECT_NAME = { lang: "Dr Friedrich Lang" };
export const SUSPECTS = Object.fromEntries(Object.entries(DE.SUSPECTS).map(([k, x]) =>
  [k, { ...x, name: SUSPECT_NAME[k] || x.name, abt: SUSPECT_ABT[k] }]));

const SPOT_TEXT = {
  regal328: { name: "Luggage rack by the entrance, car 328", zugang: "open" },
  schrank328: { name: "Wardrobe in the corridor, car 328", zugang: "open" },
  regal326: { name: "Luggage rack at the end of couchette car 326", zugang: "open" },
  schirm325: { name: "Umbrella stand, dining car 325", zugang: "open" },
  heizung327: { name: "Heater cover in the corridor, car 327", zugang: "only with a square key (train staff)" },
  waesche327: { name: "Linen locker in the staff compartment, car 327", zugang: "locked, the conductor has the key" },
  notsitz327: { name: "Storage box under the tip-up seat outside compartment 6, car 327", zugang: "open" },
};
export const SPOTS = Object.fromEntries(Object.entries(DE.SPOTS).map(([k, x]) => [k, { ...x, ...SPOT_TEXT[k] }]));

// ---------- Questions ----------
const Q_TEXT = {
  zeit: { label: "At what time did Viktor Hallwachs let his killer into the compartment?", hint: "Time (24-hour), e.g. 23:45" },
  taeter: { label: "Who poisoned Viktor Hallwachs?", hint: "Only one person had the opportunity." },
  versteck: { label: "Where is the real painting hidden?", hint: "The police will open only one place. Choose carefully." },
};
const OPT_NAME = { taeter: (k) => SUSPECTS[k].name, versteck: (k) => SPOTS[k].name };
export const QUESTIONS = DE.QUESTIONS.map((q) => ({
  ...q, ...Q_TEXT[q.key],
  ...(q.options ? { options: q.options.map(([k]) => [k, OPT_NAME[q.key](k)]) } : {}),
}));

// ---------- Hints (3 levels, cost penalty minutes) ----------
export const HINTS = (v) => ({
  zeit: [
    "The doctor narrows down the time of death.",
    "A visit leaves two openings from inside: one to let the visitor in, one when they leave.",
    "Within the time-of-death window exactly one such pair remains. The question asks for the first of the two openings.",
  ],
  taeter: [
    "Who was provably somewhere else at the time of the murder?",
    "For each person, look for proof in the logs, receipts and notes.",
    `Only one person has no proof for ${timer(v)("01:31")} to ${timer(v)("01:39")}. Careful: a statement on its own is not proof.`,
  ],
  versteck: [
    "The roll is 46 cm long. First cross out every place that is too small inside.",
    "The connecting-door log shows which cars the killer went into after the murder – the painting can only be there.",
    "Also cross out anything already searched or that the killer cannot open. Along their route exactly one place remains.",
  ],
});

// ---------- Briefing (before the start) ----------
export function briefing(N) {
  return {
    eyebrow: "Night train “La Serenissima” · Vienna – Venice",
    title: "Night Train to <em>Venice</em>",
    text: `It is 02:15, somewhere past Villach. There’s a knock at your compartment door. Anton Kofler, the sleeping-car conductor, is standing in the doorway, pale as a sheet: “${N}, forgive me – you read crime novels, don’t you? I saw the book on your bed. Mr Hallwachs is lying in the compartment next door. He’s dead. We stop in Udine at 02:55 and the police will board there. Until then … would you take a look?”`,
    steps: [
      ["Read the file", "You start with the documents from the scene. After every correct answer, new evidence is added – it is marked “New”."],
      ["Three questions, in order", "Time of the murder, the killer, the painting’s hiding place. The next question unlocks as soon as the previous one is solved."],
      ["Hints cost time", `Up to three hints per question: +${HINT_PENALTY.join(", +")} penalty minutes. Every wrong answer costs +${WRONG_PENALTY} minutes.`],
      ["Finish before Udine", `${LIMIT_MIN} minutes to Udine. The clock keeps running after that – your time plus penalty minutes makes your score.`],
      ["Fair play", "No AI, no search engine. The case can be cracked with brainpower alone."],
    ],
  };
}

// ---------- Evidence ----------
const A = (c) => c === "anton", S = (c) => c === "sofia";
const KIND = { Notiz: "Note", Befund: "Findings", Liste: "List", Protokoll: "Statements", Systemauszug: "System log", Beleg: "Receipt", Fundstück: "Exhibit" };

export function docs(c, N, v) {
  const d = [], s = timer(v);
  const de = DE.docs(c, N, v);
  const deDoc = (id) => de.find((x) => x.id === id);

  // ----- Stage 1: crime scene -----
  d.push({ id: "fundort", stage: 1, title: "Scene report, compartment 4", html: `
<div class="letterhead"><strong>Sleeping car 327 · Scene report</strong><span>taken down by conductor A. Kofler, ${s("02:13")}</span></div>
<p>${s("02:12")}: Compartment 4 (passenger Viktor Hallwachs, art dealer, Vienna) does not respond to knocking. Opened with the master card.</p>
<ul>
<li>Mr Hallwachs is lying fully dressed on the bed. No pulse, skin cool.</li>
<li>On the fold-down table: a cognac glass, half empty, bitter smell. Beside it a book and his reading glasses. The cognac was brought to him at ${s("00:52")} by the waitress from the dining car and handed over at the door (room service).</li>
<li>Open suitcase: inside, a framed painting, “Lagoon in the Mist”, frame 46 × 61 cm.</li>
<li>Window locked. No signs of a struggle, nothing knocked over.</li>
<li>The compartment door swings shut by itself after every opening and locks. From outside it opens only with the passenger keycard for compartment 4 or my master card.</li>
</ul>
<p class="meta">Doctor from car 328 called. Train manager informed. Compartment sealed.</p>
<p class="sign">A. Kofler <span>· Sleeping-car conductor</span></p>` });

  d.push({ id: "aerztin", stage: 1, title: "The doctor’s preliminary findings", html: `
<div class="letterhead"><strong>Dr Lucia Moretti · Physician</strong><span>travelling privately, car 328 · preliminary findings</span></div>
<p>Cause of death (provisional): overdose of a sleeping drug. The pupils, the smell and the glass point to a preparation dissolved in the cognac. It takes effect within a few minutes.</p>
<p>Time of death (estimated): between ${deathWin(v)[0]} and ${deathWin(v)[1]}. The body is still very warm – it cannot have been long. Not earlier – the body temperature rules that out.</p>
<p>Other findings: no injuries, no defensive wounds. He evidently knew his killer and suspected nothing.</p>
<div class="postit">${N}, the conductor says you’ll solve this. Fingers crossed – in Udine I want to give the police a name. <span>– L. M.</span></div>` });

  d.push({ id: "wagen", stage: 1, title: "Passenger list and train formation", html: `
<div class="letterhead"><strong>Passenger list, sleeping car 327</strong><span>Night train “La Serenissima” · Wien Hbf dep. ${s("21:25")} · Venezia S. Lucia arr. ${s("07:40")}</span></div>
<table class="grid"><tr><th>Compartment</th><th>Occupant</th></tr>
<tr><td>Staff 1</td><td>Anton Kofler, sleeping-car conductor</td></tr>
<tr><td>2</td><td>${N}</td></tr>
<tr><td>3</td><td>Helene Marquardt, gallery owner, Vienna</td></tr>
<tr><td>4</td><td>Viktor Hallwachs, art dealer, Vienna</td></tr>
<tr><td>5</td><td>Jonas Hallwachs, student, Vienna</td></tr>
<tr><td>6</td><td>Sofia Benedetti, journalist, Trieste</td></tr></table>
<h3>Sleeping car 328 (extract)</h3>
<table class="grid"><tr><th>Compartment</th><th>Occupant</th></tr>
<tr><td>12</td><td>Dr Friedrich Lang, art appraiser, Salzburg</td></tr>
<tr><td>14</td><td>Dr Lucia Moretti, physician, Padua</td></tr></table>
<h3>Train formation (from the front)</h3>
<p class="mono">[Loco] · 324 seating car · 325 dining car · 326 couchette car · 327 sleeping car · 328 sleeping car</p>
<p class="small">The toilet for car 327 is at the rear end of the car, next to compartment 6.</p>` });

  d.push({ id: "befragung", stage: 1, title: "Brief interviews with fellow passengers", html: `
<div class="letterhead"><strong>Brief interviews after the discovery</strong><span>noted by A. Kofler and Dr L. Moretti</span></div>
<p class="q">Helene Marquardt, compartment 3 – business partner</p>
<p class="a">“Viktor wanted to wind up our gallery. Yes, I was furious – thirty years’ work! But kill him? I couldn’t sleep, so I sat in the dining car, table 3, with a cup of tea. ${shiftOf(v) <= 6 ? "Until nearly two." : "Until about two."}”</p>
<p class="q">Jonas Hallwachs, compartment 5 – nephew</p>
<p class="a">“Uncle Viktor and I fell out over money, everyone knows that. I’ve got a few debts. I was in the dining car, drawing on my phone. The Wi-Fi’s better there.”</p>
<p class="q">Sofia Benedetti, compartment 6 – journalist</p>
<p class="a">“I’m writing about forged paintings from his gallery – he threatened to sue me. Tonight I had a row in the couchette car with a man who claimed I’d photographed him – ${roughly(s("01:30"))}, give or take. Ask the conductor, he came over.”</p>
<p class="q">Anton Kofler, staff compartment 1 – conductor</p>
<p class="a">“Hallwachs swindled my brother out of a lot of money years ago, that’s true. But I was working tonight. ${S(c) ? `Shortly after one I broke up Ms Benedetti’s row in the couchette car, and after that I was doing my rounds.` : `${cap(roughly(s("01:30")))} I was in the couchette car, breaking up Ms Benedetti’s row, and at ${s("01:34")} I radioed the train manager.`}”</p>
<p class="q">Dr Friedrich Lang, car 328, compartment 12 – art appraiser</p>
<p class="a">“Yes, I was with him shortly before midnight, a quarter of an hour perhaps. I brought him my appraisal of the ‘Lagoon’ – he was in excellent spirits. That he had a hold over me because of it, you evidently know already. ${cap(roughly(s("01:28")))} I was with the doctor – my migraine.”</p>
<p class="small">Apart from Dr Lang, everyone says they did not see Mr Hallwachs again that evening.</p>` });

  const opened = (who) => `<td>opened</td><td>${who}</td>`;
  const inside = "inside · button (letting in or leaving)";
  d.push({ id: "tuer", stage: 1, title: "Door log, compartment 4", html: `
<div class="letterhead"><strong>Door control, sleeping car 327</strong><span>Log for compartment 4 · printed after the discovery</span></div>
<p>Important: “inside · button” means someone in the compartment opened the door – anyone leaving the compartment also has to press the button inside. The door then swings shut by itself.</p>
<table class="grid"><tr><th>Time</th><th>Event</th><th>Triggered by</th></tr>
<tr><td class="mono">${s("23:10")}</td>${opened("outside · passenger keycard comp. 4")}</tr>
<tr><td class="mono">${s("23:48")}</td>${opened(inside)}</tr>
<tr><td class="mono">${s("00:06")}</td>${opened(inside)}</tr>
<tr><td class="mono">${s("00:52")}</td>${opened(inside)}</tr>
<tr><td class="mono">${s("01:31")}</td>${opened(inside)}</tr>
<tr><td class="mono">${s("01:39")}</td>${opened(inside)}</tr>
<tr><td class="mono">${s("02:12")}</td>${opened("outside · master card K-01")}</tr></table>
<p class="small">The keycard for compartment 4 was lying on the fold-down table.</p>` });

  // ----- Stage 2: logs and receipts -----
  const langGuilty = c === "lang";
  d.push({ id: "moretti", stage: 2, title: "The doctor’s notes on the night", html: `
<div class="letterhead"><strong>Dr L. Moretti · Notes</strong><span>car 328, compartment 14 · for the police</span></div>
<div class="notebook">
<p><span class="nb-date">${s("22:40")}</span> Dinner in the dining car, then back to my compartment. Read.</p>
${langGuilty
    ? `<p><span class="nb-date">${s("01:08")}</span> Dr Lang (comp. 12) knocks, migraine. Gave him a tablet. Back in his compartment after five minutes.</p>`
    : `<p><span class="nb-date">${s("01:28")}</span> Dr Lang (comp. 12) knocks, migraine. Tablet and tea. He stayed until ${s("01:46")}, telling me about auctions.</p>`}
<p><span class="nb-date">${s("02:13")}</span> Conductor fetches me to car 327. Hallwachs dead.</p>
</div>` });

  const heleneGuilty = c === "helene";
  // receipts in chronological order (all times after midnight)
  const bons = [
    [s("00:40"), `Room service comp. 327/4 · 1 × Cognac VSOP · delivered ${s("00:52")} (Giulia)`],
    [s("00:58"), "Table 3 · 1 × camomile tea"],
    heleneGuilty ? [s("01:06"), `Table 3 · 1 × butter biscuits · paid ${s("01:12")}`] : [s("01:30"), `Table 3 · 1 × peppermint tea · paid ${s("01:49")}`],
    [s("01:10"), "Table 5 · 1 × cola, 1 × toastie"],
    [s("01:36"), `Staff · 1 × coffee · ${S(c) ? "A. Kofler" : "Giulia"}`],
    [s("01:46"), "Table 5 · 1 × espresso"],
  ];
  d.push({ id: "bon", stage: 2, title: "Dining car: receipts and the waitress’s note", html: `
<div class="receipt"><div class="r-head">DINING CAR 325 · Night journal</div>
${bons.sort((x, y) => x[0].localeCompare(y[0])).map((x) => `${x[0]} · ${x[1]}`).join("<br>")}</div>
<div class="postit">${heleneGuilty
      ? `The lady at table 3 (grey hair, pearl necklace) left at about ${s("01:25")}. Didn’t come back.`
      : `The lady at table 3 (grey hair, pearl necklace) sat reading until about ${s("01:50")}. Ordered another tea in between.`} <span>– Giulia, dining car</span></div>
<p class="small">Table 5: young man with phone and headphones.</p>` });

  const jonasGuilty = c === "jonas";
  const row = (dev, ap, a, b) => `<tr><td>${dev}</td><td>${ap}</td><td class="mono">${s(a)}</td><td class="mono">${s(b)}</td></tr>`;
  const AP325 = "AP 325 (dining car)", AP327 = "AP 327 (sleeping car)";
  d.push({ id: "wlan", stage: 2, title: "The train’s Wi-Fi log", html: `
<div class="letterhead"><strong>On-board Wi-Fi “Serenissima-Free”</strong><span>Log-ins per access point · extract ${s("00:30")}–${s("02:00")}</span></div>
<table class="grid"><tr><th>Device</th><th>Access point</th><th>from</th><th>to</th></tr>
${jonasGuilty ? `${row("Jonas-Phone", AP325, "00:48", "01:27")}
${row("Jonas-Phone", AP327, "01:29", "01:41")}
${row("Jonas-Phone", AP325, "01:43", "01:58")}`
    : `${row("Jonas-Phone", AP325, "00:48", "01:12")}
${row("Jonas-Phone", AP325, "01:14", "01:49")}
${row("Jonas-Phone", AP325, "01:51", "01:58")}`}
${row("Galaxy-7F2", "AP 326 (couchette car)", "00:30", "02:00")}
${row("iPad-Moretti", "AP 328 (sleeping car)", "00:30", "01:05")}
${row("Kofler-Dienst", AP327, "00:30", "02:00")}</table>
<p class="small">A device logs on to the access point of the car it is in. “Kofler-Dienst” is the conductor’s service tablet; it stays in the staff compartment. If a phone briefly goes to sleep, a new line begins afterwards.</p>` });

  const nbp = (t, x) => `<p><span class="nb-date">${s(t)}</span> ${x}</p>`;
  let nb = `${nbp("23:40", "Ticket check in 327 done, all in order.")}
${nbp("00:52", "Cognac for comp. 4 came from the dining car (Giulia).")}`;
  if (S(c)) nb += `${nbp("01:05", `Car 326: row between Ms Benedetti (327/6) and the passenger in couchette berth 64 over photos. Went over, calmed things down by ${s("01:15")}.`)}
${nbp("01:30", `Rounds 326 → 325, until ${s("01:45")}. Quiet.`)}`;
  else if (A(c)) nb += `${nbp("01:30", "Break in the staff compartment.")}
${nbp("01:48", `Report from colleague Ferri (dining car): car 326, row between Ms Benedetti and the passenger in berth 64 over photos, approx. ${s("01:30")}–${s("01:45")}. She calmed things down herself.`)}`;
  else nb += `${nbp("01:30", `Car 326: row between Ms Benedetti (327/6) and the passenger in couchette berth 64 over photos. Went over, calmed things down by ${s("01:45")}.`)}
${nbp("01:47", "Back in 327. Quiet.")}`;
  nb += nbp("02:12", "Comp. 4 no response. Master card. Hallwachs dead. Fetched the doctor.");
  d.push({ id: "notizbuch", stage: 2, title: "The conductor’s duty notebook", html: `
<div class="letterhead"><strong>Duty log A. Kofler</strong><span>Sleeping car 327 · night shift</span></div>
<div class="notebook">${nb}</div>` });

  const img = (n, t, x) => `<tr><td>IMG_${n}</td><td class="mono">${s(t)}</td><td>${x}</td></tr>`;
  d.push({ id: "kamera", stage: 2, title: "Sofia’s camera: photo timestamps", html: `
<div class="letterhead"><strong>Camera S. Benedetti · Image list</strong><span>handed over voluntarily · camera timestamps</span></div>
<table class="grid"><tr><th>Image</th><th>Time</th><th>Subject (from preview)</th></tr>
${img(2201, "00:44", "Dining car, table lamp")}
${S(c) ? `${img(2202, "01:03", "Couchette car 326, corridor")}
${img(2203, "01:05", "Berth 64, man raising his hand")}
${img(2204, "01:18", "Sleeping car 327, compartment 6, notepad")}
${img(2205, "01:52", "Sleeping car 327, corridor, window")}`
    : `${img(2202, "01:28", "Couchette car 326, corridor")}
${img(2203, "01:33", "Berth 64, man raising his hand")}
${img(2204, "01:37", A(c) ? "Couchette car 326, waitress with tray (blurred)" : "Couchette car 326, conductor’s uniform (blurred)")}
${img(2205, "01:52", "Sleeping car 327, corridor, window")}`}</table>
<p class="small">Checked against the train clock, the camera clock is accurate to the minute.</p>` });

  const fk = (t, who, x) => `<tr><td class="mono">${s(t)}</td><td>${who}</td><td>${x}</td></tr>`;
  const K = "K-327 (Kofler)";
  d.push({ id: "funk", stage: 2, title: "Train radio log", html: `
<div class="letterhead"><strong>Train radio · Train manager’s log</strong><span>Channel 2 · extract from ${s("01:00")}</span></div>
<table class="grid"><tr><th>Time</th><th>From</th><th>Message</th></tr>
${fk("01:02", "Dining car", "Night service till open.")}
${A(c) ? `${fk("01:28", K, `Going on my break, staff compartment, until approx. ${s("01:45")}.`)}
${fk("01:47", K, "Break over.")}`
    : S(c) ? `${fk("01:14", K, "Row in car 326 settled.")}
${fk("01:34", K, "On my rounds, location 325, all quiet.")}`
    : `${fk("01:34", K, "Location 326, row between two passengers, I’ve got it under control.")}
${fk("01:47", K, "Row over, back to 327.")}`}
${fk("02:14", K, "Death in car 327, comp. 4. Doctor on scene.")}
${fk("02:15", "Train manager", "Udine police notified, boarding at 02:55.")}</table>
<p class="small">Radios do not transmit their location automatically. Locations are as stated by the speaker.</p>` });

  d.push({ id: "blister", stage: 2, title: "Item found in the toilet of car 327", html: `
<div class="evidence">EXHIBIT · TOILET, CAR 327 · IN THE BIN</div>
<p style="margin-top:14px">Empty blister pack “Somnaril 10 mg”, 10 tablets, all pressed out. A strong sleeping drug, prescription only.</p>
<div class="receipt"><div class="r-head">Pharmacy label (almost completely torn off)</div>…armacy ·····<br>for: ·····<br>1 tab. at night as needed</div>
<p class="small">Name and pharmacy are no longer legible. The bin was last emptied at ${s("00:30")}.</p>` });

  // ----- Stage 3: the painting -----
  d.push({ id: "gemaelde", stage: 3, title: "Addendum: the painting is a copy", html: `
<div class="letterhead"><strong>Addendum to the scene report</strong><span>Dr L. Moretti, restorer in her spare time</span></div>
<p>I took a closer look at the picture in the suitcase. The paint is too fresh and the varnish still smells – this is a copy.</p>
<p>Threads from an old canvas are caught on the inner edge of the frame. So the original was cut out with a knife and the copy put in its place.</p>
<p>A canvas this size has to be rolled, otherwise the paint cracks. The roll is 46 cm long and about 8 cm thick. It must still be on the train – nobody has got off since Villach, and the doors between the cars record every opening.</p>` });

  d.push({ id: "gepaeck", stage: 3, title: "Fellow passengers’ luggage searched", html: `
<div class="letterhead"><strong>Luggage search</strong><span>Train attendant C. Ferri, with the consent of all passengers</span></div>
<table class="grid"><tr><th>Whose is it?</th><th>Items</th><th>Result</th></tr>
<tr><td>Helene Marquardt</td><td>Small suitcase, hatbox</td><td>nothing found</td></tr>
<tr><td>Jonas Hallwachs</td><td>Rucksack, drawing tube</td><td>nothing found</td></tr>
<tr><td>Sofia Benedetti</td><td>Trolley case, tripod bag</td><td>nothing found</td></tr>
<tr><td>Anton Kofler</td><td>Service case, bag</td><td>nothing found</td></tr>
<tr><td>Viktor Hallwachs</td><td>Suitcase</td><td>only the copy in the frame</td></tr></table>
<p class="small">Whoever took the picture did not keep it on them.</p>` });

  const searched = SEARCHED[c];
  d.push({ id: "verstecke", stage: 3, title: "Possible hiding places on the train", html: `
<div class="letterhead"><strong>Possible hiding places</strong><span>List by train attendant C. Ferri · inside measurement = longest side</span></div>
<table class="grid"><tr><th>Place</th><th>Inside</th><th>Access</th><th>Already searched?</th></tr>
${Object.entries(SPOTS).map(([k, x]) => `<tr><td>${x.name}</td><td class="mono">${x.innen}</td><td>${x.zugang}</td><td>${searched.includes(k) ? "yes, empty" + (k === "waesche327" ? " (Mr Kofler unlocked it)" : "") : "–"}</td></tr>`).join("")}</table>
<p class="small">That is as far as Ms Ferri got before Udine. The police will have to open the rest – tell them where to look.</p>` });

  // Connecting doors: the movements are taken from the German log (same logic), only the wording changes.
  const moves = [...deDoc("tueren").html.matchAll(/<tr><td class="mono">([^<]+)<\/td><td>[^<]*<\/td><td>von (\d+) nach (\d+)<\/td><\/tr>/g)].map((x) => [x[1], x[2], x[3]]);
  d.push({ id: "tueren", stage: 3, title: "Log of the connecting doors", html: `
<div class="letterhead"><strong>Automatic connecting doors</strong><span>Train control log · ${s("01:00")} to 02:12 (discovery) · only openings where someone passed through</span></div>
<table class="grid"><tr><th>Time</th><th>Connection</th><th>Direction</th></tr>
${moves.map(([t, a, b]) => `<tr><td class="mono">${t}</td><td>Cars ${[a, b].sort().join(" / ")}</td><td>from ${a} to ${b}</td></tr>`).join("")}</table>
<p class="small">Order of the cars: 324 · 325 dining car · 326 couchette car · 327 sleeping car · 328 sleeping car. Every passage between 324 and 328 is recorded – no entry means nobody went through. Anyone who stays within one car does not appear here. The dining-car staff stay in the dining car unless they are called.</p>` });

  // kind: English label; kk keeps the German kind so the client styling (keyed on German kinds) still works
  return d.map((x) => {
    const g = deDoc(x.id);
    return { id: x.id, stage: x.stage, kind: KIND[g.kind] || g.kind, kk: g.kk || g.kind, title: x.title, html: x.html };
  });
}

// ---------- Resolution ----------
const CONFESSION = (s) => ({
  helene: `Helene Marquardt left the dining car as early as ${s("01:25")}. At ${s("01:31")} she knocked on Viktor’s door and he let her in – she was his partner, after all. While he showed her the contract winding up the gallery, she slipped her sleeping pills into his cognac and swapped the painting for the copy. She threw the empty blister pack into the toilet, and at ${s("01:41")} she carried the roll into the neighbouring car 328 – onto the luggage rack by the entrance, where nobody searching car 327 would look. “The Lagoon belongs to the gallery,” she says. “And the gallery belongs to me.”`,
  jonas: `Jonas Hallwachs left the dining car for the sleeping car at ${s("01:27")} – his phone gives him away. His uncle opened the door to him at ${s("01:31")}. Jonas had painted the copy himself; he swapped it for the original once Viktor had fallen asleep. On his way back to the dining car he pushed the roll onto the luggage rack at the end of couchette car 326, between strangers’ rucksacks. Jonas was in debt and wanted to sell the original on the quiet. The sleeping pills were only meant to keep Viktor sound asleep – he claims he never knew that ten tablets in a cognac would kill. He threw the empty blister pack into the toilet of car 327.`,
  sofia: `Sofia Benedetti’s row in the couchette car was over by ${s("01:15")}. At ${s("01:31")} she was at Viktor’s door, supposedly for one last interview. She wanted the original as proof of his forgeries – and when he refused, the sleeping pills went into the glass. She threw the empty blister pack into the toilet at the end of the car. After that she never left the car: the roll is in the storage box under the tip-up seat right outside her compartment.`,
  lang: `Dr Friedrich Lang had brought Viktor the appraisal at midnight – a false one, like so many others Viktor used to blackmail him. He had already been to the doctor at ${s("01:08")}, for just five minutes. At ${s("01:30")} he crossed back into car 327; Viktor let him in at ${s("01:31")} without a second thought, and the sleeping drug ended up in the cognac; he got rid of the empty blister pack in the toilet of car 327. By ${s("01:40")} Lang was back in car 328 – the roll is in the wardrobe in the corridor, three steps from his compartment.`,
  anton: `Anton Kofler was never in the couchette car – the notebook and the radio log give away his “break” from ${s("01:28")} to ${s("01:47")}. Viktor opened the door to the conductor at ${s("01:31")} without a second thought. Anton threw the empty blister pack into the toilet of car 327. For Anton’s brother, the painting was compensation for the money he had lost. He even unlocked the linen locker for the train attendant himself – the original had long since been tucked behind the heater cover in the corridor, which only staff with the square key can open.`,
});
export function resolution(c, v) {
  return { culprit: SUSPECTS[c].name, text: CONFESSION(timer(v))[c], item: SPOTS[SUSPECTS[c].spot].name };
}
