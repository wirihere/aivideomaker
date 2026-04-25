# R&D · HTML Template Library

**Question:** What should a substantial, **brand-agnostic**, agent-navigable HTML template library look like for this HyperFrames project, given the existing cards system as the seed? Templates must be reusable across any future project (Claim Mate, Consent Mate, and everything after) without modification.
**Date:** 2026-04-25
**TL;DR:**
- **Brand-agnostic by construction.** Every template reads design tokens only — never hardcoded colours, fonts, or copy. Split `design/cards.css` into `tokens-base.css` (neutral defaults) + optional `tokens-<brand>.css` overlays (one line swap per project). This is item 0, not a refactor; no template ships before it lands.
- **Rapid brand adaptation via URL extractor.** `npx hyperframes brand extract <url>` uses Playwright to pull palette + fonts + logo from any site and writes an annotated `tokens-<slug>.css` in ~20 seconds. Gets a new project 80% branded with zero hand work; the remaining 20% is a 2-minute designer pass on the annotated output.
- **Media-bearing cards are first-class.** Image, video (muted + loop per HyperFrames rules), and SMIL-SVG all slot into a typed `.card__media` slot — enabling `media-above`, `media-below`, `split`, `product-showcase`, `video-loop`, `gallery`, and `testimonial` cards alongside the text-only family.
- **Five-tier taxonomy** (cards, scene-beats, overlays, data-viz, device/document frames) indexed by a `templates.json` manifest modeled on shadcn's registry-item schema. Manifest carries `brandAgnostic` flag, typed `props` (including asset-type media props), CSS tokens consumed, and motion defaults — enabling agent cold-reads without opening HTML.
- **End-to-end URL → video pipeline.** The template library is the vocabulary `/website-to-hyperframes` speaks: step 1b (extract brand tokens) + step 6 (assemble scene-beats from catalog) replace hours of bespoke HTML with a catalog pass. Preview in ~10 min instead of ~2 hours.

---

## What we have today

**Shipping (copy-paste ready):**
- `design/cards.css` — design tokens (6 surfaces × 8 layouts × radius/padding modifiers), palette, type scale. **Currently hardcoded to Claim Mate values** (navy `#0d1826`, amber `#ffb84d`, Inter/JetBrains Mono/Instrument Serif). This is the main debt blocking library-wide agnosticism.
- `compositions/cards/` — 4 sub-comp templates (stat, quote, image-underlay, feature-row). Structure is already token-driven; example copy in the README (`$0`, `YOU PAY · ACC PAYS OUR FEE`, `CLAIM/MATE`) is Claim Mate-specific and must be replaced with neutral placeholder copy before library-ready.
- `compositions/overlays/` — 6 legacy singleton patterns (declined-stamp, step-badge, ledger-card, wordmark-cta, lower-third, word-reveal); README notes these predate the card system and new work should prefer cards/
- `compositions/backgrounds/` — 3 patterns (ken-burns, crossfade-two, video-bg)
- `assets/svg-animations/` — ~95+ SMIL animations across 32 categories, with a gallery index.html and per-category README. Note the `brand/` subfolder holds Claim Mate / Consent Mate-specific marks — those stay out of the agnostic library catalog but remain in the SVG folder for project use.

**Not-yet-built but already spec'd in cards/README.md "Planned" list:** headline-card, wordmark-card, split-card, timeline-card, testimonial-card, stat-pair-card.

**Gaps:** no neutral token base (every template inherits Claim Mate defaults); no scene-level templates at all — every promo assembles atomic cards + ad-hoc inline scenes; no machine-readable manifest; discovery is README-only.

---

## Core principle: brand-agnostic by construction

Every template in this library must render correctly for any brand with only a token overlay swap. That discipline drives four concrete rules:

1. **No hardcoded colour, font-family, radius, or shadow values** inside any template HTML. Every visual value reads from a CSS custom property defined in `tokens-base.css`. A template that writes `color: #0d1826` fails review.
2. **No brand-specific copy in defaults.** Templates ship with placeholder strings that read as placeholders: `"Your headline here"`, `"[FIGURE]"`, `"[BRAND NAME]"`, `"example.com"`. Never `"Claim Mate"` or a plausible-looking invented stat. (The no-invented-facts rule reinforces this — placeholder numbers that look real are worse than obvious placeholders.)
3. **No brand-specific imagery in template files.** Image slots reference `assets/photos/placeholder-*.jpg` or neutral stock. Project-specific photos live in the root composition that imports the template, not in the template itself.
4. **Brand lives in two files, never in templates.** The brand layer is `design/tokens-<brand>.css` (token overrides) + a per-project root composition that imports base + brand + scene files. Templates know nothing about either.

The animation-curator's convention of keeping project-specific SVGs in `assets/svg-animations/brand/` (quarantined from the generic categories) is the right precedent. Templates follow the same quarantine: the generic `compositions/cards/*.html` stays agnostic; if a brand needs a unique variant, it gets a project-local file in its own repo or a `compositions/_project/` subfolder that is explicitly outside the library.

---

## Landscape survey — what to borrow (and what to skip)

