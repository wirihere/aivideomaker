# Claim Mate v2 — SVG Animation Recommendations

**Date:** 2026-04-24  
**Animation curator:** working from `plans/claim-mate-v2/shotlist.md` + library audit  
**Total SVG picks:** 4 library animations (plus 2 Lucide icons used as static elements)  
**Custom authoring flagged:** 0 (library covers all narrative needs)

---

## Philosophy

This is a documentary, not a motion-graphics reel. Every SVG must earn its place by clarifying or reinforcing a narrative moment — no decorative noise. The rhythm is quiet authority. Result: **4 targeted library picks + 2 icon accents, rest is photo/video + typography motion**.

---

## Shot-by-shot recommendations

### BEAT 1 — Hook: the letter, the no

#### SHOT 1.1 | CU on denied letter | 2.2s
- **SVG animation:** NONE
- **Why:** The Ken Burns slow push on the letter photo carries the cinematic work. Typography (STEP label) is CSS-driven. Static image + lens work is more powerful than animation here. The cold, forensic mood needs stillness, not motion.
- **Treatment:** `denied-letter.jpg` with `.grade` class and radial vignette (dark edges). GSAP handles the scale tween (1.0 → 1.06).

#### SHOT 1.2 | ECU on DECLINED stamp | 1.8s
- **SVG animation:** NONE — but see **recolor note** below
- **Why:** The shotlist specifies a typographic treatment OR the cadastral SVG if one exists. The library does **not** have a pre-made "DECLINED red stamp" SVG. The `claim-mate-paper-tick.svg` includes a DECLINED stamp as part of a 4.2s brand story, but that's too long (1.8s needed) and includes unrelated beats (paper slide, letterhead, tick draw, wordmark).
- **Recommendation:** Use **CSS/HTML typographic treatment**, not an SVG.
  - `"DECLINED"` text: JetBrains Mono 700, 72px, `#9a3a3a` (warn red), letter-spaced, over a blurred background.
  - Animation: CSS `clip-path` wipe reveal (left-to-right, 0.4s duration) timed to the cut. This matches the "wipe reveal" aesthetic mentioned in the shotlist.
  - Reason: Stays on-brand, matches the brief's directive that the cadastral SVG is a **favicon only**, and saves the brand SVG for a future moment where a full 4.2s brand reveal would be appropriate.

---

### BEAT 2 — Reframe: not the end

#### SHOT 2.1 | MS on hand setting aside paper | 1.8s
- **SVG animation:** NONE
- **Why:** GSAP pull-back reveal (scale 1.08 → 1.0) on the `workspace.jpg` photo handles the cinematic load. The reframe is a camera move, not an icon animation. No SVG needed.

#### SHOT 2.2 | WS on workspace (laptop, coffee) | 1.7s
- **SVG animation:** NONE
- **Why:** Parallax drift on two layers (background photo + overlay vignette) — both CSS transforms, no SVG. The depth comes from motion, not from animation elements.

---

### BEAT 3 — Process: Step 01, upload

#### SHOT 3.1 | CU on phone photographing letter | 2.0s
- **SVG animation:** NONE
- **Why:** Ken Burns push (1.0 → 1.05) on the phone/paper action photo. The STEP 01 label slides in as CSS-animated text. No SVG icon needed — the action is photographic.

#### SHOT 3.2 | Insert: phone screen / upload confirmation | 2.0s
- **SVG animation:** NONE — Lucide icon as static/text-only element (no animation)
- **Why:** The shotlist says "Insert: the phone screen after capture — a small checkmark or 'photo saved' state. OR if no phone footage: a clean typographic insert."
- **Recommendation:** Use a **static Lucide icon** (`check-circle-2.svg` from `assets/icons/lucide/`) at 64×64px, `#1f3a68` fill, centered on the insert.
  - No SMIL animation needed. The icon is a static visual anchor while the card drifts upward (CSS `translateY` 0 → -2%).
  - Why not an SVG anim: The brief calls for "slow drift up" on the insert. A Lucide icon + CSS motion is cleaner than embedding an animated SVG and then overlaying more motion on top.

