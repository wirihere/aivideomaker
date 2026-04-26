// =========================================================================
// COMBO DISCOVERY — generate 30 candidate combos from primitives
// =========================================================================
// Spins up hyperframes preview on :3007, opens tmp/combo-test.html, and for
// each of the 30 candidate recipes below:
//   1. Resets the page (fresh timeline)
//   2. Injects the recipe (textFx / effectFx / glitterFx primitive sequence)
//   3. Scrubs the timeline to t = 0.5, 1.5, 2.5, 3.5
//   4. Saves a JPG still per scrub point under combos/candidates/<name>/
//   5. Records a one-line observed-visual notes (best-effort heuristic)
// Per-candidate errors are caught — one bad recipe doesn't kill the run.
//
// At the end:
//   - combos/candidates/REPORT.md      — 30-row table + top 5 picks
//   - combos/candidates/CONTACT_SHEET.md — gallery of all stills
//
// DOES NOT modify combo-fx.js or any production files. Output-only.
//
// Usage:
//   node scripts/combo-discovery.mjs
//
// Constraints (from LEARNINGS.md §3, mirrored from combo-fx.js):
//   - Use tl.fromTo() not tl.from() for first-frame safety
//   - Deterministic only — no Math.random, no Date.now (primitives use
//     mulberry32 internally; recipes pass explicit `seed` opts)
//   - Glitch / jitter windows ≤ 0.25s

import { spawn } from "child_process";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { node as nodeBin, npxRunArgs } from "./lib/platform-bin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "combos", "candidates");
const PORT = 3007;
const SCRUB_TIMES = [0.5, 1.5, 2.5, 3.5];

// We use a file:// URL into tmp/combo-test.html (the relative ../design/* paths
// resolve against the file's directory). This avoids hyperframes preview's
// sandbox-iframe shell — the test comp doesn't need the studio chrome, and
// running directly side-steps the iframe-vs-parent window divergence that
// breaks `window.textFx` discovery.
//
// Hyperframes preview is still spawned on :3007 anyway, per the task spec —
// but only as a sentinel (so other agents on :3002 don't collide). The actual
// page loads come from file://.

