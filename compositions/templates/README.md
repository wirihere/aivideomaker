# Structural Composition Templates

Full composition shells for common video formats. Each is a complete
`.html` composition with the scene structure, timing, and GSAP wiring
for a specific brief — drop in your tokens, swap the placeholder copy,
render.

These are **structural** templates. They sit on top of the **vibe** templates
in `design/templates/` and the **module recipes** in `design/modules/`.

```
┌─────────────────────────────┐
│ compositions/templates/<x>  │  structural form  (THIS folder)
└─────────────────────────────┘ scene count, timing, GSAP wiring
              ↓
┌─────────────────────────────┐
│ design/templates/<vibe>.css │  vibe layer
└─────────────────────────────┘ pace, type scale, motion easing, shadows
              ↓
┌─────────────────────────────┐
│ design/tokens-<brand>.css   │  brand layer
└─────────────────────────────┘ palette + fonts (per video)
              ↓
┌─────────────────────────────┐
│ design/effects-batch-08.css │  shared primitives (multiplane, ink, glitch)
│ design/modules/all.css      │  + text + glitter recipes
└─────────────────────────────┘
```

## The eight structural templates

| Template                  | Format         | Length | Default base    | Recommended LUT                       |
| ------------------------- | -------------- | ------ | --------------- | ------------------------------------- |
| `hero-promo-30s.html`     | 1920×1080 land | 30s    | `kinetic-pop`   | `--lut=pop --strength=1.0`            |
| `case-study-60s.html`     | 1920×1080 land | 60s    | `documentary`   | `--lut=teal-orange --strength=0.85`   |
| `social-reel-15s.html`    | 1080×1920 vert | 15s    | `kinetic-pop`   | `--lut=pop --strength=1.0`            |
| `testimonial-45s.html`    | 1920×1080 land | 45s    | `warm-community`| `--lut=warm --strength=0.9`           |
| `product-launch-30s.html` | 1920×1080 land | 30s    | `kinetic-pop`   | `--lut=pop --strength=1.0`            |
| `founder-story-60s.html`  | 1920×1080 land | 60s    | `documentary`   | `--lut=teal-orange --strength=0.85`   |
| `before-after-20s.html`   | 1080×1920 vert | 20s    | `kinetic-pop`   | `--lut=pop --strength=1.0`            |
| `faq-quick-30s.html`      | 1080×1920 vert | 30s    | `quiet-premium` | `--lut=cool --strength=0.55`          |

### `hero-promo-30s.html` — 30-second hero promo

Landscape launch ad / hero promo. Four scenes: a big hero with multiplane
dolly + cascade headline (0–8s), a three-up benefits row with stagger +
ambient sparkle (8–18s), a social-proof stat counter (18–26s), and a
glitter-burst CTA with glitch on the verb (26–30s). Pairs naturally with
consumer apps, retail, sports, fitness — anywhere the kinetic-pop snap
fits the brand.

### `case-study-60s.html` — 60-second case study

Landscape problem→solution→outcome→quote→CTA. Five scenes: problem
statement with cinemagraph background and cascade text (0–12s), the
solution with a multiplane reveal + ink-bleed headline + supporting
bullets (12–30s), outcome metrics with three counters and ambient glitter
(30–46s), a testimonial quote with long-shadow + per-letter stagger
(46–58s), and a closing CTA + URL (58–60s). Documentary base — slow
pacing, editorial Playfair display, mono captions, restrained motion.
Pairs with mission-led brands, founder stories, social-impact work.

### `social-reel-15s.html` — 15-second vertical reel

Portrait social hook → punch → punch → CTA. Four scenes: a hook with
stamp + glitch (0–3s), a stat counter punch with cascade line (3–8s),
a multiplane visual + stagger headline (8–13s), and a brand wordmark +
URL closer (13–15s). Built for TikTok, Reels, Shorts — kinetic-pop pace
keeps every beat under three seconds.

### `testimonial-45s.html` — 45-second customer testimonial

Landscape single-customer voice. Five scenes: setup with portrait + headline
(0–8s), pull-out quote with long-shadow open quote and per-letter stagger
(8–22s), outcome stat counter with ambient sparkle (22–34s), name reveal
with role chip (34–42s), and a closing CTA + URL (42–45s). Warm-community
base — Fraunces serif + Nunito body, soft shadows, slow-mid pacing. Uses
`data-scene-grade="warm"` on the setup. Pairs with charity, wellness,
education, or any brand where a single human voice is the strongest signal.

### `product-launch-30s.html` — 30-second product launch

Landscape "available now" launch. Four scenes: brand wordmark stamp with
glitch (0–4s), product reveal with multiplane dolly + cascade headline
(4–14s), three-feature row with stagger + ambient sparkle (14–24s), and
a glitter-burst availability scene with glitch on the date + URL (24–30s).
Kinetic-pop base, `data-scene-grade="noir"` on the brand chip for
contrast. Pairs with consumer apps, hardware drops, retail collections.

### `founder-story-60s.html` — 60-second founder story

Landscape narrative arc. Five scenes: name + portrait card with role
chip (0–10s), "the problem we saw" with cinemagraph background + cascade
(10–25s), "how we built it" with multiplane reveal + ink-bleed + bullets
(25–42s), "what's next" with two stat counters + ambient sparkle (42–55s),
and a closing CTA (55–60s). Documentary base — Playfair + Source Sans +
JetBrains Mono captions, slow editorial pace. Uses `data-scene-grade="teal-orange"`
on the portrait. Pairs with mission-led founders, B-corp brands, anything
that benefits from a documentary read.

