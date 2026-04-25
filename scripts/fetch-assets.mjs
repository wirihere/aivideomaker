// Parallel manifest-based asset fetcher.
// Reads a JSON manifest of photos/videos/music/tts and fires every fetch concurrently.
// One browser process at a time for Pixabay (rate-limit friendliness), but all four
// media types run in parallel since they're different scripts.
//
// Usage:
//   node scripts/fetch-assets.mjs plans/<slug>/manifest.json
//
// Manifest shape (all fields optional — include only what you need):
//
//   {
//     "photos":   [ { "query": "worn paper letter", "name": "decline-letter.jpg", "orientation": "vertical" } ],
//     "videos":   [ { "query": "rain on window",    "name": "rain.mp4", "index": 0 } ],
//     "music":    [ { "query": "gentle piano",      "name": "bed.mp3" } ],
//     "tts":      [ { "text": "...",                "name": "narration.mp3", "voice": "en-NZ-MollyNeural", "rate": "-10%" } ],
//     "tts_files":[ { "file": "plans/x/script.txt", "name": "narration.mp3", "voice": "en-NZ-MollyNeural", "rate": "-10%" } ]
//   }
//
// Behaviour:
//   - Photos/videos/music fire in parallel (each opens its own headless Chromium).
//   - TTS runs serially (edge-tts-universal is already fast; no benefit parallelising).
//   - Skips items whose output file already exists unless --force is passed.
//   - Reports per-item wall-time and a summary at the end.

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const force = args.includes("--force");
const manifestPath = args.find((a) => !a.startsWith("--"));

if (!manifestPath) {
  console.log(`Usage:
  node scripts/fetch-assets.mjs <manifest.json> [--force]

Manifest example:
  {
    "photos":   [{ "query": "worn paper", "name": "letter.jpg" }],
    "videos":   [{ "query": "rain window", "name": "rain.mp4" }],
    "music":    [{ "query": "gentle piano", "name": "bed.mp3" }],
    "tts_files":[{ "file": "plans/x/script.txt", "name": "narration.mp3", "voice": "en-NZ-MollyNeural", "rate": "-10%" }]
  }`);
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const log = (tag, msg) => console.log(`[fetch-assets][${tag}] ${msg}`);

// --- helpers -----------------------------------------------------------------

function run(cmd, cmdArgs, tag) {
  const start = Date.now();
  return new Promise((resolve) => {
    const resolvedCmd = cmd === "node" ? process.execPath : cmd;
    const p = spawn(resolvedCmd, cmdArgs, { cwd: projectRoot });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => { out += d.toString(); });
    p.stderr.on("data", (d) => { err += d.toString(); });
    p.on("close", (code) => {
      const dur = ((Date.now() - start) / 1000).toFixed(1);
      if (code === 0) {
        log(tag, `OK (${dur}s)`);
      } else {
        log(tag, `FAIL code=${code} (${dur}s)\n${err.split("\n").slice(-5).join("\n")}`);
      }
      resolve({ code, out, err, dur: parseFloat(dur) });
    });
  });
}

function exists(relPath) {
  return fs.existsSync(path.join(projectRoot, relPath));
}

// --- dispatchers -------------------------------------------------------------

async function fetchPhoto(item) {
  const out = `assets/photos/${item.name}`;
  const tag = `photo:${item.name}`;
  if (!force && exists(out)) { log(tag, `skip (exists)`); return { tag, skipped: true }; }
  const a = ["scripts/fetch-pixabay-photo.mjs", item.query, item.name];
  if (item.orientation) a.push(`--orientation=${item.orientation}`);
  if (item.index != null) a.push(`--index=${item.index}`);
  return await run("node", a, tag);
}

async function fetchVideo(item) {
  const out = `assets/videos/${item.name}`;
  const tag = `video:${item.name}`;
  if (!force && exists(out)) { log(tag, `skip (exists)`); return { tag, skipped: true }; }
  const a = ["scripts/fetch-pixabay-video.mjs", item.query, item.name];
  if (item.index != null) a.push(`--index=${item.index}`);
  return await run("node", a, tag);
}

async function fetchMusic(item) {
  const out = `assets/music/${item.name}`;
  const tag = `music:${item.name}`;
  if (!force && exists(out)) { log(tag, `skip (exists)`); return { tag, skipped: true }; }
  return await run("node", ["scripts/fetch-pixabay-music.mjs", item.query, item.name], tag);
}

async function fetchTTS(item) {
  const out = `assets/voiceover/${item.name}`;
  const tag = `tts:${item.name}`;
  if (!force && exists(out)) { log(tag, `skip (exists)`); return { tag, skipped: true }; }
  const a = ["scripts/fetch-tts-edge.mjs"];
  if (item.file) a.push(`--file=${item.file}`);
  if (item.voice) a.push(`--voice=${item.voice}`);
  if (item.rate) a.push(`--rate=${item.rate}`);
  if (item.pitch) a.push(`--pitch=${item.pitch}`);
  if (item.text && !item.file) a.push(item.text);
  a.push(item.name);
  return await run("node", a, tag);
}

// --- run ---------------------------------------------------------------------

const t0 = Date.now();

// Photos + videos + music can all run in parallel — each spawns its own Chromium.
const parallel = [];
for (const item of manifest.photos || []) parallel.push(fetchPhoto(item));
for (const item of manifest.videos || []) parallel.push(fetchVideo(item));
for (const item of manifest.music  || []) parallel.push(fetchMusic(item));

// TTS runs in parallel too (no browser involved) — batch with the rest.
for (const item of manifest.tts        || []) parallel.push(fetchTTS(item));
for (const item of manifest.tts_files  || []) parallel.push(fetchTTS(item));

const results = await Promise.all(parallel);
const wall = ((Date.now() - t0) / 1000).toFixed(1);

const ok = results.filter((r) => r.code === 0 || r.skipped).length;
const skipped = results.filter((r) => r.skipped).length;
const failed = results.filter((r) => r.code && r.code !== 0).length;

console.log(`\n[fetch-assets] done in ${wall}s — ${ok} ok (${skipped} skipped), ${failed} failed`);
if (failed > 0) process.exitCode = 1;
