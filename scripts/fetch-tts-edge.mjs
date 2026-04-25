// Microsoft Edge TTS — free, no API key, very high quality (Azure neural voices).
// Wraps the maintained `edge-tts-universal` npm package, which tracks Microsoft's
// occasional protocol changes (Dec 2025 they added a User-Agent requirement, etc.).
//
// Usage:
//   node scripts/fetch-tts-edge.mjs "Hello there" intro.mp3
//   node scripts/fetch-tts-edge.mjs "Bonjour" --voice=fr-FR-DeniseNeural fr.mp3
//   node scripts/fetch-tts-edge.mjs "Test" --voice=en-US-JennyNeural --rate=+10% --pitch=+5Hz
//   node scripts/fetch-tts-edge.mjs --list
//   node scripts/fetch-tts-edge.mjs --file=script.txt narration.mp3
//
// Outputs:
//   assets/voiceover/<name>.mp3
//   assets/voiceover/<name>.vtt   (word-level captions, free)

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { EdgeTTS, createVTT, createSRT } from "edge-tts-universal";
import { check, record } from "./lib/usage.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "voiceover");

const VOICES_POPULAR = {
  "en-US": [
    "en-US-JennyNeural", "en-US-AriaNeural", "en-US-GuyNeural",
    "en-US-DavisNeural", "en-US-AmberNeural", "en-US-ChristopherNeural",
    "en-US-EricNeural", "en-US-MichelleNeural", "en-US-RogerNeural",
    "en-US-SteffanNeural",
  ],
  "en-GB": [
    "en-GB-SoniaNeural", "en-GB-RyanNeural", "en-GB-LibbyNeural",
    "en-GB-AlfieNeural", "en-GB-ElliotNeural",
  ],
  "en-AU": ["en-AU-NatashaNeural", "en-AU-WilliamNeural"],
  "en-NZ": ["en-NZ-MollyNeural", "en-NZ-MitchellNeural"],
  "fr-FR": ["fr-FR-DeniseNeural", "fr-FR-HenriNeural"],
  "es-ES": ["es-ES-ElviraNeural", "es-ES-AlvaroNeural"],
  "de-DE": ["de-DE-KatjaNeural", "de-DE-ConradNeural"],
  "it-IT": ["it-IT-ElsaNeural", "it-IT-DiegoNeural"],
  "ja-JP": ["ja-JP-NanamiNeural", "ja-JP-KeitaNeural"],
  "zh-CN": ["zh-CN-XiaoxiaoNeural", "zh-CN-YunyangNeural"],
};

const args = process.argv.slice(2);
if (args.includes("--list")) {
  for (const [locale, voices] of Object.entries(VOICES_POPULAR)) {
    console.log(`\n${locale}:`);
    for (const v of voices) console.log(`  ${v}`);
  }
  console.log(`\n(Any *-Neural voice from Azure works — see Microsoft docs for the full list.)`);
  process.exit(0);
}

const opts = {
  text: null,
  name: null,
  voice: "en-US-JennyNeural",
  rate: "+0%",
  pitch: "+0Hz",
  volume: "+0%",
  file: null,
  srt: false,
};
const positional = [];
for (const a of args) {
  if (a.startsWith("--voice=")) opts.voice = a.slice("--voice=".length);
  else if (a.startsWith("--rate=")) opts.rate = a.slice("--rate=".length);
  else if (a.startsWith("--pitch=")) opts.pitch = a.slice("--pitch=".length);
  else if (a.startsWith("--volume=")) opts.volume = a.slice("--volume=".length);
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (a.startsWith("--file=")) opts.file = a.slice("--file=".length);
  else if (a === "--srt") opts.srt = true;
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
  node scripts/fetch-tts-edge.mjs "<text>" [name.mp3] [--voice=...] [--rate=+10%] [--pitch=+5Hz] [--srt]
  node scripts/fetch-tts-edge.mjs --file=script.txt narration.mp3
  node scripts/fetch-tts-edge.mjs --list

Default voice: en-US-JennyNeural
Captions written as .vtt next to the .mp3 (or .srt with --srt)`);
  process.exit(0);
}
if (!opts.name) opts.name = "edge.mp3";

// --- Quota check -------------------------------------------------------------
const status = check("tts-edge", 1);
if (!status.allowed) {
  console.error(`[tts] BLOCKED: ${status.message}`);
  process.exit(1);
}
if (status.warning) console.warn(`[tts] ${status.warning}`);
console.log(`[tts] Quota: ${status.message}`);

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);
const captionPath = outPath.replace(/\.mp3$/, opts.srt ? ".srt" : ".vtt");

console.log(`[tts] Voice: ${opts.voice}  rate=${opts.rate}  pitch=${opts.pitch}`);
console.log(`[tts] Text:  ${opts.text.length} chars`);
console.log(`[tts] Out:   ${outPath}`);

try {
  const tts = new EdgeTTS(opts.text, opts.voice, {
    rate: opts.rate,
    pitch: opts.pitch,
    volume: opts.volume,
  });
  const result = await tts.synthesize();

  // result.audio is a Blob in browsers, Buffer-like in Node. Coerce to Buffer.
  let audioBuf;
  if (Buffer.isBuffer(result.audio)) {
    audioBuf = result.audio;
  } else if (result.audio?.arrayBuffer) {
    audioBuf = Buffer.from(await result.audio.arrayBuffer());
  } else {
    audioBuf = Buffer.from(result.audio);
  }
  fs.writeFileSync(outPath, audioBuf);
  console.log(`[tts] Saved audio: ${outPath} (${(audioBuf.length / 1024).toFixed(1)} KB)`);

  // Captions (word-level boundaries)
  if (result.subtitle?.length) {
    const cap = opts.srt ? createSRT(result.subtitle) : createVTT(result.subtitle);
    fs.writeFileSync(captionPath, cap, "utf8");
    console.log(`[tts] Saved captions: ${captionPath} (${result.subtitle.length} words)`);
  }

  record("tts-edge", 1);
} catch (err) {
  console.error(`[tts] FAILED: ${err.message}`);
  if (err.stack) console.error(err.stack);
  process.exitCode = 1;
}
