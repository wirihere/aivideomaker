// Concatenate a rendered MP4 N times into one file (stream copy — instant).
// Usage: node scratch/concat-loop.mjs <input.mp4> <times> <output.mp4>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getFfmpegPath } from "../scripts/lib/ffmpeg-path.mjs";
import { spawn } from "child_process";

const [, , input, timesArg, output] = process.argv;
const times = parseInt(timesArg || "10", 10);
if (!input || !output) {
  console.error("Usage: node scratch/concat-loop.mjs <input.mp4> <times> <output.mp4>");
  process.exit(2);
}
const inAbs = path.resolve(input);
const outAbs = path.resolve(output);
if (!fs.existsSync(inAbs)) { console.error(`not found: ${inAbs}`); process.exit(2); }

// concat demuxer list
const listPath = path.join(path.dirname(outAbs), "concat-list.txt");
const list = Array.from({ length: times }, () => `file '${inAbs.replace(/'/g, "'\\''")}'`).join("\n");
fs.writeFileSync(listPath, list);

const ff = await getFfmpegPath();
const args = ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outAbs];
console.log(`▶ concat ${times}× ${path.basename(inAbs)} → ${path.basename(outAbs)}`);
await new Promise((res, rej) => {
  const p = spawn(ff, args, { stdio: ["ignore", "pipe", "pipe"] });
  p.stderr.on("data", d => process.stderr.write(d.toString().includes("frame=") ? d : ""));
  p.on("close", c => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))));
});
fs.unlinkSync(listPath);
const stat = fs.statSync(outAbs);
console.log(`✓ ${outAbs} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
