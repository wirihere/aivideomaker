// Reusable full-page Playwright scraper.
//
// Why a dedicated module: extract-copy.mjs's curl-based scraper grabs the raw
// HTML, but for SPAs (Next.js, Vite, anything that renders text in JS) the
// curl response is mostly an empty shell. Framework-mode copy generation needs
// the brand's actual visible voice — h1/h2 lines, real paragraphs, list-item
// bullets — to keep Claude grounded instead of inventing positioning.
//
// Public surface:
//
//   import { scrapePage } from "./lib/scrape-page.mjs";
//   const result = await scrapePage("https://kindred-nz.org");
//   const result = await scrapePage("…", { outPath: "compositions/x.scrape.json" });
//   const result = await scrapePage("…", { timeoutMs: 30000, viewport: {…} });
//
// Result shape (every key always present; arrays may be empty on partial
// failure — never throws on selector miss):
//
//   {
//     url:               <input>,
//     finalUrl:          <after redirects>,
//     title:             <document.title>,
//     metaDescription:   <meta[name=description] | og:description>,
//     ogTags:            { "og:title": "…", "og:image": "…", … },
//     jsonLd:            [ { @type: "Organization", … }, … ],
//     h1:                ["…", …],
//     h2:                ["…", …],
//     h3:                ["…", …],
//     paragraphs:        ["…", …],          (≥24 chars, < 600 chars, deduped)
//     listItems:         ["…", …],          (8-240 chars, deduped)
//     ctaCandidates:     [ { text, href, score }, … ]   (sorted, best first)
//     visibleText:       "…",               (document.body.innerText, capped)
//     stats:             { fetchedAt, durationMs, fellBack, partial }
//   }
//
// Fail-soft contract: if any individual selector phase throws inside the page
// context, we log a [scrape] warning and return a partial result with
// `stats.partial = true`. We only throw on hard launch / navigation failure
// AFTER both `domcontentloaded` and a load fallback both error out.
//
// Reusable: verify-render fingerprint refresh, asset hunt, lint heuristics
// can all consume this without re-reading the page.

import fs from "fs";
import path from "path";

const DEFAULTS = {
  timeoutMs: 20_000,
  settleMs: 1500,                              // SPA hydration window after DOMContentLoaded
  viewport: { width: 1920, height: 1080 },
  visibleTextMaxChars: 18_000,                 // cap to keep prompts bounded
  paragraphMin: 24,
  paragraphMax: 600,
  listItemMin: 8,
  listItemMax: 240,
  headingMin: 4,
  headingMax: 220,
  maxParagraphs: 40,
  maxListItems: 60,
  maxHeadings: 30,
  maxCtaCandidates: 16,
};

// Shape we always return, even on hard failure. Keeping the shape stable is
// load-bearing: callers (extract-copy framework prompt builder) read keys with
// `?.` / array-spread and assume arrays exist.
function emptyResult(url) {
  return {
    url,
    finalUrl: url,
    title: "",
    metaDescription: "",
    ogTags: {},
    jsonLd: [],
    h1: [],
    h2: [],
    h3: [],
    paragraphs: [],
    listItems: [],
    ctaCandidates: [],
    visibleText: "",
    stats: { fetchedAt: new Date().toISOString(), durationMs: 0, fellBack: false, partial: false, error: null },
  };
}

