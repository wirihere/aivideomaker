// Spectral-ducking CLI — standalone wrapper around lib/audio-duck.mjs.
//
// Mixes a voiceover over a music bed with frequency-aware sidechain
// compression: the music's MID band ducks when the voice talks, the bass
// and high-end stay at full volume. See lib/audio-duck.mjs for the trick.
//
// Usage:
//   node scripts/audio-duck.mjs --voice=v.mp3 --music=m.mp3 --out=o.mp3
//   node scripts/audio-duck.mjs --voice=v.mp3 --music=m.mp3 --out=o.mp3 --style=cinematic
//   node scripts/audio-duck.mjs --voice=v.mp3 --music=m.mp3 --out=o.mp3 --threshold=0.04 --ratio=10
//   node scripts/audio-duck.mjs --voice=v.mp3 --music=m.mp3 --out=o.mp3 --voice-level=2 --music-level=-3
//   node scripts/audio-duck.mjs --voice=v.mp3 --music=m.mp3 --out=o.mp3 --dry-run
//   node scripts/audio-duck.mjs --gen-fixtures --out-dir=tmp/
//
// Flags:
//   --voice=<path>            voice/narration audio (required unless --gen-fixtures)
//   --music=<path>            music bed (required unless --gen-fixtures)
//   --out=<path>              output file (required unless --gen-fixtures or --dry-run)
//   --style=<podcast|cinematic|tiktok>   preset (default podcast)
//   --threshold/--ratio/--attack/--release   override preset values
//   --voice-level=<dB>        voice trim (default 0 dB)
//   --music-level=<dB>        music trim (default 0 dB)
//   --dry-run                 print filter graph + ffmpeg argv, don't run
//   --gen-fixtures            synthesise tone-test voice+music files into --out-dir
//   --out-dir=<dir>           where --gen-fixtures writes (default tmp/audio-duck-fixtures)

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";
import {
  buildDuckFilterGraph,
  buildToneTestFixtures,
  resolveStyleParams,
  STYLES,
  DEFAULT_STYLE,
} from "./lib/audio-duck.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = {};
for (const a of argv) {
  if (!a.startsWith("--")) continue;
  const eq = a.indexOf("=");
  const key = eq >= 0 ? a.slice(2, eq) : a.slice(2);
  const val = eq >= 0 ? a.slice(eq + 1) : true;
  flags[key] = val;
}

if (flags.help || flags.h) {
  console.log(readUsage());
  process.exit(0);
}

const ffmpeg = await getFfmpegPath();

// --gen-fixtures: synthesise voice+music pair via lavfi tones. Exits.
if (flags["gen-fixtures"]) {
  const outDir = path.resolve(projectRoot, flags["out-dir"] ?? "tmp/audio-duck-fixtures");
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`▶ generating tone-test fixtures into ${outDir}`);
  const { voice, music } = await buildToneTestFixtures({ outDir, ffmpeg, duration: 5 });
  console.log(`✓ voice: ${voice}\n✓ music: ${music}`);
  console.log(`Next: node scripts/audio-duck.mjs --voice=${voice} --music=${music} --out=${path.join(outDir, "ducked.mp3")}`);
  process.exit(0);
}

// --- normal duck path -----------------------------------------------------
if (!flags.voice || !flags.music) bail("--voice and --music are required.");
if (!flags.out && !flags["dry-run"]) bail("--out is required (or pass --dry-run).");

const voicePath = path.resolve(projectRoot, flags.voice);
const musicPath = path.resolve(projectRoot, flags.music);
const outPath   = flags.out ? path.resolve(projectRoot, flags.out) : null;

if (!fs.existsSync(voicePath)) bail(`Voice not found: ${voicePath}`, /*help=*/false);
if (!fs.existsSync(musicPath)) bail(`Music not found: ${musicPath}`, /*help=*/false);

