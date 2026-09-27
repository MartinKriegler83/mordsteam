// Fall 001 – Projekt Phoenix (Firmen, fiktiver Täter: Sabine Kral)
// Platzhalter in {GROSSBUCHSTABEN} werden pro Spielrunde ersetzt.
// Dieser Ordner wird NICHT veröffentlicht – Inhalte gehen nur über die API raus,
// und nur solange eine Runde läuft.

export const DIEBESGUT = {
  prototyp: {
    label: "Prototyp",
    DG_NOM: "der Prototyp", DG_AKK: "den Prototyp", DG_DAT: "dem Prototyp", DG_KURZ: "Prototyp",
    DG_FRAG: "ein Gehäusesplitter aus grauem Kunststoff mit der eingeprägten Seriennummer PHX-B",
    DG_HUELLE: "Transportkoffer",
  },
  stick: {
    label: "Kundendaten-Stick",
    DG_NOM: "der Kundendaten-Stick", DG_AKK: "den Kundendaten-Stick", DG_DAT: "dem Kundendaten-Stick", DG_KURZ: "Kundendaten-Stick",
    DG_FRAG: "die abgebrochene Schutzkappe eines USB-Sticks mit der Inventarnummer PHX-B",
    DG_HUELLE: "Sicherheitsetui",
  },
  rezeptur: {
    label: "Geheimrezeptur",
    DG_NOM: "die Geheimrezeptur", DG_AKK: "die Geheimrezeptur", DG_DAT: "der Geheimrezeptur", DG_KURZ: "Geheimrezeptur",
    DG_FRAG: "die Siegelkappe eines Probenfläschchens mit der Nummer PHX-B",
    DG_HUELLE: "Kühlbox",
  },
  token: {
    label: "Quellcode-Schlüssel",
    DG_NOM: "der Quellcode-Schlüssel", DG_AKK: "den Quellcode-Schlüssel", DG_DAT: "dem Quellcode-Schlüssel", DG_KURZ: "Quellcode-Schlüssel",
    DG_FRAG: "ein abgerissener Anhänger-Clip mit der Gravur PHX-B",
    DG_HUELLE: "Sicherheitsetui",
  },
};

// Felder, die der Besteller ausfüllt (Admin-Formular), mit Beispielwerten.
export const FIELDS = [
  ["FIRMA", "Firmenname", "Muster GmbH"],
  ["STADT", "Stadt", "Wien"],
  ["NACHBARSTADT", "Nachbarstadt", "Mödling"],
  ["PARK", "Park in der Nähe", "Stadtpark"],
  ["RAUM_FEIER", "Raum der Feier", "Kantine"],
  ["RAUM_TATORT", "Tatort-Raum", "Besprechungsraum Donau"],
  ["AUFTRAGGEBER", "Auftraggeber (Name)", "Petra Lang"],
  ["AUFTRAGGEBER_FKT", "Auftraggeber (Funktion)", "Geschäftsführerin"],
  ["S1", "Verdächtige/r 1 (Name)", "Julia Berger"],
  ["S1_FKT", "Verdächtige/r 1 (Funktion)", "Teamleiterin"],
  ["S1_ABT", "Verdächtige/r 1 (Abteilung)", "Vertrieb"],
  ["S2", "Verdächtige/r 2 (Name)", "Tom Hofer"],
  ["S2_FKT", "Verdächtige/r 2 (Funktion)", "Leiter"],
  ["S2_ABT", "Verdächtige/r 2 (Abteilung)", "IT"],
  ["S3", "Verdächtige/r 3 (Name)", "Lisa Wagner"],
  ["S3_FKT", "Verdächtige/r 3 (Funktion)", "Key Account Managerin"],
  ["S3_ABT", "Verdächtige/r 3 (Abteilung)", "Kundenbetreuung"],
  ["S4", "Verdächtige/r 4 (Name)", "Markus Steiner"],
  ["S4_FKT", "Verdächtige/r 4 (Funktion)", "Controller"],
  ["S4_ABT", "Verdächtige/r 4 (Abteilung)", "Finanzen"],
];

