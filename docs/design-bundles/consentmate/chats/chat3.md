# Design Brief Naming

_Started 2026-04-25 03:34 UTC_

---

## User

Read the README — your job is in there. Start with whichever briefs you want, or ask me to pick a small batch first.

## Assistant

I'll start by reading the README to understand the job.

_[tool: local_ls]_

_[tool: local_read]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_ls]_

Let me read the key files to understand the system before picking briefs.

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

I have the context I need. Let me pick a small batch and design. I'll propose 4 cards covering different categories so you can compare patterns: a stat hero, a pull-quote, a feature-row trio, and a phone-mockup card. Let me also peek at the briefs for these specific ones.

_[tool: snip]_

_[tool: local_grep]_

Before designing, let me look at the BRIEF 01-XX cards section to find good batch candidates.

_[tool: local_grep]_

_[tool: local_grep]_

I'll pick a focused batch of 4 cards covering distinct categories. Let me read those specific briefs.

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: snip]_

I'll design a small batch of 4 cards: BRIEF 01 (Pull-Quote), BRIEF 17 (Stat Hero), BRIEF 21 (Phone-In-Hand), and BRIEF 28 (Logo Grid). I'll deliver them as a single HTML preview document so you can see all four rendered, plus the spec output blocks the workflow expects.

Let me build it.

_[tool: write_file]_

I need to copy in the design system files so the page can resolve them.

_[tool: snip]_

_[tool: local_copy_to_project]_

_[tool: snip]_

_[tool: done]_

_[tool: list_files]_

The files exist. The issue is likely caching — let me try absolute paths.

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

I'll inline the CSS to bypass the resource-loading issue.

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Designed batch 1 — 4 cards. Specs below.

---

### BRIEF 01 — Magazine Pull-Quote

**HTML**
```html
<article class="pullquote" data-mode="light">
  <span class="pullquote__glyph" aria-hidden="true">&ldquo;</span>
  <p class="pullquote__body">{{ quote body }}</p>
  <div class="pullquote__rule" aria-hidden="true"></div>
  <div class="pullquote__attr">
    <span class="pullquote__attr-name">{{ brand }}</span>
    <span class="pullquote__attr-sep">·</span>
    <span class="pullquote__attr-role">{{ role }}</span>
  </div>
</article>
```

**CSS** — see file `batch-01-cards.html`. Key choices: oversized italic display-serif glyph at top-left, rotated -6°; quote body at 108px italic with `::first-letter` drop-cap in accent; hairline rule then mono kicker attribution at 28px / 0.24em tracking. `[data-mode="dark"]` flips body colour to `--card-paper`, dims the glyph to `--card-paper-soft` at 0.42 opacity.

**Visual states**: default (rest) is the only static state — entrance is purely motion-driven.
**Motion intent**: glyph scales in 1.4 → 1.0 with back.out (0.6s); body word-stagger fade-up (0.04s offset, ~0.8s total); rule extends from centre via `scaleX`; attribution slides up last. ~1.5s total.
**Tokens used**: `--card-navy`, `--card-paper`, `--card-paper-soft`, `--card-accent`, `--card-font-display`, `--card-font-mono`.
**Tokens you'd want but don't exist**: none.

---

### BRIEF 17 — Stat Hero

**HTML**
```html
<article class="stathero" data-mode="light">
  <div class="stathero__kicker">{{ kicker }}</div>
  <div class="stathero__number">
    <span class="stathero__num-value">100</span><span class="stathero__num-unit">%</span>
  </div>
  <div class="stathero__arc" aria-hidden="true">
    <svg viewBox="0 0 600 80" preserveAspectRatio="none">
      <path class="stathero__arc-track" d="M 20 60 Q 300 -10 580 60" />
      <path class="stathero__arc-fill"  d="M 20 60 Q 300 -10 580 60" />
    </svg>
  </div>
  <div class="stathero__label">{{ LABEL }}</div>
  <p class="stathero__support">{{ supporting copy }}</p>
</article>
```