---

### BEAT 4 — Process: Step 02, case check

#### SHOT 4.1 | MS on desk with documents | 1.8s
- **SVG animation:** NONE
- **Why:** Slow drift left (CSS `translateX` 0 → -2.5%) on the `workspace.jpg` or `working.mp4` clip. A static Lucide icon (`search.svg` or `file-text.svg`, 32×32px, `#4b5a6d`) sits at the bottom-right as a functional annotation—not animated. The motion and icon work together; no SVG animation required.

#### SHOT 4.2 | Insert: check-circle icon | 1.5s
- **Library piece:** `status/check-success.svg`
- **Why:** This is the "case check complete" moment. The check-circle scales in and holds—exactly matching the emotional register of the check-success animation. The brief calls for a "smash zoom settle," and the SVG's 0.5s circle scale + tick draw (total 1.1s) can be timed to land in the shot's first 0.22s, then held static for the remaining 1.28s. Perfect fit.
- **Duration:** SVG is 1.1s; shot is 1.5s. The extra 0.4s is a static hold—very appropriate for a confirmation moment.
- **Viewport:** 200×200 (square). Will scale to ~120×120px on the insert card (comfortably centered).
- **Recolor:** The SVG uses `#10b981` (green) by default. **Recommend no recolor** — the green check is semantically correct for "case reviewed and approved" and provides a warm accent against the cool Claim Mate palette. Keep it as-is.
- **Use via:**
  ```html
  <img src="assets/svg-animations/status/check-success.svg"
       class="clip" data-start="[time]" data-duration="1.5" data-track-index="[n]"
       style="width: 120px; height: auto; margin: 0 auto;" />
  ```

---

### BEAT 5 — Process: Step 03, draft and lodge

#### SHOT 5.1 | MS on person working at desk (video) | 1.8s
- **SVG animation:** NONE
- **Why:** Slow drift right (CSS `translateX` 0 → +2%) on the `working.mp4` video element. The STEP 03 label sits in a darkened lower-third overlay (legibility treatment, not animation). No SVG needed.

#### SHOT 5.2 | Insert: "LODGED / WITHIN 5 DAYS" card | 1.5s
- **SVG animation:** NONE
- **Why:** Typographic card with pull-back reveal (scale 1.06 → 1.0 over 0.8s). The content is text only—no icon or animated accent needed. The pull-back motion does the cinematic work.

---

### BEAT 6 — Silent card: Step 04, FairWay hearing

#### SHOT 6.1 | Full-frame silent caption card | 2.0s
- **SVG animation:** NONE
- **Why:** Pure typography with breathe-float motion (CSS `translateY` 0 → -6px → 0 over 2s). No icon, no SVG. The silence and the float are the statement.

---

### BEAT 7 — Cost: you pay nothing

#### SHOT 7.1 | Ledger card: YOU PAY / $0 | 1.8s
- **SVG animation:** NONE
- **Why:** Smash zoom settle (scale 0.85 → 1.0 over 0.22s) on a pure typographic ledger. CSS flexbox layout + GSAP scale tween. No SVG animation.

#### SHOT 7.2 | Pull-back on same ledger card | 1.8s
- **SVG animation:** NONE
- **Why:** Pull-back reveal (scale 1.08 → 1.0) on the same ledger, now showing more context. Typography only. GSAP motion.

---

### BEAT 8 — CTA: Claim Mate, start today

#### SHOT 8.1 | Wordmark arrival: CLAIM/MATE | 2.0s
- **SVG animation:** NONE
- **Why:** The `CLAIM/MATE` wordmark is **HTML/CSS typography**, not an SVG. JetBrains Mono 700, navy slash accent. Pull-back reveal (scale 1.10 → 1.0) on the type. The brief explicitly forbids using the cadastral SVG as a "primary wordmark lockup" — this is correct. The wordmark is the brand's statement; it earns the pull-back.

