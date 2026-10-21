// Rückblenden (animiertes Finale) – Daten für den Player site/spiel/rueckblende.js (Entscheidung 10./11.10.2026).
// Je Fall eine Bild-Funktion in lib/art/rb_*.js; hier werden ihr die Spieldaten der Runde übergeben.
import * as S1 from "./cases/solo-001.js";
import * as S1E from "./cases/solo-001-en.js";
import * as S2 from "./cases/solo-002.js";
import * as S2E from "./cases/solo-002-en.js";
import * as SP from "./cases/solo-plus-001.js";
import * as SPE from "./cases/solo-plus-001-en.js";
import { rueckblende as rb001 } from "./art/rb_solo001.js";
import { rueckblende as rb002 } from "./art/rb_solo002.js";
import { rueckblende as rbPlus } from "./art/rb_soloplus.js";
import { rueckblende as rbSpecial } from "./art/rb_special001.js";
import * as SH from "./cases/special-001.js";
import * as SHE from "./cases/special-001-en.js";
import { zonesOf } from "./art/special001.js";
import { rueckblende as rbXmas } from "./art/rb_special002.js";
import * as SX from "./cases/special-002.js";
import * as SXE from "./cases/special-002-en.js";
import { MOTIF_NAME } from "./art/special002.js";
import { rueckblende as rbFriends } from "./art/rb_friends.js";
import * as F1 from "./cases/friends-001.js";
import * as F1E from "./cases/friends-001-en.js";
import { rueckblendeTeams } from "./art/rb_teams.js";
import { buildVars, tierOf, langOf, render } from "./game.js";

const names = (M) => Object.fromEntries(Object.entries(M.SUSPECTS).map(([k, x]) => [k, x.name]));

// Motiv in der Schlussszene („Akte geschlossen. Das Motiv: …“) – Abschlusstest 12.10.2026, Zeilen von Martin freigegeben
const MOTIVE = {
  "solo-001": {
    helene: ["Viktor wollte die Partnerschaft auflösen – mit dem Bild wäre ihr die Galerie geblieben.", "Viktor wanted to end their partnership – with the painting, the gallery would stay hers."],
    jonas: ["Schulden – er wollte das Original heimlich verkaufen.", "debts – he wanted to sell the original on the quiet."],
    sofia: ["Sie wollte das Original als Beweis für Viktors Fälschungen.", "she wanted the original as proof of Viktor’s forgeries."],
    lang: ["Viktor erpresste ihn mit seinen falschen Gutachten.", "Viktor was blackmailing him over his fake expert reports."],
    anton: ["Das Bild sollte seinen Bruder für das verlorene Geld entschädigen.", "the painting was to make up for the money his brother had lost."],
  },
  "special-001": {
    linda: ["Frank wollte sie wegen gemieteter Deko disqualifizieren.", "Frank was going to disqualify her for rented decorations."],
    greg: ["Frank wollte die Lücke in der Nachbarschaftskasse aufdecken.", "Frank was going to expose the gap in the neighborhood fund."],
    tyler: ["Frank wollte sein Haus dem Halloween-Fonds vermachen, nicht Tyler.", "Frank was going to leave his house to the Halloween fund, not to Tyler."],
    rosa: ["Frank hatte ihre illegale Ferienvermietung angezeigt.", "Frank had reported her illegal vacation rental."],
    coach: ["Frank wollte auffliegen lassen, dass der Coach gegen seine eigene Mannschaft wettet.", "Frank was going to expose that Coach bets against his own team."],
  },
  "special-002": {
    gerry: ["Brunner wollte ihm wegen zwei Jahren Standgeld-Schulden die Maronihütte nehmen.", "Brunner was going to take his chestnut hut over two years of unpaid pitch fees."],
    elfi: ["Brunner wusste, dass ihre „hausgemachten“ Lebkuchen aus der Fabrik kommen.", "Brunner knew her “homemade” gingerbread came from a factory."],
    rosi: ["Ihr Platz am Kirchentor sollte an Brunners Schwager gehen.", "her pitch at the church gate was going to Brunner’s brother-in-law."],
    konrad: ["Brunner wusste, dass seine „handgeschnitzten“ Figuren aus Fernost kommen.", "Brunner knew his “hand-carved” figures came from the Far East."],
    jonas: ["Brunner hatte ihn beim Griff in die Trinkgeldkassa erwischt.", "Brunner had caught him pocketing tips."],
  },
  "solo-002": {
    vera: ["Zwölf Jahre hat Adler ihr die Rollen genommen.", "for twelve years Adler took her roles."],
    tobias: ["Er wollte endlich selbst den Prospero spielen.", "he finally wanted to play Prospero himself."],
    nina: ["Adler hatte ihre Fassung als seine ausgegeben.", "Adler had passed off her version of the play as his own."],
    paul: ["Nach dreißig Jahren im Haus schickte Adler ihn in Pension.", "after thirty years at the theatre, Adler was pushing him into retirement."],
    felix: ["Adler hatte ihn vor allen gedemütigt und seine Kündigung verlangt.", "Adler had humiliated him in front of everyone and demanded his dismissal."],
  },
};
const lcFirst = (t) => /^(He|She|They|It|In|A|An|The|That|This|His|Her|For|After)\b/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;   /* Namen bleiben groß („Ferdinand accused …“, Go-live-Check 13.10.) */
function withMotive(d, en, line) {
  if (!d || !line) return d;
  const last = [...d.scenes].reverse().find((sc) => /^(Akte geschlossen|Case closed)\.$/.test(sc.sub || ""));
  if (last) last.sub = en ? `Case closed. The motive: ${line}` : `Akte geschlossen. Das Motiv: ${line}`;
  return d;
}