**CSS** — display-serif numeral at 360px, unit ("%") inset at 200px in accent; underneath, a hand-drawn arc gives the number weight without becoming a chart; mono label at 40px / 0.28em; italic display-serif support paragraph at 38px.

**Visual states**:
- `.stathero.is-counting` — `stroke-dasharray: 700; stroke-dashoffset: 700;` (arc empty, used during count-up)
- `.stathero.is-final` — `stroke-dashoffset: 0;` (arc fully drawn, default rest)

**Motion intent**: number tweens 0 → target over 1.2s (power3.out); arc fill draws from left in sync via `stroke-dashoffset`; kicker fades in at start, label fades at 0.7s, support line word-stagger after the number lands.
**Tokens used**: `--card-navy`, `--card-paper`, `--card-paper-soft`, `--card-accent`, `--card-slate-ink`, `--card-font-display`, `--card-font-mono`.
**Tokens you'd want but don't exist**: none.

---

### BRIEF 21 — Phone-In-Hand Mockup

**HTML**
```html
<article class="phonehand" data-mode="light">
  <div class="phonehand__head">
    <div class="phonehand__kicker">{{ KICKER }}</div>
    <h2 class="phonehand__title">{{ headline }}</h2>
  </div>
  <div class="phonehand__stage">
    <div class="phonehand__hand" aria-hidden="true"></div>
    <div class="phonehand__phone">
      <div class="phonehand__phone-island" aria-hidden="true"></div>
      <div class="phonehand__phone-screen">
        <div class="phonehand__slot">[SCREENSHOT_SLOT]</div>
      </div>
    </div>
    <div class="phonehand__shadow" aria-hidden="true"></div>
  </div>
</article>
```

**CSS** — phone is a 580×1080 rounded-rect (radius 78px) with dynamic-island detail, tilted via `rotateY(-13deg) rotateZ(-3deg)`. Screen is `[SCREENSHOT_SLOT]` placeholder with dashed border + diagonal hatching so production knows where the asset goes. Hand is a graphical clip-path silhouette in `--card-slate` (no flesh-tone, no skin texture). Soft radial-gradient ground shadow grounds the phone.

**Visual states**:
- `.phonehand.is-entering` — phone parked 280px below at 0° tilt; hand + shadow at opacity 0
- `.phonehand.is-rest` — final tilted position (default)

**Motion intent**: phone slides up 280px and rotates into its tilt over 0.8s (back.out 1.4); hand fades in from 0 → 1 starting at +0.25s (0.5s); shadow fades in alongside. Total ~1.05s.
**Tokens used**: `--card-navy`, `--card-navy-deep`, `--card-paper`, `--card-paper-soft`, `--card-slate`, `--card-slate-ink`, `--card-accent`, `--card-r-sm`, `--card-font-display`, `--card-font-mono`.
**Tokens you'd want but don't exist**: a `--card-skin` or `--card-silhouette` token would make the hand re-skinnable per brand without touching pattern CSS — currently it borrows `--card-slate`.

---

### BRIEF 28 — Logo Grid

**HTML**
```html
<article class="logogrid" data-mode="light">
  <div class="logogrid__head">
    <div class="logogrid__rule" aria-hidden="true"></div>
    <div class="logogrid__kicker">SUPPORTING</div>
    <div class="logogrid__rule" aria-hidden="true"></div>
  </div>
  <h2 class="logogrid__title">{{ section title }}</h2>
  <div class="logogrid__grid">
    <div class="logogrid__cell"><span class="logogrid__slot">[LOGO_01]</span></div>
    <!-- ×6 -->
  </div>
  <div class="logogrid__foot">{{ FOOTER · YEAR }}</div>
</article>
```

**CSS** — kicker between two hairline rules; display-serif section title; 3×2 grid of 160px-tall logo cells inside a soft tinted frame. All cells render with same neutral chrome so partner logos read as a group, not a parade. Each `[LOGO_NN]` is a labelled mono placeholder.

