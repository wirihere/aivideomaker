// Brand-extraction probe: run scrape-page + curl-mode token + pull-assets
// candidate-extraction against each URL, capture what worked / failed.
// Writes one JSON report per URL into docs/system-audit-2026-04-27/_data/.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { scrapePage } from "../../scripts/lib/scrape-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(__dirname, "_data");
fs.mkdirSync(outDir, { recursive: true });

const URLS = [
  { name: "headspace", url: "https://www.headspace.com" },
  { name: "calm", url: "https://www.calm.com" },
  { name: "patek", url: "https://www.patek.com" },
  { name: "aesop", url: "https://www.aesop.com" },
  { name: "margiela-fragrances", url: "https://maisonmargiela-fragrances.com" },
];

// curl-style hex extraction (mirrors new-comp.mjs's curl-mode logic)
function curlExtract(html) {
  const cssVars = new Map();
  for (const m of html.matchAll(/--([a-z][a-z0-9-]*?)\s*:\s*([^;}\n]+)[;}]/gi)) {
    const k = m[1].toLowerCase();
    if (!cssVars.has(k)) cssVars.set(k, m[2].trim());
  }
  const hexes = [];
  for (const m of html.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    let h = m[1].toUpperCase();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    hexes.push("#" + h);
  }
  const freq = new Map();
  for (const c of hexes) freq.set(c, (freq.get(c) || 0) + 1);
  const top = [...freq.entries()]
    .filter(([h]) => !/^#(FFFFFF|000000|FAFAFA|F5F5F5|EEEEEE|111111|222222)$/i.test(h))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const fontImports = [...html.matchAll(/@import\s+url\(["']?(https:\/\/fonts\.googleapis\.com[^"')]+)["']?\)/g)].map((m) => m[1]);
  const fontFamilies = [...html.matchAll(/font-family\s*:\s*([^;}\n]+)[;}]/g)]
    .map((m) => m[1].replace(/['"]/g, "").trim())
    .slice(0, 8);
  const logoSrc = (html.match(/<img[^>]+src=["']([^"']+(?:logo|brand|mark)[^"']*)["']/i)?.[1] || "").trim();
  const ogImage = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || "").trim();
  return {
    cssVarsCount: cssVars.size,
    cssVarsBrandKeys: [...cssVars.keys()].filter((k) => /(brand|primary|accent|color)/.test(k)).slice(0, 6),
    topHexes: top.map(([h, n]) => ({ hex: h, count: n })),
    fontImports,
    fontFamiliesFound: fontFamilies.length,
    fontFamiliesSample: fontFamilies.slice(0, 4),
    logoImgFound: !!logoSrc,
    ogImage: ogImage || null,
    htmlLen: html.length,
  };
}

async function probe({ name, url }) {
  const t0 = Date.now();
  const report = { name, url, durationMs: 0, scrape: null, curl: null, errors: [] };

  // 1. curl
  let html = "";
  try {
    html = execSync(`curl -s -L --max-time 25 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" "${url}"`, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (err) {
    report.errors.push(`curl: ${err.message}`);
  }
  report.curl = html ? curlExtract(html) : { error: "no html" };

  // 2. scrape-page (Playwright)
  try {
    const scrape = await scrapePage(url, { timeoutMs: 30000, settleMs: 2500 });
    report.scrape = {
      finalUrl: scrape.finalUrl,
      title: scrape.title,
      titleLen: scrape.title?.length || 0,
      metaDescription: scrape.metaDescription,
      metaDescriptionLen: scrape.metaDescription?.length || 0,
      ogTagsCount: Object.keys(scrape.ogTags || {}).length,
      ogTagsKeys: Object.keys(scrape.ogTags || {}).slice(0, 8),
      ogImage: scrape.ogTags?.["og:image"] || null,
      jsonLdCount: (scrape.jsonLd || []).length,
      jsonLdTypes: (scrape.jsonLd || []).map((j) => j?.["@type"]).filter(Boolean).slice(0, 6),
      h1Count: scrape.h1.length,
      h1Sample: scrape.h1.slice(0, 3),
      h2Count: scrape.h2.length,
      h2Sample: scrape.h2.slice(0, 3),
      h3Count: scrape.h3.length,
      paragraphsCount: scrape.paragraphs.length,
      paragraphSample: scrape.paragraphs.slice(0, 3).map((p) => p.slice(0, 200)),
      listItemsCount: scrape.listItems.length,
      listItemSample: scrape.listItems.slice(0, 3),
      ctaCount: scrape.ctaCandidates.length,
      ctaSample: scrape.ctaCandidates.slice(0, 5).map((c) => ({ text: c.text, score: c.score, href: c.href?.slice(0, 80) })),
      visibleTextLen: scrape.visibleText?.length || 0,
      visibleTextSample: (scrape.visibleText || "").slice(0, 600),
      stats: scrape.stats,
    };
  } catch (err) {
    report.errors.push(`scrape: ${err.message}`);
    report.scrape = { error: err.message };
  }

  report.durationMs = Date.now() - t0;
  const outPath = path.join(outDir, `${name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`[${name}] ${report.durationMs}ms · scrape:${report.scrape?.h1Count ?? "?"}h1/${report.scrape?.paragraphsCount ?? "?"}p · curl:${report.curl?.topHexes?.length ?? "?"} hexes`);
  return report;
}

const results = [];
for (const u of URLS) {
  try {
    results.push(await probe(u));
  } catch (err) {
    console.error(`[${u.name}] FATAL ${err.message}`);
    results.push({ name: u.name, url: u.url, fatal: err.message });
  }
}

fs.writeFileSync(path.join(outDir, "_summary.json"), JSON.stringify(results, null, 2));
console.log(`\nWrote ${results.length} reports to ${outDir}`);
