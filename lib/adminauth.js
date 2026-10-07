// Admin-Schlüssel prüfen (Spiel-, Solo- und Friends-API) – mit Bremse gegen Durchprobieren (7.10.2026):
// höchstens 10 Fehlversuche je Anschluss in 15 Minuten, danach antwortet der Admin 15 Minuten lang mit 429.
// Gezählt werden nur Fehlversuche; die IP wird nur als Hash gespeichert und nach einem Tag gelöscht.
const WINDOW = 15 * 60000, MAX_FAILS = 10;

async function sha(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// null = berechtigt, sonst die Fehlerantwort (fail = Antwort-Helfer der jeweiligen Route)
export async function adminDenied(request, env, fail) {
  if (!env.ADMIN_KEY) return fail("ADMIN_KEY ist in dieser Umgebung nicht gesetzt (oder das Deployment ist älter als die Variable).", 503);
  const now = Date.now();
  const ip = (await sha("mordsteam-admin:" + (request.headers.get("cf-connecting-ip") || "unknown"))).slice(0, 32);
  let db = false;
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_fail (ip TEXT NOT NULL, at INTEGER NOT NULL)").run();
    db = true;
    const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM admin_fail WHERE ip=? AND at > ?").bind(ip, now - WINDOW).first();
    if (c && c.n >= MAX_FAILS) return fail("Zu viele Fehlversuche – der Admin ist für diesen Anschluss 15 Minuten gesperrt.", 429);
  } catch { /* Bremse darf den Admin nie blockieren */ }
  // Vergleich über Hashes (gleich lange Werte, keine Rückschlüsse aus der Laufzeit)
  const ok = (await sha((request.headers.get("x-admin") || "").trim())) === (await sha(String(env.ADMIN_KEY).trim()));
  if (ok) return null;
  if (db) {
    try {
      await env.DB.prepare("DELETE FROM admin_fail WHERE at < ?").bind(now - 86400000).run();
      await env.DB.prepare("INSERT INTO admin_fail (ip, at) VALUES (?, ?)").bind(ip, now).run();
    } catch {}
  }
  return fail("Nicht berechtigt.", 401);
}
