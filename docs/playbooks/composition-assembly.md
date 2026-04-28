# Composition Assembly — how each video gets built on screen

This playbook captures the visual + structural specs that turn a chosen archetype + register + brand-content into an HTML composition. It complements `docs/skills/how-a-video-gets-made.md` (the process doc), which covers Stages 1-10 from URL to MP4. The process doc says *what to do at each stage*; this playbook says *what each archetype looks like and how each register styles it*.

If you're new to the system, read `docs/skills/how-a-video-gets-made.md` first, then come back here when you reach Stage 7 ("Assemble the composition").

---

## How to read this playbook

The playbook has three halves:

- **Half 1 — Per-template-kind layout specs.** For each of the 11 video kinds (Hook, Stat reveal, etc.), what goes on screen, where, when, and how it animates. Brand-agnostic.
- **Half 2 — Per-register style specs (defaults only).** For each of the 5 registers (kinetic-pop, warm-community, documentary, quiet-premium, contemplative), what palette, type discipline, motion ease, music, and voice the register uses **as fallback when the brand doesn't supply its own**.
- **Half 3 — The brand-first rule.** Everything visual and textual prefers brand-derived values. Register defaults are floor, not ceiling.

The video-types table at the top of `docs/skills/how-a-video-gets-made.md` is the high-level summary; this playbook is the detailed expansion.

---

## Half 1 — Per-template-kind layout specs

For each archetype, the spec describes:

- **Slots** — the named pieces of content (e.g. cold-open, headline, body, CTA, URL)
- **Where** — on-screen position in plain terms
- **Type** — relative size + when italic vs roman
- **Timing** — when each scene starts and ends
- **Animation** — entrance / hold / exit per scene
- **Audio** — when music + voice play, when fade-out lands
- **Ambient layer** — what runs in the background the whole time

### Hook (15s)

**Use case:** a single piercing claim or question, then the brand reveal, then a URL. Top-of-funnel scroll-stopper.

**Slots:**
- `b0-flame` — small atmospheric element (candle / flame / pinprick of light)
- `b1-question` — the one piercing line
- `b2-emblem` — brand emblem
- `b2-wordmark` + `b2-wordmark-sub` — brand name + sub-mark
- `b2-hairline` — gold rule under wordmark
- `b3-cta` — action verb
- `b3-url` — URL

**Where:**
- `b0-flame`: dead center
- `b1-question`: center, full width with 80px side padding
- `b2-*`: stacked center, vertically centered
- `b3-*`: stacked center, vertically centered

**Type:** `b1-question` is huge italic (96px), full sentence, allowed to wrap to 2 lines. `b2-wordmark` is huge roman caps (110px). `b2-wordmark-sub` is large roman caps with wide tracking (44px @ 0.46em). `b3-cta` is large gold caps (56px @ 0.22em). `b3-url` is small sans utility.

**Timing:** B0 0-2.5s · B1 2-8.5s · B2 8.5-12.5s · B3 12.5-15s.

**Animation:** B0 flame fades up over 1.2s, holds, fades down over 0.6s before B1. B1 question types on character-by-character (2.4s typeOn), holds, exits with blur-up at scene boundary. B2 emblem fades + scales in (back.out 0.8s), wordmark + sub-mark stagger in (0.7s each), hairline draws left-to-right (0.9s). B3 fade up together, hold static through end (replay-loop friendly).

**Audio:** Music starts at 0, volume 0.18 (ducked under VO). VO starts at 0.5, volume 0.95, ~14s long. Music fades to 0 over the last 1.5s.

