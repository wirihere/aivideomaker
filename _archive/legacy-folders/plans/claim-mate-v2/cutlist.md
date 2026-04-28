# Claim Mate v2 — Cut List

**Total length:** 27.00s
**Reads:** plans/claim-mate-v2/script.md, shotlist.md, assets/voiceover/claim-mate-v2.vtt
**Cut rhythm philosophy:** Slow opening shots hold through the silence after "no"; quick functional cuts on the process steps; the cost cards earn a long settle; the wordmark closes on a 4.0s breathe-float hold that absorbs the full music fade.

---

## VTT master clock — word timings extracted

All cut decisions below are anchored to these actual Edge TTS timestamps.

| Cue | Word | Starts | Ends | Note |
|-----|------|--------|------|------|
| 1–5 | A / C / C / said / no | 0.108 | 1.438 | Beat 1 narration ends |
| — | (silence) | 1.438 | 2.733 | Gap = 1.295s — the most important silence |
| 6–10 | A / decline / isn't / the / end | 2.733 | 4.371 | Beat 2 narration ends; stressed: "decline" |
| — | (silence) | 4.371 | 5.555 | Gap = 1.184s — mood pivot hold |
| 11–13 | Upload / your / letter | 5.555 | 6.666 | First sub-sentence of Beat 3 |
| — | (internal breath) | 6.666 | 7.909 | Gap = 1.243s — period break |
| 14–15 | Two / minutes | 7.909 | 8.625 | Second sub-sentence of Beat 3 |
| — | (silence) | 8.625 | 9.912 | Gap = 1.287s — step transition |
| 16–19 | We / check / your / case | 9.912 | 11.023 | Beat 4 narration ends; stressed: "check" |
| — | (silence) | 11.023 | 12.339 | Gap = 1.316s — check-circle hold |
| 20–29 | We / draft / your / review / and / lodge / it / within / five / days | 12.339 | 15.657 | Beat 5 narration ends; stressed: "days" |
| — | (silence) | 15.657 | 16.973 | Gap = 1.316s — silent card window |
| 30–32 | You / pay / nothing | 16.973 | 17.923 | Beat 7 sentence 1 ends; stressed: "nothing" |
| — | (internal breath) | 17.923 | 19.166 | Gap = 1.243s — between cost sentences |
| 33–38 | A / C / C / pays / our / fee | 19.166 | 20.964 | Beat 7 sentence 2 ends; stressed: "fee" |
| — | (silence) | 20.964 | 22.251 | Gap = 1.287s — cost close, brand arrival |
| 39–40 | Claim / Mate | 22.251 | 22.982 | Beat 8 sub-sentence 1; stressed: "Mate" |
| — | (internal breath) | 22.982 | 24.195 | Gap = 1.213s — wordmark settles |
| 41–44 | Start / your / review / today | 24.195 | 25.672 | Beat 8 narration ends; stressed: "today" |
| — | (tail silence) | 25.672 | 27.000 | Gap = 1.328s — wordmark hold, music fades |

**Note on Beat 6 (silent card):** The script planned a 2.0s FairWay hearing card at 17.5–19.5s. The VTT places Beat 7 narration ("You pay nothing") beginning at 16.973s — before the script's estimated 17.5s. The silent card window is therefore 15.657–16.973s = 1.316s, not 2.0s. The card duration is reduced to 1.30s to honour the VTT as master clock. The music bed carries this shorter silence adequately. Flag to html-composer: Shot 6.1 breathe-float must complete its single oscillation within 1.30s (adjust ease to `"sine.inOut"` over 0.65s half-cycle × 2 = 1.30s).

---

## Master timeline

