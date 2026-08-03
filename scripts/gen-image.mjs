// Generate an image via Runware (FLUX.2 dev by default) and save it to disk.
//
// One-command image generation for any session: prompt in, PNG out, cost
// printed. Uses the shared imageInference() client (cost-capped, key from
// automation-template/.env).
//
// Usage:
//   node scripts/gen-image.mjs --prompt="..." --out=videos/binsparkle/assets/happy-bin.png
//   npm run gen:image -- --prompt="..." --out=<path>
//
// Required:
//   --prompt=<text>      the positive prompt (or --prompt-file=<path>)
//   --out=<path>         where to save the PNG
//
// Optional:
//   --model=<id>         Runware AIR id (default: runware:400@1, FLUX.2 [dev], $0.009/img)
//   --width=<n>          image width  (default 1080)
//   --height=<n>         image height (default 1920 — 9:16 vertical for social)
//   --negative=<text>    negative prompt (things to avoid)
//   --seed=<n>           fixed seed (for consistency across a character set)
//   --number=<n>         number of variants (default 1; linear cost)
//   --prompt-file=<path> read prompt from a file instead of --prompt

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { imageInference, downloadImage } from "./lib/runware-image.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

let prompt = typeof flags.prompt === "string" ? flags.prompt : null;
if (!prompt && typeof flags["prompt-file"] === "string") {
  prompt = fs.readFileSync(path.resolve(flags["prompt-file"]), "utf8").trim();
}
const out = typeof flags.out === "string" ? flags.out : null;

if (!prompt || !out) {
  console.error(`gen-image — generate an image via Runware and save it

Usage:
  node scripts/gen-image.mjs --prompt="..." --out=<path>

Required:
  --prompt=<text>      positive prompt (or --prompt-file=<path>)
  --out=<path>         output PNG path

Optional:
  --model=<id>         default: runware:400@1 (FLUX.2 [dev], ~\$0.009/image)
  --width=<n>          default 1080
  --height=<n>         default 1920 (9:16 vertical — social)
  --negative=<text>    negative prompt
  --seed=<n>           fixed seed (for character-set consistency)
  --number=<n>         variants (default 1; linear cost)
  --prompt-file=<path> read prompt from file`);
  process.exit(2);
}

const model = typeof flags.model === "string" ? flags.model : "runware:400@1";
// FLUX requires dimensions in multiples of 16 (128–2048). Snap silently — the
// 8px difference between 1080 and 1088 is invisible under object-fit: cover.
const snap16 = n => Math.max(128, Math.min(2048, Math.round(n / 16) * 16));
const width = snap16(parseInt(String(flags.width), 10) || 1080);
const height = snap16(parseInt(String(flags.height), 10) || 1920);
const negative = typeof flags.negative === "string" ? flags.negative : null;
const seed = flags.seed != null && flags.seed !== true ? parseInt(String(flags.seed), 10) : undefined;
const numberResults = parseInt(String(flags.number), 10) || 1;

const outAbs = path.resolve(out);
const params = {
  positivePrompt: prompt,
  width,
  height,
  numberResults,
  ...(negative ? { negativePrompt: negative } : {}),
  ...(seed != null && Number.isFinite(seed) ? { seed } : {}),
};

console.log(`▶ gen-image: ${model} · ${width}×${height}`);
if (seed != null) console.log(`  seed: ${seed}`);
console.log(`  prompt: ${prompt.slice(0, 100)}${prompt.length > 100 ? "…" : ""}`);
console.log("");

const t0 = Date.now();
try {
  const result = await imageInference({ model, params });
  console.log(`✓ ${result.results.length} image(s) in ${((Date.now() - t0) / 1000).toFixed(1)}s · cost $${result.cost.toFixed(6)} · today $${result.today.spend.toFixed(4)}/$${result.today.cap}`);

  for (let i = 0; i < result.results.length; i++) {
    const r = result.results[i];
    if (!r.imageURL) { console.error(`  ✗ result ${i}: no imageURL`); continue; }
    const savePath = numberResults > 1
      ? outAbs.replace(/\.png$/i, `-${i + 1}.png`)
      : outAbs;
    await downloadImage(r.imageURL, savePath);
    console.log(`  → ${path.relative(projectRoot, savePath)}`);
    if (r.seed != null) console.log(`    seed: ${r.seed}`);
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exitCode = 1;
}
