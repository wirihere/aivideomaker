// Spectral ducking ("frequency-aware sidechain") — library only.
//
// Plain language: when a comp has BOTH a voiceover and a music bed, flat
// amix mushes them — loud music buries words, loud voice drowns the song.
// We split the music into low / mid / high bands, sidechain-compress only
// the MID band (300–4000 Hz where speech sits), and re-sum. Voice cuts
// through, the bass groove and high shimmer stay full-volume.
//
// CLI lives at scripts/audio-duck.mjs — this file is pure: no spawn, no fs
// (apart from the optional buildToneTestFixtures helper which DOES spawn).
//
// Public API:
//   buildDuckFilterGraph({ style, threshold, ratio, attack, release,
//                          voiceLevelDb, musicLevelDb,
//                          voiceInput="0:a", musicInput="1:a", outLabel="out" })
//     → { filterGraph, params, outLabel }
//   STYLES — preset table (see below).  resolveStyleParams(name).
//   buildToneTestFixtures({ outDir, ffmpeg, duration }) — synth fixture.
//
// Style presets:
//   | style      | threshold | ratio | attack  | release | feel              |
//   | podcast    | 0.05      | 8     | 20 ms   | 400 ms  | aggressive        |
//   | cinematic  | 0.10      | 4     | 50 ms   | 800 ms  | gentle, present   |
//   | tiktok     | 0.03      | 12    | 5 ms    | 200 ms  | snappy, energetic |
//
// Determinism: acrossover + sidechaincompress + amix are deterministic.
// Same audio + same params → same output bytes.
//
// Filter graph (simplified — actual graph adds aformat pins for layout):
//   [music]acrossover=split=300 4000[mlow][mmid][mhigh];
//   [voice]asplit=2[vmix][vsc];
//   [mmid][vsc]sidechaincompress=threshold=T:ratio=R:attack=A:release=RL[mducked];
//   [mlow][mducked][mhigh]amix=inputs=3:duration=longest:dropout_transition=0[mfinal];
//   [vmix][mfinal]amix=inputs=2:duration=longest:dropout_transition=0[out]
//
// The aformat pins (sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo)
// are required: sidechaincompress refuses mismatched inputs, and asplit /
// acrossover branches drop layout metadata in the bundled 2018 ffmpeg.
//
// ---------------------------------------------------------------------------
// FUTURE INTEGRATION (do not ship in this commit) — render-vite.mjs Phase 2:
//   Today the Phase-2 mux runs every <audio> through flat amix. Opt-in is
//   the `data-audio-role` attribute:
//     <audio data-audio-role="voice" ...>  <audio data-audio-role="music" ...>
//   When the DOM scan finds exactly one of each, the mux should:
//     1. Build the existing volume+adelay chain → [vmix] / [music] labels.
//     2. Call buildDuckFilterGraph({ voiceInput, musicInput, outLabel })
//        and splice its filterGraph into the -filter_complex.
//     3. Map [duckedout] in place of [aout]. SFX either go through the flat
//        amix BEFORE the duck, or sum in on a parallel chain after.
//   Comps without data-audio-role keep flat amix → backwards-compatible.
//   Wiring point: scripts/render-vite.mjs, search for
//   `// amix sums real tracks + the silence track`.
// ---------------------------------------------------------------------------

import path from "path";
import { spawn } from "child_process";

export const STYLES = Object.freeze({
  podcast:   { threshold: 0.05, ratio: 8,  attack: 20, release: 400 },
  cinematic: { threshold: 0.10, ratio: 4,  attack: 50, release: 800 },
  tiktok:    { threshold: 0.03, ratio: 12, attack: 5,  release: 200 },
});

export const DEFAULT_STYLE = "podcast";
export const SPLIT_LOW_HZ  = 300;
export const SPLIT_HIGH_HZ = 4000;

export function resolveStyleParams(name = DEFAULT_STYLE) {
  const preset = STYLES[name];
  if (!preset) {
    throw new Error(
      `audio-duck: unknown style "${name}". ` +
      `Valid: ${Object.keys(STYLES).join(", ")}.`
    );
  }
  return { ...preset };
}

// Format a number for ffmpeg without locale-introduced commas / trailing
// zeros, and without a leading "+" on positive dB values (ffmpeg accepts
// signed dB but it's cleaner to omit the sign for non-negatives).
function fmt(n) {
  if (!Number.isFinite(n)) return "0";
  return Number(n.toFixed(4)).toString();
}

/**
 * Build the spectral-ducking ffmpeg filter graph.
 *
 * @param {object} opts
 * @param {string} [opts.style="podcast"]   Preset name (see STYLES).
 * @param {number} [opts.threshold]         Override preset threshold (linear, 0..1).
 * @param {number} [opts.ratio]             Override preset ratio (1..20).
 * @param {number} [opts.attack]            Override preset attack (ms).
 * @param {number} [opts.release]           Override preset release (ms).
 * @param {number} [opts.voiceLevelDb=0]    Voice trim in dB (0 = unity).
 * @param {number} [opts.musicLevelDb=0]    Music trim in dB (0 = unity).
 * @param {string} [opts.voiceInput="0:a"]  Filter-graph input label for voice.
 * @param {string} [opts.musicInput="1:a"]  Filter-graph input label for music.
 * @param {string} [opts.outLabel="out"]    Output label (without brackets).
 * @returns {{ filterGraph: string, params: object, outLabel: string }}
 */
