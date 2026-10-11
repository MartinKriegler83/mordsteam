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
import { rueckblende as rbFriends } from "./art/rb_friends.js";
import * as F1 from "./cases/friends-001.js";
import * as F1E from "./cases/friends-001-en.js";

const names = (M) => Object.fromEntries(Object.entries(M.SUSPECTS).map(([k, x]) => [k, x.name]));

export function soloRueckblende(caseId, lang, c, v) {
  const en = lang === "en";
  if (caseId === "solo-001") {
    const M = en ? S1E : S1;
    const spots = Object.fromEntries(Object.keys(S1.SUSPECTS).map((k) => [k, { key: S1.SUSPECTS[k].spot, name: M.SPOTS[S1.SUSPECTS[k].spot].name }]));
    return rb001(c, v, { en, names: names(M), spots, timer: S1.timer });
  }
  if (caseId === "solo-002") {
    const M = en ? S2E : S2, item = S2.varOf(v).item, spind = S2.SUSPECTS[c].spind;
    return rb002(c, v, { en, names: names(M), items: Object.fromEntries(Object.entries(M.ITEMS).map(([k, x]) => [k, x.name])), spind, code: S2.keypad(S2.WORDS[spind]), item, win: S2.ITEMS[item].win });
  }
  if (caseId === "solo-plus-001") {
    const M = en ? SPE : SP, sk = SP.spotOf(c, v);
    return rbPlus(c, v, { en, names: names(M), time: SP.fmt(SP.tOf(v)), spotKey: sk, spotName: M.SPOTS[sk].name, place: M.SPOTS[sk].loc });
  }
  return null;
}

// Friends: d = Gruppendaten roh (JSON aus friends_groups.data, Namen unescaped – die Szenen escapen selbst)
export function friendsRueckblende(caseId, lang, d) {
  if (caseId !== "friends-001") return null;
  const en = lang === "en", M = en ? F1E : F1, C = d.players[d.culprit], act = F1.actOf(C), t = F1.timer(d.tvar);
  return rbFriends({ en, name: C.name, act, players: d.players.map((p) => p.name), t1: t("01:12"), t2: t("01:19"), spot: M.SPOTS[F1.HIDE[act]].name });
}
