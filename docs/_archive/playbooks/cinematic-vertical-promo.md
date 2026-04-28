> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Playbook — Cinematic Vertical Promo (25–30s, 1080×1920)

**Last proven:** 2026-04-24, Claim Mate v2 — 15 shots, 27s, 8.1 MB, lint 0/0, ~40 min start-to-render with wave parallelisation.

Use this for any documentary-cinematic vertical promo with narration + music bed + stock footage + brand wordmark. Not for: talking-head videos, landscape format, >60s long-form, pure motion-graphics.

---

## 1. The 4-wave pipeline (why this beats sequential)

Running all 11 planning/production agents sequentially takes ~50 min of agent wall-time. Running them in waves where dependencies allow takes ~25 min. That's the win.

```
Wave 0 — Producer brief           (one-time, ~10 min) ──┐
Wave 1 — Screenwriter              (~1–2 min)           │
Wave 2 — Cinematographer + Narrator (parallel, ~3 min)  │
Wave 3 — Colorist + Sound + Curator (parallel, ~2 min)  │  Sequential between waves;
Wave 4 — Editor + Music + Assets   (parallel, ~4 min)   │  parallel within each wave.
Wave 5 — HTML composer             (~5 min)             │
Wave 6 — Motion designer           (~3 min)             │
Wave 7 — Composition doctor + render (~10 min)         ──┘
```

**Total: ~38 min to rendered MP4.** Adjust upward for the first build on a new brand (~+10 min for brand verification) or a new crew member needing heavier context.

### Dependency rules (why waves split where they do)

| Agent | Reads | Writes |
|---|---|---|
| Producer | brand pages, LEARNINGS | `plans/<slug>/brief.md` |
| Screenwriter | brief | `plans/<slug>/script.md` |
| Cinematographer | brief + script | `plans/<slug>/shotlist.md` |
| Narrator | script | `assets/voiceover/<slug>.mp3` + `.vtt` |
| Colorist | brief + script + shotlist | `plans/<slug>/grade.md` |
| Sound-designer | brief + script + shotlist | `plans/<slug>/sounds.md` |
| Animation-curator | brief + shotlist | `plans/<slug>/animations.md` |
| Editor | all planning + VTT | `plans/<slug>/cutlist.md` |
| Music-supervisor | sounds brief | `assets/music/<slug>-bed.mp3` |
| Asset-hunter | shotlist + grade | `plans/<slug>/assets.md` + files in `assets/` |
| HTML-composer | all above | `index.html` |
| Motion-designer | index.html + cutlist | GSAP block in `index.html` |
| Composition-doctor | index.html | `renders/*.mp4` |

Cinematographer + Narrator can run parallel because both only need script. Colorist + Sound + Curator all need shotlist but don't depend on each other. Editor needs grade + sound + VTT so it waits. Music-supervisor + Asset-hunter don't depend on each other, and Editor doesn't need them — they run with Editor.

---

## 2. Proven wall-times (actual data, not guesses)

| Agent | Claim Mate v2 | Use for estimates |
|---|---|---|
| Screenwriter | 80s | 2 min |
| Cinematographer | 3 min 10s | 3 min |
| Narrator (Edge TTS, en-NZ) | 27s | 1 min |
| Colorist | 2 min | 2 min |
| Sound-designer (audit+brief) | 2 min | 2 min |
| Animation-curator | 1 min 22s | 2 min |
| Editor (with VTT re-anchoring) | 3 min 45s | 4 min |
| Music-supervisor (Pixabay scrape) | 1 min 6s | 2 min |
| Asset-hunter (1 fetch + 2 re-encode) | 2 min 7s | 3 min |
| HTML-composer (950 lines) | 5 min 15s | 5 min |
| Motion-designer (30 tweens) | 2 min 3s | 3 min |
| Composition-doctor (lint + render) | ~10 min | 10 min |

**Never estimate higher than these unless the scope is genuinely larger.** Default to the proven numbers — agents that routinely overshoot these are scope-creeping.

