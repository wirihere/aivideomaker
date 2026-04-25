// Custom renderer (Phase 1 + 2) — Playwright frame capture + ffmpeg encode + audio mux.
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
//   Phase 3 will move to parallel BrowserContexts. See docs/render-vite-roadmap.md.
//
// Usage:
//   node scripts/render-vite.mjs <composition-path> [--out <mp4-path>] [--fps 30] [--no-audio]
//
// Examples:
//   node scripts/render-vite.mjs compositions/text-fx-demo.html
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --out renders/text-fx-vite.mp4
//   node scripts/render-vite.mjs compositions/text-fx-demo.html --fps 60
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
  console.error("usage: node scripts/render-vite.mjs <composition-path> [--out <mp4>] [--fps 30] [--no-audio]");
  process.exit(2);
}

// --no-audio: skip the audio mux pass entirely, even if the comp has <audio>
// elements. Useful for fast visual iteration or debugging the encode path.
const skipAudio = flags["no-audio"] === true || flags["no-audio"] === "true";

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

// Resize viewport to match the composition's authored dimensions so
// screenshots come out at native resolution.
await page.setViewportSize({ width: probe.width, height: probe.height });

const totalFrames = Math.ceil(duration * fps);
console.log(`  frames:   ${totalFrames}  (≈${(totalFrames / fps).toFixed(2)}s wall-clock minimum)`);
console.log(`▶ render-vite: capturing ${totalFrames} frames`);

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
console.log(`✓ frames captured (${captureSecs}s)`);

await browser.close();

if (consoleErrors.length) {
  console.warn(`  ${consoleErrors.length} console/runtime error(s) during capture:`);
  for (const e of consoleErrors.slice(0, 5)) console.warn(`    - ${e.slice(0, 160)}`);
}

// --- encode ---------------------------------------------------------------

const ffmpegBin = await getFfmpegPath();

// Decide whether we'll do a mux pass. If yes, libx264 writes to a temp
// .video.mp4 and the mux pass `-c:v copy`s it to the final outPath. If no,
// libx264 writes directly to outPath (preserving the Phase 1 path bit-for-
// bit when no audio is desired).
const willMux = !skipAudio && audioTracks.length > 0;
const videoOnlyPath = willMux
  ? path.join(path.dirname(outPath), `${path.basename(outPath, path.extname(outPath))}.video.mp4`)
  : outPath;

const encodeStart = Date.now();
console.log(`▶ render-vite: encoding video → ${path.relative(projectRoot, videoOnlyPath)}`);

const ffmpegArgs = [
  "-y",
  "-framerate", String(fps),
  "-i", path.join(tmpDir, "frame-%06d.png"),
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

  // amix sums real tracks + the silence track; the silence track is always
  // exactly `duration` long, so amix's `duration=longest` output always
  // reaches the comp's authored timeline length. dropout_transition=0
  // avoids amix's default 2s gain ramp when shorter inputs end.
  const amixLabel = "[aout]";
  const amixCount = audioInputs.length + 1;
  const amixSegment = `${finalLabels.join("")}amix=inputs=${amixCount}:duration=longest:dropout_transition=0${amixLabel}`;
  const filterComplex = [...chainSegments, amixSegment].join(";");

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

try {
  fs.rmSync(tmpDir, { recursive: true, force: true });
} catch (err) {
  console.warn(`  cleanup warning: ${err.message} (temp dir: ${tmpDir})`);
}

const outStat = fs.statSync(outPath);
const outMb = (outStat.size / (1024 * 1024)).toFixed(2);
const totalSecs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`✓ render-vite: ${path.relative(projectRoot, outPath)}  ${outMb} MiB  (${totalSecs}s)`);
