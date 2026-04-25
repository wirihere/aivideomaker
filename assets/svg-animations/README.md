# SVG animation library

Self-contained SVG animations (SMIL) for use inside HyperFrames compositions, video overlays, or any HTML that can render an `<svg>` / `<object>` / `<img>`.

## How to preview

Open [`index.html`](./index.html) in a browser. Every animation is rendered in its own card. Click **Replay** on a card (or **Replay all** in the footer) to restart from frame 0.

## How to use in a composition

### Option 1 — reference the file directly

```html
<img src="../assets/svg-animations/status/check-success.svg"
     class="clip" id="el-success"
     data-start="3" data-duration="1.2" data-track-index="2"/>
```

### Option 2 — embed as `<object>` when you want crisp SMIL inside an `<iframe>`-like host

```html
<object type="image/svg+xml"
        data="../assets/svg-animations/status/check-success.svg"></object>
```

### Option 3 — paste the SVG contents inline into your composition for full control over timing. All animations are under 200 lines of hand-authored markup, easy to tweak.

## What's in here

Animations are organized by category. Browse [`index.html`](./index.html) for the full visual gallery.

| Category        | What it covers                                                |
| --------------- | ------------------------------------------------------------- |
| loading         | spinners, progress bars, skeleton shimmers                    |
| status          | check/cross/warning, loading→success/error morphs             |
| arrows          | directional, CTAs, trend lines, refresh loops                 |
| notifications   | bell, badge pop, toast notifications                          |
| data            | bar/line/donut charts, counters, stat cards                   |
| money           | coin spin, money stack, card tap, price tag                   |
| social          | heart like, star rating, thumbs-up, share                     |
| tech            | gears, wifi, cloud upload, lock, battery                      |
| flow            | stepper, network nodes, funnel                                |
| fx              | confetti, sparkles, radar, fire, glitch, smoke, stars, aurora |
| transitions     | wipes, iris, shutter, reveals, noise, paint splash            |
| text-fx         | underlines, marker, scribble circles, frames, typewriter      |
| weather         | sun, rain, lightning, snowfall                                |
| time            | clock, hourglass, 3-2-1 countdown, calendar flip              |
| devices         | phone mockup, laptop, browser window                          |
| maps            | pin drop, route draw, globe spin                              |
| reactions       | 100 emoji, mind blown, fire                                   |
| logos           | geometric build, shine sweep, stamp slam                      |
| ui              | cursor click, swipe up, tap pulse, toggle                     |
| nature          | tree grow, flower bloom, leaves fall                          |
| abstract        | equalizer, shape morph, DNA, orbit particles                  |
| communication   | email send, chat bubbles, microphone                          |
| **cinematic**   | rocket launch, city skyline, dashboard reveal, quote callout, product grid, pipeline, achievement, subscribe+bell, map-zoom, testimonial, before/after, neon sign, 5-4-3-ACTION |
| gaming          | XP bar, health bar, power-up                                  |
| ecommerce       | add-to-cart, package delivery, barcode scan                   |
| health          | ECG heartbeat, pill bottle, DNA test report                   |
| education       | book flip, lightbulb, graduation cap                          |
| sports          | medal podium, winner trophy                                   |
| food            | pizza bake, coffee cup                                        |
| travel          | airplane route, suitcase pack                                 |

## Rules each SVG follows

- **Self-contained**: no external fonts, no network fetches.
- **Deterministic**: no `Math.random()` or `Date.now()` — pure SMIL timing.
- **Freeze-safe**: one-shot animations use `fill="freeze"` to hold the final frame.
- **Viewports scale**: every SVG has a `viewBox`, so you can drop it at any size.
- **Infinite loops only where it makes sense** (spinners, ambient FX). One-shot animations (checks, reveals) play once and hold.

## Editing tips

- The color palette is consistent across files (indigo `#4f46e5`, cyan `#06b6d4`, emerald `#10b981`, amber `#f59e0b`, red `#ef4444`). Swap these in a file-level find/replace to match your brand.
- To change timing, adjust `begin=` and `dur=` on `<animate>` / `<animateTransform>` elements.
- `calcMode="spline"` + `keySplines="x1 y1 x2 y2"` gives you GSAP-like easing.
- To loop a one-shot animation forever, replace `fill="freeze"` with `repeatCount="indefinite"`.

## Compiler notes (HyperFrames)

When used via `<img src>` or `<object data=>`, the HyperFrames capture engine restarts SMIL timelines from `0` when the clip's `data-start` is reached. That matches what you see when you hit **Replay** in the preview.
