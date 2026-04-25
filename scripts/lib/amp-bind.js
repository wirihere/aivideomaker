// Audio-reactive binding helper — turns a baked amplitude envelope into GSAP
// keyframes that drive CSS custom properties on a target element.
//
// Pair with scripts/extract-amp.mjs which writes JSON shaped like:
//   { source, fps, frames, bands:["bass","mid","high"], data:[[b,m,h], ...] }
//
// Why offline keyframes (not Web Audio at runtime): HyperFrames captures frames
// in a headless browser at non-realtime cadence. AnalyserNode reads the audio
// clock, not the render clock — values would be wrong. We pre-bake the envelope
// and replay it as deterministic timeline keyframes. See LEARNINGS.md §3.
//
// Loading (in your composition's <head>):
//   <script src="scripts/lib/amp-bind.js"><\/script>
//
// Use inside a composition:
//   const tl = gsap.timeline({ paused: true });
//   window.__timelines["scene-id"] = tl;
//
//   const amp = await fetch("assets/amp/bed.json").then(r => r.json());
//   ampBind(tl, amp, ".scene", {
//     // optional — defaults shown
//     channels: { bass: "--amp-bass", mid: "--amp-mid", high: "--amp-high" },
//     offset:   0,        // time in seconds where amp playback begins on tl
//     stride:   1,        // emit a keyframe every N frames (1 = every frame)
//     scale:    1,        // multiply amplitude by this constant
//     smooth:   0,        // 0..1 EMA factor; 0 = passthrough, 0.85 ≈ slow follow
//     gate:     0,        // values below this read as 0 (kills floor noise)
//   });
//
// CSS hookup:
//   .scene { --amp-bass: 0; --amp-mid: 0; --amp-high: 0; }
//   .fx-amp-scale { transform: scale(calc(1 + var(--amp-bass) * 0.06)); }
//
// Why one keyframe per frame is OK: GSAP handles 1000s of `set` calls fine,
// and the renderer evaluates the timeline at exact frame times — there's no
// interpolation overhead during capture. For very long clips, set `stride` to
// 2 or 3 to thin the keyframe count without visible artifacts (eye smooths).
//
// `target` may be a CSS selector or an Element. A selector matches all
// elements (multi-target binding) — useful when many scenes share an envelope.

(function (global) {
  "use strict";

  function resolveTargets(target) {
    if (!target) return [];
    if (typeof target === "string") {
      return Array.from(document.querySelectorAll(target));
    }
    if (target instanceof Element) return [target];
    if (Array.isArray(target)) return target;
    if (target.length != null) return Array.from(target); // NodeList
    return [];
  }

  function ampBind(timeline, amp, target, opts) {
    if (!timeline || typeof timeline.set !== "function") {
      throw new Error("ampBind: first arg must be a GSAP timeline");
    }
    if (!amp || !Array.isArray(amp.data) || !Array.isArray(amp.bands)) {
      throw new Error("ampBind: second arg must be a baked amp JSON object");
    }
    const o = opts || {};
    const channels = o.channels || {
      bass: "--amp-bass",
      mid:  "--amp-mid",
      high: "--amp-high",
    };
    const offset = +o.offset || 0;
    const stride = Math.max(1, Math.floor(o.stride || 1));
    const scale  = o.scale != null ? +o.scale : 1;
    const smooth = Math.max(0, Math.min(0.99, +o.smooth || 0));
    const gate   = Math.max(0, +o.gate || 0);

    const targets = resolveTargets(target);
    if (!targets.length) {
      console.warn("ampBind: target matched 0 elements", target);
      return { keyframes: 0 };
    }

    // Map channel name → index in amp.data rows.
    const bandIndex = {};
    amp.bands.forEach((b, i) => { bandIndex[b] = i; });
    const channelEntries = Object.entries(channels).filter(([band]) => {
      if (bandIndex[band] == null) {
        console.warn(`ampBind: band "${band}" not in amp.bands (${amp.bands.join(",")})`);
        return false;
      }
      return true;
    });

    const fps = amp.fps;
    const frames = amp.data.length;

    // EMA state per band (one running value, shared across targets — same envelope).
    const ema = Object.fromEntries(channelEntries.map(([b]) => [b, 0]));

    let count = 0;
    for (let i = 0; i < frames; i += stride) {
      const t = offset + i / fps;
      const row = amp.data[i];
      const props = {};
      for (const [band, cssVar] of channelEntries) {
        let v = row[bandIndex[band]] * scale;
        if (v < gate) v = 0;
        if (smooth > 0) {
          ema[band] = ema[band] * smooth + v * (1 - smooth);
          v = ema[band];
        }
        props[cssVar] = +v.toFixed(4);
      }
      // One set call per target — GSAP fans this out efficiently.
      for (const el of targets) {
        timeline.set(el, props, t);
      }
      count++;
    }

    return { keyframes: count, targets: targets.length };
  }

  global.ampBind = ampBind;
})(typeof window !== "undefined" ? window : this);
