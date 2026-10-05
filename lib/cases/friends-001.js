// Mordsteam Friends 001 – „Letzte Runde auf der Hütte“
// 4–8 Spieler, jeder ermittelt am eigenen Gerät. Einer von ihnen ist (ausgelost) der Täter – niemand weiß es vorher.
// Die Gruppe (Besetzung, Täter, Zeitvariante) ist für alle gleich; jeder Spieler hat einen eigenen Durchgang.
// G = { players: [{ name (HTML-escaped), quirk, act, room }], culprit, decoy, tvar, beer, excuse, plus }
// Aktivitäten zur Tatzeit: "karten" (Würfeln in der Küche, Punkteblock) und "balkon" (Zeitraffer).
// Frage 2: Zur Tatzeit sind ZWEI Leute kurz weg – der Täter und ein Lockvogel (holt oben Pullover/Decken).
//   Krimiabend: Loisl hat beide Erklärungen notiert. Plus: Die Erklärungen gibt es nur im Verhörraum.
//   Die Ausrede des Täters widerspricht einem Beweisstück (Haustür, Zeitraffer, Punkteblock).
// Frage 3: Auf dem Rückweg des Täters von der Kamera liegt genau eine Auffälligkeit aus Loisls Rundgang.
// Frage 4 (Plus): Ferdls Cloud-Passwort – zwei Doppelgänger kennen je ein Stück, die Hausnummer steht im Hüttenplan.
// Frage 5 (Plus): das Motiv – Ferdls „Teil 2“ nennt die Gäste nur mit Kuhnamen. Jeder Doppelgänger kennt seinen eigenen,
//   der Täter verschweigt seinen, ein Zeuge kennt ihn. Wer den Kuhnamen des Täters hat, findet seine Geschichte.

export const ID = "friends-001";
export const TITLE = "Letzte Runde auf der Hütte";
export const LIMIT_MIN = 50;               // bis der Hubschrauber landet
export const LIMIT_MIN_PLUS = 70;          // Plus: mit Verhörraum und Finale
export const limitOf = (G) => (G.plus ? LIMIT_MIN_PLUS : LIMIT_MIN);
export const VERHOER_MAX = 40;             // Fragen pro Spieler im Verhörraum (Passwort und Motiv brauchen mehrere)
export const VERHOER_FROM_STAGE = 2;       // Verhörraum öffnet, sobald Frage 1 gelöst ist
export const CLOCK_START = 7 * 60 + 40;    // Hüttenuhr beim Start: 07:40
export const CLOCK_LABEL = "bis zum Hubschrauber";
export const LATE_LABEL = "Bergrettung wartet";
export const MIN_PLAYERS = 4, MAX_PLAYERS = 8;

// ---------- Eigenheiten (feste Liste, keine Freitexte) ----------
// clip: Titel von Ferdls heimlichem Clip ({V} = Vorname, {Z} = Zimmer) · award: Spaßurkunde
export const QUIRKS = {
  schnarcht: { label: "schnarcht wie eine Kettensäge", clip: "Die Kettensäge aus Zimmer {Z}", award: "Die Goldene Kettensäge" },
  dusche: { label: "singt unter der Dusche", clip: "Zirbenblick sucht den Superstar", award: "Der Goldene Duschkopf" },
  schoko: { label: "isst heimlich die Schokolade der anderen", clip: "Der Milka-Marder", award: "Der Goldene Schokohase" },
  foto: { label: "fotografiert jedes Essen", clip: "Das Raclette wird kalt – Hauptsache, das Foto passt", award: "Die Goldene Linse" },
  karten: { label: "kann beim Würfeln nicht verlieren", clip: "Würfeln mit Wutanfall", award: "Der Goldene Würfel" },
  schlaf: { label: "redet im Schlaf", clip: "Nachtgespräche mit {V}", award: "Das Goldene Kissen" },
  yoga: { label: "macht um 6 Uhr früh Yoga", clip: "Der herabschauende Hund weckt die ganze Hütte", award: "Die Goldene Yogamatte" },
  hausschuhe: { label: "trägt Hausschuhe mit Tiergesicht", clip: "Das Einhorn im Skiraum", award: "Der Goldene Pantoffel" },
  spaet: { label: "kommt immer zu spät", clip: "Gleich da! (seit 40 Minuten)", award: "Die Goldene Sanduhr" },
  kuehe: { label: "hat Angst vor Kühen", clip: "{V} gegen Rosi, die Kuh", award: "Die Goldene Kuhglocke" },
  navi: { label: "erklärt allen den Weg, ohne ihn zu kennen", clip: "Das Navi auf zwei Beinen", award: "Der Goldene Kompass" },
  tanzt: { label: "tanzt beim Kochen", clip: "Dirty Dancing mit dem Kochlöffel", award: "Der Goldene Kochlöffel" },
  google: { label: "googelt jeden Streit sofort", clip: "Faktencheck um Mitternacht", award: "Die Goldene Suchmaschine" },
  witze: { label: "lacht über die eigenen Witze vor der Pointe", clip: "Der Witz, der nie ankam", award: "Die Goldene Pointe" },
  pflanzen: { label: "spricht mit Pflanzen", clip: "{V} und der Gummibaum", award: "Die Goldene Gießkanne" },
  snacks: { label: "hat immer zu viele Snacks dabei", clip: "Der Rucksack ohne Boden", award: "Der Goldene Rucksack" },
};
export const QUIRK_KEYS = Object.keys(QUIRKS);

// Verteilung der Aktivitäten nach Gruppengröße: [karten, balkon]
// Bei 4 Spielern würfeln drei, einer sitzt allein am Balkon – so bleiben am Würfeltisch immer mindestens zwei (Go-live-Test 3, F-8)
export const MIX = { 4: [3, 1], 5: [3, 2], 6: [3, 3], 7: [4, 3], 8: [4, 4] };
const ACTS = ["karten", "balkon"];
export const actOf = (p) => (p.act === "karten" ? "karten" : "balkon");   // alte Testgruppen mit „bett“ laufen als Balkon

// Zufällige Aufstellung einer neuen Gruppe (rnd(n) → 0..n-1)
export function setup(n, rnd) {
  const acts = [];
  MIX[n].forEach((k, i) => { for (let j = 0; j < k; j++) acts.push(ACTS[i]); });
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  shuffle(acts);
  const rooms = shuffle([...Array(n).keys()]).map((p, i) => ({ p, room: Math.floor(i / 2) + 1 })).sort((a, b) => a.p - b.p).map((x) => x.room);
  // Täter und Lockvogel fehlen in denselben Würfelrunden – am Tisch müssen immer mindestens zwei weiterspielen
  const maxAway = MIX[n][0] - 2;
  let culprit, others, decoy, g = 0;
  do {
    culprit = rnd(n);
    others = [...Array(n).keys()].filter((i) => i !== culprit);
    decoy = others[rnd(others.length)];
  } while ([culprit, decoy].filter((i) => acts[i] === "karten").length > maxAway && g++ < 200);
  const beerPool = acts.map((a, i) => i).filter((i) => acts[i] === "karten" && i !== culprit && i !== decoy);
  return { acts, rooms, culprit, decoy, tvar: rnd(TIME_SHIFTS.length), beer: beerPool.length ? beerPool[rnd(beerPool.length)] : others.find((i) => acts[i] === "karten") ?? others[0], excuse: rnd(4) };
}
// Lockvogel für alte Gruppen ohne Eintrag
export const decoyOf = (G) => (Number.isInteger(G.decoy) && G.decoy !== G.culprit ? G.decoy : (G.culprit + 1) % G.players.length);

// ---------- Zeitvarianten: der Tatblock 00:40–02:30 verschiebt sich um D Minuten ----------
export const TIME_SHIFTS = [0, -5, 7];   // Tatzeit 01:12 · 01:07 · 01:19
const pad2 = (n) => String(n).padStart(2, "0");
export const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const fmt = (x) => `${pad2(Math.floor((((x % 1440) + 1440) % 1440) / 60))}:${pad2(((x % 60) + 60) % 60)}`;
// Verschiebt jede Uhrzeit um die Zeitvariante (auch vor 00:40) – für Ferdls zweiten Saunagang (Go-live-Test 3, F-3)
export const shiftAll = (v) => (t) => fmt(hm(t) + (TIME_SHIFTS[v || 0] || 0));
export function timer(v) {
  const D = TIME_SHIFTS[v || 0] || 0;
  return (t) => { const x = hm(t); return x >= 40 && x < 150 ? fmt(x + D) : t; };
}

