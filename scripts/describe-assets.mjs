// Describe every image in a folder using a Runware vision model, and write a
// machine-readable catalogue (asset-catalogue.json) plus a human-readable
// rendering (asset-catalogue.md) into the same folder.
//
// This is the reuse of the judge() primitive for CONTENT DISCOVERY, not QA.
// The same cheap vision call that scores a still can also tell you what an
// image depicts, so a fresh session (or a story-writing prompt) can reason
// about the image set without a human re-explaining each file.
//
// Idempotent: re-running overwrites both output files. Safe to re-run when
// new images land in the folder — everything gets re-described.
//
// Usage:
//   node scripts/describe-assets.mjs --dir=videos/binsparkle/assets
//   npm run describe:assets -- --dir=videos/binsparkle/assets
//
// Options:
//   --dir=<path>     folder of images to describe (required)
//   --model=<id>     Runware vision model id (default: openai:gpt@5-mini, ~$0.0004/look)
//   --max-edge=<n>   downscale long edge before sending (default 1280)
//   --out=<path>     base path for outputs, no extension (default: <dir>/asset-catalogue)
//   --name=<text>    header title in the markdown (default: derived from dir name)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { judge } from "./lib/runware-vision.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const dir = typeof flags.dir === "string" ? flags.dir : null;
if (!dir) {
  console.error(`describe-assets — describe every image in a folder via Runware vision

Usage:
  node scripts/describe-assets.mjs --dir=<folder>

Options:
  --dir=<path>     folder of images (required)
  --model=<id>     default: openai:gpt@5-mini (~\$0.0004/look). Stronger: openai:gpt@5, anthropic:claude@sonnet-4-6
  --max-edge=<n>   downscale long edge (default 1280)
  --out=<path>     output base path, no extension (default: <dir>/asset-catalogue)
  --name=<text>    header title (default: derived from folder name)`);
  process.exit(2);
}

const absDir = path.resolve(dir);
if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
  console.error(`✗ not a directory: ${dir}`);
  process.exit(2);
}

const model = typeof flags.model === "string" ? flags.model : "openai:gpt@5-mini";
const maxEdge = parseInt(String(flags["max-edge"]), 10) || 1280;
const outBase = typeof flags.out === "string" ? path.resolve(flags.out) : path.join(absDir, "asset-catalogue");
const title = typeof flags.name === "string" ? flags.name : `${path.basename(absDir)} images`;

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
// Skip files that are clearly not content (previews, thumbnails, already-rendered catalogue shots).
const SKIP = /\.(preview|thumb|small|1x1)\./i;

const images = fs.readdirSync(absDir)
  .filter(f => IMAGE_EXT.has(path.extname(f).toLowerCase()))
  .filter(f => !SKIP.test(f))
  .sort()
  .map(f => path.join(absDir, f));

if (!images.length) {
  console.error(`✗ no images found in ${path.relative(projectRoot, absDir)}`);
  process.exit(2);
}

// The prompt asks for strict JSON. Small VLMs sometimes wrap output in prose or
// code fences, so extractJson() below leniently pulls the {...} block out.
const PROMPT = `You are cataloguing a brand image so a content team can reuse it without re-examining each file.

Look at this image and return ONLY a JSON object with EXACTLY these fields, nothing else:

{
  "subject": "what the image shows, one short phrase (e.g. 'a dirty wheelie bin on a suburban driveway, lid open')",
  "mood": "the feeling or tone in one short phrase (e.g. 'grim, unflattering, harsh light')",
  "dominant_colours": ["#hex1", "#hex2", "#hex3"],
  "text_in_frame": "any words legible in the image itself, verbatim; or 'none' if the image has no text",
  "people": "describe any people visible (count, approximate age, demeanour, clothing); or 'none'",
  "alt_text": "a single sentence describing the image for accessibility, 120 chars or fewer",
  "good_for": ["carousel slide", "story background", "video beat", "thumbnail", "hero image"]
}

Rules:
- "good_for" must list only from: carousel slide, story background, video beat, thumbnail, hero image, end card, transition texture.
- Return the JSON ONLY. No prose, no code fence, no commentary.`;

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const src = fenced ? fenced[1] : text;
  const start = src.indexOf("{");
  const end = src.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  try { return JSON.parse(src.slice(start, end + 1)); } catch { return null; }
}

