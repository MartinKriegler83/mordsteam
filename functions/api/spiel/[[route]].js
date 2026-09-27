// Cloudflare Pages Function: /api/spiel/*
// Benötigt: D1-Binding "DB" und die geheime Umgebungsvariable "ADMIN_KEY".
import {
  CASES, RULES, json, fail, randInt, randomToken, randomCode, esc, viennaDate,
  buildVars, render, checkAnswers, hardEnd, refreshStatus, expired, purgeSession, ranking, teamScore,
} from "../../../lib/game.js";

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  if (!env.DB) return fail("Datenbank nicht eingerichtet (D1-Binding DB fehlt).", 500);
  const route = (params.route || []).join("/");
  const method = request.method;
  try {
    // --- Teams ---
    if (route === "join" && method === "POST") return join(request, env);
    if (route === "state" && method === "GET") return withTeam(request, env, teamState);
    if (route === "akte" && method === "GET") return withTeam(request, env, akte, true);
    if (route === "firma" && method === "GET") return withTeam(request, env, firma, true);
    if (route === "firma/login" && method === "POST") return withTeam(request, env, firmaLogin, true);
    if (route === "loesung" && method === "POST") return withTeam(request, env, loesung, true);
    if (route === "tipp" && method === "POST") return withTeam(request, env, tipp, true);
    if (route === "kontrolle" && method === "POST") return withTeam(request, env, kontrolle, true);
    // --- Organisator ---
    if (route === "leitung/login" && method === "POST") return leitungLogin(request, env);
    if (route === "leitung/state" && method === "GET") return withOrg(request, env, leitungState);
    if (route === "leitung/aktion" && method === "POST") return withOrg(request, env, leitungAktion);
    if (route === "leitung/aufloesung" && method === "GET") return withOrg(request, env, aufloesung);
    // --- Admin (Mordsteam) ---
    if (route.startsWith("admin/")) {
      if (!env.ADMIN_KEY || request.headers.get("x-admin") !== env.ADMIN_KEY) return fail("Nicht berechtigt.", 401);
      if (route === "admin/meta" && method === "GET") return adminMeta();
      if (route === "admin/sessions" && method === "GET") return adminList(env);
      if (route === "admin/session" && method === "POST") return adminCreate(request, env);
      if (route === "admin/delete" && method === "POST") return adminDelete(request, env);
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
async function withTeam(request, env, fn, needsRunning = false) {
  const token = request.headers.get("x-team") || "";
  const team = token && (await env.DB.prepare("SELECT * FROM teams WHERE token=?").bind(token).first());
  if (!team) return fail("Team unbekannt. Bitte neu anmelden.", 401);
  const session = await loadSession(env, team.session_id);
  if (!session) return fail("Diese Spielrunde existiert nicht mehr.", 410);
  if (needsRunning && session.status !== "running") return fail("Der Fall ist gerade nicht geöffnet.", 403);
  return fn({ request, env, team, session });
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
  if (count.n >= RULES.maxTeams) return fail("Maximale Anzahl an Teams erreicht.", 403);
  const exists = await env.DB.prepare("SELECT id FROM teams WHERE session_id=? AND name=?").bind(session.id, name).first();
  if (exists) return fail("Diesen Teamnamen gibt es schon. Bitte einen anderen wählen.", 409);
  const token = randomToken();
  await env.DB.prepare("INSERT INTO teams (id, session_id, name, token, created_at) VALUES (?,?,?,?,?)")
    .bind(crypto.randomUUID(), session.id, name, token, Date.now()).run();
  return json({ token, team: name });
}

async function teamState({ env, team, session }) {
  const c = CASES[session.case_id];
  const v = buildVars(session);
  const rank = await ranking(env, session);
  const tips = JSON.parse(team.tips || "[]");
  const tipTexts = tips.map((t) => ({ ...t, text: render(c.TIPS[t.q][t.level - 1], v) }));
  return json({
    team: team.name,
    firma: v.FIRMA,
    fall: c.META.title,
    status: session.status,
    now: Date.now(),
    started_at: session.started_at,
    duration_min: session.duration_min,
    hard_end: session.started_at ? hardEnd(session) : null,
    premium: !!session.premium && !!session.premium_answer,
    questions: c.QUESTIONS.map((q) => ({ key: q.key, label: render(q.label, v), hint: q.hint })),
    core_ok: !!team.core_at,
    solved: !!team.solved_at,
    solved_at: team.solved_at,
    score_ms: teamScore(session, team),
    penalty_min: team.penalty_min,
    wrong: team.wrong,
    last_attempt_at: team.last_attempt_at,
    check_available: team.wrong >= RULES.checkAfterWrong && !team.core_at,
    tips: tipTexts,
    rules: { wrong: RULES.wrongPenaltyMin, tips: RULES.tipPenaltyMin, check: RULES.checkPenaltyMin, gap: RULES.minSecondsBetween },
    ranking: rank,
  });
}

async function akte({ team, session }) {
  const c = CASES[session.case_id];
  const v = buildVars(session);
  return json({
    watermark: `${JSON.parse(session.vars).FIRMA} · Team ${team.name} · vertraulich`, // Klartext, der Browser escaped
    docs: c.DOCS.map((d) => ({ id: d.id, title: render(d.title, v), kind: d.kind, html: render(d.html, v) })),
  });
}

async function firma({ session }) {
  const c = CASES[session.case_id];
  const v = buildVars(session);
  const w = c.FIRMA_WEB;
  return json({ name: w.name, claim: w.claim, pages: w.pages.map((p) => ({ id: p.id, title: p.title, html: render(p.html, v) })) });
}

async function firmaLogin({ request, session }) {
  const c = CASES[session.case_id];
  const b = await body(request);
  const ok = String(b.user || "").trim().toLowerCase() === c.FIRMA_WEB.login.user &&
    String(b.password || "").trim().toLowerCase().replace(/\s+/g, "") === c.FIRMA_WEB.login.password;
  if (!ok) return fail("Benutzername oder Passwort falsch.", 403);
  return json({ html: render(c.FIRMA_WEB.partner, buildVars(session)) });
}

async function loesung({ request, env, team, session }) {
  if (team.solved_at) return json({ solved: true });
  const now = Date.now();
  if (team.last_attempt_at && now - team.last_attempt_at < RULES.minSecondsBetween * 1000) {
    const wait = Math.ceil((RULES.minSecondsBetween * 1000 - (now - team.last_attempt_at)) / 1000);
    return fail(`Kurz durchatmen: nächster Versuch in ${wait} Sekunden.`, 429);
  }
  const b = await body(request);
  const premium = !!session.premium && !!session.premium_answer;

  // Stufe 2 (Premium): nur noch die Karte
  if (team.core_at && premium) {
    const ok = String(b.karte || "").trim().toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g, "") ===
      String(session.premium_answer).trim().toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g, "");
    await env.DB.prepare("INSERT INTO attempts (team_id, at, payload, correct) VALUES (?,?,?,?)")
      .bind(team.id, now, JSON.stringify({ karte: b.karte }), ok ? 1 : 0).run();
    if (ok) {
      await env.DB.prepare("UPDATE teams SET solved_at=?, last_attempt_at=? WHERE id=?").bind(now, now, team.id).run();
      return json({ correct: true, solved: true });
    }
    await env.DB.prepare("UPDATE teams SET wrong=wrong+1, penalty_min=penalty_min+?, last_attempt_at=? WHERE id=?")
      .bind(RULES.wrongPenaltyMin, now, team.id).run();
    return json({ correct: false, penalty_min: RULES.wrongPenaltyMin });
  }

  const result = checkAnswers(session, b);
  const allOk = Object.values(result).every(Boolean);
  await env.DB.prepare("INSERT INTO attempts (team_id, at, payload, correct) VALUES (?,?,?,?)")
    .bind(team.id, now, JSON.stringify({ wer: b.wer, wann: b.wann, warum: b.warum, wo: b.wo }), allOk ? 1 : 0).run();
  if (allOk) {
    const solvedAt = premium ? null : now;
    await env.DB.prepare("UPDATE teams SET core_at=?, solved_at=?, last_attempt_at=?, last_result=? WHERE id=?")
      .bind(now, solvedAt, now, JSON.stringify(result), team.id).run();
    return json({ correct: true, solved: !premium, next: premium ? "karte" : null });
  }
  await env.DB.prepare("UPDATE teams SET wrong=wrong+1, penalty_min=penalty_min+?, last_attempt_at=?, last_result=? WHERE id=?")
    .bind(RULES.wrongPenaltyMin, now, JSON.stringify(result), team.id).run();
  return json({ correct: false, penalty_min: RULES.wrongPenaltyMin });
}

