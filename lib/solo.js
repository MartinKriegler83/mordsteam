// Mordsteam Solo – Spiellogik für Einzelfälle (ein Code = ein Ticket; jeder Durchgang = ein Run)
// Der erste Durchgang zählt für den Prozentwert („schneller als X %“), Wiederholungen bekommen einen anderen Täter.
import { json, fail, randInt, randomToken, randomCode, esc } from "./game.js";
import * as solo001 from "./cases/solo-001.js";

export const SOLO_CASES = { "solo-001": solo001 };
const MAX_MIN = 120;          // danach wird ein ungelöster Durchgang geschlossen
const KEEP_DAYS = 30;         // Name und Durchgänge werden 30 Tage nach dem letzten Spielende gelöscht
const VALID_DAYS = 365;       // nie gespielte Tickets gelten 12 Monate

let ready = false;
export async function migrateSolo(env) {
  if (ready) return;
  const stmts = [
    "CREATE TABLE IF NOT EXISTS solo_tickets (code TEXT PRIMARY KEY, case_id TEXT NOT NULL, lang TEXT, name TEXT, order_id TEXT, test_mode INTEGER DEFAULT 0, created_at INTEGER NOT NULL, voucher TEXT, status TEXT DEFAULT 'active')",
    "CREATE TABLE IF NOT EXISTS solo_runs (id TEXT PRIMARY KEY, code TEXT NOT NULL, token TEXT NOT NULL, culprit TEXT NOT NULL, first_play INTEGER NOT NULL, started_at INTEGER NOT NULL, solved_at INTEGER, ended_at INTEGER, stage INTEGER NOT NULL DEFAULT 1, penalty_min INTEGER NOT NULL DEFAULT 0, wrong INTEGER NOT NULL DEFAULT 0, hints TEXT NOT NULL DEFAULT '{}', last_try INTEGER, score_ms INTEGER, pct INTEGER, pct_n INTEGER)",
    "CREATE INDEX IF NOT EXISTS solo_runs_code ON solo_runs(code)",
    "CREATE INDEX IF NOT EXISTS solo_runs_token ON solo_runs(token)",
    // anonyme Wertung (bleibt nach dem Löschen): nur Fall, Testkennzeichen, Zeit
    "CREATE TABLE IF NOT EXISTS solo_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL, test_mode INTEGER NOT NULL, score_ms INTEGER NOT NULL, hints INTEGER, wrong INTEGER, recorded_at INTEGER NOT NULL)",
  ];
  for (const s of stmts) { try { await env.DB.prepare(s).run(); } catch {} }
  ready = true;
}

async function purge(env) {
  const day = 86400000, now = Date.now();
  const old = "SELECT code FROM solo_runs GROUP BY code HAVING MAX(COALESCE(ended_at, started_at)) < ?";
  try {
    await env.DB.prepare(`UPDATE solo_tickets SET name=NULL, status='done' WHERE code IN (${old})`).bind(now - KEEP_DAYS * day).run();
    await env.DB.prepare(`DELETE FROM solo_runs WHERE code IN (${old})`).bind(now - KEEP_DAYS * day).run();
    await env.DB.prepare("UPDATE solo_tickets SET name=NULL, status='expired' WHERE status='active' AND created_at < ? AND NOT EXISTS (SELECT 1 FROM solo_runs r WHERE r.code=solo_tickets.code)").bind(now - (VALID_DAYS + KEEP_DAYS) * day).run();
  } catch {}
}

