// Custom renderer (Phase 1) — Playwright frame capture + ffmpeg encode.
//
// Why this exists alongside `npx hyperframes render`:
//   The vendor renderer is a black box. This script is an in-repo proof of
//   concept that gives us a deterministic capture loop we can extend with
//   custom passes (LUT, watermark inline, multi-pass compositing, etc.) and
//   that always uses our bundled ffmpeg via scripts/lib/ffmpeg-path.mjs.
//
//   Phase 1 scope: visual-only capture (no audio mixing). Phase 2 will fold
//   audio tracks back in via ffmpeg `-i audio.mp3 -map`. Phase 3 will move
//   to parallel BrowserContexts for >1 concurrent capture worker. See
//   docs/render-vite-roadmap.md.
//
// Usage:
//   node scripts/render-vite.mjs <composition-path> [--out <mp4-path>] [--fps 30]
//
// Examples:
//   node scripts/render-vite.mjs compositions/text-fx-demo.html
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --out renders/text-fx-vite.mp4
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --fps 60
//
// Output:
//   renders/<comp-basename>-vite-<timestamp>.mp4 (default)
//
// URL strategy:
//   Loads the composition via a file:// URL. Compositions reference assets
//   with relative paths (`../design/...`) which file:// resolves correctly.
//   Avoids needing a dev server for Phase 1 and keeps the script self-
//   contained. If we hit a comp that requires CORS-clean fetches (e.g.
//   audio decode) we'll switch to a static HTTP server like preview.mjs.

import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const rendersDir = path.join(projectRoot, "renders");

// --- arg parsing ----------------------------------------------------------

const argv = process.argv.slice(2);
const positional = [];
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) {
    positional.push(a);
    continue;
  }
  const eqSplit = a.replace(/^--/, "").split("=");
  if (eqSplit.length === 2) {
    flags[eqSplit[0]] = eqSplit[1];
  } else {
    // Support `--fps 30` as well as `--fps=30`.
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[eqSplit[0]] = next;
      i++;
    } else {
      flags[eqSplit[0]] = true;
    }
  }
}

const compArg = positional[0];
if (!compArg) {
  console.error("usage: node scripts/render-vite.mjs <composition-path> [--out <mp4>] [--fps 30]");
  process.exit(2);
}

const compPath = path.resolve(projectRoot, compArg);
if (!fs.existsSync(compPath)) {
  console.error(`composition not found: ${compPath}`);
  process.exit(2);
}

const fps = Number(flags.fps) || 30;
if (!Number.isFinite(fps) || fps <= 0 || fps > 240) {
  console.error(`invalid --fps: ${flags.fps}`);
  process.exit(2);
}

const compBase = path.basename(compPath, path.extname(compPath));
const ts = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .slice(0, 19);
const defaultOut = path.join(rendersDir, `${compBase}-vite-${ts}.mp4`);
const outPath = flags.out
  ? path.resolve(projectRoot, String(flags.out))
  : defaultOut;

if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });
if (!fs.existsSync(path.dirname(outPath))) fs.mkdirSync(path.dirname(outPath), { recursive: true });

// --- helpers --------------------------------------------------------------

function spawnAsync(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}

// Mirror the renderer's clip-visibility logic: only `.clip` elements whose
// [data-start, data-start+data-duration) window includes `t` should be
// visible. Without this, every scene paints on top of every other scene
// at every frame. (Same trick scripts/smoke.mjs uses for screenshots.)
const APPLY_CLIP_VIS_FN = `(t) => {
  document.querySelectorAll(".clip").forEach((el) => {
    const root = el.closest("[data-composition-id]");
    if (root === el) return;
    const start = parseFloat(el.dataset.start) || 0;
    const dur = parseFloat(el.dataset.duration) || 0;
    el.style.display = (t >= start && t < start + dur) ? "" : "none";
  });
}`;

// --- main -----------------------------------------------------------------

const t0 = Date.now();
console.log(`▶ render-vite: ${path.relative(projectRoot, compPath)} @ ${fps}fps`);

// Load the composition in headless Chromium via file:// URL.
const fileUrl = pathToFileURL(compPath).href;

const browser = await chromium.launch({ headless: true });
// Default viewport; we resize to data-width/data-height after probing.
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 30000 });

// Probe for dimensions, duration, timeline key.
const probe = await page.evaluate(() => {
  const root = document.querySelector("[data-composition-id]");
  if (!root) return { ok: false, reason: "no [data-composition-id] root" };
  const tlKey = window.__timelines ? Object.keys(window.__timelines)[0] : null;
  const tl = tlKey ? window.__timelines[tlKey] : null;
  const dataDuration = parseFloat(root.dataset.duration);
  return {
    ok: true,
    tlKey,
    width: parseInt(root.dataset.width, 10) || null,
    height: parseInt(root.dataset.height, 10) || null,
    dataDuration: Number.isFinite(dataDuration) ? dataDuration : null,
    tlDuration: tl && typeof tl.duration === "function" ? tl.duration() : null,
    tlChildren: tl && typeof tl.getChildren === "function" ? tl.getChildren().length : 0,
  };
});

