// Fall 001 – Die rote Mappe (Firmen)
// Opfer ist die eigene Chefin / der eigene Chef – sie/er überlebt den Giftanschlag knapp.
// Täter/in ist IMMER jemand aus der Runde: Die Rollen werden pro Spielrunde per Zufall verteilt.
// Platzhalter in {GROSSBUCHSTABEN} werden pro Runde ersetzt.
// Dieser Ordner wird NICHT veröffentlicht – Inhalte gehen nur über die API raus, und nur solange eine Runde läuft.

// ---------------------------------------------------------------------------
// Rollen
//   T      = Täter/in: zweigt über die Scheinfirma „Consulting Nord e.U.“ Geld ab, vergiftet den Tee
//   R1..R5 = falsche Fährten mit Motiv und belegbarem Alibi (R5 nur bei Premium mit 6 Verdächtigen)
//   M      = Mitwisser/in (nur Premium, Akt 2): eine der Personen mit R-Rolle
// ---------------------------------------------------------------------------

export const FIELDS = [
  ["FIRMA", "Firmenname", "Muster GmbH"],
  ["STADT", "Stadt", "Wien"],
  ["PARK", "Park in der Nähe", "Stadtpark"],
  ["RAUM_FEIER", "Raum der Feier", "Kantine"],
  ["RAUM_TATORT", "Büro oder Raum der Chefin / des Chefs", "Büro der Geschäftsführung"],
  ["OPFER", "Opfer: Vor- und Nachname (eure Chefin / euer Chef)", "Petra Lang"],
  ["OPFER_ANR", "Opfer: Anrede", "Frau", "anrede"],
  ["OPFER_FKT", "Opfer: Funktion", "Geschäftsführerin"],
  ["BOSS", "Oberboss, der die Mappe bekommen soll: Vor- und Nachname (z. B. CEO der Gruppe, Aufsichtsrat)", "Helga Wallner"],
  ["BOSS_ANR", "Oberboss: Anrede", "Frau", "anrede"],
  ["BOSS_FKT", "Oberboss: Funktion", "Vorsitzende des Aufsichtsrats"],
  ...[1, 2, 3, 4, 5, 6].flatMap((i) => [
    [`S${i}`, `Verdächtige/r ${i}: Vor- und Nachname${i === 6 ? " (nur Premium)" : ""}`, ["Julia Berger", "Tom Hofer", "Lisa Wagner", "Markus Steiner", "Sarah Huber", "David Moser"][i - 1]],
    [`S${i}_ANR`, `Verdächtige/r ${i}: Anrede`, ["Frau", "Herr", "Frau", "Herr", "Frau", "Herr"][i - 1], "anrede"],
    [`S${i}_FKT`, `Verdächtige/r ${i}: Funktion`, ["Teamleitung", "Abteilungsleitung", "Key Account", "Controlling", "Projektleitung", "Einkauf"][i - 1]],
    [`S${i}_ABT`, `Verdächtige/r ${i}: Abteilung`, ["Vertrieb", "IT", "Kundenbetreuung", "Finanzen", "Marketing", "Einkauf"][i - 1]],
  ]),
];
export const suspectCount = (premium) => (premium ? 6 : 5);

// ---------------------------------------------------------------------------
// Pro Runde zufällig erzeugte Werte – jede Runde hat andere Lösungen und einen anderen Täter
// ---------------------------------------------------------------------------
export function makeSecrets(rand, opts = {}) {
  const n = suspectCount(!!opts.premium);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = (count, make) => { const out = []; while (out.length < count) { const x = make(); if (!out.includes(x)) out.push(x); } return out; };
  const two = (x) => String(x).padStart(2, "0");
  const roles = shuffle(["T", "R1", "R2", "R3", "R4", "R5"].slice(0, n));
  const letters = shuffle(["A", "B", "C", "D", "E", "F"].slice(0, n));
  const ausweise = uniq(n + 3, () => String(1000 + rand(9000)));   // n Verdächtige, Opfer, 2 weitere
  const fixed = ["1904", "3002", "3457", "3200", "1177", "4521", "4410"]; // Ziffernblöcke, die schon in Kontonummern stehen
  const konten = uniq(n, () => { let k; do { k = String(1000 + rand(9000)); } while (fixed.includes(k)); return k; });
  const tels = uniq(n + 1, () => `0664 ${300 + rand(700)} ${1000 + rand(9000)}`);
  const plates = uniq(3, () => { const abc = "ABCDEFGHJKLMNPRSTUVWXYZ"; return `W-${100 + rand(899)}${abc[rand(abc.length)]}${abc[rand(abc.length)]}`; });
  const spots = shuffle([11, 12, 13, 14, 15, 16, 17, 18, 19]).slice(0, 3).map((x) => `P2-${x}`);
  const tIdx = roles.indexOf("T");
  const others = roles.map((r, i) => i).filter((i) => i !== tIdx);
  // Tee-Zeiten: drei Getränke im Zeitfenster 18:00–18:30, mindestens 4 Minuten auseinander
  const tat = 5 + rand(21);
  let teeX, teeK;
  do { teeX = rand(30); } while (Math.abs(teeX - tat) < 4);
  do { teeK = rand(30); } while (Math.abs(teeK - tat) < 4 || Math.abs(teeK - teeX) < 4);
  const hunde = ["Bruno", "Rudi", "Waldi", "Moritz", "Felix", "Anton", "Lumpi", "Hektor", "Fritz", "Baron"];
  return {
    N: n, ROLES: roles, LETTERS: letters, AUSWEISE: ausweise, KONTEN: konten, TELS: tels,
    T_IDX: tIdx, M_IDX: opts.premium ? others[rand(others.length)] : -1,
    L_T: letters[tIdx], KONTO: konten[tIdx],
    TATZEIT: `18:${two(tat)}`, TEE_X: `18:${two(teeX)}`, TEE_K: `18:${two(teeK)}`,
    KENNZ_OPFER: plates[0], KENNZ_T: plates[1], KENNZ_R4: plates[2],
    STELLPLATZ: spots[0], STELLPLATZ_T: spots[1], STELLPLATZ_R4: spots[2],
    KARTONS: uniq(6, () => `${"ABCD"[rand(4)]}${10 + rand(40)}-${String(100 + rand(900))}`), // [0] = Versteck der Mappe
    HUND: hunde[rand(hunde.length)],
    JAHR: String(2005 + rand(15)),                 // seit wann das Opfer im Haus ist
    ...lockers(rand),
  };
}

