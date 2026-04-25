// Render wrapper — runs `hyperframes render`, then auto-applies post-grade,
// then optionally stamps a watermark onto the graded MP4.
//
// This is the new go-to render command. Bundles the linting → render → grade
// → watermark pipeline so every shipped MP4 has a unified color grade by
// default. Pass `--no-grade` to skip the grade step (e.g. iterating before
// final cut).
//
// Usage:
//   node scripts/render.mjs                              # default: pop grade, no watermark
//   node scripts/render.mjs --lut=teal-orange            # cinematic teal/orange
//   node scripts/render.mjs --lut=warm --strength=0.6    # softer, gentler
//   node scripts/render.mjs --no-grade                   # skip grade
//   node scripts/render.mjs -- --gpu -w 4                # forward args to hyperframes
//   node scripts/render.mjs --replace                    # replace original with graded
//   node scripts/render.mjs --no-progress                # silent (legacy); also: RENDER_PROGRESS=off
//
// Watermark flags (post-grade pass; off by default):
//   --watermark                       # stamp default text "aivideomaker"
//   --watermark=path/to/logo.png      # stamp a custom PNG image
//   --watermark-text="My brand"       # custom text (only with default text mode)
//   --watermark-pos=bottom-right      # bottom-right (default) | bottom-left | top-right | top-left
//   --watermark-opacity=0.6           # 0..1 (default 0.6)
//   --watermark-font=path/to/font.ttf # override the auto-detected text font
//   --no-watermark                    # explicit disable (in case default flips later)
//
// Text watermark on Windows: ffmpeg's drawtext requires a fontfile= when
// fontconfig isn't shipped (the gyan winget build segfaults on font=Arial).
// On first use we lazy-copy C:\Windows\Fonts\arial.ttf into
// assets/.cache/fonts/arial.ttf so the filter can reference it as a
// project-relative path (LEARNINGS §4 — colon-free relative paths only).
//
// Dry-run / inspection:
//   --print-args                      # print the watermark ffmpeg spawn args and exit
//                                     # (works against an existing graded MP4 — no render fired)
//   --input=renders/foo.mp4           # override input for --print-args mode
//
// Output:
//   renders/aivideomaker_<timestamp>.mp4              (raw render)
//   renders/aivideomaker_<timestamp>-graded.mp4       (graded — kept unless --replace)
//   renders/aivideomaker_<timestamp>-graded-wm.mp4    (watermarked — when --watermark)
//
// With --replace + --watermark: only the watermarked file remains, named
// without the -wm suffix (i.e. it overwrites the graded file in-place after
// watermarking, then renames to the original raw filename).

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";
import { parseRootDuration, runWithProgress } from "./lib/render-progress.mjs";
import { node as nodeBin, npxRunArgs } from "./lib/platform-bin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const rendersDir = path.join(projectRoot, "renders");

// --- arg parsing ----------------------------------------------------------