async function tipp({ request, env, team, session }) {
  const c = CASES[session.case_id];
  const b = await body(request);
  const q = String(b.q || "");
  const level = Number(b.level);
  if (!c.TIPS[q] || ![1, 2].includes(level)) return fail("Unbekannter Tipp.");
  const tips = JSON.parse(team.tips || "[]");
  if (tips.some((t) => t.q === q && t.level === level)) return fail("Diesen Tipp habt ihr schon.");
  if (level === 2 && !tips.some((t) => t.q === q && t.level === 1)) return fail("Zuerst Tipp 1 öffnen.");
  const pen = RULES.tipPenaltyMin[level - 1];
  tips.push({ q, level, at: Date.now(), penalty: pen });
  await env.DB.prepare("UPDATE teams SET tips=?, penalty_min=penalty_min+? WHERE id=?").bind(JSON.stringify(tips), pen, team.id).run();
  return json({ text: render(c.TIPS[q][level - 1], buildVars(session)), penalty_min: pen });
}

async function kontrolle({ env, team }) {
  if (team.core_at) return fail("Die vier Fragen sind bereits gelöst.");
  if (team.wrong < RULES.checkAfterWrong) return fail(`Der Kontrolltipp gibt es erst nach ${RULES.checkAfterWrong} Fehlversuchen.`);
  if (!team.last_result) return fail("Noch kein Versuch vorhanden.");
  await env.DB.prepare("UPDATE teams SET penalty_min=penalty_min+? WHERE id=?").bind(RULES.checkPenaltyMin, team.id).run();
  return json({ result: JSON.parse(team.last_result), penalty_min: RULES.checkPenaltyMin });
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
    premium: !!session.premium,
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
    return json({ ok: true });
  }
  return fail("Unbekannte Aktion.");
}