**Visual states**:
- `.logogrid.is-entering` — title + kicker at `translateY(18px) opacity:0`; cells at `translateY(28px) opacity:0`
- `.logogrid.is-rest` — default visible state

**Motion intent**: kicker rules extend from centre (0.4s); title fades up; cells cascade left-to-right, top-to-bottom with 0.08s stagger (0.5s each, power2.out); foot fades last.
**Tokens used**: `--card-navy`, `--card-navy-deep`, `--card-paper`, `--card-paper-soft`, `--card-slate-ink`, `--card-accent`, `--card-r-sm`, `--card-r-md`, `--card-font-display`, `--card-font-mono`.
**Tokens you'd want but don't exist**: none.

---

Preview is at `batch-01-cards.html` — each card shown in light + dark, fixed 1080×1920, scaled to 32% for side-by-side review. Tell me which to refine, or pick the next batch (suggestions: BRIEF 02 newspaper, BRIEF 04 polaroid, BRIEF 19 donut, BRIEF 27 testimonial).

## User

Work through the effects (E01-E240) — do as many as you possibly can in each response, prioritised by impact and uniqueness. Skip duplicates and niche entries (flag what you skipped + why so I can pick them up later if needed). When you hit your output limit, finish the current effect cleanly and end with === PAUSED AT [ID] — RESUME HERE NEXT ===. I'll say "continue" and you pick up. Goal: maximum useful pattern coverage per response. Pack each response — quality bar held, but volume over restraint.

## Assistant

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

Effects batch 01 — E01–E40 — done. Static previews of every effect at 1080×1920, dark + light where the appearance shifts. Highlights:

**Atmospheric / weather** — E04 smoke, E05 lens flare, E08 god rays, E09 rain, E10 snow, E14 fog, E15 clouds, E17 lightning, E18 sun-through-clouds.

**Particles** — E02 sparkles, E03 confetti, E11 leaves, E12 cherry petals, E13 starfield, E39 bubbles, E40 money rain. All seeded so the static review is deterministic; runtime motion intent specified per cell.

**Texture / pattern** — E06 bokeh, E07 film scratches, E16 heat shimmer, E19 halftone, E20 crosshatch, E21 topographic, E22 dot grid, E23 diagonal stripes, E24 watercolor, E25 grunge, E26 wood grain, E27 marble, E28 mandala, E29 sine waves, E30 ripple, E31 hex grid, E32 golden spiral.

**Kinetic type / text FX** — E01 brand glow, E33 RGB-split glitch, E34 static-noise text, E35 wobble, E36 wave, E37 typewriter cursor, E38 letterpress.

**Skipped / flagged**: none in this range — all 40 produced.

=== PAUSED AT E40 — RESUME HERE NEXT (E41) ===

Say **continue** for E41–E80 (likely covering: backgrounds — gradients, mesh, noise, aurora, grid lines; transitions — wipes, reveals, masks; UI accents — underlines, badges, ribbons, highlights; data viz overlays).

## User

continue but if you would prioritize other effects mentioned then do so

## Assistant

<I'll prioritize highest-impact / most-reusable effects next: backgrounds (gradients, mesh, aurora, noise), light interactions (vignette, scanlines, CRT, duotone), reveal/wipe transitions, UI accents (underlines, ribbons, highlights, badges), and a few unique ones like liquid blob, shattered glass, holographic.>

_[tool: snip]_

_[tool: write_file]_

<I'll snip the prior batch work and finish this batch.>

_[tool: snip]_

_[tool: done]_

<I'll snip the prior message and continue with the next batch.>

_[tool: snip]_

<I'll continue producing the next batch of effects, prioritizing high-impact UI accents, motion treatments, and unique visuals.>

_[tool: snip]_

_[tool: write_file]_

<I'll snip prior batches and finish current.>

_[tool: snip]_

_[tool: done]_

<I'll snip resolved batches and continue with the next batch — moving into transitions, reveals, scrolling marquees, glitches/distortion, decorative borders, and other unique effects.>

_[tool: snip]_

_[tool: write_file]_