const argv = process.argv.slice(2);
const passThroughIdx = argv.indexOf("--");
const ourArgs = passThroughIdx >= 0 ? argv.slice(0, passThroughIdx) : argv;
const passThrough = passThroughIdx >= 0 ? argv.slice(passThroughIdx + 1) : [];
const flags = Object.fromEntries(
  ourArgs.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const lut       = flags.lut ?? "pop";
const strength  = parseFloat(flags.strength ?? "1.0");
const skipGrade = flags["no-grade"] === true;
const replace   = flags.replace === true;
// --no-progress reverts to the silent inherit-stdio behaviour. Same effect
// as RENDER_PROGRESS=off (deterministic for tests / CI).
const noProgress = flags["no-progress"] === true;

// Watermark: --no-watermark wins; otherwise enabled iff --watermark present.
const wmDisabled  = flags["no-watermark"] === true;
const wmFlag      = flags.watermark;            // true (default text) | string path | undefined
const wmEnabled   = !wmDisabled && wmFlag !== undefined;
const wmIsImage   = typeof wmFlag === "string" && wmFlag !== "";
const wmText      = (typeof flags["watermark-text"] === "string" && flags["watermark-text"]) || "aivideomaker";
const wmPos       = (typeof flags["watermark-pos"] === "string" && flags["watermark-pos"]) || "bottom-right";
const wmOpacity   = clamp01(parseFloat(flags["watermark-opacity"] ?? "0.6"));
const wmFontOverride = typeof flags["watermark-font"] === "string" ? flags["watermark-font"] : null;
const printArgs   = flags["print-args"] === true;
const inputOverride = typeof flags.input === "string" ? flags.input : null;

const VALID_POSITIONS = new Set(["bottom-right", "bottom-left", "top-right", "top-left"]);
if (wmEnabled && !VALID_POSITIONS.has(wmPos)) {
  console.error(`✗ invalid --watermark-pos="${wmPos}". Valid: ${[...VALID_POSITIONS].join(", ")}`);
  process.exit(2);
}
if (wmEnabled && (Number.isNaN(wmOpacity) || wmOpacity < 0 || wmOpacity > 1)) {
  console.error(`✗ invalid --watermark-opacity. Must be 0..1.`);
  process.exit(2);
}

// --- helpers --------------------------------------------------------------

function clamp01(v) {
  if (Number.isNaN(v)) return NaN;
  return Math.max(0, Math.min(1, v));
}

function listMp4sBefore() {
  if (!fs.existsSync(rendersDir)) return new Set();
  return new Set(
    fs.readdirSync(rendersDir)
      .filter(f => f.endsWith(".mp4"))
      .map(f => path.join(rendersDir, f))
  );
}

function newestMp4Since(before) {
  if (!fs.existsSync(rendersDir)) return null;
  const candidates = fs.readdirSync(rendersDir)
    .filter(f => f.endsWith(".mp4"))
    .map(f => path.join(rendersDir, f))
    .filter(p => !before.has(p));
  if (!candidates.length) return null;
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0];
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}

// Resolved once at startup (see top-level await below) and threaded into
// buildWatermarkSpawn(). Bundled binary preferred via @ffmpeg-installer/ffmpeg
// with a fall-through to system PATH; see scripts/lib/ffmpeg-path.mjs.
const ffmpegBin = await getFfmpegPath();

// Resolve a font file path for drawtext. On Windows, ffmpeg's drawtext
// segfaults when font=Arial is requested without fontconfig (gyan/winget
// build doesn't ship fontconfig.cfg). Workaround: ensure a TTF is available
// inside the project and reference it via a colon-free relative path so
// the filter parser doesn't choke (LEARNINGS §4).
//
// Returns the path *relative to projectRoot* with forward slashes, or null
// if no font can be resolved (caller should fall back to ffmpeg's default,
// which works on macOS/Linux via fontconfig).
function resolveDrawtextFont(override) {
  const cacheDir = path.join(projectRoot, "assets", ".cache", "fonts");
  // 1. Explicit user override wins.
  if (override) {
    const abs = path.resolve(projectRoot, override);
    if (!fs.existsSync(abs)) {
      throw new Error(`--watermark-font: file not found: ${abs}`);
    }
    return path.relative(projectRoot, abs).replace(/\\/g, "/");
  }
  // 2. Cached copy from a prior run.
  const cached = path.join(cacheDir, "arial.ttf");
  if (fs.existsSync(cached)) {
    return path.relative(projectRoot, cached).replace(/\\/g, "/");
  }
  // 3. Lazy-copy a system font into the cache (Windows-only path so far).
  const candidates = [
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ];
  for (const src of candidates) {
    if (fs.existsSync(src)) {
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.copyFileSync(src, cached);
      return path.relative(projectRoot, cached).replace(/\\/g, "/");
    }
  }
  return null; // caller will fall back to font= and hope fontconfig works
}

// --- watermark filter builders -------------------------------------------

// drawtext escape: any of `:`, `\`, `'` inside the text= value must be
// escaped with a backslash (filter-graph level), and we additionally avoid
// `:` because that's the filter-arg separator.
function escapeDrawtextValue(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");
}

// Position mapping for the watermark anchor. Uses the same 20px inset as
// LEARNINGS recommends visually; padding stays consistent with text/image.
// For drawtext: tw/th = text width/height. For overlay: w/h of input minus
// W/H of overlay.
function drawtextPositionExpr(pos) {
  switch (pos) {
    case "bottom-right": return { x: "w-tw-20", y: "h-th-20" };
    case "bottom-left":  return { x: "20",      y: "h-th-20" };
    case "top-right":    return { x: "w-tw-20", y: "20"      };
    case "top-left":     return { x: "20",      y: "20"      };
  }
}

