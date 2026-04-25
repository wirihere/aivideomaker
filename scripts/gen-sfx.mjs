// Procedural sound-design library — synthesize whoosh / tick / impact / pad
// presets entirely via ffmpeg's `lavfi` audio sources and filters. No npm
// deps, no Tone.js, no sample packs.
//
// The research is unambiguous: sound design accounts for ~50% of perceived
// production value, and amateur work tends to have either silent transitions
// or cheap stock SFX that don't match the brand. A small library of clean,
// procedurally-synthesized hits — pre-rendered to assets/sfx/ — fixes both.
//
// Usage:
//   node scripts/gen-sfx.mjs              # generate every preset
//   node scripts/gen-sfx.mjs whoosh-up    # generate one preset
//   node scripts/gen-sfx.mjs --list       # list presets
//   node scripts/gen-sfx.mjs --pitch=+2 whoosh-up  # rare pitch override
//
// Presets:
//   whoosh-up       — filtered noise sweep, 400ms, for upward transitions
//   whoosh-down     — same, downward, for resolves / closing scenes
//   whoosh-soft     — gentle 600ms, for slow camera moves
//   tick            — 80ms UI click, for micro-beats and stat reveals
//   tick-soft       — 120ms wood-block-ish, for paragraph beats
//   impact          — kick + clipped noise, 350ms, for word/logo lands
//   impact-deep     — sub-bass thump + reverb tail, 800ms, for hero hits
//   ding            — bell-tone, 600ms, for positive callouts
//   sweep-rise      — 1.2s rising tone+filter, for build-ups
//   sweep-fall      — 1.2s falling tone+filter, for resolves
//   pad-warm        — 4s ambient bed loop, for breathing-room scenes
//   pad-cool        — 4s minor-key ambient bed
//
// Output: assets/sfx/<preset>.wav (44.1kHz, 16-bit, mono)
// Re-run is idempotent — files are overwritten in place.

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "assets", "sfx");

// Each preset is a function returning { duration, filterChain }.
// filterChain is a single ffmpeg `-filter_complex` graph that ends in [out].
// We always finalize with: -map [out] -ac 1 -ar 44100 -t <duration>

