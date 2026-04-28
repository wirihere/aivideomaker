# STORYBOARD.md — Resurgence Indigo Sport · 30s vertical

Per-beat creative direction. Built against `docs/social-video-patterns.md` (15 platform rules + 7 community-app patterns) and the brand cheat-sheet in `DESIGN.md`.

Format: 1080×1920 (9:16). Render-time constraint: no rider/action B-roll — product photo + grunge-shield logo + typography + CSS-built badges only.

---

## Template decision

**Build a new template** rather than adapting `community-app-tour-30s` (locked v1).

Why not adapt:
- community-app-tour palette is cream/honey + warm-community vibe. Resurgence is industrial/biker. Wrong base.
- community-app-tour uses a phone-mockup hero. Resurgence's hero is a product photo, not an app screen.
- community-app-tour scenes are STEP 01/02/03 (process narrative). Resurgence's beats are RATING/RECORD/ARMOR (spec assertions). Different structural shape.

**New template name:** `kinetic-product-30s` — vertical, kinetic-pop vibe, ecommerce/spec-led shape.

Future ecommerce briefs (any product with bold specs to anchor on) reuse this template. Brand-specific data (product photo, palette tokens, copy) is the plug-in.

---

## Beat-by-beat

### Beat 1 — HOOK · "They look like denim. They protect like armor." (0 – 5.5s)

