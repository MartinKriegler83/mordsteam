// Cloudflare Pages Function: /api/spiel/*
// Benötigt: D1-Binding "DB" und die geheime Umgebungsvariable "ADMIN_KEY".
import {
  CASES, caseOf, langOf, RULES, json, fail, randInt, randomToken, randomCode, esc, viennaDate,
  buildVars, render, checkAnswers, hintTimes, hardEnd, refreshStatus, finishIfAllSolved, recordStats, expired, purgeSession, ranking, teamScore,
  isPremium, isPlus, tierOf, TIER_NAMES, stageOf, stageQuestions,
} from "../../../lib/game.js";

import { migrate, createGameSession, InputError } from "../../../lib/create.js";
import { migrateFeedback, dueFeedback, runFeedbackMails } from "../../../lib/feedback.js";
import { localize, countryOf, COUNTRIES, COUNTRY_ORDER, randomCast, castToEnglish } from "../../../lib/countries.js";

// Sprache: bei Team-/Organisator-Aufrufen die Spielsprache der Runde, sonst der Header x-lang der Seite
const L = (lang, de, en) => (lang === "en" ? en : de);
const hLang = (request) => ((request.headers.get("x-lang") || "").toLowerCase() === "en" ? "en" : "de");

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
    if (route === "code" && method === "GET") return codeInfo(request, env);
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
      if (route === "admin/feedback" && method === "GET") return adminFeedback(env);
      if (route === "admin/export" && method === "GET") return adminExport(request, env);
      if (route === "admin/feedback-run" && method === "POST") { const b = await body(request); return json({ sent: await runFeedbackMails(env, new URL(request.url).origin, { force: !!b.force }) }); }
      if (route === "admin/feedback-approve" && method === "POST") { const b = await body(request); await migrateFeedback(env); await env.DB.prepare("UPDATE feedback SET approved=? WHERE id=?").bind(b.approved ? 1 : 0, String(b.id || "")).run(); return json({ ok: true }); }
    }
    return fail(L(hLang(request), "Nicht gefunden.", "Not found."), 404);
  } catch (e) {
    return fail(L(hLang(request), "Serverfehler: ", "Server error: ") + e.message, 500);
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
  const hl = hLang(request);
  if (!team) return fail(L(hl, "Team unbekannt. Bitte neu anmelden.", "Unknown team. Please join again."), 401);
  const session = await loadSession(env, team.session_id);
  if (!session) return fail(L(hl, "Diese Spielrunde existiert nicht mehr.", "This game round no longer exists."), 410);
  const lg = langOf(session);
  if (viewer && !allowViewer) return fail(L(lg, "Lösungen gibt euer Team nur am Hauptgerät ein.", "Your team enters answers on the main device only."), 403);
  if (needsRunning && session.status !== "running") return fail(L(lg, "Der Fall ist gerade nicht geöffnet.", "The case is not open right now."), 403);
  return fn({ request, env, team, session, viewer });
}
async function withOrg(request, env, fn) {
  const token = request.headers.get("x-leitung") || "";
  const session = token && (await env.DB.prepare("SELECT * FROM sessions WHERE org_token=?").bind(token).first());
  if (!session) return fail(L(hLang(request), "Bitte mit dem Organisator-Code anmelden.", "Please log in with the organiser code."), 401);
  const s = await loadSession(env, session.id);
  if (!s) return fail(L(hLang(request), "Diese Spielrunde existiert nicht mehr.", "This game round no longer exists."), 410);
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
  const s0 = await env.DB.prepare("SELECT * FROM sessions WHERE join_code=?").bind(code).first();
  const session = s0 && (await loadSession(env, s0.id));
  const lg = session ? langOf(session) : hLang(request);
  if (!session) return fail(L(lg, "Diesen Spielcode gibt es nicht.", "This game code doesn't exist."), 404);
  if (name.length < 2) return fail(L(lg, "Bitte einen Teamnamen mit mindestens 2 Zeichen eingeben.", "Please enter a team name with at least 2 characters."));
  if (session.status === "created") return fail(L(lg, "Der Fall ist noch nicht freigeschaltet. Euer Organisator öffnet ihn, sobald es losgeht.", "The case hasn't been unlocked yet. Your organiser opens it when it's time to start."), 403);
  if (session.status === "finished") return fail(L(lg, "Diese Spielrunde ist bereits beendet.", "This game round has already ended."), 403);
  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM teams WHERE session_id=?").bind(session.id).first();
  const maxTeams = session.max_teams || RULES.maxTeams;
  if (count.n >= maxTeams) return fail(L(lg, `Alle gebuchten Teams (${maxTeams}) sind bereits angemeldet. Weitere Personen können per QR-Code bei einem Team mitlesen.`, `All booked teams (${maxTeams}) have already joined. Others can follow along with a team via its QR code.`), 403);
  const exists = await env.DB.prepare("SELECT id FROM teams WHERE session_id=? AND name=?").bind(session.id, name).first();
  if (exists) return fail(L(lg, "Diesen Teamnamen gibt es schon. Bitte einen anderen wählen.", "This team name is already taken. Please choose another one."), 409);
  const token = randomToken();
  await env.DB.prepare("INSERT INTO teams (id, session_id, name, token, created_at) VALUES (?,?,?,?,?)")
    .bind(crypto.randomUUID(), session.id, name, token, Date.now()).run();
  return json({ token, team: name, lang: lg });
}

