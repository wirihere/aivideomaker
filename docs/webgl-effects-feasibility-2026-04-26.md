# WebGL/WebGPU Effects — Feasibility (2026-04-26)

Replace CSS/SVG-filter chains in `effects-batch-08.css` + `effect-fx.js` + `combo-fx.js` with shader-based effects on a per-scene `<canvas>` overlay.

## Verdict: **PROTOTYPE-NARROW**

Wholesale migration is a no. The CSS/SVG stack does 80%+ of the work, and the lint/determinism/seek model is built around DOM elements you can tween. But two effects — **DOF bokeh** and **chromatic aberration** — read visibly fake today, and a single canvas pass per scene gets the cinematic uplift without rewriting `combo-fx`. Build a `shader-fx` module with 2 effects behind the same GSAP-uniform-bridge pattern. Defer the rest.

## What CSS/SVG filters can't do

- **Real DOF**: hexagonal/circular bokeh kernel, intensity from depth, blooming highlights. CSS `blur(8px)` is a shapeless gaussian box-blur.
- **True chromatic aberration**: radial displacement scaling from optical center; per-channel barrel curvature. SVG `feOffset` is a uniform shift.
- **Continuous z-blur** keyed off real depth, not the 6 hard tiers in `.fx-multiplane`.
- **SDF glow**: ray-marched halos that respect element shape. Today's "glow" is `conic-gradient + blur(120px)`.
- **Volumetric / god-ray shadows**, screen-space AO on stacked cards.
- **Animated noise as a uniform** instead of fixed-seed `feTurbulence` (which doesn't seek).

The two that move cinematic grade are **DOF bokeh** and **radial chromatic aberration**. The rest reads as designed-on-purpose, not faked.

## Browser / runtime support

- **WebGPU**: stable + default-on in Chrome since 121 on Windows x64 via D3D12. Off by default on Windows ARM (irrelevant for our render farm).
- **WebGL2**: universally available, no flags. Lower ceiling but bullet-proof portability.
- The Playwright + Chromium pipeline runs whatever Chrome supports. **Build on WebGL2 first.** WebGPU is ready, but WGSL plus tooling churn doesn't pay off for 2 post-process passes.

## Library recommendation

**`twgl.js` (~30KB min+gz) + raw fragment shaders.**

- `regl` is more elegant but ~50KB and adds a paradigm.
- `three.js` is overkill — we're not doing 3D.
- `glsl-canvas` is undermaintained.
- Raw WebGL is ~150 lines of boilerplate per effect with easy GL-object leaks.

`twgl` collapses boilerplate to ~25 lines per effect via `createProgramInfo`/`setUniforms`/`drawBufferInfo`. Vendor next to `gsap.min.js` in `design/vendor/` — keeps the renderer offline-capable.

## Integration model

Each opting-in scene adds a single full-bleed `<canvas data-shader-pass="dof|chroma">` as the **last child** (above content, below `.fx-grade-*`).

The heavy version snapshots the scene's DOM via `html2canvas` into a `sampler2D u_sceneTex` and runs the post-process per frame. **The lighter, recommended version**: don't snapshot the DOM. Render the canvas as an *additive overlay* — procedural bokeh layer (animated bright points along a ring) and a procedural radial-aberration ring tinted RGB. DOM stays as today; the shader paints depth cues on top. 90% of the perceived uplift, 10% of the engineering, zero per-frame `html2canvas` cost.

GSAP integration mirrors the existing CSS-var bridge (`--cg-rotation`, `--rm-radius`):

```js
timeline.fromTo(canvas,
  { "--shader-aperture": 0 },
  { "--shader-aperture": 1, duration: 0.6 }, at);
```

The shader reads `getComputedStyle(canvas).getPropertyValue(...)` once per RAF and writes it as a uniform. Same seekable, deterministic pattern as `effect-fx.js`. Linter changes: zero — it's a `<canvas>` with `data-*` attrs.

## Lift estimate

- **Vendor twgl + base render-loop module** (`design/modules/shader-fx.js`): 4-6h.
- **Per-effect**: write shader, GSAP bridge, parameterize, smoke-test.
  - DOF bokeh (procedural ring): 4h
  - Radial chromatic aberration: 3h
- **Combo-fx integration**: `focusPull` and `cinematicReveal` gain optional `useShader: true` (additive, no breaking changes): 2h.
- **Lint detector** for shader-canvas timing: 1h.
- **Smoke + render parity** across 25 templates (none change unless opted-in): 2h.

**Total narrow prototype: 16-20h.** Wholesale `combo-fx` migration would be 80-120h and break every template for marginal gain on most effects.

## Recommendation order

1. **Bokeh DOF** for `comboFx.focusPull` — biggest perceived uplift; the existing CSS blur is the most obviously fake effect in the stack.
2. **Radial chromatic aberration** for `hyperGlitch` and `slamCut` impact frames — real lens curvature, not uniform 3px offset.

**Stay on CSS/SVG**: multiplane, inkBleed (`feDisplacementMap` is genuinely the right tool), grade overlays, scanlines, cinemagraph, long-shadow, holo drift — these read fine, no shader peer worth the cost.

**Cheap pre-shader wins**:
- `.fx-glass-card` recipe extending the existing `backdrop-filter: blur()` — reads more "real" than DOM-overlay tricks.
- A second `feDisplacementMap` with a radial-gradient input gets ~70% of barrel distortion for zero new tech.

## Risks

- **GPU portability on the render farm**: if a node lacks a real GPU, Chromium falls back to SwiftShader (software). Shaders still render, ~3-5x slower. Acceptable for batch, painful for preview. Add a Playwright `--gpu-required` check and log `GL_RENDERER` per render.
- **Determinism**: shaders are pure (uniform, time) — fine *as long as* we don't seed from `Math.random` in GLSL. Pre-compute `mulberry32(seed)` JS-side, pass as uniforms. Mirrors `combo-fx.js` line 57.
- **Color management**: WebGL writes linear-RGB by default; the page is sRGB. Set `gl.SRGB8_ALPHA8` on the canvas texture or gamma-correct in-shader, or output looks washed-out.
- **Shader compile cost**: ~30ms per program at cold start. Pre-compile in the `window.__timelines` registration callback to avoid first-frame stutter at seek-to-zero.

## Decision

Ship the 2-effect prototype (~20h). Hold the larger migration until those land and we've measured whether the uplift justifies a third effect. If the DOM-overlay-only version reads as well as the snapshot version (likely), we never need `html2canvas` and the cost stays low forever.

Sources:
- [WebGPU Hits Critical Mass: All Major Browsers Now Ship It](https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/)
- [Google enables WebGPU by default in Chrome 121](https://www.developer-tech.com/news/google-enables-webgpu-default-chrome-121/)
- [WebGPU on Windows ARM is opt-in (gpuweb/gpuweb#5272)](https://github.com/gpuweb/gpuweb/issues/5272)
- [TWGL.js — Tiny WebGL helper library](https://twgljs.org/)
- [regl — Functional WebGL](https://regl-project.github.io/regl/)
