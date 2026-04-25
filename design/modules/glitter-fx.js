// =========================================================================
// MODULE — GLITTER FX
// =========================================================================
// Deterministic particle system. Three recipes for layering glittery sparkle
// across a scene: a one-shot burst, a continuous fall, and ambient drift.
// All seeded — same `seed` produces the same pattern across every render.
//
// Loading (in your composition's <head>):
//   <link rel="stylesheet" href="design/modules/glitter-fx.css">
//   <script src="design/modules/glitter-fx.js"><\/script>
//
// Usage:
//   glitterFx.burst  (tl, "#scene-4-bg", { at: 14.6, count: 80, duration: 1.4 });
//   glitterFx.fall   (tl, "#scene-2-bg", { at: 4.0,  count: 60, duration: 5.0 });
//   glitterFx.ambient(tl, "#scene-2-bg", { at: 4.0,  count: 40, duration: 5.0 });
//
// The target container should be `position: relative` with `overflow: hidden`
// (the JS adds inline `position:absolute` styles on each particle relative to
// the container). Particles inherit color via the `--glitter-tint-*` CSS
// custom properties on the container — set those to match the brand palette.

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

  // Inject N particles into the container. Returns the array of created spans.
  // Each particle gets a random color from `tints` and a random size in `sizeRange`.
  function spawnParticles(container, count, rand, tints, sizeRange) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "glitter-particle";
      const tint = tints[Math.floor(rand() * tints.length)];
      const size = sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]);
      span.style.setProperty("--p-tint", tint);
      span.style.setProperty("--p-size", `${size}px`);
      // Two slight variants of shape — half plain dot, half cross-sparkle.
      if (rand() < 0.5) span.classList.add("glitter-particle--cross");
      container.appendChild(span);
      out.push(span);
    }
    return out;
  }

  // Default tint palette — overridden via opts.tints. Reads from CSS custom
  // properties on document root if available (`--glitter-tint-1..4`).
  function defaultTints() {
    const cs = getComputedStyle(document.documentElement);
    const read = (name, fallback) => (cs.getPropertyValue(name).trim() || fallback);
    return [
      read("--glitter-tint-1", "#FFD66E"),  // warm gold
      read("--glitter-tint-2", "#FFFFFF"),  // white
      read("--glitter-tint-3", "#FFC07A"),  // amber
      read("--glitter-tint-4", "#FFE9C2"),  // cream
    ];
  }

  // ---------- recipes ----------------------------------------------------

  // BURST — radial explosion from container center. Particles start at 50%/50%
  // (or `originX/originY` 0..1), scatter outward to random radial positions,
  // scale-pulse, then fade. Use for celebration / impact moments.
  function burst(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const count = Math.floor(+o.count || 80);
    const duration = +o.duration || 1.4;
    const seed = o.seed != null ? +o.seed : 1;
    const distance = +o.distance || 600;
    const tints = o.tints || defaultTints();
    const sizeRange = o.sizeRange || [4, 14];
    const originX = o.originX != null ? +o.originX : 0.5;
    const originY = o.originY != null ? +o.originY : 0.5;
    const gravity = +o.gravity || 0;     // px of additional y-drift over duration
    const ease = o.ease || "power2.out";

    const el = resolveTarget(target);
    if (!el) { console.warn("glitterFx.burst: no element for", target); return; }
    if (getComputedStyle(el).position === "static") el.style.position = "relative";

    const rand = mulberry32(seed);
    const particles = spawnParticles(el, count, rand, tints, sizeRange);
    const w = el.clientWidth || 1920;
    const h = el.clientHeight || 1080;
    const cx = w * originX;
    const cy = h * originY;

    // Hide all particles before burst, so they don't show at t=0.
    timeline.set(particles, { opacity: 0 }, Math.max(0, at - 0.001));

    particles.forEach((p, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = distance * (0.25 + rand() * 0.75);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist + gravity;
      const rot = (rand() - 0.5) * 540;
      const peakScale = 1.0 + rand() * 0.6;
      const startDelay = rand() * 0.18;       // particle-by-particle stagger
      const life = duration * (0.6 + rand() * 0.4);

      // Position at center, scale 0, opacity 0 — set initial state.
      timeline.set(p, {
        x: cx, y: cy, scale: 0, opacity: 0, rotation: 0,
      }, at + startDelay);
      // Pop in.
      timeline.to(p, {
        scale: peakScale, opacity: 1,
        duration: 0.18, ease: "power2.out",
      }, at + startDelay);
      // Drift outward + spin + fade.
      timeline.to(p, {
        x: cx + dx, y: cy + dy, rotation: rot,
        duration: life, ease,
      }, at + startDelay);
      timeline.to(p, {
        scale: 0, opacity: 0,
        duration: life * 0.5, ease: "power2.in",
      }, at + startDelay + life * 0.5);
    });

    return { count };
  }

  // FALL — continuous gentle downward sparkle. Particles spawn above the
  // container, fall slowly with horizontal wobble, fade as they descend.
  function fall(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const count = Math.floor(+o.count || 60);
    const duration = +o.duration || 5.0;
    const seed = o.seed != null ? +o.seed : 2;
    const tints = o.tints || defaultTints();
    const sizeRange = o.sizeRange || [3, 9];
    const wobble = +o.wobble || 60;     // px horizontal wobble
    const ease = o.ease || "none";

    const el = resolveTarget(target);
    if (!el) { console.warn("glitterFx.fall: no element for", target); return; }
    if (getComputedStyle(el).position === "static") el.style.position = "relative";

    const rand = mulberry32(seed);
    const particles = spawnParticles(el, count, rand, tints, sizeRange);
    const w = el.clientWidth || 1920;
    const h = el.clientHeight || 1080;

    timeline.set(particles, { opacity: 0 }, Math.max(0, at - 0.001));

    particles.forEach((p) => {
      const startX = rand() * w;
      const startY = -50 - rand() * 120;          // start above container
      const endX = startX + (rand() - 0.5) * wobble;
      const endY = h + 50;
      const fallTime = duration * (0.65 + rand() * 0.35);
      const startDelay = rand() * duration * 0.6;
      const rot = (rand() - 0.5) * 720;

      timeline.set(p, { x: startX, y: startY, scale: 0.6, opacity: 0, rotation: 0 }, at + startDelay);
      timeline.to(p, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, at + startDelay);
      timeline.to(p, { x: endX, y: endY, rotation: rot, duration: fallTime, ease }, at + startDelay);
      timeline.to(p, { opacity: 0, scale: 0.5, duration: 0.5, ease: "power2.in" }, at + startDelay + fallTime - 0.5);
    });

    return { count };
  }

  // AMBIENT — particles scattered randomly, each pulses in place. No drift.
  // Use for a low-key shimmer behind hero content. Pulse runs via CSS animation
  // (deterministic at render time) — only 2 timeline tweens per call total
  // (show + hide), regardless of particle count. Light on the GSAP timeline.
  function ambient(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const count = Math.floor(+o.count || 40);
    const duration = +o.duration || 5.0;
    const seed = o.seed != null ? +o.seed : 3;
    const tints = o.tints || defaultTints();
    const sizeRange = o.sizeRange || [3, 8];

    const el = resolveTarget(target);
    if (!el) { console.warn("glitterFx.ambient: no element for", target); return; }
    if (getComputedStyle(el).position === "static") el.style.position = "relative";

    const rand = mulberry32(seed);
    const particles = spawnParticles(el, count, rand, tints, sizeRange);
    const w = el.clientWidth || 1920;
    const h = el.clientHeight || 1080;

    particles.forEach((p) => {
      const px = rand() * w;
      const py = rand() * h;
      const period = 0.8 + rand() * 1.2;       // sec per pulse
      const phase  = rand() * period;           // sec offset
      // Place particle and hand the pulse over to the CSS @keyframes.
      // `--p-base` preserves the position; the keyframe layers scale on top.
      p.classList.add("glitter-particle--ambient");
      p.style.setProperty("--p-base", `translate(${px}px, ${py}px) rotate(${(rand()*360).toFixed(0)}deg)`);
      p.style.setProperty("--p-period", `${period.toFixed(3)}s`);
      p.style.setProperty("--p-delay", `-${phase.toFixed(3)}s`);
      p.style.transform = `translate(${px}px, ${py}px)`;
      p.style.opacity = "0";
    });

    // Two tweens total: enable visibility window across all particles.
    timeline.set(particles, { opacity: 1 }, at);
    timeline.set(particles, { opacity: 0 }, at + duration);

    return { count };
  }

  global.glitterFx = { burst, fall, ambient };
})(typeof window !== "undefined" ? window : this);
