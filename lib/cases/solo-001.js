// Mordsteam Solo 001 – „Nachtzug nach Venedig“
// Ein/e Ermittler/in, 30 Minuten, drei Fragen nacheinander. Der Täter wird pro Durchgang ausgelost.
// Beweisstücke: fest (gleich in jeder Variante) oder variabel (abhängig vom Täter, Parameter c).
// Personalisiert ist nur der Spielername (N, bereits HTML-escaped).

export const ID = "solo-001";
export const TITLE = "Nachtzug nach Venedig";
export const LIMIT_MIN = 30;        // Restfahrzeit bis Udine
export const TRAIN_START = 2 * 60 + 15; // Zuguhr beim Start: 02:15

export const SUSPECTS = {
  helene: { name: "Helene Marquardt", short: "Helene", ini: "H. M.", abt: "Abteil 3", item: "hutschachtel" },
  jonas: { name: "Jonas Hallwachs", short: "Jonas", ini: "J. H.", abt: "Abteil 5", item: "koecher" },
  sofia: { name: "Sofia Benedetti", short: "Sofia", ini: "S. B.", abt: "Abteil 6", item: "stativ" },
  anton: { name: "Anton Kofler", short: "Anton", ini: "A. K.", abt: "Dienstabteil 1", item: "waeschesack" },
};
export const CULPRITS = Object.keys(SUSPECTS);

export const ITEMS = {
  hutschachtel: "Hutschachtel von Helene Marquardt",
  koecher: "Zeichenköcher von Jonas Hallwachs",
  stativ: "Stativtasche von Sofia Benedetti",
  waeschesack: "Wäschesack im Dienstabteil (Anton Kofler)",
  koffer: "Koffer von Viktor Hallwachs",
  rucksack: "Rucksack von Jonas Hallwachs",
  dienstkoffer: "Dienstkoffer von Anton Kofler",
};

// ---------- Fragen ----------
export const QUESTIONS = [
  { key: "zeit", nr: 1, type: "time", label: "Um wie viel Uhr hat Viktor Hallwachs seinem Mörder die Tür geöffnet?", hint: "Uhrzeit, z. B. 23:45" },
  { key: "taeter", nr: 2, type: "select", label: "Wer hat Viktor Hallwachs vergiftet?", hint: "Nur eine Person hatte die Gelegenheit.",
    options: CULPRITS.map((k) => [k, SUSPECTS[k].name]) },
  { key: "versteck", nr: 3, type: "select", label: "Wo ist das echte Gemälde versteckt?", hint: "Das Original ist gerollt und 46 cm hoch.",
    options: ["koffer", "hutschachtel", "rucksack", "koecher", "stativ", "dienstkoffer", "waeschesack"].map((k) => [k, ITEMS[k]]) },
];
export function solution(c) {
  return { zeit: "01:31", taeter: c, versteck: SUSPECTS[c].item };
}

// ---------- Hinweise (3 Stufen, kosten Strafminuten) ----------
export const HINT_PENALTY = [2, 3, 5];
export const WRONG_PENALTY = 3;
export const HINTS = {
  zeit: [
    "Das Türprotokoll zeigt mehrere Öffnungen – nicht jede hat mit dem Mord zu tun.",
    "Die Zugärztin grenzt den Todeszeitpunkt ein. Welche Öffnung <b>von innen</b> passt in dieses Zeitfenster?",
    "Um 00:52 kam nur der Cognac, um 02:12 kam der Schaffner. Dazwischen bleibt genau eine Öffnung von innen.",
  ],
  taeter: [
    "Schau, wer zwischen 01:31 und 01:39 nachweislich woanders war.",
    "Prüfe für jede Person einen Beleg: Bon und Kellnerin (Helene), WLAN-Protokoll (Jonas), Kamera und Notizbuch (Sofia), Notizbuch und Zugfunk (Anton).",
    "Nur eine Person hat für genau 01:31 bis 01:39 keinen Beleg – und der Blister aus dem WC trägt ihre Initialen.",
  ],
  versteck: [
    "Das Original ist 46 cm hoch und wurde gerollt. Welche Gepäckstücke sind innen lang genug?",
    "Jede verdächtige Person hat genau ein Gepäckstück, in das die Rolle passt.",
    "Nimm das lange Gepäckstück der Person, die du bei Frage 2 überführt hast.",
  ],
};

