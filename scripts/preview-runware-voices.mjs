// Runware voice audition — synthesise one short sample per (model, voice)
// pair so you can pick by ear instead of by name.
//
// Why this exists: Inworld and xAI voices have NO descriptions on Runware —
// only names. MiniMax Speech 2.8 has 332 descriptive voices but you still want
// to hear them. This script generates short samples of any curated shortlist
// and writes an INDEX.md so you can play through them side-by-side.
//
// Companion to scripts/preview-voices.mjs (which does the same for Edge TTS).
// Cost guard: every call passes through RUNWARE_DAILY_CAP.
//
// Usage:
//   node scripts/preview-runware-voices.mjs                                    # default shortlist
//   node scripts/preview-runware-voices.mjs --text="Bin Sparkle. We do bin day."
//   node scripts/preview-runware-voices.mjs --preset=warm-community
//   node scripts/preview-runware-voices.mjs --voices="eve,luna,English_FriendlyPerson" --model=xai:tts@0
//   node scripts/preview-runware-voices.mjs --list                              # dry run
//
// Output: assets/runware-voice-library/<YYYY-MM-DD>/<model-safe>__<voice>.mp3 + INDEX.md

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { audioInference } from "./lib/runware-audio.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// ──────────────────────────────────────────────────────────────────────────
// Presets — curated shortlists per brand vibe / accent need.
// Each entry: { model, voice, label, language? } — the label shows up in
// INDEX.md; `language` overrides the default ("en") where the model supports
// locale codes (Gemini en-AU, en-GB; MiniMax takes languageBoost separately).
// Add new vibes/voices here as the catalogue grows.
// ──────────────────────────────────────────────────────────────────────────
const PRESETS = {
  // Warm-community = friendly, casual, local-trust (BinSparkle, Kindred, community apps).
  // Anchored on MiniMax's descriptive voices — Inworld names are too ambiguous here.
  "warm-community": [
    // MiniMax Speech 2.8 (descriptive voices — verified live 2026-08-02)
    { model: "minimax:speech@2.8", voice: "English_FriendlyPerson",      label: "MiniMax · FriendlyPerson" },
    { model: "minimax:speech@2.8", voice: "English_CalmWoman",           label: "MiniMax · CalmWoman" },
    { model: "minimax:speech@2.8", voice: "English_Graceful_Lady",       label: "MiniMax · Graceful Lady" },
    { model: "minimax:speech@2.8", voice: "English_Gentle-voiced_man",   label: "MiniMax · Gentle-voiced man" },
    { model: "minimax:speech@2.8", voice: "English_Aussie_Bloke",        label: "MiniMax · Aussie Bloke (NZ-adjacent)" },
    { model: "minimax:speech@2.8", voice: "English_Steadymentor",        label: "MiniMax · Steady mentor" },
    { model: "minimax:speech@2.8", voice: "English_Kind-heartedGirl",    label: "MiniMax · Kind-hearted Girl" },
    { model: "minimax:speech@2.8", voice: "English_SereneWoman",         label: "MiniMax · Serene Woman" },
    // Inworld TTS-1.5 Max (name-only — audition to compare)
    { model: "inworld:tts@1.5-max", voice: "Sarah",    label: "Inworld · Sarah (default-ish name)" },
    { model: "inworld:tts@1.5-max", voice: "Lauren",   label: "Inworld · Lauren" },
    { model: "inworld:tts@1.5-max", voice: "Claire",   label: "Inworld · Claire" },
    { model: "inworld:tts@1.5-max", voice: "Luna",     label: "Inworld · Luna (last pick — known sultry)" },
    // xAI TTS (name-only — small enum, audition for completeness)
    { model: "xai:tts@0", voice: "eve",  label: "xAI · eve (default)" },
    { model: "xai:tts@0", voice: "luna", label: "xAI · luna" },
  ],

  // NZ-adjacent — closest available accents to NZ English. Runware has NO
  // en-NZ voices, so this is the realistic shortlist. Companion Edge TTS
  // audition (which DOES have en-NZ) lives in scripts/preview-voices.mjs.
  "nz-adjacent": [
    // Gemini 3.1 Flash TTS with language: en-AU (closest Runware accent to NZ)
    // 30 voices with gender+style tags. Warm/community-leaning picks:
    { model: "google:gemini@3.1-flash-tts", voice: "Sulafat",      language: "en-AU", label: "Gemini · Sulafat (F/Warm) · en-AU" },
    { model: "google:gemini@3.1-flash-tts", voice: "Aoede",        language: "en-AU", label: "Gemini · Aoede (F/Breezy) · en-AU" },
    { model: "google:gemini@3.1-flash-tts", voice: "Achernar",     language: "en-AU", label: "Gemini · Achernar (F/Soft) · en-AU" },
    { model: "google:gemini@3.1-flash-tts", voice: "Autonoe",      language: "en-AU", label: "Gemini · Autonoe (F/Bright) · en-AU" },
    { model: "google:gemini@3.1-flash-tts", voice: "Leda",         language: "en-AU", label: "Gemini · Leda (F/Youthful) · en-AU" },
    { model: "google:gemini@3.1-flash-tts", voice: "Achird",       language: "en-AU", label: "Gemini · Achird (M/Friendly) · en-AU" },
    { model: "google:gemini@3.1-flash-tts", voice: "Zubenelgenubi",language: "en-AU", label: "Gemini · Zubenelgenubi (M/Casual) · en-AU" },
    // Same warm voices with en-GB for comparison (more formal but familiar to NZ ears)
    { model: "google:gemini@3.1-flash-tts", voice: "Sulafat",      language: "en-GB", label: "Gemini · Sulafat (F/Warm) · en-GB" },
    { model: "google:gemini@3.1-flash-tts", voice: "Achird",       language: "en-GB", label: "Gemini · Achird (M/Friendly) · en-GB" },
    // MiniMax Aussie Bloke (only explicitly-AU voice in the 332-voice library)
    { model: "minimax:speech@2.8", voice: "English_Aussie_Bloke",  label: "MiniMax · Aussie Bloke" },
    // MiniMax warm voices (en default — likely US/neutral accent)
    { model: "minimax:speech@2.8", voice: "English_FriendlyPerson",  label: "MiniMax · FriendlyPerson (neutral-en)" },
    { model: "minimax:speech@2.8", voice: "English_Gentle-voiced_man",label: "MiniMax · Gentle-voiced man (neutral-en)" },
  ],
};

