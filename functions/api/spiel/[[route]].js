// Cloudflare Pages Function: /api/spiel/*
// Benötigt: D1-Binding "DB" und die geheime Umgebungsvariable "ADMIN_KEY".
import {
  CASES, RULES, json, fail, randInt, randomToken, randomCode, esc, viennaDate,
  buildVars, render, checkAnswers, hintTimes, hardEnd, refreshStatus, finishIfAllSolved, recordStats, expired, purgeSession, ranking, teamScore,
  isPremium, isPlus, tierOf, TIER_NAMES, stageOf, stageQuestions,
} from "../../../lib/game.js";

import { migrate, createGameSession, InputError } from "../../../lib/create.js";

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  if (!env.DB) return fail("Datenbank nicht eingerichtet (D1-Binding DB fehlt).", 500);
  const route = (params.route || []).join("/");
  const method = request.method;
  try {
    await migrate(env);
    // --- Teams ---
    if (route === "join" && method === "POST") return join(request, env);
    if (route === "mitlesen" && method === "POST") return mitlesen(request, env);
    if (route === "state" && method === "GET") return withTeam(request, env, teamState);
    if (route === "akte" && method === "GET") return withTeam(request, env, akte, true);
    if (route === "firma" && method === "GET") return withTeam(request, env, firma, true);
    if (route === "firma/login" && method === "POST") return withTeam(request, env, firmaLogin, true);
    if (route === "loesung" && method === "POST") return withTeam(request, env, loesung, true, false);
    if (route === "kontrolle" && method === "POST") return withTeam(request, env, kontrolle, true, false);
    if (route === "aria" && method === "GET") return withTeam(request, env, ariaGet);
    if (route === "aria/chat" && method === "POST") return withTeam(request, env, ariaChat, true);
    if (route === "aria/kennwort" && method === "POST") return withTeam(request, env, ariaKennwort, true);
    if (route === "test/vorspulen" && method === "POST") return withTeam(request, env, vorspulen, true, false);
    // --- Organisator ---
    if (route === "leitung/login" && method === "POST") return leitungLogin(request, env);
    if (route === "leitung/state" && method === "GET") return withOrg(request, env, leitungState);
    if (route === "leitung/aktion" && method === "POST") return withOrg(request, env, leitungAktion);
    if (route === "leitung/aufloesung" && method === "GET") return withOrg(request, env, aufloesung);
    // --- Admin (Mordsteam) ---
    if (route.startsWith("admin/")) {
      if (!env.ADMIN_KEY) return fail("ADMIN_KEY ist in dieser Umgebung nicht gesetzt (oder das Deployment ist älter als die Variable).", 503);
      if ((request.headers.get("x-admin") || "").trim() !== String(env.ADMIN_KEY).trim()) return fail("Nicht berechtigt.", 401);
      if (route === "admin/meta" && method === "GET") return adminMeta();
      if (route === "admin/sessions" && method === "GET") return adminList(env);
      if (route === "admin/session" && method === "POST") return adminCreate(request, env);
      if (route === "admin/delete" && method === "POST") return adminDelete(request, env);
      if (route === "admin/orders" && method === "GET") return adminOrders(env);
      if (route === "admin/stats" && method === "GET") return adminStats(request, env);
      if (route === "admin/order-shipped" && method === "POST") return adminShipped(request, env);
    }
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    return fail("Serverfehler: " + e.message, 500);
  }
}