console.log(`▶ describe-assets: ${images.length} image(s) in ${path.relative(projectRoot, absDir)}`);
console.log(`  model: ${model}  ·  max-edge: ${maxEdge}px`);
console.log("");

const entries = [];
let totalCost = 0;

for (const img of images) {
  const rel = path.relative(projectRoot, img);
  process.stdout.write(`  ${path.basename(img)} … `);
  let result, parsed;
  try {
    result = await judge({ imagePath: img, prompt: PROMPT, model, maxEdge });
    parsed = extractJson(result.text);
  } catch (err) {
    console.log(`✗ ${err.message}`);
    entries.push({ file: path.basename(img), path: rel, error: err.message });
    continue;
  }
  if (result.cost != null) totalCost += result.cost;
  if (!parsed) {
    console.log(`⚠ could not parse JSON (raw saved)`);
    entries.push({ file: path.basename(img), path: rel, raw: result.text });
    continue;
  }
  console.log(`✓ ${parsed.subject?.slice(0, 60) ?? "(no subject)"}`);
  entries.push({
    file: path.basename(img),
    path: rel.replace(/\\/g, "/"),
    ...parsed,
  });
}

const generatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
const catalogue = {
  generated_at: generatedAt,
  model,
  dir: path.relative(projectRoot, absDir).replace(/\\/g, "/"),
  image_count: images.length,
  images: entries,
};

fs.writeFileSync(`${outBase}.json`, JSON.stringify(catalogue, null, 2));
fs.writeFileSync(`${outBase}.md`, renderMarkdown(catalogue, title));

console.log("");
console.log(`✓ ${entries.length}/${images.length} described · total cost $${totalCost.toFixed(6)}`);
console.log(`  ${path.relative(projectRoot, outBase)}.json`);
console.log(`  ${path.relative(projectRoot, outBase)}.md`);

function renderMarkdown(cat, heading) {
  const lines = [];
  lines.push(`# ${heading}`);
  lines.push("");
  lines.push(`> Vision-described asset catalogue. Generated **${cat.generated_at}** by \`${cat.model}\` on ${cat.image_count} image(s) in \`${cat.dir}\`. Re-run \`npm run describe:assets -- --dir=${cat.dir}\` to refresh.`);
  lines.push("");
  lines.push("| file | subject | mood | colours | text in frame | people | good for |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const e of cat.images) {
    if (e.error || e.raw) {
      lines.push(`| \`${e.file}\` | _${e.error ? "error: " + e.error.slice(0, 60) : "unparsed response"}_ | | | | | |`);
      continue;
    }
    const colours = Array.isArray(e.dominant_colours) ? e.dominant_colours.map(c => `\`${c}\``).join(" ") : "";
    const goodFor = Array.isArray(e.good_for) ? e.good_for.join(", ") : "";
    const text = (e.text_in_frame ?? "").replace(/\|/g, "/").slice(0, 50);
    const people = (e.people ?? "").replace(/\|/g, "/").slice(0, 50);
    const mood = (e.mood ?? "").replace(/\|/g, "/").slice(0, 50);
    const subject = (e.subject ?? "").replace(/\|/g, "/").slice(0, 80);
    lines.push(`| \`${e.file}\` | ${subject} | ${mood} | ${colours} | ${text} | ${people} | ${goodFor} |`);
  }
  lines.push("");
  lines.push("## Alt text (for accessibility / social)");
  lines.push("");
  for (const e of cat.images) {
    if (e.alt_text) lines.push(`- **\`${e.file}\`** — ${e.alt_text}`);
  }
  lines.push("");
  return lines.join("\n");
}
