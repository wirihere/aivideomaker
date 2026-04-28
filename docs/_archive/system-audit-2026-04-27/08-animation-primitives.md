> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# 08 — Animation Primitives Audit

Date: 2026-04-27. Library bundle: `design/modules/all.js` (2465 lines, concatenation of `amp-bind` + `text-fx` + `effect-fx` + `glitter-fx` + `combo-fx`). Opt-in WebGL: `design/modules/shader-fx.js` (815 lines).

## 1. Primitive inventory

### `window.textFx` (6 + 1 helper)
| Primitive | Signature | Purpose |
|---|---|---|
| `explode` | `(tl, target, { at, duration=0.8, seed=1, distance=400, mode:"in"\|"out", ease, stagger=0.02 })` | Per-char assemble-from-scatter or scatter-out. |
| `stamp` | `(tl, target, { at, duration=0.45, fromScale=1.8, ease="back.out(2.4)", shake=true })` | Slam scale-in with parent shake. |
| `cascade` | `(tl, target, { at, duration=0.6, stagger=0.08, distance=80, ease="power3.out" })` | Word-by-word fall in. |
| `stagger` | `(tl, target, { at, duration=0.6, stagger=0.04, rotation=-15, fromY=0, ease="back.out(1.7)" })` | Per-char pop with rotation. |
| `typeOn` | `(tl, target, { at, duration=1.2 })` | Per-char reveal, no easing. Wraps every char in a `<span>`. |
| `counter` | `(tl, target, { at, duration=1.4, ease="power2.out", from=0 })` | Number flip; preserves prefix/suffix/commas. |
| `splitText` | `(el, mode:"chars"\|"words")` | Helper, idempotent. |

### `window.effectFx` (6)
| Primitive | Signature | Purpose |
|---|---|---|
| `multiplaneDolly` | `(tl, stage, { at, duration=4.0, from=-120, to=0, ease="power2.out" })` | Z-translate `.stage` (parallax via `.plane-*`). |
| `inkBleed` | `(tl, target, { at, duration=0.7, filterId="fx-ink", from=80, to=0, ease, clearAfter=true })` | Animates `feDisplacementMap` scale on a `<filter>`. |
| `glitchBurst` | `(tl, target, { at, duration=0.18, filterId="fx-rgb-shift", shake=true })` | Sub-second RGB shift + jitter. |
| `cinemagraphRotate` | `(tl, target, { at, duration=24, from=0, turns=1, ease="none" })` | Slow rotation of conic-gradient `::before`. |
| `rackFocus` | `(tl, target, { at, duration=0.6, from=8, to=0, ease, clearAfter=true })` | Tweens `filter: blur(...)`. |
| `radialMask` | `(tl, target, { at, duration=0.5, from=0, to=50, centerX=50, centerY=50, feather=8, ease, clearAfter=true })` | Animated soft-edge spotlight via mask-image. |

### `window.glitterFx` (3)
| Primitive | Signature | Purpose |
|---|---|---|
| `burst` | `(tl, host, { at, count=80, duration=1.4, seed=1, distance=600, gravity=0, originX=0.5, originY=0.5, tints, sizeRange=[4,14] })` | Radial particle explosion. |
| `fall` | `(tl, host, { at, count=60, duration=5.0, seed=2, wobble=60, tints, sizeRange=[3,9] })` | Continuous downward sparkle. |
| `ambient` | `(tl, host, { at, count=40, duration=5.0, seed=3, tints, sizeRange=[3,8] })` | In-place pulse via CSS keyframes (only 2 GSAP tweens total — efficient). |

### `window.shaderFx` (3 + init) · `window.ampBind` (1) · `window.comboFx` (16)
- `shaderFx`: `init`, `dof`, `chroma`, `glow` — WebGL canvas overlay, opt-in.
- `ampBind(tl, ampJSON, target, { channels, offset, stride, scale, smooth, gate })` — bakes amplitude envelope into per-frame keyframes on CSS custom properties.
- `comboFx`: `superImpact`, `cinematicReveal`, `hyperGlitch`, `dreamSequence`, `kineticBurst`, `slamCut`, `signalPulse`, `paperTear`, `confettiFinale`, `holoFlash`, `glitchStamp`, `pricePop`, `testimonialReveal`, `focusPull`, `statGroup`, `spotlight`.

