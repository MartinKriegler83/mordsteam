// Mordsteam Solo – Spiellogik für Einzelfälle (ein Code = ein Ticket; jeder Durchgang = ein Run)
// Der erste Durchgang zählt für den Prozentwert („schneller als X %“), Wiederholungen bekommen einen anderen Täter.
import { json, fail, randInt, randomToken, randomCode, esc } from "./game.js";
import * as solo001 from "./cases/solo-001.js";
import * as solo002 from "./cases/solo-002.js";
import * as soloPlus001 from "./cases/solo-plus-001.js";
import * as solo001en from "./cases/solo-001-en.js";
import * as solo002en from "./cases/solo-002-en.js";
import * as soloPlus001en from "./cases/solo-plus-001-en.js";
import { logAI } from "./ops.js";
import { createSoloPromo } from "./stripe.js";
import { migrateFeedback } from "./feedback.js";

export const SOLO_CASES = { "solo-001": solo001, "solo-002": solo002, "solo-plus-001": soloPlus001 };
const SOLO_EN = { "solo-001": solo001en, "solo-002": solo002en, "solo-plus-001": soloPlus001en };
export const SOLO_LANGS = ["de", "en"];
// Fall in der Spielsprache des Tickets: englische Texte ersetzen die deutschen, Logik bleibt gleich
const mergedCases = {};
export function soloCase(id, lang) {
  const base = SOLO_CASES[id];
  if (lang !== "en" || !base || !SOLO_EN[id]) return base;
  return (mergedCases[id] ||= { ...base, ...SOLO_EN[id] });
}
const isEn = (x) => (x && typeof x === "object" ? (x.lang || "") : String(x || "")) === "en";
const T = (lang, de, en) => (isEn(lang) ? en : de);
// Keine Pause: gilt für alle Solo-Fälle, deshalb hier zentral an den Einsatz angehängt
const noPause = (b, lang) => ({ ...b, steps: [...(b.steps || []), isEn(lang)
  ? ["No pause", "Once you open the case file, the clock runs without stopping – even if you close the window or put your phone away. So take the time in one go before you start."]
  : ["Keine Pause", "Sobald du die Akte öffnest, läuft die Uhr ohne Unterbrechung – auch wenn du das Fenster schließt oder das Handy weglegst. Nimm dir die Zeit also am Stück, bevor du startest."]] });
const hLang = (request) => (request && request.headers && request.headers.get("x-lang") === "en" ? "en" : "de");
const MAX_MIN = 120;          // danach wird ein ungelöster Durchgang geschlossen
const MAX_RUNS = 4;           // erster Durchgang + 3 Wiederholungen (jeder Täter einmal)
const REPLAY_DAYS = 30;       // Wiederholungen nur innerhalb von 30 Tagen nach dem ersten Durchgang
function replayInfo(runs) {
  if (!runs.length) return { left: MAX_RUNS - 1, until: null };
  const first = Math.min(...runs.map((r) => r.started_at));
  const until = first + REPLAY_DAYS * 86400000;
  return { left: Date.now() > until ? 0 : Math.max(0, MAX_RUNS - runs.length), until };
}
const KEEP_DAYS = 30;         // Name und Durchgänge werden 30 Tage nach dem letzten Spielende gelöscht
const VALID_DAYS = 365;       // nie gespielte Tickets gelten 12 Monate

