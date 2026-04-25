// Fetch SVG illustrations from unDraw (https://undraw.co) — no API key needed.
//
// unDraw's CDN serves illustrations at predictable URLs. This script scrapes
// the search page once to resolve a slug → file URL, then downloads the SVG
// and rewrites its primary brand color via a string substitution (unDraw uses
// #6c63ff as the customizable accent).
//
// Usage:
//   node scripts/fetch-undraw.mjs working_remotely
//   node scripts/fetch-undraw.mjs working_remotely --color=4f46e5 --name=remote.svg
//   node scripts/fetch-undraw.mjs --search="team meeting"
//
// Output: assets/illustrations/<name>.svg

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "illustrations");

// --- Args ---------------------------------------------------------------------
const args = process.argv.slice(2);
const opts = { slug: null, search: null, color: "6c63ff", name: null };

for (const a of args) {
  if (a.startsWith("--search=")) opts.search = a.slice("--search=".length);
  else if (a.startsWith("--color=")) opts.color = a.slice("--color=".length).replace(/^#/, "");
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) opts.slug = a;
}

if (!opts.slug && !opts.search) {
  console.log(`Usage:
  node scripts/fetch-undraw.mjs <slug> [--color=4f46e5] [--name=foo.svg]
  node scripts/fetch-undraw.mjs --search="<query>"

Examples:
  node scripts/fetch-undraw.mjs working_remotely
  node scripts/fetch-undraw.mjs --search="team meeting" --color=ec4899

Slug format on unDraw is snake_case ("working_remotely", "data_processing").
You can find slugs at https://undraw.co — the URL after clicking through to
an illustration ends in /<slug>.`);
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1400, height: 900 },
});
const page = await ctx.newPage();

// Capture .svg URLs from network
const svgUrls = new Set();
page.on("response", (resp) => {
  const url = resp.url();
  if (url.includes(".svg") && url.includes("undraw")) {
    svgUrls.add(url);
  }
});

try {
  let pageUrl;
  if (opts.search) {
    pageUrl = `https://undraw.co/search?term=${encodeURIComponent(opts.search)}`;
  } else {
    pageUrl = `https://undraw.co/illustrations/${encodeURIComponent(opts.slug)}`;
  }
  console.log(`[fetch] Page: ${pageUrl}`);

  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // For search, click first result
  if (opts.search) {
    const firstResult = page.locator('a[href*="/illustrations/"]').first();
    if (await firstResult.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await firstResult.getAttribute("href");
      console.log(`[fetch] First result: ${href}`);
      await firstResult.click();
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    } else {
      throw new Error(`No results for "${opts.search}"`);
    }
  }

  // Pull SVG URL from <img> or background
  let svgUrl = [...svgUrls].find((u) => u.endsWith(".svg"));

  if (!svgUrl) {
    svgUrl = await page.evaluate(() => {
      // Look at all images
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.src || img.getAttribute("src") || "";
        if (src.endsWith(".svg") && src.includes("undraw")) return src;
      }
      // Look at all object/embed
      const objs = Array.from(document.querySelectorAll("object, embed"));
      for (const o of objs) {
        const src = o.getAttribute("data") || o.getAttribute("src") || "";
        if (src.endsWith(".svg") && src.includes("undraw")) return src;
      }
      return null;
    });
  }

  if (!svgUrl) {
    throw new Error("Could not find an unDraw SVG URL on the page.");
  }
  console.log(`[fetch] SVG URL: ${svgUrl}`);

  // Download via browser's request context (preserves cookies)
  const response = await ctx.request.get(svgUrl);
  if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
  let body = (await response.text()).toString();

  // Recolor: unDraw uses #6c63ff as the customizable brand color.
  if (opts.color && opts.color.toLowerCase() !== "6c63ff") {
    body = body.replace(/#6c63ff/gi, `#${opts.color}`);
  }

  const outName = opts.name || `${opts.slug || "undraw"}.svg`;
  const outPath = path.join(outDir, outName.endsWith(".svg") ? outName : `${outName}.svg`);
  fs.writeFileSync(outPath, body, "utf8");
  console.log(`[fetch] Saved: ${path.relative(projectRoot, outPath)} (${(body.length / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error(`[fetch] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
