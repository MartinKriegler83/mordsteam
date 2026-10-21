// Mordsteam Special 002 – „Vier Minuten Finsternis“ (Weihnachts-Special, Solo-Format ohne KI, Fallbibel freigegeben 21.10.2026)
// Ein/e Ermittler/in (Polizei im Dienst am Markt), 50 Minuten, vier Fragen nacheinander. Täter, Zeit, Versteck und Code wechseln je Durchgang.
// Schauplatz: erfundene Kleinstadt Kerzenthal, Christkindlmarkt am Kirchplatz, Samstag vor dem 3. Advent. Marktmeister Sepp Wimmer überlebt.
// Frage 1 (Wann?): Besucherfotos aus dem Dunkeln zeigen nur die Turmuhr. Die geht vor – um wie viel, zeigt Foto 4 (Baum ein) gegen das
//   Stromprotokoll. Antwort = Uhr auf dem Riegel-Foto minus Vorgehen.
// Frage 2 (Wer?): Häferl in der Kühlhütte (Jahresmotiv) gegen das Gruppenfoto um 17:55 – je zwei haben dasselbe Motiv; Petra Hold + Schichtplan
//   geben einer der beiden ein Alibi.
// Frage 3 (Wo?): Schablone aus Lebkuchen-Karton, Kerbe an den Kirchturm → Löcher zeigen vier Hütten, nur eine davon ist heute geschlossen.
// Frage 4 (Code): Staubzucker auf vier Tasten + „Weg des Kometen“ auf der Serviette (vom Schweif zum Stern) → Reihenfolge.
// Diese Datei baut beide Sprachen (make("de") / make("en")); special-002-en.js exportiert die englische Fassung.
import { marketPlan, towerPhoto, groupPhoto, mugPhoto, keypad, napkin, templateSvg, schablone, MOTIFS, MOTIF_NAME, GRID, COLS, ROWS, TOWER_COL, TW, TH, cellOf, hutAt, KEYPOS } from "../art/special002.js";

export const ID = "special-002";
export const LIMIT_MIN = 50;
export const VARIANTS = 4;
export const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const pad2 = (n) => String(n).padStart(2, "0");
export const fmt = (x) => `${pad2(Math.floor(x / 60) % 24)}:${pad2(x % 60)}`;
export const TRAIN_START = hm("19:45");      // Uhr beim Start
export const HINT_PENALTY = [1, 2, 3];
export const WRONG_PENALTY = 3;

export const ORDER = ["gerry", "elfi", "rosi", "konrad", "jonas"];
export const CULPRITS = ORDER.slice();
export const FEM = { gerry: false, elfi: true, rosi: true, konrad: false, jonas: false };
export const OWN = { gerry: 9, elfi: 16, rosi: 5, konrad: 21, jonas: null };
export const PUNSCH = 24, KINDERPUNSCH = 14, FLEISCHER = 12, KRAPFEN = 13;
const SPECIAL = new Set([5, 9, 12, 13, 14, 16, 21, 24]);
export const HUTS = {
  1: ["Kerzenzieherei", "Candle maker"], 2: ["Christbaumschmuck", "Tree decorations"], 3: ["Honig & Met", "Honey & mead"], 4: ["Strickwaren", "Knitwear"],
  5: ["Glühwein Strobl", "Strobl’s mulled wine"], 6: ["Holzspielzeug", "Wooden toys"], 7: ["Weihnachtskarten", "Christmas cards"], 8: ["Bratäpfel", "Baked apples"],
  9: ["Maroni Pammer", "Pammer’s chestnuts"], 10: ["Kasnocken", "Cheese dumplings"], 11: ["Seifen & Kräuter", "Soap & herbs"], 12: ["Fleischerei Gruber (mit Kühlhütte)", "Gruber’s butcher (with cold store)"],
  13: ["Krapfen", "Doughnuts"], 14: ["Kinderpunsch", "Children’s punch"], 15: ["Keramik", "Pottery"], 16: ["Lebkuchen Wagenhofer", "Wagenhofer’s gingerbread"],
  17: ["Schafwolle", "Sheep’s wool"], 18: ["Glaskunst", "Glass art"], 19: ["Zuckerwatte", "Candyfloss"], 20: ["Waffeln", "Waffles"],
  21: ["Krippenschnitzerei Eibl", "Eibl’s nativity carvings"], 22: ["Lángos", "Lángos"], 23: ["Filzpatschen", "Felt slippers"], 24: ["Punsch Elternverein", "Parents’ association punch"],
};

// ---------- je Runde ausgelost (deterministisch aus Täter und Variante) ----------
const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };   // statt sort(() => r() - .5): gleiches Ergebnis in jeder JS-Engine
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DARK = [hm("18:01"), hm("18:03"), hm("17:59"), hm("18:02")];   // Marktbeleuchtung wirklich AUS (Programm sagt 18:00)
const FOUND = [hm("19:31"), hm("19:26"), hm("19:37"), hm("19:29"), hm("19:34")];   // Fund in der Kühlhütte – nicht aus der Tatzeit ableitbar (Simulation 21.10.2026)
// Wege für den Code: vier verschiedene Tasten, eindeutig über Staubzucker + Form (Simulation 21.10.2026):
// - kein Schritt läuft über eine andere Taste (beide Komponenten gerade, z. B. 7→9 oder 1→9) – sonst sieht die Linie aus wie zwei Schritte
// - die Serviette zeigt nur die Form (ohne Raster), deshalb muss die Reihenfolge auch bei anderem Maßstab eindeutig sein
const VEC = (seq) => seq.slice(1).map((k, i) => { const [a, b] = KEYPOS(seq[i]), [c, d] = KEYPOS(k); return [c - a, d - b]; });
const same = (u, w) => { if (u.length !== w.length) return false; let lam = null;   // u = λ·w mit λ > 0 für alle Schritte
  for (let i = 0; i < u.length; i++) for (let j = 0; j < 2; j++) { if (w[i][j] === 0) { if (u[i][j] !== 0) return false; continue; } const l = u[i][j] / w[i][j]; if (l <= 0 || (lam !== null && Math.abs(l - lam) > 1e-9)) return false; lam = l; }
  return true; };
