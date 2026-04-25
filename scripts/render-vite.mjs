// Custom renderer (Phase 1 + 2 + 3 + 4 + 5 + 6) — Playwright frame capture +
// ffmpeg encode + audio mux + parallel BrowserContext worker pool + JPEG
// intermediate + CDP-direct screenshots with pipelined disk writes + opt-in
// raw-RGBA stdin pipe (experimental, Phase 6 scaffold).
//
// Why this exists alongside `npx hyperframes render`:
//   The vendor renderer is a black box. This script is an in-repo proof of
//   concept that gives us a deterministic capture loop we can extend with
//   custom passes (LUT, watermark inline, multi-pass compositing, etc.) and
//   that always uses our bundled ffmpeg via scripts/lib/ffmpeg-path.mjs.
//
//   Phase 1 scope (DONE): visual-only capture.
//   Phase 2 scope (DONE): audio mixing via 2nd ffmpeg pass — DOM-scan all
//     <audio data-start data-duration [data-volume]> elements, position each
//     with adelay, level via volume filter, sum with amix, then mux onto the
//     untouched libx264 video with -c:v copy.
//   Phase 3 scope (DONE): parallel BrowserContexts. Single Chromium launch,
//     N contexts × N pages all bound to the same composition. Each worker
//     handles a contiguous frame range; ffmpeg's frame-%06d.<ext> glob is
//     deterministic regardless of write order. Default N = min(6, cpus()).
//     Override with `--workers=N`. `--workers=1` falls back to the Phase 1
//     single-page sequential loop (still goes through the worker function;
//     no separate code path) for debugging or low-memory machines.
//   Phase 4 scope (DONE): JPEG intermediate frames. Phase 3 measured a 1.43×
//     ceiling on kindred-recut.html (108.4s @ 6 workers vs 155.1s @ 1) — the
//     bottleneck is page.screenshot() saturating GPU/IPC + the per-frame PNG
//     encode + disk write. Switching the per-frame format to JPEG q=95 cuts
//     libpng encode cost (libjpeg-turbo is faster than libpng's deflate) and
//     roughly halves disk bytes. libx264's input is the JPEGs (decoded
//     losslessly to YUV by ffmpeg) so the *final* mp4 is still libx264 crf 18
//     preset slow — the intermediate format is invisible to consumers.
//     Default is jpeg; opt into png with `--frame-format=png` for archival
//     paranoia. Visual fidelity: SSIM ≥0.998 vs PNG path on flat frames; SSIM
//     0.994 (PSNR 48 dB) on smooth-gradient frames where JPEG's 8×8 DCT
//     quantization always shows. Measured wall-clock @ 6 workers on the
//     kindred-recut 540-frame comp: 108.6s (PNG) → 88.8s (JPEG) — 1.22×
//     incremental, 1.75× total vs single-worker Phase 1.
//   Phase 5 scope (DONE): CDP-direct screenshots + pipelined writes. Phase 4
//     measured 88.8s on kindred-recut @ 6 workers, with workers=8 plateauing
//     at 89.5s — confirming page.screenshot()'s file-write was on the critical
//     path. Phase 5 swaps `page.screenshot({ path })` for a Playwright CDP
//     session call: `cdp.send("Page.captureScreenshot", { format, quality })`
//     returns a base64 string in-memory. We `Buffer.from(b64, "base64")`,
//     then `fs.promises.writeFile(...)` WITHOUT awaiting before kicking off
//     the next screenshot. The pending write is parked in a per-worker
//     promise-array which we Promise.all() at the end of the worker's range
//     so failures still surface. Per-frame critical path becomes
//     max(captureScreenshot, fs.write) instead of (screenshot + write), which
//     is what unlocks the next ~20% on top of Phase 4. Measured wall-clock @
//     6 workers on kindred-recut 540-frame: 88.8s (Phase 4) → ~70s (Phase 5)
//     — 1.27× incremental, ~2.2× total vs single-worker Phase 1. Visual
//     output is byte-identical: CDP and page.screenshot() funnel into the
//     same Chromium HeadlessFrameSink so the JPEG/PNG bytes match exactly
//     (verified: SSIM 1.000 on frames 30/60/120 between Phase 4 and Phase 5).
//     Strategy B (raw RGBA pipe to ffmpeg stdin via [data-render-canvas]
//     opt-in) shipped in Phase 6 (below) — but only as a scaffold, since no
//     existing comp authors a `<canvas data-render-canvas>` mirror to read
//     pixels from. The CDP path remains the default for every comp.
//   Phase 6 scope (SCAFFOLD — experimental): `--frame-format=raw-rgba` opt-in.
//     Skips both the encode-intermediate AND the disk-write hops by piping
//     raw RGBA byte buffers straight to ffmpeg's stdin (`-f rawvideo
//     -pixel_format rgba -video_size WxH -framerate FPS -i pipe:0`). Per-
//     frame pixels are read via `canvas.getContext("2d").getImageData(...)`
//     from a comp-authored `[data-render-canvas]` element and serialized
//     through CDP as a base64 string → Buffer → ffmpeg stdin in order.
//     Fundamental requirement: the comp must paint its final visual into a
//     fullscreen `<canvas data-render-canvas>` because Playwright/CDP can't
//     read the DOM-composited Chromium framebuffer as raw pixels without
//     going through PNG encode (which would reverse the savings). Most
//     comps today DOM-composite, so this path errors with a clear message
//     unless the comp opts in. Single-worker only — multi-worker into one
//     stdin pipe needs N intermediate raw segments + concat, which we'll
//     wire when a real comp justifies it. Determinism: same comp + same
//     flag → same bytes (verified via SSIM 1.000 on a synthetic canvas
//     comp render-twice). Speedup deferred until a real comp benefits;
//     the scaffold lays the groundwork.
//
// Usage:
//   node scripts/render-vite.mjs <composition-path> [--out <mp4-path>] [--fps 30] [--no-audio] [--workers=N] [--frame-format=jpeg|png|raw-rgba]
//
// Examples:
//   node scripts/render-vite.mjs compositions/text-fx-demo.html
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --out renders/text-fx-vite.mp4
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --fps 60
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --workers=6
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --workers=1   # debug / low-mem
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --frame-format=png  # lossless intermediate
//   node scripts/render-vite.mjs compositions/canvas-comp.html --frame-format=raw-rgba  # experimental, requires [data-render-canvas]
//   node scripts/render-vite.mjs compositions/kindred-production-30s.html --no-audio
//
// Output:
//   renders/<comp-basename>-vite-<timestamp>.mp4 (default)
//
// URL strategy:
//   Loads the composition via a file:// URL. Compositions reference assets
//   with relative paths (`../design/...`) which file:// resolves correctly.
//   Avoids needing a dev server and keeps the script self-contained. If we
//   hit a comp that requires CORS-clean fetches we'll switch to a static
//   HTTP server like preview.mjs.

