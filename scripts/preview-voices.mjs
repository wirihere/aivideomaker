// Voice library curator — synthesise a fixed sample with every Edge TTS voice
// so the operator can audition them side-by-side instead of picking blind.
//
// Background: scripts/fetch-tts-edge.mjs picks a single voice up-front. Until
// you've heard a voice you're guessing. This script loops listVoices() through
// EdgeTTS, writes one MP3 per voice into a dated folder, and emits an
// INDEX.md so the operator can play through them and pick one.
//
// Usage:
//   node scripts/preview-voices.mjs
//   node scripts/preview-voices.mjs --text="The bright fox..."
//   node scripts/preview-voices.mjs --filter="^en-NZ"
//   node scripts/preview-voices.mjs --all-locales
//   node scripts/preview-voices.mjs --list             (dry run, no API)
//   node scripts/preview-voices.mjs --out=tmp/voices
//
// Output: assets/voice-library/<YYYY-MM-DD>/<voice-id>.mp3 + INDEX.md

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { EdgeTTS, listVoices } from "edge-tts-universal";
import { check, record } from "./lib/usage.mjs";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Default English locales. Excludes mi-NZ on purpose — see
// MEMORY: feedback_tts_no_maori. The user prefers English-only narration; this
// keeps the default audition list aligned with that preference.
const DEFAULT_EN_LOCALES = new Set([
  "en-US", "en-GB", "en-AU", "en-NZ", "en-IE",
  "en-CA", "en-IN", "en-ZA", "en-HK", "en-PH", "en-SG", "en-KE", "en-NG", "en-TZ",
]);

// Extra locales unlocked by --all-locales. Kept small — the goal is to hear the
// voice, not survey every language Microsoft ships.
const EXTRA_LOCALES = new Set(["es-ES", "fr-FR", "de-DE", "it-IT", "ja-JP", "zh-CN", "pt-BR"]);

const DEFAULT_TEXT =
  "The bright fox quickly jumps over twelve lazy dogs near the silent quay.";

const CONCURRENCY = 5; // Edge TTS rate limit is 60/min; 5 parallel keeps headroom.

// --- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const opts = {
  text: DEFAULT_TEXT,
  allLocales: false,
  out: null,
  filter: null,
  list: false,
};
for (const a of args) {
  if (a.startsWith("--text=")) opts.text = a.slice("--text=".length);
  else if (a === "--all-locales") opts.allLocales = true;
  else if (a.startsWith("--out=")) opts.out = a.slice("--out=".length);
  else if (a.startsWith("--filter=")) opts.filter = new RegExp(a.slice("--filter=".length));
  else if (a === "--list") opts.list = true;
  else if (a === "--help" || a === "-h") {
    console.log(`Usage:
  node scripts/preview-voices.mjs [--text="..."] [--all-locales] [--out=<dir>] [--filter=<regex>] [--list]

Defaults:
  --text     "${DEFAULT_TEXT}"
  out dir    assets/voice-library/<today>/
  locales    English-only (use --all-locales for major non-English)
  filter     none — synth every selected voice
`);
    process.exit(0);
  }
}

const today = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();
const outDir = opts.out
  ? path.resolve(projectRoot, opts.out)
  : path.join(projectRoot, "assets", "voice-library", today);

// --- voice discovery --------------------------------------------------------
function selectVoices(all) {
  const allow = opts.allLocales
    ? new Set([...DEFAULT_EN_LOCALES, ...EXTRA_LOCALES])
    : DEFAULT_EN_LOCALES;
  let picked = all.filter((v) => allow.has(v.Locale));
  if (opts.filter) picked = picked.filter((v) => opts.filter.test(v.ShortName));
  // Stable sort: locale → gender → name
  picked.sort((a, b) => {
    if (a.Locale !== b.Locale) return a.Locale.localeCompare(b.Locale);
    if (a.Gender !== b.Gender) return a.Gender.localeCompare(b.Gender);
    return a.ShortName.localeCompare(b.ShortName);
  });
  return picked;
}