// ---------- Zugriff ----------
async function loadSession(env, id) {
  const s = await env.DB.prepare("SELECT * FROM sessions WHERE id=?").bind(id).first();
  if (!s) return null;
  if (expired(s)) { await purgeSession(env, s.id); return null; }
  return refreshStatus(env, s);
}
// Teamgerät (x-team) darf alles; Mitlesegeräte (x-view) nur lesen
async function withTeam(request, env, fn, needsRunning = false, allowViewer = true) {
  const token = request.headers.get("x-team") || "";
  const view = request.headers.get("x-view") || "";
  let team = null, viewer = false;
  if (token) team = await env.DB.prepare("SELECT * FROM teams WHERE token=?").bind(token).first();
  else if (view) { team = await env.DB.prepare("SELECT teams.* FROM viewers JOIN teams ON teams.id = viewers.team_id WHERE viewers.token=?").bind(view).first(); viewer = !!team; }
  if (viewer && !allowViewer) return fail("Lösungen gibt euer Team nur am Hauptgerät ein.", 403);
  if (!team) return fail("Team unbekannt. Bitte neu anmelden.", 401);
  const session = await loadSession(env, team.session_id);
  if (!session) return fail("Diese Spielrunde existiert nicht mehr.", 410);
  if (needsRunning && session.status !== "running") return fail("Der Fall ist gerade nicht geöffnet.", 403);
  return fn({ request, env, team, session, viewer });
}
async function withOrg(request, env, fn) {
  const token = request.headers.get("x-leitung") || "";
  const session = token && (await env.DB.prepare("SELECT * FROM sessions WHERE org_token=?").bind(token).first());
  if (!session) return fail("Bitte mit dem Organisator-Code anmelden.", 401);
  const s = await loadSession(env, session.id);
  if (!s) return fail("Diese Spielrunde existiert nicht mehr.", 410);
  return fn({ request, env, session: s });
}
async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

// ---------- Teams ----------
async function join(request, env) {
  const b = await body(request);
  const code = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const name = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 40);
  if (name.length < 2) return fail("Bitte einen Teamnamen mit mindestens 2 Zeichen eingeben.");
  const s0 = await env.DB.prepare("SELECT * FROM sessions WHERE join_code=?").bind(code).first();
  const session = s0 && (await loadSession(env, s0.id));
  if (!session) return fail("Diesen Spielcode gibt es nicht.", 404);
  if (session.status === "created") return fail("Der Fall ist noch nicht freigeschaltet. Euer Organisator öffnet ihn am Spieltag.", 403);
  if (session.status === "finished") return fail("Diese Spielrunde ist bereits beendet.", 403);
  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM teams WHERE session_id=?").bind(session.id).first();
  const maxTeams = session.max_teams || RULES.maxTeams;
  if (count.n >= maxTeams) return fail(`Alle gebuchten Teams (${maxTeams}) sind bereits angemeldet. Weitere Personen können per QR-Code bei einem Team mitlesen.`, 403);
  const exists = await env.DB.prepare("SELECT id FROM teams WHERE session_id=? AND name=?").bind(session.id, name).first();
  if (exists) return fail("Diesen Teamnamen gibt es schon. Bitte einen anderen wählen.", 409);
  const token = randomToken();
  await env.DB.prepare("INSERT INTO teams (id, session_id, name, token, created_at) VALUES (?,?,?,?,?)")
    .bind(crypto.randomUUID(), session.id, name, token, Date.now()).run();
  return json({ token, team: name });
}

// Mitlesegerät anmelden: jedes Gerät bekommt einen eigenen Schlüssel, höchstens RULES.maxViewers pro Team
async function mitlesen(request, env) {
  const b = await body(request);
  const code = String(b.code || "");
  const team = code && (await env.DB.prepare("SELECT * FROM teams WHERE view_token=?").bind(code).first());
  if (!team) return fail("Dieser Mitlese-Link ist ungültig. Bitte den QR-Code am Teamgerät neu scannen.", 404);
  const session = await loadSession(env, team.session_id);
  if (!session || session.status === "finished") return fail("Diese Spielrunde ist bereits beendet.", 410);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM viewers WHERE team_id=?").bind(team.id).first();
  if (n.n >= RULES.maxViewers) return fail(`Euer Team „${team.name}“ hat schon ${RULES.maxViewers} Mitlesegeräte – mehr geht pro Team nicht.`, 403);
  const token = randomToken(16);
  await env.DB.prepare("INSERT INTO viewers (token, team_id, created_at) VALUES (?,?,?)").bind(token, team.id, Date.now()).run();
  return json({ token, team: team.name });
}