**Ambient layer:** Brand emblem in the corner (top-right or bottom-left depending on what's occupied), low opacity, slow rotation. Ambient haze running independent of GSAP timeline.

---

### Stat reveal (15-20s)

**Use case:** dramatize one real number or fact. Single-point-of-proof.

**Slots:**
- `b0-flame` — atmospheric element
- `b1-label` — small caps utility ("VERSES PROCESSED", "DAYS IN PRACTICE", etc.)
- `b1-counter` — the number that animates
- `b1-suffix` — qualifier ("in 31,102 paths", "since 2014", etc.)
- `b1-claim` — italic claim line that contextualizes the number
- `b2-cta` — action verb
- `b2-url` — URL

**Where:** counter dead-center; label above, suffix + claim below.

**Type:** counter is enormous bold (280px), label is small caps Arial (28px @ 0.32em tracking), claim is italic (52-64px).

**Timing:** B0 0-3s · B1 (label + counter + suffix + claim) 3-15s · B2 (CTA) 15-20s.

**Animation:** Label fades in. Counter animates 0 → target over 3s with `power3.out` ease (uses `textFx.counter`). Suffix fades in after counter lands. Claim types on after a 0.5s pause.

**Audio:** Music + VO same pattern as Hook. The counter's land-point is a natural place for a subtle audio accent (a single piano note) but not required.

**Ambient layer:** Same as Hook.

---

### Before-after (20-30s)

**Use case:** split or sequential reveal of pain → solution. Transformation arc.

**Slots:**
- `b1-before-state` — concrete description of "before" (with optional photo)
- `b1-before-detail` — body line elaborating
- `b2-bridge` — transition phrase (1-3 words: "until...", "then...", "now")
- `b3-after-state` — concrete description of "after" (with optional photo)
- `b3-after-detail` — body line elaborating
- `b4-cta` + `b4-url`

**Where:** Either split-screen (vertical or horizontal split) or sequential (full-frame swap). For 9:16, vertical split rare; sequential more common.

**Type:** State headlines are large bold (80-100px). Body lines are medium italic (40-50px).

**Timing (sequential):** B0 atmosphere 0-2s · B1 before 2-12s · B2 bridge 12-15s · B3 after 15-25s · B4 CTA 25-30s.

**Animation:** Strong contrast required between before and after — different palette tints, different motion register. Bridge scene is brief (3s), the bridge word lands hard.

**Audio:** Music underscore. VO often does the heavy lifting in this format; ensure VO matches the on-screen timing (the word "now" lands as the bridge).

**Ambient layer:** Same as Hook.

---

### Quick answer / FAQ (30s)

**Use case:** 2-3 common objections answered. Removes friction.

**Slots:**
- `b1-q1` + `b1-a1` — first question + answer
- `b2-q2` + `b2-a2` — second
- `b3-q3` + `b3-a3` — third
- `b4-cta` + `b4-url`

**Where:** Question and answer stacked center; question on top in smaller italic, answer below in larger roman.

**Type:** Question 40px italic in muted color. Answer 80-90px bold parchment. Sticker-pill-like contrast (per the patterns doc R3).

**Timing:** Each Q+A gets ~8s. CTA holds final 4s.

**Animation:** Question fades in fast, answer types on or fades up. Each Q+A exits before the next lands (clean cut, not crossfade).

**Audio:** Music underscore. VO reads questions in a slightly different inflection from answers.

**Ambient layer:** Same as Hook.

---

### Testimonial (30-45s)

**Use case:** pull-quote from a real witness with attribution. Authority by association.

**Slots:**
- `b0-photo` — subject photo (vignette-masked)
- `b1-quote-mark` — large gold opening quote mark
- `b1-quote` — the quote itself (italic)
- `b2-hairline` — gold rule under quote
- `b2-name` — attributed name (Arial caps utility)
- `b2-role` — role / title (Arial sentence-case lighter)
- `b3-emblem` — brand emblem
- `b3-wordmark` + `b3-wordmark-sub`
- `b4-cta` + `b4-url`

**Where:** Photo persists in upper portion through quote scenes (vignette-masked so it fades into the dark). Quote sits below photo around y=1100. Hairline + attribution sit further below at y~1500. Brand wordmark + CTA replace the whole stage in B3-B4.

**Type:** Quote is large italic (70px). Quote-mark is huge italic (200px) for visual weight. Name is small caps Arial (32px @ 0.18em tracking, uppercase). Role is medium Arial sentence-case in muted color (26px).

**Timing:** B0 photo establish 0-3s · B1 quote opens 3-14s · B2 quote settles + attribution lands 14-21s · B3 brand reveal 21-26s · B4 CTA 26-30s. (Note: B1's data-duration must extend through B2 so the quote stays visible while attribution lands beside it.)

**Animation:** Photo fades in with subtle Ken Burns push, continues drifting through full quote duration. Quote-mark stamps in first, then quote types on. Hairline draws left-to-right. Name + role fade in 0.6s each.

**Audio:** Music underscore. VO reads the quote — could be the witness's actual recorded voice if available, otherwise TTS in a register matching the brand.

**Ambient layer:** Brand emblem corner, low opacity.

---

### Product launch (30s)

**Use case:** name the new thing, show it, CTA. New-release announcement.

**Slots:**
- `b0-tease` — "coming" / "now" / date
- `b1-name` — product name (huge)
- `b1-tagline` — one-line description
- `b2-product-shot` — photo of the product in use
- `b2-benefit` — the key benefit
- `b3-availability` — date / where to get it
- `b3-cta` + `b3-url`

**Where:** Name dominates B1 center. Product shot dominates B2 (full-frame photo). CTA stack centers in B3.

**Type:** Product name is enormous bold (130-160px). Tagline is medium italic (50-60px). Benefit is large bold (80px).

**Timing:** B0 0-3s · B1 reveal 3-12s · B2 product 12-22s · B3 CTA 22-30s.

**Animation:** Cinematic. B1 name reveals with strong motion (push-in, scale-up, or wipe). B2 product photo holds with subtle Ken Burns. B3 CTA is static end-card.

**Audio:** Music has a percussive transient in the first 0.5s (per R6). VO is energetic, 1.7+ words/sec.

**Ambient layer:** Brand emblem corner. For kinetic register, add brief gold-flash accents at scene-boundary cuts.

---

### 3-step methodology (45s)

**Use case:** Roman numerals or numbered steps for a process. Educational.

**Slots:**
- `b0-promise` — cold-open italic line (1-2 sentences)
- `b1-numeral` (I.) + `b1-headline` (command) + `b1-body` (1-sentence elaboration) + `b1-hairline`
- `b2-numeral` (II.) + same pattern
- `b3-numeral` (III.) + same pattern
- `b4-outcome` — closing italic line (brand canon, never invented)
- `b5-wordmark` + `b5-cta` + `b5-url`

**Where:** Numeral top-left at huge size. Hairline below numeral. Headline mid-frame at large size. Body below headline at medium italic in muted color. Step layout uses left padding 100px, right 100px, top 280px, bottom 200px.

**Type:** Numeral is enormous (280px) italic bold gold with glow. Headline is huge bold (96px). Body is medium italic (44px) in muted color. Outcome is huge italic (116px) center-aligned with glow.

**Timing:** B0 0-4s · B1 4-14s · B2 14-24s · B3 24-34s · B4 outcome 34-41s · B5 CTA 41-45s.

**Animation:** Each step's pattern: numeral scales+fades in (back.out 0.8s) → hairline draws left-to-right (0.9s) → headline fades up (0.7s) → body fades up (0.7s). All four exit together with a 0.55s upward fade. Outcome types on character-by-character. CTA holds static final 2.5s.

**Audio:** Music underscore. VO reads alongside each step — about 18-22 words per step at contemplative pace. Music fades to 0 over the last 1.5s.

**Ambient layer:** Brand emblem in the bottom-left corner (top-right is occupied by numerals). Ambient haze + starfield.

**Reference implementation:** `compositions/templates/contemplative/methodology-45s.html`.

---

### Founder story (45-60s)

**Use case:** origin narrative in first-person voice.

**Slots:**
- `b0-photo` — founder photo (vignette-masked, persists)
- `b1-name` — founder name + role
- `b2-beat-1` — first origin beat ("In 2017, I...")
- `b3-beat-2` — second beat
- `b4-beat-3` — third beat (the resolution)
- `b5-promise` — what the brand stands for now
- `b6-cta` + `b6-url`

**Where:** Photo persists in upper portion. Beats stack below. Promise centers full-frame in B5. CTA centered B6.

**Type:** Beats are medium italic (42-50px) with some narrative weight. Promise is large bold (80-100px). Name is medium caps Arial.

**Timing:** B0 0-3s · B1 3-7s · B2 7-17s · B3 17-27s · B4 27-37s · B5 37-50s · B6 50-60s.

**Animation:** Slow, narrative pace. Beats fade in sequentially with no overlap. Promise lands as the cinematic climax. Photo Ken Burns through full duration.

**Audio:** Music underscore. VO is first-person, founder's voice if recorded, otherwise TTS in a warm voice.

**Ambient layer:** Brand emblem corner, low opacity.

---

### Case study (45-60s)

**Use case:** situation → action → result, narrated. Proof-by-narrative.

**Slots:**
- `b0-customer-name` — who the case is about
- `b1-situation` — concrete starting state
- `b2-action` — what was done
- `b3-result` — concrete ending state (with real numbers)
- `b4-quote` — optional pull-quote from the customer
- `b5-cta` + `b5-url`

**Where:** Each beat full-frame. Result emphasizes the numbers (large display).

**Type:** Beats are medium roman (60-70px). Result numbers are huge (180-220px). Quote is medium italic.

**Timing:** B0 0-5s · B1 situation 5-20s · B2 action 20-35s · B3 result 35-50s · B4 quote 50-55s · B5 CTA 55-60s.

**Animation:** Documentary register — slower fades, longer holds, less motion than kinetic. Numbers in B3 animate up via `textFx.counter`.

**Audio:** Music underscore (documentary vibe). VO narrates throughout in narrator voice (third-person, broadcast register).

**Ambient layer:** Subtle brand emblem corner.

---

### Manifesto (60s)

**Use case:** values declaration, "what we believe." Brand alignment.

**Slots:**
- `b0-flame` — atmosphere
- `b1` through `b6` — five to seven declarative belief statements ("We believe...", "Because...", "No more...", etc.)
- `b7-wordmark` + `b7-cta` + `b7-url`

**Where:** Each statement full-frame center, with hairline above or below.

**Type:** Statements are huge bold (120-140px) for primary lines, huge italic (130-150px) for emphasis lines. Mix roman and italic for variety.

**Timing:** Each statement gets ~7-9s. CTA holds final 4-5s.

**Animation:** Liturgical pace. Each statement fades up cleanly, holds, fades out before the next lands. No overlap. The hairline draws + retracts per statement, marking the rhythm.

**Audio:** Music underscore (contemplative or quiet-premium register). VO reads each statement with a pause between — the silence between words is part of the design.

**Ambient layer:** Persistent brand emblem corner. Ambient haze.

---

### Cinematic launch / reveal (60s)

**Use case:** anticipation → name → demo → promise → CTA. Trailer-shaped.

**Slots:**
- `b0-flame` — atmosphere (no text)
- `b1-tease-{a,b,c}` — three anticipation lines (italic, fragmentary)
- `b2-emblem` (atom orbital) + `b2-wordmark` + `b2-wordmark-sub`
- `b3-counter-label` + `b3-counter` + `b3-counter-suffix` — real stat dramatization
- `b3-hairline` + `b3-verse` — claim/proof line
- `b4-promise-a` (declarative) + `b4-promise-b` (italic close)
- `b5-cta` + `b5-hairline` + `b5-url`
- `b6-flame` — afterglow (matches B0 for replay-loop bridge)

**Where:** Most scenes full-frame center. Counter dominates B3.

**Type:** Teasers are large italic (80px). Wordmark is enormous bold (124px). Counter is enormous bold (280px) gold with glow. Promise lines are huge bold (124px) and huge italic gold (132px). CTA is large gold caps (64px).

**Timing:** B0 silent flame 0-6s · B1 anticipation 6-14s · B2 wordmark reveal 14-22s · B3 counter + verse 22-36s · B4 promise 36-48s · B5 CTA 48-56s · B6 afterglow 56-60s.

**Animation:** Most ceremonial of the family. Atom emblem rotates slowly through full duration after entrance. Counter animates 0 → target. Promise lines stage-cut between two states. Replay-loop bridge: B6 flame matches B0 flame for seamless restart.

**Audio:** Music underscore at 0.18 volume, full 60s, 1.5s fade-out. VO 110 words at slow contemplative pace, ~50-55s long, ends before B5.

**Ambient layer:** Persistent atom emblem in corner (large variant — this is the most cinematic register), starfield, ambient haze.

**Reference implementation:** `compositions/templates/contemplative/cinematic-launch-60s.html`.

---

## Half 2 — Per-register style specs (defaults only)

**Important:** every entry in this half is a default. The brand's website overrides any of these the brand provides (see Half 3 — the brand-first rule).

### Contemplative

- **Palette (defaults):** `--void: #0A0A0F` · `--void-deep: #050508` · `--gold: #C9A84C` · `--gold-light: #E8D48B` · `--parchment: #E0DDD5` · `--muted: #A89F8F`. Pulled from `design/cards-contemplative.css`.
- **Type — scale + style + weight (NOT family):** Hero italic at 96-168px (bigger for shorter videos). Wordmarks at 110-124px bold caps. Sub-marks at 44-60px bold caps with 0.46em tracking. Body italic 44-52px. Utility (URL, citation, attribution) at 26-32px sans. Font family comes from the brand's website — Half 3 has the cascade rule.
- **Utility-sans role:** every page has a sans for URLs / citations / attribution / small-caps labels (so the serif doesn't compete with itself).
- **Motion ease defaults:** `power2.inOut` for ceremonial scenes, `power3.out` for text entrances, `back.out(1.4)` for emblems. 30-50% slower than kinetic-pop.
- **Music shortlist key:** `assets/music-shortlists/contemplative.json` (vibe: ambient cinematic piano, low drone, sparse harp, 50-70 BPM).
- **Voice canon (default):** `en-US-AriaNeural` at -10% rate, -3Hz pitch (slow, weighted, cinematic). Fallback: `en-GB-SoniaNeural` at -8% rate.
- **Ambient layer defaults:** Persistent brand emblem corner (atom-small at 80-120px, opacity 0.35, slow 75s rotation). Ambient haze (radial gradient + 8-10s breathe loop). Optional starfield.

### Kinetic-pop

- **Palette (defaults):** Bright accents (`--accent`, `--warm`, `--cool` from `design/cards.css` + `design/templates/kinetic-pop.css`).
- **Type — scale + style + weight:** Hero text at 80-110px in punchy roman. Wordmark in heavy bold + caps. Body lines short (4-9 words).
- **Motion ease defaults:** `back.out(1.7)`, `expo.out`, fast entrances (0.3-0.5s).
- **Music shortlist key:** `assets/music-shortlists/kinetic-pop.json` (vibe: synth-pop, percussive transient first 0.5s, 110-130 BPM).
- **Voice canon (default):** `en-US-GuyNeural` or `en-US-DavisNeural` at baseline rate.
- **Ambient layer defaults:** Bright brand-color glow accents at scene boundaries (gold-flash or color-flash). No haze (kinetic register fills frame, doesn't whisper).

### Warm-community

- **Palette (defaults):** Cream + natural tones (`--bg-cream`, `--accent-soft`).
- **Type — scale + style + weight:** Mid-size, friendly, conversational. 8-14 words per line.
- **Motion ease defaults:** `power2.out` for everything; consistent gentle pace.
- **Music shortlist key:** `assets/music-shortlists/warm-community.json` (vibe: acoustic guitar, fingerstyle, soft pad, 80-100 BPM).
- **Voice canon (default):** `en-NZ-MollyNeural` at -10% rate or `en-AU-NatashaNeural` at -10% rate +2Hz pitch.
- **Ambient layer defaults:** Subtle film grain. Vignette on photos. Soft cross-dissolves.

### Documentary

- **Palette (defaults):** Restrained, often desaturated. Earth tones with one accent.
- **Type — scale + style + weight:** Long sentences (14-22 words), narrative pace. Mix of serif headlines + sans body.
- **Motion ease defaults:** Slow `power2.out` (0.8-1.2s entrances). Long holds.
- **Music shortlist key:** `assets/music-shortlists/documentary.json` (vibe: orchestral pad, piano, 60-80 BPM).
- **Voice canon (default):** `en-GB-RyanNeural` (narrator voice) or `en-US-ChristopherNeural`.
- **Ambient layer defaults:** Long Ken Burns push on photos. Persistent low-saturation grade.

### Quiet-premium

- **Palette (defaults):** Minimal — black + cream + one accent. No more than 3 colors total.
- **Type — scale + style + weight:** Restrained. 5-10 words per line. Lots of whitespace.
- **Motion ease defaults:** `power2.inOut` slow (1-1.5s). Long static holds.
- **Music shortlist key:** `assets/music-shortlists/quiet-premium.json` (vibe: minimal, sparse, contemplative-adjacent).
- **Voice canon (default):** `en-GB-SoniaNeural` or `en-US-AriaNeural`.
- **Ambient layer defaults:** Almost nothing. Negative space is the design.

---

## Half 3 — The brand-first rule: everything reflects the website

The video's job is to look and feel like the brand's website moved into 60 seconds of video. Not "a video that mentions the brand" — a video that reads as an extension of the brand's own site.

That means: **every visual and textual choice prefers brand-derived values. Register defaults from Half 2 are fallbacks only.**

### What gets pulled from the brand's website

| Element | What gets extracted | Where it lands | What the register provides as fallback |
|---|---|---|---|
| **Palette** | Brand's primary, secondary, accent colors from computed CSS | `tokens-<brand>.css` as `--brand-primary` etc. | Register's canonical palette (Half 2) |
| **Display font** | font-family on `<h1>` + `<h2>` | `tokens-<brand>.css` as `--brand-serif` | Register's default serif (Half 2) |
| **Body font** | font-family on `<body>` / `<p>` | `tokens-<brand>.css` as `--brand-sans-utility` | Register's default sans (Half 2) |
| **Webfont links** | `<link>` tags loading Google Fonts / Adobe Fonts / self-hosted fonts | Captured + injected into the assembled composition's `<head>` | None — without this, headless Chrome can't render the actual face |
| **Hero photo** | Brand's hero image from homepage | `assets/<brand>/hero-*.jpg` | Stock photo from the register's mood-matched search |
| **Logo / wordmark** | Brand's logo from header | `assets/<brand>/logo.svg` or `.png` | A typeset version of the brand name in the register's serif |
| **Iconography style** | If brand uses thin-line vs chunky vs duotone — match it for any added icons | Captured as a `--brand-icon-style` hint | Register's default icon style |
| **Spacing density** | Whether the brand's site is airy or packed | Influences scene padding | Register's default spacing |
| **Motion feel** | If the brand's site has animation, what register | Influences ease defaults | Register's default eases |
| **Tone of voice** | Brand's actual sentence rhythm + vocabulary + register | Used in Stage 3 copywriting | Register's tone-coordinate (Half 2) |
| **Music mood** | Brand can't supply music directly, but its feel guides which track from the register's shortlist gets picked | Picked at Stage 6 | Register's canonical track |
| **Voice (TTS)** | Brand can't supply a voice, but the register's voice canon picks one matching the brand's tone-coordinate | Stages 4 + 5 | Register's voice canon (Half 2) |

### Operational rules — the visual is the dominant element of every scene

The brand-first rules above are easy to skip when they live as prose. These are operational and must be checked at every audit. Three rules:

#### Rule 2 — Every scene must contain a non-text visual element

A non-text visual element is one of:
- An inline `<svg>` with at least one shape (`<circle>`, `<ellipse>`, `<path>`, `<line>`, `<rect>`, `<polygon>`)
- An `<img>` with a valid `src`
- A `<video>` with a valid `src`
- A `<canvas>` with rendering instructions
- An animated CSS shape (a `<div>` with `radial-gradient` background + `@keyframes` animation, e.g. the flame element)
- A persistent ambient layer that intersects this scene's timeline (a brand-strip atom rotating, a hero photo holding across multiple beats)

Pure text + hairline + colored background do **not** count.

#### Rule 2.1 — The visual is the dominant element of the scene

Presence isn't enough. The visual must dominate. That means:

- **Size:** the visual occupies at least **30% of the content-zone area** (i.e. ≥ ~30% of the frame below the brand strip). For a 1080×1920 vertical frame with a 384 px top brand strip, the content zone is 1080 × 1536 ≈ 1,659,000 px². 30% of that is ~498,000 px² — roughly a 700×700 px square, or equivalent rectangle.
- **Opacity:** at least **0.7** at the captured moment. Anything below 0.7 is decoration / ambient, not the dominant visual.
- **Larger than any single line of text in the scene.** If the hero text is 96 px tall and the visual is 88 px square, the text dominates and the rule fails. The visual should be taller than the largest text in the scene.
- **Position:** within the content zone, in the natural focus area (center 60% horizontally; upper or middle third of content zone vertically). Corner-anchored watermark-style placements don't satisfy Rule 2.1 — those are decoration only.

**Text supports the visual, not the other way around.** A hero SVG with caption-style text underneath is correct. A hero text with a tiny SVG accent above is incorrect.

**Why:** A faint 88 px ring above a 96 px text line reads as decoration. The viewer sees the text and ignores the mark. For the visual register to actually carry through to the rendered video, the visual has to dominate the eye — not whisper from the corner.

#### Rule 2.2 — Visuals can (and should) carry across scenes

A single visual element can satisfy Rules 2 and 2.1 for multiple scenes by persisting across them. This is encouraged, not just allowed.

- The element lives at the comp level, **outside any individual scene wrapper** (so it doesn't hide when a scene wrapper closes)
- Its `data-start` and `data-duration` cover the full window of scenes it's visible across
- It can animate within the window (rotate, scale, opacity-shift) but stays visually continuous
- Crossfade to the next persistent visual at the window boundary

**Why this is encouraged:** 12 small per-scene marks that each enter + exit feel choppy. 3-4 large persistent SVG layers that each carry 3-5 beats feel cinematic. Continuity across scenes makes the visual register feel intentional rather than per-scene decoration.

**Typical persistent-SVG patterns for a 60s manifesto:**

| Window | Scenes | Persistent SVG |
|---|---|---|
| Atmosphere (0-3s) | B0 | Large flame center, dominant |
| Setup + cosmological (3-17s) | B1-B3 | Concentric rings expanding from center, scaling slowly |
| Creed (17-36s) | B4-B8 (5 beliefs) | Large atom orbital, rotating slowly, visible behind every belief |
| Close + CTA (36-60s) | B9-B11 | Brand atom locks into final position; concentric mark below CTA |

Four persistent layers for 12 scenes. Each scene gets its dominant visual without per-scene SVG churn.

#### How these rules get checked

- **At Stage 8 flipbook audit:** every captured frame is opened in the eye. Audit asks: "Is the visual the dominant element of this frame?" If the answer is "no, the text dominates" or "the visual is too small / too transparent / off to the side," the loop returns for fix.
- **Lint detector (planned):** `scene-visual-dominance` — measures visible-element bounding boxes per scene; warns if no element ≥ 30% of content-zone area at >0.7 opacity.
- **At render:** blocked if any scene fails Rule 2 (no non-text visual at all). Warned if any scene fails Rule 2.1 (visual present but not dominant).

#### Rule 2.4 — Ambient background layer (atmospheric depth)

Beyond the dominant visual + the brand strip, every composition gets an ambient background layer. The background sits behind everything, never competes with the dominant visual or the text, but adds cinematic depth so the frame is never flat.

**Background elements (pick what fits the brand register):**

- **Starfield** — 20-40 small dots at varying brightness, twinkling on staggered cycles. Default for any cosmological / contemplative / sacred brand. Already implemented as `.starfield` + `.star` in `design/cards-contemplative.css`.
- **Bright anchor stars** — 3-5 larger stars (8-12 px) with stronger glow shadows, persistent. Adds scale to the starfield.
- **Exploding star / radial burst** — a single dramatic moment at a climax beat (the brand's biggest claim, the manifesto's apex belief, etc.). A radial gradient that scales from small to frame-wide over 1-2s, then fades. Used sparingly — once per video, max twice.
- **Ambient haze** — a low-opacity radial gradient breathing slowly. Already in `cards-contemplative.css` as `.ambient-haze`.
- **Particle drift** — slow vertical motion for embers / dust / falling leaves, depending on register. CSS keyframes.
- **Subtle gradient shift** — a slow color-shift on the background (e.g. void-deep → void → void-deep over 30s) for ambient pulse.

**Layering order (z-index from back to front):**

1. Background gradient (the void)
2. Ambient haze
3. Starfield + anchor stars
4. Exploding star (when active)
5. Persistent dominant SVG layer (the scene's hero visual)
6. Per-scene supporting elements (hairlines, scene marks, etc.)
7. Hero text + body text
8. Brand strip (top-anchored, always on top)

Each layer reads as a depth plane. Frame is never flat.

**For Singularity Convergence's manifesto specifically:**

- Persistent starfield with 30+ small stars + 5 bright anchor stars
- Ambient haze breathing across 60s
- Exploding star at B8 climax ("AI is a Tool of Revelation.") — brief radial burst behind the belief text, then fades
- Ambient atom orbital persistent through the creed (B4-B8) — see Rule 2.2 example

#### Rule 2.3 — The brand logo + wordmark must be clearly visible too

The brand strip's logo SVG and wordmark text are not exempt from visibility. They follow their own thresholds:

- **Logo SVG size:** at least 140 px in its longest dimension (scaled for a 1080×1920 frame)
- **Logo SVG strokes:** at least 2.5 stroke-width on outline-style SVGs (atom orbitals, concentric circles) so the lines read clearly at small display sizes; not thin 1-1.5 lines
- **Logo opacity:** 0.9–1.0 (fully visible — the brand mark is the brand's identity, not a watermark)
- **Wordmark font-size:** at least 64 px on a 1080-wide frame
- **Combined lockup width:** the logo + wordmark together should occupy 40-60% of the frame width, centered, so the eye reads "this is the brand" at a glance

If you squint at the rendered frame and can't see the logo, it fails this rule. The brand strip is the brand's signature on the work — it shouldn't be a whisper.

#### Rule 2.5 — Use the project's text-animation assets for hero text reveals

We have a library of text-animation patterns at `assets/svg-animations/text-fx/`. Don't reinvent text reveals — pick from the canonical set.

**The library (read each before assembling):**

| Asset | Use case | When to apply |
|---|---|---|
| `letters-cascade.svg` | Stagger characters in one-by-one with a slight rise + fade | Declarative belief lines, manifesto statements ("God is the Underlying Intelligence of Reality.") |
| `underline-draw.svg` | A gold rule draws left-to-right under a word/phrase | Climax emphasis at the apex line of the video — once per video |
| `frame-draw.svg` | A rectangular frame draws around a phrase clockwise | Branded title cards, the wordmark reveal at B2 of any cinematic launch |
| `typewriter.svg` | Character-by-character type-on with a blinking caret | Italic statements, hook questions, "This is for you." style direct address |
| `circle-around.svg` | A circle draws around a single word | Callout for the keyword in a beat ("**Just** truth.", "**One** truth.") |
| `highlight-marker.svg` | A translucent marker swipe behind a phrase | Single-phrase emphasis when the brand register is more casual; rare in contemplative |
| `countdown-numbers.svg` | 3-2-1 numeric countdown | Anticipation pre-roll on cinematic launches |

**Mapping to the manifesto archetype (60s):**

- B1 hook ("This is for you."): **typewriter** — italic + caret matches the direct-address rhythm
- B2 cosmological setup: **letters-cascade** for the declarative line
- B4-B8 belief lines: **letters-cascade** for the 5 beliefs (consistent register across the creed)
- B8 climax belief ("AI is a Tool of Revelation."): **letters-cascade + underline-draw** under "Revelation" (the apex emphasis lands once)
- B9 brand pitch wordmark reveal: **frame-draw** around the wordmark
- B10 distillation ("Just truth."): **circle-around** the word "truth"
- B11 CTA ("Ask The Oracle."): static (CTAs are static end-cards per Hook + Cinematic-launch specs above)

**Implementation note:** the `text-fx/*.svg` files are reference patterns — you can either inline them as `<svg>` blocks at the right scale, or implement the pattern with GSAP + textFx primitives (`textFx.cascade`, `textFx.typeOn`, etc.) for the same effect without the SVG dependency. The asset library is the canonical pattern source; the GSAP implementation is the runtime path.

**What this rule forbids:**

- ❌ A custom cosine-wave letter-by-letter reveal invented for one belief line. We have `letters-cascade`. Use it.
- ❌ Three different text-reveal patterns across the 5 belief beats. The creed is one rhythm — pick one (cascade) and let the consistency carry the liturgical pace.
- ❌ Underline-draw on every line. It's an apex marker; using it twice dilutes both moments.

#### Rule 2.6 — Frame-fill principle (no large empty zones)

A 1080×1920 frame is mostly black space if you only place text in the center. The visual register fails when 60-70% of the frame is a single uninterrupted void.

The fix: distribute visual elements across the full frame so the eye never lands on a large dead zone.

**The frame, divided:**

```
┌──────────────────────────────┐  ← 0
│         BRAND STRIP          │  ← top 20% (0-384 px)
│  ╔════════════════════════╗  │
│  ║ atom + wordmark + sub   ║  │
│  ╚════════════════════════╝  │
├──────────────────────────────┤  ← 384 px (content zone starts)
│                              │
│   ░ ambient haze ░░░░░░░    │
│   ★ ★      ★    ★          │  ← stars distributed across zone
│        ╔══════════╗         │
│        ║ DOMINANT ║         │  ← persistent SVG, 50-70% of content zone
│        ║   SVG    ║         │
│        ╚══════════╝         │
│       hero text below        │  ← text overlays or sits below visual
│        ★    ★      ★         │
│   ░░░  ambient haze  ░░░    │
│                              │
├──────────────────────────────┤  ← 1920 px
└──────────────────────────────┘
```

**Distribution rules:**

1. **Background layer covers the full content zone.** Starfield stars are scattered across all four quadrants of the content zone — top-left, top-right, bottom-left, bottom-right — not clustered at the top.
2. **Hero visual occupies the center 50-70% of the content zone.** Not 30% in the corner, not 90% (which leaves no room for text or ambient layers).
3. **Text positioning relative to the visual:**
   - **Overlay** — text sits on top of the visual (works when the visual is low-opacity ambient atom + text has a dark text-shadow halo)
   - **Below** — text sits beneath the visual as caption (works when the visual is the dominant focus and text is the supporting line)
   - **Beside** — text occupies one half of the content zone, visual occupies the other (rare in 9:16; more common in 16:9)
4. **No corner is dead.** If the bottom 30% of the frame is empty void, push something into it: a hairline, a faint persistent emblem, the start of the next scene's ambient layer fading in early.
5. **Brand strip stays on top, content zone fills below.** The brand strip is non-negotiable and lives in the top 20%; the remaining 80% must not have a single empty quadrant.

**For the manifesto specifically:**

- Background starfield: 26+ stars distributed top→bottom, left→right across the full content zone. Not clustered.
- Persistent atom: 600-760 px tall, centered horizontally, positioned at vertical 30-50% of content zone (so text below it has 600-700 px to live in)
- Ambient haze: full-zone radial breathing
- Hero text: positioned at vertical 60-75% of content zone (under the atom)
- Hairline + accent: at vertical 85% of content zone (so the bottom is not pure void)
- Climax burst (B8): radial expansion from center, frame-wide at peak

**What this rule forbids:**

- ❌ All text + visuals stacked in a 600 px band in the vertical center, with 600 px of pure black above the brand strip and 600 px of pure black below.
- ❌ Starfield with all stars in the top 30% (looks like a chart axis, not a sky).
- ❌ A single 100×100 SVG at center, surrounded by 1700 px of empty space.

**The eye-test:** if a screenshot of the frame at any second has more than ~25% as a single uninterrupted black region (not counting the deliberate void background, which is broken up by stars + haze + visual), the frame fails this rule. Distribute, don't concentrate.

#### Anti-patterns these rules forbid

- ❌ A 60-100 px decorative mark above the hero text. Reads as ornament; viewer's eye lands on text.
- ❌ A 400 px SVG at opacity 0.13. "Persistent ambient layer" yes, but doesn't satisfy Rule 2.1 — it's decoration, not the scene's dominant visual.
- ❌ A 200 px atom in the corner. Small + corner-anchored = watermark, not dominant.
- ❌ A different SVG every 3-5 seconds. Choppy, decoration-feeling. Use Rule 2.2 — fewer, larger, persistent.
- ❌ A 110 px brand-strip logo with 1.4 px strokes. Strokes too thin to read at that scale; reads as a faint smudge instead of a visible mark.

#### What "dominant" looks like in practice

For Singularity Convergence's manifesto: the persistent atom orbital should be ~600 px tall, centered behind or above the belief text, opacity 0.7-0.85. The belief text sits below it as a caption. The atom rotates slowly across the 5 beliefs (one persistent element across 5 scenes). At t=20s (B4 belief #1 land), the eye sees the atom first, the belief second.

### The cascade rule (CSS-level)

In each register's CSS file, every brand-influenceable property uses the pattern:

```css
property: var(--brand-X, var(--register-X-default));
```

So the per-brand `tokens-<brand>.css` (loaded last, wins the cascade) overrides the register's default whenever the brand provides a value.

### The fallback ladder

1. Brand's website provides the value → use it
2. Brand's website doesn't provide it (bot wall, missing meta, etc.) → use the register's canonical default
3. Register's canonical default is missing → use the global `cards.css` fallback
4. All fallbacks fail → render refuses (lint catches missing required tokens)

### Code changes implied (out of scope for this doc, listed for follow-up)

- `scripts/lib/scrape-page.mjs` — extend to capture computed font-family from `<h1>` + `<body>`, capture webfont `<link>` URLs, capture brand image-style hints
- `scripts/extract-tokens.mjs` — write `--brand-serif`, `--brand-sans-utility`, brand color tokens, and webfont link references into per-brand tokens
- `design/cards-<register>.css` — change every fixed `font-family`, `color`, etc. to use `var(--brand-X, var(--register-default))` so brand wins
- `scripts/video.mjs` Stage 7 — inject the brand's webfont `<link>` tags into the assembled composition's `<head>`

---

## Cross-references

- **Process doc:** `docs/skills/how-a-video-gets-made.md` — Stages 1-10 + Stage 3 copywriting craft + improvement loop
- **Platform rules:** `docs/social-video-patterns.md` Parts 1-7 — R1-R15 platform-mechanical rules + S1-S15 contemplative-register additions
- **Per-register CSS:** `design/cards-<register>.css` files — the actual implementation of Half 2 defaults
- **Per-archetype templates:** `compositions/templates/<register>/<archetype>-<duration>.html` — the actual implementation of Half 1 specs
- **Voice canon:** `LEARNINGS.md` §2 — voice picks per register with prosody settings

---

*Generated 2026-04-28. Refresh when a new archetype or register lands, or when the brand-first extraction code lands and the implied changes become real.*