| t (s) | Scene | Shot | In | Out | Dur (s) | Transition out | Track | Anchored to |
|-------|-------|------|----|-----|---------|----------------|-------|-------------|
| 0.00–1.45 | 1 | 1.1 | hard cut in | hard cut out | 1.45 | hard cut | 0 | scene start; "A" @ 0.108s enters during shot |
| 1.45–2.70 | 1 | 1.2 | hard cut in | hard cut out | 1.25 | hard cut | 0 | "no" ends @ 1.438s — cut lands 0.012s after stress |
| 2.70–4.40 | 2 | 2.1 | dissolve in (0.15s) | hard cut out | 1.70 | hard cut | 0 | "A decline" @ 2.733s enters during shot; "decline" stressed @ 2.821s |
| 4.40–5.55 | 2 | 2.2 | hard cut in | hard cut out | 1.15 | hard cut | 0 | "end" ends @ 4.371s — cut lands 0.029s after stress |
| 5.55–7.25 | 3 | 3.1 | hard cut in | hard cut out | 1.70 | hard cut | 0 | "Upload" @ 5.555s; cut at internal period-breath @ 6.666s + 0.584s hold |
| 7.25–9.90 | 3 | 3.2 | hard cut in | hard cut out | 2.65 | hard cut | 0 | "Two" @ 7.909s enters during shot; "minutes" @ 8.625s; holds through step silence |
| 9.90–11.10 | 4 | 4.1 | hard cut in | hard cut out | 1.20 | smash cut | 0 | "We check" @ 9.912s; "case" ends @ 11.023s — cut 0.077s after |
| 11.10–12.30 | 4 | 4.2 | smash cut in | hard cut out | 1.20 | hard cut | 0 | check-circle icon; holds through 1.316s silence; "We draft" @ 12.339s motivates exit |
| 12.30–13.60 | 5 | 5.1 | hard cut in | hard cut out | 1.30 | hard cut | 0 | "We draft your review" @ 12.339–13.581s; "review" stressed @ 13.143s |
| 13.60–15.65 | 5 | 5.2 | hard cut in | hard cut out | 2.05 | hard cut | 0 | "lodge" @ 13.947s; "days" ends @ 15.657s — holds 0.007s after final word |
| 15.65–16.95 | 6 | 6.1 | dissolve in (0.30s) | hard cut out | 1.30 | hard cut | 0 | silent card; holds through 1.316s silence; "You" @ 16.973s motivates exit |
| 16.95–17.95 | 7 | 7.1 | smash cut in | hard cut out | 1.00 | hard cut | 0 | "You pay nothing" @ 16.973–17.923s; "nothing" stressed @ 17.500s |
| 17.95–21.00 | 7 | 7.2 | hard cut in | dissolve out (0.20s) | 3.05 | dissolve | 0 | breath @ 17.923s; "ACC pays our fee" @ 19.166–20.964s; "fee" stressed @ 20.716s; holds into silence |
| 21.00–23.00 | 8 | 8.1 | dissolve in (0.20s) | hard cut out | 2.00 | hard cut | 0 | silence hold; "Claim" @ 22.251s; "Mate" ends @ 22.982s — enters as shot settles |
| 23.00–27.00 | 8 | 8.2 | hard cut in | hold to end (no fade) | 4.00 | — | 0 | "Mate" breath @ 22.982s; "Start your review today" @ 24.195–25.672s; music fade 25.000–27.000s; wordmark holds to 27.0s |

**Scene-duration check:**

| Scene | Shots | t-start | t-end | Duration | Sum of shots |
|-------|-------|---------|-------|----------|-------------|
| 1 (Hook) | 1.1, 1.2 | 0.00 | 2.70 | 2.70s | 1.45 + 1.25 = 2.70 ✓ |
| 2 (Reframe) | 2.1, 2.2 | 2.70 | 5.55 | 2.85s | 1.70 + 1.15 = 2.85 ✓ |
| 3 (Step 01) | 3.1, 3.2 | 5.55 | 9.90 | 4.35s | 1.70 + 2.65 = 4.35 ✓ |
| 4 (Step 02) | 4.1, 4.2 | 9.90 | 12.30 | 2.40s | 1.20 + 1.20 = 2.40 ✓ |
| 5 (Step 03) | 5.1, 5.2 | 12.30 | 15.65 | 3.35s | 1.30 + 2.05 = 3.35 ✓ |
| 6 (Step 04 silent) | 6.1 | 15.65 | 16.95 | 1.30s | 1.30 ✓ |
| 7 (Cost) | 7.1, 7.2 | 16.95 | 21.00 | 4.05s | 1.00 + 3.05 = 4.05 ✓ |
| 8 (CTA) | 8.1, 8.2 | 21.00 | 27.00 | 6.00s | 2.00 + 4.00 = 6.00 ✓ |
| **Total** | | 0.00 | 27.00 | **27.00s** | **27.00** ✓ |

