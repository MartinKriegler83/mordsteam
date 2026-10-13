// Mordsteam Spielplattform – Spiellogik (läuft als Cloudflare Pages Function)
import * as fall001 from "./cases/fall-001.js";
import * as fall002 from "./cases/fall-002.js";

import { COUNTRY_ORDER, americanize, isUS, regioDE } from "./countries.js";

export const CASES = { "fall-001": fall001, "fall-002": fall002 };
export const LANGS = ["de", "en"];
export const langOf = (session) => (session && session.lang === "en" ? "en" : "de");

// Fall in der Spielsprache: englische Texte ersetzen die deutschen, Logik bleibt gleich
const merged = {};
export function caseOf(session) {
  const id = session.case_id || "fall-001";
  const c = CASES[id];
  if (langOf(session) !== "en" || !c.EN) return c;
  const key = id + ":en";
  if (!merged[key]) {
    const E = c.EN;
    merged[key] = { ...c, QUESTIONS: E.QUESTIONS, QUESTIONS2: E.QUESTIONS2, QUESTIONS3: E.QUESTIONS3, TIPS: E.TIPS, META: E.META,
      DOCS: E.DOCS, DOCS2: E.DOCS2, DOCS3: E.DOCS3, ARIA: E.ARIA, FIRMA_WEB: E.FIRMA_WEB, BONUS: E.BONUS || c.BONUS, SONDER: E.SONDER || c.SONDER, UI: E.UI || c.UI };
  }
  return merged[key];
}

export const RULES = {
  wrongPenaltyMin: 5,        // Strafzeit pro falschem Lösungsversuch
  minSecondsBetween: 3,      // nur Schutz vor Doppelklicks – die Strafminuten bremsen das Raten
  checkPenaltyMin: 5,        // Kontrolltipp: zeigt, welche Antworten stimmen
  checkAfterWrong: 2,        // Kontrolltipp erst nach so vielen Fehlversuchen
  countAfterWrong: 3,        // ab diesem Fehlversuch sagt die Rückmeldung kostenlos, wie viele Antworten stimmen (nicht welche)
  overtimeMin: 60,           // so lange nach Ablauf der Spielzeit bleibt der Fall offen
  maxTeams: 15,              // Obergrenze, wenn keine Teamanzahl gebucht ist (Tests)
  maxViewers: 5,             // Mitlesegeräte pro Team
  keepDays: 30,              // so lange nach Spielende bleiben die Daten, dann wird alles gelöscht
  validDays: 365,            // so lange ist ein gekaufter, nie gespielter Fall gültig (ab Kauf)
  solutionAfterMin: 30,      // Notfall-Auflösung frühestens nach so vielen Minuten
  // Spielzeit hängt am Paket: Basic 50 Min. (Akt 1), Premium 70 Min. (+ Akt 2), Premium Plus 90 Min. (+ Finale mit ARIA)
  durations: [50, 70, 90],
};
export const TIERS = ["basis", "premium", "plus"];
export const TIER_NAMES = ["Basic", "Premium", "Premium Plus"];

// ---------- Stufen ----------
// 1 = Akt 1, 2 = Akt 2 (Premium und Plus), 3 = Finale mit ARIA (nur Plus), 4 = gelöst
// Spalte sessions.premium: 0 = Basic, 1 = Premium, 2 = Premium Plus
export const tierOf = (session) => Math.max(0, Math.min(2, Number(session.premium) || 0));
export const isPremium = (session) => tierOf(session) >= 1;
export const isPlus = (session) => tierOf(session) >= 2;
export function stageOf(session, team) {
  if (team.solved_at) return 4;
  if (!team.core_at) return 1;
  if (!isPremium(session)) return 4;
  if (!team.act2_at) return 2;
  return isPlus(session) ? 3 : 4;
}
export function stageQuestions(session, stage) {
  const c = caseOf(session);
  if (stage === 1) return c.QUESTIONS;
  if (stage === 2) return c.QUESTIONS2;
  if (stage === 3) return c.QUESTIONS3 || [];
  return [];
}

