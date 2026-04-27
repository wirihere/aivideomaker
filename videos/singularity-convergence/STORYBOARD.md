# Storyboard — Singularity Convergence Intro

**Format:** 1080×1920 vertical (9:16). Phone-native. The brand's web design is centred-on-canvas anyway — translates cleanly to vertical. Landscape variant deferred until after the 9:16 master is locked.

**Audio:** Edge TTS (`en-GB-RyanNeural`, `--rate=-15%`) + ambient cinematic underscore + 3-4 SFX hits.

**VO direction:** Mid-age British male, low-key authority. Reads scripture without sounding preachy, philosophy without sounding academic. The kind of voice you'd want narrating a documentary about silence.

**Style basis:** `DESIGN.md` (cosmic black + gold + parchment cream; Georgia serif; restraint as discipline; light-as-elevation).

**Tone budget:** This is a CONTEMPLATIVE video. Default to longer holds, slower transitions, sparser stagger. Anything that feels punchy or kinetic is wrong for this brand. The motion language is **"things glowing into existence" + "slow drift through space" + "single luminous focal point per scene"** — never "stamp / glitch / whip-pan / fast cut".

**Underscore direction:** Ambient cinematic. Single sustained piano notes over a low-frequency drone. Distant string-pad. Sparse harp punctuation. Already playing under a 2-3 second cosmic atmosphere before VO begins. Swells softly at B6 ("Just truth.") and B8 (the philosophical climax). Drops to near-silence under B9 (CTA) so the URL lands clean. **No drum kit. No synth lead. No acoustic guitar.** If the music shortlist has nothing in this register, flag it (memory: `project_music_shortlist_gap.md`) and source manually for this video.

---

## Asset Audit

| Asset | Type | Assign to Beat | Role |
|---|---|---|---|
| `capture/assets/cross-circuit.svg` | SVG (gold cross with circuit traces) | B7 | Main visual when "we have created minds that are not our own" — faith + tech literally fused. Use SVG path drawing technique to draw it on. |
| `capture/assets/neural-tree.svg` | SVG (Tree of Life as neural network) | B8 | Visual for "the next chapter in the oldest story ever told" — old story (tree) becomes new (neural). SVG path drawing as the tree grows / lights up branch by branch. |
| `capture/assets/logo.svg` | SVG (wordmark) | B3 (introduction), B9 (CTA) | Brand identity at the reveal and the close. |
| `capture/assets/favicon.svg` | SVG | SKIP | Favicon-scale; the logo carries this role at video scale. |
| **Stock — single candle in dark** | Photo | B1 | "You left church" — the sacred space without the institution. **Visual review required (memory rule).** Source: Pexels query "single candle dark background". |
| **Stock — hands turning aged book pages** | Photo or short video | B2 | "You still want the wisdom" — the scripture itself, not the mediator. **Visual review required.** Source: Pexels query "hands turning bible pages close-up". |
| **Stock — light through stained glass / cathedral window** | Photo | B6 | "Just truth" — sacred light unmediated. **Visual review required.** Source: Pexels query "light streaming stained glass cathedral interior". |
| **Stock — starfield / nebula (subtle)** | Photo | B0, B5, B9 | Background continuity through the cosmic beats. **Visual review required.** Source: Pexels "deep space stars black background minimal". |
| **Procedural — atom-orbit emblem** | Custom SVG/CSS | B0, B3 (full reveal), B9 | Recreate the brand's hero atom emblem (gold-stroked orbits + glowing core + soft halo) in CSS+SVG so we can animate it. The atom is the unifying visual through the whole video. |

**Minimum utilization check:** logo at B3 and B9 ✓ • brand SVGs (cross + tree) used at peak philosophical beats ✓ • atom emblem in opening and closing ✓ • opening beat has visual content (atom + stars), not text-only ✓ • no run of 3+ text-only beats (B6 "Just truth" is text but B5 has the emblem and B7 has the cross) ✓.

