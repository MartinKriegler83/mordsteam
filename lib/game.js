// Mordsteam Spielplattform – Spiellogik (läuft als Cloudflare Pages Function)
import * as fall001 from "./cases/fall-001.js";

export const CASES = { "fall-001": fall001 };

export const RULES = {
  wrongPenaltyMin: 5,        // Strafzeit pro falschem Lösungsversuch
  minSecondsBetween: 20,     // Mindestabstand zwischen zwei Versuchen
  checkPenaltyMin: 5,        // Kontrolltipp: zeigt, welche Antworten stimmen
  checkAfterWrong: 2,        // Kontrolltipp erst nach so vielen Fehlversuchen
  overtimeMin: 60,           // so lange nach Ablauf der Spielzeit bleibt der Fall offen
  maxTeams: 15,              // Obergrenze, wenn keine Teamanzahl gebucht ist (Tests)
  maxViewers: 5,             // Mitlesegeräte pro Team
  keepDays: 30,              // danach werden alle Daten gelöscht
  solutionAfterMin: 30,      // Notfall-Auflösung frühestens nach so vielen Minuten
  // Spielzeit hängt am Paket: Basis 60 Minuten, Premium 90 Minuten (mit Akt 2 und Kuvert)
  durationBasis: 60,
  durationPremium: 90,
};

// ---------- Stufen ----------
// 1 = Akt 1, 2 = Akt 2 (Premium), 3 = Kuvert/Karte (Premium), 4 = gelöst
export const isPremium = (session) => !!session.premium;
export function stageOf(session, team) {
  if (team.solved_at) return 4;
  if (!team.core_at) return 1;
  if (!isPremium(session)) return 4;
  return team.act2_at ? 3 : 2;
}
export function cardCode(session) {
  return session.premium_answer || CASES[session.case_id].CARD_CODE;
}
export function stageQuestions(session, stage) {
  const c = CASES[session.case_id];
  if (stage === 1) return c.QUESTIONS;
  if (stage === 2) return c.QUESTIONS2;
  if (stage === 3) return [{ key: "karte", label: "Welcher Code steht auf der Zugangskarte {OPFER_CHEF_GEN}?", hint: "Ein Wort", pattern: "word" }];
  return [];
}

// Funksprüche mit Uhrzeit (feste Minute nach Start); Akt 2 und Kuvert nur im Premium-Paket
export function hintTimes(session) {
  const c = CASES[session.case_id];
  return c.HINTS.filter((h) => h.stage === 1 || isPremium(session))
    .map((h) => ({ ...h, time: session.started_at + h.min * 60000 }));
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
  const c = CASES[session.case_id];
  const input = JSON.parse(session.vars);
  const secrets = JSON.parse(session.secrets);
  const v = {};
  for (const [key] of c.FIELDS) v[key] = esc(input[key] ?? "");
  Object.assign(v, secrets);
  if (c.extraVars) Object.assign(v, c.extraVars(v));
  const start = 12 * 60 - session.duration_min;
  v.SPIELSTART = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
  return v;
}
export function render(tpl, v) {
  return tpl.replace(/\{([A-Z0-9_]+)\}/g, (m, k) => (k in v ? v[k] : m));
}

