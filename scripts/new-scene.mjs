// TTS-first scene scaffolder.
//
// Locks in the "narration is the master clock" pattern from LEARNINGS.md §3.
// Generates TTS audio + word-level VTT FIRST, then sizes scene beats to actual
// VTT word boundaries. Eliminates the drift you get when you build the comp
// first and try to fit narration into it.
//
// Usage:
//   npm run new:scene -- --narration="Hello world. Three sentences. Done."
//   npm run new:scene -- --narration="..." --beats=4 --voice=en-NZ-MollyNeural --out=scene.html
//   npm run new:scene -- --file=script.txt --beats=3 --name=intro --full
//
// What it does:
//   1. Synthesise TTS via `edge-tts-universal` → assets/tts/<slug>.mp3 + .vtt
//   2. Parse VTT to extract per-word { start, end, text } timings
//   3. Divide narration into N beats at sentence boundaries (or word boundaries)
//   4. Emit <out> HTML — fragment (default) or full standalone comp (--full):
//      - one .scene per beat with data-start/data-duration aligned to VTT words
//      - <audio> wired to the TTS file with correct data-track-index
//      - per-beat narration text + GSAP textFx.cascade reveal
//
// Flags:
//   --narration="<text>"      narration script (or use --file)
//   --file=<path>             read narration from a .txt file
//   --beats=<N>               number of beats (default 4)
//   --voice=<name>            edge-tts voice (default en-US-JennyNeural)
//   --rate=<+10%>             prosody rate (default +0%)
//   --pitch=<+5Hz>            prosody pitch (default +0Hz)
//   --out=<file>              output HTML filename (default scene.html in cwd)
//   --name=<slug>             slug for tts files (default derived from --out)
//   --full                    emit a full standalone composition (with <html>,
//                             timeline registration, etc) — default is a
//                             fragment intended for paste into an existing comp
//   --width=<N>               canvas width when --full (default 1920)
//   --height=<N>              canvas height when --full (default 1080)
//   --force                   overwrite existing TTS audio without re-prompt
//   --no-tts                  skip TTS synthesis, reuse existing assets/tts/<slug>.{mp3,vtt}
//
// Exit codes:
//   0 = success
//   1 = bad args, missing narration, or TTS failure

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EdgeTTS, createVTT } from "edge-tts-universal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- arg parsing ----------------------------------------------------------

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.length ? rest.join("=") : true];
  })
);

const opts = {
  narration: flags.narration ?? null,
  file:      flags.file ?? null,
  beats:     parseInt(flags.beats ?? "4", 10),
  voice:     flags.voice ?? "en-US-JennyNeural",
  rate:      flags.rate ?? "+0%",
  pitch:     flags.pitch ?? "+0Hz",
  out:       flags.out ?? "scene.html",
  name:      flags.name ?? null,
  full:      flags.full === true,
  width:     parseInt(flags.width ?? "1920", 10),
  height:    parseInt(flags.height ?? "1080", 10),
  force:     flags.force === true,
  noTts:     flags["no-tts"] === true,
};

if (opts.file) {
  try {
    opts.narration = fs.readFileSync(opts.file, "utf8").trim();
  } catch (err) {
    console.error(`✗ couldn't read --file=${opts.file}: ${err.message}`);
    process.exit(1);
  }
}

if (!opts.narration) {
  console.log(`Usage:
  npm run new:scene -- --narration="<text>" [--beats=4] [--voice=...] [--out=scene.html]
  npm run new:scene -- --file=script.txt --beats=3 --name=intro --full

Required: --narration or --file
Default voice: en-US-JennyNeural   (try en-NZ-MollyNeural, en-AU-WilliamNeural)
Default beats: 4
Default out:   scene.html (fragment). Use --full for a standalone composition.

Files written:
  assets/tts/<slug>.mp3
  assets/tts/<slug>.vtt
  <out>                  (fragment HTML or full comp if --full)`);
  process.exit(1);
}

if (!Number.isFinite(opts.beats) || opts.beats < 1) {
  console.error(`✗ --beats must be a positive integer (got ${flags.beats})`);
  process.exit(1);
}

// Slug — from --name, else from --out filename, else "scene".
const outBase = path.basename(opts.out).replace(/\.html?$/i, "");
const slug = (opts.name ?? outBase ?? "scene")
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "") || "scene";

console.log(`▶ scaffolding scene "${slug}"  (${opts.beats} beats, voice=${opts.voice})`);

// --- 1. TTS ---------------------------------------------------------------

const ttsDir = path.join(projectRoot, "assets", "tts");
fs.mkdirSync(ttsDir, { recursive: true });
const mp3Path = path.join(ttsDir, `${slug}.mp3`);
const vttPath = path.join(ttsDir, `${slug}.vtt`);