export function buildDuckFilterGraph(opts = {}) {
  const styleName = opts.style ?? DEFAULT_STYLE;
  const preset = resolveStyleParams(styleName);
  const params = {
    threshold: opts.threshold ?? preset.threshold,
    ratio:     opts.ratio     ?? preset.ratio,
    attack:    opts.attack    ?? preset.attack,
    release:   opts.release   ?? preset.release,
    voiceLevelDb: opts.voiceLevelDb ?? 0,
    musicLevelDb: opts.musicLevelDb ?? 0,
    splitLowHz:  SPLIT_LOW_HZ,
    splitHighHz: SPLIT_HIGH_HZ,
    style: styleName,
  };

  const v = opts.voiceInput ?? "0:a";
  const m = opts.musicInput ?? "1:a";
  const O = opts.outLabel ?? "out";

  // FMT pin: every branch into sidechaincompress (and acrossover/asplit
  // which can drop layout in the 2018 build) re-asserts stereo 44.1 kHz
  // fltp. Without this, mismatched inputs (e.g. mono 24 kHz voice + stereo
  // 44.1 kHz music) error with "filters could not choose their formats".
  const FMT = "aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo";
  const T = fmt(params.threshold);
  const R = fmt(params.ratio);
  const A = fmt(params.attack);
  const RL = fmt(params.release);

  const segments = [
    `[${v}]${FMT}[vnorm]`,
    `[${m}]${FMT}[mnorm]`,
    `[mnorm]acrossover=split=${SPLIT_LOW_HZ} ${SPLIT_HIGH_HZ}[mlow][mmid][mhigh]`,
    `[vnorm]asplit=2[vmix_pre][vsc_pre]`,
    `[vmix_pre]${FMT}[vmix]`,
    `[vsc_pre]${FMT}[vsc]`,
    `[mmid]${FMT}[mmidp]`,
    `[mmidp][vsc]sidechaincompress=threshold=${T}:ratio=${R}:attack=${A}:release=${RL}[mducked]`,
    `[mlow][mducked][mhigh]amix=inputs=3:duration=longest:dropout_transition=0[mfinal]`,
  ];

  // Optional level trims — skip the volume node when 0 dB.
  let voiceFinal = "vmix";
  if (params.voiceLevelDb !== 0) {
    segments.push(`[vmix]volume=${fmt(params.voiceLevelDb)}dB[vlvl]`);
    voiceFinal = "vlvl";
  }
  let musicFinal = "mfinal";
  if (params.musicLevelDb !== 0) {
    segments.push(`[mfinal]volume=${fmt(params.musicLevelDb)}dB[mlvl]`);
    musicFinal = "mlvl";
  }

  // Final mix: voice over ducked music.
  segments.push(
    `[${voiceFinal}][${musicFinal}]amix=inputs=2:duration=longest:dropout_transition=0[${O}]`,
  );

  return { filterGraph: segments.join(";"), params, outLabel: O };
}

/**
 * Build a synthetic voice+music pair using ffmpeg lavfi sources. Used by
 * the CLI when the operator wants to verify the graph without hunting for
 * real audio. NOT a unit test — just a fixture builder.
 *
 * @param {object} opts
 * @param {string} opts.outDir      Where to write the two MP3s.
 * @param {string} opts.ffmpeg      Resolved ffmpeg binary path.
 * @param {number} [opts.duration=5] Length in seconds.
 * @returns {Promise<{ voice: string, music: string }>}
 */
export async function buildToneTestFixtures({ outDir, ffmpeg, duration = 5 }) {
  if (!outDir) throw new Error("buildToneTestFixtures: outDir is required");
  if (!ffmpeg) throw new Error("buildToneTestFixtures: ffmpeg is required");

  const voicePath = path.join(outDir, "tone-voice.mp3");
  const musicPath = path.join(outDir, "tone-music.mp3");

  // Fake "voice": gated 1kHz sine bursts (simulates speech onsets) so the
  // sidechain has clear loud/quiet transitions to react to.
  await spawnAsync(ffmpeg, [
    "-y",
    "-f", "lavfi",
    "-i", `sine=frequency=1000:duration=${duration}`,
    "-af", "tremolo=f=2:d=0.9,volume=0.7",
    "-c:a", "libmp3lame", "-b:a", "128k",
    voicePath,
  ]);

  // Fake "music": low rumble + mid pad + high shimmer summed via amix, so
  // we can hear all 3 bands separately when ducking takes the mids out.
  await spawnAsync(ffmpeg, [
    "-y",
    "-f", "lavfi", "-i", `sine=frequency=80:duration=${duration}`,
    "-f", "lavfi", "-i", `sine=frequency=600:duration=${duration}`,
    "-f", "lavfi", "-i", `sine=frequency=8000:duration=${duration}`,
    "-filter_complex",
    "[0:a]volume=0.6[lo];[1:a]volume=0.5[mi];[2:a]volume=0.3[hi];" +
    "[lo][mi][hi]amix=inputs=3:duration=longest:dropout_transition=0[m]",
    "-map", "[m]",
    "-c:a", "libmp3lame", "-b:a", "128k",
    musicPath,
  ]);

  return { voice: voicePath, music: musicPath };
}

function spawnAsync(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "ignore", ...opts });
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited ${code}`)),
    );
    p.on("error", reject);
  });
}