## 2. Usage frequency (real adoption across `compositions/**/*.html`)

```
 69 textFx.cascade            <-- workhorse
 66 textFx.stagger            <-- workhorse
 52 effectFx.glitchBurst      <-- workhorse
 28 textFx.stamp
 27 textFx.counter
 21 glitterFx.ambient
 20 effectFx.inkBleed
 19 glitterFx.burst
 16 textFx.typeOn
 15 ampBind
 12 shaderFx.dof
 11 shaderFx.glow              11 comboFx.cinematicReveal
  9 effectFx.multiplaneDolly
  8 shaderFx.chroma             8 effectFx.cinemagraphRotate
  7 comboFx.kineticBurst
  5 comboFx.superImpact         5 comboFx.confettiFinale
  3 comboFx.signalPulse / paperTear / hyperGlitch / glitchStamp / dreamSequence
  2 effectFx.radialMask         2 comboFx.testimonialReveal
  1 textFx.explode / comboFx.statGroup / spotlight / slamCut / pricePop / holoFlash / focusPull
```

**Top-3 are unambiguous:** `textFx.cascade`, `textFx.stagger`, `effectFx.glitchBurst` carry most of the library. **Sacred-oracle register uses essentially zero combos** — only `textFx.typeOn` is called (one site per template). All other motion in those 4 templates is hand-rolled `tl.fromTo()` (11–30 inline tweens per file), which is the strongest signal of a missing primitive shape.

**Underused:** `textFx.explode` (1), `effectFx.radialMask` (2), and seven of the sixteen combos at 1 use each (all of those single-use sites are the demo file — i.e. *zero* real adoption outside `combo-fx-demo.html`). That confirms the 2026-04-26 LEARNINGS §8 verdict: batch-2 combos are still demo-only.

## 3. Parked won't-ship combos — verdict still holds

The 8 parked combos (`marqueeScroll`, `fadeMontage`, `countdown`, `urgencyFlash`, `brandLockup`, `statBurst`, `pulseGroup`, `textTwist`) **were not exercised by the new sacred-oracle templates either**. Sacred-oracle is contemplative/ceremonial — it doesn't need urgency-flash or marquee. None of the inline GSAP patterns in sacred-oracle map onto the parked-combo shapes; they map onto NEW shapes (see §5). **Recommendation: keep parked.**

## 4. Adoption regression — the real story

`templates/faq-quick-30s.html` (kinetic-pop) uses 5 combos. `templates/sacred-oracle/*.html` (4 files, same week) use 0 combos and 11–30 inline tweens each. The combo library is **register-coupled to kinetic-pop**: combos default to `back.out(1.7)` / `back.out(2.4)` / `expo.out` (snappy), while sacred-oracle uses `power4.out` / `power3.out` / `power2.inOut` (ceremonial). Register gap, not authoring gap.

## 5. Five missing helpers worth building

Ranked by how many inline-tween sites would collapse onto each.

### 1. `textFx.verseReveal(tl, quoteEl, { at, citation, duration })` — HIGH
The sacred-oracle quote pattern: opening mark fades in → quote types on → hairline draws → name + role fade in. Currently 6 inline tweens × 4 sacred templates = ~24 sites.

### 2. `effectFx.hairlineDraw(tl, target, { at, duration=0.9, ease="power2.inOut", retract:false })` — HIGH
Gold/brand hairline scaleX from 0→1 (or retracts to 0). Used as section marker in sacred-oracle and as rule lines in `confettiFinale`. Inline `tl.to(rule, { scaleX: 1, ... })` appears 9+ times across templates plus inside `combo-fx.js` itself.

### 3. `comboFx.verseHold(tl, scene, { at, duration, mark, quote, hairline, name, role })` — HIGH
Sacred-register sibling to `testimonialReveal` (quote + attribution as a paired beat) but with **ceremonial easing defaults** — `power4.out`/`power3.out` instead of `back.out`. Owns the witness/hook/path quote moments. Replaces the entire 11–30-tween `(function(){...})()` block in 3 of 4 sacred templates.

