// Zählt alle Server-Aufrufe (/api/*) pro Tag und Bereich und protokolliert Serverfehler.
// Das häufige Nachfragen der Spielgeräte (alle paar Sekunden) wird nur stichprobenartig gezählt (1 von 10, ×10),
// damit die Zählung selbst kaum Datenbank-Schreibzugriffe kostet.
import { countHit, logError } from "../../lib/ops.js";

function areaOf(path) {
  const p = path.replace(/^\/api\//, "");
  if (/^spiel\/(state|leitung\/state|aria)$/.test(p) || /^solo\/state$/.test(p)) return ["spiel-abfrage", 10];
  if (p.startsWith("spiel/admin/") || p.startsWith("solo/admin/")) return ["admin", 1];
  if (p === "spiel/aria/chat") return ["aria", 1];
  if (p.startsWith("spiel/")) return ["spiel", 1];
  if (p.startsWith("solo/")) return ["solo", 1];
  if (p === "shop/stripe-webhook") return ["stripe", 1];
  if (p.startsWith("shop/")) return ["shop", 1];
  return ["sonstiges", 1];
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const path = new URL(request.url).pathname;
  const [area, w] = areaOf(path);
  const count = () => { if (env.DB && (w === 1 || Math.random() < 1 / w)) ctx.waitUntil(countHit(env, area, w)); };
  let res;
  try {
    res = await ctx.next();
  } catch (e) {
    count();
    if (env.DB) ctx.waitUntil(logError(env, area, 500, `${request.method} ${path}: ${e && e.message ? e.message : e}`));
    return new Response(JSON.stringify({ error: "Interner Fehler." }), { status: 500, headers: { "content-type": "application/json; charset=utf-8" } });
  }
  count();
  if (res.status >= 500 && env.DB) {
    const txt = await res.clone().text().catch(() => "");
    ctx.waitUntil(logError(env, area, res.status, `${request.method} ${path}: ${txt.slice(0, 200)}`));
  }
  return res;
}