export function pathMatches(keys, vec) {   // alle Reihenfolgen der Tasten, deren Schritte (in beliebigem Maßstab) der Form entsprechen
  const out = [];
  const go = (seq, left) => { if (!left.length) { if (same(VEC(seq), vec)) out.push(seq.join("")); return; } left.forEach((k, i) => go([...seq, k], left.filter((_, j) => j !== i))); };
  go([], keys);
  return out;
}
export const overKey = ([x, y]) => x % 2 === 0 && y % 2 === 0 && (x !== 0 || y !== 0);   // Schritt läuft über die Mitte einer anderen Taste
// Abstand zweier Strecken (Tastenraster-Einheiten) – für den Schweif am Startpunkt, der keine andere Linie berühren darf
const segPt = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
const cross = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
export const segDist = (a, b, c, d) => cross(a, b, c, d) ? 0 : Math.min(segPt(a, c, d), segPt(b, c, d), segPt(c, a, b), segPt(d, a, b));
export const TAIL = 0.9;   // Schweiflänge in Tastenabständen (Zeichnung: napkin)
export function tailSeg(seq) { const P = seq.map(KEYPOS), [dx, dy] = [P[1][0] - P[0][0], P[1][1] - P[0][1]], l = Math.hypot(dx, dy); return [P[0], [P[0][0] - dx / l * TAIL, P[0][1] - dy / l * TAIL]]; }
export function tailClear(seq) { const P = seq.map(KEYPOS), [a, b] = tailSeg(seq); let m = Infinity; for (let i = 1; i < P.length - 1; i++) m = Math.min(m, segDist(a, b, P[i], P[i + 1])); return m; }
export function selfTouch(seq) {   // kleinster Abstand nicht benachbarter Wegstücke (0 = Kreuzung/Überlappung)
  const P = seq.map(KEYPOS); let m = Infinity; for (let i = 0; i < P.length - 1; i++) for (let j = i + 2; j < P.length - 1; j++) m = Math.min(m, segDist(P[i], P[i + 1], P[j], P[j + 1])); return m; }
const CODES = (() => {
  const L = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++) for (let d = 1; d <= 9; d++) {
    const s = [a, b, c, d]; if (new Set(s).size !== 4) continue;
    const v = VEC(s);
    if (v.some(([x, y]) => Math.abs(x) > 2 || Math.abs(y) > 2)) continue;
    if (v.some(overKey)) continue;
    if (v.some(([x, y], i) => i && x === v[i - 1][0] && y === v[i - 1][1])) continue;     // keine zwei gleichen Schritte hintereinander
    if (v.some(([x, y], i) => i && x === -v[i - 1][0] && y === -v[i - 1][1])) continue;   // keine Umkehr auf derselben Linie
    if (v.some(([x, y], i) => i && x * v[i - 1][1] === y * v[i - 1][0])) continue;         // kein Knick ohne Richtungswechsel (sonst wirkt der Knick wie eine Gerade)
    if (selfTouch(s) < 0.3) continue;                                                     // Weg kreuzt/berührt sich nicht
    if (tailClear(s) < 0.35) continue;                                                    // Schweif liegt frei
    if (pathMatches(s, v).length !== 1) continue;
    if (pathMatches(s, VEC([...s].reverse())).length !== 1) continue;
    L.push(s);
  }
  return L;
})();
const ROUNDS = {};
export function roundOf(c, v) {
  const key = `${c}/${v}`;
  if (ROUNDS[key]) return ROUNDS[key];
  const ci = ORDER.indexOf(c), r = rng(ci * 7919 + v * 104729 + 17);
  // Frage 1
  const D0 = DARK[v % 4], k = 1 + ((ci + 2 * v) % 3), T = D0 + k, off = 2 + ((ci + v) % 3), t2 = D0 + (k === 1 ? 3 : 1), fi = (ci + 3 * v) % FOUND.length, found = FOUND[fi] === D0 + k + 90 ? FOUND[(fi + 1) % FOUND.length] : FOUND[fi];   // nie genau Tatzeit + 90
  // Frage 2
  const cand = ORDER.filter((x) => x !== c && x !== "jonas"), decoy = cand[(v + ci) % cand.length];
  const M = MOTIFS[(ci + v) % 4], M2 = MOTIFS[(ci + v + 1) % 4], M3 = MOTIFS[(ci + v + 2) % 4];
  const others = ORDER.filter((x) => x !== c && x !== decoy), single = others[v % 3];
  const mug = Object.fromEntries(ORDER.map((x) => [x, x === c || x === decoy ? M : x === single ? M3 : M2]));
  // Frage 3: Kerbe über Spalte p der Schablone, richtige Lage x0 = Turmspalte − p, y = 0
  const p = 1 + ((ci + v) % 2), x0 = TOWER_COL - p;
  const covered = []; for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) covered.push([i, j]);
  const hutOf = ([i, j], x, y) => hutAt(x + i, y + j);
  let best = null;
  for (let tries = 0; tries < 400 && !best; tries++) {
    const pool = covered.filter((cc) => !SPECIAL.has(hutOf(cc, x0, 0)));
    const hc = pool[Math.floor(r() * pool.length)];
    const rest = shuffle(covered.filter((cc) => cc !== hc), r);
    const holes = [hc, ...rest.slice(0, 3)];
    const under = new Set(holes.map((cc) => hutOf(cc, x0, 0)));
    const free = Object.keys(HUTS).map(Number).filter((n) => !SPECIAL.has(n) && !under.has(n)); const freeS = shuffle(free, r);
    const closed = [hutOf(hc, x0, 0), ...freeS.slice(0, 5)];
    let traps = 0, below = false;
    for (let x = 0; x <= COLS - TW; x++) for (let y = 0; y <= ROWS - TH; y++) {
      if (x === x0 && y === 0) continue;
      const shown = holes.map((cc) => hutOf(cc, x, y)).filter((n) => closed.includes(n));
      if (x === x0 && shown.length === 1) below = true;   // Kerbe noch unter dem Turm, nur tiefer – darf nie genau eine geschlossene Hütte zeigen
      else if (shown.length === 1) traps++;
    }
    if (traps >= 2 && !below) best = { holes, closed: closed.sort((a, b) => a - b), hide: hutOf(hc, x0, 0) };
  }
  // Frage 4
  const code = CODES[Math.floor(r() * CODES.length)];
  return (ROUNDS[key] = { D0, k, T, off, t2, found, decoy, M, mug, p, x0, ...best, code, codeStr: code.join(""), keys: [...code].sort((a, b) => a - b) });
}
export const tatOf = (c, v) => roundOf(c, v).T;
export const hideOf = (c, v) => roundOf(c, v).hide;

