> **ARCHIVED — external-tool integration not part of the current pipeline.**
> Archived 2026-04-28. Restore from `docs/_archive/` if Claude Design integration is reactivated.

---

# === COPY EVERYTHING BELOW THIS LINE INTO CLAUDE DESIGN AS YOUR FIRST MESSAGE ===

You're designing for **aivideomaker** — a HyperFrames Website-to-Video pipeline. Output is **vertical mobile video**, 1080×1920 (TikTok/Reels native). Claude Code wires GSAP motion AFTER your handoff. You design VISUAL STATES + describe motion intent in prose; never write motion code.

This message contains the FULL design system context — read all sections, then design the brief at the bottom.

---

## SECTION 1 — THE CONTRACT (read first; every output must obey this)

# Playbook — Authoring Cards with Claude Design

Claude Design (Anthropic Labs, preview as of 2026-04-17) generates live HTML/CSS, reads our codebase to build a project-specific design system, and offers visual sliders for iteration. **We use it for one thing: authoring new card patterns for the Website-to-Video library.** All other steps (HyperFrames wiring, GSAP timing, audio, render) stay in Claude Code.

This playbook is the bridge: how to brief Claude Design, what to expect back, how to land its output in our composition.

---

## Workflow at a glance

```
1. Pick a card we need (from wishlist below or new ask)
2. Open Claude Design in claude.ai
3. Connect the aivideomaker repo (so Claude Design ingests cards.css + tokens + cards-library.md)
4. Send the "Card Brief" (template below) — describes the card's purpose, brand, constraints
5. Iterate visually with Claude Design's sliders (spacing, colour, layout) until happy
6. Export as HTML and get the handoff bundle
7. Send the bundle to Claude Code (this session) with one instruction:
   "Add this card to the library and apply it to <scene> of the Kindred render"
8. Claude Code (here) wraps it with class="clip" + data-* attrs, wires entrance GSAP,
   adds it to cards-library.md, lints, renders, frame-verifies
```

---

## The hard contract — every card must obey

Every card produced via Claude Design must drop into ANY brand's render — Kindred today, a luxury fashion brand tomorrow, a kinetic-pop creator tool the day after. That means **brand-agnostic by construction**. The contract:

### Token-only CSS — zero hardcoded brand values

