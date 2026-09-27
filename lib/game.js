// Mordsteam Spielplattform – Spiellogik (läuft als Cloudflare Pages Function)
import * as fall001 from "./cases/fall-001.js";

export const CASES = { "fall-001": fall001 };

export const RULES = {
  wrongPenaltyMin: 5,        // Strafzeit pro falschem Lösungsversuch
  minSecondsBetween: 20,     // Mindestabstand zwischen zwei Versuchen
  checkPenaltyMin: 5,        // Kontrolltipp: zeigt, welche Antworten stimmen
  checkAfterWrong: 2,        // Kontrolltipp erst nach so vielen Fehlversuchen
  overtimeMin: 60,           // so lange nach Ablauf der Spielzeit bleibt der Fall offen
  maxTeams: 15,
  keepDays: 30,              // danach werden alle Daten gelöscht
  solutionAfterMin: 30,      // Notfall-Auflösung frühestens nach so vielen Minuten
  // Hinweise kommen automatisch – für alle Teams gleichzeitig, ohne Strafzeit.
  // Anteil der Spielzeit, nach dem der Hinweis zur jeweiligen Frage erscheint.
  hintSchedule: [
    { q: "wer", level: 1, at: 0.30 }, { q: "wann", level: 1, at: 0.38 },
    { q: "warum", level: 1, at: 0.46 }, { q: "wo", level: 1, at: 0.54 },
    { q: "wer", level: 2, at: 0.62 }, { q: "wann", level: 2, at: 0.68 },
    { q: "warum", level: 2, at: 0.74 }, { q: "wo", level: 2, at: 0.80 },
  ],
};

// Welche Hinweise sind zum Zeitpunkt "now" schon freigegeben?
export function hintTimes(session) {
  return RULES.hintSchedule.map((h) => ({ ...h, time: session.started_at + Math.round(h.at * session.duration_min) * 60000 }));
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
  const dg = c.DIEBESGUT[input.DIEBESGUT] || c.DIEBESGUT.prototyp;
  for (const [k, val] of Object.entries(dg)) if (k !== "label") v[k] = esc(val);
  v.DG_NOM_CAP = v.DG_NOM.charAt(0).toUpperCase() + v.DG_NOM.slice(1);
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
  word: (s) => String(s || "").trim().toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g, ""),
};
export function checkAnswers(session, answers) {
  const c = CASES[session.case_id];
  const sol = c.solution(JSON.parse(session.secrets));
  const result = {};
  for (const q of c.QUESTIONS) {
    const n = norm[q.pattern];
    result[q.key] = n(answers[q.key]) !== "" && n(answers[q.key]) === n(sol[q.key]);
  }
  return result;
}

// ---------- Zeit und Status ----------
export function hardEnd(session) {
  return session.started_at + (session.duration_min + RULES.overtimeMin) * 60000;
}
// Schließt eine Runde automatisch, wenn die maximale Spielzeit vorbei ist.
export async function refreshStatus(env, session) {
  if (session.status === "running" && Date.now() > hardEnd(session)) {
    const end = hardEnd(session);
    await env.DB.prepare("UPDATE sessions SET status='finished', ended_at=? WHERE id=?").bind(end, session.id).run();
    session.status = "finished";
    session.ended_at = end;
  }
  return session;
}
export function expired(session) {
  const eventMs = Date.parse(`${session.event_date}T23:59:59Z`);
  return Date.now() > eventMs + RULES.keepDays * 86400000;
}
export async function purgeSession(env, id) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM attempts WHERE team_id IN (SELECT id FROM teams WHERE session_id=?)").bind(id),
    env.DB.prepare("DELETE FROM teams WHERE session_id=?").bind(id),
    env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(id),
  ]);
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
    score_ms: teamScore(session, t),
    penalty_min: t.penalty_min,
    wrong: t.wrong,
  }));
  rows.sort((a, b) => (a.solved === b.solved ? (a.score_ms ?? 0) - (b.score_ms ?? 0) : a.solved ? -1 : 1));
  let rank = 0;
  for (const r of rows) r.rank = r.solved ? ++rank : null;
  return rows;
}
