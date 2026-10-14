// Mordsteam Special 001 – „Süßes oder Saures“ (Halloween-Special, Solo-Format ohne KI, 13.10.2026)
// Ein/e Ermittler/in, 50 Minuten, vier Fragen nacheinander. Täter, Tatzeit und Versteck wechseln je Durchgang.
// Schauplatz: erfundene Kleinstadt Maple Hollow, Ohio, Halloween-Abend. Frank Doyle überlebt knapp.
// Frage 1 (Wann?): Spuk-App-Protokoll (Sargdeckel auf/zu) gegen die Kindergruppen auf Kamera Nr. 15 –
//   gesucht ist das „Deckel zu“, vor und nach dem keine Kindergruppe auf Franks Weg war (Falle: Gruppen an der Tür von Nr. 15).
// Frage 2 (Wer?): das „siebte Skelett“ auf der Verandakamera – Schuhe (je zwei Personen gleich) und Körpergröße am
//   Messpfosten gegen das Lineup-Foto; Bestätigung über die Sichtungen der Nachbarkameras (nur Täter und ein Unschuldiger fehlen).
// Frage 3 (Wo?): Kameras, die das Skelett beim Bücken sahen → Deko-Stück, das genau in diesen Bewegungszonen liegt.
// Frage 4 (Warum?): Franks Notiz im Candy-Code (Polybios-Quadrat) → ein Wort, das das Motiv belegt.
// Personalisiert ist nur der Spielername (N, bereits HTML-escaped).

import { porchCam, lineup, plan, candyGrid, candyNote, zonesOf } from "../art/special001.js";

export const ID = "special-001";
export const TITLE = "Süßes oder Saures";
export const LIMIT_MIN = 50;                  // bis der Sheriff kommt (Entscheidung 13.10.: Median der Simulation 46 Min.)
export const TRAIN_START = 21 * 60 + 55;      // Uhr beim Start: 21:55
export const VARIANTS = 4;                    // Tatzeit-Varianten
export const UI = {
  clock: "Hollow Lane", until: "bis zum Sheriff", late: "Sheriff wartet", stamp: "HALLOWEEN", fb: "den Halloween-Fall",
  cert: "und den Fall gelöst, bevor der Sheriff in der Hollow Lane eintraf.", caseNo: "SPECIAL HALLOWEEN",
  stages: { 2: "Neue Beweisstücke: Kameras und Aussagen", 3: "Neue Beweisstücke: der Garten", 4: "Neue Beweisstücke: Franks Notiz" },
};

export const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const pad2 = (n) => String(n).padStart(2, "0");
export const fmt = (x) => `${pad2(Math.floor(x / 60) % 24)}:${pad2(x % 60)}`;
export const TAT = [hm("21:22"), hm("21:25"), hm("21:28"), hm("21:31")];
export const tatOf = (v) => TAT[(v || 0) % TAT.length];
export const RESCUE = hm("21:40");

export const SUSPECTS = {
  linda: { name: "Linda Price", short: "Linda", role: "Nachbarin aus Nr. 12, seit Jahren Zweite beim Wettbewerb", costume: "hexe", kostuem: "Hexe", kost: "Hexenkostüm", inch: 63, shoe: "weiss" },
  greg: { name: "Greg Holloway", short: "Greg", role: "Kassier der Nachbarschaftskasse", costume: "sense", kostuem: "Sensenmann", kost: "Sensenmann-Kostüm", inch: 74, shoe: "cowboy" },
  tyler: { name: "Tyler Doyle", short: "Tyler", role: "Franks Neffe, wohnt bei ihm", costume: "werwolf", kostuem: "Werwolf", kost: "Werwolf-Kostüm", inch: 70, shoe: "weiss" },
  rosa: { name: "Rosa Alvarez", short: "Rosa", role: "Fotografin, fotografiert für die Jury", costume: "vampir", kostuem: "Vampirin", kost: "Vampirkostüm", inch: 62, shoe: "schwarz" },
  coach: { name: "Dwayne „Coach“ Miller", short: "Coach", role: "Footballtrainer der Highschool", costume: "kuerbis", kostuem: "Kürbiskopf", kost: "Kürbiskopf-Kostüm", inch: 70, shoe: "schwarz" },
};
export const ORDER = ["linda", "greg", "tyler", "rosa", "coach"];
export const CULPRITS = ORDER.slice();
export const NAMES = ["Frank", "Doyle", "Linda", "Price", "Greg", "Holloway", "Tyler", "Rosa", "Alvarez", "Dwayne", "Miller", "Agnes", "Whitfield"];
// Der zweite, der zur Tatzeit auf keiner Nachbarkamera zu sehen ist (unschuldig, war kurz zu Hause)
export function decoyOf(c, v) { const i = ORDER.indexOf(c); return ORDER[(i + 1 + ((v || 0) % 4)) % 5]; }

