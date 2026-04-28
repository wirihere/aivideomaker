> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Effect Combos — Design Plan

> Combine existing primitives into 10 named recipes that produce 1+1=3 cinematic
> moments. Each combo is a choreographed *sequence* — not parallel primitives —
> with a clear "moment" it owns.
>
> Status: planned 2026-04-25 by the Effect Combinator Supervisor.
> Implementation lives at `design/modules/combo-fx.{js,css}` once shipped.

---

## Phase 1 — Audit of existing primitives

### `design/modules/text-fx.js` — kinetic text recipes
| Recipe | Category | What it does | Inputs | Combines well with |
|---|---|---|---|---|
| `textFx.explode` | text/entry-exit | Per-char scatter assembly (mode `in`) or scatter outward (mode `out`); seeded angles. | `at, duration, seed, distance, mode, ease, stagger` | glitterFx.burst, effectFx.glitchBurst, effectFx.inkBleed |
| `textFx.stamp` | text/entry | Slam impact: scale-down from oversize + parent screen-shake. | `at, duration, fromScale, ease, shake` | glitterFx.burst (impact dust), shadow drop, glitch single-frame |
| `textFx.cascade` | text/entry | Words fall top-to-bottom with stagger. | `at, duration, stagger, distance, ease` | secondary-shadow trail, soft pad SFX, ambient glitter |
| `textFx.stagger` | text/entry | Per-letter pop with rotation; the bread-and-butter kinetic. | `at, duration, stagger, rotation, fromY, ease` | cinemagraph spin, fall sparkle, type-shimmer continuation |
| `textFx.typeOn` | text/entry | Character-by-character typewriter reveal. | `at, duration` | scanlines, audio-reactive glow, soft tick SFX cadence |
| `textFx.counter` | text/data | Number flips up to target with format preservation. | `at, duration, ease, from` | impact stamp on land, glitter burst at end, glitch pulse on each tick |

### `design/modules/effect-fx.js` — cinematic primitives
| Recipe | Category | What it does | Inputs | Combines well with |
|---|---|---|---|---|
| `effectFx.multiplaneDolly` | camera | Translate `.stage` along Z to push toward / pull back; parallax layers. | `at, duration, from, to, ease` | textFx anything-on-base-plane, glitter on bg plane, grade overlays |
| `effectFx.inkBleed` | reveal | Animate `feDisplacementMap` scale from high → 0 (warped → crisp). | `at, duration, filterId, from, to, ease, clearAfter` | typeOn, stagger, soft pad SFX |
| `effectFx.glitchBurst` | impact | Sub-second chromatic shift + jitter window. | `at, duration, filterId, shake` | stamp, counter-tick, multiplane sudden zoom |
| `effectFx.cinemagraphRotate` | ambient | Slow rotation of conic-gradient blob via CSS variable bridge. | `at, duration, from, turns, ease` | grade-warm, fall sparkle, typeShimmer drift |

### `design/modules/glitter-fx.js` — particle systems
| Recipe | Category | What it does | Inputs | Combines well with |
|---|---|---|---|---|
| `glitterFx.burst` | impact | Radial particle explosion from origin, spin/fade. | `at, count, duration, seed, distance, tints, sizeRange, originX/Y, gravity, ease` | stamp, counter-end, glitchBurst, multiplane near-pop |
| `glitterFx.fall` | ambient | Continuous gentle downward sparkle with wobble. | `at, count, duration, seed, tints, sizeRange, wobble, ease` | cinemagraphRotate, cascade, grade-cool |
| `glitterFx.ambient` | ambient | In-place scattered pulse via CSS keyframe (no GSAP cost). | `at, count, duration, seed, tints, sizeRange` | typeShimmer, multiplane plane-bg shimmer |

### `design/effects-batch-08.css` — CSS primitives (declarative, no JS API)
| Class / Selector | Category | What it provides |
|---|---|---|
| `.fx-multiplane`, `.plane-bg/far/mid/base/near/fg` | camera | Perspective stage + 6 depth presets with auto-scale; DOF variants via `data-focus`. |
| `.fx-displace-liquid/ink/ripple/glass` | filter | SVG displacement filters (turbulence + map). Inert until applied. |
| `.fx-chromatic`, `.fx-scanlines`, `.fx-vhs-jitter` | impact | RGB shift via `#fx-rgb-shift`; CRT scanline overlay; 0.18s steps-jitter keyframe. |
| `.fx-grade-teal-orange/warm/cool/noir/pop/soft` | look | LUT-style overlay `mix-blend-mode: overlay` + filter passes. Also via `data-scene-grade="…"`. |
| `.fx-cinemagraph-bg` | ambient | Conic-gradient blob behind frosted glass overlay (`::after`). |
| `.fx-shadow-soft/hard`, `.fx-long-shadow` | weight | Drop-shadow stacks, 9-step long-shadow extrusion. |
| `.fx-amp-scale/glow/wobble` | audio-reactive | Bind to `--amp-bass/mid/high` CSS vars (driven by `ampBind`). |

