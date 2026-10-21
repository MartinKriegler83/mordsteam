// Mordsteam Friends 002 – „Vier Minuten Finsternis“ (Weihnachts-Special im Friends-Format, 21.10.2026)
// 4–8 Spieler, jeder ermittelt am eigenen Gerät. Die Freundesrunde betreibt am Christkindlmarkt von Kerzenthal den Punschstand
// des Elternvereins (Hütte 24). Einer von ihnen ist (ausgelost) der Täter. Ohne KI, ein Paket, 50 Minuten Countdown.
// G = { players: [{ name (HTML-escaped), quirk, st, st1 }], culprit, decoy, tvar, seed }
//   st = Station während der Lichterzeremonie (Schicht 17:45–18:45), st1 = Station der ersten Schicht. Der Lockvogel (decoy) sitzt an der Kassa.
// Frage 1 (Wann?): Die Akku-Kassa protokolliert weiter, ihre Uhr geht aber vor – um wie viel, zeigt „Netzausfall“ gegen das
//   Stromprotokoll. Zwischen „Spende in die Spendenkassa gelegt“ und „Spendenkassa nicht greifbar“ liegt genau eine Minute.
// Frage 2 (Wer?): Rote Helfer-Pfandmarke in der Kühlhütte – sie gehört dem Lockvogel, der eine Marke an den Täter abgegeben hat
//   (Gruppenchat). Der Lockvogel kassierte laut Bonrolle 13 Sekunden nach dem Zusperren der Kühlhütte – die steht zwei Hütten weiter.
// Frage 3 (Wie?): Schlüsselbrett im Marktbüro – am Haken „Kühlhütte“ hängt ein Schlüssel mit fremdem Anhänger; dessen eigener Haken ist leer.
//   Der zweite leere Haken ist in der Ausgabeliste erklärt.
// Frage 4 (Wo?): Schablone aus einem Häferl-Karton, Kerbe UNTEN an die Spitze des Christbaums → die Löcher zeigen vier Hütten,
//   nur eine davon ist heute geschlossen (Brunners Generalschlüssel fehlt).
// Frage 5 (Warum?): Brunners Adventrätsel-Plakat – die gelben Stern-Lampen der Lichterkette ergeben ein Wort.
// Diese Datei baut beide Sprachen (make("de") / make("en")); friends-002-en.js exportiert die englische Fassung.
import { schabloneF, templateF, marketPlanF, pfandmarke, brett, plakat, shapeIcon, SHAPES, SHAPE_NAME, GRID, hutAt, COLS, ROWS, TREE_COL, TW, TH } from "../art/friends002.js";
import { QUIRKS as QUIRKS_DE, QUIRK_KEYS } from "./friends-001.js";
import { QUIRKS as QUIRKS_EN } from "./friends-001-en.js";

export const ID = "friends-002";
export const LIMIT_MIN = 50;
export const limitOf = () => LIMIT_MIN;
export const MIN_PLAYERS = 4, MAX_PLAYERS = 8;
export const VERHOER_MAX = 0, VERHOER_FROM_STAGE = 99;   // kein Verhörraum (ohne KI)
export const HINT_PENALTY = [2, 3, 5];
export const WRONG_PENALTY = 3;
export { QUIRK_KEYS };
export const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const pad2 = (n) => String(n).padStart(2, "0");
export const fmt = (x) => `${pad2(Math.floor(x / 60) % 24)}:${pad2(x % 60)}`;
const sec = (m, s) => `${fmt(m)}:${pad2(s)}`;
export const CLOCK_START = hm("19:20");     // Uhr beim Start: 19:20, die Kripo kommt um 20:10
export const DARK = [hm("17:59"), hm("18:01"), hm("18:03")];   // Marktbeleuchtung wirklich AUS (Programm: 18:00) – je Zeitvariante
export const STATIONS = ["kassa", "ausschank", "pfand", "spuelen", "nachschub"];
const BEHIND = ["spuelen", "nachschub"];
export const PUNSCH = 24, FLEISCHER = 12;
const SPECIAL = new Set([5, 9, 12, 13, 14, 16, 21, 24]);   // Hütten, die im Fall vorkommen – nie „geschlossen“
export const HUTS = {
  1: ["Kerzenzieherei", "Candle maker"], 2: ["Christbaumschmuck", "Tree decorations"], 3: ["Honig & Met", "Honey & mead"], 4: ["Strickwaren", "Knitwear"],
  5: ["Glühwein Strobl", "Strobl’s mulled wine"], 6: ["Holzspielzeug", "Wooden toys"], 7: ["Weihnachtskarten", "Christmas cards"], 8: ["Bratäpfel", "Baked apples"],
  9: ["Maroni Pammer", "Pammer’s chestnuts"], 10: ["Kasnocken", "Cheese dumplings"], 11: ["Seifen & Kräuter", "Soap & herbs"], 12: ["Fleischerei Gruber (mit Kühlhütte)", "Gruber’s butcher (with cold store)"],
  13: ["Krapfen", "Doughnuts"], 14: ["Kinderpunsch", "Children’s punch"], 15: ["Keramik", "Pottery"], 16: ["Lebkuchen Wagenhofer", "Wagenhofer’s gingerbread"],
  17: ["Schafwolle", "Sheep’s wool"], 18: ["Glaskunst", "Glass art"], 19: ["Zuckerwatte", "Candyfloss"], 20: ["Waffeln", "Waffles"],
  21: ["Krippenschnitzerei Eibl", "Eibl’s nativity carvings"], 22: ["Lángos", "Lángos"], 23: ["Filzpatschen", "Felt slippers"], 24: ["Punsch Elternverein", "Parents’ association punch"],
};
export const MOTIVES = [
  { de: "SCHULDEN", en: "DEBTS" }, { de: "TOMBOLA", en: "RAFFLE" }, { de: "DELLE", en: "DENT" }, { de: "KAUTION", en: "DEPOSIT" }, { de: "STROMKABEL", en: "CABLE" },
];

// ---------- Zufall: deterministisch aus der Gruppe (gleich auf allen Geräten, in jeder JS-Engine) ----------
const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Neue Gruppe: rnd(n) → 0..n-1 (Server: crypto-Zufall)
export function setup(n, rnd) {
  const culprit = rnd(n), others = [...Array(n).keys()].filter((i) => i !== culprit), decoy = others[rnd(others.length)];
  const cSt = BEHIND[rnd(2)], pool = [];
  if (n >= 5) pool.push(BEHIND.find((x) => x !== cSt));   // ab 5 Leuten sind beide hinteren Stationen besetzt
  while (pool.length < n - 2) pool.push(pool.length % 2 ? "pfand" : "ausschank");
  const fill = shuffle(pool, () => rnd(1000) / 1000);
  const stations = [...Array(n)].map((_, i) => (i === culprit ? cSt : i === decoy ? "kassa" : fill.pop()));
  const st1 = shuffle(stations, () => rnd(1000) / 1000);
  if (st1.every((x, i) => x === stations[i])) st1.push(st1.shift());
  return { culprit, decoy, tvar: rnd(DARK.length), seed: 1 + rnd(2147483000), stations, st1 };
}
// Gruppendaten für friends_groups.data (lib/friends.js nutzt groupData, wenn vorhanden)
export function groupData(list, S, plus) {
  return { players: list.map((p, i) => ({ ...p, st: S.stations[i], st1: S.st1[i] })), culprit: S.culprit, decoy: S.decoy, tvar: S.tvar, seed: S.seed, plus: false };
}