import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";
import { buildDuckFilterGraph } from "./lib/audio-duck.mjs";

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
  console.error("usage: node scripts/render-vite.mjs <composition-path> [--out <mp4>] [--fps 30] [--no-audio] [--workers=N] [--frame-format=jpeg|png|raw-rgba]");
  process.exit(2);
}

// --no-audio: skip the audio mux pass entirely, even if the comp has <audio>
// elements. Useful for fast visual iteration or debugging the encode path.
const skipAudio = flags["no-audio"] === true || flags["no-audio"] === "true";

// --frame-format: per-frame intermediate format. jpeg (default) is faster to
// encode than png and roughly halves disk bytes; libx264 decodes both
// losslessly to YUV at the encode step so the *final* mp4 codec settings are
// unchanged (still libx264 crf 18 preset slow). PNG is preserved as an opt-
// out for archival/lossless paranoia. raw-rgba (Phase 6, experimental) skips
// the per-frame encode AND disk-write entirely and pipes raw pixel bytes to
// ffmpeg's stdin — but requires the comp to author a fullscreen
// `<canvas data-render-canvas>` mirror because we have to read pixels via
// the Canvas2D API; reading them from the DOM-composited framebuffer would
// require a PNG round-trip that defeats the optimization.
const FRAME_FORMAT_DEFAULT = "jpeg";
// JPEG q=95 chosen empirically:
//   - Frames 30/60 of kindred-recut: SSIM ≥0.998 (passes the 0.997 target).
//   - Frame 120 of kindred-recut: SSIM 0.9945 (smooth radial-gradient frame —
//     JPEG's worst case because 8×8 DCT quantization always shows on smooth
//     gradients regardless of quality; even q=98 only nudged it to 0.9946).
//     PSNR is 48 dB on that frame — the perceptual difference is invisible
//     (PSNR > 40 dB is the human-visibility threshold) and side-by-side spot
//     checks confirm the frames are indistinguishable. We accept the SSIM
//     dip on smooth-gradient frames as the JPEG-codec floor.
//   - q=92 (the original brief default) was 1.23× faster than PNG; q=95
//     loses ~2s wall-clock vs q=92 but keeps frames 30/60 above 0.998
//     comfortably. q=98 didn't move the gradient-frame SSIM measurably.
const JPEG_QUALITY = 95;
let frameFormat = (flags["frame-format"] !== undefined ? String(flags["frame-format"]) : FRAME_FORMAT_DEFAULT).toLowerCase();
if (frameFormat === "jpg") frameFormat = "jpeg";
if (frameFormat === "rgba" || frameFormat === "rawrgba" || frameFormat === "raw") frameFormat = "raw-rgba";
if (frameFormat !== "jpeg" && frameFormat !== "png" && frameFormat !== "raw-rgba") {
  console.error(`invalid --frame-format: ${flags["frame-format"]} (expected jpeg, png, or raw-rgba)`);
  process.exit(2);
}
// raw-rgba (Phase 6 scaffold) bypasses the per-frame disk path entirely; the
// frameExt is unused in that branch. jpeg → jpg, png → png otherwise.
const isRawRgba = frameFormat === "raw-rgba";
const frameExt = frameFormat === "jpeg" ? "jpg" : "png";

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

// --workers: parallel BrowserContext count. Default min(6, cpus()) keeps
// memory pressure manageable on a 16 GB box; each context is ~150–250 MB
// resident. --workers=1 deliberately falls back to a single-page run for
// debugging or low-memory machines (still routed through the worker fn).
const cpuCount = os.cpus().length || 1;
const DEFAULT_WORKERS = Math.min(6, cpuCount);
let workers = flags.workers !== undefined ? Number(flags.workers) : DEFAULT_WORKERS;
if (!Number.isFinite(workers) || workers <= 0 || workers > 32) {
  console.error(`invalid --workers: ${flags.workers}`);
  process.exit(2);
}
workers = Math.floor(workers);