let ready = false;
export async function migrateSolo(env) {
  if (ready) return;
  const stmts = [
    "CREATE TABLE IF NOT EXISTS solo_tickets (code TEXT PRIMARY KEY, case_id TEXT NOT NULL, lang TEXT, name TEXT, order_id TEXT, test_mode INTEGER DEFAULT 0, created_at INTEGER NOT NULL, voucher TEXT, status TEXT DEFAULT 'active')",
    "CREATE TABLE IF NOT EXISTS solo_runs (id TEXT PRIMARY KEY, code TEXT NOT NULL, token TEXT NOT NULL, culprit TEXT NOT NULL, first_play INTEGER NOT NULL, started_at INTEGER NOT NULL, solved_at INTEGER, ended_at INTEGER, stage INTEGER NOT NULL DEFAULT 1, penalty_min INTEGER NOT NULL DEFAULT 0, wrong INTEGER NOT NULL DEFAULT 0, hints TEXT NOT NULL DEFAULT '{}', last_try INTEGER, score_ms INTEGER, pct INTEGER, pct_n INTEGER)",
    "CREATE INDEX IF NOT EXISTS solo_runs_code ON solo_runs(code)",
    "ALTER TABLE solo_tickets ADD COLUMN voucher_synced INTEGER DEFAULT 0",
    "CREATE INDEX IF NOT EXISTS solo_tickets_order ON solo_tickets(order_id)",
    "CREATE INDEX IF NOT EXISTS solo_runs_token ON solo_runs(token)",
    // anonyme Wertung (bleibt nach dem Löschen): nur Fall, Testkennzeichen, Zeit
    // begun: 0 = Durchgang angelegt, Spieler liest noch den Einsatz (Uhr steht); 1 = Uhr läuft
    "ALTER TABLE solo_runs ADD COLUMN begun INTEGER NOT NULL DEFAULT 1",
    // tvar: Zeitvariante des Falls (andere Tatzeit je Durchgang); alte Durchgänge ohne Wert = Variante 0
    "ALTER TABLE solo_runs ADD COLUMN tvar INTEGER",
    "CREATE TABLE IF NOT EXISTS solo_chat (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL, suspect TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, at INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS solo_chat_run ON solo_chat(run_id)",
    "ALTER TABLE solo_runs ADD COLUMN chat_last_at INTEGER",
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
    await env.DB.prepare(`DELETE FROM solo_chat WHERE run_id IN (SELECT id FROM solo_runs WHERE code IN (${old}))`).bind(now - KEEP_DAYS * day).run();
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
  throw new Error("Code konnte nicht erzeugt werden / could not create code.");
}

const cleanName = (s) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
const normCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
const normTime = (s) => {
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
  if (!run.ended_at && run.begun !== 0 && Date.now() > run.started_at + MAX_MIN * 60000) {
    run.ended_at = run.started_at + MAX_MIN * 60000;
    await env.DB.prepare("UPDATE solo_runs SET ended_at=? WHERE id=?").bind(run.ended_at, run.id).run();
  }
  return run;
}

// ---------- öffentliche Aufrufe ----------
export async function soloTicketInfo(env, url, request) {
  await migrateSolo(env);
  const t = await ticketOf(env, url.searchParams.get("code"));
  if (!t) return fail(T(hLang(request), "Diesen Code gibt es nicht (oder er ist nicht mehr gültig). Bitte prüfe die Schreibweise.", "This code doesn’t exist (or is no longer valid). Please check the spelling."), 404);
  const runs = await runsOf(env, t.code);
  for (const r of runs) await closeIfOver(env, r);
  const active = runs.find((r) => !r.ended_at);
  const C = soloCase(t.case_id, t.lang);
  return json({ found: true, code: t.code, name: t.name || "", lang: t.lang || "de", title: C.TITLE, limit_min: C.LIMIT_MIN,
    runs: runs.length, active: !!active, token: active ? active.token : runs.length ? runs[runs.length - 1].token : null, briefing: noPause(C.briefing(esc(t.name || "{NAME}")), t.lang) });
}

async function newRun(env, t, runs) {
  const C = soloCase(t.case_id, t.lang);
  // Wiederholung: nie der Täter des ersten Durchgangs und nie derselbe wie zuletzt – sonst Zufall.
  // So bleibt auch der dritte Durchgang offen (es gibt immer mindestens zwei Möglichkeiten).
  const first = runs.length ? runs[0].culprit : null, prev = runs.length ? runs[runs.length - 1].culprit : null;
  let pool = C.CULPRITS.filter((k) => k !== first && k !== prev);
  if (!pool.length) pool = C.CULPRITS.slice();
  const culprit = pool[randInt(pool.length)];
  // Tatzeit: bei jedem Durchgang eine noch nicht gespielte Zeitvariante (erster Durchgang: Zufall)
  const nT = C.VARIANTS || (C.TIME_SHIFTS || [0]).length, used = runs.map((r) => r.tvar || 0);
  let tpool = [...Array(nT).keys()].filter((i) => !used.includes(i));
  if (!tpool.length) tpool = [...Array(nT).keys()].filter((i) => i !== used[used.length - 1]);
  if (!tpool.length) tpool = [0];
  const tvar = tpool[randInt(tpool.length)];
  const run = { id: crypto.randomUUID(), token: randomToken(), culprit, first: runs.length ? 0 : 1, now: Date.now() };
  await env.DB.prepare("INSERT INTO solo_runs (id, code, token, culprit, first_play, started_at, begun, tvar) VALUES (?,?,?,?,?,?,0,?)")
    .bind(run.id, t.code, run.token, culprit, run.first, run.now, tvar).run();
  return run.token;
}

export async function soloStart(request, env) {
  await migrateSolo(env);
  await purge(env);
  let b = {}; try { b = await request.json(); } catch {}
  const t = await ticketOf(env, b.code);
  if (!t) return fail(T(hLang(request), "Diesen Code gibt es nicht (oder er ist nicht mehr gültig).", "This code doesn’t exist (or is no longer valid)."), 404);
  const runs = await runsOf(env, t.code);
  for (const r of runs) await closeIfOver(env, r);
  const active = runs.find((r) => !r.ended_at);
  if (active) return json({ token: active.token });
  if (runs.length && !b.replay) return fail(T(t, "Diesen Fall hast du schon gespielt. Du kannst ihn nochmal spielen – mit einem anderen Täter.", "You’ve already played this case. You can play it again – with a different culprit."), 409);
  if (runs.length) {
    const ri = replayInfo(runs);
    if (!ri.left) return fail(runs.length >= MAX_RUNS ? T(t, "Du hast alle Wiederholungen genutzt. Lust auf einen neuen Fall? Schau auf mordsteam.com vorbei.", "You’ve used all replays. Fancy a new case? Have a look at mordsteam.com.") : T(t, "Wiederholen ist nur innerhalb von 30 Tagen nach dem ersten Durchgang möglich.", "Replays are only possible within 30 days of your first game."), 409);
  }
  if (!t.name) {
    const name = cleanName(b.name);
    if (name.length < 2) return fail(T(t, "Bitte gib deinen Ermittlernamen ein (mindestens 2 Zeichen).", "Please enter your detective name (at least 2 characters)."));
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
  const runs = (await env.DB.prepare("SELECT started_at FROM solo_runs WHERE code=?").bind(run.code).all()).results;
  await migrateFeedback(env);
  const fbs = (await env.DB.prepare("SELECT order_id FROM feedback WHERE order_id IN (?, ?)").bind("solo:" + t.code, "solo:" + t.code + ":replay").all()).results.map((x) => x.order_id);
  return { run, t, lang: t.lang === "en" ? "en" : "de", C: soloCase(t.case_id, t.lang), replay: replayInfo(runs), feedback: { initial: fbs.includes("solo:" + t.code), replay: fbs.includes("solo:" + t.code + ":replay") } };
}
const gone = (request) => fail(T(hLang(request), "Dieser Spielstand ist nicht mehr gültig. Bitte gib deinen Code neu ein.", "This game session is no longer valid. Please enter your code again."), 401);

function stateOf({ run, t, C, replay, feedback }) {
  const N = esc(t.name || "");
  const hints = JSON.parse(run.hints || "{}");
  const begun = run.begun !== 0;
  // Solange der Einsatz gelesen wird (Uhr steht), gibt es noch keine Beweisstücke
  const tv = run.tvar || 0;
  const docs = !begun ? [] : C.docs(run.culprit, N, tv).filter((d) => d.stage <= Math.min(run.stage, C.QUESTIONS.length))
    .map((d) => ({ id: d.id, stage: d.stage, kind: d.kind, kk: d.kk || "", title: d.title, html: d.html }));
  const sol = C.solution(run.culprit, tv);
  const H = typeof C.HINTS === "function" ? C.HINTS(tv, run.culprit) : C.HINTS;
  const questions = C.QUESTIONS.map((q, i) => ({
    key: q.key, nr: q.nr, type: q.type, label: q.label, hint: q.hint, options: q.options || null, options2: q.options2 || null, sub: q.sub || null,
    status: i + 1 < run.stage ? "done" : i + 1 === run.stage && !run.ended_at ? "open" : i + 1 === run.stage ? "closed" : "locked",
    answer: i + 1 < run.stage ? (q.type === "select" ? (q.options.find((o) => o[0] === sol[q.key]) || [])[1]
      : q.type === "select2" ? sol[q.key].split("|").map((x, j) => ((j ? q.options2 : q.options).find((o) => o[0] === x) || [])[1]).join(" – ") : sol[q.key]) : null,
    hints: (H[q.key] || []).slice(0, hints[q.key] || 0),
    next_hint_cost: (hints[q.key] || 0) < 3 ? C.HINT_PENALTY[hints[q.key] || 0] : null,
  }));
  const out = {
    name: t.name || "", code: t.code, lang: t.lang === "en" ? "en" : "de", title: C.TITLE, test: !!t.test_mode, now: Date.now(), started_at: run.started_at, begun, briefing: noPause(C.briefing(N), t.lang),
    limit_min: C.LIMIT_MIN, train_start: C.TRAIN_START, case_id: t.case_id, ui: C.UI || null, penalty_min: run.penalty_min, wrong: run.wrong, stage: run.stage,
    first_play: !!run.first_play, rules: { wrong: C.WRONG_PENALTY, hints: C.HINT_PENALTY }, replay: replay || null, feedback: feedback || { initial: false, replay: false },
    questions, docs, solved: !!run.solved_at, ended: !!run.ended_at,
    verhoer: C.PLUS ? { open: run.stage >= C.VERHOER_FROM_STAGE || !!run.ended_at, max: C.VERHOER_MAX, from_question: C.VERHOER_FROM_STAGE - 1 } : null,
  };
  if (run.ended_at) {
    out.result = {
      score_ms: run.score_ms, pct: run.pct, pct_n: run.pct_n, played_ms: (run.solved_at || run.ended_at) - run.started_at,
      voucher: run.first_play ? t.voucher : null, ...C.resolution(run.culprit, tv), zeit: sol.zeit,
    };
  }
  return out;
}

export async function soloState(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  await ensureVoucher(env, ctx.t, ctx.run);
  return json(stateOf(ctx));
}

// Uhr starten: beim ersten Wechsel vom Einsatz zur Akte oder zu den Fragen
async function begin(env, run) {
  if (run.begun !== 0) return;
  const now = Date.now();
  await env.DB.prepare("UPDATE solo_runs SET started_at=?, begun=1 WHERE id=? AND begun=0").bind(now, run.id).run();
  const r = await env.DB.prepare("SELECT started_at FROM solo_runs WHERE id=?").bind(run.id).first();
  Object.assign(run, { begun: 1, started_at: r ? r.started_at : now });
}
export async function soloBegin(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  if (!ctx.run.ended_at) await begin(env, ctx.run);
  return json(stateOf(ctx));
}

export async function soloHint(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  if (!ctx.run.ended_at) await begin(env, ctx.run);
  const { run, C } = ctx;
  if (run.ended_at) return fail(T(ctx, "Der Fall ist abgeschlossen.", "The case is closed."), 409);
  const q = C.QUESTIONS[run.stage - 1];
  const hints = JSON.parse(run.hints || "{}");
  const lvl = hints[q.key] || 0;
  if (lvl >= 3) return fail(T(ctx, "Für diese Frage gibt es keine weiteren Hinweise.", "There are no more hints for this question."), 409);
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
  if (!ctx) return gone(request);
  const { run, t, C } = ctx;
  if (run.ended_at) return fail(T(ctx, "Der Fall ist abgeschlossen.", "The case is closed."), 409);
  await begin(env, run);
  let b = {}; try { b = await request.json(); } catch {}
  const now = Date.now();
  if (run.last_try && now - run.last_try < 2000) return fail(T(ctx, "Moment – einen Versuch nach dem anderen.", "Hold on – one attempt at a time."), 429);
  const q = C.QUESTIONS[run.stage - 1];
  if (b.key && b.key !== q.key) return json({ correct: false, stale: true, ...stateOf(ctx) });
  const sol = C.solution(run.culprit, run.tvar || 0)[q.key];
  const given = q.type === "time" ? normTime(b.value) : q.type === "code" ? String(b.value || "").replace(/[^0-9]/g, "") : String(b.value || "");
  if (!given) return fail(q.type === "time" ? T(ctx, "Bitte eine Uhrzeit eingeben.", "Please enter a time.") : q.type === "code" ? T(ctx, "Bitte den Code eingeben.", "Please enter the code.") : T(ctx, "Bitte eine Antwort auswählen.", "Please choose an answer."));
  if (q.type === "select2") {
    const [a, b2] = given.split("|");
    if (!q.options.some((o) => o[0] === a) || !q.options2.some((o) => o[0] === b2)) return fail(T(ctx, "Bitte bei beiden Feldern eine Antwort wählen.", "Please choose an answer in both fields."));
  }
  if (q.type === "select" && !q.options.some((o) => o[0] === given)) return fail(T(ctx, "Bitte eine Antwort aus der Liste wählen.", "Please choose an answer from the list."));
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
    await env.DB.batch([
      env.DB.prepare("UPDATE solo_runs SET pct=?, pct_n=? WHERE id=?").bind(run.pct, n, run.id),
      env.DB.prepare("INSERT INTO solo_scores (case_id, test_mode, score_ms, hints, wrong, recorded_at) VALUES (?,?,?,?,?,?)").bind(t.case_id, t.test_mode ? 1 : 0, score, hintsUsed, run.wrong, now),
    ]);
    await ensureVoucher(env, t, run);
  }
  return json({ correct: true, ...stateOf(ctx) });
}

// 5-€-Gutschein: jeder Solo-Fall bekommt einen, sobald der erste Durchgang endet (gelöst, aufgegeben oder abgelaufen).
// Einlösbar bei Friends und Teams (dort ist das Aktionscode-Feld im Bezahlschritt), einmal, nicht zusammen mit Early Bird.
// Ausnahme (alt): Käufe über Paddle – dort ließen sich keine Gutscheine einlösen. Managed Payments (UK-Privat seit 7.10.2026) bekommt den Gutschein.
async function ensureVoucher(env, t, run) {
  if (!run.first_play || !run.ended_at) return;
  if (!t.voucher && t.order_id) {
    const o = await env.DB.prepare("SELECT paddle_txn FROM orders WHERE id=?").bind(t.order_id).first().catch(() => null);
    if (o && o.paddle_txn) return;
  }
  if (!t.voucher) {
    const v = "SOLO5-" + randomCode(6);
    await env.DB.prepare("UPDATE solo_tickets SET voucher=? WHERE code=? AND voucher IS NULL").bind(v, t.code).run();
    const r = await env.DB.prepare("SELECT voucher FROM solo_tickets WHERE code=?").bind(t.code).first();
    t.voucher = (r && r.voucher) || v;
  }
  await syncVoucher(env, t);
}

// Gutschein in Stripe als einmal einlösbaren Aktionscode anlegen (bei Testcodes nur mit Stripe-Testschlüssel)
async function syncVoucher(env, t) {
  if (!t.voucher || t.voucher_synced || !env.STRIPE_SECRET_KEY) return;
  if (t.test_mode && !String(env.STRIPE_SECRET_KEY).startsWith("sk_test")) return;
  if (await createSoloPromo(env, t.voucher)) {
    await env.DB.prepare("UPDATE solo_tickets SET voucher_synced=1 WHERE code=?").bind(t.code).run();
    t.voucher_synced = 1;
  }
}

// Aufgeben: Durchgang beenden, Auflösung zeigen (zählt nicht für den Prozentwert)
export async function soloGiveUp(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  if (!ctx.run.ended_at) {
    await begin(env, ctx.run);
    const now = Date.now();
    await env.DB.prepare("UPDATE solo_runs SET ended_at=? WHERE id=? AND ended_at IS NULL").bind(now, ctx.run.id).run();
    ctx.run.ended_at = now;
  }
  await ensureVoucher(env, ctx.t, ctx.run);
  return json(stateOf(ctx));
}

// Feedback direkt im Spiel, gezielt je Durchgang:
//  - „initial“: nach dem ersten Durchgang – Gesamteindruck, Schwierigkeit, Verbesserung (privat) und ein Satz für die Website
//  - „replay“: einmal nach einer Wiederholung – wie leicht war es mit dem Wissen aus dem ersten Spiel, lohnt es sich
// Veröffentlicht wird nur der Satz, nur mit Zustimmung (anonym, Vorname oder Vorname + Initial) und erst nach Freigabe im Admin.
export async function soloFeedback(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  if (!ctx.run.ended_at) return fail(T(ctx, "Feedback gibt es nach dem Spiel.", "Feedback is available after the game."), 409);
  let b = {}; try { b = await request.json(); } catch {}
  const kind = b.kind === "replay" ? "replay" : "initial";
  if (ctx.feedback[kind]) return json({ ok: true, already: true });
  const clip = (x, n) => String(x ?? "").trim().slice(0, n);
  const orderId = "solo:" + ctx.t.code + (kind === "replay" ? ":replay" : "");
  const base = { spieler: ctx.t.name || "", test: ctx.t.test_mode ? "ja" : "nein" };
  if (kind === "replay") {
    const answers = { ...base, wiederholung_leicht: clip(b.leicht, 40), wiederholung_lohnt: clip(b.lohnt, 40), wiederholung_notiz: clip(b.notiz, 1000) };
    await env.DB.prepare("INSERT OR IGNORE INTO feedback (id, order_id, created_at, variant, lang, paket, rating, nps, answers, review, publish, publish_name, approved) VALUES (?,?,?,?,?,?,NULL,NULL,?,'','no',NULL,0)")
      .bind(crypto.randomUUID(), orderId, Date.now(), "solo-replay", ctx.t.lang || "de", "solo", JSON.stringify(answers)).run();
    return json({ ok: true });
  }
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) return fail(T(ctx, "Bitte eine Sternebewertung wählen.", "Please choose a star rating."));
  // Name für die Website: nur Vorname, auf Wunsch mit Initial des Nachnamens
  const parts = String(ctx.t.name || "").trim().split(/\s+/).filter(Boolean);
  const vor = (parts[0] || "").slice(0, 30), ini = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() + "." : "";
  const publish = ["no", "anon", "vorname", "initial"].includes(b.publish) ? b.publish : "no";
  const pubName = publish === "vorname" ? vor : publish === "initial" ? `${vor} ${ini}`.trim() : null;
  const firstRun = ctx.run.first_play ? ctx.run : await env.DB.prepare("SELECT solved_at FROM solo_runs WHERE code=? AND first_play=1").bind(ctx.t.code).first();
  const answers = { ...base, geloest: firstRun && firstRun.solved_at ? "ja" : "nein", difficulty: clip(b.difficulty, 40), improve: clip(b.improve, 1500) };
  await env.DB.prepare("INSERT OR IGNORE INTO feedback (id, order_id, created_at, variant, lang, paket, rating, nps, answers, review, publish, publish_name, approved) VALUES (?,?,?,?,?,?,?,NULL,?,?,?,?,0)")
    .bind(crypto.randomUUID(), orderId, Date.now(), "solo", ctx.t.lang || "de", "solo", rating, JSON.stringify(answers),
      clip(b.review, 600), publish === "no" ? "no" : publish === "anon" ? "anon" : "name", pubName).run();
  return json({ ok: true });
}