// Spielcode prüfen, ohne anzumelden: Sprache der Runde für die Anmeldeseite
async function codeInfo(request, env) {
  const code = String(new URL(request.url).searchParams.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const s = code && (await env.DB.prepare("SELECT lang FROM sessions WHERE join_code=?").bind(code).first());
  return json({ found: !!s, lang: s && s.lang === "en" ? "en" : "de" });
}

// Mitlesegerät anmelden: jedes Gerät bekommt einen eigenen Schlüssel, höchstens RULES.maxViewers pro Team
async function mitlesen(request, env) {
  const b = await body(request);
  const code = String(b.code || "");
  const team = code && (await env.DB.prepare("SELECT * FROM teams WHERE view_token=?").bind(code).first());
  const hl = hLang(request);
  if (!team) return fail(L(hl, "Dieser Mitlese-Link ist ungültig. Bitte den QR-Code am Teamgerät neu scannen.", "This follow-along link is invalid. Please scan the QR code on the team device again."), 404);
  const session = await loadSession(env, team.session_id);
  const lg = session ? langOf(session) : hl;
  if (!session || session.status === "finished") return fail(L(lg, "Diese Spielrunde ist bereits beendet.", "This game round has already ended."), 410);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM viewers WHERE team_id=?").bind(team.id).first();
  if (n.n >= RULES.maxViewers) return fail(L(lg, `Euer Team „${team.name}“ hat schon ${RULES.maxViewers} Mitlesegeräte – mehr geht pro Team nicht.`, `Your team “${team.name}” already has ${RULES.maxViewers} follow-along devices – that's the maximum per team.`), 403);
  const token = randomToken(16);
  await env.DB.prepare("INSERT INTO viewers (token, team_id, created_at) VALUES (?,?,?)").bind(token, team.id, Date.now()).run();
  return json({ token, team: team.name, lang: lg });
}

async function teamState({ env, team, session, viewer }) {
  // Link für Mitlesegeräte: wird beim ersten Abruf des Teamgeräts erzeugt
  if (!viewer && !team.view_token) {
    team.view_token = randomToken(16);
    await env.DB.prepare("UPDATE teams SET view_token=? WHERE id=?").bind(team.view_token, team.id).run();
  }
  const c = caseOf(session);
  const v = buildVars(session);
  const rank = await ranking(env, session);
  const stage = stageOf(session, team);
  const premium = isPremium(session);
  const lg = langOf(session);
  const label = (q) => { const i = [...c.QUESTIONS, ...c.QUESTIONS2].findIndex((x) => x.key === q); return q === "pin" ? "Finale" : L(lg, `Frage ${i + 1}`, `Question ${i + 1}`); };
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
    lang: lg,
    land: v.LAND,
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
  const c = caseOf(session);
  const v = buildVars(session);
  const act2 = isPremium(session) && !!team.core_at;
  const act3 = isPlus(session) && !!team.act2_at;
  const docs = [...c.DOCS.filter((d) => !d.premiumOnly || isPremium(session)).map((d) => ({ ...d, act: 1 })),
    ...(act2 ? c.DOCS2.map((d) => ({ ...d, act: 2 })) : []), ...(act3 && c.DOCS3 ? c.DOCS3.map((d) => ({ ...d, act: 3 })) : [])];
  return json({
    watermark: `${JSON.parse(session.vars).FIRMA} · Team ${team.name}${viewer ? L(langOf(session), " · Mitlesegerät", " · follow-along device") : ""} · ${L(langOf(session), "vertraulich", "confidential")}`, // Klartext, der Browser escaped
    docs: docs.map((d) => ({ id: d.id, act: d.act, title: render(d.title, v), kind: d.kind, kk: d.kk || d.kind, html: render(d.html, v) })),
  });
}

async function firma({ session }) {
  const c = caseOf(session);
  const v = buildVars(session);
  const w = c.FIRMA_WEB;
  const firmaRaw = String(JSON.parse(session.vars).FIRMA || ""); // Klartext, der Browser escaped
  const slug = firmaRaw.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/\b(gmbh|ag|kg|og|e\.?u\.?|co)\b/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "firma";
  const tld = { US: "com", XX: "com", GB: "co.uk", AU: "com.au", NZ: "co.nz" }[v.LAND] || v.LAND.toLowerCase();
  return json({ name: firmaRaw, logo: session.logo || null, domain: `intranet.${slug}.${tld}`, intranet: !!w.intranet, login_label: w.login.label || "Login",
    pages: [...w.pages.map((p) => ({ id: p.id, title: p.title, html: (p.id === "news" && isPlus(session) && c.ARIA ? c.ARIA.news : "") + render(p.html, v) })),
      ...(isPlus(session) && c.ARIA ? [{ id: "aria", title: "ARIA", aria: true, html: "" }] : [])] });
}

function partnerPassword(session) {
  const x = JSON.parse(session.secrets);
  return `${x.HUND || "Bruno"}${x.JAHR || x.GRUENDUNG || "2011"}`.toLowerCase();
}
async function firmaLogin({ request, session }) {
  const c = caseOf(session);
  const b = await body(request);
  const ok = String(b.user || "").trim().toLowerCase() === c.FIRMA_WEB.login.user &&
    String(b.password || "").trim().toLowerCase().replace(/\s+/g, "") === partnerPassword(session);
  if (!ok) return fail(L(langOf(session), "Benutzername oder Passwort falsch.", "Wrong user name or password."), 403);
  return json({ html: render(c.FIRMA_WEB.partner, buildVars(session)) });
}

async function loesung({ request, env, team, session }) {
  const stage = stageOf(session, team);
  if (stage === 4) return json({ solved: true });
  const now = Date.now();
  if (team.last_attempt_at && now - team.last_attempt_at < RULES.minSecondsBetween * 1000) {
    const wait = Math.ceil((RULES.minSecondsBetween * 1000 - (now - team.last_attempt_at)) / 1000);
    return fail(L(langOf(session), `Kurz durchatmen: nächster Versuch in ${wait} Sekunden.`, `Take a breath: next attempt in ${wait} seconds.`), 429);
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
const ariaX = (session) => {
  const x = { ...JSON.parse(session.vars), ...JSON.parse(session.secrets), LANG: langOf(session) };
  x.LAND = COUNTRY_ORDER.includes(x.LAND) ? x.LAND : "AT";
  x.HBF = localize(countryOf(x.LAND), x.LANG, x.STADT).hbf;
  return x;
};
// Datenschutz: Echte Namen (Firma, Chefin/Chef, Oberboss, Verdächtige, Feierraum) verlassen unseren Server nie.
// Vor dem Senden an die KI werden sie durch Platzhalter ersetzt, in der Antwort wieder eingesetzt.
function ariaPseudo(x) {
  const en = x.LANG === "en";
  const TK = en ? { FIRMA: "[COMPANY]", OPFER: "[BOSS]", BOSS: "[TOPBOSS]", RAUM_FEIER: "[PARTYROOM]" } : { FIRMA: "[FIRMA]", OPFER: "[CHEFIN]", BOSS: "[OBERBOSS]", RAUM_FEIER: "[FEIERRAUM]" };
  const pairs = [[x.FIRMA, TK.FIRMA], [x.OPFER, TK.OPFER], [x.BOSS, TK.BOSS], [x.RAUM_FEIER, TK.RAUM_FEIER]];
  for (let i = 1; i <= 6; i++) if (x["S" + i]) pairs.push([x["S" + i], `[PERSON${i}]`]);
  const full = pairs.filter(([real]) => real && String(real).trim().length > 1);
  // Nachnamen einzeln (nur großgeschrieben, mind. 4 Buchstaben), damit auch „Frau Lang“ ersetzt wird
  const last = full.filter(([, t]) => /CHEFIN|OBERBOSS|BOSS\]|PERSON/.test(t)).map(([real, t]) => [String(real).trim().split(/\s+/).pop(), t])
    .filter(([l]) => l.length >= 4 && /^[A-ZÄÖÜ]/.test(l));
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hide = (text) => {
    let out = String(text);
    for (const [real, t] of [...full].sort((a, b) => String(b[0]).length - String(a[0]).length)) out = out.replace(new RegExp(esc(String(real).trim()), "gi"), t);
    for (const [l, t] of last) out = out.replace(new RegExp(`(^|[^\\p{L}])${esc(l)}(?![\\p{L}])`, "gu"), `$1${t}`);
    return out;
  };
  const show = (text) => { let out = String(text); for (const [real, t] of full) out = out.split(t).join(String(real).trim()); return out.replace(/\[(?:FIRMA|CHEFIN|OBERBOSS|FEIERRAUM|COMPANY|BOSS|TOPBOSS|PARTYROOM|PERSON\d)\]/g, en ? "(unknown)" : "(unbekannt)"); };
  const xp = { ...x, FIRMA: TK.FIRMA, OPFER: TK.OPFER, BOSS: TK.BOSS, RAUM_FEIER: TK.RAUM_FEIER };
  return { hide, show, xp };
}

async function ariaMsgs(env, team) {
  const { results } = await env.DB.prepare("SELECT role, text, at FROM aria_msgs WHERE team_id=? ORDER BY id LIMIT 300").bind(team.id).all();
  return results;
}
async function ariaGet({ env, team, session }) {
  const c = caseOf(session);
  if (!isPlus(session) || !c.ARIA) return fail(L(langOf(session), "ARIA gibt es nur im Paket Premium Plus.", "ARIA is only available in the Premium Plus package."), 404);
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
  const c = caseOf(session);
  const lg = langOf(session);
  if (!isPlus(session) || !c.ARIA || stageOf(session, team) < 3) return fail(L(lg, "ARIA ist noch nicht freigeschaltet.", "ARIA isn't unlocked yet."), 403);
  const b = await body(request);
  const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, ARIA_LIMITS.maxChars);
  if (!text) return fail(L(lg, "Bitte eine Frage eingeben.", "Please enter a question."));
  const used = (await env.DB.prepare("SELECT COUNT(*) AS n FROM aria_msgs WHERE team_id=? AND role='user'").bind(team.id).first()).n;
  if (used >= ARIA_LIMITS.maxMsgs) return fail(L(lg, "ARIA braucht eine Pause: Euer Team hat alle Nachrichten verbraucht. Die Hinweise der Zentrale kommen trotzdem.", "ARIA needs a break: your team has used up all its messages. Headquarters will still send hints."), 429);
  if (!(await ariaGate(env, team))) return fail(L(lg, "ARIA tippt noch … einen Moment.", "ARIA is still typing … one moment."), 429);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO aria_msgs (team_id, at, role, text) VALUES (?,?,?,?)").bind(team.id, now, "user", text).run();
  const x = ariaX(session);
  const ps = ariaPseudo(x);
  let reply;
  try {
    if (!env.ANTHROPIC_API_KEY) throw new Error("kein Schlüssel");
    const hist = (await ariaMsgs(env, team)).filter((m) => m.role === "user" || m.role === "assistant").slice(-ARIA_LIMITS.history);
    const messages = [];
    for (const m of hist) {
      const last = messages[messages.length - 1];
      const t = ps.hide(m.text);
      if (last && last.role === m.role) last.content += "\n" + t; else messages.push({ role: m.role, content: t });
    }
    while (messages.length && messages[0].role !== "user") messages.shift();
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: env.ARIA_MODEL || "claude-haiku-4-5-20251001", max_tokens: 300, temperature: 0.6,
        system: [{ type: "text", text: c.ARIA.system(ps.xp), cache_control: { type: "ephemeral" } }],
        messages,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || String(r.status));
    reply = ps.show((d.content || []).filter((p) => p.type === "text").map((p) => p.text).join("").trim()).slice(0, 1200);
    if (!reply) throw new Error("leer");
  } catch (e) {
    reply = c.ARIA.fallback(x);
  }
  await env.DB.prepare("INSERT INTO aria_msgs (team_id, at, role, text) VALUES (?,?,?,?)").bind(team.id, Date.now(), "assistant", reply).run();
  return json({ ok: true });
}
async function ariaKennwort({ request, env, team, session }) {
  const c = caseOf(session);
  const lg = langOf(session);
  if (!isPlus(session) || !c.ARIA || stageOf(session, team) < 3) return fail(L(lg, "ARIA ist noch nicht freigeschaltet.", "ARIA isn't unlocked yet."), 403);
  const x = ariaX(session);
  if (team.aria_unlocked_at) return json({ ok: true, note: c.ARIA.note(x) });
  const b = await body(request);
  const pw = String(b.kennwort || "").trim().slice(0, 60);
  if (!pw) return fail(L(lg, "Bitte ein Kennwort eingeben.", "Please enter a password."));
  if (!(await ariaGate(env, team))) return fail(L(lg, "Einen Moment – nächster Versuch in ein paar Sekunden.", "One moment – next attempt in a few seconds."), 429);
  const ok = c.ARIA.checkPassword(pw, x);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO aria_msgs (team_id, at, role, text) VALUES (?,?,?,?)").bind(team.id, now, "event", ok ? L(lg, `🔓 Kennwort „${pw}“ – Notiz geöffnet`, `🔓 Password “${pw}” – note opened`) : L(lg, `🔒 Kennwort „${pw}“ – falsch`, `🔒 Password “${pw}” – wrong`)).run();
  if (!ok) return json({ ok: false });
  await env.DB.prepare("UPDATE teams SET aria_unlocked_at=? WHERE id=?").bind(now, team.id).run();
  return json({ ok: true, note: c.ARIA.note(x) });
}

