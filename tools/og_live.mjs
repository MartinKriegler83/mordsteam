// Vorschaubilder für geteilte Links der Live-Seite (seit 15.10.2026), 1200 × 630, in site/assets/og/:
//   home-de.jpg / home-en.jpg (alle Seiten) und special-de.jpg / special-en.jpg (Specials), eingebunden über tools/og_tags.py.
// Braucht Playwright mit Chromium und Python/Pillow (PNG → JPG). Aufruf: node tools/og_live.mjs
import fs from "fs"; import os from "os"; import path from "path"; import { fileURLToPath } from "url"; import { execFileSync } from "child_process";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "/home/claude/.npm-global/lib/node_modules/playwright/index.mjs");
const A = "file://" + path.join(ROOT, "site", "assets") + "/";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "oglive-"));
const css = `@font-face{font-family:F;src:url(${A}fonts/fraunces-latin-900-normal.woff2);font-weight:900}
@font-face{font-family:F;src:url(${A}fonts/fraunces-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:P;src:url(${A}fonts/ibm-plex-sans-latin-500-normal.woff2)}
@font-face{font-family:M;src:url(${A}fonts/ibm-plex-mono-latin-500-normal.woff2)}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden}
.c{width:1200px;height:630px;display:flex;align-items:center;padding:0 64px;gap:40px;position:relative}
.t{flex:1}.logo{display:flex;align-items:center;gap:14px;font:900 44px F;letter-spacing:1px}.logo b{font-weight:900}
.h{font:900 64px/1.02 F;margin-top:30px}.s{font:500 25px/1.35 P;margin-top:20px}.u{font:500 20px M;letter-spacing:2px;margin-top:34px;text-transform:uppercase}
.covers{position:relative;width:470px;height:520px}.covers img{position:absolute;width:280px;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.35)}`;
const mag = (c1, c2) => `<svg width="46" height="46" viewBox="0 0 48 48"><circle cx="20" cy="20" r="14" fill="none" stroke="${c1}" stroke-width="5"/><circle cx="20" cy="20" r="6" fill="${c2}"/><path d="M30 30 L42 42" stroke="${c1}" stroke-width="5" stroke-linecap="round"/></svg>`;
const V = {
  "home-de": { bg: "#F3EFE6", ink: "#15171C", head: "Könnt ihr den Fall knacken?", sub: "Digitale Krimispiele fürs Team, den Freundeskreis oder allein – am Handy, Tablet oder Laptop.", url: "mordsteam.com", covers: ["t001-de", "friends-de", "solo001-de", "special001-de"] },
  "home-en": { bg: "#F3EFE6", ink: "#15171C", head: "Can you crack the case?", sub: "Digital murder mysteries for your team, your friends or just you – on phone, tablet or laptop.", url: "mordsteam.com/en", covers: ["t001-en", "friends-en", "solo001-en", "special001-en"] },
  "special-de": { bg: "#15171C", ink: "#F3EFE6", head: "Ein Skelett zu viel.", sub: "Das Halloween-Special: ein Krimi für dich allein. 50 Minuten, 4 Fragen – 8,90 €.", url: "mordsteam.com/specials", covers: ["special001-de"] },
  "special-en": { bg: "#15171C", ink: "#F3EFE6", head: "One skeleton too many.", sub: "The Halloween Special: a murder mystery just for you. 50 minutes, 4 questions.", url: "mordsteam.com/en/specials", covers: ["special001-en"] },
};
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
for (const [k, v] of Object.entries(V)) {
  const pos = v.covers.length === 1 ? [[95, 30, 0]] : [[0, 90, -8], [110, 55, -3], [220, 25, 3], [190, 150, 7]];
  const imgs = v.covers.map((c, i) => `<img src="${A}cover/${c}.webp" style="width:${v.covers.length === 1 ? 360 : 230}px;left:${pos[i][0]}px;top:${pos[i][1]}px;transform:rotate(${pos[i][2]}deg)">`).join("");
  fs.writeFileSync(`${TMP}/${k}.html`, `<style>${css}</style><div class="c" style="background:${v.bg};color:${v.ink}"><div class="t"><div class="logo">${mag(v.ink, "#B3261E")}<span><b style="color:#B3261E">MORDS</b>TEAM</span></div><div class="h">${v.head}</div><div class="s">${v.sub}</div><div class="u" style="color:#B3261E">${v.url}</div></div><div class="covers">${imgs}</div></div>`); await pg.goto(`file://${TMP}/${k}.html`);
  await pg.waitForTimeout(600); await pg.screenshot({ path: `${TMP}/${k}.png` });
  execFileSync("python3", ["-c", `from PIL import Image; Image.open("${TMP}/${k}.png").convert("RGB").save("${path.join(ROOT, "site", "assets", "og", k + ".jpg")}", quality=88, optimize=True, progressive=True)`]);
}
await b.close(); console.log("geschrieben: site/assets/og/{home,special}-{de,en}.jpg");