// ---------- Sprachabhängiges ----------
export function make(lang) {
  const en = lang === "en", L = (d, e) => (en ? e : d);
  const SUSPECTS = {
    gerry: { name: "Gerhard „Gerry“ Pammer", short: "Gerry", role: L("Maronibrater, Hütte 9", "Chestnut roaster, hut 9") },
    elfi: { name: "Elfi Wagenhofer", short: "Elfi", role: L("Lebkuchenstand, Hütte 16", "Gingerbread stall, hut 16") },
    rosi: { name: "Rosi Strobl", short: "Rosi", role: L("Glühweinwirtin, Hütte 5", "Mulled-wine seller, hut 5") },
    konrad: { name: "Konrad Eibl", short: "Konrad", role: L("Krippenschnitzer, Hütte 21", "Nativity carver, hut 21") },
    jonas: { name: "Jonas Kranz", short: "Jonas", role: L("Engel, begleitet das Christkind", "Angel, escorts the Christkind") },
  };
  if (en) SUSPECTS.gerry.name = "Gerhard “Gerry” Pammer";
  const hutName = (n) => HUTS[n][en ? 1 : 0];
  const hutTxt = (n) => `${L("Hütte", "hut")} ${n} (${hutName(n)})`;
  const MN = (m) => MOTIF_NAME[en ? "en" : "de"][m];
  const pron = (c) => (FEM[c] ? L("sie", "she") : L("er", "he"));
  const Pron = (c) => (FEM[c] ? L("Sie", "She") : L("Er", "He"));

  const TITLE = L("Vier Minuten Finsternis", "Four Minutes Dark");
  const UI = {
    clock: L("Kirchplatz", "Church square"), until: L("bis zur Kripo", "until the detectives"), late: L("Kripo wartet", "detectives waiting"), stamp: L("WEIHNACHTEN", "CHRISTMAS"),
    fb: L("den Weihnachtsfall", "the Christmas case"), cert: L("und die Spendenkassa gefunden, bevor die Kriminalpolizei über die verschneite Passstraße kam.", "and found the donation box before the detectives made it over the snowy mountain road."),
    caseNo: L("SPECIAL WEIHNACHTEN", "SPECIAL CHRISTMAS"),
    stages: { 2: L("Neue Beweisstücke: die Kühlhütte und die Standler", "New evidence: the cold store and the stallholders"), 3: L("Neue Beweisstücke: ein Karton im Müll", "New evidence: cardboard in the rubbish"), 4: L("Neue Beweisstücke: die Spendenkassa", "New evidence: the donation box") },
  };
  const QUESTIONS = [
    { key: "zeit", nr: 1, type: "time", label: L("Um wie viel Uhr wurde die Kühlhütte verriegelt?", "At what time was the cold store bolted?"), hint: L("Uhrzeit, z. B. 18:15", "Time on the 24-hour clock, e.g. 18:15") },
    { key: "taeter", nr: 2, type: "select", label: L("Wer hat Sepp Wimmer eingesperrt?", "Who locked Sepp Wimmer in?"), hint: L("Die Häferl hat den Abend über niemand getauscht.", "Nobody swapped mugs that evening."),
      options: ORDER.map((k) => [k, `${SUSPECTS[k].name} (${SUSPECTS[k].role.split(",")[0]})`]) },
    { key: "versteck", nr: 3, type: "select", label: L("In welcher Hütte ist die Spendenkassa?", "Which hut is the donation box in?"), hint: L("Die Polizei lässt nur eine Hütte aufsperren.", "The police will only have one hut opened."),
      options: Object.keys(HUTS).map((n) => [String(n), `${n} · ${hutName(n)}`]) },
    { key: "code", nr: 4, type: "code", label: L("Wie lautet der neue Code der Spendenkassa?", "What is the donation box’s new code?"), hint: L("vier Ziffern", "four digits") },
  ];
  const solution = (c, v) => { const R = roundOf(c, v); return { zeit: fmt(R.T), taeter: c, versteck: String(R.hide), code: R.codeStr }; };

  const HINTS = (v, c) => {
    const R = roundOf(c, v), pair = ORDER.filter((x) => R.mug[x] === R.M).map((x) => SUSPECTS[x].short);
    const shown = R.holes.map(([i, j]) => hutAt(R.x0 + i, j)).sort((a, b) => a - b);
    return {
      zeit: [
        L("Die Fotos haben keine Uhrzeit – aber auf jedem ist die Turmuhr zu sehen. Laut Pfarramt geht sie vor. Um wie viel?", "The photos have no timestamp – but the church clock is visible on each one. According to the parish office it runs fast. By how much?"),
        L("Das Stromprotokoll sagt, wann der Baum wirklich eingeschaltet wurde. Vergleiche das mit der Turmuhr auf dem Foto vom leuchtenden Baum.", "The power log says when the tree was really switched on. Compare that with the church clock on the photo of the lit tree."),
        L(`Die Turmuhr geht ${R.off} Minuten vor. Zieh sie von der Uhrzeit auf dem Foto mit dem Riegel ab.`, `The church clock is ${R.off} minutes fast. Subtract that from the time on the photo with the bolt.`),
      ],
      taeter: [
        L("Das Häferl aus der Kühlhütte hat ein Jahresmotiv. Wer hielt um 17:55 ein Häferl mit diesem Motiv?", "The mug from the cold store has a year motif. Who was holding a mug with that motif at 17:55?"),
        L("Zwei Personen haben dieses Motiv. Eine davon war während der vier Minuten nachweislich woanders – lies Petra Holds Aussage und den Schichtplan.", "Two people have that motif. One of them was provably somewhere else during the four minutes – read Petra Hold’s statement and the shift rota."),
        L(`Das Motiv ist ${MN(R.M)}: ${pair[0]} und ${pair[1]}. Wer half um 18:00 beim Kinderpunsch aus?`, `The motif is the ${MN(R.M)}: ${pair[0]} and ${pair[1]}. Who was helping out at the children’s punch at 18:00?`),
      ],
      versteck: [
        L("Der Karton ist eine Schablone. Achte auf die Kerbe an der Oberkante – und auf den roten Pfeil ganz oben auf dem Plan.", "The cardboard is a template. Look at the notch on its top edge – and at the red arrow at the very top of the plan."),
        L("Leg den Karton so auf den Plan, dass die Kerbe genau am roten Pfeil am Fuß des Kirchturms sitzt – die Oberkante also ganz oben. Welche Hütten zeigen die Löcher – und welche davon ist heute geschlossen?", "Place the cardboard on the plan so the notch sits exactly on the red arrow at the foot of the church tower – so its top edge is right at the top. Which huts show through the holes – and which of them is closed today?"),
        L(`Durch die Löcher siehst du die Hütten ${shown.join(", ")}. Nur eine davon steht auf dem Aushang.`, `Through the holes you see huts ${shown.join(", ")}. Only one of them is on the notice.`),
      ],
      code: [
        L("Der Staubzucker zeigt, welche vier Tasten gedrückt wurden – aber nicht die Reihenfolge.", "The icing sugar shows which four keys were pressed – but not the order."),
        L("Die Serviette zeigt den Weg: Er beginnt am Schweif und endet am Stern, die Pfeile zeigen die Richtung. Jeder Knick ist eine Taste. Leg die Form gedanklich so auf die vier bestäubten Tasten, dass alle vier Knicke auf einer Taste landen.", "The napkin shows the path: it begins at the tail and ends at the star, the arrows show the direction. Every corner is a key. Mentally lay the shape over the four dusted keys so that all four corners land on a key."),
        L(`Der Code beginnt mit ${R.code[0]} und endet mit ${R.code[3]}.`, `The code starts with ${R.code[0]} and ends with ${R.code[3]}.`),
      ],
    };
  };

  const briefing = (N) => ({
    eyebrow: L("Kirchplatz · Kerzenthal · Samstag vor dem 3. Advent", "Church square · Kerzenthal · Saturday before the third Sunday of Advent"),
    title: L("Vier Minuten <em>Finsternis</em>", "Four Minutes <em>Dark</em>"),
    text: L(`Es ist 19:45 am Christkindlmarkt von Kerzenthal. Um 18:00 war die Lichterzeremonie: Die Marktbeleuchtung ging aus, vier Minuten lang war der ganze Kirchplatz dunkel, dann schaltete das Christkind den großen Baum ein. In diesen vier Minuten verschwand die Spendenkassa des Punschstands – der Erlös ist für das neue Dach des Kindergartens. Und Marktmeister Sepp Wimmer wurde erst vor Kurzem gefunden: eingesperrt in der Kühlhütte des Fleischerstands, stark unterkühlt, aber am Leben. Du hast heute Dienst am Markt, ${N} – als Polizistin bzw. Polizist von Kerzenthal. Die Kriminalpolizei steckt im Schneetreiben auf der Passstraße und braucht 50 Minuten. Bis dahin ermittelst du.`,
      `It is 19:45 at the Kerzenthal Christmas market. The lighting ceremony was at 18:00: the market lights went out, the whole church square was dark for four minutes, then the Christkind – the angel-like gift-bringer of Austrian Christmas, played every year by a local girl – switched on the big tree. In those four minutes the punch stall’s donation box disappeared – the takings are for the nursery’s new roof. And market manager Sepp Wimmer was found only a short while ago: locked in the butcher’s cold store, badly chilled, but alive. You are the police officer on duty at the market, ${N}. The detectives are stuck in the snow on the mountain road and need 50 minutes. Until then, you investigate.`),
    steps: [
      [L("Akte lesen", "Read the file"), L("Du startest mit den Unterlagen vom Abend. Nach jeder richtigen Antwort kommen neue Beweisstücke dazu – sie sind mit „Neu“ markiert.", "You start with the documents from the evening. After each correct answer new evidence is added – it is marked “New”.")],
      [L("Vier Fragen, der Reihe nach", "Four questions, in order"), L("Wann wurde die Kühlhütte verriegelt, wer war es, in welcher Hütte ist die Kassa – und wie lautet ihr neuer Code?", "When was the cold store bolted, who did it, which hut is the box in – and what is its new code?")],
      [L("Hinweise kosten Zeit", "Hints cost time"), L(`Bis zu drei Hinweise pro Frage: +${HINT_PENALTY.join(", +")} Strafminuten. Jede falsche Antwort kostet +${WRONG_PENALTY} Minuten.`, `Up to three hints per question: +${HINT_PENALTY.join(", +")} penalty minutes. Every wrong answer costs +${WRONG_PENALTY} minutes.`)],
      [L("Vor der Kripo fertig sein", "Finish before the detectives"), L(`${LIMIT_MIN} Minuten, bis die Kriminalpolizei kommt. Die Uhr läuft auch danach weiter – deine Zeit plus Strafminuten ergibt deine Wertung.`, `${LIMIT_MIN} minutes until the detectives arrive. The clock keeps running after that – your time plus penalty minutes makes your score.`)],
      [L("Fair Play", "Fair play"), L("Keine KI, keine Suchmaschine. Der Fall ist mit Köpfchen lösbar.", "No AI, no search engine. The case can be solved with your wits.")],
    ],
  });

  // Aussagen: eine pro Person; wer beim Kinderpunsch aushalf, sagt das
  const STATE = {
    gerry: L("„Beim Lichtausschalten war ich bei meinem Maroniofen, wo sonst? Im Dunkeln brennt man sich am leichtesten. Mit dem Wimmer hab ich wegen dem Standgeld gestritten, ja. Das weiß eh der ganze Markt.“", "“When the lights went out I was at my chestnut stove, where else? You burn yourself easiest in the dark. Yes, I argued with Wimmer about the pitch fee. The whole market knows that.”"),
    elfi: L("„Ich bin bei meinen Lebkuchen geblieben – im Dunkeln wird gern einmal einer eingesteckt. Der Herr Wimmer war heute schon zweimal da und hat an meinen Herzerln herumgeschnüffelt. Was er gesucht hat, weiß ich nicht.“", "“I stayed with my gingerbread – in the dark things tend to walk off. Mr Wimmer had already been round twice today, sniffing at my hearts. I don’t know what he was looking for.”"),
    rosi: L("„Ich hab den Kessel ausgeschaltet und gewartet, bis der Baum angeht. Seit zwanzig Jahren steh ich am Kirchentor. Dass der Wimmer meinen Platz nächstes Jahr seinem Schwager geben will, sagt er jedem – nur mir nicht.“", "“I switched the kettle off and waited for the tree to come on. Twenty years I’ve stood at the church gate. Wimmer tells everyone he’s giving my pitch to his brother-in-law next year – everyone except me.”"),
    konrad: L("„Ich hab im Dunkeln meine Figuren zusammengehalten, die Hirten fallen gern um. Der Wimmer? Der wollte gestern wissen, wo ich mein Holz kaufe. Komische Frage für einen Marktmeister.“", "“I kept my figures together in the dark, the shepherds topple easily. Wimmer? Yesterday he wanted to know where I buy my wood. Odd question for a market manager.”"),
    jonas: L("„Ich bin der Engel, ich steh neben dem Christkind auf der Bühne. Im Dunkeln … war ich kurz weg, ja. Das hat aber nichts mit der Kassa zu tun, ehrlich. Und dass ich beim Fotostand Trinkgeld genommen hätte, ist ein Blödsinn.“", "“I’m the angel, I stand next to the Christkind on stage. In the dark … I was gone for a bit, yes. But that has nothing to do with the box, honestly. And that stuff about me taking tips from the photo stand is rubbish.”"),
  };
  const STATE_HELP = L("„Ab halb sechs hab ich beim Kinderpunsch ausgeholfen, die haben jemand gebraucht. Beim Lichtausschalten bin ich mit den Kindern vor zur Bühne und hab mit dem Handy geleuchtet, damit keins stolpert. Vier Minuten lang, bis der Baum anging.“",
    "“From half past five I was helping out at the children’s punch, they needed someone. When the lights went out I went to the stage with the kids and lit the way with my phone so none of them tripped. Four minutes, until the tree came on.”");

  function docs(c, N, v) {
    const R = roundOf(c, v), S = SUSPECTS[c], d = [];
    const rows = (list) => list.map((r) => `<tr>${r.map((x, i) => `<td${i === 0 ? ' class="mono"' : ""}>${x}</td>`).join("")}</tr>`).join("");
    const sec = (m, s) => `${fmt(m)}:${pad2(s)}`;
    // ----- Stufe 1 -----
    d.push({ id: "meldung", stage: 1, kind: L("Notiz", "Note"), kk: "Notiz", title: L("Meldung des Marktbüros", "Report from the market office"), html: `
<div class="letterhead"><strong>${L("Marktbüro Kerzenthal", "Kerzenthal market office")}</strong><span>${L("notiert von Petra Hold, Obfrau des Elternvereins, um", "noted by Petra Hold, chair of the parents’ association, at")} ${fmt(R.found + 2)}</span></div>
<p>${L(`Um ${fmt(R.found)} hat der Fleischer Gruber beim Zusperren in seiner Kühlhütte (gleich neben Hütte 12) unseren Marktmeister Sepp Wimmer gefunden. Der Riegel war außen zugeschoben – von innen kommt man nicht hin. Herr Wimmer war stark unterkühlt, ist aber ansprechbar und liegt jetzt warm eingepackt im Rettungswagen.`, `At ${fmt(R.found)}, Gruber the butcher found our market manager Sepp Wimmer when locking up his cold store (right next to hut 12). The bolt had been pushed across from the outside – you can’t reach it from inside. Mr Wimmer was badly chilled but can talk, and is now wrapped up warm in the ambulance.`)}</p>
<ul>
<li>${L("Die Spendenkassa unseres Punschstands (Hütte 24) ist weg. Darin ist der Erlös für das neue Kindergartendach. Ich war bei der Lichterzeremonie mit den Kindergartenkindern vorne an der Bühne, die Kassa stand allein in der Hütte.", "The donation box from our punch stall (hut 24) is gone. It holds the money for the nursery’s new roof. During the lighting ceremony I was at the front by the stage with the nursery children; the box was alone in the hut.")}</li>
<li>${L("Herrn Wimmers Generalschlüssel für alle 24 Hütten fehlt.", "Mr Wimmer’s master key for all 24 huts is missing.")}</li>
<li>${L("Laut Herrn Wimmer ist es während der vier dunklen Minuten passiert. Wer ihn gestoßen hat, hat er nicht gesehen – den Schlüsselbund hat man ihm dabei vom Gürtel gerissen.", "According to Mr Wimmer it happened during the four dark minutes. He didn’t see who shoved him – his key ring was torn off his belt in the process.")}</li>
</ul>
<div class="postit">${L(`${N}, die Kripo wird fragen: Wann, wer, wo ist die Kassa – und wie kriegen wir sie auf?`, `${N}, the detectives will ask: when, who, where is the box – and how do we get it open?`)} <span>– P. H.</span></div>` });

    d.push({ id: "programm", stage: 1, kind: L("Liste", "List"), kk: "Liste", title: L("Programmzettel des Abends", "Evening programme"), html: `
<div class="letterhead"><strong>${L("Christkindlmarkt Kerzenthal · Samstag", "Kerzenthal Christmas market · Saturday")}</strong><span>${L("Programm (an jeder Hütte ausgehängt)", "Programme (posted at every hut)")}</span></div>
<table class="grid"><tr><th>${L("Zeit", "Time")}</th><th>${L("Programmpunkt", "Event")}</th></tr>${rows([
      ["16:00", L("Markteröffnung, Marktbeleuchtung ein", "Market opens, market lights on")],
      ["17:30", L("Turmbläser vom Kirchturm", "Brass players on the church tower")],
      ["17:55", L("Gruppenfoto der Standler (für den Marktblog)", "Group photo of the stallholders (for the market blog)")],
      ["18:00", L("Lichterzeremonie: „Vier Minuten Finsternis“ – die Marktbeleuchtung geht aus, das Christkind entzündet den großen Baum", "Lighting ceremony: “Four Minutes Dark” – the market lights go out, the Christkind lights the big tree")],
      ["18:15", L("Kindergartenchor: „Stille Nacht“", "Nursery choir: “Silent Night”")],
      ["21:00", L("Marktschluss", "Market closes")],
    ])}</table>
<p class="small">${L("Wann genau es dunkel wird, entscheidet der Elektriker – das Christkind muss erst auf der Bühne stehen.", "When exactly it goes dark is up to the electrician – the Christkind has to be on stage first.")}</p>` });

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
<p class="small">${L("Die Kühlhütte des Fleischers hängt an einem eigenen Anschluss und lief durch.", "The butcher’s cold store has its own supply and kept running.")}</p>` });

    const FOTOS = [["christkind", R.D0], ["menge", R.t2], ["riegel", R.T], ["baum", R.D0 + 4]];
    const CAP = [
      L("Von Familie Lehner: „Das Christkind mit der Kerze, gleich nachdem es dunkel wurde.“", "From the Lehner family: “The Christkind with her candle, just after it went dark.”"),
      L("Von Sabine W.: „Alle mit Handylicht, total schön!“", "From Sabine W.: “Everyone with their phone lights, so lovely!”"),
      L("Von Tobias R.: „Wollte die Kühlhütte mit Schnee fotografieren – da war plötzlich eine Hand am Riegel. Hab mir nichts dabei gedacht.“", "From Tobias R.: “Wanted a photo of the cold store with the snow – suddenly there was a hand on the bolt. Didn’t think anything of it.”"),
      L("Von Oma Resi: „Und dann ging der Baum an!“", "From Granny Resi: “And then the tree came on!”"),
    ];
    d.push({ id: "fotos", stage: 1, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Besucherfotos aus dem Dunkeln", "Visitors’ photos from the dark"), html: `
<div class="letterhead"><strong>${L("Fotos aus der Messenger-Gruppe „Kerzenthal aktuell“", "Photos from the “Kerzenthal Now” messenger group")}</strong><span>${L("Die Zeitstempel der Gruppe zeigen nur, wann die Fotos verschickt wurden (alle nach 19:40)", "The group’s timestamps only show when the photos were sent (all after 19:40)")}</span></div>
${FOTOS.map(([k, t], i) => `${towerPhoto(en, k, t + R.off, i + 1)}<p class="small">${CAP[i]}</p>`).join("")}` });

    d.push({ id: "aushang", stage: 1, kind: L("Notiz", "Note"), kk: "Notiz", title: L("Aushang des Pfarramts", "Notice from the parish office"), html: `
<div class="letterhead"><strong>${L("Pfarramt Kerzenthal", "Kerzenthal parish office")}</strong><span>${L("Aushang an der Kirchentür", "Notice on the church door")}</span></div>
<p>${L("Liebe Pfarrgemeinde! Seit dem Sturm Anfang November geht unsere Turmuhr einige Minuten vor. Der Uhrmacher kommt leider erst nach Weihnachten. Bitte richten Sie sich bis dahin nicht nach der Turmuhr, sondern nach dem Läuten – das wird von Hand gezogen.", "Dear parishioners! Since the storm at the beginning of November our church clock has been running a few minutes fast. Unfortunately the clockmaker can’t come until after Christmas. Until then please go by the bells, not the tower clock – they are rung by hand.")}</p>
<p class="small">${L("Die Turmuhr ist abends beleuchtet und vom ganzen Kirchplatz aus zu sehen.", "The tower clock is lit in the evening and visible from the whole church square.")}</p>` });

    d.push({ id: "plan", stage: 1, kind: L("Liste", "List"), kk: "Liste", title: L("Marktplan mit allen Hütten", "Market plan with all huts"), html: `
${marketPlan(en)}
<p class="small">${Object.keys(HUTS).map((n) => `${n} ${hutName(n)}`).join(" · ")}</p>
<p class="small">${L("Die Hütten sind wie ein Adventkalender nummeriert – nicht der Reihe nach.", "The huts are numbered like an Advent calendar – not in order.")}</p>` });

    // ----- Stufe 2 -----
    d.push({ id: "kuehlhuette", stage: 2, kind: L("Befund", "Findings"), kk: "Befund", title: L("Fund in der Kühlhütte", "Found in the cold store"), html: `
<div class="letterhead"><strong>${L("Spurensicherung Kühlhütte", "Cold store – evidence")}</strong><span>${L("aufgenommen von", "recorded by")} ${N}</span></div>
${mugPhoto(en, R.M)}
<p>${L(`Auf dem Boden der Kühlhütte stand ein Punsch-Häferl vom Elternverein, noch halb voll. Das Motiv: ${MN(R.M)}. Herr Wimmer sagt, es ist nicht seines – er trinkt keinen Punsch.`, `On the floor of the cold store stood one of the parents’ association punch mugs, still half full. The motif: the ${MN(R.M)}. Mr Wimmer says it isn’t his – he doesn’t drink punch.`)}</p>
<p>${L("Aussage Sepp Wimmer: „Im Dunkeln hab ich im Licht von meinem Handy gesehen, wie jemand die Kassa aus dem Punschstand nimmt. Ich bin nach, bis zur Kühlhütte – dann ein Stoß, die Tür zu, der Riegel. Das Gesicht hab ich nicht gesehen, nur ein Häferl hat geklirrt.“", "Statement by Sepp Wimmer: “In the dark, by the light of my phone, I saw someone take the box out of the punch stall. I followed, as far as the cold store – then a shove, the door shut, the bolt. I didn’t see the face, I just heard a mug clink.”")}</p>
<p class="small">${L("Die Häferl gibt es nur gegen Pfand am Punschstand. Jedes Jahr hat ein eigenes Motiv: Stern 2022, Engel 2023, Krippe 2024, Schneemann 2025.", "The mugs are only available against a deposit at the punch stall. Every year has its own motif: star 2022, angel 2023, nativity stable 2024, snowman 2025.")}</p>` });

    d.push({ id: "gruppenfoto", stage: 2, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Gruppenfoto um 17:55", "Group photo at 17:55"), html: `
${groupPhoto(en, ORDER.map((k) => ({ key: k, motif: R.mug[k] })))}
<p>${L("Bildunterschrift im Marktblog: „Unsere Standler und der Engel stoßen auf die Lichterzeremonie an! V. l. n. r.:", "Caption on the market blog: “Our stallholders and the angel raise a toast to the lighting ceremony! L to r:")} ${ORDER.map((k) => SUSPECTS[k].name).join(", ")}.${L("“", "”")}</p>
<p class="small">${L("Laut Petra Hold hatte jede und jeder den ganzen Abend das eigene Häferl – das Pfand bekommt man nur für das eigene zurück.", "According to Petra Hold everyone kept their own mug all evening – you only get the deposit back for your own.")}</p>` });

    d.push({ id: "schichtplan", stage: 2, kind: L("Liste", "List"), kk: "Liste", title: L("Schichtplan der Standler", "Stallholders’ shift rota"), html: `
<div class="letterhead"><strong>${L("Marktbüro · Schichtplan Samstag", "Market office · Saturday rota")}</strong><span>${L("wer wann wo Dienst hatte", "who was on duty where and when")}</span></div>
<table class="grid"><tr><th>${L("Zeit", "Time")}</th><th>${L("Name", "Name")}</th><th>${L("Dienst", "Duty")}</th></tr>${rows(ORDER.flatMap((k) => {
      const own = OWN[k] ? hutTxt(OWN[k]) : L("Bühne, Begleitung des Christkinds", "stage, escorting the Christkind");
      return [["16:00–17:30", SUSPECTS[k].name, own], ["17:30–19:00", SUSPECTS[k].name, k === R.decoy ? `${hutTxt(KINDERPUNSCH)}, ${L("Aushilfe", "helping out")}` : own]];
    }))}</table>
<p class="small">${L("Wer beim Kinderpunsch aushilft, sperrt die eigene Hütte so lange zu.", "Anyone helping out at the children’s punch locks their own hut meanwhile.")}</p>` });

    d.push({ id: "aussagen", stage: 2, kind: L("Protokoll", "Record"), kk: "Protokoll", title: L("Kurzbefragung der Standler", "Short interviews with the stallholders"), html: `
<div class="letterhead"><strong>${L("Kurzbefragung", "Short interviews")}</strong><span>${L("notiert von", "noted by")} ${N}</span></div>
${ORDER.map((k) => `<p class="q">${SUSPECTS[k].name} – ${SUSPECTS[k].role}</p><p class="a">${k === R.decoy ? STATE_HELP : STATE[k]}</p>`).join("")}
<p class="q">Petra Hold – ${L("Obfrau des Elternvereins, Punschstand", "chair of the parents’ association, punch stall")}</p><p class="a">${L(`„Beim Lichtausschalten hab ich mit den Kindergartenkindern vorne an der Bühne gesungen. Die Aushilfe vom Kinderpunsch, Hütte ${KINDERPUNSCH}, stand die ganzen vier Minuten neben mir und hat mit dem Handy für die Kinder geleuchtet – keinen Augenblick weg. Wie die Person heißt, hab ich mir nicht gemerkt, ich kenn ja nicht alle Standler.“`, `“When the lights went out I was singing with the nursery children at the front by the stage. The person helping out at the children’s punch, hut ${KINDERPUNSCH}, stood next to me the whole four minutes lighting the way for the kids with their phone – not gone for a second. I didn’t catch their name, I don’t know all the stallholders.”`)}</p>` });

    d.push({ id: "engel", stage: 2, kind: L("Notiz", "Note"), kk: "Notiz", title: L("Wo war der Engel?", "Where was the angel?"), html: `
<div class="letterhead"><strong>${L("Notizen vom Bühnenrand", "Notes from the side of the stage")}</strong><span>${L("gesammelt von", "collected by")} ${N}</span></div>
<p>${L("Das Christkind (Lena, 16): „Mein Engel war im Dunkeln plötzlich weg! Ich bin allein mit der Kerze dagestanden. Als der Baum anging, war er wieder da und hat nach Rauch gerochen.“", "The Christkind (Lena, 16): “My angel suddenly vanished in the dark! I was standing there alone with my candle. When the tree came on he was back – and smelled of smoke.”")}</p>
<p>${L("Der Mesner: „Hinter der Sakristei liegen zwei frische Zigarettenstummel, voll mit Goldglitzer. Den Glitzer hat hier nur einer – an den Flügeln.“", "The sexton: “Behind the vestry there are two fresh cigarette ends, covered in gold glitter. Only one person here has that glitter – on his wings.”")}</p>
<p>${L("Jonas Kranz, darauf angesprochen: „Ja, okay, ich war eine rauchen. Bitte sagen Sie es nicht meiner Mama.“", "Jonas Kranz, when asked: “Yes, okay, I went for a smoke. Please don’t tell my mum.”")}</p>` });

    // ----- Stufe 3 -----
    const muellOrt = OWN[c] ? L(`hinter Hütte ${OWN[c]}`, `behind hut ${OWN[c]}`) : L("im Garderobenzelt hinter der Bühne", "in the dressing tent behind the stage");
    d.push({ id: "karton", stage: 3, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Karton aus dem Müll", "Cardboard from the rubbish"), html: `
<div class="letterhead"><strong>${L("Fundstück", "Find")}</strong><span>${L(`aus dem Müllsack von ${S.name}, ${muellOrt}`, `from ${S.name}’s rubbish bag, ${muellOrt}`)}</span></div>
${templateSvg(en, R.p, R.holes, { standalone: true })}
<p>${L("Ein Stück Karton von einer Lebkuchen-Schachtel, genau so breit wie drei Hütten auf dem Marktplan. Vier quadratische Löcher sind sauber ausgeschnitten, an der Oberkante ist eine Kerbe. Auf der Rückseite mit Bleistift: „Kerbe an den Turm“.", "A piece of cardboard from a gingerbread box, exactly as wide as three huts on the market plan. Four square holes have been neatly cut out, and there is a notch on the top edge. On the back, in pencil: “notch to the tower”.")}</p>
${schablone(en, "s2-" + c + v, R.p, R.holes)}` });

    d.push({ id: "geschlossen", stage: 3, kind: L("Notiz", "Note"), kk: "Notiz", title: L("Aushang: Am Wochenende geschlossen", "Notice: closed this weekend"), html: `
<div class="letterhead"><strong>${L("Marktbüro Kerzenthal", "Kerzenthal market office")}</strong><span>${L("Aushang am Infokasten, hängt seit Freitag", "Notice on the information board, up since Friday")}</span></div>
<table class="grid"><tr><th>${L("Hütte", "Hut")}</th><th>${L("Stand", "Stall")}</th></tr>${rows(R.closed.map((n) => [String(n), hutName(n)]))}</table>
<p class="small">${L("Diese Hütten bleiben das ganze Wochenende zu (Krankheit, Lieferprobleme). Sie sind versperrt, den Schlüssel hat nur der Marktmeister.", "These huts stay closed all weekend (illness, delivery problems). They are locked; only the market manager has the key.")}</p>` });

    d.push({ id: "schluessel", stage: 3, kind: L("Notiz", "Note"), kk: "Notiz", title: L("Nachtrag: Wo ist die Kassa?", "Addendum: where is the box?"), html: `
<div class="letterhead"><strong>${L("Nachtrag", "Addendum")}</strong><span>${L("Petra Hold", "Petra Hold")}</span></div>
<p>${L("In keiner offenen Hütte ist die Kassa, das haben die Standler selbst nachgeschaut. Mit Herrn Wimmers Generalschlüssel kommt man aber in jede versperrte Hütte.", "The box isn’t in any open hut – the stallholders checked themselves. But with Mr Wimmer’s master key you can get into any locked hut.")}</p>
<p>${L("Die Kripo hat angerufen: Wir sollen nicht alle Hütten aufbrechen, sondern genau eine öffnen lassen. Welche?", "The detectives rang: we’re not to break into every hut, but have exactly one opened. Which one?")}</p>` });

    // ----- Stufe 4 -----
    d.push({ id: "kassa", stage: 4, kind: L("Befund", "Findings"), kk: "Befund", title: L("Die Spendenkassa", "The donation box"), html: `
<div class="letterhead"><strong>${L(`Fund in Hütte ${R.hide}`, `Found in hut ${R.hide}`)}</strong><span>${L("aufgenommen von", "recorded by")} ${N}</span></div>
${keypad(en, R.keys)}
<p>${L(`Die Spendenkassa stand ganz hinten in Hütte ${R.hide}, unter einer Decke. Sie ist zu. Petra Hold: „Unser Code geht nicht mehr – jemand hat einen neuen eingestellt. Ich will vor der Kripo wissen, ob das Geld noch drin ist.“`, `The donation box was right at the back of hut ${R.hide}, under a blanket. It is locked. Petra Hold: “Our code doesn’t work any more – someone has set a new one. I want to know whether the money is still inside before the detectives arrive.”`)}</p>
<p class="small">${L("Auf vier Tasten liegt Staubzucker – wie von den Krapfen aus Hütte 13. Jede Ziffer kommt im Code nur einmal vor.", "Four keys are dusted with icing sugar – like the doughnuts from hut 13. Each digit appears only once in the code.")}</p>` });

    d.push({ id: "serviette", stage: 4, kind: L("Fundstück", "Find"), kk: "Fundstück", title: L("Serviette neben der Kassa", "Napkin next to the box"), html: `
${napkin(en, R.code)}
<p>${L("Eine Papierserviette vom Punschstand, zusammengeknüllt neben der Kassa. Mit Kugelschreiber ein Komet: Der Weg beginnt am Schweif, Pfeile zeigen die Richtung, und er endet am Stern.", "A paper napkin from the punch stall, crumpled up next to the box. In ballpoint, a comet: the path begins at the tail, arrows show the direction, and it ends at the star.")}</p>` });
    return d;
  }

  const MOTIVE = {
    gerry: L("Gerry schuldete der Gemeinde zwei Jahre Standgeld. Wimmer hatte ihm am Vormittag gesagt: Ohne Zahlung bis Montag ist die Maronihütte weg.", "Gerry owed the town two years’ pitch fees. That morning Wimmer had told him: no payment by Monday and the chestnut hut is gone."),
    elfi: L("Wimmer hatte herausgefunden, dass Elfis „hausgemachte“ Lebkuchen aus einer Fabrik kommen, und wollte sie vom Markt werfen.", "Wimmer had found out that Elfi’s “homemade” gingerbread comes from a factory, and was going to throw her off the market."),
    rosi: L("Nach zwanzig Jahren am Kirchentor sollte Rosis Platz an Wimmers Schwager gehen. Sie wollte ihn als Marktmeister blamieren.", "After twenty years at the church gate, Rosi’s pitch was going to Wimmer’s brother-in-law. She wanted to make a fool of him as market manager."),
    konrad: L("Konrads „handgeschnitzte“ Krippenfiguren kommen aus Fernost. Wimmer wusste es und hatte ihm eine Frist bis Weihnachten gesetzt.", "Konrad’s “hand-carved” nativity figures come from the Far East. Wimmer knew, and had given him until Christmas."),
    jonas: L("Jonas hat Schulden aus Handywetten. Wimmer hatte ihn erwischt, wie er Trinkgeld vom Christkind-Fotostand einsteckte, und wollte es nach dem Markt melden.", "Jonas has debts from betting on his phone. Wimmer had caught him pocketing tips from the Christkind photo stand and was going to report it after the market."),
  };
  function resolution(c, v) {
    const R = roundOf(c, v), S = SUSPECTS[c], D = SUSPECTS[R.decoy];
    const engel = c === "jonas"
      ? L("Die Zigarette hinter der Sakristei war echt – sie war Jonas’ Ausrede für die Minuten, in denen er verschwunden war.", "The cigarette behind the vestry was real – it was Jonas’s excuse for the minutes he was missing.")
      : L("Und der verschwundene Engel? Jonas Kranz rauchte heimlich hinter der Sakristei – peinlich, aber harmlos.", "And the vanishing angel? Jonas Kranz was having a secret smoke behind the vestry – embarrassing, but harmless.");
    const text = L(
      `Um ${fmt(R.D0)} – nicht pünktlich um 18:00, wie am Programmzettel – gingen am Kirchplatz die Lichter aus. ${S.name} nutzte die Finsternis und holte die Spendenkassa aus dem Punschstand. Sepp Wimmer sah im Licht seines Handys, wer mit der Kassa davonging, und lief nach. Bei der Kühlhütte stieß ${S.short} ihn hinein, riss ihm dabei den Generalschlüssel vom Gürtel und schob um ${fmt(R.T)} den Riegel vor – das zeigt Foto 3. Die Turmuhr darauf zeigt ${fmt(R.T + R.off)}, aber sie geht vor: Auf Foto 4 geht der Baum an, laut Stromprotokoll um ${fmt(R.D0 + 4)}, die Turmuhr zeigt dort ${fmt(R.D0 + 4 + R.off)} – also ${R.off} Minuten zu viel. In der Kühlhütte blieb ${S.short.endsWith("s") ? S.short + "’" : S.short + "s"} Häferl mit dem Motiv ${MN(R.M)} zurück. Dasselbe Motiv hielt beim Gruppenfoto auch ${D.name} – aber ${pron(R.decoy)} half ab 17:30 beim Kinderpunsch aus und stand laut Petra Hold die ganzen vier Minuten neben ihr. Mit Wimmers Generalschlüssel sperrte ${S.short} die geschlossene Hütte ${R.hide} (${hutName(R.hide)}) auf und versteckte die Kassa darin. Das Versteck hatte ${S.short} schon am Vortag ausgesucht – der Aushang mit den geschlossenen Hütten hing seit Freitag –, mit einer Schablone aus einem Lebkuchen-Karton: Kerbe an den Kirchturm, und die Löcher zeigen die Hütten im toten Winkel der Laternen – nur eine davon war am Wochenende zu. Dann stellte ${pron(c)} an der Kassa einen neuen Code ein: ${R.codeStr}, als Merkhilfe ein Komet auf der Serviette, vom Schweif bis zum Stern. Der Staubzucker auf den Tasten stammt von einem Krapfen aus Hütte 13. ${MOTIVE[c]} Ärger mit Wimmer hatten auch die anderen Standler – aber ihr Häferl stand nicht in der Kühlhütte. Die ausgelöste Sicherung am Glühweinstand um 17:41 hatte mit alldem nichts zu tun – der Kessel war zu groß fürs Netz. ${engel} Sepp Wimmer erholt sich im Krankenhaus, und die Kassa ist vollständig: Das Kindergartendach wird gebaut. ${S.short} sagt bei der Befragung nur: „Ich wollt ihn doch nur ein bisserl abkühlen lassen.“`,
      `At ${fmt(R.D0)} – not on the dot of 18:00 as the programme said – the lights went out on the church square. ${S.name} used the darkness to take the donation box from the punch stall. By the light of his phone, Sepp Wimmer saw someone walking off with it and followed. At the cold store ${S.short} shoved him inside, tore the master key off his belt and pushed the bolt across at ${fmt(R.T)} – that is photo 3. The tower clock on it shows ${fmt(R.T + R.off)}, but it runs fast: on photo 4 the tree comes on, at ${fmt(R.D0 + 4)} according to the power log, while the tower clock shows ${fmt(R.D0 + 4 + R.off)} – ${R.off} minutes too much. ${S.short}’s mug with the ${MN(R.M)} motif was left behind in the cold store. ${D.name} held the same motif in the group photo – but ${pron(R.decoy)} was helping out at the children’s punch from 17:30 and, according to Petra Hold, stood next to her for all four minutes. With Wimmer’s master key, ${S.short} unlocked closed hut ${R.hide} (${hutName(R.hide)}) and hid the box inside. ${S.short} had chosen the hiding place the day before – the notice of closed huts had been up since Friday – with a template cut from a gingerbread box: notch to the church tower, and the holes show the huts in the lamps’ blind spot – only one of them was closed that weekend. Then ${pron(c)} set a new code on the box: ${R.codeStr}, with a comet on the napkin as a reminder, from tail to star. The icing sugar on the keys came from a doughnut from hut 13. ${MOTIVE[c]} The other stallholders had their own trouble with Wimmer too – but it wasn’t their mug in the cold store. The fuse that tripped at the mulled-wine stall at 17:41 had nothing to do with any of it – the kettle was too big for the supply. ${engel} Sepp Wimmer is recovering in hospital, and the box is complete: the nursery roof will be built. When questioned, ${S.short} only says: “I just wanted him to cool off a bit.”`);
    return {
      culprit: S.name, text, item: hutTxt(R.hide),
      summary: L(`Täter/in: ${S.name} · Kühlhütte verriegelt um ${fmt(R.T)} · Kassa in Hütte ${R.hide} (${hutName(R.hide)}) · Code ${R.codeStr}`, `Culprit: ${S.name} · cold store bolted at ${fmt(R.T)} · box in hut ${R.hide} (${hutName(R.hide)}) · code ${R.codeStr}`),
    };
  }
  const NAMES = ["Sepp", "Wimmer", "Gerhard", "Gerry", "Pammer", "Elfi", "Wagenhofer", "Rosi", "Strobl", "Konrad", "Eibl", "Jonas", "Kranz", "Petra", "Hold", "Lena", "Gruber"];
  return { TITLE, UI, SUSPECTS, QUESTIONS, solution, HINTS, briefing, docs, resolution, NAMES, MOTIVE };
}

const DE = make("de");
export const { TITLE, UI, SUSPECTS, QUESTIONS, solution, HINTS, briefing, docs, resolution, NAMES } = DE;
export const MOTIVE_DE = DE.MOTIVE;
export { GRID as HUT_GRID, cellOf, MOTIFS };