// Test: Uhr vorspulen (nur Testtickets)
export async function soloForward(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  if (!ctx.t.test_mode) return fail(T(ctx, "Nur im Testmodus.", "Test mode only."), 403);
  if (ctx.run.ended_at) return json(stateOf(ctx));
  await begin(env, ctx.run);
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
    const code = await createSoloTicket(env, { caseId: SOLO_CASES[b.case] ? b.case : "solo-001", lang: b.lang === "en" ? "en" : "de", name: b.name || "", test: b.test !== false });
    return json({ code });
  }
  if (route === "admin/list" && request.method === "GET") {
    const { results } = await env.DB.prepare(`SELECT t.code, t.case_id, t.lang, t.name, t.test_mode, t.created_at, t.voucher, t.voucher_synced, t.order_id, t.status,
      (SELECT COUNT(*) FROM solo_runs r WHERE r.code=t.code) AS runs,
      (SELECT MIN(score_ms) FROM solo_runs r WHERE r.code=t.code AND r.first_play=1) AS score
      FROM solo_tickets t ORDER BY t.created_at DESC LIMIT 50`).all();
    const s = await env.DB.prepare("SELECT case_id, test_mode, COUNT(*) AS n, AVG(score_ms) AS avg, AVG(hints) AS hints, AVG(wrong) AS wrong FROM solo_scores GROUP BY case_id, test_mode").all();
    return json({ tickets: results, scores: s.results });
  }
  return fail("Nicht gefunden.", 404);
}

