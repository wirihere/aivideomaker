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

// Pre-warm: when we'll need scene contexts anyway, start creating them in
// parallel with the probe nav. Their navs overlap with the probe's, so the
// total nav time becomes max(probe, scene-context-create+nav) instead of
// probe + scene-context-create+nav. Saves 400-500ms when --screenshots/--contrast.
//
// We only pre-warm if --screenshots or --contrast is set. The non-screenshot
// path uses route-stubbed page (line 252) and can't share the asset-stubbed
// context anyway.
//
// Pre-warm count: we don't yet know scene count, so assume up to 5 extra
// contexts (probe page itself will serve scene 1, so we cap total at 6).
// Most comps have 4-6 scenes. Unused prewarmed contexts get closed cheaply.
const prewarming = (wantScreenshots || wantContrast);
let prewarmedContexts = null;
if (prewarming) {
  const PREWARM_COUNT = 5;
  prewarmedContexts = Array.from({ length: PREWARM_COUNT }, async () => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const p = await ctx.newPage();
    // Start nav immediately — don't await yet; wait happens later.
    const navPromise = p.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    return { ctx, page: p, navPromise };
  });
}

const tProbeStart = Date.now();
try {
  await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  if (process.env.SMOKE_TIMING) console.log(`[timing] probe nav ${Date.now() - tProbeStart}ms`);
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
// Each scene runs in its own BrowserContext in parallel — the probe page
// already proved the comp is structurally sound, so the per-scene work is
// independent and safe to fan out. Cap at 6 contexts (memory pressure on
// 16 GB box, and Chromium-context-create is ~200ms each).
if ((wantScreenshots || wantContrast) && probe.sceneIds.length) {
  const dir = path.join(projectRoot, "smoke");
  const baselineDir = path.join(dir, ".baseline");
  if (wantScreenshots) {
    fs.mkdirSync(dir, { recursive: true });
    if (wantUpdateBaseline) fs.mkdirSync(baselineDir, { recursive: true });
  }

  // Get each scene's midpoint time from the probe page (already loaded).
  const scenes = await page.evaluate(() => Array.from(document.querySelectorAll(".scene")).map(s => ({
    id: s.id,
    mid: (parseFloat(s.dataset.start) || 0) + (parseFloat(s.dataset.duration) || 0) / 2,
  })));

  // CSS rule injected on each parallel page to pause all CSS animations and
  // zero out transitions. Without this, glitter / sparkle / cinemagraph
  // animations drift by capture timing (1-5% pixel diff between identical
  // runs). Same string used in every context — defining it here keeps the
  // per-scene worker clean.
  const PAUSE_CSS = `*, *::before, *::after {
    animation-play-state: paused !important;
    transition-duration: 0s !important;
  }`;

  const MAX_PARALLEL = 6;
  const concurrency = Math.min(scenes.length, MAX_PARALLEL);

  // Per-scene worker: own context, own page, own diff. Returns a list of
  // {kind, msg} reports so the main thread can emit them in scene order
  // (stable output despite parallel completion).
  //
  // Three input modes for the page:
  //   - reusedPage:    use this already-loaded page (the probe page)
  //   - prewarmed:     {ctx, page, navPromise} from the pre-warm pool — nav
  //                    started in parallel with probe nav, just await it
  //   - null:          create a fresh context+nav (fallback when pool empty)
  const runScene = async (sc, reusedPage = null, prewarmed = null) => {
    const reports = [];
    const tStart = Date.now();
    let ctx, p;
    let tCtxReady;
    let isReused = false;
    if (reusedPage) {
      p = reusedPage;
      ctx = null; // don't close — owned by caller
      tCtxReady = tStart;
      isReused = true;
    } else if (prewarmed) {
      ctx = prewarmed.ctx;
      p = prewarmed.page;
      tCtxReady = Date.now();
    } else {
      ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      p = await ctx.newPage();
      tCtxReady = Date.now();
    }
    let tNav = tCtxReady;
    try {
      if (prewarmed) {
        await prewarmed.navPromise;
        tNav = Date.now();
        await p.waitForFunction(() => window.__timelines && Object.keys(window.__timelines).length > 0, { timeout: 5000 });
      } else if (!reusedPage) {
        await p.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        tNav = Date.now();
        // Wait for timeline registration — the comp's inline script registers
        // window.__timelines synchronously after gsap loads, so by the time
        // domcontentloaded fires it's usually there. Poll briefly to be safe.
        await p.waitForFunction(() => window.__timelines && Object.keys(window.__timelines).length > 0, { timeout: 5000 });
      }

      await p.evaluate(`window.__applyClipVis = ${APPLY_CLIP_VIS_FN};`);
      if (wantContrast) {
        await p.evaluate(`window.__auditContrast = ${CONTRAST_AUDIT_FN};`);
      }
      await p.addStyleTag({ content: PAUSE_CSS });

      await p.evaluate((t) => {
        const tl = window.__timelines[Object.keys(window.__timelines)[0]];
        tl.pause(); tl.seek(t);
        window.__applyClipVis(t);
      }, sc.mid);
      await p.waitForTimeout(80);   // allow paint

      const tBeforeShot = Date.now();
      if (wantScreenshots) {
        const file = path.join(dir, `${sc.id}-t${sc.mid.toFixed(1)}.png`);
        const buf = await p.screenshot({ path: file, type: "png" });
        const tAfterShot = Date.now();
        if (process.env.SMOKE_TIMING) console.log(`[timing] scene ${sc.id} shot=${tAfterShot - tBeforeShot}ms`);
        reports.push({ kind: "pass", msg: `screenshot ${path.relative(projectRoot, file)}` });

        if (wantUpdateBaseline) {
          const baselineFile = path.join(baselineDir, `${sc.id}.png`);
          fs.copyFileSync(file, baselineFile);
          reports.push({ kind: "pass", msg: `baseline updated ${path.relative(projectRoot, baselineFile)}` });
        } else if (wantDiff) {
          const baselineFile = path.join(baselineDir, `${sc.id}.png`);
          if (!fs.existsSync(baselineFile)) {
            reports.push({ kind: "warn", msg: `no baseline for ${sc.id} — run \`npm run smoke:baseline\` to create` });
          } else {
            const baselineBuf = fs.readFileSync(baselineFile);
            try {
              const tDiff = Date.now();
              const result = await diffPngs(p, buf, baselineBuf);
              if (process.env.SMOKE_TIMING) console.log(`[timing] scene ${sc.id} diff=${Date.now() - tDiff}ms`);
              const pct = (result.ratio * 100).toFixed(2);
              if (result.dimMismatch) {
                reports.push({ kind: "fail", msg: `diff ${sc.id}: dimension mismatch (current ${result.curW}×${result.curH} vs baseline ${result.baseW}×${result.baseH})` });
              } else if (result.ratio > diffThreshold) {
                reports.push({ kind: "fail", msg: `diff ${sc.id}: ${pct}% pixels changed (threshold ${(diffThreshold * 100).toFixed(2)}%, ${result.changed}/${result.total})` });
              } else {
                reports.push({ kind: "pass", msg: `diff ${sc.id}: ${pct}% pixels changed (within ${(diffThreshold * 100).toFixed(2)}%)` });
              }
            } catch (err) {
              reports.push({ kind: "fail", msg: `diff ${sc.id}: comparison failed — ${err.message}` });
            }
          }
        }
      }

      if (wantContrast) {
        const audit = await p.evaluate((t) => window.__auditContrast(t), sc.mid);
        if (audit.passes.length) reports.push({ kind: "pass", msg: `contrast ${sc.id}: ${audit.passes.length} elements ≥ threshold` });
        if (audit.skipped.length) reports.push({ kind: "warn", msg: `contrast ${sc.id}: ${audit.skipped.length} element${audit.skipped.length === 1 ? "" : "s"} no background detected (skipped)` });
        for (const f of audit.fails) {
          reports.push({ kind: "fail", msg: `contrast ${sc.id}: ${f.selector} ${f.ratio.toFixed(2)}:1 < ${f.threshold}:1 (${f.kind} text)` });
        }
      }
    } catch (err) {
      reports.push({ kind: "fail", msg: `scene ${sc.id}: ${err.message}` });
    } finally {
      if (ctx) await ctx.close();
    }
    if (process.env.SMOKE_TIMING) {
      const tag = isReused ? " (reused)" : (prewarmed ? " (prewarmed)" : "");
      console.log(`[timing] scene ${sc.id}: ctx=${tCtxReady - tStart}ms nav=${tNav - tCtxReady}ms total=${Date.now() - tStart}ms${tag}`);
    }
    return reports;
  };

  // Resolve pre-warm pool now (the array is Promises returning {ctx, page, navPromise}).
  // The contexts were created in parallel with probe nav — by now they should be ready.
  const pool = prewarmedContexts ? await Promise.all(prewarmedContexts) : [];

  // Fan out — bounded if scenes > MAX_PARALLEL (currently 4 scenes, but the
  // bound future-proofs against larger comps). Scene 1 reuses the probe page
  // (already loaded — saves a full nav). Scenes 2..N pull from the pre-warmed
  // pool (their navs ran in parallel with probe nav).
  const tFanOut = Date.now();
  const allReports = [];
  let poolIdx = 0;
  for (let i = 0; i < scenes.length; i += concurrency) {
    const batch = scenes.slice(i, i + concurrency);
    const batchReports = await Promise.all(batch.map((sc, idx) => {
      const isFirst = i === 0 && idx === 0;
      if (isFirst) return runScene(sc, page, null);
      const prewarmed = poolIdx < pool.length ? pool[poolIdx++] : null;
      return runScene(sc, null, prewarmed);
    }));
    allReports.push(...batchReports);
  }
  if (process.env.SMOKE_TIMING) console.log(`[timing] fanOut ${Date.now() - tFanOut}ms (${scenes.length} scenes)`);
  // Close any pre-warmed contexts we didn't use (e.g. comp had fewer scenes
  // than we pre-warmed). Cheap fire-and-forget.
  for (let j = poolIdx; j < pool.length; j++) {
    pool[j].ctx.close().catch(() => {});
  }
  // Probe context kept alive for first-scene reuse; close it now.
  await context.close();

  // Emit reports in scene order (matches sequential output ordering).
  for (const reports of allReports) {
    for (const r of reports) {
      if (r.kind === "pass") pass(r.msg);
      else if (r.kind === "warn") warn(r.msg);
      else fail(r.msg);
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

// Disk-hygiene footer: surface renders/ bloat before it becomes a problem.
// Non-blocking — never fails smoke. See `npm run renders:list` for details.
try {
  const rendersDir = path.join(projectRoot, "renders");
  if (fs.existsSync(rendersDir)) {
    let totalBytes = 0;
    for (const name of fs.readdirSync(rendersDir)) {
      if (!name.toLowerCase().endsWith(".mp4")) continue;
      try { totalBytes += fs.statSync(path.join(rendersDir, name)).size; } catch {}
    }
    const totalMB = totalBytes / (1024 * 1024);
    if (totalMB > 200) {
      console.warn(`  ⚠ renders/ is ${totalMB.toFixed(0)} MB — run \`npm run renders:list\` and consider \`npm run renders:prune\``);
    }
  }
} catch {}

process.exit(fails.length === 0 ? 0 : 1);