---

## 3. Rendering — worker strategy (critical time sink)

Render is the slowest single step. Tune it.

### Machine profile (update per machine)

- **wirihere dev box:** Intel i7-8700 (6c/12t), 16 GB RAM, Intel UHD 630 with QSV (no NVIDIA).

### Worker presets

| Composition weight | First try | Fallback | Rationale |
|---|---|---|---|
| Light (≤8 shots, 0–1 videos, <20 tweens) | `-w 4` | `-w 2` | Proven at Claim Mate v1 in 5 min |
| Medium (9–14 shots, 1 video, ken-burns per scene) | `-w 2 --gpu` | `-w 1` | **UPDATED 2026-04-24** — Claim Mate v3 (11 clips, 1 video, 30+ tweens) crashed at w=4, succeeded at w=2 in 12:42. Ken-burns per scene multiplies memory pressure. Default to w=2 whenever >10 clips + a video. |
| Heavy (15+ shots, 2+ videos, parallax) | `-w 2 --gpu` | `-w 1` | v2 crashed at w=4, succeeded at w=2 (8:25). v3 confirmed. |

### GPU encoding

`--gpu` uses Intel QSV on this machine. Saves ~30–60s on the FFmpeg encode stage. Always use it unless testing determinism.

### Benchmark command (run once per machine)

```bash
npx hyperframes benchmark --runs 3
```

Runs multiple configs, reports best. ~15–20 min one-time cost. Save the result to this playbook under "Machine profile."

### Failure signature: `Page.captureScreenshot` protocol error

Means: Chrome worker ran out of memory or crashed mid-capture. Dropping workers by 1 usually fixes it. Don't chase with browser flags.

---

## 4. Inviolable rules (bake into every brief)

These are copy-paste into every producer brief:

1. **Zero invented facts.** Every narration line traces to the canonical brand page. If you can't cite it, cut it.
2. **No te reo Māori in TTS.** Edge TTS mispronounces. "New Zealand" not "Aotearoa." On-screen te reo is fine if the brand uses it.
3. **Lint must be 0/0 before render.** Non-negotiable. `duplicate_media_discovery_risk` on CSS `background-image` reuse is a known false-positive — safe to ignore with a note.
4. **FFmpeg PATH export on Windows.** Gyan winget install is not on PATH by default:
   ```
   export PATH="/c/Users/wirihere/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
   ```
5. **Videos MUST be re-encoded with dense keyframes** before composition. `-g 30 -keyint_min 30`. Sparse keyframes cause render-time warnings and frame-skip artefacts.
6. **`.grade` filter as a single CSS class** applied to `<img>` and `<video>` directly. Never on wrapping divs (creates stacking context, clips text).
7. **Deterministic only.** No `Math.random()`, no `Date.now()`, no network fetches in the composition.

---

## 5. Reusable patterns (the cinematic-specific ones)

### VTT-as-master-clock

Screenwriter estimates beat durations, but TTS actual timings will differ by 0.5–1.5s. Editor reads the VTT file (word-level timestamps) and re-anchors every `data-start` to actual word boundaries. Do not skip this — cuts mid-word are the #1 tell of amateur editing.

### Camera-move vocabulary (every shot gets one — no static frames)

| Move | CSS/GSAP recipe | Use for |
|---|---|---|
| Ken Burns push | `scale: 1.0 → 1.06` linear | Still frames, hook beats |
| Pull-back reveal | `scale: 1.08 → 1.0` + `opacity 0→1` power2.out | Key statements, CTA arrivals |
| Parallax | Siblings at different rates (fg 2–4%, bg 1%) | Dual-layer text-over-image |
| Slow drift | `x/y: 0 → ±2-4%` linear | Stock video clips |
| Smash zoom settle | `scale 1.2 → 1.0` 0.25s + hold | Emphatic arrivals ($0, checkmark) |
| Breathe float | `y: 0 → -6px` yoyo repeat:1 | Silent card holds |

