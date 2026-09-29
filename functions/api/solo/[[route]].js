// Cloudflare Pages Function: /api/solo/* – Mordsteam Solo (Einzelfälle)
import { json, fail } from "../../../lib/game.js";
import { soloTicketInfo, soloStart, soloState, soloHint, soloAnswer, soloGiveUp, soloForward, soloAdmin } from "../../../lib/solo.js";

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  const route = (params.route || []).join("/");
  const m = request.method;
  try {
    if (route === "ticket" && m === "GET") return await soloTicketInfo(env, new URL(request.url));
    if (route === "start" && m === "POST") return await soloStart(request, env);
    if (route === "state" && m === "GET") return await soloState(request, env);
    if (route === "hint" && m === "POST") return await soloHint(request, env);
    if (route === "answer" && m === "POST") return await soloAnswer(request, env);
    if (route === "aufgeben" && m === "POST") return await soloGiveUp(request, env);
    if (route === "test/vorspulen" && m === "POST") return await soloForward(request, env);
    if (route.startsWith("admin/")) {
      if (!env.ADMIN_KEY) return fail("ADMIN_KEY ist nicht gesetzt.", 503);
      if ((request.headers.get("x-admin") || "").trim() !== String(env.ADMIN_KEY).trim()) return fail("Nicht berechtigt.", 401);
      return await soloAdmin(route, request, env);
    }
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    return json({ error: "Interner Fehler: " + (e && e.message ? e.message : e) }, 500);
  }
}