// Pro Runde zufällig erzeugte Werte – dadurch hat jede Runde andere Lösungen.
export function makeSecrets(rand) {
  const letters = ["A", "B", "C", "D", "E"];
  for (let i = letters.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const two = (n) => String(n).padStart(2, "0");
  const plates = () => {
    const abc = "ABCDEFGHJKLMNPRSTUVWXYZ";
    return `W-${100 + rand(899)}${abc[rand(abc.length)]}${abc[rand(abc.length)]}`;
  };
  let spot = 11 + rand(9); // P2-11 … P2-19
  let spotKral = 11 + rand(9);
  while (spotKral === spot) spotKral = 11 + rand(9);
  let decoy = 11 + rand(9);
  while (decoy === spot || decoy === spotKral) decoy = 11 + rand(9);
  return {
    L_KRAL: letters[0], L_S1: letters[1], L_S2: letters[2], L_S3: letters[3], L_S4: letters[4],
    TATZEIT: `21:${two(5 + rand(21))}`,           // 21:05 – 21:25
    KONTO: String(1000 + rand(9000)),             // letzte 4 Ziffern
    STELLPLATZ: `P2-${spot}`,
    STELLPLATZ_KRAL: `P2-${spotKral}`,
    STELLPLATZ_S4: `P2-${decoy}`,
    GASTKARTE: two(3 + rand(17)),
    KENNZ_REIHER: plates(),
    KENNZ_MIET: plates(),
    KENNZ_S4: plates(),
  };
}

export function solution(v) {
  return {
    wer: v.L_KRAL,
    wann: v.TATZEIT,
    warum: v.KONTO,
    wo: v.STELLPLATZ,
  };
}

export const QUESTIONS = [
  { key: "wer", label: "Wer hat Dr. Reiher vergiftet?", hint: "Buchstabe aus der Übersicht der Verdächtigen", pattern: "letter" },
  { key: "wann", label: "Um wie viel Uhr gelangte das Gift in Reihers Tee?", hint: "Uhrzeit, z. B. 20:45", pattern: "time" },
  { key: "warum", label: "Wohin floss das Geld für den Verrat?", hint: "Die letzten 4 Ziffern der Kontonummer", pattern: "digits4" },
  { key: "wo", label: "Wo liegt {DG_NOM} jetzt?", hint: "Stellplatz, z. B. P1-05", pattern: "spot" },
];

export const TIPS = {
  wer: [
    "Wer konnte den Tee überhaupt in die Hand bekommen? Lest den Lieferschein des Caterings genau.",
    "Mit welcher Karte wurde der Tee abgeholt – und wem wurde diese Karte am Abend ausgegeben?",
  ],
  wann: [
    "Die Obduktion grenzt den Zeitraum ein. Wer stand in dieser Zeit an der Catering-Theke?",
    "Die Aussage der Catering-Mitarbeiterin und der Lieferschein nennen dieselbe Uhrzeit.",
  ],
  warum: [
    "Reihers Notizbuch verrät, wie man in den Partnerbereich von Veridian kommt.",
    "Der Zeitungsartikel nennt Reihers treuesten Begleiter und das Gründungsjahr seiner Kanzlei. Beides zusammen ist das Passwort.",
  ],
  wo: [
    "Vergleicht die Asservatenliste mit dem, was Reiher bei sich hatte. Was fehlt?",
    "Wo parkt ein Toter seinen Wagen – und wer würde dort nachsehen? Die Parkplatzliste weiß es.",
  ],
};

export const META = {
  id: "fall-001",
  title: "Projekt Phoenix",
  audience: "Firmen",
  victim: "Dr. Konstantin Reiher",
};

// ---------------------------------------------------------------------------
// Dokumente der Fallakte
// ---------------------------------------------------------------------------
export const DOCS = [
{ id: "01-einsatzbrief", title: "Einsatzbrief", kind: "Brief", html: `
<div class="letterhead"><strong>{FIRMA}</strong><span>Geschäftsleitung · {STADT}</span></div>
<p class="meta">Freitag, {SPIELSTART} Uhr · <span class="stamp-inline">Vertraulich</span></p>
<p>Liebe Kolleginnen und Kollegen,</p>
<p>ich muss euch um etwas Ungewöhnliches bitten. Heute Morgen hat unsere Reinigungskraft Dr. Konstantin Reiher tot im {RAUM_TATORT} gefunden. Dr. Reiher hat in den letzten drei Wochen in meinem Auftrag geprüft, ob Informationen über <strong>Projekt Phoenix</strong> an die Konkurrenz gelangen.</p>
<p>Gestern Abend, nach unserem Strategieabend in der {RAUM_FEIER}, wollte er mir seinen Befund übergeben. Dazu kam es nicht mehr. Und seit heute früh fehlt {DG_NOM} von Projekt Phoenix – das Herzstück unserer Arbeit der letzten zwei Jahre.</p>
<p>Die Polizei ermittelt, aber sie kennt unser Haus nicht so wie ihr. Ich habe euch alles zusammengestellt, was wir bisher wissen: Aussagen, Protokolle, Belege und Reihers Notizen.</p>
<p><strong>Wir haben einen Hinweis, dass die Übergabe an die Konkurrenz heute um 12:00 Uhr stattfinden soll.</strong> Bis dahin brauche ich vier Antworten:</p>
<ol>
<li>Wer hat Dr. Reiher vergiftet?</li>
<li>Um wie viel Uhr gelangte das Gift in seinen Tee?</li>
<li>Wohin floss das Geld für den Verrat?</li>
<li>Wo liegt {DG_NOM} jetzt?</li>
</ol>
<p>Tragt eure Antworten in der Fallzentrale ein. Ich zähle auf euch.</p>
<p class="sign">{AUFTRAGGEBER}<br><span>{AUFTRAGGEBER_FKT}, {FIRMA}</span></p>
`},

{ id: "02-zeitung", title: "Zeitungsartikel", kind: "Presse", html: `
<div class="newspaper">
<div class="np-mast"><span>{STADT}er Stadtanzeiger</span><span>Freitag · Lokales</span></div>
<h2>Berater tot in Firmengebäude aufgefunden</h2>
<p class="np-lead">Rätselhafter Todesfall bei der {FIRMA}: Der bekannte Unternehmensberater Dr. Konstantin Reiher (58) wurde am Freitagmorgen leblos in einem Besprechungsraum entdeckt.</p>
<p>Wie die Polizei bestätigte, fand eine Reinigungskraft den Berater gegen 7:40 Uhr. Reiher hatte am Vorabend an einem Strategieabend des Unternehmens teilgenommen. Ein Fremdverschulden wird nicht ausgeschlossen, eine Obduktion wurde angeordnet.</p>
<h3>Ein Mann mit festen Gewohnheiten</h3>
<p>Reiher galt in der Branche als unbestechlich und als einer, der „jedes Leck findet“. Nach Jahren in einem internationalen Beratungskonzern machte er sich selbstständig und gründete <strong>2011</strong> gemeinsam mit seiner damaligen Assistentin Sabine Kral die Kanzlei Reiher &amp; Kral Unternehmensberatung.</p>
<p>Wer Reiher kannte, kannte auch <strong>Bruno</strong>: Der betagte Rauhaardackel begleitete ihn jahrelang zu Kundenterminen. „Bruno ist mein treuester Begleiter – der verrät nie etwas“, sagte Reiher einmal in einem Interview mit dieser Zeitung.</p>
<p>Reiher trank bei Terminen stets Pfefferminztee, Kaffee rührte er nach eigener Aussage „seit einem kleinen Herzproblem“ nicht mehr an.</p>
<p class="np-foot">Die Ermittlungen dauern an. Hinweise nimmt jede Polizeiinspektion entgegen.</p>
</div>
`},

{ id: "03-obduktion", title: "Vorläufiger Obduktionsbefund", kind: "Gutachten", html: `
<div class="letterhead"><strong>Institut für Gerichtsmedizin</strong><span>Vorläufiger Befund · nicht zur Veröffentlichung</span></div>
<table class="kv">
<tr><th>Verstorbener</th><td>Dr. Konstantin Reiher, 58 Jahre</td></tr>
<tr><th>Auffindungsort</th><td>{RAUM_TATORT}, {FIRMA}, {STADT}</td></tr>
<tr><th>Todeszeitpunkt</th><td>Freitag davor, zwischen 22:30 und 23:00 Uhr</td></tr>
<tr><th>Todesursache</th><td>Herzrhythmusstörung nach Vergiftung mit einem Herzglykosid (Digitalis)</td></tr>
</table>
<h3>Befunde</h3>
<ul>
<li>Deutlich erhöhter Digitalis-Spiegel im Blut. Der Verstorbene nahm laut Krankenakte <em>keine</em> entsprechenden Medikamente.</li>
<li>Mageninhalt: Pfefferminztee, wenige Kekse. Kein Kaffee, kein Alkohol.</li>
<li>Das Gift wirkt je nach Dosis nach etwa 60 bis 90 Minuten. Die Aufnahme erfolgte demnach <strong>zwischen etwa 21:00 und 21:30 Uhr</strong>.</li>
<li>Keine Abwehrverletzungen, keine Hinweise auf Gewaltanwendung.</li>
</ul>
<p class="note">Digitalis ist in flüssiger Form als Herztropfen erhältlich (kleine Braunglasfläschchen mit Tropfeinsatz).</p>
<p class="sign">Dr. med. H. Brandstetter<br><span>Fachärztin für Gerichtsmedizin</span></p>
`},

{ id: "04-verdaechtige", title: "Übersicht der Verdächtigen", kind: "Aktenvermerk", html: `
<div class="letterhead"><strong>Aktenvermerk</strong><span>Personen im Haus nach 21:00 Uhr</span></div>
<p>Folgende Personen waren am Strategieabend nach 21:00 Uhr noch im Gebäude und hatten Kontakt mit Dr. Reiher. Die Buchstaben dienen der Zuordnung in der Fallzentrale.</p>
<table class="grid">
<tr><th>Kennung</th><th>Name</th><th>Funktion</th><th>Beziehung zu Reiher</th></tr>
<tr><td class="big">{L_S1}</td><td>{S1}</td><td>{S1_FKT}, {S1_ABT}</td><td>Reiher hatte die Abteilung {S1_ABT} im Workshop scharf kritisiert.</td></tr>
<tr><td class="big">{L_S2}</td><td>{S2}</td><td>{S2_FKT}, {S2_ABT}</td><td>Lauter Streit am Abend wegen geplanter Budgetkürzungen.</td></tr>
<tr><td class="big">{L_S3}</td><td>{S3}</td><td>{S3_FKT}, {S3_ABT}</td><td>Reiher hatte Fehler in einem Bericht von {S3} gefunden.</td></tr>
<tr><td class="big">{L_S4}</td><td>{S4}</td><td>{S4_FKT}, {S4_ABT}</td><td>Verließ als eine/r der Letzten das Haus; Auto blieb über Nacht in der Garage.</td></tr>
<tr><td class="big">{L_KRAL}</td><td>Sabine Kral</td><td>Juniorpartnerin, Reiher &amp; Kral Unternehmensberatung</td><td>Langjährige Partnerin; übernimmt nach Reihers Tod die Kanzlei.</td></tr>
</table>
<p class="note">Sabine Kral war als Gast anwesend und erhielt am Empfang eine Gästekarte.</p>
`},

{ id: "05-verhoer-s1", title: "Vernehmung {S1}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S1}, {S1_FKT}</span></div>
<p class="q">Wann haben Sie Dr. Reiher zuletzt gesehen?</p>
<p class="a">So gegen neun, bei der Bar. Er hat mit {S2} gestritten, das war schon vorher. Ich hab mich rausgehalten.</p>
<p class="q">Reiher hat Ihre Abteilung im Workshop kritisiert. Hat Sie das geärgert?</p>
<p class="a">Natürlich. Aber deswegen bringt man doch niemanden um! Er hatte ja teilweise sogar recht.</p>
<p class="q">Wann sind Sie gegangen?</p>
<p class="a">Um Viertel nach zehn, mit {S2} im Taxi. Wir wohnen in dieselbe Richtung.</p>
<p class="q">Kollegen sagen, Sie hätten am Abend etwas in der Teeküche versteckt.</p>
<p class="a">(lacht) Ach so, das. Ich bringe seit Monaten anonym Kuchen ins Büro. Alle rätseln, wer das ist. Das soll auch so bleiben, bitte!</p>
`},

{ id: "06-verhoer-s2", title: "Vernehmung {S2}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S2}, {S2_FKT}</span></div>
<p class="q">Sie hatten am Abend einen lauten Streit mit Dr. Reiher.</p>
<p class="a">Ja, um halb neun. Er wollte in seinem Bericht empfehlen, mein Budget um ein Drittel zu kürzen. Da bin ich laut geworden, das gebe ich zu.</p>
<p class="q">Haben Sie ihm danach noch etwas zu trinken gebracht?</p>
<p class="a">Ich? Sicher nicht. Ich war froh, wenn ich ihn nicht mehr sehen musste.</p>
<p class="q">Wann haben Sie das Haus verlassen?</p>
<p class="a">Um 22:15 mit dem Taxi, zusammen mit {S1}. Die Quittung habe ich noch, die reiche ich als Spesen ein.</p>
<p class="q">Warum haben Sie mehrmals mit der Assistenz der Geschäftsführung getuschelt?</p>
<p class="a">Weil wir eine Überraschungsfeier für {AUFTRAGGEBER} planen. Zehn Jahre im Haus. Das darf jetzt aber keiner erfahren.</p>
`},

{ id: "07-verhoer-s3", title: "Vernehmung {S3}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S3}, {S3_FKT}</span></div>
<p class="q">Kollegen beschreiben Sie am Abend als sehr nervös. Sie hätten ständig aufs Handy gesehen.</p>
<p class="a">Das hat nichts mit Reiher zu tun. Das ist… privat.</p>
<p class="q">Reiher hat Fehler in Ihrem Bericht gefunden.</p>
<p class="a">Ja, zwei Zahlendreher. Er hat es mir unter vier Augen gesagt, ganz fair. Ich hab es am nächsten Tag korrigiert.</p>
<p class="q">Wo waren Sie ab 22:30 Uhr?</p>
<p class="a">Im kleinen Besprechungsraum im 2. Stock, im Videocall mit unserem Kunden in Singapur. Das ging bis nach elf. Fragen Sie die IT, die Calls werden protokolliert.</p>
<p class="q">Und die Nachrichten auf Ihrem Handy?</p>
<p class="a">(seufzt) Ich will meiner Freundin einen Antrag machen. Der Ring liegt im Büro, damit sie ihn zu Hause nicht findet. Mein Bruder hat mir den ganzen Abend Tipps geschickt.</p>
`},

{ id: "08-verhoer-s4", title: "Vernehmung {S4}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S4}, {S4_FKT}</span></div>
<p class="q">Sie waren einer der Letzten im Haus.</p>
<p class="a">Ich habe nach der Feier noch kurz Mails beantwortet und bin um 22:31 durch den Haupteingang raus. Dann bin ich noch eine Runde im {PARK} gelaufen, bis ungefähr Viertel nach elf.</p>
<p class="q">Um diese Uhrzeit? Nach einer Feier?</p>
<p class="a">Ich trainiere für den Firmenlauf. Heimlich, ich will die anderen überraschen. Meine Laufuhr zeichnet alles auf, die Daten können Sie haben.</p>
<p class="q">Ihr Auto stand die ganze Nacht in der Tiefgarage.</p>
<p class="a">Ja, nach dem Laufen hab ich mir ein Taxi genommen. Mit einem Glas Sekt fahre ich nicht.</p>
`},

{ id: "09-verhoer-kral", title: "Vernehmung Sabine Kral", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: Sabine Kral, Juniorpartnerin</span></div>
<p class="q">Frau Kral, Sie haben mit Dr. Reiher 15 Jahre zusammengearbeitet.</p>
<p class="a">Er war mein Mentor. Ich kann es noch gar nicht fassen.</p>
<p class="q">Wussten Sie, woran er bei der {FIRMA} gearbeitet hat?</p>
<p class="a">Nur grob. Konstantin hat bei solchen Aufträgen niemandem etwas erzählt, nicht einmal mir.</p>
<p class="q">Wann haben Sie die Feier verlassen?</p>
<p class="a">Um 21:40. Ich bin direkt ins Hotel nach {NACHBARSTADT} gefahren, das sind zehn Minuten. Um 21:50 war ich dort und bin gleich schlafen gegangen.</p>
<p class="q">Haben Sie Dr. Reiher am Abend etwas gebracht?</p>
<p class="a">Nein. Er holt sich seinen Tee immer selbst, da ist er eigen.</p>
<p class="q">Sie übernehmen jetzt die Kanzlei?</p>
<p class="a">Das war immer so vereinbart. Ich hätte mir gewünscht, dass es anders passiert.</p>
`},

{ id: "10-catering", title: "Lieferschein und Aussage Catering", kind: "Beleg", html: `
<div class="receipt">
<div class="r-head">Genusswerk Catering · Lieferschein Nr. 4471-B</div>
<p>Veranstaltung: Strategieabend {FIRMA} · {RAUM_FEIER}</p>
<table class="grid">
<tr><th>Position</th><th>Menge</th><th>Abgeholt</th><th>Karte</th></tr>
<tr><td>Fingerfood-Buffet</td><td>1</td><td>19:00</td><td>–</td></tr>
<tr><td>Sekt, Wein, Softdrinks</td><td>–</td><td>laufend</td><td>–</td></tr>
<tr><td><strong>Sondertee Pfefferminz</strong> (Sonderwunsch Dr. Reiher)</td><td>1</td><td><strong>{TATZEIT}</strong></td><td>Gästekarte {GASTKARTE}</td></tr>
<tr><td>Espresso</td><td>14</td><td>laufend</td><td>–</td></tr>
</table>
<p class="small">Sonderbestellungen werden nur gegen Vorzeigen einer Mitarbeiter- oder Gästekarte ausgegeben.</p>
</div>
<div class="letterhead" style="margin-top:28px"><strong>Aktenvermerk</strong><span>Aussage Catering-Mitarbeiterin M. Hölzl</span></div>
<p class="a">„Den Pfefferminztee hat eine Frau abgeholt, das war genau um {TATZEIT} – ich hab's gleich eingetragen, weil der Chef das bei Sonderwünschen will. Sie hat ihre Gästekarte hergezeigt und gesagt, sie bringt ihn Dr. Reiher. Dann hat sie noch aus einem kleinen braunen Fläschchen was reingetropft. Ich hab gedacht, das ist Süßstoff. Gesicht? Nein, tut mir leid, da war so viel los.“</p>
`},

{ id: "11-zutritt", title: "Zutrittsprotokoll", kind: "Systemauszug", html: `
<div class="letterhead"><strong>Zutrittssystem · Export</strong><span>{FIRMA} · Donnerstag 21:00 – Freitag 06:00</span></div>
<table class="grid mono">
<tr><th>Zeit</th><th>Tür</th><th>Karte</th><th>Richtung</th></tr>
<tr><td>21:12</td><td>{RAUM_FEIER}</td><td>Mitarbeiterkarte {S3}</td><td>hinaus</td></tr>
<tr><td>21:44</td><td>Haupteingang</td><td>Gästekarte 11</td><td>hinaus</td></tr>
<tr><td>22:15</td><td>Haupteingang</td><td>Mitarbeiterkarte {S2}</td><td>hinaus</td></tr>
<tr><td>22:15</td><td>Haupteingang</td><td>Mitarbeiterkarte {S1}</td><td>hinaus</td></tr>
<tr><td>22:27</td><td>{RAUM_TATORT}</td><td>Gästekarte 02 (Dr. Reiher)</td><td>hinein</td></tr>
<tr><td>22:29</td><td>Besprechung 2. OG</td><td>Mitarbeiterkarte {S3}</td><td>hinein</td></tr>
<tr><td>22:31</td><td>Haupteingang</td><td>Mitarbeiterkarte {S4}</td><td>hinaus</td></tr>
<tr><td><strong>22:47</strong></td><td><strong>{RAUM_TATORT}</strong></td><td><strong>Gästekarte {GASTKARTE}</strong></td><td>hinein</td></tr>
<tr><td>22:53</td><td>{RAUM_TATORT}</td><td>Gästekarte {GASTKARTE}</td><td>hinaus</td></tr>
<tr><td>22:58</td><td>Stiegenhaus → Parkdeck 2</td><td>Gästekarte {GASTKARTE}</td><td>hinaus</td></tr>
<tr><td>23:21</td><td>Besprechung 2. OG</td><td>Mitarbeiterkarte {S3}</td><td>hinaus</td></tr>
</table>
<p class="small">Gästekarten sind nicht personalisiert. Die Ausgabe wird am Empfang in einer Liste vermerkt.</p>
`},

{ id: "12-gaestekarten", title: "Ausgabeliste Gästekarten", kind: "Liste", html: `
<div class="letterhead"><strong>Empfang · Ausgabeliste Gästekarten</strong><span>Strategieabend, Donnerstag</span></div>
<table class="grid">
<tr><th>Karte</th><th>Ausgegeben an</th><th>Zeit</th><th>Grund</th><th>Rückgabe</th></tr>
<tr><td>02</td><td>Dr. K. Reiher</td><td>16:00</td><td>Berater, Projekt Phoenix</td><td>–</td></tr>
<tr><td>05</td><td>Catering Genusswerk (Team)</td><td>17:30</td><td>Lieferung</td><td>23:40</td></tr>
<tr><td>{GASTKARTE}</td><td>S. Kral</td><td>19:05</td><td>„Workshop-Material für Dr. Reiher“</td><td><strong>fehlt</strong></td></tr>
<tr><td>11</td><td>Fotograf M. Weber</td><td>19:10</td><td>Fotos Strategieabend</td><td>21:44</td></tr>
</table>
<p class="small">Hinweis Empfang: Karte {GASTKARTE} wurde bis heute früh nicht zurückgegeben.</p>
`},

{ id: "13-asservaten", title: "Asservatenliste Dr. Reiher", kind: "Liste", html: `
<div class="letterhead"><strong>Polizei · Asservatenliste</strong><span>Persönliche Gegenstände Dr. K. Reiher, sichergestellt im {RAUM_TATORT}</span></div>
<table class="grid">
<tr><th>Nr.</th><th>Gegenstand</th><th>Fundort</th></tr>
<tr><td>1</td><td>Brieftasche mit Ausweis, Bankkarte, 85 € Bargeld</td><td>Sakko, Innentasche</td></tr>
<tr><td>2</td><td>Mobiltelefon (gesperrt)</td><td>Tisch</td></tr>
<tr><td>3</td><td>Notizbuch, schwarz, mit Klebezettel</td><td>Sakko, Innentasche</td></tr>
<tr><td>4</td><td>Teetasse, Reste von Pfefferminztee</td><td>Tisch</td></tr>
<tr><td>5</td><td>Aktentasche, geöffnet; darin leerer {DG_HUELLE} mit Aufschrift „Projekt Phoenix – B“</td><td>Boden</td></tr>
<tr><td>6</td><td>Gästekarte 02</td><td>Tisch</td></tr>
</table>
<p class="note">Vermerk: Laut Ehefrau fuhr Dr. Reiher mit seinem eigenen Wagen zur {FIRMA}. <strong>Ein Autoschlüssel wurde nicht gefunden.</strong></p>
`},

{ id: "14-notizbuch", title: "Reihers Notizbuch", kind: "Notiz", html: `
<div class="notebook">
<p class="nb-date">Mi.</p>
<p>Leck bei Phoenix bestätigt. Veridian Systems kennt Details, die nur das Projektteam oder wir kennen können.</p>
<p>Veridian zahlt „Beratungshonorare“ an jemanden aus dem Umfeld. Konto endet auf ?? – steht im Partnerbereich.</p>
<p class="nb-date">Do.</p>
<p>16:00 – {DG_AKK} (Exemplar B) im Labor abgeholt. Beweis für morgen 9:00 bei {AUFTRAGGEBER}. Nicht aus der Hand geben!</p>
<p>Abends Strategieabend. S. hat gefragt, was ich morgen präsentiere. Nichts gesagt.</p>
<p>Tee nicht vergessen – nur Pfefferminz!</p>
<div class="postit">
<strong>veridian-systems · Partner</strong><br>
Benutzer: partner-7<br>
Passwort: Name meines treuesten Begleiters + Gründungsjahr der Kanzlei<br>
<span>(alles klein, ohne Leerzeichen)</span>
</div>
</div>
`},

{ id: "15-mail", title: "Mail Reiher an {AUFTRAGGEBER}", kind: "E-Mail", html: `
<div class="mail">
<div class="mail-head">
<div><span>Von:</span> Dr. Konstantin Reiher</div>
<div><span>An:</span> {AUFTRAGGEBER}</div>
<div><span>Gesendet:</span> Mittwoch, 18:10</div>
<div><span>Betreff:</span> Phoenix – Befund</div>
</div>
<p>Liebe/r {AUFTRAGGEBER},</p>
<p>der Befund steht. Das Leck ist real, und es sitzt näher, als uns beiden lieb sein kann. Ich möchte das nicht per Mail ausführen.</p>
<p>Ich lasse mir morgen {DG_AKK} (Exemplar B) aushändigen. Wenn ich damit recht habe, sieht man den Unterschied zu Veridians neuem Produkt auf den ersten Blick – oder eben nicht.</p>
<p>Freitag, 9:00 Uhr, in Ihrem Büro. Bitte niemanden einweihen, auch nicht in meiner Kanzlei.</p>
<p>Herzliche Grüße<br>K. Reiher</p>
</div>
`},

{ id: "16-spesen", title: "Spesenabrechnung Kanzlei", kind: "Beleg", html: `
<div class="letterhead"><strong>Reiher &amp; Kral Unternehmensberatung</strong><span>seit 2011 · Spesenabrechnung</span></div>
<table class="kv">
<tr><th>Mitarbeiterin</th><td>Sabine Kral</td></tr>
<tr><th>Zeitraum</th><td>laufender Monat</td></tr>
<tr><th>Auszahlung auf</th><td class="mono">AT61 1904 3002 3457 {KONTO}</td></tr>
</table>
<table class="grid">
<tr><th>Datum</th><th>Posten</th><th>Betrag</th></tr>
<tr><td>Mo.</td><td>Bahnticket Wien–Linz</td><td>€ 38,60</td></tr>
<tr><td>Di.</td><td>Mietwagen, 4 Tage, Kennzeichen {KENNZ_MIET}</td><td>€ 214,00</td></tr>
<tr><td>Do.</td><td>Hotel {NACHBARSTADT}er Hof, 1 Nacht</td><td>€ 129,00</td></tr>
<tr><td>Do.</td><td>Apotheke (privat, bitte nicht erstatten)</td><td>€ 12,40</td></tr>
</table>
<p class="small">Freigabe: offen – Dr. Reiher (Unterschrift fehlt)</p>
`},

{ id: "17-alibis", title: "Alibi-Belege", kind: "Belege", html: `
<div class="receipt">
<div class="r-head">Taxi 60160 · Quittung</div>
<p>Donnerstag · Abfahrt 22:15 · {FIRMA} → Innenstadt · 2 Fahrgäste · € 18,40</p>
</div>
<div class="receipt">
<div class="r-head">IT-Protokoll Videokonferenz</div>
<p>Raum Besprechung 2. OG · Teilnehmer: {S3} ({FIRMA}), Kunde Singapur · Beginn 22:30 · Ende 23:20 · Kamera aktiv über die gesamte Dauer.</p>
</div>
<div class="receipt">
<div class="r-head">Laufuhr-Export {S4}</div>
<p>Start 22:35 · {PARK} · 9,2 km · Ende 23:15 · durchgehende GPS-Aufzeichnung, Herzfrequenz Ø 152.</p>
</div>
<div class="receipt">
<div class="r-head">{NACHBARSTADT}er Hof · Meldeschein</div>
<p>Gast: Sabine Kral · Anreise mit Pkw {KENNZ_MIET} · <strong>Check-in: 23:58</strong> · Nachtportier: „Gast wirkte gehetzt, wollte keinen Weckruf.“</p>
</div>
`},

{ id: "18-garage", title: "Tiefgarage: Parkplatzliste und Sicherheitsprotokoll", kind: "Liste", html: `
<div class="letterhead"><strong>Tiefgarage {FIRMA}</strong><span>Parkdeck 2 · Belegung Donnerstagabend</span></div>
<table class="grid mono">
<tr><th>Stellplatz</th><th>Kennzeichen</th><th>Nutzer</th></tr>
<tr><td>P2-10</td><td>–</td><td>frei</td></tr>
<tr><td>{STELLPLATZ_S4}</td><td>{KENNZ_S4}</td><td>{S4}</td></tr>
<tr><td>{STELLPLATZ}</td><td>{KENNZ_REIHER}</td><td>Gast: Dr. K. Reiher</td></tr>
<tr><td>{STELLPLATZ_KRAL}</td><td>{KENNZ_MIET}</td><td>Gast: Reiher &amp; Kral</td></tr>
<tr><td>P2-20</td><td>–</td><td>Lieferzone Catering</td></tr>
</table>
<div class="letterhead" style="margin-top:26px"><strong>Sicherheitsdienst · Ausfahrtskontrolle</strong><span>Nach 22:00 Uhr werden Taschen bei der Ausfahrt kontrolliert (Projekt Phoenix).</span></div>
<table class="grid mono">
<tr><th>Zeit</th><th>Kennzeichen</th><th>Kontrolle</th></tr>
<tr><td>23:12</td><td>{KENNZ_MIET}</td><td>Handtasche, Laptoptasche – ohne Befund</td></tr>
<tr><td>23:40</td><td>Catering-Transporter</td><td>Geschirrkisten – ohne Befund</td></tr>
</table>
<p class="small">Die Fahrzeuge {KENNZ_REIHER} und {KENNZ_S4} haben die Garage in der Nacht nicht verlassen.</p>
`},

{ id: "19-fund", title: "Fundbericht Parkdeck 2", kind: "Bericht", html: `
<div class="letterhead"><strong>Reinigung · Fundbericht</strong><span>Freitag, 06:50</span></div>
<p>Beim Leeren des Papierkorbs neben dem Stiegenhaus auf Parkdeck 2 (zwischen den Stellplätzen P2-10 und P2-20) wurde gefunden:</p>
<p class="evidence">{DG_FRAG}</p>
<p>Der Gegenstand lag obenauf, der Papierkorb war am Donnerstag um 18:00 Uhr geleert worden. Das Fundstück wurde an den Empfang übergeben.</p>
<p class="small">Laut Labor gehört die Nummer PHX-B zu {DG_DAT} von Projekt Phoenix, Exemplar B.</p>
`},
];

// ---------------------------------------------------------------------------
// Fall-Website der (erfundenen) Konkurrenzfirma
// ---------------------------------------------------------------------------
export const FIRMA_WEB = {
  name: "Veridian Systems",
  claim: "Wir bringen Ideen schneller auf den Markt.",
  login: { user: "partner-7", password: "bruno2011" },
  pages: [
    { id: "start", title: "Start", html: `
<section class="v-hero"><h1>Veridian Systems</h1><p>Wir bringen Ideen schneller auf den Markt.</p></section>
<p>Seit 2014 entwickeln wir Lösungen für Industrie, Handel und Dienstleistung – schneller als der Wettbewerb, weil wir wissen, was der Markt morgen braucht.</p>
<div class="v-cards"><div><strong>Innovation</strong><p>Von der Idee zum Produkt in Rekordzeit.</p></div><div><strong>Partnerschaft</strong><p>Unser Netzwerk reicht weiter, als Sie denken.</p></div><div><strong>Diskretion</strong><p>Was Sie uns anvertrauen, bleibt bei uns.</p></div></div>
` },
    { id: "news", title: "News", html: `
<h2>Pressemitteilung</h2>
<p class="v-date">Diese Woche</p>
<h3>Veridian kündigt Marktneuheit an</h3>
<p>Am kommenden Freitag um 14:00 Uhr präsentiert Veridian Systems eine Neuheit, die „einen ganzen Markt verändern wird“. Details bleiben bis zur Präsentation geheim.</p>
<p>„Wir haben in Rekordzeit entwickelt, wofür andere Jahre brauchen“, so Vorstand Dr. Felix Moravec.</p>
` },
    { id: "team", title: "Team", html: `
<h2>Vorstand</h2>
<ul class="v-team"><li><strong>Dr. Felix Moravec</strong><span>CEO</span></li><li><strong>Ines Hartl</strong><span>Chief Technology Officer</span></li><li><strong>Georg Lindner</strong><span>Vertrieb &amp; Partnerschaften</span></li></ul>
<p>Unser Partnerprogramm steht ausgewählten Beraterinnen und Beratern offen. Partner melden sich im Partnerbereich an.</p>
` },
    { id: "kontakt", title: "Kontakt", html: `
<h2>Kontakt</h2>
<p>Veridian Systems GmbH<br>Industriestraße 40<br>Graz</p>
<p>Diese Firma ist frei erfunden und Teil eines Mordsteam-Krimispiels.</p>
` },
  ],
  partner: `
<h2>Partnerbereich</h2>
<p>Willkommen zurück, <strong>Partner 7</strong>.</p>
<h3>Honorare</h3>
<table class="grid"><tr><th>Datum</th><th>Verwendungszweck</th><th>Betrag</th><th>Empfängerkonto</th></tr>
<tr><td>vor 3 Monaten</td><td>Beratung Projekt P. – Teil 1</td><td>€ 25.000</td><td class="mono">AT61 …… …{KONTO}</td></tr>
<tr><td>vor 5 Wochen</td><td>Beratung Projekt P. – Teil 2</td><td>€ 25.000</td><td class="mono">AT61 …… …{KONTO}</td></tr>
<tr><td>offen</td><td>Übergabe Exemplar – Schlusszahlung</td><td>€ 100.000</td><td class="mono">AT61 …… …{KONTO}</td></tr>
</table>
<h3>Nachrichten</h3>
<div class="v-msg"><span>Partner 7 → Veridian · Donnerstag, 23:31</span><p>Es gab ein Problem, aber alles unter Kontrolle. Das Exemplar liegt sicher im Wagen des Alten – dort sucht keiner. Ich hole es morgen um 11:30. Übergabe wie vereinbart um 12:00.</p></div>
<div class="v-msg"><span>Veridian → Partner 7 · Donnerstag, 23:40</span><p>Keine Fehler mehr. 12:00 Uhr, Hintereingang.</p></div>
`,
};
