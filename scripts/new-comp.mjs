// Scaffolder — turn a URL into a working HyperFrames composition in one shot.
//
// Usage:
//   npm run new:comp -- <url>
//   npm run new:comp -- <url> --template=kinetic-pop --name=acme
//   npm run new:comp -- <url> --orient=portrait
//   npm run new:comp -- <url> --mode=headless                # render with Playwright
//
// What it does:
//   1. Fetch the URL and extract palette + fonts + brand name + tagline
//      (curl + RegExp by default; Playwright getComputedStyle if --mode=headless).
//   2. Write design/tokens-<slug>.css
//   3. Generate compositions/<slug>.html with chosen base template + module bundle
//   4. Run lint + smoke to verify it loads cleanly
//
// Templates: warm-community | kinetic-pop | documentary | quiet-premium
// Orient:    landscape (1920×1080, default) | portrait (1080×1920)
//
// Modes:
//   --mode=curl     (default) Static fetch — fast (~200ms), zero deps. Reads CSS
//                   custom properties, frequency-ranks hex literals, scrapes
//                   <h1>/<h2> tags. Misses CSS-in-JS, Tailwind utility classes,
//                   post-load fonts, and dark-mode toggles.
//   --mode=headless Playwright — slower (~3-6s) but reads the rendered page.
//                   Samples getComputedStyle on body/h1/h2/a/nav/buttons + the
//                   first N elements with non-transparent backgrounds, converts
//                   rgb()/rgba() to hex, frequency-ranks, AND still pulls the
//                   curl signal so source CSS-vars override rendered samples
//                   when a brand has clearly named --brand-* tokens.
//
// The extractor is best-effort — different sites structure CSS differently. The
// generated tokens-<slug>.css is a starting point; hand-tune palette/fonts as
// needed before rendering.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith("--"));
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const url = positional[0];
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Usage: npm run new:comp -- <https://example.com> [--template=<name>] [--name=<slug>] [--orient=portrait] [--mode=headless]");
  console.error("Templates: warm-community (default) | kinetic-pop | documentary | quiet-premium");
  console.error("Modes:     curl (default) | headless");
  process.exit(1);
}

const template = flags.template ?? "warm-community";
const orient = flags.orient ?? "landscape";
const mode = flags.mode ?? "curl";
const validTemplates = ["warm-community", "kinetic-pop", "documentary", "quiet-premium"];
const validModes = ["curl", "headless"];
if (!validTemplates.includes(template)) {
  console.error(`Unknown template: ${template}. Pick from: ${validTemplates.join(", ")}`);
  process.exit(1);
}
if (!validModes.includes(mode)) {
  console.error(`Unknown mode: ${mode}. Pick from: ${validModes.join(", ")}`);
  process.exit(1);
}

const dims = orient === "portrait" ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };

// Derive slug from URL host if not given.
const host = new URL(url).hostname.replace(/^www\./, "").replace(/\.[a-z]+$/, "");
const slug = (flags.name ?? host).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

console.log(`▶ scaffolding "${slug}" from ${url}`);
console.log(`  template: ${template} · orientation: ${orient} (${dims.w}×${dims.h}) · mode: ${mode}`);

// --- helpers --------------------------------------------------------------

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Convert any CSS color string (`#abc`, `#aabbcc`, `rgb(…)`, `rgba(…)`) → uppercase
// hex `#RRGGBB`. Returns null for transparent / unparseable values so callers can
// filter them out cleanly.
function colorToHex(value) {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  if (s === "transparent" || s === "none" || s === "currentcolor") return null;

  // #abc or #aabbcc
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    return "#" + hex.toUpperCase();
  }

  // rgb(r, g, b) / rgba(r, g, b, a) / rgb(r g b) / rgb(r g b / a)
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const [r, g, b, a] = parts.map((p, i) =>
      i === 3 && /%$/.test(p) ? parseFloat(p) / 100 : parseFloat(p)
    );
    if ([r, g, b].some(n => Number.isNaN(n))) return null;
    if (a !== undefined && a < 0.05) return null;  // effectively transparent
    const toHex = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0").toUpperCase();
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  return null;
}

