// =========================================================================
// MODULE — COMBO FX
// =========================================================================
// Choreographed multi-primitive recipes. Each combo composes existing
// textFx / effectFx / glitterFx primitives (plus a handful of inline tweens
// against effects-batch-08.css classes) into a single named "moment".
//
// Loading (in your composition's <head>):
//   <link  rel="stylesheet" href="design/effects-batch-08.css">
//   <link  rel="stylesheet" href="design/modules/all.css">
//   <script src="design/vendor/gsap.min.js"></script>
//   <script src="design/modules/all.js"></script>
//
// `design/modules/all.js` already concatenates text-fx + effect-fx +
// glitter-fx + amp-bind + combo-fx, so loading it gives every combo the
// primitives it depends on.
//
// Use after building the timeline:
//   const tl = gsap.timeline({ paused: true });
//   window.__timelines["my-scene"] = tl;
//
//   comboFx.superImpact     (tl, "#stat",       { at: 1.0, duration: 1.2 });
//   comboFx.cinematicReveal (tl, "#stage",      { at: 0.0, duration: 1.6, headline: "#title" });
//   comboFx.hyperGlitch     (tl, "#word",       { at: 2.5, duration: 0.6 });
//   comboFx.dreamSequence   (tl, "#scene",      { at: 0.0, duration: 4.0, headline: "#h" });
//   comboFx.kineticBurst    (tl, "#title",      { at: 0.0, duration: 1.0 });
//   comboFx.slamCut         (tl, "#scene",      { at: 0.0, duration: 0.9, content: "#next-card" });
//   comboFx.signalPulse     (tl, "#beacon",     { at: 0.0, duration: 1.6, caption: "#cap" });
//   comboFx.paperTear       (tl, "#scene",      { at: 0.0, duration: 1.4, outgoing: "#a", incoming: "#b" });
//   comboFx.confettiFinale  (tl, "#scene",      { at: 0.0, duration: 2.4, lockup: "#logo", rule: "#rule" });
//   comboFx.holoFlash       (tl, "#sticker",    { at: 0.0, duration: 1.4 });
//
// API contract (every combo):
//   comboFx.<name>(timeline, target, {
//     at: 0,            // timeline position (sec)
//     duration: ...,    // combo window (sec); each has its own default
//     intensity: 1,     // 0..2 multiplier on amplitudes/distances/counts
//     seed: 1,          // deterministic PRNG seed
//     ...               // combo-specific knobs (documented per recipe below)
//   });
//
// Returns: `{ duration }` so callers can chain follow-ons:
//   const r = comboFx.superImpact(tl, "#stat", { at: 1.0 });
//   textFx.cascade(tl, "#sub", { at: 1.0 + r.duration });
//
// Constraints (per project LEARNINGS.md §3):
// - Use `tl.fromTo()` not `tl.from()`
// - Deterministic only — mulberry32 PRNG with `seed`; never Math.random / Date
// - Glitch / jitter windows ≤ 0.25s
// - Filters cleared on combo end (mirror effectFx.inkBleed clearAfter behaviour)

