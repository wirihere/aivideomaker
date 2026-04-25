// =========================================================================
// MODULE — EFFECT FX
// =========================================================================
// One-line GSAP wrappers around the cinematic primitives in
// effects-batch-08.css. Same API shape as text-fx.js so they're swap-friendly.
//
// Loading:
//   <link  rel="stylesheet" href="design/effects-batch-08.css">
//   <link  rel="stylesheet" href="design/modules/effect-fx.css">
//   <script src="design/modules/effect-fx.js"><\/script>
//
// Use after building the timeline:
//   effectFx.multiplaneDolly  (tl, "#s2-stage",     { at: 0,    duration: 4.4 });
//   effectFx.inkBleed         (tl, "#headline",     { at: 1.2,  duration: 0.7 });
//   effectFx.glitchBurst      (tl, "#word",         { at: 2.6,  duration: 0.18 });
//   effectFx.cinemagraphRotate(tl, "#bg-cinemagraph", { at: 0,  duration: 24 });
//
// Pre-conditions:
// - For inkBleed / glitchBurst: the SVG <filter> defs from
//   effects-batch-08.css's HOW-TO must be pasted at the bottom of <body>.
//   Filter ids: #fx-ink, #fx-rgb-shift (defaults).
// - For multiplaneDolly: target the inner `.stage` (NOT the .fx-multiplane
//   wrapper). The wrapper provides the perspective; the stage is what dollies.
// - For cinemagraphRotate: target the `.fx-cinemagraph-bg` host. The function
//   animates a CSS custom property `--cg-rotation` that the conic blob's
//   ::before pseudo consumes (CSS rule auto-injected on first call).