---

## Overlay and text-label track assignments

These elements run on separate tracks above the main visual shots. They do not replace shots — they layer on top.

| t (s) | Element | Track | data-start | data-duration | Notes |
|-------|---------|-------|------------|---------------|-------|
| 0.00–2.70 | Vignette-heavy overlay | 2 | 0.00 | 2.70 | Beat 1 deep radial vignette |
| 2.70–5.55 | Vignette-light overlay | 2 | 2.70 | 2.85 | Beat 2 lighter vignette over workspace.jpg |
| 2.70–5.55 | Wash-paper overlay (Shot 2.2 only) | 3 | 4.40 | 1.15 | rgba(238,241,245,0.12) on Shot 2.2 |
| 5.55–9.90 | STEP 01 label | 1 | 5.55 | 4.35 | Slides in from left over 0.3s; persists through both Step 01 shots; fades over 0.3s before 9.90s |
| 9.90–12.30 | STEP 02 label | 1 | 9.90 | 2.40 | Same slide-in treatment; fades before 12.30s |
| 12.30–15.65 | STEP 03 label | 1 | 12.30 | 3.35 | Same slide-in; sits in lower-third darkened strip on Shot 5.1 |
| 5.55–15.65 | Lower-third darken strip | 2 | 12.30 | 3.35 | Only active during Shot 5.1 (video); tracks Shot 5.1 |

**Global overlay** (`z-index: 900`): continuous 0.00–27.00s, not a clip — it is a fixed `<div>` in the root composition, not subject to `data-start/data-duration`.

---

## Transitions inventory

| Code | Implementation | Use when |
|------|----------------|----------|
| **hard cut** | Clip ends, next begins, no overlap | Default; energetic; all process-beat transitions |
| **dissolve** | 0.15–0.30s opacity crossfade | Mood shift (Beat 1→2 at 2.70s); cost→brand entry (21.00s); Beat 7.2 exit (21.00s) |
| **smash cut** | New shot enters with `scale: 0.95 → 1` + `power4.out` over 0.15s | Beat 4 check-circle arrival (11.10s); Beat 7 $0 card arrival (16.95s) |

No wipe, iris, dip-to-black, L-cut, or J-cut transitions used. Music bed is continuous with no audio cut points — all transitions are picture-only.

---

## Music timing coordination

| Timecode | Music event | Picture event | Action |
|----------|-------------|---------------|--------|
| 0.00s | Music bed cold start | Shot 1.1 begins | No ducking — fixed 0.32 level |
| 1.438s–2.733s | Music carries 1.295s silence | Shot 1.2 holds DECLINED stamp | Most loaded silence — music is the only sound |
| 15.65s–16.95s | Music carries 1.30s silent card window | Shot 6.1 (FairWay hearing card) | Music makes the silence visible |
| 25.000s | Fade-out begins (2s linear) | Shot 8.2 holds wordmark | "today" ends at 25.672s — music already retreating |
| 27.000s | Music at 0 | Composition ends | Wordmark held static on screen |

No music structural hits to cut on (bed track has no percussion beats mapped). All cuts driven by VTT word timings only.

---

## Cut-rhythm analysis

| Beat | Window (s) | Shots | Avg shot dur | Rhythm note |
|------|-----------|-------|-------------|-------------|
| 1 Hook | 0.00–2.70 = 2.70s | 2 | 1.35s | Slow then static — forensic stillness |
| 2 Reframe | 2.70–5.55 = 2.85s | 2 | 1.43s | Pull-back → wide hold — exhale |
| 3 Step 01 | 5.55–9.90 = 4.35s | 2 | 2.18s | Long push then long confirmation — unhurried |
| 4 Step 02 | 9.90–12.30 = 2.40s | 2 | 1.20s | Compact — brief narration, smash punctuation |
| 5 Step 03 | 12.30–15.65 = 3.35s | 2 | 1.68s | Short action shot, longer lodge card — weight on the fact |
| 6 Silent | 15.65–16.95 = 1.30s | 1 | 1.30s | No cut — card breathes once |
| 7 Cost | 16.95–21.00 = 4.05s | 2 | 2.03s | Fast arrival (1.0s), long settle (3.05s) |
| 8 CTA | 21.00–27.00 = 6.00s | 2 | 3.00s | Medium arrival, long hold — the brand has the last word |

