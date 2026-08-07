// Render the LinkedIn Company Page cover. Current spec (verified May 2026 via
// Sprout): 4200x700 px minimum AND recommended (6:1). The old 1128x191 / 2256x382
// specs are outdated and get rejected for being under the 4200x700 minimum.
//   node scripts/render-linkedin-cover.mjs
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.resolve(__dirname, "..", "videos", "binsparkle", "assets", "brand", "linkedin-cover.html");
const OUT = path.resolve(__dirname, "..", "videos", "binsparkle", "assets", "brand", "linkedin-cover-4200x700.png");
const W = 4200, H = 700;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto("file:///" + HTML.replace(/\\/g, "/"), { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800); // settle web fonts
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log("wrote " + OUT);