const DEFAULT_TEXT = "Bin Sparkle. We do bin day, so you don't have to. From fifty-five a month.";

// --- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const opts = { text: DEFAULT_TEXT, preset: "warm-community", list: false, voices: null, model: null };
for (const a of args) {
  if (a.startsWith("--text=")) opts.text = a.slice("--text=".length);
  else if (a.startsWith("--preset=")) opts.preset = a.slice("--preset=".length);
  else if (a.startsWith("--voices=")) opts.voices = a.slice("--voices=".length).split(",").map(s => s.trim());
  else if (a.startsWith("--model=")) opts.model = a.slice("--model=".length);
  else if (a === "--list") opts.list = true;
  else if (a === "--help" || a === "-h") {
    console.log(`Usage:
  node scripts/preview-runware-voices.mjs [--preset=<name>] [--text="..."] [--list]
  node scripts/preview-runware-voices.mjs --voices="eve,luna" --model=xai:tts@0

Presets: ${Object.keys(PRESETS).join(", ")}
Default text: "${DEFAULT_TEXT}"
Output:       assets/runware-voice-library/<today>/`);
    process.exit(0);
  }
}

// Build the candidate list — either from --voices+--model, or from a preset.
let candidates;
if (opts.voices) {
  if (!opts.model) { console.error("--voices requires --model=<AIR>"); process.exit(2); }
  candidates = opts.voices.map(v => ({ model: opts.model, voice: v, label: `${opts.model} · ${v}` }));
} else {
  candidates = PRESETS[opts.preset];
  if (!candidates) { console.error(`Unknown preset "${opts.preset}". Available: ${Object.keys(PRESETS).join(", ")}`); process.exit(2); }
}

const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();
const outDir = path.join(projectRoot, "assets", "runware-voice-library", today);