### Remotion / React-based video
[Remotion's template ecosystem](https://www.remotion.dev/templates/) is the closest analog: each template is a self-contained React component with typed props. The key pattern worth copying is **typed prop contracts as the template's public surface** — consumers don't read internals, they read the prop list. In our world that means `data-variable-values` keys documented in the manifest, not scattered across READMEs. The community library at [remotiontemplates.dev](https://remotiontemplates.dev) is thin and not worth forking; the structural lesson is that even small libraries benefit from a typed schema per template.

**What doesn't survive our constraint:** Remotion templates are React components with `useCurrentFrame()`, `interpolate()`, and runtime prop injection. None of that is available in deterministic HyperFrames HTML. We can borrow the discovery/schema model, not the runtime model.

### MOGRT / After Effects
[MOGRTs](https://helpx.adobe.com/after-effects/using/creating-motion-graphics-templates.html) solve exactly the "expose only what the editor should touch" problem. The key design principle: **the AE artist decides which properties are exposed as template controls; everything else is locked.** Applied to our system: each template declares its `props` list in `templates.json`; agents only set those props, they don't edit internals. This is the right mental model for agent ergonomics. The "Essential Graphics panel" = our `data-variable-values`.

**What doesn't survive:** MOGRT is a binary format. The entire value of our system is that templates are readable HTML/CSS — that legibility is a first-class asset for agent cold-reads.

### MJML / email templates
[MJML](https://mjml.io/) solves an almost identical problem: deterministic, composable HTML blocks with a design-token layer, authored for non-browser rendering targets. The critical lesson from MJML's component system is the **separation between the semantic slot (`mj-text`, `mj-image`) and the renderer** — the component author controls layout, the consumer supplies content. That maps cleanly to our `.card__kicker` / `.card__title` / `.card__body` slot system, which is already correct.

MJML's preview/gallery model is worth copying: each template has a rendered preview image alongside the code snippet. In our case, a single still frame extracted from a render (we already do this as verification ritual) is the preview. **The output of `ffmpeg -ss <midpoint> ... -frames:v 1 preview.jpg` becomes the template's marketing image in the catalog.**

### Shadcn registry
The [shadcn registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json) is the cleanest existing blueprint for a manifest-driven component library. Relevant fields mapped to our use case:

| shadcn field | Our equivalent |
|---|---|
| `name` | template slug, e.g. `stat-card` |
| `title` | human label |
| `description` | one sentence |
| `type` | `card` / `scene-beat` / `overlay` / `data-viz` / `device-frame` |
| `categories` | `["promo", "explainer", "cta"]` |
| `files` | `[{ "path": "compositions/cards/stat-card.html" }]` |
| `cssVars` | design tokens the template reads |
| `meta` | `{ "duration": 4, "aspect": "9:16", "props": [...] }` |

We don't need a network registry protocol yet. A single `compositions/templates.json` file is sufficient and can be adopted by `hyperframes add` later.

---

## Proposed taxonomy

Five tiers, each serving a different compositional role:

### Tier 1: Cards (atomic overlays — already exists, extend it)
The current card system covers most needs. Complete the planned batch and add new types, including a full family of media-bearing cards:

**Text-only cards**
| Template | Priority | Status | Notes |
|---|---|---|---|
| `headline-card` | P0 | planned | kicker + big title + body |
| `wordmark-card` | P0 | planned | end-card CTA |
| `stat-pair-card` | P1 | planned | two stats side-by-side |
| `timeline-card` | P1 | planned | horizontal step progress |
| `price-card` | P1 | new | plan name + price + bullets |
| `review-card` | P1 | new | star rating + quote + name |
| `comparison-table-card` | P2 | new | 2-col feature matrix |

**Media-bearing cards** (see "Media slots" section below)
| Template | Priority | Status | Notes |
|---|---|---|---|
| `split-card` | P0 | planned | media half + text half (horizontal or vertical) |
| `testimonial-card` | P0 | planned | avatar image + quote + attribution |
| `image-underlay-card` | exists | shipping | image fills card, text overlays with scrim |
| `media-above-card` | P0 | new | image or video at top, text below (product/news pattern) |
| `media-below-card` | P1 | new | text at top, media at bottom |
| `media-inline-card` | P1 | new | thumbnail + title + body inline (search-result pattern) |
| `product-showcase-card` | P1 | new | image top + title + body + price/CTA |
| `gallery-card` | P2 | new | 2×2 or 1×3 grid of media thumbs with captions |
| `video-loop-card` | P1 | new | looping muted video (UI capture, B-roll) as dominant element |
| `before-after-card` | P2 | new | two media states with slide reveal |

---

### Media slots — image, video, SVG-animation as first-class card content

Cards can carry rich media, not just text. The slot system:

| Slot class | Accepts | Sizing | Use |
|---|---|---|---|
| `.card__icon` | SMIL SVG via `<img>` | 140×140 default | Small illustrative mark (existing) |
| `.card__bg` + `.card__bg-scrim` | Image only | Fills card | Background behind text (existing, image-underlay) |
| `.card__media` | Image, video, or SVG | Variable, respects aspect | **Foreground media** — the card is about this media |
| `.card__media--16x9` / `--1x1` / `--9x16` / `--4x5` | Aspect-locked slot | Preset aspect | Common social / product ratios |
| `.card__avatar` | Image (round by default) | 64/80/120px | Testimonial + reviewer photos |
| `.card__thumb` | Image, small | 80×80 / 120×120 | Inline / list-style cards |

**Media-card HTML pattern:**

```html
<div class="card card--media-above card--dark-glass card--radius-lg card--pad-std card--w-wide">
  <div class="card__media card__media--16x9">
    <img src="assets/photos/placeholder-workspace.jpg" alt="" />
  </div>
  <div class="card__text-group">
    <div class="card__kicker">FEATURE</div>
    <div class="card__title">Your headline here</div>
    <div class="card__body">One supporting sentence.</div>
  </div>
</div>
```

**Video in a card** (HyperFrames-specific rules — must follow exactly or renders break):

```html
<div class="card card--media-above card--dark-glass card--radius-lg card--pad-std card--w-wide">
  <div class="card__media card__media--16x9">
    <video src="assets/videos/ui-loop.mp4" autoplay muted loop playsinline></video>
  </div>
  <div class="card__text-group">
    <div class="card__title">Your headline here</div>
  </div>
</div>
```

Rules inherited from CLAUDE.md:
1. **Video elements inside cards are ALWAYS `muted`.** Audio for the composition comes from a separate `<audio>` track, not from card video elements. This is non-negotiable — browsers block autoplay on unmuted video.
2. **`autoplay muted loop playsinline`** is the required attribute set for decorative card loops. `playsinline` prevents iOS from fullscreening.
3. **Short loops only.** 2–8 second loops (~1–4 MB) keep project size sane. Longer video belongs as a scene background or a dedicated video scene-beat, not embedded inside a card.
4. **Deterministic playback.** Don't set `currentTime` from random; if a card's video needs to sync to a beat, set `currentTime` from its GSAP `data-start` offset so every render matches.
5. **No network video.** Card videos must be local `assets/videos/*.mp4` — no CDN URLs, no YouTube embeds (the determinism constraint + offline-render requirement both block external sources).
6. **Object-fit cover.** `.card__media video` uses `object-fit: cover` by default to match the slot aspect without distortion; `object-fit: contain` is available as a modifier when the video's composition shouldn't be cropped.

**Animated SVG as card media.** SMIL SVGs (from `assets/svg-animations/`) can fill `.card__media` exactly like images — drop them in via `<img src="...svg">` and their timeline runs independently. This is the cheapest way to add motion to a card without writing a new GSAP timeline. Good for abstract illustrations; less good for content that needs real photography.

**Accessibility / determinism combined:** every `<img>` and `<video>` in a card gets an `alt=""` or a `role="presentation"` if decorative. If the media *is* the content (testimonial avatar, product shot), supply a real `alt`.

**Token extensions for media cards:**

```css
:root {
  --card-media-radius: calc(var(--card-r-lg) - 4px);  /* nested corners */
  --card-media-ratio-16x9: 16 / 9;
  --card-media-ratio-1x1:  1 / 1;
  --card-media-ratio-9x16: 9 / 16;
  --card-media-ratio-4x5:  4 / 5;
  --card-avatar-size-sm: 64px;
  --card-avatar-size-md: 80px;
  --card-avatar-size-lg: 120px;
}
```

Added to `tokens-base.css` in the first batch.

**Manifest example for a media card:**

```json
{
  "name": "media-above-card",
  "type": "card",
  "props": [
    { "key": "mediaSrc", "type": "asset", "required": true, "accepts": ["image/*", "video/mp4", "image/svg+xml"] },
    { "key": "mediaAspect", "type": "enum", "default": "16x9", "enum": ["16x9", "1x1", "9x16", "4x5"] },
    { "key": "mediaFit", "type": "enum", "default": "cover", "enum": ["cover", "contain"] },
    { "key": "kicker", "type": "string", "placeholder": "[KICKER]" },
    { "key": "title", "type": "string", "required": true, "placeholder": "[TITLE]" },
    { "key": "body", "type": "string", "placeholder": "[BODY]" }
  ]
}
```

The `"type": "asset"` prop is new — it tells agents to resolve an asset path, and `accepts` constrains the MIME types so asset-hunter knows what to fetch.

---

### Tier 2: Scene-beats (full 1080×1920 compositions for common narrative moments)
A scene-beat is a complete scene that slots into any promo at a specific narrative function. Unlike a card (which overlays a background), a scene-beat IS the scene — it includes its own background treatment, overlay structure, and GSAP choreography packaged together.

| Template | Priority | Notes |
|---|---|---|
| `scene-hook` | P0 | text-only opening; bold stacked type; no photo. Proven in v4 "ACC" text-hook. |
| `scene-stat-reveal` | P0 | number counts up from 0; photo bg + card overlay |
| `scene-how-it-works-3` | P0 | 3-step sequence using step-cards staggered |
| `scene-testimonial` | P1 | testimonial-card over photo bg |
| `scene-cta-end` | P1 | wordmark-card + url + fine print + breathe-float |
| `scene-problem-solution` | P1 | split beat: problem state → solution state |
| `scene-product-demo` | P2 | device-frame + caption overlay |
| `scene-before-after` | P2 | before-after-card with entrance reveal |

Scene-beats are **CSS-only + inline GSAP** by default, not sub-comps — the multi-instance sub-comp collision issue from LEARNINGS.md §4 applies to any scene pattern that appears more than once per composition. The template file is a copy-paste scaffold, not a runtime loaded sub-comp.

### Tier 3: Overlays (singletons — already partly exists, clean up legacy)
The existing `overlays/` folder is legacy but its 6 patterns are still used. Additions:

| Template | Priority | Notes |
|---|---|---|
| `lower-third` | exists | keep |
| `word-reveal` | exists | keep |
| `declined-stamp` | exists | keep (move to cards eventually) |
| `progress-bar` | P1 | horizontal scrub bar showing video progress |
| `countdown` | P1 | 3-2-1 using the existing countdown-321 SVG |
| `caption-subtitle` | P1 | VTT-driven word-by-word caption strip |
| `brand-mark-corner` | P1 | extract the always-on corner pattern into a template |

### Tier 4: Data-viz cards (animated charts — pull from existing SVG library first)
The `assets/svg-animations/data/` folder already has bar/line/donut chart SVGs. The data-viz tier is mostly about wrapping those SVGs in card shells with the right slots:

| Template | Priority | Notes |
|---|---|---|
| `bar-chart-card` | P1 | SVG bar chart + title + source note |
| `donut-stat-card` | P1 | SVG donut + center figure + label |
| `funnel-card` | P2 | SVG funnel + stage labels |
| `timeline-event-card` | P2 | horizontal timeline SVG + events |

These are P1/P2 because they require verified data (no invented stats rule) — they're only useful when the user supplies real numbers.

### Tier 5: Device/document frames (situational, ship when needed)
| Template | Priority | Notes |
|---|---|---|
| `phone-frame` | P2 | phone mockup SVG from devices/ + screenshot slot |
| `browser-frame` | P2 | browser chrome + screenshot slot |
| `document-letter` | P2 | letter/invoice UI for legal/financial promos |
| `email-preview` | P3 | email mockup for SaaS promos |

Tier 5 is P2/P3 because Claim Mate and Consent Mate briefs haven't needed them yet. Build on demand.

---

## Parameterisation + agent-discoverability model

### The manifest: `compositions/templates.json`

A single file at `compositions/templates.json` is the agent cold-read entry point. Modeled on shadcn's registry-item schema but stripped to what we need:

```json
{
  "version": "1",
  "templates": [
    {
      "name": "stat-card",
      "title": "Stat Card",
      "description": "Single big number with unit and label. Best for punchline moments (92%, 5x, $29).",
      "type": "card",
      "categories": ["promo", "explainer", "data-viz"],
      "file": "compositions/cards/stat-card.html",
      "duration": null,
      "aspect": "9:16",
      "preview": "compositions/cards/previews/stat-card.jpg",
      "brandAgnostic": true,
      "props": [
        { "key": "figure", "type": "string", "required": true, "example": "92", "placeholder": "[FIGURE]" },
        { "key": "unit", "type": "string", "required": false, "example": "%", "placeholder": "" },
        { "key": "label", "type": "string", "required": true, "example": "CUSTOMER SATISFACTION", "placeholder": "[LABEL]" }
      ],
      "cssTokens": ["--card-surface", "--card-accent", "--card-ink"],
      "motionDefaults": {
        "entranceDuration": 0.35,
        "ease": "back.out(1.6)",
        "exitDuration": 0.32
      }
    }
  ]
}
```

**Manifest rules for agnosticism:**
- Every template entry sets `"brandAgnostic": true`. Any entry that must stay in the repo but is project-specific (e.g. a Claim Mate wordmark lockup) sets `"brandAgnostic": false` and is excluded from the default catalog query. Agents building a new project's videos start from `filter(brandAgnostic === true)`.
- `cssTokens` lists neutral token names (e.g. `--card-surface`, `--card-accent`), never brand-specific ones (`--card-claim-navy` is a violation).
- `props[].example` is a generic realistic value the renderer can use to generate a preview; `props[].placeholder` is the obviously-fake default shown in the template file itself. Keep these separate — examples belong in the manifest, placeholders in the HTML.

**Why this works for agents:** An agent reading `templates.json` can answer "what templates exist?", "what props does X take?", and "what file do I use?" in one pass without opening any HTML. The `preview` field points to a still frame extracted post-render — same artifact the frame-verification ritual already produces.

**Why not a separate parameterisation layer:** The `data-variable-values` JSON attribute already passes props to sub-comps cleanly. CSS custom properties already handle theming. Adding a third system (Handlebars preprocessing, slot injection, etc.) would fight HyperFrames' determinism constraint and create maintenance debt. The existing model is sufficient; the manifest just documents it.

### For CSS-only (inline) templates
Scene-beats and copy-paste scaffolds don't get `data-variable-values` — they're inlined. The manifest still lists them with `"type": "scene-beat"` and a `props` array documenting what to search-and-replace when adapting the template. The `file` field points to the scaffold HTML in `compositions/scenes/`.

### The animation-curator parallel
The SVG animation library at `assets/svg-animations/` uses exactly this model: `README.md` as the cold-read catalog, per-category folders, `index.html` as the visual gallery. The templates system should mirror this pattern but with a machine-readable `templates.json` in addition to the README (since templates have structured props that READMEs can't express uniformly).

---

## Motion and timing conventions for scene-beats

Cards already have their convention (0.30–0.42s entrance, 0.06–0.10s stagger, 0.32s exit). Scene-beats need one additional layer:

- **Scene entrance:** 0s–0.6s — background fades/scales in, no overlays yet
- **Overlay entrance:** 0.6s–1.0s — first card enters; subsequent cards stagger at 0.8–1.2s apart if multiple
- **Dwell:** 1.0s to (scene_duration - 1.2s) — hold, optional breathe-float on final card
- **Scene exit:** (scene_duration - 1.0s) to scene_duration — overlays exit in narrative direction; background fades or hard-cuts

**Beat-length recommendations** for a 25–30s promo: hook scene 2.5–3.5s; problem/stat scenes 3.5–5s; how-it-works scenes 1.8–2.5s per step; CTA end-card 4–6s. These keep the total under 30s across 6–8 scenes.

**"Card doesn't fight scene" rule:** a card's entrance eases (back.out, expo.out) should be faster than the scene's background entrance. Background gets 0.6–0.8s; card gets 0.30–0.42s. The card always wins the attention race once the background is settled.

---

## Build-out plan

### First batch — this week (P0, foundation + highest-leverage templates)

**Foundation (must land first — everything else depends on it):**
0. **Token split.** Create `design/tokens-base.css` with neutral defaults; extract current Claim Mate values into `design/tokens-claim-mate.css`; refactor `design/cards.css` to reference only tokens (no hardcoded hex/font values); update existing Claim Mate root compositions to import `tokens-base + tokens-claim-mate`. Visually verify no regression via diff of frame stills. ~2 hours.
0a. **Placeholder copy pass.** Strip Claim Mate-specific copy from every template file and its README example. Replace with neutral placeholders (`"Your headline here"`, `"[FIGURE]"`, `"example.com"`). ~30 min.
0b. **Brand extractor MVP.** Write `scripts/extract-brand.mjs` (Playwright-based) + wire as `npx hyperframes brand extract <url> --name <slug>`. MVP scope: palette extraction (4 core tokens) + font detection (Google Fonts match) + annotated CSS output + simple `brand-preview.html` renderer. Defer logo extraction and low-confidence flagging to batch 2. ~3–4 hours.

**Library content:**
1. `compositions/templates.json` manifest — create the schema with `brandAgnostic` flag, backfill the 4 existing cards + 6 overlays + 3 backgrounds. Mark any project-specific legacy overlays as `brandAgnostic: false`. 1–2 hours.
2. `compositions/cards/headline-card.html` and `wordmark-card.html` — two most common promo slots. Agnostic copy only. ~1 hour each.
3. `compositions/cards/split-card.html` — fills the last gap in the core card layouts. ~1.5 hours.
4. `compositions/scenes/` folder + `scene-hook.html` — extract the text-only bold-type hook pattern from v4 as an agnostic scaffold. ~1 hour.
5. `compositions/scenes/scene-stat-reveal.html` — extract v5's stat-reveal pattern as a scaffold, strip Claim Mate specifics. ~1 hour.
6. Preview stills for the 4 existing cards rendered with `tokens-base.css` only — proves agnostic acceptance test. Extract via existing render-and-frame ritual.

**Acceptance bar for "library-ready":** (a) lints clean (0 errors); (b) has a `templates.json` entry with `brandAgnostic: true`, props array, and css token list; (c) renders correctly with ONLY `tokens-base.css` loaded (no brand overlay) — this is the regression test; (d) has a preview still; (e) is documented in its category README with neutral example copy.

### Second batch — next sprint (P1)
- Brand extractor polish: logo extraction, confidence flagging, Vibrant.js fallback, multi-page sampling
- Root-composition scaffolder: `npx hyperframes brand apply <slug>` that rewrites the active composition's `<link>` tags
- `testimonial-card`, `stat-pair-card`, `price-card`, `review-card`
- `scene-how-it-works-3`, `scene-cta-end`
- `progress-bar`, `caption-subtitle`, `brand-mark-corner` overlays
- `bar-chart-card`, `donut-stat-card` (data-viz tier, only if a brief requires real numbers)

### Third batch — someday (P2/P3, on demand)
- `before-after-card`, `comparison-table-card`, `timeline-card`
- Scene-beats for product-demo, before-after, problem-solution
- Device/document frames (phone, browser, letter)
- Brand extractor v2: sample multiple pages to refine palette; detect design-system hints (Tailwind config, CSS variables published on `:root`) for high-confidence extraction; integrate with `/website-to-hyperframes` as a single pass

---

## The token architecture (foundation for every template)

This is the load-bearing structure that makes every other tier work. It ships first.

```
design/
├── tokens-base.css        # neutral defaults — the agnostic layer
├── tokens-claim-mate.css  # Claim Mate brand overlay
├── tokens-consent-mate.css  # Consent Mate brand overlay
├── cards.css              # structural CSS, reads only tokens
└── scenes.css             # scene-level structural CSS (new)
```

**`tokens-base.css`** defines every token the library reads, set to neutral, publishable defaults:

```css
:root {
  /* Palette — slate + white + a single accent that brands override */
  --card-ink:           #0a0a0a;           /* primary text on light */
  --card-ink-inverse:   #ffffff;           /* primary text on dark */
  --card-surface:       #ffffff;           /* light paper default */
  --card-surface-dark:  #0f1115;           /* dark glass default */
  --card-surface-scrim: rgba(15, 17, 21, 0.92);
  --card-accent:        #2563eb;           /* neutral blue — every brand overrides */
  --card-muted:         #6b7280;
  --card-rule:          rgba(10, 10, 10, 0.12);

  /* Type — system fonts until a brand overlay loads custom faces */
  --card-font-ui:       system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --card-font-mono:     ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --card-font-display:  Georgia, "Times New Roman", serif;

  /* Radius + padding + shadow + type-scale — inherited as-is from current cards.css */
  --card-r-sm: 14px; --card-r-md: 22px; --card-r-lg: 28px; --card-r-xl: 36px;
  /* ...etc... */
}
```

**`tokens-claim-mate.css`** loaded AFTER base overrides only the brand-specific values:

```css
:root {
  --card-accent:       #ffb84d;           /* amber */
  --card-surface-dark: #0d1826;           /* navy */
  --card-font-ui:      "Inter", system-ui, sans-serif;
  --card-font-display: "Instrument Serif", Georgia, serif;
}
```

Root compositions import in this order, and the brand layer is the ONLY line that changes between projects:

```html
<link rel="stylesheet" href="design/tokens-base.css" />
<link rel="stylesheet" href="design/tokens-claim-mate.css" />  <!-- swap for any project -->
<link rel="stylesheet" href="design/cards.css" />
<link rel="stylesheet" href="design/scenes.css" />
```

**A fresh project with no brand** simply omits the brand overlay line and gets a publishable neutral look driven by `tokens-base.css`. This is the acceptance test for every template: render it with `tokens-base.css` alone, nothing else. If it looks broken or brand-tinted, it fails review.

---

## Rapid brand onboarding — point at a URL, get a themed library

The token architecture is the foundation; what makes the library *fast* is a one-command extractor that turns any project website into a usable brand overlay. Target workflow:

```bash
npx hyperframes brand extract https://acme.com --name acme
# → design/tokens-acme.css     (palette + type overrides)
# → assets/logo/acme.svg       (largest-candidate logo or favicon)
# → assets/brand/acme-preview.html   (renders 6 sample templates with new tokens)
```

The first-run pipeline for a new project then becomes three commands:

```bash
npx hyperframes init my-promo
npx hyperframes brand extract https://client.com --name client
# edit root composition: <link href="design/tokens-client.css">
npx hyperframes preview
```

### What the extractor does (implementable as `scripts/extract-brand.mjs`)

Playwright is already in the dependency tree via `website-to-hyperframes`; we reuse it.

1. **Palette** — load URL, sample computed styles from meaningful nodes:
   - `body` background → `--card-surface`
   - `body` color → `--card-ink`
   - primary CTA (buttons matching common patterns: `.btn-primary`, `[class*="button"][class*="primary"]`, first large solid button in-viewport) background → `--card-accent`
   - `h1`/`h2` color and `color-contrast()` check against surface → resolves `--card-ink` vs `--card-ink-inverse`
   - darkest background in-viewport (header/footer) → `--card-surface-dark`
   - Fall back to [Vibrant.js](https://github.com/Vibrant-Colors/node-vibrant) palette extraction from og:image if DOM sampling returns low-contrast results.
2. **Typography** — read computed `font-family` on `body`, `h1`, `h2`, `p`. Match against Google Fonts/Adobe Fonts catalogue; if matched, emit `@import` in the overlay. If not matched (bespoke face), fall back to the nearest system stack and leave a `TODO:` comment naming the observed font so a designer can wire the licensed file.
3. **Logo** — try in order: SVG in `<header>` or with `aria-label` matching brand, `<img>` with largest area in header, `og:image` cropped, favicon. Save to `assets/logo/<slug>.svg` (or `.png` if SVG unavailable) and emit a `--brand-logo` URL token.
4. **Accent pair** — if only one brand colour is found, generate a complementary muted tone via HSL rotation for `--card-muted`.
5. **Preview render** — write a `brand-preview.html` composition that renders six library templates (headline, stat, quote, split, wordmark, testimonial) with the new tokens. The agent running the extraction can `open brand-preview.html` to eyeball the result in <10 seconds.
6. **Annotated output** — every value in the generated CSS carries a comment noting its source and confidence:

```css
:root {
  --card-accent:       #FF5A1F;  /* from .btn-primary background — high confidence */
  --card-surface-dark: #1A1D24;  /* from footer background — medium confidence */
  --card-ink:          #0A0A0A;  /* from body color — high confidence */
  --card-font-ui:      "Inter", system-ui, sans-serif;  /* matched Google Font */
  /* TODO: --card-font-display — observed "CircularXX" (bespoke); wire licensed file */
}
```

The output is hand-editable — extraction gives a first-pass guess, not a final brand sheet. Annotations let a designer or a subsequent agent pass judge each value and tune.

### Tradeoffs

- **Speed vs fidelity.** Extraction gets you 80% of a brand in 20 seconds; the last 20% (correct heading font licence, retina logo, exact pantone match) needs human or designer agent input. That's fine — the extractor's job is to un-block the video crew on day one, not to replace a brand designer.
- **Website quality varies.** A site built on a modern design system (Tailwind, Material, Chakra) extracts cleanly. A site with inline styles and image-rendered headings extracts poorly. The extractor should flag low-confidence results and print a "designer review recommended" line rather than silently produce broken tokens.
- **Privacy/scraping etiquette.** The extractor only pulls public CSS + public images from one URL at one time. No authenticated content, no API scraping, no caching of copyrighted imagery beyond what's needed for the preview.
- **It's an overlay, not a lock-in.** If extraction is wrong, the generated `tokens-<slug>.css` is a ~40-line file that a human can hand-edit in two minutes. No extraction run is destructive.

### Integration with existing skills

- `/website-to-hyperframes` currently captures a site for video content. Adding `--extract-tokens` as a by-product of the same Playwright session means one visit produces both the visual brief and the brand overlay.
- The producer agent gains a new first-session step: after receiving the brief, if a client URL exists, run `brand extract` and include the generated tokens in the project scaffold before dispatching the director.
- The colorist agent reads `tokens-<slug>.css` to motivate the per-scene grade (LUT/filter stack) so the stock footage matches the extracted palette.

---

## Consistency vs expressiveness

The card system already solves this correctly: **surface variants + content layouts are separate axes.** A strict library would bake "dark-glass stat card" as a single unit; ours lets you combine any surface with any layout. That's the right call — it gives agents combinatorial power without requiring a template for every combination.

The risk is in scene-beats: if we parameterise them too heavily (every background, every card position, every grade value as a prop), they stop being templates and become mini-editors. The right constraint is: scene-beat templates expose content props (text, image URL, stats) but lock layout, motion, and grade. Agents swap content; designers fork files.

---

## End-to-end: URL → video (how every piece composes)

The `/website-to-hyperframes` skill already implements a 7-step pipeline (capture → DESIGN.md → SCRIPT.md → STORYBOARD.md → VO → BUILD → VALIDATE). Today step 6 is hand-authored HTML. The template library + brand extractor turn it into template-driven assembly, cutting the build step from hours to a pass of the templates.json catalog.

### What the pipeline looks like with the library in place

```
User: "make a 25s promo from https://acme.com"
  │
  ▼
[ step 1 · capture ]  Playwright pulls DOM, screenshots, copy, colours, fonts, imagery
  │   (extends today's capture script with --extract-tokens)
  ▼
[ step 1b · NEW · brand extract ] → design/tokens-acme.css (annotated)
                                  → assets/logo/acme.svg (largest candidate)
                                  → assets/photos/capture/*.jpg (hero, product, team)
  │
  ▼
[ step 2 · DESIGN.md ]  Points at the generated token file; designer agent sanity-checks
  │                     and tweaks the overlay (2-min hand-edit pass)
  ▼
[ step 3 · SCRIPT.md ]  Screenwriter drafts narration from captured copy
  │                     (no invented facts — only reshapes what the site says)
  ▼
[ step 4 · STORYBOARD.md ]  Director agent picks a sequence of scene-beat slugs from
  │                         compositions/templates.json, one per narrative beat:
  │                             beat 1: scene-hook           (2.8s)
  │                             beat 2: scene-stat-reveal    (4.2s)
  │                             beat 3: scene-how-it-works-3 (7.5s)
  │                             beat 4: scene-testimonial    (4.0s)
  │                             beat 5: scene-cta-end        (5.0s)
  │                         Total: 23.5s — matches the 25s target
  ▼
[ step 5 · VO ]  Narrator generates audio + VTT word timings
  │              (unchanged from today — already works)
  ▼
[ step 6 · BUILD — the transformation ]
  │  Before library: html-composer wrote bespoke HTML per beat (~2h)
  │  With library: html-composer assembles by
  │     a) cloning the scene-beat scaffold from compositions/scenes/
  │     b) filling slots with captured copy + imagery
  │     c) root composition imports tokens-base + tokens-acme + cards + scenes
  │     d) scene durations snap to VTT word timings
  │  Time to first preview: ~10 min instead of ~2 hours
  ▼
[ step 7 · VALIDATE ]  npx hyperframes lint → 0 errors; render MP4
```

### What the library changes, concretely

| Today (pre-library) | With library |
|---|---|
| Each new project re-authors HTML cards from scratch | Pick card/scene slugs from `templates.json`, fill props |
| Brand colours hand-copied into each composition | `tokens-<brand>.css` overlay auto-generated + imported once |
| Scene structure reinvented per video | Scene-beat scaffolds standardise openings, stats, steps, CTAs |
| Media slots wired ad-hoc | Media-card family has typed `mediaSrc` props with asset-hunter integration |
| `/website-to-hyperframes` step 6 takes ~2h of custom work | Step 6 becomes catalog assembly + VTT timing pass |

### What stays unchanged

- The 7-step skill structure — the library slots into step 1b (brand extract) and step 6 (build), it doesn't replace the workflow.
- Screenwriter, cinematographer, editor, colorist, sound-designer creative roles — template selection still requires creative judgement; the library provides vocabulary, not direction.
- The no-invented-facts rule — captured site copy is the only allowed source for stats, quotes, and claims.
- HyperFrames determinism rules — templates are pure HTML/CSS/GSAP, no runtime magic added.

### What a user can expect to type, end-to-end

```bash
# one-liner for the well-trodden path
npx hyperframes from-url https://acme.com --duration 25s --format 9x16

# or the step-by-step for control
npx hyperframes init acme-promo
npx hyperframes brand extract https://acme.com --name acme
# ... then invoke the skill: "make me a 25s promo from the captured site"
npx hyperframes preview
npx hyperframes render
```

The `from-url` one-liner doesn't need to exist in batch 1 — it's a third-batch convenience wrapper. Batches 1–2 deliver the parts (extractor, library, manifest) that the existing `/website-to-hyperframes` skill will compose by reading this R&D doc.

### What we need to add to the skill itself (out of scope for first batch)

Once the library lands, the skill's `step-6-build.md` reference doc should be rewritten to instruct the html-composer agent to:

1. Read `compositions/templates.json` before authoring any HTML
2. For each storyboard beat, match to a scene-beat slug by `type` + `categories`
3. Fill props from captured copy; never invent content
4. Fall back to custom HTML only if no template fits — and flag that as a candidate for the next library batch

That rewrite is a 1-session follow-up after batch 1 ships. Track it in LEARNINGS.md under the template library entry.

---

## Risks + open questions

1. **Sub-comp collision remains a hard limit.** The LEARNINGS.md §4 pitfall (multi-instance sub-comps share `window.__timelines[id]`) means any scene-beat template that appears more than once in a composition MUST be inlined. Templates.json should flag this with `"multiInstance": false` on sub-comp templates.
2. **Preview generation is manual right now.** We extract frames post-render, which means previews are only accurate if someone actually rendered the template. A future `scripts/render-preview.mjs` that renders each template in isolation and saves the still would automate this, but it's not in scope for the first batch.
3. **Template drift when HyperFrames upgrades.** More templates = more surface area for breakage on CLI updates. The mitigation is keeping templates thin (they import `design/cards.css` and GSAP from CDN; they don't bundle their own framework copy). The `npx hyperframes lint` command already validates every HTML file — running it across all compositions/ after an upgrade is the regression check.
4. **Data-viz templates require real data.** The no-invented-facts rule means data-viz cards can't ship with placeholder numbers without a clear signal that they're placeholders. Use `"[FIGURE]"` style placeholder strings, not realistic-looking numbers, in template defaults.
5. **Duration is variable for scene-beats.** Cards have no inherent duration; scene-beats do. The `templates.json` `duration` field should be a recommended range (`"duration": "3.5-5"`) not a fixed value, since VTT timing will always override it anyway.
6. **Agnosticism creep — branded content leaking into the library.** Without a lint rule, someone will eventually commit a hex code or Claim Mate wordmark into a shared template. Mitigation: add a custom `lint` check (post-MVP) that greps every file in `compositions/` for hex literals and known brand strings; fail CI. Until then, the `brandAgnostic: true` flag in the manifest is the honour-system contract.
7. **Brand extractor confidence.** A poorly-built site (image-rendered headings, inline styles, no design system) produces low-quality tokens. The extractor must flag this clearly, not produce a confident-looking but wrong file. Acceptance: extraction on five diverse sites (SaaS landing, news site, e-commerce, portfolio, government) produces either a usable overlay or an explicit "needs designer review" flag — never silent garbage.
8. **Font licensing.** The extractor detects Google Fonts / Adobe Fonts matches and can auto-wire `@import` for the former, but licensed bespoke faces (CircularXX, Söhne, Graphik) require manual wiring. The generated CSS must annotate these, not silently substitute a system fallback.

---

## Recommended next step

**One focused session, in strict order — don't skip foundation:**

1. **Split `design/cards.css` into `tokens-base.css` + `tokens-claim-mate.css`** and refactor `cards.css` to reference tokens only. Verify no visual regression on existing Claim Mate compositions. This unblocks every agnostic guarantee downstream. (~2h)
2. **Strip Claim Mate copy from the 4 existing card sub-comps and their README examples.** Replace with neutral placeholders. (~30min)
3. **Ship `scripts/extract-brand.mjs` MVP** — Playwright palette + font extraction, annotated CSS output, quick `brand-preview.html`. Test by running `npx hyperframes brand extract https://claim-mate.co.nz --name claim-mate-extracted` and diffing against the hand-authored `tokens-claim-mate.css`. If the extractor reproduces ~80% of the real brand sheet, the tool is working. (~3–4h)
4. **Create `compositions/templates.json`** (backfill the 13 existing items with `brandAgnostic` flags) and ship `headline-card.html` + `wordmark-card.html` with neutral defaults.

**Why in this order:** every template shipped before step 1 would need a re-audit after the token split. Every template shipped before step 3 would be un-testable for agnosticism. Foundation first, content second. Total scope: one solid session (~8h), produces an entire brand-aware library backbone, not just more cards.

---

## Sources

- [shadcn registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json)
- [Remotion starter templates](https://www.remotion.dev/templates/)
- [MJML component documentation](https://documentation.mjml.io)
- [MOGRT guide — After Effects Essential Graphics panel](https://helpx.adobe.com/after-effects/using/creating-motion-graphics-templates.html)
- [Frame.io MOGRT workflow guide](https://blog.frame.io/2024/08/12/mogrt-guide-after-effects-2024-motion-graphics-workflow/)