async function aufloesung({ session }) {
  const ok = session.status === "finished" ||
    (session.status === "running" && Date.now() - session.started_at >= RULES.solutionAfterMin * 60000);
  if (!ok) return fail(`Die Auflösung gibt es frühestens ${RULES.solutionAfterMin} Minuten nach dem Start.`, 403);
  const c = CASES[session.case_id];
  const sol = c.solution(JSON.parse(session.secrets));
  const v = buildVars(session);
  return json({
    answers: c.QUESTIONS.map((q) => ({ label: render(q.label, v), answer: sol[q.key] })),
    premium_answer: session.premium ? session.premium_answer : null,
    story: render(
      "Sabine Kral hat Wissen über Projekt Phoenix an Veridian Systems verkauft. Als Dr. Reiher das Leck aufdeckte und {DG_AKK} als Beweis bei sich trug, holte Kral um {TATZEIT} mit Gästekarte {GASTKARTE} seinen Pfefferminztee ab und tropfte Herztropfen hinein. Um 22:47 betrat sie den {RAUM_TATORT}, nahm {DG_AKK} und Reihers Autoschlüssel an sich und versteckte die Beute in Reihers eigenem Wagen auf Stellplatz {STELLPLATZ} – dort sucht niemand. Das Veridian-Geld floss auf ihr Konto mit der Endung {KONTO}. Um 11:30 wollte sie die Beute holen, um 12:00 übergeben.",
      v),
  });
}

// ---------- Admin ----------
function adminMeta() {
  const c = CASES["fall-001"];
  return json({
    cases: [{ id: "fall-001", title: c.META.title }],
    fields: c.FIELDS.map(([key, label, example]) => ({ key, label, example })),
    diebesgut: Object.entries(c.DIEBESGUT).map(([key, d]) => ({ key, label: d.label })),
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
  const c = CASES[b.case_id || "fall-001"];
  if (!c) return fail("Unbekannter Fall.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.event_date || ""))) return fail("Spieltag im Format JJJJ-MM-TT angeben.");
  const vars = { DIEBESGUT: c.DIEBESGUT[b.vars?.DIEBESGUT] ? b.vars.DIEBESGUT : "prototyp" };
  for (const [key, , example] of c.FIELDS) {
    const val = String(b.vars?.[key] ?? "").trim().slice(0, 80);
    vars[key] = val || example;
  }
  const duration = [60, 75, 90].includes(Number(b.duration_min)) ? Number(b.duration_min) : 90;
  const premiumAnswer = String(b.premium_answer || "").trim().slice(0, 40);
  const id = crypto.randomUUID();
  const joinCode = randomCode(6);
  const orgCode = randomCode(8);
  await env.DB.prepare(
    "INSERT INTO sessions (id, case_id, label, created_at, event_date, status, premium, premium_answer, duration_min, vars, secrets, join_code, org_code, test_mode) VALUES (?,?,?,?,?,'created',?,?,?,?,?,?,?,?)"
  ).bind(
    id, b.case_id || "fall-001", String(b.label || vars.FIRMA).slice(0, 80), Date.now(), b.event_date,
    b.premium ? 1 : 0, premiumAnswer || null, duration, JSON.stringify(vars), JSON.stringify(c.makeSecrets(randInt)),
    joinCode, orgCode, b.test_mode ? 1 : 0
  ).run();
  return json({ id, join_code: joinCode, org_code: orgCode });
}
async function adminDelete(request, env) {
  const b = await body(request);
  if (!b.id) return fail("id fehlt.");
  await purgeSession(env, b.id);
  return json({ ok: true });
}
