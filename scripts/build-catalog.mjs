// Build a visual reference catalog of every GSAP recipe in design/modules/.
//
// For each recipe we generate a tiny standalone HTML composition (480×270, 5s)
// demonstrating that one recipe with a clean example. We then load it in
// headless Playwright, seek to the recipe's "peak" timestamp, snap a 480×270
// PNG to docs/effects/<recipe-name>.png, and finally write a single
// docs/effects-catalog.html that grids every thumbnail with its name, a
// one-line API call example, and a brief description.
//
// Usage:
//   npm run catalog
//
// No external server required — comps are loaded via file:// URL. This mirrors
// the deterministic-capture pattern in scripts/smoke.mjs and scripts/render.mjs.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const docsDir = path.join(projectRoot, "docs");
const thumbsDir = path.join(docsDir, "effects");
const tmpDir = path.join(docsDir, ".catalog-tmp");

const W = 480;
const H = 270;
const COMP_DURATION = 5;

// ---------- recipe registry ------------------------------------------------
// Each entry produces ONE thumbnail + ONE catalog card. `peak` is the seek
// time (sec) where the animation is most "showing what it does". `body` is
// the inner HTML of the comp's main stage. `tweens` is the JS that wires
// the recipe(s) onto the timeline. `apiCall` is the one-line example shown
// under the thumb.