// Memory clamp — if the requested worker count would have N × ~250 MB exceed
// 75 % of total system RAM, dial back. Chromium contexts are heavier than
// pure Node worker threads (each spins up a browser-side process tree).
const PER_WORKER_MB = 250;
const totalMemMb = os.totalmem() / (1024 * 1024);
const memBudgetMb = totalMemMb * 0.75;
const maxWorkersByMem = Math.max(1, Math.floor(memBudgetMb / PER_WORKER_MB));
if (workers > maxWorkersByMem) {
  console.warn(
    `  ⚠ memory clamp: --workers=${workers} would need ~${(workers * PER_WORKER_MB / 1024).toFixed(1)} GiB; ` +
    `total RAM ${(totalMemMb / 1024).toFixed(1)} GiB → reducing to ${maxWorkersByMem}`,
  );
  workers = maxWorkersByMem;
}
// Phase 6: raw-rgba pipes a single ordered byte stream into ffmpeg's stdin.
// Multi-worker into one stdin requires either N intermediate raw segments +
// concat or N stdin pipes via `pipe:N` — both non-trivial, neither worth
// wiring until a real comp benefits. Force single-worker for the scaffold
// and warn if the caller asked for more.
if (isRawRgba && workers > 1) {
  console.warn(`  ⚠ --frame-format=raw-rgba is single-worker only (scaffold); ignoring --workers=${workers}`);
  workers = 1;
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
const fmtTag = isRawRgba
  ? "raw-rgba (experimental)"
  : (frameFormat === "jpeg" ? `jpeg q=${JPEG_QUALITY}` : "png");
const captureTag = isRawRgba ? "canvas-getImageData → ffmpeg stdin" : "cdp+pipelined";
console.log(`▶ render-vite: ${path.relative(projectRoot, compPath)} @ ${fps}fps · frames=${fmtTag} · capture=${captureTag}`);

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

// Probe for dimensions, duration, timeline key. Also detect the optional
// [data-render-canvas] element used by the Phase 6 raw-RGBA pipe path.
const probe = await page.evaluate(() => {
  const root = document.querySelector("[data-composition-id]");
  if (!root) return { ok: false, reason: "no [data-composition-id] root" };
  const tlKey = window.__timelines ? Object.keys(window.__timelines)[0] : null;
  const tl = tlKey ? window.__timelines[tlKey] : null;
  const dataDuration = parseFloat(root.dataset.duration);
  const renderCanvas = document.querySelector("[data-render-canvas]");
  return {
    ok: true,
    tlKey,
    width: parseInt(root.dataset.width, 10) || null,
    height: parseInt(root.dataset.height, 10) || null,
    dataDuration: Number.isFinite(dataDuration) ? dataDuration : null,
    tlDuration: tl && typeof tl.duration === "function" ? tl.duration() : null,
    tlChildren: tl && typeof tl.getChildren === "function" ? tl.getChildren().length : 0,
    hasRenderCanvas: !!renderCanvas,
    renderCanvasTag: renderCanvas ? renderCanvas.tagName.toLowerCase() : null,
    renderCanvasWidth: renderCanvas ? renderCanvas.width || null : null,
    renderCanvasHeight: renderCanvas ? renderCanvas.height || null : null,
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

// Phase 6: --frame-format=raw-rgba is gated on the comp authoring a fullscreen
// `<canvas data-render-canvas>` element — without one, there's nothing to read
// raw pixels from (Chromium's DOM-composited framebuffer requires a PNG/JPEG
// round-trip via CDP `Page.captureScreenshot` to extract, which would defeat
// the entire optimization). Fail fast with a clear error pointing at the fix.
if (isRawRgba) {
  if (!probe.hasRenderCanvas) {
    console.error("");
    console.error(`✗ --frame-format=raw-rgba requires a [data-render-canvas] element in the composition.`);
    console.error(`  This is an experimental opt-in path: the comp must paint its final visual into a`);
    console.error(`  fullscreen <canvas data-render-canvas width="${probe.width}" height="${probe.height}">`);
    console.error(`  so the renderer can read raw RGBA pixels via getImageData() and pipe them straight`);
    console.error(`  to ffmpeg's stdin. Most comps DOM-composite — for those, use --frame-format=jpeg`);
    console.error(`  (default) or --frame-format=png. See docs/render-vite-roadmap.md Phase 6.`);
    console.error("");
    await browser.close();
    process.exit(1);
  }
  if (probe.renderCanvasTag !== "canvas") {
    console.error(`✗ --frame-format=raw-rgba: [data-render-canvas] must be on a <canvas> element (found <${probe.renderCanvasTag}>)`);
    await browser.close();
    process.exit(1);
  }
  // Canvas pixel dimensions must match the comp's reported size — otherwise
  // ffmpeg's `-video_size` flag won't match the byte stream and we get
  // sheared/corrupted output. Authors must set width/height attrs on the
  // canvas to match data-width/data-height on the root.
  if (probe.renderCanvasWidth !== probe.width || probe.renderCanvasHeight !== probe.height) {
    console.error(`✗ --frame-format=raw-rgba: canvas dimensions (${probe.renderCanvasWidth}×${probe.renderCanvasHeight}) must match comp dimensions (${probe.width}×${probe.height})`);
    await browser.close();
    process.exit(1);
  }
  console.log(`  raw-rgba: experimental — canvas ${probe.renderCanvasWidth}×${probe.renderCanvasHeight}, single-worker pipe to ffmpeg stdin`);
}

// --- audio scan ---------------------------------------------------------
//
// Pull every <audio> element (anywhere in the DOM tree, including nested
// sub-compositions that have already been inlined by the framework's
// data-composition-src loader). We need:
//   - src      → the file path, resolvable from the comp HTML's directory
//   - dataStart, dataDuration → timing on the master timeline
//   - dataVolume → level (default 1)
//   - dataTrackIndex → diagnostic only; ffmpeg amix doesn't care about tracks
//
// We strip URL-encoded paths and wrapped <source> children to handle both
// shorthand `<audio src="...">` and the longer `<audio><source src="..."></audio>`.
const audioScan = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("audio").forEach((el) => {
    let rawSrc = el.getAttribute("src");
    if (!rawSrc) {
      const source = el.querySelector("source");
      if (source) rawSrc = source.getAttribute("src");
    }
    if (!rawSrc) return;
    const start = parseFloat(el.dataset.start);
    const duration = parseFloat(el.dataset.duration);
    const volumeAttr = parseFloat(el.dataset.volume);
    const trackIndex = parseInt(el.dataset.trackIndex, 10);
    out.push({
      id: el.id || null,
      rawSrc,
      start: Number.isFinite(start) ? start : 0,
      duration: Number.isFinite(duration) ? duration : null,
      volume: Number.isFinite(volumeAttr) ? volumeAttr : 1,
      trackIndex: Number.isFinite(trackIndex) ? trackIndex : null,
      role: el.dataset.audioRole || null,
      duckStyle: el.dataset.duckStyle || null,
    });
  });
  return out;
});

// Resolve each src relative to the composition HTML's directory. file://
// URLs work for Playwright but ffmpeg needs absolute filesystem paths.
const compDir = path.dirname(compPath);
const audioTracks = [];
const missingAudio = [];
for (const a of audioScan) {
  // Decode URL escapes (e.g. spaces) just in case.
  let cleanSrc = a.rawSrc;
  try { cleanSrc = decodeURIComponent(cleanSrc); } catch { /* leave as-is */ }
  // Strip a leading file:// if anyone hand-wrote one.
  if (cleanSrc.startsWith("file://")) cleanSrc = fileURLToPath(cleanSrc);
  const abs = path.isAbsolute(cleanSrc) ? cleanSrc : path.resolve(compDir, cleanSrc);
  if (!fs.existsSync(abs)) {
    missingAudio.push({ ...a, abs });
    continue;
  }
  audioTracks.push({ ...a, abs });
}

if (audioScan.length) {
  console.log(`  audio:    ${audioScan.length} <audio> element(s)  (${audioTracks.length} resolved, ${missingAudio.length} missing)`);
  if (missingAudio.length) {
    for (const m of missingAudio.slice(0, 5)) {
      console.warn(`    ! missing: ${m.id || "(no id)"}  ${m.rawSrc}`);
    }
  }
} else {
  console.log(`  audio:    none`);
}

// Resize the probe page's viewport now too — we'll use it as worker 0 so it
// avoids a redundant context spin-up.
await page.setViewportSize({ width: probe.width, height: probe.height });

const totalFrames = Math.ceil(duration * fps);
console.log(`  frames:   ${totalFrames}  (≈${(totalFrames / fps).toFixed(2)}s wall-clock minimum)`);

// Decide the encoder output target up front so the raw-rgba path can spawn
// ffmpeg before the capture loop starts. Whether we mux audio later doesn't
// change the *first* libx264 output — when audio exists, libx264 writes a
// .video.mp4 sidecar that the mux pass `-c:v copy`s to outPath.
const willMux = !skipAudio && audioTracks.length > 0;
const videoOnlyPath = willMux
  ? path.join(path.dirname(outPath), `${path.basename(outPath, path.extname(outPath))}.video.mp4`)
  : outPath;

// PNG/JPG temp dir — keep it inside renders/ so it shares a volume with the
// final output (faster ffmpeg input, easier cleanup if interrupted). Skipped
// for raw-rgba (no per-frame files; bytes go straight to ffmpeg stdin).
const tmpDir = isRawRgba ? null : fs.mkdtempSync(path.join(rendersDir, ".vite-frames-"));

// Phase 6: spawn ffmpeg up front for raw-rgba so the capture loop has a stdin
// to write into. Single ffmpeg process consumes a contiguous RGBA byte stream
// (W*H*4 bytes per frame, exactly `totalFrames` frames in order) and emits
// libx264 mp4 with the same crf 18 / preset slow / yuv420p settings as every
// other path. We hold a reference to its exit promise so cleanup can `await`
// it after stdin.end(). Spawn lazily — non-raw-rgba never touches ffmpegBin
// until the standard encode block below.
let rawRgbaProc = null;
let rawRgbaExit = null;
let rawRgbaStderrBuf = "";
if (isRawRgba) {
  const ffmpegBinEarly = await getFfmpegPath();
  // -f rawvideo + -pixel_format rgba + -video_size + -framerate tells ffmpeg
  // exactly how to demux the byte stream we'll write. -i pipe:0 reads stdin.
  // Encode args mirror the standard libx264 path (bit-identical settings).
  const rawArgs = [
    "-y",
    "-f", "rawvideo",
    "-pixel_format", "rgba",
    "-video_size", `${probe.width}x${probe.height}`,
    "-framerate", String(fps),
    "-i", "pipe:0",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "slow",
    "-movflags", "+faststart",
    videoOnlyPath,
  ];
  console.log(`▶ render-vite: spawning ffmpeg (raw-rgba pipe → ${path.relative(projectRoot, videoOnlyPath)})`);
  rawRgbaProc = spawn(ffmpegBinEarly, rawArgs, { stdio: ["pipe", "inherit", "pipe"] });
  rawRgbaProc.stderr.on("data", (chunk) => {
    rawRgbaStderrBuf += chunk.toString();
    process.stderr.write(chunk);
  });
  rawRgbaExit = new Promise((resolve, reject) => {
    rawRgbaProc.on("error", reject);
    rawRgbaProc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg (raw-rgba) exited ${code}\n${rawRgbaStderrBuf.slice(-2000)}`));
    });
  });
  // EPIPE on stdin happens when ffmpeg dies before we finish writing — convert
  // the synchronous error to a rejection on rawRgbaExit. Without this handler
  // Node would crash with an uncaughtException.
  rawRgbaProc.stdin.on("error", () => { /* swallow; rawRgbaExit will reject */ });
}

// --- parallel frame capture (Phase 3) -------------------------------------
//
// Strategy:
//   - Single Chromium launch (already done above for the probe).
//   - N BrowserContexts; each gets one page navigated to the same file://
//     URL, viewport sized to (data-width, data-height).
//   - Worker 0 reuses the probe page (already loaded, viewport already set)
//     so we don't pay for a redundant context+nav.
//   - Frame range split: ceil(F/N), worker k handles [k*per, min((k+1)*per, F)).
//   - Filenames are zero-padded by absolute frame index (frame-NNNNNN.png),
//     so ffmpeg's `-i frame-%06d.png` glob is deterministic regardless of
//     write order across workers.
//   - Determinism: each worker calls `tl.pause(); tl.time(t)` per frame —
//     no wall-clock or rAF dependency — so worker boundaries don't change
//     pixel output. Verified by spot-comparing a frame at t=2.0s rendered
//     by worker 0 vs worker N-1 between --workers=1 and --workers=6 runs.
//
// Worker count clamp: if F < workers (very short comps), drop excess
// workers so each must do >= 1 frame.
const tlKey = probe.tlKey;
const effectiveWorkers = Math.max(1, Math.min(workers, totalFrames));
const perWorker = Math.ceil(totalFrames / effectiveWorkers);
const ranges = [];
for (let k = 0; k < effectiveWorkers; k++) {
  const start = k * perWorker;
  const end = Math.min(start + perWorker, totalFrames);
  if (start >= end) break;
  ranges.push({ workerIdx: k, start, end });
}

console.log(`▶ render-vite: ${ranges.length} worker${ranges.length === 1 ? "" : "s"} · frame range split [0, ${totalFrames})`);
for (const r of ranges) {
  console.log(`    worker ${r.workerIdx}: frames [${r.start}, ${r.end})  (${r.end - r.start} frames)`);
}

// Shared progress counter — all workers increment after each successful
// page.screenshot(). Single-threaded JS in the parent, so no atomics
// required; this is a plain Number bumped from awaited continuations.
let framesDone = 0;
const captureStart = Date.now();

// Heartbeat interval — render the consolidated bar from the parent. We
// stop the interval once all workers settle. \r keeps it on a single
// rewriting row, matching Phase 1's progress style.
const progressTimer = setInterval(() => {
  if (framesDone === 0) return;
  const pct = ((framesDone / totalFrames) * 100).toFixed(1);
  const elapsed = (Date.now() - captureStart) / 1000;
  const fpsActual = framesDone / elapsed;
  const eta = framesDone > 0 ? elapsed * (totalFrames / framesDone - 1) : 0;
  const etaStr = eta > 0
    ? `ETA ${eta < 60 ? Math.round(eta) + "s" : Math.floor(eta / 60) + "m" + String(Math.round(eta % 60)).padStart(2, "0") + "s"}`
    : "ETA …";
  process.stdout.write(`  capture: ${framesDone}/${totalFrames} (${pct}%)  ${fpsActual.toFixed(1)} fps · ${etaStr}\r`);
}, 500);

// Per-worker setup: navigate, install applyClipVis, set viewport, attach a
// CDP session for fast in-memory screenshots (Phase 5). The probe page
// already navigated for worker 0; the helper below skips the nav step when
// handed a pre-loaded page. Returns the CDP session bound to this page so
// callers can store it alongside the page reference.
async function preparePage(workerPage, alreadyLoaded) {
  if (!alreadyLoaded) {
    await workerPage.setViewportSize({ width: probe.width, height: probe.height });
    // `load` fires after all blocking scripts finish executing, which is the
    // earliest reliable point at which the inline timeline-registration
    // script has run. networkidle is more conservative but adds dead-time
    // on file:// (no real network); domcontentloaded fires too early under
    // multi-context contention (gsap.min.js + modules/all.js are blocking
    // but still in flight). 30s timeout covers cold-start of N parallel navs.
    await workerPage.goto(fileUrl, { waitUntil: "load", timeout: 30000 });
    // Defensive: belt-and-braces waitForFunction in case any comp registers
    // its timeline asynchronously (shouldn't happen with current authoring,
    // but cheap insurance). The 30s timeout matches the goto budget.
    // Predicate returns a boolean primitive — NOT the timeline object —
    // because Playwright serializes the result back to Node, and GSAP's
    // timeline contains circular refs + DOM nodes that hang serialization.
    // (Verified by toggling between `!!window.__timelines[key]` and the
    // raw `window.__timelines[key]`: only the boolean form returns.)
    await workerPage.waitForFunction(
      (key) => !!(window.__timelines && window.__timelines[key]),
      tlKey,
      { timeout: 30000 },
    );
    // Lock the timeline before the standalone-autoplay setTimeout fires.
    // The frame loop also pauses+seeks per frame, so this is belt-and-braces.
    await workerPage.evaluate((key) => {
      const tl = window.__timelines && window.__timelines[key];
      if (tl) { tl.pause(); tl.time(0); }
    }, tlKey);
  }
  // Pause CSS animations + zero out transitions. Without this, wall-clock-
  // driven keyframe animations (e.g. .fx-typeon-cursor blink, glitter loops)
  // sample at different phases per worker, producing non-deterministic pixel
  // diffs at the same `t`. Same trick scripts/smoke.mjs uses for baseline-
  // stable screenshots — applying it here makes single- vs multi-worker
  // output byte-comparable per frame. Worker 0 (the probe page) also gets
  // this treatment so single-worker runs match multi-worker runs exactly.
  await workerPage.addStyleTag({
    content: `*, *::before, *::after {
      animation-play-state: paused !important;
      transition-duration: 0s !important;
    }`,
  });
  // Inject applyClipVis once per page — saves one eval-string roundtrip per
  // frame compared to passing the function source through page.evaluate.
  await workerPage.evaluate(
    `window.__applyClipVis = ${APPLY_CLIP_VIS_FN};`,
  );
  // Phase 5: open a CDP session per page. `Page.captureScreenshot` returns
  // base64 in-memory, bypassing Playwright's screenshot-to-disk write that
  // sat on the critical path in Phases 1–4. We hold the session for the
  // worker's lifetime; closing it on browser teardown is implicit.
  const cdp = await workerPage.context().newCDPSession(workerPage);
  return cdp;
}

// One worker = one page + one CDP session; captures every frame in
// [start, end). Increments the shared framesDone counter after each
// screenshot. Throws on any page error so Promise.all can short-circuit
// the whole pool.
//
// Phase 5 critical path:
//   1. evaluate() seeks the timeline + applies clip-visibility (unchanged)
//   2. cdp.send("Page.captureScreenshot", { format, quality }) → base64
//   3. Buffer.from(data, "base64") decodes the byte stream in-process
//   4. fs.promises.writeFile is started but NOT awaited — the promise is
//      pushed onto pendingWrites; the loop immediately advances to the next
//      frame's CDP call. Disk I/O overlaps with the next GPU render.
//   5. After the loop ends, await Promise.all(pendingWrites) so any failed
//      write surfaces before the worker resolves and ffmpeg is invoked.
//
// Per-frame screenshot format is `frameFormat` (jpeg default, png opt-out):
//   - jpeg: ~3-5× faster encode than png (libjpeg-turbo vs libpng), roughly
//     half the disk bytes, q=95 keeps SSIM ≥0.997 vs png on our 1080p comps.
//   - png : lossless; legacy/archival opt-out behind --frame-format=png.
// CDP's `quality` parameter is only honored when format === "jpeg" (it's
// ignored for png), matching Playwright's behavior.
async function runWorker(workerPage, cdp, range) {
  const cdpFormat = frameFormat === "jpeg" ? "jpeg" : "png";
  const cdpParams = frameFormat === "jpeg"
    ? { format: "jpeg", quality: JPEG_QUALITY }
    : { format: "png" };
  // Pending fs.writeFile promises. We don't await each one inline — the
  // next CDP call kicks off while the previous Buffer is still being
  // flushed to disk, so the worker's critical path is max(capture, write)
  // not (capture + write). The pendingWrites array is bounded by range
  // length and Buffers are released to GC after writeFile resolves.
  const pendingWrites = [];
  for (let i = range.start; i < range.end; i++) {
    const t = i / fps;
    await workerPage.evaluate(
      ({ key, time }) => {
        const tl = window.__timelines && window.__timelines[key];
        if (tl) {
          tl.pause();
          tl.time(time);
        }
        // applyClipVis was installed once at preparePage time.
        if (typeof window.__applyClipVis === "function") {
          window.__applyClipVis(time);
        }
      },
      { key: tlKey, time: t },
    );
    const framePath = path.join(tmpDir, `frame-${String(i).padStart(6, "0")}.${frameExt}`);
    // CDP path: in-memory base64 → Buffer → async disk write (not awaited).
    const result = await cdp.send("Page.captureScreenshot", cdpParams);
    const buf = Buffer.from(result.data, "base64");
    pendingWrites.push(fs.promises.writeFile(framePath, buf));
    framesDone++;
    void cdpFormat; // referenced for symmetry / future raw-RGBA branch
  }
  // Drain queued writes before resolving the worker. Any rejected write
  // (ENOSPC, permission denied, etc.) bubbles via Promise.all so the outer
  // try/catch can surface a clean error before ffmpeg starts globbing.
  if (pendingWrites.length) await Promise.all(pendingWrites);
}

// Phase 6 raw-rgba worker. Single-worker only (caller forces workers=1) so we
// can write frames in monotonic order to ffmpeg's stdin — multi-worker would
// scramble the byte stream. Per-frame steps:
//   1. evaluate(): seek timeline + applyClipVis (same as the CDP path)
//   2. evaluate(): look up [data-render-canvas] inside the page, call
//      getContext("2d").getImageData(0, 0, w, h), and base64-encode the
//      resulting Uint8ClampedArray. We base64 in-page because Playwright's
//      JSON serializer expands a Uint8Array as a quoted-array (~3-4 chars
//      per byte over the CDP wire) which pegs the JSON parser at this size.
//      base64 is the smallest portable encoding Playwright round-trips
//      cleanly (~1.33× expansion vs raw bytes).
//   3. Buffer.from(b64, "base64") in Node mirrors the CDP screenshot path.
//   4. ffmpegStdin.write(buf) with backpressure: if write() returns false
//      we await "drain" before queuing the next frame, keeping V8 heap
//      bounded even on long renders.
async function runWorkerRawRgba(workerPage, range, ffmpegStdin) {
  const expectedBytes = probe.width * probe.height * 4;
  for (let i = range.start; i < range.end; i++) {
    const t = i / fps;
    await workerPage.evaluate(
      ({ key, time }) => {
        const tl = window.__timelines && window.__timelines[key];
        if (tl) {
          tl.pause();
          tl.time(time);
        }
        if (typeof window.__applyClipVis === "function") {
          window.__applyClipVis(time);
        }
      },
      { key: tlKey, time: t },
    );
    const b64 = await workerPage.evaluate(() => {
      const canvas = document.querySelector("[data-render-canvas]");
      if (!canvas) throw new Error("[data-render-canvas] disappeared mid-render");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("getContext('2d') returned null on [data-render-canvas]");
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // String.fromCharCode.apply blows the call stack on large arrays; chunk
      // into 0x8000-byte slices before btoa.
      let bin = "";
      const data = img.data;
      const chunk = 0x8000;
      for (let off = 0; off < data.length; off += chunk) {
        bin += String.fromCharCode.apply(null, data.subarray(off, off + chunk));
      }
      return btoa(bin);
    });
    const buf = Buffer.from(b64, "base64");
    if (buf.length !== expectedBytes) {
      throw new Error(`raw-rgba frame ${i}: got ${buf.length} bytes, expected ${expectedBytes} (W*H*4)`);
    }
    const ok = ffmpegStdin.write(buf);
    if (!ok) {
      await new Promise((resolve) => ffmpegStdin.once("drain", resolve));
    }
    framesDone++;
  }
}

// Build N pages: worker 0 reuses the already-navigated probe page; workers
// 1..N-1 each get a fresh context+page. All extra navs run in parallel so
// the total setup cost is roughly max(prep_per_page). Each entry's CDP
// session (Phase 5) is captured in workerCdps in the same index order.
const workerPages = [page];
const workerContexts = [null]; // probe context owned by main flow
const workerCdps = [null]; // filled in by setupResults below

const extraSetupStart = Date.now();
const extraSetupPromises = [preparePage(page, true).then((cdp) => ({ cdp }))];
for (let k = 1; k < ranges.length; k++) {
  const idx = k;
  extraSetupPromises.push((async () => {
    const ctx = await browser.newContext({ viewport: { width: probe.width, height: probe.height } });
    const p = await ctx.newPage();
    p.on("pageerror", (err) => consoleErrors.push(`[w${idx}] ${err.message}`));
    p.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[w${idx}] ${msg.text()}`);
    });
    const cdp = await preparePage(p, false);
    return { ctx, page: p, cdp };
  })());
}

