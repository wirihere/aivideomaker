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
