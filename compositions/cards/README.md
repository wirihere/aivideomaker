# Cards — HTML Card Design System

Reusable card patterns for HyperFrames compositions. Drop-in CSS + sub-composition components.

**Cold-read entry point.** Fresh session? This README is the catalog — you don't need to open each file.

---

## What this is

A design system for the **HTML card** — the rectangular typographic block that overlays a photo/video background and carries a message. The most common atom in a 15–30s vertical promo.

Two delivery modes, one source of truth:

1. **CSS-only:** Import `design/cards.css` into your root composition, then compose cards inline with utility classes. Fastest to iterate, no extra DOM wrapping.
2. **Sub-composition:** Use the files in this directory with `data-composition-src`. Pass content via `data-variable-values`. Use when a card type repeats across many projects.

---

## Design tokens (from `design/cards.css`)

Every card reads from the same tokens. Override them in your root composition to rebrand.

| Token | Values | Purpose |
|---|---|---|
| `--card-r-{sm,md,lg,xl}` | 14 / 22 / 28 / 36 px | Corner radius |
| `--card-p-{tight,std,luxe}-{x,y}` | 28/40, 48/68, 72/96 | Padding (y, x) |
| `--card-navy / slate / paper / accent / warn / ok` | brand hex | Semantic colours |
| `--card-sh-{sm,md,float}` | three layers | Shadow depth |
| `--card-title-size / body-size / kicker-size / figure-size / label-size` | px | Type scale |
| `--card-font-{ui,mono,display}` | Inter / JetBrains Mono / Instrument Serif | Font families |

---

## The 6 surface variants (what the card looks like)

| Class | Background | Pairs with | Mood |
|---|---|---|---|
| `card--dark-glass` | `rgba(13,24,38,0.92)` + blur | Any photo/video | Default overlay for dark scenes |
| `card--light-paper` | `rgba(238,241,245,0.96)` | Dark scenes, as punchline | Clean, CMS-style |
| `card--brand-navy` | Solid brand navy | Stark brand block | Formal, editorial |
| `card--ghost` | `rgba(13,24,38,0.28)` + blur, 2px border | Subtle overlays | Quiet, minimalist |
| `card--image-underlay` | Image fills bounds behind content | Photo + headline composition | Rich, layered |
| _none_ | — | Pure text over background | Minimal (use text-shadow) |

Combine one surface + one `--radius-*` + one `--pad-*` to assemble a card.

---

## The 8 content layouts (what the card says)

Each layout expects specific content slots. Use them inside ANY surface variant.

### 1. `card--stat` — single big number

For punchline moments: "$0", "5 days", "92%". Pairs best with `card--light-paper`.

```html
<div class="card card--stat card--light-paper card--radius-lg card--pad-luxe card--w-narrow">
  <div class="card__figure">
    <span class="card__figure-unit">$</span><span>0</span>
  </div>
  <div class="card__rule"></div>
  <div class="card__label">YOU PAY · ACC PAYS OUR FEE</div>
</div>
```

### 2. `card--step` — numbered step (01, 02, 03)

For how-it-works sequences. Pairs best with `card--dark-glass`.

```html
<div class="card card--step card--dark-glass card--radius-lg card--pad-std card--w-wide">
  <div class="card__step-num">01</div>
  <div class="card__text-group">
    <div class="card__kicker">STEP</div>
    <div class="card__title">Upload your letter</div>
  </div>
</div>
```

### 3. `card--feature-row` — icon + title + body

Icon can be an animated SVG from `assets/svg-animations/`. Replaces the step-badge when the icon is more meaningful than a number.

```html
<div class="card card--feature-row card--dark-glass card--radius-lg card--pad-std card--w-wide">
  <div class="card__icon">
    <img src="assets/svg-animations/status/check-success.svg" alt="" />
  </div>
  <div class="card__text-group">
    <div class="card__kicker">APPROVED</div>
    <div class="card__title">Your claim is in review</div>
    <div class="card__body">We'll notify you within 48 hours.</div>
  </div>
</div>
```

### 4. `card--headline` — kicker + big title + optional body

The "this is the thing" moment — usually early in a promo to state the premise.

```html
<div class="card card--headline card--align-center card--dark-glass card--radius-lg card--pad-luxe card--w-wide">
  <div class="card__kicker">ACC DECLINED</div>
  <div class="card__title">A decline isn't the end.</div>
  <div class="card__body">Most decisions can be reviewed — free.</div>
</div>
```

### 5. `card--quote` — pull quote with attribution

For testimonials, mission statements, or quotable claims. Uses Instrument Serif italic for editorial feel.

```html
<div class="card card--quote card--dark-glass card--radius-lg card--pad-luxe card--w-wide">
  <div class="card__quote-mark">"</div>
  <div class="card__quote-text">Most declined claims can be overturned when the evidence is presented properly.</div>
  <div class="card__quote-by">— Claim Mate</div>
</div>
```

### 6. `card--wordmark` — brand lockup + url + fine print

End-card CTA. The climax. Use `card--dark-glass` or a dedicated `.wm-panel`.

```html
<div class="card card--wordmark card--align-center card--dark-glass card--radius-xl card--pad-luxe">
  <div class="card__mark">
    <span>CLAIM</span><span class="card__mark-slash">/</span><span>MATE</span>
  </div>
  <div class="card__rule"></div>
  <div class="card__url">claim-mate.co.nz</div>
  <div class="card__fine">3 months from your ACC decision letter</div>
</div>
```