// Nur in Testrunden: Spielzeit vorspulen (bis zum nächsten Hinweis der aktuellen Stufe oder um x Minuten)
async function vorspulen({ request, env, team, session }) {
  const lg = langOf(session);
  if (!session.test_mode) return fail(L(lg, "Vorspulen gibt es nur in Testrunden.", "Fast-forward is only available in test rounds."), 403);
  const b = await body(request);
  const now = Date.now();
  const stage = stageOf(session, team);
  let shift = Math.min(60, Math.max(1, Number(b.minuten) || 5)) * 60000;
  if (b.bis === "hinweis") {
    const next = hintTimes(session).filter((h) => h.stage === stage && h.time > now).sort((a, c) => a.time - c.time)[0];
    if (!next) return fail(L(lg, "In dieser Stufe kommt kein weiterer Hinweis mehr.", "No more hints in this stage."));
    shift = next.time - now + 1000;
  }
  await env.DB.prepare("UPDATE sessions SET started_at=started_at-? WHERE id=?").bind(shift, session.id).run();
  return json({ ok: true, minuten: Math.round(shift / 60000) });
}

async function kontrolle({ env, team, session }) {
  const stage = stageOf(session, team);
  const lg = langOf(session);
  if (stage >= 3) return fail(L(lg, "Für diese Stufe gibt es keinen Kontrolltipp.", "There is no check for this stage."));
  if (team.wrong < RULES.checkAfterWrong) return fail(L(lg, `Den Kontrolltipp gibt es erst nach ${RULES.checkAfterWrong} Fehlversuchen.`, `The check is only available after ${RULES.checkAfterWrong} wrong attempts.`));
  let last = null;
  try { last = JSON.parse(team.last_result || "null"); } catch {}
  if (!last || last.stage !== stage) return fail(L(lg, "Gebt zuerst einen Lösungsversuch für diese Stufe ab.", "Submit an answer for this stage first."));
  await env.DB.prepare("UPDATE teams SET penalty_min=penalty_min+? WHERE id=?").bind(RULES.checkPenaltyMin, team.id).run();
  return json({ result: last.result, penalty_min: RULES.checkPenaltyMin });
}