### Entrance + exit vocabulary (overlays — every non-final overlay gets both)

Entrances: snappy. Durations **0.28–0.40s**, not 0.5+. Use hard eases: `expo.out`, `back.out(1.6)`, `back.out(2.2)` for overshoot-settle, `power4.out` for fast-glide. Avoid `power2.out` on overlays — it feels slow against a 27s promo.

Exits: **every overlay that is not the final scene MUST have an explicit exit tween**, firing ~0.35s before its clip's `data-duration` ends. Clip visibility toggling alone looks like a pop. Vary the direction across a sequence so the same element doesn't exit the same way twice in a row.

| Exit | GSAP recipe | Use for |
|---|---|---|
| Slide right | `x: 120, opacity: 0, 0.32s, power3.in` | First in a sequence (step-01) |
| Lift up | `y: -120, opacity: 0, 0.32s, power3.in` | "Dismissed / completed" feel (step-02) |
| Fall down | `y: 120, opacity: 0, 0.32s, power3.in` | "Banked / filed away" (step-03) |
| Slide left | `x: -120, opacity: 0, 0.32s, power3.in` | Closing chapter (step-04) |
| Collapse center | `scale: 0.72, y: -30, opacity: 0, 0.32s, power3.in` | Punchline landing (ledger) |
| Crumple rotate | `y: 60, x: 40, scale: 0.7, rotation: -18, opacity: 0, 0.35s, power3.in` | Rejection / failure (DECLINED stamp) |

**Rule:** the only overlay without an exit is the final scene (wordmark CTA). That one rides the global vignette + overlay-darken fade-out instead.

### Persistent brand mark (always-on corner element)

A small wordmark in the top-right (or top-left) corner, visible through scenes 1 → N-1, fading out just before the big end-card CTA. Provides brand continuity without competing with the main overlays.

Recipe:
```css
.brand-mark {
  position: absolute;
  top: 56px;
  right: 60px;
  z-index: 1200;          /* above global-overlay + vignette */
  padding: 14px 24px;
  background: rgba(13, 24, 38, 0.55);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(238, 241, 245, 0.20);
  border-radius: 14px;
  font-family: "JetBrains Mono", monospace;
  font-size: 64px;        /* ~1/3 the size of the end-card CTA */
  color: #eef1f5;
  opacity: 0;
}
```
```js
tl.fromTo(".brand-mark", { x: 16, opacity: 0 }, { x: 0, opacity: 0.92, duration: 0.45, ease: "power3.out" }, 0.6);
tl.to(".brand-mark",     { x: 16, opacity: 0, duration: 0.35, ease: "power3.in" }, wordmarkStartTime - 0.4);
```

**Rules:**
- Not a timed clip — a plain `<div>` inside the root composition root, sibling to `.global-overlay` and `.vignette`.
- Opacity 0.85–0.95, never a full 1.0 (that would make it shout over the main content).
- Size: roughly 1/3 the font size of the end-card CTA mark. If CTA is 190px, corner mark is 64–72px.
- Must fade OUT before the end-card CTA fades IN. The end-card is the climax; the corner mark yields to it.
- A backdrop-blur pill behind the text keeps it legible over busy backgrounds.

### Unified color grade

ONE filter string applied as `.grade` class. Don't vary per shot. Per-scene mood shifts are carried by separate overlay divs (vignette, wash, lower-third-darken), never by changing the filter.

Starting point that works: `grayscale(0.45) sepia(0.22) contrast(1.08) brightness(0.88)` + navy-top overlay `linear-gradient(180deg, rgba(31,58,104,0.07) 0%, rgba(238,241,245,0) 55%)` at `mix-blend-mode: multiply`.

### Music bed discipline

- Continuous from frame 0 to end — no gaps
- Fixed volume 0.30–0.35 (never duck)
- Fade-out over final 2s
- Acoustic piano 60–80 BPM for documentary tone
- **Existing tracks** in `assets/music/` are rarely right for a new brand — audit honestly, don't force a reuse

