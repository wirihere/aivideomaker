> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Session handoff — 2026-04-26 (late, post-PROCESS-rewrite)

> **Read this first if you're a fresh Claude Code session resuming work on this project.** Then read `docs/PROCESS.md` and `~/.claude/projects/<this-project>/memory/MEMORY.md` (18 user-preference rules).

---

## Where we are right now

**Project state:** mid-iteration on **faq-quick-30s** template. Goal: make it model-quality, then port the same depth to the other 7 templates per `docs/PROCESS.md`'s loop-until-perfect cycle.

**Test brand:** kindred-nz.org (warm-community tone). All other tones (energetic, documentary, sensory) untested at the new quality bar.

**Workflow rule:** silent internal iteration → user check → render → user approve → tag as model → next template. Do not ping the user per intermediate fix.

---

## Active work (in flight / just-shipped this session)

### Shipped, committed
- `a2c6e86` — Motion-saturate faq-quick (kenBurns hero, parallax, cascade, glow, signalPulse, glitter, audio-reactive pulse, decorative drifters)
- `6f54b1e` — Track-collision fix (decorative drifters onto separate track indices)
- `0ded8fd` — Continuous within-scene motion (every element drifts/breathes/rotates over full scene duration)
- `bbc20b4` — Motion-continuity verifier check (catches PowerPoint failure pre-render)
- `d2a3074` — PROCESS.md canonical workflow + old standing directives marked superseded
- `5c914da` — Tone-aware framework picker + Stage 2 calls extract-copy in framework mode (when ANTHROPIC_API_KEY set)
- `c8819c5` — extract-copy `--url=` reads full Playwright deep scrape into framework prompt
- `ffcc93f` — `scripts/lib/scrape-page.mjs` Playwright deep scraper

### Just-shipped at session end
- ✅ **Script-timing verifier check** — `5e7d084` (verifier code) + `c3511a4` (SUGGESTIONS.md). Six new finding types in `findings.scriptTiming`: script-density-imbalance, scene-narration-mismatch, silence-beat-misplaced, narration-overrun-into-cta (error), word-emphasis-orphan, script-fits-budget. Verifier runtime now 9.5s.
- **REAL FINDINGS on the current kindred-nz assembled comp** that the silent loop must address:
  - **narration-overrun-into-cta (ERROR):** narration ends at 29.60s but CTA scene s5 starts at 28.00s → 1.60s overrun. Three options to fix: (a) trim narration to end before 28s, (b) start narration later, (c) move s5 to start at 30s (not viable — CTA needs viewing time). Best: trim narration. Check `compositions/kindred-nz.copy.json` narration field — currently 71 words at -10% rate, runs to 29.6s. Aim for ≤27.5s = ~65 words.
  - **word-emphasis-orphan (WARN):** identity token "local" at 6.13s in s2 lands in mid-scene quiet. Either move "local" later in the script so it lands at a stamp/burst event, OR add a stamp/burst at t=6.0-6.3 in scene 2.

### Pending on user clarification
- **Color palette flow** — user requested but ambiguous. Two interpretations:
  - **A:** templates should have visible color motion across scenes (background gradient drifts BETWEEN scenes, foreground hue subtly shifts, palette-color transitions at scene cuts)
  - **B:** verifier check that brand palette is continuously visible throughout the timeline, not just at scene 1+5
  - Likely both. Ask the user which to prioritise, or just do both.
- **Narration critique** — user requested as a check. Different from script-timing (mechanical) — this is qualitative:
  - Does the script tell a story or list features? (anti-feature-list)
  - Does it sound like the brand's actual voice or like an ad agency? (anti-cliche, anti-corporate-speak)
  - Hook quality — does the first sentence grab the listener?
  - Energy curve — does the script build, flatline, or trail off?
  - Concreteness — specific moments + actions + people, not abstract claims
  - CTA strength — clear, verb-first, earned by the previous 25 seconds
  - Brand-fact fidelity — every claim traces to a sentence on the brand's page (no invented facts; this rule already exists in memory but the verifier doesn't check)
  - Approach: rule-based heuristics where possible (cliche list, concreteness metric via word-class tagging, sentence variety). LLM-eval mode for the qualitative judgments when ANTHROPIC_API_KEY (or claude-agent-sdk) is available. Output: per-axis score + worst-offending sentence flagged.
  - Sequence with script-timing; both touch `scripts/verify-render.mjs` so do them sequentially not in parallel.

---

## Silent loop fix list (work to do BEFORE pinging the user for faq-quick review)

1. **17 near-static motion findings** flagged by the new motion-continuity verifier on the current assembled kindred-nz comp. Specifically scenes 2-4 have ~1% byte-change between adjacent 0.5s frames — visible motion to the eye, but below the 2% byte-diff threshold. Investigate whether to:
   - (a) Tighten template motion further (more amplitude on continuous tweens) so byte-change clears 2%
   - (b) Loosen the threshold to 1.5% (motion IS happening; threshold is calibration-sensitive)
   - Pick whichever produces a verifier `ship` verdict + still feels right visually.