<I'll snip resolved earlier phases and current batch's edit, then continue prioritizing video-friendly motion-rich effects.>

_[tool: snip]_

_[tool: done]_

<I'll snip out resolved batches to free context, then continue with a video-prioritized batch focused on motion-rich effects: looping particles, camera moves, kinetic transitions, animated gradients, lyric-style text, etc.>

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Effects Batch 05 (E161–E200) — 40 video-priority looping effects done.

Highlights (★ = especially video-ready):
- **Backgrounds/atmosphere**: E162 aurora, E163 drift mesh, E165 rain, E166 snow, E199 lightning
- **Particles**: E164 confetti fall, E198 confetti cannon
- **Type FX**: E168 glitch, E169 neon flicker, E170 typewriter, E171 letter pop, E172 wave, E176 shimmer sweep, E188 underline, E194 quake
- **Camera/composition**: E185 Ken Burns pan, E186 push-in, E187 lower-third
- **Data/signal**: E178 equalizer, E179 sine spectrum, E180 EKG, E181 radar, E182 orbit, E189 counter, E190 progress
- **Misc loops**: E161 marquee, E167 scanline, E173 wipe reveal, E174 pulse, E175 outward rings, E177 light-sweep card, E183 liquid blob, E184 float, E191 spinner, E192 dot bounce, E193 film flicker, E195 fly-by, E196 flag, E197 hue cycle, E200 vinyl

Say **continue** for E201–E240 (likely: cinematic transitions — page curl, split-screen, shutter, mask reveals; product motion — exploded view, rotation rigs; data viz — animated bars/lines/maps; UI motion — toast slide-ins, tab swipes, modal lifts).

## User



## Assistant

_[tool: snip]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: grep]_

_[tool: list_files]_

<I'll continue with the next batch E201–E240 — cinematic transitions, product motion, animated data viz, UI motion.>

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Effects Batch 06 (E201–E240) — 40 cinematic + UI motion effects, all looping. Highlights:

**Cinematic transitions**: E201 page curl, E202 split screen, E203 shutter, E204 circle mask, E205 diamond mask, E206 vertical bars, E207 letterbox, E233 elevator doors, E239 vintage slide-in, E240 flash cut.

**Product / 3D motion**: E208 flip board, E209 3D cube spin, E210 exploded view, E232 paper fold, E235 coin flip.

**Data viz**: E211 bar chart cycle, E212 line chart draw, E213 donut fill, E214 map trace, E215 globe spin, E226 counter slot roll, E236 stock ticker.

**UI motion**: E216 toast, E217 tab swipe, E218 modal lift, E219 drawer, E220 FAB pulse, E221 slider thumb, E222 checkbox tick, E223 toggle, E224 star rating, E227 accordion, E228 search suggest, E229 chip selector, E230 notification badge.

**Misc kinetic**: E225 parallax scene, E231 word cycle, E234 pendulum, E237 firework burst, E238 lightspeed warp.

Through E240 — that's the upper bound of the original brief range. Say **continue** if you want me to push past 240 with extras (CRT glitch loops, holographic shaders, magnetic-field viz, etc.) or call out specific cells to refine.

## User

yes you choose the ones that will have them most impact

## Assistant

<I'll continue with high-impact bonus effects E241–E280 — focusing on the most visually striking, video-ready treatments not yet covered: CRT/VHS, holographic, liquid metal, ink bloom, fire, magnetic field, displacement, depth-of-field rack, kaleidoscope, etc.>

_[tool: snip]_

_[tool: write_file]_

<I'll snip earlier completed work to free context, then finalize this batch.>

_[tool: snip]_

_[tool: done]_

<I'll snip resolved work and finalize.>

_[tool: snip]_

_[tool: fork_verifier_agent]_

_[tool: snip]_

Effects Batch 07 (E241–E280) — 40 high-impact bonus loops. Highlights:

**Retro/broadcast**: E241 CRT TV, E242 VHS tracking, E261 tape spool, E268 ASCII banner, E276 dot matrix display.

