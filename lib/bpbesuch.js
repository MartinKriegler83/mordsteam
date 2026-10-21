// Brightpage – Besucherzähler (21.10.2026). brightpage.net schickt je Seitenaufruf ein Signal (Brightpage functions/api/besuch.js,
// Server zu Server mit BP_INBOX_KEY). Ohne Cookies, ohne IP, ohne Geräte-Kennung: Seite, ?src, verweisende Website, „Einstieg“
// (kam von außen), Sprache, Land. „Besuche“ = Einstiege (Aufrufe ohne Verweis von brightpage.net selbst) – ein Näherungswert.
// Einzeleinträge werden nach 400 Tagen gelöscht (Datenschutzerklärung: 13 Monate).
const s = (x, n) => String(x ?? "").trim().slice(0, n);
const VIENNA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });
const dayOf = (ms) => VIENNA.format(new Date(ms));
const DAY = 86400000;

let ready = false;
async function migrate(env) {
  if (ready) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bp_besuche (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, day TEXT NOT NULL,
    path TEXT, src TEXT, ref TEXT, entry INTEGER NOT NULL DEFAULT 0, lang TEXT, land TEXT)`).run();
  try { await env.DB.prepare("CREATE INDEX IF NOT EXISTS bp_besuche_day ON bp_besuche(day)").run(); } catch {}
  ready = true;
}

export async function besuchEingang(env, b) {
  await migrate(env);
  const t = Date.now(), day = dayOf(t);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM bp_besuche WHERE day=?").bind(day).first();
  if (n && n.n >= 20000) return { ok: true, skip: true };                       // Sparbremse gegen Fluten
  const path = s(b.p, 80).replace(/[^\w/.\-]/g, "") || "/";
  const src = s(b.src, 40).replace(/[^\w.:\-]/g, "");
  const ref = s(b.ref, 80).toLowerCase().replace(/[^a-z0-9.\-]/g, "");
  await env.DB.prepare("INSERT INTO bp_besuche (at, day, path, src, ref, entry, lang, land) VALUES (?,?,?,?,?,?,?,?)")
    .bind(t, day, path, src, ref, b.e ? 1 : 0, b.lang === "en" ? "en" : "de", s(b.land, 2).toUpperCase().replace(/[^A-Z]/g, "")).run();
  if (Math.random() < 0.01) await env.DB.prepare("DELETE FROM bp_besuche WHERE at < ?").bind(t - 400 * DAY).run();
  return { ok: true };
}

// Herkunft lesbar machen: ?src gewinnt, sonst die verweisende Website, sonst „direkt“
const SRC = { fb: "Facebook (Post/Profil)", insta: "Instagram", "li-profil": "LinkedIn-Profil", "li-post": "LinkedIn-Post", gads: "Google-Anzeige", wa: "WhatsApp", mail: "E-Mail", presse: "Presse", wko: "WKO" };
export function herkunftLabel(src, ref) {
  src = String(src || "");
  if (src.startsWith("ref:")) { ref = src.slice(4); src = ""; }
  if (src === "chat") return "Chat auf brightpage.net";
  if (src) return SRC[src] || "Kürzel " + src;
  const r = String(ref || "").replace(/^www\.|^m\.|^l\.|^lm\./, "");
  if (!r) return "direkt / unbekannt";
  if (/facebook\.com$|fb\.me$/.test(r)) return "Facebook (Link)";
  if (/instagram\.com$/.test(r)) return "Instagram (Link)";
  if (/linkedin\.com$|lnkd\.in$/.test(r)) return "LinkedIn (Link)";
  if (/^google\.|\.google\./.test(r) || r === "google.com") return "Google-Suche";
  if (/bing\.com$|duckduckgo\.com$|ecosia\.org$|yahoo\./.test(r)) return "andere Suchmaschine";
  if (/mordsteam\.com$/.test(r)) return "mordsteam.com";
  return r;
}

export async function besucherStats(env, tage = 30) {
  await migrate(env);
  tage = Math.min(400, Math.max(1, Math.round(Number(tage) || 30)));
  const now = Date.now(), seit = dayOf(now - (tage - 1) * DAY), heute = dayOf(now), gestern = dayOf(now - DAY);
  const q = async (sql, ...a) => (await env.DB.prepare(sql).bind(...a).all()).results || [];
  const proTag = await q("SELECT day, SUM(entry) AS besuche, COUNT(*) AS aufrufe FROM bp_besuche WHERE day>=? GROUP BY day ORDER BY day", seit);
  const her = await q("SELECT src, ref, SUM(entry) AS besuche, COUNT(*) AS aufrufe FROM bp_besuche WHERE day>=? GROUP BY src, ref", seit);
  const seiten = await q("SELECT path, COUNT(*) AS aufrufe FROM bp_besuche WHERE day>=? GROUP BY path ORDER BY aufrufe DESC LIMIT 12", seit);
  const laender = await q("SELECT land, SUM(entry) AS besuche FROM bp_besuche WHERE day>=? AND entry=1 GROUP BY land ORDER BY besuche DESC LIMIT 8", seit);
  const zuletzt = await q("SELECT at, path, src, ref, land FROM bp_besuche WHERE entry=1 ORDER BY at DESC LIMIT 15");
  // Anfragen im selben Zeitraum nach Herkunft (aus den Brightpage-Aufträgen)
  let anfr = [];
  try { anfr = await q("SELECT herkunft, COUNT(*) AS n FROM bp_auftraege WHERE deleted=0 AND created_at>=? GROUP BY herkunft", Date.parse(seit + "T00:00:00Z") - 2 * 3600000); } catch {}
  const H = new Map();
  for (const r of her) { const l = herkunftLabel(r.src, r.ref), x = H.get(l) || { herkunft: l, besuche: 0, aufrufe: 0, anfragen: 0 }; x.besuche += r.besuche || 0; x.aufrufe += r.aufrufe || 0; H.set(l, x); }
  for (const a of anfr) { const l = herkunftLabel(a.herkunft || "", ""), x = H.get(l) || { herkunft: l, besuche: 0, aufrufe: 0, anfragen: 0 }; x.anfragen += a.n; H.set(l, x); }
  const tag = (d) => proTag.find((x) => x.day === d) || { besuche: 0, aufrufe: 0 };
  const sum = (k) => proTag.reduce((a, x) => a + (x[k] || 0), 0);
  return { tage, seit, heute: tag(heute), gestern: tag(gestern), summe: { besuche: sum("besuche"), aufrufe: sum("aufrufe"), anfragen: anfr.reduce((a, x) => a + x.n, 0) },
    proTag, herkunft: [...H.values()].sort((a, b) => b.besuche - a.besuche || b.anfragen - a.anfragen), seiten, laender,
    zuletzt: zuletzt.map((z) => ({ at: z.at, path: z.path, herkunft: herkunftLabel(z.src, z.ref), land: z.land })) };
}