export async function scrapePage(url, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const t0 = Date.now();
  const result = emptyResult(url);

  if (!url || !/^https?:\/\//i.test(url)) {
    result.stats.error = "invalid url";
    result.stats.partial = true;
    return result;
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    result.stats.error = `playwright missing: ${err.message}`;
    result.stats.partial = true;
    console.warn(`  [scrape] playwright import failed — returning empty result (${err.message})`);
    return result;
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    result.stats.error = `chromium launch failed: ${err.message}`;
    result.stats.partial = true;
    console.warn(`  [scrape] chromium launch failed: ${err.message}`);
    return result;
  }

  try {
    const ctx = await browser.newContext({ viewport: cfg.viewport });
    const page = await ctx.newPage();
    page.on("pageerror", () => {});           // swallow site-side runtime noise

    let response = null;
    try {
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: cfg.timeoutMs });
    } catch (err) {
      // Some sites stall before DCL fires (long polyfills, heavy SSR). Try a
      // cheaper "load" wait once before giving up. We don't surface networkidle
      // here because brand sites with tracking pixels rarely reach idle inside
      // 20s and we'd rather have partial content than nothing.
      try {
        response = await page.goto(url, { waitUntil: "load", timeout: cfg.timeoutMs });
        result.stats.fellBack = true;
      } catch (err2) {
        result.stats.error = `navigation failed: ${err2.message}`;
        result.stats.partial = true;
        console.warn(`  [scrape] navigation failed for ${url}: ${err2.message}`);
        await browser.close().catch(() => {});
        result.stats.durationMs = Date.now() - t0;
        return result;
      }
    }

    // Settle window for SPA hydration. Skip if page is already idle.
    try { await page.waitForTimeout(cfg.settleMs); } catch {}

    // Capture finalUrl after redirects.
    try { result.finalUrl = page.url() || url; } catch {}

    // Pull all the structured content in one evaluate call so we don't pay
    // per-field round-trip cost. Each section is wrapped in its own try so a
    // single broken selector can't poison the whole result.
    let sample;
    try {
      sample = await page.evaluate((bounds) => {
        const out = {
          title: "",
          metaDescription: "",
          ogTags: {},
          jsonLdRaw: [],
          h1: [], h2: [], h3: [],
          paragraphs: [],
          listItems: [],
          ctaCandidates: [],
          visibleText: "",
          partials: [],
        };

        const visible = (el) => {
          if (!el) return false;
          try {
            const r = el.getBoundingClientRect();
            if (!(r.height > 0)) return false;
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
            return true;
          } catch { return true; }
        };

        const decode = (s) =>
          (s || "")
            .replace(/\s+/g, " ")
            .replace(/ /g, " ")
            .trim();

        try { out.title = decode(document.title); } catch (e) { out.partials.push("title"); }

        try {
          const md = document.querySelector('meta[name="description"]');
          if (md) out.metaDescription = decode(md.getAttribute("content"));
          if (!out.metaDescription) {
            const og = document.querySelector('meta[property="og:description"]');
            if (og) out.metaDescription = decode(og.getAttribute("content"));
          }
        } catch (e) { out.partials.push("metaDescription"); }

        // og:* + twitter:* + article:*
        try {
          for (const el of document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[property^="article:"]')) {
            const k = el.getAttribute("property") || el.getAttribute("name");
            const v = decode(el.getAttribute("content"));
            if (k && v && !out.ogTags[k]) out.ogTags[k] = v;
          }
        } catch (e) { out.partials.push("ogTags"); }

        // JSON-LD blocks — return raw text; parse on Node side so a broken
        // block in one site doesn't kill the whole evaluate.
        try {
          for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
            const txt = (el.textContent || "").trim();
            if (txt) out.jsonLdRaw.push(txt);
          }
        } catch (e) { out.partials.push("jsonLd"); }

        // Headings — visible only, dedupe inside each level.
        for (const level of ["h1", "h2", "h3"]) {
          try {
            const seen = new Set();
            for (const el of document.querySelectorAll(level)) {
              if (!visible(el)) continue;
              const t = decode(el.textContent);
              if (!t) continue;
              if (t.length < bounds.headingMin || t.length > bounds.headingMax) continue;
              const k = t.toLowerCase();
              if (seen.has(k)) continue;
              seen.add(k);
              out[level].push(t);
              if (out[level].length >= bounds.maxHeadings) break;
            }
          } catch (e) { out.partials.push(level); }
        }

        // Paragraphs — visible <p> with reasonable length.
        try {
          const seen = new Set();
          for (const el of document.querySelectorAll("p")) {
            if (!visible(el)) continue;
            const t = decode(el.textContent);
            if (!t) continue;
            if (t.length < bounds.paragraphMin || t.length > bounds.paragraphMax) continue;
            const k = t.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.paragraphs.push(t);
            if (out.paragraphs.length >= bounds.maxParagraphs) break;
          }
        } catch (e) { out.partials.push("paragraphs"); }

        // List items — visible <li>.
        try {
          const seen = new Set();
          for (const el of document.querySelectorAll("li")) {
            if (!visible(el)) continue;
            const t = decode(el.textContent);
            if (!t) continue;
            if (t.length < bounds.listItemMin || t.length > bounds.listItemMax) continue;
            const k = t.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.listItems.push(t);
            if (out.listItems.length >= bounds.maxListItems) break;
          }
        } catch (e) { out.partials.push("listItems"); }

        // CTAs — buttons + links that look actionable. Score so we can rank
        // on the Node side. Same heuristic as extract-copy's scrapeWorker but
        // run against the rendered DOM (so an SPA's hydrated buttons score).
        try {
          const seen = new Set();
          const verbRe = /(get|try|join|donate|sign|start|learn|find|share|help|contact|book|shop|buy|register|subscribe|read|see|view|explore|connect|give|reach|visit|browse|create|build|make|launch|download|install|open|request|claim)/i;
          const consider = (el) => {
            if (!visible(el)) return;
            const text = decode(el.textContent);
            if (!text || text.length < 2 || text.length > 60) return;
            if (/^(home|menu|skip)$/i.test(text)) return;
            const href = el.tagName === "A" ? (el.getAttribute("href") || "") : "";
            const k = `${text.toLowerCase()}|${href}`;
            if (seen.has(k)) return;
            seen.add(k);
            let score = 0;
            if (verbRe.test(text)) score += 3;
            if (text.length < 24) score += 1;
            if (el.tagName === "BUTTON") score += 1;
            if (href.startsWith("/") || href.includes(location.host)) score += 1;
            if (score >= 2) out.ctaCandidates.push({ text, href, score, tag: el.tagName.toLowerCase() });
          };
          for (const el of document.querySelectorAll("a")) consider(el);
          for (const el of document.querySelectorAll('button, [role="button"], .btn, [class*="btn"]')) consider(el);
        } catch (e) { out.partials.push("ctaCandidates"); }

        // Visible text — body.innerText is what humans see; trim to bound.
        try {
          const raw = (document.body && document.body.innerText) || "";
          out.visibleText = raw.replace(/\s+/g, " ").trim().slice(0, bounds.visibleTextMaxChars);
        } catch (e) { out.partials.push("visibleText"); }

        return out;
      }, {
        headingMin: cfg.headingMin,
        headingMax: cfg.headingMax,
        paragraphMin: cfg.paragraphMin,
        paragraphMax: cfg.paragraphMax,
        listItemMin: cfg.listItemMin,
        listItemMax: cfg.listItemMax,
        maxHeadings: cfg.maxHeadings,
        maxParagraphs: cfg.maxParagraphs,
        maxListItems: cfg.maxListItems,
        visibleTextMaxChars: cfg.visibleTextMaxChars,
      });
    } catch (err) {
      result.stats.error = `evaluate failed: ${err.message}`;
      result.stats.partial = true;
      console.warn(`  [scrape] page.evaluate failed: ${err.message}`);
    }

    if (sample) {
      result.title = sample.title || "";
      result.metaDescription = sample.metaDescription || "";
      result.ogTags = sample.ogTags || {};
      result.h1 = sample.h1 || [];
      result.h2 = sample.h2 || [];
      result.h3 = sample.h3 || [];
      result.paragraphs = sample.paragraphs || [];
      result.listItems = sample.listItems || [];
      result.visibleText = sample.visibleText || "";

      // Parse JSON-LD on Node side. Bad blocks → skip silently.
      const ld = [];
      for (const txt of (sample.jsonLdRaw || [])) {
        try {
          const parsed = JSON.parse(txt);
          if (Array.isArray(parsed)) ld.push(...parsed);
          else if (parsed && parsed["@graph"] && Array.isArray(parsed["@graph"])) ld.push(...parsed["@graph"]);
          else ld.push(parsed);
        } catch {}
      }
      result.jsonLd = ld;

      // Sort + cap CTAs.
      const ctas = (sample.ctaCandidates || []).slice();
      ctas.sort((a, b) => b.score - a.score);
      result.ctaCandidates = ctas.slice(0, cfg.maxCtaCandidates);

      if (sample.partials && sample.partials.length) {
        result.stats.partial = true;
        result.stats.partials = sample.partials;
      }
    }

    if (response) {
      try {
        result.stats.status = response.status();
      } catch {}
    }
  } finally {
    try { await browser.close(); } catch {}
  }

  result.stats.durationMs = Date.now() - t0;
  result.stats.fetchedAt = new Date().toISOString();

  // Optional persistence — caller controls layout.
  if (typeof opts.outPath === "string" && opts.outPath.length > 0) {
    try {
      const dir = path.dirname(opts.outPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(opts.outPath, JSON.stringify(result, null, 2) + "\n", "utf8");
    } catch (err) {
      console.warn(`  [scrape] failed to write ${opts.outPath}: ${err.message}`);
    }
  }

  return result;
}

export default { scrapePage };
