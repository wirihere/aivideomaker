#!/usr/bin/env node
// Music + scene-timing alignment analyser.
//
// Given the music tracks in assets/music/ and the structural templates in
// compositions/templates/, this script:
//   1. Decodes each .mp3 to mono 8 kHz PCM via the bundled ffmpeg.
//   2. Computes per-second RMS energy windows.
//   3. Estimates BPM via autocorrelation on the energy envelope (60–180 BPM
//      search range; falls back to broad bins on low confidence).
//   4. Detects "drops" (>30% RMS jump between adjacent windows) and "swells"
//      (gradual >25% rise across a 5 s window).
//   5. Cross-references each track with the curator notes from
//      assets/music-shortlists/<vibe>.json.
//   6. Scores each (template, track) pair against the template's vibe profile
//      and scene-cut grid, producing per-template top-5 recommendations.
//
// Outputs:
//   docs/music-template-alignment.md      — human-readable per-template ranks.
//   assets/music/alignment.json           — machine-readable matrix.
//
// Read-only — does not modify any music file or scripts/pick-music.mjs.
//
// Usage:
//   node scripts/analyze-music-alignment.mjs
//   node scripts/analyze-music-alignment.mjs --json   # also dump full matrix
//
// Constraints kept deterministic: no Date.now, no Math.random, no network.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// ---- Constants ------------------------------------------------------------

const SAMPLE_RATE = 8000;          // 8 kHz mono PCM is plenty for envelope/BPM.
const WINDOW_MS = 1000;            // 1 second RMS window.
const SAMPLES_PER_WINDOW = (SAMPLE_RATE * WINDOW_MS) / 1000;
const DROP_THRESHOLD = 0.30;       // 30% RMS jump = "drop".
const SWELL_WINDOW = 5;            // sliding window (s) for swell detection.
const SWELL_THRESHOLD = 0.25;      // 25% gradual rise over SWELL_WINDOW.

// Vibe profiles — bpm range, ideal energy std-dev band, intended cut feel.
// Energy bands were calibrated against the 13 tracks in assets/music/ —
// pixabay loudness-normalised mp3s sit in std=0.04..0.09 even for "kinetic"
// tracks, so absolute std thresholds are tight. Drop count + bpm carry the
// kinetic distinction more reliably than RMS std.
const VIBE_PROFILES = {
  "kinetic-pop": {
    bpm_range: [110, 130],
    bpm_ideal: 120,
    energy_band: { min_std: 0.04, max_std: 0.12 },
    drops_preferred: true,
    description: "Drum-heavy, kicks land on cuts; drops align with cut grid.",
  },
  "warm-community": {
    bpm_range: [80, 100],
    bpm_ideal: 88,
    energy_band: { min_std: 0.03, max_std: 0.10 },
    drops_preferred: false,
    description: "Acoustic, mid-tempo; flat enough to sit under narration.",
  },
  documentary: {
    bpm_range: [60, 90],
    bpm_ideal: 72,
    energy_band: { min_std: 0.03, max_std: 0.09 },
    drops_preferred: false,
    description: "Strings + piano, restrained; anchors the narration.",
  },
  "quiet-premium": {
    bpm_range: [50, 75],
    bpm_ideal: 60,
    energy_band: { min_std: 0.02, max_std: 0.08 },
    drops_preferred: false,
    description: "Beatless or near-beatless ambient pad + sparse piano.",
  },
};

// "Bumps" density threshold (drops + swells per second) above which a quiet
// vibe gets penalised. Calibrated so kindred-bed (16/213 ≈ 0.075) does NOT
// trigger the warning, but a kinetic track at 30/90 ≈ 0.33 clearly does.
const BUMP_DENSITY_QUIET_LIMIT = 0.12;

