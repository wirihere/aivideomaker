# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-04 (end of session, server time Aug 4 ~03:30 UTC / ~15:30 NZST)

**Two threads: (A) TikTok setup = the active job; (B) keep building BinSparkle concepts = the standing loop.** This session shipped a new concept ("wanted poster"), scheduled 12 posts, and **proved the auto-poster works end-to-end** — FB + IG + Threads all publishing live (Threads was the previously-unproven one). TikTok was started but is a bigger infra job, so it's the primary next job.

**READ FIRST:**
1. [`docs/playbooks/content-creation.md`](docs/playbooks/content-creation.md) — the 11 rules (Rule 2 timing, Rule 7 captions + emojis-approved, Rule 10 fill-the-frame, Rule 11 ship-from-`final/`). Non-optional.
2. [`videos/binsparkle/posts.md`](videos/binsparkle/posts.md) — posts ledger. **The Postgres DB is truth, not this file** — re-query.
3. [`automation-template/postiz.md`](../automation-template/postiz.md) — the Postiz posting recipe + traps. Read before any posting work.
4. [`scratch/tiktok-app-review-text.md`](scratch/tiktok-app-review-text.md) — the TikTok app field values + review text (saved this session).
5. The TikTok migration plan below.

**Verify before you trust this.** Scheduler proven live 2026-08-04 ~03:00 UTC: the Aug 4 batches (Tinder 08:30, bin-talks 13:30) + the earlier "week" batch all `PUBLISHED` on FB + IG + Threads with real URLs. **21 posts `QUEUE`'d through Aug 8** (dating + bin-talks-repeat + POV + wanted + texts + invoice + reviews). Re-query: pipe `scratch/verify-all-posts.sql` over SSH (pattern in posts.md). The counts move as posts publish — re-check before relying on them.

### Job A — TikTok setup (active, multi-step)
**Goal:** post to TikTok from Postiz **and** enable multiple TikTok channels (BinSparkle now, other brands later) through one verified setup. TikTok is harder than FB/IG/Threads: it pulls media by URL (`pull_by_url`) so the serving domain must be TikTok-verified, and posts are forced **private** until the app passes review (days/weeks; 5 users/24hr cap pre-audit).

**Already done by the user** (TikTok dev portal, Individual ownership, app "Bin Sparkle"): app created + Client key/secret obtained; Login Kit added; Content Posting API added (but **Direct Post NOT enabled** — only draft/upload); scopes `user.info.basic`, `user.info.profile`, `video.upload` added (+ `user.info.stats` + `video.list` which should be **dropped**). Icon generated at `videos/binsparkle/assets/brand/app-icon-1024.png`. Description + TOS/privacy ready.

**The migration, in order:**
1. **Move Postiz to `postiz.binsparkle.nz`** (so media is served from a TikTok-verifiable domain). Current `postiz.srv1178347.hstgr.cloud` can't be DNS-verified (Hostinger owns `hstgr.cloud`).
   - **Cloudflare (user):** A record `postiz` → `72.61.208.103`, DNS-only (grey cloud) first so Traefik issues its own cert.
   - **VPS `/root/postiz/docker-compose.yml`:** add ` || Host(\`postiz.binsparkle.nz\`)` to the `traefik.http.routers.postiz.rule`; change `MAIN_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_BACKEND_URL` → `https://postiz.binsparkle.nz`; `docker compose up -d postiz`.
   - **Meta app (FB/IG) + Threads app:** add `https://postiz.binsparkle.nz/integrations/social/{facebook,instagram,threads}` to their redirect URIs (existing channels keep working — tokens are stored — but reconnects need the new domain).
   - Confirm `https://postiz.binsparkle.nz` loads Postiz over HTTPS before continuing.
2. **Finish the TikTok app:** enable **Direct Post**; add `video.publish` scope; drop `user.info.stats` + `video.list`; set Login Kit redirect URI → `https://postiz.binsparkle.nz/integrations/social/tiktok`; **verify domain `binsparkle.nz`** via the DNS-record method (TikTok gives a TXT → user adds it in Cloudflare → covers all subdomains incl. `postiz`).
3. **Add `TIKTOK_CLIENT_ID` + `TIKTOK_CLIENT_SECRET`** to the Postiz compose env (user pastes them) + `docker compose up -d postiz`.
4. **Connect TikTok in Postiz** (Add Channel → TikTok → authorise `@binsparkle`). Do one test post — it'll be **private (SELF_ONLY)** until review.
5. **Record the demo video** (connect → compose → upload → publish → result) + submit for review. Public posting unlocks only after TikTok approves.
6. **Post-review:** add MORE TikTok channels (other accounts/brands) via Add Channel — all post through the same verified `postiz.binsparkle.nz`.

### Job B — keep building BinSparkle concepts (standing loop)
The library runs out after Aug 8. Run the loop in `content-creation.md`. This session's exemplar is the **wanted poster** (`videos/binsparkle/compositions/binsparkle-wanted-video.html`) — character-driven, low-word, before/after payoff. **Do not repeat these formats:** week, stages, pov, texts, reviews, invoice, before/after, tinder, say, **wanted**.

### Open items (need a human decision)
1. **Aug 5 "bin talks" repeat** — the same "if your bin could talk" joke published Aug 4 13:30 NZST AND is queued again Aug 5 18:00 (same channels). Drop the repeat or leave it? (User hasn't decided.)
2. **wanted-video frame-border overflow** — an element bleeds over the decorative frame border. User saw it, said don't fix, just avoid next time (noted in Rule 10).

### Traps (TikTok + carry-forward)
1. **TikTok `pull_by_url` needs a verified serving domain** — the whole reason for the `postiz.binsparkle.nz` migration. `postiz.srv1178347.hstgr.cloud` can't be DNS-verified.
2. **Changing Postiz `MAIN_URL`** doesn't break existing FB/IG/Threads (tokens stored), but their redirect URIs in the Meta + Threads dev apps must include the new domain for future reconnects.
3. **TikTok pre-audit = private posts** (SELF_ONLY), 5 users/24hr, accounts must be private. No public TikTok reach until review approves.
4. **TikTok demo video must show the real flow** — record AFTER connecting + a test post. Don't submit review until the video + the 1000-char explanation (draft in `scratch/tiktok-app-review-text.md`) are both ready.
5. **`render:comp` / `render:still` now default to `renders/<brand>/<concept>/`** (new this session). Ship deliverables from a `final/` subfolder (Rule 11) — the `-graded.mp4` is yuv444p (VLC-only); the `-graded-yuv420.mp4` plays everywhere.
6. **PowerShell → SSH → psql quoting mangles camelCase SQL.** Pipe SQL over stdin from a file. Never `-c`.
7. `index.html` is the render entry point — lint-by-swap then `git checkout -- index.html`. Audio elements MUST have `id` or they're silent.

### Stray artifact
`renders/binsparkle/binsparkle-beforeafter-10loops-graded-yuv420.mp4` (90s loop) — gitignored, harmless. Keep or delete.
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