const ROUNDS = new Map();
export function roundOf(G) {
  const key = `${G.seed}/${G.culprit}/${G.decoy}/${G.tvar}/${G.players.length}`;
  if (ROUNDS.has(key)) return ROUNDS.get(key);
  const n = G.players.length, r = rng(G.seed);
  // Frage 1
  const D0 = DARK[(G.tvar || 0) % DARK.length], k = 1 + Math.floor(r() * 2), T = D0 + k, off = 2 + Math.floor(r() * 3);
  const sIn = 5 + Math.floor(r() * 14), sOut = 40 + Math.floor(r() * 14);
  // Frage 2: Helfer-Pfandmarken (je zwei, rot); gefunden wird eine des Lockvogels
  const nums = shuffle([...Array(2 * n)].map((_, i) => 101 + i), r);
  const tokens = G.players.map((_, i) => [nums[2 * i], nums[2 * i + 1]].sort((a, b) => a - b));
  const found = tokens[G.decoy][Math.floor(r() * 2)];
  const others = shuffle([...Array(n).keys()].filter((i) => i !== G.culprit && i !== G.decoy), r);
  const A = others[0], B = others[1 % others.length];
  // Frage 3: Schlüsselbrett – 8 Hütten-Haken + Lager + Kühlhütte; X = Schlüssel am Kühlhütten-Haken, Y = ausgegeben
  const hutPool = shuffle(Object.keys(HUTS).map(Number).filter((h) => !SPECIAL.has(h)), r);
  const hookHuts = hutPool.slice(0, 8).sort((a, b) => a - b);
  const X = hookHuts[Math.floor(r() * 8)], Y = shuffle(hookHuts.filter((h) => h !== X), r)[0];
  const labels = ["KÜHL", ...hookHuts.map(String), "LAGER"];
  const shapes = shuffle(SHAPES, r);
  const tagOf = Object.fromEntries(labels.map((l, i) => [l, shapes[i]]));
  // Frage 4: Schablone – Kerbe unten über Spalte p, richtige Lage x0 = Baumspalte − p, y = 1 (unterste Reihe bündig)
  const p = Math.floor(r() * 3), x0 = TREE_COL - p, y0 = ROWS - TH;
  const covered = []; for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) covered.push([i, j]);
  const hutOf = ([i, j], x, y) => hutAt(x + i, y + j);
  let best = null;
  for (let tries = 0; tries < 600 && !best; tries++) {
    const pool = covered.filter((cc) => { const h = hutOf(cc, x0, y0); return !SPECIAL.has(h) && h !== X && h !== Y; });
    const hc = pool[Math.floor(r() * pool.length)];
    const holes = [hc, ...shuffle(covered.filter((cc) => cc !== hc), r).slice(0, 3)];
    const under = new Set(holes.map((cc) => hutOf(cc, x0, y0)));
    const free = shuffle(Object.keys(HUTS).map(Number).filter((h) => !SPECIAL.has(h) && !under.has(h) && h !== X && h !== Y), r);
    const closed = [hutOf(hc, x0, y0), ...free.slice(0, 5)];
    let traps = 0;
    for (let x = 0; x <= COLS - TW; x++) for (let y = 0; y <= ROWS - TH; y++) {
      if (x === x0 && y === y0) continue;
      if (holes.map((cc) => hutOf(cc, x, y)).filter((h) => closed.includes(h)).length === 1) traps++;
    }
    if (traps >= 2) best = { holes, closed: closed.sort((a, b) => a - b), hide: hutOf(hc, x0, y0) };
  }
  // Frage 5: Motiv und Lichterkette (22 Lampen, das Wort in den Sternen)
  const m = Math.floor(r() * MOTIVES.length);
  const fillers = (word) => { const pos = shuffle([...Array(22).keys()], r).slice(0, word.length).sort((a, b) => a - b), ABC = "ABCDEFGHIKLMNOPRSTUVWZ";
    return [...Array(22)].map((_, i) => { const w = pos.indexOf(i); return w >= 0 ? { ch: word[w], star: true } : { ch: ABC[Math.floor(r() * ABC.length)], star: false }; }); };
  const bulbs = { de: fillers(MOTIVES[m].de), en: fillers(MOTIVES[m].en) };
  const R = { D0, k, T, off, sIn, sOut, tokens, found, A, B, hookHuts, X, Y, labels, tagOf, p, x0, y0, ...best, m, bulbs, found_at: D0 + 52 };
  ROUNDS.set(key, R);
  return R;
}

