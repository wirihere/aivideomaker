# Render Verification — kindred-nz-override

- date: 2026-04-26T09:23:53.322Z
- template: warm-community
- tone: (unknown)
- duration: 30s
- vtt cues: 67
- verdict: **needs-fix**

## Per-second alignment

| t | scene | spoken | visible (top 3) |
| --- | --- | --- | --- |
| 0 | s1 | — | INTRODUCING |
| 1 | s1 | help | INTRODUCING · KINDRED |
| 2 | s1 | — | INTRODUCING · KINDRED · Be kind. Use Kindred. |
| 3 | s2 | neighbours | — |
| 4 | s2 | — | STEP 01 · 01 · Post a give or an ask. |
| 5 | s2 | — | STEP 01 · 01 · Post a give or an ask. |
| 6 | s2 | local | STEP 01 · 01 · Post a give or an ask. |
| 7 | s2 | — | STEP 01 · 01 · Post a give or an ask. |
| 8 | s2 | app | STEP 01 · 01 · Post a give or an ask. |
| 9 | s2 | it | STEP 01 · 01 · Post a give or an ask. |
| 10 | s2 | — | STEP 01 · 01 · Post a give or an ask. |
| 11 | s2 | no | STEP 01 · 01 · Post a give or an ask. |
| 12 | s3 | algorithm | STEP 02 · 02 |
| 13 | s3 | — | STEP 02 · 02 · A neighbour messages. |
| 14 | s3 | neighbours | STEP 02 · 02 · A neighbour messages. |
| 15 | s3 | first | STEP 02 · 02 · A neighbour messages. |
| 16 | s3 | — | STEP 02 · 02 · A neighbour messages. |
| 17 | s3 | someone | STEP 02 · 02 · A neighbour messages. |
| 18 | s3 | probably | STEP 02 · 02 · A neighbour messages. |
| 19 | s4 | — | STEP 03 · 03 |
| 20 | s4 | Informal | STEP 03 · 03 · Drop it off or pick it up. |
| 21 | s4 | the | STEP 03 · 03 · Drop it off or pick it up. |
| 22 | s4 | too | STEP 03 · 03 · Drop it off or pick it up. |
| 23 | s4 | between | STEP 03 · 03 · Drop it off or pick it up. |
| 24 | s4 | — | STEP 03 · 03 · Drop it off or pick it up. |
| 25 | s4 | free | STEP 03 · 03 · Drop it off or pick it up. |
| 26 | s5 | street | Be kind. Use Kindred. |
| 27 | s5 | give | Be kind. Use Kindred. · https://kindred-nz.org |
| 28 | s5 | find | Be kind. Use Kindred. · https://kindred-nz.org |
| 29 | s5 | close | Be kind. Use Kindred. · https://kindred-nz.org |
| 30 | s5 | — | Be kind. Use Kindred. · https://kindred-nz.org |

## Composition

- scene s1: 3 text elements (41 chars)
- scene s2: 4 text elements (68 chars)
- scene s3: 4 text elements (65 chars)
- scene s4: 4 text elements (78 chars)
- scene s5: 2 text elements (44 chars)

## Brand fidelity

- brand name "Kindred" present in visible text
- URL host "kindred-nz.org" present in visible text
- beat #3 headline ("Made for locals.") not detected in any scene

## Placeholder leakage

_no template seed-copy detected_

## Pacing

- scene s1 is ~3s, less than half the ideal 7.5s/beat slot

## Audio coverage

- narration end (29.6s) within 2.5s of comp end (30s)

## Accessibility

- scene s1: "INTRODUCING" contrast 1.60:1 < 3:1
- scene s2: "STEP 01" contrast 1.60:1 < 3:1
- scene s3: "STEP 02" contrast 1.60:1 < 3:1
- scene s4: "STEP 03" contrast 1.60:1 < 3:1

## Brand palette use

- 40 var(--card-) references in assembled <style> — brand tokens consumed

## Brand asset use

- asset favicon (assets/kindred-nz-override/favicon.png) was pulled but never shown in the comp
- brand visual identity completely absent: neither hero nor logo appears in any scene

## Scene visual density

_no scene-density findings_

## Motion continuity

- scene s1 at t=1.5s–2s: near-static (0.08% byte change)
- scene s1 at t=2s–2.5s: near-static (0.99% byte change)
- scene s1 at t=2.5s–2.95s: near-static (0.04% byte change)
- scene s2 at t=7.5s–9s: near-static (1.11% byte change)
- scene s3 at t=15s–16s: near-static (1.71% byte change)
- scene s4 at t=21s–21.5s: identical frames, no visible motion
- scene s4 at t=22s–23s: near-static (0.71% byte change)
- scene s4 at t=23s–24s: near-static (0.85% byte change)
- scene s4 at t=24s–25s: near-static (0.70% byte change)
- scene s5 at t=29.95s–29.95s: identical frames, no visible motion
- scene s5 at t=26.5s–27s: near-static (0.05% byte change)
- scene s5 at t=27.5s–28s: near-static (0.08% byte change)
- scene s5 at t=28.5s–29s: near-static (0.45% byte change)
- scene s5 at t=29s–29.5s: near-static (0.03% byte change)
- scene s5 at t=29.5s–29.95s: near-static (0.08% byte change)

## Script timing

- scene s1: only 0/6 spoken words (0%) align with visible text — visuals on a different beat
- scene s5: only 0/12 spoken words (0%) align with visible text — visuals on a different beat
- narration ends at 29.60s but CTA scene s5 starts at 26.00s — narration overruns into CTA by 3.60s (acceptable when narration speaks the CTA tagline)
- narration runs 29.60s of 30s comp — 0.40s slack

## Verdict

`needs-fix` — major findings (placeholder leakage and/or missing brand). Fix before re-rendering.
