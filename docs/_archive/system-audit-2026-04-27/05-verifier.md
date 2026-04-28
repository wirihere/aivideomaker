> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Verifier audit — `scripts/verify-render.mjs` (2026-04-27)

Source: 2238 LOC, last touched in wave-P (motion-continuity + script-timing).
Ledger: 58 runs → 3 ship / 16 watch / 39 needs-fix. Modal verdict is
**needs-fix (67%)**. Anchor data point: `singularity-convergence` v2 is the
user's "really excellent" render; verifier has scored it `needs-fix` 6 runs
running. Verifier and user disagree.

---

## 1. Detector inventory + thresholds

`categorize()` (line 991) emits 11 categories. Verdict math (line 1692):
`needs-fix` if any major fires, `watch` if `watchSignals > 2`, else `ship`.

| Category | Detector | Threshold | Tier |
| --- | --- | --- | --- |
| composition | text-heavy | >240 chars/scene | watch |
| brandFidelity | brand-name-missing | brand substring absent | **major** |
| brandFidelity | url-missing | host substring absent | **major** |
| brandFidelity | beat-headline-missing | per-beat headline miss | watch |
| placeholderLeakage | seed-copy | `SEED_COPY_PATTERNS` regex hit | **major** |
| pacing | scene-short / scene-long | <0.5x or >1.8x ideal beat slot | watch |
| audioCoverage | trailing-silence | comp_end - vtt_end > 2.5s | watch |
| accessibility | contrast / small-text | WCAG 3:1/4.5:1; <18px | watch |
| brandPaletteUse | scene-bg-off-palette | scene bg not in tokens-<slug>.css | watch |
| brandPaletteUse | zero-var-refs | 0 `var(--card-` in inline `<style>` | **major** |
| brandAssetUse | asset-unused | manifest entry not in `src=` | watch |
| brandAssetUse | visual-identity-absent | hero AND logo both unused | **major** |
| sceneVisualDensity | text-only-scene | imageCount=0, decorativeCount=0, bg not brand | watch |
| sceneVisualDensity | consecutive-text-only | maxRun ≥ 3 | **major** |
| motionContinuity | static-moment | sha256 identical | watch |
| motionContinuity | near-static-moment | byte-diff **< 2.0%** | watch |
| motionContinuity | multiple-static / scene-frozen | 2+ static OR all pairs non-moving | **major** |
| scriptTiming | script-density-imbalance | wps outside 0.5x–2.0x avg | watch |
| scriptTiming | scene-narration-mismatch | <25% spoken/visible token overlap (4+ words) | watch (≥2 = major) |
| scriptTiming | narration-overrun-into-cta | last cue end > last-scene start | watch |
| scriptTiming | narration-past-comp-end | last cue end > comp end | **major** |
| scriptTiming | word-emphasis-orphan | identity token >1.5s into scene, no fx within 0.3s | watch |

---

## 2. Singularity-convergence latest run — what's real

`docs/render-learnings/singularity-convergence-20260427-143848.md` (needs-fix):

| Finding | Real? | Reason |
| --- | --- | --- |
| **brand-name-missing** "Singularity Convergence" | mis-scored | Brand IS on screen as "SINGULARITY" + "singularityconvergence.org". Substring fails on typeset wordmarks. |
| trailing-silence 5.0s | by-design | Sacred-oracle outro hold. |
| 6 text-only scenes + consecutive-text-only major | **false positive** | Each scene has SVG emblems (atom, cross, tree). Persistent `<svg id="atom-persistent">` lives outside scene wrappers — never counted by per-scene census. |
| 8 near-static moments | **false positive** | CSS `@keyframes` haze + starfield drift = 0.2–1.9% byte change per 0.5s — under 2% threshold (line 706). LEARNINGS §1184 explicitly says this register relies on it. |
| scene-narration-mismatch on b4 (7%) | **false positive** | Visual asks "What do I do when nothing makes sense?", VO answers it. Q&A pattern; verifier expects literal/paraphrase alignment. |
| narration-overrun-into-cta 4.98s | **false positive** | b9 IS the CTA; brand says wordmark deliberately into it. Verifier comment (line 1634) acknowledges as designed pattern but still counts toward watch. |
| 3 emphasis-orphans (Convergence/Singularity) | **false positive** | Sacred-oracle uses `@keyframes` for entrances — verifier scans only GSAP `at:` parameters. |
| 18 silence-beat info entries | by-design noise | Sacred-oracle deliberately spaces words ~1s apart. |

**Genuine actionable findings: zero.** User already shipped this render.

---

## 3. False-positive sources — exact lines

Three confirmed:

1. **Sub-2% byte change flagged on contemplative holds** —
   `scripts/verify-render.mjs:706` and `:716`:
   `kind = pct < 0.02 ? "near-static" : "moving"`. Threshold is global.

2. **SVG not recognized as visual element when persistent** — `:438–443`
   handles inline SVG with children, but the per-scene census
   (`querySelectorAll` rooted at the scene element) misses persistent
   decoratives that are siblings of scenes.

3. **Q&A demo flagged as scene-narration-mismatch** — `:1576`,
   `if (pct < 0.25)`. The 25% floor assumes literal-or-paraphrase alignment;
   rhetorical structure is structurally below 25%.

---

## 4. Chip scope review + what else should change

The chip "Add sacred-oracle register tolerance" lists three fixes.
**Right but incomplete.** Also needed:

- `narration-overrun-into-cta` should be suppressed (not just messaged) when
  CTA scene is `data-cta-spoken="true"`. Today line 1746 still adds it to
  `watchSignals`.
