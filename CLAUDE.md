# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-03, end of session

**READ FIRST (in order):**
1. [`videos/binsparkle/MANIFEST.md`](videos/binsparkle/MANIFEST.md) — the brand state file
2. [`docs/playbooks/content-creation.md`](docs/playbooks/content-creation.md) — the 9 rules (mandatory)
3. The **tool map** below in this file — every command, asset, and playbook

**Verify before you trust this.** Postiz data was verified live at end of
session (2026-08-03 ~20:40 UTC). Repo heads confirmed pushed. Re-query
Postiz (the command is in `posts.md`) if any post state looks stale.

### What shipped this session
- **Manifest + asset catalogue + posts ledger** — the discoverability layer. 53 images vision-described. Any session can now find every asset.
- **`gen:image` + `describe:assets` + `post` commands** — one-command image generation, catalogue refresh, and posting.
- **Character toolkit: 24 transparent cut-outs** (12 clean + 12 dirty, 3 angles each) + 8 background scenes. All in `videos/binsparkle/assets/cutouts/`.
- **5 compositions** built (hero story carousel, Tinder carousel v2, "say" carousel, Tinder swipe video, speech bubble video).
- **Content creation playbook** (9 rules) + **tool map** in CLAUDE.md.
- **Postiz playbook corrected** (wrong API path `/api/public/v1` → `/public/v1`; IPv6 networking trap documented).

### Content calendar (verified against Postiz 2026-08-03)

| When (NZST) | What | Channel | State |
|---|---|---|---|
| Aug 3 (today) | Hero story carousel (8 slides) | FB + IG + Threads | ✅ PUBLISHED |
| Aug 4, 8:30am | Tinder carousel (7 slides) | FB + IG + Threads | ⏳ QUEUED |
| Aug 4, 1:30pm | "What your bin would say" carousel (7 slides) | FB + IG + Threads | ⏳ QUEUED |
| Aug 4, 6pm | Tinder swipe video (20s) | FB + IG + Threads | ⏳ QUEUED |
| Aug 5, 6pm | Speech bubble video (22s) | FB + IG + Threads | ⏳ QUEUED |

Plus 4 carousels + 1 test post from the prior session (Aug 2) — all published.

### Meta app status
Confirmed LIVE (user verified 2026-08-03). Posts are public. ✓

### Open jobs (next session)
1. **Check the Aug 4 morning carousel actually published.** It's the first scheduled post — if it didn't go out, the scheduling pipeline has a bug.
2. **Build the remaining 3 carousel concepts** ("week in the life", "stages of a dirty bin", "POV: you're a bin") — we had 5 concepts, built 2.
3. **Optimise `describe:assets`** — 53 images takes 10+ minutes. Needs parallel calls or skip-unchanged logic.
4. **Fetch more SFX** — only whoosh + ding. A pop, chime, swoosh would add polish. Use `fetch-pixabay-sfx.mjs`.
5. **Update the posts ledger** (`videos/binsparkle/posts.md`) with all scheduled posts — it's behind.

### Traps
1. Postiz API path is `/public/v1` (no `/api/`). The playbook was wrong; now corrected.
2. VPS can't reach its own public URL (IPv6). Use Docker internal IP — the `post` command handles this automatically.
3. Audio elements in compositions MUST have `id` attributes or they're silent.
4. Every render needs `to-yuv420` after.
5. The `post` command's bash script had a duplicate-post bug on first run (unclosed quote created posts before erroring). Fixed, but always check for duplicates after posting.
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