// ---------- Einsatzauftrag (vor dem Start) ----------
export function briefing(N) {
  return {
    eyebrow: "Nachtzug „La Serenissima“ · Wien – Venedig",
    title: "Nachtzug nach <em>Venedig</em>",
    text: `Es ist 02:15 Uhr, irgendwo hinter Villach. Es klopft an deinem Abteil. Schaffner Anton Kofler steht in der Tür, blass: „${N}, entschuldigen Sie – Sie lesen doch Krimis? Ich hab das Buch auf Ihrem Bett gesehen. Im Abteil nebenan liegt Herr Hallwachs. Er ist tot. Um 02:45 halten wir in Udine, dann steigt die Polizei zu. Bis dahin … könnten Sie sich das ansehen?“`,
    steps: [
      ["Beweisstücke lesen", "Du startest mit dem Tatort. Mit jeder richtigen Antwort kommen neue Beweisstücke dazu."],
      ["Drei Fragen lösen", "Tatzeit, Täter, Versteck des Gemäldes – in dieser Reihenfolge."],
      ["Vor Udine fertig sein", "30 Minuten Fahrzeit. Hinweise und falsche Antworten kosten Strafminuten."],
    ],
  };
}

// ---------- Beweisstücke ----------
// stage: ab welcher Stufe sichtbar (1 = Start, 2 = nach Frage 1, 3 = nach Frage 2)
const A = (c) => c === "anton", S = (c) => c === "sofia";

