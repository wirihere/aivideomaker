// Smoke test — fast pre-render sanity check for the active composition.
//
// Catches the bugs we hit by hand in <5 seconds:
//   - </script> in JS comments breaking inline-bundled modules
//   - Cards.css 1080×1920 portrait override on landscape comps
//   - GSAP from() tween stuck at opacity:0 (use fromTo)
//   - Missing module globals (textFx, effectFx, glitterFx)
//   - Empty timeline (script error before tweens were added)
//   - Console errors at load
//
// Usage:
//   node scripts/smoke.mjs                       # check live server at localhost:3002
//   node scripts/smoke.mjs --port=3003           # custom port
//   node scripts/smoke.mjs --screenshots         # save key-frame screenshots to smoke/
//   node scripts/smoke.mjs --start               # spawn hyperframes preview if not running
//   node scripts/smoke.mjs --screenshots --diff  # compare each shot to smoke/.baseline/<id>.png
//   node scripts/smoke.mjs --screenshots --diff --threshold=0.05  # custom diff ratio (default 0.02)
//   node scripts/smoke.mjs --screenshots --update-baseline        # promote current shots to baseline
//   node scripts/smoke.mjs --screenshots --contrast               # WCAG AA contrast audit per scene
//
// Flags:
//   --contrast — at each scene midpoint, sample foreground vs ancestor background
//                color on every visible text element and report WCAG AA failures.
//                Threshold: 3:1 for large text (≥24px regular OR ≥18.66px bold),
//                4.5:1 for normal text. See LEARNINGS §4 (Kindred 2.9:1 incident).
//                Implies seeking each scene; pair with --screenshots since we're
//                already at the midpoint.
//
// Exit codes:
//   0 — all checks passed
//   1 — at least one check failed

import { spawn } from "child_process";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- arg parsing ----------------------------------------------------------
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const port = +flags.port || 3002;
const wantScreenshots = flags.screenshots === true;
const startServer = flags.start === true;
const wantDiff = flags.diff === true;
const wantUpdateBaseline = flags["update-baseline"] === true;
const wantContrast = flags.contrast === true;
// Default 5% — glitter / sparkle / particle scenes drift 1-3% legitimately
// because CSS animations run on wall-clock time and screenshots vary by ms of
// capture timing. Real visual regressions (layout break, color shift, missing
// element) are 10-30%+, which still trip this threshold cleanly.
const diffThreshold = flags.threshold !== undefined ? +flags.threshold : 0.05;

// --- helpers --------------------------------------------------------------
const ok = []; const fails = []; const warns = [];
const pass = (msg) => ok.push(msg);
const fail = (msg) => fails.push(msg);
const warn = (msg) => warns.push(msg);

async function ensureServer() {
  // Probe; if down and --start passed, spawn it.
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`http://localhost:${port}/`);
      if (r.ok) return null;
    } catch {}
    if (!startServer) break;
    if (i === 0) {
      const child = spawn("npx", ["hyperframes", "preview", "--port", String(port)], {
        cwd: projectRoot, shell: true, detached: false, stdio: "ignore",
      });
      child.unref();
      await new Promise(r => setTimeout(r, 3500));
    }
  }
  // Final probe
  try { const r = await fetch(`http://localhost:${port}/`); if (!r.ok) throw new Error("not OK"); }
  catch (err) { throw new Error(`hyperframes preview not reachable on :${port} (pass --start to spawn it)`); }
}

// Mimic the renderer's clip-visibility logic in the page so screenshots show
// only the active scene at a given time.
const APPLY_CLIP_VIS_FN = `(t) => {
  document.querySelectorAll(".clip").forEach(el => {
    const root = el.closest("[data-composition-id]");
    if (root === el) return;
    const start = parseFloat(el.dataset.start) || 0;
    const dur   = parseFloat(el.dataset.duration) || 0;
    el.style.display = (t >= start && t < start + dur) ? "" : "none";
  });
}`;

