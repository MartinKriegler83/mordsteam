// Mordsteam Friends 001 – „Letzte Runde auf der Hütte“
// 4–8 Spieler, jeder ermittelt am eigenen Gerät. Einer von ihnen ist (ausgelost) der Täter – niemand weiß es vorher.
// Die Gruppe (Besetzung, Täter, Zeitvariante) ist für alle gleich; jeder Spieler hat einen eigenen Durchgang.
// G = { players: [{ name (HTML-escaped), quirk, act, room }], culprit, tvar, beer }
// Aktivitäten zur Tatzeit: "karten" (Küche), "balkon" (Zeitraffer), "bett" (Fitness-Tracker).

export const ID = "friends-001";
export const TITLE = "Letzte Runde auf der Hütte";
export const LIMIT_MIN = 45;               // bis der Hubschrauber landet
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
  karten: { label: "kann beim Kartenspielen nicht verlieren", clip: "Watten mit Wutanfall", award: "Der Goldene Trumpf" },
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

// Verteilung der Aktivitäten nach Gruppengröße: [karten, balkon, bett]
export const MIX = { 4: [2, 1, 1], 5: [2, 2, 1], 6: [3, 1, 2], 7: [3, 2, 2], 8: [4, 2, 2] };

// Zufällige Aufstellung einer neuen Gruppe (rnd(n) → 0..n-1)
export function setup(n, rnd) {
  const acts = [];
  MIX[n].forEach((k, i) => { for (let j = 0; j < k; j++) acts.push(["karten", "balkon", "bett"][i]); });
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  shuffle(acts);
  const rooms = shuffle([...Array(n).keys()]).map((p, i) => ({ p, room: Math.floor(i / 2) + 1 })).sort((a, b) => a.p - b.p).map((x) => x.room);
  const culprit = rnd(n);
  const beerPool = acts.map((a, i) => i).filter((i) => acts[i] === "karten" && i !== culprit);
  return { acts, rooms, culprit, tvar: rnd(TIME_SHIFTS.length), beer: beerPool[rnd(beerPool.length)] };
}

// ---------- Zeitvarianten: der Tatblock 00:40–02:30 verschiebt sich um D Minuten ----------
export const TIME_SHIFTS = [0, -5, 7];   // Tatzeit 01:12 · 01:07 · 01:19
const pad2 = (n) => String(n).padStart(2, "0");
const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fmt = (x) => `${pad2(Math.floor((((x % 1440) + 1440) % 1440) / 60))}:${pad2(((x % 60) + 60) % 60)}`;
export function timer(v) {
  const D = TIME_SHIFTS[v || 0] || 0;
  return (t) => { const x = hm(t); return x >= 40 && x < 150 ? fmt(x + D) : t; };
}

// ---------- Fragen ----------
export const SPOTS = {
  stube_regal: { name: "Bücherregal in der Stube", area: "Stube" },
  stube_holz: { name: "Holzkorb neben dem Kachelofen, Stube", area: "Stube" },
  kueche_zucker: { name: "Zuckerdose im Küchenregal", area: "Küche" },
  flur_schuhe: { name: "Schuhschrank im Flur", area: "Flur" },
  balkon_trog: { name: "Blumentrog auf dem Balkon", area: "Balkon" },
  keller_ski: { name: "Skischuh im Skiraum", area: "Keller" },
  keller_kuehl: { name: "Kellerkühlschrank", area: "Keller" },
  og_geweih: { name: "Hinter dem Hirschgeweih im Gang, Obergeschoss", area: "Obergeschoss" },
  og_spuelkasten: { name: "Spülkasten im Bad, Obergeschoss", area: "Obergeschoss" },
  og_waesche: { name: "Wäschekorb im Gang, Obergeschoss", area: "Obergeschoss" },
  schuppen: { name: "Brennholzstapel im Holzschuppen", area: "draußen" },
  austrag: { name: "Ferdls Schreibtisch im Austragshäusl", area: "draußen" },
};
const HIDE = { karten: "flur_schuhe", balkon: "schuppen", bett: "og_geweih" };
const COMMON_SEARCHED = ["stube_regal", "stube_holz", "balkon_trog"];
// Je Variante gleich viele durchsuchte Orte. Wer später ins Bett ging, kam durch Flur und Obergeschoss – deshalb sind dort
// bei Kartenrunde und Balkon alle Orte schon durchsucht, außer dem, wo die Karte wirklich liegt.
const SEARCHED = { karten: ["kueche_zucker", "og_geweih", "og_spuelkasten", "og_waesche"], balkon: ["flur_schuhe", "og_geweih", "og_spuelkasten", "og_waesche"], bett: ["flur_schuhe", "kueche_zucker", "og_spuelkasten", "og_waesche"] };