async function teamState({ env, team, session, viewer }) {
  // Link für Mitlesegeräte: wird beim ersten Abruf des Teamgeräts erzeugt
  if (!viewer && !team.view_token) {
    team.view_token = randomToken(16);
    await env.DB.prepare("UPDATE teams SET view_token=? WHERE id=?").bind(team.view_token, team.id).run();
  }
  const c = CASES[session.case_id];
  const v = buildVars(session);
  const rank = await ranking(env, session);
  const stage = stageOf(session, team);
  const premium = isPremium(session);
  const label = (q) => { const i = [...c.QUESTIONS, ...c.QUESTIONS2].findIndex((x) => x.key === q); return q === "pin" ? "Finale" : `Frage ${i + 1}`; };
  // Automatische Funksprüche: nur für die Stufe, in der das Team gerade steckt, und nur wenn ihr Zeitpunkt erreicht ist
  const now = Date.now();
  let hints = [], nextHint = null;
  if (session.started_at && session.status === "running" && stage < 4) {
    for (const h of hintTimes(session)) {
      if (h.stage !== stage) continue;
      if (h.time <= now) hints.push({ q: h.q, label: label(h.q), level: h.level, time: h.time, text: render(c.TIPS[h.q][h.level - 1], v) });
      else if (!nextHint || h.time < nextHint.time) nextHint = { time: h.time, label: label(h.q) };
    }
    hints.sort((a, b) => b.time - a.time);
  }
  let last = null;
  try { last = team.last_result ? JSON.parse(team.last_result) : null; } catch {}
  const offset = stage === 2 ? c.QUESTIONS.length : stage === 3 ? c.QUESTIONS.length + c.QUESTIONS2.length : 0;
  return json({
    team: team.name,
    viewer: !!viewer,
    view_token: viewer ? null : team.view_token,
    viewers: viewer ? null : (await env.DB.prepare("SELECT COUNT(*) AS n FROM viewers WHERE team_id=?").bind(team.id).first()).n,
    max_viewers: RULES.maxViewers,
    firma: v.FIRMA,
    fall: c.META.title,
    intro: c.META.intro ? render(c.META.intro, v) : "",
    opfer: String(JSON.parse(session.vars).OPFER || ""),
    boss: String(JSON.parse(session.vars).BOSS || ""),
    ueberfuehrt: team.core_at ? c.names(JSON.parse(session.secrets), JSON.parse(session.vars)).taeter : null,
    status: session.status,
    test: !!session.test_mode,
    now: Date.now(),
    started_at: session.started_at,
    duration_min: session.duration_min,
    hard_end: session.started_at ? hardEnd(session) : null,
    premium,
    tier: tierOf(session),
    tier_name: TIER_NAMES[tierOf(session)],
    plus: isPlus(session),
    stage,
    questions: stageQuestions(session, stage < 4 ? stage : 1).map((q, i) => ({ key: q.key, nr: offset + i + 1, label: render(q.label, v), hint: q.hint })),
    questions_act1: c.QUESTIONS.map((q) => render(q.label, v)),
    core_ok: !!team.core_at,
    solved: !!team.solved_at,
    solved_at: team.solved_at,
    score_ms: teamScore(session, team),
    penalty_min: team.penalty_min,
    wrong: team.wrong,
    last_attempt_at: team.last_attempt_at,
    check_available: stage < 3 && team.wrong >= RULES.checkAfterWrong && !!last && last.stage === stage,
    hints,
    next_hint: nextHint,
    rules: { wrong: RULES.wrongPenaltyMin, check: RULES.checkPenaltyMin, checkAfter: RULES.checkAfterWrong, gap: RULES.minSecondsBetween },
    // Rangliste nur vor Spielbeginn (nur Namen) und nach Spielende – während des Spiels weiß niemand, wie weit die anderen sind
    ranking: session.status === "finished" ? rank : session.status === "running" ? [] : rank.map((r) => ({ name: r.name })),
    // Nach Spielende bekommen alle Teams die Auflösung (erst dann, damit niemand vorher spickt)
    aufloesung: session.status === "finished" ? solutionInfo(session) : null,
  });
}

