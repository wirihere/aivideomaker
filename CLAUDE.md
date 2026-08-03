# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-04 (end of session, server time Aug 3 12:06 UTC / Aug 4 00:06 NZST)

**The content-creation system is now calibrated end-to-end.** This session tuned the playbooks so a fresh session can turn a one-line concept into a carousel + video without re-deriving anything. The standing job: **keep building BinSparkle concepts in the same loop, each totally different.** The user asked for "~10 more" — run the loop ten times.

**READ FIRST (in order):**
1. [`docs/playbooks/content-creation.md`](docs/playbooks/content-creation.md) — the 9 rules. **Rule 2 and Rule 7 are the freshly-calibrated ones** (word-count holds @ 3 wps; no emojis; captions via the copy expert). Non-optional.
2. [`docs/playbooks/script-and-copy.md`](docs/playbooks/script-and-copy.md) — the copy expert (model ladder + prompt template). All scripts/captions through Claude Opus 4.8 via `textInference`, never hand-written.
3. [`videos/binsparkle/MANIFEST.md`](videos/binsparkle/MANIFEST.md) — brand, assets, compositions list.
4. The exemplars + loop below.

**Verify before you trust this.** Postiz queue re-queried live at Aug 3 12:06 UTC: **all queued posts are future-dated, none overdue.** First due is **Aug 3 20:30 UTC (Aug 4 08:30 NZST)** — re-query after that time to confirm it actually published (this is the first real test of the scheduler; a prior session flagged it). Query: pipe `scratch/verify-all-posts.sql` over SSH (command pattern in `videos/binsparkle/posts.md`). The POV video I scheduled this session is correctly queued for Aug 6 18:00 NZST across FB + IG + Threads.