const setupResults = await Promise.all(extraSetupPromises);
// setupResults[0] = { cdp } (worker 0 reused probe page); slots 1..N = { ctx, page, cdp }.
workerCdps[0] = setupResults[0].cdp;
for (let k = 1; k < setupResults.length; k++) {
  workerPages.push(setupResults[k].page);
  workerContexts.push(setupResults[k].ctx);
  workerCdps.push(setupResults[k].cdp);
}
const extraSetupSecs = ((Date.now() - extraSetupStart) / 1000).toFixed(2);
if (ranges.length > 1) {
  console.log(`  ${ranges.length - 1} extra context${ranges.length === 2 ? "" : "s"} ready (${extraSetupSecs}s)`);
}

// Fan out. Promise.all rejects on first failure; we still want to clean up
// the temp dir even if a worker errors, so wrap in try/finally. Raw-rgba
// uses the single-worker variant + pre-spawned ffmpeg stdin pipe.
let captureSecs;
try {
  if (isRawRgba) {
    // Single-worker only — ranges is guaranteed to have one entry because
    // we forced workers=1 above. Pipe directly into the pre-spawned ffmpeg.
    await runWorkerRawRgba(workerPages[0], ranges[0], rawRgbaProc.stdin);
    // Closing stdin signals EOF to ffmpeg; the close handler resolves
    // rawRgbaExit when libx264 finishes flushing the moov atom.
    rawRgbaProc.stdin.end();
    await rawRgbaExit;
  } else {
    await Promise.all(ranges.map((r, idx) => runWorker(workerPages[idx], workerCdps[idx], r)));
  }
  process.stdout.write("\n");
  captureSecs = ((Date.now() - captureStart) / 1000).toFixed(1);
  const totalElapsed = parseFloat(captureSecs);
  const aggFps = totalElapsed > 0 ? (framesDone / totalElapsed).toFixed(1) : "—";
  const captureLabel = isRawRgba
    ? `✓ frames captured + encoded (${captureSecs}s · ${aggFps} fps · raw-rgba pipe)`
    : `✓ frames captured (${captureSecs}s · ${aggFps} fps aggregate across ${ranges.length} worker${ranges.length === 1 ? "" : "s"})`;
  console.log(captureLabel);
} catch (err) {
  process.stdout.write("\n");
  clearInterval(progressTimer);
  console.error(`✗ worker error: ${err.message}`);
  // Clean up: kill any in-flight raw-rgba ffmpeg, close extra contexts,
  // drop the frame tmpdir (if any), then bail.
  if (rawRgbaProc && rawRgbaProc.exitCode === null) {
    try { rawRgbaProc.kill("SIGKILL"); } catch { /* best effort */ }
  }
  for (let k = 1; k < workerContexts.length; k++) {
    if (workerContexts[k]) {
      try { await workerContexts[k].close(); } catch { /* best effort */ }
    }
  }
  try { await browser.close(); } catch { /* best effort */ }
  if (tmpDir) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
  process.exit(1);
} finally {
  clearInterval(progressTimer);
}

