// Convert a rendered MP4 to universal yuv420p pixel format.
//
// The render pipeline (hyperframes render → scripts/render.mjs) emits H.264
// High 4:4:4 Predictive / yuv444p. That plays in VLC but fails silently in
// Windows Media Player, Photos, QuickTime, and some browsers. This wrapper
// re-encodes the video stream to standard yuv420p (4:2:0 chroma) — same
// H.264 codec, just the pixel format everyone supports. Audio passes
// through untouched. See LEARNINGS.md §4 "Render produces yuv444p".
//
// Usage:
//   node scripts/to-yuv420.mjs <input.mp4>                     # writes <input>-yuv420.mp4
//   node scripts/to-yuv420.mjs <input.mp4> --out=<path.mp4>    # explicit output path
//   node scripts/to-yuv420.mjs <input.mp4> --replace           # overwrite the input
//
// CRF 18 + slow preset matches the project's grade quality; +faststart
// puts the moov atom first so playback starts immediately on streaming.

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";

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
  console.log(`Usage:
  node scripts/to-yuv420.mjs <input.mp4> [--out=<path>] [--replace]
  node scripts/to-yuv420.mjs renders/binsparkle/X-graded.mp4

Re-encodes the video stream to yuv420p (universal H.264). Audio copied
untouched. Output defaults to <input>-yuv420.mp4 unless --out or --replace.`);
  process.exit(0);
}

const inAbs = path.resolve(input);
if (!fs.existsSync(inAbs)) { console.error(`Not found: ${inAbs}`); process.exit(1); }

let outAbs;
if (flags.out) outAbs = path.resolve(String(flags.out));
else if (flags.replace) outAbs = inAbs;
else {
  const ext = path.extname(inAbs);
  outAbs = inAbs.slice(0, -ext.length) + "-yuv420" + ext;
}

const ff = await getFfmpegPath();
const args = [
  "-y", "-hide_banner", "-loglevel", "error",
  "-i", inAbs,
  "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
  "-crf", "18", "-preset", "slow",
  "-c:a", "copy",
  "-movflags", "+faststart",
  outAbs,
];

console.log(`[to-yuv420] ${path.basename(inAbs)} → ${path.basename(outAbs)}`);
const code = await new Promise((res) => {
  const p = spawn(ff, args, { stdio: "inherit" });
  p.on("close", c => res(c ?? 0));
  p.on("error", e => { console.error(e.message); res(1); });
});
if (code !== 0) { console.error(`ffmpeg exited ${code}`); process.exit(code); }
const sizeMB = (fs.statSync(outAbs).size / (1024 * 1024)).toFixed(2);
console.log(`[to-yuv420] done — ${sizeMB} MB`);
