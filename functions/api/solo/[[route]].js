// Cloudflare Pages Function: /api/solo/* – Mordsteam Solo (Einzelfälle)
import { json, fail } from "../../../lib/game.js";
import { adminDenied } from "../../../lib/adminauth.js";
import { soloTicketInfo, soloStart, soloState, soloHint, soloAnswer, soloGiveUp, soloBegin, soloForward, soloAdmin, soloFeedback, soloVerhoerGet, soloVerhoerAsk, soloGiftInfo } from "../../../lib/solo.js";

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  const route = (params.route || []).join("/");
  const m = request.method;
  try {
    if (route === "geschenk" && m === "GET") return await soloGiftInfo(env, new URL(request.url));
    if (route === "ticket" && m === "GET") return await soloTicketInfo(env, new URL(request.url), request);
    if (route === "start" && m === "POST") return await soloStart(request, env);
    if (route === "state" && m === "GET") return await soloState(request, env);
    if (route === "begin" && m === "POST") return await soloBegin(request, env);
    if (route === "hint" && m === "POST") return await soloHint(request, env);
    if (route === "answer" && m === "POST") return await soloAnswer(request, env);
    if (route === "aufgeben" && m === "POST") return await soloGiveUp(request, env);
    if (route === "verhoer" && m === "GET") return await soloVerhoerGet(request, env);
    if (route === "verhoer" && m === "POST") return await soloVerhoerAsk(request, env);
    if (route === "feedback" && m === "POST") return await soloFeedback(request, env);
    if (route === "test/vorspulen" && m === "POST") return await soloForward(request, env);
    if (route.startsWith("admin/")) {
      { const denied = await adminDenied(request, env, fail); if (denied) return denied; }
      try { return await soloAdmin(route, request, env); } catch (e) { if (e.status) return fail(e.message, e.status); throw e; }
    }
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    return json({ error: "Interner Fehler: " + (e && e.message ? e.message : e) }, 500);
  }
}
