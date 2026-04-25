// Fetch a Pixabay sound effect by search term OR direct URL; save to assets/sfx/<name>.mp3.
//
// Mirror of scripts/fetch-pixabay-music.mjs but targeting /sound-effects/ pages.
// Same approach: navigate, click Play to load audio, capture .mp3 URL from network,
// download with browser cookies/headers.
//
// Usage:
//   node scripts/fetch-pixabay-sfx.mjs "whoosh transition" whoosh.mp3
//   node scripts/fetch-pixabay-sfx.mjs "https://pixabay.com/sound-effects/whoosh-12345/" whoosh.mp3

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const term = process.argv[2] || "whoosh";
const outName = process.argv[3] || "sfx.mp3";
const outDir = path.join(projectRoot, "assets", "sfx");
const outPath = path.join(outDir, outName);

fs.mkdirSync(outDir, { recursive: true });

const isDirectUrl = /^https?:\/\/(?:www\.)?pixabay\.com\/sound-effects\//i.test(term);
const startUrl = isDirectUrl
  ? term
  : `https://pixabay.com/sound-effects/search/${encodeURIComponent(term)}/`;
console.log(`[sfx] ${isDirectUrl ? "Direct" : "Search"}: ${startUrl}`);
console.log(`[sfx] Out:    ${outPath}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  acceptDownloads: true,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1400, height: 900 },
});
const page = await ctx.newPage();

const mp3Urls = new Set();
page.on("response", (resp) => {
  const url = resp.url();
  if (url.includes(".mp3") || url.includes("audio/vorbis") || url.includes("audio/mpeg")) {
    mp3Urls.add(url);
  }
});

try {
  await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

  // Accept cookies
  try {
    const cookieBtn = page.getByRole("button", { name: /accept|agree|got it|consent|ok/i });
    if (await cookieBtn.isVisible({ timeout: 3000 })) {
      await cookieBtn.click();
    }
  } catch {}

  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Click the first play button — sound-effects results use the same pattern as music.
  const playStrategies = [
    () => page.getByRole("button", { name: /^play/i }).first(),
    () => page.locator('button[aria-label*="play" i]').first(),
    () => page.locator('[role="button"][aria-label*="play" i]').first(),
    () => page.locator('button:has(svg)').first(),
  ];

  let playBtn = null;
  for (const [i, make] of playStrategies.entries()) {
    const loc = make();
    try {
      await loc.waitFor({ state: "visible", timeout: 4000 });
      playBtn = loc;
      console.log(`[sfx] Play button via strategy #${i + 1}`);
      break;
    } catch {}
  }

  if (playBtn) {
    await playBtn.click().catch(() => {});
    await page.waitForTimeout(4000);
  } else {
    console.log("[sfx] No play button — waiting anyway");
    await page.waitForTimeout(2000);
  }

  console.log(`[sfx] MP3 URLs so far: ${mp3Urls.size}`);
  for (const u of mp3Urls) console.log(`  ${u}`);

  if (mp3Urls.size === 0) {
    const audioSrcs = await page.evaluate(() => {
      const audios = Array.from(document.querySelectorAll("audio"));
      return audios.map((a) => a.src || a.getAttribute("src")).filter(Boolean);
    });
    for (const s of audioSrcs) {
      console.log(`  <audio> src: ${s}`);
      mp3Urls.add(s);
    }
  }

  if (mp3Urls.size === 0) {
    throw new Error("No mp3 URLs found via network or DOM");
  }

  const mp3Url = [...mp3Urls][0];
  console.log(`[sfx] Downloading: ${mp3Url}`);

  const response = await ctx.request.get(mp3Url, {
    headers: { Referer: startUrl },
  });
  if (!response.ok()) {
    throw new Error(`HTTP ${response.status()} ${response.statusText()}`);
  }
  const body = await response.body();
  fs.writeFileSync(outPath, body);
  const stats = fs.statSync(outPath);
  console.log(`[sfx] Saved: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error(`[sfx] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