// ---------- Lösung prüfen ----------
const norm = {
  letter: (s) => String(s || "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1),
  time: (s) => {
    const d = String(s || "").replace(/[^0-9]/g, "");
    if (d.length === 3) return `0${d[0]}:${d.slice(1)}`;
    if (d.length === 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
    return d;
  },
  digits4: (s) => String(s || "").replace(/[^0-9]/g, "").slice(-4),
  spot: (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
  num: (s) => String(s || "").replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, ""),
  // Name: es reicht der Nachname (letztes Wort); Groß-/Kleinschreibung und Bindestriche egal
  name: (s) => (String(s || "").trim().toUpperCase().replace(/ß/g, "SS").split(/\s+/).pop() || "").replace(/[^A-ZÄÖÜ]/g, ""),
  word: (s) => String(s || "").trim().toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g, ""),
};
export function checkAnswers(session, answers, questions) {
  const c = CASES[session.case_id];
  const sol = { ...c.solution(JSON.parse(session.secrets), JSON.parse(session.vars)), karte: cardCode(session) };
  const result = {};
  for (const q of questions) {
    const n = norm[q.pattern];
    result[q.key] = n(answers[q.key]) !== "" && n(answers[q.key]) === n(sol[q.key]);
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
    const hints = hintTimes(session);
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
      const hintsBefore = (stage, until) => hints.filter((h) => h.stage === stage && h.time <= (until || session.ended_at || Date.now())).length;
      const v = await env.DB.prepare("SELECT COUNT(*) AS n FROM viewers WHERE team_id=?").bind(t.id).first().catch(() => ({ n: 0 }));
      stmts.push(env.DB.prepare(
        "INSERT OR IGNORE INTO stats_teams (session_id, team_no, recorded_at, case_id, premium, test_mode, duration_min, teams_in_round, stage_reached, core_min, act2_min, solved_min, attempts, wrong, penalty_min, wrong_by_q, hints_akt1, hints_akt2, viewers) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(session.id, i + 1, Date.now(), session.case_id, session.premium ? 1 : 0, session.test_mode ? 1 : 0, session.duration_min, teams.length,
        stageOf(session, t), min(t.core_at), min(t.act2_at), min(t.solved_at), att.length, t.wrong, t.penalty_min, JSON.stringify(wrongBy),
        hintsBefore(1, t.core_at), session.premium ? hintsBefore(2, t.act2_at) : 0, v?.n || 0));
    }
    await env.DB.batch(stmts);
  } catch (e) { /* Statistik darf das Spiel nie stören */ }
}

// Beendet die Runde, sobald alle angemeldeten Teams den Fall ganz gelöst haben.
export async function finishIfAllSolved(env, session, now = Date.now()) {
  if (session.status !== "running") return false;
  const r = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN solved_at IS NOT NULL THEN 1 ELSE 0 END) AS s FROM teams WHERE session_id=?").bind(session.id).first();
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
export function expired(session) {
  const eventMs = Date.parse(`${session.event_date}T23:59:59Z`);
  return Date.now() > eventMs + RULES.keepDays * 86400000;
}
export async function purgeSession(env, id) {
  const s = await env.DB.prepare("SELECT * FROM sessions WHERE id=?").bind(id).first();
  if (s && s.status === "finished") await recordStats(env, s); // falls noch nicht erfasst (INSERT OR IGNORE)
  await env.DB.batch([
    env.DB.prepare("DELETE FROM attempts WHERE team_id IN (SELECT id FROM teams WHERE session_id=?)").bind(id),
    env.DB.prepare("DELETE FROM viewers WHERE team_id IN (SELECT id FROM teams WHERE session_id=?)").bind(id),
    env.DB.prepare("DELETE FROM teams WHERE session_id=?").bind(id),
    env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(id),
  ]);
  // Personaldaten aus der Bestellung entfernen (Betrag, Kontakt und Datum bleiben für die Buchhaltung)
  try { await env.DB.prepare("UPDATE orders SET vars=json_object('FIRMA', json_extract(vars,'$.FIRMA')), logo=NULL WHERE session_id=?").bind(id).run(); } catch {}
}

export function teamScore(session, t) {
  if (!t.solved_at) return null;
  return t.solved_at - session.started_at + t.penalty_min * 60000;
}
export async function ranking(env, session) {
  const { results } = await env.DB.prepare("SELECT * FROM teams WHERE session_id=? ORDER BY created_at").bind(session.id).all();
  const rows = results.map((t) => ({
    name: t.name,
    solved: !!t.solved_at,
    core: !!t.core_at,
    stage: stageOf(session, t),
    score_ms: teamScore(session, t),
    penalty_min: t.penalty_min,
    wrong: t.wrong,
  }));
  rows.sort((a, b) => (a.solved === b.solved ? (a.score_ms ?? 0) - (b.score_ms ?? 0) : a.solved ? -1 : 1));
  let rank = 0;
  for (const r of rows) r.rank = r.solved ? ++rank : null;
  return rows;
}