### Shot count budgeting

For a 27s vertical promo: 14–17 shots total. Under 12 feels like a slideshow. Over 20 overloads render + lint. 2–3 shots per narrated beat is the sweet spot.

### Parallax technical note (HTML-composer must plan for this)

Two sibling `<div>` elements inside one `.clip` wrapper, each receiving independent GSAP tweens. NOT nested. If the bg has overflow bleed (`inset: -4% -4%`), animate `x` in pixels not percent to stay in sync.

### Cards design system (v3.1 — primary pattern for overlay blocks)

The cards library at `compositions/cards/` + `design/cards.css` is the **default pattern** for every typographic overlay block. Read `compositions/cards/README.md` for the full catalog.

- **CSS-only mode:** import `design/cards.css` into your root, compose inline with utility classes. Best for uniqueness-per-instance.
- **Sub-composition mode:** `data-composition-src="compositions/cards/<type>.html"` + `data-variable-values='{...}'`. Best for high-reuse, low-variation content.
- **Token-first:** every card reads from CSS custom properties (`--card-r-*`, `--card-p-*`, `--card-navy`, etc.). Override tokens in your root to rebrand without touching card internals.
- **Content slots:** `.card__kicker`, `.card__title`, `.card__body`, `.card__figure`, `.card__label`, `.card__rule`, `.card__icon`. Same slots work across layouts.
- **Surface × layout × size × padding × radius** combine freely — one card class + modifiers.
- **Image underlay pattern:** `card--image-underlay` has `.card__bg` (image) + `.card__bg-scrim` (darkening gradient) + text at z-index 2. Use when a photo should live **inside** a card instead of filling the canvas.
- **SVG icon slot:** `.card__icon` accepts any animated SVG from `assets/svg-animations/` — the SMIL plays automatically. See "SVG animation usage" below.

### Component-based composition (v3 architecture)

The root `index.html` should be **thin** — it composes from reusable sub-compositions, not 1000+ lines of bespoke HTML.

- **Component library:** see `compositions/README.md` for the catalog. Cards (primary, see above), backgrounds (ken-burns, crossfade-two, video-bg), overlays (declined-stamp, word-reveal — legacy, being migrated to cards).
- **Instantiation:** each scene is `<div data-composition-src="..." data-start=... data-duration=... data-track-index=... class="clip" data-variable-values='{...}'></div>`.
- **Target root length:** 150–250 lines for sub-comp composed; up to 500 lines for inline.
- **When to build a new card vs inline:** if you'd use the pattern more than once across projects, add to `compositions/cards/`. One-off elements stay inline in the root.
- **When to inline instead of sub-comp:** multi-instance (same card appearing 4+ times in one promo). Sub-comp instances share `window.__timelines[id]` so only one set of tweens runs. Inline is correct for step-badge ×4, ken-burns ×4, etc.

### SVG animation usage (lean on the library before authoring motion)

`assets/svg-animations/` has 140+ self-contained SMIL animations across 32 categories. When an overlay needs an "icon that does something," reach for these first — they play their own timeline when shown via `<img>`, no GSAP needed.

**Most useful categories for explainer/promo content:**

| Category | Highlights | Typical slot |
|---|---|---|
| `brand/` | `claim-mate-paper-tick.svg`, `consent-mate-paper-tick.svg` | Hero moment, end card |
| `status/` | check-success, cross-error, warning-triangle, loading-to-success | Outcome beats |
| `time/` | clock-tick, calendar-flip, hourglass, countdown-321 | "X days" moments |
| `money/` | coin-spin, money-stack, price-tag, card-tap | Cost / transaction beats |
| `flow/` | stepper-3, funnel-fill, network-nodes | How-it-works sequences |
| `arrows/` | arrow-trend-up/down, arrow-right-bounce, arrow-rotate-refresh | Direction, progress |
| `notifications/` | bell-ring, badge-pop, notification-toast | Alert beats |
| `text-fx/` | highlight-marker, underline-draw, typewriter | Text emphasis |
| `transitions/` | iris-open, iris-close, split-doors | Between-scene transitions |