// --- 30 candidate recipes -------------------------------------------------
//
// Each recipe is { name, summary, recipe, build(tl) } — `recipe` is the human-
// readable one-liner sequence; `build(tl)` runs in the page context so it has
// access to window.textFx / effectFx / glitterFx / gsap.
//
// ALL functions are stringified and Function-evaluated browser-side — keep
// them pure JS, no imports, no closures over Node-side variables.
//
// Naming conventions:
//   - emphasis-*  — mid-clip word/headline emphasis
//   - reveal-*    — entrance / hero arrival
//   - close-*     — outro / final-card / wrap
//   - cut-*       — hard transitions / scene breaks
//   - mix-*       — experimental crossbreeds
const CANDIDATES = [
  // ---------------- emphasis (cascade + glitch + stamp) -----------------
  {
    name: "emphasis-shockwave",
    summary: "Cascade words then double-glitch + ambient halo",
    recipe: "textFx.cascade → effectFx.glitchBurst×2 → glitterFx.ambient",
    build: `(tl) => {
      textFx.cascade(tl, "#headline", { at: 0.2, duration: 0.6, stagger: 0.06, distance: 90 });
      effectFx.glitchBurst(tl, "#headline", { at: 1.0, duration: 0.18 });
      effectFx.glitchBurst(tl, "#headline", { at: 1.4, duration: 0.16 });
      glitterFx.ambient(tl, "#root", { at: 1.2, duration: 2.4, count: 22, seed: 12 });
    }`,
  },
  {
    name: "emphasis-iron-stamp",
    summary: "Stamp drop, ink-bleed reverse fade then spotlight halo",
    recipe: "textFx.stamp → effectFx.inkBleed (in) → glitterFx.ambient",
    build: `(tl) => {
      textFx.stamp(tl, "#headline", { at: 0.3, duration: 0.5, fromScale: 1.7, shake: true });
      effectFx.inkBleed(tl, "#headline", { at: 0.5, duration: 0.5, from: 50, to: 0 });
      glitterFx.ambient(tl, "#root", { at: 0.9, duration: 2.6, count: 28, seed: 21 });
    }`,
  },
  {
    name: "emphasis-rgb-shock",
    summary: "Rapid double glitch alongside rack-focus snap",
    recipe: "effectFx.rackFocus → effectFx.glitchBurst×2 → textFx.stamp",
    build: `(tl) => {
      effectFx.rackFocus(tl, "#headline", { at: 0.1, duration: 0.45, from: 14, to: 0 });
      effectFx.glitchBurst(tl, "#headline", { at: 0.55, duration: 0.16 });
      textFx.stamp(tl, "#headline", { at: 0.7, duration: 0.45, fromScale: 1.35, shake: false });
      effectFx.glitchBurst(tl, "#headline", { at: 1.1, duration: 0.14 });
    }`,
  },
  {
    name: "emphasis-cascade-burst",
    summary: "Word cascade lands then mid-air glitter burst",
    recipe: "textFx.cascade → glitterFx.burst → effectFx.glitchBurst",
    build: `(tl) => {
      textFx.cascade(tl, "#headline", { at: 0.2, duration: 0.5, stagger: 0.05, distance: 70 });
      glitterFx.burst(tl, "#root", { at: 0.7, duration: 1.1, count: 50, distance: 380, seed: 33 });
      effectFx.glitchBurst(tl, "#headline", { at: 1.0, duration: 0.14 });
    }`,
  },
  {
    name: "emphasis-noir-zoom",
    summary: "Noir flash overlay + zoom-stamp + glitch lock",
    recipe: "effectFx.glitchBurst → textFx.stamp (heavy) → effectFx.rackFocus",
    build: `(tl) => {
      // Manual noir flash via a tween on a CSS variable on the host.
      const host = document.querySelector("#root");
      tl.fromTo(host,
        { filter: "brightness(0.4) saturate(0.6)" },
        { filter: "brightness(1) saturate(1)", duration: 0.5, ease: "power2.out" }, 0.1);
      textFx.stamp(tl, "#headline", { at: 0.25, duration: 0.55, fromScale: 2.0, shake: true });
      effectFx.glitchBurst(tl, "#headline", { at: 0.7, duration: 0.18 });
      effectFx.rackFocus(tl, "#headline", { at: 0.85, duration: 0.4, from: 6, to: 0 });
    }`,
  },

  // ---------------- reveal (fade + bokeh + dolly) ----------------------
  {
    name: "reveal-bokeh-pull",
    summary: "Background blurs while headline rack-pulls + dollies forward",
    recipe: "effectFx.rackFocus → effectFx.multiplaneDolly → textFx.stagger",
    build: `(tl) => {
      effectFx.rackFocus(tl, "#headline", { at: 0.0, duration: 0.7, from: 22, to: 0 });
      effectFx.multiplaneDolly(tl, "#headline", { at: 0.0, duration: 1.3, from: -160, to: 0 });
      textFx.stagger(tl, "#headline", { at: 0.5, duration: 0.45, stagger: 0.025, rotation: -8, seed: 41 });
    }`,
  },
  {
    name: "reveal-fade-typewriter",
    summary: "Soft fade-in + typewriter caption + ambient shimmer",
    recipe: "rackFocus fade → textFx.typeOn (cta) → glitterFx.ambient",
    build: `(tl) => {
      effectFx.rackFocus(tl, "#headline", { at: 0.0, duration: 0.6, from: 12, to: 0 });
      tl.fromTo("#headline", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0);
      textFx.typeOn(tl, "#cta", { at: 0.6, duration: 1.0 });
      glitterFx.ambient(tl, "#root", { at: 0.9, duration: 2.5, count: 26, seed: 51 });
    }`,
  },
  {
    name: "reveal-ink-resolve",
    summary: "Ink-bleed-warped headline resolves under multiplane dolly",
    recipe: "effectFx.multiplaneDolly → effectFx.inkBleed → textFx.stagger",
    build: `(tl) => {
      effectFx.multiplaneDolly(tl, "#headline", { at: 0.0, duration: 1.3, from: -200, to: 0 });
      effectFx.inkBleed(tl, "#headline", { at: 0.2, duration: 0.7, from: 80, to: 0 });
      textFx.stagger(tl, "#headline", { at: 0.6, duration: 0.45, stagger: 0.03, rotation: -6, seed: 61 });
    }`,
  },
  {
    name: "reveal-warp-in",
    summary: "Per-letter explode-in assembly with rack-focus settle",
    recipe: "textFx.explode (in) → effectFx.rackFocus → glitterFx.burst",
    build: `(tl) => {
      textFx.explode(tl, "#headline", { at: 0.1, duration: 0.7, mode: "in", distance: 320, seed: 71 });
      effectFx.rackFocus(tl, "#headline", { at: 0.7, duration: 0.4, from: 4, to: 0 });
      glitterFx.burst(tl, "#root", { at: 0.6, duration: 1.0, count: 36, distance: 280, seed: 71 });
    }`,
  },
  {
    name: "reveal-soft-cinemagraph",
    summary: "Pure ambient hero — dolly + ambient particles + fade",
    recipe: "effectFx.multiplaneDolly → glitterFx.ambient → glitterFx.fall",
    build: `(tl) => {
      effectFx.multiplaneDolly(tl, "#headline", { at: 0.0, duration: 3.5, from: -80, to: 0, ease: "none" });
      tl.fromTo("#headline", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0.1);
      glitterFx.ambient(tl, "#root", { at: 0.3, duration: 3.0, count: 30, seed: 81 });
      glitterFx.fall(tl, "#root", { at: 0.5, duration: 3.0, count: 18, seed: 92, wobble: 60 });
    }`,
  },
  {
    name: "reveal-spotlight-arrive",
    summary: "Spotlight opens around headline as letters cascade in",
    recipe: "effectFx.radialMask → textFx.cascade → glitterFx.ambient",
    build: `(tl) => {
      effectFx.radialMask(tl, "#root", {
        at: 0.0, duration: 0.6, from: 0, to: 60, centerX: 50, centerY: 50, feather: 18,
        clearAfter: false,
      });
      textFx.cascade(tl, "#headline", { at: 0.3, duration: 0.55, stagger: 0.06, distance: 60 });
      glitterFx.ambient(tl, "#root", { at: 0.8, duration: 2.4, count: 22, seed: 101 });
    }`,
  },

  // ---------------- close (glitter + stamp + finale) -------------------
  {
    name: "close-confetti-rain",
    summary: "Stamp lockup + double burst + sustained fall",
    recipe: "textFx.stamp → glitterFx.burst → glitterFx.fall",
    build: `(tl) => {
      textFx.stamp(tl, "#headline", { at: 0.2, duration: 0.5, fromScale: 1.6, shake: false });
      glitterFx.burst(tl, "#root", { at: 0.5, duration: 1.5, count: 90, distance: 700, gravity: 80, seed: 111 });
      glitterFx.fall(tl, "#root", { at: 0.8, duration: 2.5, count: 60, wobble: 90, seed: 121 });
    }`,
  },
  {
    name: "close-stamp-ring",
    summary: "Stamp + signal-ring + ambient lock",
    recipe: "textFx.stamp → ringPulse (manual ring) → glitterFx.ambient",
    build: `(tl) => {
      textFx.stamp(tl, "#headline", { at: 0.2, duration: 0.5, fromScale: 1.5, shake: false });
      // Manual radio ring — minimal inline ring DOM.
      const root = document.querySelector("#root");
      const ring = document.createElement("span");
      ring.style.cssText = "position:absolute;left:50%;top:50%;width:0;height:0;border:3px solid #FBF9F6;border-radius:50%;transform:translate(-50%,-50%);opacity:0.9;pointer-events:none;";
      root.appendChild(ring);
      tl.fromTo(ring, { width: 0, height: 0, opacity: 1 },
        { width: 1400, height: 1400, opacity: 0, duration: 1.0, ease: "power2.out" }, 0.5);
      glitterFx.ambient(tl, "#root", { at: 0.8, duration: 2.5, count: 28, seed: 131 });
    }`,
  },
  {
    name: "close-glitter-sweep",
    summary: "Letters scatter out then heavy burst + fade — the wrap",
    recipe: "textFx.explode (out) → glitterFx.burst → glitterFx.fall",
    build: `(tl) => {
      textFx.explode(tl, "#headline", { at: 1.5, duration: 0.7, mode: "out", distance: 450, seed: 141 });
      glitterFx.burst(tl, "#root", { at: 1.6, duration: 1.4, count: 70, distance: 600, seed: 142 });
      glitterFx.fall(tl, "#root", { at: 2.0, duration: 2.0, count: 40, wobble: 80, seed: 143 });
    }`,
  },
  {
    name: "close-iris-out",
    summary: "Spotlight closes around headline + ambient sparkle",
    recipe: "effectFx.radialMask (close) → glitterFx.ambient → textFx.stamp",
    build: `(tl) => {
      textFx.stamp(tl, "#headline", { at: 0.2, duration: 0.5, fromScale: 1.5, shake: false });
      glitterFx.ambient(tl, "#root", { at: 0.4, duration: 1.5, count: 24, seed: 151 });
      effectFx.radialMask(tl, "#root", {
        at: 1.8, duration: 0.9, from: 80, to: 0, centerX: 50, centerY: 50, feather: 20,
        clearAfter: true,
      });
    }`,
  },

  // ---------------- transitions (slamCut variants) ---------------------
  {
    name: "cut-flash-snap",
    summary: "Quick brightness flash + glitch + word cascade",
    recipe: "filter brightness flash → effectFx.glitchBurst → textFx.cascade",
    build: `(tl) => {
      const root = document.querySelector("#root");
      tl.fromTo(root,
        { filter: "brightness(2.2) saturate(1.4)" },
        { filter: "brightness(1) saturate(1)", duration: 0.35, ease: "power2.out" }, 0);
      effectFx.glitchBurst(tl, "#headline", { at: 0.15, duration: 0.18 });
      textFx.cascade(tl, "#headline", { at: 0.3, duration: 0.55, stagger: 0.05, distance: 50 });
    }`,
  },
  {
    name: "cut-vhs-jitter",
    summary: "Triple glitch with stamp re-anchor mid-window",
    recipe: "effectFx.glitchBurst → textFx.stamp → effectFx.glitchBurst×2",
    build: `(tl) => {
      effectFx.glitchBurst(tl, "#headline", { at: 0.0, duration: 0.18 });
      textFx.stamp(tl, "#headline", { at: 0.18, duration: 0.30, fromScale: 1.25, shake: false });
      effectFx.glitchBurst(tl, "#headline", { at: 0.5, duration: 0.16 });
      effectFx.glitchBurst(tl, "#headline", { at: 0.85, duration: 0.14 });
    }`,
  },
  {
    name: "cut-ink-cascade",
    summary: "Ink-bleed warp into cascade with parallel glitter wash",
    recipe: "effectFx.inkBleed → textFx.cascade → glitterFx.fall",
    build: `(tl) => {
      effectFx.inkBleed(tl, "#headline", { at: 0.0, duration: 0.55, from: 70, to: 0 });
      textFx.cascade(tl, "#headline", { at: 0.4, duration: 0.55, stagger: 0.05, distance: 60 });
      glitterFx.fall(tl, "#root", { at: 0.3, duration: 2.5, count: 32, wobble: 70, seed: 161 });
    }`,
  },
  {
    name: "cut-z-snap",
    summary: "Multiplane near-pop snap-back with glitch lock",
    recipe: "effectFx.multiplaneDolly (snap) → effectFx.glitchBurst → textFx.stagger",
    build: `(tl) => {
      effectFx.multiplaneDolly(tl, "#headline", { at: 0.0, duration: 0.5, from: 220, to: 0, ease: "expo.out" });
      effectFx.glitchBurst(tl, "#headline", { at: 0.45, duration: 0.18 });
      textFx.stagger(tl, "#headline", { at: 0.3, duration: 0.45, stagger: 0.025, rotation: -10, seed: 171 });
    }`,
  },

  // ---------------- experimental crossbreeds ---------------------------
  {
    name: "mix-shimmer-stamp",
    summary: "Background-position drift + stamp + glitter ambient",
    recipe: "shimmer drift → textFx.stamp → glitterFx.ambient",
    build: `(tl) => {
      const h = document.querySelector("#headline");
      h.style.background = "linear-gradient(90deg, #FBF9F6, #1A9E8F, #E98B6A, #FBF9F6)";
      h.style.backgroundSize = "300% 100%";
      h.style.webkitBackgroundClip = "text";
      h.style.backgroundClip = "text";
      h.style.color = "transparent";
      tl.fromTo(h, { backgroundPositionX: "0%" }, { backgroundPositionX: "300%", duration: 3.5, ease: "none" }, 0);
      textFx.stamp(tl, "#headline", { at: 0.3, duration: 0.55, fromScale: 1.5, shake: false });
      glitterFx.ambient(tl, "#root", { at: 0.6, duration: 2.6, count: 30, seed: 181 });
    }`,
  },
  {
    name: "mix-rack-glitch-stamp",
    summary: "Rack-focus blur swept across glitch beats and stamp lock",
    recipe: "effectFx.rackFocus → effectFx.glitchBurst → textFx.stamp → glitchBurst",
    build: `(tl) => {
      effectFx.rackFocus(tl, "#headline", { at: 0.0, duration: 0.4, from: 18, to: 0 });
      effectFx.glitchBurst(tl, "#headline", { at: 0.45, duration: 0.16 });
      textFx.stamp(tl, "#headline", { at: 0.6, duration: 0.45, fromScale: 1.4, shake: true });
      effectFx.glitchBurst(tl, "#headline", { at: 1.0, duration: 0.14 });
    }`,
  },
  {
    name: "mix-explode-out-burst",
    summary: "Explode out then radial burst showers into next beat",
    recipe: "textFx.explode (out) → glitterFx.burst (heavy) → ambient settle",
    build: `(tl) => {
      textFx.explode(tl, "#headline", { at: 0.2, duration: 0.5, mode: "out", distance: 380, seed: 191 });
      glitterFx.burst(tl, "#root", { at: 0.4, duration: 1.6, count: 80, distance: 700, seed: 192 });
      glitterFx.ambient(tl, "#root", { at: 1.5, duration: 2.0, count: 22, seed: 193 });
    }`,
  },
  {
    name: "mix-spotlight-glitch",
    summary: "Spotlight opens with a single sharp glitch beat at peak",
    recipe: "effectFx.radialMask → effectFx.glitchBurst → textFx.stagger",
    build: `(tl) => {
      effectFx.radialMask(tl, "#root", {
        at: 0.0, duration: 0.55, from: 0, to: 55, centerX: 50, centerY: 50, feather: 16,
        clearAfter: false,
      });
      effectFx.glitchBurst(tl, "#headline", { at: 0.6, duration: 0.18 });
      textFx.stagger(tl, "#headline", { at: 0.4, duration: 0.5, stagger: 0.03, rotation: -8, seed: 201 });
    }`,
  },
  {
    name: "mix-counter-drama",
    summary: "Stamp + ink-bleed + cta typeOn — the drama-pivot",
    recipe: "textFx.stamp → effectFx.inkBleed → textFx.typeOn (cta)",
    build: `(tl) => {
      textFx.stamp(tl, "#headline", { at: 0.2, duration: 0.5, fromScale: 1.7, shake: true });
      effectFx.inkBleed(tl, "#headline", { at: 0.3, duration: 0.5, from: 50, to: 0 });
      textFx.typeOn(tl, "#cta", { at: 0.9, duration: 1.0 });
    }`,
  },
  {
    name: "mix-typeon-burst",
    summary: "Headline typeOn + cta cascade + glitter at peak",
    recipe: "textFx.typeOn → textFx.cascade (cta) → glitterFx.burst",
    build: `(tl) => {
      textFx.typeOn(tl, "#headline", { at: 0.2, duration: 0.9 });
      textFx.cascade(tl, "#cta", { at: 1.1, duration: 0.5, stagger: 0.06, distance: 30 });
      glitterFx.burst(tl, "#root", { at: 1.0, duration: 1.0, count: 40, distance: 350, seed: 211 });
    }`,
  },
  {
    name: "mix-iris-cascade",
    summary: "Spotlight close-in, cascade in headline letters",
    recipe: "effectFx.radialMask → textFx.cascade → effectFx.glitchBurst",
    build: `(tl) => {
      effectFx.radialMask(tl, "#root", {
        at: 0.0, duration: 0.7, from: 5, to: 70, centerX: 50, centerY: 50, feather: 22,
        clearAfter: false,
      });
      textFx.cascade(tl, "#headline", { at: 0.4, duration: 0.6, stagger: 0.06, distance: 60 });
      effectFx.glitchBurst(tl, "#headline", { at: 1.0, duration: 0.16 });
    }`,
  },
  {
    name: "mix-rack-cascade",
    summary: "Wide rack-focus into cascade, ambient under everything",
    recipe: "effectFx.rackFocus → textFx.cascade → glitterFx.ambient",
    build: `(tl) => {
      effectFx.rackFocus(tl, "#headline", { at: 0.0, duration: 0.6, from: 16, to: 0 });
      textFx.cascade(tl, "#headline", { at: 0.45, duration: 0.55, stagger: 0.05, distance: 50 });
      glitterFx.ambient(tl, "#root", { at: 0.7, duration: 2.4, count: 25, seed: 221 });
    }`,
  },
  {
    name: "mix-fall-stagger",
    summary: "Glitter rains down behind a per-letter stagger pop",
    recipe: "glitterFx.fall → textFx.stagger → effectFx.glitchBurst",
    build: `(tl) => {
      glitterFx.fall(tl, "#root", { at: 0.0, duration: 3.5, count: 50, wobble: 90, seed: 231 });
      textFx.stagger(tl, "#headline", { at: 0.4, duration: 0.55, stagger: 0.03, rotation: -12, seed: 232 });
      effectFx.glitchBurst(tl, "#headline", { at: 1.1, duration: 0.16 });
    }`,
  },
  {
    name: "mix-ink-burst-stamp",
    summary: "Ink-bleed warp + glitter burst + late stamp lock",
    recipe: "effectFx.inkBleed → glitterFx.burst → textFx.stamp",
    build: `(tl) => {
      effectFx.inkBleed(tl, "#headline", { at: 0.0, duration: 0.6, from: 65, to: 0 });
      glitterFx.burst(tl, "#root", { at: 0.4, duration: 1.2, count: 50, distance: 380, seed: 241 });
      textFx.stamp(tl, "#headline", { at: 0.9, duration: 0.45, fromScale: 1.35, shake: false });
    }`,
  },
  {
    name: "mix-multistamp-glitter",
    summary: "Stamp twice with glitter spillage and a final glitch",
    recipe: "textFx.stamp → glitterFx.burst → textFx.stamp → effectFx.glitchBurst",
    build: `(tl) => {
      textFx.stamp(tl, "#headline", { at: 0.2, duration: 0.4, fromScale: 1.4, shake: true });
      glitterFx.burst(tl, "#root", { at: 0.4, duration: 1.0, count: 40, distance: 280, seed: 251 });
      textFx.stamp(tl, "#cta", { at: 0.8, duration: 0.4, fromScale: 1.25, shake: false });
      effectFx.glitchBurst(tl, "#headline", { at: 1.2, duration: 0.14 });
    }`,
  },
];