// ---------- Sprachabhängiges ----------
export function make(lang) {
  const en = lang === "en", L = (d, e) => (en ? e : d);
  const TITLE = L("Vier Minuten Finsternis", "Four Minutes Dark");
  const CLOCK_LABEL = L("bis zur Kripo", "until the detectives");
  const LATE_LABEL = L("Kripo wartet", "Detectives waiting");
  const PLACE = L("Markt", "Market");
  const STAGE_TITLES = {
    2: L("Neue Beweisstücke: die Kühlhütte und die Pfandmarken", "New evidence: the cold store and the deposit tokens"),
    3: L("Neue Beweisstücke: das Schlüsselbrett", "New evidence: the key board"),
    4: L("Neue Beweisstücke: ein Karton im Altpapier", "New evidence: a carton in the recycling"),
    5: L("Neue Beweisstücke: Brunners Adventrätsel", "New evidence: Brunner’s advent puzzle"),
  };
  const QUIRKS = en ? QUIRKS_EN : QUIRKS_DE;
  const ST = {
    kassa: L("Kassa", "Till"), ausschank: L("Ausschank", "Serving"), pfand: L("Pfandrückgabe", "Deposit returns"),
    spuelen: L("Häferl spülen (hinten)", "Washing mugs (at the back)"), nachschub: L("Nachschub aus dem Lager (hinten)", "Restocking from the store room (at the back)"),
  };
  const AWARD = {
    kassa: L("Die Goldene Kassa", "The Golden Till"), ausschank: L("Der Goldene Schöpfer", "The Golden Ladle"), pfand: L("Die Goldene Pfandmarke", "The Golden Token"),
    spuelen: L("Das Goldene Geschirrtuch", "The Golden Tea Towel"), nachschub: L("Der Goldene Kanister", "The Golden Canister"),
  };
  const awardOf = (p) => AWARD[p.st] || AWARD.ausschank;
  const hutName = (h) => HUTS[h][en ? 1 : 0];
  const hookName = (l) => (l === "KÜHL" ? L("Kühlhütte", "Cold store") : l === "LAGER" ? L("Lager Punsch (24)", "Punch store room (24)") : `${L("Hütte", "Hut")} ${l} · ${hutName(Number(l))}`);
  const hookPlate = (l) => (l === "KÜHL" ? L("KÜHLHÜTTE", "COLD STORE") : l === "LAGER" ? L("LAGER 24", "STORE 24") : `${L("HÜTTE", "HUT")} ${l}`);
  const SN = (k) => SHAPE_NAME[en ? "en" : "de"][k];
  const MOT = [
    L("Schulden: hat Spielschulden – und schon im Vorjahr heimlich Geld aus der Spendenkassa genommen.", "Debts: has gambling debts – and already took money from the donation box on the quiet last year."),
    L("Tombola: hat bei der Tombola im Vorjahr den Hauptpreis an sich selbst verlost.", "Raffle: rigged last year’s raffle so that they won the top prize themselves."),
    L("Delle: hat Brunners neues Auto am Marktparkplatz angefahren und ist einfach weitergefahren.", "Dent: drove into Brunner’s new car in the market car park and just drove off."),
    L("Kaution: hat die Kautionen für die Leih-Häferl vom Vorjahr eingesteckt.", "Deposit: pocketed last year’s deposits for the hired mugs."),
    L("Stromkabel: hat mit einem Kabel vom Markt heimlich den eigenen Glühweinstand im Pfarrhof betrieben.", "Cable: secretly ran their own mulled-wine stall in the vicarage yard off a cable from the market."),
  ];
  const MOT_SHORT = [
    L("Spielschulden – und schon im Vorjahr fehlte Geld in der Spendenkassa.", "gambling debts – and money was already missing from the donation box last year."),
    L("die geschobene Tombola vom Vorjahr.", "last year’s rigged raffle."),
    L("die Delle in Brunners neuem Auto – Fahrerflucht.", "the dent in Brunner’s new car – a hit and run."),
    L("die eingesteckten Häferl-Kautionen vom Vorjahr.", "the pocketed mug deposits from last year."),
    L("das heimliche Stromkabel zum eigenen Glühweinstand.", "the secret power cable to their own mulled-wine stall."),
  ];

  const questions = (G) => {
    const R = roundOf(G);
    return [
      { key: "zeit", nr: 1, type: "time", label: L("In welcher Minute verschwand die Spendenkassa?", "In which minute did the donation box disappear?"), hint: L("Uhrzeit, z. B. 18:15", "Time on the 24-hour clock, e.g. 18:15") },
      { key: "taeter", nr: 2, type: "select", label: L("Wer hat Alois Brunner in die Kühlhütte gesperrt?", "Who locked Alois Brunner in the cold store?"), hint: L("Einer von euch war's.", "One of you did it."), options: G.players.map((p, i) => ["p" + i, p.name]) },
      { key: "schluessel", nr: 3, type: "select", label: L("Welcher Schlüssel hängt jetzt am Haken „Kühlhütte“?", "Which key is now hanging on the “Cold store” hook?"), hint: L("Am Brett sieht auf den ersten Blick alles vollständig aus.", "At first glance nothing seems to be missing from the board."),
        options: R.labels.filter((l) => l !== "KÜHL").map((l) => [l, hookName(l)]) },
      { key: "versteck", nr: 4, type: "select", label: L("In welcher Hütte ist die Spendenkassa?", "Which hut is the donation box in?"), hint: L("Die Polizei lässt nur eine Hütte aufsperren.", "The police will only have one hut opened."),
        options: Object.keys(HUTS).map((h) => [String(h), `${h} · ${hutName(h)}`]) },
      { key: "motiv", nr: 5, type: "select", label: L("Was wusste Brunner – warum musste er weg?", "What did Brunner know – why did he have to go?"), hint: L("Brunner schreibt so etwas nie auf. Er malt es.", "Brunner never writes things like that down. He draws them."),
        options: MOT.map((t, i) => ["m" + i, t]) },
    ];
  };
  const solution = (G) => { const R = roundOf(G); return { zeit: fmt(R.T), taeter: "p" + G.culprit, schluessel: String(R.X), versteck: String(R.hide), motiv: "m" + R.m }; };

  const hints = (G) => {
    const R = roundOf(G), D = G.players[G.decoy], C = G.players[G.culprit];
    const shown = R.holes.map(([i, j]) => hutAt(R.x0 + i, R.y0 + j)).sort((a, b) => a - b);
    return {
      zeit: [
        L("Die Uhr der Akku-Kassa stimmt nicht. Vergleiche ihre Meldung „Netzausfall“ mit dem Stromprotokoll des Elektrikers.", "The battery till’s clock is wrong. Compare its “power failure” entry with the electrician’s power log."),
        L(`Die Kassa-Uhr geht ${R.off} Minuten vor. Rechne die Bons damit auf die echte Zeit um.`, `The till clock is ${R.off} minutes fast. Use that to convert the receipts to the real time.`),
        L("Gesucht ist die Minute zwischen „in die Spendenkassa gelegt“ und „Spendenkassa nicht greifbar“ – beide Bons fallen in dieselbe echte Minute.", "You’re looking for the minute between “put into the donation box” and “donation box out of reach” – both receipts fall in the same real minute."),
      ],
      taeter: [
        L("Die Pfandmarke aus der Kühlhütte ist rot – eine Helfer-Marke. Wem gehört die Nummer?", "The token from the cold store is red – a helper’s token. Whose number is it?"),
        L("Lies den Gruppenchat vom Nachmittag: Hat jemand eine Marke weitergegeben?", "Read the group chat from the afternoon: did anyone pass a token on?"),
        L(`Die Marke gehört ${D.name}, eine hat ${D.name} aber weitergegeben. Wo war ${D.name}, als die Kühlhütte zuging? Vergleiche Kühlaggregat und Bonrolle.`, `The token belongs to ${D.name}, but ${D.name} passed one on. Where was ${D.name} when the cold store was shut? Compare the cooling unit and the till roll.`),
      ],
      schluessel: [
        L("Vergleiche jeden Anhänger am Brett mit der Anhänger-Liste. Schau genau – Bild antippen und hineinzoomen.", "Compare every tag on the board with the tag list. Look closely – tap the picture and zoom in."),
        L(`Am Haken „Kühlhütte“ müsste ein ${SN(R.tagOf.KÜHL)} hängen. Welcher Anhänger hängt dort wirklich?`, `The “Cold store” hook should have a ${SN(R.tagOf.KÜHL)}. Which tag is really hanging there?`),
        L(`Am Kühlhütten-Haken hängt ein ${SN(R.tagOf[String(R.X)])}. Zwei Haken sind leer – einer davon steht in der Ausgabeliste.`, `On the cold-store hook hangs a ${SN(R.tagOf[String(R.X)])}. Two hooks are empty – one of them is in the issue list.`),
      ],
      versteck: [
        L("Der Karton-Einsatz ist eine Schablone. Achte auf die Kerbe an der Unterkante – und darauf, was ganz unten auf dem Plan steht.", "The cardboard insert is a template. Look at the notch on its bottom edge – and at what is at the very bottom of the plan."),
        L("Leg den Einsatz so auf den Plan, dass die Kerbe unten genau an der Spitze des Christbaums sitzt. Welche Hütten zeigen die Löcher – und welche davon ist heute geschlossen?", "Place the insert on the plan so the notch at the bottom sits exactly on the tip of the Christmas tree. Which huts show through the holes – and which of them is closed today?"),
        L(`Durch die Löcher siehst du die Hütten ${shown.join(", ")}. Nur eine davon steht auf dem Aushang.`, `Through the holes you see huts ${shown.join(", ")}. Only one of them is on the notice.`),
      ],
      motiv: [
        L("Brunner sagt: „Die Sterne!“ Auf dem Plakat sind einige Lampen der Lichterkette Sterne.", "Brunner says: “The stars!” On the poster some of the bulbs in the chain of lights are stars."),
        L("Lies nur die Buchstaben in den gelben Sternen, von links nach rechts.", "Read only the letters in the yellow stars, from left to right."),
        L(`Das Wort beginnt mit „${MOTIVES[R.m][en ? "en" : "de"].slice(0, 2)}“.`, `The word begins with “${MOTIVES[R.m][en ? "en" : "de"].slice(0, 2)}”.`),
      ],
    };
  };

  const briefing = (N) => ({
    eyebrow: L("Kirchplatz · Kerzenthal · Samstag vor dem 3. Advent", "Church square · Kerzenthal · Saturday before the third Sunday of Advent"),
    title: L("Vier Minuten <em>Finsternis</em>", "Four Minutes <em>Dark</em>"),
    text: L(`Es ist 19:20 am Christkindlmarkt von Kerzenthal. Ihr habt heute für den Elternverein den Punschstand übernommen – Hütte 24, der Erlös ist für das neue Kindergartendach. Um 18:00 war die Lichterzeremonie: Vier Minuten lang war der ganze Kirchplatz dunkel, dann ging der große Baum an. In diesen vier Minuten ist eure Spendenkassa verschwunden. Und Marktmeister Alois Brunner wurde in die Kühlhütte des Fleischers gesperrt – er wurde knapp eine Stunde später gefunden, stark unterkühlt, aber er lebt. Die Kriminalpolizei kommt über die verschneite Passstraße erst um 20:10. ${N}, bis dahin will Petra Hold vom Elternverein einen Namen. Und einer von euch war's.`,
      `It is 19:20 at the Kerzenthal Christmas market. Today you took over the punch stall for the parents’ association – hut 24, the takings are for the nursery’s new roof. The lighting ceremony was at 18:00: for four minutes the whole church square was dark, then the big tree came on. In those four minutes your donation box disappeared. And market manager Alois Brunner was locked in the butcher’s cold store – he was found almost an hour later, badly chilled, but alive. The detectives won’t make it over the snowy mountain road until 20:10. ${N}, until then Petra Hold from the parents’ association wants a name. And one of you did it.`),
    steps: [
      [L("Akte lesen", "Read the file"), L("Du startest mit den Unterlagen vom Abend. Nach jeder richtigen Antwort kommen neue Beweisstücke dazu – sie sind mit „Neu“ markiert.", "You start with the documents from the evening. After each correct answer new evidence is added – it is marked “New”.")],
      [L("Fünf Fragen, der Reihe nach", "Five questions, in order"), L("Wann verschwand die Kassa, wer war es, wie wurde die Kühlhütte zugesperrt, wo ist die Kassa – und warum musste Brunner weg?", "When did the box disappear, who did it, how was the cold store locked, where is the box – and why did Brunner have to go?")],
      [L("Hinweise kosten Zeit", "Hints cost time"), L(`Bis zu drei Hinweise pro Frage: +${HINT_PENALTY.join(", +")} Strafminuten. Jede falsche Antwort kostet +${WRONG_PENALTY} Minuten.`, `Up to three hints per question: +${HINT_PENALTY.join(", +")} penalty minutes. Every wrong answer costs +${WRONG_PENALTY} minutes.`)],
      [L("Jeder ermittelt für sich", "Everyone investigates alone"), L(`Reden ist erlaubt – aber jeder Tipp hilft der Konkurrenz. ${LIMIT_MIN} Minuten bis zur Kripo; deine Zeit plus Strafminuten ergibt deinen Platz in der Rangliste.`, `Talking is allowed – but every tip helps the competition. ${LIMIT_MIN} minutes until the detectives arrive; your time plus penalty minutes decides your place in the ranking.`)],
      [L("Die Auflösung kommt für alle", "The solution comes for everyone"), L("Sobald alle fertig sind oder die Zeit um ist, gibt euer Organisator die Auflösung für alle gleichzeitig frei.", "As soon as everyone has finished or time is up, your organiser releases the solution for everyone at once.")],
    ],
  });

  // Aussagen je Station (drei Formulierungen je Station, damit nicht alle gleich klingen)
  const SAY = {
    kassa: [L("Ich war an der Kassa. Die läuft zum Glück mit Akku – ich hab im Handylicht einfach weiterverkauft.", "I was on the till. Luckily it runs on a battery – I just kept selling by the light of my phone.")],
    ausschank: [
      L("Ich hab ausgeschenkt. Im Dunkeln hab ich nur noch geschöpft, wenn mir jemand ein Häferl hingehalten hat.", "I was serving. In the dark I only ladled when someone held a mug out to me."),
      L("Ausschank, vorne am Tresen. Im Dunkeln hab ich mit der Kelle nach dem Topf getastet.", "Serving, at the front of the counter. In the dark I felt for the pot with the ladle."),
      L("Ich war beim Ausschank und hab die Leute im Handylicht bedient, so gut es ging.", "I was serving and helped people by phone light as best I could."),
    ],
    pfand: [
      L("Ich war bei der Pfandrückgabe, links am Tresen. Im Dunkeln hat kaum wer ein Häferl zurückgebracht – alle haben zum Baum geschaut.", "I was on deposit returns, on the left of the counter. In the dark hardly anyone brought a mug back – everyone was looking at the tree."),
      L("Pfandrückgabe. Ich hab im Dunkeln die Pfandmarken der Gäste sortiert, blau zu blau.", "Deposit returns. In the dark I sorted the guests’ tokens, blue with blue."),
    ],
    spuelen: [
      L("Ich war hinten beim Spülen. Im Dunkeln hab ich weitergewaschen, so gut es ging.", "I was at the back washing up. In the dark I kept washing as best I could."),
      L("Spülen, hinten in der Hütte. Im Finstern hab ich die Häferl nach Gefühl abgetrocknet.", "Washing up, at the back of the hut. In the dark I dried the mugs by feel."),
    ],
    nachschub: [
      L("Ich hab Nachschub aus dem Lager hinter der Hütte geholt – Punsch-Kanister und Häferl.", "I fetched supplies from the store room behind the hut – punch canisters and mugs."),
      L("Nachschub aus dem Lager, hinten. Im Dunkeln hab ich die Kanister mit dem Handy gesucht.", "Restocking from the store room, at the back. In the dark I looked for the canisters with my phone."),
    ],
  };

  function docs(G, me) {
    const R = roundOf(G), d = [], P = G.players, C = P[G.culprit], D = P[G.decoy], A = P[R.A], B = P[R.B];
    const rows = (list) => list.map((r) => `<tr>${r.map((x, i) => `<td${i === 0 ? ' class="mono"' : ""}>${x}</td>`).join("")}</tr>`).join("");
    const raw = (m, s) => sec(m + R.off, s);
    // ----- Stufe 1 -----
    d.push({ id: "meldung", stage: 1, kind: L("Notiz", "Note"), kk: "Notiz", title: L("Petra Holds Notiz", "Petra Hold’s note"), html: `
<div class="letterhead"><strong>${L("Petra Hold · Obfrau des Elternvereins", "Petra Hold · chair of the parents’ association")}</strong><span>${L("aufgeschrieben in der Punschhütte um", "written in the punch hut at")} ${fmt(R.found_at + 13)}</span></div>
<p>${L(`Um ${fmt(R.found_at)} hat der Fleischer Gruber beim Zusperren seine Kühlhütte (neben Hütte 12) aufgemacht – mit seinem eigenen Schlüssel. Drinnen saß unser Marktmeister Alois Brunner, stark unterkühlt. Er ist ansprechbar und wird im Rettungswagen gewärmt.`, `At ${fmt(R.found_at)} Gruber the butcher opened his cold store (next to hut 12) while locking up – with his own key. Inside sat our market manager Alois Brunner, badly chilled. He can talk and is being warmed up in the ambulance.`)}</p>
<ul>
<li>${L("Unsere Spendenkassa ist weg. Sie stand am hinteren Ende vom Tresen, beim Spülbecken – mit dem Geld fürs Kindergartendach.", "Our donation box is gone. It stood at the back end of the counter, by the sink – with the money for the nursery roof.")}</li>
<li>${L("Brunners Generalschlüssel für alle Hütten fehlt.", "Brunner’s master key for all huts is missing.")}</li>
<li>${L("Ich war während der Lichterzeremonie mit den Kindergartenkindern vorne an der Bühne. Den Stand habt ihr allein gemacht.", "During the lighting ceremony I was at the stage with the nursery children. You ran the stall on your own.")}</li>
<li>${L("Alle von euch waren den ganzen Abend in oder hinter der Hütte. Fremde kommen hinter den Tresen nicht hin – die Seitentür war zu.", "All of you were in or behind the hut all evening. Strangers can’t get behind the counter – the side door was shut.")}</li>
</ul>
<div class="postit">${L(`${me >= 0 ? P[me].name : ""}, ihr kennt euch am besten. Die Kripo wird fragen: wann, wer, wie, wo – und warum?`, `${me >= 0 ? P[me].name : ""}, you know each other best. The detectives will ask: when, who, how, where – and why?`)} <span>– P. H.</span></div>` });

    d.push({ id: "strom", stage: 1, kind: L("Systemauszug", "System log"), kk: "Systemauszug", title: L("Stromprotokoll des Elektrikers", "Electrician’s power log"), html: `
<div class="letterhead"><strong>${L("Elektro Hofer · Verteilerkasten Kirchplatz", "Hofer Electrical · church square distribution box")}</strong><span>${L("Auszug aus dem Schaltprotokoll, Funkuhr (sekundengenau)", "Extract from the switching log, radio clock (accurate to the second)")}</span></div>
<table class="grid"><tr><th>${L("Zeit", "Time")}</th><th>${L("Ereignis", "Event")}</th></tr>${rows([
      ["16:00:02", L("Marktbeleuchtung EIN (Zeitschaltuhr)", "Market lighting ON (timer)")],
      ["17:41:37", L("Sicherung F3 (Hütte 5, Glühweinkessel) ausgelöst", "Fuse F3 (hut 5, mulled-wine kettle) tripped")],
      ["17:42:10", L("Sicherung F3 wieder EIN", "Fuse F3 back ON")],
      [sec(R.D0, 10), L("Marktbeleuchtung AUS (Lichterzeremonie, von Hand)", "Market lighting OFF (lighting ceremony, manual)")],
      [sec(R.D0 + 4, 5), L("Christbaum EIN (Schalter des Christkinds)", "Christmas tree ON (Christkind’s switch)")],
      [sec(R.D0 + 4, 21), L("Marktbeleuchtung EIN (von Hand)", "Market lighting ON (manual)")],
      ["21:00:00", L("Marktbeleuchtung AUS (geplant)", "Market lighting OFF (scheduled)")],
    ])}</table>
<p class="small">${L("Auch die Steckdosen der Hütten hängen an der Marktbeleuchtung. Die Kühlhütte des Fleischers hat einen eigenen Anschluss und lief durch.", "The huts’ sockets are on the market lighting circuit too. The butcher’s cold store has its own supply and kept running.")}</p>` });

    const sale = (n1, n2, eur) => L(`${n1} × Punsch${n2 ? `, ${n2} × Pfand` : ""} · ${eur},00 €`, `${n1} × punch${n2 ? `, ${n2} × deposit` : ""} · €${eur}.00`);
    d.push({ id: "bons", stage: 1, kind: L("Beleg", "Receipt"), kk: "Beleg", title: L("Bonrolle der Punsch-Kassa", "Punch till roll"), html: `
<div class="letterhead"><strong>${L("Registrierkassa Hütte 24 · Journal", "Till, hut 24 · journal")}</strong><span>${L("Zeiten laut Kassa · Bediener = wer an der Kassa angemeldet war", "Times according to the till · operator = who was logged in at the till")}</span></div>
<table class="grid"><tr><th>${L("Kassa-Zeit", "Till time")}</th><th>${L("Bediener", "Operator")}</th><th>${L("Vorgang", "Entry")}</th></tr>${rows([
      [raw(hm("17:45"), 3), D.name, L("Schichtwechsel – angemeldet", "Shift change – logged in")],
      [raw(hm("17:52"), 14), D.name, sale(2, 2, 14)],
      [raw(hm("17:57"), 40), D.name, L("1 × Kinderpunsch, 1 × Pfand · 6,00 €", "1 × children’s punch, 1 × deposit · €6.00")],
      [raw(R.D0, 11), "System", L("Netzausfall – Akkubetrieb", "Power failure – running on battery")],
      [raw(R.D0, 48), D.name, sale(3, 3, 21)],
      [raw(R.T, R.sIn), D.name, L("Spende 5,00 € – in die Spendenkassa gelegt", "Donation €5.00 – put into the donation box")],
      [raw(R.T, R.sOut), D.name, L("Spende 2,00 € – Spendenkassa nicht greifbar, in die Lade", "Donation €2.00 – donation box out of reach, into the drawer")],
      [raw(R.T + 1, 25), D.name, sale(2, 0, 10)],
      [raw(R.D0 + 3, 50), D.name, sale(1, 1, 7)],
      [raw(R.D0 + 4, 22), "System", L("Netz wieder da", "Power restored")],
      [raw(R.D0 + 9, 31), D.name, sale(4, 4, 28)],
    ])}</table>
<p class="small">${L("Die Kassa leiht der Elternverein jedes Jahr vom Sportverein. Ob dort jemand die Uhr gestellt hat, weiß niemand.", "The parents’ association borrows the till from the sports club every year. Nobody knows whether anyone there set the clock.")}</p>` });

    const msg = (t, who, text) => `<tr><td class="mono">${t}</td><td>${who}</td><td>${text}</td></tr>`;
    d.push({ id: "chat", stage: 1, kind: L("Liste", "List"), kk: "Liste", title: L("Gruppenchat „Punschstand 🎄“", "Group chat “Punch stall 🎄”"), html: `
<div class="letterhead"><strong>${L("Gruppenchat der Punsch-Helfer", "Punch helpers’ group chat")}</strong><span>${L("Auszug, Zeiten vom Handy", "Extract, times from the phone")}</span></div>
<table class="grid"><tr><th>${L("Zeit", "Time")}</th><th>${L("Wer", "Who")}</th><th>${L("Nachricht", "Message")}</th></tr>
${msg("16:31", "Petra Hold", L("Danke, dass ihr heute helft! Schichtplan hängt in der Hütte. Den Lagerschlüssel holt ihr selbst im Marktbüro vom Brett.", "Thanks for helping today! The rota is up in the hut. Fetch the store-room key yourselves from the board in the market office."))}
${msg("17:31", C.name, L("Mein Helfer-Häferl ist runtergefallen 🙈 Hat wer eine Pfandmarke übrig? Will mir ein neues nehmen.", "My helper mug just fell and broke 🙈 Has anyone got a spare token? I want to take a new one."))}
${msg("17:33", D.name, L("Nimm eine von meinen, liegen neben der Kassa.", "Take one of mine, they’re next to the till."))}
${msg("17:34", C.name, L("Danke!! 🙏", "Thanks!! 🙏"))}
${msg("17:53", A.name, L("Gleich Gruppenfoto mit dem Christkind, alle nach vorn! 📸", "Group photo with the Christkind in a minute, everyone to the front! 📸"))}
${msg(fmt(R.D0), B.name, L("Licht aus 🕯️", "Lights out 🕯️"))}
${msg(fmt(R.D0 + 2), A.name, L("Ich seh gar nix 😅 wo ist der Schöpfer", "I can’t see a thing 😅 where’s the ladle"))}
${msg(fmt(R.D0 + 4), B.name, L("Der Baum ist an 😍", "The tree’s on 😍"))}
${msg(fmt(R.D0 + 4), D.name, L("Leute … die Spendenkassa ist weg?! Ich hab vorhin noch eine Spende reingelegt!", "Guys … the donation box is gone?! I put a donation in just now!"))}
${msg(fmt(R.D0 + 5), "Petra Hold", L("Bin gleich da!", "On my way!"))}
</table>` });

    d.push({ id: "aussagen", stage: 1, kind: L("Protokoll", "Statement"), kk: "Protokoll", title: L("Was jeder über die vier Minuten sagt", "What everyone says about the four minutes"), html: `
<div class="letterhead"><strong>${L("Kurzbefragung in der Punschhütte", "Quick questioning in the punch hut")}</strong><span>${L("notiert von Petra Hold · „Wo wart ihr, als es dunkel war?“", "noted by Petra Hold · “Where were you when it was dark?”")}</span></div>
${P.map((p, i) => { const same = P.filter((x) => x.st === p.st), k = same.indexOf(p) % SAY[p.st].length; return `<p class="q">${p.name} · ${ST[p.st]}${i === me ? L(" (deine Aussage)", " (your statement)") : ""}</p><p class="a">${L("„", "“")}${SAY[p.st][k]}${L("“", "”")}</p>`; }).join("\n")}
<p class="small">${L("Herr Brunner war kurz vor dem Dunkelwerden noch bei uns an der Hütte und wollte mit jemandem reden – mit wem, hat er nicht gesagt.", "Mr Brunner came by the hut just before it went dark and wanted to talk to someone – he didn’t say who.")}</p>` });

    // ----- Stufe 2 -----
    d.push({ id: "kuehlhuette", stage: 2, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Fund in der Kühlhütte", "Found in the cold store"), html: `
<div class="letterhead"><strong>${L("Fleischerei Gruber · Kühlhütte", "Gruber’s butcher · cold store")}</strong><span>${L("Foto und Notiz von Petra Hold", "Photo and note by Petra Hold")}</span></div>
${pfandmarke(en, R.found)}
<p>${L(`Am Boden der Kühlhütte lag diese rote Pfandmarke, Nummer ${R.found}. Herr Brunner sagt: „Ich hab Münzen klimpern gehört – die Spendenkassa! Ich bin hinterher, dann hat mich jemand von hinten in die Kühlhütte gestoßen. Gesehen hab ich nichts, es war ja stockfinster.“`, `This red deposit token, number ${R.found}, was lying on the floor of the cold store. Mr Brunner says: “I heard coins jingling – the donation box! I went after it, then someone shoved me into the cold store from behind. I didn’t see anything, it was pitch dark.”`)}</p>
<p class="small">${L("Rot sind nur die Helfer-Marken für eure eigenen Häferl, die der Gäste sind blau. Herr Brunner hatte keine Marken bei sich.", "Only the helpers’ tokens for your own mugs are red; the guests’ tokens are blue. Mr Brunner wasn’t carrying any tokens.")}</p>` });

    d.push({ id: "aggregat", stage: 2, kind: L("Systemauszug", "System log"), kk: "Systemauszug", title: L("Kühlaggregat: Türprotokoll", "Cooling unit: door log"), html: `
<div class="letterhead"><strong>${L("KühlTec · Kühlhütte Gruber", "KühlTec · Gruber’s cold store")}</strong><span>${L("Türkontakt, Uhr per Funk gestellt · eigener Stromanschluss", "Door contact, radio-controlled clock · own power supply")}</span></div>
<table class="grid"><tr><th>${L("Zeit", "Time")}</th><th>${L("Ereignis", "Event")}</th></tr>${rows([
      ["16:42:10", L("Tür geöffnet", "Door opened")], ["16:44:52", L("Tür geschlossen", "Door closed")],
      ["17:26:33", L("Tür geöffnet", "Door opened")], ["17:27:15", L("Tür geschlossen", "Door closed")],
      [sec(R.T + 1, 0), L("Tür geöffnet", "Door opened")], [sec(R.T + 1, 12), L("Tür geschlossen", "Door closed")],
      [sec(R.found_at, 4), L("Tür geöffnet", "Door opened")],
    ])}</table>
<p class="small">${L("Gruber: „Um halb fünf und halb sechs war ich selber drin, Würstel nachfüllen. Dann erst wieder beim Zusperren.“ Die Kühlhütte steht zwei Hütten neben eurer Punschhütte, durchs Gedränge gut eine halbe Minute.", "Gruber: “At half four and half five I was in myself, restocking sausages. Then not again until I locked up.” The cold store is two huts along from your punch hut – a good half a minute through the crowd.")}</p>` });

    d.push({ id: "marken", stage: 2, kind: L("Liste", "List"), kk: "Liste", title: L("Ausgabe der Helfer-Pfandmarken", "Helper tokens handed out"), html: `
<div class="letterhead"><strong>${L("Elternverein · Helfer-Pfandmarken (rot)", "Parents’ association · helper tokens (red)")}</strong><span>${L("je zwei pro Person, für das eigene Häferl · ausgegeben von Petra Hold, 16:30", "two per person, for your own mug · handed out by Petra Hold, 16:30")}</span></div>
<table class="grid"><tr><th>${L("Name", "Name")}</th><th>${L("Marken", "Tokens")}</th></tr>${P.map((p, i) => `<tr><td>${p.name}</td><td class="mono">${R.tokens[i].join(", ")}</td></tr>`).join("")}</table>
<p class="small">${L("Wer ein Häferl will, legt eine Marke in die Pfandbox. Die Pfandbox war um 19:00 leer bis auf blaue Marken.", "To take a mug you put a token in the deposit box. At 19:00 the deposit box held nothing but blue tokens.")}</p>` });

    d.push({ id: "schicht", stage: 2, kind: L("Liste", "List"), kk: "Liste", title: L("Schichtplan der Punschhütte", "Punch hut rota"), html: `
<div class="letterhead"><strong>${L("Schichtplan Hütte 24", "Rota, hut 24")}</strong><span>${L("hängt innen an der Hüttentür · Wechsel um 17:45", "pinned inside the hut door · change-over at 17:45")}</span></div>
<table class="grid"><tr><th>${L("Name", "Name")}</th><th>16:45–17:45</th><th>17:45–18:45</th></tr>${P.map((p) => `<tr><td>${p.name}</td><td>${ST[p.st1]}</td><td>${ST[p.st]}</td></tr>`).join("")}</table>
<p class="small">${L("Die Kassa steht vorne am Tresen, Spülbecken und Lagertür sind hinten. Die Spendenkassa stand beim Spülbecken.", "The till is at the front of the counter; the sink and the store-room door are at the back. The donation box stood by the sink.")}</p>` });

    // ----- Stufe 3 -----
    d.push({ id: "gruber", stage: 3, kind: L("Protokoll", "Statement"), kk: "Protokoll", title: L("Fleischer Gruber zur Kühlhütte", "Gruber the butcher on the cold store"), html: `
<div class="letterhead"><strong>${L("Aussage Fleischer Gruber", "Statement by Gruber the butcher")}</strong><span>${L("notiert von Petra Hold", "noted by Petra Hold")}</span></div>
<p class="a">${L("„Die Kühlhütte war zugesperrt, zweimal umgedreht – nicht nur der Riegel. Von innen geht da nix. Es gibt zwei Schlüssel: meinen, den hab ich den ganzen Abend in der Hosentasche gehabt, und den zweiten am Brett im Marktbüro. Den hat einer genommen! Aber geh schauen – am Haken hängt einer. Das Marktbüro ist offen, die Helfer holen sich dort ihre Lagerschlüssel.“", "“The cold store was locked, the key turned twice – not just the bolt. You can’t do a thing from the inside. There are two keys: mine, which was in my trouser pocket all evening, and the second one on the board in the market office. Somebody took that one! But go and look – there’s a key on the hook. The market office is open, the helpers fetch their store-room keys there.”")}${L("", "")}</p>
<p class="small">${L("Petra Hold: „Ich hab vorhin aufs Brett geschaut – es hängen Schlüssel an allen Haken, bis auf zwei. Ich hab mir nichts gedacht.“", "Petra Hold: “I glanced at the board earlier – there are keys on all the hooks except two. I didn’t think anything of it.”")}</p>` });

    const hooks = R.labels.map((l) => ({ label: hookPlate(l), tag: l === "KÜHL" ? R.tagOf[String(R.X)] : (l === String(R.X) || l === String(R.Y)) ? null : R.tagOf[l] }));
    d.push({ id: "brett", stage: 3, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Das Schlüsselbrett im Marktbüro", "The key board in the market office"), html: `
${brett(en, hooks)}
<p class="small">${L("Fotografiert um 19:12. Jeder Schlüssel hat einen Anhänger mit eigener Form und Farbe.", "Photographed at 19:12. Every key has a tag with its own shape and colour.")}</p>` });

    d.push({ id: "anhaenger", stage: 3, kind: L("Liste", "List"), kk: "Liste", title: L("Anhänger-Liste und Schlüsselausgabe", "Tag list and key issue log"), html: `
<div class="letterhead"><strong>${L("Marktbüro Kerzenthal", "Kerzenthal market office")}</strong><span>${L("Liste neben dem Brett · Ausgabe heute", "List next to the board · issued today")}</span></div>
<table class="grid"><tr><th>${L("Haken", "Hook")}</th><th>${L("Anhänger", "Tag")}</th></tr>${R.labels.map((l) => `<tr><td>${hookName(l)}</td><td>${SN(R.tagOf[l])}</td></tr>`).join("")}</table>
<p>${L(`Ausgabe heute: Hütte ${R.Y} – Schlüssel um 15:40 an den Standler, „bringt ihn morgen früh zurück“. Lager 24 – vom Punsch-Team selbst geholt und zurückgehängt.`, `Issued today: hut ${R.Y} – key handed to the stallholder at 15:40, “bringing it back tomorrow morning”. Store 24 – fetched and returned by the punch team themselves.`)}</p>` });

    // ----- Stufe 4 -----
    d.push({ id: "karton", stage: 4, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Im Altpapier hinter der Punschhütte", "In the recycling behind the punch hut"), html: `
<div class="letterhead"><strong>${L("Fundstück", "Find")}</strong><span>${L("Einsatz aus einem Häferl-Karton · daneben der Plan für die Punsch-Helfer", "Insert from a box of mugs · next to it the plan for the punch helpers")}</span></div>
<p>${L("Jemand hat aus dem Einsatz eines Häferl-Kartons vier Löcher geschnitten und unten eine Kerbe. Er lag zusammen mit dem Plan, der auf der Rückseite eures Schichtplans aufgedruckt ist.", "Someone cut four holes into the insert of a box of mugs and a notch on the bottom. It was lying together with the plan printed on the back of your rota.")}</p>
${schabloneF(en, "karton", R.p, R.holes)}
<p class="small">${L("Der Einsatz allein, falls das Schieben nicht klappt:", "The insert on its own, in case moving it doesn’t work:")}</p>
${templateF(en, R.p, R.holes, { standalone: true })}` });

    d.push({ id: "geschlossen", stage: 4, kind: L("Liste", "List"), kk: "Liste", title: L("Aushang: heute geschlossen", "Notice: closed today"), html: `
<div class="letterhead"><strong>${L("Marktbüro Kerzenthal", "Kerzenthal market office")}</strong><span>${L("Aushang am Kirchentor", "Notice on the church gate")}</span></div>
<table class="grid"><tr><th>${L("Hütte", "Hut")}</th><th>${L("Stand", "Stall")}</th></tr>${R.closed.map((h) => `<tr><td>${h}</td><td>${hutName(h)}</td></tr>`).join("")}</table>
<p>${L("Petra Hold: „Mit Brunners Generalschlüssel sperrt man jede Hütte auf. Die Kassa ist sicher in einer, die heute zu ist – sonst hätte sie wer gesehen. Die Polizei lässt aber nur eine aufmachen.“", "Petra Hold: “With Brunner’s master key you can open any hut. The box is bound to be in one that’s closed today – otherwise someone would have seen it. But the police will only open one.”")}</p>` });

    // ----- Stufe 5 -----
    d.push({ id: "kassa", stage: 5, kind: L("Notiz", "Note"), kk: "Notiz", title: L(`Gefunden in Hütte ${R.hide}`, `Found in hut ${R.hide}`), html: `
<div class="letterhead"><strong>${L("Petra Hold", "Petra Hold")}</strong><span>${L("19:48, mit der Polizistin vom Ort", "19:48, with the local police officer")}</span></div>
<p>${L(`In Hütte ${R.hide} (${hutName(R.hide)}) stand unter einer Plane die Spendenkassa – voll, nichts fehlt. Daneben lag Brunners Generalschlüssel.`, `In hut ${R.hide} (${hutName(R.hide)}) the donation box was standing under a tarpaulin – full, nothing missing. Brunner’s master key was lying next to it.`)}</p>
<p>${L(`Herr Brunner ist wieder warm und sagt: „Ich wollte nach dem Lichtermoment mit ${C.name} reden. Was ich weiß, hab ich in mein Adventrätsel für den Kindergarten gemalt – so was schreib ich nicht einfach auf. Das Plakat hängt im Marktbüro. Die Sterne!“`, `Mr Brunner has warmed up and says: “I wanted to talk to ${C.name} after the lighting moment. What I know, I drew into my advent puzzle for the nursery – I don’t just write things like that down. The poster is in the market office. The stars!”`)}</p>` });

    d.push({ id: "plakat", stage: 5, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Brunners Adventrätsel", "Brunner’s advent puzzle"), html: `
${plakat(en, R.bulbs[en ? "en" : "de"])}
<p class="small">${L("Das Plakat hat Brunner diese Woche für den Kindergarten gezeichnet. Jede Lampe trägt einen Buchstaben.", "Brunner drew the poster for the nursery this week. Every bulb carries a letter.")}</p>` });
    return d;
  }

  function resolution(G) {
    const R = roundOf(G), P = G.players, C = P[G.culprit], D = P[G.decoy];
    const word = MOTIVES[R.m][en ? "en" : "de"];
    const text = L(
      `${C.name} hatte die Schicht „${ST[C.st]}“ – hinten in der Hütte, wo auch die Spendenkassa beim Spülbecken stand. Schon um halb sechs hatte ${C.name} beim Lagerschlüssel-Holen im Marktbüro den Kühlhütten-Schlüssel vom Brett genommen und an dessen Haken den Schlüssel von Hütte ${R.X} gehängt – deshalb sah das Brett vollständig aus. Als es um ${fmt(R.D0)} dunkel wurde, wartete ${C.name}, bis ${D.name} an der Kassa um ${fmt(R.T)} eine Spende eingelegt hatte, und nahm die Kassa um ${fmt(R.T)} vom Tresen. Die Kassa-Uhr geht ${R.off} Minuten vor – deshalb steht auf dem Bon ${fmt(R.T + R.off)}. Brunner hörte die Münzen und ging hinterher; ${C.name} stieß ihn um ${fmt(R.T + 1)} in die Kühlhütte und sperrte zweimal zu. Dabei fiel die rote Pfandmarke ${R.found} aus der Jacke – eine von ${D.name}, die ${C.name} am Nachmittag bekommen hatte. ${D.name} selbst kassierte 13 Sekunden nach dem Zusperren schon wieder vorne an der Kassa. Mit Brunners Generalschlüssel brachte ${C.name} die Kassa in die geschlossene Hütte ${R.hide}; den Karton-Einsatz hatte ${C.name} vorbereitet, um die Hütte im Dunkeln vom Christbaum aus zu finden – die anderen drei Löcher zeigen offene Hütten. Der leere Haken von Hütte ${R.Y} hat nichts damit zu tun: Der Schlüssel ist beim Standler. Und warum? Brunner wusste Bescheid – auf seinem Plakat steht in den Sternen ${word}: ${MOT[R.m]} Nach dem Lichtermoment wollte er ${C.name} zur Rede stellen. Herr Brunner erholt sich, das Geld fürs Kindergartendach ist vollständig da.`,
      `${C.name} was on “${ST[C.st]}” – at the back of the hut, where the donation box stood by the sink. At half past five, when fetching the store-room key from the market office, ${C.name} had already taken the cold-store key off the board and hung the key for hut ${R.X} on its hook – which is why the board looked complete. When it went dark at ${fmt(R.D0)}, ${C.name} waited until ${D.name} on the till had put a donation in at ${fmt(R.T)}, and took the box off the counter at ${fmt(R.T)}. The till clock is ${R.off} minutes fast – that’s why the receipt says ${fmt(R.T + R.off)}. Brunner heard the coins and followed; at ${fmt(R.T + 1)} ${C.name} shoved him into the cold store and turned the key twice. The red deposit token ${R.found} fell out of a jacket pocket – one of ${D.name}’s, which ${C.name} had been given that afternoon. ${D.name} was already back on the till 13 seconds after the cold store was locked. With Brunner’s master key, ${C.name} took the box to hut ${R.hide}, which was closed; ${C.name} had prepared the cardboard insert to find the hut from the Christmas tree in the dark – the other three holes show huts that were open. The empty hook for hut ${R.Y} has nothing to do with it: that key is with the stallholder. And why? Brunner knew – on his poster the stars spell ${word}: ${MOT[R.m]} After the lighting moment he wanted to confront ${C.name}. Mr Brunner is recovering, and the money for the nursery roof is all there.`);
    return { culprit: C.name, text, item: `${L("Hütte", "Hut")} ${R.hide}`, motive: MOT_SHORT[R.m] };
  }

  return { TITLE, CLOCK_LABEL, LATE_LABEL, PLACE, STAGE_TITLES, QUIRKS, awardOf, questions, solution, hints, briefing, docs, resolution, MOT, MOT_SHORT, ST, hutName };
}

// ---------- Deutsche Fassung (Standard-Exporte) ----------
const DE = make("de");
export const { TITLE, CLOCK_LABEL, LATE_LABEL, PLACE, STAGE_TITLES, QUIRKS, awardOf, questions, solution, hints, docs, resolution, MOT, MOT_SHORT, ST, hutName } = DE;
export const briefing = (N, G = {}) => DE.briefing(N, G);
// Kein Verhörraum – Platzhalter, falls der Server danach fragt
export const doubleSystem = () => "";
export const doubleFallback = () => "";
