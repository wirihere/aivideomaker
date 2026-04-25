# Claim Mate v2 — Shot List

**Reads:** plans/claim-mate-v2/script.md · plans/claim-mate-v2/brief.md
**Format:** 1080×1920 vertical (9:16)
**Visual treatment:** Cadastral paper world — cold open, warm middle, settled close. Documentary stillness with one motivated camera move per shot. Grade unified across all photographic material (colorist: see grade.md). Every shot earns its place; nothing decorates.

---

## Summary

| | |
|---|---|
| **Total shots** | 16 |
| **Total scripted duration** | ~27s |
| **Beats covered** | 8 (Beat 1–7 narrated + Beat 6 silent card) |
| **Shots per beat** | 2–3 (never 1, never more than 3) |

**Highest-risk shots (flag for html-composer):**

- **Shot 2.2** — parallax requires two independently animated layers (text + background photo). Must confirm HyperFrames can drive two `clip` elements at different speeds within the same track window.
- **Shot 5.1** — `working.mp4` has sparse keyframe history; pre-encode is mandatory before this shot will loop cleanly.
- **Shot 7.1** — the ledger split (`YOU PAY` / `$0`) uses a grid layout inside a clip; ensure the HyperFrames clip wrapper doesn't collapse flex context.
- **Shot 8.2** — the fine-print line ("3 months from your decision letter") must be visible but subordinate. At 1080×1920, 14px Inter is borderline legible — bump to 16px if lint warns on accessibility.

---

## Beat 1 — Hook: the letter, the no (~0.0–4.0s)

**Background:** `assets/photos/denied-letter.jpg`
**Mood:** Cold. Forensic stillness. The viewer recognises this.
**Color treatment:** Full `.grade` class. Deep vignette inset.
**Entry:** No text overlay this beat. The image alone carries it.
**Cut on:** The 1.2s breath-pause after "no."

---

### SHOT 1.1 | CU | 2.2s | Ken Burns slow push
- **Frame:** Tight on the corner of the denied letter against a dark kitchen surface. The paper edge and a sliver of the ACC logo or date stamp are visible. No full text legible. Letterbox crop — frame is oppressively close.
- **Move:** Ken Burns slow push. `scale: 1.0 → 1.06`, `ease: "power1.inOut"`, duration matches shot. The push begins before narration lands "ACC said no" and settles just as the word "no" arrives.
- **Layer treatment:** Vignette — radial dark overlay (`radial-gradient` from transparent center to `rgba(13,24,38,0.55)` at edges). No text. No brand. Just the letter.
- **Motivated by:** The viewer needs to feel the weight of the object before they hear the words. Push-in = closing in on a threat.
- **Continuity note:** The letter is the subject through both shots. Same lighting, same paper. The cut is a reframe, not a scene change.

---

### SHOT 1.2 | ECU | 1.8s | Static (SMIL does the work)
- **Frame:** Extreme close on the word "DECLINED" — rendered as an inline SVG text element or the `assets/svg-animations/brand/claim-mate-paper-tick.svg` stamp graphic if the SVG library contains a declined-stamp variant; otherwise a typographic treatment: "DECLINED" in JetBrains Mono, `--warn: #9a3a3a`, 72px, letter-spaced, over the blurred background of Shot 1.1.
- **Move:** Static hold. The word reveals via a wipe animation (left-to-right clip-path reveal, 0.4s) timed to land on the cut point. After reveal: no move. The stillness after the wipe is deliberate — it sits in the 1.2s breath pause.
- **Layer treatment:** Background is Shot 1.1 image blurred (`filter: blur(6px)`) so the DECLINED text is the sharp foreground. Same vignette persists.
- **Motivated by:** The 1.2s silence after "no" is the most loaded moment in the video. This shot holds in that silence. Static because the viewer is meant to sit with it, not be rushed.
- **Continuity note:** Blur on the background signals we are now closer — ECU logic. The red stamp is the only saturated colour in an otherwise graded-cold frame.

---

