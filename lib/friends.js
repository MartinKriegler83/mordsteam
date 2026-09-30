// Mordsteam Friends – Krimiabend für 4–8 Freunde. Eine Gruppe = ein Fall (Besetzung, Täter, Zeitvariante für alle gleich),
// jeder Spieler hat einen eigenen Durchgang (Uhr, Stufen, Hinweise, Strafminuten) – wie Solo, nur mehrfach.
// Spielarten: "live" (Organisator startet für alle, eine gemeinsame Uhr) und "week" (jeder startet selbst innerhalb von 3/5/7 Tagen).
// Spoilerschutz: Lösung, Täter und Rangliste gibt es erst bei der gemeinsamen Auflösung.
import { json, fail, randInt, randomToken, randomCode, esc } from "./game.js";
import * as friends001 from "./cases/friends-001.js";
import { migrateFeedback } from "./feedback.js";

export const FRIENDS_CASES = { "friends-001": friends001 };
const MAX_MIN = 90;          // danach wird ein ungelöster Durchgang geschlossen
const LIVE_WINDOW_MIN = 60;  // gleichzeitig: Auflösung spätestens 60 Min. nach dem Start
const KEEP_DAYS = 30;        // Namen und Spielstände werden 30 Tage nach der Auflösung gelöscht
const DAY = 86400000;
// Preise Krimiabend: 29 € bis 4 Personen, je weitere Person +5 €, höchstens 8
export const FRIENDS_PRICE = { base: 2900, extra: 500, included: 4, min: 4, max: 8 };
export const friendsPrice = (n) => FRIENDS_PRICE.base + Math.max(0, n - FRIENDS_PRICE.included) * FRIENDS_PRICE.extra;

let ready = false;
export async function migrateFriends(env) {
  if (ready) return;
  const stmts = [
    "CREATE TABLE IF NOT EXISTS friends_groups (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, lang TEXT, mode TEXT NOT NULL, window_days INTEGER, invite TEXT NOT NULL, org_token TEXT NOT NULL, data TEXT NOT NULL, order_id TEXT, test_mode INTEGER DEFAULT 0, created_at INTEGER NOT NULL, started_at INTEGER, deadline INTEGER, revealed_at INTEGER, status TEXT NOT NULL DEFAULT 'ready')",
    "CREATE UNIQUE INDEX IF NOT EXISTS friends_groups_invite ON friends_groups(invite)",
    "CREATE UNIQUE INDEX IF NOT EXISTS friends_groups_org ON friends_groups(org_token)",
    "CREATE TABLE IF NOT EXISTS friends_players (id TEXT PRIMARY KEY, group_id TEXT NOT NULL, idx INTEGER NOT NULL, token TEXT NOT NULL, claimed_at INTEGER NOT NULL, started_at INTEGER, stage INTEGER NOT NULL DEFAULT 1, penalty_min INTEGER NOT NULL DEFAULT 0, wrong INTEGER NOT NULL DEFAULT 0, hints TEXT NOT NULL DEFAULT '{}', last_try INTEGER, solved_at INTEGER, ended_at INTEGER, score_ms INTEGER)",
    "CREATE UNIQUE INDEX IF NOT EXISTS friends_players_slot ON friends_players(group_id, idx)",
    "CREATE INDEX IF NOT EXISTS friends_players_token ON friends_players(token)",
  ];
  for (const s of stmts) { try { await env.DB.prepare(s).run(); } catch {} }
  ready = true;
}

async function purge(env) {
  try {
    const old = Date.now() - KEEP_DAYS * DAY;
    await env.DB.prepare("DELETE FROM friends_players WHERE group_id IN (SELECT id FROM friends_groups WHERE revealed_at IS NOT NULL AND revealed_at < ?)").bind(old).run();
    await env.DB.prepare("DELETE FROM friends_groups WHERE revealed_at IS NOT NULL AND revealed_at < ?").bind(old).run();
    // nie aufgelöste Runden: 13 Monate nach dem Anlegen samt Namen löschen
    const never = Date.now() - (365 + KEEP_DAYS) * DAY;
    await env.DB.prepare("DELETE FROM friends_players WHERE group_id IN (SELECT id FROM friends_groups WHERE revealed_at IS NULL AND created_at < ?)").bind(never).run();
    await env.DB.prepare("DELETE FROM friends_groups WHERE revealed_at IS NULL AND created_at < ?").bind(never).run();
  } catch {}
}

