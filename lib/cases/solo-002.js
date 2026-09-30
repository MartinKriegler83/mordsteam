// Mordsteam Solo 002 – „Applaus für einen Toten“
// Ein/e Ermittler/in, 30 Minuten, drei Fragen nacheinander. Täter und Variante werden pro Durchgang ausgelost.
// Frage 1 (Womit?): Die Notärztin nennt ein Zeitfenster vor dem Zusammenbruch (22:12) – je Variante ein anderes,
//   dadurch ist jedes Mal ein anderer Gegenstand vergiftet.
// Frage 2 (Wer?): Fingerabdrücke auf dem vergifteten Gegenstand (3 Verdächtige) + Belege für das Zeitfenster,
//   in dem das Gift hineinkam. Nur der Täter hat für dieses Fenster keinen Beleg.
// Frage 3 (Code): Spindnummer des Täters (Achtung: Tausch) → Codewort aus dem Spindbuch → Handytastatur.
// Personalisiert ist nur der Spielername (N, bereits HTML-escaped).

export const ID = "solo-002";
export const TITLE = "Applaus für einen Toten";
export const LIMIT_MIN = 30;                 // bis die Polizei kommt
export const TRAIN_START = 22 * 60 + 15;     // Uhr im Theater beim Start: 22:15 (Name bleibt für die Oberfläche)
export const VARIANTS = 4;                   // Anzahl Varianten (je Durchgang eine andere)
export const UI = {
  clock: "Theater", until: "bis zur Polizei", late: "Polizei wartet", stamp: "APPLAUS", fb: "den Theaterfall",
  cert: "und den Täter überführt, bevor die Polizei im Theater eintraf.", caseNo: "SOLO 002",
  stages: { 2: "Neue Beweisstücke: Spuren und Belege", 3: "Neue Beweisstücke: der Spind" },
};

const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const pad2 = (n) => String(n).padStart(2, "0");
const fmt = (x) => `${pad2(Math.floor(x / 60) % 24)}:${pad2(x % 60)}`;
const COLLAPSE = hm("22:12");

export const SUSPECTS = {
  vera: { name: "Vera Lind", short: "Frau Lind", role: "Schauspielerin, heute Zweitbesetzung der Miranda", spind: 9, proof: "maske" },
  tobias: { name: "Tobias Grün", short: "Herr Grün", role: "Schauspieler, Zweitbesetzung des Prospero", spind: 7, proof: "pforte" },
  nina: { name: "Nina Kessler", short: "Frau Kessler", role: "Regieassistentin", spind: 12, proof: "pult" },
  paul: { name: "Paul Wendt", short: "Herr Wendt", role: "Obergarderobier, heute in der Kostümwerkstatt", spind: 3, proof: "maske" },
  felix: { name: "Felix Brandt", short: "Herr Brandt", role: "Requisiteur", spind: 15, proof: "pforte" },
};
export const CULPRITS = Object.keys(SUSPECTS);
const ORDER = ["vera", "tobias", "nina", "paul", "felix"];

// Was Adler heute zu sich genommen hat. t = Einnahme, win = wann das Gift hineinkommen konnte (bereitgestellt → genommen)
export const ITEMS = {
  tee: { name: "Ingwertee aus der Thermoskanne", t: "19:10" },
  spray: { name: "Halsspray", t: "19:25" },
  pokal: { name: "Pokal mit Traubensaft (Bankettszene)", t: "20:15", win: ["19:50", "20:08"], legit: ["felix"], others: ["Bühnentechniker M. Pichler"] },
  sekt: { name: "Sektglas bei der Intendantin (Pause)", t: "20:45", win: ["20:32", "20:43"], legit: [], others: ["Buffet I. Novak", "Dr. E. Kranz"] },
  bonbon: { name: "Honigbonbon aus der Schale in der Garderobe", t: "21:00", win: ["20:43", "20:57"], legit: ["tobias"], others: ["Ankleiderin L. Frisch"] },
  wasser: { name: "Wasserglas für den Monolog (Akt 2)", t: "21:35", win: ["21:10", "21:30"], legit: ["felix"], others: [] },
};
// Varianten: vergifteter Gegenstand und Fenster der Ärztin (Minuten vor dem Zusammenbruch)
const VAR = [
  { item: "pokal", lo: 105, hi: 125 },
  { item: "sekt", lo: 80, hi: 100 },
  { item: "bonbon", lo: 65, hi: 80 },
  { item: "wasser", lo: 30, hi: 45 },
];
const varOf = (v) => VAR[(v || 0) % VAR.length];

