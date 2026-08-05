# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-05 (end of session, ~23:55 UTC; NZ ~noon Aug 5)

**One line:** TikTok is unblocked + connected + the app is **submitted for review**. Posting works pre-review via the Sandbox key + `UPLOAD` (inbox → manual phone publish). Two temporary Postiz patches are live (revert after approval). A ntfy notify-on-publish cron + 6 scheduled TikTok posts (NZ Aug 6–8, 9am+6pm) are in place. **Open: the ntfy phone-buzz isn't sounding** (messages arrive silent).

**READ FIRST:**
1. [`../automation-template/social-tiktok.md`](../automation-template/social-tiktok.md) — **canonical TikTok playbook** (root cause, Sandbox setup, posting, instance state, traps). Its "This instance — current state" is the detail.
2. [`docs/tiktok-oauth-blocker-2026-08-05.md`](docs/tiktok-oauth-blocker-2026-08-05.md) — evidence trail (top banner = corrected diagnosis; below it = the disproven scope theory, kept for trail only).
3. [`docs/playbooks/content-creation.md`](docs/playbooks/content-creation.md) + [`videos/binsparkle/posts.md`](videos/binsparkle/posts.md) — content loop + ledger. **Postgres is truth — re-query.**

**Verify before you trust this.** Server-side figures re-checked 2026-08-05 ~23:55 UTC against the live VPS: Postiz 307 / v1.47.0 / backend pid 240; compose `TIKTOK_CLIENT_ID` = sandbox key `sbawae2jpslc09lcum`; `contentPostingMethod()` returns `'UPLOAD'` (patched, `*.bak-upload` backup); TikTok Integration `binsparkle` connected, disabled=f, token exp ~2026-08-05 19:04 UTC (auto-refresh); 6 TikTok posts QUEUE, first 2026-08-05 21:00 UTC (NZ Aug 6 09:00); ntfy cron `*/10 * * * * /root/tiktok-notify.sh` installed, `/root/.ntfy-env` + `/root/tiktok-notify.sh` present. **App "In review" was verified at submission (~2026-08-04 23:43 UTC) via the portal only** — re-check the portal (not the DB). **The notify cron has NOT yet fired on a real publish** (first one hours away) — confirm it pings when the 21:00 UTC post lands, and that the phone actually sounds (see Open #1).

### Open items (human decisions)
1. **ntfy phone buzz (UNRESOLVED)** — messages arrive in the ntfy app but the phone doesn't sound; server→ntfy publish returns 200. Likely the per-topic notification-sound setting in the ntfy app or a silenced Android channel. Topic `binsparkle-tiktok-83d7ee36f01440ec` @ `ntfy.srv1178347.hstgr.cloud`. Test: `. /root/.ntfy-env; curl -H "Authorization: Bearer $NTFY_TOKEN" -H "Priority: 5" -d test "$NTFY_SERVER/$NTFY_TOPIC"`.
2. **TikTok review** — waiting on TikTok (days–weeks). On approval: (a) revert the UPLOAD patch (`docker compose up -d --force-recreate postiz`, or restore `tiktok.provider.js` from `*.bak-upload`), (b) swap Postiz `TIKTOK_CLIENT_ID/SECRET` back to Production (`awh1d34mv4ewxvmm` + Production secret), → posts then use `DIRECT_POST` (fully automatic, no phone step, no 5/24h cap).
3. **Stray TikTok test posts** in Postiz (junk "sadfffds"; a couple ERROR'd on DIRECT_POST) — optional cleanup; re-query the `Post` table for the tiktok integration.
4. **BinSparkle content loop** — FB/IG/Threads posts run out after Aug 8; TikTok now also scheduled Aug 6–8. Run `content-creation.md` to extend.

### What was NOT done / why
- Did NOT verify the notify cron end-to-end (first scheduled publish is hours away).
- Did NOT remove the unused Display API product (review already submitted; harmless).
- Did NOT clean the stray TikTok test posts (Open #3).

### Traps (TikTok-specific; general rules in ship-safely/rules/core.md)
1. **The "scopes"/"custom-image" theory was WRONG.** Pre-review, 4-scope and 6-scope authorize URLs fail identically (`unauthorized_client`/`error_type=client_key`). Real cause: app Draft → Production key refused → **Sandbox** is the only pre-review path. Ignore any old note saying drop scopes or build a custom image.
2. **Pre-review posting:** `DIRECT_POST` blocked ("App not approved for public posting"); `UPLOAD` → inbox draft → owner publishes from TikTok app within 24h; **5 pending/24h** cap. Postiz is patched to default `UPLOAD` until approved (revert → Open #2).
3. **Postiz v1.47.0:** Public API base is **`/api/public/v1`** (old `/public/v1` → 307 /auth). TikTok post DTO needs the full settings object + media as `{id,path}` + a `date`.
4. **Postiz backend runs OUTSIDE PM2** (parent → container PID 1). `pm2 restart` is useless; use `docker restart postiz` (keeps patches) or `docker compose up -d --force-recreate postiz` (wipes patches → stock).
5. **Two temporary Postiz patches live** (revert after approval): `contentPostingMethod()→'UPLOAD'` in both `tiktok.provider.js` (+ `*.bak-upload`), and Sandbox creds in the compose. The earlier 4-scope patch was reverted (stock 6-scope now).
6. **ntfy self-hosted** @ `ntfy.srv1178347.hstgr.cloud`; topic `binsparkle-tiktok-83d7ee36f01440ec`; token in `/root/.ntfy-env` (from `automation-template/.env` `NTFY_TOKEN_BINSPARKLE`); notifier `/root/tiktok-notify.sh` + cron `*/10` (queries Postiz for TikTok PUBLISHED + releaseId='missing' in last 25 min, dedupes via `/root/tiktok-notified.txt`).
7. **PowerShell→SSH→psql** mangles camelCase SQL — pipe over stdin. **PowerShell→SSH→bash** mangles quoting — pipe the script over stdin.
8. **TikTok portal is a React SPA** — fiddly to drive blind (chip inputs, the Sandbox "Clone from Production" checkbox). CDP `Page.captureScreenshot` works; `startScreencast` is change-based (useless on static pages).
9. **VPS reaches `postiz.binsparkle.nz`** (DNS-only A, IPv4) but NOT the old `postiz.srv1178347.hstgr.cloud` (IPv6 loopback fail). ntfy is still on the old `srv1178347` domain and works.
10. `render:comp`/`render:still` ship from `final/`; `-graded.mp4`=yuv444p (VLC-only), use `-yuv420`. Cloudflare DNS edits need the global key, not the default token.
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