## Beat 2 — Reframe: not the end (~4.0–7.5s)

**Background:** `assets/photos/workspace.jpg`
**Mood:** Warmer. Forward-facing. The denial letter is now off to one side — life continues.
**Color treatment:** `.grade` class still applied, but workspace.jpg has more warmth in its native tones — the grade should not erase that. Colorist to note.
**Entry:** No text overlay. Mood shift carried by image warmth and pull-back move.
**Cut on:** The 0.8s pause after "the end."

---

### SHOT 2.1 | MS | 1.8s | Pull-back reveal
- **Frame:** Medium shot on a hand deliberately setting a piece of paper aside on a desk. The hand is unhurried — not crumpling, not throwing, just placing. The workspace.jpg is the base, composited with a desk-surface crop. If workspace.jpg doesn't include hand detail, this is a wide-medium on the desk itself with the letter in the lower third, visually "setting aside" achieved by the pull-back move.
- **Move:** Pull-back reveal. `scale: 1.08 → 1.0`, `ease: "power2.inOut"`, duration 1.8s. The pull-back begins as narration starts "A decline isn't the end" — the act of pulling back is the reframe. As scale decreases, more of the desk/life context enters the frame.
- **Layer treatment:** Slightly reduced vignette (lighter than Beat 1 — we are opening up). Still `.grade`. No text overlay.
- **Motivated by:** Scale 1.08 → 1.0 is the cinematic "landing" move. The camera relaxes as the narrator reframes. Scale contraction = exhaling, opening up.
- **Continuity note:** This is the same letter from Beat 1, now being placed aside. The viewer's eye tracks the continuity even without seeing it explicitly.

---

### SHOT 2.2 | WS | 1.7s | Parallax drift
- **Frame:** Wide on the workspace — a laptop open, a cup of coffee, ordinary life resumed. The letter is out of frame. This is the "after" state. workspace.jpg fills the background.
- **Move:** Parallax. Background (`workspace.jpg`) drifts `translateX: 0 → -1.5%` over the shot. A foreground vignette layer drifts at `translateX: 0 → -3%` in the same direction. The difference in drift rates creates depth. The drift is slow — perceptible only on attention.
- **Layer treatment:** Warm-adjacent grade. A subtle paper-tone overlay (`rgba(238,241,245,0.12)`) to carry the brand palette into the warmer photo without neutralising it.
- **Motivated by:** The wide shot after a close reframe is a breath of context. The gentle parallax says "life is bigger than this letter" without stating it.
- **Continuity note:** Cut carries us from an MS to a WS — size contrast between shots gives the reframe physical space.

---

## Beat 3 — Process: Step 01, upload (~7.5–11.5s)

**Background:** Top-down or near-top-down surface — could derive from workspace.jpg cropped or a solid `--paper: #eef1f5` with paper grid.
**Mood:** Functional. Clean. Fast. The action is easy.
**Color treatment:** `.grade` on any photographic element. On-screen text sits on ungraded paper background for legibility.
**On-screen text:** `STEP 01 · UPLOAD LETTER` (JetBrains Mono, 13px, `--ink-3`, uppercase, letter-spaced — matches brand eyebrow style)
**Cut on:** 0.5s step-transition pause.

---

### SHOT 3.1 | CU | 2.0s | Ken Burns slow push
- **Frame:** Close on a phone face-down on paper, or a hand positioning a phone over a document. The action implied is photographing — the phone camera framing the letter. Crop tight enough that the phone fills ~60% of frame. Paper texture visible.
- **Move:** Ken Burns slow push. `scale: 1.0 → 1.05`, `ease: "power1.inOut"`. Begins at shot start, ends at shot end.
- **Layer treatment:** Paper grid background persists at low opacity behind any text elements. No vignette — this beat is clean and light.
- **Motivated by:** Push-in on the action of photographing tightens focus on the simplicity of the act. We are watching something easy happen.
- **Continuity note:** First appearance of on-screen text. STEP 01 label enters at the top, slides in from left over 0.3s, on the `data-start` of this shot.