// ---------- Solo Plus: Verhörraum mit KI-Figuren ----------
// Der Spielername geht nie an die KI – die Figuren kennen nur die erfundene Welt des Falls.
const CHAT_MAX_CHARS = 300, CHAT_GAP_MS = 2500, CHAT_HISTORY = 8;
async function soloChatRows(env, runId) {
  // „user-x“ = Frage, auf die nur die Ersatzantwort kam (KI nicht erreichbar) – zählt nicht (Go-live-Test 4, M8)
  return (await env.DB.prepare("SELECT suspect, role, text, at FROM solo_chat WHERE run_id=? ORDER BY id LIMIT 300").bind(runId).all()).results
    .map((r) => (r.role === "user-x" ? { ...r, role: "user", nc: true } : r));
}
function soloChatView(ctx, rows) {
  const { run, C } = ctx;
  const open = run.stage >= C.VERHOER_FROM_STAGE || !!run.ended_at;
  return { open, used: rows.filter((r) => r.role === "user" && !r.nc).length, max: C.VERHOER_MAX, max_chars: CHAT_MAX_CHARS, ended: !!run.ended_at,
    suspects: C.VERHOER_SUSPECTS.map((x) => ({ key: x.key, name: x.name })),
    threads: open ? Object.fromEntries(C.VERHOER_SUSPECTS.map((x) => [x.key, rows.filter((r) => r.suspect === x.key).map((r) => ({ role: r.role, text: esc(r.text), ...(r.nc ? { nc: true } : {}) }))])) : {} };
}
export async function soloVerhoerGet(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  if (!ctx.C.PLUS) return fail(T(ctx, "Den Verhörraum gibt es nur bei Solo Plus.", "The interrogation room is only part of Solo Plus."), 404);
  return json(soloChatView(ctx, await soloChatRows(env, ctx.run.id)));
}
export async function soloVerhoerAsk(request, env) {
  const ctx = await withRun(request, env);
  if (!ctx) return gone(request);
  const { run, C } = ctx;
  if (!C.PLUS) return fail(T(ctx, "Den Verhörraum gibt es nur bei Solo Plus.", "The interrogation room is only part of Solo Plus."), 404);
  if (run.ended_at) return fail(T(ctx, "Der Fall ist abgeschlossen.", "The case is closed."), 409);
  if (run.stage < C.VERHOER_FROM_STAGE) return fail(T(ctx, `Der Verhörraum öffnet, sobald du Frage ${C.VERHOER_FROM_STAGE - 1} gelöst hast.`, `The interrogation room opens once you’ve solved question ${C.VERHOER_FROM_STAGE - 1}.`), 403);
  let b = {}; try { b = await request.json(); } catch {}
  const k = String(b.suspect || "");
  if (!C.VERHOER_SUSPECTS.some((x) => x.key === k)) return fail(T(ctx, "Bitte wähle, wen du verhören willst.", "Please choose who you want to question."));
  const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_CHARS);
  if (!text) return fail(T(ctx, "Bitte eine Frage eingeben.", "Please enter a question."));
  const rows = await soloChatRows(env, run.id);
  if (rows.filter((r) => r.role === "user" && !r.nc).length >= C.VERHOER_MAX) return fail(T(ctx, `Du hast alle ${C.VERHOER_MAX} Fragen gestellt. Die Hinweise zur Frage helfen dir weiter.`, `You’ve asked all ${C.VERHOER_MAX} questions. The hints for this question will help you on.`), 429);
  const now = Date.now();
  const gate = await env.DB.prepare("UPDATE solo_runs SET chat_last_at=? WHERE id=? AND (chat_last_at IS NULL OR chat_last_at < ?)").bind(now, run.id, now - CHAT_GAP_MS).run();
  if (!gate.meta?.changes) return fail(T(ctx, "Einen Moment – die Antwort kommt noch.", "One moment – the answer is on its way."), 429);
  const ins = await env.DB.prepare("INSERT INTO solo_chat (run_id, suspect, role, text, at) VALUES (?,?,?,?,?)").bind(run.id, k, "user", text, now).run();
  const tv = run.tvar || 0;
  let reply, logged = false;
  try {
    if (!env.ANTHROPIC_API_KEY) throw new Error("kein Schlüssel");
    const hist = [...rows.filter((r) => r.suspect === k), { role: "user", text }].slice(-CHAT_HISTORY);
    const messages = [];
    for (const m of hist) { const last = messages.at(-1); if (last && last.role === m.role) last.content += "\n" + m.text; else messages.push({ role: m.role, content: m.text }); }
    while (messages.length && messages[0].role !== "user") messages.shift();
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: env.ARIA_MODEL || "claude-haiku-4-5-20251001", max_tokens: 220, temperature: 0.7,
        system: [{ type: "text", text: C.verhoerSystem(run.culprit, tv, k), cache_control: { type: "ephemeral" } }], messages }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    logged = true;
    await logAI(env, d.usage, r.ok);
    if (!r.ok) throw new Error(d.error?.message || String(r.status));
    reply = (d.content || []).filter((x) => x.type === "text").map((x) => x.text).join("").trim().slice(0, 800);
    if (!reply) throw new Error("leer");
  } catch (e) {
    if (!logged && env.ANTHROPIC_API_KEY) await logAI(env, null, false);
    reply = C.verhoerFallback(run.culprit, tv, k);
    if (ins.meta?.last_row_id) await env.DB.prepare("UPDATE solo_chat SET role='user-x' WHERE id=?").bind(ins.meta.last_row_id).run();   // nicht zählen
  }
  await env.DB.prepare("INSERT INTO solo_chat (run_id, suspect, role, text, at) VALUES (?,?,?,?,?)").bind(run.id, k, "assistant", reply, Date.now()).run();
  return json(soloChatView(ctx, await soloChatRows(env, run.id)));
}
