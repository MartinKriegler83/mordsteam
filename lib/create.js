// Gemeinsame Bausteine: Datenbank-Erweiterungen und das Anlegen einer Spielrunde
// (genutzt vom Admin-Bereich und von der Bestellung).
import { CASES, RULES, randInt, randomCode } from "./game.js";
import { COUNTRY_ORDER } from "./countries.js";

// Fehlende Spalten/Tabellen beim ersten Aufruf anlegen – ohne Handarbeit in der D1-Konsole
let migrated = false;
export async function migrate(env) {
  if (migrated) return;
  const stmts = [
    "ALTER TABLE teams ADD COLUMN act2_at INTEGER",
    "ALTER TABLE teams ADD COLUMN view_token TEXT",
    "ALTER TABLE sessions ADD COLUMN max_teams INTEGER",
    "ALTER TABLE sessions ADD COLUMN logo TEXT",
    "ALTER TABLE sessions ADD COLUMN lang TEXT",
    "ALTER TABLE teams ADD COLUMN aria_unlocked_at INTEGER",
    "ALTER TABLE teams ADD COLUMN aria_last_at INTEGER",
    "ALTER TABLE teams ADD COLUMN bonus TEXT",
    "ALTER TABLE teams ADD COLUMN bonus_min INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE teams ADD COLUMN bonus_done_at INTEGER",
    "ALTER TABLE teams ADD COLUMN login_fails INTEGER NOT NULL DEFAULT 0",
    "CREATE TABLE IF NOT EXISTS aria_msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, team_id TEXT NOT NULL, at INTEGER NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS viewers (token TEXT PRIMARY KEY, team_id TEXT NOT NULL, created_at INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS stats_teams (session_id TEXT NOT NULL, team_no INTEGER NOT NULL, recorded_at INTEGER NOT NULL, case_id TEXT, premium INTEGER, test_mode INTEGER, duration_min INTEGER, teams_in_round INTEGER, stage_reached INTEGER, core_min REAL, act2_min REAL, solved_min REAL, attempts INTEGER, wrong INTEGER, penalty_min INTEGER, wrong_by_q TEXT, hints_akt1 INTEGER, hints_akt2 INTEGER, viewers INTEGER, PRIMARY KEY (session_id, team_no))",
    "CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, token TEXT NOT NULL, created_at INTEGER NOT NULL, status TEXT NOT NULL, paket TEXT NOT NULL, teams INTEGER NOT NULL, amount_cents INTEGER NOT NULL, event_date TEXT NOT NULL, vars TEXT NOT NULL, contact TEXT NOT NULL, logo TEXT, stripe_session TEXT, session_id TEXT, paid_at INTEGER, shipped_at INTEGER)",
  ];
  for (const s of stmts) { try { await env.DB.prepare(s).run(); } catch {} }
  migrated = true;
}

export class InputError extends Error {}

// Eingaben prüfen und normalisieren (Beispielwerte nur, wenn allowExamples gesetzt ist – Admin/Tests)
export function normalizeVars(caseId, raw, premium, allowExamples, lang = "de") {
  const c = CASES[caseId];
  const en = lang === "en";
  const T = (de, e) => (en ? e : de);
  const FE = (en && c.FIELDS_EN) || {};
  const n = c.suspectCount ? c.suspectCount(premium) : 5;
  const vars = {};
  for (const [key, label0, example, type] of c.FIELDS) {
    const label = FE[key] ? FE[key][0] : label0;
    let val = String(raw?.[key] ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    const idx = /^S(\d)/.exec(key);
    const needed = !idx || Number(idx[1]) <= n;
    if (!val) {
      if (allowExamples || !needed) val = example;
      else throw new InputError(T(`Bitte ausfüllen: ${label}`, `Please fill in: ${label}`));
    }
    if (type === "anrede") val = /^\s*(h|mr\b|mr\.|mister|sir)/i.test(val) ? "Herr" : "Frau";
    vars[key] = val;
  }
  // Land, in dem der Fall spielt (Behörden, Währung, Kennzeichen …)
  vars.LAND = COUNTRY_ORDER.includes(String(raw?.LAND || "").toUpperCase()) ? String(raw.LAND).toUpperCase() : "AT";
  const nm = [...Array(n)].map((_, i) => vars[`S${i + 1}`].toLowerCase());
  if (new Set(nm).size !== n) throw new InputError(T("Jede verdächtige Person braucht einen eigenen Namen.", "Every suspect needs a different name."));
  if (!allowExamples) {
    const last = nm.map((x) => x.split(" ").pop());
    if (new Set(last).size !== n) throw new InputError(T("Zwei Verdächtige haben denselben Nachnamen – bitte bei einer Person einen Zusatz verwenden.", "Two suspects share a last name – please add something to one of them."));
  }
  if (nm.includes(vars.OPFER.toLowerCase())) throw new InputError(T("Das Opfer darf nicht gleichzeitig verdächtig sein.", "The victim can't also be a suspect."));
  if (vars.BOSS && (nm.includes(vars.BOSS.toLowerCase()) || vars.BOSS.toLowerCase() === vars.OPFER.toLowerCase()))
    throw new InputError(T("Der Oberboss darf weder Opfer noch verdächtig sein.", "The top boss can be neither the victim nor a suspect."));
  return vars;
}

// Spielrunde anlegen
export async function createGameSession(env, o) {
  const caseId = o.case_id || "fall-001";
  const c = CASES[caseId];
  if (!c) throw new InputError("Unbekannter Fall.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(o.event_date || ""))) throw new InputError("Spieltag im Format JJJJ-MM-TT angeben.");
  // Paket: tier 0 = Basic, 1 = Premium, 2 = Premium Plus (alte Aufrufe mit premium:true = Premium)
  const tier = Math.max(0, Math.min(2, o.tier != null ? Number(o.tier) || 0 : o.premium ? 1 : 0));
  const premium = tier >= 1;
  const vars = normalizeVars(caseId, o.vars || {}, premium, !!o.allowExamples);
  const duration = RULES.durations[tier];
  const maxTeams = Math.min(RULES.maxTeams, Math.max(1, Number(o.max_teams) || RULES.maxTeams));
  const id = crypto.randomUUID();
  const joinCode = randomCode(6);
  const orgCode = randomCode(8);
  await env.DB.prepare(
    "INSERT INTO sessions (id, case_id, label, created_at, event_date, status, premium, premium_answer, duration_min, vars, secrets, join_code, org_code, test_mode, max_teams, logo) VALUES (?,?,?,?,?,'created',?,?,?,?,?,?,?,?,?,?)"
  ).bind(
    id, caseId, String(o.label || vars.FIRMA).slice(0, 80), Date.now(), o.event_date,
    tier, null, duration,
    JSON.stringify(vars), JSON.stringify(c.makeSecrets(randInt, { premium, lang: o.lang === "en" ? "en" : "de", feier: vars.RAUM_FEIER, land: vars.LAND })),
    joinCode, orgCode, o.test_mode ? 1 : 0, maxTeams, o.logo || null
  ).run();
  await env.DB.prepare("UPDATE sessions SET lang=? WHERE id=?").bind(o.lang === "en" ? "en" : "de", id).run();
  return { id, join_code: joinCode, org_code: orgCode, vars };
}