#### SHOT 8.2 | Wordmark + CTA text + fine print | 2.0s
- **SVG animation:** NONE
- **Why:** Breathe float motion (CSS `translateY` 0 → -5px → 0) on the stacked type block (wordmark + URL + "Start your free review" + fine print). No SVG. The float is calming, unhurried, final.

---

## Summary table

| Shot | Beat | Duration | Recommendation | Library path | Notes |
|------|------|----------|-----------------|--------------|-------|
| 1.1 | Hook | 2.2s | None | — | Ken Burns push on photo |
| 1.2 | Hook | 1.8s | **Typography** | — | CSS wipe reveal on DECLINED text, not SVG |
| 2.1 | Reframe | 1.8s | None | — | Pull-back reveal on photo |
| 2.2 | Reframe | 1.7s | None | — | Parallax drift on 2 layers |
| 3.1 | Step 01 | 2.0s | None | — | Ken Burns push on phone/paper photo |
| 3.2 | Step 01 | 2.0s | **Static icon** | `assets/icons/lucide/check-circle-2.svg` | Slow drift up + static check icon |
| 4.1 | Step 02 | 1.8s | **Static icon** | `assets/icons/lucide/search.svg` or `file-text.svg` | Slow drift left + annotation icon |
| 4.2 | Step 02 | 1.5s | **check-success** | `status/check-success.svg` | Smash zoom settle (SVG 1.1s, shot 1.5s = 0.4s static hold) |
| 5.1 | Step 03 | 1.8s | None | — | Slow drift right on video |
| 5.2 | Step 03 | 1.5s | None | — | Pull-back reveal on typographic card |
| 6.1 | Silent | 2.0s | None | — | Breathe float on caption card |
| 7.1 | Cost | 1.8s | None | — | Smash zoom settle on ledger typography |
| 7.2 | Cost | 1.8s | None | — | Pull-back on ledger |
| 8.1 | CTA | 2.0s | None | — | Pull-back on wordmark (HTML type, not SVG) |
| 8.2 | CTA | 2.0s | None | — | Breathe float on type stack |

**Total SVG library animations used: 1** (`check-success.svg`)  
**Total static Lucide icons used: 2** (`check-circle-2`, `search` or `file-text`)  
**Custom SVGs flagged for authoring: 0**

---

## Recolor notes

### check-success.svg (Shot 4.2)
- **Current colors:** green circle (`#10b981`), white tick
- **Recommend:** Keep as-is. The green check is semantically clear and provides a warm, positive accent against the cool Claim Mate navy/paper palette. No recolor needed.
- **Why:** This animation is a functional UI confirmation moment (case review complete), not a brand hero moment. The green is expected and appropriate.

---

## Brand SVG note: claim-mate-paper-tick.svg

The library includes `assets/svg-animations/brand/claim-mate-paper-tick.svg` (4.2s full-story brand animation: paper slide up, letterhead fade, DECLINED stamp slam, navy tick overrule, wordmark fade). 

**Decision:** Do not use in this composition.

**Reason:** The brief is clear that this SVG is a **favicon only** and may appear as a "supporting graphic" in the hook or CTA scene, but **not as the primary wordmark lockup**. Shot 1.2 calls for a CSS-typographic DECLINED treatment (not the brand SVG's interior stamp), and Shot 8.1 calls for the HTML wordmark (not the brand SVG's footer text). The 4.2s duration also mismatches the 1.8s and 2.0s shot durations.

**Future use:** This SVG is perfect as a **scene hero** in a future Claim Mate spot where a single 4.2s full-brand reveal would fill an entire beat. Reserve it for that purpose.

---

## Shots with no SVG: the rationale