const recipes = [
  // ----- text-fx --------------------------------------------------------
  {
    id: "text-fx-explode",
    name: "textFx.explode",
    description: "Letters scatter in/out from center.",
    apiCall: 'textFx.explode(tl, "#title", { at: 0, duration: 0.8 })',
    peak: 0.5,
    body: `<div class="stage"><span id="title" class="hero-text">EXPLODE</span></div>`,
    tweens: `textFx.explode(tl, "#title", { at: 0.0, duration: 0.8, mode: "in", seed: 5 });`,
  },
  {
    id: "text-fx-stamp",
    name: "textFx.stamp",
    description: "Slam-impact scale with screen shake.",
    apiCall: 'textFx.stamp(tl, "#title", { at: 0 })',
    peak: 0.3,
    body: `<div class="stage"><span id="title" class="hero-text">STAMP</span></div>`,
    tweens: `textFx.stamp(tl, "#title", { at: 0.0, duration: 0.45 });`,
  },
  {
    id: "text-fx-cascade",
    name: "textFx.cascade",
    description: "Words fall into place in sequence.",
    apiCall: 'textFx.cascade(tl, "#body", { at: 0, stagger: 0.08 })',
    peak: 0.5,
    body: `<div class="stage"><span id="body" class="body-text">words drop in sequence</span></div>`,
    tweens: `textFx.cascade(tl, "#body", { at: 0.0, duration: 0.6, stagger: 0.12 });`,
  },
  {
    id: "text-fx-stagger",
    name: "textFx.stagger",
    description: "Per-letter pop with rotation.",
    apiCall: 'textFx.stagger(tl, "#title", { at: 0 })',
    peak: 0.4,
    body: `<div class="stage"><span id="title" class="hero-text">STAGGER</span></div>`,
    tweens: `textFx.stagger(tl, "#title", { at: 0.0, duration: 0.6, stagger: 0.06 });`,
  },
  {
    id: "text-fx-typeon",
    name: "textFx.typeOn",
    description: "Character-by-character typewriter reveal.",
    apiCall: 'textFx.typeOn(tl, "#caption", { at: 0, duration: 1.2 })',
    peak: 0.7,
    body: `<div class="stage"><span id="caption" class="body-text fx-typeon-cursor">typewriter reveal</span></div>`,
    tweens: `textFx.typeOn(tl, "#caption", { at: 0.0, duration: 1.0 });`,
  },
  {
    id: "text-fx-counter",
    name: "textFx.counter",
    description: "Number flips up to its target value.",
    apiCall: 'textFx.counter(tl, "#stat", { at: 0, duration: 1.4, from: 0 })',
    peak: 0.7,
    body: `<div class="stage"><span id="stat" class="hero-text fx-counter">12,500</span></div>`,
    tweens: `textFx.counter(tl, "#stat", { at: 0.0, duration: 1.0, from: 0 });`,
  },

  // ----- effect-fx ------------------------------------------------------
  {
    id: "effect-fx-multiplaneDolly",
    name: "effectFx.multiplaneDolly",
    description: "CSS perspective camera dollies through depth planes.",
    apiCall: 'effectFx.multiplaneDolly(tl, "#stage", { at: 0, duration: 4.4 })',
    peak: 1.5,
    body: `<div class="fx-multiplane mp-wrap">
      <div id="mp-stage" class="stage mp-stage">
        <div class="plane plane-bg">DEPTH</div>
        <div class="plane plane-mid">Multiplane</div>
        <div class="plane plane-near">CSS perspective camera</div>
      </div>
    </div>`,
    tweens: `effectFx.multiplaneDolly(tl, "#mp-stage", { at: 0.0, duration: 3.0, from: -160, to: 60 });`,
  },
  {
    id: "effect-fx-inkBleed",
    name: "effectFx.inkBleed",
    description: "Headline warps then resolves crisp.",
    apiCall: 'effectFx.inkBleed(tl, "#headline", { at: 0, duration: 0.7 })',
    peak: 0.4,
    body: `<div class="stage"><span id="headline" class="hero-text fx-bleed-ready">Ink Bleed</span></div>`,
    tweens: `effectFx.inkBleed(tl, "#headline", { at: 0.0, duration: 0.9, from: 80, to: 0 });`,
    needsFilters: true,
  },
  {
    id: "effect-fx-glitchBurst",
    name: "effectFx.glitchBurst",
    description: "Brief chromatic-shift impact window.",
    apiCall: 'effectFx.glitchBurst(tl, "#word", { at: 0, duration: 0.18 })',
    peak: 0.05,
    body: `<div class="stage"><span id="word" class="hero-text glitch-color">SIGNAL</span></div>`,
    tweens: `effectFx.glitchBurst(tl, "#word", { at: 0.0, duration: 0.22 });
             effectFx.glitchBurst(tl, "#word", { at: 0.5, duration: 0.18 });`,
    needsFilters: true,
  },
  {
    id: "effect-fx-cinemagraphRotate",
    name: "effectFx.cinemagraphRotate",
    description: "Slow rotating gradient blob behind frosted glass.",
    apiCall: 'effectFx.cinemagraphRotate(tl, "#bg", { at: 0, duration: 24 })',
    peak: 4.0,
    body: `<div class="cg-scene">
      <div id="cg-bg" class="fx-cinemagraph-bg cg-tinted"></div>
      <div class="cg-content">Perpetual motion.</div>
    </div>`,
    tweens: `effectFx.cinemagraphRotate(tl, "#cg-bg", { at: 0.0, duration: 5.0, turns: 1.0, ease: "none" });`,
  },

  // ----- glitter-fx -----------------------------------------------------
  {
    id: "glitter-fx-burst",
    name: "glitterFx.burst",
    description: "Radial particle explosion from center.",
    apiCall: 'glitterFx.burst(tl, "#scene", { at: 0, count: 80, duration: 1.4 })',
    peak: 0.7,
    body: `<div id="g-scene" class="glitter-scene"><span class="glitter-label">BURST</span></div>`,
    tweens: `glitterFx.burst(tl, "#g-scene", { at: 0.0, count: 80, duration: 1.6, distance: 220, seed: 11 });`,
  },
  {
    id: "glitter-fx-fall",
    name: "glitterFx.fall",
    description: "Continuous downward sparkle fall.",
    apiCall: 'glitterFx.fall(tl, "#scene", { at: 0, count: 60, duration: 5.0 })',
    peak: 2.5,
    body: `<div id="g-scene" class="glitter-scene"><span class="glitter-label">FALL</span></div>`,
    tweens: `glitterFx.fall(tl, "#g-scene", { at: 0.0, count: 80, duration: 5.0, seed: 4 });`,
  },
  {
    id: "glitter-fx-ambient",
    name: "glitterFx.ambient",
    description: "Pulsing in-place sparkle for hero shimmer.",
    apiCall: 'glitterFx.ambient(tl, "#scene", { at: 0, count: 40, duration: 5.0 })',
    peak: 2.0,
    body: `<div id="g-scene" class="glitter-scene"><span class="glitter-label">AMBIENT</span></div>`,
    tweens: `glitterFx.ambient(tl, "#g-scene", { at: 0.0, count: 50, duration: 5.0, seed: 9 });`,
  },

  // ----- combo-fx (combined recipes) -----------------------------------
  // Each combo composes 3-5 primitives in choreographed sequence. See
  // design/modules/combo-fx.js for source. Peak frame is the moment the
  // combo's signature visual is most visible.
  {
    id: "combo-fx-superImpact",
    name: "comboFx.superImpact",
    description: "Stat number lands: ink resolves → counter ticks → stamp impact → glitch + glitter burst.",
    apiCall: 'comboFx.superImpact(tl, "#stat", { at: 0, duration: 1.2 })',
    peak: 0.7,
    body: `<div id="g-scene" class="combo-scene"><span id="combo-stat" class="combo-stat-num">12,500</span></div>`,
    tweens: `comboFx.superImpact(tl, "#combo-stat", { at: 0.0, duration: 1.2, intensity: 1.1, seed: 11, from: 0 });`,
    needsFilters: true,
    isCombo: true,
  },
  {
    id: "combo-fx-cinematicReveal",
    name: "comboFx.cinematicReveal",
    description: "Camera dollies in while headline resolves: multiplane + ink + stagger + shadow trail.",
    apiCall: 'comboFx.cinematicReveal(tl, "#stage", { at: 0, headline: "#h" })',
    peak: 1.0,
    body: `<div class="fx-multiplane mp-wrap">
      <div id="cr-stage" class="stage mp-stage">
        <div class="plane plane-bg">DEPTH</div>
        <div class="plane plane-mid"><span id="cr-h">Cinematic</span></div>
        <div class="plane plane-near">camera push-in</div>
      </div>
    </div>`,
    tweens: `comboFx.cinematicReveal(tl, "#cr-stage", { at: 0.0, duration: 1.6, headline: "#cr-h", seed: 22 });`,
    needsFilters: true,
    isCombo: true,
  },
  {
    id: "combo-fx-hyperGlitch",
    name: "comboFx.hyperGlitch",
    description: "Two-burst signal break: scanlines + jitter + double glitch + stamp re-anchor.",
    apiCall: 'comboFx.hyperGlitch(tl, "#word", { at: 0, duration: 0.6 })',
    peak: 0.12,
    body: `<div id="g-scene" class="combo-scene"><span id="hg-text" class="combo-glitch-text">SIGNAL</span></div>`,
    tweens: `tl.set("#hg-text", { opacity: 1 }, 0);
             comboFx.hyperGlitch(tl, "#hg-text", { at: 0.0, duration: 0.8, intensity: 1.0, bursts: 2 });`,
    needsFilters: true,
    isCombo: true,
  },
  {
    id: "combo-fx-dreamSequence",
    name: "comboFx.dreamSequence",
    description: "Ambient hero: cinemagraph rotates, shimmer-clip headline, ambient + fall sparkle.",
    apiCall: 'comboFx.dreamSequence(tl, "#scene", { at: 0, duration: 4.0, headline: "#h" })',
    peak: 2.0,
    body: `<div id="ds-scene" class="dream-scene">
      <div id="ds-cg" class="fx-cinemagraph-bg"></div>
      <span id="ds-h" class="dream-text">Dream</span>
    </div>`,
    tweens: `comboFx.dreamSequence(tl, "#ds-scene", { at: 0.0, duration: 4.0, cinemagraph: "#ds-cg", headline: "#ds-h", seed: 44 });`,
    isCombo: true,
  },
  {
    id: "combo-fx-kineticBurst",
    name: "comboFx.kineticBurst",
    description: "Word emphasis: explode-assemble + small glitter + micro-glitch on settle.",
    apiCall: 'comboFx.kineticBurst(tl, "#title", { at: 0, duration: 1.0 })',
    peak: 0.6,
    body: `<div id="g-scene" class="combo-scene"><span id="kb-text" class="combo-kinetic-text">KINETIC</span></div>`,
    tweens: `comboFx.kineticBurst(tl, "#kb-text", { at: 0.0, duration: 1.0, intensity: 1.1, seed: 55 });`,
    needsFilters: true,
    isCombo: true,
  },
  {
    id: "combo-fx-slamCut",
    name: "comboFx.slamCut",
    description: "Hard transition: noir flash + glitch + multiplane snap + cascade in + grade pop.",
    apiCall: 'comboFx.slamCut(tl, "#scene", { at: 0, duration: 0.9, content: "#words" })',
    peak: 0.45,
    body: `<div id="sc-scene" class="combo-scene">
      <div class="scene__stage" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
        <span id="sc-words" class="combo-slam-words">Hard cut</span>
      </div>
    </div>`,
    tweens: `comboFx.slamCut(tl, "#sc-scene", { at: 0.0, duration: 0.9, content: "#sc-words" });`,
    needsFilters: true,
    isCombo: true,
  },
  {
    id: "combo-fx-signalPulse",
    name: "comboFx.signalPulse",
    description: "Beacon callout: 5 expanding rings + typeOn caption + ambient shimmer + counter.",
    apiCall: 'comboFx.signalPulse(tl, "#beacon", { at: 0, duration: 1.6, caption: "#cap" })',
    peak: 0.9,
    body: `<div id="sp-host" class="pulse-host">
      <div class="pulse-beacon"></div>
      <div class="pulse-stack">
        <span id="sp-cap" class="pulse-cap">Live · 2,400</span>
        <span id="sp-num" class="pulse-num">2,400</span>
      </div>
    </div>`,
    tweens: `comboFx.signalPulse(tl, "#sp-host", { at: 0.0, duration: 1.6, caption: "#sp-cap", counter: "#sp-num", seed: 77, ringCount: 5 });`,
    isCombo: true,
  },
  {
    id: "combo-fx-paperTear",
    name: "comboFx.paperTear",
    description: "Old layer dissolves out, camera pulls back, new lockup stamps in under warm grade.",
    apiCall: 'comboFx.paperTear(tl, "#scene", { at: 0, outgoing: "#a", incoming: "#b" })',
    peak: 1.0,
    body: `<div id="pt-scene" class="combo-scene tear-scene">
      <div class="tear-stack">
        <span id="pt-out" class="tear-out fx-bleed-ready">Before</span>
        <span id="pt-in"  class="tear-in">After</span>
      </div>
    </div>`,
    tweens: `tl.set("#pt-in", { scale: 0, opacity: 0 }, 0);
             comboFx.paperTear(tl, "#pt-scene", { at: 0.0, duration: 1.5, outgoing: "#pt-out", incoming: "#pt-in", stage: "#pt-scene", seed: 88 });`,
    needsFilters: true,
    isCombo: true,
  },
  {
    id: "combo-fx-confettiFinale",
    name: "comboFx.confettiFinale",
    description: "End-card: multiplane settle + logo stamp + rule scaleX + burst+fall confetti + cinemagraph idle.",
    apiCall: 'comboFx.confettiFinale(tl, "#scene", { at: 0, duration: 2.4, lockup: "#logo" })',
    peak: 1.6,
    body: `<div id="cf-scene" class="combo-scene cf-scene">
      <div id="cf-cg" class="fx-cinemagraph-bg"></div>
      <div class="scene__stage finale-stage">
        <div class="finale-stack">
          <span id="cf-mark" class="finale-mark">N/co</span>
          <div id="cf-rule" class="combo-fx-confetti-rule" style="color:rgba(251,249,246,0.55); width: 60%;"></div>
          <span id="cf-tag" class="finale-tag">Built with care.</span>
        </div>
      </div>
    </div>`,
    tweens: `comboFx.confettiFinale(tl, "#cf-scene", { at: 0.0, duration: 2.4, lockup: "#cf-mark", rule: "#cf-rule", tagline: "#cf-tag", cinemagraph: "#cf-cg", seed: 99 });`,
    isCombo: true,
  },
  {
    id: "combo-fx-holoFlash",
    name: "comboFx.holoFlash",
    description: "Brand chip: holo gradient drift + multiplane near-pop + stamp + glitch + glitter + long shadow.",
    apiCall: 'comboFx.holoFlash(tl, "#sticker", { at: 0, duration: 1.4, lockup: "#mark" })',
    peak: 0.55,
    body: `<div id="hf-scene" class="combo-scene" style="display:flex;align-items:center;justify-content:center;">
      <div id="hf-host" class="holo-host">
        <span id="hf-mark" class="holo-mark">N</span>
      </div>
    </div>`,
    tweens: `comboFx.holoFlash(tl, "#hf-host", { at: 0.0, duration: 1.4, lockup: "#hf-mark", seed: 101 });`,
    needsFilters: true,
    isCombo: true,
  },
];

