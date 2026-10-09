// Prüft gerenderte Teams-Akten auf offene Platzhalter wie {TORTE} (passiert, wenn ein Wert nach „all“ gesetzt wird).
import { CASES, caseOf, buildVars, render, RULES } from "../lib/game.js";
import { normalizeVars } from "../lib/create.js";
import { randomCast, COUNTRY_ORDER } from "../lib/countries.js";
export function placeholderGuard(caseId, rounds = 40) {
  const C0 = CASES[caseId], rnd = (n) => Math.floor(Math.random() * n), errs = new Set();
  for (let i = 0; i < rounds; i++) {
    const lang = i % 2 ? "en" : "de", land = COUNTRY_ORDER[rnd(COUNTRY_ORDER.length)];
    let vars;
    try { vars = normalizeVars(caseId, { ...(C0.randomCast || randomCast)(land, lang, rnd), LAND: land }, true, true, lang); } catch (e) { continue; }
    const secrets = C0.makeSecrets(rnd, { premium: true, lang, land, feier: [vars.RAUM_FEIER, vars.FIRMA, vars.STADT, vars.PARK].filter(Boolean).join(" ") });
    const session = { case_id: caseId, lang, premium: 2, duration_min: RULES.durations[2], vars: JSON.stringify(vars), secrets: JSON.stringify(secrets), started_at: Date.now(), status: "running" };
    const c = caseOf(session), v = buildVars(session);
    for (const d of [...c.DOCS, ...(c.DOCS2 || []), ...(c.DOCS3 || [])]) { const m = render(d.title + d.html, v).match(/\{[A-Z0-9_]{3,}\}/); if (m) errs.add(`${caseId} ${land}/${lang} Akte ${d.id}: offener Platzhalter ${m[0]}`); }
  }
  return [...errs];
}