### 4. `effectFx.kenBurns(tl, photo, { at, duration, fromScale=1.08, toScale=1.0, holdScale=1.06, holdDuration })` — MEDIUM
Subtle 2-stage scale-push on hero photos for persistent motion. Pattern appears in every sacred-oracle template (`tl.fromTo(photo, scale: 1.08 → 1.0)` + `tl.to(photo, scale: 1.06)`) and in several vertical templates. ~10+ sites.

### 5. `textFx.wordBreathe(tl, target, { at, duration=2.5, scale=1.04, opacity:[0.8,1] })` — MEDIUM
Slow scale-in + breathe loop for italic emphasis in contemplative scenes. Currently a 2–3 inline-tween chain. The contemplative-register equivalent of `kineticBurst`.

(Also viable but lower-priority: `effectFx.ambientSwap` register-aware crossfade — defer until 2+ register pairs need it.)

## 6. Boilerplate-elimination opportunities

### `registerTimeline(id, options)` — STRONG WIN
Every composition opens with a 3-line ritual that is 100% identical except the id:

```js
const tl = gsap.timeline({ paused: true });
window.__timelines = window.__timelines || {};
window.__timelines["my-id"] = tl;
```

Across 30+ files this is ~90 lines of pure ceremony. Proposed:

```js
const tl = registerTimeline("my-id", { defaults: { ease: "power2.out" } });
```

Internally:
```js
function registerTimeline(id, opts = {}) {
  const tl = gsap.timeline({ paused: true, ...opts });
  (window.__timelines = window.__timelines || {})[id] = tl;
  return tl;
}
```

Cost: ~6 lines added to `all.js`. Removes ~3 lines × 30 files. Also a natural place to **wire register-bound default eases** (see §7) — `registerTimeline("foo", { register: "sacred-oracle" })` could map to `defaults: { ease: "power3.out" }` automatically.

### Per-register ease defaults
Sacred-oracle templates explicitly override the timeline's `defaults: { ease: "power4.out" }` / `"power3.out"` / `"power2.out"` per-template. Three of four pass `defaults`; one doesn't. A `REGISTER_DEFAULTS` map keyed off `data-register=...` (already on these scenes) means future templates inherit the register's ease without each author re-deciding. Couples cleanly into `registerTimeline`.

## 7. Performance — `textFx.typeOn` flag

`splitText("chars")` wraps **every visible character in a `<span>`** and emits one `tl.set()` per char (an opacity flip at a discrete time). For a 50-char hook that's 50 spans + 51 `set()` calls. For a 220-char `sacred-witness-30s` quote that's 220 spans + 221 `set()` calls.

GSAP handles thousands of set() calls fine — that's not the cliff. The real cost is **layout/paint of N inline-block spans during frame capture**. The frame-by-frame Playwright renderer pays this on every frame, not just the reveal window.

There IS a faster approach: **CSS background-clip with animated `--reveal: 0% → 100%`** — one element, one tween, zero DOM mutation. Trade-off: the typewriter cadence becomes linear instead of per-char-discrete (which actually looks fine for `typeOn` — it has no easing anyway). Worth a `textFx.typeOnFast` variant or a `mode: "clip"` flag on `typeOn`.

**Flag, don't fix yet.** Wave-G renderer (parallel BrowserContexts) already mitigates the per-frame cost. Re-test if a long-quote sacred-oracle template ever hits a frame budget ceiling.

## 8. Lint detectors — verdict

All three (`narration-mid-tween`, `track-index-collision`, `scene-overlap-visual`) defined in `scripts/fix.mjs:1047–1170` are confirmed-real bug detectors with explicit opt-out comments documented. `track-index-collision` is the only error-severity one and protects against a class of bug that silently breaks visibility control. The other two are warnings with annotation-based escape hatches. **Not over-strict — keep all three.**

## 9. Recommended actions (in priority order)

1. Add `registerTimeline(id, { register, defaults })` to `all.js`. Document in `/hyperframes` skill.
2. Build `effectFx.hairlineDraw` + `effectFx.kenBurns` (single-line wins, high reuse).
3. Build `comboFx.verseHold` to give sacred-oracle a combo to adopt — closes the register gap that's the real adoption story.
4. Re-author sacred-oracle templates against the new combo — collapses 60+ inline tweens down to ~12.
5. Defer `textFx.typeOnFast` until measured frame-budget pressure appears.