const styleName = flags.style ?? DEFAULT_STYLE;
if (!STYLES[styleName]) bail(`Unknown style "${styleName}". Valid: ${Object.keys(STYLES).join(", ")}`, /*help=*/false);

// Build the filter graph via the library.
const overrides = {
  threshold: numOrUndef(flags.threshold),
  ratio:     numOrUndef(flags.ratio),
  attack:    numOrUndef(flags.attack),
  release:   numOrUndef(flags.release),
  voiceLevelDb: numOrUndef(flags["voice-level"]) ?? 0,
  musicLevelDb: numOrUndef(flags["music-level"]) ?? 0,
};

const { filterGraph, params, outLabel } = buildDuckFilterGraph({
  style: styleName,
  ...overrides,
  voiceInput: "0:a",
  musicInput: "1:a",
  outLabel: "out",
});

const ffmpegArgs = [
  "-y",
  "-i", voicePath,
  "-i", musicPath,
  "-filter_complex", filterGraph,
  "-map", `[${outLabel}]`,
  "-c:a", "libmp3lame",
  "-b:a", "192k",
  ...(outPath ? [outPath] : []),
];

console.log(`▶ audio-duck — style=${styleName}`);
console.log(`  voice:    ${path.relative(projectRoot, voicePath) || voicePath}`);
console.log(`  music:    ${path.relative(projectRoot, musicPath) || musicPath}`);
if (outPath) {
  console.log(`  out:      ${path.relative(projectRoot, outPath) || outPath}`);
}
console.log(`  preset:   threshold=${params.threshold} ratio=${params.ratio} attack=${params.attack}ms release=${params.release}ms`);
if (params.voiceLevelDb !== 0 || params.musicLevelDb !== 0) {
  console.log(`  trims:    voice=${params.voiceLevelDb}dB music=${params.musicLevelDb}dB`);
}
console.log("");
console.log("filter_complex:");
console.log(`  ${filterGraph}`);

if (flags["dry-run"]) {
  console.log("");
  console.log("ffmpeg argv (dry-run, not executed):");
  console.log("  " + [ffmpeg, ...ffmpegArgs].map(quote).join(" "));
  process.exit(0);
}

console.log("");
console.log(`▶ running ffmpeg (${path.basename(ffmpeg)})`);
const exit = await spawnPromise(ffmpeg, ffmpegArgs, { cwd: projectRoot });
if (exit !== 0) {
  console.error(`ffmpeg exited ${exit}`);
  process.exit(exit);
}
console.log(`✓ done — ${outPath}`);

// --- helpers --------------------------------------------------------------
function numOrUndef(v) {
  if (v === undefined || v === true) return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}
function quote(s) {
  if (typeof s !== "string") return String(s);
  return /[\s"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}
function spawnPromise(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("close", (code) => resolve(code ?? 0));
    p.on("error", reject);
  });
}
function bail(msg, showHelp = true) {
  console.error(`Error: ${msg}\n`);
  if (showHelp) console.error(readUsage());
  process.exit(2);
}
function readUsage() {
  const styles = Object.entries(STYLES).map(([n, p]) =>
    `  ${n.padEnd(10)} threshold=${p.threshold} ratio=${p.ratio} attack=${p.attack} release=${p.release}`
  ).join("\n");
  return `Usage: node scripts/audio-duck.mjs --voice=<path> --music=<path> --out=<path> [opts]

Options:
  --style=<${Object.keys(STYLES).join("|")}>   preset (default ${DEFAULT_STYLE})
  --threshold/--ratio/--attack/--release   override preset compressor values
  --voice-level=<dB> --music-level=<dB>    level trims (default 0)
  --dry-run            print filter graph + argv, don't run ffmpeg
  --gen-fixtures       synthesise tone-test voice+music into --out-dir
  --out-dir=<dir>      output dir for --gen-fixtures (default tmp/audio-duck-fixtures)

Style presets:
${styles}
`;
}