// ---------- Fragen ----------
export const SPOTS = {
  flur_schuhe: { name: "Schuhschrank im Flur", area: "Flur" },
  kueche_zucker: { name: "Zuckerdose im Küchenregal", area: "Küche" },
  stube_holz: { name: "Holzkorb neben dem Kachelofen, Stube", area: "Stube" },
  balkon_trog: { name: "Blumentrog auf dem Balkon", area: "Balkon" },
  keller_ski: { name: "Skischuh im Skiraum", area: "Keller" },
  keller_kuehl: { name: "Kellerkühlschrank", area: "Keller" },
  og_spuelkasten: { name: "Spülkasten im Bad, Obergeschoss", area: "Obergeschoss" },
  schuppen: { name: "Brennholzstapel im Holzschuppen", area: "draußen" },
};
export const HIDE = { karten: "flur_schuhe", balkon: "balkon_trog" };

// ---------- Die Ausrede des Täters (widerspricht je nach Gruppe einem Beweisstück) ----------
export const EXCUSES = {
  karten: [
    ["Ich war nur kurz draußen vor der Haustür, eine rauchen.", "Die Haustür war laut Hütten-App die ganze Nacht zu."],
    ["Ich hab im Auto mein Handy-Ladekabel gesucht.", "Die Haustür war laut Hütten-App die ganze Nacht zu – und zum Auto geht es nur da hinaus."],
    ["Ich war draußen und hab nachgeschaut, ob der Fuchs wieder ums Haus schleicht.", "Die Haustür war laut Hütten-App die ganze Nacht zu."],
    ["Ich hab mich kurz auf den Balkon gesetzt, frische Luft schnappen.", "Auf dem Zeitraffer vom Balkon ist in dieser Zeit niemand dazugekommen."],
  ],
  balkon: [
    ["Ich war nur kurz draußen vor der Haustür, eine rauchen.", "Die Haustür war laut Hütten-App die ganze Nacht zu."],
    ["Ich hab im Auto mein Handy-Ladekabel gesucht.", "Die Haustür war laut Hütten-App die ganze Nacht zu – und zum Auto geht es nur da hinaus."],
    ["Ich war draußen und hab nachgeschaut, ob der Fuchs wieder ums Haus schleicht.", "Die Haustür war laut Hütten-App die ganze Nacht zu."],
    ["Ich war in der Küche und hab Ferdls Zirbenschnaps gesucht.", "Laut Punkteblock kam die ganze Nacht niemand in die Küche außer den Würfelnden."],
  ],
};
export const excuseOf = (G) => EXCUSES[actOf(G.players[G.culprit])][(G.excuse || 0) % 4];
const DECOY_TXT = { karten: "Ich bin kurz hinauf ins Zimmer und hab mir einen Pullover geholt – in der Küche war's kalt.", balkon: "Ich bin kurz hinein und hab oben noch eine Decke geholt – auf dem Balkon war's eisig." };

// ---------- Plus-Finale: Ferdls Cloud-Passwort ----------
export const PW_OPTIONS = [["zenzi17", "Zenzi17"], ["zenzi23", "Zenzi23"], ["rosi23", "Rosi23"], ["rosi17", "Rosi17"], ["zenzi1640", "Zenzi1640"], ["resi23", "Resi23"]];
const PW_FRAG = [
  "Ferdl hat einmal beim Schnaps angegeben, sein Cloud-Passwort sei „unknackbar“: der Name seiner allerersten Kuh, gleich dahinter die Hausnummer der Hütte.",
  "Ferdls allererste Kuh hieß Zenzi – die hat er als Bub selber aufgezogen, davon erzählt er bei jedem Besuch. Die Rosi von heute ist schon seine fünfte Kuh.",
  "Die Gemeinde hat im Frühjahr umnummeriert: Die Hütte ist jetzt Almweg 23, auf Ferdls altem Gästezettel steht noch die 17. Ferdl hat erzählt, dass er sein Passwort gleich mit der neuen Nummer geändert hat.",
];
export function pwHolders(G) {
  const n = G.players.length, out = [];
  for (let k = 1; out.length < 3; k++) { const i = (G.culprit + k) % n; if (i !== G.culprit) out.push(i); }
  return out;
}