// ---------- Organisator ----------
async function leitungLogin(request, env) {
  const b = await body(request);
  const code = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const s0 = code && (await env.DB.prepare("SELECT * FROM sessions WHERE org_code=?").bind(code).first());
  const s = s0 && (await loadSession(env, s0.id));
  if (!s) return fail(L(hLang(request), "Organisator-Code unbekannt.", "Unknown organiser code."), 404);
  let token = s.org_token;
  if (!token) {
    token = randomToken();
    await env.DB.prepare("UPDATE sessions SET org_token=? WHERE id=?").bind(token, s.id).run();
  }
  return json({ token, lang: langOf(s) });
}

function mayOpen(session) {
  // Ein gekaufter Fall lässt sich jederzeit öffnen (auch gleich nach dem Kauf) – starten kann man ihn nur einmal.
  return true;
}

async function leitungState({ env, session }) {
  const c = caseOf(session);
  const v = buildVars(session);
  const rank = await ranking(env, session);
  return json({
    fall: c.META.title,
    lang: langOf(session),
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
    // Testrunden: Auflösung sofort, damit man beim Testen nicht warten muss
    solution_available: session.status === "finished" || (session.status === "running" && (!!session.test_mode ||
      Date.now() - session.started_at >= RULES.solutionAfterMin * 60000)),
    ranking: rank,
  });
}