### The loop — run once per concept
1. **Invent a totally-different format.** See exemplars below for what's been done — don't repeat a format.
2. **Copy via the expert:** `node scratch/gen-<name>-copy.mjs` (model it on `scratch/gen-reviews-copy.mjs`). ~$0.03/concept. Outputs the on-screen text + 3 platform captions.
3. **Build ONE composition** at `videos/binsparkle/compositions/binsparkle-<name>-video.html`. Derive **both** outputs from it: `render:still` (carousel slides — capture at each beat's hold-midpoint) + `render:comp` (video). Do not build separate carousel/video comps (they duplicate media and lint-warn).
4. **Time holds to Rule 2: word count ÷ 3 + 1s, min 4s.** **Write short for video — ≤12 words/slide.** Wordy concepts are better as carousels.
5. `npx hyperframes lint` → `render:still` + `render:comp` → `to-yuv420` (every render).
6. **Judge:** `judge:still` + `judge:video`. ⚠️ **The rubric is built for photo-ads and false-positives on UI-format pieces** (chat/reviews/invoice) — "no real bin," "text <80px," "static holds" are expected misses there. The one real gap to watch for across all formats: **no dedicated end card** (clean wordmark + CTA held ~2s).
7. Hand to the user for critique; fold findings back into the playbook.

### Exemplars — 7 concepts built this session (do not repeat these formats)
`week` (day badges + speech bubbles) · `stages` (numbered listicle, photo set) · `pov` (centered meme text) · `texts` (iMessage chat UI) · `reviews` (reviews page, bin reviews *you*) · `invoice` (printed receipt) · **`before/after`** (matched photo pair + wipe reveal — the strongest; the bin is the hero, ~8 words total). The before/after is the bar for "visual + low-word-count." Lean that way for video; save wordy concepts for carousels.

### Open jobs (next session)
1. **Build ~10 more concepts** in the loop above. Each totally different; hand each to the user for critique before the next.
2. **Formalize the copy-gen command.** It's `scratch/gen-*-copy.mjs` one-offs. Make it `npm run gen:copy` so Rule 7 points at a real command, not scratch scripts.
3. **Judge rubric needs a UI/screen mode.** Two UI-format pieces tripped the same false positives. Add a rubric variant that doesn't demand a "real bin" or ≥80px text for chat/UI content.
4. **End cards.** Add a standard clean end-card pattern (wordmark + one CTA, held ~2s) — currently missing on most pieces.
5. The `texts` / `reviews` / `invoice` videos render at the **old hold rates** (3.5–5s, pre-3wps). Fine as carousels; re-time to ÷3+1s if reviving any as video.

### Traps
1. **Hold rate is 3 words/sec + 1s** (calibrated 5→4→3 across this session — user-verified). If "too fast," drop the divisor, not the buffer.
2. **Mirelo SFX is a dead end** on this account: `mirelo:sfx@1.6` rejects the call; `mirelo:1@1` is audio-to-audio (ignores text prompts, returned a frog, $0.10/call). Logged in `scripts/lib/runware-models.mjs` TRAPS. Use the curated `assets/sfx/` or Pixabay.
3. **One composition → carousel + video.** `render-still.mjs` was built for this. Capture carousel slides at each beat's hold-midpoint.
4. **PowerShell → SSH → psql quoting mangles camelCase SQL.** Pipe SQL over stdin from a file (see `videos/binsparkle/posts.md`). Never `-c` over SSH.
5. `index.html` is the render entry point. Lint-by-swap then `git checkout -- index.html`.
6. Audio elements MUST have `id` attributes or they're silent. Every render needs `to-yuv420` after.

### Stray artifact
`renders/binsparkle/binsparkle-beforeafter-10loops-graded-yuv420.mp4` (90s, 10× seamless loop) exists from a misread of "ten loops" (the user meant 10 *concepts*, not 10 replays). Gitignored; harmless. Keep as an ambient/display asset or delete.
<!-- NEXT-SESSION:END -->

## Tool map — READ BEFORE BUILDING ANYTHING

> **The rule:** before creating any content (video, carousel, story, image post,
> sound effect), check this map. Use the tools that already exist. Read the
> playbook that covers the task. Never reinvent with external tools (ffmpeg,
> manual image editing, hand-rolled API calls) when a command or playbook
> already does it. If you find yourself reaching for something that isn't on
> this map, STOP and look harder — it probably exists.

### Commands (the tools)

| Command | What it does | When to use |
|---|---|---|
| `npm run gen:image -- --prompt="…" --out=<path>` | Generate an image via FLUX.2 dev ($0.016/social, $0.009/square) | Creating new base images, character art, backgrounds |
| `npm run describe:assets -- --dir=<folder>` | Vision-describe every image, writes `asset-catalogue.{json,md}` | After adding ANY new image to an assets folder. Not optional. |
| `npm run render:comp -- --comp=<path>` | Render a HyperFrames composition to MP4 | **Video** — animated compositions with GSAP timelines |
| `npm run render:still -- --comp=<path> --at=<times>` | Capture PNG(s) from a composition | **Static slides** — carousels, stories, image posts |
| `npm run judge:still -- --image=<path>` | Score a still against the brand rubric | QA on rendered slides |
| `npm run judge:video -- --image=<path>` | Score a video contact-sheet | QA on rendered video |
| `npm run runware:usage` | Today's Runware spend vs the $2/day cap | Before any batch of API calls |
| `npx hyperframes lint` | Validate a composition (errors + warnings) | After EVERY composition edit, before rendering |
| `npx hyperframes preview` | Preview in browser | Checking composition timing/animation interactively |

### Asset library (where things live)

| What | Where | Notes |
|---|---|---|
| **Sound effects** | `assets/sfx/` | whoosh-short.mp3 (swipe/whip transitions), ding.wav, impacts, sweeps, ticks, pads. Reusable — one file, many compositions. |
| **Music beds** | `assets/music/` | Curated shortlists per register in `assets/music-shortlists/` |
| **Voiceover output** | `assets/voiceover/` + `videos/<brand>/voiceover/` | TTS .mp3 + .vtt captions |
| **Base images** | `videos/<brand>/assets/` | Catalogued in `asset-catalogue.{json,md}` — check the catalogue, not the filenames |
| **Character cut-outs** | `videos/<brand>/assets/cutouts/` | Transparent PNGs (character art with background removed via rembg) |
| **Brand kit** | `videos/<brand>/assets/brand/` | Logo SVGs, mark variants |
| **Fonts** | `videos/<brand>/assets/fonts/` | Web font subsets |
| **Brand tokens** | `videos/<brand>/tokens.css` | Colours, font families — the single source for the look |
| **Judge rubrics** | `videos/<brand>/judge-rubrics/` | Brand-safe-zone rules, scoring criteria |
| **Design system** | `design/` | Shared CSS modules, templates, vendor (GSAP), card components |
| **Composition templates** | `compositions/templates/` | Per-archetype, per-register reference implementations |
| **Text animation patterns** | `assets/svg-animations/text-fx/` | Typewriter, cascade, underline-draw, circle-around, etc. |

### Playbooks (read the relevant one BEFORE building)

| Playbook | Covers | Read before |
|---|---|---|
| `docs/playbooks/composition-assembly.md` | Every video archetype's layout, timing, animation, audio | Building ANY video composition |
| `docs/playbooks/transitions.md` | Scene transitions: whip+whoosh, cross-dissolve, color wash, match cut | Adding transitions between scenes |
| `docs/playbooks/image-generation.md` | FLUX.2 dev model, gen:image CLI, character-set consistency, the generate→describe→commit workflow | Generating new images |
| `docs/playbooks/content-creation.md` | **The 9 rules.** Hold times, lint checks, character design, captions, cut-outs, posting. Learned the hard way — follow every time. | Before creating ANY content |
| `docs/playbooks/script-and-copy.md` | Copywriting process, model selection, A/B testing | Writing scripts, captions, ad copy |
| `docs/playbooks/music.md` | Music selection per register | Choosing background music |
| `docs/playbooks/cards-library.md` | Card component patterns | Building card-based layouts |
| `docs/playbooks/atmospheric-polish.md` | Polish: grain, vignette, ambient layers | Final visual polish pass |
| `docs/skills/how-a-video-gets-made.md` | The full 10-stage process from URL to MP4 | The founding process doc — read first if new |

### The decision tree: "how do I make X?"

| I want to make… | Use this | Read this playbook first |
|---|---|---|
| A **video** (animated, with sound) | HyperFrames composition + `render:comp` | `composition-assembly.md` + `transitions.md` |
| A **carousel** (swipeable static slides) | HyperFrames composition + `render:still` per slide | Check brand manifest §7 |
| A **story** (single 9:16 frame) | HyperFrames composition + `render:still` | Check brand manifest §7 |
| A **single image post** | Pick from catalogue + overlay text in composition + `render:still` | Check brand manifest §7 |
| A **new base image** | `gen:image` | `image-generation.md` |
| **Sound effects** | Check `assets/sfx/` first. Fetch new via `fetch-pixabay-sfx.mjs` | `transitions.md` (whoosh setup) |
| **Music** | Check `assets/music/` + shortlists. Fetch via `fetch-pixabay-music.mjs` or Runware `ace-step` | `music.md` |
| **Voiceover** | Edge TTS (`fetch-tts-edge.mjs`) or Runware TTS | `voices.md` |

### Before you reach for ffmpeg

**Stop.** ffmpeg is used INSIDE the pipeline (render:comp, to-yuv420, audio mixing) — it is not a content-creation tool. If you're about to write an ffmpeg command to create a video, transition, or effect, you should be building a HyperFrames composition instead. The composition handles animation, audio, and rendering. ffmpeg is the engine, not the steering wheel.

### Defaults that prevent rework

- **Slide hold time: 2.5s minimum.** Shorter and the viewer can't read the text. Vary it (2.4–3.5s) so it doesn't feel mechanical. The composition-assembly playbook has per-archetype timing guidance — read it.
- **Audio elements MUST have `id` attributes.** The HyperFrames renderer requires `id` to discover media elements. Without it, the audio is SILENT and the linter will warn. Always check lint warnings before rendering.
- **Every composition needs `data-start="0"` and `data-duration="<total>"` on the root element.** Without them the runtime may infer wrong values.
- **Run `to-yuv420` after every render.** The graded output is `yuv444p` which only VLC plays. The `-yuv420` variant plays everywhere.

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