const PRESETS = {
  // --- Whooshes — filtered noise sweeps ----------------------------------
  "whoosh-up": () => ({
    duration: 0.4,
    graph: [
      "anoisesrc=color=pink:amplitude=0.6[n]",
      "[n]highpass=f=200[h]",
      "[h]lowpass=f=2200[l]",
      "[l]volume=volume='0.0 + 0.95*t/0.4':eval=frame[v]",
      "[v]asetrate=44100*1.4,aresample=44100[s]",
      "[s]afade=t=in:st=0:d=0.05,afade=t=out:st=0.32:d=0.08[out]",
    ].join(";"),
  }),
  "whoosh-down": () => ({
    duration: 0.4,
    graph: [
      "anoisesrc=color=pink:amplitude=0.6[n]",
      "[n]highpass=f=200[h]",
      "[h]lowpass=f=2200[l]",
      "[l]volume=volume='0.95 - 0.95*t/0.4':eval=frame[v]",
      "[v]asetrate=44100*0.7,aresample=44100[s]",
      "[s]afade=t=in:st=0:d=0.05,afade=t=out:st=0.32:d=0.08[out]",
    ].join(";"),
  }),
  "whoosh-soft": () => ({
    duration: 0.6,
    graph: [
      "anoisesrc=color=brown:amplitude=0.5[n]",
      "[n]bandpass=f=900:width_type=h:w=600[b]",
      "[b]volume=volume='sin(PI*t/0.6)':eval=frame[v]",
      "[v]afade=t=in:st=0:d=0.1,afade=t=out:st=0.45:d=0.15[out]",
    ].join(";"),
  }),

  // --- Ticks — short UI clicks -------------------------------------------
  tick: () => ({
    duration: 0.08,
    graph: [
      "sine=frequency=4000:sample_rate=44100[s]",
      "anoisesrc=color=white:amplitude=0.4[n]",
      "[s][n]amix=inputs=2:weights='0.6 0.4'[m]",
      "[m]volume=volume='exp(-t*60)':eval=frame[v]",
      "[v]highpass=f=2000[out]",
    ].join(";"),
  }),
  "tick-soft": () => ({
    duration: 0.12,
    graph: [
      "sine=frequency=1200:sample_rate=44100[s1]",
      "sine=frequency=2400:sample_rate=44100[s2]",
      "[s1][s2]amix=inputs=2:weights='0.7 0.3'[m]",
      "[m]volume=volume='exp(-t*30)':eval=frame[v]",
      "[v]bandpass=f=1500:width_type=h:w=2000[out]",
    ].join(";"),
  }),

  // --- Impacts — kick + noise burst --------------------------------------
  impact: () => ({
    duration: 0.35,
    graph: [
      "sine=frequency=70:sample_rate=44100[k]",
      "[k]volume=volume='exp(-t*8)':eval=frame[ke]",
      "anoisesrc=color=white:amplitude=0.3[n]",
      "[n]highpass=f=600[nh]",
      "[nh]volume=volume='exp(-t*40)':eval=frame[ne]",
      "[ke][ne]amix=inputs=2:weights='1.0 0.7'[m]",
      "[m]volume=1.4[out]",
    ].join(";"),
  }),
  "impact-deep": () => ({
    duration: 0.8,
    graph: [
      "sine=frequency=50:sample_rate=44100[k]",
      "[k]volume=volume='exp(-t*4)':eval=frame[ke]",
      "sine=frequency=110:sample_rate=44100[k2]",
      "[k2]volume=volume='exp(-t*6)':eval=frame[k2e]",
      "anoisesrc=color=brown:amplitude=0.3[n]",
      "[n]volume=volume='exp(-t*20)':eval=frame[ne]",
      "[ke][k2e][ne]amix=inputs=3:weights='1.0 0.6 0.5'[m]",
      "[m]aecho=0.6:0.5:80:0.4[out]",
    ].join(";"),
  }),

  // --- Tonal hits --------------------------------------------------------
  ding: () => ({
    duration: 0.6,
    graph: [
      "sine=frequency=880:sample_rate=44100[s1]",
      "sine=frequency=1320:sample_rate=44100[s2]",
      "sine=frequency=1760:sample_rate=44100[s3]",
      "[s1][s2][s3]amix=inputs=3:weights='1.0 0.5 0.25'[m]",
      "[m]volume=volume='exp(-t*4)':eval=frame[v]",
      "[v]aecho=0.6:0.4:120:0.3[out]",
    ].join(";"),
  }),

  // --- Sweeps — for build-ups / resolves --------------------------------
  "sweep-rise": () => ({
    duration: 1.2,
    graph: [
      "anoisesrc=color=pink:amplitude=0.5[n]",
      "[n]volume=volume='t/1.2':eval=frame[ng]",
      "sine=frequency=200:sample_rate=44100[s]",
      "[s]asetrate=44100,atempo=1.0,volume=volume='0.6*(t/1.2)^2':eval=frame[sg]",
      "[ng][sg]amix=inputs=2[m]",
      "[m]bandpass=f=1500:w=2000[out]",
    ].join(";"),
  }),
  "sweep-fall": () => ({
    duration: 1.2,
    graph: [
      "anoisesrc=color=pink:amplitude=0.5[n]",
      "[n]volume=volume='1-(t/1.2)':eval=frame[ng]",
      "sine=frequency=200:sample_rate=44100[s]",
      "[s]volume=volume='0.6*(1-t/1.2)^2':eval=frame[sg]",
      "[ng][sg]amix=inputs=2[m]",
      "[m]bandpass=f=900:w=1500[out]",
    ].join(";"),
  }),

  // --- Ambient pads — long looping bed ------------------------------------
  "pad-warm": () => ({
    duration: 4.0,
    graph: [
      "sine=frequency=146.83:sample_rate=44100[d3]",   // D3
      "sine=frequency=220.00:sample_rate=44100[a3]",   // A3
      "sine=frequency=293.66:sample_rate=44100[d4]",   // D4 — D-major root
      "sine=frequency=369.99:sample_rate=44100[fs4]",  // F#4 — major 3rd
      "[d3][a3][d4][fs4]amix=inputs=4:weights='0.5 0.4 0.4 0.3'[m]",
      "[m]lowpass=f=1200[lp]",
      "[lp]tremolo=f=0.4:d=0.18[t]",
      "[t]volume=0.20,afade=t=in:st=0:d=0.6,afade=t=out:st=3.4:d=0.6[out]",
    ].join(";"),
  }),
  "pad-cool": () => ({
    duration: 4.0,
    graph: [
      "sine=frequency=130.81:sample_rate=44100[c3]",   // C3
      "sine=frequency=196.00:sample_rate=44100[g3]",   // G3
      "sine=frequency=311.13:sample_rate=44100[ds4]",  // D#4 — minor 3rd
      "sine=frequency=466.16:sample_rate=44100[as4]",  // A#4 — minor 7th
      "[c3][g3][ds4][as4]amix=inputs=4:weights='0.5 0.4 0.35 0.25'[m]",
      "[m]lowpass=f=900[lp]",
      "[lp]tremolo=f=0.3:d=0.15[t]",
      "[t]volume=0.20,afade=t=in:st=0:d=0.6,afade=t=out:st=3.4:d=0.6[out]",
    ].join(";"),
  }),
};

// --- Helpers --------------------------------------------------------------

function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  return "ffmpeg";
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    p.stderr.on("data", d => { stderr += d.toString(); });
    p.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} exited ${code}\n${stderr.split("\n").slice(-10).join("\n")}`));
    });
    p.on("error", reject);
  });
}

async function generate(name) {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown preset: ${name}`);
  const { duration, graph } = preset();
  const out = path.join(outDir, `${name}.wav`);
  const args = [
    "-y",
    "-f", "lavfi",
    "-i", "anullsrc=r=44100:cl=mono",      // dummy carrier so durations resolve
    "-filter_complex", graph,
    "-map", "[out]",
    "-ac", "1",
    "-ar", "44100",
    "-c:a", "pcm_s16le",
    "-t", String(duration),
    out,
  ];
  await run(ffmpegPath(), args);
  const sz = fs.statSync(out).size;
  console.log(`  ✓ ${name.padEnd(14)} ${duration.toFixed(2)}s   ${(sz/1024).toFixed(1)} KB`);
}

// --- CLI ------------------------------------------------------------------

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const positional = argv.filter(a => !a.startsWith("--"));

if (flags.list) {
  console.log("Available SFX presets:");
  for (const name of Object.keys(PRESETS)) console.log(`  ${name}`);
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

const targets = positional.length ? positional : Object.keys(PRESETS);
for (const name of targets) {
  if (!PRESETS[name]) {
    console.error(`Unknown preset: ${name}. Use --list to see available.`);
    process.exit(2);
  }
}

console.log(`▶ generating ${targets.length} SFX preset${targets.length === 1 ? "" : "s"} → ${outDir}`);
for (const name of targets) {
  await generate(name);
}
console.log("✓ done");
