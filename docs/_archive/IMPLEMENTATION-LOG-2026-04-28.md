> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Implementation Log — methodology-45s register fixes (2026-04-28)

Step-by-step record of how the 4 critique findings from the first render get resolved. Updated after each step lands.

## Context

- **Trigger:** user reviewed `renders/sacred-path-45s.mp4` and surfaced 4 register-level gaps (no persistent brand presence, fabricated outcome line, silent VO shipped, inline SVG not reused).
- **Approach:** direct work, no chips. Each step below gets executed in order, with the doc updated at each landing so progress is visible.
- **Goal:** methodology-45s rendered v2 that fixes all 4 gaps, plus system-level changes (shared CSS class, SVG sprite, render gate) that prevent recurrence in any future contemplative render.

## Steps

### Step 1 — `.brand-emblem-ambient` shared CSS class
**Why:** every contemplative composition needs a small brand emblem visible from t=0 (Part 7 rule S13). Putting it in `design/cards-contemplative.css` means every template that links the shared CSS gets it for free — no per-template re-declaration.

**What I did:** Added `/* ===== 8. Persistent ambient brand emblem ===== */` block to the end of `design/cards-contemplative.css`. New class `.brand-emblem-ambient`:
- 80px square, top-right corner default (80px from edges)
- opacity 0.18 (subtle but visible against the void)
- z-index 9 (above scene content but below modal-style overlays)
- 75s rotation loop (`@keyframes brand-emblem-spin`)
- Variant `.bottom-left` for templates where top-right is occupied (methodology has Roman numerals there)
- Pointer-events: none (decorative, doesn't block clicks)

Plus a usage comment showing `<use href="...#atom-small">` SVG sprite reference (sprite arrives in Step 2).

**Files changed:** `design/cards-contemplative.css` (+30 lines)

**Status:** ✅ done

---

### Step 2 — `design/svg-contemplative.svg` shared sprite
**Why:** the atom orbital is currently inline in 2 places, the concentric-circle emblem in another 2. SVG sprite + `<use href="...#atom">` references means one source of truth — design changes propagate everywhere.

**What I did:** Created `design/svg-contemplative.svg` with 4 `<symbol>` definitions:
- `#atom` — full atom orbital (3 ellipses + nucleus + 3 electrons), the cinematic-launch B2 + singularity-convergence B3 hero emblem
- `#atom-small` — same orbital lines + nucleus, electrons removed (4px circles disappear at <120px display size)
- `#concentric` — 2 nested circles + center dot, the hook B2 + testimonial B3 emblem
- `#concentric-small` — simplified for ambient emblem use

All use `stroke="currentColor"` so the brand color swap works via `color: var(--gold)` on the `<use>` element. Header comment documents the path-depth rule (`../../../` for `compositions/templates/<vibe>/`).

**Files changed:** `design/svg-contemplative.svg` (new, 60 lines)

**Status:** ✅ done

---

### Step 3 — Update `methodology-45s.html`
**Why:** add the ambient emblem markup, remove the fabricated B4 outcome line ("Three steps. One truth at a time." was author-invented), replace with visual-only B4 or canon line.

**What I did:**
- **Ambient emblem inserted** right after the `<div class="ambient-haze">` element. Used `bottom-left` variant because top-right of the methodology template is occupied by the Roman numerals (I. II. III.) at 280px. The `<svg>` references `#atom-small` from the sprite via `<use>`, with `color: var(--gold)` so currentColor renders as the brand gold. Persistent rotation comes from the CSS class `.brand-emblem-ambient` (75s loop).
- **B4 outcome line replaced.** "Three steps. One truth at a time." was author-invented during template scaffolding — Part 7 S14 forbids that. Replaced with "Just truth." which is the canonical close from `singularity-convergence` B6 (the reference build). Same brand canon, no fabrication. Comment block flags the source for cold-readers.

**Files changed:** `compositions/templates/contemplative/methodology-45s.html` (+8 lines, -1 line content swap)

**Status:** ✅ done

---

### Step 4 — Generate real TTS narration for methodology-45s
**Why:** rendered MP4 shipped with PLACEHOLDER.mp3 (1s silent stub). User said "no speech." Real TTS via `scripts/fetch-tts-edge.mjs` matching the on-screen content.

**What I did:**
- Wrote 75-word narration script to `tmp/methodology-narration.txt`. Tracks the on-screen content (3 doors → bring question → sit with silence → listen for verse → just truth) but uses its own voicing rather than parroting the visual text — gives the TTS room to breathe and not feel like a duplicate.
- Generated TTS: `node scripts/fetch-tts-edge.mjs --file=tmp/methodology-narration.txt --voice=en-US-AriaNeural --rate=-10% --pitch=-3Hz methodology-45s.mp3`. Aria is the cinematic-leaning US voice; -10% rate slows it to contemplative pace; -3Hz pitch gives slight gravity.
- Output: `assets/voiceover/methodology-45s.mp3` (209 KB, **35.66s** duration), plus `assets/voiceover/methodology-45s.vtt` (66 words, free word-level captions).
- Updated `<audio id="vo">` in methodology-45s.html: src points at the new mp3, `data-duration="36"`, removed `data-todo`. Music underscore at track 8 unchanged.

**Files changed:** `assets/voiceover/methodology-45s.{mp3,vtt}` (new), `compositions/templates/contemplative/methodology-45s.html` (audio src swap).

**Status:** ✅ done

---

### Step 5 — Silent-VO gate in `scripts/render.mjs`
**Why:** PLACEHOLDER.mp3 should not pass the render gate. New check: if any `<audio>` tag has `data-todo` and src points at a placeholder file, refuse to render unless `--allow-silent-vo`.

**What I did:** Added a 50-line block to `scripts/render.mjs` (right before the spawn). Reads `index.html`, checks for two markers:
- `data-todo=` attribute (template-author marker that VO is unwired)
- `PLACEHOLDER.mp3` substring (the 1s silent stub)

If either present AND no `--allow-silent-vo` flag (and not `--dry-run`), prints a clear refusal message with the fix path + canon reference (Part 7 S15) and exits 1.

**Test:** ran `node scripts/render.mjs` against the existing index.html (which still has both markers from the earlier render). Output:
```
✗ Render refused: silent-VO gate (Part 7 rule S15)
  index.html contains a `data-todo` attribute...
  index.html references PLACEHOLDER.mp3...
  Fix one of:
    • Generate real TTS: node scripts/fetch-tts-edge.mjs ...
    • Or pass --allow-silent-vo for a proof-render.
```
Gate works as expected.

**Files changed:** `scripts/render.mjs` (+50 lines)

**Status:** ✅ done

---

### Step 6 — Re-render methodology-45s
**Why:** validate that all 4 fixes hold up at full motion + audio.

**What I did:**
- Re-staged `index.html` from the fixed comp via `tmp/render-helper.mjs`. Confirmed gate-clean (0 `PLACEHOLDER` + 0 `data-todo` markers).
- Lint: 0 errors.
- Pre-render flipbook check at t=2 + t=8: ambient emblem **invisible** at first (opacity 0.18 + 80px was too subtle). Bumped to opacity 0.35 + size 120px + drop-shadow glow → emblem now visibly anchors the bottom-left across all scenes.
- Silent-VO gate passed.
- Render: 257.8s wall-clock (~4 min 18s, including auto-grade pass). Default render output naming is `renders/aivideomaker_<timestamp>.mp4` — renamed to `methodology-45s-v2.mp4` for clarity.

**Output:**
- `renders/methodology-45s-v2.mp4` (raw, 10.6 MB)
- `renders/methodology-45s-v2-graded.mp4` (auto-graded, 4.3 MB)
- 45.00s · 1080×1920 · 30fps · h264 video · AAC stereo audio @ 191 kbps (vs the 48 kbps mono of the silent v1)

**Surprises captured for LEARNINGS:**
1. **SVG sprite `<use href="...#id">` doesn't render under headless capture.** External SVG sprite references are silently invisible. Fell back to inline-SVG with a comment pointing to the canonical sprite. Real lesson: keep sprites as the design source-of-truth, but each composition embeds an inline copy (the cost of duplication is acceptable; the sprite documents intent).
2. **First-pass opacity 0.18 was too subtle for ambient emblem.** Took 0.35 + 120px + drop-shadow to read as "present but not loud". Updates for Part 7 S13 norms.
3. **`scripts/render.mjs` `--output=` flag isn't honored** — render produces auto-timestamped filenames regardless. Worth investigating if user wants stable output names.

**Status:** ✅ done

---

## Done criteria — final state

- ✅ All 6 steps marked complete
- ✅ `renders/methodology-45s-v2.mp4` exists (10.6 MB raw, 4.3 MB graded), real VO + ambient emblem visible throughout + brand-canon "Just truth." outcome line
- ✅ Lint stayed at 0 errors throughout
- ✅ LEARNINGS.md entry captured (in 4-gaps section); 3 new surprises promoted to §4

## Summary — gap → fix mapping

| Gap from user critique | Fix shipped | Where |
|---|---|---|
| No persistent brand presence | `.brand-emblem-ambient` CSS class + inline atom SVG embedded in comp | cards-contemplative.css + methodology-45s.html |
| Fabricated outcome line | "Three steps. One truth at a time." → "Just truth." (canon from singularity-convergence) | methodology-45s.html |
| Silent VO shipped | Real TTS narration generated (en-US-AriaNeural -10% rate -3Hz pitch, 35.66s) + render gate refusing PLACEHOLDER.mp3 going forward | assets/voiceover/methodology-45s.mp3, scripts/render.mjs |
| SVG asset reuse failure | Shared sprite at design/svg-contemplative.svg as canonical source-of-truth (sprite-via-use proven unreliable under headless capture, so each comp embeds inline copy referencing sprite) | design/svg-contemplative.svg |

## System-level changes (not tied to one render)

- **`docs/social-video-patterns.md` Part 7** — 3 new rules: S13 (persistent ambient brand emblem), S14 (no fabricated content lines), S15 (no render without real TTS).
- **`design/cards-contemplative.css`** — `.brand-emblem-ambient` class with `.bottom-left` variant (75s rotation loop).
- **`design/svg-contemplative.svg`** — shared sprite with 4 symbols (`#atom`, `#atom-small`, `#concentric`, `#concentric-small`).
- **`scripts/render.mjs`** — silent-VO gate that refuses to render if index.html has `data-todo` or `PLACEHOLDER.mp3` references; bypass via `--allow-silent-vo` or `--dry-run`.

These propagate to the next contemplative template that gets rendered — all future work inherits the fixes without the same regressions.