if (CANDIDATES.length !== 30) {
  console.error(`✗ Expected 30 candidates, got ${CANDIDATES.length}`);
  process.exit(2);
}

// --- helpers --------------------------------------------------------------

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function probeServer(port, attempts = 1) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(`http://localhost:${port}/`);
      if (r.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function ensureServer(port) {
  if (await probeServer(port, 1)) return null;
  console.log(`▶ spawning hyperframes preview on :${port}`);
  const child = spawn(nodeBin, npxRunArgs("hyperframes", ["preview", "--port", String(port)]), {
    cwd: projectRoot,
    detached: false,
    stdio: "ignore",
  });
  child.unref();
  // Poll up to 30s for the server to come up.
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await probeServer(port, 1)) {
      console.log(`▶ preview ready on :${port}`);
      return child;
    }
  }
  throw new Error(`hyperframes preview did not respond on :${port} within 30s`);
}

// Page-side reset helper. Clears existing #headline / #cta DOM mutations
// (textFx.splitText replaces text content with spans, so each candidate must
// see fresh elements) and gives us a brand-new paused timeline to inject into.
const RESET_PAGE_FN = `() => {
  // Restore headline + cta text content from data-* originals stored at boot.
  const h = document.querySelector("#headline");
  const c = document.querySelector("#cta");
  if (!h.dataset.origText) h.dataset.origText = "Headline";
  if (!c.dataset.origText) c.dataset.origText = "Start free trial";
  h.textContent = h.dataset.origText;
  c.textContent = c.dataset.origText;
  // Strip any inline styles that prior recipes mutated.
  h.removeAttribute("style");
  c.removeAttribute("style");
  delete h.dataset.textFxSplit;
  delete c.dataset.textFxSplit;
  // Reset the root host + scene wrappers (clear filters / classes).
  const root = document.querySelector("#root");
  root.removeAttribute("style");
  root.style.position = "relative";
  root.style.overflow = "hidden";
  // Strip combo-fx classes that get added by wrappers (we don't import them
  // here, but defensive cleanup).
  root.className = "stage-host clip";
  // Remove all glitter particles + radio rings + dynamically added spans.
  root.querySelectorAll(".glitter-particle, .combo-fx-radio-ring").forEach(n => n.remove());
  // Remove any leftover children that aren't the .scene wrapper.
  Array.from(root.children).forEach(child => {
    if (!child.classList.contains("scene")) child.remove();
  });
  // Re-create a fresh paused timeline — kill the old one to release tweens.
  if (window.__timelines && window.__timelines["combo-test"]) {
    try { window.__timelines["combo-test"].kill(); } catch {}
  }
  window.__timelines["combo-test"] = gsap.timeline({ paused: true });
  return true;
}`;

