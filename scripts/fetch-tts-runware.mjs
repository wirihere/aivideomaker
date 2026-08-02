// Runware TTS — cheapest tier that works on the account.
//
// Defaults to xai:tts@0 ($0.015/1,000 chars — cheapest verified), voice "eve".
// Switch models/voices via flags. All audio models use the `audioInference` task;
// this CLI knows the xAI / Gemini / Qwen3 / Inworld param shapes (see lib/runware-audio.mjs).
//
// Cost guard: every call passes through the shared RUNWARE_DAILY_CAP guard.
//
// Usage:
//   node scripts/fetch-tts-runware.mjs --file=script.txt narration.mp3
//   node scripts/fetch-tts-runware.mjs "Hello there" clip.mp3
//   node scripts/fetch-tts-runware.mjs "Kia ora" clip.mp3 --voice=eve --model=xai:tts@0 --language=en
//   node scripts/fetch-tts-runware.mjs "Hi" clip.mp3 --model=inworld:tts@1.5-mini --voice=Loretta --language=en --speed=1.0
//   node scripts/fetch-tts-runware.mjs "Warm male voice" clip.mp3 --model=alibaba:qwen@3-tts-1.7b-voicedesign --prompt="A warm, cheerful male voice with moderate pace"

import fs from "fs";
import path from "path";
import { audioInference, downloadAudio, resolveOut } from "./lib/runware-audio.mjs";

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const positional = args.filter(a => !a.startsWith("--"));

const text = flags.file ? fs.readFileSync(flags.file, "utf8") : (positional[0] || "");
if (!text.trim()) { console.error("No text. Pass a string or --file=<path>."); process.exit(1); }
const outName = flags.file ? (positional[0] || "runware-tts.mp3") : (positional[1] || flags.out || "runware-tts.mp3");
const model = flags.model || "xai:tts@0";
const voice = flags.voice || "eve";
const language = flags.language || "en";
const speed = flags.speed ? parseFloat(flags.speed) : undefined;
const temperature = flags.temperature ? parseFloat(flags.temperature) : undefined;
const promptStyle = typeof flags.prompt === "string" ? flags.prompt : null;
const outputFormat = flags.format || "MP3";

// Build model-specific `params` shape. Each TTS family on Runware nests fields
// differently — see docs/runware-models.md. Keep this literal so the per-model
// rules (mutually-exclusive fields, required vs optional) stay readable.
function buildParams(modelId) {
  const speech = { text, voice };
  if (language) speech.language = language;
  if (speed != null && Number.isFinite(speed)) speech.speed = speed;
  const settings = {};
  if (temperature != null && Number.isFinite(temperature)) settings.temperature = temperature;

  // VoiceDesign requires positivePrompt (the voice description); positivePrompt is
  // optional on CustomVoice and ignored on the others.
  const params = { speech, ...(Object.keys(settings).length ? { settings } : {}) };
  if (promptStyle && modelId.includes("voicedesign")) params.positivePrompt = promptStyle;
  else if (promptStyle && modelId.includes("customvoice")) params.positivePrompt = promptStyle;
  return params;
}

const params = buildParams(model);
console.log(`[runware-tts] model=${model} voice=${voice} language=${language}`);
console.log(`[runware-tts] text: ${text.length} chars`);
console.log(`[runware-tts] out:  ${outName}`);

try {
  const r = await audioInference({ model, params, opts: { outputFormat } });
  if (!r.audioURL) { console.error(`[runware-tts] No audioURL in response. Full response:`, r); process.exit(1); }
  const out = resolveOut(path.join("assets/voiceover", outName.replace(/[/\\]/g, "_")));
  const d = await downloadAudio(r.audioURL, out);
  console.log(`[runware-tts] Saved: ${path.relative(process.cwd(), d.path)} (${(d.bytes / 1024).toFixed(1)} KB) cost=$${(r.cost ?? 0).toFixed(5)} (today $${r.today.spend.toFixed(4)}/${r.today.cap})`);
} catch (e) {
  console.error(`[runware-tts] FAILED: ${e.message}`);
  process.exit(1);
}