// WCAG AA contrast audit. For each visible text element inside the active
// scene's clip window at time `t`, compute fg-vs-bg contrast ratio and compare
// against the WCAG threshold (3:1 large text, 4.5:1 normal). Returns
// { passes: [...], skipped: [...], fails: [{ selector, ratio, threshold, kind }] }.
//
// Implementation notes:
// - "Text element" heuristic: has non-empty text content AND its only children
//   are inline styling elements (span, em, strong, b, i, u). This catches
//   <h1>, <p>, .scene__kicker, etc. but skips containers with structural
//   children. We intentionally don't recurse into mixed containers — pick the
//   leaf-most text holder.
// - Background lookup: walk parents until we hit a non-transparent
//   background-color. If we never find one, the element is skipped (warn).
// - Active-scene gate: an element counts only if every ancestor `.clip` with
//   data-start/data-duration covers `t`. This avoids reporting hidden
//   inactive-scene elements (LEARNINGS §4 false-positive trap).
// - Selector: shortest that uniquely identifies — prefers `#id`, falls back
//   to `tag.firstClass`. Truncated to 60 chars for log readability.
// - Pure JS, no libraries; runs in the page context.
const CONTRAST_AUDIT_FN = `(t) => {
  const sRGBtoLin = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = (r, g, b) =>
    0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
  const parseColor = (str) => {
    // getComputedStyle returns "rgb(R, G, B)" or "rgba(R, G, B, A)" — never hex.
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(",").map(s => parseFloat(s.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const contrastRatio = (fg, bg) => {
    const Lf = luminance(fg.r, fg.g, fg.b);
    const Lb = luminance(bg.r, bg.g, bg.b);
    const [L1, L2] = Lf > Lb ? [Lf, Lb] : [Lb, Lf];
    return (L1 + 0.05) / (L2 + 0.05);
  };
  // Walk up to find a real background. Returns null if none found.
  const findBg = (el) => {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const cs = getComputedStyle(cur);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) return bg;
      cur = cur.parentElement;
    }
    // Fall through to body / html background as last resort.
    const bodyBg = parseColor(getComputedStyle(document.body).backgroundColor);
    if (bodyBg && bodyBg.a > 0) return bodyBg;
    const htmlBg = parseColor(getComputedStyle(document.documentElement).backgroundColor);
    if (htmlBg && htmlBg.a > 0) return htmlBg;
    return null;
  };
  // True iff every ancestor .clip with data-start/data-duration covers t.
  const inActiveClipWindow = (el) => {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      if (cur.classList && cur.classList.contains("clip") &&
          cur.dataset && cur.dataset.start !== undefined && cur.dataset.duration !== undefined) {
        // Skip the root composition (data-composition-id) — it's always active.
        if (!cur.hasAttribute("data-composition-id")) {
          const s = parseFloat(cur.dataset.start) || 0;
          const d = parseFloat(cur.dataset.duration) || 0;
          if (!(t >= s && t < s + d)) return false;
        }
      }
      cur = cur.parentElement;
    }
    return true;
  };
  // Heuristic: leaf text element — has non-empty trimmed text and child
  // elements (if any) are only inline styling tags.
  const INLINE_TAGS = new Set(["SPAN", "EM", "STRONG", "B", "I", "U", "SMALL", "MARK", "SUB", "SUP", "CODE", "BR"]);
  const isLeafTextEl = (el) => {
    const text = (el.textContent || "").trim();
    if (!text) return false;
    for (const child of el.children) {
      if (!INLINE_TAGS.has(child.tagName)) return false;
    }
    return true;
  };
  const shortSelector = (el) => {
    if (el.id) return "#" + el.id;
    const cls = el.className && typeof el.className === "string"
      ? el.className.trim().split(/\\s+/).filter(c => c && !c.startsWith("fx-") && c !== "clip")[0]
      : null;
    const sel = cls ? el.tagName.toLowerCase() + "." + cls : el.tagName.toLowerCase();
    return sel.length > 60 ? sel.slice(0, 57) + "..." : sel;
  };

  const passes = [];
  const skipped = [];
  const fails = [];

  const all = document.querySelectorAll("*");
  for (const el of all) {
    if (!isLeafTextEl(el)) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    if (!inActiveClipWindow(el)) continue;

    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = findBg(el);
    if (!bg) {
      skipped.push({ selector: shortSelector(el) });
      continue;
    }

    const ratio = contrastRatio(fg, bg);
    const fontSize = parseFloat(cs.fontSize) || 16;
    const fontWeight = parseInt(cs.fontWeight, 10) || 400;
    // WCAG large-text rule: ≥18pt regular OR ≥14pt bold. At 96dpi: 18pt = 24px, 14pt ≈ 18.66px.
    const isLarge = (fontSize >= 24 && fontWeight < 700) || (fontSize >= 18.66 && fontWeight >= 700);
    const threshold = isLarge ? 3 : 4.5;
    const kind = isLarge ? "large" : "normal";

    if (ratio < threshold) {
      fails.push({ selector: shortSelector(el), ratio, threshold, kind });
    } else {
      passes.push({ selector: shortSelector(el), ratio });
    }
  }
  return { passes, skipped, fails };
}`;