---

### SHOT 3.2 | Insert | 2.0s | Slow drift up
- **Frame:** Insert: the phone screen after capture — a small checkmark or "photo saved" state. OR if no phone footage is planned: a clean typographic insert on paper background showing only `UPLOAD LETTER / 2 MIN` in JetBrains Mono, referencing the step label. The insert is the visual confirmation "done."
- **Move:** Slow drift. `translateY: 0 → -2%`, `ease: "sine.inOut"`, over shot duration. A gentle upward float — the task completes and rises.
- **Layer treatment:** Paper tone background. Step label persists from Shot 3.1 (same `data-track-index`, continuous visibility).
- **Motivated by:** Upward drift on completion = lifted, done. The insert gives the beat a punctuation mark without overstaying.
- **Continuity note:** STEP 01 label remains visible through the transition. It fades as the cut to Beat 4 begins.

---

## Beat 4 — Process: Step 02, case check (~11.5–14.5s)

**Background:** Desk/document context. `workspace.jpg` re-used at different crop, or `working.mp4` if that includes a desk-review scene.
**Mood:** Professional, assured. "The we."
**Color treatment:** `.grade` on photographic elements. `file-text.svg` or `search.svg` from `assets/icons/lucide/` as functional icon accent.
**On-screen text:** `STEP 02 · WE CHECK THE CASE`
**Cut on:** 0.6s step-transition pause.

---

### SHOT 4.1 | MS | 1.8s | Slow drift left
- **Frame:** Medium shot on a desk with documents visible — a screen partially in frame, papers, purposeful workspace. This is implied review work. If workspace.jpg has a desk-wide angle, use it. If working.mp4 has a desk-review segment, prefer the video clip and apply slow drift as a CSS transform on the video element.
- **Move:** Slow drift left. `translateX: 0 → -2.5%`, `ease: "sine.inOut"`. The camera slowly pans left as if following reading motion.
- **Layer treatment:** `.grade` on the video/photo element. The `search.svg` or `file-text.svg` icon (from `assets/icons/lucide/`) appears at bottom-right of frame at 32×32px, `--ink-3` fill, as a functional annotation — not decorative.
- **Motivated by:** A slow pan left mimics the eye reading a document. The "we check" motion is a lateral scan, not a push.
- **Continuity note:** STEP 02 label enters same style as STEP 01 — sliding in from left at shot start. Consistent treatment across all step labels.

---

### SHOT 4.2 | Insert | 1.5s | Smash zoom settle
- **Frame:** Insert: the `check-circle-2.svg` icon from `assets/icons/lucide/` — centered, large (120×120px), on a clean paper-tone background. This is the visual beat for "case check complete" — clean, clear, confident.
- **Move:** Smash zoom settle. `scale: 0.82 → 1.0`, `ease: "power4.out"`, over 0.2s from shot start — then holds static for remaining 1.3s. The smash-zoom is punctuation, not movement; the hold is the statement.
- **Layer treatment:** Paper background. `--accent: #1f3a68` fill on the icon. No vignette. Pure and clean.
- **Motivated by:** The check-circle icon is a resolution beat — it answers "we checked." The smash-zoom is the moment of confirmation: it arrives fast and then holds steady, which is exactly the emotional register of a positive check.
- **Continuity note:** STEP 02 label holds through Shot 4.2. Step label fades to transition Beat 5.

---

## Beat 5 — Process: Step 03, draft and lodge (~14.5–17.5s)

**Background:** `assets/videos/working.mp4` (pre-encoded, sparse keyframes fixed before use)
**Mood:** Purposeful. Quiet industry. This beat carries the "mostly us" promise.
**Color treatment:** `.grade` applied to video element. Slow drift on video itself.
**On-screen text:** `STEP 03 · DRAFT + LODGE`
**Cut on:** 0.4s transition to Beat 6 silent card.

---