// Spinde: Nummer → Codewort (Handytastatur). Lind und Grün haben getauscht (Aushang noch alt).
const AUSHANG = [[1, "Richard Adler"], [3, "Paul Wendt"], [5, "Karl Moser"], [7, "Vera Lind"], [9, "Tobias Grün"], [12, "Nina Kessler"], [15, "Felix Brandt"]];
const WORDS = { 1: "LEAR", 3: "SAUM", 5: "GONG", 7: "HELD", 9: "OPER", 12: "TEXT", 15: "SEIL" };
const KEYS = { 2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ" };
export const keypad = (w) => w.split("").map((ch) => Object.keys(KEYS).find((k) => KEYS[k].includes(ch))).join("");

// ---------- Fragen ----------
const Q1_OPTS = ["tee", "spray", "pokal", "sekt", "bonbon", "wasser"];
export const QUESTIONS = [
  { key: "gift", nr: 1, type: "select", label: "Womit hat Richard Adler das Gift geschluckt?", hint: "Die Notärztin grenzt es zeitlich ein.",
    options: Q1_OPTS.map((k) => [k, ITEMS[k].name]) },
  { key: "taeter", nr: 2, type: "select", label: "Wer hat Richard Adler vergiftet?", hint: "Nur eine Person hatte die Gelegenheit.",
    options: CULPRITS.map((k) => [k, SUSPECTS[k].name]) },
  { key: "code", nr: 3, type: "code", label: "Mit welchem Zahlencode öffnet die Polizei den Spind des Täters?", hint: "Vier Ziffern, z. B. 1234" },
];
export function solution(c, v) {
  return { gift: varOf(v).item, taeter: c, code: keypad(WORDS[SUSPECTS[c].spind]) };
}

// ---------- Hinweise ----------
export const HINT_PENALTY = [1, 2, 3];
export const WRONG_PENALTY = 3;
export const HINTS = (v) => {
  const V = varOf(v), I = ITEMS[V.item];
  return {
    gift: [
      "Die Notärztin sagt, wie lange vor dem Zusammenbruch das Gift geschluckt wurde.",
      "Adler brach um 22:12 zusammen. Rechne das Fenster der Ärztin in Uhrzeiten um.",
      `Das Gift wurde zwischen ${fmt(COLLAPSE - V.hi)} und ${fmt(COLLAPSE - V.lo)} geschluckt. Was hat Adler genau in dieser Zeit zu sich genommen? Achtung: Hinstellen oder Auffüllen ist noch kein Schlucken.`,
    ],
    taeter: [
      "Auf dem vergifteten Gegenstand hat Dr. Roth Fingerabdrücke von drei Verdächtigen gefunden.",
      "Das Gift kam hinein, nachdem der Gegenstand bereitgestellt wurde und bevor Adler ihn nahm. Prüfe für diese Zeit einen Beleg bei jeder der drei Personen.",
      `Das Fenster ist ${I.win[0]} bis ${I.win[1]}. Nur eine der drei Personen hat dafür keinen Beleg. Eine Aussage allein ist kein Beleg.`,
    ],
    code: [
      "Der Code gehört zum Schloss, also zur Spindnummer – nicht zur Person.",
      "Lies den handschriftlichen Zettel am Aushang genau.",
      "Buchstaben wie auf der Handytastatur: ABC = 2, DEF = 3, GHI = 4, JKL = 5, MNO = 6, PQRS = 7, TUV = 8, WXYZ = 9.",
    ],
  };
};

// ---------- Einsatzauftrag ----------
export function briefing(N) {
  return {
    eyebrow: "Theater am Kanal · Wien · Premiere",
    title: "Applaus für einen <em>Toten</em>",
    text: `Es ist 22:15 Uhr. Premiere von Shakespeares „Der Sturm“, das Publikum hat gerade noch gejubelt. Richard Adler, der gefeierte Prospero, hat sich verbeugt – und ist hinter dem Vorhang zusammengebrochen. Die Ärztin aus Reihe 3 kann nichts mehr tun. Die Intendantin, Dr. Elisabeth Kranz, fasst dich am Arm: „${N}, Sie schreiben doch die Kritiken mit dem schärfsten Blick der Stadt. Die Polizei ist in einer halben Stunde da, das Haus ist abgesperrt. Bitte – sehen Sie sich das an.“`,
    steps: [
      ["Akte lesen", "Du startest mit den Unterlagen vom Abend. Nach jeder richtigen Antwort kommen neue Beweisstücke dazu – sie sind mit „Neu“ markiert."],
      ["Drei Fragen, der Reihe nach", "Womit wurde er vergiftet, wer war es – und mit welchem Code öffnet die Polizei den Spind des Täters?"],
      ["Hinweise kosten Zeit", `Bis zu drei Hinweise pro Frage: +${HINT_PENALTY.join(", +")} Strafminuten. Jede falsche Antwort kostet +${WRONG_PENALTY} Minuten.`],
      ["Vor der Polizei fertig sein", `${LIMIT_MIN} Minuten, bis die Polizei kommt. Die Uhr läuft auch danach weiter – deine Zeit plus Strafminuten ergibt deine Wertung.`],
      ["Fair Play", "Keine KI, keine Suchmaschine. Der Fall ist mit Köpfchen lösbar."],
    ],
  };
}

// ---------- Belege der Verdächtigen (je Durchgang) ----------
// Jede Person hat zwei feste Einträge (Abendbeginn, Schluss) und einen dritten, der vom Fenster abhängt:
// Unschuldige sind im Fenster nachweislich woanders, der Täter hat seinen dritten Eintrag knapp davor oder danach.
const BASE = {
  vera: [["19:05", "19:40"], ["21:40", "22:05"]],
  paul: [["19:32", "19:46"], ["21:45", "22:05"]],
  tobias: [["19:20", "19:28"], ["21:48", "21:56"]],
  felix: [["19:02", "19:12"], ["21:38", "21:45"]],
  nina: [["19:25", "19:46"], ["21:36", "22:12"]],
};
export function slots(c, v) {
  const [a, b] = ITEMS[varOf(v).item].win.map(hm);
  const out = {};
  for (const k of ORDER) {
    let third;
    if (k !== c) third = (ITEMS[varOf(v).item].legit || []).includes(k) && k === "felix" ? [a, b + 2] : [a - 3, b + 2];
    else third = a >= hm("20:30") ? [a - 22, a - 5] : [b + 5, b + 22];
    out[k] = [...BASE[k].map(([x, y]) => [hm(x), hm(y)]), third].sort((p, q) => p[0] - q[0]);
  }
  return out;
}
// Wer hat Abdrücke auf dem Gegenstand? Auf dem vergifteten: genau drei Verdächtige (Täter + zwei weitere).
export function prints(c, v) {
  const poisoned = varOf(v).item, res = {};
  for (const k of Q1_OPTS) {
    const I = ITEMS[k];
    let sus = [...(I.legit || [])];
    if (k === "spray") sus = ["vera"];
    if (k === poisoned) {
      if (!sus.includes(c)) sus.push(c);
      const start = ORDER.indexOf(c);
      for (let i = 1; sus.length < 3; i++) { const x = ORDER[(start + i * 2) % ORDER.length]; if (!sus.includes(x)) sus.push(x); }
    }
    res[k] = { sus, others: k === "tee" || k === "spray" ? ["Ankleiderin L. Frisch"] : I.others || [] };
  }
  return res;
}

// ---------- Beweisstücke ----------
export function docs(c, N, v) {
  const d = [], V = varOf(v), S = slots(c, v), P = prints(c, v);
  // ----- Stufe 1 -----
  d.push({ id: "fund", stage: 1, kind: "Notiz", title: "Bericht der Intendantin", html: `
<div class="letterhead"><strong>Theater am Kanal · Intendanz</strong><span>Dr. Elisabeth Kranz · notiert um 22:14 Uhr</span></div>
<p>22:10 Uhr Schlussapplaus. Richard Adler (Prospero) verbeugt sich dreimal, dann geht der Vorhang zu. <b>22:12 Uhr</b> bricht er hinter dem Vorhang zusammen. Frau Dr. Roth aus Reihe 3 ist sofort da – vergeblich.</p>
<ul>
<li>Die Bühnenpforte ist seit 22:12 gesperrt. Niemand hat das Haus seither verlassen.</li>
<li>In der Pause war Adler mit mir im Intendanzbüro. Um 20:32 hat Frau Novak vom Buffet Sekt und zwei Gläser hingestellt. Adler hat mich um 20:44 im Foyer abgeholt, wir sind hinauf, um 20:45 haben wir angestoßen. Um 20:55 ging er zurück in seine Garderobe.</li>
<li>Die Darsteller auf der Bühne und Adlers Ankleiderin Lotte Frisch (bei Adler oder bei den Umzügen, immer in Begleitung) waren nie unbeobachtet. Frei unterwegs waren hinter der Bühne nur fünf Personen – siehe Besetzungsliste.</li>
</ul>
<p class="sign">E. Kranz <span>· Intendantin</span></p>` });

  d.push({ id: "aerztin", stage: 1, kind: "Befund", title: "Befund der Ärztin aus Reihe 3", html: `
<div class="letterhead"><strong>Dr. Hanne Roth · Internistin</strong><span>Premierengast, Reihe 3 · Kurzbefund</span></div>
<p>Todesursache (vorläufig): ein Herzmittel aus Fingerhut, stark überdosiert. Pupillen, Puls und Übelkeit sprechen eindeutig dafür. Es wurde als Tropfen <b>geschluckt</b>, nicht gespritzt – keine Einstichstelle.</p>
<p>Zeitpunkt: Nach Dosis und Verlauf hat er es etwa <b>${V.lo} bis ${V.hi} Minuten vor dem Zusammenbruch</b> geschluckt. Früher oder später passt nicht zu den Symptomen.</p>
<p>Die Tropfen schmecken bitter – in etwas Süßem oder Kaltem merkt man sie kaum.</p>
<div class="postit">${N}, ich habe mir alles notiert, was wir wissen. Die Polizei wird fragen: womit, wer, und wo ist das Fläschchen? <span>– H. R.</span></div>` });

  d.push({ id: "besetzung", stage: 1, kind: "Liste", title: "Besetzung und Personal hinter der Bühne", html: `
<div class="letterhead"><strong>„Der Sturm“ · Premiere</strong><span>Theater am Kanal · Beginn 19:30 · Pause 20:35–21:05 · Ende 22:10</span></div>
<table class="grid"><tr><th>Name</th><th>Aufgabe heute</th></tr>
<tr><td>Richard Adler</td><td>Prospero (Opfer)</td></tr>
${ORDER.map((k) => `<tr><td>${SUSPECTS[k].name}</td><td>${SUSPECTS[k].role}</td></tr>`).join("")}
<tr><td>Karl Moser</td><td>Inspizient, den ganzen Abend am Inspizientenpult (von der Bühnenkamera erfasst)</td></tr></table>
<p class="small">Die fünf Personen zwischen Adler und Moser waren heute nicht auf der Bühne und konnten sich hinter der Bühne frei bewegen. Nur sie kommen in Frage.</p>` });

  d.push({ id: "garderobe", stage: 1, kind: "Notiz", title: "Garderobenbuch von Richard Adler", html: `
<div class="letterhead"><strong>Garderobe 1 · Richard Adler</strong><span>geführt von Ankleiderin L. Frisch</span></div>
<div class="notebook">
<p><span class="nb-date">19:10</span> Herr Adler trinkt seinen Ingwertee aus der eigenen Thermoskanne.</p>
<p><span class="nb-date">19:25</span> Halsspray, wie immer vor dem Auftritt. 19:28 zur Bühne.</p>
<p><span class="nb-date">20:35</span> Pause. Herr Adler kommt in die Garderobe, will seine Ruhe.</p>
<p><span class="nb-date">20:40</span> Bonbonschale mit frischen Honigbonbons aufgefüllt.</p>
<p><span class="nb-date">20:43</span> Herr Adler geht hinauf zur Intendantin. Garderobe bleibt offen, ich helfe beim Umzug der Chordamen.</p>
<p><span class="nb-date">20:57</span> Herr Adler zurück. <b>21:00</b> nimmt er zwei Honigbonbons – für die Stimme.</p>
<p><span class="nb-date">21:03</span> Zur Bühne, zweiter Teil.</p>
</div>` });

  d.push({ id: "inspizient", stage: 1, kind: "Protokoll", title: "Inspizientenbuch der Premiere", html: `
<div class="letterhead"><strong>Inspizientenbuch · „Der Sturm“</strong><span>K. Moser, Inspizient · nur Einträge zu Prospero und seinen Requisiten</span></div>
<table class="grid"><tr><th>Zeit</th><th>Eintrag</th></tr>
<tr><td class="mono">19:30</td><td>Vorstellungsbeginn, Prospero auf der Bühne</td></tr>
<tr><td class="mono">19:50</td><td>Requisite: F. Brandt füllt den Pokal mit Traubensaft, stellt ihn auf den Requisitentisch rechts</td></tr>
<tr><td class="mono">20:08</td><td>Umbau: Bühnentechnik holt den Pokal vom Tisch und stellt ihn auf die Festtafel</td></tr>
<tr><td class="mono">20:15</td><td>Bankettszene: Prospero trinkt aus dem Pokal</td></tr>
<tr><td class="mono">20:35</td><td>Pause</td></tr>
<tr><td class="mono">21:05</td><td>Zweiter Teil</td></tr>
<tr><td class="mono">21:10</td><td>Requisite: F. Brandt stellt Wasserkaraffe und Glas auf den Requisitentisch links</td></tr>
<tr><td class="mono">21:30</td><td>Prospero nimmt das Glas mit auf die Bühne</td></tr>
<tr><td class="mono">21:35</td><td>Großer Monolog: Prospero trinkt das Glas aus</td></tr>
<tr><td class="mono">22:10</td><td>Schlussapplaus</td></tr></table>
<p class="small">Auf der Bühne und am Inspizientenpult war niemand unbeobachtet. Die Requisitentische stehen in den dunklen Seitengassen – dort kommt jeder hin, der hinter der Bühne arbeitet.</p>` });

  // ----- Stufe 2 -----
  const names = (k) => [...P[k].sus.slice().sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y)).map((x) => SUSPECTS[x].name), ...P[k].others].join(", ") || "keine verwertbaren";
  d.push({ id: "spuren", stage: 2, kind: "Befund", title: "Fingerabdrücke – gesichert von Dr. Roth", html: `
<div class="letterhead"><strong>Fingerabdrücke</strong><span>Dr. H. Roth, mit Puder und Klebefilm gesichert</span></div>
<p>Ich habe Abdrücke von allem genommen, was Adler heute zu sich genommen hat, und sie mit den Kaffeebechern im Personalraum verglichen – jeder hat dort seinen eigenen, mit Namen. Adlers eigene Abdrücke lasse ich weg.</p>
<table class="grid"><tr><th>Gegenstand</th><th>Abdrücke von</th></tr>
${Q1_OPTS.map((k) => `<tr><td>${ITEMS[k].name}</td><td>${names(k)}</td></tr>`).join("")}</table>
<p class="small">Wichtig: Ein Abdruck zeigt nur, wer etwas angefasst hat – nicht, wann. Bei den Proben wandern Requisiten und Gläser durch viele Hände.</p>` });

  const STATE = {
    vera: "„Richard und ich waren zwölf Jahre ein Paar. Als er mich verlassen hat, hat er dafür gesorgt, dass ich hier nur noch Zweitbesetzung spiele. Heute saß ich die meiste Zeit in Bereitschaft in der Maske. Fragen Sie Frau Huber.“",
    tobias: "„Ja, wenn Adler ausfällt, spiele ich den Prospero. Er wollte mich zum Saisonende loswerden, das weiß jeder. Ich war in der Kantine und ein paar Mal draußen rauchen.“",
    nina: "„Die Fassung, die heute gespielt wurde, ist von mir. Im Programmheft steht ‚Fassung: Richard Adler‘. Ich saß fast den ganzen Abend am Lichtpult hinten im Saal.“",
    paul: "„Dreißig Jahre ziehe ich die Herren hier an, zwanzig davon Richard Adler. Dann hat er durchgesetzt, dass ich im Frühjahr in Pension muss. Heute war ich fast den ganzen Abend oben in der Kostümwerkstatt.“",
    felix: "„Adler hat mich letzte Woche vor dem ganzen Ensemble angebrüllt, wegen eines falschen Pokals, und meine Kündigung verlangt. Ich hab heute meine Arbeit gemacht – und bin zwischendurch rüber ins Außenlager.“",
  };
  d.push({ id: "aussagen", stage: 2, kind: "Protokoll", title: "Aussagen der fünf Verdächtigen", html: `
<div class="letterhead"><strong>Kurzbefragung nach dem Zusammenbruch</strong><span>notiert von Dr. E. Kranz</span></div>
${ORDER.map((k) => `<p class="q">${SUSPECTS[k].name} – ${SUSPECTS[k].role}</p><p class="a">${STATE[k]}</p>`).join("")}
<p class="small">Alle fünf haben der Abnahme ihrer Fingerabdrücke zugestimmt.</p>` });

  const rows = (list) => list.sort((p, q) => p[0] - q[0]).map((r) => `<tr>${r.slice(1).map((x, i) => `<td${i === 0 ? ' class="mono"' : ""}>${x}</td>`).join("")}</tr>`).join("");
  const maske = [
    ...S.vera.map(([x, y]) => [x, `${fmt(x)}–${fmt(y)}`, "Vera Lind", "Maske, in Bereitschaft"]),
    ...S.paul.map(([x, y]) => [x, `${fmt(x)}–${fmt(y)}`, "Paul Wendt", "Kostümwerkstatt, 2. Stock"]),
    [hm("19:00"), "19:00–19:24", "Chor (6 Personen)", "Maske"],
    [hm("20:50"), "20:50–21:02", "Statisterie (4 Personen)", "Maske, Nachschminken"],
  ];
  d.push({ id: "maske", stage: 2, kind: "Liste", title: "Anwesenheitsbuch Maske und Kostümwerkstatt", html: `
<div class="letterhead"><strong>Maske · Kostümwerkstatt</strong><span>geführt von Maskenbildnerin R. Huber · wer kommt, trägt sich ein, wer geht, auch</span></div>
<table class="grid"><tr><th>von–bis</th><th>Wer</th><th>Wo</th></tr>${rows(maske)}</table>
<p class="small">Maske und Kostümwerkstatt liegen im 2. Stock, weit weg von Bühne, Garderoben und Intendanz. Frau Huber war den ganzen Abend dort.</p>` });

  const pforte = [];
  for (const k of ["tobias", "felix"]) for (const [x, y] of S[k]) {
    pforte.push([x, fmt(x), SUSPECTS[k].name, k === "tobias" ? "raus (Rauchen)" : "raus (Außenlager)"]);
    pforte.push([y, fmt(y), SUSPECTS[k].name, "rein"]);
  }
  pforte.push([hm("19:40"), "19:40", "Blumenlieferung", "rein und raus"], [hm("21:20"), "21:20", "Feuerwehr, Brandwache", "Kontrollgang Hof"]);
  d.push({ id: "pforte", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Pfortenbuch der Bühnenpforte", html: `
<div class="letterhead"><strong>Bühnenpforte · Pfortenbuch</strong><span>Pförtner J. Wallner · jedes Verlassen und Betreten des Hauses</span></div>
<table class="grid"><tr><th>Zeit</th><th>Wer</th><th>Richtung</th></tr>${rows(pforte)}</table>
<p class="small">Wer draußen ist, ist draußen: Die Tür öffnet von außen nur der Pförtner. Das Außenlager liegt über die Straße.</p>` });

  const pult = [
    ...S.nina.map(([x, y]) => [x, `${fmt(x)}–${fmt(y)}`, "Nina Kessler"]),
    [hm("19:00"), "19:00–19:24", "Techniker J. Horak"],
  ];
  d.push({ id: "pult", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Lichtpult: Anmeldungen", html: `
<div class="letterhead"><strong>Lichtpult Saal · Bedieneranmeldung</strong><span>Das Pult im Zuschauerraum, Reihe 22 · Anmeldung per Chipkarte</span></div>
<table class="grid"><tr><th>angemeldet</th><th>Bedienerin / Bediener</th></tr>${rows(pult)}</table>
<p class="small">Das Pult lässt sich nur bedienen, solange jemand mit Karte angemeldet ist – und nur direkt am Pult. Ist niemand angemeldet, läuft das Licht automatisch nach Programm. Vom Saal nach hinten sind es gut fünf Minuten.</p>` });

  // ----- Stufe 3 -----
  d.push({ id: "flaeschchen", stage: 3, kind: "Notiz", title: "Nachtrag: Wo ist das Fläschchen?", html: `
<div class="letterhead"><strong>Nachtrag</strong><span>Dr. H. Roth und Dr. E. Kranz</span></div>
<p>Die Tropfen kamen aus einem kleinen braunen Fläschchen. Bei keinem der fünf haben wir es gefunden, und seit 22:12 hat niemand das Haus verlassen.</p>
<p>Der Pförtner hat um 22:20 gehört, wie im Personalgang ein Spind zugeschlagen wurde. Die Spinde sind mit Zahlenschlössern gesichert. Der Täter schweigt – aber Herr Wendt führt für alle ein Spindbuch, weil ständig jemand seinen Code vergisst.</p>
<p>Die Polizei will den Spind vor den Augen des Täters öffnen. Welcher Code?</p>` });

  d.push({ id: "spinde", stage: 3, kind: "Liste", title: "Aushang im Personalgang: Spinde", html: `
<div class="letterhead"><strong>Spindbelegung Personalgang</strong><span>Aushang, Stand letzte Woche</span></div>
<table class="grid"><tr><th>Spind</th><th>Name</th></tr>
${AUSHANG.map(([n, nm]) => `<tr><td class="mono">${n}</td><td>${nm}</td></tr>`).join("")}</table>
<div class="postit">Seit Montag getauscht: Frau Lind hat jetzt die 9, Herr Grün die 7 (die 7 ist näher an der Maske). Neuer Aushang folgt. <span>– P. W.</span></div>` });

  d.push({ id: "spindbuch", stage: 3, kind: "Beleg", title: "Das Spindbuch des Garderobiers", html: `
<div class="receipt"><div class="r-head">SPINDBUCH · P. WENDT</div>
${Object.keys(WORDS).map((n) => `Spind ${n} · Codewort ${WORDS[n]}`).join("<br>")}</div>
<p>Auf der ersten Seite steht: <i>„Codes als Wort notiert – jeder Buchstabe ist eine Ziffer wie auf der Handytastatur.“</i></p>
<table class="grid"><tr><th>Ziffer</th>${Object.keys(KEYS).map((k) => `<th class="mono">${k}</th>`).join("")}</tr>
<tr><td>Buchstaben</td>${Object.values(KEYS).map((x) => `<td>${x}</td>`).join("")}</tr></table>
<p class="small">Das Codewort gehört zum Schloss, also zur Spindnummer.</p>` });
  return d;
}

// ---------- Auflösung ----------
const HOW = {
  pokal: (p) => `gab ${p} die Tropfen in den Pokal mit Traubensaft, der ab 19:50 unbeobachtet auf dem Requisitentisch rechts stand – der süße Saft überdeckte den bitteren Geschmack`,
  sekt: (p) => `schlich ${p} ins Intendanzbüro, wo ab 20:32 der Sekt bereitstand, und gab die Tropfen in Adlers Glas – kalt und prickelnd schmeckt man sie kaum`,
  bonbon: (p) => `träufelte ${p} die Tropfen auf die frischen Honigbonbons in Adlers offener Garderobe, während er oben bei der Intendantin war – vor dem zweiten Teil nahm er immer zwei`,
  wasser: (p) => `gab ${p} die Tropfen in das Wasserglas, das ab 21:10 auf dem Requisitentisch links für den großen Monolog bereitstand`,
};
const CONF = {
  vera: (w, how) => `Vera Lind saß nicht die ganze Zeit in der Maske – ${w} steht sie nicht im Anwesenheitsbuch. In dieser Zeit ${how("sie")}. Die Tropfen waren ihr eigenes Herzmittel. Das Fläschchen legte sie in ihren Spind – die Nummer 9, seit dem Tausch mit Tobias Grün. „Zwölf Jahre hat er mir die Rollen genommen“, sagt sie. „Heute habe ich ihm den Schluss geschrieben.“`,
  tobias: (w, how) => `Tobias Grün sagt, er sei rauchen gewesen – doch laut Pfortenbuch war er ${w} im Haus. In dieser Zeit ${how("er")}. Er wollte, sagt er, nur, dass Adler bei der Premierenfeier ausfällt und er endlich den Prospero spielt. Das Fläschchen lag in seinem Spind – der Nummer 7, seit dem Tausch mit Vera Lind.`,
  nina: (w, how) => `Nina Kessler war ${w} nicht am Lichtpult angemeldet. In dieser Zeit ${how("sie")}. Adler hatte ihre Fassung als seine ausgegeben – „heute Abend hätte er sich für meine Worte verbeugt“, sagt sie. Das Fläschchen lag in ihrem Spind, Nummer 12.`,
  paul: (w, how) => `Paul Wendt war ${w} nicht in der Kostümwerkstatt – das Anwesenheitsbuch kennt ihn dort nur zu anderen Zeiten. In dieser Zeit ${how("er")}. Dreißig Jahre im Haus, und Adler schickte ihn in Pension. Das Fläschchen lag in seinem eigenen Spind, Nummer 3 – ausgerechnet der Mann mit dem Spindbuch.`,
  felix: (w, how) => `Felix Brandt war ${w} nicht im Außenlager – laut Pfortenbuch war er in dieser Zeit im Haus. Dabei ${how("er")}. Adler hatte ihn vor allen gedemütigt und seine Kündigung verlangt. Das Fläschchen lag in seinem Spind, Nummer 15.`,
};
export function resolution(c, v) {
  const V = varOf(v), I = ITEMS[V.item], w = `von ${I.win[0]} bis ${I.win[1]}`;
  const code = keypad(WORDS[SUSPECTS[c].spind]);
  return {
    culprit: SUSPECTS[c].name, text: CONF[c](w, HOW[V.item]), item: `Spind ${SUSPECTS[c].spind}, Code ${code}`,
    summary: `Täter/in: ${SUSPECTS[c].name} · Gift im: ${I.name} · Spind ${SUSPECTS[c].spind}, Code ${code}`,
  };
}