if (!opts.noTts) {
  if (fs.existsSync(mp3Path) && !opts.force) {
    console.log(`  ${path.relative(projectRoot, mp3Path)} exists — pass --force to re-synthesise, or --no-tts to reuse silently`);
    process.exit(1);
  }

  console.log(`  synth: ${opts.narration.length} chars → ${path.relative(projectRoot, mp3Path)}`);
  try {
    const tts = new EdgeTTS(opts.narration, opts.voice, {
      rate: opts.rate,
      pitch: opts.pitch,
      volume: "+0%",
    });
    const result = await tts.synthesize();

    // result.audio is a Blob in browsers, Buffer-ish in Node — coerce.
    let audioBuf;
    if (Buffer.isBuffer(result.audio)) {
      audioBuf = result.audio;
    } else if (result.audio?.arrayBuffer) {
      audioBuf = Buffer.from(await result.audio.arrayBuffer());
    } else {
      audioBuf = Buffer.from(result.audio);
    }
    fs.writeFileSync(mp3Path, audioBuf);
    console.log(`  ✓ ${(audioBuf.length / 1024).toFixed(1)} KB audio`);

    if (!result.subtitle?.length) {
      console.error(`✗ Edge TTS returned no word-level subtitles — can't anchor beats`);
      process.exit(1);
    }
    fs.writeFileSync(vttPath, createVTT(result.subtitle), "utf8");
    console.log(`  ✓ ${result.subtitle.length} word boundaries → ${path.relative(projectRoot, vttPath)}`);
  } catch (err) {
    console.error(`✗ TTS failed: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
} else {
  if (!fs.existsSync(mp3Path) || !fs.existsSync(vttPath)) {
    console.error(`✗ --no-tts set but missing ${path.relative(projectRoot, mp3Path)} or .vtt`);
    process.exit(1);
  }
  console.log(`  reusing existing ${path.relative(projectRoot, mp3Path)} (--no-tts)`);
}

// --- 2. Parse VTT ---------------------------------------------------------

const vttRaw = fs.readFileSync(vttPath, "utf8");
const words = parseVtt(vttRaw);
if (!words.length) {
  console.error(`✗ no word entries parsed from ${vttPath}`);
  process.exit(1);
}
const totalDur = words[words.length - 1].end;
console.log(`  parsed: ${words.length} words, total ${totalDur.toFixed(2)}s`);

// --- 3. Divide narration into N beats -------------------------------------

const beats = sliceIntoBeats(opts.narration, words, opts.beats);
console.log(`  beats:`);
for (const [i, b] of beats.entries()) {
  console.log(`    ${i + 1}: ${b.start.toFixed(2)}s → ${b.end.toFixed(2)}s  (${(b.end - b.start).toFixed(2)}s)  "${truncate(b.text, 60)}"`);
}

// --- 4. Generate HTML -----------------------------------------------------

const audioId = `${slug}-vo`;
const audioRel = path.posix.join("assets", "tts", `${slug}.mp3`);
// `data-track-index` on the audio: pick a high index so it never collides with
// scene clips (scenes use 1..). 9 is conventional for "narration track".
const audioTrack = 9;

let outHtml;
if (opts.full) {
  outHtml = renderFullComposition({
    slug, beats, audioId, audioRel, audioTrack,
    totalDur, width: opts.width, height: opts.height, narration: opts.narration,
  });
} else {
  outHtml = renderFragment({
    slug, beats, audioId, audioRel, audioTrack, totalDur,
  });
}

// Resolve --out relative to cwd (so it lands wherever the user runs the command).
const outAbs = path.isAbsolute(opts.out) ? opts.out : path.resolve(process.cwd(), opts.out);
fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.writeFileSync(outAbs, outHtml);
console.log(`✓ wrote ${path.relative(projectRoot, outAbs)} (${opts.full ? "full composition" : "fragment"})`);

// --- 5. Next steps --------------------------------------------------------

console.log("");
console.log(`▶ next steps:`);
if (opts.full) {
  console.log(`  1. Preview:  npx hyperframes preview ${path.relative(projectRoot, outAbs)}`);
  console.log(`  2. Lint:     npx hyperframes lint`);
  console.log(`  3. Tune palette/typography in <style> block — placeholders are intentional.`);
} else {
  console.log(`  1. Open ${path.relative(projectRoot, outAbs)} and copy its <div data-composition-id> + <script> blocks into your composition.`);
  console.log(`     Audio path is relative to project root (${audioRel}). Adjust if you paste into a sub-composition (../assets/tts/...).`);
  console.log(`  2. Lint:     npx hyperframes lint`);
}
console.log(`  · Beat boundaries are anchored to VTT word times — re-run with --beats=N to re-divide.`);
console.log(`  · Re-synthesise narration: delete assets/tts/${slug}.mp3 (or pass --force).`);

// =========================================================================
// helpers
// =========================================================================

// Parse a WEBVTT file → [{ start, end, text }, ...]. Tolerant of cue ID lines
// and blank lines, ignores STYLE/NOTE blocks (edge-tts doesn't emit them but
// hand-edited VTTs might).
function parseVtt(raw) {
  const out = [];
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
    if (!m) continue;
    const start = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
    const end   = (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + (+m[8]) / 1000;
    // Cue payload is the next non-blank line (edge-tts emits one word per cue).
    let text = "";
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === "") break;
      text += (text ? " " : "") + lines[j].trim();
    }
    if (text) out.push({ start, end, text });
  }
  return out;
}

// Divide narration into N beats. Strategy:
//   1. Split narration on sentence boundaries (. ! ?).
//   2. If sentences ≥ N, group consecutive sentences into N approximately-equal
//      chunks (by combined character length).
//   3. If sentences < N, fall back to chunking by word indices.
//   4. For each chunk, anchor start/end to the VTT word times of its first/last
//      word — matched by walking the word stream sequentially.
function sliceIntoBeats(narration, words, n) {
  const sentences = splitSentences(narration);
  let chunks;
  if (sentences.length >= n) {
    chunks = balanceChunks(sentences, n);
  } else {
    // Word-boundary fallback. Use VTT word count (might differ from raw narration
    // tokenisation — edge-tts sometimes splits "AI" into "A I" — so divide on the
    // VTT word stream directly, then reconstruct text from the cue payloads).
    const per = Math.ceil(words.length / n);
    chunks = [];
    for (let i = 0; i < n; i++) {
      const slice = words.slice(i * per, Math.min((i + 1) * per, words.length));
      if (slice.length) chunks.push(slice.map(w => w.text).join(" "));
    }
  }

  // Anchor each chunk to VTT word times. Walk the word stream once, advancing
  // a cursor per chunk by counting the chunk's word tokens.
  const beats = [];
  let cursor = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const tokenCount = countWordTokens(chunkText);
    const startIdx = cursor;
    const endIdx = Math.min(cursor + tokenCount - 1, words.length - 1);
    const isLast = (i === chunks.length - 1);
    const start = words[startIdx]?.start ?? 0;
    // Last beat extends to total audio end; intermediate beats end at next word's
    // start (so beats are contiguous, no gaps).
    let end;
    if (isLast) {
      end = words[words.length - 1].end;
    } else if (endIdx + 1 < words.length) {
      end = words[endIdx + 1].start;
    } else {
      end = words[endIdx].end;
    }
    beats.push({ text: chunkText, start, end, startIdx, endIdx });
    cursor = endIdx + 1;
  }
  // If we ran out of words mid-way (token count mismatch with VTT), pad
  // remaining beats with zero-length tail so we still emit `n` scenes.
  while (beats.length < n) {
    const tail = words[words.length - 1].end;
    beats.push({ text: "", start: tail, end: tail, startIdx: -1, endIdx: -1 });
  }
  return beats;
}

function splitSentences(text) {
  // Split on sentence-final punctuation + whitespace, keeping the punctuation
  // attached to the preceding sentence.
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Group `items` (sentences) into `n` chunks with roughly-equal total char length.
// Greedy: walk items, accumulate into current chunk until its length >= target;
// move on. Final chunk soaks up the remainder.
function balanceChunks(items, n) {
  const totalLen = items.reduce((s, x) => s + x.length, 0);
  const target = totalLen / n;
  const chunks = [];
  let buf = [];
  let bufLen = 0;
  for (let i = 0; i < items.length; i++) {
    buf.push(items[i]);
    bufLen += items[i].length;
    const remainingChunks = n - chunks.length - 1;
    const remainingItems = items.length - i - 1;
    // Close this chunk if (a) we've hit target and there are still items to
    // distribute, or (b) we'd run out of items for the remaining chunks.
    if ((bufLen >= target && remainingChunks > 0 && remainingItems >= remainingChunks) ||
        remainingItems === remainingChunks) {
      chunks.push(buf.join(" "));
      buf = [];
      bufLen = 0;
    }
  }
  if (buf.length) chunks.push(buf.join(" "));
  // Pad if we somehow ended short.
  while (chunks.length < n) chunks.push("");
  // Truncate if we somehow ended long (shouldn't happen with above logic).
  while (chunks.length > n) {
    chunks[chunks.length - 2] += " " + chunks.pop();
  }
  return chunks;
}

// Count "word tokens" the way edge-tts does — splits on whitespace AND treats
// hyphenated words as a single token (matching VTT behaviour). Ignores leading/
// trailing punctuation so "world." counts as one word.
function countWordTokens(text) {
  return text
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function truncate(s, n) {
  s = String(s);
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// =========================================================================
// HTML emitters
// =========================================================================

function renderBeats(beats, slug) {
  return beats.map((b, i) => {
    const beatId = `${slug}-b${i + 1}`;
    const dur = Math.max(0.1, +(b.end - b.start).toFixed(3));
    const start = +b.start.toFixed(3);
    const text = b.text || `Beat ${i + 1}`;
    return `  <!-- Beat ${i + 1}: ${start.toFixed(2)}s → ${b.end.toFixed(2)}s -->
  <div id="${beatId}" class="scene clip"
       data-start="${start}" data-duration="${dur}" data-track-index="1">
    <div class="scene-content">
      <div class="beat-text">${escapeHtml(text)}</div>
    </div>
  </div>`;
  }).join("\n\n");
}

function renderTimelineTweens(beats, slug) {
  return beats.map((b, i) => {
    const beatId = `${slug}-b${i + 1}`;
    const start = +b.start.toFixed(3);
    return `  textFx.cascade(tl, "#${beatId} .beat-text", { at: ${start}, duration: 0.6, stagger: 0.06 });`;
  }).join("\n");
}

// Fragment — inline-able into an existing composition. Includes the .scene
// blocks, the <audio> element, and a <script> block that registers the scene
// timeline. No <html>/<head>/<body>, no <style>. Expects the host composition
// to have already loaded gsap + design/modules/text-fx.js.
function renderFragment({ slug, beats, audioId, audioRel, audioTrack, totalDur }) {
  return `<!-- ===========================================================
     Scene scaffold: ${slug}
     ${beats.length} beats · ${totalDur.toFixed(2)}s total
     Generated by scripts/new-scene.mjs — beat boundaries anchored
     to assets/tts/${slug}.vtt word times.
     =========================================================== -->

<audio id="${audioId}"
       src="${audioRel}"
       data-start="0"
       data-duration="${totalDur.toFixed(3)}"
       data-track-index="${audioTrack}"
       data-volume="1"></audio>

${renderBeats(beats, slug)}

<script>
  // Beat reveals — anchored to VTT word times. Scene-timeline registration
  // expected: this fragment assumes you're pasting into a comp that already
  // has window.__timelines["<your-comp-id>"] set up. Tweens use that timeline
  // implicitly via the const tl = window.__timelines["<your-comp-id>"]
  // pattern — adjust the line below if your comp ID differs.
  (function () {
    const tl = window.__timelines && (window.__timelines["${slug}"] || Object.values(window.__timelines)[0]);
    if (!tl) {
      console.warn("scene-${slug}: no timeline found on window.__timelines — wire one up before this script runs");
      return;
    }
${renderTimelineTweens(beats, slug)}
  })();
</script>
`;
}

// Full standalone composition. Loads gsap + text-fx, sets up
// window.__timelines["<slug>"], wraps the whole thing in a single
// data-composition-id container per the framework contract.
function renderFullComposition({ slug, beats, audioId, audioRel, audioTrack, totalDur, width, height, narration }) {
  const totalDurStr = totalDur.toFixed(3);
  const padding = Math.round(Math.min(width, height) * 0.08);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(slug)}</title>

<script src="design/vendor/gsap.min.js"></script>
<script src="design/modules/all.js"></script>

<style>
  body { margin: 0; background: #0E1116; font-family: system-ui, -apple-system, sans-serif; }
  .comp {
    width: ${width}px; height: ${height}px;
    position: relative; overflow: hidden;
    background: #0E1116;
    color: #F4F1EA;
  }
  .scene {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .scene-content {
    width: 100%; height: 100%;
    padding: ${padding}px ${padding * 1.3}px;
    box-sizing: border-box;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
  }
  .beat-text {
    font-size: ${Math.round(Math.min(width, height) * 0.07)}px;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.02em;
    max-width: ${Math.round(width * 0.78)}px;
  }
</style>
</head>
<body>

<div id="${slug}" class="comp clip"
     data-composition-id="${slug}"
     data-width="${width}" data-height="${height}"
     data-start="0" data-duration="${totalDurStr}" data-track-index="0">

  <audio id="${audioId}"
         src="${audioRel}"
         data-start="0"
         data-duration="${totalDurStr}"
         data-track-index="${audioTrack}"
         data-volume="1"></audio>

${renderBeats(beats, slug)}
</div>

<script>
  // Narration source (for reference):
  //   ${narration.replace(/\n/g, " ").replace(/\*\//g, "*\\/").slice(0, 200)}${narration.length > 200 ? "…" : ""}
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  window.__timelines["${slug}"] = tl;

${renderTimelineTweens(beats, slug)}

  // Standalone autoplay — only when loaded directly (not in studio/renderer).
  if (window === window.top) {
    setTimeout(() => tl.play(0), 250);
  }
</script>
</body>
</html>
`;
}