2. **CTA verb concat** — assembled output reads `Visit Share with neighbours. Find local help.` The s5-cta swap concatenates `verb + " " + tagline`. Should be either tagline alone OR verb on a separate line above the URL. Fix in `scripts/video.mjs:applyCopyToTemplate()` near the s5-cta rule.
3. **Scene 2 hero crop framing** — current crop shows partial UI text that competes with body copy. The `.s2-hero-crop` element has `object-position: 50% 18%` — try `50% 0%` to bias to the device chrome / app bar, or rethink the crop entirely.
4. **Numerals "01"/"02"/"03" palette pop** — currently sky-blue `var(--card-accent)` against cream. Reads weak. Try honey-on-navy or navy-on-honey for stronger contrast. Test by editing `.qa-num` color in `compositions/templates/faq-quick-30s.html`.
5. **Pre-existing visible-text scrub bug on preview env** — verifier reported `brand-name-missing` because pixel screenshots through the hyperframes-preview shell render only navy bg + raw source-as-text. Smoke screenshots show the same issue. The motion-continuity agent worked around by using `file://` for screenshots. The DOM-based brand-name check should be fixed for the preview path — investigate `scripts/verify-render.mjs:guessSlugFromIndex` and the visible-text capture flow.
6. **Color palette flow** — once the user clarifies A vs B vs both.
7. **Script-timing findings** — once the in-flight agent lands. Iterate on whatever findings fire.
8. **Narration critique check** — build the verifier extension per the spec in "Pending on user clarification" above. Sequence after script-timing lands (same file).

---

## When the silent loop is clean → user checkpoint

1. Extract a frame strip at t=2/5/10/15/20/25/28 from a Playwright preview scrub (no render needed).
2. Surface to user: `<frames inline> + one-paragraph "what's different vs last review"`.
3. User decides: render now / more work / pivot.
4. ONLY render after user approves the pre-render review.

## On render-approve

1. `git tag faq-quick-v1` on the current commit.
2. Add entry to `docs/template-models.md` (create the doc if it doesn't exist):
   - Template name + commit hash
   - Date locked
   - Brands validated against (currently just kindred-nz; add others as we test)
3. Capture findings to `LEARNINGS.md §8` and `docs/render-learnings/SUGGESTIONS.md`. Promote any recurring issues to lint detectors or verifier checks.
4. Validate generalization: re-render with 2-3 OTHER warm-community brands. Confirm verdict + visually OK.
5. Move to the next template. Suggested order: testimonial-45s (also warm-community, biggest reuse), then hero-promo-30s (energetic), then case-study-60s (documentary), etc.

---

## Important context for the next session

### Process / principles (these are now durable)
- **Quality > speed.** 7-minute renders are fine. 30 iterations on the same template are fine.
- **Sequential improvement.** Each render must be measurably better than the last. Each commit must improve the system's quality ceiling. No regressions.
- **Templates amortize.** Build perfect once, plug in any brand.
- **Loop-until-perfect.** Silent internal iteration; surface only when ready for review.
- **Lock as model.** Tagged commits + entry in template-models index = "we'd ship this template for any brand of this tone."

### Stack pieces that are load-bearing for the loop
- **Verifier** (`scripts/verify-render.mjs`) — 11 check categories: composition, brand-fidelity, placeholder-leakage, pacing, audio-coverage, accessibility, brand-palette-use, brand-asset-use, scene-visual-density, motion-continuity, script-timing (when the in-flight agent lands).
- **Tone-driven picker** (`scripts/video.mjs:pickFramework + pickTone`) — kindred → warm → faq-quick → BAB framework → warm-community music
- **Audio dynamics** — fade in/out, narration duck, CTA swell (offline-baked envelope per render via `bakeMusicEnvelope`)
- **Multi-aspect rendering** — `--aspects=` flag, default 9:16 only (per user preference). Other aspects on opt-in.
- **Hand-crafted copy.json preservation** — orchestrator's Stage 2 respects existing copy.json with narration + beat headlines. Unlocks manual-curation.

### Stack pieces that are reference data (use, don't regenerate unless brands change)
- `docs/brand-fingerprints.json` — 12 brands with palette/tone/photo-style
- `docs/music-template-alignment.md` + `assets/music/alignment.json` — per-template ranked tracks
- `combos/candidates/` — 30 generated effect-combo candidates (curated top 5: reveal-bokeh-pull, emphasis-shockwave, close-confetti-rain, mix-shimmer-stamp, cut-z-snap)
- `combos/brand-fit/kindred-nz.md` — 16 combos × kindred fit scoring (top 5 warm: signalPulse, testimonialReveal, paperTear, superImpact, cinematicReveal)

---

## Known issues / deferred bugs

- `npm run render --watermark` fails with exit 1 silently. Direct `npm run render` (no watermark) works. The orchestrator's Stage 8 also fails when --watermark is on. **Workaround:** render without watermark for now. Investigate ffmpeg drawtext font-path.
- `renders:list` smoke test times out at 2s when renders/ has many MP4s. Workaround: `npm run renders:prune` periodically.
- ANTHROPIC_API_KEY required for framework mode (see commit `5c914da`). Should ideally use `@anthropic-ai/claude-agent-sdk` to inherit Claude Code auth (memory note in feedback_visual_fidelity.md). Deferred.
- `compositions/baseline-stripe/`, `baseline-test/`, `kindred-nz-override/`, `kindred-nz-tone/`, `linear-test/`, `stripe-tone/`, `kindred-showcase-2026-04-26.html` — exploratory test artifacts from early-session waves. User can delete or leave.

---

## Memory rules added this session (for cold-read awareness)

The new ones (in user memory under `~/.claude/projects/<this-project>/memory/`):
- `feedback_visual_fidelity.md` — verifier "watch" verdict can ship a video that doesn't LOOK like the brand
- `feedback_motion_speed.md` — fast continuous motion or it reads as PowerPoint
- `feedback_sequential_improvement.md` — every render beats the previous; quality > speed
- `feedback_template_amortization.md` — unbounded effort on templates; brand data is the easy plug-in
- `feedback_iteration_workflow.md` — loop-until-perfect, then user check, then render, then store as model

Read `MEMORY.md` for the index of all 18 rules.