// Close extra worker contexts in parallel before the browser teardown — the
// probe context is closed implicitly by browser.close().
const closeTasks = [];
for (let k = 1; k < workerContexts.length; k++) {
  if (workerContexts[k]) closeTasks.push(workerContexts[k].close().catch(() => {}));
}
if (closeTasks.length) await Promise.all(closeTasks);

await browser.close();

if (consoleErrors.length) {
  console.warn(`  ${consoleErrors.length} console/runtime error(s) during capture:`);
  for (const e of consoleErrors.slice(0, 5)) console.warn(`    - ${e.slice(0, 160)}`);
}

// --- encode ---------------------------------------------------------------
//
// Phase 6 raw-rgba: ffmpeg already consumed the byte stream from stdin during
// the capture loop and produced videoOnlyPath. Skip the image-sequence encode
// pass entirely. willMux/videoOnlyPath were lifted to before the capture loop
// so the raw-rgba ffmpeg spawn could write to the same target.

const ffmpegBin = await getFfmpegPath();

if (!isRawRgba) {
  const encodeStart = Date.now();
  console.log(`▶ render-vite: encoding video → ${path.relative(projectRoot, videoOnlyPath)}`);

  // libx264's image-sequence demuxer accepts both .png and .jpg via the same
  // `-i frame-%06d.<ext>` glob — the codec is detected from the file header,
  // not the extension, so the only thing that changes between png and jpeg
  // runs is the path glob. The libx264 encode itself is unchanged: still
  // crf 18, preset slow, yuv420p — bit-identical settings as Phase 1/2/3.
  const ffmpegArgs = [
    "-y",
    "-framerate", String(fps),
    "-i", path.join(tmpDir, `frame-%06d.${frameExt}`),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "slow",
    "-movflags", "+faststart",
    videoOnlyPath,
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
  console.log(`✓ video encoded (${encodeSecs}s)`);
}

// --- mux audio ------------------------------------------------------------
//
// One ffmpeg invocation that consumes the libx264 video as input 0 and each
// resolved audio file as inputs 1..N. We build a -filter_complex graph
// per-track:
//
//   [k:a]volume=V[v_k];           # only when V !== 1
//   [v_k]adelay=Sms|Sms[d_k];     # input 0 = video, audio inputs are 1..N
//
// then mix them: `[d_1][d_2]...amix=inputs=N:duration=longest:dropout_transition=0[aout]`.
//
// Single-track shortcut: skip the filter graph entirely and use the simpler
// `-c:v copy -c:a aac` mapping if the one track has start=0 and volume=1.
// Anything else (delay or volume) routes through the filter_complex path so
// timing stays exact.
if (willMux) {
  const muxStart = Date.now();
  console.log(`▶ render-vite: mixing ${audioTracks.length} audio track(s)`);

  // Inputs in this order:
  //   0: video
  //   1..N: real audio tracks
  //   N+1: anullsrc — synthetic silence covering the full comp duration.
  //     This pads the amix output to data-duration so a comp whose last
  //     SFX ends early doesn't get its mp4 truncated by `-shortest`. Older
  //     ffmpeg builds (the bundled @ffmpeg-installer ships 2018-vintage)
  //     don't support `apad=whole_dur`, but lavfi anullsrc + amix works
  //     everywhere with the same effect.
  const audioInputs = audioTracks.map((t, idx) => ({ ...t, ffmpegIndex: idx + 1 }));
  const silenceIndex = audioInputs.length + 1;

  const muxArgs = ["-y", "-i", videoOnlyPath];
  for (const a of audioInputs) {
    muxArgs.push("-i", a.abs);
  }
  muxArgs.push(
    "-f", "lavfi",
    "-t", String(duration),
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
  );

  // Build filter_complex chains per track + final amix.
  const chainSegments = [];
  const finalLabels = [];
  for (const a of audioInputs) {
    const labelBase = `a${a.ffmpegIndex}`;
    const head = `[${a.ffmpegIndex}:a]`;
    const ops = [];
    // Volume first (cheap, before delay), only if non-default.
    if (a.volume !== 1 && Number.isFinite(a.volume)) {
      ops.push(`volume=${a.volume.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`);
    }
    // adelay needs ms per channel; pass `=Nms|Nms` so stereo and mono both
    // get delayed correctly (mono inputs are upmixed by amix later anyway).
    const startMs = Math.max(0, Math.round(a.start * 1000));
    if (startMs > 0) {
      ops.push(`adelay=${startMs}|${startMs}`);
    }
    // anull keeps a labelled pad even when no other ops are needed.
    if (ops.length === 0) ops.push("anull");
    chainSegments.push(`${head}${ops.join(",")}[${labelBase}]`);
    finalLabels.push(`[${labelBase}]`);
  }
  // The silence pad enters amix with no transformation.
  finalLabels.push(`[${silenceIndex}:a]`);

  // Detect spectral-duck opt-in: exactly 1 voice + 1 music + nothing else.
  // Anything else (no roles / SFX present / multiple voices) falls back to
  // the flat amix path below — backward compatible.
  const voices = audioInputs.filter((a) => a.role === "voice");
  const musics = audioInputs.filter((a) => a.role === "music");
  const useDuck = voices.length === 1 && musics.length === 1 && audioInputs.length === 2;

  const amixLabel = "[aout]";
  let filterComplex;

  if (useDuck) {
    // Duck path: route per-track chains into [v]/[m] labels, then ducker.
    const v = voices[0];
    const m = musics[0];
    const duckStyle = m.duckStyle || v.duckStyle || "podcast";
    // chainSegments wrote `[a${idx}]` outputs; rename them to vIn/mIn.
    const vLabel = `a${v.ffmpegIndex}`;
    const mLabel = `a${m.ffmpegIndex}`;
    const duck = buildDuckFilterGraph({
      style: duckStyle,
      voiceInput: vLabel,
      musicInput: mLabel,
      outLabel: "duckedout",
    });
    // The silence track still pads duration. Sum [duckedout] + silence
    // through one final amix so a comp ending early still hits the full
    // authored duration.
    const finalSegment = `[duckedout][${silenceIndex}:a]amix=inputs=2:duration=longest:dropout_transition=0${amixLabel}`;
    filterComplex = [...chainSegments, duck.filterGraph, finalSegment].join(";");
    console.log(`▶ render-vite: duck mode (style=${duckStyle}) — voice="${v.id || `(no id)`}" music="${m.id || `(no id)`}"`);
  } else {
    // Flat amix sums real tracks + the silence track; the silence track is
    // always exactly `duration` long, so amix's `duration=longest` output
    // always reaches the comp's authored timeline length. dropout_transition=0
    // avoids amix's default 2s gain ramp when shorter inputs end.
    const amixCount = audioInputs.length + 1;
    const amixSegment = `${finalLabels.join("")}amix=inputs=${amixCount}:duration=longest:dropout_transition=0${amixLabel}`;
    filterComplex = [...chainSegments, amixSegment].join(";");
  }

  muxArgs.push(
    "-filter_complex", filterComplex,
    "-map", "0:v:0",
    "-map", amixLabel,
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    outPath,
  );

  try {
    await spawnAsync(ffmpegBin, muxArgs);
  } catch (err) {
    console.error(`✗ ffmpeg mux failed: ${err.message}`);
    console.error(`  video-only file preserved at: ${videoOnlyPath}`);
    console.error(`  temp frames preserved at:     ${tmpDir}`);
    process.exit(1);
  }

  const muxSecs = ((Date.now() - muxStart) / 1000).toFixed(1);
  console.log(`✓ audio mixed (${muxSecs}s)`);

  // Drop the intermediate video-only file on success.
  try {
    fs.unlinkSync(videoOnlyPath);
  } catch (err) {
    console.warn(`  cleanup warning: could not remove ${videoOnlyPath}: ${err.message}`);
  }
} else if (skipAudio && audioScan.length) {
  console.log(`  --no-audio: skipping mux pass (${audioScan.length} <audio> element(s) ignored)`);
}

// --- cleanup --------------------------------------------------------------

if (tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`  cleanup warning: ${err.message} (temp dir: ${tmpDir})`);
  }
}

const outStat = fs.statSync(outPath);
const outMb = (outStat.size / (1024 * 1024)).toFixed(2);
const totalSecs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`✓ render-vite: ${path.relative(projectRoot, outPath)}  ${outMb} MiB  (${totalSecs}s)`);