### 7. `card--image-underlay` — photo fills the card, text sits over it

The user's "images that go in it" pattern. Card has a background image + a darkening scrim; the title/body sit on top at z-index 2.

```html
<div class="card card--image-underlay card--headline card--align-left card--radius-lg card--pad-std card--w-wide" style="min-height: 540px;">
  <div class="card__bg" style="background-image: url('assets/photos/workspace.jpg');"></div>
  <div class="card__bg-scrim"></div>
  <div class="card__kicker">STEP 01</div>
  <div class="card__title">Upload your letter</div>
  <div class="card__body">Takes about thirty seconds.</div>
</div>
```

**Why it's powerful:** you can tell a mini-story inside a single card — image = context, text = message. Use for moments where you want a photo present but don't want it dominating the full canvas.

### 8. `card--split` — image one half, text the other (PLANNED — not yet built)

Horizontal or vertical split card. One half is media (image/video/SVG), the other is text.

---

## The persistent brand mark (`.card-mark`)

Not a card — a small always-on element. Lives in a corner throughout the video, fades out before the end-card CTA takes over.

```html
<div class="card-mark card-mark--top-right">
  <span>CLAIM</span><span class="bm-slash">/</span><span>MATE</span>
</div>
```

Four corner positions: `--top-right`, `--top-left`, `--bottom-right`, `--bottom-left`.

---

## SVG-animation slotting (the `.card__icon` pattern)

Cards with `.card__icon` accept any animated SVG from `assets/svg-animations/`. The SVG plays its own SMIL timeline when shown via `<img>` — no GSAP needed. Key categories for explainer/promo content:

| Category | Best for |
|---|---|
| `brand/` | Project-specific marks (claim-mate paper-tick, consent-mate paper-tick) |
| `status/` | check-success, cross-error, loading-to-success, warning-triangle |
| `time/` | clock-tick, calendar-flip, hourglass, countdown-321 |
| `money/` | coin-spin, money-stack, price-tag, card-tap |
| `flow/` | stepper-3, funnel-fill, network-nodes |
| `arrows/` | arrow-trend-up, arrow-right-bounce, arrow-rotate-refresh |
| `notifications/` | bell-ring, badge-pop, notification-toast |
| `text-fx/` | highlight-marker, underline-draw, typewriter |
| `transitions/` | iris-open, iris-close, split-doors (use between scenes) |

**Sizing:** `.card__icon` is 140×140 by default. Override via `style="width: 180px; height: 180px"` or a custom class.

---

## New SVG animations we should commission

Gaps identified while building Claim Mate v3 — each one would replace a text-only beat with a purpose-built animation.

| Name | Folder | Description | Use case |
|---|---|---|---|
| `approval-stamp` | status | Green stamp slamming down + "APPROVED" text | Counter to declined-stamp |
| `paper-plane-send` | communication | Paper plane folding + flying off | "Lodge your appeal" |
| `document-scan` | tech | Phone camera beam scans over a document | "Upload your letter" step |
| `signature-sign` | ui | Pen draws a signature | Consent / agreement moments |
| `folder-file` | flow | Doc flying into a folder | "We've received your claim" |
| `calendar-mark` | time | Calendar date being circled | "Your hearing is scheduled" |
| `growth-bar` | data | Single bar chart filling to a value | Result / outcome stats |
| `handshake` | reactions | Two hands meeting | Settlement / resolution |
| `paper-crumple` | fx | Page crumples and tossed | Rejection, "tear it up" moments |
| `shield-check` | status | Shield with tick fades in | Trust / guarantee signals |

Author per the `assets/svg-animations/README.md` conventions (SMIL, `fill="freeze"` for one-shots, `repeatCount="indefinite"` for loops, deterministic).

---

## Inlining vs sub-composing (when to use which)

**Inline (import `design/cards.css` + write markup in root):**
- Unique content per instance (every card has different text/images)
- You want to see all card content in one file while debugging
- 90% of video projects

**Sub-composition (this directory):**
- Same card type reused across many projects with only text varying
- A card pattern that has complex GSAP choreography you want to package once
- You want to build a library of "title card", "stat card", "testimonial card" that agents can mix into new videos

**Don't use sub-comps for:**
- Cards that appear multiple times in one composition (sub-comp instances share `window.__timelines[id]`, so only one animation runs). Inline those.
- Cards where you need per-instance content nuance.

---

## Files in this directory

Current (shipping):
- `README.md` — this file
- `stat-card.html` — big number + label sub-comp
- `quote-card.html` — pull quote + attribution sub-comp
- `image-underlay-card.html` — image-backed text card
- `feature-row-card.html` — icon + title + body sub-comp

Planned (next batch):
- `headline-card.html`
- `wordmark-card.html`
- `split-card.html`
- `timeline-card.html` (horizontal progress with steps)
- `testimonial-card.html` (avatar + quote + attribution)
- `stat-pair-card.html` (two stats side-by-side)

---

## Motion defaults (per-card, layered over the playbook)

Every card that is NOT the final scene follows this pattern:

1. **Entrance** at data-start + 0s, duration 0.30–0.42s, ease `back.out(1.6)` or `expo.out`
2. **Content stagger** — child slots animate 0.06–0.10s apart
3. **Exit** at data-start + data-duration − 0.35s, duration 0.32s, ease `power3.in`, in a direction matching the narrative (slide right/up/down/left, collapse, crumple — see playbook exit vocabulary)

The final scene (`card--wordmark` typically) does NOT exit — it holds and fades via the global vignette.
