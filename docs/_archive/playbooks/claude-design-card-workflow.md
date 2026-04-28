> **ARCHIVED — external-tool integration not part of the current pipeline.**
> Archived 2026-04-28. Restore from `docs/_archive/` if Claude Design integration is reactivated.

---

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
