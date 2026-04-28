# Claim Mate v2 — Producer's Brief

**Date:** 2026-04-24
**Executive producer:** user
**Producer:** producer (this agent)
**Director:** video-director

---

## Goal (one sentence)

Replace the current `index.html` with a 25–30s cinematic Claim Mate promo that feels like a documentary short — multiple shots per scene, motivated camera moves, a quiet music bed, consistent color grade across all footage — while making zero invented claims.

---

## Audience

ACC claimants in New Zealand who have just received a decline letter and are asking "what do I do now?" — people who are stressed, possibly in pain, and deserve a calm, credible response rather than hype.

---

## Format & length

- Resolution: 1080×1920 (vertical, 9:16)
- Length: 27s target (range 25–30s)
- Aspect: vertical

---

## Brand

- Real / Generic: real
- Canonical source: `/c/Users/wirihere/claim-mate/landing-page/index.html` — read this first, trust nothing else
- Palette (from canonical source):
  - `--paper: #eef1f5` (background)
  - `--ink: #0d1826` (primary text)
  - `--accent: #1f3a68` (navy, highlights)
  - `--warn: #9a3a3a` (red, for "declined" strike-through only)
  - `--ink-3: #4b5a6d` (supporting text)
- Type: JetBrains Mono (machinery/labels) · Inter (body/display) · Instrument Serif italic (emphasis)
- Wordmark: `CLAIM/MATE` — uppercase, JetBrains Mono 700, navy slash. NOT lowercase. NOT with the cadastral icon as a logotype. The cadastral SVG (`assets/svg-animations/brand/claim-mate-paper-tick.svg`) is a FAVICON only and may appear as a supporting graphic but not as the primary wordmark lockup.
- Voice: Quiet authority. A serious ally, not a salesperson. Every line earns its place. Tone matches the landing page — precise, honest, calm. Not punchy, not loud.
- Verified facts available (from canonical source, cite-safe):
  - "You pay $0 — ACC pays our fee." (from meta description + hero)
  - "Reviews lodged within 5 days." (from meta description)
  - "We prepare your ACC review and lodge it with FairWay within 5 days." (hero)
  - "You pay nothing. ACC pays our fee when your review succeeds — or when your case had merit." (hero)
  - "$0 to you, always" (hero meta)
  - "3 months from your ACC decision letter" (deadline — hero meta)
  - "5 days to draft and lodge" (hero meta)
  - "Four steps. Mostly us." — Step 01: Upload letter (2 min). Step 02: We check case. Step 03: We draft and lodge. Step 04: FairWay hearing (~4 weeks). (How it works section)
  - "By law, ACC pays the cost of a review when the case has merit. We bill ACC, not you." (cost section)
  - "Surgery declined · Weekly comp underpaid · Cover rejected · Treatment refused · Lump sum disputes" (coord strip — exact types of claims)
  - URL: `claim-mate.co.nz` / email: `hello@claimmate.co.nz`
  - Footer: "We prepare ACC reviews for Kiwis whose claims got declined or short-paid. The customer pays nothing. ACC pays us."
  - "Not a law firm · Not affiliated with ACC or FairWay Resolution" (colophon)
  - The $1,050 lay-advocate cap and medical report amounts — DO NOT USE in copy. They are real but technical; the director must confirm user approval before using any dollar figures.

---

## Vibe

Documentary calm. Cadastral precision. Quiet confidence. This is the opposite of a hype reel. Think a NZDF public information film, not an ad-agency spot.

---

## What v1 got wrong — this is the brief, not a suggestion

The user named four explicit deficiencies. These ARE the success criteria for v2. The director must address each one.

### 1. One shot per scene (v1 failure)
v1 had a single static visual per scene with one entrance animation. It felt like a slideshow. v2 requires **2–3 distinct shots per scene** — cuts within the scene, not just one element fading in. Each shot should last 1.5–4s. If a scene runs 5s, that's 2–3 shots.

