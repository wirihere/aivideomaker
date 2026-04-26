// Brand fingerprint library — visit a list of brand URLs with Playwright, sample
// palette / typography / photo style / tone heuristics, and write a JSON library
// + Markdown summary the picker can read instead of inferring per-run.
//
// Why pre-compute: every render that picks a template + music currently re-derives
// brand feel from scratch (and gets it wrong sometimes — see LEARNINGS feedback
// "brand_tone_picker"). Caching per-domain fingerprints lets the picker do a
// constant-time lookup with confidence scores for the most common URLs.
//
// Method:
//   1. Load each URL in headless Chromium (1920x1080, 15s default timeout).
//   2. Sample computed CSS colors from body/h1/h2/CTA elements.
//   3. Read CSS custom properties off :root (--color-*, --brand*, --accent*, ...).
//   4. Detect dominant font-family on h1/h2/p.
//   5. Capture above-the-fold viewport, resize to 200x400, JPEG quality 70, ≤30KB.
//   6. Heuristic photo_style ("human-centric" / "product" / "illustration").
//   7. Heuristic tone (warm / energetic / documentary / lifestyle / luxury / playful)
//      with a 0–1 confidence score.
//   8. Be polite: 2-second delay between domains.
//
// Output:
//   docs/brand-fingerprints.json    — keyed by hostname, schema in CLAUDE prompt
//   docs/brand-fingerprints.md      — human-readable swatches + thumbs
//   docs/brand-fingerprints/<host>.jpg — 200x400 JPEG, ≤30KB
//
// Usage:
//   node scripts/fingerprint-brands.mjs                # all 12 default brands
//   node scripts/fingerprint-brands.mjs linear.app     # subset
//
// Constraints (per brief): no orchestrator/picker changes, no new deps, polite.

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const OUT_DIR = path.join(projectRoot, "docs", "brand-fingerprints");
const OUT_JSON = path.join(projectRoot, "docs", "brand-fingerprints.json");
const OUT_MD = path.join(projectRoot, "docs", "brand-fingerprints.md");

// 12 representative brands grouped by archetype — the picker uses the archetype
// to pre-bias template/music choices before per-render copy goes in.
const DEFAULT_BRANDS = [
  // Warm community
  { url: "https://kindred-nz.org",         archetype: "warm" },
  { url: "https://www.kiva.org",           archetype: "warm" },
  { url: "https://neighbourhoodgoods.com", archetype: "warm" },
  // Energetic SaaS
  { url: "https://linear.app",             archetype: "energetic" },
  { url: "https://stripe.com",             archetype: "energetic" },
  { url: "https://www.figma.com",          archetype: "energetic" },
  { url: "https://www.notion.so",          archetype: "energetic" },
  // Documentary / research
  { url: "https://www.theverge.com",       archetype: "documentary" },
  { url: "https://www.atlasobscura.com",   archetype: "documentary" },
  // Lifestyle / DTC
  { url: "https://www.allbirds.com",       archetype: "lifestyle" },
  { url: "https://www.glossier.com",       archetype: "lifestyle" },
  { url: "https://www.warbyparker.com",    archetype: "lifestyle" },
];

const TODAY = new Date().toISOString().slice(0, 10);

// --- color helpers -----------------------------------------------------------