| Element | Direction |
|---|---|
| Background | Charcoal-to-black radial gradient. No cream. |
| Visual hero | Full-frame indigo hero photo (the model's legs in the jeans), cropped tight on the denim. KenBurns push from `scale: 1.0 → 1.08` over the full beat — not a still. |
| Type 1 (in at t=0.4s) | "THEY LOOK LIKE" — small, all caps, centered top. Wide tracking. White on the photo. |
| Type 2 (in at t=1.0s) | "DENIM." — huge condensed sans, hero size. Drops in with a 0.25s smash-cut, no overshoot. White, hard shadow. |
| Type 3 (in at t=2.7s) | "BUT PROTECT LIKE" appears (small, replaces type 1). |
| Type 4 (in at t=3.2s) | "ARMOR." replaces "DENIM." with a slam-cut + 30ms shake. Same scale, new word. The contradiction lands. |
| Audio | Music kicks in at t=0 with a kick-drum stinger (per R6 — first 0.5s percussive transient). VO line 1 lands ~0.6s, line 2 ~3.2s. |

**Why this beats opening on the wordmark** (per R1): the contradiction *is* the hook. The brand reveal is earned later when the buyer has already locked onto the promise.

### Beat 2 — CE AAA RATING · "C E Triple A. The top motorcycle-jeans rating." (5.5 – 10s)

| Element | Direction |
|---|---|
| Visual hero | Product photo recedes to right side, scales to ~50%, slight tilt. |
| Big stamp | A typographic STAMP lands on the left half: "CE AAA" inside a bold rectangle border. Style: red-orange ink, slightly distressed, like a CE-mark stamped on a tag. Slam-cut entrance with a 4° rotation overshoot. |
| Subtitle | "TOP RATING · EN 17092-1:2019" small caps under the stamp (the actual standard, gives the claim teeth). |
| Audio | Slam-stinger at the stamp drop (8 frames in). |
| Persistent motion | Stamp does a tiny 1.5° wobble for the rest of the beat (mailed-with-conviction feel). |

### Beat 3 — RECORD · "World-record Pekev liner. Ten-point-eight-three seconds slide-time." (10 – 15s)

The hero number. Biggest single typographic moment in the video.

| Element | Direction |
|---|---|
| Visual hero | Product photo fades to dark backdrop. The frame goes nearly type-only. |
| Big number | "**10.83**" lands at ~480px font-size, white, bold condensed sans, centered. Slam-cut entrance. |
| Subtitle 1 | "SECONDS" small caps below the number. |
| Subtitle 2 | "C.E.-CERTIFIED SLIDE TIME · WORLD RECORD" smaller, two lines, tracked-out, bottom of frame. |
| Decimal animation | The "0.83" portion counts up from 0 → 0.83 over 0.6s as if reading a stopwatch. |
| Background | Subtle horizontal speed-blur lines (CSS gradients) drift right-to-left for the full beat. |
| Audio | Music drops out at start of beat (3 frames silence) then a single percussive hit + sustained synth pad as 10.83 lands. |

This is the beat that decides whether someone shares the video. The number is the proof.

### Beat 4 — ARMOR + CARE · "D-three-O Ghost armor. Hip and knee. Wash safe. No loss of protection." (15 – 20s)

Fast-cut spec round. 2 spec claims, 2 sub-cuts inside this beat (=R2 cut count).

| Element | Direction |
|---|---|
| Visual hero | Product photo back center but smaller. Two callouts ANIMATE IN around the model's hips and knees. |
| Hip callout (in at 15.4s) | A line + dot pointing at the hip area, label "D3O GHOST · HIP". Honey-yellow line on dark bg. |
| Knee callout (in at 16.0s) | Similar, "D3O GHOST · KNEE". |
| Mid-cut at 17.5s | Hard cut to a clean type slate: "WASH SAFE." big. Below: "NO LOSS OF PROTECTION." medium. |
| Holds 2s | Type slate holds till 19.8s. |
| Audio | Two snap-stings at 15.4 and 16.0 (the callouts arriving). Hard cut at 17.5 has its own tonal hit. |

### Beat 5 — PRODUCT + PRICE · "Heritage Straight Indigo Sport. From three-seventy-nine." (20 – 25.5s)

The "buy this one" beat. Product gets its full name + price.

| Element | Direction |
|---|---|
| Visual hero | Product photo returns to center, scales 0.8 → 1.0 with a soft entrance. |
| Name (in at 20.4s) | "HERITAGE STRAIGHT" small caps top. "INDIGO SPORT" larger below. Both in cream/off-white on the dark bg. |
| Price stamp (in at 22.5s) | Right side: "FROM" tiny + "$379" massive (think Apple-keynote price callout). Coral/red color (matches the logo's red star). |
| Persistent motion | Price stamp pulses subtly (scale 1.0 ↔ 1.04, 0.6s sine). |
| Audio | Music re-builds to climax through this beat. |

### Beat 6 — CTA · "Resurgence." (25.5 – 30s)

Brand reveal at the end. The whole video earns the wordmark by getting here.

| Element | Direction |
|---|---|
| Background | Pure black or deep charcoal. |
| Logo | RG-shield logo lands center, scales 0.5 → 1.0 with a tight back.out(1.6) entrance. ~280px. Hold. |
| URL | "resurgencegear.co.nz" cream sans below the logo, light tracking. |
| Optional secondary line | "FREE NZ SHIPPING OVER $250" tiny under the URL — direct from the brand site, real urgency signal. |
| Audio | Music final hit + sustain. |
| Hold | Static for the final 2.5s (per R14 — end card ≥ 2s static for the algorithm's replay/follow signals). |

---

## Asset audit (against the storyboard)

| Asset | Needed for beat | Have? | Notes |
|---|---|---|---|
| Indigo product hero photo | 1, 2, 4, 5 | ✅ `assets/resurgence-indigo/hero.png` | Model from waist-down in indigo jeans. Crop variants per beat. |
| RG shield logo | 6 | ✅ `assets/resurgence-indigo/logo.png` | Black grunge shield with red star. |
| CE AAA stamp | 2 | Build in CSS — red-orange box + bold type | Will look more honest as a typographic stamp than a fake-vector badge. |
| D3O Ghost callouts | 4 | Build in CSS — line + dot + text labels | Honey-yellow stroke on dark. |
| Music | all beats | Auto-pick (kinetic-pop shortlist) | Pull from `assets/music/` energetic ladder. |
| Speed-blur lines (beat 3) | 3 | Build in CSS gradients — rotated divs | Cheap, won't break determinism. |

## Verifier targets at lock

- Verdict: **ship** before user review.
- R1: ✅ no logo before t=25.5s.
- R2: ≥10 cuts in 30s. Counted: 1 (beat 1 type-replace), 2 (beat 2 stamp drop), 3 (beat 3 number lands), 4 (beat 4 hip), 5 (beat 4 knee), 6 (beat 4 wash-safe), 7 (beat 5 name in), 8 (beat 5 price stamp), 9 (beat 6 logo lands), 10 (beat 6 URL types) = 10. ✅
- R5: CTA URL upper-center, not bottom band. ✅
- R8: ≤30 chars on-screen at t=0. "THEY LOOK LIKE / DENIM." = 20 chars. ✅
- R11: Visual fills ≥60% of frame at t=0-3 (full hero shot). ✅
- R14: Final scene static for 2.5s. ✅

## Open from this storyboard

- Music selection: existing `assets/music/` energetic shortlist may not include a hard-edge motorsport track. If the auto-pick is too "tech-startup", we may need to source one for kinetic-product templates.
- "FREE NZ SHIPPING OVER $250" verbatim from the brand — verify it still applies before locking for production.
- D3O Ghost callouts require positioning that works for THIS hero photo. If we re-use this template for a different product, callouts need to be re-positioned.
