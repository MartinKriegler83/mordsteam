// Mordsteam Friends – Krimiabend für 4–8 Freunde. Eine Gruppe = ein Fall (Besetzung, Täter, Zeitvariante für alle gleich),
// jeder Spieler hat einen eigenen Durchgang (Uhr, Stufen, Hinweise, Strafminuten) – wie Solo, nur mehrfach.
// Spielarten: "live" (Organisator startet für alle, eine gemeinsame Uhr) und "week" (jeder startet selbst innerhalb von 3/5/7 Tagen).
// Spoilerschutz: Lösung, Täter und Rangliste gibt es erst bei der gemeinsamen Auflösung.
import { json, fail, randInt, randomToken, randomCode, esc } from "./game.js";
import { logAI, sendMail } from "./ops.js";
import * as friends001 from "./cases/friends-001.js";
import * as friends001en from "./cases/friends-001-en.js";
import { migrateFeedback } from "./feedback.js";

export const FRIENDS_CASES = { "friends-001": friends001 };
const FRIENDS_EN = { "friends-001": friends001en };
// Fall in der Spielsprache der Gruppe: englische Texte ersetzen die deutschen, Logik bleibt gleich
const mergedCases = {};
export function friendsCase(id, lang) {
  const base = FRIENDS_CASES[id];
  if (lang !== "en" || !base || !FRIENDS_EN[id]) return base;
  return (mergedCases[id] ||= { ...base, ...FRIENDS_EN[id] });
}
const isEn = (x) => (x && typeof x === "object" ? (x.lang || (x.g && x.g.lang) || "") : String(x || "")) === "en";
const T = (lang, de, en) => (isEn(lang) ? en : de);
const hLang = (request) => (request && request.headers && request.headers.get("x-lang") === "en" ? "en" : "de");
const EXTRA_MIN = 45;        // ungelöster Durchgang wird 45 Min. nach Ablauf der Spielzeit geschlossen
const LIVE_EXTRA_MIN = 15;   // gleichzeitig: Auflösung spätestens 15 Min. nach Ablauf der Spielzeit
const KEEP_DAYS = 30;        // Namen und Spielstände werden 30 Tage nach der Auflösung gelöscht
const DAY = 86400000;
// Preise Krimiabend: 29 € bis 4 Personen, je weitere Person +5 €, höchstens 8
export const FRIENDS_PRICE = { base: 2900, extra: 500, included: 4, min: 4, max: 8 };
export const FRIENDS_PRICE_PLUS = { base: 4900, extra: 800, included: 4, min: 4, max: 8 };
export const friendsPrice = (n, plus = false) => { const P = plus ? FRIENDS_PRICE_PLUS : FRIENDS_PRICE; return P.base + Math.max(0, n - P.included) * P.extra; };

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
    // Plus: Verhörraum – Fragen und Antworten je Spieler und Verdächtigem
    "CREATE TABLE IF NOT EXISTS friends_chat (id INTEGER PRIMARY KEY AUTOINCREMENT, player_id TEXT NOT NULL, suspect INTEGER NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, at INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS friends_chat_player ON friends_chat(player_id)",
    "ALTER TABLE friends_players ADD COLUMN chat_last_at INTEGER",
    // 1 = Organisator hat die Mail „Die Auflösung ist da“ bekommen
    "ALTER TABLE friends_groups ADD COLUMN reveal_mailed INTEGER DEFAULT 0",
  ];
  for (const s of stmts) { try { await env.DB.prepare(s).run(); } catch {} }
  ready = true;
}