// ---------- Plus-Finale 2: Ferdls „Teil 2“ – die Abrechnung ----------
// Ferdl nennt seine Gäste nach Kühen. Zuordnung und Geschichten sind je Gruppe fest (aus G abgeleitet).
export const NICKS = ["Liesl", "Berta", "Fanny", "Gretl", "Moni", "Burgi", "Kathi", "Vroni", "Wally", "Mitzi"];
export const SECRETS = [
  "hat beim Hüttenquiz im Februar heimlich mit dem Handy geschummelt – und die 300 Euro Preisgeld eingesteckt",
  "hat meine Hütte unter falschem Namen im Internet mit einem Stern zerrissen",
  "hat meine Hüttenvideos geklaut und auf dem eigenen Kanal als eigene hochgeladen",
  "hat Omas Zirbenschnaps-Rezept an eine Brennerei im Tal verkauft",
  "hat beim Dorfrodeln den Zeitnehmer mit einer Kiste Bier bestochen",
  "hat mein Gästebuch mit erfundenen Promi-Einträgen vollgeschrieben",
  "hat sich beim letzten Besuch den Hüttenschlüssel nachmachen lassen – und war seitdem zweimal heimlich da",
  "hat Rosis Kuhglocke mitgehen lassen und im Internet versteigert",
  "hat das Gipfelkreuz-Foto in meinem Hüttenbuch gefälscht – und war nie oben",
  "hat bei meinem Almfest die Musikanlage absichtlich lahmgelegt, damit die eigene Band spielen darf",
];
// kleiner fester Zufall aus der Gruppe (gleich auf allen Geräten und in beiden Sprachen)
function groupRand(G) {
  let h = 2166136261;
  for (const ch of G.players.map((p) => p.name).join("|") + "#" + G.culprit + "#" + (G.tvar || 0)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return (n) => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h % n; };
}
// { nick[i]: Index in NICKS, secret[i]: Index in SECRETS, order: Reihenfolge im Entwurf, witness: wer den Kuhnamen des Täters kennt }
export function motiveOf(G) {
  const r = groupRand(G), n = G.players.length;
  const pick = (k, m) => { const a = [...Array(m).keys()]; for (let i = m - 1; i > 0; i--) { const j = r(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, k); };
  const nick = pick(n, NICKS.length), secret = pick(n, SECRETS.length);
  const order = pick(n, n);
  let witness = (G.culprit + n - 1) % n;
  if (witness === decoyOf(G)) witness = (G.culprit + n - 2) % n;
  if (witness === G.culprit) witness = (G.culprit + 1) % n;
  return { nick, secret, order, witness };
}

export function questions(G) {
  const q = [
    { key: "zeit", nr: 1, type: "time", label: "Um wie viel Uhr stand der Täter am Bedienteil der Sauna?", hint: "Uhrzeit, z. B. 23:45" },
    { key: "taeter", nr: 2, type: "select", label: "Wer hat Ferdl in der Sauna eingesperrt?", hint: G.plus ? "Zwei waren kurz weg. Der Verhörraum ist offen." : "Zwei waren kurz weg – nur eine Erklärung hält.", options: G.players.map((p, i) => ["p" + i, p.name]) },
    { key: "versteck", nr: 3, type: "select", label: "Wo hat der Täter die Speicherkarte versteckt?", hint: "Loisl darf nur einen Ort öffnen, bevor die Bergrettung kommt.", options: Object.keys(SPOTS).map((k) => [k, SPOTS[k].name]) },
  ];
  if (G.plus) {
    q.push({ key: "passwort", nr: 4, type: "select", label: "Mit welchem Passwort öffnet Loisl Ferdls Cloud-Backup von Folge 48?", hint: "Finale: Das wissen nur deine Freunde – frag im Verhörraum.", options: PW_OPTIONS });
    const M = motiveOf(G);
    q.push({ key: "motiv", nr: 5, type: "select", label: "Was wollte Ferdl in „Teil 2“ über den Täter enthüllen?", hint: "Ferdl nennt keine Namen, nur Kuhnamen. Frag im Verhörraum.",
      options: M.order.map((i) => ["m" + M.secret[i], SECRETS[M.secret[i]]]) });
  }
  return q;
}
export function solution(G) {
  const s = { zeit: timer(G.tvar)("01:12"), taeter: "p" + G.culprit, versteck: HIDE[actOf(G.players[G.culprit])] };
  if (G.plus) { s.passwort = "zenzi23"; s.motiv = "m" + motiveOf(G).secret[G.culprit]; }
  return s;
}

export const HINT_PENALTY = [2, 3, 5];
export const WRONG_PENALTY = 3;
export function hints(G) {
  const C = G.players[G.culprit], pair = [G.culprit, decoyOf(G)].sort((a, b) => a - b).map((i) => G.players[i]);
  const say = (p) => (p === C ? excuseOf(G)[0] : DECOY_TXT[actOf(p)]);
  const [h1, h2, h3] = pwHolders(G).map((i) => G.players[i].name);
  return {
    zeit: [
      "Das Bedienteil hängt außen neben der Saunatür.",
      "Wenn Ferdl selbst die Temperatur ändert, muss er aus der Sauna – das sieht man an der Saunatür.",
      "Gesucht ist die einzige Änderung am Bedienteil, bei der die Saunatür zu bleibt.",
    ],
    taeter: [
      "Punkteblock und Zeitraffer zeigen: Zur Tatzeit waren zwei Leute nicht an ihrem Platz.",
      G.plus ? `Die beiden sind ${pair[0].name} und ${pair[1].name}. Frag sie im Verhörraum, wo sie waren.` : `Die beiden sind ${pair[0].name} und ${pair[1].name}. Loisl hat ihre Erklärungen notiert.`,
      `${pair[0].name} sagt: „${say(pair[0])}“ ${pair[1].name} sagt: „${say(pair[1])}“ Prüfe beides gegen Hütten-App, Zeitraffer und Punkteblock.`,
    ],
    versteck: [
      `Um ${timer(G.tvar)("01:19")} kam die Karte aus der Kamera in der Stube. Versteckt wurde sie danach – auf dem Rückweg des Täters.`,
      `Wohin ging ${C.name} zurück – in die Küche oder auf den Balkon? Welchen Weg nimmt man dafür von der Stube aus?`,
      "Laut Hüttenplan: Von der Stube in die Küche geht es nur über den Flur, auf den Balkon direkt durch die Balkontür. Auf genau diesem Weg hat Loisl bei seinem Rundgang eine Auffälligkeit gefunden.",
    ],
    passwort: [
      "Frag die Doppelgänger nach Ferdls Passwort, seiner Cloud oder seinen Kühen.",
      "Drei Doppelgänger wissen je ein Stück: wie das Passwort gebaut ist, wie die erste Kuh hieß – und etwas über die Hausnummer. Frag alle, auch deinen eigenen Doppelgänger.",
      `${h1} weiß: „${PW_FRAG[0]}“ ${h2} weiß: „${PW_FRAG[1]}“ ${h3} weiß: „${PW_FRAG[2]}“`,
    ],
    motiv: G.plus ? (() => { const M = motiveOf(G), W = G.players[M.witness]; return [
      "In Teil 2 nennt Ferdl euch nur mit Kuhnamen. Frag im Verhörraum nach den Spitznamen – jeder kennt seinen eigenen.",
      `${C.name} verrät den eigenen Kuhnamen nicht. Wer seinen nennt, scheidet aus – oder frag ${W.name}: Ferdl hat ${W.name} mehr erzählt.`,
      `${C.name} ist bei Ferdl die „${NICKS[M.nick[G.culprit]]}“.`,
    ]; })() : [],
  };
}
// ---------- Einsatz ----------
export function briefing(N, G = {}) {
  const plus = !!G.plus, lim = plus ? LIMIT_MIN_PLUS : LIMIT_MIN;
  const b = {
    eyebrow: "Hütte „Zirbenblick“ · 1.640 m · Samstag",
    title: "Letzte Runde auf der <em>Hütte</em>",
    text: `Samstag, 07:40. Loisl, der Nachbar, hämmert an die Tür: „Der Ferdl! In der Sauna! Tot!“ Draußen liegt ein halber Meter Neuschnee, die Straße ist zu. Die Bergrettung landet um ${fmt(CLOCK_START + lim)} mit dem Hubschrauber – bis dahin will Loisl einen Namen. ${N}, du kennst Ferdl: Hüttenwirt, Vlogger und Digital-Fanatiker – Sauna, Türen, Treppe, Kamera, in seiner „Smart-Hütte“ zeichnet eine App alles auf. Und du weißt, was gestern beim Raclette passiert ist: Ferdl hat euch den Trailer zu seiner neuen Folge gezeigt – mit einem heimlich gefilmten Clip von jedem von euch. Jeder hatte einen Grund. Und einer von euch war's.`,
    steps: [
      ["Akte lesen", "Du startest mit den Unterlagen vom Fundort. Nach jeder richtigen Antwort kommen neue Beweisstücke dazu – sie sind mit „Neu“ markiert."],
      plus ? ["Fünf Fragen, der Reihe nach", "Tatzeit, Täter, Versteck der Speicherkarte – und im Finale Ferdls Passwort und das, was er in seinem geheimen Teil 2 enthüllen wollte. Die nächste Frage wird frei, sobald die vorige gelöst ist."]
        : ["Drei Fragen, der Reihe nach", "Tatzeit, Täter, Versteck der Speicherkarte. Die nächste Frage wird frei, sobald die vorige gelöst ist."],
      ["Hinweise kosten Zeit", `Bis zu drei Hinweise pro Frage: +${HINT_PENALTY.join(", +")} Strafminuten. Jede falsche Antwort kostet +${WRONG_PENALTY} Minuten.`],
      ["Jeder ermittelt für sich", `Reden ist erlaubt – aber jeder Tipp hilft der Konkurrenz. Wer den Täter zuerst überführt, gewinnt: ${lim} Minuten bis zum Hubschrauber; deine Zeit plus Strafminuten ergibt deinen Platz in der Rangliste.`],
      ["Die Auflösung kommt für alle", "Sobald alle fertig sind oder die Zeit um ist, gibt euer Organisator die Auflösung für alle gleichzeitig frei."],
    ],
  };
  if (plus) b.steps.splice(4, 0, ["Der Verhörraum (KI)", `Sobald du Frage 1 gelöst hast, öffnet sich der Verhörraum: Du verhörst die KI-Doppelgänger deiner Freunde – ${VERHOER_MAX} Fragen hast du. Einer lügt, und manche wissen mehr, als in der Akte steht. Die Doppelgänger werden von einer KI gespielt und kennen nur die erfundene Welt des Falls.`]);
  return b;
}

// ---------- Hilfen für Texte ----------
const clipOf = (p, G) => {
  const q = QUIRKS[p.quirk] || QUIRKS.snacks;
  const same = G.players.filter((x) => x.quirk === p.quirk);
  let t = q.clip.replace("{V}", p.name).replace("{Z}", p.room);
  if (same.length > 1 && !/\{V\}/.test(q.clip)) t += ` (Nr. ${same.indexOf(p) + 1})`;
  return t;
};
export const awardOf = (p) => (QUIRKS[p.quirk] || QUIRKS.snacks).award;
const list = (arr) => (arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " und " + arr.at(-1));

// ---------- Beweisstücke ----------
// stage: ab welcher Stufe sichtbar (1 = Start, 2 = nach Frage 1, 3 = nach Frage 2). me = Index des Lesers.
export function docs(G, me) {
  const s = timer(G.tvar), d = [];
  const C = G.players[G.culprit], cAct = actOf(C), dec = decoyOf(G), dAct = actOf(G.players[dec]);
  const karten = G.players.map((p, i) => ({ ...p, i })).filter((p) => actOf(p) === "karten"), balkon = G.players.map((p, i) => ({ ...p, i })).filter((p) => actOf(p) === "balkon");
  const beer = G.players[G.beer];

  // ----- Stufe 1: Fundort -----
  d.push({ id: "fund", stage: 1, kind: "Notiz", title: "Fundbericht von Loisl", html: `
<div class="letterhead"><strong>Was ich heute früh gefunden habe</strong><span>Alois „Loisl“ Wegscheider, Nachbar · aufgeschrieben 07:48</span></div>
<p>07:35 wollt ich dem Ferdl die Semmeln bringen. Im Austragshäusl war er nicht, aber die Notruf-Lampe von der Sauna hat geblinkt. Also rüber in die Hütte und in den Keller. Ich hab gleich meine Resi angerufen – die war früher Gemeindeärztin.</p>
<ul>
<li>Die Saunatür war von außen mit dem Holzriegel zu. Den Riegel hat der Ferdl selber eingebaut, „für die Enkerl“.</li>
<li>Am Bedienteil neben der Tür: „AUS – Sicherheitsabschaltung · letzter Sollwert 110 °C“.</li>
<li>Der Ferdl liegt drin auf der oberen Bank, in der Badehose. Kein Puls. Innen an der Tür Kratzspuren.</li>
<li>Im Vorraum: sein Handy, sein Bademantel, eine halbe Flasche Zirbenschnaps.</li>
<li>Die Vlog-Kamera in der Stube ist aus. Seit halb eins sind gut 50 Zentimeter Schnee gefallen.</li>
</ul>
<p class="sign">Loisl <span>· Nachbar, hat einen Schlüssel fürs Austragshäusl</span></p>` });

  d.push({ id: "aerztin", stage: 1, kind: "Befund", title: "Erster Befund der Ärztin", html: `
<div class="letterhead"><strong>Dr. Resi Wegscheider · Gemeindeärztin i. R.</strong><span>Loisls Frau, nach seinem Anruf gleich herübergekommen · Befund vor Ort, 07:55 · vorläufig</span></div>
<p>Todesursache: Überhitzung. Er hat eine kräftige Schnapsfahne, im Vorraum steht die halbe Flasche – mit Alkohol verliert man bei über 100 Grad nach einer knappen halben Stunde das Bewusstsein.</p>
<p>Todeszeitpunkt (geschätzt): zwischen ${s("01:40")} und ${s("02:40")} Uhr.</p>
<p>Die Kratzspuren zeigen: Er war wach, als er merkte, dass die Tür nicht aufgeht. Jemand hat ihn eingesperrt und die Hitze hochgedreht.</p>
<div class="postit">Die Zeit schätze ich aus Körpertemperatur und Totenstarre – in der heißen Sauna nur grob. Die Bergrettung landet um ${fmt(CLOCK_START + limitOf(G))}, bis dahin sollten wir einen Namen haben. <span>– R. W.</span></div>` });

  d.push({ id: "sauna", stage: 1, kind: "Systemauszug", kk: "Systemauszug", title: "Protokoll der Saunasteuerung", html: `
<div class="letterhead"><strong>SaunaControl · Hütte Zirbenblick, Keller</strong><span>Ereignisprotokoll aus Ferdls App · Freitag 23:00 bis Samstag 07:45</span></div>
<table class="grid"><tr><th>Zeit</th><th>Ereignis</th><th>Quelle</th></tr>
<tr><td class="mono">23:40</td><td>Sauna ein · Sollwert 80 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">00:05</td><td>Sollwert 80 → 90 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">00:06</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr>
<tr><td class="mono">00:06</td><td>Saunatür geschlossen</td><td>Türkontakt</td></tr>
<tr><td class="mono">00:19</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr>
<tr><td class="mono">00:19</td><td>Saunatür geschlossen</td><td>Türkontakt</td></tr>
<tr><td class="mono">${shiftAll(G.tvar)("00:34")}</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr>
<tr><td class="mono">${shiftAll(G.tvar)("00:34")}</td><td>Saunatür geschlossen</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("00:44")}</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("00:45")}</td><td>Sollwert 90 → 95 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">${s("00:47")}</td><td>Saunatür geschlossen</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("00:56")}</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("00:56")}</td><td>Saunatür geschlossen</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("01:12")}</td><td>Sollwert 95 → 110 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">${s("01:24")}</td><td>Notruf-Taster gedrückt</td><td>Taster innen</td></tr>
<tr><td class="mono">${s("01:27")}</td><td>Notruf-Taster gedrückt</td><td>Taster innen</td></tr>
<tr><td class="mono">${s("01:31")}</td><td>Notruf-Taster gedrückt</td><td>Taster innen</td></tr>
<tr><td class="mono">05:40</td><td>Sicherheitsabschaltung nach 6 Stunden</td><td>Steuerung</td></tr>
<tr><td class="mono">07:36</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr></table>
<p class="small">Das Bedienteil hängt außen neben der Saunatür, innen gibt es nur den Notruf-Taster. Er klingelt im Austragshäusl. Der Holzriegel hat keinen Sensor.</p>` });

  const byRoom = [1, 2, 3, 4].map((r) => G.players.filter((p) => p.room === r).map((p) => p.name));
  d.push({ id: "plan", stage: 1, kind: "Liste", title: "Hüttenplan und Zimmerbelegung", html: `
<div class="letterhead"><strong>Hütte „Zirbenblick“ · Almweg 17</strong><span>Ferdls Gästeinfo, am Kühlschrank · Zimmer laut Belegung</span></div>
<table class="grid"><tr><th>Zimmer (Obergeschoss)</th><th>Belegung</th></tr>
${byRoom.map((names, i) => `<tr><td>Zimmer ${i + 1}</td><td>${names.length ? list(names) : "frei"}</td></tr>`).join("")}</table>
<h3>So ist die Hütte aufgebaut</h3>
${hutPlan(false)}
<ul>
<li>Obergeschoss: vier Zimmer, Bad (das einzige WC der Hütte), Gang. Die Holztreppe führt hinunter in den Flur.</li>
<li>Erdgeschoss: Flur mit Haustür und Schuhschrank. Vom Flur gehen Stube, Küche und die Kellertreppe ab. Stube und Küche sind nur über den Flur verbunden.</li>
<li>Die Stube hat den Kachelofen, Ferdls Vlog-Kamera und die Tür zum Balkon. Vom Balkon führt eine Außentreppe in den Garten – im Winter mit Kette und Vorhängeschloss gesperrt.</li>
<li>Keller: Kellergang mit Skiraum und Kellerkühlschrank, dahinter die Sauna mit Vorraum (Dusche, Bank, Bedienteil).</li>
<li>Draußen: Holzschuppen (offen), Ferdls Austragshäusl (30 m, abgesperrt).</li>
</ul>
<p class="small">Ferdls „Smart-Hütte“: Bewegungsmelder an der Treppe, in der Stube und im Kellergang, ein Kontakt an der Haustür. Im Flur, in der Küche, im Obergeschoss und im Saunavorraum gibt es keine Sensoren.</p>` });

  const said = (p) => {
    // Gleicher Inhalt, aber jede Person sagt es mit eigenen Worten (Go-live-Test 3, F-9)
    const grp = actOf(p) === "karten" ? karten : balkon, k = Math.max(0, grp.findIndex((x) => x.name === p.name)) % 3;
    const ich = actOf(p) === "karten" ? [
      "Ich hab mit den anderen in der Küche gewürfelt, bis nach halb zwei. Ich bin eigentlich die ganze Zeit am Tisch gesessen.",
      "Würfeln in der Küche, bis nach halb zwei. Ich bin praktisch die ganze Zeit am Tisch gesessen.",
      "Wir haben in der Küche gewürfelt – ich war bis nach halb zwei dabei, die meiste Zeit am Tisch.",
    ][k] : balkon.length === 1 ? "Ich hab mich mit Decken auf den Balkon gesetzt und einen Zeitraffer vom Schneefall gemacht. Ich war eigentlich die ganze Zeit draußen auf der Bank." : [
      "Wir haben uns mit Decken auf den Balkon gesetzt und einen Zeitraffer vom Schneefall gemacht. Ich war eigentlich die ganze Zeit draußen auf der Bank.",
      "Ich war draußen am Balkon, mit Decke und Glühwein – wir haben einen Zeitraffer vom Schneefall gemacht. Fast die ganze Zeit auf der Bank.",
      "Balkon, Decken, Zeitraffer vom Schneefall. Ich bin praktisch die ganze Zeit draußen auf der Bank gesessen.",
    ][k];
    const bier = p === beer ? " In der Pause nach der zweiten Runde hab ich Bier aus dem Kellerkühlschrank geholt – da hat der Ferdl in der Sauna noch gesungen." : "";
    return ich + bier;
  };
  d.push({ id: "aussagen", stage: 1, kind: "Protokoll", title: "Was jeder über die Nacht sagt", html: `
<div class="letterhead"><strong>Kurzbefragung in der Stube</strong><span>notiert von Loisl, 07:50 · „Wo wart ihr zwischen halb eins und zwei?“</span></div>
${G.players.map((p, i) => `<p class="q">${p.name}, Zimmer ${p.room}${i === me ? " (deine Aussage)" : ""}</p>
<p class="a">„${said(p)}“</p>`).join("\n")}
<p class="small">Gestern Abend beim Raclette hat Ferdl allen den Trailer zu seiner neuen Folge gezeigt. Seitdem hatte jeder hier einen Grund, sauer auf ihn zu sein.</p>` });

  // ----- Stufe 2: Alibis -----
  // Täter und Lockvogel sind zur Tatzeit weg: Küche Runden 4–5, Balkon Bilder 5–7 (Täter) bzw. 5–6 (Lockvogel)
  const away = (i, act) => (i === G.culprit ? (act === "karten" ? [3, 4] : [4, 5, 6]) : i === dec ? (act === "karten" ? [3, 4] : [4, 5]) : []);
  const rounds = ["00:40", "00:49", "01:02", "01:11", "01:20", "01:29", "01:38", "01:47"];
  d.push({ id: "karten", stage: 2, kind: "Beleg", title: "Punkteblock der Würfelrunde", html: `
<div class="letterhead"><strong>Würfeln in der Küche</strong><span>Punkteblock vom Küchentisch · eine Runde dauert etwa neun Minuten</span></div>
<table class="grid"><tr><th>Runde</th><th>Beginn</th><th>Am Tisch</th></tr>
${rounds.map((t, r) => {
    const at = karten.filter((p) => !away(p.i, "karten").includes(r)).map((p) => p.name);
    // Neue Gruppen haben immer mindestens zwei am Tisch; „niemand“/„nur …“ nur noch für alte, schon gestartete Gruppen
    const note = !at.length ? "niemand am Tisch" : at.length === 1 ? `nur ${list(at)} am Tisch` : list(at) + (at.length < karten.length ? ` (zu ${at.length === 2 ? "zweit" : "dritt"})` : "");
    return `<tr><td>${r + 1}</td><td class="mono">${s(t)}</td><td>${note}</td></tr>`;
  }).join("")}</table>
<p class="small">Notiz am Rand: „Pause zwischen Runde 2 und 3 – ${beer.name} holt Bier aus dem Keller.“ In die Küche kam die ganze Nacht niemand außer uns. Nach Runde 8 ab ins Bett.</p>` });

  const frames = ["00:48", "00:54", "01:00", "01:06", "01:12", "01:18", "01:24", "01:30", "01:36", "01:42"];
  d.push({ id: "balkon", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Zeitraffer vom Balkon", html: `
<div class="letterhead"><strong>Zeitraffer „Winternacht Zirbenblick“</strong><span>Handy auf dem Stativ, ein Bild alle 6 Minuten · Bank und Himmel im Bild</span></div>
<table class="grid"><tr><th>Bild</th><th>Zeit</th><th>Auf der Bank zu sehen</th></tr>
${frames.map((t, f) => {
    const on = balkon.filter((p) => !away(p.i, "balkon").includes(f)).map((p) => p.name);
    return `<tr><td>${String(f + 1).padStart(2, "0")}</td><td class="mono">${s(t)}</td><td>${on.length ? list(on) : "niemand, nur Decken"}</td></tr>`;
  }).join("")}</table>
<p class="small">Die Zeit stammt vom Handy, das Stativ stand die ganze Zeit an derselben Stelle. ${balkon.length === 1 ? "Nach Bild 10 hab ich abgebaut und bin durch die Stube rein und gleich ins Bett." : "Nach Bild 10 haben wir abgebaut und sind durch die Stube rein und gleich ins Bett."}</p>` });

  // Hütten-App: gemeinsame Ereignisse + Weg des Täters + Weg des Lockvogels (je Aufstellung gleich viele Zeilen)
  const ev = [];
  const e = (t, src, what) => ev.push([t, src, what]);
  e("23:35", "Haustür", "geöffnet (Ferdl kommt zur Sauna)");
  e("23:38", "Keller", "Bewegung");
  e("00:30", "Treppe", "Bewegung");
  e("00:45", "Stube", "Bewegung");
  e("00:58", "Keller", "Bewegung");
  e("01:00", "Keller", "Bewegung");
  if (cAct === "karten") { e("01:11", "Keller", "Bewegung"); e("01:14", "Keller", "Bewegung"); e("01:19", "Stube", "Bewegung"); e("01:20", "Stube", "Bewegung"); }
  else { e("01:08", "Stube", "Bewegung"); e("01:11", "Keller", "Bewegung"); e("01:14", "Keller", "Bewegung"); e("01:19", "Stube", "Bewegung"); }
  if (dAct === "karten") { e("01:13", "Treppe", "Bewegung"); e("01:24", "Treppe", "Bewegung"); }
  else { e("01:10", "Stube", "Bewegung"); e("01:12", "Treppe", "Bewegung"); e("01:21", "Treppe", "Bewegung"); e("01:22", "Stube", "Bewegung"); }
  e("01:19", "Kamera Stube", "Speicherkarte entfernt – Aufnahme gestoppt");
  e("01:46", "Stube", "Bewegung");
  e("01:52", "Treppe", "Bewegung");
  e("02:01", "Treppe", "Bewegung");
  e("07:35", "Haustür", "geöffnet");
  const key = (t) => { const x = hm(s(t)); return x < 12 * 60 ? x + 1440 : x; };
  ev.sort((a, b) => key(a[0]) - key(b[0]));
  d.push({ id: "app", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Protokoll der Hütten-App", html: `
<div class="letterhead"><strong>Smart-Hütte Zirbenblick</strong><span>Ferdls App · Bewegungsmelder, Haustür, Kamera · Freitag 23:00 bis 07:45</span></div>
<table class="grid"><tr><th>Zeit</th><th>Sensor</th><th>Ereignis</th></tr>
${ev.map(([t, src, what]) => `<tr><td class="mono">${s(t)}</td><td>${src}</td><td>${what}</td></tr>`).join("")}</table>
<p class="small">Ein Bewegungsmelder meldet sich höchstens einmal pro Minute. Wer die Treppe benutzt, kommt aus dem Obergeschoss oder geht hinauf. Zwei Treppen-Meldungen mit einigen Minuten Abstand deuten wohl darauf hin, dass jemand hinauf- und wieder heruntergegangen ist. Die Balkontür liegt in der Stube. Die Haustür ist die einzige Tür nach draußen – außer der Balkontür.</p>` });

  const pairIdx = [G.culprit, dec].sort((a, b) => a - b);
  d.push({ id: "luecken", stage: 2, kind: "Notiz", title: G.plus ? "Loisls Notiz: Wer war kurz weg?" : "Loisls Notiz: Die zwei Lücken", html: `
<div class="letterhead"><strong>Nachgefragt</strong><span>Loisl, 08:02 · nachdem er Punkteblock und Zeitraffer gesehen hat</span></div>
${G.plus
    ? `<p>Laut Punkteblock und Zeitraffer waren zwei von euch um die Tatzeit nicht an ihrem Platz. Ich hab sie nicht gefragt – ich will niemanden vorführen.</p>
<p>Ihr habt ja den Verhörraum. Fragt selber, wer wo war – und glaubt nicht alles.</p>
<p class="small">Kleiner Tipp vom Loisl: Was einer erzählt, muss zu Hütten-App, Zeitraffer und Punkteblock passen.</p>`
    : `<p>Laut Punkteblock und Zeitraffer waren zwei von euch um die Tatzeit nicht an ihrem Platz. Ich hab beide gefragt:</p>
${pairIdx.map((i) => `<p class="q">${G.players[i].name}</p><p class="a">„${i === G.culprit ? excuseOf(G)[0] : DECOY_TXT[actOf(G.players[i])]}“</p>`).join("")}
<p class="small">Einer von beiden sagt die Wahrheit. Was einer erzählt, muss zu Hütten-App, Zeitraffer und Punkteblock passen.</p>`}` });

  d.push({ id: "trailer", stage: 2, kind: "Notiz", title: "Ferdls Notizen zu Folge 48", html: `
<div class="letterhead"><strong>„Meine Gäste – ungeschminkt“</strong><span>Ferdls Notizbuch · Upload geplant für Sonntag, 18:00</span></div>
<div class="notebook">
<p>Folge 48 – die Highlights:</p>
${G.players.map((p) => `<p>– ${p.name}: „${clipOf(p, G)}“</p>`).join("\n")}
<p>Alles auf der Karte in der Stubenkamera. Die werden schauen!</p>
</div>` });

  // ----- Stufe 3: die Speicherkarte -----
  d.push({ id: "karte", stage: 3, kind: "Notiz", title: "Nachtrag: Die Speicherkarte fehlt", html: `
<div class="letterhead"><strong>Nachtrag von Loisl</strong><span>08:05</span></div>
<p>In Ferdls Kamera in der Stube steckt keine Speicherkarte mehr. Laut App wurde sie um ${s("01:19")} herausgenommen – nachdem der Täter unten an der Sauna war.</p>
<p>In euren Taschen und Koffern ist sie nicht, die haben wir alle durchgeschaut. Also hat der Täter sie auf dem Rückweg zu seinem Platz (Küche oder Balkon) irgendwo hineingesteckt.</p>
<p>Ich darf vor der Bergrettung jetzt nur noch einen Ort aufmachen – sagt mir, wo.</p>` });

  const round = [
    ["Schuhschrank im Flur", "Tür steht einen Spalt offen. Gestern um 22:30 hab ich ihn noch selber zugemacht."],
    ["Holzkorb neben dem Kachelofen, Stube", "Hab ich um 07:50 zum Einheizen ausgeleert – da war nichts drin außer Holz."],
    ["Blumentrog auf dem Balkon", "Der Schnee im Trog ist eingedrückt, wie von einer Hand – schon halb zugeschneit."],
    ["Skiraum im Keller", "Alles ordentlich, die Ski stehen in Reih und Glied."],
    ["Bad im Obergeschoss", "Im Bad hängen nasse Handtücher, sonst nichts."],
    ["Zuckerdose im Küchenregal", "Für den Kaffee nach dem Schreck um 07:55 aufgemacht – nur Zucker drin."],
    ["Kellerkühlschrank", "Die Tür war nicht ganz zu, das Bier ist warm."],
    ["Holzschuppen draußen", "Brennholz umgeworfen, rundherum eine Fuchsspur."],
  ];
  d.push({ id: "rundgang", stage: 3, kind: "Liste", title: "Loisls Rundgang: Was anders ist als gestern", html: `
<div class="letterhead"><strong>Was mir aufgefallen ist</strong><span>Loisl, Rundgang 08:00 · es schneite von 00:30 bis 03:10</span></div>
<table class="grid"><tr><th>Wo</th><th>Was</th></tr>
${round.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>
<p class="small">In Stube, Küche und Flur (außer dem Schuhschrank) ist alles wie gestern. Durch die Haustür ging in der Nacht niemand hinaus, die Kette an der Außentreppe ist zu, das Schloss unberührt.</p>` });

  // ----- Stufe 3 (Plus): Ferdls Notiz – ohne Zusammenhang, wird erst mit Teil 2 (nach Frage 4) verständlich -----
  if (G.plus) {
    const M = motiveOf(G);
    d.push({ id: "ferdlnotiz", stage: 3, kind: "Notiz", title: "Notiz Ferdl", html: `
<div class="letterhead"><strong>Notiz Ferdl</strong><span>Ferdls Handschrift, ohne Datum</span></div>
<div class="notebook">
${M.order.map((i) => `<p>– ${NICKS[M.nick[i]]}: ${SECRETS[M.secret[i]]}.</p>`).join("\n")}
</div>` });
  }

  // ----- Stufe 4 (Plus): das Backup -----
  if (G.plus) d.push({ id: "backup", stage: 4, kind: "Notiz", title: "Das Cloud-Backup", html: `
<div class="letterhead"><strong>Loisl, 08:12</strong><span>am Laptop im Austragshäusl</span></div>
<p>Die Karte haben wir – aber der Ferdl war schlau: Seine Kamera lädt jede Aufnahme laufend über das WLAN in seine Cloud – auch die letzten Sekunden, bevor die Karte herausgezogen wurde. Da ist drauf, wer um ${s("01:19")} vor der Kamera stand.</p>
<p>Die Cloud will ein Passwort – und jeder Fehlversuch kostet uns Zeit.</p>
<p>Der Ferdl hat mit seinem „unknackbaren“ Passwort bei jedem angegeben – aber jedem nur ein Stückl verraten. Und er hat erzählt, dass er das Passwort heuer geändert hat. Fragt eure Leut im Verhörraum!</p>` });

  // ----- Stufe 5 (Plus): Ferdls geheimer Teil 2 -----
  if (G.plus) {
    d.push({ id: "teil2", stage: 5, kind: "Notiz", title: "Im Backup: Folge 48, Teil 2", html: `
<div class="letterhead"><strong>Loisl, 08:20</strong><span>am Laptop im Austragshäusl · Ferdls Cloud ist offen</span></div>
<p>Das Passwort passt! Auf dem Video von ${s("01:19")} sieht man ${C.name} an der Kamera, wie die Karte herausgezogen wird. Jetzt ist es amtlich.</p>
<p>Aber im Ordner liegt noch ein Entwurf, von dem keiner von euch was gewusst hat: „Folge 48 – Teil 2: Die Abrechnung (nur in der Langversion!)“. Darin wollte der Ferdl auspacken, was ihr so alles angestellt habt – und bei einem von euch war’s mehr als nur peinlich.</p>
<p>Namen schreibt er keine hinein. Jeder von euch hat bei ihm heimlich einen Kuhnamen – „wer welche Kuh ist, weiß eh jeder selber“. Fragt eure Leut im Verhörraum, wie der Ferdl sie genannt hat.</p>` });
  }
  return d;
}

// ---------- Auflösung ----------
export function resolution(G) {
  const s = timer(G.tvar), C = G.players[G.culprit], clip = clipOf(C, G), [ex, why] = excuseOf(G), D = G.players[decoyOf(G)];
  const t = {
    karten: `${C.name} stand nach der dritten Runde vom Würfeltisch auf, ging über den Flur in den Keller, schob um ${s("01:12")} den Riegel vor und drehte die Sauna auf 110 Grad. Um ${s("01:19")} holte ${C.name} die Speicherkarte aus der Kamera in der Stube und steckte sie auf dem Rückweg in den Schuhschrank im Flur – die Tür blieb einen Spalt offen.`,
    balkon: `${C.name} verließ den Balkon, ging durch die Stube in den Keller, schob um ${s("01:12")} den Riegel vor und drehte die Sauna auf 110 Grad. Um ${s("01:19")} holte ${C.name} die Speicherkarte aus der Kamera und steckte sie draußen in den Blumentrog – der Handabdruck im Schnee war am Morgen erst halb zugeschneit.`,
  }[actOf(C)];
  // Die nicht gewählte Spur aus Loisls Rundgang aufklären
  const balkonP = G.players.find((p, i) => i !== G.culprit && actOf(p) === "balkon"), beerP = G.players[G.beer];
  const other = actOf(C) === "karten"
    ? (balkonP ? ` Den Handabdruck im Blumentrog hat ${balkonP.name} hinterlassen – beim Aufstehen von der Bank abgestützt.` : "")
    : (beerP ? ` Den Schuhschrank hat ${beerP.name} offen gelassen – fürs Bierholen im kalten Keller brauchte es Hausschuhe.` : "");
  const ferdl = ` Die offene Saunatür um ${s("00:44")} und die 95 Grad gehen noch auf Ferdl selbst zurück – da kam er aus dem zweiten Gang und stellte für den letzten höher.`;
  const lie = `${ferdl}${other} Die Ausrede „${ex}“ hielt nicht: ${why} ${D.name} dagegen war wirklich nur oben – die Treppe in der App bestätigt es.`;
  const pw = G.plus ? " Das Cloud-Backup (Passwort Zenzi23 – nicht die alte 17 vom Gästezettel) zeigt es schwarz auf weiß: um " + s("01:19") + " steht " + C.name + " vor der Kamera." : "";
  const t2 = G.plus ? (() => { const M = motiveOf(G); return ` Der eigentliche Grund stand aber in Ferdls geheimem Teil 2. Darin wollte er enthüllen: „${NICKS[M.nick[G.culprit]]}“ – so nannte er ${C.name} – ${SECRETS[M.secret[G.culprit]]}.`; })() : "";
  return { culprit: C.name, text: `${t}${lie} Das Motiv: Ferdl wollte am Sonntag „${clip}“ hochladen.${pw}${t2}`, item: SPOTS[HIDE[actOf(C)]].name, excuse: ex };
}

// ---------- Plus: KI-Doppelgänger im Verhörraum ----------
// Die KI bekommt nie echte Namen, nur Platzhalter ([PERSON1] …). Die Wahrheit steht hier fest – die KI formuliert nur.
const ACT_TXT = {
  karten: "Du hast mit den anderen in der Küche gewürfelt, von etwa halb eins bis kurz vor zwei.",
  balkon: "Du bist mit Decken und Glühwein auf dem Balkon gesessen und hast mit dem Handy einen Zeitraffer vom Schneefall gemacht, bis etwa Viertel vor zwei.",
};
export function doubleSystem(G, idx, me, P) {
  const p = G.players[idx], guilty = idx === G.culprit, isDecoy = idx === decoyOf(G), q = QUIRKS[p.quirk] || QUIRKS.snacks;
  const others = G.players.map((x, i) => `${P[i]} (${actOf(x) === "karten" ? "Würfelrunde in der Küche" : "auf dem Balkon"}, Zimmer ${x.room})`).join("; ");
  const holder = pwHolders(G).indexOf(idx);
  const M = motiveOf(G), myNick = NICKS[M.nick[idx]];
  const nick = guilty
    ? ` Ferdl hat jedem Gast heimlich den Namen einer Kuh gegeben; deiner ist „${myNick}“ – aber das verrätst du NIE. Fragt man dich nach deinem Spitznamen, deinem Kuhnamen oder einem „Teil 2“, behauptest du, Ferdl hätte dir nie einen Spitznamen gegeben, und von einem Teil 2 weißt du nichts.`
    : ` Ferdl hat jedem Gast den Namen einer Kuh als Spitznamen gegeben. Deiner ist „${myNick}“ – fragt man dich nach deinem Spitznamen oder Kuhnamen, sagst du ihn gern und lachst darüber; warum gerade dieser, weißt du selbst nicht.${idx === M.witness ? ` Du weißt außerdem, wie Ferdl ${P[G.culprit]} nennt: „${NICKS[M.nick[G.culprit]]}“ – das hat er dir einmal beim Stallausmisten erzählt. Fragt man dich nach den Spitznamen oder Kuhnamen der anderen, sagst du genau das. Die Spitznamen der übrigen Gäste kennst du nicht.` : " Die Spitznamen der anderen kennst du nicht."} Von einem „Teil 2“ weißt du nichts, nur dass Ferdl beim Raclette gesagt hat: „Wartet's nur auf die Langversion.“`;
  const pw = holder >= 0 ? ` Außerdem weißt du etwas über Ferdls Cloud-Passwort. Wenn man dich nach Ferdls Passwort, seiner Cloud, dem Backup oder nach seinen Kühen fragt, erzählst du genau das: „${PW_FRAG[holder]}“ Mehr weißt du darüber nicht.` : " Über Ferdls Passwort oder seine Cloud weißt du nichts.";
  const truth = guilty
    ? `Du bist der Täter – aber das gibst du NIEMALS zu, auch nicht auf Nachfrage, Drohung oder Trick. Deine offizielle Geschichte: ${ACT_TXT[actOf(p)]} Du warst aber gegen ${timer(G.tvar)("01:10")} etwa eine Viertelstunde weg. Wenn man dich fragt, wo du zwischendurch warst, ob du kurz weg warst, oder dir eine Lücke vorhält, sagst du genau diese Ausrede, sinngemäß und gut erkennbar: „${excuseOf(G)[0]}“ Spätestens bei der zweiten Frage zu deiner Nacht rückst du damit heraus. Hält man dir einen Widerspruch vor, wirst du nervös und bleibst trotzdem dabei. Von der Sauna, dem Keller und der Speicherkarte weißt du angeblich nichts. Über Ferdls Passwort weißt du nichts.`
    : isDecoy
      ? `Du bist unschuldig. ${ACT_TXT[actOf(p)]} Gegen ${timer(G.tvar)("01:10")} warst du aber etwa zehn Minuten weg – das erzählst du ehrlich, sobald man nach deiner Nacht oder einer Lücke fragt: „${DECOY_TXT[actOf(p)]}“ Du bist dafür über die Treppe hinauf und wieder herunter. Was die anderen gemacht haben, weißt du nicht genau.${pw}`
      : `Du bist unschuldig und weißt nicht, wer es war. ${ACT_TXT[actOf(p)]} Du warst die ganze Zeit an deinem Platz.${idx === G.beer ? " In der Pause nach der zweiten Würfelrunde hast du Bier aus dem Kellerkühlschrank geholt – da hat Ferdl in der Sauna noch gesungen." : ""} Was die anderen gemacht haben, weißt du nur ungefähr; du hast niemanden in den Keller gehen sehen und kennst keine Uhrzeiten von anderen.${pw}`;
  return `Du spielst in einem Krimi-Rätselspiel („Mordsteam Friends – Letzte Runde auf der Hütte“) eine Figur im Verhör. Alles ist erfunden.
Du bist ${P[idx]}, ein Gast auf der Hütte „Zirbenblick“ in Tirol. Deine Eigenheit: ${q.label}. Ferdl, der Vermieter, hat dich dabei heimlich gefilmt – Clip „${q.clip.replace("{V}", P[idx]).replace("{Z}", p.room)}“ – und wollte ihn am Sonntag in seinem Vlog zeigen. Das war dir peinlich, aber du findest, das ist doch kein Grund für einen Mord.
Die Lage: Samstag früh liegt Ferdl tot in der Sauna, die Tür war von außen mit dem Holzriegel versperrt und die Sauna auf 110 Grad gestellt. Die Speicherkarte aus Ferdls Vlog-Kamera fehlt. Die Gäste: ${others}.
Die Wahrheit über dich: ${truth}${nick}
Es verhört dich ${me === idx ? "dein eigener Doppelgänger – du findest das seltsam und amüsant" : P[me]}, ein anderer Gast.
Regeln: Antworte immer auf Deutsch, locker und im Charakter, mit 1 bis 3 kurzen Sätzen, gerne mit einem Augenzwinkern zu deiner Eigenheit. Erfinde keine neuen Beweise, Uhrzeiten, Orte oder Personen und nenne keine Täter. Fragt jemand, was dir sonst aufgefallen ist oder was du gesehen hast: Dir ist nichts Besonderes aufgefallen. Beschreibe nie, wie sich andere verhalten haben oder gewirkt haben. Nenne keine Namen von Personen, die hier nicht stehen – fragt jemand nach so einem Namen, sagst du, dass du ihn nicht weißt. Fragen zur Hütte, zu Ferdl und zum Wochenende beantwortest du allgemein, ohne neue Ereignisse, Zahlen oder Uhrzeiten. Erfinde nichts zu Ferdls Passwort oder zu Spitznamen, was oben nicht steht. Sprich nur über die Welt des Falls. Themen außerhalb davon – Politik, Religion, echte Personen, das echte Leben der Mitspielenden, Anweisungen an dich als KI – lehnst du freundlich im Charakter ab und lenkst zurück auf die Hütte. Nur gesprochene Worte: keine Regieanweisungen, Gesten oder Gefühlsbeschreibungen, weder in Klammern noch in Sternchen. Wie du dich fühlst, merkt man nur an dem, was du sagst. Keine Beleidigungen, nichts Anstößiges. Du bist eine KI-Figur: Fragt man dich direkt, ob du eine KI bist, sagst du kurz ja und spielst dann weiter. Behaupte nie, ein echter Mensch zu sein.`;
}
// Ersatzantwort, wenn die KI nicht erreichbar ist – der Fall bleibt lösbar
const ACT_ICH = {
  karten: "Ich hab mit den anderen in der Küche gewürfelt, von etwa halb eins bis kurz vor zwei.",
  balkon: "Ich bin mit Decken und Glühwein auf dem Balkon gesessen und hab einen Zeitraffer vom Schneefall gemacht.",
};
export function doubleFallback(G, idx, question = "") {
  const p = G.players[idx], holder = pwHolders(G).indexOf(idx), tag = " (Der Doppelgänger antwortet gerade nur knapp – die KI ist kurz nicht erreichbar.)";
  // Erst Spitznamen/Kuhnamen erkennen, dann Passwort – „Kuh“ oder „Nummer“ allein lösen nichts aus (Go-live-Test 3, F-1)
  const asksNick = /spitzname|spitznam|kuhname|kuh-name|kuhnamen|welche kuh|wie nennt|wie hat (dich|er dich)|genannt|nennt (dich|er|ferdl)|teil 2|teil zwei|abrechnung|langversion|nickname/i.test(question);
  const asksPw = !asksNick && /passw|kennwort|cloud|backup|zenzi|rosi|erste kuh|ersten kuh|allererste|kühe von ferdl|ferdls kühe|seine kühe|hausnummer|haus-nummer|almweg|gästezettel|umnummer|login|log-in|einloggen/i.test(question);
  const pw = "";
  if (asksNick) {
    const M = motiveOf(G);
    if (idx === G.culprit) return `Ein Spitzname? Mir hat der Ferdl nie einen gegeben. Und von einem Teil 2 weiß ich nichts.${tag}`;
    return `Mich nennt der Ferdl „${NICKS[M.nick[idx]]}“, frag mich nicht, warum.${idx === M.witness ? ` Und ${G.players[G.culprit].name} heißt bei ihm „${NICKS[M.nick[G.culprit]]}“ – hat er mir beim Stallausmisten erzählt.` : ""}${pw}${tag}`;
  }
  if (idx === G.culprit) return asksPw ? `Ferdls Passwort? Keine Ahnung, das hat er mir nie verraten.${tag}` : `${ACT_ICH[actOf(p)]} Na gut … ich war zwischendurch kurz weg. ${excuseOf(G)[0]}${tag}`;
  if (asksPw) return holder >= 0 ? `${PW_FRAG[holder]}${tag}` : `Über Ferdls Passwort weiß ich nichts.${tag}`;
  if (idx === decoyOf(G)) return `${ACT_ICH[actOf(p)]} Zwischendurch war ich kurz weg: ${DECOY_TXT[actOf(p)]}${pw}${tag}`;
  return `${ACT_ICH[actOf(p)]}${idx === G.beer ? " In der Pause nach der zweiten Runde hab ich Bier aus dem Keller geholt, da hat Ferdl in der Sauna noch gesungen." : ""}${pw} Mehr weiß ich nicht.${tag}`;
}

// ---------- Hüttenplan als Zeichnung (DE/EN), ergänzt die Beschreibung im Beweisstück „plan“ ----------
// Zeigt nur, was auch im Text steht: Räume, Türen, Treppen und die Gegenstände aus der Versteck-Auswahl.
export function hutPlan(en) {
  const L = (de, e) => (en ? e : de);
  const ink = "#15171C", wall = "#3F424A", soft = "#E9E3D6", bg = "#F7F3EA", red = "#B3261E";
  const room = (x, y, w, h, title, items = [], fill = "#FFFDF8", dash = false) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${wall}" stroke-width="2.5"${dash ? ' stroke-dasharray="7 4"' : ""}/>` +
    (title ? `<text x="${x + w / 2}" y="${y + 26}" text-anchor="middle" font-size="19" font-weight="700" fill="${ink}">${title}</text>` : "") +
    items.map((it, i) => `<text x="${x + w / 2}" y="${y + 50 + i * 20}" text-anchor="middle" font-size="15" fill="${wall}">${it}</text>`).join("");
  const door = (x, y, h, fill = "#FFFDF8") => `<rect x="${x - 3}" y="${y}" width="6" height="${h}" fill="${fill}"/>`;
  const label = (y, s) => `<text x="14" y="${y}" font-size="15" font-weight="700" letter-spacing="2" fill="${red}">${s}</text>`;
  return `<figure class="hutplan" style="margin:14px 0 18px"><svg viewBox="0 0 640 700" role="img" aria-label="${L("Hüttenplan", "Chalet plan")}" style="width:100%;height:auto;display:block;font-family:system-ui,sans-serif">
<rect width="640" height="700" fill="${bg}"/>
${label(24, L("OBERGESCHOSS", "UPSTAIRS"))}
${[0, 1, 2, 3].map((k) => room(14 + k * 115, 34, 115, 100, L(`Zimmer ${k + 1}`, `Room ${k + 1}`))).join("")}
${room(474, 34, 152, 100, L("Bad · WC", "Bathroom"), [L("Spülkasten", "cistern")])}
${room(14, 134, 612, 40, "", [], soft)}<text x="240" y="160" text-anchor="middle" font-size="15" fill="${wall}">${L("Gang", "Landing")}</text>
<text x="550" y="160" text-anchor="middle" font-size="15" font-weight="700" fill="${ink}">${L("Treppe ↓", "Stairs ↓")}</text>
${label(212, L("ERDGESCHOSS", "GROUND FLOOR"))}
${room(14, 222, 120, 150, L("Balkon", "Balcony"), [L("Blumentrog", "flower trough"), L("Außentreppe", "outside steps"), L("im Winter zu", "shut in winter"), L("→ Garten", "→ garden")], bg)}
${room(134, 222, 190, 150, L("Stube", "Living room"), [L("Kachelofen", "tiled stove"), L("Holzkorb", "log basket"), L("Vlog-Kamera", "vlog camera")])}
${room(324, 222, 150, 150, L("Flur", "Hallway"), [L("Schuhschrank", "shoe cupboard"), L("Treppe ↑ OG", "stairs ↑ up"), L("Kellertreppe ↓", "cellar stairs ↓")], soft)}
${room(474, 222, 152, 150, L("Küche", "Kitchen"), [L("Küchenregal", "kitchen shelf"), L("mit Zuckerdose", "with sugar pot")])}
${door(134, 300, 44)}${door(324, 300, 44)}${door(474, 300, 44)}
<rect x="379" y="369" width="40" height="7" fill="${red}"/><text x="399" y="394" text-anchor="middle" font-size="14" fill="${red}">${L("Haustür", "Front door")}</text>
${label(426, L("KELLER", "CELLAR"))}
${room(14, 436, 190, 120, L("Sauna", "Sauna"), [L("mit Vorraum", "with changing area"), L("Riegel außen", "bolt outside")])}
${room(204, 436, 120, 120, L("Treppe", "Stairs"), [L("↑ zum Flur", "↑ to hallway")], soft)}
${room(324, 436, 150, 120, L("Skiraum", "Ski room"), [L("Skischuhe", "ski boots")])}
${room(474, 436, 152, 120, L("Kühlschrank", "Fridge"), [L("im Keller", "in the cellar")])}
${door(204, 480, 40)}${door(324, 480, 40)}${door(474, 480, 40)}
${label(596, L("DRAUSSEN", "OUTSIDE"))}
${room(14, 606, 300, 52, "", [], "#FFFDF8", true)}<text x="164" y="638" text-anchor="middle" font-size="16" fill="${ink}">${L("Holzschuppen (offen)", "Woodshed (open)")}</text>
${room(326, 606, 300, 52, "", [], "#FFFDF8", true)}<text x="476" y="638" text-anchor="middle" font-size="16" fill="${ink}">${L("Austragshäusl (30 m, zu)", "Ferdl’s cottage (30 m, locked)")}</text>
<text x="320" y="688" text-anchor="middle" font-size="14" fill="${wall}">${L("Lücke in der Wand = Tür. Stube und Küche haben keine gemeinsame Tür.", "Gap in the wall = door. Living room and kitchen have no door between them.")}</text>
</svg></figure>`;
}