// --- worker per voice -------------------------------------------------------
async function synthOne(voice) {
  const id = voice.ShortName;
  const outPath = path.join(outDir, `${id}.mp3`);
  const key = cacheKey(`voice-preview|${id}|${opts.text}`);

  const hit = await cacheGet(key);
  if (hit) {
    fs.copyFileSync(hit, outPath);
    const size = fs.statSync(outPath).size;
    console.log(`[cache hit] ${id} (${(size / 1024).toFixed(1)} KB)`);
    return { ok: true, voice, size, cached: true };
  }

  // Per-voice quota check. record() is called only on success.
  const status = check("tts-edge", 1);
  if (!status.allowed) {
    console.error(`[skip] ${id}: ${status.message}`);
    return { ok: false, voice, error: status.message };
  }

  try {
    const tts = new EdgeTTS(opts.text, id);
    const result = await tts.synthesize();
    let buf;
    if (Buffer.isBuffer(result.audio)) buf = result.audio;
    else if (result.audio?.arrayBuffer) buf = Buffer.from(await result.audio.arrayBuffer());
    else buf = Buffer.from(result.audio);
    fs.writeFileSync(outPath, buf);
    await cachePut(key, buf, ".mp3");
    record("tts-edge", 1);
    console.log(`[synth]    ${id} (${(buf.length / 1024).toFixed(1)} KB)`);
    return { ok: true, voice, size: buf.length, cached: false };
  } catch (err) {
    console.error(`[error]    ${id}: ${err.message}`);
    return { ok: false, voice, error: err.message };
  }
}

// chunked Promise.all — keeps concurrency bounded without extra deps.
async function runChunked(items, n, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += n) {
    const batch = items.slice(i, i + n);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

// --- INDEX.md ---------------------------------------------------------------
function writeIndex(results) {
  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const lines = [];
  lines.push(`# Voice library — ${today}`);
  lines.push("");
  lines.push(`**Sample text:**`);
  lines.push("");
  lines.push("> " + opts.text);
  lines.push("");
  lines.push(
    `Generated by \`scripts/preview-voices.mjs\`. ${ok.length} voice${ok.length === 1 ? "" : "s"}, ` +
    `${failed.length} failed. To audition, click an MP3 in the table or open this folder in your file manager and play.`,
  );
  lines.push("");
  lines.push(`On Windows: \`start <voice>.mp3\` (default audio app).`);
  lines.push(`On macOS:   \`open <voice>.mp3\`.`);
  lines.push("");
  lines.push(`| voice-id | locale | gender | size | preview |`);
  lines.push(`| --- | --- | --- | ---: | --- |`);
  for (const r of ok) {
    const v = r.voice;
    const kb = (r.size / 1024).toFixed(1);
    const tag = r.cached ? " (cached)" : "";
    lines.push(`| \`${v.ShortName}\` | ${v.Locale} | ${v.Gender} | ${kb} KB${tag} | [play](./${v.ShortName}.mp3) |`);
  }
  if (failed.length) {
    lines.push("");
    lines.push(`## Failed`);
    lines.push("");
    for (const r of failed) {
      lines.push(`- \`${r.voice.ShortName}\` — ${r.error}`);
    }
  }
  lines.push("");
  fs.writeFileSync(path.join(outDir, "INDEX.md"), lines.join("\n"), "utf8");
}

// --- main -------------------------------------------------------------------
async function main() {
  let allVoices;
  try {
    allVoices = await listVoices();
  } catch (err) {
    console.error(`[fatal] listVoices failed: ${err.message}`);
    process.exit(1);
  }
  const picked = selectVoices(allVoices);

  if (picked.length === 0) {
    console.error(`[fatal] No voices matched the filter. Run with --list to see candidates.`);
    process.exit(1);
  }

  if (opts.list) {
    for (const v of picked) {
      console.log(`${v.ShortName.padEnd(32)} ${v.Locale.padEnd(8)} ${v.Gender}`);
    }
    console.log(`\n${picked.length} voice${picked.length === 1 ? "" : "s"} would be synthesised.`);
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  console.log(`[out]   ${outDir}`);
  console.log(`[count] ${picked.length} voice${picked.length === 1 ? "" : "s"}`);
  console.log(`[text]  ${opts.text.length} chars`);
  console.log("");

  const results = await runChunked(picked, CONCURRENCY, synthOne);
  writeIndex(results);

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const cached = results.filter((r) => r.ok && r.cached).length;
  console.log("");
  console.log(`[done]  ${ok} ok (${cached} cached), ${failed} failed`);
  console.log(`[index] ${path.join(outDir, "INDEX.md")}`);
}

main().catch((err) => {
  console.error(`[fatal] ${err.stack || err.message}`);
  process.exit(1);
});