// Simple frequency-rank with a "boring" filter (pure white / black / near-grey).
function rankColors(samples, { excludeNeutrals = true, max = 12 } = {}) {
  const freq = new Map();
  for (const c of samples) {
    if (!c) continue;
    if (excludeNeutrals && /^#(FFFFFF|000000|FAFAFA|F5F5F5|EEEEEE|111111|222222)$/i.test(c)) continue;
    freq.set(c, (freq.get(c) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([hex]) => hex);
}

// --- pass 1: curl-based extraction (always runs) --------------------------

console.log(`  [curl] fetching…`);
let html = "";
try {
  html = execSync(`curl -s -L "${url}"`, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (!html || html.length < 100) throw new Error("empty/short response");
} catch (err) {
  console.error(`✗ couldn't fetch ${url}: ${err.message}`);
  process.exit(1);
}
console.log(`  [curl] fetched ${(html.length / 1024).toFixed(1)} KB`);

// Extract <title>
let title = (html.match(/<title>([^<]+)<\/title>/i)?.[1] || slug).trim().slice(0, 80);

// Extract h1/h2 candidates for tagline material — strip tags first.
const headings = [];
for (const m of html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)) {
  const txt = m[1].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
  if (txt.length > 6 && txt.length < 200) headings.push(txt);
}

// Extract CSS custom properties — `--name: value;` patterns.
const cssVars = new Map();
for (const m of html.matchAll(/--([a-z][a-z0-9-]*?)\s*:\s*([^;}\n]+)[;}]/gi)) {
  const k = m[1].toLowerCase();
  const v = m[2].trim();
  if (!cssVars.has(k)) cssVars.set(k, v);
}

// Frequency-rank hex colors found anywhere in the HTML/inline CSS.
const curlHexSamples = [];
for (const m of html.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
  let hex = m[1].toUpperCase();
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  curlHexSamples.push("#" + hex);
}
const curlTopColors = rankColors(curlHexSamples, { max: 8 });

// Font families — look for @import url(...fonts.googleapis...) and font-family declarations.
const fontImports = [...html.matchAll(/@import\s+url\(["']?(https:\/\/fonts\.googleapis\.com[^"')]+)["']?\)/g)].map(m => m[1]);
const fontFamilies = [...html.matchAll(/font-family\s*:\s*([^;}\n]+)[;}]/g)].map(m => m[1].replace(/['"]/g, "").trim()).slice(0, 8);

// Logo image — first <img> whose src looks like a logo.
let logoSrc = (html.match(/<img[^>]+src=["']([^"']+(?:logo|brand|mark)[^"']*)["']/i)?.[1] || "").trim();

console.log(`  [curl] extracted: ${curlTopColors.length} hex colors, ${cssVars.size} CSS vars, ${headings.length} headings, ${fontImports.length} font imports`);

// --- pass 2 (optional): headless Playwright sampling ----------------------

// Holds rendered-page samples by role; each role is a list of hex strings, most
// frequent first when used to choose the palette below.
let rendered = {
  bgs: [],          // body + non-transparent element backgrounds
  fgs: [],          // body color, h1/h2 color
  accents: [],      // a, header/nav a
  ctas: [],         // button bg + .btn / [class*="btn"] bg
  fonts: [],        // computed font-family on body / h1 / h2
};
let renderedHeadings = [];
let renderedTitle = null;

if (mode === "headless") {
  console.log(`  [headless] launching Chromium…`);
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    console.error("✗ Playwright is required for --mode=headless. Run `npm install` first.");
    console.error(`  (${err.message})`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on("pageerror", () => {});  // swallow site-side runtime noise

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    } catch {
      // Some sites never reach networkidle (long-poll, tracking pixels). Fall back.
      console.warn(`  [headless] networkidle timeout — falling back to domcontentloaded`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(1500);  // let fonts/CSS-in-JS settle
    }

    // Sample the rendered page from inside the browser context. Returns flat
    // strings (pre-hex-conversion) so we can normalize on the Node side.
    const sample = await page.evaluate(() => {
      const out = {
        title: document.title || "",
        bgs: [], fgs: [], accents: [], ctas: [], fonts: [],
        headings: [], logoSrc: "",
      };

      const cs = (el) => el ? getComputedStyle(el) : null;
      const push = (arr, v) => { if (v) arr.push(v); };

      // body — primary fg/bg + base font.
      const body = document.body;
      if (body) {
        const s = cs(body);
        push(out.bgs, s.backgroundColor);
        push(out.fgs, s.color);
        push(out.fonts, s.fontFamily);
      }

      // h1/h2 — display font + heading color.
      for (const sel of ["h1", "h2"]) {
        for (const el of document.querySelectorAll(sel)) {
          const s = cs(el);
          push(out.fgs, s.color);
          push(out.fonts, s.fontFamily);
          const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
          if (txt.length > 6 && txt.length < 200) out.headings.push(txt);
          if (out.headings.length >= 8) break;
        }
      }

      // a — accent. Prefer header/nav links for the "real" brand link color.
      for (const el of document.querySelectorAll("nav a, header a")) {
        push(out.accents, cs(el).color);
      }
      for (const el of document.querySelectorAll("a")) {
        push(out.accents, cs(el).color);
      }

      // button / .btn / [class*="btn"] — CTA.
      for (const el of document.querySelectorAll('button, .btn, [class*="btn"]')) {
        const s = cs(el);
        push(out.ctas, s.backgroundColor);
        push(out.fgs, s.color);
      }

      // First N elements with non-transparent backgrounds → palette candidates.
      let bgPicks = 0;
      for (const el of document.querySelectorAll("section, header, footer, main, aside, div")) {
        if (bgPicks >= 60) break;
        const s = cs(el);
        const bg = s.backgroundColor;
        if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") continue;
        out.bgs.push(bg);
        bgPicks++;
      }

      // Logo: <img src="...logo...">, fallback to favicon link.
      const logoImg = document.querySelector('img[src*="logo" i], img[alt*="logo" i], img[class*="logo" i]');
      if (logoImg && logoImg.src) {
        out.logoSrc = logoImg.src;
      } else {
        const icon = document.querySelector('link[rel*="icon"]');
        if (icon && icon.href) out.logoSrc = icon.href;
      }

      return out;
    });

    // Normalize: rgb()/rgba() → hex, drop transparents.
    rendered.bgs     = sample.bgs.map(colorToHex).filter(Boolean);
    rendered.fgs     = sample.fgs.map(colorToHex).filter(Boolean);
    rendered.accents = sample.accents.map(colorToHex).filter(Boolean);
    rendered.ctas    = sample.ctas.map(colorToHex).filter(Boolean);
    rendered.fonts   = sample.fonts.map(f => String(f).split(",")[0].replace(/['"]/g, "").trim()).filter(Boolean);
    renderedHeadings = sample.headings;
    renderedTitle    = sample.title || null;

    if (sample.logoSrc && !logoSrc) logoSrc = sample.logoSrc;
    if (renderedTitle && (!title || title === slug)) title = renderedTitle.slice(0, 80);

    const palCount = new Set([...rendered.bgs, ...rendered.fgs, ...rendered.accents, ...rendered.ctas]).size;
    console.log(`  [headless] sampled: ${rendered.bgs.length} bg / ${rendered.fgs.length} fg / ${rendered.accents.length} link / ${rendered.ctas.length} cta · ${palCount} unique colors · ${renderedHeadings.length} headings`);
  } finally {
    await browser.close();
  }
}

// --- merge curl + headless signals → final palette ------------------------

// Frequency-rank rendered samples (bgs / fgs / accents / ctas).
const renderedBgRank      = rankColors(rendered.bgs);
const renderedFgRank      = rankColors(rendered.fgs);
const renderedAccentRank  = rankColors(rendered.accents);
const renderedCtaRank     = rankColors(rendered.ctas);

// Pick palette colors with priority order:
//   1. curl-mode CSS custom-prop values (e.g. --brand-primary)
//   2. headless rendered samples for that role
//   3. curl-mode frequency-ranked hex
//   4. hardcoded sensible default
function pickPalette() {
  const fromCssVars = (...keys) => {
    for (const [name, val] of cssVars) {
      if (keys.some(p => name.includes(p)) && /^#[0-9a-f]+$/i.test(val)) {
        return colorToHex(val);
      }
    }
    return null;
  };

  const accent = fromCssVars("brand", "primary", "accent", "main")
              ?? renderedCtaRank[0]
              ?? renderedAccentRank[0]
              ?? curlTopColors[0]
              ?? "#1A9E8F";

  // Foreground: source CSS-var > body color > curl freq fallback.
  const ink = fromCssVars("ink", "text", "fg", "foreground")
            ?? renderedFgRank[0]
            ?? "#1B2A3D";

  // Background: source CSS-var > most-frequent rendered bg > paper default.
  const paper = fromCssVars("bg", "background", "paper", "canvas")
              ?? renderedBgRank[0]
              ?? "#FBF9F6";

  const slate = fromCssVars("secondary", "muted", "subtle")
              ?? renderedFgRank[1]
              ?? curlTopColors[1]
              ?? "#5A6677";

  const warn = fromCssVars("coral", "orange", "warn", "alert")
             ?? renderedAccentRank[1]
             ?? curlTopColors[2]
             ?? "#E98B6A";

  return { accent, ink, paper, slate, warn };
}
const palette = pickPalette();

if (mode === "headless") {
  console.log(`  [merge] palette → accent ${palette.accent} · ink ${palette.ink} · paper ${palette.paper} · slate ${palette.slate} · warn ${palette.warn}`);
}

// Use rendered headings if curl headings were thin (some sites server-render
// without h1, or paint them via JS).
const allHeadings = headings.length >= 3 ? headings : (renderedHeadings.length > headings.length ? renderedHeadings : headings);

// Combined font-family list for the comment in tokens.css.
const detectedFonts = [
  ...fontFamilies,
  ...rendered.fonts,
].filter((f, i, arr) => f && arr.indexOf(f) === i).slice(0, 6);

// --- write tokens-<slug>.css ----------------------------------------------

const tokensCss = `/* =========================================================================
   TOKENS — ${slug.toUpperCase()} (auto-extracted from ${url})
   =========================================================================
   Generated by scripts/new-comp.mjs (mode=${mode}). Best-effort extraction —
   review and hand-tune palette/fonts before rendering. Loaded after
   design/cards.css in compositions/${slug}.html (or any comp that wants this
   brand).
   ========================================================================= */
${fontImports.length ? `\n${fontImports.map(u => `@import url("${u}");`).join("\n")}` : ""}

:root {
  /* Palette — extracted from page CSS or hex frequency. */
  --card-accent:      ${palette.accent};
  --card-navy:        ${palette.ink};
  --card-navy-deep:   ${palette.ink};
  --card-paper:       ${palette.paper};
  --card-paper-soft:  ${palette.paper};
  --card-slate:       ${palette.slate};
  --card-slate-ink:   ${palette.slate};
  --card-warn:        ${palette.warn};
  --card-ok:          ${palette.accent};

  /* Type — using template defaults. Override here to match the source brand. */
  /* Detected on source page: ${detectedFonts.join(", ") || "(none)"} */
}

/* Auto-extracted accent on dark surface (re-skin .card--brand-navy). */
.card--brand-navy {
  background: var(--card-accent);
  color: var(--card-paper);
}

/* Auto-extracted source brand:
     Title:    ${title}
     Tagline:  ${(allHeadings[0] || "(none found)").slice(0, 80)}
     Logo URL: ${logoSrc || "(none found)"}
     Mode:     ${mode}
*/
`;

const tokensPath = path.join(projectRoot, "design", `tokens-${slug}.css`);
// Preserve hand-tuned tokens if the existing file has the HAND-TUNED sentinel.
// Auto-extraction routinely guesses wrong on accent colors (sale tags / form
// borders) so once a human edits + marks the file, the orchestrator must NOT
// re-clobber it on subsequent runs.
const HAND_TUNED_SENTINEL = "HAND-TUNED";
let preservedHandTuned = false;
try {
  if (fs.existsSync(tokensPath)) {
    const existing = fs.readFileSync(tokensPath, "utf8");
    if (existing.includes(HAND_TUNED_SENTINEL)) {
      preservedHandTuned = true;
    }
  }
} catch {}
if (!preservedHandTuned) {
  fs.writeFileSync(tokensPath, tokensCss);
  console.log(`✓ wrote design/tokens-${slug}.css`);
} else {
  console.log(`✓ kept design/tokens-${slug}.css (HAND-TUNED sentinel detected)`);
}

// --- write compositions/<slug>.html ---------------------------------------

const tagline = (allHeadings[0] || `Welcome to ${title}`).slice(0, 60);
const beat2   = (allHeadings[1] || "Built around how you actually work.").slice(0, 60);
const beat3   = (allHeadings[2] || "Simple. Fast. Yours.").slice(0, 60);

const compHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>

<link rel="stylesheet" href="../design/cards.css">
<link rel="stylesheet" href="../design/templates/${template}.css">
<link rel="stylesheet" href="../design/tokens-${slug}.css">
<link rel="stylesheet" href="../design/effects-batch-08.css">
<link rel="stylesheet" href="../design/modules/all.css">

<script src="../design/vendor/gsap.min.js"></script>
<script src="../design/modules/all.js"></script>

<style>
  body { margin: 0; background: var(--card-paper); font-family: var(--card-font-ui); }
  .comp {
    width: ${dims.w}px; height: ${dims.h}px;
    position: relative; overflow: hidden;
    background: var(--card-paper);
    color: var(--card-navy);
  }
  .scene {
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    padding: 96px 120px;
    box-sizing: border-box;
    text-align: center;
  }
  .scene__kicker {
    font-family: var(--card-font-ui);
    font-size: var(--card-kicker-size);
    letter-spacing: var(--card-kicker-track);
    text-transform: uppercase;
    color: var(--card-accent);
    margin-bottom: 32px;
  }
  .hero-title {
    font-family: var(--card-font-display);
    font-size: var(--card-title-size);
    font-weight: var(--card-title-weight, 600);
    letter-spacing: var(--card-title-track);
    line-height: var(--card-title-line);
    color: var(--card-navy);
    max-width: ${dims.w - 320}px;
  }
  .s2 { background: var(--card-accent); color: var(--card-paper); }
  .s2 .hero-title { color: var(--card-paper); }
  .s3-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 80px;
    width: 100%; max-width: ${Math.min(dims.w - 240, 1640)}px;
  }
  .s3-item {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    font-family: var(--card-font-display);
    font-size: 56px; font-weight: 600;
    color: var(--card-navy);
  }
</style>
</head>
<body>

<div id="${slug}" class="comp clip"
     data-composition-id="${slug}"
     data-width="${dims.w}" data-height="${dims.h}"
     data-start="0" data-duration="14" data-track-index="0">

  <!-- Scene 1 (0–4s): hero -->
  <div id="s1" class="scene s1 clip"
       data-start="0" data-duration="4" data-track-index="1">
    <div class="scene__kicker">${slug.toUpperCase()}</div>
    <div id="s1-title" class="hero-title">${escapeHtml(tagline)}</div>
  </div>

  <!-- Scene 2 (4–9s): brand block + ambient sparkle -->
  <div id="s2" class="scene s2 clip"
       data-start="4" data-duration="5" data-track-index="1">
    <div id="s2-glitter" class="s2-glitter-bg" style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;"></div>
    <div style="position:relative;z-index:2;">
      <div id="s2-title" class="hero-title">${escapeHtml(title)}</div>
    </div>
  </div>

  <!-- Scene 3 (9–14s): three-up -->
  <div id="s3" class="scene s3 clip"
       data-start="9" data-duration="5" data-track-index="1">
    <div class="s3-grid">
      <div id="s3a" class="s3-item">${escapeHtml(beat2.split(" ")[0] || "Simple")}</div>
      <div id="s3b" class="s3-item">${escapeHtml(beat3.split(" ")[0] || "Fast")}</div>
      <div id="s3c" class="s3-item">${escapeHtml((beat2.split(" ")[1] || beat3.split(" ")[1]) || "Yours")}</div>
    </div>
  </div>
</div>

<!-- SVG filter defs (used by inkBleed + glitchBurst) -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="fx-ink" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" />
      <feDisplacementMap in="SourceGraphic" scale="0" />
    </filter>
    <filter id="fx-rgb-shift">
      <feColorMatrix type="matrix" in="SourceGraphic" result="r"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      <feOffset in="r" dx="3" dy="0" result="r-shift" />
      <feColorMatrix type="matrix" in="SourceGraphic" result="b"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
      <feOffset in="b" dx="-3" dy="0" result="b-shift" />
      <feColorMatrix type="matrix" in="SourceGraphic" result="g"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      <feBlend in="r-shift" in2="g" mode="screen" result="rg" />
      <feBlend in="rg" in2="b-shift" mode="screen" />
    </filter>
  </defs>
</svg>

<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  window.__timelines["${slug}"] = tl;

  // Scene 1 — kicker + headline cascade
  tl.fromTo("#s1 .scene__kicker", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 0.4);
  textFx.cascade(tl, "#s1-title", { at: 0.8, duration: 0.7, stagger: 0.08 });

  // Scene 2 — brand block with ambient sparkle + ink-bleed reveal
  glitterFx.ambient(tl, "#s2-glitter", { at: 4.0, duration: 5.0, count: 50, seed: 31 });
  tl.fromTo("#s2-title", { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" }, 4.5);
  effectFx.inkBleed(tl, "#s2-title", { at: 4.5, duration: 0.9, from: 60, to: 0 });

  // Scene 3 — three-up stagger
  tl.fromTo(["#s3a", "#s3b", "#s3c"],
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, stagger: 0.18, ease: "power3.out" },
    9.2);
  textFx.stagger(tl, "#s3a", { at: 9.6,  duration: 0.5, stagger: 0.04 });
  textFx.stagger(tl, "#s3b", { at: 10.0, duration: 0.5, stagger: 0.04 });
  textFx.stagger(tl, "#s3c", { at: 10.4, duration: 0.5, stagger: 0.04 });

  // Standalone autoplay — only when loaded directly (not in studio/renderer iframe).
  if (window === window.top) {
    setTimeout(() => tl.play(0), 250);
  }
</script>
</body>
</html>
`;

const compPath = path.join(projectRoot, "compositions", `${slug}.html`);
fs.writeFileSync(compPath, compHtml);
console.log(`✓ wrote compositions/${slug}.html (${dims.w}×${dims.h}, 14s, 3 scenes)`);

// --- auto-write versioning manifest ---------------------------------------
// Snapshot the current sha256 of every shared resource the comp links to.
// `npm run comp:check -- <slug>` later detects drift if any of those files
// change. Manifest is the comp's contract — checked into git as creation state.

try {
  execSync(`node "${path.join(__dirname, "comp-manifest.mjs")}" write ${slug}`, {
    cwd: projectRoot,
    stdio: "inherit",
  });
} catch (err) {
  console.warn(`  ⚠ manifest write failed: ${err.message}`);
  console.warn(`    re-run manually: npm run comp:write -- ${slug}`);
}

// --- next steps -----------------------------------------------------------

console.log("");
console.log(`▶ next steps:`);
console.log(`  1. Review design/tokens-${slug}.css — palette is best-effort, hand-tune as needed`);
console.log(`  2. Edit compositions/${slug}.html — beats are placeholders, write real copy`);
console.log(`  3. To make this the project entry: cp compositions/${slug}.html index.html`);
console.log(`     (and adjust ../design/ paths to design/)`);
console.log(`  4. Render: npm run render`);