async function purge(env) {
  try {
    const old = Date.now() - KEEP_DAYS * DAY;
    await env.DB.prepare("DELETE FROM friends_chat WHERE player_id IN (SELECT p.id FROM friends_players p JOIN friends_groups g ON g.id=p.group_id WHERE g.revealed_at IS NOT NULL AND g.revealed_at < ?)").bind(old).run();
    await env.DB.prepare("DELETE FROM friends_players WHERE group_id IN (SELECT id FROM friends_groups WHERE revealed_at IS NOT NULL AND revealed_at < ?)").bind(old).run();
    await env.DB.prepare("DELETE FROM friends_groups WHERE revealed_at IS NOT NULL AND revealed_at < ?").bind(old).run();
    // nie aufgelöste Runden: 13 Monate nach dem Anlegen samt Namen löschen
    const never = Date.now() - (365 + KEEP_DAYS) * DAY;
    await env.DB.prepare("DELETE FROM friends_chat WHERE player_id IN (SELECT p.id FROM friends_players p JOIN friends_groups g ON g.id=p.group_id WHERE g.revealed_at IS NULL AND g.created_at < ?)").bind(never).run();
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
export async function createFriendsGroup(env, { caseId = "friends-001", lang = "de", players = [], mode = "live", days = 7, orderId = null, test = false, plus = false } = {}) {
  await migrateFriends(env);
  const C = friendsCase(caseId, lang);
  const list = players.map((p) => ({ name: cleanName(p.name), quirk: C.QUIRKS[p.quirk] ? p.quirk : "snacks" })).filter((p) => p.name.length >= 1);
  if (list.length < C.MIN_PLAYERS || list.length > C.MAX_PLAYERS) throw new Error(T(lang, `Bitte ${C.MIN_PLAYERS} bis ${C.MAX_PLAYERS} Personen eingeben.`, `Please enter ${C.MIN_PLAYERS} to ${C.MAX_PLAYERS} people.`));
  const seen = new Set();
  for (const p of list) { const k = p.name.toLowerCase(); if (seen.has(k)) throw new Error(T(lang, `Der Name „${p.name}“ kommt doppelt vor. Bitte unterscheidbar machen, z. B. mit Initial.`, `The name “${p.name}” appears twice. Please make them distinguishable, e.g. with an initial.`)); seen.add(k); }
  const S = C.setup(list.length, randInt);
  const data = { players: list.map((p, i) => ({ ...p, act: S.acts[i], room: S.rooms[i] })), culprit: S.culprit, decoy: S.decoy, tvar: S.tvar, beer: S.beer, excuse: S.excuse, plus: !!plus };
  const m = mode === "week" ? "week" : "live";
  for (let i = 0; i < 8; i++) {
    const id = "F" + randomCode(7);
    try {
      await env.DB.prepare("INSERT INTO friends_groups (id, case_id, lang, mode, window_days, invite, org_token, data, order_id, test_mode, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, caseId, lang, m, m === "week" ? ([3, 5, 7].includes(Number(days)) ? Number(days) : 7) : null, randomToken(12), randomToken(16), JSON.stringify(data), orderId, test ? 1 : 0, Date.now()).run();
      return await env.DB.prepare("SELECT * FROM friends_groups WHERE id=?").bind(id).first();
    } catch {}
  }
  throw new Error(T(lang, "Gruppe konnte nicht angelegt werden.", "The group could not be created."));
}

// ---------- Gruppe laden, Status nachziehen ----------
const G_of = (g) => { const d = JSON.parse(g.data); return { ...d, players: d.players.map((p) => ({ ...p, name: esc(p.name) })) }; };
async function playersOf(env, gid) {
  return (await env.DB.prepare("SELECT * FROM friends_players WHERE group_id=? ORDER BY idx").bind(gid).all()).results;
}
function runLimit(g, p) { if (!p.started_at) return null; const G = JSON.parse(g.data), C = friendsCase(g.case_id, g.lang); return p.started_at + (C.limitOf(G) + EXTRA_MIN) * 60000; }
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
  await revealMail(env, g).catch(() => {});
}

// Mail an den Organisator, sobald die Auflösung da ist (vor allem wichtig im Wochenmodus).
// Der Organisator teilt sie in der Gruppe – jeder sieht mit seinem Einladungslink Täter und Rangliste.
async function revealMail(env, g, origin) {
  if (!g.order_id || g.test_mode) return false;
  const row = await env.DB.prepare("SELECT reveal_mailed FROM friends_groups WHERE id=?").bind(g.id).first();
  if (row && row.reveal_mailed) return false;
  const o = await env.DB.prepare("SELECT contact FROM orders WHERE id=?").bind(g.order_id).first();
  const c = o ? JSON.parse(o.contact || "{}") : {};
  if (!c.email) return false;
  const base = origin || env.PUBLIC_ORIGIN || "https://mordsteam.com";
  const inv = `${base}/spiel/friends.html?e=${g.invite}`, org = `${base}/spiel/friends.html?o=${g.org_token}`;
  const en = g.lang === "en", C = friendsCase(g.case_id, g.lang);
  const e = (x) => String(x || "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#15171C;max-width:560px">
<div style="font-family:Georgia,serif;font-weight:900;font-size:22px;letter-spacing:.5px;margin-bottom:6px"><span style="color:#B3261E">MORDS</span>TEAM <span style="font-size:14px;letter-spacing:3px">FRIENDS</span></div>
<h2 style="font-family:Georgia,serif">${en ? "The solution is here!" : "Die Auflösung ist da!"}</h2>
<p>${en ? "Hi" : "Hallo"} ${e(c.name)},</p>
<p>${en ? `your murder mystery night “${e(C.TITLE)}” has been solved: who did it, who was fastest – and which award does everyone get?` : `euer Krimiabend „${e(C.TITLE)}“ ist aufgelöst: Wer war's, wer war am schnellsten – und welche Auszeichnung bekommt jeder?`}</p>
<p>${en ? "<b>Send this link to your group now</b> (e.g. on WhatsApp). Everyone opens it and taps their name:" : "<b>Schick diesen Link jetzt in eure Gruppe</b> (z. B. per WhatsApp). Jeder öffnet ihn und tippt auf seinen Namen:"}</p>
<p style="margin:22px 0"><a href="${inv}" style="background:#B3261E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;display:inline-block">${en ? "See the solution" : "Zur Auflösung"}</a></p>
<p style="font-size:13px;color:#5A5D66">${inv}<br>${en ? "Your organiser page" : "Deine Organisator-Seite"}: <a href="${org}">${org}</a></p>
<p>${en ? "Enjoy the big reveal!" : "Viel Spaß bei der Auflösung!"}<br>Mordsteam</p></div>`;
  const ok = await sendMail(env, "friends-aufloesung", { to: [c.email], reply_to: "office@mordsteam.com", subject: en ? "Mordsteam Friends: The solution is here!" : "Mordsteam Friends: Die Auflösung ist da!", html });
  if (ok) await env.DB.prepare("UPDATE friends_groups SET reveal_mailed=1 WHERE id=?").bind(g.id).run();
  return ok;
}

// Stündlicher Lauf: Runden im Wochenmodus, deren Zeit um ist, auflösen – und fehlende Auflösungs-Mails nachholen
export async function friendsCron(env, origin) {
  await migrateFriends(env);
  const now = Date.now(), out = { revealed: 0, mailed: 0 };
  const due = (await env.DB.prepare("SELECT * FROM friends_groups WHERE status='running' AND deadline IS NOT NULL AND deadline < ?").bind(now).all()).results;
  for (const g of due) { await refreshGroup(env, g); if (g.status === "revealed") out.revealed++; }
  const open = (await env.DB.prepare("SELECT * FROM friends_groups WHERE status='revealed' AND order_id IS NOT NULL AND COALESCE(reveal_mailed,0)=0 AND COALESCE(test_mode,0)=0 AND revealed_at > ?").bind(now - 7 * 86400000).all()).results;
  for (const g of open) if (await revealMail(env, g, origin)) out.mailed++;
  return out;
}

async function byToken(env, tok) {
  if (!tok) return null;
  const p = await env.DB.prepare("SELECT * FROM friends_players WHERE token=?").bind(tok).first();
  if (!p) return null;
  const g = await env.DB.prepare("SELECT * FROM friends_groups WHERE id=?").bind(p.group_id).first();
  if (!g) return null;
  const ps = await refreshGroup(env, g);
  return { g, p: ps.find((x) => x.id === p.id) || p, ps, C: friendsCase(g.case_id, g.lang), G: G_of(g) };
}
const gone = (request) => fail(T(hLang(request), "Dieser Spielstand ist nicht mehr gültig. Bitte öffne den Einladungslink erneut.", "This game session is no longer valid. Please open the invitation link again."), 401);

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
  const docs = !begun ? [] : C.docs(G, p.idx).filter((d) => d.stage <= Math.min(p.stage, Q.length)).map((d) => ({ id: d.id, stage: d.stage, kind: d.kind, kk: d.kk || "", title: d.title, html: d.html }));
  const questions = Q.map((q, i) => ({
    key: q.key, nr: q.nr, type: q.type, label: q.label, hint: q.hint, options: q.options || null,
    status: i + 1 < p.stage ? "done" : i + 1 === p.stage && !p.ended_at ? "open" : i + 1 === p.stage ? "closed" : "locked",
    answer: i + 1 < p.stage ? (q.type === "select" ? (q.options.find((o) => o[0] === sol[q.key]) || [])[1] : sol[q.key]) : null,
    hints: (H[q.key] || []).slice(0, hints[q.key] || 0),
    next_hint_cost: (hints[q.key] || 0) < 3 ? C.HINT_PENALTY[hints[q.key] || 0] : null,
  }));
  const out = {
    name: G.players[p.idx].name, me: p.idx, lang: g.lang === "en" ? "en" : "de", title: C.TITLE, now: Date.now(), started_at: p.started_at, begun,
    group: groupInfo(g, ps, G), can_begin: !begun && !p.ended_at && canBegin(g),
    limit_min: C.limitOf(G), clock_start: C.CLOCK_START, clock_label: C.CLOCK_LABEL, late_label: C.LATE_LABEL,
    penalty_min: p.penalty_min, wrong: p.wrong, stage: p.stage, rules: { wrong: C.WRONG_PENALTY, hints: C.HINT_PENALTY },
    plus: !!G.plus, verhoer: G.plus ? { open: p.stage >= C.VERHOER_FROM_STAGE && !p.ended_at, max: C.VERHOER_MAX, from_question: C.VERHOER_FROM_STAGE - 1 } : null,
    briefing: C.briefing(G.players[p.idx].name, G), questions, docs, solved: !!p.solved_at, ended: !!p.ended_at,
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
export async function friendsInvite(env, url, request) {
  await migrateFriends(env);
  await purge(env);
  const g = await env.DB.prepare("SELECT * FROM friends_groups WHERE invite=?").bind(String(url.searchParams.get("e") || "")).first();
  if (!g || g.status === "withdrawn") return fail(T(hLang(request), "Diesen Einladungslink gibt es nicht (mehr). Bitte frag deinen Organisator nach dem aktuellen Link.", "This invitation link doesn’t exist (any more). Please ask your organiser for the current link."), 404);
  const ps = await refreshGroup(env, g);
  const G = G_of(g), C = friendsCase(g.case_id, g.lang);
  return json({ lang: g.lang === "en" ? "en" : "de", title: C.TITLE, ...groupInfo(g, ps, G), limit_min: C.limitOf(G), plus: !!G.plus });
}
// Name wählen → eigener Spielstand. Unter Freunden bewusst ohne Passwort: Wer den Namen erneut wählt, macht auf dem neuen Gerät weiter.
export async function friendsClaim(request, env) {
  await migrateFriends(env);
  let b = {}; try { b = await request.json(); } catch {}
  const g = await env.DB.prepare("SELECT * FROM friends_groups WHERE invite=?").bind(String(b.e || "")).first();
  if (!g) return fail(T(hLang(request), "Diesen Einladungslink gibt es nicht (mehr).", "This invitation link doesn’t exist (any more)."), 404);
  const n = JSON.parse(g.data).players.length, idx = Number(b.idx);
  if (!(idx >= 0 && idx < n)) return fail(T(g, "Bitte wähle deinen Namen.", "Please choose your name."));
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
  if (!ctx) return gone(request);
  await loadFeedbackFlag(env, ctx);
  return json(stateOf(ctx));
}
// Feedback direkt nach der Auflösung – einmal pro Spieler. Veröffentlicht wird nur mit Zustimmung (anonym oder Vorname) und nach Freigabe.
export const friendsFeedback = (request, env) => act(request, env, async (ctx) => {
  const { g, p } = ctx;
  if (g.status !== "revealed") return fail(T(g, "Feedback gibt es nach der Auflösung.", "Feedback is available after the reveal."), 409);
  await migrateFeedback(env);
  let b = {}; try { b = await request.json(); } catch {}
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) return fail(T(g, "Bitte eine Sternebewertung wählen.", "Please choose a star rating."));
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
  if (!canBegin(g)) throw Object.assign(new Error(g.mode === "live" ? T(g, "Der Fall ist noch nicht gestartet. Dein Organisator startet ihn für alle gleichzeitig.", "The case hasn’t started yet. Your organiser starts it for everyone at the same time.") : g.status === "ready" ? T(g, "Der Fall ist noch nicht freigeschaltet. Dein Organisator gibt ihn frei.", "The case hasn’t been unlocked yet. Your organiser will unlock it.") : T(g, "Das Zeitfenster für diesen Fall ist vorbei.", "The time window for this case is over.")), { status: 409 });
  const t = g.mode === "live" ? g.started_at : Date.now();
  await env.DB.prepare("UPDATE friends_players SET started_at=? WHERE id=? AND started_at IS NULL").bind(t, p.id).run();
  const r = await env.DB.prepare("SELECT started_at FROM friends_players WHERE id=?").bind(p.id).first();
  p.started_at = r ? r.started_at : t;
}
async function act(request, env, fn) {
  await migrateFriends(env);
  const ctx = await byToken(env, tokOf(request));
  if (!ctx) return gone(request);
  try { return await fn(ctx); } catch (e) { if (e.status) return fail(e.message, e.status); throw e; }
}
export const friendsBegin = (request, env) => act(request, env, async (ctx) => { await begin(env, ctx); return json(stateOf(ctx)); });

export const friendsHint = (request, env) => act(request, env, async (ctx) => {
  const { p, C, G } = ctx;
  if (p.ended_at) return fail(T(ctx, "Dein Fall ist abgeschlossen.", "Your case is closed."), 409);
  await begin(env, ctx);
  const q = C.questions(G)[p.stage - 1];
  const hints = JSON.parse(p.hints || "{}"), lvl = hints[q.key] || 0;
  if (lvl >= 3) return fail(T(ctx, "Für diese Frage gibt es keine weiteren Hinweise.", "There are no more hints for this question."), 409);
  hints[q.key] = lvl + 1;
  const pen = C.HINT_PENALTY[lvl];
  const u = await env.DB.prepare("UPDATE friends_players SET hints=?, penalty_min=penalty_min+? WHERE id=? AND hints=?").bind(JSON.stringify(hints), pen, p.id, p.hints).run();
  if (u.meta?.changes) Object.assign(p, { hints: JSON.stringify(hints), penalty_min: p.penalty_min + pen });
  else Object.assign(p, await env.DB.prepare("SELECT * FROM friends_players WHERE id=?").bind(p.id).first());
  return json(stateOf(ctx));
});

export const friendsAnswer = (request, env) => act(request, env, async (ctx) => {
  const { g, p, C, G } = ctx;
  if (p.ended_at) return fail(T(ctx, "Dein Fall ist abgeschlossen.", "Your case is closed."), 409);
  await begin(env, ctx);
  let b = {}; try { b = await request.json(); } catch {}
  const now = Date.now();
  if (p.last_try && now - p.last_try < 2000) return fail(T(ctx, "Moment – einen Versuch nach dem anderen.", "Hold on – one attempt at a time."), 429);
  const q = C.questions(G)[p.stage - 1];
  if (b.key && b.key !== q.key) return json({ correct: false, stale: true, ...stateOf(ctx) });
  const sol = C.solution(G)[q.key];
  const given = q.type === "time" ? normTime(b.value) : String(b.value || "");
  if (!given) return fail(q.type === "time" ? T(ctx, "Bitte eine Uhrzeit eingeben.", "Please enter a time.") : T(ctx, "Bitte eine Antwort auswählen.", "Please choose an answer."));
  if (given !== sol) {
    await env.DB.prepare("UPDATE friends_players SET wrong=wrong+1, penalty_min=penalty_min+?, last_try=? WHERE id=?").bind(C.WRONG_PENALTY, now, p.id).run();
    Object.assign(p, { wrong: p.wrong + 1, penalty_min: p.penalty_min + C.WRONG_PENALTY, last_try: now });
    return json({ correct: false, penalty: C.WRONG_PENALTY, ...stateOf(ctx) });
  }
  const stage = p.stage + 1;
  if (stage <= C.questions(G).length) {
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
  return { g, ps, G: G_of(g), C: friendsCase(g.case_id, g.lang) };
}
function orgView({ g, ps, G, C }) {
  const info = groupInfo(g, ps, G);
  const n = G.players.length;
  return {
    lang: g.lang === "en" ? "en" : "de", title: C.TITLE, invite: g.invite, ...info, limit_min: C.limitOf(G), plus: !!G.plus,
    can_start: g.status === "ready",
    can_reveal: g.status === "running" && (!!g.test_mode || (ps.length === n && ps.every((p) => p.ended_at)) || (g.deadline && Date.now() > g.deadline)),
    reveal: g.status === "revealed" ? { ...C.resolution(G), ranking: ranking(g, ps, G, C) } : null,
    now: Date.now(),
  };
}
export async function friendsOrg(env, url, request) {
  await migrateFriends(env);
  const ctx = await byOrg(env, url.searchParams.get("o"));
  return ctx ? json(orgView(ctx)) : fail(T(hLang(request), "Diesen Organisator-Link gibt es nicht (mehr).", "This organiser link doesn’t exist (any more)."), 404);
}
export async function friendsOrgStart(request, env) {
  await migrateFriends(env);
  let b = {}; try { b = await request.json(); } catch {}
  const ctx = await byOrg(env, b.o);
  if (!ctx) return fail(T(hLang(request), "Diesen Organisator-Link gibt es nicht (mehr).", "This organiser link doesn’t exist (any more)."), 404);
  const { g } = ctx;
  if (g.status !== "ready") return json(orgView(ctx));
  const now = Date.now();
  const deadline = g.mode === "live" ? now + (ctx.C.limitOf(JSON.parse(g.data)) + LIVE_EXTRA_MIN) * 60000 : now + (g.window_days || 7) * DAY;
  await env.DB.prepare("UPDATE friends_groups SET status='running', started_at=?, deadline=? WHERE id=? AND status='ready'").bind(now, deadline, g.id).run();
  return friendsOrg(env, new URL("https://x/?o=" + encodeURIComponent(b.o)), request);
}
export async function friendsOrgReveal(request, env) {
  await migrateFriends(env);
  let b = {}; try { b = await request.json(); } catch {}
  const ctx = await byOrg(env, b.o);
  if (!ctx) return fail(T(hLang(request), "Diesen Organisator-Link gibt es nicht (mehr).", "This organiser link doesn’t exist (any more)."), 404);
  if (!orgView(ctx).can_reveal) return fail(T(ctx, "Die Auflösung kommt, sobald alle fertig sind oder die Zeit um ist.", "The solution is revealed once everyone has finished or time is up."), 409);
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
    const lang = b.lang === "en" ? "en" : "de";
    const C = friendsCase("friends-001", lang);
    const players = TEST_NAMES.slice(0, n).map((name) => ({ name, quirk: C.QUIRK_KEYS[randInt(C.QUIRK_KEYS.length)] }));
    const g = await createFriendsGroup(env, { lang, players, mode: b.mode === "week" ? "week" : "live", days: b.days || 3, test: b.test !== false, plus: !!b.plus });
    return json({ id: g.id, invite: g.invite, org: g.org_token });
  }
  if (route === "admin/list" && request.method === "GET") {
    const { results } = await env.DB.prepare(`SELECT g.id, g.lang, g.mode, g.status, g.test_mode, g.created_at, g.invite, g.org_token, g.order_id,
      json_array_length(json_extract(g.data, '$.players')) AS n, json_extract(g.data, '$.plus') AS plus,
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

// ---------- Plus: Verhörraum mit KI-Doppelgängern ----------
// Datenschutz: Echte Namen verlassen unseren Server nie. Vor dem Senden an die KI werden sie durch [PERSON1] … ersetzt
// und in der Antwort wieder eingesetzt. Die KI kennt nur die erfundene Falldaten und die Eigenheit aus der Liste.
const CHAT_MAX_CHARS = 300, CHAT_GAP_MS = 2500, CHAT_HISTORY = 8;
function pseudo(G, en = false) {
  const raw = JSON.parse(JSON.stringify(G.players)).map((p) => String(p.name).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
  const P = raw.map((_, i) => `[PERSON${i + 1}]`);
  const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const order = raw.map((n, i) => [n, P[i]]).filter(([n]) => n.trim().length >= 1).sort((a, b) => b[0].length - a[0].length);
  const hide = (text) => { let out = String(text); for (const [n, t] of order) out = out.replace(new RegExp(`(^|[^\\p{L}])${escRe(n.trim())}(?![\\p{L}])`, "giu"), `$1${t}`); return out; };
  const show = (text) => { let out = String(text); raw.forEach((n, i) => { out = out.split(P[i]).join(n); }); return out.replace(/\[PERSON\d\]/g, en ? "(someone)" : "(jemand)"); };
  return { P, hide, show };
}
async function chatRows(env, pid) {
  return (await env.DB.prepare("SELECT suspect, role, text, at FROM friends_chat WHERE player_id=? ORDER BY id LIMIT 200").bind(pid).all()).results;
}
function chatView(ctx, rows) {
  const { p, C, G } = ctx;
  const used = rows.filter((r) => r.role === "user").length;
  const open = !!G.plus && p.stage >= C.VERHOER_FROM_STAGE && !p.ended_at;
  return { plus: !!G.plus, open, used, max: C.VERHOER_MAX, max_chars: CHAT_MAX_CHARS,
    suspects: G.players.map((x, i) => ({ idx: i, name: x.name, me: i === p.idx })),
    threads: open || p.ended_at ? G.players.map((_, i) => rows.filter((r) => r.suspect === i).map((r) => ({ role: r.role, text: esc(r.text), at: r.at }))) : [] };
}
export const friendsVerhoerGet = (request, env) => act(request, env, async (ctx) => {
  if (!ctx.G.plus) return fail(T(ctx, "Den Verhörraum gibt es nur im Krimiabend Plus.", "The interrogation room is only part of Friends Plus."), 404);
  return json(chatView(ctx, await chatRows(env, ctx.p.id)));
});
export const friendsVerhoerAsk = (request, env) => act(request, env, async (ctx) => {
  const { p, C, G } = ctx;
  if (!G.plus) return fail(T(ctx, "Den Verhörraum gibt es nur im Krimiabend Plus.", "The interrogation room is only part of Friends Plus."), 404);
  if (p.ended_at) return fail(T(ctx, "Dein Fall ist abgeschlossen.", "Your case is closed."), 409);
  if (p.stage < C.VERHOER_FROM_STAGE) return fail(T(ctx, `Der Verhörraum öffnet, sobald du Frage ${C.VERHOER_FROM_STAGE - 1} gelöst hast.`, `The interrogation room opens once you’ve solved question ${C.VERHOER_FROM_STAGE - 1}.`), 403);
  let b = {}; try { b = await request.json(); } catch {}
  const idx = Number(b.suspect);
  if (!(idx >= 0 && idx < G.players.length)) return fail(T(ctx, "Bitte wähle, wen du verhören willst.", "Please choose who you want to question."));
  const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_CHARS);
  if (!text) return fail(T(ctx, "Bitte eine Frage eingeben.", "Please enter a question."));
  const rows = await chatRows(env, p.id);
  if (rows.filter((r) => r.role === "user").length >= C.VERHOER_MAX) return fail(T(ctx, `Du hast alle ${C.VERHOER_MAX} Fragen gestellt. Die Hinweise zur letzten Frage helfen dir weiter.`, `You’ve asked all ${C.VERHOER_MAX} questions. The hints for the last question will help you on.`), 429);
  const now = Date.now();
  const gate = await env.DB.prepare("UPDATE friends_players SET chat_last_at=? WHERE id=? AND (chat_last_at IS NULL OR chat_last_at < ?)").bind(now, p.id, now - CHAT_GAP_MS).run();
  if (!gate.meta?.changes) return fail(T(ctx, "Einen Moment – die Antwort kommt noch.", "One moment – the answer is on its way."), 429);
  await env.DB.prepare("INSERT INTO friends_chat (player_id, suspect, role, text, at) VALUES (?,?,?,?,?)").bind(p.id, idx, "user", text, now).run();
  const ps = pseudo(G, isEn(ctx));
  let reply, logged = false;
  try {
    if (!env.ANTHROPIC_API_KEY) throw new Error("kein Schlüssel");
    const hist = [...rows.filter((r) => r.suspect === idx), { role: "user", text }].slice(-CHAT_HISTORY);
    const messages = [];
    for (const m of hist) { const t = ps.hide(m.text); const last = messages.at(-1); if (last && last.role === m.role) last.content += "\n" + t; else messages.push({ role: m.role, content: t }); }
    while (messages.length && messages[0].role !== "user") messages.shift();
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: env.ARIA_MODEL || "claude-haiku-4-5-20251001", max_tokens: 220, temperature: 0.7,
        system: [{ type: "text", text: C.doubleSystem(G, idx, p.idx, ps.P), cache_control: { type: "ephemeral" } }], messages }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    logged = true;
    await logAI(env, d.usage, r.ok);
    if (!r.ok) throw new Error(d.error?.message || String(r.status));
    reply = ps.show((d.content || []).filter((x) => x.type === "text").map((x) => x.text).join("").trim()).slice(0, 800);
    if (!reply) throw new Error("leer");
  } catch (e) {
    if (!logged && env.ANTHROPIC_API_KEY) await logAI(env, null, false);
    reply = ps.show(C.doubleFallback(G, idx, text));
  }
  await env.DB.prepare("INSERT INTO friends_chat (player_id, suspect, role, text, at) VALUES (?,?,?,?,?)").bind(p.id, idx, "assistant", reply, Date.now()).run();
  return json(chatView(ctx, await chatRows(env, p.id)));
});
