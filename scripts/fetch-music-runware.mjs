// Runware music-bed generation.
//
// Defaults to runware:ace-step@v1.5-turbo ($0.0001/sec — cheapest verified).
// ACE-Step exposes real bpm/key/time-signature params (most other music models
// on Runware are prompt-only for those). Output is instrumental by default
// (vocalLanguage="unknown").
//
// Cost guard: every call passes through the shared RUNWARE_DAILY_CAP guard.
//
// Usage:
//   node scripts/fetch-music-runware.mjs binsparkle-bed.mp3 --prompt="warm acoustic folk, gentle guitar, soft pad, optimistic" --duration=30 --bpm=95 --key="C major"
//   node scripts/fetch-music-runware.mjs ambient-pad.mp3 --prompt="ambient atmospheric pad" --duration=60 --model=runware:ace-step@v1.5-base
//   node scripts/fetch-music-runware.mjs song.mp3 --prompt="upbeat pop" --lyrics="..." --model=minimax:music@2.6

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

const outName = positional[0] || flags.out || "runware-music.mp3";
const model = flags.model || "runware:ace-step@v1.5-turbo";
const positivePrompt = flags.prompt;
const negativePrompt = typeof flags["negative-prompt"] === "string" ? flags["negative-prompt"] : undefined;
const lyrics = typeof flags.lyrics === "string" ? flags.lyrics : undefined;
const duration = flags.duration ? parseFloat(flags.duration) : 30;
const bpm = flags.bpm ? parseInt(flags.bpm, 10) : undefined;
const keyScale = flags.key || undefined;
const timeSignature = flags["time-signature"] ? parseInt(flags["time-signature"], 10) : undefined;
const vocalLanguage = flags["vocal-language"] || "unknown";   // "unknown" = instrumental
const seed = flags.seed ? parseInt(flags.seed, 10) : undefined;
const steps = flags.steps ? parseInt(flags.steps, 10) : undefined;
const outputFormat = flags.format || "MP3";

if (!positivePrompt) {
  console.error("No --prompt. Describe the music you want, e.g. --prompt=\"warm acoustic folk, gentle guitar, optimistic\"");
  process.exit(1);
}
if (duration < 30 || duration > 300) {
  console.error(`Duration ${duration}s out of range — ACE-Step supports 30–300 sec.`);
  process.exit(1);
}

// Build the ACE-Step param shape (XL Turbo/Base/SFT/Turbo/Base all share this).
// MiniMax Music has a different shape — branch when its model id is used.
function buildParams(modelId) {
  if (modelId.startsWith("minimax:music@")) {
    const p = { positivePrompt };
    if (negativePrompt) p.negativePrompt = negativePrompt;
    if (seed != null) p.seed = seed;
    const settings = {};
    if (lyrics) settings.lyrics = lyrics;
    if (vocalLanguage === "unknown") settings.instrumental = true;
    if (Object.keys(settings).length) p.settings = settings;
    return p;
  }
  // ACE-Step family
  const p = { positivePrompt, duration };
  if (negativePrompt) p.negativePrompt = negativePrompt;
  if (seed != null) p.seed = seed;
  if (steps != null) p.steps = steps;
  const settings = { vocalLanguage };
  if (bpm != null) settings.bpm = bpm;
  if (keyScale) settings.keyScale = keyScale;
  if (timeSignature != null) settings.timeSignature = timeSignature;
  if (lyrics) settings.lyrics = lyrics;
  p.settings = settings;
  return p;
}

const params = buildParams(model);
console.log(`[runware-music] model=${model} duration=${duration}s vocalLanguage=${vocalLanguage}`);
console.log(`[runware-music] prompt: ${positivePrompt}`);
if (bpm || keyScale) console.log(`[runware-music] bpm=${bpm ?? "-"} key=${keyScale ?? "-"}`);
console.log(`[runware-music] out: ${outName}`);

try {
  const r = await audioInference({ model, params, opts: { outputFormat } });
  if (!r.audioURL) { console.error(`[runware-music] No audioURL in response. Full response:`, r); process.exit(1); }
  const out = resolveOut(path.join("assets/music", outName.replace(/[/\\]/g, "_")));
  const d = await downloadAudio(r.audioURL, out);
  console.log(`[runware-music] Saved: ${path.relative(process.cwd(), d.path)} (${(d.bytes / 1024).toFixed(1)} KB) cost=$${(r.cost ?? 0).toFixed(5)} (today $${r.today.spend.toFixed(4)}/${r.today.cap})`);
  // Persist the generation params alongside the file so the bed is reproducible.
  const sidecar = out.replace(/\.[^.]+$/, ".gen.json");
  fs.writeFileSync(sidecar, JSON.stringify({ model, params, seed: r.seed, cost: r.cost, generatedAt: new Date().toISOString() }, null, 2));
  console.log(`[runware-music] Sidecar: ${path.relative(process.cwd(), sidecar)}`);
} catch (e) {
  console.error(`[runware-music] FAILED: ${e.message}`);
  process.exit(1);
}
