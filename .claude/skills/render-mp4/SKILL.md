---
name: render-mp4
description: Render a brand's MP4 in a forked subagent. Returns the no-watermark file path + 30-word summary. ffmpeg / x264 / progress-bar output stays in subagent; parent only sees the result.
context: fork
agent: general-purpose
---

# Render MP4 — forked render

Run the MP4 render for `$ARGUMENTS` (a slug, e.g. `kindred-nz` or `resurgence-indigo`). The orchestrator's stages 6-10 execute (assemble + verify + quality-gate + frame-flipbook + render). The render alone takes 3-4 minutes — all of that output stays in your fork.

Optional flags after the slug:
- `--allow-watch` — render despite a `watch` verdict (per docs/PROCESS.md)
- `--use-legacy` — render against a legacy template (per docs/template-models.md)
- `--with-music` — wire the auto-picked music in (recommended)

---

## Preloaded state

**Last verdict for this brand:**
!`grep "$ARGUMENTS" docs/render-learnings/LEDGER.md 2>/dev/null | tail -1 || echo "(no prior verdict)"`

**Template status:**
!`node scripts/lib/template-status.mjs 2>/dev/null | grep "$ARGUMENTS\|TEMPLATE\|---" | head -3 || echo "(no status info)"`

**No-watermark memory rule:**
- `feedback_no_watermark.md` — default surface is the `-graded.mp4` (NO `-wm`) file. Never link the watermarked variant unless explicitly asked.

---

## What you do

1. **Validate prerequisites.** Confirm `compositions/<slug>.copy.json` exists. If not, return an error: "no copy.json for <slug>; run /iterate-render <url> first".

2. **Confirm the gate state.** If the last verdict was `watch` or `needs-fix` and `--allow-watch` is NOT in `$ARGUMENTS`, return: "blocked: last verdict was <X>; either iterate to ship or pass --allow-watch".

3. **Run the orchestrator with render enabled:**
   ```
   npm run video -- "<url-from-copy-json>" --seconds=30 --template=<template> --name=<slug> [--with-music] [--allow-watch] [--use-legacy] --keep-artifacts
   ```
   - URL comes from `compositions/<slug>.copy.json` `url` field.
   - Template comes from copy.json `template` field.
   - All flags from `$ARGUMENTS` after the slug pass through.

4. **Wait for completion** (~3-4 min for a typical 30s render). Capture stdout for paths.

5. **Locate the no-watermark file** in the orchestrator's output. Pattern: `renders/<project>_<ts>-graded.mp4` (NOT `-graded-wm.mp4`).

---

## What you return

```
SLUG: <slug>
TEMPLATE: <template>-<status>
VERDICT-AT-RENDER: <ship | watch (overridden) | legacy (overridden)>
RENDER: renders/<file>-graded.mp4
DURATION: <Xm Ys>
SIZE: <X.X MB>

SUMMARY: <one sentence — what was rendered, what status the template is in>

NEXT: <one of:
  "ready for user critique"
  "iterate again before locking"
  "lock as v1: tag commit + update docs/template-models.md status to locked-v1"
>
```

Max 200 words. NO ffmpeg log dump, no x264 stats, no progress bar trace — those stay in your fork and discard.

---

## Token discipline

The render produces ~5-10k tokens of stdout (stage progress, ffmpeg stats, x264 frame stats, watermark + grade output). All of that lands in your context, NONE of it should land in the parent's. Synthesize aggressively.

If render fails, return the failure mode + one-line cause + path to the error log if it exists. Don't dump the stack trace.

---

## Gotchas

- Template-status gate fires inside the orchestrator. If the template is `iterating` and `--allow-watch` is NOT passed, the orchestrator throws. Surface this clearly.
- Three MP4 files always produced: raw, graded, graded-wm. ALWAYS surface the `-graded.mp4` (no -wm) per `feedback_no_watermark`.
- After a successful render, the parent's next move is usually user critique → maybe lock-as-v1. Don't auto-lock.