(function (global) {
  "use strict";

  // ---------- helpers ----------------------------------------------------

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resolveTarget(target) {
    if (target instanceof Element) return target;
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  // Clamp a positive multiplier to a sane range so a stray `intensity: 999`
  // doesn't blow particle counts past the renderer's frame budget.
  function clampIntensity(v) {
    const x = +v;
    if (!isFinite(x) || x <= 0) return 1;
    return Math.min(3, Math.max(0.05, x));
  }

  // Pull a combo-scoped getter for opts — falls back to default if unset.
  function pick(opts, key, def) {
    if (!opts || opts[key] == null) return def;
    return opts[key];
  }

  // Inject a tiny CSS bridge once per document so combos that animate
  // ::before pseudo-elements via custom properties work everywhere. The
  // existing effect-fx module already does this for `.fx-cinemagraph-bg`,
  // and we add support for the holo-sticker drift here.
  function ensureComboFxBridge() {
    if (document.getElementById("__combo-fx-bridge")) return;
    const style = document.createElement("style");
    style.id = "__combo-fx-bridge";
    style.textContent = `
.combo-fx-glow-pulse {
  box-shadow: 0 0 calc(40px * var(--combo-glow, 0)) rgba(255,255,255, calc(0.10 + 0.40 * var(--combo-glow, 0)));
}
.combo-fx-noir-flash::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 9500;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%),
              linear-gradient(180deg, rgba(0,0,0,0.30), rgba(0,0,0,0.30));
  opacity: var(--combo-noir, 0);
}
.combo-fx-scanlines-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 9300;
  pointer-events: none;
  background: repeating-linear-gradient(0deg,
    transparent 0, transparent 2px,
    rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 3px);
  mix-blend-mode: multiply;
  opacity: var(--combo-scan, 0);
}
.combo-fx-radio-ring {
  position: absolute;
  left: 50%; top: 50%;
  border-radius: 50%;
  border: 3px solid currentColor;
  width: 0; height: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  will-change: width, height, opacity;
}
.combo-fx-confetti-rule {
  display: block;
  height: 3px;
  background: currentColor;
  transform-origin: center;
  transform: scaleX(0);
  width: 60%;
}
.combo-fx-holo-host {
  position: relative;
  background-size: 300% 300%;
  background-position: 0% 50%;
  will-change: background-position, transform;
}
`;
    document.head.appendChild(style);
  }

  // ---------- combo 1: superImpact ---------------------------------------
  //
  // Hero stat / number land. inkBleed resolves the value from a warped state,
  // counter ticks up underneath, then a stamp + glitchBurst lock it, glitter
  // bursts as the reward. ~1.2s default, peak at ~0.65s.
  //
  // Stacks: effectFx.inkBleed → textFx.counter → textFx.stamp →
  //         effectFx.glitchBurst → glitterFx.burst → grade-pop pulse
  // Owns:   the moment a key number arrives.
  // Inputs:
  //   target          number element (textContent like "12,500" or "$1.2M")
  //   at, duration    timeline placement
  //   intensity       multiplier on bleed amount, glitter count, shake
  //   seed            PRNG seed for glitter scatter
  //   from            counter starting value (default 0)
  //   filterId        ink filter id (default "fx-ink")
  //   particleHost    container for glitter (defaults to target.parentElement)
  function superImpact(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 1.2);
    const intensity = clampIntensity(o.intensity);
    const seed = o.seed != null ? +o.seed : 1;
    const from = o.from != null ? +o.from : 0;
    const filterId = o.filterId || "fx-ink";

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.superImpact: no element for", target); return; }
    ensureComboFxBridge();

    const host = resolveTarget(o.particleHost) || el.parentElement || el;

    // Sub-windows of the combo:
    //   t0..t0+0.55  — ink bleed warp resolves, counter ticks
    //   t0+0.55      — stamp impact + glitch burst
    //   t0+0.65      — glitter burst (peak)
    //   t0+0.85..end — soft grade-pop pulse via filter on host
    const bleedDur = Math.min(0.55, duration * 0.45);
    const counterDur = Math.min(0.6, duration * 0.5);
    const stampAt = at + Math.max(0.05, duration * 0.45);
    const stampDur = Math.min(0.35, duration * 0.3);
    const glitchAt = stampAt + 0.04;
    const burstAt = stampAt + 0.10;
    const burstDur = Math.min(0.85, duration * 0.65);

    // 1. Ink bleed warps the displayed number into focus.
    if (typeof global.effectFx?.inkBleed === "function") {
      global.effectFx.inkBleed(timeline, el, {
        at, duration: bleedDur,
        from: 60 * intensity, to: 0,
        filterId, clearAfter: true,
        ease: "power2.out",
      });
    }

    // 2. Counter spins up under the bleed (overlaps so the bleed resolves
    //    onto the final value).
    if (typeof global.textFx?.counter === "function") {
      try {
        global.textFx.counter(timeline, el, {
          at, duration: counterDur, from, ease: "power2.out",
        });
      } catch (e) {
        // textFx.counter logs and bails if textContent isn't a number — fine.
      }
    }

    // 3. Stamp re-anchors the resolved value with screen shake.
    if (typeof global.textFx?.stamp === "function") {
      global.textFx.stamp(timeline, el, {
        at: stampAt, duration: stampDur,
        fromScale: 1.18 + 0.25 * intensity,
        ease: "back.out(2.4)",
        shake: true,
      });
    }

    // 4. Single-frame glitch burst — the "lock" beat.
    if (typeof global.effectFx?.glitchBurst === "function") {
      global.effectFx.glitchBurst(timeline, el, {
        at: glitchAt, duration: 0.16, shake: false,
      });
    }

    // 5. Glitter burst around the number — the reward.
    if (typeof global.glitterFx?.burst === "function") {
      global.glitterFx.burst(timeline, host, {
        at: burstAt, duration: burstDur,
        count: Math.floor(60 * intensity),
        distance: 280 * intensity,
        seed,
      });
    }

    // 6. Grade-pop pulse — saturate/contrast lift on host, fades back.
    timeline.fromTo(host,
      { filter: "saturate(1) contrast(1)" },
      { filter: "saturate(1.2) contrast(1.10) brightness(1.04)",
        duration: 0.18, ease: "power2.out" },
      stampAt);
    timeline.to(host,
      { filter: "saturate(1) contrast(1) brightness(1)",
        duration: Math.max(0.4, duration - (stampAt - at) - 0.18),
        ease: "power2.in" },
      stampAt + 0.18);

    return { duration };
  }

  // ---------- combo 2: cinematicReveal -----------------------------------
  //
  // Headline / hero entrance. Camera dollies forward through depth planes
  // while the headline resolves from an ink-warped state, then per-letter
  // pop, with a soft drop-shadow that arrives 80ms behind. ~1.6s default.
  //
  // Stacks: effectFx.multiplaneDolly → effectFx.inkBleed → textFx.stagger →
  //         drop-shadow trail tween
  // Owns:   the "hero text settles into focus" moment.
  // Inputs:
  //   target          .stage or .fx-multiplane > .stage (the dolly target)
  //   headline        selector or element of the text to reveal
  //   at, duration    placement
  //   intensity       camera distance, bleed amount
  //   seed            PRNG seed
  //   stagger         per-letter delay (default 0.04)
  function cinematicReveal(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 1.6);
    const intensity = clampIntensity(o.intensity);
    const seed = o.seed != null ? +o.seed : 2;
    const stagger = +o.stagger || 0.04;

    const stageEl = resolveTarget(target);
    if (!stageEl) { console.warn("comboFx.cinematicReveal: no stage for", target); return; }
    const headline = resolveTarget(o.headline);
    if (!headline) console.warn("comboFx.cinematicReveal: no headline; falling back to text-only stage");

    // 1. Camera dolly across the full window — runs underneath everything.
    if (typeof global.effectFx?.multiplaneDolly === "function") {
      global.effectFx.multiplaneDolly(timeline, stageEl, {
        at, duration,
        from: -180 * intensity,
        to: 40,
        ease: "power2.out",
      });
    }

    // 2. Ink bleed on the headline at 25% in — looks like text resolves
    //    while the camera continues its push.
    const bleedAt = at + duration * 0.20;
    const bleedDur = Math.min(0.7, duration * 0.4);
    if (headline && typeof global.effectFx?.inkBleed === "function") {
      global.effectFx.inkBleed(timeline, headline, {
        at: bleedAt, duration: bleedDur,
        from: 70 * intensity, to: 0, clearAfter: true,
      });
    }

    // 3. Per-letter stagger pop after the bleed clears — letters land sharp.
    const staggerAt = bleedAt + bleedDur * 0.4;
    if (headline && typeof global.textFx?.stagger === "function") {
      global.textFx.stagger(timeline, headline, {
        at: staggerAt,
        duration: Math.min(0.55, duration * 0.35),
        stagger,
        rotation: -10 * intensity,
        ease: "back.out(1.7)",
        seed,
      });
    }

    // 4. Soft shadow drop trailing the letters — adds weight.
    if (headline) {
      timeline.fromTo(headline,
        { filter: "drop-shadow(0 0 0 rgba(0,0,0,0))" },
        { filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.18))",
          duration: 0.4, ease: "power2.out" },
        staggerAt + 0.08);
    }

    return { duration };
  }

  // ---------- combo 3: hyperGlitch ---------------------------------------
  //
  // Aggressive impact / disruption. Two-burst rhythm: scanlines fade in,
  // first jitter+glitch, brief stamp re-anchor, second glitch burst, scan
  // out. Reads "broken signal recovers". ~0.6s default.
  //
  // Stacks: scanlines fade → vhs-jitter → glitchBurst → stamp →
  //         glitchBurst → scanlines clear
  // Owns:   sub-second moments of disruption / signal-break.
  // Inputs:
  //   target          element to glitch (and the scanline host)
  //   at, duration    placement
  //   intensity       scanline density, glitter optional
  //   bursts          2 (default) or 3 — number of glitch beats
  function hyperGlitch(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 0.6);
    const intensity = clampIntensity(o.intensity);
    const bursts = Math.max(1, Math.min(3, Math.floor(+o.bursts || 2)));

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.hyperGlitch: no element for", target); return; }
    ensureComboFxBridge();

    el.classList.add("combo-fx-scanlines-overlay");

    // 1. Scanlines fade IN over 80ms.
    timeline.fromTo(el,
      { "--combo-scan": 0 },
      { "--combo-scan": 0.55 * intensity, duration: 0.08, ease: "power1.out" },
      at);

    // 2. Burst sequence — alternating jitter + glitchBurst.
    const segLen = Math.max(0.18, (duration - 0.16) / bursts);
    for (let i = 0; i < bursts; i++) {
      const t = at + 0.08 + i * segLen;
      // Jitter via 0.18s steps keyframe — apply class then strip it.
      timeline.call(() => el.classList.add("fx-vhs-jitter"), [], t);
      timeline.call(() => el.classList.remove("fx-vhs-jitter"), [], t + 0.18);
      if (typeof global.effectFx?.glitchBurst === "function") {
        global.effectFx.glitchBurst(timeline, el, {
          at: t + 0.02,
          duration: Math.min(0.16, segLen * 0.6),
          shake: false,
        });
      }
      // Mid-sequence stamp re-anchor — only when bursts > 1.
      if (bursts > 1 && i === 0 && typeof global.textFx?.stamp === "function") {
        try {
          global.textFx.stamp(timeline, el, {
            at: t + 0.18, duration: 0.20,
            fromScale: 1.0 + 0.10 * intensity,
            ease: "power2.out",
            shake: false,
          });
        } catch (e) {}
      }
    }

    // 3. Scanlines clear by end.
    timeline.to(el,
      { "--combo-scan": 0, duration: 0.10, ease: "power1.in" },
      at + duration - 0.10);
    timeline.call(() => el.classList.remove("combo-fx-scanlines-overlay"), [], at + duration);

    return { duration };
  }

  // ---------- combo 4: dreamSequence -------------------------------------
  //
  // Soft, ambient hero. Cinemagraph blob rotates slowly, headline wipes in
  // with rainbow shimmer-clip, ambient glitter scatters, fall sparkle
  // drifts down, all under a cool grade. ~4.0s default — ambient state.
  //
  // Stacks: effectFx.cinemagraphRotate → text-shimmer wipe + ambient drift →
  //         glitterFx.ambient → glitterFx.fall → cool-grade overlay tween
  // Owns:   the ambient hero / pause-and-feel moment.
  // Inputs:
  //   target          scene container (also used as glitter host)
  //   cinemagraph     selector for .fx-cinemagraph-bg (defaults to .fx-cinemagraph-bg inside target)
  //   headline        selector for the shimmer text (with .fx-type-shimmer or styling)
  //   at, duration    placement
  //   intensity       glitter count multiplier, blob rotation turns
  //   seed            PRNG seed
  function dreamSequence(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 4.0);
    const intensity = clampIntensity(o.intensity);
    const seed = o.seed != null ? +o.seed : 4;

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.dreamSequence: no scene for", target); return; }

    const cg = resolveTarget(o.cinemagraph) || el.querySelector(".fx-cinemagraph-bg");
    const headline = resolveTarget(o.headline);

    // 1. Slow cinemagraph rotation across the full window.
    if (cg && typeof global.effectFx?.cinemagraphRotate === "function") {
      global.effectFx.cinemagraphRotate(timeline, cg, {
        at, duration, turns: 0.45 * intensity, ease: "none",
      });
    }

    // 2. Headline shimmer wipe in via clip-path inset (left → right reveal).
    if (headline) {
      timeline.fromTo(headline,
        { clipPath: "inset(0 100% 0 0)", opacity: 1 },
        { clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "expo.out" },
        at + 0.20);
      // Continuous gradient drift if .fx-type-shimmer applied.
      timeline.fromTo(headline,
        { backgroundPositionX: "0%" },
        { backgroundPositionX: "200%", duration, ease: "none" },
        at);
    }

    // 3. Ambient glitter scattered — pulses in place.
    if (typeof global.glitterFx?.ambient === "function") {
      global.glitterFx.ambient(timeline, el, {
        at: at + 0.30, duration: duration - 0.50,
        count: Math.floor(36 * intensity),
        seed,
      });
    }

    // 4. Gentle downward fall — sparser, slower.
    if (typeof global.glitterFx?.fall === "function") {
      global.glitterFx.fall(timeline, el, {
        at: at + 0.50, duration: duration - 0.80,
        count: Math.floor(24 * intensity),
        seed: seed + 11,
        wobble: 50,
      });
    }

    // 5. Cool grade fade-in (mild filter pass on the scene root).
    timeline.fromTo(el,
      { filter: "saturate(1) brightness(1)" },
      { filter: "saturate(1.04) brightness(1.04) contrast(0.98)",
        duration: 0.6, ease: "power2.out" },
      at);

    return { duration };
  }

  // ---------- combo 5: kineticBurst --------------------------------------
  //
  // Word/phrase emphasis pop. Letters explode-in (assemble), small glitter
  // burst at peak, then a single micro-glitch on settle. ~1.0s default.
  //
  // Stacks: textFx.explode (in) → glitterFx.burst (small) → effectFx.glitchBurst (single)
  // Owns:   one-word emphasis beats (the moment a key word lands).
  // Inputs:
  //   target          word/phrase element
  //   at, duration    placement
  //   intensity       scatter distance, particle count
  //   seed            PRNG seed
  //   stagger         per-letter assembly stagger (default 0.025)
  function kineticBurst(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 1.0);
    const intensity = clampIntensity(o.intensity);
    const seed = o.seed != null ? +o.seed : 5;
    const stagger = +o.stagger || 0.025;

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.kineticBurst: no element for", target); return; }

    const host = resolveTarget(o.particleHost) || el.parentElement || el;

    // 1. Letter explode-assemble — chars converge from a scattered field.
    if (typeof global.textFx?.explode === "function") {
      global.textFx.explode(timeline, el, {
        at, duration: Math.min(0.6, duration * 0.55),
        mode: "in", seed, stagger,
        distance: 280 * intensity,
        ease: "back.out(1.6)",
      });
    }

    // 2. Small glitter burst as letters land — texture, not size.
    const burstAt = at + duration * 0.45;
    if (typeof global.glitterFx?.burst === "function") {
      global.glitterFx.burst(timeline, host, {
        at: burstAt, duration: Math.min(0.7, duration * 0.5),
        count: Math.floor(36 * intensity),
        distance: 200 * intensity,
        seed: seed + 7,
      });
    }

    // 3. Micro-glitch on settle — the period at the end.
    const glitchAt = at + duration * 0.65;
    if (typeof global.effectFx?.glitchBurst === "function") {
      global.effectFx.glitchBurst(timeline, el, {
        at: glitchAt, duration: 0.12, shake: false,
      });
    }

    return { duration };
  }

  // ---------- combo 6: slamCut -------------------------------------------
  //
  // Hard scene transition. Outgoing scene flashes to noir → glitch + jitter →
  // multiplane snap-back → words cascade in → grade-pop in. ~0.9s.
  //
  // Stacks: noir flash overlay → effectFx.glitchBurst → multiplane Z-snap →
  //         textFx.cascade (incoming) → grade-pop fade
  // Owns:   the chapter-break / hard-cut transition.
  // Inputs:
  //   target          scene container (transition host)
  //   content         selector inside the new scene whose words cascade in
  //   at, duration    placement
  //   intensity       noir depth, snap distance
  function slamCut(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 0.9);
    const intensity = clampIntensity(o.intensity);

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.slamCut: no scene for", target); return; }
    ensureComboFxBridge();
    el.classList.add("combo-fx-noir-flash");

    const content = resolveTarget(o.content);

    // 1. Noir flash up — full opacity in 80ms.
    timeline.fromTo(el,
      { "--combo-noir": 0 },
      { "--combo-noir": 0.85 * intensity, duration: 0.10, ease: "power2.in" },
      at);

    // 2. Glitch burst at the peak of the flash.
    if (typeof global.effectFx?.glitchBurst === "function") {
      global.effectFx.glitchBurst(timeline, el, {
        at: at + 0.10, duration: 0.18, shake: true,
      });
    }

    // 3. Multiplane snap-back if the scene has a stage (otherwise no-op).
    const stageEl = el.querySelector(".scene__stage, .stage");
    if (stageEl && typeof global.effectFx?.multiplaneDolly === "function") {
      global.effectFx.multiplaneDolly(timeline, stageEl, {
        at: at + 0.10, duration: 0.45,
        from: 200 * intensity, to: 0, ease: "expo.out",
      });
    }

    // 4. Noir flash clears as the new scene resolves.
    timeline.to(el,
      { "--combo-noir": 0, duration: 0.30, ease: "power2.out" },
      at + 0.18);

    // 5. Words cascade in for the new content.
    const cascadeAt = at + 0.25;
    if (content && typeof global.textFx?.cascade === "function") {
      global.textFx.cascade(timeline, content, {
        at: cascadeAt,
        duration: Math.min(0.55, duration * 0.5),
        stagger: 0.06, distance: 60,
        ease: "power3.out",
      });
    }

    // 6. Grade-pop fade — saturation lift on the scene root settling in.
    timeline.fromTo(el,
      { filter: "saturate(0.85) contrast(1)" },
      { filter: "saturate(1.08) contrast(1.05) brightness(1.02)",
        duration: 0.40, ease: "power2.out" },
      at + 0.30);

    timeline.call(() => el.classList.remove("combo-fx-noir-flash"), [], at + duration);

    return { duration };
  }

  // ---------- combo 7: signalPulse ---------------------------------------
  //
  // Beacon / call-to-action moment. Concentric expanding rings emanate from
  // a beacon point, caption types on, ambient glitter shimmers at the peak,
  // optional counter on a number badge. ~1.6s default.
  //
  // Stacks: 5 expanding radio-wave rings (staggered) → textFx.typeOn caption
  //         → glitterFx.ambient pin-shimmer → textFx.counter (if number)
  // Owns:   the "look here" / data-callout moment.
  // Inputs:
  //   target          beacon container (the rings emanate from this element's center)
  //   caption         selector for the typeOn caption (optional)
  //   counter         selector for a counter element (optional, must contain a number)
  //   at, duration    placement
  //   intensity       ring count multiplier (default 1)
  //   ringCount       explicit ring count override (default 5)
  //   seed            PRNG seed (only for glitter)
  function signalPulse(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 1.6);
    const intensity = clampIntensity(o.intensity);
    const ringCount = Math.max(2, Math.min(8, Math.floor(+o.ringCount || 5)));
    const seed = o.seed != null ? +o.seed : 7;

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.signalPulse: no element for", target); return; }
    ensureComboFxBridge();

    if (getComputedStyle(el).position === "static") el.style.position = "relative";

    const caption = resolveTarget(o.caption);
    const counter = resolveTarget(o.counter);

    // 1. Spawn rings — each tweens 0,0,opacity:1 → maxR,maxR,opacity:0.
    //    Stagger 0.18s between rings; each ring lives ~0.9s.
    const maxR = Math.max(el.clientWidth || 600, el.clientHeight || 600) * 0.85 * intensity;
    const ringLife = Math.min(1.0, duration * 0.7);
    for (let i = 0; i < ringCount; i++) {
      const ring = document.createElement("span");
      ring.className = "combo-fx-radio-ring";
      el.appendChild(ring);
      const startAt = at + i * Math.max(0.10, (duration - ringLife) / Math.max(1, ringCount));
      timeline.set(ring, { width: 0, height: 0, opacity: 1 }, Math.max(0, startAt - 0.001));
      timeline.fromTo(ring,
        { width: 0, height: 0, opacity: 0.95 },
        { width: maxR, height: maxR, opacity: 0,
          duration: ringLife, ease: "power2.out" },
        startAt);
      timeline.call(() => ring.remove(), [], startAt + ringLife + 0.05);
    }

    // 2. Caption types on overlapping the ring expansion.
    if (caption && typeof global.textFx?.typeOn === "function") {
      global.textFx.typeOn(timeline, caption, {
        at: at + 0.10,
        duration: Math.min(0.9, duration * 0.6),
      });
    }

    // 3. Ambient glitter at the beacon — gentle in-place shimmer.
    if (typeof global.glitterFx?.ambient === "function") {
      global.glitterFx.ambient(timeline, el, {
        at: at + duration * 0.20,
        duration: duration * 0.7,
        count: Math.floor(20 * intensity),
        seed, sizeRange: [3, 6],
      });
    }

    // 4. Counter ticks on a number badge — only if provided and parseable.
    if (counter && typeof global.textFx?.counter === "function") {
      try {
        global.textFx.counter(timeline, counter, {
          at: at + duration * 0.35,
          duration: Math.min(1.0, duration * 0.55),
          from: 0, ease: "power2.out",
        });
      } catch (e) {}
    }

    return { duration };
  }

  // ---------- combo 8: paperTear -----------------------------------------
  //
  // Reveal beneath / "and now…". Outgoing layer warps via inkBleed in reverse
  // and stagger up-and-out, camera dollies back, incoming layer stamps in
  // under a warm grade. ~1.4s default.
  //
  // Stacks: textFx.explode (out) on outgoing → effectFx.inkBleed reverse →
  //         multiplaneDolly back → textFx.stamp on incoming → grade-warm filter
  // Owns:   transition between scenes that emphasises "old peels off".
  // Inputs:
  //   target          the scene container hosting both layers (or just the camera stage)
  //   outgoing        selector for the leaving text
  //   incoming        selector for the arriving lockup/text (stamps in)
  //   stage           selector for the multiplane stage to dolly (defaults to target)
  //   at, duration    placement
  //   intensity       distance / displacement multipliers
  //   seed            PRNG seed (for explode-out scatter)
  function paperTear(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 1.4);
    const intensity = clampIntensity(o.intensity);
    const seed = o.seed != null ? +o.seed : 8;

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.paperTear: no element for", target); return; }

    const outgoing = resolveTarget(o.outgoing);
    const incoming = resolveTarget(o.incoming);
    const stage = resolveTarget(o.stage) || el;

    // 1. Outgoing — explode out (chars scatter away).
    if (outgoing && typeof global.textFx?.explode === "function") {
      global.textFx.explode(timeline, outgoing, {
        at, duration: 0.5, mode: "out", seed,
        distance: 280 * intensity,
        ease: "power3.in",
        stagger: 0.018,
      });
    }

    // 2. Outgoing — inkBleed reverse (crisp → warped) over the same window
    //    so the chars look like they're peeling apart on the way out.
    if (outgoing && typeof global.effectFx?.inkBleed === "function") {
      // inkBleed normally goes from→to; pass from:0 to:80 for reverse.
      global.effectFx.inkBleed(timeline, outgoing, {
        at, duration: 0.45,
        from: 0, to: 60 * intensity,
        clearAfter: false,
        ease: "power2.in",
      });
    }

    // 3. Camera dollies back during the dissolve (extra "pulled away" feel).
    if (typeof global.effectFx?.multiplaneDolly === "function") {
      global.effectFx.multiplaneDolly(timeline, stage, {
        at, duration: duration * 0.7,
        from: 0, to: -120 * intensity,
        ease: "power2.inOut",
      });
    }

    // 4. Incoming — stamp lockup mid-window with shake.
    const stampAt = at + duration * 0.55;
    if (incoming && typeof global.textFx?.stamp === "function") {
      global.textFx.stamp(timeline, incoming, {
        at: stampAt, duration: 0.45,
        fromScale: 1.5 + 0.4 * intensity,
        ease: "back.out(2.2)",
        shake: true,
      });
    }

    // 5. Warm grade filter pulse on the scene root as new layer settles.
    timeline.fromTo(el,
      { filter: "saturate(0.92) brightness(0.96)" },
      { filter: "saturate(1.08) brightness(1.04) contrast(1.04)",
        duration: 0.5, ease: "power2.out" },
      stampAt);

    return { duration };
  }

  // ---------- combo 9: confettiFinale ------------------------------------
  //
  // End-card / outro. Camera settles in, logo lockup stamps centre, rule line
  // draws via scaleX, double-particle (burst + fall) celebrates, cinemagraph
  // begins idle drift. ~2.4s default — crescendo.
  //
  // Stacks: multiplaneDolly settle → textFx.stamp logo → rule line scaleX →
  //         glitterFx.burst + glitterFx.fall combined → cinemagraphRotate idle
  // Owns:   final-card / wrap-up beat.
  // Inputs:
  //   target          end-card scene container
  //   lockup          selector for the logo / mark element (stamps in)
  //   rule            selector for the divider rule (scales in)
  //   tagline         selector for the tagline text (cascade in, optional)
  //   stage           selector for the multiplane stage (defaults to target)
  //   cinemagraph     selector for .fx-cinemagraph-bg (optional)
  //   at, duration    placement
  //   intensity       glitter count, dolly distance
  //   seed            PRNG seed
  function confettiFinale(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 2.4);
    const intensity = clampIntensity(o.intensity);
    const seed = o.seed != null ? +o.seed : 9;

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.confettiFinale: no scene for", target); return; }

    const lockup = resolveTarget(o.lockup);
    const rule = resolveTarget(o.rule);
    const tagline = resolveTarget(o.tagline);
    const stage = resolveTarget(o.stage) || el.querySelector(".scene__stage, .stage") || el;
    const cg = resolveTarget(o.cinemagraph) || el.querySelector(".fx-cinemagraph-bg");

    // 1. Camera settles in — slow push from -80 to 0.
    if (typeof global.effectFx?.multiplaneDolly === "function") {
      global.effectFx.multiplaneDolly(timeline, stage, {
        at, duration: Math.min(1.4, duration * 0.6),
        from: -100 * intensity, to: 0,
        ease: "power2.out",
      });
    }

    // 2. Logo lockup stamps in at 25% of window.
    const stampAt = at + duration * 0.18;
    if (lockup && typeof global.textFx?.stamp === "function") {
      try {
        global.textFx.stamp(timeline, lockup, {
          at: stampAt, duration: 0.55,
          fromScale: 1.6 + 0.3 * intensity,
          ease: "back.out(1.8)",
          shake: false,
        });
      } catch (e) {
        // Fallback if stamp expects text/parent shake to work — direct fromTo.
        timeline.fromTo(lockup,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.8)" },
          stampAt);
      }
    }

    // 3. Rule line scales from 0 → 1 right after the lockup lands.
    const ruleAt = stampAt + 0.35;
    if (rule) {
      timeline.fromTo(rule,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.7, ease: "expo.out" },
        ruleAt);
    }

    // 4. Tagline word-cascade.
    if (tagline && typeof global.textFx?.cascade === "function") {
      global.textFx.cascade(timeline, tagline, {
        at: ruleAt + 0.10,
        duration: 0.55, stagger: 0.07,
        distance: 40, ease: "power3.out",
      });
    }

    // 5. Confetti — burst + fall combined, count split by intensity.
    const burstAt = stampAt + 0.20;
    if (typeof global.glitterFx?.burst === "function") {
      global.glitterFx.burst(timeline, el, {
        at: burstAt,
        duration: Math.min(1.6, duration - (burstAt - at)),
        count: Math.floor(80 * intensity),
        distance: 700 * intensity,
        gravity: 80,
        seed,
      });
    }
    if (typeof global.glitterFx?.fall === "function") {
      global.glitterFx.fall(timeline, el, {
        at: burstAt + 0.30,
        duration: Math.max(1.0, duration - (burstAt - at) - 0.30),
        count: Math.floor(60 * intensity),
        seed: seed + 13,
        wobble: 80,
      });
    }

    // 6. Cinemagraph idle drift across the whole window — stays after.
    if (cg && typeof global.effectFx?.cinemagraphRotate === "function") {
      global.effectFx.cinemagraphRotate(timeline, cg, {
        at, duration, turns: 0.30 * intensity, ease: "none",
      });
    }

    return { duration };
  }

  // ---------- combo 10: holoFlash ----------------------------------------
  //
  // Brand badge / sticker land. Holo gradient drifts across the badge bg,
  // multiplane near-pop on the lockup, stamp + glitchBurst on land, glitter
  // burst rewards, long-shadow drop adds weight. ~1.4s default.
  //
  // Stacks: holo gradient drift → multiplane near-pop → textFx.stamp →
  //         effectFx.glitchBurst → glitterFx.burst → long-shadow drop
  // Owns:   brand-chip / sticker arrival moments.
  // Inputs:
  //   target          host element (a div with .fx-holo-sticker or any rect)
  //   lockup          selector for the lockup text inside (stamps in)
  //   stage           selector for the multiplane stage (defaults to target.parentElement)
  //   at, duration    placement
  //   intensity       gradient drift speed, glitter count
  //   seed            PRNG seed
  function holoFlash(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +pick(o, "duration", 1.4);
    const intensity = clampIntensity(o.intensity);
    const seed = o.seed != null ? +o.seed : 10;

    const el = resolveTarget(target);
    if (!el) { console.warn("comboFx.holoFlash: no element for", target); return; }
    ensureComboFxBridge();
    el.classList.add("combo-fx-holo-host");

    const lockup = resolveTarget(o.lockup);
    const stage = resolveTarget(o.stage) || el.parentElement || el;

    // 1. Holo gradient drifts across the full window — feels iridescent.
    timeline.fromTo(el,
      { backgroundPositionX: "0%" },
      { backgroundPositionX: `${(150 + 100 * intensity).toFixed(0)}%`,
        duration, ease: "none" },
      at);

    // 2. Multiplane near-pop — lockup pushes IN from positive Z (closer to camera).
    if (typeof global.effectFx?.multiplaneDolly === "function") {
      global.effectFx.multiplaneDolly(timeline, stage, {
        at, duration: 0.6,
        from: 200 * intensity, to: 0,
        ease: "expo.out",
      });
    }

    // 3. Stamp on the lockup at 20% in.
    const stampAt = at + duration * 0.20;
    if (lockup && typeof global.textFx?.stamp === "function") {
      global.textFx.stamp(timeline, lockup, {
        at: stampAt, duration: 0.40,
        fromScale: 1.5 + 0.4 * intensity,
        ease: "back.out(2.0)",
        shake: true,
      });
    }

    // 4. Glitch burst on the badge as it lands.
    if (typeof global.effectFx?.glitchBurst === "function") {
      global.effectFx.glitchBurst(timeline, el, {
        at: stampAt + 0.04, duration: 0.16, shake: false,
      });
    }

    // 5. Glitter burst spilling around the sticker.
    if (typeof global.glitterFx?.burst === "function") {
      global.glitterFx.burst(timeline, el, {
        at: stampAt + 0.08,
        duration: Math.min(0.9, duration - (stampAt - at) - 0.10),
        count: Math.floor(50 * intensity),
        distance: 320 * intensity,
        seed,
      });
    }

    // 6. Long-shadow drop (filter pulse) — reads as weight settling.
    timeline.fromTo(el,
      { filter: "drop-shadow(0 0 0 rgba(0,0,0,0))" },
      { filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.42)) drop-shadow(0 4px 12px rgba(0,0,0,0.18))",
        duration: 0.45, ease: "power2.out" },
      stampAt + 0.05);

    return { duration };
  }

  // ---------- registry ---------------------------------------------------

  global.comboFx = {
    superImpact,
    cinematicReveal,
    hyperGlitch,
    dreamSequence,
    kineticBurst,
    slamCut,
    signalPulse,
    paperTear,
    confettiFinale,
    holoFlash,
  };
})(typeof window !== "undefined" ? window : this);
