> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# System Audit Roadmap — 2026-04-27

Synthesis of 12 parallel deep-research agent reports.
Each row links the originating report and the session chip filed to action it.

---

## Top 5 highest-leverage actions

Ranked by (estimated benefit) ÷ (estimated effort). These move the system the most.

| # | Action | Source | Chip | Effort | Why it's #1-5 |
|---|---|---|---|---|---|
| **1** | Enable NVENC GPU encoding (one-line preset name fix) | [01-render-performance](01-render-performance.md) | NVENC chip | 1-2 h | Bundled ffmpeg already supports it. Previous failure was passing libx264 preset name `slow` to nvenc which expects `p1`-`p7`. Likely 4-10× render speedup. |
| **2** | Bot-wall detector in scrape-page.mjs | [03-brand-extract](03-brand-extract.md) | Brand-extract chip | 30 min | 3 of 5 premium brands silently fail extraction (Cloudflare 403). Pipeline currently writes videos *about the captcha page*. Critical fix, trivial scope. |
| **3** | Verifier register-aware thresholds via `data-register` | [05-verifier](05-verifier.md) | Verifier chip (filed earlier) | ~50 LOC | 67% of all 58 ledger runs land at "needs-fix". Sacred-oracle: 6/6 needs-fix, all false-positives. ~70% FP elimination in ~50 LOC. |
| **4** | Wire sacred-oracle into orchestrator pipeline | [06-library-coverage](06-library-coverage.md) | Orchestrator chip (filed earlier) | ~3 h | Family is currently unreachable from `pickTemplate`. The 4 new templates and the music shortlist exist but no URL → tone → register → template path lights up. |
| **5** | Extract `cards-warm-community.css` register module | [07-css-architecture](07-css-architecture.md) | CSS cleanup chip | ~2 h | ~3000 lines de-duplicatable across 21 warm-community comps. Same pattern that just shipped 95-line `cards-sacred-oracle.css` saving 153 lines across 5 comps — proven, lift-and-shift. |

---

## Confirmed bugs already fixed inline this session

| Bug | Source | Fix |
|---|---|---|
| `compositions/templates/before-after-30s.html` doesn't exist (registry mismatch) | 06-library-coverage | Updated `scripts/video.mjs:172` to `before-after-20s.html` + `seconds: 20` |
| `.scene { height: 0 }` silent layout collapse on the 4 new templates | (Round 1 agent flagged it) | Added `.scene { position: absolute; inset: 0; }` to `cards-sacred-oracle.css` |
| `audio_src_not_found: PLACEHOLDER.mp3` lint error (cross-comp aggregation) | (mid-build) | Created 1s silent stub at `assets/voiceover/PLACEHOLDER.mp3` |

---

## Wave-2 chips filed this session (one per audit area)

| # | Chip title | What it actions | Source |
|---|---|---|---|
| 1 | Enable NVENC GPU encoding | One-line preset fix, measure speedup | 01-render-performance |
| 2 | Track-index manifest + write-time lint detector | Single source of truth for track reservations | 02-authoring-dx |
| 3 | Bot-wall detector + saturation-aware color rank | Fix premium-brand extraction failures | 03-brand-extract |
| 4 | Audio polish — fade-out + duck wiring + sanitize + bitrate | Confirmed gap: zero `tl.to(music, volume:0)` patterns | 04-audio |
| 5 | (Verifier register tolerance — filed earlier in session) | Register-aware thresholds via `data-register` | 05-verifier |
| 6 | Archive 17 unused vertical templates + reference-build move | Cleanup; refresh stale docs | 06-library-coverage |
| 7 | CSS architecture cleanup | Font-face collapse, link-order, cards.css split, tokens registry | 07-css-architecture |
| 8 | Build sacred-oracle animation primitives (5 helpers + registerTimeline) | Closes register gap; eliminates 11-30 inline tweens per template | 08-animation-primitives |
| 9 | Documentation cleanup — stale playbook, memory, registry, LEARNINGS | 5 doc-coherence findings | 09-documentation |
| 10 | CLI cleanup — full --help, alias shortcuts, orphan removal | 5 awkward UX issues | 10-cli-ergonomics |
| 11 | Lint severity rebalance + 5 new bug detectors | 95% of warnings from 2 noisy rules; flips S/N to ~70% real | 11-lint-detectors |
| 12 | Test infrastructure — baselines, mp4 validator, verifier gate | `index.html` has zero baselines today | 12-test-coverage |

Plus 8 chips from earlier in the session (orchestrator, verifier register tolerance, sacred-stat-20s, cross-brand test, cross-register CSS audit, move-to-templates, voice picker, a11y) — total **20 chips filed** for sequential follow-on work.

---

## Big themes across all 12 reports

### Theme A — "The kinetic-pop calibration is showing"
The system was built for kinetic-feed-native content. Every register-bound default has been calibrated for that one mode. Sacred-oracle landed today and surfaced the calibration:

- Verifier rules calibrated for kinetic motion → flag contemplative holds as "near-static" (05)
- textFx combos default to kinetic-pop eases (`back.out(1.7)`) → sacred templates hand-roll 11-30 inline tweens (08)
- Tone resolver has no `contemplative`/`sacred-oracle` path → contemplative brands route to documentary (03, 06)
- Music picker has the shortlist file but no tone-mapping reaches it from a URL (03, 04)

**Implication:** the next register added (luxury-quiet, hard-tech, etc) will hit the same wall. The fix is structural — register-bound defaults across verifier + animation + tone resolver + music picker — not register-by-register patching.

### Theme B — "Things that work that nothing reaches"
Surprisingly large amount of working machinery is unreachable from the URL path:

