// StreamElements TTS — free, no key. Polly-style voices (Brian, Joanna, etc.)
// Used by Twitch streamers, surprisingly natural for short narration / character lines.
//
// Usage:
//   node scripts/fetch-tts-streamelements.mjs "Welcome to the show!" intro.mp3
//   node scripts/fetch-tts-streamelements.mjs "Hi there" --voice=Joanna joanna.mp3
//   node scripts/fetch-tts-streamelements.mjs --list
//
// Output: assets/voiceover/<name>.mp3

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "voiceover");

// Voices that work well via the StreamElements endpoint.
// Polly voices (English): Brian (UK), Joanna (US f), Matthew (US m),
//   Amy (UK f), Salli (US f), Justin (US child m), Ivy (US child f),
//   Joey (US m), Kendra (US f), Kimberly (US f), Nicole (AU f),
//   Russell (AU m), Geraint (Welsh m).
const VOICES = [
  "Brian", "Joanna", "Matthew", "Amy", "Salli", "Justin",
  "Ivy", "Joey", "Kendra", "Kimberly", "Nicole", "Russell", "Geraint",
];

const args = process.argv.slice(2);
if (args.includes("--list")) {
  console.log("Voices:");
  for (const v of VOICES) console.log(`  ${v}`);
  process.exit(0);
}

const opts = { text: null, name: null, voice: "Brian" };
const positional = [];
for (const a of args) {
  if (a.startsWith("--voice=")) opts.voice = a.slice("--voice=".length);
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) positional.push(a);
}
opts.text = positional[0];
if (!opts.name) opts.name = positional[1];

if (!opts.text) {
  console.log(`Usage:
  node scripts/fetch-tts-streamelements.mjs "<text>" [name.mp3] [--voice=Brian]
  node scripts/fetch-tts-streamelements.mjs --list`);
  process.exit(0);
}
if (!opts.name) opts.name = `${opts.voice.toLowerCase()}.mp3`;

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);

const url =
  `https://api.streamelements.com/kappa/v2/speech` +
  `?voice=${encodeURIComponent(opts.voice)}` +
  `&text=${encodeURIComponent(opts.text)}`;

console.log(`[tts] Voice: ${opts.voice}`);
console.log(`[tts] Out:   ${outPath}`);

// Cache lookup — StreamElements TTS is deterministic in (voice|text).
const intentKey = cacheKey(`stream|${opts.voice}|${opts.text}`);
const hit = await cacheGet(intentKey);
if (hit) {
  fs.copyFileSync(hit, outPath);
  const stats = fs.statSync(outPath);
  console.log(`[tts] cache hit ${intentKey.slice(0, 12)}…`);
  console.log(`[tts] Saved: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  process.exit(0);
}

try {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  await cachePut(intentKey, buf, ".mp3");
  console.log(`[tts] Saved: ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error(`[tts] FAILED: ${err.message}`);
  process.exitCode = 1;
}