### `design/effects-batch-07.css` — Adapted batch-07 primitives
| Class | Category | What it provides |
|---|---|---|
| `.fx-holo-sticker` | brand | Holographic gradient badge with overlay scanlines (animate background-position). |
| `.fx-type-shimmer` | text/ambient | Rainbow gradient clipped to text; animate `backgroundPositionX`. |
| `.fx-concentric-pulse__ring` | impact | Emphasis rings expanding from a centre node. |
| `.fx-radio-wave__ring`, `.fx-radio-wave__beacon` | accent | Signal rings emanating from a pulsing beacon. |
| `.fx-end-card__mark/__rule/__t/__sub` | layout | Reusable end-card lockup (mark + rule + tagline + small-caps sub). |

### Other CSS in scope
- `design/cards.css` — base `.card` + scene scaffolds (`.scene__bg`, `.scene__stage`, `.scene__overlay`, `.scene__sfx`); `.card-mark` floating chip.
- `design/cards-from-bundle/phonehand.css` — phone-in-hand layout block (not an effect).
- `design/templates/{documentary,kinetic-pop,quiet-premium,warm-community}.css` — palette/typography templates (palette-only, no FX classes worth combining).

### Helpers
- `scripts/lib/amp-bind.js` — bake amplitude envelope → GSAP keyframes on `--amp-*` CSS vars. Pairs with `.fx-amp-*`.

**Total primitives to combine:** ~20 distinct levers across 4 modules + 2 CSS batches.

---

## Phase 2 — Combo plan (10 recipes)

Each combo:
1. Owns a **moment** (entrance, impact, transition, reveal, ambient, exit).
2. Stacks 3-5 primitives in **choreographed sequence** (not parallel soup).
3. Has **`window.comboFx.<name>(tl, target, opts)`** API.
4. Is **deterministic** (mulberry32 PRNG with `seed`; uses `tl.fromTo` not `tl.from`).
5. Defaults to a **800-1600ms** window so it actually reads as a moment.

### Visual-impact × ease-of-implementation ranking

| # | Combo | Moment | Stacks (in order) | Visual Impact | Ease | Rationale |
|---|---|---|---|---:|---:|---|
| 1 | `superImpact` | Hero stat / number land | inkBleed warp-in → counter tick → stamp impact frame → glitchBurst single → glitterFx.burst radial dust → grade-pop filter pulse | 5/5 | 4/5 | The "stat-card moment" — ink resolves into the number, shake locks it, sparks reward you. |
| 2 | `cinematicReveal` | Headline / hero entrance | multiplaneDolly push-in → inkBleed scale-down → stagger per-letter pop → soft-shadow drop trailing 80ms | 5/5 | 4/5 | Camera moves while text resolves — depth + clarity. |
| 3 | `hyperGlitch` | Aggressive impact / disruption | scanlines on → vhs-jitter pulse 1 → glitchBurst 1 → quick stamp re-anchor → glitchBurst 2 → scanlines off | 5/5 | 4/5 | Two-burst rhythm reads "broken signal" without lasting too long. |
| 4 | `dreamSequence` | Soft, ambient hero | cinemagraphRotate slow → typeShimmer wipe-in → ambient glitter scatter → grade-cool overlay → fall sparkle drift | 4/5 | 3/5 | Apple-hero floaty shimmer; 4-6s ambient state, not a punch. |
| 5 | `kineticBurst` | Word/phrase emphasis pop | textFx.explode (in) → glitterFx.burst (small) → text-shimmer wipe → micro-glitch on settle | 4/5 | 5/5 | Letter-particles meet text-particles — single beat, double texture. |
| 6 | `slamCut` | Scene transition (out → in) | grade-noir pulse out → glitchBurst → multiplane snap-back → cascade words drop → grade-pop in | 5/5 | 3/5 | Cuts FROM a scene mid-shot to the next — the transition you'd put on the chapter break. |
| 7 | `signalPulse` | Beacon / call-to-action moment | radio-wave 5 rings stagger → typeOn caption → ambient glitter pin-shimmer → counter tick on a number badge | 4/5 | 4/5 | Read-aloud "X is happening" beat — accents the data. |
| 8 | `paperTear` | Reveal beneath / "and now…" | inkBleed warp-out (mode reversed) → stagger up-and-out → multiplane dolly back → next-card stamp + grade-warm | 4/5 | 3/5 | A literal layer-tear; old text dissolves while camera resets. |
| 9 | `confettiFinale` | End-card / outro | multiplane settle-in → stamp logo lockup → end-card rule scaleX → glitterFx.burst + fall combined → cinemagraphRotate idle | 5/5 | 4/5 | The "fade up → settle → celebrate" ending; 2-3 seconds with crescendo. |
| 10 | `holoFlash` | Brand badge / sticker land | holo-sticker gradient drift on → multiplane near-pop → stamp + glitchBurst → glitter burst → long-shadow drop | 4/5 | 4/5 | Brand chip lands hot, holo continues drifting after — crowd-pleaser. |

