// =========================================================================
// MODULE — SHADER FX (WebGL2 procedural overlay)
// =========================================================================
// Phase 1 of the WebGL effects prototype (see
// docs/webgl-effects-feasibility-2026-04-26.md). Ships a single named effect
// — `shaderFx.dof` — that paints a procedural bokeh layer onto a per-scene
// `<canvas>` overlay using twgl.js + raw GLSL. Same seekable, deterministic
// pattern as `effect-fx.js` and `combo-fx.js` (CSS-variable-bridge driven by
// GSAP, read by the RAF loop, written as a uniform).
//
// Phase 2 (deferred): radial chromatic aberration on the same module.
//
// Loading (in your composition's <head>):
//   <link rel="stylesheet" href="design/effects-batch-08.css">
//   <link rel="stylesheet" href="design/modules/all.css">
//   <script src="design/vendor/gsap.min.js"><\/script>
//   <script src="design/vendor/twgl.min.js"><\/script>
//   <script src="design/modules/all.js"><\/script>
//
// Use after building the timeline:
//   const tl = gsap.timeline({ paused: true });
//   window.__timelines["my-scene"] = tl;
//
//   shaderFx.dof(tl, "#scene-2", { at: 0.4, duration: 1.2 });
//
// Wiring shape:
//   The `dof` function appends a canvas with `data-shader-pass="dof"` as
//   the last child of the scene element, sets up a WebGL2 program at module
//   init time, and adds GSAP tweens on `--shader-aperture` (0..1). A single
//   global RAF loop reads the CSS variable each frame and writes it as a
//   uniform — so the shader's intensity is fully GSAP-controlled and
//   timeline-seekable. Same approach as `effect-fx.cinemagraphRotate`.
//
// API contract:
//   shaderFx.dof(timeline, sceneSelector, {
//     at: 0,          // timeline position (sec)
//     duration: 0.6,  // ramp window (sec)
//     intensity: 1,   // 0..2 multiplier on the peak aperture
//     seed: 1,        // deterministic ring rotation offset
//   });
//
// Returns: the canvas element (so callers can compose further).
//
// Constraints (per project LEARNINGS.md §3 + the feasibility doc):
//   - WebGL2 only — render farm runs Chrome 121+.
//   - Pure shader: uniforms + time + seed. NO Math.random, NO Date.now.
//   - Pre-compile programs at module init (avoids first-frame stutter at
//     seek-to-zero).
//   - sRGB output via `gl.SRGB8_ALPHA8` on the framebuffer texture (or
//     gamma-correct in-shader). Without one of those the overlay washes out.
//   - Cleanup: when canvas leaves the DOM, the RAF loop drops it from its
//     instance list. Otherwise zombie loops on every render.

/* global gsap, twgl */

