# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-07, end of session (~11:35 UTC; NZ ~11:35pm Aug 7)

**One line:** Bin Sparkle social posting now runs through **Zernio** — TikTok AND LinkedIn both connected, posting proven for both. Postiz TikTok fully removed. LinkedIn Company Page (id `139354212`) is up with About saved; cover + Bin Day job listing built, waiting on the user to upload/post.

**Two repos touched this session:** `aivideomaker` (scripts, brand assets, this file) and `automation-template` (`zernio.md`, superseded `social-tiktok.md`, README, vision section in `playwright-long-session.md`). `zernio-docs/` (holds the API key) is NOT a git repo.

**Verify before you trust this** (figures re-checked 2026-08-07 ~11:34 UTC against the live APIs):
- `GET https://zernio.com/api/v1/accounts/health` (key in `../zernio-docs/.env`) → tiktok `binsparkle` + linkedin `Bin Sparkle`, both `canPost:true`. IDs: tiktok `6a75223cd0fe733d1ae1e045`, linkedin `6a757a4bd0fe733d1aef10f0`.
- `GET /v1/posts?limit=10` → tiktok `…7b7b` published; **tiktok `…dadc` + `…486e` still SCHEDULED** (fire NZ Aug 8 9am + 6pm) — had NOT fired at handoff; scheduled path still unproven. linkedin `…f044` published.
- Postiz (VPS ssh + psql): tiktok `disabled=t`; compose `TIKTOK_CLIENT_ID=awh1d34mv4ewxvmm` (Production, reverted); container healthy. (FB/IG/Threads `disabled=f`, carried forward — not re-checked this session.)

### Commands
- **`npm run post:zernio -- --config=<json>`** — posts TikTok OR LinkedIn. Config `{ platform:"tiktok"|"linkedin", caption, media?, schedule:"now"|"YYYY-MM-DDTHH:mm:ss", timezone }`. LinkedIn media is optional (text posts work). How-to: `../automation-template/zernio.md`.
- **`npm run look -- <screenshot.png> "<question>"`** — vision via Runware (~$0.002/look). Use it to read any screenshot/UI (the running model has no image input).

### Next jobs (in order)
1. **Confirm the 2 scheduled TikTok posts fired** (NZ Aug 8 9am + 6pm). The single most important check — scheduled Zernio posting is otherwise unproven.
2. **Finish the LinkedIn page** (manual, user is doing): upload cover (`linkedin-cover-4200x700.png` / Desktop `linkedin-cover.png`; editable source `videos/binsparkle/assets/brand/linkedin-cover.html` + `scripts/render-linkedin-cover.mjs`), set Location (Hamilton, NZ — the country dropdown won't accept Playwright clicks, do it by hand), logo (`…/brand/app-icon-1024.png`), Custom button → Visit website, Specialties.
3. **Post the Bin Day job listing when ready** (held at `videos/binsparkle/linkedin/bin-day-job-listing.md`) → page Jobs tab (free). Scoped to Hamilton for now.
4. **Write the Bin Sparkle LinkedIn playbook** — the content research (2 audiences, PDF carousels, Tue/Thu ~11am NZ, recruitment pitch = keep 75%/$0/weekly) is in this session's conversation, not yet written down.

### Open / held
- Stale ntfy `tiktok-notify.sh` cron on the VPS (watched Postiz TikTok) — dead; remove or repoint at a Zernio webhook.
- Move `ZERNIO_API_KEY` to `../automation-template/.env` (creds convention).
- TikTok app "In review" in the portal — moot now (using Zernio's app).
- FB/IG/Threads still post via Postiz (`npm run post`); content runs out after Aug 8.

### Traps
1. **LinkedIn cover = 4200×700** (min AND recommended, 6:1). The old 1128×191 / 2256×382 are BELOW the minimum and get rejected — that stale trap in `social-tiktok.md` is now corrected.
2. **LinkedIn: links in the body cut reach** (put URL in first comment); native text/image/PDF-carousel posts; best Tue–Thu ~11am–1pm NZ.
3. **No vision in this opencode config** (glm-5.2, no image input) — use `npm run look` for screenshots.
4. (carried) Zernio pulls media from a public URL; `tiktokSettings` at top level; Postiz API base `/public/v1` (internal IP) vs `/api/public/v1` (public); `pm2 restart` useless on Postiz; PowerShell→SSH quoting → pipe over stdin.
5. **TikTok-via-Postiz is HISTORY** — the Sandbox/UPLOAD saga in `social-tiktok.md` (superseded) + `docs/tiktok-oauth-blocker-2026-08-05.md`. Don't follow those steps.
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
