// Fetch a Pixabay photo by search term — no API key required.
// Uses the same scrape pattern as fetch-pixabay-music.mjs: navigate the search
// page, find the largest image URL on the first result, download with cookies.
//
// Usage:
//   node scripts/fetch-pixabay-photo.mjs "mountain sunrise" mountain.jpg
//   node scripts/fetch-pixabay-photo.mjs "city night" --orientation=horizontal
//   node scripts/fetch-pixabay-photo.mjs "office desk" --index=2

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "photos");

// --- Args ---------------------------------------------------------------------
const args = process.argv.slice(2);
const opts = { term: null, name: null, orientation: null, index: 0 };

const positional = [];
for (const a of args) {
  if (a.startsWith("--orientation=")) opts.orientation = a.slice("--orientation=".length);
  else if (a.startsWith("--index=")) opts.index = parseInt(a.slice("--index=".length), 10) || 0;
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) positional.push(a);
}
opts.term = positional[0];
if (!opts.name) opts.name = positional[1];

if (!opts.term) {
  console.log(`Usage:
  node scripts/fetch-pixabay-photo.mjs "<query>" [name.jpg] [--orientation=horizontal|vertical] [--index=N]

Examples:
  node scripts/fetch-pixabay-photo.mjs "mountain sunrise" hero.jpg
  node scripts/fetch-pixabay-photo.mjs "office team" --orientation=horizontal
  node scripts/fetch-pixabay-photo.mjs "city night" --index=2  # third result`);
  process.exit(0);
}

if (!opts.name) {
  // slugify the term
  opts.name = opts.term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".jpg";
}

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);

const orientationParam = opts.orientation ? `?orientation=${opts.orientation}` : "";
const searchUrl = `https://pixabay.com/images/search/${encodeURIComponent(opts.term)}/${orientationParam}`;
console.log(`[fetch] Search: ${searchUrl}`);
console.log(`[fetch] Out:    ${outPath}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1400, height: 900 },
});
const page = await ctx.newPage();

try {
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

  // Cookies
  try {
    const cookieBtn = page.getByRole("button", { name: /accept|agree|got it|consent|ok/i });
    if (await cookieBtn.isVisible({ timeout: 3000 })) await cookieBtn.click();
  } catch {}

  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Click into the Nth result. Match real detail pages /photos/<slug>-<id>/
  // (bare /photos/ is a hidden nav dropdown that traps the locator).
  const links = page.locator('a[href^="/photos/"]:visible')
    .and(page.locator('a[href*="-"][href$="/"]'));
  await links.first().waitFor({ state: "visible", timeout: 15000 });

  const count = await links.count();
  if (count === 0) throw new Error("No photo results found.");
  const targetIdx = Math.min(opts.index, count - 1);
  console.log(`[fetch] Clicking result #${targetIdx + 1} of ${count}`);

  await links.nth(targetIdx).click();
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // The detail page exposes the image via <img srcset>. Pull the largest src.
  const imageUrl = await page.evaluate(() => {
    // Pixabay typically puts the main hero image as a <picture> or <img> with
    // a recognizable URL pattern (cdn.pixabay.com).
    const imgs = Array.from(document.querySelectorAll("img"));
    let bestUrl = null;
    let bestArea = 0;
    for (const img of imgs) {
      const src = img.src || img.getAttribute("src") || "";
      if (!src.includes("cdn.pixabay.com")) continue;
      // Pick the visibly-largest one
      const area = (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0);
      if (area > bestArea) {
        bestArea = area;
        bestUrl = src;
      }
    }
    // If srcset exists, prefer the largest entry
    for (const img of imgs) {
      const srcset = img.getAttribute("srcset");
      if (!srcset || !srcset.includes("cdn.pixabay.com")) continue;
      const entries = srcset.split(",").map((s) => {
        const [url, w] = s.trim().split(/\s+/);
        return { url, w: parseInt((w || "0").replace("w", ""), 10) };
      });
      entries.sort((a, b) => b.w - a.w);
      if (entries[0]?.url) return entries[0].url;
    }
    return bestUrl;
  });

  if (!imageUrl) throw new Error("Could not locate image URL on detail page.");
  console.log(`[fetch] Image: ${imageUrl}`);

  const response = await ctx.request.get(imageUrl, {
    headers: { Referer: page.url() },
  });
  if (!response.ok()) throw new Error(`HTTP ${response.status()} ${response.statusText()}`);
  const body = await response.body();
  fs.writeFileSync(outPath, body);
  const stats = fs.statSync(outPath);
  console.log(`[fetch] Saved: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error(`[fetch] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
