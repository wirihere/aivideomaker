// Bake an audio amplitude envelope to JSON — drives audio-reactive visuals.
//
// Why bake instead of analyse at runtime: HyperFrames renders frame-by-frame
// in a headless browser. Web Audio's AnalyserNode runs in real time, which is
// non-deterministic at render time (the audio file isn't actually playing in
// sync with frame capture). Solution: pre-compute the envelope offline,
// write JSON keyed by frame index, and have the composition's GSAP timeline
// read it and set CSS custom properties (--amp-bass, --amp-mid, --amp-high)
// on each frame's keyframe.
//
// We use ffmpeg's `astats` filter to extract per-frame RMS levels in three
// frequency bands (bass / mid / high) using parallel bandpass branches.
// Output is a small JSON file the composition imports.
//
// Usage:
//   node scripts/extract-amp.mjs assets/voiceover/foo.mp3
//   node scripts/extract-amp.mjs assets/music/bed.mp3 --fps=30 --bands=3
//   node scripts/extract-amp.mjs assets/music/bed.mp3 --out=assets/amp/bed.json
//
// Output schema:
//   {
//     "source":  "assets/music/bed.mp3",
//     "fps":     30,
//     "frames":  900,
//     "bands":   ["bass", "mid", "high"],
//     "data":    [[0.12, 0.34, 0.21], [0.13, 0.36, 0.20], ...]
//   }
//
// In your composition:
//   const amp = await fetch("assets/amp/bed.json").then(r => r.json());
//   tl.set(scene, { "--amp-bass": amp.data[frameIdx][0] }, frameIdx / amp.fps);
// Or batch via a loop building all keyframes in one pass.

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const BANDS = {
  bass: { low: 20,    high: 250  },
  mid:  { low: 250,   high: 4000 },
  high: { low: 4000,  high: 16000 },
};

function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  return "ffmpeg";
}

function runCapture(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    let stdout = "", stderr = "";
    p.stdout.on("data", d => { stdout += d.toString(); });
    p.stderr.on("data", d => { stderr += d.toString(); });
    p.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`${cmd} exited ${code}\n${stderr.split("\n").slice(-10).join("\n")}`));
    });
    p.on("error", reject);
  });
}

// Get audio duration (seconds) via ffprobe-style ffmpeg call.
async function audioDuration(file) {
  const { stderr } = await runCapture(ffmpegPath(), [
    "-i", file, "-hide_banner", "-f", "null", "-",
  ]);
  // ffmpeg prints `Duration: HH:MM:SS.xx,` to stderr.
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error("Could not read duration");
  const [_, h, mn, s] = m;
  return Number(h) * 3600 + Number(mn) * 60 + Number(s);
}

// For one band, run ffmpeg with bandpass + astats writing per-frame RMS to a
// metadata file. We chunk audio into `1/fps`-second windows by setting
// `astats=metadata=1:reset=1/fps`. The result is one RMS_level per window.
async function extractBand(file, low, high, fps) {
  // Run ffmpeg from the cache dir so we can give ametadata a colon-free
  // relative filename — Windows drive-letter paths break the filter parser.
  const cacheDir = path.join(projectRoot, "assets", ".cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const tmpName = `amp-${path.basename(file)}-${low}-${high}.txt`;
  const tmpFile = path.join(cacheDir, tmpName);
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  // The `astats` filter resets stats every `reset` seconds (window size).
  // 1/fps gives one window per video frame.
  const reset = (1 / fps).toFixed(6);
  const filter =
    `bandpass=f=${(low + high) / 2}:width_type=h:w=${high - low},` +
    `astats=metadata=1:reset=${reset},` +
    `ametadata=mode=print:key=lavfi.astats.Overall.RMS_level:file=${tmpName}`;
  // Resolve input file to absolute since cwd is now cacheDir.
  const absInput = path.resolve(file);
  await runCapture(ffmpegPath(), [
    "-y", "-i", absInput,
    "-af", filter,
    "-f", "null", "-",
  ], { cwd: cacheDir });
  const raw = fs.readFileSync(tmpFile, "utf8");
  fs.unlinkSync(tmpFile);
  // Parse `lavfi.astats.Overall.RMS_level=-23.4567` lines (in dB).
  // Convert dB → 0..1 normalized amplitude (clamp at -60 dB floor).
  const values = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/RMS_level=(-?\d+\.?\d*|inf|-inf|nan)/);
    if (!m) continue;
    let db = parseFloat(m[1]);
    if (!isFinite(db) || isNaN(db)) db = -60;
    const amp = Math.max(0, Math.min(1, (db + 60) / 60));
    values.push(amp);
  }
  return values;
}

