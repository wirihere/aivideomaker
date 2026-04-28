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

## OUTPUT FORMAT — what you return

1. **HTML block** — semantic markup, BEM classes (`.cardname` / `.cardname__element`)
2. **CSS block** — uses ONLY `var(--card-*)` tokens; light AND dark mode variants
3. **Visual STATES** as separate static classes if the card has them (default / is-active / is-exited)
4. **Motion intent** — one or two lines in plain English ("staggered fade-up, 0.12s offset, back.out(1.4)")
5. **Token usage report** — which tokens you used; flag any you'd like to exist

---

## NOW — DESIGN THIS:

[INSERT BRIEF HERE — paste your chosen brief from docs/playbooks/claude-design-card-briefs.md, including its CARD / PURPOSE / WHERE-IT-FITS / PLACEHOLDER-COPY / DESIGN-DIRECTION / MOTION-INTENT sections in full]

# === END OF PROMPT ===