// --- list mode (dry run) ----------------------------------------------------
if (opts.list) {
  console.log(`Preset: ${opts.preset} — ${candidates.length} candidate(s)\n`);
  for (const c of candidates) console.log(`  ${c.model.padEnd(28)} ${c.voice.padEnd(34)} ${c.label}`);
  console.log(`\nText (${opts.text.length} chars): "${opts.text}"`);
  process.exit(0);
}

// --- synth one voice --------------------------------------------------------
async function synthOne(c) {
  const safeModel = c.model.replace(/[^a-z0-9]+/gi, "-");
  const safeVoice = c.voice.replace(/[^a-z0-9]+/gi, "-");
  const langSuffix = c.language && c.language !== "en" ? `__${c.language.replace(/[^a-z0-9]+/gi, "-")}` : "";
  const fname = `${safeModel}__${safeVoice}${langSuffix}.mp3`;
  const outPath = path.join(outDir, fname);

  // Build the model-specific params shape. Per-entry `language` overrides.
  const lang = c.language || "en";
  const params = { speech: { text: opts.text, voice: c.voice, language: lang } };
  if (c.model.startsWith("minimax:speech@")) {
    // MiniMax: speech has no `language` field — uses settings.languageBoost.
    delete params.speech.language;
    params.settings = { languageBoost: lang === "en" ? "auto" : lang };
  }
  // Gemini + Inworld + xAI all accept speech.language directly (above).

  try {
    const r = await audioInference({ model: c.model, params, opts: { outputFormat: "MP3" } });
    if (!r.audioURL) throw new Error("No audioURL in response");
    // Download to outPath
    const dl = await fetch(r.audioURL);
    if (!dl.ok) throw new Error(`Download HTTP ${dl.status}`);
    const buf = Buffer.from(await dl.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    return { ok: true, c, size: buf.length, cost: r.cost, fname };
  } catch (err) {
    return { ok: false, c, error: err.message };
  }
}

// --- main -------------------------------------------------------------------
fs.mkdirSync(outDir, { recursive: true });
console.log(`[out]   ${outDir}`);
console.log(`[count] ${candidates.length} voice(s)`);
console.log(`[text]  ${opts.text.length} chars: "${opts.text}"`);
console.log("");

const results = [];
for (const c of candidates) {
  process.stderr.write(`  ${c.model.padEnd(28)} ${c.voice.padEnd(34)} ... `);
  const r = await synthOne(c);
  results.push(r);
  if (r.ok) process.stderr.write(`OK $${(r.cost ?? 0).toFixed(5)} ${(r.size / 1024).toFixed(1)}KB\n`);
  else process.stderr.write(`FAIL (${r.error})\n`);
}

// --- INDEX.md ---------------------------------------------------------------
const ok = results.filter(r => r.ok);
const failed = results.filter(r => !r.ok);
const lines = [
  `# Runware voice audition — ${today}`,
  ``,
  `**Sample text:**`,
  ``,
  `> ${opts.text}`,
  ``,
  `${ok.length} voice(s), ${failed.length} failed. Play each MP3 to compare side-by-side. Recording what you heard (tone, gender, pace, fit) next to each line turns this into a permanent reference for next time.`,
  ``,
  `| voice | model | size | cost | preview |`,
  `| --- | --- | ---: | ---: | --- |`,
];
for (const r of ok) {
  const kb = (r.size / 1024).toFixed(1);
  lines.push(`| \`${r.c.voice}\` | \`${r.c.model}\` | ${kb} KB | $${(r.cost ?? 0).toFixed(5)} | [▶ play](./${r.fname}) |`);
}
if (failed.length) {
  lines.push(``, `## Failed`, ``);
  for (const r of failed) lines.push(`- \`${r.c.model} · ${r.c.voice}\` — ${r.error}`);
}
lines.push("");
fs.writeFileSync(path.join(outDir, "INDEX.md"), lines.join("\n"));

const totalCost = ok.reduce((s, r) => s + (r.cost ?? 0), 0);
console.log(`\n[done]  ${ok.length} ok, ${failed.length} failed. Total cost: $${totalCost.toFixed(4)}`);
console.log(`[index] ${path.join(outDir, "INDEX.md")}`);