// --- main -----------------------------------------------------------------
const t0 = Date.now();
console.log(`▶ smoke: localhost:${port} (project: ${path.basename(projectRoot)})`);

try {
  await ensureServer();
} catch (err) {
  console.error("✗", err.message);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

// Speed boost for non-screenshot smoke runs: short-circuit fonts, images, and
// media with empty 204 responses (instead of aborting, which triggers console
// errors). The composition's inline scripts still run; runtime checks don't
// need the visible assets. Drops nav from ~600ms to ~300ms.
if (!wantScreenshots) {
  await context.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "media" || t === "font") {
      return route.fulfill({ status: 204, body: "" });
    }
    return route.continue();
  });
}

const consoleErrors = [];
page.on("pageerror", err => consoleErrors.push(err.message));
page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

const previewUrl = `http://localhost:${port}/api/projects/${path.basename(projectRoot)}/preview`;

try {
  await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  pass("page loaded");
} catch (err) {
  fail(`page navigation failed: ${err.message}`);
  await browser.close(); report(); process.exit(1);
}

// Globals + timeline + dims
const probe = await page.evaluate(() => {
  const tlKey = window.__timelines ? Object.keys(window.__timelines)[0] : null;
  const tl = tlKey ? window.__timelines[tlKey] : null;
  const root = document.querySelector("[data-composition-id]");
  return {
    title: document.title,
    tlKey,
    tlChildren: tl ? tl.getChildren().length : 0,
    tlDuration: tl ? tl.duration() : 0,
    hasGsap: typeof gsap !== "undefined",
    modules: {
      textFx:    typeof textFx !== "undefined",
      effectFx:  typeof effectFx !== "undefined",
      glitterFx: typeof glitterFx !== "undefined",
      ampBind:   typeof ampBind !== "undefined",
    },
    rootDims: root ? {
      cssW: parseInt(root.dataset.width)  || null,
      cssH: parseInt(root.dataset.height) || null,
      actualW: root.getBoundingClientRect().width,
      actualH: root.getBoundingClientRect().height,
    } : null,
    sceneIds: Array.from(document.querySelectorAll(".scene")).map(s => s.id),
  };
});

if (probe.tlKey)              pass(`timeline registered: ${probe.tlKey}`);
else                          fail("no timeline registered on window.__timelines");

if (probe.tlChildren >= 5)    pass(`timeline has ${probe.tlChildren} tweens, ${probe.tlDuration.toFixed(2)}s`);
else if (probe.tlChildren === 0) fail("timeline is empty (likely a script error before tweens were added)");
else                          warn(`timeline has only ${probe.tlChildren} tweens — verify intentional`);