function overlayPositionExpr(pos) {
  // 16px padding (per spec) for image overlays; main W/H is the input video,
  // overlay w/h is the overlay's own size after scaling.
  switch (pos) {
    case "bottom-right": return { x: "main_w-overlay_w-16", y: "main_h-overlay_h-16" };
    case "bottom-left":  return { x: "16",                  y: "main_h-overlay_h-16" };
    case "top-right":    return { x: "main_w-overlay_w-16", y: "16"                  };
    case "top-left":     return { x: "16",                  y: "16"                  };
  }
}

// Default text watermark — drawtext with white text + soft shadow for
// legibility on bright backgrounds. Font size = ~3% of frame height (works
// across 1080p / 720p without configuration). Color opacity rolled into the
// alpha channel of fontcolor so the shadow can be a softer separate value.
//
// fontRelPath: project-relative TTF path (forward slashes, no drive-letter
// colon). When null, falls back to font=Arial (works wherever fontconfig is
// available, e.g. macOS/Linux).
//
// fontsize=h/30 ≈ 36px @ 1080p (~3% of frame height). Visually reads as
// "small but unmissable" — the scale most platforms use for their mark.
function buildDrawtextFilter(text, pos, opacity, fontRelPath) {
  const { x, y } = drawtextPositionExpr(pos);
  const safeText = escapeDrawtextValue(text);
  const parts = [
    `text='${safeText}'`,
    fontRelPath ? `fontfile=${fontRelPath}` : `font=Arial`,
    `fontcolor=white@${(opacity).toFixed(3)}`,
    `fontsize=h/30`,
    `shadowcolor=black@${(opacity * 0.6).toFixed(3)}`,
    `shadowx=2`,
    `shadowy=2`,
    `x=${x}`,
    `y=${y}`,
  ];
  return `drawtext=${parts.join(":")}`;
}

// Custom PNG watermark — scaled to ~6% of the main video's width via
// scale2ref, then overlaid at the configured corner. Image is provided as
// the second `-i` input (input #1), so the filter graph itself contains no
// Windows-absolute paths — the LEARNINGS §4 cwd/relative trick still
// applies as a belt-and-braces measure.
function buildOverlayFilter(pos, opacity) {
  const { x, y } = overlayPositionExpr(pos);
  const a = opacity.toFixed(3);
  return [
    // scale2ref: resize input #1 (the watermark image) using input #0
    // (the main video) as the size reference. w='iw*0.06' on the ref =
    // 6% of main video width; h='ow/mdar' picks the height that keeps
    // the watermark's own aspect ratio.
    `[1:v][0:v]scale2ref=w='iw*0.06':h='ow/mdar'[wm][main]`,
    // colorchannelmixer aa=opacity multiplies the alpha channel uniformly
    // so the user's --watermark-opacity also dims a fully-opaque PNG.
    `[wm]format=rgba,colorchannelmixer=aa=${a}[wma]`,
    `[main][wma]overlay=x=${x}:y=${y}`,
  ].join(";");
}

// Build the ffmpeg argv for the watermark pass. Returns an object with
// { args, cwd } so the caller can spawn or print as needed.
function buildWatermarkSpawn({ input, output, isImage, imagePathAbs, text, pos, opacity, fontRelPath }) {
  // Use cwd=projectRoot + path.relative for any filter-internal paths
  // (LEARNINGS §4: ffmpeg filter parser breaks on Windows C:\ absolute).
  // Inputs/outputs go through -i/output args, which tolerate absolute paths.
  const args = ["-y", "-i", input];

  if (isImage) {
    args.push("-i", imagePathAbs);
    args.push("-filter_complex", buildOverlayFilter(pos, opacity));
  } else {
    args.push("-vf", buildDrawtextFilter(text, pos, opacity, fontRelPath));
  }

  args.push(
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-c:a", "copy",
    "-movflags", "+faststart",
    output,
  );

  return { cmd: ffmpegBin, args, cwd: projectRoot };
}

// --- main -----------------------------------------------------------------