// Ticket anlegen (Shop nach dem Bezahlen oder Admin-Test). Codes beginnen mit „S“.
export async function createSoloTicket(env, { caseId = "solo-001", lang = "de", name = "", orderId = null, test = false } = {}) {
  await migrateSolo(env);
  for (let i = 0; i < 8; i++) {
    const code = "S" + randomCode(7);
    try {
      await env.DB.prepare("INSERT INTO solo_tickets (code, case_id, lang, name, order_id, test_mode, created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(code, caseId, lang, cleanName(name) || null, orderId, test ? 1 : 0, Date.now()).run();
      return code;
    } catch {}
  }
  throw new Error("Code konnte nicht erzeugt werden.");
}

const cleanName = (s) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
const normCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
const normTime = (s) => {
  const d = String(s || "").replace(/[^0-9]/g, "");
  if (d.length === 3) return `0${d[0]}:${d.slice(1)}`;
  if (d.length === 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
  return d;
};

async function ticketOf(env, code) {
  const t = await env.DB.prepare("SELECT * FROM solo_tickets WHERE code=?").bind(normCode(code)).first();
  if (!t || t.status !== "active") return null;
  return t;
}
async function runsOf(env, code) {
  return (await env.DB.prepare("SELECT * FROM solo_runs WHERE code=? ORDER BY started_at").bind(code).all()).results;
}
async function closeIfOver(env, run) {
  if (!run.ended_at && Date.now() > run.started_at + MAX_MIN * 60000) {
    run.ended_at = run.started_at + MAX_MIN * 60000;
    await env.DB.prepare("UPDATE solo_runs SET ended_at=? WHERE id=?").bind(run.ended_at, run.id).run();
  }
  return run;
}

// ---------- öffentliche Aufrufe ----------
export async function soloTicketInfo(env, url) {
  await migrateSolo(env);
  const t = await ticketOf(env, url.searchParams.get("code"));
  if (!t) return fail("Diesen Code gibt es nicht (oder er ist nicht mehr gültig). Bitte prüfe die Schreibweise.", 404);
  const runs = await runsOf(env, t.code);
  for (const r of runs) await closeIfOver(env, r);
  const active = runs.find((r) => !r.ended_at);
  const C = SOLO_CASES[t.case_id];
  return json({ found: true, code: t.code, name: t.name || "", lang: t.lang || "de", title: C.TITLE, limit_min: C.LIMIT_MIN,
    runs: runs.length, active: !!active, token: active ? active.token : runs.length ? runs[runs.length - 1].token : null, briefing: C.briefing(esc(t.name || "{NAME}")) });
}

async function newRun(env, t, runs) {
  const C = SOLO_CASES[t.case_id];
  const used = runs.map((r) => r.culprit);
  let pool = C.CULPRITS.filter((k) => !used.includes(k));
  if (!pool.length) pool = C.CULPRITS.filter((k) => k !== used[used.length - 1]);
  const culprit = pool[randInt(pool.length)];
  const run = { id: crypto.randomUUID(), token: randomToken(), culprit, first: runs.length ? 0 : 1, now: Date.now() };
  await env.DB.prepare("INSERT INTO solo_runs (id, code, token, culprit, first_play, started_at) VALUES (?,?,?,?,?,?)")
    .bind(run.id, t.code, run.token, culprit, run.first, run.now).run();
  return run.token;
}

export async function soloStart(request, env) {
  await migrateSolo(env);
  await purge(env);
  let b = {}; try { b = await request.json(); } catch {}
  const t = await ticketOf(env, b.code);
  if (!t) return fail("Diesen Code gibt es nicht (oder er ist nicht mehr gültig).", 404);
  const runs = await runsOf(env, t.code);
  for (const r of runs) await closeIfOver(env, r);
  const active = runs.find((r) => !r.ended_at);
  if (active) return json({ token: active.token });
  if (runs.length && !b.replay) return fail("Diesen Fall hast du schon gespielt. Du kannst ihn nochmal spielen – mit einem anderen Täter.", 409);
  if (!t.name) {
    const name = cleanName(b.name);
    if (name.length < 2) return fail("Bitte gib deinen Ermittlernamen ein (mindestens 2 Zeichen).");
    await env.DB.prepare("UPDATE solo_tickets SET name=? WHERE code=?").bind(name, t.code).run();
  }
  return json({ token: await newRun(env, t, runs) });
}

async function withRun(request, env) {
  await migrateSolo(env);
  const tok = (request.headers.get("x-solo") || "").trim();
  if (!tok) return null;
  const run = await env.DB.prepare("SELECT * FROM solo_runs WHERE token=?").bind(tok).first();
  if (!run) return null;
  const t = await ticketOf(env, run.code);
  if (!t) return null;
  await closeIfOver(env, run);
  return { run, t, C: SOLO_CASES[t.case_id] };
}
const gone = () => fail("Dieser Spielstand ist nicht mehr gültig. Bitte gib deinen Code neu ein.", 401);

function stateOf({ run, t, C }) {
  const N = esc(t.name || "");
  const hints = JSON.parse(run.hints || "{}");
  const docs = C.docs(run.culprit, N).filter((d) => d.stage <= Math.min(run.stage, 3))
    .map((d) => ({ id: d.id, stage: d.stage, kind: d.kind, kk: d.kk || "", title: d.title, html: d.html }));
  const sol = C.solution(run.culprit);
  const questions = C.QUESTIONS.map((q, i) => ({
    key: q.key, nr: q.nr, type: q.type, label: q.label, hint: q.hint, options: q.options || null,
    status: i + 1 < run.stage ? "done" : i + 1 === run.stage && !run.ended_at ? "open" : i + 1 === run.stage ? "closed" : "locked",
    answer: i + 1 < run.stage ? (q.type === "select" ? (q.options.find((o) => o[0] === sol[q.key]) || [])[1] : sol[q.key]) : null,
    hints: (C.HINTS[q.key] || []).slice(0, hints[q.key] || 0),
    next_hint_cost: (hints[q.key] || 0) < 3 ? C.HINT_PENALTY[hints[q.key] || 0] : null,
  }));
  const out = {
    name: t.name || "", code: t.code, title: C.TITLE, test: !!t.test_mode, now: Date.now(), started_at: run.started_at,
    limit_min: C.LIMIT_MIN, train_start: C.TRAIN_START, penalty_min: run.penalty_min, wrong: run.wrong, stage: run.stage,
    first_play: !!run.first_play, rules: { wrong: C.WRONG_PENALTY, hints: C.HINT_PENALTY },
    questions, docs, solved: !!run.solved_at, ended: !!run.ended_at,
  };
  if (run.ended_at) {
    out.result = {
      score_ms: run.score_ms, pct: run.pct, pct_n: run.pct_n, played_ms: (run.solved_at || run.ended_at) - run.started_at,
      voucher: run.first_play && run.solved_at ? t.voucher : null, ...C.resolution(run.culprit),
    };
  }
  return out;
}

export async function soloState(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone();
  return json(stateOf(ctx));
}

export async function soloHint(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone();
  const { run, C } = ctx;
  if (run.ended_at) return fail("Der Fall ist abgeschlossen.", 409);
  const q = C.QUESTIONS[run.stage - 1];
  const hints = JSON.parse(run.hints || "{}");
  const lvl = hints[q.key] || 0;
  if (lvl >= 3) return fail("Für diese Frage gibt es keine weiteren Hinweise.", 409);
  hints[q.key] = lvl + 1;
  const pen = C.HINT_PENALTY[lvl];
  // nur übernehmen, wenn sich der Stand inzwischen nicht geändert hat (Doppelklick)
  const u = await env.DB.prepare("UPDATE solo_runs SET hints=?, penalty_min=penalty_min+? WHERE id=? AND hints=?")
    .bind(JSON.stringify(hints), pen, run.id, run.hints).run();
  if (!u.meta?.changes) return json(stateOf({ ...ctx, run: await env.DB.prepare("SELECT * FROM solo_runs WHERE id=?").bind(run.id).first() }));
  Object.assign(run, { hints: JSON.stringify(hints), penalty_min: run.penalty_min + pen });
  return json(stateOf(ctx));
}

export async function soloAnswer(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone();
  const { run, t, C } = ctx;
  if (run.ended_at) return fail("Der Fall ist abgeschlossen.", 409);
  let b = {}; try { b = await request.json(); } catch {}
  const now = Date.now();
  if (run.last_try && now - run.last_try < 2000) return fail("Moment – einen Versuch nach dem anderen.", 429);
  const q = C.QUESTIONS[run.stage - 1];
  if (b.key && b.key !== q.key) return json({ correct: false, stale: true, ...stateOf(ctx) });
  const sol = C.solution(run.culprit)[q.key];
  const given = q.type === "time" ? normTime(b.value) : String(b.value || "");
  if (!given) return fail(q.type === "time" ? "Bitte eine Uhrzeit eingeben." : "Bitte eine Antwort auswählen.");
  const ok = given === sol;
  if (!ok) {
    await env.DB.prepare("UPDATE solo_runs SET wrong=wrong+1, penalty_min=penalty_min+?, last_try=? WHERE id=?").bind(C.WRONG_PENALTY, now, run.id).run();
    Object.assign(run, { wrong: run.wrong + 1, penalty_min: run.penalty_min + C.WRONG_PENALTY, last_try: now });
    return json({ correct: false, penalty: C.WRONG_PENALTY, ...stateOf(ctx) });
  }
  const stage = run.stage + 1;
  if (stage <= C.QUESTIONS.length) {
    const u = await env.DB.prepare("UPDATE solo_runs SET stage=?, last_try=? WHERE id=? AND stage=?").bind(stage, now, run.id, run.stage).run();
    if (u.meta?.changes) Object.assign(run, { stage, last_try: now });
    return json({ correct: true, ...stateOf(ctx) });
  }
  // gelöst
  const score = now - run.started_at + run.penalty_min * 60000;
  const u = await env.DB.prepare("UPDATE solo_runs SET stage=?, solved_at=?, ended_at=?, score_ms=?, last_try=? WHERE id=? AND solved_at IS NULL")
    .bind(stage, now, now, score, now, run.id).run();
  if (!u.meta?.changes) return json({ correct: true, ...stateOf({ ...ctx, run: await env.DB.prepare("SELECT * FROM solo_runs WHERE id=?").bind(run.id).first() }) });
  Object.assign(run, { stage, solved_at: now, ended_at: now, score_ms: score });
  if (run.first_play) {
    // Prozentwert: Anteil der bisherigen Erst-Durchgänge, die langsamer waren
    const r = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN score_ms > ? THEN 1 ELSE 0 END) AS slower FROM solo_scores WHERE case_id=? AND test_mode=?")
      .bind(score, t.case_id, t.test_mode ? 1 : 0).first();
    const n = r?.n || 0;
    run.pct = n ? Math.round(((r.slower || 0) / n) * 100) : null;
    run.pct_n = n;
    const hintsUsed = Object.values(JSON.parse(run.hints || "{}")).reduce((a, x) => a + x, 0);
    let voucher = t.voucher;
    if (!voucher) voucher = "SOLO5-" + randomCode(6);
    await env.DB.batch([
      env.DB.prepare("UPDATE solo_runs SET pct=?, pct_n=? WHERE id=?").bind(run.pct, n, run.id),
      env.DB.prepare("INSERT INTO solo_scores (case_id, test_mode, score_ms, hints, wrong, recorded_at) VALUES (?,?,?,?,?,?)").bind(t.case_id, t.test_mode ? 1 : 0, score, hintsUsed, run.wrong, now),
      env.DB.prepare("UPDATE solo_tickets SET voucher=? WHERE code=? AND voucher IS NULL").bind(voucher, t.code),
    ]);
    t.voucher = voucher;
  }
  return json({ correct: true, ...stateOf(ctx) });
}

// Aufgeben: Durchgang beenden, Auflösung zeigen (zählt nicht für den Prozentwert)
export async function soloGiveUp(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone();
  if (!ctx.run.ended_at) {
    const now = Date.now();
    await env.DB.prepare("UPDATE solo_runs SET ended_at=? WHERE id=? AND ended_at IS NULL").bind(now, ctx.run.id).run();
    ctx.run.ended_at = now;
  }
  return json(stateOf(ctx));
}

// Test: Uhr vorspulen (nur Testtickets)
export async function soloForward(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone();
  if (!ctx.t.test_mode) return fail("Nur im Testmodus.", 403);
  if (ctx.run.ended_at) return json(stateOf(ctx));
  const s = ctx.run.started_at - 5 * 60000;
  await env.DB.prepare("UPDATE solo_runs SET started_at=? WHERE id=?").bind(s, ctx.run.id).run();
  ctx.run.started_at = s;
  return json(stateOf(ctx));
}

// Admin: Testtickets und Übersicht
export async function soloAdmin(route, request, env) {
  await migrateSolo(env);
  if (route === "admin/ticket" && request.method === "POST") {
    let b = {}; try { b = await request.json(); } catch {}
    const code = await createSoloTicket(env, { name: b.name || "", test: b.test !== false });
    return json({ code });
  }
  if (route === "admin/list" && request.method === "GET") {
    const { results } = await env.DB.prepare(`SELECT t.code, t.name, t.test_mode, t.created_at, t.voucher, t.order_id,
      (SELECT COUNT(*) FROM solo_runs r WHERE r.code=t.code) AS runs,
      (SELECT MIN(score_ms) FROM solo_runs r WHERE r.code=t.code AND r.first_play=1) AS score
      FROM solo_tickets t ORDER BY t.created_at DESC LIMIT 50`).all();
    const s = await env.DB.prepare("SELECT test_mode, COUNT(*) AS n, AVG(score_ms) AS avg, AVG(hints) AS hints, AVG(wrong) AS wrong FROM solo_scores GROUP BY test_mode").all();
    return json({ tickets: results, scores: s.results });
  }
  return fail("Nicht gefunden.", 404);
}