if (!probe.ok) {
  console.error(`✗ probe failed: ${probe.reason}`);
  await browser.close();
  process.exit(1);
}
if (!probe.tlKey) {
  console.error("✗ no timeline registered on window.__timelines");
  await browser.close();
  process.exit(1);
}
if (!probe.width || !probe.height) {
  console.error("✗ root composition missing data-width/data-height");
  await browser.close();
  process.exit(1);
}
// Prefer data-duration on the root (authoritative), fall back to tl.duration().
const duration = probe.dataDuration ?? probe.tlDuration;
if (!duration || duration <= 0) {
  console.error(`✗ could not determine duration (data-duration=${probe.dataDuration}, tl=${probe.tlDuration})`);
  await browser.close();
  process.exit(1);
}

console.log(`  comp:     ${probe.tlKey}  ${probe.width}×${probe.height}  ${duration.toFixed(2)}s`);
console.log(`  timeline: ${probe.tlChildren} tweens`);

// Resize viewport to match the composition's authored dimensions so
// screenshots come out at native resolution.
await page.setViewportSize({ width: probe.width, height: probe.height });

const totalFrames = Math.ceil(duration * fps);
console.log(`  frames:   ${totalFrames}  (≈${(totalFrames / fps).toFixed(2)}s wall-clock minimum)`);

// PNG temp dir — keep it inside renders/ so it shares a volume with the
// final output (faster ffmpeg input, easier cleanup if interrupted).
const tmpDir = fs.mkdtempSync(path.join(rendersDir, ".vite-frames-"));

// --- frame loop -----------------------------------------------------------

const tlKey = probe.tlKey;
const captureStart = Date.now();
let progressLastLog = captureStart;

for (let i = 0; i < totalFrames; i++) {
  const t = i / fps;
  // Seek + pause the timeline, then sync `.clip` visibility to t.
  await page.evaluate(
    ({ key, time, applyVisFnSrc }) => {
      const tl = window.__timelines && window.__timelines[key];
      if (tl) {
        tl.pause();
        tl.time(time);
      }
      // Eval the visibility function in the page context.
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return ${applyVisFnSrc}`)();
      fn(time);
    },
    { key: tlKey, time: t, applyVisFnSrc: APPLY_CLIP_VIS_FN },
  );

  const framePath = path.join(tmpDir, `frame-${String(i).padStart(6, "0")}.png`);
  await page.screenshot({ path: framePath, type: "png", fullPage: false });

  const now = Date.now();
  if (now - progressLastLog > 1500 || i === totalFrames - 1) {
    const pct = (((i + 1) / totalFrames) * 100).toFixed(1);
    const elapsed = (now - captureStart) / 1000;
    const fpsActual = (i + 1) / elapsed;
    process.stdout.write(`  capture: ${i + 1}/${totalFrames} (${pct}%)  ${fpsActual.toFixed(1)} fps\r`);
    progressLastLog = now;
  }
}
process.stdout.write("\n");

const captureSecs = ((Date.now() - captureStart) / 1000).toFixed(1);
console.log(`✓ captured ${totalFrames} frames in ${captureSecs}s`);

await browser.close();

if (consoleErrors.length) {
  console.warn(`  ${consoleErrors.length} console/runtime error(s) during capture:`);
  for (const e of consoleErrors.slice(0, 5)) console.warn(`    - ${e.slice(0, 160)}`);
}

// --- encode ---------------------------------------------------------------

const ffmpegBin = await getFfmpegPath();
const encodeStart = Date.now();
console.log(`▶ encode: libx264 crf 18 preset slow → ${path.relative(projectRoot, outPath)}`);

const ffmpegArgs = [
  "-y",
  "-framerate", String(fps),
  "-i", path.join(tmpDir, "frame-%06d.png"),
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-crf", "18",
  "-preset", "slow",
  "-movflags", "+faststart",
  outPath,
];

try {
  await spawnAsync(ffmpegBin, ffmpegArgs);
} catch (err) {
  console.error(`✗ ffmpeg failed: ${err.message}`);
  // Leave temp frames in place for debugging on failure.
  console.error(`  temp frames preserved at: ${tmpDir}`);
  process.exit(1);
}

const encodeSecs = ((Date.now() - encodeStart) / 1000).toFixed(1);

// --- cleanup --------------------------------------------------------------

try {
  fs.rmSync(tmpDir, { recursive: true, force: true });
} catch (err) {
  console.warn(`  cleanup warning: ${err.message} (temp dir: ${tmpDir})`);
}

const outStat = fs.statSync(outPath);
const outMb = (outStat.size / (1024 * 1024)).toFixed(2);
const totalSecs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`✓ encoded in ${encodeSecs}s`);
console.log(`✓ ${path.relative(projectRoot, outPath)}  ${outMb} MiB  (total ${totalSecs}s)`);
