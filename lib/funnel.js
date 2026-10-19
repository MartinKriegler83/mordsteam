// Trichter der Specials-Seiten (18.10.2026): Wie weit kommen Besucher, bevor sie kaufen?
// Gezählt wird nur Seite + Ereignis + Tag (keine Cookies, keine IP, keine Personendaten).
// Ereignisse von der Seite: view, s50 (halb gescrollt), s90 (fast ganz), video (Teaser startet = ins Bild gescrollt), ton (Ton eingeschaltet),
// probe (Klick „Erste Frage gratis“), buy (Klick auf einen Kaufknopf).
// Gratis-Bonus-Rätsel (19.10.2026, assets/bonus.js): bz0 (erster Tipp), bz1 (Skelett gefunden), bz2 (Rätsel 1 gelöst), bz3 (Candy-Code gelöst).
// Ereignisse vom Server (Gratis-Probe): probe_start (Durchgang angelegt), probe_q1 (Frage 1 gelöst), probe_buy (Kaufklick am Ende der Probe).
export const FUNNEL_PAGES = ["specials-de", "specials-en"];
export const FUNNEL_EVENTS = ["view", "s50", "s90", "video", "ton", "probe", "probe_start", "probe_q1", "probe_buy", "buy", "bz0", "bz1", "bz2", "bz3"];

let ready = false;
async function migrate(env) {
  if (ready) return;
  try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS funnel (page TEXT NOT NULL, ev TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (page, ev, day))").run(); } catch {}
  ready = true;
}

export async function funnelHit(env, page, ev) {
  if (!FUNNEL_PAGES.includes(page) || !FUNNEL_EVENTS.includes(ev)) return;
  try {
    await migrate(env);
    const day = new Date().toISOString().slice(0, 10);
    await env.DB.prepare("INSERT INTO funnel (page, ev, day, n) VALUES (?, ?, ?, 1) ON CONFLICT(page, ev, day) DO UPDATE SET n=n+1").bind(page, ev, day).run();
  } catch { /* Zählen darf nie etwas blockieren */ }
}

// GET /api/shop/ev?p=specials-en&e=buy – nur Ereignisse, die die Seite selbst melden darf
export async function funnelEvent(request, env) {
  const u = new URL(request.url);
  const ev = u.searchParams.get("e") || "";
  if (["view", "s50", "s90", "video", "ton", "probe", "buy", "bz0", "bz1", "bz2", "bz3"].includes(ev)) await funnelHit(env, u.searchParams.get("p") || "", ev);
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

// Admin: Summen je Seite und Ereignis (letzte 30 Tage und gesamt), dazu die letzten 14 Tage einzeln
export async function funnelStats(env) {
  await migrate(env);
  const day30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const rows = (await env.DB.prepare("SELECT page, ev, SUM(n) AS n, SUM(CASE WHEN day >= ? THEN n ELSE 0 END) AS n30 FROM funnel GROUP BY page, ev").bind(day30).all()).results;
  const out = {};
  for (const p of FUNNEL_PAGES) {
    out[p] = {};
    for (const e of FUNNEL_EVENTS) {
      const r = rows.find((x) => x.page === p && x.ev === e) || {};
      out[p][e] = { n: r.n || 0, n30: r.n30 || 0 };
    }
  }
  const first = await env.DB.prepare("SELECT MIN(day) AS d FROM funnel").first().catch(() => null);
  return { pages: out, since: first && first.d };
}
