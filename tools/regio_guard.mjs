// Wächter für Regionalwörter (Go-live-Test 3, 5.10.2026): In deutschsprachigen Runden für Deutschland, Schweiz und
// Liechtenstein dürfen keine österreichischen Wörter in unseren Texten stehen – weder in Akte, Website, Fragen,
// Funksprüchen, Auflösung noch in den Anweisungen und Ersatzantworten der KI-Figuren.
// Wird von tools/check_teams.mjs (Fall 001) und tools/check_teams002.mjs (Fall 002) aufgerufen.
import { CASES, caseOf, buildVars, render, stageQuestions, RULES } from "../lib/game.js";
import { normalizeVars } from "../lib/create.js";
import { randomCast } from "../lib/countries.js";

// Wörter, die in DE/CH/LI nicht vorkommen dürfen. „Heuer“ groß nur am Satzanfang (Nachname Heuer ist erlaubt).
const BAD = /Kassa|kassa|Würstel|Ehrenob|\bobmann\b|\bheuer\b|(?:^|[>„“".!?:]\s?)Heuer |Grüß Gott|Landesklinikum|Kampfmannschaft|Jänner|Feber|Paradeiser|Erdäpfel|Sackerl|Semmel|Jause|Kuvert|Mistkübel|Spital|Archivkasten/;
const SWISS_OK = /Spital|Archivkasten/g;   // in der Schweiz üblich
const txt = (h) => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

export function regioGuard(caseId, rounds = 60) {
  const C0 = CASES[caseId];
  const rnd = (n) => Math.floor(Math.random() * n);
  const errs = [];
  let blocks = 0;
  for (let i = 0; i < rounds; i++) {
    const land = ["DE", "CH", "LI"][i % 3];
    const F = (C0.FICTIONS || {})[land] || [];
    const cast = F.length && i % 2 === 0 ? F[rnd(F.length)] : randomCast(land, "de", rnd);
    let vars;
    try { vars = normalizeVars(caseId, { ...cast, LAND: land }, true, true, "de"); } catch (e) { continue; }
    const secrets = C0.makeSecrets(rnd, { premium: true, lang: "de", land, feier: [vars.RAUM_FEIER, vars.FIRMA, vars.STADT, vars.PARK].filter(Boolean).join(" ") });
    const session = { case_id: caseId, lang: "de", premium: 2, duration_min: RULES.durations[2], vars: JSON.stringify(vars), secrets: JSON.stringify(secrets), started_at: Date.now(), status: "running" };
    const c = caseOf(session), v = buildVars(session);
    const x = { ...vars, ...secrets, LANG: "de" };
    const T_IDX = secrets.ROLES ? secrets.ROLES.indexOf("T") : 0, M_IDX = secrets.ROLES ? secrets.ROLES.indexOf("R2") : 1;
    const parts = [];
    const add = (where, t) => parts.push([where, t]);
    for (const d of [...c.DOCS, ...(c.DOCS2 || []), ...(c.DOCS3 || [])]) add(`Akte ${d.id}`, render(d.title + "\n" + d.html, v));
    for (const p of c.FIRMA_WEB.pages) add(`Website ${p.id}`, render(p.title + "\n" + p.html, v));
    if (c.FIRMA_WEB.partner) add("Website geschützt", render(c.FIRMA_WEB.partner, v));
    for (const k of ["hint2", "hint4", "label"]) if (c.FIRMA_WEB.login && c.FIRMA_WEB.login[k]) add(`Login ${k}`, c.FIRMA_WEB.login[k]);
    for (const st of [1, 2, 3]) for (const q of stageQuestions(session, st)) add(`Frage ${q.key}`, render(q.label, v) + " " + (q.hint || ""));
    for (const q of c.BONUS || []) add(`Bonus ${q.key}`, render(q.label, v));
    for (const [k, arr] of Object.entries(c.TIPS || {})) arr.forEach((t, j) => add(`Funkspruch ${k}${j + 1}`, render(t, v)));
    for (const [k, t] of Object.entries(c.META || {})) if (typeof t === "string") add(`Text ${k}`, render(t, v));
    if (c.SONDER) {
      add("Sonder", render([c.SONDER.surprise, c.SONDER.task, c.SONDER.label, c.SONDER.tip || ""].join("\n"), v));
      add("Sonder KI", c.SONDER.system({ ...x, M_IDX, T_IDX, SCHEINFIRMA_TXT: String(v.SCHEINFIRMA || ""), T_ER: v.T_ER || "", T_HE: v.T_HE || "" }));
      for (const q of ["schicht getauscht", "hallo"]) add("Sonder Ersatz", c.SONDER.fallback({ ...x, M_IDX, T_IDX, T_NAME: "Name" }, q));
    }
    if (c.ARIA) {
      if (typeof c.ARIA.title === "function") add("KI Titel", c.ARIA.title(x, false));
      add("KI Anweisung", c.ARIA.system({ ...x, T_IDX }));
      if (c.ARIA.tip) add("KI Funkspruch", render(c.ARIA.tip, v));
      for (const q of ["kassa seit wann", "was hat er gefragt", "zelt", "hallo"]) add("KI Ersatz", c.ARIA.fallback({ ...x, T_IDX }, q));
    }
    for (const [where, t] of parts) {
      blocks++;
      let plain = txt(t).replace(/\(also Kasse statt Kassa[^)]*\)/g, "");   // die Sprachregel selbst nennt die Wörter
      if (land !== "DE") plain = plain.replace(SWISS_OK, "");
      const m = plain.match(BAD);
      if (m && errs.length < 20) errs.push(`${caseId} ${land} ${where}: österreichisch „${m[0].trim()}“ in „${plain.slice(Math.max(0, m.index - 50), m.index + 50).replace(/\s+/g, " ").trim()}“`);
    }
  }
  return { errs, blocks };
}