async function akte({ team, session, viewer }) {
  const c = CASES[session.case_id];
  const v = buildVars(session);
  const act2 = isPremium(session) && !!team.core_at;
  const act3 = isPlus(session) && !!team.act2_at;
  const docs = [...c.DOCS.filter((d) => !d.premiumOnly || isPremium(session)).map((d) => ({ ...d, act: 1 })),
    ...(act2 ? c.DOCS2.map((d) => ({ ...d, act: 2 })) : []), ...(act3 && c.DOCS3 ? c.DOCS3.map((d) => ({ ...d, act: 3 })) : [])];
  return json({
    watermark: `${JSON.parse(session.vars).FIRMA} · Team ${team.name}${viewer ? " · Mitlesegerät" : ""} · vertraulich`, // Klartext, der Browser escaped
    docs: docs.map((d) => ({ id: d.id, act: d.act, title: render(d.title, v), kind: d.kind, html: render(d.html, v) })),
  });
}

async function firma({ session }) {
  const c = CASES[session.case_id];
  const v = buildVars(session);
  const w = c.FIRMA_WEB;
  const firmaRaw = String(JSON.parse(session.vars).FIRMA || ""); // Klartext, der Browser escaped
  const slug = firmaRaw.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/\b(gmbh|ag|kg|og|e\.?u\.?|co)\b/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "firma";
  return json({ name: firmaRaw, logo: session.logo || null, domain: `intranet.${slug}.at`, intranet: !!w.intranet, login_label: w.login.label || "Login",
    pages: [...w.pages.map((p) => ({ id: p.id, title: p.title, html: (p.id === "news" && isPlus(session) && c.ARIA ? c.ARIA.news : "") + render(p.html, v) })),
      ...(isPlus(session) && c.ARIA ? [{ id: "aria", title: "ARIA", aria: true, html: "" }] : [])] });
}

function partnerPassword(session) {
  const x = JSON.parse(session.secrets);
  return `${x.HUND || "Bruno"}${x.JAHR || x.GRUENDUNG || "2011"}`.toLowerCase();
}
async function firmaLogin({ request, session }) {
  const c = CASES[session.case_id];
  const b = await body(request);
  const ok = String(b.user || "").trim().toLowerCase() === c.FIRMA_WEB.login.user &&
    String(b.password || "").trim().toLowerCase().replace(/\s+/g, "") === partnerPassword(session);
  if (!ok) return fail("Benutzername oder Passwort falsch.", 403);
  return json({ html: render(c.FIRMA_WEB.partner, buildVars(session)) });
}

async function loesung({ request, env, team, session }) {
  const stage = stageOf(session, team);
  if (stage === 4) return json({ solved: true });
  const now = Date.now();
  if (team.last_attempt_at && now - team.last_attempt_at < RULES.minSecondsBetween * 1000) {
    const wait = Math.ceil((RULES.minSecondsBetween * 1000 - (now - team.last_attempt_at)) / 1000);
    return fail(`Kurz durchatmen: nächster Versuch in ${wait} Sekunden.`, 429);
  }
  const b = await body(request);
  const qs = stageQuestions(session, stage);
  const result = checkAnswers(session, b, qs);
  const allOk = Object.values(result).every(Boolean);
  const payload = Object.fromEntries(qs.map((q) => [q.key, String(b[q.key] ?? "").slice(0, 60)]));
  await env.DB.prepare("INSERT INTO attempts (team_id, at, payload, correct) VALUES (?,?,?,?)")
    .bind(team.id, now, JSON.stringify({ stage, ...payload }), allOk ? 1 : 0).run();
  if (!allOk) {
    await env.DB.prepare("UPDATE teams SET wrong=wrong+1, penalty_min=penalty_min+?, last_attempt_at=?, last_result=? WHERE id=?")
      .bind(RULES.wrongPenaltyMin, now, JSON.stringify({ stage, result }), team.id).run();
    return json({ correct: false, penalty_min: RULES.wrongPenaltyMin });
  }
  const premium = isPremium(session);
  if (stage === 1) {
    await env.DB.prepare("UPDATE teams SET core_at=?, solved_at=?, last_attempt_at=?, last_result=NULL WHERE id=?")
      .bind(now, premium ? null : now, now, team.id).run();
    if (!premium) await finishIfAllSolved(env, session, now);
    return json({ correct: true, solved: !premium, next: premium ? "akt2" : null });
  }
  if (stage === 2) {
    const plus = isPlus(session);
    await env.DB.prepare("UPDATE teams SET act2_at=?, solved_at=?, last_attempt_at=?, last_result=NULL WHERE id=?").bind(now, plus ? null : now, now, team.id).run();
    if (!plus) await finishIfAllSolved(env, session, now);
    return json({ correct: true, solved: !plus, next: plus ? "finale" : null });
  }
  await env.DB.prepare("UPDATE teams SET solved_at=?, last_attempt_at=?, last_result=NULL WHERE id=?").bind(now, now, team.id).run();
  await finishIfAllSolved(env, session, now);
  return json({ correct: true, solved: true });
}

