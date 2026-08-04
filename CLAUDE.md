# HyperFrames Composition Project

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-05 (end of session, ~08:45 UTC; server time crossed Aug 4→5)

**One line:** Postiz moved to `postiz.binsparkle.nz` (done, live, both domains healthy). TikTok app fully configured BUT the OAuth connection is blocked by a scope-approval gate — that's the active job. BinSparkle content loop kept running (17 PUBLISHED / 21 QUEUE / 1 ERROR at last check).

**READ FIRST:**
1. [`docs/tiktok-oauth-blocker-2026-08-05.md`](docs/tiktok-oauth-blocker-2026-08-05.md) — the TikTok blocker diagnosis + custom-image fix plan. **Non-optional** before touching TikTok.
2. [`docs/playbooks/content-creation.md`](docs/playbooks/content-creation.md) — the 11 rules (Rule 2 timing, Rule 7 captions, Rule 10 fill-the-frame, Rule 11 ship-from-`final/`).
3. [`videos/binsparkle/posts.md`](videos/binsparkle/posts.md) — posts ledger. **Postgres is truth** — re-query.
4. [`scratch/tiktok-app-review-text.md`](scratch/tiktok-app-review-text.md) — TikTok app field values + review text (scope list **CORRECTED** this session).
5. [`automation-template/postiz.md`](../automation-template/postiz.md) — Postiz recipe + traps (updated: new domain, Threads-redirect note corrected).

**Verify before you trust this.** Figures last checked 2026-08-05 ~08:45 UTC against the live system: Postiz 307 on both `postiz.binsparkle.nz` and the old Hostinger domain; 21 QUEUE / 17 PUBLISHED / 1 ERROR posts (the ERROR row was NOT investigated this session — check it). Re-query Postgres by piping SQL over stdin (never `-c` — camelCase mangles). Counts move as posts publish.

### CORRECTIONS to the prior block (these steered us wrong — read first)
- **Do NOT drop `video.list` + `user.info.stats` from the TikTok app.** The prior block said to drop them. That is wrong: Postiz's TikTok authorize request requires **all six** scopes — `video.list, user.info.basic, video.publish, video.upload, user.info.profile, user.info.stats`. We dropped them, the OAuth failed, we added them back.
- The OAuth failure is **not** the client_key (TikTok's error page is misleading). It's that `video.list` + `user.info.stats` aren't usable until the app passes TikTok review.

### Job A — TikTok: unblock the OAuth (active)
**DONE this session:** domain `binsparkle.nz` verified on TikTok (DNS TXT in Cloudflare — covers `postiz` subdomain); app "Bin Sparkle" (App ID `7669999780248422407`, client_key `awh1d34mv4ewxvmm`) configured — Login Kit + Content Posting API (**Direct Post ON**) + Display API + Share Kit; all 6 scopes added+saved; Login Kit redirect URI = `https://postiz.binsparkle.nz/integrations/social/tiktok`; `TIKTOK_CLIENT_ID`/`TIKTOK_CLIENT_SECRET` in the Postiz compose (recreated, healthy). App status = **Draft** (not submitted).

**The blocker:** Postiz sends the 6-scope authorize URL; TikTok returns `unauthorized_client` because `video.list` + `user.info.stats` need review. Proven empirically: a 4-scope authorize URL succeeds (TikTok shows its login page), the 6-scope one fails instantly. Adding the Display API product did NOT fix it.

**The fix (next session, in order — full detail in the blocker doc):**
1. Build a **custom Postiz image** that strips `video.list` + `user.info.stats` from the TikTok scope request. The running container's code is opaque (greps for `video.list`/`tiktok`/`auth/authorize` find nothing; the backend dir PM2 reports reads empty), so get the source from the upstream `gitroomhq/postiz-app` repo, find the TikTok provider scope list, remove those two, build, point the compose at the custom image. **First spend 10 min checking whether the scope list is env/DB-configurable** before building.
2. Recreate Postiz → the 4-scope OAuth works → Add Channel → TikTok → connect `@binsparkle`.
3. ONE test post (**private/SELF_ONLY** pre-review; 5 posts/24hr cap).
4. **Record the real demo video** with ShareX (connect → compose → publish → result; domain shown must be `postiz.binsparkle.nz`). **Can't fake it** — TikTok reviewers check; a staged success can ban the app.
5. Replace the **placeholder demo video** (a stand-in BinSparkle MP4 is uploaded to the app) with the real one; fill the review explanation (text in scratch); **Submit for review**.
6. Post-review: revert to stock Postiz (all 6 scopes now approved) + public posting unlocks.

### Job B — keep building BinSparkle concepts (standing loop)
Posts run out after Aug 8. Run the loop in `content-creation.md`. **Do not repeat:** week, stages, pov, texts, reviews, invoice, before/after, tinder, say, **wanted**.

### Open items (human decisions)
1. **1 ERROR post** in the queue — check it (likely the FB identity checkpoint, error code 368).
2. **Share Kit** still added to the TikTok app but unused — remove before review.
3. **Aug 5 "bin talks" repeat** — still undecided (same joke published Aug 4 + queued Aug 5).

### Traps
1. **TikTok `unauthorized_client` = scope/approval gate, NOT the client_key.** The error page says "client_key" — misleading. The key is valid (verified by a direct authorize-URL test that returned the normal login page).
2. **Postiz's TikTok scope list is not findable in the running container** — every grep returns nothing; the PM2-reported backend dir (`/app/apps/backend`) reads empty. Source only reachable via the upstream repo / a custom build.
3. **TikTok demo video can't be faked** — record the real flow (needs the custom-image fix first).
4. **Cloudflare DNS edits need the global key** (`CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` in `automation-template/.env`) — the default `CLOUDFLARE_API_TOKEN` can't edit DNS (code 10000). Documented in `automation-template/cloudflare.md`.
5. **Postiz moved to `postiz.binsparkle.nz`** — old `postiz.srv1178347.hstgr.cloud` still routes. Meta app redirect list has BOTH domains. Compose on VPS has `TIKTOK_CLIENT_ID`/`SECRET` + a `docker-compose.yml.bak-*` backup.
6. **Browser-debug CDP jams** after many Playwright attach/detach cycles — restart Chrome: kill `.chrome-debug-profile-meta` chrome procs, relaunch with `--remote-debugging-port=9222 --user-data-dir=C:\Users\wirih\.chrome-debug-profile-meta`.
7. PowerShell → SSH → psql quoting mangles camelCase SQL — pipe over stdin from a file.
8. `video.create` scope is NOT addable in the current TikTok dashboard and Postiz doesn't request it — ignore it (old Postiz docs mention it; outdated).
9. `render:comp`/`render:still` default to `renders/<brand>/<concept>/`. Ship from `final/`. `-graded.mp4` is yuv444p (VLC-only); `-graded-yuv420.mp4` plays everywhere. `index.html` is the render entry point — lint-by-swap then `git checkout -- index.html`. Audio elements MUST have `id`.
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