// ---------- comp HTML template --------------------------------------------
// 480×270 stage, dark background, system fonts. We point at the project's
// modules from absolute file:// paths so the comp can live anywhere.

const SVG_FILTERS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="fx-ink" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" />
      <feDisplacementMap in="SourceGraphic" scale="0" />
      <feGaussianBlur stdDeviation="0.4" />
    </filter>
    <filter id="fx-rgb-shift">
      <feColorMatrix type="matrix" in="SourceGraphic" result="r"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      <feOffset in="r" dx="3" dy="0" result="r-shift" />
      <feColorMatrix type="matrix" in="SourceGraphic" result="b"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
      <feOffset in="b" dx="-3" dy="0" result="b-shift" />
      <feColorMatrix type="matrix" in="SourceGraphic" result="g"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      <feBlend in="r-shift" in2="g" mode="screen" result="rg" />
      <feBlend in="rg" in2="b-shift" mode="screen" />
    </filter>
  </defs>
</svg>`;

function buildComp(recipe) {
  // Resolve absolute paths — comps load via file:// so we need real paths.
  const gsapAbs = path.join(projectRoot, "design", "vendor", "gsap.min.js").replace(/\\/g, "/");
  const modulesJs = path.join(projectRoot, "design", "modules", "all.js").replace(/\\/g, "/");
  const modulesCss = path.join(projectRoot, "design", "modules", "all.css").replace(/\\/g, "/");
  const fx08Css = path.join(projectRoot, "design", "effects-batch-08.css").replace(/\\/g, "/");
  const fx07Css = path.join(projectRoot, "design", "effects-batch-07.css").replace(/\\/g, "/");
  const cardsCss = path.join(projectRoot, "design", "cards.css").replace(/\\/g, "/");

  const filters = recipe.needsFilters ? SVG_FILTERS : "";
  const isCombo = !!recipe.isCombo;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${recipe.name}</title>
<link rel="stylesheet" href="file:///${cardsCss}">
<link rel="stylesheet" href="file:///${fx07Css}">
<link rel="stylesheet" href="file:///${fx08Css}">
<link rel="stylesheet" href="file:///${modulesCss}">
<script src="file:///${gsapAbs}"></script>
<script src="file:///${modulesJs}"></script>
<style>
  html, body { margin: 0; padding: 0; background: #0E0E12; }
  body {
    color: #FBF9F6;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  }
  .demo {
    width: ${W}px; height: ${H}px;
    position: relative; overflow: hidden;
    background: #14141B;
  }
  .stage {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    text-align: center;
  }
  .hero-text {
    font-weight: 700;
    font-size: 56px;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #FBF9F6;
  }
  .body-text {
    font-weight: 500;
    font-size: 28px;
    color: #DDD8D0;
    letter-spacing: 0.01em;
  }
  .glitch-color { color: #1A9E8F; }
  .fx-counter   { color: #1A9E8F; font-weight: 800; }

  /* multiplane scene scaled for 480×270 */
  .mp-wrap { position: absolute; inset: 0; }
  .mp-stage { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; }
  .mp-stage .plane-bg   { font-size: 88px;  color: rgba(26,158,143,0.22); font-weight: 600; }
  .mp-stage .plane-mid  { font-size: 36px;  color: #F5EFE6; font-weight: 500; position: absolute; }
  .mp-stage .plane-near { font-size: 12px;  color: rgba(251,249,246,0.72); letter-spacing: 0.18em; text-transform: uppercase; position: absolute; bottom: 30px; }

  /* cinemagraph scene */
  .cg-scene  { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .cg-tinted {
    --brand-primary: #1A9E8F;
    --brand-secondary: #FBF9F6;
    --brand-accent: #E98B6A;
    --brand-tertiary: #14806F;
  }
  .cg-content {
    position: relative; z-index: 2;
    font-size: 32px; font-weight: 500; color: #FBF9F6;
    letter-spacing: -0.01em;
  }

  /* glitter scene */
  .glitter-scene {
    position: absolute; inset: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 50% 50%, #1B1B25 0%, #0E0E12 70%);
  }
  .glitter-label {
    font-size: 30px; font-weight: 700; letter-spacing: 0.16em;
    color: rgba(251,249,246,0.85); z-index: 2; position: relative;
  }

  /* ----- combo scenes (480x270 thumbnails) -------------------------- */
  .combo-scene {
    position: absolute; inset: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 50% 50%, #14141B 0%, #0A0A0E 80%);
  }
  .combo-stat-num {
    font-weight: 700; font-size: 64px; line-height: 1;
    color: #1A9E8F; letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
  }
  .combo-glitch-text {
    font-weight: 700; font-size: 64px; color: #d85656;
    letter-spacing: -0.03em;
  }
  .combo-kinetic-text {
    font-weight: 700; font-size: 56px; color: #ffd66e;
    letter-spacing: -0.03em;
  }
  .combo-slam-words {
    font-weight: 600; font-size: 44px; color: #FBF9F6;
    letter-spacing: -0.02em;
  }

  /* dream */
  .dream-scene {
    position: absolute; inset: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    --brand-primary: #5b8cc7; --brand-secondary: #ffd66e;
    --brand-accent: #ff8eb4; --brand-tertiary: #6cd3c5;
  }
  .dream-text {
    position: relative; z-index: 2;
    font-weight: 500; font-size: 56px;
    color: transparent;
    background: linear-gradient(90deg, #ffd66e, #ff8eb4, #6cd3c5, #ffd66e);
    background-size: 300% 100%;
    -webkit-background-clip: text;
            background-clip: text;
    letter-spacing: -0.02em;
  }

  /* signal pulse */
  .pulse-host {
    position: relative; width: 200px; height: 200px;
    display: flex; align-items: center; justify-content: center;
    color: #ffd66e;
  }
  .pulse-beacon {
    width: 24px; height: 24px; border-radius: 50%;
    background: #ffd66e; box-shadow: 0 0 24px #ffd66e; z-index: 2;
  }
  .pulse-stack {
    position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .pulse-cap { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(251,249,246,0.85); }
  .pulse-num { font-size: 32px; font-weight: 700; color: #ffd66e; line-height: 1; }

  /* paper tear */
  .tear-scene {
    --brand-primary: #1A9E8F;
  }
  .tear-stack {
    position: relative; width: 360px; height: 80px;
    display: flex; align-items: center; justify-content: center;
  }
  .tear-out, .tear-in {
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    font-weight: 600; font-size: 56px; line-height: 1; white-space: nowrap;
  }
  .tear-out { color: rgba(251,249,246,0.9); }
  .tear-in  { color: #1A9E8F; font-weight: 700; }

  /* confetti finale */
  .cf-scene {
    --brand-primary: #1A9E8F; --brand-secondary: #ffd66e;
    --brand-accent: #ff8eb4; --brand-tertiary: #14806F;
  }
  .finale-stage { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .finale-stack { display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 2; position: relative; }
  .finale-mark  { font-weight: 700; font-style: italic; font-size: 56px; color: #FBF9F6; letter-spacing: -0.03em; line-height: 1; text-shadow: 0 4px 20px rgba(0,0,0,0.55); }
  .finale-tag   { font-weight: 500; font-size: 22px; color: #FBF9F6; letter-spacing: -0.01em; }

  /* holo */
  .holo-host {
    position: relative;
    width: 220px; height: 220px;
    border-radius: 32px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(115deg, #ff5cb1 0%, #9b6bff 18%, #3affe6 36%, #5cffaa 56%, #f5d35a 75%, #ff5cb1 100%);
    background-size: 300% 300%;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.4);
    overflow: hidden;
  }
  .holo-host::before {
    content: ""; position: absolute; inset: 0;
    background: repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 4px, transparent 4px 12px);
    mix-blend-mode: overlay;
    pointer-events: none;
  }
  .holo-mark {
    position: relative; z-index: 1;
    font-weight: 900; font-style: italic; font-size: 88px;
    color: #fff; letter-spacing: -0.02em;
    text-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  }
</style>
</head>
<body>
<div id="demo" class="demo clip"
     data-composition-id="${recipe.id}"
     data-width="${W}" data-height="${H}"
     data-start="0" data-duration="${COMP_DURATION}" data-track-index="0">
${recipe.body}
</div>
${filters}
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  window.__timelines[${JSON.stringify(recipe.id)}] = tl;
  ${recipe.tweens}
</script>
</body>
</html>
`;
}