export function questions(G) {
  return [
    { key: "zeit", nr: 1, type: "time", label: "Um wie viel Uhr stand der Täter am Bedienteil der Sauna?", hint: "Uhrzeit, z. B. 23:45" },
    { key: "taeter", nr: 2, type: "select", label: "Wer hat Ferdl in der Sauna eingesperrt?", hint: "Nur eine Person hatte die Gelegenheit.", options: G.players.map((p, i) => ["p" + i, p.name]) },
    { key: "versteck", nr: 3, type: "select", label: "Wo ist die Speicherkarte versteckt?", hint: "Loisl darf nur einen Ort öffnen, bevor die Bergrettung kommt. Wähle genau.", options: Object.keys(SPOTS).map((k) => [k, SPOTS[k].name]) },
  ];
}
export function solution(G) {
  return { zeit: timer(G.tvar)("01:12"), taeter: "p" + G.culprit, versteck: HIDE[G.players[G.culprit].act] };
}

export const HINT_PENALTY = [2, 3, 5];
export const WRONG_PENALTY = 3;
export function hints(G) {
  const s = timer(G.tvar);
  return {
    zeit: [
      "Das Bedienteil hängt außen neben der Saunatür.",
      "Wenn Ferdl selbst die Temperatur ändert, muss er aus der Sauna – das sieht man an der Saunatür.",
      "Gesucht ist die einzige Änderung am Bedienteil, bei der die Saunatür zu bleibt.",
    ],
    taeter: [
      "Prüfe jede Aussage gegen den Punkteblock, den Zeitraffer oder die Schlafdaten.",
      "Eine Aussage allein ist kein Beleg. Die Hütten-App zeigt dir, aus welcher Richtung der Täter kam.",
      `Nur eine Person hat für ${s("01:10")} bis ${s("01:20")} keinen Beleg.`,
    ],
    versteck: [
      "Die Karte wurde erst aus der Kamera genommen, als der Täter schon im Keller gewesen war. Wo er vorher war, scheidet aus.",
      "Hütten-App und Spuren im Neuschnee zeigen, wohin der Täter nach der Kamera ging.",
      "Streiche, was schon durchsucht oder abgesperrt ist und wo in der Nacht Zeugen saßen. Auf seinem Weg bleibt genau ein Ort übrig.",
    ],
  };
}