// Funksprüche mit Uhrzeit (feste Minute nach Start) – eigener Plan je Paket
// Akt 2 und Finale: Ist ein Team früher dort, kommt der Funkspruch relativ zum Start des Akts
// (der frühere der beiden Zeitpunkte zählt). Akt 1 bleibt für alle Teams gleich.
// Bezeichnung eines Funkspruchs: „Frage 3“ (Akt 1 und 2), im Finale „Finale · PIN“ / „Finale · Kassensturz“
export function hintLabel(session, q) {
  const c = caseOf(session), en = langOf(session) === "en";
  if (q === "pin") return "Finale · PIN";
  if (q === "anteil") return en ? "Finale · Cash count" : "Finale · Kassensturz";
  const fin = (c.QUESTIONS3 || []).find((x) => x.key === q && x.short);
  if (fin) return `Finale · ${fin.short[en ? 1 : 0]}`;
  const i = [...c.QUESTIONS, ...(c.QUESTIONS2 || [])].findIndex((x) => x.key === q);
  return i < 0 ? (en ? "Finale" : "Finale") : en ? `Question ${i + 1}` : `Frage ${i + 1}`;
}
export function hintTimes(session, team = null) {
  const c = caseOf(session);
  const rel = c.HINTS_REL || {};
  const n = { 2: 0, 3: 0 };
  return (c.HINTS[TIERS[tierOf(session)]] || []).map((h) => {
    let time = session.started_at + h.min * 60000;
    const start = h.stage === 2 ? team && team.core_at : h.stage === 3 ? team && team.act2_at : null;
    const off = rel[h.stage] && rel[h.stage][n[h.stage]++];
    if (start && off != null) time = Math.min(time, start + off * 60000);
    return { ...h, time };
  });
}

// ---------- Hilfsfunktionen ----------
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
export const fail = (msg, status = 400) => json({ error: msg }, status);

