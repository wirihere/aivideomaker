// Fetch a photo from the Unsplash API.
// Requires a free API key from https://unsplash.com/developers
//
// Set the key via env var:  UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxx
//   PowerShell:  $env:UNSPLASH_ACCESS_KEY="..."
//   bash:        export UNSPLASH_ACCESS_KEY="..."
//
// Usage:
//   node scripts/fetch-unsplash.mjs "mountain sunrise" hero.jpg
//   node scripts/fetch-unsplash.mjs "office team" --orientation=landscape --index=2
//
// Output: assets/photos/<name>.jpg

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "photos");

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) {
  console.error(`Missing UNSPLASH_ACCESS_KEY env var.

Get a free demo key (50 req/hr) at https://unsplash.com/developers — sign up,
create an app, copy the "Access Key" (NOT the secret).

Set it for the current shell:
  PowerShell:  $env:UNSPLASH_ACCESS_KEY="<your-key>"
  bash:        export UNSPLASH_ACCESS_KEY="<your-key>"`);
  process.exit(1);
}

const args = process.argv.slice(2);
const opts = { term: null, name: null, orientation: null, index: 0 };
const positional = [];
for (const a of args) {
  if (a.startsWith("--orientation=")) opts.orientation = a.slice("--orientation=".length);
  else if (a.startsWith("--index=")) opts.index = parseInt(a.slice("--index=".length), 10) || 0;
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) positional.push(a);
}
opts.term = positional[0];
if (!opts.name) opts.name = positional[1];

if (!opts.term) {
  console.log(`Usage:
  node scripts/fetch-unsplash.mjs "<query>" [name.jpg] [--orientation=landscape|portrait|squarish] [--index=N]`);
  process.exit(0);
}

if (!opts.name) {
  opts.name = opts.term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".jpg";
}

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);

// 1. Search
const params = new URLSearchParams({
  query: opts.term,
  per_page: "10",
  page: "1",
});
if (opts.orientation) params.set("orientation", opts.orientation);

const searchUrl = `https://api.unsplash.com/search/photos?${params.toString()}`;
console.log(`[fetch] Search: ${searchUrl}`);

// Cache lookup keyed on user intent (term+orientation+index). Same args twice
// ⇒ second run skips the API call AND the byte download.
const intentKey = cacheKey(`unsplash|${opts.term}|${opts.orientation || ""}|${opts.index}`);
const hit = await cacheGet(intentKey);
if (hit) {
  fs.copyFileSync(hit, outPath);
  const stats = fs.statSync(outPath);
  console.log(`[fetch] cache hit ${intentKey.slice(0, 12)}…`);
  console.log(`[fetch] Saved: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  process.exit(0);
}

try {
  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Client-ID ${KEY}`,
      "Accept-Version": "v1",
    },
  });
  if (!searchRes.ok) throw new Error(`Search HTTP ${searchRes.status}`);
  const json = await searchRes.json();
  if (!json.results || json.results.length === 0) {
    throw new Error(`No results for "${opts.term}"`);
  }
  const photo = json.results[Math.min(opts.index, json.results.length - 1)];
  console.log(`[fetch] Picked: ${photo.id}  by ${photo.user.name}  (${photo.width}x${photo.height})`);

  // Trigger download tracking (Unsplash policy requires this for production keys)
  if (photo.links?.download_location) {
    fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${KEY}` },
    }).catch(() => {}); // fire-and-forget
  }

  // 2. Download the largest "raw" file
  const downloadUrl = photo.urls.raw + "&w=2400&q=85&fm=jpg";
  console.log(`[fetch] Image: ${downloadUrl}`);

  const imgRes = await fetch(downloadUrl);
  if (!imgRes.ok) throw new Error(`Image HTTP ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  await cachePut(intentKey, buf, path.extname(outPath) || ".jpg");

  // Save attribution sidecar
  const credit = `Photo by ${photo.user.name} (https://unsplash.com/@${photo.user.username}) on Unsplash`;
  fs.writeFileSync(outPath + ".credit.txt", credit + "\n" + photo.links.html + "\n");

  console.log(`[fetch] Saved: ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
  console.log(`[fetch] Credit: ${credit}`);
} catch (err) {
  console.error(`[fetch] FAILED: ${err.message}`);
  process.exitCode = 1;
}