const cleanName = (s) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
const normTime = (s) => {
  const d = String(s || "").replace(/[^0-9]/g, "");
  if (d.length === 3) return `0${d[0]}:${d.slice(1)}`;
  if (d.length === 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
  return d;
};

// Gruppe anlegen (Shop nach dem Bezahlen oder Admin-Test)
// players: [{ name, quirk }] · mode: "live" | "week" · days: 3/5/7 (nur week)
export async function createFriendsGroup(env, { caseId = "friends-001", lang = "de", players = [], mode = "live", days = 7, orderId = null, test = false } = {}) {
  await migrateFriends(env);
  const C = FRIENDS_CASES[caseId];
  const list = players.map((p) => ({ name: cleanName(p.name), quirk: C.QUIRKS[p.quirk] ? p.quirk : "snacks" })).filter((p) => p.name.length >= 1);
  if (list.length < C.MIN_PLAYERS || list.length > C.MAX_PLAYERS) throw new Error(`Bitte ${C.MIN_PLAYERS} bis ${C.MAX_PLAYERS} Personen eingeben.`);
  const seen = new Set();
  for (const p of list) { const k = p.name.toLowerCase(); if (seen.has(k)) throw new Error(`Der Name „${p.name}“ kommt doppelt vor. Bitte unterscheidbar machen, z. B. mit Initial.`); seen.add(k); }
  const S = C.setup(list.length, randInt);
  const data = { players: list.map((p, i) => ({ ...p, act: S.acts[i], room: S.rooms[i] })), culprit: S.culprit, tvar: S.tvar, beer: S.beer };
  const m = mode === "week" ? "week" : "live";
  for (let i = 0; i < 8; i++) {
    const id = "F" + randomCode(7);
    try {
      await env.DB.prepare("INSERT INTO friends_groups (id, case_id, lang, mode, window_days, invite, org_token, data, order_id, test_mode, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, caseId, lang, m, m === "week" ? ([3, 5, 7].includes(Number(days)) ? Number(days) : 7) : null, randomToken(12), randomToken(16), JSON.stringify(data), orderId, test ? 1 : 0, Date.now()).run();
      return await env.DB.prepare("SELECT * FROM friends_groups WHERE id=?").bind(id).first();
    } catch {}
  }
  throw new Error("Gruppe konnte nicht angelegt werden.");
}

// ---------- Gruppe laden, Status nachziehen ----------
const G_of = (g) => { const d = JSON.parse(g.data); return { ...d, players: d.players.map((p) => ({ ...p, name: esc(p.name) })) }; };
async function playersOf(env, gid) {
  return (await env.DB.prepare("SELECT * FROM friends_players WHERE group_id=? ORDER BY idx").bind(gid).all()).results;
}
function runLimit(g, p) { return p.started_at ? p.started_at + MAX_MIN * 60000 : null; }
async function closeRuns(env, g, ps) {
  const now = Date.now();
  for (const p of ps) {
    if (p.ended_at) continue;
    const lim = runLimit(g, p);
    const hard = g.status === "revealed" ? now : null;
    const end = hard || (lim && now > lim ? lim : null);
    if (end) { p.ended_at = end; await env.DB.prepare("UPDATE friends_players SET ended_at=? WHERE id=? AND ended_at IS NULL").bind(end, p.id).run(); }
  }
}
// Auflösung, sobald alle fertig sind oder die Zeit um ist
async function refreshGroup(env, g) {
  const ps = await playersOf(env, g.id);
  await closeRuns(env, g, ps);
  if (g.status === "running") {
    const n = JSON.parse(g.data).players.length;
    const allDone = ps.length === n && ps.every((p) => p.ended_at);
    const timeUp = g.deadline && Date.now() > g.deadline;
    if (allDone || timeUp) await reveal(env, g, ps);
  }
  return ps;
}
async function reveal(env, g, ps) {
  const now = Date.now();
  await env.DB.prepare("UPDATE friends_groups SET status='revealed', revealed_at=? WHERE id=? AND status<>'revealed'").bind(now, g.id).run();
  g.status = "revealed"; g.revealed_at = now;
  await closeRuns(env, g, ps);
}

async function byToken(env, tok) {
  if (!tok) return null;
  const p = await env.DB.prepare("SELECT * FROM friends_players WHERE token=?").bind(tok).first();
  if (!p) return null;
  const g = await env.DB.prepare("SELECT * FROM friends_groups WHERE id=?").bind(p.group_id).first();
  if (!g) return null;
  const ps = await refreshGroup(env, g);
  return { g, p: ps.find((x) => x.id === p.id) || p, ps, C: FRIENDS_CASES[g.case_id], G: G_of(g) };
}
const gone = () => fail("Dieser Spielstand ist nicht mehr gültig. Bitte öffne den Einladungslink erneut.", 401);

// ---------- Ergebnis & Rangliste (erst nach der Auflösung) ----------
function ranking(g, ps, G, C) {
  const rows = G.players.map((pl, i) => {
    const r = ps.find((x) => x.idx === i);
    const hintsUsed = r ? Object.values(JSON.parse(r.hints || "{}")).reduce((a, x) => a + x, 0) : 0;
    return { idx: i, name: pl.name, solved: !!(r && r.solved_at), score_ms: r && r.solved_at ? r.score_ms : null, played: !!(r && r.started_at), penalty: r ? r.penalty_min : 0, hints: hintsUsed, wrong: r ? r.wrong : 0,
      culprit: i === G.culprit, award: C.awardOf(pl), clip: null };
  });
  rows.sort((a, b) => (a.solved === b.solved ? (a.solved ? a.score_ms - b.score_ms : b.played - a.played) : a.solved ? -1 : 1));
  let place = 0; rows.forEach((r) => { r.place = r.solved ? ++place : null; });
  return rows;
}

function groupInfo(g, ps, G) {
  return {
    mode: g.mode, days: g.window_days, status: g.status, started_at: g.started_at, deadline: g.deadline, revealed_at: g.revealed_at, test: !!g.test_mode,
    players: G.players.map((pl, i) => { const r = ps.find((x) => x.idx === i); return { idx: i, name: pl.name, joined: !!r, playing: !!(r && r.started_at && !r.ended_at), done: !!(r && r.ended_at) }; }),
  };
}

const ctx_feedback = new Map();   // Spieler-ID → Feedback schon abgegeben (pro Anfrage befüllt)
function stateOf({ g, p, ps, C, G }) {
  const begun = !!p.started_at;
  const hints = JSON.parse(p.hints || "{}");
  const Q = C.questions(G), sol = C.solution(G), H = C.hints(G);
  const docs = !begun ? [] : C.docs(G, p.idx).filter((d) => d.stage <= Math.min(p.stage, 3)).map((d) => ({ id: d.id, stage: d.stage, kind: d.kind, kk: d.kk || "", title: d.title, html: d.html }));
  const questions = Q.map((q, i) => ({
    key: q.key, nr: q.nr, type: q.type, label: q.label, hint: q.hint, options: q.options || null,
    status: i + 1 < p.stage ? "done" : i + 1 === p.stage && !p.ended_at ? "open" : i + 1 === p.stage ? "closed" : "locked",
    answer: i + 1 < p.stage ? (q.type === "select" ? (q.options.find((o) => o[0] === sol[q.key]) || [])[1] : sol[q.key]) : null,
    hints: (H[q.key] || []).slice(0, hints[q.key] || 0),
    next_hint_cost: (hints[q.key] || 0) < 3 ? C.HINT_PENALTY[hints[q.key] || 0] : null,
  }));
  const out = {
    name: G.players[p.idx].name, me: p.idx, title: C.TITLE, now: Date.now(), started_at: p.started_at, begun,
    group: groupInfo(g, ps, G), can_begin: !begun && !p.ended_at && canBegin(g),
    limit_min: C.LIMIT_MIN, clock_start: C.CLOCK_START, clock_label: C.CLOCK_LABEL, late_label: C.LATE_LABEL,
    penalty_min: p.penalty_min, wrong: p.wrong, stage: p.stage, rules: { wrong: C.WRONG_PENALTY, hints: C.HINT_PENALTY },
    briefing: C.briefing(G.players[p.idx].name), questions, docs, solved: !!p.solved_at, ended: !!p.ended_at,
    own: p.ended_at ? { solved: !!p.solved_at, score_ms: p.score_ms, played_ms: (p.solved_at || p.ended_at) - (p.started_at || p.ended_at), penalty: p.penalty_min } : null,
  };
  // Spoilerschutz: Täter, Auflösung und Rangliste erst, wenn die Gruppe aufgelöst ist
  if (g.status === "revealed") out.reveal = { ...C.resolution(G), ranking: ranking(g, ps, G, C) };
  out.feedback_done = !!ctx_feedback.get(p.id);
  return out;
}
function canBegin(g) {
  if (g.status === "revealed") return false;
  if (g.mode === "live") return g.status === "running";
  return g.status === "running" && (!g.deadline || Date.now() < g.deadline);
}

// ---------- öffentliche Aufrufe: Einladung ----------
export async function friendsInvite(env, url) {
  await migrateFriends(env);
  await purge(env);
  const g = await env.DB.prepare("SELECT * FROM friends_groups WHERE invite=?").bind(String(url.searchParams.get("e") || "")).first();
  if (!g || g.status === "withdrawn") return fail("Diesen Einladungslink gibt es nicht (mehr). Bitte frag deinen Organisator nach dem aktuellen Link.", 404);
  const ps = await refreshGroup(env, g);
  const G = G_of(g), C = FRIENDS_CASES[g.case_id];
  return json({ title: C.TITLE, ...groupInfo(g, ps, G), limit_min: C.LIMIT_MIN });
}
// Name wählen → eigener Spielstand. Unter Freunden bewusst ohne Passwort: Wer den Namen erneut wählt, macht auf dem neuen Gerät weiter.
export async function friendsClaim(request, env) {
  await migrateFriends(env);
  let b = {}; try { b = await request.json(); } catch {}
  const g = await env.DB.prepare("SELECT * FROM friends_groups WHERE invite=?").bind(String(b.e || "")).first();
  if (!g) return fail("Diesen Einladungslink gibt es nicht (mehr).", 404);
  const n = JSON.parse(g.data).players.length, idx = Number(b.idx);
  if (!(idx >= 0 && idx < n)) return fail("Bitte wähle deinen Namen.");
  const have = await env.DB.prepare("SELECT token FROM friends_players WHERE group_id=? AND idx=?").bind(g.id, idx).first();
  if (have) return json({ token: have.token, again: true });
  const token = randomToken();
  try { await env.DB.prepare("INSERT INTO friends_players (id, group_id, idx, token, claimed_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), g.id, idx, token, Date.now()).run(); }
  catch { const x = await env.DB.prepare("SELECT token FROM friends_players WHERE group_id=? AND idx=?").bind(g.id, idx).first(); if (x) return json({ token: x.token, again: true }); throw new Error("claim"); }
  return json({ token });
}

// ---------- öffentliche Aufrufe: Spieler ----------
const tokOf = (request) => (request.headers.get("x-friends") || "").trim();
async function loadFeedbackFlag(env, ctx) {
  if (ctx.g.status !== "revealed") return;
  await migrateFeedback(env);
  const f = await env.DB.prepare("SELECT 1 AS x FROM feedback WHERE order_id=?").bind(`friends:${ctx.g.id}:${ctx.p.idx}`).first();
  ctx_feedback.set(ctx.p.id, !!f);
}
export async function friendsState(request, env) {
  await migrateFriends(env);
  const ctx = await byToken(env, tokOf(request));
  if (!ctx) return gone();
  await loadFeedbackFlag(env, ctx);
  return json(stateOf(ctx));
}
// Feedback direkt nach der Auflösung – einmal pro Spieler. Veröffentlicht wird nur mit Zustimmung (anonym oder Vorname) und nach Freigabe.
export const friendsFeedback = (request, env) => act(request, env, async (ctx) => {
  const { g, p } = ctx;
  if (g.status !== "revealed") return fail("Feedback gibt es nach der Auflösung.", 409);
  await migrateFeedback(env);
  let b = {}; try { b = await request.json(); } catch {}
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) return fail("Bitte eine Sternebewertung wählen.");
  const clip = (x, n) => String(x ?? "").trim().slice(0, n);
  const name = JSON.parse(g.data).players[p.idx].name;
  const vor = String(name).trim().split(/\s+/)[0].slice(0, 30);
  const publish = ["no", "anon", "vorname"].includes(b.publish) ? b.publish : "no";
  const answers = { spieler: name, gruppe: g.id, geloest: p.solved_at ? "ja" : "nein", difficulty: clip(b.difficulty, 40), improve: clip(b.improve, 1500), test: g.test_mode ? "ja" : "nein" };
  await env.DB.prepare("INSERT OR IGNORE INTO feedback (id, order_id, created_at, variant, lang, paket, rating, nps, answers, review, publish, publish_name, approved) VALUES (?,?,?,?,?,?,?,NULL,?,?,?,?,0)")
    .bind(crypto.randomUUID(), `friends:${g.id}:${p.idx}`, Date.now(), "friends", g.lang || "de", "friends", rating, JSON.stringify(answers),
      clip(b.review, 600), publish === "no" ? "no" : publish === "anon" ? "anon" : "name", publish === "vorname" ? vor : null).run();
  return json({ ok: true });
});
// Uhr starten: gleichzeitig = gemeinsame Startzeit der Gruppe, über die Woche = eigener Start
async function begin(env, ctx) {
  const { g, p } = ctx;
  if (p.started_at || p.ended_at) return;
  if (!canBegin(g)) throw Object.assign(new Error(g.mode === "live" ? "Der Fall ist noch nicht gestartet. Dein Organisator startet ihn für alle gleichzeitig." : g.status === "ready" ? "Der Fall ist noch nicht freigeschaltet. Dein Organisator gibt ihn frei." : "Das Zeitfenster für diesen Fall ist vorbei."), { status: 409 });
  const t = g.mode === "live" ? g.started_at : Date.now();
  await env.DB.prepare("UPDATE friends_players SET started_at=? WHERE id=? AND started_at IS NULL").bind(t, p.id).run();
  const r = await env.DB.prepare("SELECT started_at FROM friends_players WHERE id=?").bind(p.id).first();
  p.started_at = r ? r.started_at : t;
}
async function act(request, env, fn) {
  await migrateFriends(env);
  const ctx = await byToken(env, tokOf(request));
  if (!ctx) return gone();
  try { return await fn(ctx); } catch (e) { if (e.status) return fail(e.message, e.status); throw e; }
}
export const friendsBegin = (request, env) => act(request, env, async (ctx) => { await begin(env, ctx); return json(stateOf(ctx)); });

export const friendsHint = (request, env) => act(request, env, async (ctx) => {
  const { p, C, G } = ctx;
  if (p.ended_at) return fail("Dein Fall ist abgeschlossen.", 409);
  await begin(env, ctx);
  const q = C.questions(G)[p.stage - 1];
  const hints = JSON.parse(p.hints || "{}"), lvl = hints[q.key] || 0;
  if (lvl >= 3) return fail("Für diese Frage gibt es keine weiteren Hinweise.", 409);
  hints[q.key] = lvl + 1;
  const pen = C.HINT_PENALTY[lvl];
  const u = await env.DB.prepare("UPDATE friends_players SET hints=?, penalty_min=penalty_min+? WHERE id=? AND hints=?").bind(JSON.stringify(hints), pen, p.id, p.hints).run();
  if (u.meta?.changes) Object.assign(p, { hints: JSON.stringify(hints), penalty_min: p.penalty_min + pen });
  else Object.assign(p, await env.DB.prepare("SELECT * FROM friends_players WHERE id=?").bind(p.id).first());
  return json(stateOf(ctx));
});

export const friendsAnswer = (request, env) => act(request, env, async (ctx) => {
  const { g, p, C, G } = ctx;
  if (p.ended_at) return fail("Dein Fall ist abgeschlossen.", 409);
  await begin(env, ctx);
  let b = {}; try { b = await request.json(); } catch {}
  const now = Date.now();
  if (p.last_try && now - p.last_try < 2000) return fail("Moment – einen Versuch nach dem anderen.", 429);
  const q = C.questions(G)[p.stage - 1];
  if (b.key && b.key !== q.key) return json({ correct: false, stale: true, ...stateOf(ctx) });
  const sol = C.solution(G)[q.key];
  const given = q.type === "time" ? normTime(b.value) : String(b.value || "");
  if (!given) return fail(q.type === "time" ? "Bitte eine Uhrzeit eingeben." : "Bitte eine Antwort auswählen.");
  if (given !== sol) {
    await env.DB.prepare("UPDATE friends_players SET wrong=wrong+1, penalty_min=penalty_min+?, last_try=? WHERE id=?").bind(C.WRONG_PENALTY, now, p.id).run();
    Object.assign(p, { wrong: p.wrong + 1, penalty_min: p.penalty_min + C.WRONG_PENALTY, last_try: now });
    return json({ correct: false, penalty: C.WRONG_PENALTY, ...stateOf(ctx) });
  }
  const stage = p.stage + 1;
  if (stage <= 3) {
    const u = await env.DB.prepare("UPDATE friends_players SET stage=?, last_try=? WHERE id=? AND stage=?").bind(stage, now, p.id, p.stage).run();
    if (u.meta?.changes) Object.assign(p, { stage, last_try: now });
    return json({ correct: true, ...stateOf(ctx) });
  }
  const score = now - p.started_at + p.penalty_min * 60000;
  await env.DB.prepare("UPDATE friends_players SET stage=?, solved_at=?, ended_at=?, score_ms=?, last_try=? WHERE id=? AND solved_at IS NULL").bind(stage, now, now, score, now, p.id).run();
  Object.assign(p, { stage, solved_at: now, ended_at: now, score_ms: score });
  const ps = await refreshGroup(env, g);   // vielleicht war das der letzte Spieler → Auflösung
  return json({ correct: true, ...stateOf({ ...ctx, ps, p: ps.find((x) => x.id === p.id) || p }) });
});

export const friendsGiveUp = (request, env) => act(request, env, async (ctx) => {
  const { g, p } = ctx;
  if (!p.ended_at) {
    await begin(env, ctx);
    const now = Date.now();
    await env.DB.prepare("UPDATE friends_players SET ended_at=? WHERE id=? AND ended_at IS NULL").bind(now, p.id).run();
    p.ended_at = now;
  }
  const ps = await refreshGroup(env, g);
  return json(stateOf({ ...ctx, ps, p: ps.find((x) => x.id === p.id) || p }));
});

// ---------- Organisator ----------
async function byOrg(env, o) {
  const g = await env.DB.prepare("SELECT * FROM friends_groups WHERE org_token=?").bind(String(o || "")).first();
  if (!g) return null;
  const ps = await refreshGroup(env, g);
  return { g, ps, G: G_of(g), C: FRIENDS_CASES[g.case_id] };
}
function orgView({ g, ps, G, C }) {
  const info = groupInfo(g, ps, G);
  const n = G.players.length;
  return {
    title: C.TITLE, invite: g.invite, ...info, limit_min: C.LIMIT_MIN,
    can_start: g.status === "ready",
    can_reveal: g.status === "running" && (!!g.test_mode || (ps.length === n && ps.every((p) => p.ended_at)) || (g.deadline && Date.now() > g.deadline)),
    reveal: g.status === "revealed" ? { ...C.resolution(G), ranking: ranking(g, ps, G, C) } : null,
    now: Date.now(),
  };
}
export async function friendsOrg(env, url) {
  await migrateFriends(env);
  const ctx = await byOrg(env, url.searchParams.get("o"));
  return ctx ? json(orgView(ctx)) : fail("Diesen Organisator-Link gibt es nicht (mehr).", 404);
}
export async function friendsOrgStart(request, env) {
  await migrateFriends(env);
  let b = {}; try { b = await request.json(); } catch {}
  const ctx = await byOrg(env, b.o);
  if (!ctx) return fail("Diesen Organisator-Link gibt es nicht (mehr).", 404);
  const { g } = ctx;
  if (g.status !== "ready") return json(orgView(ctx));
  const now = Date.now();
  const deadline = g.mode === "live" ? now + LIVE_WINDOW_MIN * 60000 : now + (g.window_days || 7) * DAY;
  await env.DB.prepare("UPDATE friends_groups SET status='running', started_at=?, deadline=? WHERE id=? AND status='ready'").bind(now, deadline, g.id).run();
  return friendsOrg(env, new URL("https://x/?o=" + encodeURIComponent(b.o)));
}
export async function friendsOrgReveal(request, env) {
  await migrateFriends(env);
  let b = {}; try { b = await request.json(); } catch {}
  const ctx = await byOrg(env, b.o);
  if (!ctx) return fail("Diesen Organisator-Link gibt es nicht (mehr).", 404);
  if (!orgView(ctx).can_reveal) return fail("Die Auflösung kommt, sobald alle fertig sind oder die Zeit um ist.", 409);
  await reveal(env, ctx.g, ctx.ps);
  return json(orgView(ctx));
}

// ---------- Admin: Testgruppen ----------
const TEST_NAMES = ["Anna", "Bernd", "Clara", "David", "Eva", "Felix", "Gerda", "Hannes"];
export async function friendsAdmin(route, request, env) {
  await migrateFriends(env);
  if (route === "admin/group" && request.method === "POST") {
    let b = {}; try { b = await request.json(); } catch {}
    const n = Math.max(4, Math.min(8, Number(b.n) || 6));
    const C = FRIENDS_CASES["friends-001"];
    const players = TEST_NAMES.slice(0, n).map((name) => ({ name, quirk: C.QUIRK_KEYS[randInt(C.QUIRK_KEYS.length)] }));
    const g = await createFriendsGroup(env, { players, mode: b.mode === "week" ? "week" : "live", days: b.days || 3, test: b.test !== false });
    return json({ id: g.id, invite: g.invite, org: g.org_token });
  }
  if (route === "admin/list" && request.method === "GET") {
    const { results } = await env.DB.prepare(`SELECT g.id, g.mode, g.status, g.test_mode, g.created_at, g.invite, g.org_token, g.order_id,
      json_array_length(json_extract(g.data, '$.players')) AS n,
      (SELECT COUNT(*) FROM friends_players p WHERE p.group_id=g.id) AS joined,
      (SELECT COUNT(*) FROM friends_players p WHERE p.group_id=g.id AND p.solved_at IS NOT NULL) AS solved,
      (SELECT AVG(score_ms) FROM friends_players p WHERE p.group_id=g.id AND p.solved_at IS NOT NULL) AS avg
      FROM friends_groups g ORDER BY g.created_at DESC LIMIT 50`).all();
    return json({ groups: results });
  }
  return fail("Nicht gefunden.", 404);
}

// Für Shop, Bestätigungsseite und Widerruf
export async function friendsGroupOfOrder(env, orderId) {
  await migrateFriends(env);
  return env.DB.prepare("SELECT * FROM friends_groups WHERE order_id=?").bind(orderId).first();
}