// --print-args dry-run mode: skip the render entirely, build the watermark
// spawn args against an existing MP4, print, exit. Useful for verification
// without burning 5 minutes on a render.
if (printArgs) {
  if (!wmEnabled) {
    console.error("✗ --print-args requires --watermark[=...] (nothing to print otherwise).");
    process.exit(2);
  }
  const inputPath = inputOverride
    ? path.resolve(projectRoot, inputOverride)
    : (() => {
        // Newest mp4 in renders/, just for a realistic example.
        if (!fs.existsSync(rendersDir)) return null;
        const all = fs.readdirSync(rendersDir).filter(f => f.endsWith(".mp4"));
        if (!all.length) return null;
        all.sort((a, b) => fs.statSync(path.join(rendersDir, b)).mtimeMs - fs.statSync(path.join(rendersDir, a)).mtimeMs);
        return path.join(rendersDir, all[0]);
      })();
  if (!inputPath) {
    console.error("✗ --print-args: no input MP4 found. Pass --input=<path> or render once first.");
    process.exit(2);
  }
  const ext = path.extname(inputPath);
  const base = inputPath.slice(0, -ext.length);
  const output = `${base}-wm${ext}`;
  const imagePathAbs = wmIsImage ? path.resolve(projectRoot, wmFlag) : null;
  const fontRelPath = wmIsImage ? null : resolveDrawtextFont(wmFontOverride);
  const spawnArgs = buildWatermarkSpawn({
    input: inputPath,
    output,
    isImage: wmIsImage,
    imagePathAbs,
    text: wmText,
    pos: wmPos,
    opacity: wmOpacity,
    fontRelPath,
  });
  console.log("--- watermark dry-run ----------------------------------------");
  console.log(`mode:    ${wmIsImage ? "image overlay" : "drawtext (default)"}`);
  console.log(`text:    ${wmIsImage ? "(n/a)" : wmText}`);
  console.log(`image:   ${wmIsImage ? path.relative(projectRoot, imagePathAbs) : "(n/a)"}`);
  console.log(`font:    ${wmIsImage ? "(n/a)" : (fontRelPath || "<system fontconfig>")}`);
  console.log(`pos:     ${wmPos}`);
  console.log(`opacity: ${wmOpacity}`);
  console.log(`input:   ${path.relative(projectRoot, inputPath)}`);
  console.log(`output:  ${path.relative(projectRoot, output)}`);
  console.log(`cwd:     ${spawnArgs.cwd}`);
  console.log(`spawn:   ${spawnArgs.cmd} ${spawnArgs.args.map(a => /\s/.test(a) ? `"${a}"` : a).join(" ")}`);
  console.log("--------------------------------------------------------------");
  process.exit(0);
}

const t0 = Date.now();
console.log("▶ render: hyperframes render", passThrough.join(" "));

const before = listMp4sBefore();

// Read total frames from the root composition so the progress bar can
// compute % and ETA. Falls back to indeterminate (frame counter only) if
// data-duration is unparseable. fps is fixed at 30 unless the user passed
// `--fps NN` through `--`.
const fpsFromArgs = (() => {
  const i = passThrough.findIndex(a => a === "--fps" || a === "-f");
  if (i >= 0 && passThrough[i + 1]) return parseInt(passThrough[i + 1], 10);
  const eq = passThrough.find(a => a.startsWith("--fps="));
  if (eq) return parseInt(eq.split("=")[1], 10);
  return 30;
})();
const indexHtml = path.join(projectRoot, "index.html");
const meta = parseRootDuration(indexHtml, fpsFromArgs);
const totalFrames = meta?.totalFrames ?? null;

// Spawn the locally-installed `hyperframes` CLI directly via `node`. Skipping
// `npx` (a `.cmd` on Windows) avoids Node 22's DEP0190 *and* CVE-2024-27980's
// EINVAL on `.cmd` files. See scripts/lib/platform-bin.mjs.
await runWithProgress(nodeBin, npxRunArgs("hyperframes", ["render", ...passThrough]), {
  cwd: projectRoot,
}, {
  totalFrames,
  label: "render",
  progressEnabled: !noProgress,
});

const rendered = newestMp4Since(before);
if (!rendered) {
  console.error("✗ no new MP4 detected in renders/ — render may have failed silently");
  process.exit(1);
}