if (probe.hasGsap)            pass("gsap loaded");
else                          fail("gsap not loaded — check CDN script");

for (const [name, present] of Object.entries(probe.modules)) {
  // Only require modules that the comp's HTML references.
  const html = await page.content();
  const referenced = html.includes(`/${name === "ampBind" ? "scripts/lib/amp-bind" : "design/modules/" + kebab(name)}.js`);
  if (referenced && !present) fail(`module ${name} referenced but not on window — check for </script> in JS comments`);
  else if (present)           pass(`module ${name} loaded`);
}

if (probe.rootDims) {
  const { cssW, cssH, actualW, actualH } = probe.rootDims;
  if (cssW && cssH) {
    if (Math.abs(actualW - cssW) < 4 && Math.abs(actualH - cssH) < 4)
      pass(`root dims ${cssW}×${cssH} match actual ${Math.round(actualW)}×${Math.round(actualH)}`);
    else
      fail(`root dims ${cssW}×${cssH} but actual ${Math.round(actualW)}×${Math.round(actualH)} — likely cards.css portrait override`);
  } else {
    warn("root data-width/data-height not set");
  }
}

if (consoleErrors.length === 0) pass("no console/runtime errors");
else { for (const e of consoleErrors) fail(`console error: ${e.slice(0, 140)}`); }

// Optional scene-midpoint actions: screenshots and/or WCAG contrast audit.
// Both share the same seek-each-scene loop so we don't pay for two passes.
if ((wantScreenshots || wantContrast) && probe.sceneIds.length) {
  const dir = path.join(projectRoot, "smoke");
  const baselineDir = path.join(dir, ".baseline");
  if (wantScreenshots) {
    fs.mkdirSync(dir, { recursive: true });
    if (wantUpdateBaseline) fs.mkdirSync(baselineDir, { recursive: true });
  }
  await page.evaluate(`window.__applyClipVis = ${APPLY_CLIP_VIS_FN};`);
  if (wantContrast) {
    await page.evaluate(`window.__auditContrast = ${CONTRAST_AUDIT_FN};`);
  }

  // Get each scene's midpoint time
  const scenes = await page.evaluate(() => Array.from(document.querySelectorAll(".scene")).map(s => ({
    id: s.id,
    mid: (parseFloat(s.dataset.start) || 0) + (parseFloat(s.dataset.duration) || 0) / 2,
  })));

  // Pause all CSS animations + transitions so screenshots are deterministic
  // across runs. Glitter sparkle, cinemagraph rotation, and any other CSS
  // keyframe animations would otherwise drift by capture-timing jitter (1-5%
  // pixel diff between identical runs). Paused state is whatever the browser
  // happened to be at when this rule applied — crucially, the same across
  // back-to-back runs because rule injection happens at the same render frame.
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-play-state: paused !important;
      transition-duration: 0s !important;
    }`,
  });

  for (const sc of scenes) {
    await page.evaluate(({ t, ids }) => {
      const tl = window.__timelines[Object.keys(window.__timelines)[0]];
      tl.pause(); tl.seek(t);
      window.__applyClipVis(t);
    }, { t: sc.mid, ids: probe.sceneIds });
    await page.waitForTimeout(80);   // allow paint

    if (wantScreenshots) {
      const file = path.join(dir, `${sc.id}-t${sc.mid.toFixed(1)}.png`);
      const buf = await page.screenshot({ path: file, type: "png" });
      pass(`screenshot ${path.relative(projectRoot, file)}`);

      if (wantUpdateBaseline) {
        const baselineFile = path.join(baselineDir, `${sc.id}.png`);
        fs.copyFileSync(file, baselineFile);
        pass(`baseline updated ${path.relative(projectRoot, baselineFile)}`);
      } else if (wantDiff) {
        const baselineFile = path.join(baselineDir, `${sc.id}.png`);
        if (!fs.existsSync(baselineFile)) {
          warn(`no baseline for ${sc.id} — run \`npm run smoke:baseline\` to create`);
        } else {
          const baselineBuf = fs.readFileSync(baselineFile);
          try {
            const result = await diffPngs(page, buf, baselineBuf);
            const pct = (result.ratio * 100).toFixed(2);
            if (result.dimMismatch) {
              fail(`diff ${sc.id}: dimension mismatch (current ${result.curW}×${result.curH} vs baseline ${result.baseW}×${result.baseH})`);
            } else if (result.ratio > diffThreshold) {
              fail(`diff ${sc.id}: ${pct}% pixels changed (threshold ${(diffThreshold * 100).toFixed(2)}%, ${result.changed}/${result.total})`);
            } else {
              pass(`diff ${sc.id}: ${pct}% pixels changed (within ${(diffThreshold * 100).toFixed(2)}%)`);
            }
          } catch (err) {
            fail(`diff ${sc.id}: comparison failed — ${err.message}`);
          }
        }
      }
    }

    if (wantContrast) {
      const audit = await page.evaluate((t) => window.__auditContrast(t), sc.mid);
      if (audit.passes.length) pass(`contrast ${sc.id}: ${audit.passes.length} elements ≥ threshold`);
      if (audit.skipped.length) warn(`contrast ${sc.id}: ${audit.skipped.length} element${audit.skipped.length === 1 ? "" : "s"} no background detected (skipped)`);
      for (const f of audit.fails) {
        fail(`contrast ${sc.id}: ${f.selector} ${f.ratio.toFixed(2)}:1 < ${f.threshold}:1 (${f.kind} text)`);
      }
    }
  }
}