// ---------- ARIA: KI-Assistenz im Intranet (nur Premium Plus, erst im Finale) ----------
const ARIA_LIMITS = { maxMsgs: 100, maxChars: 300, gapMs: 3000, history: 16 };
const ariaX = (session) => ({ ...JSON.parse(session.vars), ...JSON.parse(session.secrets) });

async function ariaMsgs(env, team) {
  const { results } = await env.DB.prepare("SELECT role, text, at FROM aria_msgs WHERE team_id=? ORDER BY id LIMIT 300").bind(team.id).all();
  return results;
}
async function ariaGet({ env, team, session }) {
  const c = CASES[session.case_id];
  if (!isPlus(session) || !c.ARIA) return fail("ARIA gibt es nur im Paket Premium Plus.", 404);
  const live = stageOf(session, team) >= 3;
  const msgs = live ? await ariaMsgs(env, team) : [];
  return json({
    live, msgs,
    used: msgs.filter((m) => m.role === "user").length, max: ARIA_LIMITS.maxMsgs, max_chars: ARIA_LIMITS.maxChars,
    unlocked: !!team.aria_unlocked_at, note: team.aria_unlocked_at ? c.ARIA.note(ariaX(session)) : null,
  });
}
// Zeitsperre gegen Dauerfeuer (gilt für das ganze Team, alle Geräte)
async function ariaGate(env, team) {
  const now = Date.now();
  const r = await env.DB.prepare("UPDATE teams SET aria_last_at=? WHERE id=? AND (aria_last_at IS NULL OR aria_last_at < ?)").bind(now, team.id, now - ARIA_LIMITS.gapMs).run();
  return !!r.meta?.changes;
}
async function ariaChat({ request, env, team, session }) {
  const c = CASES[session.case_id];
  if (!isPlus(session) || !c.ARIA || stageOf(session, team) < 3) return fail("ARIA ist noch nicht freigeschaltet.", 403);
  const b = await body(request);
  const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, ARIA_LIMITS.maxChars);
  if (!text) return fail("Bitte eine Frage eingeben.");
  const used = (await env.DB.prepare("SELECT COUNT(*) AS n FROM aria_msgs WHERE team_id=? AND role='user'").bind(team.id).first()).n;
  if (used >= ARIA_LIMITS.maxMsgs) return fail("ARIA braucht eine Pause: Euer Team hat alle Nachrichten verbraucht. Die Hinweise der Zentrale kommen trotzdem.", 429);
  if (!(await ariaGate(env, team))) return fail("ARIA tippt noch … einen Moment.", 429);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO aria_msgs (team_id, at, role, text) VALUES (?,?,?,?)").bind(team.id, now, "user", text).run();
  const x = ariaX(session);
  let reply;
  try {
    if (!env.ANTHROPIC_API_KEY) throw new Error("kein Schlüssel");
    const hist = (await ariaMsgs(env, team)).filter((m) => m.role === "user" || m.role === "assistant").slice(-ARIA_LIMITS.history);
    const messages = [];
    for (const m of hist) {
      const last = messages[messages.length - 1];
      if (last && last.role === m.role) last.content += "\n" + m.text; else messages.push({ role: m.role, content: m.text });
    }
    while (messages.length && messages[0].role !== "user") messages.shift();
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: env.ARIA_MODEL || "claude-haiku-4-5-20251001", max_tokens: 300, temperature: 0.6,
        system: [{ type: "text", text: c.ARIA.system(x), cache_control: { type: "ephemeral" } }],
        messages,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || String(r.status));
    reply = (d.content || []).filter((p) => p.type === "text").map((p) => p.text).join("").trim().slice(0, 1200);
    if (!reply) throw new Error("leer");
  } catch (e) {
    reply = c.ARIA.fallback(x);
  }
  await env.DB.prepare("INSERT INTO aria_msgs (team_id, at, role, text) VALUES (?,?,?,?)").bind(team.id, Date.now(), "assistant", reply).run();
  return json({ ok: true });
}
async function ariaKennwort({ request, env, team, session }) {
  const c = CASES[session.case_id];
  if (!isPlus(session) || !c.ARIA || stageOf(session, team) < 3) return fail("ARIA ist noch nicht freigeschaltet.", 403);
  const x = ariaX(session);
  if (team.aria_unlocked_at) return json({ ok: true, note: c.ARIA.note(x) });
  const b = await body(request);
  const pw = String(b.kennwort || "").trim().slice(0, 60);
  if (!pw) return fail("Bitte ein Kennwort eingeben.");
  if (!(await ariaGate(env, team))) return fail("Einen Moment – nächster Versuch in ein paar Sekunden.", 429);
  const ok = c.ARIA.checkPassword(pw, x);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO aria_msgs (team_id, at, role, text) VALUES (?,?,?,?)").bind(team.id, now, "event", ok ? `🔓 Kennwort „${pw}“ – Notiz geöffnet` : `🔒 Kennwort „${pw}“ – falsch`).run();
  if (!ok) return json({ ok: false });
  await env.DB.prepare("UPDATE teams SET aria_unlocked_at=? WHERE id=?").bind(now, team.id).run();
  return json({ ok: true, note: c.ARIA.note(x) });
}