export function randInt(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}
export function randomToken(bytes = 24) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function randomCode(len) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0/O/1/I
  let s = "";
  for (let i = 0; i < len; i++) s += abc[randInt(abc.length)];
  return s;
}
export function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export function viennaDate(ms = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

// ---------- Fall rendern ----------
export function buildVars(session) {
  const c = caseOf(session);
  const input = JSON.parse(session.vars);
  const secrets = JSON.parse(session.secrets);
  const v = {};
  for (const [key] of c.FIELDS) v[key] = esc(input[key] ?? "");
  v.LAND = COUNTRY_ORDER.includes(input.LAND) ? input.LAND : "AT";
  v.LANG = langOf(session);
  Object.assign(v, secrets);
  v.TIER = tierOf(session);   // Paket (0 Basic, 1 Premium, 2 Premium Plus) – für paketabhängige Sätze
  if (c.extraVars) Object.assign(v, c.extraVars(v));
  const start = 12 * 60 - session.duration_min;
  v.SPIELSTART = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
  return v;
}
export function render(tpl, v) {
  if (v.REGIO) tpl = regioDE(tpl, v.REGIO);         // Deutschland/Schweiz: keine österreichischen Wörter in unseren Texten (Fall 002)
  const out = tpl.replace(/\{([A-Z0-9_]+)\}/g, (m, k) => (k in v ? v[k] : m));
  if (isUS(v)) return americanize(out);              // USA: amerikanisches Englisch
  return v.CH_SS ? out.replace(/ß/g, "ss") : out;   // Schweiz: kein ß
}

// ---------- Lösung prüfen ----------
const NAME_SPECIAL = { "ø": "o", "æ": "ae", "œ": "oe", "ł": "l", "đ": "d", "ð": "d", "þ": "th", "ħ": "h", "ı": "i", "ß": "ss" };
function nameKeys(t) {
  const s0 = String(t || "").toLowerCase();
  const s = s0.replace(/[øæœłđðþħıß]/g, (c) => NAME_SPECIAL[c]);
  const strip = (u) => u.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "").toUpperCase();
  // a: Umlaute ausgeschrieben (ü = ue, ø = oe, å = aa), b: Zeichen einfach ohne Akzent (ü = u, ø = o)
  const a = strip(s0.replace(/ø/g, "oe").replace(/[æœłđðþħıß]/g, (c) => NAME_SPECIAL[c]).replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/å/g, "aa")), b = strip(s);
  return a ? [...new Set([a, b])] : [];
}
// einzeln stehende Buchstaben: „A and C“ → [A, C]
// Einzelbuchstaben: Wörter an allen Nicht-Buchstaben trennen (auch Akzente: „Lucía“ ist EIN Wort, kein „A“), „it's“ zählt nicht als „S“ (Nachtest 13.10.2026)
const singles = (s) => String(s || "").replace(/['’]s\b/gi, "").toUpperCase().split(/[^\p{L}]+/u).filter((w) => w.length === 1 && /[A-Z]/.test(w));
export const norm = {
  // Einzelne Buchstaben in der Eingabe zählen („Suspect C“, „Buchstabe C“, „It's a C“ = C); sonst der erste Buchstabe
  // Kein Rückfall auf den Anfangsbuchstaben eines Wortes: „Christian“ ist nicht „C“ (Go-live-Test 4)
  // mehrere verschiedene Buchstaben bei einer Ein-Personen-Frage = falsch („B und F“, zwei Namen – Nachtest 13.10.2026); „a“/„I“ im englischen Satz zählen nicht
  // englisches „a C“ / „I think“: kleines „a“ vor einem Buchstaben und „I“ vor einem Wort zählen nicht; danach mehrere Buchstaben = falsch
  letter: (s) => { const one = [...new Set(singles(String(s || "").replace(/\ba\s+(?=[A-Za-z]\b)/g, " ").replace(/\bI\s+(?=[a-z']{2,})/g, " ")))]; if (one.length > 1) return ""; if (one.length) return one[0]; const w = String(s || "").trim().toUpperCase().replace(/[^A-Z]/g, ""); return w.length === 1 ? w : ""; },
  // mehrere Buchstaben, Reihenfolge egal: "c, a" = "AC"
  letters: (s) => { const one = singles(s); return [...new Set(one.length >= 2 ? one : String(s || "").toUpperCase().replace(/[^A-Z]/g, ""))].sort().join(""); },
  time: (s) => {
    const raw = String(s || "").toLowerCase();
    const d = raw.replace(/[^0-9]/g, "");
    let t = d.length === 3 ? `0${d[0]}:${d.slice(1)}` : d.length === 4 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
    // 12-Stunden-Format: „6:12 pm“ = 18:12, „12:30 am“ = 00:30
    if (t.length === 5) {
      const h = Number(t.slice(0, 2));
      if (/\d\s*p\.?\s*m\b/.test(raw) && h < 12) t = `${h + 12}:${t.slice(3)}`;
      else if (/\d\s*a\.?\s*m\b/.test(raw) && h === 12) t = `00:${t.slice(3)}`;
    }
    return t;
  },
  digits4: (s) => String(s || "").replace(/[^0-9]/g, "").slice(-4),
  spot: (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
  num: (s) => String(s || "").replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, ""),
  // Geldbetrag: Tausenderpunkte, Währung und Cent („3.460,00 €“, „€ 3,460.00“, „3460,-“) egal – zählt der ganze Betrag
  amount: (s) => String(s || "").replace(/[^0-9.,]/g, "").replace(/[.,]-?$/, "").replace(/[.,]\d{1,2}$/, "").replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, ""),
  // Name: es reicht der Nachname (letztes Wort); Groß-/Kleinschreibung, Bindestriche, Akzente egal.
  // Umlaute zählen auf beide Arten: „Müller“ = „Mueller“ = „Muller“, „García“ = „Garcia“, „Groß“ = „Gross“
  name: (s) => nameKeys((String(s || "").trim().split(/\s+/).pop() || "")),
  word: (s) => String(s || "").trim().toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g, ""),
};
// Vergleich: Text gegen Text, oder Listen erlaubter Schreibweisen (Namen) – eine gemeinsame reicht
export function same(a, b) {
  const A = [].concat(a).filter((x) => x !== ""), B = [].concat(b);
  return A.length > 0 && A.some((x) => B.includes(x));
}
// Buchstaben-Fragen: wer statt des Buchstabens einen Namen eingibt („Madison Brown“, „Brown and Lee“), bekommt den Buchstaben
export function namesToLetters(session, value) {
  const v = buildVars(session), n = Number(v.N) || 0, L = v.LETTERS || [];
  let t = String(value || "");
  if (!t.trim() || /^[\s,&+/A-Za-z]{1,9}$/.test(t) && t.replace(/[^A-Za-z]/g, "").length <= 2) return t;
  const people = Array.from({ length: n }, (_, i) => ({ l: L[i], name: String(v[`S${i + 1}`] || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'") })).filter((p) => p.l && p.name);
  const hits = [];
  // Wörter der Eingabe; Vergleich über nameKeys – Akzente und Umlaute egal („Cote“ = „Côté“, „Mueller“ = „Müller“, Go-live-Check 13.10.2026).
  // Reihenfolge (Nachtest 13.10.): 1. volle Namen, deren Wörter dann verbraucht sind – so wird „Thomas Girard“ nicht auch zu „Chloé Thomas“;
  // 2. Nachname allein nur auf übrigen Wörtern und nur, wenn ihn genau eine Person trägt (z. B. zwei „Jönsson“ – Go-live-Test 4); 3. Vorname allein.
  const words = t.toLowerCase().split(/[^\p{L}'’-]+/u).filter(Boolean), used = new Set();
  const find = (w) => words.findIndex((x, i) => !used.has(i) && sameName(x, w));
  const partsOf = (p) => p.name.toLowerCase().split(/\s+/).filter(Boolean);
  for (const p of people) {
    // voller Name nur aus nebeneinanderstehenden Wörtern (vorwärts oder „Nachname Vorname“)
    const parts = partsOf(p), k = parts.length;
    const at = (i, ws) => ws.every((w, j) => !used.has(i + j) && i + j < words.length && sameName(words[i + j], w));
    const i = words.findIndex((_, i) => at(i, parts) || (k === 2 && at(i, [parts[1], parts[0]])));
    if (i >= 0) { for (let j = 0; j < k; j++) used.add(i + j); hits.push(p.l); }
  }
  for (const p of people) {
    if (hits.includes(p.l)) continue;
    const parts = partsOf(p), last = parts[parts.length - 1];
    // mehrteiliger Nachname („De Luca“) als Ganzes – eindeutig, auch wenn „Luca“ ein Vorname ist (Nachtest 13.10.2026)
    const sur = parts.slice(1), at = (i) => sur.every((w, j) => !used.has(i + j) && i + j < words.length && sameName(words[i + j], w));
    if (sur.length > 1) { const i = words.findIndex((_, i) => at(i)); if (i >= 0) { sur.forEach((_, j) => used.add(i + j)); hits.push(p.l); continue; } }   // sonst wie gewohnt: letztes Wort („Cruz“ für Ana de la Cruz)
    const i = find(last);
    // … und nicht, wenn das Wort zugleich Vorname einer anderen Person ist („Thomas“ bei Chloé Thomas und Thomas Girard → mehrdeutig)
    if (i >= 0 && uniqueLast(people, last) && !people.some((q) => q !== p && sameName(partsOf(q)[0], last))) { used.add(i); hits.push(p.l); }
  }
  // Nur der Vorname („Shane“): zählt, wenn ihn in der Runde genau eine verdächtige Person trägt (Go-live-Test 4)
  if (!hits.length) for (const p of people) { const first = partsOf(p)[0], i = find(first); if (i >= 0 && uniqueFirst(people, first) && !people.some((q) => q !== p && sameName(partsOf(q).slice(-1)[0], first))) { used.add(i); hits.push(p.l); } }
  // Paarfrage gemischt („Léa Vincent und F“): einzeln stehende Großbuchstaben aus der Liste zählen zusätzlich (Nachtest 13.10.2026)
  if (hits.length) for (const w of t.split(/[^\p{L}]+/u)) if (/^[A-Z]$/.test(w) && L.includes(w) && !hits.includes(w)) hits.push(w);
  return hits.length ? hits.join(" ") : t;
}
// gleicher Nachname auch über Schreibweisen hinweg („Jönsson“ = „Jonsson“), wie bei der Antwortprüfung
const sameName = (a, b) => { const A = nameKeys(a), B = nameKeys(b); return A.some((x) => B.includes(x)); };
const uniqueLast = (people, last) => people.filter((q) => sameName(q.name.toLowerCase().split(/\s+/).pop(), last)).length === 1;
const uniqueFirst = (people, first) => people.filter((q) => sameName(q.name.toLowerCase().split(/\s+/)[0], first)).length === 1;
// Namens-Fragen (z. B. „Wer hat geholfen?“): wer nur den Buchstaben aus der Übersicht eingibt („C“, „Buchstabe C“), bekommt den Namen (Go-live-Test 3, T1-9)
export function lettersToName(session, value) {
  let t = String(value || "").trim();
  // „Name (C)“ → C; „Nachname, Vorname“ → „Vorname Nachname“ (Nachtest 13.10.2026)
  const paren = t.match(/\(([a-z])\)\s*$/i); if (paren) t = paren[1];
  const comma = t.match(/^([\p{L}'’-]+(?:\s+[\p{L}'’-]+)?)\s*,\s*([\p{L}'’-]+)$/u); if (comma) t = `${comma[2]} ${comma[1]}`;
  const m = t.match(/^(?:(?:buchstabe|person|verdächtige[r]?|suspect|letter)\s+)?([a-z])\.?$/i);
  if (!m) {
    // Namen wie bei den Buchstaben-Fragen zuordnen (Nachtest 13.10.2026): genau eine Person → ihr voller Name; zwei Personen → falsch;
    // ein einzelnes Wort, das mehrdeutig ist („Thomas“ = Vorname der einen, Nachname der anderen) → falsch; sonst bleibt die Eingabe (Nachname zählt)
    const v = buildVars(session), n = Number(v.N) || 0, L = v.LETTERS || [];
    const r = namesToLetters(session, t);
    if (r !== t) { const ls = r.split(" "); if (ls.length > 1) return ""; const k = L.indexOf(ls[0]); return k >= 0 ? String(v[`S${k + 1}`] || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'") : t; }
    if (/^[\p{L}'’-]+$/u.test(t)) {
      const people = Array.from({ length: n }, (_, i) => String(v[`S${i + 1}`] || "").toLowerCase().split(/\s+/)).filter((p) => p[0]);
      if (people.filter((p) => sameName(p[0], t) || sameName(p[p.length - 1], t)).length > 1 || people.some((p) => sameName(p[0], t))) return "";
    }
    return t;
  }
  const v = buildVars(session), L = v.LETTERS || [], i = L.indexOf(m[1].toUpperCase());
  return i >= 0 && v[`S${i + 1}`] ? String(v[`S${i + 1}`]).replace(/&amp;/g, "&").replace(/&#39;/g, "'") : t;
}
export function checkAnswers(session, answers, questions) {
  const c = caseOf(session);
  const sol = c.solution(JSON.parse(session.secrets), JSON.parse(session.vars));
  const result = {};
  for (const q of questions) {
    const n = norm[q.pattern];
    const given = q.pattern === "letter" || q.pattern === "letters" ? namesToLetters(session, answers[q.key]) : q.pattern === "name" ? lettersToName(session, answers[q.key]) : answers[q.key];
    // Alternative richtige Antwort, falls der Fall eine kennt (z. B. Fall 002: beide Minuten am Kühlanhänger)
    // Namen liefern Listen von Schreibweisen – deshalb flach zusammenführen (Go-live-Test 4: „helfer“ wurde nie als richtig gewertet)
    result[q.key] = same(n(given), [].concat(n(sol[q.key]), sol[q.key + "_alt"] != null ? n(sol[q.key + "_alt"]) : []));
    // Namensfragen: Tragen mehrere Verdächtige denselben Nachnamen, zählt nur die richtige Person (voller Name oder eindeutiger Vorname)
    if (q.pattern === "name" && result[q.key]) {
      const v = buildVars(session), N = Number(v.N) || 0, clean = (x) => String(x || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'");
      const people = Array.from({ length: N }, (_, i) => ({ l: (v.LETTERS || [])[i], name: clean(v[`S${i + 1}`]) })).filter((p) => p.name);
      const solLast = clean(sol[q.key]).toLowerCase().split(/\s+/).pop();
      if (!uniqueLast(people, solLast)) {
        const hit = namesToLetters(session, given).trim(), solL = (people.find((p) => p.name === clean(sol[q.key])) || {}).l;
        result[q.key] = !!solL && hit === solL;
      }
    }
  }
  return result;
}

// ---------- Zeit und Status ----------
export function hardEnd(session) {
  return session.started_at + (session.duration_min + RULES.overtimeMin) * 60000;
}
// ---------- Anonyme Spielstatistik ----------
// Beim Rundenende wird pro Team eine Zeile ohne Namen gespeichert (bleibt auch nach dem Löschen der Runde).
// Damit lassen sich Schwierigkeit und Hinweis-Zeiten im Live-Betrieb nachjustieren.
export async function recordStats(env, session) {
  try {
    if (!session.started_at) return;
    const { results: teams } = await env.DB.prepare("SELECT * FROM teams WHERE session_id=? ORDER BY created_at").bind(session.id).all();
    if (!teams.length) return;
    const min = (t) => (t ? Math.round((t - session.started_at) / 600) / 100 : null);
    const hintsOf = (t) => hintTimes(session, t);
    const stmts = [];
    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      const { results: att } = await env.DB.prepare("SELECT payload, correct FROM attempts WHERE team_id=? ORDER BY at").bind(t.id).all();
      const wrongBy = {};
      for (const a of att) {
        if (a.correct) continue;
        let p = {}; try { p = JSON.parse(a.payload); } catch {}
        const res = checkAnswers(session, p, stageQuestions(session, p.stage || 1));
        for (const [k, ok] of Object.entries(res)) if (!ok) wrongBy[k] = (wrongBy[k] || 0) + 1;
      }
      const hints = hintsOf(t);
      const hintsBefore = (stage, until) => hints.filter((h) => h.stage === stage && h.time <= (until || session.ended_at || Date.now())).length;
      const v = await env.DB.prepare("SELECT COUNT(*) AS n FROM viewers WHERE team_id=?").bind(t.id).first().catch(() => ({ n: 0 }));
      stmts.push(env.DB.prepare(
        "INSERT OR IGNORE INTO stats_teams (session_id, team_no, recorded_at, case_id, premium, test_mode, duration_min, teams_in_round, stage_reached, core_min, act2_min, solved_min, attempts, wrong, penalty_min, wrong_by_q, hints_akt1, hints_akt2, viewers) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(session.id, i + 1, Date.now(), session.case_id, tierOf(session), session.test_mode ? 1 : 0, session.duration_min, teams.length,
        stageOf(session, t), min(t.core_at), min(t.act2_at), min(t.solved_at), att.length, t.wrong, t.penalty_min, JSON.stringify(wrongBy),
        hintsBefore(1, t.core_at), isPremium(session) ? hintsBefore(2, t.act2_at) : 0, v?.n || 0));
    }
    await env.DB.batch(stmts);
  } catch (e) { /* Statistik darf das Spiel nie stören */ }
}

// Beendet die Runde, sobald alle angemeldeten Teams den Fall ganz gelöst haben.
export async function finishIfAllSolved(env, session, now = Date.now()) {
  if (session.status !== "running") return false;
  // Fertig = gelöst und Zusatzermittlung abgeschlossen (bonus_done_at)
  const r = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN solved_at IS NOT NULL AND bonus_done_at IS NOT NULL THEN 1 ELSE 0 END) AS s FROM teams WHERE session_id=?").bind(session.id).first();
  if (!r || !r.n || r.s < r.n) return false;
  const u = await env.DB.prepare("UPDATE sessions SET status='finished', ended_at=? WHERE id=? AND status='running'").bind(now, session.id).run();
  if (u.meta?.changes) await recordStats(env, { ...session, status: "finished", ended_at: now });
  return true;
}
// Schließt eine Runde automatisch, wenn die maximale Spielzeit vorbei ist.
export async function refreshStatus(env, session) {
  if (session.status === "running" && Date.now() > hardEnd(session)) {
    const end = hardEnd(session);
    await env.DB.prepare("UPDATE sessions SET status='finished', ended_at=? WHERE id=?").bind(end, session.id).run();
    session.status = "finished";
    session.ended_at = end;
    await recordStats(env, session);
  }
  return session;
}
// Gelöscht wird 30 Tage nach Spielende. Wurde der Fall nie gespielt: 12 Monate nach dem Kauf (+30 Tage).
export function expired(session) {
  const day = 86400000;
  if (session.ended_at) return Date.now() > session.ended_at + RULES.keepDays * day;
  const base = session.created_at || Date.parse(`${session.event_date}T23:59:59Z`);
  return Date.now() > base + (RULES.validDays + RULES.keepDays) * day;
}
export async function purgeSession(env, id) {
  const s = await env.DB.prepare("SELECT * FROM sessions WHERE id=?").bind(id).first();
  if (s && s.status === "finished") await recordStats(env, s); // falls noch nicht erfasst (INSERT OR IGNORE)
  await env.DB.batch([
    env.DB.prepare("DELETE FROM attempts WHERE team_id IN (SELECT id FROM teams WHERE session_id=?)").bind(id),
    env.DB.prepare("DELETE FROM viewers WHERE team_id IN (SELECT id FROM teams WHERE session_id=?)").bind(id),
    env.DB.prepare("DELETE FROM aria_msgs WHERE team_id IN (SELECT id FROM teams WHERE session_id=?)").bind(id),
    env.DB.prepare("DELETE FROM teams WHERE session_id=?").bind(id),
    env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(id),
  ]);
  // Personaldaten aus der Bestellung entfernen (Betrag, Kontakt und Datum bleiben für die Buchhaltung)
  try { await env.DB.prepare("UPDATE orders SET vars=json_object('FIRMA', json_extract(vars,'$.FIRMA')), logo=NULL WHERE session_id=?").bind(id).run(); } catch {}
}

export function teamScore(session, t) {
  if (!t.solved_at) return null;
  // Zusatzermittlung: jede richtige Bonusantwort zieht Minuten ab (nur für die Rangliste)
  return t.solved_at - session.started_at + t.penalty_min * 60000 - (t.bonus_min || 0) * 60000;
}
export async function ranking(env, session) {
  const { results } = await env.DB.prepare("SELECT * FROM teams WHERE session_id=? ORDER BY created_at").bind(session.id).all();
  const rows = results.map((t) => ({
    name: t.name,
    solved: !!t.solved_at,
    solved_at: t.solved_at || null,
    core: !!t.core_at,
    stage: stageOf(session, t),
    score_ms: teamScore(session, t),
    penalty_min: t.penalty_min,
    wrong: t.wrong,
    bonus_min: t.bonus_min || 0,
    bonus_done: t.solved_at ? !!t.bonus_done_at : null,
    sonder: (() => { try { return !!(JSON.parse(t.bonus || "{}").s_ziel || {}).ok; } catch { return false; } })(),  // Sonderauftrag gelöst: Auszeichnung, keine Minuten
  }));
  rows.sort((a, b) => (a.solved === b.solved ? (a.score_ms ?? 0) - (b.score_ms ?? 0) : a.solved ? -1 : 1));
  let rank = 0;
  for (const r of rows) r.rank = r.solved ? ++rank : null;
  return rows;
}