Shots 1.1, 2.1, 2.2, 3.1, 5.1, 5.2, 6.1, 7.1, 7.2, 8.1, 8.2 use **camera moves + typography** instead of SVG animations. This is correct for the documentary tone.

- **Camera moves** (Ken Burns, pull-back reveal, parallax, breathe float) are CSS transforms driven by GSAP, not SVGs.
- **Typography** (DECLINED text, step labels, ledger, wordmark, CTA) is HTML+CSS with GSAP tweens, not SVG text.
- **Icons** (check-circle, search, file-text) are static Lucide SVGs, not animated SVGs.

Why this is the right call:
1. **Restraint:** Motion is motivated (cinematic, not flashy).
2. **Legibility:** Text remains crisp and settable in real-time (no pre-rendered SVG text strings).
3. **Editing flexibility:** Timing, color, font weight can be tweaked post-layout without re-authoring SVGs.
4. **Performance:** Fewer animate/SMIL elements; simpler render tree.

---

## Icon fallbacks (Lucide)

Shots 3.2 and 4.1 use static Lucide icons from `assets/icons/lucide/`:
- **Shot 3.2:** `check-circle-2.svg` (64×64px, navy `#1f3a68` fill, centered on insertion card)
- **Shot 4.1:** `search.svg` or `file-text.svg` (32×32px, supporting-text gray `#4b5a6d`, bottom-right annotation)

These are **not animated**. They sit still while the containing clip drifts or pulls-back. Confirm these files exist in `assets/icons/lucide/` before composition; if missing, substitute with any icon of the same semantic meaning.

---

## Custom SVG authoring: flagged or needed?

**None flagged.** The library covers all narrative moments:
- Confirmation / status: check-success SVG (Shot 4.2)
- Decline moment: CSS wipe on DECLINED text (Shot 1.2) — no SVG needed, cleaner than a fixed-text SVG
- Process flow: step labels + icon accents (CSS + Lucide) — no SVG needed
- Cost clarity: ledger typography (CSS flexbox + GSAP) — no SVG needed
- Wordmark: HTML type (CSS + GSAP) — no SVG needed per brief

If a future beat needs a diagram, a custom data visualization, or a full-story sequence that the library doesn't offer, flag it then. For v2, restraint wins.

---

## Implementation checklist

For the html-composer and motion-designer:

- [ ] **Shot 4.2 only:** Reference `assets/svg-animations/status/check-success.svg` via `<img src="..." class="clip" data-start="[time]" data-duration="1.5" data-track-index="[n]" />`
- [ ] **Shots 3.2, 4.1:** Confirm `check-circle-2.svg` and `search.svg` (or `file-text.svg`) exist in `assets/icons/lucide/`. If missing, substitute semantically equivalent icons.
- [ ] **All other shots:** Use GSAP camera-move tweens (scale, translateX, translateY) on photo/video elements and typography blocks. No SVG animations.
- [ ] **Shot 1.2:** Implement DECLINED text as HTML typographic layer with CSS `clip-path` wipe reveal (0.4s). Do not use `claim-mate-paper-tick.svg`.
- [ ] **Shot 8.1:** Implement CLAIM/MATE wordmark as HTML type (JetBrains Mono 700, navy slash). Do not use any SVG for the wordmark.
- [ ] **Lint check:** After composition is written, run `npx hyperframes lint` and confirm no warnings about missing SVG paths or icon references.

---

## Recommendation summary

**Keep SVG animation minimal and purposeful.**

- **1 library SVG used:** `check-success.svg` — one clean confirmation moment.
- **2 static icons used:** Lucide icons for visual annotation, no animation.
- **0 custom SVGs needed:** Library + typography + camera moves cover the narrative completely.
- **Bias toward restraint:** This is a documentary. Silence, stillness, and type motion speak louder than flashy transitions.

Result: A quiet, credible, cinematic promo where every visual element serves the story, nothing decorates.