// Nur in Testrunden: Spielzeit vorspulen (bis zum nächsten Hinweis der aktuellen Stufe oder um x Minuten)
async function vorspulen({ request, env, team, session }) {
  if (!session.test_mode) return fail("Vorspulen gibt es nur in Testrunden.", 403);
  const b = await body(request);
  const now = Date.now();
  const stage = stageOf(session, team);
  let shift = Math.min(60, Math.max(1, Number(b.minuten) || 5)) * 60000;
  if (b.bis === "hinweis") {
    const next = hintTimes(session).filter((h) => h.stage === stage && h.time > now).sort((a, c) => a.time - c.time)[0];
    if (!next) return fail("In dieser Stufe kommt kein weiterer Hinweis mehr.");
    shift = next.time - now + 1000;
  }
  await env.DB.prepare("UPDATE sessions SET started_at=started_at-? WHERE id=?").bind(shift, session.id).run();
  return json({ ok: true, minuten: Math.round(shift / 60000) });
}

async function kontrolle({ env, team, session }) {
  const stage = stageOf(session, team);
  if (stage >= 3) return fail("Für diese Stufe gibt es keinen Kontrolltipp.");
  if (team.wrong < RULES.checkAfterWrong) return fail(`Den Kontrolltipp gibt es erst nach ${RULES.checkAfterWrong} Fehlversuchen.`);
  let last = null;
  try { last = JSON.parse(team.last_result || "null"); } catch {}
  if (!last || last.stage !== stage) return fail("Gebt zuerst einen Lösungsversuch für diese Stufe ab.");
  await env.DB.prepare("UPDATE teams SET penalty_min=penalty_min+? WHERE id=?").bind(RULES.checkPenaltyMin, team.id).run();
  return json({ result: last.result, penalty_min: RULES.checkPenaltyMin });
}

// ---------- Organisator ----------
async function leitungLogin(request, env) {
  const b = await body(request);
  const code = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const s0 = code && (await env.DB.prepare("SELECT * FROM sessions WHERE org_code=?").bind(code).first());
  const s = s0 && (await loadSession(env, s0.id));
  if (!s) return fail("Organisator-Code unbekannt.", 404);
  let token = s.org_token;
  if (!token) {
    token = randomToken();
    await env.DB.prepare("UPDATE sessions SET org_token=? WHERE id=?").bind(token, s.id).run();
  }
  return json({ token });
}

function mayOpen(session) {
  return !!session.test_mode || viennaDate() === session.event_date;
}

