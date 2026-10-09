// Titelbilder der Fälle als Bilddateien: site/assets/cover/<fall>-<de|en>.webp (600 × 750).
// Quelle: lib/art/covers.js. Braucht Playwright mit Chromium (läuft in Claudes Arbeitsumgebung) und Python mit Pillow.
// Aufruf: node tools/cover_bilder.mjs   – danach site/assets/cover/ committen.
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { COVERS, cover } from "../lib/art/covers.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "site", "assets", "cover");
const PW = process.env.PLAYWRIGHT_MODULE || "/home/claude/.npm-global/lib/node_modules/playwright/index.mjs";
const { chromium } = await import(PW);
fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cover-"));
const css = "file://" + path.join(ROOT, "site", "assets", "style.css");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 600, height: 750 }, deviceScaleFactor: 1 });
const done = [];
for (const key of Object.keys(COVERS)) for (const lang of ["de", "en"]) {
  const html = path.join(tmp, "c.html");
  fs.writeFileSync(html, `<!doctype html><meta charset=utf-8><link rel=stylesheet href="${css}"><body style="margin:0;background:#000"><div style="width:600px;line-height:0">${cover(key, lang === "en")}</div>`);
  await p.goto("file://" + html);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150);
  const png = path.join(tmp, `${key}-${lang}.png`);
  await p.screenshot({ path: png, clip: { x: 0, y: 0, width: 600, height: 750 } });
  done.push([png, path.join(OUT, `${key}-${lang}.webp`)]);
}
await b.close();
execFileSync("python3", ["-c", "import sys\nfrom PIL import Image\na=sys.argv[1:]\nfor i in range(0,len(a),2): Image.open(a[i]).convert('RGB').save(a[i+1],'WEBP',quality=84,method=6)", ...done.flat()]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log("Titelbilder geschrieben:", done.map((d) => path.basename(d[1])).join(", "));