// ---------- Garten und Versteck ----------
export const ITEM_NAMES = {
  1: "Grabstein „Boo Hill“ (hohl)", 2: "Grabstein „R.I.P.“", 3: "Riesenkürbis (ausgehöhlt)", 4: "Heuballen", 5: "Vogelscheuche",
  6: "Grabstein „Hier ruht …“", 7: "Kürbisstapel", 8: "Hexenkessel", 9: "Sarg (Veranda)", 10: "Laubsäcke bei der Garage", 11: "Schaukelstuhl (Veranda)", 12: "Briefkasten",
};
export const HIDES = [1, 3, 4, 5, 8];
export const hideOf = (c, v) => HIDES[(ORDER.indexOf(c) + (v || 0)) % HIDES.length];
export const SKEL = [[135, 172], [235, 176], [338, 170], [118, 330], [330, 230], [395, 380]];   // Deko-Skelette im Plan

// ---------- Candy-Code: Wort je Täter (Motiv) ----------
export const WORD = { linda: "GEMIETET", greg: "KASSENBUCH", tyler: "TESTAMENT", rosa: "ANZEIGE", coach: "WETTEN" };
export const normWord = (s) => String(s || "").toUpperCase().replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/ß/g, "SS").replace(/J/g, "I").replace(/[^A-Z]/g, "");

// ---------- Fragen ----------
export const QUESTIONS = [
  { key: "zeit", nr: 1, type: "time", label: "Um wie viel Uhr wurde der Sargdeckel über Frank geschlossen?", hint: "Uhrzeit, z. B. 21:15" },
  { key: "taeter", nr: 2, type: "select", label: "Wer steckte im Skelett-Anzug?", hint: "Die Schuhe hat niemand gewechselt.",
    options: ORDER.map((k) => [k, `${SUSPECTS[k].name} (${SUSPECTS[k].kostuem})`]) },
  { key: "versteck", nr: 3, type: "select", label: "Wo liegt der Umschlag mit dem Preisgeld?", hint: "Der Sheriff lässt nur an einer Stelle suchen.",
    options: Object.keys(ITEM_NAMES).map((n) => [String(n), `${n} · ${ITEM_NAMES[n]}`]) },
  { key: "wort", nr: 4, type: "word", label: "Welches Wort steht in Franks Notiz?", hint: "Ein Wort, Groß- und Kleinschreibung egal" },
];
export function solution(c, v) {
  return { zeit: fmt(tatOf(v)), taeter: c, versteck: String(hideOf(c, v)), wort: WORD[c] };
}

// ---------- Ablauf am Sarg (Spuk-App) und Kindergruppen ----------
// Zeiten relativ zur Tatzeit T. Frank öffnet den Deckel mit Schrei, wenn Kinder kommen, schließt ihn, wenn sie weg sind,
// und ruht sich zwischendurch mit offenem Deckel aus (ohne Schrei). Nur beim Deckel-zu um T war keine Gruppe da.
const KIDS = [
  [-22, "drei Kinder (Prinzessin, Dino, Pirat)"],
  [-17, "fünf Teenager als Zombies"],
  [-10, "Feuerwehrmann und Marienkäfer mit Papa"],
  [-6, "zwei Astronauten"],
  [5, "Einhorn mit Mama"],
];
const KIDS15 = [[-13, "zwei Hexen mit Oma"], [1, "drei Pfadfinder als Mumien"]];
export function hubLog(v) {
  const T = tatOf(v);
  const ev = [
    [-23, "Spuk-Modus aktiv · Nebel: Intervall"],
    [-22, "Bewegung Weg"], [-22, "Bewegung Veranda"], [-22, "Sargdeckel AUF · Schrei-Sound"], [-20, "Sargdeckel ZU"],
    [-17, "Bewegung Weg"], [-17, "Bewegung Veranda"], [-17, "Sargdeckel AUF · Schrei-Sound"], [-17, "Nebel: DAUERBETRIEB"], [-15, "Sargdeckel ZU"], [-15, "Nebel: Intervall"],
    [-14, "Sargdeckel AUF"], [-11, "Sargdeckel ZU"],
    [-10, "Bewegung Weg"], [-10, "Bewegung Veranda"], [-10, "Sargdeckel AUF · Schrei-Sound"], [-8, "Sargdeckel ZU"],
    [-6, "Bewegung Weg"], [-6, "Bewegung Veranda"], [-6, "Sargdeckel AUF · Schrei-Sound"], [-4, "Sargdeckel ZU"],
    [-3, "Sargdeckel AUF"], [-1, "Bewegung Veranda"], [0, "Sargdeckel ZU"], [1, "Nebel: DAUERBETRIEB"],
    [5, "Bewegung Weg"], [5, "Bewegung Veranda"],
  ].map(([d, t]) => [T + d, t]);
  ev.push([RESCUE, "Bewegung Weg"], [RESCUE, "Bewegung Veranda"], [RESCUE, "Sargdeckel AUF"], [RESCUE + 1, "Nebel: AUS (manuell)"]);
  return ev;
}
export function kidsLog(v) {
  const T = tatOf(v);
  return [...KIDS.map(([d, w]) => [T + d, w, "frank"]), ...KIDS15.map(([d, w]) => [T + d, w, "15"]), [RESCUE, "die Ninja-Zwillinge mit ihrer Mutter", "frank"]].sort((a, b) => a[0] - b[0]);
}

