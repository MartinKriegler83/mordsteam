// Kurzlink zur Friends-Organisator-Seite (Geschenkkarte, 7.10.2026): /f/FABCD234 → /spiel/friends.html?o=<org_token>
// Der Kurzcode (8 Zeichen, ohne 0/O/1/I) steht in friends_groups.short_code und wird beim ersten Abruf der Geschenkkarte angelegt.
import { migrateFriends } from "../../lib/friends.js";
export async function onRequestGet({ params, request, env }) {
  const c = String(params.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  let to = "/spiel/friends.html";
  if (env.DB && /^F[A-Z2-9]{7}$/.test(c)) {
    try {
      await migrateFriends(env);
      const g = await env.DB.prepare("SELECT org_token FROM friends_groups WHERE short_code=?").bind(c).first();
      if (g && g.org_token) to = `/spiel/friends.html?o=${encodeURIComponent(g.org_token)}`;
    } catch {}
  }
  return new Response(null, { status: 302, headers: { location: to, "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}
