// Wächter für die Antwortprüfung (Go-live-Test 4, 6.10.2026): Die richtigen Antworten jeder Stufe müssen über
// checkAnswers als richtig zählen, eine falsche als falsch – für alle Pakete, Sprachen und Länder.
// Anlass: nach Einführung der Alternativ-Antworten (…_alt) zählte die Namensfrage „helfer“ nie als richtig.
// Wird von tools/check_teams.mjs (Fall 001) und tools/check_teams002.mjs (Fall 002) aufgerufen.
import { CASES, caseOf, buildVars, stageQuestions, checkAnswers, RULES } from "../lib/game.js";
import { normalizeVars } from "../lib/create.js";
import { randomCast, COUNTRY_ORDER } from "../lib/countries.js";

export function answerGuard(caseId, rounds = 120) {
  const C0 = CASES[caseId], errs = [];
  const rnd = (n) => Math.floor(Math.random() * n);
  let checked = 0;
  for (let i = 0; i < rounds; i++) {
    const lang = i % 2 ? "en" : "de", premium = i % 3;
    const lands = COUNTRY_ORDER.filter((l) => { try { randomCast(l, lang, rnd); return true; } catch { return false; } });
    const land = lands[i % lands.length];
    let vars;
    try { vars = normalizeVars(caseId, { ...randomCast(land, lang, rnd), LAND: land }, true, true, lang); } catch { continue; }
    const secrets = C0.makeSecrets(rnd, { premium: premium > 0, lang, land, feier: [vars.RAUM_FEIER, vars.FIRMA, vars.STADT, vars.PARK].filter(Boolean).join(" ") });
    const session = { case_id: caseId, lang, premium, duration_min: RULES.durations[premium], vars: JSON.stringify(vars), secrets: JSON.stringify(secrets), started_at: Date.now(), status: "running" };
    const sol = caseOf(session).solution(secrets, vars);
    for (const st of [1, 2, 3].slice(0, premium + 1)) {
      const qs = stageQuestions(session, st);
      if (!qs.length) continue;
      const good = Object.fromEntries(qs.map((q) => [q.key, sol[q.key]]));
      const res = checkAnswers(session, good, qs);
      for (const q of qs) {
        checked++;
        if (!res[q.key] && errs.length < 20) errs.push(`${caseId} ${lang} ${land} Paket ${premium} Stufe ${st}: richtige Antwort „${sol[q.key]}“ für ${q.key} gilt als falsch`);
        const bad = checkAnswers(session, { ...good, [q.key]: q.pattern === "name" ? "Zzyzx Qwerty" : "0000" }, [q])[q.key];
        if (bad && String(sol[q.key]).replace(/\D/g, "") !== "0000" && errs.length < 20) errs.push(`${caseId} ${lang} ${land} Stufe ${st}: falsche Antwort für ${q.key} gilt als richtig`);
        // Vornamen (Go-live-Test 4): eindeutiger Vorname der richtigen Person zählt, Vorname einer anderen Person nie
        if (q.pattern === "letter" || q.pattern === "name") {
          const L = vars.LETTERS || buildVars(session).LETTERS || [], N = Number(buildVars(session).N) || 6;
          const names = Array.from({ length: N }, (_, k) => String(vars[`S${k + 1}`] || "").replace(/&#39;/g, "'").replace(/&amp;/g, "&"));
          const firsts = names.map((x) => x.split(/\s+/)[0]);
          const rightIdx = q.pattern === "letter" ? (buildVars(session).LETTERS || []).indexOf(String(sol[q.key])) : names.findIndex((x) => x === String(sol[q.key]).replace(/&#39;/g, "'").replace(/&amp;/g, "&"));
          names.forEach((nm, k) => {
            if (!nm || firsts.filter((f) => f === firsts[k]).length !== 1 || names.some((o) => o.split(/\s+/).pop().toLowerCase() === firsts[k].toLowerCase())) return;
            const ok = checkAnswers(session, { ...good, [q.key]: firsts[k] }, [q])[q.key];
            if (ok !== (k === rightIdx) && errs.length < 20) errs.push(`${caseId} ${lang} ${land} Stufe ${st}: Vorname „${firsts[k]}“ für ${q.key} gilt als ${ok ? "richtig" : "falsch"} (Lösung ${sol[q.key]})`);
            checked++;
          });
        }
      }
    }
  }
  if (!checked) errs.push(`${caseId}: keine Antwort geprüft`);
  return { errs, checked };
}
