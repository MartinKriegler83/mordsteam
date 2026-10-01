// Mordsteam Solo 001 – „Nachtzug nach Venedig“
// Ein/e Ermittler/in, 40 Minuten, drei Fragen nacheinander. Der Täter wird pro Durchgang ausgelost.
// Beweisstücke: fest (gleich in jeder Variante) oder variabel (abhängig vom Täter, Parameter c).
// Personalisiert ist nur der Spielername (N, bereits HTML-escaped).

export const ID = "solo-001";
export const TITLE = "Nachtzug nach Venedig";
export const LIMIT_MIN = 40;        // Restfahrzeit bis Udine
export const TRAIN_START = 2 * 60 + 15; // Zuguhr beim Start: 02:15

// Zeitvarianten: Der ganze Tatblock (01:00–02:10) verschiebt sich je Durchgang um D Minuten.
// Alles davor (Abend, Cognac 00:52) und der Fund um 02:12 bleiben gleich. Tatzeit = 01:31 + D.
// So hat jeder Durchgang eine andere Antwort auf Frage 1, die Logik bleibt in jeder Variante identisch.
export const TIME_SHIFTS = [0, -4, 6, 12];   // Tatzeit 01:31 · 01:27 · 01:37 · 01:43
const pad2 = (n) => String(n).padStart(2, "0");
export const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const fmt = (x) => `${pad2(Math.floor(((x % 1440) + 1440) % 1440 / 60))}:${pad2(((x % 60) + 60) % 60)}`;
export const shiftOf = (v) => TIME_SHIFTS[v || 0] || 0;
// Uhrzeit im Tatblock verschieben, alles andere unverändert lassen
export function timer(v) {
  const D = shiftOf(v);
  return (t) => { const x = hm(t); return x >= 60 && x < 130 ? fmt(x + D) : t; };
}
// ungefähre Uhrzeit in Worten, wie Mitreisende sie nennen („kurz nach halb zwei“)
function roughly(t) {
  const q = Math.round(hm(t) / 5) * 5;
  const W = { 75: "gegen Viertel nach eins", 80: "gegen zwanzig nach eins", 85: "kurz vor halb zwei", 90: "gegen halb zwei", 95: "kurz nach halb zwei",
    100: "gegen zwanzig vor zwei", 105: "gegen Viertel vor zwei", 110: "gegen zehn vor zwei", 115: "kurz vor zwei", 120: "gegen zwei" };
  return W[q] || `gegen ${fmt(q)}`;
}
export const cap = (x) => x[0].toUpperCase() + x.slice(1);

export const SUSPECTS = {
  helene: { name: "Helene Marquardt", short: "Helene", ini: "H. M.", abt: "Abteil 3", spot: "regal328" },
  jonas: { name: "Jonas Hallwachs", short: "Jonas", ini: "J. H.", abt: "Abteil 5", spot: "regal326" },
  sofia: { name: "Sofia Benedetti", short: "Sofia", ini: "S. B.", abt: "Abteil 6", spot: "notsitz327" },
  anton: { name: "Anton Kofler", short: "Anton", ini: "A. K.", abt: "Dienstabteil 1", spot: "heizung327" },
  lang: { name: "Dr. Friedrich Lang", short: "Lang", ini: "F. L.", abt: "Wagen 328, Abteil 12", spot: "schrank328" },
};
export const CULPRITS = Object.keys(SUSPECTS);

// Mögliche Verstecke im Zug (Frage 3). Das Versteck hängt vom Täter ab: auf seinem Weg nach der Tat,
// groß genug (46 cm), für ihn zugänglich und noch nicht durchsucht – nur so bleibt genau ein Ort übrig.
export const SPOTS = {
  regal328: { name: "Gepäckregal am Einstieg, Wagen 328", innen: "90 cm", zugang: "offen" },
  schrank328: { name: "Kleiderschrank im Gang, Wagen 328", innen: "60 cm", zugang: "offen" },
  regal326: { name: "Gepäckregal am Wagenende, Liegewagen 326", innen: "90 cm", zugang: "offen" },
  schirm325: { name: "Schirmständer, Speisewagen 325", innen: "45 cm", zugang: "offen" },
  heizung327: { name: "Heizungsverkleidung im Gang, Wagen 327", innen: "50 cm", zugang: "nur mit Vierkantschlüssel (Zugpersonal)" },
  waesche327: { name: "Wäschefach im Dienstabteil, Wagen 327", innen: "80 cm", zugang: "abgesperrt, Schlüssel hat der Schaffner" },
  notsitz327: { name: "Staufach unter dem Notsitz vor Abteil 6, Wagen 327", innen: "48 cm", zugang: "offen" },
};
// Von der Zugbegleiterin bereits durchsucht (leer) – je nach Variante
export const SEARCHED = { helene: ["notsitz327", "schrank328"], jonas: ["notsitz327"], sofia: ["regal326"], anton: ["waesche327", "notsitz327"], lang: ["notsitz327", "regal328"] };

