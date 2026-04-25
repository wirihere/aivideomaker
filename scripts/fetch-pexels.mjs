// Fetch a photo OR video from the Pexels API.
// Requires a free API key from https://www.pexels.com/api/
//
// Set the key:  PEXELS_API_KEY=xxxxxxxxxxxxxxxxxxxxxx
//   PowerShell:  $env:PEXELS_API_KEY="..."
//   bash:        export PEXELS_API_KEY="..."
//
// Usage:
//   node scripts/fetch-pexels.mjs photo "office workspace" desk.jpg
//   node scripts/fetch-pexels.mjs video "city traffic" traffic.mp4
//   node scripts/fetch-pexels.mjs photo "team meeting" --orientation=landscape --index=2
//
// Output:
//   assets/photos/<name>.jpg   (photo)
//   assets/videos/<name>.mp4   (video)

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error(`Missing PEXELS_API_KEY env var.

Get a free key at https://www.pexels.com/api/ — sign up, then check your dashboard.
Free tier: 200 requests/hour, 20,000/month, no attribution required.

Set it:
  PowerShell:  $env:PEXELS_API_KEY="<your-key>"
  bash:        export PEXELS_API_KEY="<your-key>"`);
  process.exit(1);
}

const args = process.argv.slice(2);
const kind = args[0];
if (!["photo", "video"].includes(kind)) {
  console.log(`Usage:
  node scripts/fetch-pexels.mjs photo "<query>" [name.jpg] [--orientation=landscape|portrait|square] [--index=N]
  node scripts/fetch-pexels.mjs video "<query>" [name.mp4] [--orientation=landscape|portrait|square] [--index=N]`);
  process.exit(0);
}

const opts = { term: null, name: null, orientation: null, index: 0 };
const positional = [];
for (const a of args.slice(1)) {
  if (a.startsWith("--orientation=")) opts.orientation = a.slice("--orientation=".length);
  else if (a.startsWith("--index=")) opts.index = parseInt(a.slice("--index=".length), 10) || 0;
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) positional.push(a);
}
opts.term = positional[0];
if (!opts.name) opts.name = positional[1];

if (!opts.term) {
  console.log(`Provide a query, e.g.:
  node scripts/fetch-pexels.mjs ${kind} "<query>"`);
  process.exit(0);
}

if (!opts.name) {
  const ext = kind === "video" ? ".mp4" : ".jpg";
  opts.name = opts.term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ext;
}

const outDir = path.join(projectRoot, "assets", kind === "video" ? "videos" : "photos");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);

const params = new URLSearchParams({
  query: opts.term,
  per_page: "15",
  page: "1",
});
if (opts.orientation) params.set("orientation", opts.orientation);

const apiUrl =
  kind === "video"
    ? `https://api.pexels.com/videos/search?${params.toString()}`
    : `https://api.pexels.com/v1/search?${params.toString()}`;

console.log(`[fetch] Search: ${apiUrl}`);
console.log(`[fetch] Out:    ${outPath}`);

// Cache lookup keyed on user intent (kind+term+orientation+index). Same args
// twice ⇒ second run skips the API call AND the byte download.
const intentKey = cacheKey(`pexels|${kind}|${opts.term}|${opts.orientation || ""}|${opts.index}`);
const hit = await cacheGet(intentKey);
if (hit) {
  fs.copyFileSync(hit, outPath);
  const stats = fs.statSync(outPath);
  console.log(`[fetch] cache hit ${intentKey.slice(0, 12)}…`);
  console.log(`[fetch] Saved: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  process.exit(0);
}

try {
  const res = await fetch(apiUrl, {
    headers: { Authorization: KEY },
  });
  if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
  const json = await res.json();

  if (kind === "photo") {
    if (!json.photos || json.photos.length === 0) throw new Error(`No photos for "${opts.term}"`);
    const item = json.photos[Math.min(opts.index, json.photos.length - 1)];
    console.log(`[fetch] Picked: id=${item.id}  by ${item.photographer}  (${item.width}x${item.height})`);
    const downloadUrl = item.src.original;

    const imgRes = await fetch(downloadUrl);
    if (!imgRes.ok) throw new Error(`Image HTTP ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    await cachePut(intentKey, buf, path.extname(outPath) || ".jpg");

    const credit = `Photo by ${item.photographer} on Pexels (${item.url})`;
    fs.writeFileSync(outPath + ".credit.txt", credit + "\n");

    console.log(`[fetch] Saved: ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
    console.log(`[fetch] Credit: ${credit}`);
  } else {
    if (!json.videos || json.videos.length === 0) throw new Error(`No videos for "${opts.term}"`);
    const item = json.videos[Math.min(opts.index, json.videos.length - 1)];

    // Pick the highest quality mp4 file
    const mp4s = item.video_files.filter((f) => f.file_type === "video/mp4");
    if (mp4s.length === 0) throw new Error("No mp4 file in result");
    mp4s.sort((a, b) => (b.width || 0) - (a.width || 0));
    const file = mp4s[0];
    console.log(`[fetch] Picked: id=${item.id}  by ${item.user.name}  (${file.width}x${file.height}, ${file.quality || "?"})`);

    const vidRes = await fetch(file.link);
    if (!vidRes.ok) throw new Error(`Video HTTP ${vidRes.status}`);
    const buf = Buffer.from(await vidRes.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    await cachePut(intentKey, buf, path.extname(outPath) || ".mp4");

    const credit = `Video by ${item.user.name} on Pexels (${item.url})`;
    fs.writeFileSync(outPath + ".credit.txt", credit + "\n");

    console.log(`[fetch] Saved: ${outPath} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`[fetch] Credit: ${credit}`);
  }
} catch (err) {
  console.error(`[fetch] FAILED: ${err.message}`);
  process.exitCode = 1;
}