// ---------- Einsatz ----------
export function briefing(N) {
  return {
    eyebrow: "Hütte „Zirbenblick“ · 1.640 m · Samstag",
    title: "Letzte Runde auf der <em>Hütte</em>",
    text: `Samstag, 07:40. Loisl, der Nachbar, hämmert an die Tür: „Der Ferdl! In der Sauna! Tot!“ Draußen liegt ein halber Meter Neuschnee, die Straße ist zu. Die Bergrettung landet um 08:25 mit dem Hubschrauber – bis dahin will Loisl einen Namen. ${N}, du weißt, was gestern beim Raclette passiert ist: Ferdl hat euch den Trailer zu seiner neuen Folge gezeigt – mit einem heimlich gefilmten Clip von jedem von euch. Jeder hatte einen Grund. Und einer von euch war's.`,
    steps: [
      ["Akte lesen", "Du startest mit den Unterlagen vom Fundort. Nach jeder richtigen Antwort kommen neue Beweisstücke dazu – sie sind mit „Neu“ markiert."],
      ["Drei Fragen, der Reihe nach", "Tatzeit, Täter, Versteck der Speicherkarte. Die nächste Frage wird frei, sobald die vorige gelöst ist."],
      ["Hinweise kosten Zeit", `Bis zu drei Hinweise pro Frage: +${HINT_PENALTY.join(", +")} Strafminuten. Jede falsche Antwort kostet +${WRONG_PENALTY} Minuten.`],
      ["Jeder ermittelt für sich", `${LIMIT_MIN} Minuten bis zum Hubschrauber. Deine Zeit plus Strafminuten ergibt deinen Platz in der Rangliste.`],
      ["Dicht halten", "Die Auflösung kommt für alle gleichzeitig. Wer anderen etwas verrät, verschenkt den eigenen Vorsprung."],
    ],
  };
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
const who = (G, act) => G.players.map((p, i) => ({ ...p, i })).filter((p) => p.act === act);

// ---------- Beweisstücke ----------
// stage: ab welcher Stufe sichtbar (1 = Start, 2 = nach Frage 1, 3 = nach Frage 2). me = Index des Lesers.
export function docs(G, me) {
  const s = timer(G.tvar), d = [];
  const C = G.players[G.culprit], cAct = C.act;
  const karten = who(G, "karten"), balkon = who(G, "balkon"), bett = who(G, "bett");
  const beer = G.players[G.beer];

  // ----- Stufe 1: Fundort -----
  d.push({ id: "fund", stage: 1, kind: "Notiz", title: "Fundbericht von Loisl", html: `
<div class="letterhead"><strong>Was ich heute früh gefunden habe</strong><span>Alois „Loisl“ Wegscheider, Nachbar · aufgeschrieben 07:48</span></div>
<p>07:40 wollt ich dem Ferdl die Semmeln bringen. Im Austragshäusl war er nicht, aber die Notruf-Lampe von der Sauna hat geblinkt. Also rüber in die Gästehütte und in den Keller.</p>
<ul>
<li>Die Saunatür war von außen mit dem Holzriegel zu. Den Riegel hat der Ferdl selber eingebaut, „für die Enkerl“.</li>
<li>Am Bedienteil neben der Tür: „AUS – Sicherheitsabschaltung · letzter Sollwert 110 °C“.</li>
<li>Der Ferdl liegt drin auf der oberen Bank, in der Badehose. Kein Puls. Innen an der Tür Kratzspuren.</li>
<li>Im Vorraum: sein Handy, sein Bademantel, eine halbe Flasche Zirbenschnaps.</li>
<li>Die Vlog-Kamera in der Stube ist aus. Im Schnee liegen seit Mitternacht gut 50 Zentimeter.</li>
</ul>
<p class="sign">Loisl <span>· Nachbar, hat einen Schlüssel fürs Austragshäusl</span></p>` });

  d.push({ id: "aerztin", stage: 1, kind: "Befund", title: "Kurzbefund der Bergrettungsärztin", html: `
<div class="letterhead"><strong>Dr. Verena Hofer · Bergrettung</strong><span>Befund per Videocall, 07:55 · vorläufig</span></div>
<p>Todesursache: Überhitzung bei deutlich Alkohol im Blut. Bei über 100 Grad verliert man nach einer knappen halben Stunde das Bewusstsein.</p>
<p>Todeszeitpunkt (geschätzt): zwischen ${s("01:40")} und ${s("02:40")} Uhr.</p>
<p>Die Kratzspuren zeigen: Er war wach, als er merkte, dass die Tür nicht aufgeht. Jemand hat ihn eingesperrt und die Hitze hochgedreht.</p>
<div class="postit">Bitte niemand abreisen lassen. Ich lande um 08:25 – bis dahin brauch ich von Ihnen einen Namen. <span>– V. H.</span></div>` });

  d.push({ id: "sauna", stage: 1, kind: "Systemauszug", kk: "Systemauszug", title: "Protokoll der Saunasteuerung", html: `
<div class="letterhead"><strong>SaunaControl · Kabine Gästehütte</strong><span>Ereignisprotokoll aus Ferdls App · Freitag 23:00 bis Samstag 07:45</span></div>
<table class="grid"><tr><th>Zeit</th><th>Ereignis</th><th>Quelle</th></tr>
<tr><td class="mono">23:40</td><td>Sauna ein · Sollwert 80 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">00:05</td><td>Sollwert 80 → 90 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">00:06</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr>
<tr><td class="mono">00:06</td><td>Saunatür geschlossen</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("00:44")}</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("00:45")}</td><td>Sollwert 90 → 95 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">${s("00:47")}</td><td>Saunatür geschlossen</td><td>Türkontakt</td></tr>
<tr><td class="mono">${s("01:12")}</td><td>Sollwert 95 → 110 °C</td><td>Bedienteil</td></tr>
<tr><td class="mono">${s("01:24")}</td><td>Notruf-Taster gedrückt</td><td>Taster innen</td></tr>
<tr><td class="mono">${s("01:27")}</td><td>Notruf-Taster gedrückt</td><td>Taster innen</td></tr>
<tr><td class="mono">${s("01:31")}</td><td>Notruf-Taster gedrückt</td><td>Taster innen</td></tr>
<tr><td class="mono">05:40</td><td>Sicherheitsabschaltung nach 6 Stunden</td><td>Steuerung</td></tr>
<tr><td class="mono">07:41</td><td>Saunatür geöffnet</td><td>Türkontakt</td></tr></table>
<p class="small">Das Bedienteil hängt außen neben der Saunatür, innen gibt es nur den Notruf-Taster. Er klingelt im Austragshäusl. Der Holzriegel hat keinen Sensor.</p>` });

  const byRoom = [1, 2, 3, 4].map((r) => G.players.filter((p) => p.room === r).map((p) => p.name));
  d.push({ id: "plan", stage: 1, kind: "Liste", title: "Hüttenplan und Zimmerbelegung", html: `
<div class="letterhead"><strong>Hütte „Zirbenblick“</strong><span>Ferdls Gästeinfo, am Kühlschrank · Zimmer laut Belegung</span></div>
<table class="grid"><tr><th>Zimmer (Obergeschoss)</th><th>Belegung</th></tr>
${byRoom.map((names, i) => `<tr><td>Zimmer ${i + 1}</td><td>${names.length ? list(names) : "frei"}</td></tr>`).join("")}</table>
<h3>So ist die Hütte aufgebaut</h3>
<ul>
<li>Obergeschoss: vier Zimmer, Bad, Gang. Die Holztreppe führt hinunter in den Flur.</li>
<li>Erdgeschoss: Flur mit Haustür und Schuhschrank. Vom Flur gehen Stube, Küche und die Kellertreppe ab.</li>
<li>Die Stube hat den Kachelofen, Ferdls Vlog-Kamera und die Tür zum Balkon. Vom Balkon führt eine Außentreppe in den Garten.</li>
<li>Keller: Sauna mit Vorraum, Skiraum, Kellerkühlschrank.</li>
<li>Draußen: Holzschuppen (offen), Ferdls Austragshäusl (30 m, abgesperrt).</li>
</ul>
<p class="small">Ferdls „Smart-Hütte“: Bewegungsmelder an der Treppe, in der Stube und im Keller, ein Kontakt an der Haustür. Im Flur, in der Küche und im Obergeschoss gibt es keine Sensoren.</p>` });

  const said = (p) => {
    const ich = p.act === "karten" ? "Ich hab mit den anderen in der Küche Watten gespielt, bis nach halb zwei. Ich bin die ganze Zeit am Tisch gesessen."
      : p.act === "balkon" ? "Wir haben uns mit Decken auf den Balkon gesetzt und einen Zeitraffer vom Sternenhimmel gemacht. Ich war die ganze Zeit draußen auf der Bank."
      : "Ich bin um halb eins ins Bett und hab durchgeschlafen, bis Loisl geklopft hat.";
    const bier = p === beer ? " Kurz vor eins hab ich Bier aus dem Kellerkühlschrank geholt – da hat der Ferdl in der Sauna noch gesungen." : "";
    return ich + bier;
  };
  d.push({ id: "aussagen", stage: 1, kind: "Protokoll", title: "Was jeder über die Nacht sagt", html: `
<div class="letterhead"><strong>Kurzbefragung in der Stube</strong><span>notiert von Loisl, 07:50 · „Wo wart ihr zwischen halb eins und zwei?“</span></div>
${G.players.map((p, i) => `<p class="q">${p.name}, Zimmer ${p.room}${i === me ? " (deine Aussage)" : ""}</p>
<p class="a">„${said(p)}“</p>`).join("\n")}
<p class="small">Gestern Abend beim Raclette hat Ferdl allen den Trailer zu seiner neuen Folge gezeigt. Seitdem hatte jeder hier einen Grund, sauer auf ihn zu sein.</p>` });

  // ----- Stufe 2: Alibis -----
  const rounds = ["00:40", "00:49", "01:02", "01:11", "01:20", "01:29", "01:38", "01:47"];
  const cardAway = cAct === "karten" ? [3, 4] : [];
  d.push({ id: "karten", stage: 2, kind: "Beleg", title: "Punkteblock der Kartenrunde", html: `
<div class="letterhead"><strong>Watten in der Küche</strong><span>Punkteblock vom Küchentisch · eine Runde dauert etwa neun Minuten</span></div>
<table class="grid"><tr><th>Runde</th><th>Beginn</th><th>Am Tisch</th></tr>
${rounds.map((t, r) => {
    const at = karten.filter((p) => !(cardAway.includes(r) && p.i === G.culprit)).map((p) => p.name);
    const note = at.length < karten.length ? (at.length === 1 ? " (allein, Patience)" : ` (zu ${at.length === 2 ? "zweit" : "dritt"})`) : "";
    return `<tr><td>${r + 1}</td><td class="mono">${s(t)}</td><td>${list(at)}${note}</td></tr>`;
  }).join("")}</table>
<p class="small">Notiz am Rand: „Nach Runde 2 Pause – ${beer.name} holt Bier aus dem Keller.“ In die Küche kam die ganze Nacht niemand außer uns. Nach Runde 8 ab ins Bett.</p>` });

  const frames = ["00:48", "00:54", "01:00", "01:06", "01:12", "01:18", "01:24", "01:30", "01:36", "01:42"];
  const balkonAway = cAct === "balkon" ? [4, 5, 6] : [];
  d.push({ id: "balkon", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Zeitraffer vom Balkon", html: `
<div class="letterhead"><strong>Zeitraffer „Sternenhimmel Zirbenblick“</strong><span>Handy auf dem Stativ, ein Bild alle 6 Minuten · Bank und Himmel im Bild</span></div>
<table class="grid"><tr><th>Bild</th><th>Zeit</th><th>Auf der Bank zu sehen</th></tr>
${frames.map((t, f) => {
    const on = balkon.filter((p) => !(balkonAway.includes(f) && p.i === G.culprit)).map((p) => p.name);
    return `<tr><td>${String(f + 1).padStart(2, "0")}</td><td class="mono">${s(t)}</td><td>${on.length ? list(on) : "niemand, nur Decken"}</td></tr>`;
  }).join("")}</table>
<p class="small">Die Zeit stammt vom Handy, das Stativ stand die ganze Zeit an derselben Stelle. Nach Bild 10 haben wir abgebaut und sind durch die Stube rein und gleich ins Bett.</p>` });

  const sleepRows = (p) => p.i === G.culprit && cAct === "bett"
    ? [["00:35", "01:05", "leicht", "0"], ["01:05", "01:25", "wach", "318"], ["01:25", "02:30", "leicht", "0"]]
    : [["00:35", "00:55", "leicht", "0"], ["00:55", "01:45", "tief", "0"], ["01:45", "02:30", "leicht", "0"]];
  d.push({ id: "tracker", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Schlafdaten der Fitness-Tracker", html: `
<div class="letterhead"><strong>Schlaf-Export</strong><span>freiwillig vorgezeigt von allen, die im Bett waren · 00:30 bis 02:30</span></div>
<table class="grid"><tr><th>Wer</th><th>von</th><th>bis</th><th>Phase</th><th>Schritte</th></tr>
${bett.map((p) => sleepRows(p).map((r) => `<tr><td>${p.name}</td><td class="mono">${s(r[0])}</td><td class="mono">${s(r[1])}</td><td>${r[2]}</td><td class="mono">${r[3]}</td></tr>`).join("")).join("")}</table>
<p class="small">Der Tracker erkennt „wach“ an Puls und Bewegung. Schritte zählt er nur beim Gehen.</p>` });

  // Hütten-App: gemeinsame Ereignisse + Weg des Täters (je Aktivität gleich viele Zeilen)
  const ev = [];
  const e = (t, src, what) => ev.push([t, src, what]);
  e("23:35", "Haustür", "geöffnet (Ferdl kommt zur Sauna)");
  e("00:30", "Treppe", "Bewegung");
  e("00:45", "Stube", "Bewegung");
  e("00:58", "Keller", "Bewegung");
  e("01:00", "Keller", "Bewegung");
  if (cAct === "karten") { e("01:11", "Keller", "Bewegung"); e("01:14", "Keller", "Bewegung"); e("01:19", "Stube", "Bewegung"); e("01:20", "Stube", "Bewegung"); }
  if (cAct === "balkon") { e("01:09", "Stube", "Bewegung"); e("01:11", "Keller", "Bewegung"); e("01:14", "Keller", "Bewegung"); e("01:19", "Stube", "Bewegung"); }
  if (cAct === "bett") { e("01:09", "Treppe", "Bewegung"); e("01:11", "Keller", "Bewegung"); e("01:19", "Stube", "Bewegung"); e("01:21", "Treppe", "Bewegung"); }
  e("01:19", "Kamera Stube", "Speicherkarte entfernt – Aufnahme gestoppt");
  e("01:46", "Stube", "Bewegung");
  e("01:52", "Treppe", "Bewegung");
  e("02:01", "Treppe", "Bewegung");
  e("07:40", "Haustür", "geöffnet");
  const key = (t) => { const x = hm(s(t)); return x < 12 * 60 ? x + 1440 : x; };
  ev.sort((a, b) => key(a[0]) - key(b[0]));
  d.push({ id: "app", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Protokoll der Hütten-App", html: `
<div class="letterhead"><strong>Smart-Hütte Zirbenblick</strong><span>Ferdls App · Bewegungsmelder, Haustür, Kamera · Freitag 23:00 bis 07:45</span></div>
<table class="grid"><tr><th>Zeit</th><th>Sensor</th><th>Ereignis</th></tr>
${ev.map(([t, src, what]) => `<tr><td class="mono">${s(t)}</td><td>${src}</td><td>${what}</td></tr>`).join("")}</table>
<p class="small">Ein Bewegungsmelder meldet sich höchstens einmal pro Minute. Wer die Treppe benutzt, kommt aus dem Obergeschoss oder geht hinauf. Die Balkontür liegt in der Stube.</p>` });

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
<p>Auf der Karte ist die ganze Folge 48. Und vermutlich auch, wer in der Nacht durch die Stube ging.</p>
<p>In euren Taschen und Koffern ist sie nicht, die haben wir alle durchgeschaut. Sie muss irgendwo in der Hütte oder draußen stecken. Ich darf vor der Bergrettung genau einen Ort aufmachen – sagt mir, wo.</p>` });

  const tracks = [
    ["Von der Straße zum Austragshäusl, dann zur Haustür", "frisch, scharfe Ränder", "Loisl, heute früh"],
    ["Quer über den Hof zum Holzschuppen", "Tierspur, fast zugeschneit", "ein Fuchs, laut Loisl"],
    cAct === "balkon"
      ? ["Vom Balkon die Außentreppe hinunter zum Holzschuppen und zurück", "halb zugeschneit", "unbekannt"]
      : ["Unter dem Balkon", "keine Fußspuren, nur Schnee vom Geländer", "–"],
  ];
  d.push({ id: "schnee", stage: 3, kind: "Liste", title: "Spuren im Neuschnee", html: `
<div class="letterhead"><strong>Spuren rund um die Hütte</strong><span>Loisls Rundgang, 08:00 · es schneite von 00:30 bis 03:10</span></div>
<table class="grid"><tr><th>Wo</th><th>Zustand</th><th>Von wem</th></tr>
${tracks.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table>
<p class="small">Zur Einordnung: Eine Spur von etwa halb zwei wäre am Morgen halb zugeschneit, eine von vor halb eins gar nicht mehr zu sehen. Durch die Haustür ging in der Nacht niemand hinaus.</p>` });

  const searched = [...COMMON_SEARCHED, ...SEARCHED[cAct]];
  d.push({ id: "verstecke", stage: 3, kind: "Liste", title: "Mögliche Verstecke", html: `
<div class="letterhead"><strong>Wo die Karte sein könnte</strong><span>Loisls Liste · „durchsucht“ heißt: schon nachgeschaut, leer</span></div>
<table class="grid"><tr><th>Ort</th><th>Bereich</th><th>Zugang</th><th>Schon durchsucht?</th></tr>
${Object.entries(SPOTS).map(([k, x]) => `<tr><td>${x.name}</td><td>${x.area}</td><td>${k === "austrag" ? "abgesperrt, Schlüssel nur Loisl" : "offen"}</td><td>${searched.includes(k) ? "ja, leer" : "–"}</td></tr>`).join("")}</table>
<p class="small">Mehr hat Loisl nicht geschafft. Den Rest öffnet er nur einmal – für den Ort, den du ihm nennst.</p>` });

  return d;
}

// ---------- Auflösung ----------
export function resolution(G) {
  const s = timer(G.tvar), C = G.players[G.culprit], clip = clipOf(C, G);
  const t = {
    karten: `${C.name} stand nach der dritten Runde auf – „kurz aufs Klo“. In Wahrheit ging ${C.name} in den Keller, schob um ${s("01:12")} den Riegel vor und drehte die Sauna auf 110 Grad. Um ${s("01:19")} holte ${C.name} die Speicherkarte aus der Kamera in der Stube und versteckte sie auf dem Rückweg im Schuhschrank im Flur. Zwei Runden später saß ${C.name} wieder am Küchentisch, als wäre nichts gewesen.`,
    balkon: `${C.name} verließ den Balkon, angeblich um Decken zu holen, ging durch die Stube in den Keller und schob um ${s("01:12")} den Riegel vor – 110 Grad. Um ${s("01:19")} war die Speicherkarte aus der Kamera weg. ${C.name} lief über die Außentreppe zum Holzschuppen und steckte sie in den Brennholzstapel. Der Zeitraffer hat drei Bilder lang eine leere Stelle auf der Bank – und im Schnee blieb eine halb zugeschneite Spur.`,
    bett: `${C.name} lag nicht im Bett. Um ${s("01:09")} schlich ${C.name} die Treppe hinunter, schob um ${s("01:12")} den Riegel vor und drehte die Sauna auf 110 Grad. Um ${s("01:19")} holte ${C.name} die Speicherkarte aus der Kamera und versteckte sie oben im Gang hinter dem Hirschgeweih. Der Fitness-Tracker hat mitgezählt: 318 Schritte in zwanzig Minuten „Schlaf“.`,
  }[C.act];
  return { culprit: C.name, text: `${t} Das Motiv: Ferdl wollte am Sonntag „${clip}“ hochladen.`, item: SPOTS[HIDE[C.act]].name };
}