export function soloRueckblende(caseId, lang, c, v) {
  const en = lang === "en";
  if (caseId === "solo-001") {
    const M = en ? S1E : S1;
    const spots = Object.fromEntries(Object.keys(S1.SUSPECTS).map((k) => [k, { key: S1.SUSPECTS[k].spot, name: M.SPOTS[S1.SUSPECTS[k].spot].name }]));
    return withMotive(rb001(c, v, { en, names: names(M), spots, timer: S1.timer }), en, (MOTIVE["solo-001"][c] || [])[en ? 1 : 0]);
  }
  if (caseId === "solo-002") {
    const M = en ? S2E : S2, item = S2.varOf(v).item, spind = S2.SUSPECTS[c].spind;
    return withMotive(rb002(c, v, { en, names: names(M), items: Object.fromEntries(Object.entries(M.ITEMS).map(([k, x]) => [k, x.name])), spind, code: S2.keypad(S2.WORDS[spind]), item, win: S2.ITEMS[item].win }), en, (MOTIVE["solo-002"][c] || [])[en ? 1 : 0]);
  }
  if (caseId === "special-001") {
    const M = en ? SHE : SH, S = M.SUSPECTS[c], T0 = SH.tatOf(v), H = SH.hideOf(c, v);
    const IN = en ? { 1: "inside the hollow “Boo Hill” tombstone", 3: "inside the hollowed-out giant pumpkin", 4: "in the hay bale", 5: "under the scarecrow’s shirt", 8: "in the witch’s cauldron" }
      : { 1: "im hohlen Grabstein „Boo Hill“", 3: "im ausgehöhlten Riesenkürbis", 4: "im Heuballen", 5: "unter dem Hemd der Vogelscheuche", 8: "im Hexenkessel" };
    return withMotive(rbSpecial(c, v, { en, name: S.name, short: S.short, costume: S.costume, kostuem: S.kostuem, kost: S.kost, inch: S.inch, shoe: S.shoe, time: SH.fmt(T0), tPause: SH.fmt(T0 - 3), tHide: SH.fmt(T0 + 2), hide: H, hideName: M.ITEM_NAMES[H], hideIn: IN[H], zones: zonesOf(H).split(""), word: M.WORD[c] }), en, (MOTIVE["special-001"][c] || [])[en ? 1 : 0]);
  }
  if (caseId === "special-002") {
    const M = en ? SXE : SX, S = M.SUSPECTS[c], R = SX.roundOf(c, v), f = SX.fmt;
    const motifName = MOTIF_NAME[en ? "en" : "de"][R.M].replace(/\s*\(.*\)$/, "");
    const hutName = SX.HUTS[R.hide][en ? 1 : 0];
    return withMotive(rbXmas(c, v, { en, name: S.name, short: S.short, dark: f(R.D0), darkClock: f(R.D0 + R.off), time: f(R.T), timeClock: f(R.T + R.off), motifKey: R.M, motifName,
      hide: R.hide, hideName: `${en ? "Hut" : "Hütte"} ${R.hide} (${hutName})`, code: R.codeStr }), en, (MOTIVE["special-002"][c] || [])[en ? 1 : 0]);
  }
  if (caseId === "solo-plus-001") {
    const M = en ? SPE : SP, sk = SP.spotOf(c, v);
    const mo = M.SUSPECTS[c] && M.SUSPECTS[c].motive;
    return withMotive(rbPlus(c, v, { en, names: names(M), time: SP.fmt(SP.tOf(v)), spotKey: sk, spotName: M.SPOTS[sk].name, place: M.SPOTS[sk].loc }), en, mo && (en ? lcFirst(mo) : mo));
  }
  return null;
}

// Friends: d = Gruppendaten roh (JSON aus friends_groups.data, Namen unescaped – die Szenen escapen selbst)
export function friendsRueckblende(caseId, lang, d) {
  if (caseId !== "friends-001") return null;
  const en = lang === "en", M = en ? F1E : F1, C = d.players[d.culprit], act = F1.actOf(C), t = F1.timer(d.tvar);
  // Motiv: Basic = Clip, den Ferdl hochladen wollte (aus der Auflösung); Plus = Geheimnis aus Ferdls Teil 2
  let mo = null;
  try {
    if (d.plus) { const sec = M.SECRETS[F1.motiveOf(d).secret[d.culprit]]; mo = en ? `Ferdl’s Part 2 – “${C.name} ${sec}”.` : `Ferdls Teil 2 – „${C.name} ${sec}“.`; }
    else { const m = String(M.resolution(d).text).match(en ? /The motive: (on Sunday, Ferdl was going to upload “[^”]+”\.)/ : /Das Motiv: (Ferdl wollte am Sonntag „[^“]+“ hochladen\.)/); mo = m && m[1]; }
  } catch { mo = null; }
  return withMotive(rbFriends({ en, name: C.name, act, players: d.players.map((p) => ({ name: p.name, act: F1.actOf(p) })), t1: t("01:12"), t2: t("01:19"), spot: M.SPOTS[F1.HIDE[act]].name }), en, mo);
}

// Teams: erst nach Spielende (status finished) – Spielleitung zeigt sie für alle, Teams können sie danach selbst ansehen
export function teamsRueckblende(session) {
  const v = buildVars(session), d = rueckblendeTeams(session.case_id || "fall-001", v, tierOf(session), langOf(session) === "en");
  // Regionalwörter (DE/CH/LI), Schweizer ss und amerikanisches Englisch wie in der Akte
  for (const sc of d.scenes) { sc.sub = render(sc.sub, v); sc.svg = render(sc.svg, v); }
  return d;
}