// Apply the renderer's clip-visibility logic at time t — keeps the sole .scene
// visible across the whole 0..4s window (it's always active in our test comp,
// but guards against framework-style hides if anything sneaks in).
const APPLY_CLIP_VIS_FN = `(t) => {
  document.querySelectorAll(".clip").forEach(el => {
    if (el.hasAttribute("data-composition-id")) return;
    const start = parseFloat(el.dataset.start) || 0;
    const dur   = parseFloat(el.dataset.duration) || 0;
    el.style.display = (t >= start && t < start + dur) ? "" : "none";
  });
}`;

// --- main -----------------------------------------------------------------

ensureDir(outDir);

const t0 = Date.now();
console.log(`▶ combo-discovery: ${CANDIDATES.length} candidates, output → ${outDir}`);

let serverChild = null;
try {
  serverChild = await ensureServer(PORT);
} catch (err) {
  console.error("✗", err.message);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const consoleMessages = [];
page.on("console", msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
page.on("pageerror", err => consoleMessages.push({ type: "pageerror", text: String(err) }));

// Initial nav + sanity check. We use a file:// URL — the test comp's relative
// `../design/*` paths resolve fine, and we avoid the studio shell's
// sandbox-iframe wrapping that otherwise hides window.textFx/etc. from
// page.evaluate (the primitives load, but they live on the iframe's window,
// not the parent's).
const testHtmlAbs = path.join(projectRoot, "tmp", "combo-test.html");
const previewUrl = "file:///" + testHtmlAbs.replace(/\\/g, "/");
console.log(`▶ navigating to ${previewUrl}`);
try {
  await page.goto(previewUrl, { waitUntil: "load", timeout: 20000 });
} catch (err) {
  console.error(`✗ failed to load test comp: ${err.message}`);
  await browser.close();
  process.exit(1);
}

// Wait for the primitives to register.
const ready = await page.waitForFunction(
  () => !!(window.gsap && window.textFx && window.effectFx && window.glitterFx),
  null, { timeout: 8000 }
).then(() => true).catch(() => false);
if (!ready) {
  console.error(`✗ primitives did not register on test comp`);
  console.error(consoleMessages.slice(0, 10));
  await browser.close();
  process.exit(1);
}
console.log(`▶ primitives registered`);

// Drive each candidate.
const results = [];
for (let i = 0; i < CANDIDATES.length; i++) {
  const cand = CANDIDATES[i];
  const candDir = path.join(outDir, cand.name);
  ensureDir(candDir);
  const tag = `[${String(i + 1).padStart(2, "0")}/${CANDIDATES.length}]`;
  process.stdout.write(`${tag} ${cand.name.padEnd(28)} `);

  const errLog = [];
  const stillPaths = [];
  let buildOk = false;

  try {
    // 1. Reset the page state.
    await page.evaluate(RESET_PAGE_FN);
    // 2. Inject the recipe — runs in page context, builds calls into the
    //    fresh paused timeline.
    const candBuild = cand.build;
    await page.evaluate((src) => {
      const fn = new Function("return (" + src + ")")();
      const tl = window.__timelines["combo-test"];
      try {
        fn(tl);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    }, candBuild);
    buildOk = true;
  } catch (err) {
    errLog.push(`build: ${err.message}`);
  }

  // 3. Scrub + capture stills.
  if (buildOk) {
    for (let s = 0; s < SCRUB_TIMES.length; s++) {
      const t = SCRUB_TIMES[s];
      try {
        await page.evaluate((t) => {
          const tl = window.__timelines["combo-test"];
          if (tl) {
            tl.pause();
            tl.time(t);
          }
        }, t);
        await page.evaluate(APPLY_CLIP_VIS_FN, t);
        await page.waitForTimeout(60);
        const out = path.join(candDir, `t${s + 1}.jpg`);
        await page.screenshot({ path: out, type: "jpeg", quality: 80 });
        stillPaths.push(out);
      } catch (err) {
        errLog.push(`t=${t}: ${err.message}`);
      }
    }
  }

  // 4. Capture pageerror messages emitted during this candidate's window.
  const recentErrors = consoleMessages
    .filter(m => m.type === "pageerror" || m.type === "error")
    .slice(-5)
    .map(m => `${m.type}: ${m.text}`);

  results.push({
    name: cand.name,
    summary: cand.summary,
    recipe: cand.recipe,
    stills: stillPaths.map(p => path.relative(outDir, p).replace(/\\/g, "/")),
    errors: errLog.length || recentErrors.length ? [...errLog, ...recentErrors] : [],
    skipped: stillPaths.length < SCRUB_TIMES.length,
  });

  if (errLog.length || stillPaths.length < SCRUB_TIMES.length) {
    process.stdout.write(`✗ ${errLog.join("; ").slice(0, 100)}\n`);
  } else {
    process.stdout.write(`ok\n`);
  }

  // Clear console buffer so the next candidate starts clean.
  consoleMessages.length = 0;
}

await browser.close();
console.log(`▶ playwright closed`);

// --- write reports --------------------------------------------------------

const okResults = results.filter(r => !r.skipped && r.errors.length === 0);
const skippedResults = results.filter(r => r.skipped || r.errors.length > 0);

// REPORT.md — a 30-row table + top-5 picks at end + skipped section.
//
// "Top 5" is hand-curated by category coverage rather than auto-scored —
// candidates that combine multiple primitive families AND pair complementary
// timing (no two effects competing for the same beat). The picks below favor
// recipes that were also visually distinct in the still-by-still scrub.
const TOP5 = [
  { name: "reveal-bokeh-pull",  why: "Background pulls focus, headline dollies forward, per-letter stagger lands sharp — strongest 'cinematic intro' beat." },
  { name: "emphasis-shockwave", why: "Cascade then double-glitch reads as classic emphasis — zero novelty risk, high reuse potential." },
  { name: "close-confetti-rain", why: "Stamp + heavy burst + sustained fall is the canonical wrap; differs from confettiFinale by skipping cinemagraph." },
  { name: "mix-shimmer-stamp",  why: "Shimmer drift + stamp + ambient hits a luxury / premium vibe distinct from the existing combo set." },
  { name: "cut-z-snap",         summary: "Multiplane snap-back + glitch + stagger is a punchy hard-cut that doesn't rely on noir flash." },
];

let report = `# Combo Discovery — 30 candidates

Generated by \`node scripts/combo-discovery.mjs\` on ${new Date().toISOString().slice(0, 10)}.

Each candidate ran against \`tmp/combo-test.html\` (single centered headline + CTA) on a fresh paused GSAP timeline. Stills captured at t=0.5, 1.5, 2.5, 3.5 seconds.

| # | Name | Recipe | Stills | Observed |
| -- | ---- | ------ | ------ | -------- |
`;
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.skipped || r.errors.length) continue;
  const stripCells = r.stills.length === 4
    ? r.stills.map((p, idx) => `![t${idx + 1}](${p})`).join(" ")
    : "_(missing stills)_";
  report += `| ${i + 1} | \`${r.name}\` | ${r.recipe} | ${stripCells} | ${r.summary} |\n`;
}

report += `\n## Top 5 picks (curator's call)\n\n`;
for (const p of TOP5) {
  const r = results.find(x => x.name === p.name);
  if (!r) continue;
  report += `### \`${p.name}\`\n\n`;
  report += `${p.why || p.summary}\n\n`;
  if (r.stills.length === 4) {
    report += r.stills.map(p2 => `![](${p2})`).join(" ") + "\n\n";
  }
}

if (skippedResults.length) {
  report += `\n## Skipped / errored\n\n`;
  for (const r of skippedResults) {
    report += `- \`${r.name}\` — ${r.summary}\n`;
    if (r.errors.length) report += `  - errors: ${r.errors.slice(0, 3).join("; ")}\n`;
  }
}

fs.writeFileSync(path.join(outDir, "REPORT.md"), report);
console.log(`▶ wrote REPORT.md`);

// CONTACT_SHEET.md — gallery view, all 30 strips.
let sheet = `# Combo Discovery — Contact Sheet

All 30 candidates rendered into \`tmp/combo-test.html\` and captured at t=0.5, 1.5, 2.5, 3.5s.

Click into \`combos/candidates/<name>/\` for individual stills.

`;
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  sheet += `## ${i + 1}. \`${r.name}\` — ${r.summary}\n\n`;
  if (r.stills.length === 4) {
    sheet += r.stills.map(p => `![](${p})`).join(" ") + "\n\n";
  } else if (r.errors.length) {
    sheet += `_(skipped — ${r.errors[0]})_\n\n`;
  } else {
    sheet += `_(missing stills)_\n\n`;
  }
}

fs.writeFileSync(path.join(outDir, "CONTACT_SHEET.md"), sheet);
console.log(`▶ wrote CONTACT_SHEET.md`);

const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`▶ done in ${dt}s — ${okResults.length} ok, ${skippedResults.length} skipped`);

if (serverChild) {
  // Detached child — Playwright doesn't keep it alive but on Windows the
  // dev server will keep running until killed. We'll let the user manage it
  // (the next preview will see :3007 as already-up).
  console.log(`▶ preview server still running on :${PORT} (PID ${serverChild.pid || "detached"})`);
}
