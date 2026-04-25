# aivideomaker

A HyperFrames-based pipeline that turns a business URL into a polished MP4
promo. Brand tokens are extracted from the site, dropped into a structural
template, scored with stock footage + TTS narration, then rendered through
headless Chrome + ffmpeg with a final cinematic colour grade. Driven from
inside Claude Code — not a productionised service.

```bash
npm run video -- https://example.com
```

That single command runs the full 7-stage pipeline (brand extract → copy →
assets → music → assemble → quality gate → render) and drops a graded,
watermarked MP4 in `renders/`.

## Prerequisites

- **Node 22+** (npm 9+).
- **ffmpeg** on PATH.
  - **Windows:** `winget install Gyan.FFmpeg`. The installer updates Windows
    user PATH but a freshly-launched bash shell does NOT inherit it. Either
    re-launch the shell or `export PATH=...` per
    [LEARNINGS §2](LEARNINGS.md#2-working-setup-verified-to-work).
  - **macOS:** `brew install ffmpeg`.
- **A clone of this repo** + `npm install` (pulls `gsap`, `playwright`,
  `edge-tts-universal`, and the Anthropic Agent SDK).

## Install

```bash
git clone <repo-url> aivideomaker
cd aivideomaker
npm install
```

## Hero command

```bash
npm run video -- <https://your-url>            # 30s default
npm run video -- <url> --seconds=15            # social reel
npm run video -- <url> --template=case-study   # explicit template
npm run video -- <url> --no-render             # assemble + check, skip 5min render
```

Output: `renders/<slug>-<timestamp>-graded-wm.mp4` (graded + watermarked).
Standalone `npm run render` produces `-graded.mp4` (no watermark unless
`--watermark` is passed).

## The 7 pipeline stages

`scripts/video.mjs` orchestrates the stages below. Each prints its elapsed
time. Workers that aren't on disk yet degrade gracefully — they're skipped,
not fatal.

1. **Brand extract** — `scripts/new-comp.mjs` curls the URL, grabs palette /
   fonts / verbatim copy, writes `design/tokens-<slug>.css`.
2. **Copy generate** — `scripts/extract-copy.mjs` produces a scene-by-scene
   copy plan keyed off the structural template's beats.
3. **Asset pull** — `scripts/pull-assets.mjs` fetches stock photos / video /
   icons that match the brief (Pixabay scrape + Iconify + Unsplash if keyed).
4. **Music pick** — `scripts/pick-music.mjs` shortlists Pixabay tracks that
   fit the chosen vibe (warm-community / kinetic-pop / documentary /
   quiet-premium).
5. **Composition assemble** — picks a structural template from
   `compositions/templates/`, slots tokens + copy + assets into `index.html`.
6. **Quality gate** — `npm run check` (lint + smoke screenshot diff).
   `--auto-fix` retries with `scripts/fix.mjs`.
7. **Render** — `scripts/render.mjs` calls `npx hyperframes render`, then
   pipes the output through `scripts/post-grade.mjs` for a 3D LUT colour
   grade and (by default) a watermark.

`index.html` is restored from backup at the end via `try / finally` so the
working tree stays clean even on crash.

## Where to read next

- **[LEARNINGS.md](LEARNINGS.md)** — source of truth. §1 project overview,
  §3 patterns that work, §4 pitfalls (read first), §6 increment log.
  **Updated after every meaningful chunk of work.**
- **[CLAUDE.md](CLAUDE.md)** — project rules for any agent touching this
  repo: which skills to invoke, the `class="clip"` rule, lint discipline.
- **[docs/QUICKSTART.md](docs/QUICKSTART.md)** — deeper guide to running
  the pipeline manually, choosing templates, the iteration loop.
- **[docs/effects-catalog.html](docs/effects-catalog.html)** — visual
  reference for the **23 effect recipes** (13 primitives + 10 combos) in
  `design/modules/`. Open in any browser. Regenerate with `npm run catalog`.

## What's NOT in the repo

`renders/`, `assets/music/`, `assets/videos/`, and `assets/.cache/` are
gitignored. They're either (a) large MP4 outputs, regenerable via
`npm run video`, or (b) fetched stock binaries, regenerable via the
`scripts/fetch-*.mjs` workers. Cloning the repo gives you the pipeline,
not the past renders.

## Driven from Claude Code

This is a Claude-Code-only pipeline. Per LEARNINGS §5.5 standing directive,
it isn't a productionised tool — there's no CI, no service wrapper, no
external API. Sessions read `LEARNINGS.md` cold, work the pipeline directly
(no agent crew — those were removed 2026-04-25), and append an increment
entry to `LEARNINGS.md §6` after every meaningful chunk.
