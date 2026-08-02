# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-03

**READ FIRST:** [`videos/binsparkle/MANIFEST.md`](videos/binsparkle/MANIFEST.md)
— the running source-of-truth for everything BinSparkle. Assets, compositions,
renders, posts ledger, vision tooling, traps, open threads. Every section has a
`verified` date; re-check before relying on any line older than a week.

This block is the current briefing only — replace it wholesale next session,
never keep a second. The stable detail lives in the manifest.

### Verify before you trust this
- Repo heads: `git rev-parse HEAD` ↔ `origin/main` (push isn't always automatic).
- Runware pricing: `npm run runware:models` and the `verified` dates in `docs/runware-models.md`.
- The manifest's own `verified` dates — if old, re-check against the real system.

### The architecture decision (still in force)
**Everything content lives in THIS repo (aivideomaker). One spot.** The brand
manifest, asset catalogue, posts ledger, and all scripts are here under
`videos/binsparkle/`. Do not spread content across folders.
- `bin-sparkle-social` — NOT used. `docs/social-media-pipeline.md` here is obsolete.
- `bin-sparkle` (the live website repo) — NOT touched for content; brand kit copied in.
- `autonomous-runner` — separate, reusable cron. Out of scope until unattended runs are wanted.

### What got built this session (2026-08-03)
- **Project manifest** at `videos/binsparkle/MANIFEST.md` — the one file a fresh session reads.
- **Asset catalogue** at `videos/binsparkle/assets/asset-catalogue.{json,md}` — all 14 images vision-described (subject, mood, colours, alt text, suggested uses). Refresh with `npm run describe:assets -- --dir=videos/binsparkle/assets`.
- **Posts ledger** at `videos/binsparkle/posts.md` — populated from the Postiz Postgres DB. Found **4 carousel posts + 1 test post** the prior session made on 2026-08-02 and never recorded. The query to re-verify is in the ledger.
- **`describe:assets` command** (`scripts/describe-assets.mjs`) — reusable vision-describer for any folder, cost-capped.

### The next job — three funny stories
1. **Make 3 stories (9:16, 1080×1920) using the existing image set** — the
   `clean-*` and/or `0X_*` images, or the carousel slides already on Postiz.
   Funny tone. Pick images from the catalogue's `good_for` column.
2. **Bump the text size slightly on the carousel slides** for mobile
   readability (the user's feedback on the 4 carousels posted 2026-08-02).
   The slide images live on the Postiz VPS — pull them down if the source
   template isn't in this repo.

Defer until needed: the `render:carousel` engine (the 4 carousels were made
without it), the Full Care image set, the customer-ad re-record.

### Discipline
Cheapest Runware tier that works; escalate only on borderline; every call under
the $2/day cap (`npm run runware:usage` to check). Commit + push as you go.
**Ask before any live post or deploy.**

### Traps (full list in the manifest §9)
1. Render outputs `yuv444p` → `npm run to-yuv420 <mp4>` after every render.
2. `voiceover/binsparkle-recruit-music.mp3` is NOT music — it's spoken VO.
3. Runware has no `en-NZ` voices → Edge TTS `en-NZ-MollyNeural` for NZ.
4. Runware vision = `textInference` + image (NOT the `caption` task).
5. Don't edit `render.mjs`/`smoke.mjs`/`index.html` — extend only. Brand stuff → `videos/<brand>/`.
<!-- NEXT-SESSION:END -->

## Read first, every video task

**Founding doc:** [`docs/skills/how-a-video-gets-made.md`](docs/skills/how-a-video-gets-made.md)

This is the canonical 10-stage flow from a brand URL to a finished MP4. The doc itself is slim — it links out to companion docs at each stage. **Read it first.** Don't skip stages, don't substitute it with older process docs (they're in `docs/_archive/` and are superseded).

The most important stage is **Stage 3 (Copywriting)** — Jobs A/B/C/D + 6-question rubric + A/B inner loop + scrape-first rule. Skipping Stage 3 is the recurring failure mode.

## Where things live

**Project layout:** [`STRUCTURE.md`](STRUCTURE.md) — the predictable file/folder pattern. If you can't find something, check this. If you create something new, put it where the pattern says (per-brand stuff → `videos/<brand>/`; shared stuff → `assets/`, `design/`, `compositions/templates/`).

## Skills — USE THESE FIRST

**Always invoke the relevant skill before writing or modifying compositions.** Skills encode framework-specific patterns (e.g., `window.__timelines` registration, `data-*` attribute semantics, shader-compatible CSS rules) that are NOT in generic web docs. Skipping them produces broken compositions.

| Skill                      | Command                   | When to use                                                                                       |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| **hyperframes**            | `/hyperframes`            | Creating or editing HTML compositions, captions, TTS, audio-reactive animation, marker highlights |
| **hyperframes-cli**        | `/hyperframes-cli`        | CLI commands: init, lint, preview, render, transcribe, tts                                        |
| **hyperframes-registry**   | `/hyperframes-registry`   | Installing blocks and components via `hyperframes add`                                            |
| **website-to-hyperframes** | `/website-to-hyperframes` | Capturing a URL and turning it into a video — full website-to-video pipeline                      |
| **gsap**                   | `/gsap`                   | GSAP animations for HyperFrames — tweens, timelines, easing, performance                          |

> **Skills not available?** Ask the user to run `npx hyperframes skills` and restart their
> agent session, or install manually: `npx skills add heygen-com/hyperframes`.

## Commands

```bash
npx hyperframes preview          # preview in browser (studio editor)
npx hyperframes render       # render to MP4
npx hyperframes lint         # validate compositions (errors + warnings)
npx hyperframes lint --verbose  # include info-level findings
npx hyperframes lint --json     # machine-readable output for CI
npx hyperframes docs <topic> # reference docs in terminal
```

## Documentation

**For quick reference**, use the local CLI docs command (no network required):

```bash
npx hyperframes docs <topic>
```

Topics: `data-attributes`, `gsap`, `compositions`, `rendering`, `examples`, `troubleshooting`

**For full documentation**, discover pages via the machine-readable index — do NOT guess URLs:

```
https://hyperframes.heygen.com/llms.txt
```

## Project Structure

- `index.html` — main composition (root timeline)
- `compositions/` — sub-compositions referenced via `data-composition-src`
- `meta.json` — project metadata (id, name)
- `transcript.json` — whisper word-level transcript (if generated)

## Linting — ALWAYS RUN AFTER CHANGES

After creating or editing any `.html` composition, **always** run the linter before considering the task complete:

```bash
npx hyperframes lint
```

Fix all errors before presenting the result. Warnings are informational and usually safe to ignore.

## Key Rules

1. Every timed element needs `data-start`, `data-duration`, and `data-track-index`
2. Elements with timing **MUST** have `class="clip"` — the framework uses this for visibility control
3. Timelines must be paused and registered on `window.__timelines`:
   ```js
   window.__timelines = window.__timelines || {};
   window.__timelines["composition-id"] = gsap.timeline({ paused: true });
   ```
4. Videos use `muted` with a separate `<audio>` element for the audio track
5. Sub-compositions use `data-composition-src="compositions/file.html"` to reference other HTML files
6. Only deterministic logic — no `Date.now()`, no `Math.random()`, no network fetches