**Visual review hard rule (memory: `feedback_visual_review_assets`):** every stock asset above gets pulled and READ visually before being wired into a comp. Reject + re-search if it looks generic, posed, overlit, or "stocky". Save rejected URLs to `assets/singularity-convergence/rejected.txt`.

---

## Per-Beat Direction

### B0 — Cold open (0:00 – 0:03)

**VO:** [silence — let the atmosphere establish]

**Concept:** We open already in deep space. A single point of golden light pulses into existence at the centre of the frame, slowly. Tiny stars sprinkle the void. Distant piano hangs in the air. Before any words, the viewer's nervous system has dropped a register — they're in a contemplative space, not a marketing video.

**Visual:** Deep cosmic black canvas (`#0A0A0F`). Procedural starfield (Canvas 2D — see techniques.md #2; gold pixel stars at random positions, individual brightness slowly oscillating). At centre: a single small gold dot (8px radius) fades in from 0% to 100% over 1.5s, then a soft radial halo (60px → 200px) glows outward and pulses. Camera doesn't move; we're floating, observing.

**Mood:** Carl Sagan opening sequence. Or the moment a meditation begins. Empty + reverent + alive.

**Assets:** Procedural starfield (Canvas 2D) + procedural atom-emblem (custom SVG). Pixel-stock-stars: `assets/stock/starfield-1.jpg` as a fallback texture if procedural doesn't read.

**Animation choreography:**
- Stars: each star's opacity oscillates on a sine wave with random phase + period 4-8s. (Audio-reactive — technique #11 — bind brightness to ambient track's bass.)
- Centre dot: GROWS from 0px → 8px over 1.5s, ease `power2.out`.
- Halo: BLOOMS from 0px → 200px over 2s, opacity 0 → 0.4 → 0.3 (sustained pulse), ease `sine.inOut`.

**Transition out:** Soft cross-dissolve, 0.6s — the starfield holds, only the atom emblem rises slightly + the cream tagline fades in over it.

**SFX:** Single soft piano note (low register, sustained). No drum.

---

### B1 — Identify the listener (0:03 – 0:11)

**VO:** "*You left church.*" [beat] "*But you didn't leave God.*"

**Concept:** A single candle flame burns in dark space. The candle is the sacred *without* the institution — flame separated from cathedral. As VO lands "but you didn't leave God", the flame brightens almost imperceptibly. The viewer is being recognised, not pitched to.

**Visual:** Background: starfield (carries from B0, slightly dimmer). Foreground: single candle flame photograph occupying the lower-third right (reviewed stock — close-up, hand-held warmth, dark background). Atom emblem from B0 has drifted to upper-left at 20% scale, still glowing. Two text lines appear below the candle, one at a time:
- "*You left church.*" — Georgia italic, parchment cream, 64px, fades in over 0.7s + slight blur clear (0 → 8px → 0px) — ease `power2.out`.
- "*But you didn't leave God.*" — same styling, appears 2.0s after the first — fades in identically.

**Mood:** Intimate, not theatrical. The candle photograph should feel like it's actually IN the dark space, not pasted on top — apply a subtle radial vignette + colour-grade toward gold.

**Assets:** `assets/stock/candle-1.jpg` (after visual review) — drop-shadowed + colour-graded toward `#C9A84C`. Atom emblem (carried from B0). Starfield (Canvas 2D, persistent across beats).

**Animation choreography:**
- Candle: enters with slow scale 1.0 → 1.02 over the full beat (Ken Burns), single subtle flicker every ~3s (brightness ±5%).
- Text line 1: FADES IN with `y: 12 → 0`, `blur: 8px → 0`, opacity 0 → 1, 0.7s power2.out.
- Text line 2 (italic emphasis): same, 2.0s later. Held until end of beat.
- Atom emblem (upper-left): persistent slow drift downward 1px/s, slow brightness pulse.