// ---------- Fragen ----------
export const QUESTIONS = [
  { key: "zeit", nr: 1, type: "time", label: "Um wie viel Uhr hat Viktor Hallwachs seinen Mörder ins Abteil gelassen?", hint: "Uhrzeit, z. B. 23:45" },
  { key: "taeter", nr: 2, type: "select", label: "Wer hat Viktor Hallwachs vergiftet?", hint: "Nur eine Person hatte die Gelegenheit.",
    options: CULPRITS.map((k) => [k, SUSPECTS[k].name]) },
  { key: "versteck", nr: 3, type: "select", label: "Wo ist das echte Gemälde versteckt?", hint: "Die Polizei öffnet nur einen Ort. Wähle genau.",
    options: Object.keys(SPOTS).map((k) => [k, SPOTS[k].name]) },
];
export function solution(c, v) {
  return { zeit: timer(v)("01:31"), taeter: c, versteck: SUSPECTS[c].spot };
}

// ---------- Hinweise (3 Stufen, kosten Strafminuten) ----------
export const HINT_PENALTY = [1, 2, 3];
export const WRONG_PENALTY = 3;
export const HINTS = (v) => ({
  zeit: [
    "Die Zugärztin grenzt den Todeszeitpunkt ein.",
    "Ein Besuch hinterlässt zwei Öffnungen von innen: beim Hereinlassen und beim Gehen.",
    "Im Todeszeitfenster bleibt genau ein solches Paar. Gefragt ist die erste der beiden Öffnungen.",
  ],
  taeter: [
    "Wer war zur Tatzeit nachweislich woanders?",
    "Prüfe für jede Person einen Beleg aus Protokollen, Quittungen und Notizen.",
    `Nur eine Person hat für ${timer(v)("01:31")} bis ${timer(v)("01:39")} keinen Beleg. Achtung: Eine Aussage allein ist kein Beleg.`,
  ],
  versteck: [
    "Die Rolle ist 46 cm lang. Streiche zuerst alle Orte, die innen zu klein sind.",
    "Das Protokoll der Übergangstüren zeigt, in welche Wagen der Täter nach der Tat gegangen ist – nur dort kann das Bild sein.",
    "Streiche außerdem, was schon durchsucht ist oder was der Täter nicht öffnen kann. Auf seinem Weg bleibt genau ein Ort übrig.",
  ],
});

// ---------- Einsatzauftrag (vor dem Start) ----------
export function briefing(N) {
  return {
    eyebrow: "Nachtzug „La Serenissima“ · Wien – Venedig",
    title: "Nachtzug nach <em>Venedig</em>",
    text: `Es ist 02:15 Uhr, irgendwo hinter Villach. Es klopft an deinem Abteil. Schaffner Anton Kofler steht in der Tür, blass: „${N}, entschuldigen Sie – Sie lesen doch Krimis? Ich hab das Buch auf Ihrem Bett gesehen. Im Abteil nebenan liegt Herr Hallwachs. Er ist tot. Um 02:55 halten wir in Udine, dann steigt die Polizei zu. Bis dahin … könnten Sie sich das ansehen?“`,
    steps: [
      ["Akte lesen", "Du startest mit den Unterlagen vom Tatort. Nach jeder richtigen Antwort kommen neue Beweisstücke dazu – sie sind mit „Neu“ markiert."],
      ["Drei Fragen, der Reihe nach", "Tatzeit, Täter, Versteck des Gemäldes. Die nächste Frage wird frei, sobald die vorige gelöst ist."],
      ["Hinweise kosten Zeit", `Bis zu drei Hinweise pro Frage: +${HINT_PENALTY.join(", +")} Strafminuten. Jede falsche Antwort kostet +${WRONG_PENALTY} Minuten.`],
      ["Vor Udine fertig sein", `${LIMIT_MIN} Minuten bis Udine. Die Uhr läuft auch danach weiter – deine Zeit plus Strafminuten ergibt deine Wertung.`],
      ["Fair Play", "Keine KI, keine Suchmaschine. Der Fall ist mit Köpfchen lösbar."],
    ],
  };
}

// ---------- Beweisstücke ----------
// stage: ab welcher Stufe sichtbar (1 = Start, 2 = nach Frage 1, 3 = nach Frage 2)
const A = (c) => c === "anton", S = (c) => c === "sofia";