Use them as `.card__icon` content in feature-row cards, as hero SVGs between scenes, or as text-fx decorators.

**Gaps — SVGs we should commission** (see `compositions/cards/README.md` for the full list): `approval-stamp`, `paper-plane-send`, `document-scan`, `signature-sign`, `folder-file`, `calendar-mark`, `growth-bar`, `handshake`, `paper-crumple`, `shield-check`.

### Asset fetching — parallel manifest

Use `scripts/fetch-assets.mjs` with a JSON manifest instead of calling fetch scripts one-by-one. All photos + videos + music + TTS fire in parallel. See `plans/_templates/fetch-manifest-example.json` for the manifest shape.

```bash
node scripts/fetch-assets.mjs plans/<slug>/manifest.json
```

Skips items whose output file already exists (pass `--force` to refetch). Typical wall-time: 20–40s for a full set of 3 photos + 1 video + 1 music + 1 TTS running concurrently (vs ~2–3 min serial).

### Render-time frame verification (non-negotiable)

**Lint passing ≠ composition working.** v2 rendered with 0/0 lint errors and was broken — `<video>` element bled through every scene because clip visibility toggling doesn't occlude video the way divs do. We only caught it after the user asked where the video was. This check is now a stage gate.

---

## 6. Stage-gate checklist (producer signs off each)

Copy into each project's `plans/<slug>/approvals.md`:

- [ ] **Script lock** — narration sources to canonical page, no invented facts, fits target duration, no te reo in TTS
- [ ] **Shot lock** — every scene has 2–3 shots, every shot has a named camera move
- [ ] **Grade lock** — single filter string, overlay defined, which elements get it specified
- [ ] **Sound lock** — music track confirmed, volume levels set, fade cued
- [ ] **Cut lock** — timeline adds to target ±0.5s, VTT-anchored, music hits noted
- [ ] **Asset lock** — all files on disk, videos re-encoded, credits recorded
- [ ] **Composition lock** — lint 0 errors, structure matches cutlist
- [ ] **Motion lock** — GSAP tweens in place, target elements verified
- [ ] **Frame-verified** — extracted ≥8 frames from the rendered MP4 and LOOKED AT THEM. Text readable, no blank frames, no leaked debug content, backgrounds not bleeding across cuts. (v2 post-mortem: lint passed but working.mp4 bled under every shot — we called it done without watching output.)
- [ ] **Final cut** — MP4 rendered, file size reasonable, duration exact
- [ ] **Post-mortem** — LEARNINGS updated, playbook updated if patterns changed

### Frame-verification command

```bash
export PATH="/c/Users/wirihere/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
mkdir -p debug/frames
for t in 0.5 2.5 4.5 6.5 9 12 15 18 21 24 26.5; do
  ffmpeg -ss $t -i renders/<latest>.mp4 -frames:v 1 -q:v 2 debug/frames/frame-${t}.png -y -loglevel error
done
```

Then use Read on each PNG and actually look at it. Don't just confirm the file exists.

---

## 7. When to deviate

This playbook is for 25–30s documentary-cinematic vertical promos. Deviate when:

- **Length >45s:** add a second narration chunk; re-estimate wave times
- **Talking-head video:** skip color grade unification (person stays natural); still unify on B-roll
- **Pure motion-graphics (no stock):** skip asset-hunter, animation-curator becomes central
- **Landscape:** swap the 1080×1920 target, revise camera-move recipes (horizontal parallax becomes primary)
- **New brand with no landing page:** producer must gate harder on verified facts — no facts = no narration

---

## 8. Agent prompt templates

See `plans/_templates/` for drop-in prompt templates per agent that reference this playbook.