- `brand-name-missing` should accept typeset variants — tokenize visible
  text the same way `tokenizeForScriptTiming` does and compare token sets,
  not raw substrings.
- `text-only-scene` should look at comp-root persistent decoratives, not
  just the scene subtree. Add a `[data-persistent]` allowlist that adds
  to every active scene's count.
- `emphasis-orphan` should accept CSS `@keyframes` as fx events — either
  parse `<style>` for `animation:` start times or read a
  `data-emphasis-at="3.4"` attribute directly.
- `silence-beat-misplaced` should be suppressed when `data-register` is
  contemplative/sacred-oracle (deliberate breath gaps).

---

## 5. What v2 needs to land at "ship"

Majors firing: 1 (`brand-name-missing`). Watch counter ≈ 19 vs threshold
≤ 2. Reaching ship without changing detectors would require hero photo on
every text-only scene, GSAP entrance fx near every identity word, no
inter-word VO pauses, no outro hold — **all break the sacred-oracle
brief**. The detectors need to change, not the comp.

---

## 6. Ledger verdict distribution

- 3 ship / 16 watch / 39 needs-fix (5% / 28% / 67%)

Per-slug:
- `kindred-recut` (kinetic family): 4 → 2 ship, 2 needs-fix.
- `kindred-nz` warm-community: 11 → 5 watch, 6 needs-fix, 0 ship.
- `index` warm-community: 22 → 7 watch, 15 needs-fix, 0 ship.
- `baseline-stripe` kinetic-pop: 3 → 3 needs-fix.
- `singularity-convergence` sacred-oracle: 6 → **6 needs-fix (100%)**.

Pattern: `needs-fix` is modal for slow-form/contemplative AND for
multi-iteration brand-extract runs. `ship` lives only in the kindred-recut
lane the verifier was originally authored against.

---

## 7. Missed real bugs (ship/watch verdict, render broken)

LEARNINGS §1671: verifier said `watch`, user called render "way off"
(wave-N kindred-nz). Partially closed by palette/asset/density checks
(`8bfd9f8`). Open gaps:

- **Stock photo content mismatch** — image present, vibe wrong. No
  image-semantic detector.
- **Music register mismatch** — kinetic-pop on biker brand (§1632).
  Music selection lives outside verifier scope.
- **typeOn overflow at scene end** — §1187. Motion samples land mid-tween,
  never at typeOn-final layout. Caught only at render.
- **Seed-image surviving** — no detector compares image content vs brand.

---

## 8. Per-detector calibration — register bias

Brand-fidelity substring breaks on typeset wordmarks (sacred-oracle).
Pacing's 0.5x–1.8x band fits 4–8 scenes (kinetic), breaks for 9–10
(sacred). Brand-palette + asset checks silently skip when token / manifest
files are missing — true for every sacred-oracle run so far. Scene-density
breaks on persistent decoratives. Motion threshold (2%) is tuned for GSAP +
Ken Burns; CSS `@keyframes` ambient sits at 0.5–1.9%. Script-timing
density / mismatch / orphan checks all assume narration-driven register.

**Systemic bias.** Every motion / density / alignment threshold was set
against warm-community / kinetic-pop in wave-N/P. Sacred-oracle was added
2026-04-27 and inherits a rubric that doesn't fit.

---

## 9. Five fixes, ranked by leverage

1. **Register-aware thresholds via `data-register` attribute.** Already
   present on singularity-convergence. Dispatch in `categorize()` mutates
   thresholds: sacred-oracle → motion 2%→0.5% with ≥4s pair gap;
   mismatch floor 25%→10%; CSS `@keyframes` counted as fx events;
   silence-beat suppressed; `narration-into-cta` removed from
   watchSignals when `data-cta-spoken="true"`. ~50 LOC. Eliminates ~70%
   of sacred-oracle false positives.

2. **Token-set match for brand-fidelity instead of substring.** ~10 LOC.
   Clears the only remaining major on singularity v2. Side benefit: catches
   typeset/letter-spaced wordmarks across all registers.

3. **Comp-root-aware scene census for persistent decoratives.** Walk
   `[data-composition-id] > svg, [data-composition-id] > [data-persistent]`
   once and add to every active scene's `decorativeCount`. ~20 LOC. Fixes
   the 6-text-only false-positive cascade.

4. **Split verdict into red / yellow / green.** Today's binary watch/ship
   collapses "polish wins" with "no bugs". Proposal: `red` = any major;
   `yellow` = no major but watch > register threshold; `green` = clean.
   PROCESS.md gate becomes `verdict !== red`. Removes the per-register
   binary cliff that lands sacred-oracle at needs-fix forever.

5. **Settled-state sampling at `scene-end - 0.2s`.** ~5 LOC. Catches the
   typeOn-overflow class of bug that LEARNINGS §1187 calls out as
   render-only-discovered.

---

## 10. Recommendation — hard-gate at "no major", not "ship"

Today's `--allow-watch` flag implicitly admits this already: the user
opts out of the watch wall to ship anything contemplative. With 67%
needs-fix and many false-positive-driven, holding `ship` as the gate
means infinite iteration on user-approved renders.

Concrete:
- Render gate: `verdict !== red` (zero majors).
- `yellow` shows summary, doesn't block.
- User eye remains final ship gate per `feedback_visual_fidelity.md`
  ("passing verifier ≠ ship-ready").
- Verifier's real job: catch placeholder leakage, missing brand, hero+logo
  absent, frozen scenes, clipped narration. Stop pretending it judges
  perceptual register fit.

Trust the eye for register fit, contemplative motion quality, brand vibe.
Trust the verifier for hard-error detection. Today's rubric blurs these
roles and produces 6-deep needs-fix tails on shipped work.