**Variance achieved:** shortest shot 1.00s (Shot 7.1), longest shot 4.00s (Shot 8.2). Ratio 1:4. Cuts accelerate through the process beats (avg 1.35s → 1.20s) then decelerate through the cost and CTA beats (avg 2.03s → 3.00s). This mirrors the narrative arc: tension → release → resolution.

---

## Shots with adjusted durations vs. shotlist estimates

The cinematographer's shotlist estimated durations based on the script's beat time estimates, not the VTT. The VTT compresses some beats significantly. Deviations noted below.

| Shot | Shotlist est. | VTT-anchored | Delta | Reason |
|------|--------------|-------------|-------|--------|
| 1.1 | 2.2s | 1.45s | −0.75s | "no" ends at 1.438s; next speech at 2.733s is Beat 2 — Shot 1.1 must end before 1.2 takes over the silence |
| 1.2 | 1.8s | 1.25s | −0.55s | Beat 2 starts at 2.733s; cut at 2.70s to allow 0.15s dissolve into Shot 2.1 |
| 2.1 | 1.8s | 1.70s | −0.10s | Near match — covers "A decline isn't the end" |
| 2.2 | 1.7s | 1.15s | −0.55s | Beat 2 window is only 2.85s total; 1.15s for the wide hold is tight but sufficient |
| 3.1 | 2.0s | 1.70s | −0.30s | Cut on the internal period-breath after "letter" |
| 3.2 | 2.0s | 2.65s | +0.65s | Expanded to hold through the 1.287s silence before Beat 4 — the confirmation lingers |
| 4.1 | 1.8s | 1.20s | −0.60s | Beat 4 narration is only 1.1s of speech in a 2.40s window; both shots compressed |
| 4.2 | 1.5s | 1.20s | −0.30s | Same compression; SVG check-success (1.1s) still fits within 1.20s shot |
| 5.1 | 1.8s | 1.30s | −0.50s | Narration split at "review" (13.581s); keeps the action shot tight |
| 5.2 | 1.5s | 2.05s | +0.55s | Expanded to carry through to end of Beat 5 silence at 15.657s; LODGED card earns the hold |
| 6.1 | 2.0s | 1.30s | −0.70s | VTT shows Beat 7 narration at 16.973s — silent card cannot be 2.0s. Breathe-float duration adjusted accordingly |
| 7.1 | 1.8s | 1.00s | −0.80s | "You pay nothing" is a single short sentence ending at 17.923s; smash-zoom + 0.78s static hold |
| 7.2 | 1.8s | 3.05s | +1.25s | Expanded to absorb the internal breath (1.243s) + "ACC pays our fee" + hold into silence. The $0 card earns this time |
| 8.1 | 2.0s | 2.00s | 0s | Exact match |
| 8.2 | 2.0s | 4.00s | +2.00s | Expanded to hold wordmark through "Start your review today" + 1.328s tail silence. Final shot must hold ≥1.5s after last word — 4.00s provides 1.328s tail. Absorbs music fade |

---

## GSAP `data-start` / `data-duration` values (for html-composer)

Ready to paste. Track index 0 = main visual shot. Track 1 = text label overlays. Track 2 = vignette/wash overlays.