export function docs(c, N, v) {
  const d = [], s = timer(v);
  // ----- Stufe 1: Tatort -----
  d.push({ id: "fundort", stage: 1, kind: "Notiz", title: "Fundortbericht Abteil 4", html: `
<div class="letterhead"><strong>Schlafwagen 327 · Fundortbericht</strong><span>aufgenommen von Schaffner A. Kofler, ${s("02:13")} Uhr</span></div>
<p>${s("02:12")} Uhr: Abteil 4 (Fahrgast Viktor Hallwachs, Kunsthändler, Wien) reagiert nicht auf Klopfen. Mit der Generalkarte geöffnet.</p>
<ul>
<li>Herr Hallwachs liegt angezogen auf dem Bett. Kein Puls, Haut kühl.</li>
<li>Auf dem Klapptisch: Cognacglas, halb leer, bitterer Geruch. Daneben ein Buch und die Lesebrille. Den Cognac hat ihm um ${s("00:52")} die Kellnerin aus dem Speisewagen gebracht und an der Tür übergeben (Zimmerservice).</li>
<li>Offener Koffer: darin ein gerahmtes Gemälde, „Lagune im Nebel“, Rahmen 46 × 61 cm.</li>
<li>Fenster verriegelt. Keine Kampfspuren, nichts umgeworfen.</li>
<li>Die Abteiltür fällt nach jedem Öffnen von selbst zu und verriegelt sich. Von außen öffnet sie nur die Fahrgastkarte von Abteil 4 oder meine Generalkarte.</li>
</ul>
<p class="meta">Zugärztin aus Wagen 328 verständigt. Zugchef informiert. Abteil versiegelt.</p>
<p class="sign">A. Kofler <span>· Schlafwagenschaffner</span></p>` });

  d.push({ id: "aerztin", stage: 1, kind: "Befund", title: "Kurzbefund der Zugärztin", html: `
<div class="letterhead"><strong>Dr. Lucia Moretti · Ärztin</strong><span>reist privat mit, Wagen 328 · Kurzbefund</span></div>
<p>Todesursache (vorläufig): Überdosis eines Schlafmittels. Pupillen, Geruch und Glas sprechen für ein Präparat, das im Cognac aufgelöst wurde. Es wirkt innerhalb weniger Minuten.</p>
<p>Todeszeitpunkt (geschätzt): zwischen ${s("01:20")} und ${s("01:50")} Uhr. Früher nicht – die Körpertemperatur passt nicht dazu.</p>
<p>Sonstiges: Keine Verletzungen, keine Abwehrspuren. Er hat seinen Mörder offenbar gekannt und nichts befürchtet.</p>
<div class="postit">${N}, der Schaffner sagt, Sie lösen das. Ich halte Ihnen die Daumen – in Udine will ich der Polizei einen Namen nennen. <span>– L. M.</span></div>` });

  d.push({ id: "wagen", stage: 1, kind: "Liste", title: "Fahrgastliste und Zugaufbau", html: `
<div class="letterhead"><strong>Fahrgastliste Schlafwagen 327</strong><span>Nachtzug „La Serenissima“ · Wien Hbf ab ${s("21:25")} · Venezia S. Lucia an ${s("07:40")}</span></div>
<table class="grid"><tr><th>Abteil</th><th>Belegung</th></tr>
<tr><td>Dienst 1</td><td>Anton Kofler, Schlafwagenschaffner</td></tr>
<tr><td>2</td><td>${N}</td></tr>
<tr><td>3</td><td>Helene Marquardt, Galeristin, Wien</td></tr>
<tr><td>4</td><td>Viktor Hallwachs, Kunsthändler, Wien</td></tr>
<tr><td>5</td><td>Jonas Hallwachs, Student, Wien</td></tr>
<tr><td>6</td><td>Sofia Benedetti, Journalistin, Triest</td></tr></table>
<h3>Schlafwagen 328 (Auszug)</h3>
<table class="grid"><tr><th>Abteil</th><th>Belegung</th></tr>
<tr><td>12</td><td>Dr. Friedrich Lang, Kunstgutachter, Salzburg</td></tr>
<tr><td>14</td><td>Dr. Lucia Moretti, Ärztin, Padua</td></tr></table>
<h3>Zugaufbau (von vorne)</h3>
<p class="mono">[Lok] · 324 Sitzwagen · 325 Speisewagen · 326 Liegewagen · 327 Schlafwagen · 328 Schlafwagen</p>
<p class="small">WC für Wagen 327 am hinteren Wagenende, neben Abteil 6.</p>` });

  d.push({ id: "befragung", stage: 1, kind: "Protokoll", title: "Kurzbefragungen der Mitreisenden", html: `
<div class="letterhead"><strong>Kurzbefragungen nach dem Fund</strong><span>notiert von A. Kofler und Dr. L. Moretti</span></div>
<p class="q">Helene Marquardt, Abteil 3 – Geschäftspartnerin</p>
<p class="a">„Viktor wollte unsere Galerie auflösen. Ja, ich war wütend – dreißig Jahre Arbeit! Aber umbringen? Ich konnte nicht schlafen und saß im Speisewagen, Tisch 3, bei einem Tee. ${shiftOf(v) <= 6 ? "Bis fast zwei." : "Bis etwa zwei."}“</p>
<p class="q">Jonas Hallwachs, Abteil 5 – Neffe</p>
<p class="a">„Onkel Viktor und ich hatten Streit wegen Geld, das weiß jeder. Ich hab ein paar Schulden. Ich war im Speisewagen und hab am Handy gezeichnet. Da ist das WLAN besser.“</p>
<p class="q">Sofia Benedetti, Abteil 6 – Journalistin</p>
<p class="a">„Ich schreibe über gefälschte Bilder aus seiner Galerie, er hat mir mit einer Klage gedroht. Heute Nacht hatte ich im Liegewagen Streit mit einem Mann, der mich fotografiert haben wollte – so ${roughly(s("01:30"))}. Fragen Sie den Schaffner, er kam dazu.“</p>
<p class="q">Anton Kofler, Dienstabteil 1 – Schaffner</p>
<p class="a">„Hallwachs hat meinem Bruder vor Jahren eine Menge Geld abgenommen, das stimmt. Aber ich hab heute Nacht gearbeitet. ${S(c) ? `Kurz nach eins hab ich im Liegewagen einen Streit von Frau Benedetti geschlichtet, danach war ich auf Kontrollgang.` : `${cap(roughly(s("01:30")))} war ich im Liegewagen, den Streit von Frau Benedetti schlichten, und um ${s("01:34")} hab ich dem Zugchef gefunkt.`}“</p>
<p class="q">Dr. Friedrich Lang, Wagen 328, Abteil 12 – Kunstgutachter</p>
<p class="a">„Ja, ich war kurz vor Mitternacht bei ihm, eine Viertelstunde vielleicht. Ich habe ihm mein Gutachten zur ‚Lagune‘ gebracht – er war bester Laune. Dass er mich damit in der Hand hatte, wissen Sie ja offenbar schon. ${cap(roughly(s("01:28")))} war ich bei der Ärztin, meine Migräne.“</p>
<p class="small">Außer Dr. Lang sagen alle, sie hätten Herrn Hallwachs am Abend nicht mehr gesehen.</p>` });

  d.push({ id: "tuer", stage: 1, kind: "Systemauszug", kk: "Systemauszug", title: "Türprotokoll Abteil 4", html: `
<div class="letterhead"><strong>Türsteuerung Schlafwagen 327</strong><span>Protokoll Abteil 4 · Ausdruck nach dem Fund</span></div>
<p>Wichtig: „innen · Taster“ heißt, jemand im Abteil hat die Tür geöffnet – auch wer das Abteil verlässt, muss innen den Taster drücken. Die Tür fällt danach von selbst zu.</p>
<table class="grid"><tr><th>Zeit</th><th>Ereignis</th><th>Auslöser</th></tr>
<tr><td class="mono">${s("23:10")}</td><td>geöffnet</td><td>außen · Fahrgastkarte Abt. 4</td></tr>
<tr><td class="mono">${s("23:48")}</td><td>geöffnet</td><td>innen · Taster (einlassen oder hinausgehen)</td></tr>
<tr><td class="mono">${s("00:06")}</td><td>geöffnet</td><td>innen · Taster (einlassen oder hinausgehen)</td></tr>
<tr><td class="mono">${s("00:52")}</td><td>geöffnet</td><td>innen · Taster (einlassen oder hinausgehen)</td></tr>
<tr><td class="mono">${s("01:31")}</td><td>geöffnet</td><td>innen · Taster (einlassen oder hinausgehen)</td></tr>
<tr><td class="mono">${s("01:39")}</td><td>geöffnet</td><td>innen · Taster (einlassen oder hinausgehen)</td></tr>
<tr><td class="mono">${s("02:12")}</td><td>geöffnet</td><td>außen · Generalkarte K-01</td></tr></table>
<p class="small">Die Karte von Abteil 4 lag auf dem Klapptisch.</p>` });

  // ----- Stufe 2: Protokolle und Belege -----
  const langGuilty = c === "lang";
  d.push({ id: "moretti", stage: 2, kind: "Notiz", title: "Notizen der Ärztin zur Nacht", html: `
<div class="letterhead"><strong>Dr. L. Moretti · Notizen</strong><span>Wagen 328, Abteil 14 · für die Polizei</span></div>
<div class="notebook">
<p><span class="nb-date">${s("22:40")}</span> Abendessen im Speisewagen, danach Abteil. Gelesen.</p>
${langGuilty
    ? `<p><span class="nb-date">${s("01:08")}</span> Herr Dr. Lang (Abt. 12) klopft, Migräne. Tablette gegeben. Nach fünf Minuten wieder in seinem Abteil.</p>`
    : `<p><span class="nb-date">${s("01:28")}</span> Herr Dr. Lang (Abt. 12) klopft, Migräne. Tablette und Tee. Er blieb bis ${s("01:46")} und erzählte von Auktionen.</p>`}
<p><span class="nb-date">${s("02:13")}</span> Schaffner holt mich nach 327. Hallwachs tot.</p>
</div>` });

  const heleneGuilty = c === "helene";
  // Bons in zeitlicher Reihenfolge (alle Zeiten nach Mitternacht)
  const bons = [
    [s("00:40"), `Zimmerservice Abt. 327/4 · 1 × Cognac VSOP · geliefert ${s("00:52")} (Giulia)`],
    [s("00:58"), "Tisch 3 · 1 × Kamillentee"],
    heleneGuilty ? [s("01:06"), `Tisch 3 · 1 × Butterkekse · bezahlt ${s("01:12")}`] : [s("01:30"), `Tisch 3 · 1 × Pfefferminztee · bezahlt ${s("01:49")}`],
    [s("01:10"), "Tisch 5 · 1 × Cola, 1 × Toast"],
    [s("01:36"), `Personalverzehr · 1 × Kaffee · ${S(c) ? "A. Kofler" : "Giulia"}`],
    [s("01:46"), "Tisch 5 · 1 × Espresso"],
  ];
  d.push({ id: "bon", stage: 2, kind: "Beleg", title: "Speisewagen: Bons und Zettel der Kellnerin", html: `
<div class="receipt"><div class="r-head">SPEISEWAGEN 325 · Tagesjournal Nacht</div>
${bons.sort((x, y) => x[0].localeCompare(y[0])).map((x) => `${x[0]} · ${x[1]}`).join("<br>")}</div>
<div class="postit">${heleneGuilty
      ? `Die Dame an Tisch 3 (graue Haare, Perlenkette) ist ca. um ${s("01:25")} gegangen. Kam nicht wieder.`
      : `Die Dame an Tisch 3 (graue Haare, Perlenkette) saß bis ca. ${s("01:50")} und hat gelesen. Hat zwischendurch noch Tee nachbestellt.`} <span>– Giulia, Speisewagen</span></div>
<p class="small">Tisch 5: junger Mann mit Handy und Kopfhörern.</p>` });

  const jonasGuilty = c === "jonas";
  d.push({ id: "wlan", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "WLAN-Protokoll des Zuges", html: `
<div class="letterhead"><strong>Bord-WLAN „Serenissima-Free“</strong><span>Anmeldungen je Zugangspunkt · Auszug ${s("00:30")}–${s("02:00")} Uhr</span></div>
<table class="grid"><tr><th>Gerät</th><th>Zugangspunkt</th><th>von</th><th>bis</th></tr>
${jonasGuilty ? `<tr><td>Jonas-Phone</td><td>AP 325 (Speisewagen)</td><td class="mono">${s("00:48")}</td><td class="mono">${s("01:27")}</td></tr>
<tr><td>Jonas-Phone</td><td>AP 327 (Schlafwagen)</td><td class="mono">${s("01:29")}</td><td class="mono">${s("01:41")}</td></tr>
<tr><td>Jonas-Phone</td><td>AP 325 (Speisewagen)</td><td class="mono">${s("01:43")}</td><td class="mono">${s("01:58")}</td></tr>`
    : `<tr><td>Jonas-Phone</td><td>AP 325 (Speisewagen)</td><td class="mono">${s("00:48")}</td><td class="mono">${s("01:12")}</td></tr>
<tr><td>Jonas-Phone</td><td>AP 325 (Speisewagen)</td><td class="mono">${s("01:14")}</td><td class="mono">${s("01:49")}</td></tr>
<tr><td>Jonas-Phone</td><td>AP 325 (Speisewagen)</td><td class="mono">${s("01:51")}</td><td class="mono">${s("01:58")}</td></tr>`}
<tr><td>Galaxy-7F2</td><td>AP 326 (Liegewagen)</td><td class="mono">${s("00:30")}</td><td class="mono">${s("02:00")}</td></tr>
<tr><td>iPad-Moretti</td><td>AP 328 (Schlafwagen)</td><td class="mono">${s("00:30")}</td><td class="mono">${s("01:05")}</td></tr>
<tr><td>Kofler-Dienst</td><td>AP 327 (Schlafwagen)</td><td class="mono">${s("00:30")}</td><td class="mono">${s("02:00")}</td></tr></table>
<p class="small">Ein Gerät meldet sich beim Zugangspunkt des Wagens an, in dem es sich befindet. „Kofler-Dienst“ ist das Diensttablet, es bleibt im Dienstabteil. Geht ein Handy kurz in den Ruhezustand, beginnt danach eine neue Zeile.</p>` });

  let nb = `<p><span class="nb-date">${s("23:40")}</span> Fahrkartenkontrolle 327 erledigt, alles ok.</p>
<p><span class="nb-date">${s("00:52")}</span> Cognac für Abt. 4 kam aus dem Speisewagen (Giulia).</p>`;
  if (S(c)) nb += `<p><span class="nb-date">${s("01:05")}</span> Wagen 326: Streit Fr. Benedetti (327/6) mit Fahrgast Liegeplatz 64 wegen Fotos. Hin, geschlichtet bis ${s("01:15")}.</p>
<p><span class="nb-date">${s("01:30")}</span> Kontrollgang 326 → 325, bis ${s("01:45")}. Ruhig.</p>`;
  else if (A(c)) nb += `<p><span class="nb-date">${s("01:30")}</span> Pause Dienstabteil.</p>
<p><span class="nb-date">${s("01:48")}</span> Meldung Kollegin Ferri (Speisewagen): Wagen 326, Streit Fr. Benedetti mit Fahrgast Liegeplatz 64 wegen Fotos, ca. ${s("01:30")}–${s("01:45")}. Hat sie selbst geschlichtet.</p>`;
  else nb += `<p><span class="nb-date">${s("01:30")}</span> Wagen 326: Streit Fr. Benedetti (327/6) mit Fahrgast Liegeplatz 64 wegen Fotos. Hin, geschlichtet bis ${s("01:45")}.</p>
<p><span class="nb-date">${s("01:47")}</span> Zurück in 327. Ruhig.</p>`;
  nb += `<p><span class="nb-date">${s("02:12")}</span> Abt. 4 keine Reaktion. Generalkarte. Hallwachs tot. Ärztin geholt.</p>`;
  d.push({ id: "notizbuch", stage: 2, kind: "Notiz", title: "Dienst-Notizbuch des Schaffners", html: `
<div class="letterhead"><strong>Dienstbuch A. Kofler</strong><span>Schlafwagen 327 · Nacht</span></div>
<div class="notebook">${nb}</div>` });

  d.push({ id: "kamera", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Sofias Kamera: Zeitstempel der Fotos", html: `
<div class="letterhead"><strong>Kamera S. Benedetti · Bildliste</strong><span>freiwillig vorgelegt · Zeitstempel der Kamera</span></div>
<table class="grid"><tr><th>Bild</th><th>Zeit</th><th>Motiv (lt. Vorschau)</th></tr>
<tr><td>IMG_2201</td><td class="mono">${s("00:44")}</td><td>Speisewagen, Tischlampe</td></tr>
${S(c) ? `<tr><td>IMG_2202</td><td class="mono">${s("01:03")}</td><td>Liegewagen 326, Gang</td></tr>
<tr><td>IMG_2203</td><td class="mono">${s("01:05")}</td><td>Liegeplatz 64, Mann hebt die Hand</td></tr>
<tr><td>IMG_2204</td><td class="mono">${s("01:18")}</td><td>Schlafwagen 327, Abteil 6, Notizblock</td></tr>
<tr><td>IMG_2205</td><td class="mono">${s("01:52")}</td><td>Schlafwagen 327, Gang, Fenster</td></tr>`
    : `<tr><td>IMG_2202</td><td class="mono">${s("01:28")}</td><td>Liegewagen 326, Gang</td></tr>
<tr><td>IMG_2203</td><td class="mono">${s("01:33")}</td><td>Liegeplatz 64, Mann hebt die Hand</td></tr>
<tr><td>IMG_2204</td><td class="mono">${s("01:37")}</td><td>${A(c) ? "Liegewagen 326, Kellnerin mit Tablett (unscharf)" : "Liegewagen 326, Schaffneruniform (unscharf)"}</td></tr>
<tr><td>IMG_2205</td><td class="mono">${s("01:52")}</td><td>Schlafwagen 327, Gang, Fenster</td></tr>`}</table>
<p class="small">Die Kamerauhr stimmt laut Vergleich mit der Zuguhr auf die Minute.</p>` });

  d.push({ id: "funk", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Zugfunk-Protokoll", html: `
<div class="letterhead"><strong>Zugfunk · Protokoll Zugchef</strong><span>Kanal 2 · Auszug ab ${s("01:00")} Uhr</span></div>
<table class="grid"><tr><th>Zeit</th><th>Von</th><th>Meldung</th></tr>
<tr><td class="mono">${s("01:02")}</td><td>Speisewagen</td><td>Kasse Nachtservice geöffnet.</td></tr>
${A(c) ? `<tr><td class="mono">${s("01:28")}</td><td>K-327 (Kofler)</td><td>Gehe in Pause, Dienstabteil, bis ca. ${s("01:45")}.</td></tr>
<tr><td class="mono">${s("01:47")}</td><td>K-327 (Kofler)</td><td>Pause beendet.</td></tr>`
    : S(c) ? `<tr><td class="mono">${s("01:14")}</td><td>K-327 (Kofler)</td><td>Streit Wagen 326 geschlichtet.</td></tr>
<tr><td class="mono">${s("01:34")}</td><td>K-327 (Kofler)</td><td>Kontrollgang, Standort 325, alles ruhig.</td></tr>`
    : `<tr><td class="mono">${s("01:34")}</td><td>K-327 (Kofler)</td><td>Standort 326, Streit zwischen zwei Fahrgästen, habe es im Griff.</td></tr>
<tr><td class="mono">${s("01:47")}</td><td>K-327 (Kofler)</td><td>Streit beendet, zurück in 327.</td></tr>`}
<tr><td class="mono">${s("02:14")}</td><td>K-327 (Kofler)</td><td>Todesfall Wagen 327, Abt. 4. Ärztin vor Ort.</td></tr>
<tr><td class="mono">${s("02:15")}</td><td>Zugchef</td><td>Polizei Udine verständigt, steigt 02:55 zu.</td></tr></table>
<p class="small">Funkgeräte senden ihren Standort nicht automatisch. Die Angaben stammen vom Sprecher.</p>` });

  d.push({ id: "blister", stage: 2, kind: "Fundstück", title: "Fundstück aus dem WC von Wagen 327", html: `
<div class="evidence">FUNDSTÜCK · WC WAGEN 327 · IM MÜLLEIMER</div>
<p style="margin-top:14px">Leerer Blister „Somnaril 10 mg“, 10 Tabletten, alle herausgedrückt. Ein starkes Schlafmittel, rezeptpflichtig.</p>
<div class="receipt"><div class="r-head">Apothekenetikett (fast ganz abgerissen)</div>…theke ·····<br>für: ·····<br>1 Tbl. abends bei Bedarf</div>
<p class="small">Name und Apotheke sind nicht mehr lesbar. Der Mülleimer wurde zuletzt um ${s("00:30")} geleert.</p>` });

  // ----- Stufe 3: das Gemälde -----
  d.push({ id: "gemaelde", stage: 3, kind: "Notiz", title: "Nachtrag: Das Gemälde ist eine Kopie", html: `
<div class="letterhead"><strong>Nachtrag zum Fundort</strong><span>Dr. L. Moretti, im Nebenberuf Restauratorin</span></div>
<p>Ich habe mir das Bild im Koffer genauer angesehen. Die Farbe ist zu frisch, der Firnis riecht noch – das ist eine Kopie.</p>
<p>Am inneren Rand des Rahmens hängen Fäden einer alten Leinwand. Das Original wurde also mit einem Messer herausgeschnitten und die Kopie eingesetzt.</p>
<p>Eine Leinwand dieser Größe rollt man, sonst bricht die Farbe. Die Rolle ist 46 cm lang und etwa 8 cm dick. Sie muss noch im Zug sein – seit Villach hat niemand den Zug verlassen, und die Türen zwischen den Wagen melden jede Öffnung.</p>` });

  d.push({ id: "gepaeck", stage: 3, kind: "Liste", title: "Gepäck der Mitreisenden durchsucht", html: `
<div class="letterhead"><strong>Durchsuchung des Gepäcks</strong><span>Zugbegleiterin C. Ferri, mit Einverständnis aller Mitreisenden</span></div>
<table class="grid"><tr><th>Wem gehört es?</th><th>Gepäckstücke</th><th>Ergebnis</th></tr>
<tr><td>Helene Marquardt</td><td>Handkoffer, Hutschachtel</td><td>nichts gefunden</td></tr>
<tr><td>Jonas Hallwachs</td><td>Rucksack, Zeichenköcher</td><td>nichts gefunden</td></tr>
<tr><td>Sofia Benedetti</td><td>Trolley, Stativtasche</td><td>nichts gefunden</td></tr>
<tr><td>Anton Kofler</td><td>Dienstkoffer, Tasche</td><td>nichts gefunden</td></tr>
<tr><td>Viktor Hallwachs</td><td>Koffer</td><td>nur die Kopie im Rahmen</td></tr></table>
<p class="small">Wer das Bild genommen hat, hat es nicht bei sich behalten.</p>` });

  const searched = SEARCHED[c];
  d.push({ id: "verstecke", stage: 3, kind: "Liste", title: "Mögliche Verstecke im Zug", html: `
<div class="letterhead"><strong>Mögliche Verstecke</strong><span>Liste der Zugbegleiterin C. Ferri · Innenmaß = längste Seite</span></div>
<table class="grid"><tr><th>Ort</th><th>Innen</th><th>Zugang</th><th>Schon durchsucht?</th></tr>
${Object.entries(SPOTS).map(([k, x]) => `<tr><td>${x.name}</td><td class="mono">${x.innen}</td><td>${x.zugang}</td><td>${searched.includes(k) ? "ja, leer" + (k === "waesche327" ? " (Herr Kofler hat aufgesperrt)" : "") : "–"}</td></tr>`).join("")}</table>
<p class="small">Mehr hat Frau Ferri bis Udine nicht geschafft. Den Rest muss die Polizei öffnen – sag ihr, wo sie suchen soll.</p>` });

  // Übergangstüren: Richtung und Zeit, ohne Namen. Unschuldige bewegen sich passend zu ihren Alibis, der Täter nach 01:39.
  const moves = [];
  const m = (t, from, to) => moves.push([t, from, to]);
  // Nur ab 01:00: Die Wege davor (Dr. Langs Besuch, Cognac) stehen im Türprotokoll von Abteil 4 und in den Befragungen.
  // Füllwege zwischen Sitzwagen 324 und Speisewagen 325 (fremde Fahrgäste), damit jede Variante gleich viele Einträge hat.
  if (c === "anton" || c === "helene") { m(s("01:04"), "324", "325"); m(s("01:10"), "325", "324"); }
  if (c === "anton" || c === "lang") { m(s("01:55"), "324", "325"); m(s("01:58"), "325", "324"); }
  if (c === "lang") { m(s("01:30"), "328", "327"); m(s("01:40"), "327", "328"); }
  if (c === "helene") { m(s("01:24"), "325", "326"); m(s("01:25"), "326", "327"); }
  if (c === "jonas") { m(s("01:27"), "325", "326"); m(s("01:28"), "326", "327"); }
  if (c === "sofia") { m(s("01:02"), "327", "326"); m(s("01:16"), "326", "327"); }
  else m(s("01:27"), "327", "326");                                       // Sofia zum Liegewagen (Streit ab 01:30)
  if (c === "anton") { m(s("01:31"), "325", "326"); m(s("01:46"), "326", "325"); }   // Kellnerin Ferri schlichtet
  else if (c === "sofia") { m(s("01:05"), "327", "326"); m(s("01:15"), "326", "327"); m(s("01:29"), "327", "326"); m(s("01:30"), "326", "325"); m(s("01:45"), "325", "326"); m(s("01:46"), "326", "327"); } // Kontrollgang Kofler
  else m(s("01:30"), "327", "326");                                       // Kofler zum Streit
  if (c === "helene") { m(s("01:41"), "327", "328"); m(s("01:43"), "328", "327"); }
  if (c === "jonas") { m(s("01:41"), "327", "326"); m(s("01:42"), "326", "325"); }
  if (c !== "sofia") m(s("01:46"), "326", "327");                          // Sofia zurück
  if (c !== "sofia" && c !== "anton") m(s("01:47"), "326", "327");         // Kofler zurück
  if (c !== "helene") { m(s("01:51"), "325", "326"); m(s("01:52"), "326", "327"); }   // Helene zurück in ihr Abteil
  moves.sort((a, b) => (a[0] < "12" ? "2" + a[0] : "1" + a[0]).localeCompare(b[0] < "12" ? "2" + b[0] : "1" + b[0]));   // 23:xx vor 00:xx
  d.push({ id: "tueren", stage: 3, kind: "Systemauszug", kk: "Systemauszug", title: "Protokoll der Übergangstüren", html: `
<div class="letterhead"><strong>Automatische Übergangstüren</strong><span>Protokoll der Zugsteuerung · ${s("01:00")} bis 02:12 Uhr (Fund) · nur Öffnungen mit Durchgang</span></div>
<table class="grid"><tr><th>Zeit</th><th>Übergang</th><th>Richtung</th></tr>
${moves.map(([t, a, b]) => `<tr><td class="mono">${t}</td><td>Wagen ${[a, b].sort().join(" / ")}</td><td>von ${a} nach ${b}</td></tr>`).join("")}</table>
<p class="small">Reihenfolge der Wagen: 324 · 325 Speisewagen · 326 Liegewagen · 327 Schlafwagen · 328 Schlafwagen. Erfasst sind alle Übergänge zwischen 324 und 328 – kein Eintrag heißt: Niemand ist durchgegangen. Wer innerhalb eines Wagens bleibt, taucht hier nicht auf. Das Personal des Speisewagens bleibt im Speisewagen, außer es wird gerufen.</p>` });
  return d;
}

// ---------- Auflösung ----------
const CONFESSION = (s) => ({
  helene: `Helene Marquardt verließ den Speisewagen schon um ${s("01:25")}. Um ${s("01:31")} klopfte sie bei Viktor, er ließ sie herein – sie war ja seine Partnerin. Während er ihr den Vertrag zur Auflösung zeigte, gab sie ihr Schlafmittel in seinen Cognac und tauschte das Bild gegen die Kopie. Den leeren Blister warf sie ins WC, die Rolle brachte sie um ${s("01:41")} in den Nachbarwagen 328 – ins Gepäckregal am Einstieg, wo in Wagen 327 niemand sucht. „Die Lagune gehört der Galerie“, sagt sie. „Und die Galerie gehört mir.“`,
  jonas: `Jonas Hallwachs ging um ${s("01:27")} aus dem Speisewagen zum Schlafwagen – sein Handy verrät es. Sein Onkel öffnete ihm um ${s("01:31")}. Jonas hatte die Kopie selbst gemalt; er tauschte sie gegen das Original, als Viktor eingeschlafen war. Auf dem Rückweg in den Speisewagen schob er die Rolle im Liegewagen 326 ins Gepäckregal am Wagenende, zwischen fremde Rucksäcke. Jonas hatte Schulden und wollte das Original heimlich verkaufen. Das Schlafmittel sollte Viktor nur fest schlafen lassen – dass zehn Tabletten im Cognac tödlich sind, will er nicht gewusst haben. Den leeren Blister warf er ins WC von Wagen 327.`,
  sofia: `Sofia Benedettis Streit im Liegewagen war schon um ${s("01:15")} vorbei. Um ${s("01:31")} stand sie bei Viktor vor der Tür, angeblich für ein letztes Interview. Sie wollte das Original als Beweis für seine Fälschungen – und als er sich weigerte, kam das Schlafmittel ins Glas. Den leeren Blister warf sie ins WC am Wagenende. Den Wagen verließ sie danach nicht mehr: Die Rolle steckt im Staufach unter dem Notsitz direkt vor ihrem Abteil.`,
  lang: `Dr. Friedrich Lang hatte Viktor um Mitternacht das Gutachten gebracht – ein falsches, wie so viele, mit denen Viktor ihn erpresste. Bei der Ärztin war er schon um ${s("01:08")}, nur fünf Minuten. Um ${s("01:30")} ging er wieder hinüber in Wagen 327; Viktor ließ ihn um ${s("01:31")} arglos herein, und das Schlafmittel landete im Cognac; den leeren Blister ließ er im WC von Wagen 327 verschwinden. Um ${s("01:40")} war Lang zurück in Wagen 328 – die Rolle steckt im Kleiderschrank im Gang, drei Schritte von seinem Abteil.`,
  anton: `Anton Kofler war nicht im Liegewagen – das Notizbuch und der Funk verraten seine „Pause“ von ${s("01:28")} bis ${s("01:47")}. Viktor öffnete dem Schaffner um ${s("01:31")} arglos die Tür. Den leeren Blister warf Anton ins WC von Wagen 327. Für Antons Bruder war das Bild die Entschädigung für das verlorene Geld. Das Wäschefach sperrte er der Zugbegleiterin sogar selbst auf – das Original lag längst hinter der Heizungsverkleidung im Gang, die nur das Personal mit dem Vierkantschlüssel öffnen kann.`,
});
export function resolution(c, v) {
  return { culprit: SUSPECTS[c].name, text: CONFESSION(timer(v))[c], item: SPOTS[SUSPECTS[c].spot].name };
}