async function leitungAktion({ request, env, session }) {
  const b = await body(request);
  const now = Date.now();
  const lg = langOf(session);
  if (b.aktion === "oeffnen") {
    if (session.status !== "created") return fail(L(lg, "Der Fall ist bereits geöffnet.", "The case is already open."));
    if (!mayOpen(session)) return fail(L(lg, `Der Fall kann nur am Spieltag (${session.event_date}) geöffnet werden.`, `The case can only be opened on the day of the game (${session.event_date}).`), 403);
    await env.DB.prepare("UPDATE sessions SET status='open', opened_at=? WHERE id=?").bind(now, session.id).run();
    return json({ ok: true });
  }
  if (b.aktion === "starten") {
    if (session.status !== "open") return fail(L(lg, "Zuerst den Fall öffnen, damit sich die Teams anmelden können.", "Open the case first so the teams can join."));
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM teams WHERE session_id=?").bind(session.id).first();
    if (!n.n) return fail(L(lg, "Es hat sich noch kein Team angemeldet.", "No team has joined yet."));
    await env.DB.prepare("UPDATE sessions SET status='running', started_at=? WHERE id=?").bind(now, session.id).run();
    return json({ ok: true });
  }
  if (b.aktion === "beenden") {
    if (session.status !== "running") return fail(L(lg, "Die Runde läuft nicht.", "The round isn't running."));
    await env.DB.prepare("UPDATE sessions SET status='finished', ended_at=? WHERE id=?").bind(now, session.id).run();
    await recordStats(env, { ...session, status: "finished", ended_at: now });
    return json({ ok: true });
  }
  return fail(L(lg, "Unbekannte Aktion.", "Unknown action."));
}