async function leitungState({ env, session }) {
  const c = CASES[session.case_id];
  const v = buildVars(session);
  const rank = await ranking(env, session);
  return json({
    fall: c.META.title,
    firma: v.FIRMA,
    status: session.status,
    event_date: session.event_date,
    may_open: mayOpen(session),
    join_code: session.join_code,
    duration_min: session.duration_min,
    premium: isPremium(session),
    tier: tierOf(session),
    tier_name: TIER_NAMES[tierOf(session)],
    max_teams: session.max_teams || RULES.maxTeams,
    now: Date.now(),
    started_at: session.started_at,
    hard_end: session.started_at ? hardEnd(session) : null,
    solution_available: session.status === "finished" ||
      (session.status === "running" && Date.now() - session.started_at >= RULES.solutionAfterMin * 60000),
    ranking: rank,
  });
}

async function leitungAktion({ request, env, session }) {
  const b = await body(request);
  const now = Date.now();
  if (b.aktion === "oeffnen") {
    if (session.status !== "created") return fail("Der Fall ist bereits geöffnet.");
    if (!mayOpen(session)) return fail(`Der Fall kann nur am Spieltag (${session.event_date}) geöffnet werden.`, 403);
    await env.DB.prepare("UPDATE sessions SET status='open', opened_at=? WHERE id=?").bind(now, session.id).run();
    return json({ ok: true });
  }
  if (b.aktion === "starten") {
    if (session.status !== "open") return fail("Zuerst den Fall öffnen, damit sich die Teams anmelden können.");
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM teams WHERE session_id=?").bind(session.id).first();
    if (!n.n) return fail("Es hat sich noch kein Team angemeldet.");
    await env.DB.prepare("UPDATE sessions SET status='running', started_at=? WHERE id=?").bind(now, session.id).run();
    return json({ ok: true });
  }
  if (b.aktion === "beenden") {
    if (session.status !== "running") return fail("Die Runde läuft nicht.");
    await env.DB.prepare("UPDATE sessions SET status='finished', ended_at=? WHERE id=?").bind(now, session.id).run();
    await recordStats(env, { ...session, status: "finished", ended_at: now });
    return json({ ok: true });
  }
  return fail("Unbekannte Aktion.");
}

function solutionInfo(session) {
  const c = CASES[session.case_id];
  const secrets = JSON.parse(session.secrets);
  const input = JSON.parse(session.vars);
  const sol = c.solution(secrets, input);
  const who = c.names(secrets, input); // Klarnamen, der Browser escaped
  const v = buildVars(session);
  const premium = isPremium(session), plus = isPlus(session);
  const qs = [...c.QUESTIONS, ...(premium ? c.QUESTIONS2 : []), ...(plus ? c.QUESTIONS3 || [] : [])];
  return {
    premium,
    plus,
    tier: tierOf(session),
    taeter: who.taeter,
    answers: qs.map((q) => ({ key: q.key, label: render(q.label, v), answer: sol[q.key],
      detail: q.key === "wer" ? who.taeter : q.key === "pin" ? `Kennwort der Notiz bei ARIA: ${v.ROOM_NEU}` : "" })),
    story: render(c.META.story, v),
    story2: premium ? render(c.META.story2, v) : null,
    story3: plus && c.META.story3 ? render(c.META.story3, v) : null,
  };
}

async function aufloesung({ session }) {
  const ok = session.status === "finished" ||
    (session.status === "running" && Date.now() - session.started_at >= RULES.solutionAfterMin * 60000);
  if (!ok) return fail(`Die Auflösung gibt es frühestens ${RULES.solutionAfterMin} Minuten nach dem Start.`, 403);
  return json(solutionInfo(session));
}

