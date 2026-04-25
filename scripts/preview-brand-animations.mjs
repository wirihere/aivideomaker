// Load the brand animations preview in headless Chrome, wait 5s for SMIL to finish,
// and dump a screenshot so we can sanity-check both SVGs render correctly.

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const previewUrl = "file:///" + path.join(projectRoot, "assets", "brand-animations", "preview.html").replace(/\\/g, "/");
const outPath = path.join(projectRoot, "debug", "brand-animations-preview.png");

console.log(`[preview] Loading: ${previewUrl}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

try {
  await page.goto(previewUrl, { waitUntil: "networkidle", timeout: 20000 });
  // Let SMIL animations run to completion (~4.2s) plus a buffer
  await page.waitForTimeout(5000);
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`[preview] Screenshot saved: ${outPath}`);
} catch (err) {
  console.error(`[preview] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
