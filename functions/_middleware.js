// Sprachweiche für die Startseite: Wer von außen auf mordsteam.com/ kommt und nicht aus dem
// deutschsprachigen Raum (DACH + Liechtenstein) stammt, landet auf der englischen Seite /en/.
// Ausnahmen, die immer auf Deutsch bleiben:
//   - Browsersprache Deutsch (z. B. Österreicher im Urlaub)
//   - Klicks innerhalb der eigenen Seite (Sprachumschalter „DE“) und ?lang=de
//   - Suchmaschinen-Crawler (sie sollen beide Sprachversionen sehen; hreflang regelt den Rest)
//   - Teaser-Modus: gibt es /en/ nicht, wird nicht umgeleitet
// Keine Cookies, kein Tracking: Es wird nur das Land aus der Anfrage (Cloudflare) gelesen.
const DACH = ["AT", "DE", "CH", "LI"];

export async function onRequest(ctx) {
  const { request, env, next } = ctx;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== "/") return next();
  if (url.searchParams.get("lang") === "de") return next();
  const country = String(request.cf?.country || "").toUpperCase();
  if (!country || DACH.includes(country)) return next();
  const ref = request.headers.get("referer") || "";
  try { if (ref && new URL(ref).host === url.host) return next(); } catch {}
  if (/^\s*de\b/i.test(request.headers.get("accept-language") || "")) return next();
  if (/bot|crawl|spider|slurp|facebookexternalhit|preview/i.test(request.headers.get("user-agent") || "")) return next();
  try {
    const en = await env.ASSETS.fetch(new URL("/en/", url));
    // Pages liefert für fehlende Seiten u. U. die Startseite aus – daher auf die englische Seite prüfen
    if (!en.ok || !(await en.text()).includes('<html lang="en">')) return next();
  } catch { return next(); }
  return new Response(null, { status: 302, headers: { location: "/en/" + url.search, "cache-control": "no-store", vary: "accept-language" } });
}
