// Cloudflare Pages Function: /api/friends/* – Mordsteam Friends (Krimiabend für 4–8 Freunde)
import { json, fail } from "../../../lib/game.js";
import { friendsInvite, friendsClaim, friendsState, friendsBegin, friendsHint, friendsAnswer, friendsGiveUp, friendsOrg, friendsOrgStart, friendsOrgReveal, friendsAdmin, friendsFeedback, friendsVerhoerGet, friendsVerhoerAsk } from "../../../lib/friends.js";

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  const route = (params.route || []).join("/");
  const m = request.method, url = new URL(request.url);
  try {
    if (route === "invite" && m === "GET") return await friendsInvite(env, url, request);
    if (route === "claim" && m === "POST") return await friendsClaim(request, env);
    if (route === "state" && m === "GET") return await friendsState(request, env);
    if (route === "begin" && m === "POST") return await friendsBegin(request, env);
    if (route === "hint" && m === "POST") return await friendsHint(request, env);
    if (route === "answer" && m === "POST") return await friendsAnswer(request, env);
    if (route === "aufgeben" && m === "POST") return await friendsGiveUp(request, env);
    if (route === "verhoer" && m === "GET") return await friendsVerhoerGet(request, env);
    if (route === "verhoer" && m === "POST") return await friendsVerhoerAsk(request, env);
    if (route === "feedback" && m === "POST") return await friendsFeedback(request, env);
    if (route === "org" && m === "GET") return await friendsOrg(env, url, request);
    if (route === "org/start" && m === "POST") return await friendsOrgStart(request, env);
    if (route === "org/reveal" && m === "POST") return await friendsOrgReveal(request, env);
    if (route.startsWith("admin/")) {
      if (!env.ADMIN_KEY) return fail("ADMIN_KEY ist nicht gesetzt.", 503);
      if ((request.headers.get("x-admin") || "").trim() !== String(env.ADMIN_KEY).trim()) return fail("Nicht berechtigt.", 401);
      return await friendsAdmin(route, request, env);
    }
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    return json({ error: "Interner Fehler: " + (e && e.message ? e.message : e) }, 500);
  }
}