// Structural template -> vibe (mirrors TEMPLATE_REGISTRY in scripts/video.mjs).
const TEMPLATE_REGISTRY = {
  "social-reel-15s":     { vibe: "kinetic-pop",    seconds: 15 },
  "hero-promo-30s":      { vibe: "kinetic-pop",    seconds: 30 },
  "product-launch-30s":  { vibe: "kinetic-pop",    seconds: 30 },
  "before-after-20s":    { vibe: "kinetic-pop",    seconds: 20 },
  "faq-quick-30s":       { vibe: "warm-community", seconds: 30 },
  "testimonial-45s":     { vibe: "warm-community", seconds: 45 },
  "founder-story-60s":   { vibe: "documentary",    seconds: 60 },
  "case-study-60s":      { vibe: "documentary",    seconds: 60 },
};

// ---- Audio decode ---------------------------------------------------------

async function decodeMonoPcm(ffmpegPath, mp3Path) {
  return new Promise((resolve, reject) => {
    const args = [
      "-hide_banner",
      "-loglevel", "error",
      "-i", mp3Path,
      "-f", "s16le",
      "-acodec", "pcm_s16le",
      "-ac", "1",
      "-ar", String(SAMPLE_RATE),
      "-",
    ];
    const ff = spawn(ffmpegPath, args, { windowsHide: true });
    const chunks = [];
    let stderr = "";
    ff.stdout.on("data", (c) => chunks.push(c));
    ff.stderr.on("data", (c) => { stderr += c.toString(); });
    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exited ${code}: ${stderr.trim()}`));
      }
      const buf = Buffer.concat(chunks);
      // Interpret as little-endian int16 mono.
      const samples = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
      resolve(samples);
    });
  });
}

// ---- Feature extraction ---------------------------------------------------

function rmsWindows(samples) {
  const n = Math.floor(samples.length / SAMPLES_PER_WINDOW);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const start = i * SAMPLES_PER_WINDOW;
    for (let j = 0; j < SAMPLES_PER_WINDOW; j++) {
      const v = samples[start + j] / 32768;
      sum += v * v;
    }
    env[i] = Math.sqrt(sum / SAMPLES_PER_WINDOW);
  }
  return env;
}

function statsOf(env) {
  if (env.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
  let mean = 0, min = Infinity, max = -Infinity;
  for (const v of env) { mean += v; if (v < min) min = v; if (v > max) max = v; }
  mean /= env.length;
  let varSum = 0;
  for (const v of env) varSum += (v - mean) ** 2;
  const std = Math.sqrt(varSum / env.length);
  return { mean, std, min, max };
}

function detectDropsSwells(env) {
  const drops = [];
  const swells = [];
  for (let i = 1; i < env.length; i++) {
    if (env[i - 1] > 1e-4 && (env[i] - env[i - 1]) / env[i - 1] > DROP_THRESHOLD) {
      drops.push(i); // second index where the drop lands.
    }
  }
  for (let i = SWELL_WINDOW; i < env.length; i++) {
    const start = env[i - SWELL_WINDOW];
    if (start < 1e-4) continue;
    const rise = (env[i] - start) / start;
    let monotonic = true;
    for (let j = i - SWELL_WINDOW + 1; j <= i; j++) {
      if (env[j] < env[j - 1] * 0.95) { monotonic = false; break; }
    }
    if (monotonic && rise > SWELL_THRESHOLD) swells.push(i);
  }
  return { drops, swells };
}

// BPM estimate via autocorrelation on a smoothed onset envelope.
// Re-window at 25 ms so adjacent BPM candidates are resolved finely
// (40 frames/s → integer lag 13 ≈ 184 BPM; lag 60 ≈ 40 BPM).
function estimateBpm(samples) {
  const FRAMES_PER_SEC = 40;
  const win = Math.floor(SAMPLE_RATE / FRAMES_PER_SEC); // 25 ms windows.
  const n = Math.floor(samples.length / win);
  if (n < 30) return { bpm: null, confidence: 0 };

  const rms = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < win; j++) {
      const v = samples[i * win + j] / 32768;
      sum += v * v;
    }
    rms[i] = Math.sqrt(sum / win);
  }
  // Onset = ReLU(diff) — emphasises attacks.
  const onset = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    const d = rms[i] - rms[i - 1];
    onset[i] = d > 0 ? d : 0;
  }
  // Subtract mean to centre autocorrelation.
  let mean = 0;
  for (const v of onset) mean += v;
  mean /= onset.length;
  for (let i = 0; i < onset.length; i++) onset[i] -= mean;

  // Search BPM range 50..180 -> lag 33..120 (frames at 100 ms each).
  // lag_frames = (60 / bpm) * 10. Onset autocorrelation is naturally
  // ambiguous between bpm/2 ↔ bpm ↔ 2·bpm (the kick on the half-bar
  // correlates as well as the kick on the bar). We resolve ambiguity by
  // collecting *local maxima* in the autocorrelation curve, then preferring
  // peaks in the 100–140 BPM "musical centre" before falling back to
  // doubling/halving low-BPM picks if the curated/template suggests it.
  const minBpm = 50, maxBpm = 180;
  // lag in frames: bpm = 60 * FRAMES_PER_SEC / lag.
  const minLag = Math.max(2, Math.round((60 * FRAMES_PER_SEC) / maxBpm));
  const maxLag = Math.round((60 * FRAMES_PER_SEC) / minBpm);
  let energy = 0;
  for (const v of onset) energy += v * v;
  if (energy < 1e-9) return { bpm: null, confidence: 0 };

  const corr = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    for (let i = 0; i < onset.length - lag; i++) c += onset[i] * onset[i + lag];
    corr[lag] = c / energy;
  }
  // Find local maxima (lag with neighbours both lower).
  const peaks = [];
  for (let lag = minLag + 1; lag <= maxLag - 1; lag++) {
    if (corr[lag] > corr[lag - 1] && corr[lag] > corr[lag + 1] && corr[lag] > 0) {
      peaks.push({ lag, c: corr[lag], bpm: (60 * FRAMES_PER_SEC) / lag });
    }
  }
  if (peaks.length === 0) return { bpm: null, confidence: 0 };
  peaks.sort((a, b) => b.c - a.c);
  const top = peaks[0];

  // Resolve octave ambiguity. Onset autocorrelation is naturally ambiguous
  // between bpm/2 ↔ bpm ↔ 2·bpm. We prefer peaks in the 90–150 "musical
  // centre" when a half/double of the top peak exists there with reasonable
  // correlation strength. Threshold is intentionally loose (40% of top corr)
  // because the half-tempo peak is almost always slightly stronger than the
  // true tempo peak.
  let chosen = top;
  const inCentre = (b) => b >= 90 && b <= 150;
  if (!inCentre(top.bpm)) {
    const candidates = [
      ...peaks.filter(p => Math.abs(p.bpm - top.bpm * 2) < 8 && p.c >= top.c * 0.4),
      ...peaks.filter(p => Math.abs(p.bpm - top.bpm * 1.5) < 8 && p.c >= top.c * 0.5),
      ...peaks.filter(p => Math.abs(p.bpm - top.bpm / 2) < 6 && p.c >= top.c * 0.5),
    ];
    const inCentreCand = candidates.find(p => inCentre(p.bpm));
    if (inCentreCand) chosen = inCentreCand;
  }

  const second = peaks.find(p => p !== chosen) || { c: 0 };
  const confidence = chosen.c > 0
    ? Math.max(0, Math.min(1, (chosen.c - Math.max(0, second.c)) / Math.max(0.05, chosen.c)))
    : 0;
  return { bpm: Math.round(chosen.bpm * 10) / 10, confidence: Math.round(confidence * 100) / 100 };
}

function bpmBin(bpm) {
  if (bpm == null) return "unknown";
  if (bpm <= 90) return "slow";
  if (bpm <= 120) return "mid";
  if (bpm <= 150) return "fast";
  return "driving";
}

// ---- Template parsing -----------------------------------------------------

function parseTemplate(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  // Find every element with class="… scene …" + data-start + data-duration.
  // Templates use both <div> and <section>, so match any tag. Attributes can
  // be in any order; the regex captures the attrs we need from each opening tag.
  const sceneRe = /<(?:div|section|article)\b([^>]*\bclass="[^"]*\bscene\b[^"]*"[^>]*)>/g;
  const scenes = [];
  let m;
  while ((m = sceneRe.exec(html))) {
    const attrs = m[1];
    const ds = /data-start="([\d.]+)"/.exec(attrs);
    const dd = /data-duration="([\d.]+)"/.exec(attrs);
    const ti = /data-track-index="(\d+)"/.exec(attrs);
    if (!ds || !dd) continue;
    const trackIndex = ti ? parseInt(ti[1], 10) : 0;
    if (trackIndex === 0) continue; // skip the root timeline wrapper.
    scenes.push({
      start: parseFloat(ds[1]),
      duration: parseFloat(dd[1]),
    });
  }
  // Cut points = scene boundaries (start and start+duration). De-dup, sort.
  const cuts = new Set();
  for (const s of scenes) {
    cuts.add(Math.round(s.start * 10) / 10);
    cuts.add(Math.round((s.start + s.duration) * 10) / 10);
  }
  return {
    scenes,
    cuts: Array.from(cuts).sort((a, b) => a - b),
  };
}

// ---- Scoring --------------------------------------------------------------

function scoreTrack(track, template) {
  const profile = VIBE_PROFILES[template.vibe];
  const reasons = [];
  let score = 0;

  // Duration: must cover the comp.
  if (track.duration_sec >= template.seconds) {
    score += 20;
  } else if (track.duration_sec >= template.seconds * 0.85) {
    score += 10;
    reasons.push(`short by ${(template.seconds - track.duration_sec).toFixed(1)}s — needs loop`);
  } else {
    score -= 5;
    reasons.push(`too short (${track.duration_sec.toFixed(1)}s vs ${template.seconds}s comp)`);
  }

  // BPM fit. Two-tier: in-range > tolerated. Prefer curator BPM (set by
  // bpm_used in main()) — the estimator is a fallback for un-curated tracks.
  const bpm = track.bpm_used;
  if (bpm == null) {
    score += 5; // partial credit — at least no clash.
    reasons.push("BPM unknown");
  } else {
    const [lo, hi] = profile.bpm_range;
    if (bpm >= lo && bpm <= hi) {
      score += 30;
    } else {
      const distance = bpm < lo ? lo - bpm : bpm - hi;
      if (distance <= 10) { score += 18; reasons.push(`BPM ${Math.round(bpm)} just outside ${lo}-${hi}`); }
      else if (distance <= 25) { score += 8; reasons.push(`BPM ${Math.round(bpm)} off (${lo}-${hi})`); }
      else { score -= 10; reasons.push(`BPM ${Math.round(bpm)} clashes with ${lo}-${hi}`); }
    }
    // Reward proximity to ideal.
    const idealDelta = Math.abs(bpm - profile.bpm_ideal);
    score += Math.max(0, 10 - idealDelta * 0.4);
  }

  // Energy band — reward tracks whose RMS std lands inside the comfort band.
  const std = track.rms_std;
  if (std != null) {
    const { min_std, max_std } = profile.energy_band;
    if (std >= min_std && std <= max_std) {
      score += 20;
    } else if (std < min_std) {
      score += 8;
      reasons.push("energy very flat — may feel dead under cuts");
    } else {
      const over = std - max_std;
      if (over <= 0.05) { score += 10; reasons.push("energy slightly busy"); }
      else { score -= 5; reasons.push("energy too dynamic — may fight narration"); }
    }
  }

  // Drops/swells alignment with cut grid (within 0.6 s tolerance).
  // Drops = sharp RMS jumps (kicks, cymbal crashes) — these fight narration
  // unless intended for kinetic templates.
  // Swells = slow monotonic builds (string crescendos) — these *support*
  // documentary/warm storytelling, so we don't penalise their density.
  const drops = track.drops || [];
  const swells = track.swells || [];
  const cuts = template.cuts;

  if (profile.drops_preferred) {
    // Kinetic: count cut-aligned drops AND swells, reward strongly.
    const events = [...drops, ...swells];
    if (events.length === 0) {
      score -= 5;
      reasons.push("no drops/swells — cuts won't get help from the music");
    } else {
      let aligned = 0;
      for (const e of events) {
        for (const c of cuts) {
          if (Math.abs(e - c) <= 0.6) { aligned++; break; }
        }
      }
      const ratio = aligned / Math.min(events.length, cuts.length);
      score += Math.round(ratio * 18);
      if (aligned > 0) reasons.push(`${aligned} drop/swell near cuts`);
    }
  } else {
    // Calm vibes: penalise SHARP drops but accept swells as cinematic shape.
    const dropDensity = drops.length / track.duration_sec;
    const swellDensity = swells.length / track.duration_sec;
    if (dropDensity > BUMP_DENSITY_QUIET_LIMIT) {
      score -= 6;
      reasons.push(`sharp jumps (${dropDensity.toFixed(2)} drops/s) — may fight narration`);
    } else {
      score += 4;
    }
    // Swells are a virtue here — small bonus, capped.
    if (swellDensity > 0.05) {
      score += 4;
      reasons.push(`cinematic swells (${swellDensity.toFixed(2)}/s)`);
    }
  }

  // Curator hint — if shortlist tags this track in the SAME vibe, bonus.
  if (track.curator_vibe && track.curator_vibe === template.vibe) {
    score += 12;
    reasons.push("curated for this vibe");
  } else if (track.curator_vibe && track.curator_vibe !== template.vibe) {
    score -= 4;
    reasons.push(`curated for ${track.curator_vibe}`);
  }

  return { score: Math.round(score), reasons };
}

// ---- Curator metadata loader ---------------------------------------------

function loadCuratorMap() {
  const dir = path.join(projectRoot, "assets", "music-shortlists");
  const map = {}; // basename(local_file) -> { vibe, character, best_for, bpm_curated, duration_curated }
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const vibe = data.template;
    for (const t of data.tracks || []) {
      if (!t.local_file) continue;
      const base = path.basename(t.local_file);
      map[base] = {
        vibe,
        slug: t.slug,
        title: t.title,
        character: t.character,
        best_for: t.best_for,
        bpm_curated: t.bpm,
        duration_curated: t.duration,
        tags: t.tags || [],
      };
    }
  }
  return map;
}

// ---- Main -----------------------------------------------------------------

async function main() {
  const wantJsonStdout = process.argv.includes("--json");
  const ffmpegPath = await getFfmpegPath();

  const musicDir = path.join(projectRoot, "assets", "music");
  const mp3s = fs.readdirSync(musicDir)
    .filter(f => f.endsWith(".mp3"))
    .sort();

  process.stderr.write(`[align] analyzing ${mp3s.length} tracks via ${ffmpegPath}\n`);

  const curator = loadCuratorMap();
  const tracks = [];
  const failures = [];
  const duplicates = []; // groups of files with identical decoded RMS fingerprint.

  for (const f of mp3s) {
    const full = path.join(musicDir, f);
    process.stderr.write(`[align] ${f} ... `);
    try {
      const samples = await decodeMonoPcm(ffmpegPath, full);
      if (!samples || samples.length < SAMPLE_RATE * 5) {
        throw new Error(`decoded ${samples?.length ?? 0} samples — too short`);
      }
      const duration_sec = samples.length / SAMPLE_RATE;
      const env = rmsWindows(samples);
      const stats = statsOf(env);
      const { drops, swells } = detectDropsSwells(env);
      const bpmEst = estimateBpm(samples);
      const meta = curator[f] || null;
      const bpm_curated = meta?.bpm_curated ?? null;
      // Trust curator BPM when it exists — onset-autocorrelation alone is
      // reliable for clear 4-on-the-floor electronic tracks but mis-locks to
      // half-tempo on tracks with strong bar-level chord motion. Estimator
      // is a fallback for un-curated tracks.
      const bpm_estimated = bpmEst.confidence >= 0.10 ? bpmEst.bpm : null;
      const bpm_used = bpm_curated ?? bpm_estimated;
      const bpm_source = bpm_curated != null ? "curator" : (bpm_estimated != null ? "estimator" : "unknown");
      tracks.push({
        file: f,
        path: `assets/music/${f}`,
        duration_sec: Math.round(duration_sec * 10) / 10,
        bpm_used,
        bpm_source,
        bpm_estimated,
        bpm_estimate_confidence: bpmEst.confidence,
        bpm_bin: bpmBin(bpm_used),
        bpm_curated,
        rms_mean: Math.round(stats.mean * 10000) / 10000,
        rms_std: Math.round(stats.std * 10000) / 10000,
        rms_min: Math.round(stats.min * 10000) / 10000,
        rms_max: Math.round(stats.max * 10000) / 10000,
        drops,
        swells,
        curator_vibe: meta?.vibe ?? null,
        curator_slug: meta?.slug ?? null,
        curator_title: meta?.title ?? null,
        curator_character: meta?.character ?? null,
        curator_best_for: meta?.best_for ?? null,
        curator_tags: meta?.tags ?? [],
      });
      process.stderr.write(`ok dur=${duration_sec.toFixed(1)}s bpm=${bpm_used ?? "?"} (${bpm_source}) est=${bpm_estimated ?? "?"} conf=${bpmEst.confidence.toFixed(2)} std=${stats.std.toFixed(3)} drops=${drops.length} swells=${swells.length}\n`);
    } catch (err) {
      failures.push({ file: f, error: err.message });
      process.stderr.write(`FAIL ${err.message}\n`);
    }
  }

  // Cheap duplicate detection on (duration, rms_mean, drops, swells).
  // Catches accidental dupes like documentary-top vs documentary-01-strings.
  {
    const sigToFiles = new Map();
    for (const t of tracks) {
      const sig = `${t.duration_sec.toFixed(1)}|${t.rms_mean.toFixed(4)}|${t.drops.length}|${t.swells.length}`;
      if (!sigToFiles.has(sig)) sigToFiles.set(sig, []);
      sigToFiles.get(sig).push(t.file);
    }
    for (const [sig, files] of sigToFiles) {
      if (files.length > 1) duplicates.push({ signature: sig, files });
    }
  }

  // Parse all templates.
  const templatesDir = path.join(projectRoot, "compositions", "templates");
  const templateMap = {}; // file basename -> { vibe, seconds, scenes, cuts }
  for (const tplFile of Object.keys(TEMPLATE_REGISTRY).map(k => `${k}.html`)) {
    const full = path.join(templatesDir, tplFile);
    if (!fs.existsSync(full)) {
      process.stderr.write(`[align] template missing: ${tplFile}\n`);
      continue;
    }
    const parsed = parseTemplate(full);
    const reg = TEMPLATE_REGISTRY[tplFile.replace(/\.html$/, "")];
    templateMap[tplFile] = {
      file: tplFile,
      name: tplFile.replace(/\.html$/, ""),
      vibe: reg.vibe,
      seconds: reg.seconds,
      scenes: parsed.scenes,
      cuts: parsed.cuts,
    };
  }

  // Score every (template, track) pair.
  const matrix = {};
  for (const tpl of Object.values(templateMap)) {
    const ranked = tracks
      .map(t => ({ ...scoreTrack(t, tpl), track: t }))
      .sort((a, b) => b.score - a.score);
    matrix[tpl.name] = {
      vibe: tpl.vibe,
      seconds: tpl.seconds,
      cuts: tpl.cuts,
      scenes: tpl.scenes,
      ranked: ranked.map(r => ({
        file: r.track.file,
        score: r.score,
        reasons: r.reasons,
      })),
    };
  }

  // Build outputs.
  const docsDir = path.join(projectRoot, "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  const mdPath = path.join(docsDir, "music-template-alignment.md");
  const jsonPath = path.join(projectRoot, "assets", "music", "alignment.json");

  const fullJson = {
    schema_version: 1,
    generated_by: "scripts/analyze-music-alignment.mjs",
    tracks,
    templates: matrix,
    duplicates,
    failures,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(fullJson, null, 2));

  // Markdown report.
  const lines = [];
  lines.push("# Music + scene-timing alignment library");
  lines.push("");
  lines.push("Auto-generated by `scripts/analyze-music-alignment.mjs`. Re-run after");
  lines.push("adding tracks to `assets/music/` or editing template scene timing.");
  lines.push("");
  lines.push("## How tracks were scored");
  lines.push("");
  lines.push("Each track is decoded to mono 8 kHz PCM, then we extract:");
  lines.push("");
  lines.push("- **Duration** (samples / SR)");
  lines.push("- **RMS envelope** in 1 s windows (mean, std, min, max)");
  lines.push("- **Drops** (>30% RMS jump between adjacent windows)");
  lines.push("- **Swells** (monotonic >25% rise across a 5 s window)");
  lines.push("- **BPM** via onset-autocorrelation in the 50–180 BPM range");
  lines.push("");
  lines.push("Scoring favours BPM-in-range (+30), energy std inside the vibe's comfort");
  lines.push("band (+20), drops/swells landing within 0.6 s of a scene cut (kinetic only),");
  lines.push("duration covering the comp (+20), and curator-vibe match (+12).");
  lines.push("");
  lines.push("## Per-track summary");
  lines.push("");
  lines.push("| Track | Dur (s) | BPM (used) | Source | BPM est (conf) | RMS std | Drops | Swells | Vibe (curator) |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const t of tracks) {
    const est = t.bpm_estimated != null ? `${t.bpm_estimated} (${t.bpm_estimate_confidence.toFixed(2)})` : "—";
    lines.push(`| \`${t.file}\` | ${t.duration_sec} | ${t.bpm_used ?? "?"} | ${t.bpm_source} | ${est} | ${t.rms_std} | ${t.drops.length} | ${t.swells.length} | ${t.curator_vibe ?? "—"} |`);
  }
  lines.push("");
  if (failures.length) {
    lines.push("### Failed to analyze");
    for (const f of failures) lines.push(`- \`${f.file}\` — ${f.error}`);
    lines.push("");
  }
  if (duplicates.length) {
    lines.push("### Detected duplicate audio");
    lines.push("");
    lines.push("Files with identical (duration, mean RMS, drops, swells) fingerprints:");
    lines.push("");
    for (const d of duplicates) {
      lines.push(`- ${d.files.map(f => `\`${f}\``).join(", ")}`);
    }
    lines.push("");
  }

  lines.push("## Per-template top-5 recommendations");
  lines.push("");
  for (const [tplName, info] of Object.entries(matrix)) {
    lines.push(`### \`${tplName}\` — vibe \`${info.vibe}\`, ${info.seconds}s`);
    lines.push("");
    lines.push(`Cut grid (s): ${info.cuts.join(", ")}`);
    lines.push("");
    lines.push("| Rank | Track | Score | Notes |");
    lines.push("|---|---|---|---|");
    info.ranked.slice(0, 5).forEach((r, i) => {
      const reasons = r.reasons.length ? r.reasons.join("; ") : "(clean fit)";
      lines.push(`| ${i + 1} | \`${r.file}\` | ${r.score} | ${reasons} |`);
    });
    lines.push("");
  }

  fs.writeFileSync(mdPath, lines.join("\n") + "\n");

  process.stderr.write(`\n[align] wrote ${path.relative(projectRoot, mdPath)}\n`);
  process.stderr.write(`[align] wrote ${path.relative(projectRoot, jsonPath)}\n`);
  if (wantJsonStdout) process.stdout.write(JSON.stringify(fullJson, null, 2) + "\n");
}

main().catch(err => {
  console.error("[align] FATAL", err);
  process.exit(2);
});
