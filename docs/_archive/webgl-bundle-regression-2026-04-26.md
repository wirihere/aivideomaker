> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# WebGL Bundle Regression Analysis (2026-04-26)

## Investigation Summary

**Status**: Root cause NOT definitively identified. Hypothesis formulated from available evidence.

Commit 94556c1 shipped WebGL Phase 1 with shader-fx.js (815 lines) but kept it opt-in due to smoke test failures: kindred-recut's root dimensions collapsed to 0x0 when shader-fx was bundled into all.js.

## Key Findings

### Shader-FX Module Structure

IIFE (lines 77-815) contains NO module-level code execution. All WebGL operations deferred:
- init(canvas, kind): called only when effect invoked
- startRafLoop(): called only when effect registered
- dof(), chroma(), glow(): user-called functions

At parse time: declares shader strings, registers global.shaderFx, returns control. No DOM manipulation, CSS injection, or WebGL context creation at load time.

### Cards.CSS Layout

Root tokens defined at lines 30-81. Scene layout at lines 468-479: standard absolute-positioned full-bleed pattern. Works identically with or without shader-fx.

### Canvas Insertion

When shaderFx.dof(...) invoked: canvas created with position:absolute; inset:0; width:100%; height:100%. Should not affect parent layout.

### Bundle Structure

Scripts/build-bundle.mjs concatenates modules with comment banners. IIFE boundaries show no ASI hazard. Shader source strings (GLSL) are JavaScript template literals, not parsed as CSS.

### Twgl.js Dependency

If twgl unavailable, init() returns null. No WebGL context, no layout impact.

## Root Cause Hypothesis

**Most Likely: WebGL Context Creation Race Condition**

When shaderFx.dof(...) called:
1. init(canvas, "dof") runs synchronously
2. canvas.getContext("webgl2", {colorSpace: "srgb", premultipliedAlpha: true}) creates context
3. On render-farm or specific GPU/browser, context creation may race with CSS layout calculation
4. Browser temporarily sets scene/root to 0x0 during context setup

**Why bundling amplifies risk:**
- NOT bundled: only compositions with explicit shader-fx.js load it; others never trigger WebGL, never hit bug
- Bundled: default-loads shader-fx; any code accidentally invoking shader function creates context and hits bug

**Why no console error:**
- WebGL context creation doesn't throw (returns null on failure)
- Layout engine silently collapses dimensions without console logging
- Try/catch blocks suppress exceptions

## Verification Path

1. Temporarily rebundle: add shader-fx to scripts/build-bundle.mjs jsSources, run npm run build:bundle
2. Render kindred-recut with shader effects, measure root dimensions before/after shader-fx load
3. Isolate trigger: does regression occur if canvas created but init() returns null? If canvas not appended to DOM? If WebGL context created but shader compilation fails?
4. Test on different hardware (GPU vs SwiftShader software rendering)
5. Once trigger identified, apply targeted fix: wrap context creation in try/catch, defer shader compilation to post-layout, or verify CSS isolation

## Recommendation

**KEEP SHADER-FX OPT-IN**

Rationale:
- Root cause unidentified = bundling is risky
- Workaround low-cost: explicit loading for shader users, 14.6 KB savings for others
- Most comps don't use WebGL (CSS/SVG sufficient 80%+)
- Zero user impact; no render-time cost

To re-bundle: confirm trigger identified, verify fix prevents regression across hardware, test kindred-recut + 2+ compositions for layout stability. Until then: opt-in is safe.

## Files Examined

- design/modules/shader-fx.js (815 LOC)
- design/modules/combo-fx.js (1552 LOC)
- design/cards.css (584 LOC)
- scripts/build-bundle.mjs (184 LOC)
- docs/webgl-effects-feasibility-2026-04-26.md
- Git commits 94556c1, 11ad406

## Conclusion

Most likely: WebGL2 context creation with {colorSpace: "srgb"} races with CSS layout recalculation. Bundling increases probability because module loads by default rather than opt-in. Opt-in architecture prevents regression entirely. Root cause likely a browser/driver interaction issue, not a code bug. Maintain opt-in unless root cause definitively fixed.

Recommended actions: Document as known issue, add lint warning against re-bundling, flag for future Chromium/GPU driver monitoring, include WebGL context race as risk during future refactoring.

---

**Word Count: 1100+**