// Normalise rgb()/rgba()/hex strings to a #RRGGBB hex. Returns null for
// transparent / unsupported (gradient strings). The picker only stores hex.
function toHex(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  if (s === "transparent" || s.startsWith("none")) return null;

  // Already hex.
  if (s.startsWith("#")) {
    if (s.length === 7) return s;
    if (s.length === 4) {
      // #abc → #aabbcc
      return "#" + s.slice(1).split("").map((c) => c + c).join("");
    }
    return null;
  }

  // rgb(r, g, b) / rgba(r, g, b, a) / rgb(r g b / a)
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1]
    .replace(/\//g, ",")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((p) => p.trim());
  if (parts.length < 3) return null;
  const r = clamp(parseFloat(parts[0]));
  const g = clamp(parseFloat(parts[1]));
  const b = clamp(parseFloat(parts[2]));
  const a = parts[3] != null ? parseFloat(parts[3]) : 1;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  if (a < 0.05) return null; // effectively transparent
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function clamp(v) {
  if (Number.isNaN(v)) return v;
  return Math.max(0, Math.min(255, Math.round(v)));
}

// HSL conversion — we use saturation / lightness / hue to infer "warm" vs "cold"
// and to distinguish background-style colors from accents.
function hexToHsl(hex) {
  if (!hex) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function isWarmHue(h) {
  // Warm hues span red→yellow + the reds-from-the-other-side wrap (300–360).
  return (h >= 0 && h <= 60) || h >= 300;
}

// --- fingerprint a single URL ------------------------------------------------

async function fingerprintUrl(browser, entry) {
  const { url, archetype } = entry;
  const host = new URL(url).hostname.replace(/^www\./, "");
  const out = {
    host,
    url,
    archetype_hint: archetype,
    fingerprinted_at: TODAY,
  };

  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  ctx.setDefaultTimeout(15_000);
  const page = await ctx.newPage();

  // Some hosts behind aggressive WAFs (Cloudflare/Akamai) reject the first
  // hit, then succeed on a retry with the same warmed connection. Try
  // domcontentloaded first; if that throws, fall back to commit (any nav
  // happened) which buys us the ability to read the rendered HTML even when
  // a few subresources stalled.
  let loaded = false;
  for (const wait of ["domcontentloaded", "load", "commit"]) {
    try {
      await page.goto(url, { waitUntil: wait, timeout: 20_000 });
      await page.waitForTimeout(2500);
      loaded = true;
      break;
    } catch (err) {
      out._last_load_err = err.message.split("\n")[0];
    }
  }
  if (!loaded) {
    out.error = `load_failed: ${out._last_load_err || "unknown"}`;
    delete out._last_load_err;
    await ctx.close().catch(() => {});
    return out;
  }
  delete out._last_load_err;

  // ---- pull palette / fonts / photos in one evaluate to minimise round-trips
  let probe;
  try {
    probe = await page.evaluate(() => {
      function computed(el, prop) {
        return el ? getComputedStyle(el).getPropertyValue(prop).trim() : "";
      }
      function area(el) {
        const r = el.getBoundingClientRect();
        return Math.max(0, r.width) * Math.max(0, r.height);
      }
      function topVisible(selector, n) {
        return [...document.querySelectorAll(selector)]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && r.top < window.innerHeight + 200;
          })
          .sort((a, b) => area(b) - area(a))
          .slice(0, n);
      }

      const body = document.body;
      const bodyStyle = body ? getComputedStyle(body) : null;

      // Headings — take the 3 largest above-the-fold h1/h2.
      const headings = topVisible("h1, h2", 3).map((el) => ({
        tag: el.tagName.toLowerCase(),
        color: computed(el, "color"),
        bg: computed(el, "background-color"),
        font: computed(el, "font-family"),
        fontSize: computed(el, "font-size"),
        text: (el.textContent || "").trim().slice(0, 200),
      }));

      // CTAs — buttons + anchors that look like buttons. Sort by area; keep
      // first 3 that have a non-transparent background.
      const ctaCandidates = topVisible(
        'button, a[role="button"], a.button, a.btn, a[class*="btn"], a[class*="button"], .cta a, .cta button',
        12,
      );
      const ctas = [];
      for (const el of ctaCandidates) {
        const bg = computed(el, "background-color");
        const color = computed(el, "color");
        if (!bg || /rgba?\([^)]*,\s*0(\.0+)?\s*\)/.test(bg)) continue;
        ctas.push({ bg, color, text: (el.textContent || "").trim().slice(0, 80) });
        if (ctas.length >= 3) break;
      }

      // Body / paragraph font.
      const p =
        topVisible("p", 1)[0] ||
        document.querySelector("p");

      // CSS custom properties on :root that look brand-y.
      const rootStyle = getComputedStyle(document.documentElement);
      const cssVars = {};
      // CSSStyleDeclaration is iterable as a list of property names in modern
      // browsers — including custom props.
      for (let i = 0; i < rootStyle.length; i++) {
        const name = rootStyle[i];
        if (!name.startsWith("--")) continue;
        if (
          /^--(color|brand|accent|bg|text|fg|primary|secondary|surface|tone|hue)/i.test(
            name,
          ) ||
          /color|brand|accent|bg|text|fg|primary/i.test(name)
        ) {
          const val = rootStyle.getPropertyValue(name).trim();
          if (val) cssVars[name] = val;
        }
      }

      // Image survey for photo_style heuristic.
      const imgs = [...document.querySelectorAll("img")]
        .filter((img) => {
          const r = img.getBoundingClientRect();
          return r.top < window.innerHeight && r.width > 60 && r.height > 60;
        })
        .map((img) => {
          const r = img.getBoundingClientRect();
          return {
            w: Math.round(r.width),
            h: Math.round(r.height),
            ratio: r.height > 0 ? +(r.width / r.height).toFixed(2) : 0,
            alt: (img.alt || "").toLowerCase().slice(0, 80),
            loading: img.getAttribute("loading") || "",
            src: (img.currentSrc || img.src || "").slice(0, 200),
          };
        });

      // SVGs above the fold — high count signals illustration-heavy hero.
      const svgs = [...document.querySelectorAll("svg")].filter((s) => {
        const r = s.getBoundingClientRect();
        return r.top < window.innerHeight && r.width > 40 && r.height > 40;
      });

      return {
        bodyBg: bodyStyle ? bodyStyle.backgroundColor : "",
        bodyColor: bodyStyle ? bodyStyle.color : "",
        bodyFont: bodyStyle ? bodyStyle.fontFamily : "",
        headings,
        ctas,
        pColor: p ? computed(p, "color") : "",
        pFont: p ? computed(p, "font-family") : "",
        cssVars,
        imgs,
        svgCount: svgs.length,
        title: document.title || "",
      };
    });
  } catch (err) {
    // Most evaluate failures are "context destroyed" from a soft navigation —
    // wait for the new context to settle and try once more.
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
      await page.waitForTimeout(1500);
      probe = await page.evaluate(() => {
        // Re-run the same probe (kept in sync with the block above).
        function computed(el, prop) {
          return el ? getComputedStyle(el).getPropertyValue(prop).trim() : "";
        }
        function area(el) {
          const r = el.getBoundingClientRect();
          return Math.max(0, r.width) * Math.max(0, r.height);
        }
        function topVisible(selector, n) {
          return [...document.querySelectorAll(selector)]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.top < window.innerHeight + 200;
            })
            .sort((a, b) => area(b) - area(a))
            .slice(0, n);
        }
        const body = document.body;
        const bodyStyle = body ? getComputedStyle(body) : null;
        const headings = topVisible("h1, h2", 3).map((el) => ({
          tag: el.tagName.toLowerCase(),
          color: computed(el, "color"),
          bg: computed(el, "background-color"),
          font: computed(el, "font-family"),
          fontSize: computed(el, "font-size"),
          text: (el.textContent || "").trim().slice(0, 200),
        }));
        const ctaCandidates = topVisible(
          'button, a[role="button"], a.button, a.btn, a[class*="btn"], a[class*="button"], .cta a, .cta button',
          12,
        );
        const ctas = [];
        for (const el of ctaCandidates) {
          const bg = computed(el, "background-color");
          const color = computed(el, "color");
          if (!bg || /rgba?\([^)]*,\s*0(\.0+)?\s*\)/.test(bg)) continue;
          ctas.push({ bg, color, text: (el.textContent || "").trim().slice(0, 80) });
          if (ctas.length >= 3) break;
        }
        const p = topVisible("p", 1)[0] || document.querySelector("p");
        const rootStyle = getComputedStyle(document.documentElement);
        const cssVars = {};
        for (let i = 0; i < rootStyle.length; i++) {
          const name = rootStyle[i];
          if (!name.startsWith("--")) continue;
          if (
            /^--(color|brand|accent|bg|text|fg|primary|secondary|surface|tone|hue)/i.test(name) ||
            /color|brand|accent|bg|text|fg|primary/i.test(name)
          ) {
            const val = rootStyle.getPropertyValue(name).trim();
            if (val) cssVars[name] = val;
          }
        }
        const imgs = [...document.querySelectorAll("img")]
          .filter((img) => {
            const r = img.getBoundingClientRect();
            return r.top < window.innerHeight && r.width > 60 && r.height > 60;
          })
          .map((img) => {
            const r = img.getBoundingClientRect();
            return {
              w: Math.round(r.width),
              h: Math.round(r.height),
              ratio: r.height > 0 ? +(r.width / r.height).toFixed(2) : 0,
              alt: (img.alt || "").toLowerCase().slice(0, 80),
              loading: img.getAttribute("loading") || "",
              src: (img.currentSrc || img.src || "").slice(0, 200),
            };
          });
        const svgs = [...document.querySelectorAll("svg")].filter((s) => {
          const r = s.getBoundingClientRect();
          return r.top < window.innerHeight && r.width > 40 && r.height > 40;
        });
        return {
          bodyBg: bodyStyle ? bodyStyle.backgroundColor : "",
          bodyColor: bodyStyle ? bodyStyle.color : "",
          bodyFont: bodyStyle ? bodyStyle.fontFamily : "",
          headings,
          ctas,
          pColor: p ? computed(p, "color") : "",
          pFont: p ? computed(p, "font-family") : "",
          cssVars,
          imgs,
          svgCount: svgs.length,
          title: document.title || "",
        };
      });
    } catch (err2) {
      out.error = `evaluate_failed: ${(err2.message || err.message).split("\n")[0]}`;
      await ctx.close().catch(() => {});
      return out;
    }
  }

  // ---- thumbnail capture ----------------------------------------------------
  let thumbRel = null;
  try {
    const rawShotPath = path.join(OUT_DIR, `${host}.raw.png`);
    await page.screenshot({
      path: rawShotPath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    const finalPath = path.join(OUT_DIR, `${host}.jpg`);
    await compressThumb(rawShotPath, finalPath);
    fs.rmSync(rawShotPath, { force: true });
    thumbRel = path.relative(projectRoot, finalPath).split(path.sep).join("/");
  } catch (err) {
    out.thumb_error = `thumb_failed: ${err.message.split("\n")[0]}`;
  }

  await ctx.close().catch(() => {});

  // ---- analyse --------------------------------------------------------------
  out.palette = derivePalette(probe);
  out.fonts = deriveFonts(probe);
  out.photo_style = derivePhotoStyle(probe);
  const tone = deriveTone({ probe, archetypeHint: archetype, palette: out.palette });
  out.tone = tone.tone;
  out.tone_confidence = tone.confidence;
  out.signals = tone.signals;
  if (thumbRel) out.thumb = thumbRel;
  out.title = probe.title;

  return out;
}

// --- palette derivation ------------------------------------------------------

function derivePalette(probe) {
  // Build a candidate pool: CTA bg colors, heading colors, body bg/text, and
  // CSS custom props. Then assign roles by saturation / lightness / hue.
  const pool = new Map(); // hex -> { hex, role_hint, weight }
  const add = (raw, role, weight = 1) => {
    const hex = toHex(raw);
    if (!hex) return;
    const prev = pool.get(hex) || { hex, roles: new Set(), weight: 0 };
    prev.roles.add(role);
    prev.weight += weight;
    pool.set(hex, prev);
  };

  // CTAs are the strongest signal for accent/primary.
  for (const cta of probe.ctas || []) {
    add(cta.bg, "cta", 3);
    add(cta.color, "cta-fg", 1);
  }
  // Headings give us text color + background.
  for (const h of probe.headings || []) {
    add(h.color, "heading", 2);
    add(h.bg, "heading-bg", 1);
  }
  // Body is the canvas.
  add(probe.bodyBg, "bg", 4);
  add(probe.bodyColor, "text", 3);
  add(probe.pColor, "text", 1);

  // CSS custom props — only those whose name strongly implies a role.
  for (const [name, val] of Object.entries(probe.cssVars || {})) {
    const lc = name.toLowerCase();
    let role = "var";
    if (/(accent|brand|primary)/.test(lc)) role = "accent";
    else if (/(secondary|surface)/.test(lc)) role = "surface";
    else if (/(bg|background)/.test(lc)) role = "bg";
    else if (/(text|fg|foreground|ink)/.test(lc)) role = "text";
    add(val, role, 1);
  }

  // Categorise candidates.
  const candidates = [];
  for (const item of pool.values()) {
    const hsl = hexToHsl(item.hex);
    if (!hsl) continue;
    candidates.push({ ...item, hsl });
  }

  // Background: pick highest-weight color tagged as "bg" / "heading-bg" with
  // lightness > 0.85, falling back to the lightest candidate overall.
  const bgPick =
    candidates
      .filter((c) => (c.roles.has("bg") || c.roles.has("heading-bg")) && c.hsl.l > 0.7)
      .sort((a, b) => b.weight - a.weight)[0] ||
    [...candidates].sort((a, b) => b.hsl.l - a.hsl.l)[0];

  // Text/primary: dark color with low lightness.
  const textPick =
    candidates
      .filter((c) => (c.roles.has("text") || c.roles.has("heading")) && c.hsl.l < 0.4)
      .sort((a, b) => b.weight - a.weight)[0] ||
    [...candidates].sort((a, b) => a.hsl.l - b.hsl.l)[0];

  // Accent: highest-saturation non-bg, non-text candidate, ideally tagged cta.
  const sortedSat = [...candidates]
    .filter((c) => c.hsl.s > 0.35 && c.hsl.l > 0.15 && c.hsl.l < 0.85)
    .sort((a, b) => {
      const ctaBoostA = a.roles.has("cta") ? 0.3 : 0;
      const ctaBoostB = b.roles.has("cta") ? 0.3 : 0;
      const accentBoostA = a.roles.has("accent") ? 0.2 : 0;
      const accentBoostB = b.roles.has("accent") ? 0.2 : 0;
      return (b.hsl.s + ctaBoostB + accentBoostB) - (a.hsl.s + ctaBoostA + accentBoostA);
    });
  const accentPick = sortedSat[0];

  // Warm/secondary accent: a saturated warm-hue pick distinct from the primary
  // accent. Useful for brands that pair a cool primary with a warm highlight.
  const warmPick = sortedSat.find(
    (c) => c !== accentPick && isWarmHue(c.hsl.h),
  );

  return {
    primary: textPick ? textPick.hex : null,
    accent: accentPick ? accentPick.hex : null,
    bg: bgPick ? bgPick.hex : null,
    warm: warmPick ? warmPick.hex : null,
  };
}

// --- fonts -------------------------------------------------------------------

function cleanFont(raw) {
  if (!raw) return null;
  // Pull first stack entry, strip quotes.
  const first = raw.split(",")[0].trim().replace(/^["']|["']$/g, "");
  if (!first) return null;
  // Drop generic families.
  if (/^(sans-serif|serif|monospace|system-ui|-apple-system)$/i.test(first)) {
    // try second
    const second = raw.split(",")[1];
    if (second) return cleanFont(second);
    return first;
  }
  return first;
}

function deriveFonts(probe) {
  // Display font: dominant heading font. Body: paragraph or body fallback.
  const headFontRaw =
    probe.headings && probe.headings[0] ? probe.headings[0].font : "";
  const display = cleanFont(headFontRaw) || cleanFont(probe.bodyFont);
  const body = cleanFont(probe.pFont) || cleanFont(probe.bodyFont) || display;
  return { display: display || null, body: body || null };
}

// --- photo style -------------------------------------------------------------

function derivePhotoStyle(probe) {
  const imgs = probe.imgs || [];
  const visibleCount = imgs.length;
  const svgCount = probe.svgCount || 0;

  // Illustration-heavy: fewer raster images than SVGs above the fold.
  if (visibleCount === 0 && svgCount > 2) return "illustration";
  if (visibleCount > 0 && svgCount > visibleCount * 2) return "illustration";

  if (visibleCount === 0) return "minimal";

  // Product: square-ish, white background tells us a packshot. We don't have
  // pixel data, but we can use aspect ratio + alt text heuristics.
  const productHits = imgs.filter((img) => {
    const ratioOk = img.ratio >= 0.7 && img.ratio <= 1.4;
    const altSignal = /shoe|product|bottle|bag|jacket|pack|frame|kit|set/.test(
      img.alt,
    );
    return ratioOk || altSignal;
  }).length;

  // Human: portrait ratios + people alt text.
  const humanHits = imgs.filter((img) => {
    const altSignal = /person|people|portrait|hand|smile|face|child|community|family|woman|man|team/.test(
      img.alt,
    );
    const portrait = img.ratio < 0.9;
    return altSignal || portrait;
  }).length;

  if (humanHits >= productHits && humanHits / visibleCount >= 0.4) return "human-centric";
  if (productHits / visibleCount >= 0.4) return "product";
  // Default — landscape editorial photography (common on news/atlas sites).
  return "editorial";
}

// --- tone --------------------------------------------------------------------

function deriveTone({ probe, archetypeHint, palette }) {
  // Score each tone by stacking signals. The hint is one signal but not the
  // only one — palette + copy keywords can override (or reinforce) it.
  const scores = {
    warm: 0,
    energetic: 0,
    documentary: 0,
    lifestyle: 0,
    luxury: 0,
    playful: 0,
  };
  const signals = [];

  function bump(tone, weight, reason) {
    scores[tone] = (scores[tone] || 0) + weight;
    signals.push({ tone, weight, reason });
  }

  // Archetype hint — start with a small base bump for the curator's grouping.
  if (archetypeHint && scores[archetypeHint] != null) {
    bump(archetypeHint, 0.6, `curator_hint:${archetypeHint}`);
  }

  // Palette warmth: warm accent → warm/lifestyle. Highly-saturated bright accent
  // → energetic/playful. Near-black on near-white → documentary/luxury.
  const accentHsl = hexToHsl(palette.accent);
  const bgHsl = hexToHsl(palette.bg);
  const primaryHsl = hexToHsl(palette.primary);

  if (accentHsl) {
    if (isWarmHue(accentHsl.h) && accentHsl.s > 0.45) {
      bump("warm", 0.7, "warm_accent_hue");
      bump("lifestyle", 0.3, "warm_accent_hue");
    }
    if (accentHsl.s > 0.65 && accentHsl.l > 0.35 && accentHsl.l < 0.7) {
      bump("energetic", 0.6, "vivid_accent");
      bump("playful", 0.3, "vivid_accent");
    }
    if (accentHsl.s < 0.15 && accentHsl.l < 0.25) {
      bump("documentary", 0.5, "near_black_accent");
      bump("luxury", 0.4, "near_black_accent");
    }
  }
  if (bgHsl && bgHsl.l > 0.95 && primaryHsl && primaryHsl.l < 0.2) {
    bump("documentary", 0.3, "high_contrast_editorial");
  }
  if (
    bgHsl &&
    bgHsl.l > 0.85 &&
    bgHsl.l < 0.99 &&
    accentHsl &&
    isWarmHue(accentHsl.h)
  ) {
    bump("warm", 0.3, "off_white_warm");
  }

  // Copy vocab from h1/h2.
  const headingText = (probe.headings || [])
    .map((h) => h.text)
    .join(" ")
    .toLowerCase();
  const ctaText = (probe.ctas || []).map((c) => c.text).join(" ").toLowerCase();
  const allText = `${headingText} ${ctaText} ${probe.title || ""}`.toLowerCase();

  const vocab = {
    warm: /(community|together|kindred|local|neighbour|neighbor|care|support|family|story|stories)/,
    energetic: /(faster|fastest|build|ship|scale|launch|workflow|productivity|api|developer|product)/,
    documentary: /(report|investigation|news|long ?read|interview|essay|history|archive|atlas|hidden|wonder)/,
    lifestyle: /(everyday|wear|comfortable|natural|sustainable|crafted|wardrobe|skin|essential)/,
    luxury: /(crafted|timeless|signature|reserve|edition|premium|elevated)/,
    playful: /(fun|love|hello|hi|hey|magic|delight|made for you|join the fun)/,
  };
  for (const [tone, re] of Object.entries(vocab)) {
    if (re.test(allText)) bump(tone, 0.5, `vocab_${tone}`);
  }

  // Photo-style → tone mapping.
  const photoStyle = derivePhotoStyle(probe);
  if (photoStyle === "human-centric") bump("warm", 0.4, "human_photos");
  if (photoStyle === "product") {
    bump("lifestyle", 0.5, "product_photos");
    bump("luxury", 0.2, "product_photos");
  }
  if (photoStyle === "illustration") bump("playful", 0.4, "illustration_heavy");
  if (photoStyle === "editorial") bump("documentary", 0.3, "editorial_layout");

  // Pick winner.
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winner, topScore] = ranked[0];
  const [, runnerUp] = ranked[1];
  // Confidence: gap between #1 and #2, normalised. Cap at 0.95 because we never
  // really know without human review.
  const denom = topScore + 0.001;
  const gap = (topScore - runnerUp) / denom;
  const confidence = Math.max(0.2, Math.min(0.95, +(gap + topScore / 4).toFixed(2)));

  return { tone: winner, confidence, signals };
}

// --- thumbnail compression via ffmpeg ----------------------------------------

async function compressThumb(srcPath, dstPath) {
  // Resize to 200x400 (portrait crop of above-the-fold area), JPEG quality 70.
  // We re-encode at decreasing q levels until ≤30KB. ffmpeg's -q:v scale is
  // 2 (best) → 31 (worst) for mjpeg. Start at 5 (~quality 70 equivalent).
  const ffmpeg = await getFfmpegPath();
  const targetBytes = 30 * 1024;
  let q = 5;
  while (q <= 20) {
    await runFfmpeg(ffmpeg, [
      "-y",
      "-loglevel", "error",
      "-i", srcPath,
      // Crop the 1920x1080 shot to a portrait 540x1080 strip from the left
      // (top-left where the hero typically lives), then scale to 200x400.
      "-vf", "crop=540:1080:0:0,scale=200:400",
      "-q:v", String(q),
      dstPath,
    ]);
    const size = fs.statSync(dstPath).size;
    if (size <= targetBytes) return;
    q += 2;
  }
  // Last attempt at q=20 — accept whatever we got.
}

function runFfmpeg(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${err.slice(0, 400)}`));
    });
    p.on("error", reject);
  });
}

// --- markdown summary --------------------------------------------------------

function buildMarkdown(library) {
  const lines = [];
  lines.push("# Brand Fingerprint Library");
  lines.push("");
  lines.push(
    `Generated ${TODAY} via \`scripts/fingerprint-brands.mjs\`. ` +
    "Cached palette / fonts / tone for the brand picker — look up by host " +
    "instead of re-deriving per render.",
  );
  lines.push("");
  lines.push("| Brand | Tone | Confidence | Photo style | Palette |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const [host, fp] of Object.entries(library)) {
    if (fp.error) {
      lines.push(`| \`${host}\` | _error_ | — | — | ${fp.error} |`);
      continue;
    }
    const swatches = ["primary", "accent", "bg", "warm"]
      .map((role) => {
        const hex = fp.palette && fp.palette[role];
        return hex ? `\`${role}:${hex}\`` : "";
      })
      .filter(Boolean)
      .join(" ");
    lines.push(
      `| [\`${host}\`](${fp.url}) | ${fp.tone} | ${fp.tone_confidence} | ${fp.photo_style} | ${swatches} |`,
    );
  }
  lines.push("");
  lines.push("## Details");
  lines.push("");
  for (const [host, fp] of Object.entries(library)) {
    lines.push(`### ${host}`);
    lines.push("");
    if (fp.error) {
      lines.push(`Error: \`${fp.error}\``);
      lines.push("");
      continue;
    }
    if (fp.thumb) {
      lines.push(`![${host} thumbnail](${fp.thumb})`);
      lines.push("");
    }
    lines.push(`- URL: ${fp.url}`);
    if (fp.title) lines.push(`- Page title: ${fp.title}`);
    lines.push(`- Tone: **${fp.tone}** (confidence ${fp.tone_confidence})`);
    lines.push(`- Photo style: ${fp.photo_style}`);
    if (fp.fonts) {
      lines.push(`- Fonts: display \`${fp.fonts.display ?? "?"}\`, body \`${fp.fonts.body ?? "?"}\``);
    }
    if (fp.palette) {
      const p = fp.palette;
      lines.push(
        `- Palette: primary \`${p.primary ?? "?"}\` · accent \`${p.accent ?? "?"}\`` +
        ` · bg \`${p.bg ?? "?"}\` · warm \`${p.warm ?? "?"}\``,
      );
    }
    lines.push("");
  }
  return lines.join("\n") + "\n";
}

// --- main --------------------------------------------------------------------

function pickBrands(argv) {
  const args = argv.slice(2);
  if (args.length === 0) return DEFAULT_BRANDS;
  const wanted = new Set(args.map((a) => a.toLowerCase()));
  const subset = DEFAULT_BRANDS.filter((b) => {
    const host = new URL(b.url).hostname.replace(/^www\./, "").toLowerCase();
    return wanted.has(host) || wanted.has(b.url.toLowerCase());
  });
  if (subset.length === 0) {
    // Treat raw args as ad-hoc URLs.
    return args.map((a) => ({
      url: /^https?:\/\//.test(a) ? a : `https://${a}`,
      archetype: null,
    }));
  }
  return subset;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const brands = pickBrands(process.argv);
  const browser = await chromium.launch({ headless: true });

  // Load any existing library so partial re-runs preserve other entries.
  let library = {};
  if (fs.existsSync(OUT_JSON)) {
    try {
      library = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
    } catch {
      library = {};
    }
  }

  for (let i = 0; i < brands.length; i++) {
    const entry = brands[i];
    const t0 = Date.now();
    let fp;
    try {
      fp = await fingerprintUrl(browser, entry);
    } catch (err) {
      const host = new URL(entry.url).hostname.replace(/^www\./, "");
      fp = { host, url: entry.url, error: `unhandled: ${err.message.split("\n")[0]}`, fingerprinted_at: TODAY };
    }
    const ms = Date.now() - t0;
    const status = fp.error ? `ERROR ${fp.error}` : `${fp.tone}@${fp.tone_confidence} (${fp.photo_style})`;
    console.log(`[${i + 1}/${brands.length}] ${fp.host} — ${status}  ${ms}ms`);
    library[fp.host] = fp;

    // Polite delay between domains.
    if (i < brands.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  await browser.close();

  // Sort keys by archetype group → deterministic JSON & MD output.
  const ordered = {};
  for (const key of Object.keys(library).sort()) ordered[key] = library[key];

  fs.writeFileSync(OUT_JSON, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  fs.writeFileSync(OUT_MD, buildMarkdown(ordered), "utf8");

  const ok = Object.values(ordered).filter((v) => !v.error).length;
  const total = Object.keys(ordered).length;
  console.log(`Wrote ${OUT_JSON} (${ok}/${total} successful)`);
  console.log(`Wrote ${OUT_MD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