### `before-after-20s.html` — 20-second before/after split-screen

Portrait "the change" reveal. Five scenes: BEFORE state with stamp +
glitch (0–7s), diagonal swipe transition (7–9s), AFTER state with
ink-bleed reveal + glitch (9–16s), bottom-line stat counter with glitter
burst (16–19s), and a 1-second CTA (19–20s). Kinetic-pop base, uses
`data-scene-grade="cool"` on BEFORE for desaturated contrast. Pairs with
productivity, fitness, finance — any "this vs that" pitch.

### `faq-quick-30s.html` — 30-second three-question FAQ

Portrait Q&A explainer. Five scenes: brand chip with kicker + tag (0–4s),
then three Q+A cards (4–12s, 12–20s, 20–28s), each with a numbered marker,
question cascade, hairline rule reveal, and answer fade-up. Closes with a
2-second CTA (28–30s). Quiet-premium base — light Inter, generous whitespace,
hairline rules, near-zero shadows. Uses `data-scene-grade="soft"` on the
brand chip. Pairs with fintech, B2B SaaS, pricing pages — anywhere
"considered" beats "loud."

## How to use a template

1. **Copy the template into your project as `index.html`.**

   ```bash
   cp compositions/templates/hero-promo-30s.html index.html
   ```

2. **Update the design paths.** Templates live two levels deep, so they
   reference `../../design/`. When you copy a template to project root,
   change every `../../design/` to `design/`. A one-line `sed`:

   ```bash
   sed -i 's|\.\./\.\./design/|design/|g' index.html
   ```

   (On Windows PowerShell: `(gc index.html) -replace '\.\./\.\./design/','design/' | sc index.html`.)

3. **Swap the brand tokens.** Replace `tokens-PLACEHOLDER.css` with your
   real `tokens-<brand>.css` — either one extracted from a website with
   `npx hyperframes capture`, or hand-written. The line to change in the
   `<head>` is:

   ```html
   <link rel="stylesheet" href="design/tokens-PLACEHOLDER.css">
   <!-- becomes -->
   <link rel="stylesheet" href="design/tokens-yourbrand.css">
   ```

4. **Fill in placeholder copy.** Each template uses obvious placeholder
   strings: `HEADLINE`, `BENEFIT-1`, `12,500`, `BRAND`, `yourbrand.com`,
   etc. Search-and-replace your real copy in. The counter recipe in
   stat scenes reads its target value from the element's text content,
   so set the final number in HTML and the animation will count up to it.

5. **(Optional) Switch the vibe.** The `<head>` loads ONE
   `design/templates/<vibe>.css`. To re-skin without losing the
   structure, swap that one line — e.g., from `kinetic-pop.css` to
   `warm-community.css`.

6. **Preview, then render.**

   ```bash
   npx hyperframes preview                       # sanity check in studio
   npx hyperframes render -o out.mp4             # render to MP4
   node scripts/post-grade.mjs --lut=pop out.mp4 # apply recommended LUT
   ```

## Picking the right template

| If you have…                                              | Reach for…                  |
| --------------------------------------------------------- | --------------------------- |
| A brand-new product, 30s budget, want it to feel exciting | `hero-promo-30s` or `product-launch-30s` |
| A real customer happy to be on camera (or quoted)         | `testimonial-45s`           |
| A full case study with metrics + quote, time to breathe   | `case-study-60s`            |
| A founder/origin narrative, mission-led brand             | `founder-story-60s`         |
| A 15-second hook for TikTok / Reels / Shorts              | `social-reel-15s`           |
| A "this changes everything" comparison pitch              | `before-after-20s`          |
| Three quick objections to handle (pricing, fit, how)      | `faq-quick-30s`             |

## What the templates assume

- **Cards.css** structural variables (radii, padding, type scale).
- **One** `design/templates/<vibe>.css` loaded — the templates ship with
  their default base; you can swap freely.
- **One** `design/tokens-<brand>.css` loaded — defines `--card-paper`,
  `--card-navy`, `--card-accent`, `--card-paper-soft`, `--card-slate-ink`,
  `--card-warn`, etc.
- **`design/effects-batch-08.css`** for multiplane, cinemagraph, ink-bleed,
  glitch, long-shadow, and per-scene grade via `data-scene-grade`.
- **`design/modules/all.css` + `all.js`** for text-fx, effect-fx, glitter-fx
  module recipes.
- **`design/vendor/gsap.min.js`** for the GSAP timeline runtime.

All templates register on `window.__timelines["<composition-id>"]`,
load `paused: true`, and use `tl.fromTo()` (not `tl.from()`) for
deterministic capture. The SVG filter defs for ink-bleed and glitch live
inline at the bottom of the body of each template.

## `data-scene-grade` — declarative per-scene LUT

Templates use the new `data-scene-grade` attribute on at least one scene
to push contrast across the cut. Supported values:

- `warm` — golden top-light, amber midtones, mahogany shadows
- `cool` — sky highlights, navy depths
- `noir` — letterbox darkening + central vignette
- `teal-orange` — Hollywood blockbuster split
- `pop` — contrast + saturation lift (no overlay)
- `soft` — contrast + saturation drop (no overlay)

Apply it to any `<div class="scene clip">` element.

## Standalone autoplay

Each template ends with the standalone autoplay guard:

```js
if (window === window.top) {
  setTimeout(() => tl.play(0), 250);
}
```

This means: open the file directly in a browser tab and it plays. When
loaded inside the studio iframe or the renderer, the framework owns
playback — the guard skips autoplay so the timeline stays paused at 0.
