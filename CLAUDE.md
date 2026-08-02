# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-02, end of session

Say "let's go" and this session does the four jobs below, in order. Everything
below this block is the stable project rules; this block is the current briefing
— replace it wholesale next session, never keep a second.

**Verify before you trust this.** Runware facts here were checked live on
2026-08-02. Audio/music model details are NOT verified yet — research each from
runware.ai docs before relying on it. Some doc pages list models not live on the
account (Qwen2.5-VL was that trap this session); probe with a real call first.

### Where things stand (verified 2026-08-02)
- Repo on `main` @ `766c861`, pushed (local + remote heads match). Nothing
  deployed live (dev repo); nothing cron'd. No concurrent commits observed.
- This session built the content factory + Runware vision judge, all additive
  (`render.mjs`/`smoke.mjs`/`index.html` untouched): `render:still`,
  `render:comp` (opt `--judge`), `judge:still`, `judge:video`, `runware:usage`.
  All tested live against real binsparkle assets.
- **Runware vision = `textInference` + OpenAI-style multimodal content** (NOT
  the `caption` task — that's legacy and most vision models reject it). Endpoint
  `https://api.runware.ai/v1`, `Authorization: Bearer $RUNWARE_API_KEY`, body =
  array of tasks. Model id = AIR `creator:family@version` (NOT the dashed slug).
- Cheap vision that works: **`openai:gpt@5-mini`** (~$0.0004 simple / ~$0.002–
  0.005 per rubric judge). `google:nano-banana@*` only does `caption`.
  `alibaba-qwen2-5-vl-*` is NOT live on the account. Key in
  `automation-template/.env` → `RUNWARE_API_KEY`. Daily cap $2
  (`RUNWARE_DAILY_CAP`); spend tracker at `.runware-usage.json` (gitignored).

### The next four jobs — "let's go" = do these, in order
1. **Runware model chooser + catalogue.** Add `scripts/lib/runware-models.mjs`
   (a `modelSearch` wrapper — proven this session) + `npm run runware:models`
   reporter, and a `docs/runware-models.md` catalogue: per modality (image-gen /
   vision / text / TTS / music / video) list AIR id, price, capability, and
   "best-for / avoid-for". Goal: given a task, return the cheapest suitable model
   id. **Self-research** each model via modelSearch + its
   `runware.ai/docs/models/<slug>.md` page — don't guess params.
2. **Audio expert playbook.** Research Runware's TTS + music models from the docs
   (voice ids, pacing/emotion, output format for TTS; style/tempo/duration/seed
   for music) and write it up. Shared home: `automation-template/runware.md`.
   Mark each fact with the date you verified it against the docs.
3. **Music bed generation.** Pick a music model from job 2; generate a BinSparkle
   brand-aligned bed (warm, upbeat, not cheesy, loopable ~30s); drop into
   `assets/music/`; set as a default bed option.
4. **Narration + music blend.** Route generated narration (TTS) + the bed through
   the existing `scripts/audio-duck.mjs` (spec in LEARNINGS + rule R6: VO −6 dB
   above bed, bed −18 to −14 LUFS). Output a final mix a composition can use.
   Verify the mix by rendering a short test and inspecting peaks (you can't see
   audio levels — don't claim it sounds right without checking).

**Discipline.** Default every call to the cheapest model that works; escalate
only on borderline; every call passes through the existing daily-cap guard.
Verify each audio/music model works on the account before trusting it. Commit +
push as you go (backups). Ask before any live deploy.

**Traps.** (a) `caption` task ≠ vision-qa — use `textInference`+image. (b) Model
id = AIR `creator:family@version`, not the dashed doc slug. (c) Some doc pages
list models not live on the account — probe before relying. (d) Don't edit
`render.mjs`/`smoke.mjs`/`index.html` — extend only. (e) Brand stuff →
`videos/<brand>/`; shared → `assets/`/`design/`/`scripts/`.
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
