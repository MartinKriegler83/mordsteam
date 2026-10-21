// Geschenkkarte als echtes PDF (12.10.2026): Am iPhone gehen beim „Drucken → als PDF“ die Links verloren, Safari druckt
// Adresse und Datum mit und lässt unten Platz. Deshalb rendert Cloudflare Browser Rendering die Karte selbst als A4-PDF.
// Die Seite wird komplett eingebettet (Schriften, Bilder, Skripte als data:/inline), damit der Renderer nichts nachladen muss –
// so klappt es auch auf der Vorschau mit Login-Schutz. Pages bietet (Stand 12.10.2026) keine Browser-Rendering-Bindung an, deshalb
// REST-API mit den Secrets `BR_API_TOKEN` (Recht „Browser Rendering/Run – Edit“) + `BR_ACCOUNT_ID`; Binding `BROWSER` wird genutzt, falls es das einmal gibt.
const KEEP = ["status", "produkt", "solo_code", "solo_title", "solo_title_en", "solo_min", "event_date", "org_token", "org_short", "plus", "teams", "mode", "days", "nr", "error",
  "code", "case_id", "lang", "title", "title_en", "min", "created_at", "promo", "promo_label", "promo_until"];
const COVERS = ["solo001", "solo002", "soloplus", "special001", "special002", "friends"];

function b64(buf) {
  const u = new Uint8Array(buf); let s = "";
  for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode(...u.subarray(i, i + 32768));
  return btoa(s);
}
async function asset(env, base, path, binary) {
  let url = new URL(path, base);
  for (let i = 0; i < 3; i++) {
    const r = await env.ASSETS.fetch(new Request(url, { redirect: "manual" }));
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { url = new URL(r.headers.get("location"), url); continue; }
    if (!r.ok) throw new Error("Asset fehlt: " + path);
    return binary ? r.arrayBuffer() : r.text();
  }
  throw new Error("Asset-Umleitung: " + path);
}
const js = (x) => JSON.stringify(x).replace(/</g, "\\u003c");

// data = Antwort von /api/shop/status bzw. /api/solo/geschenk (schon geprüft), form = Widmung
export async function giftPdfHtml(env, origin, { kind, data, lang, form }) {
  const pre = {}; for (const k of KEEP) if (data[k] !== undefined) pre[k] = data[k];
  let html = await asset(env, origin, "/geschenk.html");
  let css = await asset(env, origin, "/assets/style.css");
  for (const m of [...new Set(css.match(/url\(fonts\/[^)]+\.woff2\)/g) || [])]) {
    const f = m.slice(4, -1);
    css = css.split(m).join(`url(data:font/woff2;base64,${b64(await asset(env, origin, "/assets/" + f, true))})`);
  }
  const img = {};
  for (const c of COVERS) {
    const p = `/assets/cover/${c}-${lang === "en" ? "en" : "de"}.webp`;
    try { img[p] = "data:image/webp;base64," + b64(await asset(env, origin, p, true)); } catch { /* Karte geht auch ohne Titelbild */ }
  }
  const qr = await asset(env, origin, "/spiel/qrcode.js"), gk = await asset(env, origin, "/assets/geschenk.js");
  const boot = `window.__GK={kind:${js(kind)},lang:${js(lang === "en" ? "en" : "de")},data:${js(pre)},origin:${js(origin)},img:${js(img)},form:${js(form)}};document.documentElement.classList.add("gk-pdf");`;
  // build.sh hängt ?v=… an – deshalb mit Muster ersetzen (Funktion als Ersatz, damit „$“ im Inhalt nichts auslöst)
  const rep = (re, b) => { if (!re.test(html)) throw new Error("geschenk.html geändert: " + re); html = html.replace(re, () => b); };
  rep(/<link rel="stylesheet" href="\/assets\/style\.css(\?[^"]*)?">/, `<style>${css}</style>`);
  html = html.replace(/<link rel="icon"[^>]*>\n?/g, "");
  rep(/<script src="\/spiel\/qrcode\.js(\?[^"]*)?"><\/script>/, `<script>${boot}</script><script>${qr}</script>`);
  rep(/<script src="\/assets\/geschenk\.js(\?[^"]*)?"><\/script>/, `<script>${gk}</script>`);
  return html;
}

export async function giftPdfRender(env, html) {
  try { return await render(env, html); } catch (e) { return { error: "render", detail: String(e && e.message || e).slice(0, 300) }; }
}
async function render(env, html) {
  const opts = { html, pdfOptions: { format: "a4", printBackground: true, preferCSSPageSize: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } },
    gotoOptions: { waitUntil: "load", timeout: 20000 }, viewport: { width: 794, height: 1123 } };
  let r;
  if (env.BROWSER && typeof env.BROWSER.quickAction === "function") r = await env.BROWSER.quickAction("pdf", opts);
  else if (env.BR_API_TOKEN && env.BR_ACCOUNT_ID) {
    const base = env.BR_API_BASE || "https://api.cloudflare.com/client/v4"; // BR_API_BASE nur im lokalen Test
    // Cloudflare hat „Browser Rendering“ in „Browser Run“ umbenannt – neuer Pfad zuerst, alter als Ersatz
    for (const path of ["browser-run", "browser-rendering"]) {
      r = await fetch(`${base}/accounts/${String(env.BR_ACCOUNT_ID).trim()}/${path}/pdf`, { method: "POST", headers: { authorization: `Bearer ${String(env.BR_API_TOKEN).trim()}`, "content-type": "application/json" }, body: JSON.stringify(opts) });
      if (r.status !== 404) break;
    }
  } else return { error: "off" };
  if (!r || !r.ok) return { error: "render", status: r ? r.status : 0, detail: r ? (await r.text().catch(() => "")).split(String(env.BR_API_TOKEN || "\u0000")).join("***").slice(0, 280) : "" };
  const buf = await r.arrayBuffer();
  if (new TextDecoder().decode(new Uint8Array(buf.slice(0, 5))) !== "%PDF-") return { error: "render", detail: "kein PDF" };
  return { pdf: buf };
}

// höchstens 20 PDFs je Anschluss in 10 Minuten (IP nur als Hash, Einträge älter als ein Tag werden gelöscht)
export async function giftPdfLimit(request, env) {
  try {
    const ip = request.headers.get("cf-connecting-ip") || "unknown", now = Date.now();
    const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("mordsteam-pdf:" + ip));
    const h = [...new Uint8Array(d)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS pdf_log (ip TEXT NOT NULL, at INTEGER NOT NULL)").run();
    await env.DB.prepare("DELETE FROM pdf_log WHERE at < ?").bind(now - 86400000).run();
    const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM pdf_log WHERE ip=? AND at > ?").bind(h, now - 600000).first();
    if (c && c.n >= 20) return true;
    await env.DB.prepare("INSERT INTO pdf_log (ip, at) VALUES (?, ?)").bind(h, now).run();
  } catch { /* Begrenzung darf nie blockieren */ }
  return false;
}