// ---------- Sichtungen auf den Nachbarkameras (je Person zwei Einträge) ----------
const PLACES = {
  linda: [["verteilt Süßes an der Tür von Nr. 12", "Nr. 11"], ["steht mit der Schüssel am Gartentor von Nr. 12", "Nr. 11"]],
  greg: [["schenkt Punsch aus am Tisch vor Nr. 17", "Nr. 19"], ["schenkt wieder Punsch aus, Tisch vor Nr. 17", "Nr. 19"]],
  tyler: [["erschreckt Kinder an der Ecke Maple Avenue", "Nr. 9"], ["sitzt mit zwei Freunden auf der Mauer an der Maple Avenue", "Nr. 9"]],
  rosa: [["fotografiert die Gärten von Nr. 9 und Nr. 11", "Nr. 10"], ["fotografiert den Garten von Nr. 21", "Nr. 20"]],
  coach: [["führt die Kinder-Parade mit Lautsprecher an, vor Nr. 21", "Nr. 22"], ["verteilt Knicklichter an die Parade vor Nr. 19", "Nr. 20"]],
};
const JIT = { linda: 0, greg: 1, tyler: 2, rosa: 1, coach: 0 };
export function sightings(c, v) {
  const T = tatOf(v), dec = decoyOf(c, v), rows = [];
  for (const k of ORDER) {
    const j = JIT[k];
    let a, b;
    if (k === c) { a = [T - 17 + j, T - 7 - j]; b = [T + 6 + j, T + 14]; }
    else if (k === dec) { a = [T - 16 + j, T - 6 + j]; b = [T + 5 - j, T + 13]; }
    else { a = [T - 18 + j, T - 12 + j]; b = [T - 9 + j, T + 10 - j]; }   // kurze Lücke weit vor der Tat (Nachttest 14.10.)
    rows.push([a[0], a[1], k, 0], [b[0], b[1], k, 1]);
  }
  return rows;   // nach Person gruppiert (Nachtest 13.10.: nach Zeit sortiert war am Handy zu mühsam)
}