// Akt 2 (Premium): Schließfächer. Nur EIN Fach passt in allen vier Punkten zu Quittung und Parkschein:
// Fachnummer 1?7, Mietbeginn zwischen Ein- und Ausfahrt der Bahnhofsgarage, 4,50 € und Kartenzahlung.
// Jede falsche Fährte scheitert an genau einem Punkt.
function lockers(rand) {
  const two = (x) => String(x).padStart(2, "0");
  const hm = (m) => `${two(Math.floor(m / 60))}:${two(m % 60)}`;
  const d = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = d.length - 1; i > 0; i--) { const j = rand(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
  const f17 = d.slice(0, 5).map((x) => `1${x}7`);            // [0] = richtiges Fach
  const pin = 20 * 60 + 24 + rand(5);                         // Einfahrt Bahnhofsgarage 20:24–20:28
  const pout = 20 * 60 + 42 + rand(5);                        // Ausfahrt 20:42–20:46
  const inWin = () => pin + 3 + rand(pout - pin - 6);         // sicher innerhalb des Fensters
  const used = new Set();
  const t = (mk) => { let m; do { m = mk(); } while (used.has(m)); used.add(m); return m; };
  const tc = t(inWin);
  const other = () => { let f; do { f = `${1 + rand(3)}${rand(10)}${rand(10)}`; } while (f.startsWith("1") && f.endsWith("7")); return f; };
  const rows = [
    [f17[0], tc, "4,50 €", "Karte"],                              // richtig
    [f17[1], t(inWin), "3,50 €", "Karte"],                                  // falscher Betrag
    [f17[2], t(inWin), "4,50 €", "bar"],                                    // bar bezahlt
    [f17[3], t(() => 19 * 60 + 38 + rand(40)), "4,50 €", "Karte"],          // zu früh
    [f17[4], t(() => 20 * 60 + 55 + rand(40)), "4,50 €", "Karte"],          // zu spät
    [other(), t(inWin), "4,50 €", "Karte"],
    [other(), t(inWin), "4,50 €", "Karte"],
    [other(), t(inWin), "6,00 €", "bar"],
    [other(), t(() => 19 * 60 + 5 + rand(60)), "3,50 €", "Karte"],
    [other(), t(() => 20 * 60 + 50 + rand(60)), "6,00 €", "Karte"],
    [other(), t(() => 19 * 60 + 10 + rand(70)), "4,50 €", "bar"],
  ];
  // doppelte Fachnummern vermeiden
  const seen = new Set();
  for (const r of rows) { while (seen.has(r[0])) r[0] = other(); seen.add(r[0]); }
  return { FACH: f17[0], P_IN: hm(pin), P_OUT: hm(pout),
    LOCKERS: rows.sort((a, b) => a[1] - b[1]).map((r) => [r[0], hm(r[1]), r[2], r[3]]) };
}

// ---------------------------------------------------------------------------
// Grammatik: Anrede → passende Wörter
// ---------------------------------------------------------------------------
const isHerr = (anr) => /^\s*h/i.test(String(anr || ""));
function grammar(prefix, anr) {
  const m = isHerr(anr);
  return {
    [`${prefix}_ER`]: m ? "er" : "sie", [`${prefix}_ER_CAP`]: m ? "Er" : "Sie",
    [`${prefix}_IHM`]: m ? "ihm" : "ihr",
    [`${prefix}_DER`]: m ? "der" : "die", [`${prefix}_DEN`]: m ? "den" : "die", [`${prefix}_DEM`]: m ? "dem" : "der",
    [`${prefix}_KOLL`]: m ? "Kollege" : "Kollegin",
  };
}
function chefGrammar(anr) {
  const m = isHerr(anr);
  return {
    OPFER_CHEF: m ? "der Chef" : "die Chefin", OPFER_CHEF_CAP: m ? "Der Chef" : "Die Chefin",
    OPFER_CHEF_AKK: m ? "den Chef" : "die Chefin", OPFER_CHEF_DAT: m ? "dem Chef" : "der Chefin",
    OPFER_CHEF_GEN: m ? "des Chefs" : "der Chefin",
    OPFER_ER: m ? "er" : "sie", OPFER_ER_CAP: m ? "Er" : "Sie", OPFER_IHM: m ? "ihm" : "ihr", OPFER_IHN: m ? "ihn" : "sie",
    OPFER_IHR: m ? "sein" : "ihr", OPFER_IHRE: m ? "seine" : "ihre", OPFER_IHREN: m ? "seinen" : "ihren", OPFER_IHREM: m ? "seinem" : "ihrem",
    OPFER_DIE: m ? "der" : "die",
  };
}
const fill = (tpl, v) => tpl.replace(/\{([A-Z0-9_]+)\}/g, (m, k) => (k in v ? v[k] : m));

// ---------------------------------------------------------------------------
// Vernehmungen je Rolle (Ich-Form, passt zu jeder Person)
// ---------------------------------------------------------------------------
const VERHOER = {
  T: `
<p class="q">Wie war Ihr Verhältnis zu {OPFER}?</p>
<p class="a">Gut, wirklich. Ich habe den Abend ja mitorganisiert. Dass jemand so etwas tut … ich verstehe es nicht.</p>
<p class="q">Haben Sie {OPFER_CHEF_DAT} am Abend etwas zu trinken gebracht?</p>
<p class="a">Nein. {OPFER_CHEF_CAP} holt sich den Tee immer selbst, da ist {OPFER_ER} eigen.</p>
<p class="q">Wann haben Sie die Feier verlassen?</p>
<p class="a">Um 18:40. Ich war müde und hatte noch Besuch zu Hause. Ich bin direkt heim.</p>
<p class="q">Wissen Sie, was in der roten Mappe war?</p>
<p class="a">Keine Ahnung. Ich hab nur gesehen, dass {OPFER_ER} sie den ganzen Abend nicht aus der Hand gegeben hat.</p>
`,
  R1: `
<p class="q">Sie hatten am Abend einen lauten Streit mit {OPFER}.</p>
<p class="a">Ja, um halb sechs, gleich zu Beginn. Es ging ums Budget für nächstes Jahr – ein Drittel weniger. Da bin ich laut geworden, das gebe ich zu.</p>
<p class="q">Was haben Sie danach getrunken?</p>
<p class="a">Einen Pfefferminztee, so gegen 17:40. Nach dem Streit war mir nicht nach Sekt.</p>
<p class="q">Wann haben Sie das Haus verlassen?</p>
<p class="a">Um 19:15 mit dem Taxi, zusammen mit {R2}. Wir wohnen in dieselbe Richtung.</p>
<p class="q">Kollegen sagen, Sie hätten etwas in der Teeküche versteckt.</p>
<p class="a">(lacht) Ich bringe seit Monaten anonym Kuchen ins Büro. Alle rätseln, wer das ist. Das soll auch so bleiben, bitte!</p>
`,
  R2: `
<p class="q">Ihre Beförderung wurde vor zwei Wochen gestrichen. Von {OPFER}.</p>
<p class="a">Das hat mich geärgert, klar. Aber deswegen vergiftet man doch niemanden!</p>
<p class="q">Was haben Sie am Abend getrunken?</p>
<p class="a">Zwei Gläser Wein und später einen Kamillentee mit Honig. Mein Magen.</p>
<p class="q">Wann sind Sie gegangen?</p>
<p class="a">Um 19:15, mit {R1} im Taxi. Die Quittung habe ich noch.</p>
<p class="q">Warum haben Sie mehrmals mit der Assistenz der Geschäftsführung getuschelt?</p>
<p class="a">Weil wir eine Überraschungsfeier für {OPFER} planen – ein Jubiläum. Das darf jetzt aber keiner erfahren.</p>
`,
  R3: `
<p class="q">{OPFER} hatte Fehler in Ihrem Bericht gefunden und eine Abmahnung angekündigt.</p>
<p class="a">Zwei Zahlendreher. Unangenehm, aber fair. Ich hab es am nächsten Tag korrigiert.</p>
<p class="q">Kollegen beschreiben Sie als sehr nervös. Sie hätten ständig aufs Handy gesehen.</p>
<p class="a">Das ist … privat. Ich will einen Heiratsantrag machen. Der Ring liegt im Büro, damit er zu Hause nicht gefunden wird, und mein Bruder hat mir den ganzen Abend Tipps geschickt.</p>
<p class="q">Wo waren Sie ab 19:30 Uhr?</p>
<p class="a">Im kleinen Besprechungsraum im 2. Stock, im Videocall mit unserem Kunden in New York – dort war ja erst Mittag. Das ging bis nach acht. Fragen Sie die IT.</p>
`,
  R4: `
<p class="q">Man sagt, Sie hätten sich bei einer anderen Firma beworben.</p>
<p class="a">(zögert) Ja. {OPFER} hat es irgendwie erfahren und mich darauf angesprochen. Das war unangenehm. Aber das ist kein Grund für so etwas.</p>
<p class="q">Was haben Sie am Abend getrunken?</p>
<p class="a">Nur Tee. Pfefferminz, so kurz nach sechs. Ich wollte danach noch laufen.</p>
<p class="q">Wann haben Sie das Haus verlassen?</p>
<p class="a">Um 19:31 durch den Haupteingang. Dann bin ich eine Runde im {PARK} gelaufen, bis ungefähr Viertel nach acht. Ich trainiere heimlich für den Firmenlauf.</p>
<p class="q">Ihr Auto stand die ganze Nacht in der Tiefgarage.</p>
<p class="a">Ja, nach dem Laufen hab ich mir ein Taxi genommen. Ich war fix und fertig.</p>
`,
  R5: `
<p class="q">{OPFER} will Sie an einen anderen Standort versetzen.</p>
<p class="a">Das ist noch nicht entschieden. Ich hab gehofft, dass ich das am Abend noch ausreden kann. Dazu kam es nicht.</p>
<p class="q">Wo waren Sie ab 19:30 Uhr?</p>
<p class="a">In der {RAUM_FEIER}, bis fast halb neun. Ich hab mit dem Fotografen die Gruppenfotos gemacht und dann beim Aufräumen geholfen.</p>
<p class="q">Und die Tupperdose, die Sie mitgebracht haben?</p>
<p class="a">Sachertorte für morgen früh. Für das ganze Team. Das sollte eine Überraschung werden.</p>
`,
};
const MOTIV = {
  T: "Hat den Strategieabend mitorganisiert; gilt als verlässlich.",
  R1: "Lauter Streit mit {OPFER} am Abend wegen Budgetkürzungen.",
  R2: "Beförderung wurde vor zwei Wochen von {OPFER} gestrichen.",
  R3: "{OPFER} hatte wegen Fehlern im Bericht eine Abmahnung angekündigt.",
  R4: "Soll sich heimlich bei einer anderen Firma beworben haben.",
  R5: "Soll gegen den eigenen Willen an einen anderen Standort versetzt werden.",
};

// ---------------------------------------------------------------------------
// Berechnete Platzhalter: Rollen auf Personen verteilen, Tabellen bauen
// ---------------------------------------------------------------------------
export function extraVars(v) {
  const n = v.N || 5;
  const out = { ...chefGrammar(v.OPFER_ANR), ...grammar("BOSS", v.BOSS_ANR), NS: n === 6 ? "sechs" : "fünf",
    BOSS_LIEB: isHerr(v.BOSS_ANR) ? "Lieber" : "Liebe" };
  const people = [];
  for (let i = 1; i <= n; i++) {
    const p = { i, name: v[`S${i}`], fkt: v[`S${i}_FKT`], abt: v[`S${i}_ABT`], anr: v[`S${i}_ANR`],
      role: v.ROLES[i - 1], letter: v.LETTERS[i - 1], ausweis: v.AUSWEISE[i - 1], konto: v.KONTEN[i - 1], tel: v.TELS[i - 1] };
    people.push(p);
    Object.assign(out, { [p.role]: p.name, [`${p.role}_FKT`]: p.fkt, [`${p.role}_ABT`]: p.abt, [`${p.role}_AUSW`]: p.ausweis,
      [`${p.role}_KONTO`]: p.konto, [`${p.role}_TEL`]: p.tel, [`${p.role}_L`]: p.letter }, grammar(p.role, p.anr));
  }
  const byRole = Object.fromEntries(people.map((p) => [p.role, p]));
  const has = (r) => !!byRole[r];
  if (v.M_IDX >= 0) { const m = people[v.M_IDX]; Object.assign(out, { M: m.name, M_TEL: m.tel }, grammar("M", m.anr)); }
  out.OPFER_AUSW = v.AUSWEISE[n];
  out.KARTON = v.KARTONS ? v.KARTONS[0] : "";
  out.OPFER_TEL = v.TELS[n];
  const all = { ...v, ...out };
  const row = (cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
  const t = (s) => s.split(":").map(Number).reduce((a, b) => a * 60 + b, 0);
  const byTime = (a, b) => t(a[0]) - t(b[0]);

  // Übersicht der Verdächtigen (nach Buchstaben sortiert)
  out.VERD_ROWS = [...people].sort((a, b) => a.letter.localeCompare(b.letter)).map((p) =>
    `<tr><td class="big">${p.letter}</td><td><strong>${p.name}</strong></td><td>${p.fkt}</td><td>${p.abt}</td><td>${fill(MOTIV[p.role], all)}</td></tr>`).join("\n");
  // Vernehmungen: jede Person bekommt den Text ihrer Rolle
  for (const p of people) out[`V_S${p.i}`] = fill(VERHOER[p.role], all);

  // Tee-Liste des Caterings (nur Ausweisnummern, keine Namen)
  out.TEE_ROWS = [
    ["17:40", "Pfefferminz", `Ausweis ${byRole.R1.ausweis}`],
    [v.TEE_K, "Kamille mit Honig", `Ausweis ${byRole.R2.ausweis}`],
    [v.TEE_X, "Pfefferminz", `Ausweis ${byRole.R4.ausweis}`],
    [v.TATZEIT, "Pfefferminz mit Honig", `Ausweis ${byRole.T.ausweis}`],
    ["18:52", "Pfefferminz mit Honig", `Ausweis ${out.OPFER_AUSW}`],
    ["19:05", "Früchte", `Ausweis ${byRole.R3.ausweis}`],
  ].sort(byTime).map(row).join("\n");

  // Zutrittsprotokoll
  const z = [
    ["18:12", v.RAUM_FEIER, `Ausweis ${byRole.R3.ausweis}`, "hinaus"],
    ["18:44", "Haupteingang", "Tagesausweis Catering-Aushilfe", "hinaus"],
    ["19:15", "Haupteingang", `Ausweis ${byRole.R2.ausweis}`, "hinaus"],
    ["19:15", "Haupteingang", `Ausweis ${byRole.R1.ausweis}`, "hinaus"],
    ["19:27", v.RAUM_TATORT, `Ausweis ${out.OPFER_AUSW}`, "hinein"],
    ["19:29", "Besprechung 2. OG", `Ausweis ${byRole.R3.ausweis}`, "hinein"],
    ["19:31", "Haupteingang", `Ausweis ${byRole.R4.ausweis}`, "hinaus"],
    ["19:47", v.RAUM_TATORT, `Ausweis ${byRole.T.ausweis}`, "hinein"],
    ["19:53", v.RAUM_TATORT, `Ausweis ${byRole.T.ausweis}`, "hinaus"],
    ["19:55", "Archiv UG", `Ausweis ${byRole.T.ausweis}`, "hinein"],
    ["19:57", "Archiv UG", `Ausweis ${byRole.T.ausweis}`, "hinaus"],
    ["19:58", "Stiegenhaus → Parkdeck 2", `Ausweis ${byRole.T.ausweis}`, "hinaus"],
    ["09:03", "Archiv UG", `Ausweis ${byRole.R3.ausweis}`, "hinein"],
    ["10:12", "Archiv UG", `Ausweis ${byRole.R2.ausweis}`, "hinein"],
    ["15:40", "Archiv UG", `Ausweis ${byRole.R1.ausweis}`, "hinein"],
    ["20:21", "Besprechung 2. OG", `Ausweis ${byRole.R3.ausweis}`, "hinaus"],
  ];
  if (has("R5")) z.push(["20:26", "Haupteingang", `Ausweis ${byRole.R5.ausweis}`, "hinaus"]);
  out.ZUTRITT_ROWS = z.sort(byTime).map(row).join("\n");

  // Ausweisverzeichnis (sortiert nach Nummer)
  const aus = people.map((p) => [p.ausweis, p.name, p.abt]);
  aus.push([out.OPFER_AUSW, v.OPFER, "Geschäftsführung"], [v.AUSWEISE[n + 1], "Empfang (Springer-Ausweis)", "Empfang"], [v.AUSWEISE[n + 2], "Haustechnik (Springer-Ausweis)", "Haustechnik"]);
  out.AUSWEIS_ROWS = aus.sort((a, b) => a[0] - b[0]).map(row).join("\n");

  // Reisekosten-Auszahlungen (alle Verdächtigen, nach Name)
  out.KONTEN_ROWS = [...people].sort((a, b) => a.name.localeCompare(b.name, "de")).map((p) =>
    row([p.name, `<span class="mono">AT61 1904 3002 3457 ${p.konto}</span>`, `€ ${(40 + ((Number(p.konto) * 7) % 260)).toFixed(2).replace(".", ",")}`])).join("\n");

  // Tiefgarage
  out.GARAGE_ROWS = [
    ["P2-10", "–", "frei"],
    [v.STELLPLATZ, v.KENNZ_OPFER, `${v.OPFER} (Firmenwagen)`],
    [v.STELLPLATZ_T, v.KENNZ_T, byRole.T.name],
    [v.STELLPLATZ_R4, v.KENNZ_R4, byRole.R4.name],
    ["P2-20", "–", "Lieferzone Catering"],
  ].sort((a, b) => a[0].localeCompare(b[0], "de", { numeric: true })).map(row).join("\n");

  // Alibi-Belege
  out.ALIBI_R5 = has("R5") ? `<div class="receipt"><div class="r-head">Fotograf M. Weber · Bildliste</div>
<p>Serie „Strategieabend“ · 19:35 bis 20:10 · 41 Bilder · ${byRole.R5.name} auf 14 Bildern (Gruppenfotos, Aufräumen, Tortenbox). Zeitstempel der Kamera geprüft.</p></div>` : "";

  // Intranet: Telefonliste
  out.TEL_ROWS = [...people.map((p) => [p.name, p.fkt, p.abt, p.tel]), [v.OPFER, v.OPFER_FKT, "Geschäftsführung", out.OPFER_TEL]]
    .sort((a, b) => a[0].localeCompare(b[0], "de")).map((r) => row([`<strong>${r[0]}</strong>`, r[1], r[2], `<span class="mono">${r[3]}</span>`])).join("\n");

  // Archiv: Scan-Protokoll der Kartons (Donnerstag)
  const K = v.KARTONS;
  const zu = "verschlossen, zurückgestellt";
  out.ARCHIV_ROWS = [
    ["09:05", K[1], "geöffnet", "grün", `Ausweis ${byRole.R3.ausweis}`],
    ["09:24", K[1], zu, "grün", `Ausweis ${byRole.R3.ausweis}`],
    ["10:14", K[2], "geöffnet", "rot", `Ausweis ${byRole.R2.ausweis}`],
    ["10:17", K[3], "geöffnet", "rot", `Ausweis ${byRole.R2.ausweis}`],
    ["10:29", K[2], zu, "rot", `Ausweis ${byRole.R2.ausweis}`],
    ["10:31", K[3], zu, "rot", `Ausweis ${byRole.R2.ausweis}`],
    ["15:42", K[4], "geöffnet", "rot", `Ausweis ${byRole.R1.ausweis}`],
    ["15:51", K[4], zu, "rot", `Ausweis ${byRole.R1.ausweis}`],
    ["15:53", K[5], "geöffnet", "grün", `Ausweis ${byRole.R1.ausweis}`],
    ["15:58", K[5], zu, "grün", `Ausweis ${byRole.R1.ausweis}`],
    ["19:56", K[0], "geöffnet", "rot", `Ausweis ${byRole.T.ausweis}`],
    ["19:57", K[0], zu, "rot", `Ausweis ${byRole.T.ausweis}`],
  ].sort(byTime).map(row).join("\n");

  // Schließfächer (Akt 2)
  if (v.LOCKERS) {
    out.LOCKER_HEAD = "<tr><th>Fach</th><th>Mietbeginn</th><th>Betrag</th><th>Zahlung</th></tr>";
    out.LOCKER_ROWS = v.LOCKERS.map(row).join("\n");
    out.QUITTUNG = "Donnerstag, 4,50 €, Kartenzahlung. Uhrzeit und Fachnummer durch einen Kaffeefleck unleserlich, zu erkennen ist nur: <span class=\"mono\">„1 ▒ 7“</span>";
    out.PARKSCHEIN_ROW = `<tr><td>3</td><td>Parkschein Garage Hauptbahnhof ${v.STADT}, Kennzeichen ${v.KENNZ_T}</td><td>Donnerstag · Einfahrt ${v.P_IN} · Ausfahrt ${v.P_OUT}</td></tr>`;
    out.TASCHE_NR = ["4", "5", "6"];
  } else out.LOCKER_ROWS = [
    [v.FACH_Y1, "19:48", "bar"],
    [v.FACH_X1, "20:10", `Bankomatkarte …${v.KARTE_X}`],
    [v.FACH, "20:34", `Bankomatkarte …${v.KONTO}`],
    [v.FACH_X2, "20:41", "bar"],
    [v.FACH_Y2, "20:50", "bar"],
  ].sort((a, b) => a[1].localeCompare(b[1])).map(row).join("\n");
  if (!v.LOCKERS) {
    out.LOCKER_HEAD = "<tr><th>Fach</th><th>Angemietet</th><th>Zahlung</th></tr>";
    out.QUITTUNG = "Donnerstag, 4,50 €, Kartenzahlung. Fachnummer durch Kaffeefleck unleserlich: <span class=\"mono\">„1 ▒ 7“</span>";
    out.PARKSCHEIN_ROW = "";
    out.TASCHE_NR = ["3", "4", "5"];
  }
  [out.TN4, out.TN5, out.TN6] = out.TASCHE_NR;
  delete out.TASCHE_NR;
  return out;
}

// Richtige Antworten
export function solution(secrets, input = {}) {
  const m = secrets.M_IDX >= 0 ? String(input[`S${secrets.M_IDX + 1}`] || "") : "";
  return { wer: secrets.L_T, wann: secrets.TATZEIT, warum: secrets.KONTO, wo: secrets.KARTONS[0], helfer: m, fach: secrets.FACH };
}
// Klarnamen für die Auflösung
export function names(secrets, input = {}) {
  return { taeter: String(input[`S${secrets.T_IDX + 1}`] || ""), helfer: secrets.M_IDX >= 0 ? String(input[`S${secrets.M_IDX + 1}`] || "") : "" };
}

export const QUESTIONS = [
  { key: "wer", label: "Wer hat {OPFER_CHEF_AKK} vergiftet?", hint: "Buchstabe aus der Übersicht der Verdächtigen", pattern: "letter" },
  { key: "wann", label: "Um wie viel Uhr gelangte das Gift in den Tee {OPFER_CHEF_GEN}?", hint: "Uhrzeit, z. B. 17:45", pattern: "time" },
  { key: "warum", label: "Auf welches Konto floss das abgezweigte Geld?", hint: "Die letzten 4 Ziffern der Kontonummer", pattern: "digits4" },
  { key: "wo", label: "Wo liegt die rote Mappe?", hint: "Kennung aus Buchstabe und Zahlen, z. B. B12-345", pattern: "spot" },
];
// Akt 2 – nur im Premium-Paket
export const QUESTIONS2 = [
  { key: "helfer", label: "Wer hat bei den Scheinrechnungen geholfen?", hint: "Vor- und Nachname", pattern: "name" },
  { key: "fach", label: "In welchem Schließfach liegt das Geld?", hint: "Fachnummer, z. B. 305", pattern: "num" },
];
// Finale (Premium): Code auf der Zugangskarte im versiegelten Kuvert
export const CARD_CODE = "JACKPOT";

// Automatische Funksprüche der Zentrale: Minute nach Spielstart, für alle Teams gleich.
// Stufe 1 = Akt 1 (Basis und Premium), Stufe 2 = Akt 2, Stufe 3 = Kuvert (nur Premium).
export const HINTS = [
  // Akt 1: erster Funkspruch nach 22 Minuten, dann alle 4 Minuten, der letzte 10 Minuten vor Ende (Basis)
  { stage: 1, q: "wer", level: 1, min: 22 }, { stage: 1, q: "wann", level: 1, min: 26 },
  { stage: 1, q: "warum", level: 1, min: 30 }, { stage: 1, q: "wo", level: 1, min: 34 },
  { stage: 1, q: "wer", level: 2, min: 38 }, { stage: 1, q: "wann", level: 2, min: 42 },
  { stage: 1, q: "warum", level: 2, min: 46 }, { stage: 1, q: "wo", level: 2, min: 50 },
  // Premium: Akt 2 im selben Takt; der Kuvert-Hinweis kommt erst 5 Minuten vor Ende
  { stage: 2, q: "helfer", level: 1, min: 62 }, { stage: 2, q: "fach", level: 1, min: 66 },
  { stage: 2, q: "helfer", level: 2, min: 70 }, { stage: 2, q: "fach", level: 2, min: 74 },
  { stage: 3, q: "karte", level: 1, min: 85 },                     // 5 Minuten vor Ende
];

export const TIPS = {
  wer: [
    "Wer an den Tee kam, hat eine Spur hinterlassen. Nicht jede Liste nennt Namen – aber jede Nummer gehört jemandem.",
    "Das Ausweisverzeichnis verrät den Namen. Und das Zutrittsprotokoll zeigt, wer den Raum „{RAUM_TATORT}“ betrat – obwohl diese Person angeblich längst zu Hause war.",
  ],
  wann: [
    "Gift wirkt nicht sofort. Die Ärzte haben schon ein wenig zurückgerechnet.",
    "Was {OPFER_CHEF} trinkt, verrät {OPFER_ER} im Intranet.",
  ],
  warum: [
    "Konten gibt es in der Akte einige. Aber nicht jede Tür im Intranet steht offen – den Schlüssel trägt {OPFER_CHEF} bei sich.",
    "Der Zeitungsartikel nennt den Hund, das Porträt im Intranet das Jahr. Beides zusammen ist das Passwort.",
  ],
  wo: [
    "Was man nicht mitnehmen und nicht vernichten kann, versteckt man.",
    "Das Zutrittsprotokoll zeigt, wohin die Täterin oder der Täter nach dem Tatort ging. Das Scan-Protokoll des Archivs verrät den Karton.",
  ],
  helfer: [
    "Vielleicht ist die Nummer im Chat ja von jemandem aus dem Haus? Wenn man das nur prüfen könnte …",
    "Schaut doch mal im Intranet nach.",
  ],
  fach: [
    "Ein Kaffeefleck verdeckt nicht alles. Und was lag sonst noch in der Tasche?",
    "Fachnummer, Uhrzeit, Betrag und Zahlungsart: Nur ein Fach im Protokoll passt in allen vier Punkten zu Quittung und Parkschein.",
  ],
  karte: [
    "Licht und Dunkelheit bringen ihn zum Vorschein.",
  ],
};

export const META = {
  id: "fall-001",
  title: "Die rote Mappe",
  audience: "Firmen",
  intro: "Gestern Abend, beim Strategieabend, wurde {OPFER} vergiftet. {OPFER_ER_CAP} hat knapp überlebt – aber die rote Mappe mit {OPFER_IHREN} Beweisen ist verschwunden. Jemand aus eurer Runde war's. Findet heraus, wer – bevor um 12:00 Uhr {BOSS} ({BOSS_FKT}) die Mappe erwartet.",
  story: "{T} hat über die Scheinfirma „Consulting Nord e.U.“ Firmengeld auf das eigene Konto mit der Endung {KONTO} abgezweigt. Als {OPFER} dahinterkam und die Beweise in einer roten Mappe für {BOSS} sammelte, holte {T} um {TATZEIT} mit dem eigenen Ausweis {OPFER_IHREN} Pfefferminztee mit Honig und tropfte Herztropfen hinein. Um 19:47 betrat {T} den Raum „{RAUM_TATORT}“, wo {OPFER_CHEF} bereits bewusstlos lag, nahm die Mappe an sich und wollte sie vernichten. Doch der Aktenvernichter war defekt, der dicke Deckel ließ sich nicht zerreißen, und an der Garagenausfahrt wurden Taschen kontrolliert. Also schob {T} die Mappe um 19:56 im Archiv in Karton {KARTON} – rot markiert, Abholung zum Schreddern am Freitag um 12:00 Uhr. Kein Mensch sucht dort, und mittags wäre der Beweis für immer vernichtet gewesen. Behauptet hatte {T}, schon um 18:40 heimgegangen zu sein. Die Reinigung fand {OPFER} um 20:30 – gerade noch rechtzeitig.",
  story2: "Allein war {T} nicht: {M} hat die Scheinrechnungen durchgewunken und wartete auf einen Anteil. Nach der Ausfahrt aus der Firmengarage fuhr {T} zum Hauptbahnhof {STADT} und legte das Bargeld in Schließfach {FACH} – bezahlt mit Karte, verraten von Quittung und Parkschein. Den Code versteckte {T} auf der Zugangskarte {OPFER_CHEF_GEN}. Mit dem geöffneten Schließfach ist das Geld gesichert, und {BOSS} bekommt die ganze Wahrheit.",
};

// ---------------------------------------------------------------------------
// Dokumente der Fallakte (Akt 1)
// ---------------------------------------------------------------------------
export const DOCS = [
{ id: "01-einsatzbrief", title: "Einsatzbrief", kind: "Brief", html: `
<div class="letterhead"><strong>Landeskriminalamt · Wirtschafts- und Gewaltdelikte</strong><span>{STADT} · Freitag, {SPIELSTART} Uhr</span></div>
<p class="meta"><span class="stamp-inline">Vertraulich</span></p>
<p>Liebe Mitarbeiterinnen und Mitarbeiter,</p>
<p>gestern Abend wurde {OPFER}, {OPFER_FKT}, nach eurem Strategieabend bewusstlos im Raum „{RAUM_TATORT}“ gefunden. {OPFER_ER_CAP} wurde vergiftet und hat nur knapp überlebt. {OPFER_ER_CAP} liegt im Krankenhaus und ist noch nicht vernehmungsfähig.</p>
<p>Aus dem Raum verschwunden ist eine rote Mappe mit der Aufschrift „Vertraulich – nur für {BOSS}“. Heute um 12:00 Uhr wollte {OPFER} sie {BOSS} ({BOSS_FKT}) übergeben. Ohne diese Mappe kommt jemand davon.</p>
<p>Wir haben guten Grund zur Annahme: Die Täterin oder der Täter sitzt unter euch. Ihr kennt euer Haus besser als wir. Ich brauche vier Antworten:</p>
<ol>
<li>Wer hat {OPFER_CHEF_AKK} vergiftet?</li>
<li>Um wie viel Uhr gelangte das Gift in {OPFER_IHREN} Tee?</li>
<li>Auf welches Konto floss das Geld?</li>
<li>Wo liegt die rote Mappe?</li>
</ol>
<p>Tragt eure Antworten in der Fallzentrale ein. Und: Traut niemandem.</p>
<p class="sign">Chefinspektorin M. Brandl<br><span>Landeskriminalamt {STADT}</span></p>
`},

{ id: "02-zeitung", title: "Zeitung: Die Melange", kind: "Presse", html: `
<div class="newspaper">
<div class="np-title">Die Melange</div>
<div class="np-mast"><span>Unabhängiges Abendblatt für {STADT} und Umgebung</span><span>Freitag · Chronik</span></div>
<h2>Giftanschlag bei {FIRMA}</h2>
<p class="np-lead">{OPFER_FKT} {OPFER} ist nach einem Strategieabend in {OPFER_IHREM} Unternehmen vergiftet worden. Die Reinigung fand {OPFER_IHN} gegen 20:30 Uhr bewusstlos.</p>
<p>Wie die Polizei bestätigte, schwebt {OPFER} nicht mehr in Lebensgefahr, ist aber noch nicht vernehmungsfähig. Die Ermittler gehen von einem Täter oder einer Täterin aus dem eigenen Haus aus.</p>
<h3>Mit Hund und Handschlag</h3>
<p>In {STADT} kennt man {OPFER} vor allem mit {OPFER_IHREM} Rauhaardackel {HUND}, der {OPFER_IHM} jahrelang ins Büro gefolgt ist. „{HUND} ist mein treuester Begleiter – der verrät nie etwas“, sagte {OPFER} einmal in einem Interview mit dieser Zeitung.</p>
<p>Kaffee trinkt {OPFER} nach eigener Aussage „seit einem kleinen Herzproblem“ nicht mehr.</p>
<p class="np-foot">Die Ermittlungen dauern an. Hinweise nimmt jede Polizeiinspektion entgegen. – Die Melange, Redaktion Chronik</p>
</div>
`},

{ id: "03-klinik", title: "Befund Toxikologie", kind: "Gutachten", html: `
<div class="letterhead"><strong>Klinikum {STADT} · Toxikologie</strong><span>Vorläufiger Befund · nicht zur Veröffentlichung</span></div>
<table class="kv">
<tr><th>Patient/in</th><td>{OPFER}</td></tr>
<tr><th>Aufgefunden</th><td>Donnerstag, 20:30 Uhr, {RAUM_TATORT}, {FIRMA} (Reinigung)</td></tr>
<tr><th>Diagnose</th><td>Herzrhythmusstörung nach Vergiftung mit einem Herzglykosid (Digitalis)</td></tr>
<tr><th>Zustand</th><td>stabil, noch nicht vernehmungsfähig</td></tr>
</table>
<h3>Befunde</h3>
<ul>
<li>Deutlich erhöhter Digitalis-Spiegel im Blut. Keine entsprechenden Medikamente laut Krankenakte.</li>
<li>Mageninhalt: Pfefferminztee mit Honig, wenige Kekse. Kein Kaffee, kein Alkohol.</li>
<li>Erste Symptome laut Rekonstruktion gegen 19:30 Uhr. Das Gift wirkt je nach Dosis nach etwa 60 bis 90 Minuten – die Aufnahme erfolgte demnach zwischen etwa 18:00 und 18:30 Uhr.</li>
<li>Ohne Behandlung wäre die Dosis tödlich gewesen.</li>
</ul>
<p class="note">Digitalis ist in flüssiger Form als Herztropfen erhältlich (kleine Braunglasfläschchen mit Tropfeinsatz).</p>
<p class="sign">Dr. med. H. Brandstetter<br><span>Klinische Toxikologie</span></p>
`},

{ id: "04-verdaechtige", title: "Übersicht der Verdächtigen", kind: "Aktenvermerk", html: `
<div class="letterhead"><strong>Aktenvermerk</strong><span>Personen im Haus nach 18:00 Uhr mit Kontakt zu {OPFER}</span></div>
<p>Diese {NS} Personen waren am Strategieabend nach 18:00 Uhr noch im Gebäude und hatten am Abend Kontakt mit {OPFER}. Die Buchstaben dienen der Zuordnung in der Fallzentrale.</p>
<table class="grid">
<tr><th>Kennung</th><th>Name</th><th>Funktion</th><th>Abteilung</th><th>Vermerk</th></tr>
{VERD_ROWS}
</table>
`},

{ id: "05-verhoer-s1", title: "Vernehmung {S1}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S1} · {S1_FKT} · {S1_ABT}</span></div>
{V_S1}` },
{ id: "06-verhoer-s2", title: "Vernehmung {S2}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S2} · {S2_FKT} · {S2_ABT}</span></div>
{V_S2}` },
{ id: "07-verhoer-s3", title: "Vernehmung {S3}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S3} · {S3_FKT} · {S3_ABT}</span></div>
{V_S3}` },
{ id: "08-verhoer-s4", title: "Vernehmung {S4}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S4} · {S4_FKT} · {S4_ABT}</span></div>
{V_S4}` },
{ id: "09-verhoer-s5", title: "Vernehmung {S5}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S5} · {S5_FKT} · {S5_ABT}</span></div>
{V_S5}` },
{ id: "09b-verhoer-s6", premiumOnly: true, title: "Vernehmung {S6}", kind: "Protokoll", html: `
<div class="letterhead"><strong>Vernehmungsprotokoll</strong><span>Befragte Person: {S6} · {S6_FKT} · {S6_ABT}</span></div>
{V_S6}` },

{ id: "10-catering", title: "Lieferschein und Aussage Catering", kind: "Beleg", html: `
<div class="receipt">
<div class="r-head">Genusswerk Catering · Lieferschein Nr. 4471-B</div>
<p>Veranstaltung: Strategieabend {FIRMA} · {RAUM_FEIER}</p>
<table class="grid">
<tr><th>Position</th><th>Menge</th><th>Ausgabe</th></tr>
<tr><td>Fingerfood-Buffet</td><td>1</td><td>19:00</td></tr>
<tr><td>Sekt, Wein, Softdrinks</td><td>–</td><td>laufend</td></tr>
<tr><td>Espresso</td><td>14</td><td>laufend</td></tr>
</table>
<p style="margin-top:12px">Tee auf Bestellung (Ausgabe nur gegen Mitarbeiterausweis):</p>
<table class="grid tea">
<tr><th>Abgeholt</th><th>Sorte</th><th>Ausweis</th></tr>
{TEE_ROWS}
</table>
</div>
<div class="letterhead" style="margin-top:28px"><strong>Aktenvermerk</strong><span>Aussage Catering-Mitarbeiterin M. Hölzl</span></div>
<p class="a">„Den Tee für {OPFER_CHEF_AKK}? Den hat jemand aus dem Haus abgeholt, mit Ausweis – anders geben wir nichts raus. Die Uhrzeit steht auf meiner Liste, ich trag jede Bestellung ein. Und dann hat diese Person noch aus einem kleinen braunen Fläschchen was reingetropft. Ich hab gedacht, das ist Süßstoff. Gesicht? Nein, tut mir leid, da war so viel los.“</p>
`},

{ id: "11-zutritt", title: "Zutritts&shy;protokoll", kind: "Systemauszug", html: `
<div class="letterhead"><strong>Zutrittssystem · Export</strong><span>{FIRMA} · Donnerstag 08:00 – Freitag 06:00 · Auszug</span></div>
<table class="grid mono">
<tr><th>Zeit</th><th>Tür</th><th>Ausweis</th><th>Richtung</th></tr>
{ZUTRITT_ROWS}
</table>
<p class="small">Das System protokolliert Ausweisnummern, keine Namen. Die Zuordnung steht im Ausweisverzeichnis.</p>
`},

{ id: "12-ausweise", title: "Ausweis&shy;verzeichnis", kind: "Liste", html: `
<div class="letterhead"><strong>Empfang · Ausweisverzeichnis</strong><span>Auszug · aktive Mitarbeiterausweise, Stand Donnerstag</span></div>
<table class="grid">
<tr><th>Ausweis</th><th>Name</th><th>Abteilung</th></tr>
{AUSWEIS_ROWS}
</table>
<p class="small">Springer-Ausweise liegen am Empfang und werden nur tagsüber ausgegeben.</p>
`},

{ id: "13-asservaten", title: "Asservatenliste Tatort", kind: "Liste", html: `
<div class="letterhead"><strong>Polizei · Asservatenliste</strong><span>Sichergestellt im Raum „{RAUM_TATORT}“, Donnerstag 21:20</span></div>
<table class="grid">
<tr><th>Nr.</th><th>Gegenstand</th><th>Fundort</th></tr>
<tr><td>1</td><td>Handtasche mit Brieftasche, Mobiltelefon (gesperrt), Hausschlüssel</td><td>Schreibtisch</td></tr>
<tr><td>2</td><td>Notizbuch, schwarz, mit Klebezettel</td><td>Schreibtisch</td></tr>
<tr><td>3</td><td>Teetasse, Reste von Pfefferminztee mit Honig</td><td>Schreibtisch</td></tr>
<tr><td>4</td><td>Aktentasche, geöffnet, leer</td><td>Boden</td></tr>
</table>
<p class="note">Vermerk: Laut Assistenz trug {OPFER} den ganzen Abend eine rote Mappe „Vertraulich – nur für {BOSS}“ bei sich. Sie wurde nicht gefunden – weder im Raum noch im Firmenwagen {KENNZ_OPFER} in der Tiefgarage. Ebenfalls nicht gefunden: die Zugangskarte von {OPFER}.</p>
`},

{ id: "13b-archiv", title: "Archiv: Scan-Protokoll", kind: "Systemauszug", html: `
<div class="letterhead"><strong>Archiv UG · Scan-Protokoll der Kartons</strong><span>Donnerstag · jeder Karton wird beim Öffnen und beim Zurückstellen gescannt</span></div>
<table class="grid mono">
<tr><th>Zeit</th><th>Karton</th><th>Aktion</th><th>Aufkleber</th><th>Ausweis</th></tr>
{ARCHIV_ROWS}
</table>
<p class="small">Aufkleber rot = Aufbewahrungsfrist abgelaufen, wird vernichtet. Grün = aufbewahren.</p>
`},

{ id: "14-notizbuch", title: "Notizbuch {OPFER}", kind: "Notiz", html: `
<div class="notebook">
<p class="nb-date">Mi.</p>
<p>Consulting Nord e.U. – schon wieder eine Beratungsrechnung, wieder knapp unter der Freigabegrenze. Wer hat die beauftragt? Niemand weiß was.</p>
<p>Das Geld geht auf ein Privatkonto! Kontonummer steht in den Freigaben. Abgleichen – das ist jemand aus dem Haus.</p>
<p class="nb-date">Do.</p>
<p>Rote Mappe für {BOSS} fertig. Freitag 12:00 Übergabe. Niemandem ein Wort!</p>
<p>Strategieabend – jemand hat gefragt, was in der roten Mappe ist. Nichts gesagt.</p>
<p>Tee: Pfefferminz mit Honig. Kein Kaffee!</p>
<div class="postit">
<strong>Intranet · Freigaben</strong><br>
Benutzer: gf-office<br>
Passwort: Name meines treuesten Begleiters + das Jahr, in dem ich hier angefangen habe<br>
<span>(alles klein, ohne Leerzeichen)</span>
</div>
</div>
`},

{ id: "15-mail", title: "Mail an {BOSS}", kind: "E-Mail", html: `
<div class="mail">
<div class="mail-head">
<div><span>Von:</span> {OPFER}</div>
<div><span>An:</span> {BOSS}, {BOSS_FKT}</div>
<div><span>Gesendet:</span> Mittwoch, 18:10</div>
<div><span>Betreff:</span> Freitag – bitte Zeit einplanen</div>
</div>
<p>{BOSS_LIEB} {BOSS},</p>
<p>ich muss am Freitag einen Punkt auf die Tagesordnung setzen, den ich nicht per Mail ausführen möchte. Kurz gesagt: Jemand aus dem Haus zweigt über Scheinrechnungen Geld ab.</p>
<p>Ich bringe alle Unterlagen in einer Mappe mit. Bis dahin bitte kein Wort, auch nicht im Haus.</p>
<p>Herzliche Grüße<br>{OPFER}</p>
</div>
`},

{ id: "16-reisekosten", title: "Reisekosten-Auszahlungen", kind: "Beleg", html: `
<div class="letterhead"><strong>{FIRMA} · Personalabteilung</strong><span>Reisekosten-Auszahlungen, laufender Monat · Auszug</span></div>
<table class="grid">
<tr><th>Name</th><th>Auszahlungskonto</th><th>Betrag</th></tr>
{KONTEN_ROWS}
</table>
<p class="small">Freigabe: Personalabteilung · Auszahlung mit dem nächsten Gehaltslauf.</p>
`},

{ id: "17-alibis", title: "Alibi-Belege", kind: "Belege", html: `
<div class="receipt">
<div class="r-head">Taxi 60160 · Quittung</div>
<p>Donnerstag · Abfahrt 19:15 · {FIRMA} → Innenstadt · 2 Fahrgäste ({R1}, {R2}) · € 18,40 · bar</p>
</div>
<div class="receipt">
<div class="r-head">IT-Protokoll Videokonferenz</div>
<p>Raum Besprechung 2. OG · Teilnehmer: {R3} ({FIRMA}), Kunde New York · Beginn 19:30 · Ende 20:20 · Kamera aktiv über die gesamte Dauer.</p>
</div>
<div class="receipt">
<div class="r-head">Laufuhr-Export {R4}</div>
<p>Start 19:35 · {PARK} · 9,2 km · Ende 20:15 · durchgehende GPS-Aufzeichnung, Herzfrequenz Ø 152.</p>
</div>
{ALIBI_R5}
`},

{ id: "18-garage", title: "Tiefgarage: Parkplatzliste und Sicherheits&shy;protokoll", kind: "Liste", html: `
<div class="letterhead"><strong>Tiefgarage {FIRMA}</strong><span>Parkdeck 2 · Belegung Donnerstagabend</span></div>
<table class="grid mono">
<tr><th>Stellplatz</th><th>Kennzeichen</th><th>Nutzer</th></tr>
{GARAGE_ROWS}
</table>
<div class="letterhead" style="margin-top:26px"><strong>Sicherheitsdienst · Ausfahrtskontrolle</strong><span>Ab 19:00 Uhr werden Taschen bei der Ausfahrt kontrolliert.</span></div>
<table class="grid mono">
<tr><th>Zeit</th><th>Kennzeichen</th><th>Kontrolle</th></tr>
<tr><td>20:12</td><td>{KENNZ_T}</td><td>Handtasche bzw. Laptoptasche – ohne Befund</td></tr>
<tr><td>20:40</td><td>Catering-Transporter</td><td>Geschirrkisten – ohne Befund</td></tr>
</table>
<p class="small">Die Fahrzeuge {KENNZ_OPFER} und {KENNZ_R4} haben die Garage in der Nacht nicht verlassen.</p>
`},

{ id: "19-fund", title: "Fundbericht Kopierraum", kind: "Bericht", html: `
<div class="letterhead"><strong>Reinigung · Fundbericht</strong><span>Donnerstag, 20:25</span></div>
<p>Beim Leeren des Papierkorbs im Kopierraum (2. OG, neben dem Aktenvernichter) wurde gefunden:</p>
<p class="evidence">die abgerissene Ecke eines roten Aktendeckels mit dem Aufdruck „VERTRAULICH – NUR F…“ – der Rand ist mehrfach eingerissen, als hätte jemand versucht, einen dicken Deckel zu zerreißen</p>
<p>Am Aktenvernichter klebt ein Zettel: „DEFEKT – Techniker kommt Montag“. Der Papierkorb war um 17:00 Uhr geleert worden. Das Fundstück wurde am Empfang abgegeben.</p>
`},
];

// ---------------------------------------------------------------------------
// Akt 2 (Premium): erscheint erst, wenn ein Team Akt 1 gelöst hat
// ---------------------------------------------------------------------------
export const DOCS2 = [
{ id: "20-akt2", title: "Akt 2: Das Geld", kind: "Einsatzbrief", html: `
<div class="letterhead"><strong>Landeskriminalamt · Dringend</strong><span>Freitag, 10:05 Uhr</span></div>
<h2>{T} ist festgenommen. Aber das Geld ist weg.</h2>
<p>Gute Arbeit. Die rote Mappe ist gesichert, {T} schweigt. Das Handy zeigt aber zweierlei: Das abgezweigte Geld liegt irgendwo versteckt – und {T} hatte Hilfe aus dem Haus.</p>
<p>Findet heraus:</p>
<ol><li>Wer hat bei den Scheinrechnungen geholfen?</li><li>In welchem Schließfach liegt das Geld?</li></ol>
<p class="note"><strong>Wichtig:</strong> Das versiegelte Kuvert mit der Zugangskarte {OPFER_CHEF_GEN} bleibt zu, bis euch die Fallzentrale das Öffnen erlaubt.</p>
<div class="sign">Chefinspektorin M. Brandl<br><span>Landeskriminalamt {STADT}</span></div>
` },
{ id: "21-tasche", title: "Sicherstellung: Tasche {T}", kind: "Liste", html: `
<div class="letterhead"><strong>Polizei · Sicherstellungsprotokoll</strong><span>Tasche {T}, Freitag 09:40</span></div>
<table class="grid">
<tr><th>Nr.</th><th>Gegenstand</th><th>Vermerk</th></tr>
<tr><td>1</td><td>Mobiltelefon</td><td>entsperrt, siehe Chatauszug</td></tr>
<tr><td>2</td><td>Autoschlüssel {KENNZ_T}</td><td>–</td></tr>
{PARKSCHEIN_ROW}
<tr><td>{TN4}</td><td>Quittung Schließfachanlage Hauptbahnhof {STADT}</td><td>{QUITTUNG}</td></tr>
<tr><td>{TN5}</td><td>Zugangskarte {OPFER}</td><td><strong>im versiegelten Kuvert – liegt euch vor</strong></td></tr>
<tr><td>{TN6}</td><td>Braunglasfläschchen mit Tropfeinsatz, leer</td><td>an das Labor</td></tr>
</table>
` },
{ id: "22-chat", title: "Chatauszug Handy {T}", kind: "Systemauszug", html: `
<div class="letterhead"><strong>Forensik · Chatauszug</strong><span>Kontakt ohne Namen: <span class="mono">{M_TEL}</span></span></div>
<div class="mail-head"><span>Donnerstag</span> 16:02 · <b>{M_TEL}</b></div>
<p>Die letzten zwei Rechnungen von Consulting Nord hab ich durchgewunken, wie besprochen. Wann bekomm ich meinen Anteil?</p>
<div class="mail-head"><span>Donnerstag</span> 20:52 · <b>{T}</b></div>
<p>Es gab ein Problem, aber alles unter Kontrolle. Das Geld liegt sicher am Bahnhof.</p>
<div class="mail-head"><span>Donnerstag</span> 20:55 · <b>{M_TEL}</b></div>
<p>Welches Fach? Und der Code?</p>
<div class="mail-head"><span>Donnerstag</span> 20:57 · <b>{T}</b></div>
<p>Sag ich dir, wenn Gras drüber gewachsen ist. Den Code hab ich dort versteckt, wo keiner sucht – bei {OPFER_CHEF_DAT} selbst. Man sieht ihn nur, wenn man Licht ins Dunkel bringt.</p>
` },
{ id: "23-schliessfach", title: "Protokoll Schließfach&shy;anlage Hauptbahnhof", kind: "Systemauszug", html: `
<div class="letterhead"><strong>Schließfach&shy;anlage Hauptbahnhof {STADT}</strong><span>Anmietungen Donnerstag ab 19:00 Uhr · Fächer der Reihe 100 bis 399</span></div>
<table class="grid mono">
{LOCKER_HEAD}
{LOCKER_ROWS}
</table>
<p class="small">Preise: kleines Fach 3,50 €, mittleres 4,50 €, großes 6,00 € pro Tag.</p>
` },
];

// ---------------------------------------------------------------------------
// Intranet der eigenen Firma (Tab „Intranet“)
// ---------------------------------------------------------------------------
export const FIRMA_WEB = {
  intranet: true,
  login: { user: "gf-office", label: "Freigaben" }, // Passwort pro Runde: HUND + JAHR (klein, ohne Leerzeichen)
  pages: [
    { id: "start", title: "Start", html: `
<section class="v-hero">
<p class="v-kicker">Intranet · {FIRMA}</p>
<h1>Guten Morgen, Team!</h1>
<p>Heute nach Dienstschluss: Strategieabend in der {RAUM_FEIER}. Wir freuen uns auf euch – und auf gute Ideen für das nächste Jahr.</p>
</section>
<div class="v-cards">
<div><strong>Heute ab 17:00 Uhr</strong><p>Strategieabend in der {RAUM_FEIER}. Catering: Genusswerk. Tee gibt's auf Bestellung gegen Ausweis.</p></div>
<div><strong>Firmenlauf im Frühling</strong><p>Wer trainiert schon heimlich? Anmeldung bei der Personalabteilung.</p></div>
<div><strong>Neue Sicherheitsregel</strong><p>Nach mehreren Vorfällen im Lager werden ab 19:00 Uhr Taschen an der Garagenausfahrt kontrolliert.</p></div>
<div><strong>Aktenvernichter 2. OG defekt</strong><p>Bitte nichts mehr einwerfen. Der Techniker kommt am Montag. Vertrauliches bis dahin versperrt aufbewahren.</p></div>
</div>
<div class="v-feature">
<p class="v-kicker">Aus der Geschäftsführung</p>
<h3>Zahlen, bitte!</h3>
<p>Wir prüfen gerade alle Beratungsaufträge. Wer externe Rechnungen freigibt, bitte Belege bereithalten. – {OPFER}</p>
</div>
<footer class="v-footer">{FIRMA} · Intranet · nur für Mitarbeiterinnen und Mitarbeiter</footer>
` },
    { id: "portraet", title: "Porträt", html: `
<h2>10 Fragen an {OPFER}</h2>
<p class="v-lead">Unsere Serie „Wer ist eigentlich …?“ – diesmal mit {OPFER_CHEF_DAT} persönlich.</p>
<div class="v-list v-qa">
<div><h3>1 · Seit wann bist du im Haus?</h3><p>Seit {JAHR}. Mit einem Karton unterm Arm.</p></div>
<div><h3>2 · Kaffee oder Tee?</h3><p>Tee. Pfefferminz, immer mit Honig.</p></div>
<div><h3>3 · Frühaufsteher oder Nachteule?</h3><p>Früh. Um sechs sitze ich im Büro.</p></div>
<div><h3>4 · Was darf in deinem Büro nie fehlen?</h3><p>Ein Foto von meinem Hund. Und Kekse.</p></div>
<div><h3>5 · Dein erstes Auto?</h3><p>Ein roter Golf, Baujahr 1998. Er hieß „Blitz“ – war er nie.</p></div>
<div><h3>6 · Haustiere?</h3><p>Der Hund. Und Minka, die Katze meiner Familie. Sie ignoriert mich konsequent.</p></div>
<div><h3>7 · Lieblingsurlaub?</h3><p>Wandern in den Dolomiten. Ohne Handy.</p></div>
<div><h3>8 · Was liest du gerade?</h3><p>Einen Krimi. Was sonst?</p></div>
<div><h3>9 · Was ärgert dich am meisten?</h3><p>Wenn jemand glaubt, Zahlen merkt keiner. Die merke ich immer.</p></div>
<div><h3>10 · Dein Tipp für sichere Passwörter?</h3><p>Nie etwas, das man in der Zeitung lesen kann.</p></div>
</div>
` },
    { id: "news", title: "News", html: `
<h2>News</h2>
<article class="v-news"><p class="v-date">Diese Woche</p><h3>Strategieabend: Das erwartet euch</h3>
<p>Nach Dienstschluss ab 17:00 Uhr Buffet in der {RAUM_FEIER}. {OPFER} präsentiert die Ziele für das nächste Jahr.</p></article>
<article class="v-news"><p class="v-date">Vor zwei Wochen</p><h3>Neue Freigabegrenze für Rechnungen</h3>
<p>Externe Rechnungen unter 5.000 € werden künftig automatisch freigegeben, darüber braucht es die Geschäftsführung. Weniger Bürokratie, mehr Tempo!</p></article>
<article class="v-news"><p class="v-date">Diese Woche</p><h3>Archiv-Aufräumaktion: Freitag, 12:00 Uhr</h3>
<p>Alle Archivkartons mit rotem Aufkleber sind über der Aufbewahrungsfrist. Sie werden am Freitag um 12:00 Uhr vom zertifizierten Entsorger abgeholt und noch vor Ort geschreddert. Wer etwas davon noch braucht: bis Donnerstag entnehmen!</p></article>
<article class="v-news"><p class="v-date">Vor einem Monat</p><h3>Kuchen-Rätsel geht weiter</h3>
<p>Schon wieder stand ein anonymer Kuchen in der Teeküche. Die Redaktion ermittelt – bisher ohne Ergebnis.</p></article>
<article class="v-news"><p class="v-date">Vor zwei Monaten</p><h3>Zutritt nur noch mit Ausweis</h3>
<p>Alle Türen protokollieren ab sofort die Ausweisnummer. Springer-Ausweise gibt es tagsüber am Empfang.</p></article>
` },
    { id: "telefon", title: "Telefonliste", html: `
<h2>Telefonliste</h2>
<p class="v-lead">Diensthandys, Stand dieses Monats.</p>
<table class="grid"><tr><th>Name</th><th>Funktion</th><th>Abteilung</th><th>Diensthandy</th></tr>
{TEL_ROWS}
</table>
<p class="v-small">Das Intranet ist Teil eines Mordsteam-Krimispiels. Alle Vorwürfe darin sind frei erfunden.</p>
` },
  ],
  partner: `
<h2>Freigaben · Externe Rechnungen</h2>
<p>Angemeldet als <strong>gf-office</strong>.</p>
<table class="grid"><tr><th>Datum</th><th>Lieferant</th><th>Betrag</th><th>Zahlung an</th><th>Freigabe</th></tr>
<tr><td>vor 3 Monaten</td><td>Consulting Nord e.U.</td><td>€ 4.850</td><td class="mono">AT61 1904 3002 3457 {KONTO}</td><td>automatisch</td></tr>
<tr><td>vor 2 Monaten</td><td>Consulting Nord e.U.</td><td>€ 4.920</td><td class="mono">AT61 1904 3002 3457 {KONTO}</td><td>automatisch</td></tr>
<tr><td>vor 5 Wochen</td><td>Consulting Nord e.U.</td><td>€ 4.990</td><td class="mono">AT61 1904 3002 3457 {KONTO}</td><td>automatisch</td></tr>
<tr><td>vor 3 Wochen</td><td>Genusswerk Catering</td><td>€ 2.310</td><td class="mono">AT20 3200 0000 1177 4521</td><td>automatisch</td></tr>
</table>
<div class="v-msg"><span>Notiz von {OPFER} · Mittwoch</span><p>Consulting Nord gibt es nicht. Kein Firmenbuch-Eintrag, kein Büro. Das Konto ist ein Privatkonto – mit den Reisekosten abgleichen!</p></div>
`,
};