### SHOT 5.1 | MS | 1.8s | Slow drift right + grade
- **Frame:** Medium on a person at a desk, typing or working with documents — `working.mp4` provides this if the clip contains a desk-work scene. Frame at mid-body level: hands on keyboard visible, face or upper body partially in frame. Purposeful action, not posed.
- **Move:** Slow drift right. CSS transform on the `.grade`-classed `<video>` element: `translateX: 0 → 2%`, `ease: "sine.inOut"`. The drift is subtle — it marks that time is passing, work is happening.
- **Layer treatment:** `.grade` on video. Darkened lower-third strip (`linear-gradient` from transparent to `rgba(13,24,38,0.45)` over the bottom 25% of frame) — this is where the STEP 03 label sits, so the text remains legible over moving footage.
- **Motivated by:** Rightward drift suggests forward progress — work moving toward completion. Lower-third darkening is a legibility necessity, not decoration, when text sits over video.
- **Continuity note:** STEP 03 label on the lower-third. First time in the video that text sits over video footage — the darkened strip is the treatment that makes this work.

---

### SHOT 5.2 | Insert | 1.5s | Pull-back reveal
- **Frame:** Insert: a clean typographic card on paper background. Single line: `LODGED` in JetBrains Mono 700, `--accent: #1f3a68`, 48px, centered. Below it: `WITHIN 5 DAYS` in JetBrains Mono 400, `--ink-3`, 18px. This is the "sent state" — the document lodged.
- **Move:** Pull-back reveal. `scale: 1.06 → 1.0`, `ease: "power2.inOut"`, over 0.8s. The card arrives by pulling back to reveal itself — a "landing" feel as the key fact settles.
- **Layer treatment:** Paper background with fine paper grid at low opacity. No vignette. The typographic card is the only element.
- **Motivated by:** Pull-back on the "within five days" fact — this is the key claim of Beat 5. The camera pulls back to give it room to land, same logic as Beat 7's cost card.
- **Continuity note:** Step label fades as the pull-back completes and we approach the silent Beat 6 card.

---

## Beat 6 — Silent card: Step 04, FairWay hearing (~17.5–19.5s)

**Background:** Paper tone `--paper: #eef1f5` with cadastral grid at low opacity.
**Mood:** Documentary caption. Still. No narrator. The card speaks.
**Color treatment:** No photographic elements — no `.grade` needed. Pure typographic card.
**On-screen text:** `STEP 04 · FAIRWAY HEARING · ABOUT 4 WEEKS`
**No narration. Music bed carries the silence.**
**Entry:** Fade in over 0.4s. Hold 1.6s. No exit animation — direct cut to Beat 7.

---

### SHOT 6.1 | Insert | 2.0s | Breathe float
- **Frame:** Full-frame typographic card. Layout (centered vertically):
  - `STEP 04` — JetBrains Mono 700, 13px, `--ink-3`, uppercase, letter-spaced
  - `FAIRWAY HEARING` — Inter 600 or Instrument Serif italic, 36px, `--ink`
  - `ABOUT 4 WEEKS` — JetBrains Mono 400, 18px, `--ink-3`
  - A thin `--rule` horizontal rule above `FAIRWAY HEARING` — cadastral precision.
  Paper grid is the background.