// ---------- Hinweise ----------
export const HINT_PENALTY = [1, 2, 3];
export const WRONG_PENALTY = 3;
export const HINTS = (v, c) => {
  const T = tatOf(v), dec = decoyOf(c, v), H = hideOf(c, v), Z = zonesOf(H).split(""), w = WORD[c];
  const pair = [c, dec].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).map((k) => `${SUSPECTS[k].short} (${SUSPECTS[k].kostuem})`);
  return {
    zeit: [
      "Lies Franks Spukplan: Wann öffnet er den Deckel, wann schließt er ihn?",
      "Vergleiche jedes „Sargdeckel ZU“ mit den Kindergruppen auf Kamera Nr. 15. Achtung: Nicht jede Gruppe dort war bei Frank.",
      "Gesucht ist das „Sargdeckel ZU“, vor dem keine Kindergruppe bei Frank war und auf das auch keine folgte. Kurz danach lief der Nebel durchgehend.",
    ],
    taeter: [
      "Das siebte Skelett ist ein Mensch im Anzug – und die Schuhe hat niemand gewechselt. Vergleiche sie mit dem Wettbewerbsfoto (Bild antippen und hineinzoomen). Zwei Schuhmodelle tragen je zwei Personen, eines nur eine.",
      "Trägt nur eine Person diese Schuhe, ist es klar. Sonst: Wer von den beiden passt zur Größe an der Messlatte – und wer ist zur Tatzeit auf keiner Nachbarkamera zu sehen? Hut, Kapuze, Maske und Kürbiskopf zählen bei der Größe nicht mit.",
      `Um ${fmt(T)} fehlen auf den Nachbarkameras nur ${pair[0]} und ${pair[1]}. Nur eine/r von beiden passt zu Schuhen und Größe.`,
    ],
    versteck: [
      "Wo sich das Skelett bückt, liegt der Umschlag. Welche Kameras haben das gesehen?",
      "Jede Kamera hat ihre Bewegungszone im Gartenplan in ihrer Farbe gestrichelt (A blau, B grün, C rot). Gesucht ist das Deko-Stück, das genau in diesen Zonen liegt – und in keiner anderen.",
      Z.length === 1 ? `Das Bücken zeigt nur Kamera ${Z[0]}. Nur ein Deko-Stück liegt allein in ihrer Zone.` : `Das Bücken zeigen die Kameras ${Z[0]} und ${Z[1]}. Nur ein Deko-Stück liegt in beiden Zonen und nicht in der dritten.`,
    ],
    wort: [
      "Die Notiz ist im Candy-Code der Schnitzeljagd geschrieben: Immer zwei Süßigkeiten ergeben einen Buchstaben.",
      `Die erste Süßigkeit nennt die Zeile, die zweite die Spalte. Das Wort beginnt mit „${w.slice(0, 2)}“.`,
      `Das Wort beginnt mit „${w.slice(0, Math.ceil(w.length / 2))}“ und hat ${w.length} Buchstaben.`,
    ],
  };
};

// ---------- Einsatzauftrag ----------
export function briefing(N) {
  return {
    eyebrow: "Hollow Lane · Maple Hollow, Ohio · Halloween",
    title: "Süßes oder <em>Saures</em>",
    text: `Es ist 21:55 am 31. Oktober. In der Hollow Lane sollte um 22:00 der Preis für den schaurigsten selbst gebauten Garten verliehen werden – 5.000 Dollar aus der Nachbarschaftskasse. Doch um 21:40 haben Kinder Frank Doyle, den Halloween-Verrückten der Straße, bewusstlos in seinem eigenen Deko-Sarg gefunden: Deckel verriegelt, voller Nebel. Er lebt – knapp. Der Umschlag mit dem Preisgeld ist weg. Und die Kinder schwören: „Eines der Skelette ist aufgestanden.“ Der Sheriff ist in dieser Nacht im ganzen County unterwegs und braucht 50 Minuten. Agnes Whitfield aus Nr. 13 hat dich geholt, ${N}. Bis der Sheriff kommt, ermittelst du.`,
    steps: [
      ["Akte lesen", "Du startest mit den Unterlagen vom Abend. Nach jeder richtigen Antwort kommen neue Beweisstücke dazu – sie sind mit „Neu“ markiert."],
      ["Vier Fragen, der Reihe nach", "Wann wurde der Sarg geschlossen, wer steckte im Skelett-Anzug, wo liegt das Preisgeld – und was wollte Frank um 22:00 verkünden?"],
      ["Hinweise kosten Zeit", `Bis zu drei Hinweise pro Frage: +${HINT_PENALTY.join(", +")} Strafminuten. Jede falsche Antwort kostet +${WRONG_PENALTY} Minuten.`],
      ["Vor dem Sheriff fertig sein", `${LIMIT_MIN} Minuten, bis der Sheriff kommt. Die Uhr läuft auch danach weiter – deine Zeit plus Strafminuten ergibt deine Wertung.`],
      ["Fair Play", "Keine KI, keine Suchmaschine. Der Fall ist mit Köpfchen lösbar."],
    ],
  };
}