await browser.close();

// Decode two PNGs in the running browser via canvas, then count differing pixels.
// Avoids adding a pngjs/sharp dependency — Playwright is already in the toolchain.
async function diffPngs(page, currentBuf, baselineBuf) {
  const cur = currentBuf.toString("base64");
  const base = baselineBuf.toString("base64");
  return await page.evaluate(async ({ cur, base }) => {
    const decode = (b64) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve({ w: img.naturalWidth, h: img.naturalHeight, data: ctx.getImageData(0, 0, c.width, c.height).data });
      };
      img.onerror = () => reject(new Error("png decode failed"));
      img.src = "data:image/png;base64," + b64;
    });
    const [a, b] = await Promise.all([decode(cur), decode(base)]);
    if (a.w !== b.w || a.h !== b.h) {
      return { dimMismatch: true, curW: a.w, curH: a.h, baseW: b.w, baseH: b.h, ratio: 1, changed: 0, total: 0 };
    }
    const len = a.data.length;
    let changed = 0;
    // Per-pixel RGBA exact match. Tolerance of 0 — anti-aliasing jitter is
    // absorbed by the threshold ratio, not per-pixel fuzz.
    for (let i = 0; i < len; i += 4) {
      if (a.data[i]     !== b.data[i]     ||
          a.data[i + 1] !== b.data[i + 1] ||
          a.data[i + 2] !== b.data[i + 2] ||
          a.data[i + 3] !== b.data[i + 3]) {
        changed++;
      }
    }
    const total = len / 4;
    return { dimMismatch: false, curW: a.w, curH: a.h, baseW: b.w, baseH: b.h, changed, total, ratio: changed / total };
  }, { cur, base });
}

function kebab(name) {
  if (name === "textFx")    return "text-fx";
  if (name === "effectFx")  return "effect-fx";
  if (name === "glitterFx") return "glitter-fx";
  return name;
}

function report() {
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  for (const m of ok)    console.log(`  ✓ ${m}`);
  for (const m of warns) console.log(`  ⚠ ${m}`);
  for (const m of fails) console.log(`  ✗ ${m}`);
  console.log("");
  console.log(`◇ ${ok.length} passed · ${warns.length} warnings · ${fails.length} failed (${dt}s)`);
}

report();
process.exit(fails.length === 0 ? 0 : 1);
