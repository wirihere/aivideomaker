---
name: iterate-render
description: Run one silent-loop iteration cycle for a brand — assemble + verify + frame-flipbook — and report key findings. Forks so verifier markdown / frame PNGs stay in subagent context; parent only sees a synthesized summary.
context: fork
agent: general-purpose
---

# Iterate Render — silent-loop fork

Run ONE iteration cycle for `$ARGUMENTS` per `docs/PROCESS.md` cycle step 2 (silent loop). Return ONLY a synthesized summary — verifier markdown, frame PNGs, copy.json, scrape data all stay in your forked context.

`$ARGUMENTS` should be either:
- A URL (`https://...`) — first iteration on a new brand
- A slug (`kindred-nz`, `resurgence-indigo`) — re-iteration on existing brand

Optional flags: `--template=<name>` to force template choice, `--seconds=<N>` to override duration.

---

## Preloaded state (from !command preprocessing)

**LEDGER tail (last 8 verdicts):**
!`tail -8 docs/render-learnings/LEDGER.md 2>/dev/null || echo "(no ledger yet)"`

**Template status registry:**
!`node scripts/lib/template-status.mjs 2>/dev/null || echo "(parser failed)"`

**PROCESS.md cycle (the loop you're running):**
!`sed -n '/## The cycle/,/^---$/p' docs/PROCESS.md 2>/dev/null | head -50`

**Memory rules that govern this run:**
!`grep -E "^- \[" ~/.claude/projects/C--Users-wirihere-aivideomaker/memory/MEMORY.md 2>/dev/null || echo "(memory not found)"`

---

## What you do

1. **Resolve the slug.** If `$ARGUMENTS` starts with `http`, derive a slug (last path segment or domain). If it's already a slug, use it directly.

2. **Pick the template.** Read `compositions/<slug>.copy.json` `template` field if it exists. Otherwise fall back to whatever the orchestrator's tone-picker returns. Pass `--template=<name>` if explicit.

3. **Run the iteration cycle:**
   ```
   npm run video -- "<url>" --seconds=30 --template=<template> --name=<slug> --no-render --no-tts --keep-artifacts
   ```
   The `--no-render` keeps you inside the silent loop (no MP4 burned). `--no-tts` reuses existing narration if any.

4. **Read the verifier report** at `docs/render-learnings/<slug>-<ts>.md` (the orchestrator prints the path). Extract:
   - Verdict (ship / watch / needs-fix)
   - Top 3 most actionable findings — major first, then watch
   - Skip noise (info-only findings, motion entries under 1% byte-diff)

5. **Run frame flipbook:**
   ```
   node scripts/frame-flipbook.mjs --slug=<slug>
   ```

6. **Read 2-3 critical frames** (post-entrance settled moments — t=2.5 / t=mid-comp / t=end-cta). Confirm:
   - Brand visible elements look right
   - No layout collisions
   - No clobbered slots (text matches the design intent)

7. **Identify next-action.** If verdict is `ship` and frames look right → ready for pre-render review. If watch → list specific fixes. If needs-fix → list majors.

---

## What you return

A SINGLE block of plain text, max 250 words. Synthesize, don't dump. Format:

```
SLUG: <slug>
TEMPLATE: <template-name> (<status: locked-vN | iterating | legacy>)
VERDICT: <ship | watch | needs-fix>

FINDINGS (top 3):
- <kind>: <one-line synthesis> — <fix recommendation>
- ...

FRAMES: tmp/<slug>-frames-<ts>/ (8 frames)
VISUAL CHECK: <one-line — what looks right, what doesn't>

NEXT ACTION:
<one of: "ready for pre-render review" | "iterate: fix X then re-run" | "blocked on creative judgment — escalate to user">

REPORT: <path to verifier markdown for parent to optionally read>
```

---

## Token discipline

You are running in a forked subagent. Tool responses (verifier markdown, frame snapshots, copy.json reads) stay in YOUR context, NOT the parent's. The parent only sees what you return at the end.

Synthesize aggressively. The parent does NOT need:
- Verbatim verifier markdown
- Per-frame Read output
- Full motion-continuity entries
- Copy.json content
- Scrape data

The parent DOES need:
- Verdict
- Top fixable findings (not all 24 motion entries — just the actionable ones)
- One-line visual check
- Path to the report so they can investigate if needed

If you can't reach a clear verdict + recommendation in your fork (e.g. blocked on creative judgment), say so explicitly and escalate.

---

## Gotchas (per `feedback_silent_loop_not_skipped`)

- DO NOT recommend "render now" if verdict is `watch` unless the user has explicitly said `--allow-watch`. Watch triggers another iteration.
- DO frame-flipbook check before declaring ready. Verifier `watch` + frames look right is the actual ship gate.
- DO NOT "fix" creative things in the fork (font choices, music, copy tone). Surface as escalations.
