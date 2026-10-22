// Cloudflare Pages Function: /api/bp/* – Brightpage-Rechnungen im Mordsteam-Admin (19.10.2026), nur mit Admin-Schlüssel.
// Logik und Buchhaltungs-Anbindung: lib/brightpage.js
import { json, fail, badBody } from "../../../lib/game.js";
import { adminDenied } from "../../../lib/adminauth.js";
import { auftragListe, auftragNeu, auftragSave, auftragStatus, auftragNotiz, auftragZeit, auftragLoeschen, anfrageEingang } from "../../../lib/bpauftrag.js";
import { angeboteListe, angebotSave, angebotFreigeben, angebotStatus, angebotVorschau, rechnungLink, angebotWarnungen, rechnungAdminHtml, schlussAusAngebot, bpKeyOk, htmlPage, publicAngebot, publicAnnahme, publicRechnung } from "../../../lib/bpangebot.js";
import { publicFormular, publicFormularPost, publicAnleitung, publicAV, publicWiderruf, publicAgb, publicWiderrufen, publicUebergabe, publicUebergabePost, uebergabeSave, uebergabeVorlage, nachfassWarnungen, widerrufErfassen, widerrufeFuer, formAbschnitte, anleitungenFuer } from "../../../lib/bpkunde.js";
import { besuchEingang, besucherStats } from "../../../lib/bpbesuch.js";
import { bpOverview, bpConfigSave, kundeSave, kundeDelete, rechnungSave, rechnungAusstellen, rechnungBezahlt, rechnungStorno, rechnungErstattung, aboSave, aboRechnungen } from "../../../lib/brightpage.js";

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail("Datenbank nicht eingerichtet.", 500);
  { const bad = await badBody(request); if (bad) return bad; }
  const route = (params.route || []).join("/");
  // Eingang vom Kontaktformular auf brightpage.net (Server zu Server, Schlüssel BP_INBOX_KEY statt Admin-Schlüssel)
  if (route === "public/anfrage" && request.method === "POST") {
    try { let b = {}; try { b = await request.json(); } catch {} return json(await anfrageEingang(env, request, b)); }
    catch (e) { if (e.status) return fail(e.message, e.status); throw e; }
  }
  // Besuchszählung von brightpage.net (Server zu Server, Schlüssel BP_INBOX_KEY)
  if (route === "public/besuch" && request.method === "POST") {
    if (!bpKeyOk(env, request)) return fail("Nicht erlaubt.", 403);
    let b = {}; try { b = await request.json(); } catch {}
    return json(await besuchEingang(env, b));
  }
  // Kundenseiten brightpage.net/k/* (Durchreicher auf brightpage.net, gleicher Schlüssel): Angebot ansehen/annehmen, Rechnung ansehen
  if (route.startsWith("public/k/")) {
    if (!bpKeyOk(env, request)) return htmlPage("Nicht erlaubt.", 403);
    const [, , art, tok = ""] = route.split("/");
    if (art === "angebot" && request.method === "GET") return publicAngebot(env, tok);
    if (art === "angebot" && request.method === "POST") { let f; try { f = await request.formData(); } catch { f = new FormData(); } return publicAnnahme(env, tok, f, request.headers.get("x-bp-ip") || ""); }
    if (art === "rechnung" && request.method === "GET") return publicRechnung(env, tok, new URL(request.url).searchParams.get("neu") === "1");
    const form = async () => { try { return await request.formData(); } catch { return new FormData(); } }, ip = request.headers.get("x-bp-ip") || "";
    if (art === "formular" && request.method === "GET") return publicFormular(env, tok, new URL(request.url));
    if (art === "formular" && request.method === "POST") return publicFormularPost(env, tok, await form(), ip);
    if (art === "uebergabe" && request.method === "GET") return publicUebergabe(env, tok);
    if (art === "uebergabe" && request.method === "POST") return publicUebergabePost(env, tok, await form(), ip);
    const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "de";
    if (art === "anleitung" && request.method === "GET") return publicAnleitung(env, tok, lang);
    if (art === "av" && request.method === "GET") return publicAV(env, lang);
    if (art === "widerruf" && request.method === "GET") return publicWiderruf(env, lang);
    if (art === "agb" && request.method === "GET") return publicAgb(env, lang);
    if (art === "widerrufen" && request.method === "GET") return publicWiderrufen(env, lang);
    if (art === "widerrufen" && request.method === "POST") return publicWiderrufen(env, lang, await form(), ip);
    return htmlPage("Nicht gefunden.", 404);
  }
  if (!route.startsWith("admin/")) return fail("Nicht gefunden.", 404);
  { const denied = await adminDenied(request, env, fail); if (denied) return denied; }
  const m = request.method;
  const body = async () => { try { return await request.json(); } catch { return {}; } };
  try {
    if (route === "admin/daten" && m === "GET") return json(await bpOverview(env));
    if (route === "admin/besucher" && m === "GET") return json(await besucherStats(env, new URL(request.url).searchParams.get("tage")));
    if (route === "admin/auftraege" && m === "GET") { const d = await auftragListe(env); d.warn = [...(await angebotWarnungen(env)), ...(await nachfassWarnungen(env)), ...d.warn]; return json(d); }
    if (route === "admin/angebote" && m === "GET") { const id = new URL(request.url).searchParams.get("auftrag") || "", d = await angeboteListe(env, id);
      const au = await env.DB.prepare("SELECT produkte FROM bp_auftraege WHERE id=?").bind(id).first(); const pr = au ? JSON.parse(au.produkte || "[]") : [];
      return json({ ...d, formular_def: formAbschnitte(pr), anleitungen: anleitungenFuer(pr), uebergabe_vorlage: await uebergabeVorlage(env, id), widerrufe: await widerrufeFuer(env, id) }); }
    if (m !== "POST") return fail("Nicht gefunden.", 404);
    const b = await body();
    if (route === "admin/auftrag/neu") return json(await auftragNeu(env, b));
    if (route === "admin/auftrag") return json(await auftragSave(env, b));
    if (route === "admin/auftrag/status") return json(await auftragStatus(env, b));
    if (route === "admin/auftrag/notiz") return json(await auftragNotiz(env, b));
    if (route === "admin/auftrag/zeit") return json(await auftragZeit(env, b));
    if (route === "admin/auftrag/loeschen") return json(await auftragLoeschen(env, String(b.id || "")));
    if (route === "admin/angebot") return json(await angebotSave(env, b));
    if (route === "admin/angebot/freigeben") return json(await angebotFreigeben(env, b));
    if (route === "admin/angebot/status") return json(await angebotStatus(env, b));
    if (route === "admin/angebot/vorschau") return json(await angebotVorschau(env, b));
    if (route === "admin/rechnung/html") return json(await rechnungAdminHtml(env, b));
    if (route === "admin/auftrag/uebergabe") return json(await uebergabeSave(env, b));
    if (route === "admin/auftrag/schluss") return json(await schlussAusAngebot(env, b));
    if (route === "admin/rechnung/link") return json(await rechnungLink(env, b));
    if (route === "admin/einstellungen") return json(await bpConfigSave(env, b));
    if (route === "admin/kunde") return json(await kundeSave(env, b));
    if (route === "admin/kunde/loeschen") return json(await kundeDelete(env, String(b.id || "")));
    if (route === "admin/rechnung") return json(await rechnungSave(env, b));
    if (route === "admin/rechnung/ausstellen") return json(await rechnungAusstellen(env, b));
    if (route === "admin/rechnung/bezahlt") return json(await rechnungBezahlt(env, b));
    if (route === "admin/rechnung/storno") return json(await rechnungStorno(env, b));
    if (route === "admin/rechnung/erstattung") return json(await rechnungErstattung(env, b));
    if (route === "admin/widerruf") return json(await widerrufErfassen(env, b));
    if (route === "admin/abo") return json(await aboSave(env, b));
    if (route === "admin/abo/rechnungen") return json(await aboRechnungen(env));
    return fail("Nicht gefunden.", 404);
  } catch (e) {
    if (e.status) return fail(e.message, e.status);
    throw e;
  }
}