### 2. No real camera moves (v1 failure)
v1 had GSAP fade/slide entrances but no camera-like motion. v2 needs **motivated camera moves on every shot**:
- Ken Burns slow push (scale 1.0 → 1.06 over shot duration) on still frames
- Parallax on layered elements (foreground text drifts at different rate from background image)
- Pull-back reveal on key statements (scale 1.08 → 1.0 as text fades in — "landing" feel)
- Slow drift (translateX or translateY at ~2–4% of frame over the shot) for stock footage
- These are CSS/GSAP animated transforms — not pre-baked video motion

### 3. No music bed (v1 failure)
v1 had narration only. v2 requires a **continuous quiet music bed** under the full narration track. Music must:
- Start from frame 0
- Run through to the final frame
- Sit at 30–35% volume under narration (so voice remains clearly audible)
- Be consistent in mood — documentary-serious or hopeful-acoustic, not corporate upbeat
- Source: `assets/music/track.mp3` already exists in the project — sound-designer must audit it and confirm it fits the vibe, or flag if a replacement is needed
- `assets/music/track-faded.mp3` also exists — check both

### 4. No color grading (v1 failure)
v1 applied `filter: grayscale(0.6) sepia(0.18)` on each stock photo/video inline, inconsistently. v2 needs a **single, unified grade**:
- One global CSS class `.grade` applied to all photographic material
- Grade target: `grayscale(0.45) sepia(0.22) contrast(1.08) brightness(0.88)` — or whatever the colorist specifies — but it must be **identical** on every image and video element
- Plus a global overlay layer (semi-transparent navy-to-paper gradient) that tints the whole frame consistently
- Colorist must produce `plans/claim-mate-v2/grade.md` specifying the exact filter string and any overlay values

---

## Scene structure (director's starting point — adapt with judgment)

5–6 scenes, 2–3 shots each, ~27s total. The user's "5–7 scenes with 2–3 shots each = 12–20 clips" target.

Suggested arc (screenwriter can revise within this arc):
1. **Hook (0–4s):** "ACC said no." — tension, the paper, the decline
2. **Reframe (4–8s):** "A decline isn't the end." — shift, possibility
3. **Process (8–16s):** "Here's how it works." — 4 steps, mostly us, fast
4. **Cost (16–20s):** "You pay zero." — clarity, the ledger, no surprises
5. **CTA (20–27s):** "Claim Mate. Start today." — wordmark, URL, quiet confidence

The screenwriter should adjust scene lengths against the actual VTT once TTS is generated. VTT timing is the master clock — never guess.

---

## Asset budget

- TTS chunks: 1 (full narration track, en-NZ voice, Molly Neural or equivalent)
- Photos: 3–4 (from Pixabay or existing `assets/photos/` — `denied-letter.jpg` and `workspace.jpg` exist and can reuse)
- Videos: 2–3 (existing `bg-motion.mp4` and `working.mp4` in `assets/videos/` — pre-encode for sparse keyframes per LEARNINGS §4)
- Icons: 5–8 Lucide (existing `assets/icons/lucide/` — check what exists before fetching new)
- Music: 1 track (audit `assets/music/track.mp3` first — if unsuitable flag to producer before fetching)
- SFX: none (music bed + narration only)
- Brand SVGs to reuse: `assets/svg-animations/brand/claim-mate-paper-tick.svg` — may appear as a supporting graphic in hook scene, not as primary logotype

---

## Time budget

