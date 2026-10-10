// Vorschaubilder für geteilte Links (Facebook, WhatsApp, LinkedIn …) und Bilder für Social-Posts im Teaser-Stil:
// Lupe, MORDSTEAM, Coming soon, „Könnt ihr den Fall knacken?“, rote Box „Nichts verpassen · Newsletter abonnieren“.
//   site/assets/og/teaser-de.png, teaser-en.png   1200 × 630 (og:image)
//   site/assets/og/post-de.png, post-en.png       1080 × 1350 (Instagram/Facebook-Beitrag, 4:5)
// Braucht Playwright mit Chromium. Aufruf: node tools/og_bilder.mjs
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "site", "assets", "og");
const F = "file://" + path.join(ROOT, "site", "assets", "fonts");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "/home/claude/.npm-global/lib/node_modules/playwright/index.mjs");
const T = {
  de: { q: "Könnt ihr den Fall knacken?", b: "Nichts verpassen", s: "Newsletter abonnieren" },
  en: { q: "Can you crack the case?", b: "Don’t miss a thing", s: "Sign up for our newsletter" },
};
const page = (lang, W, H, k) => `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:Fraunces;font-weight:900;src:url(${F}/fraunces-latin-900-normal.woff2)}
@font-face{font-family:Fraunces;font-weight:700;src:url(${F}/fraunces-latin-700-normal.woff2)}
@font-face{font-family:Mono;font-weight:500;src:url(${F}/ibm-plex-mono-latin-500-normal.woff2)}
body{margin:0}
.p{width:${W}px;height:${H}px;background:#F3EFE6;color:#15171C;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Fraunces,serif}
svg{width:${150 * k}px;height:auto;margin-bottom:${22 * k}px}
h1{margin:0;font-weight:900;font-size:${104 * k}px;letter-spacing:.02em;line-height:1}h1 span{color:#B3261E}
.soon{margin:${26 * k}px 0 0;font:500 ${20 * k}px Mono,monospace;letter-spacing:.35em;color:#B3261E;padding-left:.35em}
.q{margin:${16 * k}px 0 0;font-weight:700;font-style:italic;font-size:${38 * k}px}
.box{margin-top:${34 * k}px;background:#B3261E;color:#fff;border-radius:${6 * k}px;padding:${20 * k}px ${44 * k}px ${18 * k}px ${50 * k}px;box-shadow:0 ${10 * k}px ${26 * k}px rgba(179,38,30,.28);font-family:Mono,monospace}
.box b{display:block;font-weight:500;font-size:${30 * k}px;letter-spacing:.22em;text-transform:uppercase}
.box small{display:block;margin-top:${8 * k}px;font-size:${18 * k}px;letter-spacing:.12em}
.url{margin-top:${30 * k}px;font:500 ${20 * k}px Mono,monospace;letter-spacing:.12em;color:#5A5D66}
</style><div class="p">
<svg viewBox="0 0 34 34"><g fill="none" stroke="#15171C" stroke-width="3"><circle cx="14" cy="14" r="9"/><line x1="20.5" y1="20.5" x2="29" y2="29" stroke-linecap="round"/></g><circle cx="14" cy="14" r="3.5" fill="#B3261E"/></svg>
<h1><span>MORDS</span>TEAM</h1><p class="soon">COMING SOON</p><p class="q">${T[lang].q}</p>
<div class="box"><b>${T[lang].b}</b><small>${T[lang].s}</small></div><div class="url">mordsteam.com${lang === "en" ? "/en/newsletter" : "/newsletter"}</div></div>`;

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
const b = await chromium.launch();
for (const [name, W, H, k] of [["teaser", 1200, 630, 0.82], ["post", 1080, 1350, 1.25]]) for (const lang of ["de", "en"]) {
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(tmp, "p.html"), page(lang, W, H, k));
  await p.goto("file://" + path.join(tmp, "p.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(OUT, `${name}-${lang}.png`) }); await p.close();
}
await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
console.log("geschrieben:", fs.readdirSync(OUT).join(", "));
