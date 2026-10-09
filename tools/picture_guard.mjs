// Prüft die Bild-Rätsel der Teams-Fälle (seit 9.10.2026) in gerenderten Runden:
// Fall 001 – Archivregal: Platz aus dem Scan-Protokoll (Ausweis des Täters) → Karton auf dem Foto = Lösung „wo“, Aufkleber rot.
// Fall 002 – Strichliste: Summe der drei Zählungen je Sorte = eingelöste Bons laut Lösung (Betrag stimmt).
import { CASES, caseOf, buildVars, render, RULES } from "../lib/game.js";
import { normalizeVars } from "../lib/create.js";
import { randomCast, COUNTRY_ORDER } from "../lib/countries.js";
export function pictureGuard(caseId, rounds = 60) {
  const C0 = CASES[caseId], rnd = (n) => Math.floor(Math.random() * n), errs = new Set();
  for (let i = 0; i < rounds; i++) {
    const lang = i % 2 ? "en" : "de", land = COUNTRY_ORDER[rnd(COUNTRY_ORDER.length)];
    let vars;
    try { vars = normalizeVars(caseId, { ...(C0.randomCast || randomCast)(land, lang, rnd), LAND: land }, true, true, lang); } catch (e) { continue; }
    const premium = i % 3;
    const secrets = C0.makeSecrets(rnd, { premium: premium > 0, lang, land, feier: [vars.RAUM_FEIER, vars.FIRMA, vars.STADT, vars.PARK].filter(Boolean).join(" ") });
    const session = { case_id: caseId, lang, premium, duration_min: RULES.durations[premium], vars: JSON.stringify(vars), secrets: JSON.stringify(secrets), started_at: Date.now(), status: "running" };
    const c = caseOf(session), v = buildVars(session), sol = c.solution(secrets);
    const tag = `${caseId} ${land}/${lang}`;
    if (caseId === "fall-001") {
      const d = c.DOCS.find((x) => x.id === "13b-archiv"), h = render(d.html, v);
      const tAus = String(v.T_AUSWEIS || "");
      const rows = [...h.matchAll(/<tr><td>(\d\d:\d\d)<\/td><td>([^<]+)<\/td><td>[^<]+<\/td><td>([^<]+)<\/td><\/tr>/g)];
      const tRow = rows.find((r) => r[1] === "19:56");
      if (!tRow) { errs.add(`${tag}: Archiv-Zeile 19:56 fehlt`); continue; }
      const m = tRow[2].match(/([ABC])\s·\s\S+\s(\d)/);
      const slot = m ? m[1] + m[2] : "";
      const box = h.match(new RegExp(`data-slot="${slot}" data-box="([^"]+)" data-col="([^"]+)"`));
      if (!box) errs.add(`${tag}: kein Karton auf dem Foto an ${slot}`);
      else { if (box[1] !== sol.wo) errs.add(`${tag}: Foto ${slot} zeigt ${box[1]}, Lösung ${sol.wo}`); if (box[2] !== "rot") errs.add(`${tag}: Versteck-Karton nicht rot`); }
      const ids = [...h.matchAll(/data-box="([^"]+)"/g)].map((x) => x[1]);
      if (new Set(ids).size !== ids.length) errs.add(`${tag}: Kartonkennung doppelt`);
      if (/>\s*[A-D]\d\d-\d{3}\s*</.test(h.replace(/<svg[\s\S]*?<\/svg>/g, ""))) errs.add(`${tag}: Kartonkennung steht im Text`);
      if (tAus && !tRow[3].includes(tAus)) errs.add(`${tag}: 19:56 nicht mit Täter-Ausweis`);
      const k = c.DOCS.find((x) => x.id === "10b-kantine");
      if (!k || /\{[A-Z_]+\}/.test(render(k.html, v))) errs.add(`${tag}: Kantine-Akte fehlt oder Platzhalter offen`);
    } else {
      const page = render(c.FIRMA_WEB.partner, v);
      const sum = [...page.matchAll(/<g data-row="(\d)">([\s\S]*?)<\/g>\s*(?=<g data-row|<text)/g)];
      const totals = [...page.matchAll(/<g data-row="(\d)">/g)].map((m) => {
        const seg = page.slice(m.index, page.indexOf('<g data-row="' + (Number(m[1]) + 1) + '"', m.index + 5) > 0 ? page.indexOf('<g data-row="' + (Number(m[1]) + 1) + '"', m.index + 5) : undefined);
        return [...seg.matchAll(/data-n="(\d+)"/g)].reduce((a, x) => a + Number(x[1]), 0);
      });
      const want = secrets.SOLD.map((s, j) => s + secrets.DIFF[j]);
      if (totals.length !== 4 || totals.some((t, j) => t !== want[j])) errs.add(`${tag}: Strichliste ${totals} ≠ ${want}`);
      const z = c.DOCS.find((x) => x.id === "20b-zettel");
      if (!z || /\{[A-Z_]+\}/.test(render(z.html, v))) errs.add(`${tag}: Zettel-Akte fehlt oder Platzhalter offen`);
    }
  }
  return [...errs];
}