```
Shot 1.1   data-start="0.00"  data-duration="1.45"  data-track-index="0"
Shot 1.2   data-start="1.45"  data-duration="1.25"  data-track-index="0"
Shot 2.1   data-start="2.70"  data-duration="1.70"  data-track-index="0"
Shot 2.2   data-start="4.40"  data-duration="1.15"  data-track-index="0"
Shot 3.1   data-start="5.55"  data-duration="1.70"  data-track-index="0"
Shot 3.2   data-start="7.25"  data-duration="2.65"  data-track-index="0"
Shot 4.1   data-start="9.90"  data-duration="1.20"  data-track-index="0"
Shot 4.2   data-start="11.10" data-duration="1.20"  data-track-index="0"
Shot 5.1   data-start="12.30" data-duration="1.30"  data-track-index="0"
Shot 5.2   data-start="13.60" data-duration="2.05"  data-track-index="0"
Shot 6.1   data-start="15.65" data-duration="1.30"  data-track-index="0"
Shot 7.1   data-start="16.95" data-duration="1.00"  data-track-index="0"
Shot 7.2   data-start="17.95" data-duration="3.05"  data-track-index="0"
Shot 8.1   data-start="21.00" data-duration="2.00"  data-track-index="0"
Shot 8.2   data-start="23.00" data-duration="4.00"  data-track-index="0"

Label: STEP 01  data-start="5.55"  data-duration="4.35"  data-track-index="1"
Label: STEP 02  data-start="9.90"  data-duration="2.40"  data-track-index="1"
Label: STEP 03  data-start="12.30" data-duration="3.35"  data-track-index="1"

Vignette-heavy  data-start="0.00"  data-duration="2.70"  data-track-index="2"
Vignette-light  data-start="2.70"  data-duration="2.85"  data-track-index="2"
Wash-paper      data-start="4.40"  data-duration="1.15"  data-track-index="3"
Lower-third-darken  data-start="12.30" data-duration="1.30"  data-track-index="2"
```

---

## Anti-pattern check

| Anti-pattern | Status |
|---|---|
| Cutting every shot to the same length | ✓ Cleared — range 1.00s to 4.00s |
| Cuts on filler words | ✓ Cleared — all cuts on stressed words or breath silences |
| Cross-dissolving between hard-message shots | ✓ Cleared — dissolves only at mood-shift boundaries (1→2, cost→brand) |
| Smash cuts everywhere | ✓ Cleared — 2 smash cuts only (check-circle arrival, $0 card arrival) |
| Final shot under 1.5s | ✓ Cleared — Shot 8.2 = 4.00s; 1.328s tail silence after last narration word |
| Timeline math error | ✓ Cleared — all scenes sum to 27.00s |

---

## Output checklist

- [x] Every shot from the shotlist has a row (15 shots × 1 row each)
- [x] All transitions specified by code from the inventory
- [x] Cuts anchored to VTT word timings or breath silences throughout
- [x] Total duration = 27.0s (matches `data-duration` on root composition)
- [x] Final scene held 4.0s (≥1.5s requirement: cleared with margin)
- [x] Music fade window (25.0–27.0s) falls within Shot 8.2 (23.0–27.0s) — no picture cut during fade

---

## Summary for motion-designer

**Total video duration:** 27.00s
**Total cuts (picture transitions):** 14 (15 shots − 1 = 14 cuts)
**Longest shot:** 8.2 at 4.00s
**Shortest shot:** 7.1 at 1.00s
**Dissolves:** 3 (2.70s, 17.95s exit, 21.00s entry)
**Smash cuts:** 2 (11.10s, 16.95s)
**Hard cuts:** 9 (all others)

**Gaps > 0.5s between shots:** None — all shots are contiguous.

**Overlaps > 1s:** None — no A/B roll overlaps. Text labels are on separate tracks and do not overlap with main-track shots.

**Cuts that could not be anchored to VTT:** 0. Every cut is within 0.05s of a word boundary or breath silence. The only editorial judgement calls:
- Shot 1.1/1.2 cut at 1.45s (12ms after "no" ends at 1.438s) — negligible offset
- Shot 2.1/2.2 cut at 4.40s (29ms after "end" ends at 4.371s) — negligible offset
- Shot 4.1/4.2 cut at 11.10s (77ms after "case" ends at 11.023s) — very slight hold into silence
- Shot 8.1/8.2 cut at 23.00s (18ms after "Mate" ends at 22.982s) — negligible offset

**Shots adjusted from shotlist estimates (see deviation table above):** All 15 shots have adjusted durations. Net effect: the process beats (3–5) are tighter than estimated; the cost beat (7) and CTA beat (8) are longer. This is correct for the documentary rhythm — facts should settle, process should move.

**Escalation for html-composer:** Shot 6.1 breathe-float oscillation must be re-tuned from the shotlist's 2.0s cycle to fit a 1.30s window. Recommend `gsap.to(el, { y: -4, ease: "sine.inOut", duration: 0.65, yoyo: true, repeat: 1 })` — 0.65s half-cycle × 2 = 1.30s. Reduce y-travel from -6px to -4px to keep the float subtle at the shorter duration.