> 11 + 12 are stretch combos in case implementation goes faster than expected:
>
> - `crtBoot` — scanlines + jitter + glitch ramp into focus + typeOn + grade-warm; a TV-set boot-up.
> - `liquidWipe` — fx-displace-liquid filter on the outgoing scene + stamp on incoming + cinemagraph background flip.

### Distinct visual identity check

To meet the "no two combos that produce visually similar output" rule:

| Combo | Dominant visual signature |
|---|---|
| superImpact | Number lands centred with sparks radiating — radial energy at frozen text |
| cinematicReveal | Camera pushes IN through depth; text resolves crisp — perspective motion |
| hyperGlitch | Image breaks into RGB channels and shakes — chromatic chaos |
| dreamSequence | Slow conic blob behind shimmering pastel text — soft drifting |
| kineticBurst | Letters scatter-assemble; small particle sparks — granular text |
| slamCut | Frame goes black/grade-noir then snaps to fully-in next scene — hard cut |
| signalPulse | Concentric rings emanate from a beacon point — ripple outward |
| paperTear | Old layer dissolves up while camera retreats — exit-stage-up motion |
| confettiFinale | Logo locks centre, particles celebrate — crescendo |
| holoFlash | Rainbow holo gradient drifts under lockup, sparks once — iridescent badge |

These are 10 visually distinct moments — no two share a primary signature.

---

## Phase 3-7 — Build plan summary

1. **Implement** `design/modules/combo-fx.{js,css}` (Phase 3).
   - Single IIFE registering `window.comboFx.<name>` for each.
   - Each combo composes existing modules — no duplicated logic.
   - All combos accept `{ at, duration, intensity, seed, ... }` plus combo-specific opts.
2. **Demo** `compositions/combo-fx-demo.html` (1920×1080, 30s) — Phase 4.
   - 10 scenes × 2.7-3.0s each, label-chip identifies the combo.
3. **Catalog** Extend `scripts/build-catalog.mjs` so each combo gets a peak-frame thumbnail and a "Combos" section in `docs/effects-catalog.html` — Phase 5.
4. **Bundle** Add `combo-fx.{js,css}` to `scripts/build-bundle.mjs` so they roll into `design/modules/all.{js,css}` — Phase 6.
5. **Document** Add §3 entry to `LEARNINGS.md` listing every combo + API + primitives — Phase 7.
6. **Verify** `npm run check` (lint+smoke) and `npm run smoke:diff` clean — Phase 8.

### API contract

```js
// shape — every combo is callable like this
window.comboFx.<name>(timeline, target, {
  at: 0,            // timeline position (sec)
  duration: 1.2,    // total combo window (sec)
  intensity: 1,     // 0..2 multiplier on amplitudes/distances/counts
  seed: 1,          // deterministic PRNG seed
  // ...combo-specific knobs
});
```

> Returning `{ duration }` lets callers chain: `const r = comboFx.superImpact(tl, "#stat", {at:1.0}); textFx.cascade(tl, "#sub", {at:1.0 + r.duration});`

### Implementation constraints (from project `LEARNINGS.md`)

- `tl.fromTo()` not `tl.from()` — paused/seek timelines pollute "natural" state.
- mulberry32 PRNG; never `Math.random()` or `Date.now()`.
- Each combo must clean up filters when its window ends (mirror `inkBleed`'s `clearAfter`).
- Glitch/jitter windows ≤ 0.25s (LEARNINGS §3 — "continuous glitch reads amateur").
- Particle counts × intensity must stay deterministic (`Math.floor(count * intensity)`).
