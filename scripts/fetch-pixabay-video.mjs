// Fetch a Pixabay video by search term OR direct URL — no API key required.
// Same scrape pattern as the music/photo fetchers: navigate, find video URL, download.
//
// Usage:
//   node scripts/fetch-pixabay-video.mjs "city traffic" traffic.mp4
//   node scripts/fetch-pixabay-video.mjs "ocean waves" --index=1
//   node scripts/fetch-pixabay-video.mjs "https://pixabay.com/videos/traffic-1234/" out.mp4

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "videos");

// --- Args ---------------------------------------------------------------------
const args = process.argv.slice(2);
const opts = { term: null, name: null, index: 0 };

const positional = [];
for (const a of args) {
  if (a.startsWith("--index=")) opts.index = parseInt(a.slice("--index=".length), 10) || 0;
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) positional.push(a);
}
opts.term = positional[0];
if (!opts.name) opts.name = positional[1];

if (!opts.term) {
  console.log(`Usage:
  node scripts/fetch-pixabay-video.mjs "<query>" [name.mp4] [--index=N]

Examples:
  node scripts/fetch-pixabay-video.mjs "city traffic" traffic.mp4
  node scripts/fetch-pixabay-video.mjs "ocean waves" --index=1`);
  process.exit(0);
}

// Detect a direct Pixabay URL vs a search term
const isDirectUrl = /^https?:\/\/(?:www\.)?pixabay\.com\/videos\/[^\/]+-\d+\/?/i.test(opts.term);

if (!opts.name) {
  const slug = isDirectUrl
    ? (opts.term.match(/\/videos\/([^\/?#]+?)-\d+\/?/) || [, "pixabay-video"])[1]
    : opts.term;
  opts.name = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".mp4";
}

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);

const startUrl = isDirectUrl
  ? opts.term
  : `https://pixabay.com/videos/search/${encodeURIComponent(opts.term)}/`;
console.log(`[fetch] ${isDirectUrl ? "Direct" : "Search"}: ${startUrl}`);
console.log(`[fetch] Out:    ${outPath}`);

const intentKey = cacheKey(`${startUrl}#index=${opts.index}`);
const hit = await cacheGet(intentKey);
if (hit) {
  fs.copyFileSync(hit, outPath);
  const stats = fs.statSync(outPath);
  console.log(`[fetch] cache hit ${intentKey.slice(0, 12)}…`);
  console.log(`[fetch] Saved: ${outPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1400, height: 900 },
});
const page = await ctx.newPage();

// Capture mp4 URLs
const mp4Urls = new Set();
page.on("response", (resp) => {
  const url = resp.url();
  if (url.includes(".mp4") && url.includes("pixabay")) {
    mp4Urls.add(url);
  }
});

try {
  await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

  try {
    const cookieBtn = page.getByRole("button", { name: /accept|agree|got it|consent|ok/i });
    if (await cookieBtn.isVisible({ timeout: 3000 })) await cookieBtn.click();
  } catch {}

  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (!isDirectUrl) {
    // Click into a result detail page. Match /videos/<slug>-<id>/, not bare /videos/.
    const links = page.locator('a[href^="/videos/"]:visible')
      .and(page.locator('a[href*="-"][href$="/"]'));
    await links.first().waitFor({ state: "visible", timeout: 15000 });

    const count = await links.count();
    if (count === 0) throw new Error("No video results found.");
    const targetIdx = Math.min(opts.index, count - 1);
    console.log(`[fetch] Clicking result #${targetIdx + 1} of ${count}`);

    await links.nth(targetIdx).click();
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
  }

  // Try clicking play to trigger the video to load
  const playStrategies = [
    () => page.locator('video').first(),
    () => page.locator('button[aria-label*="play" i]').first(),
    () => page.locator('button:has(svg)').first(),
  ];
  for (const make of playStrategies) {
    try {
      const loc = make();
      await loc.waitFor({ state: "visible", timeout: 3000 });
      await loc.click().catch(() => {});
      break;
    } catch {}
  }
  await page.waitForTimeout(3000);

  // Look for <video> src or <source> in DOM
  if (mp4Urls.size === 0) {
    const fromDom = await page.evaluate(() => {
      const out = [];
      const vids = Array.from(document.querySelectorAll("video"));
      for (const v of vids) {
        if (v.src) out.push(v.src);
        for (const s of Array.from(v.querySelectorAll("source"))) {
          const src = s.src || s.getAttribute("src");
          if (src) out.push(src);
        }
      }
      return out.filter((u) => u && u.includes(".mp4"));
    });
    for (const u of fromDom) mp4Urls.add(u);
  }

  console.log(`[fetch] MP4 URLs found: ${mp4Urls.size}`);
  for (const u of mp4Urls) console.log(`  ${u}`);

  if (mp4Urls.size === 0) throw new Error("No mp4 URLs found.");

  // Prefer larger files: pixabay URLs encode resolution like "_large", "_medium",
  // and the bitrate / size in the path. Pick the one with the largest filesize
  // by HEADing each.
  const urls = [...mp4Urls];
  let best = urls[0];
  let bestSize = 0;
  for (const u of urls) {
    try {
      const head = await ctx.request.head(u);
      const size = parseInt(head.headers()["content-length"] || "0", 10);
      if (size > bestSize) {
        bestSize = size;
        best = u;
      }
    } catch {}
  }
  console.log(`[fetch] Picked: ${best}  (${(bestSize / 1024 / 1024).toFixed(2)} MB)`);

  const response = await ctx.request.get(best, {
    headers: { Referer: page.url() },
  });
  if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
  const body = await response.body();
  fs.writeFileSync(outPath, body);

  const cachedPath = await cachePut(intentKey, body, ".mp4");
  console.log(`[fetch] cached at ${path.basename(cachedPath)}`);

  const stats = fs.statSync(outPath);
  console.log(`[fetch] Saved: ${outPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.error(`[fetch] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