const renderSecs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`✓ render: ${path.relative(projectRoot, rendered)} (${renderSecs}s)`);

// Decide what the input to the watermark pass will be: graded MP4 if grade
// ran, otherwise the raw render.
let currentTopMp4 = rendered;
let gradedPath = null;

if (skipGrade) {
  console.log("⏭  --no-grade: skipping color grade");
} else {
  // Post-grade. Uses process.execPath (the absolute path to the running
  // Node binary) — no shell needed, and avoids Node 22 DEP0190.
  console.log(`▶ grade: ${lut} @ strength=${strength}`);
  await run(nodeBin, [
    path.join("scripts", "post-grade.mjs"),
    path.relative(projectRoot, rendered),
    `--lut=${lut}`,
    `--strength=${strength}`,
  ], { cwd: projectRoot });

  const ext = path.extname(rendered);
  const base = rendered.slice(0, -ext.length);
  gradedPath = `${base}-graded${ext}`;

  if (!fs.existsSync(gradedPath)) {
    console.error(`✗ expected ${gradedPath} but not found`);
    process.exit(1);
  }
  currentTopMp4 = gradedPath;
  // Defer the "✓ graded: ..." print to the finalisation block so the
  // ordering matches the pre-watermark behaviour (graded → raw summary
  // appear together at the end).
}

// Watermark pass.
let watermarked = null;
if (wmEnabled) {
  const ext = path.extname(currentTopMp4);
  const base = currentTopMp4.slice(0, -ext.length);
  const wmOutput = `${base}-wm${ext}`;
  const imagePathAbs = wmIsImage ? path.resolve(projectRoot, wmFlag) : null;
  if (wmIsImage && !fs.existsSync(imagePathAbs)) {
    console.error(`✗ watermark image not found: ${imagePathAbs}`);
    process.exit(1);
  }

  const fontRelPath = wmIsImage ? null : resolveDrawtextFont(wmFontOverride);
  const spawnArgs = buildWatermarkSpawn({
    input: currentTopMp4,
    output: wmOutput,
    isImage: wmIsImage,
    imagePathAbs,
    text: wmText,
    pos: wmPos,
    opacity: wmOpacity,
    fontRelPath,
  });

  console.log(`▶ watermark: ${wmIsImage ? "image" : "text"} @ ${wmPos}, opacity=${wmOpacity}`);
  if (!wmIsImage) console.log(`  font: ${fontRelPath || "<system fontconfig>"}`);
  console.log(`  ffmpeg ${spawnArgs.args.map(a => /\s/.test(a) ? `"${a}"` : a).join(" ")}`);
  await run(spawnArgs.cmd, spawnArgs.args, { cwd: spawnArgs.cwd });

  if (!fs.existsSync(wmOutput)) {
    console.error(`✗ expected ${wmOutput} but not found`);
    process.exit(1);
  }
  watermarked = wmOutput;
  console.log(`✓ watermark: ${path.relative(projectRoot, watermarked)}`);
}

// --- finalisation ---------------------------------------------------------
//
// Replacement strategy:
//   --replace + watermark: keep only watermarked file, renamed to raw name
//   --replace alone:       keep only graded file, renamed to raw name (legacy)
//   no --replace:          keep all artefacts (raw, graded, watermarked)

if (replace) {
  const finalSource = watermarked || gradedPath;
  if (finalSource) {
    // Delete the raw, then collapse intermediate(s) onto the raw filename.
    if (fs.existsSync(rendered) && finalSource !== rendered) fs.unlinkSync(rendered);
    if (gradedPath && watermarked && fs.existsSync(gradedPath)) {
      fs.unlinkSync(gradedPath);
    }
    fs.renameSync(finalSource, rendered);
    const tag = watermarked ? "graded+watermarked" : "graded";
    console.log(`✓ --replace: ${path.relative(projectRoot, rendered)} now ${tag}`);
  }
} else {
  if (gradedPath) {
    console.log(`✓ graded: ${path.relative(projectRoot, gradedPath)}`);
  }
  if (watermarked) {
    console.log(`✓ watermarked: ${path.relative(projectRoot, watermarked)}`);
  }
  console.log(`  raw:    ${path.relative(projectRoot, rendered)} (kept for A/B)`);
}

const totalSecs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`✓ done in ${totalSecs}s`);