// Normalize each band to its own 0..1 range so the loudest moment in each
// band hits 1.0 — visualisations want relative dynamics, not absolute SPL.
function normalizeBand(values) {
  const max = Math.max(...values, 1e-6);
  return values.map(v => v / max);
}

// --- CLI ------------------------------------------------------------------

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const positional = argv.filter(a => !a.startsWith("--"));
const input = positional[0];

if (!input) {
  console.error("Usage: node scripts/extract-amp.mjs <audio-file> [--fps=30] [--out=path.json]");
  process.exit(2);
}
if (!fs.existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(2);
}

const fps = parseInt(flags.fps ?? "30", 10);
const dur = await audioDuration(input);
const expectedFrames = Math.floor(dur * fps);

console.log(`▶ extracting amplitude envelope`);
console.log(`  source:    ${input}`);
console.log(`  duration:  ${dur.toFixed(2)}s`);
console.log(`  fps:       ${fps}`);
console.log(`  frames:    ~${expectedFrames}`);
console.log(`  bands:     ${Object.keys(BANDS).join(", ")}`);

const bandValues = {};
for (const [name, { low, high }] of Object.entries(BANDS)) {
  process.stdout.write(`  · ${name.padEnd(4)} (${low}-${high}Hz) ... `);
  const raw = await extractBand(input, low, high, fps);
  bandValues[name] = normalizeBand(raw);
  process.stdout.write(`${raw.length} samples\n`);
}

// astats emits per-decoder-buffer (not per `reset` window in practice), so the
// raw sample rate varies with codec / sample rate. Resample each band to
// exactly `expectedFrames` slots via linear interpolation so frame N in the
// composition maps to data[N] cleanly.
function resample(values, target) {
  if (values.length === target) return values;
  const out = new Array(target);
  const ratio = (values.length - 1) / (target - 1);
  for (let i = 0; i < target; i++) {
    const src = i * ratio;
    const lo = Math.floor(src), hi = Math.min(lo + 1, values.length - 1);
    const t = src - lo;
    out[i] = values[lo] * (1 - t) + values[hi] * t;
  }
  return out;
}
const resampled = {};
for (const [name, vals] of Object.entries(bandValues)) {
  resampled[name] = resample(vals, expectedFrames);
}
const len = expectedFrames;
const data = [];
for (let i = 0; i < len; i++) {
  data.push(Object.keys(BANDS).map(b => +resampled[b][i].toFixed(4)));
}

const out = flags.out
  ? path.resolve(flags.out)
  : path.join(
      projectRoot, "assets", "amp",
      path.basename(input).replace(/\.[^.]+$/, "") + ".json"
    );
fs.mkdirSync(path.dirname(out), { recursive: true });

const payload = {
  source: path.relative(projectRoot, input).replace(/\\/g, "/"),
  fps,
  frames: len,
  bands: Object.keys(BANDS),
  data,
};
fs.writeFileSync(out, JSON.stringify(payload));

const sz = fs.statSync(out).size;
console.log(`✓ wrote ${out} (${(sz/1024).toFixed(1)} KB, ${len} frames)`);
console.log(`  in your composition:`);
console.log(`    fetch("${path.relative(projectRoot, out).replace(/\\/g, "/")}").then(r => r.json())`);
console.log(`    .then(amp => { /* set --amp-bass on tl.set keyframes */ })`);