(function (global) {
  "use strict";

  // ---------- helpers ----------------------------------------------------

  function resolveTarget(target) {
    if (target instanceof Element) return target;
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  // Inject the cinemagraph CSS-var rule once per document. Pseudo-elements
  // can't be tweened directly, but they DO read CSS custom properties from
  // their host — so we tween the var and the ::before consumes it.
  function ensureCinemagraphRule() {
    if (document.getElementById("__effect-fx-cg")) return;
    const style = document.createElement("style");
    style.id = "__effect-fx-cg";
    style.textContent = `.fx-cinemagraph-bg::before {
  transform: rotate(var(--cg-rotation, 0deg));
}`;
    document.head.appendChild(style);
  }

  // Inject the radial-mask CSS-var rule once per document. The mask cuts a
  // soft-edged disc out of the target so the visible region appears
  // "spotlit" while the rest is feathered out. We tween a `--rm-radius`
  // variable that the mask-image consumes, plus center / feather knobs.
  function ensureRadialMaskRule() {
    if (document.getElementById("__effect-fx-rm")) return;
    const style = document.createElement("style");
    style.id = "__effect-fx-rm";
    style.textContent = `.fx-radial-mask {
  --rm-radius: 0%;
  --rm-cx: 50%;
  --rm-cy: 50%;
  --rm-feather: 8%;
  -webkit-mask-image: radial-gradient(circle at var(--rm-cx) var(--rm-cy),
    rgba(0,0,0,1) var(--rm-radius),
    rgba(0,0,0,0) calc(var(--rm-radius) + var(--rm-feather)));
          mask-image: radial-gradient(circle at var(--rm-cx) var(--rm-cy),
    rgba(0,0,0,1) var(--rm-radius),
    rgba(0,0,0,0) calc(var(--rm-radius) + var(--rm-feather)));
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
}`;
    document.head.appendChild(style);
  }

  // ---------- recipes ----------------------------------------------------

  // MULTIPLANE DOLLY — translate the .stage along Z to push toward / pull
  // back from the camera. The .plane-* depth presets handle parallax for free.
  function multiplaneDolly(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 4.0;
    const from = o.from != null ? +o.from : -120;
    const to   = o.to   != null ? +o.to   : 0;
    const ease = o.ease || "power2.out";

    const el = resolveTarget(target);
    if (!el) { console.warn("effectFx.multiplaneDolly: no element for", target); return; }

    timeline.fromTo(el,
      { z: from },
      { z: to, duration, ease },
      at);

    return { from, to, duration };
  }

  // INK BLEED — animate the feDisplacementMap inside an SVG filter from a
  // high scale (warped, illegible) down to 0 (crisp). Pair with a class that
  // applies `filter: url(#fx-ink)` to the target before the call.
  function inkBleed(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 0.7;
    const filterId = o.filterId || "fx-ink";
    const from = o.from != null ? +o.from : 80;
    const to   = o.to   != null ? +o.to   : 0;
    const ease = o.ease || "power2.out";
    const clearAfter = o.clearAfter !== false;

    const el = resolveTarget(target);
    if (!el) { console.warn("effectFx.inkBleed: no element for", target); return; }
    const map = document.querySelector(`#${filterId} feDisplacementMap`);
    if (!map) {
      console.warn(`effectFx.inkBleed: no <feDisplacementMap> inside #${filterId} — paste the SVG defs from effects-batch-08.css HOW-TO`);
      return;
    }

    // Lock the filter on at the start, animate the map's scale.
    timeline.set(el, { filter: `url(#${filterId})` }, at);
    timeline.fromTo(map,
      { attr: { scale: from } },
      { attr: { scale: to }, duration, ease },
      at);

    // Drop the filter when the bleed completes — saves render cost on later frames.
    if (clearAfter) {
      timeline.set(el, { filter: "none" }, at + duration);
    }

    return { duration, from, to };
  }

  // GLITCH BURST — short chromatic-shift + jitter window. Use for impact
  // moments only (sub-second). Continuous glitch reads amateur.
  function glitchBurst(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 0.18;
    const filterId = o.filterId || "fx-rgb-shift";
    const shake = o.shake !== false;

    const el = resolveTarget(target);
    if (!el) { console.warn("effectFx.glitchBurst: no element for", target); return; }

    timeline.set(el, { filter: `url(#${filterId})` }, at);
    if (shake) {
      timeline.call(() => el.classList.add("vibe-shake"),    [], at);
      timeline.call(() => el.classList.remove("vibe-shake"), [], at + 0.18);
    }
    timeline.set(el, { filter: "none" }, at + duration);

    return { duration };
  }

  // CINEMAGRAPH ROTATE — slow rotation of the conic-gradient blob. Inject a
  // CSS rule once that pipes a CSS variable into the ::before's transform,
  // then tween the variable.
  function cinemagraphRotate(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 24;
    const from = o.from != null ? +o.from : 0;
    const turns = o.turns != null ? +o.turns : 1;
    const ease = o.ease || "none";

    const el = resolveTarget(target);
    if (!el) { console.warn("effectFx.cinemagraphRotate: no element for", target); return; }
    ensureCinemagraphRule();

    const to = from + 360 * turns;
    timeline.fromTo(el,
      { "--cg-rotation": `${from}deg` },
      { "--cg-rotation": `${to}deg`, duration, ease },
      at);

    return { from, to, duration };
  }

  // RACK FOCUS — animate a CSS `filter: blur(...)` on the target. Pairs with
  // the cinematographer's "rack focus" — the lens shifts focus from one
  // depth to another, so out-of-focus planes go soft and the new subject
  // becomes crisp. Same Windows-safe pattern as `inkBleed` (locks the
  // filter on at the start, clears it on completion to free render cost).
  function rackFocus(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = o.duration != null ? +o.duration : 0.6;
    const from = o.from != null ? +o.from : 8;
    const to   = o.to   != null ? +o.to   : 0;
    const ease = o.ease || "power2.out";
    const clearAfter = o.clearAfter !== false;

    const el = resolveTarget(target);
    if (!el) { console.warn("effectFx.rackFocus: no element for", target); return; }

    timeline.fromTo(el,
      { filter: `blur(${from}px)` },
      { filter: `blur(${to}px)`, duration, ease },
      at);

    // Drop the filter when the rack completes — saves render cost on later
    // frames and prevents stacked blur filters bleeding into other tweens.
    if (clearAfter) {
      timeline.set(el, { filter: "none" }, at + duration);
    }

    return { duration, from, to };
  }

  // RADIAL MASK — open a soft-edged spotlight on the target by animating a
  // CSS variable (`--rm-radius`) that an injected mask-image rule consumes.
  // The mask is a radial-gradient at (centerX, centerY) with a feathered
  // edge of `feather` width. Default goes 0% → 50% (closed → open
  // spotlight covering most of the host). Use with siblings dimmed for
  // "isolate this element" moments.
  function radialMask(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = o.duration != null ? +o.duration : 0.5;
    const from = o.from != null ? +o.from : 0;
    const to   = o.to   != null ? +o.to   : 50;
    const centerX = o.centerX != null ? +o.centerX : 50;
    const centerY = o.centerY != null ? +o.centerY : 50;
    const feather = o.feather != null ? +o.feather : 8;
    const ease = o.ease || "power2.out";
    const clearAfter = o.clearAfter !== false;

    const el = resolveTarget(target);
    if (!el) { console.warn("effectFx.radialMask: no element for", target); return; }
    ensureRadialMaskRule();
    el.classList.add("fx-radial-mask");

    // Set static positioning vars once at `at` so the mask is anchored
    // correctly even if multiple radialMask calls overlap on the same host.
    timeline.set(el, {
      "--rm-cx": `${centerX}%`,
      "--rm-cy": `${centerY}%`,
      "--rm-feather": `${feather}%`,
    }, at);

    timeline.fromTo(el,
      { "--rm-radius": `${from}%` },
      { "--rm-radius": `${to}%`, duration, ease },
      at);

    // Drop the mask class when the spotlight completes — otherwise the
    // mask-image sticks around and clips later content.
    if (clearAfter) {
      timeline.call(() => el.classList.remove("fx-radial-mask"), [], at + duration);
    }

    return { duration, from, to };
  }

  global.effectFx = { multiplaneDolly, inkBleed, glitchBurst, cinemagraphRotate, rackFocus, radialMask };
})(typeof window !== "undefined" ? window : this);