// ---------- Admin ----------
function adminMeta() {
  const c = CASES["fall-001"];
  return json({
    cases: [{ id: "fall-001", title: c.META.title }],
    tiers: TIER_NAMES,
    fields: c.FIELDS.map(([key, label, example, type]) => ({ key, label, example, type: type || "text" })),
  });
}
async function adminList(env) {
  const { results } = await env.DB.prepare(
    "SELECT s.id, s.label, s.case_id, s.event_date, s.status, s.join_code, s.org_code, s.test_mode, s.premium, s.created_at, (SELECT COUNT(*) FROM teams t WHERE t.session_id=s.id) AS teams FROM sessions s ORDER BY s.created_at DESC"
  ).all();
  for (const s of results) if (expired(s)) await purgeSession(env, s.id);
  return json({ sessions: results.filter((s) => !expired(s)) });
}
async function adminCreate(request, env) {
  const b = await body(request);
  try {
    return json(await createGameSession(env, { ...b, allowExamples: true }));
  } catch (e) {
    if (e instanceof InputError) return fail(e.message);
    throw e;
  }
}
async function adminOrders(env) {
  const { results } = await env.DB.prepare(
    "SELECT o.id, o.created_at, o.status, o.paket, o.teams, o.amount_cents, o.event_date, o.contact, o.paid_at, o.shipped_at, json_extract(o.vars,'$.FIRMA') AS firma, s.join_code, s.org_code FROM orders o LEFT JOIN sessions s ON s.id=o.session_id ORDER BY o.created_at DESC LIMIT 200"
  ).all();
  return json({ orders: results.map((o) => ({ ...o, contact: JSON.parse(o.contact || "{}") })) });
}
// Statistik: Zeiten je Paket (Median und Quartile), Lösungsquote, Fehlversuche je Frage
async function adminStats(request, env) {
  const tests = new URL(request.url).searchParams.get("tests") === "1";
  const { results } = await env.DB.prepare(`SELECT * FROM stats_teams ${tests ? "" : "WHERE test_mode=0"} ORDER BY recorded_at DESC LIMIT 5000`).all();
  const q = (arr, p) => { const a = arr.filter((x) => x != null).sort((x, y) => x - y); if (!a.length) return null; const i = (a.length - 1) * p; const lo = Math.floor(i); return Math.round((a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo)) * 10) / 10; };
  const groups = {};
  for (const r of results) (groups[["basis", "premium", "plus"][r.premium] || "basis"] ||= []).push(r);
  const out = {};
  for (const [k, rows] of Object.entries(groups)) {
    const prem = k !== "basis";
    const wrong = {};
    for (const r of rows) { let w = {}; try { w = JSON.parse(r.wrong_by_q || "{}"); } catch {} for (const [kk, n] of Object.entries(w)) wrong[kk] = (wrong[kk] || 0) + n; }
    const stat = (arr) => ({ p25: q(arr, 0.25), median: q(arr, 0.5), p75: q(arr, 0.75), n: arr.filter((x) => x != null).length });
    out[k] = {
      teams: rows.length, runden: new Set(rows.map((r) => r.session_id)).size,
      akt1_geloest: rows.filter((r) => r.core_min != null).length,
      ganz_geloest: rows.filter((r) => r.solved_min != null).length,
      akt1_min: stat(rows.map((r) => r.core_min)),
      akt2_min: prem ? stat(rows.map((r) => (r.act2_min != null && r.core_min != null ? r.act2_min - r.core_min : null))) : null,
      finale_min: k === "plus" ? stat(rows.map((r) => (r.solved_min != null && r.act2_min != null ? r.solved_min - r.act2_min : null))) : null,
      gesamt_min: stat(rows.map((r) => r.solved_min)),
      fehler_je_team: Object.fromEntries(Object.entries(wrong).map(([kk, n]) => [kk, Math.round((n / rows.length) * 100) / 100])),
      hinweise_akt1: stat(rows.map((r) => r.hints_akt1)),
      mitlesegeraete: stat(rows.map((r) => r.viewers)),
    };
  }
  return json({ tests, stats: out });
}
async function adminShipped(request, env) {
  const b = await body(request);
  if (!b.id) return fail("id fehlt.");
  await env.DB.prepare("UPDATE orders SET shipped_at=? WHERE id=?").bind(b.undo ? null : Date.now(), b.id).run();
  return json({ ok: true });
}
async function adminDelete(request, env) {
  const b = await body(request);
  if (!b.id) return fail("id fehlt.");
  await purgeSession(env, b.id);
  return json({ ok: true });
}