- Wall-time target: 8–12 minutes (27s × more complex than v1 = ~2× v1's 5 min)
- Workers: 4

---

## Quota check

No `usage.mjs report` output available (command returned empty). Assume clean slate. No service is near limit. Pixabay scrapes: plan for 4–6 fetches max (well under 20/min and 200/hr). Edge TTS: 1 chunk (well under 2000/day). Music: use existing files first — fetch only if both existing tracks are confirmed unsuitable.

---

## Inviolable rules (crew must embed in all work)

1. **Zero invented facts.** Every word of narration must be checkable against `/c/Users/wirihere/claim-mate/landing-page/index.html`. If a line cannot be sourced there, cut it.
2. **No te reo Māori in TTS narration.** English equivalents only. "New Zealand" not "Aotearoa". On-screen text may use te reo if brand calls for it — but this brand doesn't.
3. **Brand verified against canonical source.** Wordmark: `CLAIM/MATE` uppercase, JetBrains Mono 700, navy slash. Not lowercase. Not the cadastral SVG as a primary logo.
4. **Lint must be 0/0 before render.** Non-negotiable. Composition-doctor does not render until lint is clean.
5. **FFmpeg PATH exported before render.** `export PATH="/c/Users/wirihere/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"` — see LEARNINGS §2.

---

## Stage gates

| Gate | Owner | Output | Producer signs off when |
| --- | --- | --- | --- |
| Script lock | screenwriter | `plans/claim-mate-v2/script.md` | beats are tight, narration sources to canonical page, no invented facts, fits 25–30s, no te reo in TTS lines |
| Shot lock | cinematographer | `plans/claim-mate-v2/shotlist.md` | every scene has 2–3 shots, every shot has a named camera move, moves are motivated by scene emotion |
| Grade lock | colorist | `plans/claim-mate-v2/grade.md` | single unified filter string for all photographic material, overlay layer defined, notes on per-asset application |
| Sound lock | sound-designer | `plans/claim-mate-v2/sounds.md` | music track confirmed (file path + duration + BPM if known), volume levels set, fade-in/fade-out cued |
| Cut lock | editor | `plans/claim-mate-v2/cutlist.md` | timeline adds to 25–30s, every shot has start+duration anchored to VTT, music hit points noted |
| Asset lock | asset-hunter + animation-curator | files in assets/ | all referenced assets exist on disk, credits noted, videos pre-encoded for sparse keyframes |
| Composition lock | html-composer + motion-designer | `index.html` | structure matches cutlist, camera moves in GSAP, grade applied consistently, lint 0/0 |
| Final cut | composition-doctor | `renders/<file>.mp4` | render succeeds, file exists at expected size, lint was 0/0 |
| Post-mortem | improvement-scribe | `LEARNINGS.md §6` entry | lessons captured |

Script + Shot + Grade + Sound can be submitted together as a bundle — producer will sign off the bundle in one pass.

---

## Constraints honoured

- Verified facts only — sourced from `/c/Users/wirihere/claim-mate/landing-page/index.html`
- No te reo in TTS
- Brand wordmark verified against canonical source
- Lint 0/0 before render
- FFmpeg PATH workaround documented and required
- Music bed under narration at 30–35% volume

---

## Risks and unknowns

1. **Music bed quality.** Existing `assets/music/track.mp3` may not fit a documentary-cinematic vibe — it was originally sourced for a different mood. Sound-designer must audit both tracks before building the composition. If neither works, producer authorises fetching one new track from Pixabay (manual download) — flag to producer before proceeding.

2. **Stock video sparse keyframes.** Both existing videos (`bg-motion.mp4`, `working.mp4`) triggered sparse-keyframe warnings in v1. Pre-encode both before compositing: `ffmpeg -i in.mp4 -c:v libx264 -r 30 -g 30 -keyint_min 30 -movflags +faststart -c:a copy out-encoded.mp4`

3. **Shot count vs render time.** 12–20 shots × camera moves = more GSAP tweens than v1. Render time may push toward 10–15 minutes. Workers=4 should hold. If render fails mid-way, check Chrome memory limits and reduce concurrent workers to 2.

4. **Composition complexity vs lint.** More shots means more `data-start/data-duration/data-track-index` attributes. Higher risk of a missing attribute or duplicate-media warning. The html-composer must run lint after each scene is written, not just at the end.

5. **Scene 4 / steps — 4 steps in 8s is tight.** v1 used 3 steps in 5s. The landing page has 4 steps. If 4 steps in 8s feels rushed, screenwriter should reduce to the 3 most visual steps and confirm with producer before TTS is generated.
