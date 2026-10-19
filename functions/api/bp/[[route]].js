// Cloudflare Pages Function: /api/bp/* – Brightpage-Rechnungen im Mordsteam-Admin (19.10.2026), nur mit Admin-Schlüssel.
// Logik und Buchhaltungs-Anbindung: lib/brightpage.js
import { json, fail, badBody } from "../../../lib/game.js";
import { adminDenied } from "../../../lib/adminauth.js";
import { bpOverview, bpConfigSave, kundeSave, kundeDelete, rechnungSave, rechnungAusstellen, rechnungBezahlt, rechnungStorno, aboSave, aboRechnungen } from "../../../lib/brightpage.js";

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  { const bad = await badBody(request); if (bad) return bad; }
  const route = (params.route || []).join("/");
  if (!route.startsWith("admin/")) return fail("Nicht gefunden.", 404);
  { const denied = await adminDenied(request, env, fail); if (denied) return denied; }
  const m = request.method;
  const body = async () => { try { return await request.json(); } catch { return {}; } };
  try {
    if (route === "admin/daten" && m === "GET") return json(await bpOverview(env));
    if (m !== "POST") return fail("Nicht gefunden.", 404);
    const b = await body();
    if (route === "admin/einstellungen") return json(await bpConfigSave(env, b));
    if (route === "admin/kunde") return json(await kundeSave(env, b));
    if (route === "admin/kunde/loeschen") return json(await kundeDelete(env, String(b.id || "")));
    if (route === "admin/rechnung") return json(await rechnungSave(env, b));
    if (route === "admin/rechnung/ausstellen") return json(await rechnungAusstellen(env, b));
    if (route === "admin/rechnung/bezahlt") return json(await rechnungBezahlt(env, b));
    if (route === "admin/rechnung/storno") return json(await rechnungStorno(env, b));
    if (route === "admin/abo") return json(await aboSave(env, b));
    if (route === "admin/abo/rechnungen") return json(await aboRechnungen(env));
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    if (e.status) return fail(e.message, e.status);
    throw e;
  }
}