| Domain | ALLOWED | BANNED |
|---|---|---|
| Colours | `var(--card-navy)`, `var(--card-paper)`, `var(--card-accent)`, `var(--card-slate)`, `var(--card-paper-soft)`, `var(--card-warn)`, `var(--card-ok)` | `#1B2A3D`, `#1A9E8F`, any literal hex / rgb |
| Fonts | `var(--card-font-display)`, `var(--card-font-ui)`, `var(--card-font-mono)` | `Fraunces`, `Nunito`, `JetBrains Mono`, any direct family name |
| Radii | `var(--card-r-sm)`, `var(--card-r-md)`, `var(--card-r-lg)` | numeric `12px`, `28px` etc. as primary radii (one-off shape decoration OK) |
| Surface variants | `.card--dark-glass`, `.card--brand-navy`, `.card--light-paper`, `.card--ghost` (defined in cards.css; tokens-overlay re-skins them) | New variant classes per brand |
| Decorative numbers | `4px`, `8px`, `120px` for spacing/sizing (these don't change per brand) | Numeric VALUES that mean "the brand color" or "the brand radius" |

If Claude Design hardcodes ANY brand value, the card is broken — won't adapt when we swap to the next brand's tokens. Reject and re-iterate.

### Light-bg AND dark-bg variants

Every card must work on both light scenes (cream / paper canvas) and dark scenes (brand-color / navy canvas). Use the same `[data-scene-mode="light|dark"]` pattern as the brand-header:

```css
.my-card { color: var(--card-navy); }                                /* default = light bg */
.my-card[data-mode="dark"] { color: var(--card-paper); }            /* swap on dark scenes */
```

GSAP toggles the `data-mode` based on parent scene's `data-scene-mode`. Already wired generically in `index.html`; new cards inherit automatically.

---

## The Card Brief — what to send Claude Design

```
PROJECT: aivideomaker — HyperFrames Website-to-Video pipeline
DESIGN SYSTEM SOURCE: design/cards.css + design/tokens-<brand>.css
PRIOR ART: docs/playbooks/cards-library.md
CONTRACT: docs/playbooks/claude-design-card-workflow.md ("hard contract" section)

CARD I NEED:
- Purpose: ___________  (e.g. "show a single quote/testimonial as a hero scene")
- Beat in video: ___   (e.g. "Scene 3, full-frame, 8 seconds" — fills 1080x1920 vertical)
- Sample content: ___  (placeholder copy; the brand's verbatim copy slots in later)
- Required behaviour: ___ (e.g. "must adapt to any brand via tokens; works on both
  light and dark scene backgrounds; no fixed pixel positions")

CONSTRAINTS (READ THE CONTRACT — non-negotiable):

== FRAME ==
- Fixed 1080×1920 portrait (9:16 vertical mobile video — TikTok/Reels/Shorts native)
- This is NOT a responsive web page. NO @media queries. NO breakpoints. NO viewport units (vh/vw).
- Card must fit inside .scene-content padding (sides ~90-160px, top reserves 200px for the
  persistent brand header)
- Effective content area: ~860×1500 with header reserved

== TYPE SCALE — video readability, not web readability ==
The viewer is watching this on a phone, hand-held, in motion, often in a public space, often
muted, sometimes scrolling. Text must read at-a-glance from arm's length. Web body sizes
(16-22px) are invisible at this scale. Use:
- Hero / display headline: 100-200px (Fraunces serif typically)
- Sub-headline: 60-100px
- Body / readable supporting text: 32-48px (NEVER below 28px)
- Micro / kicker / metadata: 22-32px ALL CAPS with letter-spacing (NEVER below 22px)
- NOTHING smaller than 22px. If a card needs smaller text, the card is wrong — restructure.

== LAYOUT POSTURE ==
- Vertical-first composition — content stacks top-to-bottom with breathing room. Avoid
  side-by-side layouts that waste the column's height.
- Anchor visual focus around 50-60% down the frame (mobile thumb-zone, viewer's eye line)
- Generous whitespace — vertical mobile frames feel cramped fast; default to lots of air

== TOKENS ==
- Use ONLY var(--card-*) tokens for colours/fonts/radii. No literal hex/rgb. No font names.
- No external dependencies (no React, no Tailwind, no JS frameworks, no font @import — fonts
  are already imported globally via tokens-<brand>.css)
- Light-bg + dark-bg variants via [data-mode="dark"]

== BANNED BEHAVIOURS ==
- No motion code — Claude Code owns animation. NO @keyframes, NO `animation:` declarations,
  NO `transition:` declarations, NO framer-motion / Web Animation API / GSAP code in your
  output. The motion runtime is GSAP within HyperFrames; you do not author it.
- No data-* attributes — Claude Code adds class="clip" / data-start / data-duration
- No :hover / :focus / :active states (video can't hover; viewer can't interact)
- No interactive form elements (input, button hover states, etc.)
- No copy that wasn't approved — use placeholder text only
- No images Claude Design generates from scratch (we provide brand imagery)

== WHAT YOU SHOULD PROVIDE FOR ANIMATED CARDS ==
For cards where motion matters (most of them), provide:

1. **Visual states** — design the card in each meaningful state as separate class variants:
   `.my-card` (default / waiting), `.my-card.is-active` (highlighted), etc.
   Use the `is-active`, `is-exited`, `is-pending` BEM-modifier convention. The states are
   STATIC CSS — Claude Code GSAP-tweens between them via `tl.set(el, { className: ... })`
   or by tweening individual properties.

2. **Motion intent — written in plain English** at the bottom of the bundle:
   ```
   ENTRANCE: "Each list item slides up 36px and fades in. Stagger by 0.12s.
              Ease: back.out(1.4). Total run 0.55s + (n-1)*0.12s."
   ACTIVE STATE: "When highlighted, color shifts to var(--card-navy) and scale
                  bumps to 1.04. CSS transition handles the smooth swap; GSAP
                  triggers via class toggle at narration boundary."
   EXIT (final scene only): "..."
   ```

3. **Timing dependency notes** — flag if motion should sync with audio boundaries
   ("entrance cue per VTT word-time", "exit on music kick", etc.). Claude Code reads
   the VTT and lands the timing.

This is the right split: visual designers in real production hand motion designers a
comp + a vibe document, NOT a keyframe spec. Same here.

WHAT TO RETURN:
1. HTML block — semantic markup, BEM-style class names (.cardname / .cardname__element)
2. CSS block — scoped styles using only token vars; both light + dark variants
3. Animation note (one line) — recommended GSAP entrance pattern
4. "Most resembles: [card name from cards-library.md]" or "new pattern"
5. Token usage report — which tokens it used, which it would NEED if extended
```

---

## What lands back here

The handoff bundle should give us:

1. **The HTML** — semantic, no `data-*` attributes, no inline scripts
2. **The CSS** — uses `var(--card-*)` tokens, no hardcoded colours, no `@import`s for fonts (the brand-overlay file already imports them)
3. **An entrance-animation note** — Claude Code interprets and writes the GSAP

Claude Code's job after handoff:
1. Wrap the HTML in `<div class="clip" data-start="X" data-duration="Y" data-track-index="N">` (or as a child of a scene clip if it's an in-scene element)
2. Add the CSS to `index.html` `<style>` block (or promote to `design/cards.css` if it's reusable across brands)
3. Write the GSAP entrance per the animation note
4. Lint, render, frame-verify
5. Append to [cards-library.md](cards-library.md) as a new documented card with the standard sections (markup, CSS, GSAP, tokens, constraints)

---

## Why we're using Claude Design — what Claude Code (here) is genuinely weak at

Honest assessment of where the rendering loop in Claude Code produces serviceable-but-generic output, vs. where Claude Design's visual-iteration UX earns its keep:

| Card category | Claude Code (me) | Claude Design |
|---|---|---|
| Layout-grid cards (rows, columns, stacks) | ✅ Fine | Equivalent |
| Token-driven colour variants | ✅ Fine | Equivalent |
| Lucide-style line icons | ✅ Fine | Equivalent |
| Typography hierarchy | ✅ Fine | Equivalent |
| Magazine-style editorial layouts (multi-column with image breakouts, drop caps, side captions) | ❌ Weak | **Strong** |
| Multi-layered compositions (overlapping shapes, masks, gradients, reflections, paper-tape edges) | ❌ Weak | **Strong** |
| Custom illustrative SVG (badges with circular text path, hand-drawn flourishes, sketch marks, scribble underlines) | ❌ Weak | **Strong** |
| Art-directed data viz (bar charts / line graphs that look designed not auto-generated) | ❌ Weak | **Strong** |
| Photo-collage cards (stacked polaroids, diagonal cuts, paper-collage aesthetic) | ❌ Weak | **Strong** |
| 3D-perspective device mockups (laptop opening, phone-in-hand angle, tablet-on-desk) | ❌ Weak | **Strong** |
| Custom shape callouts (speech bubbles with tails, banner ribbons, badge stickers, dialogue boxes) | ❌ Weak | **Strong** |
| Layered depth backgrounds (organic blobs, dot patterns, abstract geometry behind text) | ❌ Weak | **Strong** |
| Fancy text effects (text with image fill, kinetic typography arrangements, multi-axis variable font) | ❌ Weak | **Strong** |

Claude Design earns its keep on the bottom rows — where visual intuition matters more than pattern application. Don't ask it to do the top rows; that's the same Generic Card I'd produce here.

---

## Complex-card categories to target with Claude Design

Each entry is a *category* — Claude Design generates the brand-agnostic pattern, Claude Code wires it. Once authored once, the pattern serves any future brand.

### Editorial / Layout

1. **Magazine pull-quote** — drop cap, side-caption, pull-quote with large serif quotation glyph; multi-column or asymmetric grid. Best for long-narrative scenes, manifestos, founder stories.
2. **Index card / catalogue page** — typewriter-style index entry with classification number, taxonomy, line-rule separators; library-card aesthetic. For brands selling craft / curation / archives.

### Visual Composition

3. **Polaroid stack** — 3-4 photos in a stacked-paper aesthetic with rotation, paper-tape edges, drop shadows. Each photo is a slot the brand fills with their imagery. Photo / lifestyle / travel brands.
4. **Diagonal split / asymmetric frame** — split-frame layout with diagonal cut between two photos or two states. Before/after, with/without, problem/solution. Transformation brands.
5. **Layered depth card** — multiple shapes (rectangles offset, dot grids, organic blobs) stacked behind text for depth without literal photography. Tech / SaaS / fintech.

### Custom Illustration

6. **Circular badge / seal** — circular layout with text on a curved path, central icon, embossed look, stamp aesthetic. "Est. 2019", "Free for life", "Made in NZ", "100% real". Heritage / craft / community brands.
7. **Banner ribbon** — old-school banner with folded-corner geometry. For sale / featured / new flag overlays.
8. **Sketch-mark callout** — hand-drawn circle / underline / arrow pointing at an element. Adds informal warmth. Lifestyle / community / education brands.
9. **Speech-bubble chat** — messaging-app conversation with realistic chat bubbles, timestamps, typing indicator. Community / messaging brands like Kindred.

### Data Visualization

10. **Stat hero** — one giant number (`100%`, `1000+`) with optional count-up animation, supporting label, contextual line / arc / bar that gives it visual weight. NOT a chart, an art-directed stat.
11. **Designed bar chart** — actual bar chart but art-directed (bars with rounded tops, organic colors, hand-tooled labels). For brands that have data and need it to feel human.
12. **Donut / radial progress** — circular progress with a number in centre. Pricing tiers, completion states, progress indicators.

### Device / Product

13. **Phone-in-hand mockup** — phone held at a slight angle with brand's app screenshot. More dynamic than the flat phone-frame I currently produce.
14. **Browser-frame card** — chrome browser window with brand's website screenshot. For SaaS / web-product brands.
15. **Multi-screen carousel** — 2-3 phone screens in a row showing different app states. App showcases.

### Typographic

16. **Text-with-image fill** — bold display word with photography filling the letterforms. Hero typographic moments.
17. **Kinetic stack** — single word stacked vertically letter-by-letter, deliberately broken layout. For impact moments.
18. **Variable-font axis sweep** — single word that morphs across a variable-font axis (weight 100→900, opsz 9→144). Type-driven brands.

### Pricing / Commerce

19. **Pricing card** — single-tier with price, line items with check icons, CTA pill. For products with explicit pricing.
20. **Comparison table** — two or three plans side-by-side with checkmarks. SaaS / subscription brands.

---

## Where each category fits in the stack system

| Category | Warm Community | Kinetic Pop | Documentary | Quiet Premium |
|---|:-:|:-:|:-:|:-:|
| Magazine pull-quote | ✅ | | ✅ | ✅ |
| Index card / catalogue | | | ✅ | ✅ |
| Polaroid stack | ✅ | | | |
| Diagonal split | | ✅ | ✅ | |
| Layered depth | | ✅ | | ✅ |
| Circular badge / seal | ✅ | | ✅ | ✅ |
| Banner ribbon | ✅ | ✅ | | |
| Sketch-mark callout | ✅ | ✅ | | |
| Speech-bubble chat | ✅ | ✅ | | |
| Stat hero | ✅ | ✅ | ✅ | ✅ |
| Designed bar chart | | | ✅ | |
| Donut / radial | | ✅ | ✅ | |
| Phone-in-hand mockup | ✅ | ✅ | | ✅ |
| Browser-frame card | | ✅ | ✅ | |
| Multi-screen carousel | | ✅ | | |
| Text-with-image fill | | ✅ | | ✅ |
| Kinetic stack | | ✅ | | |
| Variable-font axis | | ✅ | | ✅ |
| Pricing card | | ✅ | ✅ | |
| Comparison table | | | ✅ | |

Use the matrix to prioritize — cards that work across multiple stacks are higher leverage.

---

## What NOT to ask Claude Design to do

- **Don't ask for animations** — it doesn't know HyperFrames timing rules (no `repeat: -1`, must be deterministic, framework-managed clip visibility). GSAP is Claude Code's job.
- **Don't ask for HyperFrames `data-*` attributes** — same reason. Wrong abstraction layer.
- **Don't ask for video, audio, or interactive elements** — Claude Design might generate these, but they won't fit our render pipeline cleanly.
- **Don't ask it to invent stats, copy, or brand facts** — verbatim copy from the brand site is mandatory (see [copy-and-script.md](copy-and-script.md) hard rule). Claude Design might fabricate; review every line of copy it returns.

---

## Quality check on Claude Design output

Before merging the bundle into a render, sanity-check:

- [ ] CSS uses `var(--card-*)` tokens — no `#hex` literals
- [ ] Fonts referenced are `var(--card-font-display | --card-font-ui | --card-font-mono)` — no direct font-family names
- [ ] No `position: fixed`, no `100vh` / `100vw` (we work in 1080×1920 absolute)
- [ ] No `background-image` URLs we don't have on disk
- [ ] No copy that wasn't approved (Claude Design might hallucinate stats / quotes / dates)
- [ ] Class names follow our pattern: `<scene-or-card-id>__<element>` (e.g. `.s4-headline__quote` not `.headline-quote-text`)

If any check fails, tell Claude Design what to fix and re-iterate. Don't bring broken patterns into the library.

---

## When Claude Design is in preview

Right now (2026-04-25) it's research preview, paid tier required, behind admin enable for orgs. If access fails: fall back to authoring cards directly here in Claude Code. The pipeline doesn't depend on Claude Design — it's a productivity boost, not a critical path.

---

## SECTION 2 — design/cards.css (agnostic structural design system)

```css
/* =========================================================================
   CARDS — Design System
   =========================================================================
   Drop-in CSS for HyperFrames compositions. Works standalone (inline in a
   root composition) or inside sub-composition components.

   USAGE:
     <div class="card card--dark-glass card--radius-lg card--pad-luxe">
       <div class="card__kicker">STEP</div>
       <div class="card__title">Upload your letter</div>
       <div class="card__body">Takes about 30 seconds.</div>
     </div>

   PHILOSOPHY:
     - Tokens first — radius, padding, colour, shadow are variables.
     - Variants combine: pick one surface + one radius + one padding.
     - Content slots (kicker, title, body, figure, label) have a typography
       scale that scales together — don't override individually unless you
       mean it.
     - Every card has a `card` base class; variants layer on top.

   CANVAS ASSUMPTION:
     1080 × 1920 vertical. Numbers below are tuned for that. For landscape
     or square, scale tokens via CSS custom properties.
   ========================================================================= */


/* ---------- Design tokens --------------------------------------------- */

:root {
  /* Brand palette (Claim Mate-derived; override per project) */
  --card-navy:       #0d1826;
  --card-navy-deep:  #08111c;
  --card-slate:      #1f3a68;
  --card-slate-ink:  #4b5a6d;
  --card-paper:      #eef1f5;
  --card-paper-soft: #d7dce3;
  --card-accent:     #7aa0d4;
  --card-warn:       #d85656;
  --card-ok:         #3a9a6a;

  /* Radius scale */
  --card-r-sm: 14px;
  --card-r-md: 22px;
  --card-r-lg: 28px;
  --card-r-xl: 36px;

  /* Padding scale (tight / standard / luxe) */
  --card-p-tight-y: 28px;
  --card-p-tight-x: 40px;
  --card-p-std-y:   48px;
  --card-p-std-x:   68px;
  --card-p-luxe-y:  72px;
  --card-p-luxe-x:  96px;

  /* Shadows */
  --card-sh-sm:    0 12px 40px rgba(0, 0, 0, 0.35);
  --card-sh-md:    0 24px 80px rgba(0, 0, 0, 0.50);
  --card-sh-float: 0 36px 110px rgba(0, 0, 0, 0.55);

  /* Borders */
  --card-border-light: 1.5px solid rgba(238, 241, 245, 0.22);
  --card-border-dark:  1.5px solid rgba(13, 24, 38, 0.12);

  /* Typography scale (card contents) */
  --card-kicker-size:   26px;
  --card-kicker-track:  0.32em;
  --card-title-size:    54px;
  --card-title-line:    1.14;
  --card-body-size:     30px;
  --card-body-line:     1.4;
  --card-figure-size:   260px;
  --card-figure-unit:   130px;  /* currency / unit mark adjacent to figure */
  --card-label-size:    36px;
  --card-label-track:   0.22em;

  /* Font stack */
  --card-font-ui:       "Inter", system-ui, sans-serif;
  --card-font-mono:     "JetBrains Mono", ui-monospace, monospace;
  --card-font-display:  "Instrument Serif", Georgia, serif;
}


/* ---------- Base card ------------------------------------------------- */

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 22px;
  box-sizing: border-box;
  will-change: transform, opacity;
  font-family: var(--card-font-ui);
  color: var(--card-paper);
}

.card__kicker {
  font-family: var(--card-font-mono);
  font-weight: 500;
  font-size: var(--card-kicker-size);
  letter-spacing: var(--card-kicker-track);
  color: var(--card-accent);
  text-transform: uppercase;
}

.card__title {
  font-family: var(--card-font-ui);
  font-weight: 600;
  font-size: var(--card-title-size);
  letter-spacing: -0.015em;
  line-height: var(--card-title-line);
  color: inherit;
}

.card__body {
  font-family: var(--card-font-ui);
  font-weight: 400;
  font-size: var(--card-body-size);
  line-height: var(--card-body-line);
  color: inherit;
  opacity: 0.88;
}

.card__figure {
  font-family: var(--card-font-ui);
  font-weight: 800;
  font-size: var(--card-figure-size);
  line-height: 1;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.card__figure-unit {
  font-size: var(--card-figure-unit);
  line-height: 1.1;
  padding-top: 26px;
  color: var(--card-slate);
  font-weight: 700;
}

.card__label {
  font-family: var(--card-font-mono);
  font-weight: 500;
  font-size: var(--card-label-size);
  letter-spacing: var(--card-label-track);
  text-transform: uppercase;
  color: var(--card-slate-ink);
  text-align: center;
}

.card__rule {
  width: 160px;
  height: 4px;
  background: var(--card-slate);
  align-self: center;
  transform-origin: center;
}

/* Content slots that contain text that must read over image. */
.card__overline {
  position: relative;
  z-index: 2;
}


/* ---------- Radius variants ------------------------------------------- */

.card--radius-sm { border-radius: var(--card-r-sm); }
.card--radius-md { border-radius: var(--card-r-md); }
.card--radius-lg { border-radius: var(--card-r-lg); }
.card--radius-xl { border-radius: var(--card-r-xl); }


/* ---------- Padding variants ------------------------------------------ */

.card--pad-tight { padding: var(--card-p-tight-y) var(--card-p-tight-x); }
.card--pad-std   { padding: var(--card-p-std-y)   var(--card-p-std-x);   }
.card--pad-luxe  { padding: var(--card-p-luxe-y)  var(--card-p-luxe-x);  }


/* ---------- Surface variants (background + border + text colour) ------ */

/* Dark glass — backdrop-blur over photos. Default overlay for dark scenes. */
.card--dark-glass {
  background: rgba(13, 24, 38, 0.92);
  backdrop-filter: blur(12px);
  border: var(--card-border-light);
  box-shadow: var(--card-sh-md);
  color: var(--card-paper);
}
.card--dark-glass .card__label { color: rgba(238, 241, 245, 0.75); }

/* Light paper — clean CMS-style card. Pairs with dark backgrounds as punchline. */
.card--light-paper {
  background: rgba(238, 241, 245, 0.96);
  border: var(--card-border-dark);
  box-shadow: var(--card-sh-float);
  color: var(--card-navy);
}
.card--light-paper .card__kicker { color: var(--card-slate); }
.card--light-paper .card__label  { color: var(--card-slate-ink); }
.card--light-paper .card__figure-unit { color: var(--card-slate); }

/* Brand navy — solid brand block. */
.card--brand-navy {
  background: var(--card-navy);
  border: 1.5px solid rgba(122, 160, 212, 0.32);
  box-shadow: var(--card-sh-md);
  color: var(--card-paper);
}

/* Ghost — transparent with subtle border. For minimalist overlays. */
.card--ghost {
  background: rgba(13, 24, 38, 0.28);
  backdrop-filter: blur(6px);
  border: 2px solid rgba(238, 241, 245, 0.32);
  color: var(--card-paper);
}

/* Image underlay — card has an image filling its bounds behind the content. */
.card--image-underlay {
  overflow: hidden;
  color: var(--card-paper);
  border: var(--card-border-light);
  box-shadow: var(--card-sh-float);
}
.card--image-underlay .card__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
  filter: grayscale(0.3) contrast(1.05) brightness(0.82);
}
.card--image-underlay .card__bg-scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(13, 24, 38, 0.15) 0%, rgba(13, 24, 38, 0.78) 100%);
}
.card--image-underlay > *:not(.card__bg):not(.card__bg-scrim) {
  position: relative;
  z-index: 2;
}


/* ---------- Alignment variants ---------------------------------------- */

.card--align-center { align-items: center; text-align: center; }
.card--align-left   { align-items: flex-start; text-align: left; }


/* ---------- Size variants --------------------------------------------- */

/* Width presets for vertical canvas. Use one or let content size naturally. */
.card--w-narrow { width: 680px; }
.card--w-medium { width: 820px; }
.card--w-wide   { width: 920px; }
.card--w-full   { width: calc(100% - 120px); }  /* 60px margin each side */


/* ---------- Compound card layouts ------------------------------------- */

/* STAT — one big number + tiny label. Punchline cards. */
.card--stat {
  align-items: center;
  text-align: center;
  gap: 26px;
}
.card--stat .card__figure {
  color: var(--card-navy);
}

/* QUOTE — pull quote with attribution. */
.card--quote {
  gap: 32px;
}
.card--quote .card__quote-mark {
  font-family: var(--card-font-display);
  font-weight: 400;
  font-style: italic;
  font-size: 180px;
  line-height: 0.6;
  color: var(--card-accent);
  opacity: 0.45;
  align-self: flex-start;
}
.card--quote .card__quote-text {
  font-family: var(--card-font-display);
  font-weight: 400;
  font-style: italic;
  font-size: 58px;
  line-height: 1.25;
  color: inherit;
  letter-spacing: -0.01em;
}
.card--quote .card__quote-by {
  font-family: var(--card-font-mono);
  font-size: 24px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--card-accent);
}

/* FEATURE-ROW — icon slot + title + body. Replaces step-badge. */
.card--feature-row {
  flex-direction: row;
  align-items: center;
  gap: 40px;
}
.card--feature-row .card__icon {
  flex: 0 0 auto;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card--feature-row .card__icon img,
.card--feature-row .card__icon svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.card--feature-row .card__text-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* STEP — numbered step (01, 02 etc.) with label. */
.card--step {
  flex-direction: row;
  align-items: center;
  gap: 40px;
}
.card--step .card__step-num {
  font-family: var(--card-font-mono);
  font-weight: 700;
  font-size: 150px;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: inherit;
  flex: 0 0 auto;
}

/* HEADLINE — kicker + big title + optional body. */
.card--headline .card__title {
  font-size: 88px;
  line-height: 1.08;
  letter-spacing: -0.02em;
  font-weight: 700;
}

/* WORDMARK — brand lockup as card content. */
.card--wordmark .card__mark {
  font-family: var(--card-font-mono);
  font-weight: 700;
  font-size: 190px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--card-paper);
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
}
.card--wordmark .card__mark-slash {
  color: var(--card-accent);
  margin: 0 4px;
}
.card--wordmark .card__url {
  font-family: var(--card-font-mono);
  font-weight: 500;
  font-size: 50px;
  color: var(--card-paper);
  letter-spacing: 0.06em;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.55);
}
.card--wordmark .card__fine {
  font-family: var(--card-font-ui);
  font-style: italic;
  font-size: 30px;
  color: var(--card-paper-soft);
  line-height: 1.4;
  max-width: 780px;
  text-align: center;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
}


/* ---------- Mark (persistent corner element) ------------------------- */

.card-mark {
  position: absolute;
  z-index: 1200;
  display: flex;
  align-items: center;
  padding: 14px 24px;
  background: rgba(13, 24, 38, 0.55);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(238, 241, 245, 0.20);
  border-radius: var(--card-r-sm);
  font-family: var(--card-font-mono);
  font-weight: 700;
  font-size: 64px;
  line-height: 1;
  letter-spacing: -0.015em;
  color: var(--card-paper);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  will-change: opacity, transform;
}
.card-mark--top-right    { top: 56px;  right: 60px; }
.card-mark--top-left     { top: 56px;  left: 60px; }
.card-mark--bottom-right { bottom: 56px; right: 60px; }
.card-mark--bottom-left  { bottom: 56px; left: 60px; }
```

---

## SECTION 3 — design/tokens-kindred.css (current brand overlay — Kindred / kindred-nz.org)

```css
/* =========================================================================
   TOKENS — KINDRED (extracted from kindred-nz.org)
   =========================================================================
   Brand overlay for the agnostic card system. Loaded AFTER design/cards.css
   in any composition that wants the Kindred look. Overrides only the
   brand-specific tokens; structural tokens (radii, padding, type sizes,
   shadows) inherit from cards.css :root defaults.

   To re-skin to a different brand, write a new tokens-<brand>.css and load
   it instead. No changes needed to cards.css or any card markup.
   ========================================================================= */

@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap");

:root {
  /* Palette — pulled directly from kindred-nz.org CSS custom properties. */
  --card-navy:        #1B2A3D;   /* their --ink — primary text on cream */
  --card-navy-deep:   #0F1621;   /* their darker ink */
  --card-slate:       #14806F;   /* their --teal-deep */
  --card-slate-ink:   #5A6677;   /* their --ink-60 */
  --card-paper:       #FBF9F6;   /* their --cream — canvas */
  --card-paper-soft:  #F5EFE6;   /* their --cream-warm */
  --card-accent:      #1A9E8F;   /* their --teal — primary brand */
  --card-warn:        #E98B6A;   /* their --coral */
  --card-ok:          #14806F;   /* their --teal-deep */

  /* Type — Kindred uses Fraunces (display), Nunito (body), JetBrains Mono. */
  --card-font-ui:       "Nunito", system-ui, -apple-system, sans-serif;
  --card-font-mono:     "JetBrains Mono", ui-monospace, "SF Mono", monospace;
  --card-font-display:  "Fraunces", Georgia, "Times New Roman", serif;

  /* Type — slightly soften the heavy display weight to feel like the site. */
  --card-title-size:   54px;
  --card-kicker-size:  24px;
  --card-kicker-track: 0.18em;   /* tighter than default — Nunito doesn't need 0.32em */
  --card-body-size:    32px;
  --card-body-line:    1.45;
  --card-label-size:   30px;
  --card-label-track:  0.16em;
}

/* Surface re-skins — Kindred is a light brand, so flip the dark/light
   defaults at the surface level. Cards.css's variant rules still apply;
   we just retint backgrounds and text colours per-surface. */

.card--dark-glass {
  /* Repurpose dark-glass as "teal block" — Kindred's brand-arrival surface. */
  background: rgba(20, 128, 111, 0.96);  /* teal-deep, slightly transparent */
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  color: var(--card-paper);
}
.card--dark-glass .card__kicker { color: var(--card-paper-soft); }
.card--dark-glass .card__label  { color: rgba(251, 249, 246, 0.78); }

.card--light-paper {
  /* Cream-warm card on cream canvas — soft elevation. */
  background: var(--card-paper-soft);
  border: 1px solid rgba(27, 42, 61, 0.08);
  box-shadow: 0 6px 24px rgba(27, 42, 61, 0.06), 0 1px 0 rgba(27, 42, 61, 0.04);
  color: var(--card-navy);
}
.card--light-paper .card__kicker      { color: var(--card-accent); }
.card--light-paper .card__label       { color: var(--card-slate-ink); }
.card--light-paper .card__figure-unit { color: var(--card-accent); }

.card--brand-navy {
  /* Repurpose as "teal solid" — for the wordmark/CTA scene. */
  background: var(--card-accent);
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 24px 60px rgba(20, 128, 111, 0.28);
  color: var(--card-paper);
}

.card--ghost {
  background: rgba(232, 244, 241, 0.65);
  backdrop-filter: blur(6px);
  border: 1.5px solid rgba(20, 128, 111, 0.20);
  color: var(--card-navy);
}

.card--ghost .card__kicker { color: var(--card-accent); }

/* Wordmark variant — Kindred wordmark in display serif (not the cards.css
   default mono-monogram look — that fits Claim Mate, not Kindred). */
.card--wordmark .card__mark {
  font-family: var(--card-font-display);
  font-weight: 600;
  font-size: 180px;
  line-height: 1;
  letter-spacing: -0.025em;
  color: var(--card-paper);
  text-shadow: 0 4px 18px rgba(15, 22, 33, 0.35);
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.card--wordmark .card__mark-slash { display: none; } /* Kindred wordmark has no slash */

.card--wordmark .card__url {
  font-family: var(--card-font-mono);
  font-weight: 500;
  font-size: 38px;
  color: var(--card-paper);
  letter-spacing: 0.04em;
  opacity: 0.92;
  text-shadow: 0 2px 10px rgba(15, 22, 33, 0.30);
}

.card--wordmark .card__fine {
  font-family: var(--card-font-ui);
  font-style: italic;
  font-weight: 400;
  font-size: 28px;
  color: var(--card-paper-soft);
  line-height: 1.4;
  max-width: 720px;
  text-align: center;
  opacity: 0.92;
}

/* Headline variant — punch up the Fraunces serif at large sizes. */
.card--headline .card__title {
  font-family: var(--card-font-display);
  font-weight: 500;
  font-size: 96px;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

/* Step card — the GIVE / ASK / SUPPORT row. Adopt feature-row layout but
   centre-align and let the icon read as a coloured pill. */
.card--feature-row .card__icon {
  width: 110px;
  height: 110px;
  border-radius: 22px;
  background: var(--card-paper);
  border: 1px solid rgba(27, 42, 61, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;          /* emoji or unicode glyph as icon */
  line-height: 1;
}
.card--feature-row .card__title {
  font-family: var(--card-font-display);
  font-weight: 500;
  font-size: 40px;
  line-height: 1.1;
  color: var(--card-navy);
}
.card--feature-row .card__body {
  font-size: 26px;
  color: var(--card-slate-ink);
  opacity: 1;
}
```

---

## SECTION 4 — DESIGN.md (Kindred brand spec)

# DESIGN — Kindred Promo (extracted brand)

Source: https://kindred-nz.org/ (captured 2026-04-25). All values pulled directly from the site's CSS custom properties — nothing invented.

## Style Prompt

Warm, cream-and-teal Aotearoa community aesthetic. Friendly serif headlines (Fraunces) over rounded sans body (Nunito). Hand-knit feel — generous spacing, soft cards, no aggressive geometry. Anti-corporate: the design should read as a neighbourhood noticeboard, not a tech product. Light canvas dominates; teal arrives as accent and as the "moment of arrival" colour for the Kindred brand block.

## Colors

| Role | Hex | Source |
|---|---|---|
| Primary brand (teal) | `#1A9E8F` | `--teal` |
| Teal deep | `#14806F` | `--teal-deep` |
| Teal soft (tint) | `#BFE3DC` | `--teal-soft` |
| Teal tint (washes) | `#E8F4F1` | `--teal-tint` |
| Cream (canvas) | `#FBF9F6` | `--cream` |
| Cream warm | `#F5EFE6` | `--cream-warm` |
| Ink (primary text) | `#1B2A3D` | `--ink` |
| Ink-60 (secondary) | `#5A6677` | `--ink-60` |
| Sun (warm accent) | `#F4C96B` | `--sun` |
| Coral (warm accent) | `#E98B6A` | `--coral` |
| Orange | `#E67E3C` | `--orange` |

Surface defaults: cream canvas + ink text. Teal as primary accent for kickers/marks; ink (`#1B2A3D`) for primary buttons (their actual CTA convention).

## Typography

- **Display:** Fraunces (variable serif, opsz 9-144, wght 400/500/600/700) — Google Fonts
- **Body:** Nunito (rounded sans, wght 400-800) — Google Fonts
- **Mono:** JetBrains Mono (wght 400/500) — Google Fonts

Imported via `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap`.

## Verbatim copy (use these — invent nothing)

- Hero: *"Share with neighbours. Find local help."*
- Subhead: *"One free app for your street — a place to give, ask, and find local help close to home."*
- Tagline: *"The community app powered by kindness."*
- Three actions (verbatim from app): **Give something** / **Ask for something** / **Local support**
- Tone bites: *"No money, no ads, no algorithm. Just local."* · *"Someone a few doors down probably has it."* · *"have a yarn while you hand it across."* · *"You're not alone."*
- CTAs: *"Try Kindred free"* · *"See how it works →"*

## Assets

- Logo: `assets/logo/kindred-icon.png` (1024×1024, white peak/gable on teal)
- App screenshot: `assets/photos/kindred-app.png` (390×844, Activity feed)

## Motion mood

Calm, considered, warm. Eases that exhale (`power3.out`, `expo.out`, occasional `back.out(1.4)` for the wordmark). No aggressive snap. Holds long enough to read. Cream-to-teal transitions feel like "arrival home" — the brand block lands as the warm reveal.

## What NOT to Do

1. No dark/navy backgrounds for primary content — Kindred is a light brand. Teal arrives only at the moments of brand-introduction and CTA, not as a background for body copy.
2. No invented stats, testimonials, or download numbers. All copy must trace back to verbatim site content.
3. No corporate-app polish (heavy gradients, glass-morphism, neon glows) — community-noticeboard energy.
4. No emoji-heavy copy in the narration; the app uses emojis but the video voice should be warm-conversational, not playful-clutter.
5. No Māori words in TTS narration (Edge TTS mispronounces them — use English equivalents like "Aotearoa" only if the voice handles it; safer to say "New Zealand").

---

## SECTION 5 — cards-library.md (prior art — cards already shipped; match these conventions)

# Playbook — Website-to-Video Cards Library

Reusable card patterns for the Website-to-Video method. Each card here is **brand-agnostic** — it draws colors and fonts from `design/tokens-<brand>.css` and works for any website's brand. Adding a new brand = swap the tokens file; cards adapt automatically.

We build one card at a time, prove it on the current render, then promote it here so the next render gets it for free.

---

## Card 01 — Persistent Brand Header

**What it does:** Shows the brand's logo + wordmark at the top of the frame from t=0 through to the end. Establishes the brand immediately and keeps it visible across every scene.

**Why it pops:** The viewer never has to wonder whose video this is. On a 6-second scroll past, the brand registers in the first frame.

**First proven on:** Kindred 2026-04-25 — [renders/aivideomaker_2026-04-25_12-16-25.mp4](../../renders/aivideomaker_2026-04-25_12-16-25.mp4).

### How to drop it into any composition

**Step 1 — Markup** (place inside the root composition `<div>`, above the scenes):

```html
<div id="brand-header" class="clip brand-header"
     data-start="0" data-duration="<full-duration>" data-track-index="10">
  <img class="brand-header__logo" src="assets/logo/<brand>-icon.png" alt="" />
  <div id="brand-header-wordmark" class="brand-header__wordmark"><Brand></div>
</div>
```

**Step 2 — Per-scene mode** — every scene declares whether its background is light or dark:

```html
<div id="scene-1" class="clip scene scene-bg-cream"
     data-start="0" data-duration="3.5" data-track-index="0"
     data-scene-mode="light">    <!-- light bg → header uses dark text -->
  ...
</div>

<div id="scene-2" class="clip scene scene-bg-teal"
     data-start="3" data-duration="5" data-track-index="1"
     data-scene-mode="dark">     <!-- dark bg → header uses light text -->
  ...
</div>
```

**Step 3 — Auto-discovery in GSAP** — replace any hardcoded color flips with this generic loop:

```js
// Soft entrance
tl.from("#brand-header", { y: -28, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.1);

// Reads data-scene-mode from every scene and flips the header [data-mode] attr
// at scene start. CSS handles the actual color swap. Works for any number of
// scenes, any brand, any composition.
const _scenes = document.querySelectorAll(
  '[data-composition-id="<comp-id>"] .scene[data-scene-mode]'
);
_scenes.forEach((scene) => {
  const start = parseFloat(scene.dataset.start || "0");
  const mode = scene.dataset.sceneMode || "light";
  tl.set("#brand-header", { attr: { "data-mode": mode } }, start);
});
```

**Step 4 — CSS** (currently lives inline in `index.html`; will be promoted to `design/cards.css` once a second card uses it):

```css
.brand-header {
  position: absolute;
  top: 56px;
  left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  z-index: 50;
  pointer-events: none;
}
.brand-header__logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}
.brand-header__wordmark {
  font-family: var(--card-font-display);
  font-weight: 600;
  font-size: 56px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--card-navy);                /* default — for light scenes */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: color 0.4s ease;
}
.brand-header[data-mode="dark"] .brand-header__wordmark {
  color: var(--card-paper);               /* swap to light text on dark scenes */
}
```

### Tokens this card depends on

These must exist in `design/tokens-<brand>.css`:
- `--card-navy` — primary dark text color (for light backgrounds)
- `--card-paper` — primary light text color (for dark backgrounds)
- `--card-font-display` — the brand's display/serif font

Already defined for Kindred. For a new brand, just ensure the tokens file sets these three.

### Asset requirement

`assets/logo/<brand>-icon.png` — square logo, 1024×1024 ideal. Renders at 64px in the header (cropped to a 14px-radius square).

### Headroom in scenes

Scenes that pin content to the top with `padding-top: <small-value>` will collide with the header. The header occupies y=56–120. Scenes using `justify-content: center` are fine (content stays vertically centered). Scenes using `justify-content: flex-start` need `padding-top: 200px` or more.

### Constraints

- The wordmark text in the header must match the brand's actual wordmark spelling and casing — read the brand's website to confirm.
- The `<full-duration>` on the header `data-duration` must match the root composition duration exactly.
- Don't also place a separate `<img>` of the same logo inside any scene — duplicate-media lint warning. The header IS the logo presence; scenes that want to celebrate the brand use giant typography (the wordmark) instead of repeating the icon.

---

## Card 02 — Three-Up Feature Card (numbered + line-icon)

**What it does:** Three stacked rows showing the brand's three primary actions / features / steps. Each row has: a line-icon in a tinted circle, a numbered mono kicker (`01 · LABEL`), a serif title, a sans body.

**Why it pops:** The icon-in-tinted-circle is a depth move — the soft accent glow behind reads as a halo. Numbered kickers add structure. SVG line-icons (rather than emoji) feel intentional and themeable.

**First proven on:** Kindred Scene 3 — "How it works" (give / ask / local-help).

### Markup pattern

```html
<div class="s3-row">
  <div class="icon"><svg viewBox="0 0 24 24"><!-- Lucide path here --></svg></div>
  <div class="text-group">
    <div class="num">01 · GIVE</div>
    <div class="t">Give what you've got.</div>
    <div class="b">Surplus food, tools, kids' clothes — share with neighbours.</div>
  </div>
</div>
```

### CSS notes

```css
.s3-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 32px;
  width: 880px;
  padding: 30px 40px 30px 36px;
  background: var(--card-paper-soft);
  border: 1px solid rgba(27, 42, 61, 0.06);
  border-radius: 28px;
  box-shadow: 0 6px 22px rgba(27, 42, 61, 0.06), 0 1px 0 rgba(255, 255, 255, 0.6) inset;
}
.s3-row::before {  /* soft accent glow behind icon */
  content: ""; position: absolute; top: 50%; left: 36px;
  width: 180px; height: 180px;
  border-radius: 50%; transform: translateY(-50%);
  background: radial-gradient(circle, rgba(var(--card-accent-rgb), 0.16) 0%, transparent 65%);
  pointer-events: none; z-index: 0;
}
.s3-row > * { position: relative; z-index: 1; }
.s3-row .icon {
  width: 116px; height: 116px;
  border-radius: 50%;
  background: var(--card-paper);
  border: 1.5px solid rgba(var(--card-slate-rgb), 0.18);
  color: var(--card-slate);  /* SVG inherits via stroke="currentColor" */
}
.s3-row .icon svg {
  width: 56px; height: 56px;
  stroke-width: 2; stroke: currentColor; fill: none;
  stroke-linecap: round; stroke-linejoin: round;
}
```

### Entrance pattern (GSAP)

```js
// Each row: row slides up, icon scales/rotates in independently, num kicker fades after
tl.from("#s3-row-1", { y: 40, opacity: 0, duration: 0.6, ease: "back.out(1.4)" }, START);
tl.from("#s3-row-1 .icon", { scale: 0.4, rotate: -10, opacity: 0, duration: 0.5, ease: "back.out(2.2)" }, START + 0.13);
tl.from("#s3-row-1 .num",  { y: 12, opacity: 0, duration: 0.4 }, START + 0.25);
```

Cue each row's `START` to the narration sentence boundary in the VTT (e.g., "Give..." / "Ask..." / "Find..."). Alternate icon `rotate: -10` / `+10` / `-6` for natural variety.

### Where to get icons

Inline Lucide SVGs (paths come from [lucide.dev](https://lucide.dev)). Use `stroke="currentColor"` so the icon themes itself via the parent's CSS color. For asset-fetched alternatives: [scripts/fetch-iconify.mjs](../../scripts/fetch-iconify.mjs).

---

## Card 03 — Per-Letter Wordmark Reveal

**What it does:** The brand wordmark appears at hero size (200px+), with each letter staggered into place from below + slight rotation, against a soft breathing accent glow.

**Why it pops:** Per-letter motion turns a static logotype into kinetic typography — the wordmark feels *announced* rather than just shown. Pairs with the persistent header (Card 01) — the small Kindred at top is continuous; the giant Kindred in this scene is the *moment*.

**First proven on:** Kindred Scene 2 — brand introduce.

### Markup pattern

```html
<div class="scene scene-bg-teal" data-scene-mode="dark" ...>
  <div class="s2-glow"></div>
  <div class="scene-content">
    <div id="s2-wordmark" class="s2-wordmark" data-text="Kindred">Kindred</div>
    <div id="s2-tagline" class="s2-tagline">tagline goes here</div>
  </div>
</div>
```

The `data-text="Kindred"` attribute is the source-of-truth; a generic JS splitter reads it and rebuilds the element with one `<span>` per character.

### Generic splitter (drop into the timeline script, before timeline construction)

```js
document.querySelectorAll('[data-composition-id="<comp-id>"] [data-text]')
  .forEach((el) => {
    if (el.children.length > 0) return;  // already split
    el.innerHTML = (el.dataset.text || el.textContent)
      .split("")
      .map((c) => c === " "
        ? '<span class="s2-wordmark__sp">&nbsp;</span>'
        : `<span>${c}</span>`)
      .join("");
  });
```

Reusable for any per-letter element in any composition — just add `data-text` to the source element.

### CSS notes

```css
.s2-wordmark {
  display: flex; justify-content: center;
  font-family: var(--card-font-display);
  font-weight: 600; font-size: 200px; line-height: 1;
  letter-spacing: -0.025em;
  color: var(--card-paper);
  text-shadow: 0 6px 20px rgba(0, 0, 0, 0.30);
}
.s2-wordmark > span { display: inline-block; will-change: transform, opacity; }
.s2-wordmark__sp { width: 0.32em; }  /* spacing for multi-word wordmarks */

.s2-glow {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 52%, rgba(255, 255, 255, 0.10) 0%, transparent 55%);
  pointer-events: none; z-index: 0;
}
.s2-glow ~ * { position: relative; z-index: 1; }
```

### Entrance pattern (GSAP)

```js
tl.from(".s2-glow", { opacity: 0, scale: 0.92, duration: 1.0, ease: "power2.out" }, SCENE_START + 0.1);
tl.from("#s2-wordmark > span", {
  y: 90, opacity: 0, rotate: -4,
  duration: 0.7, ease: "back.out(1.7)",
  stagger: 0.055
}, SCENE_START + 0.45);
tl.from("#s2-tagline", { y: 30, opacity: 0, duration: 0.6 }, SCENE_START + 1.5);
// Soft glow breathing for ambient life
tl.to(".s2-glow", { opacity: 0.55, scale: 1.06, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: 1 }, SCENE_START + 1.7);
```

---

## Card 04 — Kinetic Proof + Phone Frame + Notification Ping

**What it does:** Each line of a multi-line headline ("No money. / No ads. / No algorithm. / Just local.") reveals separately, cued to its own narration sentence in the VTT. A phone frame anchors the visual centre. A notification ping (e.g. "+1") pops onto the phone at a key emotional beat.

**Why it pops:** Kinetic stacking turns a static headline into a rhythmic delivery — each "No X" lands with the voice. The notification ping is the human-alternative moment ("not algorithm — actual people").

**First proven on:** Kindred Scene 4 — proof.

### Markup pattern

```html
<div class="s4-headline">
  <span class="s4-h-line">No money.</span>
  <span class="s4-h-line">No ads.</span>
  <span class="s4-h-line">No algorithm.</span>
  <span class="s4-h-line s4-h-line--em">Just local.</span>
</div>
<div class="s4-phone-wrap">
  <img class="s4-phone-screen" src="<brand>-app-screenshot.png" alt="" />
  <div class="s4-ping">+1</div>
</div>
```

### CSS notes

```css
.s4-headline {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  text-align: center;
}
.s4-h-line {
  display: block;
  font-family: var(--card-font-display);
  font-weight: 500; font-size: 86px; line-height: 1.04;
  letter-spacing: -0.025em;
  color: var(--card-navy);
}
.s4-h-line--em { color: var(--card-slate); font-style: italic; font-weight: 600; }

.s4-phone-wrap {
  position: relative;  /* required — ping is absolute child */
  width: 440px; height: 952px;
  border-radius: 60px;
  background: #0F1621;  /* phone-bezel color, kept neutral across brands */
  padding: 16px;
  box-shadow: 0 40px 100px rgba(15, 22, 33, 0.30), inset 0 0 0 2px #222a36;
}
.s4-ping {
  position: absolute;
  top: 70px; right: -28px;
  min-width: 78px; height: 78px; padding: 0 18px;
  border-radius: 50%;
  background: var(--card-warn);  /* coral / accent / brand "alert" color */
  color: var(--card-paper);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--card-font-ui);
  font-weight: 800; font-size: 28px;
  box-shadow: 0 12px 28px rgba(var(--card-warn-rgb), 0.45);
  z-index: 5;
}
```

### Entrance pattern (GSAP) — VTT-anchored

```js
// Phone enters first to anchor the visual centre
tl.from("#s4-phone", { y: 80, scale: 0.92, opacity: 0, duration: 0.85, ease: "back.out(1.3)" }, SCENE_START + 0.4);

// Each headline line cued to the corresponding word-time from the VTT
tl.from(".s4-h-line:nth-child(1)", { y: 36, opacity: 0, duration: 0.55, ease: "expo.out" }, T_LINE_1);
tl.from(".s4-h-line:nth-child(2)", { y: 36, opacity: 0, duration: 0.55, ease: "expo.out" }, T_LINE_2);
tl.from(".s4-h-line:nth-child(3)", { y: 36, opacity: 0, duration: 0.55, ease: "expo.out" }, T_LINE_3);
tl.from(".s4-h-line:nth-child(4)", { y: 40, scale: 0.96, opacity: 0, duration: 0.7, ease: "back.out(1.4)" }, T_LINE_4);

// Ping arrives during a pause between lines (or after the punchline)
tl.from("#s4-ping", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2.2)" }, T_PING);
tl.to("#s4-ping", { scale: 1.14, duration: 0.34, ease: "sine.inOut", yoyo: true, repeat: 1 }, T_PING + 0.65);
```

### When to use a phone frame vs not

If the brand is a mobile app with a screenshot worth showing, use the phone frame. If it's a SaaS / web product, swap for a browser-frame card or device mockup. Either way, the kinetic-headline + accent-ping pattern transfers.

---

## Card 05 — CTA with Glow-Pulse Pill + URL Underline Draw-In

**What it does:** Final scene — kicker, hero wordmark, URL with a draw-in underline, fine print, and an action pill that glow-pulses (animated box-shadow + scale).

**Why it pops:** The URL underline draws attention to the actionable destination. The pill's glow-pulse simulates a button "ready" state — the viewer's eye locks onto the action.

**First proven on:** Kindred Scene 5 — CTA.

### Markup pattern

```html
<div class="scene scene-bg-teal" data-scene-mode="dark" ...>
  <div class="scene-content">
    <div class="s5-kicker">FREE · NO ADS · NO ALGORITHM</div>
    <div class="s5-mark">Kindred</div>
    <div class="s5-url">kindred-nz.org<span class="s5-url__underline"></span></div>
    <div class="s5-fine">Free for every street<br />in New Zealand.</div>
    <div class="s5-pill">Try it free</div>
  </div>
</div>
```

### CSS notes

```css
.s5-url {
  position: relative;  /* required — underline is absolute child */
  display: inline-block;
  font-family: var(--card-font-mono);
  font-size: 44px; letter-spacing: 0.06em;
  color: var(--card-paper);
  padding-bottom: 10px;
}
.s5-url__underline {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 3px;
  background: var(--card-paper);
  opacity: 0.7;
  transform: scaleX(0); transform-origin: left center;
}

.s5-pill {
  display: inline-flex; align-items: center;
  padding: 16px 34px; border-radius: 40px;
  background: rgba(255, 255, 255, 0.18);
  border: 1.5px solid rgba(255, 255, 255, 0.42);
  font-family: var(--card-font-mono);
  font-weight: 600; font-size: 26px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--card-paper);
  backdrop-filter: blur(6px);
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
}
```

### Entrance + pulse pattern (GSAP)

```js
tl.from("#s5-url", { y: 26, opacity: 0, duration: 0.55 }, START + 0.85);
// URL underline draws in left-to-right
tl.to(".s5-url__underline", { scaleX: 1, duration: 0.65, ease: "expo.out" }, START + 1.2);

tl.from("#s5-pill", { y: 24, opacity: 0, duration: 0.55, ease: "back.out(1.6)" }, START + 1.7);
// Pill glow pulse — animated box-shadow ring + slight scale bump
tl.to("#s5-pill", {
  scale: 1.06,
  boxShadow: "0 0 0 14px rgba(255, 255, 255, 0.14)",
  duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 1
}, START + 2.6);
```

The `repeat: 1` (one yoyo cycle) keeps the pulse subtle — it draws attention without being distracting. Don't `repeat: -1` (banned).

---

## Building a new card

When the user asks to "make X pop":
1. Identify which card pattern serves the moment (or whether a new pattern is needed).
2. Author it with brand-agnostic tokens and styling — never hardcode colors or fonts; always go through `design/cards.css` + `design/tokens-<brand>.css`.
3. Apply it to the current composition as the first instantiation.
4. Lint and render. Frame-verify on a representative scene.
5. Document here with: what it does, why it pops, how to drop in, tokens it depends on, constraints.
6. The next Website-to-Video render gets the card for free.

---

## SECTION 6 — stacks.md (coordinated stacks per brand mood)

# Playbook — Website-to-Video Stacks

A **stack** is a coordinated set of choices across every dimension of the video — transitions, atmospheric layers, music, copy tone, pacing, and TTS voice. Pick one stack at the start of a project and let it constrain every downstream decision.

Why stacks: a whip transition + cinematic strings + corporate copy clash. The viewer feels something is "off" without being able to name it. Stacks prevent that mismatch by defining a coherent feel, then propagating it through every choice.

This is the master playbook. It lives upstream of [music.md](music.md), [copy-and-script.md](copy-and-script.md), [transitions.md](transitions.md), [atmospheric-polish.md](atmospheric-polish.md), and [cards-library.md](cards-library.md) — those documents tell you HOW to do each thing; this one tells you WHICH to do.

---

## How to pick a stack

Look at the brand's website with one question in mind: **what does the viewer feel after 6 seconds?**

- They feel *welcomed* and *neighbourly* → **Warm Community**
- They feel *energised* and *can't-look-away* → **Kinetic Pop**
- They feel *informed* and *trusting an expert* → **Documentary Considered**
- They feel *quietly impressed* and *aspirational* → **Quiet Premium**

If two stacks match, pick the one with the lower energy ceiling — viewers downgrade harshly when energy doesn't match the brand. A wedding venue with whip transitions reads as wrong; a TikTok-native skincare brand with a documentary score feels embalmed.

If none match, stop. Don't hybridise stacks until you've shipped 3 single-stack videos. Hybrids are a precision move, not a default.

---

## Stack 1 — Warm Community

**Vibe:** Cream-and-natural. Hand-knit feel. Neighbourhood noticeboard, not tech product. The viewer should feel a doorstep welcome.

**Best for:** community apps, charities, NGOs with a people focus, locally-rooted brands, social-impact products, parenting / wellbeing / mutual-aid services.

**First proven on:** Kindred — `kindred-nz.org` ([renders/aivideomaker_2026-04-25_12-54-16.mp4](../../renders/aivideomaker_2026-04-25_12-54-16.mp4)).

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Hook → Brand introduce | **Color wash** | Brand color sweeps in. The "moment of arrival." Once per video. |
| Brand → Features | **Soft cross-dissolve** | Same-tone calm. |
| Features → Proof | **Soft cross-dissolve** | |
| Proof → CTA | **Soft cross-dissolve** with subtle brand-color pulse | Build to action without yelling. |

Never: whips (too kinetic — see Stack 2 for whips), hard cuts, slide-pushes (too tech), light leaks (too lifestyle). The warm-community feel needs slow ease, not energy injection. Whips read as a different brand voice and break the trust the rest of the stack is building.

**Lesson learned 2026-04-25 (Kindred render):** initially used whip+whoosh on two cuts. Looked technically correct but felt out-of-character — community brand reading as a kinetic-pop ad. Removed both whips, all soft cross-dissolves with one color-wash for brand arrival. Render felt right.

### Atmospheric layers

- ✅ Music bed: warm acoustic guitar, light percussion, 80-100 BPM
- ✅ Camera push-in: 1.0 → 1.03 every scene
- ✅ Vignette: subtle, multiply blend
- ✅ Film grain: 0.08 opacity, slow drift
- ✅ Particles on dark scenes only (teal/brand-color scenes)
- ✅ Light beam on the longest calm scene
- ✅ Paper-grain drift on cream scenes

### Music

Search keywords: `warm acoustic guitar community`, `gentle acoustic folk`, `documentary acoustic piano`, `inspirational acoustic uplifting`. BPM range 80-100. Avoid: synth, electronic, drum-heavy, vocal samples.

Default volume `0.18` under narration; can swell to `0.45` between phrases.

### TTS voice

| Setting | Value |
|---|---|
| Voice | `en-NZ-MollyNeural` (NZ projects) or `en-AU-NatashaNeural` (warmer) |
| Rate | `-10%` |
| Pitch | default or `+2Hz` |

Avoid: US voices (foreign for NZ/AU brands), heavy male voices (too authoritative for community).

### Copy tone

- Conversational, sentence fragments OK ("No money. No ads. Just local.")
- Verbatim brand copy from site is the gold standard
- Hand-knit phrases: "your street", "your neighbours", "close to home"
- 12-18 word narration sentences; 6-8 for emphasis beats
- Never: jargon, acronyms without context, corporate verbs (deliver, leverage, optimise)

### Pacing — 5-beat / 25-30s

```
0.0–3.5s   Hook            (text-only, cream)
3.0–8.0s   Brand introduce (brand-color, big wordmark + tagline)
7.5–16.5s  Features        (3-up cards, narrated cue per row)
16.0–24.5s Proof           (kinetic headline + photo/phone)
24.0–29.5s CTA             (wordmark, URL, pill)
```

0.5s overlap between scenes for transitions to live in.

---

## Stack 2 — Kinetic Pop

**Vibe:** Scroll-stopping. Pop-cultural energy. Bright, fast, percussive. The viewer should feel *I can't look away*.

**Best for:** DTC consumer brands, lifestyle apps, creator tools, fitness, beauty, anything targeting Gen Z, anything where vertical-format scroll is the primary distribution channel.

**Status:** Not yet proven. Promote when first shipped.

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Every cut | **Whip + whoosh** | Yes, every one. Vary direction (left/right/up). |
| Optional within scene | **Light leak flash** | Coloured wash on emphasis beats. |

Never: cross-dissolves (too slow), color washes (too long for the pacing), match-cuts (require setup time the pacing doesn't allow).

### Atmospheric layers

- ✅ Music bed: synth-driven, drum-heavy, 110-130 BPM
- ✅ Camera push-in: aggressive 1.0 → 1.06 (more obvious zoom)
- ✅ Particles: dense, sharper (no blur), brand-color tinted
- ✅ Light leaks during transitions
- ❌ Film grain (too cinematic, dulls the punch)
- ❌ Paper-grain drift (too soft)
- ❌ Long vignettes (compresses the energy)
- ✅ Quick scale-pulses on key elements with the music's kick

### Music

Search keywords: `upbeat electronic motivation`, `energetic pop dance`, `tiktok trending beat`, `epic build-up drop`. BPM range 110-130. The music's kick should land on every transition — pre-listen and align cuts to drops.

Default volume `0.30` under narration (sit higher than Warm Community's 0.18 — kinetic energy needs the music forward).

### TTS voice / captions

| Setting | Value |
|---|---|
| Voice | `en-US-AriaNeural` or `en-GB-RyanNeural` `+5%` |
| Rate | `+5%` to `+10%` |

Or, more often, **skip TTS entirely** and use **kinetic captions** sized to fill 70% of frame width, one phrase per cut.

### Copy tone

- Punchy. ALL CAPS allowed for hero words.
- Single-word sentences: "WAIT." "WHAT?" "FINALLY."
- Hook every 2 seconds. The viewer's thumb is on the scroll button.
- Active voice, exclamation marks earned not sprinkled
- Never: long sentences (>10 words), "we believe", "our mission", anything that sounds like a board meeting

### Pacing — 7-9 beats / 25s

```
0.0–2.5s   Hook (the one question)
2.5–5.0s   Reveal 1 (first answer)
5.0–7.5s   Reveal 2 (build)
7.5–10.0s  Reveal 3 (climax)
10.0–14.0s Demo / proof
14.0–18.0s Stat / payoff
18.0–22.0s Brand
22.0–25.0s CTA
```

No scene >4s. Cut on every kick.

---

## Stack 3 — Documentary Considered

**Vibe:** Serious, evidence-based, slow and deliberate. The viewer should feel *I am being respected and informed*.

**Best for:** B2B SaaS targeting senior decision-makers, professional services (legal / financial / medical), AI research, serious technology, healthcare, regulated industries.

**Status:** Not yet proven. Promote when first shipped.

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Every cut | **Cross-dissolve** | 0.6-0.8s, slower than default. |
| Once per video | **Match cut** | Bridges a narrative pivot. Optional. |

Never: whips (cheap), color washes (too theatrical), slide-pushes (too tech), light leaks (too lifestyle).

### Atmospheric layers

- ✅ Music bed: cinematic strings, piano, 60-80 BPM
- ✅ Camera push-in: very subtle 1.0 → 1.02
- ✅ Heavy film grain: 0.12 opacity (analog-camera feel)
- ✅ Strong vignette: 0.25 alpha on edges
- ❌ Particles (too playful)
- ❌ Paper-grain drift (too soft)
- ❌ Light beams (too theatrical)
- ✅ Slow camera tilt or parallax on photos

### Music

Search keywords: `documentary cinematic emotional`, `piano strings reflective`, `inspirational documentary score`, `slow building cinematic`. BPM range 60-80. Avoid: drums on beat, vocal samples, anything from a "trending" playlist.

Default volume `0.22` — slightly forward to support the gravitas, but never compete with narration.

### TTS voice

| Setting | Value |
|---|---|
| Voice | `en-AU-WilliamNeural` (NZ/AU briefs) or `en-GB-RyanNeural` |
| Rate | `-12%` |
| Pitch | default |

Authoritative baritone. Pronounces acronyms with dots (`A.C.C.`, `M.B.I.E.`). Reads with measured weight.

### Copy tone

- Clear, factual, structured. Senior-decision-maker tone.
- Longer sentences (15-25 words) — but read at -12% rate, they breathe naturally
- Evidence anchors: dates, named sources, quoted phrases (must be real — see [copy-and-script.md](copy-and-script.md) hard rule on inventing facts)
- Voice-of-authority, never voice-of-friend
- Active verbs but quiet ones: "demonstrates", "establishes", "shows", "confirms"
- Never: exclamation marks, ALL CAPS, "amazing", "game-changing"

### Pacing — 5 beats / 30-35s

```
0.0–5.0s    Hook (a question or a fact, not a hype line)
5.0–11.0s   Context (what's happening, who's affected)
11.0–20.0s  Evidence (the proof — case study, stat, quote)
20.0–28.0s  Resolution (what the brand does about it)
28.0–35.0s  CTA (subtle, "Learn more" not "Buy now")
```

Scenes can hold 6-8s. Don't rush. Don't cut on the music's beat — cut between sentences, on the breath.

---

## Stack 4 — Quiet Premium

**Vibe:** Hushed, considered, expansive negative space. The viewer should feel *this is for someone who doesn't need to be sold*.

**Best for:** luxury products, hospitality, fashion, premium subscriptions, high-touch services, anything where the brand's competence is implied not declared.

**Status:** Not yet proven. Promote when first shipped.

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Every cut | **Slow cross-dissolve** | 0.8-1.2s, glacial by other stacks' standards. |
| Once per video | **Match cut** | Quietly impressive, story-continuity. |

Never: whips (loud), color washes (theatrical), light leaks (busy), particles (cluttered).

### Atmospheric layers

- ✅ Music bed: ambient pad, sparse piano, 50-70 BPM, no vocals
- ✅ Camera push-in: 1.0 → 1.025 (almost invisible)
- ❌ Film grain (too analog, breaks the polish)
- ❌ Particles (too theatrical)
- ❌ Light beams (too broadcast)
- ✅ Whisper-soft vignette: 0.1 alpha
- ✅ Hold scenes long (6-10s) without motion — let typography breathe

### Music

Search keywords: `ambient piano minimal`, `cinematic quiet emotional`, `sparse atmospheric`, `meditation cinematic`. BPM range 50-70. Or no music at all — silence as luxury.

Default volume `0.12` — barely there, present but never demanding.

### TTS voice

Often: **no narration**. Let typography and music carry the story.

If narration: `en-GB-LibbyNeural` or `en-US-JennyNeural` at `-15%`. Whisper-soft, almost private.

### Copy tone

- Short. Single-line scenes, sometimes single-word.
- Lots of held silence. Em-dashes for thinking pauses.
- No CTAs that command — invitations only ("Discover the collection")
- Never: percentages, urgency words, "limited time", "act now"

### Pacing — 4 beats / 30-40s

```
0.0–8.0s    Hold one image / typography card
8.0–18.0s   Hold a second
18.0–28.0s  Hold a third
28.0–35.0s  Brand reveal + invitation
```

The longer you hold, the more premium it reads. If a scene feels too long, hold it longer.

---

## Stack picker — quick decision matrix

| Question | Warm | Kinetic | Documentary | Quiet |
|---|:-:|:-:|:-:|:-:|
| Brand is community / social impact | ✅ | | | |
| Brand is scroll-native / Gen Z | | ✅ | | |
| Brand sells to senior decision-makers | | | ✅ | |
| Brand is luxury / aspirational | | | | ✅ |
| Music has lyrics on stock | ✅ | ✅ | | |
| Run time is 25-30s | ✅ | ✅ | | |
| Run time is 30-40s | | | ✅ | ✅ |
| Need a CTA-pill button | ✅ | ✅ | | |
| Need a "Learn more" link only | | | ✅ | ✅ |
| Trust comes from warmth | ✅ | | | |
| Trust comes from authority | | | ✅ | |
| Trust comes from peer signals | | ✅ | | |
| Trust comes from understatement | | | | ✅ |

---

## Why this matters for the Website-to-Video method

The brand-extraction step gives us **what the brand looks like** — colours, fonts, copy, imagery. The stack picks **what the brand feels like** — pace, voice, atmosphere, transitions. Without a stack, brand-extraction alone produces a "moodless" render that uses the right palette but feels like a slide deck.

In the pipeline:

```
1. Brand extraction (URL → palette/fonts/copy)         [tokens-<brand>.css]
2. Stack pick      (gut + decision matrix above)       [docs/playbooks/stacks.md]
3. Asset fetch     (music search per stack)            [music.md]
4. Script + TTS    (copy tone + voice per stack)       [copy-and-script.md]
5. Composition     (transitions + atmospherics per stack)  [transitions.md, atmospheric-polish.md, cards-library.md]
6. Render
```

Stack picked at step 2 propagates through every subsequent step. If a stack switch happens mid-build, redo from step 3 — don't try to "patch" a render to a new stack.

---

## Building a new stack

If a brand doesn't fit any of the four, don't shoehorn — propose a new stack. Authoring rules:

1. **Mood paragraph** — one sentence describing what the viewer should feel after 6 seconds.
2. **Best for** — at least 5 use cases. If you can't think of 5, the stack is too narrow.
3. **Transitions table** — at least 2 transition types named with explicit "use here / never here" rules.
4. **Atmospheric checklist** — every atmospheric layer marked ✅ or ❌. No "maybe".
5. **Music search keywords + BPM range + volume default**.
6. **TTS voice + rate** OR explicit "no narration".
7. **Copy tone** — 3-5 do/don't bullet points.
8. **Pacing template** — beat sheet with timestamp ranges, total run-time.
9. **First proven on** — empty until shipped, then fill in with render path.

Stacks that aren't proven on a real render are drafts. Mark them clearly.

---

## SECTION 7 — transitions.md (transition pattern library)

# Playbook — Scene Transitions for Website to Video

Reusable transition patterns between scenes. Each transition is brand-agnostic (uses tokens) and has a defined emotional fit. Choose the transition based on the energy needed at the cut, not on visual variety alone.

| Transition | Energy | Use between |
|---|---|---|
| **Soft cross-dissolve** | Calm, contemplative | Two cream scenes mid-narration; emotional beats |
| **Color wash** | Brand arrival, warm reveal | Cream → brand-color (the "moment of brand") |
| **Whip + whoosh** | Energy injection, scroll-stopping | Any cut that needs a pace change; CTA build-ups |
| **Match cut** | Story continuity, "same idea, new angle" | When an element bridges two scenes (e.g., logo grows) |

The whoosh SFX is fetched via [scripts/fetch-pixabay-sfx.mjs](../../scripts/fetch-pixabay-sfx.mjs) and trimmed to a single ~0.65s clip at `assets/sfx/whoosh-short.mp3`.

---

## Transition 01 — Soft Cross-Dissolve

**What it does:** Outgoing scene's content gently scales down + fades to ~40% opacity while incoming scene fades up. Lasts ~0.6s.

**When to use:** Calm beats. The viewer's eye stays in the same emotional place; the content underneath shifts. Use between two scenes that share a background tone (cream→cream).

### GSAP

```js
// Outgoing scene softens (this IS the transition; not a banned exit animation)
tl.to("#scene-N .scene-content",
  { scale: 0.98, opacity: 0.4, duration: 0.5, ease: "power1.inOut" }, NEXT_START);
// Incoming scene fades up
tl.from("#scene-N+1", { opacity: 0, duration: 0.6, ease: "power2.out" }, NEXT_START);
```

No SFX needed. No streak overlay needed.

---

## Transition 02 — Color Wash

**What it does:** A brand-colored sheet drops down from the top, briefly covers the canvas, then peels off at the bottom — revealing the next scene. ~0.5s total.

**When to use:** The "moment of brand arrival" — typically the cut from the hook (cream) into the first brand scene (teal/navy/whatever the brand color is). Reads as decisive and warm.

### Markup

```html
<div id="wash-1" class="clip color-wash"
     data-start="<wash-start>" data-duration="0.70" data-track-index="11"></div>
```

### CSS

```css
.color-wash {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--card-accent) 0%, var(--card-slate) 100%);
  z-index: 80;
  pointer-events: none;
  will-change: transform;
}
```

### GSAP

```js
// Wash drops down (covers canvas)
tl.fromTo("#wash-1",
  { y: "-100%" },
  { y: "0%", duration: 0.22, ease: "power2.in" }, WASH_START);
// Wash peels off (reveals next scene)
tl.to("#wash-1",
  { y: "100%", duration: 0.22, ease: "power2.out" }, WASH_START + 0.33);
```

`WASH_START` typically lands ~0.15s before the next scene's `data-start` so the cover is mid-canvas at the boundary.

---

## Transition 03 — Whip + Whoosh

**What it does:** Whole-scene horizontal slide. Outgoing scene blurs and slides off-frame to the left; a bright streak sweeps across the canvas; incoming scene blurs in from the right. A whoosh SFX plays simultaneously. ~0.32s total.

**When to use:** Energy injection. Use between scenes that need a pace change — going from a calm explanation into the action steps, or building energy into the CTA. Very TikTok / Reels native.

### Markup (per whip)

```html
<!-- Streak overlay -->
<div id="whip-streak-1" class="clip whip-streak"
     data-start="<whip-start>" data-duration="0.55" data-track-index="11"></div>
<!-- Whoosh SFX -->
<audio id="whip-sfx-1" class="clip"
       src="assets/sfx/whoosh-short.mp3"
       data-start="<whip-start>" data-duration="0.65"
       data-track-index="12" data-volume="0.55"></audio>
```

### CSS

```css
.whip-streak {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 80;
  will-change: transform, opacity;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.0) 38%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0.0) 62%,
    transparent 100%
  );
  filter: blur(18px);
}
```

### GSAP

```js
// Whole outgoing scene slides off-frame left with motion blur
tl.to("#scene-N",
  { x: -1280, filter: "blur(10px)", duration: 0.32, ease: "power3.in" }, WHIP - 0.02);
// Streak sweeps left → right across canvas
tl.fromTo("#whip-streak-1",
  { x: "-100%", opacity: 0 },
  { x: "100%", opacity: 1, duration: 0.32, ease: "power2.inOut" }, WHIP);
tl.to("#whip-streak-1", { opacity: 0, duration: 0.10 }, WHIP + 0.34);
// Incoming scene slides in from right with motion blur
tl.from("#scene-N+1",
  { x: 1280, filter: "blur(10px)", duration: 0.32, ease: "power3.out" }, WHIP + 0.15);
```

`WHIP` is the moment of peak streak. Typically `WHIP = NEXT_SCENE_START + 0.05` so the streak peaks just after the boundary.

### Whoosh SFX setup (one-time)

Fetch a whoosh from Pixabay's sound-effects search:

```bash
node scripts/fetch-pixabay-sfx.mjs "whoosh transition" whoosh.mp3
```

Pixabay search results often return long montage files. Trim to a single ~0.65s clip with fade in/out:

```bash
ffmpeg -i assets/sfx/whoosh.mp3 -ss 0 -t 0.65 \
  -af "afade=t=in:d=0.03,afade=t=out:d=0.18,volume=1.3" \
  -ac 2 -b:a 128k assets/sfx/whoosh-short.mp3
```

The trimmed file is the asset every whip references via `<audio src="assets/sfx/whoosh-short.mp3">`. One file, many whips.

### Volume

`data-volume="0.55"` keeps the whoosh assertive but not louder than narration. Adjust by ±0.1 if the music bed is loud or quiet.

---

## Transition 04 — Match Cut (advanced)

**What it does:** An element in scene N visually bridges to scene N+1 — e.g., the small Kindred header word morphs to the giant Scene-2 wordmark, OR a row icon scales up to become the next scene's hero element. Both scenes share the bridging element's visual identity at the cut.

**When to use:** Story continuity moments. "Same idea, new angle" cuts where you want the viewer to feel the connection rather than a hard switch.

**Status:** Not yet implemented in the Kindred render. Pattern proposal (untested):

1. Animate a "ghost" element in scene N that occupies the position of the bridging element
2. At the boundary, the ghost morphs (position + scale) to where the same element will land in scene N+1
3. Scene N+1's actual hero element appears at the morphed-to position with opacity 0
4. Cross-fade ghost → real element

Promote this to "first proven" once it lands.

---

## Picking transitions for a 5-scene comp

For a typical 25-30s vertical promo:

```
sc1 (hook)  →  sc2 (brand)  →  sc3 (features)  →  sc4 (proof)  →  sc5 (CTA)
            │                │                  │                │
        color wash       whip+whoosh         soft cross       whip+whoosh
        (brand           (energy             (calm beat)      (energy build
         arrival)         injection)                           to action)
```

This gives the viewer a rhythm: **arrival → kinetic → calm → kinetic → land**. Don't use the same transition twice in a row — vary the energy. Don't whip on every cut — exhausting; the whip earns its keep by being the loudest tool in the box.

---

## Whoosh-as-a-layer pattern

The whoosh SFX is its own audio track (`data-track-index="12"`), separate from narration (track 9) and music bed (typically track 8 or 9). This means:

- You can whoosh without ducking narration — the SFX is short enough not to fight
- You can layer multiple whooshes on the same track if they don't overlap in time
- For a busy mix, lower whoosh `data-volume` (e.g., 0.4) instead of removing the whip

If you want a whoosh on every transition, just add another `<audio>` clip referencing the same `assets/sfx/whoosh-short.mp3` file at each transition's start time. Cheap, reusable.

---

## SECTION 8 — atmospheric-polish.md (effect pattern library)

# Playbook — Atmospheric Polish (Make It Feel Like Video)

The difference between "PowerPoint with motion" and "video" is mostly atmospheric — small, near-subliminal layers that add organic life to every frame. None of these layers carries information; they all carry feel.

Add these as a polish pass after content + transitions are locked. Don't add them while iterating on layout or copy — they hide layout issues.

---

## The polish stack (apply in this order)

1. **Music bed** — biggest single quality jump. Without music, every promo feels like a tutorial.
2. **Camera push-in** — every scene scales 1.0 → 1.03 over its duration. Almost imperceptible per frame; cumulative effect is enormous.
3. **Vignette** — subtle edge darkening, per-scene.
4. **Film grain** — global SVG noise texture, drifts slowly across the comp.
5. **Atmospheric layers per scene** — particles on dark scenes, light beam on long scenes, paper-grain drift on light scenes.

After all five, the render reads as cinema. Drop any one and it slips back toward presentation.

---

## 1. Music bed

Default volume `0.18` — sits under narration without competing. For sections without narration, can swell to `0.45`.

```html
<audio id="audio-music"
       src="assets/music/<brand>-bed.mp3"
       data-start="0" data-duration="<full>"
       data-track-index="8" data-volume="0.18"></audio>
```

For Kindred, the warm-acoustic bed is `assets/music/kindred-bed.mp3` (213s file, only first 29.5s played). See [music.md](music.md) for the user-first fetch flow.

---

## 2. Camera push-in (every scene)

Generic — auto-applies to every `.scene .scene-content` based on the scene's `data-start` and `data-duration`. Drop into the timeline script:

```js
document.querySelectorAll('[data-composition-id="<comp-id>"] .scene .scene-content')
  .forEach((content) => {
    const scene = content.closest(".scene");
    const start = parseFloat(scene.dataset.start || "0");
    const dur = parseFloat(scene.dataset.duration || "5");
    const pushDur = Math.max(0.6, dur - 0.4);  // stop 0.4s early to avoid fighting transitions
    tl.fromTo(content,
      { transformOrigin: "50% 50%", scale: 1.0 },
      { scale: 1.03, duration: pushDur, ease: "none" },
      start);
  });
```

Scope: `.scene-content` (the inner wrapper), NOT the scene element itself — leaves the scene transform free for whip transitions to use `x`. The push-in is `scale` only on a different element; no GSAP conflict.

Push amount: `1.03` is the default — enough to feel "alive" but not enough to clip content. For longer scenes (8s+) consider `1.04`.

---

## 3. Vignette (per scene)

Simple per-scene element. Drop one into every scene that wants depth:

```html
<div class="scene ...">
  ...
  <div class="vignette"></div>
  ...
</div>
```

```css
.vignette {
  position: absolute; inset: 0;
  z-index: 3;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 45%,
    transparent 50%,
    rgba(15, 22, 33, 0.18) 100%);
  mix-blend-mode: multiply;
}
```

`mix-blend-mode: multiply` lets the vignette tint *whatever* is underneath without specifying a color — works on cream, teal, navy, whatever the brand bg is. Token-free, one CSS class.

---

## 4. Global film grain

Persistent overlay above all scenes, below the brand header. SVG turbulence inlined as data URI — no external asset.

```html
<div id="film-grain" class="clip film-grain"
     data-start="0" data-duration="<full>" data-track-index="13"></div>
```

```css
.film-grain {
  position: absolute; inset: 0;
  z-index: 95;
  pointer-events: none;
  opacity: 0.08;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 200px 200px;
  will-change: background-position;
}
```

Animate slow drift so the grain feels alive:

```js
tl.fromTo("#film-grain",
  { backgroundPosition: "0px 0px" },
  { backgroundPosition: "-200px 140px", duration: <full>, ease: "none" },
  0);
```

---

## 5a. Particles (dark scenes)

Generic — fills any `[data-particles="N"]` container with N seeded-random `.particle` children, then drifts them upward with sway. Used on teal/dark/brand scenes for ambient depth. Don't use on cream or busy scenes — particles compete with content.

```html
<div class="scene scene-bg-teal ...">
  <div class="particles" data-particles="14"></div>
  ...
</div>
```

```css
.particles {
  position: absolute; inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}
.particle {
  position: absolute;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  filter: blur(2.5px);
  will-change: transform, opacity;
}
```

JS — uses mulberry32 seeded PRNG (deterministic; no `Math.random`):

```js
function _mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _seedRng = _mulberry32(7);
document.querySelectorAll('[data-particles]').forEach((container) => {
  const count = parseInt(container.dataset.particles || "14", 10);
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = (_seedRng() * 92 + 4).toFixed(2) + "%";
    p.style.top = (_seedRng() * 70 + 30).toFixed(2) + "%";
    p.style.opacity = (_seedRng() * 0.4 + 0.35).toFixed(2);
    p.style.transform = `scale(${(_seedRng() * 0.8 + 0.5).toFixed(2)})`;
    container.appendChild(p);
  }
});

// Drift each particle upward with seeded sway, fade out near scene end
let _pidx = 0;
document.querySelectorAll('.particle').forEach((p) => {
  const scene = p.closest(".scene");
  if (!scene) return;
  const start = parseFloat(scene.dataset.start || "0");
  const dur = parseFloat(scene.dataset.duration || "5");
  const r = _mulberry32(200 + _pidx++);
  const rise = -(r() * 280 + 180);
  const sway = (r() - 0.5) * 90;
  const delay = r() * (dur * 0.25);
  tl.to(p, { y: rise, x: sway, duration: dur - delay, ease: "sine.out" }, start + delay);
  tl.to(p, { opacity: 0, duration: Math.min(0.9, dur * 0.25), ease: "power1.out" },
    start + dur - Math.min(0.9, dur * 0.25));
});
```

The seeded PRNG ensures deterministic frames — same particle positions every render, no flicker between frames. Critical for the "no `Math.random()`" rule.

---

## 5b. Light beam sweep (long scenes)

A diagonal soft beam crosses the canvas once per scene. Used on the longest calm scene (typically Scene 3 features) to add motion without distracting from content.

```html
<div id="<scene>-beam" class="light-beam"></div>
```

```css
.light-beam {
  position: absolute; inset: -50px;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(100deg,
    transparent 0%, transparent 38%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 62%, transparent 100%);
  filter: blur(40px);
  transform: translateX(-110%);
  mix-blend-mode: soft-light;
}
```

```js
tl.fromTo("#<scene>-beam",
  { x: "-110%" },
  { x: "110%", duration: <scene-duration * 0.6>, ease: "power1.inOut" },
  <scene-start + 0.1>);
```

---

## 5c. Paper-grain drift (light scenes)

The existing `.paper-grain` (subtle dot pattern) on cream scenes — animate its background-position to give it slow organic motion.

```js
document.querySelectorAll('.paper-grain').forEach((grain) => {
  const scene = grain.closest(".scene");
  const start = parseFloat(scene.dataset.start || "0");
  const dur = parseFloat(scene.dataset.duration || "5");
  tl.fromTo(grain,
    { backgroundPosition: "0px 0px" },
    { backgroundPosition: "26px 26px", duration: dur, ease: "none" },
    start);
});
```

Drift distance = one tile (`26px`). Slow, perceived only subliminally.

---

## What NOT to do

- **Don't add particles to cream/light scenes** — they compete with text instead of adding depth. Reserve for dark/brand-color scenes.
- **Don't push-in faster than `1.0 → 1.04`** — anything more becomes obvious zoom and looks amateur.
- **Don't stack film-grain over film-grain** — one global layer is enough. More just blurs.
- **Don't animate the film-grain `opacity`** — keep it constant (around `0.08`) so it reads as texture, not a flicker.
- **Don't apply atmospheric layers while iterating layout** — they hide spacing/typography problems. Polish AFTER content lock.
- **Don't go above `0.22` music bed volume under narration** — it eats consonants and the voice loses authority.

---

## Render cost

Adding the full polish stack roughly **5×s the render time** on this box (1m → 5m for 30s vertical). Worth it for a finished promo; consider toggling off some layers (particles, film grain) during iteration loops where you're checking layout.

---

## What's still missing (parking lot)

- **Color grade per-scene** — slight tint shifts (cooler hook → warmer brand → neutral features → warm proof → branded CTA). Currently every scene uses the same flat palette.
- **Subtle camera shake on whip transitions** — adds visceral impact. Not yet implemented.
- **Light leak flash** during whips — coloured wash on the moment of cut.
- **Audio-reactive bass-thump** under reveals — sub-frequency woof on key entrances.
- **Match-cut** transitions that morph one element across scenes.

These are next-pass candidates, not required for "video feel".

---

## SECTION 9 — copy-and-script.md (tone / copy rules — for context awareness)

# Playbook — Copy & Script

How to write narration and on-screen copy for HyperFrames promos. Hard rules, patterns that land, and the things that have bitten us.

---

## Hard rules (non-negotiable)

### Never invent facts about real brands
**No fake stats, sources, quotes, testimonials, dates, or numbers.** If a fact isn't verifiable from a primary source the user has pointed to (their site, a doc they shared, a public dataset), don't write it.

Bit us once: an early Claim Mate promo contained "1 in 3 ACC claims declined", "MBIE review 2024", "2,400 Kiwis helped", "twelve thousand dollar average outcome". User caught it — none were verified. Cost a re-script.

**If verified stats aren't available, replace numbers with brand voice.** Examples:
- ❌ "1 in 3 ACC claims declined" → ✅ "A decline isn't the end."
- ❌ "12,000 dollar average outcome" → ✅ "We turn no into a path forward."
- ❌ "Trusted by 50,000 Kiwis" → ✅ "Built for the way New Zealanders live."

For verbatim copy from the brand's own site, that's allowed and encouraged — quote them directly. See "Brand extraction" below.

### No Māori / te reo words in TTS narration
Edge TTS (and most neural TTS) butcher Māori pronunciation, undermining the authenticity those words are meant to add.

Use English equivalents in narration:
- ❌ "Built in Aotearoa" → ✅ "Built in New Zealand"
- ❌ "from Tāmaki Makaurau" → ✅ "from Auckland"
- ❌ "kaupapa" / "whānau" / "kia ora" — drop, paraphrase

**Visual on-screen text CAN still use te reo** — only TTS narration is banned. If the brand uses te reo prominently (e.g. "Aotearoa" appears on their site), put it on-screen as a typeset overlay; have the voice say "New Zealand".

### Don't trust stock asset filenames
Stock site filenames are uploader-chosen, not standardised. `phone-doc.jpg` was actually a stressed woman with hand on forehead (wrong emotional beat). `denied-letter.jpg` was a "SPECIAL OFFER" stamp.

Always extract a preview frame and read the asset before placing:
```bash
ffmpeg -ss 0.5 -i <file> -frames:v 1 preview.jpg
```
Then use the Read tool on the JPG. Especially dangerous for emotionally-coded scenes where the wrong beat undermines the message.

---

## Verbatim brand copy — the gold standard

When pitching a real brand, **the brand's own website copy is the safest, most on-tone source you have**. Extract it via:

```bash
curl -sL <url> > /tmp/raw.html
grep -oE '<(title|h1|h2|h3)[^>]*>[^<]+</\1>' /tmp/raw.html
grep -oE '<meta name="description" content="[^"]+"' /tmp/raw.html
```

Then capture the verbatim hero/tagline/feature lines into `DESIGN.md` under a "Verbatim copy" section. Use these directly — invent nothing.

Worked on Kindred (2026-04-25): Hero "Share with neighbours. Find local help." · Tagline "The community app powered by kindness." · Three actions verbatim from the app: "Give what you've got." / "Ask for what you need." / "Find local help." Every line traceable back to kindred-nz.org.

---

## Copy-for-TTS rules

### Acronyms — write the dots
Plain `ACC` might read as "ack" on some voices; `A.C.C.` reads letter-by-letter on every voice. Same for `M.B.I.E.`, `I.R.D.`, `N.H.S.`

### Numbers — spell out
- ❌ "2 minutes" → ✅ "two minutes"
- ❌ "$12,000" → ✅ "twelve thousand dollars"
- ❌ "100%" → ✅ "one hundred percent"

Zero risk across voices. The TTS handles the digits but stumbles on currency symbols and decimals.

### Sentence rhythm
- 12–18 words is the sweet spot for narration sentences
- 6–8 words for emphasis beats — short bursts that punch ("No money. No ads. No algorithm.")
- Read aloud yourself first — if you stumble, the TTS will too

### What to avoid in narration
- Back-to-back `-tion` words (liaison → decision → compensation = unnatural liaison)
- Long parentheticals — break them into short sentences
- Foreign words the voice won't know — substitute or write phonetically
- Em-dashes in long sentences — Edge TTS pause behaviour around `—` is inconsistent (~250ms but variable)

### Pause control via punctuation
Edge TTS pause durations (verified):
- Comma `,` ≈ 180ms
- Period `.` ≈ 350ms
- Em-dash `—` ≈ 250ms (inconsistent)
- **Double line break (paragraph) ≈ 500ms — most reliable**
- Ellipsis `...` is effectively ignored

For a deliberate pause: use a paragraph break (blank line) in the source text, not punctuation tricks.

---

## Script structure that lands

### The 5-beat vertical promo (25–30s, 1080×1920)

Verified on Claim Mate v5 ("Ninety Days") and Kindred ("Share with neighbours"):

1. **Hook (0–3.5s)** — The problem or the question. Text-only or text-led; one bold concept on screen. Examples: "Did A.C.C. decline your injury treatment?" · "Your street's full of useful things."
2. **Brand introduce (3–8s)** — The name, the line, the look. First moment the brand mark appears. Examples: "Claim Mate. Specialist appeal advocacy." · "Kindred. The community app powered by kindness."
3. **What it does (7–17s)** — Three actions, three benefits, three steps. The longest scene; let it breathe. Stagger card entrances to narration sentence boundaries.
4. **Proof / why it matters (16–24s)** — Photo or video carrying the human moment + a tone-bite headline. Examples: "Specialist advocates. No win, no fee." · "No money. No ads. No algorithm. Just local."
5. **CTA (24–29s)** — Wordmark, URL, fine print, action pill. Final scene = only place exits / fade-outs are allowed.

Crossfade overlaps: 0.5s between scenes. No jump cuts.

### Scroll-stopping hooks

For TikTok/Reels-format vertical, the first 1–2 seconds decide whether the viewer scrolls. Worked on Claim Mate v4:
- Text-only hook scene (no photo) with bold stacked typography
- One word at hero size (280px+) anchored canvas-centre
- Overlay element (DENIED stamp / question mark / red X) slams in at t≈1.0s
- Then cut to the photo/video that grounds the problem

The hero word doesn't have to be the brand — it's the **emotional anchor**. ACC. NINETY. NEIGHBOURHOOD. KINDNESS. Make it the thing the viewer's brain locks onto.

---

## Hybrid composition — the user's standing preference

The user prefers compositions that **mix real-world visuals with HTML/CSS information layers**. Not pure-stock (just a montage), not pure-HTML (motion-graphics with no soul). The blend is what lands.

**Rule of thumb:** every scene should have at least one real-world visual grounded in stock AND at least one HTML overlay carrying information or brand cue. If a scene is all one or all the other, flag it as intentional or fix it.

| Layer | Carries | Examples |
|---|---|---|
| Stock photo / video | Human, emotional, real-world | stressed person, hands typing, phone in hand, workspace, exterior shot |
| HTML/CSS overlay | Information, brand, structure | DENIED stamp, step cards 01/02/03, data reveals "90 DAYS" / "$0", brandmarks, CTA wordmarks, legal strips |
| Brand SVG | Hero brand moment | logo with built-in SMIL animation, played via `<img>` |

Confirmed on v5 "Ninety Days": neither pure-stock nor pure-HTML — the blend was what landed. Default to this hybrid unless the brief explicitly calls for cinematic-only or pure-type.

---

## Script generation workflow

1. **Read the brand's site / `DESIGN.md`** for verbatim copy and tone-of-voice.
2. **Identify the emotional anchor** — what one feeling does this video need to leave the viewer with? "You're not stuck." "You're not alone." "Your neighbours have got you."
3. **Write the 5-beat outline first** — one line per scene. Don't write narration yet.
4. **Write narration scene-by-scene**, hitting the word-count budgets above. Read each line aloud.
5. **Run TTS first** ([playbooks/tts-and-narration.md](tts-and-narration.md)) — get measured duration before sizing scenes.
6. **Adjust narration if it's >30s** — trim parentheticals, shorten sentences, drop adjectives.
7. **Lock the script.** Don't rewrite mid-render — fix in next version.

---

## Tone-bite library (reusable phrases)

Phrases that test well with NZ-targeted brand promos. Verified to read cleanly in Edge TTS en-NZ-Molly / en-AU-William:

- "A decline isn't the end."
- "You're not alone."
- "No money. No ads. No algorithm. Just local."
- "Specialist advocates. No win, no fee."
- "Free for every street in New Zealand."
- "Built for the way New Zealanders live."
- "We turn no into a path forward."

Avoid for now:
- Anything with "Aotearoa", "kia ora", "whānau" (Māori words — see hard rules)
- "Game-changing", "revolutionary", "disruptive" — corporate-pitch slop
- "We're a bunch of..." — anything self-deprecating that undercuts the brand
- Numbers without source (see hard rules)

---

## When the user gives feedback on copy

Listen carefully to two specific patterns:

1. **"Make it more conversational"** → drop the corporate verbs (provide, deliver, leverage), shorten sentences, contract auxiliaries (you've, we'll, they're), end on a sentence with one syllable.
2. **"More authoritative"** → switch voice (en-AU-William over en-AU-Mitchell), reduce ellipses, end statements with periods not questions, drop modifiers (very, really, just, simply).

Both happened on Claim Mate v4. Both worked.

---


---

## OUTPUT FORMAT — what you return for EACH brief

For every brief you design, return:

1. **Heading** — `### [BRIEF ID] — [BRIEF NAME]` (e.g. `### BRIEF 17 — Stat Hero`)
2. **HTML block** — semantic markup, BEM classes (`.cardname` / `.cardname__element`)
3. **CSS block** — uses ONLY `var(--card-*)` tokens; light AND dark mode variants
4. **Visual STATES** as separate static classes if the brief has them
5. **Motion intent** — one or two lines in plain English
6. **Token usage report** — which tokens used; flag any missing

Use `---` between briefs to keep your output parseable.

---

## YOUR JOB — design EVERY brief in the library below

You're being given the COMPLETE library spec — 8 transitions, 240 effects, 146 cards. Design every single one of them following the contract.

**Pacing rule:** if your response would exceed your output-token budget, finish what you can in this turn and end with:

```
=== PAUSED AT [BRIEF ID] — RESUME HERE NEXT ===
```

I'll send "continue" and you pick up from the next brief. Don't summarize / skip / abbreviate — every brief gets a full design treatment.

**Order:** work through transitions first (T01-T08), then effects (E01-E240), then cards (BRIEF 01-146). Stop only when you've done all 394 or hit limits.

**Skip rule:** if a brief's design direction doesn't make sense within the contract, flag it explicitly with `### [BRIEF ID] — SKIPPED: [reason]` and move on. Don't fabricate to fill space.

---

# THE COMPLETE BRIEF LIBRARY (work through every entry below)

# Card Briefs for Claude Design — copy-paste ready

30+ pre-written prompts covering the complex-card categories from [claude-design-card-workflow.md](claude-design-card-workflow.md). Each brief produces a brand-agnostic, mobile-video-sized card pattern that drops into our Website-to-Video pipeline.

---

## How to use

1. **First brief of the session** — paste the **PREAMBLE** + **BRIEF #1** together so Claude Design has the full contract.
2. **Subsequent briefs in the same session** — paste just the brief; Claude Design retains the preamble's contract from earlier in the conversation.
3. **New session?** — paste the preamble again (it's session-scoped context).
4. After Claude Design returns the bundle, send it back to Claude Code (in this terminal) with: *"Add this card to the library: [paste bundle]"*. Claude Code will lint, wrap with HyperFrames glue, wire the motion, and append to [cards-library.md](cards-library.md).

---

## PREAMBLE (paste once per Claude Design session)

```
PROJECT: aivideomaker — HyperFrames Website-to-Video pipeline (vertical mobile video).
DESIGN SYSTEM: design/cards.css + design/tokens-<brand>.css. Read both before designing.
PRIOR ART: docs/playbooks/cards-library.md (every card uses tokens; same patterns.)
CONTRACT: docs/playbooks/claude-design-card-workflow.md (read the "hard contract" section).

FRAME: fixed 1080×1920 portrait (9:16 mobile video, NOT a responsive web page).
NO @media queries. NO breakpoints. NO viewport units (vh / vw). NO :hover. NO transitions.
NO @keyframes. NO animation: declarations. NO motion code at all — Claude Code wires GSAP after handoff.

TYPE SCALE (video readability — viewer is on a phone arm's-length away):
- Hero/display: 100-200px
- Sub-headline: 60-100px
- Body: 32-48px (NEVER below 28px)
- Kicker/micro: 22-32px ALL CAPS with letter-spacing (NEVER below 22px)
- Floor: 22px. Anything smaller = restructure.

TOKENS — use ONLY these vars; zero literal hex / font names:
- Colours: var(--card-navy), var(--card-paper), var(--card-paper-soft), var(--card-accent),
  var(--card-slate), var(--card-slate-ink), var(--card-warn), var(--card-ok)
- Fonts: var(--card-font-display), var(--card-font-ui), var(--card-font-mono)
- Radii: var(--card-r-sm), var(--card-r-md), var(--card-r-lg)

LIGHT-BG and DARK-BG variants required: every card supports both via [data-mode="dark"]
class swap. Default targets light bg (cream); [data-mode="dark"] swaps to dark bg
(brand-color/teal/navy).

OUTPUT FORMAT — every brief returns:
1. HTML markup (semantic, BEM-style classes: .cardname / .cardname__element / .cardname--variant)
2. CSS using only var(--card-*) tokens, with light AND dark mode variants
3. Visual STATES if the card has them (default / is-active / is-exited) as static classes
4. ONE-LINE MOTION INTENT in plain English (e.g. "stagger fade-up, 0.12s offset, back.out(1.4)")
5. Token usage report — list which tokens you used; flag any you wished existed

DO NOT generate copy or stats — use placeholder text. Do not use external URLs / images.
```

---

## TRANSITIONS & EFFECTS — author these first

Same hard contract as cards (token-only CSS, no motion code, fixed 1080×1920, video type scale).
Claude Design designs the **visual states** + writes **motion intent in prose**; Claude Code
translates intent into GSAP within HyperFrames constraints.

For transitions, design TWO STATES — outgoing scene's exit posture + incoming scene's entry
posture. For effects, design the static visual layer + describe how it should move.

---

### BRIEF T01 — Iris In/Out Transition
```
TRANSITION: Camera-shutter iris (closes to centre, opens from centre)
USE BETWEEN: scene-end → scene-start
PLACEHOLDER STATES:
  outgoing-end: full frame visible
  iris-closed: full frame covered by overlay; small circular reveal at centre or fully closed
  incoming-start: small circular reveal at centre, then expands to full frame
DESIGN DIRECTION: a circular mask / clip-path centred on canvas. State 1 has full frame visible.
  State 2 has the mask circle at radius 0 (frame fully covered by an overlay in brand-deep
  colour). Transitional radius interpolates between.
MOTION INTENT: outgoing — circular mask shrinks from full frame to centre 0 (0.5s, power3.in).
  Hold black for 1 frame. Incoming — circular mask grows from centre 0 to full frame
  (0.5s, power3.out). Total 1.0s.
```

### BRIEF T02 — Liquid Morph Transition
```
TRANSITION: Gooey liquid blob morphs between scenes
USE BETWEEN: any scene boundary, particularly playful/community brands
PLACEHOLDER STATES:
  outgoing-end: full frame visible
  morph-cover: organic blob shape in brand-accent fills frame from one edge inward
  incoming-start: blob retreats revealing incoming scene
DESIGN DIRECTION: design a SVG blob shape that organically expands from one edge of frame
  (e.g. bottom-right corner) to cover the entire frame. Shape has soft, irregular curves
  (not a perfect circle). Brand-accent fill.
MOTION INTENT: blob expands from corner via SVG path morphing or scale + position
  (0.6s, power2.inOut). Hold full coverage 0.1s. Reverse retreat into opposite corner.
```

### BRIEF T03 — Page Turn / Paper Flip
```
TRANSITION: Paper page turning to reveal next scene
USE BETWEEN: editorial / heritage / book-aesthetic scenes
PLACEHOLDER STATES:
  outgoing-end: full frame visible
  turning: page caught mid-flip with cream-paper back showing, slight perspective
  incoming-start: full frame of incoming scene visible
DESIGN DIRECTION: design the "back of the page" state — a cream-paper overlay with a curl/fold
  at one edge, slight shadow underneath. The turn happens in 3D perspective (rotateY).
MOTION INTENT: page rotates around its left edge from 0° → 180° (0.7s, power2.inOut), with
  the second half revealing the back of the page (cream paper) before the next scene shows.
```

### BRIEF T04 — Glitch Transition
```
TRANSITION: Digital glitch / VHS tracking error
USE BETWEEN: tech / kinetic / sci-fi scenes
PLACEHOLDER STATES:
  outgoing-end: full frame
  glitching: 3-4 horizontal slices of the frame offset by random distances; chromatic
    aberration with red/cyan offset
  incoming-start: glitch resolves to clean incoming frame
DESIGN DIRECTION: design the glitch state — frame split into horizontal slices (each 100-200px
  tall), each slice translated horizontally by varying amounts. Add red and cyan duplicate
  layers offset slightly (chromatic aberration). Optional digital noise overlay.
MOTION INTENT: rapid sequence of glitch frames (5-8 different glitch states in 0.3s),
  resolving to clean incoming. Use seeded PRNG for slice offsets.
```

### BRIEF T05 — Light Flash / Strobe Transition
```
TRANSITION: Quick bright flash between scenes
USE BETWEEN: dramatic moments, music-driven cuts
PLACEHOLDER STATES:
  outgoing-end: full frame
  flash: full-frame white or accent-coloured wash at peak brightness
  incoming-start: frame visible after flash dissipates
DESIGN DIRECTION: design the flash overlay — a full-frame solid colour (white or brand-accent)
  that briefly covers everything. Optional radial gradient suggesting a focal flash centre.
MOTION INTENT: overlay opacity 0 → 1 in 0.08s (instant), holds 0.05s, fades to 0 in 0.25s
  (power3.out). Total 0.4s. Use as accent — pair with audio kick.
```

### BRIEF T06 — Blur-and-Clear Transition
```
TRANSITION: Outgoing scene blurs heavily, incoming scene unblurs
USE BETWEEN: dreamy / contemplative / Quiet Premium scenes
PLACEHOLDER STATES:
  outgoing-end: full frame
  blurred: full frame visible but heavy gaussian blur applied (filter: blur(40px))
  incoming-start: incoming frame visible but heavy blur, resolving to sharp
DESIGN DIRECTION: this transition uses CSS filter: blur() on whole scenes. Design the
  state that suggests "out of focus" but otherwise composed.
MOTION INTENT: outgoing scene's blur 0px → 40px while opacity 1 → 0 (0.5s, power2.in).
  Incoming scene's blur 40px → 0px while opacity 0 → 1 (0.5s, power2.out).
```

### BRIEF T07 — Mosaic / Pixel Breakup
```
TRANSITION: Frame breaks into mosaic tiles that swap
USE BETWEEN: kinetic / pop-art / tech scenes
PLACEHOLDER STATES:
  outgoing-end: full frame
  breakup: frame divided into 8x14 grid of equal-size rectangles, each tile rotated/scaled
    individually
  incoming-start: rectangles return to flat with incoming content
DESIGN DIRECTION: design the breakup state — a grid of small rectangles, each at a slight
  random rotation (use seeded PRNG for determinism). Some tiles may have brief "missing"
  state (fully transparent).
MOTION INTENT: tiles cascade — each rotates from 0° to randomised offset (max ±20°), with
  stagger across the grid, then reverses to incoming content (0.6s, power2.inOut total).
```

### BRIEF T08 — Camera Shake + Flash Transition
```
TRANSITION: Frame shakes briefly with a flash, settling on incoming
USE BETWEEN: dramatic / impact / kinetic moments
PLACEHOLDER STATES:
  shake: frame at random offset positions over 6-8 keyframes
  flash: white/accent flash at peak shake
  settled: incoming scene at rest
DESIGN DIRECTION: just describe the offset / flash; visual is mostly motion-driven.
MOTION INTENT: outgoing scene shakes 6-8 random offsets (max ±20px) over 0.25s, then
  flash overlay 0 → 1 → 0 over 0.15s, then incoming scene settles in.
```

---

## EFFECTS (within-scene ambient layers)

### BRIEF E01 — Brand-Color Glow on Text
```
EFFECT: Subtle glow around hero text / wordmark
PURPOSE: emphasis on a key element without visual noise
WHERE IT FITS: ALL stacks — adjusted intensity per stack
PLACEHOLDER: a hero word with a soft accent-coloured glow
DESIGN DIRECTION: design the static glow state — multiple layered text-shadows or filter
  drop-shadow with brand-accent colour at varying blur radii (8px, 16px, 32px). Effect is
  CSS-static; intensity varies per stack:
  - Warm Community: subtle (small blur, low opacity 0.3)
  - Kinetic Pop: dramatic (large blur, high opacity 0.7)
  - Documentary: minimal or absent
  - Quiet Premium: barely-there atmospheric only
MOTION INTENT: glow can pulse — opacity 0.4 → 0.7 → 0.4 cycling (sine, slow, finite repeats
  scaled to scene duration).
```

### BRIEF E02 — Sparkle / Glitter Overlay
```
EFFECT: Small sparkle / star elements drift across frame
PURPOSE: warmth / playfulness / celebration
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: 8-12 small sparkle/star shapes scattered with seeded positions
DESIGN DIRECTION: small 4-pointed star or sparkle-glyph shapes (~12-20px), accent-colour fill
  with subtle blur. Scattered at seeded positions, varying sizes.
MOTION INTENT: each sparkle has its own twinkle cycle (opacity 0 → 1 → 0 over ~1.5s),
  staggered start times, position drifts upward slowly.
```

### BRIEF E03 — Confetti Burst
```
EFFECT: Confetti pieces falling / bursting from a point
PURPOSE: celebration / win / "yay" moment
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: 30-50 small rectangular / triangular pieces in brand-palette colours
DESIGN DIRECTION: small geometric shapes (~10-30px) in 4-5 brand colours. Mix of
  rectangles, triangles, circles. Arranged around an emanation point at top centre or
  spread across upper half.
MOTION INTENT: pieces fall from top with seeded starting x positions, varied fall speeds,
  rotation as they fall, slight horizontal drift.
```

### BRIEF E04 — Smoke / Mist Layer
```
EFFECT: Soft smoke or mist drifting across lower portion of frame
PURPOSE: atmospheric / mysterious / cinematic
WHERE IT FITS: Quiet Premium, Documentary
PLACEHOLDER: blurred soft-edge shapes drifting horizontally
DESIGN DIRECTION: 3-5 organic blob-shapes with very heavy blur (60-100px), low opacity
  (0.2-0.4), all in muted neutral or accent. Positioned in lower half of frame.
MOTION INTENT: shapes translate horizontally slowly (one direction or alternating),
  slow, sine ease, finite cycles fitting scene duration.
```

### BRIEF E05 — Lens Flare
```
EFFECT: Bright focal flare suggesting a strong light source
PURPOSE: warmth / sun / drama
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: a bright spot at one corner with radiating light streaks + secondary halo dots
DESIGN DIRECTION: design as a stack of: (a) a bright central highlight (radial gradient,
  white-to-transparent), (b) several smaller halo discs along a diagonal line from the
  source, (c) optional thin radial light rays. All in warm-light tone (slightly orange/yellow).
MOTION INTENT: flare drifts slowly across the frame on its diagonal line, optional pulse
  on the central highlight.
```

### BRIEF E06 — Bokeh / Out-of-Focus Circles
```
EFFECT: Blurred circular highlights drifting in background
PURPOSE: depth / lifestyle / cinematic
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: 6-10 soft-edged circles of varying sizes in muted accent colour
DESIGN DIRECTION: circles 30-120px diameter with very heavy blur (40-80px), low-medium
  opacity (0.3-0.6), positioned at various depths (varying sizes suggest depth).
  Background only (z-index below content).
MOTION INTENT: circles drift slowly in random directions, varying speeds, fade in/out
  cycle, finite repeats.
```

### BRIEF E07 — Old Film Scratches & Dust
```
EFFECT: Random vertical scratches and dust specks (analog-film aesthetic)
PURPOSE: nostalgic / heritage / film-camera moment
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: 3-5 vertical hairline scratches + ~10 dust specks scattered
DESIGN DIRECTION: thin vertical lines (1-2px wide, 200-1000px tall) at varying positions
  across frame, slight off-vertical angles. Plus small irregular dust spots (~3-8px) scattered.
  Both white and dark variants for contrast against any bg.
MOTION INTENT: scratches flicker on/off intermittently (each scratch visible for 1-2 frames
  at irregular intervals), dust specks twinkle.
```

### BRIEF E08 — Sun-Beam / God-Rays
```
EFFECT: Diagonal light rays streaming from one corner
PURPOSE: hopeful / awakening / reveal moment
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER: 4-6 diagonal light rays emanating from top-left corner
DESIGN DIRECTION: long thin diagonal gradient bands (each 30-80px wide), white-to-transparent
  alpha gradients, very heavy blur (40-60px), low opacity. Source at top-left, beams angle
  down-right.
MOTION INTENT: beams slowly translate across frame (one direction), opacity gently breathes,
  finite cycles.
```

---

## WEATHER & ATMOSPHERIC

### BRIEF E09 — Rain Falling
```
EFFECT: Vertical rain streaks falling across frame
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: 30-50 thin diagonal lines (1-2px wide, 60-120px tall) at slight angle (15-20°
  from vertical), light-blue or white with subtle blur, varying opacities and lengths.
  Use seeded PRNG for positions.
MOTION INTENT: streaks translate diagonally downward continuously; finite cycles. New
  streaks spawn at top as old ones leave at bottom (looped via finite repeat).
```

### BRIEF E10 — Snow Falling
```
EFFECT: Snowflakes drifting downward
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 25-40 small white circles (4-12px varying sizes) with subtle blur, scattered at
  seeded positions across upper frame. Some have 6-pointed snowflake glyphs instead.
MOTION INTENT: each flake drifts down with horizontal sway (sine), varied speeds;
  finite cycles spanning scene duration.
```

### BRIEF E11 — Falling Leaves
```
EFFECT: Autumn leaves drifting down
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 12-18 stylised leaf shapes (simple SVG silhouettes — maple, oak, generic) in warm
  tones (orange, ochre, deep red). Varying sizes 30-80px, varying initial rotations.
MOTION INTENT: leaves drift down with horizontal sway + rotation, varied speeds.
```

### BRIEF E12 — Cherry Blossom Petals
```
EFFECT: Pink petals drifting across frame
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 15-25 small pink/cream petal shapes (simple oval-with-notch SVG), varying sizes
  20-50px. Pastel pinks and creams.
MOTION INTENT: petals drift diagonally with rotation, slight scale variation, finite cycles.
```

### BRIEF E13 — Stars Twinkling
```
EFFECT: Star field with subtle twinkle
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: 30-50 small star shapes (4-pointed sparkle or simple dot) at seeded positions
  across frame. Varying brightness levels. Optional: 2-3 larger "hero" stars.
MOTION INTENT: each star pulses opacity 0.3 → 1 → 0.3 with offset cycles; subtle scale.
```

### BRIEF E14 — Fog / Mist Roll
```
EFFECT: Soft fog drifting horizontally
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: 3-5 large soft-edged blob shapes with heavy blur (80-120px), low opacity (0.15-0.3),
  in muted neutral. Positioned across mid and lower frame.
MOTION INTENT: blobs translate horizontally (slow, ~scene-length traversal), opacity breathes.
```

### BRIEF E15 — Cloud Drift
```
EFFECT: Subtle clouds moving across upper frame
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 3-4 cloud-shaped soft blob clusters in upper third of frame, white/cream with light
  shadow, varying sizes 200-500px wide. Heavy blur edges.
MOTION INTENT: clouds drift horizontally one direction, very slow, subtle scale breathing.
```

### BRIEF E16 — Heat Shimmer
```
EFFECT: Wavy distortion suggesting heat rising
WHERE IT FITS: Documentary
DESIGN: design a horizontal wavy line pattern overlay (like undulating sine waves) in lower
  third of frame, with very low opacity, slight brand-warm tint.
MOTION INTENT: the wavy pattern translates upward slowly, suggesting heat rising; subtle
  warp displacement on whatever's behind it (CSS filter trick).
```

### BRIEF E17 — Lightning Flash
```
EFFECT: Brief sky-flash with optional lightning bolt
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: design TWO STATES — full bright flash overlay (white/cyan) covering frame at peak,
  + a stylised lightning-bolt SVG path (jagged Z-shape) optionally visible at peak.
MOTION INTENT: instant flash 0 → 1 in 0.06s, holds 0.04s, fades 0.3s. Bolt can flash visible
  for 1 frame at peak.
```

### BRIEF E18 — Sun Rays Through Clouds
```
EFFECT: Diagonal sunbeams breaking through cloud cover
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: cloud shapes in upper half (similar to E15) with 4-6 narrow diagonal light rays
  emerging from between/behind them — gradient bands fading from bright at source to
  transparent. Warm-light tint.
MOTION INTENT: rays slowly translate (sun moving across sky), brightness pulses gently.
```

---

## TEXTURE & PATTERN OVERLAYS

### BRIEF E19 — Halftone Dots Overlay
```
EFFECT: Halftone (printing-style) dot pattern overlay
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: dot pattern overlay (CSS radial-gradient or repeating background-image) covering
  the full frame, low opacity (0.08-0.12). Dot density can vary across the frame for
  print-aesthetic feel.
MOTION INTENT: pattern drifts slowly diagonally; alternatively static and ambient.
```

### BRIEF E20 — Crosshatch / Hatching Pattern
```
EFFECT: Diagonal cross-hatching texture
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: diagonal line pattern (CSS repeating-linear-gradient) at 45° AND -45° creating
  crosshatch texture. Very low opacity (0.05-0.10), neutral colour. Adds drawing/etched feel.
MOTION INTENT: subtle drift in one diagonal direction, very slow.
```

### BRIEF E21 — Topographic / Contour Lines
```
EFFECT: Topographic map contour lines overlay
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: organic curving contour lines (SVG paths) creating a topographic-map pattern.
  Hairline strokes, subtle accent or muted colour, low opacity (0.10).
MOTION INTENT: lines slowly shift / morph (or translate diagonally for static feel).
```

### BRIEF E22 — Dot Grid Overlay
```
EFFECT: Regular dot grid pattern (paper notebook aesthetic)
WHERE IT FITS: Documentary, Warm Community
DESIGN: regular grid of small circular dots (1-2px each, 24-32px spacing) in muted neutral.
  Already used in our paper-grain — but standalone with stronger presence here.
MOTION INTENT: subtle drift (already wired for paper-grain) for organic motion.
```

### BRIEF E23 — Diagonal Stripes Overlay
```
EFFECT: Diagonal stripe pattern
WHERE IT FITS: Kinetic Pop
DESIGN: thick diagonal stripes (30-50px wide bands) alternating between two brand colours
  at 45°. Used as accent banner or aggressive bg element.
MOTION INTENT: stripes translate diagonally creating "barber pole" infinite-scroll feel
  (finite-cycle repeat).
```

### BRIEF E24 — Watercolor Wash
```
EFFECT: Soft watercolor-like organic shape behind content
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 1-3 organic blob shapes with very heavy blur (60-120px), low opacity (0.20-0.40),
  in brand-accent or warm tones. Looks like a watercolor wash bleed.
MOTION INTENT: shapes breathe slowly (scale 1.0 → 1.05) and shift position gently.
```

### BRIEF E25 — Grunge / Distressed Overlay
```
EFFECT: Grunge texture suggesting wear / age
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: an SVG turbulence-noise pattern with high contrast applied as overlay, low opacity
  (0.08-0.15), suggesting distressed paper / worn surface. Existing film-grain CSS uses
  similar technique — this is a stronger / more textural version.
MOTION INTENT: pattern drifts subtly; alternatively static.
```

### BRIEF E26 — Wood Grain Texture
```
EFFECT: Wood-grain background texture
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: stylised wood-grain pattern using SVG curves or CSS gradients, in warm brown tones.
  Very low opacity (0.08), subtle.
MOTION INTENT: static or very subtle drift.
```

### BRIEF E27 — Marble Texture
```
EFFECT: Veined marble background texture
WHERE IT FITS: Quiet Premium
DESIGN: white/cream base with thin grey/charcoal vein lines (organic curves) running across.
  Low contrast, premium / luxurious feel.
MOTION INTENT: static (marble is a still surface).
```

---

## GEOMETRIC PATTERNS

### BRIEF E28 — Sacred Geometry / Mandala
```
EFFECT: Mandala / sacred-geometry pattern centred behind content
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: complex symmetric geometric design — concentric circles + radial divisions + petal
  shapes — centred on canvas. Hairline strokes only, low opacity (0.08-0.15), in accent.
MOTION INTENT: slow rotation (3-5°/s) provides ambient meditative motion.
```

### BRIEF E29 — Sine Wave Pattern Background
```
EFFECT: Multiple sine waves layered as background pattern
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: 3-5 horizontal sine waves at varying frequencies + amplitudes, stacked vertically.
  Hairline strokes in accent or muted, low opacity (0.10-0.20).
MOTION INTENT: waves shift horizontally at varying speeds creating subtle interference patterns.
```

### BRIEF E30 — Concentric Circles Ripple
```
EFFECT: Expanding concentric circles (ripple from a point)
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: 4-6 concentric circles (hairline strokes) emanating from a central point. Each
  circle at progressively larger radius with decreasing opacity outward.
MOTION INTENT: circles continuously expand from centre, fade as they reach max radius;
  finite cycles overlapping for ripple effect.
```

### BRIEF E31 — Hex Grid Pattern
```
EFFECT: Hexagonal grid pattern overlay
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: regular tessellation of hexagons covering frame, hairline strokes in muted accent,
  low opacity (0.10).
MOTION INTENT: subtle drift; alternatively certain hexagons highlight in cascading pattern.
```

### BRIEF E32 — Fibonacci / Golden Spiral
```
EFFECT: Mathematical spiral pattern
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: a golden-ratio spiral curve (logarithmic spiral) drawn from one corner, hairline
  stroke in accent.
MOTION INTENT: spiral slowly draws via stroke-dashoffset over scene duration.
```

---

## KINETIC TYPOGRAPHY EFFECTS

### BRIEF E33 — Glitch Text Overlay
```
EFFECT: Text with glitch / VHS distortion
WHERE IT FITS: Kinetic Pop
DESIGN: design a hero word in three layered states — base text + red-shifted duplicate
  offset 4-6px right + cyan-shifted duplicate offset 4-6px left (chromatic aberration).
  Text in heavy display.
MOTION INTENT: chromatic offsets randomly shift positions (seeded PRNG), text occasionally
  splits horizontally, brief moments of clean rest, finite irregular cycles.
```

### BRIEF E34 — Static Noise Text
```
EFFECT: Text overlaid with TV-static / noise pattern
WHERE IT FITS: Kinetic Pop
DESIGN: hero word with a noise-pattern overlay applied to letterforms only (using
  background-clip: text on a noise SVG background image).
MOTION INTENT: noise pattern drifts behind/inside the text continuously; finite cycles.
```

### BRIEF E35 — Wobble Text
```
EFFECT: Text with subtle hand-drawn wobble
WHERE IT FITS: Warm Community
DESIGN: design hero text with each letter at slight rotation offset (-3° to +3°) and tiny
  vertical position variations. Suggests handwritten / imperfect feel.
MOTION INTENT: rotations and offsets continuously cycle in subtle ranges, like hand-shaking
  drawing — slow, finite cycles.
```

### BRIEF E36 — Wave Text (Rolling Letters)
```
EFFECT: Letters of a word riding a sine wave
WHERE IT FITS: Kinetic Pop
DESIGN: hero word with each letter individually positioned along an invisible sine curve,
  varying y-offsets per letter.
MOTION INTENT: sine wave translates horizontally so the wave appears to roll through the
  letters; finite cycles.
```

### BRIEF E37 — Typewriter Cursor Blink
```
EFFECT: Typewriter cursor at end of text
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: a vertical bar | (1-3px wide, full text height) appended after the last character
  of a hero phrase, in accent colour.
MOTION INTENT: cursor blinks (opacity 1 → 0 → 1) on a 0.5s cycle, finite repeats.
```

### BRIEF E38 — Letterpress Impression Text
```
EFFECT: Hero text with letterpress / pressed-into-paper feel
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: hero word with offset drop-shadows simulating debossed (pressed-in) effect — a
  light highlight on top edge + dark shadow on bottom edge of letterforms.
MOTION INTENT: text "presses in" once on entrance — quick scale 1.05 → 1.0 with shadows
  forming, then static.
```

---

## PARTICLE VARIANTS

### BRIEF E39 — Bubble Drift
```
EFFECT: Bubbles drifting up
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 15-25 transparent circular bubbles of varying sizes (10-50px) with subtle
  highlight/shine on each (white circle inside).
MOTION INTENT: bubbles rise from bottom with horizontal sway, varied speeds; finite cycles.
```

### BRIEF E40 — Money / Paper Rain
```
EFFECT: Banknotes / paper rain falling
WHERE IT FITS: Kinetic Pop
DESIGN: 20-30 small rectangular shapes (40-80px wide, 20-40px tall) in green/grey suggesting
  banknotes, scattered across upper frame. Subtle currency-symbol detail.
MOTION INTENT: notes fall with rotation, varied speeds, slight horizontal drift.
```

### BRIEF E41 — Heart Drift
```
EFFECT: Hearts floating up
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 15-25 small heart shapes (varying sizes 20-60px) in warm tones (red/pink/coral).
  Some filled, some outline-only.
MOTION INTENT: hearts rise from bottom with sway and slight rotation; finite cycles.
```

### BRIEF E42 — Star Burst
```
EFFECT: Stars exploding outward from a point
WHERE IT FITS: Kinetic Pop
DESIGN: 12-20 star/sparkle shapes emanating from a central point at varying angles + distances.
MOTION INTENT: stars expand outward from origin (translate + scale + opacity fade), single
  burst on entry then settle.
```

### BRIEF E43 — Floating Orbs
```
EFFECT: Soft glowing orbs drifting through frame
WHERE IT FITS: Quiet Premium, Kinetic Pop
DESIGN: 8-12 soft-glow circular shapes (40-80px) with radial gradient (bright centre, fading
  outward), in accent colour.
MOTION INTENT: orbs drift in random directions slowly with sine ease, opacity breathes.
```

### BRIEF E44 — Magic Sparkles Trail
```
EFFECT: Sparkle trail following an invisible path
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: 8-12 small 4-pointed sparkles distributed along a curving invisible path across frame.
MOTION INTENT: sparkles spawn sequentially along the path, each twinkling and fading;
  Claude Code wires the path-following.
```

### BRIEF E45 — Embers / Ash Floating
```
EFFECT: Glowing embers or ash particles drifting up
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: 20-30 tiny dots (3-6px) in warm tones (orange/red/cream) with slight glow,
  positioned across frame.
MOTION INTENT: embers rise slowly with subtle horizontal drift, opacity flickers, varied speeds.
```

---

## CAMERA EFFECTS

### BRIEF E46 — Camera Shake (Idle)
```
EFFECT: Subtle low-frequency camera shake
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: pure motion-only effect; no static visual to design. Apply to scene wrapper.
MOTION INTENT: scene wrapper translates ±2-4px in x and y at low frequency (sine, 0.5-2 Hz),
  finite cycles. Adds documentary/handheld-feel realism.
```

### BRIEF E47 — Handheld Jitter
```
EFFECT: Stronger handheld-camera motion
WHERE IT FITS: Documentary
DESIGN: pure motion. Stronger than E46.
MOTION INTENT: scene wrapper jitters at higher frequency with seeded variation
  (±6-10px irregular shifts), continues throughout scene.
```

### BRIEF E48 — Dolly Zoom / Vertigo Effect
```
EFFECT: Camera moves toward subject while zoom widens (Vertigo / Hitchcock zoom)
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: design a foreground element + background separately so they can scale at opposite rates.
MOTION INTENT: foreground subject scale 1.0 → 1.0 (stays same), background scale 1.0 → 0.7
  (pulls back) — gives unsettling "stretched space" feel. Alternative: foreground scales up
  while background stays same.
```

### BRIEF E49 — Chromatic Aberration
```
EFFECT: RGB colour-channel separation around frame edges
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: design as overlay layers — duplicate scene content with red shift at one corner +
  cyan shift at opposite corner. Mostly affects edges.
MOTION INTENT: aberration intensity pulses (0 → max → 0) over scene duration; finite cycles.
```

### BRIEF E50 — Tilt-Shift Miniature
```
EFFECT: Selective focus blur creating miniature-model look
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: blur applied to top 25% and bottom 25% of frame, sharp middle 50%. Like looking at
  a miniature.
MOTION INTENT: static effect; or subtle pan suggesting the toy-camera moving.
```

### BRIEF E51 — Lens Distortion (Fisheye)
```
EFFECT: Fisheye lens distortion
WHERE IT FITS: Kinetic Pop
DESIGN: scene wrapped in a CSS filter or transform that creates a barrel-distortion / fisheye
  effect. Centre stays large, edges pinch.
MOTION INTENT: distortion amount can pulse 0 → max → 0 for a "punching through the lens"
  feel; finite cycles.
```

---

## LIGHTING EFFECTS

### BRIEF E52 — Spotlight on Element
```
EFFECT: Selective bright spotlight + darkened surround
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: full-frame dark overlay (low opacity) with a circular cut-out (radial gradient) at
  a specific location revealing brighter content beneath.
MOTION INTENT: spotlight position shifts slowly across the scene OR pulses in size;
  finite cycles.
```

### BRIEF E53 — Vignette Pulse
```
EFFECT: Vignette intensity that pulses
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: vignette overlay (we already have static); design two states — soft (low alpha)
  and intense (high alpha).
MOTION INTENT: alpha cycles 0.15 → 0.3 → 0.15 with sine ease, finite repeats.
```

### BRIEF E54 — Day-to-Night Gradient
```
EFFECT: Sky gradient transitioning from day to night
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: design TWO STATES — day (warm cream → blue gradient top-to-bottom) and night
  (deep navy → black gradient).
MOTION INTENT: gradient transitions smoothly day → twilight → night across scene duration.
```

### BRIEF E55 — Underwater Light Caustics
```
EFFECT: Wavy light pattern simulating underwater caustics
WHERE IT FITS: Quiet Premium
DESIGN: organic wavy light-pattern overlay (subtle accent gradients in undulating shapes)
  in upper third of frame.
MOTION INTENT: pattern morphs/translates slowly creating water-like motion; finite cycles.
```

### BRIEF E56 — Neon Flicker
```
EFFECT: Neon-sign flicker on hero text
WHERE IT FITS: Kinetic Pop
DESIGN: hero text with strong glow (multiple text-shadow layers in accent neon colours).
  Design the steady-on state.
MOTION INTENT: brief intermittent flickers — opacity dips to 0.7 for 1-2 frames at random
  intervals, then back to full. Use seeded PRNG for irregular timing.
```

### BRIEF E57 — Strobe Light Pulse
```
EFFECT: Repeating strobe flash
WHERE IT FITS: Kinetic Pop
DESIGN: full-frame white/accent overlay that flashes on/off rhythmically.
MOTION INTENT: opacity cycles 0 → 1 → 0 at 4-8 Hz, finite repeats; suitable for music-driven
  emphasis moments.
```

### BRIEF E58 — Disco Ball Reflections
```
EFFECT: Scattered light spots scattering across canvas (mirror-ball effect)
WHERE IT FITS: Kinetic Pop
DESIGN: 30-50 small bright circular spots at seeded positions (3-12px), in white or accent.
  Suggest light reflections from a rotating mirror ball.
MOTION INTENT: spots slowly translate across frame (rotating ball direction), individual
  spots pulse opacity at varying frequencies.
```

---

## SOCIAL / UI EFFECTS

### BRIEF E59 — Like Hearts Floating Up (Social-Media Style)
```
EFFECT: Heart icons floating up like Instagram-Live likes
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: 8-12 small heart icons (varying colours from brand palette) emerging from a single
  point at the bottom-right of frame, drifting up and fading.
MOTION INTENT: each heart spawns at origin, translates upward with slight horizontal drift
  + rotation, fades opacity 1 → 0 over 2-3s. Continuous spawning at intervals; finite cycles.
```

### BRIEF E60 — Notification Stack Slide-In
```
EFFECT: Stack of notification cards sliding in from one edge
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: 3 horizontal notification card placeholders stacked at top-right of frame, each
  with avatar + brief text. Smaller cards behind, larger card in front (depth stack).
MOTION INTENT: each card slides in from off-screen with stagger, slight bounce, settles
  into stack.
```

### BRIEF E61 — Loading Dots / Typing Indicator
```
EFFECT: Three dots animating to suggest loading or typing
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: 3 dots arranged horizontally inside a chat-bubble or simple container.
MOTION INTENT: each dot pulses opacity / scale in sequence creating the classic
  "..." typing animation; finite cycles.
```

### BRIEF E62 — Counter Roll-Up
```
EFFECT: Numbers rolling up like an odometer
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: large hero number with each digit shown in its own vertical column. Each column
  shows current digit + a hint of the next digit above.
MOTION INTENT: digits roll vertically when value changes (slot-machine style), each digit
  individually, with stagger.
```

---

## SCI-FI / DIGITAL EFFECTS

### BRIEF E63 — Scan Lines (Vintage CRT)
```
EFFECT: Horizontal scan lines suggesting old CRT monitor / VHS
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: regular pattern of horizontal hairlines (1-2px tall, 4-8px gap) covering whole frame
  in low-opacity dark, creating CRT-display feel. CSS repeating-linear-gradient.
MOTION INTENT: scan lines optionally translate vertically slowly, or pulse intensity.
```

### BRIEF E64 — Radar Sweep
```
EFFECT: Radar-style sweeping line rotating around centre
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: faint concentric circles centred on frame + a "sweep" line emanating from centre.
  Sweep is a thin gradient line that fades from accent (at line) to transparent (trail).
MOTION INTENT: sweep line rotates 360° around centre; finite cycles. Trail effect via
  multiple sweep instances at small angular offsets, each fading.
```

### BRIEF E65 — Digital Noise / Static
```
EFFECT: TV-static-like digital noise overlay
WHERE IT FITS: Kinetic Pop
DESIGN: SVG turbulence noise pattern (stronger than film grain) covering frame, low-medium
  opacity (0.10-0.25), greyscale + slight tint.
MOTION INTENT: pattern shifts position rapidly creating "TV static" feel; finite cycles
  with slight variation per cycle.
```

### BRIEF E66 — Energy Aura / Glow Field
```
EFFECT: Pulsing energy aura around a hero element
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: concentric blurred shapes around the hero element, in accent colour with high blur,
  varying opacity per ring (closer rings brighter).
MOTION INTENT: aura breathes — scale 1.0 → 1.1 with opacity cycle; finite repeats.
```

### BRIEF E67 — Wireframe Rotation
```
EFFECT: 3D wireframe geometric form rotating
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: design a stylised wireframe shape (cube, sphere, polyhedron) using SVG lines.
  Hairline strokes in accent.
MOTION INTENT: shape rotates slowly on multiple axes; finite cycles.
```

### BRIEF E68 — Constellation Lines
```
EFFECT: Stars connected by lines forming constellation patterns
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: 8-15 small stars at seeded positions + thin connecting lines forming a pattern
  (network or constellation shape).
MOTION INTENT: stars twinkle independently, lines draw between them via stroke-dashoffset
  on entrance, then static or with slow drift.
```

---

## ABSTRACT MOTION

### BRIEF E69 — Liquid Ripple
```
EFFECT: Water-ripple effect emanating from a point
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: 3-4 concentric circular hairline rings emanating from a centre point; colours fade
  outward, accent-tinted.
MOTION INTENT: rings expand from origin and fade as they reach max radius; new ripple
  spawns at intervals; finite cycles.
```

### BRIEF E70 — Warp / Distortion Wave
```
EFFECT: Visual warp distortion sweeping across frame
WHERE IT FITS: Kinetic Pop
DESIGN: design a wave-shaped overlay that visibly distorts content beneath (CSS filter:
  url() with SVG displacement OR simulated via translation / scale variations).
MOTION INTENT: wave sweeps across frame once or in cycles; finite repeats.
```

### BRIEF E71 — Swirl / Vortex
```
EFFECT: Swirling spiral vortex
WHERE IT FITS: Kinetic Pop
DESIGN: a spiral pattern radiating from centre, accent-coloured hairlines forming a vortex.
  Optional dust particles drifting along the spiral path.
MOTION INTENT: vortex rotates continuously; particles trace the spiral path.
```

### BRIEF E72 — Mosaic Reveal
```
EFFECT: Image revealing through cascading mosaic tiles
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: design TWO STATES — fully covered (small grid of tiles obscuring content) and
  fully revealed (tiles gone, content visible).
MOTION INTENT: tiles flip/fade away in sequence (cascading from one corner) revealing
  content beneath.
```

### BRIEF E73 — Flicker / Strobe Pattern
```
EFFECT: Irregular flickering on a hero element
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: hero element with two visual states — full opacity and 0.7 opacity (or shifted slightly).
MOTION INTENT: alternate between states at irregular intervals using seeded PRNG, finite
  cycles. Suggest neon-sign / electrical flicker.
```

---

## NATURE — additional

### BRIEF E74 — Fireflies
```
EFFECT: Glowing fireflies drifting across frame
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 12-18 small soft-glowing dots (4-8px) with strong glow, scattered.
MOTION INTENT: each firefly drifts in seeded random direction, opacity pulses 0 → 1 → 0
  on individual cycles, varied speeds; finite repeats.
```

### BRIEF E75 — Butterfly Drift
```
EFFECT: Stylised butterflies drifting through frame
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: 4-6 simple butterfly silhouettes (SVG) at varying scales, in warm-accent or muted.
MOTION INTENT: butterflies follow gentle curving paths across frame with slight rotation
  + scale wobble suggesting wing-flap.
```

### BRIEF E76 — Pollen / Dust Motes
```
EFFECT: Tiny suspended particles drifting in implied light
WHERE IT FITS: Quiet Premium, Warm Community, Documentary
DESIGN: 30-50 tiny dots (2-5px) in cream/warm colour, low opacity, scattered.
MOTION INTENT: each mote drifts very slowly in seeded random direction; opacity gently
  breathes; finite cycles.
```

### BRIEF E77 — Branch Shadow Sway
```
EFFECT: Tree-branch shadow swaying across frame (dappled-light feel)
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: stylised silhouette of branches/leaves overlaid as a soft-edged shadow pattern,
  positioned at top of frame. Low opacity. Suggests a tree off-frame casting shadows in.
MOTION INTENT: branch silhouette slowly rocks left-right (small rotation) + translates
  slightly suggesting wind; finite cycles.
```

---

## IMPACT / DRAMATIC EFFECTS

### BRIEF E78 — Dust Kick / Impact Cloud
```
EFFECT: Dust cloud explosion suggesting an impact / arrival
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: organic blurred dust shapes radiating from a central point; warm/cream tones.
MOTION INTENT: shapes explode outward from origin with rotation, fade as they expand;
  one-shot on entrance.
```

### BRIEF E79 — Ground Crack
```
EFFECT: Crack lines spreading across frame (impact visualisation)
WHERE IT FITS: Kinetic Pop
DESIGN: jagged crack lines (SVG paths) emanating from a central impact point in irregular
  directions. Hairline strokes in accent or deep tone.
MOTION INTENT: cracks draw via stroke-dashoffset rapidly outward from impact point;
  one-shot.
```

### BRIEF E80 — Ink Splash / Paint Drip
```
EFFECT: Ink splash with droplets and drip
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: organic ink-blot shape with surrounding droplets and small drip-tails; in accent
  or deep tone.
MOTION INTENT: main blob scales in from 0 with slight rotation; droplets emanate outward
  from blob with stagger; one-shot.
```

### BRIEF E81 — Shockwave Ring
```
EFFECT: Single expanding shockwave ring
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: thick circular ring (50-80px stroke) emanating from a central point. Ring fades
  as it expands.
MOTION INTENT: ring expands from radius 0 to fill-frame radius rapidly (0.6s, expo.out)
  while opacity goes 1 → 0; one-shot or repeating.
```

### BRIEF E82 — Confetti Cannon Burst
```
EFFECT: Strong confetti burst from a single point
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: 50-80 small geometric shapes (rectangles, triangles, circles) radiating from
  emanation point, in brand-palette colours.
MOTION INTENT: pieces explode outward from origin with high initial velocity, decelerate,
  rotation, eventually fall under "gravity" with horizontal drift.
```

---

## STAGE / THEATRICAL

### BRIEF E83 — Footlight Gradient
```
EFFECT: Warm footlight glow from bottom of frame
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: linear gradient from bottom edge of frame upward, warm-amber tint, fading to
  transparent in middle of frame.
MOTION INTENT: gradient intensity breathes gently; finite cycles. Suggests stage lighting.
```

### BRIEF E84 — Stage Haze
```
EFFECT: Soft haze / theatrical fog at the bottom of frame
WHERE IT FITS: Quiet Premium, Kinetic Pop
DESIGN: low-opacity blurred shapes in lower 30% of frame, white/cream, soft edges.
MOTION INTENT: haze slowly moves and morphs creating ambient depth; finite cycles.
```

### BRIEF E85 — Spotlight Rim Light
```
EFFECT: Single rim-light highlighting top edge of frame
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: thin bright highlight along the top edge of frame fading to transparent below.
  Warm or accent-tinted.
MOTION INTENT: rim-light intensity breathes; alternative slowly translates left/right
  (sweeping spotlight); finite cycles.
```

---

## INDUSTRIAL / MECHANICAL

### BRIEF E86 — Gear Rotation
```
EFFECT: Decorative gears rotating
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: 2-3 stylised gear shapes at varying sizes positioned around frame edges, hairline
  strokes in muted accent.
MOTION INTENT: gears rotate at different speeds (some clockwise, some counter), suggesting
  mechanical work; finite cycles.
```

### BRIEF E87 — Smoke Stack / Steam
```
EFFECT: Vertical column of steam / smoke rising from bottom
WHERE IT FITS: Documentary
DESIGN: 4-6 organic blobs stacked vertically in a column rising from off-frame bottom,
  decreasing opacity and increasing scale upward (steam dispersing).
MOTION INTENT: blobs translate upward and dissipate; new blobs spawn at bottom; finite cycles.
```

---

## RETRO / VINTAGE — additional

### BRIEF E88 — VHS Tracking Lines
```
EFFECT: Horizontal VHS-tracking error lines
WHERE IT FITS: Kinetic Pop
DESIGN: 2-4 horizontal bands of varying heights showing slight content displacement /
  brightness shift, simulating bad VHS tracking.
MOTION INTENT: bands shift vertically across frame with seeded irregular timing; alternate
  bright and dark bands.
```

### BRIEF E89 — Sepia Tone Overlay
```
EFFECT: Sepia / antique photo wash
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: full-frame warm-brown tinted overlay with subtle vignette and noise. Heritage-photo
  aesthetic.
MOTION INTENT: static or very subtle drift on the noise component.
```

### BRIEF E90 — Channel-Switch Glitch
```
EFFECT: TV channel-changing glitch (brief screen-roll + static)
WHERE IT FITS: Kinetic Pop
DESIGN: design TWO STATES — clean (current scene) and rolling (scene shifted vertically by
  ~30% with static-noise band at the seam).
MOTION INTENT: between two scenes, frame "rolls" vertically with static at the seam;
  one-shot transition-style.
```

---

## MATERIAL & SURFACE TEXTURES

### BRIEF E91 — Glass / Frosted Surface
```
EFFECT: Glass-pane / frosted-glass overlay covering content
WHERE IT FITS: Quiet Premium
DESIGN: full-frame translucent overlay with backdrop-filter blur, slight tint, very subtle
  highlight gradient suggesting glass surface. Optional: thin highlight stroke at top edge.
MOTION INTENT: condensation droplets occasionally appear and slide down (rare, subtle).
```

### BRIEF E92 — Mirror / Reflective Surface
```
EFFECT: Mirror-like reflection effect
WHERE IT FITS: Quiet Premium, Kinetic Pop
DESIGN: design content + a faded vertical-flipped reflection of it underneath, with strong
  blur and decreasing opacity downward.
MOTION INTENT: reflection ripples gently as if water surface; finite cycles.
```

### BRIEF E93 — Leather Texture Overlay
```
EFFECT: Leather grain pattern overlay
WHERE IT FITS: Quiet Premium
DESIGN: subtle leather-grain SVG noise pattern, low opacity (0.08-0.12), warm-brown tinted.
  Suggests luxury / craft material.
MOTION INTENT: static.
```

### BRIEF E94 — Fabric Weave Pattern
```
EFFECT: Woven-fabric texture overlay
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: subtle crosshatch weave pattern (vertical + horizontal repeating lines), low opacity,
  warm/neutral tones.
MOTION INTENT: static or very gentle drift.
```

### BRIEF E95 — Ice / Frost Crystals
```
EFFECT: Frost / ice crystal patterns growing across frame
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: stylised crystalline shapes (SVG paths) at frame edges, thin white/pale-blue lines
  forming dendritic crystal patterns. Like frost on a window.
MOTION INTENT: crystals draw via stroke-dashoffset growing inward from edges; finite cycles.
```

### BRIEF E96 — Sand / Granular Texture
```
EFFECT: Fine sand-grain texture
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: very fine noise overlay with warm-tan colour, low opacity.
MOTION INTENT: subtle drift in one direction (suggests wind).
```

### BRIEF E97 — Water Surface Ripples
```
EFFECT: Calm water surface with subtle ripples
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: horizontal undulating lines overlay (low opacity), suggesting reflective water.
  Slight blue/cyan tint.
MOTION INTENT: ripples translate horizontally creating calm-water motion; finite cycles.
```

### BRIEF E98 — Foam / Bubbles in Liquid
```
EFFECT: Foam bubbles like beer head or coffee crema
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: cluster of small overlapping circles of varying sizes, white/cream tones, top of frame.
MOTION INTENT: bubbles slowly pop (fade out) and new ones form (fade in); subtle settling motion.
```

### BRIEF E99 — Rusted / Patina Surface
```
EFFECT: Rust / patina aged-metal texture
WHERE IT FITS: Documentary
DESIGN: organic mottled rust pattern, oxidised greens and oranges, applied as overlay with
  irregular spread (more concentrated at edges).
MOTION INTENT: static (rust is a still surface).
```

### BRIEF E100 — Velvet / Plush Surface
```
EFFECT: Velvet-like soft texture overlay
WHERE IT FITS: Quiet Premium
DESIGN: subtle radial-gradient pattern suggesting soft plush surface, low contrast,
  rich deep accent colour.
MOTION INTENT: static.
```

---

## LIGHTING — additional variants

### BRIEF E101 — Backlight / Halo Effect
```
EFFECT: Strong backlight creating halo around hero element
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: hero element with a strong glow emanating from behind/around it, suggesting a strong
  light source positioned behind. Multiple stacked glows of decreasing opacity.
MOTION INTENT: glow pulses gently or stays static; finite cycles.
```

### BRIEF E102 — Three-Point Lighting (Studio)
```
EFFECT: Studio-lighting setup with key/fill/rim light visible as gradients
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: subtle gradient overlay suggesting key-light from upper-left (warm), fill light from
  lower-right (cool), rim-light at top edge (bright accent).
MOTION INTENT: lights subtly breathe in intensity; static feel otherwise.
```

### BRIEF E103 — Candlelight Glow
```
EFFECT: Warm candlelight flicker effect
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: warm-orange radial glow at one position (suggesting candle off-frame), low intensity
  with soft falloff.
MOTION INTENT: glow flickers irregularly (seeded random small intensity changes), finite cycles.
```

### BRIEF E104 — Moonlight Cool Tint
```
EFFECT: Cool moonlight wash from above
WHERE IT FITS: Quiet Premium
DESIGN: subtle cool-blue gradient from top of frame fading down, suggests night light.
MOTION INTENT: static or very subtle breathing.
```

### BRIEF E105 — Lamp / Lantern Glow
```
EFFECT: Single warm lamp glow at one position
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: warm-yellow radial glow at a specific point, gradient falloff, suggesting a lamp
  off-frame casting light.
MOTION INTENT: glow gently breathes; static otherwise.
```

### BRIEF E106 — Headlight Beams
```
EFFECT: Two parallel light beams (car headlights)
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: two diagonal cone-shaped gradients emerging from one frame edge, white/yellow with
  blur, fading along their length.
MOTION INTENT: beams sweep slightly across frame as if vehicle moving; finite cycles.
```

### BRIEF E107 — Prism Rainbow Refraction
```
EFFECT: Rainbow-light refraction strip
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: thin horizontal rainbow gradient (red-orange-yellow-green-blue-indigo-violet) at
  low opacity, in a specific position on frame.
MOTION INTENT: rainbow strip drifts slowly; intensity breathes; finite cycles.
```

### BRIEF E108 — Window Light Pattern
```
EFFECT: Light streaming through window pattern (cross-shaped or panes)
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: rectangular light-pattern overlay suggesting window panes (cross divisions visible),
  warm-light tint at low opacity. Falls across upper portion of frame.
MOTION INTENT: pattern slowly translates suggesting passing light; finite cycles.
```

---

## PARTICLE BEHAVIOURS — advanced

### BRIEF E109 — Swarm / Flocking
```
EFFECT: Particles moving in coordinated swarm pattern
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: 20-30 small dots / shapes positioned with seeded layout suggesting flock formation.
MOTION INTENT: particles move along curved paths with similar but offset trajectories,
  suggesting coordinated swarm/flock behaviour; finite cycles.
```

### BRIEF E110 — Magnetic Attraction
```
EFFECT: Particles pulled toward a central point
WHERE IT FITS: Kinetic Pop
DESIGN: 15-25 particles distributed around frame, with a central "magnetic" point.
MOTION INTENT: particles travel toward central point on curving trajectories, varied speeds;
  one-shot or repeating cycles.
```

### BRIEF E111 — Repulsion Burst
```
EFFECT: Particles flung outward from a central point
WHERE IT FITS: Kinetic Pop
DESIGN: 30-50 particles starting at central point.
MOTION INTENT: all particles burst outward from origin in radial directions with varied
  velocities, decelerating; one-shot.
```

### BRIEF E112 — Fountain Particles
```
EFFECT: Particles spraying upward from a source then falling
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: 30-50 particles emanating from a single point at bottom of frame.
MOTION INTENT: particles shoot upward with varied initial velocities, follow parabolic arcs
  as gravity pulls them back down; continuous spawning; finite cycles.
```

### BRIEF E113 — Vortex Particles
```
EFFECT: Particles spiralling around a central vortex
WHERE IT FITS: Kinetic Pop
DESIGN: 25-40 particles distributed around an invisible spiral path.
MOTION INTENT: particles trace the spiral path inward toward centre; finite cycles.
```

### BRIEF E114 — Particle Trail Along Path
```
EFFECT: Particles forming a luminous trail along a defined path
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: particles distributed along an SVG path (curve, arrow, or letterform).
MOTION INTENT: particles spawn at start of path and travel along it, fading toward end;
  continuous; finite cycles.
```

### BRIEF E115 — Particle Cloud (Volumetric)
```
EFFECT: Dense cloud of particles giving volumetric depth
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: 80-150 small particles densely packed in a region, varying sizes/opacities for depth.
MOTION INTENT: cloud slowly drifts as a whole, internal particles individually pulse;
  finite cycles.
```

### BRIEF E116 — Particle Explosion (Big Burst)
```
EFFECT: Massive particle burst — fireworks or impact
WHERE IT FITS: Kinetic Pop
DESIGN: 80-120 particles in varying brand colours starting at central point.
MOTION INTENT: all particles explode outward radially with high initial velocity, slow
  deceleration, optional secondary "bursts" from particles; gravity pull-down; one-shot.
```

---

## LIQUID / FLUID

### BRIEF E117 — Pouring Liquid
```
EFFECT: Liquid pouring from one position
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: thin curving liquid shape (SVG path) emerging from upper position, falling to
  lower position. Accent fluid colour with subtle highlight.
MOTION INTENT: liquid stream draws via stroke-dashoffset / clip-path from top to bottom;
  finite cycles or one-shot.
```

### BRIEF E118 — Dripping Drop
```
EFFECT: Single drop forming, falling, splashing
WHERE IT FITS: Warm Community, Documentary
DESIGN: small teardrop shape at top edge with optional tail forming.
MOTION INTENT: drop forms (scales up at source), separates and falls, splashes at landing
  point with small ring; one-shot or repeating.
```

### BRIEF E119 — Splash Crown
```
EFFECT: Splash crown / corona around an impact point
WHERE IT FITS: Kinetic Pop
DESIGN: design crown-shaped splash radiating from a central point, with droplets at the
  tips of the crown spikes.
MOTION INTENT: crown scales up rapidly then collapses; droplets fly outward; one-shot.
```

### BRIEF E120 — Tidal Wave / Wash
```
EFFECT: Liquid wave washing across frame
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: an organic curving wave shape spanning frame width, accent-coloured fluid fill with
  highlight at crest.
MOTION INTENT: wave translates horizontally across frame with slight vertical undulation;
  one-shot pass.
```

### BRIEF E121 — Bubble Pop Sequence
```
EFFECT: Bubbles rising and popping
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 8-12 bubbles at varying sizes and positions.
MOTION INTENT: bubbles rise with slight sway, each pops at top of frame with tiny droplet
  spread; new bubbles spawn continuously; finite cycles.
```

### BRIEF E122 — Liquid Wobble / Jelly
```
EFFECT: Jelly-like wobble on a hero element
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: hero element with two visual states — at rest, and squashed/stretched.
MOTION INTENT: element wobbles between states with elastic ease, gradually settling;
  finite cycles.
```

---

## PHOTOGRAPHY / FILM EFFECTS

### BRIEF E123 — Aperture / Iris Open
```
EFFECT: Camera aperture opening reveal
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: stylised camera-aperture blades (6-8 polygonal blades arranged radially) covering
  centre then opening out.
MOTION INTENT: blades rotate outward from centre revealing content; one-shot reveal animation.
```

### BRIEF E124 — Film Roll Frames Strip
```
EFFECT: Vertical filmstrip of frames passing
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: vertical strip with cream paper border, sprocket holes left+right, multiple photo
  cells stacked vertically with thin separators.
MOTION INTENT: strip translates vertically continuously; finite cycles.
```

### BRIEF E125 — Photo Development (Polaroid Reveal)
```
EFFECT: Photo developing from blank to full image
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: design TWO STATES — blank (cream paper) and developed (full image visible).
MOTION INTENT: image gradually appears via opacity over 1.5-2s, with subtle pixelation
  resolving to clear; one-shot.
```

### BRIEF E126 — Camera Shutter Click
```
EFFECT: Camera shutter snap
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: brief moment of frame divided into top/bottom halves meeting at centre.
MOTION INTENT: top half slides down + bottom half slides up to meet centre, briefly hold
  closed, then open back; one-shot.
```

### BRIEF E127 — Exposure Flash
```
EFFECT: Bright camera flash
WHERE IT FITS: Kinetic Pop
DESIGN: full-frame white overlay at peak.
MOTION INTENT: instant 0 → 1 in 1 frame, holds 1-2 frames, fades back over 0.4s; one-shot.
```

---

## DECORATIVE MOTION

### BRIEF E128 — Ribbon Flutter
```
EFFECT: Ribbon flowing / fluttering across frame
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: long curving ribbon shape (SVG path) with subtle gradient suggesting depth/twist.
  Accent or warm colour.
MOTION INTENT: ribbon shape morphs subtly suggesting wind, slight position shift; finite cycles.
```

### BRIEF E129 — Flag Waving
```
EFFECT: Flag rippling in wind
WHERE IT FITS: Documentary, Warm Community
DESIGN: rectangular flag-shaped form (could hold a brand mark/logo) with subtle wave deformation.
MOTION INTENT: flag undulates with wave displacement applied across its surface;
  finite cycles.
```

### BRIEF E130 — Bunting / Garland String
```
EFFECT: Decorative bunting / pennant string
WHERE IT FITS: Warm Community
DESIGN: horizontal string with 8-12 triangular pennants in alternating brand-palette colours,
  forming a slight catenary curve across upper frame.
MOTION INTENT: pennants gently sway and rotate as if blown by breeze; finite cycles.
```

### BRIEF E131 — Streamer / Crepe Paper
```
EFFECT: Streamers hanging and gently moving
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 4-6 vertical streamer ribbons hanging from top of frame in varying brand colours,
  with slight curl/twist.
MOTION INTENT: streamers gently sway side-to-side; finite cycles.
```

### BRIEF E132 — Confetti Hold (Static)
```
EFFECT: Static confetti accumulated at bottom of frame
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 30-50 small confetti pieces accumulated and resting at bottom of frame in pile,
  varied brand-palette colours.
MOTION INTENT: pieces subtly settle / shift; very low motion; finite cycles.
```

---

## MUSIC / AUDIO REACTIVE STATIC

### BRIEF E133 — Frequency Spectrum
```
EFFECT: Audio frequency-spectrum display (vertical bars)
WHERE IT FITS: Kinetic Pop
DESIGN: row of 24-32 vertical bars at varying heights along bottom of frame, gradient fill
  per bar.
MOTION INTENT: bars rise/fall in patterns suggesting frequency response; finite cycles.
  Claude Code can sync to actual audio analysis if available.
```

### BRIEF E134 — Vinyl Crackle Lines
```
EFFECT: Vinyl-record crackle / pop visualisation
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: subtle scratchy lines randomly scattered (as overlay), suggesting analog vinyl
  surface noise.
MOTION INTENT: crackles flicker on/off intermittently using seeded PRNG.
```

### BRIEF E135 — Beat Pulse Indicator
```
EFFECT: Visual element pulsing on every beat
WHERE IT FITS: Kinetic Pop
DESIGN: a circle / dot / small visual element designed to pulse.
MOTION INTENT: scale 1.0 → 1.15 → 1.0 cycles synced to music BPM; finite cycles.
```

### BRIEF E136 — Music Note Drift
```
EFFECT: Musical-note glyphs floating up
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 8-12 musical-note glyphs (♪ ♫ etc) at seeded positions in upper frame, varying sizes.
MOTION INTENT: notes drift upward with horizontal sway, opacity fades; finite cycles.
```

### BRIEF E137 — Staff / Music Bar Lines
```
EFFECT: Music staff lines as decorative element
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: 5 horizontal lines (musical staff) across part of frame with optional notes positioned
  on lines.
MOTION INTENT: notes can pulse on beat; staff lines static; finite cycles.
```

---

## MAP / LOCATION

### BRIEF E138 — Pulsing Location Pin
```
EFFECT: Location pin with expanding ripple ring
WHERE IT FITS: Documentary, Warm Community
DESIGN: pin marker (drop-pin shape) with 2-3 concentric circular rings emanating from base.
MOTION INTENT: rings expand outward and fade in cycles, pin pulses subtly; finite cycles.
```

### BRIEF E139 — Route Drawing
```
EFFECT: Path / route line being drawn from A to B
WHERE IT FITS: Documentary, Warm Community
DESIGN: a curved line (SVG path) from one point to another, optional small markers at
  key waypoints.
MOTION INTENT: line draws progressively from start to end via stroke-dashoffset;
  one-shot animation.
```

### BRIEF E140 — GPS Direction Arrow
```
EFFECT: GPS-style direction arrow with rotation
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: large stylised arrow / chevron pointing in a direction, in accent colour. Optional
  small dot at base.
MOTION INTENT: arrow occasionally rotates slightly suggesting recalibration; finite cycles.
```

### BRIEF E141 — Coverage Radius
```
EFFECT: Concentric ripples expanding from a central point on a map
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: 3-5 concentric circles emanating from a central pin, each with decreasing opacity
  outward.
MOTION INTENT: rings continuously expand from centre with stagger; finite cycles.
```

---

## REVEAL ANIMATIONS — design states

### BRIEF E142 — Clip-Path Wipe Reveal (4 directions)
```
EFFECT: Content revealed via clip-path wipe (left, right, up, down)
WHERE IT FITS: ALL stacks
DESIGN: design TWO STATES — fully covered (clip-path inset 0 0 100% 0 hides the content from
  one direction) and fully revealed (clip-path inset 0 hides nothing). Provide all 4 direction
  variants as separate state pairs.
MOTION INTENT: clip-path interpolates smoothly from covered to revealed; 0.6s, expo.out.
```

### BRIEF E143 — Blinds Reveal
```
EFFECT: Content revealed via venetian-blind slats opening
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: design content with horizontal stripes (5-8 stripes) covering it, in accent colour.
MOTION INTENT: each stripe rotates open (3D rotateX from 0 to 90°) with stagger, revealing
  content behind; one-shot.
```

### BRIEF E144 — Shutter Reveal
```
EFFECT: Content revealed via shutter / barn-door open
WHERE IT FITS: Kinetic Pop
DESIGN: design content with two shutters (one from left, one from right) meeting at centre.
MOTION INTENT: shutters slide outward to opposite edges revealing content; one-shot.
```

### BRIEF E145 — Star / Iris Wipe
```
EFFECT: Content revealed via star-shaped or iris-shaped expansion from centre
WHERE IT FITS: Kinetic Pop
DESIGN: design content with a star-shaped (or other geometric) clip-path centred on it.
MOTION INTENT: clip-path expands from a small central shape to full frame; one-shot.
```

### BRIEF E146 — Letterbox Reveal (Cinematic)
```
EFFECT: Cinematic letterbox bars opening from top and bottom
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: design content with two opaque black bars (top and bottom of frame) covering portions.
MOTION INTENT: bars retract to the top and bottom edges revealing content; one-shot.
```

---

## OPTICAL / REFRACTION

### BRIEF E147 — Kaleidoscope Pattern
```
EFFECT: Kaleidoscope-style symmetric reflections
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: design a pattern that's mirrored radially around centre forming a kaleidoscope effect.
  Bright accent colours.
MOTION INTENT: pattern slowly rotates around centre; finite cycles.
```

### BRIEF E148 — Lens Distortion Wave
```
EFFECT: Wavy lens distortion sweeping across frame
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: a wave-shaped distortion overlay that visibly distorts content beneath
  (CSS filter url() with SVG displacement).
MOTION INTENT: wave sweeps across frame in cycles; finite repeats.
```

### BRIEF E149 — Spectrum Refraction
```
EFFECT: Light splitting into colour spectrum
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: a single white beam of light splitting into rainbow colours, like through a prism.
MOTION INTENT: beam pulses, spectrum opacities cycle; finite cycles.
```

---

## UI / LOADING STATES

### BRIEF E150 — Skeleton Placeholder
```
EFFECT: Skeleton placeholder bars for loading content
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: greyed-out rectangle placeholders mimicking content structure (avatar circle,
  title bar, body lines).
MOTION INTENT: subtle shimmer animation passes across the placeholders left-to-right; finite cycles.
```

### BRIEF E151 — Shimmer Effect on Element
```
EFFECT: Shimmer / sheen passing across an element
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: hero element with a thin diagonal gradient overlay (white to transparent) positioned
  to one side.
MOTION INTENT: gradient overlay translates across the element creating shimmer; finite cycles.
```

### BRIEF E152 — Loading Spinner Variants
```
EFFECT: Circular loading spinner
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: design 3 spinner styles — (a) ring with arc cutout, (b) dots in circle, (c) rotating
  bars. All in accent colour.
MOTION INTENT: spinner rotates continuously around its centre; finite cycles.
```

### BRIEF E153 — Progress Bar with Shimmer
```
EFFECT: Progress bar with active shimmer effect
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: horizontal progress bar partially filled, with shimmer overlay on the filled portion.
MOTION INTENT: shimmer translates across filled portion creating "active" feel; bar fills
  toward target; finite cycles.
```

### BRIEF E154 — Pulse Ring on Button
```
EFFECT: Pulsing ring around a CTA element drawing attention
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: hero CTA / button with concentric ring around it, in accent colour at low opacity.
MOTION INTENT: ring scales 1.0 → 1.3 → 1.0 with opacity 1 → 0 → 1, creating attention pulse;
  finite repeats.
```

---

## TIME / RHYTHM

### BRIEF E155 — Clock Tick / Second Hand
```
EFFECT: Clock face with ticking second hand
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: stylised clock face (circle with hour markers) and a second-hand line.
MOTION INTENT: second hand rotates discretely (1 tick per "second"), creating mechanical
  rhythm; finite cycles.
```

### BRIEF E156 — Hourglass Sand
```
EFFECT: Sand falling in an hourglass
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: hourglass shape with sand visible in upper bulb falling to lower bulb.
MOTION INTENT: sand stream flows from top bulb to bottom; upper level decreases, lower level
  increases; one-shot or finite cycles.
```

### BRIEF E157 — Sundial Shadow
```
EFFECT: Shadow rotating around a central gnomon
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: stylised sundial with a central gnomon and a shadow line.
MOTION INTENT: shadow rotates slowly suggesting time passing; finite cycles.
```

---

## ELASTIC / PHYSICS

### BRIEF E158 — Rubber-Band Snap
```
EFFECT: Element snaps as if from a rubber band
WHERE IT FITS: Kinetic Pop
DESIGN: hero element + a "stretched" duplicate behind/beside it suggesting tension.
MOTION INTENT: element overshoots target then settles back with elastic ease; one-shot.
```

### BRIEF E159 — Pendulum Swing
```
EFFECT: Pendulum swinging back and forth
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: a vertical line with a weight at the bottom, anchored at top.
MOTION INTENT: pendulum rotates between -30° and +30° in sine cycles; finite repeats.
```

### BRIEF E160 — Bouncing Ball / Drop
```
EFFECT: Object dropping and bouncing with gravity
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: element at upper position + landing target at lower position.
MOTION INTENT: element falls under "gravity" (accelerating), bounces with decreasing height
  on landing, settles; one-shot.
```

---

## TYPOGRAPHY MOTION — additional

### BRIEF E161 — Letter Flip Cascade
```
EFFECT: Each letter of a word flips on its Y-axis individually
WHERE IT FITS: Kinetic Pop
DESIGN: hero word with each letter wrapped in its own span. Each letter has a 'flipped'
  state (rotateY 180°, mirrored).
MOTION INTENT: letters rotate sequentially with stagger (0.08s offset), each rotates 360°
  to land back as itself; finite cycles or one-shot.
```

### BRIEF E162 — Vertical Text Scroll (Teleprompter)
```
EFFECT: Multiple lines of text scrolling vertically
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: column of stacked text lines, with the visible portion in clear focus and lines
  fading at top and bottom of the visible area.
MOTION INTENT: lines translate vertically continuously through the visible window;
  finite cycles. New lines spawn at bottom as old ones leave at top.
```

### BRIEF E163 — Letter Weight Pulse
```
EFFECT: Hero text with letter-weight oscillating
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: hero word using a variable font with weight axis. Design 2 states — light (weight
  300) and heavy (weight 900).
MOTION INTENT: smoothly tween font-weight between states; finite cycles, sine ease.
```

### BRIEF E164 — Letter Stretch / Squash
```
EFFECT: Letters stretching vertically and squashing
WHERE IT FITS: Kinetic Pop
DESIGN: hero word with each letter individually scaled. Two states — squashed
  (scaleY 0.7) and stretched (scaleY 1.3).
MOTION INTENT: letters cycle between states with stagger creating wave-like ripple effect;
  finite cycles.
```

### BRIEF E165 — Letter Shadow Drift
```
EFFECT: Hero text with shadow that drifts away from the letters
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: hero word with offset duplicate beneath (the shadow), in muted darker tone, slightly
  blurred.
MOTION INTENT: shadow position drifts gradually offset further from letters then returns;
  finite cycles, slow.
```

### BRIEF E166 — Letter Chromatic Shift
```
EFFECT: Hero text letters shift through colour spectrum
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: hero word with each letter capable of cycling through colour states.
MOTION INTENT: each letter's colour cycles through the brand palette with stagger;
  finite cycles.
```

---

## GENERATIVE PATTERNS

### BRIEF E167 — Voronoi Cell Pattern
```
EFFECT: Voronoi-cell (cell-division) pattern background
WHERE IT FITS: Documentary, Kinetic Pop, Quiet Premium
DESIGN: SVG of irregular polygon cells tessellating the frame, each cell with subtle gradient
  fill in brand-palette tones, hairline strokes between cells.
MOTION INTENT: cells subtly morph (grow/shrink) creating a living-cell feel;
  finite cycles, slow.
```

### BRIEF E168 — Perlin Noise Field
```
EFFECT: Smooth noise field overlay (organic, cloud-like)
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: a Perlin-style noise overlay with smooth gradients, low opacity (0.10-0.20) in
  brand-tinted tones.
MOTION INTENT: noise pattern slowly morphs / drifts; finite cycles.
```

### BRIEF E169 — Lattice / Dot Mesh Morph
```
EFFECT: Connected lattice of dots that morphs into a new pattern
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: regular grid of dots with thin connecting lines forming lattice pattern.
MOTION INTENT: lattice deforms slightly, dots drift creating subtle wave / breath in the
  network; finite cycles.
```

### BRIEF E170 — Cellular Automata Pattern
```
EFFECT: Conway's-Game-of-Life-style evolving cell pattern
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: grid of small cells (each ~20-30px), some filled in accent colour, others empty.
MOTION INTENT: cells appear/disappear in patterns suggesting cellular evolution;
  finite cycles using seeded states.
```

### BRIEF E171 — Fractal Branch Growth
```
EFFECT: Tree-like fractal branches growing
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: a stylised tree-branch pattern starting from one point, branching outward in
  fractal pattern. Hairline strokes.
MOTION INTENT: branches draw progressively via stroke-dashoffset, growing from trunk
  outward; one-shot.
```

---

## BRAND MARK ANIMATIONS

### BRIEF E172 — Logo Stamp Impact
```
EFFECT: Logo stamps onto canvas with impact
WHERE IT FITS: ALL stacks
DESIGN: brand logo at final position, with optional impact-burst particles around it.
MOTION INTENT: logo scales from 1.4 to 1.0 rapidly with bounce (back.out 2.4), small dust
  particles burst outward at the moment of impact; one-shot.
```

### BRIEF E173 — Logo Lockup Assembly
```
EFFECT: Brand mark and wordmark assemble together from separate states
WHERE IT FITS: ALL stacks
DESIGN: logo mark on left, wordmark on right, both initially separated. Final state has
  them at proper lockup positions.
MOTION INTENT: each element slides from off-frame to lockup position, mark from left,
  wordmark from right or below; meet at centre with subtle settling.
```

### BRIEF E174 — Logo Mark Spin Reveal
```
EFFECT: Brand mark rotates 360° on entrance
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: brand mark element.
MOTION INTENT: mark rotates 360° with scale 0 to 1, decelerating; one-shot.
```

### BRIEF E175 — Logo Build (Element by Element)
```
EFFECT: Logo constructs itself piece by piece
WHERE IT FITS: ALL stacks
DESIGN: brand mark broken into individual SVG elements (paths, shapes).
MOTION INTENT: elements appear sequentially, each scaling/fading in to its final position;
  stagger 0.1s; one-shot.
```

---

## CELEBRATORY

### BRIEF E176 — Fireworks Burst
```
EFFECT: Multi-stage fireworks explosion
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: 6-8 firework "explosions" at varying positions in upper frame, each a radial
  burst of accent-coloured streaks.
MOTION INTENT: each firework launches (small streak rises) then explodes (radial burst of
  particles) with staggered timing across the scene; finite cycles.
```

### BRIEF E177 — Sparkler Trail
```
EFFECT: Sparkler trail with bright tip and dimming sparks
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: a bright tip (sparkler end) with a trail of small sparkle particles behind it,
  fading into nothing.
MOTION INTENT: sparkler tip traces a defined path (curve, letter, word); sparks emit
  continuously and fade; one-shot or repeating.
```

### BRIEF E178 — Balloons Rising
```
EFFECT: Balloons floating up across frame
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 6-10 balloon shapes (circle with small triangle knot beneath) at varying brand-
  palette colours, each with thin string trailing down.
MOTION INTENT: balloons rise from off-frame bottom with subtle horizontal sway; finite cycles.
```

### BRIEF E179 — Party Popper Burst
```
EFFECT: Party popper firing streamers and confetti
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: 5-8 streamer ribbons + 30 confetti pieces emanating from a single point at upper
  corner of frame.
MOTION INTENT: streamers + confetti explode outward from emanation point, falling under
  gravity; one-shot.
```

### BRIEF E180 — Cake Candle Blow Out
```
EFFECT: Candle flame extinguishing with a smoke wisp
WHERE IT FITS: Warm Community
DESIGN: stylised candle with flame at top (tear-drop shape in warm orange).
MOTION INTENT: flame flickers then quickly disappears (scale 1 → 0) with a small smoke wisp
  rising from candle wick; one-shot.
```

---

## LIGHT BEAM VARIANTS

### BRIEF E181 — Lightsaber / Sword Stroke
```
EFFECT: Bright energy line drawn rapidly across frame
WHERE IT FITS: Kinetic Pop
DESIGN: a thick bright line (with strong glow) crossing frame at a defined angle.
  Inner core white, outer halo in accent colour.
MOTION INTENT: line draws across frame rapidly via stroke-dashoffset, then optionally
  fades; one-shot.
```

### BRIEF E182 — Neon Tube Sign
```
EFFECT: Neon-tube sign with glow and buzz
WHERE IT FITS: Kinetic Pop
DESIGN: hero text with strong outer glow simulating neon tube, multiple text-shadow layers
  in bright accent colour.
MOTION INTENT: subtle flicker/buzz where opacity briefly drops on rare intervals;
  finite cycles using seeded PRNG.
```

### BRIEF E183 — Festival / String Lights
```
EFFECT: Hanging string of warm fairy lights
WHERE IT FITS: Warm Community
DESIGN: catenary-curve string with 12-18 small bulb lights distributed along it, in warm
  yellow/orange tones.
MOTION INTENT: each light gently pulses opacity at varied frequencies, suggesting twinkle;
  finite cycles.
```

### BRIEF E184 — Searchlight Cone
```
EFFECT: Cone-shaped searchlight beam scanning
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: triangular cone-shape light beam emanating from one frame edge, gradient fill
  fading along its length.
MOTION INTENT: cone rotates around emanation point, sweeping across frame; finite cycles.
```

---

## NUMBER ANIMATIONS

### BRIEF E185 — Count-Up Number
```
EFFECT: Number animating from 0 to a target value
WHERE IT FITS: ALL stacks
DESIGN: hero number element (large display font), final value at rest.
MOTION INTENT: value tweens from 0 to target rapidly (1.5-2s, power3.out); Claude Code wires
  via JS counter with deterministic interpolation.
```

### BRIEF E186 — Count-Down Ticker
```
EFFECT: Number ticking down to zero
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: hero number, final value of 0 (or minimum) at rest.
MOTION INTENT: value tweens from start value down to 0 with steady cadence; finite duration.
```

### BRIEF E187 — Odometer Roll
```
EFFECT: Multi-digit odometer-style number rolling
WHERE IT FITS: Kinetic Pop
DESIGN: hero number with each digit shown in its own column; design as if each digit can
  scroll vertically.
MOTION INTENT: digits roll vertically (slot-machine style) when value changes, with each
  digit individually scrolling and stagger; finite cycles.
```

### BRIEF E188 — Score Increment Pop
```
EFFECT: Score increases with a small popping animation
WHERE IT FITS: Kinetic Pop
DESIGN: score number element. On increment, a small +N indicator appears beside it.
MOTION INTENT: score scales 1.0 → 1.15 → 1.0 with bounce on each increment; +N indicator
  appears, drifts upward, fades; one-shot per increment.
```

---

## SYMBOL ANIMATIONS

### BRIEF E189 — Heart Beat Pulse
```
EFFECT: Heart icon pulsing rhythmically
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: heart-shape icon centred, in warm accent colour.
MOTION INTENT: scale 1.0 → 1.18 → 1.0 → 1.12 → 1.0 (double-beat rhythm), repeating;
  finite cycles synced to BPM.
```

### BRIEF E190 — Star Twinkle (Single)
```
EFFECT: Single hero star with twinkle/sparkle effect
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: hero star icon, 4-pointed sparkle shape, in accent colour with subtle glow.
MOTION INTENT: star rotates slowly + scales gently while opacity pulses; finite cycles.
```

### BRIEF E191 — Checkmark Draw
```
EFFECT: Checkmark drawing itself stroke-by-stroke
WHERE IT FITS: ALL stacks
DESIGN: a checkmark SVG path inside an optional circle frame.
MOTION INTENT: checkmark path draws via stroke-dashoffset (0.6s, power2.out); circle frame
  optionally draws first; one-shot.
```

### BRIEF E192 — X Mark Shake (Negation)
```
EFFECT: X / cross mark with shake
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: an X-mark SVG (two crossing lines), in deep tone or warning colour.
MOTION INTENT: X scales in with bounce, then shakes left-right rapidly suggesting "NO";
  one-shot.
```

### BRIEF E193 — Plus / Minus Toggle
```
EFFECT: Plus icon morphing to minus icon (and back)
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: two states — plus (+ sign) and minus (- sign).
MOTION INTENT: vertical bar of plus rotates 90° to disappear / become invisible, leaving
  the horizontal bar (minus); reversible; one-shot.
```

### BRIEF E194 — Arrow / Chevron Pulse
```
EFFECT: Directional arrow pulsing in emphasis
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: arrow / chevron icon at a specific angle.
MOTION INTENT: arrow translates slightly in pointed direction + fades opacity in cycles;
  finite repeats. Suggests "look this way" emphasis.
```

---

## SPEECH / COMMUNICATION

### BRIEF E195 — Speech Bubble Pop
```
EFFECT: Speech bubble appearing with bounce
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: rounded-rectangle speech bubble with directional tail in accent colour.
MOTION INTENT: bubble scales from 0 to 1 with bounce (back.out 2.4); one-shot per bubble.
```

### BRIEF E196 — Thought Cloud Bob
```
EFFECT: Thought-cloud (multiple connected ovals) gently bobbing
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: cloud-shape thought bubble with 2-3 trailing dots leading to a head/element.
MOTION INTENT: cloud floats up/down gently in subtle sine cycle; finite repeats.
```

### BRIEF E197 — Chat Typing Dots
```
EFFECT: Three dots animating to indicate typing
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: three dots arranged horizontally inside a chat bubble.
MOTION INTENT: each dot pulses opacity/scale in sequence creating "..." typing animation;
  finite cycles.
```

### BRIEF E198 — Notification Badge Bounce
```
EFFECT: Notification badge with number that bounces on appearance
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: small circular badge with number inside, in accent or warning colour.
MOTION INTENT: badge appears with scale 0 to 1.2 to 1.0 bounce; number can count up
  if value increases; one-shot per appearance.
```

---

## FLOWING / TRAILS

### BRIEF E199 — Flowing Current Lines
```
EFFECT: Curving lines flowing across frame (river / current feel)
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: 4-6 organic curving lines (SVG paths) spanning frame, each with thin stroke and
  subtle gradient.
MOTION INTENT: lines morph subtly + translate slightly suggesting flow; finite cycles.
```

### BRIEF E200 — Electrical Arc / Lightning Trail
```
EFFECT: Crackling electrical arcs between two points
WHERE IT FITS: Kinetic Pop
DESIGN: 2-4 jagged lightning-style line shapes connecting two points or radiating from one.
MOTION INTENT: arcs flicker on/off rapidly with seeded variation, suggesting electrical
  discharge; finite cycles.
```

### BRIEF E201 — Smoke Trail (Following Path)
```
EFFECT: Smoke trail emanating along a path
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: a curving SVG path with smoke particles distributed along it, getting smaller and
  more diffuse toward the end.
MOTION INTENT: smoke particles spawn at start of path and travel along, expanding and
  fading as they go; continuous; finite cycles.
```

### BRIEF E202 — Air Flow / Wind Lines
```
EFFECT: Diagonal stylised lines suggesting wind/air motion
WHERE IT FITS: Kinetic Pop
DESIGN: 8-15 thin diagonal lines at varying lengths positioned across frame.
MOTION INTENT: lines translate diagonally rapidly, fade in/out, varied speeds; finite cycles.
```

---

## COLOR EFFECTS

### BRIEF E203 — Duotone Overlay
```
EFFECT: Two-color duotone wash on content
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: full-frame overlay using two brand colours mapped to highlights/shadows. Use CSS
  filter chain (grayscale + sepia + hue-rotate combination, or background-blend-mode).
MOTION INTENT: static or subtle hue-shift; finite cycles.
```

### BRIEF E204 — Gradient Color Cycling
```
EFFECT: Background gradient that smoothly cycles through brand palette
WHERE IT FITS: Quiet Premium, Kinetic Pop
DESIGN: full-frame gradient between 2-3 token colours.
MOTION INTENT: gradient stops smoothly tween between sets of colours;
  finite cycles. (Claude Code wires the colour-tween chain.)
```

### BRIEF E205 — RGB Channel Split
```
EFFECT: RGB channels split apart from a hero element (like a 3D-glasses effect)
WHERE IT FITS: Kinetic Pop
DESIGN: hero element with red duplicate offset slightly + cyan duplicate offset opposite
  + green duplicate offset another direction. Combined create a separated effect.
MOTION INTENT: channel offsets expand outward from element then collapse back;
  finite cycles or one-shot.
```

### BRIEF E206 — Hue Rotation
```
EFFECT: Element's hue rotating through colour wheel
WHERE IT FITS: Kinetic Pop
DESIGN: element with brand-accent fill.
MOTION INTENT: CSS filter hue-rotate continuously cycles 0 to 360°;
  finite cycles.
```

### BRIEF E207 — Posterize Effect
```
EFFECT: Reduce colour gradient to discrete bands (poster/print look)
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: full-frame overlay reducing colour count to 4-6 distinct bands. Achievable via CSS
  filter or by overlay banding.
MOTION INTENT: static or band positions slowly shift; finite cycles.
```

---

## EMOJI / REACTION STYLE

### BRIEF E208 — Single Emoji Pop
```
EFFECT: Single emoji bouncing into view
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: large emoji (or stylised emoji-style icon) centred.
MOTION INTENT: emoji scales from 0 to 1.3 to 1.0 with bounce, slight rotation; one-shot.
```

### BRIEF E209 — Emoji Rain
```
EFFECT: Multiple emojis falling from top
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 12-20 different emoji icons scattered in upper frame, varying sizes 30-80px.
MOTION INTENT: emojis fall with rotation + slight horizontal sway; finite cycles.
```

### BRIEF E210 — Reaction Burst (Multiple)
```
EFFECT: Multiple reaction emojis emanating from single point
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: 6-10 different reaction emojis (heart, thumbs-up, smile, etc.) at one source point.
MOTION INTENT: emojis explode outward in radial pattern with rotation, then drift up + fade;
  one-shot or recurring.
```

---

## BRUSHSTROKE / DRAW

### BRIEF E211 — Paint Stroke Reveal
```
EFFECT: Content revealed via painted stroke wiping across
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: design with a paintbrush-shaped clip-path that wipes across content; optional
  textured edge suggesting wet paint.
MOTION INTENT: stroke draws across canvas via clip-path / stroke-dashoffset; one-shot reveal.
```

### BRIEF E212 — Calligraphy Stroke
```
EFFECT: Calligraphic letterform drawing itself
WHERE IT FITS: Quiet Premium, Warm Community
DESIGN: hero word or character drawn as SVG path with stroke.
MOTION INTENT: stroke draws via stroke-dashoffset following calligraphic path order;
  one-shot.
```

### BRIEF E213 — Marker Scribble
```
EFFECT: Casual marker scribble drawing across content
WHERE IT FITS: Kinetic Pop, Warm Community
DESIGN: a wobbly hand-drawn marker stroke across part of frame, in accent colour.
MOTION INTENT: stroke draws via stroke-dashoffset; one-shot.
```

### BRIEF E214 — Spray Paint Effect
```
EFFECT: Element appearing as if spray-painted on
WHERE IT FITS: Kinetic Pop
DESIGN: hero element with rough/imperfect edges + small overspray dots scattered around it.
MOTION INTENT: element fades in with edges visible first, then fills inward; small overspray
  dots appear with stagger; one-shot.
```

### BRIEF E215 — Pencil Sketch Line
```
EFFECT: Pencil-line drawing across frame
WHERE IT FITS: Documentary, Quiet Premium
DESIGN: thin pencil-like stroke with subtle texture, slightly imperfect line.
MOTION INTENT: line draws via stroke-dashoffset progressively; one-shot.
```

---

## SPATIAL / 3D

### BRIEF E216 — 3D Card Flip
```
EFFECT: Card flipping in 3D space (showing front then back)
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: design TWO STATES — front face and back face of a card.
MOTION INTENT: card rotateY from 0° to 180° showing back face at flip point; one-shot.
```

### BRIEF E217 — Cube Rotation
```
EFFECT: 3D cube rotating, showing different faces
WHERE IT FITS: Kinetic Pop
DESIGN: 6 faces of a cube each holding different content.
MOTION INTENT: cube rotates on multiple axes revealing different faces in sequence;
  finite cycles.
```

### BRIEF E218 — Parallax 3-Layer Depth
```
EFFECT: 3 layers of background moving at different speeds (depth illusion)
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: 3 visual layers at different "depths" — background (slowest), midground, foreground.
MOTION INTENT: layers translate horizontally at different speeds (background slow, foreground
  fast) creating depth illusion; finite cycles.
```

### BRIEF E219 — Tilt-on-Hover (Static State)
```
EFFECT: Card with subtle tilt giving 3D feel
WHERE IT FITS: Kinetic Pop, Quiet Premium
DESIGN: card with slight rotateX + rotateY transform suggesting depth, plus a small specular
  highlight.
MOTION INTENT: tilt subtly cycles through different angles; finite cycles.
```

---

## SKY / HORIZON

### BRIEF E220 — Sunrise Gradient Reveal
```
EFFECT: Sky transitioning from dawn to morning
WHERE IT FITS: Warm Community, Documentary
DESIGN: design TWO STATES — pre-dawn (cool blue/purple gradient) and morning (warm orange/
  yellow gradient).
MOTION INTENT: gradient smoothly transitions through dawn colours over scene duration;
  one-shot.
```

### BRIEF E221 — Aurora Borealis
```
EFFECT: Northern-lights ribbons in night sky
WHERE IT FITS: Quiet Premium
DESIGN: 3-4 organic curving ribbon shapes in green/purple gradient, low opacity, in upper
  third of frame.
MOTION INTENT: ribbons morph and translate slowly creating aurora wave motion;
  finite cycles.
```

### BRIEF E222 — Sunset Gradient
```
EFFECT: Warm sunset gradient sky
WHERE IT FITS: Warm Community, Quiet Premium
DESIGN: vertical gradient from warm orange at top to deep red/purple at bottom, suggesting
  sunset.
MOTION INTENT: subtle hue cycling suggesting sunset progression; finite cycles.
```

---

## CROWD / MULTIPLE-AGENT

### BRIEF E223 — Bird Flock Silhouette
```
EFFECT: Stylised silhouettes of birds flying past
WHERE IT FITS: Quiet Premium, Documentary
DESIGN: 8-12 small bird-V silhouettes (simple chevron shape) at varying positions in upper
  frame.
MOTION INTENT: birds fly across frame in formation, slight wing-flap (rotation) suggesting
  motion; one-shot pass.
```

### BRIEF E224 — Fish School Swim
```
EFFECT: School of fish swimming together
WHERE IT FITS: Quiet Premium
DESIGN: 12-20 small fish silhouettes (simple oval/teardrop shape) clustered together.
MOTION INTENT: fish swim in coordinated direction with subtle individual variation;
  finite cycles.
```

### BRIEF E225 — Crowd Walking Silhouettes
```
EFFECT: Crowd of people silhouettes walking past
WHERE IT FITS: Documentary, Warm Community
DESIGN: 10-15 simple human silhouettes at varying heights, walking at different positions.
MOTION INTENT: silhouettes translate horizontally suggesting walking + slight bob;
  finite cycles.
```

---

## SPORT / SPEED

### BRIEF E226 — Speed Lines (Manga-Style)
```
EFFECT: Diagonal speed lines suggesting fast motion
WHERE IT FITS: Kinetic Pop
DESIGN: 12-20 thin diagonal lines radiating from one direction across frame, varying lengths.
MOTION INTENT: lines translate rapidly in their direction, varied speeds; finite cycles.
```

### BRIEF E227 — Motion Blur Trail
```
EFFECT: Subject with motion-blur trail behind it
WHERE IT FITS: Kinetic Pop
DESIGN: hero subject + 3-5 ghost copies behind it with decreasing opacity, suggesting
  recent positions.
MOTION INTENT: subject moves across frame, trail follows with delay; one-shot.
```

### BRIEF E228 — Finish Line Tape Break
```
EFFECT: Runner crossing a finish-line tape
WHERE IT FITS: Kinetic Pop
DESIGN: vertical or horizontal tape line at one position, with optional confetti/spectator
  silhouettes.
MOTION INTENT: tape "snaps" — at impact moment, breaks and flies outward to both sides;
  one-shot.
```

### BRIEF E229 — Race Track Lanes Sweep
```
EFFECT: Multiple race lanes with athletes (markers) speeding
WHERE IT FITS: Kinetic Pop
DESIGN: 3-4 horizontal track lanes with small markers (athlete representations) in each.
MOTION INTENT: markers race from left to finish line, varied speeds (one ahead); one-shot.
```

---

## EXPLORATION / DISCOVERY

### BRIEF E230 — Magnifying Glass Scan
```
EFFECT: Magnifying glass moving across content, magnifying area underneath
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: a circular magnifying-glass shape with handle, with content visible inside at
  larger scale.
MOTION INTENT: magnifying glass translates across frame, content within visibly scaled;
  finite cycles.
```

### BRIEF E231 — Search / Scan Beam Sweep
```
EFFECT: Bright scan-line beam sweeping across content
WHERE IT FITS: Kinetic Pop, Documentary
DESIGN: a thin horizontal/vertical beam of light passing across frame.
MOTION INTENT: beam translates across frame from one edge to another; finite cycles.
```

### BRIEF E232 — Treasure-Map X Reveal
```
EFFECT: X-marks-the-spot reveal on a stylised map
WHERE IT FITS: Warm Community, Kinetic Pop
DESIGN: a stylised map background with an X marker at a specific position. Optional dotted
  trail leading to the X.
MOTION INTENT: dotted trail draws progressively, X marker stamps in with bounce on arrival;
  one-shot.
```

### BRIEF E233 — Compass Spinning to North
```
EFFECT: Compass needle spinning then settling toward north
WHERE IT FITS: Documentary
DESIGN: compass with needle in initial random direction.
MOTION INTENT: needle spins rapidly several rotations then decelerates and settles toward
  the target direction (north); one-shot.
```

---

## ADDITIONAL TEXTURES & MATERIALS

### BRIEF E234 — Foil Shimmer (Holographic)
```
EFFECT: Reflective foil shimmer with rainbow tint
WHERE IT FITS: Quiet Premium, Kinetic Pop
DESIGN: hero element with a foil-style overlay — gradient shifting through rainbow with
  subtle highlights.
MOTION INTENT: rainbow gradient slowly rotates angle creating shimmer effect; finite cycles.
```

### BRIEF E235 — Crumpled Paper Texture
```
EFFECT: Crumpled / creased paper background
WHERE IT FITS: Documentary, Warm Community
DESIGN: paper background with fold/crease lines visible as subtle shadows + highlights.
MOTION INTENT: static.
```

### BRIEF E236 — Gradient Noise (Fluid Gradient)
```
EFFECT: Smoothly morphing organic gradient
WHERE IT FITS: Quiet Premium, Kinetic Pop
DESIGN: large-scale gradient with multiple soft colour blobs blending smoothly across frame.
MOTION INTENT: blobs slowly drift / morph creating a living-gradient feel; finite cycles.
```

### BRIEF E237 — Cork Board Texture
```
EFFECT: Cork board background pattern
WHERE IT FITS: Warm Community, Documentary
DESIGN: subtle cork-grain pattern (small irregular flecks) overlaid on warm-tan base.
MOTION INTENT: static.
```

### BRIEF E238 — Denim Weave Pattern
```
EFFECT: Denim/jean weave pattern
WHERE IT FITS: Warm Community
DESIGN: diagonal twill pattern in indigo/blue tones.
MOTION INTENT: static.
```

---

## MECHANICAL / RHYTHMIC

### BRIEF E239 — Engine Pistons Up/Down
```
EFFECT: Multiple pistons moving in synchronised rhythm
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: 3-4 vertical piston shapes (rectangular columns with rounded heads) at staggered
  starting positions.
MOTION INTENT: pistons cycle up and down in rhythm with phase offset between pistons;
  finite cycles.
```

### BRIEF E240 — Conveyor Belt Motion
```
EFFECT: Items moving along a conveyor belt
WHERE IT FITS: Documentary, Kinetic Pop
DESIGN: horizontal belt with items distributed along it, slight perspective.
MOTION INTENT: items translate horizontally continuously suggesting belt motion;
  finite cycles.
```

---

## CARDS START HERE

(All briefs below produce single static cards; transitions and effects above produce
multi-state visual designs the motion runtime animates between.)

---

## EDITORIAL & LAYOUT

### BRIEF 01 — Magazine Pull-Quote Card

```
CARD: Magazine pull-quote
PURPOSE: hero scene showing a single brand quote / testimonial / manifesto line
WHERE IT FITS: Warm Community, Documentary, Quiet Premium stacks
PLACEHOLDER COPY:
  Quote: "Someone a few doors down probably has it."
  Attribution: "Kindred — community noticeboard"

DESIGN DIRECTION:
- Large opening serif quotation glyph (")  positioned top-left, oversized,
  in the brand accent colour, slightly tilted or kerned dramatically.
- The quote body in the display serif at 88-120px, italic, generous line height,
  centred or slight diagonal anchor.
- Attribution beneath in mono kicker at 24-32px, small caps, letter-spaced.
- Editorial / magazine feel — drop cap on the first letter optional.
- Background: brand canvas; consider a hairline rule above attribution.

MOTION INTENT: Quote glyph scales in first (0.6s, back.out), quote body fades up letter-
by-letter or word-by-word with 0.04s stagger, attribution slides up last. Total ~1.5s.
```

### BRIEF 02 — Newspaper Headline Card

```
CARD: Newspaper headline
PURPOSE: gravitas moment — declare a fact, headline-style
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER COPY:
  Masthead: "THE STREET TIMES"
  Date: "ESTABLISHED 2026"
  Headline: "Neighbours Find Each Other Again"
  Lede: "A new app turns ordinary streets into helping hands."

DESIGN DIRECTION:
- Top mono kicker masthead in small caps with hairline rules above + below.
- Date in italic centred between rules.
- Giant serif headline below (130-180px) — the hero element.
- Lede paragraph in body sans, 38-44px, 2-line max.
- All on cream canvas with subtle grain texture (use existing .paper-grain pattern).
- Should feel printed — slight off-register, generous margins.

MOTION INTENT: Masthead types in left-to-right (0.5s), rule lines extend, headline fades up
0.7s with back.out, lede word-stagger.
```

### BRIEF 03 — Two-Column Editorial Spread

```
CARD: Two-column editorial spread
PURPOSE: contrast pairing — left side question/problem, right side answer/solution
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER COPY:
  Left header: "BEFORE"
  Left body: "You needed a drill. You bought one. Used it twice."
  Right header: "AFTER"
  Right body: "You needed a drill. Your neighbour had one. You said thanks."

DESIGN DIRECTION:
- Vertical stack (we're 1080×1920) — top half = "before", bottom half = "after".
- Each half: small mono header, large display body.
- Centre line: a single horizontal hairline rule with a small marker (dot, asterisk, glyph).
- "Before" half feels muted (lower opacity, cooler colour); "After" half feels warmer / fuller.

MOTION INTENT: Top half slides down from top, marker pulses, bottom half slides up from
bottom — meet at centre rule.
```

---

## VISUAL COMPOSITION

### BRIEF 04 — Polaroid Stack Card

```
CARD: Polaroid photo stack
PURPOSE: nostalgic / lifestyle / community-feel imagery moment
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER CONTENT: 3 polaroid photos (use grey/cream rectangles as photo placeholders)
  with optional small handwritten captions ("the picnic", "harvest", "moving day")

DESIGN DIRECTION:
- 3 polaroid frames overlapping, each rotated -8°, +4°, -3° respectively.
- Each polaroid: white-cream paper border, photo area, optional handwritten caption (use
  italic display font as a stand-in for handwriting until we add a script font token).
- Subtle drop shadows that suggest paper depth.
- Centre-anchored, occupies middle 60% of frame.
- Imagery placeholders use grey (var(--card-slate-ink)) gradients as fillers for photo slots.

MOTION INTENT: Polaroids drop in one-by-one with slight rotation overshoot, 0.15s stagger,
back.out(2). Final state has all three settled.
```

### BRIEF 05 — Diagonal Split / Asymmetric Frame Card

```
CARD: Diagonal split frame
PURPOSE: before/after, problem/solution, with-us/without-us moments
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER COPY:
  Left/top half: "Stuck."
  Right/bottom half: "Found."

DESIGN DIRECTION:
- Frame is split by a 12-15° diagonal line from upper-left to lower-right.
- Two halves with distinct fills: top-left = darker (var(--card-navy) or brand-deep),
  bottom-right = lighter (var(--card-paper) or brand-accent).
- Each half holds one big word in display serif, anchored to its half.
- The diagonal line itself is a hairline in accent colour, with a small geometric marker
  (chevron, arrow, dot) at the centre.

MOTION INTENT: Diagonal line draws in first (0.6s, expo.out), halves fill with their colour
sliding in from opposite corners, words appear after halves are full.
```

### BRIEF 06 — Layered Depth Card (geometric)

```
CARD: Layered depth — abstract geometric stack
PURPOSE: tech/SaaS/fintech brand moments where photography would feel wrong
WHERE IT FITS: Kinetic Pop, Documentary, Quiet Premium
PLACEHOLDER COPY: Single phrase ("Built for the way you work.")

DESIGN DIRECTION:
- 4-5 abstract geometric shapes (rectangles, circles, organic blobs) stacked at varying
  depths with offset positions, creating parallax-like depth without literal photography.
- Each shape has subtle gradient or solid fill in token colours, with feathered edges
  / soft shadows.
- The headline phrase sits centred on top, in display serif at ~120px.
- Background canvas is brand neutral (cream or paper-soft).

MOTION INTENT: Shapes slide in from different directions with stagger (0.08s, expo.out),
headline crossfades on top.
```

### BRIEF 07 — Paper-Collage Card

```
CARD: Paper-collage / mixed-media
PURPOSE: hand-knit / craft / artisan / community brand moments
WHERE IT FITS: Warm Community
PLACEHOLDER COPY: "Made by neighbours, for neighbours."

DESIGN DIRECTION:
- A central piece of paper (cream, slightly off-square, faux-torn edge) holds the headline.
- Around it: 3-4 collage elements — strips of coloured paper, a circular sticker, a piece
  of "tape" (slightly translucent rectangle at an angle), a hand-drawn doodle frame.
- All elements have slight rotation, subtle drop shadows, suggesting paper layers.
- Texture is critical — feels analog, made-by-hand.

MOTION INTENT: Tape pieces drop in first with slight rotation, then central paper card,
then doodle / sticker pop on last as accents.
```

---

## CUSTOM ILLUSTRATION

### BRIEF 08 — Circular Badge / Seal Card

```
CARD: Circular badge / seal
PURPOSE: heritage marker, certification badge, vintage seal moment
WHERE IT FITS: Warm Community, Documentary, Quiet Premium
PLACEHOLDER COPY:
  Outer ring text (curved on a circular path): "EST. 2026 · NEW ZEALAND · KINDRED"
  Inner core: "FREE" or central icon (a star, a symbol)

DESIGN DIRECTION:
- A perfect circle ~700px diameter, centred on canvas.
- Outer ring of text following a circular path (use SVG textPath if needed).
- Inner concentric ring (hairline) separating the curved text from the core.
- Central symbol — large display character, simple geometric shape, or mono-line icon.
- Brand-accent colour for the ring; deep colour for the core text/symbol.
- Optional: stamp-aesthetic texture (very subtle dot grain / off-register feel).

MOTION INTENT: Circle scales in from 0 with slight rotation (0.7s, back.out 1.6), curved
text fades in clockwise, core symbol pops in last.
```

### BRIEF 09 — Banner Ribbon Card

```
CARD: Banner ribbon (sale / featured / new)
PURPOSE: emphasis flag / announcement overlay
WHERE IT FITS: Kinetic Pop, Warm Community
PLACEHOLDER COPY: "FREE FOREVER" or "NEW THIS WEEK"

DESIGN DIRECTION:
- Old-school banner ribbon shape: rectangular middle with two folded "tail" corners on
  each side (notched/v-cut ends).
- Bold, ALL CAPS text in mono or display.
- Brand-accent fill, contrasting text colour.
- Optional: subtle drop shadow to suggest the ribbon is folded/lifted off the canvas.
- Roughly 70% of frame width, centred horizontally, mid-frame vertically.

MOTION INTENT: Ribbon unfurls — left fold extends left, right fold extends right
simultaneously (0.5s, power3.out), text fades in centred.
```

### BRIEF 10 — Sketch-Mark Callout Card

```
CARD: Hand-drawn sketch mark over text
PURPOSE: informal / handwritten emphasis on a key word or phrase
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER COPY: "We help streets <highlight>find each other</highlight>."

DESIGN DIRECTION:
- A normal display headline (~110px serif) with one phrase highlighted by a hand-drawn
  mark — circle, underline, swoosh, or rough rectangle around the words.
- The mark itself is an SVG path, slightly wobbly (not pixel-perfect — feels drawn by hand).
- Mark uses brand-accent colour; rest of text in default colour.
- Place 2-3 candidate marks: under the phrase, around the phrase, with an arrow pointing.
  Pick the strongest in the bundle.

MOTION INTENT: Headline appears first (0.5s fade-up). After headline lands, mark draws
itself in via stroke-dashoffset (0.7s, expo.out).
```

### BRIEF 11 — Wax-Stamp / Heritage Seal Card

```
CARD: Wax-stamp / impressed seal
PURPOSE: trust marker, certification, hand-of-craft
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER COPY: Single letter monogram ("K") or short phrase ("KINDRED CO")

DESIGN DIRECTION:
- Off-circle wax shape (irregular edges, organic blobs around the perimeter — not perfect).
- Deep brand-accent colour with subtle gradient suggesting raised relief / wax depth.
- Centre features the monogram or text in serif, slightly debossed feel.
- Slight rotation off-axis (3-5°) suggests it was pressed by hand.
- Soft shadow underneath suggests it sits on paper.

MOTION INTENT: Stamp scales in from 1.4 with quick recovery (0.4s, back.out 2), as if
pressed. Slight bounce settle.
```

### BRIEF 12 — Hand-Drawn Arrow Callout Card

```
CARD: Hand-drawn arrow pointing at content
PURPOSE: informal "look at this" emphasis
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER CONTENT: Arrow + label combination ("← like this", "follow it down ↓")

DESIGN DIRECTION:
- A drawn arrow (curved, with slight imperfection — not arrowhead-perfect) pointing at
  a specific element on the canvas. Curved Bezier shape feels hand-drawn.
- Label text alongside the arrow in italic display or rough sans-serif.
- Arrow + label always sit as a package; design 2-3 directional variants
  (down-left, up-right, left-curve).

MOTION INTENT: Arrow draws in via stroke-dashoffset (0.6s, power2.out), label fades in
once arrow lands.
```

---

## TYPOGRAPHY EFFECTS

### BRIEF 13 — Text-with-Image Fill Card

```
CARD: Display text whose letterforms are filled with photography
PURPOSE: hero typographic moment with strong visual impact
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER COPY: "KINDRED" (single bold word, ALL CAPS or sentence case)

DESIGN DIRECTION:
- Single display word, ~280-340px, in heaviest available weight of var(--card-font-display).
- The letterforms are CSS-clipped to reveal a background-image / gradient / texture instead
  of a solid colour. (Use background-clip: text technique with -webkit-background-clip: text.)
- Background can be a gradient or a placeholder photo / texture stand-in.
- Word centred. Optional: a small kicker or attribution beneath in plain text.

MOTION INTENT: Word fades up + scales from 0.92 (0.7s, expo.out). Background gradient can
slowly drift behind during the scene.
```

### BRIEF 14 — Kinetic Stack Card

```
CARD: Single phrase stacked vertically, deliberately broken
PURPOSE: high-impact text moment, scroll-stopping
WHERE IT FITS: Kinetic Pop
PLACEHOLDER COPY: "FREE / LOCAL / FOREVER" (each word on its own line)

DESIGN DIRECTION:
- Three or four words, one per line, each word in display serif at 180-220px.
- Aggressive negative letter-spacing (-0.04em or tighter).
- Words alternate in alignment (left, centre, right) for kinetic asymmetry.
- Or: each word a different colour from the brand palette.
- Background: brand-color solid; optional grain.

MOTION INTENT: Each word slams in with scale 0.85 → 1.0 + opacity, stagger 0.18s,
back.out 1.8.
```

### BRIEF 15 — Variable-Font Axis Sweep Card

```
CARD: Single word that morphs across a variable-font axis
PURPOSE: showcasing brand's own typographic identity in motion
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER COPY: "KINDRED" or "MOVE" or "GROW"

DESIGN DIRECTION:
- Single word, very large (~280px), centred.
- Designed in 2-3 STATES showing the word at different variable-font axis values:
  state-1: light weight, narrow optical-size
  state-2: medium weight, default opsz
  state-3: heavy weight, large opsz
- Each state is a separate CSS class. Claude Code GSAP-tweens font-variation-settings between
  them for the morph.

MOTION INTENT: Tween font-variation-settings smoothly between the three states across the
scene, then settle on state 3.
```

### BRIEF 16 — Stencil Cut-Out Type Card

```
CARD: Display word with stencil aesthetic (cut-out feel)
PURPOSE: brand-stamped moment with industrial / military / craft feel
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER COPY: "GIVE" or "ASK"

DESIGN DIRECTION:
- Heavy display word, treated to look stencilled — letter shapes have small "bridges" or
  gaps preserving counter-form integrity (like A's triangle, R's loop).
- Could use a stencil font OR achieve via CSS clip-paths if no stencil font is in our tokens.
- Background: contrasting solid; word in token-accent.
- Optional: faint over-spray noise around letter edges.

MOTION INTENT: Word reveals via clip-path slide (left-to-right wipe over 0.6s) as if spray-
painted in real time.
```

---

## DATA VISUALISATION

### BRIEF 17 — Stat Hero Card

```
CARD: One giant number + label + supporting line
PURPOSE: single statistic delivered with visual impact
WHERE IT FITS: ALL stacks
PLACEHOLDER COPY:
  Number: "100%"
  Label: "FREE"
  Supporting: "for every street in New Zealand"

DESIGN DIRECTION:
- The number is HUGE — 280-380px display serif, dominant on the canvas.
- Label in mono kicker beneath, ~32-44px, ALL CAPS, letter-spaced.
- Supporting line in body / italic, smaller, two-line max.
- Optional: a contextual visual element near the number — a small bar, an arc, a circle
  graph that gives it weight without being a chart.
- Number should feel art-directed, not auto-generated.

MOTION INTENT: Number can count up from 0 → final value over 1.2s (Claude Code wires the
counter via GSAP). Label fades in mid-count, supporting line fades last.
```

### BRIEF 18 — Designed Bar Chart Card

```
CARD: Art-directed bar chart (3-5 bars)
PURPOSE: data with personality — bars feel designed, not auto-generated
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER DATA: 4 bars labelled "MON / TUE / WED / THU" with values 12, 28, 45, 67

DESIGN DIRECTION:
- Vertical bars with rounded tops (not square).
- Each bar in token-accent colour with subtle gradient (lighter at top, darker at bottom).
- Bar widths: chunky, generous spacing between.
- Labels under each bar in mono, 24-28px.
- Value labels above each bar in display, 36-44px.
- No axis lines (no Y-axis label scale) — values speak for themselves.
- Highest bar slightly highlighted (different colour or thicker stroke).

MOTION INTENT: Bars grow from height 0 with stagger (0.1s offset), labels fade in once
bar lands.
```

### BRIEF 19 — Donut / Radial Progress Card

```
CARD: Circular progress indicator with central number
PURPOSE: pricing tier, completion percentage, achievement metric
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER COPY:
  Centre: "78%"
  Label below: "OF NEIGHBOURS HELP"

DESIGN DIRECTION:
- A donut/ring, ~600px diameter, with a thick stroke (~50px wide).
- Background ring in muted colour; foreground arc in accent colour, drawn to the percentage.
- Central number in display serif at ~180px.
- Label in mono kicker beneath.
- Stroke-linecap: round for clean ends.

MOTION INTENT: Foreground arc draws around the ring via stroke-dashoffset (1.0s, power2.inOut).
Number counts up alongside the arc draw. Label fades in last.
```

### BRIEF 20 — Horizontal Timeline Card

```
CARD: Horizontal timeline with labelled events
PURPOSE: process / journey / history beat
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER DATA: 4 events ("2024 / Founded", "2025 / 100 streets", "2026 / Launched", "TODAY")

DESIGN DIRECTION:
- A horizontal axis line, hairline, accent colour, spanning frame width with margin.
- Tick marks at each event point — circles or vertical bars.
- Event label above each tick in display serif (~44px) with year/date in mono kicker.
- 4 events evenly spaced.
- The CURRENT event (last one) highlighted: filled circle, larger label, accent colour.

MOTION INTENT: Axis line draws left-to-right (0.7s), tick marks pop in at their positions
with stagger, labels fade in above their ticks.
```

---

## DEVICE / PRODUCT MOCKUPS

### BRIEF 21 — Phone-In-Hand Mockup Card

```
CARD: Phone held at angle showing app screenshot
PURPOSE: app showcase — more dynamic than flat phone-frame
WHERE IT FITS: Warm Community, Kinetic Pop, Quiet Premium
PLACEHOLDER CONTENT: phone outline + screen placeholder rectangle (no actual screenshot —
  Claude Code drops in the brand's app screenshot at handoff)

DESIGN DIRECTION:
- Phone shape (rounded rectangle with notch/dynamic-island detail) shown at a 12-15° rotation
  on the Y-axis (perspective tilt), with hand silhouette holding it from the bottom-left.
- Hand: simplified silhouette (or minimal flesh-tone shape) — no realistic texture, just
  graphical form.
- Phone screen area is empty — leave a labelled `[SCREENSHOT_SLOT]` placeholder.
- Drop shadow under phone to ground it.
- Frame the phone at 50-60% of canvas height, centred.

MOTION INTENT: Phone slides up from below + rotates to its angle position (0.8s, back.out 1.4),
hand fades in slightly after.
```

### BRIEF 22 — Browser-Frame Card

```
CARD: Browser window with web screenshot placeholder
PURPOSE: SaaS / web-product showcase
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER CONTENT: browser chrome (window controls, URL bar showing brand URL)
  + screenshot placeholder

DESIGN DIRECTION:
- A browser window: top chrome with three traffic-light dots (red/yellow/green), URL bar
  showing brand domain (placeholder: "kindred-nz.org"), tab indicator.
- Below: empty rectangular screenshot area `[BROWSER_SCREENSHOT]`.
- Window has rounded corners, drop shadow, possibly a slight 3D tilt (reduced —
  4-6° max).
- Background: muted grey/neutral; or the brand-canvas colour at lower opacity.

MOTION INTENT: Browser slides up from below + scales from 0.9 (0.7s, back.out 1.3),
URL bar text types in left-to-right.
```

### BRIEF 23 — Multi-Screen Carousel Card

```
CARD: Three phone screens in a row showing different app states
PURPOSE: app showcase — multiple flows in one frame
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER CONTENT: 3 phone outlines in a row, each with `[SCREEN_N_SLOT]` placeholder

DESIGN DIRECTION:
- 3 phones aligned vertically (as a row of stacked phones — they're tall, we're vertical),
  or arranged horizontally if the design accommodates 3 phones at smaller scale.
- Centre phone slightly larger or in the front (foreground emphasis); side phones slightly
  smaller or behind.
- Background: muted brand canvas with subtle gradient.
- Drop shadows to suggest depth.

MOTION INTENT: Centre phone enters first (slide up from below), side phones slide in from
left and right with stagger (0.15s offset), back.out 1.4.
```

---

## PRICING & COMMERCE

### BRIEF 24 — Single-Tier Pricing Card

```
CARD: Pricing card — one plan
PURPOSE: alternative CTA scene with pricing instead of free-trial pill
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER COPY:
  Plan name: "STREET PLAN"
  Price: "$0 / month"
  Tagline: "Yes, really."
  Features: ["Unlimited posts", "Verified neighbours", "No ads, ever", "Local-only"]
  CTA: "Try it free"

DESIGN DIRECTION:
- Card-shaped panel, rounded corners (var(--card-r-lg)), generous padding.
- Top: plan name in mono kicker.
- Hero: the price, BIG (~200px display serif).
- Tagline in italic body, light weight.
- Features list — 4 lines, each with a checkmark icon (use Lucide check-circle inline SVG)
  and feature label.
- CTA button at bottom — pill-shaped, brand-accent fill.
- Card sits centred, ~70% frame width.

MOTION INTENT: Card slides up from below (0.7s, back.out 1.4), price scales in big
(back.out 1.8), features stagger-fade-up (0.1s offset), CTA button pops last.
```

### BRIEF 25 — Three-Plan Comparison Card

```
CARD: Three pricing plans side-by-side
PURPOSE: feature-comparison moment
WHERE IT FITS: Documentary
PLACEHOLDER DATA: 3 plans ("STREET / NEIGHBOURHOOD / CITY") with 4 feature rows each

DESIGN DIRECTION:
- Three column cards in a horizontal stack (we're vertical, so stack vertically with each
  card filling the full width — or stack 3 cards top-to-bottom).
- Middle plan highlighted: brand-accent border, slightly larger scale, "RECOMMENDED" ribbon.
- Each card: plan name kicker, price hero, feature list (4 rows with ✓/✗ marks), CTA.
- Smaller scale than BRIEF 24 since 3 cards must fit.

MOTION INTENT: All three cards slide up with stagger (0.15s), recommended ribbon pops on
middle card last as accent.
```

---

## SOCIAL / COMMUNITY

### BRIEF 26 — Speech-Bubble Chat Card

```
CARD: Messaging-app conversation
PURPOSE: community / messaging brand demo (perfect for Kindred-style brands)
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER CONTENT: 4 messages alternating between two users
  Message 1 (left): "Anyone got a drill?"
  Message 2 (right): "I do — knock anytime."
  Message 3 (left): "🙏"
  Message 4 (right): "🤝"

DESIGN DIRECTION:
- Realistic chat bubble shapes — left bubbles flush left with a tail pointing left-down,
  right bubbles flush right with a tail pointing right-down.
- Left bubbles: muted background (paper-soft), navy text.
- Right bubbles: brand-accent fill, paper-coloured text.
- Bubbles ~70% of frame width, generous padding inside (40px).
- Optional: timestamp small text between bubbles, 22px mono.
- Optional avatar placeholders (small circles) next to first bubble of each speaker.

MOTION INTENT: Bubbles enter one-by-one with realistic chat timing (typing-indicator
moment optional), each scales up from 0.8 with back.out 1.6, ~0.6s between bubbles.
```

### BRIEF 27 — Testimonial-with-Avatar Card

```
CARD: Quote + person attribution with avatar circle
PURPOSE: social-proof testimonial moment
WHERE IT FITS: Warm Community, Documentary, Quiet Premium
PLACEHOLDER COPY:
  Quote: "I borrowed a ladder, met two neighbours, and brought soup back the next day."
  Name: "Sara, Wellington"
  Avatar: placeholder circle

DESIGN DIRECTION:
- Quote body: large display serif (~80px), italic, anchors top half of frame.
- Below: small circular avatar (use a placeholder colour-block circle), name in display
  ~36px, location in mono kicker ~24px.
- Avatar sits to the LEFT of name+location stack.
- Optional: small opening-quote glyph before the quote, accent-coloured.

MOTION INTENT: Quote fades up word-by-word, then a brief pause, then avatar pops in (back.out 2),
name+location slide in from left.
```

### BRIEF 28 — Logo Grid Card ("Trusted by")

```
CARD: 6 partner / customer / press logos in a grid
PURPOSE: social-proof "trusted by" moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER CONTENT: 6 logo-shaped placeholders in a 3×2 grid

DESIGN DIRECTION:
- Top: small mono kicker "AS SEEN IN" or "TRUSTED BY" or "SUPPORTING".
- Grid: 3 columns × 2 rows of logo placeholders, each ~280px wide × ~100px tall.
- Logos all rendered in the same neutral colour (var(--card-slate-ink)) to maintain
  visual consistency despite varying brand identities.
- Generous gap between cells.
- Optional: a thin hairline frame around the whole grid.

MOTION INTENT: Kicker fades first, logos cascade in with stagger (left-to-right, top-to-bottom,
0.08s offset).
```

---

## SPECIFIC MOMENTS

### BRIEF 29 — Achievement / Award Badge Card

```
CARD: Award or achievement badge moment
PURPOSE: highlighting a recognition / certification / win
WHERE IT FITS: Warm Community, Documentary, Quiet Premium
PLACEHOLDER COPY:
  Award icon (centre — ribbon, star, laurel)
  Title: "BEST COMMUNITY APP"
  Subtitle: "AOTEAROA DESIGN AWARDS 2026"

DESIGN DIRECTION:
- Central award icon: laurel wreath OR ribbon-rosette OR star burst, drawn in token accent.
- Above and below the icon: arched ribbon banners (curved horizontally) holding the title
  and subtitle.
- Old-medal aesthetic — possibly with subtle gradient suggesting metallic depth.
- Placement: centred, occupies middle 70% of frame.
- Dark-mode variant should look like a gold-on-dark medal (warmer accent on dark bg).

MOTION INTENT: Icon scales in from 0 with bounce (back.out 2.2), banners unfurl horizontally
above and below, text fades in on banners.
```

### BRIEF 30 — Vintage Poster Card

```
CARD: Vintage advertising poster aesthetic
PURPOSE: bold typographic moment with retro flair
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER COPY: "JOIN YOUR STREET TODAY!" with a smaller "EST. 2026" subtitle

DESIGN DIRECTION:
- 1920s-1950s travel-poster vibes — ALL CAPS condensed display, generous letter-spacing,
  art-deco geometric ornament around the edges.
- Hero phrase massive, broken across 2-3 lines for impact.
- Decorative elements: hairline geometric shapes (chevrons, sunburst rays, diamond corners).
- Background: brand canvas with very subtle paper texture.
- "EST. 2026" ribbon or stamp in a bottom corner.

MOTION INTENT: Decorative elements draw on first via stroke-dashoffset, hero text scales in
big with each line staggered (0.18s, expo.out), final stamp pops in last.
```

### BRIEF 31 — Receipt / Printout Card

```
CARD: Itemised receipt aesthetic
PURPOSE: transparency / no-hidden-fees / breakdown moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER CONTENT: receipt-style layout with line items and totals
  Header: "KINDRED COMMUNITY APP"
  Line items: "Membership / $0", "Ads / $0", "Algorithm fee / $0", "Hidden charges / $0"
  Total: "TOTAL / $0"
  Footer: "THANK YOU * STAY LOCAL *"

DESIGN DIRECTION:
- Vertical receipt-paper card (~60% frame width), torn-edge top OR perforated edges.
- Mono font throughout (var(--card-font-mono)) for the receipt-printer feel.
- Header with hairline rules.
- Line items: name on left, value on right, dotted leader line between.
- Total at bottom with bolder type and double rule above.
- Footer in italic with asterisk decoration.

MOTION INTENT: Receipt rolls down from top of frame (0.8s, power2.out) with slight bounce
at end, lines fade in top-to-bottom in stagger.
```

### BRIEF 32 — Calendar / Date Card

```
CARD: Calendar page or date display
PURPOSE: time-based moment, deadline, save-the-date
WHERE IT FITS: Documentary, Warm Community, Kinetic Pop
PLACEHOLDER COPY:
  Month: "MARCH"
  Day number: "14"
  Day name: "MONDAY"
  Sub: "neighbourhood meet-up"

DESIGN DIRECTION:
- Calendar-page aesthetic: rectangular card with rounded top corners, ring-bound (small
  circles at top suggesting binder rings).
- Month at top in bold ALL CAPS with hairline rules above and below.
- Day number HUGE (~280px display serif), centred.
- Day name in mono kicker beneath.
- Sub line in italic body at bottom.
- Subtle paper texture / grain.

MOTION INTENT: Card flips down from top (CSS perspective with rotateX(-90deg) → 0deg),
0.8s, back.out 1.4. Day number can count up briefly to the final value if dramatic.
```

---

## EDITORIAL & PRINT — additional

### BRIEF 33 — Index Card / Catalogue Page
```
CARD: Library catalogue card / archival index
PURPOSE: heritage / craft / curated-archive feel
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: classification number "K—2026.04", taxonomy "COMMUNITY / NEIGHBOURHOOD / HELP",
  index entry "Apps for the way streets used to talk."
DESIGN: typewriter mono throughout, hairline rule above and below classification,
  generous indent, slight off-register card-paper texture, subtle hole-punch at left edge.
MOTION INTENT: card slides in from left, classification types in left-to-right, taxonomy fades.
```

### BRIEF 34 — Open Book Spread
```
CARD: Open book / two-page spread
PURPOSE: storytelling moment, chapter opener
WHERE IT FITS: Documentary, Quiet Premium, Warm Community
PLACEHOLDER: chapter "01 / FOUND.", body lorem-style line, page numbers
DESIGN: vertical spread (we're 9:16) so design as a single page with a hint of binding shadow
  along one edge. Drop cap on first letter (display serif, ~140px). Chapter kicker. Body
  in serif 36-44px. Page number in mono kicker bottom corner.
MOTION INTENT: drop cap scales in (back.out 1.6), body fades up word-by-word.
```

### BRIEF 35 — Letterpress / Printed Page
```
CARD: Letterpress impression aesthetic
PURPOSE: heritage / craft / artisan moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: "PRESSED BY HAND / KINDRED CO" with a simple ornamental flourish
DESIGN: cream paper canvas, subtle off-register layered shadows on each text element giving
  the slight "double-strike" feel of letterpress. Centred display serif at 100px with deeper
  inked shadow offset 2px down/right. Hairline ornamental rule with small geometric centre mark.
MOTION INTENT: text appears with a quick "press" effect — scale up from 1.05 to 1.0 then settle.
```

---

## VISUAL COMPOSITION — additional

### BRIEF 36 — Color-Block Grid Card
```
CARD: Modular grid of coloured rectangles holding text
PURPOSE: clean Swiss-design / editorial layout
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 4 rectangles arranged 2x2, each holding a single big word
  ("GIVE" / "ASK" / "FIND" / "LOCAL")
DESIGN: 4 rectangles in different token colours from the brand palette, sharp edges,
  zero rounding, generous padding inside each cell. Each holds one ALL-CAPS word in
  display at 100px+. Optional thin gap between cells revealing background.
MOTION INTENT: rectangles cascade in from off-frame in a clockwise pattern, each scales
  up into place.
```

### BRIEF 37 — Frame-Within-Frame Card
```
CARD: Nested rectangular frames creating depth (matryoshka)
PURPOSE: zoom-in feel without literal photography
WHERE IT FITS: Quiet Premium, Documentary
PLACEHOLDER: centre line "We see what's close."
DESIGN: 3-4 concentric rectangles of decreasing size, each with a hairline frame, slight
  offset rotation per layer. Innermost frame holds the headline. Outer frames are empty
  space — implied perspective.
MOTION INTENT: frames draw in from outside-in, stroke-dashoffset on each, stagger 0.15s.
```

### BRIEF 38 — Cinema Clapboard Card
```
CARD: Film-set clapboard / clapper aesthetic
PURPOSE: cinematic / behind-the-scenes / making-of moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: "SCENE 01 / TAKE 04 / KINDRED LAUNCH"
DESIGN: classic black-and-white striped top bar (alternating diagonal stripes), the slate
  body with chalk-style typography, scene/take/title fields with handwritten-feel display.
  Slight angle (~3°) suggesting a held prop.
MOTION INTENT: clapper "claps" — top bar swings down with rotation, settles. Then text appears.
```

### BRIEF 39 — Theatre Curtain Reveal
```
CARD: Stage curtains parting to reveal content
PURPOSE: dramatic reveal moment
WHERE IT FITS: Quiet Premium, Documentary
PLACEHOLDER: revealed phrase "Here we go."
DESIGN: design TWO STATES — closed (curtains meeting in centre, heavy drape with vertical
  pleats) and open (curtains pulled to either side, revealing centred content). Curtains in
  deep accent colour, pleats suggested by gradient stripes.
MOTION INTENT: curtains slide horizontally apart from centre (1.2s, expo.out), revealed text
  fades up after curtains pass.
```

### BRIEF 40 — Film Grain / Analog Frame
```
CARD: Vintage film-frame border with date overlay
PURPOSE: nostalgic / archival photography moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: photo placeholder slot + date stamp "MARCH 14, 1987" in corner
DESIGN: thick cream-coloured film border with sprocket holes along left+right edges, sprocket
  holes as small rounded squares cut from the border. Centre photo area as placeholder.
  Date stamp in red-ink retro typewriter mono in bottom-right.
MOTION INTENT: frame slides up from below, sprocket holes appear with stagger left-to-right,
  date stamp types in.
```

---

## CUSTOM ILLUSTRATION — additional

### BRIEF 41 — Compass / Wayfinding Card
```
CARD: Compass with cardinal directions
PURPOSE: navigation / discovery / orientation moment
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: compass needle pointing toward "LOCAL"
DESIGN: circular compass with hairline circular frame, N/E/S/W marked at cardinal points
  in mono, additional 8-point tick marks for intermediate directions. A pointer needle
  drawn as a stylised arrow (red-tipped or accent-tipped). Needle points to one direction.
MOTION INTENT: compass scales in from 0 with rotation (0.7s, back.out), needle settles
  toward target direction with 1-2 oscillations.
```

### BRIEF 42 — Postage Stamp Card
```
CARD: Postage stamp aesthetic
PURPOSE: heritage / international / mail-era nostalgic moment
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER: stamp value "100¢ / FREE", country "AOTEAROA / NEW ZEALAND", small illustration slot
DESIGN: rectangular stamp with perforated edges (small semicircles cut along all sides),
  thick ornamental inner border, central illustration area + value/country text.
  Slight rotation suggesting it was placed by hand on an envelope.
MOTION INTENT: stamp drops in from above with slight rotation (back.out 1.4), perforation
  edges briefly highlight.
```

### BRIEF 43 — Boarding Pass / Ticket Card
```
CARD: Travel ticket / boarding pass aesthetic
PURPOSE: journey / event / departure moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: "FROM / SOLO" → "TO / TOGETHER", date, gate number, barcode strip
DESIGN: horizontal ticket layout (rotate 90° if stacked vertically — or render 2 stub ends
  with perforated separation between). Mono typography throughout. Barcode strip at bottom
  using vertical lines of varying widths.
MOTION INTENT: ticket slides in from edge, perforation animates with quick "tear" between
  the stub and main ticket.
```

### BRIEF 44 — Map with Route Pin
```
CARD: Stylised illustrated map with location pin
PURPOSE: location / coverage / "where we are" moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: simplified map shape (NZ outline as a stand-in), single pin marker
DESIGN: hand-drawn / stylised map outline (no photorealism — flat shapes, hairline strokes).
  Pin marker drawn in accent colour at a specific location. Optional dotted line indicating
  path. Subtle hatching or texture on land masses.
MOTION INTENT: map outline draws in via stroke-dashoffset, pin pops in with bounce, optional
  dotted path animates from start to pin.
```

---

## TYPOGRAPHY EFFECTS — additional

### BRIEF 45 — Outlined / Stroked Text
```
CARD: Display word with outline-only treatment (no fill)
PURPOSE: bold typographic flourish without visual heaviness
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER: "KINDRED" in heavy display, outline-stroke only
DESIGN: massive display word at 280px+ with -webkit-text-stroke or stroke property only,
  no fill (or very low-opacity fill). Stroke colour in accent. Word centred.
MOTION INTENT: stroke draws around the letterforms (animate stroke-dashoffset on each
  letter path), then optional fill swaps in to fill the outline.
```

### BRIEF 46 — Marquee Text Strip
```
CARD: Continuous-scrolling text strip across canvas
PURPOSE: kinetic emphasis / motion-driven brand moment
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: "GIVE • ASK • LOCAL • GIVE • ASK • LOCAL •" repeating
DESIGN: a single horizontal strip across mid-frame, large display ALL CAPS text repeating
  with bullet separators. Strip height ~140px. Background of strip in accent colour with
  contrasting text colour, OR vice versa. Edges of strip flush to frame.
MOTION INTENT: text translates horizontally across the strip continuously (Claude Code wires
  finite-repeat translateX with calculated cycles to fit scene duration).
```

### BRIEF 47 — 3D Extruded Display Word
```
CARD: Display word with 3D extrusion / depth
PURPOSE: bold heroic typographic moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: "FREE" or "GIVE"
DESIGN: massive display ALL CAPS word with multiple-layer text-shadow creating an extruded
  3D effect (typically 8-15 stacked shadow layers in decreasing intensity offset by 1-2px each).
  Front layer in accent colour, extrusion in deep complementary colour.
MOTION INTENT: word slides up from below with the extrusion building behind it (shadow layers
  fade in sequence).
```

---

## DATA VIZ — additional

### BRIEF 48 — Vertical Roadmap / Milestone Card
```
CARD: Vertical timeline of milestones
PURPOSE: roadmap / journey / multi-step process
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: 4 milestones with date + name pairs
DESIGN: a vertical line down the centre of the frame, with milestone tick-marks (filled
  circles or geometric shapes) at evenly-spaced points. Each milestone has its label
  alternating left/right of the line: date in mono, name in display serif.
MOTION INTENT: line draws top-to-bottom, ticks pop in at each milestone, labels fade
  alternately left and right.
```

### BRIEF 49 — Heatmap Grid Card
```
CARD: Calendar-style heatmap (GitHub-contribution-style)
PURPOSE: activity / consistency / streak visualisation
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: 7x7 or 5x10 grid of squares with varying colour intensity
DESIGN: grid of small rounded squares (each ~50-60px). Colour intensity varies from light
  (muted accent) to deep (full accent) representing activity. Cluster of "active" cells
  forms a recognisable pattern. Above grid: kicker label. Below: legend (less ← more).
MOTION INTENT: cells fade in cell-by-cell with stagger (0.04s offset, total ~2s for full
  grid), giving the impression of activity accumulating.
```

### BRIEF 50 — Network / Connections Card
```
CARD: Network graph showing connections
PURPOSE: community / relationships / mutual-aid moment
WHERE IT FITS: Warm Community
PLACEHOLDER: 5-7 nodes (circles) connected by lines forming a small network
DESIGN: circular nodes of varying sizes positioned across canvas, connected by thin lines.
  Largest node at centre (the "you") with peripheral nodes labelled with placeholder names.
  Subtle node-shadows for depth.
MOTION INTENT: central node pops in first, peripheral nodes appear with stagger, lines draw
  between them via stroke-dashoffset.
```

---

## DEVICE — additional

### BRIEF 51 — Watch-Face Mockup
```
CARD: Smartwatch face displaying app data
PURPOSE: wearable-app showcase
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER: watch outline + screen showing time/notification placeholder
DESIGN: rounded rectangular watch shape with crown/button details on side. Strap stubs
  visible top and bottom (truncated). Screen area shows simulated UI placeholder.
  Strap in muted leather/rubber-look fill.
MOTION INTENT: watch slides in with slight rotation, screen content fades in after watch lands.
```

### BRIEF 52 — Open Laptop Mockup
```
CARD: Laptop open at slight angle
PURPOSE: web-product / desktop-software showcase
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: laptop outline, screen placeholder
DESIGN: laptop in 3/4 view with screen open at ~110° angle, keyboard area suggested below.
  Subtle hinge detail. Drop shadow underneath to ground it.
MOTION INTENT: laptop slides up + lid opens (rotateX from 0 to current angle), screen content
  fades in once lid is open.
```

---

## SPECIFIC MOMENTS — additional

### BRIEF 53 — Loading / Progress Card
```
CARD: Progress indicator with state
PURPOSE: building anticipation / showing process
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: progress bar + "75% / SETTING UP YOUR STREET"
DESIGN: horizontal progress bar in muted track with accent fill. Label above bar in mono kicker.
  Optional: percentage number in display serif beside the bar. Subtle pulse/shimmer on the
  filled portion suggesting active progress.
MOTION INTENT: bar fills from 0 to target percentage (1.5s, power2.inOut), number counts up
  alongside.
```

### BRIEF 54 — Empty State / Welcome Card
```
CARD: First-time empty state with friendly illustration
PURPOSE: onboarding / "you're new here" moment
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: simple illustration + "WELCOME / Your street awaits."
DESIGN: centred circular or organic illustration placeholder (a simple line-illustration of
  a house, a hand wave, etc.). Below: warm welcome message in display serif. Even more below:
  small kicker prompt to take action.
MOTION INTENT: illustration scales in with bounce, message fades up word-by-word, action
  prompt fades in last.
```

### BRIEF 55 — Success Card with Checkmark
```
CARD: Completion / success confirmation
PURPOSE: positive resolution / "you did it" moment
WHERE IT FITS: ALL stacks
PLACEHOLDER: large checkmark icon + "DONE / WELCOME HOME"
DESIGN: large circular badge with a checkmark inside, accent colour fill. Below: confirmation
  message in display serif.
MOTION INTENT: badge scales in with bounce (back.out 2.2), checkmark draws inside via
  stroke-dashoffset, message fades up.
```

### BRIEF 56 — Onboarding Step Card
```
CARD: Single step in a multi-step process with progress dots
PURPOSE: walkthrough / multi-step explainer
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: step number, title, body, dot-progress at bottom (filled / empty)
DESIGN: step kicker (e.g. "STEP 02 / 04") at top. Title in display below. Body text in
  readable serif. Bottom: row of small dots indicating progress (1 filled, 3 empty).
MOTION INTENT: dots fill in sequence, current step's content fades up.
```

---

## SOCIAL / COMMUNITY — additional

### BRIEF 57 — Review Card with Stars
```
CARD: Customer review with star rating + name + comment
PURPOSE: app-store review / testimonial-with-rating
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 5-star row, review text, reviewer name, review source
DESIGN: top — row of 5 star icons (Lucide-style) in accent colour, slight glow. Below —
  review quote in italic display serif. Below — small avatar circle + reviewer name + source
  ("App Store / 5.0").
MOTION INTENT: stars fill in left-to-right one by one with subtle pop, then quote fades up.
```

### BRIEF 58 — Comment Thread Card
```
CARD: Threaded comment / reply chain
PURPOSE: conversation / community discussion moment
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: 2-3 stacked comment cards with avatar + name + timestamp + comment body
DESIGN: each comment is a self-contained mini-card with rounded-rectangle background.
  Replies indent slightly and have a connecting line from the parent. Avatars are small
  circular placeholders.
MOTION INTENT: parent comment lands first, replies cascade in with stagger.
```

### BRIEF 59 — Username + Tweet Card
```
CARD: Tweet-style microblog post
PURPOSE: social-media moment / quoted post
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: avatar + handle + display name + post body + small action row
DESIGN: card with rounded-rectangle frame. Top row: avatar circle + display name (display
  serif) + @handle (mono kicker). Body below in readable sans. Bottom: small icon row
  (heart, reply, share) in muted colour with counts.
MOTION INTENT: card slides up + scales from 0.94, action row fades in after card lands.
```

---

## CREATIVE / PLAYFUL — additional

### BRIEF 60 — Sticky Note Card
```
CARD: Yellow sticky-note aesthetic with handwritten message
PURPOSE: informal / hand-noted / casual reminder moment
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: handwritten-feel message "Remember the keys 🗝️"
DESIGN: square-ish yellow paper sticky note (use a warm token if available, or solid colour).
  Slight rotation (-3 to +5°). Message in italic display (or script font when added). Subtle
  drop shadow + curled-corner effect at one edge.
MOTION INTENT: sticky note slaps onto canvas with rotation overshoot (back.out 2), settles.
```

### BRIEF 61 — Playing Card / Card-Game Style
```
CARD: Playing-card aesthetic with ornate corners
PURPOSE: ornamental / game / collectable moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: corner suit/value markers, central illustration / glyph
DESIGN: vertical card with rounded corners and subtle inner-frame border. Top-left and
  bottom-right corners have small "value" + "suit" markers (mirror-rotated for bottom-right).
  Centre features a large symbolic illustration or initial.
MOTION INTENT: card flips into view (rotateY from 90° to 0°), revealing face. 0.7s, back.out 1.3.
```

### BRIEF 62 — Pull-Tab Coupon
```
CARD: Tear-off coupon with perforated edge
PURPOSE: offer / discount / promotional moment
WHERE IT FITS: Kinetic Pop, Warm Community
PLACEHOLDER: top section "FREE TRIAL" + perforation line + bottom "REDEEM AT KINDRED-NZ.ORG"
DESIGN: vertical card divided by a perforated line (small semicircles cut along the line).
  Top section in accent colour with bold offer message. Bottom section in muted colour with
  redemption code + URL.
MOTION INTENT: card lands flat, then bottom section "tears off" with rotation as if pulled
  away. Optional final state: tab separated.
```

### BRIEF 63 — Definition Card (Dictionary Style)
```
CARD: Dictionary / glossary entry aesthetic
PURPOSE: brand-term definition / vocabulary / meaning moment
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: term "kindred / kIn-drid", part of speech "(adj.)", definition body
DESIGN: top: term in heavy display + small italic phonetic spelling alongside. Below:
  part-of-speech label in mono italic. Below: definition body in serif. Optional: example
  sentence in italic at bottom indented.
MOTION INTENT: term types in left-to-right, phonetic fades in, definition body fades up
  word-by-word.
```

### BRIEF 64 — Recipe Card
```
CARD: Cookbook recipe-card aesthetic
PURPOSE: instructional / step-based / craft moment
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER: title "How to start a street", ingredients list, steps numbered
DESIGN: cream paper card with hairline frame. Title in display serif at top. Below:
  "INGREDIENTS" kicker + bullet list. Below: "METHOD" kicker + numbered steps. Mono
  metadata (servings, time) in corner.
MOTION INTENT: card lands, title types in, ingredients fade-up sequentially, method steps
  number-in-then-text-fade.
```

---

## EDUCATION — additional

### BRIEF 65 — Did-You-Know Fact Card
```
CARD: Fact-of-the-day / tidbit moment
PURPOSE: surprise / interesting-stat moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: kicker "DID YOU KNOW", body "1 in 4 households have a tool they only used twice."
DESIGN: top: small kicker in mono with subtle ornamental glyphs around it. Below: large
  serif statement. Optional: a small illustrative icon to support the fact.
MOTION INTENT: kicker types in, ornamental glyphs pop in around it, statement fades up.
```

### BRIEF 66 — Quiz Question Card
```
CARD: Multiple-choice question with options
PURPOSE: interactive / engagement / "guess the answer" moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: question + 3-4 options labelled A/B/C/D
DESIGN: question at top in display serif. Below: options as horizontal pill buttons or
  letter-prefixed rows. One option highlighted (correct or selected) in accent colour.
MOTION INTENT: question fades up, options cascade in with stagger, highlighted option
  pulses subtly.
```

---

## FORMS & INTERACTION (rendered as static states)

### BRIEF 67 — Search Bar with Results
```
CARD: Search bar with autocomplete result rows
PURPOSE: search-functionality showcase
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: search input "drill", 3-4 result rows below ("Power drill", "Drill bits", etc.)
DESIGN: pill-shaped search input with magnifier icon left, cursor blinking after text. Below:
  result rows separated by hairlines, each with a small leading icon + result text + optional
  meta. Highlighted (hovered) row has accent-tinted background.
MOTION INTENT: text types into search field, results cascade in from top with stagger.
```

### BRIEF 68 — Filter Chips Row
```
CARD: Horizontal row of filter chips
PURPOSE: category / tag filtering moment
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: 5-6 chips ("Tools", "Food", "Kids", "Garden", "Help") with one active
DESIGN: pill-shaped chips with optional leading icon, generous internal padding. Active chip
  in accent fill, others in muted background. Single horizontal row with consistent gap.
MOTION INTENT: chips fade in left-to-right with stagger, active chip pulses subtly.
```

### BRIEF 69 — Toggle Switches Row
```
CARD: List of settings with toggle switches
PURPOSE: settings / preferences / control moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 4 rows ("Notifications / on", "Local only / on", "Ads / off", "Algorithm / off")
DESIGN: each row: setting label left, toggle switch right. Toggle = pill-shaped track with
  circular knob, accent fill when "on". Hairline separators between rows.
MOTION INTENT: rows fade up with stagger, toggles animate to their state (knob slides) once
  row lands.
```

### BRIEF 70 — Tooltip with Arrow
```
CARD: Annotation tooltip pointing at element
PURPOSE: explainer / "look here" moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: tooltip "Tap to share" with arrow pointing down
DESIGN: rounded-rectangle tooltip with directional triangular arrow on one edge (down/up/left/right).
  Tooltip body in accent fill with contrasting text. Arrow same colour, integrated.
MOTION INTENT: tooltip pops in with bounce (back.out 2.2), small pulse to draw attention.
```

### BRIEF 71 — Breadcrumb Trail
```
CARD: Hierarchical navigation breadcrumb
PURPOSE: location / hierarchy / "where you are" moment
WHERE IT FITS: Documentary
PLACEHOLDER: "HOME / NEIGHBOURHOOD / GIVE / Drill"
DESIGN: horizontal text row with separators (chevron / slash / arrow). Earlier crumbs muted,
  current crumb (last) in accent and bold.
MOTION INTENT: each crumb types in left-to-right with separator drawing in between.
```

### BRIEF 72 — Banner Alert
```
CARD: Top-of-app notification banner
PURPOSE: announcement / alert / important-info moment
WHERE IT FITS: Kinetic Pop, Warm Community
PLACEHOLDER: "🎉 NEW: Local meet-ups every Saturday." with X dismiss icon
DESIGN: full-width horizontal banner in accent or warm colour. Leading icon, message body,
  trailing dismiss icon. Slight drop-shadow to suggest it sits above content.
MOTION INTENT: banner slides down from top of frame, settles, optional gentle pulse on icon.
```

---

## ADDITIONAL CHARTS

### BRIEF 73 — Pie Chart Card
```
CARD: Pie chart with labelled segments
PURPOSE: proportional / "of the whole" data moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: 4 segments labelled with category + percentage
DESIGN: circular pie split into wedges, each wedge in a different brand-token shade. Labels
  positioned outside the pie connected by hairline leader lines. Optional centre cutout
  to make it a donut variation.
MOTION INTENT: each wedge sweeps in clockwise from 0 to its arc with stagger.
```

### BRIEF 74 — Funnel Chart
```
CARD: Conversion funnel with stage labels
PURPOSE: process / drop-off / pipeline moment
WHERE IT FITS: Documentary
PLACEHOLDER: 4 stages narrowing from top to bottom with values
DESIGN: stacked trapezoidal segments narrowing as they descend. Each segment has its label
  + value. Colours move from light to deep accent top-to-bottom.
MOTION INTENT: segments cascade in top-to-bottom, each scaling from the centre.
```

### BRIEF 75 — Spark Line / Trend Line
```
CARD: Minimal trend line indicator
PURPOSE: subtle data context (e.g. inline with a stat)
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: single sparkline showing rising trend, with label "+47% / 30 DAYS"
DESIGN: small horizontal sparkline (not full chart) — a clean line with subtle area fill
  beneath. Endpoint marker (small dot) emphasised. Label alongside.
MOTION INTENT: line draws left-to-right via stroke-dashoffset, area fill fades up after.
```

### BRIEF 76 — Radar / Spider Chart
```
CARD: Radar chart for multi-axis comparison
PURPOSE: feature / strength comparison moment
WHERE IT FITS: Documentary
PLACEHOLDER: 5-6 axes with values, labelled (e.g. "speed / cost / community / privacy / freshness")
DESIGN: hexagonal/octagonal grid of axes radiating from centre, with concentric grid rings.
  Plotted polygon connects datapoints across axes, semi-transparent fill in accent colour.
MOTION INTENT: grid draws first, polygon outline draws around stroke-dashoffset, fill fades up.
```

### BRIEF 77 — Word Cloud / Tag Cloud
```
CARD: Tag cloud of varying-size words
PURPOSE: theme / topic / sentiment moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 12-20 words at varying sizes ("community", "share", "local", "kindness", etc.)
DESIGN: free-form arrangement of words at varying sizes (largest 100px down to 28px).
  Words arranged organically with rotation variations (-20° to +20°). Different brand tokens
  for variety.
MOTION INTENT: words fade in random order with seeded stagger, each scales from 0.7 to 1.0.
```

---

## E-COMMERCE

### BRIEF 78 — Product Listing Card
```
CARD: Product card with image, title, price
PURPOSE: e-commerce / catalogue moment
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER: product image slot, title "Vintage Drill", price "$0", optional condition badge
DESIGN: square or 4:3 image area at top, padding around it. Below: title in display, price
  in mono. Optional: small badge ("Borrowed", "Free", "Local") in corner.
MOTION INTENT: image fades up, title slides up after, price scales in last with bounce.
```

### BRIEF 79 — Shopping Cart Summary
```
CARD: Cart with line items + total
PURPOSE: checkout / cart-review moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 3 items with quantity + price each, subtotal, total
DESIGN: stacked rows with thumbnail + name + qty/price. Hairline separators. Bottom: total
  line in heavier weight, accent colour.
MOTION INTENT: items cascade in, total emphasises with bounce.
```

### BRIEF 80 — Subscription Box Card
```
CARD: Monthly subscription / box-of-the-month aesthetic
PURPOSE: recurring / curated / subscription product
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: box illustration + "MARCH BOX" + contents preview
DESIGN: stylised gift-box illustration centred. Above: month label in mono kicker. Below:
  small icons / text representing contents.
MOTION INTENT: box drops in with bounce, contents preview reveals as if opening lid.
```

### BRIEF 81 — Gift Card / Voucher
```
CARD: Gift voucher aesthetic
PURPOSE: gift / promotion / share-the-wealth moment
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: voucher amount "$0 / FREE", redemption code "KIND2026", expiry date
DESIGN: horizontal voucher card with ornamental hairline border. Top: amount in display.
  Middle: redemption code in mono with letter-spacing. Bottom: expiry + brand mark.
  Optional: foil-effect gradient.
MOTION INTENT: voucher slides in horizontally, code "stamps" in with quick scale.
```

### BRIEF 82 — QR Code Card
```
CARD: QR code with brand frame
PURPOSE: scan-to-act CTA moment
WHERE IT FITS: ALL stacks
PLACEHOLDER: QR code placeholder square, "SCAN TO JOIN" kicker, small brand mark in corner
DESIGN: square QR code area centred (use a placeholder grid pattern; brand can drop real
  QR in later). Surrounding frame in accent colour with brand mark in one corner.
  Caption below.
MOTION INTENT: frame draws in first, QR code reveals via mosaic-style animation
  (cells fade in with seeded stagger).
```

---

## CALENDAR / TIME

### BRIEF 83 — Countdown Timer
```
CARD: Live countdown to event
PURPOSE: urgency / anticipation / "coming soon" moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: "DAYS / HOURS / MINUTES" with values "07 / 14 / 32"
DESIGN: three large number blocks side-by-side with their unit labels beneath. Each number
  in a flip-card aesthetic (rectangular with horizontal mid-line suggesting flip). Display
  serif numerals.
MOTION INTENT: numbers tick from higher to lower values with flip-card animation.
```

### BRIEF 84 — Weekly Schedule
```
CARD: Week view with events
PURPOSE: schedule / availability / weekly-rhythm moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: 7 day columns, events dotted across them
DESIGN: 7 vertical columns labelled with day names at top. Events as colored blocks
  positioned in their day at varying heights/durations. Accent colour for "today" column.
MOTION INTENT: column headers fade in left-to-right, events pop into their columns with stagger.
```

### BRIEF 85 — Monthly Calendar Grid
```
CARD: Full month grid with highlighted dates
PURPOSE: monthly view / event-marking
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: 7-column calendar grid, current month, several highlighted dates
DESIGN: month name + year as header. Day-of-week headers in mono kicker. Date cells in a
  6x7 grid. Today's date filled with accent. Other highlighted dates with smaller accent dots.
MOTION INTENT: grid fades in cell-by-cell with cascading stagger; today's marker pops last.
```

### BRIEF 86 — Anniversary / Memorial Card
```
CARD: Date marker for an anniversary
PURPOSE: commemorative / "X years ago today" moment
WHERE IT FITS: Documentary, Quiet Premium, Warm Community
PLACEHOLDER: "5 YEARS" + "MARCH 14" + caption "since the first street was kindred"
DESIGN: large display number (the years), date underneath in mono kicker, caption beneath
  in italic body. Optional ornamental hairline rules around the number.
MOTION INTENT: number scales in from 0 with bounce, date fades in, caption types out word-by-word.
```

---

## MUSIC / AUDIO

### BRIEF 87 — Now-Playing Card
```
CARD: Music player with album art + track info
PURPOSE: media / lifestyle / music-app moment
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER: album art slot, track title, artist, progress bar
DESIGN: square album art top, then track title in display, artist in mono kicker beneath,
  progress bar at bottom with current/total time.
MOTION INTENT: album art fades up, track info slides in, progress bar fills (Claude Code
  wires the fill timing to scene duration).
```

### BRIEF 88 — Vinyl Record Card
```
CARD: Spinning vinyl record aesthetic
PURPOSE: music / heritage / analog moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: vinyl with centre label, record sleeve placeholder
DESIGN: circular vinyl with concentric ring grooves (subtle), centre label in accent colour
  with small text. Optional: half-shown sleeve at one edge.
MOTION INTENT: vinyl rotates slowly through the scene (Claude Code wires finite rotation).
```

### BRIEF 89 — Audio Waveform
```
CARD: Audio waveform visualisation
PURPOSE: sound / podcast / audio-recording moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: horizontal waveform showing amplitude bars, time markers
DESIGN: row of vertical bars of varying heights along a horizontal axis. Bars in accent
  colour. Optional: a playhead indicator at a specific position.
MOTION INTENT: bars cascade in left-to-right; playhead pulses.
```

### BRIEF 90 — Equaliser Visualiser
```
CARD: Live audio equaliser bars
PURPOSE: kinetic / live-music / audio-reactive moment
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: 10-12 vertical bars at varying heights, frequency labels
DESIGN: row of vertical bars at different heights. Bars in accent colour with gradient.
  Bars have rounded tops.
MOTION INTENT: bars rise/fall continuously (Claude Code wires finite-cycle pulses).
```

---

## HEALTH / FITNESS

### BRIEF 91 — Activity Ring
```
CARD: Apple-style activity rings
PURPOSE: progress / activity / goal-tracking moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 3 concentric rings at different fill percentages, centre value
DESIGN: 3 concentric rings (move/exercise/stand-style), each in different colour, drawn at
  varying completion percentages with stroke-linecap: round. Values in centre or alongside.
MOTION INTENT: rings draw simultaneously around their arcs; values count up alongside.
```

### BRIEF 92 — Heart Rate Pulse
```
CARD: ECG-style pulse line
PURPOSE: vitality / live / monitoring moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: heart icon + ECG waveform + BPM value
DESIGN: small heart icon left, then horizontal ECG-style waveform across, then BPM number
  on right in display.
MOTION INTENT: line draws across, heart pulses on each beat (synced).
```

### BRIEF 93 — Step Counter
```
CARD: Step count with goal progress
PURPOSE: fitness / daily-goal moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: step count "8,247", goal indicator "of 10,000", progress bar
DESIGN: large step count in display, goal sub-line in mono, progress bar beneath. Optional:
  small foot/walking-icon.
MOTION INTENT: step count counts up rapidly to value, progress bar fills alongside.
```

---

## FINANCE

### BRIEF 94 — Stock Price Card
```
CARD: Stock ticker with price and change
PURPOSE: financial / market / data moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: ticker "KIND", price "$0.00", change "+0%" or "—", small chart
DESIGN: ticker symbol in mono caps, price in display, change indicator with up/down arrow,
  miniature spark-line chart beside.
MOTION INTENT: price counts up from start to current, change indicator pulses, chart draws.
```

### BRIEF 95 — Bank Statement Row
```
CARD: Single transaction row
PURPOSE: financial transaction / itemised activity moment
WHERE IT FITS: Documentary
PLACEHOLDER: date, description, category icon, amount
DESIGN: horizontal row with date in mono, then small category icon, then description, then
  amount aligned right (negative in red-tinted accent, positive in green-tinted).
MOTION INTENT: row slides in from left, amount counts to value.
```

### BRIEF 96 — Currency Exchange Card
```
CARD: From-to currency conversion
PURPOSE: international / commerce / exchange moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: "100 USD" → "164 NZD", exchange rate, last-updated time
DESIGN: two large amounts side-by-side or stacked with arrow between. Currency codes in mono
  kicker beneath each. Small rate caption + timestamp at bottom.
MOTION INTENT: from-amount lands first, arrow draws, to-amount counts up to value.
```

---

## TRAVEL / EVENT

### BRIEF 97 — Flight Info Card
```
CARD: Flight departure / arrival info
PURPOSE: travel / departure / journey moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: "AKL → WLG", date, departure time, gate
DESIGN: large airport codes side-by-side with arrow between. Below: date, time, gate in
  mono. Optional small plane icon along the arrow.
MOTION INTENT: codes type in, plane icon flies along the arrow path, time info fades up.
```

### BRIEF 98 — Concert Ticket
```
CARD: Concert / event ticket
PURPOSE: event / experience / "save the date" moment
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER: artist/event name, venue, date, time, seat
DESIGN: horizontal ticket layout with perforated stub on right. Main: event name in display,
  venue + date in mono. Stub: seat info, ticket number.
MOTION INTENT: ticket slides in horizontally, perforation animates briefly.
```

### BRIEF 99 — Itinerary Day Card
```
CARD: Single day's itinerary
PURPOSE: travel-planning / agenda moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: day name "MONDAY", 4-5 timed activities
DESIGN: day name as header in display. Below: vertical list of times + activities, each row
  with mono time + activity description.
MOTION INTENT: day header lands first, activities cascade in chronologically.
```

---

## SPECIALTY BRAND

### BRIEF 100 — Coffee Menu Card
```
CARD: Café/coffee menu item
PURPOSE: hospitality / food-service / menu moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: item name "FLAT WHITE", description, price, optional pairing note
DESIGN: item name in display ALL CAPS. Price aligned right. Description beneath in italic.
  Optional small icon (coffee cup, leaf, etc.) and pairing/notes below.
MOTION INTENT: name types in, price scales in beside, description fades up.
```

### BRIEF 101 — Wine Label
```
CARD: Wine bottle label aesthetic
PURPOSE: heritage / craft / hospitality moment
WHERE IT FITS: Quiet Premium
PLACEHOLDER: vintage year, varietal name, region, vineyard name
DESIGN: vertical rectangular label with ornamental hairline border. Vintage in display
  serif (e.g. "2024"). Varietal in mono caps. Region + vineyard in italic body. Optional
  small ornamental glyph or coat-of-arms.
MOTION INTENT: label scales up with subtle rotation, ornaments draw in via stroke-dashoffset.
```

### BRIEF 102 — Restaurant Menu Item
```
CARD: Menu item with description and price
PURPOSE: hospitality / food / menu-card moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: dish name, key ingredients, price, optional dietary marker (V, GF)
DESIGN: dish name in display serif. Below: ingredients as a single italic line. Price aligned
  right. Optional small ovals or icons for dietary markers.
MOTION INTENT: dish name types in, ingredients fade up, price scales in.
```

### BRIEF 103 — Yoga Sequence Card
```
CARD: Yoga pose / sequence moment
PURPOSE: wellness / movement / craft moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: pose name "TREE POSE", duration "30s", small icon/illustration
DESIGN: minimal centred composition with pose-icon (simple line illustration) at top, name
  in display below, duration in mono kicker beneath. Optional Sanskrit name in italic.
MOTION INTENT: icon draws in via stroke-dashoffset, name fades up word-by-word.
```

---

## DOCUMENTS / LETTERS

### BRIEF 104 — Letter / Envelope Opening
```
CARD: Letter unfolding from envelope
PURPOSE: invitation / personal / heritage moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: envelope visual with letter peeking out + brief message preview
DESIGN: design TWO STATES — closed (envelope visible, flap closed) and open (envelope flap
  pulled back, letter sticking out). Letter has visible top portion with message header.
  Optional wax-seal in centre of envelope.
MOTION INTENT: envelope flap rotates open, letter slides up out of envelope.
```

### BRIEF 105 — Postcard Back
```
CARD: Postcard reverse with message + stamp + address
PURPOSE: travel / send-from-far / nostalgic communication moment
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER: handwritten message in italic display, address block, postage stamp + cancel mark
DESIGN: horizontal postcard divided by vertical line in centre. Left: handwritten message in
  italic display. Right: address block (italic display "FROM:" / "TO:" lines) + postage stamp
  in top-right corner with ink-cancel mark over it.
MOTION INTENT: postcard slides in from one edge with slight rotation, stamp "stamps" in with quick scale.
```

### BRIEF 106 — Memo / Interoffice Note
```
CARD: Office memo aesthetic
PURPOSE: corporate / archival / formal-but-personal moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: "MEMO" header, "TO/FROM/RE/DATE" fields, body
DESIGN: top: bold "MEMO" header with thick rule beneath. Below: 4 field rows ("TO:", "FROM:",
  "RE:", "DATE:") each in mono. Below: body paragraph in serif. Subtle paper texture.
MOTION INTENT: header types in, field rows fade in sequentially, body fades up word-by-word.
```

---

## PHOTOGRAPHY SPECIALS

### BRIEF 107 — Diptych (Two-Photo Grid)
```
CARD: Two photos side-by-side
PURPOSE: paired / before-after / juxtaposition moment
WHERE IT FITS: Quiet Premium, Documentary
PLACEHOLDER: two photo placeholder slots with optional captions beneath each
DESIGN: two equal photos side-by-side (or vertically stacked since we're 9:16) with thin
  hairline gap between. Each with optional small caption in mono italic beneath.
MOTION INTENT: photos slide in from outside edges, meet at centre.
```

### BRIEF 108 — Triptych (Three-Photo Panel)
```
CARD: Three-panel photo composition
PURPOSE: storytelling / sequential / triadic moment
WHERE IT FITS: Quiet Premium, Documentary
PLACEHOLDER: three photo placeholder slots
DESIGN: three vertical photo panels stacked or arranged with the centre photo larger /
  emphasised. Hairline gaps between.
MOTION INTENT: panels reveal in sequence with stagger.
```

### BRIEF 109 — Photobooth Strip
```
CARD: 4-photo vertical photobooth strip
PURPOSE: nostalgic / playful / sequence-of-moments
WHERE IT FITS: Warm Community, Kinetic Pop
PLACEHOLDER: 4 photo placeholders stacked vertically with cream paper border
DESIGN: 4 small square photos stacked vertically, all with cream paper border holding them
  together as a single strip. Slight rotation suggests it's been pulled from a machine.
MOTION INTENT: strip slides up from below with rotation, each photo briefly highlights in turn.
```

### BRIEF 110 — Magazine Cover
```
CARD: Magazine front cover aesthetic
PURPOSE: announcement / heroic-feature / publication moment
WHERE IT FITS: Quiet Premium, Documentary, Kinetic Pop
PLACEHOLDER: masthead at top, hero image slot, headline cover line, smaller cover lines
DESIGN: magazine-style layout — masthead in heavy display at top spanning full width.
  Below: hero photo slot. Overlaid: main cover headline in display, smaller cover lines
  ("inside:" with bullet points) at sides.
MOTION INTENT: masthead types in heavy/dramatic, hero image fades up, cover lines fade in
  sequentially.
```

---

## GAMING / ENTERTAINMENT

### BRIEF 111 — Game Controller Card
```
CARD: Game-pad / controller graphic
PURPOSE: gaming / interactive / play moment
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: simple controller outline with d-pad + 4 buttons + 2 sticks
DESIGN: stylised game-controller silhouette in flat shapes (not photoreal). Buttons highlighted
  in accent colour, d-pad in muted. One button optionally pulses to suggest "press here".
MOTION INTENT: controller fades up, highlighted button pulses with bounce.
```

### BRIEF 112 — Pixel-Art Aesthetic Card
```
CARD: 8-bit / 16-bit pixel-art style
PURPOSE: retro-gaming / nostalgic / kitsch moment
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: chunky pixelated word "READY" + simple pixel illustration
DESIGN: every element built from chunky square "pixels" (8-12px units). Pixel-perfect
  letterforms in a custom blocky face (or stack of small squares forming letters).
  Limited palette — 3-4 accent colours.
MOTION INTENT: pixel-by-pixel reveal — each pixel block fades in with stagger.
```

### BRIEF 113 — HUD Display
```
CARD: Heads-up display / sci-fi UI
PURPOSE: futuristic / tech / dashboard moment
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: corner-bracket framing, target reticle, status indicators
DESIGN: thin hairline corner brackets at four frame corners. Centre: target reticle
  (concentric circles + crosshair). Sides: small data readouts (numbers, mono kicker labels).
  Optional: scan line slowly traversing.
MOTION INTENT: brackets draw in from corners, reticle scales in with subtle rotation,
  data flickers/types in.
```

### BRIEF 114 — Achievement Unlock Pop
```
CARD: Game-style achievement notification
PURPOSE: milestone / unlock / "you did it" moment
WHERE IT FITS: Kinetic Pop, Warm Community
PLACEHOLDER: trophy/star icon + "ACHIEVEMENT UNLOCKED" + achievement name
DESIGN: horizontal banner-style card with gold/accent gradient. Trophy/star icon left,
  small "ACHIEVEMENT UNLOCKED" kicker, achievement name in display below.
MOTION INTENT: banner slides in from off-screen edge, trophy icon spins/pulses on land.
```

---

## SCI-FI / TECH

### BRIEF 115 — Circuit Board Pattern
```
CARD: PCB / circuit-trace pattern
PURPOSE: tech / engineering / under-the-hood moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: stylised circuit traces forming a pattern; central component placeholder
DESIGN: green or accent-coloured rectangular field with thin line "traces" running between
  small "component" rectangles and circles. Geometric, structured. Centre: a hero component
  (chip / IC) with text label.
MOTION INTENT: traces draw in via stroke-dashoffset following circuit paths, components
  pop in at endpoints.
```

### BRIEF 116 — Terminal / CLI Window
```
CARD: Command-line / terminal window
PURPOSE: developer / technical / behind-the-scenes moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: terminal window with prompt "$ kindred --launch" + simulated output
DESIGN: dark window with title-bar (fake "Terminal" label + dots). Body in monospace, green
  or accent text on dark bg. Cursor blinks at end. Multiple lines simulating command + output.
MOTION INTENT: lines type in one at a time with realistic typing rhythm; cursor blinks throughout.
```

### BRIEF 117 — Binary / Code Stream
```
CARD: Vertical streaming binary / code rain
PURPOSE: tech-aesthetic / Matrix-style / data moment
WHERE IT FITS: Kinetic Pop
PLACEHOLDER: columns of 0s and 1s or short code snippets falling vertically
DESIGN: 6-10 vertical columns of small monospace characters, each column's characters fade
  from bright (top of falling stream) to dim (trail). Background near-black; text accent-coloured.
MOTION INTENT: columns translate vertically continuously (Claude Code wires finite-cycle).
```

### BRIEF 118 — Hologram Card
```
CARD: Hologram / projected light effect
PURPOSE: futuristic / projected / sci-fi moment
WHERE IT FITS: Kinetic Pop, Quiet Premium
PLACEHOLDER: a central illustration / glyph appearing as if projected from below
DESIGN: central element with a slight upward gradient (lighter at top, fading at bottom)
  suggesting projection. Optional: thin scan-lines crossing horizontally. Slight blue/cyan
  glow around the edges.
MOTION INTENT: hologram materialises (fades up + scales) from a base point at bottom of frame.
```

---

## SPORTS

### BRIEF 119 — Scoreboard Card
```
CARD: Sports scoreboard with two teams
PURPOSE: competition / matchup / live-game moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: TEAM A name + score, TEAM B name + score, time/quarter indicator
DESIGN: horizontal scoreboard split into two halves (one per team). Each side: team
  abbreviation (3-letter mono caps) + score in massive display. Centre divider. Top: time
  and period in mono.
MOTION INTENT: scores tick up animatedly to current values; period indicator pulses.
```

### BRIEF 120 — Tournament Bracket
```
CARD: Single bracket round
PURPOSE: tournament / progression / matchup moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 4 teams in 2 matchups + 1 semifinal slot
DESIGN: hierarchical bracket — left side has 2 horizontal pair-rows (team vs team), right
  side has 1 row showing the winner advancing. Lines connect winners to next round.
MOTION INTENT: matchups light up with stagger; winners slide right to next round.
```

### BRIEF 121 — Player Stat Box
```
CARD: Player stats card
PURPOSE: athlete / team-member / performance moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: jersey number, player name, position, key stats (3-4 numbers)
DESIGN: jersey-number HUGE (the visual hero, ~280px). Name in display below. Position in
  mono kicker. Stat row with 3-4 small stat boxes (label + value).
MOTION INTENT: jersey number scales in big, name slides in, stats cascade.
```

### BRIEF 122 — Race Lane / Finish Line
```
CARD: Race lane with finish-line graphic
PURPOSE: competition / completion / "first across" moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: 3 lanes with positions (1st, 2nd, 3rd) + finish-line bar
DESIGN: 3 horizontal lanes stacked vertically, each labelled with position. Right edge: a
  black-and-white checkered finish-line bar. Lane 1 highlighted with accent.
MOTION INTENT: runners (or markers) sprint from left to finish line, leader arriving first.
```

---

## OFFICE / PRODUCTIVITY

### BRIEF 123 — Whiteboard Sketch
```
CARD: Whiteboard / blackboard with hand-drawn sketches
PURPOSE: brainstorming / strategy / conceptual moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: a centred text statement + hand-drawn arrows / circles around it
DESIGN: dark green or near-black canvas (chalkboard) or off-white (whiteboard) with subtle
  texture. Hand-drawn marks: arrows, circles, underlines, simple stick figures. Central
  message in handwritten-feel italic display.
MOTION INTENT: marks draw on with stroke-dashoffset, message appears with letter-by-letter
  typewriter effect.
```

### BRIEF 124 — Email Preview Card
```
CARD: Email inbox preview
PURPOSE: communication / mail / professional moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: sender, subject, preview body, timestamp, optional unread dot
DESIGN: horizontal row with leading avatar circle, then sender name (display) + timestamp
  (mono small) on top line, subject (display medium) on second line, preview body
  (italic body, truncated) on third line. Hairline border bottom.
MOTION INTENT: row slides in from left, unread dot pulses.
```

### BRIEF 125 — Kanban Board Column
```
CARD: Single kanban column with cards
PURPOSE: workflow / project-management / status moment
WHERE IT FITS: Documentary
PLACEHOLDER: column header "IN PROGRESS" + 3 task cards
DESIGN: vertical column with header strip in accent. Below: 3 small rectangular task cards
  stacked, each with title + small meta (assignee dot, due date).
MOTION INTENT: header lands first, task cards drop in one-by-one with stagger.
```

### BRIEF 126 — Mind Map Card
```
CARD: Central concept with branching ideas
PURPOSE: brainstorm / concept / structure moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: central node "KINDRED" + 5 radiating leaves (community, give, ask, find, local)
DESIGN: central circular node, 5 lines radiating out to leaf nodes positioned around it.
  Each leaf has its label. Lines are organic curves rather than straight.
MOTION INTENT: central node lands first, lines draw outward to each leaf, leaves pop in
  at line endpoints.
```

---

## LIFESTYLE / WELLNESS

### BRIEF 127 — Habit Tracker Card
```
CARD: Habit-tracking dot grid
PURPOSE: wellness / consistency / streak moment
WHERE IT FITS: Documentary, Warm Community
PLACEHOLDER: 30-day grid (5x6) with most days filled, indicating habit completion
DESIGN: 5x6 grid of small circles. Filled (completed) days in accent colour, empty days
  in muted track colour. Header: habit name + current streak count.
MOTION INTENT: circles fill in chronological order with stagger, streak count counts up.
```

### BRIEF 128 — Sleep Score Card
```
CARD: Sleep quality with score
PURPOSE: wellness / health / nightly recap moment
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: large score "82", quality label "GOOD", small sleep-stage timeline (deep/REM/light/awake)
DESIGN: massive score number top-centre, quality label beneath in mono. Below: horizontal
  stacked-bar showing sleep stages by colour across the night. Optional moon icon.
MOTION INTENT: score counts up to value, sleep stages fade in left-to-right.
```

### BRIEF 129 — Meditation Timer Card
```
CARD: Meditation / breathwork timer
PURPOSE: wellness / mindfulness / pause moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: circular ring with time count "5:00", "BREATHE" instruction, optional gentle pattern
DESIGN: large central circular ring with time inside. Minimal everything else. Accent ring
  in soft warm tone. Subtle pattern (dot grid, lotus shape) behind very low opacity.
MOTION INTENT: ring breathes — slowly scale 1.0 → 1.06 → 1.0 with sine ease (Claude Code
  wires finite cycle through scene duration).
```

### BRIEF 130 — Mood Selector
```
CARD: Mood / emotion picker with options
PURPOSE: wellness / journaling / how-are-you moment
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER: 5 mood faces (😊 😐 😞 etc — or stylised line illustrations) with one selected
DESIGN: row of 5 mood expressions, each in a circle. Selected mood larger / accent-filled.
  Caption beneath: "TODAY YOU'RE FEELING / [SELECTED MOOD]".
MOTION INTENT: faces fade in left-to-right, selected face pulses and scales up.
```

---

## EDUCATION

### BRIEF 131 — Diploma / Certificate Card
```
CARD: Certification / completion award
PURPOSE: achievement / qualification / completion moment
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: "CERTIFICATE OF" header, recipient name, date, signature placeholder, ornate seal
DESIGN: ornamental hairline border (formal corners). Title in display serif at top.
  Recipient name in calligraphic display. Date + signature line at bottom. Wax-seal
  graphic in lower-right corner.
MOTION INTENT: border draws in via stroke-dashoffset, name fades up, seal stamps in last.
```

### BRIEF 132 — Notebook Page Card
```
CARD: Spiral-bound notebook page with content
PURPOSE: study / journal / handwritten-feel moment
WHERE IT FITS: Warm Community, Documentary
PLACEHOLDER: lined notebook page with handwritten heading + body lines
DESIGN: paper background with thin horizontal ruled lines. Spiral binding circles along left
  edge. Heading in italic display. Body in italic display continuing on rule lines.
  Optional small hand-drawn doodle in corner.
MOTION INTENT: page slides in from left, lines reveal, body types in handwritten word-by-word.
```

### BRIEF 133 — Mathematical Formula Card
```
CARD: Equation / formula display
PURPOSE: technical / scientific / "the math" moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: "C = N × K" with variable definitions beneath
DESIGN: large centred formula in display serif (italic for variables). Variables explained
  beneath in smaller italic body. Optional small "where:" prefix.
MOTION INTENT: formula types in symbol-by-symbol, definitions fade up after.
```

### BRIEF 134 — Vocabulary Flashcard
```
CARD: Term + definition flashcard
PURPOSE: learning / vocabulary / study-aid moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: term on front, definition on back (design TWO STATES)
DESIGN: rectangular card. State 1: term in display serif centred. State 2: same card flipped
  to show definition in body serif on its back side. Optional pronunciation phonetics.
MOTION INTENT: card flips (rotateY 0 to 180) revealing back side; designed for state-toggle.
```

---

## CREATIVE TOOLS

### BRIEF 135 — Colour Palette Swatches
```
CARD: Brand colour palette display
PURPOSE: design-system / brand-spec / "our colours" moment
WHERE IT FITS: Documentary
PLACEHOLDER: 5-6 colour swatches with hex codes + names beneath each
DESIGN: row or grid of square colour swatches. Each swatch: solid fill, hex code in mono
  beneath, optional colour name (italic) below code. Generous spacing.
MOTION INTENT: swatches cascade in with stagger, hex codes type in alongside.
```

### BRIEF 136 — Type Specimen Card
```
CARD: Font specimen showcase
PURPOSE: typography / brand-system / "our type" moment
WHERE IT FITS: Documentary, Quiet Premium
PLACEHOLDER: font name, sample at multiple sizes, character set sample
DESIGN: top: font name in mono kicker. Below: hero sample at 200px showing the font's
  character. Below: smaller samples at 100px / 60px / 32px for hierarchy. Bottom: alphabet
  sample row.
MOTION INTENT: samples reveal top-to-bottom with stagger; alphabet types in left-to-right.
```

### BRIEF 137 — Editing Timeline Strip
```
CARD: Video / audio editing timeline
PURPOSE: production / craft / behind-the-scenes moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: horizontal timeline with 3-4 clip blocks at varying lengths
DESIGN: horizontal track with playhead position marker. Below: 2-3 stacked tracks with
  clip blocks of varying lengths, colour-coded by type. Labels above clips.
MOTION INTENT: tracks reveal, clips drop in at their positions, playhead sweeps left-to-right.
```

---

## PERSONAL / IDENTITY

### BRIEF 138 — Business Card
```
CARD: Business card aesthetic
PURPOSE: professional / contact / introduction moment
WHERE IT FITS: Quiet Premium, Documentary
PLACEHOLDER: name, title, company, contact details
DESIGN: rectangular card centred, ornamental hairline frame. Top: name in display.
  Below: title in italic. Below: company. Bottom: small contact line in mono.
MOTION INTENT: card slides in with subtle rotation, type fades in line-by-line.
```

### BRIEF 139 — Profile Card with Bio
```
CARD: Profile page with avatar + bio
PURPOSE: about-me / team / personal moment
WHERE IT FITS: Warm Community, Documentary
PLACEHOLDER: large avatar circle, name, role/title, short bio paragraph, location pin
DESIGN: centred avatar (circular, large 220px). Below: name in display, role in mono kicker,
  bio in italic body (2-3 lines), location with small pin icon at bottom.
MOTION INTENT: avatar scales in with bounce, name fades up, bio types in word-by-word.
```

### BRIEF 140 — ID Badge / Lanyard
```
CARD: Conference / staff ID badge on lanyard
PURPOSE: event / membership / identification moment
WHERE IT FITS: Kinetic Pop, Warm Community
PLACEHOLDER: badge with photo placeholder, name, role/access level, "STAFF"/"MEMBER" kicker
DESIGN: rectangular vertical badge with rounded corners + lanyard clip at top. Photo placeholder
  occupies upper third. Name/role in middle. Role badge ("STAFF") at bottom in accent fill.
  Lanyard cord (string) extends up off-frame.
MOTION INTENT: badge swings in from above (slight pendulum motion), settles upright.
```

---

## NEWS / MEDIA

### BRIEF 141 — Breaking News Banner
```
CARD: TV news breaking-news bottom banner
PURPOSE: urgent / announcement / news-flash moment
WHERE IT FITS: Kinetic Pop, Documentary
PLACEHOLDER: "BREAKING" label + headline scrolling/static
DESIGN: red or accent-coloured horizontal banner with bold "BREAKING" label left, then
  headline body in display ALL CAPS. Subtle scrolling-text effect at bottom of banner with
  smaller stories.
MOTION INTENT: banner slides up from bottom, "BREAKING" label pulses, headline fades in.
```

### BRIEF 142 — News Lower-Third
```
CARD: TV-news lower-third graphic (presenter caption)
PURPOSE: identification / context / TV-broadcast moment
WHERE IT FITS: Documentary, Kinetic Pop
PLACEHOLDER: name "JANE DOE", role "FOUNDER, KINDRED", optional outlet logo small
DESIGN: lower-third of frame: a colored bar with the name in display + role in mono kicker
  beneath. Optional: small leading icon / outlet logo. Subtle gradient on the bar.
MOTION INTENT: bar slides in from edge, text fades up.
```

### BRIEF 143 — Press Release Header
```
CARD: Formal press-release header aesthetic
PURPOSE: official / corporate-communication / announcement moment
WHERE IT FITS: Documentary
PLACEHOLDER: "FOR IMMEDIATE RELEASE" + date + headline + "—" delimiter + lede paragraph
DESIGN: top: small mono caps "FOR IMMEDIATE RELEASE" with hairline rule beneath. Date below.
  Massive serif headline. Lede paragraph below in body serif with em-dash divider before it.
MOTION INTENT: typewriter-style sequential reveal — release flag, date, headline, lede.
```

---

## CALENDAR SPECIALS

### BRIEF 144 — Birthday Card
```
CARD: Birthday celebration card
PURPOSE: personal / celebration / "happy birthday" moment
WHERE IT FITS: Warm Community
PLACEHOLDER: "HAPPY BIRTHDAY", recipient name, age, decorative confetti / balloons
DESIGN: centred composition. "HAPPY BIRTHDAY" in display serif (or playful display).
  Recipient name beneath. Age in display below. Confetti / balloon shapes scattered around.
MOTION INTENT: confetti pieces fall from top with rotation, message scales up with bounce.
```

### BRIEF 145 — Holiday Greeting Card
```
CARD: Generic holiday card aesthetic
PURPOSE: celebration / seasonal / greeting moment
WHERE IT FITS: Warm Community, Quiet Premium
PLACEHOLDER: greeting "WARMEST WISHES" + decorative motif (snowflake, leaf, flower)
DESIGN: centred greeting in display serif. Around it: 4-6 decorative motifs as line illustrations.
  Optional ornamental hairline border.
MOTION INTENT: motifs fade in one-by-one, greeting types in last with subtle scale.
```

### BRIEF 146 — Save-the-Date / Wedding Invitation
```
CARD: Wedding / event invitation aesthetic
PURPOSE: invitation / formal-event / heritage moment
WHERE IT FITS: Quiet Premium, Warm Community
PLACEHOLDER: names, date, venue, ornamental flourishes
DESIGN: ornate hairline border with corner flourishes. Top: small "SAVE THE DATE" or "TOGETHER
  WITH" kicker. Centre: names in calligraphic display. Below: date + venue in italic body.
  Optional ornament between names (& with flourish).
MOTION INTENT: ornaments draw in via stroke-dashoffset, names fade up with reverence.
```

---

## How many to author at once

Don't run all 32 in one session — the design system gets bloated and the cards-library.md
becomes hard to navigate. Suggested cadence:

- **Phase 1 (highest leverage):** BRIEF 17 (Stat Hero), 27 (Testimonial+Avatar), 28 (Logo Grid),
  04 (Polaroid Stack), 26 (Speech-Bubble Chat). Five cards covering ~80% of new-render needs.
- **Phase 2:** BRIEF 01 (Pull-Quote), 13 (Text-with-Image-Fill), 21 (Phone-In-Hand),
  08 (Circular Badge), 18 (Bar Chart). Adds visual depth.
- **Phase 3 onward:** specialty briefs as use-cases come up.

Each authored card lands in [cards-library.md](cards-library.md) with its bundle, plus a
"first proven on" project reference once it's used in a real render.

---

# === END OF PROMPT — DESIGN ALL THE BRIEFS ABOVE ===
