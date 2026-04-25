# Composition Component Library

Reusable sub-compositions for HyperFrames projects. Each file is **self-contained** — you instantiate it by adding a placeholder `<div>` to your root `index.html` with `data-composition-src` pointing at the file and `data-variable-values` as JSON for its inputs.

**Cold-read entry point.** If you're a fresh agent session reading this repo for the first time, this README is the catalog — you don't need to open every file to see what's available.

---

## How to use

```html
<!-- In your root composition index.html -->
<div id="ov-1" class="clip"
     data-composition-id="declined-stamp"
     data-composition-src="compositions/overlays/declined-stamp.html"
     data-start="1.6" data-duration="3.4" data-track-index="1"
     data-variable-values='{"word":"DECLINED","color":"#9a3a3a"}'></div>
```

Rules:
- Every instance needs `class="clip"`, `data-start`, `data-duration`, `data-track-index`.
- Same `data-track-index` clips cannot overlap. Use different indices for overlapping visuals.
- `data-variable-values` is JSON — escape double quotes or use single-quoted attribute.
- The `data-composition-id` on the placeholder matches the id inside the template.
- You can reuse a component multiple times in one root — each instance runs in its own scope.

---

## Backgrounds (`compositions/backgrounds/`)

### `ken-burns.html` — single-image slow push/pull

Variables:
| key | default | description |
|---|---|---|
| `src` | `""` | Image URL (relative to root) |
| `direction` | `"in"` | `"in"` = scale 1.0→1.08, `"out"` = 1.08→1.0 |
| `duration` | `4` | Should match placeholder's `data-duration` |
| `xDrift` | `0` | % pan across the shot |
| `yDrift` | `0` | % pan across the shot |

Use when: you have one photo and want cinematic motion for 3–10s.

### `crossfade-two.html` — two-image crossfading bg

Variables: `srcA`, `srcB`, `duration`, `crossfadeAt` (seconds into shot), `crossfadeLen`.

Use when: one shot needs to transition between two stills without a hard cut.

### `video-bg.html` — video background with grade + slow drift

Variables: `src`, `mediaStart`, `duration`, `startScale`, `endScale`, `driftX`, `driftY`.

Use when: you have stock footage and want it to feel like a cinematic plate.

---

## Cards (`compositions/cards/`) — the design system

> **Read `compositions/cards/README.md` for the full catalog.**

The cards library is the primary pattern for **typographic overlay blocks** (stat, quote, headline, step, feature-row, wordmark, image-underlay). Two delivery modes, one source of truth:

- **CSS-only:** import `design/cards.css` into your root, compose inline with utility classes (`card`, `card--dark-glass`, `card--radius-lg`, `card--pad-std`, `card--w-wide`).
- **Sub-composition:** use files in `cards/` with `data-composition-src` + `data-variable-values`.

Surface variants (dark-glass, light-paper, brand-navy, ghost, image-underlay) × padding × radius = every overlay card a promo needs.

Shipping now: `stat-card`, `quote-card`, `image-underlay-card`, `feature-row-card`. More queued (headline, wordmark, split, timeline, testimonial, stat-pair).

---

## Overlays (`compositions/overlays/`) — legacy / singleton patterns

The `overlays/` folder predates the cards library. Prefer `cards/` for new work.

All overlays assume a dark or graded background. Adjust `color`/`textColor` vars for light backgrounds.

### `declined-stamp.html` — slam-in DECLINED stamp with diagonal strike

Variables: `word` (default `"DECLINED"`), `color` (default `#9a3a3a`), `fontSize`, `strike` (bool).

Use when: showing rejection/denial (hook scenes).

### `step-badge.html` — numbered step indicator card

Variables: `number` (e.g. `"01"`), `kicker` (e.g. `"STEP"`), `label`.

Use when: process explainers (4-step flow, how-it-works).

### `ledger-card.html` — big-figure display ($0, 5 days, etc.)

Variables: `currency`, `amount`, `label`.

Use when: single-number emphasis — cost, time, impact figures.

### `wordmark-cta.html` — brand wordmark + URL + fine print

Variables: `partA`, `partB` (rendered as `partA/partB`), `url`, `fine`, `markColor`, `slashColor`.

Use when: end card, CTA scene.

### `lower-third.html` — bar + caption at lower-third line

Variables: `text`, `barColor`, `textColor`, `fontSize`, `fontWeight`.

Use when: narration caption, attribution, pull quote.

### `word-reveal.html` — kinetic typography (optionally VTT-driven)

Variables:
- `text` — simple string (stagger automatic)
- `words` — array of `{word, start, duration}` for VTT-anchored reveal
- `fontSize`, `color`, `align`, `italic` (array of word indices), `highlight` (map of index → color)

Use when: you want the narration to land visually synchronised to the word.

---

## Adding a new component

1. Create `compositions/<category>/<name>.html`
2. Use the template shape:
   ```html
   <template id="<name>-tpl">
     <div data-composition-id="<name>" data-width="1080" data-height="1920">
       <!-- markup -->
       <style>
         [data-composition-id="<name>"] { /* scoped styles */ }
       </style>
       <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
       <script>
         (function () {
           const root = document.currentScript.closest('[data-composition-id="<name>"]');
           const vars = JSON.parse(root.getAttribute("data-variable-values") || "{}");
           // read vars, build timeline
           window.__timelines = window.__timelines || {};
           const tl = gsap.timeline({ paused: true });
           // tweens
           window.__timelines["<name>"] = tl;
         })();
       </script>
     </div>
   </template>
   ```
3. Add an entry in the appropriate section above.
4. Instantiate from a root composition and lint to verify.

## Sizing and canvas

All components in this library are authored for **1080×1920 vertical** (9:16). For landscape or square projects, fork the file and adjust `data-width`/`data-height` and internal font-size / padding values.

## Fonts

Components reference `Inter`, `JetBrains Mono`, `Instrument Serif` by `font-family`. The root composition must `<link>` Google Fonts (or equivalent) so fonts are available when sub-comps mount.