// ---------- catalog page template -----------------------------------------

function buildCatalogPage(recipes) {
  const renderCard = (r) => `
    <article class="card">
      <div class="thumb">
        <img src="effects/${r.id}.png" alt="${r.name} preview" width="${W}" height="${H}" loading="lazy" />
      </div>
      <div class="meta">
        <h3 class="card-title">${r.name}</h3>
        <p class="card-desc">${escapeHtml(r.description)}</p>
        <pre class="card-api"><code>${escapeHtml(r.apiCall)}</code></pre>
      </div>
    </article>`;

  const primitives = recipes.filter(r => !r.isCombo);
  const combos = recipes.filter(r => r.isCombo);

  const primitiveCards = primitives.map(renderCard).join("\n");
  const comboCards = combos.map(renderCard).join("\n");
  // Backwards-compat: also expose the full grid as `cards` so any older
  // template assumptions (none currently) don't break.
  const cards = primitiveCards + "\n" + comboCards;
  void cards;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>HyperFrames — Module Recipes Catalog</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    color-scheme: dark;
    --bg: #0E0E12;
    --bg-card: #14141B;
    --bg-thumb: #0A0A0E;
    --paper: #FBF9F6;
    --paper-soft: #B6B0A6;
    --border: rgba(255, 255, 255, 0.08);
    --accent: #1A9E8F;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--paper);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.5;
  }
  header {
    padding: 48px 32px 24px;
    max-width: 1280px;
    margin: 0 auto;
  }
  header h1 {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
  }
  header p {
    color: var(--paper-soft);
    margin: 0;
    max-width: 60ch;
  }
  header code {
    color: var(--accent);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.9em;
  }
  main {
    padding: 24px 32px 64px;
    max-width: 1280px;
    margin: 0 auto;
  }
  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
    letter-spacing: -0.01em;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .section-count {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--accent);
    background: rgba(26, 158, 143, 0.12);
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid rgba(26, 158, 143, 0.3);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  }
  .section-desc {
    color: var(--paper-soft);
    margin: 0 0 16px;
    max-width: 60ch;
  }
  .section-desc code {
    color: var(--accent);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  @media (min-width: 1200px) {
    .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  @media (min-width: 800px) and (max-width: 1199px) {
    .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 120ms ease, transform 120ms ease;
  }
  .card:hover {
    border-color: rgba(26, 158, 143, 0.5);
    transform: translateY(-1px);
  }
  .thumb {
    background: var(--bg-thumb);
    aspect-ratio: ${W} / ${H};
    overflow: hidden;
  }
  .thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .meta {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1 1 auto;
  }
  .card-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    letter-spacing: -0.005em;
  }
  .card-desc {
    margin: 0;
    color: var(--paper-soft);
    font-size: 13px;
    line-height: 1.45;
  }
  .card-api {
    margin: 4px 0 0;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.4;
    color: #DDD8D0;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
  }
  .card-api code { color: inherit; }
  footer {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px 48px;
    color: var(--paper-soft);
    font-size: 12px;
  }
</style>
</head>
<body>
<header>
  <h1>Module Recipes Catalog</h1>
  <p>Visual reference for the GSAP recipes in <code>design/modules/</code>. Each thumbnail is a peak frame from a 5s composition. Regenerate with <code>npm run catalog</code>.</p>
</header>
<main>
  <section>
    <h2 class="section-title">Primitives <span class="section-count">${primitives.length}</span></h2>
    <div class="grid">
${primitiveCards}
    </div>
  </section>

  <section style="margin-top: 56px;">
    <h2 class="section-title">Combos <span class="section-count">${combos.length}</span></h2>
    <p class="section-desc">Choreographed multi-primitive recipes — each combo composes 3-5 primitives into a single named "moment". See <code>design/modules/combo-fx.js</code>.</p>
    <div class="grid">
${comboCards}
    </div>
  </section>
</main>
<footer>
  <p>${recipes.length} recipes shown (${primitives.length} primitives + ${combos.length} combos) · auto-generated from <code>scripts/build-catalog.mjs</code> · ${new Date().toISOString().slice(0, 10)}</p>
</footer>
</body>
</html>
`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// ---------- main -----------------------------------------------------------

async function main() {
  // Sanity: bundle must exist.
  const bundleJs = path.join(projectRoot, "design", "modules", "all.js");
  if (!fs.existsSync(bundleJs)) {
    console.error("✗ design/modules/all.js missing — run `npm run build:bundle` first.");
    process.exit(1);
  }

  fs.mkdirSync(thumbsDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const t0 = Date.now();
  console.log(`▶ catalog: ${recipes.length} recipes → docs/effects/`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });

  // Surface page errors so we don't silently capture broken thumbnails.
  const errorsByRecipe = new Map();

  try {
    for (const recipe of recipes) {
      const compPath = path.join(tmpDir, `${recipe.id}.html`);
      fs.writeFileSync(compPath, buildComp(recipe));

      const page = await context.newPage();
      const errs = [];
      page.on("pageerror", e => errs.push(e.message));
      page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });

      const url = "file:///" + compPath.replace(/\\/g, "/");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Wait for timeline to be registered.
      await page.waitForFunction(`
        window.__timelines && window.__timelines[${JSON.stringify(recipe.id)}]
          && window.__timelines[${JSON.stringify(recipe.id)}].getChildren().length > 0
      `, { timeout: 5000 }).catch(() => {});

      // Seek to the recipe's peak frame.
      await page.evaluate(({ id, t }) => {
        const tl = window.__timelines[id];
        if (!tl) return;
        tl.pause();
        tl.seek(t);
      }, { id: recipe.id, t: recipe.peak });

      // One paint tick — let GSAP commit the seek to the DOM.
      await page.waitForTimeout(120);

      const outPng = path.join(thumbsDir, `${recipe.id}.png`);
      await page.screenshot({
        path: outPng,
        type: "png",
        clip: { x: 0, y: 0, width: W, height: H },
      });

      if (errs.length) {
        errorsByRecipe.set(recipe.id, errs);
        console.log(`  ⚠ ${recipe.id} — captured but with ${errs.length} error(s)`);
      } else {
        console.log(`  ✓ ${recipe.id} → effects/${recipe.id}.png @ t=${recipe.peak}s`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  // Write catalog HTML.
  const html = buildCatalogPage(recipes);
  const catalogOut = path.join(docsDir, "effects-catalog.html");
  fs.writeFileSync(catalogOut, html);

  // Clean up tmp comps so docs/ doesn't carry build leftovers.
  for (const f of fs.readdirSync(tmpDir)) {
    fs.unlinkSync(path.join(tmpDir, f));
  }
  fs.rmdirSync(tmpDir);

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  console.log(`◇ ${recipes.length} thumbnails · catalog at docs/effects-catalog.html (${dt}s)`);

  if (errorsByRecipe.size) {
    console.log("");
    console.log("⚠ recipes with page errors:");
    for (const [id, errs] of errorsByRecipe) {
      console.log(`  - ${id}: ${errs[0].slice(0, 120)}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error("✗ catalog build failed:", err);
  process.exit(1);
});
