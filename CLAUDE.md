# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-02, end of the Runware-pipeline session

Say "let's go" and this session does the next job below. Everything below
this block is stable project rules; this block is the current briefing —
replace it wholesale next session, never keep a second.

**Verify before you trust this.** Repo state verified at handoff
(`git rev-parse HEAD` ↔ `origin/main`). Runware model facts verified
live on 2026-08-02 — see `docs/runware-models.md` and `docs/voices.md`
for the per-entry `verified` dates. Pricing was right at probe time;
re-run `npm run runware:models` to confirm nothing moved.

### Where things stand (verified 2026-08-02, end of session)
- Repo on `main` @ `e3c3b21`, pushed (local + remote heads match). Dev
  repo, nothing deployed live, nothing cron'd.
- **Full Runware pipeline built and tested end-to-end.** Audio (TTS +
  music), text (script generation), image-gen, vision judging — all
  wired, all cost-guarded by `RUNWARE_DAILY_CAP` ($2 default). Spend
  today: $0.59 across 50 calls.
- **Two BinSparkle videos shipped** (renders local-only under
  `renders/binsparkle/`): the Full Care reference (`SCRIPT-fullcare.md`,
  Luna voice — known sultry, not the recommended pick) and the
  clean-ad (`SCRIPT` lives at `videos/binsparkle/compositions/binsparkle-clean.html`,
  Aoede voice — **this is the good one**).
- **Opencode permissions widened globally** — `~/.config/opencode/opencode.json`
  now has `external_directory: { "*": "allow" }`. Takes effect on next
  opencode restart. Removes the cross-folder prompts that were blocking
  multi-repo work (e.g. reading automation-template, bin-sparkle-social).

### What to read, in order
1. `docs/skills/how-a-video-gets-made.md` — the canonical 10-stage flow
   (unchanged). Stage 3 (Copywriting) is still the highest-leverage stage.
2. `docs/runware-models.md` — the full model catalogue with verified AIR
   ids, prices, and the per-modality ladders.
3. `docs/playbooks/script-and-copy.md` — model-selection playbook for
   scripts + image captions. 8 models probed; **Anthropic dominates**.
4. `docs/voices.md` — TTS voice selection. **Locked:** Aoede (Gemini 3.1
   Flash TTS) with `language: en-AU` + transcript tags for warm-community.
5. `docs/social-media-pipeline.md` — the architecture for how assets flow
   from this repo into `bin-sparkle-social/social/` and out to platforms.

### The next job — "let's go" = do this
**Implement the social-media bridge.** Take the binsparkle-clean assets
video + 7 images + script + Aoede narration and turn them into scheduled
posts in `bin-sparkle-social/social/posts/`. Per-platform captioning
(TikTok/IG/FB/LinkedIn/X differ), one file per post under the
`<YYYY-MM-DD>-<slug>.md` convention. See `docs/social-media-pipeline.md`
for the contract.

If the user wants to iterate the video first instead, the levers are:
different voice (audition via `node scripts/preview-runware-voices.mjs`),
different images (`node scripts/fetch-image-runware.mjs` — but it doesn't
exist yet as a CLI, just the lib at `scripts/lib/runware-image.mjs`),
different script angle (re-run Opus 4.8 via the prompt template in
`docs/playbooks/script-and-copy.md`).

### Traps (all verified live this session)
1. **Render produces `yuv444p`** — only VLC plays it. Run `npm run to-yuv420 <file.mp4>`
   after every render for universal player compat. LEARNINGS §4.
2. **audio-duck volume jumps +6 dB when the bed drops out.** Loop the bed
   to >2× comp duration (see `assets/music/binsparkle-bed-looped.mp3`
   for the pattern). LEARNINGS §4.
3. **silence-detect timings drift.** Use **whisper word-level** for slide
   sync (`python scripts/_whisper_sentences.py <audio.mp3>` — currently a
   throwaway; promote to a real script if used again).
4. **Runware has no `en-NZ` voices.** Edge TTS does (`en-NZ-Molly/Mitchell`).
   For NZ brands, Edge is both cheaper (free) and more authentic. See TRAPS
   in `scripts/lib/runware-models.mjs`.
5. **Opus 4.8 is the text default, not Fable 5.** Fable 5 is 8× the cost
   for marginal gain. Fable 5 is in TRAPS.
6. **Don't edit `render.mjs`/`smoke.mjs`/`index.html`** — extend only.

### Discipline
Default every Runware call to the cheapest tier that works; escalate only
on borderline. Every call passes through the daily cap. Commit + push as
you go. Ask before any live deploy.
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