export function docs(c, N) {
  const d = [];
  // ----- Stufe 1: Tatort -----
  d.push({ id: "fundort", stage: 1, kind: "Notiz", title: "Fundortbericht Abteil 4", html: `
<div class="letterhead"><strong>Schlafwagen 327 · Fundortbericht</strong><span>aufgenommen von Schaffner A. Kofler, 02:13 Uhr</span></div>
<p>02:12 Uhr: Abteil 4 (Fahrgast <b>Viktor Hallwachs</b>, Kunsthändler, Wien) reagiert nicht auf Klopfen. Mit der Generalkarte geöffnet.</p>
<ul>
<li>Herr Hallwachs liegt angezogen auf dem Bett. Kein Puls, Haut kühl.</li>
<li>Auf dem Klapptisch: Cognacglas, halb leer, bitterer Geruch. Daneben ein Buch und die Lesebrille.</li>
<li>Offener Koffer: darin ein gerahmtes Gemälde, „Lagune im Nebel“, Rahmen 46 × 61 cm.</li>
<li>Fenster verriegelt. Keine Kampfspuren, nichts umgeworfen.</li>
<li>Die Abteiltür verriegelt sich beim Schließen automatisch. Von außen öffnet sie nur die Fahrgastkarte von Abteil 4 oder meine Generalkarte.</li>
</ul>
<p class="meta">Zugärztin aus Wagen 328 verständigt. Zugchef informiert. Abteil versiegelt.</p>
<p class="sign">A. Kofler <span>· Schlafwagenschaffner</span></p>` });

  d.push({ id: "aerztin", stage: 1, kind: "Befund", title: "Kurzbefund der Zugärztin", html: `
<div class="letterhead"><strong>Dr. Lucia Moretti · Ärztin</strong><span>reist privat mit, Wagen 328 · Kurzbefund 02:20 Uhr</span></div>
<p><b>Todesursache (vorläufig):</b> Überdosis eines Schlafmittels. Pupillen, Geruch und Glas sprechen für ein Präparat, das im Cognac aufgelöst wurde. Es wirkt innerhalb weniger Minuten.</p>
<p><b>Todeszeitpunkt (geschätzt):</b> zwischen <b>01:20 und 01:50 Uhr</b>. Früher nicht – die Körpertemperatur passt nicht dazu.</p>
<p><b>Sonstiges:</b> Keine Verletzungen, keine Abwehrspuren. Er hat seinen Mörder offenbar gekannt und nichts befürchtet.</p>
<div class="postit">${N}, der Schaffner sagt, Sie lösen das. Ich halte Ihnen die Daumen – in Udine will ich der Polizei einen Namen nennen. <span>– L. M.</span></div>` });

  d.push({ id: "tuer", stage: 1, kind: "Systemauszug", kk: "Systemauszug", title: "Türprotokoll Abteil 4", html: `
<div class="letterhead"><strong>Türsteuerung Schlafwagen 327</strong><span>Protokoll Abteil 4 · Ausdruck 02:16 Uhr</span></div>
<table class="grid"><tr><th>Zeit</th><th>Ereignis</th><th>Auslöser</th></tr>
<tr><td class="mono">23:10</td><td>geöffnet</td><td>außen · Fahrgastkarte Abt. 4</td></tr>
<tr><td class="mono">23:11</td><td>geschlossen</td><td>–</td></tr>
<tr><td class="mono">00:52</td><td>geöffnet</td><td>innen · Taster</td></tr>
<tr><td class="mono">00:53</td><td>geschlossen</td><td>–</td></tr>
<tr><td class="mono">01:31</td><td>geöffnet</td><td>innen · Taster</td></tr>
<tr><td class="mono">01:39</td><td>geschlossen</td><td>–</td></tr>
<tr><td class="mono">02:12</td><td>geöffnet</td><td>außen · Generalkarte K-01</td></tr></table>
<p class="small">„innen · Taster“: Die Tür wurde von jemandem im Abteil geöffnet. Die Karte von Abteil 4 lag auf dem Klapptisch.</p>` });

  d.push({ id: "wagen", stage: 1, kind: "Liste", title: "Fahrgastliste und Zugaufbau", html: `
<div class="letterhead"><strong>Fahrgastliste Schlafwagen 327</strong><span>Nachtzug „La Serenissima“ · Wien Hbf ab 21:25 · Venezia S. Lucia an 07:40</span></div>
<table class="grid"><tr><th>Abteil</th><th>Belegung</th></tr>
<tr><td>Dienst 1</td><td>Anton Kofler, Schlafwagenschaffner</td></tr>
<tr><td>2</td><td>${N}</td></tr>
<tr><td>3</td><td>Helene Marquardt, Galeristin, Wien</td></tr>
<tr><td>4</td><td>Viktor Hallwachs, Kunsthändler, Wien</td></tr>
<tr><td>5</td><td>Jonas Hallwachs, Student, Wien</td></tr>
<tr><td>6</td><td>Sofia Benedetti, Journalistin, Triest</td></tr></table>
<h3>Zugaufbau (von vorne)</h3>
<p class="mono">[Lok] · 324 Sitzwagen · <b>325 Speisewagen</b> · <b>326 Liegewagen</b> · <b>327 Schlafwagen</b> · 328 Schlafwagen</p>
<p class="small">WC für Wagen 327 am hinteren Wagenende, neben Abteil 6.</p>` });

  d.push({ id: "befragung", stage: 1, kind: "Protokoll", title: "Kurzbefragungen der Mitreisenden", html: `
<div class="letterhead"><strong>Kurzbefragungen · 02:05 bis 02:25 Uhr</strong><span>notiert von A. Kofler und Dr. L. Moretti</span></div>
<p class="q">Helene Marquardt, Abteil 3 – Geschäftspartnerin</p>
<p class="a">„Viktor wollte unsere Galerie auflösen. Ja, ich war wütend – dreißig Jahre Arbeit! Aber umbringen? Ich konnte nicht schlafen und saß im Speisewagen, Tisch 3, bei einem Tee. Bis fast zwei.“</p>
<p class="q">Jonas Hallwachs, Abteil 5 – Neffe</p>
<p class="a">„Onkel Viktor und ich hatten Streit wegen Geld, das weiß jeder. Ich hab ein paar Schulden. Ich war im Speisewagen und hab am Handy gezeichnet. Da ist das WLAN besser.“</p>
<p class="q">Sofia Benedetti, Abteil 6 – Journalistin</p>
<p class="a">„Ich schreibe über gefälschte Bilder aus seiner Galerie, er hat mir mit einer Klage gedroht. Heute Nacht hatte ich im Liegewagen Streit mit einem Mann, der mich fotografiert haben wollte – so gegen halb zwei. Fragen Sie den Schaffner, er kam dazu.“</p>
<p class="q">Anton Kofler, Dienstabteil 1 – Schaffner</p>
<p class="a">„Hallwachs hat meinem Bruder vor Jahren eine Menge Geld abgenommen, das stimmt. Aber ich hab heute Nacht gearbeitet. Um halb zwei war ich im Liegewagen, den Streit von Frau Benedetti schlichten, und um 01:34 hab ich dem Zugchef gefunkt.“</p>
<p class="small">Alle vier sagen, sie hätten Herrn Hallwachs nach Mitternacht nicht mehr gesehen.</p>` });

  // ----- Stufe 2: Protokolle und Belege -----
  const heleneGuilty = c === "helene";
  d.push({ id: "bon", stage: 2, kind: "Beleg", title: "Speisewagen: Bons und Zettel der Kellnerin", html: `
<div class="receipt"><div class="r-head">SPEISEWAGEN 325 · Tagesjournal Nacht</div>
00:40 · Zimmerservice Abt. 327/4 · 1 × Cognac VSOP · geliefert 00:52 (Giulia)<br>
${heleneGuilty ? "00:58 · Tisch 3 · 1 × Kamillentee · <b>bezahlt 01:12</b>" : "00:58 · Tisch 3 · 1 × Kamillentee<br>01:30 · Tisch 3 · 2 × Pfefferminztee · <b>bezahlt 01:49</b>"}<br>
01:10 · Tisch 5 · 1 × Cola, 1 × Toast<br>
${S(c) ? "01:36 · Personalverzehr · 1 × Kaffee · A. Kofler<br>" : ""}
01:42 · Tisch 5 · 1 × Espresso</div>
<div class="postit">${heleneGuilty
      ? "Die Dame an Tisch 3 (graue Haare, Perlenkette) ist ca. um <b>01:25</b> gegangen. Kam nicht wieder."
      : "Die Dame an Tisch 3 (graue Haare, Perlenkette) saß bis ca. <b>01:50</b> und hat gelesen. Hat zwischendurch noch Tee nachbestellt."} <span>– Giulia, Speisewagen</span></div>
<p class="small">Tisch 5: junger Mann mit Handy und Kopfhörern.</p>` });

  const jonasGuilty = c === "jonas";
  d.push({ id: "wlan", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "WLAN-Protokoll des Zuges", html: `
<div class="letterhead"><strong>Bord-WLAN „Serenissima-Free“</strong><span>Anmeldungen je Zugangspunkt · Auszug 00:30–02:00 Uhr</span></div>
<table class="grid"><tr><th>Gerät</th><th>Zugangspunkt</th><th>von</th><th>bis</th></tr>
<tr><td>Jonas-Phone</td><td>AP 325 (Speisewagen)</td><td class="mono">00:48</td><td class="mono">${jonasGuilty ? "01:27" : "01:58"}</td></tr>
${jonasGuilty ? `<tr><td>Jonas-Phone</td><td>AP 327 (Schlafwagen)</td><td class="mono">01:29</td><td class="mono">01:41</td></tr>
<tr><td>Jonas-Phone</td><td>AP 325 (Speisewagen)</td><td class="mono">01:43</td><td class="mono">01:58</td></tr>` : ""}
<tr><td>Galaxy-7F2</td><td>AP 326 (Liegewagen)</td><td class="mono">00:30</td><td class="mono">02:00</td></tr>
<tr><td>iPad-Moretti</td><td>AP 328 (Schlafwagen)</td><td class="mono">00:30</td><td class="mono">01:05</td></tr>
<tr><td>Kofler-Dienst</td><td>AP 327 (Schlafwagen)</td><td class="mono">00:30</td><td class="mono">02:00</td></tr></table>
<p class="small">Ein Gerät meldet sich beim Zugangspunkt des Wagens an, in dem es sich befindet. „Kofler-Dienst“ ist das Diensttablet, es bleibt im Dienstabteil.</p>` });

  let nb = `<p><span class="nb-date">23:40</span> Fahrkartenkontrolle 327 erledigt, alles ok.</p>
<p><span class="nb-date">00:52</span> Cognac für Abt. 4 kam aus dem Speisewagen (Giulia).</p>`;
  if (S(c)) nb += `<p><span class="nb-date">01:05</span> Wagen 326: Streit Fr. Benedetti (327/6) mit Fahrgast Liegeplatz 64 wegen Fotos. Hin, geschlichtet bis <b>01:15</b>.</p>
<p><span class="nb-date">01:30</span> Kontrollgang 326 → 325, bis 01:45. Ruhig.</p>`;
  else if (A(c)) nb += `<p><span class="nb-date">01:30</span> Pause Dienstabteil.</p>
<p><span class="nb-date">01:48</span> Meldung Kollegin Ferri (Speisewagen): Wagen 326, Streit Fr. Benedetti mit Fahrgast Liegeplatz 64 wegen Fotos, ca. 01:30–01:45. Hat sie selbst geschlichtet.</p>`;
  else nb += `<p><span class="nb-date">01:30</span> Wagen 326: Streit Fr. Benedetti (327/6) mit Fahrgast Liegeplatz 64 wegen Fotos. Hin, geschlichtet bis <b>01:45</b>.</p>`;
  nb += `<p><span class="nb-date">02:12</span> Abt. 4 keine Reaktion. Generalkarte. Hallwachs tot. Ärztin geholt.</p>`;
  d.push({ id: "notizbuch", stage: 2, kind: "Notiz", title: "Dienst-Notizbuch des Schaffners", html: `
<div class="letterhead"><strong>Dienstbuch A. Kofler</strong><span>Schlafwagen 327 · Nacht</span></div>
<div class="notebook">${nb}</div>` });

  d.push({ id: "kamera", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Sofias Kamera: Zeitstempel der Fotos", html: `
<div class="letterhead"><strong>Kamera S. Benedetti · Bildliste</strong><span>freiwillig vorgelegt · Zeitstempel der Kamera</span></div>
<table class="grid"><tr><th>Bild</th><th>Zeit</th><th>Motiv (lt. Vorschau)</th></tr>
<tr><td>IMG_2201</td><td class="mono">00:44</td><td>Speisewagen, Tischlampe</td></tr>
${S(c) ? `<tr><td>IMG_2202</td><td class="mono">01:03</td><td>Liegewagen 326, Gang</td></tr>
<tr><td>IMG_2203</td><td class="mono">01:05</td><td>Liegeplatz 64, Mann hebt die Hand</td></tr>
<tr><td>IMG_2204</td><td class="mono">01:52</td><td>Schlafwagen 327, Gang, Fenster</td></tr>`
    : `<tr><td>IMG_2202</td><td class="mono">01:28</td><td>Liegewagen 326, Gang</td></tr>
<tr><td>IMG_2203</td><td class="mono">01:33</td><td>Liegeplatz 64, Mann hebt die Hand</td></tr>
<tr><td>IMG_2204</td><td class="mono">01:37</td><td>${A(c) ? "Liegewagen 326, Kellnerin mit Tablett (unscharf)" : "Liegewagen 326, Schaffneruniform (unscharf)"}</td></tr>
<tr><td>IMG_2205</td><td class="mono">01:52</td><td>Schlafwagen 327, Gang, Fenster</td></tr>`}</table>
<p class="small">Die Kamerauhr stimmt laut Vergleich mit der Zuguhr auf die Minute.</p>` });

  d.push({ id: "funk", stage: 2, kind: "Systemauszug", kk: "Systemauszug", title: "Zugfunk-Protokoll", html: `
<div class="letterhead"><strong>Zugfunk · Protokoll Zugchef</strong><span>Kanal 2 · Auszug 01:00–02:20 Uhr</span></div>
<table class="grid"><tr><th>Zeit</th><th>Von</th><th>Meldung</th></tr>
<tr><td class="mono">01:02</td><td>Speisewagen</td><td>Kasse Nachtservice geöffnet.</td></tr>
${A(c) ? `<tr><td class="mono">01:28</td><td>K-327 (Kofler)</td><td>Gehe in Pause, Dienstabteil, bis ca. 01:45.</td></tr>
<tr><td class="mono">01:47</td><td>K-327 (Kofler)</td><td>Pause beendet.</td></tr>`
    : S(c) ? `<tr><td class="mono">01:14</td><td>K-327 (Kofler)</td><td>Streit Wagen 326 geschlichtet.</td></tr>
<tr><td class="mono">01:34</td><td>K-327 (Kofler)</td><td>Kontrollgang, Standort 325, alles ruhig.</td></tr>`
    : `<tr><td class="mono">01:34</td><td>K-327 (Kofler)</td><td>Standort 326, Streit zwischen zwei Fahrgästen, habe es im Griff.</td></tr>`}
<tr><td class="mono">02:14</td><td>K-327 (Kofler)</td><td>Todesfall Wagen 327, Abt. 4. Ärztin vor Ort.</td></tr>
<tr><td class="mono">02:16</td><td>Zugchef</td><td>Polizei Udine verständigt, steigt 02:45 zu.</td></tr></table>
<p class="small">Funkgeräte senden ihren Standort nicht automatisch. Die Angaben stammen vom Sprecher.</p>` });

  d.push({ id: "blister", stage: 2, kind: "Fundstück", title: "Fundstück aus dem WC von Wagen 327", html: `
<div class="evidence">FUNDSTÜCK · WC WAGEN 327 · GEFUNDEN 02:21 IM MÜLLEIMER</div>
<p style="margin-top:14px">Leerer Blister <b>„Somnaril 10 mg“</b>, 10 Tabletten, alle herausgedrückt. Ein starkes Schlafmittel, rezeptpflichtig.</p>
<div class="receipt"><div class="r-head">Apothekenetikett (angerissen)</div>…theke am Ring, Wien<br>für: <b>${SUSPECTS[c].ini}</b> ·····<br>1 Tbl. abends bei Bedarf</div>
<p class="small">Der Rest des Etiketts fehlt. Der Mülleimer wurde zuletzt um 00:30 geleert.</p>` });

  // ----- Stufe 3: das Gemälde -----
  d.push({ id: "gemaelde", stage: 3, kind: "Notiz", title: "Nachtrag: Das Gemälde ist eine Kopie", html: `
<div class="letterhead"><strong>Nachtrag Fundort · 02:31 Uhr</strong><span>Dr. L. Moretti, im Nebenberuf Restauratorin</span></div>
<p>Ich habe mir das Bild im Koffer genauer angesehen. Die Farbe ist zu frisch, der Firnis riecht noch – <b>das ist eine Kopie</b>.</p>
<p>Am inneren Rand des Rahmens hängen Fäden einer alten Leinwand. Das Original wurde also mit einem Messer herausgeschnitten und die Kopie eingesetzt.</p>
<p>Eine Leinwand dieser Größe rollt man, sonst bricht die Farbe. Die Rolle ist <b>46 cm lang</b> und etwa 8 cm dick. Sie muss noch im Wagen sein – seit Villach hat niemand den Zug verlassen.</p>` });

  d.push({ id: "gepaeck", stage: 3, kind: "Liste", title: "Gepäckliste Wagen 327", html: `
<div class="letterhead"><strong>Gepäck im Schlafwagen 327</strong><span>aufgenommen 02:33 Uhr · Innenmaße (längste Seite)</span></div>
<table class="grid"><tr><th>Wem gehört es?</th><th>Gepäckstück</th><th>Innen</th><th>Zustand</th></tr>
<tr><td>Viktor Hallwachs</td><td>Koffer</td><td class="mono">70 cm</td><td>offen, darin die Kopie im Rahmen</td></tr>
<tr><td>Helene Marquardt</td><td>Handkoffer</td><td class="mono">44 cm</td><td>geöffnet, nichts gefunden</td></tr>
<tr><td>Helene Marquardt</td><td>Hutschachtel</td><td class="mono">Ø 52 cm</td><td>verschnürt, nicht geöffnet</td></tr>
<tr><td>Jonas Hallwachs</td><td>Rucksack</td><td class="mono">42 cm</td><td>geöffnet, nichts gefunden</td></tr>
<tr><td>Jonas Hallwachs</td><td>Zeichenköcher</td><td class="mono">65 cm</td><td>verschlossen, nicht geöffnet</td></tr>
<tr><td>Sofia Benedetti</td><td>Trolley</td><td class="mono">45 cm</td><td>geöffnet, nichts gefunden</td></tr>
<tr><td>Sofia Benedetti</td><td>Stativtasche</td><td class="mono">72 cm</td><td>verschlossen, nicht geöffnet</td></tr>
<tr><td>Anton Kofler</td><td>Dienstkoffer</td><td class="mono">40 cm</td><td>geöffnet, nichts gefunden</td></tr>
<tr><td>Anton Kofler</td><td>Wäschesack (Dienstabteil)</td><td class="mono">80 cm</td><td>zugebunden, nicht geöffnet</td></tr></table>
<p class="small">Die verschlossenen Stücke darf erst die Polizei öffnen. Du musst ihr sagen, welches.</p>` });
  return d;
}

// ---------- Auflösung ----------
const CONFESSION = {
  helene: "Helene Marquardt verließ den Speisewagen schon um 01:25. Um 01:31 klopfte sie bei Viktor, er ließ sie herein – sie war ja seine Partnerin. Während er ihr den Vertrag zur Auflösung zeigte, gab sie ihr Schlafmittel in seinen Cognac. Das Original rollte sie in ihre Hutschachtel. „Die Lagune gehört der Galerie“, sagt sie. „Und die Galerie gehört mir.“",
  jonas: "Jonas Hallwachs ging um 01:27 aus dem Speisewagen in den Schlafwagen – sein Handy verrät es. Sein Onkel öffnete ihm um 01:31. Jonas hatte die Kopie selbst gemalt; er tauschte sie gegen das Original, als Viktor schlief, und versteckte die Leinwand im Zeichenköcher. Das Schlafmittel war nur für eine ruhige Nacht gedacht – sagt er.",
  sofia: "Sofia Benedettis Streit im Liegewagen war schon um 01:15 vorbei. Um 01:31 stand sie bei Viktor vor der Tür, angeblich für ein letztes Interview. Sie wollte das Original als Beweis für seine Fälschungen – und als er sich weigerte, kam das Schlafmittel ins Glas. Die Leinwand steckt in ihrer Stativtasche.",
  anton: "Anton Kofler war nicht im Liegewagen – das Notizbuch und der Funk verraten seine „Pause“ von 01:28 bis 01:47. Viktor öffnete dem Schaffner um 01:31 arglos die Tür. Für Antons Bruder war das Bild die Entschädigung für das verlorene Geld. Das Original lag im Wäschesack im Dienstabteil, wo niemand sucht.",
};
export function resolution(c) {
  return { culprit: SUSPECTS[c].name, text: CONFESSION[c], item: ITEMS[SUSPECTS[c].item] };
}