function solutionInfo(session) {
  const c = caseOf(session);
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
      detail: q.key === "wer" ? who.taeter : q.key === "pin" ? L(langOf(session), `Kennwort der Notiz bei ARIA: ${v.ROOM_NEU}`, `Password of the note in ARIA: ${v.ROOM_NEU}`) : "" })),
    story: render(c.META.story, v),
    story2: premium ? render(c.META.story2, v) : null,
    story3: plus && c.META.story3 ? render(c.META.story3, v) : null,
  };
}

async function aufloesung({ session }) {
  const ok = session.status === "finished" || (session.status === "running" && (!!session.test_mode ||
    Date.now() - session.started_at >= RULES.solutionAfterMin * 60000));
  if (!ok) return fail(L(langOf(session), `Die Auflösung gibt es frühestens ${RULES.solutionAfterMin} Minuten nach dem Start.`, `The solution is available ${RULES.solutionAfterMin} minutes after the start at the earliest.`), 403);
  return json(solutionInfo(session));
}

// ---------- Admin ----------
function adminMeta() {
  const c = CASES["fall-001"];
  return json({
    cases: [{ id: "fall-001", title: c.META.title }],
    tiers: TIER_NAMES,
    countries: COUNTRY_ORDER.map((k) => ({ code: k, de: COUNTRIES[k].de, en: COUNTRIES[k].en })),
    langs: ["de", "en"],
    fields: c.FIELDS.map(([key, label, example, type]) => ({ key, label, example, type: type || "text" })),
  });
}
async function adminList(env) {
  const { results } = await env.DB.prepare(
    "SELECT s.id, s.label, s.case_id, s.event_date, s.status, s.join_code, s.org_code, s.test_mode, s.premium, s.lang, json_extract(s.vars,'$.LAND') AS land, s.created_at, (SELECT COUNT(*) FROM teams t WHERE t.session_id=s.id) AS teams FROM sessions s ORDER BY s.created_at DESC"
  ).all();
  for (const s of results) if (expired(s)) await purgeSession(env, s.id);
  return json({ sessions: results.filter((s) => !expired(s)) });
}
async function adminCreate(request, env) {
  const b = await body(request);
  try {
    // Schnelltest: fiktive Besetzung wie im Shop (AT/DE/CH handverlesen, sonst Generator)
    if (b.cast === "fiktiv") {
      const land = COUNTRY_ORDER.includes(b.vars?.LAND) ? b.vars.LAND : "AT";
      const F = (CASES["fall-001"].FICTIONS || {})[land] || [];
      let cast = F.length ? F[randInt(F.length)] : randomCast(land, b.lang, randInt);
      if (F.length && b.lang === "en") cast = castToEnglish(cast);
      b.vars = { ...cast, LAND: land };
      if (!b.label) b.label = `Schnelltest ${TIER_NAMES[Number(b.tier) || 0]} · ${land}/${b.lang === "en" ? "EN" : "DE"} · ${cast.FIRMA}`;
    }
    const r = await createGameSession(env, { ...b, allowExamples: true });
    return json({ ...r, vars: undefined, quick: { firma: r.vars.FIRMA, opfer: r.vars.OPFER, boss: r.vars.BOSS, stadt: r.vars.STADT, land: r.vars.LAND, lang: b.lang === "en" ? "en" : "de",
      people: [1, 2, 3, 4, 5, 6].map((i) => r.vars["S" + i]) } });
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
// Buchhaltung: bezahlte Bestellungen als CSV (Spalten wie im Tabellenblatt „Einnahmen“), Excel-tauglich (; und Komma)
async function adminExport(request, env) {
  try { await env.DB.prepare("ALTER TABLE orders ADD COLUMN invoice_no TEXT").run(); } catch {}
  const u = new URL(request.url);
  const von = u.searchParams.get("von") || "2000-01-01", bis = u.searchParams.get("bis") || "2999-12-31";
  const from = Date.parse(von + "T00:00:00+02:00"), to = Date.parse(bis + "T23:59:59+02:00");
  const { results } = await env.DB.prepare(
    "SELECT * FROM orders WHERE status IN ('paid','fulfilling','fulfilled') AND paid_at BETWEEN ? AND ? ORDER BY paid_at").bind(from, to).all();
  const P = { basis: "Basis", premium: "Premium", plus: "Premium Plus" };
  const q = (x) => { const t = String(x ?? ""); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const d = (ms) => new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(ms));
  const lines = [["Datum (bezahlt)", "Rechnungsnr. (Stripe)", "Bestell-ID", "Kunde / Firma", "Paket", "Teams", "Early Bird", "Betrag bezahlt (€)", "davon USt (€)", "Zahlungsweg", "Bemerkung"].join(";")];
  for (const o of results) {
    const c = JSON.parse(o.contact || "{}");
    const firma = c.rechnung_firma || (c.fiktiv ? "" : (JSON.parse(o.vars || "{}").FIRMA || ""));
    lines.push([d(o.paid_at), o.invoice_no || "", o.id.slice(0, 8), [c.name, firma].filter(Boolean).join(" / "), P[o.paket] || o.paket, o.teams,
      c.earlybird ? "Ja" : "Nein", (o.amount_cents / 100).toFixed(2).replace(".", ","), "0,00", o.stripe_session ? "Stripe" : "Test (ohne Zahlung)", ""].map(q).join(";"));
  }
  return new Response("\ufeff" + lines.join("\r\n"), { headers: { "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="mordsteam-einnahmen-${von}-bis-${bis}.csv"`, "cache-control": "no-store" } });
}

// Feedback: eingegangene Bögen und fällige bzw. nicht zustellbare Feedback-Mails
async function adminFeedback(env) {
  await migrateFeedback(env);
  const { results } = await env.DB.prepare(
    "SELECT f.*, json_extract(o.vars,'$.FIRMA') AS firma, json_extract(o.contact,'$.name') AS name, json_extract(o.contact,'$.email') AS email FROM feedback f LEFT JOIN orders o ON o.id=f.order_id ORDER BY f.created_at DESC LIMIT 200").all();
  const due = await dueFeedback(env, { force: true });
  const { results: open } = await env.DB.prepare(
    "SELECT id, feedback_token, json_extract(contact,'$.email') AS email, json_extract(contact,'$.site') AS site FROM orders WHERE feedback_token IS NOT NULL AND feedback_sent_at IS NULL AND id NOT IN (SELECT order_id FROM feedback)").all();
  return json({ feedback: results.map((f) => ({ ...f, answers: JSON.parse(f.answers || "{}") })),
    due: due.map((o) => ({ order: o.id, email: JSON.parse(o.contact || "{}").email, ended_at: o.ended_at })),
    links: open.map((o) => ({ order: o.id, email: o.email, link: `${o.site === "en" ? "/en/feedback.html" : "/feedback.html"}?f=${o.feedback_token}` })),
    mail: !!(env.RESEND_API_KEY && env.MAIL_FROM), cron: !!env.CRON_KEY });
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
