# Templates × Modules

The two-layer system that turns a brand palette + script into a finished
video.

```
┌─────────────────────────┐
│  cards.css              │  structural base — never changes
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│  templates/<vibe>.css   │  ONE per video — sets pace, type, motion
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│  tokens-<brand>.css     │  ONE per video — palette + fonts (auto-extracted
└─────────────────────────┘  from website if available)
            ↓
┌─────────────────────────┐
│  effects-batch-08.css   │  shared effect primitives (multiplane, ink, glitch)
│  modules/text-fx.css    │  + text recipes
└─────────────────────────┘
            ↓
        scene modules     mix freely per-scene (multiplane on s2,
                          long-shadow on s5, ink-bleed on s3, etc.)
```

## The four base templates

Pick ONE per video. Each sets pace + type scale + motion easing + shadow
intensity + a recommended LUT for the post-grade pass.

| Template          | Vibe            | Pace      | Display font     | LUT hint        | Pairs with                    |
| ----------------- | --------------- | --------- | ---------------- | --------------- | ----------------------------- |
| `warm-community`  | Organic, human  | Slow-mid  | Fraunces (serif) | `--lut=warm`    | Charity, wellness, education  |
| `kinetic-pop`     | Loud, snappy    | Fast      | Bebas Neue       | `--lut=pop`     | Consumer apps, sports, retail |
| `documentary`     | Cinematic       | Slow      | Playfair         | `--lut=teal-orange` | Mission-led, founder stories |
| `quiet-premium`   | Spacious, light | Mid       | Inter 300        | `--lut=cool`    | Luxury, fintech, B2B SaaS     |

Each template exposes shared CSS variables:

- `--pace-fast`, `--pace-mid`, `--pace-slow` — scene durations
- `--ease-in`, `--ease-out`, `--ease-inout` — easing curves
- `--card-title-size`, `--card-title-weight`, `--card-title-track`, etc.
- `--vibe-shadow-soft`, `--vibe-shadow-press`

Read them from JS via `getComputedStyle(document.documentElement).getPropertyValue("--pace-mid")`
if you need numerics.

## Scene modules

Mix freely. A scene can stack multiple modules — they're additive.

| Module             | What it does                                         | Where it lives                |
| ------------------ | ---------------------------------------------------- | ----------------------------- |
| `multiplane`       | CSS-perspective camera with .plane-N depth presets   | `effects-batch-08.css §1`     |
| `displace-ink`     | SVG ink-bleed reveal (animate `feDisplacementMap`)   | `effects-batch-08.css §2`     |
| `chromatic`        | RGB-shift glitch burst (use sparingly)               | `effects-batch-08.css §3`     |
| `cinemagraph-bg`   | Slow rotating conic-gradient blob behind frosted glass | `effects-batch-08.css §5`   |
| `long-shadow`      | 9-stack text-shadow extrusion                        | `effects-batch-08.css §6`     |
| `amp-bind`         | Audio-reactive CSS vars driven from baked envelope   | `scripts/lib/amp-bind.js`     |
| `text-fx.explode`  | Letters scatter / assemble                           | `modules/text-fx.js`          |
| `text-fx.stamp`    | Slam-impact + screen shake                           | `modules/text-fx.js`          |
| `text-fx.cascade`  | Words drop in sequence                               | `modules/text-fx.js`          |
| `text-fx.stagger`  | Per-letter scale/rotate stagger                      | `modules/text-fx.js`          |
| `text-fx.typeOn`   | Typewriter character reveal                          | `modules/text-fx.js`          |
| `text-fx.counter`  | Number flips up to target                            | `modules/text-fx.js`          |

## Wiring it into a composition

```html
<head>
  <!-- 1. Structural base -->
  <link rel="stylesheet" href="design/cards.css">

  <!-- 2. Vibe (pick ONE) -->
  <link rel="stylesheet" href="design/templates/kinetic-pop.css">

  <!-- 3. Brand (pick ONE — auto-extracted from URL or hand-written) -->
  <link rel="stylesheet" href="design/tokens-kindred.css">

  <!-- 4. Effects + modules (load anything you'll use this comp) -->
  <link rel="stylesheet" href="design/effects-batch-08.css">
  <link rel="stylesheet" href="design/modules/text-fx.css">
  <script src="design/modules/text-fx.js" defer></script>
  <script src="scripts/lib/amp-bind.js"  defer></script>
</head>
<body>
  <!-- ...scenes... -->
  <script>
    const tl = gsap.timeline({ paused: true });
    window.__timelines = window.__timelines || {};
    window.__timelines["my-comp"] = tl;

    // Read pacing from the active template:
    const PACE = (k) =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--pace-${k}`));

    textFx.stamp   (tl, "#title",    { at: 0.4 });
    textFx.cascade (tl, "#subtitle", { at: 0.4 + PACE("fast") });
    textFx.counter (tl, "#stat",     { at: 1.8, duration: PACE("mid") });
  </script>
</body>
```

## Combining templates (vibe blending)

You normally pick ONE base template per video. But if you want to BLEND
two vibes (e.g., warm-community structure with kinetic-pop hits), the
clean way is per-scene escape hatches, not loading two templates at once:

```html
<!-- Base: warm-community everywhere -->
<link rel="stylesheet" href="design/templates/warm-community.css">

<!-- Scene 4 escapes to kinetic-pop pace + type -->
<section class="scene scene-4 vibe-override-kinetic-pop">
  ...
</section>
```

```css
/* In your composition's <style>: scope the override to the wrapper */
.vibe-override-kinetic-pop {
  --pace-fast: 0.7s;
  --pace-mid:  1.4s;
  --card-font-display: "Bebas Neue", Impact, sans-serif;
  --card-title-weight: 800;
  --card-title-size: 96px;
}
```

This avoids the layering conflicts you'd get from loading two templates
(the second wins everything; you lose the first's identity entirely).

## Speed tweaks

GSAP timelines support per-timeline speed:

```js
tl.timeScale(1.5);   // 50% faster everywhere
tl.timeScale(0.7);   // 30% slower
```

Per-scene speed: pass shorter `duration` values — or wrap the scene's tweens
in a sub-timeline and call `subTl.timeScale(2)` on it.

If the whole video feels sluggish: **don't** speed up animations first.
Try shortening the SCRIPT — most "slow" videos are slow because each beat
has too much narration. Pacing comes from cuts, not motion speed.