// ---------- Beweisstücke ----------
const STATE = {
  linda: "„Ich hab den ganzen Abend an meiner Tür Süßes verteilt. Zwischendurch war ich kurz drin, Nachschub holen – Frank hat die großen Schokoriegel, da muss man mithalten. Gewonnen hat ja sowieso immer er.“",
  greg: "„Ich war am Punsch-Tisch vor Nr. 17. Einmal bin ich kurz heim, die Spendendose in Sicherheit bringen. Den Umschlag mit dem Preisgeld hatte Frank – er wollte ihn selbst überreichen.“",
  tyler: "„Ich war mit den Jungs an der Ecke zur Maple Avenue, Kinder erschrecken. Irgendwann bin ich zum Auto, Handy laden. Ich wohne bei Onkel Frank, bis meine Schulden abbezahlt sind. Wir verstehen uns. Meistens. Dass er seit Tagen mit seinem Notar telefoniert, geht mich nichts an.“",
  rosa: "„Ich habe für die Jury alle Gärten fotografiert, die Straße rauf und runter. Zwischendurch war ich zu Hause, Akku wechseln. Frank und ich hatten Streit wegen meiner Gäste, ja. Er hat sogar mit der Stadt gedroht. Na und?“",
  coach: "„Ich hab die Kinder-Parade gemacht, mit Lautsprecher. Einmal war ich in meiner Garage, Batterien holen. Die Wette mit Frank? Das war ein Witz unter Nachbarn.“",
};
export function docs(c, N, v) {
  const d = [], T = tatOf(v), H = hideOf(c, v), Z = zonesOf(H), S = SUSPECTS[c];
  const rows = (list) => list.map((r) => `<tr>${r.map((x, i) => `<td${i === 0 ? ' class="mono"' : ""}>${x}</td>`).join("")}</tr>`).join("");
  // ----- Stufe 1 -----
  d.push({ id: "fund", stage: 1, kind: "Notiz", title: "Bericht von Agnes Whitfield (Nr. 13)", html: `
<div class="letterhead"><strong>Agnes Whitfield · Krankenschwester im Ruhestand</strong><span>Hollow Lane 13 · notiert um 21:52</span></div>
<p>Um 21:40 kamen die Ninja-Zwillinge aus Nr. 22 mit ihrer Mutter zu Franks Sarg auf der Veranda. Der Sarg hat nicht geschrien, aus den Ritzen quoll Nebel. Der Holzriegel außen am Deckel war zu – den hat Frank nur zur Deko, von innen kommt man daran nicht heran. Die Mutter hat aufgemacht und mich gerufen.</p>
<ul>
<li>Frank lag im Sarg, bewusstlos, das Gesicht grau vom Nebel. Ich habe ihn herausgezogen und beatmet. Er atmet wieder, der Rettungswagen hat ihn um 21:50 mitgenommen. Erinnern kann er sich an nichts.</li>
<li>Der Schlauch der Nebelmaschine führt in den Sarg – damit es beim Aufklappen qualmt. Im Dauerbetrieb und bei geschlossenem Deckel bleibt darin kaum Luft.</li>
<li>Franks Jury-Mappe lag auf dem Schaukelstuhl auf der Veranda. Der Umschlag mit den 5.000 Dollar fehlt.</li>
<li>Kinder aus der Straße erzählen, eines der Skelette auf der Veranda sei „aufgestanden“ und in den Garten gelaufen – wann genau, weiß keines mehr. Frank hat sechs Deko-Skelette, drei auf der Veranda, drei im Garten.</li>
</ul>
<div class="postit">${N}, der Sheriff fragt sicher: Wann ist es passiert, wer war es, wo ist das Geld – und warum? <span>– A. W.</span></div>` });

  d.push({ id: "spukplan", stage: 1, kind: "Notiz", title: "Franks Spukplan (an der Haustür)", html: `
<div class="letterhead"><strong>SPUKPLAN · HALLOWEEN</strong><span>handgeschrieben, mit Klebeband an der Haustür</span></div>
<div class="notebook">
<p>ab 21:00 ich im Sarg!! Spuk-App auf Automatik</p>
<p>Kids kommen den Weg rauf → Deckel AUF + Schrei-Knopf</p>
<p>Kids weg → Deckel ZU, warten, nächste Gruppe</p>
<p>Pause zwischendurch: Deckel auf lassen, Cider trinken</p>
<p>Nebel: Intervall. Große Gruppen → DAUER-Knopf (Pfosten), danach zurück auf Intervall</p>
<p>Jury-Mappe + Umschlag → Schaukelstuhl. 22:00 Preisverleihung!</p>
</div>
<p class="small">Die Spuk-App protokolliert die Bewegungsmelder am Weg und auf der Veranda, den Kontakt am Sargdeckel und die Nebelmaschine.</p>` });

  const hub = hubLog(v).sort((a, b) => a[0] - b[0]);
  d.push({ id: "spukapp", stage: 1, kind: "Systemauszug", kk: "Systemauszug", title: "Spuk-App: Protokoll des Abends", html: `
<div class="letterhead"><strong>SpookHub · Haunted Yard Doyle</strong><span>Protokoll von Franks Handy, Ereignisse minutengenau</span></div>
<table class="grid"><tr><th>Zeit</th><th>Ereignis</th></tr>${rows(hub.map(([t, e]) => [fmt(t), e]))}</table>
<p class="small">„Bewegung Weg“ = Melder am Gartenweg, „Bewegung Veranda“ = Melder auf der Veranda. Der Sargdeckel meldet nur auf und zu – nicht, wer ihn bewegt.</p>` });

  const kids = kidsLog(v);
  d.push({ id: "kamera15", stage: 1, kind: "Liste", title: "Türklingel-Kamera Nr. 15: Kindergruppen", html: `
<div class="letterhead"><strong>Familie Parker · Hollow Lane 15</strong><span>Auszug aus der Kamera-App, gegenüber von Franks Haus</span></div>
<table class="grid"><tr><th>Zeit</th><th>Wer</th><th>Wohin</th></tr>${rows(kids.map(([t, w, wo]) => [fmt(t), w, wo === "frank" ? "Franks Weg hinauf (Nr. 14)" : "zu uns an die Tür (Nr. 15)"]))}</table>
<p class="small">Unsere Kamera sieht Franks Gartenweg und unsere eigene Haustür. Andere Gruppen gingen an Franks Haus vorbei, ohne hinaufzugehen.</p>` });

  d.push({ id: "wettbewerb", stage: 1, kind: "Liste", title: "Kostümwettbewerb um 20:30", html: `
<div class="letterhead"><strong>Kostümwettbewerb Hollow Lane</strong><span>Foto vor Franks „Lineup“-Fotowand · Teilnehmer der Erwachsenen-Kategorie</span></div>
${lineup(false, ORDER.map((k) => ({ name: SUSPECTS[k].short, costume: SUSPECTS[k].costume, inch: SUSPECTS[k].inch, shoe: SUSPECTS[k].shoe })))}
<table class="grid"><tr><th>Name</th><th>Kostüm</th><th>Wer</th></tr>${ORDER.map((k) => `<tr><td>${SUSPECTS[k].name}</td><td>${SUSPECTS[k].kostuem}</td><td>${SUSPECTS[k].role}</td></tr>`).join("")}</table>
<p class="small">Für den Garten-Preis gilt wie jedes Jahr: Alle Deko muss selbst gebaut sein – nichts gekauft, nichts gemietet. Nur diese fünf waren den ganzen Abend in der Straße unterwegs und kannten Franks Spukplan. Alle anderen Erwachsenen waren bei ihren Kindern oder an der eigenen Tür – das bestätigen die Kameras.</p>` });

  d.push({ id: "drohbrief", stage: 1, kind: "Fundstück", title: "Zettel in Franks Briefkasten", html: `
<div class="letterhead"><strong>Fundstück</strong><span>aus Franks Briefkasten, eingeworfen gestern</span></div>
<p class="mono" style="font-size:20px;letter-spacing:2px">DEIN GARTEN WIRD DEIN GRAB – 31.10.</p>
<p>Ausgeschnittene Buchstaben, ohne Absender. Auf der Rückseite, klein gedruckt: <i>„Hollow Creek High präsentiert: die Spukhaus-Tour der Theatergruppe! Tickets 5 $ an der Abendkasse.“</i></p>
<p class="small">Agnes Whitfield: „Den gleichen Zettel hatte gestern die ganze Straße im Briefkasten. Die Theatergruppe macht das jedes Jahr.“</p>` });

  // ----- Stufe 2 -----
  const stamp = `${fmt(T - 1)}:${pad2(14 + (v || 0) * 9)}`;
  d.push({ id: "verandakamera", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: `Franks Verandakamera um ${fmt(T - 1)}`, html: `
<div class="letterhead"><strong>Verandakamera · Hollow Lane 14</strong><span>Standbild der Bewegungsaufnahme</span></div>
${porchCam(false, S.inch, S.shoe, stamp)}
<p>Frank hat sechs Deko-Skelette aus Kunststoff: ganz weiß, mit Knochenfüßen, auf Stangen. Im Laubsack neben der Garage lag um 21:50 ein schwarzer Skelett-Ganzkörperanzug – Franks Ersatzkostüm aus der Garage. Die Garage stand den ganzen Abend offen.</p>
<p class="small">Die Messlatte am Pfosten hat Frank selbst angebracht („You must be this tall to be scared“). Sie misst ab dem Verandaboden, in Fuß und Zoll – wie die Fotowand beim Wettbewerb.</p>` });

  const sg = sightings(c, v);
  d.push({ id: "sichtungen", stage: 2, kind: "Liste", title: "Nachbarkameras: wer war wann wo", html: `
<div class="letterhead"><strong>Auswertung der Türklingel-Kameras</strong><span>Hollow Lane Nr. 9 bis 22 · zusammengestellt von Agnes Whitfield</span></div>
<table class="grid"><tr><th>von–bis</th><th>Kostüm</th><th>Was</th></tr>${rows(sg.map(([a, b, k, i]) => [`${fmt(a)}–${fmt(b)}`, SUSPECTS[k].kostuem, `${PLACES[k][i][0]} (Kamera ${PLACES[k][i][1]})`]))}</table>
<p class="small">Die Kameras zeigen Kostüme, keine Gesichter. Jedes Kostüm gab es in der Straße nur einmal.</p>` });

  d.push({ id: "aussagen", stage: 2, kind: "Protokoll", title: "Aussagen der fünf", html: `
<div class="letterhead"><strong>Kurzbefragung vor Franks Haus</strong><span>notiert von Agnes Whitfield</span></div>
${ORDER.map((k) => `<p class="q">${SUSPECTS[k].name} – ${SUSPECTS[k].kostuem}</p><p class="a">${STATE[k]}</p>`).join("")}
<p class="small">Alle fünf trugen beim Gespräch wieder ihr Kostüm.</p>` });

  // ----- Stufe 3 -----
  d.push({ id: "garten", stage: 3, kind: "Liste", title: "Franks Garten: Plan der Jury", html: `
${plan(false, ITEM_NAMES, SKEL)}
<p class="small">Die Kameras A, B und C hängen an den Häusern gegenüber (Nr. 13, 15 und 17). Ihre Apps melden nur Bewegung innerhalb der eingezeichneten Bewegungszone.</p>` });

  const camRows = (cam) => [
    [fmt(T + 1), "Gestalt im Skelett-Anzug am Rand der Zone, kurz"],
    [fmt(T + 2), Z.includes(cam) ? "Gestalt im Skelett-Anzug bückt sich, etwa 20 Sekunden, geht dann weiter" : "keine Bewegung"],
    [fmt(T + 5), "Kindergruppe auf dem Gartenweg"],   // der Weg liegt in allen drei Zonen (Nachttest 14.10.)
  ];
  d.push({ id: "bewegungen", stage: 3, kind: "Systemauszug", kk: "Systemauszug", title: "Bewegungsmeldungen der Kameras A, B und C", html: `
<div class="letterhead"><strong>Bewegungsmeldungen nach der Tat</strong><span>aus den Apps von Nr. 13 (A), Nr. 15 (B) und Nr. 17 (C)</span></div>
${["A", "B", "C"].map((cam) => `<p class="q">Kamera ${cam}</p><table class="grid"><tr><th>Zeit</th><th>Meldung</th></tr>${rows(camRows(cam))}</table>`).join("")}
<p class="small">Im Dunkeln erkennen die Kameras nur Umrisse – aber das Knochenmuster leuchtet im Licht der Verandalampe.</p>` });

  d.push({ id: "nachtrag", stage: 3, kind: "Notiz", title: "Nachtrag: Wo ist das Geld?", html: `
<div class="letterhead"><strong>Nachtrag</strong><span>Agnes Whitfield, 22:05</span></div>
<p>Bei keinem der fünf war der Umschlag, und im Laubsack mit dem Anzug war er auch nicht. Der Täter musste ihn schnell irgendwo im Garten verschwinden lassen – und wollte ihn sicher später holen.</p>
<p>Der Sheriff hat angerufen: Er lässt den Garten nicht umgraben, sondern an genau einer Stelle nachsehen. Welche?</p>` });

  // ----- Stufe 4 -----
  d.push({ id: "notiz", stage: 4, kind: "Fundstück", title: "Franks Notiz aus der Jury-Mappe", html: `
<div class="letterhead"><strong>Fundstück</strong><span>Notizblock, ganz hinten in Franks Jury-Mappe</span></div>
${candyNote(false, WORD[c])}
<p>Agnes Whitfield: „Frank wollte um 22:00 bei der Preisverleihung etwas verkünden, ‚das die Straße verändern wird‘. Mehr wollte er nicht sagen. Er hat es lieber verschlüsselt – wie bei seiner Schnitzeljagd für die Kinder.“</p>` });

  d.push({ id: "tafel", stage: 4, kind: "Fundstück", title: "Die Candy-Code-Tafel der Schnitzeljagd", html: `
${candyGrid(false)}
<p class="small">Die Tafel hängt seit der Schnitzeljagd im Sommer an Franks Garagentor. Jeder Buchstabe besteht aus zwei Süßigkeiten.</p>` });
  return d;
}