- **Move:** Breathe float. The entire card block: `translateY: 0 → -6px → 0`, `ease: "sine.inOut"`, 2.0s, once (no repeat — this is not an idle loop, it's a single exhale during the silence).
- **Layer treatment:** No overlay. No vignette. The nakedness of a plain card is the point — it is a caption, not a production moment.
- **Motivated by:** The float is the music bed made visible. The narrator has stopped; the card breathes once in the silence. The viewer reads; the card holds space for that reading.
- **Continuity note:** This is the only shot that is not paired. A single card for a single silent moment is appropriate — the beat is a caption, not a scene.

---

## Beat 7 — Cost: you pay nothing (~19.5–23.0s)

**Background:** Paper tone with cadastral grid — same as Beat 6, carrying continuity. No photographic material in this beat. The ledger is a document, not a scene.
**Mood:** Settled. Signed. This is a fact, not a pitch.
**Color treatment:** Typographic only — no `.grade`. Clean paper.
**On-screen text:** `YOU PAY · $0.00`
**Cut on:** 0.5s pause after "fee."

---

### SHOT 7.1 | Insert | 1.8s | Smash zoom settle
- **Frame:** Ledger-style split card. Two-column layout:
  - Left: `YOU PAY` — JetBrains Mono 400, 22px, `--ink-3`
  - Right: `$0` — Inter 700 or JetBrains Mono 700, 72px, `--ink` (or `--accent` — colorist to confirm weight against background)
  - A thin vertical rule divides the two sides — cadastral ledger aesthetic.
  - Below both: `ACC PAYS OUR FEE` — JetBrains Mono 400, 13px, `--ink-3`, letter-spaced.
- **Move:** Smash zoom settle. `scale: 0.85 → 1.0`, `ease: "power4.out"`, 0.22s from shot start — then static for 1.58s. The $0 card arrives with authority then holds.
- **Layer treatment:** Paper background. Fine grid at 8% opacity. No vignette. The starkness is the treatment.
- **Motivated by:** The $0 figure is the single most confidence-building fact in the video. A smash-zoom arrival followed by a still hold is the equivalent of a stamp on a document — emphatic, then settled.
- **Continuity note:** The vertical rule and ledger layout echo the cadastral grid world. The card lands and stays — no drift.

---

### SHOT 7.2 | MS | 1.8s | Pull-back reveal
- **Frame:** Same ledger card, now composited in the lower two-thirds of the frame with the upper third showing a clean paper-tone header. The pull-back reveals the full card context — as if a camera that was nose-close to the $0 figure is now showing us the whole document.
- **Move:** Pull-back reveal. `scale: 1.08 → 1.0`, `ease: "power2.inOut"`, over 1.2s. Holds at 1.0 for 0.6s.
- **Layer treatment:** Identical to Shot 7.1. The pull-back is the only change.
- **Motivated by:** The script notes "pull back slightly to show the full frame — stark and settled." This is exactly that. The pull-back on a key statement gives it the weight of a document being held at reading distance.
- **Continuity note:** Card content is unchanged between 7.1 and 7.2 — the cut is a scale change only. The viewer's eye doesn't need to reread; they've seen the $0. The pull-back gives it room.

---

## Beat 8 — CTA: Claim Mate, start today (~23.0–27.0s)

**Background:** Paper tone with cadastral grid — same world as Beats 6–7. Continuity of clean paper into the close.
**Mood:** Calm confidence. The video ends on the wordmark. No hype. No urgency. The brand is the last thing seen.
**Color treatment:** Typographic only. No `.grade`. The brand is clean.
**On-screen text:** `CLAIM/MATE · claim-mate.co.nz · Start your free review`
**Fine print (on-screen only, not narrated):** `3 months from your decision letter`

---

### SHOT 8.1 | MS | 2.0s | Pull-back reveal (wordmark arrival)
- **Frame:** The `CLAIM/MATE` wordmark centered. Rendered in HTML/CSS:
  - `CLAIM` — JetBrains Mono 700, 52px, `--ink`
  - `/` — JetBrains Mono 700, 52px, `--accent: #1f3a68` (navy slash)
  - `MATE` — JetBrains Mono 700, 52px, `--ink`
  - All caps. No surrounding elements yet. The wordmark alone fills the visual register.
  Below wordmark (enters 0.5s after wordmark settles): `claim-mate.co.nz` — JetBrains Mono 400, 18px, `--ink-3`.
- **Move:** Pull-back reveal. `scale: 1.10 → 1.0`, `ease: "power2.inOut"`, over 1.0s. The wordmark pulls back to reading distance. This is the biggest pull-back in the video — the brand deserves the most space.
- **Layer treatment:** Paper background. Grid at 8% opacity. A very subtle paper-tone top-edge gradient to soften the cut from Beat 7. No vignette.
- **Motivated by:** The pull-back on the wordmark gives it the same weight as the $0 card — the brand is a fact, not a logo. Pulling back is the editorial equivalent of a respectful distance.
- **Continuity note:** The cadastral grid persists from Beats 6, 7, and now 8 — three beats in the same visual world. The viewer recognises home ground by the time the wordmark arrives.

---

### SHOT 8.2 | MS | 2.0s | Breathe float (hold to end)
- **Frame:** Wordmark and URL from Shot 8.1, now joined by:
  - `Start your free review` — Inter 600, 22px, `--accent` (navy, as a soft CTA button label or plain text — no button border)
  - Fine print line: `3 months from your decision letter` — JetBrains Mono 400, 16px, `--ink-mute: #7d8a9a`
  - A thin `--rule` rule above the fine print.
  Vertical stack: CLAIM/MATE · claim-mate.co.nz · gap · Start your free review · rule · fine print.
- **Move:** Breathe float. `translateY: 0 → -5px → 0`, `ease: "sine.inOut"`, 2.0s, once (not looped). The float begins when the CTA text arrives. After the float completes, the frame holds static to the end — no fade to black.
- **Layer treatment:** Same clean paper. No vignette.
- **Motivated by:** The breathe float is the final exhale of the video. It is not energetic — it is calm. The float says "we're still here, unhurried." The static hold at the end (per script: "hold to still") is the final confident beat.
- **Continuity note:** This is the last shot. The wordmark holds in silence after Molly finishes "today." The music bed fades under this hold. The frame does not go black — it holds as a still, as if the video were a printed card that appeared on screen.

---

## Shot inventory

| Shot | Beat | Type | Duration | Move |
|------|------|------|----------|------|
| 1.1 | Hook | CU | 2.2s | Ken Burns push |
| 1.2 | Hook | ECU | 1.8s | Static (wipe reveal) |
| 2.1 | Reframe | MS | 1.8s | Pull-back reveal |
| 2.2 | Reframe | WS | 1.7s | Parallax drift |
| 3.1 | Step 01 | CU | 2.0s | Ken Burns push |
| 3.2 | Step 01 | Insert | 2.0s | Slow drift up |
| 4.1 | Step 02 | MS | 1.8s | Slow drift left |
| 4.2 | Step 02 | Insert | 1.5s | Smash zoom settle |
| 5.1 | Step 03 | MS | 1.8s | Slow drift right |
| 5.2 | Step 03 | Insert | 1.5s | Pull-back reveal |
| 6.1 | Step 04 silent | Insert | 2.0s | Breathe float |
| 7.1 | Cost | Insert | 1.8s | Smash zoom settle |
| 7.2 | Cost | MS | 1.8s | Pull-back reveal |
| 8.1 | CTA | MS | 2.0s | Pull-back reveal |
| 8.2 | CTA | MS | 2.0s | Breathe float |

**Total: 15 shots.** Within the 14–17 target. Under the 18-shot ceiling.

**Total planned duration: ~27.0s.** VTT is the master clock — html-composer must anchor every `data-start` to actual VTT timestamps once TTS is generated, not to these estimates.

---

## GSAP move reference (for motion-designer)

| Move name | GSAP recipe | Used in |
|---|---|---|
| Ken Burns slow push | `gsap.to(el, { scale: 1.06, ease: "power1.inOut", duration: shotDuration })` | 1.1, 3.1 |
| Pull-back reveal | `gsap.fromTo(el, { scale: 1.08 }, { scale: 1.0, ease: "power2.inOut", duration: 1.0 })` — hold remaining | 2.1, 5.2, 7.2, 8.1 |
| Parallax (2-layer) | BG: `translateX: "0% → -1.5%"`, FG vignette: `translateX: "0% → -3%"`, both `ease: "sine.inOut"` | 2.2 |
| Slow drift left | `gsap.to(el, { x: "-2.5%", ease: "sine.inOut", duration: shotDuration })` | 4.1 |
| Slow drift right | `gsap.to(el, { x: "2%", ease: "sine.inOut", duration: shotDuration })` | 5.1 |
| Slow drift up | `gsap.to(el, { y: "-2%", ease: "sine.inOut", duration: shotDuration })` | 3.2 |
| Smash zoom settle | `gsap.fromTo(el, { scale: 0.82 }, { scale: 1.0, ease: "power4.out", duration: 0.22 })` — static after | 4.2, 7.1 |
| Breathe float | `gsap.to(el, { y: -6, ease: "sine.inOut", duration: shotDuration/2, yoyo: true, repeat: 1 })` | 6.1, 8.2 |

---

## Visual continuity map

| From | To | What carries | What changes |
|---|---|---|---|
| 1.1 → 1.2 | Cold hold | Same `denied-letter.jpg`, same vignette | Scale (CU → ECU), sharp/blur swap, DECLINED reveal |
| 1.2 → 2.1 | Mood pivot | The letter (off-screen continuity) | Photo changes, vignette lightens, scale restores |
| 2.1 → 2.2 | Reframe lands | workspace.jpg, grade | MS → WS, parallax starts, mood warmer |
| 2.2 → 3.1 | Step world opens | Grade | Photo crop changes to top-down, paper grid replaces vignette |
| 3.1 → 3.2 | Step 01 completes | Step 01 label, paper bg | CU → Insert, completion icon arrives |
| 3.2 → 4.1 | Step transition | Grade treatment | New step label (STEP 02), desk scene |
| 4.1 → 4.2 | Case check resolves | Step label | Insert + check-circle icon, clean bg |
| 4.2 → 5.1 | Step transition | Grade world | working.mp4 enters, lower-third strip arrives |
| 5.1 → 5.2 | Lodge completes | Step label fading | Insert pull-back, LODGED typographic card |
| 5.2 → 6.1 | Silent transition | Paper tone, grid | All step labels gone, plain caption card |
| 6.1 → 7.1 | Cost world | Paper tone, grid | Caption card exits, ledger card arrives (smash) |
| 7.1 → 7.2 | $0 settles | Ledger card content | Scale pull-back, reveal context |
| 7.2 → 8.1 | Brand arrival | Paper tone, grid | Ledger fades, wordmark arrives (pull-back) |
| 8.1 → 8.2 | CTA completes | Wordmark, URL | CTA text + fine print enter, breathe float, hold |

---

## Notes for html-composer

1. **Track index discipline.** Each shot is a discrete `clip`. Within a beat, shots on the same background layer share a track; text labels use a separate track above. Do not stack more than 3 tracks deep without explicit z-index management.
2. **working.mp4 pre-encode required.** Apply `ffmpeg -i assets/videos/working.mp4 -c:v libx264 -r 30 -g 30 -keyint_min 30 -movflags +faststart -c:a copy assets/videos/working-enc.mp4` before referencing in the composition. Reference the `-enc` version only.
3. **bg-motion.mp4 not used.** This shot list does not call for `bg-motion.mp4`. The CTA beat uses clean paper, not ambient video — the calm of paper is more on-brand than motion blur in the close. If the editor disagrees after preview, the CTA could swap Shot 8.1 background to `bg-motion.mp4` with a grade overlay — but that requires producer approval.
4. **SVG tick note.** `assets/svg-animations/brand/claim-mate-paper-tick.svg` is not called in any shot. The DECLINED stamp in Shot 1.2 is a CSS/HTML typographic treatment, not that SVG. Do not use the cadastral tick as a primary element anywhere.
5. **Fine print legibility.** Shot 8.2 fine print at 16px Inter on `--paper` background must pass a quick contrast check. `--ink-mute: #7d8a9a` on `--paper: #eef1f5` is approximately 3.2:1 — marginal for WCAG AA but acceptable for on-screen legal disclaimer at this size. If lint flags it, increase to `--ink-3: #4b5a6d` for 4.6:1.