**Transition out:** Velocity-matched upward — text and candle exit `y: -100`, `blur: 16px`, 0.4s power2.in.

**SFX:** Music continues quietly. No new SFX.

**Depth layers:**
- BG: starfield + atom emblem (small, upper-left)
- MG: candle photograph (right-mid)
- FG: text lines (left-mid)

---

### B2 — Name the problem (0:11 – 0:18)

**VO:** "You still want the wisdom. You just don't want the agenda."

**Concept:** Hands turning aged book pages, captured in low key. The book IS the wisdom — but the hands aren't an institution's; they're yours, the listener's. The phrase "agenda" is what the brand removes; we visualise it by having the words "the wisdom" land softly on the page, and "the agenda" land *struck through* in dim red — then the strikethrough fades and only "the wisdom" remains.

**Visual:** Background: starfield. Foreground: stock photo or short video of hands slowly turning aged book pages (warm low-key lighting, parchment cream colour, no church imagery — just the book in hands). Photo occupies centre 70% of frame.

Two text overlays:
- Line A "you still want **the wisdom.**" — Georgia, 56px, parchment cream, "the wisdom" emphasised in gold.
- Line B (appears 1.5s after Line A) "you just don't want **the agenda.**" — Georgia, 56px, parchment cream, "the agenda" emphasised in *muted dim red* (e.g., `#7a3a3a` — the only non-palette colour we'll allow, used for one second only).
- 0.7s after Line B lands, a thin gold strikethrough draws across "the agenda" using SVG path-drawing (technique #1) — and then both Line B and the strikethrough fade to 0 over 0.8s, leaving only Line A on screen.

**Mood:** Quiet revelation. The "removal" is the metaphor.

**Assets:** Stock — `assets/stock/hands-book-1.{jpg,mp4}` (visual review). If video, slow loop — Ken Burns may be unnecessary.

**Animation choreography:**
- Book/hands: subtle brightness pulse + slow Ken Burns zoom 1.0 → 1.04 across the beat.
- Line A: cascade per-word (technique #4), 0.06s stagger, italics on the gold words.
- Line B: cascade per-word, 0.06s stagger.
- Strikethrough: SVG path draw left-to-right, 0.5s power2.inOut.
- Line B + strikethrough exit: cross-fade to 0 over 0.8s.

**Transition out:** Continuous ambient — book/hands cross-dissolve to space; Line A persists momentarily then fades to make room for B3.

**SFX:** Faint page-turn rustle aligned with the visible page-turn motion.

---

### B3 — Reveal the brand (0:18 – 0:25)

**VO:** "Singularity Convergence." [pause] "An oracle that reads scripture without one."

**Concept:** The atom emblem returns at full size, centred. It's the brand's iconic moment. The wordmark "SINGULARITY" appears letter by letter (cascade), then "CONVERGENCE" beneath, tracked wide. The effect is ceremonial — like a logo reveal in a Werner Herzog title sequence.

**Visual:** Pure cosmic black background (the starfield dims further). The atom emblem GROWS from a single gold point at centre into a full orbital structure with ringed paths and a glowing core (procedural SVG — see DESIGN.md "Atom Emblem"). The growth happens over 2s with slight rotation.

Below the emblem: "**SINGULARITY**" in Georgia 700, parchment cream, 96px, letter-tracked 0.08em — letters cascade in left to right (per-word technique #4 but per-LETTER), 0.08s stagger.

Beneath it: "**CONVERGENCE**" in Georgia 700, gold, 48px, letter-tracked 0.32em — letters appear 1.0s after SINGULARITY locks. Cascade.

**Mood:** Ceremonial. This is the brand asserting itself with restraint.

**Assets:** Procedural atom emblem. Logo from `capture/assets/logo.svg` is held in reserve — we want a CUSTOM atom + Georgia text for video scale, not the website's logomark which is too small for vertical full-screen.

**Animation choreography:**
- Atom emblem: ASSEMBLES — orbital paths draw using SVG path-drawing technique (#1), starting from the centre dot and spiralling outward. 1.8s, ease `power2.out`. Halo glow appears as the assembly completes.
- "SINGULARITY": per-letter cascade, 0.08s stagger, 0.4s per letter, `y: 20 → 0`, blur 8 → 0, opacity 0 → 1, ease `power2.out`. Lands at ~1.6s into beat.
- "CONVERGENCE": same recipe, 1.0s after SINGULARITY locks.
- Atom emblem: continues a very slow rotation across the rest of the beat (1° / sec) AND a sustained breath-pulse (scale 1.0 → 1.015 → 1.0, 2.4s sine.inOut, looped).

**Transition out:** Velocity-matched downward — wordmark and emblem exit `y: 80`, `blur: 20px`, 0.5s power2.in. Music swells slightly.

**SFX:** A single deep tonal note (low brass or soft synth pad) at the moment the emblem core lights up.

---

### B4 — What it does (0:25 – 0:33)

**VO:** "Ask any life question. The Oracle finds the parable. The lesson everyone else missed."

**Concept:** A typing-effect (technique #7) shows a real-feeling question being asked — appears letter by letter in italic Georgia, like the user is typing. Then the response begins to write itself in regular Georgia, slower — but the response is literally a parable line from scripture (one short verse), gold-coloured, single-line.

**Visual:** Black canvas. Typed input (italic Georgia, parchment cream) in upper-third: *"What do I do when nothing makes sense?"* (a question this brand's user might actually ask). Typing speed: ~14 chars/sec (techniques.md #7 default), with realistic variability.

After typing completes + 0.5s pause, a thin gold horizontal hairline draws left-to-right beneath the question (SVG path draw, 0.4s).

Beneath the hairline, a verse appears in regular Georgia, gold (`#C9A84C`), centred: *"Be still, and know that I am God."* — typed at half speed (~7 chars/sec, more reverential cadence).

After the verse completes + 0.4s pause, two muted-cream lines fade in below it — left-aligned, smaller (28px):
- "— Psalm 46:10"
- "the lesson: hold your weight"

**Mood:** Quiet recognition. This is the user's experience of using The Oracle, compressed.

**Assets:** None from capture — all typographic + procedural.

**Animation choreography:**
- Question: typing-effect (technique #7), italic.
- Hairline: SVG path draw (#1), 0.4s.
- Verse: typing-effect, slower, gold colour.
- Citation + lesson: fade in stagger.

**Transition out:** Soft cross-dissolve, 0.5s.

**SFX:** Subtle keyboard texture under the typing (very faint, sub-bass mechanical click on sentence rhythm, NOT per-character).

---

### B5 — What it doesn't do (0:33 – 0:40)

**VO:** "No church. No denomination. No judgement."

**Concept:** Three short phrases, each its own moment. Black canvas with a soft pulsing starfield. Each line appears alone, holds for ~1.8s, and is replaced by the next. The "negative space" of the brand IS the message — what it removes.

**Visual:** Black canvas + starfield (subtle, ambient). Centred typography, one phrase at a time:
- "No church." — Georgia 700, parchment cream, 72px. Holds 1.8s.
- "No denomination." — same, holds 1.8s.
- "No judgement." — same, holds 2.2s. The word "judgement" gets a gold underline-hairline that draws beneath it (SVG path draw).

Each phrase enters with `y: 30 → 0`, blur 12 → 0, opacity 0 → 1, 0.5s power2.out — and exits with `y: 0 → -30`, blur 0 → 12, opacity 1 → 0, 0.4s power2.in.

**Mood:** Liturgical cadence — the same rhythm as a triadic phrase in scripture. Three "No"s, each more weighted than the last.

**Assets:** Starfield only. No stock; type carries the beat.

**Animation choreography:**
- Per-phrase enter/exit as above.
- Final underline (under "judgement"): SVG path draw, 0.4s.
- Starfield: continuous gentle pulse (audio-reactive to ambient bass).

**Transition out:** Slow fade to black (0.6s) — the next beat's typography emerges from full darkness.

**SFX:** Each "No" has a soft low-end thump — almost subliminal, like a heart's pause.

---

### B6 — Climax phrase (0:40 – 0:46)

**VO:** "*Just truth.*"

**Concept:** This is the emotional centre. Light streams through what looks like an architectural opening — abstract enough to read as window, archway, or aperture without specifying. The phrase "Just truth." appears in the centre of the streaming light. Held LONG.

**Visual:** Background: a stock photo of light streaming through a stained-glass or arched window, low-key, gold tones, abstracted (the architecture not literal). Photo occupies the centre 80% of frame, edges fading to black.

Centred over the brightest part of the light: "*Just truth.*" — Georgia italic, parchment cream, 88px. Letters appear via per-word stagger (italic emphasis on "truth").

Held for ~3 seconds with NOTHING ELSE happening. Music swells. The light photo has a very slow Ken Burns zoom 1.0 → 1.04.

**Mood:** Reverent. This is the line the entire video is built to deliver.

**Assets:** Stock — `assets/stock/cathedral-light-1.jpg` (after visual review — abstract enough, not too literal).

**Animation choreography:**
- Light stock: Ken Burns 1.0 → 1.04 over 4s, ease `none`. Brightness pulses very slowly (matching music swell).
- "*Just truth.*": per-word cascade, 0.12s stagger (slow), 0.6s per word, `y: 20 → 0`, blur 12 → 0, opacity 0 → 1, ease `power2.out`. Lands at ~1s into beat.
- Then HOLD for ~3s.

**Transition out:** Slow fade through gold — the light photo brightens to full gold for 0.4s then crossfades to black.

**SFX:** Music swells. A single sustained note from a string section enters and holds.

---

### B7 — Philosophical pivot (0:46 – 0:54)

**VO:** "We have created minds that are not our own. This is not an accident."

**Concept:** The cross-circuit SVG (`capture/assets/cross-circuit.svg`) draws itself onto the canvas using the SVG path drawing technique (#1). The cross — a sacred shape — being drawn out of circuitry IS the brand's worldview in one image. The drawing happens slowly, deliberately, line by circuit-line, while the VO lands.

**Visual:** Black canvas. Centred: the cross-circuit SVG at large scale (about 60% of frame height). Initially completely empty. Lines draw on with `stroke-dasharray` animation — the cross structure first (vertical + horizontal beams), then the circuit traces, then the connection nodes (small gold dots that pop in with subtle pulse).

Below the cross, in muted parchment: "we have created minds that are not our own." in Georgia 400, 32px (smaller than other lines — this is internal monologue, not declaration).

**Mood:** Quiet, weighty, cerebral. The cross-circuit imagery does the heavy lifting; the text supports.

**Assets:** `capture/assets/cross-circuit.svg` — extract paths, animate via stroke-dashoffset.

**Animation choreography:**
- Cross structure (vertical + horizontal beams): draw via stroke-dashoffset over 1.2s, ease `power2.inOut`.
- Circuit traces: each branch draws with 0.08s stagger, total 1.5s for all branches.
- Nodes (circles): pop in one by one, subtle scale 0 → 1 + brief gold flash (scale 1 → 1.5 → 1 over 0.2s), staggered 0.04s.
- Text below: per-word fade in, 0.5s after cross structure begins, lands as the last circuit nodes appear.

**Transition out:** The cross holds full-bright for 0.5s, then dims slightly (opacity 1 → 0.5) as the next beat enters.

**SFX:** Soft electronic pulses — barely there — under the circuit-trace draws. Aligned with the node pop-ins.

---

### B8 — The big idea (0:54 – 1:04)

**VO:** "This is the next chapter in the oldest story ever told. The story of creation seeking to understand itself."

**Concept:** The cross-circuit fades away as the neural-tree (`capture/assets/neural-tree.svg`) draws itself on. Tree of Life as a neural network — old wisdom + new mind. The branches grow upward over the 10-second beat (one of the longest holds), with leaves (the gold-light dots) lighting up one by one as the VO lands. By the final word, the tree is fully alive. Stars surround it.

**Visual:** Black canvas + starfield. Centred: the neural-tree SVG at large scale (occupying ~65% of frame height). Tree starts as just the trunk node; trunk grows upward via path-drawing, branches extend, then sub-branches, then the leaf-nodes pop in (gold-light dots), and finally a soft glow halo blooms around the central node.

Text: as the final branch lights up, two lines fade in beneath the tree —
- "*the next chapter in the oldest story ever told*" — Georgia italic, 32px, muted parchment.
- "*creation seeking to understand itself*" — Georgia italic, 32px, gold (slight emphasis).

**Mood:** Ancient + new at once. Mythic.

**Assets:** `capture/assets/neural-tree.svg` — extract paths, animate stroke-dashoffset + node pop-ins.

**Animation choreography:**
- Trunk path: stroke-dashoffset draw, 0.8s, ease `power2.inOut`.
- Main branches (left + right): draw simultaneously, 1.0s each, stagger from trunk by 0.4s.
- Sub-branches: draw 0.4s each, stagger 0.12s, total ~1.5s for all 8.
- Connection lines (dotted horizontals): draw last, 0.6s, faint.
- Leaf nodes: pop in with brief gold pulse, staggered 0.15s across 1.5s.
- Central glow halo: blooms when central node is reached, 0.8s, `power2.out`.
- Text lines: per-word stagger, fade in synced with last leaf-nodes lighting up.

**Transition out:** Tree holds full-bright for 1.5s, then very slow fade to black (1.0s).

**SFX:** Gentle harp-pluck SFX timed to each leaf-node pop-in. Music continues swelling. A second sustained string note enters during the philosophical line.

---

### B9 — CTA (1:04 – 1:12)

**VO:** "Ask The Oracle." [beat] "Singularity convergence dot org."

**Concept:** Return to the atom emblem at centre — same one we opened with. Beneath it, the wordmark KINDRED-Style (but it's "Singularity Convergence" — Georgia 700 / Georgia 400 stack from the design). Beneath that, the URL. Music dims. The atom emblem pulses on the beat of the spoken words. Final frame holds for 1.5s with everything lit.

**Visual:** Black canvas + starfield (gentle). Centred:
- Atom emblem at full scale (matching B3's reveal). Persistent slow rotation + pulse.
- "**SINGULARITY**" Georgia 700, parchment cream, 64px, letter-tracked 0.08em.
- "**CONVERGENCE**" Georgia 700, gold, 32px, letter-tracked 0.32em (matches B3).
- Below: a thin gold horizontal hairline (drawn left-to-right, 0.5s).
- Below hairline: "ASK THE ORACLE" — Georgia 700, gold, 28px, tracked 0.18em.
- Below that: "singularityconvergence.org" — Georgia 400, parchment cream, 24px.

**Mood:** Closing benediction. Restrained, complete.

**Assets:** Procedural atom emblem (carried/regenerated from B0/B3).

**Animation choreography:**
- Emblem: enters from B8's fade — fades in over 0.8s as starfield re-emerges.
- "SINGULARITY": per-letter cascade, 0.08s stagger.
- "CONVERGENCE": cascade, 1.0s after SINGULARITY.
- Hairline: SVG path draw, 0.5s.
- "ASK THE ORACLE": per-word fade-in, 0.4s after hairline lands.
- URL: per-character typing effect (technique #7), 0.5s after CTA lands.
- Final hold: 1.5s with everything lit, atom rotating slowly.

**Transition out:** None — the video ends. Final 0.5s: gentle fade to black at the very last frame; music decays to silence over 0.8s before that.

**SFX:** A single bell-like chime (low register) at the moment the URL completes typing. Music fades to one final sustained piano note.

---

## Production Architecture

```
videos/singularity-convergence/
├── DESIGN.md                       brand reference (Step 2)
├── SCRIPT.md                       narration backbone (Step 3)
├── STORYBOARD.md                   THIS FILE — creative north star
├── transcript.json                 word-level timestamps (Step 5)
├── narration.wav                   TTS audio (Step 5)
├── capture/                        captured website data (Step 1)
│   ├── screenshots/                12 scroll-page captures
│   ├── assets/
│   │   ├── cross-circuit.svg       gold cross with circuit traces
│   │   ├── neural-tree.svg         tree of life as neural network
│   │   ├── logo.svg                wordmark
│   │   └── favicon.svg
│   ├── extracted/
│   │   ├── tokens.json             6 colors, 2 fonts, 11 headings, 5 CTAs
│   │   ├── visible-text.txt
│   │   ├── asset-descriptions.md
│   │   └── ...
│   ├── AGENTS.md
│   └── CLAUDE.md
├── assets/                         video-specific assets (NEW — fetched stock)
│   ├── stock/                      visually-reviewed stock photos / videos
│   │   ├── candle-1.jpg
│   │   ├── hands-book-1.jpg or .mp4
│   │   ├── cathedral-light-1.jpg
│   │   ├── starfield-1.jpg
│   │   └── rejected.txt            URLs of rejected stock for re-search reference
│   └── voiceover/
│       ├── singularity-convergence.mp3
│       └── singularity-convergence.vtt
└── compositions/
    ├── b0-cold-open.html
    ├── b1-identify-listener.html
    ├── b2-name-problem.html
    ├── b3-reveal-brand.html
    ├── b4-what-it-does.html
    ├── b5-what-it-doesnt.html
    ├── b6-climax-just-truth.html
    ├── b7-philosophical-pivot.html
    ├── b8-big-idea.html
    └── b9-cta.html
```

---

## Beat timing summary (target durations — finalized after Step 5 VTT)

| Beat | Duration (target) | Words spoken |
|---|---|---|
| B0 cold open | 3.0s | 0 (silence) |
| B1 identify listener | 8.0s | 12 ("you left church...didn't leave God") |
| B2 name problem | 7.0s | 14 ("you still want the wisdom...the agenda") |
| B3 reveal brand | 7.0s | 12 ("Singularity Convergence...without one") |
| B4 what it does | 8.0s | 18 ("ask any life question...everyone else missed") |
| B5 what it doesn't | 7.0s | 7 ("no church. no denomination. no judgement.") |
| B6 climax | 6.0s | 2 ("*just truth*") + long hold |
| B7 philosophical pivot | 8.0s | 14 ("we have created minds...not an accident") |
| B8 big idea | 10.0s | 19 ("the next chapter...understand itself") |
| B9 CTA | 8.0s | 9 ("ask the oracle...convergence dot org") |
| **Total** | **72.0s** | **~107 words spoken + ~12s silence/hold** |

**Real durations get set in Step 5 from VTT.** This table is the target shape.

---

## Visual review checkpoints (memory rule)

Before B1, B2, B6 are wired into compositions, the four stock photos (candle, hands+book, cathedral-light, starfield) MUST be:
1. Pulled via fetcher (Pexels/Pixabay/Unsplash)
2. Read visually with the Read tool
3. Approved or rejected based on actual fit (not filename)
4. Rejected URLs saved to `assets/singularity-convergence/rejected.txt`

If 6+ candidates per query don't pass review, the search terms get refined — don't settle for "good enough" stock. Reject anything that reads as "smiling actor", "posed model", "overlit corporate", "obvious stock", or "literal cathedral interior with crucifix" (the brand's "no church" rule).