- `scripts/audio-duck.mjs` — fully working spectral ducker with podcast/cinematic/tiktok presets, never wired into video.mjs (04)
- `kinetic-product-30s` + `community-app-tour-30s` templates — in registry but in zero tone ladders (06)
- 17 vertical templates — zero renders ever in the LEDGER (06)
- 6 unused fetchers — Pexels/Unsplash/etc paid-API alternatives never needed (10)

**Implication:** the gap isn't in capability, it's in wiring. The orchestrator's tone → template → music → voice path is the bottleneck. Each new feature works in isolation but doesn't get reached.

### Theme C — "The verifier verdict is broken as a gate"
- 67% of all 58 runs land at "needs-fix" — modal verdict (05)
- Sacred-oracle: 6/6 needs-fix, all false-positives (05)
- `npm run check` would pass with a 50% pixel regression on `index.html` (no baselines) (12)
- Silent-loop verdict gate is bypassed by standalone `npm run render` (12)

**Implication:** the verifier needs a register-aware refit AND the gating policy needs to switch from "ship" verdict (impossibly strict) to "no major" (sane default). The user's eye remains the final ship gate per `feedback_visual_fidelity.md`.

### Theme D — "Documentation drift is real"
- Memory files contradict each other (deleted-agents claim still in one file, gone in another) (09)
- 18 KB cinematic-vertical-promo playbook describes a pipeline that was deleted, no archival banner (09)
- 53 supposedly-gitignored render reports are checked in (09)
- Sacred-oracle invisible in template-models registry (09)
- LEARNINGS §6 is 670 lines / 19 entries — cold-read becomes hard (09)

**Implication:** the docs need a windowing pass + memory reconciliation + a templates registry refresh. None of it is hard; it's just been deferred while the pipeline kept growing.

---

## What's NOT broken (worth knowing)

Every audit also called out things that are already optimal — don't waste effort here:

- **Render**: yuv420p, +faststart, crf 18, JPEG q=95 intermediate, parallel BrowserContexts, memory clamp in render-vite, build-bundle concat (01, 07)
- **CLI**: error messages (named stage + bad value + valid alternatives), `--dry-run` (3s, clean across 7 stages), output verbosity controls (10)
- **Authoring**: inline LESSONS-APPLIED comment blocks (sacred has them, the 8 older templates don't yet) (02)
- **Lint architecture**: lint = DOM-static correctness, verifier = pixel reality. Don't fold visual-fidelity into fix.mjs (11)
- **Animation**: top 3 textFx primitives (cascade 69, stagger 66, glitchBurst 52) are real workhorses with proven adoption (08)

---

## Recommended sequencing

Pick chips in waves to avoid stepping on each other:

**Wave 1 (independent, can run in parallel):**
- NVENC GPU encoding (different code path, 1 file)
- Bot-wall detector (scraper, 1 file)
- Track-index manifest (new JSON file + lint detector)
- Documentation cleanup (docs only, no code)
- CLI cleanup (package.json + script renames)

**Wave 2 (depends on Wave 1's NVENC + lint additions):**
- Test infrastructure (needs lint to be solid first)
- Verifier register tolerance (depends on data-register being on all comps)
- Lint severity rebalance + 5 new detectors (uses the new manifest)

**Wave 3 (architectural):**
- Orchestrator pipeline integration (depends on bot-wall detector + register tolerance to be useful)
- CSS architecture cleanup — extract warm-community register
- Animation primitives — 5 new helpers + registerTimeline
- Move templates to compositions/templates/sacred-oracle/

**Wave 4 (after the system is stable):**
- Cross-brand reusability test
- Build sacred-stat-20s template
- Cross-register CSS extraction audit
- Voice library curation

---

## Quick wins (can be done in <15 min each)

If picking chips one at a time, these are the cheapest:

- Fix `before-after-30s.html` registry mismatch ✅ DONE this session
- Add `.scene { ... }` to shared CSS ✅ DONE this session
- Create silent placeholder mp3 ✅ DONE this session
- Banner the stale `cinematic-vertical-promo.md` playbook (1 line) — part of docs cleanup chip
- Demote `scene-overlap-visual` warn → info (severity rebalance) — part of lint chip
- Add `npm run video --help` full flag listing — part of CLI cleanup chip
- Reconcile `project_aivideomaker.md` memory contradiction — part of docs cleanup chip

---

## Files written this audit pass

- `docs/system-audit-2026-04-27/00-ROADMAP.md` — this synthesis
- `docs/system-audit-2026-04-27/01-render-performance.md` — 1522 words
- `docs/system-audit-2026-04-27/02-authoring-dx.md` — 1492 words
- `docs/system-audit-2026-04-27/03-brand-extract.md` — 1191 words
- `docs/system-audit-2026-04-27/04-audio.md` — 1517 words
- `docs/system-audit-2026-04-27/05-verifier.md` — 1500 words
- `docs/system-audit-2026-04-27/06-library-coverage.md` — 990 words
- `docs/system-audit-2026-04-27/07-css-architecture.md` — under 1500 words
- `docs/system-audit-2026-04-27/08-animation-primitives.md` — 1468 words
- `docs/system-audit-2026-04-27/09-documentation.md` — 1400 words
- `docs/system-audit-2026-04-27/10-cli-ergonomics.md` — 1434 words
- `docs/system-audit-2026-04-27/11-lint-detectors.md` — 1507 words
- `docs/system-audit-2026-04-27/12-test-coverage.md` — 1447 words

Total: ~17,000 words of researched audit findings across the entire system, in 12 dedicated files.
Visual flipbook agent (Agent B) report still pending — will land separately.

---

*Generated 2026-04-27 by orchestrator + 12 parallel research subagents.*