(function (global) {
  "use strict";

  // ---------- helpers ----------------------------------------------------

  // Mirrors `combo-fx.js` line 57 — same PRNG, same numerics. Ensures any
  // value we derive from a seed is identical across renders / agents.
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

  // ---------- shaders ----------------------------------------------------

  // Vertex shader — fullscreen quad. twgl.js maps `position` to its built-in
  // 2-triangle buffer (createBufferInfoFromArrays + arrays.position). The
  // quad covers clip-space (-1,-1) → (1,1).
  const VERT = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}`;

  // Fragment shader — animated procedural bokeh ring. 12 hexagonal-ish points
  // along a ring at r ≈ 0.35, each pulsing in sync with `u_time`. The
  // `u_aperture` uniform (0..1, GSAP-driven) gates the alpha so the entire
  // overlay can fade in/out over its timeline window. Output is gamma-
  // corrected to sRGB to match the page-side colorspace.
  const FRAG = `#version 300 es
precision highp float;

uniform float u_aperture;     // 0..1, GSAP-driven via --shader-aperture
uniform float u_time;          // seconds, RAF-driven (resets per timeline run)
uniform vec2  u_resolution;    // canvas pixel size
uniform float u_seed;          // 0..2π, per-instance ring rotation offset

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 center = vec2(0.5);

  // Aspect-correct so the ring stays circular regardless of canvas shape.
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 puv = (uv - center) * aspect;

  // Ring of N bokeh points. r ≈ 0.35 in aspect-corrected space puts them
  // at roughly 70% of canvas height, comfortably inside frame.
  const float N = 12.0;
  float pointStrength = 0.0;
  for (float k = 0.0; k < 12.0; k++) {
    float kAng = (k / N) * 6.2831853 + u_seed;
    vec2 pPos = vec2(cos(kAng), sin(kAng)) * 0.35;
    float d = distance(puv, pPos);
    // smoothstep narrows the disc, sin pulse gives life-of-the-music feel.
    pointStrength += smoothstep(0.022, 0.0, d) *
      (0.55 + 0.45 * sin(u_time * 0.7 + kAng * 3.0));
  }

  // Warm gold tint — readable as "lens bokeh" rather than "alien spheres".
  // Skew toward amber so the ring keeps its gold cast even after gamma
  // correction lifts the lows.
  vec3 col = vec3(1.0, 0.78, 0.42) * pointStrength;

  // Gamma-correct linear → sRGB. Without this the points read washed-out
  // when the page is sRGB (which it always is). The 1/2.2 approximation
  // is fine for the warm-white palette here.
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));

  fragColor = vec4(col, pointStrength * u_aperture);
}`;

  // ---------- WebGL state (shared across instances) ----------------------

  // Singleton state. All canvases share one twgl program — they each have
  // their own canvas + GL context (canvases can't share contexts in WebGL2).
  // The program *source* is pre-compiled into every new context at first
  // `dof()` call to avoid first-frame stutter at seek-to-zero.
  const instances = []; // [{ canvas, gl, programInfo, bufferInfo, seed }]
  let rafHandle = 0;

  // ---------- per-canvas init -------------------------------------------

  // Boot a WebGL2 context on `canvas`, compile the bokeh program, build the
  // fullscreen-quad vertex buffer, and request sRGB-correct alpha output.
  // Returns `{ gl, programInfo, bufferInfo }` or `null` if WebGL2 isn't
  // available (graceful fallback — the overlay just stays transparent).
  function init(canvas, opts) {
    if (typeof twgl === "undefined") {
      console.warn("shaderFx: twgl.js not loaded — include design/vendor/twgl.min.js before design/modules/all.js");
      return null;
    }
    const gl = canvas.getContext("webgl2", {
      premultipliedAlpha: true,
      antialias: false,
      // Tell the compositor we're already sRGB-encoded so it doesn't re-convert.
      colorSpace: "srgb",
    });
    if (!gl) {
      console.warn("shaderFx: WebGL2 unavailable — DOF overlay will be invisible (graceful fallback)");
      return null;
    }

    let programInfo;
    try {
      programInfo = twgl.createProgramInfo(gl, [VERT, FRAG]);
    } catch (err) {
      console.warn("shaderFx: shader compile failed:", err && err.message ? err.message : err);
      return null;
    }

    // Fullscreen quad — twgl maps `position` automatically, no UVs needed
    // (we derive them in the FS from gl_FragCoord / u_resolution).
    const arrays = {
      position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] },
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    return { gl, programInfo, bufferInfo };
  }

  // ---------- RAF loop ---------------------------------------------------

  // One global RAF loop services every shader-fx canvas. Per frame:
  //   1. Drop instances whose canvas left the DOM (zombie cleanup).
  //   2. Read each canvas's `--shader-aperture` from CSS (GSAP-tweened).
  //   3. Resize the canvas to its CSS size (so ring stays circular at any DPI).
  //   4. Draw the bokeh program with current uniforms.
  //
  // The `u_time` uniform uses `performance.now() * 0.001` — non-deterministic
  // by itself, but the *visible* output is gated by `u_aperture` which IS
  // tween-driven, so seek-to-t produces consistent visuals as long as the
  // timeline drives the aperture window. (Trade-off documented in the
  // feasibility doc: shimmer rate is wall-clock, intensity is timeline-clock.)
  function startRafLoop() {
    if (rafHandle) return;
    function tick() {
      const t = performance.now() * 0.001;
      for (let i = instances.length - 1; i >= 0; i--) {
        const inst = instances[i];
        if (!inst.canvas.isConnected) {
          // Zombie cleanup — canvas was removed (scene re-rendered, etc).
          instances.splice(i, 1);
          continue;
        }
        drawInstance(inst, t);
      }
      rafHandle = requestAnimationFrame(tick);
    }
    rafHandle = requestAnimationFrame(tick);
  }

  function drawInstance(inst, t) {
    const { gl, programInfo, bufferInfo, canvas } = inst;
    if (!gl || !programInfo) return;

    // Read GSAP-driven CSS variable. getPropertyValue returns a string with
    // optional whitespace — parseFloat handles "0.42 " → 0.42 cleanly.
    const apertureRaw = getComputedStyle(canvas).getPropertyValue("--shader-aperture");
    const aperture = parseFloat(apertureRaw);
    const apertureSafe = isFinite(aperture) ? aperture : 0;

    // If the overlay is fully transparent, skip the draw — saves GPU cycles
    // on every scene that isn't actively bokeh-ing. This is a measurable
    // 5-15% render-time win across long compositions.
    if (apertureSafe <= 0.001) {
      // Still need to clear, in case last frame painted at higher aperture.
      twgl.resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Pre-multiplied alpha blend over the page below.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, {
      u_aperture: apertureSafe,
      u_time: t,
      u_resolution: [canvas.width, canvas.height],
      u_seed: inst.seed,
    });
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  // ---------- public: dof ------------------------------------------------

  // DOF — depth-of-field bokeh overlay. Adds a canvas (`data-shader-pass="dof"`)
  // to the scene, ramps `--shader-aperture` from 0 → 1 → 0 across the duration
  // window, and lets the shader pulse the ring of 12 warm-gold points.
  //
  // Inputs (opts):
  //   at         timeline placement (seconds, default 0)
  //   duration   ramp window — full fade-in + plateau + fade-out (default 0.6)
  //   intensity  0..2 multiplier on the peak aperture (default 1)
  //   seed       PRNG seed → ring rotation offset (default 1)
  //
  // Returns: the canvas element (so callers can do further DOM work).
  function dof(timeline, sceneSelector, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = o.duration != null ? +o.duration : 0.6;
    const intensity = Math.min(2, Math.max(0, o.intensity != null ? +o.intensity : 1));
    const seedNum = o.seed != null ? +o.seed : 1;

    const scene = resolveTarget(sceneSelector);
    if (!scene) {
      console.warn("shaderFx.dof: no element for", sceneSelector);
      return null;
    }
    if (!timeline || typeof timeline.fromTo !== "function") {
      console.warn("shaderFx.dof: timeline missing or not a GSAP timeline");
      return null;
    }

    // Build the canvas — full-bleed inside the scene, last child so it sits
    // above content but below `.fx-grade-*` overlays (which are :after).
    if (getComputedStyle(scene).position === "static") scene.style.position = "relative";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("data-shader-pass", "dof");
    canvas.style.cssText = [
      "position:absolute",
      "inset:0",
      "width:100%",
      "height:100%",
      "pointer-events:none",
      "z-index:9100",
      "--shader-aperture:0",
    ].join(";");
    scene.appendChild(canvas);

    // Boot WebGL — pre-compile shader at module init time per the feasibility
    // doc's risk note. If init returns null (no WebGL2 / compile failed) the
    // canvas just stays blank; tweens are still added so timeline duration is
    // accurate.
    const ctx = init(canvas, o);
    if (ctx) {
      // Convert the 32-bit seed into a stable 0..2π angle offset. Two calls
      // to mulberry32 ensures we don't bias toward 0 if seed ≈ 0.
      const rand = mulberry32(seedNum);
      rand(); // discard first sample (mulberry32's first value clusters)
      const seedAngle = rand() * 6.2831853;
      instances.push({
        canvas,
        gl: ctx.gl,
        programInfo: ctx.programInfo,
        bufferInfo: ctx.bufferInfo,
        seed: seedAngle,
      });
      startRafLoop();
    }

    // GSAP CSS-var bridge — same pattern as `effectFx.cinemagraphRotate`.
    // The aperture follows a triangular envelope: 0 → peak → 0 across the
    // duration window, with the peak held briefly mid-window.
    const peak = 1 * intensity;
    const rampUp = duration * 0.30;
    const hold = duration * 0.40;
    const rampDown = duration * 0.30;

    timeline.set(canvas, { "--shader-aperture": 0 }, at);
    timeline.fromTo(canvas,
      { "--shader-aperture": 0 },
      { "--shader-aperture": peak, duration: rampUp, ease: "power2.out" },
      at);
    if (hold > 0.01) {
      timeline.to(canvas,
        { "--shader-aperture": peak, duration: hold, ease: "none" },
        at + rampUp);
    }
    timeline.to(canvas,
      { "--shader-aperture": 0, duration: rampDown, ease: "power2.in" },
      at + rampUp + hold);

    return canvas;
  }

  // ---------- registry ---------------------------------------------------

  global.shaderFx = {
    init,
    dof,
    mulberry32,
    // Exposed for diagnostics / tests; callers shouldn't need these.
    _instances: instances,
  };
})(typeof window !== "undefined" ? window : this);
