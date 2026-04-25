// ElevenLabs TTS — premium quality, voice cloning, emotion control.
// Free tier: 10,000 characters/month, 3 custom voices.
//
// Get a key at https://elevenlabs.io — sign up, then Profile → API Keys.
// Set it: ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxx
//
// Usage:
//   node scripts/fetch-tts-elevenlabs.mjs "Welcome aboard." intro.mp3
//   node scripts/fetch-tts-elevenlabs.mjs "Hi" --voice=Adam --model=eleven_turbo_v2_5
//   node scripts/fetch-tts-elevenlabs.mjs --list-voices
//
// Output: assets/voiceover/<name>.mp3

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "voiceover");

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error(`Missing ELEVENLABS_API_KEY env var.

Get a free key at https://elevenlabs.io → Profile → API Keys.
Free tier: 10,000 chars/month, 3 custom voices.

Set it:
  PowerShell:  $env:ELEVENLABS_API_KEY="<your-key>"
  bash:        export ELEVENLABS_API_KEY="<your-key>"`);
  process.exit(1);
}

// Stock voice IDs that ship with every account (no need to clone).
const STOCK_VOICES = {
  Adam:     "pNInz6obpgDQGcFmaJgB", // deep narrator male
  Antoni:   "ErXwobaYiN019PkySvjV", // well-rounded male
  Arnold:   "VR6AewLTigWG4xSOukaG", // crisp male
  Bella:    "EXAVITQu4vr4xnSDxMaL", // soft female
  Domi:     "AZnzlk1XvdvUeBnXmlld", // strong female
  Elli:     "MF3mGyEYCl7XYWbV9V6O", // emotional female
  Josh:     "TxGEqnHWrfWFTfGW9XjX", // young male
  Rachel:   "21m00Tcm4TlvDq8ikWAM", // calm female
  Sam:      "yoZ06aMxZJJ28mfd3POQ", // raspy male
  Charlie:  "IKne3meq5aSn9XLyUdCD", // hyped male
  Dorothy:  "ThT5KcBeYPX3keUQqHPh", // pleasant british female
  Fin:      "D38z5RcWu1voky8WS1ja", // sailor male
  Glinda:   "z9fAnlkpzviPz146aGWa", // witch female
  Mimi:     "zrHiDhphv9ZnVXBqCLjz", // childlike female
};

const args = process.argv.slice(2);

if (args.includes("--list-voices")) {
  console.log("Stock voices (always available):");
  for (const [name, id] of Object.entries(STOCK_VOICES)) {
    console.log(`  ${name.padEnd(10)} ${id}`);
  }
  console.log(`\nFor your custom/cloned voices, fetch from /v1/voices.`);
  process.exit(0);
}

const opts = {
  text: null,
  name: null,
  voice: "Rachel",
  model: "eleven_multilingual_v2", // good default; eleven_turbo_v2_5 is faster
  stability: 0.5,
  similarity: 0.75,
};
const positional = [];
for (const a of args) {
  if (a.startsWith("--voice=")) opts.voice = a.slice("--voice=".length);
  else if (a.startsWith("--model=")) opts.model = a.slice("--model=".length);
  else if (a.startsWith("--stability=")) opts.stability = parseFloat(a.slice("--stability=".length));
  else if (a.startsWith("--similarity=")) opts.similarity = parseFloat(a.slice("--similarity=".length));
  else if (a.startsWith("--name=")) opts.name = a.slice("--name=".length);
  else if (!a.startsWith("--")) positional.push(a);
}
opts.text = positional[0];
if (!opts.name) opts.name = positional[1];

if (!opts.text) {
  console.log(`Usage:
  node scripts/fetch-tts-elevenlabs.mjs "<text>" [name.mp3] [--voice=Rachel] [--model=eleven_multilingual_v2]
  node scripts/fetch-tts-elevenlabs.mjs --list-voices`);
  process.exit(0);
}
if (!opts.name) opts.name = `${opts.voice.toLowerCase()}.mp3`;

// Resolve voice name → ID, or pass through if already an ID
const voiceId = STOCK_VOICES[opts.voice] || opts.voice;

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, opts.name);

const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

console.log(`[tts] Voice: ${opts.voice} (${voiceId})`);
console.log(`[tts] Model: ${opts.model}`);
console.log(`[tts] Out:   ${outPath}`);

try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: opts.text,
      model_id: opts.model,
      voice_settings: {
        stability: opts.stability,
        similarity_boost: opts.similarity,
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log(`[tts] Saved: ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
  console.log(`[tts] Used ${opts.text.length} chars of your monthly quota.`);
} catch (err) {
  console.error(`[tts] FAILED: ${err.message}`);
  process.exitCode = 1;
}
