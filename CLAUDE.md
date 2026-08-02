# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-02, consolidation decision

Say "let's go" and this session does the next job below. Everything below this
block is stable project rules; this block is the current briefing — replace it
wholesale next session, never keep a second.

**Verify before you trust this.** Runware facts were verified live by the prior
session (2026-08-02) — see the per-entry `verified` dates in `docs/runware-models.md`
and `docs/voices.md`; re-run `npm run runware:models` to confirm pricing hasn't
moved. The "Local Client Finder is on Postiz" fact was verified live by an
earlier session (a test post landed, id `…1307860914890937`). Repo heads: verify
with `git rev-parse HEAD` ↔ `origin/main`.

### The architecture decision (NEW — overrides the prior multi-folder plan)
**Everything content lives in THIS repo (aivideomaker). One spot.** Carousel
engine, post files, posting — all here. The user wants no folder-hopping.
- **`bin-sparkle-social` is NOT used.** The prior session's
  `docs/social-media-pipeline.md` proposed it as a "distributor" layer — **that
  doc is now obsolete**; correct it to this one-repo model or move it to `_archive/`.
- **`bin-sparkle` (the live website repo) is NOT touched** for content — the
  brand kit was already copied into `videos/binsparkle/assets/brand/`.
- **The cron (`autonomous-runner`) stays separate** — a reusable timer, not daily
  work. Wire it up only when unattended runs are wanted. Out of scope for now.

### Already built + working (verified by prior session, 2026-08-02)
- **Full Runware pipeline** — audio (TTS + music), text (scripts), image-gen,
  vision judging; cost-guarded (`RUNWARE_DAILY_CAP`, $2 default). Catalogue in
  `docs/runware-models.md`; voices in `docs/voices.md`; scripts in `docs/playbooks/script-and-copy.md`.
- **Two BinSparkle videos** rendered (local, `renders/binsparkle/`): Full Care
  (Luna voice — not the pick) and **clean-ad `binsparkle-clean.html`, Aoede voice
  — the good one**.
- **Vision judge + cost guard + still renderer** (earlier session): `judge:still`,
  `judge:video`, `render:still`, `render:comp --judge`, `runware:usage`.
- **Opencode global permissions widened** (`external_directory: allow`) — needs an
  opencode restart to take effect.

### The next job — "let's go" = build the carousel engine, post the first one to LCF
1. **Central content layer here.** Add `social/binsparkle/` (`decks/`, `posts/`,
   `copy/`, `sources/`). Brand kit stays at `videos/binsparkle/assets/brand/` +
   `tokens.css`; both video and social pull from it.
2. **Carousel engine.** Branded slide template + `render:carousel --deck=…` that
   renders each slide as a PNG (**image-set format** — covers IG/FB/TikTok/
   LinkedIn; **no PDF for now**). Reuse the still-renderer machinery (static
   server + Playwright + brand tokens). Seed with the 7 AI backgrounds + Claire's
   real photos (the only real set — pull from the `bin-sparkle` repo).
3. **First post → Local Client Finder (FB) via Postiz.** LCF is a connected
   Postiz channel (verified). **First step: verify Postiz supports multi-image/
   carousel posts**; if not, fall back to an album or a single hero image. **Ask
   the user before the post actually goes live** (it's a public action).
4. **Correct `docs/social-media-pipeline.md`** to the one-repo model (or archive it).

### Reuse principle (the whole point)
One source → many outputs. The same brand kit + backgrounds + copy become carousel
slides, a hero still, video beats, captions. The engine takes any image, so when
real job photos start flowing they drop into `sources/` with no rebuild.

### Traps (verified live in prior sessions)
1. Render outputs `yuv444p` (only VLC plays it) → `npm run to-yuv420 <mp4>` after every render.
2. `audio-duck` jumps +6 dB when the bed drops out → loop the bed to >2× comp duration.
3. Runware has no `en-NZ` voices → Edge TTS (`en-NZ-Molly/Mitchell`) is cheaper + more authentic for NZ.
4. Opus 4.8 is the text default, not Fable 5 (8× cost, marginal gain).
5. Runware vision = `textInference` + image (NOT the `caption` task); model id = AIR `creator:family@version`.
6. Don't edit `render.mjs`/`smoke.mjs`/`index.html` — extend only. Brand stuff → `videos/<brand>/`.

### Discipline
Cheapest Runware tier that works; escalate only on borderline; every call under
the daily cap. Commit + push as you go. **Ask before any live post or deploy.**
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