// ---------- Auflösung ----------
const MOTIVE = {
  linda: "Frank hatte herausgefunden, dass Lindas Garten-Deko nicht selbst gebaut, sondern bei einem Partyverleih gemietet war – gegen die wichtigste Regel des Wettbewerbs. Um 22:00 wollte er sie vor der ganzen Straße disqualifizieren. Das Wort in seiner Notiz: GEMIETET.",
  greg: "In der Nachbarschaftskasse fehlte Geld, und Frank hatte das Kassenbuch nachgerechnet. Um 22:00 wollte er die Lücke vor allen offenlegen – das Preisgeld sollte Greg die Zeit kaufen, sie zu stopfen. Das Wort in Franks Notiz: KASSENBUCH.",
  tyler: "Tyler hat Schulden, die er nicht zurückzahlen kann. Frank wollte um 22:00 verkünden, dass er sein Haus nicht mehr Tyler, sondern dem Halloween-Fonds der Straße vermacht. Das Wort in seiner Notiz: TESTAMENT.",
  rosa: "Rosa vermietet ihr Haus ohne Genehmigung an Feriengäste. Frank hatte bei der Stadt Anzeige erstattet und wollte es um 22:00 vor allen sagen. Das Wort in seiner Notiz: ANZEIGE.",
  coach: "Der Coach wettet heimlich gegen seine eigene Mannschaft – und die verlor danach auffällig oft. Frank wusste es seit ihrer Wette. Um 22:00 wollte er es vor der ganzen Straße öffentlich machen – das Ende seiner Trainerstelle. Das Wort in seiner Notiz: WETTEN.",
};
const SHOE_TXT = { weiss: "weiße Sneaker", schwarz: "schwarze Sneaker", cowboy: "braune Cowboystiefel" };
const ftin = (i) => `${Math.floor(i / 12)} Fuß ${i % 12} Zoll`;
export function resolution(c, v) {
  const T = tatOf(v), S = SUSPECTS[c], H = hideOf(c, v), Z = zonesOf(H).split("");
  const pron = c === "linda" || c === "rosa" ? "sie" : "er";
  const twin = ORDER.find((k) => k !== c && SUSPECTS[k].shoe === S.shoe);
  const shoeTxt = twin ? `${SHOE_TXT[S.shoe]} – dasselbe Modell wie ${SUSPECTS[twin].short}, aber ${S.short} ist ${ftin(S.inch)} groß, ${SUSPECTS[twin].short} dagegen ${ftin(SUSPECTS[twin].inch)}` : `${SHOE_TXT[S.shoe]}, die sonst niemand trug`;
  const IN = { 1: "im hohlen Grabstein „Boo Hill“", 3: "im ausgehöhlten Riesenkürbis", 4: "im Heuballen", 5: "unter dem Hemd der Vogelscheuche", 8: "im Hexenkessel" };
  const text = `${S.name} legte das ${S.kost} ab, zog in der offenen Garage Franks Ersatz-Skelettanzug über und stellte sich zwischen die Deko-Skelette auf der Veranda. Um ${fmt(T - 3)} öffnete Frank für eine Pause den Deckel – kein Kind in Sicht. Um ${fmt(T)} schlug ${S.short} den Deckel zu, schob den Riegel vor und drückte um ${fmt(T + 1)} am Pfosten auf Nebel-Dauerbetrieb. Mit dem Umschlag aus der Jury-Mappe auf dem Schaukelstuhl lief ${pron} in den Garten und versteckte ihn ${IN[H]} (Nr. ${H}) – genau dort, wo ${Z.length === 1 ? `nur Kamera ${Z[0]} das Bücken sah` : `die Kameras ${Z[0]} und ${Z[1]} das Bücken sahen`}. Den Anzug stopfte ${pron} in den Laubsack. Die Kinder, die um ${fmt(T + 5)} auf die Veranda kamen, hielten den stillen Sarg für eine von Franks Pausen. Verraten wurde ${S.short} durch die Schuhe: ${shoeTxt}. ${MOTIVE[c]} Frank erholt sich im Krankenhaus. ${S.short} sagt bei der Befragung nur: „Er sollte doch nur einen Schrecken kriegen.“`;
  return {
    culprit: S.name, text, item: `${ITEM_NAMES[H]} (Nr. ${H})`,
    summary: `Täter/in: ${S.name} (${S.kostuem}) · Sarg geschlossen um ${fmt(T)} · Versteck: ${ITEM_NAMES[H]} · Wort: ${WORD[c]}`,
  };
}