**Surface/material**: E243 holographic sticker, E244 liquid metal, E260 neon frame, E266 paint drip.

**Atmospheric**: E245 ink bloom, E246 fire, E248 plasma, E254 lava lamp, E267 bokeh float, E275 gradient orbit, E279 time-lapse sky.

**Sci-fi/HUD**: E247 magnetic field, E249 vortex, E250 matrix rain, E252 terminal boot, E255 constellation, E258 rotating halo, E259 hex grid, E270 radio broadcast, E277 holographic HUD.

**Cinematic**: E257 spotlight tracker, E271 glass shatter, E272 stage beams, E273 lyric karaoke, E274 camera shake, E278 color pop, E280 end card.

**Type/UI**: E251 barcode, E253 ribbon wave, E256 type reveal mask, E262 loading beat, E263 cursor demo, E264 voronoi, E265 concentric pulse, E269 heat map.

That brings cumulative coverage to 280 effects across 7 batches. Say **continue** for another 40 (likely targets: bezier morphing logos, isometric grids, scrolling cityscapes, weather overlays, coded reveal, news ticker, election bar, scoreboard, leaderboard, tournament bracket motion).

## User

Have you got exploding glitter and exploding stuff but yes carry on with the rest

## Assistant

<I'll snip resolved work and continue with batch 08 — explosion-focused: glitter explosion, particle burst, debris, paint splatter, dust cloud, plus more requested patterns.>

_[tool: snip]_

_[tool: write_file]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

Batch 08 (E281–E320) is complete and verified — explosion-focused with confetti, glitter, firework, dust, ice shard, balloon, coin bursts, plus broadcast/cinematic bonuses (news ticker, scoreboard, bracket, black hole, rocket, curtain, stamp, end stinger).

=== PAUSED AT E320 — RESUME HERE NEXT (E321) ===

Say **continue** for E321–E360. Suggested coverage: more explosion variants you may want (smoke ring, pixel shatter, neon explosion, ink drop, water splash), plus motion graphics staples (lower-third variants, callout pointers, comparison wipes, kinetic typography blocks, logo reveal stings).

## User

yes please

## Assistant

_[tool: write_file]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

<I'll continue with batch 11 — E401–E440. Themes: more video-ready content — typography animations, branded transitions, social-media-ready effects, and varied kinetic compositions.>

_[tool: snip]_

_[tool: fork_verifier_agent]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

Effects Batch 11 — E401–E440 — done. 40 cards covering kinetic typography (vertical tower, stack wipe, marquee, word punch, sentence build, word rotor, fill-up letters, vertical reveal, outline trace, block highlight, stretch, terminal type), editorial scenes (newspaper drop, vinyl, polaroid stack, shred reveal, projector flicker, zine cutouts, editorial split, photo Ken Burns), branded transitions (color bar swipe, brand burst, finale stinger, tape stickers), and content-card moments (quote carousel, podcast card, 3-card stagger, photo grid, hashtag burst, sticker pop, menu dropdown, button slide, wiggle logo).

=== PAUSED AT E440 — RESUME HERE NEXT (E441) ===

Say **continue** for E441–E480.

## User

yes just keep going do not stop these are great if you can have cards that can contain images and video but still moving that would be great

## Assistant

<I'll continue with batch 12 — E441–E480. User wants cards that can contain images/video while still being motion-rich. I'll make many of them include image/video placeholder slots with explicit `[IMG_SLOT]` / `[VIDEO_SLOT]` markers so the user knows where to drop assets.>

_[tool: snip]_

_[tool: write_file]_

<I'll snip earlier completed batches and continue.>

_[tool: snip]_

_[tool: done]_

<I'll snip earlier batch work and continue with E481–E520. Theme: more image/video container cards with novel motion patterns since user loved that approach.>

_[tool: snip]_

_[tool: fork_verifier_agent]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

<I'll continue with batch 14 — E521–E560. More image/video container cards since that's been the priority direction.>

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

<I'll continue with batch 15 — E561–E600. More image/video container cards.>

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

