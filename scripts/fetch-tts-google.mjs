// Google Translate TTS — free, no key, no signup. Decent quality, robotic-ish.
// Each request is limited to ~200 chars; this script chunks longer text and
// concatenates the resulting MP3 segments byte-wise (works because both ends
// have valid MPEG frames).
//
// Usage:
//   node scripts/fetch-tts-google.mjs "Hello, this is a test." narration.mp3
//   node scripts/fetch-tts-google.mjs "Bonjour le monde" --lang=fr fr.mp3
//   node scripts/fetch-tts-google.mjs --file=script.txt narration.mp3
//
// Output: assets/voiceover/<name>.mp3

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "voiceover");

const args = process.argv.slice(2);
const opts = { text: null, name: null, lang: "en", file: null };
const positional = [];
for (const a of args) {
  if (a.startsWith("--lang=")) opts.lang = a.slice("--lang=".length);
  else if (a.startsWith("--file=")) opts.file = a.slice("--file=".length);
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) positional.push(a);
}
if (opts.file) {
  opts.text = fs.readFileSync(opts.file, "utf8").trim();
  if (!opts.name) opts.name = positional[0];
} else {
  opts.text = positional[0];
  if (!opts.name) opts.name = positional[1];
}

if (!opts.text) {
  console.log(`Usage:
  node scripts/fetch-tts-google.mjs "<text>" [name.mp3] [--lang=en]
  node scripts/fetch-tts-google.mjs --file=script.txt narration.mp3 [--lang=en]

Languages: en, en-GB, en-AU, fr, de, es, it, pt, ja, ko, zh-CN, hi, ar, ru, etc.`);
  process.exit(0);
}
if (!opts.name) opts.name = "narration.mp3";

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);

// Cache lookup — gTTS is deterministic in (lang|text). Identical args ⇒
// skip the chunked download loop entirely.
const intentKey = cacheKey(`gtts|${opts.lang}|${opts.text}`);
{
  const hit = await cacheGet(intentKey);
  if (hit) {
    fs.copyFileSync(hit, outPath);
    const stats = fs.statSync(outPath);
    console.log(`[tts] cache hit ${intentKey.slice(0, 12)}…`);
    console.log(`[tts] Saved: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    process.exit(0);
  }
}

// --- Chunking ----------------------------------------------------------------
// gTTS limits each request to ~200 chars. Split on sentence boundaries first,
// then on word boundaries if a sentence is too long.
function chunkText(text, max = 180) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).trim().length <= max) {
      buf = (buf ? buf + " " : "") + s;
    } else {
      if (buf) chunks.push(buf);
      if (s.length <= max) {
        buf = s;
      } else {
        // Long sentence — split on words
        const words = s.split(/\s+/);
        let inner = "";
        for (const w of words) {
          if ((inner + " " + w).trim().length <= max) {
            inner = (inner ? inner + " " : "") + w;
          } else {
            if (inner) chunks.push(inner);
            inner = w;
          }
        }
        if (inner) buf = inner; else buf = "";
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

const chunks = chunkText(opts.text);
console.log(`[tts] ${chunks.length} chunk(s)`);

const buffers = [];
for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8` +
    `&tl=${encodeURIComponent(opts.lang)}` +
    `&client=tw-ob` +
    `&q=${encodeURIComponent(chunk)}` +
    `&total=${chunks.length}` +
    `&idx=${i}` +
    `&textlen=${chunk.length}`;

  process.stdout.write(`  [${i + 1}/${chunks.length}] (${chunk.length} chars) ... `);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    buffers.push(buf);
    console.log(`${(buf.length / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.log(`FAIL — ${err.message}`);
    process.exit(1);
  }
  // Small delay to avoid rate limiting
  if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 150));
}

const merged = Buffer.concat(buffers);
fs.writeFileSync(outPath, merged);
await cachePut(intentKey, merged, ".mp3");
console.log(`[tts] Saved: ${outPath} (${(merged.length / 1024).toFixed(1)} KB)`);
